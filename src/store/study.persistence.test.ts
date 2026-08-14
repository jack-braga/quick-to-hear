import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeStudy, type ParsedText, type Study } from '@/types/study';

// Avoid opening a real BroadcastChannel during store tests.
vi.mock('@/lib/broadcast', () => ({
  postStudyEvent: vi.fn(),
  onStudyEvent: () => () => {},
  SENDER_ID: 'test-sender',
}));

// The store persists the passage via `putStudyFull`. Mock just that one function (real
// everything else) so we can drive a rejected IndexedDB write and assert the store's recovery.
const { putStudyFullMock } = vi.hoisted(() => ({ putStudyFullMock: vi.fn() }));
vi.mock('@/lib/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/storage')>();
  return { ...actual, putStudyFull: putStudyFullMock };
});

import { useStudyStore } from '@/store/study';

const ISO = '2026-01-01T00:00:00.000Z';

const samplePassage: ParsedText = {
  translationId: 'webbe',
  versification: 'kjv',
  reference: 'Luke 1:5-25',
  blocks: [],
  notes: [],
};
const passageContainer = { translations: { webbe: samplePassage }, primaryId: 'webbe' };

function setCurrent(study: Study) {
  useStudyStore.setState({
    studies: [],
    current: study,
    dirty: false,
    status: 'ready',
    error: null,
    conflict: false,
  });
}

beforeEach(() => {
  putStudyFullMock.mockReset();
});

describe('setPassage persistence discipline (§1.4/§1.5)', () => {
  it('clears dirty only after a successful write', async () => {
    setCurrent(makeStudy('s1', ISO));
    putStudyFullMock.mockResolvedValueOnce(undefined);

    await useStudyStore.getState().setPassage(passageContainer);

    expect(putStudyFullMock).toHaveBeenCalledOnce();
    expect(useStudyStore.getState().dirty).toBe(false);
    expect(useStudyStore.getState().error).toBeNull();
    expect(useStudyStore.getState().current?.passage.primaryId).toBe('webbe');
  });

  it('a failed write keeps the passage, stays dirty, surfaces an error, and rethrows', async () => {
    setCurrent(makeStudy('s2', ISO));
    putStudyFullMock.mockRejectedValueOnce(new Error('disk full'));

    await expect(useStudyStore.getState().setPassage(passageContainer)).rejects.toThrow('disk full');

    const state = useStudyStore.getState();
    // The edit is applied in memory (never silently lost) …
    expect(state.current?.passage.primaryId).toBe('webbe');
    // … stays retryable …
    expect(state.dirty).toBe(true);
    // … and is surfaced.
    expect(state.error).toMatch(/could not save/i);
  });
});

describe('resetPassage (§1.6 — change-passage clears the orphans)', () => {
  it('clears the passage, cards, theme/aim, map, and running order, then persists', async () => {
    const base = makeStudy('s3', ISO);
    setCurrent({
      ...base,
      passage: passageContainer,
      // A card, a survey section, a theme, and a running order all anchored to the old text.
      annotations: [{ id: 'a1', kind: 'question' } as unknown as Study['annotations'][number]],
      runningOrder: ['a1'],
      themeAim: { ...base.themeAim, theme: 'Old theme' },
      map: { sections: [{ id: 'sec', startVerseId: 'LUKE.1.5', endVerseId: 'LUKE.1.6', name: '' }] },
    });
    putStudyFullMock.mockResolvedValueOnce(undefined);

    await useStudyStore.getState().resetPassage();

    const cur = useStudyStore.getState().current!;
    expect(cur.passage.primaryId).toBeNull();
    expect(cur.passage.translations).toEqual({});
    expect(cur.annotations).toEqual([]);
    expect(cur.runningOrder).toEqual([]);
    expect(cur.themeAim.theme).toBe('');
    expect(cur.map.sections).toEqual([]);
    expect(useStudyStore.getState().dirty).toBe(false);
    expect(putStudyFullMock).toHaveBeenCalledOnce();
  });

  it('a failed reset keeps the study dirty and surfaces an error', async () => {
    setCurrent({ ...makeStudy('s4', ISO), passage: passageContainer });
    putStudyFullMock.mockRejectedValueOnce(new Error('quota'));

    await expect(useStudyStore.getState().resetPassage()).rejects.toThrow('quota');
    expect(useStudyStore.getState().dirty).toBe(true);
    expect(useStudyStore.getState().error).toMatch(/could not save/i);
  });
});
