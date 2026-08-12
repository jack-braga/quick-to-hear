import { describe, expect, it } from 'vitest';

import { makeStudy, type Annotation, type Study } from '@/types/study';
import { exportModel, orderedOutput, participantBlocks, supportFor } from '@/v2/exportModel';

const NOW = '2020-01-01T00:00:00.000Z';

/** A study carrying the given annotations (+ optional running order / session length). */
function studyWith(annotations: Annotation[], over: Partial<Study> = {}): Study {
  return { ...makeStudy('s', NOW), annotations, ...over };
}

const q = (over: Partial<Annotation>): Annotation => ({
  id: 'q',
  kind: 'question',
  verseIds: ['LUKE.1.8'],
  text: 'A question?',
  ...over,
});
const sn = (over: Partial<Annotation>): Annotation => ({
  id: 'n',
  kind: 'study-note',
  verseIds: ['LUKE.1.8'],
  text: 'A study note.',
  ...over,
});

describe('orderedOutput', () => {
  it('keeps questions and study notes interleaved, running order first then verse order', () => {
    const anns = [
      q({ id: 'q2', verseIds: ['LUKE.1.17'] }),
      sn({ id: 'note', verseIds: ['LUKE.1.10'] }),
      q({ id: 'q1', verseIds: ['LUKE.1.8'] }),
      { id: 'comment', kind: 'note', verseIds: ['LUKE.1.8'], text: 'prep only' } as Annotation,
    ];
    // No running order → pure verse order; the plain note is excluded (not an output item).
    expect(orderedOutput(anns, []).map((a) => a.id)).toEqual(['q1', 'note', 'q2']);
    // Running order leads; interleaving preserved.
    expect(orderedOutput(anns, ['note', 'q2']).map((a) => a.id)).toEqual(['note', 'q2', 'q1']);
  });
});

describe('supportFor', () => {
  it('a study note includes a typed @-mention only when it is include-for-group', () => {
    const withInclude = sn({
      text: 'See @Malachi 4:5-6 for the promise.',
      mentions: { 'Mal.4.5-Mal.4.6': { includeForGroup: true } },
    });
    expect(supportFor(withInclude)).toEqual([{ osis: 'Mal.4.5-Mal.4.6', reference: 'Malachi 4:5-6' }]);
    // prep-only (the default) prints nothing
    const prepOnly = sn({ text: 'See @Malachi 4:5-6.', mentions: { 'Mal.4.5-Mal.4.6': { includeForGroup: false } } });
    expect(supportFor(prepOnly)).toEqual([]);
  });

  it('a question includes an attached reference (in mentions, not its text)', () => {
    const question = q({
      text: 'What was promised about Elijah?', // clean — no mention in the text
      mentions: { 'Mal.4.5-Mal.4.6': { includeForGroup: true, reference: 'Malachi 4:5-6' } },
    });
    expect(supportFor(question)).toEqual([{ osis: 'Mal.4.5-Mal.4.6', reference: 'Malachi 4:5-6' }]);
    // an attached reference without include-for-group prints nothing
    expect(supportFor(q({ mentions: { 'Mal.4.5-Mal.4.6': { includeForGroup: false, reference: 'Malachi 4:5-6' } } }))).toEqual([]);
  });

  it('a plain comment/note is never includable (only questions + study notes)', () => {
    const comment = { id: 'c', kind: 'note', verseIds: ['LUKE.1.8'], text: 'See @Malachi 4:5-6.', mentions: { 'Mal.4.5-Mal.4.6': { includeForGroup: true } } } as Annotation;
    expect(supportFor(comment)).toEqual([]);
  });
});

describe('exportModel', () => {
  it('numbers questions, interleaves study notes, and totals minutes', () => {
    const study = studyWith(
      [
        q({ id: 'q1', verseIds: ['LUKE.1.8'], estimateMinutes: 5 }),
        sn({ id: 'note', verseIds: ['LUKE.1.10'] }),
        q({ id: 'q2', verseIds: ['LUKE.1.17'], weight: 'heavy' }), // 6 via the weight fallback
      ],
      { setup: { ...makeStudy('s', NOW).setup, reference: 'Luke 1:5-25', durationMinutes: 45 } },
    );
    const model = exportModel(study);
    expect(model.blocks.map((b) => (b.kind === 'question' ? `Q${b.number}` : 'note'))).toEqual([
      'Q1',
      'note',
      'Q2',
    ]);
    expect(model.totalMinutes).toBe(11); // 5 + 6, no support
    expect(model.sessionMinutes).toBe(45);
    expect(model.reference).toBe('Luke 1:5-25');
  });

  it('defaults write-lines (question 3, study note 0) and honours an explicit count', () => {
    const model = exportModel(studyWith([q({ id: 'q1' }), q({ id: 'q2', writeLines: 6 }), sn({ id: 'note' })]));
    const [b1, b2, b3] = model.blocks;
    expect(b1?.writeLines).toBe(3); // question default
    expect(b2?.writeLines).toBe(6); // explicit
    expect(b3?.writeLines).toBe(0); // study-note default
  });

  it('a support passage adds SUPPORT_MINUTES to the total', () => {
    const model = exportModel(
      studyWith([
        q({
          id: 'q1',
          estimateMinutes: 5,
          mentions: { 'Mal.4.5-Mal.4.6': { includeForGroup: true, reference: 'Malachi 4:5-6' } },
        }),
      ]),
    );
    expect(model.blocks[0]?.support).toHaveLength(1);
    expect(model.totalMinutes).toBe(9); // 5 + 4 (one support)
  });

  it('drops a reserved (held-back) item from the export, though orderedOutput keeps it for the panel', () => {
    const anns = [
      q({ id: 'q1', verseIds: ['LUKE.1.8'], estimateMinutes: 5 }),
      q({ id: 'q2', verseIds: ['LUKE.1.17'], estimateMinutes: 4, reserved: true }),
    ];
    expect(orderedOutput(anns, []).map((a) => a.id)).toEqual(['q1', 'q2']); // panel shows both
    const model = exportModel(studyWith(anns));
    expect(model.blocks.map((b) => b.id)).toEqual(['q1']); // the export drops the reserved one
    expect(model.totalMinutes).toBe(5); // its minutes aren't counted
  });

  it('participantBlocks drops a hidden study note but keeps question numbers', () => {
    const study = studyWith([
      q({ id: 'q1', verseIds: ['LUKE.1.8'] }),
      sn({ id: 'secret', verseIds: ['LUKE.1.10'], hideFromGroup: true }),
      q({ id: 'q2', verseIds: ['LUKE.1.17'] }),
    ]);
    const model = exportModel(study);
    expect(model.blocks).toHaveLength(3); // leader sees all
    const forGroup = participantBlocks(model);
    expect(forGroup.map((b) => b.id)).toEqual(['q1', 'q2']); // hidden note dropped
    expect(forGroup.filter((b) => b.kind === 'question').map((b) => (b as { number: number }).number)).toEqual([1, 2]);
  });
});
