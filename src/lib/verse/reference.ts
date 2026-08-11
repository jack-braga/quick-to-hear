import { bcv_parser } from 'bible-passage-reference-parser/esm/bcv_parser.js';
import * as en from 'bible-passage-reference-parser/esm/lang/en.js';

import { findBookByOsis, type BookMeta } from '@/lib/verse/books';
import { makeVerseId } from '@/lib/verse/ids';

/**
 * Reference parsing (PLAN §2/§4.3): buy, don't build — `bcv_parser`, pinned to the
 * **`kjv`** versification. Its *default* is ESV-style and would emit refs our bundled
 * KJV-versified texts lack (3 John 15, Rev 12:18); `kjv` clamps ranges to the numbering
 * we actually ship. Output OSIS is converted to our canonical verse IDs.
 */

// One shared, configured instance. `bcv` is cheap to reuse and stateless between calls.
const bcv = new bcv_parser(en);
bcv.set_options({
  versification_system: 'kjv',
  // Compact each match to a single Book.C.V(-Book.C.V) osis so we can read the range.
  osis_compaction_strategy: 'bcv',
  // A bare "Luke 1" means the whole chapter, not an ambiguous book/chapter token.
  book_alone_strategy: 'full',
  book_range_strategy: 'include',
});

export interface RefEndpoint {
  book: BookMeta;
  chapter: number;
  verse: number;
  verseId: string;
}

export interface ParsedReference {
  /** The raw text the user typed. */
  input: string;
  /** Compact OSIS for the first passage, e.g. `Luke.1.5-Luke.1.25`. */
  osis: string;
  start: RefEndpoint;
  end: RefEndpoint;
  /** True when start/end share a book (the M1-supported case). */
  singleBook: boolean;
  /** True when the input contained more than one distinct passage (we use the first). */
  extraPassages: boolean;
}

const OSIS_PART_RE = /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/;

function endpoint(osisPart: string): RefEndpoint | null {
  const m = OSIS_PART_RE.exec(osisPart);
  if (!m) return null;
  const book = findBookByOsis(m[1]!);
  if (!book) return null;
  const chapter = Number(m[2]);
  const verse = Number(m[3]);
  return { book, chapter, verse, verseId: makeVerseId(book.osis, chapter, verse) };
}

/**
 * Parse a free-text reference into a canonical range. Returns `null` when nothing
 * parseable is found. Only the **first** passage is used (a study is one passage);
 * `extraPassages` flags when the user typed more so the UI can note it.
 */
export function parseReference(input: string): ParsedReference | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const matches = bcv.parse(trimmed).osis_and_indices();
  if (matches.length === 0) return null;

  // A single match can still be a comma-joined *sequence* (e.g. "Luke 1; John 3" →
  // "Luke.1.1-Luke.1.80,John.3.1-John.3.36"). We use the first passage of the first
  // match and flag the rest so the UI can note it.
  const segments = matches[0]!.osis.split(',');
  const osis = segments[0]!;
  const [startPart, endPart] = osis.split('-');
  const start = endpoint(startPart!);
  const end = endpoint(endPart ?? startPart!);
  if (!start || !end) return null;

  return {
    input: trimmed,
    osis,
    start,
    end,
    singleBook: start.book.id === end.book.id,
    extraPassages: matches.length > 1 || segments.length > 1,
  };
}

/**
 * Versification lookups (KJV — the numbering we ship), for the `@`-mention chapter/verse
 * autocomplete. They reuse `parseReference` — with `book_alone_strategy:'full'` a bare book expands
 * to its last chapter and a bare chapter to its last verse — so they're the *same* authority as
 * parsing (e.g. KJV 3 John has 14 verses, not 15). Return `null` for an unrecognised / out-of-range
 * input.
 */
export function chapterCount(book: string): number | null {
  const ref = parseReference(book);
  return ref && ref.singleBook && ref.start.chapter === 1 ? ref.end.chapter : null;
}

export function verseCount(book: string, chapter: number): number | null {
  const ref = parseReference(`${book} ${chapter}`);
  return ref && ref.singleBook && ref.start.chapter === chapter && ref.end.chapter === chapter
    ? ref.end.verse
    : null;
}
