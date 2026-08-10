import { describe, expect, it } from 'vitest';

import { multiToneGradient } from '@/v2/tones';

describe('multiToneGradient', () => {
  it('returns undefined for zero or one tone (a flat wash is used instead)', () => {
    expect(multiToneGradient([])).toBeUndefined();
    expect(multiToneGradient(['lapis'])).toBeUndefined();
  });

  it('builds a 45° repeating stripe cycling through every tone present', () => {
    const g = multiToneGradient(['rubric', 'amber', 'lapis'], 8);
    expect(g).toBe(
      'repeating-linear-gradient(45deg, var(--rubric-wash) 0px 8px, rgba(185,138,30,0.13) 8px 16px, var(--lapis-wash) 16px 24px)',
    );
  });
});
