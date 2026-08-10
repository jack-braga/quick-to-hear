import { describe, expect, it } from 'vitest';

import { projectForExport } from '@/v2/export';
import { handoutModel, leaderModel } from '@/lib/export';
import { makeStudy, type Annotation, type Study } from '@/types/study';

const OPTS = { copyrightLine: '© test', translationName: 'WEBBE', supportTexts: {} };

function studyWith(annotations: Annotation[], runningOrder: string[] = []): Study {
  const s = makeStudy('s1', '2026-01-01T00:00:00.000Z');
  return {
    ...s,
    setup: { ...s.setup, reference: 'Luke 1:5-25', title: '' },
    annotations,
    runningOrder,
  };
}

const anns: Annotation[] = [
  { id: 'q2', kind: 'question', verseIds: ['LUKE.1.13'], text: 'Why is Zechariah silenced?', expectedAnswer: 'For unbelief.', questionType: 'meaning' },
  { id: 'q1', kind: 'question', verseIds: ['LUKE.1.8'], text: 'What was his role?', expectedAnswer: '', questionType: 'observation' },
  { id: 'n1', kind: 'note', verseIds: ['LUKE.1.8'], text: 'a note', flag: 'confusing' },
  { id: 'x1', kind: 'cross-ref', verseIds: ['LUKE.1.8'], text: 'echoes', reference: 'Malachi 4:5-6', returnQuestion: 'What does Malachi add?' },
];

describe('projectForExport', () => {
  it('projects question annotations into an ordered v1 build (verse order by default)', () => {
    const projected = projectForExport(studyWith(anns));
    expect(projected.build.format).toBe('study');
    if (projected.build.format !== 'study') return;
    expect(projected.build.questions.map((q) => q.id)).toEqual(['q1', 'q2']); // verse order: v8, v13
    expect(projected.build.order).toEqual(['q1', 'q2']);
    const q1 = projected.build.questions[0]!;
    expect(q1.type).toBe('observation');
    expect(q1.expectedAnswer).toBe('');
    expect(q1.weight).toBe('medium'); // default
  });

  it('honours the running order', () => {
    const projected = projectForExport(studyWith(anns, ['q2', 'q1']));
    if (projected.build.format !== 'study') return;
    expect(projected.build.order).toEqual(['q2', 'q1']);
  });

  it('attaches a cross-reference to the question sharing its verses', () => {
    const projected = projectForExport(studyWith(anns));
    if (projected.build.format !== 'study') return;
    const sp = projected.build.supportPassages;
    expect(sp).toHaveLength(1);
    expect(sp[0]).toMatchObject({
      reference: 'Malachi 4:5-6',
      type: 'quoted',
      attachedToQuestionId: 'q1', // the v8 question
      returnQuestion: 'What does Malachi add?',
    });
  });

  it('uses the study title as the document heading when set', () => {
    const s = studyWith(anns);
    const projected = projectForExport({ ...s, setup: { ...s.setup, title: 'The birth foretold' } });
    expect(projected.setup.reference).toBe('The birth foretold');
  });

  it('feeds the v1 export models: handout excludes answers, leader keeps them', () => {
    const projected = projectForExport(studyWith(anns));
    const handout = handoutModel(projected, OPTS);
    const leader = leaderModel(projected, OPTS);

    expect(handout.questions.map((q) => q.number)).toEqual([1, 2]);
    // The handout is defined by exclusion — it must carry no expected answers.
    expect(JSON.stringify(handout)).not.toContain('For unbelief.');
    // The cross-ref prints at its question's point of need.
    expect(handout.questions[0]!.support[0]?.reference).toBe('Malachi 4:5-6');

    // The leader carries the expected answer + the anchor + the type.
    const lq = leader.questions.find((q) => q.expectedAnswer === 'For unbelief.');
    expect(lq?.type).toBe('meaning');
    expect(lq?.anchorLabel).toContain('Luke 1:13');
  });
});
