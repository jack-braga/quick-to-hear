import { formulaGroups, type FormulaGroups } from '@/lib/content';

/**
 * The question-formula library surfaced in the Questions lens (SPEC 6c / backlog §3). The ~20
 * scaffolded stems live in `content/method/formulas.yaml`, grouped by question type; picking one
 * seeds a new question with its stem (blanks marked `____`) so the leader fills it in — the tool
 * scaffolds, it never writes the question (Inviolable rule 1). Rendered inline in the panel (not an
 * overlay) so it can't clip; only formulas with an authored stem are offered.
 */
const GROUPS: { key: keyof FormulaGroups; label: string }[] = [
  { key: 'observation', label: 'Observation' },
  { key: 'meaning', label: 'Meaning' },
  { key: 'context', label: 'Context' },
  { key: 'application', label: 'Application' },
];

export function FormulaPicker({
  onPick,
  onClose,
}: {
  onPick: (stem: string) => void;
  onClose: () => void;
}) {
  const groups = formulaGroups();
  return (
    <div className="mx-1 mb-3 rounded-lg border border-line bg-[color-mix(in_srgb,var(--panel)_60%,var(--leaf))] p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          Start from a formula
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close formulas"
          className="text-[12px] text-ink-faint hover:text-ink"
        >
          ✕
        </button>
      </div>
      <div className="max-h-[280px] space-y-2.5 overflow-y-auto">
        {GROUPS.map(({ key, label }) => {
          const items = (groups[key] ?? []).filter((f) => f.stem.trim().length > 0);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.13em] text-lapis-ink">
                {label}
              </div>
              <div className="space-y-0.5">
                {items.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onPick(f.stem)}
                    title={f.stem}
                    className="block w-full rounded-md px-2 py-1 text-left hover:bg-lapis-wash"
                  >
                    <span className="text-[12.5px] font-semibold text-ink">{f.name}</span>
                    {f.explanation && (
                      <span className="mt-0.5 block text-[11px] leading-snug text-ink-soft">
                        {f.explanation}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
