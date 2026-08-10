import { readingTipForGenre } from '@/lib/content';
import { useStudyStore } from '@/store/study';
import type { Study } from '@/types/study';
import { Help } from '@/v2/Help';

/**
 * The Read lens margin (SPEC Phase 2) — the pray-and-read discipline the tool can enforce that
 * paper can't: read the passage slowly, prayerfully, and **more than once** before you analyse it.
 * A running count (`study.read.count`, tapped via the store's `incrementRead`) makes the discipline
 * concrete; a genre-specific reading tip nudges *how* to read. The passage stays the canvas.
 */
export function ReadPanel({ study }: { study: Study }) {
  const incrementRead = useStudyStore((s) => s.incrementRead);
  const count = study.read.count;
  const tip = readingTipForGenre(study.setup.genre).trim();

  return (
    <div>
      <div className="mx-1 mb-3.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        Pray &amp; read
        <Help helpKey="p2.read" label="Pray and read" />
      </div>

      <p className="mb-4 text-[13px] leading-[1.55] text-ink-soft">
        Before you analyse it, read the passage slowly and prayerfully — more than once. Let it speak
        before you work on it.
      </p>

      <div className="rounded-lg border border-line bg-panel/50 p-4 text-center">
        <div className="font-scripture text-[30px] leading-none text-ink">{count}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          {count === 1 ? 'time read' : 'times read'}
        </div>
        <button
          type="button"
          onClick={incrementRead}
          className="mt-3 w-full rounded-lg bg-lapis px-3 py-2 font-sans text-[13px] font-medium text-white hover:opacity-90 dark:text-[#10131a]"
        >
          ＋ I’ve read it
        </button>
      </div>

      {tip && (
        <div className="mt-4 rounded-lg border border-line p-3 text-[13px] leading-[1.5] text-ink-soft">
          <span className="font-semibold text-ink">Reading this genre: </span>
          {tip}
        </div>
      )}

      <p className="mt-4 text-[12px] leading-[1.55] text-ink-faint">
        Read it aloud once. Notice what repeats, what surprises, what you don’t understand — you’ll
        mark those in the next lens.
      </p>
    </div>
  );
}
