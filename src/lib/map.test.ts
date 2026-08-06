import { describe, expect, it } from 'vitest';

import {
  makeSpanMark,
  makeVerseMark,
  mergeSectionUp,
  orderedSections,
  reconcileMarks,
  renameSection,
  resolvedMarkText,
  sectionVerseIds,
  sectionsMatchPassage,
  splitSectionAt,
  tokenizeVerse,
  verseChipLabel,
  verseRefLabel,
  wholePassageSection,
} from '@/lib/map';
import { ParsedTextSchema, allVerses, type ParsedText } from '@/types/passage';
import { MapSchema, type Section, type StudyMap } from '@/types/study';

/** Build a one-prose-block passage from `[verseId, text, present?]` rows. */
function pt(rows: Array<[string, string, boolean?]>): ParsedText {
  return ParsedTextSchema.parse({
    translationId: 'webbe',
    blocks: [
      {
        kind: 'p',
        verses: rows.map(([verseId, text, present = true]) => ({
          verseId,
          present,
          fragments: present ? [{ text, qlevel: 0 }] : [],
        })),
      },
    ],
  });
}

const LUKE = pt([
  ['LUKE.1.5', 'There was a priest named Zacharias.'],
  ['LUKE.1.6', 'They were both righteous before God.'],
  ['LUKE.1.7', 'They had no child, because Elizabeth was barren.'],
]);
const IDS = ['LUKE.1.5', 'LUKE.1.6', 'LUKE.1.7'];

function map(partial: Partial<StudyMap> = {}): StudyMap {
  return MapSchema.parse(partial);
}

describe('sections (Phase 3a)', () => {
  it('wholePassageSection spans first→last', () => {
    const s = wholePassageSection(IDS, 'sec-1');
    expect(s.startVerseId).toBe('LUKE.1.5');
    expect(s.endVerseId).toBe('LUKE.1.7');
    expect(s.name).toBe('');
  });

  it('sectionsMatchPassage: whole cover is valid; empty/stale are not', () => {
    expect(sectionsMatchPassage([wholePassageSection(IDS, 's')], IDS)).toBe(true);
    expect(sectionsMatchPassage([], IDS)).toBe(false);
    // A section referencing a verse the passage doesn't contain (e.g. after a
    // reference change) is stale.
    const stale: Section = { id: 's', startVerseId: 'JOHN.1.1', endVerseId: 'JOHN.1.3', name: '' };
    expect(sectionsMatchPassage([stale], IDS)).toBe(false);
  });

  it('sectionsMatchPassage rejects gaps and overlaps', () => {
    const gap: Section[] = [
      { id: 'a', startVerseId: 'LUKE.1.5', endVerseId: 'LUKE.1.5', name: '' },
      // missing v6
      { id: 'b', startVerseId: 'LUKE.1.7', endVerseId: 'LUKE.1.7', name: '' },
    ];
    expect(sectionsMatchPassage(gap, IDS)).toBe(false);

    const overlap: Section[] = [
      { id: 'a', startVerseId: 'LUKE.1.5', endVerseId: 'LUKE.1.6', name: '' },
      { id: 'b', startVerseId: 'LUKE.1.6', endVerseId: 'LUKE.1.7', name: '' },
    ];
    expect(sectionsMatchPassage(overlap, IDS)).toBe(false);
  });

  it('splitSectionAt cuts a section in two, preserving the first section', () => {
    const start = [{ ...wholePassageSection(IDS, 'sec-1'), name: 'The whole thing' }];
    const after = splitSectionAt(start, 'sec-1', 'LUKE.1.6', IDS, 'sec-2');
    const ordered = orderedSections(after, IDS);
    expect(ordered).toHaveLength(2);
    expect(ordered[0]).toMatchObject({
      id: 'sec-1',
      startVerseId: 'LUKE.1.5',
      endVerseId: 'LUKE.1.5',
      name: 'The whole thing',
    });
    expect(ordered[1]).toMatchObject({
      id: 'sec-2',
      startVerseId: 'LUKE.1.6',
      endVerseId: 'LUKE.1.7',
      name: '',
    });
    expect(sectionsMatchPassage(after, IDS)).toBe(true);
  });

  it('splitSectionAt is a no-op at the section start (not a real cut)', () => {
    const start = [wholePassageSection(IDS, 'sec-1')];
    expect(splitSectionAt(start, 'sec-1', 'LUKE.1.5', IDS, 'sec-2')).toEqual(start);
  });

  it('mergeSectionUp folds a section into the one above and keeps its name', () => {
    const split = splitSectionAt(
      [{ ...wholePassageSection(IDS, 'sec-1'), name: 'First' }],
      'sec-1',
      'LUKE.1.6',
      IDS,
      'sec-2',
    );
    const merged = mergeSectionUp(split, 'sec-2', IDS);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      id: 'sec-1',
      startVerseId: 'LUKE.1.5',
      endVerseId: 'LUKE.1.7',
      name: 'First',
    });
  });

  it('mergeSectionUp is a no-op for the first section', () => {
    const start = [wholePassageSection(IDS, 'sec-1')];
    expect(mergeSectionUp(start, 'sec-1', IDS)).toEqual(start);
  });

  it('renameSection updates only the target', () => {
    const two = splitSectionAt([wholePassageSection(IDS, 'a')], 'a', 'LUKE.1.6', IDS, 'b');
    const renamed = renameSection(two, 'b', 'Barrenness');
    expect(renamed.find((s) => s.id === 'b')?.name).toBe('Barrenness');
    expect(renamed.find((s) => s.id === 'a')?.name).toBe('');
  });

  it('sectionVerseIds returns the covered verses in order', () => {
    expect(sectionVerseIds(wholePassageSection(IDS, 's'), IDS)).toEqual(IDS);
  });
});

describe('marks (Phase 3b)', () => {
  const verse = allVerses(LUKE)[0]!; // "There was a priest named Zacharias."

  it('tokenizeVerse yields tokens with correct char offsets', () => {
    const toks = tokenizeVerse('There was a priest');
    expect(toks.map((t) => t.text)).toEqual(['There', 'was', 'a', 'priest']);
    expect(toks[0]).toEqual({ text: 'There', start: 0, end: 5 });
    expect(toks[3]).toEqual({ text: 'priest', start: 12, end: 18 });
  });

  it('makeVerseMark snapshots the whole verse, no span', () => {
    const m = makeVerseMark(verse, 'm1');
    expect(m).toEqual({
      id: 'm1',
      kind: 'verse',
      verseId: 'LUKE.1.5',
      text: 'There was a priest named Zacharias.',
    });
    expect(m.span).toBeUndefined();
  });

  it('makeSpanMark stores the exact substring at the char offsets', () => {
    // "priest" begins at offset 12 in the verse text.
    const start = 'There was a '.length;
    const end = start + 'priest'.length;
    const m = makeSpanMark('word', verse, start, end, 'm2');
    expect(m).toMatchObject({ kind: 'word', verseId: 'LUKE.1.5', span: { start, end }, text: 'priest' });
  });

  it('resolvedMarkText: valid span → substring; whole-verse → verse text', () => {
    const span = makeSpanMark('word', verse, 12, 18, 'm');
    expect(resolvedMarkText(span, verse)).toBe('priest');
    const whole = makeVerseMark(verse, 'm');
    expect(resolvedMarkText(whole, verse)).toBe('There was a priest named Zacharias.');
  });
});

describe('reconcileMarks (degrade-on-text-change, PLAN §4.3)', () => {
  const verse = allVerses(LUKE)[0]!;

  it('keeps a span mark when the underlying text is unchanged', () => {
    const m = makeSpanMark('word', verse, 12, 18, 'm'); // "priest"
    const result = reconcileMarks(map({ marks: [m] }), LUKE);
    expect(result.marks[0]).toEqual(m); // untouched
  });

  it('degrades a span mark to whole-verse when the text changes', () => {
    const m = makeSpanMark('phrase', verse, 12, 18, 'm'); // "priest" in WEBBE-ish
    // A different translation: the char offsets no longer point at "priest".
    const changed = pt([
      ['LUKE.1.5', 'In the days of Herod there was a certain priest.'],
      ['LUKE.1.6', 'They were both righteous before God.'],
      ['LUKE.1.7', 'They had no child, because Elizabeth was barren.'],
    ]);
    const result = reconcileMarks(map({ marks: [m] }), changed);
    const out = result.marks[0]!;
    expect(out.kind).toBe('verse');
    expect(out.span).toBeUndefined();
    expect(out.verseId).toBe('LUKE.1.5');
    expect(out.text).toBe('In the days of Herod there was a certain priest.');
  });

  it('degrades a span mark when its verse becomes a gap (present:false)', () => {
    const m = makeSpanMark('word', verse, 12, 18, 'm');
    const gapped = pt([
      ['LUKE.1.5', '', false],
      ['LUKE.1.6', 'They were both righteous before God.'],
      ['LUKE.1.7', 'They had no child, because Elizabeth was barren.'],
    ]);
    const out = reconcileMarks(map({ marks: [m] }), gapped).marks[0]!;
    expect(out.kind).toBe('verse');
    expect(out.span).toBeUndefined();
  });

  it('refreshes a whole-verse mark’s text snapshot to the current verse', () => {
    const stale = { id: 'm', kind: 'verse' as const, verseId: 'LUKE.1.5', text: 'old text' };
    const out = reconcileMarks(map({ marks: [stale] }), LUKE).marks[0]!;
    expect(out.text).toBe('There was a priest named Zacharias.');
  });

  it('leaves a mark whose verse is no longer in the passage untouched (never discards)', () => {
    const orphan = makeSpanMark('word', verse, 12, 18, 'm');
    const other = pt([['JOHN.1.1', 'In the beginning was the Word.']]);
    const out = reconcileMarks(map({ marks: [orphan] }), other).marks[0]!;
    expect(out).toEqual(orphan);
  });
});

describe('labels', () => {
  it('verseRefLabel renders a human reference', () => {
    expect(verseRefLabel('LUKE.1.5')).toBe('Luke 1:5');
    expect(verseRefLabel('PS.23.1')).toBe('Ps 23:1');
  });

  it('verseChipLabel is bare verse within a chapter, chapter:verse across chapters', () => {
    expect(verseChipLabel('LUKE.1.5', false)).toBe('5');
    expect(verseChipLabel('LUKE.2.10', true)).toBe('2:10');
  });
});
