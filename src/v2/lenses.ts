/**
 * The seven phases (SPEC) reframed as **lenses over one canvas** (ROADMAP-v2 §1): switching
 * lens changes what you do to the text and what overlays it; the text stays put. v2.2 wires
 * the **Map** lens for real and a minimal **Set up** (load a passage); the rest read the
 * passage and are filled in across v2.4–v2.6.
 */

export const LENSES = [
  { id: 'setup', num: '01', name: 'Set up' },
  { id: 'read', num: '02', name: 'Read' },
  { id: 'map', num: '03', name: 'Map' },
  { id: 'coma', num: '04', name: 'COMA' },
  { id: 'theme', num: '05', name: 'Theme & aim' },
  { id: 'build', num: '06', name: 'Build' },
  { id: 'check', num: '07', name: 'Check' },
] as const;

export type LensId = (typeof LENSES)[number]['id'];

/** Glyph per lens for the header step-tracker (v2 shell redesign — lens rail moved to the header). */
export const LENS_ICON: Record<LensId, string> = {
  setup: '⚙',
  read: '◉',
  map: '▤',
  coma: '▦',
  theme: '◎',
  build: '▥',
  check: '✓',
};

/** Lenses that are actually wired in v2.2 (the rest render the canvas + a "coming" note). */
export const LIVE_LENSES = new Set<LensId>(['setup', 'read', 'map']);

export function lensLabel(id: LensId): string {
  return LENSES.find((l) => l.id === id)?.name ?? id;
}
