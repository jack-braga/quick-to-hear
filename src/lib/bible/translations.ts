/**
 * The bundled translations the user can pick as their primary in Phase 1 (PLAN §4.5).
 *
 * This is the Stage-2 authority for *which* translations ship and their display names.
 * The exact copyright lines auto-appended to exports live in
 * `content/method/translations.yaml` and are wired in at Stage 7 (the export stage);
 * the build-time source of truth for the generated files is `public/bibles/manifest.json`.
 *
 * **BSB is deferred** (PLAN §8 #4): it is not among the local eBible sources, and its
 * USFM source has not been confirmed/pinned by the owner. The set widens to three by
 * adding one row here + running `npm run build:bibles` once its source is settled.
 */
export interface BundledTranslation {
  id: string;
  name: string;
  shortName: string;
}

export const BUNDLED_TRANSLATIONS: BundledTranslation[] = [
  { id: 'webbe', name: 'World English Bible British Edition', shortName: 'WEBBE' },
  { id: 'asv', name: 'American Standard Version (1901)', shortName: 'ASV' },
];

/** The default primary (PLAN §4.5: WEBBE — British spelling, suits the AU/UK audience). */
export const DEFAULT_TRANSLATION_ID = 'webbe';

export function findTranslation(id: string | null | undefined): BundledTranslation | undefined {
  return BUNDLED_TRANSLATIONS.find((t) => t.id === id);
}
