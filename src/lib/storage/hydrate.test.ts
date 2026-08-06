import { describe, expect, it } from 'vitest';

import { hydrate } from '@/lib/storage/hydrate';
import { CURRENT_SCHEMA_VERSION } from '@/types/study';

const ctx = { id: 'fallback-id', now: '2026-01-01T00:00:00.000Z' };

describe('hydrate', () => {
  it('upgrades an old / partial document by filling defaults', () => {
    // A "v-old" doc: no schemaVersion, and whole sections (build, coma, audit…) absent.
    const raw = {
      id: 's1',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-02T00:00:00.000Z',
      setup: { reference: 'Luke 1:5-25' },
    };
    const res = hydrate(raw, ctx);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.upgraded).toBe(true);
    expect(res.study.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(res.study.id).toBe('s1');
    expect(res.study.createdAt).toBe('2020-01-01T00:00:00.000Z');
    expect(res.study.setup.reference).toBe('Luke 1:5-25');
    expect(res.study.setup.secondaryTranslationIds).toEqual([]); // defaulted field
    expect(res.study.build.format).toBe('study'); // defaulted discriminated union
    expect(res.study.audit.acks).toEqual({}); // defaulted section
  });

  it('upgrades a v1 single-primary passage into the M3 translations map', () => {
    // A schemaVersion-1 doc still using the old `passage: { primary: ParsedText }` shape.
    const raw = {
      id: 's1',
      schemaVersion: 1,
      setup: { reference: 'Luke 1:5-25', primaryTranslationId: 'webbe' },
      passage: {
        primary: {
          translationId: 'webbe',
          versification: 'kjv',
          reference: 'Luke 1:5-25',
          blocks: [],
          notes: [],
        },
      },
    };
    const res = hydrate(raw, ctx);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.upgraded).toBe(true);
    expect(res.study.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    // The old primary is now keyed under translations + named by primaryId — nothing lost.
    expect(res.study.passage.primaryId).toBe('webbe');
    expect(res.study.passage.translations.webbe?.translationId).toBe('webbe');
    expect(res.study.passage.translations.webbe?.reference).toBe('Luke 1:5-25');
  });

  it('fills id / timestamps from context when the raw doc lacks them', () => {
    const res = hydrate({ setup: {} }, ctx);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.study.id).toBe('fallback-id');
    expect(res.study.createdAt).toBe(ctx.now);
    expect(res.study.updatedAt).toBe(ctx.now);
  });

  it('mirrors build.format from setup.format when the build lacks its discriminant', () => {
    const res = hydrate({ id: 'x', setup: { format: 'study' }, build: { candidates: [] } }, ctx);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.study.build.format).toBe('study');
  });

  it('quarantines a non-object blob (never throws), keeping the raw value', () => {
    for (const bad of [42, 'nope', null, [1, 2, 3]]) {
      const res = hydrate(bad, ctx);
      expect(res.ok).toBe(false);
      if (res.ok) continue;
      expect(res.raw).toBe(bad);
      expect(res.reason).toMatch(/study document|object/i);
    }
  });

  it('quarantines a structurally-broken document', () => {
    const raw = { id: 'x', setup: { durationMinutes: 'not a number' } };
    const res = hydrate(raw, ctx);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.raw).toBe(raw);
  });

  it('refuses (quarantines) a document written by a newer schema version', () => {
    const res = hydrate({ id: 'x', schemaVersion: 999, setup: {} }, ctx);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toMatch(/newer version/i);
  });
});
