import { describe, expect, it } from 'vitest';

import { projectForExport } from '@/v2/export';
import { makeStudy, type Annotation, type Study } from '@/types/study';

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
  // a note on v8 whose inline @-mention is marked include-for-group → prints as a support passage
  {
    id: 'n2',
    kind: 'note',
    verseIds: ['LUKE.1.8'],
    text: 'echoes @Malachi 4:5-6',
    mentions: { 'Mal.4.5-Mal.4.6': { includeForGroup: true, returnQuestion: 'What does Malachi add?' } },
  },
  // a prep-only mention (not included) must NOT print
  {
    id: 'n3',
    kind: 'note',
    verseIds: ['LUKE.1.13'],
    text: 'cf. @Genesis 1:1',
    mentions: { 'Gen.1.1': { includeForGroup: false } },
  },
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

  it('prints an included @-mention as a support passage (prep-only ones are skipped)', () => {
    const projected = projectForExport(studyWith(anns));
    if (projected.build.format !== 'study') return;
    const sp = projected.build.supportPassages;
    // only the include-for-group mention prints; the prep-only Genesis mention does not.
    expect(sp).toHaveLength(1);
    expect(sp[0]).toMatchObject({
      reference: 'Malachi 4:5-6',
      type: 'quoted',
      attachedToQuestionId: 'q1', // the v8 question (host note is anchored to v8)
      returnQuestion: 'What does Malachi add?',
    });
  });

  it('carries the prayer point and question metadata (load-bearing, aim, gospel-plain) into the build', () => {
    const withMeta: Annotation[] = [
      { id: 'q1', kind: 'question', verseIds: ['LUKE.1.8'], text: 'Q', expectedAnswer: 'A', loadBearing: true, gospelPlain: true, aimComponent: 'do' },
    ];
    const s = studyWith(withMeta);
    const projected = projectForExport({ ...s, prayerPoint: 'Pray we would trust.' });
    if (projected.build.format !== 'study') return;
    expect(projected.build.prayerPoint).toBe('Pray we would trust.');
    const q = projected.build.questions[0]!;
    expect(q.loadBearing).toBe(true);
    expect(q.gospelPlain).toBe(true);
    expect(q.aimComponent).toBe('do');
  });

  it('uses the study title as the document heading when set', () => {
    const s = studyWith(anns);
    const projected = projectForExport({ ...s, setup: { ...s.setup, title: 'The birth foretold' } });
    expect(projected.setup.reference).toBe('The birth foretold');
  });
});
