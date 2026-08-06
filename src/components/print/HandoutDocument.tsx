import { PassageView } from '@/components/passage/PassageView';
import type { HandoutModel, HandoutSupport } from '@/lib/export';

/**
 * One support passage printed inline in the handout — visually subordinate to the main
 * text (SPEC 6f: "must never compete with the main text"), with its reference always
 * visible. A light function label ("Context"/"Quoted") is the one cue kept; it is not a
 * *question* type label (which the handout excludes) but the passage's role.
 */
function SupportBox({ support }: { support: HandoutSupport }) {
  const s = support;
  return (
    <div
      data-testid="handout-support"
      data-support-type={s.type}
      className="print-box my-2 rounded-md border border-border bg-muted/40 px-3 py-2"
    >
      <p className="text-sm font-semibold">
        <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {s.type === 'context' ? 'Context' : 'Quoted'}
        </span>
        {s.reference}
      </p>
      {s.text ? (
        <PassageView passage={s.text} className="text-[0.95rem]" />
      ) : (
        <p className="text-sm italic text-muted-foreground">Read {s.reference} together.</p>
      )}
      {s.returnQuestion && <p className="mt-1 text-sm italic">{s.returnQuestion}</p>}
    </div>
  );
}

/**
 * The participant handout — clean and answer-free (SPEC Phase 7 / §4.8). Renders a
 * {@link HandoutModel}, which is *defined by exclusion*: no theme, aim, question-type
 * labels, timings, or expected answers reach this component. Questions get white space to
 * write; support passages print inline at their point of need — **context** frames the
 * question so it prints *above* it, **quoted** passages the author sent them to print
 * *below* the prompt; background boxes and the prayer point follow; the translation
 * copyright line closes it.
 */
export function HandoutDocument({ model }: { model: HandoutModel }) {
  return (
    <article data-testid="handout-document">
      <header className="mb-4 border-b border-border pb-3">
        <h1 className="text-2xl font-semibold tracking-tight">{model.reference || 'Bible study'}</h1>
        {model.intro && <p className="mt-2 text-[0.95rem] text-muted-foreground">{model.intro}</p>}
      </header>

      {model.passage && (
        <section className="mb-6">
          <PassageView passage={model.passage} />
        </section>
      )}

      {model.questions.length > 0 && (
        <section className="mb-6">
          <ol className="space-y-5" data-testid="handout-questions">
            {model.questions.map((q) => {
              // Context frames the question (read first → above); quoted passages the author
              // sent them to are looked up in response (→ below the prompt). SPEC 6f.
              const before = q.support.filter((s) => s.type === 'context');
              const after = q.support.filter((s) => s.type === 'quoted');
              return (
                <li key={q.number} className="print-question" data-question-number={q.number}>
                  {before.map((s) => (
                    <SupportBox key={s.id} support={s} />
                  ))}

                  <p className="font-medium">
                    <span className="mr-1.5 font-semibold">{q.number}.</span>
                    {q.text}
                  </p>

                  {after.map((s) => (
                    <SupportBox key={s.id} support={s} />
                  ))}

                  {/* White space to write (SPEC: numbered questions with room to write). */}
                  <div
                    aria-hidden
                    className="print-writing mt-2 h-16 rounded-md border border-dashed border-border/70"
                  />
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {model.boxes.length > 0 && (
        <section className="mb-6 space-y-3" data-testid="handout-boxes">
          {model.boxes.map((b, i) => (
            <aside
              key={i}
              className="print-box rounded-md border border-border bg-muted/40 px-3 py-2"
            >
              {b.label && <p className="text-sm font-semibold">{b.label}</p>}
              {b.passage ? (
                <PassageView passage={b.passage} className="text-[0.95rem]" />
              ) : (
                b.text && <p className="text-[0.95rem]">{b.text}</p>
              )}
            </aside>
          ))}
        </section>
      )}

      {model.prayerPoint && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Prayer
          </h2>
          <p className="mt-1">{model.prayerPoint}</p>
        </section>
      )}

      {model.copyrightLine && (
        <footer
          data-testid="handout-copyright"
          className="mt-8 border-t border-border pt-3 text-xs italic text-muted-foreground"
        >
          {model.copyrightLine}
        </footer>
      )}
    </article>
  );
}
