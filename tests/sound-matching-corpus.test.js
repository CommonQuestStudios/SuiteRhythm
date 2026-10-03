import { describe, expect, it } from 'vitest';
import corpus from './fixtures/sound-matching-corpus.json' with { type: 'json' };
import { buildCatalogSummary, getStaticSoundFiles } from '../lib/server-catalog.js';
import { normalizeSoundRecord } from '../lib/sound-catalog.js';
import { buildTriggerMap, ruleBasedDecision, tfidfMatch } from '../lib/modules/trigger-system.js';
import { matchPhraseTriggers, resolvePhraseSound } from '../lib/modules/phrase-triggers.js';

const triggerMap = buildTriggerMap({ files: [] });
const savedSounds = { files: [] };
const staticFiles = getStaticSoundFiles();
const catalog = staticFiles.map(normalizeSoundRecord);

function getSfxList(summary) {
  return summary.match(/AVAILABLE SFX CANDIDATES \(\d+ sounds[^\n]*\):\n([^\n]*)/)?.[1] || '';
}

/**
 * Corpus entry fields (all optional):
 *   summaryContains / summaryExcludes  sound names in the AI SFX candidate list
 *   ruleSfxQueries                     instant keyword queries that fire, in order
 *   phraseSound                        catalog name the first phrase trigger resolves to (null = no phrase)
 *   search                             [{ query, type, expect }] catalog search expectations (expect null = no match)
 */
describe('sound matching evaluation corpus', () => {
  for (const example of corpus) {
    it(example.name, () => {
      if (example.summaryContains || example.summaryExcludes) {
        const summary = buildCatalogSummary({ transcript: example.transcript, mode: example.mode });
        const sfxList = getSfxList(summary);

        for (const soundName of example.summaryContains || []) {
          expect(sfxList).toContain(soundName);
        }
        for (const soundName of example.summaryExcludes || []) {
          expect(sfxList).not.toContain(soundName);
        }
      }

      if (example.ruleSfxQueries) {
        const decision = ruleBasedDecision(example.transcript, example.mode, triggerMap, savedSounds);
        const queries = decision?.sfx?.map((sfx) => sfx.query) || [];
        expect(queries).toEqual(example.ruleSfxQueries);
      }

      if ('phraseSound' in example) {
        const hits = matchPhraseTriggers(example.transcript);
        const resolved = hits.length ? resolvePhraseSound(hits[0], catalog)?.name ?? null : null;
        expect(resolved).toBe(example.phraseSound);
      }

      for (const probe of example.search || []) {
        const match = tfidfMatch(probe.query, probe.type || 'sfx', staticFiles);
        expect(match?.name ?? null, `search "${probe.query}"`).toBe(probe.expect);
      }
    });
  }
});
