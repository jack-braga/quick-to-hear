import { describe, expect, it } from 'vitest';

import { extractReading } from '@/lib/bible/extract';
import { parseUsfmBook } from '@/lib/bible/usfm';
import { allVerses, textlessVerseIds, verseIds } from '@/types/passage';

// Two editions of Matthew 17: WEBBE carries v21; the eBible ASV omits it (footnote only).
const MAT_WEBBE = `\\id MAT Test
\\c 17
\\p
\\v 20 He said to them, Because of your little faith.
\\v 21 But this kind doesn't go out except by prayer and fasting.
\\v 22 While they were staying in Galilee,
`;
const MAT_ASV = `\\id MAT Test
\\c 17
\\p
\\v 20 And he saith unto them, Because of your little faith.
\\v 21 \\f + \\fr 17:21 \\ft Many authorities insert v. 21.\\f*
\\v 22 And while they abode in Galilee,
`;

const PSALM = `\\id PSA Test
\\c 23
\\d A Psalm by David.
\\q1
\\v 1 The LORD is my shepherd;
\\q2 I shall lack nothing.
\\q1
\\v 2 He leads me.
\\q1
\\v 3 He restores my soul.
`;

const TWO_CHAPTERS = `\\id LUK Test
\\c 1
\\p
\\v 1 one one
\\v 2 one two
\\v 3 one three
\\c 2
\\p
\\v 1 two one
\\v 2 two two
`;

const webbeMat = parseUsfmBook(MAT_WEBBE, { translationId: 'webbe' })!;
const asvMat = parseUsfmBook(MAT_ASV, { translationId: 'asv' })!;
const psalm = parseUsfmBook(PSALM, { translationId: 'webbe' })!;
const luke = parseUsfmBook(TWO_CHAPTERS, { translationId: 'webbe' })!;

describe('extractReading', () => {
  it('slices a verse range and keeps the gap verse (present:false) inside it', () => {
    const pt = extractReading(asvMat, {
      startId: 'MATT.17.20',
      endId: 'MATT.17.22',
      reference: 'Matthew 17:20-22',
    });
    expect(verseIds(pt)).toEqual(['MATT.17.20', 'MATT.17.21', 'MATT.17.22']);
    expect(allVerses(pt).find((v) => v.verseId === 'MATT.17.21')!.present).toBe(false);
    expect(pt.reference).toBe('Matthew 17:20-22');
    expect(pt.translationId).toBe('asv');
  });

  it('keeps the superscription when verse 1 is in range', () => {
    const pt = extractReading(psalm, { startId: 'PS.23.1', endId: 'PS.23.3', reference: 'Psalm 23' });
    expect(pt.blocks[0]!.kind).toBe('d');
    expect(pt.blocks[0]!.text?.map((f) => f.text).join(' ')).toBe('A Psalm by David.');
    expect(verseIds(pt)).toEqual(['PS.23.1', 'PS.23.2', 'PS.23.3']);
  });

  it('trims verses outside the range', () => {
    const pt = extractReading(psalm, { startId: 'PS.23.2', endId: 'PS.23.2', reference: 'Psalm 23:2' });
    expect(verseIds(pt)).toEqual(['PS.23.2']);
  });

  it('spans chapters within a book', () => {
    const pt = extractReading(luke, {
      startId: 'LUKE.1.2',
      endId: 'LUKE.2.1',
      reference: 'Luke 1:2-2:1',
    });
    expect(verseIds(pt)).toEqual(['LUKE.1.2', 'LUKE.1.3', 'LUKE.2.1']);
  });

  it('flags the now-textless verse when the primary switches WEBBE → ASV', () => {
    const range = { startId: 'MATT.17.20', endId: 'MATT.17.22', reference: 'Matthew 17:20-22' };
    const web = extractReading(webbeMat, range);
    const asv = extractReading(asvMat, range);

    // In WEBBE all three verses have text; in ASV v21 is textless.
    const priorPresent = allVerses(web)
      .filter((v) => v.present)
      .map((v) => v.verseId);
    expect(priorPresent).toEqual(['MATT.17.20', 'MATT.17.21', 'MATT.17.22']);
    expect(textlessVerseIds(asv, priorPresent)).toEqual(['MATT.17.21']);
    // …and it's a present-vs-absent flag: the ID is still in the reading, just textless.
    expect(verseIds(asv)).toContain('MATT.17.21');
  });
});
