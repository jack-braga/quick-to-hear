# Teaching-Text Inventory — Quick to Hear

> **You are writing this.** This document is the complete map of every place the
> tool needs teaching text, what I think each one should do, and roughly how much.
> Work through it at your own pace; the app is built so text can be dropped in (or
> changed) at any time without touching code.
>
> Nothing here is your *study* content — it is **method/teaching content** (how to
> prepare a study), drawn from the sources the spec names. It's licensed CC BY-SA
> and lives in editable Markdown/YAML under `content/`.

---

## 1. How teaching text is structured (three tiers + examples)

The spec (§5) defines three tiers plus worked examples. Every location below is
tagged with which tiers it needs:

- **[I] Inline** — one or two sentences, **always visible** beside the field. The
  minimum. Written tight. This is the tier that must exist everywhere.
- **[E] Expandable** — the fuller reasoning, behind a "tell me more". Only where the
  *why* is deep or people get stuck. Not every field needs one.
- **[X] Worked example** — the **same real passage** carried through this step, so
  the user sees what a good answer looks like. Available at every phase (see §6).

A **global guidance toggle** (default: full) collapses everything to **[I] only**
for experienced users. So: **write [I] as if it's the only thing shown**, and [E]/[X]
as enrichment.

### Two kinds of content — don't confuse them
- **Authored teaching prose (you write):** everything marked [I]/[E]/[X] below.
- **Verbatim-sourced content (quoted, not authored):** the **COMA question sets**
  are reproduced *verbatim* from Helm's *One-to-One Bible Reading* under permission,
  and must show **Matthias Media / Holy Trinity Church** attribution wherever they
  appear. You don't write these — you supply the exact permitted text once. Same for
  any block you choose to quote directly (e.g. Goldsworthy's trap definitions); if
  you'd rather paraphrase in your own words, that becomes authored prose instead.

### Format each piece will live in
- Prose ([I]/[E]/[X]) → Markdown files in `content/help/`, one file per location key,
  with frontmatter `{ key, tier, source? }`. Within the body, each tier is delimited by an
  HTML-comment marker: `<!-- inline -->` (the [I] line, always shown), `<!-- expandable -->`
  (the [E] "Tell me more" detail), and `<!-- example -->` (the **[X] worked example**). The
  markers may appear in any order; a tier is simply whatever prose sits under its marker.
  **The [X] tier is wired but empty** (Stage 10): drop a `<!-- example -->` block into any
  help file and it renders automatically as a "See a worked example" disclosure (full
  guidance mode) — no code change. Leave it out and nothing shows.
- Structured method text (formula stems, COMA sets, litmus tests, trap rows, genre
  one-liners) → YAML in `content/method/`, so the app can render them programmatically
  and keep the attribution attached.
- **Inline source credit** (e.g. "— after Goldsworthy") ships *with* the text in its
  own file, not only on the attribution page (spec §7).

---

## 2. What I think you need, in one honest paragraph

The teaching text is genuinely the substance of this tool, and it is a real writing
job — I'd estimate **~90–120 short inline blurbs**, **~30–40 expandable passages**,
**one full worked example repeated across every step**, plus the **structured method
library** (formulas, litmus tests, traps, genre notes) and the **verbatim COMA sets**.
The good news: most **[I]** blurbs are 1–2 sentences and much of the raw material
already exists *in the spec itself* — the spec's "Guidance:" lines are effectively
first drafts you can lift and polish. The parts that deserve the most care, because
they're where users quit or go wrong, are: **Phase 3 boundaries**, **Phase 5 theme/aim
+ "faithfulness ≠ certainty"**, the **Christ-and-gospel test**, and the **Phase 6
expected-answer discipline**. If you want to write in priority order, write those
four first. The lowest-effort win is that every "Guidance:" note already in the spec
maps to an [I] slot below — you're often editing, not generating.

---

## 3. Global / cross-cutting text (not tied to one phase)

| Key | Where | Tiers | What it should cover |
|---|---|---|---|
| `home.intro` | Home / first run | I, E | What the tool is: a **workbook, not a generator**; the two things it does that paper can't (enforce disciplines, recycle your work forward); it never writes your study for you. |
| `home.philosophy` | Home / About | E | Why "the struggle is the training"; who it's for (self-prep, training someone, any leader). |
| `global.guidance-toggle` | Settings | I | What full-vs-inline guidance does; default is full. |
| `global.durability` | Storage notice | I | "Your work lives only in this browser. Export a project file to keep it safe or hand it to someone." Honest about browser-only storage. |
| `global.progress` | Phase nav | I | How the 7 phases fit together; you can move back freely. |
| `attribution.page` | Attribution page | (page) | Full credits: Helm/Matthias Media/HTC (COMA), Goldsworthy, Chapell, Robinson, Marshall, Sweatman; Bible text licenses; method content CC BY-SA. |
| `attribution.inline` | Wherever a framework appears | I | Short "— from/after [source]" credits that travel with each framework (COMA, traps, FCF, big idea). |

---

## 4. Per-phase inventory

Legend: **[I]** inline · **[E]** expandable · **[X]** worked example. "Spec seed" =
there is already a usable sentence in `SPEC.md` you can start from.

### Phase 1 — Set up

| Key | Field / screen | Tiers | What it should cover | Spec seed |
|---|---|---|---|---|
| `p1.reference` | Passage reference | I | How to enter it; aim for a single authorial unit, not an arbitrary chapter span. | – |
| `p1.genre` | Genre | I, E | Why genre matters (it changes the COMA prompts and how you read); how to tell which of the six it is. | yes |
| `p1.genre.each` (×6) | Each genre | I | One line per genre on what that genre rewards attention to. | partial (Phase 4) |
| `p1.format` | Study vs talk | I | Only Bible-study is built now; talk is coming. | yes |
| `p1.duration` | Duration | I | It sets your question budget later; be realistic. | yes |
| `p1.group` | Group composition | I, E | Why it matters: it shapes application and whether a gospel-plain question is required. | yes |
| `p1.series` | Series note | I | It's only a note — the tool doesn't manage series. | yes |
| `p1.getpassage` | Paste vs bundled | I | Paste from anywhere, or use the bundled public-domain text as a demo/comparison. | yes |
| `p1.review` | Review-the-parse screen | I, E | **Why you must check the parse** (parsers fail; 30s now saves the study); what to fix — verse boundaries, poetry line breaks, headings, translation. | yes |
| `p1.primary` | Primary translation | I, E | What "primary" means: everything anchors to it (verse refs, questions, handout). | yes |
| `p1.comparison` | Comparison / secondary | I, E | **What comparison is FOR** — noticing translators made an interpretive decision; **not** shopping for a rendering you prefer. (Important — easy to misuse.) | yes |
| `p1.mismatch` | Versification mismatch flag | I | What a flag means (translations number verses differently); check before trusting alignment. | – |
| `p1.change-primary` | Change-primary warning | I | Why changing primary means re-checking verse anchors. | yes |

### Phase 2 — Pray and read

| Key | Field / screen | Tiers | What it should cover | Spec seed |
|---|---|---|---|---|
| `p2.pray` | Pray prompt | I, E | Why pray first: we're trying to hear what God has said; the Spirit works through the word, not around it. | yes |
| `p2.read` | Read instruction | I, E | Read 3–4 times, at least once aloud, **no commentaries yet**; why — observe before you interpret; slow down. | yes |
| `p2.counter` | Read counter | I | Tap each time you read; it's just encouragement. | yes |
| `p2.quiet` | The whole screen | E | Why this phase is deliberately unproductive; resist the urge to start "working". | yes |

### Phase 3 — Map the passage

| Key | Field / screen | Tiers | What it should cover | Spec seed |
|---|---|---|---|---|
| `p3.structure` | Divide into sections | I, E | Follow the **author's** breaks, not chapter/verse numbers; name each in your own words. | yes |
| `p3.boundaries` ★ | Boundary help | E | **A large share of "I'm stuck" is a boundary problem** — cutting mid-argument or bundling two units. If you can't find one theme later, come back here first. | yes |
| `p3.marks` | Mark what confuses you | I, E | **What confused you will confuse your group.** These become **background boxes** in Phase 6, not study questions — so marking is purposeful. | yes |

★ = high-value; write early.

### Phase 4 — COMA

| Key | Field / screen | Tiers | What it should cover | Spec seed |
|---|---|---|---|---|
| `p4.overview` | COMA intro | I, E | COMA is a **preparation grid, not a study structure**; the group never sees these four headings. | yes |
| `p4.context` / `.observation` / `.meaning` / `.application` | Category intros | I | One line each on what that lens is for. | partial |
| `coma.sets` (YAML, ×6 genres) | The prompts themselves | (verbatim) | **Verbatim Helm question sets per genre** + Matthias Media/HTC attribution. *You supply the permitted text; you don't author it.* | source |
| `p4.anchoring` | Anchoring a note to verses | I | Anchored notes get recycled into Phase 6 as candidate questions. | yes |
| `p4.genre-reading` (×6) | Genre reading tips | I | Narrative → who does what & what changes; epistles → follow the connectives; poetry → repetition & imagery; etc. | yes |

### Phase 5 — Theme and aim (the hinge — write with most care)

| Key | Field / screen | Tiers | What it should cover | Spec seed |
|---|---|---|---|---|
| `p5.theme` ★ | Theme frame | I, E | What a theme is ("what the passage says"); how the frame works. | yes |
| `p5.author-aim` ★ | Author-aim frame | I, E | "What the author wanted to happen"; distinct from theme. | yes |
| `p5.group-aim` | Your aim for the group | I, E | Must **flow out of the author's aim**, not from what you personally found striking. | yes |
| `p5.know-feel-do` | Know / feel / do | I, E | These three become the filter for every application question and a Phase 7 check. | yes |
| `stuck.helpers` (YAML ×5) | Stuck helpers | I each | The five on-demand helpers (tell it back in 3 sentences; first vs last verse; load-bearing sentence; what is it *against*; write a bad theme and attack it). | yes |
| `litmus.theme` (YAML ×5) | Theme litmus tests | I each | The five acknowledgement tests on leaving the phase. | yes |
| `p5.faithfulness` ★★ | Faithfulness ≠ certainty | I, E | **The single most important reassurance in the tool.** There's a range of defensible themes; landing at a different point in the range isn't unfaithfulness; landing outside it is. This is where users quit. | yes |
| `p5.christ-route` ★ | Christ & gospel test | I, E | The route: text → its place in the covenant story → fulfilment in Christ → us, in Christ. Write the sentence for how *this* passage gets to Christ. | yes |
| `traps` (YAML ×4) | The four traps | I each | Moralism / Allegory / Christless history / Flattening — each with "looks like" + "check". (After Goldsworthy — attribute.) | yes |
| `p5.credits` | Inline source credits | I | Goldsworthy (biblical theology/traps), Chapell (fallen-condition focus), Robinson (big idea) — credited where they're used. | yes |

★★ = write this one first. ★ = high-value.

### Phase 6 — Build the questions

| Key | Field / screen | Tiers | What it should cover | Spec seed |
|---|---|---|---|---|
| `p6a.weight` | Weight the sections | I | Uneven weighting isn't a coverage failure — it's what having an aim looks like. | yes |
| `p6b.budget` | The budget | I, E | The suggested totals/allocation by duration; **err low** — finishing early having landed the aim beats rushing the application. | yes |
| `p6c.generate` | Generate wide | I | **Don't evaluate yet.** Generating and filtering are separate operations. | yes |
| `formulas` (YAML, ~20) ★ | Formula library | I each + stem | Each formula = a short name, one-line explanation, and a **scaffolded stem with blanks**. Groups: observation moves (count/list, track subject, compare, odd grammar, structure, absence); meaning (logic/connection, cause/purpose, proportion/emphasis, counterfactual, summary, original hearing, theology & Christ, tension/resolution); context formats; application generators (hunt purpose clauses, book's stated purpose, locate the pressure, invert the indicative). | yes (names only) |
| `p6.recycled` | Recycled candidates | I | Framing for promoted marks: "what confused you will confuse them — **tell** them, don't ask them." | yes |
| `p6d.cut` | Cut view | I | Test each candidate against theme and aim; discards are hidden, not deleted. | yes |
| `p6e.expected` ★★ | Expected answer (required) | I, E | **The one hard rule.** If you can't write the expected answer, the question is broken. Why this is enforced. | yes |
| `p6e.type` / `.weight` / `.loadbearing` / `.wrongturns` / `.pastoral` | Question fields | I each | Short guidance per field; pastoral flag prompts "who is in the middle of this — raise it privately?" | yes |
| `litmus.question` (YAML ×4) | Inline per-type litmus | I each | Context / Observation / Meaning / Application — the "can they answer it from…?" tests shown by question type. | yes |
| `warnings` (YAML ×3) | Soft warnings | I each | Messages for yes-no opener, leading ("don't you think"), double-barrelled — each explains the risk, all overridable. | yes |
| `p6f.support` ★ | Support passages | I, E | The three types (context / quoted / background) and what each does; each costs 3–5 min; keep them visually subordinate. | yes |
| `p6f.return` ★ | Return-question prompt | I, E | **The step everyone forgets** — the follow-up that brings the group back to the main passage; it's why studies finish in the wrong book. | yes |
| `p6g.sequence` | Sequence | I, E | Work in clusters: 2–3 observations, then the meaning question they can now answer; observation-before-meaning is *per text*, not across the study; application last. | yes |
| `p6h.prayer` | Prayer point | I | Draw it from the passage itself. | yes |

### Phase 7 — Check and export

| Key | Field / screen | Tiers | What it should cover | Spec seed |
|---|---|---|---|---|
| `p7.audit.intro` | Audit intro | I | This is a checklist you can override; nothing blocks export. | yes |
| `audit.items` (×11) | Each audit item | I each | One line per check on why it matters / what to look for (serves theme+aim; expected answer present; coverage; type balance; meaning-order; application last & general→particular; know/feel/do; time vs length; ≥2 load-bearing; gospel-plain if required; prayer point). | yes |
| `p7.coverage` ★ | Coverage map | I, E | Tag every untouched section as *connective tissue*, *deferred*, or *needs a question* — makes "does anything resist the theme?" concrete. | yes |
| `p7.gospel-plain` | Gospel-plain requirement | I | Why it's required for mixed / one-to-one-with-a-not-yet-Christian groups. | yes |
| `p7.export.handout` | Handout export | I | What it contains and deliberately leaves out (no answers/theme/type/timings). | yes |
| `p7.export.leader` | Leader's-notes export | I | Everything, for you. | yes |
| `p7.export.project` | Project file | I | Re-importable; how a trainee sends work to a trainer. | yes |

---

## 5. The structured method library (YAML — text you supply once)

These aren't per-field blurbs; they're reusable data the app renders in many places.
Counts are approximate targets:

| File | Items | Notes |
|---|---|---|
| `content/method/coma.yaml` | 6 genre sets | **Verbatim Helm**, with Matthias Media/HTC attribution. |
| `content/method/formulas.yaml` | ~20 | name + explanation + stem-with-blanks + which types/genres it suits. |
| `content/method/litmus.yaml` | 5 theme + 4 question | the acknowledgement/inline tests. |
| `content/method/traps.yaml` | 4 | trap / looks-like / check (+ Goldsworthy credit). |
| `content/method/stuck-helpers.yaml` | 5 | the on-demand Phase-5 helpers. |
| `content/method/genres.yaml` | 6 | genre label + reading-tip one-liner + which COMA set. |
| `content/method/warnings.yaml` | 3 | soft-warning messages. |

---

## 6. The worked example (one passage, every step)

The spec wants a worked example **available at every phase** — i.e. one real passage
carried all the way through, showing an example section map, example COMA notes,
example theme/aim/know-feel-do, example questions with expected answers, etc. This is
demonstration content (clearly labelled "Example"), not a user's study.

**What I need from you:** pick **one** passage to be the canonical worked example —
ideally the same one we use as the demo/parser-test passage, so it earns its keep
twice. Good candidates (self-contained, clear author's aim, a reachable-but-not-trite
Christ connection):
- **Narrative:** Luke 5:1–11 (calling of the first disciples) or Ruth 1.
- **Epistle:** Philippians 2:1–11 or Colossians 1:15–20 (also exercises poetry-in-prose).
- **Poetry:** Psalm 1 or Psalm 23.

Once chosen, the worked example is really *its own pass through this whole inventory*
— an example answer for each step. You can write it last, after the field guidance,
since it depends on the method text being settled.

---

## 7. Suggested writing order (so text is ready as each stage is built)

Aligned to the build stages in `PLAN.md`, and front-loading the high-value pieces:

1. **First:** `p5.faithfulness`, `p5.theme`, `p5.author-aim`, `p5.christ-route`,
   `p6e.expected`, `p3.boundaries` — the make-or-break teaching moments.
2. **With M1 build:** all Phase 1/2/3/5/6/7 **[I]** blurbs (mostly polishing the
   spec's existing "Guidance:" lines), plus `formulas.yaml`, `litmus.yaml`,
   `traps.yaml`, `stuck-helpers.yaml`.
3. **With COMA stage:** `coma.yaml` (the permitted verbatim sets) + genre notes.
4. **[E] expandables** where users need more, added as you see the fields in the app.
5. **The worked example**, last, once the method text is settled.

You never have to write ahead of the build — each stage only needs its own [I] text
to ship, and the app shows a clear "guidance to be written" placeholder until then.
