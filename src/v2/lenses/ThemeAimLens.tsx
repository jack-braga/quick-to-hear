import { useStudyStore } from '@/store/study';
import type { Study, ThemeAim } from '@/types/study';
import { Help } from '@/v2/Help';

/**
 * The Theme & aim lens (v2.6) — the study's spine (SPEC Phase 5). It captures the theme, the
 * author's aim, your aim for the group, the know/feel/do breakdown, the route to Christ, and a
 * prayer point. These already flow into the leader's notes (`leaderModel` reads `study.themeAim`);
 * the prayer point lands on both documents via `projectForExport`. The tool prompts and frames —
 * it never writes the content (Inviolable rule 1).
 */
const LABEL = 'block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint';
const AREA =
  'w-full resize-none rounded-lg border border-line bg-panel px-3 py-2 font-sans text-[14px] leading-snug text-ink outline-none placeholder:text-ink-faint focus:border-lapis-edge';

function grow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
}

function Field({
  id,
  label,
  helpKey,
  hint,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  helpKey?: string;
  hint?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        {helpKey && <Help helpKey={helpKey} label={label} />}
      </div>
      {hint && <p className="text-[12px] text-ink-soft">{hint}</p>}
      <textarea
        id={id}
        ref={grow}
        rows={2}
        className={AREA}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          grow(e.currentTarget);
        }}
      />
    </div>
  );
}

export function ThemeAimLens({ study }: { study: Study }) {
  const applyToCurrent = useStudyStore((s) => s.applyToCurrent);
  const ta = study.themeAim;
  const setThemeAim = (patch: Partial<ThemeAim>) =>
    applyToCurrent((s) => ({ ...s, themeAim: { ...s.themeAim, ...patch } }));
  const setPrayer = (v: string) => applyToCurrent((s) => ({ ...s, prayerPoint: v }));

  return (
    <article className="mx-auto w-full max-w-[44rem] rounded-leaf border border-line bg-leaf px-[clamp(24px,5vw,52px)] py-10 shadow-leaf">
      <div className="flex items-center gap-2">
        <h1 className="font-scripture text-[26px] leading-tight text-ink">Theme &amp; aim</h1>
        <Help helpKey="p5.faithfulness" label="Faithfulness is not certainty" />
      </div>
      <p className="mt-1 text-[14px] text-ink-soft">
        The spine of the study — say what the passage says, what its author wanted, and what you
        want for this group. Every question should serve these. It’s your wording, not the tool’s.
      </p>

      <div className="mt-8 space-y-6">
        <Field
          id="v2-theme"
          label="Theme — what the passage says"
          helpKey="p5.theme"
          placeholder="In this passage, [author] shows that…"
          value={ta.theme}
          onChange={(v) => setThemeAim({ theme: v })}
        />
        <Field
          id="v2-author-aim"
          label="The author's aim — what he wanted to happen"
          helpKey="p5.author-aim"
          placeholder="He wrote it so that his readers would…"
          value={ta.authorAim}
          onChange={(v) => setThemeAim({ authorAim: v })}
        />
        <Field
          id="v2-group-aim"
          label="Your aim for the group"
          helpKey="p5.group-aim"
          placeholder="For this group, I want them to…"
          value={ta.groupAim}
          onChange={(v) => setThemeAim({ groupAim: v })}
        />

        <div className="space-y-3 border-t border-line pt-6">
          <div className="flex items-center gap-1.5">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Break the aim into know · feel · do
            </div>
            <Help helpKey="p5.know-feel-do" label="Know, feel, do" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="v2-know" label="Know" placeholder="The truth it presses…" value={ta.know} onChange={(v) => setThemeAim({ know: v })} />
            <Field id="v2-feel" label="Feel" placeholder="The response it seeks…" value={ta.feel} onChange={(v) => setThemeAim({ feel: v })} />
            <Field id="v2-do" label="Do" placeholder="The concrete change…" value={ta.doField} onChange={(v) => setThemeAim({ doField: v })} />
          </div>
        </div>

        <Field
          id="v2-christ"
          label="How this passage gets to Christ"
          helpKey="p5.christ-route"
          hint="In one sentence — the honest route, not a bolted-on “Jesus bit”."
          placeholder="This passage points to Christ by…"
          value={ta.christRoute}
          onChange={(v) => setThemeAim({ christRoute: v })}
        />
        <Field
          id="v2-prayer"
          label="Prayer point"
          helpKey="p6h.prayer"
          hint="Drawn from the passage — printed on both documents."
          placeholder="Pray that we would…"
          value={study.prayerPoint}
          onChange={setPrayer}
        />
      </div>
    </article>
  );
}
