import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// GitHub Pages serves this project under a sub-path; every runtime/public asset
// must resolve through `import.meta.env.BASE_URL`, and the PWA's navigateFallback /
// start_url / scope must all carry the base (the gotcha local-ledger already solved).
const BASE = '/quick-to-hear/';

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
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: `${BASE}index.html`,
        // Full Bibles blow the 2 MiB precache budget, so they are runtime-cached,
        // not precached. This is a stub route: `public/bibles/**` lands in M1 (Stage 2).
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith(`${BASE}bibles/`),
            handler: 'CacheFirst',
            options: {
              cacheName: 'qth-bibles',
              expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 365 },
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
        // Scalable placeholder icon (Stage 0). Raster PNGs are added in the PWA
        // hardening stage (Stage 10). SVG covers install + favicon in the meantime.
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
