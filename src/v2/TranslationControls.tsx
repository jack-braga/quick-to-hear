import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import type { ReadingMode } from '@/v2/reader/ReaderCanvas';

/**
 * The header **Aa Text** menu (v2.9 shell) — one place for every text option: the reading **mode**
 * (Formatted ↔ Manuscript) and the **translations**, unified into a single list where **✓ = view**
 * and **★ = main**. Ticking two or more shows them side by side (parallel — no separate switch);
 * the ★ one is the primary, where notes anchor. Supports any number of parallel columns. Pure
 * presentation over the parent's state; the passage/alignment logic lives in the store + libs.
 */

export interface TranslationInfo {
  id: string;
  name: string;
  shortName: string;
  isPrimary: boolean;
  isViewed: boolean;
}

export interface TranslationControlsProps {
  mode: ReadingMode;
  onModeChange: (mode: ReadingMode) => void;
  /** Loaded translations, in display order (primary first). */
  translations: TranslationInfo[];
  /** Bundled translations not yet loaded (offered under "＋ Add"). */
  available: { id: string; name: string; shortName: string }[];
  onSetPrimary: (id: string) => void;
  onToggleView: (id: string) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TranslationControls(props: TranslationControlsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const viewedCount = props.translations.filter((t) => t.isViewed).length;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(
          'inline-flex h-[30px] items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[12px]',
          open ? 'border-lapis-edge text-ink' : 'border-line bg-panel text-ink-soft hover:border-lapis-edge hover:text-ink',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Aa Text <span className="text-[9px] opacity-70">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[38px] z-50 w-[268px] rounded-[12px] border border-line bg-leaf p-3 shadow-[0_2px_6px_rgba(30,27,20,0.08),0_22px_48px_-16px_rgba(30,27,20,0.34)]"
        >
          {/* reading mode */}
          <div className="mb-3">
            <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-faint">Reading mode</div>
            <div className="flex gap-0.5 rounded-md border border-line bg-panel p-0.5">
              {(['formatted', 'manuscript'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => props.onModeChange(m)}
                  aria-pressed={props.mode === m}
                  className={cn(
                    'flex-1 rounded-[5px] px-2 py-1 font-mono text-[11px] capitalize',
                    props.mode === m ? 'bg-lapis text-white dark:text-[#16181d]' : 'text-ink-faint hover:text-ink',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* translations — ✓ view · ★ main */}
          <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-faint">
            Translations — ✓ view · ★ main
          </div>
          {props.translations.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-[7px] px-1 py-1 hover:bg-lapis-wash">
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={t.isViewed}
                disabled={t.isPrimary}
                title={t.isPrimary ? 'The main translation is always shown' : t.isViewed ? 'Hide' : 'Show alongside'}
                onClick={() => props.onToggleView(t.id)}
                className={cn(
                  'grid size-[16px] place-items-center rounded border text-[10px]',
                  t.isViewed ? 'border-lapis bg-lapis text-white dark:text-[#16181d]' : 'border-lapis-edge text-transparent',
                )}
              >
                ✓
              </button>
              <span className={cn('flex-1 truncate font-sans text-[13px]', t.isPrimary ? 'font-semibold text-lapis-ink' : 'text-ink')}>
                {t.name}
              </span>
              <button
                type="button"
                aria-label={t.isPrimary ? `${t.shortName} is the main translation` : `Make ${t.shortName} the main translation`}
                aria-pressed={t.isPrimary}
                title={t.isPrimary ? 'Main translation' : 'Make main'}
                onClick={() => props.onSetPrimary(t.id)}
                className={cn('px-0.5 text-[14px]', t.isPrimary ? 'text-[#b98a1e] dark:text-[#e2c877]' : 'text-ink-faint hover:text-ink')}
              >
                {t.isPrimary ? '★' : '☆'}
              </button>
              {!t.isPrimary && (
                <button
                  type="button"
                  aria-label={`Remove ${t.shortName}`}
                  title={`Remove ${t.shortName}`}
                  onClick={() => props.onRemove(t.id)}
                  className="px-0.5 text-[12px] text-ink-faint hover:text-rubric"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {props.available.length > 0 && <div className="my-1.5 mx-1 h-px bg-line" />}
          {props.available.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => props.onAdd(t.id)}
              className="flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-left font-mono text-[12px] text-lapis-ink hover:bg-lapis-wash"
            >
              ＋ Add {t.name} <span className="ml-auto text-ink-faint">{t.shortName}</span>
            </button>
          ))}
          <div className="mt-2 px-1 font-mono text-[9.5px] leading-[1.45] text-ink-faint">
            {viewedCount >= 2 ? `${viewedCount} shown side by side` : 'Tick 2+ to read in parallel'}
          </div>
        </div>
      )}
    </div>
  );
}
