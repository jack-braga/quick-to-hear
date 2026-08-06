import { useMemo, useState } from 'react';
import { AlertTriangle, ClipboardPaste, Trash2, Wand2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Help } from '@/components/Help';
import { PassageView } from '@/components/passage/PassageView';
import { StudyHeader } from '@/components/StudyHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import { BUNDLED_TRANSLATIONS, findTranslation } from '@/lib/bible';
import {
  analysePaste,
  assembleParsedText,
  type AssembleContext,
  type PasteAnalysis,
  type PasteSegment,
} from '@/lib/paste';
import { inferGenreForBook, parseReference } from '@/lib/verse';
import { useStudyStore } from '@/store/study';
import { StudyNotFound } from '@/pages/StudyNotFound';

/** A translation id for pasted, non-bundled text (keeps the copyright line honest: unknown
 *  ids resolve to no line, which the review flags rather than fabricating one). */
function slugTranslation(name: string): string {
  const s = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return s ? `pasted-${s}` : 'pasted';
}

function SegmentRow({
  s,
  onChange,
  onDrop,
}: {
  s: PasteSegment;
  onChange: (patch: Partial<PasteSegment>) => void;
  onDrop: () => void;
}) {
  return (
    <div
      className={
        'flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm ' +
        (s.flagged ? 'border-warning/60 bg-warning/5' : 'border-border')
      }
    >
      <Select
        aria-label="Line type"
        className="h-8 w-28 shrink-0"
        value={s.kind}
        onChange={(e) => {
          const kind = e.target.value as PasteSegment['kind'];
          onChange(kind === 'heading' ? { kind, startsVerse: false, verseNumber: null } : { kind });
        }}
      >
        <option value="verse">Prose</option>
        <option value="poetry">Poetry</option>
        <option value="heading">Heading</option>
      </Select>

      {s.kind !== 'heading' && s.startsVerse ? (
        <Input
          aria-label="Verse number"
          className="h-8 w-16 shrink-0"
          inputMode="numeric"
          value={s.verseNumber ?? ''}
          onChange={(e) => {
            const n = e.target.value.trim();
            onChange({ verseNumber: n ? Number(n.replace(/\D/g, '')) : null });
          }}
        />
      ) : (
        <span className="w-16 shrink-0 text-center text-xs text-muted-foreground" aria-hidden>
          {s.kind === 'heading' ? '§' : '↳'}
        </span>
      )}

      {s.kind === 'poetry' && (
        <Select
          aria-label="Indent"
          className="h-8 w-20 shrink-0"
          value={String(s.indent)}
          onChange={(e) => onChange({ indent: Number(e.target.value) })}
        >
          <option value="0">•</option>
          <option value="1">◦ 1</option>
          <option value="2">◦◦ 2</option>
        </Select>
      )}

      <Input
        aria-label="Line text"
        className="h-8 min-w-[12rem] flex-1"
        value={s.text}
        onChange={(e) => onChange({ text: e.target.value })}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="Drop this line"
        onClick={onDrop}
      >
        <Trash2 aria-hidden className="size-4" />
      </Button>
    </div>
  );
}

export default function PasteReview() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { study, loading: opening } = useOpenStudy(id);
  const updateSetup = useStudyStore((s) => s.updateSetup);
  const setPassage = useStudyStore((s) => s.setPassage);

  const [raw, setRaw] = useState('');
  const [analysis, setAnalysis] = useState<PasteAnalysis | null>(null);
  const [segments, setSegments] = useState<PasteSegment[]>([]);
  const [reference, setReference] = useState('');
  const [translationChoice, setTranslationChoice] = useState('webbe');
  const [customName, setCustomName] = useState('');
  const [showChrome, setShowChrome] = useState(false);
  const [saving, setSaving] = useState(false);

  const translationId =
    translationChoice === 'other' ? slugTranslation(customName) : translationChoice;

  // Assemble a live preview from primitive deps (so the memo doesn't rerun every render).
  const preview = useMemo(() => {
    const pr = parseReference(reference);
    if (!pr) return null;
    return assembleParsedText(segments, {
      bookOsis: pr.start.book.osis,
      startChapter: pr.start.chapter,
      translationId,
      reference: pr.input,
    });
  }, [reference, translationId, segments]);

  if (!study) return <StudyNotFound loading={opening} />;

  const analyse = () => {
    const seedRef = parseReference(reference || study.setup.reference);
    const result = analysePaste(raw, {
      startVerse: seedRef?.start.verse,
      fallbackReference: study.setup.reference || null,
    });
    setAnalysis(result);
    setSegments(result.segments);
    setReference(result.detectedReference ?? reference ?? study.setup.reference ?? '');
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
  const copyrightResolved =
    translationChoice !== 'other' && !!findTranslation(translationChoice);
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
  const dropSegment = (segId: string) =>
    setSegments((prev) => prev.filter((s) => s.id !== segId));

  const verseCount = preview ? preview.blocks.flatMap((b) => b.verses).length : 0;
  const canAccept = !!ctx && verseCount > 0 && !saving;

  const accept = async () => {
    if (!ctx || !preview) return;
    setSaving(true);
    try {
      updateSetup({
        reference: ctx.reference,
        genre: study.setup.genre ?? inferGenreForBook(parsedRef!.start.book.id),
        primaryTranslationId: ctx.translationId,
      });
      await setPassage({ ...preview, source: 'pasted' });
      navigate(`/study/${study.id}/1`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <StudyHeader study={study} />

      <div>
        <h2 className="text-lg font-semibold">Paste your own passage</h2>
        <p className="text-sm text-muted-foreground">
          Copy the text from an app or website (BibleGateway, YouVersion, a PDF…). The tool
          tidies it up, then you review the result before it becomes your passage.
        </p>
      </div>

      {/* Step 1 — paste + reference */}
      <section className="space-y-2">
        <label htmlFor="paste" className="text-sm font-medium">
          Pasted text
        </label>
        <Textarea
          id="paste"
          className="min-h-[9rem] font-mono text-xs"
          placeholder="Paste the passage here…"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        <Help helpKey="p1.paste" />
        <div className="flex flex-wrap items-end gap-3">
          <div className="grow space-y-1">
            <label htmlFor="paste-ref" className="text-xs font-medium text-muted-foreground">
              Passage reference (verses anchor to this)
            </label>
            <Input
              id="paste-ref"
              value={reference}
              placeholder="e.g. Luke 1:46-56"
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <Button onClick={analyse} disabled={!raw.trim()}>
            <Wand2 aria-hidden className="size-4" />
            {analysis ? 'Re-analyse' : 'Tidy it up'}
          </Button>
        </div>
      </section>

      {analysis && (
        <>
          {/* Flags + what was stripped */}
          {analysis.flags.length > 0 && (
            <div className="rounded-md border border-warning/50 bg-warning/5 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2 font-medium text-warning-foreground">
                <AlertTriangle aria-hidden className="size-4 text-warning" />
                Check these before accepting
              </div>
              <ul className="ml-6 list-disc space-y-0.5 text-muted-foreground">
                {analysis.flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Translation + reference confirmation */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="paste-tr" className="text-sm font-medium">
                Translation
              </label>
              <Select
                id="paste-tr"
                value={translationChoice}
                onChange={(e) => setTranslationChoice(e.target.value)}
              >
                {BUNDLED_TRANSLATIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
                <option value="other">Other (type the name)…</option>
              </Select>
              {translationChoice === 'other' && (
                <Input
                  aria-label="Translation name"
                  className="mt-2"
                  placeholder="e.g. New International Version"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              )}
              {!copyrightResolved && (
                <p className="text-xs text-muted-foreground">
                  Not a bundled translation — its copyright line can’t be auto-added, so add it
                  to the handout yourself.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium">Detected</span>
              <p className="text-sm text-muted-foreground">
                {reference || '— no reference —'} · {translationLabel} · {verseCount} verse
                {verseCount === 1 ? '' : 's'}
              </p>
              {analysis.droppedChrome.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline underline-offset-2"
                  onClick={() => setShowChrome((v) => !v)}
                >
                  Removed {analysis.droppedChrome.length} line
                  {analysis.droppedChrome.length === 1 ? '' : 's'} of app clutter
                  {showChrome ? ' (hide)' : ' (show)'}
                </button>
              )}
              {showChrome && (
                <pre className="max-h-28 overflow-auto rounded bg-muted/50 p-2 text-[0.7rem] text-muted-foreground">
                  {analysis.droppedChrome.join('\n')}
                </pre>
              )}
            </div>
          </section>

          {/* Step 2 — the review editor + live preview */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Review &amp; correct the parse</h3>
              <p className="text-xs text-muted-foreground">
                Fix a wrong line type or verse number, or drop a stray line. Amber rows looked
                uncertain.
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
                {segments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No lines — paste text above.</p>
                )}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Preview</h3>
              <p className="text-xs text-muted-foreground">How your passage will read.</p>
              <div className="rounded-lg border border-border p-4">
                {preview && verseCount > 0 ? (
                  <PassageView passage={preview} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {ctx ? 'Nothing to preview yet.' : 'Enter a valid reference to preview.'}
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button variant="ghost" asChild>
              <Link to={`/study/${study.id}/1`}>← Back to set up</Link>
            </Button>
            <Button onClick={() => void accept()} disabled={!canAccept}>
              <ClipboardPaste aria-hidden className="size-4" />
              Accept as the passage
            </Button>
          </div>
          {!ctx && (
            <p className="text-right text-xs text-destructive">
              A recognisable reference is required so verses can be anchored.
            </p>
          )}
        </>
      )}
    </div>
  );
}
