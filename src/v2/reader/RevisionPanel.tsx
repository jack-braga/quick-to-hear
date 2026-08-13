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
import { CardRevisions } from '@/v2/reader/CardRevisions';
import { formatVerseIds } from '@/v2/reader/selection';
import { makeRevision } from '@/v2/revisions';
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
const ROUND: Record<RevisionOrigin, { head: string; lede: React.ReactNode; addLabel: string }> = {
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
  },
};

/** The muted orientation line — where this card lives, and that its first pass is preserved. */
function orientLine(origin: AnnotationOrigin): string {
  const lens = LENSES.find((l) => l.id === origin);
  const label = ORIGIN_LABEL[origin];
  return lens ? `↳ ${label} · step ${lens.num} · first pass kept` : `↳ ${label} · first pass kept`;
}

export interface RevisionPanelProps {
  round: RevisionOrigin;
  /** Weigh supplies its own header + banner + Theme/Aim supersede above the cards, so it hides this
   *  panel's built-in header/lede and shows just the card list. */
  hideHeader?: boolean;
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
      {!props.hideHeader && (
        <>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{meta.head}</div>
          <p className="mb-3.5 text-[12.5px] leading-[1.5] text-ink-soft">{meta.lede}</p>
        </>
      )}

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

              {/* the unified revisions list — shared with Survey/Write/Build (read-only there) */}
              <CardRevisions
                a={a}
                editable
                onEditRevision={(revId, patch) => props.onEditRevision(a.id, revId, patch)}
                onRemoveRevision={(revId) => props.onRemoveRevision(a.id, revId)}
                footer={
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
                }
              />

              <div className="mt-2 font-mono text-[9px] text-ink-faint">{orientLine(annotationOrigin(a))}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
