// Logs in to tpl:map (ePASS), scrapes the attractions page and reports availability.
// Usage: EPASS_USER=... EPASS_PASS=... node check.js   (requires playwright)
const { chromium } = require('playwright');
const URL = 'https://epass-ca.quipugroup.net/?clientID=16&libraryID=1';
const SOLD_OUT = 'All passes for this attraction have been reserved. Check back for new passes.';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.fill('#ePASSPatronNumber', process.env.EPASS_USER);
  await page.fill('#ePASSPatronPassword', process.env.EPASS_PASS);
  await page.click('#ePASSButtonLogin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  const text = await page.evaluate(() => document.body.innerText);
  await browser.close();

  // An attraction's name is the line before its "Mobile or ... Pass" line.
  const lines = text.split('\n');
  const result = {};
  let cur = null;
  lines.forEach((l, i) => {
    if ((lines[i + 1] || '').startsWith('Mobile or')) { cur = l.trim(); result[cur] = true; }
    else if (cur && l.includes(SOLD_OUT)) result[cur] = false;
  });
  const WANTED = ['tafelmusik', 'toronto symphony orchestra', 'royal conservatory of music', 'inter toronto football club',
    'etobicoke philharmonic orchestra', 'hot docs cinema', 'ontario science centre', 'reptelia', "ripley's aquarium of canada"];
  const norm = s => s.toLowerCase().replace(/[’‘]/g, "'");
  if (process.env.DEBUG) console.error(Object.keys(result).join('\n'));
  const watched = Object.keys(result).filter(k => WANTED.some(w => norm(k).includes(w)));
  const available = watched.filter(k => result[k]);
  const reserved = watched.filter(k => !result[k]);
  const missing = WANTED.filter(w => !watched.some(k => norm(k).includes(w)));
  console.log(JSON.stringify({ available, reserved, missing, scraped: Object.keys(result).length }, null, 2));
})();
