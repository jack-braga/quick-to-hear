import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useOpenStudy } from '@/hooks/useOpenStudy';
import type { ParsedText } from '@/types/passage';
import { ExportPreview } from '@/v2/print/ExportPreview';
import { PrintShell } from '@/v2/print/PrintShell';
import { resolveSupportTextsV2 } from '@/v2/print/supportTexts';

/** `#/print/:id/leader` (v2) — the leader's notes, rendered from the v2 export model. Carries
 *  everything: the interleaved running order with expected answers + metadata, the weighed theme/aim,
 *  study notes (hidden ones marked leader-only), support passages, copyright + method attributions. */
export default function PrintLeader() {
  const { id = '' } = useParams();
  const { study } = useOpenStudy(id);
  const [supportTexts, setSupportTexts] = useState<Record<string, ParsedText | null>>({});

  useEffect(() => {
    let live = true;
    if (study) void resolveSupportTextsV2(study).then((t) => live && setSupportTexts(t));
    return () => {
      live = false;
    };
  }, [study]);

  if (!study) {
    return (
      <PrintShell backTo={`/study/${id}/reader`} toolbarNote="">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </PrintShell>
    );
  }

  return (
    <PrintShell backTo={`/study/${study.id}/reader`} toolbarNote="Everything — including the expected answers.">
      <ExportPreview study={study} variant="leader" mode="print" supportTexts={supportTexts} />
    </PrintShell>
  );
}
