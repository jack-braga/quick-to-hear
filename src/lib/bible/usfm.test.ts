import { describe, expect, it } from 'vitest';

import { parseUsfmBook, type BuiltBook } from '@/lib/bible/usfm';

/** Find a chapter / verse in a built book (test convenience). */
function chapter(book: BuiltBook, n: number) {
  return book.chapters.find((c) => c.chapter === n)!;
}
function verse(book: BuiltBook, ch: number, verseId: string) {
  return chapter(book, ch)
    .blocks.flatMap((b) => b.verses)
    .find((v) => v.verseId === verseId);
}

describe('parseUsfmBook', () => {
  it('parses prose, strips Strong’s, and NFC-normalises', () => {
    const decomposed = 'Café'; // e + combining acute
    const book = parseUsfmBook(
      `\\id LUK Test\n\\c 1\n\\p\n\\v 1 ${decomposed} \\w and|strong="G2532"\\w* more.\n`,
      { translationId: 'webbe' },
    )!;
    const v = verse(book, 1, 'LUKE.1.1')!;
    expect(v.present).toBe(true);
    expect(v.fragments).toHaveLength(1);
    expect(v.fragments[0]!.text).toBe('Café and more.'); // Strong's gone, NFC-composed
    expect(v.fragments[0]!.text).not.toContain(decomposed);
  });

  it('captures footnotes and cross-references as tagged notes (not inline text)', () => {
    const book = parseUsfmBook(
      `\\id LUK Test\n\\c 1\n\\p\n\\v 2 The Lord said,\\f + \\fr 1:2 \\ft A footnote.\\f* and it was so.\\x + \\xo 1:2 \\xt Genesis 1:1\\x*\n`,
      { translationId: 'webbe' },
    )!;
    const v = verse(book, 1, 'LUKE.1.2')!;
    expect(v.fragments.map((f) => f.text).join(' ')).toBe('The Lord said, and it was so.');
    const notes = chapter(book, 1).notes;
    expect(notes).toContainEqual({ verseId: 'LUKE.1.2', kind: 'footnote', text: 'A footnote.' });
    expect(notes).toContainEqual({ verseId: 'LUKE.1.2', kind: 'xref', text: 'Genesis 1:1' });
  });

  it('tags red-letter (\\wj) fragments', () => {
    const book = parseUsfmBook(`\\id LUK Test\n\\c 1\n\\p\n\\v 3 \\wj I am the light.\\wj*\n`, {
      translationId: 'webbe',
    })!;
    const v = verse(book, 1, 'LUKE.1.3')!;
    expect(v.fragments[0]!.wj).toBe(true);
    expect(v.fragments[0]!.text).toBe('I am the light.');
  });

  it('keeps poetry as lines with per-line indent, and attaches the superscription to the chapter', () => {
    const usfm = `\\id PSA Test
\\c 23
\\d A Psalm by David.
\\q1
\\v 1 The LORD is my shepherd;
\\q2 I shall lack nothing.
\\q1
\\v 2 He leads me
\\q2 beside still waters.
`;
    const book = parseUsfmBook(usfm, { translationId: 'webbe' })!;
    const ch = chapter(book, 23);
    expect(ch.blocks.map((b) => b.kind)).toEqual(['d', 'q']);

    const d = ch.blocks[0]!;
    expect(d.verses).toHaveLength(0); // not part of verse 1
    expect(d.text?.map((f) => f.text).join(' ')).toBe('A Psalm by David.');

    const v1 = verse(book, 23, 'PS.23.1')!;
    expect(v1.fragments.map((f) => f.qlevel)).toEqual([1, 2]);
    expect(v1.fragments.map((f) => f.text)).toEqual(['The LORD is my shepherd;', 'I shall lack nothing.']);
  });

  it('marks an omitted verse present:false and keeps its footnote', () => {
    const usfm = `\\id ACT Test
\\c 8
\\p
\\v 36 As they went on the way.
\\v 37 \\f + \\fr 8:37 \\ft TR adds Philip said.\\f*
\\v 38 He commanded the chariot to stop.
`;
    const book = parseUsfmBook(usfm, { translationId: 'webbe' })!;
    const gap = verse(book, 8, 'ACTS.8.37')!;
    expect(gap.present).toBe(false);
    expect(gap.fragments).toHaveLength(0);
    expect(verse(book, 8, 'ACTS.8.36')!.present).toBe(true);
    expect(verse(book, 8, 'ACTS.8.38')!.present).toBe(true);
    expect(chapter(book, 8).notes).toContainEqual({
      verseId: 'ACTS.8.37',
      kind: 'footnote',
      text: 'TR adds Philip said.',
    });
  });

  it('captures section headings as editorial blocks (never text to study)', () => {
    const book = parseUsfmBook(
      `\\id MRK Test\n\\c 1\n\\s1 The Beginning\n\\p\n\\v 1 The beginning of the Good News.\n`,
      { translationId: 'webbe' },
    )!;
    const heading = chapter(book, 1).blocks.find((b) => b.kind === 's1')!;
    expect(heading.editorial).toBe(true);
    expect(heading.text?.map((f) => f.text).join(' ')).toBe('The Beginning');
    expect(verse(book, 1, 'MARK.1.1')!.present).toBe(true);
  });

  it('resolves the book from the \\id line and returns null when unidentifiable', () => {
    expect(parseUsfmBook('\\id LUK\n\\c 1\n', { translationId: 'webbe' })?.bookId).toBe('luke');
    expect(parseUsfmBook('no id line here', { translationId: 'webbe' })).toBeNull();
  });
});
