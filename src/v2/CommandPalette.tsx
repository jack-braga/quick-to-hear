import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { buildPaletteItems, type PaletteAction, type PaletteContext } from '@/v2/reader/paletteItems';

/**
 * The `/` quick-jump palette (v2.3, **slimmed** per owner decision #7). Type a verse number (`:20`)
 * or a reference already in the passage (`Luke 1:8`) to scroll there — nothing else (translation /
 * lens / create commands moved to their own UI). Keyboard-first: `↑ ↓` move, `↵` runs, `esc` closes.
 * The load-bearing parsing lives in the pure `paletteItems.ts`; this is a thin dialog over it.
 */
export function CommandPalette({
  open,
  onClose,
  ctx,
  onAction,
}: {
  open: boolean;
  onClose: () => void;
  ctx: PaletteContext;
  onAction: (action: PaletteAction) => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Modal focus trap + Esc (§4.3): keep Tab inside the dialog, and close on Esc even when focus has
  // moved onto a result row (the input's own handler covers Esc only while the input is focused).
  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'input, button, [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const items = useMemo(() => buildPaletteItems(query, ctx), [query, ctx]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIdx(0);
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => setActiveIdx(0), [query]);

  if (!open) return null;

  const mode = /^:?\s*\d/.test(query.trim()) ? 'jump' : /\d/.test(query) ? 'reference' : 'jump';

  const choose = (i: number) => {
    const it = items[i];
    if (!it) return;
    if (it.action.type === 'fill') {
      setQuery(it.action.text);
      inputRef.current?.focus();
      return;
    }
    onAction(it.action);
    onClose();
  };

  // Group consecutive items by section for the rendered headers.
  const groups: { section: string; items: { it: (typeof items)[number]; i: number }[] }[] = [];
  items.forEach((it, i) => {
    const last = groups[groups.length - 1];
    if (last && last.section === it.section) last.items.push({ it, i });
    else groups.push({ section: it.section, items: [{ it, i }] });
  });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-[rgba(20,18,14,0.34)] pt-[14vh] backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={onDialogKeyDown}
        className="w-[min(560px,92vw)] overflow-hidden rounded-[14px] border border-line bg-leaf shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-[18px] py-[15px]">
          <span className="font-mono text-[16px] font-bold text-lapis">/</span>
          <input
            ref={inputRef}
            className="flex-1 border-none bg-transparent font-mono text-[15px] text-ink outline-none placeholder:text-ink-faint"
            placeholder="jump to a verse or reference…  e.g. :20 or Luke 1:8"
            value={query}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIdx((n) => (items.length ? (n + 1) % items.length : 0));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIdx((n) => (items.length ? (n - 1 + items.length) % items.length : 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                choose(activeIdx);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">{mode}</span>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-1.5">
          {groups.length === 0 && (
            <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              {query.trim()
                ? 'No verse to jump to — try :20 or a reference in this passage'
                : 'Type a verse number (:20) or a reference in this passage'}
            </div>
          )}
          {groups.map((g) => (
            <div key={g.section}>
              <div className="px-3 pb-1.5 pt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {g.section}
              </div>
              {g.items.map(({ it, i }) => (
                <button
                  key={it.id}
                  type="button"
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => choose(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[9px] px-3 py-2 text-left',
                    i === activeIdx && 'bg-lapis-wash',
                  )}
                >
                  <span className="w-6 text-center text-[14px] text-ink-soft">{it.icon}</span>
                  <span className="text-[14px] text-ink">{it.label}</span>
                  {it.sub && <span className="ml-auto font-mono text-[11px] text-ink-faint">{it.sub}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-line px-4 py-2 font-mono text-[11px] text-ink-faint">
          <span>
            <span className="text-ink-soft">↑ ↓</span> move
          </span>
          <span>
            <span className="text-ink-soft">↵</span> run
          </span>
          <span>
            <span className="text-ink-soft">esc</span> close
          </span>
        </div>
      </div>
    </div>
  );
}
