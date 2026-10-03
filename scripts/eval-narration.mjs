// Prints what each matching layer does for narration lines.
// Usage: node scripts/eval-narration.mjs                (built in probe lines)
//        node scripts/eval-narration.mjs "some line"    (one line)
// Used to label tests/fixtures/sound-matching-corpus.json from real output.
import fs from 'fs';
import { buildTriggerMap, findTriggerMatches } from '../lib/modules/trigger-system.js';
import { matchPhraseTriggers, resolvePhraseSound } from '../lib/modules/phrase-triggers.js';
import { normalizeSoundRecord } from '../lib/sound-catalog.js';

process.env.NODE_ENV = 'production';
const files = JSON.parse(fs.readFileSync(new URL('../public/saved-sounds.json', import.meta.url), 'utf8')).files;
const catalog = files.map(normalizeSoundRecord);
const map = buildTriggerMap({ files: [] });

const lines = process.argv[2] ? [process.argv[2]] : [
  'The tavern door swung open and the crowd fell silent.',
  'He slammed his fist on the table and the mugs rattled.',
  'Rain lashed the windows as thunder rolled over the hills.',
  'She nocked an arrow and let it fly toward the orc.',
  'The goblin shrieked and scrambled up the wall.',
  'Footsteps echoed down the stone corridor.',
  'The torch sputtered and went out, plunging them into darkness.',
  'A wolf howled somewhere beyond the tree line.',
  'The dragon roared and the ground shook.',
  'He knocked three times on the heavy oak door.',
  'The church bell tolled midnight.',
  'Glass shattered somewhere upstairs.',
  'The old floorboards creaked under his boots.',
  'Waves crashed against the rocks below the lighthouse.',
  'The campfire crackled as they settled in for the night.',
  'A gunshot rang out across the square.',
  'Her phone rang in the middle of the sermon.',
  'The horses galloped across the muddy field.',
  'The crowd erupted in applause.',
  'The baby cried all through the night.',
  'He drew his dagger slowly.',
  'The sword clanged against the shield.',
  'A massive explosion tore through the warehouse.',
  'The wizard cast a spell and the room filled with light.',
  'Coins clinked onto the bar as he paid for the ale.',
  'The clock on the mantel ticked away the hours.',
  'The train whistled as it pulled into the station.',
  'Sirens wailed in the distance.',
  'The cat hissed at the stranger.',
  'The owl hooted from the barn roof.',
  'He had no sword, no shield, and no plan.',
  'She never heard the knock at the door.',
  'The rain had finally stopped and the wind died down.',
  'The dog slept by the fire while the clock sat silent.',
  'They talked about the war for hours.',
  'He fired off an angry email to the council.',
  'The market crashed and the bank went under.',
  'She drew a long breath and shot him a look.',
  'The bells had fallen silent years ago.',
  'The thunder of hooves faded into the distance.',
  'The guard blocked the doorway with his spear.',
  'It was not the wind that woke her.',
  'He cast a glance at the door, but no one knocked.',
  'The goblins charged, screaming, across the bridge.',
];

for (const line of lines) {
  const kw = findTriggerMatches(line, map, { max: 3 }).map((m) => m.config.query);
  const hits = matchPhraseTriggers(line);
  const phrase = hits.length ? resolvePhraseSound(hits[0], catalog)?.name ?? null : null;
  console.log(line);
  console.log(`    keywords: ${JSON.stringify(kw)}   phrase: ${JSON.stringify(phrase)}`);
}
