import { Check } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { GuidancePlaceholder } from '@/components/GuidancePlaceholder';
import { PassageView } from '@/components/passage/PassageView';
import { StudyHeader } from '@/components/StudyHeader';
import { Button } from '@/components/ui/button';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import { findTranslation } from '@/lib/bible';
import { useStudyStore } from '@/store/study';
import { StudyNotFound } from '@/pages/StudyNotFound';

export default function Phase2Read() {
  const { id = '' } = useParams();
  const { study, loading } = useOpenStudy(id);
  const incrementRead = useStudyStore((s) => s.incrementRead);
  const applyToCurrent = useStudyStore((s) => s.applyToCurrent);

  if (!study) return <StudyNotFound loading={loading} />;

  const passage = study.passage.primary;
  const count = study.read.count;
  const tr = passage ? findTranslation(passage.translationId) : undefined;

  return (
    <div className="space-y-8">
      <StudyHeader study={study} />

      <div>
        <h2 className="text-lg font-semibold">Phase 2 — Pray and read</h2>
        <p className="text-sm text-muted-foreground">
          A quiet phase. Nothing to type — this is time to slow down and listen.
        </p>
      </div>

      {!passage ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          No passage loaded yet.{' '}
          <Link to={`/study/${study.id}/1`} className="underline underline-offset-2">
            Set it up first
          </Link>
          .
        </div>
      ) : (
        <>
          {/* Pray */}
          <section className="space-y-2 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Pray before you begin</h3>
            <GuidancePlaceholder helpKey="p2.pray" />
          </section>

          {/* The passage — the subject of the screen */}
          <section className="space-y-3">
            <PassageView passage={passage} />
            {tr && (
              <p className="text-xs text-muted-foreground">
                {tr.name} ({tr.shortName})
              </p>
            )}
          </section>

          {/* Read instruction + counter */}
          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Read it three or four times</h3>
            <GuidancePlaceholder helpKey="p2.read" />
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Button onClick={incrementRead}>
                <Check aria-hidden />
                I&apos;ve read it{count > 0 ? ' again' : ''}
              </Button>
              <span aria-live="polite" className="text-sm" data-testid="read-count">
                Read <strong>{count}</strong> time{count === 1 ? '' : 's'}
              </span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => applyToCurrent((s) => ({ ...s, read: { count: 0 } }))}
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  reset
                </button>
              )}
            </div>
            <GuidancePlaceholder helpKey="p2.counter" />
          </section>
        </>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to={`/study/${study.id}/1`}>← Back to set up</Link>
        </Button>
        <Button asChild>
          <Link to={`/study/${study.id}/3`}>Next: Map the passage →</Link>
        </Button>
      </div>
    </div>
  );
}
