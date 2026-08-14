import type { Block, ParsedText, StructuredNote } from '@/types/passage';
import { verseIdInRange } from '@/lib/verse/ids';
import type { BuiltBook } from '@/lib/bible/usfm';

/**
 * Slice a loaded book down to one reading (PLAN §4.5 `extractReading`). Produces the
 * `ParsedText` block/line model the study stores, keeping verses nested in their blocks
 * and preserving structure that sits *inside* the range:
 *
 * - verse blocks are trimmed to their in-range verses (a `present:false` gap verse is
 *   kept — it is part of the passage, just textless);
 * - a superscription/heading/blank block is kept when it sits between in-range verses or
 *   immediately precedes the first in-range verse (so an opening Psalm superscription or
 *   section heading survives), and dropped otherwise.
 *
 * Ranges are compared canonically, so a cross-chapter range within one book works.
 */
export interface ExtractOptions {
  startId: string;
  endId: string;
  reference: string;
  /** Optional discontiguous spans (a verse list, e.g. `Luke 1:1,16-17,32`). When present, a verse
   *  is kept iff it falls in **any** span; `startId`/`endId` are ignored. */
  ranges?: { startId: string; endId: string }[];
}

export function extractReading(book: BuiltBook, opts: ExtractOptions): ParsedText {
  const { startId, endId, ranges } = opts;
  const inRange = ranges
    ? (id: string) => ranges.some((r) => verseIdInRange(id, r.startId, r.endId))
    : (id: string) => verseIdInRange(id, startId, endId);

  const blocks: Block[] = [];
  const noteIds = new Set<string>();
  let pending: Block[] = []; // non-verse blocks awaiting an in-range verse to anchor to

  for (const chapter of book.chapters) {
    for (const block of chapter.blocks) {
      const isVerseBlock = block.kind === 'p' || block.kind === 'q' || block.kind === 'b';
      const hasVerses = block.verses.length > 0;

      if (isVerseBlock && hasVerses) {
        const verses = block.verses.filter((v) => inRange(v.verseId));
        if (verses.length > 0) {
          blocks.push(...pending);
          pending = [];
          blocks.push({ ...block, verses });
          verses.forEach((v) => noteIds.add(v.verseId));
        } else {
          // This block has no in-range verses. Drop any pending non-verse blocks we were holding for
          // a following verse — before the range, between the spans of a discontiguous verse list, or
          // past it, they don't belong to an in-range verse. (A later block may still be in range for a
          // verse list, so we keep scanning.)
          pending = [];
        }
      } else {
        // Superscription / heading / blank — hold until a following in-range verse.
        pending.push(block);
      }
    }
  }

  const notes: StructuredNote[] = book.chapters
    .flatMap((c) => c.notes)
    .filter((n) => noteIds.has(n.verseId));

  return {
    translationId: book.translationId,
    versification: 'kjv',
    reference: opts.reference,
    source: 'bundled',
    blocks,
    notes,
  };
}
