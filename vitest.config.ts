import { defineConfig } from 'vitest/config';
import path from 'path';

// Browser-logic tests: jsdom + fake-indexeddb + a matchMedia stub (theming and
// storage code both need a DOM). Model is krenoda, not local-ledger (whose vitest
// is `node` with no IDB/matchMedia). Playwright e2e lives in `e2e/` and runs
// separately via `npm run test:e2e` — it is NOT part of `npm test`.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // The VitePWA build plugin provides this virtual module; the unit-test config
      // doesn't load that plugin, so point it at an inert stub (see the file's comment).
      'virtual:pwa-register/react': path.resolve(__dirname, './src/test/pwaRegisterReactStub.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
