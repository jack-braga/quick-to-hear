import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

/**
 * The wrapper for the v2 printable documents (v2.7). It:
 *  - forces a **white** page independent of the day/night theme (strips `.dark` while mounted),
 *    so the printout is always ink-safe;
 *  - hosts the on-screen toolbar (Back · an **Ink-saver / Colour** toggle · Print) which is hidden
 *    from the printout itself (`.no-print`);
 *  - lets the user choose **per print** whether to render the lapis accent or pure monochrome —
 *    the choice flips `.ink-saver` on `.qth-doc` (preview and print match) and is remembered.
 *
 * White background never changes; the toggle only affects the accent (verse numbers, rules).
 */
const KEY = 'qth2/ink-saver';

function loadInkSaver(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0'; // default: ink-saver ON
  } catch {
    return true;
  }
}

export function PrintShell({
  backTo,
  toolbarNote,
  children,
}: {
  backTo: string;
  toolbarNote: string;
  children: ReactNode;
}) {
  const [inkSaver, setInkSaver] = useState(loadInkSaver);

  // Force light while the print page is mounted (restore on unmount), like v1's print shell.
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains('dark');
    html.classList.remove('dark');
    html.classList.add('light');
    const prev = html.style.colorScheme;
    html.style.colorScheme = 'light';
    return () => {
      if (wasDark) {
        html.classList.add('dark');
        html.classList.remove('light');
      }
      html.style.colorScheme = prev;
    };
  }, []);

  const toggle = () =>
    setInkSaver((v) => {
      const next = !v;
      try {
        localStorage.setItem(KEY, next ? '1' : '0');
      } catch {
        /* ignored — the choice just won't persist */
      }
      return next;
    });

  return (
    <div className={cn('qth-doc', inkSaver && 'ink-saver')}>
      <div className="no-print mb-6 flex items-center justify-between gap-4 font-sans text-[color:var(--doc-ink)]">
        <Link to={backTo} className="text-sm text-[color:var(--doc-soft)] underline underline-offset-2">
          ← Back to the study
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-[color:var(--doc-soft)] sm:inline">{toolbarNote}</span>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={inkSaver}
            title="Ink-saver prints monochrome (no colour ink); turn off for the lapis accent"
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-medium',
              inkSaver
                ? 'border-[color:var(--doc-ink)] bg-[color:var(--doc-ink)] text-white'
                : 'border-[color:var(--doc-rule)] text-[color:var(--doc-soft)]',
            )}
          >
            {inkSaver ? '● Ink-saver' : '○ Ink-saver'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            data-testid="print-button"
            className="rounded-md bg-[#28468a] px-3 py-1 text-xs font-medium text-white"
          >
            Print / Save PDF
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
