const express = require('express');
const { searchTeam, getSquad, getPlayerDetails } = require('./scraper');

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

module.exports = router;
