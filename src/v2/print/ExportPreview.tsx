import { useLayoutEffect, useRef, useState } from 'react';

import { exportOptions } from '@/lib/export';
import { primaryText } from '@/lib/passage';
import type { ParsedText } from '@/types/passage';
import type { ImageRef, Study } from '@/types/study';
import { exportModel, participantBlocks, type ExportBlock, type SupportRef } from '@/v2/exportModel';
import { PrintPassage } from '@/v2/print/PrintPassage';
import { parseMentions } from '@/v2/reader/mentions';
import { supersede } from '@/v2/revisions';

/**
 * The v2 export renderer (V2-UX-BACKLOG §7.5) — one component for both the **Build live preview**
 * and the **print routes**, so the two can never drift. It renders the {@link exportModel}: an
 * interleaved sequence of numbered **questions** (with write-lines) and **study-note** blocks, each
 * with its included references as **support passages**. `variant` picks the document: the
 * *participant* handout is clean (no answers, hidden study notes dropped, ruled write-lines); the
 * *leader* notes carry everything (expected answers + metadata, the weighed theme/aim, hidden notes
 * marked leader-only). The export "paper" is always light — it is a print preview.
 *
 * Support-passage text is fetched by the caller (print routes) and passed in `supportTexts` keyed by
 * OSIS; the in-app preview omits it and shows the reference alone. A faint page-cut guide marks where
 * each printed page would end (approximate — content flows continuously).
 */
const PAGE_PX = 940; // approximate printed-page content height at the preview width

/** Per-study font size → a uniform document zoom. Applied on the root so the preview + the print
 *  route + the PDF all scale together; the print engine paginates the zoomed content correctly. */
const FONT_ZOOM: Record<'s' | 'm' | 'l', number> = { s: 0.9, m: 1, l: 1.14 };

function MentionText({ text }: { text: string }) {
  return (
    <>
      {parseMentions(text).map((seg, i) =>
        seg.type === 'mention' ? (
          <span key={i} className="font-medium text-[#28468a]">
            {seg.reference}
          </span>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </>
  );
}

function SupportPassage({ support, text }: { support: SupportRef; text?: ParsedText | null }) {
  return (
    <div className="my-2 rounded-md border-l-[3px] border-l-[#28468a] bg-[rgba(40,70,138,0.06)] px-3 py-2">
      <p className="mb-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#17305f]">
        ↗ Support passage — {support.reference}
      </p>
      {text ? (
        <div className="text-[12.5px] leading-[1.5] text-[#1d1b17]">
          <PrintPassage passage={text} />
        </div>
      ) : (
        <p className="text-[12px] italic text-[#6c6760]">Read {support.reference} together.</p>
      )}
    </div>
  );
}

function AttachedImage({ image, src }: { image: ImageRef; src?: string }) {
  if (!src) return null; // bytes not resolved (or missing) → render nothing rather than a broken box
  const ratio = image.w && image.h ? `${image.w} / ${image.h}` : undefined;
  return (
    <figure className="my-2 max-w-[340px]">
      <img
        src={src}
        alt={image.caption || 'Attached image'}
        style={ratio ? { aspectRatio: ratio } : undefined}
        className="w-full rounded border border-[#ddd7c9] object-contain"
      />
      {image.caption && (
        <figcaption className="mt-1 font-mono text-[9px] italic text-[#6f6a60]">{image.caption}</figcaption>
      )}
    </figure>
  );
}

function QuestionMeta({ block }: { block: Extract<ExportBlock, { kind: 'question' }> }) {
  const bits = [
    block.anchorLabel,
    block.questionType,
    block.essential ? '★ essential' : null,
    `${block.minutes} min`,
    block.aimComponent ? `aim: ${block.aimComponent}` : null,
  ].filter(Boolean);
  return <p className="mt-1 font-mono text-[8.5px] text-[#6c6760]">{bits.join(' · ')}</p>;
}

export interface ExportPreviewProps {
  study: Study;
  variant: 'participant' | 'leader';
  supportTexts?: Record<string, ParsedText | null>;
  /** Attached-image sources keyed by image id — a `data:` URL (print) or object URL (preview). The
   *  caller resolves these (see `resolveImageDataUrls`); absent → images don't render. */
  imageUrls?: Record<string, string>;
  /** Fill the container (drop the centered max-width) — for the side-by-side Parallel view. */
  fill?: boolean;
  /** `preview` (default) = the in-app paper with page-cut guides; `print` = bare content for the
   *  print route (no guides, no paper chrome — PrintShell provides the page). */
  mode?: 'preview' | 'print';
}

export function ExportPreview({ study, variant, supportTexts, imageUrls, fill, mode = 'preview' }: ExportPreviewProps) {
  const isPrint = mode === 'print';
  const model = exportModel(study);
  const opts = exportOptions(study);
  const passage = primaryText(study.passage);
  const isLeader = variant === 'leader';
  const blocks = isLeader ? model.blocks : participantBlocks(model);

  // Page-cut guide: measure the sheet and draw a dashed line at each page boundary.
  const bodyRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setPages(Math.max(1, Math.ceil(el.scrollHeight / PAGE_PX)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // `imageUrls` in the deps so the page count re-measures once async images load in.
  }, [study, variant, imageUrls]);

  const theme = supersede(study.themeAim.theme, study.themeAim.themeRevisions).primary.trim();
  const aim = supersede(study.themeAim.groupAim, study.themeAim.aimRevisions).primary.trim();

  return (
    <div
      className={
        isPrint
          ? 'w-full text-[#1d1b17]'
          : `${fill ? 'w-full' : 'mx-auto w-full max-w-[46rem]'} rounded-md border border-[#e6e1d4] bg-[#fdfcf8] text-[#1d1b17] shadow-[0_1px_2px_rgba(30,27,20,0.05),0_10px_26px_-12px_rgba(30,27,20,0.2)]`
      }
      style={{ zoom: FONT_ZOOM[study.fontScale] }}
    >
      <div ref={bodyRef} className={isPrint ? 'relative' : 'relative px-[clamp(24px,4vw,52px)] py-9'}>
        {/* page-cut guides — the in-app preview only */}
        {!isPrint &&
          Array.from({ length: pages - 1 }, (_, i) => (
          <div
            key={i}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 flex items-center gap-2 text-[#a6321e]"
            style={{ top: (i + 1) * PAGE_PX }}
          >
            <span className="h-px flex-1 border-t border-dashed border-[rgba(166,50,30,0.4)]" />
            <span className="font-mono text-[8px] uppercase tracking-[0.1em]">
              page {i + 1} ends · page {i + 2}
            </span>
            <span className="h-px flex-1 border-t border-dashed border-[rgba(166,50,30,0.4)]" />
          </div>
        ))}

        <span
          className="mb-3 inline-block rounded-[5px] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white"
          style={{ background: isLeader ? '#a6321e' : '#28468a' }}
        >
          {isLeader ? 'Leader’s notes · everything' : 'Participant handout · clean & answer-free'}
        </span>
        <h1 className="font-scripture text-[21px] leading-tight">{model.reference || 'Bible study'}</h1>
        <p className="font-mono text-[9px] text-[#6c6760]">{opts.translationName}</p>

        {isLeader ? (
          (theme || aim) && (
            <div className="mt-3 rounded-md border border-[#e6e1d4] bg-[rgba(166,50,30,0.04)] px-3 py-2 text-[12.5px] leading-[1.5]">
              {theme && (
                <p>
                  <b className="font-semibold">Theme:</b> {theme}
                </p>
              )}
              {aim && (
                <p className="mt-1">
                  <b className="font-semibold">Aim:</b> {aim}
                </p>
              )}
              {study.themeAim.christRoute.trim() && (
                <p className="mt-1">
                  <b className="font-semibold">To Christ:</b> {study.themeAim.christRoute.trim()}
                </p>
              )}
            </div>
          )
        ) : (
          <>
            {model.intro && <p className="mt-2 text-[13px] leading-[1.5] text-[#6c6760]">{model.intro}</p>}
            {passage && (
              <div className="mt-3 border-b border-[#e6e1d4] pb-3 text-[12.5px] leading-[1.6] text-[#6c6760]">
                <PrintPassage passage={passage} />
              </div>
            )}
          </>
        )}

        {blocks.length === 0 ? (
          <p className="mt-6 text-[13px] italic text-[#6c6760]">
            Nothing to preview yet — author questions and study notes in the Write lens.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {blocks.map((block) =>
              block.kind === 'question' ? (
                <div key={block.id} data-preview-block="question">
                  <p className="font-scripture text-[14.5px] leading-snug">
                    <span className="mr-1 font-semibold">{block.number}.</span>
                    {block.text || <span className="italic text-[#a49e92]">(no question text)</span>}
                  </p>
                  {block.support.map((s) => (
                    <SupportPassage key={s.osis} support={s} text={supportTexts?.[s.osis]} />
                  ))}
                  {block.images.map((im) => (
                    <AttachedImage key={im.id} image={im} src={imageUrls?.[im.id]} />
                  ))}
                  {isLeader ? (
                    <>
                      {block.expectedAnswer.trim() && (
                        <p className="mt-1 text-[12.5px] text-[#1d1b17]">
                          <b className="font-mono text-[8px] uppercase tracking-[0.06em] text-[#3c5330]">Expected · </b>
                          {block.expectedAnswer}
                        </p>
                      )}
                      <QuestionMeta block={block} />
                    </>
                  ) : (
                    <div className="mt-2 space-y-2.5" aria-hidden>
                      {Array.from({ length: block.writeLines }, (_, i) => (
                        <div key={i} className="h-px border-b border-[#e6e1d4]" />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  key={block.id}
                  data-preview-block="study-note"
                  className="rounded-md border border-[rgba(106,75,147,0.4)] bg-[rgba(106,75,147,0.08)] px-3 py-2.5"
                >
                  <p className="mb-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#503670]">
                    ▣ Study note{isLeader && block.hideFromGroup ? ' · leader only' : ''}
                  </p>
                  <p className="font-scripture text-[13px] leading-[1.55] text-[#1d1b17]">
                    <MentionText text={block.text} />
                  </p>
                  {block.support.map((s) => (
                    <SupportPassage key={s.osis} support={s} text={supportTexts?.[s.osis]} />
                  ))}
                  {block.images.map((im) => (
                    <AttachedImage key={im.id} image={im} src={imageUrls?.[im.id]} />
                  ))}
                </div>
              ),
            )}
          </div>
        )}

        {model.prayerPoint && (
          <div className="mt-5 border-t border-[#e6e1d4] pt-3">
            <p className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#6c6760]">Prayer</p>
            <p className="font-scripture text-[13px]">{model.prayerPoint}</p>
          </div>
        )}

        <div className="mt-6 border-t border-[#e6e1d4] pt-3">
          <p className="font-mono text-[8px] text-[#6c6760]">{opts.copyrightLine}</p>
          {isLeader &&
            opts.methodAttributions?.map((a, i) => (
              <p key={i} className="font-mono text-[8px] text-[#6c6760]">
                {a}
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}
