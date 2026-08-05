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

- **Phase of work:** Planning + hardening complete; **content scaffolding in place**.
  **No application code written yet.**
- **Scaffolded already (do not recreate in Stage 0):** `content/LICENSE` (CC BY-SA),
  `content/README.md`, `content/help/**` (67 empty stubs), `content/method/*.yaml`
  (9 skeletons), `scripts/gen-help-stubs.sh`, and `docs/` (SPEC, PLAN, PROGRESS,
  TEACHING-TEXT, TEACHING-TEXT-AGENT-PROMPT, DEV-SESSION-PROMPT), CLAUDE.md, ROADMAP.md.
- **Next up:** Stage 0 — Scaffold + deploy + theming (`PLAN.md` §6). Use the
  `docs/DEV-SESSION-PROMPT.md` template (STAGE = 0) to run it in a fresh session.
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

- [ ] **Stage 0** — Scaffold + deploy + theming *(M1)*
- [ ] **Stage 1** — Model, storage (Zustand+idb+hydrate), autosave, project file, Home *(M1)*
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

- Stage 0: _(pending)_

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

## Known issues / risks being carried

- Paste parser (Stage 8) needs **real user-captured samples**; can't be built blind.
- BSB needs sourcing (not in `twice-daily`) — source USFM from berean.bible (`PLAN.md` §4.5).
- WEBBE still updates → **pin** the eBible release in `scripts/build-bibles.ts`.
- "Work is never lost" is only as strong as the user exporting project files; `hydrate`
  quarantine + durability mitigations (`PLAN.md` §4.4) are the honest backstop.
