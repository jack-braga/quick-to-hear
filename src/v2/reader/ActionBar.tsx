import type { CSSProperties } from 'react';

/**
 * The floating action bar over a live verse selection (ROADMAP-v2 §2). It anchors work to the
 * **main passage**: a **Comment**, a **Question** (the deliverable — keeps the expected-answer hard
 * block), or a **Confusion** (a comment flagged confusing). Labels are the card-type nouns, so they
 * match the card tags and the panel "＋" buttons exactly. A reference to *another* passage is not an
 * action here — you type an `@Malachi 4:5-6` mention inside a comment (two gestures, not three).
 */
export type ActionKind = 'note' | 'ask' | 'mark';

const ACTION_META: Record<ActionKind, { glyph: string; label: string }> = {
  mark: { glyph: '⚑', label: 'Confusion' },
  note: { glyph: '✎', label: 'Comment' },
  ask: { glyph: '?', label: 'Question' },
};

/** Default set + order when a lens doesn't specify its own. */
const DEFAULT_KINDS: ActionKind[] = ['mark', 'note', 'ask'];

export function ActionBar({
  label,
  style,
  onAction,
  kinds = DEFAULT_KINDS,
}: {
  label: string;
  style: CSSProperties;
  onAction: (kind: ActionKind) => void;
  /** Which actions to offer, **in display order** (the lens decides — e.g. Map omits `ask`, and
   *  Questions leads with it). */
  kinds?: ActionKind[];
}) {
  return (
    <div
      role="toolbar"
      aria-label="Do something with the selected verses"
      style={style}
      className="fixed z-40 flex -translate-x-1/2 -translate-y-3 items-center gap-0.5 rounded-[10px] bg-[#221f1a] p-1 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] dark:border dark:border-[#3c414c]"
    >
      <span className="whitespace-nowrap px-2 pl-1.5 font-mono text-[11px] text-[#cfc9bd]">{label}</span>
      <span className="mx-0.5 h-[18px] w-px bg-white/15" />
      {kinds.map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => onAction(kind)}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] text-[#efe9dd] transition-colors hover:bg-white/10"
        >
          <span className="text-[13px] opacity-85">{ACTION_META[kind].glyph}</span>
          {ACTION_META[kind].label}
        </button>
      ))}
    </div>
  );
}
