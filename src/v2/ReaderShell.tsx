import { useCallback, useEffect, useMemo, useState } from 'react';

import { BUNDLED_TRANSLATIONS, findTranslation, loadReading } from '@/lib/bible';
import { newId } from '@/lib/id';
import { mergeSectionUp, renameSection, splitSectionAt, wholePassageSection } from '@/lib/map';
import { parseReference } from '@/lib/verse';
import { addSecondary, primaryText, removeTranslation, translationOrder } from '@/lib/passage';
import { verseIdInRange } from '@/lib/verse/ids';
import { cn } from '@/lib/utils';
import { allVerses, verseIds } from '@/types/passage';
import { useStudyStore } from '@/store/study';
import type { Annotation, Section, Study } from '@/types/study';
import { anchorToneByVerse, makeAnnotation, toneFor, type AnnotationTone } from '@/v2/annotations';
import { CommandBar } from '@/v2/CommandBar';
import { CommandPalette } from '@/v2/CommandPalette';
import { DayNightToggle } from '@/v2/DayNightToggle';
import { LENSES, LENS_ICON, type LensId } from '@/v2/lenses';
import { BuildLens } from '@/v2/lenses/BuildLens';
import { CheckLens } from '@/v2/lenses/CheckLens';
import { SetupLens } from '@/v2/lenses/SetupLens';
import { ThemeAimLens } from '@/v2/lenses/ThemeAimLens';
import { buildReaderModel, manuscriptModel } from '@/v2/reader/model';
import { ComaPanel } from '@/v2/reader/ComaPanel';
import { MarginAnnotations } from '@/v2/reader/MarginAnnotations';
import { ParallelCanvas } from '@/v2/reader/ParallelCanvas';
import { ReadPanel } from '@/v2/reader/ReadPanel';
import { ReaderCanvas, type ReadingMode } from '@/v2/reader/ReaderCanvas';
import { TranslationControls } from '@/v2/TranslationControls';
import type { ActionKind } from '@/v2/reader/ActionBar';
import type { PaletteAction, PaletteContext } from '@/v2/reader/paletteItems';

/**
 * The v2 shell (ROADMAP-v2 §1) — top bar, lens rail, the central **leaf**, the right margin,
 * and the command bar, in day/night. It is the stateful orchestrator: it owns the transient
 * reader state (selection, two-way hover, the flash cue, the active lens) and routes every
 * persisted change (marks, sections, setup) through the shared study store. The load-bearing
 * logic stays in the pure libs (`buildReaderModel`, `selection.ts`, `map.ts`); this component
 * wires them to the store — the house pattern.
 */
/** The reading mode is a global display preference (v2.5), remembered like the ink-saver toggle. */
const READING_MODE_KEY = 'qth2/reading-mode';
function loadReadingMode(): ReadingMode {
  try {
    return localStorage.getItem(READING_MODE_KEY) === 'manuscript' ? 'manuscript' : 'formatted';
  } catch {
    return 'formatted';
  }
}

export function ReaderShell({ study }: { study: Study }) {
  const applyToCurrent = useStudyStore((s) => s.applyToCurrent);
  const setPassage = useStudyStore((s) => s.setPassage);
  const updateSetup = useStudyStore((s) => s.updateSetup);

  const passage = primaryText(study.passage);
  const sections = study.map.sections;
  const annotations = study.annotations;

  const [lens, setLens] = useState<LensId>(passage ? 'map' : 'setup');
  const [readingMode, setReadingMode] = useState<ReadingMode>(loadReadingMode);
  // Parallel (side-by-side) reading state (v2.9) — transient; the primary switch itself persists.
  const [parallelOn, setParallelOn] = useState(false);
  const [parallelSecondaryId, setParallelSecondaryId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [lastAnchor, setLastAnchor] = useState<string | null>(null);
  const [hoveredVerse, setHoveredVerse] = useState<string | null>(null);
  const [litAnnotation, setLitAnnotation] = useState<{ ids: string[]; tone: AnnotationTone } | null>(null);
  const [flashVerse, setFlashVerse] = useState<string | null>(null);
  const [focusAnnotationId, setFocusAnnotationId] = useState<string | null>(null);
  const clearFocusAnnotation = useCallback(() => setFocusAnnotationId(null), []);
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);
  const clearFocusSection = useCallback(() => setFocusSectionId(null), []);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const model = useMemo(() => (passage ? buildReaderModel(passage, sections) : null), [passage, sections]);
  // Manuscript mode renders a flattened copy of the model (display-only; the data is untouched).
  const renderModel = useMemo(
    () => (model && readingMode === 'manuscript' ? manuscriptModel(model) : model),
    [model, readingMode],
  );
  const changeReadingMode = useCallback((m: ReadingMode) => {
    setReadingMode(m);
    try {
      localStorage.setItem(READING_MODE_KEY, m);
    } catch {
      /* storage unavailable — the mode still applies for this session */
    }
  }, []);
  const anchorTone = useMemo(() => anchorToneByVerse(annotations), [annotations]);
  const pvIds = useMemo(() => (passage ? verseIds(passage) : []), [passage]);
  // OSIS keys of references already promoted to a support passage — mutes those inline chips and
  // guards against promoting the same reference twice.
  const promotedKeys = useMemo(
    () =>
      new Set(
        annotations
          .filter((a) => a.kind === 'cross-ref')
          .map((a) => parseReference(a.reference ?? '')?.osis)
          .filter((k): k is string => !!k),
      ),
    [annotations],
  );

  const clearSelection = () => {
    setSelected([]);
    setLastAnchor(null);
  };

  // Escape clears the live selection; "/" opens the command palette (unless typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection();
      if (e.key === '/') {
        const el = e.target as HTMLElement | null;
        const tag = el?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && !el?.isContentEditable) {
          e.preventDefault();
          setPaletteOpen(true);
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const setSections = (recipe: (prev: Section[]) => Section[]) =>
    applyToCurrent((s) => ({ ...s, map: { ...s.map, sections: recipe(s.map.sections) } }));

  const onDivide = (sectionId: string, boundaryVerseId: string) => {
    const newSectionId = newId();
    setSections((prev) => {
      const base = sectionId === '' ? [wholePassageSection(pvIds, newId())] : prev;
      const targetId = sectionId === '' ? base[0]!.id : sectionId;
      return splitSectionAt(base, targetId, boundaryVerseId, pvIds, newSectionId);
    });
    // Focus the just-created section's name input so it can be named immediately.
    setFocusSectionId(newSectionId);
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

  const addAnnotation = (a: Annotation) => {
    applyToCurrent((s) => ({ ...s, annotations: [...s.annotations, a] }));
    setFocusAnnotationId(a.id);
  };

  // The floating action bar → one shared annotation over the present verses of the selection.
  const onAction = (kind: ActionKind) => {
    if (!passage || selected.length === 0) return;
    const present = new Set(allVerses(passage).filter((v) => v.present).map((v) => v.verseId));
    const verseIdsSel = selected.filter((id) => present.has(id));
    clearSelection();
    if (verseIdsSel.length === 0) return;
    const a =
      kind === 'mark'
        ? makeAnnotation(newId(), { kind: 'note', verseIds: verseIdsSel, flag: 'confusing' })
        : kind === 'ask'
          ? makeAnnotation(newId(), { kind: 'question', verseIds: verseIdsSel })
          : makeAnnotation(newId(), { kind: 'note', verseIds: verseIdsSel });
    addAnnotation(a);
  };

  const onAddFloating = () => addAnnotation(makeAnnotation(newId(), { kind: 'note', verseIds: [] }));

  // Promote an inline @-mention (inside a note) to a cross-ref annotation anchored to the host's
  // verses — this is what `projectForExport` turns into a printed Support passage. De-duped by OSIS.
  const onPromoteMention = (host: Annotation, reference: string) => {
    const key = parseReference(reference)?.osis;
    if (key && promotedKeys.has(key)) return;
    addAnnotation({ ...makeAnnotation(newId(), { kind: 'cross-ref', verseIds: host.verseIds }), reference });
  };

  const onEditAnnotation = (id: string, patch: Partial<Annotation>) =>
    applyToCurrent((s) => ({
      ...s,
      annotations: s.annotations.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));

  const onRemoveAnnotation = (id: string) =>
    applyToCurrent((s) => ({ ...s, annotations: s.annotations.filter((a) => a.id !== id) }));

  const onReorder = (ids: string[]) => applyToCurrent((s) => ({ ...s, runningOrder: ids }));

  const onJump = (verseId: string) => {
    const el = document.querySelector(`[data-v="${CSS.escape(verseId)}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Start the flash only after the smooth scroll has settled, then let it run its 2s fade.
    window.setTimeout(() => {
      setFlashVerse(verseId);
      window.setTimeout(() => setFlashVerse((cur) => (cur === verseId ? null : cur)), 2000);
    }, 450);
  };

  // From the Build lens, jump to a question's verses: switch to Map, then scroll once it mounts.
  const jumpFromBuild = (verseId: string) => {
    setLens('map');
    window.setTimeout(() => onJump(verseId), 60);
  };

  // ---- the "/" command palette ------------------------------------------------------------
  const paletteCtx: PaletteContext = useMemo(
    () => ({
      passageVerseIds: pvIds,
      hasSelection: selected.length > 0,
      translations: translationOrder(study.passage).map((id) => {
        const tr = findTranslation(id);
        return {
          id,
          name: tr?.name ?? id,
          shortName: tr?.shortName ?? id,
          isPrimary: id === study.passage.primaryId,
        };
      }),
      lenses: LENSES.map((l) => ({ id: l.id, name: l.name })),
    }),
    [pvIds, selected.length, study.passage],
  );

  // Switching among loaded translations only re-designates the primary — every translation is
  // kept (the old primary becomes a comparison text), so the parallel view swaps columns rather
  // than dropping a side. (`setPrimary` from M3 intentionally *drops* the old primary; that's the
  // wrong semantics once the reader holds several translations.)
  const switchTranslation = async (id: string) => {
    if (id === study.passage.primaryId || !study.passage.translations[id]) return;
    await setPassage({ ...study.passage, primaryId: id });
    updateSetup({ primaryTranslationId: id });
  };

  // ---- translations: the top-bar switcher + parallel (side-by-side) view ------------------
  const loadedTranslations = useMemo(
    () =>
      translationOrder(study.passage).map((id) => {
        const t = findTranslation(id);
        return { id, name: t?.name ?? id, shortName: t?.shortName ?? id, isPrimary: id === study.passage.primaryId };
      }),
    [study.passage],
  );
  const availableTranslations = useMemo(
    () => BUNDLED_TRANSLATIONS.filter((t) => !study.passage.translations[t.id]).map((t) => ({ id: t.id, name: t.name, shortName: t.shortName })),
    [study.passage],
  );
  // The effective secondary is a loaded non-primary id (falls back to the first when unset/stale).
  const secondaryIds = loadedTranslations.filter((t) => !t.isPrimary).map((t) => t.id);
  const effectiveSecondaryId =
    parallelSecondaryId && secondaryIds.includes(parallelSecondaryId) ? parallelSecondaryId : (secondaryIds[0] ?? null);
  const parallelActive = parallelOn && effectiveSecondaryId != null && passage != null;

  const addTranslation = async (id: string) => {
    const ref = parseReference(study.setup.reference || passage?.reference || '');
    if (!ref) return;
    const text = await loadReading(id, ref);
    await setPassage(addSecondary(study.passage, text));
  };
  const removeSecondary = async (id: string) => {
    if (parallelSecondaryId === id) setParallelSecondaryId(null);
    await setPassage(removeTranslation(study.passage, id));
  };

  const onPaletteAction = (action: PaletteAction) => {
    switch (action.type) {
      case 'jump':
        onJump(action.verseId);
        break;
      case 'create':
        onAction(action.kind);
        break;
      case 'switch-translation':
        void switchTranslation(action.id);
        break;
      case 'go-lens':
        setLens(action.lens);
        break;
      case 'fill':
        break; // handled inside the palette
    }
  };

  // ---- top-bar / leaf labels --------------------------------------------------------------
  const tr = passage ? findTranslation(passage.translationId) : undefined;
  const reference = study.setup.title || study.setup.reference || passage?.reference || 'Untitled study';
  const leafTitle = study.setup.title || passage?.reference || study.setup.reference || 'Passage';
  const leafMeta = passage ? `${tr?.shortName ?? passage.translationId} · public domain` : '';
  const activeIndex = LENSES.findIndex((l) => l.id === lens);

  // ---- lens content ----------------------------------------------------------------------
  const litForCanvas = litAnnotation
    ? { ids: new Set(litAnnotation.ids), tone: litAnnotation.tone }
    : null;

  let center: React.ReactNode;
  let margin: React.ReactNode;

  if (lens === 'setup') {
    center = <SetupLens study={study} onLoaded={() => setLens('map')} />;
    margin = <MarginPlaceholder text="Load a passage on the left, then move to the Map lens to divide and mark it." />;
  } else if (!passage || !model) {
    center = <EmptyLeaf onSetup={() => setLens('setup')} />;
    margin = <MarginPlaceholder text="No passage yet." />;
  } else if (lens === 'build') {
    center = (
      <BuildLens
        annotations={annotations}
        runningOrder={study.runningOrder}
        onReorder={onReorder}
        onEdit={onEditAnnotation}
        onRemove={onRemoveAnnotation}
        onJump={jumpFromBuild}
      />
    );
    margin = (
      <MarginPlaceholder text="The running order is the sequence that exports. Reorder it on the left; jump back to any question to refine it in Map." />
    );
  } else if (lens === 'theme') {
    center = <ThemeAimLens study={study} />;
    margin = (
      <MarginPlaceholder text="The theme & aim are the study's spine — every question should serve them. They carry into the leader's notes." />
    );
  } else if (lens === 'check') {
    center = <CheckLens study={study} />;
    margin = (
      <MarginPlaceholder text="Produce the two documents here. The running order (Build) is what they contain." />
    );
  } else {
    const interactive = lens === 'map';
    center = parallelActive ? (
      <ParallelCanvas
        primary={passage}
        secondary={study.passage.translations[effectiveSecondaryId!]!}
        primaryLabel={findTranslation(passage.translationId)?.shortName ?? passage.translationId}
        secondaryLabel={findTranslation(effectiveSecondaryId!)?.shortName ?? effectiveSecondaryId!}
        leafTitle={leafTitle}
        interactive={interactive}
        selected={selected}
        lastAnchor={lastAnchor}
        anchorTone={anchorTone}
        lit={litForCanvas}
        flashVerseId={flashVerse}
        onSelect={(r) => {
          setSelected(r.selected);
          setLastAnchor(r.lastAnchor);
        }}
        onVerseHover={setHoveredVerse}
        onAction={onAction}
      />
    ) : (
      <ReaderCanvas
        model={renderModel ?? model}
        interactive={interactive}
        mode={readingMode}
        onModeChange={changeReadingMode}
        leafTitle={leafTitle}
        leafMeta={leafMeta}
        selected={selected}
        lastAnchor={lastAnchor}
        anchorTone={anchorTone}
        lit={litForCanvas}
        flashVerseId={flashVerse}
        focusSectionId={focusSectionId}
        onSelect={(r) => {
          setSelected(r.selected);
          setLastAnchor(r.lastAnchor);
        }}
        onVerseHover={setHoveredVerse}
        onDivide={onDivide}
        onMerge={onMerge}
        onRename={onRename}
        onSelectSectionRange={onSelectSectionRange}
        onSectionFocusHandled={clearFocusSection}
        onAction={onAction}
      />
    );
    margin =
      lens === 'map' ? (
        <MarginAnnotations
          passage={passage}
          annotations={annotations}
          litVerseId={hoveredVerse}
          focusAnnotationId={focusAnnotationId}
          translationId={passage.translationId}
          promotedKeys={promotedKeys}
          onHover={(a) => setLitAnnotation(a ? { ids: a.verseIds, tone: toneFor(a) } : null)}
          onEdit={onEditAnnotation}
          onRemove={onRemoveAnnotation}
          onJump={onJump}
          onAddFloating={onAddFloating}
          onPromoteMention={onPromoteMention}
          onFocusHandled={clearFocusAnnotation}
        />
      ) : lens === 'read' ? (
        <ReadPanel study={study} />
      ) : lens === 'coma' ? (
        <ComaPanel study={study} />
      ) : (
        <MarginPlaceholder text="The text stays put; the overlay changes with the lens." />
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
        </div>
        {passage && (
          <TranslationControls
            translations={loadedTranslations}
            available={availableTranslations}
            parallelOn={parallelActive}
            secondaryId={effectiveSecondaryId}
            onSwitchPrimary={(id) => void switchTranslation(id)}
            onAddTranslation={(id) => void addTranslation(id)}
            onRemoveTranslation={(id) => void removeSecondary(id)}
            onToggleParallel={() => setParallelOn((on) => !on)}
            onPickSecondary={setParallelSecondaryId}
          />
        )}
        <div className="flex-1" />
        <nav aria-label="Study phases" className="hidden items-center gap-0.5 sm:flex">
          {LENSES.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLens(l.id)}
              aria-current={l.id === lens ? 'step' : undefined}
              aria-label={`${l.num} ${l.name}`}
              className={cn(
                'group relative grid size-8 place-items-center rounded-lg border border-transparent text-[15px]',
                l.id === lens
                  ? 'border-lapis bg-lapis text-white dark:text-[#16181d]'
                  : i < activeIndex
                    ? 'text-ink-soft hover:bg-panel hover:text-ink'
                    : 'text-ink-faint hover:bg-panel hover:text-ink',
              )}
            >
              {LENS_ICON[l.id]}
              <span className="pointer-events-none absolute left-1/2 top-9 z-40 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-leaf px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink opacity-0 shadow-leaf transition-opacity group-hover:opacity-100">
                {l.num} · {l.name}
              </span>
            </button>
          ))}
        </nav>
        <a
          href="#/about"
          title="Attribution & further reading"
          className="hidden font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint hover:text-ink sm:inline"
        >
          About
        </a>
        <DayNightToggle />
      </header>

      {/* main — passage/lens + margin (the lens rail now lives in the header) */}
      <div className="grid grid-cols-1 overflow-hidden md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="flex items-start justify-center overflow-y-auto px-6 pb-[120px] pt-10">
          {center}
        </main>

        <aside className="max-h-[40vh] overflow-y-auto border-t border-line bg-[color-mix(in_srgb,var(--desk)_88%,var(--leaf))] px-4 pb-[120px] pt-[22px] md:max-h-none md:border-l md:border-t-0">
          {margin}
        </aside>
      </div>

      <CommandBar onOpen={() => setPaletteOpen(true)} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        ctx={paletteCtx}
        onAction={onPaletteAction}
      />
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
