import { describe, expect, it } from 'vitest';
import { buildCatalogCandidates, formatCatalogSummary, resolveDecisionSounds } from '../lib/server-catalog.js';

const candidates = {
  music: [{ name: 'dark dungeon ambient', keywords: ['dark'] }],
  sfx: [
    { name: 'door slam heavy' },
    { name: 'thunder crack close' },
    { name: 'creatures, humanoid, zombie, group, ext roar, scream, shriek' },
  ],
};

describe('resolveDecisionSounds', () => {
  it('keeps exact candidate names and drops inventions', () => {
    const { decision, droppedSfx, snappedSfx } = resolveDecisionSounds({
      sfx: [
        { id: 'door slam heavy', confidence: 0.9 },
        { id: 'dragon wing flap', confidence: 0.9 },
      ],
    }, candidates);
    expect(decision.sfx.map((s) => s.id)).toEqual(['door slam heavy']);
    expect(droppedSfx).toEqual(['dragon wing flap']);
    expect(snappedSfx).toBe(0);
  });

  it('snaps casing, punctuation and library prefix drift to the real name', () => {
    const { decision, snappedSfx } = resolveDecisionSounds({
      sfx: [
        { id: 'Thunder Crack Close' },
        { id: 'ES_Creatures Humanoid Zombie Group Ext Roar Scream Shriek' },
      ],
    }, candidates);
    expect(decision.sfx.map((s) => s.id)).toEqual([
      'thunder crack close',
      'creatures, humanoid, zombie, group, ext roar, scream, shriek',
    ]);
    expect(snappedSfx).toBe(2);
  });

  it('deduplicates repeated picks and tolerates malformed entries', () => {
    const { decision } = resolveDecisionSounds({
      sfx: [{ id: 'door slam heavy' }, { id: 'Door Slam Heavy' }, null, 'junk'],
    }, candidates);
    expect(decision.sfx).toHaveLength(1);
    expect(resolveDecisionSounds({ sfx: 'nope' }, candidates).decision.sfx).toEqual([]);
  });

  it('snaps music but never drops it', () => {
    const snapped = resolveDecisionSounds({ music: { id: 'Dark Dungeon Ambient' } }, candidates);
    expect(snapped.decision.music.id).toBe('dark dungeon ambient');
    const kept = resolveDecisionSounds({ music: { id: 'sing ballad acoustic guitar' } }, candidates);
    expect(kept.decision.music.id).toBe('sing ballad acoustic guitar');
  });

  it('builds the same prompt text through the split helpers', () => {
    const args = { transcript: 'The door slammed and thunder cracked.', mode: 'auto' };
    const built = buildCatalogCandidates(args);
    expect(built.sfx.length).toBeGreaterThan(0);
    const summary = formatCatalogSummary(built);
    expect(summary).toContain('AVAILABLE SFX CANDIDATES');
    expect(summary).toContain(built.sfx[0].name);
  });
});
