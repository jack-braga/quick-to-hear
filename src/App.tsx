import { HashRouter, Route, Routes } from 'react-router-dom';

import { Layout } from '@/components/Layout';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';

// HashRouter avoids GitHub Pages deep-link/refresh 404s (PLAN §2). The base path
// lives in the URL before the hash, so no basename is needed here. Study/phase and
// print routes are added from Stage 1 onward.
export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
