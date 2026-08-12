import { SUPPORT_MINUTES } from '@/lib/questions';
import { verseRefLabel } from '@/lib/map';
import { compareVerseIds } from '@/lib/verse/ids';
import type { AimComponent, Annotation, QuestionType, Study } from '@/types/study';
import { annotationMinutes } from '@/v2/annotations';
import { mentionKey, parseMentions } from '@/v2/reader/mentions';

/**
 * The v2-native export model (V2-UX-BACKLOG §7.4/§7.5). Unlike the v1 `handoutModel`/`leaderModel`
 * (weight-based, questions-and-boxes, shared with frozen v1), this produces the flow-redesign output:
 * an **ordered, interleaved list of blocks** — a **question** or a **study note** (a printed prose
 * block) — in the running order, each carrying its own **included references** as support passages.
 *
 * Only **questions** and **study notes** are output; a plain comment/mark is prep-only and never
 * prints. A reference is includable only when it lives on a question (attached in `mentions`, so the
 * question's text stays clean) or inside a study note's prose (a typed `@`-mention). Pure +
 * unit-tested; the renderers (print / markdown / the Build preview) consume this in slice 6b.
 */

/** Ruled write-lines that follow a question when the user hasn't set an explicit count. */
export const DEFAULT_QUESTION_WRITE_LINES = 3;

export interface SupportRef {
  /** The mention's OSIS identity (its key in the item's `mentions` map). */
  osis: string;
  /** The reference's display string, e.g. "Malachi 4:5-6". */
  reference: string;
}

export interface QuestionBlock {
  kind: 'question';
  id: string;
  /** 1-based participant question number (study notes don't take a number). */
  number: number;
  text: string;
  anchorLabel: string;
  questionType: QuestionType;
  expectedAnswer: string;
  /** Renamed from "load-bearing". */
  essential: boolean;
  aimComponent?: AimComponent;
  minutes: number;
  writeLines: number;
  support: SupportRef[];
}

export interface StudyNoteBlock {
  kind: 'study-note';
  id: string;
  text: string;
  anchorLabel: string;
  /** Leader-only when true — dropped from the participant handout (see {@link participantBlocks}). */
  hideFromGroup: boolean;
  writeLines: number;
  support: SupportRef[];
}

export type ExportBlock = QuestionBlock | StudyNoteBlock;

export interface ExportModel {
  /** The document heading — the study title if set, else the reference. */
  reference: string;
  intro: string;
  /** Questions + study notes in running order (questions numbered; study notes interleaved). */
  blocks: ExportBlock[];
  prayerPoint: string;
  /** Sum of question minutes + each support passage, for the "of session length" footer. */
  totalMinutes: number;
  sessionMinutes: number | null;
}

function isOutput(a: Annotation): boolean {
  return a.kind === 'question' || a.kind === 'study-note';
}

function firstVerse(a: Annotation): string {
  return [...a.verseIds].sort(compareVerseIds)[0] ?? '';
}

/**
 * Output items (questions + study notes) in effective order: the stored `runningOrder` first (items
 * still present), then anything not yet ordered by verse. Mirrors `orderedQuestions` (build.ts) but
 * keeps study notes in the sequence rather than filtering to questions only.
 */
export function orderedOutput(annotations: Annotation[], runningOrder: string[]): Annotation[] {
  const items = annotations.filter(isOutput);
  const byId = new Map(items.map((a) => [a.id, a]));
  const verseOrder = [...items]
    .sort((a, b) => compareVerseIds(firstVerse(a), firstVerse(b)))
    .map((a) => a.id);

  const seen = new Set<string>();
  const ids: string[] = [];
  for (const id of runningOrder) {
    if (byId.has(id) && !seen.has(id)) {
      ids.push(id);
      seen.add(id);
    }
  }
  for (const id of verseOrder) {
    if (!seen.has(id)) {
      ids.push(id);
      seen.add(id);
    }
  }
  return ids.map((id) => byId.get(id)!);
}

/** The included references on an output item, de-duped by OSIS. A study note's references are typed
 *  `@`-mentions in its prose; a question's are attached in `mentions` (its text stays clean). */
export function supportFor(a: Annotation): SupportRef[] {
  const out: SupportRef[] = [];
  const seen = new Set<string>();
  const push = (osis: string, reference: string) => {
    if (seen.has(osis)) return;
    seen.add(osis);
    out.push({ osis, reference });
  };

  if (a.kind === 'study-note') {
    for (const seg of parseMentions(a.text)) {
      if (seg.type !== 'mention') continue;
      const osis = mentionKey(seg.ref);
      if (a.mentions?.[osis]?.includeForGroup) push(osis, seg.reference);
    }
  } else if (a.kind === 'question') {
    for (const [osis, meta] of Object.entries(a.mentions ?? {})) {
      if (meta.includeForGroup && meta.reference?.trim()) push(osis, meta.reference.trim());
    }
  }
  return out;
}

export function exportModel(study: Study): ExportModel {
  const ordered = orderedOutput(study.annotations, study.runningOrder);

  let qNumber = 0;
  const blocks: ExportBlock[] = ordered.map((a): ExportBlock => {
    const anchorLabel = a.verseIds.map(verseRefLabel).join(', ');
    const support = supportFor(a);
    if (a.kind === 'study-note') {
      return {
        kind: 'study-note',
        id: a.id,
        text: a.text,
        anchorLabel,
        hideFromGroup: a.hideFromGroup === true,
        writeLines: a.writeLines ?? 0,
        support,
      };
    }
    qNumber += 1;
    return {
      kind: 'question',
      id: a.id,
      number: qNumber,
      text: a.text,
      anchorLabel,
      questionType: a.questionType ?? 'observation',
      expectedAnswer: a.expectedAnswer ?? '',
      essential: a.loadBearing === true,
      ...(a.aimComponent ? { aimComponent: a.aimComponent } : {}),
      minutes: annotationMinutes(a),
      writeLines: a.writeLines ?? DEFAULT_QUESTION_WRITE_LINES,
      support,
    };
  });

  const totalMinutes = blocks.reduce(
    (sum, b) => (b.kind === 'question' ? sum + b.minutes + b.support.length * SUPPORT_MINUTES : sum),
    0,
  );

  return {
    reference: study.setup.title.trim() || study.setup.reference,
    intro: study.setup.introText.trim(),
    blocks,
    prayerPoint: study.prayerPoint.trim(),
    totalMinutes,
    sessionMinutes: study.setup.durationMinutes,
  };
}

/** The blocks the participant handout shows — a study note marked hide-from-group drops out
 *  (leader-only); questions keep their numbers regardless. */
export function participantBlocks(model: ExportModel): ExportBlock[] {
  return model.blocks.filter((b) => !(b.kind === 'study-note' && b.hideFromGroup));
}
