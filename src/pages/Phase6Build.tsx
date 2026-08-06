import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Help } from '@/components/Help';
import { VerseAnchorPicker } from '@/components/passage/VerseAnchorPicker';
import { StudyHeader } from '@/components/StudyHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import {
  formulasForType,
  litmusForQuestionType,
  warningById,
  type Formula,
} from '@/lib/content';
import { newId } from '@/lib/id';
import { orderedSections, sectionsMatchPassage, sectionVerseIds, verseRefLabel } from '@/lib/map';
import {
  addCandidate,
  addSupportPassage,
  detectWarnings,
  discardCandidate,
  draftFromQuestion,
  emptyDraft,
  estimatedMinutes,
  hasExpectedAnswer,
  meaningBeforeObservation,
  moveQuestion,
  orderedQuestions,
  promoteCandidate,
  QUESTION_TYPES,
  questionMinutes,
  removeCandidate,
  removeSupportPassage,
  restoreCandidate,
  SUGGESTED_ALLOCATION,
  suggestedQuestionCount,
  supportBudgetWarn,
  typeCounts,
  updateCandidateText,
  updateQuestion,
  updateSupportPassage,
  deleteQuestion as deleteQuestionFromBuild,
  type QuestionDraft,
} from '@/lib/questions';
import { deriveRecycleSources } from '@/lib/recycle';
import { cn } from '@/lib/utils';
import { verseIds, type ParsedText } from '@/types/passage';
import { useStudyStore } from '@/store/study';
import type {
  AimComponent,
  Candidate,
  QuestionType,
  Section,
  Study,
  StudyBuild,
  SupportPassage,
  Weight,
} from '@/types/study';
import { StudyNotFound } from '@/pages/StudyNotFound';

// ---------------------------------------------------------------------------
// Small option tables
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<QuestionType, string> = {
  context: 'Context',
  observation: 'Observation',
  meaning: 'Meaning',
  application: 'Application',
};

const WEIGHT_OPTIONS: { value: Weight; label: string }[] = [
  { value: 'light', label: 'Light · ~1 min' },
  { value: 'medium', label: 'Medium · ~3 min' },
  { value: 'heavy', label: 'Heavy · ~6 min' },
];

const SUPPORT_TYPE_LABELS: Record<SupportPassage['type'], string> = {
  context: 'Context — earlier in the same book',
  quoted: 'Quoted or alluded — the author sent you there',
  background: 'Background — a box, never a question',
};

/** A quiet section wrapper with a numbered sub-step badge (SPEC: sequential sub-steps). */
function SubStep({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3" data-substep={step}>
      <h3 className="flex items-baseline gap-2 text-base font-semibold">
        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold text-secondary-foreground">
          {step}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6a — Weight the sections
// ---------------------------------------------------------------------------

function WeightSection({
  sections: allSections,
  studyId,
  passage,
  setSectionWeight,
}: {
  sections: Section[];
  studyId: string;
  passage: ParsedText;
  setSectionWeight: (sectionId: string, weight: Weight) => void;
}) {
  const passageVerseIds = verseIds(passage);
  const matches = sectionsMatchPassage(allSections, passageVerseIds);
  const sections = matches ? orderedSections(allSections, passageVerseIds) : [];

  return (
    <SubStep step="6a" title="Weight the sections">
      <Help helpKey="p6a.weight" />
      {!matches ? (
        <p className="text-sm text-muted-foreground">
          No sections yet — divide the passage in{' '}
          <Link to={`/study/${studyId}/3`} className="underline underline-offset-2">
            Phase 3
          </Link>{' '}
          first, and they will appear here to weight.
        </p>
      ) : (
        <ul className="space-y-2" data-testid="weight-list">
          {sections.map((s, i) => {
            const covered = sectionVerseIds(s, passageVerseIds);
            const range =
              covered.length > 0
                ? `${verseRefLabel(covered[0]!)}${covered.length > 1 ? `–${verseRefLabel(covered[covered.length - 1]!).split(' ').pop()}` : ''}`
                : '';
            return (
              <li
                key={s.id}
                data-testid="weight-row"
                data-section-id={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {s.name.trim() || `Section ${i + 1}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{range}</p>
                </div>
                <div className="flex gap-1" role="group" aria-label={`Weight for ${s.name || `section ${i + 1}`}`}>
                  {WEIGHT_OPTIONS.map((w) => {
                    const active = s.weight === w.value;
                    return (
                      <button
                        key={w.value}
                        type="button"
                        aria-pressed={active}
                        data-testid={`weight-${s.id}-${w.value}`}
                        onClick={() => setSectionWeight(s.id, w.value)}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border text-foreground hover:bg-accent',
                        )}
                      >
                        {w.value}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SubStep>
  );
}

// ---------------------------------------------------------------------------
// 6b — The question budget + running time total
// ---------------------------------------------------------------------------

function BudgetSection({ build, durationMinutes }: { build: StudyBuild; durationMinutes: number | null }) {
  const budget = suggestedQuestionCount(durationMinutes);
  const minutes = estimatedMinutes(build.questions, build.supportPassages);
  const counts = typeCounts(build.questions);
  const over = durationMinutes != null && minutes > durationMinutes;

  return (
    <SubStep step="6b" title="See the budget">
      <Help helpKey="p6b.budget" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-3" data-testid="budget-count">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Suggested questions</p>
          <p className="mt-1 text-sm">
            {budget ? (
              <>
                <span className="text-lg font-semibold text-foreground">
                  {budget.min}–{budget.max}
                </span>{' '}
                for {durationMinutes} minutes · you have{' '}
                <span className="font-semibold text-foreground">{build.questions.length}</span>
              </>
            ) : (
              <>
                Set a duration in{' '}
                <Link to="1" className="underline underline-offset-2">
                  Phase 1
                </Link>{' '}
                to see a suggested budget.
              </>
            )}
          </p>
        </div>
        <div
          className={cn(
            'rounded-lg border p-3',
            over ? 'border-warning/50 bg-warning/10' : 'border-border bg-card',
          )}
          data-testid="budget-time"
          data-over={over || undefined}
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Running time</p>
          <p className="mt-1 text-sm">
            <span className={cn('text-lg font-semibold', over ? 'text-warning' : 'text-foreground')}>
              ≈ {minutes} min
            </span>{' '}
            {durationMinutes != null && <>of {durationMinutes} · </>}
            {over ? 'over — err low' : 'in hand'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2" data-testid="allocation">
        {QUESTION_TYPES.map((t) => {
          const alloc = SUGGESTED_ALLOCATION[t];
          return (
            <span
              key={t}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
            >
              {TYPE_LABELS[t]}{' '}
              <span className="font-semibold text-foreground">{counts[t]}</span>
              <span className="text-muted-foreground">
                {' '}
                / {alloc.min}–{alloc.max}
              </span>
            </span>
          );
        })}
      </div>
    </SubStep>
  );
}

// ---------------------------------------------------------------------------
// 6c — Generate wide (recycle + formula library + free composer + brainstorm)
// ---------------------------------------------------------------------------

function FormulaLibrary({ onInsert }: { onInsert: (type: QuestionType, formula: Formula) => void }) {
  const [openType, setOpenType] = useState<QuestionType | null>(null);
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3" data-testid="formula-library">
      <p className="text-sm font-medium">Formula library</p>
      <p className="text-xs text-muted-foreground">
        A scaffolded stem to start from — you fill the blanks. Nothing is written for you.
      </p>
      <div className="space-y-2">
        {QUESTION_TYPES.map((t) => {
          const formulas = formulasForType(t);
          if (formulas.length === 0) return null;
          const open = openType === t;
          return (
            <div key={t} className="rounded-md border border-border">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenType(open ? null : t)}
                data-testid={`formula-group-${t}`}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium"
              >
                <ChevronDown
                  aria-hidden
                  className={cn('size-4 transition-transform', open && 'rotate-180')}
                />
                <span className="flex-1 capitalize">{TYPE_LABELS[t]}</span>
                <span className="text-xs text-muted-foreground">{formulas.length}</span>
              </button>
              {open && (
                <ul className="space-y-2 border-t border-border p-3">
                  {formulas.map((f) => {
                    const usable = f.stem.trim().length > 0;
                    return (
                      <li key={f.id} className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{f.name}</p>
                            {f.explanation && (
                              <p className="text-xs text-muted-foreground">{f.explanation}</p>
                            )}
                            {usable && (
                              <p className="mt-0.5 font-serif text-xs italic text-muted-foreground">
                                {f.stem}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!usable}
                            title={usable ? 'Drop this stem into the brainstorm' : 'Not yet written'}
                            onClick={() => onInsert(t, f)}
                            data-testid={`formula-insert-${f.id}`}
                          >
                            Insert
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GenerateSection({
  study,
  build,
  passage,
  recycleToPool,
  addBrainstorm,
  insertFormula,
  updateCandidate,
  deleteCandidate,
}: {
  study: Study;
  build: StudyBuild;
  passage: ParsedText;
  recycleToPool: (src: ReturnType<typeof deriveRecycleSources>[number]) => void;
  addBrainstorm: (text: string, type?: QuestionType) => void;
  insertFormula: (type: QuestionType, formula: Formula) => void;
  updateCandidate: (id: string, text: string) => void;
  deleteCandidate: (id: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const sources = deriveRecycleSources(study, passage);
  const pooledSourceKeys = new Set(
    build.candidates.filter((c) => c.source).map((c) => `${c.source!.kind}:${c.source!.id}`),
  );
  const unpooled = sources.filter((s) => !pooledSourceKeys.has(s.key));
  // Only *question* candidates are brainstormed/cut; background boxes are kept as-is for the
  // handout and never become questions (SPEC 6c — "tell them, don't ask them").
  const open = build.candidates.filter((c) => c.status === 'open' && c.kind === 'question');
  const boxes = build.candidates.filter((c) => c.kind === 'background-box' && c.status !== 'discarded');

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    addBrainstorm(t);
    setDraft('');
  };

  return (
    <SubStep step="6c" title="Generate wide">
      <Help helpKey="p6c.generate" />

      {/* Recycled material */}
      <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3" data-testid="recycle-generate">
        <p className="text-sm font-medium">Your own recycled material</p>
        <Help helpKey="p6.recycled" />
        {unpooled.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Everything you marked or anchored earlier is already in the pool.
          </p>
        ) : (
          <ul className="space-y-2">
            {unpooled.map((src) => (
              <li
                key={src.key}
                data-testid="recycle-source"
                className="flex items-start justify-between gap-3 rounded-md border border-border bg-card p-2.5"
              >
                <div className="min-w-0">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-secondary-foreground">
                    {src.candidateKind === 'question' ? (src.questionType ?? 'question') : 'background box'}
                  </span>
                  <p className="mt-1 truncate font-serif text-sm text-foreground">{src.text}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => recycleToPool(src)}
                  data-testid="recycle-add"
                >
                  Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormulaLibrary onInsert={insertFormula} />

      {/* Free composer */}
      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <Textarea
          aria-label="Brainstorm a question"
          data-testid="brainstorm-input"
          value={draft}
          placeholder="Type any question that comes to mind — don't judge it yet…"
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button size="sm" onClick={add} disabled={!draft.trim()} data-testid="brainstorm-add">
          <Plus aria-hidden /> Add to brainstorm
        </Button>
      </div>

      {/* The dumped question candidates (edit / delete freely; no judging here) */}
      {open.length > 0 && (
        <ul className="space-y-2" data-testid="brainstorm-list">
          {open.map((c) => (
            <li
              key={c.id}
              data-testid="brainstorm-item"
              className="flex items-start gap-2 rounded-md border border-border bg-card p-2.5"
            >
              <Textarea
                aria-label="Candidate text"
                value={c.text}
                onChange={(e) => updateCandidate(c.id, e.target.value)}
                className="min-h-12 flex-1"
              />
              <button
                type="button"
                aria-label="Delete this candidate"
                data-testid="brainstorm-delete"
                onClick={() => deleteCandidate(c.id)}
                className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Background boxes — kept for the handout, never asked as questions (SPEC 6c). */}
      {boxes.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3" data-testid="box-list">
          <p className="text-sm font-medium">Background boxes — for the handout</p>
          <p className="text-xs text-muted-foreground">
            Tell them, don't ask them. These print as boxes; they never become questions.
          </p>
          <ul className="space-y-2">
            {boxes.map((c) => (
              <li
                key={c.id}
                data-testid="box-item"
                className="flex items-start justify-between gap-2 rounded-md border-l-2 border-primary/40 bg-card p-2.5"
              >
                <p className="min-w-0 flex-1 font-serif text-sm text-foreground">{c.text}</p>
                <button
                  type="button"
                  aria-label="Remove this background box"
                  data-testid="box-remove"
                  onClick={() => deleteCandidate(c.id)}
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SubStep>
  );
}

// ---------------------------------------------------------------------------
// The completion editor (6e) — draft state, gated on the expected answer (hard block)
// ---------------------------------------------------------------------------

function QuestionEditor({
  initial,
  passage,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: QuestionDraft;
  passage: ParsedText;
  submitLabel: string;
  onSubmit: (draft: QuestionDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<QuestionDraft>(initial);
  const [showOptional, setShowOptional] = useState(
    Boolean(draft.gospelPlain || draft.aimComponent || draft.wrongTurns?.trim() || draft.pastoralFlag),
  );
  const patch = (p: Partial<QuestionDraft>) => setDraft((d) => ({ ...d, ...p }));

  const warnings = detectWarnings(draft.text);
  const litmus = litmusForQuestionType(draft.type);
  const answered = hasExpectedAnswer(draft);
  const canSubmit = answered && draft.text.trim().length > 0;

  return (
    <div
      data-testid="question-editor"
      className="space-y-4 rounded-lg border border-primary/40 bg-card p-4"
    >
      {/* Text + soft warnings */}
      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="editor-text">
          Question
        </label>
        <Textarea
          id="editor-text"
          data-testid="editor-text"
          value={draft.text}
          placeholder="The question, in your own words…"
          onChange={(e) => patch({ text: e.target.value })}
          className="min-h-16 font-serif"
        />
        {warnings.length > 0 && (
          <ul className="space-y-1" data-testid="editor-warnings">
            {warnings.map((id) => {
              const w = warningById(id);
              return (
                <li
                  key={id}
                  data-testid={`warning-${id}`}
                  className="rounded-md border border-warning/40 bg-warning/10 px-2.5 py-1.5 text-xs text-warning"
                >
                  {w?.message ?? id}
                </li>
              );
            })}
            <li className="text-[0.7rem] italic text-muted-foreground">
              Warnings only — keep the question as it is if you have a reason.
            </li>
          </ul>
        )}
      </div>

      {/* Anchor */}
      <div className="space-y-1">
        <span className="text-sm font-semibold">Verse anchor</span>
        <VerseAnchorPicker
          passage={passage}
          value={draft.anchor}
          onChange={(anchor) => patch({ anchor })}
          multiple
          aria-label="Anchor this question to verses"
        />
      </div>

      {/* Type + inline litmus */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-semibold" htmlFor="editor-type">
            Type
          </label>
          <Select
            id="editor-type"
            data-testid="editor-type"
            value={draft.type}
            onChange={(e) => patch({ type: e.target.value as QuestionType })}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold" htmlFor="editor-weight">
            Weight
          </label>
          <Select
            id="editor-weight"
            data-testid="editor-weight"
            value={draft.weight}
            onChange={(e) => patch({ weight: e.target.value as Weight })}
          >
            {WEIGHT_OPTIONS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {litmus && (
        <p
          data-testid="editor-litmus"
          className="rounded-md border-l-2 border-primary/40 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
        >
          <span className="font-medium text-foreground">{TYPE_LABELS[draft.type]} test: </span>
          {litmus.text}
        </p>
      )}

      {/* Expected answer — THE hard block */}
      <div className="space-y-1" data-testid="editor-expected-block" data-answered={answered || undefined}>
        <label className="text-sm font-semibold" htmlFor="editor-expected">
          Expected answer <span className="text-destructive">*</span>
        </label>
        <Help helpKey="p6e.expected" />
        <Textarea
          id="editor-expected"
          data-testid="editor-expected"
          value={draft.expectedAnswer}
          placeholder="Write the answer you expect. If you can't, the question isn't ready."
          onChange={(e) => patch({ expectedAnswer: e.target.value })}
          className={cn('min-h-16 font-serif', !answered && 'border-destructive/60')}
        />
        {!answered && (
          <p className="text-xs text-destructive" data-testid="expected-required">
            Required — a question cannot join the study without an expected answer.
          </p>
        )}
      </div>

      {/* Load-bearing */}
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={draft.loadBearing}
          onChange={(e) => patch({ loadBearing: e.target.checked })}
          data-testid="editor-loadbearing"
          className="mt-1 size-4 shrink-0 accent-primary"
        />
        <span className="space-y-0.5">
          <span className="block text-sm font-medium">Load-bearing</span>
          <Help helpKey="p6e.loadbearing" />
        </span>
      </label>

      {/* Optional pastoral & teaching detail */}
      <div>
        <button
          type="button"
          aria-expanded={showOptional}
          onClick={() => setShowOptional((v) => !v)}
          data-testid="editor-optional-toggle"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <ChevronDown aria-hidden className={cn('size-3 transition-transform', showOptional && 'rotate-180')} />
          {showOptional ? 'Fewer details' : 'More: aim, gospel, wrong turns, pastoral'}
        </button>
        {showOptional && (
          <div className="mt-3 space-y-4 border-l-2 border-border pl-3">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="editor-aim">
                Aim component it serves
              </label>
              <Select
                id="editor-aim"
                data-testid="editor-aim"
                value={draft.aimComponent ?? ''}
                onChange={(e) =>
                  patch({ aimComponent: (e.target.value || undefined) as AimComponent | undefined })
                }
              >
                <option value="">—</option>
                <option value="know">Know</option>
                <option value="feel">Feel</option>
                <option value="do">Do</option>
              </Select>
            </div>

            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={draft.gospelPlain ?? false}
                onChange={(e) => patch({ gospelPlain: e.target.checked })}
                data-testid="editor-gospel"
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span className="text-sm font-medium">Makes the gospel plain</span>
            </label>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="editor-wrongturns">
                Anticipated wrong turns
              </label>
              <Help helpKey="p6e.wrongturns" />
              <Textarea
                id="editor-wrongturns"
                data-testid="editor-wrongturns"
                value={draft.wrongTurns ?? ''}
                placeholder="Where might they go astray, and how will you bring them back?"
                onChange={(e) => patch({ wrongTurns: e.target.value })}
                className="min-h-12"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={draft.pastoralFlag ?? false}
                onChange={(e) => patch({ pastoralFlag: e.target.checked })}
                data-testid="editor-pastoral"
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">Pastoral sensitivity</span>
                <Help helpKey="p6e.pastoral" />
              </span>
            </label>
            {draft.pastoralFlag && (
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Who in your group is in the middle of this — and should you raise it privately
                instead?
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => onSubmit(draft)}
          disabled={!canSubmit}
          data-testid="editor-submit"
        >
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel} data-testid="editor-cancel">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6d — Cut (promote / discard) + 6e completion editor
// ---------------------------------------------------------------------------

type Editing = { mode: 'promote'; candidateId: string } | { mode: 'edit'; questionId: string } | null;

function CutSection({
  build,
  passage,
  editing,
  setEditing,
  onPromote,
  onDiscard,
  onRestore,
}: {
  build: StudyBuild;
  passage: ParsedText;
  editing: Editing;
  setEditing: (e: Editing) => void;
  onPromote: (candidate: Candidate, draft: QuestionDraft) => void;
  onDiscard: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const [showDiscarded, setShowDiscarded] = useState(false);
  const open = build.candidates.filter((c) => c.status === 'open' && c.kind === 'question');
  const discarded = build.candidates.filter((c) => c.status === 'discarded' && c.kind === 'question');

  return (
    <SubStep step="6d" title="Cut, then complete each keeper">
      <Help helpKey="p6d.cut" />
      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing to cut yet — generate some candidates above.
        </p>
      ) : (
        <ul className="space-y-2" data-testid="cut-list">
          {open.map((c) => {
            const isEditing = editing?.mode === 'promote' && editing.candidateId === c.id;
            return (
              <li
                key={c.id}
                data-testid="cut-item"
                data-candidate-id={c.id}
                className="space-y-3 rounded-md border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 font-serif text-sm text-foreground">{c.text}</p>
                  {!isEditing && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        onClick={() =>
                          setEditing({ mode: 'promote', candidateId: c.id })
                        }
                        data-testid={`promote-${c.id}`}
                      >
                        Complete &amp; promote →
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDiscard(c.id)}
                        data-testid={`discard-${c.id}`}
                      >
                        Discard
                      </Button>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <QuestionEditor
                    initial={{
                      ...emptyDraft(c.questionType ?? 'observation'),
                      text: c.text,
                      ...(c.anchor ? { anchor: c.anchor } : {}),
                    }}
                    passage={passage}
                    submitLabel="Promote to the study"
                    onSubmit={(draft) => onPromote(c, draft)}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {discarded.length > 0 && (
        <div>
          <button
            type="button"
            aria-expanded={showDiscarded}
            onClick={() => setShowDiscarded((v) => !v)}
            data-testid="discarded-toggle"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:underline"
          >
            <ChevronDown aria-hidden className={cn('size-3 transition-transform', showDiscarded && 'rotate-180')} />
            Discarded ({discarded.length}) — kept, not deleted
          </button>
          {showDiscarded && (
            <ul className="mt-2 space-y-2" data-testid="discarded-list">
              {discarded.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-dashed border-border bg-muted/20 p-2.5"
                >
                  <p className="min-w-0 flex-1 font-serif text-sm text-muted-foreground line-through">
                    {c.text}
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => onRestore(c.id)} data-testid={`restore-${c.id}`}>
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </SubStep>
  );
}

// ---------------------------------------------------------------------------
// 6e/6g — Your questions, in order (edit, sequence, delete)
// ---------------------------------------------------------------------------

function QuestionsSection({
  build,
  passage,
  editing,
  setEditing,
  onMove,
  onEditSave,
  onDelete,
}: {
  build: StudyBuild;
  passage: ParsedText;
  editing: Editing;
  setEditing: (e: Editing) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onEditSave: (id: string, draft: QuestionDraft) => void;
  onDelete: (id: string) => void;
}) {
  const ordered = orderedQuestions(build);
  const offenders = new Set(meaningBeforeObservation(ordered));

  return (
    <SubStep step="6e · 6g" title="Your questions, in order">
      <Help helpKey="p6g.sequence" />
      {ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No promoted questions yet. Complete a candidate above and it appears here.
        </p>
      ) : (
        <ol className="space-y-2" data-testid="questions-list">
          {ordered.map((q, i) => {
            const isEditing = editing?.mode === 'edit' && editing.questionId === q.id;
            const anchor = q.anchor.verseIds.map(verseRefLabel).join(', ');
            const offends = offenders.has(q.id);
            return (
              <li
                key={q.id}
                data-testid="question-card"
                data-question-id={q.id}
                data-type={q.type}
                className="space-y-3 rounded-md border border-border bg-card p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-serif text-sm text-foreground">{q.text}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[0.7rem]">
                      <span className="rounded-full bg-muted px-2 py-0.5 font-medium capitalize text-muted-foreground">
                        {q.type}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 font-medium capitalize text-muted-foreground">
                        {q.weight} · ~{questionMinutes(q)}m
                      </span>
                      {anchor && <span className="text-muted-foreground">{anchor}</span>}
                      {q.loadBearing && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                          load-bearing
                        </span>
                      )}
                      {q.gospelPlain && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                          gospel-plain
                        </span>
                      )}
                      <span
                        className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary"
                        title={q.expectedAnswer}
                        data-testid="has-expected"
                      >
                        answer ✓
                      </span>
                    </div>
                    {offends && (
                      <p
                        data-testid="meaning-order-warning"
                        className="rounded-md border border-warning/40 bg-warning/10 px-2.5 py-1.5 text-xs text-warning"
                      >
                        This meaning question sits before an observation on the same verses. Land
                        the looking first, then ask what it means.
                      </p>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          aria-label="Move earlier"
                          onClick={() => onMove(q.id, 'up')}
                          disabled={i === 0}
                          data-testid={`move-up-${q.id}`}
                          className="rounded border border-border p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                        >
                          <ArrowUp aria-hidden className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Move later"
                          onClick={() => onMove(q.id, 'down')}
                          disabled={i === ordered.length - 1}
                          data-testid={`move-down-${q.id}`}
                          className="rounded border border-border p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                        >
                          <ArrowDown aria-hidden className="size-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-0.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing({ mode: 'edit', questionId: q.id })}
                          data-testid={`edit-${q.id}`}
                        >
                          Edit
                        </Button>
                        <button
                          type="button"
                          aria-label="Delete question"
                          onClick={() => onDelete(q.id)}
                          data-testid={`delete-question-${q.id}`}
                          className="rounded border border-border p-1.5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 aria-hidden className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <QuestionEditor
                    initial={draftFromQuestion(q)}
                    passage={passage}
                    submitLabel="Save"
                    onSubmit={(draft) => onEditSave(q.id, draft)}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}
    </SubStep>
  );
}

// ---------------------------------------------------------------------------
// 6f — Support passages
// ---------------------------------------------------------------------------

function SupportSection({
  build,
  onAdd,
  onUpdate,
  onRemove,
}: {
  build: StudyBuild;
  onAdd: (sp: SupportPassage) => void;
  onUpdate: (id: string, patch: Partial<SupportPassage>) => void;
  onRemove: (id: string) => void;
}) {
  const [ref, setRef] = useState('');
  const [type, setType] = useState<SupportPassage['type']>('context');
  const overBudget = supportBudgetWarn(build.supportPassages);
  const questions = orderedQuestions(build);

  const add = () => {
    const r = ref.trim();
    if (!r) return;
    onAdd({ id: newId(), reference: r, type, text: null });
    setRef('');
  };

  return (
    <SubStep step="6f" title="Support passages">
      <Help helpKey="p6f.support" />

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-3">
        <div className="min-w-40 flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="support-ref">
            Reference
          </label>
          <Input
            id="support-ref"
            data-testid="support-ref"
            value={ref}
            placeholder="e.g. Malachi 4:5-6"
            onChange={(e) => setRef(e.target.value)}
          />
        </div>
        <div className="min-w-52 space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="support-type">
            Kind
          </label>
          <Select
            id="support-type"
            data-testid="support-type"
            value={type}
            onChange={(e) => setType(e.target.value as SupportPassage['type'])}
          >
            {(Object.keys(SUPPORT_TYPE_LABELS) as SupportPassage['type'][]).map((t) => (
              <option key={t} value={t}>
                {SUPPORT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
        <Button size="sm" onClick={add} disabled={!ref.trim()} data-testid="support-add">
          <Plus aria-hidden /> Add
        </Button>
      </div>

      {overBudget && (
        <p
          data-testid="support-budget-warning"
          className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
        >
          That's three or more context/quoted support passages. Each costs 3–5 minutes and pulls
          attention from your main text — keep only the ones that earn their place.
        </p>
      )}

      {build.supportPassages.length > 0 && (
        <ul className="space-y-2" data-testid="support-list">
          {build.supportPassages.map((s) => (
            <li
              key={s.id}
              data-testid="support-item"
              data-support-type={s.type}
              className="space-y-2 rounded-md border-l-2 border-primary/40 bg-muted/30 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-sm font-medium text-foreground">{s.reference}</p>
                  <p className="text-xs capitalize text-muted-foreground">{s.type}</p>
                </div>
                <button
                  type="button"
                  aria-label="Remove support passage"
                  onClick={() => onRemove(s.id)}
                  data-testid={`support-remove-${s.id}`}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </div>

              {/* Attach to a question + the return-question prompt (SPEC 6f) */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Attach to a question</label>
                <Select
                  data-testid={`support-attach-${s.id}`}
                  value={s.attachedToQuestionId ?? ''}
                  onChange={(e) =>
                    onUpdate(s.id, { attachedToQuestionId: e.target.value || undefined })
                  }
                >
                  <option value="">— not attached —</option>
                  {questions.map((q, i) => (
                    <option key={q.id} value={q.id}>
                      {i + 1}. {q.text.slice(0, 60) || '(untitled)'}
                    </option>
                  ))}
                </Select>
              </div>

              {s.attachedToQuestionId && (
                <div className="space-y-1" data-testid={`return-block-${s.id}`}>
                  <label className="text-xs font-medium text-muted-foreground" htmlFor={`return-${s.id}`}>
                    Return question — the step everyone forgets
                  </label>
                  <Help helpKey="p6f.return" />
                  <Textarea
                    id={`return-${s.id}`}
                    data-testid={`support-return-${s.id}`}
                    value={s.returnQuestion ?? ''}
                    placeholder="What does this help us see back in our passage?"
                    onChange={(e) => onUpdate(s.id, { returnQuestion: e.target.value })}
                    className="min-h-12"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </SubStep>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Phase6Build() {
  const { id = '' } = useParams();
  const { study, loading } = useOpenStudy(id);
  const applyToCurrent = useStudyStore((s) => s.applyToCurrent);
  const recycleToPool = useStudyStore((s) => s.recycleToPool);
  const [editing, setEditing] = useState<Editing>(null);

  if (!study) return <StudyNotFound loading={loading} />;

  const passage = study.passage.primary;

  // Talk mode branches here (PLAN §4.9); M1 builds only the study path.
  if (study.build.format !== 'study') {
    return (
      <div className="space-y-6">
        <StudyHeader study={study} />
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          Talk mode isn't built yet — Phase 6 for talks branches here in a later milestone.
        </div>
      </div>
    );
  }

  const build = study.build;

  const updateBuild = (fn: (b: StudyBuild) => StudyBuild) =>
    applyToCurrent((s) => (s.build.format === 'study' ? { ...s, build: fn(s.build) } : s));

  const setSectionWeight = (sectionId: string, weight: Weight) =>
    applyToCurrent((s) => ({
      ...s,
      map: {
        ...s.map,
        sections: s.map.sections.map((sec) => (sec.id === sectionId ? { ...sec, weight } : sec)),
      },
    }));

  const addBrainstorm = (text: string, questionType?: QuestionType) => {
    const candidate: Candidate = {
      id: newId(),
      kind: 'question',
      text,
      status: 'open',
      ...(questionType ? { questionType } : {}),
    };
    updateBuild((b) => addCandidate(b, candidate));
  };

  const insertFormula = (type: QuestionType, formula: Formula) =>
    addBrainstorm(formula.stem, type);

  const promote = (candidate: Candidate, draft: QuestionDraft) => {
    updateBuild((b) => promoteCandidate(b, candidate.id, draft, newId()));
    setEditing(null);
  };

  const editSave = (questionId: string, draft: QuestionDraft) => {
    updateBuild((b) => updateQuestion(b, questionId, draft));
    setEditing(null);
  };

  return (
    <div className="space-y-8">
      <StudyHeader study={study} />

      <div>
        <h2 className="text-lg font-semibold">Phase 6 — Build the questions</h2>
        <p className="text-sm text-muted-foreground">
          The longest phase, in small steps. Weight, budget, generate, cut, complete, support,
          sequence, pray.
        </p>
      </div>

      {!passage ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          No passage loaded yet.{' '}
          <Link to={`/study/${study.id}/1`} className="underline underline-offset-2">
            Set it up first
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-10">
          <WeightSection
            sections={study.map.sections}
            studyId={study.id}
            passage={passage}
            setSectionWeight={setSectionWeight}
          />

          <BudgetSection build={build} durationMinutes={study.setup.durationMinutes} />

          <GenerateSection
            study={study}
            build={build}
            passage={passage}
            recycleToPool={recycleToPool}
            addBrainstorm={addBrainstorm}
            insertFormula={insertFormula}
            updateCandidate={(cid, text) => updateBuild((b) => updateCandidateText(b, cid, text))}
            deleteCandidate={(cid) => updateBuild((b) => removeCandidate(b, cid))}
          />

          <CutSection
            build={build}
            passage={passage}
            editing={editing}
            setEditing={setEditing}
            onPromote={promote}
            onDiscard={(cid) => updateBuild((b) => discardCandidate(b, cid))}
            onRestore={(cid) => updateBuild((b) => restoreCandidate(b, cid))}
          />

          <QuestionsSection
            build={build}
            passage={passage}
            editing={editing}
            setEditing={setEditing}
            onMove={(qid, dir) => updateBuild((b) => moveQuestion(b, qid, dir))}
            onEditSave={editSave}
            onDelete={(qid) => {
              updateBuild((b) => deleteQuestionFromBuild(b, qid));
              setEditing(null);
            }}
          />

          <SupportSection
            build={build}
            onAdd={(sp) => updateBuild((b) => addSupportPassage(b, sp))}
            onUpdate={(sid, patch) => updateBuild((b) => updateSupportPassage(b, sid, patch))}
            onRemove={(sid) => updateBuild((b) => removeSupportPassage(b, sid))}
          />

          {/* 6h — Prayer point */}
          <SubStep step="6h" title="Prayer point">
            <Help helpKey="p6h.prayer" />
            <Textarea
              data-testid="prayer-point"
              value={build.prayerPoint}
              placeholder="Drawn from the passage itself — ask God for the very thing this text presses."
              onChange={(e) => updateBuild((b) => ({ ...b, prayerPoint: e.target.value }))}
              className="min-h-16 font-serif"
            />
            {build.prayerPoint.trim() === '' && (
              <p className="text-xs text-muted-foreground">
                A prayer point is expected — it's checked (softly) in Phase 7, never blocked here.
              </p>
            )}
          </SubStep>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to={`/study/${study.id}/5`}>← Back to theme &amp; aim</Link>
        </Button>
        <Button asChild>
          <Link to={`/study/${study.id}/7`}>Next: Check &amp; export →</Link>
        </Button>
      </div>
    </div>
  );
}
