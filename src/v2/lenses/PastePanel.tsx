import { useEffect, useMemo, useState } from 'react';

import { BUNDLED_TRANSLATIONS, findTranslation } from '@/lib/bible';
import { FOREIGN_SYSTEMS, findVersificationSystem, reversifyToKjv } from '@/lib/compare';
import { addSecondary, loadFreshPrimary, translationOrder } from '@/lib/passage';
import {
  analysePaste,
  assembleParsedText,
  type AssembleContext,
  type PasteAnalysis,
  type PasteSegment,
} from '@/lib/paste';
import { inferGenreForBook, parseReference } from '@/lib/verse';
import { PassageView } from '@/components/passage/PassageView';
import { useStudyStore } from '@/store/study';
import type { Study } from '@/types/study';

/**
 * The **paste-and-clean** step of the Set-up engine (increment 2). The app is static/offline,
 * so this is the only way to bring in a non-bundled translation: the user pastes text copied
 * from an app or site (BibleGateway, YouVersion, a PDF), it's normalised by the **pure**
 * `analysePaste` pipeline, and — after a mandatory review — `assembleParsedText` turns the
 * reviewed segments into the same block/line model the bundled loader produces. Foreign verse
 * numbering is remapped onto the KJV anchor with the small `reversifyToKjv` converter.
 *
 * On accept the text is added to the study's passage exactly like a bundled import: the first
 * translation becomes the primary, the rest are comparison secondaries. Nothing is fabricated —
 * unresolved translation names get no copyright line, and uncertain parses are flagged, not guessed.
 */

function slugTranslation(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s ? `pasted-${s}` : 'pasted';
}

const FIELD =
  'h-10 w-full rounded-lg border border-line bg-panel px-3 font-sans text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-lapis-edge';
const LABEL = 'block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint';

function SegmentRow({
  s,
  onChange,
  onDrop,
}: {
  s: PasteSegment;
  onChange: (patch: Partial<PasteSegment>) => void;
  onDrop: () => void;
}) {
  const control = 'h-8 rounded-md border border-line bg-leaf px-2 font-sans text-[13px] text-ink outline-none focus:border-lapis-edge';
  return (
    <div
      className={
        'flex flex-wrap items-center gap-2 rounded-md border p-2 ' +
        (s.flagged ? 'border-[#b98a1e]/60 bg-[#b98a1e]/[0.06]' : 'border-line')
      }
    >
      <select
        aria-label="Line type"
        className={`${control} w-24 shrink-0`}
        value={s.kind}
        onChange={(e) => {
          const kind = e.target.value as PasteSegment['kind'];
          onChange(kind === 'heading' ? { kind, startsVerse: false, verseNumber: null } : { kind });
        }}
      >
        <option value="verse">Prose</option>
        <option value="poetry">Poetry</option>
        <option value="heading">Heading</option>
      </select>

      {s.kind !== 'heading' && s.startsVerse ? (
        <input
          aria-label="Verse number"
          className={`${control} w-14 shrink-0`}
          inputMode="numeric"
          value={s.verseNumber ?? ''}
          onChange={(e) => {
            const n = e.target.value.trim();
            onChange({ verseNumber: n ? Number(n.replace(/\D/g, '')) : null });
          }}
        />
      ) : (
        <span className="w-14 shrink-0 text-center font-mono text-[11px] text-ink-faint" aria-hidden>
          {s.kind === 'heading' ? '§' : '↳'}
        </span>
      )}

      {s.kind === 'poetry' && (
        <select
          aria-label="Indent"
          className={`${control} w-16 shrink-0`}
          value={String(s.indent)}
          onChange={(e) => onChange({ indent: Number(e.target.value) })}
        >
          <option value="0">•</option>
          <option value="1">◦ 1</option>
          <option value="2">◦◦ 2</option>
        </select>
      )}

      <input
        aria-label="Line text"
        className={`${control} min-w-[10rem] flex-1 font-scripture`}
        value={s.text}
        onChange={(e) => onChange({ text: e.target.value })}
      />

      <button
        type="button"
        aria-label="Drop this line"
        className="grid size-8 shrink-0 place-items-center rounded-md text-ink-faint hover:text-rubric"
        onClick={onDrop}
      >
        ✕
      </button>
    </div>
  );
}

export function PastePanel({
  study,
  defaultReference,
  onDone,
}: {
  study: Study;
  defaultReference: string;
  onDone: () => void;
}) {
  const updateSetup = useStudyStore((s) => s.updateSetup);
  const setPassage = useStudyStore((s) => s.setPassage);

  // If a passage is already established, a paste is a comparison for the SAME reference (locked).
  const asSecondary = translationOrder(study.passage).length > 0;

  const [raw, setRaw] = useState('');
  const [analysis, setAnalysis] = useState<PasteAnalysis | null>(null);
  const [segments, setSegments] = useState<PasteSegment[]>([]);
  const [reference, setReference] = useState(defaultReference);
  const [translationChoice, setTranslationChoice] = useState('other');
  const [customName, setCustomName] = useState('');
  const [versificationId, setVersificationId] = useState('');
  const [showChrome, setShowChrome] = useState(false);
  const [saving, setSaving] = useState(false);

  const translationId = translationChoice === 'other' ? slugTranslation(customName) : translationChoice;

  const assembled = useMemo(() => {
    const pr = parseReference(reference);
    if (!pr) return null;
    return assembleParsedText(segments, {
      bookOsis: pr.start.book.osis,
      startChapter: pr.start.chapter,
      translationId,
      reference: pr.input,
    });
  }, [reference, translationId, segments]);

  const remapped = useMemo(() => {
    if (!assembled) return null;
    const system = findVersificationSystem(versificationId);
    return system ? reversifyToKjv(assembled, system) : { text: assembled, unmappable: [] };
  }, [assembled, versificationId]);
  const preview = remapped?.text ?? null;
  const unmappable = remapped?.unmappable ?? [];

  const analyse = () => {
    const seedRef = parseReference(reference || defaultReference);
    const result = analysePaste(raw, {
      startVerse: seedRef?.start.verse,
      fallbackReference: defaultReference || null,
    });
    setAnalysis(result);
    setSegments(result.segments);
    if (!asSecondary) setReference(result.detectedReference ?? reference ?? defaultReference ?? '');
    if (result.detectedTranslationId) setTranslationChoice(result.detectedTranslationId);
    else if (result.detectedTranslationName) {
      setTranslationChoice('other');
      setCustomName(result.detectedTranslationName);
    }
  };

  const parsedRef = parseReference(reference);
  const translationLabel =
    translationChoice === 'other'
      ? customName || 'Pasted text'
      : (findTranslation(translationChoice)?.name ?? translationChoice);
  const copyrightResolved = translationChoice !== 'other' && !!findTranslation(translationChoice);
  const ctx: AssembleContext | null = parsedRef
    ? {
        bookOsis: parsedRef.start.book.osis,
        startChapter: parsedRef.start.chapter,
        translationId,
        reference: parsedRef.input,
      }
    : null;

  const patchSegment = (segId: string, patch: Partial<PasteSegment>) =>
    setSegments((prev) => prev.map((s) => (s.id === segId ? { ...s, ...patch } : s)));
  const dropSegment = (segId: string) => setSegments((prev) => prev.filter((s) => s.id !== segId));

  const verseCount = preview ? preview.blocks.flatMap((b) => b.verses).length : 0;
  const canAccept = !!ctx && verseCount > 0 && !saving;

  const accept = async () => {
    if (!ctx || !preview) return;
    setSaving(true);
    try {
      const text = { ...preview, source: 'pasted' as const };
      if (asSecondary) {
        await setPassage(addSecondary(study.passage, text));
      } else {
        updateSetup({
          reference: ctx.reference,
          genre: study.setup.genre ?? inferGenreForBook(parsedRef!.start.book.id),
          primaryTranslationId: ctx.translationId,
        });
        await setPassage(loadFreshPrimary(text));
      }
      onDone();
    } finally {
      setSaving(false);
    }
  };

  // Keep the reference in step with the study while establishing a fresh passage.
  useEffect(() => {
    if (asSecondary) setReference(defaultReference);
  }, [asSecondary, defaultReference]);

  return (
    <article className="mx-auto w-full max-w-[52rem] rounded-leaf border border-line bg-leaf px-[clamp(24px,5vw,44px)] py-10 shadow-leaf">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-scripture text-[26px] leading-tight text-ink">
          {asSecondary ? 'Paste a comparison translation' : 'Paste your own passage'}
        </h1>
        <button
          type="button"
          onClick={onDone}
          className="font-mono text-[12px] text-ink-faint underline underline-offset-2 hover:text-ink"
        >
          ← back to set up
        </button>
      </div>
      <p className="mt-1 text-[14px] text-ink-soft">
        Copy the text from an app or site (BibleGateway, YouVersion, a PDF). It’s tidied up, then you
        review it before it {asSecondary ? 'joins as a comparison translation.' : 'becomes the passage.'}
      </p>

      {/* Step 1 — paste + reference */}
      <div className="mt-6 space-y-3">
        <label htmlFor="v2-paste" className={LABEL}>
          Pasted text
        </label>
        <textarea
          id="v2-paste"
          className="min-h-[8rem] w-full rounded-lg border border-line bg-panel p-3 font-mono text-[12px] text-ink outline-none placeholder:text-ink-faint focus:border-lapis-edge"
          placeholder="Paste the passage here…"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        <div className="flex flex-wrap items-end gap-3">
          <div className="grow space-y-1">
            <label htmlFor="v2-paste-ref" className="font-mono text-[11px] text-ink-faint">
              Passage reference (verses anchor to this)
            </label>
            <input
              id="v2-paste-ref"
              className={FIELD}
              value={reference}
              placeholder="e.g. Luke 1:46-56"
              disabled={asSecondary}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={analyse}
            disabled={!raw.trim()}
            className="h-10 shrink-0 rounded-lg bg-lapis px-4 font-sans text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-50 dark:text-[#10131a]"
          >
            {analysis ? 'Re-analyse' : 'Tidy it up'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="mt-6 space-y-5">
          {analysis.flags.length > 0 && (
            <div className="rounded-lg border border-[#b98a1e]/50 bg-[#b98a1e]/[0.06] p-3 text-[13px]">
              <div className="mb-1 font-semibold text-ink">Check these before accepting</div>
              <ul className="ml-5 list-disc space-y-0.5 text-ink-soft">
                {analysis.flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* translation + versification + detected summary */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="v2-paste-tr" className={LABEL}>
                Translation
              </label>
              <select
                id="v2-paste-tr"
                className={FIELD}
                value={translationChoice}
                onChange={(e) => setTranslationChoice(e.target.value)}
              >
                {BUNDLED_TRANSLATIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
                <option value="other">Other (type the name)…</option>
              </select>
              {translationChoice === 'other' && (
                <input
                  aria-label="Translation name"
                  className={FIELD}
                  placeholder="e.g. New International Version"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              )}
              {!copyrightResolved && (
                <p className="text-[12px] text-ink-soft">
                  Not a bundled translation — its copyright line can’t be auto-added, so add it to
                  the handout yourself.
                </p>
              )}
              <label htmlFor="v2-paste-vers" className="mt-1 block font-mono text-[11px] text-ink-faint">
                Verse numbering
              </label>
              <select
                id="v2-paste-vers"
                className={FIELD}
                value={versificationId}
                onChange={(e) => setVersificationId(e.target.value)}
              >
                <option value="">Standard (KJV numbering) — usually correct</option>
                {FOREIGN_SYSTEMS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              {unmappable.length > 0 && (
                <p className="text-[12px] text-rubric">
                  {unmappable.length} verse{unmappable.length === 1 ? '' : 's'} have no KJV verse to
                  line up with — they won’t be compared.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <span className={LABEL}>Detected</span>
              <p className="text-[13px] text-ink-soft">
                {reference || '— no reference —'} · {translationLabel} · {verseCount} verse
                {verseCount === 1 ? '' : 's'}
              </p>
              {analysis.droppedChrome.length > 0 && (
                <button
                  type="button"
                  className="font-mono text-[11px] text-ink-faint underline underline-offset-2 hover:text-ink"
                  onClick={() => setShowChrome((v) => !v)}
                >
                  Removed {analysis.droppedChrome.length} line
                  {analysis.droppedChrome.length === 1 ? '' : 's'} of clutter {showChrome ? '(hide)' : '(show)'}
                </button>
              )}
              {showChrome && (
                <pre className="max-h-28 overflow-auto rounded bg-panel p-2 font-mono text-[11px] text-ink-soft">
                  {analysis.droppedChrome.join('\n')}
                </pre>
              )}
            </div>
          </div>

          {/* Step 2 — review + preview */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-sans text-[13px] font-semibold text-ink">Review &amp; correct</h3>
              <p className="text-[12px] text-ink-soft">
                Fix a wrong line type or verse number, or drop a stray line. Amber rows looked uncertain.
              </p>
              <div className="space-y-1.5">
                {segments.map((s) => (
                  <SegmentRow
                    key={s.id}
                    s={s}
                    onChange={(patch) => patchSegment(s.id, patch)}
                    onDrop={() => dropSegment(s.id)}
                  />
                ))}
                {segments.length === 0 && <p className="text-[13px] text-ink-soft">No lines — paste text above.</p>}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-sans text-[13px] font-semibold text-ink">Preview</h3>
              <p className="text-[12px] text-ink-soft">How your passage will read.</p>
              <div className="rounded-lg border border-line bg-panel/40 p-4">
                {preview && verseCount > 0 ? (
                  <PassageView passage={preview} />
                ) : (
                  <p className="text-[13px] text-ink-soft">
                    {ctx ? 'Nothing to preview yet.' : 'Enter a valid reference to preview.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onDone}
              className="font-sans text-[13px] text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void accept()}
              disabled={!canAccept}
              className="rounded-lg bg-lapis px-4 py-2 font-sans text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-50 dark:text-[#10131a]"
            >
              {asSecondary ? 'Add as comparison' : 'Accept as the passage'}
            </button>
          </div>
          {!ctx && (
            <p className="text-right text-[12px] text-rubric">
              A recognisable reference is required so verses can be anchored.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
