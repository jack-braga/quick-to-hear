import { DEFAULT_TRANSLATION_ID, loadReading } from '@/lib/bible';
import { parseReference } from '@/lib/verse/reference';
import type { ParsedText } from '@/types/passage';
import type { Study } from '@/types/study';
import { exportModel } from '@/v2/exportModel';

/**
 * Fetch the quoted text of every included support passage in the v2 export, keyed by the mention's
 * OSIS (the key {@link ExportPreview} looks it up by). The in-app preview omits this and shows the
 * reference alone; the print routes resolve it so the passage prints inline (SPEC 6f). An
 * unparseable reference or a failed fetch resolves to `null` — a missing quote never blocks export.
 */
export async function resolveSupportTextsV2(study: Study): Promise<Record<string, ParsedText | null>> {
  const out: Record<string, ParsedText | null> = {};
  const translationId = study.setup.primaryTranslationId ?? DEFAULT_TRANSLATION_ID;
  const refs = exportModel(study).blocks.flatMap((b) => b.support);

  await Promise.all(
    refs.map(async (s) => {
      if (s.osis in out) return;
      const ref = parseReference(s.reference);
      if (!ref) {
        out[s.osis] = null;
        return;
      }
      try {
        out[s.osis] = await loadReading(translationId, ref);
      } catch {
        out[s.osis] = null;
      }
    }),
  );
  return out;
}
