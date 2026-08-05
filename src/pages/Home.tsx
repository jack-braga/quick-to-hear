import { useEffect, useRef, useState } from 'react';
import { FileUp, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { GuidancePlaceholder } from '@/components/GuidancePlaceholder';
import { Button } from '@/components/ui/button';
import { useStorageEstimate } from '@/hooks/useStorageEstimate';
import { useStudyStore } from '@/store/study';
import { studyLabel } from '@/types/study';

function formatBytes(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

function DurabilityNotice() {
  const { estimate } = useStorageEstimate();
  const pct = estimate.fraction != null ? Math.round(estimate.fraction * 100) : null;
  return (
    <section className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
      <p>
        Your studies live <strong>only in this browser</strong> — nothing is sent to a server, and
        clearing site data will erase them. Export a study as a project file to back it up or hand
        it to someone else.
      </p>
      <p className="mt-2">
        Storage used: <span className="tabular-nums">{formatBytes(estimate.usageBytes)}</span>
        {estimate.quotaBytes != null && (
          <>
            {' '}
            of <span className="tabular-nums">{formatBytes(estimate.quotaBytes)}</span>
            {pct != null && <> ({pct}%)</>}
          </>
        )}
        {estimate.persisted === true && ' · storage is persistent'}
        {estimate.persisted === false && ' · storage is not yet persistent'}
      </p>
    </section>
  );
}

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

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void refreshStudies();
  }, [refreshStudies]);

  const onNew = async () => {
    const study = await createStudy();
    navigate(`/study/${study.id}`);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    const text = await file.text();
    const result = await importProjectFile(text);
    if (result.ok) navigate(`/study/${result.study.id}`);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Prepare a Bible study</h1>
        <p className="max-w-2xl text-muted-foreground">
          A workbook that takes you from a passage reference to two printable documents — a
          participant handout and leader&rsquo;s notes. It structures, prompts, and checks your
          work; it never writes your content for you.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button onClick={onNew}>
            <Plus aria-hidden />
            New study
          </Button>
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <FileUp aria-hidden />
            Import project file
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json,.qth.json"
            className="sr-only"
            aria-label="Import project file"
            onChange={onImportFile}
          />
        </div>
        <GuidancePlaceholder helpKey="home.intro" />
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="shrink-0 font-medium underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your studies
        </h2>

        {studies.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {status === 'loading'
              ? 'Loading…'
              : 'No studies yet. Start one with “New study”, or import a project file.'}
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {studies.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-4 bg-card p-4 text-card-foreground"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/study/${s.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate font-medium">{studyLabel(s)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {s.seriesNote && <span>{s.seriesNote} · </span>}
                    {s.questionCount} question{s.questionCount === 1 ? '' : 's'} · updated{' '}
                    {formatWhen(s.updatedAt)}
                  </span>
                </button>

                {confirmId === s.id ? (
                  <span className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Delete?</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        await deleteStudy(s.id);
                        setConfirmId(null);
                      }}
                    >
                      Delete
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                      Cancel
                    </Button>
                  </span>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${studyLabel(s)}`}
                    onClick={() => setConfirmId(s.id)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <DurabilityNotice />
    </div>
  );
}
