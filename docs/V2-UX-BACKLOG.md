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
| **4** | **The single filtered card panel** — step-filter chips + "reveal only on hover" + "hide vs dim" filtered-out cards; every note/question/COMA-answer is a card with an anchor + tag + source-step line; **diagonal multi-colour highlight** for a verse shared by several tones (`.v.multi`) | ❌ **not built — "the big one"** |

**Per-lens scope decided (owner, 2026-08-11), after the `v2-panel-scope-options.html` mockup:**
- **Read** = **pure reading**. Hide *everything* overlaid — verse tones/highlights **and** cards.
  Just the clean passage + the pray-and-read counter panel. (Currently Read still paints annotation
  tones on the verses; those must be suppressed in the Read lens.)
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

**COMA answer-cards model decided (owner, 2026-08-11): "answer-on-demand."** In the COMA lens the
genre's Helm prompts sit as quiet rows grouped by heading (Context/Observation/Meaning/Application);
each has a **✎ Answer** affordance. Clicking it spawns an **answer-card** (answer field + an editable
anchor via the click-chip gesture above) for that prompt; unanswered prompts stay as quiet one-liners.
The Helm attribution renders at the foot (inviolable rule 8). Chosen over "every prompt a card" (too
many empty boxes) and "prompts up top / free answers." *(See open questions below — still to confirm.)*

**Increment #4 is the point of Layout B**; 1–3 were the groundwork (reclaim width, unify menus). The
`v2-panel-filters.html` mockup specifies it exactly: a 380px right panel, chips `All · Map · COMA ·
Theme · Build`, two toggle switches, tone-accented cards (lapis/amber/rubric), a `▸ step NN · Name`
source line, two-way verse↔card hover, and the diagonal gradient for shared verses.

---

## 2. Confirmed design decisions — not yet built

- **Cross-reference collapse (confirmed — msg#2128, #2415).** Kill standalone cross-ref / support
  passages as first-class objects. A reference to another passage is **only** an `@`-mention inside a
  note. Two toggles on a mention:
  - **"Include for the group"** — normally an `@`-mention is prep-only (you peek; the group never
    sees it). This toggle prints the referenced passage in the participant handout (a box with its
    text) and in the leader's notes. Prep-only ↔ printed-for-everyone.
  - **"Return question"** — the follow-up that steers the group *back* to the main passage after you
    send them to another one (the v1 "step everyone forgets"). e.g. studying Luke 1, you send them to
    Malachi 4 for the Elijah promise; the return-question brings them home.
- **COMA answer-cards (owner idea — msg#1999, #2091; active design 2026-08-11).** In the COMA lens the
  genre's Helm prompts (still shown, per genre) are **answerable as cards** in the right panel: each
  card = a prompt + an answer field you fill + an editable **anchor** (one or more verses). Treated
  like a note (feeds recycle-forward → Build candidate questions). **Open design questions to resolve
  in the mockup:** (a) how a prompt *becomes* an answer-card — every prompt pre-rendered as an empty
  card, vs. a compact prompt list you "Answer" on demand, vs. a prompts strip with answers accumulating
  below; (b) **one answer per prompt** (one-to-one) vs. **multiple** answer-cards per prompt vs. also
  free answer-cards not tied to any prompt; (c) the anchor gesture (see the inline-anchor decision in
  §1). The COMA attribution (Helm) must still render wherever the prompts appear (inviolable rule 8).
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

---

## 4. Bug / polish backlog

Ordered roughly by how concrete + how recently raised. Source msg in brackets.

- **`@`-mention over-eager parse (raised twice — msg#1999, #2749).** Typing `@Matthew 1:5` cuts off at
  `@Matthew 1` and references the whole chapter. Also wants a **search dropdown** while typing a
  mention. Fix `longestReference` in `src/v2/reader/mentions.ts` so it extends to the `:verse` (and
  ranges) before falling back to the chapter. **[open]**
- **Sectioning disabled in parallel (msg#2304, #2749).** `ParallelCanvas` has no divide/merge
  affordance; you can only section in single-column. Enable any-verse sectioning on the primary column
  while parallel. **[open]**
- **Manuscript looks identical to formatted in parallel (msg#2749).** The manuscript/flatten transform
  isn't applied in the parallel path. **[open]**
- **Diagonal shared-verse highlight not in the app (msg#2091 liked, msg#2749 "not in yet").** A verse
  carrying 2+ annotation tones should render an alternating diagonal pattern (`.v.multi` in the
  mockup). Must accommodate **as many colours as are present**, not just two. Ships naturally with
  increment #4. **[open]**
- **Note-anchor jump animation should match the note's tone (msg#1999).** Clicking a note's anchor
  snaps to the verse correctly, but the flash should be the colour/style of *that note's kind*, not a
  generic lapis. **[open]**
- **`/` command palette rework (msg#2128).** Owner "not 100% on it" — revisit its scope + UX. **[open]**
- **Set-Up UX once-over (msg#1999, #2128).** Make the study Set-Up page sleek and tidy; consider doing
  step 1 in the right panel (except the initial translation load). **[open]**
- **Questions appearing in the Map phase? (msg#2749).** Owner asks to confirm questions don't belong in
  the Map (phase 3) surface — verify against the documented flow. **[verify]**

**Fixed already** (from the same feedback, for the record): clickable parallel columns + action bar
over the clicked column (`c2e229a`/`2b5a1ad`), tooltips clamp on-screen + no inherited mono/uppercase
(`1764414`), sections kept in manuscript mode (`736f2be`), header lens icons + rail removed
(`c2fa135`), muted dark (`9b7969e`).

---

## 5. The documented flow (owner asked to re-confirm — msg#2304, #2408; checked vs `SPEC.md`)

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
