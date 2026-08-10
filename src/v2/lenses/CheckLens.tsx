import { Link } from 'react-router-dom';

import { findTranslation } from '@/lib/bible';
import { primaryText } from '@/lib/passage';
import type { Study } from '@/types/study';
import { isQuestionReady } from '@/v2/annotations';
import { orderedQuestions } from '@/v2/build';
import { downloadV2Handout, downloadV2Leader } from '@/v2/export';

/**
 * The Check lens (v2.7) — the export hub. It reviews the study at a glance, then produces the two
 * documents: a **participant handout** (defined by exclusion — no answers) and the **leader's
 * notes** (everything). Both reuse the v1 export pipeline via `projectForExport`. Coverage/audit
 * (the SPEC Phase-7 checks) and Theme & aim / intro / prayer come with their own lenses.
 */
export function CheckLens({ study }: { study: Study }) {
  const passage = primaryText(study.passage);
  const questions = orderedQuestions(study.annotations, study.runningOrder);
  const ready = questions.filter(isQuestionReady).length;
  const needs = questions.length - ready;
  const sections = study.map.sections.length;
  const tr = passage ? findTranslation(passage.translationId) : undefined;

  const stat = (n: number | string, label: string) => (
    <div className="rounded-lg border border-line bg-panel/50 px-3 py-2">
      <div className="font-scripture text-[22px] text-ink">{n}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">{label}</div>
    </div>
  );

  const canExport = questions.length > 0;

  return (
    <article className="mx-auto w-full max-w-[44rem] rounded-leaf border border-line bg-leaf px-[clamp(24px,5vw,52px)] py-10 shadow-leaf">
      <h1 className="font-scripture text-[26px] leading-tight text-ink">Check &amp; export</h1>
      <p className="mt-1 text-[14px] text-ink-soft">
        Review the study, then produce the two documents — a clean participant handout and the
        leader’s notes.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stat(questions.length, 'questions')}
        {stat(ready, 'ready')}
        {stat(sections, 'sections')}
        {stat(tr?.shortName ?? '—', 'translation')}
      </div>

      {needs > 0 && (
        <p className="mt-4 rounded-lg border border-[#b98a1e]/50 bg-[rgba(185,138,30,0.08)] px-3 py-2 text-[13px] text-ink-soft">
          {needs} question{needs === 1 ? '' : 's'} still {needs === 1 ? 'needs' : 'need'} an expected
          answer (SPEC 6e). The handout leaves answers out, but the leader’s notes will show the gap.
        </p>
      )}

      <div className="mt-8 space-y-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Produce</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <PrintLink to={`/print/${study.id}/handout`} title="Participant handout" sub="Passage, questions, support — no answers." disabled={!canExport} />
          <PrintLink to={`/print/${study.id}/leader`} title="Leader’s notes" sub="Everything, including expected answers." disabled={!canExport} />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
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
          <p className="text-[13px] text-ink-faint">
            Add at least one question (Map → select verses → Question) to export.
          </p>
        )}
      </div>

      <p className="mt-8 border-t border-line pt-4 text-[12px] text-ink-faint">
        Theme &amp; aim, an introduction, and the prayer point join the documents once those lenses
        land; coverage checks arrive with the audit.
      </p>
    </article>
  );
}

function PrintLink({
  to,
  title,
  sub,
  disabled,
}: {
  to: string;
  title: string;
  sub: string;
  disabled: boolean;
}) {
  const body = (
    <>
      <div className="font-sans text-[15px] font-medium text-ink">{title} →</div>
      <div className="mt-0.5 text-[12px] text-ink-soft">{sub}</div>
    </>
  );
  if (disabled) {
    return <div className="cursor-not-allowed rounded-lg border border-line bg-panel/40 p-3 opacity-50">{body}</div>;
  }
  return (
    <Link to={to} className="block rounded-lg border border-line bg-panel/40 p-3 transition-colors hover:border-lapis-edge">
      {body}
    </Link>
  );
}
