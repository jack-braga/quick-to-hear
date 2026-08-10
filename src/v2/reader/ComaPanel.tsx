import { comaContent, comaSetForGenre } from '@/lib/content';
import type { Study } from '@/types/study';
import { Help } from '@/v2/Help';

/**
 * The COMA lens margin (SPEC Phase 4) — the guided **Context · Observation · Meaning · Application**
 * prompts for the study's genre (David Helm's questions, verbatim by permission). The tool prompts;
 * it never writes the answers (Inviolable rule 1) — you read the passage against these and jot what
 * you see as a note or question in the Map lens. The Helm attribution renders here because COMA
 * content appears here (Inviolable rule 8).
 */
const GROUPS = [
  { key: 'context', label: 'Context' },
  { key: 'observation', label: 'Observation' },
  { key: 'meaning', label: 'Meaning' },
  { key: 'application', label: 'Application' },
] as const;

export function ComaPanel({ study }: { study: Study }) {
  // #4b-1 uses the primary genre; #4b-2 rebuilds this panel to iterate all genres with answer-cards.
  const set = comaSetForGenre(study.setup.genres[0] ?? null);

  let attribution = '';
  try {
    attribution = comaContent().attribution;
  } catch {
    /* method file unreadable — omit the line rather than block the lens */
  }

  return (
    <div>
      <div className="mx-1 mb-3.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        COMA — work the text
        <Help helpKey="p4.overview" label="COMA" />
      </div>

      {study.setup.genres.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-3.5 text-[13px] leading-[1.55] text-ink-soft">
          Set the passage’s <b className="font-semibold text-ink">text-type(s)</b> in Set up to see its
          COMA prompts.
        </p>
      ) : !set ? (
        <p className="rounded-lg border border-dashed border-line p-3.5 text-[13px] leading-[1.55] text-ink-soft">
          No prompts for this genre yet.
        </p>
      ) : (
        <>
          <p className="mb-4 text-[13px] leading-[1.55] text-ink-soft">
            Read the passage against these. Jot what you see as a <b className="font-semibold text-ink">note</b>{' '}
            or <b className="font-semibold text-ink">question</b> in the Map lens.
          </p>
          <div className="space-y-4">
            {GROUPS.map((g) => {
              const items = set[g.key];
              if (!items || items.length === 0) return null;
              return (
                <div key={g.key}>
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-lapis-ink">
                    {g.label}
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((prompt, i) => (
                      <li
                        key={i}
                        className="rounded-md border border-line bg-leaf px-2.5 py-1.5 text-[12.5px] leading-[1.45] text-ink"
                      >
                        {prompt}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          {attribution && (
            <p className="mt-5 border-t border-line pt-3 text-[11px] italic leading-[1.5] text-ink-faint">
              {attribution}
            </p>
          )}
        </>
      )}
    </div>
  );
}
