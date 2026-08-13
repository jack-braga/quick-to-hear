import { useState } from 'react';

import { litmusForQuestionType } from '@/lib/content';
import { cn } from '@/lib/utils';
import type { AimComponent, Annotation, QuestionType, Study } from '@/types/study';
import { annotationMinutes, isQuestionReady, toneFor, type AnnotationTone } from '@/v2/annotations';
import { moveBefore, moveBy, QUESTION_TYPE_OPTIONS } from '@/v2/build';
import { DEFAULT_QUESTION_WRITE_LINES, exportModel, orderedOutput } from '@/v2/exportModel';
import { AttachImageRow } from '@/v2/reader/AttachImageRow';
import { AttachReferenceRow } from '@/v2/reader/AttachReferenceRow';
import { formatVerseIds } from '@/v2/reader/selection';
import { parseMentions } from '@/v2/reader/mentions';

/**
 * The Build assembly panel (V2-UX-BACKLOG §7.5). The passage steps aside (the centre is the live
 * export preview); this right panel holds only the **output cards** — questions + study notes — in
 * the running order, with **controls on each card** and a minutes-vs-session footer. Read-only text
 * (authored in Write); here you sequence + set assembly metadata. Reorder by drag or ↑/↓.
 */
type KindFilter = 'all' | 'question' | 'study-note';
const FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'question', label: 'Questions' },
  { value: 'study-note', label: 'Study notes' },
];

function Stepper({ label, value, onStep }: { label: string; value: number; onStep: (delta: number) => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-line bg-leaf px-1.5 py-0.5 font-mono text-[9.5px] text-ink-soft">
      <button type="button" aria-label={`decrease ${label}`} onClick={() => onStep(-1)} className="px-1 text-ink-faint hover:text-ink">
        −
      </button>
      {value} {label}
      <button type="button" aria-label={`increase ${label}`} onClick={() => onStep(1)} className="px-1 text-ink-faint hover:text-ink">
        +
      </button>
    </span>
  );
}

/** A plain-text preview of a study note's prose (its @-mentions shown as their reference). */
function noteSummary(text: string): string {
  return parseMentions(text)
    .map((seg) => (seg.type === 'mention' ? seg.reference : seg.value))
    .join('')
    .trim();
}

export interface BuildPanelProps {
  study: Study;
  annotations: Annotation[];
  runningOrder: string[];
  onReorder: (ids: string[]) => void;
  onEdit: (id: string, patch: Partial<Annotation>) => void;
  onRemove: (id: string) => void;
  onJump: (verseId: string, tone: AnnotationTone) => void;
}

export function BuildPanel(props: BuildPanelProps) {
  const { annotations, runningOrder } = props;
  const [filter, setFilter] = useState<KindFilter>('all');
  const [dragId, setDragId] = useState<string | null>(null);

  const ordered = orderedOutput(annotations, runningOrder);
  const orderedIds = ordered.map((a) => a.id);
  const canReorder = filter === 'all';
  const shown = filter === 'all' ? ordered : ordered.filter((a) => a.kind === filter);

  const model = exportModel(props.study);
  const session = model.sessionMinutes;

  const setMinutes = (a: Annotation, delta: number) =>
    props.onEdit(a.id, { estimateMinutes: Math.max(0, annotationMinutes(a) + delta) });
  const setWriteLines = (a: Annotation, delta: number, base: number) =>
    props.onEdit(a.id, { writeLines: Math.max(0, (a.writeLines ?? base) + delta) });

  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">Assemble</div>
      <p className="mb-3 text-[11.5px] leading-[1.5] text-ink-soft">
        Only the cards that <b className="text-ink">print</b> live here — questions &amp; study notes.
        Each carries its own controls; drag to sequence. Author text back in <b className="text-ink">Write</b>.
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border px-2.5 py-0.5 font-mono text-[10.5px]',
              filter === f.value
                ? 'border-lapis-edge bg-lapis-wash text-lapis-ink'
                : 'border-line bg-panel text-ink-soft hover:text-ink',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {!canReorder && <p className="mb-2 font-mono text-[10px] text-ink-faint">Filter = All to reorder.</p>}

      {ordered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-3.5 text-[13px] leading-[1.55] text-ink-soft">
          No output yet. In <b className="font-semibold text-ink">Write</b>, author questions and study
          notes — they appear here in verse order, ready to sequence.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {shown.map((a) => {
            const pos = orderedIds.indexOf(a.id) + 1;
            const isQuestion = a.kind === 'question';
            const tone = toneFor(a);
            return (
              <li
                key={a.id}
                draggable={canReorder}
                onDragStart={() => setDragId(a.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => canReorder && e.preventDefault()}
                onDrop={(e) => {
                  if (!canReorder) return;
                  e.preventDefault();
                  if (dragId && dragId !== a.id) props.onReorder(moveBefore(orderedIds, dragId, a.id));
                  setDragId(null);
                }}
                className={cn(
                  'rounded-lg border border-line border-l-[3px] bg-leaf p-[9px_11px]',
                  isQuestion ? 'border-l-[#b98a1e]' : 'border-l-violet',
                  dragId === a.id && 'opacity-50',
                  a.reserved && 'opacity-45',
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  {canReorder && (
                    <span className="cursor-grab select-none font-mono text-[12px] text-ink-faint" aria-hidden>
                      ⠿
                    </span>
                  )}
                  <span className="font-mono text-[8px] uppercase tracking-[0.07em] text-ink-faint">
                    {isQuestion ? `Q${pos}` : 'Study note'}
                  </span>
                  {a.verseIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => props.onJump(a.verseIds[0]!, tone)}
                      title="Jump to these verses"
                      className="rounded-[5px] bg-lapis-wash px-1.5 py-0.5 font-mono text-[9.5px] text-lapis-ink hover:underline"
                    >
                      {formatVerseIds(a.verseIds)}
                    </button>
                  )}
                  {isQuestion &&
                    (isQuestionReady(a) ? (
                      <span className="rounded bg-lapis-wash px-1.5 py-0.5 font-mono text-[8px] uppercase text-lapis-ink">ready</span>
                    ) : (
                      <span className="rounded bg-[rgba(185,138,30,0.15)] px-1.5 py-0.5 font-mono text-[8px] uppercase text-[#8a6a16]">needs answer</span>
                    ))}
                  <span className="flex-1" />
                  {canReorder && (
                    <>
                      <button type="button" aria-label="Move up" onClick={() => props.onReorder(moveBy(orderedIds, a.id, -1))} className="text-ink-faint hover:text-ink">↑</button>
                      <button type="button" aria-label="Move down" onClick={() => props.onReorder(moveBy(orderedIds, a.id, 1))} className="text-ink-faint hover:text-ink">↓</button>
                    </>
                  )}
                </div>

                <p className="font-scripture text-[12.5px] leading-snug text-ink">
                  {isQuestion
                    ? a.text.trim() || 'No question text yet — author it in Write.'
                    : noteSummary(a.text) || 'No study-note text yet — author it in Write.'}
                </p>

                {/* attached references — questions carry them here so their text stays clean */}
                {isQuestion && <AttachReferenceRow card={a} onEdit={props.onEdit} />}

                {/* attached images (question + study-note) — they print with the card (§6) */}
                <AttachImageRow card={a} onEdit={props.onEdit} />

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {isQuestion ? (
                    <>
                      <select
                        aria-label="Question type"
                        className="h-6 rounded-md border border-line bg-leaf px-1.5 font-mono text-[9.5px] text-ink outline-none"
                        value={a.questionType ?? ''}
                        onChange={(e) => props.onEdit(a.id, { questionType: (e.target.value || undefined) as QuestionType | undefined })}
                      >
                        <option value="">type…</option>
                        {QUESTION_TYPE_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <Stepper label="min" value={annotationMinutes(a)} onStep={(d) => setMinutes(a, d)} />
                      <button
                        type="button"
                        aria-pressed={a.loadBearing === true}
                        onClick={() => props.onEdit(a.id, { loadBearing: !a.loadBearing })}
                        title="A question you won't cut for time"
                        className={cn(
                          'rounded-md border px-1.5 py-0.5 font-mono text-[9.5px]',
                          a.loadBearing ? 'border-amber-edge bg-amber-wash text-[#8a6a16] dark:text-[#e2c87c]' : 'border-line text-ink-soft hover:text-ink',
                        )}
                      >
                        ★ essential
                      </button>
                      <Stepper label="lines" value={a.writeLines ?? DEFAULT_QUESTION_WRITE_LINES} onStep={(d) => setWriteLines(a, d, DEFAULT_QUESTION_WRITE_LINES)} />
                      {a.questionType === 'application' && (
                        <select
                          aria-label="Aim served"
                          className="h-6 rounded-md border border-line bg-leaf px-1.5 font-mono text-[9.5px] text-ink outline-none"
                          value={a.aimComponent ?? ''}
                          onChange={(e) => props.onEdit(a.id, { aimComponent: (e.target.value || undefined) as AimComponent | undefined })}
                        >
                          <option value="">aim…</option>
                          <option value="know">know</option>
                          <option value="feel">feel</option>
                          <option value="do">do</option>
                        </select>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      aria-pressed={a.hideFromGroup === true}
                      onClick={() => props.onEdit(a.id, { hideFromGroup: !a.hideFromGroup })}
                      title="Keep this study note in the leader's notes only"
                      className={cn(
                        'rounded-md border px-1.5 py-0.5 font-mono text-[9.5px]',
                        a.hideFromGroup ? 'border-violet-edge bg-violet-wash text-violet-ink' : 'border-line text-ink-soft hover:text-ink',
                      )}
                    >
                      {a.hideFromGroup ? '☑' : '☐'} hide from group
                    </button>
                  )}
                </div>

                {/* per-type litmus (§3): once the type is set, its authored test. */}
                {isQuestion && a.questionType && litmusForQuestionType(a.questionType) && (
                  <p className="mt-1.5 rounded border border-lapis-edge/40 bg-lapis-wash/30 px-1.5 py-1 text-[10.5px] leading-snug text-ink-soft">
                    <span className="mr-1 font-mono text-[8px] uppercase tracking-[0.06em] text-lapis-ink">✓ test</span>
                    {litmusForQuestionType(a.questionType)!.text}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    aria-pressed={!a.reserved}
                    onClick={() => props.onEdit(a.id, { reserved: !a.reserved })}
                    title={a.reserved ? 'Held back — not in the exported study. Click to include.' : 'In the study — click to hold it back.'}
                    className={cn(
                      'font-mono text-[9.5px]',
                      a.reserved ? 'text-ink-faint hover:text-ink' : 'text-moss-ink hover:underline',
                    )}
                  >
                    {a.reserved ? '☐ not in study' : '☑ in study'}
                  </button>
                  <span className="flex-1" />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {ordered.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="font-mono text-[10.5px] text-ink-soft">
            Total ≈ <b className="text-ink">{model.totalMinutes} min</b>
            {session != null && ` of ${session}`}
            {session != null && model.totalMinutes > session && (
              <span className="ml-1.5 text-rubric">· over by {model.totalMinutes - session}</span>
            )}
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-line">
            <span
              className={cn('block h-full', session != null && model.totalMinutes > session ? 'bg-rubric' : 'bg-moss')}
              style={{ width: session ? `${Math.min(100, (model.totalMinutes / session) * 100)}%` : '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
