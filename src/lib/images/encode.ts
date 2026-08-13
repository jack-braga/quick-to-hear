/**
 * Encoding helpers for attached-image bytes. Image data is stored as an **`ArrayBuffer`** (structured-
 * clones cleanly through IndexedDB in every environment, unlike a `Blob`; native + efficient at rest,
 * no base64 bloat). These pure functions convert to the string/Blob forms the other layers need: the
 * **project file** embeds base64 (JSON can't carry bytes); **print** renders a `data:` URL; **preview /
 * thumbnails** wrap the bytes in a `Blob` for an object URL. All pure → unit-testable.
 */

/** ArrayBuffer → bare base64 (no `data:` prefix) — for embedding in the project file. */
export function bytesToBase64(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let binary = '';
  const CHUNK = 0x8000; // chunk so a large image doesn't blow the String.fromCharCode arg limit
  for (let i = 0; i < arr.length; i += CHUNK) {
    binary += String.fromCharCode(...arr.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** Bare base64 (no prefix) → ArrayBuffer — decodes a project-file image back into storable bytes. */
export function base64ToBytes(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** ArrayBuffer + mime → full `data:` URL — for an `<img src>` in the print DOM (durable across print). */
export function bytesToDataUrl(bytes: ArrayBuffer, mime: string): string {
  return `data:${mime || 'application/octet-stream'};base64,${bytesToBase64(bytes)}`;
}

/** ArrayBuffer + mime → Blob — for `URL.createObjectURL` (authoring thumbnails / live preview). */
export function bytesToBlob(bytes: ArrayBuffer, mime: string): Blob {
  return new Blob([bytes], { type: mime });
}
