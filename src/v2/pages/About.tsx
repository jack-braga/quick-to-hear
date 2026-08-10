import ReactMarkdown from 'react-markdown';

import { helpEntry } from '@/lib/content';
import { DayNightToggle } from '@/v2/DayNightToggle';

/**
 * The v2 About / attribution page (v2.8) — renders the authored `attribution.page` content
 * (`content/help/global/attribution.page.md`, the `page` tier). It is the one place credit is
 * framed exactly: **only the COMA sets are verbatim** (by permission); everything else is the
 * tool's own, after the writers named (Inviolable rule 8 + the owner's "verbatim only for COMA"
 * rule). The prose lives in `content/`, so the credits can change without touching code.
 */
const PROSE =
  '[&_h2]:font-scripture [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mt-9 [&_h2]:mb-2 first:[&_h2]:mt-0 ' +
  '[&_h3]:font-mono [&_h3]:text-[10.5px] [&_h3]:uppercase [&_h3]:tracking-[0.12em] [&_h3]:text-lapis-ink [&_h3]:mt-6 [&_h3]:mb-1.5 ' +
  '[&_p]:text-[14px] [&_p]:leading-[1.6] [&_p]:text-ink-soft [&_p]:my-3 ' +
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:text-[13.5px] [&_li]:leading-[1.55] [&_li]:text-ink-soft [&_li]:mb-2 ' +
  '[&_strong]:font-semibold [&_strong]:text-ink [&_em]:italic [&_a]:text-lapis-ink [&_a]:underline';

export default function About() {
  const entry = helpEntry('attribution.page');
  const title = entry?.title || 'Attribution & further reading';
  const body = entry?.page ?? '';

  return (
    <div className="min-h-dvh bg-desk text-ink">
      <header className="flex h-14 items-center gap-5 border-b border-line bg-[color-mix(in_srgb,var(--desk)_82%,var(--leaf))] px-[22px]">
        <a href="#/" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint hover:text-ink">
          ← Quick&nbsp;to&nbsp;Hear
        </a>
        <span className="flex-1" />
        <DayNightToggle />
      </header>

      <main className="mx-auto w-full max-w-[46rem] px-6 py-12">
        <article className="rounded-leaf border border-line bg-leaf px-[clamp(24px,5vw,52px)] py-10 shadow-leaf">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">About</div>
          <h1 className="mt-1 font-scripture text-[27px] leading-tight text-ink">{title}</h1>
          <div className={`mt-6 ${PROSE}`}>
            {body ? (
              <ReactMarkdown>{body}</ReactMarkdown>
            ) : (
              <p className="text-[14px] text-ink-soft">Credits are being written.</p>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
