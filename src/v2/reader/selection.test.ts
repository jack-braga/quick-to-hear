import { describe, expect, it } from 'vitest';

import {
  clickSelection,
  dragSelection,
  formatVerseIds,
  rangeBetween,
} from '@/v2/reader/selection';

const ORDER = ['LUKE.1.5', 'LUKE.1.6', 'LUKE.1.7', 'LUKE.1.8', 'LUKE.1.9'];

describe('rangeBetween', () => {
  it('returns the inclusive run in passage order, either argument order', () => {
    expect(rangeBetween(ORDER, 'LUKE.1.6', 'LUKE.1.8')).toEqual(['LUKE.1.6', 'LUKE.1.7', 'LUKE.1.8']);
    expect(rangeBetween(ORDER, 'LUKE.1.8', 'LUKE.1.6')).toEqual(['LUKE.1.6', 'LUKE.1.7', 'LUKE.1.8']);
  });

  it('is empty when an endpoint is not in the passage', () => {
    expect(rangeBetween(ORDER, 'LUKE.1.6', 'JOHN.1.1')).toEqual([]);
  });
});

describe('dragSelection', () => {
  it('adds the anchor→target range to a preserved base, in passage order', () => {
    expect(dragSelection(ORDER, ['LUKE.1.5'], 'LUKE.1.8', 'LUKE.1.9')).toEqual([
      'LUKE.1.5',
      'LUKE.1.8',
      'LUKE.1.9',
    ]);
  });

  it('de-duplicates when the drag overlaps the base', () => {
    expect(dragSelection(ORDER, ['LUKE.1.6', 'LUKE.1.7'], 'LUKE.1.7', 'LUKE.1.8')).toEqual([
      'LUKE.1.6',
      'LUKE.1.7',
      'LUKE.1.8',
    ]);
  });
});

describe('clickSelection', () => {
  it('a plain click selects just that verse', () => {
    expect(clickSelection(ORDER, [], 'LUKE.1.7', {}, null)).toEqual({
      selected: ['LUKE.1.7'],
      lastAnchor: 'LUKE.1.7',
    });
  });

  it('a plain click on the sole selected verse deselects it', () => {
    expect(clickSelection(ORDER, ['LUKE.1.7'], 'LUKE.1.7', {}, 'LUKE.1.7')).toEqual({
      selected: [],
      lastAnchor: null,
    });
  });

  it('a plain click elsewhere replaces the selection', () => {
    expect(clickSelection(ORDER, ['LUKE.1.5', 'LUKE.1.6'], 'LUKE.1.8', {}, 'LUKE.1.6')).toEqual({
      selected: ['LUKE.1.8'],
      lastAnchor: 'LUKE.1.8',
    });
  });

  it('⌘/Ctrl toggles a verse in and out, keeping passage order', () => {
    const added = clickSelection(ORDER, ['LUKE.1.8'], 'LUKE.1.6', { meta: true }, 'LUKE.1.8');
    expect(added.selected).toEqual(['LUKE.1.6', 'LUKE.1.8']);
    const removed = clickSelection(ORDER, ['LUKE.1.6', 'LUKE.1.8'], 'LUKE.1.6', { meta: true }, 'LUKE.1.6');
    expect(removed.selected).toEqual(['LUKE.1.8']);
  });

  it('⇧ extends from the last anchor, preserving the disjoint base', () => {
    expect(clickSelection(ORDER, ['LUKE.1.9'], 'LUKE.1.7', { shift: true }, 'LUKE.1.5')).toEqual({
      selected: ['LUKE.1.5', 'LUKE.1.6', 'LUKE.1.7', 'LUKE.1.9'],
      lastAnchor: 'LUKE.1.5',
    });
  });
});

describe('formatVerseIds', () => {
  it('collapses consecutive verses within a chapter into a range', () => {
    expect(formatVerseIds(['LUKE.1.8', 'LUKE.1.9', 'LUKE.1.10', 'LUKE.1.13'])).toBe('Luke 1:8–10, 13');
  });

  it('starts a new run across a chapter boundary and omits the repeated book', () => {
    expect(formatVerseIds(['LUKE.1.5', 'LUKE.2.1', 'LUKE.2.2'])).toBe('Luke 1:5, 2:1–2');
  });

  it('sorts an out-of-order, duplicated selection', () => {
    expect(formatVerseIds(['LUKE.1.9', 'LUKE.1.8', 'LUKE.1.9'])).toBe('Luke 1:8–9');
  });

  it('is empty for no ids', () => {
    expect(formatVerseIds([])).toBe('');
  });
});
