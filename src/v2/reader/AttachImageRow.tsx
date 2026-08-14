import { useEffect, useRef, useState } from 'react';

import { useStorageEstimate } from '@/hooks/useStorageEstimate';
import { newId } from '@/lib/id';
import { bytesToBlob } from '@/lib/images/encode';
import { ACCEPTED_MIME, isProcessed, processImageFile } from '@/lib/images/processImage';
import { deleteImage, getImage, putImage } from '@/lib/storage';
import { useStudyStore } from '@/store/study';
import type { Annotation, ImageRef } from '@/types/study';

const MAX_IMAGES = 6; // "a few" (owner) — a soft cap so a card can't sprawl
// Single source of truth with the processImageFile allow-list — the <input accept> can't drift.
const ACCEPT = ACCEPTED_MIME.join(',');

/**
 * Attach images to a **question** or **study-note** card (V2 §6, Variant A — the owner's pick). The
 * image is the user's own upload (rule 1 — the tool never sources one); `processImageFile` keeps the
 * original bytes untouched unless oversized (fidelity-first), then the bytes go to the IndexedDB image
 * store keyed by id while the card keeps only an ordered `{ id, caption }` ref list (via `onEdit`).
 * Renders a thumbnail strip: each image has an inline caption (doubling as alt text) + a delete corner,
 * and thumbnails drag — or use the ◀ ▶ buttons — to reorder (print follows the order). Mirrors
 * {@link AttachReferenceRow}.
 */
export function AttachImageRow({
  card,
  onEdit,
}: {
  card: Annotation;
  onEdit: (id: string, patch: Partial<Annotation>) => void;
}) {
  const studyId = useStudyStore((s) => s.current?.id ?? '');
  const images = card.images ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const { estimate, refresh } = useStorageEstimate();
  // Browser storage is where everything lives (no server) — warn before it fills up.
  const storageTight = estimate.fraction != null && estimate.fraction > 0.8;

  // Resolve an object URL per thumbnail from the stored bytes; revoke on change / unmount (no leaks).
  const idsKey = images.map((r) => r.id).join(',');
  useEffect(() => {
    let live = true;
    const created: string[] = [];
    void (async () => {
      const next: Record<string, string> = {};
      for (const ref of images) {
        const rec = await getImage(ref.id);
        if (!rec) continue;
        const url = URL.createObjectURL(bytesToBlob(rec.bytes, rec.mime));
        created.push(url);
        next[ref.id] = url;
      }
      if (live) setUrls(next);
      else created.forEach((u) => URL.revokeObjectURL(u));
    })();
    return () => {
      live = false;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
    // Re-run only when the set of image ids changes (caption edits don't touch the bytes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const patchImages = (next: ImageRef[]) => onEdit(card.id, { images: next });

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    const result = await processImageFile(file);
    if (!isProcessed(result)) {
      setBusy(false);
      setError(result.error);
      return;
    }
    const id = newId();
    try {
      await putImage(id, { studyId, bytes: result.bytes, mime: result.mime, w: result.w, h: result.h });
    } catch {
      // Out of browser storage — block this add (existing images are never touched).
      setBusy(false);
      setError('Storage is full — can’t add more images. Remove one, or export your study and clear space.');
      return;
    }
    patchImages([...images, { id, caption: '', w: result.w, h: result.h }]);
    setBusy(false);
    refresh(); // re-poll the quota so the warning appears promptly after a big add
  };

  const setCaption = (id: string, caption: string) =>
    patchImages(images.map((r) => (r.id === id ? { ...r, caption } : r)));

  const remove = (id: string) => {
    patchImages(images.filter((r) => r.id !== id));
    void deleteImage(id);
  };

  const dropOn = (overId: string) => {
    if (!dragId || dragId === overId) return;
    const from = images.findIndex((r) => r.id === dragId);
    const to = images.findIndex((r) => r.id === overId);
    setDragId(null);
    if (from < 0 || to < 0) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    patchImages(next);
  };

  // Keyboard-accessible reorder (§4.4) — an alternative to drag, since the order sets print order.
  const move = (id: string, dir: -1 | 1) => {
    const from = images.findIndex((r) => r.id === id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    patchImages(next);
  };

  return (
    <div className="mt-1.5">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {images.map((ref, i) => (
            <div
              key={ref.id}
              draggable
              onDragStart={() => setDragId(ref.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(ref.id)}
              className="w-[92px]"
            >
              <div className="relative h-[69px] w-[92px] overflow-hidden rounded-md border border-line bg-panel">
                {urls[ref.id] ? (
                  <img
                    src={urls[ref.id]}
                    alt={ref.caption || 'Attached image'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-ink-faint">🖼</span>
                )}
                {/* Keyboard-accessible reorder (drag alternative) — the order is the print order. */}
                {images.length > 1 && (
                  <div className="absolute bottom-1 left-1 flex gap-0.5">
                    <button
                      type="button"
                      aria-label="Move image earlier"
                      disabled={i === 0}
                      onClick={() => move(ref.id, -1)}
                      className="grid size-4 place-items-center rounded bg-black/55 text-[10px] leading-none text-white hover:bg-black/75 disabled:opacity-30"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      aria-label="Move image later"
                      disabled={i === images.length - 1}
                      onClick={() => move(ref.id, 1)}
                      className="grid size-4 place-items-center rounded bg-black/55 text-[10px] leading-none text-white hover:bg-black/75 disabled:opacity-30"
                    >
                      ▶
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => remove(ref.id)}
                  className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-black/55 text-[10px] leading-none text-white hover:bg-black/75"
                >
                  ✕
                </button>
              </div>
              <input
                value={ref.caption}
                onChange={(e) => setCaption(ref.id, e.target.value)}
                placeholder="caption…"
                aria-label="Image caption"
                className="mt-1 w-full rounded-[5px] border border-line bg-panel px-1.5 py-0.5 text-[10px] text-ink-soft outline-none placeholder:italic placeholder:text-ink-faint"
              />
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.currentTarget.value = ''; // allow re-picking the same file
        }}
      />
      {images.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          title="Attach your own image (map, diagram, photo…) — it prints with this card"
          className="mt-1.5 font-mono text-[9.5px] text-ink-soft hover:text-ink disabled:opacity-60"
        >
          {busy ? '⋯ adding…' : '🖼 add image'}
        </button>
      )}
      {error && <p className="mt-1 text-[10.5px] text-rubric">{error}</p>}
      {storageTight && !error && (
        <p className="mt-1 rounded border border-amber-edge bg-amber-wash px-2 py-1 text-[10px] leading-[1.4] text-[#8a6a16] dark:text-[#e2c87c]">
          ⚠ Browser storage {Math.round((estimate.fraction ?? 0) * 100)}% full — big images may not save.
          Everything is kept in your browser; export a copy to be safe.
        </p>
      )}
    </div>
  );
}
