import { useCallback, useEffect, useMemo, useState } from 'react';

import { findTranslation } from '@/lib/bible';
import { newId } from '@/lib/id';
import {
  makeVerseMark,
  mergeSectionUp,
  renameSection,
  splitSectionAt,
  wholePassageSection,
} from '@/lib/map';
import { primaryText } from '@/lib/passage';
import { verseIdInRange } from '@/lib/verse/ids';
import { cn } from '@/lib/utils';
import { allVerses, verseIds } from '@/types/passage';
import { useStudyStore } from '@/store/study';
import type { Section, Study } from '@/types/study';
import { CommandBar } from '@/v2/CommandBar';
import { DayNightToggle } from '@/v2/DayNightToggle';
import { LENSES, LIVE_LENSES, type LensId } from '@/v2/lenses';
import { SetupLens } from '@/v2/lenses/SetupLens';
import { buildReaderModel } from '@/v2/reader/model';
import { MarginMarks } from '@/v2/reader/MarginMarks';
import { ReaderCanvas } from '@/v2/reader/ReaderCanvas';

/**
 * The v2 shell (ROADMAP-v2 §1) — top bar, lens rail, the central **leaf**, the right margin,
 * and the command bar, in day/night. It is the stateful orchestrator: it owns the transient
 * reader state (selection, two-way hover, the flash cue, the active lens) and routes every
 * persisted change (marks, sections, setup) through the shared study store. The load-bearing
 * logic stays in the pure libs (`buildReaderModel`, `selection.ts`, `map.ts`); this component
 * wires them to the store — the house pattern.
 */
export function ReaderShell({ study }: { study: Study }) {
  const applyToCurrent = useStudyStore((s) => s.applyToCurrent);

  const passage = primaryText(study.passage);
  const sections = study.map.sections;
  const marks = study.map.marks;

  const [lens, setLens] = useState<LensId>(passage ? 'map' : 'setup');
  const [selected, setSelected] = useState<string[]>([]);
  const [lastAnchor, setLastAnchor] = useState<string | null>(null);
  const [hoveredVerse, setHoveredVerse] = useState<string | null>(null);
  const [litFromMark, setLitFromMark] = useState<string[] | null>(null);
  const [flashVerse, setFlashVerse] = useState<string | null>(null);
  const [focusMarkId, setFocusMarkId] = useState<string | null>(null);
  const clearFocusMark = useCallback(() => setFocusMarkId(null), []);

  const model = useMemo(() => (passage ? buildReaderModel(passage, sections) : null), [passage, sections]);
  const anchoredVerseIds = useMemo(() => new Set(marks.map((m) => m.verseId)), [marks]);
  const pvIds = useMemo(() => (passage ? verseIds(passage) : []), [passage]);

  const clearSelection = () => {
    setSelected([]);
    setLastAnchor(null);
  };

  // Escape clears the live selection (mirrors the prototype).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const setSections = (recipe: (prev: Section[]) => Section[]) =>
    applyToCurrent((s) => ({ ...s, map: { ...s.map, sections: recipe(s.map.sections) } }));

  const onDivide = (sectionId: string, boundaryVerseId: string) => {
    setSections((prev) => {
      const base = sectionId === '' ? [wholePassageSection(pvIds, newId())] : prev;
      const targetId = sectionId === '' ? base[0]!.id : sectionId;
      return splitSectionAt(base, targetId, boundaryVerseId, pvIds, newId());
    });
  };

  const onMerge = (sectionId: string) => setSections((prev) => mergeSectionUp(prev, sectionId, pvIds));

  const onRename = (sectionId: string, name: string) => {
    if (sectionId === '') {
      // Naming the undivided passage materialises a real whole-passage section to carry it.
      setSections(() => [{ ...wholePassageSection(pvIds, newId()), name }]);
      return;
    }
    setSections((prev) => renameSection(prev, sectionId, name));
  };

  const onSelectSectionRange = (startVerseId: string, endVerseId: string) => {
    if (!passage) return;
    const ids = allVerses(passage)
      .filter((v) => v.present && verseIdInRange(v.verseId, startVerseId, endVerseId))
      .map((v) => v.verseId);
    setSelected(ids);
    setLastAnchor(ids[0] ?? null);
  };

  const onMark = () => {
    if (!passage || selected.length === 0) return;
    const byId = new Map(allVerses(passage).map((v) => [v.verseId, v]));
    const already = new Set(marks.filter((m) => m.kind === 'verse').map((m) => m.verseId));
    const fresh = selected
      .map((id) => byId.get(id))
      .filter((v): v is NonNullable<typeof v> => !!v && v.present && !already.has(v.verseId))
      .map((v) => makeVerseMark(v, newId()));
    clearSelection();
    if (fresh.length === 0) return;
    applyToCurrent((s) => ({ ...s, map: { ...s.map, marks: [...s.map.marks, ...fresh] } }));
    setFocusMarkId(fresh[0]!.id);
  };

  const onEditMark = (markId: string, note: string) =>
    applyToCurrent((s) => ({
      ...s,
      map: { ...s.map, marks: s.map.marks.map((m) => (m.id === markId ? { ...m, note } : m)) },
    }));

  const onRemoveMark = (markId: string) =>
    applyToCurrent((s) => ({ ...s, map: { ...s.map, marks: s.map.marks.filter((m) => m.id !== markId) } }));

  const onJump = (verseId: string) => {
    const el = document.querySelector(`[data-v="${CSS.escape(verseId)}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashVerse(verseId);
    window.setTimeout(() => setFlashVerse((cur) => (cur === verseId ? null : cur)), 1200);
  };

  // ---- top-bar / leaf labels --------------------------------------------------------------
  const tr = passage ? findTranslation(passage.translationId) : undefined;
  const reference = study.setup.title || study.setup.reference || passage?.reference || 'Untitled study';
  const leafTitle = study.setup.title || passage?.reference || study.setup.reference || 'Passage';
  const leafMeta = passage ? `${tr?.shortName ?? passage.translationId} · public domain` : '';
  const activeIndex = LENSES.findIndex((l) => l.id === lens);

  // ---- lens content ----------------------------------------------------------------------
  const litVerseIds = useMemo(() => new Set(litFromMark ?? []), [litFromMark]);

  let center: React.ReactNode;
  let margin: React.ReactNode;

  if (lens === 'setup') {
    center = <SetupLens study={study} onLoaded={() => setLens('map')} />;
    margin = <MarginPlaceholder text="Load a passage on the left, then move to the Map lens to divide and mark it." />;
  } else if (!passage || !model) {
    center = <EmptyLeaf onSetup={() => setLens('setup')} />;
    margin = <MarginPlaceholder text="No passage yet." />;
  } else {
    const interactive = lens === 'map';
    center = (
      <ReaderCanvas
        model={model}
        interactive={interactive}
        leafTitle={leafTitle}
        leafMeta={leafMeta}
        selected={selected}
        lastAnchor={lastAnchor}
        anchoredVerseIds={anchoredVerseIds}
        litVerseIds={litVerseIds}
        flashVerseId={flashVerse}
        onSelect={(r) => {
          setSelected(r.selected);
          setLastAnchor(r.lastAnchor);
        }}
        onVerseHover={setHoveredVerse}
        onDivide={onDivide}
        onMerge={onMerge}
        onRename={onRename}
        onSelectSectionRange={onSelectSectionRange}
        onMark={onMark}
      />
    );
    margin =
      lens === 'map' ? (
        <MarginMarks
          passage={passage}
          marks={marks}
          litMarkVerseId={hoveredVerse}
          focusMarkId={focusMarkId}
          onHoverMark={setLitFromMark}
          onEditMark={onEditMark}
          onRemove={onRemoveMark}
          onJump={onJump}
          onFocusHandled={clearFocusMark}
        />
      ) : (
        <MarginPlaceholder
          text={
            LIVE_LENSES.has(lens)
              ? 'Reading view — switch to Map to divide the passage and mark what confuses you.'
              : `The ${LENSES[activeIndex]?.name} lens arrives in a later slice (v2.6). The text stays put; the overlay changes.`
          }
        />
      );
  }

  return (
    <div className="grid h-dvh grid-rows-[auto_1fr_auto] bg-desk text-ink">
      {/* top bar */}
      <header className="flex h-14 items-center gap-5 border-b border-line bg-[color-mix(in_srgb,var(--desk)_82%,var(--leaf))] px-[22px]">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <a href="#/" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint hover:text-ink">
            Quick&nbsp;to&nbsp;Hear
          </a>
          <span className="truncate font-scripture text-[19px] tracking-[0.01em]">{reference}</span>
          {tr && (
            <span className="rounded-md border border-line bg-panel px-2 py-[3px] font-mono text-[11.5px] tracking-[0.02em] text-ink-soft">
              {tr.shortName}
            </span>
          )}
        </div>
        <div className="flex-1" />
        <nav aria-label="Study phases" className="hidden items-center gap-0.5 sm:flex">
          {LENSES.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLens(l.id)}
              aria-current={l.id === lens ? 'step' : undefined}
              title={l.name}
              className={cn(
                'grid size-6 place-items-center rounded-md border border-transparent font-mono text-[11px]',
                l.id === lens
                  ? 'border-lapis bg-lapis text-white dark:text-[#10131a]'
                  : i < activeIndex
                    ? 'text-ink-soft'
                    : 'text-ink-faint hover:text-ink',
              )}
            >
              {i + 1}
            </button>
          ))}
        </nav>
        <DayNightToggle />
      </header>

      {/* main 3-column */}
      <div className="grid grid-cols-1 overflow-hidden md:grid-cols-[64px_minmax(0,1fr)_300px] lg:grid-cols-[176px_minmax(0,1fr)_320px]">
        <aside
          aria-label="Phase lenses"
          className="hidden overflow-y-auto border-r border-line bg-[color-mix(in_srgb,var(--desk)_88%,var(--leaf))] px-3 py-4 md:block"
        >
          <div className="hidden px-2.5 pb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint lg:block">
            Lenses
          </div>
          {LENSES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLens(l.id)}
              aria-current={l.id === lens ? 'step' : undefined}
              className={cn(
                'flex w-full items-baseline gap-2.5 rounded-lg border-l-2 border-transparent px-2.5 py-2 text-left text-ink-soft hover:bg-lapis-wash hover:text-ink lg:justify-start',
                'justify-center',
                l.id === lens && 'border-l-lapis bg-lapis-wash text-lapis-ink',
              )}
            >
              <span className={cn('font-mono text-[11px]', l.id === lens ? 'text-lapis' : 'text-ink-faint')}>
                {l.num}
              </span>
              <span className={cn('hidden text-[13.5px] lg:inline', l.id === lens && 'font-semibold')}>
                {l.name}
              </span>
            </button>
          ))}
        </aside>

        <main className="flex items-start justify-center overflow-y-auto px-6 pb-[120px] pt-10">
          {center}
        </main>

        <aside className="max-h-[40vh] overflow-y-auto border-t border-line bg-[color-mix(in_srgb,var(--desk)_88%,var(--leaf))] px-4 pb-[120px] pt-[22px] md:max-h-none md:border-l md:border-t-0">
          {margin}
        </aside>
      </div>

      <CommandBar />
    </div>
  );
}

function MarginPlaceholder({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line p-3.5 text-[13px] leading-[1.55] text-ink-soft">
      {text}
    </div>
  );
}

function EmptyLeaf({ onSetup }: { onSetup: () => void }) {
  return (
    <article className="mx-auto w-full max-w-[42rem] rounded-leaf border border-dashed border-line bg-leaf px-10 py-16 text-center shadow-leaf">
      <h1 className="font-scripture text-[26px] text-ink">No passage loaded yet</h1>
      <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-soft">
        The passage is the canvas — everything else anchors to it. Load one to begin.
      </p>
      <button
        type="button"
        onClick={onSetup}
        className="mt-6 rounded-lg bg-lapis px-4 py-2 font-sans text-[14px] font-medium text-white hover:opacity-90 dark:text-[#10131a]"
      >
        Set up the passage →
      </button>
    </article>
  );
}
