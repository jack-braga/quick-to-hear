import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';

import { __resetDbForTests, getDB, STORE_STUDIES } from '@/lib/storage/db';
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
  reference: 'Luke 1:5-25',
  blocks: [],
  notes: [],
};

/** The M3 passage container wrapping a single primary reading. */
const samplePassageContainer = {
  translations: { webbe: samplePassage },
  primaryId: 'webbe',
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

describe('load-quarantine of an un-hydratable study (§1.10f)', () => {
  /** Write a structurally-broken body straight into the store (a value hydrate rejects). */
  async function putBrokenBody(id: string) {
    const db = await getDB();
    await db.put(STORE_STUDIES, { setup: { durationMinutes: 'nope' } } as never, id);
  }

  it('re-reading a broken study quarantines ONCE (keyed by id), not once per read', async () => {
    await putBrokenBody('broken');

    expect(await getStudy('broken')).toBeNull();
    expect(await getStudy('broken')).toBeNull();
    expect(await getStudy('broken')).toBeNull();

    // The quarantine store must not grow unbounded — the stable `load:<id>` key overwrites.
    expect(await listQuarantine()).toHaveLength(1);
  });

  it('hides the broken study from the Home list once it has been quarantined', async () => {
    await putStudyFull(freshStudy('good', 'Luke 1'));
    await putBrokenBody('broken');

    // A broken body is a clickable "ghost" until first read; reading it quarantines it …
    expect(await getStudy('broken')).toBeNull();

    // … after which the Home list shows only the real study, not the ghost.
    const ids = (await listStudies()).map((r) => r.id);
    expect(ids).toEqual(['good']);
  });
});

describe('passage separation (PLAN §4.4)', () => {
  it('rejoins the passage on read but keeps it out of the list', async () => {
    await putStudyFull({ ...freshStudy('p', 'John 1'), passage: samplePassageContainer });

    const [row] = await listStudies();
    expect(row.reference).toBe('John 1');
    expect('passage' in row).toBe(false);

    const got = await getStudy('p');
    expect(got?.passage.primaryId).toBe('webbe');
    expect(got?.passage.translations.webbe?.translationId).toBe('webbe');
  });

  it('a body-only save (the autosave path) leaves the stored passage intact', async () => {
    const s: Study = { ...freshStudy('x', 'Mark 1'), passage: samplePassageContainer };
    await putStudyFull(s);

    // Autosave writes the body only; the passage store must be untouched.
    await putStudy({ ...s, setup: { ...s.setup, reference: 'Mark 2' } });

    const got = await getStudy('x');
    expect(got?.setup.reference).toBe('Mark 2');
    expect(got?.passage.translations.webbe?.translationId).toBe('webbe');
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

  it('imports a valid embedded image, storing the study', async () => {
    const study = { ...freshStudy('img', 'Luke 1'), passage: samplePassageContainer };
    const file = serializeStudy(study, [{ id: 'im1', mime: 'image/png', w: 1, h: 1, dataBase64: 'AAAA' }]);
    const result = await importStudy(file);
    expect(result.ok).toBe(true);
    expect(await listStudies()).toHaveLength(1);
  });

  it('rejects a corrupt embedded image WITHOUT leaving a half-imported study (rule 6)', async () => {
    const file = serializeStudy(freshStudy('bad', 'Luke 1'), [
      { id: 'im1', mime: 'image/png', w: 1, h: 1, dataBase64: '!!!not-base64!!!' },
    ]);
    const result = await importStudy(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/corrupted image|could not be decoded/i);
    // The critical property: nothing was persisted (no ghost study) and the file is quarantined.
    expect(await listStudies()).toHaveLength(0);
    expect(await listQuarantine()).toHaveLength(1);
  });

  it('§3.4 fails the WHOLE import atomically when only one of several images is corrupt', async () => {
    // One valid + one corrupt image: the import must reject before persisting anything, so a good
    // image can never smuggle a half-imported (ghost) study past the corrupt one (rule 6).
    const file = serializeStudy({ ...freshStudy('mix', 'Luke 1'), passage: samplePassageContainer }, [
      { id: 'ok', mime: 'image/png', w: 1, h: 1, dataBase64: 'AAAA' },
      { id: 'bad', mime: 'image/png', w: 1, h: 1, dataBase64: '!!!not-base64!!!' },
    ]);
    const result = await importStudy(file);
    expect(result.ok).toBe(false);
    expect(await listStudies()).toHaveLength(0); // no ghost study
    expect(await listQuarantine()).toHaveLength(1);
  });

  it('rejects an embedded image whose type is outside the upload allow-list (e.g. SVG)', async () => {
    const file = serializeStudy(freshStudy('svg', 'Luke 1'), [
      { id: 'im1', mime: 'image/svg+xml', w: 1, h: 1, dataBase64: 'AAAA' },
    ]);
    const result = await importStudy(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/unsupported type/i);
    expect(await listStudies()).toHaveLength(0);
  });
});
