import { parseReference, type ParsedReference } from '@/lib/verse';

/**
 * `@`-mention parsing for the inline cross-reference layer (ROADMAP-v2 §2 "reference paradigm").
 * A reference to **another** passage lives inside a note/question's content as an `@Malachi 4:5-6`
 * mention; this pure, unit-tested splitter turns the raw text into an ordered run of plain-text and
 * mention segments so the editor can render each mention as a chip (and promote it to a Support
 * passage). It is deliberately framework-free — the fragile part (the contenteditable editor) is a
 * thin shell over this.
 *
 * A mention is an `@` followed by the **longest prefix that `bcv_parser` accepts as a reference**,
 * so `@1 Corinthians 15:3-4` and `@Mal 4:5` both work while `jack@busable.com` (no chapter number)
 * and a bare `@Malachi` (no chapter) stay literal text.
 */

export type MentionSegment =
  | { type: 'text'; value: string }
  | { type: 'mention'; raw: string; reference: string; ref: ParsedReference };

/** Bounds the reference scan after an `@` (a reference is never this long). */
const MAX_REF = 48;

/**
 * A reference-shaped prefix: an optional leading book number (1–3), one or more letter words, then
 * a chapter, an optional `:verse`, and an optional `-verse` range. Whitespace-tolerant. This only
 * *proposes* a candidate; `parseReference` is the authority on whether it's real.
 */
const REF_SHAPE = /^([1-3]\s?)?[A-Za-z][A-Za-z.]*(?:\s+[A-Za-z][A-Za-z.]*)*\s+\d+(?::\d+)?(?:\s*[–-]\s*\d+(?::\d+)?)?/;

/** The longest reference `bcv_parser` accepts at the start of `rest`, or null. */
function longestReference(rest: string): { reference: string; ref: ParsedReference; len: number } | null {
  const m = REF_SHAPE.exec(rest);
  if (!m) return null;
  let cand = m[0];
  while (cand.trim().length > 0) {
    const trimmed = cand.trim();
    const ref = parseReference(trimmed);
    if (ref) return { reference: trimmed, ref, len: cand.length };
    const cut = cand.replace(/\s*\S+\s*$/, ''); // drop the trailing whitespace+token, then retry
    if (cut === cand) break;
    cand = cut;
  }
  return null;
}

export function parseMentions(text: string): MentionSegment[] {
  const segs: MentionSegment[] = [];
  let i = 0;
  let textStart = 0;
  while (i < text.length) {
    if (text[i] === '@') {
      const found = longestReference(text.slice(i + 1, i + 1 + MAX_REF));
      if (found) {
        if (i > textStart) segs.push({ type: 'text', value: text.slice(textStart, i) });
        const raw = '@' + text.slice(i + 1, i + 1 + found.len);
        segs.push({ type: 'mention', raw, reference: found.reference, ref: found.ref });
        i += 1 + found.len;
        textStart = i;
        continue;
      }
    }
    i++;
  }
  if (textStart < text.length) segs.push({ type: 'text', value: text.slice(textStart) });
  return segs;
}

/** The stable identity of a reference (its compact OSIS), for de-duping promotes. */
export function mentionKey(ref: ParsedReference): string {
  return ref.osis;
}

/** A compact chip label, e.g. `Mal 4:5–6` (or `Mal 4:5` for a single verse / cross-chapter). */
export function mentionLabel(ref: ParsedReference): string {
  const { start, end, singleBook } = ref;
  const head = `${start.book.shortName} ${start.chapter}:${start.verse}`;
  if (!singleBook || end.verseId === start.verseId) return head;
  if (end.chapter === start.chapter) return `${head}–${end.verse}`;
  return `${head}–${end.chapter}:${end.verse}`;
}
