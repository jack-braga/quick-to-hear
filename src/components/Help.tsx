import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { GuidancePlaceholder } from '@/components/GuidancePlaceholder';
import { useHelp } from '@/hooks/useHelp';
import { cn } from '@/lib/utils';

/** A small markdown block, styled to sit *beside* a field — subordinate to the passage
 *  (Inviolable rule 2), never competing with it. */
function Prose({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-muted-foreground dark:prose-invert',
        'prose-p:my-1 prose-strong:text-foreground prose-em:text-foreground',
        'prose-a:text-primary',
        className,
      )}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

/**
 * Guidance at the moment of need (Inviolable rule 5). Renders a help key's authored
 * prose: the inline [I] tier always, the expandable [E] tier behind a "Tell me more"
 * disclosure when the global guidance toggle is on `full`. Any inline source credit
 * ([SPEC §7] — credits travel with the text) renders beneath.
 *
 * Falls back to the "guidance to be written" placeholder when a key has no inline prose
 * yet, so the build never blocks on content (PLAN §4.7). This means it's a safe drop-in
 * for {@link GuidancePlaceholder} everywhere.
 */
export function Help({ helpKey, className }: { helpKey: string; className?: string }) {
  const { entry, hasContent, showExpandable } = useHelp(helpKey);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!entry || !hasContent) return <GuidancePlaceholder helpKey={helpKey} />;

  return (
    <div
      role="note"
      data-help={helpKey}
      data-help-state={entry.state ?? undefined}
      className={cn('space-y-1 text-sm', className)}
    >
      <Prose>{entry.inline}</Prose>

      {showExpandable && (
        <div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            data-testid={`help-more-${helpKey}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ChevronDown
              aria-hidden
              className={cn('size-3 transition-transform', open && 'rotate-180')}
            />
            {open ? 'Show less' : 'Tell me more'}
          </button>
          {open && (
            <div id={panelId} className="mt-1 border-l-2 border-border pl-3">
              <Prose>{entry.expandable}</Prose>
            </div>
          )}
        </div>
      )}

      {entry.source && (
        <p
          data-testid={`help-source-${helpKey}`}
          className="text-xs italic text-muted-foreground/80"
        >
          {entry.source}
        </p>
      )}
    </div>
  );
}
