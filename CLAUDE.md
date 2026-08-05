# CLAUDE.md — Quick to Hear

A free, static, account-less **browser workbook for preparing a Bible study** —
from a passage reference to two printable documents (a participant handout and
leader's notes). It **structures, prompts, and checks; it never writes the user's
content.** Its reason to exist is to (a) enforce disciplines paper cannot and
(b) recycle the user's earlier input forward into later phases.

## Start every session here

1. **`docs/PROGRESS.md`** — where the build actually is + how to resume. Read first.
2. **`docs/PLAN.md`** — locked tech decisions, architecture, and the staged build
   order (Stages 0–9). Read the stage you're on.
3. **`docs/SPEC.md`** — the authoritative behaviour spec (the seven phases). Read
   the phase you're building.
4. **`docs/TEACHING-TEXT.md`** — the inventory of guidance/help text (user-authored).

Then check `git log --oneline` and, once Stage 0 has landed,
`npm run typecheck && npm run lint && npm test && npm run build`.

**Reusable sibling repos:** `../twice-daily` (USFM→JSON Bible pipeline + eBible
sources on disk — reuse & extend), `../local-ledger` (Vite/Pages/HashRouter/PWA
template), `../krenoda` (theming, Zustand, vitest jsdom+fake-indexeddb).

## Working agreement

- **Build one stage at a time** (`PLAN.md` §6). Each stage ends testable and
  committable. When a stage is done: run its "how to test" gate, **update
  `docs/PROGRESS.md`** (status, what changed, next up, deviations), then commit.
- The plan is designed for **fresh sessions to hand off cleanly** — keep
  `PROGRESS.md` accurate enough that a new agent can continue without you.

## Inviolable rules (these override convenience)

1. **Never generate the user's content.** No auto-written questions, theme, aim, or
   application. The tool provides prompts, formulas, tests, examples — never the
   user's answers. This is the whole point; violating it defeats the tool.
2. **The passage is the subject** — nothing out-competes the biblical text visually.
3. **One enforced discipline, everything else soft:** a question cannot be promoted
   without an **expected answer** (Phase 6e) — that is a hard block. All other
   checks are **warnings the user can override**.
4. **Recycle earlier input forward** (Phase 3 marks → background boxes; Phase 4
   anchored notes → candidate questions).
5. **Guidance at the moment of need**, beside the field.
6. **Work is never lost** — autosave + easy export; be honest about browser-only limits.
7. **Bible text shipped in-repo is public domain only** (WEB, KJV). All other
   translations are user-supplied at runtime and never committed. The translation
   at ingest drives the copyright line auto-appended to every export.
8. **COMA attribution** (Matthias Media / Holy Trinity Church) must render wherever
   COMA content appears — it's stored inside the data so it can't drift.

## Stack (locked — see `PLAN.md` §2)

React 18 + Vite + TypeScript (**strict**) · shadcn/ui + Tailwind (`darkMode:'class'`) ·
**Zustand** (study store) + `react-hook-form` (fields) · `idb` (IndexedDB) · `zod` ·
`react-router-dom` **HashRouter** · **`@openbibleinfo/bcv_parser`** (reference parsing) ·
`react-markdown` + `js-yaml` (content) · Vitest **jsdom + fake-indexeddb** + Playwright ·
GitHub Pages (official Pages Actions, `base:"/quick-to-hear/"`) · `vite-plugin-pwa`
(Bibles via runtimeCaching) · light/dark/system theming (krenoda-style, no next-themes).
Bundled Bibles: **WEBBE + ASV + BSB** (no KJV). Verse IDs **anchored to the `kjv`
versification** (`bcv_parser` set to `kjv`); the three share KJV numbering so they
align by number-equality + a per-verse `present` flag; cross-versification mapping is
M3-only. (Verified — see PROGRESS decision log.) Modelled on `../local-ledger`; Bible pipeline from
`../twice-daily`.

## Licensing boundary

`/` code is **MIT**. `/content` (help prose + method data) is **CC BY-SA**. Keep
guidance and method text in `content/` so the boundary is a directory, not a
judgement call.

## Conventions (mirroring `../local-ledger`)

- Path alias `@/` → `src/`. Layout: `src/{components,components/ui,contexts,hooks,
  lib,pages,types,utils}`; `content/{help,method,bibles}`; `docs/`.
- Two workflows: `ci.yml` (typecheck+lint+test+build) and `deploy.yml` (Pages).
- ESLint flat config + Prettier. Node 20 in CI.
- `ROADMAP.md` captures deliberately-deferred work (Talk mode, series mgmt, etc.).
