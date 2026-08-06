import { BookOpen, BookOpenCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useGuidance } from '@/lib/guidance';

/** Header control for the global guidance-detail preference (PLAN §4.7). `full` shows
 *  inline help + the "tell me more" expandables; `brief` collapses to inline only. */
export function GuidanceToggle() {
  const mode = useGuidance((s) => s.mode);
  const toggle = useGuidance((s) => s.toggle);
  const next = mode === 'full' ? 'brief' : 'full';
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Guidance detail: ${mode}. Switch to ${next}.`}
      title={`Guidance detail: ${mode} (click for ${next})`}
      data-guidance-mode={mode}
    >
      {mode === 'full' ? <BookOpenCheck aria-hidden /> : <BookOpen aria-hidden />}
    </Button>
  );
}
