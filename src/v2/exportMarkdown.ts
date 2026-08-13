import { exportOptions } from '@/lib/export';
import type { Study } from '@/types/study';
import { exportModel, participantBlocks, type ExportBlock } from '@/v2/exportModel';
import { parseMentions } from '@/v2/reader/mentions';
import { supersede } from '@/v2/revisions';

/**
 * Markdown renderers for the v2 export (V2-UX-BACKLOG §7.5), from the same {@link exportModel} the
 * on-screen preview + print use — so the download can't drift. Questions and study notes render as
 * interleaved blocks; a study note's `@`-mentions show as their reference; included references list
 * as support passages. The participant copy is answer-free (hidden study notes drop); the leader copy
 * carries everything (expected answers, metadata, the weighed theme/aim). Pure strings; unit-tested.
 */
function noteText(text: string): string {
  return parseMentions(text)
    .map((s) => (s.type === 'mention' ? s.reference : s.value))
    .join('')
    .trim();
}

function support(block: ExportBlock): string[] {
  if (block.kind === 'spacer') return [];
  return block.support.map((s) => `> ↗ Support passage — ${s.reference}`);
}

/** Attached images as self-contained markdown — `![caption](data:…)`. `imageUrls` is resolved by the
 *  caller (base64 data URLs so the .md is portable); an unresolved image is simply omitted. */
function images(block: ExportBlock, imageUrls: Record<string, string>): string[] {
  if (block.kind === 'spacer') return [];
  return block.images.flatMap((im) => {
    const url = imageUrls[im.id];
    return url ? [`![${im.caption || 'image'}](${url})`] : [];
  });
}

export function handoutMarkdown(study: Study, imageUrls: Record<string, string> = {}): string {
  const model = exportModel(study);
  const opts = exportOptions(study);
  const out: string[] = [`# ${model.reference || 'Bible study'}`];
  if (model.intro) out.push('', model.intro);

  for (const block of participantBlocks(model)) {
    if (block.kind === 'spacer') continue; // print-only blank space — markdown carries no spacers
    if (block.kind === 'question') {
      out.push('', `${block.number}. ${block.text}`.trimEnd());
      out.push(...support(block));
      out.push(...images(block, imageUrls));
    } else {
      out.push('', `> **Study note** — ${noteText(block.text)}`);
      out.push(...support(block));
      out.push(...images(block, imageUrls));
    }
  }

  if (model.prayerPoint) out.push('', `**Prayer** — ${model.prayerPoint}`);
  out.push('', '---', `_${opts.copyrightLine}_`);
  return out.join('\n');
}

export function leaderMarkdown(study: Study, imageUrls: Record<string, string> = {}): string {
  const model = exportModel(study);
  const opts = exportOptions(study);
  const theme = supersede(study.themeAim.theme, study.themeAim.themeRevisions).primary.trim();
  const aim = supersede(study.themeAim.groupAim, study.themeAim.aimRevisions).primary.trim();

  const out: string[] = [`# ${model.reference || 'Bible study'} — leader’s notes`];
  if (theme) out.push('', `**Theme:** ${theme}`);
  if (aim) out.push('', `**Aim:** ${aim}`);
  if (study.themeAim.christRoute.trim()) out.push('', `**To Christ:** ${study.themeAim.christRoute.trim()}`);

  for (const block of model.blocks) {
    if (block.kind === 'spacer') continue; // print-only blank space — markdown carries no spacers
    if (block.kind === 'question') {
      out.push('', `${block.number}. ${block.text}`.trimEnd());
      if (block.expectedAnswer.trim()) out.push(`- **Expected:** ${block.expectedAnswer.trim()}`);
      const meta = [
        block.anchorLabel,
        block.questionType,
        `${block.minutes} min`,
        block.essential ? '★ essential' : null,
        block.aimComponent ? `aim: ${block.aimComponent}` : null,
      ].filter(Boolean);
      out.push(`- _${meta.join(' · ')}_`);
      out.push(...support(block));
      out.push(...images(block, imageUrls));
    } else {
      out.push('', `> **Study note**${block.hideFromGroup ? ' (leader only)' : ''} — ${noteText(block.text)}`);
      out.push(...support(block));
      out.push(...images(block, imageUrls));
    }
  }

  if (model.prayerPoint) out.push('', `**Prayer** — ${model.prayerPoint}`);
  out.push('', '---');
  for (const line of [opts.copyrightLine, ...(opts.methodAttributions ?? [])]) {
    if (line.trim()) out.push(`_${line}_`);
  }
  return out.join('\n');
}
