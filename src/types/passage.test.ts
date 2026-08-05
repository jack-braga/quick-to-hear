import { describe, expect, it } from 'vitest';

import {
  ParsedTextSchema,
  allVerses,
  textlessVerseIds,
  verseIds,
  verseText,
  type VerseSpan,
} from '@/types/passage';

const span = (verseId: string, present: boolean, ...texts: string[]): VerseSpan => ({
  verseId,
  present,
  fragments: texts.map((t) => ({ text: t, qlevel: 0 })),
});

describe('passage model helpers', () => {
  it('joins fragments into a clean verse text', () => {
    expect(verseText(span('LUKE.1.5', true, 'Hello', 'world'))).toBe('Hello world');
    expect(verseText(span('LUKE.1.5', true, '  spaced   out  '))).toBe('spaced out');
  });

  it('flattens verses and IDs in document order', () => {
    const pt = ParsedTextSchema.parse({
      translationId: 'webbe',
      reference: 'Luke 1:5-6',
      blocks: [{ kind: 'p', verses: [span('LUKE.1.5', true, 'a'), span('LUKE.1.6', true, 'b')] }],
    });
    expect(allVerses(pt)).toHaveLength(2);
    expect(verseIds(pt)).toEqual(['LUKE.1.5', 'LUKE.1.6']);
  });

  it('flags verse IDs with no text (present:false or absent)', () => {
    const pt = ParsedTextSchema.parse({
      translationId: 'asv',
      blocks: [
        {
          kind: 'p',
          verses: [span('MATT.17.20', true, 'x'), span('MATT.17.21', false), span('MATT.17.22', true, 'y')],
        },
      ],
    });
    // 20 & 22 present; 21 textless; 99 not in the reading at all
    expect(textlessVerseIds(pt, ['MATT.17.20', 'MATT.17.21', 'MATT.17.22', 'MATT.17.99'])).toEqual([
      'MATT.17.21',
      'MATT.17.99',
    ]);
  });

  it('applies schema defaults (versification kjv, empty arrays)', () => {
    const pt = ParsedTextSchema.parse({ translationId: 'webbe' });
    expect(pt.versification).toBe('kjv');
    expect(pt.reference).toBe('');
    expect(pt.blocks).toEqual([]);
    expect(pt.notes).toEqual([]);
  });
});
