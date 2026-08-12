import { useEffect, useMemo, useState } from 'react';

import { newId } from '@/lib/id';
import { cn } from '@/lib/utils';
import type { Annotation, AnnotationOrigin, Revision, RevisionOrigin } from '@/types/study';
import {
  ORIGIN_LABEL,
  annotationMeta,
  annotationOrigin,
  floatingAnnotations,
  sortAnchored,
  toneFor,
} from '@/v2/annotations';
import { LENSES } from '@/v2/lenses';
import { formatVerseIds } from '@/v2/reader/selection';
import { makeRevision, revisionsOf } from '@/v2/revisions';
import { TONE } from '@/v2/tones';

/**
 * The shared **Deepen / Weigh** append panel (V2-UX-BACKLOG §7.2). Both rounds are the *same*
 * activity — revisit the understanding cards (Survey + COMA) and **append a revision, never
 * overwrite**. The first pass is always kept; each card grows one unified revisions list, and every
 * revision carries its own `origin`:
 *  - **Deepen** (round 1) = your own work, from the text — no commentaries, no source.
 *  - **Weigh** (round 2) = the same list, now with a 📖 book source per revision.
 * Deepen/Weigh never create a card; they only add revisions. (Weigh's Theme/Aim supersede is a
 * separate surface — it isn't a card.) A thin component; the store writes + pure helpers do the work.
 */
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

const REV_INPUT =
  'w-full resize-none border-none bg-transparent p-0 font-scripture text-[13px] leading-[1.55] text-ink outline-none placeholder:font-sans placeholder:text-[12.5px] placeholder:text-ink-faint';

const ROUND: Record<
  RevisionOrigin,
  { head: string; lede: React.ReactNode; addLabel: string; placeholder: string }
> = {
  deepen: {
    head: 'Deepen — round 1 · your own work',
    lede: (
      <>
        Revisit <b className="text-ink">Survey</b> and <b className="text-ink">COMA</b>: answer what you
        marked confusing and add what you now see — <b className="text-ink">from the text first</b>. Your
        first pass stays; you append to a revisions list. <i>No commentaries yet.</i>
      </>
    ),
    addLabel: '＋ add a note',
    placeholder: 'What do you now see — from the text?',
  },
  weigh: {
    head: 'Weigh — round 2 · now with commentaries',
    lede: (
      <>
        Now open a commentary. Add a <b className="text-ink">📖 note</b> to these same cards — the first
        pass and your own work stay. Reserve <b className="text-ink">substantive</b> commentary work for
        here; light look-ups belong back in Survey.
      </>
    ),
    addLabel: '＋ add a commentary note',
    placeholder: 'Did the commentary confirm it, or push back?',
  },
};

/** Accent + label per revision round — Deepen own-work reads moss, Weigh commentary reads amber. */
function revAccent(origin: RevisionOrigin) {
  return origin === 'deepen'
    ? { border: 'border-l-moss', wash: 'bg-moss-wash', label: 'text-moss-ink', tag: '✚ What I now see · from the text' }
    : {
        border: 'border-l-[#b98a1e]',
        wash: 'bg-amber-wash',
        label: 'text-[#8a6a16] dark:text-[#e2c87c]',
        tag: '⚖ From a commentary',
      };
}

/** The muted orientation line — where this card lives, and that its first pass is preserved. */
function orientLine(origin: AnnotationOrigin): string {
  const lens = LENSES.find((l) => l.id === origin);
  const label = ORIGIN_LABEL[origin];
  return lens ? `↳ ${label} · step ${lens.num} · first pass kept` : `↳ ${label} · first pass kept`;
}

export interface RevisionPanelProps {
  round: RevisionOrigin;
  annotations: Annotation[];
  litVerseId: string | null;
  onHover: (a: Annotation | null) => void;
  /** Append a fully-formed revision (id supplied by the panel so it can focus the new field). */
  onAddRevision: (cardId: string, rev: Revision) => void;
  onEditRevision: (cardId: string, revId: string, patch: Partial<Revision>) => void;
  onRemoveRevision: (cardId: string, revId: string) => void;
}

export function RevisionPanel(props: RevisionPanelProps) {
  const { round, annotations, litVerseId } = props;
  const [focusRevId, setFocusRevId] = useState<string | null>(null);

  // Deepen/Weigh revisit the *understanding* cards — Survey (map) + COMA — never questions/study-notes
  // (those don't exist yet at these steps, and aren't the point). Anchored by verse, then floating.
  const cards = useMemo(() => {
    const prep = annotations.filter((a) => {
      const o = annotationOrigin(a);
      return o === 'map' || o === 'coma';
    });
    return [...sortAnchored(prep), ...floatingAnnotations(prep)];
  }, [annotations]);

  // Focus a just-added revision's field once, then clear the request.
  useEffect(() => {
    if (!focusRevId) return;
    const el = document.querySelector<HTMLTextAreaElement>(`[data-focus-rev="${CSS.escape(focusRevId)}"]`);
    el?.focus();
    setFocusRevId(null);
  }, [focusRevId, annotations]);

  const add = (cardId: string) => {
    const rev = makeRevision(newId(), round);
    props.onAddRevision(cardId, rev);
    setFocusRevId(rev.id);
  };

  const meta = ROUND[round];

  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{meta.head}</div>
      <p className="mb-3.5 text-[12.5px] leading-[1.5] text-ink-soft">{meta.lede}</p>

      {cards.length === 0 ? (
        <div className="mb-4 rounded-lg border border-dashed border-line p-3.5 text-[13px] leading-[1.55] text-ink-soft">
          Nothing to {round === 'deepen' ? 'deepen' : 'weigh'} yet. Mark what confuses you in{' '}
          <b className="font-semibold text-ink">Survey</b> and answer{' '}
          <b className="font-semibold text-ink">COMA</b> prompts first — then come back here to add what
          you now see.
        </div>
      ) : (
        cards.map((a) => {
          const tone = toneFor(a);
          const m = annotationMeta(a);
          const lit = litVerseId != null && a.verseIds.includes(litVerseId);
          const anchored = a.verseIds.length > 0;
          const revs = revisionsOf(a);
          return (
            <div
              key={a.id}
              onMouseEnter={() => props.onHover(a)}
              onMouseLeave={() => props.onHover(null)}
              className={cn(
                'mb-3 rounded-lg border border-line border-l-[3px] bg-leaf p-[11px_13px] transition-all',
                TONE[tone].borderL,
                lit && TONE[tone].cardLit,
              )}
            >
              <div className="mb-1.5 flex items-center gap-2">
                {anchored ? (
                  <span className="rounded-[5px] bg-lapis-wash px-1.5 py-0.5 font-mono text-[11px] text-lapis-ink">
                    {formatVerseIds(a.verseIds)}
                  </span>
                ) : (
                  <span className="rounded-[5px] border border-dashed border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-faint">
                    — unanchored
                  </span>
                )}
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">{m.tag}</span>
              </div>

              {/* first pass — the original, kept read-only (you never overwrite it) */}
              <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-faint">First pass</div>
              <p className="font-scripture text-[13px] leading-[1.5] text-ink">
                {a.text.trim() ? a.text : <span className="italic text-ink-faint">(nothing written)</span>}
              </p>

              {/* the unified revisions list — Deepen own-work + Weigh commentary in one list */}
              <div className="mt-2.5 flex flex-col gap-2.5 border-l-2 border-line pl-3">
                {revs.map((r) => {
                  const acc = revAccent(r.origin);
                  return (
                    <div key={r.id} className={cn('group/rev rounded-md border-l-[3px] px-2.5 py-2', acc.border, acc.wash)}>
                      <div className="mb-1 flex items-center gap-2">
                        <span className={cn('font-mono text-[8.5px] uppercase tracking-[0.1em]', acc.label)}>{acc.tag}</span>
                        <span className="flex-1" />
                        <button
                          type="button"
                          onClick={() => props.onRemoveRevision(a.id, r.id)}
                          aria-label="Remove this note"
                          className="text-ink-faint opacity-0 transition-opacity hover:text-rubric focus-visible:opacity-100 group-hover/rev:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                      <textarea
                        data-focus-rev={r.id}
                        ref={autoGrow}
                        rows={2}
                        className={REV_INPUT}
                        value={r.text}
                        placeholder={ROUND[r.origin].placeholder}
                        onChange={(e) => {
                          props.onEditRevision(a.id, r.id, { text: e.target.value });
                          autoGrow(e.currentTarget);
                        }}
                      />
                      {r.origin === 'weigh' && (
                        <div className="mt-1 flex items-center gap-1 font-mono text-[9.5px] text-ink-faint">
                          📖
                          <input
                            className="w-full border-none bg-transparent p-0 font-mono text-[9.5px] text-ink-soft outline-none placeholder:text-ink-faint"
                            value={r.source ?? ''}
                            placeholder="commentary + reference…"
                            onChange={(e) => props.onEditRevision(a.id, r.id, { source: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => add(a.id)}
                  className={cn(
                    'self-start rounded-md border border-dashed px-2.5 py-1 font-mono text-[11px]',
                    round === 'deepen'
                      ? 'border-moss-edge text-moss-ink hover:bg-moss-wash'
                      : 'border-amber-edge text-[#8a6a16] hover:bg-amber-wash dark:text-[#e2c87c]',
                  )}
                >
                  {meta.addLabel}
                </button>
              </div>

              <div className="mt-2 font-mono text-[9px] text-ink-faint">{orientLine(annotationOrigin(a))}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
