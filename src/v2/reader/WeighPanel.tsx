import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { Annotation, Revision, ThemeAim, ThemeAimRevision } from '@/types/study';
import { RevisionPanel } from '@/v2/reader/RevisionPanel';
import { supersede } from '@/v2/revisions';

/**
 * The Weigh lens (07, round 2) panel (V2-UX-BACKLOG §7.2). It reuses {@link RevisionPanel} with
 * `round="weigh"` for the card append (a 📖-sourced commentary note on the same Survey/COMA cards),
 * and adds the one thing that isn't a card: the **Theme/Aim supersede**. Theme & Aim live on
 * `study.themeAim`; at Weigh their weighed revision becomes the primary version, the original is kept
 * but demoted to a muted "was · kept" line, and older versions fold into a `▾ N earlier` disclosure
 * (the compact history, via the pure {@link supersede}). A thin component; store writes do the work.
 */
export type ThemeField = 'theme' | 'aim';

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

const AMBER_TEXT = 'text-[#8a6a16] dark:text-[#e2c87c]';
const PRIMARY_INPUT =
  'w-full resize-none border-none bg-transparent p-0 font-scripture text-[13.5px] leading-[1.55] text-ink outline-none placeholder:font-sans placeholder:text-[12.5px] placeholder:text-ink-faint';

function SupersedeCard({
  label,
  step,
  original,
  revisions,
  onAdd,
  onEdit,
  onRemove,
}: {
  label: string;
  step: string;
  original: string;
  revisions: ThemeAimRevision[];
  onAdd: () => void;
  onEdit: (index: number, patch: Partial<ThemeAimRevision>) => void;
  onRemove: (index: number) => void;
}) {
  const [showEarlier, setShowEarlier] = useState(false);
  const view = supersede(original, revisions);
  const revised = revisions.length > 0;
  const lastIndex = revisions.length - 1;

  return (
    <div className="mb-3 rounded-lg border border-line bg-leaf p-[11px_13px]">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
          {label} · step {step}
        </span>
        {revised && (
          <span className={cn('rounded-[5px] border border-amber-edge bg-amber-wash px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em]', AMBER_TEXT)}>
            ★ revised leads
          </span>
        )}
      </div>

      {!revised ? (
        <>
          <p className="font-scripture text-[13px] leading-[1.5] text-ink">
            {original.trim() ? (
              original
            ) : (
              <span className="italic text-ink-faint">(not written yet — set it in Theme &amp; aim)</span>
            )}
          </p>
          <button
            type="button"
            onClick={onAdd}
            data-revise={label.toLowerCase()}
            className={cn('mt-2 rounded-md border border-dashed border-amber-edge px-2.5 py-1 font-mono text-[11px] hover:bg-amber-wash', AMBER_TEXT)}
          >
            ✎ revise in light of the commentary
          </button>
        </>
      ) : (
        <>
          <div className="rounded-md border-l-[3px] border-l-[#b98a1e] bg-amber-wash px-2.5 py-2">
            <div className="mb-1 flex items-center gap-2">
              <span className={cn('font-mono text-[8.5px] uppercase tracking-[0.1em]', AMBER_TEXT)}>
                ★ {label} · revised at Weigh · now primary
              </span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => onRemove(lastIndex)}
                aria-label="Undo this revision"
                className="text-ink-faint hover:text-rubric"
              >
                ✕
              </button>
            </div>
            <textarea
              ref={autoGrow}
              rows={2}
              data-weigh-primary={label.toLowerCase()}
              className={PRIMARY_INPUT}
              value={view.primary}
              placeholder={`Restate the ${label.toLowerCase()} in light of the commentary…`}
              onChange={(e) => {
                onEdit(lastIndex, { text: e.target.value });
                autoGrow(e.currentTarget);
              }}
            />
            <div className="mt-1 flex items-center gap-1 font-mono text-[9.5px] text-ink-faint">
              📖
              <input
                className="w-full border-none bg-transparent p-0 font-mono text-[9.5px] text-ink-soft outline-none placeholder:text-ink-faint"
                value={revisions[lastIndex]?.source ?? ''}
                placeholder="commentary + reference…"
                onChange={(e) => onEdit(lastIndex, { source: e.target.value })}
              />
            </div>
          </div>

          {view.was !== undefined && (
            <p className="mt-2 text-[11.5px] leading-[1.45] text-ink-faint">
              <span className="mr-1.5 font-mono text-[8.5px] uppercase tracking-[0.1em]">was · kept</span>
              {view.was.trim() ? view.was : '(nothing)'}
            </p>
          )}

          {view.earlier.length > 0 && (
            <div className="mt-1.5">
              <button
                type="button"
                onClick={() => setShowEarlier((v) => !v)}
                className="font-mono text-[9px] text-ink-faint hover:text-ink"
              >
                {showEarlier ? '▾' : '▸'} {view.earlier.length} earlier version{view.earlier.length > 1 ? 's' : ''}
              </button>
              {showEarlier && (
                <ul className="mt-1 flex flex-col gap-1 border-l-2 border-line pl-2.5">
                  {view.earlier.map((t, i) => (
                    <li key={i} className="text-[11px] leading-[1.4] text-ink-faint">
                      {t.trim() ? t : '(nothing)'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onAdd}
            className={cn('mt-2 rounded-md border border-dashed border-amber-edge px-2.5 py-1 font-mono text-[10.5px] hover:bg-amber-wash', AMBER_TEXT)}
          >
            ✎ revise again
          </button>
          <div className="mt-2 font-mono text-[9px] text-ink-faint">
            ↳ Theme &amp; aim · step {step} · original preserved, revised leads downstream
          </div>
        </>
      )}
    </div>
  );
}

export interface WeighPanelProps {
  themeAim: ThemeAim;
  onAddThemeRevision: (field: ThemeField) => void;
  onEditThemeRevision: (field: ThemeField, index: number, patch: Partial<ThemeAimRevision>) => void;
  onRemoveThemeRevision: (field: ThemeField, index: number) => void;
  // passthrough to the shared card-append panel (round = weigh)
  annotations: Annotation[];
  litVerseId: string | null;
  onHover: (a: Annotation | null) => void;
  onAddRevision: (cardId: string, rev: Revision) => void;
  onEditRevision: (cardId: string, revId: string, patch: Partial<Revision>) => void;
  onRemoveRevision: (cardId: string, revId: string) => void;
}

export function WeighPanel(props: WeighPanelProps) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        Weigh — round 2 · now with commentaries
      </div>
      <div className="mb-3 rounded-lg border border-amber-edge bg-amber-wash p-[10px_12px] text-[12px] leading-[1.5] text-ink">
        You’ve committed a <b>theme &amp; aim</b>. Now — and only now — open a commentary. Add a{' '}
        <b>📖 note</b> to the same cards; your first pass and own-work notes stay. <b>Theme &amp; Aim join
        here</b> — the weighed version leads.
      </div>

      <SupersedeCard
        label="Theme"
        step="06"
        original={props.themeAim.theme}
        revisions={props.themeAim.themeRevisions}
        onAdd={() => props.onAddThemeRevision('theme')}
        onEdit={(i, p) => props.onEditThemeRevision('theme', i, p)}
        onRemove={(i) => props.onRemoveThemeRevision('theme', i)}
      />
      <SupersedeCard
        label="Aim"
        step="06"
        original={props.themeAim.groupAim}
        revisions={props.themeAim.aimRevisions}
        onAdd={() => props.onAddThemeRevision('aim')}
        onEdit={(i, p) => props.onEditThemeRevision('aim', i, p)}
        onRemove={(i) => props.onRemoveThemeRevision('aim', i)}
      />

      <div className="mb-2 mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        Weigh your cards
      </div>
      <RevisionPanel
        round="weigh"
        hideHeader
        annotations={props.annotations}
        litVerseId={props.litVerseId}
        onHover={props.onHover}
        onAddRevision={props.onAddRevision}
        onEditRevision={props.onEditRevision}
        onRemoveRevision={props.onRemoveRevision}
      />
    </div>
  );
}
