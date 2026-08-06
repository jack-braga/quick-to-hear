import { useEffect, useMemo, useState } from 'react';
import { Scissors, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { GuidancePlaceholder } from '@/components/GuidancePlaceholder';
import { VerseAnchorPicker } from '@/components/passage/VerseAnchorPicker';
import { StudyHeader } from '@/components/StudyHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import { newId } from '@/lib/id';
import {
  makeSpanMark,
  makeVerseMark,
  mergeSectionUp,
  orderedSections,
  renameSection,
  resolvedMarkText,
  sectionVerseIds,
  sectionsMatchPassage,
  splitSectionAt,
  tokenizeVerse,
  verseRefLabel,
  wholePassageSection,
} from '@/lib/map';
import { compareVerseIds } from '@/lib/verse/ids';
import { cn } from '@/lib/utils';
import { allVerses, verseIds, verseText, type ParsedText, type VerseSpan } from '@/types/passage';
import { useStudyStore } from '@/store/study';
import type { Mark, Section, VerseAnchor } from '@/types/study';
import { StudyNotFound } from '@/pages/StudyNotFound';

const KINDS = [
  { value: 'verse', label: 'A verse' },
  { value: 'phrase', label: 'A phrase' },
  { value: 'word', label: 'A word' },
] as const;
type MarkKind = (typeof KINDS)[number]['value'];

function preview(verse: VerseSpan): string {
  if (!verse.present) return '—';
  const t = verseText(verse);
  return t.length > 90 ? `${t.slice(0, 90)}…` : t;
}

// ---------------------------------------------------------------------------
// 3a — Structure
// ---------------------------------------------------------------------------

function StructureEditor({
  passage,
  sections,
  onSections,
}: {
  passage: ParsedText;
  sections: Section[];
  onSections: (recipe: (prev: Section[]) => Section[]) => void;
}) {
  const pvIds = useMemo(() => verseIds(passage), [passage]);
  const byId = useMemo(
    () => new Map(allVerses(passage).map((v) => [v.verseId, v])),
    [passage],
  );
  const valid = sectionsMatchPassage(sections, pvIds);

  if (!valid) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          The passage isn’t divided yet. Start with the whole passage as one section, then
          cut it at the author’s breaks.
        </p>
        <Button
          onClick={() => onSections(() => [wholePassageSection(pvIds, newId())])}
          data-testid="divide-start"
        >
          Divide into sections
        </Button>
      </div>
    );
  }

  const ordered = orderedSections(sections, pvIds);

  return (
    <div className="space-y-3">
      {ordered.map((section, k) => {
        const verses = sectionVerseIds(section, pvIds);
        return (
          <div
            key={section.id}
            data-testid="section-card"
            data-section-id={section.id}
            className="overflow-hidden rounded-lg border border-border"
          >
            <div className="flex items-center gap-2 border-l-4 border-primary bg-muted/40 p-3">
              <span className="select-none text-xs font-semibold text-muted-foreground">
                §{k + 1}
              </span>
              <Input
                aria-label={`Name for section ${k + 1}`}
                value={section.name}
                placeholder="Name this section in your own words…"
                onChange={(e) =>
                  onSections((prev) => renameSection(prev, section.id, e.target.value))
                }
              />
              {k > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="merge-up"
                  title="Remove the break above (merge into the previous section)"
                  onClick={() => onSections((prev) => mergeSectionUp(prev, section.id, pvIds))}
                >
                  Merge up
                </Button>
              )}
            </div>
            <ul className="divide-y divide-border">
              {verses.map((vid, i) => {
                const verse = byId.get(vid);
                const nextVid = verses[i + 1];
                return (
                  <li key={vid} className="px-3">
                    <div className="flex gap-2 py-2 text-sm">
                      <span className="w-8 shrink-0 select-none text-right font-sans text-xs text-muted-foreground">
                        {verseRefLabel(vid).split(' ').pop()}
                      </span>
                      <span className="font-serif text-foreground">
                        {verse ? preview(verse) : vid}
                      </span>
                    </div>
                    {nextVid && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          data-testid="split-after"
                          data-after={vid}
                          title="Cut a new section here"
                          onClick={() =>
                            onSections((prev) =>
                              splitSectionAt(prev, section.id, nextVid, pvIds, newId()),
                            )
                          }
                          className="-my-px inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[0.7rem] text-muted-foreground hover:border-primary/60 hover:text-foreground"
                        >
                          <Scissors aria-hidden className="size-3" />
                          Split here
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3b — Marks
// ---------------------------------------------------------------------------

function TokenPicker({
  verse,
  kind,
  selection,
  onSelect,
}: {
  verse: VerseSpan;
  kind: 'phrase' | 'word';
  selection: [number, number] | null;
  onSelect: (sel: [number, number] | null) => void;
}) {
  const tokens = useMemo(() => tokenizeVerse(verseText(verse)), [verse]);
  const [lo, hi] = selection ?? [-1, -1];

  const click = (i: number) => {
    if (kind === 'word') {
      onSelect(selection && lo === i && hi === i ? null : [i, i]);
      return;
    }
    // phrase: first click anchors, second click extends to a contiguous run
    if (!selection || lo !== hi || i === lo) {
      onSelect([i, i]);
    } else {
      onSelect([Math.min(lo, i), Math.max(lo, i)]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1" data-testid="token-picker">
      {tokens.map((t, i) => {
        const inSel = selection != null && i >= lo && i <= hi;
        return (
          <button
            key={i}
            type="button"
            data-testid="token"
            data-index={i}
            data-selected={inSel || undefined}
            onClick={() => click(i)}
            className={cn(
              'rounded border px-1.5 py-0.5 font-serif text-sm transition-colors',
              inSel
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-transparent hover:border-border hover:bg-accent',
            )}
          >
            {t.text}
          </button>
        );
      })}
    </div>
  );
}

function MarkComposer({
  passage,
  onAdd,
}: {
  passage: ParsedText;
  onAdd: (mark: Mark) => void;
}) {
  const [kind, setKind] = useState<MarkKind>('verse');
  const [anchor, setAnchor] = useState<VerseAnchor>({ verseIds: [] });
  const [selection, setSelection] = useState<[number, number] | null>(null);

  const verseId = anchor.verseIds[0] ?? null;
  const verse = useMemo(
    () => (verseId ? allVerses(passage).find((v) => v.verseId === verseId) : undefined),
    [passage, verseId],
  );

  // Reset the sub-verse selection whenever the verse or the mark kind changes.
  useEffect(() => setSelection(null), [verseId, kind]);

  const canAdd =
    verse != null &&
    verse.present &&
    (kind === 'verse' || selection != null);

  const add = () => {
    if (!verse || !verse.present) return;
    if (kind === 'verse') {
      onAdd(makeVerseMark(verse, newId()));
    } else if (selection) {
      const tokens = tokenizeVerse(verseText(verse));
      const [lo, hi] = selection;
      const start = tokens[lo]!.start;
      const end = tokens[hi]!.end;
      onAdd(makeSpanMark(kind, verse, start, end, newId()));
    }
    setAnchor({ verseIds: [] });
    setSelection(null);
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="space-y-2">
        <span className="text-sm font-medium">What didn’t you understand?</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kind of mark">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              role="radio"
              aria-checked={kind === k.value}
              data-testid={`kind-${k.value}`}
              onClick={() => setKind(k.value)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                kind === k.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-accent',
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">
          {kind === 'verse' ? 'Which verse?' : 'In which verse?'}
        </span>
        <VerseAnchorPicker
          passage={passage}
          value={anchor}
          onChange={setAnchor}
          multiple={false}
          aria-label="Choose the verse to mark"
        />
      </div>

      {kind !== 'verse' && verse && verse.present && (
        <div className="space-y-2">
          <span className="text-sm font-medium">
            {kind === 'word' ? 'Tap the word' : 'Tap the first and last word'}
          </span>
          <TokenPicker verse={verse} kind={kind} selection={selection} onSelect={setSelection} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={add} disabled={!canAdd} data-testid="add-mark">
          Add this question mark
        </Button>
        {verse && !verse.present && (
          <span className="text-sm text-warning">That verse has no text in this translation.</span>
        )}
      </div>
    </div>
  );
}

function MarkList({
  passage,
  marks,
  onRemove,
}: {
  passage: ParsedText;
  marks: Mark[];
  onRemove: (id: string) => void;
}) {
  const byId = useMemo(() => new Map(allVerses(passage).map((v) => [v.verseId, v])), [passage]);
  // Only marks anchored in the loaded passage, in canonical order.
  const shown = useMemo(
    () =>
      marks
        .filter((m) => byId.has(m.verseId))
        .sort((a, b) => compareVerseIds(a.verseId, b.verseId)),
    [marks, byId],
  );

  if (shown.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing marked yet. Mark anything — a verse, a phrase, or a word — you couldn’t explain.
      </p>
    );
  }

  return (
    <ul className="space-y-2" data-testid="mark-list">
      {shown.map((m) => (
        <li
          key={m.id}
          data-testid="mark-item"
          data-kind={m.kind}
          data-verse={m.verseId}
          className="flex items-start justify-between gap-3 rounded-md border border-border bg-card p-3"
        >
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-secondary-foreground">
                {m.kind}
              </span>
              <span className="text-xs text-muted-foreground">{verseRefLabel(m.verseId)}</span>
            </div>
            <p className="truncate font-serif text-sm text-foreground">
              {m.kind === 'verse' ? '' : '“'}
              {resolvedMarkText(m, byId.get(m.verseId))}
              {m.kind === 'verse' ? '' : '”'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Remove this mark"
            data-testid="remove-mark"
            onClick={() => onRemove(m.id)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X aria-hidden className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Phase3Map() {
  const { id = '' } = useParams();
  const { study, loading } = useOpenStudy(id);
  const applyToCurrent = useStudyStore((s) => s.applyToCurrent);

  if (!study) return <StudyNotFound loading={loading} />;

  const passage = study.passage.primary;
  const map = study.map;

  const setSections = (recipe: (prev: Section[]) => Section[]) =>
    applyToCurrent((s) => ({ ...s, map: { ...s.map, sections: recipe(s.map.sections) } }));

  const addMark = (mark: Mark) =>
    applyToCurrent((s) => ({ ...s, map: { ...s.map, marks: [...s.map.marks, mark] } }));

  const removeMark = (markId: string) =>
    applyToCurrent((s) => ({
      ...s,
      map: { ...s.map, marks: s.map.marks.filter((m) => m.id !== markId) },
    }));

  return (
    <div className="space-y-8">
      <StudyHeader study={study} />

      <div>
        <h2 className="text-lg font-semibold">Phase 3 — Map the passage</h2>
        <p className="text-sm text-muted-foreground">
          Two tasks, both anchored to the text: divide it into sections, and mark whatever
          you couldn’t explain.
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
        <>
          {/* 3a — Structure */}
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">a. Divide into sections</h3>
              <GuidancePlaceholder helpKey="p3.structure" />
              <div className="mt-2">
                <GuidancePlaceholder helpKey="p3.boundaries" />
              </div>
            </div>
            <StructureEditor passage={passage} sections={map.sections} onSections={setSections} />
          </section>

          {/* 3b — Marks */}
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">b. Mark what you don’t understand</h3>
              <GuidancePlaceholder helpKey="p3.marks" />
            </div>
            <MarkComposer passage={passage} onAdd={addMark} />
            <MarkList passage={passage} marks={map.marks} onRemove={removeMark} />
          </section>
        </>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to={`/study/${study.id}/2`}>← Back to read</Link>
        </Button>
        <Button asChild>
          <Link to={`/study/${study.id}/4`}>Next: COMA →</Link>
        </Button>
      </div>
    </div>
  );
}
