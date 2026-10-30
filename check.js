// Logs in to tpl:map (ePASS), scrapes the attractions page and reports availability.
// Usage: EPASS_USER=... EPASS_PASS=... node check.js   (requires playwright)
const { chromium } = require('playwright');
const URL = 'https://epass-ca.quipugroup.net/?clientID=16&libraryID=1';
const TARGETS = ['Tafelmusik', 'Toronto Symphony Orchestra', 'Royal Conservatory of Music', 'Inter Toronto Football Club',
  'Etobicoke Philharmonic Orchestra', 'Hot Docs Cinema', 'Ontario Science Centre', 'Reptilia', "Ripley's Aquarium of Canada"];
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^the/, '');
const SOLD_OUT = 'All passes for this attraction have been reserved. Check back for new passes.';

async function check() {
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
  const found = n => Object.keys(result).find(k => norm(k) === norm(n));
  const available = TARGETS.filter(n => found(n) && result[found(n)]).map(found);
  const reserved = TARGETS.filter(n => found(n) && !result[found(n)]).map(found);
  const notListed = TARGETS.filter(n => !found(n));
  return { time: new Date().toISOString(), available, reserved, notListed };
}

// Default: single check. --watch: check every 5 minutes, exit (code 0) as soon as a target is available.
(async () => {
  if (!process.argv.includes('--watch')) return console.log(JSON.stringify(await check(), null, 2));
  for (;;) {
    try {
      const r = await check();
      console.log(JSON.stringify(r));
      if (r.available.length) return;
    } catch (e) { console.error(new Date().toISOString(), 'check failed:', e.message); }
    await new Promise(r => setTimeout(r, 5 * 60 * 1000));
  }
})();
