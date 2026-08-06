import { findTranslation } from '@/lib/bible';
import { comaContent, translationCopyright, trapsContent } from '@/lib/content';
import { downloadTextFile, slugify } from '@/lib/download';
import { studyLabel, type Study } from '@/types/study';
import type { ParsedText } from '@/types/passage';
import { handoutModel, leaderModel, type ExportOptions } from './model';
import { handoutToMarkdown, leaderToMarkdown } from './markdown';
import { resolveSupportTexts } from './support';

export * from './model';
export * from './markdown';
export { resolveSupportTexts } from './support';

/** The method/COMA attribution lines shown in the leader's notes (SPEC §7 — credits travel
 *  with the content). Read from the shipped method files, so they can't drift. */
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
 * Assemble the {@link ExportOptions} for a study given already-fetched support texts:
 * the exact translation copyright line (Inviolable rule 7), the translation display name,
 * and the method attributions. Pure/sync — the async fetch is {@link resolveSupportTexts}.
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

/** Resolve support texts + options in one step (used by the async markdown downloads). */
async function resolveOptions(study: Study): Promise<ExportOptions> {
  const supportTexts = await resolveSupportTexts(study);
  return exportOptions(study, supportTexts);
}

export async function buildHandoutMarkdown(study: Study): Promise<string> {
  return handoutToMarkdown(handoutModel(study, await resolveOptions(study)));
}

export async function buildLeaderMarkdown(study: Study): Promise<string> {
  return leaderToMarkdown(leaderModel(study, await resolveOptions(study)));
}

function baseName(study: Study): string {
  return slugify(studyLabel({ reference: study.setup.reference }));
}

export async function downloadHandoutMarkdown(study: Study): Promise<void> {
  downloadTextFile(`${baseName(study)}-handout.md`, await buildHandoutMarkdown(study));
}

export async function downloadLeaderMarkdown(study: Study): Promise<void> {
  downloadTextFile(`${baseName(study)}-leader.md`, await buildLeaderMarkdown(study));
}
