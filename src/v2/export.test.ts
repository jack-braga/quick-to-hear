import { describe, expect, it } from 'vitest';

import { auditResults } from '@/lib/audit';
import { projectForExport } from '@/v2/export';
import { exportModel } from '@/v2/exportModel';
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
  // q1 carries an attached include-for-group reference (a question's refs live in `mentions`, so its
  // text stays clean) → a quoted support passage attached to it. A prep-only ref must NOT print.
  {
    id: 'q1',
    kind: 'question',
    verseIds: ['LUKE.1.8'],
    text: 'What was his role?',
    expectedAnswer: '',
    questionType: 'observation',
    mentions: {
      'Mal.4.5-Mal.4.6': { includeForGroup: true, reference: 'Malachi 4:5-6' },
      'Gen.1.1': { includeForGroup: false, reference: 'Genesis 1:1' },
    },
  },
  { id: 'n1', kind: 'note', verseIds: ['LUKE.1.8'], text: 'a note', flag: 'confusing' },
  // a study note with an inline include-for-group @-mention → a background support box. A plain
  // `note` card (n1) never prints, so its mentions never become support (the §1.2 fix).
  {
    id: 'sn1',
    kind: 'study-note',
    verseIds: ['LUKE.1.13'],
    text: 'see @Genesis 1:1 for the beginning',
    mentions: { 'Gen.1.1': { includeForGroup: true } },
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

  it('derives support from question + study-note mentions (the real export source), not notes (§1.2)', () => {
    const projected = projectForExport(studyWith(anns));
    if (projected.build.format !== 'study') return;
    const sp = projected.build.supportPassages;
    // The question's included ref (quoted, attached + timed) + the study note's included ref
    // (background). The prep-only Genesis-on-q1 ref and the plain note's text never print.
    expect(sp.map((s) => s.reference).sort()).toEqual(['Genesis 1:1', 'Malachi 4:5-6']);
    const mal = sp.find((s) => s.reference === 'Malachi 4:5-6')!;
    expect(mal).toMatchObject({ type: 'quoted', attachedToQuestionId: 'q1' });
    const gen = sp.find((s) => s.reference === 'Genesis 1:1')!;
    expect(gen.type).toBe('background');
    expect(gen.attachedToQuestionId).toBeUndefined();
  });

  it('carries real per-question minutes so the time check matches the exported document (§1.2)', () => {
    const timed: Annotation[] = [
      { id: 'q1', kind: 'question', verseIds: ['LUKE.1.8'], text: 'Q', expectedAnswer: 'A', questionType: 'observation', estimateMinutes: 20 },
    ];
    const study = { ...studyWith(timed), setup: { ...studyWith(timed).setup, durationMinutes: 30 } };

    const projected = projectForExport(study);
    if (projected.build.format !== 'study') return;
    expect(projected.build.questions[0]!.minutes).toBe(20); // not the medium (3) weight bucket

    // The audit's time-vs-length now reflects the real estimate + equals exportModel's total.
    const time = auditResults(projected).find((r) => r.id === 'time-vs-length')!;
    expect(time.summary).toMatch(/20 min of 30/);
    expect(exportModel(study).totalMinutes).toBe(20);
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

  it('excludes reserved ("not in study") questions, so the audit sees only what exports', () => {
    const withReserved: Annotation[] = [
      { id: 'q1', kind: 'question', verseIds: ['LUKE.1.8'], text: 'Kept', expectedAnswer: 'A', questionType: 'observation' },
      { id: 'q2', kind: 'question', verseIds: ['LUKE.1.13'], text: 'Held back', expectedAnswer: 'B', questionType: 'meaning', reserved: true },
    ];
    const projected = projectForExport(studyWith(withReserved));
    if (projected.build.format !== 'study') return;
    expect(projected.build.questions.map((q) => q.id)).toEqual(['q1']);
    expect(projected.build.order).toEqual(['q1']);
  });
});
