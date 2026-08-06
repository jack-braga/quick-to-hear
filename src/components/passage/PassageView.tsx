import { Fragment as ReactFragment } from 'react';

import type { Block, Fragment, ParsedText, VerseSpan } from '@/types/passage';
import { parseVerseId } from '@/lib/verse/ids';
import { cn } from '@/lib/utils';

/**
 * Renders a parsed reading (PLAN §4.3 / Principle 1: *the passage is the subject* —
 * nothing here out-competes the text). Scripture is set in the reserved serif; verse
 * numbers are small and muted; poetry keeps its line breaks and indentation; Psalm
 * superscriptions sit above verse 1; editorial headings are visibly *editorial* (never
 * "text to study"); omitted verses show the numbered gap honestly; red-letter is a
 * quiet warm tint.
 *
 * Line breaks come from each fragment's `qlevel` (0 = prose/inline, ≥1 = a poetry line
 * at that indent), so a verse that mixes a prose intro with a song (e.g. the Magnificat)
 * renders correctly whether it lives in a prose or a poetry block.
 */

interface Line {
  indent: number; // 0 = inline/prose, ≥1 = poetry line indent
  frags: Fragment[];
}

/** Split a verse's fragments into rendered lines: qlevel-0 fragments flow into one
 *  inline line; each qlevel≥1 fragment is its own poetry line. */
function verseToLines(span: VerseSpan): Line[] {
  const lines: Line[] = [];
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

function verseNumber(verseId: string): string {
  return String(parseVerseId(verseId)?.verse ?? '');
}

function FragmentText({ f }: { f: Fragment }) {
  if (f.wj) return <span className="text-rose-700 dark:text-rose-300">{f.text}</span>;
  return <>{f.text}</>;
}

function VerseNo({ n }: { n: string }) {
  return (
    <sup className="mr-0.5 select-none align-super text-[0.62em] font-sans font-medium text-muted-foreground">
      {n}
    </sup>
  );
}

const INDENT = ['', 'pl-4', 'pl-8', 'pl-12'] as const;

/** Inline content of one verse's lines (used inside a prose paragraph). Poetry lines
 *  inside prose break with a <br> and indent.
 *
 *  The verse number leads the verse's **first rendered line** — placed *after* any
 *  leading line break, never before it. Emitting it before the loop (as an earlier
 *  version did) stranded the number at the tail of the previous line whenever a verse
 *  opened directly on poetry (e.g. the Magnificat, Luke 1:46-55, sits in a prose block
 *  with poetry `qlevel`s). `firstInBlock` suppresses the leading break for the block's
 *  opening line so a block that starts on poetry gets no blank top line. */
function ProseVerse({ span, firstInBlock = false }: { span: VerseSpan; firstInBlock?: boolean }) {
  const n = verseNumber(span.verseId);
  if (!span.present) {
    return (
      <span data-gap className="text-muted-foreground">
        <VerseNo n={n} />
        <span className="italic">—</span>{' '}
      </span>
    );
  }
  const lines = verseToLines(span);
  return (
    <span data-verse={span.verseId}>
      {lines.map((line, i) => (
        <ReactFragment key={i}>
          {line.indent >= 1 && !(firstInBlock && i === 0) && <br />}
          {i === 0 && <VerseNo n={n} />}
          <span className={line.indent >= 1 ? cn('inline-block', INDENT[Math.min(line.indent, 3)]) : undefined}>
            {line.frags.map((f, j) => (
              <FragmentText key={j} f={f} />
            ))}
          </span>{' '}
        </ReactFragment>
      ))}
    </span>
  );
}

/** Poetry verse: every line on its own row, verse number on the first line. */
function PoetryVerse({ span }: { span: VerseSpan }) {
  const n = verseNumber(span.verseId);
  if (!span.present) {
    return (
      <div data-gap className="text-muted-foreground">
        <VerseNo n={n} />
        <span className="italic">—</span>
      </div>
    );
  }
  const lines = verseToLines(span);
  return (
    <div data-verse={span.verseId}>
      {lines.map((line, i) => (
        <div key={i} className={cn(INDENT[Math.min(line.indent, 3)])}>
          {i === 0 && <VerseNo n={n} />}
          {line.frags.map((f, j) => (
            <FragmentText key={j} f={f} />
          ))}
        </div>
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'd':
      return (
        <p className="mb-1 text-center text-sm italic text-muted-foreground">
          {block.text?.map((f) => f.text).join(' ')}
        </p>
      );
    case 's1':
    case 's2':
      return (
        <p
          data-editorial
          className={cn(
            'mt-5 mb-1 font-sans font-semibold uppercase tracking-wide text-muted-foreground',
            block.kind === 's1' ? 'text-xs' : 'text-[0.7rem]',
          )}
        >
          {block.text?.map((f) => f.text).join(' ')}
        </p>
      );
    case 'b':
      return <div aria-hidden className="h-3" />;
    case 'q':
      return (
        <div className="my-2 leading-relaxed">
          {block.verses.map((v) => (
            <PoetryVerse key={v.verseId} span={v} />
          ))}
        </div>
      );
    case 'p':
    default:
      return (
        <p className="my-3 leading-relaxed">
          {block.verses.map((v, i) => (
            <ProseVerse key={v.verseId} span={v} firstInBlock={i === 0} />
          ))}
        </p>
      );
  }
}

export function PassageView({ passage, className }: { passage: ParsedText; className?: string }) {
  if (passage.blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">No text to display.</p>;
  }
  return (
    <div className={cn('font-serif text-[1.05rem] text-foreground', className)}>
      {passage.blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}
