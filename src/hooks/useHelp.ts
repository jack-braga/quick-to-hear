import { helpEntry, type HelpEntry } from '@/lib/content/help';
import { useGuidance } from '@/lib/guidance';

export interface UseHelp {
  entry: HelpEntry | null;
  /** True when there is authored inline prose to show (else render the placeholder). */
  hasContent: boolean;
  /** Offer the expandable "tell me more" tier? (guidance `full` + the tier exists). */
  showExpandable: boolean;
  /** Offer the [X] worked-example tier? (guidance `full` + an authored example exists).
   *  False for every key until the teaching session fills a `<!-- example -->` block —
   *  the disclosure then appears with no code change (Stage 10). */
  showExample: boolean;
}

/**
 * Resolve a help key to its parsed entry + the current guidance-detail decision
 * (PLAN §4.7). Subscribes to {@link useGuidance} so a header toggle re-renders every
 * on-screen `<Help>` at once.
 */
export function useHelp(key: string): UseHelp {
  const mode = useGuidance((s) => s.mode);
  const entry = helpEntry(key);
  return {
    entry,
    hasContent: (entry?.inline.length ?? 0) > 0,
    showExpandable: mode === 'full' && (entry?.expandable.length ?? 0) > 0,
    showExample: mode === 'full' && (entry?.example.length ?? 0) > 0,
  };
}
