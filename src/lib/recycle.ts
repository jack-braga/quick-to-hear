import { resolvedMarkText } from '@/lib/map';
import { allVerses, type ParsedText, type VerseSpan } from '@/types/passage';
import type { Candidate, QuestionType, Study, VerseAnchor } from '@/types/study';

/**
 * Recycle-forward (PLAN §4.2/§4.4, SPEC 6c) — carrying the user's earlier input into
 * the Phase-6 candidate pool **with provenance and copy-on-promote**:
 *
 * | From                       | Becomes                    | Framing                          |
 * |----------------------------|----------------------------|----------------------------------|
 * | Phase-3 question marks     | candidate **background box**| "tell them, don't ask them"      |
 * | Phase-4 **anchored** notes | candidate **question** of the note's COMA type | direct promotion |
 *
 * The load-bearing rule is **copy-on-promote**: materialising a source into the pool
 * ({@link makeCandidateFromSource}) takes a one-time **snapshot** of the source text.
 * After that, editing the source never mutates the candidate — divergence is *detected*
 * ({@link isSourceChanged}), not propagated — and deleting the source never deletes the
 * candidate ({@link addCandidate} is the only writer, and nothing here removes). Those
 * three properties are exactly what the Stage-4 acceptance test pins.
 *
 * These functions are **pure** (ids are passed in) so the store and the tests share them.
 */

/** A live, recyclable source: a Phase-3 mark or an anchored Phase-4 note. */
export interface RecycleSource {
  /** Stable key for React lists + matching against materialised candidates. */
  key: string;
  source: { kind: 'mark' | 'comaNote'; id: string };
  candidateKind: Candidate['kind'];
  /** Present for COMA notes — the note's category becomes the question type. */
  questionType?: QuestionType;
  /** The source's **current** text (a mark's resolved text / the note's text). */
  text: string;
  /** The verses the source points at — for display + seeding a Phase-6 question anchor. */
  anchor: VerseAnchor;
}

const COMA_CATEGORIES: QuestionType[] = ['context', 'observation', 'meaning', 'application'];

export function sourceKey(source: RecycleSource['source']): string {
  return `${source.kind}:${source.id}`;
}

/**
 * The live recyclable sources in a study, in a deterministic order (marks first, then
 * COMA notes in category order). A mark always recycles; a COMA note recycles only once
 * it is **both anchored and non-empty** (SPEC: "anchored notes are recycled").
 */
export function deriveRecycleSources(study: Study, passage?: ParsedText | null): RecycleSource[] {
  const byId = new Map<string, VerseSpan>(
    passage ? allVerses(passage).map((v) => [v.verseId, v]) : [],
  );

  const fromMarks: RecycleSource[] = study.map.marks.map((m) => ({
    key: sourceKey({ kind: 'mark', id: m.id }),
    source: { kind: 'mark', id: m.id },
    candidateKind: 'background-box',
    text: resolvedMarkText(m, byId.get(m.verseId)),
    anchor: { verseIds: [m.verseId] },
  }));

  const fromNotes: RecycleSource[] = COMA_CATEGORIES.flatMap((category) =>
    study.coma[category]
      .filter((n) => n.text.trim() !== '' && (n.anchor?.verseIds.length ?? 0) > 0)
      .map((n) => ({
        key: sourceKey({ kind: 'comaNote', id: n.id }),
        source: { kind: 'comaNote' as const, id: n.id },
        candidateKind: 'question' as const,
        questionType: category,
        text: n.text,
        anchor: n.anchor ?? { verseIds: [] },
      })),
  );

  return [...fromMarks, ...fromNotes];
}

/** Snapshot a source into a pool candidate (copy-on-promote). `id` is caller-supplied. */
export function makeCandidateFromSource(src: RecycleSource, id: string): Candidate {
  return {
    id,
    kind: src.candidateKind,
    text: src.text,
    status: 'open',
    source: src.source,
    ...(src.questionType ? { questionType: src.questionType } : {}),
  };
}

/** The materialised candidate for a source, if one exists (matched by back-link). */
export function candidateForSource(
  candidates: Candidate[],
  source: RecycleSource['source'],
): Candidate | undefined {
  return candidates.find((c) => c.source?.kind === source.kind && c.source.id === source.id);
}

/** Has the live source diverged from the candidate's snapshot since it was recycled? */
export function isSourceChanged(candidate: Candidate, liveText: string): boolean {
  return candidate.text !== liveText;
}

/** Append a candidate unless one already exists for its source (idempotent recycle). */
export function addCandidate(candidates: Candidate[], candidate: Candidate): Candidate[] {
  if (candidate.source && candidateForSource(candidates, candidate.source)) return candidates;
  return [...candidates, candidate];
}
