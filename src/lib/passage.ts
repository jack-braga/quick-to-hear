import type { ParsedText } from '@/types/passage';
import type { Passage } from '@/types/study';

/**
 * Passage-container helpers (M3 / Stage 9). The study now holds **many** translations
 * (`passage.translations: Record<translationId, ParsedText>`) with one designated
 * `primaryId`; secondaries are comparison-only. Everything that used to read the single
 * `passage.primary` now reads {@link primaryText}. These are **pure** — safe in the store,
 * pages, and tests — and never mutate their input (the store owns persistence).
 *
 * Keying by `translationId` keeps the map self-describing (`translations[id].translationId
 * === id`) and makes "add the same translation twice" idempotent (a replace). A pasted
 * translation carries `source:'pasted'` and is source-of-truth; a bundled one is a
 * re-derivable cache (PLAN §4.4) — the distinction is preserved per translation so a
 * translation-switch can never overwrite pasted text.
 */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The primary reading (the one the group holds; everything anchors to it), or null. */
export function primaryText(passage: Passage): ParsedText | null {
  return passage.primaryId ? (passage.translations[passage.primaryId] ?? null) : null;
}

/** Every non-primary reading, in insertion order (the comparison texts). */
export function secondaryTexts(passage: Passage): ParsedText[] {
  return Object.entries(passage.translations)
    .filter(([id]) => id !== passage.primaryId)
    .map(([, text]) => text);
}

/** All translation ids present (primary first when set), for iteration/side-by-side. */
export function translationOrder(passage: Passage): string[] {
  const ids = Object.keys(passage.translations);
  if (!passage.primaryId) return ids;
  return [passage.primaryId, ...ids.filter((id) => id !== passage.primaryId)];
}

// ---------------------------------------------------------------------------
// Pure builders — the page composes the next passage, the store persists it.
// ---------------------------------------------------------------------------

/** Establish `primary` as THE passage, dropping any existing translations (a fresh load
 *  of a new reference: old comparison texts for a different passage no longer apply). */
export function loadFreshPrimary(primary: ParsedText): Passage {
  return { translations: { [primary.translationId]: primary }, primaryId: primary.translationId };
}

/** Replace the primary (a translation switch on the *same* reference). Existing secondaries
 *  are kept (same verse range); the previous primary is dropped unless it is being replaced
 *  in place. If the new primary was a secondary, it is promoted. */
export function setPrimary(passage: Passage, primary: ParsedText): Passage {
  const translations = { ...passage.translations };
  if (passage.primaryId && passage.primaryId !== primary.translationId) {
    delete translations[passage.primaryId];
  }
  translations[primary.translationId] = primary;
  return { translations, primaryId: primary.translationId };
}

/** Add (or replace) a comparison translation. Never changes the primary. */
export function addSecondary(passage: Passage, secondary: ParsedText): Passage {
  return {
    ...passage,
    translations: { ...passage.translations, [secondary.translationId]: secondary },
  };
}

/** Remove a comparison translation. The primary is never removed via this path. */
export function removeTranslation(passage: Passage, id: string): Passage {
  if (id === passage.primaryId) return passage;
  const translations = { ...passage.translations };
  delete translations[id];
  return { ...passage, translations };
}

// ---------------------------------------------------------------------------
// Migration — normalise any historical passage representation into the M3 shape.
// ---------------------------------------------------------------------------

/**
 * Coerce any stored/imported passage representation into the M3 `{ translations, primaryId }`
 * shape, loosely (zod validates afterwards). Handles, idempotently:
 *  - the M3 shape `{ translations, primaryId }` (returned as-is);
 *  - the M1/M2 embedded shape `{ primary: ParsedText | null }` (old project files);
 *  - a bare `ParsedText | null` (the pre-M3 passage-store payload);
 *  - `undefined`/junk → empty.
 * This is the single upgrade point, shared by {@link hydrate} (import) and the passage
 * store (IDB load), so an old single-primary doc upgrades without losing its passage.
 */
export function normaliseStoredPassage(input: unknown): {
  translations: Record<string, unknown>;
  primaryId: string | null;
} {
  if (isObject(input) && isObject(input.translations)) {
    const primaryId = typeof input.primaryId === 'string' ? input.primaryId : null;
    return { translations: input.translations as Record<string, unknown>, primaryId };
  }
  if (isObject(input) && 'primary' in input) {
    return fromPrimary((input as { primary: unknown }).primary);
  }
  return fromPrimary(input);
}

function fromPrimary(primary: unknown): { translations: Record<string, unknown>; primaryId: string | null } {
  if (isObject(primary) && typeof primary.translationId === 'string' && primary.translationId) {
    return { translations: { [primary.translationId]: primary }, primaryId: primary.translationId };
  }
  return { translations: {}, primaryId: null };
}
