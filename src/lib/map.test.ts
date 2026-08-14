import { describe, expect, it } from 'vitest';

import {
  mergeSectionUp,
  orderedSections,
  renameSection,
  sectionVerseIds,
  sectionsMatchPassage,
  splitSectionAt,
  verseChipLabel,
  verseRefLabel,
  wholePassageSection,
} from '@/lib/map';
import { type Section } from '@/types/study';

const IDS = ['LUKE.1.5', 'LUKE.1.6', 'LUKE.1.7'];

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
