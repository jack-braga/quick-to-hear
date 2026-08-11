import type { AnnotationTone } from '@/v2/annotations';

/**
 * Tailwind classes per annotation tone (v2.4). Kept as literal strings so Tailwind's content
 * scanner generates them. `wash`/`ring` tint a verse in the passage; `borderL` is the card's
 * left rule; `cardLit` is a card's hovered emphasis. Amber has no CSS token, so it's inlined.
 */
export const TONE: Record<
  AnnotationTone,
  { wash: string; ring: string; borderL: string; cardLit: string }
> = {
  rubric: {
    wash: 'bg-rubric-wash',
    ring: 'bg-rubric-wash shadow-[inset_0_0_0_2px_var(--rubric)]',
    borderL: 'border-l-rubric',
    cardLit:
      '-translate-x-[3px] border-rubric bg-rubric-wash shadow-[0_0_0_2px_var(--rubric),0_8px_20px_-8px_rgba(166,50,30,0.4)]',
  },
  amber: {
    wash: 'bg-amber-wash',
    ring: 'bg-amber-wash shadow-[inset_0_0_0_2px_#b98a1e]',
    borderL: 'border-l-[#b98a1e]',
    cardLit:
      '-translate-x-[3px] border-[#b98a1e] bg-amber-wash shadow-[0_0_0_2px_#b98a1e,0_8px_20px_-8px_rgba(185,138,30,0.4)]',
  },
  lapis: {
    wash: 'bg-lapis-wash',
    ring: 'bg-lapis-wash shadow-[inset_0_0_0_2px_var(--lapis)]',
    borderL: 'border-l-lapis',
    cardLit:
      '-translate-x-[3px] border-lapis bg-lapis-wash shadow-[0_0_0_2px_var(--lapis),0_8px_20px_-8px_rgba(40,70,138,0.4)]',
  },
};

/** The strong ring colour per tone, as a raw CSS value (matches `TONE[t].ring`). Used by the verse
 *  jump-flash so the flash reads in the *jumped annotation's* tone rather than a generic colour. */
export const TONE_EDGE: Record<AnnotationTone, string> = {
  rubric: 'var(--rubric)',
  amber: '#b98a1e',
  lapis: 'var(--lapis)',
};

/** The wash colour per tone as a raw CSS value — for the diagonal multi-tone stripe a verse gets
 *  when it carries two or more tones (built inline as a repeating-linear-gradient). All three are
 *  theme-adaptive vars, so the stripe brightens/dims with light/dark like the flat washes. */
export const TONE_WASH: Record<AnnotationTone, string> = {
  rubric: 'var(--rubric-wash)',
  amber: 'var(--amber-wash)',
  lapis: 'var(--lapis-wash)',
};

/**
 * The 45° repeating-linear-gradient a verse carrying **two or more** distinct tones renders (owner:
 * "as many colours as are available"). Returns `undefined` for 0–1 tones (a single tone stays a flat
 * `TONE[t].wash` class). Shared by the single-column {@link ReaderCanvas} and {@link ParallelCanvas}.
 */
export function multiToneGradient(tones: AnnotationTone[], band = 8): string | undefined {
  if (tones.length < 2) return undefined;
  const stops = tones.map((t, i) => `${TONE_WASH[t]} ${i * band}px ${(i + 1) * band}px`).join(', ');
  return `repeating-linear-gradient(45deg, ${stops})`;
}
