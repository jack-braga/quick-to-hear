// Rendered wherever a help key or method-data field is empty. Teaching prose is
// authored separately (see docs/TEACHING-TEXT.md); the build never blocks on it —
// it shows this instead. Do not put real guidance here.
export function GuidancePlaceholder({ helpKey }: { helpKey?: string }) {
  return (
    <p
      role="note"
      data-guidance-placeholder
      className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs italic text-muted-foreground"
    >
      Guidance to be written{helpKey ? ` (${helpKey})` : ''}.
    </p>
  );
}
