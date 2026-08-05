import { Download, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { downloadProjectFile } from '@/lib/download';
import { useStudyStore } from '@/store/study';
import { studyLabel, type Study } from '@/types/study';

/**
 * The header shared by every study screen: title (the reference), a live save chip,
 * the multi-tab conflict banner, and export/delete. One place so the phase pages stay
 * about their phase.
 */
export function StudyHeader({ study }: { study: Study }) {
  const navigate = useNavigate();
  const dirty = useStudyStore((s) => s.dirty);
  const conflict = useStudyStore((s) => s.conflict);
  const deleteStudy = useStudyStore((s) => s.deleteStudy);
  const reloadCurrent = useStudyStore((s) => s.reloadCurrent);

  const onDelete = async () => {
    await deleteStudy(study.id);
    navigate('/');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to="/" className="text-xs text-muted-foreground underline underline-offset-2">
            ← Your studies
          </Link>
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {studyLabel({ reference: study.setup.reference })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground" aria-live="polite" data-testid="save-state">
            {dirty ? 'Saving…' : 'Saved'}
          </span>
          <Button variant="outline" size="sm" onClick={() => downloadProjectFile(study)}>
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
    </div>
  );
}
