import type { LeaderModel, LeaderQuestion } from '@/lib/export';

/**
 * The leader's notes — everything (SPEC Phase 7 / §4.8). Theme, aim, know/feel/do, the
 * Christ route, the section map with weights, and every question with its expected answer,
 * anchor, type, weight, wrong turns, load-bearing/gospel-plain marks, attached support and
 * return question — plus a suggested drop order, material held in reserve, pastoral flags,
 * the prayer point, and the attribution/copyright lines.
 */
const TYPE_LABEL: Record<string, string> = {
  context: 'Context',
  observation: 'Observation',
  meaning: 'Meaning',
  application: 'Application',
};

function QuestionTags({ q }: { q: LeaderQuestion }) {
  const tags = [TYPE_LABEL[q.type] ?? q.type, q.weight];
  if (q.loadBearing) tags.push('load-bearing');
  if (q.gospelPlain) tags.push('gospel-plain');
  if (q.aimComponent) tags.push(q.aimComponent);
  if (q.pastoralFlag) tags.push('pastoral');
  return (
    <p className="text-xs text-muted-foreground">
      {tags.join(' · ')}
      {q.anchorLabel ? ` · ${q.anchorLabel}` : ''}
    </p>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function LeaderDocument({ model }: { model: LeaderModel }) {
  return (
    <article data-testid="leader-document">
      <header className="mb-4 border-b border-border pb-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {model.reference || 'Bible study'}
        </h1>
        <p className="text-xs text-muted-foreground">Leader's notes</p>
      </header>

      <Section title="Theme &amp; aim">
        {model.theme && (
          <p>
            <span className="font-semibold">Theme. </span>
            {model.theme}
          </p>
        )}
        {model.authorAim && (
          <p>
            <span className="font-semibold">Author's aim. </span>
            {model.authorAim}
          </p>
        )}
        {model.groupAim && (
          <p>
            <span className="font-semibold">Aim for the group. </span>
            {model.groupAim}
          </p>
        )}
        <ul className="mt-1 list-disc pl-5 text-[0.95rem]">
          {model.know && (
            <li>
              <span className="font-semibold">Know:</span> {model.know}
            </li>
          )}
          {model.feel && (
            <li>
              <span className="font-semibold">Feel:</span> {model.feel}
            </li>
          )}
          {model.do && (
            <li>
              <span className="font-semibold">Do:</span> {model.do}
            </li>
          )}
        </ul>
      </Section>

      {model.christRoute && (
        <Section title="How the passage gets to Christ">
          <p>{model.christRoute}</p>
        </Section>
      )}

      {model.sections.length > 0 && (
        <Section title="Section map">
          <ul className="list-disc pl-5 text-[0.95rem]">
            {model.sections.map((s, i) => (
              <li key={i}>
                {s.name}
                {s.weight && <span className="text-muted-foreground"> — {s.weight}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Questions">
        {model.durationMinutes != null && (
          <p className="mb-2 text-xs italic text-muted-foreground">
            Estimated ≈ {model.estimatedMinutes} min of {model.durationMinutes}.
          </p>
        )}
        <ol className="space-y-4">
          {model.questions.map((q) => (
            <li key={q.number} className="print-question" data-question-number={q.number}>
              <p className="font-medium">
                <span className="mr-1.5 font-semibold">{q.number}.</span>
                {q.text}
              </p>
              <QuestionTags q={q} />
              <p className="mt-1 text-[0.95rem]" data-testid="leader-answer">
                <span className="font-semibold">Expected answer: </span>
                {q.expectedAnswer}
              </p>
              {q.wrongTurns && (
                <p className="text-[0.95rem]">
                  <span className="font-semibold">Wrong turns: </span>
                  {q.wrongTurns}
                </p>
              )}
              {q.support.map((s, i) => (
                <p key={i} className="text-[0.95rem] text-muted-foreground">
                  Support ({s.type}): {s.reference}
                  {s.returnQuestion && <> — return: <em>{s.returnQuestion}</em></>}
                </p>
              ))}
            </li>
          ))}
        </ol>
      </Section>

      {model.dropOrder.length > 0 && (
        <Section title="If you run short">
          <p className="text-[0.95rem]">
            Drop these first (not load-bearing):{' '}
            {model.dropOrder.map((n) => `Q${n}`).join(', ')}.
          </p>
        </Section>
      )}

      {model.reserve.length > 0 && (
        <Section title="Held in reserve">
          <ul className="list-disc pl-5 text-[0.95rem]">
            {model.reserve.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Section>
      )}

      {model.pastoralNumbers.length > 0 && (
        <Section title="Pastoral sensitivity">
          <p className="text-[0.95rem] text-muted-foreground">
            Handle with care: {model.pastoralNumbers.map((n) => `Q${n}`).join(', ')}.
          </p>
          <ul className="mt-1 space-y-1.5 text-[0.95rem]" data-testid="leader-pastoral">
            {model.questions
              .filter((q) => q.pastoralFlag)
              .map((q) => (
                <li key={q.number}>
                  <span className="font-semibold">Q{q.number}.</span> {q.text}
                  {q.pastoralNote && (
                    <span className="mt-0.5 block text-sm italic text-muted-foreground">
                      {q.pastoralNote}
                    </span>
                  )}
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
        <footer className="mt-8 space-y-1 border-t border-border pt-3 text-xs italic text-muted-foreground">
          {model.attributions.map((a, i) => (
            <p key={i}>{a}</p>
          ))}
        </footer>
      )}
    </article>
  );
}
