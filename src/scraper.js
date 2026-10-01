const cheerio = require('cheerio');
const { fetchPage } = require('./browser');
const { parseValue } = require('./currency');
const { mapPosition } = require('./positions');

const BASE_URL = 'https://www.transfermarkt.com';

// Busca times pelo nome
async function searchTeam(query) {
  const url = `${BASE_URL}/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(query)}&Verein_page=0`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const teams = [];
  $('table.items').first().find('tbody tr').each((_, row) => {
    const $row = $(row);
    const nameEl = $row.find('td.hauptlink a').first();
    const name = nameEl.text().trim();
    const href = nameEl.attr('href');
    if (!name || !href) return;

    const idMatch = href.match(/\/(\d+)$/);
    const leagueEl = $row.find('td').eq(3);

    teams.push({
      id: idMatch ? idMatch[1] : null,
      name,
      slug: href.split('/')[1] || null,
      league: leagueEl.text().trim() || null,
      url: `${BASE_URL}${href}`,
    });
  });

  return teams;
}

// Busca o plantel completo de um time pelo slug e id
async function getSquad(teamSlug, teamId) {
  const url = `${BASE_URL}/${teamSlug}/kader/verein/${teamId}/saison_id/2024/plus/1`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  // Info do time
  const teamName = $('h1.data-header__headline-wrapper--main').text().trim() ||
                   $('[class*="headline"]').first().text().trim();
  const leagueName = $('span[itemprop="name"]').first().text().trim();
  const country = $('img.flagge').attr('title') || null;

  const players = [];
  const rows = $('table.items tbody tr.odd, table.items tbody tr.even');

  for (const row of rows.toArray()) {
    const $row = $(row);

    // Nome
    const nameEl = $row.find('td.posrela table.inline-table td.hauptlink a').first();
    const name = nameEl.text().trim();
    if (!name) continue;

    const playerHref = nameEl.attr('href') || '';
    const playerIdMatch = playerHref.match(/\/(\d+)$/);
    const playerId = playerIdMatch ? playerIdMatch[1] : null;

    // Posição
    const positionRaw = $row.find('td.posrela table.inline-table tr').eq(1).find('td').text().trim();
    const position = mapPosition(positionRaw);

    // Número da camisa
    const number = $row.find('div.rn_nummer').text().trim() || null;

    // Nacionalidade
    const nationality = $row.find('td.zentriert img.flagge').map((_, el) => $(el).attr('title')).get();

    // Data de nascimento e idade
    const dobText = $row.find('td.zentriert').eq(1).text().trim();
    const ageMatch = dobText.match(/\((\d+)\)/);
    const age = ageMatch ? parseInt(ageMatch[1]) : null;
    const dob = dobText.replace(/\s*\(\d+\)/, '').trim() || null;

    // Altura
    const height = $row.find('td.zentriert').eq(3).text().trim().replace(',', '.') || null;

    // Pé preferido
    const foot = $row.find('td.zentriert').eq(4).text().trim() || null;

    // Data de início do contrato
    const contractFrom = $row.find('td.zentriert').eq(5).text().trim() || null;

    // Data de fim do contrato
    const contractUntil = $row.find('td.zentriert').eq(6).text().trim() || null;

    // Valor de mercado
    const valueRaw = $row.find('td.rechts.hauptlink a').text().trim() ||
                     $row.find('td.rechts').last().text().trim();
    const marketValue = await parseValue(valueRaw);

    // Foto
    const photoUrl = $row.find('td.posrela img').attr('data-src') ||
                     $row.find('td.posrela img').attr('src') || null;

    players.push({
      id: playerId,
      name,
      shirt_number: number ? parseInt(number) : null,
      position_raw: positionRaw || null,
      position_code: position.code,
      position_label: position.label,
      age,
      date_of_birth: dob,
      height_cm: height ? parseFloat(height.replace('m', '').trim()) * 100 : null,
      foot: foot || null,
      nationality,
      contract_from: contractFrom || null,
      contract_until: contractUntil || null,
      market_value: marketValue,
      photo: photoUrl,
      profile_url: playerId ? `${BASE_URL}${playerHref}` : null,
    });
  }

  return {
    team: {
      id: teamId,
      slug: teamSlug,
      name: teamName,
      league: leagueName,
      country,
      squad_url: url,
    },
    total_players: players.length,
    players,
  };
}

// Busca detalhes individuais de um jogador
async function getPlayerDetails(playerSlug, playerId) {
  const url = `${BASE_URL}/${playerSlug}/profil/spieler/${playerId}`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const name = $('h1[itemprop="name"]').text().trim() ||
               $('h1.data-header__headline-wrapper--main').text().trim();

  const infoRows = {};
  $('.info-table__content--regular, .info-table span').each((_, el) => {
    const text = $(el).text().trim();
    if (text) infoRows[text] = true;
  });

  const details = {};
  $('.info-table tr, .info-table--right-border tr').each((_, row) => {
    const label = $(row).find('th').text().trim().replace(':', '');
    const value = $(row).find('td').text().trim();
    if (label && value) details[label] = value;
  });

  const valueRaw = $('a.data-header__market-value-wrapper').text().trim() ||
                   $('[class*="market-value"]').first().text().trim();
  const marketValue = await parseValue(valueRaw.match(/€[\d.,]+[mk]?/i)?.[0] || valueRaw);

  const positionRaw = details['Position'] || details['Posición'] || '';
  const position = mapPosition(positionRaw);

  const stats = {};
  $('div.detail-position__position').each((_, el) => {
    const pos = $(el).text().trim();
    if (pos) stats[pos] = true;
  });

  return {
    id: playerId,
    name,
    position_raw: positionRaw || null,
    position_code: position.code,
    position_label: position.label,
    market_value: marketValue,
    details,
    profile_url: url,
  };
}

module.exports = { searchTeam, getSquad, getPlayerDetails };
