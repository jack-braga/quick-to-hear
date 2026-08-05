# Build Plan — Quick to Hear

> **Read order for any session:** `PROGRESS.md` (where we are) → this file (the
> stage you're on) → `SPEC.md` (what the behaviour must be). Teaching/help content
> is inventoried separately in `TEACHING-TEXT.md` (the user authors it).
>
> This document holds the **locked technical decisions**, the **architecture**, and
> the **staged build order**. It changes only when a decision changes — and when it
> does, note the change in `PROGRESS.md`.
>
> `SPEC.md` is authoritative for *what* the tool does; this file for *how*. This
> plan has been hardened by four independent review passes + a cited Bible-data
> research pass (see `PROGRESS.md` decision log for provenance).

---

## 1. What this project is (one paragraph)

A free, static, account-less browser workbook that walks a user through preparing a
Bible study — from a passage reference to two printable documents (a participant
handout and leader's notes). It **structures, prompts, and checks; it never writes
the user's content.** Its two reasons to exist are (a) it **enforces disciplines**
paper cannot and (b) it **recycles the user's earlier input forward** into later
phases. Every decision serves those two.

---

## 2. Locked decisions (agreed with the user)

| Area | Decision | Notes |
|---|---|---|
| Framework | **React 18 + Vite + TypeScript** | Matches `local-ledger`. `@vitejs/plugin-react-swc`. |
| Language strictness | **`tsconfig.app.json` `strict: true`** | `local-ledger` ships `strict:false`; verse-ID/anchor code needs strict. `krenoda` is strict. |
| UI kit | **shadcn/ui + Tailwind 3** (`darkMode: ['class']`) | `components/ui/`, cva/clsx/tailwind-merge, `tailwindcss-animate`, `@tailwindcss/typography`. |
| Icons / toasts | `lucide-react`, `sonner` | As `local-ledger`. |
| **State** | **Zustand + selector subscriptions** for the study doc | *(user's pick)* Matches `krenoda`. Per-field text stays in `react-hook-form`, committed to the store on blur. Avoids whole-doc re-renders on every keystroke and cheap recompute of derived views (time total, coverage map, candidate lists). |
| Storage | **IndexedDB via `idb`**, one record per study | Not localStorage (theme pref may use localStorage). |
| Schema/validation | **`zod`** | Study schema, project-file import, content-data validation. |
| Forms | **`react-hook-form` + `@hookform/resolvers` (zod)** | Form-heavy app. |
| Routing | **`react-router-dom` v6 with `HashRouter`** | *(hardening)* Avoids GitHub Pages deep-link/refresh 404s. Print routes as `#/print/:id/handout`. Copies `local-ledger`'s `App.tsx`. |
| **Reference parsing** | **`@openbibleinfo/bcv_parser`** (MIT); **`set_options({versification_system:'kjv'})`** | *(research + review)* Buy, don't build. Outputs OSIS. **Must set `kjv`** — its default is ESV-style and would emit refs (3 John 15, Rev 12:18) our texts lack. |
| **Versification** | **Anchor verse IDs to the `kjv` versification**, stored explicitly | *(review)* Not "translation-independent", and specifically **`kjv`** not "KJV/NRSV" (they differ). Bundled WEBBE/ASV/BSB all share KJV numbering → align by number-equality + a per-verse `present` flag. Cross-*versification* mapping (`reversify`/TVTMS) is **M3-only** (§4.3). |
| **Bundled Bibles** | **WEBBE (primary, British, pinned) + ASV + BSB (CC0)** | *(user + research)* All English-tradition, safe to ship globally; **no KJV** (avoids the UK Crown-copyright caveat). WEBBE + ASV are free reuse from `twice-daily`; **BSB needs sourcing** (berean.bible USFM). See §4.5. |
| Print | **CSS `@media print` + `window.print()`** on `#/print` routes | No JS PDF lib unless guaranteed pagination/headers become required. Print forces a **light** palette (§4.8). |
| Markdown export | Generated from the study model | Handout + leader's notes also export as `.md`. |
| Help prose | **Markdown in `content/help/`**, loaded via `import.meta.glob(..., { query:'?raw', import:'default' })` | *(hardening: `{as:'raw'}` is deprecated in Vite 5.)* Rendered with `react-markdown`. Frontmatter split without `gray-matter` (needs Buffer polyfill). **Authored by the user — see `TEACHING-TEXT.md`.** |
| Method data | **YAML in `content/method/`** (`js-yaml`), zod-validated at load | COMA sets, formulas, litmus, traps, genre notes; attribution stored inside the data. |
| Tests | **Vitest (jsdom) + Testing Library + `fake-indexeddb` + matchMedia stub**; a few Playwright e2e | *(hardening)* `local-ledger`'s vitest is `node` with no IDB/matchMedia — model on `krenoda` instead. |
| Hosting | **GitHub Pages**, official Pages Actions | `base: "/quick-to-hear/"`. |
| CI/CD | `ci.yml` (typecheck+lint+test+build **+ Playwright**) and `deploy.yml` (build → `upload-pages-artifact` → `deploy-pages`) | Copy `local-ledger` in spirit; add `npx playwright install --with-deps chromium`. |
| PWA | `vite-plugin-pwa`; Bibles via Workbox **`runtimeCaching`**, not precache | *(hardening)* Full Bibles blow the 2 MiB precache limit. |
| Theming | **Light / dark / system**, custom module (no `next-themes`) | Mirrors `krenoda` `pwa/src/state/ui.ts`: toggle `.dark`/`.light` on `<html>`, set `colorScheme` + `<meta theme-color>`, `system` via `matchMedia('(prefers-color-scheme: dark)')` + change listener; `applyTheme()` at import (pre-paint, no FOUC); preference in `localStorage`. Tailwind `darkMode:['class']`. **Print always light** (§4.8). |
| Notifications | CI + deploy ping **`ntfy.sh/jsb-gh`** on success/failure | Same channel as `local-ledger`. |
| Node | 20 LTS in CI | Matches `local-ledger`. |
| Lint/format | ESLint flat config + Prettier | Matches the user's repos. |
| **Dependency hygiene** | Do **not** copy `local-ledger`'s dep list wholesale | Drop `@tanstack/react-query`, `recharts`, `embla-carousel`, `react-virtuoso`, `papaparse`, `date-fns`, `cmdk`, `input-otp`, `vaul`, and the vestigial `gh-pages` dep + script. |

### Licensing boundaries baked into the repo layout

- **`/` code → MIT** (`LICENSE`).
- **`/content` method text/data → CC BY-SA** (`content/LICENSE`).
- **COMA question sets** are reproduced *verbatim under permission* from *One-to-One
  Bible Reading* (David Helm); **Matthias Media / Holy Trinity Church** attribution
  must render **wherever COMA content appears**. Store the attribution inside the
  COMA data file so it can't drift.
- **Bible text** in-repo is **public-domain / CC0 only** (WEBBE, ASV, BSB — no KJV).
  All other translations are user-supplied at runtime, never committed. The
  translation id resolves a copyright line from `content/method/translations.yaml`
  (never parsed from free text) that is auto-appended to exports.

---

## 3. Repo conventions (mirroring `local-ledger`, hardened per review)

```
quick-to-hear/
  .github/workflows/{ci.yml, deploy.yml}     # + Playwright job, ntfy.sh/jsb-gh pings
  content/                # CC BY-SA
    LICENSE
    help/                 # per-location guidance Markdown (see TEACHING-TEXT.md)
    method/               # coma.yaml, formulas.yaml, litmus.yaml, traps.yaml,
                          #   stuck-helpers.yaml, genres.yaml, warnings.yaml,
                          #   translations.yaml (id → display name + copyright line)
  public/
    bibles/<translation>/<book>.json          # per-book, fetched at runtime
    pwa icons, etc.
  scripts/
    build-bibles.ts       # USFM → block/line JSON (extends twice-daily parser)
  docs/{SPEC.md, PLAN.md, PROGRESS.md, TEACHING-TEXT.md}
  src/
    components/  components/ui/
    contexts/             # ThemeProvider is a plain module; study store is Zustand
    hooks/                # useStudy(selector), useAutosave, useHelp, useVerseAnchor
    lib/
      verse/              # canonical IDs, ranges, versification mapping
      bible/              # loader (per-book fetch + cache), extractReading
      parse/              # paste normalisation + __fixtures__ (M2)
      storage/            # idb wrapper, hydrate(), export/import
      content/            # glob loaders + zod validation
      export/             # markdown + print models
      theme.ts            # krenoda-style light/dark/system
    pages/                # Home + one per phase + #/print/:id/{handout,leader}
    store/                # zustand study store + selectors + reducer-style actions
    types/                # zod schemas + inferred types
    utils/
  index.html              # seeds theme class before paint
  vite.config.ts          # base "/quick-to-hear/", @ alias, VitePWA runtimeCaching
  tailwind.config.ts, postcss.config.js, components.json
  tsconfig.json / tsconfig.app.json (strict) / tsconfig.node.json
  eslint.config.js, .prettierrc.json
  ROADMAP.md, README.md, LICENSE (MIT)
```

- Path alias `@/` → `src/`. `base` = `/quick-to-hear/`; every runtime/public asset
  via `` `${import.meta.env.BASE_URL}…` `` (verified pattern from `local-ledger`).
- VitePWA `navigateFallback`/`start_url`/`scope` must use the base (the gotcha
  `local-ledger` already solved).

---

## 4. Architecture

### 4.1 App shape & routing

One **study document** moved through 7 phases, plus a Home screen listing studies.
`HashRouter` routes: `/` (Home), `/study/:id/1..7`, `/study/:id/export`,
`/print/:id/handout`, `/print/:id/leader`. Persistent phase progress bar; free
back-navigation. Phases 1–5 are format-agnostic; **Phase 6 is the Talk-mode branch
point** (§4.9).

### 4.2 The study data model

One versioned document (zod schemas in `src/types/`, `Study` inferred). High-level
shape (final shape lives in code; keep this in sync):

```
Study {
  schemaVersion, id, createdAt, updatedAt
  setup { reference, genre, format:'study', durationMinutes, groupComposition,
          seriesNote?, introText?, primaryTranslationId, secondaryTranslationIds[] }
  passage { primary: ParsedText }                      // M1: single primary. M3 → { translations: Record<id, ParsedText> }
  read { count }
  map { sections: Section[]; marks: Mark[] }           // Section{id,startVerseId,endVerseId,name,weight?}
  coma { context:Note[]; observation:Note[]; meaning:Note[]; application:Note[] }
  themeAim { theme, authorAim, groupAim, know, feel, doField, christRoute,
             litmusAcks: Record<testId,bool>, trapAcks: Record<trapId,bool> }
  build:  StudyBuild | TalkBuild                        // discriminated on setup.format
  audit { acks: Record<checkId,bool>, coverageTags: Record<sectionId, tag> }
}

StudyBuild {                                            // format:'study'
  candidates: Candidate[]; questions: Question[];
  supportPassages: SupportPassage[]; prayerPoint; order: string[]
}

Candidate {                                             // recycle-forward provenance
  id, kind:'question'|'background-box', text,
  status:'open'|'promoted'|'discarded',
  source?: { kind:'mark'|'comaNote', id },              // back-link
  questionType?: 'context'|'observation'|'meaning'|'application'
}

Question {
  id, text, anchor: VerseAnchor,
  type, expectedAnswer /* REQUIRED — the one hard block */,
  weight:'light'|'medium'|'heavy', loadBearing:boolean,
  gospelPlain?: boolean,                                // for Phase-7 conditional audit
  aimComponent?: 'know'|'feel'|'do', wrongTurns?, pastoralFlag?,
  sourceCandidateId?, supportPassageIds?: string[], returnQuestion?
}
```

**Hardening rules (baked in):**
- **Recycle-forward = copy-on-promote.** Promoting a candidate snapshots its text and
  sets `sourceCandidateId`; editing the source note later sets a "source changed"
  flag, never mutates the promoted question; deleting a source never deletes the
  candidate/question.
- **Load = `hydrate(raw): Study`, never "reject".** One `hydrate()` used by *both*
  IDB-load and project import: additive-optional fields get defaults; bump
  `schemaVersion` only for true restructures; on unrecoverable parse failure,
  **quarantine and keep** the raw blob — never discard (Principle 7).
- **Referential-integrity cascades** on every delete (mirror `local-ledger`'s
  `DELETE_*`): `order` is filtered-on-read against live `questions`; support-passage
  ↔ question links kept bidirectionally consistent; `coverageTags` keyed by
  `sectionId` only; unknown `litmus/trap/check` ack ids tolerated (method YAML
  versions independently of `schemaVersion`).

### 4.3 Verse anchoring & versification (the load-bearing primitive)

> **Verified by 3 independent reviews (round 2).** Verdict: the fixed-anchor model is
> correct and correctly staged; the mapping layer is genuinely **M3-only**. Bundled
> WEBBE/ASV/BSB all use **identical KJV-style versification** — they differ only in
> *which numbered slots carry text*, never in numbering — so number-equality within
> the bundle is exactly right, and switching primary never orphans an anchor. See the
> PROGRESS decision log for the evidence.

Everything (questions, notes, marks, support-passage attach points, coverage map)
points at verses through one scheme, **anchored to the KJV versification** — *not*
"translation-independent" (a verse ID is only stable within a named versification).
Anchor to **`kjv`** specifically, **not "KJV/NRSV"** — they are *different* systems
(they differ at 3 John, 2 Cor 13, Rev 12); our bundled texts are **KJV-versified**
(3 John ends v14, Rev 12 ends v17).

- **Canonical verse IDs**: `"LUKE.1.5"` (`BOOK.CH.VS`, book codes from a fixed table),
  positions in the **KJV** versification. Anchors store IDs, never text offsets, so
  they survive edits/re-parse/primary switches. **Keep the ID a plain string** so it
  *tolerates* a future `"1a"`, but build **no** verse-0 / letter-suffix / merged-range
  *logic* in M1/M2 — WEBBE/ASV/BSB don't use them (superscriptions are `d` blocks, so
  verse-0 is moot). Add that logic only when a real pasted case demands it.
- **Block/line text model with verses nested in blocks (do not flatten).** `ParsedText
  = { translationId, versification:'kjv', blocks: Block[], notes: StructuredNote[] }`.
  A `Block` is one of:
  - `{ kind:'p'|'q1'|'q2'|'b', verses: VerseSpan[] }` — prose / poetry (indent level) /
    blank; **verses live inside their block** (a `p` holds many verses; a poetic verse
    spans many `q` lines), which fixes the block↔verse relation explicitly.
  - `{ kind:'d', text: Fragment[] }` — Psalm **superscription**, attached to the
    chapter, not verse 1.
  - `{ kind:'s1'|'s2', text, editorial:true }` — **editorial heading**, never "text
    to study".
  - `VerseSpan = { verseId, present: boolean, fragments: Fragment[] }` — `present:false`
    marks an **omitted/gap verse** (the numbered slot exists but the text doesn't,
    e.g. Acts 8:37 in WEBBE); `Fragment = { qlevel, text, wj? }` keeps poetry line
    breaks/indentation and red-letter.
  - `StructuredNote = { verseId, kind:'footnote'|'xref', text }` — **tagged, not
    deleted**.
  - **NFC-normalise** all text at ingest (bundled generation *and* paste).
- `VerseAnchor = { verseIds: string[] }` (one or many). **Sub-verse marks** add
  `{ verseId, span?: { start, end } }` where `span` is **character offsets into the
  NFC-concatenation of that verse's fragments**; **degrade to whole-verse** if the
  text later changes. (This is the Phase-3 picker's core output — pin it.)
- **Within the bundle: equate, don't map.** All three share KJV numbering, so
  alignment is plain number-equality plus the `present` flag. **Switching primary**
  re-checks anchors and warns when a **verse has no text in the new primary**
  (`present:false`) — *not* "ID absent in the versification" (that never happens among
  the three). A verse ID present in WEBBE but gapped in ASV/BSB is a **present-vs-absent
  flag, never a conflict**.
- **Cross-*versification* mapping is M3-only** (comparison of a genuinely
  foreign-versified pasted text — Hebrew-numbered Psalter, etc.). Not needed to ship
  M1/M2. When it lands, prefer **`curiousdannii/reversify`** (MIT, plugs straight into
  `bcv_parser`: KJV↔NRSV↔ESV…) over adopting the full TVTMS file; reserve **STEPBible
  TVTMS** (CC BY 4.0) / **`ubsicap/versification_json`** for Hebrew/LXX/Vulgate breadth.
  (This "one fixed anchor + map foreign in" design mirrors api.bible's `orgId` model —
  mainstream, not unusual.)
- Reference *parsing* uses **`bcv_parser`** with **`set_options({ versification_system:
  'kjv' })`** — its default is `'default'` (ESV-style: 3 John 15, Rev 12:18) which would
  emit refs for verses our texts lack. Our verse-ID lib converts OSIS ↔ our IDs and
  computes ranges. Heavy unit tests here — bugs corrupt everything.

### 4.4 Storage, autosave, durability

- `src/lib/storage/` wraps `idb`: `listStudies/getStudy/putStudy/deleteStudy`,
  `exportStudy`(JSON blob), `importStudy`(→ `hydrate` → zod).
- **Passage payload** (large, immutable once confirmed) stored so it is **not
  re-serialised on every keystroke** — a separate object-store/sub-key from the
  frequently-mutated study body (avoids quota churn). For **bundled** primary text the
  stored payload is only a **cache** (re-derivable from `reference` + `translationId`);
  only **pasted** text (M2) is source-of-truth that must be persisted.
- Bundled Bibles = static assets fetched per book at runtime + memory-cached — never
  in user storage.
- **Autosave** (`useAutosave`): debounce **keyed on `:id`**; **flush on route change /
  `visibilitychange` / `beforeunload`** (also guards against the PWA auto-update SW
  activating mid-edit); `BroadcastChannel` + `updatedAt` guard for multi-tab.
- **Durability** (Principle 7 vs browser-only — be honest): `navigator.storage.
  persist()` on first use; `estimate()` usage meter + warn before full; catch
  `QuotaExceededError` → prompt export; prominent "lives only in this browser" notice
  + one-click project export at phase exits. The **project file is the real backup**
  and the trainee→trainer handoff.

### 4.5 Bundled Bibles (WEBBE + ASV + BSB)

- **Final set (user decision): WEBBE + ASV + BSB. No KJV.** Primary = **WEBBE**
  (World English Bible British Edition — British spelling, "LORD"; suits the AU/UK
  audience).
- **License verdict (research, cited in PROGRESS log):** WEB/WEBBE = Public Domain
  (name is an eBible.org trademark; text is free); **BSB = CC0** (cleanest global
  license, modern English); **ASV = PD worldwide**. (KJV was dropped to avoid its
  UK Crown-copyright / letters-patent caveat.)
- **Pin the WEBBE edition** to a specific eBible.org USFM release (WEB still updates);
  record the release/date in `scripts/build-bibles.ts`.
- **Sourcing:** WEBBE + ASV are free reuse from `twice-daily` (`web-brit` = engwebpb =
  WEBBE; `asv`). **BSB is not in `twice-daily`** — source its USFM from berean.bible
  and run it through the same extended parser.
- **Reuse + extend `twice-daily`'s pipeline.** `twice-daily/scripts/parse-usfm.ts`
  already parses eBible USFM (sources on disk at `~/Documents/Projects/dailyOffice/*_usfm`),
  handles `\d` superscriptions and `\q` levels, has a book-names table, per-book JSON,
  and a runtime loader. **It must be extended for us:** (1) emit **poetry lines as an
  array**, not a space-joined string; (2) **capture `\s`/`\r` headings** as editorial
  blocks instead of dropping them; (3) **tag** footnotes/xrefs/`\wj` rather than
  stripping; (4) emit our block/line model + canonical IDs + `versification:'kjv'` +
  the per-verse **`present`** flag (omitted verses = numbered slot, no text).
- **Present-vs-absent, never conflict:** WEBBE carries a few verse IDs (e.g. Matt
  17:21) that ASV/BSB gap, and WEBBE itself gaps some (Acts 8:37). The loader/compare
  treats these as `present:false`, never a versification conflict.
- **Data-source trap (test this):** eBible's ASV **omits** Matt 17:21 (20→22) but
  BibleHub's ASV renders it — pin and test against the **eBible** edition we actually
  ship (the `twice-daily` source), not a web reference.
- Bundled texts also serve as the **paste-parser test bed** (SPEC §1).

### 4.6 Paste parsing (M2 — highest-risk; de-risked by the review screen)

The **mandatory Phase-1 review screen is the safety net**, so the parser only has to
be "correctable in 30 seconds."

- Emits the same editable block/line model (§4.3) + detected translation + reference
  range. Review UI edits verse boundaries, line breaks, heading reclassification,
  translation.
- **Source-aware heuristic pipeline:** strip chrome (copyright block, "read full
  chapter", footnote popovers) → **NFC-normalise**, strip NBSP/zero-width/bidi →
  detect verse markers (superscript **and** plain digits) vs **footnote letters** →
  handle **en/em-dash ranges** and **merged "17-18" tokens** (a merged unit is
  **atomic**: no sub-unit anchors, one coverage cell — this is the only place
  merged-range logic is built, and only if paste actually produces it) →
  **chapter-number vs verse-1 disambiguation** → classify prose/poetry/heading (incl.
  **mid-verse headings**) → **preserve poetry lines**. **Genre is only a tie-breaker**;
  structural
  evidence (indentation/short lines) wins (Luke 1 embeds the Magnificat; epistles
  embed hymns).
- Use `bcv_parser` to recover the reference from the paste. **Copyright line comes
  from `translations.yaml`, never parsed free text**; if the translation is
  unknown/undetected, require user entry before export.
- **Testing = golden-file corpus** (`src/lib/parse/__fixtures__/`): real BibleGateway
  + YouVersion pastes, prose **and** poetry. Commit **only PD/CC0** fixtures
  (WEB/ASV/BSB); keep copyrighted samples local. **Needs user-captured real samples.**

### 4.7 Help / method content

- **Prose** ([I]/[E]/[X]) → `content/help/*.md`, one file per location key (see
  `TEACHING-TEXT.md` for the full key list), loaded via `import.meta.glob('/content/
  help/**/*.md', { query:'?raw', import:'default' })` (root-absolute, base-independent,
  build-time), rendered with `react-markdown`. A `useHelp(key)` hook + `<Help>`
  component render the three tiers; the global **guidance toggle** (default full)
  collapses to [I]-only.
- **Method data** → `content/method/*.yaml` (`js-yaml`), each zod-validated at load,
  attribution **inside** the file. Includes `translations.yaml` (id → display name +
  exact copyright line).
- **Authored by the user** (see `TEACHING-TEXT.md`); the app shows a clear
  "guidance to be written" placeholder for any missing key, so build never blocks on
  content.

### 4.8 Print & export

- `#/print/:id/handout` and `#/print/:id/leader` render from the study model with a
  print stylesheet (A4/Letter). `window.print()` → save PDF.
- **Print always uses a light, ink-safe palette** regardless of theme; the print CSS
  resets colours. Apply `print-color-adjust: exact` to background boxes (browsers drop
  backgrounds by default) and `break-inside: avoid` per question/writing block. Note:
  CSS **cannot** remove the browser header/footer or force A4-vs-Letter (`@page size`
  is a hint). Revisit a JS PDF lib only if guaranteed pagination/headers become
  required.
- **Handout = defined by exclusion** (passage primary-only, numbered questions with
  writing space, inline support passages, background boxes, prayer point, translation
  copyright line, optional intro). **No** theme/aim/type/timings/answers — guard-tested
  both ways: answers **excluded**, copyright line **present**.
- **Leader's notes = everything** (theme/aim/know-feel-do, Christ route, section map +
  weights, each question w/ expected answer + anchor + type + weight + wrong turns,
  load-bearing + suggested drop order, reserved background, pastoral flags, comparison
  notes, attributions/copyright).
- Markdown export for both; project-file export = the whole `Study` JSON.

### 4.9 Talk-mode seam (build now, don't fill)

`Study.build` is a **discriminated union on `setup.format`** (`StudyBuild` |
`TalkBuild` stub). Phase 6 UI is selected by `format` (`pages/phase6/StudyBuild.tsx`
now; `TalkBuild.tsx` later). No Phase-6 assumption leaks into shared state.

---

## 5. Cross-cutting rules (must hold in every stage)

1. **The passage is the subject** — nothing out-competes the biblical text visually.
2. **Never generate the user's content** — prompts/formulas/tests/examples only.
   (Teaching prose is method content, not the user's study — user-authored per
   `TEACHING-TEXT.md`.)
3. **One enforced discipline; everything else soft.** Hard block: **Phase 6e — no
   question promotes without an expected answer.** All other checks (incl. the prayer
   point) are **warnings/acknowledgements the user can override**.
4. **Recycle forward** with provenance (§4.2): Phase 3 marks → candidate background
   boxes; Phase 4 anchored notes → candidate questions.
5. **Guidance at the moment of need**, beside the field.
6. **Warnings, not blocks** (except 3).
7. **Work is never lost** — autosave + easy export; honest about browser-only limits;
   `hydrate()` never discards.

---

## 6. Staged build order

Each stage ends **testable and committable**. After a stage: run its "how to test"
gate, update `PROGRESS.md`, commit. **M1 now includes recycling** (user decision), so
M1 is the complete workbook on **bundled Bibles, primary translation only**. Paste
ingest (M2) and secondary translations (M3) come after.

**M1 = Stages 0–7** · **M2 = Stage 8** · **M3 = Stage 9** · **M4 = Stage 10.**

### Stage 0 — Scaffold + deploy + theming
Vite+React+TS; Tailwind (`darkMode:'class'`) + shadcn init (`components.json`, `@`);
**light/dark/system theming** (krenoda pattern, applied pre-paint, header toggle);
**HashRouter** app shell (header, phase-nav placeholder, Home route); pruned deps;
ESLint flat + Prettier; Vitest (**jsdom + fake-indexeddb + matchMedia stub**) + one
test; `vite.config.ts` (`base`, `@`, VitePWA minimal w/ runtimeCaching stub);
`ci.yml` + `deploy.yml` (**Playwright job + `ntfy.sh/jsb-gh`**); root MIT `LICENSE`;
README; ROADMAP. **Note:** `content/` is **already scaffolded** (`content/LICENSE`
CC BY-SA, `content/README.md`, 67 `help/**` stubs, 9 `method/*.yaml`, and
`scripts/gen-help-stubs.sh`) and `docs/` exists — do **not** recreate these; just make
`.gitignore`, `tsconfig`, etc. sit alongside them.
**Test:** `npm run dev` shell; theme toggle flips + `system` follows OS; `typecheck &&
lint && test && build` pass; push → Pages URL loads shell. **Done:** live URL renders,
theme works, CI green.

### Stage 1 — Study model, storage, autosave, project file, Home
zod `Study` schema + `hydrate()`; **Zustand** store + selectors + reducer-style
actions; `idb` layer (passage payload separated); `useAutosave` (id-keyed debounce +
flush-on-nav/visibility + persist request + estimate meter + multi-tab guard); Home
(list/new/open/delete/import); export/import project file with `hydrate`+zod and
quarantine-keep on failure.
**Test (unit):** storage CRUD; `hydrate` upgrades a v-old fixture + quarantines a bad
blob; import rejects malformed with a friendly error. **(manual):** create study →
type → reload persists → export → re-import restores → delete. **Done:** a study
survives reload + full export/import.

### Stage 2 — Bundled Bibles + verse lib + Phase 1 setup + Phase 2 read
`scripts/build-bibles.ts` (extend `twice-daily` parser: poetry-line arrays, `\s`
headings, tagging, block/line model, canonical IDs, `versification:'kjv'`, per-verse
`present` flag, NFC) → `public/bibles/<tr>/<book>.json` for **WEBBE + ASV + BSB**;
`src/lib/bible` loader (per-book fetch + cache + `extractReading`); `src/lib/verse`
(IDs, ranges, OSIS↔ID) with `bcv_parser` **set to `versification_system:'kjv'`**;
heavy verse-lib tests; Phase 1 form (reference via `bcv_parser`, **genre
inferred+confirm**, format=study, duration, group, series, introText, pick primary
from bundled); passage renderer (verse numbers, poetry lines, editorial headings
marked, superscriptions, gap verses); Phase 2 quiet read + tap counter. *(No paste —
bundled only; `passage.primary` single translation.)*
**Test (unit):** ref parse for `Luke 1:5-25` + a cross-chapter range; `bcv_parser`
under `kjv` does **not** emit 3 John 15 / Rev 12:18; genre inference; poetry renders as
lines; superscription attaches to chapter; a gap verse (Acts 8:37 in WEBBE) has
`present:false`; **switching primary WEBBE→ASV flags the now-textless verse, not an
absent ID**. **(manual):** Luke 1:5–25 (narrative) + a Psalm (poetry) in WEBBE →
display + counter. **Done:** a bundled passage displays correctly through Phases 1–2
and persists.

### Stage 3 — Phase 3 map + verse-anchor picker
Structure (author's-break sections, named) + question marks (verse/phrase/word);
`<VerseAnchorPicker>` (one/many verses, reused in Phases 4–6); help for both.
**Test:** picker returns correct IDs; sub-verse mark degrades on edit. **(manual):**
divide + name sections, mark confusions. **Done:** Phase 3 persists; picker works.

### Stage 4 — Phase 4 COMA + recycle-forward wiring
Genre → which COMA prompts; **verbatim Helm sets from `coma.yaml` + Matthias
Media/HTC attribution on screen**; anchored notes; **recycling**: Phase 3 marks →
candidate background boxes ("tell them, don't ask them"), Phase 4 anchored notes →
candidate questions of matching type — with provenance + copy-on-promote (§4.2).
**Test (unit):** a meaning note surfaces as a meaning candidate; editing source flags
"changed", doesn't mutate promoted; attribution renders wherever COMA shows.
**Done:** COMA notes + marks flow into the candidate pool with correct framing.

### Stage 5 — Phase 5 theme & aim (the hinge)
Theme/author-aim frames; group aim; know/feel/do; on-demand stuck helpers (5); litmus
tests acknowledged on exit; Christ/gospel test + traps table; the "faithfulness ≠
certainty" guidance; inline source credits (Goldsworthy/Chapell/Robinson).
**Test:** litmus-ack gating; persistence. **(manual):** complete Phase 5; leave →
litmus prompts require ack. **Done:** Phase 5 completes + persists.

### Stage 6 — Phase 6 build the questions
6a weight sections; 6b budget + running time total; 6c generate-wide (recycled
candidates + **formula library** from `formulas.yaml`, scaffolded stems); 6d cut
(promote/discard, discards hidden); 6e complete-each (text, anchor, type, **required
expected answer — hard block**, weight, load-bearing, `gospelPlain`, aimComponent,
optional wrong-turns/pastoral) + inline per-type litmus + **soft warnings** (yes-no,
leading, double-barrelled); 6f support passages (3 kinds, subordinate display, budget
warning at 3rd context/quoted, **return-question prompt**); 6g sequence with the
meaning-before-its-observations warning; 6h required prayer point (soft in audit).
**Test (unit):** promote blocked without expected answer; warning regexes; budget math;
support-passage budget warning + return-question fires. **(manual):** build 6–8
questions, sequence, add a support passage. **Done:** full Phase 6 flow works.

### Stage 7 — Phase 7 audit + exports  → **M1 complete**
Audit checklist with evidence + dismiss-w/-ack (serves theme+aim; expected-answer
present; **coverage map** with per-section tag; type balance; meaning-order;
application last & general→particular; know/feel/do; time vs length; ≥2 load-bearing;
**gospel-plain required when group mixed/one-to-one non-Christian**; prayer point);
**exports**: handout (guard-tested: answers excluded, copyright present) + leader's
notes, each print-CSS route + markdown; project-file export.
**Test (unit):** each audit check against crafted studies; gospel-plain fires for the
right group; handout export purity both ways; markdown snapshots. **(e2e):** Luke
1:5–25 → map → COMA → theme/aim → questions → audit → export handout + leader → print.
**Done:** end-to-end bundled workbook yields a clean handout + full leader's notes.

### Stage 8 — Paste ingest + normalisation + review screen  *(M2)*
Paste path in Phase 1; normalisation pipeline (§4.6); **mandatory review screen**;
golden-file corpus (PD/CC0 committed; copyrighted local). Needs user-captured samples.
**Test:** snapshot corpus (prose+poetry, both sources); manual real pastes → review →
correct. **Done:** representative pastes correctable in ~30s; poetry lines survive.

### Stage 9 — Secondary translations + comparison + versification mapping  *(M3)*
Move `passage.primary` → `passage.translations: Record<id, ParsedText>`; add secondary
translations (bundled or pasted); on-demand per-verse compare (default) + optional
side-by-side. **KJV-versified texts align by number-equality + `present` flag (no
mapping).** Only a genuinely **foreign-versified pasted text** needs remapping into the
KJV anchor — add **`reversify`** (MIT, plugs into `bcv_parser`) then; reserve
TVTMS/`versification_json` for Hebrew/LXX/Vulgate breadth. Flag unmappable verses;
guidance that comparison is for noticing interpretive decisions.
**Test:** number-equality + present-flag alignment across WEBBE/ASV/BSB; `reversify`
remap of a foreign-versified sample; unmappable-verse flags. **Done:** comparison
works; mismatches flagged, never silently aligned.

### Stage 10 — Depth + worked examples + PWA  *(M4)*
Coverage-map polish; **worked-examples ([X]) tier** across phases (one canonical
passage); support-passage handout placement refinements; pastoral flags in leader's
notes; offline-harden PWA (Bibles via runtimeCaching, update-ready toast); full
attribution page.
**Test:** audit checks; PWA install + offline load. **Done:** full audit + offline.

### Later — Talk mode (out of scope now)
Branch at Phase 6 via §4.9. Tracked in `ROADMAP.md`.

---

## 7. Testing strategy

- **Unit (Vitest/jsdom):** verse-ID + versification mapping, parser golden files,
  recycle provenance + copy-on-promote, warning regexes, budget math, audit checks,
  export purity (handout excludes answers / includes copyright), content-YAML zod
  validation, `hydrate`/quarantine, autosave flush.
- **Component (Testing Library):** the 6e hard block, guidance toggle, anchor picker
  (needs `fake-indexeddb` + matchMedia stub).
- **e2e (Playwright):** M1 happy path (Stage 7); a paste-and-review flow after Stage 8.
- Each stage's "how to test" is the acceptance gate; CI runs typecheck+lint+test+build
  +Playwright.

---

## 8. Open questions to confirm with the user

**Resolved** (in decision log): framework, hosting, state (Zustand), M1 includes
recycling, theming (light/dark/system), notifications (ntfy), teaching-text authored
by user, **versification anchor = `kjv`** (round-2 review: WEBBE/ASV/BSB share KJV
numbering; mapping is M3-only), reference parser (`bcv_parser`,
`versification_system:'kjv'`), block/line JSON model (M1-minimal per §4.3),
twice-daily reuse, **bundled set = WEBBE + ASV + BSB (no KJV)**, **primary edition =
WEBBE**.

**Still open (do not block Stage 0):**
1. **Worked-example passage** (`TEACHING-TEXT.md` §6): pick one — ideally the same as
   the demo/parser-test passage.
2. **Real paste samples** for Stage 8 — user-captured BibleGateway + YouVersion (prose
   + poetry). Only the user can capture these.
3. **Repo/site name** = `quick-to-hear` (drives Pages `base`)? Assumed yes unless told
   otherwise.
4. **BSB sourcing** — confirm the berean.bible USFM download to pin (Stage 2 detail).
