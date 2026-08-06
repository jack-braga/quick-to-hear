import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Help } from '@/components/Help';
import type { HelpEntry } from '@/lib/content/help';
import type { UseHelp } from '@/hooks/useHelp';

// The [X] worked-example tier is unwritten in *content* until the teaching session fills a
// `<!-- example -->` block, so we mock the resolver to prove the *wiring*: a filled example
// surfaces the "See a worked example" disclosure with no code change; an empty one shows
// nothing. (The parser's own extraction is covered in `content/help.test.ts`.)
vi.mock('@/hooks/useHelp', () => ({ useHelp: vi.fn() }));
import { useHelp } from '@/hooks/useHelp';

const mockUseHelp = vi.mocked(useHelp);

function entry(example: string): HelpEntry {
  return {
    key: 'p5.theme',
    title: 'Theme',
    phase: '5',
    state: null,
    source: null,
    flag: null,
    inline: 'A theme in one sentence.',
    expandable: '',
    example,
    page: '',
  };
}

afterEach(() => mockUseHelp.mockReset());

describe('<Help> worked-example ([X]) tier', () => {
  it('shows the "See a worked example" disclosure and reveals it when an example is authored', async () => {
    mockUseHelp.mockReturnValue({
      entry: entry('For **Luke 1:5-25**, the theme is that God keeps his word.'),
      hasContent: true,
      showExpandable: false,
      showExample: true,
    } satisfies UseHelp);

    render(<Help helpKey="p5.theme" />);
    const button = screen.getByTestId('help-example-p5.theme');
    expect(button).toHaveTextContent(/see a worked example/i);

    await userEvent.click(button);
    expect(screen.getByText(/God keeps his word/i)).toBeInTheDocument();
  });

  it('renders no example disclosure when the key has no authored example (the common case)', () => {
    mockUseHelp.mockReturnValue({
      entry: entry(''),
      hasContent: true,
      showExpandable: false,
      showExample: false,
    } satisfies UseHelp);

    render(<Help helpKey="p5.theme" />);
    expect(screen.queryByTestId('help-example-p5.theme')).not.toBeInTheDocument();
  });
});
