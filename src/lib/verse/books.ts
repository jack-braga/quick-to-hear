import type { Genre } from '@/types/study';

/**
 * Canonical 66-book table (PLAN §4.3). One row per Protestant-canon book, mapping the
 * three codes we need to move between:
 *
 * - **`osis`** — what `bcv_parser` emits (e.g. `Luke`, `Ps`, `3John`). The verse-ID
 *   book part is this uppercased (`LUKE`, `PS`, `3JOHN`) — see `@/lib/verse/ids`.
 * - **`usfm`** — the 3-letter code in a USFM `\id` line (drives `scripts/build-bibles`).
 * - **`id`** — the slug used for the per-book JSON file name (`luke.json`, `3-john.json`).
 *
 * `genre` is the Phase-1 **inference default** (SPEC Phase 1: inferred, shown for
 * confirmation, always overridable). The mapping is deliberately coarse to fit the six
 * genres: Jonah → narrative, Lamentations → wisdom/poetry, Daniel → prophetic.
 */
export interface BookMeta {
  order: number; // 1..66 canonical
  id: string; // slug / file name
  osis: string; // bcv_parser book code
  usfm: string; // USFM \id code
  name: string; // display name
  shortName: string; // compact display
  genre: Genre;
}

// [order, id, osis, usfm, name, shortName, genre]
type Row = [number, string, string, string, string, string, Genre];

const N: Genre = 'ot-narrative';
const W: Genre = 'wisdom-poetry';
const P: Genre = 'prophetic';
const G: Genre = 'gospels-acts';
const E: Genre = 'epistles';
const A: Genre = 'apocalyptic';

const ROWS: Row[] = [
  [1, 'genesis', 'Gen', 'GEN', 'Genesis', 'Gen', N],
  [2, 'exodus', 'Exod', 'EXO', 'Exodus', 'Exod', N],
  [3, 'leviticus', 'Lev', 'LEV', 'Leviticus', 'Lev', N],
  [4, 'numbers', 'Num', 'NUM', 'Numbers', 'Num', N],
  [5, 'deuteronomy', 'Deut', 'DEU', 'Deuteronomy', 'Deut', N],
  [6, 'joshua', 'Josh', 'JOS', 'Joshua', 'Josh', N],
  [7, 'judges', 'Judg', 'JDG', 'Judges', 'Judg', N],
  [8, 'ruth', 'Ruth', 'RUT', 'Ruth', 'Ruth', N],
  [9, '1-samuel', '1Sam', '1SA', '1 Samuel', '1 Sam', N],
  [10, '2-samuel', '2Sam', '2SA', '2 Samuel', '2 Sam', N],
  [11, '1-kings', '1Kgs', '1KI', '1 Kings', '1 Kgs', N],
  [12, '2-kings', '2Kgs', '2KI', '2 Kings', '2 Kgs', N],
  [13, '1-chronicles', '1Chr', '1CH', '1 Chronicles', '1 Chr', N],
  [14, '2-chronicles', '2Chr', '2CH', '2 Chronicles', '2 Chr', N],
  [15, 'ezra', 'Ezra', 'EZR', 'Ezra', 'Ezra', N],
  [16, 'nehemiah', 'Neh', 'NEH', 'Nehemiah', 'Neh', N],
  [17, 'esther', 'Esth', 'EST', 'Esther', 'Esth', N],
  [18, 'job', 'Job', 'JOB', 'Job', 'Job', W],
  [19, 'psalms', 'Ps', 'PSA', 'Psalms', 'Ps', W],
  [20, 'proverbs', 'Prov', 'PRO', 'Proverbs', 'Prov', W],
  [21, 'ecclesiastes', 'Eccl', 'ECC', 'Ecclesiastes', 'Eccl', W],
  [22, 'song-of-solomon', 'Song', 'SNG', 'Song of Solomon', 'Song', W],
  [23, 'isaiah', 'Isa', 'ISA', 'Isaiah', 'Isa', P],
  [24, 'jeremiah', 'Jer', 'JER', 'Jeremiah', 'Jer', P],
  [25, 'lamentations', 'Lam', 'LAM', 'Lamentations', 'Lam', W],
  [26, 'ezekiel', 'Ezek', 'EZK', 'Ezekiel', 'Ezek', P],
  [27, 'daniel', 'Dan', 'DAN', 'Daniel', 'Dan', P],
  [28, 'hosea', 'Hos', 'HOS', 'Hosea', 'Hos', P],
  [29, 'joel', 'Joel', 'JOL', 'Joel', 'Joel', P],
  [30, 'amos', 'Amos', 'AMO', 'Amos', 'Amos', P],
  [31, 'obadiah', 'Obad', 'OBA', 'Obadiah', 'Obad', P],
  [32, 'jonah', 'Jonah', 'JON', 'Jonah', 'Jonah', N],
  [33, 'micah', 'Mic', 'MIC', 'Micah', 'Mic', P],
  [34, 'nahum', 'Nah', 'NAM', 'Nahum', 'Nah', P],
  [35, 'habakkuk', 'Hab', 'HAB', 'Habakkuk', 'Hab', P],
  [36, 'zephaniah', 'Zeph', 'ZEP', 'Zephaniah', 'Zeph', P],
  [37, 'haggai', 'Hag', 'HAG', 'Haggai', 'Hag', P],
  [38, 'zechariah', 'Zech', 'ZEC', 'Zechariah', 'Zech', P],
  [39, 'malachi', 'Mal', 'MAL', 'Malachi', 'Mal', P],
  [40, 'matthew', 'Matt', 'MAT', 'Matthew', 'Matt', G],
  [41, 'mark', 'Mark', 'MRK', 'Mark', 'Mark', G],
  [42, 'luke', 'Luke', 'LUK', 'Luke', 'Luke', G],
  [43, 'john', 'John', 'JHN', 'John', 'John', G],
  [44, 'acts', 'Acts', 'ACT', 'Acts', 'Acts', G],
  [45, 'romans', 'Rom', 'ROM', 'Romans', 'Rom', E],
  [46, '1-corinthians', '1Cor', '1CO', '1 Corinthians', '1 Cor', E],
  [47, '2-corinthians', '2Cor', '2CO', '2 Corinthians', '2 Cor', E],
  [48, 'galatians', 'Gal', 'GAL', 'Galatians', 'Gal', E],
  [49, 'ephesians', 'Eph', 'EPH', 'Ephesians', 'Eph', E],
  [50, 'philippians', 'Phil', 'PHP', 'Philippians', 'Phil', E],
  [51, 'colossians', 'Col', 'COL', 'Colossians', 'Col', E],
  [52, '1-thessalonians', '1Thess', '1TH', '1 Thessalonians', '1 Thess', E],
  [53, '2-thessalonians', '2Thess', '2TH', '2 Thessalonians', '2 Thess', E],
  [54, '1-timothy', '1Tim', '1TI', '1 Timothy', '1 Tim', E],
  [55, '2-timothy', '2Tim', '2TI', '2 Timothy', '2 Tim', E],
  [56, 'titus', 'Titus', 'TIT', 'Titus', 'Titus', E],
  [57, 'philemon', 'Phlm', 'PHM', 'Philemon', 'Phlm', E],
  [58, 'hebrews', 'Heb', 'HEB', 'Hebrews', 'Heb', E],
  [59, 'james', 'Jas', 'JAS', 'James', 'Jas', E],
  [60, '1-peter', '1Pet', '1PE', '1 Peter', '1 Pet', E],
  [61, '2-peter', '2Pet', '2PE', '2 Peter', '2 Pet', E],
  [62, '1-john', '1John', '1JN', '1 John', '1 John', E],
  [63, '2-john', '2John', '2JN', '2 John', '2 John', E],
  [64, '3-john', '3John', '3JN', '3 John', '3 John', E],
  [65, 'jude', 'Jude', 'JUD', 'Jude', 'Jude', E],
  [66, 'revelation', 'Rev', 'REV', 'Revelation', 'Rev', A],
];

export const BOOKS: BookMeta[] = ROWS.map(
  ([order, id, osis, usfm, name, shortName, genre]) => ({
    order,
    id,
    osis,
    usfm,
    name,
    shortName,
    genre,
  }),
);

const byId = new Map(BOOKS.map((b) => [b.id, b]));
const byOsis = new Map(BOOKS.map((b) => [b.osis, b]));
const byOsisUpper = new Map(BOOKS.map((b) => [b.osis.toUpperCase(), b]));
const byUsfm = new Map(BOOKS.map((b) => [b.usfm.toUpperCase(), b]));

export function findBookById(id: string): BookMeta | undefined {
  return byId.get(id);
}

/** Look up by `bcv_parser`'s OSIS book code (e.g. `Luke`, `3John`). */
export function findBookByOsis(osis: string): BookMeta | undefined {
  return byOsis.get(osis) ?? byOsisUpper.get(osis.toUpperCase());
}

/** Look up by USFM `\id` code (e.g. `LUK`) — used by the build pipeline. */
export function findBookByUsfm(usfm: string): BookMeta | undefined {
  return byUsfm.get(usfm.toUpperCase());
}

/** The Phase-1 inferred genre default for a book (always user-overridable). */
export function inferGenreForBook(bookId: string): Genre | null {
  return byId.get(bookId)?.genre ?? null;
}
