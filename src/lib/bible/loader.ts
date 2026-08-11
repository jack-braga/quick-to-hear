import type { ParsedText } from '@/types/passage';
import type { ParsedReference } from '@/lib/verse/reference';
import { extractReading } from '@/lib/bible/extract';
import type { BuiltBook } from '@/lib/bible/usfm';

/**
 * Runtime Bible loader (PLAN §4.4/§4.5): bundled books are static assets fetched
 * per-book and memory-cached — never kept in user storage. Assets resolve through
 * `import.meta.env.BASE_URL` so they work under the GitHub Pages sub-path. The PWA
 * runtime-caches `bibles/**` (vite.config.ts), so a fetched book also survives offline.
 */

const cache = new Map<string, Promise<BuiltBook>>();

function bookUrl(translationId: string, bookId: string): string {
  return `${import.meta.env.BASE_URL}bibles/${translationId}/${bookId}.json`;
}

/** Fetch (and cache) one book's structured JSON. Rejects on a missing/invalid asset. */
export function loadBook(translationId: string, bookId: string): Promise<BuiltBook> {
  const key = `${translationId}/${bookId}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = fetch(bookUrl(translationId, bookId))
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${key} (${res.status})`);
        return res.json() as Promise<BuiltBook>;
      })
      .catch((err) => {
        cache.delete(key); // don't cache a failure — allow a retry
        throw err;
      });
    cache.set(key, hit);
  }
  return hit;
}

/**
 * Load + slice a reading in one translation. M1 supports single-book passages; a
 * cross-book range is clamped to the start book (the caller warns).
 */
export async function loadReading(
  translationId: string,
  ref: ParsedReference,
): Promise<ParsedText> {
  const book = await loadBook(translationId, ref.start.book.id);
  // A verse list (multiple spans, all in the start book) extracts the union of its spans; a simple
  // reference extracts one contiguous range (clamped to the start book for a cross-book range).
  const ranges =
    ref.segments.length > 1 && ref.segments.every((s) => s.start.book.id === ref.start.book.id)
      ? ref.segments.map((s) => ({ startId: s.start.verseId, endId: s.end.verseId }))
      : undefined;
  return extractReading(book, {
    startId: ref.start.verseId,
    endId: ref.singleBook ? ref.end.verseId : lastVerseIdOf(book),
    reference: ref.input,
    ranges,
  });
}

/** The last verse id present in a loaded book (used to clamp a cross-book range). */
function lastVerseIdOf(book: BuiltBook): string {
  for (let c = book.chapters.length - 1; c >= 0; c--) {
    const verses = book.chapters[c]!.blocks.flatMap((b) => b.verses);
    if (verses.length > 0) return verses[verses.length - 1]!.verseId;
  }
  return `${book.osis.toUpperCase()}.1.1`;
}

export function clearBookCache(): void {
  cache.clear();
}
