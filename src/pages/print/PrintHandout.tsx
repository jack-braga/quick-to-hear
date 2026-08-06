import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { HandoutDocument } from '@/components/print/HandoutDocument';
import { PrintShell } from '@/components/print/PrintShell';
import { useOpenStudy } from '@/hooks/useOpenStudy';
import { exportOptions, handoutModel, resolveSupportTexts } from '@/lib/export';
import type { ParsedText } from '@/types/passage';

/** `#/print/:id/handout` — the participant handout as a print-CSS page (SPEC §4.8). */
export default function PrintHandout() {
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

  const model = handoutModel(study, exportOptions(study, supportTexts));

  return (
    <PrintShell
      backTo={`/study/${study.id}/7`}
      toolbarNote="This is the clean copy for the group — no answers."
    >
      <HandoutDocument model={model} />
    </PrintShell>
  );
}
