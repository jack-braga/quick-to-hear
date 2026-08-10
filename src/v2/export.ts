import { downloadHandoutMarkdown, downloadLeaderMarkdown } from '@/lib/export';
import { emptyStudyBuild, type Question, type Study, type SupportPassage } from '@/types/study';
import { orderedQuestions } from '@/v2/build';

/**
 * Export adapter (v2.7) — project a v2 study onto the v1 export **model** so the whole tested
 * export pipeline (`handoutModel`/`leaderModel` → markdown + print) is reused unchanged.
 *
 * The v2 authoring model is `annotations` + `runningOrder`; the v1 export reads `build.questions`
 * (ordered), `build.supportPassages`, `map.sections`, etc. This pure projection fills a v1-shaped
 * `build` from the v2 data:
 *  - question annotations → `build.questions` in the running order (missing type/weight get sane
 *    defaults; the expected answer carries the SPEC-6e discipline into the leader's notes);
 *  - cross-reference annotations → `build.supportPassages`, attached to a question that shares
 *    their verses (so they print at that question's point of need), else kept as a background box;
 *  - an optional study **title** becomes the document heading.
 *
 * Theme/aim, intro, and the prayer point arrive with the Theme & aim lens; until then they're
 * empty (the handout/leader render fine without them).
 */
export function projectForExport(study: Study): Study {
  const ordered = orderedQuestions(study.annotations, study.runningOrder);

  const questions: Question[] = ordered.map((a) => ({
    id: a.id,
    text: a.text,
    anchor: { verseIds: a.verseIds },
    type: a.questionType ?? 'observation',
    expectedAnswer: a.expectedAnswer ?? '',
    weight: a.weight ?? 'medium',
    loadBearing: a.loadBearing ?? false,
    ...(a.gospelPlain ? { gospelPlain: true } : {}),
    ...(a.aimComponent ? { aimComponent: a.aimComponent } : {}),
  }));

  const crossRefs = study.annotations.filter(
    (a) => a.kind === 'cross-ref' && (a.reference ?? '').trim().length > 0,
  );
  const supportPassages: SupportPassage[] = crossRefs.map((a) => {
    const host = ordered.find((q) => q.verseIds.some((v) => a.verseIds.includes(v)));
    return {
      id: a.id,
      reference: (a.reference ?? '').trim(),
      type: host ? ('quoted' as const) : ('background' as const),
      text: null,
      ...(host ? { attachedToQuestionId: host.id } : {}),
      ...(a.returnQuestion?.trim() ? { returnQuestion: a.returnQuestion.trim() } : {}),
    };
  });

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

export function downloadV2Handout(study: Study): Promise<void> {
  return downloadHandoutMarkdown(projectForExport(study));
}

export function downloadV2Leader(study: Study): Promise<void> {
  return downloadLeaderMarkdown(projectForExport(study));
}
