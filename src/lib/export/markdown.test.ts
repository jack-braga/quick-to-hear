import { describe, expect, it } from 'vitest';

import { makeStudy, type Question, type Study, type StudyBuild } from '@/types/study';
import type { ParsedText } from '@/types/passage';
import { handoutModel, leaderModel, type ExportOptions } from './model';
import { handoutToMarkdown, leaderToMarkdown, passageToMarkdown } from './markdown';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SECRET_ANSWER = 'ZECHARIAH-DOUBTS-SECRET-ANSWER';
const COPYRIGHT = 'World English Bible British Edition (WEBBE). Public domain.';

const PASSAGE: ParsedText = {
  translationId: 'webbe',
  versification: 'kjv',
  reference: 'Luke 1:5-7',
  blocks: [
    {
      kind: 'p',
      verses: [
        { verseId: 'LUKE.1.5', present: true, fragments: [{ text: 'There was a priest named Zacharias.', qlevel: 0 }] },
        { verseId: 'LUKE.1.6', present: true, fragments: [{ text: 'They were both righteous.', qlevel: 0 }] },
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

const OPTS: ExportOptions = {
  supportTexts: {},
  copyrightLine: COPYRIGHT,
  translationName: 'World English Bible British Edition',
  methodAttributions: ['© Matthias Media & Holy Trinity Church (COMA)'],
};

function sampleStudy(): Study {
  const base = makeStudy('s1', '2026-08-06T00:00:00.000Z');
  return {
    ...base,
    setup: { ...base.setup, reference: 'Luke 1:5-25', introText: 'Welcome to the study.', durationMinutes: 45 },
    passage: { translations: { webbe: PASSAGE }, primaryId: 'webbe' },
    themeAim: { ...base.themeAim, theme: 'God keeps his promises', authorAim: 'Trust him', christRoute: 'Points to Christ.' },
    build: makeBuild({
      prayerPoint: 'Pray we would trust his promises.',
      questions: [
        q({
          id: 'q1',
          type: 'observation',
          text: 'What do we learn about Zechariah?',
          anchor: { verseIds: ['LUKE.1.5'] },
          expectedAnswer: SECRET_ANSWER,
          loadBearing: true,
        }),
        q({ id: 'q2', type: 'application', text: 'How will you trust God this week?', weight: 'light' }),
      ],
      supportPassages: [
        {
          id: 'sp1',
          reference: 'Malachi 4:5-6',
          type: 'quoted',
          text: null,
          attachedToQuestionId: 'q1',
          returnQuestion: 'What does this help us see back in Luke?',
        },
      ],
      candidates: [
        { id: 'c1', kind: 'background-box', text: 'The temple duty of burning incense.', status: 'open', anchor: { verseIds: ['LUKE.1.9'] } },
        { id: 'c2', kind: 'question', text: 'A cut idea', status: 'discarded' },
      ],
      order: ['q1', 'q2'],
    }),
  };
}

// ---------------------------------------------------------------------------

describe('passageToMarkdown', () => {
  it('numbers verses and shows a gap honestly', () => {
    const md = passageToMarkdown({
      ...PASSAGE,
      blocks: [
        {
          kind: 'p',
          verses: [
            { verseId: 'LUKE.1.5', present: true, fragments: [{ text: 'Text five.', qlevel: 0 }] },
            { verseId: 'LUKE.1.6', present: false, fragments: [] },
          ],
        },
      ],
    });
    expect(md).toContain('**5** Text five.');
    expect(md).toContain('**6** —');
  });
});

describe('handout — defined by exclusion (the guard, both ways)', () => {
  const model = handoutModel(sampleStudy(), OPTS);
  const md = handoutToMarkdown(model);

  it('EXCLUDES every expected answer', () => {
    expect(md).not.toContain(SECRET_ANSWER);
    // And the model itself never carries an answer field.
    expect(JSON.stringify(model)).not.toContain(SECRET_ANSWER);
  });

  it('EXCLUDES theme, aim, type labels and timings', () => {
    expect(md).not.toContain('God keeps his promises'); // theme
    expect(md).not.toContain('Trust him'); // author aim
    expect(md).not.toMatch(/Observation|Application|load-bearing/); // type/labels
    expect(md).not.toMatch(/≈ ?\d+ min/); // timings
  });

  it('INCLUDES the passage, numbered questions, inline support, boxes, prayer and intro', () => {
    expect(md).toContain('Welcome to the study.'); // intro
    expect(md).toContain('There was a priest named Zacharias.'); // passage
    expect(md).toContain('**1.** What do we learn about Zechariah?');
    expect(md).toContain('**2.** How will you trust God this week?');
    expect(md).toContain('Malachi 4:5-6'); // inline support ref
    expect(md).toContain('What does this help us see back in Luke?'); // return question
    expect(md).toContain('The temple duty of burning incense.'); // background box
    expect(md).toContain('Pray we would trust his promises.'); // prayer point
  });

  it('INCLUDES the exact translation copyright line (present, guard)', () => {
    expect(md).toContain(COPYRIGHT);
  });
});

describe('handout — support placement by function (SPEC 6f)', () => {
  function placementStudy(): Study {
    const base = makeStudy('s2', '2026-08-06T00:00:00.000Z');
    return {
      ...base,
      setup: { ...base.setup, reference: 'Galatians 3:6-9' },
      passage: { translations: { webbe: PASSAGE }, primaryId: 'webbe' },
      build: makeBuild({
        questions: [q({ id: 'q1', type: 'meaning', text: 'What has God promised Abraham?', anchor: { verseIds: ['LUKE.1.5'] } })],
        supportPassages: [
          { id: 'quote', reference: 'Galatians 3:8', type: 'quoted', text: null, attachedToQuestionId: 'q1' },
          { id: 'ctx', reference: 'Genesis 12:1-3', type: 'context', text: null, attachedToQuestionId: 'q1' },
        ],
        order: ['q1'],
      }),
    };
  }

  it('prints context ABOVE the question and quoted BELOW it', () => {
    const md = handoutToMarkdown(handoutModel(placementStudy(), OPTS));
    const ctx = md.indexOf('Genesis 12:1-3');
    const question = md.indexOf('**1.** What has God promised Abraham?');
    const quote = md.indexOf('Galatians 3:8');
    expect(ctx).toBeGreaterThanOrEqual(0);
    expect(quote).toBeGreaterThanOrEqual(0);
    // context → question → quoted, in that document order.
    expect(ctx).toBeLessThan(question);
    expect(question).toBeLessThan(quote);
    // Function labels are present on the support blocks.
    expect(md).toContain('**Context: Genesis 12:1-3**');
    expect(md).toContain('**Quoted: Galatians 3:8**');
  });
});

describe('pastoral note is leader-only', () => {
  const PASTORAL_NOTE = 'Sarah lost her father last month — raise privately.';
  function pastoralStudy(): Study {
    const base = makeStudy('s3', '2026-08-06T00:00:00.000Z');
    return {
      ...base,
      passage: { translations: { webbe: PASSAGE }, primaryId: 'webbe' },
      build: makeBuild({
        questions: [
          q({ id: 'q1', type: 'application', text: 'How have you seen God keep a promise?', pastoralFlag: true, pastoralNote: PASTORAL_NOTE }),
        ],
        order: ['q1'],
      }),
    };
  }

  it("appears in the leader's notes but NOT in the handout", () => {
    const study = pastoralStudy();
    const leaderMd = leaderToMarkdown(leaderModel(study, OPTS));
    const handoutMd = handoutToMarkdown(handoutModel(study, OPTS));
    expect(leaderMd).toContain('## Pastoral sensitivity');
    expect(leaderMd).toContain(PASTORAL_NOTE);
    expect(handoutMd).not.toContain(PASTORAL_NOTE);
  });
});

describe("leader's notes — everything", () => {
  const md = leaderToMarkdown(leaderModel(sampleStudy(), OPTS));

  it('INCLUDES theme, aim, Christ route, answers, wrong-turns anchors and copyright', () => {
    expect(md).toContain('God keeps his promises'); // theme
    expect(md).toContain('Trust him'); // aim
    expect(md).toContain('Points to Christ.'); // christ route
    expect(md).toContain(SECRET_ANSWER); // the answer the handout hides
    expect(md).toContain('Luke 1:5'); // anchor label
    expect(md).toContain('load-bearing');
    expect(md).toContain('Malachi 4:5-6'); // support
    expect(md).toContain('A cut idea'); // held in reserve
    expect(md).toContain('Q2'); // drop order (non-load-bearing q2)
    expect(md).toContain(COPYRIGHT);
    expect(md).toContain('Matthias Media'); // method attribution
  });
});
