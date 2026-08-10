import { describe, expect, it } from 'vitest';

// The real method files, imported raw (build-time) so the tests validate what ships.
import auditRaw from '../../../content/method/audit.yaml?raw';
import comaRaw from '../../../content/method/coma.yaml?raw';
import formulasRaw from '../../../content/method/formulas.yaml?raw';
import genresRaw from '../../../content/method/genres.yaml?raw';
import litmusRaw from '../../../content/method/litmus.yaml?raw';
import stuckRaw from '../../../content/method/stuck-helpers.yaml?raw';
import translationsRaw from '../../../content/method/translations.yaml?raw';
import trapsRaw from '../../../content/method/traps.yaml?raw';
import warningsRaw from '../../../content/method/warnings.yaml?raw';
import { GENRES } from '@/types/study';

import {
  auditCheckById,
  auditChecks,
  comaContent,
  comaSetForGenre,
  comaSetsForGenres,
  formulasForType,
  litmusForQuestionType,
  litmusQuestionTests,
  litmusThemeTests,
  parseAudit,
  parseComa,
  parseFormulas,
  parseGenres,
  parseLitmus,
  parseStuckHelpers,
  parseTranslations,
  parseTraps,
  parseWarnings,
  questionWarnings,
  readingTipForGenre,
  stuckHelpers,
  translationCopyright,
  translationItems,
  trapsContent,
  warningById,
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

  it('ships the transcribed, cited COMA sets (every genre, all four lists filled)', () => {
    // Transcription is done: state flips to `cited` and no category is left empty.
    expect(coma.state).toBe('cited');
    for (const g of GENRES) {
      const set = coma.genres[g]!;
      expect(set.context.length, `${g} context empty`).toBeGreaterThan(0);
      expect(set.observation.length, `${g} observation empty`).toBeGreaterThan(0);
      expect(set.meaning.length, `${g} meaning empty`).toBeGreaterThan(0);
      expect(set.application.length, `${g} application empty`).toBeGreaterThan(0);
    }
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

  it('has the four per-type question tests, ids matching the QuestionType values', () => {
    const litmus = parseLitmus(litmusRaw);
    expect(litmus.question.map((t) => t.id)).toEqual([
      'context',
      'observation',
      'meaning',
      'application',
    ]);
  });

  it('litmusQuestionTests()/litmusForQuestionType resolve the inline Phase-6 tests', () => {
    expect(litmusQuestionTests()).toHaveLength(4);
    expect(litmusForQuestionType('meaning')?.text).toMatch(/observations/i);
    expect(litmusForQuestionType('nope')).toBeUndefined();
  });
});

describe('parseFormulas (real formulas.yaml)', () => {
  const groups = parseFormulas(formulasRaw);

  it('parses the four grouped lists with the authored counts', () => {
    expect(groups.observation).toHaveLength(6);
    expect(groups.meaning).toHaveLength(8);
    expect(groups.context).toHaveLength(2);
    expect(groups.application).toHaveLength(4);
  });

  it('keeps each formula id + name; authored stems carry blanks', () => {
    const countOrList = groups.observation.find((f) => f.id === 'count-or-list');
    expect(countOrList?.name).toBe('Count or list');
    expect(countOrList?.stem).toContain('____');
  });

  it('formulasForType() loads the shipped file via the glob', () => {
    expect(formulasForType('meaning').map((f) => f.id)).toContain('logic-and-connection');
  });

  it('tolerates a partially-authored group (empty stems)', () => {
    // The application group ships with names but not-yet-written stems.
    expect(groups.application.every((f) => typeof f.stem === 'string')).toBe(true);
  });
});

describe('parseWarnings (real warnings.yaml)', () => {
  const warnings = parseWarnings(warningsRaw);

  it('has the three soft warnings, each with an authored message', () => {
    expect(warnings.map((w) => w.id)).toEqual(['yes-no', 'leading', 'double-barrelled']);
    for (const w of warnings) expect(w.message.trim().length).toBeGreaterThan(0);
  });

  it('questionWarnings()/warningById resolve a message for a detection id', () => {
    expect(questionWarnings()).toHaveLength(3);
    expect(warningById('yes-no')?.message).toMatch(/yes-or-no|yes or no/i);
    expect(warningById('missing')).toBeUndefined();
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

  it('comaSetsForGenres resolves each genre to a labelled set, deduped, dropping unknowns/empties', () => {
    const rows = comaSetsForGenres(['epistles', 'epistles', null, 'not-a-genre', 'wisdom-poetry']);
    expect(rows.map((r) => r.genre)).toEqual(['epistles', 'wisdom-poetry']); // deduped; unknown/null dropped
    expect(rows[0]!.label.length).toBeGreaterThan(0);
    expect(rows[0]!.set).toHaveProperty('context');
    expect(comaSetsForGenres([])).toEqual([]);
  });
});

describe('parseAudit (real audit.yaml)', () => {
  const checks = parseAudit(auditRaw);

  it('carries the eleven SPEC audit checks in order, each with a label', () => {
    expect(checks.map((c) => c.id)).toEqual([
      'serves-theme-aim',
      'expected-answer',
      'coverage',
      'type-balance',
      'meaning-order',
      'application-last',
      'know-feel-do',
      'time-vs-length',
      'two-load-bearing',
      'gospel-plain',
      'prayer-point',
    ]);
    for (const c of checks) expect(c.label.length).toBeGreaterThan(0);
  });

  it('marks gospel-plain as the one conditional check', () => {
    const gp = checks.find((c) => c.id === 'gospel-plain');
    expect(gp?.conditional).toMatch(/mixed|one-to-one/i);
    // The others are unconditional.
    expect(checks.filter((c) => c.conditional).map((c) => c.id)).toEqual(['gospel-plain']);
  });

  it('tolerates the empty `help` skeleton without throwing', () => {
    // Every help is still "" (authored teaching lives in content/help/phase7); must parse.
    expect(() => parseAudit(auditRaw)).not.toThrow();
    expect(checks.every((c) => typeof c.help === 'string')).toBe(true);
  });

  it('auditChecks() / auditCheckById() load the shipped file via the glob', () => {
    expect(auditChecks().length).toBe(11);
    expect(auditCheckById('coverage')?.label).toMatch(/untouched/i);
    expect(auditCheckById('nope')).toBeUndefined();
  });
});

describe('parseTranslations (real translations.yaml)', () => {
  const items = parseTranslations(translationsRaw);

  it('carries an exact, non-empty copyright line for the bundled translations', () => {
    const webbe = items.find((t) => t.id === 'webbe');
    const asv = items.find((t) => t.id === 'asv');
    expect(webbe?.copyrightLine).toMatch(/World English Bible/);
    expect(asv?.copyrightLine).toMatch(/American Standard Version/);
    for (const t of items) expect(t.copyrightLine.length).toBeGreaterThan(0);
  });

  it('translationCopyright() resolves the shipped line by id, else empty', () => {
    expect(translationCopyright('webbe')).toMatch(/public domain/i);
    expect(translationCopyright('asv')).toMatch(/1901/);
    expect(translationCopyright('nope')).toBe('');
    expect(translationCopyright(null)).toBe('');
  });

  it('translationItems() loads + validates the shipped file', () => {
    expect(translationItems().map((t) => t.id)).toContain('webbe');
  });
});
