import { describe, expect, it } from 'vitest';

import { chapterCount, parseReference, verseCount } from '@/lib/verse/reference';

describe('parseReference (bcv_parser @ kjv)', () => {
  it('parses a simple verse range', () => {
    const r = parseReference('Luke 1:5-25')!;
    expect(r.osis).toBe('Luke.1.5-Luke.1.25');
    expect(r.start.verseId).toBe('LUKE.1.5');
    expect(r.end.verseId).toBe('LUKE.1.25');
    expect(r.start.book.id).toBe('luke');
    expect(r.singleBook).toBe(true);
    expect(r.extraPassages).toBe(false);
  });

  it('parses a cross-chapter range', () => {
    const r = parseReference('Luke 1:5-2:10')!;
    expect(r.osis).toBe('Luke.1.5-Luke.2.10');
    expect(r.start.verseId).toBe('LUKE.1.5');
    expect(r.end.verseId).toBe('LUKE.2.10');
    expect(r.singleBook).toBe(true);
  });

  it('treats a bare chapter as the whole chapter', () => {
    const r = parseReference('Psalm 23')!;
    expect(r.osis).toBe('Ps.23.1-Ps.23.6');
    expect(r.start.verseId).toBe('PS.23.1');
    expect(r.end.verseId).toBe('PS.23.6');
  });

  it('clamps to KJV versification — does NOT emit 3 John 15', () => {
    // Under the default (ESV-style) system bcv would emit 3John.1.15; KJV ends at v14.
    const r = parseReference('3 John 14-15')!;
    expect(r.osis).toBe('3John.1.14');
    expect(r.end.verseId).toBe('3JOHN.1.14');
  });

  it('clamps to KJV versification — does NOT emit Rev 12:18', () => {
    const r = parseReference('Revelation 12:17-18')!;
    expect(r.osis).toBe('Rev.12.17');
    expect(r.end.verseId).toBe('REV.12.17');
  });

  it('flags more than one passage (uses the first)', () => {
    const r = parseReference('Luke 1; John 3')!;
    expect(r.start.book.id).toBe('luke');
    expect(r.extraPassages).toBe(true);
    expect(r.verseList).toBe(false); // different books — genuinely separate, not a verse list
  });

  it('treats a single-book discontiguous verse list as ONE passage, not "extra" (§1.9)', () => {
    const r = parseReference('Luke 1:1,16-17,32')!;
    // Several comma-spans, all in Luke 1 → a verse list, not separate passages.
    expect(r.verseList).toBe(true);
    expect(r.extraPassages).toBe(false);
    // All spans are kept (the loader takes their union), not just the first.
    expect(r.segments).toHaveLength(3);
    expect(r.segments.map((s) => s.start.verse)).toEqual([1, 16, 32]);
    // `start`/`end`/`osis` still expose the first span for single-passage callers.
    expect(r.osis).toBe('Luke.1.1');
    expect(r.start.verseId).toBe('LUKE.1.1');
  });

  it('a simple contiguous range is neither a verse list nor extra passages', () => {
    const r = parseReference('Luke 1:5-25')!;
    expect(r.verseList).toBe(false);
    expect(r.extraPassages).toBe(false);
  });

  it('returns null for unparseable input', () => {
    expect(parseReference('')).toBeNull();
    expect(parseReference('   ')).toBeNull();
    expect(parseReference('not a reference at all')).toBeNull();
  });
});

describe('chapterCount / verseCount (KJV versification)', () => {
  it('counts chapters per book', () => {
    expect(chapterCount('Malachi')).toBe(4);
    expect(chapterCount('Genesis')).toBe(50);
    expect(chapterCount('Psalms')).toBe(150);
    expect(chapterCount('Jude')).toBe(1);
  });

  it('counts verses per chapter, clamped to KJV', () => {
    expect(verseCount('Malachi', 4)).toBe(6);
    expect(verseCount('Genesis', 1)).toBe(31);
    expect(verseCount('Psalm', 119)).toBe(176);
    // KJV numbering: 3 John ends at v14 (not the default system's 15).
    expect(verseCount('3 John', 1)).toBe(14);
    expect(verseCount('Revelation', 12)).toBe(17);
  });

  it('returns null for an unrecognised book or an out-of-range chapter', () => {
    expect(chapterCount('Nowhere')).toBeNull();
    expect(verseCount('Malachi', 9)).toBeNull();
  });

  it('§3.4 single-chapter books count deterministically (pinned single_chapter_1_strategy)', () => {
    // A single-chapter book has 1 chapter; its verses are chapter 1 (Jude 5 = verse 5, not ch 5).
    for (const [book, verses] of [
      ['Jude', 25],
      ['Philemon', 25],
      ['Obadiah', 21],
      ['2 John', 13],
      ['3 John', 14], // KJV clamps to 14
    ] as const) {
      expect(chapterCount(book)).toBe(1);
      expect(verseCount(book, 1)).toBe(verses);
    }
    // A bare number in a single-chapter book is a verse of chapter 1.
    expect(parseReference('Jude 5')?.start.verseId).toBe('JUDE.1.5');
    expect(parseReference('Philemon 10-16')?.end.verseId).toBe('PHLM.1.16');
  });
});
