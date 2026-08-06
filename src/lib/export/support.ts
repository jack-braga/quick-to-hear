import { DEFAULT_TRANSLATION_ID, loadReading } from '@/lib/bible';
import { parseReference } from '@/lib/verse/reference';
import type { ParsedText } from '@/types/passage';
import type { Study } from '@/types/study';

/**
 * Fetch the quoted text of every support passage (SPEC 6f / §4.8: the handout prints
 * quoted passages inline). Support-passage *text* was deferred from Stage 6
 * (`SupportPassage.text` is null); the export resolves it on demand from the same bundled
 * loader the reading uses, in the study's primary translation.
 *
 * Returns a map keyed by support-passage id. An unparseable reference or a cross-book
 * range resolves to `null` (the export then shows the reference alone) — a missing quote
 * must never block the export.
 */
export async function resolveSupportTexts(
  study: Study,
): Promise<Record<string, ParsedText | null>> {
  const out: Record<string, ParsedText | null> = {};
  if (study.build.format !== 'study') return out;

  const translationId = study.setup.primaryTranslationId ?? DEFAULT_TRANSLATION_ID;

  await Promise.all(
    study.build.supportPassages.map(async (sp) => {
      const ref = parseReference(sp.reference);
      if (!ref) {
        out[sp.id] = null;
        return;
      }
      try {
        out[sp.id] = await loadReading(translationId, ref);
      } catch {
        out[sp.id] = null; // never let a failed fetch block the export
      }
    }),
  );

  return out;
}
