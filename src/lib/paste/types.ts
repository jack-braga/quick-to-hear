/**
 * Paste-ingest model (Stage 8 / PLAN §4.6). The normaliser is a **two-stage pure
 * pipeline** — `analysePaste(raw)` classifies messy pasted text into an ordered list of
 * editable {@link PasteSegment}s (plus recovered reference/translation + stripped
 * chrome), and `assembleParsedText(segments, ctx)` turns the *reviewed* segments into
 * the same block/line {@link ParsedText} the bundled loader produces.
 *
 * The segment list is the surface the **mandatory review screen** edits: the parser only
 * has to be "correctable in ~30 seconds", so every uncertain call is `flagged` for the
 * user rather than guessed silently. Nothing becomes the passage until the user accepts.
 */

/** What a segment is. A `verse` is prose that flows inline; a `poetry` line keeps its own
 *  break + indent; a `heading` is an editorial section title (never text to study). */
export type PasteSegmentKind = 'verse' | 'poetry' | 'heading';

export interface PasteSegment {
  /** Stable id for React keys + review edits. */
  id: string;
  kind: PasteSegmentKind;
  /** The verse number this segment starts or continues (null for a heading). */
  verseNumber: number | null;
  /** True when this segment *begins* a verse (so the number renders at its head). A
   *  poetry stanza's later lines continue the same verse with `startsVerse:false`. */
  startsVerse: boolean;
  /** Poetry indent level 0..3 (0 for prose + headings; ≥1 keeps its own line). */
  indent: number;
  /** Cleaned display text (inline markers + footnote letters stripped, ws collapsed). */
  text: string;
  /** Low-confidence detection — highlighted in review so the user checks it. */
  flagged: boolean;
}

/** A footnote/cross-ref body recovered from a trailing "Footnotes" block, kept beside its
 *  verse where the reference is resolvable. */
export interface PasteNote {
  /** The scripture reference the footnote line began with, e.g. "Luke 1:69". */
  ref: string;
  text: string;
}

/** The full result of analysing a paste — everything the review screen needs. */
export interface PasteAnalysis {
  /** Reference recovered from a leading line (parseable via bcv), else null. */
  detectedReference: string | null;
  /** A bundled translation id if the name line matched one (webbe/asv), else null. */
  detectedTranslationId: string | null;
  /** The raw translation-name line as pasted (e.g. "New International Version - UK"),
   *  shown in review so the user can confirm/keep it even when it isn't bundled. */
  detectedTranslationName: string | null;
  segments: PasteSegment[];
  /** Lines stripped as app chrome (copyright, "Read full chapter", the footnotes block,
   *  the leading reference/name). Surfaced as "removed N lines" so stripping is honest. */
  droppedChrome: string[];
  notes: PasteNote[];
  /** High-level warnings for the review header (e.g. "some verse numbers look uncertain"). */
  flags: string[];
}

/** What `assembleParsedText` needs beyond the reviewed segments: the anchoring context. */
export interface AssembleContext {
  /** Book OSIS code (uppercased into verse IDs), from the kept/parsed reference. */
  bookOsis: string;
  /** The chapter the first verse sits in (verse numbers that reset bump the chapter). */
  startChapter: number;
  /** Translation id stored on the ParsedText (bundled id, or a slug for pasted text). */
  translationId: string;
  /** The human reference string to record on the ParsedText. */
  reference: string;
}
