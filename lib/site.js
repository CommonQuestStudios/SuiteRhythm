// Canonical public origin. Override with NEXT_PUBLIC_SITE_URL when the app
// moves to a custom domain so metadata, sitemap, and analytics follow.
const DEFAULT_SITE_URL = 'https://suiterhythm.vercel.app';

function normalize(value) {
  const raw = String(value || '').trim();
  if (!/^https?:\/\//i.test(raw)) return DEFAULT_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = normalize(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_HOST = new URL(SITE_URL).host;
