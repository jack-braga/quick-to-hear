import { describe, expect, it } from 'vitest';

import {
  compareVerseIds,
  makeVerseId,
  parseVerseId,
  verseIdInRange,
  verseSortKey,
} from '@/lib/verse/ids';

describe('verse ids', () => {
  it('builds canonical IDs as uppercased OSIS.chapter.verse', () => {
    expect(makeVerseId('Luke', 1, 5)).toBe('LUKE.1.5');
    expect(makeVerseId('Ps', 23, 1)).toBe('PS.23.1');
    expect(makeVerseId('3John', 1, 14)).toBe('3JOHN.1.14');
  });

  it('parses IDs back to a book + chapter + verse', () => {
    const p = parseVerseId('LUKE.1.5');
    expect(p?.book.id).toBe('luke');
    expect(p?.chapter).toBe(1);
    expect(p?.verse).toBe(5);
    expect(p?.suffix).toBe('');
  });

  it('tolerates a future letter suffix without special logic', () => {
    const p = parseVerseId('LUKE.1.1A');
    expect(p?.verse).toBe(1);
    expect(p?.suffix).toBe('A');
  });

  it('returns null for malformed or unknown IDs', () => {
    expect(parseVerseId('nonsense')).toBeNull();
    expect(parseVerseId('ZZZ.1.1')).toBeNull();
    expect(parseVerseId('LUKE.1')).toBeNull();
  });

  it('orders verses by book → chapter → verse', () => {
    expect(compareVerseIds('LUKE.1.5', 'LUKE.1.25')).toBeLessThan(0);
    expect(compareVerseIds('LUKE.1.25', 'LUKE.2.1')).toBeLessThan(0);
    expect(compareVerseIds('MATT.1.1', 'LUKE.1.1')).toBeLessThan(0); // Matthew before Luke
    expect(compareVerseIds('LUKE.1.5', 'LUKE.1.5')).toBe(0);
    // unknown IDs sort last, deterministically
    expect(verseSortKey('bad')).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('tests inclusive range membership, including across chapters', () => {
    expect(verseIdInRange('LUKE.1.10', 'LUKE.1.5', 'LUKE.1.25')).toBe(true);
    expect(verseIdInRange('LUKE.1.5', 'LUKE.1.5', 'LUKE.1.25')).toBe(true); // inclusive start
    expect(verseIdInRange('LUKE.1.25', 'LUKE.1.5', 'LUKE.1.25')).toBe(true); // inclusive end
    expect(verseIdInRange('LUKE.1.4', 'LUKE.1.5', 'LUKE.1.25')).toBe(false);
    expect(verseIdInRange('LUKE.1.26', 'LUKE.1.5', 'LUKE.1.25')).toBe(false);
    // cross-chapter range
    expect(verseIdInRange('LUKE.2.1', 'LUKE.1.5', 'LUKE.2.10')).toBe(true);
    expect(verseIdInRange('LUKE.2.11', 'LUKE.1.5', 'LUKE.2.10')).toBe(false);
  });
});
