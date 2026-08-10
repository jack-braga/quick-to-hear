import { useEffect, useMemo, useState } from 'react';

import { comaContent, comaSetsForGenres } from '@/lib/content';
import { cn } from '@/lib/utils';
import type { Annotation, QuestionType, Study } from '@/types/study';
import { formatVerseIds } from '@/v2/reader/selection';
import { Help } from '@/v2/Help';

/**
 * The COMA lens margin (SPEC Phase 4, rebuilt in #4b) — the genre's **Context · Observation ·
 * Meaning · Application** prompts (David Helm's questions, verbatim by permission) as quiet rows;
 * each has **✎ Answer**, which spawns an **answer-card** (its answer field + a click-chip anchor).
 * A prompt keeps **✎ answer again**, so it can hold several answers. Multi-genre: prompts group by
 * heading, tagged by text-type, with a chip filter to focus one. The tool never writes the answer
 * (rule 1); the Helm attribution renders at the foot (rule 8). Answer-cards are `origin:'coma'`
 * annotations, so they show in the Map/Questions panels and recycle-forward into questions.
 */
const HEADINGS: { key: QuestionType; label: string }[] = [
  { key: 'context', label: 'Context' },
  { key: 'observation', label: 'Observation' },
  { key: 'meaning', label: 'Meaning' },
  { key: 'application', label: 'Application' },
];

/** Compact text-type labels for the chips + per-prompt tags (the full genre names are too long for
 *  the narrow panel). Falls back to the full label for any unmapped genre id. */
const SHORT_GENRE: Record<string, string> = {
  'gospels-acts': 'Gospels',
  'ot-narrative': 'OT narrative',
  epistles: 'Epistles',
  'wisdom-poetry': 'Poetry',
  prophetic: 'Prophetic',
  apocalyptic: 'Apocalyptic',
};

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export interface ComaPanelProps {
  study: Study;
  annotations: Annotation[];
  focusAnnotationId: string | null;
  /** The answer-card currently in anchor-capture (its ⌖ chip is the trigger), or null. */
  capturingId: string | null;
  onAddComaAnswer: (comaType: QuestionType, prompt: string) => void;
  onEdit: (id: string, patch: Partial<Annotation>) => void;
  onRemove: (id: string) => void;
  onStartCapture: (id: string) => void;
  onEndCapture: () => void;
  onFocusHandled: () => void;
}

export function ComaPanel(props: ComaPanelProps) {
  const { study, annotations, focusAnnotationId } = props;
  const genreSets = useMemo(() => comaSetsForGenres(study.setup.genres), [study.setup.genres]);
  // Which text-types to show; empty = all (chips only appear when 2+ genres are set up).
  const [activeGenres, setActiveGenres] = useState<Set<string>>(new Set());

  // Focus a just-spawned answer-card's field once (write-first), then clear the request.
  useEffect(() => {
    if (!focusAnnotationId) return;
    const el = document.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focusAnnotationId)}"]`);
    el?.focus();
    props.onFocusHandled();
  }, [focusAnnotationId, props]);

  let attribution = '';
  try {
    attribution = comaContent().attribution;
  } catch {
    /* method file unreadable — omit the line rather than block the lens */
  }

  const answersFor = (comaType: QuestionType, prompt: string): Annotation[] =>
    annotations.filter((a) => a.kind === 'note' && a.comaType === comaType && a.comaPrompt === prompt);

  const multi = genreSets.length > 1;
  const shown = genreSets.filter((g) => activeGenres.size === 0 || activeGenres.has(g.genre));
  const toggleGenre = (genre: string) =>
    setActiveGenres((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });

  const answerCard = (a: Annotation) => {
    const capturing = props.capturingId === a.id;
    const anchored = a.verseIds.length > 0;
    const onAnchorClick = () => (capturing ? props.onEndCapture() : props.onStartCapture(a.id));
    return (
      <div
        key={a.id}
        className={cn(
          'group mt-1.5 rounded-lg border border-line border-l-[3px] border-l-lapis bg-leaf p-2.5 transition-shadow',
          capturing && 'shadow-[0_0_0_2px_var(--lapis-edge)]',
        )}
      >
        <textarea
          data-focus={a.id}
          ref={autoGrow}
          rows={2}
          className="w-full resize-none border-none bg-transparent p-0 font-sans text-[13px] leading-[1.5] text-ink outline-none placeholder:text-ink-faint"
          value={a.text}
          placeholder="Write what the text gives…"
          onChange={(e) => {
            props.onEdit(a.id, { text: e.target.value });
            autoGrow(e.currentTarget);
          }}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onAnchorClick}
            title={
              capturing
                ? 'Selecting verses… click to finish'
                : anchored
                  ? 'Set the anchor — pick verses in the passage'
                  : 'Anchor this answer — pick verses in the passage'
            }
            className={cn(
              'rounded-[5px] px-1.5 py-0.5 font-mono text-[11px]',
              anchored
                ? 'bg-lapis-wash text-lapis-ink hover:underline'
                : 'border border-dashed border-line text-ink-faint hover:border-lapis-edge hover:text-lapis-ink',
              capturing && 'shadow-[inset_0_0_0_1px_var(--lapis-edge)]',
            )}
          >
            {anchored ? formatVerseIds(a.verseIds) : '⌖ anchor'}
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => props.onRemove(a.id)}
            aria-label="Remove this answer"
            className="text-ink-faint opacity-0 transition-opacity hover:text-rubric focus-visible:opacity-100 group-hover:opacity-100"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  const promptRow = (comaType: QuestionType, prompt: string, genreLabel: string, key: string) => {
    const answers = answersFor(comaType, prompt);
    return (
      <div key={key} className="mb-1">
        <div className="flex items-start gap-2 rounded-md px-2 py-1.5 text-[12.5px] leading-[1.45] text-ink-soft hover:bg-panel/50">
          {multi && (
            <span className="mt-0.5 shrink-0 rounded bg-panel px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-faint">
              {genreLabel}
            </span>
          )}
          <span className="flex-1">{prompt}</span>
          <button
            type="button"
            onClick={() => props.onAddComaAnswer(comaType, prompt)}
            title="Write an answer to this prompt (it becomes a card you can anchor)"
            className="shrink-0 whitespace-nowrap rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-[10.5px] text-ink-soft hover:border-lapis-edge hover:text-ink"
          >
            ✎ {answers.length ? 'answer again' : 'Answer'}
          </button>
        </div>
        {answers.map(answerCard)}
      </div>
    );
  };

  return (
    <div>
      <div className="mx-1 mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        COMA — work the text
        <Help helpKey="p4.overview" label="COMA" />
      </div>

      {study.setup.genres.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-3.5 text-[13px] leading-[1.55] text-ink-soft">
          Set the passage’s <b className="font-semibold text-ink">text-type(s)</b> in Set up to see its
          COMA prompts.
        </p>
      ) : genreSets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-3.5 text-[13px] leading-[1.55] text-ink-soft">
          No prompts for these text-types yet.
        </p>
      ) : (
        <>
          <p className="mb-3 text-[13px] leading-[1.5] text-ink-soft">
            Read the passage against these. <b className="font-semibold text-ink">✎ Answer</b> a prompt
            to jot a card — anchor it to verses, and it carries forward into Questions.
          </p>

          {multi && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              <GenreChip label="All" on={activeGenres.size === 0} onClick={() => setActiveGenres(new Set())} />
              {genreSets.map((g) => (
                <GenreChip
                  key={g.genre}
                  label={SHORT_GENRE[g.genre] ?? g.label}
                  on={activeGenres.has(g.genre)}
                  onClick={() => toggleGenre(g.genre)}
                />
              ))}
            </div>
          )}

          <div className="space-y-3.5">
            {HEADINGS.map((h) => {
              const rows = shown.flatMap((g) => g.set[h.key].map((prompt) => ({ genre: g, prompt })));
              if (rows.length === 0) return null;
              return (
                <div key={h.key}>
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-lapis-ink">
                    {h.label}
                  </div>
                  {rows.map(({ genre, prompt }, i) =>
                    promptRow(h.key, prompt, SHORT_GENRE[genre.genre] ?? genre.label, `${genre.genre}-${i}`),
                  )}
                </div>
              );
            })}
          </div>

          {attribution && (
            <p className="mt-5 border-t border-line pt-3 text-[11px] italic leading-[1.5] text-ink-faint">
              {attribution}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** One text-type filter chip — on = its prompts show (empty selection = all show). */
function GenreChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'rounded-full border px-2.5 py-0.5 font-mono text-[10.5px]',
        on
          ? 'border-lapis-edge bg-lapis-wash text-lapis-ink'
          : 'border-line bg-panel text-ink-soft hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}
