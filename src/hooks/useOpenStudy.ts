import { useEffect } from 'react';

import { useStudyStore } from '@/store/study';
import type { Study } from '@/types/study';

/**
 * Load the study named in the route on deep-link / refresh / study-switch, exactly as
 * the Stage-1 overview did — shared by the phase pages so each doesn't re-implement it.
 * Returns the open study once it matches the requested id, plus the load status.
 */
export function useOpenStudy(id: string): { study: Study | null; loading: boolean } {
  const current = useStudyStore((s) => s.current);
  const status = useStudyStore((s) => s.status);
  const openStudy = useStudyStore((s) => s.openStudy);

  useEffect(() => {
    if (id && current?.id !== id) void openStudy(id);
  }, [id, current?.id, openStudy]);

  const matched = current?.id === id ? current : null;
  return { study: matched, loading: status === 'loading' && !matched };
}
