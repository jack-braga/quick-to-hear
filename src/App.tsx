import { useSyncExternalStore } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';

import { Layout } from '@/components/Layout';
import { PwaReloadToast } from '@/components/PwaReloadToast';
import { useAutosave } from '@/hooks/useAutosave';
import Attribution from '@/pages/Attribution';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import Phase1Setup from '@/pages/Phase1Setup';
import Phase2Read from '@/pages/Phase2Read';
import Phase3Map from '@/pages/Phase3Map';
import Phase4Coma from '@/pages/Phase4Coma';
import Phase5ThemeAim from '@/pages/Phase5ThemeAim';
import Phase6Build from '@/pages/Phase6Build';
import Phase7Audit from '@/pages/Phase7Audit';
import PasteReview from '@/pages/PasteReview';
import PrintHandout from '@/pages/print/PrintHandout';
import PrintLeader from '@/pages/print/PrintLeader';
import { V2App } from '@/v2/V2App';

/**
 * Two apps, one HashRouter each (ROADMAP-v2 clean break, owner decision 2026-08-07):
 *  - **v2** is the default, mounted at the root.
 *  - **v1** is frozen as a reference and mounted UNCHANGED under `basename="/v1"`, so every
 *    existing v1 `<Link>` (phases, print, attribution) resolves to `#/v1/…` with no edits.
 *
 * We mount exactly one router at a time, chosen by whether the hash is inside `/v1`. Crossing
 * the boundary uses plain `<a href="#/…">` anchors (they fire `hashchange`, which re-selects
 * the router); routing *within* an app uses normal `<Link>`s and never remounts. A `key`
 * forces a clean remount when the boundary is crossed (basename is read once per router).
 */

function hashPath(): string {
  return window.location.hash.replace(/^#/, '');
}
function isV1Snapshot(): boolean {
  const p = hashPath();
  return p === '/v1' || p.startsWith('/v1/');
}
function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb);
  window.addEventListener('popstate', cb);
  return () => {
    window.removeEventListener('hashchange', cb);
    window.removeEventListener('popstate', cb);
  };
}

// ---------------------------------------------------------------------------------------------
// v1 (frozen reference) — the exact Stage-0..10 route tree, now under basename="/v1".
// ---------------------------------------------------------------------------------------------

function V1StudyIndexRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={`/study/${id}/1`} replace />;
}

function V1Chrome() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function V1App() {
  useAutosave();
  return (
    <Routes>
      <Route path="/print/:id/handout" element={<PrintHandout />} />
      <Route path="/print/:id/leader" element={<PrintLeader />} />
      <Route element={<V1Chrome />}>
        <Route path="/" element={<Home />} />
        <Route path="/attribution" element={<Attribution />} />
        <Route path="/study/:id" element={<V1StudyIndexRedirect />} />
        <Route path="/study/:id/1" element={<Phase1Setup />} />
        <Route path="/study/:id/paste" element={<PasteReview />} />
        <Route path="/study/:id/2" element={<Phase2Read />} />
        <Route path="/study/:id/3" element={<Phase3Map />} />
        <Route path="/study/:id/4" element={<Phase4Coma />} />
        <Route path="/study/:id/5" element={<Phase5ThemeAim />} />
        <Route path="/study/:id/6" element={<Phase6Build />} />
        <Route path="/study/:id/7" element={<Phase7Audit />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const isV1 = useSyncExternalStore(subscribe, isV1Snapshot, () => false);

  if (isV1) {
    return (
      <HashRouter key="v1" basename="/v1">
        <V1App />
        <PwaReloadToast />
      </HashRouter>
    );
  }
  return (
    <HashRouter key="v2">
      <V2App />
      <PwaReloadToast />
    </HashRouter>
  );
}
