import { useEffect, useRef, type RefObject } from 'react';

import { clickSelection, dragSelection } from '@/v2/reader/selection';
import { useCallbackRef } from '@/v2/reader/useCallbackRef';

/**
 * The reader's verse-selection pointer interaction (v2.2), extracted so both the single-column
 * {@link ReaderCanvas} and the two-column {@link ParallelCanvas} share one implementation:
 * drag-to-range, ⌘/Ctrl-disjoint, ⇧-extend, click-to-deselect. It binds long-lived listeners to
 * `containerRef` and reports every change up via `onSelect` (the page holds the selection — the
 * single source of truth). Only elements carrying `data-v` (the **primary** verses) are
 * selectable, so a parallel view's read-only secondary column is naturally inert.
 *
 * The pure algebra lives in `selection.ts`; this is only the pointer plumbing.
 */
export interface DragSelectionArgs {
  containerRef: RefObject<HTMLElement | null>;
  interactive: boolean;
  /** Verse ids in passage order (for range fills + in-range checks). */
  order: string[];
  selected: string[];
  lastAnchor: string | null;
  onSelect: (r: { selected: string[]; lastAnchor: string | null }) => void;
}

export function useDragSelection({
  containerRef,
  interactive,
  order,
  selected,
  lastAnchor,
  onSelect,
}: DragSelectionArgs): void {
  const onSelectStable = useCallbackRef(onSelect);

  // Keep the latest selection/anchor readable inside the (stable) pointer handlers.
  const selectedRef = useRef(selected);
  const lastAnchorRef = useRef(lastAnchor);
  selectedRef.current = selected;
  lastAnchorRef.current = lastAnchor;

  // Transient drag state (refs, so a re-render mid-drag never desyncs it).
  const drag = useRef({
    active: false,
    anchor: '' as string,
    base: [] as string[],
    pre: [] as string[],
    lastTarget: '' as string,
    moved: false,
    meta: false,
    shift: false,
    lastAnchor: null as string | null,
  });

  useEffect(() => {
    if (!interactive) return;
    const el = containerRef.current;
    if (!el) return;

    const verseFrom = (t: EventTarget | null): string | null => {
      const node = (t as HTMLElement | null)?.closest?.('[data-v]');
      return node ? (node as HTMLElement).dataset.v! : null;
    };

    const onDown = (e: PointerEvent) => {
      const v = verseFrom(e.target);
      if (!v) return;
      e.preventDefault();
      const d = drag.current;
      d.active = true;
      d.moved = false;
      d.pre = [...selectedRef.current];
      d.meta = e.metaKey || e.ctrlKey;
      d.shift = e.shiftKey && lastAnchorRef.current != null;
      d.lastAnchor = lastAnchorRef.current;
      if (d.meta) {
        d.base = [...selectedRef.current];
        d.anchor = v;
      } else if (d.shift && d.lastAnchor) {
        d.base = [...selectedRef.current];
        d.anchor = d.lastAnchor;
      } else {
        d.base = [];
        d.anchor = v;
      }
      d.lastTarget = v;
      onSelectStable({ selected: dragSelection(order, d.base, d.anchor, v), lastAnchor: lastAnchorRef.current });
    };

    const onOver = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      const v = verseFrom(e.target);
      if (!v) return;
      if (v !== d.anchor) d.moved = true;
      d.lastTarget = v;
      onSelectStable({ selected: dragSelection(order, d.base, d.anchor, v), lastAnchor: lastAnchorRef.current });
    };

    const onUp = () => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      if (!d.moved && !d.shift) {
        onSelectStable(clickSelection(order, d.pre, d.anchor, { meta: d.meta }, d.lastAnchor));
      } else {
        const sel = dragSelection(order, d.base, d.anchor, d.lastTarget);
        onSelectStable({ selected: sel, lastAnchor: sel.length ? d.anchor : null });
      }
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerover', onOver);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerup', onUp);
    };
  }, [interactive, order, onSelectStable, containerRef]);
}
