# Handoff — continue the v2 "Layout B" overhaul (increment #4)

> Paste this into a fresh Claude Code CLI session to keep going. It is the continuation prompt.
> (Written 2026-08-11 — the prior session ran out of context before it could hand off.)

You are continuing the **v2 UI/UX overhaul** of "Quick to Hear" (repo root:
`/Users/jack-braga/Documents/Projects/repos/quick-to-hear`, branch `main`). v2 is a **text-central
redesign — the passage is the canvas; everything else is a card anchored to verses.** The planned build
(Stages 0–10) is complete and **v2.1–v2.8 shipped**. The current mission is the **"Layout B" shell
rebuild, increment #4.**

## Read first (in order)

1. **`docs/V2-UX-BACKLOG.md`** — **authoritative.** ALL owner UX feedback + every locked decision.
2. **`docs/ROADMAP-v2.md`** §2 (locked decisions), §4 (build order), §5 (progress log).
3. **`CLAUDE.md`** — inviolable rules, stack, licensing, commit policy.
4. The **`v2-ui-overhaul`** auto-memory — the compressed state.
5. `git log --oneline -14`, then `npm ci && npm run typecheck && npm run lint && npm test && npm run build`.

## The mission: increment #4 (the point of Layout B)

One right-hand **chip-filtered card panel** across the text-central lenses; **everything is a card**
(origin + optional anchors, no "Study notes"); **click-chip inline anchoring**; **diagonal multi-tone
highlight**. Then flesh out the new **Questions** lens and refactor **Build → pure assembly**.

## Locked decisions — do NOT re-litigate (detail in V2-UX-BACKLOG)

- **8-lens flow:** `Set up · Read · Map · COMA · Theme & aim · `**`Questions (new)`**` · Build · Check`.
  Questions = author (convert prior cards → questions); Build = assemble (sequence + filler; images deferred).
- **Everything is a card:** `origin` (its step) + `verseIds` (0..N, optional). **No study-notes area.**
- **Panel = chip filter** by origin/genre — flat, **NOT** collapsible groups (owner found those busy).
- **Inline anchor** = **click the anchor chip → capture → select verses** (reuse drag/⇧/⌘). Every kind.
- **COMA** = answer-on-demand (prompts as quiet rows, ✎ Answer spawns a card), **multiple answers per
  prompt**, write-first; **multi-genre** (`setup.genre` → `setup.genres`; prompts labelled by text-type);
  Helm attribution renders wherever COMA appears (inviolable rule 8).
- **Read** = pure reading (suppress tints + cards). **Diagonal stripe** for a verse with 2+ tones.
  **Recycle-forward** = convert a prior card → question in the Questions lens (no separate candidate pool).
- Minor still-open: select-range → make section; cross-ref collapse (@mention + "include for group" +
  return-question; standalone cross-ref/support retired); multi-genre reading tip = the primary genre.

## Shipped so far (#4a)

- **Slice 1** `e7cd90b` — model `Annotation.origin` (`src/types/study.ts`) + pure
  `annotationOrigin` / `presentOrigins` / `filterByOrigins` / `verseTones` / `ORIGIN_LABEL`
  (`src/v2/annotations.ts`) + 5 tests (303 total).
- **Slice 2** `eb57bae` — the **diagonal multi-tone highlight** in `src/v2/reader/ReaderCanvas.tsx`
  (takes `verseTones`; `verseStyle` builds the gradient from `TONE_WASH` in `src/v2/tones.ts`;
  `ReaderShell` computes + passes it). Live-verified on Luke 1:8. **ParallelCanvas still single-tone —
  a follow-up.**
- **Slice 3** `93f956b` — the **chip-filtered card panel** in `src/v2/reader/MarginAnnotations.tsx`:
  origin chip row (`All` + `presentOrigins`), flat card list, `▸ step NN · Name` source line, **no
  Study-notes section** (unanchored card shows `—`), `＋ note` adds an unanchored `origin:'map'` card,
  hidden-chip set persisted in `localStorage` (`qth2/panel-hidden-origins`). New pure
  `rejectByOrigins` (blacklist companion to `filterByOrigins`; chip state = the *hidden* set).
  `ReaderShell.onAction`/`onAddFloating` now stamp `origin:'map'`. Live-verified (Map/COMA/Theme chips
  filter, survives reload). **Two panel switches (hover-reveal, hide-vs-dim) deferred to Slice 3b.**

## Do next — in slices, each testable + committable

- ~~**Slice 3 — chip-filtered card panel.**~~ ✅ shipped `93f956b` (see "Shipped so far").
- **Slice 3b — the two panel switches.** Add **"Reveal only on hover"** (cards hide until you hover
  their anchor verse — needs the `litVerseId`/hover wiring, already passed in) and **"Hide vs dim
  filtered-out"** (off = dim the filtered-out cards at ~0.32 opacity instead of removing them) to the
  `MarginAnnotations` filter header, per `v2-panel-filters.html`. Persist both toggles alongside the
  chip set.
- **Slice 4 — click-chip anchor capture.** A `capturingId` state in `ReaderShell`; while set, a passage
  selection sets that card's `verseIds` (instead of creating a new annotation), with a hint banner over
  the canvas + Esc/Done to finish; the card's anchor chip is the trigger. Reuse `useDragSelection`.
- Then **#4b COMA** (answer-on-demand cards + `setup.genres` multi-select in `SetupLens` + labelled
  prompts in `ComaPanel.tsx`), **#4c the new Questions lens** (add the 8th lens to `src/v2/lenses.ts`
  + branch it in `ReaderShell`; author + convert-from-prior-cards), **#4d Build → pure assembly**,
  **#4e Read → strip tints/cards** (pure reading).

## House rules

- **Pure lib + unit tests; thin components.** **Verify in a real browser** (Playwright MCP), not just tests.
- **Gate before every commit:** `npm run typecheck && npm run lint && npm test && npm run build` +
  `npm run test:e2e`; **0 console errors** bar the known React-Router future-flag warnings.
- **Work straight to `main` and push; drive your own commits.** **NEVER add Claude/Anthropic
  co-authorship** to commits (a `Claude-Session:` trailer is fine). Keep commits scoped.
- Owner style: **present a plan, pause for a go** on big/ambiguous steps; **prototype-led** — the owner
  reacts to mockups. Mockups live in `docs/mockups/*.html`; serve with `python3 -m http.server` in that
  dir (flag the full localhost URL in chat) — `file://` is blocked.
- Clean up screenshots (root `*.png` is gitignored).

## Mockups = the target UI (the design record)

`docs/mockups/`: `v2-panel-scope-options`, `v2-panel-filters`, `v2-coma-answer-cards`,
`v2-build-recycle`, `v2-questions-lens`, `v2-coma-multigenre`. These ARE the UI to build toward — open
them before building each lens.

**Stop and ask the owner only if a locked decision looks wrong, or a slice can't meet its goal.
Otherwise, build — one slice at a time, verify in the browser, commit, push.**
