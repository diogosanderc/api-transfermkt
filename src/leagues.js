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
  $('table.items tbody tr').each((_, row) => {
    const $row = $(row);
    const nameEl = $row.find('td.hauptlink a').first();
    const name = nameEl.text().trim();
    const href = nameEl.attr('href') || '';
    if (!name || !href) return;

    const parts = href.split('/');
    const teamSlug = parts[1] || null;
    const teamId = parts[parts.length - 1] || null;

    const squadSize = $row.find('td.zentriert').eq(0).text().trim();
    const avgAge = $row.find('td.zentriert').eq(1).text().trim();
    const foreigners = $row.find('td.zentriert').eq(2).text().trim();
    const avgValue = $row.find('td.rechts').text().trim();

    teams.push({
      id: teamId,
      slug: teamSlug,
      name,
      squad_size: squadSize ? parseInt(squadSize) : null,
      average_age: avgAge ? parseFloat(avgAge.replace(',', '.')) : null,
      foreigners: foreigners ? parseInt(foreigners) : null,
      average_market_value: avgValue || null,
      url: `${BASE_URL}${href}`,
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
