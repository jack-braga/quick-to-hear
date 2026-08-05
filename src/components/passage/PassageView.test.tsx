import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PassageView } from '@/components/passage/PassageView';
import { ParsedTextSchema } from '@/types/passage';

describe('PassageView', () => {
  it('renders prose verse numbers and text', () => {
    const pt = ParsedTextSchema.parse({
      translationId: 'webbe',
      reference: 'Luke 1:5',
      blocks: [
        {
          kind: 'p',
          verses: [{ verseId: 'LUKE.1.5', present: true, fragments: [{ text: 'There was a priest.', qlevel: 0 }] }],
        },
      ],
    });
    render(<PassageView passage={pt} />);
    expect(screen.getByText('There was a priest.')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // verse number
  });

  it('renders the superscription and poetry lines', () => {
    const pt = ParsedTextSchema.parse({
      translationId: 'webbe',
      reference: 'Psalm 23',
      blocks: [
        { kind: 'd', verses: [], text: [{ text: 'A Psalm by David.', qlevel: 0 }] },
        {
          kind: 'q',
          verses: [
            {
              verseId: 'PS.23.1',
              present: true,
              fragments: [
                { text: 'The LORD is my shepherd;', qlevel: 1 },
                { text: 'I shall lack nothing.', qlevel: 2 },
              ],
            },
          ],
        },
      ],
    });
    const { container } = render(<PassageView passage={pt} />);
    expect(screen.getByText('A Psalm by David.')).toBeInTheDocument();
    expect(screen.getByText('The LORD is my shepherd;')).toBeInTheDocument();
    expect(screen.getByText('I shall lack nothing.')).toBeInTheDocument();
    // Two indented poetry lines are rendered inside the verse container.
    expect(container.querySelector('[data-verse="PS.23.1"]')?.children.length).toBe(2);
  });

  it('shows an omitted verse honestly (present:false → a gap marker, no text)', () => {
    const pt = ParsedTextSchema.parse({
      translationId: 'asv',
      blocks: [
        {
          kind: 'p',
          verses: [
            { verseId: 'ACTS.8.36', present: true, fragments: [{ text: 'As they went.', qlevel: 0 }] },
            { verseId: 'ACTS.8.37', present: false, fragments: [] },
            { verseId: 'ACTS.8.38', present: true, fragments: [{ text: 'He commanded.', qlevel: 0 }] },
          ],
        },
      ],
    });
    const { container } = render(<PassageView passage={pt} />);
    expect(container.querySelector('[data-gap]')).toBeTruthy();
    expect(screen.getByText('37')).toBeInTheDocument(); // the numbered slot is still shown
  });

  it('tints red-letter text distinctly', () => {
    const pt = ParsedTextSchema.parse({
      translationId: 'webbe',
      blocks: [
        {
          kind: 'p',
          verses: [{ verseId: 'LUKE.6.46', present: true, fragments: [{ text: 'Why do you call me Lord?', qlevel: 0, wj: true }] }],
        },
      ],
    });
    render(<PassageView passage={pt} />);
    const el = screen.getByText('Why do you call me Lord?');
    expect(el.className).toMatch(/rose/);
  });
});
