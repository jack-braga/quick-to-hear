import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useOpenStudy } from '@/hooks/useOpenStudy';
import { exportOptions, leaderModel, resolveSupportTexts } from '@/lib/export';
import type { ParsedText } from '@/types/passage';
import { projectForExport } from '@/v2/export';
import { LeaderDoc } from '@/v2/print/LeaderDoc';
import { PrintShell } from '@/v2/print/PrintShell';

/** `#/print/:id/leader` (v2) — the leader's notes, projected from the v2 annotations onto the v1
 *  export model. Carries everything: the running order with types, expected answers, anchors,
 *  sections, timing, copyright + method attributions. */
export default function PrintLeader() {
  const { id = '' } = useParams();
  const { study } = useOpenStudy(id);
  const projected = useMemo(() => (study ? projectForExport(study) : null), [study]);
  const [supportTexts, setSupportTexts] = useState<Record<string, ParsedText | null>>({});

  useEffect(() => {
    let live = true;
    if (projected) void resolveSupportTexts(projected).then((t) => live && setSupportTexts(t));
    return () => {
      live = false;
    };
  }, [projected]);

  if (!study || !projected) {
    return (
      <PrintShell backTo={`/study/${id}/reader`} toolbarNote="">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </PrintShell>
    );
  }

  const model = leaderModel(projected, exportOptions(projected, supportTexts));
  return (
    <PrintShell backTo={`/study/${study.id}/reader`} toolbarNote="Everything — including the expected answers.">
      <LeaderDoc model={model} />
    </PrintShell>
  );
}
