import { serializeStudy } from '@/lib/storage';
import { studyLabel, type Study } from '@/types/study';

/** Slug for a downloaded file name (kept short, filesystem-safe). */
export function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'study'
  );
}

/** Trigger a browser download of the study's re-importable project file (SPEC §4). */
export function downloadProjectFile(study: Study): void {
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
