import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { verseRefLabel } from '@/lib/map';
import { ActionBar } from '@/v2/reader/ActionBar';
import type { ReaderBand, ReaderGroup, ReaderModel, ReaderVerse } from '@/v2/reader/model';
import { clickSelection, dragSelection, formatVerseIds } from '@/v2/reader/selection';
import { useCallbackRef } from '@/v2/reader/useCallbackRef';

/**
 * The Scripture canvas (v2.2) — renders the {@link ReaderModel} as the passage-as-canvas, and
 * (when `interactive`) owns the verse-selection interaction: drag-to-range, ⌘-disjoint,
 * ⇧-extend, click-to-deselect, with the native highlight suppressed. It positions the floating
 * {@link ActionBar} over the selection and renders the section bands with inline "＋ divide
 * here" handles (any verse boundary), an inline-editable name, a range chip, and a merge-up.
 *
 * All the selection algebra is the pure `selection.ts`; this component only wires pointer
 * events to it and reports the result up (the page holds selection state — the single source
 * of truth). Read-only lenses pass `interactive={false}` and get the same text with no overlays.
 */

const INDENT = ['', 'pl-4', 'pl-8', 'pl-12'] as const;

export interface ReaderCanvasProps {
  model: ReaderModel;
  interactive: boolean;
  leafTitle: string;
  leafMeta: string;
  selected: string[];
  lastAnchor: string | null;
  anchoredVerseIds: Set<string>;
  litVerseIds: Set<string>;
  flashVerseId: string | null;
  onSelect: (r: { selected: string[]; lastAnchor: string | null }) => void;
  onVerseHover: (verseId: string | null) => void;
  onDivide: (sectionId: string, boundaryVerseId: string) => void;
  onMerge: (sectionId: string) => void;
  onRename: (sectionId: string, name: string) => void;
  onSelectSectionRange: (startVerseId: string, endVerseId: string) => void;
  onMark: () => void;
}

export function ReaderCanvas(props: ReaderCanvasProps) {
  const { model, interactive, selected, lastAnchor } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedSet = new Set(selected);
  const order = model.verseIds;
  const onSelect = useCallbackRef(props.onSelect);

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

  // Keep the latest selection/anchor readable inside the (stable) pointer handlers.
  const selectedRef = useRef(selected);
  const lastAnchorRef = useRef(lastAnchor);
  selectedRef.current = selected;
  lastAnchorRef.current = lastAnchor;

  // ---- pointer-drag selection -------------------------------------------------------------
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
      onSelect({ selected: dragSelection(order, d.base, d.anchor, v), lastAnchor: lastAnchorRef.current });
    };

    const onOver = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      const v = verseFrom(e.target);
      if (!v) return;
      if (v !== d.anchor) d.moved = true;
      d.lastTarget = v;
      onSelect({ selected: dragSelection(order, d.base, d.anchor, v), lastAnchor: lastAnchorRef.current });
    };

    const onUp = () => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      if (!d.moved && !d.shift) {
        onSelect(clickSelection(order, d.pre, d.anchor, { meta: d.meta }, d.lastAnchor));
      } else {
        const sel = dragSelection(order, d.base, d.anchor, d.lastTarget);
        onSelect({ selected: sel, lastAnchor: sel.length ? d.anchor : null });
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
  }, [interactive, order, onSelect]);

  // ---- action-bar position ----------------------------------------------------------------
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
      setBarPos({
        left: Math.min(Math.max(r.left + 90, 140), window.innerWidth - 140),
        top: r.top,
      });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [interactive, selected]);

  // ---- verse rendering --------------------------------------------------------------------
  const verseClass = (v: ReaderVerse): string => {
    const sel = selectedSet.has(v.verseId);
    const lit = !sel && props.litVerseIds.has(v.verseId);
    const anchored = !sel && !lit && props.anchoredVerseIds.has(v.verseId);
    const flash = props.flashVerseId === v.verseId;
    return cn(
      'rounded-[3px] px-[0.06em] py-[0.02em] transition-colors',
      interactive && 'cursor-pointer hover:bg-lapis-wash',
      sel && 'bg-lapis-wash shadow-[inset_0_0_0_1px_var(--lapis-edge)]',
      lit && 'bg-lapis-wash shadow-[inset_0_0_0_1px_var(--lapis-edge)]',
      anchored && 'bg-lapis-wash',
      flash && 'animate-verse-flash',
    );
  };

  const VerseNo = ({ v }: { v: ReaderVerse }) => (
    <sup
      className={cn(
        'mr-0.5 select-none align-super font-mono text-[0.62em] font-medium',
        selectedSet.has(v.verseId) ? 'text-lapis' : 'text-ink-faint',
      )}
    >
      {v.number}
    </sup>
  );

  const DivideHandle = ({ band, verseId, block }: { band: ReaderBand; verseId: string; block?: boolean }) => {
    if (!interactive) return null;
    return (
      <button
        type="button"
        className={block ? 'qth-divide-block' : 'qth-divide'}
        aria-label={`Divide into a new section starting at ${verseRefLabel(verseId)}`}
        title={`Divide — new section from ${verseRefLabel(verseId)}`}
        onClick={() => props.onDivide(band.sectionId, verseId)}
      />
    );
  };

  const proseVerse = (band: ReaderBand, v: ReaderVerse, isBandStart: boolean) => {
    const handle = !isBandStart && <DivideHandle band={band} verseId={v.verseId} />;
    if (!v.present) {
      return (
        <span key={v.verseId}>
          {handle}
          <span className="text-ink-faint">
            <VerseNo v={v} />
            <span className="italic">—</span>{' '}
          </span>
        </span>
      );
    }
    return (
      <span key={v.verseId}>
        {handle}
        <span
          data-v={v.verseId}
          className={verseClass(v)}
          onMouseEnter={() => props.onVerseHover(v.verseId)}
          onMouseLeave={() => props.onVerseHover(null)}
        >
          {v.lines.map((line, i) => (
            <span key={i}>
              {line.indent >= 1 && i > 0 && <br />}
              {i === 0 && <VerseNo v={v} />}
              <span className={line.indent >= 1 ? INDENT[Math.min(line.indent, 3)] : undefined}>
                {line.frags.map((f, j) => (
                  <FragmentText key={j} text={f.text} wj={f.wj} />
                ))}
              </span>{' '}
            </span>
          ))}
        </span>{' '}
      </span>
    );
  };

  const poetryVerse = (band: ReaderBand, v: ReaderVerse, isBandStart: boolean) => (
    <div key={v.verseId}>
      {!isBandStart && <DivideHandle band={band} verseId={v.verseId} block />}
      {!v.present ? (
        <div className="text-ink-faint">
          <VerseNo v={v} />
          <span className="italic">—</span>
        </div>
      ) : (
        <div
          data-v={v.verseId}
          className={verseClass(v)}
          onMouseEnter={() => props.onVerseHover(v.verseId)}
          onMouseLeave={() => props.onVerseHover(null)}
        >
          {v.lines.map((line, i) => (
            <div key={i} className={INDENT[Math.min(line.indent, 3)]}>
              {i === 0 && <VerseNo v={v} />}
              {line.frags.map((f, j) => (
                <FragmentText key={j} text={f.text} wj={f.wj} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGroup = (band: ReaderBand, group: ReaderGroup, gi: number) => {
    const bandStart = band.startVerseId;
    switch (group.kind) {
      case 'prose':
        return (
          <p key={gi} className="mb-[1.05em] last:mb-0">
            {group.verses.map((v) => proseVerse(band, v, v.verseId === bandStart))}
          </p>
        );
      case 'poetry':
        return (
          <div key={gi} className="my-2 leading-relaxed">
            {group.verses.map((v) => poetryVerse(band, v, v.verseId === bandStart))}
          </div>
        );
      case 'super':
        return (
          <p key={gi} className="mb-1 text-center text-sm italic text-ink-soft">
            {group.text}
          </p>
        );
      case 'heading':
        return (
          <p
            key={gi}
            className={cn(
              'mb-1 mt-5 font-sans font-semibold uppercase tracking-wide text-ink-faint',
              group.level === 's1' ? 'text-xs' : 'text-[0.7rem]',
            )}
          >
            {group.text}
          </p>
        );
      case 'space':
        return <div key={gi} aria-hidden className="h-3" />;
    }
  };

  return (
    <>
      <article className="mx-auto w-full max-w-[46rem] rounded-leaf border border-line bg-leaf px-[clamp(28px,6vw,68px)] pb-[72px] pt-[52px] shadow-leaf">
        <header className="mb-[30px] flex items-baseline justify-between gap-4 border-b border-line pb-[18px]">
          <h1 className="font-scripture text-[30px] leading-tight text-ink">{props.leafTitle}</h1>
          <span className="font-mono text-[11px] tracking-[0.03em] text-ink-faint">{props.leafMeta}</span>
        </header>

        <div ref={containerRef} className="select-none font-scripture text-[1.32rem] leading-[1.72] text-ink">
          {model.bands.map((band) => (
            <section key={band.startVerseId}>
              <BandHeader
                band={band}
                interactive={interactive}
                onMerge={props.onMerge}
                onRename={props.onRename}
                onSelectRange={props.onSelectSectionRange}
              />
              {band.groups.map((g, gi) => renderGroup(band, g, gi))}
            </section>
          ))}
        </div>
      </article>

      {barPos && (
        <ActionBar
          label={formatVerseIds(selected)}
          style={{ left: barPos.left, top: barPos.top }}
          onMark={props.onMark}
        />
      )}
    </>
  );
}

function FragmentText({ text, wj }: { text: string; wj?: boolean }) {
  if (wj) return <span className="text-rubric">{text}</span>;
  return <>{text}</>;
}

function BandHeader({
  band,
  interactive,
  onMerge,
  onRename,
  onSelectRange,
}: {
  band: ReaderBand;
  interactive: boolean;
  onMerge: (sectionId: string) => void;
  onRename: (sectionId: string, name: string) => void;
  onSelectRange: (startVerseId: string, endVerseId: string) => void;
}) {
  return (
    <div className="mt-[26px] flex items-center gap-2.5 border-t border-line pt-3.5 first:mt-0 first:border-t-0 first:pt-0">
      {interactive ? (
        <input
          className="min-w-[12ch] flex-[0_1_auto] rounded-[5px] border-none bg-transparent px-1 py-0.5 font-sans text-[13px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink-faint hover:bg-lapis-wash focus:bg-lapis-wash"
          value={band.name}
          placeholder="Name this section"
          aria-label="Section name"
          onChange={(e) => onRename(band.sectionId, e.target.value)}
        />
      ) : (
        band.name && <span className="px-1 py-0.5 font-sans text-[13px] font-semibold text-ink">{band.name}</span>
      )}
      <button
        type="button"
        className="cursor-pointer font-mono text-[11px] text-ink-faint hover:text-lapis"
        title="Select these verses"
        onClick={() => onSelectRange(band.startVerseId, band.endVerseId)}
      >
        {band.ref}
      </button>
      <span className="flex-1" />
      {interactive && band.canMergeUp && (
        <button
          type="button"
          className="grid size-[22px] place-items-center rounded-[5px] text-[13px] leading-none text-ink-faint hover:bg-rubric-wash hover:text-rubric"
          title="Merge into the section above"
          aria-label="Merge up"
          onClick={() => onMerge(band.sectionId)}
        >
          ⌫
        </button>
      )}
    </div>
  );
}
