/**
 * GET /api/sounds
 * Returns the full sound catalog (Supabase, falling back to the static file)
 * from the shared server catalog source.
 */

import { NextResponse } from 'next/server';
import { getCatalogFiles } from '../../../lib/catalog-source.js';
import { normalizeSoundForApi } from '../../../lib/sound-catalog.js';

// The catalog changes rarely (manual seeds, occasional auto promotion), so let
// the edge absorb repeat loads instead of hitting Supabase on every page open.
const CATALOG_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
};

export async function GET() {
  try {
    const { files, source } = await getCatalogFiles();
    const sounds = files.map(normalizeSoundForApi);
    const body = source === 'supabase' ? { sounds } : { sounds, source };
    const headers = source === 'static'
      ? { 'Cache-Control': 'public, max-age=0, s-maxage=60' }
      : CATALOG_CACHE_HEADERS;
    return NextResponse.json(body, { headers });
  } catch (err) {
    console.error('[/api/sounds] Failed to load sound catalog:', err);
    return NextResponse.json({ error: 'Failed to load sound catalog' }, { status: 500 });
  }
}
