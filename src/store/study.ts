import { create } from 'zustand';

import { postStudyEvent } from '@/lib/broadcast';
import { newId, nowIso } from '@/lib/id';
import { reconcileMarks } from '@/lib/map';
import { addCandidate, candidateForSource, makeCandidateFromSource, type RecycleSource } from '@/lib/recycle';
import {
  deleteStudy as dbDeleteStudy,
  getStudy,
  importStudy,
  listStudies,
  putStudy,
  putStudyFull,
  type ImportResult,
} from '@/lib/storage';
import type { ParsedText } from '@/types/passage';
import { makeStudy, toSummary, type Setup, type Study, type StudySummary } from '@/types/study';

/**
 * The study store (PLAN §2 — Zustand + selector subscriptions). It owns the Home
 * list of summaries and the one open study (`current`). Mutations are reducer-style
 * actions that produce a new `current` and set `dirty`; the {@link useAutosave} hook
 * is the sole thing that decides *when* the dirty study is persisted.
 *
 * Per-field text will commit to the store on blur (react-hook-form arrives with the
 * Phase-1 form in Stage 2); Stage 1 uses plain controlled inputs + {@link updateSetup}.
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
  /** Confirm a parsed passage: persist body + passage together and refresh the row.
   *  (The passage store isn't touched by keystroke autosave, so this is explicit.) */
  setPassage: (primary: ParsedText | null) => Promise<void>;
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

export const useStudyStore = create<StudyState>((set, get) => ({
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
      studies: [
        {
          id: study.id,
          reference: study.setup.reference,
          seriesNote: study.setup.seriesNote,
          genre: study.setup.genre,
          updatedAt: study.updatedAt,
          createdAt: study.createdAt,
          questionCount: 0,
        },
        ...s.studies,
      ],
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

  setPassage: async (primary) => {
    const cur = get().current;
    if (!cur) return;
    // The passage text changed — degrade any sub-verse marks whose text no longer
    // matches (PLAN §4.3). This is the single choke point for a text change (initial
    // load, translation switch, re-parse), so it's the right place to reconcile.
    const map = primary ? reconcileMarks(cur.map, primary) : cur.map;
    const next = touched({ ...cur, passage: { primary }, map });
    // Persist body + passage now (bundled passage is a re-derivable cache — §4.4).
    set((s) => ({
      current: next,
      dirty: false,
      studies: s.studies.map((row) => (row.id === next.id ? toSummary(next) : row)),
    }));
    await putStudyFull(next);
    postStudyEvent({ type: 'saved', id: next.id, updatedAt: next.updatedAt });
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
}));
