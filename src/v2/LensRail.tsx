import { cn } from '@/lib/utils';
import { LENSES, type LensId } from '@/v2/lenses';
import { LensIcon } from '@/v2/LensIcon';

/**
 * The bottom **lens rail** (flow-redesign, owner-confirmed "Option B"): the step icons moved out of
 * the header into the footer, where they double as the progress indicator, flanked by `← prev` and
 * `Next →`. The `/` quick-jump palette trigger lives in the **header top-right** (its keyboard shortcut
 * still works everywhere), so the footer is pure phase navigation. Clicking any step jumps to it. The
 * prev/next labels are `whitespace-nowrap` with equal-width flanks, so the footer height stays constant
 * and the icon rail stays centred whatever the neighbouring lens name is.
 */
export function LensRail({
  lens,
  onLens,
}: {
  lens: LensId;
  onLens: (id: LensId) => void;
}) {
  const i = LENSES.findIndex((l) => l.id === lens);
  const prev = i > 0 ? LENSES[i - 1] : null;
  const next = i < LENSES.length - 1 ? LENSES[i + 1] : null;

  return (
    <footer className="flex items-center gap-2 border-t border-line bg-[color-mix(in_srgb,var(--desk)_82%,var(--leaf))] px-3 py-2">
      <div className="hidden shrink-0 sm:block sm:w-[168px]">
        {prev && (
          <button
            type="button"
            onClick={() => onLens(prev.id)}
            className="truncate font-mono text-[11px] text-ink-faint hover:text-ink"
          >
            ← {prev.name}
          </button>
        )}
      </div>

      <nav aria-label="Study phases" className="flex flex-1 flex-wrap items-center justify-center gap-0.5">
        {LENSES.map((l, idx) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onLens(l.id)}
            aria-current={l.id === lens ? 'step' : undefined}
            aria-label={`${l.num} ${l.name}`}
            className={cn(
              'group relative grid size-9 place-items-center rounded-lg border border-transparent',
              l.id === lens
                ? 'border-lapis-edge bg-lapis-wash text-lapis-ink'
                : idx < i
                  ? 'text-ink-soft hover:bg-panel hover:text-ink'
                  : 'text-ink-faint hover:bg-panel hover:text-ink',
            )}
          >
            <LensIcon id={l.id} size={20} />
            <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-leaf px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink opacity-0 shadow-leaf transition-opacity group-hover:opacity-100">
              {l.num} · {l.name}
            </span>
          </button>
        ))}
      </nav>

      <div className="flex w-[116px] shrink-0 justify-end sm:w-[168px]">
        {next && (
          <button
            type="button"
            onClick={() => onLens(next.id)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-lapis px-3 py-1.5 text-[12.5px] font-medium text-white dark:text-[#16181d]"
          >
            <span className="hidden sm:inline">Next:&nbsp;</span>
            {next.name}
            <span className="font-mono text-[10px] opacity-80">→</span>
          </button>
        )}
      </div>
    </footer>
  );
}
