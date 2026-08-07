import type { CSSProperties } from 'react';

/**
 * The floating action bar shown over a live verse selection (ROADMAP-v2 §2). v2.2 wires
 * **⚑ Mark confusing** — it persists a whole-verse mark per selected verse (SPEC Phase 3b).
 * Note / Question / Cross-reference are shown but disabled: they belong to the annotation
 * layer (v2.4), which restructures the note model — wiring them into the v1 schema now would
 * only create migration debt. The four-kind bar is the locked interaction shape.
 */

const DEFERRED = [
  { glyph: '✎', label: 'Note' },
  { glyph: '?', label: 'Question' },
  { glyph: '↗', label: 'Cross-reference' },
] as const;

export function ActionBar({
  label,
  style,
  onMark,
}: {
  label: string;
  style: CSSProperties;
  onMark: () => void;
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
      <button
        type="button"
        onClick={onMark}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] text-[#efe9dd] transition-colors hover:bg-white/10"
      >
        <span className="text-[13px] opacity-85">⚑</span>Mark confusing
      </button>
      {DEFERRED.map((d) => (
        <button
          key={d.label}
          type="button"
          disabled
          title={`${d.label} arrives in the annotation layer (v2.4)`}
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] text-[#efe9dd] opacity-40"
        >
          <span className="text-[13px] opacity-85">{d.glyph}</span>
          {d.label}
        </button>
      ))}
    </div>
  );
}
