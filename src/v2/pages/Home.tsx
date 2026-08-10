import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useStudyStore } from '@/store/study';
import { studyLabel } from '@/types/study';
import { DayNightToggle } from '@/v2/DayNightToggle';
import { Help } from '@/v2/Help';

/**
 * The v2 landing (ROADMAP-v2 §2) — the leaf-on-a-desk aesthetic applied to the study list.
 * v2 is the default app at `/`; the frozen v1 workbook lives under `/v1/`. Studies are shared
 * (same store / IndexedDB) — v2.2 doesn't change the schema, so a study opens in either app.
 */
export default function Home() {
  const navigate = useNavigate();
  const studies = useStudyStore((s) => s.studies);
  const status = useStudyStore((s) => s.status);
  const error = useStudyStore((s) => s.error);
  const refreshStudies = useStudyStore((s) => s.refreshStudies);
  const createStudy = useStudyStore((s) => s.createStudy);
  const deleteStudy = useStudyStore((s) => s.deleteStudy);
  const importProjectFile = useStudyStore((s) => s.importProjectFile);
  const clearError = useStudyStore((s) => s.clearError);

  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    void refreshStudies();
  }, [refreshStudies]);

  const onNew = async () => {
    const study = await createStudy();
    navigate(`/study/${study.id}/reader`);
  };

  const onImport = async (file: File) => {
    clearError();
    await importProjectFile(await file.text());
  };

  return (
    <div className="min-h-dvh bg-desk text-ink">
      <header className="flex h-14 items-center gap-3 border-b border-line bg-[color-mix(in_srgb,var(--desk)_82%,var(--leaf))] px-[22px]">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          Quick&nbsp;to&nbsp;Hear
        </span>
        <span className="font-scripture text-[18px]">a workbook for preparing a Bible study</span>
        <div className="flex-1" />
        <a href="#/about" className="mr-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint hover:text-ink">
          About
        </a>
        <DayNightToggle />
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-12">
        <div className="flex items-center gap-2">
          <h1 className="font-scripture text-[34px] leading-tight">Prepare a Bible study</h1>
          <Help helpKey="home.intro" label="What this is" />
        </div>
        <p className="mt-2 max-w-xl text-[15px] text-ink-soft">
          From a passage reference to a printable handout and leader’s notes — structured,
          prompted, and checked. It never writes your content; it recycles your work forward.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void onNew()}
            className="rounded-lg bg-lapis px-4 py-2 font-sans text-[14px] font-medium text-white hover:opacity-90 dark:text-[#10131a]"
          >
            + New study
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-line bg-panel px-4 py-2 font-sans text-[14px] text-ink-soft hover:border-lapis-edge hover:text-ink"
          >
            Import a project file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = '';
            }}
          />
          <a
            href="#/v1/"
            className="ml-auto font-mono text-[12px] text-ink-faint underline underline-offset-2 hover:text-ink"
          >
            open v1 (archived) →
          </a>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-rubric/40 bg-rubric-wash px-3 py-2 text-[13px] text-rubric">
            {error}
          </p>
        )}

        <div className="mt-10">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            Your studies
          </div>

          {status === 'loading' && studies.length === 0 && (
            <p className="text-[14px] text-ink-soft">Loading…</p>
          )}
          {status !== 'loading' && studies.length === 0 && (
            <p className="rounded-lg border border-dashed border-line p-5 text-[14px] text-ink-soft">
              No studies yet. Start one — it lives only in this browser, so export often.
            </p>
          )}

          <ul className="space-y-2">
            {studies.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-line bg-leaf px-4 py-3 shadow-leaf transition-colors hover:border-lapis-edge"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/study/${s.id}/reader`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate font-scripture text-[18px]">{studyLabel(s)}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                    {s.questionCount} question{s.questionCount === 1 ? '' : 's'}
                    {s.seriesNote ? ` · ${s.seriesNote}` : ''}
                  </div>
                </button>
                {confirmId === s.id ? (
                  <span className="flex items-center gap-2 text-[12px]">
                    <button
                      type="button"
                      onClick={() => {
                        void deleteStudy(s.id);
                        setConfirmId(null);
                      }}
                      className="rounded bg-rubric px-2 py-1 font-medium text-white"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded border border-line px-2 py-1 text-ink-soft"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(s.id)}
                    aria-label={`Delete ${studyLabel(s)}`}
                    className="text-ink-faint hover:text-rubric"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-12 text-[12px] text-ink-faint">
          Runs entirely in your browser — no account, nothing sent to a server. Export your work
          often; it lives only here.
        </p>
      </main>
    </div>
  );
}
