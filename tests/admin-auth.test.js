import { afterEach, describe, expect, it } from 'vitest';
import { requireAdmin } from '../lib/api-auth.js';

const originalAdminSecret = process.env.ADMIN_API_SECRET;
const originalPublicBetaAccess = process.env.PUBLIC_BETA_ACCESS;

afterEach(() => {
  if (originalAdminSecret === undefined) delete process.env.ADMIN_API_SECRET;
  else process.env.ADMIN_API_SECRET = originalAdminSecret;
  if (originalPublicBetaAccess === undefined) delete process.env.PUBLIC_BETA_ACCESS;
  else process.env.PUBLIC_BETA_ACCESS = originalPublicBetaAccess;
});

function request(headers = {}) {
  return new Request('https://example.test/api/admin/x', { method: 'POST', headers });
}

describe('requireAdmin', () => {
  it('is disabled (503) when ADMIN_API_SECRET is not configured, even in public beta', () => {
    delete process.env.ADMIN_API_SECRET;
    delete process.env.PUBLIC_BETA_ACCESS;
    expect(requireAdmin(request())?.status).toBe(503);
    expect(requireAdmin(request({ authorization: 'Bearer public-beta-access' }))?.status).toBe(503);
  });

  it('rejects missing, wrong, and public beta credentials', () => {
    process.env.ADMIN_API_SECRET = 'correct-horse-battery-staple';
    expect(requireAdmin(request())?.status).toBe(401);
    expect(requireAdmin(request({ 'x-admin-secret': 'nope' }))?.status).toBe(401);
    expect(requireAdmin(request({ 'x-admin-secret': 'correct-horse-battery-stapl' }))?.status).toBe(401);
    expect(requireAdmin(request({ authorization: 'Bearer public-beta-access' }))?.status).toBe(401);
  });

  it('accepts the secret via x-admin-secret or a bearer header', () => {
    process.env.ADMIN_API_SECRET = 'correct-horse-battery-staple';
    expect(requireAdmin(request({ 'x-admin-secret': 'correct-horse-battery-staple' }))).toBeNull();
    expect(requireAdmin(request({ authorization: 'Bearer correct-horse-battery-staple' }))).toBeNull();
  });
});
