import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { useStudyStore } from '@/store/study';
import type { Study, ThemeAim } from '@/types/study';
import { Help } from '@/v2/Help';

/**
 * The Theme & aim lens (v2.6, reworked to the **structured spine** — owner decision #4). It lives in
 * the right panel beside the centered passage (the theme also shows as a quiet band over the passage,
 * see {@link ThemeBand}). Rather than a stack of independent fields, the parts are drawn as one
 * connected flow — theme → author's aim → group aim → know/feel/do → Christ → prayer — with
 * connectors that name the relationship, so the *spine* is visible. Every field stays editable and
 * writes straight to the store; these already flow into the leader's notes (`leaderModel` reads
 * `study.themeAim`) and the prayer point lands on both documents via `projectForExport`. The tool
 * prompts and frames — it never writes the content (Inviolable rule 1).
 */
const LABEL = 'flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-faint';
const AREA =
  'mt-1 w-full resize-none rounded-lg border border-line bg-leaf px-2.5 py-1.5 font-scripture text-[13.5px] leading-[1.5] text-ink outline-none placeholder:font-sans placeholder:text-[12px] placeholder:not-italic placeholder:text-ink-faint focus:border-lapis-edge';

function grow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.max(el.scrollHeight, 38)}px`;
}

function Field({
  id,
  label,
  helpKey,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  helpKey?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className={LABEL}>
        <label htmlFor={id}>{label}</label>
        {helpKey && <Help helpKey={helpKey} label={label} />}
      </div>
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

/** A node on the spine — a coloured dot on the vertical line marks its kind (lapis = the claim,
 *  moss = an aim, amber = prayer). */
function Node({ dot, children }: { dot: 'lapis' | 'aim' | 'prayer'; children: ReactNode }) {
  const ring = dot === 'aim' ? 'border-moss-edge' : dot === 'prayer' ? 'border-amber-edge' : 'border-lapis-edge';
  return (
    <div className="relative mb-3.5">
      <span
        aria-hidden
        className={cn('absolute -left-[17px] top-[3px] size-[9px] rounded-full border-2 bg-leaf', ring)}
      />
      {children}
    </div>
  );
}

/** The arrow between two nodes — names how one hangs off the last (the point of the spine). */
function Connector({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2.5 -mt-1 ml-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint">
      ↓ {children}
    </div>
  );
}

/** The quiet "Theme of the study" band rendered inside the passage leaf (via ReaderCanvas's `banner`),
 *  so the spine's headline claim stays in view while you read. */
export function ThemeBand({ theme }: { theme: string }) {
  return (
    <div className="mb-5 rounded-lg border-l-[3px] border-moss-edge bg-moss-wash px-3.5 py-2.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-moss-ink">Theme of the study</div>
      <p
        className={cn(
          'mt-1 font-scripture text-[15px] leading-snug',
          theme ? 'italic text-ink' : 'text-ink-faint',
        )}
      >
        {theme || 'Not written yet — capture it in the spine on the right.'}
      </p>
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
    <div>
      <div className="mx-1 mb-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        Theme &amp; aim — the spine
        <Help helpKey="p5.faithfulness" label="Faithfulness is not certainty" />
      </div>

      {/* the connected flow — a vertical line threads the nodes */}
      <div className="relative pl-[18px]">
        <div aria-hidden className="absolute bottom-6 left-[4px] top-2 w-px bg-line" />

        <Node dot="lapis">
          <Field
            id="v2-theme"
            label="Theme — what the passage says"
            helpKey="p5.theme"
            placeholder="In this passage, [author] shows that…"
            value={ta.theme}
            onChange={(v) => setThemeAim({ theme: v })}
          />
        </Node>
        <Connector>so the author aimed to…</Connector>

        <Node dot="aim">
          <Field
            id="v2-author-aim"
            label="The author's aim — what he wanted to happen"
            helpKey="p5.author-aim"
            placeholder="He wrote it so that his readers would…"
            value={ta.authorAim}
            onChange={(v) => setThemeAim({ authorAim: v })}
          />
        </Node>
        <Connector>for this group, that becomes…</Connector>

        <Node dot="aim">
          <Field
            id="v2-group-aim"
            label="Your aim for the group"
            helpKey="p5.group-aim"
            placeholder="For this group, I want them to…"
            value={ta.groupAim}
            onChange={(v) => setThemeAim({ groupAim: v })}
          />
          {/* the aim breaks into know · feel · do — nested under it, stacked to stay typable in the
              narrow panel */}
          <div className="mt-2.5 space-y-2 rounded-lg border border-line/70 bg-panel/40 p-2">
            <div className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-faint">
              Break the aim into know · feel · do
              <Help helpKey="p5.know-feel-do" label="Know, feel, do" />
            </div>
            <Field id="v2-know" label="Know" placeholder="The truth it presses…" value={ta.know} onChange={(v) => setThemeAim({ know: v })} />
            <Field id="v2-feel" label="Feel" placeholder="The response it seeks…" value={ta.feel} onChange={(v) => setThemeAim({ feel: v })} />
            <Field id="v2-do" label="Do" placeholder="The concrete change…" value={ta.doField} onChange={(v) => setThemeAim({ doField: v })} />
          </div>
        </Node>
        <Connector>and it reaches Christ by…</Connector>

        <Node dot="lapis">
          <Field
            id="v2-christ"
            label="How this passage gets to Christ"
            helpKey="p5.christ-route"
            placeholder="This passage points to Christ by… (the honest route, not a bolted-on “Jesus bit”)"
            value={ta.christRoute}
            onChange={(v) => setThemeAim({ christRoute: v })}
          />
        </Node>

        <Node dot="prayer">
          <Field
            id="v2-prayer"
            label="Prayer point — printed on both documents"
            helpKey="p6h.prayer"
            placeholder="Pray that we would… (drawn from the passage)"
            value={study.prayerPoint}
            onChange={setPrayer}
          />
        </Node>
      </div>
    </div>
  );
}
