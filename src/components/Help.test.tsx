import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { Help } from '@/components/Help';
import { useGuidance } from '@/lib/guidance';

// Reset to the default before each test. Testing Library auto-unmounts after each, so
// this runs with nothing mounted — no stray store update to warn about.
beforeEach(() => useGuidance.getState().setMode('full'));

describe('<Help>', () => {
  it('renders authored inline prose for a real key', () => {
    render(<Help helpKey="p5.faithfulness" />);
    expect(screen.getByRole('note')).toHaveAttribute('data-help', 'p5.faithfulness');
    expect(screen.getByText(/certainty/i)).toBeInTheDocument();
  });

  it('offers "Tell me more" in full mode and hides it in brief mode', async () => {
    const { rerender } = render(<Help helpKey="p5.theme" />);
    const more = screen.getByTestId('help-more-p5.theme');
    expect(more).toBeInTheDocument();

    // Expanding reveals the expandable tier.
    await userEvent.click(more);
    expect(screen.getByText(/A topic is a word/i)).toBeInTheDocument();

    // Brief mode collapses to inline only.
    act(() => useGuidance.getState().setMode('brief'));
    rerender(<Help helpKey="p5.theme" />);
    expect(screen.queryByTestId('help-more-p5.theme')).not.toBeInTheDocument();
  });

  it('falls back to the guidance placeholder when a key has no inline prose', () => {
    render(<Help helpKey="p9.unwritten" />);
    expect(screen.getByText(/Guidance to be written/i)).toBeInTheDocument();
    expect(screen.getByText(/p9\.unwritten/)).toBeInTheDocument();
  });
});
