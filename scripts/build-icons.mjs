// Rasterise the app icon (public/icon.svg) into the PNG sizes a PWA install needs.
//
// Deliberately DEPENDENCY-FREE: it drives the Chromium that Playwright already installs
// for the e2e suite (`@playwright/test`), so there is no new native dep (sharp/canvas) just
// to make icons. The generated PNGs are committed to `public/icons/` — regenerate only when
// `public/icon.svg` changes: `npm run build:icons`.
//
// Two flavours:
//   • "any"      — transparent corners, so the rounded-rect shape shows on light/dark chrome.
//   • "maskable" — full-bleed opaque background, so a platform mask (circle/squircle) never
//                  reveals a transparent corner. Apple-touch uses the same full-bleed render
//                  (iOS applies its own rounding and dislikes transparency).
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SVG_PATH = join(ROOT, 'public', 'icon.svg');
const OUT_DIR = join(ROOT, 'public', 'icons');
const BG = '#0f172a'; // matches the SVG's rounded-rect background

const TARGETS = [
  { file: 'icon-192.png', size: 192, bg: null },
  { file: 'icon-512.png', size: 512, bg: null },
  { file: 'icon-maskable-512.png', size: 512, bg: BG },
  { file: 'apple-touch-icon-180.png', size: 180, bg: BG },
];

const svg = await readFile(SVG_PATH, 'utf8');
await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
try {
  for (const { file, size, bg } of TARGETS) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    // Inline the SVG at the exact pixel size; its viewBox scales it crisply.
    const sized = svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
    const body = bg ? `style="margin:0;background:${bg}"` : 'style="margin:0"';
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"></head><body ${body}>${sized}</body></html>`,
      { waitUntil: 'networkidle' },
    );
    await page.screenshot({
      path: join(OUT_DIR, file),
      clip: { x: 0, y: 0, width: size, height: size },
      omitBackground: bg === null,
    });
    await page.close();
    console.log(
      `  wrote public/icons/${file} (${size}×${size}${bg ? ', maskable/opaque' : ', transparent'})`,
    );
  }
} finally {
  await browser.close();
}
console.log('Icons generated.');
