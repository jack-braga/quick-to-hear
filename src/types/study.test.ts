import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION, StudySchema, makeStudy, toSummary } from '@/types/study';

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
