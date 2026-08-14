import { describe, expect, it } from 'vitest';

import { analysePaste, assembleParsedText, looksLikeTranslationName } from '@/lib/paste';
import type { AssembleContext, PasteSegment } from '@/lib/paste';
import { parseReference } from '@/lib/verse/reference';
import { allVerses, verseIds, verseText } from '@/types/passage';

import magnificat from './__fixtures__/bg-luke1-magnificat-webbe.txt?raw';
import psalm23 from './__fixtures__/bg-psalm23-asv.txt?raw';
import birth from './__fixtures__/bg-luke1-birth-webbe.txt?raw';
import psalm1 from './__fixtures__/bg-psalm1-webbe.txt?raw';
import ephesians from './__fixtures__/bg-ephesians1-webbe.txt?raw';
import psalm80 from './__fixtures__/bg-psalm80-webbe.txt?raw';
import crossChapter from './__fixtures__/bg-luke1-2-crosschapter-webbe.txt?raw';
import yvJonah from './__fixtures__/yv-jonah1-webbe.txt?raw';

/** Analyse a paste then assemble it into a ParsedText, deriving the anchoring context
 *  from the recovered reference (as the review screen does once the user accepts). */
function run(raw: string) {
  const analysis = analysePaste(raw);
  const ref = parseReference(analysis.detectedReference ?? '');
  const ctx: AssembleContext = {
    bookOsis: ref?.start.book.osis ?? 'PS',
    startChapter: ref?.start.chapter ?? 1,
    translationId: analysis.detectedTranslationId ?? 'pasted',
    reference: analysis.detectedReference ?? '',
  };
  return { analysis, passage: assembleParsedText(analysis.segments, ctx) };
}

describe('analysePaste — chrome, reference, translation recovery', () => {
  it('recovers the leading reference and bundled translation, strips them as chrome', () => {
    const { analysis } = run(magnificat);
    expect(analysis.detectedReference).toBe('Luke 1:46-56');
    expect(analysis.detectedTranslationId).toBe('webbe');
    expect(analysis.detectedTranslationName).toBe('World English Bible British Edition');
    expect(analysis.droppedChrome.join('\n')).toMatch(/Luke 1:46-56/);
    expect(analysis.droppedChrome.join('\n')).toMatch(/World English Bible/);
  });

  it('strips "Read full chapter" and captures the Footnotes block as notes', () => {
    const { analysis } = run(magnificat);
    expect(analysis.droppedChrome.some((l) => /read full chapter/i.test(l))).toBe(true);
    // The footnote body is captured, keyed by its reference — not left in the text.
    expect(analysis.notes).toEqual([
      { ref: 'Luke 1:54', text: '“Israel” here refers to the nation, not the man.' },
    ]);
    // Its inline marker [a] is gone from the verse text.
    expect(analysis.segments.every((s) => !/\[a\]/.test(s.text))).toBe(true);
  });

  it('matches the ASV translation name too', () => {
    const { analysis } = run(psalm23);
    expect(analysis.detectedReference).toBe('Psalm 23');
    expect(analysis.detectedTranslationId).toBe('asv');
  });
});

describe('analysePaste — structure detection', () => {
  it('detects the section heading (Mary’s song)', () => {
    const { analysis } = run(magnificat);
    const headings = analysis.segments.filter((s) => s.kind === 'heading').map((s) => s.text);
    expect(headings).toContain('Mary’s song');
  });

  it('detects a mid-body heading in prose (The birth of John the Baptist)', () => {
    const { analysis } = run(birth);
    const headings = analysis.segments.filter((s) => s.kind === 'heading').map((s) => s.text);
    expect(headings).toContain('The birth of John the Baptist');
  });

  it('preserves poetry lines as separate segments, not one collapsed run', () => {
    const { analysis } = run(magnificat);
    const poetry = analysis.segments.filter((s) => s.kind === 'poetry');
    // Several distinct poetry lines survive (the parallelism is not flattened).
    expect(poetry.length).toBeGreaterThan(8);
    // At least one carries a deeper indent (the "    My spirit…" continuation lines).
    expect(poetry.some((s) => s.indent >= 1)).toBe(true);
  });

  it('splits a flowing prose paragraph into one verse per number, in sequence', () => {
    const { analysis } = run(birth);
    const nums = analysis.segments.filter((s) => s.startsVerse).map((s) => s.verseNumber);
    expect(nums).toEqual([57, 58, 59, 60, 61, 62, 63, 64, 65, 66]);
    expect(analysis.segments.every((s) => !s.flagged)).toBe(true); // clean, monotonic
  });
});

describe('assembleParsedText — a pasted passage matches the bundled model', () => {
  it('anchors verse ids to the kjv versification from the reference', () => {
    const { passage } = run(birth);
    expect(verseIds(passage)).toEqual(
      Array.from({ length: 10 }, (_, i) => `LUKE.1.${57 + i}`),
    );
    expect(passage.versification).toBe('kjv');
    expect(passage.translationId).toBe('webbe');
  });

  it('keeps a prose-opened song verse whole (no duplicated verse number across blocks)', () => {
    const { passage } = run(magnificat);
    const ids = verseIds(passage);
    // Every verse id appears exactly once even though v46 opens in prose then flows into
    // poetry (the Magnificat rendering bug this stage also fixed).
    expect(new Set(ids).size).toBe(ids.length);
    // v46 carries both its prose intro and the first sung line.
    const v46 = allVerses(passage).find((v) => v.verseId === 'LUKE.1.46')!;
    expect(verseText(v46)).toMatch(/Mary said/);
    expect(verseText(v46)).toMatch(/My soul magnifies/);
  });

  it('rounds the Psalm 23 poetry into a poetry block anchored PS.23.1..6', () => {
    const { passage } = run(psalm23);
    expect(verseIds(passage)).toEqual([1, 2, 3, 4, 5, 6].map((n) => `PS.23.${n}`));
    // The superscription line became an editorial heading (flagged for review).
    expect(passage.blocks.some((b) => b.editorial)).toBe(true);
  });
});

describe('genre variety — epistle prose + a superscription-less psalm', () => {
  it('splits a dense epistle paragraph (Ephesians 1:3-10) into eight prose verses', () => {
    const { analysis, passage } = run(ephesians);
    expect(analysis.detectedReference).toBe('Ephesians 1:3-10');
    expect(verseIds(passage)).toEqual(
      Array.from({ length: 8 }, (_, i) => `EPH.1.${3 + i}`),
    );
    // A single flowing paragraph → all prose, no phantom poetry/headings.
    expect(passage.blocks.every((b) => b.kind === 'p')).toBe(true);
  });

  it('keeps a superscription-less psalm (Psalm 1) as pure poetry, PS.1.1-6', () => {
    const { passage } = run(psalm1);
    expect(verseIds(passage)).toEqual([1, 2, 3, 4, 5, 6].map((n) => `PS.1.${n}`));
    expect(passage.blocks.every((b) => b.kind === 'q')).toBe(true);
    expect(passage.blocks.some((b) => b.editorial)).toBe(false); // no superscription here
  });
});

describe('hard psalm — long superscription + a mid-line verse number (Psalm 80)', () => {
  it('turns a long musical superscription into an editorial heading, not a phantom verse 0', () => {
    const { passage } = run(psalm80);
    // No PS.80.0: the superscription is a heading, and the verses start at 1.
    expect(verseIds(passage)).toEqual([1, 2, 3].map((n) => `PS.80.${n}`));
    const heading = passage.blocks.find((b) => b.editorial);
    expect(heading?.text?.map((f) => f.text).join(' ')).toMatch(/For the Chief Musician/);
  });

  it('treats acrostic stanza markers (Psalm 119 "Aleph"/"Beth") as headings, not sung lines', () => {
    // Each acrostic stanza opens with its Hebrew-letter label glued to the first numbered
    // line — a heading, not a poetry continuation of the previous verse.
    const raw = [
      'Psalm 119:1-4',
      'World English Bible',
      'Aleph',
      '1 Blessed are those whose ways are blameless,',
      '    who walk according to the law of the LORD.',
      '2 Blessed are those who keep his statutes,',
      '    and seek him with all their heart.',
      '',
      'Beth',
      '3 How can a young person keep their way pure?',
      '    By living according to your word.',
      '4 With all my heart I have sought you.',
      '    Don’t let me wander from your commandments.',
    ].join('\n');
    const { analysis, passage } = run(raw);
    const headings = analysis.segments.filter((s) => s.kind === 'heading').map((s) => s.text);
    expect(headings).toEqual(['Aleph', 'Beth']);
    expect(verseIds(passage)).toEqual([1, 2, 3, 4].map((n) => `PS.119.${n}`));
    // "Beth" is not swallowed into verse 2's poetry.
    const v2 = allVerses(passage).find((v) => v.verseId === 'PS.119.2')!;
    expect(verseText(v2)).not.toMatch(/Beth/);
  });

  it('detects a verse number that falls mid-line inside poetry (…shine out. 2 Before…)', () => {
    // A verse boundary inside a poetic line — the NIV Psalm 80 shape, rebuilt with PD text.
    const raw = [
      'Psalm 80:1-2',
      'World English Bible',
      '1 Hear us, Shepherd of Israel,',
      '    you who lead Joseph like a flock,',
      '    you who sit above the cherubim, shine out. 2 Before Ephraim, Benjamin, and Manasseh, stir up your might!',
      '    Come to save us!',
    ].join('\n');
    const { passage } = run(raw);
    expect(verseIds(passage)).toEqual(['PS.80.1', 'PS.80.2']);
    const v1 = allVerses(passage).find((v) => v.verseId === 'PS.80.1')!;
    const v2 = allVerses(passage).find((v) => v.verseId === 'PS.80.2')!;
    expect(verseText(v1)).toMatch(/shine out\.$/); // v1 keeps everything up to the boundary
    expect(verseText(v2)).toMatch(/^Before Ephraim/); // v2 starts at the mid-line number
    expect(verseText(v2)).toMatch(/Come to save us/);
  });
});

describe('regression — a stanza’s first un-numbered line is poetry, not a heading', () => {
  it('does not mistake "My soul glorifies the Lord" for a heading (blank before the song)', () => {
    // The NIV/BibleGateway shape: a prose lead-in verse, a blank line, then the sung
    // stanza whose first line carries no verse number. That line belongs to v46.
    const raw = [
      'Luke 1:46-47',
      'World English Bible',
      '46 And Mary said:',
      '',
      'My soul glorifies the Lord',
      '47     and my spirit rejoices in God my Saviour,',
    ].join('\n');
    const { analysis, passage } = run(raw);
    // "My soul glorifies the Lord" is NOT a heading …
    expect(analysis.segments.filter((s) => s.kind === 'heading')).toHaveLength(0);
    // … it is folded into verse 46, alongside the prose lead-in.
    const v46 = allVerses(passage).find((v) => v.verseId === 'LUKE.1.46')!;
    expect(verseText(v46)).toMatch(/And Mary said/);
    expect(verseText(v46)).toMatch(/My soul glorifies the Lord/);
    expect(verseIds(passage)).toEqual(['LUKE.1.46', 'LUKE.1.47']);
  });
});

describe('§1.1 cross-chapter paste — the BibleGateway chapter-boundary shape', () => {
  // A real Luke 1:79–2:2 BibleGateway copy, rebuilt with PD (WEBBE) text — rule 7 keeps any
  // copyrighted translation out of the repo. The chapter boundary shows as a standalone "2"
  // (the printed chapter number) leading the *unnumbered* verse 1: "2 Now in those days…".
  it('splits chapters instead of folding chapter 2 into the last verse of chapter 1', () => {
    const { analysis, passage } = run(crossChapter);
    expect(analysis.detectedReference).toBe('Luke 1:79-2:2');
    // The four verses land in the right chapters (not all under LUKE.1.80).
    expect(verseIds(passage)).toEqual(['LUKE.1.79', 'LUKE.1.80', 'LUKE.2.1', 'LUKE.2.2']);
    // Verse 2:1 is the census decree, kept whole; 2:2 is the Quirinius note.
    const v21 = allVerses(passage).find((v) => v.verseId === 'LUKE.2.1')!;
    expect(verseText(v21)).toMatch(/^Now in those days/);
    expect(verseText(v21)).not.toMatch(/Quirinius/); // v2 did not fold into v1
    const v22 = allVerses(passage).find((v) => v.verseId === 'LUKE.2.2')!;
    expect(verseText(v22)).toMatch(/Quirinius/);
    // The last verse of chapter 1 did not swallow chapter 2.
    const v180 = allVerses(passage).find((v) => v.verseId === 'LUKE.1.80')!;
    expect(verseText(v180)).not.toMatch(/Caesar Augustus/);
  });

  it('flags the chapter boundary for the review screen (never silent)', () => {
    const { analysis } = run(crossChapter);
    expect(analysis.flags.some((f) => /chapter boundary/i.test(f))).toBe(true);
    // The opening verse of the new chapter is highlighted for a quick check.
    const v21Seg = analysis.segments.find((s) => s.startsVerse && s.verseNumber === 1);
    expect(v21Seg?.flagged).toBe(true);
  });

  it('does not false-trigger a chapter reset on a normal ascending single-chapter paste', () => {
    // Birth of John (Luke 1:57-66) climbs monotonically — no downward leading number, so no reset.
    const { analysis } = run(birth);
    expect(analysis.flags.some((f) => /chapter boundary/i.test(f))).toBe(false);
  });
});

describe('edge cases — lone verse-number line, mid-verse start, name-vs-prose', () => {
  it('§1.10a keeps the verse boundary when a poetry verse number sits on its own line', () => {
    // The verse number "2" is on its own physical line; its text follows on the next line.
    const raw = [
      'Psalm 46:1-2',
      'World English Bible',
      '1 God is our refuge and strength,',
      '    a very present help in trouble.',
      '2',
      '    Therefore we won’t be afraid, though the earth changes,',
    ].join('\n');
    const { passage } = run(raw);
    // Without the fix, "Therefore…" folds into verse 1 and PS.46.2 is never created.
    expect(verseIds(passage)).toEqual(['PS.46.1', 'PS.46.2']);
    const v2 = allVerses(passage).find((v) => v.verseId === 'PS.46.2')!;
    expect(verseText(v2)).toMatch(/^Therefore/);
    const v1 = allVerses(passage).find((v) => v.verseId === 'PS.46.1')!;
    expect(verseText(v1)).not.toMatch(/Therefore/);
  });

  it('§1.10b a mid-verse-start segment stream floors to verse 1, never a phantom verse 0', () => {
    // Simulates the review screen re-assembling user edits: the first verse's marker was
    // removed, so assembly opens with a continuation segment and nothing yet open.
    const segments: PasteSegment[] = [
      { id: 's0', kind: 'verse', verseNumber: null, startsVerse: false, indent: 0, text: 'In the beginning was the Word,', flagged: false },
      { id: 's1', kind: 'verse', verseNumber: 2, startsVerse: true, indent: 0, text: 'The same was in the beginning with God.', flagged: false },
    ];
    const ctx: AssembleContext = { bookOsis: 'JOHN', startChapter: 1, translationId: 'pasted', reference: 'John 1:1-2' };
    const passage = assembleParsedText(segments, ctx);
    // The opening text lands in verse 1 (not JOHN.1.0), and verse 2 follows in the same chapter.
    expect(verseIds(passage)).toEqual(['JOHN.1.1', 'JOHN.1.2']);
    expect(verseIds(passage).some((id) => id.endsWith('.0'))).toBe(false);
  });

  it('§1.10c does not drop a real scripture line that carries a version-ish keyword', () => {
    // A verse-like line with "testament"/"standard" must NOT be mistaken for a name and stripped.
    expect(looksLikeTranslationName('This cup is the new testament in my blood')).toBe(false);
    expect(looksLikeTranslationName('he raised the standard against them')).toBe(false);
    expect(looksLikeTranslationName('16 For God so loved the world')).toBe(false); // leading number
    // Genuine Title-Case names still detect (including one internal lowercase word).
    expect(looksLikeTranslationName('New International Version')).toBe(true);
    expect(looksLikeTranslationName('American Standard Version')).toBe(true);
    expect(looksLikeTranslationName('The Bible in Basic English')).toBe(true);
  });

  it('§1.10c keeps a lone reference + a following verse-like line as scripture, not a name', () => {
    // Reference on its own line, then a verse line that happens to contain "testament".
    const raw = [
      'Luke 22:20',
      '20 This cup is the new testament in my blood, which is poured out for you',
    ].join('\n');
    const { analysis } = run(raw);
    expect(analysis.detectedReference).toBe('Luke 22:20');
    // The verse line survived as a segment (was not consumed as the translation name).
    expect(analysis.segments.some((s) => /new testament in my blood/.test(s.text))).toBe(true);
  });
});

describe('preclean — OS-agnostic + invisible characters', () => {
  it('normalises CRLF and folds NBSP / zero-width without losing the words', () => {
    // ZWSP (U+200B) glued inside a word, NBSP (U+00A0) between words, CRLF endings.
    const raw = 'John 3:16\r\nWorld English Bible\r\n16 For\u00A0God so\u200Bloved the world.';
    const { analysis, passage } = run(raw);
    expect(analysis.detectedReference).toBe('John 3:16');
    const v16 = allVerses(passage).find((v) => v.verseId === 'JOHN.3.16')!;
    expect(verseText(v16)).toBe('For God soloved the world.');
  });
});

describe('golden corpus — full assembled snapshots', () => {
  it('bg-luke1-magnificat-webbe', () => {
    expect(run(magnificat).passage).toMatchSnapshot();
  });
  it('bg-psalm23-asv', () => {
    expect(run(psalm23).passage).toMatchSnapshot();
  });
  it('bg-luke1-birth-webbe', () => {
    expect(run(birth).passage).toMatchSnapshot();
  });
  it('bg-psalm1-webbe', () => {
    expect(run(psalm1).passage).toMatchSnapshot();
  });
  it('bg-ephesians1-webbe', () => {
    expect(run(ephesians).passage).toMatchSnapshot();
  });
  it('bg-psalm80-webbe', () => {
    expect(run(psalm80).passage).toMatchSnapshot();
  });
  it('bg-luke1-2-crosschapter-webbe', () => {
    expect(run(crossChapter).passage).toMatchSnapshot();
  });
});

describe('YouVersion format (real-world, on-device tested)', () => {
  it('recovers the reference + translation from a "Book C:V-V ABBR" header line', () => {
    const { analysis } = run(yvJonah);
    expect(analysis.detectedReference).toBe('Jonah 1:1-4');
    expect(analysis.detectedTranslationId).toBe('webbe'); // "WEB" → bundled WEBBE
    expect(analysis.droppedChrome.join('\n')).toMatch(/Jonah 1:1-4 WEB/);
  });

  it('strips the trailing bible.com URL line as chrome', () => {
    const { analysis } = run(yvJonah);
    expect(analysis.droppedChrome.join('\n')).toMatch(/https:\/\/bible\.com/);
    expect(analysis.segments.some((s) => /bible\.com/.test(s.text))).toBe(false);
  });

  it('detects [NN] bracket verse markers and splits the one-blob paragraph into verses', () => {
    const { analysis, passage } = run(yvJonah);
    const verseSegs = analysis.segments.filter((s) => s.startsVerse);
    expect(verseSegs.map((s) => s.verseNumber)).toEqual([1, 2, 3, 4]);
    expect(verseIds(passage)).toEqual(['JONAH.1.1', 'JONAH.1.2', 'JONAH.1.3', 'JONAH.1.4']);
    // The reference/translation header did not leak into verse 1's text.
    expect(verseText(allVerses(passage)[0]!)).toMatch(/^Now the LORD/);
    expect(verseText(allVerses(passage)[0]!)).not.toMatch(/1:1-4|WEB/);
  });
});
