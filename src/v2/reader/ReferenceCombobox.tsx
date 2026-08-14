import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { parseReference, type ParsedReference } from '@/lib/verse';
import { cn } from '@/lib/utils';
import { bookHits, numHits, referenceSuggest } from '@/v2/reader/referenceSuggest';

/**
 * The shared reference picker (V2-UX-BACKLOG §7.4) — an input with the **same book→chapter→verse
 * autocomplete** the `@`-mention editor has, so attaching a reference to a question is guided rather
 * than free-typed. Pick a book → a versification-aware chapter grid → a verse; or type a full
 * reference and press Enter. The dropdown is `position: fixed` so the scrollable margin panel can't
 * clip it. Logic lives in the pure {@link referenceSuggest}.
 */
export function ReferenceCombobox({
  onSelect,
  onCancel,
}: {
  onSelect: (ref: ParsedReference) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [rect, setRect] = useState<{ top: number; bottom: number; left: number } | null>(null);

  const suggest = useMemo(() => referenceSuggest(value), [value]);
  const books = useMemo(() => (suggest?.mode === 'book' ? bookHits(suggest.query) : []), [suggest]);
  const nums = useMemo(() => numHits(suggest), [suggest]);
  const count = suggest?.mode === 'book' ? books.length : nums.length;
  const active = Math.min(idx, Math.max(0, count - 1));

  useLayoutEffect(() => {
    const r = inputRef.current?.getBoundingClientRect();
    if (r) setRect({ top: r.top, bottom: r.bottom, left: r.left });
  }, [value]);

  const change = (v: string) => {
    setValue(v);
    setIdx(0);
  };
  const commit = (v: string) => {
    const ref = parseReference(v.trim());
    if (ref) onSelect(ref);
  };
  const pickBook = (name: string) => change(`${name} `);
  const pickNum = (n: number) => {
    if (suggest?.mode === 'chapter') change(`${suggest.book} ${n}:`);
    else if (suggest?.mode === 'verse') commit(`${suggest.book} ${suggest.chapter}:${n}`);
  };
  const pickActive = () => {
    // A typed-out verse ("…4:5" / "…4:5-6") is accepted as-is; otherwise Enter advances the picker.
    if (/:\s*\d/.test(value)) {
      commit(value);
    } else if (suggest?.mode === 'verse') {
      if (nums[active] != null) pickNum(nums[active]!);
    } else if (suggest?.mode === 'chapter') {
      const typed = /\s(\d+)\s*$/.exec(value); // a chapter number the user typed
      const ch = typed ? Number(typed[1]) : nums[active];
      if (ch != null) change(`${suggest.book} ${ch}:`);
    } else if (suggest?.mode === 'book' && books[active]) {
      pickBook(books[active]!.name);
    } else {
      commit(value);
    }
  };

  // Below the input by default; flip above when it would overflow the viewport bottom.
  const estH = suggest?.mode === 'book' ? Math.min(count * 32 + 8, 200) : 130;
  const flip = rect ? rect.bottom + 4 + estH > window.innerHeight - 8 : false;

  // Combobox ARIA (§4.1/§4.2): the input owns the listbox; the active option is referenced by id.
  const open = !!(rect && suggest && count > 0);
  const listboxId = 'refcombo-listbox';
  const optId = (i: number) => `refcombo-opt-${i}`;

  return (
    <>
      <input
        ref={inputRef}
        autoFocus
        value={value}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open ? optId(active) : undefined}
        onChange={(e) => change(e.target.value)}
        onBlur={() => window.setTimeout(onCancel, 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIdx((i) => Math.min(count - 1, i + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIdx((i) => Math.max(0, i - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            pickActive();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        placeholder="Type a book…"
        aria-label="Reference"
        className="w-40 rounded-md border border-lapis-edge bg-panel px-2 py-1 font-mono text-[10px] text-ink outline-none"
      />
      {rect && suggest && count > 0 && (
        <div
          role="listbox"
          id={listboxId}
          aria-label="Reference suggestions"
          data-testid="ref-suggest"
          data-mode={suggest.mode}
          style={{
            position: 'fixed',
            left: Math.min(rect.left, window.innerWidth - 188),
            top: flip ? undefined : rect.bottom + 4,
            bottom: flip ? window.innerHeight - rect.top + 4 : undefined,
            width: 176,
          }}
          className="z-[60] max-h-[200px] overflow-y-auto rounded-lg border border-line bg-leaf shadow-[0_2px_6px_rgba(30,27,20,0.08),0_20px_44px_-14px_rgba(30,27,20,0.34)]"
        >
          {suggest.mode === 'book' ? (
            <div className="py-1">
              {books.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  role="option"
                  id={optId(i)}
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => pickBook(b.name)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left font-sans text-[12.5px] text-ink',
                    i === active && 'bg-lapis-wash',
                  )}
                >
                  <span className="text-ink-faint">📖</span>
                  {b.name}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="border-b border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-faint">
                {suggest.mode === 'chapter' ? 'Pick a chapter' : 'Pick a verse'}
              </div>
              <div className="flex flex-wrap gap-1 p-1.5">
                {nums.map((n, i) => (
                  <button
                    key={n}
                    type="button"
                    role="option"
                    id={optId(i)}
                    aria-selected={i === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => pickNum(n)}
                    className={cn(
                      'min-w-[28px] rounded-md px-1.5 py-1 text-center font-mono text-[11px]',
                      i === active ? 'bg-lapis text-white dark:text-[#16181d]' : 'text-ink-soft hover:bg-lapis-wash',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
