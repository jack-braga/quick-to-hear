import { useState } from 'react';

import { parseReference } from '@/lib/verse';
import type { Annotation } from '@/types/study';
import { mentionKey, mentionLabel } from '@/v2/reader/mentions';

/**
 * Attach a reference to a **question** (V2-UX-BACKLOG §7.4). A question's text stays the clean
 * deliverable, so its references live in the `mentions` map (not the text): each attached reference is
 * include-for-group, and prints as a support passage beside the question. Shown on question cards in
 * **Write** (while authoring) and **Build** (while assembling) — same mechanism either place.
 */
export function AttachReferenceRow({
  card,
  onEdit,
}: {
  card: Annotation;
  onEdit: (id: string, patch: Partial<Annotation>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const refs = Object.entries(card.mentions ?? {}).filter(([, m]) => m.reference);

  const attach = () => {
    const ref = parseReference(text.trim());
    if (!ref) return;
    const osis = mentionKey(ref);
    onEdit(card.id, {
      mentions: { ...card.mentions, [osis]: { includeForGroup: true, reference: mentionLabel(ref) } },
    });
    setOpen(false);
    setText('');
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
        <span className="inline-flex items-center gap-1">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') attach();
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="e.g. Malachi 4:5-6"
            className="w-32 rounded-md border border-line bg-panel px-1.5 py-0.5 font-mono text-[9.5px] text-ink outline-none focus:border-lapis-edge"
          />
          <button type="button" onClick={attach} className="font-mono text-[9.5px] text-lapis-ink hover:underline">
            add
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setText('');
          }}
          title="Attach a support passage — it prints beside this question for the group"
          className="font-mono text-[9.5px] text-lapis-ink hover:underline"
        >
          ↗ add reference
        </button>
      )}
    </div>
  );
}
