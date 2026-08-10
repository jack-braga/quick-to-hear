import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { HandoutDocument } from '@/components/print/HandoutDocument';
import { PrintShell } from '@/components/print/PrintShell';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import { exportOptions, handoutModel, resolveSupportTexts } from '@/lib/export';
import type { ParsedText } from '@/types/passage';
import { projectForExport } from '@/v2/export';

/** `#/print/:id/handout` (v2) — the participant handout, projected from the v2 annotations onto
 *  the v1 export model. Defined by exclusion: passage + numbered questions + support, no answers. */
export default function PrintHandout() {
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

  const model = handoutModel(projected, exportOptions(projected, supportTexts));
  return (
    <PrintShell
      backTo={`/study/${study.id}/reader`}
      toolbarNote="This is the clean copy for the group — no answers."
    >
      <HandoutDocument model={model} />
    </PrintShell>
  );
}
