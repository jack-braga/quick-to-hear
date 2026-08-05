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

- **Phase of work:** **Stage 1 complete** — the study data model, IndexedDB storage
  (with the passage payload split out), autosave, project-file export/import, and the
  Home + minimal study-overview screens all landed and are verified end-to-end in a
  real browser. A study now survives a reload and a full export → re-import.
- **Scaffolded already (do not recreate):** `content/LICENSE` (CC BY-SA),
  `content/README.md`, `content/help/**` (67 empty stubs), `content/method/*.yaml`
  (9 skeletons), `scripts/gen-help-stubs.sh`, and `docs/` (SPEC, PLAN, PROGRESS,
  TEACHING-TEXT, TEACHING-TEXT-AGENT-PROMPT, DEV-SESSION-PROMPT), CLAUDE.md, ROADMAP.md.
- **Stage-1 spine (do not recreate):** `src/types/study.ts` (full `Study` zod schema
  for all seven phases, defaulted-empty), `src/lib/storage/{db,hydrate,studies,index}.ts`,
  `src/lib/{id,broadcast}.ts`, `src/store/study.ts`, `src/hooks/{useAutosave,useStorageEstimate}.ts`,
  `src/pages/{Home,StudyOverview}.tsx`, `src/components/ui/{input,textarea}.tsx`.
- **Next up:** Stage 2 — Bundled Bibles + verse lib (`bcv_parser` @ `kjv`) + Phase 1
  setup + Phase 2 read (`PLAN.md` §6). Use `docs/DEV-SESSION-PROMPT.md` (STAGE = 2).
  Stage 2 fills `passage.primary` (the `ParsedText` `blocks`/`notes` are `unknown[]`
  pass-throughs today — Stage 2 tightens them) and builds the real Phase-1 form, which
  **replaces** the Stage-1 `StudyOverview` placeholder hub.
- **Live:** https://jack-braga.github.io/quick-to-hear/ renders the shell (HTTP 200).
  GitHub Pages source was already = "GitHub Actions"; no manual flip was needed. Both
  `ci.yml` and `deploy.yml` went **green on the first push**.
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
- [ ] **Stage 2** — Bundled Bibles + verse lib (bcv_parser) + Phase 1 + Phase 2 *(M1)*
- [ ] **Stage 3** — Phase 3 map + verse-anchor picker *(M1)*
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

## Known issues / risks being carried

- Paste parser (Stage 8) needs **real user-captured samples**; can't be built blind.
- BSB needs sourcing (not in `twice-daily`) — source USFM from berean.bible (`PLAN.md` §4.5).
- WEBBE still updates → **pin** the eBible release in `scripts/build-bibles.ts`.
- "Work is never lost" is only as strong as the user exporting project files; `hydrate`
  quarantine + durability mitigations (`PLAN.md` §4.4) are the honest backstop.
- **Multi-tab guard is lightweight** (Stage 1): a `BroadcastChannel` `saved` event flags
  a conflict + offers "Reload"; it does not merge concurrent edits. There is no UI yet to
  view/recover **quarantined** blobs (they're kept in IDB, invisible) — add one if it
  ever bites. `hydrate` strips unknown keys on parse, so a forward-compat field on a
  same-version doc is dropped (newer *versions* are refused, not stripped).
- **Stage-1 `StudyOverview` is disposable** — Stage 2 replaces it with the real Phase-1
  route; don't build on it. Its two fields write straight to the store (no RHF yet).
