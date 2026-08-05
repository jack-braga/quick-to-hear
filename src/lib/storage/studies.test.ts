import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';

import { __resetDbForTests } from '@/lib/storage/db';
import {
  deleteStudy,
  exportStudyBlob,
  getStudy,
  importStudy,
  listQuarantine,
  listStudies,
  putStudy,
  putStudyFull,
  serializeStudy,
} from '@/lib/storage/studies';
import { makeStudy, type ParsedText, type Study } from '@/types/study';

function freshStudy(id: string, reference = ''): Study {
  const s = makeStudy(id, '2026-01-01T00:00:00.000Z');
  return { ...s, setup: { ...s.setup, reference } };
}

const samplePassage: ParsedText = {
  translationId: 'webbe',
  versification: 'kjv',
  blocks: [],
  notes: [],
};

beforeEach(() => {
  // Isolate each test with a fresh fake-indexeddb + a fresh cached connection.
  (globalThis as unknown as { indexedDB: unknown }).indexedDB = new IDBFactory();
  __resetDbForTests();
});

describe('storage CRUD', () => {
  it('creates, lists, reads, and deletes studies', async () => {
    await putStudyFull(freshStudy('a', 'Luke 1'));
    await putStudyFull(freshStudy('b', 'Acts 2'));

    expect((await listStudies()).map((r) => r.id).sort()).toEqual(['a', 'b']);
    expect((await getStudy('a'))?.setup.reference).toBe('Luke 1');

    await deleteStudy('a');
    expect(await getStudy('a')).toBeNull();
    expect((await listStudies()).map((r) => r.id)).toEqual(['b']);
  });

  it('returns null for an unknown id', async () => {
    expect(await getStudy('nope')).toBeNull();
  });
});

describe('passage separation (PLAN §4.4)', () => {
  it('rejoins the passage on read but keeps it out of the list', async () => {
    await putStudyFull({ ...freshStudy('p', 'John 1'), passage: { primary: samplePassage } });

    const [row] = await listStudies();
    expect(row.reference).toBe('John 1');
    expect('passage' in row).toBe(false);

    expect((await getStudy('p'))?.passage.primary?.translationId).toBe('webbe');
  });

  it('a body-only save (the autosave path) leaves the stored passage intact', async () => {
    const s: Study = { ...freshStudy('x', 'Mark 1'), passage: { primary: samplePassage } };
    await putStudyFull(s);

    // Autosave writes the body only; the passage store must be untouched.
    await putStudy({ ...s, setup: { ...s.setup, reference: 'Mark 2' } });

    const got = await getStudy('x');
    expect(got?.setup.reference).toBe('Mark 2');
    expect(got?.passage.primary?.translationId).toBe('webbe');
  });
});

describe('project-file export / import', () => {
  it('round-trips a study, preserving content under a fresh id (import-as-copy)', async () => {
    const original: Study = {
      ...freshStudy('orig', 'Luke 1:5-25'),
      setup: { ...freshStudy('orig').setup, reference: 'Luke 1:5-25', seriesNote: 'Week 3' },
    };
    await putStudyFull(original);

    // exportStudyBlob produces the downloadable file; round-trip via serializeStudy
    // because jsdom's Blob has no .text() (a test-env limitation, not a code path).
    expect(await exportStudyBlob('orig')).not.toBeNull();
    const stored = await getStudy('orig');
    if (!stored) throw new Error('expected the stored study');
    const result = await importStudy(serializeStudy(stored));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.study.id).not.toBe('orig'); // fresh id
    expect(result.study.setup.reference).toBe('Luke 1:5-25');
    expect(result.study.setup.seriesNote).toBe('Week 3');

    // Original is untouched; the import is a second, distinct study.
    const ids = (await listStudies()).map((r) => r.id);
    expect(ids).toContain('orig');
    expect(ids).toContain(result.study.id);
    expect(ids).toHaveLength(2);
  });

  it('imports a bare, envelope-less study too', async () => {
    const result = await importStudy(JSON.stringify(freshStudy('bare', 'Acts 2')));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.study.setup.reference).toBe('Acts 2');
  });

  it('rejects malformed JSON with a friendly error and keeps it in quarantine', async () => {
    const result = await importStudy('{ not valid json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/valid JSON|project file/i);
    expect(await listStudies()).toHaveLength(0);
    expect(await listQuarantine()).toHaveLength(1);
  });

  it('rejects a structurally-broken study, keeping it in quarantine (never discarded)', async () => {
    const result = await importStudy(JSON.stringify({ setup: { durationMinutes: 'nope' } }));
    expect(result.ok).toBe(false);
    expect(await listStudies()).toHaveLength(0);
    expect(await listQuarantine()).toHaveLength(1);
  });
});
