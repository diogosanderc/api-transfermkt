const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

function getLaunchOptions() {
  // Variável de ambiente tem prioridade
  if (process.env.CHROMIUM_PATH) {
    return { executablePath: process.env.CHROMIUM_PATH };
  }

  const { platform } = process;

  if (platform === 'win32') {
    const fs = require('fs');
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    for (const p of paths) {
      try { if (fs.existsSync(p)) return { executablePath: p }; } catch {}
    }
    throw new Error('Chrome ou Edge não encontrado. Instale o Google Chrome.');
  }

  if (platform === 'darwin') {
    return { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' };
  }

  // Linux: usa o Chromium baixado pelo próprio puppeteer (sem executablePath)
  return {};
}

let browserInstance = null;

async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) return browserInstance;

  browserInstance = await puppeteer.launch({
    ...getLaunchOptions(),
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
  });

  browserInstance.on('disconnected', () => { browserInstance = null; });
  return browserInstance;
}

async function fetchPage(url) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
    });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return await page.content();
  } finally {
    await page.close();
  }
}

module.exports = { fetchPage };
