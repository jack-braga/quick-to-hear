import type { HandoutModel, HandoutSupport } from '@/lib/export';
import { PrintPassage } from '@/v2/print/PrintPassage';

/**
 * The v2 participant handout (v2.7) — clean and answer-free (defined by exclusion). White page,
 * Scripture serif, mono labels/anchors, hairline rules, unfilled boxes. Colour is limited to the
 * lapis verse numbers, which the ink-saver toggle turns to ink.
 */
function SupportBox({ support: s }: { support: HandoutSupport }) {
  return (
    <div className="box my-2" data-testid="handout-support" data-support-type={s.type}>
      <p className="mb-1">
        <span className="overline mr-1.5">{s.type === 'context' ? 'Context' : 'Quoted'}</span>
        <span className="anchor">{s.reference}</span>
      </p>
      {s.text ? (
        <PrintPassage passage={s.text} />
      ) : (
        <p className="soft text-[0.95rem] italic">Read {s.reference} together.</p>
      )}
      {s.returnQuestion && <p className="mt-1 text-[0.95rem] italic">{s.returnQuestion}</p>}
    </div>
  );
}

export function HandoutDoc({ model }: { model: HandoutModel }) {
  return (
    <article data-testid="handout-document">
      <header className="mb-5">
        <h1 className="doc-title">{model.reference || 'Bible study'}</h1>
        {model.intro && <p className="soft mt-2 text-[0.98rem]">{model.intro}</p>}
        <hr className="rule mt-3" />
      </header>

      {model.passage && (
        <section className="mb-7">
          <PrintPassage passage={model.passage} />
        </section>
      )}

      {model.questions.length > 0 && (
        <section className="mb-7">
          <ol className="space-y-5" data-testid="handout-questions">
            {model.questions.map((q) => {
              const before = q.support.filter((s) => s.type === 'context');
              const after = q.support.filter((s) => s.type === 'quoted');
              return (
                <li key={q.number} className="q-item" data-question-number={q.number}>
                  {before.map((s) => (
                    <SupportBox key={s.id} support={s} />
                  ))}
                  <p className="text-[1.02rem]">
                    <span className="qnum">{q.number}.</span>
                    {q.text}
                  </p>
                  {after.map((s) => (
                    <SupportBox key={s.id} support={s} />
                  ))}
                  <div aria-hidden className="writing mt-2" />
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {model.boxes.length > 0 && (
        <section className="mb-7 space-y-3" data-testid="handout-boxes">
          {model.boxes.map((b, i) => (
            <aside key={i} className="box">
              {b.label && <p className="anchor mb-1">{b.label}</p>}
              {b.passage ? <PrintPassage passage={b.passage} /> : b.text && <p className="text-[0.95rem]">{b.text}</p>}
            </aside>
          ))}
        </section>
      )}

      {model.prayerPoint && (
        <section className="mb-7">
          <p className="overline mb-1">Prayer</p>
          <p>{model.prayerPoint}</p>
        </section>
      )}

      {model.copyrightLine && (
        <footer data-testid="handout-copyright" className="mt-8">
          <hr className="rule mb-3" />
          <p className="soft text-xs italic">{model.copyrightLine}</p>
        </footer>
      )}
    </article>
  );
}
