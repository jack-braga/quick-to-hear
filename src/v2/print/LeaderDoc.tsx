import type { LeaderModel, LeaderQuestion } from '@/lib/export';

/**
 * The v2 leader's notes (v2.7) — everything. Same white/serif/mono/hairline language as the
 * handout; the only colour is the lapis question numbers (ink-saver flips them to ink).
 */
const TYPE_LABEL: Record<string, string> = {
  context: 'Context',
  observation: 'Observation',
  meaning: 'Meaning',
  application: 'Application',
};

function tagLine(q: LeaderQuestion): string {
  const tags = [TYPE_LABEL[q.type] ?? q.type, q.weight];
  if (q.loadBearing) tags.push('load-bearing');
  if (q.gospelPlain) tags.push('gospel-plain');
  if (q.aimComponent) tags.push(q.aimComponent);
  if (q.pastoralFlag) tags.push('pastoral');
  return tags.join(' · ') + (q.anchorLabel ? ` · ${q.anchorLabel}` : '');
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <p className="overline mb-1.5">{title}</p>
      {children}
    </section>
  );
}

export function LeaderDoc({ model }: { model: LeaderModel }) {
  return (
    <article data-testid="leader-document">
      <header className="mb-5">
        <h1 className="doc-title">{model.reference || 'Bible study'}</h1>
        <p className="doc-sub mt-1">Leader’s notes</p>
        <hr className="rule mt-3" />
      </header>

      <Section title="Theme & aim">
        {model.theme && (
          <p>
            <strong>Theme.</strong> {model.theme}
          </p>
        )}
        {model.authorAim && (
          <p>
            <strong>Author’s aim.</strong> {model.authorAim}
          </p>
        )}
        {model.groupAim && (
          <p>
            <strong>Aim for the group.</strong> {model.groupAim}
          </p>
        )}
        {(model.know || model.feel || model.do) && (
          <ul className="mt-1 list-disc pl-5 text-[0.97rem]">
            {model.know && (
              <li>
                <strong>Know:</strong> {model.know}
              </li>
            )}
            {model.feel && (
              <li>
                <strong>Feel:</strong> {model.feel}
              </li>
            )}
            {model.do && (
              <li>
                <strong>Do:</strong> {model.do}
              </li>
            )}
          </ul>
        )}
      </Section>

      {model.christRoute && (
        <Section title="How the passage gets to Christ">
          <p>{model.christRoute}</p>
        </Section>
      )}

      {model.sections.length > 0 && (
        <Section title="Section map">
          <ul className="list-disc pl-5 text-[0.97rem]">
            {model.sections.map((s, i) => (
              <li key={i}>
                {s.name}
                {s.weight && <span className="soft"> — {s.weight}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Questions">
        {model.durationMinutes != null && (
          <p className="soft mb-2 text-xs italic">
            Estimated ≈ {model.estimatedMinutes} min of {model.durationMinutes}.
          </p>
        )}
        <ol className="space-y-4">
          {model.questions.map((q) => (
            <li key={q.number} className="q-item" data-question-number={q.number}>
              <p className="text-[1.02rem]">
                <span className="qnum">{q.number}.</span>
                {q.text}
              </p>
              <p className="anchor mt-0.5">{tagLine(q)}</p>
              <p className="mt-1 text-[0.97rem]" data-testid="leader-answer">
                <strong>Expected answer: </strong>
                {q.expectedAnswer}
              </p>
              {q.wrongTurns && (
                <p className="text-[0.97rem]">
                  <strong>Wrong turns: </strong>
                  {q.wrongTurns}
                </p>
              )}
              {q.support.map((s, i) => (
                <p key={i} className="soft text-[0.97rem]">
                  Support ({s.type}): {s.reference}
                  {s.returnQuestion && (
                    <>
                      {' '}
                      — return: <em>{s.returnQuestion}</em>
                    </>
                  )}
                </p>
              ))}
            </li>
          ))}
        </ol>
      </Section>

      {model.dropOrder.length > 0 && (
        <Section title="If you run short">
          <p className="text-[0.97rem]">
            Drop these first (not load-bearing): {model.dropOrder.map((n) => `Q${n}`).join(', ')}.
          </p>
        </Section>
      )}

      {model.reserve.length > 0 && (
        <Section title="Held in reserve">
          <ul className="list-disc pl-5 text-[0.97rem]">
            {model.reserve.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Section>
      )}

      {model.pastoralNumbers.length > 0 && (
        <Section title="Pastoral sensitivity">
          <p className="soft text-[0.97rem]">Handle with care: {model.pastoralNumbers.map((n) => `Q${n}`).join(', ')}.</p>
          <ul className="mt-1 space-y-1.5 text-[0.97rem]" data-testid="leader-pastoral">
            {model.questions
              .filter((q) => q.pastoralFlag)
              .map((q) => (
                <li key={q.number}>
                  <strong>Q{q.number}.</strong> {q.text}
                  {q.pastoralNote && <span className="soft mt-0.5 block text-sm italic">{q.pastoralNote}</span>}
                </li>
              ))}
          </ul>
        </Section>
      )}

      {model.prayerPoint && (
        <Section title="Prayer">
          <p>{model.prayerPoint}</p>
        </Section>
      )}

      {model.attributions.length > 0 && (
        <footer className="mt-8">
          <hr className="rule mb-3" />
          <div className="soft space-y-1 text-xs italic">
            {model.attributions.map((a, i) => (
              <p key={i}>{a}</p>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
