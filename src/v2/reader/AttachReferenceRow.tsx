import { useState } from 'react';

import type { ParsedReference } from '@/lib/verse';
import type { Annotation } from '@/types/study';
import { ReferenceCombobox } from '@/v2/reader/ReferenceCombobox';
import { mentionKey, mentionLabel } from '@/v2/reader/mentions';

/**
 * Attach a reference to a **question** (V2-UX-BACKLOG §7.4). A question's text stays the clean
 * deliverable, so its references live in the `mentions` map (not the text): each attached reference is
 * include-for-group, and prints as a support passage beside the question. Shown on question cards in
 * **Write** (while authoring) and **Build** (while assembling). Adding one uses the same guided
 * book→chapter→verse picker as the `@`-mention editor ({@link ReferenceCombobox}).
 */
export function AttachReferenceRow({
  card,
  onEdit,
}: {
  card: Annotation;
  onEdit: (id: string, patch: Partial<Annotation>) => void;
}) {
  const [open, setOpen] = useState(false);
  const refs = Object.entries(card.mentions ?? {}).filter(([, m]) => m.reference);

  const attach = (ref: ParsedReference) => {
    const osis = mentionKey(ref);
    onEdit(card.id, {
      mentions: { ...card.mentions, [osis]: { includeForGroup: true, reference: mentionLabel(ref) } },
    });
    setOpen(false);
  };
  const remove = (osis: string) => {
    const next = { ...card.mentions };
    delete next[osis];
    onEdit(card.id, { mentions: next });
  };

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {refs.map(([osis, m]) => (
        <span
          key={osis}
          className="inline-flex items-center gap-1 rounded-[5px] border border-lapis-edge bg-lapis-wash px-1.5 py-0.5 font-mono text-[9.5px] text-lapis-ink"
        >
          ↗ {m.reference}
          <button type="button" aria-label="Remove reference" onClick={() => remove(osis)} className="text-ink-faint hover:text-rubric">
            ✕
          </button>
        </span>
      ))}
      {open ? (
        <ReferenceCombobox onSelect={attach} onCancel={() => setOpen(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Attach a support passage — it prints beside this question for the group"
          className="font-mono text-[9.5px] text-lapis-ink hover:underline"
        >
          ↗ add reference
        </button>
      )}
    </div>
  );
}
