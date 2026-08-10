import { describe, expect, it } from 'vitest';

import { buildPaletteItems, type PaletteContext } from '@/v2/reader/paletteItems';

const ctx: PaletteContext = {
  passageVerseIds: ['LUKE.1.5', 'LUKE.1.6', 'LUKE.1.7', 'LUKE.1.8'],
  hasSelection: false,
  translations: [
    { id: 'webbe', name: 'World English Bible British Edition', shortName: 'WEBBE', isPrimary: true },
    { id: 'asv', name: 'American Standard Version (1901)', shortName: 'ASV', isPrimary: false },
  ],
  lenses: [
    { id: 'map', name: 'Map' },
    { id: 'read', name: 'Read' },
  ],
};

describe('buildPaletteItems', () => {
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

  it('treats a bare book word as a command/completion, not a reference', () => {
    // "mark" is the gospel AND the "mark confusing" command — no digit → not a reference.
    const items = buildPaletteItems('mark', { ...ctx, hasSelection: true });
    expect(items.some((i) => i.action.type === 'jump')).toBe(false);
    expect(items.some((i) => i.action.type === 'create' && i.action.kind === 'mark')).toBe(true);
    expect(items.some((i) => i.action.type === 'fill')).toBe(true); // Mark (the book) to pick
  });

  it('completes a book name', () => {
    const items = buildPaletteItems('luk', ctx);
    expect(items[0]!.action).toEqual({ type: 'fill', text: 'Luke ' });
  });

  it('shows create commands only with a selection', () => {
    expect(buildPaletteItems('', ctx).some((i) => i.action.type === 'create')).toBe(false);
    expect(buildPaletteItems('', { ...ctx, hasSelection: true }).some((i) => i.action.type === 'create')).toBe(true);
  });

  it('offers switching to a non-primary translation and jumping to lenses', () => {
    const items = buildPaletteItems('', ctx);
    expect(items.some((i) => i.action.type === 'switch-translation' && i.action.id === 'asv')).toBe(true);
    expect(items.some((i) => i.action.type === 'go-lens' && i.action.lens === 'read')).toBe(true);
  });
});
