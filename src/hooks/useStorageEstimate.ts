import { useCallback, useEffect, useState } from 'react';

/**
 * Surfaces the browser storage-usage estimate + whether storage is persisted, for the
 * honest durability notice (PLAN §4.4 — "work is never lost" is only as strong as the
 * browser allows). All fields are null where the Storage Manager is unavailable.
 */
export interface StorageEstimate {
  usageBytes: number | null;
  quotaBytes: number | null;
  /** 0–1 fraction of quota used, or null if unknown. */
  fraction: number | null;
  persisted: boolean | null;
}

const EMPTY: StorageEstimate = {
  usageBytes: null,
  quotaBytes: null,
  fraction: null,
  persisted: null,
};

export function useStorageEstimate(): { estimate: StorageEstimate; refresh: () => void } {
  const [estimate, setEstimate] = useState<StorageEstimate>(EMPTY);

  const refresh = useCallback(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (!navigator.storage?.estimate) return;
        const { usage, quota } = await navigator.storage.estimate();
        const persisted = navigator.storage.persisted
          ? await navigator.storage.persisted()
          : null;
        if (cancelled) return;
        setEstimate({
          usageBytes: usage ?? null,
          quotaBytes: quota ?? null,
          fraction: usage != null && quota ? usage / quota : null,
          persisted,
        });
      } catch {
        /* leave the previous estimate in place */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { estimate, refresh };
}
