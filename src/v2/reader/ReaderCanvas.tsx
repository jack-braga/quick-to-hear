import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { verseRefLabel } from '@/lib/map';
import { ActionBar, type ActionKind } from '@/v2/reader/ActionBar';
import type { AnnotationTone } from '@/v2/annotations';
import type { ReaderBand, ReaderGroup, ReaderModel, ReaderVerse } from '@/v2/reader/model';
import { clickSelection, dragSelection, formatVerseIds } from '@/v2/reader/selection';
import { useCallbackRef } from '@/v2/reader/useCallbackRef';
import { TONE } from '@/v2/tones';

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
  /** Resting tint per annotated verse (highest-priority tone wins). */
  anchorTone: Map<string, AnnotationTone>;
  /** Verses lit by a hovered margin card, in that card's tone. */
  lit: { ids: Set<string>; tone: AnnotationTone } | null;
  flashVerseId: string | null;
  focusSectionId: string | null;
  onSelect: (r: { selected: string[]; lastAnchor: string | null }) => void;
  onVerseHover: (verseId: string | null) => void;
  onDivide: (sectionId: string, boundaryVerseId: string) => void;
  onMerge: (sectionId: string) => void;
  onRename: (sectionId: string, name: string) => void;
  onSelectSectionRange: (startVerseId: string, endVerseId: string) => void;
  onSectionFocusHandled: () => void;
  onAction: (kind: ActionKind) => void;
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

  // Which verse the pointer is over — drives the divide affordances (shown only for the
  // hovered verse, before + after) as well as the two-way margin lighting.
  const [hoverVerse, setHoverVerse] = useState<string | null>(null);

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
  const hasPoetry = (v: ReaderVerse) => v.lines.some((l) => l.indent >= 1);

  // Highlight states, mutually exclusive so exactly one wins:
  //  - selected → lapis (blue) wash + edge; a neutral pick.
  //  - lit (a margin card is hovered) → that annotation's tone, with a bolder border.
  //  - anchored (rests with an annotation) → a faint tint in its highest-priority tone.
  const verseClass = (v: ReaderVerse, block: boolean): string => {
    const sel = selectedSet.has(v.verseId);
    const isLit = !sel && props.lit != null && props.lit.ids.has(v.verseId);
    const tone = props.anchorTone.get(v.verseId);
    const anchored = !sel && !isLit && tone != null;
    return cn(
      'rounded-[4px] transition-colors',
      block ? 'px-2 py-0.5' : 'px-[0.12em] py-[0.04em] [-webkit-box-decoration-break:clone] [box-decoration-break:clone]',
      interactive && 'cursor-pointer hover:bg-lapis-wash',
      sel && 'bg-lapis-wash shadow-[inset_0_0_0_1px_var(--lapis-edge)]',
      isLit && props.lit && TONE[props.lit.tone].ring,
      anchored && tone && TONE[tone].wash,
      props.flashVerseId === v.verseId && 'animate-verse-flash',
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

  const divideLabel = (boundary: string) => `Divide into a new section starting at ${verseRefLabel(boundary)}`;

  // Inline "＋" between two prose verses (shown only for the hovered verse). The button takes
  // zero layout width and the pill is absolutely overlaid, so revealing it never shifts the text.
  const DivideInline = ({ band, boundary }: { band: ReaderBand; boundary: string }) => (
    <button
      type="button"
      className="qth-divin"
      aria-label={divideLabel(boundary)}
      title={divideLabel(boundary)}
      onClick={() => props.onDivide(band.sectionId, boundary)}
    >
      <span>＋</span>
    </button>
  );

  // Full-width bar in the gap above/below a poetry verse (shown only for the hovered verse).
  const DivideBar = ({ band, boundary, where }: { band: ReaderBand; boundary: string; where: 'before' | 'after' }) => (
    <button
      type="button"
      className="qth-divbar"
      style={where === 'before' ? { top: -9 } : { bottom: -9 }}
      aria-label={divideLabel(boundary)}
      title={divideLabel(boundary)}
      onClick={() => props.onDivide(band.sectionId, boundary)}
    >
      <span>＋ divide here</span>
    </button>
  );

  const renderVerse = (band: ReaderBand, v: ReaderVerse, nextVerseId: string | null) => {
    const isBandStart = v.verseId === band.startVerseId;
    const hovered = interactive && hoverVerse === v.verseId;
    const showBefore = hovered && !isBandStart;
    const showAfter = hovered && !!nextVerseId;
    const enter = () => {
      if (interactive) setHoverVerse(v.verseId);
      props.onVerseHover(v.verseId);
    };
    const leave = () => {
      if (interactive) setHoverVerse((c) => (c === v.verseId ? null : c));
      props.onVerseHover(null);
    };

    if (!hasPoetry(v)) {
      // Prose verse — inline, flows in the paragraph; highlight wraps cleanly across lines.
      return (
        <span key={v.verseId} className="qth-verse" onMouseEnter={enter} onMouseLeave={leave}>
          {showBefore && <DivideInline band={band} boundary={v.verseId} />}
          {v.present ? (
            <span data-v={v.verseId} className={verseClass(v, false)}>
              <VerseNo v={v} />
              {v.lines[0]?.frags.map((f, j) => <FragmentText key={j} text={f.text} wj={f.wj} />)}
            </span>
          ) : (
            <span data-v={v.verseId} className="text-ink-faint">
              <VerseNo v={v} />
              <span className="italic">—</span>
            </span>
          )}
          {showAfter && nextVerseId && <DivideInline band={band} boundary={nextVerseId} />}{' '}
        </span>
      );
    }

    // Poetry verse — each line its own block row (wraps + hangs); highlight is one clean box.
    return (
      <div key={v.verseId} className="relative my-[3px]" onMouseEnter={enter} onMouseLeave={leave}>
        {showBefore && <DivideBar band={band} boundary={v.verseId} where="before" />}
        {v.present ? (
          <div data-v={v.verseId} className={verseClass(v, true)}>
            {v.lines.map((line, i) => (
              <div key={i} className={line.indent >= 1 ? INDENT[Math.min(line.indent, 3)] : undefined}>
                {i === 0 && <VerseNo v={v} />}
                {line.frags.map((f, j) => (
                  <FragmentText key={j} text={f.text} wj={f.wj} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div data-v={v.verseId} className="px-2 text-ink-faint">
            <VerseNo v={v} />
            <span className="italic">—</span>
          </div>
        )}
        {showAfter && nextVerseId && <DivideBar band={band} boundary={nextVerseId} where="after" />}
      </div>
    );
  };

  const renderGroup = (
    band: ReaderBand,
    group: ReaderGroup,
    gi: number,
    nextOf: (verseId: string) => string | null,
  ) => {
    switch (group.kind) {
      case 'prose':
        return (
          <div key={gi} className="mb-[1.05em] last:mb-0">
            {group.verses.map((v) => renderVerse(band, v, nextOf(v.verseId)))}
          </div>
        );
      case 'poetry':
        return (
          <div key={gi} className="my-3 leading-relaxed">
            {group.verses.map((v) => renderVerse(band, v, nextOf(v.verseId)))}
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
          {model.bands.map((band) => {
            // Verse order within this band, so a "divide after V" targets the next verse —
            // even across a paragraph/stanza boundary inside the same section.
            const bandVerseIds = band.groups.flatMap((g) =>
              g.kind === 'prose' || g.kind === 'poetry' ? g.verses.map((v) => v.verseId) : [],
            );
            const nextOf = (id: string): string | null => {
              const i = bandVerseIds.indexOf(id);
              return i >= 0 && i < bandVerseIds.length - 1 ? bandVerseIds[i + 1]! : null;
            };
            return (
              <section key={band.startVerseId}>
                <BandHeader
                  band={band}
                  interactive={interactive}
                  focusSectionId={props.focusSectionId}
                  onMerge={props.onMerge}
                  onRename={props.onRename}
                  onSelectRange={props.onSelectSectionRange}
                  onFocusHandled={props.onSectionFocusHandled}
                />
                {band.groups.map((g, gi) => renderGroup(band, g, gi, nextOf))}
              </section>
            );
          })}
        </div>
      </article>

      {barPos && (
        <ActionBar
          label={formatVerseIds(selected)}
          style={{ left: barPos.left, top: barPos.top }}
          onAction={props.onAction}
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
  focusSectionId,
  onMerge,
  onRename,
  onSelectRange,
  onFocusHandled,
}: {
  band: ReaderBand;
  interactive: boolean;
  focusSectionId: string | null;
  onMerge: (sectionId: string) => void;
  onRename: (sectionId: string, name: string) => void;
  onSelectRange: (startVerseId: string, endVerseId: string) => void;
  onFocusHandled: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // After a divide, focus the fresh section's name input so the user can name it straight away.
  useEffect(() => {
    if (focusSectionId && focusSectionId === band.sectionId) {
      inputRef.current?.focus();
      onFocusHandled();
    }
  }, [focusSectionId, band.sectionId, onFocusHandled]);

  return (
    <div className="mt-11 flex items-center gap-2.5 border-t border-line pt-4 first:mt-0 first:border-t-0 first:pt-0">
      {interactive ? (
        <input
          ref={inputRef}
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
