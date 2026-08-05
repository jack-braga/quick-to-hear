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
