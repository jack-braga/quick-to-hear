import { newId, nowIso } from '@/lib/id';
import {
  getDB,
  STORE_PASSAGES,
  STORE_QUARANTINE,
  STORE_STUDIES,
  type QuarantineRecord,
} from '@/lib/storage/db';
import { hydrate } from '@/lib/storage/hydrate';
import { toSummary, type ParsedText, type Study, type StudySummary } from '@/types/study';

/**
 * The study CRUD + project-file API (PLAN §4.4). The study body and its passage
 * payload live in separate stores; autosave writes only the body ({@link putStudy}),
 * while create/import/passage-confirm write both.
 */

/** Envelope tag written into every exported project file, for friendly detection. */
export const EXPORT_FORMAT = 'quick-to-hear/study-project';

interface ProjectFileEnvelope {
  format: typeof EXPORT_FORMAT;
  exportedAt: string;
  study: Study;
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
  // Bodies have no passage; rejoin a null passage so `toSummary` sees a full Study.
  return bodies
    .map((body) => toSummary({ ...body, passage: { primary: null } }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getStudy(id: string): Promise<Study | null> {
  const db = await getDB();
  const body = await db.get(STORE_STUDIES, id);
  if (!body) return null;
  const primary = (await db.get(STORE_PASSAGES, id)) ?? null;
  // Belt-and-braces: hydrate a possibly-older stored body (never throws).
  const result = hydrate({ ...body, passage: { primary } }, { id, now: nowIso() });
  if (result.ok) return result.study;
  // A body that will not hydrate is quarantined rather than lost, and read as absent.
  await quarantineRaw({ ...body, passage: { primary } }, 'load', result.reason);
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

/** Persist the detached passage payload (create / import / Stage-2 confirm). */
export async function putPassage(id: string, primary: ParsedText | null): Promise<void> {
  const db = await getDB();
  await db.put(STORE_PASSAGES, primary, id);
}

/** Persist body + passage together (create / import). */
export async function putStudyFull(study: Study): Promise<void> {
  await putStudy(study);
  await putPassage(study.id, study.passage.primary);
}

export async function deleteStudy(id: string): Promise<void> {
  const db = await getDB();
  await Promise.all([db.delete(STORE_STUDIES, id), db.delete(STORE_PASSAGES, id)]);
}

// ---------------------------------------------------------------------------
// Export / import (project file — SPEC §4 "Project file. Re-importable.")
// ---------------------------------------------------------------------------

/** Serialise a study to the project-file JSON string (with envelope). */
export function serializeStudy(study: Study): string {
  const envelope: ProjectFileEnvelope = {
    format: EXPORT_FORMAT,
    exportedAt: nowIso(),
    study,
  };
  return JSON.stringify(envelope, null, 2);
}

export async function exportStudyBlob(id: string): Promise<Blob | null> {
  const study = await getStudy(id);
  if (!study) return null;
  return new Blob([serializeStudy(study)], { type: 'application/json' });
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

  // Fresh identity: new id (already applied) + updatedAt now so it sorts to the top.
  const study: Study = { ...result.study, id: freshId, updatedAt: now };
  await putStudyFull(study);
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
