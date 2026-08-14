import type { ParsedText } from '@/types/passage';
import { verseIds } from '@/types/passage';
import { parseVerseId } from '@/lib/verse/ids';
import type { Section } from '@/types/study';

/**
 * Pure logic for the Survey lens — **structure** the passage (SPEC Phase 3a, PLAN §4.3):
 * divide it into contiguous, named sections following the author's own breaks. Sections are
 * the source of truth (stored as `{startVerseId, endVerseId}` pairs); the operations here
 * preserve a valid partition of the loaded passage — split adds a break, merge removes one,
 * neither leaves a gap or overlap.
 *
 * (The old v1 sub-verse **marks** — degrade-on-text-change — were removed with §1.7; the v2
 * reader anchors "mark confusing" as a plain annotation by verse id, so no reconcile is needed.)
 *
 * Everything is kept pure (ids are passed in, not generated) so it is trivially
 * testable and the store/page just wrap it.
 */

// ---------------------------------------------------------------------------
// Sections (Phase 3a — structure)
// ---------------------------------------------------------------------------

/** Index of a verse ID in the passage's ordered verse list, or -1 if absent. */
function indexOf(passageVerseIds: string[], verseId: string): number {
  return passageVerseIds.indexOf(verseId);
}

/** A single section spanning the whole passage — the starting point for dividing. */
export function wholePassageSection(passageVerseIds: string[], id: string): Section {
  return {
    id,
    startVerseId: passageVerseIds[0]!,
    endVerseId: passageVerseIds[passageVerseIds.length - 1]!,
    name: '',
  };
}

/** Sections in passage order (by the position of their start verse). */
export function orderedSections(sections: Section[], passageVerseIds: string[]): Section[] {
  return [...sections].sort(
    (a, b) => indexOf(passageVerseIds, a.startVerseId) - indexOf(passageVerseIds, b.startVerseId),
  );
}

/**
 * True when `sections` form a valid contiguous partition of the passage: sorted by
 * start they tile every verse exactly once, first→last, no gap, no overlap. Used to
 * decide whether the stored sections still fit the loaded passage (they won't after a
 * reference change) — if not, the user re-divides from a fresh whole-passage section.
 */
export function sectionsMatchPassage(sections: Section[], passageVerseIds: string[]): boolean {
  if (passageVerseIds.length === 0 || sections.length === 0) return false;
  const ordered = orderedSections(sections, passageVerseIds);
  let expected = 0;
  for (const s of ordered) {
    const start = indexOf(passageVerseIds, s.startVerseId);
    const end = indexOf(passageVerseIds, s.endVerseId);
    if (start === -1 || end === -1) return false;
    if (start !== expected || end < start) return false;
    expected = end + 1;
  }
  return expected === passageVerseIds.length;
}

/** The ordered verse IDs a section covers, within the passage. */
export function sectionVerseIds(section: Section, passageVerseIds: string[]): string[] {
  const start = indexOf(passageVerseIds, section.startVerseId);
  const end = indexOf(passageVerseIds, section.endVerseId);
  if (start === -1 || end === -1) return [];
  return passageVerseIds.slice(start, end + 1);
}

/**
 * Insert a break so `boundaryVerseId` becomes the first verse of a new second section.
 * The original section keeps its id, name, and weight; the new second half gets
 * `newId` and an empty name. No-op if the boundary isn't strictly inside the section.
 */
export function splitSectionAt(
  sections: Section[],
  sectionId: string,
  boundaryVerseId: string,
  passageVerseIds: string[],
  newId: string,
): Section[] {
  const sec = sections.find((s) => s.id === sectionId);
  if (!sec) return sections;
  const startIdx = indexOf(passageVerseIds, sec.startVerseId);
  const endIdx = indexOf(passageVerseIds, sec.endVerseId);
  const boundaryIdx = indexOf(passageVerseIds, boundaryVerseId);
  if (boundaryIdx <= startIdx || boundaryIdx > endIdx) return sections; // not a valid cut
  const first: Section = { ...sec, endVerseId: passageVerseIds[boundaryIdx - 1]! };
  const second: Section = {
    id: newId,
    startVerseId: boundaryVerseId,
    endVerseId: sec.endVerseId,
    name: '',
  };
  return sections.flatMap((s) => (s.id === sectionId ? [first, second] : [s]));
}

/**
 * Remove the break before `sectionId`, merging it into the section above. The earlier
 * section keeps its id, name, and weight; the merged-away section's name is dropped
 * (removing a break is an explicit, user-initiated action). No-op for the first section.
 */
export function mergeSectionUp(
  sections: Section[],
  sectionId: string,
  passageVerseIds: string[],
): Section[] {
  const ordered = orderedSections(sections, passageVerseIds);
  const idx = ordered.findIndex((s) => s.id === sectionId);
  if (idx <= 0) return sections; // nothing above to merge into
  const prev = ordered[idx - 1]!;
  const cur = ordered[idx]!;
  const merged: Section = { ...prev, endVerseId: cur.endVerseId };
  return sections.flatMap((s) => {
    if (s.id === prev.id) return [merged];
    if (s.id === cur.id) return [];
    return [s];
  });
}

/** Rename a section (the user names each in their own words — SPEC 3a). */
export function renameSection(sections: Section[], sectionId: string, name: string): Section[] {
  return sections.map((s) => (s.id === sectionId ? { ...s, name } : s));
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** A human reference for a verse ID, e.g. `LUKE.1.5` → "Luke 1:5". Falls back to the
 *  raw id if it can't be parsed. */
export function verseRefLabel(verseId: string): string {
  const p = parseVerseId(verseId);
  if (!p) return verseId;
  return `${p.book.shortName} ${p.chapter}:${p.verse}${p.suffix}`;
}

/** Compact label for a verse within a passage: just the verse number when the whole
 *  passage sits in one chapter, else `chapter:verse` (a range like Luke 1:5–2:10). */
export function verseChipLabel(verseId: string, multiChapter: boolean): string {
  const p = parseVerseId(verseId);
  if (!p) return verseId;
  return multiChapter ? `${p.chapter}:${p.verse}${p.suffix}` : `${p.verse}${p.suffix}`;
}

/** True when the passage spans more than one chapter (drives {@link verseChipLabel}). */
export function passageIsMultiChapter(passage: ParsedText): boolean {
  const chapters = new Set(
    verseIds(passage)
      .map((id) => parseVerseId(id)?.chapter)
      .filter((c): c is number => c != null),
  );
  return chapters.size > 1;
}
