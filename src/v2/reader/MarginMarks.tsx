import { useEffect, useMemo } from 'react';

import { compareVerseIds } from '@/lib/verse/ids';
import { cn } from '@/lib/utils';
import { allVerses, verseText, type ParsedText } from '@/types/passage';
import type { Mark } from '@/types/study';
import { formatVerseIds } from '@/v2/reader/selection';

/**
 * The right-margin annotation cards (v2.2). They show the persisted **marks** (SPEC Phase 3b)
 * anchored to their verses, each with an **editable note** — "what confuses you here? (they'll
 * feel it too)" — plus two-way hover linking (driven from the page), a jump-to-verse anchor, and
 * delete. A freshly-created mark's note is auto-focused so the user can type straight away. The
 * verse text sits above the note as quiet context. Note / Question / Cross-reference cards join
 * here in the annotation layer (v2.4).
 */
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export function MarginMarks({
  passage,
  marks,
  litMarkVerseId,
  focusMarkId,
  onHoverMark,
  onEditMark,
  onRemove,
  onJump,
  onFocusHandled,
}: {
  passage: ParsedText;
  marks: Mark[];
  litMarkVerseId: string | null;
  focusMarkId: string | null;
  onHoverMark: (verseIds: string[] | null) => void;
  onEditMark: (id: string, note: string) => void;
  onRemove: (id: string) => void;
  onJump: (verseId: string) => void;
  onFocusHandled: () => void;
}) {
  const byId = useMemo(() => new Map(allVerses(passage).map((v) => [v.verseId, v])), [passage]);
  const shown = useMemo(
    () => marks.filter((m) => byId.has(m.verseId)).sort((a, b) => compareVerseIds(a.verseId, b.verseId)),
    [marks, byId],
  );

  // Focus a just-created mark's note once, then clear the request.
  useEffect(() => {
    if (!focusMarkId) return;
    const el = document.querySelector<HTMLTextAreaElement>(`textarea[data-mark="${CSS.escape(focusMarkId)}"]`);
    el?.focus();
    onFocusHandled();
  }, [focusMarkId, onFocusHandled, shown.length]);

  return (
    <div>
      <div className="mx-1 mb-3.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        <span>In the margin</span>
        <span>{shown.length}</span>
      </div>

      {shown.map((m) => {
        const verseIds = m.verseIds ?? [m.verseId];
        const lit = litMarkVerseId != null && verseIds.includes(litMarkVerseId);
        const context = verseIds
          .map((id) => byId.get(id))
          .filter((v): v is NonNullable<typeof v> => !!v && v.present)
          .map((v) => verseText(v))
          .join(' ');
        return (
          <div
            key={m.id}
            onMouseEnter={() => onHoverMark(verseIds)}
            onMouseLeave={() => onHoverMark(null)}
            className={cn(
              'group mb-3 rounded-lg border border-line border-l-[3px] border-l-rubric bg-leaf p-[11px_13px] transition-all',
              lit && '-translate-x-[3px] border-lapis bg-lapis-wash shadow-[0_0_0_2px_var(--lapis),0_8px_20px_-8px_rgba(40,70,138,0.4)]',
            )}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onJump(verseIds[0]!)}
                title="Jump to these verses"
                className="rounded-[5px] bg-lapis-wash px-1.5 py-0.5 font-mono text-[11px] text-lapis-ink hover:underline"
              >
                {formatVerseIds(verseIds)}
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
            <p className="mb-1.5 line-clamp-2 font-scripture text-[12.5px] italic leading-snug text-ink-faint">
              “{context}”
            </p>
            <textarea
              data-mark={m.id}
              ref={autoGrow}
              rows={2}
              value={m.note ?? ''}
              placeholder="What confuses you here? (they’ll feel it too)"
              onChange={(e) => {
                onEditMark(m.id, e.target.value);
                autoGrow(e.currentTarget);
              }}
              className="w-full resize-none border-none bg-transparent p-0 font-sans text-[13.5px] leading-[1.5] text-ink outline-none placeholder:text-ink-faint"
            />
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
