import { findTranslation } from '@/lib/bible';
import { comaContent, translationCopyright, trapsContent } from '@/lib/content';
import type { ParsedText } from '@/types/passage';
import type { Study } from '@/types/study';

/**
 * Shared export options — the copyright line, translation name, and method attributions that ride
 * every export (Inviolable rules 7 + 8). Read from the shipped method/translation files so they
 * can't drift.
 *
 * This is all that survived of the old `@/lib/export`: the v1 handout/leader `model.ts`, `markdown.ts`,
 * and support-text fetch were removed with v1 in the cleanup sweep (2026-08). The v2 export model +
 * renderers live in `src/v2/` (`exportModel` / `exportMarkdown` / `print/ExportPreview`), which consume
 * the {@link ExportOptions} this module assembles. Pure/sync.
 */
export interface ExportOptions {
  /** verseId → parsed text for each support passage (fetched at export time). */
  supportTexts?: Record<string, ParsedText | null>;
  /** The exact translation copyright line (Inviolable rule 7) — resolved by the caller. */
  copyrightLine: string;
  /** The primary translation's display name (for the passage credit). */
  translationName: string;
  /** Method/COMA attribution lines shown in the leader's notes (SPEC §7). */
  methodAttributions?: string[];
}

/** The method/COMA attribution lines shown in the leader's notes (SPEC §7 — credits travel with the
 *  content). Read from the shipped method files, so they can't drift. */
function methodAttributions(): string[] {
  const out: string[] = [];
  try {
    out.push(comaContent().attribution);
  } catch {
    /* method file unreadable — omit rather than block the export */
  }
  try {
    out.push(trapsContent().attribution);
  } catch {
    /* ditto */
  }
  return out.filter((a) => a.trim().length > 0);
}

/**
 * Assemble the {@link ExportOptions} for a study given already-fetched support texts: the exact
 * translation copyright line (Inviolable rule 7), the translation display name, and the method
 * attributions.
 */
export function exportOptions(
  study: Study,
  supportTexts: Record<string, ParsedText | null> = {},
): ExportOptions {
  const translationId = study.setup.primaryTranslationId ?? 'webbe';
  return {
    supportTexts,
    copyrightLine: translationCopyright(translationId),
    translationName: findTranslation(translationId)?.name ?? translationId.toUpperCase(),
    methodAttributions: methodAttributions(),
  };
}
