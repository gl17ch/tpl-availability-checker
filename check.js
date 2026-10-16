// Logs in to tpl:map (ePASS), scrapes the attractions page and reports availability.
// Usage: EPASS_USER=... EPASS_PASS=... node check.js   (requires playwright)
const { chromium } = require('playwright');
const URL = 'https://epass-ca.quipugroup.net/?clientID=16&libraryID=1';
const SOLD_OUT = 'All passes for this attraction have been reserved. Check back for new passes.';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.click('#ePASSPatronNumber');
  await page.keyboard.type(process.env.EPASS_USER, { delay: 30 });
  await page.click('#ePASSPatronPassword');
  await page.keyboard.type(process.env.EPASS_PASS, { delay: 30 });
  await page.click('#ePASSButtonLogin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(8000);
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
  const available = Object.keys(result).filter(k => result[k]);
  const reserved = Object.keys(result).filter(k => !result[k]);
  const WANT = ['tafelmusik','toronto symphony orchestra','royal conservatory of music','inter toronto football club','etobicoke philharmonic orchestra','hot docs cinema','ontario science centre','reptelia','reptilia',"ripley's aquarium of canada",'the village at black creek'];
  const wanted = available.filter(k => WANT.some(w => k.toLowerCase().replace(/’/g, "'").includes(w)));
  console.log(JSON.stringify({ wanted, available, reserved }, null, 2));
})();
