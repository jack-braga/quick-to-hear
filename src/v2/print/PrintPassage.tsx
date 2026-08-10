import { Fragment } from 'react';

import { parseVerseId } from '@/lib/verse/ids';
import type { Block, ParsedText, VerseSpan } from '@/types/passage';
import { verseToLines } from '@/v2/reader/model';

/**
 * A plain, read-only passage renderer for the printed documents (v2.7) — the same verse-driven
 * layout as the reader (prose flows; poetry keeps its lines + hanging indent; superscriptions and
 * editorial headings are kept), but with no interaction and styled by the `.qth-doc .scripture`
 * scope. Verse numbers take the document accent so they follow the ink-saver toggle.
 */
const INDENT = ['', 'q1', 'q2', 'q2'] as const;

function verseNo(v: VerseSpan): string {
  return String(parseVerseId(v.verseId)?.verse ?? '');
}

function ProseVerse({ v, first }: { v: VerseSpan; first: boolean }) {
  if (!v.present) {
    return (
      <span>
        <sup className="vn">{verseNo(v)}</sup>
        <span className="soft">— </span>
      </span>
    );
  }
  const lines = verseToLines(v);
  return (
    <span>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {line.indent >= 1 && !(first && i === 0) && <br />}
          {i === 0 && <sup className="vn">{verseNo(v)}</sup>}
          <span className={line.indent >= 1 ? INDENT[Math.min(line.indent, 3)] : undefined} style={line.indent >= 1 ? { display: 'inline-block' } : undefined}>
            {line.frags.map((f, j) => (
              <Fragment key={j}>{f.text}</Fragment>
            ))}
          </span>{' '}
        </Fragment>
      ))}
    </span>
  );
}

function PoetryVerse({ v }: { v: VerseSpan }) {
  if (!v.present) {
    return (
      <div className="soft">
        <sup className="vn">{verseNo(v)}</sup>—
      </div>
    );
  }
  return (
    <div>
      {verseToLines(v).map((line, i) => (
        <div key={i} className={INDENT[Math.min(line.indent, 3)]}>
          {i === 0 && <sup className="vn">{verseNo(v)}</sup>}
          {line.frags.map((f, j) => (
            <Fragment key={j}>{f.text}</Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  const text = (block.text ?? []).map((f) => f.text).join(' ');
  switch (block.kind) {
    case 'd':
      return <p className="super">{text}</p>;
    case 's1':
    case 's2':
      return <p className="heading">{text}</p>;
    case 'b':
      return <div aria-hidden style={{ height: '0.6rem' }} />;
    case 'q':
      return (
        <div style={{ margin: '0.4em 0' }}>
          {block.verses.map((v) => (
            <PoetryVerse key={v.verseId} v={v} />
          ))}
        </div>
      );
    default:
      return (
        <p>
          {block.verses.map((v, i) => (
            <ProseVerse key={v.verseId} v={v} first={i === 0} />
          ))}
        </p>
      );
  }
}

export function PrintPassage({ passage, className }: { passage: ParsedText; className?: string }) {
  return (
    <div className={className ? `scripture ${className}` : 'scripture'}>
      {passage.blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  );
}
