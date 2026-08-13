import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { Annotation, Revision, RevisionOrigin } from '@/types/study';
import { revisionsOf } from '@/v2/revisions';

/**
 * The unified **Deepen / Weigh revisions view** for a card — one component so the appended notes look
 * the same wherever the card appears. **Read-only by default** (Survey, Write, Build show them for
 * context — recycle-forward), and **editable** only when the Deepen/Weigh lens passes the handlers.
 * This is what closes the gap where deepened/weighed notes vanished outside their own lens. It renders
 * only the revisions list (+ an optional editing `footer` for the add button); the card body, first
 * pass, and orientation line stay with each panel.
 */
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

const REV_INPUT =
  'w-full resize-none border-none bg-transparent p-0 font-scripture text-[13px] leading-[1.55] text-ink outline-none placeholder:font-sans placeholder:text-[12.5px] placeholder:text-ink-faint';

const REV_PLACEHOLDER: Record<RevisionOrigin, string> = {
  deepen: 'What do you now see — from the text?',
  weigh: 'Did the commentary confirm it, or push back?',
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

export interface CardRevisionsProps {
  a: Annotation;
  /** Deepen/Weigh pass this to make the notes editable; elsewhere they render read-only. */
  editable?: boolean;
  onEditRevision?: (revId: string, patch: Partial<Revision>) => void;
  onRemoveRevision?: (revId: string) => void;
  /** The add-revision button (Deepen/Weigh only), rendered inside the list wrapper. */
  footer?: ReactNode;
}

export function CardRevisions({ a, editable = false, onEditRevision, onRemoveRevision, footer }: CardRevisionsProps) {
  const all = revisionsOf(a);
  // Read-only elsewhere shows only notes with content; the Deepen/Weigh editor shows every slot.
  const revs = editable ? all : all.filter((r) => r.text.trim());
  if (revs.length === 0 && !footer) return null;

  return (
    <div className="mt-2.5 flex flex-col gap-2.5 border-l-2 border-line pl-3">
      {revs.map((r) => {
        const acc = revAccent(r.origin);
        return (
          <div key={r.id} className={cn('group/rev rounded-md border-l-[3px] px-2.5 py-2', acc.border, acc.wash)}>
            <div className="mb-1 flex items-center gap-2">
              <span className={cn('font-mono text-[8.5px] uppercase tracking-[0.1em]', acc.label)}>{acc.tag}</span>
              <span className="flex-1" />
              {editable && (
                <button
                  type="button"
                  onClick={() => onRemoveRevision?.(r.id)}
                  aria-label="Remove this note"
                  className="text-ink-faint opacity-0 transition-opacity hover:text-rubric focus-visible:opacity-100 group-hover/rev:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>
            {editable ? (
              <textarea
                data-focus-rev={r.id}
                ref={autoGrow}
                rows={2}
                className={REV_INPUT}
                value={r.text}
                placeholder={REV_PLACEHOLDER[r.origin]}
                onChange={(e) => {
                  onEditRevision?.(r.id, { text: e.target.value });
                  autoGrow(e.currentTarget);
                }}
              />
            ) : (
              <p className="font-scripture text-[13px] leading-[1.55] text-ink">{r.text}</p>
            )}
            {r.origin === 'weigh' &&
              (editable ? (
                <div className="mt-1 flex items-center gap-1 font-mono text-[9.5px] text-ink-faint">
                  📖
                  <input
                    className="w-full border-none bg-transparent p-0 font-mono text-[9.5px] text-ink-soft outline-none placeholder:text-ink-faint"
                    value={r.source ?? ''}
                    placeholder="commentary + reference…"
                    onChange={(e) => onEditRevision?.(r.id, { source: e.target.value })}
                  />
                </div>
              ) : (
                r.source?.trim() && (
                  <div className="mt-1 font-mono text-[9.5px] text-ink-soft">📖 {r.source}</div>
                )
              ))}
          </div>
        );
      })}
      {footer}
    </div>
  );
}
