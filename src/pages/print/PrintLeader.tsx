import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { LeaderDocument } from '@/components/print/LeaderDocument';
import { PrintShell } from '@/components/print/PrintShell';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import { exportOptions, leaderModel, resolveSupportTexts } from '@/lib/export';
import type { ParsedText } from '@/types/passage';

/** `#/print/:id/leader` — the leader's notes as a print-CSS page (SPEC §4.8). */
export default function PrintLeader() {
  const { id = '' } = useParams();
  const { study } = useOpenStudy(id);
  const [supportTexts, setSupportTexts] = useState<Record<string, ParsedText | null>>({});

  useEffect(() => {
    let live = true;
    if (study) void resolveSupportTexts(study).then((t) => live && setSupportTexts(t));
    return () => {
      live = false;
    };
  }, [study]);

  if (!study) {
    return (
      <PrintShell backTo={`/study/${id}/7`} toolbarNote="">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </PrintShell>
    );
  }

  const model = leaderModel(study, exportOptions(study, supportTexts));

  return (
    <PrintShell backTo={`/study/${study.id}/7`} toolbarNote="Everything — this is the copy you lead from.">
      <LeaderDocument model={model} />
    </PrintShell>
  );
}
