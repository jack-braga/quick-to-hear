import { describe, expect, it } from 'vitest';

import {
  anchorToneByVerse,
  anchoredAnnotations,
  floatingAnnotations,
  isQuestionReady,
  makeAnnotation,
  sortAnchored,
  toneFor,
} from '@/v2/annotations';
import type { Annotation } from '@/types/study';

const note = (over: Partial<Annotation> = {}): Annotation => ({
  id: 'n',
  kind: 'note',
  verseIds: ['LUKE.1.5'],
  text: '',
  ...over,
});

describe('toneFor', () => {
  it('maps kinds to accents', () => {
    expect(toneFor(note({ flag: 'confusing' }))).toBe('rubric');
    expect(toneFor(note({ kind: 'question', expectedAnswer: '' }))).toBe('amber');
    expect(toneFor(note())).toBe('lapis');
    expect(toneFor(note({ kind: 'cross-ref', reference: 'Malachi 4:5' }))).toBe('lapis');
    expect(toneFor(note({ flag: 'comment' }))).toBe('lapis');
  });
});

describe('anchorToneByVerse', () => {
  it('gives each verse its highest-priority tone (rubric > amber > lapis)', () => {
    const anns: Annotation[] = [
      note({ id: 'a', kind: 'note', verseIds: ['LUKE.1.5'] }), // lapis
      note({ id: 'b', kind: 'question', verseIds: ['LUKE.1.5', 'LUKE.1.6'] }), // amber
      note({ id: 'c', kind: 'note', flag: 'confusing', verseIds: ['LUKE.1.6'] }), // rubric
    ];
    const map = anchorToneByVerse(anns);
    expect(map.get('LUKE.1.5')).toBe('amber'); // amber beats lapis
    expect(map.get('LUKE.1.6')).toBe('rubric'); // rubric beats amber
  });
});

describe('anchored / floating split', () => {
  it('separates by whether verseIds is empty', () => {
    const anns = [note({ id: 'a' }), note({ id: 'f', verseIds: [] })];
    expect(anchoredAnnotations(anns).map((a) => a.id)).toEqual(['a']);
    expect(floatingAnnotations(anns).map((a) => a.id)).toEqual(['f']);
  });
});

describe('sortAnchored', () => {
  it('orders by first verse canonically and drops floating ones', () => {
    const anns = [
      note({ id: 'late', verseIds: ['LUKE.1.20'] }),
      note({ id: 'floating', verseIds: [] }),
      note({ id: 'early', verseIds: ['LUKE.1.8', 'LUKE.1.9'] }),
    ];
    expect(sortAnchored(anns).map((a) => a.id)).toEqual(['early', 'late']);
  });
});

describe('isQuestionReady', () => {
  it('is true only for a question with a non-empty expected answer', () => {
    expect(isQuestionReady(note({ kind: 'question', expectedAnswer: 'Because…' }))).toBe(true);
    expect(isQuestionReady(note({ kind: 'question', expectedAnswer: '  ' }))).toBe(false);
    expect(isQuestionReady(note({ kind: 'question' }))).toBe(false);
    expect(isQuestionReady(note())).toBe(false); // a note is never "ready to promote"
  });
});

describe('makeAnnotation', () => {
  it('seeds per-kind fields', () => {
    expect(makeAnnotation('1', { kind: 'note', verseIds: ['LUKE.1.5'], flag: 'confusing' })).toEqual({
      id: '1',
      kind: 'note',
      verseIds: ['LUKE.1.5'],
      text: '',
      flag: 'confusing',
    });
    expect(makeAnnotation('2', { kind: 'question', verseIds: ['LUKE.1.5'] })).toMatchObject({
      kind: 'question',
      expectedAnswer: '',
    });
    expect(makeAnnotation('3', { kind: 'cross-ref', verseIds: ['LUKE.1.5'] })).toMatchObject({
      kind: 'cross-ref',
      reference: '',
      returnQuestion: '',
    });
  });
});
