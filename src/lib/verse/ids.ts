import { findBookByOsis, type BookMeta } from '@/lib/verse/books';

/**
 * Canonical verse IDs (PLAN §4.3): `BOOK.CH.VS`, e.g. `LUKE.1.5`, `PS.23.1`,
 * `3JOHN.1.14`. The book part is `bcv_parser`'s OSIS code **uppercased**; positions are
 * in the **`kjv`** versification. IDs are kept as **plain strings** so a future `"1a"`
 * suffix is tolerated without a schema change (no verse-0 / letter-suffix / merged-range
 * *logic* is built in M1). Anchors store IDs, never text offsets, so they survive edits,
 * re-parse, and primary switches.
 */

export interface ParsedVerseId {
  book: BookMeta;
  chapter: number;
  verse: number;
  /** Any suffix after the numeric verse (e.g. `a` in a future `1a`); '' if none. */
  suffix: string;
}

/** Build a canonical verse ID from an OSIS book code + chapter + verse. */
export function makeVerseId(osis: string, chapter: number, verse: number | string): string {
  return `${osis.toUpperCase()}.${chapter}.${verse}`;
}

const ID_RE = /^([0-9A-Z]+)\.(\d+)\.(\d+)([A-Za-z]*)$/;

/** Parse a canonical verse ID; returns null for anything malformed or unknown. */
export function parseVerseId(id: string): ParsedVerseId | null {
  const m = ID_RE.exec(id);
  if (!m) return null;
  const [, bookPart, ch, vs, suffix] = m;
  const book = findBookByOsis(bookPart!);
  if (!book) return null;
  return { book, chapter: Number(ch), verse: Number(vs), suffix: suffix ?? '' };
}

/** A sort key that orders verses canonically (book order → chapter → verse). Unknown
 *  IDs sort last, deterministically, rather than throwing. */
export function verseSortKey(id: string): number {
  const p = parseVerseId(id);
  if (!p) return Number.MAX_SAFE_INTEGER;
  // Book (≤66) · chapter (≤~150) · verse (≤~176) packed into one monotonic number.
  return p.book.order * 1_000_000 + p.chapter * 1_000 + p.verse;
}

/** Compare two verse IDs canonically (for sort / range checks). */
export function compareVerseIds(a: string, b: string): number {
  return verseSortKey(a) - verseSortKey(b);
}

/** True when `id` falls within the inclusive range [start, end] (canonical order). */
export function verseIdInRange(id: string, start: string, end: string): boolean {
  const k = verseSortKey(id);
  return k >= verseSortKey(start) && k <= verseSortKey(end);
}
