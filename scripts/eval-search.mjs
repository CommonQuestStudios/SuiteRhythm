// Ad hoc matcher evaluation: node scripts/eval-search.mjs "query" [type]
// With no args, prints a fixed set of probe queries.
import fs from 'fs';
import { tfidfMatch } from '../lib/modules/trigger-system.js';

const files = JSON.parse(fs.readFileSync(new URL('../public/saved-sounds.json', import.meta.url), 'utf8')).files;
const probes = process.argv[2]
  ? [[process.argv[2], process.argv[3] || 'sfx']]
  : [
    ['wind howling', 'sfx'], ['sword draw', 'sfx'], ['scream', 'sfx'], ['fire roar', 'sfx'],
    ['candle extinguish', 'sfx'], ['explosion large', 'sfx'], ['door slam', 'sfx'], ['bell toll', 'sfx'],
    ['wolf howl', 'sfx'], ['dog bark', 'sfx'], ['glass shatter', 'sfx'], ['footsteps gravel', 'sfx'],
    ['police officer entered room', 'sfx'], ['clock sat desk', 'sfx'], ['tense battle drums', 'music'],
    ['tavern', 'sfx'], ['heavy rain', 'sfx'], ['thunder', 'sfx'], ['ocean waves crashing', 'sfx'],
  ];

for (const [q, t] of probes) {
  const m = tfidfMatch(q, t, files);
  console.log(`${q} [${t}]`.padEnd(38), '->', m ? m.name : '(null)');
}
