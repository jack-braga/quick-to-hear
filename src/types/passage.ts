import { z } from 'zod';

/**
 * The block/line passage model (PLAN §4.3). Stage 2 tightens what Stage 1 left as
 * pass-through `unknown[]`. Verses are **nested inside blocks** (never flattened): a
 * prose paragraph holds many verses; a poetic verse spans many lines. Editorial
 * headings and Psalm superscriptions are blocks too — kept and marked, never dropped.
 *
 * Everything is anchored to the **`kjv`** versification (the three bundled texts share
 * KJV numbering; they differ only in which numbered slots carry text — see `present`).
 *
 * ## Deviation from PLAN §4.3 (block kinds)
 * PLAN lists block kinds `'p'|'q1'|'q2'|'b'`. We collapse the two poetry kinds into a
 * single `'q'` stanza and move the indentation onto **`Fragment.qlevel`**, because
 * indentation is inherently a *per-line* property, not a per-block one — e.g. Psalm
 * 23:4 alternates q1/q2/q1/q2 *within a single verse*. A `'q'` block therefore holds
 * verses whose fragments each carry their own `qlevel` (one fragment per source line).
 * (PLAN §4.2 explicitly says the final shape lives in code; this keeps it in sync.)
 */

/** A contiguous run of verse text at one indentation and one styling. */
export const FragmentSchema = z.object({
  text: z.string(),
  /** Poetry indent: 0 = prose (inline), 1|2 = poetry line levels. In a `q` block each
   *  fragment is one line; in a `p` block fragments flow inline (qlevel stays 0). */
  qlevel: z.number().int().min(0).max(3).default(0),
  /** Red-letter — words of Jesus (`\wj`). Omitted when false to keep JSON small. */
  wj: z.boolean().optional(),
});
export type Fragment = z.infer<typeof FragmentSchema>;

/** One numbered verse slot. `present:false` = the slot exists in the versification but
 *  this translation carries no text there (an omitted/"gap" verse, e.g. Acts 8:37). */
export const VerseSpanSchema = z.object({
  verseId: z.string(),
  present: z.boolean().default(true),
  fragments: z.array(FragmentSchema).default([]),
});
export type VerseSpan = z.infer<typeof VerseSpanSchema>;

export const BLOCK_KINDS = ['p', 'q', 'b', 'd', 's1', 's2'] as const;
export const BlockKindSchema = z.enum(BLOCK_KINDS);
export type BlockKind = z.infer<typeof BlockKindSchema>;

/**
 * A structural block. `p`/`q`/`b` carry `verses`; `d` (superscription) and `s1`/`s2`
 * (editorial headings) carry `text` and no verse (a superscription attaches to the
 * chapter, not to verse 1). `editorial:true` marks headings as never-to-be-studied.
 */
export const BlockSchema = z.object({
  kind: BlockKindSchema,
  verses: z.array(VerseSpanSchema).default([]),
  text: z.array(FragmentSchema).optional(),
  editorial: z.boolean().optional(),
});
export type Block = z.infer<typeof BlockSchema>;

/** A footnote or cross-reference — tagged and kept beside its verse, never inlined. */
export const StructuredNoteSchema = z.object({
  verseId: z.string(),
  kind: z.enum(['footnote', 'xref']),
  text: z.string(),
});
export type StructuredNote = z.infer<typeof StructuredNoteSchema>;

/**
 * A parsed reading in one translation. For a **bundled** primary this is a *cache*,
 * re-derivable from `setup.reference` + `translationId` (PLAN §4.4); pasted text (M2)
 * will be the source of truth.
 */
export const ParsedTextSchema = z.object({
  translationId: z.string(),
  versification: z.literal('kjv').default('kjv'),
  /** The human reference this reading covers, e.g. "Luke 1:5-25". */
  reference: z.string().default(''),
  blocks: z.array(BlockSchema).default([]),
  notes: z.array(StructuredNoteSchema).default([]),
});
export type ParsedText = z.infer<typeof ParsedTextSchema>;

// ---------------------------------------------------------------------------
// Derived helpers (pure — safe to use in the store, renderer, and tests)
// ---------------------------------------------------------------------------

/** The NFC-concatenated plain text of a verse (the stable basis for sub-verse marks,
 *  PLAN §4.3). Fragments are joined by a space and whitespace is collapsed. */
export function verseText(span: VerseSpan): string {
  return span.fragments
    .map((f) => f.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every verse span in a parsed reading, in document order (flattened for iteration
 *  only — the stored model keeps verses nested in their blocks). */
export function allVerses(pt: ParsedText): VerseSpan[] {
  return pt.blocks.flatMap((b) => b.verses);
}

/** The ordered list of verse IDs a reading covers (present or gapped). */
export function verseIds(pt: ParsedText): string[] {
  return allVerses(pt).map((v) => v.verseId);
}

/** Verse IDs among `ids` that have no text in this reading (`present:false` or absent).
 *  Drives the "switching primary flags the now-textless verse" check (PLAN §4.3). */
export function textlessVerseIds(pt: ParsedText, ids: string[]): string[] {
  const present = new Set(allVerses(pt).filter((v) => v.present).map((v) => v.verseId));
  return ids.filter((id) => !present.has(id));
}
