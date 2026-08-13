import { describe, expect, it } from 'vitest';

import { bookHits, numHits, referenceSuggest } from '@/v2/reader/referenceSuggest';

describe('referenceSuggest', () => {
  it('suggests books while typing the name (or when empty)', () => {
    expect(referenceSuggest('')).toEqual({ mode: 'book', query: '' });
    expect(referenceSuggest('Mal')).toEqual({ mode: 'book', query: 'Mal' });
    expect(referenceSuggest('Malachi')).toEqual({ mode: 'book', query: 'Malachi' });
  });

  it('switches to a chapter grid once the book resolves + a space', () => {
    expect(referenceSuggest('Malachi ')).toEqual({ mode: 'chapter', book: 'Malachi' });
    expect(referenceSuggest('Malachi 4')).toEqual({ mode: 'chapter', book: 'Malachi' });
  });

  it('switches to a verse grid once a chapter + colon are typed', () => {
    expect(referenceSuggest('Malachi 4:')).toEqual({ mode: 'verse', book: 'Malachi', chapter: 4 });
    expect(referenceSuggest('Malachi 4:5')).toEqual({ mode: 'verse', book: 'Malachi', chapter: 4 });
  });

  it('returns null for gibberish that is not a book', () => {
    expect(referenceSuggest('zzzz 4:5')).toBeNull();
  });
});

describe('bookHits', () => {
  it('matches by name/short-name prefix', () => {
    const hits = bookHits('Mal');
    expect(hits.some((b) => b.name === 'Malachi')).toBe(true);
    expect(hits.length).toBeLessThanOrEqual(8);
  });
});

describe('numHits', () => {
  it('lists chapters/verses (KJV counts) and nothing for book mode', () => {
    expect(numHits({ mode: 'chapter', book: 'Malachi' })).toEqual([1, 2, 3, 4]); // Malachi has 4 chapters
    expect(numHits({ mode: 'verse', book: 'Malachi', chapter: 4 })).toEqual([1, 2, 3, 4, 5, 6]); // 4:1–6
    expect(numHits({ mode: 'book', query: 'x' })).toEqual([]);
    expect(numHits(null)).toEqual([]);
  });
});
