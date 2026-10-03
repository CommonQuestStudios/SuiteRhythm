import './globals.css';
import Script from 'next/script';
import GlobalAudioKill from '../components/GlobalAudioKill';
import DebugPerfPanel from '../components/DebugPerfPanel';
import { SITE_URL, SITE_HOST } from '../lib/site';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'SuiteRhythm | Reactive Sound Studio',
  description:
    'Create reactive soundtracks, ambience, and sound effects for tabletop games, storytelling, and creative broadcasts.',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/`,
    title: 'SuiteRhythm | Reactive Sound Studio',
    description:
      'Create reactive soundtracks, ambience, and sound effects for tabletop games, storytelling, and creative broadcasts.',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SuiteRhythm | Reactive Sound Studio',
    description:
      'Create reactive soundtracks, ambience, and sound effects for tabletop games, storytelling, and creative broadcasts.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#8a2be2',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Howler.js is loaded as an npm package (see engine/SuiteRhythm.js) */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* Apply saved theme before first paint to prevent flash */}
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        {/* Plausible Analytics — privacy-friendly, no cookies, no banner needed */}
        <script defer data-domain={SITE_HOST} src="https://plausible.io/js/script.js" />
      </head>
      <body>
        {/* Global zombie-audio killer — runs on every route, including landing. */}
        <GlobalAudioKill />
        {/* Debug perf panel — only activates with ?debug=1 in the URL. */}
        <DebugPerfPanel />
        {children}
        {/* Toast notification container — rendered at body level so toasts layer over modals */}
        <div id="toastContainer" className="toast-container" aria-live="polite" />
      </body>
    </html>
  );
}
