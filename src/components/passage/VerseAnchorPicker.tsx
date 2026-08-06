import { passageIsMultiChapter, verseChipLabel, verseRefLabel } from '@/lib/map';
import { compareVerseIds } from '@/lib/verse/ids';
import { cn } from '@/lib/utils';
import { allVerses, type ParsedText } from '@/types/passage';
import type { VerseAnchor } from '@/types/study';

/**
 * The reusable verse picker (PLAN §4.3, Stage 3). Its output is a {@link VerseAnchor}
 * (`{ verseIds }`, canonically sorted) — the same primitive used by Phase-3 verse marks,
 * Phase-4 anchored notes, and Phase-6 question anchors, so it's built once and reused.
 *
 * It renders one toggle per verse in the loaded passage. `multiple` (default) lets the
 * user build a set; single-select keeps at most one. Gap verses (`present:false`) are
 * shown but disabled by default (`presentOnly`) — you can't anchor to a verse with no
 * text. Selection never depends on text offsets, only IDs, so it survives edits.
 */
export interface VerseAnchorPickerProps {
  passage: ParsedText;
  value: VerseAnchor;
  onChange: (next: VerseAnchor) => void;
  /** Allow selecting many verses (default) vs at most one. */
  multiple?: boolean;
  /** Disable gap verses so they can't be anchored (default true). */
  presentOnly?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function VerseAnchorPicker({
  passage,
  value,
  onChange,
  multiple = true,
  presentOnly = true,
  className,
  'aria-label': ariaLabel = 'Choose verses',
}: VerseAnchorPickerProps) {
  const verses = allVerses(passage);
  const multiChapter = passageIsMultiChapter(passage);
  const selected = new Set(value.verseIds);

  const toggle = (verseId: string) => {
    let nextIds: string[];
    if (selected.has(verseId)) {
      nextIds = value.verseIds.filter((id) => id !== verseId);
    } else if (multiple) {
      nextIds = [...value.verseIds, verseId];
    } else {
      nextIds = [verseId];
    }
    onChange({ verseIds: [...nextIds].sort(compareVerseIds) });
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('flex flex-wrap gap-1.5', className)}
      data-testid="verse-anchor-picker"
    >
      {verses.map((v) => {
        const isSelected = selected.has(v.verseId);
        const disabled = presentOnly && !v.present;
        return (
          <button
            key={v.verseId}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={isSelected}
            aria-label={verseRefLabel(v.verseId)}
            disabled={disabled}
            title={disabled ? `${verseRefLabel(v.verseId)} — no text in this translation` : verseRefLabel(v.verseId)}
            onClick={() => toggle(v.verseId)}
            data-verse={v.verseId}
            data-selected={isSelected || undefined}
            className={cn(
              'inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm font-medium tabular-nums transition-colors',
              disabled && 'cursor-not-allowed border-dashed border-border text-muted-foreground/50',
              !disabled && isSelected && 'border-primary bg-primary text-primary-foreground',
              !disabled &&
                !isSelected &&
                'border-border text-foreground hover:border-primary/60 hover:bg-accent',
            )}
          >
            {verseChipLabel(v.verseId, multiChapter)}
          </button>
        );
      })}
    </div>
  );
}
