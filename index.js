const express = require('express');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: 'Transfermarkt API',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/api/teams/search?q={nome}', description: 'Buscar times pelo nome' },
      { method: 'GET', path: '/api/teams/{slug}/{id}/squad', description: 'Plantel completo do time' },
      { method: 'GET', path: '/api/players/{slug}/{id}', description: 'Detalhes de um jogador' },
      { method: 'GET', path: '/api/leagues', description: 'Ligas pré-configuradas disponíveis' },
      { method: 'GET', path: '/api/leagues/{key}/teams', description: 'Todos os times de uma liga' },
      { method: 'GET', path: '/api/leagues/{key}/squads', description: 'Plantel de TODOS os times da liga (demora ~5min)' },
    ],
    examples: [
      '/api/teams/search?q=Flamengo',
      '/api/teams/flamengo/11517/squad',
      '/api/players/pedro/146747',
      '/api/leagues',
      '/api/leagues/brasileirao-serie-a/teams',
      '/api/leagues/brasileirao-serie-a/squads',
    ],
  });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`Transfermarkt API rodando na porta ${PORT}`);
});

module.exports = app;
