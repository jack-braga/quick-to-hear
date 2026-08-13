import { BOOKS, chapterCount, verseCount, type BookMeta } from '@/lib/verse';

/**
 * The book→chapter→verse autocomplete logic for a plain **reference string** (V2-UX-BACKLOG §7.4 —
 * unify the `@`-mention picker onto the question "add reference"). It mirrors the mention editor's
 * inline autocomplete, but reads the whole input value instead of a caret token, so it can drive a
 * standalone combobox. Pure + unit-tested; the component ({@link ReferenceCombobox}) renders it.
 */
const BOOK_PART = '([1-3]\\s?)?[A-Za-z][A-Za-z.]*(?:\\s+[A-Za-z][A-Za-z.]*)*';

export type RefSuggest =
  | { mode: 'book'; query: string }
  | { mode: 'chapter'; book: string }
  | { mode: 'verse'; book: string; chapter: number };

export function referenceSuggest(value: string): RefSuggest | null {
  const tail = value.replace(/^\s+/, ''); // ignore leading space; a trailing space is meaningful

  // "Book <chapter>:<verse?>" → verse grid.
  const verse = /^(.+?)\s+(\d+):(\d*)$/.exec(tail);
  if (verse && chapterCount(verse[1]!.trim()) != null) {
    return { mode: 'verse', book: verse[1]!.trim(), chapter: Number(verse[2]) };
  }
  // "Book " or "Book <digits>" (the book resolves) → chapter grid.
  const chapter = new RegExp(`^(${BOOK_PART})\\s+\\d*$`).exec(tail);
  if (chapter && chapterCount(chapter[1]!.trim()) != null) {
    return { mode: 'chapter', book: chapter[1]!.trim() };
  }
  // Still typing the book name (or empty) → book list.
  if (tail === '' || new RegExp(`^${BOOK_PART}$`).test(tail.trimEnd())) {
    return { mode: 'book', query: tail.trim() };
  }
  return null;
}

/** Books whose name or short name starts with the query (all books when empty), capped at `limit`. */
export function bookHits(query: string, limit = 8): BookMeta[] {
  const q = query.trim().toLowerCase();
  const list = q
    ? BOOKS.filter((b) => b.name.toLowerCase().startsWith(q) || b.shortName.toLowerCase().startsWith(q))
    : BOOKS;
  return list.slice(0, limit);
}

/** The 1..N choices for the current chapter/verse grid (empty unless a grid mode). */
export function numHits(s: RefSuggest | null): number[] {
  const n =
    s?.mode === 'chapter' ? chapterCount(s.book) : s?.mode === 'verse' ? verseCount(s.book, s.chapter) : null;
  return n ? Array.from({ length: n }, (_, i) => i + 1) : [];
}
