import { describe, expect, it } from 'vitest';

import type { ParsedText } from '@/types/passage';
import type { Passage } from '@/types/study';
import {
  addSecondary,
  loadFreshPrimary,
  normaliseStoredPassage,
  primaryText,
  promotePrimary,
  removeTranslation,
  secondaryTexts,
  setPrimary,
  translationOrder,
} from '@/lib/passage';

function reading(translationId: string, source?: 'bundled' | 'pasted'): ParsedText {
  return {
    translationId,
    versification: 'kjv',
    reference: 'Luke 1:5-25',
    ...(source ? { source } : {}),
    blocks: [],
    notes: [],
  };
}

const webbe = reading('webbe');
const asv = reading('asv');
const pastedNiv = reading('pasted-niv', 'pasted');

describe('passage accessors', () => {
  it('primaryText resolves the primary, or null when unset/missing', () => {
    expect(primaryText({ translations: { webbe }, primaryId: 'webbe' })?.translationId).toBe('webbe');
    expect(primaryText({ translations: {}, primaryId: null })).toBeNull();
    expect(primaryText({ translations: { webbe }, primaryId: 'asv' })).toBeNull();
  });

  it('secondaryTexts returns every non-primary translation', () => {
    const p: Passage = { translations: { webbe, asv, 'pasted-niv': pastedNiv }, primaryId: 'webbe' };
    expect(secondaryTexts(p).map((t) => t.translationId).sort()).toEqual(['asv', 'pasted-niv']);
  });

  it('translationOrder lists the primary first', () => {
    const p: Passage = { translations: { webbe, asv }, primaryId: 'asv' };
    expect(translationOrder(p)).toEqual(['asv', 'webbe']);
  });
});

describe('passage builders (pure)', () => {
  it('loadFreshPrimary drops any prior translations', () => {
    const prior: Passage = { translations: { webbe, asv }, primaryId: 'webbe' };
    const next = loadFreshPrimary(reading('bsb'));
    expect(next).toEqual({ translations: { bsb: reading('bsb') }, primaryId: 'bsb' });
    expect(prior.translations.asv).toBeDefined(); // input untouched
  });

  it('setPrimary replaces the primary, keeps secondaries, drops the old primary', () => {
    const p: Passage = { translations: { webbe, asv }, primaryId: 'webbe' };
    const next = setPrimary(p, reading('bsb'));
    expect(next.primaryId).toBe('bsb');
    expect(Object.keys(next.translations).sort()).toEqual(['asv', 'bsb']); // webbe (old primary) gone
  });

  it('setPrimary promotes an existing secondary without losing others', () => {
    const p: Passage = { translations: { webbe, asv, 'pasted-niv': pastedNiv }, primaryId: 'webbe' };
    const next = setPrimary(p, asv);
    expect(next.primaryId).toBe('asv');
    expect(Object.keys(next.translations).sort()).toEqual(['asv', 'pasted-niv']);
  });

  it('promotePrimary re-designates the primary and KEEPS every translation (the old primary is demoted, not dropped)', () => {
    const p: Passage = { translations: { webbe, asv, 'pasted-niv': pastedNiv }, primaryId: 'webbe' };
    const next = promotePrimary(p, 'asv');
    expect(next.primaryId).toBe('asv');
    expect(Object.keys(next.translations).sort()).toEqual(['asv', 'pasted-niv', 'webbe']); // webbe kept
    expect(next.translations).toEqual(p.translations); // nothing added, removed, or replaced
  });

  it('promotePrimary is a no-op for an unloaded id or the current primary', () => {
    const p: Passage = { translations: { webbe, asv }, primaryId: 'webbe' };
    expect(promotePrimary(p, 'bsb')).toBe(p); // not loaded
    expect(promotePrimary(p, 'webbe')).toBe(p); // already primary
  });

  it('addSecondary adds without touching the primary', () => {
    const p: Passage = { translations: { webbe }, primaryId: 'webbe' };
    const next = addSecondary(p, pastedNiv);
    expect(next.primaryId).toBe('webbe');
    expect(next.translations['pasted-niv']?.source).toBe('pasted');
  });

  it('removeTranslation drops a secondary but never the primary', () => {
    const p: Passage = { translations: { webbe, asv }, primaryId: 'webbe' };
    expect(Object.keys(removeTranslation(p, 'asv').translations)).toEqual(['webbe']);
    expect(removeTranslation(p, 'webbe')).toBe(p); // primary is protected
  });
});

describe('normaliseStoredPassage — the v1→v2 upgrade', () => {
  it('upgrades the old single-primary shape { primary } into the translations map', () => {
    expect(normaliseStoredPassage({ primary: webbe })).toEqual({
      translations: { webbe },
      primaryId: 'webbe',
    });
  });

  it('upgrades a bare ParsedText (the pre-M3 passage-store payload)', () => {
    expect(normaliseStoredPassage(webbe)).toEqual({ translations: { webbe }, primaryId: 'webbe' });
  });

  it('passes the already-M3 shape through', () => {
    const m3 = { translations: { webbe, asv }, primaryId: 'asv' };
    expect(normaliseStoredPassage(m3)).toEqual(m3);
  });

  it('yields an empty passage for null / a null primary / junk', () => {
    const empty = { translations: {}, primaryId: null };
    expect(normaliseStoredPassage(null)).toEqual(empty);
    expect(normaliseStoredPassage({ primary: null })).toEqual(empty);
    expect(normaliseStoredPassage(undefined)).toEqual(empty);
    expect(normaliseStoredPassage(42)).toEqual(empty);
  });
});
