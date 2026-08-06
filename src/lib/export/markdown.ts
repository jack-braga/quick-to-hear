import { verseText, type ParsedText } from '@/types/passage';
import { parseVerseId } from '@/lib/verse/ids';
import type { HandoutModel, HandoutSupport, LeaderModel } from './model';

/**
 * Markdown renderers for the two artefacts (SPEC Phase 7: "each available as markdown").
 * Pure string builders over the export models — the handout keeps its guarantee (no
 * answers, copyright present) because it renders a {@link HandoutModel}, which already
 * excludes them.
 */

const TYPE_LABEL: Record<string, string> = {
  context: 'Context',
  observation: 'Observation',
  meaning: 'Meaning',
  application: 'Application',
};

/** Render a parsed reading as plain markdown paragraphs: each verse numbered, poetry
 *  lines broken, gaps shown honestly. Kept intentionally simple — the print page uses the
 *  richer React `PassageView`; this is the portable text copy. */
export function passageToMarkdown(passage: ParsedText): string {
  const paras: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) paras.push(current.join(' '));
    current = [];
  };

  for (const block of passage.blocks) {
    if (block.kind === 's1' || block.kind === 's2') {
      flush();
      const t = block.text?.map((f) => f.text).join(' ').trim();
      if (t) paras.push(`### ${t}`);
      continue;
    }
    if (block.kind === 'd') {
      flush();
      const t = block.text?.map((f) => f.text).join(' ').trim();
      if (t) paras.push(`*${t}*`);
      continue;
    }
    if (block.kind === 'b') {
      flush();
      continue;
    }
    const poetry = block.kind === 'q';
    if (poetry) flush();
    for (const v of block.verses) {
      const n = parseVerseId(v.verseId)?.verse ?? '';
      if (!v.present) {
        current.push(`**${n}** —`);
        continue;
      }
      current.push(`**${n}** ${verseText(v)}`);
      if (poetry) flush();
    }
  }
  flush();
  return paras.join('\n\n');
}

function writingSpace(): string {
  // Ruled space to write in — three blank lines the printout gives room for.
  return '\n\n&nbsp;\n\n&nbsp;\n\n';
}

// ---------------------------------------------------------------------------
// Participant handout
// ---------------------------------------------------------------------------

export function handoutToMarkdown(m: HandoutModel): string {
  const out: string[] = [];
  out.push(`# ${m.reference || 'Bible study'}`);
  if (m.intro) out.push(m.intro);

  if (m.passage) {
    out.push('## The passage');
    out.push(passageToMarkdown(m.passage));
  }

  if (m.questions.length) {
    out.push('## Questions');
    const supportBlock = (s: HandoutSupport): string => {
      const label = s.type === 'context' ? 'Context' : 'Quoted';
      const head = `> **${label}: ${s.reference}**`;
      const body = s.text ? `\n>\n> ${passageToMarkdown(s.text).replace(/\n/g, '\n> ')}` : '';
      const ret = s.returnQuestion ? `\n> \n> _${s.returnQuestion}_` : '';
      return `${head}${body}${ret}`;
    };
    for (const q of m.questions) {
      // Context frames the question (above); quoted passages follow the prompt (below). SPEC 6f.
      for (const s of q.support.filter((s) => s.type === 'context')) out.push(supportBlock(s));
      out.push(`**${q.number}.** ${q.text}`);
      for (const s of q.support.filter((s) => s.type === 'quoted')) out.push(supportBlock(s));
      out.push(writingSpace().trim());
    }
  }

  if (m.boxes.length) {
    out.push('## Background');
    for (const b of m.boxes) {
      const head = b.label ? `**${b.label}**` : '**Background**';
      const body = b.passage ? passageToMarkdown(b.passage) : b.text;
      out.push(`> ${head}${body ? `\n>\n> ${body.replace(/\n/g, '\n> ')}` : ''}`);
    }
  }

  if (m.prayerPoint) {
    out.push('## Prayer');
    out.push(m.prayerPoint);
  }

  if (m.copyrightLine) out.push(`---\n\n_${m.copyrightLine}_`);

  return out.join('\n\n') + '\n';
}

// ---------------------------------------------------------------------------
// Leader's notes (everything)
// ---------------------------------------------------------------------------

export function leaderToMarkdown(m: LeaderModel): string {
  const out: string[] = [];
  out.push(`# ${m.reference || 'Bible study'} — leader's notes`);

  out.push('## Theme & aim');
  if (m.theme) out.push(`**Theme.** ${m.theme}`);
  if (m.authorAim) out.push(`**Author's aim.** ${m.authorAim}`);
  if (m.groupAim) out.push(`**Aim for the group.** ${m.groupAim}`);
  const kfd: string[] = [];
  if (m.know) kfd.push(`- **Know:** ${m.know}`);
  if (m.feel) kfd.push(`- **Feel:** ${m.feel}`);
  if (m.do) kfd.push(`- **Do:** ${m.do}`);
  if (kfd.length) out.push(kfd.join('\n'));

  if (m.christRoute) {
    out.push('## How the passage gets to Christ');
    out.push(m.christRoute);
  }

  if (m.sections.length) {
    out.push('## Section map');
    out.push(m.sections.map((s) => `- ${s.name}${s.weight ? ` — _${s.weight}_` : ''}`).join('\n'));
  }

  out.push('## Questions');
  if (m.durationMinutes != null) {
    out.push(`_Estimated ≈ ${m.estimatedMinutes} min of ${m.durationMinutes}._`);
  }
  for (const q of m.questions) {
    const tags = [TYPE_LABEL[q.type] ?? q.type, q.weight];
    if (q.loadBearing) tags.push('load-bearing');
    if (q.gospelPlain) tags.push('gospel-plain');
    if (q.aimComponent) tags.push(q.aimComponent);
    if (q.pastoralFlag) tags.push('pastoral');
    out.push(`**${q.number}.** ${q.text}  \n_${tags.join(' · ')}${q.anchorLabel ? ` · ${q.anchorLabel}` : ''}_`);
    out.push(`- **Expected answer:** ${q.expectedAnswer}`);
    if (q.wrongTurns) out.push(`- **Wrong turns:** ${q.wrongTurns}`);
    for (const s of q.support) {
      out.push(`- **Support (${s.type}):** ${s.reference}${s.returnQuestion ? ` — return: _${s.returnQuestion}_` : ''}`);
    }
  }

  if (m.dropOrder.length) {
    out.push('## If you run short');
    out.push(`Drop these first (not load-bearing): ${m.dropOrder.map((n) => `Q${n}`).join(', ')}.`);
  }

  if (m.reserve.length) {
    out.push('## Held in reserve');
    out.push(m.reserve.map((r) => `- ${r}`).join('\n'));
  }

  if (m.pastoralNumbers.length) {
    out.push('## Pastoral sensitivity');
    out.push(`Handle with care: ${m.pastoralNumbers.map((n) => `Q${n}`).join(', ')}.`);
    out.push(
      m.questions
        .filter((q) => q.pastoralFlag)
        .map((q) => `- **Q${q.number}.** ${q.text}${q.pastoralNote ? `\n  _${q.pastoralNote}_` : ''}`)
        .join('\n'),
    );
  }

  if (m.prayerPoint) {
    out.push('## Prayer');
    out.push(m.prayerPoint);
  }

  if (m.attributions.length) {
    out.push('---');
    out.push(m.attributions.map((a) => `_${a}_`).join('\n\n'));
  }

  return out.join('\n\n') + '\n';
}
