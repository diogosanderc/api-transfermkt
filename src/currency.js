const axios = require('axios');

let cachedRate = null;
let cacheTime = 0;
const CACHE_TTL = 3600 * 1000; // 1 hora

async function getEurToBrl() {
  if (cachedRate && Date.now() - cacheTime < CACHE_TTL) return cachedRate;
  try {
    const res = await axios.get('https://open.er-api.com/v6/latest/EUR', { timeout: 5000 });
    cachedRate = res.data.rates.BRL;
    cacheTime = Date.now();
    return cachedRate;
  } catch {
    return cachedRate || 6.2; // fallback
  }
}

// Converte string do Transfermarkt (ex: "€45.00m", "€500k") para número em EUR e BRL
async function parseValue(rawValue) {
  if (!rawValue || rawValue === '-') return { eur: null, brl: null, formatted_brl: null };

  let euros = null;
  const clean = rawValue.replace(/[€\s]/g, '').toLowerCase();

  if (clean.includes('m')) {
    euros = parseFloat(clean) * 1_000_000;
  } else if (clean.includes('k')) {
    euros = parseFloat(clean) * 1_000;
  } else {
    euros = parseFloat(clean) || null;
  }

  if (!euros) return { eur: null, brl: null, formatted_brl: null };

  const rate = await getEurToBrl();
  const brl = Math.round(euros * rate);

  return {
    eur: euros,
    brl,
    formatted_brl: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(brl),
  };
}

module.exports = { parseValue, getEurToBrl };
