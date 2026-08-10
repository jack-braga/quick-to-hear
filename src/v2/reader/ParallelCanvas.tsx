import { Fragment, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { parseVerseId } from '@/lib/verse/ids';
import { allVerses, verseIds, verseText, type ParsedText, type VerseSpan } from '@/types/passage';
import type { AnnotationTone } from '@/v2/annotations';
import { ActionBar, type ActionKind } from '@/v2/reader/ActionBar';
import { formatVerseIds } from '@/v2/reader/selection';
import { useDragSelection } from '@/v2/reader/useDragSelection';
import { TONE } from '@/v2/tones';

/**
 * The parallel (side-by-side) canvas (v2.9) — **N** translations lined up **verse by verse** by
 * verse-id equality (the first is the primary — the anchoring source of truth). **Every** column's
 * verses are selectable: anchors are translation-independent verse ids, so clicking a verse in any
 * column selects that verse. Hovering a verse (or a margin card) lights it in **every** column.
 * Selection algebra, the action bar, tones, and the flash are shared with {@link ReaderCanvas}.
 */

export interface ParallelCanvasProps {
  /** Viewed translations, **primary first** then the secondaries, in display order. */
  translations: ParsedText[];
  /** Short label per translation (same order). */
  labels: string[];
  leafTitle: string;
  interactive: boolean;
  selected: string[];
  lastAnchor: string | null;
  anchorTone: Map<string, AnnotationTone>;
  lit: { ids: Set<string>; tone: AnnotationTone } | null;
  flashVerseId: string | null;
  onSelect: (r: { selected: string[]; lastAnchor: string | null }) => void;
  onVerseHover: (verseId: string | null) => void;
  onAction: (kind: ActionKind) => void;
}

export function ParallelCanvas(props: ParallelCanvasProps) {
  const { translations, interactive, selected } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedSet = new Set(selected);

  const primary = translations[0]!;
  const order = useMemo(() => verseIds(primary), [primary]);
  // Per-translation verse lookup (id → span), so any verse resolves across every column.
  const byId = useMemo(
    () => translations.map((t) => new Map(allVerses(t).map((v) => [v.verseId, v]))),
    [translations],
  );
  // Rows: primary verse order, dropping ids no viewed translation carries.
  const rows = useMemo(
    () => order.filter((id) => byId.some((m) => m.get(id)?.present)),
    [order, byId],
  );

  useDragSelection({
    containerRef,
    interactive,
    order,
    selected,
    lastAnchor: props.lastAnchor,
    onSelect: props.onSelect,
  });

  const [hoverVerse, setHoverVerse] = useState<string | null>(null);

  // ---- action-bar position (over the first selected verse, in any column) -----------------
  const [barPos, setBarPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!interactive || selected.length === 0) {
      setBarPos(null);
      return;
    }
    const place = () => {
      const el = containerRef.current;
      if (!el) return;
      const first = el.querySelector(`[data-v="${CSS.escape(selected[0]!)}"]`) as HTMLElement | null;
      if (!first) {
        setBarPos(null);
        return;
      }
      const r = first.getBoundingClientRect();
      setBarPos({ left: Math.min(Math.max(r.left + 90, 140), window.innerWidth - 140), top: r.top });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [interactive, selected]);

  const enter = (id: string) => {
    setHoverVerse(id);
    props.onVerseHover(id);
  };
  const leave = (id: string) => {
    setHoverVerse((c) => (c === id ? null : c));
    props.onVerseHover(null);
  };

  // One cell style for every column — the verse state (selected/lit/anchored/hover/flash) is keyed
  // by verse id, so all columns of a verse share it.
  const cellClass = (id: string, present: boolean): string => {
    const sel = selectedSet.has(id);
    const cardLit = props.lit != null && props.lit.ids.has(id);
    const hoverLit = hoverVerse === id;
    const tone = props.anchorTone.get(id);
    return cn(
      'rounded-[5px] px-2 py-1 transition-colors',
      interactive && present && 'cursor-pointer hover:bg-lapis-wash',
      !present && 'text-ink-faint',
      sel && 'bg-lapis-wash shadow-[inset_0_0_0_1px_var(--lapis-edge)]',
      !sel && cardLit && props.lit && TONE[props.lit.tone].ring,
      !sel && !cardLit && hoverLit && 'bg-lapis-wash',
      !sel && !cardLit && !hoverLit && tone && TONE[tone].wash,
      props.flashVerseId === id && 'animate-verse-flash',
    );
  };

  const gridStyle = {
    gridTemplateColumns: `repeat(${translations.length}, minmax(0, 1fr))`,
    columnGap: 'clamp(18px,2.5vw,34px)',
  };

  const Cell = ({ id, span }: { id: string; span: VerseSpan | undefined }) => {
    const present = span?.present ?? false;
    const num = String(parseVerseId(id)?.verse ?? '');
    return (
      <div data-v={id} className={cellClass(id, present)} onMouseEnter={() => enter(id)} onMouseLeave={() => leave(id)}>
        <sup className={cn('mr-1 select-none align-super font-mono text-[0.6em] font-medium', selectedSet.has(id) ? 'text-lapis' : 'text-ink-faint')}>
          {num}
        </sup>
        {present ? verseText(span!) : <span className="italic">—</span>}
      </div>
    );
  };

  return (
    <>
      <article className="mx-auto w-full max-w-[72rem] rounded-leaf border border-line bg-leaf px-[clamp(24px,3vw,52px)] pb-[64px] pt-[44px] shadow-leaf">
        <header className="mb-4 flex items-baseline justify-between gap-4 border-b border-line pb-[16px]">
          <h1 className="font-scripture text-[30px] leading-tight text-ink">{props.leafTitle}</h1>
          <span className="font-mono text-[11px] tracking-[0.03em] text-ink-faint">Parallel · {props.labels.join(' ‖ ')}</span>
        </header>

        {/* column labels */}
        <div className="mb-1 grid" style={gridStyle}>
          {props.labels.map((l, i) => (
            <div key={i} className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-lapis-ink">
              {l}
            </div>
          ))}
        </div>

        <div
          ref={containerRef}
          className="grid select-none items-start gap-y-1.5 font-scripture text-[1.14rem] leading-[1.6] text-ink"
          style={gridStyle}
        >
          {rows.map((id) => (
            <Fragment key={id}>
              {translations.map((_, i) => (
                <Cell key={i} id={id} span={byId[i]!.get(id)} />
              ))}
            </Fragment>
          ))}
        </div>
      </article>

      {barPos && (
        <ActionBar label={formatVerseIds(selected)} style={{ left: barPos.left, top: barPos.top }} onAction={props.onAction} />
      )}
    </>
  );
}
