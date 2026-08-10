import { describe, expect, it } from 'vitest';

import { mentionLabel, parseMentions } from '@/v2/reader/mentions';

/** Compact a segment list to a readable shape for assertions. */
function shape(text: string): string[] {
  return parseMentions(text).map((s) => (s.type === 'text' ? `T:${s.value}` : `M:${s.reference}`));
}

describe('parseMentions', () => {
  it('returns a single text segment when there is no mention', () => {
    expect(parseMentions('just a plain note')).toEqual([{ type: 'text', value: 'just a plain note' }]);
  });

  it('detects a full @reference and keeps its raw + parsed reference', () => {
    const segs = parseMentions('@Malachi 4:5-6');
    expect(segs).toHaveLength(1);
    const m = segs[0]!;
    expect(m.type).toBe('mention');
    if (m.type === 'mention') {
      expect(m.raw).toBe('@Malachi 4:5-6');
      expect(m.reference).toBe('Malachi 4:5-6');
      expect(m.ref.osis).toBe('Mal.4.5-Mal.4.6');
    }
  });

  it('splits surrounding text before and after the mention', () => {
    expect(shape('cf. @Malachi 4:5-6 on turning')).toEqual([
      'T:cf. ',
      'M:Malachi 4:5-6',
      'T: on turning',
    ]);
  });

  it('handles a numbered book', () => {
    expect(shape('see @1 Corinthians 15:3-4 too')).toEqual([
      'T:see ',
      'M:1 Corinthians 15:3-4',
      'T: too',
    ]);
  });

  it('accepts a short book form and a single verse', () => {
    expect(shape('@Mal 4:5')).toEqual(['M:Mal 4:5']);
  });

  it('finds two mentions in one string', () => {
    expect(shape('@Genesis 1:1 and @John 3:16')).toEqual([
      'M:Genesis 1:1',
      'T: and ',
      'M:John 3:16',
    ]);
  });

  it('leaves a bare book (no chapter) as literal text', () => {
    expect(shape('@Malachi is a prophet')).toEqual(['T:@Malachi is a prophet']);
  });

  it('does not turn an email into a mention', () => {
    expect(shape('email jack@busable.com today')).toEqual(['T:email jack@busable.com today']);
  });

  it('grabs only the reference, not the following prose', () => {
    // "John 3 and Paul" must chip "John 3", leaving " and Paul" as text.
    expect(shape('read @John 3 and Paul')).toEqual(['T:read ', 'M:John 3', 'T: and Paul']);
  });
});

describe('mentionLabel', () => {
  const label = (s: string) => {
    const seg = parseMentions(s)[0]!;
    if (seg.type !== 'mention') throw new Error('expected a mention');
    return mentionLabel(seg.ref);
  };

  it('renders a same-chapter range with an en dash', () => {
    expect(label('@Malachi 4:5-6')).toBe('Mal 4:5–6');
  });

  it('renders a single verse without a range', () => {
    expect(label('@John 3:16')).toBe('John 3:16');
  });
});
