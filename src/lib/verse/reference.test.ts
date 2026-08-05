import { describe, expect, it } from 'vitest';

import { parseReference } from '@/lib/verse/reference';

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
  });

  it('returns null for unparseable input', () => {
    expect(parseReference('')).toBeNull();
    expect(parseReference('   ')).toBeNull();
    expect(parseReference('not a reference at all')).toBeNull();
  });
});
