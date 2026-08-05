import { describe, expect, it } from 'vitest';

import {
  BOOKS,
  findBookById,
  findBookByOsis,
  findBookByUsfm,
  inferGenreForBook,
} from '@/lib/verse/books';

describe('book table', () => {
  it('covers the whole 66-book canon in order', () => {
    expect(BOOKS).toHaveLength(66);
    expect(BOOKS[0]!.id).toBe('genesis');
    expect(BOOKS[65]!.id).toBe('revelation');
    expect(BOOKS.map((b) => b.order)).toEqual(Array.from({ length: 66 }, (_, i) => i + 1));
  });

  it('looks up by OSIS, USFM, and slug', () => {
    expect(findBookByOsis('Luke')?.id).toBe('luke');
    expect(findBookByOsis('3John')?.id).toBe('3-john');
    expect(findBookByUsfm('LUK')?.id).toBe('luke');
    expect(findBookByUsfm('psa')?.id).toBe('psalms'); // case-insensitive
    expect(findBookById('psalms')?.osis).toBe('Ps');
    expect(findBookByOsis('Nope')).toBeUndefined();
  });

  it('infers a sensible (overridable) genre per book', () => {
    expect(inferGenreForBook('luke')).toBe('gospels-acts');
    expect(inferGenreForBook('acts')).toBe('gospels-acts');
    expect(inferGenreForBook('genesis')).toBe('ot-narrative');
    expect(inferGenreForBook('jonah')).toBe('ot-narrative');
    expect(inferGenreForBook('romans')).toBe('epistles');
    expect(inferGenreForBook('psalms')).toBe('wisdom-poetry');
    expect(inferGenreForBook('lamentations')).toBe('wisdom-poetry');
    expect(inferGenreForBook('isaiah')).toBe('prophetic');
    expect(inferGenreForBook('daniel')).toBe('prophetic');
    expect(inferGenreForBook('revelation')).toBe('apocalyptic');
    expect(inferGenreForBook('unknown-book')).toBeNull();
  });
});
