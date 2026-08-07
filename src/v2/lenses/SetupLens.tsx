import { useState } from 'react';

import { BUNDLED_TRANSLATIONS, DEFAULT_TRANSLATION_ID, findTranslation, loadReading } from '@/lib/bible';
import { loadFreshPrimary, primaryText } from '@/lib/passage';
import { inferGenreForBook, parseReference } from '@/lib/verse';
import { allVerses } from '@/types/passage';
import { useStudyStore } from '@/store/study';
import type { Study } from '@/types/study';

/**
 * The **Set up** lens (v2.2) — the minimal, self-contained way to get a primary passage into
 * the store so v2 stands alone (v1's Phase-1 page now lives under /v1/). It is deliberately
 * small: a reference, the primary translation, an optional title. The full Set-up lens
 * (genre, group, duration, comparison translations, paste) is filled out in v2.6; the pure
 * loaders it uses (`parseReference`, `loadReading`, `loadFreshPrimary`) carry over unchanged.
 */
export function SetupLens({ study, onLoaded }: { study: Study; onLoaded?: () => void }) {
  const updateSetup = useStudyStore((s) => s.updateSetup);
  const setPassage = useStudyStore((s) => s.setPassage);

  const setup = study.setup;
  const passage = primaryText(study.passage);
  const translationId = setup.primaryTranslationId ?? DEFAULT_TRANSLATION_ID;

  const [reference, setReference] = useState(setup.reference);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const loadPassage = async () => {
    setError(null);
    const ref = parseReference(reference);
    if (!ref) {
      setError('Could not recognise that reference. Try “Luke 1:5-25”, “Psalm 23”, or “Acts 2”.');
      setWarnings([]);
      return;
    }
    const notes: string[] = [];
    if (ref.extraPassages) notes.push('More than one passage was found — using the first.');
    if (!ref.singleBook) notes.push('Passages spanning two books aren’t supported yet — using the start book.');

    setLoading(true);
    try {
      const parsed = await loadReading(translationId, ref);
      updateSetup({
        reference: ref.input,
        genre: inferGenreForBook(ref.start.book.id),
        primaryTranslationId: translationId,
      });
      await setPassage(loadFreshPrimary(parsed));
      setWarnings(notes);
      onLoaded?.();
    } catch {
      setError('Could not load that passage from the bundled text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const label = 'block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint';
  const field =
    'h-10 w-full rounded-lg border border-line bg-panel px-3 font-sans text-[15px] text-ink outline-none placeholder:text-ink-faint focus:border-lapis-edge';

  return (
    <article className="mx-auto w-full max-w-[42rem] rounded-leaf border border-line bg-leaf px-[clamp(28px,6vw,56px)] py-12 shadow-leaf">
      <h1 className="font-scripture text-[28px] leading-tight text-ink">Set up the study</h1>
      <p className="mt-1 text-[14px] text-ink-soft">
        Name the passage and pick a translation. Everything else in the workbook hangs off the
        text you load here.
      </p>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <label htmlFor="v2-reference" className={label}>
            Passage reference
          </label>
          <input
            id="v2-reference"
            className={field}
            value={reference}
            placeholder="e.g. Luke 1:5-25"
            autoComplete="off"
            onChange={(e) => setReference(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void loadPassage();
            }}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="v2-translation" className={label}>
            Primary translation
          </label>
          <select
            id="v2-translation"
            className={field}
            value={translationId}
            onChange={(e) => updateSetup({ primaryTranslationId: e.target.value })}
            disabled={passage?.source === 'pasted'}
          >
            {BUNDLED_TRANSLATIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.shortName})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => void loadPassage()}
          disabled={loading || !reference.trim()}
          className="w-full rounded-lg bg-lapis px-4 py-2.5 font-sans text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-[#10131a]"
        >
          {loading ? 'Loading…' : 'Load passage'}
        </button>

        <div className="space-y-2">
          <label htmlFor="v2-title" className={label}>
            Study title <span className="normal-case tracking-normal text-ink-faint">(optional)</span>
          </label>
          <input
            id="v2-title"
            className={field}
            value={setup.title}
            placeholder={setup.reference || 'Defaults to the reference'}
            onChange={(e) => updateSetup({ title: e.target.value })}
          />
        </div>

        {error && <p className="text-[14px] text-rubric">{error}</p>}
        {warnings.map((w) => (
          <p key={w} className="text-[13px] text-ink-soft">
            {w}
          </p>
        ))}

        {passage && (
          <div className="rounded-lg border border-line bg-panel p-3 text-[13px]">
            <div className="font-medium text-ink">
              {passage.reference || 'Passage'} · {findTranslation(passage.translationId)?.shortName ?? passage.translationId}
            </div>
            <div className="mt-0.5 text-ink-soft">
              {allVerses(passage).length} verses loaded — switch to the <b className="font-semibold">Map</b> lens
              to divide and mark it.
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
