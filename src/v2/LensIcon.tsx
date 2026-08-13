import type { ReactNode } from 'react';

import type { LensId } from '@/v2/lenses';

/**
 * The lens rail icons (flow-redesign, owner-approved). All are stroke-based `currentColor` line
 * icons, so they take the ink colour like the old glyphs and read quiet in the rail. The tools —
 * **cog** (Set up), **shovel** (Deepen), **claw hammer** (Build) — are from **Lucide** (MIT-licensed,
 * credited on the About page); book / map / pulse / target / scales / check are hand-drawn to match;
 * **Write** keeps the classic **✎** glyph. Stroke weights aren't perfectly standardized across the
 * set (owner: "run with it").
 */
const ICON: Partial<Record<LensId, { sw?: number; node: ReactNode }>> = {
  setup: {
    node: (
      <>
        <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  read: {
    node: (
      <>
        <path d="M12 6.7C9.6 5.1 6.8 4.8 4 5.4v13.4c2.8-.6 5.6-.3 8 1.3 2.4-1.6 5.2-1.9 8-1.3V5.4c-2.8-.6-5.6-.3-8 1.3z" />
        <path d="M12 6.7v13.4" />
      </>
    ),
  },
  map: {
    node: (
      <>
        <path d="M2.6 6.3 9 3.6l6 2.7 6.4-2.7v14.1l-6.4 2.7-6-2.7-6.4 2.7z" />
        <path d="M9 3.6v14.1M15 6.3v14.1" />
      </>
    ),
  },
  coma: { node: <path d="M2.4 12h4.3l2.5-7 3.2 14 2.6-7h6.6" /> },
  deepen: {
    node: (
      <>
        <path d="M21.56 4.56a1.5 1.5 0 0 1 0 2.122l-.47.47a3 3 0 0 1-4.212-.03 3 3 0 0 1 0-4.243l.44-.44a1.5 1.5 0 0 1 2.121 0z" />
        <path d="M3 22a1 1 0 0 1-1-1v-3.586a1 1 0 0 1 .293-.707l3.355-3.355a1.205 1.205 0 0 1 1.704 0l3.296 3.296a1.205 1.205 0 0 1 0 1.704l-3.355 3.355a1 1 0 0 1-.707.293z" />
        <path d="m9 15 7.879-7.878" />
      </>
    ),
  },
  theme: {
    node: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5.4" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  weigh: {
    node: (
      <>
        <path d="M12 4.6a1 1 0 1 0 .01 0" />
        <path d="M12 5.6v13M8.3 18.6h7.4" />
        <path d="M3.8 8.3l8.2-2 8.2 2" />
        <path d="M3.8 8.3 1.4 13.2a3 2.3 0 0 0 4.8 0z" />
        <path d="M20.2 8.3l-2.4 4.9a3 2.3 0 0 0 4.8 0z" />
      </>
    ),
  },
  build: {
    node: (
      <>
        <path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" />
        <path d="m18 15 4-4" />
        <path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" />
      </>
    ),
  },
  check: { sw: 2.2, node: <path d="M3.8 12.6 9.4 18.2 20.2 6.4" /> },
};

export function LensIcon({ id, size = 20 }: { id: LensId; size?: number }) {
  // Write keeps the classic pencil glyph (owner preference).
  if (id === 'questions') {
    return (
      <span aria-hidden style={{ fontSize: size, lineHeight: 1 }}>
        ✎
      </span>
    );
  }
  const icon = ICON[id];
  if (!icon) return <span aria-hidden>?</span>;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.sw ?? 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {icon.node}
    </svg>
  );
}
