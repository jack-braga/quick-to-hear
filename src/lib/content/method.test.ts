import { describe, expect, it } from 'vitest';

// The real method files, imported raw (build-time) so the tests validate what ships.
import comaRaw from '../../../content/method/coma.yaml?raw';
import genresRaw from '../../../content/method/genres.yaml?raw';
import { GENRES } from '@/types/study';

import { comaContent, comaSetForGenre, parseComa, parseGenres, readingTipForGenre } from './method';

describe('parseComa (real coma.yaml)', () => {
  const coma = parseComa(comaRaw);

  it('keeps the Matthias Media / HTC attribution (Inviolable rule 8)', () => {
    expect(coma.attribution).toMatch(/Matthias Media/);
    expect(coma.attribution.length).toBeGreaterThan(0);
  });

  it('has a prompt set for every one of the six genres, each with four lists', () => {
    for (const g of GENRES) {
      const set = coma.genres[g];
      expect(set, `missing coma set for genre ${g}`).toBeDefined();
      expect(Array.isArray(set!.context)).toBe(true);
      expect(Array.isArray(set!.observation)).toBe(true);
      expect(Array.isArray(set!.meaning)).toBe(true);
      expect(Array.isArray(set!.application)).toBe(true);
    }
  });

  it('tolerates the empty `todo` skeleton (verbatim prompts authored by hand later)', () => {
    // The skeleton ships with empty lists; that must parse, not throw.
    expect(coma.state).toBe('todo');
    expect(coma.genres['epistles']!.meaning).toEqual([]);
  });
});

describe('parseComa (validation)', () => {
  it('preserves authored prompts verbatim', () => {
    const set = parseComa(`
attribution: "x used by permission"
genres:
  epistles:
    context: ["What has been said so far?"]
    observation: ["Track the connective 'therefore'."]
    meaning: []
    application: []
`);
    expect(set.genres['epistles']!.context).toEqual(['What has been said so far?']);
    expect(set.genres['epistles']!.observation[0]).toBe("Track the connective 'therefore'.");
  });

  it('requires a non-empty attribution', () => {
    expect(() => parseComa(`genres: {}`)).toThrow();
    expect(() => parseComa(`attribution: ""`)).toThrow();
  });

  it('coerces a bare (null) category to an empty list', () => {
    const set = parseComa(`
attribution: "x"
genres:
  epistles:
    context:
    observation:
    meaning:
    application:
`);
    expect(set.genres['epistles']!.context).toEqual([]);
  });
});

describe('parseGenres (real genres.yaml)', () => {
  const items = parseGenres(genresRaw);

  it('lists all six genres with a coma-set mapping', () => {
    expect(items.map((i) => i.id).sort()).toEqual([...GENRES].sort());
    for (const i of items) expect(i.comaSet.length).toBeGreaterThan(0);
  });

  it('defaults an unauthored readingTip to an empty string', () => {
    for (const i of items) expect(typeof i.readingTip).toBe('string');
  });
});

describe('accessors (real files via glob)', () => {
  it('comaContent() loads + validates the shipped file', () => {
    expect(comaContent().attribution).toMatch(/permission/);
  });

  it('comaSetForGenre maps a genre to its four-category set', () => {
    const set = comaSetForGenre('epistles');
    expect(set).not.toBeNull();
    expect(set!).toHaveProperty('meaning');
  });

  it('comaSetForGenre / readingTipForGenre are null/empty for an unset genre', () => {
    expect(comaSetForGenre(null)).toBeNull();
    expect(readingTipForGenre(null)).toBe('');
  });
});
