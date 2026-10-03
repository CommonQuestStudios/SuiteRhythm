import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let rows = null;
let failWith = null;
let selectCalls = 0;

vi.mock('../lib/supabase.js', () => ({
  get supabaseAdmin() {
    return {
      from: () => ({
        select: () => ({
          order: async () => {
            selectCalls += 1;
            if (failWith) return { data: null, error: failWith };
            return { data: rows, error: null };
          },
        }),
      }),
    };
  },
}));

const { getCatalogFiles, invalidateCatalogCache, resetCatalogSourceForTests } = await import('../lib/catalog-source.js');
const { buildCatalogCandidates } = await import('../lib/server-catalog.js');

const liveRows = [
  { type: 'sfx', name: 'door slam heavy', file: 'sounds/door-slam-heavy.mp3', keywords: ['door', 'slam'], loop: false },
  { type: 'sfx', name: 'Dragon Claws On A Stone Wall', file: 'sounds/generated/sfx/dragon-claws.mp3', keywords: ['dragon', 'claws', 'stone', 'wall', 'scratch'], loop: false },
  { type: 'music', name: 'dark dungeon ambient', file: 'sounds/dark.mp3', keywords: ['dark'], loop: true },
];

beforeEach(() => {
  resetCatalogSourceForTests();
  rows = liveRows;
  failWith = null;
  selectCalls = 0;
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('catalog source', () => {
  it('serves the live Supabase catalog and caches it', async () => {
    const first = await getCatalogFiles();
    const second = await getCatalogFiles();
    expect(first.source).toBe('supabase');
    expect(first.files.map((f) => f.name)).toContain('Dragon Claws On A Stone Wall');
    expect(second.files).toBe(first.files);
    expect(selectCalls).toBe(1);
  });

  it('exposes promoted sounds to the AI candidate list', async () => {
    const { files } = await getCatalogFiles();
    const candidates = buildCatalogCandidates({
      transcript: 'The dragon dragged its claws across the stone wall.',
      mode: 'auto',
      files,
    });
    expect(candidates.sfx.map((s) => s.name)).toContain('Dragon Claws On A Stone Wall');
  });

  it('falls back to the shipped catalog when Supabase fails with nothing cached', async () => {
    failWith = new Error('network down');
    const result = await getCatalogFiles();
    expect(result.source).toBe('static');
    expect(result.files.length).toBeGreaterThan(100);
  });

  it('keeps serving the last good live copy during an outage', async () => {
    await getCatalogFiles();
    invalidateCatalogCache();
    // Re-prime, then expire the TTL by forcing a refetch that fails.
    await getCatalogFiles();
    failWith = new Error('network down');
    resetTtl();
    const result = await getCatalogFiles();
    expect(result.source).toBe('supabase-stale');
    expect(result.files.map((f) => f.name)).toContain('door slam heavy');
  });

  it('dedupes concurrent refreshes', async () => {
    const [a, b] = await Promise.all([getCatalogFiles(), getCatalogFiles()]);
    expect(a.files).toBe(b.files);
    expect(selectCalls).toBe(1);
  });
});

// The module keeps its TTL private; expiring it from a test means rewinding
// the clock it reads, which Date.now mocking covers without touching internals.
function resetTtl() {
  const realNow = Date.now;
  const future = realNow() + 10 * 60 * 1000;
  vi.spyOn(Date, 'now').mockImplementation(() => future);
}
