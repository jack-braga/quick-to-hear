import { useState } from 'react';

/**
 * Test-only stand-in for `virtual:pwa-register/react` (aliased in vitest.config.ts). The
 * real virtual module is provided by the VitePWA build plugin, which the unit-test config
 * doesn't load — so this inert hook lets components that show the update toast render in
 * jsdom without a service worker. It never signals an update or offline-ready state.
 */
export function useRegisterSW() {
  const offlineReady = useState(false);
  const needRefresh = useState(false);
  return {
    offlineReady,
    needRefresh,
    updateServiceWorker: async (_reloadPage?: boolean): Promise<void> => {},
  };
}
