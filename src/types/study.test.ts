import { describe, expect, it } from 'vitest';

import {
  AnnotationSchema,
  CURRENT_SCHEMA_VERSION,
  StudySchema,
  ThemeAimSchema,
  makeStudy,
  toSummary,
} from '@/types/study';

const NOW = '2020-01-01T00:00:00.000Z';

describe('Study schema', () => {
  it('makeStudy builds a valid, empty, study-format document', () => {
    const s = makeStudy('abc', NOW);
    expect(s.id).toBe('abc');
    expect(s.createdAt).toBe(NOW);
    expect(s.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(s.setup.reference).toBe('');
    expect(s.setup.format).toBe('study');
    expect(s.setup.secondaryTranslationIds).toEqual([]);
    expect(s.passage.translations).toEqual({});
    expect(s.passage.primaryId).toBeNull();
    expect(s.build.format).toBe('study');
    if (s.build.format === 'study') expect(s.build.questions).toEqual([]);
    expect(s.audit.acks).toEqual({});
    expect(() => StudySchema.parse(s)).not.toThrow();
  });

  it('toSummary derives a light row and never carries the passage', () => {
    const s = makeStudy('abc', NOW);
    const withData = {
      ...s,
      setup: { ...s.setup, reference: 'Luke 1:5-25', seriesNote: 'Week 3' },
    };
    const sum = toSummary(withData);
    expect(sum).toMatchObject({
      id: 'abc',
      reference: 'Luke 1:5-25',
      seriesNote: 'Week 3',
      questionCount: 0,
    });
    expect('passage' in sum).toBe(false);
  });
});

describe('v2 flow-redesign fields', () => {
  it('parses a study-note card carrying minutes, hideFromGroup and Deepen/Weigh revisions', () => {
    const a = AnnotationSchema.parse({
      id: 'a1',
      kind: 'study-note',
      origin: 'questions',
      verseIds: ['LUKE.1.8'],
      text: 'Incense = the hour of prayer.',
      hideFromGroup: true,
      estimateMinutes: 5,
      revisions: [
        { id: 'r1', origin: 'deepen', text: 'His lot — the timing is God’s.' },
        { id: 'r2', origin: 'weigh', text: 'A once-in-a-lifetime honour.', source: 'Bock, Luke (BECNT)' },
      ],
    });
    expect(a.kind).toBe('study-note');
    expect(a.revisions?.map((r) => r.origin)).toEqual(['deepen', 'weigh']);
    expect(a.revisions?.[1]?.source).toContain('Bock');
  });

  it('defaults the Theme/Aim supersede stacks to empty', () => {
    const t = ThemeAimSchema.parse({});
    expect(t.themeRevisions).toEqual([]);
    expect(t.aimRevisions).toEqual([]);
    const revised = ThemeAimSchema.parse({ themeRevisions: [{ text: 'weighed theme', source: 'France' }] });
    expect(revised.themeRevisions).toHaveLength(1);
  });

  it('an empty study still round-trips through StudySchema with the new fields', () => {
    const s = makeStudy('abc', NOW);
    expect(s.themeAim.themeRevisions).toEqual([]);
    expect(() => StudySchema.parse(s)).not.toThrow();
  });
});
