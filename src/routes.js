const express = require('express');
const { searchTeam, getSquad, getPlayerDetails } = require('./scraper');
const { getLeagueTeams, getLeagueSquads, KNOWN_LEAGUES } = require('./leagues');

const router = express.Router();

/**
 * GET /teams/search?q=flamengo
 * Busca times pelo nome
 */
router.get('/teams/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Parâmetro "q" é obrigatório' });

  try {
    const teams = await searchTeam(q);
    res.json({ query: q, total: teams.length, teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /teams/:slug/:id/squad
 * Retorna o plantel completo de um time
 * Ex: /teams/flamengo/11517/squad
 */
router.get('/teams/:slug/:id/squad', async (req, res) => {
  const { slug, id } = req.params;
  try {
    const squad = await getSquad(slug, id);
    res.json(squad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /players/:slug/:id
 * Retorna detalhes de um jogador
 * Ex: /players/pedro/146747
 */
router.get('/players/:slug/:id', async (req, res) => {
  const { slug, id } = req.params;
  try {
    const player = await getPlayerDetails(slug, id);
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /leagues
 * Lista ligas pré-configuradas
 */
router.get('/leagues', (req, res) => {
  const list = Object.entries(KNOWN_LEAGUES).map(([key, val]) => ({
    key,
    slug: val.slug,
    id: val.id,
    squad_url: `/api/leagues/${key}/teams`,
  }));
  res.json({ leagues: list });
});

/**
 * GET /leagues/:key/teams
 * Lista todos os times de uma liga pelo atalho (ex: brasileirao-serie-a)
 */
router.get('/leagues/:key/teams', async (req, res) => {
  const league = KNOWN_LEAGUES[req.params.key];
  if (!league) return res.status(404).json({ error: 'Liga não encontrada. Use GET /api/leagues para ver as disponíveis.' });

  try {
    const data = await getLeagueTeams(league.slug, league.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /leagues/:slug/:id/teams
 * Lista todos os times de uma liga pelo slug e id do Transfermarkt
 */
router.get('/leagues/:slug/:id/teams', async (req, res) => {
  const { slug, id } = req.params;
  try {
    const data = await getLeagueTeams(slug, id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /leagues/:key/squads
 * Retorna o plantel completo de todos os times da liga
 * ATENÇÃO: demora alguns minutos (scraping sequencial com delay)
 */
router.get('/leagues/:key/squads', async (req, res) => {
  const league = KNOWN_LEAGUES[req.params.key];
  if (!league) return res.status(404).json({ error: 'Liga não encontrada. Use GET /api/leagues para ver as disponíveis.' });

  const delay = parseInt(req.query.delay) || 2000;

  try {
    // Timeout longo pois vai buscar ~20 times
    req.setTimeout(600000);
    res.setTimeout(600000);
    const data = await getLeagueSquads(league.slug, league.id, { delay });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
