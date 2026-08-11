import { describe, expect, it } from 'vitest';

import { crossRefTranslationId, findTranslation } from '@/lib/bible/translations';

describe('crossRefTranslationId', () => {
  it('keeps a bundled primary (it ships a full Bible for cross-references)', () => {
    expect(crossRefTranslationId('webbe')).toBe('webbe');
    expect(crossRefTranslationId('asv')).toBe('asv');
  });

  it('falls back to WEBBE for a pasted/unknown translation (no full Bible for another passage)', () => {
    expect(crossRefTranslationId('my-pasted-niv')).toBe('webbe');
    expect(crossRefTranslationId('')).toBe('webbe');
    // and the fallback resolves to a real bundled translation
    expect(findTranslation(crossRefTranslationId('anything'))?.shortName).toBe('WEBBE');
  });
});
