import { describe, expect, it } from 'vitest';

import { buildReaderModel, manuscriptModel } from '@/v2/reader/model';
import { ParsedTextSchema, type ParsedText } from '@/types/passage';
import type { Section } from '@/types/study';

/** Two prose paragraphs: Luke 1:5–7 and 1:8–10. */
const LUKE: ParsedText = ParsedTextSchema.parse({
  translationId: 'webbe',
  reference: 'Luke 1:5-10',
  blocks: [
    {
      kind: 'p',
      verses: [
        { verseId: 'LUKE.1.5', present: true, fragments: [{ text: 'Zacharias, a priest.', qlevel: 0 }] },
        { verseId: 'LUKE.1.6', present: true, fragments: [{ text: 'Both righteous.', qlevel: 0 }] },
        { verseId: 'LUKE.1.7', present: true, fragments: [{ text: 'No child.', qlevel: 0 }] },
      ],
    },
    {
      kind: 'p',
      verses: [
        { verseId: 'LUKE.1.8', present: true, fragments: [{ text: 'He served.', qlevel: 0 }] },
        { verseId: 'LUKE.1.9', present: true, fragments: [{ text: 'His lot fell.', qlevel: 0 }] },
        { verseId: 'LUKE.1.10', present: true, fragments: [{ text: 'The crowd prayed.', qlevel: 0 }] },
      ],
    },
  ],
});

/** A poetry passage with a superscription, an editorial heading, and an omitted verse. */
const PSALM: ParsedText = ParsedTextSchema.parse({
  translationId: 'webbe',
  reference: 'Psalm 23',
  blocks: [
    { kind: 'd', text: [{ text: 'A Psalm of David.', qlevel: 0 }], verses: [] },
    {
      kind: 'q',
      verses: [
        {
          verseId: 'PS.23.1',
          present: true,
          fragments: [
            { text: 'The LORD is my shepherd;', qlevel: 1 },
            { text: 'I shall not want.', qlevel: 2 },
          ],
        },
        { verseId: 'PS.23.2', present: true, fragments: [{ text: 'He makes me lie down.', qlevel: 1 }] },
      ],
    },
    { kind: 's1', text: [{ text: 'Through the valley', qlevel: 0 }], verses: [] },
    {
      kind: 'q',
      verses: [
        { verseId: 'PS.23.3', present: true, fragments: [{ text: 'He restores my soul.', qlevel: 1 }] },
        { verseId: 'PS.23.4', present: false, fragments: [] },
      ],
    },
  ],
});

describe('buildReaderModel — undivided passage', () => {
  it('renders one implicit band spanning the whole passage', () => {
    const model = buildReaderModel(LUKE, []);
    expect(model.bands).toHaveLength(1);
    const band = model.bands[0]!;
    expect(band.sectionId).toBe('');
    expect(band.canMergeUp).toBe(false);
    expect(band.ref).toBe('Luke 1:5–10');
    // One prose group per source paragraph.
    expect(band.groups.map((g) => g.kind)).toEqual(['prose', 'prose']);
    expect(model.firstVerseOfBand).toEqual(new Set(['LUKE.1.5']));
    expect(model.verseIds).toEqual([
      'LUKE.1.5',
      'LUKE.1.6',
      'LUKE.1.7',
      'LUKE.1.8',
      'LUKE.1.9',
      'LUKE.1.10',
    ]);
  });
});

describe('buildReaderModel — divided at a mid-paragraph boundary', () => {
  const sections: Section[] = [
    { id: 'a', startVerseId: 'LUKE.1.5', endVerseId: 'LUKE.1.5', name: 'Introduction' },
    { id: 'b', startVerseId: 'LUKE.1.6', endVerseId: 'LUKE.1.10', name: 'The rest' },
  ];

  it('splits the first paragraph across the two bands', () => {
    const model = buildReaderModel(LUKE, sections);
    expect(model.bands.map((b) => b.sectionId)).toEqual(['a', 'b']);

    const [first, second] = model.bands;
    expect(first!.name).toBe('Introduction');
    expect(first!.ref).toBe('Luke 1:5');
    expect(first!.canMergeUp).toBe(false);
    // Only v5 lands in the first band — the paragraph is cut mid-block.
    expect(first!.groups).toHaveLength(1);
    expect((first!.groups[0] as { verses: { verseId: string }[] }).verses.map((v) => v.verseId)).toEqual([
      'LUKE.1.5',
    ]);

    expect(second!.name).toBe('The rest');
    expect(second!.ref).toBe('Luke 1:6–10');
    expect(second!.canMergeUp).toBe(true);
    // The remainder of paragraph one (v6–7) plus paragraph two (v8–10) → two prose groups.
    expect(second!.groups.map((g) => g.kind)).toEqual(['prose', 'prose']);
    expect((second!.groups[0] as { verses: { verseId: string }[] }).verses.map((v) => v.verseId)).toEqual([
      'LUKE.1.6',
      'LUKE.1.7',
    ]);

    expect(model.firstVerseOfBand).toEqual(new Set(['LUKE.1.5', 'LUKE.1.6']));
  });

  it('falls back to one band when sections do not tile the passage', () => {
    const stale: Section[] = [
      { id: 'x', startVerseId: 'JOHN.1.1', endVerseId: 'JOHN.1.3', name: 'stale' },
    ];
    const model = buildReaderModel(LUKE, stale);
    expect(model.bands).toHaveLength(1);
    expect(model.bands[0]!.sectionId).toBe('');
  });
});

describe('buildReaderModel — poetry, superscription, heading, gaps', () => {
  it('keeps poetry lines, attaches headings to the following verse, and honours gaps', () => {
    const model = buildReaderModel(PSALM, []);
    expect(model.bands).toHaveLength(1);
    const band = model.bands[0]!;
    expect(band.ref).toBe('Ps 23:1–4');
    expect(band.groups.map((g) => g.kind)).toEqual(['super', 'poetry', 'heading', 'poetry']);

    const superGroup = band.groups[0] as { text: string };
    expect(superGroup.text).toBe('A Psalm of David.');

    const heading = band.groups[2] as { level: string; text: string };
    expect(heading.level).toBe('s1');
    expect(heading.text).toBe('Through the valley');

    // v1's two poetry lines keep their indents.
    const firstPoetry = band.groups[1] as { verses: { verseId: string; lines: { indent: number }[] }[] };
    expect(firstPoetry.verses[0]!.lines.map((l) => l.indent)).toEqual([1, 2]);

    // The omitted verse is present:false with no rendered lines.
    const lastPoetry = band.groups[3] as { verses: { verseId: string; present: boolean; lines: unknown[] }[] };
    const gap = lastPoetry.verses.find((v) => v.verseId === 'PS.23.4')!;
    expect(gap.present).toBe(false);
    expect(gap.lines).toEqual([]);
  });
});

describe('buildReaderModel — empty passage', () => {
  it('returns an empty model', () => {
    const empty = ParsedTextSchema.parse({ translationId: 'webbe', blocks: [] });
    const model = buildReaderModel(empty, []);
    expect(model.bands).toEqual([]);
    expect(model.verseIds).toEqual([]);
  });
});

describe('manuscriptModel — flatten to one continuous flow', () => {
  it('keeps the section bands (owner: sections show in every mode), flattening the text within each', () => {
    const sections: Section[] = [
      { id: 'a', startVerseId: 'LUKE.1.5', endVerseId: 'LUKE.1.7', name: 'Introduction' },
      { id: 'b', startVerseId: 'LUKE.1.8', endVerseId: 'LUKE.1.10', name: 'The service' },
    ];
    const model = manuscriptModel(buildReaderModel(LUKE, sections));
    // Both bands survive, with their ids + names.
    expect(model.bands.map((b) => b.sectionId)).toEqual(['a', 'b']);
    expect(model.bands.map((b) => b.name)).toEqual(['Introduction', 'The service']);
    // Each band flattens to one continuous prose group.
    for (const band of model.bands) expect(band.groups.map((g) => g.kind)).toEqual(['prose']);
    const first = model.bands[0]!.groups[0] as { verses: { verseId: string }[] };
    expect(first.verses.map((v) => v.verseId)).toEqual(['LUKE.1.5', 'LUKE.1.6', 'LUKE.1.7']);
    // Verse ids (the selection basis) are untouched.
    expect(model.verseIds).toEqual(buildReaderModel(LUKE, sections).verseIds);
  });

  it('flattens poetry to prose, keeps the superscription + verse numbers, drops the heading', () => {
    const model = manuscriptModel(buildReaderModel(PSALM, []));
    const band = model.bands[0]!;
    // The superscription (scripture) survives; the editorial heading does not; poetry becomes prose.
    expect(band.groups.map((g) => g.kind)).toEqual(['super', 'prose']);

    const prose = band.groups[1] as {
      verses: { verseId: string; number: string; present: boolean; lines: { indent: number }[] }[];
    };
    // Every present verse is now a single inline (indent-0) line — no poetry indents remain.
    for (const v of prose.verses) {
      if (v.present) expect(v.lines.map((l) => l.indent)).toEqual([0]);
    }
    // Verse numbers are kept (the one marker manuscript retains) and the gap verse survives.
    expect(prose.verses.map((v) => v.number)).toEqual(['1', '2', '3', '4']);
    expect(prose.verses.find((v) => v.verseId === 'PS.23.4')!.present).toBe(false);
  });

  it('is a no-op-shaped transform on an empty model', () => {
    const empty = ParsedTextSchema.parse({ translationId: 'webbe', blocks: [] });
    const model = manuscriptModel(buildReaderModel(empty, []));
    expect(model.bands).toEqual([]);
  });
});
