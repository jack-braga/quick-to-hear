/**
 * Low-level text cleaning for the paste normaliser (PLAN §4.6). Pure string helpers,
 * unit-tested directly. OS-agnostic: line endings (`\r\n`/`\r`/`\n`), NBSP variants,
 * zero-width + bidi controls are all normalised so a Mac/Windows/Android clipboard land
 * the same way.
 */

/** Zero-width + bidirectional control characters that clipboards sometimes carry:
 *  ZWSP/ZWNJ/ZWJ (200B–200D), LRM/RLM (200E–200F), bidi embeds/overrides (202A–202E),
 *  word joiner (2060), and the BOM / zero-width no-break space (FEFF). */
const INVISIBLE_RE = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;
/** Non-breaking / narrow-no-break / figure spaces → a normal space (keep the gap). */
const NBSP_RE = /[\u00A0\u2007\u202F]/g;

/** Normalise a whole paste: NFC, unify line endings, fold NBSP→space, drop invisibles.
 *  Leading/inner spaces are **preserved** (indentation carries poetry structure). */
export function preclean(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(NBSP_RE, ' ')
    .replace(INVISIBLE_RE, '');
}

/** Collapse internal whitespace to single spaces and trim — for display/segment text. */
export function collapseWs(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Unwrap **bracketed verse numbers** into plain standalone digit tokens: YouVersion copies
 *  markers as `[39]`, whereas the marker detector expects space-delimited digits. Digits only
 *  — footnote *letters* like `[a]` are a separate concern ({@link stripInlineMarkers}). Run
 *  before line-splitting so `[39] Now…[40] and…` becomes ` 39 Now… 40 and…`. */
export function unwrapBracketedVerseNumbers(s: string): string {
  return s.replace(/\[(\d{1,3})\]/g, ' $1 ');
}

/** Map a leading-space width to a poetry indent level 0..3. */
export function indentLevel(spaces: number): number {
  if (spaces >= 6) return 2;
  if (spaces >= 2) return 1;
  return 0;
}

/** The width of a run of leading whitespace (tab = 4), scanning from index `from`. */
export function leadingSpaces(s: string, from = 0): number {
  let n = 0;
  for (let i = from; i < s.length; i++) {
    if (s[i] === ' ') n += 1;
    else if (s[i] === '\t') n += 4;
    else break;
  }
  return n;
}

// ---------------------------------------------------------------------------
// Chrome — app furniture that is never scripture text
// ---------------------------------------------------------------------------

/** Whole-line chrome from BibleGateway / YouVersion / copyright blocks. Matched against
 *  the trimmed line, case-insensitively. */
const CHROME_LINE_RES: RegExp[] = [
  /^read full chapter$/i,
  /^full chapter$/i,
  /^in context$/i,
  /^cross references?$/i,
  /^bible gateway.*$/i,
  /^copyright\s*©/i,
  /^©/,
  /all rights reserved/i,
  /used by permission/i,
  /^share$/i,
  /^compare$/i,
  // A bare URL line, e.g. YouVersion's "https://bible.com/bible/3345/luk.1.39-80.LSB".
  /^https?:\/\/\S+$/i,
  /^www\.\S+$/i,
];

/** True when a trimmed line is app chrome to strip (not the footnotes *body* — that is
 *  handled separately so its text can be captured as notes). */
export function isChromeLine(trimmed: string): boolean {
  return CHROME_LINE_RES.some((re) => re.test(trimmed));
}

/** True when the "Footnotes" section header opens (everything after it is footnote bodies
 *  or trailing chrome, never scripture). */
export function isFootnotesHeader(trimmed: string): boolean {
  return /^footnotes?$/i.test(trimmed);
}

// ---------------------------------------------------------------------------
// Inline markers (footnote letters, cross-ref daggers) inside verse text
// ---------------------------------------------------------------------------

/** Strip inline footnote/cross-ref markers that land mid-sentence:
 *  - bracketed letters `[a]`, `[bc]` (BibleGateway),
 *  - stray daggers `†`/`‡` left by some copies. Verse *numbers* are handled upstream. */
export function stripInlineMarkers(s: string): string {
  return s
    .replace(/\[[a-z]{1,3}\]/gi, '')
    .replace(/[†‡]/g, '')
    .replace(/ {2,}/g, ' ');
}

// ---------------------------------------------------------------------------
// Translation-name detection
// ---------------------------------------------------------------------------

/** Looks like a translation-name line (for stripping + recovery): contains a version-ish
 *  keyword, is short, and has no sentence punctuation.
 *
 *  Some real scripture lines carry a version-ish keyword too ("…the new **testament** in my
 *  blood", "the **standard** raised against him") and would be wrongly dropped as the name
 *  (§1.10c). Two guards keep verse-like prose out:
 *   1. a line that **starts with a verse number** is verse text, never a name;
 *   2. a translation name is a short **Title-Case label** ("New International Version") — prose
 *      gives itself away with several lowercase-leading function words (is/the/in/of/my/…), so
 *      more than one of them means "this reads as a sentence, not a name". */
export function looksLikeTranslationName(trimmed: string): boolean {
  if (!trimmed || trimmed.length > 60) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  if (/^\d{1,3}\b/.test(trimmed)) return false; // a leading verse number → verse text
  const words = trimmed.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  const lowercaseLeading = words.filter((w) => /^[a-z]/.test(w)).length;
  if (lowercaseLeading > 1) return false; // reads as prose, not a Title-Case name
  return /\b(version|translation|bible|standard|testament|edition|revised|douay|septuagint)\b/i.test(
    trimmed,
  );
}
