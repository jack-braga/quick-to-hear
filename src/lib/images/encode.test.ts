import { describe, expect, it } from 'vitest';

import { base64ToBytes, bytesToBase64, bytesToDataUrl } from '@/lib/images/encode';

const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2, 3, 254, 255]);

describe('image byte encoding', () => {
  it('round-trips bytes through base64 (exact bytes preserved)', () => {
    const b64 = bytesToBase64(bytes.buffer);
    const back = new Uint8Array(base64ToBytes(b64));
    expect(Array.from(back)).toEqual(Array.from(bytes));
  });

  it('bytesToBase64 has no data-URI prefix; bytesToDataUrl adds the mime', () => {
    expect(bytesToBase64(bytes.buffer).startsWith('data:')).toBe(false);
    expect(bytesToDataUrl(bytes.buffer, 'image/webp').startsWith('data:image/webp;base64,')).toBe(true);
  });
});
