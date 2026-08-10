import { BOOKS, parseReference } from '@/lib/verse';
import { parseVerseId } from '@/lib/verse/ids';
import type { LensId } from '@/v2/lenses';

/**
 * The `/` command palette's item builder (v2.3) — pure, so the dialog stays a thin component and
 * the parsing is unit-tested (the house pattern). It turns the query + the reader's context into
 * an ordered, grouped list of actions: jump to a verse, jump to a reference already in the passage,
 * switch the primary translation, create a note/question/mark on the current selection, jump to a
 * lens, or complete a book name. (A reference to *another* passage is not a palette action — you
 * type an `@Malachi 4:5-6` mention inside a note.)
 *
 * A query is treated as a **reference** only when it contains a digit, so a bare book word that is
 * also a command (e.g. "mark" → the gospel vs. "mark confusing") stays a command + a book to pick.
 */

export type PaletteCreateKind = 'note' | 'ask' | 'mark';

export type PaletteAction =
  | { type: 'jump'; verseId: string }
  | { type: 'create'; kind: PaletteCreateKind }
  | { type: 'switch-translation'; id: string }
  | { type: 'go-lens'; lens: LensId }
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
  hasSelection: boolean;
  translations: { id: string; name: string; shortName: string; isPrimary: boolean }[];
  lenses: { id: LensId; name: string }[];
}

function verseByNumber(ids: string[], n: number): string | undefined {
  return ids.find((id) => parseVerseId(id)?.verse === n);
}

export function buildPaletteItems(query: string, ctx: PaletteContext): PaletteItem[] {
  const q = query.trim();
  const ql = q.toLowerCase();

  // Jump by a bare verse number or ":N".
  const jm = q.match(/^:?\s*(\d{1,3})$/);
  if (jm) {
    const n = Number(jm[1]);
    const target = verseByNumber(ctx.passageVerseIds, n);
    return target
      ? [{ id: 'jump', section: 'Go', icon: '↧', label: `Jump to verse ${n}`, sub: `:${n}`, action: { type: 'jump', verseId: target } }]
      : [{ id: 'nojump', section: 'Go', icon: '↧', label: `No verse ${n} in this passage`, action: { type: 'fill', text: query } }];
  }

  // A reference (only when the query carries a digit — see the note above). We only *jump* to a
  // reference that's already in the passage; a reference to another passage is an @-mention in a
  // note, not a palette action, so an out-of-passage reference yields nothing here.
  if (/\d/.test(q)) {
    const ref = parseReference(q);
    if (ref && ctx.passageVerseIds.includes(ref.start.verseId)) {
      const label = `${ref.start.book.shortName} ${ref.start.chapter}:${ref.start.verse}`;
      return [
        { id: 'jump-ref', section: 'Go', icon: '↧', label: `Jump to ${label}`, sub: ref.osis, action: { type: 'jump', verseId: ref.start.verseId } },
      ];
    }
    if (ref) return [];
  }

  const items: PaletteItem[] = [];
  const match = (words: string) => !ql || words.toLowerCase().includes(ql);

  // Create on the current selection.
  if (ctx.hasSelection) {
    if (match('new question ask')) items.push({ id: 'c-ask', section: 'On the selection', icon: '?', label: 'New question here', action: { type: 'create', kind: 'ask' } });
    if (match('add note observe comment')) items.push({ id: 'c-note', section: 'On the selection', icon: '✎', label: 'Add a note', action: { type: 'create', kind: 'note' } });
    if (match('mark confusing')) items.push({ id: 'c-mark', section: 'On the selection', icon: '⚑', label: 'Mark confusing', action: { type: 'create', kind: 'mark' } });
  }

  // Switch the primary translation (among those already loaded).
  ctx.translations
    .filter((t) => !t.isPrimary)
    .forEach((t) => {
      if (match(`switch translation ${t.name} ${t.shortName}`)) {
        items.push({ id: `tr-${t.id}`, section: 'Translation', icon: '⇄', label: `Switch to ${t.name}`, sub: t.shortName, action: { type: 'switch-translation', id: t.id } });
      }
    });

  // Jump to a lens.
  ctx.lenses.forEach((l) => {
    if (match(`go to ${l.name}`)) {
      items.push({ id: `lens-${l.id}`, section: 'Lenses', icon: '◉', label: `Go to ${l.name}`, action: { type: 'go-lens', lens: l.id } });
    }
  });

  // Complete a book name while a bare book token is typed.
  const bookTok = q.match(/^([1-3]?\s?[A-Za-z]+)$/)?.[1];
  if (bookTok) {
    const needle = bookTok.toLowerCase().replace(/\s+/g, ' ');
    BOOKS.filter((b) => b.name.toLowerCase().startsWith(needle))
      .slice(0, 5)
      .forEach((b) => {
        items.push({ id: `book-${b.id}`, section: 'Reference a passage', icon: '📖', label: b.name, sub: 'pick a chapter', action: { type: 'fill', text: `${b.name} ` } });
      });
  }

  return items;
}
