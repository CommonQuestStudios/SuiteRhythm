import { describe, expect, it } from 'vitest';
import { getStaticSoundFiles } from '../lib/server-catalog.js';
import { normalizeSoundRecord } from '../lib/sound-catalog.js';
import { PHRASE_TRIGGERS, matchPhraseTriggers, resolvePhraseSound } from '../lib/modules/phrase-triggers.js';

const catalog = getStaticSoundFiles().map(normalizeSoundRecord);

describe('phrase triggers', () => {
  it('every built in phrase resolves to a real SFX in the shipped catalog', () => {
    const unresolved = PHRASE_TRIGGERS
      .filter((entry) => !resolvePhraseSound(entry, catalog))
      .map((entry) => entry.sound || entry.query);
    expect(unresolved).toEqual([]);
  });

  it('has no duplicate first patterns (they are used as cooldown bucket keys)', () => {
    const firsts = PHRASE_TRIGGERS.map((e) => e.patterns[0]);
    expect(new Set(firsts).size).toBe(firsts.length);
  });

  it('matches past tense narration for the dramatic beats', () => {
    const cases = [
      ['He drew his sword and stepped forward.', 'draw sword'],
      ['She kicked the door open.', 'door slam heavy'],
      ['A crack of thunder split the sky.', 'thunder crack close'],
      ['The wizard cast a spell.', 'magic spell'],
      ['A massive explosion rocked the keep.', 'big explosion'],
      ['The wolves howled somewhere behind them.', 'wolf howl'],
      ['The floorboards creaked under his weight.', 'wood stair groan'],
      ['The church bell tolled midnight.', 'church bell toll'],
    ];
    for (const [text, expected] of cases) {
      const hits = matchPhraseTriggers(text);
      expect(hits.length, text).toBeGreaterThan(0);
      expect(resolvePhraseSound(hits[0], catalog)?.name, text).toBe(expected);
    }
  });

  it('prefers the weather reading of roar over the creature one', () => {
    const hits = matchPhraseTriggers('The roar of the wind drowned everything out.');
    expect(resolvePhraseSound(hits[0], catalog)?.name).toBe('wind howl');
  });

  it('stays silent on ordinary sentences', () => {
    expect(matchPhraseTriggers('They sat by the table and talked about the harvest.')).toEqual([]);
    expect(matchPhraseTriggers('')).toEqual([]);
  });

  it('resolves user phrases through normalized names', () => {
    const custom = { patterns: ['the gate groaned'], query: 'Iron Gate Creak Open', volume: 0.7 };
    expect(resolvePhraseSound(custom, catalog)?.name).toBe('iron gate creak open');
    expect(resolvePhraseSound({ patterns: ['x'], query: 'definitely not a sound' }, catalog)).toBeNull();
  });
});
