# ft-elenco

Baixa o elenco de um time do footballtransfers.com em JSON, rodando localmente (Node 18+).

```bash
npm install
node cli.js buscar "Flamengo"                       # lista times (nome + url)
node cli.js elenco https://www.footballtransfers.com/en/teams/<pais>/<time>
node cli.js elenco <url> --cambio 5.50 --saida flamengo.json
```

Cada jogador: `nome`, `idade`, `posicao` (gol/def/mei/pon/ca), `valor_brl` (euro × cotação), `nacionalidade`.

Se o site mudar o layout ou bloquear, salve a página (Ctrl+S) e rode `node cli.js elenco --html pagina.html`.
