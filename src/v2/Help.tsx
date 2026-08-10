import { useEffect, useId, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { helpEntry } from '@/lib/content';
import { cn } from '@/lib/utils';

/**
 * Guidance at the moment of need (Inviolable rule 5), v2.8. A small **(i)** beside a field: click
 * it for the always-there inline `[I]` line, then **▾ Tell me more** for the fuller `[E]` reasoning
 * (and the `[X]` worked example once one is authored — it appears automatically). Click-away, Esc,
 * or ✕ closes it. Owner decision: everything teaching lives behind the (i) — no Full/Brief mode.
 *
 * The authored prose lives in `content/help/**` and is parsed by the reused `helpEntry`; this is a
 * thin, v2-styled surface over it. Renders **nothing** for a key with no inline prose yet, so it's
 * a safe drop-in anywhere.
 */

// Compact markdown: kill default paragraph margins, keep bold/italic tied to the ink colour.
const PROSE =
  'text-[12.5px] leading-[1.55] [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:font-semibold [&_strong]:text-ink [&_em]:text-ink [&_a]:text-lapis-ink [&_a]:underline';

export function Help({ helpKey, label, className }: { helpKey: string; label?: string; className?: string }) {
  const entry = helpEntry(helpKey);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const panelId = useId();

  // Position the popover in the viewport (fixed), clamped to the screen — it must escape the
  // margin panel's overflow clipping and never run off the right edge (owner bug).
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const b = btnRef.current;
      if (!b) return;
      const r = b.getBoundingClientRect();
      const width = Math.min(300, window.innerWidth - 24);
      const left = Math.min(Math.max(r.left - 6, 12), window.innerWidth - width - 12);
      setPos({ top: r.bottom + 6, left, width });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Only surface where there's authored inline prose (keeps the UI clean).
  if (!entry || entry.inline.length === 0) return null;

  const hasMore = entry.expandable.length > 0 || entry.example.length > 0;

  return (
    <span ref={rootRef} className={cn('relative inline-flex align-middle', className)}>
      <button
        ref={btnRef}
        type="button"
        aria-label={label ? `Guidance: ${label}` : 'Guidance'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((o) => !o);
          setMore(false);
        }}
        className="grid size-[15px] place-items-center rounded-full border border-lapis-edge bg-leaf font-mono text-[9.5px] normal-case leading-none tracking-normal text-lapis-ink hover:bg-lapis-wash"
      >
        i
      </button>

      {open && pos && (
        <div
          id={panelId}
          role="note"
          data-help={helpKey}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
          className="z-[60] rounded-lg border border-line bg-leaf p-3 text-left font-sans normal-case tracking-normal shadow-[0_2px_6px_rgba(30,27,20,0.08),0_20px_44px_-14px_rgba(30,27,20,0.34)]"
        >
          <div className={cn(PROSE, 'text-ink')}>
            <ReactMarkdown>{entry.inline}</ReactMarkdown>
          </div>

          {more && entry.expandable.length > 0 && (
            <div className={cn(PROSE, 'mt-2.5 border-t border-line pt-2.5 text-ink-soft')}>
              <ReactMarkdown>{entry.expandable}</ReactMarkdown>
            </div>
          )}
          {more && entry.example.length > 0 && (
            <div className="mt-2.5 border-t border-line pt-2.5">
              <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-faint">Worked example</div>
              <div className={cn(PROSE, 'text-ink-soft')}>
                <ReactMarkdown>{entry.example}</ReactMarkdown>
              </div>
            </div>
          )}

          <div className="mt-2.5 flex items-center gap-3 border-t border-line pt-2.5">
            {hasMore &&
              (more ? (
                <button type="button" onClick={() => setMore(false)} className="font-mono text-[11px] text-ink-faint hover:text-ink">
                  ▴ Less
                </button>
              ) : (
                <button type="button" onClick={() => setMore(true)} className="font-mono text-[11px] text-lapis-ink hover:underline">
                  ▾ Tell me more
                </button>
              ))}
            <span className="flex-1" />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close guidance" className="text-[12px] text-ink-faint hover:text-ink">
              ✕
            </button>
          </div>

          {entry.source && <p className="mt-2 text-[11px] italic leading-[1.5] text-ink-faint">{entry.source}</p>}
        </div>
      )}
    </span>
  );
}
