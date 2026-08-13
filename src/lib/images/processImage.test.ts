import { describe, expect, it } from 'vitest';

import { MAX_BYTES, MAX_EDGE, shouldDownscale } from '@/lib/images/processImage';

// The full `processImageFile` needs `createImageBitmap` + `<canvas>` (browser-only, verified live);
// here we lock the pure fidelity-first *policy* — normal images pass through untouched.
describe('shouldDownscale (fidelity-first policy)', () => {
  it('keeps a normal image untouched (within both caps)', () => {
    expect(shouldDownscale(1600, 1200, 800_000)).toBe(false);
    expect(shouldDownscale(3000, 2000, 5 * 1024 * 1024)).toBe(false);
    expect(shouldDownscale(MAX_EDGE, MAX_EDGE, 1000)).toBe(false); // exactly at the edge cap is fine
  });

  it('downscales only a genuinely oversized image (edge OR bytes)', () => {
    expect(shouldDownscale(MAX_EDGE + 1, 100, 1000)).toBe(true); // too wide
    expect(shouldDownscale(100, 100, MAX_BYTES + 1)).toBe(true); // too heavy
  });
});
