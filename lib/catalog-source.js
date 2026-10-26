/**
 * Single server side source for the sound catalog.
 *
 * Supabase `sounds` is the live catalog (it gains rows when generated sounds
 * are promoted); public/saved-sounds.json is the shipped fallback. Both the
 * client facing /api/sounds route and the AI candidate builder in /api/analyze
 * read from here, so the model is offered the same sounds the browser can
 * actually play. Results are cached per instance with a short TTL and the
 * last good copy is served if Supabase is unreachable.
 */

import { supabaseAdmin } from './supabase.js';
import { getStaticSoundFiles } from './server-catalog.js';

const CATALOG_TTL_MS = Number(process.env.CATALOG_CACHE_TTL_MS) || 5 * 60 * 1000;
// PostgREST silently caps a single response at 1000 rows; the catalog is larger.
const CATALOG_PAGE_SIZE = 1000;

let cache = null; // { files, source, fetchedAt }
let inflight = null;

function normalizeRow(row) {
  return {
    type: row.type,
    name: row.name,
    file: row.file,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    loop: !!row.loop,
  };
}

async function fetchLiveCatalog() {
  const files = [];
  for (let from = 0; ; from += CATALOG_PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from('sounds')
      .select('type, name, file, keywords, loop')
      .order('name', { ascending: true })
      .range(from, from + CATALOG_PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data || [];
    for (const row of rows) {
      if (row && row.file && row.name) files.push(normalizeRow(row));
    }
    if (rows.length < CATALOG_PAGE_SIZE) break;
  }
  if (!files.length) throw new Error('Supabase sounds table returned no rows');
  return files;
}

/**
 * @returns {Promise<{ files: Array, source: 'supabase'|'static'|'supabase-stale' }>}
 */
export async function getCatalogFiles() {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CATALOG_TTL_MS) return { files: cache.files, source: cache.source };
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const files = await fetchLiveCatalog();
      cache = { files, source: 'supabase', fetchedAt: Date.now() };
      return { files, source: 'supabase' };
    } catch (err) {
      console.warn('[catalog] Supabase unavailable, using fallback:', err?.message || err);
      if (cache) {
        // Keep serving the last good live copy; retry on the next TTL window.
        cache = { ...cache, fetchedAt: Date.now() };
        return { files: cache.files, source: 'supabase-stale' };
      }
      const files = getStaticSoundFiles();
      // Short lived so a transient outage does not pin the static catalog for 5 minutes.
      cache = { files, source: 'static', fetchedAt: Date.now() - CATALOG_TTL_MS + 30_000 };
      return { files, source: 'static' };
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Drop the cached copy (call after writing to the `sounds` table). */
export function invalidateCatalogCache() {
  cache = null;
}

export function resetCatalogSourceForTests() {
  cache = null;
  inflight = null;
}
