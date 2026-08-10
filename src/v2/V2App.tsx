import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { useAutosave } from '@/hooks/useAutosave';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import { ReaderShell } from '@/v2/ReaderShell';
import Home from '@/v2/pages/Home';
import NotFound from '@/v2/pages/NotFound';
import PrintHandout from '@/v2/pages/PrintHandout';
import PrintLeader from '@/v2/pages/PrintLeader';
import Styleguide from '@/v2/pages/Styleguide';

/**
 * The v2 app (default, at `/`). It reuses v1's store + autosave (studies are shared) and the
 * pure libs; only the shell is new. `useAutosave` is mounted once inside the router so edits
 * flush on route change and tab-hide, exactly as v1 does.
 */
function ReaderRoute() {
  const { id = '' } = useParams();
  const { study, loading } = useOpenStudy(id);

  if (!study) {
    return (
      <div className="grid min-h-dvh place-items-center bg-desk px-6 text-center text-ink">
        <div>
          <p className="font-scripture text-[24px]">{loading ? 'Opening…' : 'That study isn’t here.'}</p>
          {!loading && (
            <a
              href="#/"
              className="mt-5 inline-block rounded-lg bg-lapis px-4 py-2 font-sans text-[14px] font-medium text-white hover:opacity-90 dark:text-[#10131a]"
            >
              ← Back to your studies
            </a>
          )}
        </div>
      </div>
    );
  }
  return <ReaderShell study={study} />;
}

export function V2App() {
  useAutosave();
  return (
    <Routes>
      {/* Bare print-CSS pages (outside the shell), like v1. */}
      <Route path="/print/:id/handout" element={<PrintHandout />} />
      <Route path="/print/:id/leader" element={<PrintLeader />} />
      <Route path="/" element={<Home />} />
      <Route path="/styleguide" element={<Styleguide />} />
      <Route path="/study/:id" element={<StudyIndexRedirect />} />
      <Route path="/study/:id/reader" element={<ReaderRoute />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/** `/study/:id` → the reader (deep links + old bookmarks land on the canvas). */
function StudyIndexRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={`/study/${id}/reader`} replace />;
}
