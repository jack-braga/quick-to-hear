import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';

import { Layout } from '@/components/Layout';
import { useAutosave } from '@/hooks/useAutosave';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import Phase1Setup from '@/pages/Phase1Setup';
import Phase2Read from '@/pages/Phase2Read';
import Phase3Map from '@/pages/Phase3Map';

/** `/study/:id` → the first phase (deep links + old bookmarks still work). */
function StudyIndexRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={`/study/${id}/1`} replace />;
}

// HashRouter avoids GitHub Pages deep-link/refresh 404s (PLAN §2). `useAutosave` is
// mounted once inside the router (it flushes on route change). Phases 4–7 land in later
// stages; their routes fall through to NotFound until then.
function AppRoutes() {
  useAutosave();
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/study/:id" element={<StudyIndexRedirect />} />
        <Route path="/study/:id/1" element={<Phase1Setup />} />
        <Route path="/study/:id/2" element={<Phase2Read />} />
        <Route path="/study/:id/3" element={<Phase3Map />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
