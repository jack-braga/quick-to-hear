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

  it('does not chip a mid-word @ref even when the tail parses as a reference (§1.10d)', () => {
    // `me@John 3:16` — the `@` does not start a word, so it stays literal (matches the editor).
    expect(shape('write to me@John 3:16 please')).toEqual(['T:write to me@John 3:16 please']);
    // …but a real word-start mention right after still chips.
    expect(shape('me @John 3:16')).toEqual(['T:me ', 'M:John 3:16']);
  });

  it('grabs only the reference, not the following prose', () => {
    // "John 3 and Paul" must chip "John 3", leaving " and Paul" as text.
    expect(shape('read @John 3 and Paul')).toEqual(['T:read ', 'M:John 3', 'T: and Paul']);
  });

  it('captures a verse list as one multi-span mention', () => {
    const segs = parseMentions('cf @Luke 1:1,16-17,32 here');
    expect(segs.map((s) => s.type)).toEqual(['text', 'mention', 'text']);
    const m = segs[1]!;
    if (m.type === 'mention') {
      expect(m.reference).toBe('Luke 1:1,16-17,32');
      expect(m.ref.segments).toHaveLength(3);
      expect(m.ref.osisAll).toBe('Luke.1.1,Luke.1.16-Luke.1.17,Luke.1.32');
    }
  });

  // Regression (#5a): "@Matthew 1:5" must chip the whole verse, not cut off at the chapter
  // ("@Matthew 1"). longestReference tries the longest valid form first, so the `:verse` (and a
  // range) is kept before falling back to the chapter.
  it('extends a mention to the :verse and range, not just the chapter', () => {
    expect(shape('see @Matthew 1:5 here')).toEqual(['T:see ', 'M:Matthew 1:5', 'T: here']);
    expect(shape('@Matthew 1:5-6')).toEqual(['M:Matthew 1:5-6']);
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

  it('renders a verse list compactly (first spans + a count)', () => {
    expect(label('@Luke 1:1,16-17,32,37,54-55,69-79')).toBe('Luke 1:1, 16–17, 32, +3');
  });
});
