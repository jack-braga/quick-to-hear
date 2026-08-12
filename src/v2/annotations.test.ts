import { describe, expect, it } from 'vitest';

import {
  anchorToneByVerse,
  anchoredAnnotations,
  annotationMinutes,
  annotationOrigin,
  filterByOrigins,
  floatingAnnotations,
  isQuestionReady,
  makeAnnotation,
  presentOrigins,
  rejectByOrigins,
  sortAnchored,
  toneFor,
  verseTones,
} from '@/v2/annotations';
import type { Annotation, AnnotationOrigin } from '@/types/study';

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

describe('annotationOrigin', () => {
  it('uses the stored origin, else derives from kind', () => {
    expect(annotationOrigin(note({ origin: 'theme' }))).toBe('theme'); // stored wins
    expect(annotationOrigin(note({ kind: 'question' }))).toBe('questions'); // derived
    expect(annotationOrigin(note({ kind: 'study-note' }))).toBe('questions'); // authored in Write
    expect(annotationOrigin(note({ comaType: 'meaning' }))).toBe('coma'); // a COMA-typed note
    expect(annotationOrigin(note())).toBe('map'); // plain note falls back to Map
  });
});

describe('annotationMinutes', () => {
  it('uses the explicit estimate when set (including 0)', () => {
    expect(annotationMinutes(note({ kind: 'question', estimateMinutes: 7 }))).toBe(7);
    expect(annotationMinutes(note({ kind: 'question', estimateMinutes: 0 }))).toBe(0);
  });
  it('falls back to the weight table, defaulting medium', () => {
    expect(annotationMinutes(note({ kind: 'question' }))).toBe(3); // no weight → medium
    expect(annotationMinutes(note({ kind: 'question', weight: 'light' }))).toBe(1);
    expect(annotationMinutes(note({ kind: 'question', weight: 'heavy' }))).toBe(6);
  });
});

describe('presentOrigins + filterByOrigins', () => {
  const anns = [
    note({ id: 'm', origin: 'map' }),
    note({ id: 'c', origin: 'coma' }),
    note({ id: 'q', kind: 'question' }), // derived → questions
  ];
  it('lists present origins in flow order', () => {
    expect(presentOrigins(anns)).toEqual(['map', 'coma', 'questions']);
  });
  it('filters to the active origins; empty set shows all', () => {
    expect(filterByOrigins(anns, new Set<AnnotationOrigin>(['coma'])).map((a) => a.id)).toEqual(['c']);
    expect(filterByOrigins(anns, new Set<AnnotationOrigin>()).map((a) => a.id)).toEqual(['m', 'c', 'q']);
  });
  it('rejectByOrigins hides the toggled-off origins; empty hidden shows all; all hidden shows none', () => {
    expect(rejectByOrigins(anns, new Set<AnnotationOrigin>()).map((a) => a.id)).toEqual(['m', 'c', 'q']);
    expect(rejectByOrigins(anns, new Set<AnnotationOrigin>(['coma'])).map((a) => a.id)).toEqual(['m', 'q']);
    expect(rejectByOrigins(anns, new Set<AnnotationOrigin>(['map', 'coma', 'questions']))).toEqual([]);
  });
});

describe('verseTones', () => {
  it('collects the distinct tones per verse, highest-priority first', () => {
    const anns: Annotation[] = [
      note({ id: 'a', verseIds: ['LUKE.1.5'] }), // lapis
      note({ id: 'b', kind: 'question', verseIds: ['LUKE.1.5'] }), // amber
      note({ id: 'c', flag: 'confusing', verseIds: ['LUKE.1.5'] }), // rubric
      note({ id: 'd', verseIds: ['LUKE.1.6'] }), // lapis only
    ];
    expect(verseTones(anns).get('LUKE.1.5')).toEqual(['rubric', 'amber', 'lapis']); // 3-tone stripe
    expect(verseTones(anns).get('LUKE.1.6')).toEqual(['lapis']); // single tone → flat
  });
});

describe('makeAnnotation', () => {
  it('carries an explicit origin when given', () => {
    expect(makeAnnotation('o', { kind: 'note', verseIds: [], origin: 'coma' })).toMatchObject({
      origin: 'coma',
    });
    expect(makeAnnotation('o', { kind: 'note', verseIds: [] }).origin).toBeUndefined();
  });
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
    expect(
      makeAnnotation('3', { kind: 'study-note', verseIds: ['LUKE.1.5'], origin: 'questions' }),
    ).toEqual({
      id: '3',
      kind: 'study-note',
      verseIds: ['LUKE.1.5'],
      text: '',
      origin: 'questions',
    });
  });
});
