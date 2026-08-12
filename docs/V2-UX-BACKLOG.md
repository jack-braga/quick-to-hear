# Quick to Hear — v2 UX backlog (owner feedback, captured)

> **Why this file exists.** Between 2026-08-10 and 2026-08-11 the owner poured a large amount of
> UI/UX feedback into a single Claude Code session while designing a shell overhaul ("Layout B").
> That session hit its context limit before it could hand off, and the feedback nearly evaporated.
> This file is the durable capture. It is the companion to `docs/ROADMAP-v2.md` §4/§5 (the build
> order + progress log) — the roadmap says *what shipped*; this file says *what the owner asked for
> and what is still open*. Keep it current; tick items as they land and cross-reference the commit.
>
> Message numbers (`msg#NNNN`) refer to turns in the source session transcript
> (`~/.claude/projects/…/8035189a-…jsonl`) for provenance. Three owner screenshots from that session
> live in `~/.claude/image-cache/8035189a-…/` (1 = inline-mention pref, 2 = tooltip clipping, 3 =
> parallel action-bar on the wrong column).
>
> **⚠ CURRENT FLOW = 10 lenses — see §7 (flow redesign, 2026-08-12).** The "eight lenses" decision in
> §1 and the seven-step flow in §5 are **superseded**: two lenses were added (**Deepen** after COMA,
> **Weigh** after Theme & aim), **Map** is renamed **Survey**, and the shipped "Questions" lens is
> renamed **Write**. §7 is the authoritative flow; the earlier sections are kept for provenance.
> Compressed handoff: `docs/HANDOFF-v2-authoring-build.md`.

---

## 1. The overhaul: "Layout B" (owner chose it — msg#2180)

A shell rebuild around one idea: **the passage is always centered; there is no left panel; a single
right-hand panel holds every card, filtered by step.** Design record:
`docs/mockups/v2-shell-redesign-2.html` (the chosen "B") + `docs/mockups/v2-panel-filters.html` (the
filtered-panel detail — this *is* the increment-#4 spec).

Built as safe increments (msg#2232). **Approach (i) chosen** (msg#2234): apply the card panel to the
annotation steps (Map / Read / COMA) first; keep **Theme / Build / Check** as full-canvas editors for
now and card-ify them later.

| # | Increment | Status |
|---|---|---|
| 1 | Muted / warmer night palette | ✅ shipped `9b7969e` |
| 2 | Lens tracker → header (icons + hover labels); remove the left rail | ✅ shipped `c2fa135` |
| 3 | Unified "Aa Text" menu (✓ view · ★ main) + N-column parallel | ✅ shipped `c2e229a` |
| **4** | **The single filtered card panel** — step-filter chips + "reveal only on hover" + "hide vs dim" filtered-out cards; every note/question/COMA-answer is a card with an anchor + tag + source-step line; **diagonal multi-colour highlight** for a verse shared by several tones (`.v.multi`) | ✅ **built** — chip panel `93f956b` + both switches `69d39a8`; anchor-capture `f5719b7`; diagonal single `eb57bae` / parallel `bd0ae7a`. Plus the flow-split (#4c Questions, #4b COMA answer-cards + multi-genre, #4d Build assembly, #4e pure Read). **Panel later simplified to "just the chips" (#7, 2026-08-11): both switches removed — origin chips are the only filter, filtered-out cards don't render, two-way hover stays.** |

**Per-lens scope decided (owner, 2026-08-11), after the `v2-panel-scope-options.html` mockup:**
- ~~**Read** = **pure reading**.~~ **[shipped #4e `442ae48`]** — Read paints no verse tones (cards were
  already absent — its margin is the ReadPanel). Just the clean passage + the pray-and-read counter.
- **Map** = the filtered card panel as mocked (`v2-panel-filters.html`). Confirmed.
- **COMA** = the genre's Helm prompts become **answer-cards** in the right panel (see §2 — this is the
  COMA-answer-cards feature, now in active design). Not merely a prompts-strip.
- Net: this is **Option C** (Map + COMA get the right panel; Read stays bespoke + clean), with COMA's
  panel being *answer-cards* rather than a static prompts list.

**General capability decided (owner, 2026-08-11): inline anchor editing on ANY card, via click-chip
capture.** You can change a card's anchor verse(s) after creation, done **inline** (owner prefers this
over a separate "edit-anchor mode"). **Gesture chosen (owner, after `v2-coma-answer-cards.html`):
click the card's anchor chip** (or the faint `⌖ anchor` when empty) → the card enters "capture" state
(rings; a hint shows over the passage) → your next passage selection sets the anchor → Esc/Done/click-
chip-again confirms. **This exact capability applies to every card kind — note, question, and COMA
answer alike** (owner-confirmed 2026-08-11). Capture should reuse the existing drag-range / ⌘-disjoint
selection primitive (not just single-click). *(The §6 "edit anchor verses" item is promoted to active.)*

**COMA answer-cards model decided (owner, 2026-08-11): "answer-on-demand," multiple allowed.** In the
COMA lens the genre's Helm prompts sit as quiet rows grouped by heading (Context/Observation/Meaning/
Application); each has a **✎ Answer** affordance. Clicking it spawns an **answer-card** (answer field +
an editable anchor via the click-chip gesture above), focusing the answer field first (**write-first**,
owner-confirmed); an answered prompt keeps a quiet **✎ answer again** so **one prompt can hold several
answer-cards** (owner-confirmed — each observation gets its own anchor + downstream seed). Unanswered
prompts stay as quiet one-liners. Helm attribution renders at the foot (inviolable rule 8). Chosen over
"every prompt a card" and "prompts up top / free answers."

**Batch-2 owner input (2026-08-11) — still to resolve (clarifications in flight):**
- **Anchor is optional + editable on EVERY card (generalise).** Any card — COMA answer, note, question —
  may sit with **0, 1, or many** anchor verses, and you can **add / remove / change** them after the
  fact via the click-chip capture. **Resolved below: there is no Study-notes category — a card's home is
  its *origin* (step), and the anchor is independent optional metadata.**
- **Multiple text-types (genres) in Set-up → multi-set COMA (promote from §7 deferred).** Set-up should
  let you pick **more than one** genre (e.g. Gospel narrative **+** Hebrew poetry for the Magnificat).
  Then COMA shows **each selected genre's** prompt set, and **every prompt is labelled with the
  text-type it comes from**. Model change: `setup.genre` → `setup.genres` (additive; clean break, no
  migration). Affects: `comaSetForGenre` → iterate genres; the Read-lens reading tip (which genre's?);
  whether one genre is "primary." *Owner to confirm the COMA layout (group by genre vs by heading) + is
  there a primary genre.*
- **Selection mechanics — reaffirmed + section-range question.** Locked (ROADMAP §2, built in
  `selection.ts`): **drag = range**, **⇧ = extend from last anchor**, **⌘/Ctrl = add a disjoint range /
  toggle a single verse**, plain click on the sole selected verse **deselects**. The **anchor-capture**
  gesture reuses exactly these. Open: selecting a **verse range for a section** — today sections are
  made by a hover "＋ divide here" + merge; clicking a section band selects its range (locked shorthand).
  *Owner to confirm whether to also add a "select a range → make it a section" action, or keep
  divide/merge only.*

**Proposed flow restructure (owner, 2026-08-11) — split authoring from assembly.** The owner spotted
that *writing* questions and *assembling* the study are two jobs v1 mashed into one long "Build." New
proposed shape (seven lenses → **eight**):

> **⚠ SUPERSEDED 2026-08-12 — see §7.** The split shipped as eight lenses, then a further flow redesign
> added **Deepen** (after COMA) and **Weigh** (after Theme & aim) → **10 lenses**; **Map** → **Survey**
> and the "Questions" lens → **Write**. The eight-lens shape below is kept for provenance.

> Set up · Read · Map · COMA · Theme & aim · **Questions (new)** · Build · Check

- **Questions lens (new, after Theme & aim)** — text-central, *show everything* like Map/COMA (the
  filtered card panel). This is where **recycle-forward happens**: prior COMA answers / notes carry a
  **→ Make a question** (seed a question at the same anchor), or you write fresh. Each question keeps
  its anchor + the **expected-answer hard block** (SPEC 6e). *(This resolves the recycle-forward
  question — it's the "panel + convert" model, living here rather than in Build.)*
- **Build lens (now pure assembly)** — **[core shipped #4d `77c0103`]**: questions are **read-only**
  (author in Questions; jump to refine), you **sequence** them (drag / ↑↓), keep the type-filter + the
  assembly metadata (type/load-bearing/aim/gospel-plain) + drop. **Still deferred (owner: core scope):**
  set timing, cut / reserve, and **optional filler** (a leader note / background box — needs
  export-model work; images deferred per §6).
- Consistency win: Map · COMA · Theme · Questions are all "work against the text, show everything"
  lenses; **Build is the single assembly step**. **CONFIRMED (owner, 2026-08-11): do the split — eight
  lenses.**
- **Unanchored-card rule DECIDED (owner, 2026-08-11): there is no "Study notes" category — everything
  is a card.** Every annotation is just a card with (1) an **origin** = the step it came from (Map /
  COMA / Theme / Questions…), which drives the filter chips + the source line, and (2) **optional
  anchor verse(s)** — 0, 1, or many, all fine. Anchored vs unanchored is a *property*, not a category;
  the old floating/Study-notes area is **removed** (theme/aim/prayer are just cards with a Theme origin;
  a floating thought is an unanchored card). Supersedes the earlier "0 anchors = study-level" note above.
- **Two panel questions still open (owner, 2026-08-11) — to mock:**
  - **Show + ADD prior types in every text-central lens?** In Map / COMA / Questions the filtered panel
    shows all prior cards (filter by origin). Open: can you also *add* a previous step's card-type from a
    later lens (e.g. jot a new COMA answer while in Questions), or does each lens only add *its own* type
    (with prior types view-only)? Leaning: panel shows all; each lens's primary add = its own type; a
    secondary affordance lets you add a prior type when you need to.
  - **Panel density = chip filter, NOT collapsible origin-groups (owner, 2026-08-11).** The
    `v2-questions-lens.html` collapsible-groups panel read as "too much going on." Owner prefers the
    **chip-filter** approach from `v2-panel-scope-options.html` / `v2-panel-filters.html`: a chip row
    (All · by origin / by genre) picks which cards show; flat list, no accordion nesting; fewer cards on
    screen at once. Convert (**→ make a question**) still lives on each prior card. *(The collapsible-
    groups idea is dropped in favour of chips.)*

**Increment #4 is the point of Layout B**; 1–3 were the groundwork (reclaim width, unify menus). The
`v2-panel-filters.html` mockup specifies it exactly: a 380px right panel, chips `All · Map · COMA ·
Theme · Build`, two toggle switches, tone-accented cards (lapis/amber/rubric), a `▸ step NN · Name`
source line, two-way verse↔card hover, and the diagonal gradient for shared verses.

---

## 2. Confirmed design decisions — not yet built

- ~~**Cross-reference collapse (confirmed — msg#2128, #2415).**~~ **[built 2026-08-11 — mockup
  `docs/mockups/v2-xref-collapse.html`]** Killed the standalone cross-ref / support-passage card:
  a reference is **only** an `@`-mention inside a note, carrying the two toggles below in its peek.
  Model: `note.mentions: Record<osis, {includeForGroup, returnQuestion}>` (additive); the old
  `cross-ref` kind + `⤴ Promote` flow are gone; `projectForExport` reads notes' included mentions →
  `build.supportPassages` (attached to a question sharing the note's verses, else a background box).
  The two toggles:
  - **"Include for the group"** — normally an `@`-mention is prep-only (you peek; the group never
    sees it). This toggle prints the referenced passage in the participant handout (a box with its
    text) and in the leader's notes. Prep-only ↔ printed-for-everyone.
  - **"Return question"** — the follow-up that steers the group *back* to the main passage after you
    send them to another one (the v1 "step everyone forgets"). e.g. studying Luke 1, you send them to
    Malachi 4 for the Elijah promise; the return-question brings them home.
- ~~**COMA answer-cards (owner idea — msg#1999, #2091).**~~ **[shipped #4b-2 `14ea0ca`]** — resolved as
  **answer-on-demand** (prompts as quiet rows → **✎ Answer** spawns an answer-card, write-first),
  **multiple per prompt** (✎ answer again), **click-chip anchor**. Answer-cards are `origin:'coma'`
  notes → recycle-forward into questions; Helm attribution renders (rule 8). Multi-genre shipped in
  #4b-1 (`05b8365`): `setup.genre` → `setup.genres[]`, prompts grouped by heading + tagged by text-type
  + a chip-filter, `genres[0]` = primary.
- **Card naming convention (msg#2091, #2304).** Card names must be clear and rooted in the documented
  flow. `MARK · CONFUSING` was called out as a weird name. Owner liked the clearer labels in the
  mockups — port that convention into the app. *Owner may have more input here.*
- **Study-level annotation on phase 1 (msg#2304).** On the first phase you should be able to add a
  question or note to the *whole study* (floating / unanchored — the model already supports
  `verseIds:[]`).

---

## 3. Missing v1 value (surfacing gap — msg#1999, answered msg#2041; re-confirmed in code)

The owner asked: *"did all the teaching content and litmus tests and examples and questions make it
into v2?"* Answer: **no.** `grep` over `src/v2/` finds **zero** references to any of these — they exist
only as authored data in `content/method/*.yaml`, unused by v2:

- **Question formulas** — the ~20 scaffolded question stems (`formulas.yaml`) that seed Build.
- **Litmus tests** — 5 theme tests + 4 per-question-type tests (`litmus.yaml`).
- **Traps** — moralism / allegory / christless-history / flattening (`traps.yaml`, Goldsworthy-cited).
- **Soft warnings** — yes-no / leading / double-barrelled question detectors (`warnings.yaml`).
- **Stuck helpers** — the five "feeling stuck?" theme prompts.

v2's Build + Theme lenses are genuinely thinner than v1's Phase 5/6. This is core tool value (the
prompts/tests that *are* the discipline), not polish. Re-surface it into the v2 lenses (the pure
loaders already exist in `src/lib/content/method.ts`).

**[done 2026-08-12] — the authored method content is now surfaced across the v2 lenses:**
- ✅ **Soft warnings** (Questions lens) — a question card shows the yes-no / leading / double-barrelled
  advisories live as you type (`detectWarnings` + `warnings.yaml`/`warningById`). Advisory, never a
  block (rule 3).
- ✅ **Question formulas** (Questions lens) — a "from a formula" picker seeds a question from the ~20
  scaffolded stems (`formulaGroups`).
- ✅ **Theme litmus + traps + stuck** (Theme & aim lens, a collapsible "Sharpen it" block) — the 5
  theme litmus tests + the 4 Goldsworthy traps as acknowledgeable checks (persisted via the existing
  `litmusAcks`/`trapAcks`), the 5 "feeling stuck?" helpers on demand. Goldsworthy attribution renders
  (rule 8). Loaders: `litmusThemeTests`, `trapsContent`, `stuckHelpers`.
- ✅ **Per-question litmus** (Build lens) — once a question's type is set, its authored test shows
  (`litmusForQuestionType`).
- All e2e-locked. This closes the §3 "missing v1 value" gap.

---

## 4. Bug / polish backlog

Ordered roughly by how concrete + how recently raised. Source msg in brackets.

- **`@`-mention over-eager parse (raised twice — msg#1999, #2749).** ~~Typing `@Matthew 1:5` cuts off
  at `@Matthew 1`.~~ **[parse fixed + regression-locked 2026-08-11]** — verified live (char-by-char
  typing of `@Matthew 1:5` chips the whole verse, not the chapter): `longestReference` already tries
  the longest valid form first and the `MentionEditor` re-chips on each signature change, so the
  `:verse` (and ranges) are kept. Locked by two cases in `mentions.test.ts`. **Search dropdown
  [done 2026-08-11]:** typing `@<letters>` at a word boundary opens a keyboard-navigable autocomplete
  (↑/↓ · Enter/Tab · Esc) that walks **book → chapter → verse**: pick a book → a
  **versification-aware chapter grid** (KJV counts, e.g. Malachi 1–4) → pick a chapter → a
  **verse grid** (e.g. Malachi 4:1–6) → pick a verse and the chip forms. Counts come from
  `chapterCount`/`verseCount` in `@/lib/verse` (KJV via `parseReference`, so they match what chips —
  3 John ends at 14, not 15). The boundary check skips emails; logic in `computeMentionSuggest`
  (`MentionEditor.tsx`), unit- + e2e-locked.
- ~~**Sectioning disabled in parallel (msg#2304, #2749).**~~ **[fixed `148caa7`]** — `ParallelCanvas`
  renders full-width section band headers (name/range/merge) + a "＋ divide here" pill on the primary
  column (reuses ReaderShell's section handlers; takes the primary reader `model`).
- ~~**Manuscript looks identical to formatted in parallel (msg#2749).**~~ **[fixed `9fce981`]** —
  parallel cells now render via `verseToLines(span)`: formatted keeps the poetry lines/indents,
  manuscript flattens each verse to prose, so the two modes visibly differ (prose is unchanged).
- ~~**Diagonal shared-verse highlight not in the app (msg#2091 liked, msg#2749 "not in yet").**~~
  **[fixed]** — a verse carrying 2+ tones renders the 45° multi-tone stripe (as many colours as
  present) via the shared pure `multiToneGradient` in `tones.ts`: single-column `eb57bae`, parallel
  `bd0ae7a`. NB the owner saw it "missing" on live prod = a **deploy lag** (redeploy to ship it).
- ~~**Note-anchor jump animation should match the note's tone (msg#1999).**~~ **[done 2026-08-11]**
  The verse jump-flash now reads in the *jumped annotation's* tone (rubric/amber/lapis) instead of a
  generic ring: the `verse-flash` keyframe uses an overridable `--flash-color`, `onJump(verseId, tone)`
  threads the tone, the Build lens passes `toneFor(question)` (→ amber), and both canvases set the var
  inline on the flash target. A plain navigation jump (the `/` palette) defaults to lapis. New
  `TONE_EDGE` map. Verified live (Build-lens jump flashes amber).
- ~~**`/` command palette rework (msg#2128).**~~ **[done 2026-08-11 — #7]** Slimmed to **quick-jump
  only**: type a verse number (`:20`) or a reference in the passage to scroll there. The
  switch-translation / create-on-selection / go-to-lens / book-completion commands were retired (all
  covered by dedicated UI now — the Aa Text menu, verse action bar, header lens tracker). Pure
  `paletteItems.ts` + tests trimmed; e2e updated to the jump flow.
- **Set-Up UX once-over (msg#1999, #2128).** Make the study Set-Up page sleek and tidy; consider doing
  step 1 in the right panel (except the initial translation load). **[open]**
- ~~**Questions appearing in the Map phase? (msg#2749).**~~ **[resolved `bb34d46`]** — confirmed:
  questions don't belong in Map. With the Questions lens (#4c) as the authoring home, the **Map action
  bar is now mark/note only** (item 2 from the 2026-08-11 field feedback).
- **Live-version visual feedback (2026-08-11) — [fixed `b279456`]:** (a) light-mode tone washes too
  muted → bumped (`--lapis/rubric-wash` 0.1→0.17; amber now a `--amber-wash` var); (b) the verse
  action bar was unreadable in **dark** mode (`bg-ink` flips light) → constant dark surface; (c) verse
  hover/selection shared the note's `lapis-wash` → new neutral **`--sel-wash` (teal)**, distinct from
  every annotation tone. *(Owner also confirmed set-up-lands-on-Read + ＋mark in `f9c3c18`.)*

**Fixed already** (from the same feedback, for the record): clickable parallel columns + action bar
over the clicked column (`c2e229a`/`2b5a1ad`), tooltips clamp on-screen + no inherited mono/uppercase
(`1764414`), sections kept in manuscript mode (`736f2be`), header lens icons + rail removed
(`c2fa135`), muted dark (`9b7969e`).

---

## 5. The documented flow (owner asked to re-confirm — msg#2304, #2408; checked vs `SPEC.md`)

> **⚠ SUPERSEDED 2026-08-12 — see §7 for the current 10-lens flow.** Two prep lenses (**Deepen**,
> **Weigh**) were inserted, authoring was split into its own lens, and **"background boxes" are now
> DEAD** (a resolved confusion becomes a **study note**, not a box). The seven-step shape below is kept
> for provenance.

> Set up → Read → **Map** (divide into sections **+ mark what's confusing**) → **COMA** (notes per
> category) → **Theme & aim** → **Build** (questions **+ expected answers**) → Check.

Recycle-forward ties it together: **confusion-marks → "background boxes"** ("tell them, don't ask
them") and **COMA notes → candidate questions**. Any card-panel + naming work must respect this.

---

## 6. Deferred / far-future (owner-flagged, low priority)

- ~~Editing a note's **anchor verses** after creation (msg#1999).~~ **Promoted to active — see §1**
  (inline anchor editing on any card).
- **Word-level selection** (range of words) in manuscript mode — unclear how it works cross-translation
  (msg#1999).
- **Images** in a study, somehow (msg#2304 — "definitely defer").
- More **copy-paste passages** for references outside the main text (msg#2304).
- Deep **links to BibleGateway / YouVersion** for a reference after selecting it in Set-Up (msg#2304).
- BSB edition; Talk mode (pre-existing roadmap deferrals).

---

## 7. Flow redesign — Deepen · Weigh · Write · Build (decided 2026-08-12) — CURRENT AUTHORITATIVE FLOW

> **Naming + open questions RESOLVED (owner, 2026-08-12):** ① `note`→`comment`, personal-commentary→
> **study note** — confirmed. ② Authoring lens name = **Write**. ③ Map lens name = **Survey**.
> ④ **Return-question DROPPED** — bake the "return" into the original question's wording; don't build
> the field now (see 7.4). ⑤ Theme/Aim compact-history presentation — confirmed (7.2). ⑥ The rejected
> `v2-recycle-forward.html` mockup — deleted.

> **This section supersedes** the "eight lenses" decision in §1 (the restructure block) and the
> seven-step flow in §5. Design record — three committed mockups in `docs/mockups/`:
> - `v2-deepen-weigh-unified.html` (`1f57cd8`) — Deepen round 1 / Weigh round 2, one unified revisions
>   list per card, Theme/Aim supersede.
> - `v2-build-export-preview.html` (`7bd343c`) — Build = live export preview + per-card controls.
> - `v2-deepen-commentary-split.html` (`0577843`) — the earlier Option-B split (shows where the steps
>   sit; note it still shows the now-**dead** "background box").
>
> Compressed handoff: `docs/HANDOFF-v2-authoring-build.md`. **Do NOT re-litigate the *Decided* items
> below unless the owner reopens them.**

### 7.1 The flow — now 10 lenses

`Set up · Read · Survey · COMA · Deepen(new) · Theme & aim · Weigh(new) · Write(renamed) · Build · Check`
*(**Survey** = renamed Map; **Write** = renamed the shipped "Questions" lens — both decided 2026-08-12.)*

| # | Lens | Icon | Notes |
|---|------|------|-------|
| 01 | Set up | ⚙ | |
| 02 | Read | ◉ | pure reading (already shipped) |
| 03 | **Survey** *(was "Map")* | ▤ | divide into sections + mark what's confusing |
| 04 | COMA | ▦ | |
| 05 | **Deepen** *(new)* | ⊕ | round 1 — your own work, **no commentaries** |
| 06 | Theme & aim | ◎ | |
| 07 | **Weigh** *(new)* | ⚖ | round 2 — same append + **📖 commentaries unlocked** + Theme/Aim join |
| 08 | **Write** *(was "Questions")* | ✎ | **the only place group-facing output is created** |
| 09 | Build | ▥ | assemble = export preview + per-card controls (7.5) |
| 10 | Check | ✓ | |

Two lenses inserted vs the shipped 8-lens flow: **Deepen** (after COMA) and **Weigh** (after Theme &
aim). The shipped **"Questions"** lens is renamed **Write**; **Map** is renamed **Survey**.

### 7.2 Deepen (round 1) + Weigh (round 2) — the append-revision model *(Decided)*

- **Deepen** (after COMA) = **"round 1"**: revisit Map + COMA — answer what you marked confusing, add
  what you now see, **from the text, no commentaries**. Appends revisions to existing Map/COMA cards.
- **Weigh** (after Theme & aim) = **"round 2"**: the **same** append activity, but now **📖 commentaries
  (books) are unlocked** and **Theme & Aim join**. Reserve *substantive* commentary work for here; light
  lookups (names / places / dates) stay back in Context/Map.
- **Card model — everything is a card;** `card.origin` = its creating step (drives the filter chips).
  **Deepen/Weigh do NOT create cards** — they **append revisions** to existing cards, and **each
  revision carries its own `origin` = `deepen`|`weigh`** (a two-level origin model). The revision origin
  drives: the label, whether a **📖 book source is expected** (**weigh only**), and export integrity
  (own-work vs book).
- **Unified revisions list** per card — Deepen own-work + Weigh commentary in **ONE** list; source shown
  as a small 📖 tag — **NOT** separate colour-blocks.
- **Theme & Aim are special — the weighed revision SUPERSEDES:** it becomes the primary/final version;
  the original is preserved but demoted to a muted `was · kept` line. Multi-round = a preserved stack
  shown compactly (default: primary + one "was" line; a `▾ N earlier versions` disclosure only when >1).
  *(presentation to confirm — open Q5.)*
- The old loop-back **"apply to step X" button is GONE** → replaced by a muted orientation label, e.g.
  `↳ this card lives in COMA · step 04`.

### 7.3 Clean split — prep vs authoring vs assembly *(Decided)*

- **Map · COMA · Deepen · Theme & aim · Weigh build your UNDERSTANDING** (prep).
- **Authoring is the ONLY place group-facing output is created.**
- **Build just sequences** it.

### 7.4 What reaches the export *(Decided)*

- **Two output documents** (SPEC Phase 7): **participant handout** (clean, answer-free) + **leader's
  notes** (everything). *(SPEC §7 also lists a re-importable project file — that's the export/import
  channel, not a printed doc.)*
- **NO automaticness** — nothing auto-derives into the export. **Only three things reach the export:**
  **questions**, **study notes** (personal commentary), and **included references** (support passages).
- **"Background box" is DEAD.** The printed explanatory box is a **study note**, printed under that name.
- **include-for-group == make-it-a-support-passage:** ONE action; toggling a reference on prints that
  passage below/around its host card. Only references **inside question or study-note cards** are
  includable. *(This is the `note.mentions[osis].includeForGroup` model from §2 — carried forward.)*
- **return-question — DROPPED for now (owner, 2026-08-12).** Instead of a separate field on an included
  reference, the leader **bakes the "return" into the original question's own wording** — the question
  both sends the group to the other passage *and* brings them home. Worked example (kept for the record):
  studying Luke 1, Q2 sends the group to **Malachi 4:5–6** (the Elijah promise, printed as a support
  passage); rather than a separate return line, Q2 is phrased *"…what was promised about Elijah, and
  why does that matter for who John is?"* — the return is in the question. **Do NOT build return-question
  UI**; the export mockup's `↩ return` lines are dropped. Revisit a dedicated field only if it's needed.
- **One-click "→ make a question / → make a study note"** from a prior card (user-initiated; copies the
  card's text in as a seed) — **CONFIRMED.** This is the recycle-forward mechanism — user-triggered,
  **never automatic** (inviolable rule 1).

### 7.5 Build redesign — export preview + per-card controls *(Decided)*

- The passage **leaves the centre**; the centre becomes a **live export preview** with a **Participant /
  Leader / Parallel** toggle (the export "paper" is always light — it's a print preview).
- The right panel shows only the **output cards** (questions + study notes) + assembly controls, with
  **controls living ON each card**:
  - **Question card controls** (streamlined from a SPEC + `content/method` audit): **Type**
    (context / observation / meaning / application) · **Minutes** (an explicit estimate, **NOT**
    light/med/heavy) · **Essential** (toggle; renamed from "load-bearing") · **Aim know/feel/do**
    (select, shown **only on application** questions). Read-only above: text, anchor, ✓ expected-answer.
    Per-card action: `✂ cut → reserve`. **DROPPED:** gospel-plain toggle, wrong-turns, pastoral
    flag/note.
  - **Study-note card control:** `☐ hide from group` (leader-only vs printed).
  - Panel footer: **total minutes vs session length**.

### 7.6 Naming (DECIDED 2026-08-12)

- Rename Survey/COMA **"note"** annotations → **"comment"** (frees the word "note"). *(cost: a ripple
  rename of the existing `note` kind + data/UI/tests.)*
- Personal-commentary card = **"study note"**, printed under that name — **distinct from Weigh's
  *published* "commentary" (the 📖 books you consult).** ⚠ **The `v2-build-export-preview.html` mockup
  still labels this printed box "Commentary" — that label must become "Study note" when built** (so
  "commentary" is reserved for the published-book source in Weigh).
- **Write** = the authoring lens (was "Questions").
- **Survey** = the structure/marking lens (was "Map").

### 7.7 Resolved questions (owner, 2026-08-12)

1. ✅ Naming: `note`→`comment`; personal-commentary→**study note** (printed as such). **Confirmed.**
2. ✅ Authoring-phase name = **Write**.
3. ✅ Map-phase name = **Survey**.
4. ✅ **Return-question DROPPED** — bake the return into the original question; don't build the field (7.4).
5. ✅ Theme/Aim supersede — compact-history presentation **confirmed** (7.2).
6. ✅ `docs/mockups/v2-recycle-forward.html` **deleted** (demoed the rejected auto-derivation model).

### 7.8 Build slices (implementation order — not yet started)

Likely model + UI work, in slices (each testable + committable per the house rules):

1. `revision.origin` (`deepen`|`weigh`) on the annotation/revision model.
2. A **study-note** card kind + `hideFromGroup`.
3. **Expose question minutes in Build** — `Annotation.weight` is dormant (`export.ts` defaults to
   `medium`, so today's timing total is meaningless).
4. Rename `note` → `comment`.
5. The two new **Deepen** + **Weigh** lenses.
6. The **Authoring** phase (questions + study-note authoring; include-for-group = support-passage;
   one-click convert).
7. The **Build** redesign (export preview + per-card controls).
