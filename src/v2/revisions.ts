import type { Annotation, Revision, RevisionOrigin, ThemeAimRevision } from '@/types/study';

/**
 * Pure helpers for the two-round **Deepen / Weigh** revision model (V2-UX-BACKLOG §7.2): Deepen
 * (round 1, own work) and Weigh (round 2, with a 📖 book source) never create cards — they append
 * revisions to a card's one unified `revisions` list, each carrying its own `origin`. Theme & Aim
 * are not cards, so their Weigh supersede is modelled separately on `study.themeAim` and read
 * through {@link supersede}. Framework-free + unit-tested, the house pattern.
 */

/** A card's revisions (never null), in append order. */
export function revisionsOf(a: Pick<Annotation, 'revisions'>): Revision[] {
  return a.revisions ?? [];
}

/** Build a fresh revision (id supplied by the caller, keeping this pure). */
export function makeRevision(id: string, origin: RevisionOrigin, over: Partial<Revision> = {}): Revision {
  return { id, origin, text: '', ...over };
}

/**
 * The superseding history of a Theme/Aim field for the Weigh view: the latest revision leads
 * (`primary`); the value it directly replaced is `was`; anything older is `earlier` (newest-first).
 * No revisions → the `original` is primary and nothing is demoted. This drives the compact history:
 * primary + one muted "was" line + a `▾ N earlier versions` disclosure (only when `earlier` is
 * non-empty).
 */
export interface Superseded {
  primary: string;
  primarySource?: string;
  was?: string;
  earlier: string[];
}

export function supersede(original: string, revisions: ThemeAimRevision[]): Superseded {
  if (revisions.length === 0) return { primary: original, earlier: [] };
  const chain = [original, ...revisions.map((r) => r.text)]; // oldest → newest
  const primary = revisions[revisions.length - 1]!;
  return {
    primary: primary.text,
    primarySource: primary.source,
    was: chain[chain.length - 2],
    earlier: chain.slice(0, chain.length - 2).reverse(),
  };
}

/**
 * The committed value of a Theme/Aim field for downstream/export use: the latest **non-empty**
 * revision text, else the original. Unlike {@link supersede}'s `primary` (the raw latest revision,
 * which is `''` while a just-started "revise" draft is still empty), this never lets a blank
 * in-progress revision silently suppress the committed theme/aim from the leader's notes.
 */
export function weighedText(original: string, revisions: ThemeAimRevision[]): string {
  for (let i = revisions.length - 1; i >= 0; i -= 1) {
    if (revisions[i]!.text.trim()) return revisions[i]!.text;
  }
  return original;
}
