import { useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import { allVerses, verseText, type ParsedText } from '@/types/passage';
import {
  ANNOTATION_ORIGINS,
  type Annotation,
  type AnnotationKind,
  type AnnotationOrigin,
  type MentionMeta,
  type NoteFlag,
} from '@/types/study';
import {
  ORIGIN_LABEL,
  annotationMeta,
  annotationOrigin,
  floatingAnnotations,
  isQuestionReady,
  presentOrigins,
  sortAnchored,
  toneFor,
} from '@/v2/annotations';
import { LENSES } from '@/v2/lenses';
import { MentionEditor } from '@/v2/reader/MentionEditor';
import { formatVerseIds } from '@/v2/reader/selection';
import { TONE } from '@/v2/tones';

/**
 * The right-hand card panel (v2 Layout-B increment #4). **Everything is a card**: each note /
 * question / cross-ref shows in its kind's accent with an **optional** anchor chip (a `—` when
 * unanchored), a source-step line (`▸ step NN · Name`), two-way hover, and delete. A chip row at
 * the top filters the flat list by **origin** (the step a card was made in); the hidden-chip set
 * persists in `localStorage`. There is no separate "Study notes" area — an unanchored card is just
 * a card with no anchor. **The chips are the only filter** (owner decision #7 → "just the chips"):
 * filtered-out cards simply don't render; hovering a verse ↔ its card still two-way-highlights.
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

/** The hidden-origin chip set (chips toggled off) — persisted so the filter survives a reload. */
const HIDDEN_KEY = 'qth2/panel-hidden-origins';
function loadHidden(): Set<AnnotationOrigin> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((o): o is AnnotationOrigin =>
        (ANNOTATION_ORIGINS as readonly string[]).includes(o as string),
      ),
    );
  } catch {
    return new Set();
  }
}

/** The card's source-step line — `▸ step NN · Name` when the origin maps to a numbered lens,
 *  else just `▸ Name` (the Questions lens has no number until the flow split lands). */
function sourceLine(origin: AnnotationOrigin): string {
  const lens = LENSES.find((l) => l.id === origin);
  const label = ORIGIN_LABEL[origin];
  return lens ? `▸ step ${lens.num} · ${label}` : `▸ ${label}`;
}

export interface MarginAnnotationsProps {
  passage: ParsedText;
  annotations: Annotation[];
  litVerseId: string | null;
  focusAnnotationId: string | null;
  /** Primary translation id — for the inline @-mention peek. */
  translationId: string;
  onHover: (a: Annotation | null) => void;
  onEdit: (id: string, patch: Partial<Annotation>) => void;
  onRemove: (id: string) => void;
  /** The origin of cards this lens authors — `'map'` (note/mark) or `'questions'` (question). Drives
   *  the add buttons + the empty-state copy. */
  lensOrigin: AnnotationOrigin;
  /** The card currently in anchor-capture mode (its chip is the trigger), or null. */
  capturingId: string | null;
  /** Enter capture for a card — the next passage selection sets its anchor verse(s). */
  onStartCapture: (id: string) => void;
  /** Finish capture (also on Esc / Done from the canvas banner). */
  onEndCapture: () => void;
  /** Add a study-level (unanchored) card of this lens's kind — note (+ optional confusing flag) or
   *  question. Its anchor is set later via the card. */
  onAdd: (kind: AnnotationKind, flag?: NoteFlag) => void;
  /** Recycle-forward (Questions lens only): seed a question at a prior card's anchor. When set, every
   *  non-question card shows a **→ make a question**. */
  onMakeQuestion?: (source: Annotation) => void;
  /** Set a mention's include-for-group / return-question metadata on the host note (cross-ref
   *  collapse — the reference lives inline, no standalone card). */
  onMentionMeta: (host: Annotation, osis: string, patch: Partial<MentionMeta>) => void;
  onFocusHandled: () => void;
}

export function MarginAnnotations(props: MarginAnnotationsProps) {
  const { passage, annotations, litVerseId, focusAnnotationId } = props;
  const byId = useMemo(() => new Map(allVerses(passage).map((v) => [v.verseId, v])), [passage]);

  const [hidden, setHidden] = useState<Set<AnnotationOrigin>>(loadHidden);
  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]));
    } catch {
      /* storage unavailable — the filter still applies for this session */
    }
  }, [hidden]);

  const present = useMemo(() => presentOrigins(annotations), [annotations]);
  const allOn = present.every((o) => !hidden.has(o));

  // The chips are the only filter (owner decision #7): a card shows iff its origin chip is on.
  // Filtered-out cards simply don't render.
  const ordered = useMemo(
    () => [...sortAnchored(annotations), ...floatingAnnotations(annotations)],
    [annotations],
  );
  const toRender = ordered.filter((a) => !hidden.has(annotationOrigin(a)));
  const shownCount = toRender.length;

  const toggleAll = () => setHidden(allOn ? new Set(present) : new Set());
  const toggleOrigin = (o: AnnotationOrigin) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(o)) next.delete(o);
      else next.add(o);
      return next;
    });

  // Focus a just-created card's primary field once, then clear the request.
  useEffect(() => {
    if (!focusAnnotationId) return;
    const el = document.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focusAnnotationId)}"]`);
    el?.focus();
    props.onFocusHandled();
  }, [focusAnnotationId, props, ordered.length]);

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
    const capturing = props.capturingId === a.id;
    const onAnchorClick = () => (capturing ? props.onEndCapture() : props.onStartCapture(a.id));
    return (
      <div
        key={a.id}
        onMouseEnter={() => props.onHover(a)}
        onMouseLeave={() => props.onHover(null)}
        className={cn(
          'group mb-3 rounded-lg border border-line border-l-[3px] bg-leaf p-[11px_13px] transition-all',
          TONE[tone].borderL,
          lit && TONE[tone].cardLit,
          capturing && 'shadow-[0_0_0_2px_var(--lapis-edge)]',
        )}
      >
        <div className="mb-1.5 flex items-center gap-2">
          {anchoredCard ? (
            <button
              type="button"
              onClick={onAnchorClick}
              title={capturing ? 'Selecting verses… click to finish' : 'Set the anchor — pick verses in the passage'}
              className={cn(
                'rounded-[5px] bg-lapis-wash px-1.5 py-0.5 font-mono text-[11px] text-lapis-ink hover:underline',
                capturing && 'shadow-[inset_0_0_0_1px_var(--lapis-edge)]',
              )}
            >
              {formatVerseIds(a.verseIds)}
            </button>
          ) : (
            <button
              type="button"
              onClick={onAnchorClick}
              title={capturing ? 'Selecting verses… click to finish' : 'Anchor this card — pick verses in the passage'}
              className={cn(
                'rounded-[5px] border border-dashed border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-faint hover:border-lapis-edge hover:text-lapis-ink',
                capturing && 'border-solid border-lapis-edge text-lapis-ink',
              )}
            >
              ⌖ anchor
            </button>
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
        {anchoredCard && (
          <p className="mb-1.5 line-clamp-2 font-scripture text-[12.5px] italic leading-snug text-ink-faint">
            “{contextOf(a)}”
          </p>
        )}

        {a.kind === 'note' ? (
          // Notes carry the inline @-mention editor — a reference to another passage lives *inside a
          // note's content* (never in a question, whose text is the exported deliverable). Each
          // mention's include-for-group / return-question toggles live on it (cross-ref collapse).
          <MentionEditor
            value={a.text}
            onChange={(text) => props.onEdit(a.id, { text })}
            placeholder={meta.placeholder}
            translationId={props.translationId}
            mentions={a.mentions}
            onMentionMeta={(osis, patch) => props.onMentionMeta(a, osis, patch)}
            focusId={a.id}
          />
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

        {/* source-step line + recycle-forward (Questions lens: seed a question at this anchor) */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-mono text-[9.5px] text-ink-faint">{sourceLine(annotationOrigin(a))}</span>
          {props.onMakeQuestion && a.kind !== 'question' && (
            <button
              type="button"
              onClick={() => props.onMakeQuestion!(a)}
              title="Seed a question at this anchor (you write the question)"
              className="whitespace-nowrap font-mono text-[10px] text-lapis-ink hover:underline"
            >
              → make a question
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* filter header — the chip row filters the flat card list by origin (its step) */}
      <div className="mx-1 mb-2.5 flex items-center justify-between gap-2">
        <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          Show from step
        </span>
        <span className="whitespace-nowrap font-mono text-[10px] text-ink-faint">{shownCount} shown</span>
      </div>
      <div className="mx-1 mb-3 flex justify-end gap-1.5">
        {props.lensOrigin === 'questions' ? (
          <button
            type="button"
            onClick={() => props.onAdd('question')}
            title="Add a question (anchor it to verses later)"
            className="rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-[11px] text-ink-soft hover:border-lapis-edge hover:text-ink"
          >
            ＋ question
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => props.onAdd('note')}
              title="Add a note (anchor it to verses later)"
              className="rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-[11px] text-ink-soft hover:border-lapis-edge hover:text-ink"
            >
              ＋ note
            </button>
            <button
              type="button"
              onClick={() => props.onAdd('note', 'confusing')}
              title="Add a confusion mark (anchor it to verses later)"
              className="rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-[11px] text-ink-soft hover:border-rubric hover:text-rubric"
            >
              ＋ mark
            </button>
          </>
        )}
      </div>

      {present.length > 0 && (
        <div className="mx-1 mb-2.5 flex flex-wrap gap-1.5">
          <Chip label="All" on={allOn} onClick={toggleAll} />
          {present.map((o) => (
            <Chip key={o} label={ORIGIN_LABEL[o]} on={!hidden.has(o)} onClick={() => toggleOrigin(o)} />
          ))}
        </div>
      )}

      {annotations.length === 0 ? (
        props.lensOrigin === 'questions' ? (
          <div className="mb-4 rounded-lg border border-dashed border-line p-3.5 text-[13px] leading-[1.55] text-ink-soft">
            Select verses, then <b className="font-semibold text-ink">Question</b> — or turn a prior{' '}
            <b className="font-semibold text-ink">note</b> or{' '}
            <b className="font-semibold text-ink">COMA answer</b> into a question with{' '}
            <b className="font-mono text-[12px] text-lapis-ink">→ make a question</b>. Every question
            needs an <b className="font-semibold text-ink">expected answer</b> before it’s ready.
          </div>
        ) : (
          <div className="mb-4 rounded-lg border border-dashed border-line p-3.5 text-[13px] leading-[1.55] text-ink-soft">
            Select verses, then <b className="font-semibold text-ink">Note</b> or{' '}
            <b className="font-semibold text-ink">Mark confusing</b> — or hover between two verses to
            divide the passage. Reference another passage by typing{' '}
            <b className="font-mono text-[12px] text-lapis-ink">@Malachi 4:5-6</b> inside a note.
          </div>
        )
      ) : toRender.length === 0 ? (
        <p className="mx-1 py-6 text-center text-[12.5px] text-ink-faint">
          Nothing from these steps touches the passage. Turn a chip back on above.
        </p>
      ) : (
        <>{toRender.map((a) => card(a))}</>
      )}
    </div>
  );
}

/** One origin filter chip — on = its cards show, off = hidden. */
function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
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
