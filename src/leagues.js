const cheerio = require('cheerio');
const { fetchPage } = require('./browser');
const { getSquad } = require('./scraper');

const BASE_URL = 'https://www.transfermarkt.com';

// Ligas pré-configuradas para facilitar o uso
const KNOWN_LEAGUES = {
  'brasileirao-serie-a': { slug: 'campeonato-brasileiro-serie-a', id: 'BRA1' },
  'brasileirao-serie-b': { slug: 'campeonato-brasileiro-serie-b', id: 'BRA2' },
  'premier-league':      { slug: 'premier-league', id: 'GB1' },
  'la-liga':             { slug: 'laliga', id: 'ES1' },
  'serie-a-italiana':    { slug: 'serie-a', id: 'IT1' },
  'bundesliga':          { slug: 'bundesliga', id: 'L1' },
  'ligue-1':             { slug: 'ligue-1', id: 'FR1' },
  'libertadores':        { slug: 'copa-libertadores', id: 'CLI' },
};

async function getLeagueTeams(leagueSlug, leagueId) {
  const url = `${BASE_URL}/${leagueSlug}/startseite/wettbewerb/${leagueId}`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const leagueName = $('h1.data-header__headline-wrapper--main').text().trim() ||
                     $('[class*="headline"]').first().text().trim();

  const season = $('select[name="saison_id"] option[selected]').text().trim() || '2024';

  const teams = [];

  // A tabela de times da liga tem linhas com exatamente uma célula com link para /startseite/verein/
  $('table.items').first().find('tbody tr').each((_, row) => {
    const $row = $(row);

    // Filtra apenas linhas de times (href contém /startseite/verein/)
    const nameEl = $row.find('td a[href*="/startseite/verein/"]').first();
    const name = nameEl.text().trim();
    const href = nameEl.attr('href') || '';
    if (!name || !href) return;

    // Extrai slug e id do href: /slug/startseite/verein/ID/saison_id/YYYY
    const hrefParts = href.split('/');
    const teamSlug = hrefParts[1] || null;
    const vereinIdx = hrefParts.indexOf('verein');
    const teamId = vereinIdx !== -1 ? hrefParts[vereinIdx + 1] : null;
    if (!teamId) return;

    const tds = $row.find('td');
    const squadSize = tds.filter('.zentriert').eq(0).text().trim();
    const avgAge = tds.filter('.zentriert').eq(1).text().trim();
    const foreigners = tds.filter('.zentriert').eq(2).text().trim();

    // Valor médio e total ficam em td.rechts — pega somente o primeiro número limpo
    const valueTexts = tds.filter('.rechts').map((_, el) => $(el).text().trim()).get();
    const avgValue = valueTexts[0] || null;
    const totalValue = valueTexts[1] || null;

    teams.push({
      id: teamId,
      slug: teamSlug,
      name,
      squad_size: squadSize ? parseInt(squadSize) : null,
      average_age: avgAge ? parseFloat(avgAge.replace(',', '.')) : null,
      foreigners: foreigners ? parseInt(foreigners) : null,
      average_market_value: avgValue,
      total_market_value: totalValue,
      url: `${BASE_URL}/${teamSlug}/startseite/verein/${teamId}`,
    });
  });

  return { league: leagueName, season, league_url: url, total_teams: teams.length, teams };
}

async function getLeagueSquads(leagueSlug, leagueId, options = {}) {
  const { delay = 2000 } = options;

  const leagueData = await getLeagueTeams(leagueSlug, leagueId);
  const results = [];

  for (const team of leagueData.teams) {
    try {
      console.log(`Buscando plantel: ${team.name}...`);
      const squad = await getSquad(team.slug, team.id);
      results.push(squad);
      // Delay entre requests para não ser bloqueado
      await new Promise(r => setTimeout(r, delay));
    } catch (err) {
      results.push({ team: { id: team.id, name: team.name }, error: err.message, players: [] });
    }
  }

  return {
    league: leagueData.league,
    season: leagueData.season,
    total_teams: results.length,
    squads: results,
  };
}

module.exports = { getLeagueTeams, getLeagueSquads, KNOWN_LEAGUES };
