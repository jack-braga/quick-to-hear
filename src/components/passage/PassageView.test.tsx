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

  it('leads a poetry-opening verse with its number, not the previous line (Magnificat)', () => {
    // The Magnificat (Luke 1:46-55) is stored in a *prose* block whose fragments carry
    // poetry qlevels. v46 opens on a prose intro ("Mary said,"); v47 opens directly on
    // a poetry line. The verse number must lead the verse's own first line — for v47
    // that means the line break comes *before* the number, not after it (the old bug
    // stranded "47" at the tail of v46's last line).
    const pt = ParsedTextSchema.parse({
      translationId: 'webbe',
      reference: 'Luke 1:46-47',
      blocks: [
        {
          kind: 'p',
          verses: [
            {
              verseId: 'LUKE.1.46',
              present: true,
              fragments: [
                { text: 'Mary said,', qlevel: 0 },
                { text: '“My soul magnifies the Lord.', qlevel: 1 },
              ],
            },
            {
              verseId: 'LUKE.1.47',
              present: true,
              fragments: [{ text: 'My spirit has rejoiced in God my Saviour,', qlevel: 2 }],
            },
          ],
        },
      ],
    });
    const { container } = render(<PassageView passage={pt} />);

    // v46 opens on prose → its number is the first element child (no leading break).
    const v46 = container.querySelector('[data-verse="LUKE.1.46"]')!;
    expect(v46.firstElementChild?.tagName).toBe('SUP');
    expect(v46.firstElementChild?.textContent).toBe('46');

    // v47 opens on poetry → a <br> precedes the verse number (number leads the new line).
    const v47 = container.querySelector('[data-verse="LUKE.1.47"]')!;
    const kids = Array.from(v47.children);
    const brIdx = kids.findIndex((el) => el.tagName === 'BR');
    const supIdx = kids.findIndex((el) => el.tagName === 'SUP' && el.textContent === '47');
    expect(brIdx).toBeGreaterThanOrEqual(0);
    expect(supIdx).toBeGreaterThan(brIdx);
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
