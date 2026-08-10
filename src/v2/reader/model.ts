import type { Fragment, ParsedText, VerseSpan } from '@/types/passage';
import { verseIds } from '@/types/passage';
import { orderedSections, passageIsMultiChapter, sectionsMatchPassage } from '@/lib/map';
import { parseVerseId } from '@/lib/verse/ids';
import type { Section } from '@/types/study';

/**
 * The reader render model (v2.2, ROADMAP-v2 §1) — turns a parsed reading plus the study's
 * sections into a **verse-driven render grouped into named section bands**. It is the pure,
 * unit-tested core the Map-lens page renders; the page stays a thin component (house rule).
 *
 * Because v2 sections can divide the passage at **any verse boundary** (owner decision — the
 * v2.5 verse-driven render pulled forward), a single prose paragraph can straddle a section
 * break. The model therefore splits a block's verses into separate groups wherever the band
 * changes, so a mid-paragraph break renders as two paragraphs under two section headers while
 * poetry keeps its lines and indents. Editorial headings, Psalm superscriptions, and blank
 * spacers are kept (never dropped) and attached to the band of the verse that follows them.
 *
 * When the stored sections don't tile the loaded passage (a fresh study, or a reference
 * change), the whole passage renders as **one undivided band** with `sectionId: ''`; the page
 * materialises a real whole-passage section on the first divide.
 */

export interface ReaderLine {
  /** 0 = prose/inline, ≥1 = a poetry line at that indent. */
  indent: number;
  frags: Fragment[];
}

export interface ReaderVerse {
  verseId: string;
  present: boolean;
  /** The verse number as a string (e.g. "5"); '' if the id can't be parsed. */
  number: string;
  /** Rendered lines; empty for an omitted ("gap") verse. */
  lines: ReaderLine[];
}

export type ReaderGroup =
  | { kind: 'prose'; verses: ReaderVerse[] }
  | { kind: 'poetry'; verses: ReaderVerse[] }
  | { kind: 'heading'; level: 's1' | 's2'; text: string }
  | { kind: 'super'; text: string }
  | { kind: 'space' };

export interface ReaderBand {
  /** '' when the passage is undivided (the single implicit band). */
  sectionId: string;
  name: string;
  startVerseId: string;
  endVerseId: string;
  /** Human range label, e.g. "Luke 1:5–7" or "Luke 1:80–2:2". */
  ref: string;
  groups: ReaderGroup[];
  /** False for the first band (nothing above to merge into). */
  canMergeUp: boolean;
}

export interface ReaderModel {
  bands: ReaderBand[];
  /** Every verse id in passage order (present + gaps). */
  verseIds: string[];
  /** Verse ids that begin a band — no "divide here" affordance renders before these. */
  firstVerseOfBand: Set<string>;
  /** True when the passage spans more than one chapter (affects range labels). */
  multiChapter: boolean;
}

/** Split a verse's fragments into rendered lines (prose flows inline; each poetry line is
 *  its own line at its indent) — mirrors the v1 PassageView logic, kept pure here. */
export function verseToLines(span: VerseSpan): ReaderLine[] {
  const lines: ReaderLine[] = [];
  let inline: Fragment[] | null = null;
  for (const f of span.fragments) {
    if (f.qlevel >= 1) {
      inline = null;
      lines.push({ indent: f.qlevel, frags: [f] });
    } else {
      if (!inline) {
        inline = [];
        lines.push({ indent: 0, frags: inline });
      }
      inline.push(f);
    }
  }
  return lines;
}

function fragText(frags: Fragment[] | undefined): string {
  return (frags ?? [])
    .map((f) => f.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toReaderVerse(span: VerseSpan): ReaderVerse {
  return {
    verseId: span.verseId,
    present: span.present,
    number: String(parseVerseId(span.verseId)?.verse ?? ''),
    lines: span.present ? verseToLines(span) : [],
  };
}

/** Range label for a band, e.g. "Luke 1:5", "Luke 1:5–7", or "Luke 1:80–2:2". */
function rangeRef(startId: string, endId: string): string {
  const s = parseVerseId(startId);
  const e = parseVerseId(endId);
  if (!s || !e) return startId;
  const book = s.book.shortName;
  if (startId === endId) return `${book} ${s.chapter}:${s.verse}${s.suffix}`;
  if (s.chapter === e.chapter) {
    return `${book} ${s.chapter}:${s.verse}${s.suffix}–${e.verse}${e.suffix}`;
  }
  return `${book} ${s.chapter}:${s.verse}${s.suffix}–${e.chapter}:${e.verse}${e.suffix}`;
}

interface BandSpec {
  id: string;
  name: string;
  start: string;
  end: string;
}

/** Build the reader render model from a passage and its (possibly empty/mismatched) sections. */
export function buildReaderModel(passage: ParsedText, sections: Section[]): ReaderModel {
  const pvIds = verseIds(passage);
  if (pvIds.length === 0) {
    return { bands: [], verseIds: [], firstVerseOfBand: new Set(), multiChapter: false };
  }

  const valid = sectionsMatchPassage(sections, pvIds);
  const specs: BandSpec[] = valid
    ? orderedSections(sections, pvIds).map((s) => ({
        id: s.id,
        name: s.name,
        start: s.startVerseId,
        end: s.endVerseId,
      }))
    : [{ id: '', name: '', start: pvIds[0]!, end: pvIds[pvIds.length - 1]! }];

  // Map each verse id → its band index (bands tile the passage in canonical order).
  const bandOfVerse = new Map<string, number>();
  const idx = new Map(pvIds.map((id, i) => [id, i]));
  specs.forEach((spec, b) => {
    const lo = idx.get(spec.start) ?? 0;
    const hi = idx.get(spec.end) ?? pvIds.length - 1;
    for (let i = lo; i <= hi; i++) bandOfVerse.set(pvIds[i]!, b);
  });

  // First-verse band index of each block (null for verse-less blocks), used to attach
  // headings/superscriptions to the band of the *following* verse.
  const blockFirstBand = passage.blocks.map((block) => {
    const first = block.verses[0];
    return first ? (bandOfVerse.get(first.verseId) ?? 0) : null;
  });
  const nextBandFrom = (afterIdx: number): number => {
    for (let j = afterIdx + 1; j < blockFirstBand.length; j++) {
      const fb = blockFirstBand[j];
      if (fb != null) return fb;
    }
    return specs.length - 1;
  };

  const bandGroups: ReaderGroup[][] = specs.map(() => []);

  passage.blocks.forEach((block, bi) => {
    if (block.verses.length > 0) {
      // Split the block's verses into runs of equal band index (a run may be cut short by a
      // mid-block section break), each becoming one prose paragraph or poetry group.
      const kind: 'prose' | 'poetry' = block.kind === 'q' ? 'poetry' : 'prose';
      let run: ReaderVerse[] = [];
      let runBand = -1;
      const flush = () => {
        if (run.length > 0 && runBand >= 0) {
          bandGroups[runBand]!.push({ kind, verses: run });
        }
        run = [];
      };
      for (const v of block.verses) {
        const b = bandOfVerse.get(v.verseId) ?? 0;
        if (b !== runBand) {
          flush();
          runBand = b;
        }
        run.push(toReaderVerse(v));
      }
      flush();
      return;
    }

    // Verse-less block: a blank spacer, a superscription, or an editorial heading.
    const target = nextBandFrom(bi);
    if (block.kind === 'b') {
      bandGroups[target]!.push({ kind: 'space' });
    } else if (block.kind === 'd') {
      bandGroups[target]!.push({ kind: 'super', text: fragText(block.text) });
    } else if (block.kind === 's1' || block.kind === 's2') {
      bandGroups[target]!.push({ kind: 'heading', level: block.kind, text: fragText(block.text) });
    }
  });

  const bands: ReaderBand[] = specs.map((spec, i) => ({
    sectionId: spec.id,
    name: spec.name,
    startVerseId: spec.start,
    endVerseId: spec.end,
    ref: rangeRef(spec.start, spec.end),
    groups: bandGroups[i]!,
    canMergeUp: i > 0,
  }));

  return {
    bands,
    verseIds: pvIds,
    firstVerseOfBand: new Set(specs.map((s) => s.start)),
    multiChapter: passageIsMultiChapter(passage),
  };
}

/**
 * The **Manuscript** reading transform (v2.5) — collapse the formatted render into one continuous
 * flow: poetry flattened to running prose, editorial headings + blank spacers dropped, and the
 * section bands ignored (the whole passage becomes a single unnamed band). The verse **numbers**
 * survive — the one marker the manuscript keeps — as do Psalm superscriptions (they are text, not
 * editorial). It is **display-only**: the underlying sections, annotations, and verse anchors are
 * untouched, and the same `verseIds` flow through, so selection and two-way hover keep working.
 */
export function manuscriptModel(model: ReaderModel): ReaderModel {
  const groups: ReaderGroup[] = [];
  let run: ReaderVerse[] = [];
  const flush = () => {
    if (run.length > 0) groups.push({ kind: 'prose', verses: run });
    run = [];
  };
  for (const band of model.bands) {
    for (const g of band.groups) {
      if (g.kind === 'prose' || g.kind === 'poetry') {
        for (const v of g.verses) run.push(flattenVerse(v));
      } else if (g.kind === 'super') {
        flush(); // a superscription (scripture) interrupts the flow; keep it, drop editorial chrome
        groups.push(g);
      }
      // 'heading' + 'space' are editorial scaffolding — dropped in manuscript.
    }
  }
  flush();

  const first = model.verseIds[0] ?? '';
  const last = model.verseIds[model.verseIds.length - 1] ?? '';
  const band: ReaderBand = {
    sectionId: '',
    name: '',
    startVerseId: first,
    endVerseId: last,
    ref: first ? rangeRef(first, last) : '',
    groups,
    canMergeUp: false,
  };
  return {
    ...model,
    bands: model.bands.length > 0 ? [band] : [],
    firstVerseOfBand: new Set(first ? [first] : []),
  };
}

/** Flatten a verse's rendered lines into one inline (indent-0) line, joining former poetry lines
 *  with a space so they read continuously. Red-letter (`wj`) is preserved on each fragment; an
 *  omitted ("gap") verse keeps its empty lines. */
function flattenVerse(v: ReaderVerse): ReaderVerse {
  if (!v.present) return v;
  const frags: Fragment[] = [];
  v.lines.forEach((line, i) => {
    if (i > 0) frags.push({ text: ' ', qlevel: 0 });
    for (const f of line.frags) frags.push({ ...f, qlevel: 0 });
  });
  return { ...v, lines: frags.length > 0 ? [{ indent: 0, frags }] : [] };
}
