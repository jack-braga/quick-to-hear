import { allVerses, verseText, type ParsedText, type VerseSpan } from '@/types/passage';

/**
 * Translation comparison (M3 / Stage 9, SPEC Phase 1).
 *
 * One pure concern, no side effects — safe in the store, pages, and tests:
 *
 *  {@link alignTranslations} — line a secondary reading up against the primary **by verse
 *  number** (verse-id equality) plus the per-verse `present` flag. All bundled texts share KJV
 *  numbering, so this is exactly right: a verse present in one and gapped/absent in another is
 *  **flagged as a mismatch, never silently aligned** (PLAN §4.3 "within the bundle: equate,
 *  don't map"). This is what stops a naive present-verse zip from pairing e.g. Acts 8:38
 *  against the other text's 8:37.
 *
 * The alignment assumes **standard English (KJV) verse numbering** on both sides. A pasted
 * translation that numbers Psalm verses differently (e.g. counting the superscription as verse
 * 1) may line up off by one; the paste screen says so. Cross-versification *mapping* is
 * deliberately out of scope (it was an unfinished 8-row table that silently misaligned any
 * psalm it didn't list — removed §1.8) and is deferred to a real M3-only feature if needed.
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
