import { useEffect } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { GuidancePlaceholder } from '@/components/GuidancePlaceholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { serializeStudy } from '@/lib/storage';
import { useStudyStore } from '@/store/study';
import { studyLabel, type Study } from '@/types/study';

function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'study'
  );
}

function downloadProjectFile(study: Study): void {
  const blob = new Blob([serializeStudy(study)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(studyLabel({ reference: study.setup.reference }))}.qth.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function StudyOverview() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const current = useStudyStore((s) => s.current);
  const status = useStudyStore((s) => s.status);
  const dirty = useStudyStore((s) => s.dirty);
  const conflict = useStudyStore((s) => s.conflict);
  const openStudy = useStudyStore((s) => s.openStudy);
  const updateSetup = useStudyStore((s) => s.updateSetup);
  const deleteStudy = useStudyStore((s) => s.deleteStudy);
  const reloadCurrent = useStudyStore((s) => s.reloadCurrent);

  // Load the study on deep-link / refresh, or when switching between studies.
  useEffect(() => {
    if (id && current?.id !== id) void openStudy(id);
  }, [id, current?.id, openStudy]);

  if (current?.id !== id) {
    return (
      <p className="text-sm text-muted-foreground">
        {status === 'loading' ? 'Loading…' : 'Study not found. '}
        {status !== 'loading' && (
          <Link to="/" className="underline underline-offset-2">
            Back to your studies
          </Link>
        )}
      </p>
    );
  }

  const onDelete = async () => {
    await deleteStudy(current.id);
    navigate('/');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to="/" className="text-xs text-muted-foreground underline underline-offset-2">
            ← Your studies
          </Link>
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {studyLabel({ reference: current.setup.reference })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs text-muted-foreground"
            aria-live="polite"
            data-testid="save-state"
          >
            {dirty ? 'Saving…' : 'Saved'}
          </span>
          <Button variant="outline" size="sm" onClick={() => downloadProjectFile(current)}>
            <Download aria-hidden />
            Export
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete this study">
            <Trash2 aria-hidden />
          </Button>
        </div>
      </div>

      {conflict && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm"
        >
          <span>This study was updated in another tab.</span>
          <Button size="sm" variant="outline" onClick={() => void reloadCurrent()}>
            Reload
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        This is a Stage-1 placeholder hub. The real seven-phase workbook (set-up, read, map, COMA,
        theme &amp; aim, questions, audit) is built from Stage 2. For now you can enter a couple of
        set-up fields to prove your work saves and survives a reload.
      </div>

      <section className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="reference" className="text-sm font-medium">
            Passage reference
          </label>
          <Input
            id="reference"
            value={current.setup.reference}
            placeholder="e.g. Luke 1:5–25"
            onChange={(e) => updateSetup({ reference: e.target.value })}
          />
          <GuidancePlaceholder helpKey="p1.reference" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="seriesNote" className="text-sm font-medium">
            Series note <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="seriesNote"
            value={current.setup.seriesNote}
            placeholder="e.g. Week 3 of 8 through Luke 1–2"
            onChange={(e) => updateSetup({ seriesNote: e.target.value })}
          />
          <GuidancePlaceholder helpKey="p1.series" />
        </div>
      </section>
    </div>
  );
}
