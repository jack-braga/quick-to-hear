import { useEffect, useState } from 'react';
import { BookOpen, ClipboardPaste, Loader2, Plus, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Help } from '@/components/Help';
import { TranslationCompare } from '@/components/passage/TranslationCompare';
import { StudyHeader } from '@/components/StudyHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import {
  BUNDLED_TRANSLATIONS,
  DEFAULT_TRANSLATION_ID,
  findTranslation,
  loadReading,
} from '@/lib/bible';
import {
  addSecondary,
  loadFreshPrimary,
  primaryText,
  removeTranslation,
  secondaryTexts,
  setPrimary,
} from '@/lib/passage';
import { DURATION_OPTIONS, GENRE_LABELS, GENRE_OPTIONS, GROUP_OPTIONS } from '@/lib/setup-options';
import { inferGenreForBook, parseReference } from '@/lib/verse';
import { allVerses, textlessVerseIds, type ParsedText } from '@/types/passage';
import { useStudyStore } from '@/store/study';
import { StudyNotFound } from '@/pages/StudyNotFound';

function LoadedSummary({ passage }: { passage: ParsedText }) {
  const verses = allVerses(passage);
  const gaps = verses.filter((v) => !v.present).length;
  const tr = findTranslation(passage.translationId);
  const pasted = passage.source === 'pasted';
  return (
    <div className="rounded-lg border border-success/40 bg-success/5 p-3 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <BookOpen aria-hidden className="size-4 text-success" />
        {passage.reference || 'Passage'} · {tr?.shortName ?? passage.translationId}
        {pasted && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[0.7rem] font-normal text-muted-foreground">
            pasted text
          </span>
        )}
      </div>
      <div className="mt-1 text-muted-foreground">
        {verses.length} verse{verses.length === 1 ? '' : 's'}
        {gaps > 0 && ` · ${gaps} omitted in this translation`}
      </div>
    </div>
  );
}

export default function Phase1Setup() {
  const { id = '' } = useParams();
  const { study, loading: opening } = useOpenStudy(id);
  const updateSetup = useStudyStore((s) => s.updateSetup);
  const setPassage = useStudyStore((s) => s.setPassage);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [textless, setTextless] = useState<string[]>([]);
  const [pendingSecondary, setPendingSecondary] = useState('');

  // Default the primary translation to WEBBE the first time a study is opened.
  useEffect(() => {
    if (study && !study.setup.primaryTranslationId) {
      updateSetup({ primaryTranslationId: DEFAULT_TRANSLATION_ID });
    }
  }, [study, updateSetup]);

  if (!study) return <StudyNotFound loading={opening} />;

  const setup = study.setup;
  const passage = primaryText(study.passage);
  const secondaries = secondaryTexts(study.passage);
  const usedIds = new Set(Object.keys(study.passage.translations));
  const translationId = setup.primaryTranslationId ?? DEFAULT_TRANSLATION_ID;

  const loadPassage = async () => {
    setError(null);
    setTextless([]);
    const ref = parseReference(setup.reference);
    if (!ref) {
      setError('Could not recognise that reference. Try “Luke 1:5-25”, “Psalm 23”, or “Acts 2”.');
      setWarnings([]);
      return;
    }
    const notes: string[] = [];
    if (ref.extraPassages) notes.push('More than one passage was found — using the first.');
    if (!ref.singleBook) notes.push('Passages spanning two books aren’t supported yet — using the start book only.');

    setLoading(true);
    try {
      const parsed = await loadReading(translationId, ref);
      const inferred = inferGenreForBook(ref.start.book.id);
      updateSetup({
        reference: ref.input,
        genres: inferred ? [inferred] : [],
        primaryTranslationId: translationId,
      });
      // A fresh reference load establishes THE passage — drop any comparison texts that
      // were for a different passage.
      await setPassage(loadFreshPrimary(parsed));
      setWarnings(notes);
    } catch {
      setError('Could not load that passage from the bundled text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const changeTranslation = async (nextId: string) => {
    updateSetup({ primaryTranslationId: nextId });
    setTextless([]);
    const ref = parseReference(setup.reference);
    if (!ref || !passage) return; // nothing loaded yet — nothing to re-derive
    const priorPresent = allVerses(passage)
      .filter((v) => v.present)
      .map((v) => v.verseId);
    setLoading(true);
    try {
      const parsed = await loadReading(nextId, ref);
      // Switch the primary but keep any comparison translations (same reference).
      await setPassage(setPrimary(study.passage, parsed));
      setTextless(textlessVerseIds(parsed, priorPresent));
    } catch {
      setError('Could not load that passage in the chosen translation.');
    } finally {
      setLoading(false);
    }
  };

  // Add a bundled translation as a comparison text (secondary). Loads the same reference.
  const addBundledSecondary = async (secondaryId: string) => {
    setError(null);
    const ref = parseReference(setup.reference);
    if (!ref || !passage) return;
    setLoading(true);
    try {
      const parsed = await loadReading(secondaryId, ref);
      await setPassage(addSecondary(study.passage, parsed));
    } catch {
      setError('Could not load that comparison translation.');
    } finally {
      setLoading(false);
    }
  };

  const dropSecondary = async (secondaryId: string) => {
    await setPassage(removeTranslation(study.passage, secondaryId));
  };

  // Bundled translations not already loaded (as primary or a secondary).
  const availableBundled = BUNDLED_TRANSLATIONS.filter((t) => !usedIds.has(t.id));

  return (
    <div className="space-y-8">
      <StudyHeader study={study} />

      <div>
        <h2 className="text-lg font-semibold">Phase 1 — Set up</h2>
        <p className="text-sm text-muted-foreground">
          Name the passage and the shape of your group. Everything else recycles from here.
        </p>
      </div>

      {/* Passage reference + load */}
      <section className="space-y-2">
        <label htmlFor="reference" className="text-sm font-medium">
          Passage reference
        </label>
        <div className="flex gap-2">
          <Input
            id="reference"
            value={setup.reference}
            placeholder="e.g. Luke 1:5-25"
            onChange={(e) => updateSetup({ reference: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void loadPassage();
            }}
          />
          <Button onClick={() => void loadPassage()} disabled={loading || !setup.reference.trim()}>
            {loading ? <Loader2 aria-hidden className="animate-spin" /> : null}
            Load passage
          </Button>
        </div>
        <Help helpKey="p1.reference" />

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {warnings.map((w) => (
          <p key={w} className="text-sm text-warning">
            {w}
          </p>
        ))}
        {passage && <LoadedSummary passage={passage} />}

        {/* The second way in: paste text copied from an app or site (Stage 8 / M2). */}
        <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
          <span>Not in the bundled Bibles, or want your own translation?</span>
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <Link to={`/study/${study.id}/paste`}>
              <ClipboardPaste aria-hidden className="size-4" />
              Paste your own text
            </Link>
          </Button>
        </div>
      </section>

      {/* Primary translation — for a pasted passage it is fixed (the text you pasted),
          so switching a bundled translation would overwrite it; show it read-only. */}
      <section className="space-y-2">
        <label htmlFor="translation" className="text-sm font-medium">
          Primary translation
        </label>
        {passage?.source === 'pasted' ? (
          <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
            {findTranslation(passage.translationId)?.name ?? passage.translationId}
            <span className="text-xs text-muted-foreground">· from your pasted text</span>
          </div>
        ) : (
          <Select
            id="translation"
            value={translationId}
            onChange={(e) => void changeTranslation(e.target.value)}
          >
            {BUNDLED_TRANSLATIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.shortName})
              </option>
            ))}
          </Select>
        )}
        {textless.length > 0 && (
          <p role="alert" className="text-sm text-warning">
            {textless.length} verse{textless.length === 1 ? '' : 's'} in your passage
            {textless.length === 1 ? ' has' : ' have'} no text in this translation (
            {textless.join(', ')}). Any anchors there will need re-checking.
          </p>
        )}
        <Help helpKey="p1.primary" />
      </section>

      {/* Comparison translations (M3) — secondaries are for comparison only; the primary
          stays the anchor everything else points at. */}
      {passage && (
        <section className="space-y-3">
          <div>
            <span className="text-sm font-medium">Comparison translations</span>
            <span className="ml-1 text-sm font-normal text-muted-foreground">(optional)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Add other translations to compare with — for spotting where translators made an
            interpretive decision. They never change your primary or its verse anchors.
          </p>

          {secondaries.length > 0 && (
            <ul className="space-y-1.5">
              {secondaries.map((t) => (
                <li
                  key={t.translationId}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  <span>
                    {findTranslation(t.translationId)?.name ??
                      t.translationId.replace(/^pasted-/, '').replace(/-/g, ' ')}
                    {t.source === 'pasted' && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">
                        pasted
                      </span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${t.translationId}`}
                    onClick={() => void dropSecondary(t.translationId)}
                  >
                    <X aria-hidden className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {availableBundled.length > 0 && (
              <>
                <Select
                  aria-label="Add a bundled comparison translation"
                  className="h-9 w-auto"
                  value={pendingSecondary}
                  onChange={(e) => setPendingSecondary(e.target.value)}
                >
                  <option value="">Add a bundled translation…</option>
                  {availableBundled.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.shortName})
                    </option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pendingSecondary || loading}
                  onClick={() => {
                    const idToAdd = pendingSecondary;
                    setPendingSecondary('');
                    void addBundledSecondary(idToAdd);
                  }}
                >
                  <Plus aria-hidden className="size-4" /> Add
                </Button>
              </>
            )}
            <Button variant="link" size="sm" className="h-auto p-0" asChild>
              <Link to={`/study/${study.id}/paste?as=secondary`}>
                <ClipboardPaste aria-hidden className="size-4" />
                Paste a comparison translation
              </Link>
            </Button>
          </div>

          <TranslationCompare passage={study.passage} />
        </section>
      )}

      {/* Genre (inferred, overridable) */}
      <section className="space-y-2">
        <label htmlFor="genre" className="text-sm font-medium">
          Genre <span className="font-normal text-muted-foreground">(inferred — confirm or change)</span>
        </label>
        <Select
          id="genre"
          value={setup.genres[0] ?? ''}
          onChange={(e) =>
            updateSetup({ genres: e.target.value ? [e.target.value as (typeof setup.genres)[number]] : [] })
          }
        >
          <option value="">Choose a genre…</option>
          {GENRE_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
        {setup.genres[0] && (
          <p className="text-xs text-muted-foreground">
            Determines which COMA prompts appear in Phase 4: {GENRE_LABELS[setup.genres[0]]}.
          </p>
        )}
        <Help helpKey="p1.genre" />
      </section>

      {/* Format (study only in M1) */}
      <section className="space-y-2">
        <span className="text-sm font-medium">Format</span>
        <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
          Bible study
          <span className="ml-2 text-xs">· Talk mode comes later</span>
        </div>
        <Help helpKey="p1.format" />
      </section>

      {/* Duration + group */}
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="space-y-2">
          <label htmlFor="duration" className="text-sm font-medium">
            Duration
          </label>
          <Select
            id="duration"
            value={setup.durationMinutes ?? ''}
            onChange={(e) =>
              updateSetup({ durationMinutes: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">Choose a length…</option>
            {DURATION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
          <Help helpKey="p1.duration" />
        </section>

        <section className="space-y-2">
          <label htmlFor="group" className="text-sm font-medium">
            Group composition
          </label>
          <Select
            id="group"
            value={setup.groupComposition ?? ''}
            onChange={(e) =>
              updateSetup({
                groupComposition: (e.target.value || null) as typeof setup.groupComposition,
              })
            }
          >
            <option value="">Choose…</option>
            {GROUP_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
          <Help helpKey="p1.group" />
        </section>
      </div>

      {/* Series note + intro */}
      <section className="space-y-2">
        <label htmlFor="series" className="text-sm font-medium">
          Series note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="series"
          value={setup.seriesNote}
          placeholder="e.g. Week 3 of 8 through Luke 1–2"
          onChange={(e) => updateSetup({ seriesNote: e.target.value })}
        />
        <Help helpKey="p1.series" />
      </section>

      <section className="space-y-2">
        <label htmlFor="intro" className="text-sm font-medium">
          Introduction <span className="font-normal text-muted-foreground">(optional — printed on the handout)</span>
        </label>
        <Textarea
          id="intro"
          value={setup.introText}
          placeholder="A sentence or two to set the scene for the group."
          onChange={(e) => updateSetup({ introText: e.target.value })}
        />
      </section>

      {passage && (
        <div className="flex justify-end">
          <Button asChild>
            <Link to={`/study/${study.id}/2`}>Continue: Pray &amp; read →</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
