import { useMemo, useState } from 'react';
import { AlertTriangle, Columns2, Rows3 } from 'lucide-react';

import { findTranslation } from '@/lib/bible';
import { alignTranslations } from '@/lib/compare';
import { primaryText, secondaryTexts } from '@/lib/passage';
import { cn } from '@/lib/utils';
import { allVerses, verseText, type ParsedText, type VerseSpan } from '@/types/passage';
import { verseRefLabel } from '@/lib/map';
import type { Passage } from '@/types/study';

/**
 * Translation comparison (M3 / Stage 9, SPEC Phase 1). Two ways in, both supported:
 *  - **On demand at a verse** (default) — tap a verse to see it across every translation;
 *  - **Side-by-side columns** (a toggle) — the whole passage, one column per translation.
 *
 * Alignment is by verse number (`@/lib/compare`); a verse present in one translation and
 * gapped/absent in another is **flagged**, never silently aligned. Comparison is for
 * *noticing an interpretive decision*, not choosing a preferred wording — stated inline.
 */

/** A short display label for a translation id (bundled short-name, or a de-slugged paste). */
function label(id: string): string {
  const t = findTranslation(id);
  if (t) return t.shortName;
  const slug = id.replace(/^pasted-/, '');
  if (!slug) return 'Pasted';
  return slug.length <= 5
    ? slug.toUpperCase()
    : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function verseNumberOf(verseId: string): string {
  return verseId.split('.').pop() ?? verseId;
}

/** One translation's cell for a verse: its text, or an honest gap marker. */
function Cell({ span }: { span: VerseSpan | undefined }) {
  if (!span) return <span className="text-muted-foreground">— not in this translation —</span>;
  if (!span.present) return <span className="text-muted-foreground">— omitted here —</span>;
  return <span>{verseText(span)}</span>;
}

export function TranslationCompare({ passage }: { passage: Passage }) {
  const primary = primaryText(passage);
  const secondaries = secondaryTexts(passage);
  const [mode, setMode] = useState<'on-demand' | 'side-by-side'>('on-demand');
  const [openVerse, setOpenVerse] = useState<string | null>(null);

  // Per-secondary alignment (mismatch counts + the side-by-side grid basis).
  const alignments = useMemo(
    () => (primary ? secondaries.map((s) => alignTranslations(primary, s)) : []),
    [primary, secondaries],
  );

  if (!primary || secondaries.length === 0) return null;

  const columns: ParsedText[] = [primary, ...secondaries];
  const spanMaps = columns.map((t) => new Map(allVerses(t).map((v) => [v.verseId, v])));

  // The unified, ordered verse list (primary first, then any secondary-only slots).
  const orderIds: string[] = [];
  const seen = new Set<string>();
  for (const t of columns) {
    for (const v of allVerses(t)) {
      if (!seen.has(v.verseId)) {
        seen.add(v.verseId);
        orderIds.push(v.verseId);
      }
    }
  }

  const mismatchTotal = alignments.reduce((n, a) => n + a.mismatchCount, 0);
  const presenceOf = (verseId: string) => spanMaps.map((m) => m.get(verseId)?.present ?? false);
  const isMismatchRow = (verseId: string) => {
    const flags = presenceOf(verseId);
    return flags.some(Boolean) && flags.some((p) => !p);
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Compare translations</h3>
        <div className="flex overflow-hidden rounded-md border border-input">
          <button
            type="button"
            onClick={() => setMode('on-demand')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 text-xs',
              mode === 'on-demand' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            <Rows3 aria-hidden className="size-3.5" /> At a verse
          </button>
          <button
            type="button"
            onClick={() => setMode('side-by-side')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 text-xs',
              mode === 'side-by-side'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            )}
          >
            <Columns2 aria-hidden className="size-3.5" /> Side by side
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Comparison is for noticing where translators made an interpretive decision — not for
        picking a wording you prefer. Alignment is by verse number;{' '}
        {mismatchTotal > 0 ? (
          <span className="text-warning">
            {mismatchTotal} verse{mismatchTotal === 1 ? ' doesn’t' : 's don’t'} line up across your
            translations (flagged below).
          </span>
        ) : (
          <span>every verse lines up across your translations.</span>
        )}
      </p>

      {mode === 'on-demand' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {orderIds.map((verseId) => (
              <button
                key={verseId}
                type="button"
                onClick={() => setOpenVerse((v) => (v === verseId ? null : verseId))}
                className={cn(
                  'rounded border px-2 py-0.5 text-xs tabular-nums',
                  openVerse === verseId
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input hover:bg-muted',
                  isMismatchRow(verseId) && openVerse !== verseId && 'text-warning',
                )}
                title={isMismatchRow(verseId) ? 'These translations differ here' : undefined}
              >
                {verseNumberOf(verseId)}
              </button>
            ))}
          </div>

          {openVerse ? (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {verseRefLabel(openVerse)}
                {isMismatchRow(openVerse) && (
                  <span className="inline-flex items-center gap-1 text-warning">
                    <AlertTriangle aria-hidden className="size-3.5" /> present in some, omitted in
                    others
                  </span>
                )}
              </div>
              <dl className="space-y-2">
                {columns.map((t, i) => (
                  <div key={t.translationId} className="grid grid-cols-[3.5rem_1fr] gap-2 text-sm">
                    <dt className="text-xs font-semibold text-muted-foreground">
                      {label(t.translationId)}
                      {i === 0 && <span className="block font-normal">(primary)</span>}
                    </dt>
                    <dd className="font-serif leading-relaxed">
                      <Cell span={spanMaps[i]!.get(openVerse)} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Tap a verse number to compare it.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="p-2 text-left text-xs font-semibold text-muted-foreground">Verse</th>
                {columns.map((t, i) => (
                  <th
                    key={t.translationId}
                    className="min-w-[10rem] p-2 text-left text-xs font-semibold"
                  >
                    {label(t.translationId)}
                    {i === 0 && (
                      <span className="ml-1 font-normal text-muted-foreground">(primary)</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderIds.map((verseId) => (
                <tr
                  key={verseId}
                  className={cn(
                    'border-b border-border/60 align-top',
                    isMismatchRow(verseId) && 'bg-warning/5',
                  )}
                >
                  <td className="whitespace-nowrap p-2 text-xs tabular-nums text-muted-foreground">
                    {verseNumberOf(verseId)}
                    {isMismatchRow(verseId) && (
                      <AlertTriangle
                        aria-label="Translations differ here"
                        className="ml-1 inline size-3 text-warning"
                      />
                    )}
                  </td>
                  {columns.map((t, i) => (
                    <td key={t.translationId} className="p-2 font-serif leading-relaxed">
                      <Cell span={spanMaps[i]!.get(verseId)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
