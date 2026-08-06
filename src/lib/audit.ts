import { verseIds as passageVerseIds } from '@/types/passage';
import {
  estimatedMinutes,
  meaningBeforeObservation,
  orderedQuestions,
  typeCounts,
} from '@/lib/questions';
import { orderedSections, sectionsMatchPassage, sectionVerseIds } from '@/lib/map';
import type {
  AimComponent,
  CoverageTag,
  Question,
  QuestionType,
  Study,
  StudyBuild,
} from '@/types/study';

/**
 * Pure logic for Phase 7 — Check & export (SPEC Phase 7, PLAN §6). Every audit check
 * computes its status *from the study* here, so the page stays a thin renderer of
 * evidence + acknowledgements and the load-bearing rules are unit-tested directly.
 *
 * Nothing in this file blocks anything (Inviolable rule 3): a check is only ever `met`,
 * `unmet`, or `na`. The page shows the evidence and lets the user acknowledge/dismiss an
 * `unmet` item — export is always available regardless of the audit.
 *
 * The **coverage map** ({@link coverageMap}) is the interesting one: a per-section view of
 * which verses no question's anchor touches, so every fully-untouched section can be tagged
 * (connective / deferred / needs-question) — making "does anything resist the theme"
 * concrete. Tags live on `study.audit.coverageTags`, keyed by section id.
 */

// ---------------------------------------------------------------------------
// Small helpers over the (study-format) build
// ---------------------------------------------------------------------------

/** The `study`-format build, or null for a Talk build (§4.9 — no question pool). */
function studyBuild(study: Study): StudyBuild | null {
  return study.build.format === 'study' ? study.build : null;
}

/** The set of verse ids any promoted question's anchor touches. */
export function touchedVerseIds(build: StudyBuild): Set<string> {
  return new Set(build.questions.flatMap((q) => q.anchor.verseIds));
}

/** Promoted questions whose expected answer is (somehow) empty. Should be empty by
 *  construction — the 6e hard block guarantees it — but the audit verifies, never assumes. */
export function questionsMissingAnswer(build: StudyBuild): Question[] {
  return build.questions.filter((q) => q.expectedAnswer.trim().length === 0);
}

/** Questions marked load-bearing (SPEC 7: at least two). */
export function loadBearingQuestions(build: StudyBuild): Question[] {
  return build.questions.filter((q) => q.loadBearing);
}

/** Questions marked as making the gospel plain (SPEC 7). */
export function gospelPlainQuestions(build: StudyBuild): Question[] {
  return build.questions.filter((q) => q.gospelPlain === true);
}

/** The gospel-plain question is *required* when the group is mixed or a one-to-one with a
 *  not-yet-Christian (SPEC Phase 1 / Phase 7). Believers-only (or unset) → not required. */
export function requiresGospelPlain(study: Study): boolean {
  const g = study.setup.groupComposition;
  return g === 'mixed' || g === 'one-to-one-not-yet-christian';
}

/** Which of the three aim components (know / feel / do) at least one question is tagged to
 *  serve (SPEC 7: "application covers the know / feel / do"). */
export function aimComponentsCovered(build: StudyBuild): Record<AimComponent, boolean> {
  const seen = new Set<AimComponent>();
  for (const q of build.questions) if (q.aimComponent) seen.add(q.aimComponent);
  return { know: seen.has('know'), feel: seen.has('feel'), do: seen.has('do') };
}

/** Aim components with no question serving them yet. */
export function aimComponentsMissing(build: StudyBuild): AimComponent[] {
  const covered = aimComponentsCovered(build);
  return (['know', 'feel', 'do'] as AimComponent[]).filter((c) => !covered[c]);
}

/** Core question types (observation / meaning / application) with no question yet — the
 *  minimum for a balanced study. Context is optional (SPEC 6b allocation 0–1). */
export function typeBalanceMissing(build: StudyBuild): QuestionType[] {
  const counts = typeCounts(build.questions);
  return (['observation', 'meaning', 'application'] as QuestionType[]).filter(
    (t) => counts[t] === 0,
  );
}

/**
 * Application questions that sit *before* a later question of another type (SPEC 7:
 * "application is last"). Returns the offending application-question ids, given the
 * questions in their sequenced order.
 */
export function applicationOrderOffenders(ordered: Question[]): string[] {
  const offenders: string[] = [];
  ordered.forEach((q, i) => {
    if (q.type !== 'application') return;
    const laterNonApplication = ordered.slice(i + 1).some((o) => o.type !== 'application');
    if (laterNonApplication) offenders.push(q.id);
  });
  return offenders;
}

// ---------------------------------------------------------------------------
// Coverage map (SPEC 7 — the visual "which verses no question touches")
// ---------------------------------------------------------------------------

export interface CoverageSection {
  id: string;
  index: number;
  name: string;
  verseIds: string[];
  touchedVerseIds: string[];
  untouchedVerseIds: string[];
  /** True when no question touches *any* verse in the section (the taggable case). */
  isUntouched: boolean;
  /** The user's tag for this section, if set (`study.audit.coverageTags`). */
  tag?: CoverageTag;
}

export interface CoverageMap {
  /** False when there is no usable section partition (divide the passage in Phase 3). */
  hasSections: boolean;
  sections: CoverageSection[];
  /** Sections no question touches at all. */
  untouchedSections: CoverageSection[];
  /** Untouched sections still awaiting a coverage tag (the audit's open items). */
  untaggedUntouched: CoverageSection[];
}

const EMPTY_COVERAGE: CoverageMap = {
  hasSections: false,
  sections: [],
  untouchedSections: [],
  untaggedUntouched: [],
};

/**
 * Per-section coverage of the loaded passage. Requires a valid section partition (Phase 3)
 * and a loaded passage; otherwise `hasSections:false` (the page prompts the user to divide
 * the passage first). A section is *untouched* when no question's anchor lands on any of its
 * verses — every untouched section must be tagged (connective / deferred / needs-question).
 */
export function coverageMap(study: Study): CoverageMap {
  const build = studyBuild(study);
  const passage = study.passage.primary;
  if (!build || !passage) return EMPTY_COVERAGE;

  const pvids = passageVerseIds(passage);
  if (!sectionsMatchPassage(study.map.sections, pvids)) return EMPTY_COVERAGE;

  const touched = touchedVerseIds(build);
  const tags = study.audit.coverageTags;

  const sections = orderedSections(study.map.sections, pvids).map((s, i): CoverageSection => {
    const vids = sectionVerseIds(s, pvids);
    const touchedIn = vids.filter((v) => touched.has(v));
    const untouchedIn = vids.filter((v) => !touched.has(v));
    return {
      id: s.id,
      index: i,
      name: s.name.trim() || `Section ${i + 1}`,
      verseIds: vids,
      touchedVerseIds: touchedIn,
      untouchedVerseIds: untouchedIn,
      isUntouched: touchedIn.length === 0,
      tag: tags[s.id],
    };
  });

  const untouchedSections = sections.filter((s) => s.isUntouched);
  const untaggedUntouched = untouchedSections.filter((s) => !s.tag);
  return { hasSections: true, sections, untouchedSections, untaggedUntouched };
}

// ---------------------------------------------------------------------------
// The checklist results
// ---------------------------------------------------------------------------

export const AUDIT_CHECK_IDS = [
  'serves-theme-aim',
  'expected-answer',
  'coverage',
  'type-balance',
  'meaning-order',
  'application-last',
  'know-feel-do',
  'time-vs-length',
  'two-load-bearing',
  'gospel-plain',
  'prayer-point',
] as const;
export type AuditCheckId = (typeof AUDIT_CHECK_IDS)[number];

export type AuditStatus = 'met' | 'unmet' | 'na';

export interface AuditItemResult {
  id: AuditCheckId;
  status: AuditStatus;
  /** Whether a conditional check applies to this study (only gospel-plain is conditional;
   *  everything else is always `true`). */
  applies: boolean;
  /** A short, computed one-line summary of the evidence, for the checklist row. */
  summary: string;
}

function commaList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Compute every audit check's live status against the study, in SPEC order. Judgement
 * checks (does each question *serve* the theme; general→particular) compute a mechanical
 * proxy (theme/aim present; application ordering) — the evidence and the user's
 * acknowledgement carry the human judgement the tool can't make.
 */
export function auditResults(study: Study): AuditItemResult[] {
  const build = studyBuild(study);
  const questions = build?.questions ?? [];
  const ordered = build ? orderedQuestions(build) : [];
  const n = questions.length;
  const themeAim = study.themeAim;
  const duration = study.setup.durationMinutes;

  const results: AuditItemResult[] = [];
  const push = (id: AuditCheckId, status: AuditStatus, summary: string, applies = true) =>
    results.push({ id, status, summary, applies });

  // 1. serves-theme-aim (judgement — proxy: theme + aim written, and there are questions)
  if (n === 0) {
    push('serves-theme-aim', 'unmet', 'No questions yet.');
  } else if (themeAim.theme.trim() === '' || themeAim.authorAim.trim() === '') {
    push('serves-theme-aim', 'unmet', 'Write your theme and aim first, then check each question serves them.');
  } else {
    push('serves-theme-aim', 'met', `Theme and aim are set — read each of the ${n} questions against them.`);
  }

  // 2. expected-answer (guaranteed by the 6e hard block; verify anyway)
  if (n === 0) {
    push('expected-answer', 'unmet', 'No questions yet.');
  } else {
    const missing = build ? questionsMissingAnswer(build).length : 0;
    if (missing > 0) push('expected-answer', 'unmet', `${missing} question(s) have no expected answer.`);
    else push('expected-answer', 'met', `All ${n} questions have an expected answer.`);
  }

  // 3. coverage (every untouched section tagged)
  const cov = coverageMap(study);
  if (!cov.hasSections) {
    push('coverage', 'na', 'Divide the passage into sections in Phase 3 to map coverage.');
  } else if (cov.untaggedUntouched.length > 0) {
    push('coverage', 'unmet', `${cov.untaggedUntouched.length} untouched section(s) still need a tag.`);
  } else if (cov.untouchedSections.length > 0) {
    push('coverage', 'met', `Every untouched section is tagged (${cov.untouchedSections.length} tagged).`);
  } else {
    push('coverage', 'met', 'Every section has at least one question.');
  }

  // 4. type-balance (observation / meaning / application each present)
  if (n === 0) {
    push('type-balance', 'unmet', 'No questions yet.');
  } else if (build) {
    const missing = typeBalanceMissing(build);
    if (missing.length > 0) push('type-balance', 'unmet', `No ${commaList(missing)} questions yet.`);
    else {
      const c = typeCounts(questions);
      push(
        'type-balance',
        'met',
        `Context ${c.context}, observation ${c.observation}, meaning ${c.meaning}, application ${c.application}.`,
      );
    }
  }

  // 5. meaning-order (no meaning before its observations on shared verses)
  const meaningOffenders = meaningBeforeObservation(ordered);
  if (n === 0) push('meaning-order', 'na', 'No questions yet.');
  else if (meaningOffenders.length > 0)
    push('meaning-order', 'unmet', `${meaningOffenders.length} meaning question(s) sit before an observation on the same verses.`);
  else push('meaning-order', 'met', 'No meaning question precedes its observations.');

  // 6. application-last (all application questions at the end; general→particular is review)
  const appQuestions = ordered.filter((q) => q.type === 'application');
  if (n === 0) {
    push('application-last', 'na', 'No questions yet.');
  } else if (appQuestions.length === 0) {
    push('application-last', 'unmet', 'No application questions yet — a study should land in application.');
  } else {
    const appOffenders = applicationOrderOffenders(ordered);
    if (appOffenders.length > 0)
      push('application-last', 'unmet', 'An application question sits before questions of other types.');
    else push('application-last', 'met', 'Application questions come last — check they move general → particular.');
  }

  // 7. know-feel-do (application covers each aim component)
  if (build) {
    const missing = aimComponentsMissing(build);
    if (n === 0) push('know-feel-do', 'na', 'No questions yet.');
    else if (missing.length > 0)
      push('know-feel-do', 'unmet', `Not yet covering: ${commaList(missing.map((m) => m.toUpperCase()))}.`);
    else push('know-feel-do', 'met', 'Questions cover know, feel and do.');
  }

  // 8. time-vs-length
  if (duration == null) {
    push('time-vs-length', 'na', 'Set a session length in Phase 1 to check timing.');
  } else if (build) {
    const minutes = estimatedMinutes(build.questions, build.supportPassages);
    if (minutes > duration) push('time-vs-length', 'unmet', `≈ ${minutes} min of ${duration} — over; trim or drop.`);
    else push('time-vs-length', 'met', `≈ ${minutes} min of ${duration} — fits, err low.`);
  }

  // 9. two-load-bearing
  if (build) {
    const lb = loadBearingQuestions(build).length;
    if (lb >= 2) push('two-load-bearing', 'met', `${lb} load-bearing questions marked.`);
    else push('two-load-bearing', 'unmet', `Only ${lb} marked — mark at least two you won't cut.`);
  }

  // 10. gospel-plain (conditional on group composition)
  const gpApplies = requiresGospelPlain(study);
  if (!gpApplies) {
    push('gospel-plain', 'na', 'Not required for this group.', false);
  } else if (build && gospelPlainQuestions(build).length > 0) {
    push('gospel-plain', 'met', 'A gospel-plain question is marked.', true);
  } else {
    push('gospel-plain', 'unmet', 'Required for this group — mark a question that makes the gospel plain.', true);
  }

  // 11. prayer-point (soft — the sole hard block is 6e)
  const prayer = build ? build.prayerPoint.trim() : '';
  if (prayer.length > 0) push('prayer-point', 'met', 'A prayer point is set.');
  else push('prayer-point', 'unmet', 'No prayer point yet — draw one from the passage.');

  return results;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** Human labels for the three coverage tags (SPEC 7). */
export const COVERAGE_TAG_LABELS: Record<CoverageTag, string> = {
  connective: 'Connective tissue',
  deferred: 'Deferred',
  'needs-question': 'Needs a question',
};
