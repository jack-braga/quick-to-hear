import type { ParsedText } from '@/types/passage';
import { primaryText } from '@/lib/passage';
import { orderedQuestions } from '@/lib/questions';
import { verseRefLabel } from '@/lib/map';
import type {
  AimComponent,
  Question,
  QuestionType,
  Study,
  StudyBuild,
  SupportPassage,
  Weight,
} from '@/types/study';

/**
 * Pure export models (SPEC Phase 7, PLAN §4.8). One model builder per artefact, shared by
 * both renderers — the print-CSS React pages and the markdown download — so the *content*
 * is defined once and the two outputs can never drift.
 *
 * The critical rule (guard-tested): the **handout is defined by exclusion**. It carries the
 * passage, numbered questions, inline support, background boxes, the prayer point, the
 * intro, and the translation copyright line — and **nothing else**: no theme, no aim, no
 * type labels, no timings, and above all **no expected answers**. The **leader's notes**
 * carry everything.
 *
 * Support-passage *text* is fetched separately ({@link resolveSupportTexts}) and passed in
 * via `supportTexts`, keeping these builders pure over plain data.
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

/** The `study`-format build, or null for a Talk build (no questions). */
function studyBuild(study: Study): StudyBuild | null {
  return study.build.format === 'study' ? study.build : null;
}

function supportText(opts: ExportOptions, id: string): ParsedText | null {
  return opts.supportTexts?.[id] ?? null;
}

// ---------------------------------------------------------------------------
// Participant handout (defined by exclusion)
// ---------------------------------------------------------------------------

export interface HandoutSupport {
  id: string;
  reference: string;
  type: 'context' | 'quoted';
  text: ParsedText | null;
  returnQuestion?: string;
}

export interface HandoutQuestion {
  number: number;
  text: string;
  /** Context/quoted support passages attached at this question's point of need. */
  support: HandoutSupport[];
}

export interface HandoutBox {
  /** A short label (a verse reference, or a support reference) if one applies. */
  label?: string;
  text: string;
  /** The fetched text, for a background support passage that carries one. */
  passage?: ParsedText | null;
}

export interface HandoutModel {
  reference: string;
  intro: string;
  passage: ParsedText | null;
  translationName: string;
  copyrightLine: string;
  questions: HandoutQuestion[];
  boxes: HandoutBox[];
  prayerPoint: string;
}

export function handoutModel(study: Study, opts: ExportOptions): HandoutModel {
  const build = studyBuild(study);
  const questions: HandoutQuestion[] = build
    ? orderedQuestions(build).map((q, i) => ({
        number: i + 1,
        text: q.text,
        support: build.supportPassages
          .filter(
            (s): s is SupportPassage & { type: 'context' | 'quoted' } =>
              s.attachedToQuestionId === q.id && (s.type === 'context' || s.type === 'quoted'),
          )
          .map((s) => ({
            id: s.id,
            reference: s.reference,
            type: s.type,
            text: supportText(opts, s.id),
            ...(s.returnQuestion?.trim() ? { returnQuestion: s.returnQuestion.trim() } : {}),
          })),
      }))
    : [];

  // Background boxes: recycled Phase-3 marks (candidate background-boxes, still live) +
  // any support passage of the "background" kind (a box, never a question — SPEC Phase 3).
  const boxes: HandoutBox[] = [];
  if (build) {
    for (const c of build.candidates) {
      if (c.kind !== 'background-box' || c.status === 'discarded') continue;
      const label = c.anchor?.verseIds.map(verseRefLabel).join(', ');
      boxes.push({ text: c.text, ...(label ? { label } : {}) });
    }
    for (const s of build.supportPassages) {
      if (s.type !== 'background') continue;
      boxes.push({ label: s.reference, text: '', passage: supportText(opts, s.id) });
    }
  }

  return {
    reference: study.setup.reference,
    intro: study.setup.introText.trim(),
    passage: primaryText(study.passage),
    translationName: opts.translationName,
    copyrightLine: opts.copyrightLine,
    questions,
    boxes,
    prayerPoint: build ? build.prayerPoint.trim() : '',
  };
}

// ---------------------------------------------------------------------------
// Leader's notes (everything)
// ---------------------------------------------------------------------------

export interface LeaderQuestion {
  number: number;
  text: string;
  type: QuestionType;
  weight: Weight;
  anchorLabel: string;
  expectedAnswer: string;
  loadBearing: boolean;
  gospelPlain: boolean;
  aimComponent?: AimComponent;
  wrongTurns?: string;
  pastoralFlag: boolean;
  /** The leader-only note captured with the pastoral flag (who/what to handle privately). */
  pastoralNote?: string;
  support: { reference: string; type: SupportPassage['type']; returnQuestion?: string }[];
}

export interface LeaderSectionRow {
  name: string;
  weight?: Weight;
}

export interface LeaderModel {
  reference: string;
  theme: string;
  authorAim: string;
  groupAim: string;
  know: string;
  feel: string;
  do: string;
  christRoute: string;
  sections: LeaderSectionRow[];
  questions: LeaderQuestion[];
  /** Question numbers suggested to drop first if short on time (non-load-bearing). */
  dropOrder: number[];
  /** Background material decided against but kept in reserve (discarded candidates). */
  reserve: string[];
  /** Questions flagged pastorally sensitive (by number). */
  pastoralNumbers: number[];
  prayerPoint: string;
  estimatedMinutes: number;
  durationMinutes: number | null;
  copyrightLine: string;
  attributions: string[];
}

export function leaderModel(study: Study, opts: ExportOptions): LeaderModel {
  const build = studyBuild(study);
  const ordered = build ? orderedQuestions(build) : [];

  const questions: LeaderQuestion[] = ordered.map((q: Question, i) => ({
    number: i + 1,
    text: q.text,
    type: q.type,
    weight: q.weight,
    anchorLabel: q.anchor.verseIds.map(verseRefLabel).join(', '),
    expectedAnswer: q.expectedAnswer,
    loadBearing: q.loadBearing,
    gospelPlain: q.gospelPlain === true,
    ...(q.aimComponent ? { aimComponent: q.aimComponent } : {}),
    ...(q.wrongTurns?.trim() ? { wrongTurns: q.wrongTurns.trim() } : {}),
    pastoralFlag: q.pastoralFlag === true,
    ...(q.pastoralFlag === true && q.pastoralNote?.trim()
      ? { pastoralNote: q.pastoralNote.trim() }
      : {}),
    support: build
      ? build.supportPassages
          .filter((s) => s.attachedToQuestionId === q.id)
          .map((s) => ({
            reference: s.reference,
            type: s.type,
            ...(s.returnQuestion?.trim() ? { returnQuestion: s.returnQuestion.trim() } : {}),
          }))
      : [],
  }));

  // Section map with weights, in passage order (fall back to stored order if unmatched).
  const sections: LeaderSectionRow[] = study.map.sections.map((s, i) => ({
    name: s.name.trim() || `Section ${i + 1}`,
    ...(s.weight ? { weight: s.weight } : {}),
  }));

  const dropOrder = questions.filter((q) => !q.loadBearing).map((q) => q.number);
  const reserve = build
    ? build.candidates
        .filter((c) => c.status === 'discarded' && c.kind === 'question' && c.text.trim())
        .map((c) => c.text.trim())
    : [];
  const pastoralNumbers = questions.filter((q) => q.pastoralFlag).map((q) => q.number);

  const attributions = [opts.copyrightLine, ...(opts.methodAttributions ?? [])].filter(
    (a) => a.trim().length > 0,
  );

  // Reuse the same minute estimate the budget/audit use.
  const estimatedMinutes = ordered.reduce(
    (sum, q) => sum + { light: 1, medium: 3, heavy: 6 }[q.weight],
    build ? build.supportPassages.length * 4 : 0,
  );

  return {
    reference: study.setup.reference,
    theme: study.themeAim.theme.trim(),
    authorAim: study.themeAim.authorAim.trim(),
    groupAim: study.themeAim.groupAim.trim(),
    know: study.themeAim.know.trim(),
    feel: study.themeAim.feel.trim(),
    do: study.themeAim.doField.trim(),
    christRoute: study.themeAim.christRoute.trim(),
    sections,
    questions,
    dropOrder,
    reserve,
    pastoralNumbers,
    prayerPoint: build ? build.prayerPoint.trim() : '',
    estimatedMinutes,
    durationMinutes: study.setup.durationMinutes,
    copyrightLine: opts.copyrightLine,
    attributions,
  };
}
