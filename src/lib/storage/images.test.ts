import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';

import { bytesToBase64 } from '@/lib/images/encode';
import { __resetDbForTests, type ImageRecord } from '@/lib/storage/db';
import {
  collectStudyImages,
  deleteImage,
  deleteStudy,
  getImage,
  imageIdsForStudy,
  importStudy,
  putImage,
  putStudy,
  putStudyFull,
  serializeStudy,
} from '@/lib/storage/studies';
import { getStudy } from '@/lib/storage/studies';
import { makeStudy, type Annotation, type Study } from '@/types/study';

const imgBytes = [1, 2, 3, 4, 5, 6, 7, 8, 250, 251, 252];
const originalBytes = () => Uint8Array.from(imgBytes).buffer;

function imgRecord(studyId: string): ImageRecord {
  return { studyId, bytes: originalBytes(), mime: 'image/png', w: 800, h: 600 };
}

function studyWithImage(id: string, imageId: string): Study {
  const s = makeStudy(id, '2026-01-01T00:00:00.000Z');
  const q: Annotation = {
    id: 'q1',
    kind: 'question',
    verseIds: ['LUKE.1.8'],
    text: 'What is Zacharias doing?',
    images: [{ id: imageId, caption: 'The temple', w: 800, h: 600 }],
  };
  return { ...s, annotations: [q] };
}

beforeEach(() => {
  (globalThis as unknown as { indexedDB: unknown }).indexedDB = new IDBFactory();
  __resetDbForTests();
});

describe('image blob store', () => {
  it('stores, reads, lists by study, and deletes an image', async () => {
    await putImage('img1', imgRecord('a'));
    expect((await getImage('img1'))?.mime).toBe('image/png');
    expect(await imageIdsForStudy('a')).toEqual(['img1']);

    await deleteImage('img1');
    expect(await getImage('img1')).toBeNull();
    expect(await imageIdsForStudy('a')).toEqual([]);
  });

  it('autosave (putStudy — body only) never writes the image store', async () => {
    await putStudy(studyWithImage('a', 'img1')); // the ref rides the body; the bytes do not
    expect(await imageIdsForStudy('a')).toEqual([]);
  });

  it('deleteStudy garbage-collects only its own images', async () => {
    await putStudyFull(studyWithImage('a', 'img1'));
    await putImage('img1', imgRecord('a'));
    await putImage('img2', imgRecord('a'));
    await putImage('other', imgRecord('b')); // a different study's image
    expect((await imageIdsForStudy('a')).sort()).toEqual(['img1', 'img2']);

    await deleteStudy('a');
    expect(await getImage('img1')).toBeNull();
    expect(await getImage('img2')).toBeNull();
    expect(await getImage('other')).not.toBeNull(); // untouched
  });
});

describe('project file round-trip with images', () => {
  it('export → import keeps the image (fresh study id, re-minted image id, bytes preserved, ref remapped)', async () => {
    await putStudyFull(studyWithImage('orig', 'img1'));
    await putImage('img1', imgRecord('orig'));

    // Serialise via the string path (jsdom Blob has no .text()); this exercises collect + serialize.
    const stored = await getStudy('orig');
    const text = serializeStudy(stored!, await collectStudyImages('orig'));

    const result = await importStudy(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.study.id).not.toBe('orig'); // fresh study id
    const ref = result.study.annotations[0]!.images![0]!;
    expect(ref.id).not.toBe('img1'); // re-minted image id
    expect(ref.caption).toBe('The temple'); // metadata preserved

    const rec = await getImage(ref.id);
    expect(rec).not.toBeNull();
    expect(rec!.studyId).toBe(result.study.id); // re-tagged to the new study for GC
    expect(bytesToBase64(rec!.bytes)).toBe(bytesToBase64(originalBytes())); // exact bytes

    // The original study's image is untouched — both coexist.
    expect(await getImage('img1')).not.toBeNull();
  });

  it('imports an old project file with no images (backward compatible)', async () => {
    await putStudyFull(makeStudy('legacy', '2026-01-01T00:00:00.000Z'));
    const stored = await getStudy('legacy');
    const text = serializeStudy(stored!); // no images arg → empty images

    const result = await importStudy(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.study.annotations).toEqual([]);
  });
});
