# Progress Tracker — Quick to Hear

> **This is the first file to read in any session.** It records where the build
> actually is. Update it at the end of every stage (and any time you stop
> mid-stage): mark what's done, note deviations, say what the next session should
> do first, and give the exact commands to run and test right now.
>
> Read order: **this file → `PLAN.md` (current stage) → `SPEC.md` (behaviour)**.
> Teaching/help content is inventoried in `TEACHING-TEXT.md` (user-authored).

---

## Current status

- **Phase of work:** **Stage 3 complete** — **Phase 3 (map the passage)**: author's-break
  **sections** (named, a live contiguous partition you split/merge), **question marks**
  (verse/phrase/word with sub-verse char-offset spans that **degrade to whole-verse** when
  the text changes), and the reusable **`<VerseAnchorPicker>`** (one/many verses → sorted
  `VerseAnchor`). Verified end-to-end in a real browser (Playwright MCP): Luke 1:5-25 split
  into 3 named sections, a phrase + a word marked, all persisted across a full reload, and
  both sub-verse marks degraded to whole-verse when the primary was switched WEBBE→ASV.
  **Stages 1–2 remain true below.**
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
- **Next up:** Stage 4 — Phase 4 COMA + recycle-forward wiring (`PLAN.md` §6, SPEC Phase 4).
  Use `docs/DEV-SESSION-PROMPT.md` (STAGE = 4). Genre → which COMA prompts (verbatim Helm
  sets from `coma.yaml` + Matthias Media/HTC attribution on screen); anchored notes reuse
  **`<VerseAnchorPicker>`** (multi-select); **recycling** — Phase 3 `map.marks` →
  candidate background boxes, Phase 4 notes → candidate questions of matching type, with
  provenance + copy-on-promote (§4.2). The Stage-4.7 help loader (`useHelp` + method-YAML)
  is still unbuilt — dev stages keep wiring keys to `GuidancePlaceholder`.
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
- [ ] **Stage 4** — Phase 4 COMA + recycle-forward wiring *(M1)*
- [ ] **Stage 5** — Phase 5 theme & aim (the hinge) *(M1)*
- [ ] **Stage 6** — Phase 6 build the questions *(M1)*
- [ ] **Stage 7** — Phase 7 audit + exports → **M1 complete**
- [ ] **Stage 8** — Paste ingest + normalisation + review screen *(M2)*
- [ ] **Stage 9** — Secondary translations + comparison + versification mapping *(M3)*
- [ ] **Stage 10** — Depth + worked examples + PWA *(M4)*

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
      placeholder (`sizes:any`, maskable). Raster PNG icons deferred to **Stage 10** (PWA
      harden) rather than shipping a manifest that 404s.
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

## Known issues / risks being carried

- Paste parser (Stage 8) needs **real user-captured samples**; can't be built blind.
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
- **`translations.yaml` copyright lines are not yet wired to exports** — the Stage-2
  translation registry (`src/lib/bible/translations.ts`) carries id/name only; the exact
  copyright line (a functional requirement) is applied at Stage 7 via the method-YAML loader.
- "Work is never lost" is only as strong as the user exporting project files; `hydrate`
  quarantine + durability mitigations (`PLAN.md` §4.4) are the honest backstop.
- **Multi-tab guard is lightweight** (Stage 1): a `BroadcastChannel` `saved` event flags
  a conflict + offers "Reload"; it does not merge concurrent edits. There is no UI yet to
  view/recover **quarantined** blobs (they're kept in IDB, invisible) — add one if it
  ever bites. `hydrate` strips unknown keys on parse, so a forward-compat field on a
  same-version doc is dropped (newer *versions* are refused, not stripped).
- **`StudyOverview` (Stage 1) has been removed** — the real Phase-1/2 routes replace it.
  Home's `/study/:id` links now redirect to `/study/:id/1`.
- **Phase-4–7 routes fall through to NotFound** until built; the phase-nav renders 4–7 as
  disabled steps and Phase 3's "Next: COMA" is disabled. Stage 4 wires `/study/:id/4`.
- **Reference-change orphaning (M1 edge, by design):** loading a *different* reference over
  an existing map leaves old sections invalid (UI offers re-divide) and old marks orphaned
  (kept in the doc, hidden from the passage view — never discarded). Switching *translation*
  within the bundle is fine (same verse IDs). Revisit if a "clear the map on reference change"
  prompt is ever wanted.
