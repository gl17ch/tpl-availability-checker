// Polls check.js every 5 minutes; exits 0 printing JSON when a watched attraction becomes available.
const { execFileSync } = require('child_process');
const WATCH = ['tafelmusik', 'toronto symphony orchestra', 'royal conservatory of music', 'inter toronto football club',
  'etobicoke philharmonic orchestra', 'hot docs cinema', 'ontario science centre', 'reptilia', "ripley's aquarium of canada"];
const INTERVAL = 5 * 60 * 1000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  for (;;) {
    try {
      const out = JSON.parse(execFileSync('node', [__dirname + '/check.js'], { encoding: 'utf8', env: process.env }));
      const hits = out.available.filter(n => WATCH.includes(n.toLowerCase().replace(/’/g, "'")));
      console.log(new Date().toISOString(), 'watched available:', hits.length ? hits : 'none');
      if (hits.length) { console.log(JSON.stringify({ hits })); process.exit(0); }
    } catch (e) { console.log(new Date().toISOString(), 'check failed:', e.message.split('\n')[0]); }
    await sleep(INTERVAL);
  }
})();
