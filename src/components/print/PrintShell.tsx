import { useEffect, type ReactNode } from 'react';
import { Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

/**
 * The wrapper for the print-CSS routes (PLAN §4.8). It:
 * - forces a LIGHT palette (via the `.qth-print` scope in index.css) so the printout is
 *   ink-safe regardless of the user's theme, and strips `.dark` from <html> while mounted
 *   (restoring it on unmount) so reused components' `dark:` variants don't leak;
 * - shows a small on-screen toolbar (a Back link + Print/Save-PDF) that is hidden from the
 *   printout itself (`.no-print`).
 */
export function PrintShell({
  backTo,
  toolbarNote,
  children,
}: {
  backTo: string;
  toolbarNote: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains('dark');
    html.classList.remove('dark');
    html.classList.add('light');
    const prevColorScheme = html.style.colorScheme;
    html.style.colorScheme = 'light';
    return () => {
      if (wasDark) {
        html.classList.add('dark');
        html.classList.remove('light');
      }
      html.style.colorScheme = prevColorScheme;
    };
  }, []);

  return (
    <div className="qth-print font-serif text-[1.02rem] leading-relaxed">
      <div className="no-print mb-6 flex items-center justify-between gap-4 font-sans">
        <Link to={backTo} className="text-sm text-muted-foreground underline underline-offset-2">
          ← Back to the study
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">{toolbarNote}</span>
          <Button size="sm" onClick={() => window.print()} data-testid="print-button">
            <Printer aria-hidden />
            Print / Save PDF
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
