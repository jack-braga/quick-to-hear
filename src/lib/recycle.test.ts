import { describe, expect, it } from 'vitest';

import { makeStudy, type Mark, type Note, type Study } from '@/types/study';

import {
  addCandidate,
  candidateForSource,
  deriveRecycleSources,
  isSourceChanged,
  makeCandidateFromSource,
} from './recycle';

const MARKS: Mark[] = [
  { id: 'm1', kind: 'word', verseId: 'LUKE.1.15', text: 'strong', span: { start: 0, end: 6 } },
  { id: 'm2', kind: 'verse', verseId: 'LUKE.1.18', text: 'How can I be sure of this?' },
];

/** A study with two marks and a spread of COMA notes (anchored / unanchored / blank). */
function fixture(): Study {
  const s = makeStudy('s1', '2020-01-01T00:00:00.000Z');
  const meaning: Note[] = [
    { id: 'n1', text: 'Zechariah doubts the promise', anchor: { verseIds: ['LUKE.1.18'] } },
    { id: 'n2', text: 'the sign is given', anchor: { verseIds: ['LUKE.1.20'] } },
    { id: 'n3', text: '   ', anchor: { verseIds: ['LUKE.1.19'] } }, // blank → not recycled
  ];
  return {
    ...s,
    map: { sections: [], marks: MARKS },
    coma: {
      context: [{ id: 'n0', text: 'sets the scene', anchor: { verseIds: [] } }], // unanchored
      observation: [],
      meaning,
      application: [],
    },
  };
}

describe('deriveRecycleSources', () => {
  const sources = deriveRecycleSources(fixture());

  it('turns every mark into a background-box source', () => {
    const boxes = sources.filter((s) => s.candidateKind === 'background-box');
    expect(boxes.map((b) => b.source.id)).toEqual(['m1', 'm2']);
    expect(boxes[0]!.text).toBe('strong'); // resolved mark text (snapshot, no passage)
  });

  it('turns only anchored, non-empty COMA notes into question sources of matching type', () => {
    const qs = sources.filter((s) => s.candidateKind === 'question');
    expect(qs.map((q) => q.source.id)).toEqual(['n1', 'n2']); // n0 unanchored, n3 blank
    expect(qs.every((q) => q.questionType === 'meaning')).toBe(true);
    expect(qs[0]!.text).toBe('Zechariah doubts the promise');
    expect(qs[0]!.anchor.verseIds).toEqual(['LUKE.1.18']);
  });
});

describe('makeCandidateFromSource', () => {
  const sources = deriveRecycleSources(fixture());

  it('snapshots a note into an open question candidate with provenance', () => {
    const src = sources.find((s) => s.source.id === 'n1')!;
    const c = makeCandidateFromSource(src, 'c1');
    expect(c).toMatchObject({
      id: 'c1',
      kind: 'question',
      text: 'Zechariah doubts the promise',
      status: 'open',
      source: { kind: 'comaNote', id: 'n1' },
      questionType: 'meaning',
    });
  });

  it('snapshots a mark into a background-box candidate with no question type', () => {
    const src = sources.find((s) => s.source.id === 'm1')!;
    const c = makeCandidateFromSource(src, 'c2');
    expect(c.kind).toBe('background-box');
    expect(c.questionType).toBeUndefined();
    expect(c.source).toEqual({ kind: 'mark', id: 'm1' });
  });

  it('carries the source verse anchor forward (kept for the promoted question)', () => {
    const src = sources.find((s) => s.source.id === 'n1')!;
    expect(makeCandidateFromSource(src, 'c1').anchor).toEqual({ verseIds: ['LUKE.1.18'] });
  });
});

describe('addCandidate (idempotent recycle)', () => {
  it('does not create a second candidate for the same source', () => {
    const src = deriveRecycleSources(fixture()).find((s) => s.source.id === 'n1')!;
    const once = addCandidate([], makeCandidateFromSource(src, 'c1'));
    const twice = addCandidate(once, makeCandidateFromSource(src, 'c2'));
    expect(twice).toHaveLength(1);
    expect(twice[0]!.id).toBe('c1');
  });
});

describe('copy-on-promote semantics', () => {
  it('editing the source does not mutate a materialised candidate, but is detected', () => {
    const study = fixture();
    const src = deriveRecycleSources(study).find((s) => s.source.id === 'n1')!;
    const candidates = addCandidate([], makeCandidateFromSource(src, 'c1'));

    // Edit the source note.
    const edited: Study = {
      ...study,
      coma: {
        ...study.coma,
        meaning: study.coma.meaning.map((n) =>
          n.id === 'n1' ? { ...n, text: 'Zechariah is struck mute' } : n,
        ),
      },
    };

    const snapshot = candidateForSource(candidates, { kind: 'comaNote', id: 'n1' })!;
    expect(snapshot.text).toBe('Zechariah doubts the promise'); // unchanged

    const liveText = deriveRecycleSources(edited).find((s) => s.source.id === 'n1')!.text;
    expect(isSourceChanged(snapshot, liveText)).toBe(true);
  });

  it('deleting the source does not delete the candidate', () => {
    const study = fixture();
    const src = deriveRecycleSources(study).find((s) => s.source.id === 'n1')!;
    const candidates = addCandidate([], makeCandidateFromSource(src, 'c1'));

    const deleted: Study = {
      ...study,
      coma: { ...study.coma, meaning: study.coma.meaning.filter((n) => n.id !== 'n1') },
    };

    // Source is gone from the live list …
    expect(deriveRecycleSources(deleted).some((s) => s.source.id === 'n1')).toBe(false);
    // … but the recycled candidate survives.
    expect(candidateForSource(candidates, { kind: 'comaNote', id: 'n1' })).toBeDefined();
  });
});
