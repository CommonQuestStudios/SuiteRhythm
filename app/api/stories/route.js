/**
 * GET /api/stories
 * Returns all stories from Supabase.
 *
 * POST /api/stories
 * Creates a new user story. Requires auth in a future iteration.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase.js';
import { requireAuth } from '../../../lib/api-auth.js';
import { getStaticStoriesForApi } from '../../../lib/server-catalog.js';
import { checkRateLimit, rateLimitHeaders } from '../../../lib/rate-limit.js';

export async function GET(request) {
  // Anonymous pagination of the whole table should not be free to script.
  const rate = checkRateLimit(request, {
    namespace: 'stories-get',
    limit: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again shortly.' },
      { status: 429, headers: rateLimitHeaders(rate) }
    );
  }

  // Parse and clamp pagination params so unauthenticated callers can't pull the
  // entire stories table in one request.
  const { searchParams } = new URL(request.url);
  const rawLimit = parseInt(searchParams.get('limit') || '100', 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, rawLimit)) : 100;
  const rawOffset = parseInt(searchParams.get('offset') || '0', 10);
  const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;

  try {
    const { data, error } = await supabaseAdmin
      .from('stories')
      .select('id, title, theme, description, body, demo')
      .order('demo', { ascending: false }) // demo stories first
      .order('title', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Rename `body` → `text` to match the engine's expected shape
    const stories = (data ?? []).map(({ body, ...rest }) => ({ ...rest, text: body }));

    return NextResponse.json({ stories, limit, offset });
  } catch (err) {
    console.warn('[/api/stories GET] Supabase unavailable, using static stories:', err?.message || err);
    try {
      const all = getStaticStoriesForApi();
      const sliced = Array.isArray(all) ? all.slice(offset, offset + limit) : all;
      return NextResponse.json({ stories: sliced, source: 'static', limit, offset });
    } catch (fallbackErr) {
      console.error('[/api/stories GET] Static fallback failed:', fallbackErr);
      return NextResponse.json({ error: 'Failed to load stories' }, { status: 500 });
    }
  }
}

export async function POST(request) {
  // Auth check — only authenticated clients can create stories
  const denied = requireAuth(request);
  if (denied) return denied;

  const rate = checkRateLimit(request, {
    namespace: 'stories-post',
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again shortly.' },
      { status: 429, headers: rateLimitHeaders(rate) }
    );
  }

  try {
    const body = await request.json();
    const { title, theme, description, text } = body;

    if (!title || !text) {
      return NextResponse.json({ error: 'title and text are required' }, { status: 400 });
    }
    if (title.length > 120 || text.length > 50000) {
      return NextResponse.json({ error: 'story is too large' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('stories')
      .insert({ title, theme, description, body: text, demo: false })
      .select('id, title, theme, description, body, demo')
      .single();

    if (error) throw error;

    const { body: storyBody, ...rest } = data;
    return NextResponse.json({ story: { ...rest, text: storyBody } }, { status: 201 });
  } catch (err) {
    console.error('[/api/stories POST]', err);
    return NextResponse.json({ error: 'Failed to save story' }, { status: 500 });
  }
}
