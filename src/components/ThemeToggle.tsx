import { Monitor, Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTheme, type Theme } from '@/lib/theme';

// Cycle light → dark → system. Kept as a single button (minimal chrome) so the
// header never out-competes the passage; a fuller control can replace it later.
const ORDER: Theme[] = ['light', 'dark', 'system'];
const NEXT_LABEL: Record<Theme, string> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

export function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={`Theme: ${theme}. Switch to ${NEXT_LABEL[theme]}.`}
      title={`Theme: ${theme} (click for ${NEXT_LABEL[theme]})`}
      data-theme-pref={theme}
    >
      {theme === 'light' && <Sun aria-hidden />}
      {theme === 'dark' && <Moon aria-hidden />}
      {theme === 'system' && <Monitor aria-hidden />}
    </Button>
  );
}
