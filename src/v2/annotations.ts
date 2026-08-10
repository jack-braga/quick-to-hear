import { compareVerseIds } from '@/lib/verse/ids';
import type { Annotation, AnnotationKind, NoteFlag } from '@/types/study';

/**
 * Pure helpers for the v2 annotation layer (ROADMAP-v2 §2) — the load-bearing logic the reader
 * and margin render, kept framework-free and unit-tested (the house pattern). Annotations
 * anchor whole-verse by canonical id, so there is no reconcile/degrade logic; an empty
 * `verseIds` marks a floating (study-level) note.
 */

/** The accent a kind reads in: confusing = rubric (red), question = amber, everything else = lapis. */
export type AnnotationTone = 'rubric' | 'lapis' | 'amber';

export function toneFor(a: Annotation): AnnotationTone {
  if (a.kind === 'question') return 'amber';
  if (a.kind === 'note' && a.flag === 'confusing') return 'rubric';
  return 'lapis';
}

/** Priority when a verse carries several annotations: the resting tint shows the most notable. */
const TONE_PRIORITY: Record<AnnotationTone, number> = { rubric: 3, amber: 2, lapis: 1 };

/** UI copy per annotation kind/flag (tag shown on the card + the editor placeholder). */
export function annotationMeta(a: Annotation): { tag: string; placeholder: string } {
  if (a.kind === 'question') {
    return { tag: 'Question', placeholder: 'Draft a question anchored to these verses…' };
  }
  if (a.kind === 'cross-ref') {
    return { tag: 'Cross-reference', placeholder: 'Why does this passage connect here?' };
  }
  if (a.flag === 'confusing') {
    return { tag: 'Mark · confusing', placeholder: 'What confuses you here? (they’ll feel it too)' };
  }
  if (a.flag === 'comment') {
    return { tag: 'Comment', placeholder: 'A note to yourself…' };
  }
  return { tag: 'Note', placeholder: 'An observation, a meaning, an application…' };
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
}

/** Build a fresh annotation with sensible per-kind defaults (id supplied by the caller). */
export function makeAnnotation(id: string, input: MakeAnnotationInput): Annotation {
  const base: Annotation = { id, kind: input.kind, verseIds: input.verseIds, text: '' };
  if (input.kind === 'note') return { ...base, flag: input.flag };
  if (input.kind === 'question') return { ...base, expectedAnswer: '' };
  return { ...base, reference: '', returnQuestion: '' }; // cross-ref
}
