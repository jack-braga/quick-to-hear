import { useMemo, useRef, useState } from 'react';

import { BUNDLED_TRANSLATIONS, findTranslation, loadReading } from '@/lib/bible';
import {
  addSecondary,
  loadFreshPrimary,
  primaryText,
  removeTranslation,
  setPrimary,
  translationOrder,
} from '@/lib/passage';
import { DURATION_OPTIONS, GENRE_LABELS, GENRE_OPTIONS, GROUP_OPTIONS } from '@/lib/setup-options';
import { BOOKS, inferGenreForBook, parseReference, type ParsedReference } from '@/lib/verse';
import { allVerses } from '@/types/passage';
import { useStudyStore } from '@/store/study';
import type { Genre, GroupComposition, Study } from '@/types/study';
import { Help } from '@/v2/Help';
import { PastePanel } from '@/v2/lenses/PastePanel';

/**
 * The **Set-up engine** (v2.6, first increment). The owner's flow: type a reference (with book
 * completion) under a **live normalised-ref validator**, import one or more bundled translations
 * for it, then choose which is the **primary** (everything anchors to it). It reuses the pure
 * libs wholesale — `parseReference` (`bcv_parser`) for parse/normalise, `loadReading` for the
 * bundled text, and the M3 passage builders (`loadFreshPrimary`/`addSecondary`/`setPrimary`).
 *
 * The app is static + offline, so there is **no BibleGateway/YouVersion API**; bundled
 * public-domain texts are one source and **paste-and-clean** (reusing `analysePaste`) is the
 * other — the paste path lands in the next increment.
 */

/** A friendly, normalised label for a parsed reference (what the validator shows). */
function normaliseRefLabel(ref: ParsedReference): string {
  const s = ref.start;
  const e = ref.end;
  if (s.verseId === e.verseId) return `${s.book.name} ${s.chapter}:${s.verse}`;
  if (s.book.id !== e.book.id) return `${s.book.name} ${s.chapter}:${s.verse} – ${e.book.name} ${e.chapter}:${e.verse}`;
  if (s.chapter === e.chapter) return `${s.book.name} ${s.chapter}:${s.verse}–${e.verse}`;
  return `${s.book.name} ${s.chapter}:${s.verse}–${e.chapter}:${e.verse}`;
}

const FIELD =
  'h-10 w-full rounded-lg border border-line bg-panel px-3 font-sans text-[15px] text-ink outline-none placeholder:text-ink-faint focus:border-lapis-edge';
const LABEL = 'block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint';

export function SetupLens({ study, onLoaded }: { study: Study; onLoaded?: () => void }) {
  const updateSetup = useStudyStore((s) => s.updateSetup);
  const setPassage = useStudyStore((s) => s.setPassage);

  const passage = study.passage;
  const primary = primaryText(passage);
  const loadedIds = translationOrder(passage);
  const hasTranslations = loadedIds.length > 0;

  const [reference, setReference] = useState(study.setup.reference);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseReference(reference), [reference]);

  // Book completion: only while a bare book token is typed (no chapter yet).
  const bookToken = reference.trim().match(/^([1-3]?\s?[A-Za-z]+)$/)?.[1];
  const suggestions = useMemo(() => {
    if (!bookToken) return [];
    const q = bookToken.toLowerCase().replace(/\s+/g, ' ');
    return BOOKS.filter((b) => b.name.toLowerCase().startsWith(q)).slice(0, 6);
  }, [bookToken]);

  const addBundled = async (id: string) => {
    if (!parsed) return;
    setError(null);
    setBusy(id);
    try {
      const text = await loadReading(id, parsed);
      const first = translationOrder(passage).length === 0;
      await setPassage(first ? loadFreshPrimary(text) : addSecondary(passage, text));
      if (first) {
        updateSetup({
          reference: parsed.input,
          genre: inferGenreForBook(parsed.start.book.id),
          primaryTranslationId: id,
        });
      }
    } catch {
      setError('Could not load that passage in the chosen translation.');
    } finally {
      setBusy(null);
    }
  };

  const makePrimary = async (id: string) => {
    const text = passage.translations[id];
    if (!text) return;
    await setPassage(setPrimary(passage, text));
    updateSetup({ primaryTranslationId: id });
  };

  const remove = async (id: string) => {
    await setPassage(removeTranslation(passage, id));
  };

  const changePassage = async () => {
    await setPassage({ translations: {}, primaryId: null });
    setReference('');
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const availableBundled = BUNDLED_TRANSLATIONS.filter((t) => !passage.translations[t.id]);

  if (pasteMode) {
    return (
      <PastePanel
        study={study}
        defaultReference={primary?.reference || reference || study.setup.reference || ''}
        onDone={() => setPasteMode(false)}
      />
    );
  }

  return (
    <article className="mx-auto w-full max-w-[42rem] rounded-leaf border border-line bg-leaf px-[clamp(28px,6vw,56px)] py-12 shadow-leaf">
      <h1 className="font-scripture text-[28px] leading-tight text-ink">Set up the study</h1>
      <p className="mt-1 text-[14px] text-ink-soft">
        Name the passage, import the translations you want to work from, then choose your primary —
        the one everything else anchors to.
      </p>

      <div className="mt-8 space-y-6">
        {/* 1 — reference + live validator (locked once translations are loaded) */}
        {!hasTranslations ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="v2-reference" className={LABEL}>
                Passage reference
              </label>
              <Help helpKey="p1.reference" label="Passage reference" />
            </div>
            <div className="relative">
              <input
                id="v2-reference"
                ref={inputRef}
                className={FIELD}
                value={reference}
                placeholder="e.g. Luke 1:5-25"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setReference(e.target.value)}
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-line bg-leaf shadow-leaf">
                  {suggestions.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-[14px] hover:bg-lapis-wash"
                        onClick={() => {
                          setReference(`${b.name} `);
                          inputRef.current?.focus();
                        }}
                      >
                        <span className="font-scripture">{b.name}</span>
                        <span className="font-mono text-[11px] text-ink-faint">{b.osis}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* validator */}
            {parsed ? (
              <p className="flex items-center gap-2 text-[13px] text-ink">
                <span className="text-lapis">✓</span>
                <span>
                  Detected <b className="font-semibold">{normaliseRefLabel(parsed)}</b>
                </span>
                <span className="font-mono text-[11px] text-ink-faint">{parsed.osis}</span>
              </p>
            ) : reference.trim() ? (
              <p className="text-[13px] text-ink-faint">Keep typing a reference — e.g. “Luke 1:5-25”, “Psalm 23”.</p>
            ) : null}
            {parsed?.extraPassages && (
              <p className="text-[13px] text-ink-soft">More than one passage found — the first will be used.</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Passage</span>
            <span className="rounded-md border border-line bg-panel px-2.5 py-1 font-scripture text-[15px]">
              {primary?.reference || study.setup.reference}
            </span>
            <button
              type="button"
              onClick={() => void changePassage()}
              className="font-mono text-[12px] text-ink-faint underline underline-offset-2 hover:text-ink"
            >
              change passage
            </button>
          </div>
        )}

        {/* 2 — import translations */}
        <div className="space-y-2">
          <span className="flex items-center gap-1.5">
            <span className={LABEL}>Translations</span>
            <Help helpKey="p1.comparison" label="Translations" />
          </span>
          {loadedIds.length > 0 && (
            <ul className="space-y-1.5">
              {loadedIds.map((id) => {
                const text = passage.translations[id]!;
                const isPrimary = id === passage.primaryId;
                const tr = findTranslation(id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2 text-[14px]"
                  >
                    <button
                      type="button"
                      onClick={() => void makePrimary(id)}
                      aria-pressed={isPrimary}
                      title={isPrimary ? 'Primary translation' : 'Make this the primary'}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={
                          isPrimary
                            ? 'grid size-4 place-items-center rounded-full border-[4px] border-lapis'
                            : 'size-4 rounded-full border border-ink-faint'
                        }
                      />
                      <span className="font-medium">
                        {tr?.name ?? text.translationId.replace(/^pasted-/, '').replace(/-/g, ' ')}
                        {tr && <span className="ml-1.5 font-mono text-[11px] text-ink-faint">{tr.shortName}</span>}
                      </span>
                    </button>
                    {isPrimary && (
                      <span className="rounded bg-lapis-wash px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-lapis-ink">
                        primary
                      </span>
                    )}
                    <span className="flex-1 text-right font-mono text-[11px] text-ink-faint">
                      {allVerses(text).length} verses
                    </span>
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => void remove(id)}
                        aria-label={`Remove ${tr?.shortName ?? id}`}
                        className="text-ink-faint hover:text-rubric"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[13px] text-ink-soft">{hasTranslations ? 'Add another:' : 'Import:'}</span>
            {parsed &&
              availableBundled.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={busy != null}
                  onClick={() => void addBundled(t.id)}
                  className="rounded-lg border border-line bg-panel px-3 py-1.5 font-sans text-[13px] text-ink hover:border-lapis-edge disabled:opacity-50"
                >
                  {busy === t.id ? 'Loading…' : `+ ${t.shortName}`}
                </button>
              ))}
            <button
              type="button"
              onClick={() => setPasteMode(true)}
              className="rounded-lg border border-line bg-panel px-3 py-1.5 font-sans text-[13px] text-ink hover:border-lapis-edge"
            >
              + Paste your own
            </button>
          </div>
          {!parsed && !hasTranslations && (
            <p className="text-[13px] text-ink-faint">
              Enter a valid reference to import a bundled translation — or paste your own (it can carry
              its own reference).
            </p>
          )}
          {error && <p className="text-[13px] text-rubric">{error}</p>}
        </div>

        {/* 3 — optional title */}
        <div className="space-y-2">
          <label htmlFor="v2-title" className={LABEL}>
            Study title <span className="normal-case tracking-normal text-ink-faint">(optional)</span>
          </label>
          <input
            id="v2-title"
            className={FIELD}
            value={study.setup.title}
            placeholder={study.setup.reference || 'Defaults to the reference'}
            onChange={(e) => updateSetup({ title: e.target.value })}
          />
        </div>

        {/* 4 — the shape of the study (drives guidance, timing, and the handout) */}
        {primary && (
          <div className="space-y-4 border-t border-line pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="v2-genre" className={LABEL}>
                    Genre <span className="normal-case tracking-normal text-ink-faint">(inferred)</span>
                  </label>
                  <Help helpKey="p1.genre" label="Genre" />
                </div>
                <select
                  id="v2-genre"
                  className={FIELD}
                  value={study.setup.genre ?? ''}
                  onChange={(e) => updateSetup({ genre: (e.target.value || null) as Genre | null })}
                >
                  <option value="">Choose a genre…</option>
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                {study.setup.genre && (
                  <p className="text-[12px] text-ink-faint">Shapes the COMA prompts: {GENRE_LABELS[study.setup.genre]}.</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="v2-duration" className={LABEL}>
                    Duration
                  </label>
                  <Help helpKey="p1.duration" label="Duration" />
                </div>
                <select
                  id="v2-duration"
                  className={FIELD}
                  value={study.setup.durationMinutes ?? ''}
                  onChange={(e) => updateSetup({ durationMinutes: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Choose a length…</option>
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="v2-group" className={LABEL}>
                  Group composition
                </label>
                <Help helpKey="p1.group" label="Group composition" />
              </div>
              <select
                id="v2-group"
                className={FIELD}
                value={study.setup.groupComposition ?? ''}
                onChange={(e) =>
                  updateSetup({ groupComposition: (e.target.value || null) as GroupComposition | null })
                }
              >
                <option value="">Choose…</option>
                {GROUP_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <p className="text-[12px] text-ink-faint">
                A mixed or not-yet-Christian group asks the study to make the gospel plain (the audit checks it).
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="v2-series" className={LABEL}>
                  Series note <span className="normal-case tracking-normal text-ink-faint">(optional)</span>
                </label>
                <Help helpKey="p1.series" label="Series note" />
              </div>
              <input
                id="v2-series"
                className={FIELD}
                value={study.setup.seriesNote}
                placeholder="e.g. Week 3 of 8 through Luke 1–2"
                onChange={(e) => updateSetup({ seriesNote: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="v2-intro" className={LABEL}>
                Introduction{' '}
                <span className="normal-case tracking-normal text-ink-faint">(optional — printed on the handout)</span>
              </label>
              <textarea
                id="v2-intro"
                rows={2}
                className={`${FIELD} h-auto min-h-[4rem] py-2`}
                value={study.setup.introText}
                placeholder="A sentence or two to set the scene for the group."
                onChange={(e) => updateSetup({ introText: e.target.value })}
              />
            </div>
          </div>
        )}

        {primary && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => onLoaded?.()}
              className="rounded-lg bg-lapis px-4 py-2 font-sans text-[14px] font-medium text-white hover:opacity-90 dark:text-[#10131a]"
            >
              Read the passage →
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
