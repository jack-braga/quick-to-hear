import { downloadHandoutMarkdown, downloadLeaderMarkdown } from '@/lib/export';
import { emptyStudyBuild, type Question, type Study, type SupportPassage } from '@/types/study';
import { orderedQuestions } from '@/v2/build';
import { mentionKey, parseMentions } from '@/v2/reader/mentions';

/**
 * Export adapter (v2.7) — project a v2 study onto the v1 export **model** so the whole tested
 * export pipeline (`handoutModel`/`leaderModel` → markdown + print) is reused unchanged.
 *
 * The v2 authoring model is `annotations` + `runningOrder`; the v1 export reads `build.questions`
 * (ordered), `build.supportPassages`, `map.sections`, etc. This pure projection fills a v1-shaped
 * `build` from the v2 data:
 *  - question annotations → `build.questions` in the running order (missing type/weight get sane
 *    defaults; the expected answer carries the SPEC-6e discipline into the leader's notes);
 *  - a note's inline `@`-mentions marked **include-for-group** → `build.supportPassages`, attached to
 *    a question that shares the note's verses (so they print at its point of need), else a background
 *    box; a prep-only mention (the default) prints nothing (cross-ref collapse — no standalone card);
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

  // A reference is an inline @-mention inside a note; it prints only when that mention is marked
  // include-for-group. Attach it to a question sharing the host note's verses (its point of need),
  // else a background box. De-duped by OSIS so the same passage prints once.
  const supportPassages: SupportPassage[] = [];
  const seenOsis = new Set<string>();
  for (const note of study.annotations) {
    if (note.kind !== 'note' || !note.mentions) continue;
    const host = ordered.find((q) => q.verseIds.some((v) => note.verseIds.includes(v)));
    for (const seg of parseMentions(note.text)) {
      if (seg.type !== 'mention') continue;
      const osis = mentionKey(seg.ref); // the full multi-span identity (matches the metadata key)
      const meta = note.mentions[osis];
      if (!meta?.includeForGroup || seenOsis.has(osis)) continue;
      seenOsis.add(osis);
      supportPassages.push({
        id: `${note.id}:${osis}`,
        reference: seg.reference,
        type: host ? ('quoted' as const) : ('background' as const),
        text: null,
        ...(host ? { attachedToQuestionId: host.id } : {}),
        ...(meta.returnQuestion?.trim() ? { returnQuestion: meta.returnQuestion.trim() } : {}),
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

export function downloadV2Handout(study: Study): Promise<void> {
  return downloadHandoutMarkdown(projectForExport(study));
}

export function downloadV2Leader(study: Study): Promise<void> {
  return downloadLeaderMarkdown(projectForExport(study));
}
