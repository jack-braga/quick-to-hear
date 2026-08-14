import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeStudy, type Annotation, type Genre, type Study } from '@/types/study';
import { makeAnnotation } from '@/v2/annotations';
import { ComaPanel } from '@/v2/reader/ComaPanel';

// Two genres that share a verbatim-identical Context prompt — the §1.3 double-count scenario.
const SHARED_PROMPT = 'Where does this sit in the book?';
vi.mock('@/lib/content', () => ({
  comaSetsForGenres: (genres: string[]) =>
    genres.map((g) => ({
      genre: g,
      label: g,
      set: { context: [SHARED_PROMPT], observation: [], meaning: [], application: [] },
    })),
  comaContent: () => ({ attribution: '' }),
}));
// Keep the test on the panel's grouping logic, not the contenteditable editor or the help popover.
vi.mock('@/v2/reader/MentionEditor', () => ({
  MentionEditor: ({ value }: { value: string }) => <div data-testid="coma-answer">{value}</div>,
}));
vi.mock('@/v2/Help', () => ({ Help: () => null }));

function studyWithGenres(genres: Genre[]): Study {
  const s = makeStudy('s1', '2026-01-01T00:00:00.000Z');
  return { ...s, setup: { ...s.setup, genres } };
}

function comaAnswer(id: string, comaGenre: string | undefined): Annotation {
  return {
    ...makeAnnotation(id, { kind: 'note', verseIds: [], origin: 'coma' }),
    comaType: 'context',
    comaPrompt: SHARED_PROMPT,
    ...(comaGenre ? { comaGenre } : {}),
    text: `answer-${id}`,
  };
}

const noopProps = {
  focusAnnotationId: null,
  capturingId: null,
  translationId: 'webbe',
  onAddComaAnswer: vi.fn(),
  onEdit: vi.fn(),
  onRemove: vi.fn(),
  onStartCapture: vi.fn(),
  onEndCapture: vi.fn(),
  onMentionMeta: vi.fn(),
  onFocusHandled: vi.fn(),
};

describe('ComaPanel — genre-scoped answers (§1.3)', () => {
  it('renders a genre-tagged answer once, not under every genre with the same prompt', () => {
    const study = studyWithGenres(['gospels-acts', 'ot-narrative']);
    const annotations = [comaAnswer('a1', 'gospels-acts')];
    render(<ComaPanel {...noopProps} study={study} annotations={annotations} />);

    // Both genres offer the identical Context prompt (two rows), but the answer belongs to one.
    expect(screen.getAllByTestId('coma-answer')).toHaveLength(1);
  });

  it('still renders a legacy answer with no genre (never lost)', () => {
    const study = studyWithGenres(['gospels-acts']);
    const annotations = [comaAnswer('legacy', undefined)];
    render(<ComaPanel {...noopProps} study={study} annotations={annotations} />);

    expect(screen.getAllByTestId('coma-answer').length).toBeGreaterThanOrEqual(1);
  });
});
