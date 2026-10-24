// Logs in to tpl:map (ePASS), scrapes the attractions page and reports availability.
// Usage: EPASS_USER=... EPASS_PASS=... node check.js   (requires playwright)
const { chromium } = require('playwright');
const URL = 'https://epass-ca.quipugroup.net/?clientID=16&libraryID=1';
const SOLD_OUT = 'All passes for this attraction have been reserved. Check back for new passes.';

const TARGETS = ['Tafelmusik', 'Toronto Symphony Orchestra', 'Royal Conservatory of Music', 'Inter Toronto Football Club',
  'Etobicoke Philharmonic Orchestra', 'Hot Docs Cinema', 'Ontario Science Centre', 'Reptilia', "Ripley's Aquarium of Canada"];
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.fill('#ePASSPatronNumber', (process.env.EPASS_USER || process.env.epass_user));
  await page.fill('#ePASSPatronPassword', (process.env.EPASS_PASS || process.env.epass_pass));
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
  const match = name => TARGETS.some(t => norm(name).includes(norm(t)) || norm(t).includes(norm(name)));
  const names = Object.keys(result).filter(match);
  const available = names.filter(k => result[k]);
  const reserved = names.filter(k => !result[k]);
  const notListed = TARGETS.filter(t => !names.some(n => norm(n).includes(norm(t)) || norm(t).includes(norm(n))));
  console.log(JSON.stringify({ available, reserved, notListed }, null, 2));
})();
