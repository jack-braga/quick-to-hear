/**
 * The bottom command bar (v2.1 shell). It opens the `/` quick-jump palette (v2.3, slimmed per #7):
 * jump to a verse or a reference in the passage. `/` anywhere in the reader opens it too (unless
 * you're typing in a field).
 */
export function CommandBar({ onOpen }: { onOpen: () => void }) {
  return (
    <footer className="flex h-[46px] items-center gap-3.5 border-t border-line bg-[color-mix(in_srgb,var(--desk)_82%,var(--leaf))] px-5">
      <button type="button" onClick={onOpen} className="flex items-center gap-2 text-[12.5px] text-ink-soft hover:text-ink">
        <span className="grid size-[22px] place-items-center rounded-md bg-lapis font-mono text-[13px] font-semibold text-white dark:text-[#10131a]">
          /
        </span>
        Jump to a verse or reference in the passage.
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="ml-auto rounded-[7px] border border-line bg-panel px-2.5 py-[5px] font-mono text-[12px] text-ink-soft hover:border-lapis-edge hover:text-ink"
      >
        / command…
      </button>
    </footer>
  );
}
