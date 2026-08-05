/**
 * Opaque id generator for studies and in-document entities. Uses `crypto.randomUUID`
 * where available (all target browsers + jsdom ≥ 22), with a non-crypto fallback so
 * tests and older environments never throw.
 */
export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Current time as an ISO-8601 string — the one place study timestamps are stamped. */
export function nowIso(): string {
  return new Date().toISOString();
}
