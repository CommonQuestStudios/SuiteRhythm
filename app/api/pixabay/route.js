/**
 * GET /api/pixabay
 * Server-side proxy for Pixabay Audio API.
 * Keeps the API key secret on the server — clients never see it.
 *
 * Query params (forwarded to Pixabay):
 *   q        – search query (required)
 *   category – 'music' or '' (optional)
 *   min_duration – int seconds (optional)
 *   max_duration – int seconds (optional)
 *   per_page – int (optional, default 5)
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/api-auth.js';
import { checkRateLimit, rateLimitHeaders } from '../../../lib/rate-limit.js';
import { fetchWithTimeout } from '../../../lib/fetch-with-timeout.js';

const PIXABAY_KEY = process.env.PIXABAY_API_KEY;
const UPSTREAM_UNAVAILABLE_STATUSES = new Set([401, 403, 429]);
const UPSTREAM_TIMEOUT_MS = 10_000;

export async function GET(request) {
  const denied = requireAuth(request);
  if (denied) return denied;

  const rate = checkRateLimit(request, {
    namespace: 'pixabay',
    limit: 30,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again shortly.' },
      { status: 429, headers: rateLimitHeaders(rate) }
    );
  }

  if (!PIXABAY_KEY) {
    return NextResponse.json(emptyProviderResult('missing_key'), { headers: rateLimitHeaders(rate) });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
  }
  if (q.length > 80) {
    return NextResponse.json({ error: 'Search query is too long' }, { status: 400 });
  }

  // Build safe param set — only forward allowed keys
  const allowed = ['q', 'category', 'min_duration', 'max_duration', 'per_page'];
  const params = new URLSearchParams({ key: PIXABAY_KEY, safesearch: 'true' });
  for (const key of allowed) {
    const val = searchParams.get(key);
    if (val !== null && val !== '') params.set(key, val);
  }
  const perPage = Math.max(1, Math.min(10, parseInt(params.get('per_page') || '5', 10) || 5));
  params.set('per_page', String(perPage));

  try {
    const res = await fetchWithTimeout(`https://pixabay.com/api/audio/?${params}`, {
      headers: { 'Accept': 'application/json' },
    }, UPSTREAM_TIMEOUT_MS);

    if (!res.ok) {
      const upstreamStatus = res.status;
      const providerUnavailable = UPSTREAM_UNAVAILABLE_STATUSES.has(upstreamStatus);
      return NextResponse.json(
        providerUnavailable
          ? emptyProviderResult('upstream_unavailable', upstreamStatus)
          : { error: `Pixabay upstream error (${upstreamStatus})`, upstreamStatus },
        {
          status: providerUnavailable ? 200 : 502,
          headers: {
            ...rateLimitHeaders(rate),
            'X-Pixabay-Upstream-Status': String(upstreamStatus),
          },
        }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { headers: rateLimitHeaders(rate) });
  } catch (err) {
    console.error('[/api/pixabay]', err);
    return NextResponse.json({ error: 'Pixabay request failed' }, { status: 502 });
  }
}

function emptyProviderResult(reason, upstreamStatus = 0) {
  return {
    total: 0,
    totalHits: 0,
    hits: [],
    providerUnavailable: true,
    reason,
    ...(upstreamStatus ? { upstreamStatus } : {}),
  };
}
