import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Avoid opening a real BroadcastChannel during store tests.
vi.mock('@/lib/broadcast', () => ({
  postStudyEvent: vi.fn(),
  onStudyEvent: () => () => {},
  SENDER_ID: 'test-sender',
}));

import { deriveRecycleSources } from '@/lib/recycle';
import { __resetDbForTests } from '@/lib/storage/db';
import { getStudy } from '@/lib/storage/studies';
import { useStudyStore } from '@/store/study';

function resetStore() {
  useStudyStore.setState({
    studies: [],
    current: null,
    dirty: false,
    status: 'idle',
    error: null,
    conflict: false,
  });
}

beforeEach(() => {
  (globalThis as unknown as { indexedDB: unknown }).indexedDB = new IDBFactory();
  __resetDbForTests();
  resetStore();
});

describe('study store', () => {
  it('createStudy opens a fresh, clean study and lists it', async () => {
    const s = await useStudyStore.getState().createStudy();
    const state = useStudyStore.getState();
    expect(state.current?.id).toBe(s.id);
    expect(state.dirty).toBe(false);
    expect(state.studies.map((r) => r.id)).toContain(s.id);
  });

  it('updateSetup marks dirty; flushSave persists and survives a reload', async () => {
    const s = await useStudyStore.getState().createStudy();

    useStudyStore.getState().updateSetup({ reference: 'Luke 1:5-25' });
    expect(useStudyStore.getState().dirty).toBe(true);
    expect(useStudyStore.getState().current?.setup.reference).toBe('Luke 1:5-25');

    const saved = await useStudyStore.getState().flushSave();
    expect(saved?.id).toBe(s.id);
    expect(useStudyStore.getState().dirty).toBe(false);

    // Simulate a reload: forget the in-memory study and re-open from storage.
    useStudyStore.setState({ current: null });
    const reopened = await useStudyStore.getState().openStudy(s.id);
    expect(reopened?.setup.reference).toBe('Luke 1:5-25');
  });

  it('flushSave is a no-op when nothing is dirty', async () => {
    await useStudyStore.getState().createStudy();
    expect(await useStudyStore.getState().flushSave()).toBeNull();
  });

  it('deleteStudy removes it and clears current', async () => {
    const s = await useStudyStore.getState().createStudy();
    await useStudyStore.getState().deleteStudy(s.id);
    expect(useStudyStore.getState().current).toBeNull();
    expect(useStudyStore.getState().studies.map((r) => r.id)).not.toContain(s.id);
    expect(await getStudy(s.id)).toBeNull();
  });

  it('importProjectFile surfaces a friendly error and creates no study', async () => {
    const result = await useStudyStore.getState().importProjectFile('{ not json');
    expect(result.ok).toBe(false);
    expect(useStudyStore.getState().error).toMatch(/JSON|project file/i);
    expect(useStudyStore.getState().studies).toHaveLength(0);
  });

  it('applyExternalSave flags a conflict for a newer copy of the open study', async () => {
    const s = await useStudyStore.getState().createStudy();
    useStudyStore.getState().applyExternalSave(s.id, '2999-01-01T00:00:00.000Z');
    expect(useStudyStore.getState().conflict).toBe(true);
  });

  it('applyExternalDelete drops the open study from view', async () => {
    const s = await useStudyStore.getState().createStudy();
    useStudyStore.getState().applyExternalDelete(s.id);
    expect(useStudyStore.getState().current).toBeNull();
    expect(useStudyStore.getState().studies.map((r) => r.id)).not.toContain(s.id);
  });

  it('recycleToPool snapshots an anchored COMA note into the candidate pool, idempotently', async () => {
    await useStudyStore.getState().createStudy();

    // Add an anchored meaning note (Phase 4 does this inline via applyToCurrent).
    useStudyStore.getState().applyToCurrent((study) => ({
      ...study,
      coma: {
        ...study.coma,
        meaning: [{ id: 'n1', text: 'Zechariah doubts', anchor: { verseIds: ['LUKE.1.18'] } }],
      },
    }));

    const source = deriveRecycleSources(useStudyStore.getState().current!).find(
      (s) => s.source.id === 'n1',
    )!;
    useStudyStore.getState().recycleToPool(source);

    const build1 = useStudyStore.getState().current!.build;
    expect(build1.format).toBe('study');
    const candidates1 = build1.format === 'study' ? build1.candidates : [];
    expect(candidates1).toHaveLength(1);
    expect(candidates1[0]).toMatchObject({
      kind: 'question',
      questionType: 'meaning',
      text: 'Zechariah doubts',
      status: 'open',
      source: { kind: 'comaNote', id: 'n1' },
    });

    // Recycling the same source again is a no-op.
    useStudyStore.getState().recycleToPool(source);
    const build2 = useStudyStore.getState().current!.build;
    expect(build2.format === 'study' ? build2.candidates : []).toHaveLength(1);

    // Editing the source note never mutates the promoted candidate's snapshot.
    useStudyStore.getState().applyToCurrent((study) => ({
      ...study,
      coma: {
        ...study.coma,
        meaning: [{ id: 'n1', text: 'EDITED', anchor: { verseIds: ['LUKE.1.18'] } }],
      },
    }));
    const build3 = useStudyStore.getState().current!.build;
    const candidates3 = build3.format === 'study' ? build3.candidates : [];
    expect(candidates3[0]!.text).toBe('Zechariah doubts');
  });
});
