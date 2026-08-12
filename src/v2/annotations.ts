import { WEIGHT_MINUTES } from '@/lib/questions';
import { compareVerseIds } from '@/lib/verse/ids';
import {
  ANNOTATION_ORIGINS,
  type Annotation,
  type AnnotationKind,
  type AnnotationOrigin,
  type NoteFlag,
} from '@/types/study';

/**
 * Pure helpers for the v2 annotation layer (ROADMAP-v2 §2) — the load-bearing logic the reader
 * and margin render, kept framework-free and unit-tested (the house pattern). Annotations
 * anchor whole-verse by canonical id, so there is no reconcile/degrade logic; an empty
 * `verseIds` marks a floating (study-level) note.
 */

/** The accent a kind reads in: confusing = rubric (red), question = amber, a study note = violet
 *  (a printed prose block), a COMA answer = moss (green — distinct from a Survey note), else lapis. */
export type AnnotationTone = 'rubric' | 'lapis' | 'amber' | 'moss' | 'violet';

export function toneFor(a: Annotation): AnnotationTone {
  if (a.kind === 'question') return 'amber';
  if (a.kind === 'study-note') return 'violet';
  if (a.kind === 'note' && a.flag === 'confusing') return 'rubric';
  // A COMA answer-card reads in moss so it's distinct from a Survey note (both are plain notes).
  if (annotationOrigin(a) === 'coma') return 'moss';
  return 'lapis';
}

/** Priority when a verse carries several annotations: the resting tint shows the most notable. */
const TONE_PRIORITY: Record<AnnotationTone, number> = { rubric: 5, amber: 4, violet: 3, moss: 2, lapis: 1 };

/** Tones highest-priority first — the stable order the diagonal multi-tone stripe cycles through. */
const TONES_BY_PRIORITY: AnnotationTone[] = ['rubric', 'amber', 'violet', 'moss', 'lapis'];

// --- Origin (which lens a card was made in) — v2 Layout-B "everything is a card" ---------------

/** The card's origin lens. Uses the stored `origin`, else derives it from the kind: a question →
 *  the Questions lens, a COMA-typed note → COMA, anything else → Map. */
export function annotationOrigin(a: Annotation): AnnotationOrigin {
  if (a.origin) return a.origin;
  // both the question and its sibling study-note are authored in the Write lens (origin 'questions').
  if (a.kind === 'question' || a.kind === 'study-note') return 'questions';
  if (a.comaType) return 'coma';
  return 'map';
}

/** Human label for an origin (the panel chip + the source line). The ids `map`/`questions` are
 *  stable, but they now display as **Survey** / **Write** (the flow-redesign renames). */
export const ORIGIN_LABEL: Record<AnnotationOrigin, string> = {
  map: 'Survey',
  coma: 'COMA',
  theme: 'Theme & aim',
  questions: 'Write',
};

/** The origins actually present among these cards, in canonical (flow) order — the chip set. */
export function presentOrigins(annotations: Annotation[]): AnnotationOrigin[] {
  const seen = new Set(annotations.map(annotationOrigin));
  return ANNOTATION_ORIGINS.filter((o) => seen.has(o));
}

/** Keep only cards whose origin is in `origins` (empty set = show all). */
export function filterByOrigins(annotations: Annotation[], origins: Set<AnnotationOrigin>): Annotation[] {
  if (origins.size === 0) return annotations;
  return annotations.filter((a) => origins.has(annotationOrigin(a)));
}

/**
 * Drop cards whose origin is `hidden` (a chip toggled off) — the blacklist companion to
 * {@link filterByOrigins}. The panel models chip state as the **hidden** set (not a whitelist)
 * so nothing-hidden shows all, a newly-present origin defaults visible, and hiding every chip
 * empties the panel — none of which a whitelist's empty-means-all convention can express.
 */
export function rejectByOrigins(annotations: Annotation[], hidden: Set<AnnotationOrigin>): Annotation[] {
  if (hidden.size === 0) return annotations;
  return annotations.filter((a) => !hidden.has(annotationOrigin(a)));
}

/**
 * The set of **distinct tones** each verse carries, highest-priority first. A verse with two or
 * more tones renders the diagonal multi-tone stripe; one tone stays a flat wash. (Supersedes the
 * single-tone `anchorToneByVerse` for the canvas — that only kept the top tone.)
 */
export function verseTones(annotations: Annotation[]): Map<string, AnnotationTone[]> {
  const acc = new Map<string, Set<AnnotationTone>>();
  for (const a of annotations) {
    const tone = toneFor(a);
    for (const id of a.verseIds) {
      let set = acc.get(id);
      if (!set) acc.set(id, (set = new Set()));
      set.add(tone);
    }
  }
  const out = new Map<string, AnnotationTone[]>();
  for (const [id, set] of acc) out.set(id, TONES_BY_PRIORITY.filter((t) => set.has(t)));
  return out;
}

/** UI copy per annotation kind/flag (tag shown on the card + the editor placeholder). */
export function annotationMeta(a: Annotation): { tag: string; placeholder: string } {
  if (a.kind === 'question') {
    return { tag: 'Question', placeholder: 'Draft a question anchored to these verses…' };
  }
  if (a.kind === 'study-note') {
    return { tag: 'Study note', placeholder: 'Explain it for the group — this prints as a study note…' };
  }
  if (a.flag === 'confusing') {
    return { tag: 'Mark · confusing', placeholder: 'What confuses you here? (they’ll feel it too)' };
  }
  if (a.flag === 'comment') {
    return { tag: 'Comment', placeholder: 'A comment to yourself…' };
  }
  if (a.comaType) {
    const label = a.comaType[0]!.toUpperCase() + a.comaType.slice(1);
    return { tag: `COMA · ${label}`, placeholder: 'Write what the text gives…' };
  }
  return { tag: 'Comment', placeholder: 'An observation, a meaning, an application…' };
}

/** True when a question is promotable (SPEC 6e): a non-empty expected answer. */
export function isQuestionReady(a: Annotation): boolean {
  return a.kind === 'question' && (a.expectedAnswer ?? '').trim().length > 0;
}

export function anchoredAnnotations(annotations: Annotation[]): Annotation[] {
  return annotations.filter((a) => a.verseIds.length > 0);
}

export function floatingAnnotations(annotations: Annotation[]): Annotation[] {
  return annotations.filter((a) => a.verseIds.length === 0);
}

/** Anchored annotations sorted by their first verse in canonical order (spatial margin order). */
export function sortAnchored(annotations: Annotation[]): Annotation[] {
  return [...anchoredAnnotations(annotations)].sort((a, b) =>
    compareVerseIds(firstVerse(a), firstVerse(b)),
  );
}

function firstVerse(a: Annotation): string {
  return [...a.verseIds].sort(compareVerseIds)[0] ?? '';
}

/**
 * The resting highlight tone for each verse that carries an annotation (highest-priority tone
 * wins), for tinting the passage. Only verses present in the map are annotated.
 */
export function anchorToneByVerse(annotations: Annotation[]): Map<string, AnnotationTone> {
  const out = new Map<string, AnnotationTone>();
  for (const a of annotations) {
    const tone = toneFor(a);
    for (const id of a.verseIds) {
      const prev = out.get(id);
      if (!prev || TONE_PRIORITY[tone] > TONE_PRIORITY[prev]) out.set(id, tone);
    }
  }
  return out;
}

export interface MakeAnnotationInput {
  kind: AnnotationKind;
  verseIds: string[];
  flag?: NoteFlag;
  /** The lens creating the card; omit to let `annotationOrigin` derive it from the kind. */
  origin?: AnnotationOrigin;
}

/** Build a fresh annotation with sensible per-kind defaults (id supplied by the caller). */
export function makeAnnotation(id: string, input: MakeAnnotationInput): Annotation {
  const base: Annotation = { id, kind: input.kind, verseIds: input.verseIds, text: '' };
  if (input.origin) base.origin = input.origin;
  if (input.kind === 'question') return { ...base, expectedAnswer: '' };
  if (input.kind === 'study-note') return base; // a plain card that prints for the group
  return { ...base, flag: input.flag }; // note
}

/** A question's time estimate in minutes: the explicit `estimateMinutes` when the leader has set
 *  one, else the legacy weight table (light 1 / medium 3 / heavy 6; default medium). Lets the Build
 *  timing total reflect real per-question estimates instead of the flat `medium` default. */
export function annotationMinutes(a: Pick<Annotation, 'estimateMinutes' | 'weight'>): number {
  if (typeof a.estimateMinutes === 'number') return a.estimateMinutes;
  return WEIGHT_MINUTES[a.weight ?? 'medium'];
}
