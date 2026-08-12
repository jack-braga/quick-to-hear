import { describe, expect, it } from 'vitest';

import { makeStudy, type Annotation, type Study } from '@/types/study';
import { handoutMarkdown, leaderMarkdown } from '@/v2/exportMarkdown';

const NOW = '2020-01-01T00:00:00.000Z';
function studyWith(annotations: Annotation[], over: Partial<Study> = {}): Study {
  return { ...makeStudy('s', NOW), annotations, ...over };
}

const anns: Annotation[] = [
  {
    id: 'q1',
    kind: 'question',
    verseIds: ['LUKE.1.8'],
    text: 'What is Zacharias doing?',
    expectedAnswer: 'Serving as priest.',
    questionType: 'observation',
    estimateMinutes: 5,
  },
  { id: 'n1', kind: 'study-note', verseIds: ['LUKE.1.10'], text: 'Incense marked the hour of prayer.' },
  { id: 'n2', kind: 'study-note', verseIds: ['LUKE.1.12'], text: 'A leader-only aside.', hideFromGroup: true },
];

describe('handoutMarkdown (participant, answer-free)', () => {
  it('numbers questions, includes visible study notes, drops answers + hidden notes', () => {
    const md = handoutMarkdown(studyWith(anns, { setup: { ...makeStudy('s', NOW).setup, reference: 'Luke 1:5-25' } }));
    expect(md).toContain('# Luke 1:5-25');
    expect(md).toContain('1. What is Zacharias doing?');
    expect(md).toContain('Study note** — Incense marked the hour of prayer.');
    expect(md).not.toContain('Serving as priest.'); // no expected answers on the handout
    expect(md).not.toContain('leader-only aside'); // hidden study note dropped
  });
});

describe('leaderMarkdown (everything)', () => {
  it('carries expected answers, metadata, theme, and the hidden note (marked leader-only)', () => {
    const study = studyWith(anns, { themeAim: { ...makeStudy('s', NOW).themeAim, theme: 'God keeps his covenant.' } });
    const md = leaderMarkdown(study);
    expect(md).toContain('leader’s notes');
    expect(md).toContain('**Theme:** God keeps his covenant.');
    expect(md).toContain('**Expected:** Serving as priest.');
    expect(md).toContain('5 min');
    expect(md).toContain('A leader-only aside.'); // present for the leader
    expect(md).toContain('(leader only)');
  });

  it('the weighed theme supersedes the original', () => {
    const base = makeStudy('s', NOW);
    const study = studyWith([], {
      themeAim: { ...base.themeAim, theme: 'original', themeRevisions: [{ text: 'weighed' }] },
    });
    const md = leaderMarkdown(study);
    expect(md).toContain('**Theme:** weighed');
    expect(md).not.toContain('**Theme:** original');
  });
});
