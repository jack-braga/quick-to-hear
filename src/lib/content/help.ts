import { load as loadYaml } from 'js-yaml';
import { z } from 'zod';

/**
 * Help-prose loader (PLAN §4.7) — the **markdown half** of the content pipeline (the
 * method-YAML half lives in `./method`). Markdown under `content/help/` is inlined at
 * build time via a **root-absolute** glob (base-independent, so it works under
 * `/quick-to-hear/`), then split into tiers.
 *
 * Each file is a leading `--- frontmatter ---` block + a body divided by tier-marker
 * comments (`<!-- inline -->`, `<!-- expandable -->`, `<!-- page -->`). We split the
 * frontmatter **by hand** (no `gray-matter` — it needs a Buffer polyfill in the browser,
 * see the PROGRESS decision log) and parse only the small YAML block with `js-yaml`.
 *
 * The three tiers map to SPEC §5's [I]/[E]/[X]: `inline` is always shown; `expandable`
 * is the "tell me more" detail, hidden when the global guidance toggle is on `brief`;
 * `page` is a standalone page (only the attribution page uses it today). Authored prose
 * is trusted content, but we still tolerate a malformed file — it degrades to empty
 * fields (→ the "guidance to be written" placeholder) rather than throwing, so the
 * build never blocks on content.
 */

const RAW_HELP = import.meta.glob('/content/help/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const FrontmatterSchema = z
  .object({
    key: z.string().optional(),
    title: z.string().optional(),
    phase: z.union([z.string(), z.number()]).optional(),
    state: z.string().nullish(),
    source: z.string().nullish(),
    flag: z.string().nullish(),
  })
  .passthrough();

export interface HelpEntry {
  key: string;
  title: string;
  phase: string;
  state: string | null;
  /** Inline source credit — present only when `state: cited` (SPEC §7: credits travel
   *  with the text). */
  source: string | null;
  flag: string | null;
  /** [I] — always shown. Empty string when the file has no inline content yet. */
  inline: string;
  /** [E] — the "tell me more" detail. Empty when absent. */
  expandable: string;
  /** [X]/page — standalone content (only the attribution page uses it today). */
  page: string;
}

const TIER_RE = /<!--\s*(inline|expandable|page)\s*-->/g;

const nn = (v: string | null | undefined): string | null => (v == null || v === '' ? null : v);

/**
 * Split one help file's raw text into frontmatter fields + a tiered body. **Pure** — it
 * touches neither the glob nor React, so it unit-tests against a literal string. Never
 * throws on authored content: a malformed frontmatter block degrades to empty fields.
 */
export function parseHelp(raw: string, fallbackKey = ''): HelpEntry {
  let body = raw;
  let fm: z.infer<typeof FrontmatterSchema> = {};
  // Frontmatter is a leading `---` … `---` block (tolerate a BOM + CRLF line endings).
  const fmMatch = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (fmMatch) {
    body = raw.slice(fmMatch[0].length);
    try {
      const parsed = FrontmatterSchema.safeParse(loadYaml(fmMatch[1]) ?? {});
      if (parsed.success) fm = parsed.data;
    } catch {
      /* malformed frontmatter — treat as none; still render the body */
    }
  }

  const tiers: Record<'inline' | 'expandable' | 'page', string> = {
    inline: '',
    expandable: '',
    page: '',
  };
  const markers = [...body.matchAll(TIER_RE)];
  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    const name = m[1] as 'inline' | 'expandable' | 'page';
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < markers.length ? (markers[i + 1].index ?? body.length) : body.length;
    tiers[name] = body.slice(start, end).trim();
  }

  return {
    key: fm.key ?? fallbackKey,
    title: fm.title ?? '',
    phase: fm.phase != null ? String(fm.phase) : '',
    state: nn(fm.state),
    source: nn(fm.source),
    flag: nn(fm.flag),
    inline: tiers.inline,
    expandable: tiers.expandable,
    page: tiers.page,
  };
}

// key → raw string, derived from the filename (basename minus `.md`) so a lookup by help
// key (e.g. "p5.theme") resolves regardless of which phase folder the file lives in.
const BY_KEY: Record<string, string> = {};
for (const [path, raw] of Object.entries(RAW_HELP)) {
  const base = path.split('/').pop()?.replace(/\.md$/, '') ?? '';
  if (base) BY_KEY[base] = raw;
}

const CACHE: Record<string, HelpEntry | null> = {};

/** Parsed help entry for a key (e.g. `"p5.theme"`), or `null` if no file ships for it. */
export function helpEntry(key: string): HelpEntry | null {
  if (key in CACHE) return CACHE[key];
  const raw = BY_KEY[key];
  const entry = raw == null ? null : parseHelp(raw, key);
  CACHE[key] = entry;
  return entry;
}

/** Does this key have visible inline prose yet? Drives the placeholder fallback. */
export function hasHelp(key: string): boolean {
  return (helpEntry(key)?.inline.length ?? 0) > 0;
}
