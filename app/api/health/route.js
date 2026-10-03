/**
 * GET /api/health
 * Health-check that verifies connectivity to all services.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase.js';
import { getCatalogFiles } from '../../../lib/catalog-source.js';

const CHECK_TIMEOUT_MS = 5_000;

function withTimeout(promise, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), CHECK_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function GET() {
  const checks = { supabase: 'unknown', r2: 'unknown', catalog: 'unknown' };

  // Supabase
  try {
    const { error } = await withTimeout(supabaseAdmin.from('sounds').select('name').limit(1), 'supabase');
    checks.supabase = error ? 'error' : 'ok';
  } catch (_) { checks.supabase = 'error'; }

  // Which catalog the app is actually serving right now.
  try {
    const { files, source } = await withTimeout(getCatalogFiles(), 'catalog');
    checks.catalog = `${source} (${files.length} sounds)`;
  } catch (_) { checks.catalog = 'error'; }

  // Cloudflare R2 — optional; only check if credentials are configured
  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
    try {
      const { listFiles } = await import('../../../lib/r2.js');
      const files = await withTimeout(listFiles(''), 'r2');
      checks.r2 = `ok (${files.length} files)`;
    } catch (_) { checks.r2 = 'error'; }
  } else {
    checks.r2 = 'skipped (no credentials)';
  }

  const degraded = checks.supabase === 'error' || checks.r2 === 'error' || checks.catalog === 'error';
  return NextResponse.json({
    status: degraded ? 'degraded' : 'ok',
    service: 'SuiteRhythm',
    timestamp: new Date().toISOString(),
    checks,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
