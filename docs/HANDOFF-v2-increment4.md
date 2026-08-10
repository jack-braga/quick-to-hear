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
- **Field-feedback batch** `f9c3c18` — set-up now **lands on Read** (was skipping it; CTA "Read the
  passage →"); the panel gained **`＋ mark`** beside `＋ note` (unanchored confusion mark).
- **Slice 4** `f5719b7` — **inline anchor capture**. Click a card's anchor chip (or dashed `⌖ anchor`)
  → hint banner + crosshair + card ring; the next passage selection sets the card's verse(s), reusing
  the drag/⇧/⌘ primitive; Esc / Done / click-chip-again ends. `capturingId` in `ReaderShell`; canvases
  take `capturing`; `MarginAnnotations` gains `onStartCapture`/`onEndCapture`. **Gotcha (fixed):** the
  select→anchor commit runs in an *effect*, not the native pointer handler — a mid-gesture store write
  corrupted ⌘-disjoint. Live-verified (single / range / ⌘ / Esc / Done / reload-persist).
- **ParallelCanvas gaps** — `bd0ae7a` diagonal multi-tone stripe now in parallel (shared pure
  `multiToneGradient` in `tones.ts`; shell passes `verseTones`, retired `anchorTone`); `9fce981`
  manuscript mode now works in parallel (cells render via `verseToLines` — formatted keeps poetry
  lines, manuscript flattens; prose unchanged).
- **#4c the Questions lens** `bb34d46` — the 8th lens (`Set up · Read · Map · COMA · Theme & aim ·
  **Questions**(06,`?`) · Build(07) · Check(08)`). Text-central card-panel lens; author questions
  (bar leads with Question) or `＋ question`; **recycle-forward** `→ make a question` seeds an empty
  question at a prior card's anchor (verses only). **Item 2 done:** Map bar is now mark/note only (the
  `ActionBar` takes an ordered `kinds` prop). `MarginAnnotations` gained `lensOrigin` + `onMakeQuestion`.
- **Visual polish** `b279456` (live feedback) — stronger light-mode washes (`--lapis/rubric-wash`
  0.1→0.17; amber now a `--amber-wash` var); action bar fixed to a constant dark surface (`bg-ink`
  flipped light in dark → unreadable); verse hover/selection moved to a neutral **`--sel-wash` (teal)**,
  distinct from every annotation tone (was `lapis-wash` = the note tone).

## Do next — in slices, each testable + committable

- ~~**Slice 3 — chip-filtered card panel.**~~ ✅ shipped `93f956b` (see "Shipped so far").
- **Slice 3b — the two panel switches.** Add **"Reveal only on hover"** (cards hide until you hover
  their anchor verse — needs the `litVerseId`/hover wiring, already passed in) and **"Hide vs dim
  filtered-out"** (off = dim the filtered-out cards at ~0.32 opacity instead of removing them) to the
  `MarginAnnotations` filter header, per `v2-panel-filters.html`. Persist both toggles alongside the
  chip set.
- ~~**Slice 4 — click-chip anchor capture.**~~ ✅ shipped `f5719b7` (see "Shipped so far").
- ~~**#4c the new Questions lens** (unblocks item 2)~~ ✅ shipped `bb34d46` (see "Shipped so far").
- ~~**#4b COMA answer-cards + multi-genre**~~ ✅ shipped `05b8365` (#4b-1 model) + `14ea0ca` (#4b-2
  answer-cards). `setup.genres[]`, Set-up chip multi-select, ComaPanel answer-on-demand with
  ✎ Answer / answer again + click-chip anchor, prompts tagged by genre + chip-filter, `origin:'coma'`
  answer-cards that recycle-forward.
- ~~**#4e Read → strip tints/cards**~~ ✅ shipped `442ae48` — the Read lens paints no verse tones
  (ReaderShell passes `NO_TONES` to the canvas for `lens==='read'`); cards were already absent (Read's
  margin is the ReadPanel). Just the clean passage + the pray-and-read panel.
- ~~**#4d Build → pure assembly**~~ ✅ shipped `77c0103` — questions read-only (author in Questions),
  keep sequence + type-filter + assembly metadata (type/load-bearing/aim/gospel-plain) + jump + drop.
  **Deferred (owner: core scope):** filler (leader note/background box — needs export-model work),
  per-question timing, cut/reserve.
- ~~**Slice 3b — the two panel switches**~~ ✅ shipped `69d39a8` — Reveal-only-on-hover + Hide-vs-dim
  in `MarginAnnotations`, both persisted. **Increment #4 is now complete.**
- ~~**Sectioning in the parallel view** (V2-UX-BACKLOG §4)~~ ✅ shipped `148caa7` — full-width band
  headers + divide/merge/rename on the primary column (ParallelCanvas takes the primary `model`).
- **Deferred #4d extras** — filler / timing / cut-reserve, when the owner wants them.
- Still-open parallel item (V2-UX-BACKLOG §4): **sectioning is disabled in parallel** — enable
  any-verse divide/merge on the primary column while parallel.

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
