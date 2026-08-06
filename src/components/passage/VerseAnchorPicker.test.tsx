import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { VerseAnchorPicker } from '@/components/passage/VerseAnchorPicker';
import { ParsedTextSchema, type ParsedText } from '@/types/passage';
import type { VerseAnchor } from '@/types/study';

const passage: ParsedText = ParsedTextSchema.parse({
  translationId: 'webbe',
  blocks: [
    {
      kind: 'p',
      verses: [
        { verseId: 'LUKE.1.5', present: true, fragments: [{ text: 'Verse five.', qlevel: 0 }] },
        { verseId: 'LUKE.1.6', present: true, fragments: [{ text: 'Verse six.', qlevel: 0 }] },
        { verseId: 'LUKE.1.7', present: false, fragments: [] },
      ],
    },
  ],
});

/** A controlled wrapper so clicks flow through real state, and expose the value. */
function Harness({ multiple }: { multiple?: boolean }) {
  const [value, setValue] = useState<VerseAnchor>({ verseIds: [] });
  return (
    <>
      <VerseAnchorPicker passage={passage} value={value} onChange={setValue} multiple={multiple} />
      <output data-testid="value">{value.verseIds.join(',')}</output>
    </>
  );
}

describe('VerseAnchorPicker', () => {
  it('renders one toggle per verse and disables gap verses', () => {
    render(<Harness multiple />);
    expect(screen.getByRole('checkbox', { name: 'Luke 1:5' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Luke 1:7' })).toBeDisabled(); // gap
  });

  it('multi-select accumulates verse IDs in canonical order', async () => {
    const user = userEvent.setup();
    render(<Harness multiple />);
    // Select v6 first, then v5 — output must still be sorted 5,6.
    await user.click(screen.getByRole('checkbox', { name: 'Luke 1:6' }));
    await user.click(screen.getByRole('checkbox', { name: 'Luke 1:5' }));
    expect(screen.getByTestId('value')).toHaveTextContent('LUKE.1.5,LUKE.1.6');
    // Toggling v6 off removes just it.
    await user.click(screen.getByRole('checkbox', { name: 'Luke 1:6' }));
    expect(screen.getByTestId('value')).toHaveTextContent('LUKE.1.5');
  });

  it('single-select keeps at most one verse', async () => {
    const user = userEvent.setup();
    render(<Harness multiple={false} />);
    await user.click(screen.getByRole('radio', { name: 'Luke 1:5' }));
    expect(screen.getByTestId('value')).toHaveTextContent('LUKE.1.5');
    await user.click(screen.getByRole('radio', { name: 'Luke 1:6' }));
    expect(screen.getByTestId('value')).toHaveTextContent('LUKE.1.6');
    expect(screen.getByTestId('value')).not.toHaveTextContent('LUKE.1.5');
  });
});
