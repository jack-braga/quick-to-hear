/**
 * Turn a picked `File` into the bytes we store for an attached image — **fidelity-first**.
 *
 * The owner's rule: images (maps, diagrams, manuscript scans) must not come out blurry. So we
 * **keep the original bytes unchanged** for any image within a generous cap — zero quality loss for
 * normal images, and print gets full resolution. Only a genuinely oversized original is downscaled,
 * at high quality and **format-preserving** (PNG/graphics stay lossless PNG; JPEG/WebP re-encode at
 * q0.92). This only ever touches the *bytes*, never the *content* (rule 1 — the user supplies the
 * image; we never source or generate one).
 *
 * `shouldDownscale` is pure + unit-tested; `processImageFile` uses `createImageBitmap` + `<canvas>`
 * (browser only — verified live), so it is not exercised under jsdom.
 */

/** Longest edge (px) above which we downscale. Generous: a full-page map still prints crisp. */
export const MAX_EDGE = 4096;
/** File size (bytes) above which we re-compress even if the dimensions are within the edge cap. */
export const MAX_BYTES = 12 * 1024 * 1024; // 12 MB
/** The image types we accept (raster + WebP). SVG is deferred (odd sizing; no intrinsic raster dims). */
export const ACCEPTED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

export interface ProcessedImage {
  bytes: ArrayBuffer;
  mime: string;
  w: number;
  h: number;
}
export type ProcessResult = ProcessedImage | { error: string };

/** Pure policy: is this image big enough that we downscale it (vs. store the original untouched)? */
export function shouldDownscale(w: number, h: number, bytes: number): boolean {
  return Math.max(w, h) > MAX_EDGE || bytes > MAX_BYTES;
}

export function isProcessed(r: ProcessResult): r is ProcessedImage {
  return 'bytes' in r;
}

export async function processImageFile(file: File): Promise<ProcessResult> {
  if (!(ACCEPTED_MIME as readonly string[]).includes(file.type)) {
    return { error: "That file isn't an image (PNG, JPG, WebP, GIF)." };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { error: 'Couldn’t read that image — it may be corrupted.' };
  }
  const w = bitmap.width;
  const h = bitmap.height;

  // Fidelity-first: within the cap, store the original bytes exactly as given.
  if (!shouldDownscale(w, h, file.size)) {
    bitmap.close();
    return { bytes: await file.arrayBuffer(), mime: file.type, w, h };
  }

  // Oversized → high-quality downscale to the edge cap, format-preserving.
  const scale = MAX_EDGE / Math.max(w, h);
  const dw = Math.max(1, Math.round(w * scale));
  const dh = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return { bytes: await file.arrayBuffer(), mime: file.type, w, h }; // no canvas → keep original
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, dw, dh);
  bitmap.close();

  // PNG stays lossless PNG (line art / text); everything else → high-quality (q0.92) re-encode.
  const outMime = file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const quality = outMime === 'image/png' ? undefined : 0.92;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outMime, quality));
  if (!blob) return { bytes: await file.arrayBuffer(), mime: file.type, w, h };
  return { bytes: await blob.arrayBuffer(), mime: outMime, w: dw, h: dh };
}
