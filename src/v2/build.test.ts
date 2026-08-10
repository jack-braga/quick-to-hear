import { describe, expect, it } from 'vitest';

import { moveBefore, moveBy, orderedQuestions, questionAnnotations } from '@/v2/build';
import type { Annotation } from '@/types/study';

const q = (id: string, verse: number): Annotation => ({
  id,
  kind: 'question',
  verseIds: [`LUKE.1.${verse}`],
  text: `Q${id}`,
  expectedAnswer: '',
});
const note: Annotation = { id: 'n', kind: 'note', verseIds: ['LUKE.1.5'], text: '' };

describe('questionAnnotations', () => {
  it('keeps only questions', () => {
    expect(questionAnnotations([q('a', 8), note]).map((a) => a.id)).toEqual(['a']);
  });
});

describe('orderedQuestions', () => {
  const anns = [q('c', 13), q('a', 10), q('b', 8), note];

  it('defaults to verse order when there is no running order', () => {
    expect(orderedQuestions(anns, []).map((a) => a.id)).toEqual(['b', 'a', 'c']);
  });

  it('honours the running order, then appends the rest by verse', () => {
    // Only 'c' and 'b' ordered; 'a' (v10) appends after in verse order.
    expect(orderedQuestions(anns, ['c', 'b']).map((a) => a.id)).toEqual(['c', 'b', 'a']);
  });

  it('ignores ids no longer present (a deleted question)', () => {
    expect(orderedQuestions(anns, ['gone', 'a', 'b']).map((a) => a.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('moveBefore', () => {
  it('drops the dragged id before the target', () => {
    expect(moveBefore(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b']);
    expect(moveBefore(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'a', 'c']);
    expect(moveBefore(['a', 'b', 'c'], 'a', 'a')).toEqual(['a', 'b', 'c']);
  });
});

describe('moveBy', () => {
  it('nudges up/down and clamps at the ends', () => {
    expect(moveBy(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveBy(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
    expect(moveBy(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c']);
    expect(moveBy(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c']);
  });
});
