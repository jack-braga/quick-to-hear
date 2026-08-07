import { compareVerseIds, parseVerseId } from '@/lib/verse/ids';

/**
 * The verse-selection primitive (v2.2, ROADMAP-v2 §2) — pure algebra over the passage's
 * ordered verse ids, so the reader page can stay a thin component that wires pointer
 * events to these functions and holds the result in React state. This is the load-bearing
 * interaction, kept pure and unit-tested (the house pattern).
 *
 * Selection is **drag-to-range** (press and drag across verses); **⌘/Ctrl adds a disjoint
 * range** (or toggles a single verse); **⇧ extends** from the last anchor; and a plain click
 * on the sole selected verse **deselects** it. Native text-highlight is suppressed by the
 * page (annotation-first) — copy-to-clipboard becomes its own action later.
 */

export type VerseId = string;

/** The inclusive run of verse ids between `a` and `b` in passage order (either order of
 *  arguments). Empty if either id isn't in the passage. */
export function rangeBetween(order: VerseId[], a: VerseId, b: VerseId): VerseId[] {
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia === -1 || ib === -1) return [];
  const [lo, hi] = ia <= ib ? [ia, ib] : [ib, ia];
  return order.slice(lo, hi + 1);
}

/**
 * The selection during a drag: `base` (any prior disjoint ranges being preserved) plus the
 * range from the drag anchor to the current target. Returns ids in passage order,
 * de-duplicated — the shape the page stores.
 */
export function dragSelection(
  order: VerseId[],
  base: VerseId[],
  anchor: VerseId,
  target: VerseId,
): VerseId[] {
  const set = new Set(base);
  for (const id of rangeBetween(order, anchor, target)) set.add(id);
  return order.filter((id) => set.has(id));
}

export interface ClickResult {
  selected: VerseId[];
  /** The verse a subsequent ⇧-extend measures from (null when nothing is selected). */
  lastAnchor: VerseId | null;
}

/**
 * Resolve a plain click (no drag) into the next selection, mirroring the prototype's
 * pointer-up semantics:
 *  - **⇧** (with a prior anchor): add the range from the anchor to the clicked verse.
 *  - **⌘/Ctrl**: toggle the clicked verse in/out of the current selection.
 *  - plain click on the **sole** selected verse: deselect it.
 *  - any other plain click: select just that verse.
 */
export function clickSelection(
  order: VerseId[],
  preSelected: VerseId[],
  clicked: VerseId,
  mods: { meta?: boolean; shift?: boolean },
  lastAnchor: VerseId | null,
): ClickResult {
  if (mods.shift && lastAnchor != null) {
    const selected = dragSelection(order, preSelected, lastAnchor, clicked);
    return { selected, lastAnchor };
  }
  if (mods.meta) {
    const has = preSelected.includes(clicked);
    const next = has ? preSelected.filter((id) => id !== clicked) : [...preSelected, clicked];
    const selected = order.filter((id) => next.includes(id));
    return { selected, lastAnchor: selected.length ? clicked : null };
  }
  // Plain click on the one currently-selected verse → deselect (click-again-to-deselect).
  if (preSelected.length === 1 && preSelected[0] === clicked) {
    return { selected: [], lastAnchor: null };
  }
  return { selected: [clicked], lastAnchor: clicked };
}

/**
 * A compact human reference for a set of verse ids, e.g. `Luke 1:8–13, 18` or, across a
 * chapter boundary, `Luke 1:80, 2:1–2`. Consecutive verses are collapsed into a range only
 * **within one chapter** (cross-chapter adjacency is ambiguous without chapter lengths, so a
 * chapter break always starts a new run). Used for the action-bar label and note anchors.
 */
export function formatVerseIds(ids: VerseId[]): string {
  if (ids.length === 0) return '';
  const sorted = [...new Set(ids)].sort(compareVerseIds);
  const parsed = sorted.map((id) => parseVerseId(id)).filter((p): p is NonNullable<typeof p> => p != null);
  if (parsed.length === 0) return sorted[0]!;

  // Split into consecutive runs (same book + chapter, verse numbers ascending by 1).
  const runs: { chapter: number; from: number; to: number }[] = [];
  for (const p of parsed) {
    const last = runs[runs.length - 1];
    if (last && p.chapter === last.chapter && p.verse === last.to + 1) {
      last.to = p.verse;
    } else {
      runs.push({ chapter: p.chapter, from: p.verse, to: p.verse });
    }
  }

  const book = parsed[0]!.book.shortName;
  let prevChapter: number | null = null;
  const parts = runs.map((r) => {
    const span = r.from === r.to ? `${r.from}` : `${r.from}–${r.to}`;
    // Repeat "chapter:" only when the chapter changes from the previous run.
    const label = r.chapter === prevChapter ? span : `${r.chapter}:${span}`;
    prevChapter = r.chapter;
    return label;
  });
  return `${book} ${parts.join(', ')}`;
}
