import { describe, expect, it } from 'vitest';
import { getStaticSoundFiles } from '../lib/server-catalog.js';
import { buildTriggerMap } from '../lib/modules/trigger-system.js';

// Optimized instant copies live under sounds/instant/ in R2 only; they are not
// catalog entries, so they are checked by scripts/measure-audio-coverage.mjs.
const INSTANT_PREFIX = 'sounds/instant/';

describe('instant trigger map files', () => {
  it('every catalog backed trigger file exists in the shipped catalog', () => {
    const catalogFiles = new Set(getStaticSoundFiles().map((f) => f.file));
    const missing = [];
    for (const [keyword, config] of Object.entries(buildTriggerMap({ files: [] }))) {
      if (!config.file || config.file.startsWith(INSTANT_PREFIX)) continue;
      if (!catalogFiles.has(config.file)) missing.push(`${keyword} -> ${config.file}`);
    }
    expect(missing).toEqual([]);
  });

  it('instant copies follow the -instant.mp3 naming convention', () => {
    const bad = Object.values(buildTriggerMap({ files: [] }))
      .map((c) => c.file)
      .filter((f) => f && f.startsWith(INSTANT_PREFIX) && !/-instant\.mp3$/.test(f));
    expect(bad).toEqual([]);
  });
});
