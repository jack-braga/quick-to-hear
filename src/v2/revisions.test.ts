import { describe, expect, it } from 'vitest';

import type { Annotation, ThemeAimRevision } from '@/types/study';
import { makeRevision, revisionsOf, supersede, weighedText } from '@/v2/revisions';

const card = (revisions?: Annotation['revisions']): Pick<Annotation, 'revisions'> => ({ revisions });

describe('revisionsOf', () => {
  it('returns [] when a card has no revisions', () => {
    expect(revisionsOf(card())).toEqual([]);
  });
  it('returns every revision in append order', () => {
    const c = card([
      makeRevision('r1', 'deepen', { text: 'own work' }),
      makeRevision('r2', 'weigh', { text: 'per Bock', source: 'Bock, Luke' }),
    ]);
    expect(revisionsOf(c).map((r) => r.id)).toEqual(['r1', 'r2']);
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

describe('weighedText (committed value for the leader export)', () => {
  const rev = (text: string): ThemeAimRevision => ({ text });
  it('returns the original when there are no revisions', () => {
    expect(weighedText('theme A', [])).toBe('theme A');
  });
  it('ignores a blank in-progress "revise" draft and keeps the original', () => {
    // The bug: clicking "revise" appends {text:''} before typing; supersede().primary would be '',
    // which used to blank the Theme/Aim line out of the leader's notes entirely.
    expect(weighedText('theme A', [rev('')])).toBe('theme A');
  });
  it('falls back to the last non-empty revision when a newer one is still blank', () => {
    expect(weighedText('theme A', [rev('theme B'), rev('   ')])).toBe('theme B');
  });
  it('returns the latest revision when it carries text', () => {
    expect(weighedText('theme A', [rev('theme B')])).toBe('theme B');
  });
});
