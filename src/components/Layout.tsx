import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { ThemeToggle } from '@/components/ThemeToggle';

// Placeholder for the persistent phase progress bar (SPEC's seven phases). The
// stepper becomes interactive in Stage 1+ once a study exists; here it just shows
// the intended structure so the shell reads as a workbook, not a blank page.
const PHASES = ['1', '2', '3', '4', '5', '6', '7'];

function PhaseNavPlaceholder() {
  return (
    <nav aria-label="Study phases (placeholder)" className="hidden items-center gap-1 sm:flex">
      {PHASES.map((n) => (
        <span
          key={n}
          aria-disabled="true"
          title="Phase navigation appears once a study is open"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground/70"
        >
          {n}
        </span>
      ))}
    </nav>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
          <Link to="/" className="flex items-baseline gap-2 font-semibold tracking-tight">
            <span>Quick to Hear</span>
            <span className="hidden text-xs font-normal text-muted-foreground md:inline">
              Bible study workbook
            </span>
          </Link>
          <div className="flex-1" />
          <PhaseNavPlaceholder />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 text-xs text-muted-foreground">
          Runs entirely in your browser — no account, nothing sent to a server. Export your work
          often; it lives only in this browser.
        </div>
      </footer>
    </div>
  );
}
