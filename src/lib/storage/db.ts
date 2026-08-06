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

interface QuickToHearDB extends DBSchema {
  studies: { key: string; value: StoredStudyBody };
  // The whole M3 passage container (translations + primaryId). A legacy record physically
  // holds the pre-M3 bare `ParsedText`; `normaliseStoredPassage` upgrades it on read.
  passages: { key: string; value: Passage | null };
  quarantine: { key: string; value: QuarantineRecord };
}

export const DB_NAME = 'quicktohear';
export const DB_VERSION = 1;

export const STORE_STUDIES = 'studies' as const;
export const STORE_PASSAGES = 'passages' as const;
export const STORE_QUARANTINE = 'quarantine' as const;

let dbPromise: Promise<IDBPDatabase<QuickToHearDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<QuickToHearDB>> {
  if (!dbPromise) {
    dbPromise = openDB<QuickToHearDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_STUDIES)) db.createObjectStore(STORE_STUDIES);
        if (!db.objectStoreNames.contains(STORE_PASSAGES)) db.createObjectStore(STORE_PASSAGES);
        if (!db.objectStoreNames.contains(STORE_QUARANTINE)) {
          db.createObjectStore(STORE_QUARANTINE);
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
