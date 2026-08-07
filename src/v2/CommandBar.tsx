/**
 * The bottom command bar (v2.1 shell). The universal `/` command *palette* — references,
 * inserts, jumps, actions — is the v2.3 slice; here the bar is present so the shell reads
 * complete and signals the primitive. The affordance is disabled until v2.3 wires it.
 */
export function CommandBar() {
  return (
    <footer className="flex h-[46px] items-center gap-3.5 border-t border-line bg-[color-mix(in_srgb,var(--desk)_82%,var(--leaf))] px-5">
      <span className="flex items-center gap-2 text-[12.5px] text-ink-soft">
        <span className="grid size-[22px] place-items-center rounded-md bg-lapis font-mono text-[13px] font-semibold text-white dark:text-[#10131a]">
          /
        </span>
        Type to reference a passage, insert a support text, or jump.
      </span>
      <button
        type="button"
        disabled
        title="The / command palette arrives in v2.3"
        className="ml-auto cursor-not-allowed rounded-[7px] border border-line bg-panel px-2.5 py-[5px] font-mono text-[12px] text-ink-faint"
      >
        / reference…
      </button>
    </footer>
  );
}
