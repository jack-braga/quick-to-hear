import { create } from 'zustand';

import { postStudyEvent } from '@/lib/broadcast';
import { newId, nowIso } from '@/lib/id';
import { reconcileMarks } from '@/lib/map';
import { primaryText } from '@/lib/passage';
import {
  addCandidate,
  candidateForSource,
  makeCandidateFromSource,
  type RecycleSource,
} from '@/lib/recycle';
import {
  deleteStudy as dbDeleteStudy,
  getStudy,
  importStudy,
  listStudies,
  putStudy,
  putStudyFull,
  type ImportResult,
} from '@/lib/storage';
import {
  makeStudy,
  MapSchema,
  ThemeAimSchema,
  toSummary,
  type Passage,
  type Setup,
  type Study,
  type StudySummary,
} from '@/types/study';

/** Surfaced (Home + Set-up) when a passage/reset write fails — the edit is kept, not lost (rule 6). */
const PASSAGE_SAVE_ERROR =
  'Could not save that change to your browser — your edit is kept; please try again.';

/**
 * The study store (PLAN §2 — Zustand + selector subscriptions). It owns the Home
 * list of summaries and the one open study (`current`). Mutations are reducer-style
 * actions that produce a new `current` and set `dirty`; the {@link useAutosave} hook
 * is the sole thing that decides *when* the dirty study is persisted.
 *
 * Fields commit to the store as the user edits (plain controlled inputs — no form library);
 * see {@link updateSetup} and the other reducer-style actions.
 */

interface StudyState {
  studies: StudySummary[];
  current: Study | null;
  /** True when `current` holds unsaved edits (autosave clears it after a write). */
  dirty: boolean;
  status: 'idle' | 'loading' | 'ready';
  /** Friendly, user-facing error (e.g. a failed import) surfaced on Home. */
  error: string | null;
  /** Set when another tab saved a newer copy of the open study (multi-tab guard). */
  conflict: boolean;

  refreshStudies: () => Promise<void>;
  createStudy: () => Promise<Study>;
  openStudy: (id: string) => Promise<Study | null>;
  closeStudy: () => void;
  updateSetup: (patch: Partial<Setup>) => void;
  applyToCurrent: (recipe: (study: Study) => Study) => void;
  /** Confirm the passage (M3: the whole translations map + primaryId): persist body +
   *  passage together and refresh the row. The page composes the next passage via the pure
   *  `@/lib/passage` builders; this is the single choke point that reconciles marks + saves.
   *  (The passage store isn't touched by keystroke autosave, so this is explicit.) */
  setPassage: (passage: Passage) => Promise<void>;
  /** Change the passage: reset the translations AND clear everything anchored to the old verse
   *  ids (cards, theme/aim, survey map, running order) so nothing is orphaned (§1.6). Persists. */
  resetPassage: () => Promise<void>;
  /** Phase-2 read counter tap (autosaved with the body). */
  incrementRead: () => void;
  /** Materialise a recycled source (a Phase-3 mark or a Phase-4 anchored note) into the
   *  Phase-6 candidate pool as a snapshot with provenance — copy-on-promote (§4.2).
   *  Idempotent: a source already in the pool is left untouched. */
  recycleToPool: (source: RecycleSource) => void;
  deleteStudy: (id: string) => Promise<void>;
  importProjectFile: (text: string) => Promise<ImportResult>;
  clearError: () => void;

  /** Persist `current` if dirty; returns what was saved so the caller can broadcast. */
  flushSave: () => Promise<{ id: string; updatedAt: string } | null>;
  /** Another tab saved this study — flag a conflict if it's newer than ours. */
  applyExternalSave: (id: string, updatedAt: string) => void;
  /** Another tab deleted this study — drop it from our view. */
  applyExternalDelete: (id: string) => void;
  /** Re-read the open study from storage (used to resolve a multi-tab conflict). */
  reloadCurrent: () => Promise<void>;
}

/** Stamp a new `updatedAt` and flag the study dirty for autosave. */
function touched(study: Study): Study {
  return { ...study, updatedAt: nowIso() };
}

export const useStudyStore = create<StudyState>((set, get) => {
  /**
   * Persist a fully-built next study (body + passage) with the {@link flushSave} discipline:
   * apply it optimistically but keep `dirty` set until the write resolves, so a failed persist
   * stays retryable and is surfaced (§1.4). Rethrows so the calling lens can react too (§1.5).
   */
  async function persistFull(next: Study): Promise<void> {
    set((s) => ({
      current: next,
      dirty: true,
      studies: s.studies.map((row) => (row.id === next.id ? toSummary(next) : row)),
    }));
    try {
      await putStudyFull(next);
    } catch (err) {
      // Keep `dirty` (already true) + surface the error, but only if a concurrent edit hasn't
      // superseded this one (guard on the snapshot's `updatedAt`, mirroring flushSave).
      set((s) =>
        s.current?.updatedAt === next.updatedAt ? { dirty: true, error: PASSAGE_SAVE_ERROR } : s,
      );
      throw err;
    }
    set((s) => (s.current?.updatedAt === next.updatedAt ? { dirty: false } : s));
    postStudyEvent({ type: 'saved', id: next.id, updatedAt: next.updatedAt });
  }

  return {
    studies: [],
    current: null,
    dirty: false,
    status: 'idle',
    error: null,
    conflict: false,

    refreshStudies: async () => {
      set({ status: 'loading' });
      const studies = await listStudies();
      set({ studies, status: 'ready' });
    },

    createStudy: async () => {
      const study = makeStudy(newId(), nowIso());
      await putStudyFull(study);
      set((s) => ({
        current: study,
        dirty: false,
        conflict: false,
        studies: [toSummary(study), ...s.studies],
      }));
      return study;
    },

    openStudy: async (id) => {
      set({ status: 'loading' });
      const study = await getStudy(id);
      set({ current: study, dirty: false, conflict: false, status: 'ready' });
      return study;
    },

    closeStudy: () => set({ current: null, dirty: false, conflict: false }),

    updateSetup: (patch) =>
      get().applyToCurrent((study) => ({ ...study, setup: { ...study.setup, ...patch } })),

    applyToCurrent: (recipe) =>
      set((s) => (s.current ? { current: touched(recipe(s.current)), dirty: true } : s)),

    setPassage: async (passage) => {
      const cur = get().current;
      if (!cur) return;
      // The primary text may have changed — degrade any sub-verse marks whose text no longer
      // matches (PLAN §4.3). This is the single choke point for a primary-text change (initial
      // load, translation switch, re-parse); marks anchor to the primary only, and reconcile
      // is idempotent when the primary is unchanged (e.g. merely adding a secondary).
      const primary = primaryText(passage);
      const map = primary ? reconcileMarks(cur.map, primary) : cur.map;
      // Persist body + passage now (bundled passage is a re-derivable cache — §4.4); a failed
      // write keeps `dirty` + surfaces (§1.4), so the passage is never silently lost.
      await persistFull(touched({ ...cur, passage, map }));
    },

    resetPassage: async () => {
      const cur = get().current;
      if (!cur) return;
      // Changing the passage clears everything anchored to the old verse ids — cards, the theme
      // & aim, the survey map, and the running order — so nothing is left orphaned on text that
      // no longer exists (§1.6). The lens confirms with the user before calling this.
      await persistFull(
        touched({
          ...cur,
          passage: { translations: {}, primaryId: null },
          annotations: [],
          runningOrder: [],
          themeAim: ThemeAimSchema.parse({}),
          map: MapSchema.parse({}),
        }),
      );
    },

    incrementRead: () =>
      get().applyToCurrent((study) => ({ ...study, read: { count: study.read.count + 1 } })),

    recycleToPool: (source) =>
      get().applyToCurrent((study) => {
        // Talk-mode builds (§4.9) have no candidate pool; nothing to recycle into.
        if (study.build.format !== 'study') return study;
        if (candidateForSource(study.build.candidates, source.source)) return study;
        const candidate = makeCandidateFromSource(source, newId());
        return {
          ...study,
          build: { ...study.build, candidates: addCandidate(study.build.candidates, candidate) },
        };
      }),

    deleteStudy: async (id) => {
      await dbDeleteStudy(id);
      postStudyEvent({ type: 'deleted', id });
      set((s) => ({
        studies: s.studies.filter((row) => row.id !== id),
        current: s.current?.id === id ? null : s.current,
        dirty: s.current?.id === id ? false : s.dirty,
      }));
    },

    importProjectFile: async (text) => {
      const result = await importStudy(text);
      if (result.ok) {
        set({ error: null });
        await get().refreshStudies();
      } else {
        set({ error: result.error });
      }
      return result;
    },

    clearError: () => set({ error: null }),

    flushSave: async () => {
      const { current, dirty } = get();
      if (!current || !dirty) return null;
      // Snapshot before the await so a concurrent edit isn't marked clean prematurely.
      const snapshot = current;
      await putStudy(snapshot);
      set((s) => (s.current?.updatedAt === snapshot.updatedAt ? { dirty: false } : s));
      postStudyEvent({ type: 'saved', id: snapshot.id, updatedAt: snapshot.updatedAt });
      return { id: snapshot.id, updatedAt: snapshot.updatedAt };
    },

    applyExternalSave: (id, updatedAt) =>
      set((s) =>
        s.current?.id === id && updatedAt > s.current.updatedAt ? { conflict: true } : s,
      ),

    applyExternalDelete: (id) =>
      set((s) => ({
        studies: s.studies.filter((row) => row.id !== id),
        current: s.current?.id === id ? null : s.current,
        conflict: s.current?.id === id ? false : s.conflict,
      })),

    reloadCurrent: async () => {
      const id = get().current?.id;
      if (!id) return;
      const study = await getStudy(id);
      set({ current: study, dirty: false, conflict: false });
    },
  };
});
