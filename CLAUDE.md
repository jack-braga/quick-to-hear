# CLAUDE.md — Quick to Hear

A free, static, account-less **browser workbook for preparing a Bible study** —
from a passage reference to two printable documents (a participant handout and
leader's notes). It **structures, prompts, and checks; it never writes the user's
content.** Its reason to exist is to (a) enforce disciplines paper cannot and
(b) recycle the user's earlier input forward into later phases.

## Start every session here

> **The app is 100% v2 (the text-central, ten-lens flow). v1 was deleted, not frozen** — a clean
> break: no users, studies non-upgradable, v1 not maintained. The v1 build log + tech plan live
> in `docs/archive/` as a reference crib only.

1. **`docs/PROGRESS.md`** — where the build actually is + how to resume. Read first.
2. **`docs/ROADMAP-v2.md`** — the v2 model, the build order (§4), and the per-item log (§5).
3. **`docs/V2-UX-BACKLOG.md`** §7 — the authoritative current flow + the durable owner feedback;
   §4 — the remaining polish backlog.
4. **`docs/SPEC.md`** — the authoritative behaviour *intent* (opens with a v1-phase → v2-lens map).
5. **`docs/TEACHING-TEXT.md`** — the inventory of guidance/help text (user-authored).

Then check `git log --oneline` and run the gate:
`npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`.

*(Archived reference: `docs/archive/PROGRESS-v1.md`, `docs/archive/PLAN.md` — the v1 Stages 0–10.)*

**Reusable sibling repos:** `../twice-daily` (USFM→JSON Bible pipeline + eBible
sources on disk — reuse & extend), `../local-ledger` (Vite/Pages/HashRouter/PWA
template), `../krenoda` (theming, Zustand, vitest jsdom+fake-indexeddb).

## Working agreement

- **Land one scoped increment at a time.** Each ends testable and committable: run the full gate
  (`typecheck && lint && test && build && test:e2e`), **update `docs/PROGRESS.md`** (status, what
  changed, next up, deviations), then commit.
- Keep `PROGRESS.md` accurate enough that a **fresh session can resume without you** — that hand-off
  is the point.

## Commits & branching (owner policy)

- **Never add Claude/Anthropic co-authorship to commit messages.** No
  `Co-Authored-By: Claude …` trailer, ever. (A `Claude-Session:` link is fine.)
- **Work straight to `main` and push** — the owner is happy with this while there
  are no users yet. Dev-stage sessions **drive their own commit + push**; don't
  wait to be asked. (Exception: a session running in a git worktree commits to its
  own branch, then it's merged back — see `docs/DEV-SESSION-PROMPT.md`.)
- Keep commits scoped to the stage; write a concise message.

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

## Stack (locked — see `docs/archive/PLAN.md` §2)

React 18 + Vite + TypeScript (**strict**) · shadcn/ui + Tailwind (`darkMode:'class'`) ·
**Zustand** (study store) + controlled inputs (fields — no form library) · `idb` (IndexedDB) · `zod` ·
`react-router-dom` **HashRouter** · **`bible-passage-reference-parser`** (`bcv_parser`, reference parsing) ·
`react-markdown` + `js-yaml` (content) · Vitest **jsdom + fake-indexeddb** + Playwright ·
GitHub Pages (official Pages Actions, `base:"/quick-to-hear/"`) · `vite-plugin-pwa`
(Bibles via runtimeCaching) · light/dark/system theming (krenoda-style, no next-themes).
Bundled Bibles: **WEBBE + ASV** (no KJV; BSB deferred, not shipped). Verse IDs
**anchored to the `kjv` versification** (`bcv_parser` set to `kjv`); they share KJV numbering so they
align by number-equality + a per-verse `present` flag. Cross-versification *mapping* is **not built**
— the old Hebrew-Psalms remap was removed (§1.8); pasted comparison assumes standard English numbering
(a note says so). Modelled on `../local-ledger`; Bible pipeline from `../twice-daily`.

## Licensing boundary

`/` code is **MIT**. `/content` (help prose + method data) is **CC BY-SA**. Keep
guidance and method text in `content/` so the boundary is a directory, not a
judgement call.

## Conventions (mirroring `../local-ledger`)

- Path alias `@/` → `src/`. Layout: `src/{components,components/ui,contexts,hooks,
  lib,pages,types,utils}`; `content/{help,method,bibles}`; `docs/`.
- Two workflows: `ci.yml` (typecheck+lint+test+build) and `deploy.yml` (Pages).
- ESLint flat config + Prettier. Node 20 in CI.
- `docs/ROADMAP-v2.md` captures deliberately-deferred work (Talk mode, series mgmt, etc.).
