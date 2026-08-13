import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useOpenStudy } from '@/hooks/useOpenStudy';
import type { ParsedText } from '@/types/passage';
import { ExportPreview } from '@/v2/print/ExportPreview';
import { PrintShell } from '@/v2/print/PrintShell';
import { resolveImageDataUrls, resolveSupportTextsV2 } from '@/v2/print/supportTexts';

/** `#/print/:id/handout` (v2) — the participant handout, rendered from the v2 export model. Clean
 *  and answer-free: passage + interleaved questions/study-notes + support passages, no answers. */
export default function PrintHandout() {
  const { id = '' } = useParams();
  const { study } = useOpenStudy(id);
  const [supportTexts, setSupportTexts] = useState<Record<string, ParsedText | null>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let live = true;
    if (study) {
      void resolveSupportTextsV2(study).then((t) => live && setSupportTexts(t));
      void resolveImageDataUrls(study).then((u) => live && setImageUrls(u));
    }
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
    <PrintShell
      backTo={`/study/${study.id}/reader`}
      toolbarNote="This is the clean copy for the group — no answers."
    >
      <ExportPreview
        study={study}
        variant="participant"
        mode="print"
        supportTexts={supportTexts}
        imageUrls={imageUrls}
      />
    </PrintShell>
  );
}
