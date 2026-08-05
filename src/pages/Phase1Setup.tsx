import { useEffect, useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { GuidancePlaceholder } from '@/components/GuidancePlaceholder';
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
import { DURATION_OPTIONS, GENRE_LABELS, GENRE_OPTIONS, GROUP_OPTIONS } from '@/lib/setup-options';
import { inferGenreForBook, parseReference } from '@/lib/verse';
import { allVerses, textlessVerseIds, type ParsedText } from '@/types/passage';
import { useStudyStore } from '@/store/study';
import { StudyNotFound } from '@/pages/StudyNotFound';

function LoadedSummary({ passage }: { passage: ParsedText }) {
  const verses = allVerses(passage);
  const gaps = verses.filter((v) => !v.present).length;
  const tr = findTranslation(passage.translationId);
  return (
    <div className="rounded-lg border border-success/40 bg-success/5 p-3 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <BookOpen aria-hidden className="size-4 text-success" />
        {passage.reference || 'Passage'} · {tr?.shortName ?? passage.translationId}
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

  // Default the primary translation to WEBBE the first time a study is opened.
  useEffect(() => {
    if (study && !study.setup.primaryTranslationId) {
      updateSetup({ primaryTranslationId: DEFAULT_TRANSLATION_ID });
    }
  }, [study, updateSetup]);

  if (!study) return <StudyNotFound loading={opening} />;

  const setup = study.setup;
  const passage = study.passage.primary;
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
      updateSetup({
        reference: ref.input,
        genre: inferGenreForBook(ref.start.book.id),
        primaryTranslationId: translationId,
      });
      await setPassage(parsed);
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
      await setPassage(parsed);
      setTextless(textlessVerseIds(parsed, priorPresent));
    } catch {
      setError('Could not load that passage in the chosen translation.');
    } finally {
      setLoading(false);
    }
  };

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
        <GuidancePlaceholder helpKey="p1.reference" />

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
      </section>

      {/* Primary translation */}
      <section className="space-y-2">
        <label htmlFor="translation" className="text-sm font-medium">
          Primary translation
        </label>
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
        {textless.length > 0 && (
          <p role="alert" className="text-sm text-warning">
            {textless.length} verse{textless.length === 1 ? '' : 's'} in your passage
            {textless.length === 1 ? ' has' : ' have'} no text in this translation (
            {textless.join(', ')}). Any anchors there will need re-checking.
          </p>
        )}
        <GuidancePlaceholder helpKey="p1.primary" />
      </section>

      {/* Genre (inferred, overridable) */}
      <section className="space-y-2">
        <label htmlFor="genre" className="text-sm font-medium">
          Genre <span className="font-normal text-muted-foreground">(inferred — confirm or change)</span>
        </label>
        <Select
          id="genre"
          value={setup.genre ?? ''}
          onChange={(e) => updateSetup({ genre: (e.target.value || null) as typeof setup.genre })}
        >
          <option value="">Choose a genre…</option>
          {GENRE_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
        {setup.genre && (
          <p className="text-xs text-muted-foreground">
            Determines which COMA prompts appear in Phase 4: {GENRE_LABELS[setup.genre]}.
          </p>
        )}
        <GuidancePlaceholder helpKey="p1.genre" />
      </section>

      {/* Format (study only in M1) */}
      <section className="space-y-2">
        <span className="text-sm font-medium">Format</span>
        <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
          Bible study
          <span className="ml-2 text-xs">· Talk mode comes later</span>
        </div>
        <GuidancePlaceholder helpKey="p1.format" />
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
          <GuidancePlaceholder helpKey="p1.duration" />
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
          <GuidancePlaceholder helpKey="p1.group" />
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
        <GuidancePlaceholder helpKey="p1.series" />
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
