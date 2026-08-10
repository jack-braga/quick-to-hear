import { Fragment, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { alignTranslations } from '@/lib/compare';
import { cn } from '@/lib/utils';
import { parseVerseId } from '@/lib/verse/ids';
import { verseIds, type ParsedText } from '@/types/passage';
import type { AnnotationTone } from '@/v2/annotations';
import { ActionBar, type ActionKind } from '@/v2/reader/ActionBar';
import { formatVerseIds } from '@/v2/reader/selection';
import { useDragSelection } from '@/v2/reader/useDragSelection';
import { TONE } from '@/v2/tones';

/**
 * The parallel (side-by-side) canvas (v2.9) — two translations lined up **verse by verse** via the
 * tested `alignTranslations` engine. The **primary** column (left) is the source of truth: you
 * select and annotate there, so it carries `data-v` and the drag-selection; the **secondary**
 * column is read-only reference. Hovering a verse in either column lights it in **both** (and a
 * margin card's hover lights both too) — the correspondence made visible. Selection algebra, the
 * action bar, tones, and the flash are shared with the single-column {@link ReaderCanvas}.
 */

export interface ParallelCanvasProps {
  primary: ParsedText;
  secondary: ParsedText;
  primaryLabel: string;
  secondaryLabel: string;
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
  const { primary, secondary, interactive, selected } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedSet = new Set(selected);

  // Verse-aligned rows (drops `both-gap` rows — nothing to compare there).
  const rows = useMemo(
    () => alignTranslations(primary, secondary).rows.filter((r) => r.status !== 'both-gap'),
    [primary, secondary],
  );
  const order = useMemo(() => verseIds(primary), [primary]);
  const orderSet = useMemo(() => new Set(order), [order]);

  useDragSelection({
    containerRef,
    interactive,
    order,
    selected,
    lastAnchor: props.lastAnchor,
    onSelect: props.onSelect,
  });

  const [hoverVerse, setHoverVerse] = useState<string | null>(null);

  // ---- action-bar position (over the first selected primary verse) ------------------------
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

  const cardLit = (id: string) => props.lit != null && props.lit.ids.has(id);
  const hoverLit = (id: string) => hoverVerse === id;

  const primaryCellClass = (id: string, present: boolean, selectable: boolean): string => {
    const sel = selectedSet.has(id);
    const tone = props.anchorTone.get(id);
    return cn(
      'rounded-[5px] px-2 py-1 transition-colors',
      interactive && selectable && 'cursor-pointer hover:bg-lapis-wash',
      !present && 'text-ink-faint',
      sel && 'bg-lapis-wash shadow-[inset_0_0_0_1px_var(--lapis-edge)]',
      !sel && cardLit(id) && props.lit && TONE[props.lit.tone].ring,
      !sel && !cardLit(id) && hoverLit(id) && 'bg-lapis-wash',
      !sel && !cardLit(id) && !hoverLit(id) && tone && TONE[tone].wash,
      props.flashVerseId === id && 'animate-verse-flash',
    );
  };

  const secondaryCellClass = (id: string, present: boolean): string =>
    cn(
      'rounded-[5px] px-2 py-1 transition-colors',
      !present && 'text-ink-faint',
      cardLit(id) && props.lit ? TONE[props.lit.tone].ring : hoverLit(id) && 'bg-lapis-wash',
    );

  const VerseNo = ({ num, sel }: { num: string; sel: boolean }) => (
    <sup className={cn('mr-1 select-none align-super font-mono text-[0.6em] font-medium', sel ? 'text-lapis' : 'text-ink-faint')}>
      {num}
    </sup>
  );

  const Dash = () => <span className="italic">—</span>;

  // Shown only when the columns stack (narrow screens), so each cell is still identifiable.
  const ColLabel = ({ label }: { label: string }) => (
    <span className="mr-1.5 select-none align-middle font-mono text-[9px] uppercase tracking-[0.1em] text-lapis-ink sm:hidden">
      {label}
    </span>
  );

  return (
    <>
      <article className="mx-auto w-full max-w-[64rem] rounded-leaf border border-line bg-leaf px-[clamp(24px,4vw,56px)] pb-[64px] pt-[44px] shadow-leaf">
        <header className="mb-4 flex items-baseline justify-between gap-4 border-b border-line pb-[16px]">
          <h1 className="font-scripture text-[30px] leading-tight text-ink">{props.leafTitle}</h1>
          <span className="font-mono text-[11px] tracking-[0.03em] text-ink-faint">
            Parallel · {props.primaryLabel} ‖ {props.secondaryLabel}
          </span>
        </header>

        {/* Side-by-side column labels — only meaningful when the two columns sit side by side. */}
        <div className="mb-1 hidden grid-cols-2 gap-x-[clamp(20px,3vw,38px)] sm:grid">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-lapis-ink">{props.primaryLabel}</div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-lapis-ink">{props.secondaryLabel}</div>
        </div>

        <div
          ref={containerRef}
          className="grid select-none grid-cols-1 items-start gap-x-[clamp(20px,3vw,38px)] gap-y-1.5 font-scripture text-[1.16rem] leading-[1.62] text-ink sm:grid-cols-2"
        >
          {rows.map((row) => {
            const num = String(parseVerseId(row.verseId)?.verse ?? '');
            const selectable = orderSet.has(row.verseId);
            return (
              <Fragment key={row.verseId}>
                <div
                  {...(selectable ? { 'data-v': row.verseId } : {})}
                  className={primaryCellClass(row.verseId, row.primaryPresent, selectable)}
                  onMouseEnter={() => enter(row.verseId)}
                  onMouseLeave={() => leave(row.verseId)}
                >
                  <ColLabel label={props.primaryLabel} />
                  <VerseNo num={num} sel={selectedSet.has(row.verseId)} />
                  {row.primaryPresent ? row.primaryText : <Dash />}
                </div>
                <div
                  data-vsec={row.verseId}
                  className={cn(secondaryCellClass(row.verseId, row.secondaryPresent), 'mb-1 sm:mb-0')}
                  onMouseEnter={() => enter(row.verseId)}
                  onMouseLeave={() => leave(row.verseId)}
                >
                  <ColLabel label={props.secondaryLabel} />
                  <VerseNo num={num} sel={false} />
                  {row.secondaryPresent ? row.secondaryText : <Dash />}
                </div>
              </Fragment>
            );
          })}
        </div>
      </article>

      {barPos && (
        <ActionBar label={formatVerseIds(selected)} style={{ left: barPos.left, top: barPos.top }} onAction={props.onAction} />
      )}
    </>
  );
}
