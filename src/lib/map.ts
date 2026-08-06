import type { ParsedText, VerseSpan } from '@/types/passage';
import { allVerses, verseIds, verseText } from '@/types/passage';
import { parseVerseId } from '@/lib/verse/ids';
import type { Mark, Section, StudyMap } from '@/types/study';

/**
 * Pure logic for Phase 3 — Map the passage (SPEC Phase 3, PLAN §4.3). Two tasks:
 *
 * - **Structure**: divide the passage into contiguous, named sections following the
 *   author's own breaks. Sections are the source of truth (stored as `{startVerseId,
 *   endVerseId}` pairs); the operations here preserve a valid partition of the loaded
 *   passage — split adds a break, merge removes one, neither leaves a gap or overlap.
 * - **Marks**: a verse / phrase / word the user did not understand. Phrase/word marks
 *   carry character offsets into the verse's NFC text and **degrade to whole-verse**
 *   when the underlying text later changes (a translation switch, a re-parse).
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
// Marks (Phase 3b — question marks)
// ---------------------------------------------------------------------------

export interface Token {
  text: string;
  start: number;
  end: number;
}

/** Split a verse's NFC text into whitespace-delimited tokens with char offsets. The
 *  offsets index into {@link verseText}, the stable basis for sub-verse marks. */
export function tokenizeVerse(text: string): Token[] {
  const tokens: Token[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return tokens;
}

/** A whole-verse mark (SPEC 3b): the confusing text is the whole verse. */
export function makeVerseMark(verse: VerseSpan, id: string): Mark {
  return { id, kind: 'verse', verseId: verse.verseId, text: verseText(verse) };
}

/**
 * A phrase/word mark over `[start, end)` characters of the verse's text. Stores the
 * exact selected substring so it can be revalidated later (see {@link reconcileMarks}).
 */
export function makeSpanMark(
  kind: 'phrase' | 'word',
  verse: VerseSpan,
  start: number,
  end: number,
  id: string,
): Mark {
  const full = verseText(verse);
  return { id, kind, verseId: verse.verseId, span: { start, end }, text: full.slice(start, end) };
}

/** The text a mark currently resolves to against the passage: the selected substring
 *  for a still-valid span mark, else the whole (current) verse text. */
export function resolvedMarkText(mark: Mark, verse: VerseSpan | undefined): string {
  if (!verse || !verse.present) return mark.text;
  const full = verseText(verse);
  if (mark.span && full.slice(mark.span.start, mark.span.end) === mark.text) {
    return mark.text;
  }
  return full;
}

/**
 * Reconcile every mark against the (possibly changed) passage — the single place the
 * PLAN §4.3 rule "degrade to whole-verse if the text later changes" is enforced.
 *
 * - A **span** mark whose stored substring no longer matches the verse's current text
 *   (translation switch, re-parse, or the verse became a gap) **degrades to a
 *   whole-verse mark** — `kind:'verse'`, `span` dropped, `text` refreshed to the verse.
 * - A still-valid span mark is left untouched.
 * - A whole-verse mark's text snapshot is refreshed to the current verse text.
 * - A mark whose verse is no longer in the passage at all (a reference change) is left
 *   as-is — never discarded (Principle 7).
 *
 * Sections are anchored by verse ID only and are unaffected by a text change, so they
 * are passed through unchanged (the UI re-checks them with {@link sectionsMatchPassage}).
 */
export function reconcileMarks(map: StudyMap, passage: ParsedText): StudyMap {
  const byId = new Map<string, VerseSpan>(allVerses(passage).map((v) => [v.verseId, v]));
  let changed = false;

  const marks = map.marks.map((mark): Mark => {
    const verse = byId.get(mark.verseId);
    if (!verse) return mark; // not in this passage — leave untouched

    if (!mark.span) {
      // Whole-verse mark: keep its anchor, refresh the text snapshot if present.
      if (verse.present) {
        const text = verseText(verse);
        if (text !== mark.text) {
          changed = true;
          return { ...mark, text };
        }
      }
      return mark;
    }

    // Span mark: still valid only if the exact substring is unchanged.
    if (verse.present && verseText(verse).slice(mark.span.start, mark.span.end) === mark.text) {
      return mark;
    }
    // Degrade to whole-verse.
    changed = true;
    return {
      id: mark.id,
      kind: 'verse',
      verseId: mark.verseId,
      text: verse.present ? verseText(verse) : mark.text,
    };
  });

  return changed ? { ...map, marks } : map;
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
