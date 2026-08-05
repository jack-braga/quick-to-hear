import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from '@/App';

// Smoke test: the shell mounts under HashRouter and the Home route renders. Exercises
// the whole jsdom + Testing Library + theme-store + router setup end to end.
describe('App shell', () => {
  it('renders the Home landing content', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /prepare a bible study/i })).toBeInTheDocument();
  });

  it('renders the theme toggle in the header', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /theme:/i })).toBeInTheDocument();
  });
});
