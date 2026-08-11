import { parseReference } from '@/lib/verse';
import { parseVerseId } from '@/lib/verse/ids';

/**
 * The `/` command palette's item builder (v2.3, **slimmed to quick-jump only** — owner decision #7).
 * It is a lightweight verse jumper: type a bare verse number (`:20` / `20`) or a reference that's
 * already in the passage (`Luke 1:8`) to scroll there. The palette's earlier switch-translation /
 * create-on-selection / go-to-lens / book-completion commands were retired — those all have dedicated
 * UI now (the Aa Text menu, the verse action bar, the header lens tracker). A reference to *another*
 * passage is still an `@Malachi 4:5-6` mention inside a note, never a palette action.
 *
 * Pure, so the dialog stays a thin component and the parsing is unit-tested (the house pattern).
 */

export type PaletteAction =
  | { type: 'jump'; verseId: string }
  | { type: 'fill'; text: string };

export interface PaletteItem {
  id: string;
  section: string;
  icon: string;
  label: string;
  sub?: string;
  action: PaletteAction;
}

export interface PaletteContext {
  /** Verse ids of the current passage, in order (for jump + in-range checks). */
  passageVerseIds: string[];
}

function verseByNumber(ids: string[], n: number): string | undefined {
  return ids.find((id) => parseVerseId(id)?.verse === n);
}

export function buildPaletteItems(query: string, ctx: PaletteContext): PaletteItem[] {
  const q = query.trim();

  // Jump by a bare verse number or ":N".
  const jm = q.match(/^:?\s*(\d{1,3})$/);
  if (jm) {
    const n = Number(jm[1]);
    const target = verseByNumber(ctx.passageVerseIds, n);
    return target
      ? [{ id: 'jump', section: 'Go', icon: '↧', label: `Jump to verse ${n}`, sub: `:${n}`, action: { type: 'jump', verseId: target } }]
      : [{ id: 'nojump', section: 'Go', icon: '↧', label: `No verse ${n} in this passage`, action: { type: 'fill', text: query } }];
  }

  // A reference (only when the query carries a digit). We only *jump* to a reference already in the
  // passage; a reference to another passage is an @-mention in a note, so it yields nothing here.
  if (/\d/.test(q)) {
    const ref = parseReference(q);
    if (ref && ctx.passageVerseIds.includes(ref.start.verseId)) {
      const label = `${ref.start.book.shortName} ${ref.start.chapter}:${ref.start.verse}`;
      return [
        { id: 'jump-ref', section: 'Go', icon: '↧', label: `Jump to ${label}`, sub: ref.osis, action: { type: 'jump', verseId: ref.start.verseId } },
      ];
    }
  }

  return [];
}
