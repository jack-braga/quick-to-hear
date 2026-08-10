import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Help } from '@/components/Help';
import { VerseAnchorPicker } from '@/components/passage/VerseAnchorPicker';
import { StudyHeader } from '@/components/StudyHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import {
  comaContent,
  comaSetForGenre,
  readingTipForGenre,
  type ComaGenreSet,
} from '@/lib/content';
import { newId } from '@/lib/id';
import { verseRefLabel } from '@/lib/map';
import {
  candidateForSource,
  deriveRecycleSources,
  isSourceChanged,
  type RecycleSource,
} from '@/lib/recycle';
import type { ParsedText } from '@/types/passage';
import { primaryText } from '@/lib/passage';
import { useStudyStore } from '@/store/study';
import type { Candidate, Note, QuestionType, Study, VerseAnchor } from '@/types/study';
import { StudyNotFound } from '@/pages/StudyNotFound';

/** The four COMA categories, in Helm's order. The label is the framework name; the
 *  per-category *guidance* is authored teaching prose (help key), shown via the
 *  placeholder until written — we never author it here. */
const CATEGORIES: { key: QuestionType; label: string; helpKey: string }[] = [
  { key: 'context', label: 'Context', helpKey: 'p4.context' },
  { key: 'observation', label: 'Observation', helpKey: 'p4.observation' },
  { key: 'meaning', label: 'Meaning', helpKey: 'p4.meaning' },
  { key: 'application', label: 'Application', helpKey: 'p4.application' },
];

function anchorLabel(anchor: VerseAnchor | undefined): string {
  if (!anchor || anchor.verseIds.length === 0) return '';
  return anchor.verseIds.map(verseRefLabel).join(', ');
}

// ---------------------------------------------------------------------------
// A single note (editable text + optional verse anchor + delete)
// ---------------------------------------------------------------------------

function NoteRow({
  passage,
  note,
  onUpdate,
  onRemove,
}: {
  passage: ParsedText;
  note: Note;
  onUpdate: (patch: Partial<Note>) => void;
  onRemove: () => void;
}) {
  const anchored = (note.anchor?.verseIds.length ?? 0) > 0;
  return (
    <li
      data-testid="note-item"
      data-note-id={note.id}
      data-anchored={anchored || undefined}
      className="space-y-2 rounded-md border border-border bg-card p-3"
    >
      <div className="flex items-start gap-2">
        <Textarea
          aria-label="Note text"
          value={note.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="min-h-16 flex-1"
        />
        <button
          type="button"
          aria-label="Delete this note"
          data-testid="delete-note"
          onClick={onRemove}
          className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Anchor to verse(s)</span>
          {anchored && (
            <span
              data-testid="note-recycle-hint"
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[0.7rem] font-medium text-secondary-foreground"
            >
              <ArrowRight aria-hidden className="size-3" />
              candidate question
            </span>
          )}
        </div>
        <VerseAnchorPicker
          passage={passage}
          value={note.anchor ?? { verseIds: [] }}
          onChange={(anchor) => onUpdate({ anchor })}
          multiple
          aria-label="Anchor this note to verses"
        />
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// One COMA category: verbatim prompts + a composer + the notes
// ---------------------------------------------------------------------------

function ComaCategory({
  category,
  label,
  helpKey,
  prompts,
  passage,
  notes,
  onAdd,
  onUpdate,
  onRemove,
}: {
  category: QuestionType;
  label: string;
  helpKey: string;
  prompts: string[];
  passage: ParsedText;
  notes: Note[];
  onAdd: (note: Note) => void;
  onUpdate: (noteId: string, patch: Partial<Note>) => void;
  onRemove: (noteId: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [draftAnchor, setDraftAnchor] = useState<VerseAnchor>({ verseIds: [] });

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd({ id: newId(), text, anchor: draftAnchor });
    setDraft('');
    setDraftAnchor({ verseIds: [] });
  };

  return (
    <section data-testid={`coma-${category}`} className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{label}</h3>
        <Help helpKey={helpKey} />
      </div>

      {prompts.length > 0 && (
        <ul
          data-testid={`coma-prompts-${category}`}
          className="space-y-1 rounded-md border border-border bg-muted/30 p-3"
        >
          {prompts.map((p, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden className="select-none">
                •
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Composer */}
      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <Textarea
          aria-label={`New ${label.toLowerCase()} note`}
          data-testid={`note-input-${category}`}
          value={draft}
          placeholder={`Note something under ${label.toLowerCase()}…`}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">
            Anchor to verse(s){' '}
            <span className="italic">— anchored notes become candidate questions in Phase 6</span>
          </span>
          <VerseAnchorPicker
            passage={passage}
            value={draftAnchor}
            onChange={setDraftAnchor}
            multiple
            aria-label={`Anchor the new ${label.toLowerCase()} note`}
          />
        </div>
        <Button
          size="sm"
          onClick={add}
          disabled={!draft.trim()}
          data-testid={`add-note-${category}`}
        >
          Add note
        </Button>
      </div>

      {notes.length > 0 && (
        <ul className="space-y-2" data-testid={`note-list-${category}`}>
          {notes.map((n) => (
            <NoteRow
              key={n.id}
              passage={passage}
              note={n}
              onUpdate={(patch) => onUpdate(n.id, patch)}
              onRemove={() => onRemove(n.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Recycle-forward preview → the Phase-6 candidate pool
// ---------------------------------------------------------------------------

function RecycleRow({
  src,
  candidate,
  onKeep,
}: {
  src: RecycleSource;
  candidate: Candidate | undefined;
  onKeep: () => void;
}) {
  const pooled = candidate != null;
  const changed = pooled && isSourceChanged(candidate, src.text);
  const badge =
    src.candidateKind === 'question' ? (src.questionType ?? 'question') : 'background box';

  return (
    <li
      data-testid="recycle-item"
      data-source-kind={src.source.kind}
      data-candidate-kind={src.candidateKind}
      data-pooled={pooled || undefined}
      data-source-changed={changed || undefined}
      className="flex items-start justify-between gap-3 rounded-md border border-border bg-card p-3"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-secondary-foreground">
            {badge}
          </span>
          {anchorLabel(src.anchor) && (
            <span className="text-xs text-muted-foreground">{anchorLabel(src.anchor)}</span>
          )}
          {changed && (
            <span
              data-testid="source-changed"
              className="rounded-full border border-warning/50 bg-warning/10 px-2 py-0.5 text-[0.7rem] font-medium text-warning"
            >
              source changed
            </span>
          )}
        </div>
        <p className="truncate font-serif text-sm text-foreground">
          {pooled ? candidate.text : src.text}
        </p>
      </div>
      {pooled ? (
        <span className="shrink-0 text-xs text-muted-foreground" data-testid="pooled-badge">
          In Phase 6 pool ✓
        </span>
      ) : (
        <Button size="sm" variant="outline" onClick={onKeep} data-testid="recycle-keep">
          Keep for Phase 6
        </Button>
      )}
    </li>
  );
}

function RecyclePanel({ study, passage }: { study: Study; passage: ParsedText | null }) {
  const recycleToPool = useStudyStore((s) => s.recycleToPool);
  const sources = deriveRecycleSources(study, passage);
  const candidates = study.build.format === 'study' ? study.build.candidates : [];
  const boxes = sources.filter((s) => s.candidateKind === 'background-box');
  const questions = sources.filter((s) => s.candidateKind === 'question');

  return (
    <section
      data-testid="recycle-panel"
      className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
    >
      <div>
        <h3 className="text-sm font-semibold">Recycling forward → Phase 6</h3>
        <p className="text-xs text-muted-foreground">
          Your own earlier work, ready to reuse when you build the questions. Nothing here is
          generated — it is only carried forward.
        </p>
      </div>

      {sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Mark confusing words in{' '}
          <Link to={`/study/${study.id}/3`} className="underline underline-offset-2">
            Phase 3
          </Link>
          , or anchor a note above, and it will surface here.
        </p>
      ) : (
        <div className="space-y-4">
          {boxes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Background boxes — from your Phase 3 question marks
              </p>
              <ul className="space-y-2">
                {boxes.map((src) => (
                  <RecycleRow
                    key={src.key}
                    src={src}
                    candidate={candidateForSource(candidates, src.source)}
                    onKeep={() => recycleToPool(src)}
                  />
                ))}
              </ul>
            </div>
          )}
          {questions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Candidate questions — from your anchored notes
              </p>
              <ul className="space-y-2">
                {questions.map((src) => (
                  <RecycleRow
                    key={src.key}
                    src={src}
                    candidate={candidateForSource(candidates, src.source)}
                    onKeep={() => recycleToPool(src)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Phase4Coma() {
  const { id = '' } = useParams();
  const { study, loading } = useOpenStudy(id);
  const applyToCurrent = useStudyStore((s) => s.applyToCurrent);

  if (!study) return <StudyNotFound loading={loading} />;

  const passage = primaryText(study.passage);
  const genre = study.setup.genres[0] ?? null;
  const comaSet: ComaGenreSet | null = comaSetForGenre(genre);
  const readingTip = readingTipForGenre(genre);
  const coma = comaContent();
  // Show the authored placeholder (a safety notice, not Helm's real prompts) until the
  // verbatim sets are transcribed and `state` flips to `cited`.
  const showPlaceholder = coma.state !== 'cited' && Boolean(coma.placeholder);

  const addNote = (category: QuestionType, note: Note) =>
    applyToCurrent((s) => ({
      ...s,
      coma: { ...s.coma, [category]: [...s.coma[category], note] },
    }));

  const updateNote = (category: QuestionType, noteId: string, patch: Partial<Note>) =>
    applyToCurrent((s) => ({
      ...s,
      coma: {
        ...s.coma,
        [category]: s.coma[category].map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
      },
    }));

  const removeNote = (category: QuestionType, noteId: string) =>
    applyToCurrent((s) => ({
      ...s,
      coma: { ...s.coma, [category]: s.coma[category].filter((n) => n.id !== noteId) },
    }));

  return (
    <div className="space-y-8">
      <StudyHeader study={study} />

      <div>
        <h2 className="text-lg font-semibold">Phase 4 — COMA</h2>
        <p className="text-sm text-muted-foreground">
          Four kinds of preparation note: Context, Observation, Meaning, Application.
        </p>
      </div>

      {/* Attribution — stored in the data so it can't drift; must render wherever COMA
          content appears (Inviolable rule 8). */}
      <p
        data-testid="coma-attribution"
        className="rounded-md border-l-2 border-primary/40 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
      >
        {coma.attribution}
      </p>

      <Help helpKey="p4.overview" />

      {!passage ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          No passage loaded yet.{' '}
          <Link to={`/study/${study.id}/1`} className="underline underline-offset-2">
            Set it up first
          </Link>
          .
        </div>
      ) : (
        <>
          {/* Genre reading tip (method data) + the fuller help key */}
          <div className="space-y-2">
            {readingTip ? (
              <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground">
                {readingTip}
              </p>
            ) : (
              <Help helpKey="p4.genre-reading" />
            )}
            {!genre && (
              <p className="text-xs text-warning">
                No genre set —{' '}
                <Link to={`/study/${study.id}/1`} className="underline underline-offset-2">
                  choose one in Phase 1
                </Link>{' '}
                to see genre-specific prompts.
              </p>
            )}
          </div>

          {/* Authored safety notice while the verbatim COMA sets aren't transcribed yet. */}
          {showPlaceholder && (
            <p
              role="note"
              data-testid="coma-placeholder"
              className="rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning"
            >
              {coma.placeholder}
            </p>
          )}

          {/* The four categories */}
          <div className="space-y-8">
            {CATEGORIES.map(({ key, label, helpKey }) => (
              <ComaCategory
                key={key}
                category={key}
                label={label}
                helpKey={helpKey}
                prompts={comaSet?.[key] ?? []}
                passage={passage}
                notes={study.coma[key]}
                onAdd={(note) => addNote(key, note)}
                onUpdate={(noteId, patch) => updateNote(key, noteId, patch)}
                onRemove={(noteId) => removeNote(key, noteId)}
              />
            ))}
          </div>

          <RecyclePanel study={study} passage={passage} />
        </>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to={`/study/${study.id}/3`}>← Back to map</Link>
        </Button>
        <Button asChild>
          <Link to={`/study/${study.id}/5`}>Next: Theme &amp; aim →</Link>
        </Button>
      </div>
    </div>
  );
}
