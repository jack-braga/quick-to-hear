# Handoff — continue the v2 "flow redesign" (Deepen · Weigh · Authoring · Build)

> ## ✅ STATUS: COMPLETE — shipped 2026-08-13. Do not use this as a "to build" list.
> The whole flow redesign this handoff designed is **built, gated, browser-verified, and pushed to
> `main`.** The six open questions were resolved (owner, 2026-08-12): authoring-phase → **Write**,
> Map-phase → **Survey**, `note`→**comment**, personal-commentary→**study note**, Theme/Aim supersede
> presentation confirmed, **return-question dropped** (bake it into the question). All slices shipped —
> incl. the reference-picker unification (`c8c231f`) that closed the last deferred item.
> **Live record: `docs/V2-UX-BACKLOG.md` §7 (authoritative flow) + §7.8 (shipped slices), and
> `docs/ROADMAP-v2.md` §5 (dated log).** Everything below is kept only as **design provenance** — the
> reasoning behind the decisions, not open work.

> Paste this whole file into a fresh Claude Code CLI session to continue. This was a **design
> conversation** (mockup-led, not yet coding). Everything below lives in committed HTML mockups + this
> file — **nothing is built in code yet.** Your first job is to make it durable in the docs, resolve a
> few open naming questions with the owner (in chat prose), then build in slices.

You are continuing the **v2 "Layout B" overhaul** of *Quick to Hear* (repo:
`/Users/jack-braga/Documents/Projects/repos/quick-to-hear`, branch `main`). Increment #4 shipped. This
thread designed a **flow redesign** that adds two lenses and reworks how group-facing output is authored.

## Read first (in order)
1. This handoff (the compressed state).
2. The committed mockups — open in a browser (serve: `cd docs/mockups && python3 -m http.server 8899`;
   `file://` is blocked, use `http://localhost:8899/…`):
   - `v2-deepen-weigh-unified.html` (`1f57cd8`) — Deepen round 1 / Weigh round 2, unified revisions, supersede.
   - `v2-build-export-preview.html` (`7bd343c`) — Build = export preview + per-card controls.
   - `v2-deepen-commentary-split.html` (`0577843`) — earlier Option-B split (where the steps sit).
3. `docs/V2-UX-BACKLOG.md` (authoritative feedback log), `docs/HANDOFF-v2-increment4.md` (prior handoff),
   `docs/SPEC.md` **Phase 7** (the export model — two documents), `CLAUDE.md` (inviolable rules + commit policy).
4. Auto-memories: `v2-ui-overhaul`, `prefer-chat-questions-over-tool`, `pause-for-confirmation-between-steps`,
   `no-claude-coauthor-in-commits`, `attribution-only-coma-verbatim`.

## The flow (owner is happy to increase the lens count)
`Set up · Read · Map* · COMA · Deepen · Theme & aim · Weigh · Authoring* · Build · Check`  (*Map + Authoring names TBD)
- **Deepen** (after COMA) = "round 1": your own work, **no commentaries**; appends revisions to Map/COMA cards.
- **Weigh** (after Theme & aim) = "round 2": the **same** append activity + commentaries (books) unlocked + Theme/Aim join.

## Decided (do not re-litigate unless the owner reopens)
- **Card model:** everything is a card; `card.origin` = its creating step (drives filter chips). Deepen/Weigh
  **don't create cards** — they append **revisions** to existing cards, and **each revision carries its own
  origin = `deepen`|`weigh`** (a two-level origin model). This drives the label, whether a 📖 book source is
  expected (weigh only), and export integrity (own-work vs book).
- **Unified revisions list** per card — Deepen own-work + Weigh commentary in ONE list; source = a small 📖 tag;
  NOT separate colour-blocks.
- **Theme & Aim are special — the weighed revision SUPERSEDES:** it becomes the primary/final version; the
  original is preserved but demoted to a muted `was · kept` line. Multi-round = a preserved **stack shown
  compactly** (default: primary + one "was" line; a `▾ N earlier versions` disclosure only when >1). *(presentation to confirm)*
- The old loop-back **"apply to step X" button is GONE** → replaced by a muted orientation label
  `↳ this card lives in COMA · step 04`.
- **CLEAN SPLIT:** Map/COMA/Deepen/Theme/Weigh build **your understanding** (prep). The **Authoring phase is the
  only place group-facing output is created.** Build just sequences it.
- **Two output documents** (SPEC Phase 7): participant handout (clean, answer-free) + leader's notes (everything).
- **NO automaticness** — nothing auto-derives into the export. **Only three things reach the export:**
  **questions**, **study notes** (personal commentary), and **included references** (support passages).
- **"Background box" is DEAD.** The printed explanatory box is a **study note**, printed under that name.
- **include-for-group == make-it-a-support-passage:** ONE action; toggling a reference on prints that passage
  below/around its host card. Only references **inside question or study-note cards** are includable.
- **return-question** = an optional add-on field on an **included** reference (steers the group back to the main
  passage). *(owner wants more context before final confirm)*
- **One-click "→ make a question / → make a study note"** from a prior card (user-initiated; copies the card's
  text in as a seed) — **CONFIRMED, owner likes it.** This is the recycle-forward mechanism — user-triggered,
  never automatic.
- **BUILD step:** the passage leaves the centre; the centre becomes a **live export preview** with a
  **Participant / Leader / Parallel** toggle. The right panel shows only the output cards (questions + study
  notes) + assembly controls, **controls living ON each card:**
  - **Question card controls** (streamlined from a SPEC + `content/method` audit): **Type**
    (context/observation/meaning/application) · **Minutes** (explicit estimate, NOT light/med/heavy) ·
    **Essential** (toggle; renamed from "load-bearing") · **Aim know/feel/do** (select, shown **only on
    application** questions). Read-only above: text, anchor, ✓ expected-answer. Per-card action: `✂ cut → reserve`.
    **DROPPED:** gospel-plain toggle, wrong-turns, pastoral flag/note.
  - **Study-note card control:** `☐ hide from group` (leader-only vs printed).
  - Panel footer: total minutes vs session length.

## Naming (owner's latest leaning — confirm before building)
- Rename existing **"note"** annotations (Map/COMA) → **"comment"** (frees the word "note").
- Personal-commentary card = **"study note"**, printed under that name (distinct from Weigh's *published*
  "commentary"). *(owner proposed; cost = a ripple rename of existing notes)*
- **Authoring** phase (currently "Questions") — RENAME; owner wants options + context.
- **Map** phase — RENAME too; owner wants options + context.

## Still-open questions for the owner — ASK IN CHAT PROSE (owner dislikes the AskUserQuestion pop-up)
1. Confirm naming: note→comment; personal-commentary→**study note** (printed as such).
2. **Authoring-phase name** — present 3–4 options + rationale.
3. **Map-phase name** — present 3–4 options + rationale.
4. **Return-question** — give a concrete worked example, then confirm it's an optional field on an included reference.
5. **Theme/Aim supersede** — confirm the compact-history presentation.
6. **Delete `docs/mockups/v2-recycle-forward.html`?** It demos the *rejected* auto-derivation model — recommend deleting.

## Do next (in order)
1. **DURABILITY FIRST:** write all the *Decided* items into a new section of `docs/V2-UX-BACKLOG.md`, and
   **reconcile the lens count** (was 8, now 10+) across `V2-UX-BACKLOG.md` and `HANDOFF-v2-increment4.md` so a
   future session builds the right flow. *(This handoff exists because earlier sessions lost design work by
   leaving it only in chat — close that gap first.)*
2. Resolve the open naming/context questions with the owner.
3. **Build in slices.** Likely model work: `revision.origin` (`deepen`|`weigh`); a **study-note** card kind +
   `hideFromGroup`; **expose question minutes in Build** (`Annotation.weight` is dormant — `export.ts` defaults
   `medium`, so the timing total is meaningless today); rename `note`→`comment`; the two new **Deepen/Weigh**
   lenses; the **Authoring** phase (questions + study-note authoring, include-for-group = support-passage,
   one-click convert); the **Build** redesign (export preview + per-card controls).

## House rules
- Pure lib + unit tests; thin components. **Verify in a real browser (Playwright MCP)**, not just tests.
- Gate before every commit: `npm run typecheck && npm run lint && npm test && npm run build` + `npm run test:e2e`.
- Work straight to `main`; drive your own commits. **NEVER add Claude/Anthropic co-authorship** (a
  `Claude-Session:` trailer is fine). Keep commits scoped.
- **Prototype-led:** the owner reacts to mockups in `docs/mockups/*.html`. Present a plan and **pause for a go**
  on big/ambiguous steps. **Ask questions in chat prose.** Keep the passage the visual subject. **Never generate
  the owner's content** (prompts/formulas/tests only).

## Provenance
Design done in the session lineage titled *"Continue v2-con session from context limit"* (immediate predecessor
`314210d2`, which hit its context limit mid-verification). Mockups committed at `0577843`, `1f57cd8`, `7bd343c`.
