// Runs check.js and reports only the watched attractions.
// Output: {"availableWatched":[...],"reservedWatched":[...],"notListed":[...]}
const { execFileSync } = require('child_process');
const WATCH = ['Tafelmusik', 'Toronto Symphony Orchestra', 'Royal Conservatory of Music', 'Inter Toronto Football Club',
  'Etobicoke Philharmonic Orchestra', 'Hot Docs Cinema', 'Ontario Science Centre', 'Reptilia', "Ripley's Aquarium of Canada"];
const out = JSON.parse(execFileSync('node', [__dirname + '/check.js'], { encoding: 'utf8' }));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const find = (list, w) => list.some(n => norm(n).includes(norm(w)) || norm(w).includes(norm(n)));
const res = { availableWatched: [], reservedWatched: [], notListed: [] };
for (const w of WATCH) {
  if (find(out.available, w)) res.availableWatched.push(w);
  else if (find(out.reserved, w)) res.reservedWatched.push(w);
  else res.notListed.push(w);
}
console.log(JSON.stringify(res));
