import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type { Passage, Study } from '@/types/study';

/**
 * The IndexedDB shape. One record per study, with the **large, infrequently-changed
 * passage payload split into its own store** (PLAN §4.4) so the constant autosave of
 * the study body never re-serialises it. Un-hydratable blobs go to `quarantine` and
 * are never discarded (Principle 7).
 */

/** The study document as stored: everything except the detached passage payload. */
export type StoredStudyBody = Omit<Study, 'passage'>;

export interface QuarantineRecord {
  id: string;
  quarantinedAt: string;
  reason: string;
  source: 'load' | 'import';
  raw: unknown;
}

/** A user-attached image's bytes. Split into its own store (like `passages`) so the constant
 *  autosave of the study body never carries multi-MB image data. Stored as an **`ArrayBuffer`** (not a
 *  `Blob`): bytes structured-clone cleanly through IndexedDB everywhere and stay native/efficient at
 *  rest. Tagged with its owning `studyId` (the `by-study` index) so a study's images can be
 *  garbage-collected on delete; keyed in the store by the image's own id (out-of-line). */
export interface ImageRecord {
  studyId: string;
  bytes: ArrayBuffer;
  mime: string;
  w: number;
  h: number;
}

interface QuickToHearDB extends DBSchema {
  studies: { key: string; value: StoredStudyBody };
  // The whole M3 passage container (translations + primaryId). A legacy record physically
  // holds the pre-M3 bare `ParsedText`; `normaliseStoredPassage` upgrades it on read.
  passages: { key: string; value: Passage | null };
  quarantine: { key: string; value: QuarantineRecord };
  images: { key: string; value: ImageRecord; indexes: { 'by-study': string } };
}

export const DB_NAME = 'quicktohear';
// v2 adds the `images` blob store (attach-image feature). Independent of the document
// `CURRENT_SCHEMA_VERSION` — this is the IndexedDB shape, that is the study-body shape.
export const DB_VERSION = 2;

export const STORE_STUDIES = 'studies' as const;
export const STORE_PASSAGES = 'passages' as const;
export const STORE_QUARANTINE = 'quarantine' as const;
export const STORE_IMAGES = 'images' as const;

let dbPromise: Promise<IDBPDatabase<QuickToHearDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<QuickToHearDB>> {
  if (!dbPromise) {
    dbPromise = openDB<QuickToHearDB>(DB_NAME, DB_VERSION, {
      // `contains` guards make each create idempotent — a fresh install creates all stores; a v1→v2
      // upgrade creates only `images` (the others already exist).
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_STUDIES)) db.createObjectStore(STORE_STUDIES);
        if (!db.objectStoreNames.contains(STORE_PASSAGES)) db.createObjectStore(STORE_PASSAGES);
        if (!db.objectStoreNames.contains(STORE_QUARANTINE)) {
          db.createObjectStore(STORE_QUARANTINE);
        }
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          const images = db.createObjectStore(STORE_IMAGES);
          images.createIndex('by-study', 'studyId');
        }
      },
    });
  }
  return dbPromise;
}

/** Test-only: drop the cached connection so `fake-indexeddb` resets cleanly. */
export function __resetDbForTests(): void {
  dbPromise = null;
}
