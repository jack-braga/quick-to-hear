import { describe, expect, it } from 'vitest';

import type { Annotation, ThemeAimRevision } from '@/types/study';
import { hasBookSource, makeRevision, revisionsByOrigin, revisionsOf, supersede } from '@/v2/revisions';

const card = (revisions?: Annotation['revisions']): Pick<Annotation, 'revisions'> => ({ revisions });

describe('revisionsOf / revisionsByOrigin', () => {
  it('returns [] when a card has no revisions', () => {
    expect(revisionsOf(card())).toEqual([]);
    expect(revisionsByOrigin(card(), 'deepen')).toEqual([]);
  });
  it('splits the one unified list by round', () => {
    const c = card([
      makeRevision('r1', 'deepen', { text: 'own work' }),
      makeRevision('r2', 'weigh', { text: 'per Bock', source: 'Bock, Luke' }),
    ]);
    expect(revisionsByOrigin(c, 'deepen').map((r) => r.id)).toEqual(['r1']);
    expect(revisionsByOrigin(c, 'weigh').map((r) => r.id)).toEqual(['r2']);
  });
});

describe('hasBookSource', () => {
  it('is true only for a weigh revision that names a source', () => {
    expect(hasBookSource(card([makeRevision('r', 'deepen', { text: 'x', source: 'nope' })]))).toBe(false);
    expect(hasBookSource(card([makeRevision('r', 'weigh', { text: 'x' })]))).toBe(false); // no source
    expect(hasBookSource(card([makeRevision('r', 'weigh', { text: 'x', source: '  ' })]))).toBe(false);
    expect(hasBookSource(card([makeRevision('r', 'weigh', { text: 'x', source: 'France, Luke' })]))).toBe(true);
  });
});

describe('makeRevision', () => {
  it('seeds an empty text and carries overrides', () => {
    expect(makeRevision('r', 'deepen')).toEqual({ id: 'r', origin: 'deepen', text: '' });
    expect(makeRevision('r', 'weigh', { text: 't', source: 's' })).toEqual({
      id: 'r',
      origin: 'weigh',
      text: 't',
      source: 's',
    });
  });
});

describe('supersede', () => {
  const rev = (text: string, source?: string): ThemeAimRevision => ({ text, source });
  it('keeps the original primary when never re-weighed', () => {
    expect(supersede('original', [])).toEqual({ primary: 'original', earlier: [] });
  });
  it('the single weighed revision leads; the original is the demoted "was"', () => {
    expect(supersede('original', [rev('weighed', 'France')])).toEqual({
      primary: 'weighed',
      primarySource: 'France',
      was: 'original',
      earlier: [],
    });
  });
  it('multi-round: latest leads, the prior is "was", the rest are earlier newest-first', () => {
    expect(supersede('v0', [rev('v1'), rev('v2'), rev('v3', 'Bock')])).toEqual({
      primary: 'v3',
      primarySource: 'Bock',
      was: 'v2',
      earlier: ['v1', 'v0'],
    });
  });
});
