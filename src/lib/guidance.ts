import { create } from 'zustand';

// Global guidance-detail preference (PLAN §4.7). `full` shows inline help + the
// "tell me more" expandables everywhere; `brief` collapses help to the always-on
// inline tier for experienced users. Persisted to localStorage like `src/lib/theme.ts`;
// default `full` (SPEC §5: written [I] as if it's the only thing shown, [E] as
// enrichment for those who want it).

export type GuidanceMode = 'full' | 'brief';

const KEY = 'qth/guidance';

function loadMode(): GuidanceMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'full' || v === 'brief') return v;
  } catch {
    /* localStorage unavailable (private mode / SSR) — fall through to default */
  }
  return 'full';
}

interface GuidanceState {
  mode: GuidanceMode;
  setMode: (m: GuidanceMode) => void;
  toggle: () => void;
}

export const useGuidance = create<GuidanceState>((set, get) => ({
  mode: loadMode(),
  setMode: (mode) => {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* ignored — the preference just won't persist */
    }
    set({ mode });
  },
  toggle: () => get().setMode(get().mode === 'full' ? 'brief' : 'full'),
}));
