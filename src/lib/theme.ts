import { create } from 'zustand';

// Light / dark / system theming as a small self-contained module (no next-themes),
// modelled on krenoda's pwa/src/state/ui.ts. The <html> class is seeded pre-paint by
// the inline bootstrap in index.html; this module re-applies the same resolution on
// load and keeps it in sync with the OS while the preference is 'system'.

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'qth/theme';

/** theme-color drives the mobile status-bar tint; keep it matched to each base bg. */
const THEME_COLORS: Record<'light' | 'dark', string> = {
  light: '#ffffff',
  dark: '#020817',
};

function loadTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark' || t === 'system') return t;
  } catch {
    /* localStorage unavailable (private mode / SSR) — fall through to default */
  }
  // Default: follow the OS. The user can still force light/dark from the header.
  return 'system';
}

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

/** Resolve a preference ('system' follows the OS) to a concrete theme. */
export function resolveTheme(pref: Theme): 'light' | 'dark' {
  return pref === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : pref;
}

function applyTheme(pref: Theme): void {
  const resolved = resolveTheme(pref);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.classList.toggle('light', resolved === 'light');
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[resolved]);
}

// Re-apply at import (pre-React), matching the index.html seed with no FOUC.
applyTheme(loadTheme());

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const useTheme = create<ThemeState>((set) => ({
  theme: loadTheme(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignored — preference just won't persist */
    }
    applyTheme(theme);
    set({ theme });
  },
}));

// While following the OS, re-apply the theme as the system scheme flips live.
try {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useTheme.getState().theme === 'system') applyTheme('system');
  });
} catch {
  /* matchMedia unavailable — no live OS sync, static resolution stands */
}
