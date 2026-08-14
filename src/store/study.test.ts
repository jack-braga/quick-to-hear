import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Avoid opening a real BroadcastChannel during store tests.
vi.mock('@/lib/broadcast', () => ({
  postStudyEvent: vi.fn(),
  onStudyEvent: () => () => {},
  SENDER_ID: 'test-sender',
}));

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
});
