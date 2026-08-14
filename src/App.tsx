import { HashRouter } from 'react-router-dom';

import { PwaReloadToast } from '@/components/PwaReloadToast';
import { V2App } from '@/v2/V2App';

/**
 * The app shell. The v2 text-central overhaul is the whole app now; the frozen v1 reference
 * workbook (Stages 0–10) was removed in the cleanup sweep (2026-08). One HashRouter mounts V2App,
 * which owns its own routes + autosave. `PwaReloadToast` registers the service worker and drives
 * the update / offline-ready toast.
 */
export default function App() {
  return (
    <HashRouter>
      <V2App />
      <PwaReloadToast />
    </HashRouter>
  );
}
