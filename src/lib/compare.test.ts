import { describe, expect, it } from 'vitest';

import { allVerses, type ParsedText, type VerseSpan } from '@/types/passage';
import {
  HEBREW_PSALMS,
  alignTranslations,
  alignVerse,
  reversifyToKjv,
} from '@/lib/compare';

/** A verse span with (or without) text — `present:false` is a numbered gap. */
function span(verseId: string, present = true, text = verseId): VerseSpan {
  return { verseId, present, fragments: present ? [{ text, qlevel: 0 }] : [] };
}

/** A one-prose-block reading over the given spans. */
function reading(translationId: string, spans: VerseSpan[]): ParsedText {
  return {
    translationId,
    versification: 'kjv',
    reference: '',
    blocks: [{ kind: 'p', verses: spans }],
    notes: [],
  };
}

const rowFor = (a: ReturnType<typeof alignTranslations>, id: string) =>
  a.rows.find((r) => r.verseId === id)!;

describe('alignTranslations — number-equality + present flag (within the bundle)', () => {
  it('flags a verse present in one translation and gapped in the other', () => {
    // WEBBE has Acts 8:37; ASV omits it (present:false). Same numbered slot, so it must
    // FLAG a mismatch — not skip 37 and misalign 38 against the other side's 37.
    const webbe = reading('webbe', [span('ACTS.8.36'), span('ACTS.8.37'), span('ACTS.8.38')]);
    const asv = reading('asv', [span('ACTS.8.36'), span('ACTS.8.37', false), span('ACTS.8.38')]);
    const a = alignTranslations(webbe, asv);

    expect(rowFor(a, 'ACTS.8.37').status).toBe('mismatch');
    expect(rowFor(a, 'ACTS.8.37').primaryPresent).toBe(true);
    expect(rowFor(a, 'ACTS.8.37').secondaryPresent).toBe(false);
    // 38 pairs with 38 on both sides — the anti-misalignment guarantee.
    expect(rowFor(a, 'ACTS.8.38').status).toBe('matched');
    expect(rowFor(a, 'ACTS.8.38').primaryText).toBe('ACTS.8.38');
    expect(rowFor(a, 'ACTS.8.38').secondaryText).toBe('ACTS.8.38');
    expect(a.mismatchCount).toBe(1);
  });

  it('does not flag a verse both translations omit (both-gap)', () => {
    const webbe = reading('webbe', [span('ACTS.8.36'), span('ACTS.8.37', false), span('ACTS.8.38')]);
    const asv = reading('asv', [span('ACTS.8.36'), span('ACTS.8.37', false), span('ACTS.8.38')]);
    const a = alignTranslations(webbe, asv);

    expect(rowFor(a, 'ACTS.8.37').status).toBe('both-gap');
    expect(a.mismatchCount).toBe(0);
  });

  it('flags a verse the secondary has no slot for at all (Matt 17:21)', () => {
    const webbe = reading('webbe', [span('MATT.17.20'), span('MATT.17.21'), span('MATT.17.22')]);
    const asv = reading('asv', [span('MATT.17.20'), span('MATT.17.22')]); // no 21 slot
    const a = alignTranslations(webbe, asv);

    expect(rowFor(a, 'MATT.17.21').status).toBe('mismatch');
    // 22 still pairs to 22 — never slid up into 21's place.
    expect(rowFor(a, 'MATT.17.22').status).toBe('matched');
    expect(a.mismatchCount).toBe(1);
  });

  it('surfaces a secondary-only verse rather than dropping it', () => {
    const primary = reading('webbe', [span('JOHN.7.52'), span('JOHN.8.1')]);
    const secondary = reading('asv', [span('JOHN.7.52'), span('JOHN.7.53'), span('JOHN.8.1')]);
    const a = alignTranslations(primary, secondary);

    const extra = rowFor(a, 'JOHN.7.53');
    expect(extra.status).toBe('mismatch');
    expect(extra.primaryPresent).toBe(false);
    expect(extra.secondaryPresent).toBe(true);
  });
});

describe('alignVerse — the on-demand-at-a-verse case', () => {
  const primary = reading('webbe', [span('MATT.17.20'), span('MATT.17.21'), span('MATT.17.22')]);
  const secondary = reading('asv', [span('MATT.17.20'), span('MATT.17.22')]);

  it('returns the single verse row', () => {
    expect(alignVerse(primary, secondary, 'MATT.17.21')?.status).toBe('mismatch');
    expect(alignVerse(primary, secondary, 'MATT.17.20')?.status).toBe('matched');
  });

  it('returns null when the verse is in neither reading', () => {
    expect(alignVerse(primary, secondary, 'MATT.99.1')).toBeNull();
  });
});

describe('reversifyToKjv — the small safe converter (foreign → KJV anchor)', () => {
  it('shifts a Hebrew-numbered Psalm onto KJV numbering and flags the title verses', () => {
    // Ps 51 in Hebrew numbers the two-line superscription as vv1–2; KJV starts at content.
    const foreign = reading('pasted-hebrew', [
      span('PS.51.1'),
      span('PS.51.2'),
      span('PS.51.3', true, 'Have mercy on me'),
      span('PS.51.4'),
      span('PS.51.5'),
    ]);
    const { text, unmappable } = reversifyToKjv(foreign, HEBREW_PSALMS);

    // Foreign 3,4,5 → KJV 1,2,3; foreign 1,2 (the title) have no KJV slot.
    expect(allVerses(text).map((v) => v.verseId)).toEqual(['PS.51.1', 'PS.51.2', 'PS.51.3']);
    expect(allVerses(text)[0]!.fragments[0]!.text).toBe('Have mercy on me');
    expect(unmappable).toEqual(['PS.51.1', 'PS.51.2']);
  });

  it('leaves an unruled chapter identical (most verses do not shift)', () => {
    const ps23 = reading('pasted-hebrew', [span('PS.23.1'), span('PS.23.2')]);
    const { text, unmappable } = reversifyToKjv(ps23, HEBREW_PSALMS);

    expect(allVerses(text).map((v) => v.verseId)).toEqual(['PS.23.1', 'PS.23.2']);
    expect(unmappable).toEqual([]);
  });

  it('does not mutate its input', () => {
    const foreign = reading('pasted-hebrew', [span('PS.3.1'), span('PS.3.2')]);
    reversifyToKjv(foreign, HEBREW_PSALMS);
    expect(allVerses(foreign).map((v) => v.verseId)).toEqual(['PS.3.1', 'PS.3.2']);
  });
});
