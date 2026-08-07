import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import typography from '@tailwindcss/typography';

export default {
  // Theming is class-driven (light/dark/system → `.light`/`.dark` on <html>).
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // --- v2 "leaf on a desk" palette (see index.css + ROADMAP-v2 §1). These are
        // full colour values (not HSL triplets), so they're consumed as `var(--…)`
        // directly — no `/opacity` modifier (the washes are their own tokens).
        desk: 'var(--desk)',
        leaf: 'var(--leaf)',
        panel: 'var(--panel)',
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faint: 'var(--ink-faint)',
        },
        line: 'var(--line)',
        lapis: {
          DEFAULT: 'var(--lapis)',
          ink: 'var(--lapis-ink)',
          wash: 'var(--lapis-wash)',
          edge: 'var(--lapis-edge)',
        },
        rubric: {
          DEFAULT: 'var(--rubric)',
          wash: 'var(--rubric-wash)',
        },
      },
      fontFamily: {
        // The passage is the subject: a humanist serif is reserved for Scripture
        // (`font-scripture`); every anchor/command is monospace (`font-mono`); the
        // rest of the UI chrome stays in the system sans stack (`font-sans`).
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        scripture: [
          'Iowan Old Style',
          'Palatino Linotype',
          'Palatino',
          'Book Antiqua',
          'Georgia',
          'serif',
        ],
        mono: ['SF Mono', 'JetBrains Mono', 'Menlo', 'Consolas', 'ui-monospace', 'monospace'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        leaf: 'var(--leaf-radius)',
      },
      boxShadow: {
        leaf: 'var(--leaf-shadow)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // A verse jump-flash (the `/` "jump to verse" + click-a-note-anchor cue).
        'verse-flash': {
          '0%, 100%': { boxShadow: 'none', backgroundColor: 'transparent' },
          '30%': { boxShadow: 'inset 0 0 0 2px var(--rubric)', backgroundColor: 'var(--rubric-wash)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'verse-flash': 'verse-flash 1.2s ease',
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
} satisfies Config;
