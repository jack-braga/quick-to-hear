import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// GitHub Pages serves this project under a sub-path; every runtime/public asset
// must resolve through `import.meta.env.BASE_URL`, and the PWA's navigateFallback /
// start_url / scope must all carry the base (the gotcha local-ledger already solved).
const BASE = '/quick-to-hear/';
// A regex matching the runtime-cached Bible routes under BASE, derived so it can't drift.
// NOT anchored with `^`: a workbox `RegExpRoute` tests the matcher against the **full href**
// (e.g. `https://host/quick-to-hear/bibles/…`), so an anchored `^/quick-to-hear/…` would
// never match. The un-anchored form matches the path segment as a substring, which also
// satisfies the navigate-fallback denylist (matched against the pathname).
const BIBLES_RE = new RegExp(BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 'bibles/');

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE,
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      // `prompt`: a new deployed version surfaces a "Reload" toast rather than reloading
      // silently, so the user controls when their in-progress study reloads (Stage 10).
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: `${BASE}index.html`,
        // Navigations to Bible JSON must hit the runtime cache / network, never fall back
        // to the app shell (which would poison the cache with index.html for a book URL).
        navigateFallbackDenylist: [BIBLES_RE],
        cleanupOutdatedCaches: true,
        // Full Bibles blow the 2 MiB precache budget, so they are runtime-cached per book
        // (not precached): a book fetched once stays available offline for a year.
        runtimeCaching: [
          {
            // Must be a RegExp, NOT a closure: `generateSW` stringifies the matcher into the
            // SW verbatim, so a `({url}) => url.pathname.startsWith(`${BASE}…`)` arrow would
            // reference an undefined `BASE` at runtime and silently never match (the bug that
            // left Bibles un-cached since Stage 2). A RegExp serialises intact.
            urlPattern: BIBLES_RE,
            handler: 'CacheFirst',
            options: {
              cacheName: 'qth-bibles',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Quick to Hear — Bible study workbook',
        short_name: 'Quick to Hear',
        description:
          'A free, static, account-less browser workbook for preparing a Bible study: from a passage reference to a printable handout and leader’s notes.',
        theme_color: '#020817',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        icons: [
          // Raster PNGs (generated from icon.svg via `npm run build:icons`) for install
          // targets that don't take an SVG; the SVG stays as the scalable "any" icon.
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
