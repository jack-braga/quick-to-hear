import { beforeEach, describe, expect, it } from 'vitest';

import { resolveTheme, useTheme } from '@/lib/theme';

describe('resolveTheme', () => {
  it('passes through explicit preferences', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('resolves system to light when the OS does not prefer dark (matchMedia stub)', () => {
    // vitest.setup.ts stubs matchMedia with matches:false.
    expect(resolveTheme('system')).toBe('light');
  });
});

describe('useTheme.setTheme', () => {
  beforeEach(() => {
    document.documentElement.className = '';
  });

  it('toggles the html class and persists the preference', () => {
    useTheme.getState().setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(localStorage.getItem('qth/theme')).toBe('dark');

    useTheme.getState().setTheme('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
