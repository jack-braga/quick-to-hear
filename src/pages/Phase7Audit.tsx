import { AlertTriangle, Check, Download, FileText, Minus, Printer } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Help } from '@/components/Help';
import { StudyHeader } from '@/components/StudyHeader';
import { Button } from '@/components/ui/button';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import { auditCheckById } from '@/lib/content';
import {
  auditResults,
  coverageMap,
  COVERAGE_TAG_LABELS,
  type AuditItemResult,
  type AuditStatus,
  type CoverageSection,
} from '@/lib/audit';
import { downloadHandoutMarkdown, downloadLeaderMarkdown } from '@/lib/export';
import { downloadProjectFile } from '@/lib/download';
import { verseRefLabel } from '@/lib/map';
import { cn } from '@/lib/utils';
import { useStudyStore } from '@/store/study';
import type { CoverageTag, Study } from '@/types/study';
import { StudyNotFound } from '@/pages/StudyNotFound';

const COVERAGE_TAGS: CoverageTag[] = ['connective', 'deferred', 'needs-question'];

// ---------------------------------------------------------------------------
// Status glyph
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: AuditStatus }) {
  if (status === 'met')
    return <Check aria-label="met" className="size-5 shrink-0 text-success" data-status="met" />;
  if (status === 'na')
    return (
      <Minus aria-label="not applicable" className="size-5 shrink-0 text-muted-foreground/60" data-status="na" />
    );
  return (
    <AlertTriangle aria-label="needs a look" className="size-5 shrink-0 text-warning" data-status="unmet" />
  );
}

// ---------------------------------------------------------------------------
// Coverage map (SPEC 7 — the interesting one)
// ---------------------------------------------------------------------------

function rangeLabel(section: CoverageSection): string {
  const first = section.verseIds[0];
  const last = section.verseIds[section.verseIds.length - 1];
  if (!first) return '';
  if (!last || first === last) return verseRefLabel(first);
  const lastPart = verseRefLabel(last).split(' ').pop();
  return `${verseRefLabel(first)}–${lastPart}`;
}

/** A compact verse-by-verse strip: one pip per verse, filled where a question's anchor
 *  touches it. This is the SPEC's "visual map of the passage showing which verses no
 *  question touches" (Phase 7), made literal. The pips are decorative — the text summary
 *  beside them carries the same information for screen readers. */
function TouchStrip({ section }: { section: CoverageSection }) {
  const touched = new Set(section.touchedVerseIds);
  return (
    <div className="flex flex-wrap gap-1" aria-hidden data-testid="coverage-strip">
      {section.verseIds.map((vid) => {
        const isTouched = touched.has(vid);
        return (
          <span
            key={vid}
            title={`${verseRefLabel(vid)} — ${isTouched ? 'a question touches this' : 'untouched'}`}
            data-touched={isTouched || undefined}
            className={cn(
              'h-2.5 w-2.5 rounded-full border',
              isTouched
                ? 'border-primary bg-primary'
                : 'border-muted-foreground/40 bg-transparent',
            )}
          />
        );
      })}
    </div>
  );
}

function CoverageCard({
  study,
  onTag,
}: {
  study: Study;
  onTag: (sectionId: string, tag: CoverageTag) => void;
}) {
  const cov = coverageMap(study);
  const untouchedCount = cov.untouchedSections.length;
  const untaggedCount = cov.untaggedUntouched.length;
  const taggedCount = untouchedCount - untaggedCount;

  return (
    <div className="space-y-3" data-testid="coverage-card">
      <Help helpKey="p7.coverage" />
      {!cov.hasSections ? (
        <p className="text-sm text-muted-foreground">
          Divide the passage into sections in{' '}
          <Link to={`/study/${study.id}/3`} className="underline underline-offset-2">
            Phase 3
          </Link>{' '}
          to see the coverage map.
        </p>
      ) : (
        <>
          {untouchedCount > 0 && (
            <p className="text-xs font-medium" data-testid="coverage-progress">
              {untaggedCount === 0 ? (
                <span className="text-success">
                  All {untouchedCount} untouched section{untouchedCount === 1 ? '' : 's'} tagged.
                </span>
              ) : (
                <span className="text-warning">
                  {taggedCount} of {untouchedCount} untouched sections tagged — {untaggedCount} to
                  go.
                </span>
              )}
            </p>
          )}
          <ul className="space-y-2" data-testid="coverage-list">
            {cov.sections.map((s) => {
              const untouched = s.isUntouched;
              return (
                <li
                  key={s.id}
                  data-testid="coverage-row"
                  data-section-id={s.id}
                  data-untouched={untouched || undefined}
                  data-tag={s.tag ?? undefined}
                  className={cn(
                    'space-y-2 rounded-md border p-3',
                    untouched && !s.tag
                      ? 'border-warning/50 bg-warning/10'
                      : 'border-border bg-card',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {rangeLabel(s)} ·{' '}
                        {untouched
                          ? 'no question touches this'
                          : s.untouchedVerseIds.length === 0
                            ? 'every verse has a question'
                            : `${s.touchedVerseIds.length} of ${s.verseIds.length} verses touched`}
                      </p>
                    </div>
                    {untouched && (
                      <div className="flex gap-1" role="group" aria-label={`Tag ${s.name}`}>
                        {COVERAGE_TAGS.map((t) => {
                          const active = s.tag === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              aria-pressed={active}
                              data-testid={`coverage-tag-${s.id}-${t}`}
                              onClick={() => onTag(s.id, t)}
                              className={cn(
                                'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                                active
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border text-foreground hover:bg-accent',
                              )}
                            >
                              {COVERAGE_TAG_LABELS[t]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <TouchStrip section={s} />

                  {untouched && s.tag && (
                    <p className="text-xs text-success" data-testid={`coverage-tagged-${s.id}`}>
                      ✓ Tagged as {COVERAGE_TAG_LABELS[s.tag].toLowerCase()} — click again to clear.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One audit check row
// ---------------------------------------------------------------------------

function CheckRow({
  result,
  acked,
  onAck,
  children,
}: {
  result: AuditItemResult;
  acked: boolean;
  onAck: (val: boolean) => void;
  children?: React.ReactNode;
}) {
  const meta = auditCheckById(result.id);
  const label = meta?.label ?? result.id;
  const showAck = result.status === 'unmet';

  return (
    <li
      data-testid="audit-item"
      data-check-id={result.id}
      data-status={result.status}
      data-acked={acked || undefined}
      className="rounded-lg border border-border bg-card p-3"
    >
      <div className="flex items-start gap-3">
        <StatusIcon status={result.status} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium">
            {label}
            {result.id === 'gospel-plain' && result.applies && (
              <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[0.7rem] font-semibold text-warning">
                required for this group
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground" data-testid="audit-summary">
            {result.summary}
          </p>
          {meta?.help && <p className="text-xs text-muted-foreground">{meta.help}</p>}
          {result.id === 'gospel-plain' && result.applies && <Help helpKey="p7.gospel-plain" />}
          {children}
          {showAck && (
            <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={acked}
                onChange={(e) => onAck(e.target.checked)}
                data-testid={`audit-ack-${result.id}`}
                className="size-3.5 accent-primary"
              />
              <span className={cn(acked ? 'text-muted-foreground line-through' : 'text-foreground')}>
                Reviewed — dismiss this
              </span>
            </label>
          )}
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Phase7Audit() {
  const { id = '' } = useParams();
  const { study, loading } = useOpenStudy(id);
  const applyToCurrent = useStudyStore((s) => s.applyToCurrent);

  if (!study) return <StudyNotFound loading={loading} />;

  const setAck = (checkId: string, val: boolean) =>
    applyToCurrent((s) => ({
      ...s,
      audit: { ...s.audit, acks: { ...s.audit.acks, [checkId]: val } },
    }));

  const setCoverageTag = (sectionId: string, tag: CoverageTag) =>
    applyToCurrent((s) => {
      const coverageTags = { ...s.audit.coverageTags };
      if (coverageTags[sectionId] === tag) delete coverageTags[sectionId];
      else coverageTags[sectionId] = tag;
      return { ...s, audit: { ...s.audit, coverageTags } };
    });

  const results = auditResults(study);
  const acks = study.audit.acks;
  const met = results.filter((r) => r.status === 'met').length;
  const needAttention = results.filter((r) => r.status === 'unmet' && !acks[r.id]).length;
  const acknowledged = results.filter((r) => r.status === 'unmet' && acks[r.id]).length;

  return (
    <div className="space-y-8">
      <StudyHeader study={study} />

      <div>
        <h2 className="text-lg font-semibold">Phase 7 — Check &amp; export</h2>
        <p className="text-sm text-muted-foreground">
          A last read-through, then your two documents. Nothing here blocks the export.
        </p>
      </div>

      <Help helpKey="p7.audit.intro" />

      {/* Summary */}
      <div
        data-testid="audit-summary-bar"
        className="flex flex-wrap gap-4 rounded-lg border border-border bg-muted/30 p-3 text-sm"
      >
        <span>
          <span className="font-semibold text-success">{met}</span> met
        </span>
        <span>
          <span className={cn('font-semibold', needAttention > 0 ? 'text-warning' : 'text-foreground')}>
            {needAttention}
          </span>{' '}
          need a look
        </span>
        <span>
          <span className="font-semibold text-muted-foreground">{acknowledged}</span> acknowledged
        </span>
      </div>

      {/* The checklist */}
      <ul className="space-y-2" data-testid="audit-list">
        {results.map((r) => (
          <CheckRow key={r.id} result={r} acked={Boolean(acks[r.id])} onAck={(v) => setAck(r.id, v)}>
            {r.id === 'coverage' && <CoverageCard study={study} onTag={setCoverageTag} />}
          </CheckRow>
        ))}
      </ul>

      {/* Exports — three artefacts */}
      <section className="space-y-4" data-testid="export-section">
        <div>
          <h3 className="text-base font-semibold">Export</h3>
          <p className="text-sm text-muted-foreground">
            Two documents plus a re-importable project file. Print to save a PDF.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <p className="font-medium">Participant handout</p>
            <Help helpKey="p7.export.handout" />
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" data-testid="print-handout">
                <Link to={`/print/${study.id}/handout`}>
                  <Printer aria-hidden /> Print / PDF
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void downloadHandoutMarkdown(study)}
                data-testid="download-handout-md"
              >
                <Download aria-hidden /> Markdown
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <p className="font-medium">Leader's notes</p>
            <Help helpKey="p7.export.leader" />
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" data-testid="print-leader">
                <Link to={`/print/${study.id}/leader`}>
                  <Printer aria-hidden /> Print / PDF
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void downloadLeaderMarkdown(study)}
                data-testid="download-leader-md"
              >
                <Download aria-hidden /> Markdown
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
          <p className="font-medium">Project file</p>
          <Help helpKey="p7.export.project" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => void downloadProjectFile(study)}
            data-testid="export-project"
          >
            <FileText aria-hidden /> Export project file
          </Button>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to={`/study/${study.id}/6`}>← Back to build the questions</Link>
        </Button>
      </div>
    </div>
  );
}
