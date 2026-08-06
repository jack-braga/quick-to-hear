import { describe, expect, it } from 'vitest';

import { makeStudy, type Question, type Study, type StudyBuild } from '@/types/study';
import type { ParsedText } from '@/types/passage';
import {
  applicationOrderOffenders,
  auditResults,
  aimComponentsMissing,
  coverageMap,
  gospelPlainQuestions,
  loadBearingQuestions,
  requiresGospelPlain,
  touchedVerseIds,
  typeBalanceMissing,
  type AuditCheckId,
  type AuditStatus,
} from './audit';

// ---------------------------------------------------------------------------
// Fixtures — a tiny two-section Luke 1:5–7 passage + a study builder
// ---------------------------------------------------------------------------

function verse(verseId: string, text: string) {
  return { verseId, present: true, fragments: [{ text, qlevel: 0 }] };
}

const PASSAGE: ParsedText = {
  translationId: 'webbe',
  versification: 'kjv',
  reference: 'Luke 1:5-7',
  blocks: [
    {
      kind: 'p',
      verses: [
        verse('LUKE.1.5', 'There was a priest named Zacharias.'),
        verse('LUKE.1.6', 'They were both righteous.'),
        verse('LUKE.1.7', 'They had no child.'),
      ],
    },
  ],
  notes: [],
};

function q(partial: Partial<Question> & { id: string; type: Question['type'] }): Question {
  return {
    text: 'A question?',
    anchor: { verseIds: [] },
    expectedAnswer: 'An answer.',
    weight: 'medium',
    loadBearing: false,
    ...partial,
  };
}

function makeBuild(partial: Partial<StudyBuild> = {}): StudyBuild {
  return {
    format: 'study',
    candidates: [],
    questions: [],
    supportPassages: [],
    prayerPoint: '',
    order: [],
    ...partial,
  };
}

function makeTestStudy(over: Partial<Study> = {}): Study {
  const base = makeStudy('s1', '2026-08-06T00:00:00.000Z');
  return {
    ...base,
    passage: { translations: { webbe: PASSAGE }, primaryId: 'webbe' },
    // Two sections: §1 = v5–6, §2 = v7.
    map: {
      sections: [
        { id: 'sec1', startVerseId: 'LUKE.1.5', endVerseId: 'LUKE.1.6', name: 'A' },
        { id: 'sec2', startVerseId: 'LUKE.1.7', endVerseId: 'LUKE.1.7', name: 'B' },
      ],
      marks: [],
    },
    themeAim: { ...base.themeAim, theme: 'God keeps his promises', authorAim: 'Trust him' },
    setup: { ...base.setup, durationMinutes: 45, primaryTranslationId: 'webbe' },
    build: makeBuild(),
    ...over,
  };
}

function statusOf(results: ReturnType<typeof auditResults>, id: AuditCheckId): AuditStatus {
  return results.find((r) => r.id === id)!.status;
}

// ---------------------------------------------------------------------------

describe('coverageMap', () => {
  it('reports no sections when the partition does not fit / no passage', () => {
    expect(
      coverageMap(makeTestStudy({ passage: { translations: {}, primaryId: null } })).hasSections,
    ).toBe(false);
    const noSections = makeTestStudy({ map: { sections: [], marks: [] } });
    expect(coverageMap(noSections).hasSections).toBe(false);
  });

  it('marks a section untouched when no question anchors into it', () => {
    const build = makeBuild({
      questions: [q({ id: 'q1', type: 'observation', anchor: { verseIds: ['LUKE.1.5'] } })],
    });
    const cov = coverageMap(makeTestStudy({ build }));
    expect(cov.hasSections).toBe(true);
    const [s1, s2] = cov.sections;
    expect(s1!.isUntouched).toBe(false); // v5 touched
    expect(s1!.touchedVerseIds).toEqual(['LUKE.1.5']);
    expect(s1!.untouchedVerseIds).toEqual(['LUKE.1.6']);
    expect(s2!.isUntouched).toBe(true); // v7 untouched
    expect(cov.untouchedSections.map((s) => s.id)).toEqual(['sec2']);
    expect(cov.untaggedUntouched.map((s) => s.id)).toEqual(['sec2']);
  });

  it('clears untaggedUntouched once the untouched section is tagged', () => {
    const build = makeBuild({
      questions: [q({ id: 'q1', type: 'observation', anchor: { verseIds: ['LUKE.1.5'] } })],
    });
    const study = makeTestStudy({ build });
    const tagged = { ...study, audit: { acks: {}, coverageTags: { sec2: 'connective' as const } } };
    const cov = coverageMap(tagged);
    expect(cov.untouchedSections.map((s) => s.id)).toEqual(['sec2']);
    expect(cov.untaggedUntouched).toEqual([]);
    expect(cov.sections[1]!.tag).toBe('connective');
  });
});

describe('touchedVerseIds', () => {
  it('unions every question anchor', () => {
    const build = makeBuild({
      questions: [
        q({ id: 'q1', type: 'observation', anchor: { verseIds: ['LUKE.1.5', 'LUKE.1.6'] } }),
        q({ id: 'q2', type: 'meaning', anchor: { verseIds: ['LUKE.1.6'] } }),
      ],
    });
    expect([...touchedVerseIds(build)].sort()).toEqual(['LUKE.1.5', 'LUKE.1.6']);
  });
});

describe('requiresGospelPlain / gospelPlainQuestions', () => {
  it('is required for mixed and one-to-one-not-yet-christian, not believers/unset', () => {
    expect(requiresGospelPlain(makeTestStudy({ setup: { ...makeTestStudy().setup, groupComposition: 'mixed' } }))).toBe(true);
    expect(
      requiresGospelPlain(
        makeTestStudy({ setup: { ...makeTestStudy().setup, groupComposition: 'one-to-one-not-yet-christian' } }),
      ),
    ).toBe(true);
    expect(requiresGospelPlain(makeTestStudy({ setup: { ...makeTestStudy().setup, groupComposition: 'believers' } }))).toBe(false);
    expect(requiresGospelPlain(makeTestStudy())).toBe(false); // unset
  });

  it('finds the questions flagged gospel-plain', () => {
    const build = makeBuild({
      questions: [q({ id: 'q1', type: 'application', gospelPlain: true }), q({ id: 'q2', type: 'meaning' })],
    });
    expect(gospelPlainQuestions(build).map((x) => x.id)).toEqual(['q1']);
  });
});

describe('helpers: type balance, aim components, load-bearing, application order', () => {
  it('typeBalanceMissing flags the absent core types (context optional)', () => {
    const build = makeBuild({ questions: [q({ id: 'q1', type: 'observation' })] });
    expect(typeBalanceMissing(build)).toEqual(['meaning', 'application']);
  });

  it('aimComponentsMissing tracks know/feel/do coverage', () => {
    const build = makeBuild({
      questions: [q({ id: 'q1', type: 'application', aimComponent: 'know' }), q({ id: 'q2', type: 'application', aimComponent: 'do' })],
    });
    expect(aimComponentsMissing(build)).toEqual(['feel']);
  });

  it('loadBearingQuestions counts only the marked ones', () => {
    const build = makeBuild({
      questions: [q({ id: 'q1', type: 'meaning', loadBearing: true }), q({ id: 'q2', type: 'meaning' })],
    });
    expect(loadBearingQuestions(build).map((x) => x.id)).toEqual(['q1']);
  });

  it('applicationOrderOffenders flags an application question before a later other type', () => {
    const ordered = [
      q({ id: 'a', type: 'application' }),
      q({ id: 'b', type: 'observation' }),
    ];
    expect(applicationOrderOffenders(ordered)).toEqual(['a']);
    const good = [q({ id: 'b', type: 'observation' }), q({ id: 'a', type: 'application' })];
    expect(applicationOrderOffenders(good)).toEqual([]);
  });
});

describe('auditResults', () => {
  it('an empty study flags the expected checks (nothing throws)', () => {
    const results = auditResults(makeTestStudy());
    expect(results.map((r) => r.id)).toHaveLength(11);
    expect(statusOf(results, 'expected-answer')).toBe('unmet'); // no questions
    expect(statusOf(results, 'two-load-bearing')).toBe('unmet');
    expect(statusOf(results, 'prayer-point')).toBe('unmet');
    // coverage is na without questions? sections exist + nothing touched → untouched needs tags
    expect(statusOf(results, 'coverage')).toBe('unmet');
  });

  it('a well-formed study meets the mechanical checks', () => {
    const build = makeBuild({
      prayerPoint: 'Pray we would trust his promises.',
      questions: [
        q({ id: 'o1', type: 'observation', anchor: { verseIds: ['LUKE.1.5'] }, loadBearing: true }),
        q({ id: 'm1', type: 'meaning', anchor: { verseIds: ['LUKE.1.6'] }, loadBearing: true }),
        q({ id: 'a1', type: 'application', anchor: { verseIds: ['LUKE.1.7'] }, aimComponent: 'know' }),
        q({ id: 'a2', type: 'application', aimComponent: 'feel' }),
        q({ id: 'a3', type: 'application', aimComponent: 'do' }),
      ],
      order: ['o1', 'm1', 'a1', 'a2', 'a3'],
    });
    const results = auditResults(makeTestStudy({ build }));
    expect(statusOf(results, 'serves-theme-aim')).toBe('met');
    expect(statusOf(results, 'expected-answer')).toBe('met');
    expect(statusOf(results, 'coverage')).toBe('met'); // every section touched
    expect(statusOf(results, 'type-balance')).toBe('met');
    expect(statusOf(results, 'meaning-order')).toBe('met');
    expect(statusOf(results, 'application-last')).toBe('met');
    expect(statusOf(results, 'know-feel-do')).toBe('met');
    expect(statusOf(results, 'time-vs-length')).toBe('met'); // 6+3+3+3+3=18 ≤ 45
    expect(statusOf(results, 'two-load-bearing')).toBe('met');
    expect(statusOf(results, 'prayer-point')).toBe('met');
  });

  it('gospel-plain is na for believers, unmet when required + missing, met when present', () => {
    const setup = (g: Study['setup']['groupComposition']) => ({
      ...makeTestStudy().setup,
      groupComposition: g,
    });
    const withQ = (gospel: boolean) =>
      makeBuild({ questions: [q({ id: 'q1', type: 'application', gospelPlain: gospel })] });

    expect(
      statusOf(auditResults(makeTestStudy({ setup: setup('believers'), build: withQ(false) })), 'gospel-plain'),
    ).toBe('na');
    expect(
      statusOf(auditResults(makeTestStudy({ setup: setup('mixed'), build: withQ(false) })), 'gospel-plain'),
    ).toBe('unmet');
    expect(
      statusOf(auditResults(makeTestStudy({ setup: setup('mixed'), build: withQ(true) })), 'gospel-plain'),
    ).toBe('met');
  });

  it('flags time over the session length', () => {
    const heavy = makeBuild({
      questions: Array.from({ length: 10 }, (_, i) => q({ id: `h${i}`, type: 'observation', weight: 'heavy' })),
    });
    // 10 × 6 = 60 min > 45.
    expect(statusOf(auditResults(makeTestStudy({ build: heavy })), 'time-vs-length')).toBe('unmet');
  });

  it('time-vs-length is na without a duration', () => {
    const study = makeTestStudy({ setup: { ...makeTestStudy().setup, durationMinutes: null } });
    expect(statusOf(auditResults(study), 'time-vs-length')).toBe('na');
  });

  it('flags a meaning question sequenced before its observation', () => {
    const build = makeBuild({
      questions: [
        q({ id: 'm', type: 'meaning', anchor: { verseIds: ['LUKE.1.5'] } }),
        q({ id: 'o', type: 'observation', anchor: { verseIds: ['LUKE.1.5'] } }),
      ],
      order: ['m', 'o'],
    });
    expect(statusOf(auditResults(makeTestStudy({ build })), 'meaning-order')).toBe('unmet');
  });
});
