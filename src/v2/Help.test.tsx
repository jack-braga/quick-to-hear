import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Help } from '@/v2/Help';

describe('v2 <Help>', () => {
  it('stays closed until the (i) is clicked, then shows the inline prose', async () => {
    render(<Help helpKey="p5.theme" label="Theme" />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /guidance: theme/i }));
    const note = screen.getByRole('note');
    expect(note).toHaveAttribute('data-help', 'p5.theme');
    expect(screen.getByText(/what the passage says/i)).toBeInTheDocument();
  });

  it('reveals the expandable [E] tier only behind "Tell me more"', async () => {
    render(<Help helpKey="p5.theme" />);
    await userEvent.click(screen.getByRole('button', { name: /guidance/i }));
    expect(screen.queryByText(/A topic is a word/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /tell me more/i }));
    expect(screen.getByText(/A topic is a word/i)).toBeInTheDocument();
  });

  it('renders nothing for a key with no authored prose', () => {
    const { container } = render(<Help helpKey="p9.unwritten" />);
    expect(container).toBeEmptyDOMElement();
  });
});
