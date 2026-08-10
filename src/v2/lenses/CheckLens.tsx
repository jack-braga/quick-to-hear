import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { findTranslation } from '@/lib/bible';
import { auditResults, COVERAGE_TAG_LABELS, coverageMap, type AuditCheckId } from '@/lib/audit';
import { primaryText } from '@/lib/passage';
import { cn } from '@/lib/utils';
import { useStudyStore } from '@/store/study';
import type { CoverageTag, Study } from '@/types/study';
import { Help } from '@/v2/Help';
import { isQuestionReady } from '@/v2/annotations';
import { orderedQuestions } from '@/v2/build';
import { downloadV2Handout, downloadV2Leader, projectForExport } from '@/v2/export';

/**
 * The Check lens (v2.7) — review, then export. It runs the tested v1 audit (`auditResults` +
 * `coverageMap`) on the **projected** study, so every SPEC-7 check computes from the v2 study;
 * nothing blocks (Inviolable rule 3) — a check is only met / needs-a-look / n-a, and export is
 * always available. Then it produces the two documents (handout defined by exclusion; leader has
 * everything) via `projectForExport`, reusing the v1 pipeline.
 */
const CHECK_LABELS: Record<AuditCheckId, string> = {
  'serves-theme-aim': 'Serves the theme & aim',
  'expected-answer': 'Every question has an expected answer',
  coverage: 'Coverage of the passage',
  'type-balance': 'Type balance (observation · meaning · application)',
  'meaning-order': 'Meaning comes after observation',
  'application-last': 'Application comes last',
  'know-feel-do': 'Covers know · feel · do',
  'time-vs-length': 'Time fits the session',
  'two-load-bearing': 'At least two load-bearing questions',
  'gospel-plain': 'Makes the gospel plain',
  'prayer-point': 'A prayer point',
};

const TAGS: CoverageTag[] = ['connective', 'deferred', 'needs-question'];

export function CheckLens({ study }: { study: Study }) {
  const applyToCurrent = useStudyStore((s) => s.applyToCurrent);
  const passage = primaryText(study.passage);
  const projected = useMemo(() => projectForExport(study), [study]);
  const audit = useMemo(() => auditResults(projected), [projected]);
  const coverage = useMemo(() => coverageMap(projected), [projected]);

  const questions = orderedQuestions(study.annotations, study.runningOrder);
  const ready = questions.filter(isQuestionReady).length;
  const tr = passage ? findTranslation(passage.translationId) : undefined;
  const canExport = questions.length > 0;

  const applicable = audit.filter((r) => r.applies);
  const metCount = applicable.filter((r) => r.status === 'met').length;
  const lookCount = applicable.filter((r) => r.status === 'unmet').length;

  const setTag = (sectionId: string, tag: CoverageTag) =>
    applyToCurrent((s) => ({
      ...s,
      audit: { ...s.audit, coverageTags: { ...s.audit.coverageTags, [sectionId]: tag } },
    }));

  const stat = (n: number | string, label: string) => (
    <div className="rounded-lg border border-line bg-panel/50 px-3 py-2">
      <div className="font-scripture text-[22px] text-ink">{n}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">{label}</div>
    </div>
  );

  return (
    <article className="mx-auto w-full max-w-[44rem] rounded-leaf border border-line bg-leaf px-[clamp(24px,5vw,52px)] py-10 shadow-leaf">
      <div className="flex items-center gap-2">
        <h1 className="font-scripture text-[26px] leading-tight text-ink">Check &amp; export</h1>
        <Help helpKey="p7.audit.intro" label="The checks" />
      </div>
      <p className="mt-1 text-[14px] text-ink-soft">
        Review the study against the checks, then produce the two documents. Nothing here blocks
        export — the checks are a nudge, not a gate.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stat(questions.length, 'questions')}
        {stat(ready, 'ready')}
        {stat(study.map.sections.length, 'sections')}
        {stat(tr?.shortName ?? '—', 'translation')}
      </div>

      {/* Coverage */}
      <div className="mt-8">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Coverage</span>
          <Help helpKey="p7.coverage" label="Coverage" />
        </div>
        {!coverage.hasSections ? (
          <p className="text-[13px] text-ink-soft">Divide the passage into sections (Map) to map coverage.</p>
        ) : (
          <ul className="space-y-1.5">
            {coverage.sections.map((sec) => (
              <li key={sec.id} className="flex items-center gap-2 rounded-lg border border-line bg-panel/40 px-3 py-1.5 text-[13px]">
                <span className={cn('size-2 rounded-full', sec.isUntouched ? 'bg-[#b98a1e]' : 'bg-lapis')} />
                <span className="truncate text-ink">{sec.name}</span>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-faint">
                  {sec.touchedVerseIds.length}/{sec.verseIds.length} touched
                </span>
                {sec.isUntouched && (
                  <select
                    aria-label={`Tag ${sec.name}`}
                    className="h-7 shrink-0 rounded-md border border-line bg-leaf px-1.5 font-sans text-[12px] text-ink outline-none focus:border-lapis-edge"
                    value={sec.tag ?? ''}
                    onChange={(e) => e.target.value && setTag(sec.id, e.target.value as CoverageTag)}
                  >
                    <option value="">Tag…</option>
                    {TAGS.map((t) => (
                      <option key={t} value={t}>
                        {COVERAGE_TAG_LABELS[t]}
                      </option>
                    ))}
                  </select>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Checklist */}
      <div className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Checks</span>
          <span className="font-mono text-[11px] text-ink-faint">
            {metCount} met · {lookCount} need a look
          </span>
        </div>
        <ul className="space-y-1">
          {applicable.map((r) => (
            <li key={r.id} className="flex items-start gap-2.5 rounded-md px-2 py-1.5">
              <span
                className={cn(
                  'mt-0.5 shrink-0 font-mono text-[13px]',
                  r.status === 'met' ? 'text-lapis' : r.status === 'unmet' ? 'text-[#b98a1e]' : 'text-ink-faint',
                )}
                aria-hidden
              >
                {r.status === 'met' ? '✓' : r.status === 'unmet' ? '•' : '—'}
              </span>
              <div className="min-w-0">
                <div className="text-[13.5px] text-ink">{CHECK_LABELS[r.id]}</div>
                <div className="text-[12px] text-ink-soft">{r.summary}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Produce */}
      <div className="mt-8 border-t border-line pt-6">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Produce</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <PrintLink to={`/print/${study.id}/handout`} title="Participant handout" sub="Passage, questions, support — no answers." disabled={!canExport} />
          <PrintLink to={`/print/${study.id}/leader`} title="Leader’s notes" sub="Everything, including expected answers." disabled={!canExport} />
        </div>
        <div className="flex flex-wrap gap-2 pt-3">
          <button
            type="button"
            disabled={!canExport}
            onClick={() => void downloadV2Handout(study)}
            className="rounded-lg border border-line bg-panel px-3 py-1.5 font-sans text-[13px] text-ink hover:border-lapis-edge disabled:opacity-50"
          >
            Download handout (.md)
          </button>
          <button
            type="button"
            disabled={!canExport}
            onClick={() => void downloadV2Leader(study)}
            className="rounded-lg border border-line bg-panel px-3 py-1.5 font-sans text-[13px] text-ink hover:border-lapis-edge disabled:opacity-50"
          >
            Download leader’s notes (.md)
          </button>
        </div>
        {!canExport && (
          <p className="pt-2 text-[13px] text-ink-faint">Add at least one question (Map → select verses → Question) to export.</p>
        )}
      </div>
    </article>
  );
}

function PrintLink({ to, title, sub, disabled }: { to: string; title: string; sub: string; disabled: boolean }) {
  const body = (
    <>
      <div className="font-sans text-[15px] font-medium text-ink">{title} →</div>
      <div className="mt-0.5 text-[12px] text-ink-soft">{sub}</div>
    </>
  );
  if (disabled) return <div className="cursor-not-allowed rounded-lg border border-line bg-panel/40 p-3 opacity-50">{body}</div>;
  return (
    <Link to={to} className="block rounded-lg border border-line bg-panel/40 p-3 transition-colors hover:border-lapis-edge">
      {body}
    </Link>
  );
}
