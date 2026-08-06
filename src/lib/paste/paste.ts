import type { Block, ParsedText, VerseSpan } from '@/types/passage';
import { makeVerseId } from '@/lib/verse/ids';
import { findTranslation, BUNDLED_TRANSLATIONS } from '@/lib/bible/translations';
import { parseReference } from '@/lib/verse/reference';

import {
  collapseWs,
  indentLevel,
  isChromeLine,
  isFootnotesHeader,
  leadingSpaces,
  looksLikeTranslationName,
  preclean,
  stripInlineMarkers,
  unwrapBracketedVerseNumbers,
} from './clean';
import type {
  AssembleContext,
  PasteAnalysis,
  PasteNote,
  PasteSegment,
  PasteSegmentKind,
} from './types';

/**
 * The paste normaliser (PLAN §4.6). Two pure stages:
 *
 *  1. {@link analysePaste} — messy pasted text → an ordered, editable {@link PasteSegment}
 *     list + recovered reference/translation + the chrome it stripped. Every uncertain
 *     call is `flagged`, never guessed silently: the review screen is the safety net.
 *  2. {@link assembleParsedText} — the *reviewed* segments → the same block/line
 *     {@link ParsedText} the bundled loader emits, so a pasted study renders + flows
 *     through Phases 2–7 identically.
 *
 * Heuristics are structural first (indentation, standalone digit tokens, blank-line
 * paragraphs); genre is never consulted. See `paste.test.ts` for the golden corpus.
 */

/** The longest chapter in the canon is Psalm 119 (176 verses); numbers past that in body
 *  text are content ("about 3,000"), never verse markers. */
const MAX_VERSE = 176;

export interface AnalyseOptions {
  /** The verse the passage starts at (from the kept reference) — seeds the verse cursor
   *  so the first marker is expected rather than treated as an anomaly. Defaults to 1. */
  startVerse?: number;
  /** A reference the user already typed/kept, used when the paste has no header line. */
  fallbackReference?: string | null;
}

// ---------------------------------------------------------------------------
// Stage 1 — analyse
// ---------------------------------------------------------------------------

/** A standalone digit token (a verse number sits alone, not glued into a word/decimal). */
const NUM_TOKEN_RE = /(^|\s)(\d{1,3})(?=\s|[.,;:!?'"”’)]|$)/g;
/** A leading verse number at the very start of a line: the digits + the gap before text. */
const LEADING_NUM_RE = /^(\d{1,3})(\s+)(.*)$/;
/** A line that is *only* a reference (book + chapter[:verse][-range]), e.g. "Luke 1:39-80". */
const REFERENCE_ONLY_RE = /^[1-3]?\s?[A-Za-z][A-Za-z.]*(?:\s+[A-Za-z.]+)*\s+\d+(?::\d+)?(?:\s*[-–]\s*\d+(?::\d+)?)?$/;
/** A footnote body line begins with its scripture reference, e.g. "Luke 1:69 Horn …". */
const FOOTNOTE_BODY_RE = /^([1-3]?\s?[A-Za-z][A-Za-z.]*(?:\s+[A-Za-z.]+)*\s+\d+:\d+)\s+(.*)$/;

function matchBundledTranslation(name: string): string | null {
  const n = name.toLowerCase();
  for (const t of BUNDLED_TRANSLATIONS) {
    if (n.includes(t.shortName.toLowerCase()) || n.includes(t.name.toLowerCase())) return t.id;
  }
  // A couple of common aliases for the bundled set.
  if (/world english bible/.test(n) || /\bweb\b/.test(n)) return 'webbe';
  if (/american standard/.test(n)) return 'asv';
  return null;
}

/** A header line carrying a reference **and** a trailing translation on one line, e.g.
 *  YouVersion's "Luke 1:39-80 LSB" or "Psalm 80 New International Version". Peels 1–3
 *  trailing tokens off the end and returns the split the moment the remainder parses as a
 *  reference (bcv is the strong guard — verse prose won't parse). */
function splitReferenceAndTranslation(line: string): { ref: string; translation: string } | null {
  const parts = line.split(/\s+/).filter(Boolean);
  for (let k = 1; k <= 3 && k < parts.length; k++) {
    const ref = parts.slice(0, parts.length - k).join(' ');
    const translation = parts.slice(parts.length - k).join(' ').replace(/[()[\]]/g, '');
    if (!/^[A-Za-z]/.test(translation)) continue; // a translation token starts with a letter
    if (REFERENCE_ONLY_RE.test(ref) && parseReference(ref)) return { ref, translation };
  }
  return null;
}

/** Poetry indent of a physical line: the whitespace *after* an optional leading number
 *  (the number sits in the margin), else the line's own leading whitespace. */
function poetryIndentOf(rawLine: string): number {
  const lead = LEADING_NUM_RE.exec(rawLine.replace(/^\s+/, ''));
  if (rawLine.trimStart() !== rawLine && !lead) {
    // No leading number, but the line itself is indented.
    return indentLevel(leadingSpaces(rawLine));
  }
  if (lead) return indentLevel(lead[2]!.length >= 4 ? lead[2]!.length : 0);
  return 0;
}

/** True when a paragraph (its raw lines) is poetry: any line carries a poetry indent. */
function isPoetryParagraph(lines: string[]): boolean {
  return lines.some((l) => poetryIndentOf(l) >= 1);
}

/** True when a single standalone line reads like an editorial section heading. */
function looksHeadingLike(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= 9 && text.length <= 55 && !/[.:!?]$/.test(text);
}

let _seq = 0;
function seg(
  kind: PasteSegmentKind,
  text: string,
  opts: Partial<PasteSegment> = {},
): PasteSegment {
  return {
    id: `s${_seq++}`,
    kind,
    verseNumber: opts.verseNumber ?? null,
    startsVerse: opts.startsVerse ?? false,
    indent: opts.indent ?? 0,
    text,
    flagged: opts.flagged ?? false,
  };
}

/** Running verse-number cursor threaded across a paste's paragraphs. `assigned` guards the
 *  first number: the very first standalone number is always trusted (BG/YouVersion put
 *  them there); after that a token is a marker only if it stays monotonic within a small
 *  window (so content numbers like "the 12 apostles" don't masquerade as verse markers). */
interface VerseCursor {
  n: number;
  assigned: boolean;
}

/** Decide whether digit `n` is the next verse marker, and whether that jump is anomalous
 *  enough to flag for review. Mutates the cursor when it accepts. */
function acceptMarker(cur: VerseCursor, n: number): { marker: boolean; flagged: boolean } {
  if (n < 1 || n > MAX_VERSE) return { marker: false, flagged: false };
  const marker = !cur.assigned || n === cur.n + 1 || (n > cur.n && n <= cur.n + 3);
  if (!marker) return { marker: false, flagged: false };
  const flagged = cur.assigned && n !== cur.n + 1;
  cur.n = n;
  cur.assigned = true;
  return { marker: true, flagged };
}

/** Split a joined prose paragraph into verse segments on monotonic digit tokens. Leading
 *  text before the first marker continues the verse open at paragraph entry. */
function splitProseParagraph(text: string, cur: VerseCursor): PasteSegment[] {
  const entryN = cur.assigned ? cur.n : null;
  const markers: { at: number; end: number; n: number; flagged: boolean }[] = [];
  NUM_TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NUM_TOKEN_RE.exec(text)) !== null) {
    const n = Number(m[2]);
    const numStart = m.index + m[1]!.length;
    const { marker, flagged } = acceptMarker(cur, n);
    if (marker) markers.push({ at: numStart, end: numStart + m[2]!.length, n, flagged });
  }

  const segments: PasteSegment[] = [];
  if (markers.length === 0) {
    const t = collapseWs(stripInlineMarkers(text));
    if (t) segments.push(seg('verse', t, { verseNumber: entryN, startsVerse: false }));
    return segments;
  }

  const lead = collapseWs(stripInlineMarkers(text.slice(0, markers[0]!.at)));
  if (lead) segments.push(seg('verse', lead, { verseNumber: entryN, startsVerse: false }));
  markers.forEach((mk, i) => {
    const end = i + 1 < markers.length ? markers[i + 1]!.at : text.length;
    const body = collapseWs(stripInlineMarkers(text.slice(mk.end, end)));
    segments.push(seg('verse', body, { verseNumber: mk.n, startsVerse: true, flagged: mk.flagged }));
  });
  return segments;
}

/** Emit poetry segments for a paragraph — one segment per physical line, preserving the
 *  break + indent. A verse number is detected at the start of a line **or mid-line** (a
 *  verse boundary often falls inside a poetic line, e.g. Ps 80 "…shine forth 2 before
 *  Ephraim…"); the same monotonic gate keeps content numbers from masquerading as verses.
 *  A split keeps the whole physical line at one indent — only the verse anchor changes. */
function splitPoetryParagraph(lines: string[], cur: VerseCursor): PasteSegment[] {
  const segments: PasteSegment[] = [];
  for (const raw of lines) {
    const indent = poetryIndentOf(raw);
    const line = raw.trimStart(); // token offsets are relative to the de-indented line
    const entryN = cur.assigned ? cur.n : null;

    const markers: { at: number; end: number; n: number; flagged: boolean }[] = [];
    NUM_TOKEN_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = NUM_TOKEN_RE.exec(line)) !== null) {
      const at = m.index + m[1]!.length;
      const { marker, flagged } = acceptMarker(cur, Number(m[2]));
      if (marker) markers.push({ at, end: at + m[2]!.length, n: Number(m[2]), flagged });
    }

    if (markers.length === 0) {
      const text = collapseWs(stripInlineMarkers(line));
      if (text) segments.push(seg('poetry', text, { verseNumber: entryN, startsVerse: false, indent }));
      continue;
    }
    const lead = collapseWs(stripInlineMarkers(line.slice(0, markers[0]!.at)));
    if (lead) segments.push(seg('poetry', lead, { verseNumber: entryN, startsVerse: false, indent }));
    markers.forEach((mk, i) => {
      const end = i + 1 < markers.length ? markers[i + 1]!.at : line.length;
      const body = collapseWs(stripInlineMarkers(line.slice(mk.end, end)));
      segments.push(seg('poetry', body, { verseNumber: mk.n, startsVerse: true, indent, flagged: mk.flagged }));
    });
  }
  return segments;
}

export function analysePaste(raw: string, opts: AnalyseOptions = {}): PasteAnalysis {
  _seq = 0;
  const droppedChrome: string[] = [];
  const notes: PasteNote[] = [];
  const flags: string[] = [];

  // Pass 1: strip chrome + capture the trailing footnotes block. Bracketed verse markers
  // ([39], YouVersion) are unwrapped to plain digit tokens up front so the marker detector
  // sees them.
  const kept: string[] = [];
  let inFootnotes = false;
  for (const line of unwrapBracketedVerseNumbers(preclean(raw)).split('\n')) {
    const t = line.trim();
    if (inFootnotes) {
      if (t) {
        const fm = FOOTNOTE_BODY_RE.exec(t);
        if (fm) notes.push({ ref: fm[1]!.trim(), text: collapseWs(stripInlineMarkers(fm[2]!)) });
        droppedChrome.push(line);
      }
      continue;
    }
    if (isFootnotesHeader(t)) {
      inFootnotes = true;
      droppedChrome.push(line);
      continue;
    }
    if (t && isChromeLine(t)) {
      droppedChrome.push(line);
      continue;
    }
    kept.push(line);
  }

  // Pass 2: recover a leading reference + translation-name header.
  let detectedReference: string | null = null;
  let detectedTranslationId: string | null = null;
  let detectedTranslationName: string | null = null;
  const body = [...kept];
  const firstIdx = body.findIndex((l) => l.trim());
  if (firstIdx >= 0) {
    const t = body[firstIdx]!.trim();
    if (REFERENCE_ONLY_RE.test(t) && parseReference(t)) {
      // The reference is on its own line (BibleGateway shape).
      detectedReference = t;
      droppedChrome.push(body[firstIdx]!);
      body.splice(0, firstIdx + 1);
    } else {
      // A reference + translation on one line (YouVersion shape: "Luke 1:39-80 LSB").
      const split = splitReferenceAndTranslation(t);
      if (split) {
        detectedReference = split.ref;
        detectedTranslationName = split.translation;
        detectedTranslationId = matchBundledTranslation(split.translation);
        droppedChrome.push(body[firstIdx]!);
        body.splice(0, firstIdx + 1);
      }
    }
  }
  // A translation-name on its own following line (only if not already recovered above).
  if (!detectedTranslationName) {
    const nameIdx = body.findIndex((l) => l.trim());
    if (nameIdx >= 0 && looksLikeTranslationName(body[nameIdx]!.trim())) {
      detectedTranslationName = body[nameIdx]!.trim();
      detectedTranslationId = matchBundledTranslation(detectedTranslationName);
      droppedChrome.push(body[nameIdx]!);
      body.splice(0, nameIdx + 1);
    }
  }

  // Pass 3: paragraphs (blank-delimited) → classified segments.
  const paragraphs: string[][] = [];
  let cur: string[] = [];
  for (const line of body) {
    if (!line.trim()) {
      if (cur.length) paragraphs.push(cur);
      cur = [];
    } else {
      cur.push(line);
    }
  }
  if (cur.length) paragraphs.push(cur);

  const segments: PasteSegment[] = [];
  // Seed the cursor from the kept reference when we have one, but leave it `unassigned`
  // so the paste's first number is always trusted (the seed only sizes the monotonic gap).
  const cursor: VerseCursor = { n: (opts.startVerse ?? 1) - 1, assigned: false };
  for (let p of paragraphs) {
    // A heading or superscription glued to the front of a versed paragraph (no blank
    // between) → split it off. A title-cased section heading (title case, no end
    // punctuation) can lead a *prose* paragraph. A short leading line *before the first
    // verse* is a title/superscription (e.g. "A Psalm of David.") whether the paragraph
    // is prose or poetry. But a poetry paragraph mid-passage whose first line carries no
    // number is a sung line (e.g. "My soul glorifies the Lord"), never a heading.
    if (p.length > 1 && !LEADING_NUM_RE.test(p[0]!.trim()) && LEADING_NUM_RE.test(p[1]!.trim())) {
      const t = p[0]!.trim();
      const words = t.split(/\s+/).filter(Boolean).length;
      const short = t.length <= 60 && words <= 10;
      const leadingTitle = !cursor.assigned && short;
      const proseHeading = !isPoetryParagraph(p) && looksHeadingLike(t);
      // A very short, unpunctuated label atop a stanza (e.g. the acrostic letters of
      // Psalm 119 — "ב Beth", "ג Gimel") is an editorial heading, not a sung line. A real
      // opening line of a stanza is a fuller clause ("My soul glorifies the Lord").
      const stanzaMarker = words <= 3 && t.length <= 24 && !/[.,;:!?]$/.test(t);
      if (leadingTitle || proseHeading || stanzaMarker) {
        segments.push(seg('heading', collapseWs(stripInlineMarkers(t)), { flagged: /[.!?]$/.test(t) }));
        p = p.slice(1);
      }
    }
    // A short, un-numbered, un-indented single-line paragraph is an editorial heading
    // (or a Psalm superscription). Every real verse paragraph carries a number, so this
    // rarely misfires; a heading that reads like a sentence is flagged for a quick check.
    if (p.length === 1 && !LEADING_NUM_RE.test(p[0]!.trim()) && poetryIndentOf(p[0]!) === 0) {
      const t = p[0]!.trim();
      const words = t.split(/\s+/).filter(Boolean).length;
      if (t.length <= 60 && words <= 10) {
        segments.push(seg('heading', collapseWs(stripInlineMarkers(t)), { flagged: /[.!?]$/.test(t) }));
        continue;
      }
    }
    if (isPoetryParagraph(p)) {
      segments.push(...splitPoetryParagraph(p, cursor));
    } else {
      segments.push(...splitProseParagraph(collapseWs(p.join(' ')), cursor));
    }
  }

  // Anything before the first real verse (no verse number ever assigned) is a title or
  // superscription — never verse text — even a long musical superscription. Reclassify
  // it as an editorial heading so it can't become a phantom verse 0.
  const firstVerse = segments.findIndex((s) => s.startsVerse);
  const boundary = firstVerse === -1 ? segments.length : firstVerse;
  for (let i = 0; i < boundary; i++) {
    const s = segments[i]!;
    if (s.kind !== 'heading' && s.verseNumber == null) {
      segments[i] = { ...s, kind: 'heading', startsVerse: false, verseNumber: null, indent: 0, flagged: true };
    }
  }

  // Flags for the review header.
  if (!detectedReference && !opts.fallbackReference) {
    flags.push('No reference found in the paste — set the passage reference below.');
  }
  if (!detectedTranslationId) {
    flags.push('Translation not recognised — confirm it below (it drives the copyright line).');
  }
  if (segments.some((s) => s.flagged)) {
    flags.push('Some lines looked uncertain (a verse number or a heading) — check the highlighted rows.');
  }
  if (segments.filter((s) => s.kind !== 'heading').length === 0) {
    flags.push('No verses were detected — paste the passage text, or edit below.');
  }

  return {
    detectedReference,
    detectedTranslationId,
    detectedTranslationName,
    segments,
    droppedChrome,
    notes,
    flags,
  };
}

// ---------------------------------------------------------------------------
// Stage 2 — assemble reviewed segments into a ParsedText
// ---------------------------------------------------------------------------

/** Fragment indent → poetry qlevel: a base poetry line is q1 (matching the bundled data),
 *  a further indent is q2, etc. Prose stays q0. */
function qlevelFor(kind: PasteSegmentKind, indent: number): number {
  if (kind !== 'poetry') return 0;
  return Math.min(indent + 1, 3);
}

export function assembleParsedText(segments: PasteSegment[], ctx: AssembleContext): ParsedText {
  const blocks: Block[] = [];
  let openBlock: Block | null = null;
  let openVerse: VerseSpan | null = null;
  let chapter = ctx.startChapter;
  let prevNumber = -1;

  const closeBlock = () => {
    openBlock = null;
    openVerse = null;
  };
  const ensureBlock = (kind: 'p' | 'q'): Block => {
    if (!openBlock || openBlock.kind !== kind) {
      openBlock = { kind, verses: [] };
      blocks.push(openBlock);
      openVerse = null;
    }
    return openBlock;
  };

  for (const s of segments) {
    const text = s.text.trim();
    if (s.kind === 'heading') {
      if (text) blocks.push({ kind: 's1', verses: [], text: [{ text, qlevel: 0 }], editorial: true });
      closeBlock();
      continue;
    }
    if (!text) continue;
    const qlevel = qlevelFor(s.kind, s.indent);
    const blockKind: 'p' | 'q' = s.kind === 'poetry' ? 'q' : 'p';

    if (s.startsVerse && s.verseNumber != null) {
      const n = s.verseNumber;
      if (n <= prevNumber) chapter += 1; // verse numbers reset → next chapter
      prevNumber = n;
      const verseId = makeVerseId(ctx.bookOsis, chapter, n);
      const block = ensureBlock(blockKind);
      openVerse = { verseId, present: true, fragments: [{ text, qlevel }] };
      block.verses.push(openVerse);
    } else if (openVerse) {
      // Continuation of the current verse — append the fragment where the verse already
      // lives (so a poetry line continuing a prose-started verse stays one verse, never
      // duplicating its number across two blocks).
      openVerse.fragments.push({ text, qlevel });
    } else {
      // A continuation with nothing open (paste began mid-verse) — treat as a fresh verse.
      const n = s.verseNumber ?? prevNumber + 1;
      if (n <= prevNumber) chapter += 1;
      prevNumber = n;
      const verseId = makeVerseId(ctx.bookOsis, chapter, n);
      const block = ensureBlock(blockKind);
      openVerse = { verseId, present: true, fragments: [{ text, qlevel }] };
      block.verses.push(openVerse);
    }
  }

  return {
    translationId: ctx.translationId,
    versification: 'kjv',
    reference: ctx.reference,
    source: 'pasted',
    blocks,
    notes: [],
  };
}

/** Convenience: the primary bundled-name lookup for a detected id (for the review select). */
export function bundledName(id: string | null): string | null {
  return findTranslation(id ?? undefined)?.name ?? null;
}
