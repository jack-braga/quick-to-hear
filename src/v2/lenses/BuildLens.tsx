import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { AimComponent, Annotation, QuestionType } from '@/types/study';
import { isQuestionReady } from '@/v2/annotations';
import { moveBefore, moveBy, orderedQuestions, QUESTION_TYPE_OPTIONS } from '@/v2/build';
import { formatVerseIds } from '@/v2/reader/selection';

/**
 * The Build lens (v2.6) — the promoted questions as the **running order** (the sequence that
 * exports). Two views of one set: the Map margin is spatial, this is the sequence. Reorder by
 * drag-and-drop or the ↑/↓ nudges, filter by COMA type, set each question's type + expected
 * answer inline (the SPEC 6e readiness), jump back to its verses, or drop it. Defaults to verse
 * order (observation before meaning, application last). Load-bearing logic is the pure `build.ts`.
 */
const FILTERS: { value: QuestionType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...QUESTION_TYPE_OPTIONS,
];

const SUB_INPUT =
  'w-full rounded-md border border-line bg-panel px-2 py-1 font-sans text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-lapis-edge';

export function BuildLens({
  annotations,
  runningOrder,
  onReorder,
  onEdit,
  onRemove,
  onJump,
}: {
  annotations: Annotation[];
  runningOrder: string[];
  onReorder: (ids: string[]) => void;
  onEdit: (id: string, patch: Partial<Annotation>) => void;
  onRemove: (id: string) => void;
  onJump: (verseId: string) => void;
}) {
  const [filter, setFilter] = useState<QuestionType | 'all'>('all');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const ordered = orderedQuestions(annotations, runningOrder);
  const orderedIds = ordered.map((a) => a.id);
  const canReorder = filter === 'all';
  const shown = filter === 'all' ? ordered : ordered.filter((a) => a.questionType === filter);

  return (
    <article className="mx-auto w-full max-w-[46rem] rounded-leaf border border-line bg-leaf px-[clamp(24px,5vw,52px)] py-10 shadow-leaf">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-scripture text-[26px] leading-tight text-ink">Build the study</h1>
        <span className="font-mono text-[11px] text-ink-faint">
          {ordered.length} question{ordered.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="mt-1 text-[14px] text-ink-soft">
        The running order is what exports. Drag to reorder — observation before meaning, application
        last. A question needs an expected answer before it’s ready.
      </p>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border px-3 py-1 font-sans text-[12px]',
              filter === f.value
                ? 'border-lapis bg-lapis-wash text-lapis-ink'
                : 'border-line text-ink-soft hover:border-lapis-edge',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {!canReorder && (
        <p className="mt-2 font-mono text-[11px] text-ink-faint">Clear the filter (All) to reorder.</p>
      )}

      <ol className="mt-4 space-y-2">
        {shown.map((a) => {
          const pos = orderedIds.indexOf(a.id) + 1;
          const ready = isQuestionReady(a);
          return (
            <li
              key={a.id}
              draggable={canReorder}
              onDragStart={() => setDragId(a.id)}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(e) => {
                if (!canReorder) return;
                e.preventDefault();
                if (overId !== a.id) setOverId(a.id);
              }}
              onDrop={(e) => {
                if (!canReorder) return;
                e.preventDefault();
                if (dragId && dragId !== a.id) onReorder(moveBefore(orderedIds, dragId, a.id));
                setDragId(null);
                setOverId(null);
              }}
              className={cn(
                'rounded-lg border border-line bg-panel/40 p-3',
                dragId === a.id && 'opacity-50',
                overId === a.id && dragId && dragId !== a.id && 'ring-2 ring-lapis',
              )}
            >
              <div className="flex items-start gap-2.5">
                {canReorder && (
                  <span className="mt-1 cursor-grab select-none font-mono text-[13px] text-ink-faint" title="Drag to reorder" aria-hidden>
                    ⠿
                  </span>
                )}
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lapis font-mono text-[11px] text-white dark:text-[#10131a]">
                  {pos}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <textarea
                    rows={2}
                    className="w-full resize-none border-none bg-transparent p-0 font-sans text-[14px] leading-snug text-ink outline-none placeholder:text-ink-faint"
                    value={a.text}
                    placeholder="Draft the question…"
                    onChange={(e) => onEdit(a.id, { text: e.target.value })}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Question type"
                      className="h-7 rounded-md border border-line bg-leaf px-2 font-sans text-[12px] text-ink outline-none focus:border-lapis-edge"
                      value={a.questionType ?? ''}
                      onChange={(e) => onEdit(a.id, { questionType: (e.target.value || undefined) as QuestionType | undefined })}
                    >
                      <option value="">Type…</option>
                      {QUESTION_TYPE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {a.verseIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onJump(a.verseIds[0]!)}
                        title="Jump to these verses"
                        className="rounded-[5px] bg-lapis-wash px-1.5 py-0.5 font-mono text-[11px] text-lapis-ink hover:underline"
                      >
                        {formatVerseIds(a.verseIds)}
                      </button>
                    )}
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]',
                        ready
                          ? 'bg-lapis-wash text-lapis-ink'
                          : 'bg-[rgba(185,138,30,0.15)] text-[#8a6a16]',
                      )}
                    >
                      {ready ? 'ready' : 'needs answer'}
                    </span>
                    <span className="flex-1" />
                    {canReorder && (
                      <>
                        <button
                          type="button"
                          onClick={() => onReorder(moveBy(orderedIds, a.id, -1))}
                          aria-label="Move up"
                          className="grid size-6 place-items-center rounded text-ink-faint hover:text-ink"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => onReorder(moveBy(orderedIds, a.id, 1))}
                          aria-label="Move down"
                          className="grid size-6 place-items-center rounded text-ink-faint hover:text-ink"
                        >
                          ↓
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(a.id)}
                      aria-label="Remove this question"
                      className="grid size-6 place-items-center rounded text-ink-faint hover:text-rubric"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    className={SUB_INPUT}
                    value={a.expectedAnswer ?? ''}
                    placeholder="Expected answer (what the text gives)…"
                    onChange={(e) => onEdit(a.id, { expectedAnswer: e.target.value })}
                  />
                  {/* leader/audit metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <button
                      type="button"
                      aria-pressed={a.loadBearing === true}
                      onClick={() => onEdit(a.id, { loadBearing: !a.loadBearing })}
                      title="A question you won't cut for time (the audit wants at least two)"
                      className={cn(
                        'rounded-full border px-2 py-0.5',
                        a.loadBearing
                          ? 'border-lapis bg-lapis-wash text-lapis-ink'
                          : 'border-line text-ink-soft hover:border-lapis-edge',
                      )}
                    >
                      ★ Load-bearing
                    </button>
                    <select
                      aria-label="Aim served"
                      className="h-7 rounded-md border border-line bg-leaf px-2 font-sans text-[12px] text-ink outline-none focus:border-lapis-edge"
                      value={a.aimComponent ?? ''}
                      onChange={(e) => onEdit(a.id, { aimComponent: (e.target.value || undefined) as AimComponent | undefined })}
                    >
                      <option value="">Aim: know/feel/do…</option>
                      <option value="know">Know</option>
                      <option value="feel">Feel</option>
                      <option value="do">Do</option>
                    </select>
                    <button
                      type="button"
                      aria-pressed={a.gospelPlain === true}
                      onClick={() => onEdit(a.id, { gospelPlain: !a.gospelPlain })}
                      title="This question makes the gospel plain"
                      className={cn(
                        'rounded-full border px-2 py-0.5',
                        a.gospelPlain
                          ? 'border-lapis bg-lapis-wash text-lapis-ink'
                          : 'border-line text-ink-soft hover:border-lapis-edge',
                      )}
                    >
                      ✝ Gospel-plain
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {shown.length === 0 && (
        <p className="mt-4 rounded-lg border border-dashed border-line p-4 text-[14px] text-ink-soft">
          {ordered.length === 0
            ? 'No questions yet. In the Map lens, select verses and add a Question — they’ll appear here in verse order.'
            : 'No questions of that type. Clear the filter to see them all.'}
        </p>
      )}
    </article>
  );
}
