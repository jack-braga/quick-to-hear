import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { GuidanceToggle } from '@/components/GuidanceToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

// The seven phases (SPEC). All seven are built (Stage 7 completes M1).
const PHASES = [1, 2, 3, 4, 5, 6, 7] as const;
const BUILT_PHASES = new Set<number>([1, 2, 3, 4, 5, 6, 7]);

/** The phase circles, shared by the desktop (inline) and mobile (second-row) navs. */
function PhaseSteps() {
  const { pathname } = useLocation();
  const m = /^\/study\/([^/]+)(?:\/(\d+))?/.exec(pathname);
  const studyId = m?.[1];
  const activePhase = m?.[2] ? Number(m[2]) : studyId ? 1 : 0;

  return (
    <>
      {PHASES.map((n) => {
        const active = n === activePhase;
        const enabled = Boolean(studyId) && BUILT_PHASES.has(n);
        const base =
          'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition-colors';
        if (enabled) {
          return (
            <Link
              key={n}
              to={`/study/${studyId}/${n}`}
              aria-current={active ? 'step' : undefined}
              className={cn(
                base,
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:bg-accent',
              )}
            >
              {n}
            </Link>
          );
        }
        return (
          <span
            key={n}
            aria-disabled="true"
            title={studyId ? 'This phase arrives in a later build stage' : 'Open a study to begin'}
            className={cn(base, 'border-border text-muted-foreground/60')}
          >
            {n}
          </span>
        );
      })}
    </>
  );
}

/**
 * The persistent phase stepper. Interactive once a study is open (path `/study/:id/N`);
 * otherwise a quiet placeholder so the header still reads as a workbook.
 *
 * On phones in portrait the header row has no room for seven circles, so the stepper drops
 * to a **second, full-width header row** below `sm` (the desktop copy is `hidden … sm:flex`).
 * Exactly one of the two `<nav>` copies is ever `display:flex`; the other is `display:none`
 * and so absent from the accessibility tree — no duplicate landmark. (Fixes the carried
 * "phase-nav hidden in portrait" defect.)
 */
function PhaseNav({ className }: { className?: string }) {
  return (
    <nav aria-label="Study phases" className={className}>
      <PhaseSteps />
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
          <PhaseNav className="hidden items-center gap-1 sm:flex" />
          <GuidanceToggle />
          <ThemeToggle />
        </div>
        {/* Portrait phones: the stepper gets its own row so progress stays visible (SPEC §4). */}
        <div className="border-t border-border/60 sm:hidden">
          <PhaseNav className="mx-auto flex w-full max-w-5xl items-center justify-center gap-1.5 px-4 py-2" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4 text-xs text-muted-foreground">
          <span>
            Runs entirely in your browser — no account, nothing sent to a server. Export your work
            often; it lives only in this browser.
          </span>
          <Link
            to="/attribution"
            className="shrink-0 underline underline-offset-2 hover:text-foreground"
          >
            Attribution &amp; credits
          </Link>
        </div>
      </footer>
    </div>
  );
}
