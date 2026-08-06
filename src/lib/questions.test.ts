import { describe, expect, it } from 'vitest';

import { emptyStudyBuild, type Candidate, type Question, type StudyBuild, type SupportPassage } from '@/types/study';

import {
  countedSupport,
  deleteQuestion,
  detectWarnings,
  estimatedMinutes,
  hasExpectedAnswer,
  meaningBeforeObservation,
  moveQuestion,
  orderedQuestionIds,
  orderedQuestions,
  promoteCandidate,
  questionFromDraft,
  questionMinutes,
  suggestedQuestionCount,
  supportBudgetWarn,
  typeCounts,
  updateQuestion,
  WEIGHT_MINUTES,
  type QuestionDraft,
} from './questions';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function mkQ(partial: Partial<Question> & Pick<Question, 'id' | 'type'>): Question {
  return {
    text: 'q',
    anchor: { verseIds: [] },
    expectedAnswer: 'a',
    weight: 'medium',
    loadBearing: false,
    ...partial,
  };
}

function mkBuild(partial: Partial<StudyBuild> = {}): StudyBuild {
  return { ...emptyStudyBuild(), ...partial };
}

function mkDraft(partial: Partial<QuestionDraft> = {}): QuestionDraft {
  return {
    text: 'Why is Zechariah silenced?',
    anchor: { verseIds: ['LUKE.1.20'] },
    type: 'meaning',
    expectedAnswer: 'Because he did not believe.',
    weight: 'medium',
    loadBearing: false,
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Budget + time (6b)
// ---------------------------------------------------------------------------

describe('budget + time', () => {
  it('maps each weight to its rough minute cost', () => {
    expect(WEIGHT_MINUTES).toEqual({ light: 1, medium: 3, heavy: 6 });
    expect(questionMinutes({ weight: 'heavy' })).toBe(6);
  });

  it('sums question weights and adds 4 minutes per support passage', () => {
    const questions = [{ weight: 'light' as const }, { weight: 'heavy' as const }]; // 1 + 6
    expect(estimatedMinutes(questions)).toBe(7);
    expect(estimatedMinutes(questions, [{}, {}])).toBe(7 + 8); // + 2 support × 4
  });

  it('suggests the SPEC question totals for the presets, null without a duration', () => {
    expect(suggestedQuestionCount(45)).toEqual({ min: 6, max: 8 });
    expect(suggestedQuestionCount(60)).toEqual({ min: 8, max: 12 });
    expect(suggestedQuestionCount(30)).toEqual({ min: 4, max: 6 });
    expect(suggestedQuestionCount(null)).toBeNull();
    // Off-preset durations scale rather than throw.
    expect(suggestedQuestionCount(50)?.min).toBeGreaterThan(0);
  });

  it('counts questions by type', () => {
    const counts = typeCounts([
      { type: 'observation' },
      { type: 'observation' },
      { type: 'meaning' },
    ]);
    expect(counts).toEqual({ context: 0, observation: 2, meaning: 1, application: 0 });
  });
});

// ---------------------------------------------------------------------------
// The hard block + soft warnings (6e)
// ---------------------------------------------------------------------------

describe('hasExpectedAnswer (the one hard block)', () => {
  it('is false for empty/whitespace, true once written', () => {
    expect(hasExpectedAnswer({ expectedAnswer: '' })).toBe(false);
    expect(hasExpectedAnswer({ expectedAnswer: '   ' })).toBe(false);
    expect(hasExpectedAnswer({ expectedAnswer: 'a real answer' })).toBe(true);
  });
});

describe('detectWarnings (all soft)', () => {
  it('flags a yes-no opener (Is / Are / Does / Did / Was)', () => {
    expect(detectWarnings('Is Jesus the Son of God?')).toContain('yes-no');
    expect(detectWarnings('Does Zechariah believe?')).toContain('yes-no');
    expect(detectWarnings('What does the angel say?')).not.toContain('yes-no');
  });

  it('flags leading phrasing', () => {
    expect(detectWarnings("Doesn't this show God's mercy?")).toContain('leading');
    expect(detectWarnings("This shows mercy, don't you think?")).toContain('leading');
    expect(detectWarnings('What does this show about God?')).not.toContain('leading');
  });

  it('flags double-barrelled: two question marks, or "and" + a second interrogative', () => {
    expect(detectWarnings('Who is this? And what does he want?')).toContain('double-barrelled');
    expect(detectWarnings('What does Zechariah do, and why is he silenced?')).toContain(
      'double-barrelled',
    );
    expect(detectWarnings('What does the angel promise to Zechariah?')).not.toContain(
      'double-barrelled',
    );
  });

  it('returns nothing for a clean open question, and can stack warnings', () => {
    expect(detectWarnings('How does the passage describe the angel?')).toEqual([]);
    expect(detectWarnings('')).toEqual([]);
    // "Is …?" + two clauses joined by and → both yes-no and double-barrelled.
    expect(detectWarnings('Is he faithful, and is he silenced?')).toEqual(
      expect.arrayContaining(['yes-no', 'double-barrelled']),
    );
  });
});

// ---------------------------------------------------------------------------
// Sequencing (6g)
// ---------------------------------------------------------------------------

describe('meaningBeforeObservation', () => {
  it('flags a meaning question placed before an observation on the same verses', () => {
    const ordered = [
      mkQ({ id: 'm', type: 'meaning', anchor: { verseIds: ['LUKE.1.20'] } }),
      mkQ({ id: 'o', type: 'observation', anchor: { verseIds: ['LUKE.1.20'] } }),
    ];
    expect(meaningBeforeObservation(ordered)).toEqual(['m']);
  });

  it('does not flag observation-before-meaning, nor a meaning on different verses', () => {
    const good = [
      mkQ({ id: 'o', type: 'observation', anchor: { verseIds: ['LUKE.1.20'] } }),
      mkQ({ id: 'm', type: 'meaning', anchor: { verseIds: ['LUKE.1.20'] } }),
    ];
    expect(meaningBeforeObservation(good)).toEqual([]);
    const different = [
      mkQ({ id: 'm', type: 'meaning', anchor: { verseIds: ['LUKE.1.20'] } }),
      mkQ({ id: 'o', type: 'observation', anchor: { verseIds: ['LUKE.1.5'] } }),
    ];
    expect(meaningBeforeObservation(different)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Support budget (6f)
// ---------------------------------------------------------------------------

describe('support-passage budget', () => {
  const sp = (type: SupportPassage['type']): Pick<SupportPassage, 'type'> => ({ type });

  it('counts only context/quoted, warns at the third', () => {
    expect(countedSupport([sp('context'), sp('background'), sp('quoted')])).toBe(2);
    expect(supportBudgetWarn([sp('context'), sp('quoted')])).toBe(false);
    expect(supportBudgetWarn([sp('context'), sp('quoted'), sp('context')])).toBe(true);
    // Three backgrounds don't trip it — they don't cost discussion time.
    expect(supportBudgetWarn([sp('background'), sp('background'), sp('background')])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Order (6g)
// ---------------------------------------------------------------------------

describe('order stays consistent with live questions', () => {
  it('filters dead ids out of order and appends newly-promoted ones', () => {
    const build = mkBuild({
      questions: [mkQ({ id: 'a', type: 'observation' }), mkQ({ id: 'b', type: 'meaning' })],
      order: ['ghost', 'b'], // 'ghost' no longer exists; 'a' not yet in order
    });
    expect(orderedQuestionIds(build)).toEqual(['b', 'a']);
    expect(orderedQuestions(build).map((q) => q.id)).toEqual(['b', 'a']);
  });

  it('moves a question up/down and clamps at the ends', () => {
    const build = mkBuild({
      questions: [mkQ({ id: 'a', type: 'observation' }), mkQ({ id: 'b', type: 'meaning' })],
      order: ['a', 'b'],
    });
    expect(moveQuestion(build, 'b', 'up').order).toEqual(['b', 'a']);
    expect(moveQuestion(build, 'a', 'up').order).toEqual(['a', 'b']); // already first — no-op
    expect(moveQuestion(build, 'b', 'down').order).toEqual(['a', 'b']); // already last — no-op
  });
});

// ---------------------------------------------------------------------------
// Promote / update / delete (6d–6e) — the hard block enforced in the model too
// ---------------------------------------------------------------------------

describe('promoteCandidate', () => {
  const candidate: Candidate = { id: 'c1', kind: 'question', text: 'seed', status: 'open' };

  it('creates a question, marks the candidate promoted, and appends to order', () => {
    const build = mkBuild({ candidates: [candidate] });
    const next = promoteCandidate(build, 'c1', mkDraft(), 'q1');
    expect(next.questions).toHaveLength(1);
    expect(next.questions[0]).toMatchObject({
      id: 'q1',
      sourceCandidateId: 'c1',
      expectedAnswer: 'Because he did not believe.',
      type: 'meaning',
    });
    expect(next.candidates[0]!.status).toBe('promoted');
    expect(next.order).toEqual(['q1']);
  });

  it('refuses to promote without an expected answer (returns the build unchanged)', () => {
    const build = mkBuild({ candidates: [candidate] });
    const next = promoteCandidate(build, 'c1', mkDraft({ expectedAnswer: '  ' }), 'q1');
    expect(next).toBe(build);
    expect(next.questions).toHaveLength(0);
  });
});

describe('updateQuestion', () => {
  it('saves edits but refuses to blank the expected answer', () => {
    const build = mkBuild({ questions: [mkQ({ id: 'q1', type: 'meaning', sourceCandidateId: 'c1' })] });
    const saved = updateQuestion(build, 'q1', mkDraft({ text: 'edited', weight: 'heavy' }));
    expect(saved.questions[0]).toMatchObject({ text: 'edited', weight: 'heavy', sourceCandidateId: 'c1' });
    const blanked = updateQuestion(build, 'q1', mkDraft({ expectedAnswer: '' }));
    expect(blanked).toBe(build);
  });
});

describe('deleteQuestion (referential-integrity cascade)', () => {
  it('drops it from order, reopens its source candidate, and detaches support passages', () => {
    const build = mkBuild({
      candidates: [{ id: 'c1', kind: 'question', text: 'seed', status: 'promoted' }],
      questions: [mkQ({ id: 'q1', type: 'meaning', sourceCandidateId: 'c1' })],
      order: ['q1'],
      supportPassages: [
        { id: 's1', reference: 'Mal 4', type: 'context', text: null, attachedToQuestionId: 'q1' },
      ],
    });
    const next = deleteQuestion(build, 'q1');
    expect(next.questions).toHaveLength(0);
    expect(next.order).toEqual([]);
    expect(next.candidates[0]!.status).toBe('open'); // returns to the cut pool
    expect(next.supportPassages[0]!.attachedToQuestionId).toBeUndefined();
  });
});

describe('questionFromDraft', () => {
  it('trims text/answer and only sets optional fields when meaningful', () => {
    const bare = questionFromDraft(mkDraft({ text: '  hi  ', expectedAnswer: '  yes  ' }), 'q1');
    expect(bare.text).toBe('hi');
    expect(bare.expectedAnswer).toBe('yes');
    expect(bare.gospelPlain).toBeUndefined();
    expect(bare.pastoralFlag).toBeUndefined();
    expect('sourceCandidateId' in bare).toBe(false);

    const rich = questionFromDraft(
      mkDraft({ gospelPlain: true, aimComponent: 'do', wrongTurns: ' watch out ', pastoralFlag: true }),
      'q2',
      'c2',
    );
    expect(rich).toMatchObject({
      gospelPlain: true,
      aimComponent: 'do',
      wrongTurns: 'watch out',
      pastoralFlag: true,
      sourceCandidateId: 'c2',
    });
  });
});
