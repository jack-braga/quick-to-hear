import { allVerses, verseText, type ParsedText, type VerseSpan } from '@/types/passage';
import { makeVerseId, parseVerseId } from '@/lib/verse/ids';

/**
 * Translation comparison (M3 / Stage 9, SPEC Phase 1).
 *
 * Two pure concerns, no side effects — safe in the store, pages, and tests:
 *
 *  1. {@link alignTranslations} — line a secondary reading up against the primary **by verse
 *     number** (verse-id equality) plus the per-verse `present` flag. All three bundled
 *     texts share KJV numbering, so this is exactly right: a verse present in one and
 *     gapped/absent in another is **flagged as a mismatch, never silently aligned** (PLAN
 *     §4.3 "within the bundle: equate, don't map"). This is what stops a naive present-verse
 *     zip from pairing e.g. Acts 8:38 against the other text's 8:37.
 *
 *  2. {@link reversifyToKjv} — the **small safe converter** for the rare case of a pasted
 *     secondary whose verses follow a *foreign* numbering (classically Hebrew Psalms, where
 *     the superscription is counted as verse 1, shifting everything up). It remaps those
 *     numbers onto the KJV anchor from a small, explicit data table and **flags every verse
 *     it cannot map** (e.g. a title that KJV doesn't number), rather than misaligning. No
 *     `reversify` npm plugin, no `bcv_parser` monkey-patch, no new deps.
 *
 * Comparison exists to *notice that translators made an interpretive decision* — not to pick
 * a preferred rendering (SPEC Phase 1). That framing lives in the guidance beside the UI.
 */

// ---------------------------------------------------------------------------
// 1. Alignment (bundle: number-equality + present flag)
// ---------------------------------------------------------------------------

export type AlignStatus =
  /** Both translations carry text at this verse — a real side-by-side comparison. */
  | 'matched'
  /** Present in exactly one — a numbering/omission difference to FLAG, never align away. */
  | 'mismatch'
  /** Neither carries text (both omit this numbered slot) — agreed, informational only. */
  | 'both-gap';

export interface AlignedVerse {
  verseId: string;
  status: AlignStatus;
  primaryPresent: boolean;
  secondaryPresent: boolean;
  /** The verse text where present, else '' (a gap renders as "—"). */
  primaryText: string;
  secondaryText: string;
}

export interface Alignment {
  /** The secondary translation this alignment is against. */
  translationId: string;
  rows: AlignedVerse[];
  /** Count of `mismatch` rows — the number the UI flags ("N verses don't line up"). */
  mismatchCount: number;
}

function makeRow(verseId: string, pv: VerseSpan | undefined, sv: VerseSpan | undefined): AlignedVerse {
  const primaryPresent = pv?.present ?? false;
  const secondaryPresent = sv?.present ?? false;
  const status: AlignStatus =
    primaryPresent && secondaryPresent
      ? 'matched'
      : !primaryPresent && !secondaryPresent
        ? 'both-gap'
        : 'mismatch';
  return {
    verseId,
    status,
    primaryPresent,
    secondaryPresent,
    primaryText: primaryPresent ? verseText(pv!) : '',
    secondaryText: secondaryPresent ? verseText(sv!) : '',
  };
}

/**
 * Align `secondary` against `primary` by verse-id equality. Iterates the primary's verse
 * slots (the anchor) in document order, then appends any secondary-only slots the primary
 * never numbers — so nothing is silently dropped and the same-numbered verses always pair
 * up (a gap on one side becomes a flagged mismatch at that exact slot).
 */
export function alignTranslations(primary: ParsedText, secondary: ParsedText): Alignment {
  const secMap = new Map(allVerses(secondary).map((v) => [v.verseId, v]));
  const seen = new Set<string>();
  const rows: AlignedVerse[] = [];

  for (const pv of allVerses(primary)) {
    seen.add(pv.verseId);
    rows.push(makeRow(pv.verseId, pv, secMap.get(pv.verseId)));
  }
  // Verses the secondary has that the primary never numbers (e.g. it carries text at a slot
  // the primary omits entirely) — surface them, flagged, rather than hide them.
  for (const sv of allVerses(secondary)) {
    if (seen.has(sv.verseId)) continue;
    rows.push(makeRow(sv.verseId, undefined, sv));
  }

  return {
    translationId: secondary.translationId,
    rows,
    mismatchCount: rows.filter((r) => r.status === 'mismatch').length,
  };
}

/** The single row for one verse across primary + secondary (the on-demand-at-a-verse case).
 *  Returns null when the verse isn't in either reading. */
export function alignVerse(
  primary: ParsedText,
  secondary: ParsedText,
  verseId: string,
): AlignedVerse | null {
  const pv = allVerses(primary).find((v) => v.verseId === verseId);
  const sv = allVerses(secondary).find((v) => v.verseId === verseId);
  if (!pv && !sv) return null;
  return makeRow(verseId, pv, sv);
}

// ---------------------------------------------------------------------------
// 2. Versification converter (foreign paste → KJV anchor)
// ---------------------------------------------------------------------------

/**
 * A per-chapter rule for a foreign numbering system. `titleVerses` is how many leading
 * verses the foreign scheme spends on the superscription/title that KJV does **not** number
 * (those are unmappable); `delta` is how much higher the foreign numbers run for the rest
 * (KJV verse = foreign verse − delta). For a plain "title = verse 1" Psalm, both are 1.
 */
interface ChapterRule {
  titleVerses: number;
  delta: number;
}

export interface VersificationSystem {
  id: string;
  label: string;
  /** Keyed by `"BOOK.chapter"` (uppercased OSIS). Chapters absent here map identically —
   *  correct for the overwhelming majority of verses even under Hebrew numbering. */
  chapters: Record<string, ChapterRule>;
}

/**
 * The one shipped foreign system: original/Hebrew Psalm numbering, where the psalm title is
 * counted among the verses. The table is **deliberately small and explicit** (the common,
 * verifiable heading-shift cases) — the mechanism is data-driven, so it extends by adding
 * rows, and any chapter not listed maps identically. Verified against BHS: Ps 3 & 4 title =
 * v1; Ps 51 & 52 title = vv1–2.
 */
export const HEBREW_PSALMS: VersificationSystem = {
  id: 'hebrew-psalms',
  label: 'Hebrew / original Psalm numbering',
  chapters: {
    'PS.3': { titleVerses: 1, delta: 1 },
    'PS.4': { titleVerses: 1, delta: 1 },
    'PS.5': { titleVerses: 1, delta: 1 },
    'PS.6': { titleVerses: 1, delta: 1 },
    'PS.51': { titleVerses: 2, delta: 2 },
    'PS.52': { titleVerses: 2, delta: 2 },
    'PS.54': { titleVerses: 2, delta: 2 },
    'PS.60': { titleVerses: 2, delta: 2 },
  },
};

/** Foreign systems the UI offers for a pasted secondary (besides the default KJV = identity). */
export const FOREIGN_SYSTEMS: VersificationSystem[] = [HEBREW_PSALMS];

export function findVersificationSystem(id: string | null | undefined): VersificationSystem | undefined {
  return FOREIGN_SYSTEMS.find((s) => s.id === id);
}

export interface ReversifyResult {
  /** The secondary remapped onto the KJV anchor (verse ids shifted). */
  text: ParsedText;
  /** Original (foreign) verse ids that have no KJV slot — the title verses. Flagged, not
   *  aligned. */
  unmappable: string[];
}

/**
 * Remap a foreign-numbered secondary onto the KJV anchor using `system`. Each verse's number
 * is shifted per its chapter rule; a title verse (no KJV equivalent) is dropped from the text
 * and its original id collected in `unmappable`. Verse ids in unruled chapters pass through
 * unchanged. Pure — returns a new `ParsedText`, never mutates the input.
 */
export function reversifyToKjv(secondary: ParsedText, system: VersificationSystem): ReversifyResult {
  const unmappable: string[] = [];

  const remapId = (verseId: string): string | null => {
    const parts = parseVerseId(verseId);
    if (!parts) return verseId; // unparseable — leave it, let alignment flag it
    const osis = parts.book.osis.toUpperCase();
    const rule = system.chapters[`${osis}.${parts.chapter}`];
    if (!rule) return verseId; // unruled chapter → identical numbering
    if (parts.verse <= rule.titleVerses) return null; // the title — no KJV verse
    return makeVerseId(osis, parts.chapter, parts.verse - rule.delta);
  };

  const blocks = secondary.blocks.map((block) => ({
    ...block,
    verses: block.verses.flatMap((v) => {
      const mapped = remapId(v.verseId);
      if (mapped === null) {
        unmappable.push(v.verseId);
        return [];
      }
      return [{ ...v, verseId: mapped }];
    }),
  }));

  return {
    text: { ...secondary, blocks },
    unmappable,
  };
}
