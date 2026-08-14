import { base64ToBytes, bytesToBase64 } from '@/lib/images/encode';
import { ACCEPTED_MIME, MAX_BYTES } from '@/lib/images/processImage';
import { newId, nowIso } from '@/lib/id';
import {
  getDB,
  STORE_IMAGES,
  STORE_PASSAGES,
  STORE_QUARANTINE,
  STORE_STUDIES,
  type ImageRecord,
  type QuarantineRecord,
} from '@/lib/storage/db';
import { hydrate } from '@/lib/storage/hydrate';
import { toSummary, type Passage, type Study, type StudySummary } from '@/types/study';

/**
 * The study CRUD + project-file API (PLAN §4.4). The study body and its passage
 * payload live in separate stores; autosave writes only the body ({@link putStudy}),
 * while create/import/passage-confirm write both. Attached-image bytes live in a third
 * store keyed by image id (see {@link putImage}) and ride the project file as base64.
 */

/** Envelope tag written into every exported project file, for friendly detection. */
export const EXPORT_FORMAT = 'quick-to-hear/study-project';

/** An attached image embedded in a project file (base64 — JSON can't carry a Blob). */
export interface EnvelopeImage {
  id: string;
  mime: string;
  w: number;
  h: number;
  dataBase64: string;
}

interface ProjectFileEnvelope {
  format: typeof EXPORT_FORMAT;
  exportedAt: string;
  study: Study;
  images: EnvelopeImage[];
}

/** Detach the passage payload so the body can be persisted on its own. */
function toBody(study: Study): Omit<Study, 'passage'> {
  const { passage: _passage, ...body } = study;
  return body;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function listStudies(): Promise<StudySummary[]> {
  const db = await getDB();
  const bodies = await db.getAll(STORE_STUDIES);
  // Bodies have no passage; rejoin an empty one so `toSummary` sees a full Study.
  return bodies
    .map((body) => toSummary({ ...body, passage: { translations: {}, primaryId: null } }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getStudy(id: string): Promise<Study | null> {
  const db = await getDB();
  const body = await db.get(STORE_STUDIES, id);
  if (!body) return null;
  // The passage store holds the whole passage payload (M3). A legacy record is a bare
  // ParsedText (the pre-M3 primary); `hydrate` → `normaliseStoredPassage` upgrades it.
  const storedPassage = (await db.get(STORE_PASSAGES, id)) ?? null;
  const result = hydrate({ ...body, passage: storedPassage }, { id, now: nowIso() });
  if (result.ok) return result.study;
  // A body that will not hydrate is quarantined rather than lost, and read as absent.
  await quarantineRaw({ ...body, passage: storedPassage }, 'load', result.reason);
  return null;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/** Persist the study **body only** — the autosave path (passage store untouched). */
export async function putStudy(study: Study): Promise<void> {
  const db = await getDB();
  await db.put(STORE_STUDIES, toBody(study), study.id);
}

/** Persist the detached passage payload (create / import / passage-confirm). Stores the
 *  whole M3 passage object (all translations + primaryId), not just the primary. */
export async function putPassage(id: string, passage: Passage): Promise<void> {
  const db = await getDB();
  await db.put(STORE_PASSAGES, passage, id);
}

/** Persist body + passage together (create / import). */
export async function putStudyFull(study: Study): Promise<void> {
  await putStudy(study);
  await putPassage(study.id, study.passage);
}

export async function deleteStudy(id: string): Promise<void> {
  const db = await getDB();
  const imageIds = await db.getAllKeysFromIndex(STORE_IMAGES, 'by-study', id);
  await Promise.all([
    db.delete(STORE_STUDIES, id),
    db.delete(STORE_PASSAGES, id),
    ...imageIds.map((imageId) => db.delete(STORE_IMAGES, imageId)),
  ]);
}

// ---------------------------------------------------------------------------
// Attached images — bytes in their own store (out of the autosaved body), keyed
// by image id and tagged with the owning studyId (the `by-study` index) for GC.
// ---------------------------------------------------------------------------

/** Store an image's bytes under its id (the annotation keeps only the lightweight ref). */
export async function putImage(id: string, record: ImageRecord): Promise<void> {
  const db = await getDB();
  await db.put(STORE_IMAGES, record, id);
}

/** Read an image's bytes + metadata, or null if it isn't stored. */
export async function getImage(id: string): Promise<ImageRecord | null> {
  const db = await getDB();
  return (await db.get(STORE_IMAGES, id)) ?? null;
}

/** The ids of every image owned by a study (via the `by-study` index). */
export async function imageIdsForStudy(studyId: string): Promise<string[]> {
  const db = await getDB();
  return db.getAllKeysFromIndex(STORE_IMAGES, 'by-study', studyId);
}

/** Remove an image's bytes (called when a card's image is deleted). */
export async function deleteImage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_IMAGES, id);
}

// ---------------------------------------------------------------------------
// Export / import (project file — SPEC §4 "Project file. Re-importable.")
// ---------------------------------------------------------------------------

/** Serialise a study to the project-file JSON string (with envelope). Image bytes are pre-collected
 *  (async — see {@link collectStudyImages}) and passed in; `serializeStudy` itself stays pure/sync. */
export function serializeStudy(study: Study, images: EnvelopeImage[] = []): string {
  const envelope: ProjectFileEnvelope = {
    format: EXPORT_FORMAT,
    exportedAt: nowIso(),
    study,
    images,
  };
  return JSON.stringify(envelope, null, 2);
}

/** Read a study's image blobs and base64-encode them for embedding in the project file (so a
 *  shared/backed-up study keeps its images — rule 6, work is never lost). */
export async function collectStudyImages(studyId: string): Promise<EnvelopeImage[]> {
  const db = await getDB();
  const ids = await db.getAllKeysFromIndex(STORE_IMAGES, 'by-study', studyId);
  const out: EnvelopeImage[] = [];
  for (const id of ids) {
    const rec = await db.get(STORE_IMAGES, id);
    if (!rec) continue;
    out.push({ id, mime: rec.mime, w: rec.w, h: rec.h, dataBase64: bytesToBase64(rec.bytes) });
  }
  return out;
}

export async function exportStudyBlob(id: string): Promise<Blob | null> {
  const study = await getStudy(id);
  if (!study) return null;
  const images = await collectStudyImages(id);
  return new Blob([serializeStudy(study, images)], { type: 'application/json' });
}

/** Pull the study out of a parsed file, tolerating a bare (envelope-less) study. */
function unwrap(parsed: unknown): unknown {
  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    'format' in parsed &&
    (parsed as { format?: unknown }).format === EXPORT_FORMAT &&
    'study' in parsed
  ) {
    return (parsed as { study: unknown }).study;
  }
  return parsed;
}

/** Pull the embedded image bytes out of a parsed project file (absent/old files → none). */
function extractEnvelopeImages(parsed: unknown): EnvelopeImage[] {
  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    'images' in parsed &&
    Array.isArray((parsed as { images?: unknown }).images)
  ) {
    return (parsed as { images: unknown[] }).images.filter(
      (im): im is EnvelopeImage =>
        im !== null &&
        typeof im === 'object' &&
        typeof (im as EnvelopeImage).id === 'string' &&
        typeof (im as EnvelopeImage).mime === 'string' &&
        typeof (im as EnvelopeImage).dataBase64 === 'string' &&
        typeof (im as EnvelopeImage).w === 'number' &&
        typeof (im as EnvelopeImage).h === 'number',
    );
  }
  return [];
}

export type ImportResult =
  | { ok: true; study: Study; upgraded: boolean }
  | { ok: false; error: string };

/**
 * Import a project file. **Always mints a fresh study id** (owner decision) so a
 * trainee→trainer handoff never clobbers an existing study; the content is preserved.
 * On any failure the raw text is quarantined (kept, never discarded) and a friendly
 * error is returned.
 */
export async function importStudy(text: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    await quarantineRaw(text, 'import', 'File is not valid JSON.');
    return { ok: false, error: "That file isn't valid JSON — is it a Quick to Hear project file?" };
  }

  const rawStudy = unwrap(parsed);
  const now = nowIso();
  const freshId = newId();

  // Strip the incoming id so hydrate falls back to the fresh one (import-as-copy).
  const forImport =
    rawStudy !== null && typeof rawStudy === 'object' && !Array.isArray(rawStudy)
      ? (() => {
          const { id: _id, ...rest } = rawStudy as Record<string, unknown>;
          return rest;
        })()
      : rawStudy;

  const result = hydrate(forImport, { id: freshId, now });
  if (!result.ok) {
    await quarantineRaw(parsed, 'import', result.reason);
    return { ok: false, error: result.reason };
  }

  // Re-mint image ids on import (so re-importing the same file twice never makes two studies fight
  // over one image record), remap the annotation refs to the new ids, and drop any ref whose bytes
  // aren't in the file. Fresh identity: new study id + updatedAt now so it sorts to the top.
  const envImages = extractEnvelopeImages(parsed);

  // Validate + decode every embedded image BEFORE persisting anything. Import is the app's untrusted
  // surface, so it enforces the same allow-list + size cap processImageFile applies on upload, and it
  // must never leave a half-imported "ghost" study: the study body used to be committed first and a
  // corrupt base64 then threw from atob(), rejecting the promise while stranding a study with dangling
  // image refs. A bad image now fails the whole import (quarantined, like a malformed body).
  const decoded = new Map<string, ArrayBuffer>();
  for (const img of envImages) {
    let reason: string | null = null;
    let bytes: ArrayBuffer | null = null;
    if (!(ACCEPTED_MIME as readonly string[]).includes(img.mime)) {
      reason = `The project file has an image of an unsupported type (${img.mime}).`;
    } else {
      try {
        bytes = base64ToBytes(img.dataBase64);
      } catch {
        reason = 'The project file has a corrupted image (its data could not be decoded).';
      }
    }
    if (!reason && bytes && bytes.byteLength > MAX_BYTES) {
      reason = 'The project file has an image larger than the 12 MB limit.';
    }
    if (reason || !bytes) {
      const err = reason ?? 'The project file has an unreadable image.';
      await quarantineRaw(parsed, 'import', err);
      return { ok: false, error: err };
    }
    decoded.set(img.id, bytes);
  }

  const idMap = new Map<string, string>();
  for (const img of envImages) idMap.set(img.id, newId());

  const study: Study = {
    ...result.study,
    id: freshId,
    updatedAt: now,
    annotations: result.study.annotations.map((a) =>
      a.images && a.images.length
        ? {
            ...a,
            images: a.images.flatMap((ref) => {
              const mapped = idMap.get(ref.id);
              return mapped ? [{ ...ref, id: mapped }] : [];
            }),
          }
        : a,
    ),
  };

  await putStudyFull(study);
  await Promise.all(
    envImages.map((img) =>
      putImage(idMap.get(img.id)!, {
        studyId: freshId,
        bytes: decoded.get(img.id)!,
        mime: img.mime,
        w: img.w,
        h: img.h,
      }),
    ),
  );
  return { ok: true, study, upgraded: result.upgraded };
}

// ---------------------------------------------------------------------------
// Quarantine (kept-but-unreadable; Principle 7)
// ---------------------------------------------------------------------------

async function quarantineRaw(
  raw: unknown,
  source: QuarantineRecord['source'],
  reason: string,
): Promise<void> {
  try {
    const db = await getDB();
    const record: QuarantineRecord = {
      id: newId(),
      quarantinedAt: nowIso(),
      reason,
      source,
      raw,
    };
    await db.put(STORE_QUARANTINE, record, record.id);
  } catch {
    // Quarantine is a best-effort backstop; never let it throw over the caller.
  }
}

export async function listQuarantine(): Promise<QuarantineRecord[]> {
  const db = await getDB();
  return db.getAll(STORE_QUARANTINE);
}
