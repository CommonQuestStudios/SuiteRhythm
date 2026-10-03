import { describe, expect, it } from 'vitest';
import {
  DISABLE_AFTER_STRIKES,
  SESSION_SUPPRESS_MS,
  isSuppressed,
  normalizeSuppressions,
  pruneSuppressions,
  recordCorrect,
  recordWrong,
} from '../lib/modules/feedback-suppression.js';

const now = 1_000_000;
const dog = { trigger: 'dog', soundId: 'sounds/large_dog_barking.mp3', now };

describe('feedback suppression', () => {
  it('suppresses a wrong pairing for the session and the sound on its own', () => {
    const { store, strikes, disableSound } = recordWrong({}, dog);
    expect(strikes).toBe(1);
    expect(disableSound).toBe(false);
    expect(isSuppressed(store, dog)).toBe(true);
    expect(isSuppressed(store, { ...dog, trigger: 'bark' })).toBe(true);
    expect(isSuppressed(store, { ...dog, soundId: 'sounds/other.mp3' })).toBe(false);
  });

  it('expires session suppression', () => {
    const { store } = recordWrong({}, dog);
    expect(isSuppressed(store, { ...dog, now: now + SESSION_SUPPRESS_MS + 1 })).toBe(false);
  });

  it('asks to disable the sound after repeated strikes', () => {
    let store = {};
    let last;
    for (let i = 0; i < DISABLE_AFTER_STRIKES; i += 1) {
      last = recordWrong(store, dog);
      store = last.store;
    }
    expect(last.strikes).toBe(DISABLE_AFTER_STRIKES);
    expect(last.disableSound).toBe(true);
  });

  it('a correct mark forgives the pairing', () => {
    const { store } = recordWrong({}, dog);
    const cleared = recordCorrect(store, dog);
    expect(isSuppressed(cleared, dog)).toBe(false);
    expect(Object.keys(cleared)).toEqual([]);
  });

  it('prunes expired entries but keeps ones that reached the threshold', () => {
    let store = recordWrong({}, dog).store;
    store = recordWrong(store, { trigger: 'cat', soundId: 'sounds/cat.mp3', now }).store;
    store = recordWrong(store, { trigger: 'cat', soundId: 'sounds/cat.mp3', now }).store;
    store = recordWrong(store, { trigger: 'cat', soundId: 'sounds/cat.mp3', now }).store;
    const pruned = pruneSuppressions(store, now + SESSION_SUPPRESS_MS + 1);
    expect(Object.keys(pruned).every((k) => k.endsWith('sounds/cat.mp3'))).toBe(true);
    expect(Object.keys(pruned).length).toBe(2);
  });

  it('ignores malformed persisted data', () => {
    expect(normalizeSuppressions(null)).toEqual({});
    expect(normalizeSuppressions([1, 2])).toEqual({});
    expect(normalizeSuppressions({ 'nopipe': { strikes: 2, until: 1 }, 'a|b': { strikes: 'x' }, 'c|d': { strikes: 2.7, until: 5 } }))
      .toEqual({ 'c|d': { strikes: 2, until: 5 } });
    expect(recordWrong({}, { trigger: 'x', soundId: '' }).disableSound).toBe(false);
  });
});
