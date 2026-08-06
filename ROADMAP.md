# Roadmap

Wanted capability that is intentionally **not built yet**. Captured here so the
decision to defer is explicit rather than forgotten. Staged, in-scope work lives in
`docs/PLAN.md`; this file is only for things deliberately out of the current build.

## 1. Talk mode

**Want:** a second output format — preparing a talk/sermon rather than a small-group
study — sharing the same front end.

**Why deferred:** the spec scopes this out for now, but it must not require a rewrite
later. Phases 1–5 (setup → read → map → COMA → theme & aim) are format-agnostic and
shared. The build process diverges only at **Phase 6**.

**Sketch of the eventual design:**
- Keep Phase 6 behind a `setup.format`-keyed boundary (`pages/phase6/StudyBuild.tsx`
  today; add `TalkBuild.tsx` later) so no Phase-6 assumption leaks into shared state.
- Talk mode replaces the question-budget/build flow with a talk-structure flow, but
  reuses theme/aim, the Christ-and-gospel test, verse anchoring, and export plumbing.
- Exports gain a talk-outline artefact alongside (or instead of) the handout.

## 2. Series management

**Want:** model a study as part of a series (e.g. "Week 3 of 8 through Luke 1–2"),
carry a book's main line across studies, and defer questions to a later week.

**Why deferred:** a real series data model (cross-study linking, shared themes,
deferred-question tracking) is a large surface for marginal early value. The spec
deliberately keeps this to a **free-text note only** (`setup.seriesNote`).

**Sketch of the eventual design:**
- Introduce a lightweight `Series` record that owns an ordered list of study ids and
  a shared "book main line" note, without coupling studies tightly.
- Let a deferred Phase-3/6 question carry a "defer to week N" tag that surfaces when
  that week's study is opened.

## 3. Accounts, sync, collaboration

**Want:** cloud accounts, cross-device sync, and trainee↔trainer collaboration in-app.

**Why deferred:** the tool is deliberately **static, server-less, and account-less**.
The trainee→trainer handoff is served by exporting and re-importing the **project
file** — no backend required.

**Sketch of the eventual design (only if ever wanted):**
- Optional, opt-in sync via a user-provided store (e.g. their own file host or a
  paste of the project JSON), keeping the default zero-backend.

## 4. Anything that generates the user's content

**Want (from users, anticipated):** "just draft the questions / theme / application
for me."

**Why it will never be built:** this defeats the tool's purpose. The struggle is the
training; a tool that writes questions produces a user who cannot write questions.
The tool provides prompts, formulas, tests, and examples — never the user's answers.
This is a permanent non-goal, listed here so the pressure to add it is met with a
recorded decision.

## 5. Unified passage-interaction UI for Phases 3/4/6 (design spike)

**Want (owner feedback, 2026-08-06):** replace the current phase-by-phase verse UIs
with **one text-first interaction** modelled on the YouVersion Bible app — you select
a verse (or a span of words within it, manuscript-discovery style) and then act on the
selection: **section it off, mark it as confusing, or write a note/question against
it** — all in the same surface, rather than the separate "pick a verse in a chip grid"
controls Phases 3 and 4 use today.

**Owner's specific observations that motivate it:**
- Phase 3 section boxes **clip long verses**, and the "Split here" affordance reads
  oddly. Open question the owner raised: **box-per-verse vs a continuous stream of
  text** you select within.
- The interactions are **fragmented**: Phase 3 marks a verse for a question but you
  can't type the question there; Phase 4 (Stage 4) now lets you type a note against a
  verse anchor, but via a chip picker, not by selecting the text itself.
- Wants **inline question authoring at the point of selection**, and possibly to fold
  "section", "mark", and "note/question" into one select-then-choose gesture.
- **Phase 4 (COMA), owner feedback 2026-08-06:** (1) **each prompt should have its own
  answer field**, not one free-form note area per heading (Context/Observation/…) — so
  the verbatim Helm prompts render as prompt→answer pairs, and an answer to a specific
  prompt recycles as a candidate question. (2) Same as above: **interact with the
  rendered text (YouVersion-style selection)** to anchor a note, not a row of verse-number
  chips. Today Phase 4 has one composer + note list per category and a chip-based
  `<VerseAnchorPicker>`; the target is per-prompt answers anchored by text selection.

**Why deferred (not silently absorbed into a build stage):** this is a cross-cutting
UX redesign touching Phases 3, 4, and 6 and the shared `<VerseAnchorPicker>`. It wants
**throwaway HTML/artifact mockups to test the interaction** before committing code, and
a decision on the text-selection model (whole-verse chips vs sub-verse manuscript
selection vs a rendered-passage selection layer). The current pieces are already the
right primitives — anchors are verse-ID based (`VerseAnchor`), sub-verse marks store
char offsets, and recycle-forward is provenance-based — so this is an **evolution of
the existing model, not a rewrite**.

**Sketch of the eventual design:**
- A single rendered-passage component with a selection layer (tap a verse; drag/tap to
  extend across words) that emits a `VerseAnchor` (+ optional sub-verse `span`) — the
  same output `<VerseAnchorPicker>` produces today, so the store model is unchanged.
- A contextual action bar on selection: *Start a section here* / *Mark as confusing* /
  *Add a note* (typed inline), routed to `map.sections`, `map.marks`, or `coma.*`.
- Phase-specific chrome (COMA categories, section names) layers on top of the shared
  selection surface instead of each phase reinventing verse selection.
- For per-prompt COMA answers: a `Note` would gain an optional prompt reference (e.g.
  `promptRef: { comaSet, category, index }`) so an answer binds to the specific Helm
  prompt it responds to; recycle-forward then carries prompt→answer→candidate-question.
  (Model change only — the current category-level `coma.{context,…}: Note[]` still holds.)

**Related near-term defects (fix independently of this spike):** poetry/verse-number
rendering in `PassageView` (see PROGRESS "Known issues"); phase-nav hidden in portrait
on phones. These are bugs, not part of this redesign.
