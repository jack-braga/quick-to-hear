import { downloadTextFile, slugify } from '@/lib/download';
import { emptyStudyBuild, studyLabel, type Question, type Study, type SupportPassage } from '@/types/study';
import { annotationMinutes } from '@/v2/annotations';
import { orderedQuestions } from '@/v2/build';
import { orderedOutput, supportFor } from '@/v2/exportModel';
import { handoutMarkdown, leaderMarkdown } from '@/v2/exportMarkdown';
import { resolveImageDataUrls } from '@/v2/print/supportTexts';

/**
 * Audit adapter — project a v2 study (`annotations` + `runningOrder`) onto the v1-shaped `Study`
 * that the tested audit (`auditResults` / `coverageMap`) reads, so the Check lens audits the v2 study
 * without duplicating the audit. (The v1 handout/leader export models this projection once also fed
 * were removed with v1; the actual v2 documents render from `exportModel` — see `exportMarkdown` /
 * `print/ExportPreview` — not from this projection.)
 *
 * The v1 audit reads `build.questions` (ordered), `build.supportPassages`, `map.sections`, etc. This
 * pure projection fills a v1-shaped `build` from the **same v2 data the exported document renders
 * from** (`exportModel`), so the audit certifies what actually prints (§1.2):
 *  - question annotations → `build.questions` in the running order, each carrying its **real minutes**
 *    (the Build lens' `estimateMinutes`, via `annotationMinutes`) so the time check matches the export
 *    rather than collapsing every question to the medium weight bucket;
 *  - the included references on each output item (a question's attached `mentions`, a study note's
 *    inline `@`-mentions marked **include-for-group** — the exact source `exportModel.supportFor`
 *    uses) → `build.supportPassages`; a question's are attached (quoted, timed), a study note's are a
 *    background box; a prep-only mention (the default) prints nothing (cross-ref collapse);
 *  - an optional study **title** becomes the document heading.
 *
 * Theme/aim, intro, and the prayer point arrive with the Theme & aim lens; until then they're
 * empty (the handout/leader render fine without them).
 */
export function projectForExport(study: Study): Study {
  // Match what actually exports: `exportModel` drops any question held back via the "in study" toggle
  // (`reserved`), so the audit must drop them too — otherwise coverage, type-balance, know/feel/do,
  // expected-answer and load-bearing all certify questions the document never shows.
  const ordered = orderedQuestions(study.annotations, study.runningOrder).filter((a) => !a.reserved);

  const questions: Question[] = ordered.map((a) => ({
    id: a.id,
    text: a.text,
    anchor: { verseIds: a.verseIds },
    type: a.questionType ?? 'observation',
    expectedAnswer: a.expectedAnswer ?? '',
    weight: a.weight ?? 'medium',
    minutes: annotationMinutes(a), // real per-question minutes → the time check matches the export
    loadBearing: a.loadBearing ?? false,
    ...(a.gospelPlain ? { gospelPlain: true } : {}),
    ...(a.aimComponent ? { aimComponent: a.aimComponent } : {}),
  }));

  // The support passages that print, derived from the SAME source the export uses (`supportFor`):
  // a question's included `mentions` (attached → quoted, timed) + a study note's inline included
  // `@`-mentions (a background box). One entry per (item, reference) — matching how the export
  // counts a question's own references — so the time check lines up with the document.
  const supportPassages: SupportPassage[] = [];
  for (const item of orderedOutput(study.annotations, study.runningOrder).filter((a) => !a.reserved)) {
    for (const ref of supportFor(item)) {
      supportPassages.push({
        id: `${item.id}:${ref.osis}`,
        reference: ref.reference,
        type: item.kind === 'question' ? ('quoted' as const) : ('background' as const),
        text: null,
        ...(item.kind === 'question' ? { attachedToQuestionId: item.id } : {}),
      });
    }
  }

  return {
    ...study,
    setup: { ...study.setup, reference: study.setup.title.trim() || study.setup.reference },
    build: {
      ...emptyStudyBuild(),
      questions,
      order: questions.map((q) => q.id),
      supportPassages,
      prayerPoint: study.prayerPoint,
    },
  };
}

/** The markdown downloads render from the v2 {@link exportModel} (study notes + item references +
 *  interleaved blocks), the same model the on-screen preview and print routes use. */
function baseName(study: Study): string {
  return slugify(studyLabel({ reference: study.setup.title || study.setup.reference }));
}

export async function downloadV2Handout(study: Study): Promise<void> {
  const imageUrls = await resolveImageDataUrls(study);
  downloadTextFile(`${baseName(study)}-handout.md`, handoutMarkdown(study, imageUrls));
}

export async function downloadV2Leader(study: Study): Promise<void> {
  const imageUrls = await resolveImageDataUrls(study);
  downloadTextFile(`${baseName(study)}-leader.md`, leaderMarkdown(study, imageUrls));
}
