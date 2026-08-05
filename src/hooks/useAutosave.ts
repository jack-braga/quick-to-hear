import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { onStudyEvent } from '@/lib/broadcast';
import { useStudyStore } from '@/store/study';

/**
 * Owns *when* the open study is persisted (PLAN §4.4). Mounted once, inside the
 * router. Debounces saves keyed on the study id, and force-flushes on route change,
 * tab-hide, and unload so nothing in flight is lost. Requests persistent storage on
 * first mount and wires the multi-tab guard (a save in another tab flags a conflict;
 * a delete drops the study from view).
 */

const DEBOUNCE_MS = 800;

async function requestPersistOnce(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* storage manager unavailable — durability is best-effort (see the Home notice) */
  }
}

export function useAutosave(): void {
  const dirty = useStudyStore((s) => s.dirty);
  const currentId = useStudyStore((s) => s.current?.id);
  const updatedAt = useStudyStore((s) => s.current?.updatedAt);
  const location = useLocation();

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // flushSave / applyExternal* are stable zustand actions; read them lazily from
  // getState() inside handlers to avoid stale closures.
  const flush = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    void useStudyStore.getState().flushSave();
  };

  // One-time: request persistence + subscribe to other tabs' events.
  useEffect(() => {
    void requestPersistOnce();
    const off = onStudyEvent((ev) => {
      const store = useStudyStore.getState();
      if (ev.type === 'saved' && ev.updatedAt) store.applyExternalSave(ev.id, ev.updatedAt);
      else if (ev.type === 'deleted') store.applyExternalDelete(ev.id);
    });
    return off;
  }, []);

  // Debounced save whenever the open study becomes dirty (re-armed on each edit).
  useEffect(() => {
    if (!dirty || !currentId) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void useStudyStore.getState().flushSave();
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [dirty, currentId, updatedAt]);

  // Flush the pending save when the route changes (leaving a study behind).
  useEffect(() => {
    return () => {
      void useStudyStore.getState().flushSave();
    };
  }, [location.pathname]);

  // Flush on tab-hide / unload (covers the PWA auto-update SW activating mid-edit).
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const onPageHide = () => flush();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onPageHide);
    };
  }, []);
}
