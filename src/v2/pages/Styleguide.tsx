import { DayNightToggle } from '@/v2/DayNightToggle';

/**
 * A living styleguide (v2.1) for the "leaf on a desk" system — the tokens, the three type
 * roles (Scripture serif · mono tooling · system UI), the scale, and the signature
 * components. It renders from the SAME tokens the app uses, so it stays honest in day/night.
 */

const SWATCHES: { name: string; cls: string; ring?: boolean }[] = [
  { name: 'desk', cls: 'bg-desk' },
  { name: 'leaf', cls: 'bg-leaf' },
  { name: 'panel', cls: 'bg-panel' },
  { name: 'line', cls: 'bg-line' },
  { name: 'ink', cls: 'bg-ink' },
  { name: 'ink-soft', cls: 'bg-ink-soft' },
  { name: 'ink-faint', cls: 'bg-ink-faint' },
  { name: 'lapis', cls: 'bg-lapis' },
  { name: 'lapis-ink', cls: 'bg-lapis-ink' },
  { name: 'lapis-wash', cls: 'bg-lapis-wash', ring: true },
  { name: 'rubric', cls: 'bg-rubric' },
  { name: 'rubric-wash', cls: 'bg-rubric-wash', ring: true },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">{title}</h2>
      {children}
    </section>
  );
}

export default function Styleguide() {
  return (
    <div className="min-h-dvh bg-desk text-ink">
      <header className="flex h-14 items-center gap-3 border-b border-line bg-[color-mix(in_srgb,var(--desk)_82%,var(--leaf))] px-[22px]">
        <a href="#/" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint hover:text-ink">
          Quick&nbsp;to&nbsp;Hear
        </a>
        <span className="font-scripture text-[18px]">Styleguide</span>
        <div className="flex-1" />
        <DayNightToggle />
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-12">
        <h1 className="font-scripture text-[34px] leading-tight">A manuscript that answers to a command line</h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-soft">
          A warm leaf-on-a-desk reading surface, lapis accent, Scripture in a humanist serif, every
          anchor and command in monospace. The passage is always the subject.
        </p>

        <Section title="Palette">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SWATCHES.map((s) => (
              <div key={s.name} className="rounded-lg border border-line bg-leaf p-2">
                <div className={`h-14 w-full rounded-md ${s.cls} ${s.ring ? 'ring-1 ring-inset ring-line' : ''}`} />
                <div className="mt-1.5 font-mono text-[11px] text-ink-soft">{s.name}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type roles">
          <div className="space-y-4 rounded-lg border border-line bg-leaf p-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                font-scripture — the text
              </div>
              <p className="font-scripture text-[1.32rem] leading-[1.72]">
                <sup className="mr-0.5 align-super font-mono text-[0.62em] text-ink-faint">5</sup>
                There was in the days of Herod a certain priest named Zacharias.
              </p>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                font-mono — anchors &amp; commands
              </div>
              <p className="font-mono text-[13px] text-lapis-ink">Luke 1:18 · LUKE.1.18 · /reference</p>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                font-sans — the chrome
              </div>
              <p className="font-sans text-[14px] text-ink-soft">
                Name this section · Mark confusing · Divide here
              </p>
            </div>
          </div>
        </Section>

        <Section title="Type scale">
          <div className="space-y-2 rounded-lg border border-line bg-leaf p-6">
            <p className="font-scripture text-[30px] leading-tight">Leaf title — 30px</p>
            <p className="font-scripture text-[1.32rem] leading-[1.72]">Scripture body — 1.32rem</p>
            <p className="font-sans text-[15px]">UI body — 15px</p>
            <p className="font-sans text-[13.5px]">Note body — 13.5px</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
              Overline / label — 11px mono
            </p>
          </div>
        </Section>

        <Section title="Components">
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-leaf p-6">
            <span className="rounded-md border border-line bg-panel px-2 py-[3px] font-mono text-[11.5px] text-ink-soft">
              WEBBE
            </span>
            <button className="flex items-baseline gap-2.5 rounded-lg border-l-2 border-l-lapis bg-lapis-wash px-2.5 py-2 text-left">
              <span className="font-mono text-[11px] text-lapis">03</span>
              <span className="text-[13.5px] font-semibold text-lapis-ink">Map</span>
            </button>
            <span className="grid size-6 place-items-center rounded-md bg-lapis font-mono text-[11px] text-white dark:text-[#10131a]">
              3
            </span>
            <span className="rounded-[5px] bg-lapis-wash px-1.5 py-0.5 font-mono text-[11px] text-lapis-ink">
              Luke 1:18
            </span>
          </div>

          <div className="mt-4 max-w-xs rounded-lg border border-line border-l-[3px] border-l-rubric bg-leaf p-[11px_13px]">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="rounded-[5px] bg-lapis-wash px-1.5 py-0.5 font-mono text-[11px] text-lapis-ink">
                Luke 1:18
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
                Mark · confusing
              </span>
            </div>
            <p className="font-scripture text-[13.5px] leading-[1.5] text-ink">
              “How can I be sure of this?” — is this the same doubt Mary voices later?
            </p>
          </div>

          <div className="mt-4 inline-flex items-center gap-0.5 rounded-[10px] bg-ink p-1 shadow-leaf">
            <span className="px-2 pl-1.5 font-mono text-[11px] text-[#cfc9bd]">Luke 1:8</span>
            <span className="mx-0.5 h-[18px] w-px bg-white/15" />
            <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] text-[#efe9dd]">
              <span className="opacity-85">⚑</span>Mark confusing
            </span>
          </div>
        </Section>
      </main>
    </div>
  );
}
