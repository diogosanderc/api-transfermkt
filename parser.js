import * as cheerio from 'cheerio';

const POSICOES = [
  [/goalkeeper|goleiro|^gk$/i, 'gol'],
  [/winger|wing|^[lr][wm]$|ponta|extremo/i, 'pon'],
  [/striker|centre-forward|center-forward|attacker|forward|atacante|centroavante|^(st|cf|fw|ss)$/i, 'ca'],
  [/midfield|meia|meio|volante|^(cm|dm|am|cdm|cam|mf)$/i, 'mei'],
  [/defen|back|zagueiro|lateral|^(cb|df|sw)$/i, 'def'],
];

export function normalizaPosicao(texto) {
  const t = (texto || '').trim();
  for (const [re, cod] of POSICOES) if (re.test(t)) return cod;
  return null;
}

// "€ 45.2M", "€800K", "1,5 mi" -> número em euros
export function parseValorEuro(texto) {
  const m = (texto || '').replace(/\s/g, '').match(/([\d.,]+)([kmb]|mi|mil)?/i);
  if (!m) return null;
  let n = m[1];
  if (n.includes(',') && n.includes('.')) n = n.replace(/,/g, '');
  else n = n.replace(',', '.');
  let v = parseFloat(n);
  if (Number.isNaN(v)) return null;
  const suf = (m[2] || '').toLowerCase();
  if (suf === 'k' || suf === 'mil') v *= 1e3;
  else if (suf === 'm' || suf === 'mi') v *= 1e6;
  else if (suf === 'b') v *= 1e9;
  return Math.round(v);
}

const ehValor = (t) => /[€$£]|\d\s?(k|m|mi|mil)\b/i.test(t) && /\d/.test(t);

/** Extrai jogadores de qualquer HTML que tenha linhas (tr/li) com link para /player(s)/ */
export function parseElenco(html) {
  const $ = cheerio.load(html);
  const jogadores = [];
  const vistos = new Set();

  $('a[href*="/player"]').each((_, a) => {
    const nome = $(a).text().trim();
    if (!nome || vistos.has(nome)) return;
    const linha = $(a).closest('tr, li, [class*="player" i]').first();
    if (!linha.length) return;

    const celulas = linha
      .find('td, span, div')
      .map((_, e) => ($(e).children().length === 0 ? $(e).text().trim() : ''))
      .get()
      .filter(Boolean);

    const idade = celulas.map((c) => c.match(/^(\d{2})(\s*(anos|years|y))?$/i)).find((m) => m && +m[1] >= 14 && +m[1] <= 50);
    const posTxt = celulas.find((c) => normalizaPosicao(c) && c.length <= 25);
    const valTxt = celulas.find(ehValor);
    const flag = linha.find('img[alt], [title]').filter((_, e) => $(e).attr('alt') || $(e).attr('title')).first();
    const nacionalidade = (flag.attr('alt') || flag.attr('title') || '').trim() || null;

    vistos.add(nome);
    jogadores.push({
      nome,
      idade: idade ? +idade[1] : null,
      posicao: normalizaPosicao(posTxt),
      valor_eur: valTxt ? parseValorEuro(valTxt) : null,
      nacionalidade,
    });
  });
  return jogadores;
}

/** Extrai links de times de uma página de busca/listagem */
export function parseTimes(html, base = 'https://www.footballtransfers.com') {
  const $ = cheerio.load(html);
  const mapa = new Map();
  $('a[href*="/teams/"]').each((_, a) => {
    const href = $(a).attr('href');
    const nome = $(a).text().trim();
    if (!nome || !/\/teams\/[^/]+\/[^/]+/.test(href)) return;
    mapa.set(new URL(href, base).href, nome);
  });
  return [...mapa].map(([url, nome]) => ({ nome, url }));
}
