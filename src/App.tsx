import { HashRouter, Route, Routes } from 'react-router-dom';

import { Layout } from '@/components/Layout';
import { useAutosave } from '@/hooks/useAutosave';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import StudyOverview from '@/pages/StudyOverview';

// HashRouter avoids GitHub Pages deep-link/refresh 404s (PLAN §2). The base path
// lives in the URL before the hash, so no basename is needed here. `useAutosave` is
// mounted once inside the router (it flushes on route change).
function AppRoutes() {
  useAutosave();
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/study/:id" element={<StudyOverview />} />
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
