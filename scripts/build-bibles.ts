/**
 * Build the bundled Bibles (PLAN §4.5): eBible.org USFM → per-book block/line JSON in
 * `public/bibles/<translation>/<book>.json`, plus a `manifest.json`. Run with:
 *
 *     npm run build:bibles
 *
 * Extends `twice-daily`'s pipeline via the shared pure parser in `src/lib/bible/usfm.ts`
 * (poetry-line arrays, `\s` headings, tagged footnotes/xrefs/`\wj`, canonical IDs,
 * `versification:'kjv'`, per-verse `present` flag, NFC). The generated JSON is committed
 * to the repo and served as static assets (runtime-cached by the PWA, not precached).
 *
 * ## Pinning (PLAN §4.5 / PROGRESS risk)
 * The eBible.org WEBBE (`engwebpb`) text still updates; the ASV (`eng-asv`) is stable.
 * The sources live on disk at `~/Documents/Projects/dailyOffice/*_usfm` — the same eBible
 * releases `twice-daily` ships. Record the exact eBible release/date here when a formal
 * pin is taken. **BSB is deferred** (not in the eBible sources; its USFM source is an
 * open question — PLAN §8 #4).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseUsfmBook } from '@/lib/bible/usfm';
import { findBookById, findBookByUsfm } from '@/lib/verse/books';

const DATA_DIR = path.join(process.env.HOME ?? '', 'Documents/Projects/dailyOffice');
const OUT_ROOT = path.resolve(import.meta.dirname, '..', 'public', 'bibles');

interface TranslationSource {
  id: string; // our translation id + output folder
  name: string;
  shortName: string;
  copyrightLine: string;
  sourceDir: string; // eBible USFM folder under DATA_DIR
  ebibleId: string; // eBible.org project id (for the pin record)
}

// WEBBE + ASV only: both are public-domain and present in the local eBible sources.
// BSB is deferred until its USFM source is confirmed (PLAN §8 #4).
const TRANSLATIONS: TranslationSource[] = [
  {
    id: 'webbe',
    name: 'World English Bible British Edition',
    shortName: 'WEBBE',
    copyrightLine: 'World English Bible British Edition (WEBBE). Public domain.',
    sourceDir: 'engwebpb_usfm',
    ebibleId: 'engwebpb',
  },
  {
    id: 'asv',
    name: 'American Standard Version (1901)',
    shortName: 'ASV',
    copyrightLine: 'American Standard Version (1901). Public domain.',
    sourceDir: 'eng-asv_usfm',
    ebibleId: 'eng-asv',
  },
];

interface ManifestBook {
  id: string;
  name: string;
  chapters: number;
}
interface ManifestTranslation {
  id: string;
  name: string;
  shortName: string;
  copyrightLine: string;
  ebibleId: string;
  books: ManifestBook[];
}

function buildTranslation(t: TranslationSource): ManifestTranslation {
  const sourceDir = path.join(DATA_DIR, t.sourceDir);
  const outDir = path.join(OUT_ROOT, t.id);
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs
    .readdirSync(sourceDir)
    .filter((f) => f.endsWith('.usfm'))
    .filter((f) => !f.startsWith('00-')) // front matter
    .filter((f) => !f.startsWith('106-')) // glossary
    .sort();

  const books: ManifestBook[] = [];
  let processed = 0;
  let skipped = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(sourceDir, file), 'utf-8');
    // Resolve the book from the \id line up front so we can skip non-canon early.
    const idLine = content.split('\n').find((l) => l.startsWith('\\id '));
    const code = idLine?.slice(4).split(/\s/)[0] ?? '';
    const meta = findBookByUsfm(code);
    if (!meta) {
      skipped++;
      continue; // apocrypha / non-canon → not in our 66-book table
    }

    const book = parseUsfmBook(content, { translationId: t.id, book: meta });
    if (!book) {
      console.warn(`  SKIP ${file}: could not parse`);
      skipped++;
      continue;
    }

    fs.writeFileSync(path.join(outDir, `${book.bookId}.json`), JSON.stringify(book));
    books.push({ id: book.bookId, name: book.name, chapters: book.chapters.length });
    processed++;
  }

  books.sort(
    (a, b) => (findBookById(a.id)?.order ?? 0) - (findBookById(b.id)?.order ?? 0),
  );
  console.log(`${t.id}: ${processed} books written, ${skipped} skipped`);
  return {
    id: t.id,
    name: t.name,
    shortName: t.shortName,
    copyrightLine: t.copyrightLine,
    ebibleId: t.ebibleId,
    books,
  };
}

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`Source dir not found: ${DATA_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  const translations = TRANSLATIONS.map(buildTranslation);
  const manifest = {
    generatedFrom: 'eBible.org USFM (local twice-daily sources)',
    note: 'WEBBE + ASV. BSB deferred (PLAN §8 #4). versification: kjv.',
    translations,
  };
  fs.writeFileSync(path.join(OUT_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`manifest.json written (${translations.length} translations)`);
}

main();
