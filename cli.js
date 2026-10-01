#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseElenco, parseTimes } from './parser.js';

const BASE = 'https://www.footballtransfers.com';
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
};

const AJUDA = `Uso:
  node cli.js buscar <nome do time>            lista times encontrados (nome + url)
  node cli.js elenco <url-do-time> [opções]    baixa o elenco em JSON
  node cli.js elenco --html pagina.html        usa uma página já salva (para depurar)

Opções do elenco:
  --cambio 5.50     usa esta cotação EUR->BRL (padrão: busca online)
  --saida arq.json  arquivo de saída (padrão: saida/<time>.json)
`;

const get = async (url) => {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  return r.text();
};

async function cotacao(manual) {
  if (manual) return +manual;
  const r = await fetch('https://api.frankfurter.app/latest?from=EUR&to=BRL');
  if (!r.ok) throw new Error('Não consegui a cotação; use --cambio 5.50');
  return (await r.json()).rates.BRL;
}

function opcoes(args) {
  const o = { _: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) o[args[i].slice(2)] = args[++i];
    else o._.push(args[i]);
  }
  return o;
}

const [cmd, ...resto] = process.argv.slice(2);
const o = opcoes(resto);

try {
  if (cmd === 'buscar' && o._.length) {
    const q = encodeURIComponent(o._.join(' '));
    const html = await get(`${BASE}/en/search/?search=${q}`);
    const times = parseTimes(html);
    if (!times.length) console.error('Nenhum time encontrado (a rota de busca pode ter mudado).');
    console.log(JSON.stringify(times, null, 2));
  } else if (cmd === 'elenco' && (o._[0] || o.html)) {
    const html = o.html ? await readFile(o.html, 'utf8') : await get(o._[0]);
    const taxa = await cotacao(o.cambio);
    const jogadores = parseElenco(html).map(({ valor_eur, ...j }) => ({
      ...j,
      valor_brl: valor_eur == null ? null : Math.round(valor_eur * taxa),
    }));
    if (!jogadores.length) throw new Error('Nenhum jogador encontrado na página. Salve o HTML e use --html para depurar.');
    const slug = (o._[0] || o.html).split('/').filter(Boolean).pop().replace(/\W+/g, '-');
    const arq = o.saida || `saida/${slug}.json`;
    await mkdir('saida', { recursive: true });
    await writeFile(arq, JSON.stringify({ cambio_eur_brl: taxa, jogadores }, null, 2));
    console.log(`${jogadores.length} jogadores salvos em ${arq} (EUR→BRL ${taxa})`);
  } else {
    console.log(AJUDA);
  }
} catch (e) {
  console.error('Erro:', e.message);
  process.exit(1);
}
