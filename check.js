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
  const TARGETS = ['Tafelmusik', 'Toronto Symphony Orchestra', 'Royal Conservatory of Music', 'Inter Toronto Football Club',
    'Etobicoke Philharmonic Orchestra', 'Hot Docs Cinema', 'Ontario Science Centre', 'Reptelia', "Ripley's Aquarium of Canada"];
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const find = t => Object.keys(result).find(k => norm(k).includes(norm(t)) || norm(t).includes(norm(k)));
  const available = [], reserved = [], notListed = [];
  TARGETS.forEach(t => { const k = find(t); (k ? (result[k] ? available : reserved) : notListed).push(k || t); });
  console.log(JSON.stringify({ available, reserved, notListed }, null, 2));
})();
