import { compareVerseIds } from '@/lib/verse/ids';
import type { Annotation, QuestionType } from '@/types/study';

/**
 * Pure logic for the Build lens (v2.6) — the running order of questions (the sequence that
 * exports). Kept framework-free + unit-tested; the lens is a thin component over it.
 *
 * The stored `runningOrder` is the source of truth once the user reorders; anything not yet in
 * it (a freshly-authored question) is appended in **verse order** — so new questions slot in near
 * their text, and the default (empty `runningOrder`) is pure verse order.
 */

export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'context', label: 'Context' },
  { value: 'observation', label: 'Observation' },
  { value: 'meaning', label: 'Meaning' },
  { value: 'application', label: 'Application' },
];

export function questionAnnotations(annotations: Annotation[]): Annotation[] {
  return annotations.filter((a) => a.kind === 'question');
}

function firstVerse(a: Annotation): string {
  return [...a.verseIds].sort(compareVerseIds)[0] ?? '';
}

/** The question annotations in effective order: the stored order first (existing questions only),
 *  then any not-yet-ordered questions by verse. */
export function orderedQuestions(annotations: Annotation[], runningOrder: string[]): Annotation[] {
  const questions = questionAnnotations(annotations);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const verseOrder = [...questions]
    .sort((a, b) => compareVerseIds(firstVerse(a), firstVerse(b)))
    .map((q) => q.id);

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

/** Move `dragId` to sit immediately before `targetId` (drag-and-drop drop). */
export function moveBefore(ids: string[], dragId: string, targetId: string): string[] {
  if (dragId === targetId) return ids;
  const without = ids.filter((id) => id !== dragId);
  const idx = without.indexOf(targetId);
  if (idx === -1) return ids;
  return [...without.slice(0, idx), dragId, ...without.slice(idx)];
}

/** Nudge `id` up (delta -1) or down (delta +1), clamped to the ends. */
export function moveBy(ids: string[], id: string, delta: number): string[] {
  const i = ids.indexOf(id);
  if (i === -1) return ids;
  const j = Math.max(0, Math.min(ids.length - 1, i + delta));
  if (i === j) return ids;
  const copy = [...ids];
  copy.splice(i, 1);
  copy.splice(j, 0, id);
  return copy;
}
