import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * The top-bar translation controls (v2.9) — a **switcher** menu (change the primary, add another
 * bundled translation, remove a comparison one) and a **⊕ Parallel** toggle that pops the
 * side-by-side view. The primary is the study's source of truth (its change persists); parallel
 * on/off + which secondary are transient reading state. Pure presentation over the parent's data
 * and handlers — the alignment/passage logic lives in the store + libs.
 */

export interface TranslationInfo {
  id: string;
  name: string;
  shortName: string;
  isPrimary: boolean;
}

export interface TranslationControlsProps {
  translations: TranslationInfo[];
  /** Bundled translations not yet loaded (offered under "＋ Add"). */
  available: { id: string; name: string; shortName: string }[];
  parallelOn: boolean;
  /** The effective secondary shown in parallel (a loaded, non-primary id), or null. */
  secondaryId: string | null;
  onSwitchPrimary: (id: string) => void;
  onAddTranslation: (id: string) => void;
  onRemoveTranslation: (id: string) => void;
  onToggleParallel: () => void;
  onPickSecondary: (id: string) => void;
}

type OpenMenu = 'switch' | 'secondary' | null;

const CHIP =
  'inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 font-mono text-[12px] text-ink-soft hover:border-lapis-edge hover:text-ink';

export function TranslationControls(props: TranslationControlsProps) {
  const [open, setOpen] = useState<OpenMenu>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const primary = props.translations.find((t) => t.isPrimary);
  const secondaries = props.translations.filter((t) => !t.isPrimary);
  const canParallel = props.translations.length >= 2;
  const secondaryShort = props.translations.find((t) => t.id === props.secondaryId)?.shortName;

  return (
    <div ref={rootRef} className="flex items-center gap-2">
      {/* ---- primary switcher ---- */}
      <div className="relative">
        <button
          type="button"
          className={CHIP}
          aria-haspopup="menu"
          aria-expanded={open === 'switch'}
          onClick={() => setOpen((o) => (o === 'switch' ? null : 'switch'))}
        >
          {primary?.shortName ?? '—'} <span className="text-[9px] opacity-70">▾</span>
        </button>
        {open === 'switch' && (
          <div
            role="menu"
            className="absolute left-0 top-[36px] z-50 w-[236px] rounded-[10px] border border-line bg-leaf p-1.5 shadow-[0_2px_6px_rgba(30,27,20,0.08),0_22px_48px_-16px_rgba(30,27,20,0.34)]"
          >
            {props.translations.map((t) => (
              <div key={t.id} className="flex items-center gap-1">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={t.isPrimary}
                  disabled={t.isPrimary}
                  onClick={() => {
                    props.onSwitchPrimary(t.id);
                    setOpen(null);
                  }}
                  className={cn(
                    'flex flex-1 items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left font-sans text-[13px] text-ink',
                    t.isPrimary ? 'font-semibold text-lapis-ink' : 'hover:bg-lapis-wash',
                  )}
                >
                  <span className="w-3 text-lapis">{t.isPrimary ? '✓' : ''}</span>
                  <span className="flex-1 truncate">{t.name}</span>
                  <span className="font-mono text-[11px] text-ink-faint">{t.shortName}</span>
                </button>
                {!t.isPrimary && (
                  <button
                    type="button"
                    aria-label={`Remove ${t.shortName}`}
                    title={`Remove ${t.shortName}`}
                    onClick={() => props.onRemoveTranslation(t.id)}
                    className="mr-0.5 rounded px-1 text-[12px] text-ink-faint hover:text-rubric"
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
                onClick={() => {
                  props.onAddTranslation(t.id);
                  setOpen(null);
                }}
                className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left font-mono text-[12px] text-lapis-ink hover:bg-lapis-wash"
              >
                ＋ Add {t.name} <span className="ml-auto text-ink-faint">{t.shortName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---- parallel toggle ---- */}
      {canParallel && (
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={props.onToggleParallel}
            aria-pressed={props.parallelOn}
            title={props.parallelOn ? 'Turn off the parallel column' : 'Show a second translation side by side'}
            className={cn(
              'inline-flex h-[30px] items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[12px]',
              props.parallelOn
                ? 'border-lapis-edge bg-lapis-wash text-lapis-ink'
                : 'border-line bg-panel text-ink-soft hover:border-lapis-edge hover:text-ink',
            )}
          >
            ⊕ Parallel{props.parallelOn && secondaryShort ? `: ${secondaryShort}` : ''}
          </button>
          {/* pick which secondary when more than one is available (e.g. pasted extras) */}
          {props.parallelOn && secondaries.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Choose the parallel translation"
                onClick={() => setOpen((o) => (o === 'secondary' ? null : 'secondary'))}
                className="ml-1 rounded-md border border-line bg-panel px-1.5 py-1 font-mono text-[9px] text-ink-soft hover:text-ink"
              >
                ▾
              </button>
              {open === 'secondary' && (
                <div
                  role="menu"
                  className="absolute right-0 top-[36px] z-50 w-[200px] rounded-[10px] border border-line bg-leaf p-1.5 shadow-[0_2px_6px_rgba(30,27,20,0.08),0_22px_48px_-16px_rgba(30,27,20,0.34)]"
                >
                  {secondaries.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        props.onPickSecondary(t.id);
                        setOpen(null);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left font-sans text-[13px] text-ink hover:bg-lapis-wash',
                        t.id === props.secondaryId && 'font-semibold text-lapis-ink',
                      )}
                    >
                      <span className="w-3 text-lapis">{t.id === props.secondaryId ? '✓' : ''}</span>
                      <span className="flex-1 truncate">{t.name}</span>
                      <span className="font-mono text-[11px] text-ink-faint">{t.shortName}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
