import type { Block, Fragment, StructuredNote, VerseSpan } from '@/types/passage';
import { findBookByUsfm, type BookMeta } from '@/lib/verse/books';
import { makeVerseId } from '@/lib/verse/ids';

/**
 * Pure USFM → block/line parser (PLAN §4.5). No filesystem: it takes the text of one
 * eBible USFM book and returns the structured form `scripts/build-bibles.ts` writes to
 * disk and `src/lib/bible/extract.ts` slices at runtime. Kept pure so the parser is
 * unit-tested directly against inline USFM (fast, no disk).
 *
 * It **extends** `twice-daily`'s parser: poetry lines become an array (not a
 * space-joined string), `\s`/`\r` headings are captured as editorial blocks (not
 * dropped), footnotes/cross-refs/`\wj` are **tagged** (not stripped), omitted verses
 * get `present:false`, and everything is **NFC-normalised**.
 */

export interface BuiltChapter {
  chapter: number;
  blocks: Block[];
  notes: StructuredNote[];
}

export interface BuiltBook {
  translationId: string;
  versification: 'kjv';
  bookId: string;
  osis: string;
  usfm: string;
  name: string;
  chapters: BuiltChapter[];
}

// ---------------------------------------------------------------------------
// Text cleaning (adapted from twice-daily/scripts/parse-usfm.ts)
// ---------------------------------------------------------------------------

/** Strip Strong's markers `\w word|strong="…"\w*` (and nested `\+w`), keep the word. */
function stripStrongs(s: string): string {
  return s
    .replace(/\\\+w\s*([^|\\]*?)\|[^\\]*?\\\+w\*/g, '$1')
    .replace(/\\w\s*([^|\\]*?)\|[^\\]*?\\w\*/g, '$1');
}

/** Strip remaining inline character markers, keeping their enclosed text. Closing
 *  markers are removed before opening ones (the twice-daily ordering gotcha). */
function stripInlineMarkers(s: string): string {
  return (
    s
      // paired closers first
      .replace(/\\\+?[a-z]+\*/g, '')
      // Strong's-less \w / \+w openers
      .replace(/\\\+?w\s+/g, '')
      // any remaining opener like \nd \add \tl \bd \it \qs \sc \sup …
      .replace(/\\\+?[a-z]+\s?/g, '')
  );
}

/** Square-bracket editorial insertions `[is]` → `is` (some editions use these). */
function stripBrackets(s: string): string {
  return s.replace(/\[([^\]]*)\]/g, '$1');
}

/** Final clean of a text run: strip markers, NFC-normalise, collapse whitespace. */
function cleanRun(s: string): string {
  let t = stripStrongs(s);
  t = stripInlineMarkers(t);
  t = stripBrackets(t);
  t = t.normalize('NFC');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

// ---------------------------------------------------------------------------
// Note extraction (footnotes + cross-references — tagged, not deleted)
// ---------------------------------------------------------------------------

const FOOTNOTE_RE = /\\f\s.*?\\f\*/g;
const XREF_RE = /\\x\s.*?\\x\*/g;

/** Human text of a footnote body (drop `+`, the `\fr` back-ref, keep `\ft`/`\fq…`). */
function footnoteText(raw: string): string {
  const inner = raw.replace(/^\\f\s+/, '').replace(/\\f\*$/, '');
  return cleanRun(inner.replace(/^\+\s*/, '').replace(/\\fr\s+\S+\s*/g, ''));
}

/** Human text of a cross-reference body (drop `+`, the `\xo` origin, keep `\xt`). */
function xrefText(raw: string): string {
  const inner = raw.replace(/^\\x\s+/, '').replace(/\\x\*$/, '');
  return cleanRun(inner.replace(/^\+\s*/, '').replace(/\\xo\s+\S+\s*/g, ''));
}

/** Pull notes out of a segment, returning the note-free segment + the notes found. */
function extractNotes(segment: string, verseId: string): { rest: string; notes: StructuredNote[] } {
  const notes: StructuredNote[] = [];
  let rest = segment.replace(FOOTNOTE_RE, (m) => {
    const text = footnoteText(m);
    if (text) notes.push({ verseId, kind: 'footnote', text });
    return ' ';
  });
  rest = rest.replace(XREF_RE, (m) => {
    const text = xrefText(m);
    if (text) notes.push({ verseId, kind: 'xref', text });
    return ' ';
  });
  return { rest, notes };
}

// ---------------------------------------------------------------------------
// Red-letter (\wj) run splitting
// ---------------------------------------------------------------------------

const WJ_RE = /\\wj\*|\\wj\b ?/g;

interface Run {
  text: string;
  wj: boolean;
}

/** Split a note-free segment into red-letter / plain runs, tracking `\wj` state across
 *  lines (a red-letter span can open on one line and close on the next). */
function splitWj(segment: string, state: { wjOpen: boolean }): Run[] {
  const runs: Run[] = [];
  let wj = state.wjOpen;
  let last = 0;
  let buf = '';
  let m: RegExpExecArray | null;
  WJ_RE.lastIndex = 0;
  while ((m = WJ_RE.exec(segment)) !== null) {
    buf += segment.slice(last, m.index);
    const cleaned = cleanRun(buf);
    if (cleaned) runs.push({ text: cleaned, wj });
    buf = '';
    wj = !m[0].startsWith('\\wj*');
    last = WJ_RE.lastIndex;
  }
  buf += segment.slice(last);
  const cleaned = cleanRun(buf);
  if (cleaned) runs.push({ text: cleaned, wj });
  state.wjOpen = wj;
  return runs;
}

/** Turn a note-free segment at one indent into fragments. Prose (qlevel 0) keeps one
 *  fragment per red-letter run so styling stays inline; poetry (qlevel≥1) collapses to
 *  a single line-fragment so line breaks are one-per-source-line. */
function toFragments(segment: string, qlevel: number, state: { wjOpen: boolean }): Fragment[] {
  const runs = splitWj(segment, state);
  if (runs.length === 0) return [];
  const frag = (text: string, wj: boolean): Fragment => (wj ? { text, qlevel, wj } : { text, qlevel });
  if (qlevel === 0) return runs.map((r) => frag(r.text, r.wj));
  const text = runs.map((r) => r.text).join(' ');
  return [frag(text, runs.some((r) => r.wj))];
}

// ---------------------------------------------------------------------------
// Marker classification
// ---------------------------------------------------------------------------

const SKIP_RE =
  /^(id|ide|usfm|h|toc\d?|toca\d?|mt\d?|mte\d?|cl|cp|rem|sts|restore|periph|ib|imt\d?|is\d?| imte|ip|ipi|im|imi|iot|io\d?|ili\d?|iex|ie|iq\d?|iqt|imq|pb|k\d?)$/;
const HEADING_RE = /^(s\d?|ms\d?|mr|sr|sp|r)$/;
const PROSE_RE = /^(p|m|po|pr|cls|pmo|pm|pmc|pmr|pi\d?|mi|nb|pc|ph\d?|lh|li\d?|lf|lim\d?|tr)$/;
const POETRY_RE = /^(q\d?|qc|qr|qm\d?|qa|qd)$/;

function poetryLevel(marker: string): number {
  const n = /\d/.exec(marker);
  if (n) return Math.min(Number(n[0]), 3);
  return 1; // \q, \qc, \qr default to indent 1
}

/** A heading `\s2`/`\ms2` maps to `s2`; everything else to `s1`. */
function headingKind(marker: string): 's1' | 's2' {
  return /2|3/.test(marker) || marker === 'sr' || marker === 'sp' ? 's2' : 's1';
}

// ---------------------------------------------------------------------------
// The parser
// ---------------------------------------------------------------------------

const LINE_MARKER_RE = /^\\(\+?[a-z]+\d*)\b\s?(.*)$/s;
const VERSE_RE = /^\\v\s+(\d+[a-z]?)\s?(.*)$/s;

export interface ParseOptions {
  translationId: string;
  /** Override the book resolved from the `\id` line (e.g. when it is missing). */
  book?: BookMeta;
}

/**
 * Parse one USFM book into the block/line model. Returns `null` when the book cannot be
 * identified (no `\id` and no override).
 */
export function parseUsfmBook(content: string, opts: ParseOptions): BuiltBook | null {
  const lines = content.split('\n');

  let book = opts.book;
  const chapters: BuiltChapter[] = [];
  let chapter: BuiltChapter | null = null;
  let block: Block | null = null;
  let verse: VerseSpan | null = null;
  let qlevel = 0;
  const wjState = { wjOpen: false };

  const startBlock = (kind: Block['kind']): Block => {
    const b: Block = { kind, verses: [] };
    chapter?.blocks.push(b);
    block = b;
    verse = null;
    return b;
  };

  const ensureVerseBlock = (kind: 'p' | 'q'): Block => {
    if (!block || (block.kind !== 'p' && block.kind !== 'q')) return startBlock(kind);
    return block;
  };

  /** Emit text into the current verse (start a verse when `verseNum` is given). */
  const emit = (segment: string, verseNum: string | null) => {
    if (!chapter || !book) return;
    if (verseNum !== null) {
      const verseId = makeVerseId(book.osis, chapter.chapter, verseNum);
      const b = ensureVerseBlock(qlevel >= 1 ? 'q' : 'p');
      const { rest, notes } = extractNotes(segment, verseId);
      chapter.notes.push(...notes);
      const fragments = toFragments(rest, qlevel, wjState);
      verse = { verseId, present: fragments.length > 0, fragments };
      b.verses.push(verse);
      return;
    }
    // Continuation of the current verse (poetry line or wrapped prose).
    if (!verse) return;
    const { rest, notes } = extractNotes(segment, verse.verseId);
    chapter.notes.push(...notes);
    const fragments = toFragments(rest, qlevel, wjState);
    if (fragments.length > 0) {
      verse.fragments.push(...fragments);
      verse.present = true;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const m = LINE_MARKER_RE.exec(line);
    if (!m) {
      // Bare continuation text (no marker) — append to the current verse.
      emit(line, null);
      continue;
    }

    const marker = m[1]!;
    let content_ = m[2] ?? '';

    if (marker === 'id') {
      const code = content_.split(/\s/)[0] ?? '';
      book = opts.book ?? findBookByUsfm(code);
      continue;
    }
    if (SKIP_RE.test(marker)) continue;

    if (marker === 'c') {
      const num = parseInt(content_.trim(), 10);
      if (!Number.isNaN(num)) {
        chapter = { chapter: num, blocks: [], notes: [] };
        chapters.push(chapter);
        block = null;
        verse = null;
        qlevel = 0;
        wjState.wjOpen = false;
      }
      continue;
    }

    if (!chapter || !book) continue;

    if (marker === 'd') {
      // Superscription — attached to the chapter (verse 0), not verse 1.
      const { rest, notes } = extractNotes(content_, makeVerseId(book.osis, chapter.chapter, 0));
      chapter.notes.push(...notes);
      const text = toFragments(rest, 0, { wjOpen: false });
      chapter.blocks.push({ kind: 'd', verses: [], text });
      block = null;
      verse = null;
      continue;
    }

    if (HEADING_RE.test(marker)) {
      const text = toFragments(content_, 0, { wjOpen: false });
      chapter.blocks.push({ kind: headingKind(marker), verses: [], text, editorial: true });
      block = null;
      verse = null;
      continue;
    }

    if (marker === 'b') {
      chapter.blocks.push({ kind: 'b', verses: [] });
      block = null;
      verse = null;
      qlevel = 0;
      continue;
    }

    // Verse marker (bare `\v N text`): the `\v` is already stripped, so parse the number.
    if (marker === 'v') {
      const vm = /^(\d+[a-z]?)\s?(.*)$/s.exec(content_.trim());
      if (vm) emit(vm[2] ?? '', vm[1]!);
      continue;
    }

    // Paragraph / poetry markers may carry trailing content (often a `\v`).
    if (PROSE_RE.test(marker)) {
      qlevel = 0;
      startBlock('p');
    } else if (POETRY_RE.test(marker)) {
      qlevel = poetryLevel(marker);
      ensureVerseBlock('q'); // keep an open p/q stanza; start a fresh 'q' otherwise
    }
    // else: an unrecognised line marker — treat its content as continuation text.

    content_ = content_.trim();
    if (!content_) continue;

    const vm = VERSE_RE.exec(content_);
    if (vm) emit(vm[2] ?? '', vm[1]!);
    else emit(content_, null);
  }

  if (!book) return null;
  return {
    translationId: opts.translationId,
    versification: 'kjv',
    bookId: book.id,
    osis: book.osis,
    usfm: book.usfm,
    name: book.name,
    chapters,
  };
}
