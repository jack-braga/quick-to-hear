import type { CSSProperties } from 'react';

/**
 * The floating action bar over a live verse selection (ROADMAP-v2 §2). It anchors work to the
 * **main passage**: a **Note**, a **Question** (the deliverable — keeps the expected-answer hard
 * block), or a **Mark confusing** (a note flagged confusing). A reference to *another* passage is
 * not an action here — you type an `@Malachi 4:5-6` mention inside a note (two gestures, not three).
 */
export type ActionKind = 'note' | 'ask' | 'mark';

const ACTIONS: { kind: ActionKind; glyph: string; label: string }[] = [
  { kind: 'mark', glyph: '⚑', label: 'Mark confusing' },
  { kind: 'note', glyph: '✎', label: 'Note' },
  { kind: 'ask', glyph: '?', label: 'Question' },
];

export function ActionBar({
  label,
  style,
  onAction,
}: {
  label: string;
  style: CSSProperties;
  onAction: (kind: ActionKind) => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Do something with the selected verses"
      style={style}
      className="fixed z-40 flex -translate-x-1/2 -translate-y-3 items-center gap-0.5 rounded-[10px] bg-ink p-1 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] dark:border dark:border-[#2c2f36]"
    >
      <span className="whitespace-nowrap px-2 pl-1.5 font-mono text-[11px] text-[#cfc9bd]">{label}</span>
      <span className="mx-0.5 h-[18px] w-px bg-white/15" />
      {ACTIONS.map((a) => (
        <button
          key={a.kind}
          type="button"
          onClick={() => onAction(a.kind)}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] text-[#efe9dd] transition-colors hover:bg-white/10"
        >
          <span className="text-[13px] opacity-85">{a.glyph}</span>
          {a.label}
        </button>
      ))}
    </div>
  );
}
