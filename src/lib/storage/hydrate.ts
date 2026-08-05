import { CURRENT_SCHEMA_VERSION, StudySchema, type Study } from '@/types/study';

/**
 * Load = `hydrate(raw)`, never "reject" (PLAN §4.2, Principle 7 — work is never lost).
 *
 * One `hydrate()` is used by *both* IndexedDB load and project-file import:
 * - additive-optional fields get schema defaults (an old/partial doc upgrades cleanly);
 * - on unrecoverable parse failure it **quarantines and keeps** the raw blob rather
 *   than discarding it — the caller persists the quarantine so nothing is ever lost.
 *
 * `hydrate` is pure: it takes no `Date`/`crypto`. Callers pass a fallback `id`/`now`
 * (the IDB key + current time, or a fresh id for import) used only when the raw doc
 * is missing them.
 */

export interface HydrateContext {
  /** Fallback id when the raw document has none (e.g. the IDB store key). */
  id: string;
  /** Fallback ISO timestamp for createdAt/updatedAt when the raw doc lacks them. */
  now: string;
}

export interface HydrateOk {
  ok: true;
  study: Study;
  /** True when the raw document was an older/partial shape we upgraded. */
  upgraded: boolean;
}

export interface HydrateFail {
  ok: false;
  reason: string;
  raw: unknown;
}

export type HydrateResult = HydrateOk | HydrateFail;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Version migrations run before the current schema is applied. There is only v1
 * today, so this is the identity — but the seam is here so a real v1→v2 restructure
 * runs *before* the version is forced to current (never strip newer data blindly).
 */
function migrate(input: Record<string, unknown>, _fromVersion: number): Record<string, unknown> {
  return input;
}

export function hydrate(raw: unknown, ctx: HydrateContext): HydrateResult {
  if (!isPlainObject(raw)) {
    return { ok: false, reason: 'Not a study document (expected an object).', raw };
  }

  const incomingVersion = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;

  // A document written by a *newer* app version may use fields we would strip on
  // parse — refuse rather than silently drop data. Quarantine keeps it intact.
  if (incomingVersion > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: `This file was made by a newer version of the app (v${incomingVersion}). Update the app to open it.`,
      raw,
    };
  }

  try {
    const migrated = migrate({ ...raw }, incomingVersion);

    // A `build` present but missing its `format` discriminant (older/hand-edited
    // doc) would fail the discriminated union — mirror it from setup.format.
    if (isPlainObject(migrated.build) && migrated.build.format === undefined) {
      const setupFormat = isPlainObject(migrated.setup) ? migrated.setup.format : undefined;
      migrated.build = {
        ...migrated.build,
        format: typeof setupFormat === 'string' ? setupFormat : 'study',
      };
    }

    // Fill identity/timestamps only where the raw doc lacks them, then force the
    // version current (we have just upgraded it).
    migrated.id = typeof raw.id === 'string' && raw.id ? raw.id : ctx.id;
    migrated.createdAt =
      typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : ctx.now;
    migrated.updatedAt =
      typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : ctx.now;
    migrated.schemaVersion = CURRENT_SCHEMA_VERSION;

    const study = StudySchema.parse(migrated);
    return { ok: true, study, upgraded: incomingVersion !== CURRENT_SCHEMA_VERSION };
  } catch (err) {
    return {
      ok: false,
      reason:
        err instanceof Error
          ? `Could not read this study: ${err.message.split('\n')[0]}`
          : 'Could not read this study.',
      raw,
    };
  }
}
