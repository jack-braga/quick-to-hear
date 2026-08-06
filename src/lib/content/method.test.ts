import { describe, expect, it } from 'vitest';

// The real method files, imported raw (build-time) so the tests validate what ships.
import comaRaw from '../../../content/method/coma.yaml?raw';
import genresRaw from '../../../content/method/genres.yaml?raw';
import litmusRaw from '../../../content/method/litmus.yaml?raw';
import stuckRaw from '../../../content/method/stuck-helpers.yaml?raw';
import trapsRaw from '../../../content/method/traps.yaml?raw';
import { GENRES } from '@/types/study';

import {
  comaContent,
  comaSetForGenre,
  litmusThemeTests,
  parseComa,
  parseGenres,
  parseLitmus,
  parseStuckHelpers,
  parseTraps,
  readingTipForGenre,
  stuckHelpers,
  trapsContent,
} from './method';

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

  it('carries the authored placeholder notice (shown until state → cited)', () => {
    expect(coma.placeholder).toBeTruthy();
    expect(coma.placeholder).toMatch(/placeholder/i);
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

describe('parseLitmus (real litmus.yaml)', () => {
  const litmus = parseLitmus(litmusRaw);

  it('has the five authored theme tests, each with an id + non-empty text', () => {
    expect(litmus.theme).toHaveLength(5);
    for (const t of litmus.theme) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.text.trim().length).toBeGreaterThan(0);
    }
  });

  it('carries the expected theme test ids (drives litmusAcks keys)', () => {
    expect(litmus.theme.map((t) => t.id)).toEqual([
      'author-recognise',
      'needs-this-passage',
      'devout-non-christian',
      'everything-serves',
      'contributes-uniquely',
    ]);
  });

  it('litmusThemeTests() returns only non-empty-text theme tests', () => {
    const tests = litmusThemeTests();
    expect(tests).toHaveLength(5);
    expect(tests.every((t) => t.text.trim().length > 0)).toBe(true);
  });
});

describe('parseTraps (real traps.yaml)', () => {
  const traps = parseTraps(trapsRaw);

  it('keeps the Goldsworthy attribution + is marked cited', () => {
    expect(traps.attribution).toMatch(/Goldsworthy/);
    expect(traps.state).toBe('cited');
  });

  it('has the four traps, each with looksLike + check', () => {
    expect(traps.items.map((t) => t.id)).toEqual([
      'moralism',
      'allegory',
      'christless-history',
      'flattening',
    ]);
    for (const t of traps.items) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.looksLike.length).toBeGreaterThan(0);
      expect(t.check.length).toBeGreaterThan(0);
    }
  });

  it('requires a non-empty attribution (SPEC §7 credit must show)', () => {
    expect(() => parseTraps(`items: []`)).toThrow();
  });
});

describe('parseStuckHelpers (real stuck-helpers.yaml)', () => {
  const helpers = parseStuckHelpers(stuckRaw);

  it('has the five on-demand helpers, each with a name + text', () => {
    expect(helpers).toHaveLength(5);
    for (const h of helpers) {
      expect(h.name.length).toBeGreaterThan(0);
      expect(h.text.trim().length).toBeGreaterThan(0);
    }
  });

  it('stuckHelpers() loads the shipped file via the glob', () => {
    expect(stuckHelpers().map((h) => h.id)).toContain('tell-it-back');
  });
});

describe('accessors (real files via glob)', () => {
  it('comaContent() loads + validates the shipped file', () => {
    expect(comaContent().attribution).toMatch(/permission/);
  });

  it('trapsContent() loads + validates the shipped file', () => {
    expect(trapsContent().items).toHaveLength(4);
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
