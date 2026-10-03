/**
 * POST /api/admin/generated-sounds/promote
 * Promotes a cached ElevenLabs-generated sound into the permanent `sounds`
 * catalog table so it becomes searchable like any other library sound.
 *
 * Body: { id: string }  — the generated_sounds row id.
 * Requires ADMIN_API_SECRET via the `x-admin-secret` header.
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/api-auth.js';
import { promoteGeneratedSound } from '../../../../../lib/generated-sound-store.js';

export async function POST(request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });

  try {
    const result = await promoteGeneratedSound(id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[/api/admin/generated-sounds/promote]', err);
    return NextResponse.json({ ok: false, error: 'Promotion failed' }, { status: 500 });
  }
}
