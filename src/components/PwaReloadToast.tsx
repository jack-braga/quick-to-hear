import { useRegisterSW } from 'virtual:pwa-register/react';

import { Button } from '@/components/ui/button';

/**
 * The PWA update / offline-ready toast (Stage 10). With `registerType: 'prompt'` the
 * service worker installs an update but waits — this surfaces a "New version available"
 * toast with a Reload button so the user chooses when their in-progress study reloads
 * (never mid-edit without consent). A one-time "Ready to work offline" notice confirms the
 * app shell is cached. `useRegisterSW` registers the SW on mount.
 *
 * Rendered near the app root so it survives route changes. In unit tests the virtual
 * module is aliased to an inert stub (see vitest.config.ts), so this renders nothing.
 */
export function PwaReloadToast() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="pwa-toast"
      className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[min(92vw,26rem)] items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-lg"
    >
      <span className="flex-1">
        {needRefresh ? 'A new version is available.' : 'Ready to work offline.'}
      </span>
      {needRefresh && (
        <Button size="sm" onClick={() => void updateServiceWorker(true)} data-testid="pwa-reload">
          Reload
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={dismiss} data-testid="pwa-dismiss">
        Dismiss
      </Button>
    </div>
  );
}
