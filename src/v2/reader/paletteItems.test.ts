import { describe, expect, it } from 'vitest';

import { buildPaletteItems, type PaletteContext } from '@/v2/reader/paletteItems';

const ctx: PaletteContext = {
  passageVerseIds: ['LUKE.1.5', 'LUKE.1.6', 'LUKE.1.7', 'LUKE.1.8'],
};

describe('buildPaletteItems (slimmed to quick-jump — #7)', () => {
  it('jumps by a bare number / :N to the matching verse', () => {
    const items = buildPaletteItems(':7', ctx);
    expect(items).toHaveLength(1);
    expect(items[0]!.action).toEqual({ type: 'jump', verseId: 'LUKE.1.7' });
    expect(buildPaletteItems('7', ctx)[0]!.action).toEqual({ type: 'jump', verseId: 'LUKE.1.7' });
  });

  it('reports when a jumped verse is not in the passage', () => {
    const items = buildPaletteItems(':99', ctx);
    expect(items[0]!.label).toMatch(/no verse 99/i);
  });

  it('offers a jump for a reference inside the passage', () => {
    const items = buildPaletteItems('Luke 1:8', ctx);
    expect(items.map((i) => i.action.type)).toEqual(['jump']);
    expect(items[0]!.action).toEqual({ type: 'jump', verseId: 'LUKE.1.8' });
  });

  it('offers nothing for a reference outside the passage (it belongs in an @-mention)', () => {
    // Referencing another passage is a note @-mention, not a palette action.
    expect(buildPaletteItems('Malachi 4:5-6', ctx)).toHaveLength(0);
  });

  it('no longer surfaces create / translation / lens / book-completion commands', () => {
    // Those all moved to dedicated UI; a non-jump query yields nothing.
    expect(buildPaletteItems('mark', ctx)).toHaveLength(0);
    expect(buildPaletteItems('note', ctx)).toHaveLength(0);
    expect(buildPaletteItems('ASV', ctx)).toHaveLength(0);
    expect(buildPaletteItems('luk', ctx)).toHaveLength(0);
    expect(buildPaletteItems('', ctx)).toHaveLength(0);
  });
});
