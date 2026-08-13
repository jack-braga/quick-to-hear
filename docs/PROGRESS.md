# Progress Tracker — Quick to Hear

> ⚠️ **v1 IS COMPLETE (Stages 0–10) AND NOW FROZEN AS A REFERENCE.** The active line of work is
> the **v2 text-central overhaul** — a clean break (no users, studies non-upgradable, v1 not
> maintained). **If you're here to build v2, read `docs/V2-SESSION-PROMPT.md` and
> `docs/ROADMAP-v2.md` instead.** This file below is the v1 build log — keep it only as the crib
> the v2 prompt points to.

---

## v2 — latest (2026-08-13)

> **The v2 progress log lives in `docs/ROADMAP-v2.md` §5 (full detail per item); the durable owner
> feedback + the authoritative flow are in `docs/V2-UX-BACKLOG.md` §7.** This is just the pointer so a
> fresh session sees the most recent arc. To resume v2: **`docs/V2-SESSION-PROMPT.md` → `ROADMAP-v2.md`
> (§4 build order, §5 log) → `V2-UX-BACKLOG.md` §7 (current flow) + §4 (remaining polish).**

**The v2 "flow redesign" is COMPLETE — shipped, gated, browser-verified, and pushed to `main`.** It
grew the flow to **10 lenses** and reworked how group-facing output is authored. All slices are logged
in `V2-UX-BACKLOG.md §7.8`; the design provenance is in `docs/HANDOFF-v2-authoring-build.md` (now
banner-marked COMPLETE). Newest first — all verified live + gated (`typecheck && lint && test (342) &&
e2e (30) && build`, 0 console errors):**

- **Reference-picker unification** (`c8c231f`) — question-attached references now use the same guided
  **book → chapter → verse `@`-autocomplete** the mention editor has (`ReferenceCombobox` over pure
  `referenceSuggest`). Closed the last deferred flow-redesign item.
- **Nav + persistence polish** (`e8154ee`, `94c7495`) — remember the active lens on reload; `Mark ·
  Confusing`→`Confusion`; **SVG lens icons** + the lens rail **moved into a footer** with Next/Prev.
- **The 10-lens flow** (`4035f4b` + slices) — inserted **Deepen (05)** + **Weigh (07)**; renamed
  **Map→Survey**, **Questions→Write**. Deepen/Weigh **append revisions** to cards (own-work vs 📖
  commentary); **Write** is the only place group-facing output is authored; **Build** = live export
  preview + per-card controls. Model + export are v2-native (`revisions.ts`, `exportModel.ts`).

**Next up:** no large threads are open — the redesign is fully shipped with nothing deferred. The
remaining backlog items are small and mostly **owner-decision-gated** (not "just build"):
- **§4 Set-Up UX once-over** — make the Set-Up page sleeker; consider doing step 1 in the right panel.
  Subjective/visual → prototype-led (mock, then the owner picks).
- **§2 Study-level annotation on phase 1** — add an unanchored question/note to the whole study on
  Set-Up (`verseIds:[]` already supported). *Re-confirm it still fits post-flow-redesign before building.*
- **§1 select-range → make a section** — owner yes/no (today: divide/merge + band-click only).
- **§1 add a prior card-type in a later lens** — owner to confirm the leaning (each lens adds its own
  type; a secondary affordance adds a prior type on demand).
- **§2 card-naming convention** — the flagged case is fixed (`Mark · Confusing`→`Confusion`, `note`→
  `comment`); residual is "owner may have more input."
(§3 "missing v1 value" — formulas/litmus/traps/soft-warnings — already landed with the Write/Theme
lenses; e2e locks it. The ParallelCanvas multi-tone/manuscript/sectioning gaps are also already fixed —
`bd0ae7a`/`9fce981`/`148caa7`.)

---

> **This is the first file to read in any session.** It records where the build
> actually is. Update it at the end of every stage (and any time you stop
> mid-stage): mark what's done, note deviations, say what the next session should
> do first, and give the exact commands to run and test right now.
>
> Read order: **this file → `PLAN.md` (current stage) → `SPEC.md` (behaviour)**.
> Teaching/help content is inventoried in `TEACHING-TEXT.md` (user-authored).

---

## Current status

- **Phase of work:** **Stage 10 complete → M4 (depth + worked examples + PWA). This completes the
  planned build (Stages 0–10).** Six threads landed. **(1) The worked-example [X] tier** is now
  *wired* end-to-end: `parseHelp` recognises a fourth `<!-- example -->` marker (→ `HelpEntry.example`),
  `useHelp` exposes `showExample` (full mode + non-empty), and `<Help>` renders it behind a **"See a
  worked example"** disclosure (BookOpen icon), sharing one `Disclosure` with "Tell me more". Empty
  keys render nothing; a filled `<!-- example -->` block appears with **zero code change** — the marker
  convention is documented in `TEACHING-TEXT.md §1`. **No prose authored by dev** (licensing boundary +
  no-dev-prose rule); the tier is machinery-complete, content-empty, exactly like the earlier COMA
  skeleton. **(2) The full attribution page** (`SPEC §7` / a Stage-10 PLAN item that was still unbuilt):
  new `/attribution` route renders the already-authored `attribution.page.md` **page** tier + its cited
  source line, with a footer link on every screen. **(3) Coverage-map polish (Phase 7)** realises the
  SPEC's *visual* map — a per-verse **touched/untouched pip strip** (`TouchStrip`, `aria-hidden` with
  the text summary carrying the same info), a **tagging-progress line** ("N of M untouched sections
  tagged"), and a **"✓ Tagged as X"** readout. **(4) Support-passage handout placement** now splits by
  function (SPEC 6f): **context** prints *above* its question (framing read first), **quoted** *below*
  the prompt (the reference the author sent them to), each with a light `Context`/`Quoted` label;
  mirrored in the markdown handout; background boxes unchanged. **(5) Pastoral flags enriched** — a new
  additive-optional **`Question.pastoralNote`** (no schemaVersion bump, like `wrongTurns`) captured in
  the 6e editor when the flag is set, surfaced per-question in the **leader's notes** (LeaderDocument +
  markdown) and **excluded from the handout** (guard-verified live). **(6) PWA hardened** — raster PNG
  icons (192 / 512 / 512-maskable / 180 apple-touch) generated from `icon.svg` by a **dependency-free**
  `scripts/build-icons.mjs` that drives the Playwright chromium already installed for e2e
  (`npm run build:icons`); manifest updated; workbox tuned (`cleanupOutdatedCaches`,
  `navigateFallbackDenylist` for `/bibles/`); `registerType` switched **autoUpdate → prompt** with a
  `<PwaReloadToast>` ("New version — Reload" + a one-time "Ready to work offline"), the SW registered by
  `useRegisterSW` (vitest **aliases** `virtual:pwa-register/react` to an inert stub). **Also folded in
  the carried portrait phase-nav defect**: the stepper drops to a **second full-width header row below
  `sm`**, with exactly one `<nav>` rendered per viewport (no duplicate landmark). **+5 unit tests**
  (+1 `help` example-tier, +2 `<Help>` example disclosure, +2 `export` placement/pastoral; **237
  total**), verified live in a real browser (attribution page; coverage pips+progress+tagged readout;
  context-above/quoted-below placement; pastoral note leader-only; portrait second-row nav), **0 console
  errors**. **PWA install/offline verified end-to-end on the production build** (`vite preview` + a
  browser-context offline toggle): the app shell reloads offline from the precache, a **fetched Bible
  stays available offline** from the `qth-bibles` runtime cache, a never-fetched book correctly fails
  offline (proving true offline), and the **"Ready to work offline"** toast fires on first install.
  **Fixed a real pre-existing bug in the same pass:** the Bibles runtime-cache route had **never
  worked** — its `urlPattern` was a `({url}) => url.pathname.startsWith(`${BASE}bibles/`)` arrow, which
  `generateSW` stringifies into the SW verbatim, where **`BASE` is undefined** → the matcher threw and
  never matched, so no book was ever runtime-cached (broken since Stage 2). Replaced with the
  **un-anchored `BIBLES_RE` RegExp** (a `RegExpRoute` matches the *full href*, so `^` must not be
  used). **Stages 1–9 remain true below.**
- **Stage-9 recap (M3):** The single
  primary passage became a **multi-translation model**: `passage` is now
  `{ translations: Record<translationId, ParsedText>, primaryId: string|null }` (was
  `{ primary }`). **schemaVersion bumped 1→2**; `hydrate()` upgrades an old single-primary doc via
  the shared **`normaliseStoredPassage`** (`src/lib/passage.ts`) — handles the old embedded
  `{primary}`, a bare pre-M3 `ParsedText` passage-store payload, and the M3 shape, idempotently, so
  nothing is lost (verified: hydrate test + live IDB inspection). Every reader of the old
  `passage.primary` (audit, exports, Phases 1–6) now reads **`primaryText(study.passage)`**; the
  store's `setPassage` takes the whole passage and reconciles marks against the resolved primary.
  **Phase 1** gained a **Comparison translations** section — add a **bundled** secondary (a
  select→loadReading→`addSecondary`) or a **pasted** one (the Stage-8 paste path reused via
  `/study/:id/paste?as=secondary`, seeding the study's reference, Accept→`addSecondary` instead of
  replacing the primary). Secondaries are comparison-only; the primary stays the anchor. A reusable
  **`<TranslationCompare>`** (Phase 1 **and** Phase 2) offers the two SPEC ways in: **on-demand
  per-verse** (tap a verse → all translations, default) + an **optional side-by-side column
  toggle**. **Alignment is pure** (`src/lib/compare.ts` `alignTranslations`): number-equality +
  the `present` flag **within the bundle (no mapping)** — a verse present in one and gapped/absent
  in another is **FLAGGED, never silently aligned** (verified live: WEBBE-primary vs ASV on
  Matt 17:20-22 flags v21, and v22 stays paired with v22). For the rare **foreign-versified pasted**
  secondary, a **small pure converter** `reversifyToKjv` (data-driven, `HEBREW_PSALMS` table; **NOT**
  the abandoned `reversify` npm — see decision log) shifts verse numbers onto the KJV anchor and
  **flags unmappable** title verses; offered as a "Verse numbering" selector on the pasted-secondary
  path. **Also folded in a real-world paste fix** (owner on-device Pixel/YouVersion test, mid-session):
  `analysePaste` now understands **YouVersion format** — `[NN]` bracket verse markers
  (`unwrapBracketedVerseNumbers`), a `Book C:V-V ABBR` header line on one line
  (`splitReferenceAndTranslation`), and the trailing `bible.com` URL as chrome. **+25 unit tests**
  (+9 `compare`, +12 `passage`, +1 `hydrate` upgrade, +3 `paste` YouVersion; **232 total**), verified
  end-to-end in a real browser (bundled secondary + compare + reload persistence), **0 console
  errors**. **Stages 1–8 remain true below.**
- **Stage-8 recap (M2):** A **second way to get
  a passage into Phase 1** — pasting text copied from an app/site — normalised into the same
  block/line `ParsedText` model the bundled loader produces, behind a **mandatory review screen**.
  The **pure normaliser** (`src/lib/paste/`) strips app chrome (leading reference/translation
  lines, "Read full chapter", the trailing "Footnotes" block → captured as notes), NFC-normalises
  + folds NBSP/zero-width/bidi, recovers the reference (`bcv`) + translation (matched to a bundled
  id or kept as a custom name), detects verse markers **at the start of a line *and* mid-line**
  (monotonic gate so content numbers don't masquerade), classifies prose / **poetry (line breaks +
  indent preserved)** / editorial headings + superscriptions, strips inline footnote letters
  (`[a]`), and **flags** every low-confidence call. Two pure stages: `analysePaste(raw)` →
  editable `PasteSegment[]`, `assembleParsedText(segments,ctx)` → `ParsedText`. The **review
  screen** (`/study/:id/paste`, `PasteReview.tsx`) shows the parse, lets the user fix line
  type / verse number / drop junk, confirm translation + reference, with a **live `PassageView`
  preview**, and only **Accept** commits it (`setPassage`, `source:'pasted'`). **Pasted text is
  SOURCE OF TRUTH** (`ParsedText.source:'pasted'`, additive-optional; a bundled translation-switch
  is guarded so it can't overwrite it), unlike the re-derivable bundled cache. A pasted study flows
  through **Phases 2–7 unchanged** (verified: Phase 2 renders, Phase 3 anchors `PS.80.1-3`).
  **Also fixed the carried poetry/verse-number rendering defect** in `PassageView` (`ProseVerse`
  put the verse number *before* its line loop, stranding it at the tail of the previous line for a
  poetry-opening verse — Magnificat/Benedictus; now the number leads its own line). **8 golden
  fixtures across genres** (Gospel narrative+poetry, Hebrew poetry ±superscription, Epistle prose,
  acrostic) + **23 paste tests**; verified end-to-end in a real browser on **owner-supplied NIV
  pastes** (Luke 1:39-80, Psalm 80, Psalm 119 — each hardened a distinct heuristic), **0 console
  errors**. **Stages 1–7 (M1) remain true below.**
- **Stage-7 recap (M1 COMPLETE):** **Phase 7 (Check & export)** — the
  **audit** (11 checks, each computing its status from the study + showing evidence; dismiss-with-ack;
  **NOTHING blocks export**) + the three artefacts. The **coverage map** is a per-section view of which
  verses no question's anchor touches; every *fully-untouched* section is tagged connective / deferred /
  needs-question (`audit.coverageTags[sectionId]`) and the check flips met once tagged. **Gospel-plain is
  REQUIRED** (shown unmet, still only an ack) when `setup.groupComposition` is `mixed` /
  `one-to-one-not-yet-christian` and no promoted question has `gospelPlain:true` (verified live: na→unmet
  as the group flips). All audit logic is **pure + unit-tested** (`src/lib/audit.ts`, 16 tests). **Exports:**
  `#/print/:id/handout` + `#/print/:id/leader` print-CSS routes (forced LIGHT palette via a `.qth-print`
  var-override **and** an on-mount `.dark`-strip, `print-color-adjust:exact` on boxes, `break-inside:avoid`
  per question, `@page A4`) rendering from the study model, **plus a markdown export for each** and the
  Stage-1 **project-file** export surfaced here. **Handout = defined by exclusion** (guard-tested BOTH ways:
  the real expected-answer strings exist in the study yet are **absent** from the handout; the translation
  **copyright line is present**); **leader's notes = everything**. **Support-passage text** (deferred from
  Stage 6, `SupportPassage.text` was null) is now **fetched at export** (`resolveSupportTexts`, reuses the
  bundled loader + `extractReading`) and printed inline (verified: Malachi 4:5-6 renders under Q1). The
  **translation copyright line** (previously UNWIRED) is now resolved from `content/method/translations.yaml`
  (`translationCopyright(id)`) and appended. Verified end-to-end in a real browser (Playwright MCP, **0
  console errors**) — see the Stage-7 Test entry points. **Stages 1–6 remain true below.**
- **Stage-6 recap:** **Phase 6 (Build the questions)**, the longest
  phase, presented as the sequential sub-steps SPEC requires: **6a** weight the Phase-3 sections
  (heavy/medium/light) → **6b** the question budget + a **running time total** (weight-minutes +
  4 min/support) vs the Phase-1 duration → **6c** generate wide (the recycled pool + a **formula
  library** from `formulas.yaml` that drops scaffolded stems + a free brainstorm composer) →
  **6d** cut (discard-but-keep/restore) → **6e** complete each keeper in a draft editor with the
  **ONE HARD BLOCK — a question cannot be promoted while its expected answer is empty** (the only
  hard gate in the whole tool; re-guarded in the pure lib too), plus inline per-type litmus
  (`litmus.yaml question[]`) and the **soft, overridable** yes-no / leading / double-barrelled
  warnings → **6f** support passages (3 kinds, budget warning at the 3rd context/quoted,
  return-question prompt on attach) → **6g** sequence (up/down + the meaning-before-its-observations
  warning) → **6h** prayer point (soft). **Recycle-forward carried through to promotion:** a
  Phase-4 anchored note → question candidate → promoted Question keeps its verse anchor (new
  optional `Candidate.anchor` snapshot); a Phase-3 mark → **background box** that is kept for the
  handout and **never** enters the question flow (SPEC: "tell them, don't ask them"). All
  load-bearing logic is **pure + unit-tested** (`src/lib/questions.ts`); the page is a thin wrapper
  over `applyToCurrent` + a format-guarded `updateBuild`. Verified end-to-end in a real browser
  (Playwright MCP, 0 console errors) — see Test entry points. **Stages 1–5 remain true below.**
- **Stage-5 recap:** **Phase 5 (Theme & aim — the hinge)** + the **help-markdown loader**
  (`useHelp` + `<Help>` three tiers + global guidance toggle); the two-sentence core, group aim,
  know/feel/do, five stuck helpers, the Christ & gospel test (route + four trap acks, Goldsworthy
  attribution in `traps.yaml`), and the five litmus tests acknowledged on exit (soft acks). New
  dep: **`react-markdown`**. **Stages 1–4 remain true below.**
- **Stage-4 recap:** **Phase 4 (COMA)** + **recycle-forward wiring**.
  Genre-driven COMA note grid (Context/Observation/Meaning/Application), each with a
  free-form note composer + reused **`<VerseAnchorPicker>`** (multi-select) for anchoring;
  **Matthias Media / HTC attribution renders on screen** (stored in `coma.yaml`, can't drift
  — Inviolable rule 8). **Recycling** (PLAN §4.2): Phase-3 marks → **background-box**
  candidates; Phase-4 **anchored** notes → **question** candidates of the matching COMA type,
  with provenance (`Candidate.source`) + **copy-on-promote** (snapshot on "Keep for Phase 6";
  editing the source flags **"source changed"** but never mutates the pooled candidate;
  deleting the source never deletes the candidate). New **method-content loader**
  (`src/lib/content/`, js-yaml + zod, root-absolute glob). Verified end-to-end in a real
  browser (Playwright MCP) — see Test entry points. **NOTE: `coma.yaml` prompt lists are
  still the empty `state: todo` skeleton** (the verbatim Helm prompts are a manual owner
  transcription, blocked in the teaching session by a content filter — see below); the app
  loads them from the file, so filled prompts appear with **zero code change**.
  **Stages 1–3 remain true below.**
- **Stage-3 (map) is still true** — **Phase 3**: author's-break **sections** (named, a live
  contiguous partition you split/merge), **question marks** (verse/phrase/word with sub-verse
  char-offset spans that **degrade to whole-verse** when the text changes), and the reusable
  **`<VerseAnchorPicker>`**.
- **Scaffolded already (do not recreate):** `content/LICENSE` (CC BY-SA),
  `content/README.md`, `content/help/**` (67 stubs; Phases 3/5/6e now have authored
  prose from the `teaching` branch), `content/method/*.yaml` (9 skeletons; `traps.yaml`
  authored), `content/DEFERRALS.md`, `scripts/gen-help-stubs.sh`, and `docs/`, CLAUDE.md,
  ROADMAP.md.
- **Stage-1 spine (do not recreate):** `src/types/study.ts` (full `Study` zod schema),
  `src/lib/storage/{db,hydrate,studies,index}.ts`, `src/lib/{id,broadcast}.ts`,
  `src/store/study.ts`, `src/hooks/{useAutosave,useStorageEstimate}.ts`,
  `src/pages/Home.tsx`, `src/components/ui/{input,textarea,button}.tsx`.
  *(Stage 1's `StudyOverview.tsx` was **replaced** by the real Phase-1/2 routes — gone.)*
- **Stage-2 spine (do not recreate):** `src/types/passage.ts` (Block/VerseSpan/Fragment/
  StructuredNote/`ParsedText` — `study.ts` re-exports `ParsedText` from here),
  `src/lib/verse/{books,ids,reference,index}.ts`, `src/lib/bible/{usfm,extract,loader,
  translations,index}.ts`, `scripts/build-bibles.ts`, `public/bibles/{webbe,asv}/*.json`
  + `manifest.json`, `src/components/passage/PassageView.tsx`, `src/components/StudyHeader.tsx`,
  `src/lib/{download,setup-options}.ts`, `src/components/ui/select.tsx`,
  `src/hooks/useOpenStudy.ts`, `src/pages/{Phase1Setup,Phase2Read,StudyNotFound}.tsx`.
- **Stage-3 spine (do not recreate):** `src/lib/map.ts` (pure Phase-3 logic — section
  split/merge/rename + partition validation, verse tokenizer, `makeVerseMark`/`makeSpanMark`,
  **`reconcileMarks`** degrade-on-text-change, ref/chip labels) + `src/lib/map.test.ts`
  (20 tests); `src/components/passage/VerseAnchorPicker.tsx` (+ `.test.tsx`, 3 tests) — the
  reusable picker for Phases 3/4/6; `src/pages/Phase3Map.tsx` (StructureEditor + MarkComposer
  + MarkList). Wiring: `reconcileMarks` called inside `store/study.ts` `setPassage` (the one
  text-change choke point); route `/study/:id/3` in `App.tsx`; phase 3 enabled in
  `Layout.tsx` `BUILT_PHASES`; Phase 2's "Next" now links to `/3`.
- **Stage-4 spine (do not recreate):** `src/lib/content/{method,index}.ts` (method-YAML
  loader — `parseComa`/`parseGenres` pure + `comaContent`/`genreItems`/`comaSetForGenre`/
  `readingTipForGenre` accessors; tolerates the empty `todo` skeleton) + `method.test.ts`
  (11); `src/lib/recycle.ts` (pure recycle-forward — `deriveRecycleSources`,
  `makeCandidateFromSource`, `candidateForSource`, `isSourceChanged`, `addCandidate`) +
  `recycle.test.ts` (7); `src/pages/Phase4Coma.tsx` (COMA grid + attribution + composers +
  recycle panel). Wiring: store `recycleToPool` action (copy-on-promote, format-guarded) +
  COMA note CRUD inline via `applyToCurrent`; route `/study/:id/4` in `App.tsx`; phase 4 in
  `Layout.tsx` `BUILT_PHASES`; Phase 3's "Next: COMA" now links to `/4`. New deps:
  **`js-yaml`** (dep) + **`@types/js-yaml`** (devDep).
- **Stage-5 spine (do not recreate):** the **help-markdown loader** `src/lib/content/help.ts`
  (`parseHelp` pure — hand-split frontmatter + `<!-- inline|expandable|page -->` tiers; no
  gray-matter — + `helpEntry`/`hasHelp` accessors over a root-absolute `import.meta.glob`) +
  `help.test.ts` (7); the **global guidance store** `src/lib/guidance.ts` (`useGuidance`,
  full/brief, localStorage `qth/guidance`, default full); the `useHelp(key)` hook
  (`src/hooks/useHelp.ts`); the **`<Help>`** component (`src/components/Help.tsx` — inline
  always, expandable behind "Tell me more" in full mode, inline source credit beneath, falls
  back to `GuidancePlaceholder`) + `Help.test.tsx` (3); the header **`<GuidanceToggle>`**
  (`src/components/GuidanceToggle.tsx`); the method-loader extensions in
  `src/lib/content/method.ts` (`parseLitmus`/`litmusThemeTests`, `parseTraps`/`trapsContent`,
  `parseStuckHelpers`/`stuckHelpers`) + `method.test.ts` (+9); `src/pages/Phase5ThemeAim.tsx`.
  Wiring: route `/study/:id/5` in `App.tsx`; phase 5 in `Layout.tsx` `BUILT_PHASES` +
  `<GuidanceToggle>` added to the header; Phase 4's "Next: Theme & aim" now links to `/5`;
  **every `GuidancePlaceholder` call in Phases 1–5 swapped to `<Help>`**. New dep:
  **`react-markdown`**. Phase 5 writes into the existing `themeAim` (no schema change).
- **Stage-6 spine (do not recreate):** the **pure Phase-6 core** `src/lib/questions.ts`
  (budget/time math — `WEIGHT_MINUTES`/`SUPPORT_MINUTES`/`estimatedMinutes`/`suggestedQuestionCount`/
  `SUGGESTED_ALLOCATION`/`typeCounts`; **`hasExpectedAnswer`** the hard-block predicate;
  **`detectWarnings`** the three soft regexes; **`meaningBeforeObservation`** the 6g check;
  `countedSupport`/`supportBudgetWarn`; `orderedQuestionIds`/`orderedQuestions` order-vs-live
  reconciliation; `emptyDraft`/`questionFromDraft`/`draftFromQuestion`; and the build mutations
  `addCandidate`/`updateCandidateText`/`removeCandidate`/`discardCandidate`/`restoreCandidate`/
  **`promoteCandidate`** (re-guards the hard block)/`updateQuestion`/**`deleteQuestion`** (cascade:
  drop from `order`, reopen source candidate, detach support)/`moveQuestion`/support add/update/
  remove) + `questions.test.ts` (19); the content-loader extensions in `src/lib/content/method.ts`
  (`litmusQuestionTests`/`litmusForQuestionType`, `parseFormulas`/`formulaGroups`/`formulasForType`,
  `parseWarnings`/`questionWarnings`/`warningById`) + `method.test.ts` (+8); `src/pages/Phase6Build.tsx`
  (all sub-steps 6a–6h; a single draft-based `QuestionEditor` reused for promote + edit, gated on
  the expected answer; `WeightSection`/`BudgetSection`/`GenerateSection`/`CutSection`/`QuestionsSection`/
  `SupportSection`). **Model change:** `Candidate` gains optional **`anchor`** (recycle-forward
  snapshot, additive-optional — no schemaVersion bump); `recycle.ts` `makeCandidateFromSource`
  now carries it. Wiring: route `/study/:id/6` in `App.tsx`; phase 6 in `Layout.tsx` `BUILT_PHASES`;
  Phase 5's "Next: Build the questions" now links to `/6`. **No new deps.**
- **Stage-8 spine (do not recreate):** the **pure paste normaliser** `src/lib/paste/`
  (`types.ts` — `PasteSegment`/`PasteAnalysis`/`AssembleContext`; `clean.ts` — `preclean`
  NFC+NBSP+zero-width+CRLF, `isChromeLine`/`isFootnotesHeader`, `stripInlineMarkers`,
  `looksLikeTranslationName`, indent helpers; `paste.ts` — `analysePaste(raw)` (chrome strip →
  ref/translation recovery → paragraph classify → verse/poetry/heading segments, `acceptMarker`
  monotonic gate, inline+leading verse numbers in poetry, leading-orphan/superscription →
  heading, short-stanza-marker → heading) + `assembleParsedText(segments,ctx)` → `ParsedText`;
  `index.ts`) + `paste.test.ts` (23) + `__fixtures__/*.txt` (8 PD/CC0 golden files) +
  `__snapshots__/`; the **review page** `src/pages/PasteReview.tsx` (two steps: paste+ref →
  review editor + live `PassageView` preview → Accept). **Model:** `ParsedText.source:
  'bundled'|'pasted'` (optional, absent=bundled; `passage.ts`) — pasted is source-of-truth.
  Wiring: route `/study/:id/paste` in `App.tsx`; Phase 1 "Paste your own text" link +
  read-only translation display for a pasted passage (`Phase1Setup.tsx`); `extract.ts` sets
  `source:'bundled'`. **Render fix:** `PassageView.tsx` `ProseVerse` — verse number now leads
  its first line (was stranded on the previous line for poetry-opening verses). **No new deps.**
- **Stage-10 spine (do not recreate):** the **[X] worked-example tier** — `src/lib/content/help.ts`
  (`parseHelp` now splits a fourth `<!-- example -->` marker into `HelpEntry.example`), `src/hooks/
  useHelp.ts` (`showExample`), `src/components/Help.tsx` (a shared `Disclosure` + the "See a worked
  example" tier) + `help.test.ts` (+1) + `Help.example.test.tsx` (+2, mocks `useHelp`); the **attribution
  page** `src/pages/Attribution.tsx` (renders `attribution.page.md` **page** tier) + route `/attribution`
  in `App.tsx` + footer link in `Layout.tsx`; **coverage polish** in `src/pages/Phase7Audit.tsx`
  (`TouchStrip` pips + progress line + tagged readout — pure over the existing `CoverageSection`);
  **support placement** in `src/components/print/HandoutDocument.tsx` (`SupportBox`, context-above /
  quoted-below) + `src/lib/export/markdown.ts` (same split) + `markdown.test.ts` (+1); **pastoral note**
  — `Question.pastoralNote` in `src/types/study.ts` (additive-optional), threaded through
  `src/lib/questions.ts` (`QuestionDraft`/`questionFromDraft`/`draftFromQuestion`), the 6e editor in
  `src/pages/Phase6Build.tsx`, `LeaderQuestion.pastoralNote` in `src/lib/export/model.ts`,
  `LeaderDocument.tsx` + `markdown.ts` (leader-only) + `markdown.test.ts` (+1); **PWA** —
  `scripts/build-icons.mjs` (dep-free, drives Playwright chromium) → `public/icons/*.png`, `vite.config.ts`
  (`registerType:'prompt'`, PNG manifest icons, `cleanupOutdatedCaches`, `navigateFallbackDenylist`),
  `src/components/PwaReloadToast.tsx` (`useRegisterSW`), `src/test/pwaRegisterReactStub.ts` +
  `vitest.config.ts` alias, `index.html` apple-touch link, `src/main.tsx` (registerSW removed),
  `src/vite-env.d.ts` (`vite-plugin-pwa/react` ref); **portrait nav** — `Layout.tsx` `PhaseSteps` +
  a second `sm:hidden` header row. New script: **`npm run build:icons`**. **No new npm deps.**
- **Next up:** **The planned build (Stages 0–10) is COMPLETE.** All remaining work is deferred /
  ROADMAP, not a next stage: **(a)** the **[X] worked-example content** — the tier is wired but empty;
  the teaching session drops `<!-- example -->` blocks into `content/help/**` (one canonical passage,
  `TEACHING-TEXT.md §6`) and they render with no code change; **(b)** the **COMA prompt lists** are
  still the `todo` skeleton (owner transcription); **(c)** ROADMAP items — Talk mode, series
  management, BSB edition (owner to pin the berean.bible USFM), footnote/cross-ref rendering,
  multi-genre passages, the YouVersion-style redesign (ROADMAP §5), and **translation-comparison notes
  in the leader's notes** (SPEC §7 lists them; no note-capture field exists yet — see the new Known
  issue). **Two on-device confirmations still owed (not code-blocking):** the owner to re-test the
  **fixed YouVersion paste** on their Pixel against the live build, and to try the
  **pasted-comparison-translation** flow with a real clipboard (both wired + unit-tested; real-clipboard
  end-to-end deferred to the owner per the no-inject testing rule).
- **Live:** https://jack-braga.github.io/quick-to-hear/ renders the shell (HTTP 200).
  Both `ci.yml` and `deploy.yml` green through Stage 1.
- **Milestone target:** M1 = Stages 0–7 = complete workbook on bundled Bibles
  (primary translation only) **with recycling** (Phases 1–7, no paste, no secondary
  translations).
- **Awaiting from user:** `PLAN.md` §8 open questions (translation set, WEB edition,
  worked-example passage, repo name) — none block Stage 0.

## How to resume (fresh session, start here)

1. Read this file, then `PLAN.md` (the "Next up" stage), then the relevant `SPEC.md`
   phase. For guidance content, see `TEACHING-TEXT.md`.
2. Check repo state:
   ```
   git -C /Users/jack-braga/Documents/Projects/repos/quick-to-hear log --oneline -10
   git status
   ```
3. If `package.json` exists, install + run gates:
   ```
   npm ci
   npm run typecheck && npm run lint && npm test && npm run build
   ```
   (These don't exist until Stage 0 lands — before then there is only `docs/`.)
4. Do the "Next up" stage only. Keep each stage small and testable.
5. Before finishing: run the stage's "How to test" gate, **update this file**, commit.

## Reusable assets (from sibling repos — confirmed)

- **`../twice-daily`** — USFM→JSON Bible pipeline (`scripts/parse-usfm.ts`), eBible
  USFM sources on disk at `~/Documents/Projects/dailyOffice/*_usfm`, book-names table,
  per-book JSON + runtime loader (`src/services/bible-loader.ts`). **Reuse + extend**
  for poetry-line arrays, `\s` headings, tagging, block/line model (`PLAN.md` §4.5).
- **`../local-ledger`** — the closest template: `vite.config.ts` (base + VitePWA),
  `.github/workflows/{ci,deploy}.yml`, HashRouter `App.tsx`, tsconfig split,
  tailwind/components.json, `${import.meta.env.BASE_URL}` asset pattern, `idb`.
- **`../krenoda`** — theming (`pwa/src/state/ui.ts` light/dark/system), Zustand,
  vitest jsdom + fake-indexeddb + matchMedia setup, strict tsconfig.

## Stage checklist

Mirror of `PLAN.md` §6. Mark `[x]` only when the stage's **done-when** holds.

- [x] **Stage 0** — Scaffold + deploy + theming *(M1)*
- [x] **Stage 1** — Model, storage (Zustand+idb+hydrate), autosave, project file, Home *(M1)*
- [x] **Stage 2** — Bundled Bibles (WEBBE+ASV) + verse lib (bcv_parser) + Phase 1 + Phase 2 *(M1)* — BSB deferred (§8 #4)
- [x] **Stage 3** — Phase 3 map + verse-anchor picker *(M1)*
- [x] **Stage 4** — Phase 4 COMA + recycle-forward wiring *(M1)* — COMA prompt text is the
      empty `todo` skeleton (owner-transcribed later); machinery + attribution complete
- [x] **Stage 5** — Phase 5 theme & aim (the hinge) + help-markdown loader (`<Help>`) *(M1)*
- [x] **Stage 6** — Phase 6 build the questions *(M1)* — the ONE hard block (6e) enforced; all
      other checks soft; recycle-forward carries anchors through to promotion
- [x] **Stage 7** — Phase 7 audit + exports → **M1 COMPLETE** — 11 pure audit checks (nothing
      blocks); coverage map + tags; gospel-plain conditional; handout (answers excluded, copyright
      present — guard-tested both ways) + leader print-CSS routes + markdown; support text fetched
- [x] **Stage 8** — Paste ingest + normalisation + review screen *(M2)* — pure normaliser
      (`src/lib/paste/`), mandatory review screen (`/study/:id/paste`), pasted = source of truth;
      **also fixed** the carried poetry/verse-number render defect in `PassageView`
- [x] **Stage 9** — Secondary translations + comparison + versification mapping *(M3)* — model
      migrated to `passage.translations` Record (schemaVersion 1→2, hydrate upgrades); bundled +
      pasted secondaries; on-demand + side-by-side compare; number-equality + `present`-flag
      alignment flags mismatches, never misaligns; pure `reversifyToKjv` converter (vendored, not
      the reversify npm — v2/v4 incompatible); **YouVersion paste format fixed**
- [x] **Stage 10** — Depth + worked examples + PWA *(M4)* → **PLANNED BUILD COMPLETE** — [X]
      worked-example tier wired (content-empty, zero-code-change to fill); full attribution page
      (`/attribution`); coverage-map visual pips + tagging progress + tagged readout; support placement
      by function (context above / quoted below); `pastoralNote` captured + leader-only; PWA raster
      icons + prompt-mode update toast + offline app-shell/Bibles + precache tuning; portrait phase-nav
      second row. 237 unit tests; install/offline confirmed on the deployed Pages site

## Test entry points (fill in as stages land)

- **Stage 0** — Scaffold + deploy + theming:
  - Install: `npm ci` (or `npm install`).
  - Acceptance gate: `npm run typecheck && npm run lint && npm test && npm run build`
    (all pass; lint 0 warnings; 5 unit tests).
  - Dev shell: `npm run dev` → open the printed URL (Vite serves at `/quick-to-hear/`,
    port 8080). Header shows title + phase-nav placeholder (1–7) + theme toggle.
  - Theming: click the header toggle to cycle **light → dark → system**; it flips the
    `<html>` class + `color-scheme` + `theme-color`, persists to `localStorage['qth/theme']`,
    and `system` follows the OS (live `matchMedia` listener). No FOUC (seed in `index.html`).
  - Prod serve under base path: `npm run build && npm run preview -- --port 4173`
    → http://localhost:4173/quick-to-hear/ (200; all assets base-prefixed; SW + manifest).
  - E2E smoke: `npm run test:e2e` (Playwright chromium; builds + previews first;
    2 tests: shell boots, theme toggle flips `<html>`). First run locally needs
    `npx playwright install chromium`.
  - Unit tests of note: `src/lib/theme.test.ts` (resolveTheme + class toggle),
    `src/App.test.tsx` (Home renders under HashRouter, toggle present).

- **Stage 1** — Model, storage, autosave, project file, Home:
  - Acceptance gate: `npm run typecheck && npm run lint && npm test && npm run build`
    (all pass; lint 0 warnings; **28 unit tests**), then `npm run test:e2e` (2/2).
  - Unit tests of note: `src/types/study.test.ts` (schema defaults + `toSummary`),
    `src/lib/storage/hydrate.test.ts` (upgrades a partial doc, quarantines a bad blob /
    a newer-version doc, never throws), `src/lib/storage/studies.test.ts` (CRUD,
    **passage separation**, body-only autosave leaves passage intact, export/import
    round-trip = fresh id, malformed import → friendly error + kept in quarantine),
    `src/store/study.test.ts` (create/update/flushSave/delete/import/conflict).
  - **Manual flow (drive the app):** `npm run dev` → open
    `http://localhost:8080/quick-to-hear/` → **New study** (routes to `#/study/<uuid>`)
    → type a **Passage reference** (`Luke 1:5-25`) + **Series note** → the save chip
    shows "Saving…" then "Saved" → **reload the page** (clears the in-memory store):
    the deep-linked study rehydrates from IndexedDB with both fields intact → **Export**
    downloads `luke-1-5-25.qth.json` (envelope `quick-to-hear/study-project`) → **Delete**
    → **Import project file** and pick that file: it restores under a **new** id →
    importing a **non-JSON** file shows the friendly error and quarantines the blob
    (existing studies untouched).
  - **Inspect storage** (DevTools console): `indexedDB` DB `quicktohear` has stores
    `studies` (body — **no `passage` key**), `passages` (payload, keyed by study id),
    `quarantine` (kept-but-unreadable blobs).
  - Sample passage refs to type: `Luke 1:5-25`, `Acts 2`, `John 1` (Stage 1 only stores
    them as free text — parsing + genre inference is Stage 2).

- **Stage 2** — Bundled Bibles + verse lib + Phase 1 + Phase 2:
  - **Regenerate the bundled Bibles** (only if the parser or sources change; output is
    committed): `npm run build:bibles` → writes `public/bibles/{webbe,asv}/*.json` +
    `manifest.json` (66 books each, ~14 MB total; per-book, runtime-fetched, **not**
    precached). Sources: `~/Documents/Projects/dailyOffice/{engwebpb_usfm,eng-asv_usfm}`.
  - Acceptance gate: `npm run typecheck && npm run lint && npm test && npm run build`
    (all pass; lint 0 warnings; **64 unit tests**), then `npm run test:e2e` (2/2).
  - Unit tests of note: `src/lib/verse/reference.test.ts` (`Luke 1:5-25`, cross-chapter
    `Luke 1:5-2:10`, **`3 John 14-15`→`3John.1.14`** and **`Rev 12:17-18`→`Rev.12.17`**
    under `kjv`, multi-passage flag, invalid→null), `src/lib/verse/ids.test.ts`,
    `src/lib/verse/books.test.ts` (genre inference), `src/lib/bible/usfm.test.ts`
    (poetry qlevels, superscription = `d` block, **Acts-8:37-style gap → `present:false`
    + footnote kept**, `\wj` tag, footnote/xref captured, NFC), `src/lib/bible/extract.test.ts`
    (range slice, superscription include, cross-chapter, **WEBBE→ASV textless-flag on
    MATT.17.21**), `src/components/passage/PassageView.test.tsx`, `src/types/passage.test.ts`.
  - **Manual flow (drive the app):** `npm run dev` → `http://localhost:8080/quick-to-hear/`
    → **New study** → Phase 1: type `Luke 1:5-25` → **Load passage** (summary shows
    "Luke 1:5-25 · WEBBE · 21 verses"; genre auto-infers **Gospels and Acts**) →
    **Continue: Pray & read** → Phase 2 shows the narrative (paragraphs, superscript
    verse numbers, WEBBE credit) + a tap **read counter**. Then back to Phase 1, load
    `Psalm 23` → Phase 2 shows **poetry** (superscription "A Psalm by David." above v1,
    q1/q2 indented lines). Then load `Matthew 17:20-22` (WEBBE) → switch **Primary
    translation → ASV**: a warning flags **MATT.17.21 has no text** (present-vs-absent,
    not an absent ID) and Phase 2 renders v21 as a numbered **gap** ("21 —"). **Reload
    the page**: title + passage (incl. the gap) + read count all rehydrate from IDB.
  - Sample refs to exercise the verse lib: `Luke 1:5-25`, `Luke 1:5-2:10`, `Psalm 23`,
    `Acts 8:36-38` (v37 gap in WEBBE **and** ASV), `Matthew 17:20-22` (v21 present in
    WEBBE, gapped in ASV), `3 John 14-15`, `Revelation 12:17-18`.

- **Stage 3** — Phase 3 map + verse-anchor picker:
  - Acceptance gate: `npm run typecheck && npm run lint && npm test && npm run build`
    (all pass; lint 0 warnings; **87 unit tests** — +20 `map` +3 `VerseAnchorPicker`),
    then `npm run test:e2e` (2/2 — smoke suite unchanged; full happy-path e2e is Stage 7).
  - Unit tests of note: `src/lib/map.test.ts` (section partition validity, split preserves
    the first section + tiles the passage, merge-up keeps the prior name, rename;
    `tokenizeVerse` offsets; `makeVerseMark`/`makeSpanMark`; **`reconcileMarks` degrades a
    span mark to whole-verse when the substring changes / the verse becomes a gap, refreshes
    a verse-mark snapshot, and never discards an orphaned mark**), `src/components/passage/
    VerseAnchorPicker.test.tsx` (one toggle per verse, gap verses disabled, multi-select
    accumulates in canonical order, single-select keeps ≤1).
  - **Manual flow (drive the app — verified live via Playwright MCP):** `npm run dev` →
    `http://localhost:8080/quick-to-hear/` → **New study** → Phase 1: `Luke 1:5-25` →
    **Load passage** (21 verses, WEBBE) → **phase-nav step 3** (now enabled) → Phase 3:
    **Divide into sections** → name §1, click **Split here** after v7 and after v23 → three
    named contiguous sections (5–7 / 8–23 / 24–25 = 21 verses). Then **mark**: pick "A phrase",
    verse **Luke 1:18**, tap first+last word to select "How can I be sure of this?", **Add**;
    pick "A word", verse **Luke 1:15**, tap "strong", **Add**. **Reload** → deep-link
    `#/study/<id>/3` rehydrates all 3 named sections + both marks from IDB. Then Phase 1 →
    **switch Primary WEBBE→ASV** → back to Phase 3: both sub-verse marks now show **kind
    "verse"** with the ASV whole-verse text (the char offsets no longer matched → degraded),
    while the sections kept their names (verse IDs are stable across the bundle's shared KJV
    numbering). 0 console errors (only the pre-existing RR v7 future-flag warnings).
  - Inspect the persisted map (DevTools): IDB DB `quicktohear`, store `studies`, the study's
    `map.sections` (start/end verse IDs + names) and `map.marks` (`kind`, `verseId`,
    `span?{start,end}`, `text`) — part of the autosaved **body**, not the `passages` payload.

- **Stage 4** — Phase 4 COMA + recycle-forward wiring:
  - Acceptance gate: `npm run typecheck && npm run lint && npm test && npm run build`
    (all pass; lint 0 warnings; **106 unit tests** — +11 `content/method` +7 `recycle`
    +1 store `recycleToPool`), then `npm run test:e2e` (2/2 — smoke suite unchanged).
  - Unit tests of note: `src/lib/content/method.test.ts` (real `coma.yaml` parses with the
    **attribution present** + six genre sets of four lists, tolerates the empty `todo`
    skeleton, **requires a non-empty attribution**, preserves authored prompts verbatim,
    coerces a bare/null category to `[]`; `genres.yaml` maps all six genres → comaSet);
    `src/lib/recycle.test.ts` (marks → background-box sources; **only anchored, non-empty**
    COMA notes → question sources of matching type; `makeCandidateFromSource` snapshot +
    provenance; `addCandidate` idempotent; **editing the source never mutates a materialised
    candidate but `isSourceChanged` detects it; deleting the source never deletes the
    candidate**); `src/store/study.test.ts` `recycleToPool` (snapshot into the pool,
    idempotent, snapshot survives a source edit).
  - **Manual flow (drive the app — verified live via Playwright MCP, 0 console errors):**
    `npm run dev` → `http://localhost:8080/quick-to-hear/` → **New study** → Phase 1:
    `Luke 1:5-25` → **Load passage** (genre auto-infers **Gospels and Acts**) → **phase-nav
    step 4** (now enabled) → Phase 4: the **Matthias Media / HTC attribution renders** at the
    top (`[data-testid="coma-attribution"]`); the authored **`coma.placeholder`** safety notice
    renders ("…not David Helm's real COMA questions…", `[data-testid="coma-placeholder"]`,
    shown while `state !== 'cited'`) and the authored **genre reading tip** (from `genres.yaml`,
    Batch 5b) shows for Gospels-and-Acts; the four COMA categories show composers + anchor
    pickers. Add a **Meaning** note ("Why does Zechariah doubt…") anchored to
    **Luke 1:18** → it **surfaces in the recycle panel as a MEANING question candidate**.
    Click **Keep for Phase 6** → it shows **"In Phase 6 pool ✓"**. **Edit** the source note
    text → the pooled candidate keeps its **snapshot** ("Why does Zechariah doubt…") and gains
    a **"source changed"** badge (never mutated). Go to Phase 3, add a **verse mark** on
    **Luke 1:20**, back to Phase 4 → it **surfaces as a BACKGROUND-BOX candidate**. **Hard
    reload** → the edited note, the pooled candidate (with snapshot + source-changed), the
    mark→box, and the attribution all rehydrate from IndexedDB.
  - Inspect the persisted data (DevTools): IDB DB `quicktohear`, store `studies`, the study's
    `coma.{context,observation,meaning,application}` (each `Note{id,text,anchor?}`) and
    `build.candidates` (`Candidate{id,kind,text,status,source?{kind,id},questionType?}`) —
    autosaved **body**. **Known gap by design:** COMA prompt lists in `content/method/coma.yaml`
    are still `state: todo` (empty) — the verbatim Helm prompts are a **manual owner
    transcription** (see `content/COMA-TRANSCRIPTION.md` if the teaching session wrote it, or
    the teaching HANDOVER Batch 5); the loader + UI render them the moment the file is filled,
    **no code change**.

- **Stage 5** — Phase 5 theme & aim (the hinge) + help-markdown loader:
  - Acceptance gate: `npm run typecheck && npm run lint && npm test && npm run build`
    (all pass; lint 0 warnings; **126 unit tests** — +7 `content/help` +9 `content/method`
    litmus/traps/stuck +3 `<Help>`), then `npm run test:e2e` (2/2 — smoke suite unchanged).
  - Unit tests of note: `src/lib/content/help.test.ts` (`parseHelp` hand-splits frontmatter
    from a two-tier body **without gray-matter**, captures a cited `source`, tolerates a `#`
    comment in frontmatter + a junk file without throwing, uses the fallback key when
    frontmatter omits one; `helpEntry` resolves a real key / returns null for an absent one);
    `src/lib/content/method.test.ts` (five authored `litmus.theme` tests with the expected ids;
    `litmusThemeTests()` drops empty-text seeds; four `traps.items` with looksLike+check +
    **cited Goldsworthy attribution required non-empty**; five `stuck-helpers`);
    `src/components/Help.test.tsx` (renders real inline prose; **"Tell me more" shows in full,
    hides in brief**; falls back to the placeholder for an unwritten key).
  - **Manual flow (drive the app — verified live via Playwright MCP, 0 console errors):**
    `npm run dev` → New study → Phase 1: `Luke 1:5-25` → **Load passage** → **phase-nav step 5**
    (now enabled) → Phase 5: the **"faithfulness ≠ certainty"** callout + all fields render with
    **real help prose** (not placeholders) — theme/author-aim frames each with a "Tell me more",
    the **Christ-route** help carries its inline **Goldsworthy source credit**. Fill theme /
    author-aim / group-aim / know / feel / do / christ-route. Open **"Feeling stuck? Five ways
    in"** → the 5 helpers render. Tick all **four traps** (moralism/allegory/christless-history/
    flattening) — the **Goldsworthy `traps.yaml` attribution** renders beneath. Click **"Review
    the litmus tests →"** → the 5 tests reveal; tick each → **"5 of 5 acknowledged"** (soft — the
    disabled "Next: Build the questions" is disabled only because Phase 6 isn't built, never a
    block). **Hard reload** (`location.reload()`, clears the in-memory store) → all 7 fields, the
    4 trap acks, and 5/5 litmus acks **rehydrate from IndexedDB**, litmus panel auto-reveals.
    Toggle the header **guidance control** full→brief → the six "Tell me more" buttons disappear
    while all six inline help blocks stay; persists to `localStorage['qth/guidance']`.
  - Inspect the persisted data (DevTools): IDB DB `quicktohear`, store `studies`, the study's
    `themeAim.{theme,authorAim,groupAim,know,feel,doField,christRoute,litmusAcks,trapAcks}` —
    autosaved **body**. `litmusAcks`/`trapAcks` are `Record<id,bool>` keyed by the method-YAML
    ids, so unknown/added ids are tolerated independently of `schemaVersion`.

- **Stage 6** — Phase 6 build the questions:
  - Acceptance gate: `npm run typecheck && npm run lint && npm test && npm run build`
    (all pass; lint 0 warnings; **154 unit tests** — +19 `questions` +8 `content/method`
    formulas/warnings/question-litmus +1 `recycle` anchor-carry), then `npm run test:e2e` (2/2 —
    smoke suite unchanged; the full Luke happy-path e2e is Stage 7).
  - Unit tests of note: `src/lib/questions.test.ts` (`estimatedMinutes` = weight-minutes + 4/support;
    `suggestedQuestionCount` returns the SPEC 45→6-8 / 60→8-12; **`detectWarnings`** flags yes-no /
    leading / double-barrelled and stacks them, clean opener → `[]`; **`meaningBeforeObservation`**
    flags a meaning-before-observation on shared verses only; `supportBudgetWarn` counts context/
    quoted, warns at 3, ignores background; `orderedQuestionIds` filters dead ids + appends new;
    `moveQuestion` clamps; **`promoteCandidate` refuses without an expected answer** + marks the
    candidate promoted + appends order; `updateQuestion` refuses to blank the answer; `deleteQuestion`
    cascade; `questionFromDraft` trims + sets optionals only when meaningful); `content/method.test.ts`
    (four `litmus.question` ids = the QuestionType values; `formulas.yaml` parses 6/8/2/4 with blank
    stems tolerated; `warnings.yaml` three soft messages, `warningById` resolves); `recycle.test.ts`
    (`makeCandidateFromSource` **carries the source anchor forward**).
  - **Manual flow (drive the app — verified live via Playwright MCP, 0 console errors):**
    `npm run dev` → New study → Phase 1: `Luke 1:5-25` → **Load** (genre **Gospels and Acts**),
    **Duration 45** → Phase 3: **Divide into sections**, **Split** after v13 (two sections), add a
    **verse mark on Luke 1:20** → Phase 4: add a **Meaning** note anchored to **Luke 1:20** (don't
    "keep") → **phase-nav step 6** (now enabled). In Phase 6: **6a** weight §2 **heavy**; **6b**
    shows **6–8 for 45 min · you have 0** + running time; **6c** the recycle panel surfaces the
    **background box** (the 1:20 mark) and the **meaning candidate** (the anchored note) — click
    **Add** on the meaning one → it enters the cut pool; the background box goes to a separate
    **"Background boxes — for the handout"** list (never a question). **6d/6e:** **Complete &
    promote** the meaning candidate → the editor opens with the text + type prefilled; the
    **"Promote to the study" button is DISABLED** and a red **"Required"** note shows while the
    **Expected answer** is empty (**the one hard block**); type an expected answer → the button
    **enables**, the inline **meaning litmus** shows → promote → it lands as question 1, budget →
    **you have 1 · ≈3 min**. Brainstorm **"Is Zechariah a righteous man?"** → promote it → the
    **yes-no soft warning shows but the promote still succeeds once an answer is written** (soft =
    overridable). Edit the meaning question to also anchor **1:20** with it sequenced first → the
    **meaning-before-observation warning** fires; **move it down** → the warning clears. **6f:** add
    **Malachi 4:5-6** (context), **attach it to question 1** → the **return-question** field appears;
    add two more context/quoted → the **third trips the support-budget warning**; running time →
    **≈18 min**. **6h:** write a **prayer point**. **Hard reload** (`location.reload()`, clears the
    in-memory store) → the **sequence, prayer point, section weight, all 3 support passages + the
    budget warning, the attach + return field, and the background box all rehydrate from IndexedDB**.
  - Inspect the persisted data (DevTools): IDB DB `quicktohear`, store `studies`, the study's
    `build.{candidates,questions,supportPassages,prayerPoint,order}` (discriminated on `format`) +
    `map.sections[].weight` (6a writes the section weight into the Phase-3 map, not `build`) —
    autosaved **body**. Every `Question` in `build.questions` has a non-empty `expectedAnswer` by
    construction (the hard block); `order` is filtered-on-read against live questions.

- **Stage 7** — Phase 7 audit + exports → **M1 COMPLETE**:
  - Acceptance gate: `npm run typecheck && npm run lint && npm test && npm run build`
    (all pass; lint 0 warnings; **183 unit tests** — +11 `content/method` audit/translations,
    +16 `audit`, +6 `export/markdown`), then `npm run test:e2e` (2/2 — smoke suite unchanged).
  - Unit tests of note: `src/lib/audit.test.ts` (`coverageMap` marks a section untouched only when
    **no** question anchors into it, and `untaggedUntouched` clears once tagged; `requiresGospelPlain`
    true only for mixed / one-to-one-not-yet-christian; `applicationOrderOffenders`; `auditResults`
    gives the right met/unmet/na for a well-formed vs empty study, gospel-plain na→unmet→met, time
    over length, meaning-before-observation); `src/lib/export/markdown.test.ts` (**the handout guard
    both ways**: a `SECRET_ANSWER` present in the study is **absent** from the handout markdown +
    model, theme/aim/type/timings excluded, copyright line present; leader includes the answer,
    anchors, support, reserve, drop order, method attribution); `content/method.test.ts` (real
    `audit.yaml` = the 11 SPEC checks with gospel-plain the sole conditional; real `translations.yaml`
    copyright lines by id).
  - **Manual flow (drive the app — verified live via Playwright MCP, 0 console errors):** open a
    Stage-6 study (Luke 1:5-25, 2 questions, a Malachi 4:5-6 support attached to Q1, a Luke 1:20
    background box, a prayer point) → **phase-nav step 7** (now enabled) → Phase 7 audit renders **4
    met / 6 need a look**, each check showing computed evidence (the authored `audit.yaml` help lines,
    Batch 15). **Coverage map:** §1 (Luke 1:5–1:13) shows **"no question touches this"** with 3 tag
    buttons; click **Connective tissue** → the coverage check flips **unmet→met** ("Every untouched
    section is tagged") and the summary bar → **5 met**; the tag persists via the store. Set **group →
    mixed** in Phase 1 → back to Phase 7 → **gospel-plain flips na→unmet** with the **"required for this
    group"** badge + the `p7.gospel-plain` help + an ack; **tick the ack** → it moves to **1
    acknowledged** and every export control stays enabled (**nothing blocks**). **Open `#/print/:id/handout`**
    → full WEBBE passage (v5–25), **Q1 with the fetched Malachi 4:5-6 text inline**, Q2, the Luke 1:20
    background box, the prayer point, and the **copyright line**; a DOM+IDB check confirms the two real
    expected-answer strings are **absent** (guard) and the copyright is **present**. The print root is
    forced light (`<html class="light">`, bg `#fff`, ink `#0f1729`). **Open `#/print/:id/leader`** →
    both answers **present**, "Expected answer:" labels, the section map with weights (§2 heavy), the
    Malachi support, and the **Matthias Media/Goldsworthy method attribution** + copyright. **Download
    the two markdown files** → `…-handout.md` has **0 answer hits + copyright present**; `…-leader.md`
    has **both answers + Expected-answer/Matthias-Media/copyright markers**.
  - Inspect the persisted data (DevTools): IDB DB `quicktohear`, store `studies`, the study's
    `audit.{acks,coverageTags}` — `acks` a `Record<checkId,bool>` (dismiss-with-ack), `coverageTags`
    a `Record<sectionId,CoverageTag>` — autosaved **body**, tolerant of unknown ids (records, not
    enums), so a content-side id change never needs a schema bump. Support-passage text is **not**
    persisted (fetched at export, like the primary passage cache); `SupportPassage.text` stays null.

- **Stage 8** — Paste ingest + normalisation + review screen *(M2)* + the poetry render fix:
  - Acceptance gate: `npm run typecheck && npm run lint && npm test && npm run build` (all pass;
    lint 0 warnings; **207 unit tests** — +19→+23 `paste` incl. genre corpus + hard-psalm/acrostic
    regressions, +1 `PassageView` Magnificat render), then `npm run test:e2e` (2/2 — smoke suite
    unchanged).
  - Unit tests of note: `src/lib/paste/paste.test.ts` (chrome stripped + reference/translation
    recovered; "Read full chapter" + a "Footnotes" block captured to `notes`, inline `[a]` gone; a
    section heading detected; **poetry lines survive as separate indented segments**; a flowing prose
    paragraph splits one verse per number in sequence; assembled ids anchor to `kjv` from the ref; a
    **prose-opened song verse stays whole — no duplicated verse number** across blocks; a
    superscription-less Psalm is pure poetry; a **long musical superscription → heading not a phantom
    v0**; a **mid-line poetry verse number** (Ps 80 "…shine out. 2 Before…") is detected; **acrostic
    stanza markers** ("Aleph"/"Beth") are headings not swallowed lines; CRLF/NBSP/zero-width folded);
    `src/components/passage/PassageView.test.tsx` (a poetry-opening verse leads with its number — the
    `<br>` precedes the `<sup>`). **8 golden snapshots** over the PD/CC0 corpus.
  - **Manual flow (drive the app — verified live via Playwright MCP, 0 console errors):** New study →
    Phase 1 **"Paste your own text"** → `/study/:id/paste`. Owner pasted **real NIV** Luke 1:39-80,
    Psalm 80, Psalm 119 into the browser (real clipboard). **Tidy it up** → the review shows the
    detected reference + translation (NIV flagged as non-bundled → no auto copyright line), "removed N
    lines of app clutter", the editable segment list (line-type / verse-number / drop, amber = flagged)
    and a **live `PassageView` preview**. Correct a mis-detected line / drop junk → **Accept** →
    `setPassage(source:'pasted')` → Phase 1 shows the **"pasted text"** badge + read-only translation.
    **Phase 2** renders it (superscription as heading; poetry numbers lead each line — the render fix);
    **Phase 3** anchors the pasted verses (`PS.80.1-3`). Each real paste hardened one heuristic
    (Luke→stanza-opening line; Ps 80→long superscription + mid-line number; Ps 119→acrostic markers).
  - **PD/CC0 self-check** (for a fix after HMR cleared the owner paste): inject the WEBBE/ASV fixture
    text, `analysePaste` → assemble → DOM assert (verse ids, headings, no phantom v0). Copyrighted NIV
    samples are **never committed** (kept in the session scratchpad); the 8 committed fixtures are
    WEBBE/ASV only.
  - Inspect the persisted data (DevTools): IDB DB `quicktohear`, store `studies` **and** `passages`,
    the study's `passage.primary.source === 'pasted'` (the pasted block/line model is stored in full —
    source-of-truth, not a cache). A bundled passage has `source` absent/`'bundled'`.

- **Stage 9** — Secondary translations + comparison + versification (M3):
  - Acceptance gate: `npm run typecheck && npm run lint && npm test && npm run build` (all pass; lint
    0 warnings; **232 unit tests** — +9 `compare`, +12 `passage`, +1 `hydrate` upgrade, +3 `paste`
    YouVersion), then `npm run test:e2e` (2/2 — smoke suite unchanged).
  - Unit tests of note: `src/lib/compare.test.ts` (alignment flags Acts-8:37 / Matt-17:21 mismatch
    while **v38/v22 stay paired — never misaligned**; both-gap is not a mismatch; a secondary-only
    verse is surfaced; `alignVerse` on-demand; **`reversifyToKjv`** shifts a Hebrew-numbered Ps 51 →
    KJV and **flags the two title verses** as unmappable, unruled chapters map identically, input not
    mutated); `src/lib/passage.test.ts` (`primaryText`/`secondaryTexts`/`translationOrder`;
    `loadFreshPrimary`/`setPrimary` keep-secondaries-drop-old-primary/promote-a-secondary/
    `addSecondary`/`removeTranslation` protects the primary; **`normaliseStoredPassage`** upgrades
    `{primary}` + bare ParsedText + the M3 shape + junk→empty); `src/lib/storage/hydrate.test.ts` (a
    **v1 single-primary doc upgrades** into the translations map, nothing lost); `src/lib/paste/
    paste.test.ts` (**YouVersion**: `Book C:V-V ABBR` header → reference + translation; trailing
    `bible.com` URL stripped; `[NN]` bracket markers split the one-blob paragraph into verses 1–4;
    header doesn't leak into v1).
  - **Manual flow (drive the app — verified live via Playwright MCP, 0 console errors):** New study →
    Phase 1: `Matthew 17:20-22` → **Load** (WEBBE primary, 3 verses) → **Comparison translations** →
    add **ASV** (bundled) → the **Compare translations** viewer appears: **"1 verse doesn't line up"**.
    **At a verse** → tap **21** → WEBBE shows the text, ASV shows **"— omitted here —"**, flagged
    "present in some, omitted in others". **Side by side** → a 3-column table (Verse | WEBBE (primary)
    | ASV); **v21 row highlighted** with a "Translations differ here" icon, and **v22 pairs with v22**
    (never slid into v21's slot). **Hard reload** (`location.reload()`) → the ASV secondary + the
    comparison **rehydrate**; an IDB check confirms the passage store holds the **M3 shape**
    (`primaryId:'webbe'`, `translations:['webbe','asv']`, `asv.source:'bundled'`). Then
    `…/paste?as=secondary` renders **"Paste a comparison translation"** with the reference **seeded**
    from the study (`Matthew 17:20-22`) and (after analyse) a **"Verse numbering"** selector.
  - **Owner on-device tests still owed** (real clipboard, per the no-inject rule): (1) re-test the
    **fixed YouVersion primary paste** on the Pixel — the fix is HMR-live on the owner's `:8080` dev
    server (this session ran on `:8081`); (2) paste a **real comparison translation** (e.g. LSB) via
    the secondary flow and confirm it persists a reload. Both wired + unit-tested; only the
    real-clipboard fidelity pass is deferred.
  - Inspect the persisted data (DevTools): IDB DB `quicktohear`, store `passages`, the study's payload
    is now the **whole `{ translations, primaryId }`** container (was a bare `ParsedText`). A pasted
    secondary carries `source:'pasted'` (source-of-truth); bundled ones are `source:'bundled'` caches.
    `setup.secondaryTranslationIds` (a Stage-1 seam) is **left unused** — `passage.translations` is the
    single source of truth (see decision log).

- **Stage 10** — Depth + worked examples + PWA *(M4)* → **PLANNED BUILD COMPLETE**:
  - Acceptance gate: `npm run typecheck && npm run lint && npm test && npm run build` (all pass; lint
    0 warnings; **237 unit tests** — +1 `content/help` example-tier, +2 `<Help>` example disclosure,
    +2 `export/markdown` placement/pastoral), then `npm run test:e2e` (2/2 — smoke suite unchanged).
    `npm run build` reports **precache 14 entries** (was 7 — the raster PNG icons are now precached).
  - **Regenerate the icons** (only if `public/icon.svg` changes; PNGs are committed): `npm run
    build:icons` → `public/icons/{icon-192,icon-512,icon-maskable-512,apple-touch-icon-180}.png`
    (dep-free — drives the Playwright chromium already installed for e2e).
  - Unit tests of note: `src/lib/content/help.test.ts` (`parseHelp` extracts the `<!-- example -->`
    tier; empty when absent); `src/components/Help.example.test.tsx` (mocks `useHelp` → the "See a
    worked example" disclosure appears + reveals when an example is authored, absent otherwise);
    `src/lib/export/markdown.test.ts` (**context prints above / quoted below** the question, in
    document order, with `Context:`/`Quoted:` labels; a **pastoral note appears in the leader's notes
    but NOT the handout**).
  - **Manual flow (drive the app — verified live via Playwright MCP, 0 console errors):** `npm run dev`
    → **`#/attribution`** renders the authored credits + further-reading + the cited source line + a
    footer link on every screen. Open a built study (Luke 1:5-25, 2 questions) → **Phase 7 coverage
    map**: a **per-verse pip strip** per section (§1 Luke 1:5–13 = 9 pips, 0 touched; §2 = 12 pips, 1
    touched), a **progress line** ("All 1 untouched section tagged."), and a **"✓ Tagged as connective
    tissue"** readout. **Print handout** (`#/print/:id/handout`): a **context** support (Malachi 4:5-6)
    renders **above** its question (child order: support → question → writing space) with a "Context"
    label. **Phase 6e**: expand *More…*, tick **Pastoral sensitivity** → a **note textarea** appears;
    type a note, **Save**. **Print leader** (`#/print/:id/leader`): the note renders under the flagged
    question in a **"Pastoral sensitivity"** section + a `pastoral` tag on the question; the **handout
    excludes** the note, the expected answer, and the word "pastoral" (DOM-checked). **Portrait
    phase-nav**: at 390×844 the header's inline nav is `display:none` and a **second full-width row**
    (7 circles, active highlighted) renders below it; at 1280 wide only the inline nav renders —
    exactly one `<nav>` per viewport.
  - **PWA install / offline (verified on the production build via `vite preview` + Playwright
    `context.setOffline`):** the SW registers (`registerType:'prompt'`) and controls the page after one
    reload; precache = **10 app-shell entries** (JS/CSS/HTML/icons/manifest — Bibles are *not*
    precached); after fetching `bibles/webbe/luke.json` a **`qth-bibles`** runtime cache appears with
    that book; **going offline + reloading** still renders Home ("Prepare a Bible study") and still
    serves the cached Luke, while a **never-fetched** `bibles/asv/john.json` fails (`Failed to fetch`)
    — proving genuine offline, not cached-everything; the **"Ready to work offline"** toast
    (`<PwaReloadToast>`, `data-testid="pwa-toast"`) fires on first install (Dismiss only; the
    **"New version" + Reload** branch shows on `needRefresh`). The deployed site serves the identical
    `sw.js`/manifest/icons (curl-checked: manifest lists the 4 PNG/SVG icons, `sw.js` 200,
    `icons/icon-512.png` 200 `image/png`, `bibles/webbe/luke.json` 200). **Re-confirmed on the live
    Pages site** (`context.setOffline` after a fetch): offline reload renders Home, the fetched Luke
    serves from `qth-bibles`, an unfetched Mark fails — matching the preview result. **Regression fixed
    here:** the runtime route matcher was a broken closure (`${BASE}` undefined in the SW) — now the
    un-anchored `BIBLES_RE` regex; see the recap + decision log.
  - The **[X] worked-example tier shows nothing yet** — no `<!-- example -->` block is authored (by
    design; the machinery is proven by the unit tests). It will render the moment the teaching session
    adds one, no code change.

## Decision & deviation log

_Append-only. Newest last._

- **Planning** — Stack/architecture/staging agreed and written to `PLAN.md`. React +
  Vite + TS; GitHub Pages; modelled on `../local-ledger`.
- **Hardening pass** — 4 independent review agents (architecture/data-model,
  Bible-domain/versification, spec-fidelity/scope, frontend/build) + 1 cited
  Bible-data research agent. Findings folded into `PLAN.md`. Raw notes:
  `scratchpad/review-notes.md` (this session only).
- **User decisions (this session):**
  - Framework **React+Vite+TS**; hosting **GitHub Pages**; notifications **reuse
    `ntfy.sh/jsb-gh`**; theming **light/dark/system w/ system detection** (krenoda
    pattern, not next-themes).
  - **State = Zustand + selectors** (not Context+reducer).
  - **M1 expanded to include recycling** (Phases 3+4 + recycle-forward now in M1;
    stages renumbered 0–10; M1 = 0–7).
  - **Teaching text authored by the user**; full inventory delivered in
    `TEACHING-TEXT.md`. (It's CC BY-SA *method* content, not the user's study, so this
    doesn't conflict with "never generate the user's content".)
- **Research-driven architecture changes:**
  - Verse IDs are **anchored to the English (KJV/NRSV) versification**, not
    "translation-independent"; every translation carries `versification`; cross-version
    alignment **maps** via STEPBible TVTMS / `ubsicap/versification_json`, never
    number-equality; flag unmapped verses.
  - Verse model allows **verse 0 / letter suffix / merged ranges**; text stored as a
    **block/line model** (poetry lines as arrays, `\s` headings as editorial blocks,
    footnotes/red-letter tagged); **NFC** normalise.
  - Reference parsing = **`@openbibleinfo/bcv_parser`** (buy, not build).
  - Bundled translations = **WEBBE (British, primary, pinned) + ASV + BSB (CC0)**;
    **KJV dropped** (avoids UK Crown-copyright). Primary edition = **WEBBE**.
- **Versification re-review — RESOLVED (round 2, 3 independent agents, converged).**
  Evidence: WEBBE/ASV/BSB all use **identical KJV-style numbering** (3 John ends v14,
  Rev 12 ends v17 — KJV not NRSV); they differ only in *which numbered slots carry
  text* (omitted verses = numbered gaps, e.g. Acts 8:37 absent in WEBBE). So switching
  primary in M1 **never orphans an anchor**; number-equality within the bundle is
  correct; the mapping table is genuinely **M3-only**. Corrections applied to
  `PLAN.md` §4.2/§4.3/§4.5/§4.6/§6:
  - Anchor to **`kjv`** specifically (not "KJV/NRSV" — different systems).
  - Set **`bcv_parser` `versification_system:'kjv'`** (default is ESV-style, would
    emit 3 John 15 / Rev 12:18 our texts lack).
  - Add a per-verse **`present`** flag; switch-primary warns on "verse has **no text**
    in new primary", not "ID absent".
  - **M1 model trimmed:** `passage.primary` (single) not a `Record`; **verses nested
    in blocks** (`VerseSpan[]`); `SubVerseMark.span` = char offsets into the verse's
    NFC-concatenated fragments; **defer** merged-range/verse-0/letter-suffix logic and
    the multi-translation `Record` + mapping to M2/M3 (IDs stay plain strings to
    tolerate a future `1a`).
  - M3 mapping: prefer **`reversify`** (MIT, bcv_parser plugin) over the full TVTMS
    file; reserve TVTMS/`versification_json` for Hebrew/LXX/Vulgate breadth.
  - **Data-source trap to test:** eBible's ASV omits Matt 17:21 but BibleHub renders
    it — test against the eBible edition we ship (the `twice-daily` source).
- **Architecture hardening:** `Candidate` provenance + copy-on-promote; `hydrate()`
  never rejects (quarantine-keep) instead of "migrate or reject"; referential-integrity
  delete-cascades; id-keyed autosave debounce + flush-on-nav/visibility + multi-tab
  guard; `Study.build` is a discriminated union on `format` (Talk-mode seam).
- **Build hardening:** **HashRouter** (Pages 404s); Bibles **per-book, runtime-fetched**
  + Workbox runtimeCaching (not precache); Vitest **jsdom + fake-indexeddb + matchMedia
  stub**; `tsconfig.app.json` **strict:true**; **prune** local-ledger deps
  (react-query/recharts/papaparse/etc.); print CSS **light-palette + break-inside +
  print-color-adjust**; content glob uses **`{query:'?raw'}`** (Vite 5) + `react-markdown`;
  avoid `gray-matter` (Buffer polyfill).
- **prayer point** demoted to a **soft** audit item so Phase-6e expected-answer stays
  the **sole hard block**; **`gospelPlain`** question marker + conditional audit pulled
  into M1.
- **Teaching scaffold built** — `content/` populated with empty, keyed stubs (help) +
  method-data skeletons carrying `state`/`source`/`flag` fields, per the citation
  policy in `content/README.md`. **Teaching prose is deferred**; it will be authored in
  a separate session via `docs/TEACHING-TEXT-AGENT-PROMPT.md`. Dev stages must NOT write
  teaching prose — wire empty keys to a "guidance to be written" placeholder.
- **Session workflow:** one build stage per Claude Code session, handing off via this
  file; bootstrap each with `docs/DEV-SESSION-PROMPT.md`.
- **Stage 0 built (this session).** Vite 5 + React 18 + TS strict (`@vitejs/plugin-react-swc`);
  Tailwind 3 (`darkMode:['class']`) + shadcn config (`components.json`, `@` alias, `cn`,
  `ui/button`); custom **theme module** `src/lib/theme.ts` (krenoda-style Zustand
  light/dark/system, `applyTheme` at import, `matchMedia` change listener) + FOUC seed in
  `index.html` (`qth/theme`); **HashRouter** shell (`Layout` header = title + phase-nav
  placeholder + `ThemeToggle`; `Home` + `NotFound`); `vite.config.ts` (`base:/quick-to-hear/`,
  `@` alias, **VitePWA** with a **Bibles `runtimeCaching` stub** + base-aware
  navigateFallback/start_url/scope); ESLint flat + Prettier; **Vitest jsdom + fake-indexeddb
  + matchMedia stub** (`vitest.setup.ts`) with 5 tests; **Playwright** e2e smoke (`e2e/`,
  `playwright.config.ts`); `ci.yml` (typecheck+lint+test+build **+ separate Playwright job**
  `npx playwright install --with-deps chromium`) + `deploy.yml` (official Pages actions),
  both pinging **`ntfy.sh/jsb-gh`**; root **MIT `LICENSE`**, `README.md`.
  - **Deviations (all minor, none change a PLAN §2 decision):**
    - **Deps:** installed only what Stage 0 needs (react, react-dom, react-router-dom,
      zustand, `@radix-ui/react-slot`, cva/clsx/tailwind-merge, tailwindcss-animate,
      lucide-react, idb, `@tailwindcss/typography`). The pruned local-ledger deps
      (react-query/recharts/papaparse/embla/react-virtuoso/cmdk/input-otp/vaul/date-fns/
      gh-pages/next-themes) were **never added**. `idb`/`zod`/`react-hook-form` etc. come in
      at the stage that first uses them (Stage 1).
    - **PWA icon:** manifest + favicon use a single self-contained **`public/icon.svg`**
      placeholder (`sizes:any`, maskable). ~~Raster PNG icons deferred to **Stage 10**~~ **DONE
      (Stage 10)** — `public/icons/*.png` (192/512/512-maskable/180-apple) generated from the SVG by
      `npm run build:icons`; the SVG stays as the scalable `any` icon.
    - **tsconfig.app** is `strict:true` **plus** `noUnusedLocals`/`noUnusedParameters:true`
      (tighter than local-ledger, which is non-strict) — matches the "verse-ID/anchor code
      needs strict" intent; kept the code clean so the gate passes.
    - **Guidance placeholder:** added `GuidancePlaceholder` (`components/`) rendering
      "Guidance to be written (key)"; used once on Home to establish the convention. The
      `useHelp`/method-YAML loader that will consume real keys lands when help UI is built
      (Stage 4.7). No teaching prose written.
    - **Router:** left React Router v6 future-flag warnings unsilenced (cosmetic; opting
      into `v7_*` flags is a behaviour change best done deliberately later).
    - **theme-color hexes:** light `#ffffff`, dark `#020817` (approx of the dark bg token).
  - **Verified:** `typecheck && lint && test && build` all green (lint 0 warnings, 5/5
    tests); `preview` serves 200 under `/quick-to-hear/` with all assets base-prefixed +
    SW/manifest generated; Playwright e2e 2/2 pass; browser check confirmed light/dark/system
    toggle flips `<html>` class + `color-scheme` + `theme-color` and persists. **Post-push:
    `ci.yml` + `deploy.yml` both green; live URL serves the shell (HTTP 200), icon +
    manifest reachable.**

- **Stage 1 built (this session).** Added `zod` (only new runtime dep). Full `Study`
  zod schema spine for all seven phases (`src/types/study.ts`), M1-minimal per §4.3:
  `passage.primary` single + nullable with `blocks`/`notes` as pass-through `unknown[]`
  (Stage 2 tightens); verse IDs plain strings; `build` a **discriminated union on
  `format`** (`StudyBuild` | `TalkBuild` stub — §4.9 seam); `expectedAnswer` present on
  every `Question` (the hard-block field). `hydrate()` (`src/lib/storage/hydrate.ts`) is
  the single load path for **both** IDB-load and import: pure (caller passes `id`/`now`),
  fills defaults, mirrors `build.format` from `setup.format`, **quarantine-keeps** on any
  failure and **refuses** newer-schema docs (never strips unknown data blindly).
  IndexedDB layer (`db.ts` + `studies.ts`): DB `quicktohear` v1, **three stores** —
  `studies` (body **minus passage**, the autosave target), `passages` (payload, split so
  keystroke autosave never re-serialises it — §4.4), `quarantine`. Zustand study store
  (`src/store/study.ts`) with reducer-style actions; `useAutosave` (id-keyed 800 ms
  debounce + flush on route-change / `visibilitychange` / `pagehide` / `beforeunload` +
  one-shot `storage.persist()` + `BroadcastChannel` multi-tab guard via
  `src/lib/broadcast.ts`); `useStorageEstimate` meter. Home rewritten (list / new / open /
  delete / import + durability notice); minimal `StudyOverview` hub at `/study/:id`
  (edit reference + series note; export / delete; conflict banner) — an explicit
  Stage-1 placeholder the real Phase-1 form replaces. `crypto.randomUUID` ids via
  `src/lib/id.ts`. shadcn `Input`/`Textarea` added.
  - **Decisions (confirmed with the owner before building):**
    - **Import always mints a fresh study id** (content preserved) — never overwrites an
      existing study, so a trainee→trainer handoff can't clobber. Re-import appears as a
      second study. (Verified live: import produced a new `#/study/<uuid>`.)
    - **Built the whole `Study` schema spine now** (all phases, defaulted-empty), not
      just setup — so later stages plug in without reshaping the doc.
    - **`/study/:id` is a thin Stage-1 placeholder hub** (two set-up fields) purely to
      make persistence demonstrable; Stage 2 replaces it with the real Phase-1 route.
  - **Deviations (minor, none change a PLAN §2 decision):**
    - **`react-hook-form` deferred to Stage 2** (Stage 1 has two demo fields — plain
      controlled inputs → `updateSetup`; the "commit on blur via RHF" pattern lands with
      the real Phase-1 form). Keeps deps lean per §2 hygiene. Only `zod` added this stage.
    - **Delete uses an inline two-step confirm**, not a native `window.confirm`/modal
      (native dialogs block automation + add a Radix dep). Import errors render inline
      (no `sonner` yet).
    - **`hydrate` refuses `schemaVersion > CURRENT`** (quarantine-keep) rather than
      down-stripping a newer doc — an honest anti-data-loss guard beyond the §4.2 brief.
  - **Verified:** `typecheck && lint && test && build` all green (lint 0 warnings, 28/28
    unit); `test:e2e` 2/2. **Browser walk-through (Playwright):** New study → type →
    autosave wrote a body **with no `passage` key** while `passages` held the split
    payload → full page reload rehydrated both fields from IDB → Export produced a valid
    `quick-to-hear/study-project` envelope (full study, passage re-joined) → Delete →
    re-import restored under a fresh id → malformed import showed the friendly error and
    **quarantined** the raw blob (existing study untouched). 0 console errors (only the
    pre-existing RR v7 future-flag warnings).

- **Stage 2 built (this session).** New runtime dep **`bible-passage-reference-parser`**
  (v4, openbibleinfo) + dev dep **`tsx`** (runs the build script). Delivered: the
  block/line passage model (`src/types/passage.ts`; `study.ts` now re-exports `ParsedText`
  from there, tightening the Stage-1 `unknown[]` stubs); the verse lib (`src/lib/verse/`:
  66-book table with OSIS/USFM/genre, canonical `BOOK.CH.VS` IDs + ranges, and a
  `bcv_parser` singleton pinned to `versification_system:'kjv'`); the pure USFM parser
  (`src/lib/bible/usfm.ts`) + `scripts/build-bibles.ts` (extends `twice-daily`: poetry-line
  arrays, `\s`/`\r` headings, tagged footnotes/xrefs/`\wj`, `d` superscriptions, per-verse
  `present` flag, NFC) → `public/bibles/{webbe,asv}/*.json` (**committed**, 66 books each,
  ~14 MB, runtime-fetched); the loader (`loadBook` fetch+memory-cache) + `extractReading`
  (slice a range, keep in-range structure); `PassageView` (serif; superscript verse
  numbers; poetry line breaks from `Fragment.qlevel`; editorial headings marked; honest
  gap markers; quiet red-letter); real **Phase 1** (`Phase1Setup.tsx`: reference→parse→load,
  genre inferred+confirm, translation switch with textless-verse flag, duration/group/
  series/intro) and **Phase 2** (`Phase2Read.tsx`: quiet screen + tap counter); shared
  `StudyHeader`, `useOpenStudy`, native `ui/select`, `lib/{download,setup-options}`;
  interactive phase-nav (1–2 live, 3–7 disabled); routes `/study/:id` → `/1`, `/1`, `/2`.
  - **Decisions / deviations (none silently override a PLAN §2 lock; flagged for the owner):**
    - **Package name corrected:** PLAN wrote `@openbibleinfo/bcv_parser` (404 on npm). The
      real package is **`bible-passage-reference-parser`** (same author, openbibleinfo, v4).
      Same library, same API. *(PLAN §2/§4.3 updated.)*
    - **Bundled set = WEBBE + ASV now; BSB deferred** (PLAN §8 open-Q4). BSB is **not** in
      the local eBible sources and its USFM source/edition is unconfirmed by the owner —
      pinning an unvetted source is a decision §8 reserves. Adding it later is data-only:
      one row in `src/lib/bible/translations.ts` + `scripts/build-bibles.ts`, then
      `npm run build:bibles`. All Stage-2 acceptance tests only need WEBBE + ASV. **Owner
      action: confirm the BSB USFM download to pin (berean.bible).** *(PLAN §2/§4.5 noted.)*
    - **Block-kind model:** collapsed PLAN's `q1|q2` block kinds into a single **`q`**
      stanza with indentation on **`Fragment.qlevel`** (per-line, 0=prose/1–2=poetry) —
      because indentation is a per-*line* property (Ps 23:4 alternates q1/q2/q1/q2 within
      one verse). Kinds are `p|q|b|d|s1|s2`. This is *more* faithful to the poetry, and
      PLAN §4.2 says the final shape lives in code. *(PLAN §4.3 noted.)*
    - **Verse ID casing:** `BOOK.CH.VS` book part = **uppercased OSIS** (`LUKE.1.5`,
      `PS.23.1`, `3JOHN.1.14`) — matches the PLAN §4.3 example, round-trips with `bcv`.
    - **Gap verses come from USFM as `\v N \f…\f*`** (a verse marker whose only content is
      a footnote explaining the omission). Rule: a verse whose text is empty after note
      extraction → `present:false`, and the footnote is kept as a `StructuredNote`.
      Verified: WEBBE Acts 8:37 & Matt-17:21-in-ASV are gaps; Matt 17:21 has text in WEBBE.
    - **Phase-1 form uses controlled inputs → `updateSetup` (store is the single source of
      truth), not `react-hook-form`.** *Deviation from PLAN §2's "per-field text in RHF,
      commit on blur".* Rationale: the form is small; the Zustand store already holds the
      doc with selector subscriptions, so RHF would add a second form-state layer + a sync
      problem for little gain; the reference field needs an explicit **Load** action (async
      parse+fetch), not a blur side-effect (matches SPEC's "review the parse" intent). RHF
      can return for the heavier Phase-6 forms if whole-doc re-renders ever bite. **Owner:
      accept, or ask for RHF?** `@hookform/resolvers`/`react-hook-form` were **not** added.
    - **`setPassage` store action** persists body **+** passage together (bundled passage
      is a re-derivable cache per §4.4; keystroke autosave never touches the passage store,
      so the confirm step is explicit). Genre is **re-inferred on each Load** (a new
      reference ⇒ a new default genre); the genre select still overrides freely.
    - **Cross-book ranges** (e.g. `Matt 28 - Mark 1`) are **not** supported in M1 — the
      loader clamps to the start book and Phase 1 warns. Single-book passages are the norm.
    - Left the pre-existing **React Router v7 future-flag warnings** unsilenced (cosmetic).
  - **Verified:** `typecheck && lint && test && build` all green (lint 0 warnings, **64/64**
    unit — up from 28); `test:e2e` **2/2**. **Browser walk-through (Playwright, 0 console
    errors):** Luke 1:5-25 (narrative, paragraphs + verse numbers) and Psalm 23 (poetry
    lines + indent + chapter-attached superscription) both display in WEBBE; the read
    counter increments and **persists across navigation + a full reload**; switching primary
    WEBBE→ASV on Matt 17:20-22 flags **MATT.17.21** as textless and renders it as a numbered
    gap; the whole study (passage incl. gap, fields, read count) rehydrates from IndexedDB
    after a hard reload. Build excludes the 14 MB of Bibles from precache (484 KB, 7 entries).

- **Stage 3 built (this session).** No new deps. Delivered Phase 3 (map): the reusable
  `<VerseAnchorPicker>`, author's-break sections, and verse/phrase/word question marks with
  degrade-on-text-change. All Phase-3 logic is **pure** in `src/lib/map.ts` (ids passed in,
  not generated) so it's unit-tested directly; the page (`Phase3Map.tsx`) and store just wrap
  it via the existing `applyToCurrent` recipe action.
  - **Decisions / deviations (none override a PLAN §2 lock; flagged for the owner):**
    - **Sections are a live contiguous partition, edited by split/merge**, not free-floating
      ranges. Rationale: SPEC 3a is "*divide* the passage into sections" — a partition is the
      faithful model, it makes the author's-breaks discipline concrete (every verse in exactly
      one section, no gaps/overlaps), and it feeds Phase 6a weighting + the Phase 7 coverage
      map cleanly. The stored shape is still `Section{startVerseId,endVerseId,name,weight?}`
      exactly as `study.ts` defines; `sectionsMatchPassage()` validates the partition and, when
      stored sections don't fit the loaded passage (e.g. after a **reference change**), the UI
      falls back to the "Divide into sections" seed rather than corrupting or silently wiping.
    - **Sub-verse marks store char offsets *and* the exact selected substring**; the substring
      is the degrade check. `reconcileMarks` (PLAN §4.3's "degrade to whole-verse if the text
      changes") runs in **`setPassage`** — the single choke point for a text change (initial
      load, **translation switch**, future re-parse). A span mark whose substring no longer
      matches → whole-verse mark (span dropped, text refreshed); an orphaned mark (verse not in
      the new passage) is **kept untouched**, never discarded (Principle 7). Sections anchor by
      verse ID only, so a within-bundle translation switch (identical KJV numbering) leaves them
      valid — verified live.
    - **Phrase/word selection is by tapping word tokens** (a pure `tokenizeVerse` over the
      verse's NFC text gives `[start,end)` offsets), not native text-selection — deterministic,
      accessible, and Playwright-drivable. Word = one token; phrase = a contiguous run (tap
      first, tap last).
    - **Phase 3 uses controlled inputs + the store's `applyToCurrent` recipe**, not
      `react-hook-form` — the **same call the owner is still being asked to confirm from Stage 2**
      (controlled-inputs-vs-RHF). Section names / marks are small, low-frequency edits that
      autosave with the body; RHF would add a second state layer for no gain here. No new deps.
    - Marks are shown filtered to the loaded passage in **canonical verse order**; the mark
      `text` doubles as the snapshot Phase 6 will recycle into a candidate background box.

- **Stage 4 built (this session).** New deps: **`js-yaml`** (dep) + **`@types/js-yaml`**
  (devDep) — PLAN §2 names `js-yaml` as the method-data loader; it was only present
  transitively (via eslint), so it's now a direct dep. Delivered Phase 4 (COMA) + the
  recycle-forward wiring + the method-content loader. All the load-bearing logic is **pure**
  (`src/lib/content/method.ts`, `src/lib/recycle.ts`) and unit-tested; the page and store wrap it.
  - **Decisions / deviations (none override a PLAN §2 lock; flagged for the owner):**
    - **COMA prompts are NOT authored — `coma.yaml` is still the empty `todo` skeleton.** The
      verbatim Helm question sets are reproduced *by permission* from a copyrighted source; per
      **Inviolable rule 1** + the licence, the dev session must never write them. The teaching
      session hit a **content-filter 400** trying to echo the exact wording, so the owner will
      **transcribe them by hand**. Stage 4 is deliberately **decoupled**: the loader reads the
      six genre lists from the file, the schema **tolerates empty lists**, and the UI shows the
      composers + a "prompts pending" notice. Filling the file later needs **zero code change**.
      The **`attribution` string is present in the file and renders on screen** regardless
      (Inviolable rule 8) — verified live. **Integrated with teaching Batch 5b** (which merged
      to main mid-session): the page renders the authored **`coma.placeholder`** notice (gated
      on `state !== 'cited'`) instead of any dev-written prose, and the authored **`genres.yaml`
      `readingTip`** now renders as the genre reading guidance. Loader schema gained an optional
      `placeholder`; Phase-4 `p4.*` help prose is authored too but still shows via
      `GuidancePlaceholder` (the `useHelp` renderer is Stage 5's to build).
    - **Recycle-forward = copy-on-promote at the source→candidate hop (this stage), with the
      candidate→question hop reserved for Stage 6.** A Phase-3 mark / anchored Phase-4 note is a
      **live source** (`deriveRecycleSources`); the user opts it into the pool with **"Keep for
      Phase 6"**, which **snapshots** its text into a `Candidate` with a `source` back-link
      (`recycleToPool`, format-guarded to `study` builds). Thereafter editing the source is
      **detected** (`isSourceChanged`, snapshot vs live) but **never propagated**, and deleting
      the source **never removes** the candidate. Chose **explicit opt-in** over auto-materialise
      to avoid "source changed" noise during active note-taking and to make the snapshot a
      deliberate, demonstrable moment. Stage 6 (6d/6e) then promotes a `Candidate` → `Question`
      (the second snapshot, `Question.sourceCandidateId` already in the model).
    - **Only anchored, non-empty COMA notes recycle** (SPEC: "anchored notes are recycled");
      **all marks recycle** (a mark is inherently a verse-anchored confusion). A note's COMA
      category becomes the candidate's `questionType`.
    - **Method-content loader built (Stage-4.7, half of it).** `import.meta.glob('/content/
      method/*.yaml', {query:'?raw', import:'default', eager:true})` + `js-yaml` + zod, with
      **pure parsers** (`parseComa`/`parseGenres`) tested against the real shipped files via
      `?raw`. The **help-markdown** half (`useHelp` + `<Help>` three tiers + global guidance
      toggle) is **still unbuilt** — Stage 4 kept wiring help keys to `GuidancePlaceholder`
      (all Phase-4 `p4.*` help prose is still `todo` anyway). Stage 5 is the first stage with
      **authored** help prose to render, so it should build the help half then.
    - **Phase 4 uses controlled inputs + `applyToCurrent`**, not `react-hook-form` — the **same
      still-open owner call** carried from Stages 2/3. COMA notes autosave with the body.
    - **`recycleToPool` is idempotent** (a source already in the pool is left untouched), so the
      "Keep for Phase 6" button is safe to re-render/re-click.
  - **Owner UI/UX feedback captured (mid-session, 2026-08-06)** — see **`ROADMAP.md` §5** for the
    Phase-3/4/6 unified select-to-act redesign (design spike, wants mockups), and the two
    near-term defects below (poetry rendering; portrait phase-nav). Not folded into Stage 4;
    surfaced for a sequencing decision (suggested: a small polish pass for the two bugs + a
    dedicated mockup spike for the redesign).
  - **Verified:** `typecheck && lint && test && build` all green (lint 0 warnings, **106/106**
    unit — up from 87); `test:e2e` **2/2**. Full browser walkthrough (Playwright MCP) in Test
    entry points above; 0 console errors (only the pre-existing RR v7 future-flag warnings).

- **Stage 5 built (this session).** New dep: **`react-markdown`** (PLAN §2's named help
  renderer; `gray-matter` deliberately avoided — Buffer polyfill — so frontmatter is
  hand-split). Delivered Phase 5 (theme & aim, the hinge) **and the help-markdown half of the
  content loader** (§4.7), the piece Stage 4 left unbuilt. All load-bearing parsing is **pure**
  (`parseHelp`, `parseLitmus`/`parseTraps`/`parseStuckHelpers`) and unit-tested against the real
  shipped files; the page + store wrap it.
  - **Decisions / deviations (none override a PLAN §2 lock; flagged for the owner):**
    - **Help loader = root-absolute glob + hand-split frontmatter + `react-markdown`.**
      `import.meta.glob('/content/help/**/*.md', {query:'?raw', import:'default', eager:true})`,
      keyed by filename basename (so `p5.theme` resolves regardless of phase folder). Frontmatter
      is split with a small regex (leading `--- … ---`, tolerant of BOM/CRLF) and the YAML block
      parsed with `js-yaml`; the body splits on `<!-- inline|expandable|page -->` markers. The
      three tiers map to SPEC §5's **[I]/[E]/[X]** — but authored content only uses `inline` +
      `expandable` (+ one `page` for the attribution page); there is **no `example`/[X] tier in
      content yet**, so `<Help>` renders inline + expandable and the [X] worked-example tier is a
      later content+UI addition. A malformed file **degrades to empty tiers** (→ placeholder),
      never throws — the build never blocks on content.
    - **`<Help>` is a drop-in for `GuidancePlaceholder`** — it falls back to the exact same
      placeholder for any key with no inline prose, so **every `GuidancePlaceholder` call in
      Phases 1–5 was swapped to `<Help>`** in one pass. Phases 1/2/4 keys that are still `todo`
      keep showing the placeholder (unchanged UX); Phases 3 + 5 (authored) now show real prose.
      `GuidancePlaceholder` is **kept** as the fallback primitive (still imported by `<Help>`).
    - **Global guidance toggle = a header control + `qth/guidance` localStorage store**
      (`src/lib/guidance.ts`, modelled on `src/lib/theme.ts`; default **full**). `full` shows
      inline + "Tell me more"; `brief` collapses to inline only. Inline **source credits** (the
      `source:` frontmatter, e.g. Goldsworthy on `p5.christ-route`) render beneath the help in
      both modes — attribution isn't "detail" (SPEC §7). Placed next to the theme toggle; like
      the phase-nav it is `sm:`-visible via the header (the portrait-header defect in Known
      issues is unchanged — a separate quick fix).
    - **Litmus tests are a soft, on-exit review, revealed by a "Review the litmus tests →"
      button** ("presented as the user leaves the phase", SPEC §5) — five ack checkboxes →
      `themeAim.litmusAcks[id]` with a running "n of 5 acknowledged". **Not a hard block** (the
      only hard block is Phase 6e); the panel **auto-reveals on reload when any ack exists** so
      the review survives a refresh. The **four traps** are ack checkboxes → `themeAim.trapAcks`.
      Ack ids come from `litmus.yaml`/`traps.yaml`, and the model stores them as `Record<id,bool>`
      so a content-side id change never needs a schema bump.
    - **Traps rendered as a responsive card list, not the SPEC's literal table** — a table
      overflows in portrait (the logged phone defect); cards carry the same Trap / Looks like /
      Check content + the ack checkbox and read cleanly on narrow screens.
    - **"Faithfulness ≠ certainty" leads the phase** as a reassurance callout (not buried at the
      bottom as in the SPEC's prose order) — it is the ★★ "this is where users quit" message, so
      it frames the theme field rather than following it.
    - **Phase 5 uses controlled inputs + `applyToCurrent`**, not `react-hook-form` — the **same
      still-open owner call** carried from Stages 2/3/4. Theme/aim fields autosave with the body.
    - **No schema change** — Phase 5 writes into the `themeAim` block that already existed in
      `src/types/study.ts` (`theme/authorAim/groupAim/know/feel/doField/christRoute/litmusAcks/
      trapAcks`). `doField` (not `do`) because `do` is reserved.
  - **Owner request captured (mid-session, 2026-08-06):** a passage can carry **more than one
    genre** (Luke 1:39–80 = narrative + Magnificat/Benedictus poetry) — logged to **`ROADMAP.md`
    §6** ("defer to much later, just make a note"). Not touched this stage.
  - **Verified:** `typecheck && lint && test && build` all green (lint 0 warnings, **126/126**
    unit — up from 106); `test:e2e` **2/2**. Full browser walkthrough (Playwright MCP) in Test
    entry points above; 0 console errors (only the pre-existing RR v7 future-flag warnings).

- **Owner decisions (2026-08-06, post-Stage-5) — three long-open questions resolved:**
  - **Form state = controlled inputs + the Zustand store is the HOUSE STANDARD** (not
    react-hook-form). Resolved the question carried since Stage 2. Rationale: the store is
    already the single source of truth with autosave; RHF adds a second state layer for small,
    low-frequency fields; it's orthogonal to any layout redesign. **Future stages: build with
    controlled inputs + `applyToCurrent`; do not propose RHF.** (Also saved to auto-memory.)
  - **The YouVersion-style text-centric redesign (`ROADMAP.md` §5) is deferred until AFTER
    M1.** Keep building Stages 6–7 on the current chip-based `<VerseAnchorPicker>` (the model is
    anchor-ID based, so the redesign is a re-skin, not a re-architecture). **No mockups now.**
    The **layout metaphor is still open** (resizable split vs selection action-bar vs marginalia)
    — owner wants to research reading / note-taking tools before choosing; don't pick one
    unprompted. (Also saved to auto-memory + noted in ROADMAP §5.)
  - **BSB USFM edition (§8 #4) stays deferred** — app ships WEBBE + ASV; data-only add later.

- **Stage 6 built (this session).** No new deps. Delivered Phase 6 (build the questions) + the
  pure Phase-6 core (`src/lib/questions.ts`) + the formulas/warnings/question-litmus content
  loaders. All load-bearing logic is **pure + unit-tested**; the page is a thin wrapper.
  - **Decisions / deviations (none override a PLAN §2 lock; flagged for the owner):**
    - **The hard block is enforced at the candidate→question promotion boundary.** SPEC 6d "cut"
      and 6e "complete each promoted question" are slightly in tension (6e implies the question
      already exists), but the dev-session brief + Principle 3 are explicit: *a question cannot be
      **promoted** while `expectedAnswer` is empty*. So the completion editor holds a **draft** and
      only writes a `Question` on submit; the **"Promote to the study" button is disabled** while the
      expected answer is blank. The same draft-editor edits an existing question, and its **Save is
      also gated** on a non-empty answer — so a promoted question can **never** lose its expected
      answer (the invariant holds airtight, not just at creation). `promoteCandidate`/`updateQuestion`
      **re-guard** the same rule in the pure lib. The button is *also* disabled on empty question
      **text** (basic validity); the expected-answer requirement is the one carrying the
      "this is the enforced discipline" framing (SPEC 6e). Every other check — the three warnings,
      the meaning-order warning, the support-budget warning, the prayer point — is **soft/overridable**.
    - **`Candidate` gained an optional `anchor`** (additive-optional, **no `schemaVersion` bump** —
      `hydrate` fills defaults). Found during the browser drive: a recycled anchored note's verse
      anchor was being **lost at promotion** because `Candidate` didn't carry it and the promote
      editor seeded from `emptyDraft`. Recycle-forward *is* the point (Inviolable rule 4), so the
      anchor now snapshots onto the candidate (`makeCandidateFromSource`) and seeds the promote draft.
    - **Background boxes never enter the question flow.** A Phase-3 mark → `Candidate{kind:'background-box'}`
      is shown in a distinct **"Background boxes — for the handout"** list and is **excluded** from the
      6c brainstorm list and the 6d cut/promote flow (SPEC: marks become boxes, "tell them, don't ask
      them" — *never* questions). Only `kind:'question'` candidates are brainstormed/cut/promoted. The
      boxes will render on the handout in Stage 7.
    - **6a weight writes `map.sections[].weight`, not `build`.** The section weight is a property of
      the Phase-3 section (the model already had `Section.weight?`), so 6a mutates the map; everything
      else in Phase 6 writes `build`. A format-guarded page helper `updateBuild(fn)` narrows the
      `build` discriminated union once so the sub-handlers stay clean.
    - **Support-passage text is not fetched yet** — 6f captures the reference + kind + attach +
      return-question + the budget warning (the *tested* behaviours). Rendering the actual verse text
      of a support passage (via the bundled loader) is deferred to **Stage 7 export**, where the
      handout must print quoted passages; `SupportPassage.text` stays `null` until then.
    - **Sequencing is up/down buttons, not drag-and-drop** — accessible, deterministic, and
      Playwright-drivable (the redesign spike, ROADMAP §5, is deferred post-M1 anyway).
    - **Budget scaling:** `suggestedQuestionCount` pins the two SPEC anchors (45→6-8, 60→8-12) and
      scales 30→4-6 / 90→12-16 (the tool's own, matching the help prose which only commits to 45/60);
      support passages estimate the **midpoint** 4 min of SPEC's 3–5.
    - **Phase 6 uses controlled inputs + `applyToCurrent`/`updateBuild`**, per the owner-confirmed
      house standard (no react-hook-form). The one wrinkle: the `QuestionEditor` holds a **local draft**
      (so the hard block can gate *before* a Question exists) rather than writing each keystroke to the
      store — the store is still the single source of truth for everything that's committed.
  - **Verified:** `typecheck && lint && test && build` all green (lint 0 warnings, **154/154** unit —
    up from 126); `test:e2e` **2/2**. Full browser walkthrough (Playwright MCP) in Test entry points
    above — the hard block blocks then promotes, a soft warning is overridden, and sequence + prayer
    point + weights + support + boxes all survive a hard reload; **0 console errors** (only the
    pre-existing RR v7 future-flag warnings).

- **Stage 7 built (this session) → M1 COMPLETE.** No new deps. Delivered Phase 7 (audit + the three
  artefacts). All load-bearing logic is **pure + unit-tested**; the pages are thin renderers. The
  parallel teaching session advanced `main` to **Batch 18** in this shared working tree during the
  build (content only — `content/**`); no conflict (dev touches `src/` + the loaders). Batch 15 filled
  `audit.yaml` help, so per-check teaching prose renders with zero code change.
  - **Decisions / deviations (none override a PLAN §2 lock; flagged for the owner):**
    - **All audit logic is a pure lib** (`src/lib/audit.ts`), the Stage-6 pattern: `auditResults(study)`
      computes an 11-item `{id,status,applies,summary}` list; `coverageMap(study)` is the structured
      per-section evidence; the page (`Phase7Audit.tsx`) renders evidence + acks and never re-derives a
      status. **Nothing blocks** — a check is only ever `met` / `unmet` / `na`; even the required
      gospel-plain is a dismissable ack (Inviolable rule 3; the 6e expected-answer stays the sole hard
      block).
    - **Judgement checks compute a mechanical proxy.** "Every question *serves* the theme/aim" → proxy
      "theme + aim are written and there are questions" (the ack carries the human judgement);
      "application general→particular" → proxy "application questions are all last" (the ordering the
      tool *can* see), with general→particular left to the help + the eye. This keeps every row
      evidence-driven without the tool pretending to judge content it must never generate.
    - **"Untouched section" = a section no question anchors into at all** (0 touched verses) — the
      taggable unit. A partially-covered section shows "n of m verses touched" but needs no tag (SPEC:
      "every *untouched section* must be tagged"). Coverage is `na` when there's no valid Phase-3
      partition (prompt to divide first), never a false "met".
    - **Print routes sit OUTSIDE the Layout** via a React-Router **layout route** (`<Route element=
      {<Chrome/>}>` wraps the app; `/print/:id/*` are siblings) so nothing but the artefact prints.
      **Forced light two ways:** `.qth-print` re-declares the light colour tokens (so reused Tailwind
      components resolve light even under `.dark`) **and** `PrintShell` strips `.dark` from `<html>` on
      mount (restoring on unmount) — belt and braces, since a `dark:` utility variant (red-letter) would
      otherwise still fire. `@page{size:A4}` is a hint (CSS can't force A4-vs-Letter or hide the browser
      header/footer — PLAN §4.8 notes this); a JS PDF lib stays deferred.
    - **Handout = defined by exclusion, enforced at the model.** `handoutModel()` simply never carries
      an answer/theme/aim/type/timing field, so both the print React and the markdown are pure over a
      model that *cannot* leak them — the guard test asserts a known answer string is absent from the
      output **and** the model JSON. Background boxes = live `background-box` candidates (Phase-3 marks)
      **plus** `type:'background'` support passages; context/quoted support prints inline at its attach
      point.
    - **Support-passage text is fetched at export, not persisted** (`resolveSupportTexts`, async, reuses
      `loadReading` + `extractReading` in the study's primary translation) — the same "bundled passage
      is a re-derivable cache" stance as the primary (`SupportPassage.text` stays `null`; a failed/
      unparseable/cross-book ref resolves to the reference alone, never blocking the export).
    - **Copyright line wired** (was the known gap): `content/method/translations.yaml` → `parseTranslations`/
      `translationCopyright(id)` in the method loader; appended to the handout, leader, and both markdowns.
      Method/COMA + Goldsworthy attributions (from `coma.yaml`/`traps.yaml`) ride the leader's notes.
    - **Markdown = pure renderers over the same models** (`handoutToMarkdown`/`leaderToMarkdown` +
      `passageToMarkdown`), so the print page and the `.md` file can't drift; downloads reuse a small
      `downloadTextFile` added to `src/lib/download.ts`.
    - **Phase 7 uses controlled inputs + `applyToCurrent`** (acks + coverage tags), per the owner-confirmed
      house standard (no react-hook-form).
  - **Carried defects unchanged (not Stage-7's job):** poetry/verse-number rendering; portrait phase-nav
    (Phase 7's step 7 shares the same `hidden … sm:flex` nav). Neither blocks an export.
  - **Verified:** `typecheck && lint && test && build` all green (lint 0 warnings, **183/183** unit —
    up from 154); `test:e2e` **2/2**. Full browser walkthrough (Playwright MCP) in Test entry points
    above — coverage tag flips the check, gospel-plain na→unmet→acked, handout excludes answers +
    carries copyright (both ways), leader has everything, print forces light; **0 console errors** (only
    the pre-existing RR v7 future-flag warnings).

- **Stage 8 built (this session) → M2 first stage.** No new deps (reuses `bcv_parser`, `js-yaml`,
  the bundled loader). Delivered the paste path + normaliser + mandatory review screen, and fixed the
  carried poetry render defect. All load-bearing logic is **pure + unit-tested**; the page is a thin
  wrapper (controlled inputs + a local segment draft, committed on Accept via `setPassage` — the
  owner-confirmed house standard, no react-hook-form). Local `main` had already advanced to the
  teaching **COMA transcription** (`coma.yaml` `state:cited`) via the shared working tree; no conflict
  (dev = `src/`, teaching = `content/`).
  - **Decisions / deviations (none override a PLAN §2 lock; flagged for the owner):**
    - **The render fix came first + is its own concern.** The Stage-2 `PassageView` bug (verse number
      stranded on the previous line for a poetry-opening verse) **blocks trustworthy paste review** (the
      review renders poetry), so it was fixed up front — `ProseVerse` now places the number at the head
      of the verse's first rendered line, after any leading `<br>`; a `firstInBlock` guard suppresses a
      blank top line. The parser deliberately keeps mixed prose/poetry in one block (`type` doc), so this
      was always a **renderer** fix, not bad data / a re-download. Verified live on Luke 1:39-80.
    - **Two pure stages, review is the safety net.** `analysePaste` never guesses silently — every
      uncertain call is `flagged`; `assembleParsedText` is a separate pure fn. Heuristics are
      **structural first** (indentation, standalone digit tokens with a monotonic gate, blank-line
      paragraphs); **genre is never consulted** (§4.6). The review screen makes any miss correctable in
      ~30s, so the parser only has to be "correctable", not perfect.
    - **Pasted text is source-of-truth; bundled is a cache.** New `ParsedText.source` (additive-optional,
      absent=bundled — no `schemaVersion` bump). `setPassage` already persists body+passage together, so
      pasted text is stored in full. A pasted passage's Phase-1 translation is shown **read-only** (a
      bundled translation-switch would `loadReading` over it and lose the paste).
    - **Real-sample policy honoured.** The parser was tuned against **owner-supplied real NIV pastes**
      (the up-front blocker); each of Luke/Ps 80/Ps 119 exposed + fixed a distinct heuristic
      (stanza-opening line, long superscription + mid-line number, acrostic markers). Copyrighted samples
      stay **local** (scratchpad); the **8 committed golden fixtures are PD/CC0** (WEBBE/ASV) shaped like
      real BG output. **Owner testing workflow:** the owner pastes into the live browser (real clipboard);
      programmatic injection is a dev self-check only (saved to auto-memory).
    - **Deferred (owner, this session):** rendering the **footnotes/cross-refs** the bundled Bibles + a
      paste already *capture* (they are stored, not shown) — logged to **`ROADMAP.md` §7**. Not a bug.
    - **Non-goal held:** the tool never writes the user's content — the paste path ingests the *user's
      own* Bible text (not generated), and the review only structures it.
  - **Verified:** `typecheck && lint && test && build` all green (lint 0 warnings, **207/207** unit — up
    from 183); `test:e2e` **2/2**. Full browser walkthrough (Playwright MCP) in Test entry points above;
    **0 console errors** (only the pre-existing RR v7 future-flag warnings).

- **Stage 9 built (this session) → M3.** New dep: **none** (the `reversify` npm plugin was rejected —
  see below; the converter is vendored-pure). Delivered the multi-translation model migration,
  secondary translations (bundled + pasted), comparison (on-demand + side-by-side), the foreign→KJV
  converter, and — folded in from live owner feedback — a **YouVersion paste-format fix**. All
  load-bearing logic is **pure + unit-tested** (`src/lib/passage.ts`, `src/lib/compare.ts`); pages are
  thin (controlled inputs + the pure passage builders + `setPassage`, the owner-confirmed house
  standard). The parallel teaching session had already merged the COMA transcription; no conflict
  (dev = `src/`, teaching = `content/`).
  - **Decisions / deviations (flagged; the reversify one was raised + owner-approved mid-session):**
    - **RAISED + RESOLVED — `reversify` npm is incompatible with our `bcv_parser` v4.** PLAN §2/§4.3
      named `curiousdannii/reversify` (MIT) to "plug straight into `bcv_parser`". On inspection it is a
      **2016 plugin for bcv_parser v2**: it monkey-patches `bcv_parser.bcv_parser.prototype` (a shape v4
      — a TS class rewrite, `new bcv_parser(en)` — does **not** have, so it throws on load), peer-deps
      `bible-passage-reference-parser@^2`, pulls in **lodash**, and mutates the shared parser singleton
      (rewriting `regexps.translations` + `versification_system`). I **stopped and asked the owner** (with
      the plain-English impact); owner chose the **"small safe converter"**. So the foreign→KJV remap is a
      **pure, data-driven `reversifyToKjv`** (`src/lib/compare.ts`) — a small explicit `HEBREW_PSALMS`
      offset table (title-verse shift, verified against BHS), no deps, no singleton mutation, flags every
      unmappable (title) verse. Extends by adding table rows; unruled chapters map identically. **TVTMS /
      `versification_json` stay out** (§4.3, as directed).
    - **Model migration = a true restructure → schemaVersion 1→2.** `passage: { primary }` →
      `{ translations: Record<translationId, ParsedText>, primaryId }`. Keyed by `translationId`
      (self-describing; add-same-twice is idempotent). One upgrade point — **`normaliseStoredPassage`** —
      is shared by `hydrate` (import + IDB-load, via the `migrate()` seam) and is idempotent across all
      historical shapes (old `{primary}`, bare pre-M3 `ParsedText`, new shape, junk). Bumping (vs relying
      on shape-detection alone) is the honest anti-data-loss choice: a v2 doc opened by a v1 app is
      **refused + quarantined**, never silently stripped. The **passage store now holds the whole
      container** (was a bare `ParsedText`); IDB `DB_VERSION` unchanged (schemaless value, same 3 stores).
    - **`setPassage` now takes the whole passage; pages compose it with pure builders.** `loadFreshPrimary`
      (new reference → drop stale secondaries), `setPrimary` (translation switch → keep secondaries, drop
      old primary, promote a secondary if chosen), `addSecondary`, `removeTranslation` (never drops the
      primary). `setPassage` reconciles marks against the **resolved primary** (idempotent when only a
      secondary changed). Reader swap `study.passage.primary` → `primaryText(study.passage)` across audit,
      exports, and Phases 1–6 (mechanical; all still work).
    - **Comparison placement:** management (add/remove) lives in **Phase 1** (per the brief + SPEC §1);
      the reusable **`<TranslationCompare>`** viewer renders in **Phase 1 and Phase 2** (the read screen,
      where comparing-while-reading is natural). Both modes (on-demand + side-by-side) in one component.
      **Alignment iterates the primary's verse slots** (the anchor) then appends secondary-only slots, so
      nothing is dropped and same-numbered verses always pair — a gap on one side is a flagged mismatch at
      that exact slot, never a silent shift. Guidance ("comparison is for noticing an interpretive
      decision, not picking a preferred wording") is **inline functional copy**, not authored teaching
      prose (kept out of `content/` per the licensing boundary + the no-dev-prose rule).
    - **`setup.secondaryTranslationIds` (a Stage-1 seam) left unused.** `passage.translations` is the
      single source of truth (it holds the full text per translation, incl. bundled caches, mirroring how
      the bundled *primary* is already persisted). Wiring the id-list too would create a second source of
      truth for no gain. Additive field kept (no schema churn); a future re-derive-bundled-on-load
      optimisation could adopt it.
    - **YouVersion paste fix (folded in from a live owner Pixel test).** The owner pasted YouVersion LSB
      output on-device and it failed hard (reference line split, `[NN]` markers undetected → one blob,
      URL kept). `analysePaste` now handles it: `unwrapBracketedVerseNumbers` (`[39]`→` 39 `),
      `splitReferenceAndTranslation` (a `Book C:V-V ABBR` header on one line — peels 1–3 trailing tokens,
      bcv is the guard), and the trailing `bible.com`/bare-URL line as chrome. A **PD WEBBE fixture**
      shaped like YouVersion output (`yv-jonah1-webbe.txt`) locks it; the copyrighted LSB sample stays
      local. Strengthens Stage 9's pasted-secondary path too (same parser).
  - **Verified:** `typecheck && lint && test && build` all green (lint 0 warnings, **232/232** unit — up
    from 207); `test:e2e` **2/2**. Full browser walkthrough (Playwright MCP) in the Stage-9 Test entry
    points above — bundled secondary + on-demand/side-by-side compare + Matt-17:21 mismatch flagged +
    reload persistence + IDB shows the M3 container; **0 console errors** (only the pre-existing RR v7
    future-flag warnings). Real-clipboard paste fidelity (pasted secondary; YouVersion primary re-test)
    deferred to the owner per the no-inject rule.

- **Stage 10 built (this session) → M4 = the planned build (Stages 0–10) COMPLETE.** No new npm deps
  (the icon generator reuses the Playwright chromium already installed for e2e; the PWA toast uses
  `virtual:pwa-register/react` from the existing `vite-plugin-pwa`). Delivered the six Stage-10 threads
  + the carried portrait-nav fix (see the Stage-10 recap at the top + the Stage-10 spine/Test entry
  points).
  - **Owner decisions honoured (asked up front, all 3 recommendations taken):** support placement =
    **context above / quoted below** the question; PWA update = **`prompt` + a "Reload" toast** (not
    silent autoUpdate); pastoral = **add a captured `pastoralNote`** (not boolean-only).
  - **[X] worked-example tier is machinery-only, content-empty** — parser + hook + `<Help>` disclosure
    are wired and unit-tested; **no teaching prose authored by dev** (licensing boundary / no-dev-prose,
    same posture as the COMA skeleton). A filled `<!-- example -->` block renders with zero code change.
    Marker convention documented in `TEACHING-TEXT.md §1`.
  - **`registerType` switched `autoUpdate` → `prompt`.** The SW no longer reloads silently; the
    `<PwaReloadToast>` gives the user the reload choice (never clobbers an in-progress study). `main.tsx`
    no longer calls `registerSW` — `useRegisterSW` inside the toast registers it (`immediate`).
  - **Vitest doesn't load the VitePWA plugin**, so `virtual:pwa-register/react` is **aliased** to
    `src/test/pwaRegisterReactStub.ts` (an inert `useRegisterSW`) in `vitest.config.ts` — the toast
    renders nothing in unit tests. Typecheck resolves the real virtual types via the
    `vite-plugin-pwa/react` reference in `vite-env.d.ts`.
  - **Pastoral note + placement are additive-optional** — `Question.pastoralNote` is an optional field
    (no `schemaVersion` bump, like `wrongTurns`); `HandoutSupport.type` already carried the
    context/quoted distinction, so placement is a render-time split (no model change).
  - **BUG FIXED (pre-existing, since Stage 2): Bibles were never runtime-cached.** The
    `runtimeCaching` route's `urlPattern` was an arrow closure
    `({url}) => url.pathname.startsWith(`${BASE}bibles/`)`. `generateSW` **stringifies** the matcher
    into `sw.js` via `.toString()`, which preserves the source text `${BASE}` — but `BASE` doesn't
    exist in the SW scope, so the matcher threw on every request and the route silently never matched
    (no `qth-bibles` cache ever formed; "offline Bibles" never worked). **Fix:** an **un-anchored**
    `BIBLES_RE` RegExp (`/\/quick-to-hear\/bibles\//`). Gotcha worth remembering: a workbox
    **`RegExpRoute` tests the matcher against `url.href`**, not the pathname — an `^`-anchored path
    regex would also never match; the navigate-fallback **denylist**, by contrast, tests the pathname,
    and the un-anchored regex satisfies both. Confirmed with a real offline reload (Playwright
    `context.setOffline`): app shell + the fetched book load, an unfetched book fails.
  - **Verified:** `typecheck && lint && test && build` all green (lint 0 warnings, **237/237** unit — up
    from 232; precache **14 entries** = app shell + the 4 PNG icons); `test:e2e` **2/2**. Full browser
    walkthrough (Playwright MCP) in the Stage-10 Test entry points; **0 console errors** (only the
    pre-existing RR v7 future-flag warnings + one intentional offline-probe error). **PWA install +
    offline verified end-to-end on the production build** (`vite preview` + `context.setOffline`); the
    deployed site serves the identical artifact (manifest/sw/icons/bible curl-checked 200).
  - **Deviation from the Stage-10 list:** "Translation comparison notes" in the leader's notes (SPEC §7)
    is **not** built — no note-capture field exists for the M3 comparison viewer; logged as a Known
    issue + a deferred item, not silently skipped.

## Known issues / risks being carried

- ~~**[Owner feedback 2026-08-06] Poetry / verse-number rendering is wrong** (e.g. Luke 1:39-80)~~
  **RESOLVED (Stage 8)** — `PassageView` `ProseVerse` now leads a poetry-opening verse with its
  number (the `<br>` precedes the `<sup>`); verified live on Luke 1:39-80 (Magnificat + Benedictus)
  and covered by a `PassageView` unit test. Independent of the `ROADMAP.md` §5 redesign.
- ~~**[Owner feedback 2026-08-06] Phase-nav circles hidden in portrait on phones**~~ **RESOLVED
  (Stage 10)** — `Layout.tsx` now renders the stepper (`PhaseSteps`) in **two** `<nav>` copies: the
  inline header one (`hidden … sm:flex`) and a **second full-width header row** below `sm`. Exactly one
  is `display:flex` at any viewport (the other's parent is `display:none`, so it's out of the a11y
  tree too — no duplicate landmark). Verified live at 390×844 (second row shows, active circle
  highlighted) and 1280 (inline only).
- **[SPEC §7 gap — deferred] Translation-comparison notes are not in the leader's notes.** SPEC §7
  lists "Translation comparison notes" among the leader's-notes contents, but the M3 comparison
  feature (Stage 9) is a *viewer* — there is no field to capture the user's note about an interpretive
  difference, so nothing flows to the export. Adding it needs a small note-capture UI in the compare
  view + a `Study` field + a leader-model line. Not built this session (out of the Stage-10 list);
  logged for a future pass. Everything else in the SPEC §7 leader list is present.

- ~~Paste parser (Stage 8) needs **real user-captured samples**~~ **DONE (Stage 8)** — built +
  tuned against owner-supplied real NIV pastes (Luke 1:39-80, Psalm 80, Psalm 119); 8 PD/CC0 golden
  fixtures committed. ~~**YouVersion on Android** to be paste-tested~~ **ADDRESSED (Stage 9)** — the
  owner ran the on-device Pixel test mid-session; it exposed a real bug (YouVersion's `Book C:V-V ABBR`
  header, `[NN]` bracket markers, trailing `bible.com` URL). `analysePaste` now handles all three
  (`unwrapBracketedVerseNumbers` / `splitReferenceAndTranslation` / URL chrome), locked by a PD WEBBE
  fixture (`yv-jonah1-webbe.txt`). **Still owed:** a final **real-clipboard on-device confirmation** on
  the Pixel against the fixed code (HMR-live on the owner's dev server) — the fix is unit-verified but the
  end-to-end clipboard pass is the owner's (no-inject rule). Verse-number-in-prose disambiguation is a
  monotonic heuristic + the review-screen backstop, not perfect; splitting a merged segment isn't yet a
  review action (rare; editable text).
- **YouVersion flattens poetry to prose at copy time (a source limitation, not our parser).** A
  YouVersion paste of the Magnificat/Benedictus arrives as one blob with **no line breaks** — they never
  reach us, so we can't restore them. Reconstruction was considered + **deferred** (owner decision, 2026-08-07):
  from the bundled translation we can tell *which* verses are poetry but not *where* to break the paste's
  (different) wording — word-level cross-translation alignment is unreliable; and YouVersion's per-line
  capitalisation signal is useless for LSB (it capitalises divine pronouns). Instead the **PasteReview
  shows an honest, non-blocking heads-up** when the pasted reference is poetry in the bundled text yet the
  paste has no poetry lines — pointing the user to a bundled primary or a break-preserving source
  (BibleGateway). **Poetry is detected via `Fragment.qlevel > 0`, not block kind** — WEBBE stores the
  Magnificat as a `p` block with qlevel-1/2 lines (a gotcha worth remembering for any future poetry check).
  The real fix for poetry-from-YouVersion is out of scope (would need a review-screen line-splitting action
  or an OCR-of-the-rendered-page approach) — logged here, not built.
- **Footnotes / cross-refs / rich passage rendering deferred** (owner, Stage 8) — captured in the data
  (`ParsedText.notes` / `PasteAnalysis.notes`) but **not rendered**; see `ROADMAP.md` §7. Pasted notes
  are dropped at assemble until the renderer exists (additive when it lands).
- **BSB deferred** (§8 #4) — not in the local eBible sources; **owner to confirm the
  berean.bible USFM edition to pin**, then add one row in `translations.ts` +
  `build-bibles.ts` and run `npm run build:bibles`. The app shows only WEBBE + ASV meanwhile.
- WEBBE still updates → the pinned eBible source is the on-disk `engwebpb_usfm`; **record a
  formal eBible release/date** in `scripts/build-bibles.ts` before public release (the
  generated JSON is committed, so it won't drift until regenerated).
- **Bundled Bibles add ~14 MB** to the repo/`dist` (`public/bibles/`, 66 books × 2). They
  are runtime-fetched per book (~250 KB for Luke) and **excluded from the SW precache**
  (runtime-cached instead), so first paint stays small; but the repo is now heavier.
- `bcv_parser`'s `en` lang bundles into the main JS chunk (~455 KB / 122 KB gzip). Fine for
  now; could be lazy-loaded in the Stage-10 PWA-harden pass if it matters.
- ~~**`translations.yaml` copyright lines are not yet wired to exports**~~ **RESOLVED (Stage 7)** —
  `translationCopyright(id)` in the method loader resolves the exact line; appended to the handout,
  leader, and both markdown exports. (The `state: flagged` **verification** of each line against the
  exact shipped eBible edition is still owner-pending before public release — see the WEBBE/BSB notes.)
- "Work is never lost" is only as strong as the user exporting project files; `hydrate`
  quarantine + durability mitigations (`PLAN.md` §4.4) are the honest backstop.
- **Multi-tab guard is lightweight** (Stage 1): a `BroadcastChannel` `saved` event flags
  a conflict + offers "Reload"; it does not merge concurrent edits. There is no UI yet to
  view/recover **quarantined** blobs (they're kept in IDB, invisible) — add one if it
  ever bites. `hydrate` strips unknown keys on parse, so a forward-compat field on a
  same-version doc is dropped (newer *versions* are refused, not stripped).
- **`StudyOverview` (Stage 1) has been removed** — the real Phase-1/2 routes replace it.
  Home's `/study/:id` links now redirect to `/study/:id/1`.
- ~~**Phase-7 route falls through to NotFound**~~ **RESOLVED (Stage 7)** — `/study/:id/7` +
  `/print/:id/{handout,leader}` are wired, `BUILT_PHASES` includes 7, and Phase 6's "Next: Check &
  export" now links through. **All seven phase routes + `BUILT_PHASES` are live — M1 route surface
  complete.**
- **Reference-change orphaning (M1 edge, by design):** loading a *different* reference over
  an existing map leaves old sections invalid (UI offers re-divide) and old marks orphaned
  (kept in the doc, hidden from the passage view — never discarded). Switching *translation*
  within the bundle is fine (same verse IDs). Revisit if a "clear the map on reference change"
  prompt is ever wanted.
