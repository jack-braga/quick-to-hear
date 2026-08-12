/**
 * The phases (SPEC) reframed as **lenses over one canvas** (ROADMAP-v2 §1): switching lens changes
 * what you do to the text and what overlays it; the text stays put. The flow redesign
 * (V2-UX-BACKLOG §7) makes this **ten** lenses: **Deepen** (round 1, after COMA) and **Weigh**
 * (round 2, after Theme & aim) are new; **Survey** was "Map" and **Write** was "Questions" (display
 * renames — the internal ids `map`/`questions` stay stable so stored studies still resolve).
 */

export const LENSES = [
  { id: 'setup', num: '01', name: 'Set up' },
  { id: 'read', num: '02', name: 'Read' },
  { id: 'map', num: '03', name: 'Survey' },
  { id: 'coma', num: '04', name: 'COMA' },
  { id: 'deepen', num: '05', name: 'Deepen' },
  { id: 'theme', num: '06', name: 'Theme & aim' },
  { id: 'weigh', num: '07', name: 'Weigh' },
  { id: 'questions', num: '08', name: 'Write' },
  { id: 'build', num: '09', name: 'Build' },
  { id: 'check', num: '10', name: 'Check' },
] as const;

export type LensId = (typeof LENSES)[number]['id'];

/** Glyph per lens for the header step-tracker (v2 shell redesign — lens rail moved to the header). */
export const LENS_ICON: Record<LensId, string> = {
  setup: '⚙',
  read: '◉',
  map: '▤',
  coma: '▦',
  deepen: '⊕',
  theme: '◎',
  weigh: '⚖',
  questions: '✎',
  build: '▥',
  check: '✓',
};

/** Lenses that are actually wired in v2.2 (the rest render the canvas + a "coming" note). */
export const LIVE_LENSES = new Set<LensId>(['setup', 'read', 'map']);

export function lensLabel(id: LensId): string {
  return LENSES.find((l) => l.id === id)?.name ?? id;
}
