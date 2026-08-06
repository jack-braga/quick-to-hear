import { describe, expect, it } from 'vitest';

// A real authored file, imported raw, so the parser is tested against what ships.
import themeRaw from '../../../content/help/phase5/p5.theme.md?raw';
import { helpEntry, parseHelp } from './help';

describe('parseHelp (frontmatter + tiers, hand-split — no gray-matter)', () => {
  it('splits the leading frontmatter from a two-tier body', () => {
    const entry = parseHelp(
      [
        '---',
        'key: p5.demo',
        'title: Demo',
        'phase: 5',
        'state: uncited',
        'source:',
        '---',
        '',
        '<!-- inline -->',
        'The one-sentence version.',
        '',
        '<!-- expandable -->',
        'The fuller reasoning, behind a "tell me more".',
      ].join('\n'),
    );
    expect(entry.key).toBe('p5.demo');
    expect(entry.title).toBe('Demo');
    expect(entry.phase).toBe('5');
    expect(entry.inline).toBe('The one-sentence version.');
    expect(entry.expandable).toBe('The fuller reasoning, behind a "tell me more".');
    // An empty `source:` frontmatter value normalises to null (not the string "null").
    expect(entry.source).toBeNull();
  });

  it('captures a cited source string and tolerates a `#` comment in frontmatter', () => {
    const entry = parseHelp(
      [
        '---',
        'key: p5.cited',
        'state: cited   # todo -> cited | uncited',
        'source: after Goldsworthy',
        '---',
        '<!-- inline -->',
        'Body.',
      ].join('\n'),
    );
    expect(entry.state).toBe('cited');
    expect(entry.source).toBe('after Goldsworthy');
  });

  it('returns empty tiers for a file with only frontmatter (→ placeholder fallback)', () => {
    const entry = parseHelp(['---', 'key: empty', 'tiers: [inline]', '---', '<!-- inline -->', ''].join('\n'));
    expect(entry.inline).toBe('');
    expect(entry.expandable).toBe('');
  });

  it('uses the fallback key when frontmatter omits one, and never throws on junk', () => {
    expect(parseHelp('no frontmatter, just text', 'p9.orphan').key).toBe('p9.orphan');
    expect(() => parseHelp('---\n: : broken\n---\n<!-- inline -->\nx')).not.toThrow();
  });

  it('parses the real p5.theme.md as inline + expandable', () => {
    const entry = parseHelp(themeRaw, 'p5.theme');
    expect(entry.key).toBe('p5.theme');
    expect(entry.inline).toMatch(/one sentence/i);
    expect(entry.expandable.length).toBeGreaterThan(0);
  });
});

describe('helpEntry (real files via glob)', () => {
  it('resolves an authored key to inline prose', () => {
    const entry = helpEntry('p5.faithfulness');
    expect(entry).not.toBeNull();
    expect(entry!.inline).toMatch(/certainty/i);
  });

  it('returns null for a key with no shipped file', () => {
    expect(helpEntry('p9.does-not-exist')).toBeNull();
  });
});
