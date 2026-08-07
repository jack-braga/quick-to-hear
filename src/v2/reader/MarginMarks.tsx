import { useMemo } from 'react';

import { resolvedMarkText, verseRefLabel } from '@/lib/map';
import { compareVerseIds } from '@/lib/verse/ids';
import { cn } from '@/lib/utils';
import { allVerses, type ParsedText } from '@/types/passage';
import type { Mark } from '@/types/study';

/**
 * The right-margin annotation cards (v2.2). For this slice they show the persisted **marks**
 * (SPEC Phase 3b) anchored to their verses, with two-way hover linking (hovering a card lights
 * its verses; hovering a verse lights its cards — driven from the page), a jump-to-verse
 * anchor, and delete. Note / Question / Cross-reference cards join here in the annotation
 * layer (v2.4). Each mark's confusing-red left border matches its verse's action.
 */
export function MarginMarks({
  passage,
  marks,
  litMarkVerseId,
  onHoverMark,
  onRemove,
  onJump,
}: {
  passage: ParsedText;
  marks: Mark[];
  litMarkVerseId: string | null;
  onHoverMark: (verseIds: string[] | null) => void;
  onRemove: (id: string) => void;
  onJump: (verseId: string) => void;
}) {
  const byId = useMemo(() => new Map(allVerses(passage).map((v) => [v.verseId, v])), [passage]);
  const shown = useMemo(
    () => marks.filter((m) => byId.has(m.verseId)).sort((a, b) => compareVerseIds(a.verseId, b.verseId)),
    [marks, byId],
  );

  return (
    <div>
      <div className="mx-1 mb-3.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        <span>In the margin</span>
        <span>{shown.length}</span>
      </div>

      {shown.map((m) => {
        const lit = litMarkVerseId === m.verseId;
        return (
          <div
            key={m.id}
            onMouseEnter={() => onHoverMark([m.verseId])}
            onMouseLeave={() => onHoverMark(null)}
            className={cn(
              'group mb-3 rounded-lg border border-line border-l-[3px] border-l-rubric bg-leaf p-[11px_13px] transition-all',
              lit && '-translate-x-[3px] border-lapis bg-lapis-wash shadow-[0_0_0_2px_var(--lapis),0_8px_20px_-8px_rgba(40,70,138,0.4)]',
            )}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onJump(m.verseId)}
                title="Jump to these verses"
                className="rounded-[5px] bg-lapis-wash px-1.5 py-0.5 font-mono text-[11px] text-lapis-ink hover:underline"
              >
                {verseRefLabel(m.verseId)}
              </button>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
                Mark · confusing
              </span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                aria-label="Remove this mark"
                className="text-ink-faint opacity-0 transition-opacity hover:text-rubric focus-visible:opacity-100 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
            <p className="font-scripture text-[13.5px] leading-[1.5] text-ink">
              {m.kind === 'verse' ? '' : '“'}
              {resolvedMarkText(m, byId.get(m.verseId))}
              {m.kind === 'verse' ? '' : '”'}
            </p>
          </div>
        );
      })}

      <div className="rounded-lg border border-dashed border-line p-3.5 text-[13px] leading-[1.55] text-ink-soft">
        Select any verses in the text, then <b className="font-semibold text-ink">Mark confusing</b> — or
        hover the space between two verses to <b className="font-semibold text-ink">divide</b> the passage
        into sections.
      </div>
    </div>
  );
}
