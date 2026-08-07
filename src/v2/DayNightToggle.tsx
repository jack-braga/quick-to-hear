import { resolveTheme, useTheme } from '@/lib/theme';

/**
 * Day / night toggle for the v2 shell (the mockup's ☾ / ☀). It reuses v1's theme store
 * (light / dark / system) but presents a simple binary flip: whatever is showing now, go to
 * the other. A long-press could expose "system" later; v2.2 keeps the chrome minimal so the
 * passage stays the subject.
 */
export function DayNightToggle() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const resolved = resolveTheme(theme);

  return (
    <button
      type="button"
      onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
      aria-label={`Theme: ${resolved}. Toggle day and night.`}
      title="Day / night"
      className="grid size-8 place-items-center rounded-lg border border-line bg-panel text-[15px] text-ink-soft transition-colors hover:border-lapis-edge hover:text-ink"
    >
      {resolved === 'dark' ? '☀' : '☾'}
    </button>
  );
}
