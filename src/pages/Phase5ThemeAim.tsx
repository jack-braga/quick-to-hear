import { useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Help } from '@/components/Help';
import { StudyHeader } from '@/components/StudyHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import { litmusThemeTests, stuckHelpers, trapsContent } from '@/lib/content';
import { cn } from '@/lib/utils';
import { useStudyStore } from '@/store/study';
import type { Study, ThemeAim } from '@/types/study';
import { StudyNotFound } from '@/pages/StudyNotFound';

/** A labelled field: title + frame hint + inline help + a growing textarea. The frame
 *  hint is the SPEC's fill-in-the-blank stem — guidance, never a pre-written answer. */
function AimField({
  id,
  label,
  frame,
  helpKey,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  frame?: string;
  /** Omit for sub-fields whose guidance is carried by a shared block above them. */
  helpKey?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {frame && (
          <p className="mt-0.5 font-serif text-sm italic text-muted-foreground">{frame}</p>
        )}
      </div>
      {helpKey && <Help helpKey={helpKey} />}
      <Textarea
        id={id}
        data-testid={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-20 font-serif"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// "Feeling stuck?" — the five helpers, on demand (SPEC: available, not forced)
// ---------------------------------------------------------------------------

function StuckHelpers() {
  const [open, setOpen] = useState(false);
  const helpers = stuckHelpers();
  if (helpers.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-testid="stuck-toggle"
        className="flex w-full items-center gap-2 text-left text-sm font-medium"
      >
        <Lightbulb aria-hidden className="size-4 text-primary" />
        <span className="flex-1">Feeling stuck? Five ways in</span>
        <ChevronDown
          aria-hidden
          className={cn('size-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <ol data-testid="stuck-list" className="mt-3 space-y-3">
          {helpers.map((h, i) => (
            <li key={h.id} className="flex gap-3 text-sm">
              <span
                aria-hidden
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
              >
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-foreground">{h.name}</p>
                <p className="text-muted-foreground">{h.text}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The Christ & gospel test — the route sentence + the four traps as checks
// ---------------------------------------------------------------------------

function ChristAndGospel({
  study,
  setThemeAim,
  toggleTrap,
}: {
  study: Study;
  setThemeAim: (patch: Partial<ThemeAim>) => void;
  toggleTrap: (id: string, on: boolean) => void;
}) {
  const traps = trapsContent();
  const acks = study.themeAim.trapAcks;

  return (
    <section data-testid="christ-and-gospel" className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">The Christ &amp; gospel test</h3>
        <p className="text-sm text-muted-foreground">
          A distinct step, not folded into the theme. Trace the route rather than jumping
          straight there.
        </p>
      </div>

      <AimField
        id="p5-christ-route"
        label="How this passage gets to Christ"
        frame="text → its place in the covenant story → its fulfilment in Christ → us, who are in him"
        helpKey="p5.christ-route"
        placeholder="In one sentence, how does this passage get to Christ?"
        value={study.themeAim.christRoute}
        onChange={(v) => setThemeAim({ christRoute: v })}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium">Check your route against the four traps</p>
        <ul className="space-y-2" data-testid="traps-list">
          {traps.items.map((trap) => {
            const on = acks[trap.id] ?? false;
            return (
              <li
                key={trap.id}
                data-testid={`trap-${trap.id}`}
                data-acked={on || undefined}
                className="rounded-md border border-border bg-card p-3"
              >
                <label className="flex cursor-pointer gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => toggleTrap(trap.id, e.target.checked)}
                    data-testid={`trap-ack-${trap.id}`}
                    className="mt-1 size-4 shrink-0 accent-primary"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{trap.name}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Looks like: </span>
                      {trap.looksLike}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Check: </span>
                      {trap.check}
                    </p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Attribution — the trap concepts follow Goldsworthy; the credit is stored in the
          data (traps.yaml) so it can't drift and must render wherever traps appear. */}
      <p
        data-testid="traps-attribution"
        className="rounded-md border-l-2 border-primary/40 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
      >
        {traps.attribution}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// "Before you move on" — the five litmus tests, acknowledged on exit (soft)
// ---------------------------------------------------------------------------

function LitmusReview({
  study,
  toggleLitmus,
}: {
  study: Study;
  toggleLitmus: (id: string, on: boolean) => void;
}) {
  const tests = litmusThemeTests();
  const acks = study.themeAim.litmusAcks;
  const ackedCount = tests.filter((t) => acks[t.id]).length;
  // Reveal automatically once the user has begun acknowledging, so the review survives a
  // reload and stays visible as they head for the exit.
  const [open, setOpen] = useState(ackedCount > 0);
  if (tests.length === 0) return null;

  return (
    <section
      data-testid="litmus-review"
      className="space-y-3 rounded-lg border border-border bg-muted/20 p-4"
    >
      <div>
        <h3 className="text-base font-semibold">Before you move on — the litmus tests</h3>
        <p className="text-sm text-muted-foreground">
          Hold your theme and aim against each of these. Acknowledging them is a nudge, not a
          gate — you can move on either way, and come back.
        </p>
      </div>

      {!open ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          data-testid="litmus-review-toggle"
        >
          Review the litmus tests →
        </Button>
      ) : (
        <>
          <ul className="space-y-2" data-testid="litmus-list">
            {tests.map((t) => {
              const on = acks[t.id] ?? false;
              return (
                <li
                  key={t.id}
                  data-testid={`litmus-${t.id}`}
                  data-acked={on || undefined}
                  className="rounded-md border border-border bg-card p-3"
                >
                  <label className="flex cursor-pointer gap-3">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => toggleLitmus(t.id, e.target.checked)}
                      data-testid={`litmus-ack-${t.id}`}
                      className="mt-1 size-4 shrink-0 accent-primary"
                    />
                    <span className="text-sm text-foreground">{t.text}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground" data-testid="litmus-count">
            {ackedCount} of {tests.length} acknowledged
          </p>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Phase5ThemeAim() {
  const { id = '' } = useParams();
  const { study, loading } = useOpenStudy(id);
  const applyToCurrent = useStudyStore((s) => s.applyToCurrent);

  if (!study) return <StudyNotFound loading={loading} />;

  const setThemeAim = (patch: Partial<ThemeAim>) =>
    applyToCurrent((s) => ({ ...s, themeAim: { ...s.themeAim, ...patch } }));

  const toggleTrap = (trapId: string, on: boolean) =>
    applyToCurrent((s) => ({
      ...s,
      themeAim: { ...s.themeAim, trapAcks: { ...s.themeAim.trapAcks, [trapId]: on } },
    }));

  const toggleLitmus = (testId: string, on: boolean) =>
    applyToCurrent((s) => ({
      ...s,
      themeAim: { ...s.themeAim, litmusAcks: { ...s.themeAim.litmusAcks, [testId]: on } },
    }));

  const ta = study.themeAim;

  return (
    <div className="space-y-8">
      <StudyHeader study={study} />

      <div>
        <h2 className="text-lg font-semibold">Phase 5 — Theme &amp; aim</h2>
        <p className="text-sm text-muted-foreground">
          The hinge of the whole method. Two sentences: what the passage says, and what its
          author wanted to happen.
        </p>
      </div>

      {/* Faithfulness ≠ certainty — the single most important reassurance (SPEC §5); it
          frames the whole phase, so it leads. */}
      <div
        data-testid="faithfulness"
        className="rounded-lg border-l-4 border-primary/60 bg-primary/5 p-4"
      >
        <Help helpKey="p5.faithfulness" />
      </div>

      {!study.passage.primary && (
        <p className="text-xs text-warning">
          No passage loaded —{' '}
          <Link to={`/study/${study.id}/1`} className="underline underline-offset-2">
            set it up in Phase 1
          </Link>{' '}
          and read it first; theme and aim come out of the text.
        </p>
      )}

      {/* Theme + author's aim — the two-sentence core */}
      <section className="space-y-6">
        <AimField
          id="p5-theme"
          label="Theme — what the passage says"
          frame="In this passage, [author] shows that ___."
          helpKey="p5.theme"
          placeholder="In this passage, [author] shows that…"
          value={ta.theme}
          onChange={(v) => setThemeAim({ theme: v })}
        />
        <AimField
          id="p5-author-aim"
          label="The author's aim — what he wanted to happen"
          frame="He wrote it so that his readers would ___."
          helpKey="p5.author-aim"
          placeholder="He wrote it so that his readers would…"
          value={ta.authorAim}
          onChange={(v) => setThemeAim({ authorAim: v })}
        />
        <StuckHelpers />
      </section>

      {/* The group aim — must flow out of the author's aim */}
      <AimField
        id="p5-group-aim"
        label="Your aim for the group"
        frame="Given what he wanted his first readers to become, what do you want for the people in the room?"
        helpKey="p5.group-aim"
        placeholder="For this group, I want them to…"
        value={ta.groupAim}
        onChange={(v) => setThemeAim({ groupAim: v })}
      />

      {/* know / feel / do — the filter for every Phase 6 application question */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Break the aim into know / feel / do</h3>
          <Help helpKey="p5.know-feel-do" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <AimField
            id="p5-know"
            label="Know"
            placeholder="The truth the passage presses…"
            value={ta.know}
            onChange={(v) => setThemeAim({ know: v })}
          />
          <AimField
            id="p5-feel"
            label="Feel"
            placeholder="The response it seeks…"
            value={ta.feel}
            onChange={(v) => setThemeAim({ feel: v })}
          />
          <AimField
            id="p5-do"
            label="Do"
            placeholder="The concrete change…"
            value={ta.doField}
            onChange={(v) => setThemeAim({ doField: v })}
          />
        </div>
      </section>

      <ChristAndGospel study={study} setThemeAim={setThemeAim} toggleTrap={toggleTrap} />

      <LitmusReview study={study} toggleLitmus={toggleLitmus} />

      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to={`/study/${study.id}/4`}>← Back to COMA</Link>
        </Button>
        <Button asChild>
          <Link to={`/study/${study.id}/6`}>Next: Build the questions →</Link>
        </Button>
      </div>
    </div>
  );
}
