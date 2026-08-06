import { load as loadYaml } from 'js-yaml';
import { z } from 'zod';

/**
 * Method-data loader (PLAN §4.7). YAML under `content/method/` is inlined at build time
 * via a **root-absolute** glob (base-independent, so it works under `/quick-to-hear/`),
 * then **zod-validated at load** — the app never trusts unparsed content data.
 *
 * The parsers ({@link parseComa}, {@link parseGenres}) are pure over a raw string so they
 * unit-test without the glob; the memoised accessors ({@link comaContent},
 * {@link genreItems}) read the real files.
 *
 * COMA note: the six genre prompt sets are **verbatim by permission** from David Helm,
 * *One-to-One Bible Reading* (© Matthias Media & Holy Trinity Church). They are typed by
 * hand into `coma.yaml` (see `content/COMA-TRANSCRIPTION.md`); until then the lists are
 * empty, which is a **valid** state here — the schema tolerates it and the UI shows the
 * composers with no prompts. The `attribution` string is always present and MUST render
 * wherever COMA content appears (Inviolable rule 8) — we require it to be non-empty.
 */

const RAW_METHOD = import.meta.glob('/content/method/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function rawMethod(basename: string): string {
  const raw = RAW_METHOD[`/content/method/${basename}`];
  if (raw == null) throw new Error(`Method data not found: content/method/${basename}`);
  return raw;
}

/** A list of verbatim prompts; coerces a null/absent YAML value to `[]` (the `todo`
 *  skeleton writes `context: []`, but hand edits shouldn't break on a bare `context:`). */
const promptList = z.preprocess((v) => (v == null ? [] : v), z.array(z.string()));

// ---------------------------------------------------------------------------
// coma.yaml — the four-category prompt sets, keyed by genre/comaSet id
// ---------------------------------------------------------------------------

export const ComaGenreSetSchema = z.object({
  context: promptList,
  observation: promptList,
  meaning: promptList,
  application: promptList,
});
export type ComaGenreSet = z.infer<typeof ComaGenreSetSchema>;

export const ComaContentSchema = z.object({
  // Non-empty is enforced: this is the on-screen attribution the licence requires.
  attribution: z.string().min(1),
  state: z.string().default('todo'),
  source: z.string().nullish(),
  // Authored user-facing notice shown wherever COMA prompts would appear while `state`
  // is not `cited`, so no one mistakes the empty grid for Helm's real questions. Set in
  // the content file (do not author it here); stops showing once state → cited.
  placeholder: z.string().nullish(),
  genres: z.record(ComaGenreSetSchema).default({}),
});
export type ComaContent = z.infer<typeof ComaContentSchema>;

/** Parse + validate a `coma.yaml` string. Throws (zod) on a structurally invalid file. */
export function parseComa(raw: string): ComaContent {
  return ComaContentSchema.parse(loadYaml(raw));
}

let _coma: ComaContent | undefined;
export function comaContent(): ComaContent {
  return (_coma ??= parseComa(rawMethod('coma.yaml')));
}

// ---------------------------------------------------------------------------
// genres.yaml — display labels + the genre→comaSet mapping + reading tips
// ---------------------------------------------------------------------------

export const GenreItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Which key in `coma.yaml` drives this genre's prompts (usually === id). */
  comaSet: z.string(),
  /** One-line genre reading guidance (Phase 4). Empty until authored. */
  readingTip: z.preprocess((v) => v ?? '', z.string()),
  state: z.string().nullish(),
  source: z.string().nullish(),
  flag: z.string().nullish(),
});
export type GenreItem = z.infer<typeof GenreItemSchema>;

export const GenresContentSchema = z.object({
  items: z.array(GenreItemSchema).default([]),
});

/** Parse + validate a `genres.yaml` string into its item list. */
export function parseGenres(raw: string): GenreItem[] {
  return GenresContentSchema.parse(loadYaml(raw)).items;
}

let _genres: GenreItem[] | undefined;
export function genreItems(): GenreItem[] {
  return (_genres ??= parseGenres(rawMethod('genres.yaml')));
}

// ---------------------------------------------------------------------------
// Convenience — resolve a study's genre to its COMA prompts + reading tip
// ---------------------------------------------------------------------------

/** The four-category prompt set for a genre (via the genres.yaml `comaSet` mapping,
 *  falling back to the genre id), or `null` when the genre is unset/unknown. */
export function comaSetForGenre(genre: string | null | undefined): ComaGenreSet | null {
  if (!genre) return null;
  const key = genreItems().find((g) => g.id === genre)?.comaSet ?? genre;
  return comaContent().genres[key] ?? null;
}

/** The one-line genre reading tip (empty string until authored). */
export function readingTipForGenre(genre: string | null | undefined): string {
  if (!genre) return '';
  return genreItems().find((g) => g.id === genre)?.readingTip ?? '';
}

// ---------------------------------------------------------------------------
// litmus.yaml — the theme[] tests (Phase 5, on exit) + question[] tests (Phase 6)
// ---------------------------------------------------------------------------

export const LitmusTestSchema = z.object({
  id: z.string(),
  text: z.string().default(''),
  state: z.string().nullish(),
  source: z.string().nullish(),
  flag: z.string().nullish(),
});
export type LitmusTest = z.infer<typeof LitmusTestSchema>;

export const LitmusContentSchema = z.object({
  theme: z.array(LitmusTestSchema).default([]),
  question: z.array(LitmusTestSchema).default([]),
});
export type LitmusContent = z.infer<typeof LitmusContentSchema>;

/** Parse + validate a `litmus.yaml` string. */
export function parseLitmus(raw: string): LitmusContent {
  return LitmusContentSchema.parse(loadYaml(raw));
}

let _litmus: LitmusContent | undefined;
function litmus(): LitmusContent {
  return (_litmus ??= parseLitmus(rawMethod('litmus.yaml')));
}

/** The theme litmus tests acknowledged on leaving Phase 5 — empty-text entries (the
 *  not-yet-authored `question[]` seeds) are never returned here. */
export function litmusThemeTests(): LitmusTest[] {
  return litmus().theme.filter((t) => t.text.trim().length > 0);
}

// ---------------------------------------------------------------------------
// traps.yaml — the four Christ-connection traps (Phase 5, Christ & gospel test)
// ---------------------------------------------------------------------------

export const TrapItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  looksLike: z.string(),
  check: z.string(),
});
export type TrapItem = z.infer<typeof TrapItemSchema>;

export const TrapsContentSchema = z.object({
  // Non-empty is enforced: the trap concepts follow Goldsworthy and the credit must show
  // wherever they appear (SPEC §7).
  attribution: z.string().min(1),
  state: z.string().nullish(),
  source: z.string().nullish(),
  flag: z.string().nullish(),
  items: z.array(TrapItemSchema).default([]),
});
export type TrapsContent = z.infer<typeof TrapsContentSchema>;

/** Parse + validate a `traps.yaml` string. Throws (zod) without a non-empty attribution. */
export function parseTraps(raw: string): TrapsContent {
  return TrapsContentSchema.parse(loadYaml(raw));
}

let _traps: TrapsContent | undefined;
export function trapsContent(): TrapsContent {
  return (_traps ??= parseTraps(rawMethod('traps.yaml')));
}

// ---------------------------------------------------------------------------
// stuck-helpers.yaml — Phase 5, available on demand (not forced)
// ---------------------------------------------------------------------------

export const StuckHelperSchema = z.object({
  id: z.string(),
  name: z.string(),
  text: z.string().default(''),
  state: z.string().nullish(),
  source: z.string().nullish(),
  flag: z.string().nullish(),
});
export type StuckHelper = z.infer<typeof StuckHelperSchema>;

export const StuckHelpersContentSchema = z.object({
  items: z.array(StuckHelperSchema).default([]),
});
export type StuckHelpersContent = z.infer<typeof StuckHelpersContentSchema>;

/** Parse + validate a `stuck-helpers.yaml` string into its item list. */
export function parseStuckHelpers(raw: string): StuckHelper[] {
  return StuckHelpersContentSchema.parse(loadYaml(raw)).items;
}

let _stuck: StuckHelper[] | undefined;
export function stuckHelpers(): StuckHelper[] {
  return (_stuck ??= parseStuckHelpers(rawMethod('stuck-helpers.yaml')));
}
