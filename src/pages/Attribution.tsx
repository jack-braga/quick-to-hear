import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import { helpEntry } from '@/lib/content/help';

/**
 * The full attribution & further-reading page (SPEC §7: "A full attribution page lists
 * everything"; PLAN §6 Stage 10). Content lives in `content/help/global/attribution.page.md`
 * under the `<!-- page -->` tier and is authored/curated by the teaching session — this
 * component only renders it, so credits can be edited with no code change. The inline
 * `source` credit line (present because the file is `state: cited`) renders beneath; the
 * frontmatter `flag` is an internal owner note and is intentionally **not** shown.
 */
export default function Attribution() {
  const entry = helpEntry('attribution.page');
  const body = entry?.page ?? '';

  return (
    <div className="space-y-6" data-testid="attribution-page">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {entry?.title || 'Attribution & further reading'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Credits, licences, and the books this tool's tradition rests on.
        </p>
      </div>

      {body ? (
        <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary">
          <ReactMarkdown>{body}</ReactMarkdown>
        </article>
      ) : (
        <p className="text-sm text-muted-foreground">
          The attribution text has not been written yet.
        </p>
      )}

      {entry?.source && (
        <p className="border-t border-border pt-3 text-xs italic text-muted-foreground">
          {entry.source}
        </p>
      )}

      <div>
        <Link to="/" className="text-sm text-primary underline underline-offset-2">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
