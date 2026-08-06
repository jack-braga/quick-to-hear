import { helpEntry, type HelpEntry } from '@/lib/content/help';
import { useGuidance } from '@/lib/guidance';

export interface UseHelp {
  entry: HelpEntry | null;
  /** True when there is authored inline prose to show (else render the placeholder). */
  hasContent: boolean;
  /** Offer the expandable "tell me more" tier? (guidance `full` + the tier exists). */
  showExpandable: boolean;
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
  };
}
