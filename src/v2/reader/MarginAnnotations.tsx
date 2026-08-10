import { useEffect, useMemo } from 'react';

import { parseReference } from '@/lib/verse';
import { cn } from '@/lib/utils';
import { allVerses, verseText, type ParsedText } from '@/types/passage';
import type { Annotation } from '@/types/study';
import { annotationMeta, anchoredAnnotations, floatingAnnotations, isQuestionReady, sortAnchored, toneFor } from '@/v2/annotations';
import { formatVerseIds } from '@/v2/reader/selection';
import { TONE } from '@/v2/tones';

/**
 * The right-margin annotation surface (v2.4). Anchored cards (Note / Question / Cross-reference)
 * sit in verse order, each in its kind's accent, editable in place, with a jump-to-verse anchor,
 * two-way hover, and delete. A Question keeps the **expected-answer** field + a promotable
 * indicator (the SPEC 6e hard block; promotion itself lands with the Build lens). Below, a
 * **Study notes** area holds floating (unanchored) notes — theme, aim, prayer, notes-to-self.
 */
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

const NOTE_INPUT =
  'w-full resize-none border-none bg-transparent p-0 font-sans text-[13.5px] leading-[1.5] text-ink outline-none placeholder:text-ink-faint';
const SUB_INPUT =
  'w-full rounded-md border border-line bg-panel px-2 py-1 font-sans text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-lapis-edge';

export interface MarginAnnotationsProps {
  passage: ParsedText;
  annotations: Annotation[];
  litVerseId: string | null;
  focusAnnotationId: string | null;
  onHover: (a: Annotation | null) => void;
  onEdit: (id: string, patch: Partial<Annotation>) => void;
  onRemove: (id: string) => void;
  onJump: (verseId: string) => void;
  onAddFloating: () => void;
  onFocusHandled: () => void;
}

export function MarginAnnotations(props: MarginAnnotationsProps) {
  const { passage, annotations, litVerseId, focusAnnotationId } = props;
  const byId = useMemo(() => new Map(allVerses(passage).map((v) => [v.verseId, v])), [passage]);
  const anchored = useMemo(() => sortAnchored(annotations), [annotations]);
  const floating = useMemo(() => floatingAnnotations(annotations), [annotations]);
  const anchoredCount = anchoredAnnotations(annotations).length;

  // Focus a just-created card's primary field once, then clear the request.
  useEffect(() => {
    if (!focusAnnotationId) return;
    const el = document.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focusAnnotationId)}"]`);
    el?.focus();
    props.onFocusHandled();
  }, [focusAnnotationId, props, anchored.length, floating.length]);

  const contextOf = (a: Annotation): string =>
    a.verseIds
      .map((id) => byId.get(id))
      .filter((v): v is NonNullable<typeof v> => !!v && v.present)
      .map((v) => verseText(v))
      .join(' ');

  const card = (a: Annotation) => {
    const tone = toneFor(a);
    const meta = annotationMeta(a);
    const lit = litVerseId != null && a.verseIds.includes(litVerseId);
    const anchoredCard = a.verseIds.length > 0;
    return (
      <div
        key={a.id}
        onMouseEnter={() => props.onHover(a)}
        onMouseLeave={() => props.onHover(null)}
        className={cn(
          'group mb-3 rounded-lg border border-line border-l-[3px] bg-leaf p-[11px_13px] transition-all',
          TONE[tone].borderL,
          lit && TONE[tone].cardLit,
        )}
      >
        <div className="mb-1.5 flex items-center gap-2">
          {anchoredCard ? (
            <button
              type="button"
              onClick={() => props.onJump(a.verseIds[0]!)}
              title="Jump to these verses"
              className="rounded-[5px] bg-lapis-wash px-1.5 py-0.5 font-mono text-[11px] text-lapis-ink hover:underline"
            >
              {formatVerseIds(a.verseIds)}
            </button>
          ) : (
            <span className="font-mono text-[11px] text-ink-faint">Study note</span>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
            {meta.tag}
          </span>
          <span className="flex-1" />
          {a.kind === 'question' &&
            (isQuestionReady(a) ? (
              <span className="rounded bg-lapis-wash px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-lapis-ink">
                ready
              </span>
            ) : (
              <span
                title="A question needs an expected answer before it can be promoted (SPEC 6e)"
                className="rounded bg-[rgba(185,138,30,0.15)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a6a16]"
              >
                needs answer
              </span>
            ))}
          <button
            type="button"
            onClick={() => props.onRemove(a.id)}
            aria-label="Remove this annotation"
            className="text-ink-faint opacity-0 transition-opacity hover:text-rubric focus-visible:opacity-100 group-hover:opacity-100"
          >
            ✕
          </button>
        </div>

        {/* context quote for anchored notes/questions */}
        {anchoredCard && a.kind !== 'cross-ref' && (
          <p className="mb-1.5 line-clamp-2 font-scripture text-[12.5px] italic leading-snug text-ink-faint">
            “{contextOf(a)}”
          </p>
        )}

        {/* cross-reference: the other passage + return question */}
        {a.kind === 'cross-ref' ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] text-lapis">→</span>
              <input
                data-focus={a.id}
                className={SUB_INPUT}
                value={a.reference ?? ''}
                placeholder="e.g. Malachi 4:5-6"
                onChange={(e) => props.onEdit(a.id, { reference: e.target.value })}
              />
              {(a.reference ?? '').trim() &&
                (parseReference(a.reference ?? '') ? (
                  <span className="font-mono text-[11px] text-lapis" title="Recognised reference">✓</span>
                ) : (
                  <span className="font-mono text-[11px] text-ink-faint" title="Not recognised yet">…</span>
                ))}
            </div>
            <textarea
              ref={autoGrow}
              rows={2}
              className={NOTE_INPUT}
              value={a.text}
              placeholder={meta.placeholder}
              onChange={(e) => {
                props.onEdit(a.id, { text: e.target.value });
                autoGrow(e.currentTarget);
              }}
            />
            <input
              className={SUB_INPUT}
              value={a.returnQuestion ?? ''}
              placeholder="Bring them back: “What does this help us see here?”"
              onChange={(e) => props.onEdit(a.id, { returnQuestion: e.target.value })}
            />
          </div>
        ) : (
          <textarea
            data-focus={a.id}
            ref={autoGrow}
            rows={2}
            className={NOTE_INPUT}
            value={a.text}
            placeholder={meta.placeholder}
            onChange={(e) => {
              props.onEdit(a.id, { text: e.target.value });
              autoGrow(e.currentTarget);
            }}
          />
        )}

        {/* question: the expected answer (the one enforced discipline) */}
        {a.kind === 'question' && (
          <input
            className={cn(SUB_INPUT, 'mt-2')}
            value={a.expectedAnswer ?? ''}
            placeholder="Expected answer (what the text gives)…"
            onChange={(e) => props.onEdit(a.id, { expectedAnswer: e.target.value })}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mx-1 mb-3.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        <span>In the margin</span>
        <span>{anchoredCount}</span>
      </div>

      {anchored.map(card)}

      {anchored.length === 0 && (
        <div className="mb-4 rounded-lg border border-dashed border-line p-3.5 text-[13px] leading-[1.55] text-ink-soft">
          Select verses, then <b className="font-semibold text-ink">Note</b>,{' '}
          <b className="font-semibold text-ink">Question</b>,{' '}
          <b className="font-semibold text-ink">Mark confusing</b>, or{' '}
          <b className="font-semibold text-ink">Cross-reference</b> — or hover between two verses to
          divide the passage.
        </div>
      )}

      {/* floating / study-level notes */}
      <div className="mt-6 border-t border-line pt-4">
        <div className="mx-1 mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">Study notes</span>
          <button
            type="button"
            onClick={props.onAddFloating}
            title="Add a study-level note (theme, aim, prayer, notes-to-self)"
            className="rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-[11px] text-ink-soft hover:border-lapis-edge hover:text-ink"
          >
            ＋
          </button>
        </div>
        {floating.map(card)}
        {floating.length === 0 && (
          <p className="mx-1 text-[12px] text-ink-faint">Theme, aim, prayer, notes-to-self.</p>
        )}
      </div>
    </div>
  );
}
