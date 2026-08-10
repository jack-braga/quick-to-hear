import { useEffect, useState } from 'react';

import { loadReading } from '@/lib/bible';
import { parseReference } from '@/lib/verse';
import { parseVerseId } from '@/lib/verse/ids';
import { allVerses, verseText, type ParsedText } from '@/types/passage';

/**
 * The peek body for an `@`-mention (ROADMAP-v2 §2) — loads the referenced passage in the study's
 * **primary** translation and renders it read-only, so the leader can see what a cross-reference
 * says without leaving the note. Bundled books are fetched + memory-cached by `loadReading` (the
 * same offline-safe path the main passage uses); a missing book degrades to a quiet notice.
 */

const cache = new Map<string, Promise<ParsedText>>();

function loadPeek(translationId: string, reference: string): Promise<ParsedText> | null {
  const ref = parseReference(reference);
  if (!ref) return null;
  const key = `${translationId}|${ref.osis}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = loadReading(translationId, ref);
    cache.set(key, hit);
    hit.catch(() => cache.delete(key)); // don't cache a failed fetch
  }
  return hit;
}

type PeekState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; text: ParsedText };

export function MentionPeek({
  reference,
  translationId,
}: {
  reference: string;
  translationId: string;
}) {
  const [state, setState] = useState<PeekState>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    const p = loadPeek(translationId, reference);
    if (!p) {
      setState({ status: 'error' });
      return;
    }
    setState({ status: 'loading' });
    p.then((text) => alive && setState({ status: 'ok', text })).catch(
      () => alive && setState({ status: 'error' }),
    );
    return () => {
      alive = false;
    };
  }, [reference, translationId]);

  if (state.status === 'error') {
    return (
      <p className="font-sans text-[12px] italic leading-[1.5] text-ink-faint">
        Couldn’t load {reference} in this translation.
      </p>
    );
  }
  if (state.status === 'loading') {
    return <p className="font-mono text-[11px] text-ink-faint">Loading {reference}…</p>;
  }

  const verses = allVerses(state.text).filter((v) => v.present);
  return (
    <div className="font-scripture text-[14px] leading-[1.5] text-ink">
      {verses.map((v) => (
        <span key={v.verseId}>
          <sup className="mr-[2px] align-super font-mono text-[9.5px] font-semibold text-lapis">
            {parseVerseId(v.verseId)?.verse}
          </sup>
          {verseText(v)}{' '}
        </span>
      ))}
    </div>
  );
}
