import type {
  Candidate,
  Question,
  QuestionType,
  StudyBuild,
  SupportPassage,
  Weight,
} from '@/types/study';

/**
 * Pure logic for Phase 6 — Build the questions (SPEC Phase 6, PLAN §6). Everything the
 * page needs to reason about the build lives here as pure functions over plain data, so
 * the store/page stay thin and the load-bearing rules are unit-tested directly:
 *
 * - **Budget + time** (6b): weight→minutes, a running total, a suggested question count.
 * - **The one hard block** (6e): a question may not be promoted without an expected
 *   answer — {@link hasExpectedAnswer}. Every other check below is a *soft* warning the
 *   user can override (Inviolable rule 3).
 * - **Soft warnings** (6e): {@link detectWarnings} — yes-no / leading / double-barrelled.
 * - **Sequencing** (6g): {@link meaningBeforeObservation} — a meaning question placed
 *   ahead of the observations anchored to the same verses.
 * - **Support budget** (6f): {@link supportBudgetWarn} — three-or-more context/quoted.
 * - **Build mutations**: promote a candidate → question, discard/restore, reorder,
 *   delete-with-cascade. All return a new {@link StudyBuild} (ids are passed in).
 */

// ---------------------------------------------------------------------------
// Budget + time (6b)
// ---------------------------------------------------------------------------

/** Rough minutes a question of each weight takes (SPEC 6b: light ≈ 1, medium ≈ 3,
 *  heavy ≈ 6). A running total against the session length is built from these. */
export const WEIGHT_MINUTES: Record<Weight, number> = { light: 1, medium: 3, heavy: 6 };

/** A support passage costs 3–5 minutes (SPEC 6b/6f); we estimate the midpoint. */
export const SUPPORT_MINUTES = 4;

export function questionMinutes(q: Pick<Question, 'weight'>): number {
  return WEIGHT_MINUTES[q.weight];
}

/** The running time estimate: every question's weight-minutes plus each support passage. */
export function estimatedMinutes(
  questions: Pick<Question, 'weight'>[],
  supportPassages: unknown[] = [],
): number {
  const q = questions.reduce((sum, x) => sum + questionMinutes(x), 0);
  return q + supportPassages.length * SUPPORT_MINUTES;
}

export interface CountRange {
  min: number;
  max: number;
}

/** Suggested question totals from the session length (SPEC 6b anchors 45→6-8, 60→8-12;
 *  the other presets are scaled from the same shape). `null` when no duration is set. */
export function suggestedQuestionCount(minutes: number | null | undefined): CountRange | null {
  if (minutes == null) return null;
  const table: Record<number, CountRange> = {
    30: { min: 4, max: 6 },
    45: { min: 6, max: 8 },
    60: { min: 8, max: 12 },
    90: { min: 12, max: 16 },
  };
  if (table[minutes]) return table[minutes];
  // Off-preset durations: interpolate from the same rough ratio (its own design).
  return { min: Math.max(1, Math.round(minutes / 7.5)), max: Math.max(2, Math.round(minutes / 5)) };
}

/** The suggested per-type spread (SPEC 6b), a guide the user can ignore. */
export const SUGGESTED_ALLOCATION: Record<QuestionType, CountRange> = {
  context: { min: 0, max: 1 },
  observation: { min: 3, max: 5 },
  meaning: { min: 2, max: 3 },
  application: { min: 2, max: 3 },
};

export const QUESTION_TYPES: QuestionType[] = ['context', 'observation', 'meaning', 'application'];

/** How many questions of each type there are (for the balance readout). */
export function typeCounts(questions: Pick<Question, 'type'>[]): Record<QuestionType, number> {
  const counts: Record<QuestionType, number> = {
    context: 0,
    observation: 0,
    meaning: 0,
    application: 0,
  };
  for (const q of questions) counts[q.type] += 1;
  return counts;
}

// ---------------------------------------------------------------------------
// The hard block (6e) + soft warnings (6e)
// ---------------------------------------------------------------------------

/** The single enforced discipline (SPEC 6e / Principle 3): a question cannot be promoted
 *  without an expected answer. Everything else is a warning the user can override. */
export function hasExpectedAnswer(draft: Pick<Question, 'expectedAnswer'>): boolean {
  return draft.expectedAnswer.trim().length > 0;
}

export type WarningId = 'yes-no' | 'leading' | 'double-barrelled';

const INTERROGATIVE =
  'who|what|whom|whose|when|where|why|how|which|is|are|am|does|do|did|was|were|can|could|should|would|will|has|have|had';

/**
 * The three soft, overridable question warnings (SPEC 6e). The detection rules live in
 * code; the user-facing messages live in `content/method/warnings.yaml` (resolve by id).
 *
 * - **yes-no** — opens with Is / Are / Does / Did / Was.
 * - **leading** — contains "doesn't" or "don't you think".
 * - **double-barrelled** — two question marks, or "and" followed by a second interrogative.
 */
export function detectWarnings(text: string): WarningId[] {
  const t = text.trim();
  if (t === '') return [];
  const out: WarningId[] = [];

  if (/^(is|are|does|did|was)\b/i.test(t)) out.push('yes-no');

  if (/doesn['’]t/i.test(t) || /don['’]t you think/i.test(t)) out.push('leading');

  const questionMarks = (t.match(/\?/g) ?? []).length;
  const andThenInterrogative = new RegExp(`\\band\\b[^?]*\\b(${INTERROGATIVE})\\b`, 'i').test(t);
  if (questionMarks >= 2 || andThenInterrogative) out.push('double-barrelled');

  return out;
}

// ---------------------------------------------------------------------------
// Sequencing (6g)
// ---------------------------------------------------------------------------

function sharesVerse(a: Question, b: Question): boolean {
  const set = new Set(a.anchor.verseIds);
  return b.anchor.verseIds.some((id) => set.has(id));
}

/**
 * Meaning questions placed *before* an observation question anchored to the same verses
 * (SPEC 6g: observation before meaning *for a given piece of text*). Returns the offending
 * meaning question ids, given the questions in their sequenced order.
 */
export function meaningBeforeObservation(ordered: Question[]): string[] {
  const offenders: string[] = [];
  ordered.forEach((q, i) => {
    if (q.type !== 'meaning') return;
    const laterObservationSharesVerse = ordered
      .slice(i + 1)
      .some((o) => o.type === 'observation' && sharesVerse(q, o));
    if (laterObservationSharesVerse) offenders.push(q.id);
  });
  return offenders;
}

// ---------------------------------------------------------------------------
// Support passages (6f)
// ---------------------------------------------------------------------------

/** Support passages whose type counts against the time budget (context or quoted). */
export function countedSupport(supportPassages: Pick<SupportPassage, 'type'>[]): number {
  return supportPassages.filter((s) => s.type === 'context' || s.type === 'quoted').length;
}

/** Warn at the third support passage of the context or quoted kind (SPEC 6f). */
export function supportBudgetWarn(supportPassages: Pick<SupportPassage, 'type'>[]): boolean {
  return countedSupport(supportPassages) >= 3;
}

// ---------------------------------------------------------------------------
// Order (6g) — kept consistent with the live questions (PLAN §4.2)
// ---------------------------------------------------------------------------

/** The question ids in sequence: the stored `order` filtered to still-live questions,
 *  then any newly-promoted questions not yet in `order` appended in creation order. */
export function orderedQuestionIds(build: StudyBuild): string[] {
  const live = new Set(build.questions.map((q) => q.id));
  const inOrder = build.order.filter((id) => live.has(id));
  const seen = new Set(inOrder);
  const missing = build.questions.map((q) => q.id).filter((id) => !seen.has(id));
  return [...inOrder, ...missing];
}

/** The live questions in sequence (see {@link orderedQuestionIds}). */
export function orderedQuestions(build: StudyBuild): Question[] {
  const byId = new Map(build.questions.map((q) => [q.id, q] as const));
  return orderedQuestionIds(build)
    .map((id) => byId.get(id))
    .filter((q): q is Question => q != null);
}

// ---------------------------------------------------------------------------
// Build mutations (all pure; ids passed in)
// ---------------------------------------------------------------------------

/** The user-editable slice of a question — what the 6e completion editor holds as a draft
 *  before it becomes a real {@link Question}. */
export type QuestionDraft = Pick<
  Question,
  | 'text'
  | 'anchor'
  | 'type'
  | 'expectedAnswer'
  | 'weight'
  | 'loadBearing'
  | 'gospelPlain'
  | 'aimComponent'
  | 'wrongTurns'
  | 'pastoralFlag'
>;

/** A fresh draft for a brand-new question of the given type (nothing pre-written). */
export function emptyDraft(type: QuestionType = 'observation'): QuestionDraft {
  return {
    text: '',
    anchor: { verseIds: [] },
    type,
    expectedAnswer: '',
    weight: 'medium',
    loadBearing: false,
  };
}

/** Build a {@link Question} from a draft. Optional fields are only set when meaningful, so
 *  a "no" load-bearing / unset pastoral flag doesn't clutter the stored doc. */
export function questionFromDraft(
  draft: QuestionDraft,
  id: string,
  sourceCandidateId?: string,
): Question {
  const q: Question = {
    id,
    text: draft.text.trim(),
    anchor: draft.anchor,
    type: draft.type,
    expectedAnswer: draft.expectedAnswer.trim(),
    weight: draft.weight,
    loadBearing: draft.loadBearing,
  };
  if (draft.gospelPlain) q.gospelPlain = true;
  if (draft.aimComponent) q.aimComponent = draft.aimComponent;
  if (draft.wrongTurns?.trim()) q.wrongTurns = draft.wrongTurns.trim();
  if (draft.pastoralFlag) q.pastoralFlag = true;
  if (sourceCandidateId) q.sourceCandidateId = sourceCandidateId;
  return q;
}

/** The editable draft for an existing question (round-trips through the 6e editor). */
export function draftFromQuestion(q: Question): QuestionDraft {
  return {
    text: q.text,
    anchor: q.anchor,
    type: q.type,
    expectedAnswer: q.expectedAnswer,
    weight: q.weight,
    loadBearing: q.loadBearing,
    gospelPlain: q.gospelPlain,
    aimComponent: q.aimComponent,
    wrongTurns: q.wrongTurns,
    pastoralFlag: q.pastoralFlag,
  };
}

/** Append a brainstorm candidate (6c). */
export function addCandidate(build: StudyBuild, candidate: Candidate): StudyBuild {
  return { ...build, candidates: [...build.candidates, candidate] };
}

/** Edit a candidate's text (6c — free editing before the cut). */
export function updateCandidateText(build: StudyBuild, id: string, text: string): StudyBuild {
  return {
    ...build,
    candidates: build.candidates.map((c) => (c.id === id ? { ...c, text } : c)),
  };
}

/** Hard-remove a candidate (only for candidates the user typed themselves in 6c; recycled
 *  ones are better hidden via {@link discardCandidate} so provenance survives). */
export function removeCandidate(build: StudyBuild, id: string): StudyBuild {
  return { ...build, candidates: build.candidates.filter((c) => c.id !== id) };
}

/** Cut a candidate (6d): hide it but keep it, in case the user changes their mind. */
export function discardCandidate(build: StudyBuild, id: string): StudyBuild {
  return {
    ...build,
    candidates: build.candidates.map((c) => (c.id === id ? { ...c, status: 'discarded' } : c)),
  };
}

/** Bring a discarded candidate back into the open pool (6d — "kept but hidden"). */
export function restoreCandidate(build: StudyBuild, id: string): StudyBuild {
  return {
    ...build,
    candidates: build.candidates.map((c) => (c.id === id ? { ...c, status: 'open' } : c)),
  };
}

/**
 * Promote a candidate to a real question (6d→6e). Creates the {@link Question} (the caller
 * supplies the id and a draft that has already passed {@link hasExpectedAnswer} — the hard
 * block is enforced at the UI, and re-guarded here so a bad draft can never slip through),
 * marks the candidate `promoted`, and appends the new question to the sequence.
 */
export function promoteCandidate(
  build: StudyBuild,
  candidateId: string,
  draft: QuestionDraft,
  newQuestionId: string,
): StudyBuild {
  if (!hasExpectedAnswer(draft)) return build; // hard block — never promote without one
  const question = questionFromDraft(draft, newQuestionId, candidateId);
  return {
    ...build,
    candidates: build.candidates.map((c) =>
      c.id === candidateId ? { ...c, status: 'promoted' } : c,
    ),
    questions: [...build.questions, question],
    order: [...build.order, question.id],
  };
}

/** Save edits to a promoted question (6e). Re-guards the hard block: an empty expected
 *  answer is refused, so a promoted question can never lose its expected answer. */
export function updateQuestion(
  build: StudyBuild,
  id: string,
  draft: QuestionDraft,
): StudyBuild {
  if (!hasExpectedAnswer(draft)) return build;
  return {
    ...build,
    questions: build.questions.map((q) =>
      q.id === id ? questionFromDraft(draft, id, q.sourceCandidateId) : q,
    ),
  };
}

/**
 * Delete a promoted question with referential-integrity cascade (PLAN §4.2): drop it from
 * `order`, re-open its source candidate so it returns to the cut pool, and detach any
 * support passages that pointed at it (kept, but unattached — never silently dropped).
 */
export function deleteQuestion(build: StudyBuild, id: string): StudyBuild {
  const question = build.questions.find((q) => q.id === id);
  const sourceId = question?.sourceCandidateId;
  return {
    ...build,
    questions: build.questions.filter((q) => q.id !== id),
    order: build.order.filter((qid) => qid !== id),
    candidates: build.candidates.map((c) =>
      sourceId && c.id === sourceId ? { ...c, status: 'open' } : c,
    ),
    supportPassages: build.supportPassages.map((s) =>
      s.attachedToQuestionId === id ? { ...s, attachedToQuestionId: undefined } : s,
    ),
  };
}

/** Move a question one step earlier/later in the sequence (6g). */
export function moveQuestion(build: StudyBuild, id: string, dir: 'up' | 'down'): StudyBuild {
  const ids = orderedQuestionIds(build);
  const i = ids.indexOf(id);
  if (i === -1) return build;
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= ids.length) return build;
  const next = [...ids];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return { ...build, order: next };
}

// ---------------------------------------------------------------------------
// Support passages (6f) — add / update / remove
// ---------------------------------------------------------------------------

export function addSupportPassage(build: StudyBuild, sp: SupportPassage): StudyBuild {
  return { ...build, supportPassages: [...build.supportPassages, sp] };
}

export function updateSupportPassage(
  build: StudyBuild,
  id: string,
  patch: Partial<SupportPassage>,
): StudyBuild {
  return {
    ...build,
    supportPassages: build.supportPassages.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  };
}

export function removeSupportPassage(build: StudyBuild, id: string): StudyBuild {
  return { ...build, supportPassages: build.supportPassages.filter((s) => s.id !== id) };
}
