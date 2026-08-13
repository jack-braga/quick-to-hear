import { collectStudyImages, serializeStudy } from '@/lib/storage';
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

/** Trigger a browser download of arbitrary text (markdown exports, etc.). */
export function downloadTextFile(filename: string, text: string, mime = 'text/markdown'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Trigger a browser download of the study's re-importable project file (SPEC §4). Async because it
 *  fetches the attached-image bytes from IndexedDB and embeds them (base64) so the file is portable. */
export async function downloadProjectFile(study: Study): Promise<void> {
  const images = await collectStudyImages(study.id);
  downloadTextFile(
    `${slugify(studyLabel({ reference: study.setup.reference }))}.qth.json`,
    serializeStudy(study, images),
    'application/json',
  );
}
