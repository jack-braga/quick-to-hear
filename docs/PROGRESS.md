# Progress Tracker — Quick to Hear

> **Where the build is + how to resume.** Read this first, then `docs/ROADMAP-v2.md` (§4 build
> order, §5 per-item log) and `docs/V2-UX-BACKLOG.md` §7 (the authoritative flow + owner feedback).
> The v1 build log (Stages 0–10) and the v1 plan are archived under `docs/archive/` — v1 is
> **deleted**, not frozen; the app is 100% v2.

## Current state (2026-08-14)

**The app is the v2 text-central workbook.** `App.tsx` mounts only `V2App`; the passage is the
canvas and annotations sit over it. The flow is **10 lenses**: `01 Set up · 02 Read · 03 Survey ·
04 COMA · 05 Deepen · 06 Theme & aim · 07 Weigh · 08 Write · 09 Build · 10 Check`. Bundled Bibles
are **WEBBE + ASV** (public domain); other translations are user-pasted at runtime, never committed.

Gate at every commit: `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`.

## Most recent arc — the triaged sweep-fixes (COMPLETE)

Executed `docs/HANDOFF-sweep-fixes.md` (owner-triaged decisions from the health sweep in
`docs/SWEEP-FINDINGS.md`), group by group, each committed + pushed with a green gate:

- **A** — store/persistence hardening: a failed passage/reset write is kept, retryable, surfaced
  (§1.4–§1.6); `getStudy` quarantine dedup + ghost-row hiding (§1.10f). New `resetPassage` action.
- **B** — paste parser: cross-chapter paste splits chapters (§1.1, owner-verified live against a real
  BibleGateway paste); lone verse-number line, phantom-verse-0 floor, name-vs-prose guard (§1.10a/b/c).
- **C** — dropped the Hebrew-Psalms versification remap (§1.8); assume KJV numbering + a plain note.
- **D** — `@` must start a word to chip (§1.10d).
- **E** — a single-book verse list is labelled accurately, not "extra passages" (§1.9; new `verseList`).
- **F** — multi-tab conflict banner wired in the reader (§3.3).
- **G** — COMA answers scoped to their genre's prompt row (§1.3; new `comaGenre`).
- **H** — the Check audit reads the real exported support + minutes, rebuilt on `exportModel` (§1.2).
- **I** — deleted v1 vestiges: `map.marks` (§1.7), `recycle.ts` + `recycleToPool` (§6.1), dead
  revisions exports (§6.2). Kept `map.sections` (Survey).
- **J** — security: escape the image caption in exported markdown (§2.1); strip junk C0/C1/DEL
  control chars on paste, keeping the RTL isolates + ALM (§2.2).
- **K** — a11y: combobox ARIA on the three autocompletes, a modal command palette (focus trap + Esc),
  keyboard image reorder (§4).
- **L** — memoize the parallel-view arrays so hovering stops rebuilding verse maps (§5.1).
- **M** — focus effects depend on specific fields, not the whole `props` object (§6.4).
- **N** — tests for the never-lose-data + single-chapter branches; pinned `single_chapter_1_strategy` (§3.4).
- **O** — this doc reorg (§8).

See `docs/SWEEP-FINDINGS.md` for the evidence + the commit for each item.

## Resume points

- **Deferred / next up:** see `docs/ROADMAP-v2.md` (Talk mode, series management, translation-comparison
  notes, BSB, cross-versification mapping) and the remaining polish in `docs/V2-UX-BACKLOG.md` §4.
- **How the app works:** `docs/SPEC.md` (behaviour intent + a v1-phase→v2-lens map at the top),
  `docs/ROADMAP-v2.md` (the v2 model + build order), `docs/V2-UX-BACKLOG.md` §7 (current flow).
- **Reference crib (archived):** `docs/archive/PROGRESS-v1.md` (the full v1 Stages-0–10 build log),
  `docs/archive/PLAN.md` (the v1 locked tech plan), `docs/archive/DEV-SESSION-PROMPT.md`.
