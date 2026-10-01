import test from 'node:test';
import assert from 'node:assert/strict';
import { parseElenco, parseValorEuro, normalizaPosicao } from './parser.js';

test('valores', () => {
  assert.equal(parseValorEuro('€ 45.2M'), 45200000);
  assert.equal(parseValorEuro('€800K'), 800000);
  assert.equal(parseValorEuro('€1,5M'), 1500000);
});

test('posições', () => {
  for (const [t, c] of [['Goalkeeper', 'gol'], ['Centre-Back', 'def'], ['Defensive Midfield', 'mei'],
    ['Right Winger', 'pon'], ['Striker', 'ca'], ['Attacker', 'ca']]) assert.equal(normalizaPosicao(t), c, t);
});

test('elenco', () => {
  const html = `<table><tr><td><img alt="Brazil"></td><td><a href="/en/players/neymar">Neymar</a></td>
    <td>Left Winger</td><td>33</td><td>€ 40.5M</td></tr></table>`;
  assert.deepEqual(parseElenco(html), [{ nome: 'Neymar', idade: 33, posicao: 'pon', valor_eur: 40500000, nacionalidade: 'Brazil' }]);
});
