# Bible Study Preparation Tool — Flow Specification

> This is the authoritative specification for *what the tool does and why*. It is
> reproduced verbatim from the original brief. It intentionally contains no
> technical implementation detail — those decisions live in `PLAN.md`.
>
> When `PLAN.md` and this document disagree about *behaviour*, this document wins
> and `PLAN.md` should be corrected. When they disagree about *implementation*,
> `PLAN.md` wins (this document has no opinion on implementation).

---

## 1. What this is

A browser-based workbook that walks someone through preparing a Bible study, from a bare passage reference to two finished documents: a participant handout and a set of leader's notes.

It is hosted free and static. It has no accounts and no server.

**It is a workbook, not a generator.** The tool structures, prompts, and checks. It never writes the user's questions, theme, or application for them. This is a deliberate constraint, not a limitation to be engineered around: the struggle is the training. A tool that writes questions produces a user who cannot write questions.

What the tool *can* do that paper cannot is **enforce disciplines** and **recycle earlier input**. Those two things are the reason it exists, and every design decision should serve them.

## 2. Who it is for

Three overlapping uses, all served by one build:

- The user preparing their own studies
- The user handing the tool to someone they are training
- Any small-group leader who finds it

The teaching content is therefore always present but never obtrusive: short guidance beside each field, expandable help, and a global toggle to reduce guidance for experienced users. Default is guidance on.

## 3. Principles that govern every decision

1. **The passage is the subject.** Nothing in the interface should compete visually with the biblical text.
2. **Nothing is written for the user.** Prompts, formulas, tests, and examples — never generated content.
3. **Disciplines are enforced, not suggested.** Where the method says "always do X," the tool should require X rather than recommend it.
4. **Earlier work is recycled forward.** Anything the user typed in an earlier phase reappears where it becomes useful.
5. **Guidance appears at the moment of need,** not on a separate reference page.
6. **The user can always override.** Warnings, not blocks — with the single exception noted in Phase 6.
7. **Work is never lost.** Autosave throughout, plus explicit export.

---

## 4. The seven phases

The user moves through these in order but can navigate back freely. Progress is visible throughout.

### Phase 1 — Set up

Collect:

- **Passage reference** (book, chapter, verse range)
- **Genre** — inferred from the reference, shown to the user for confirmation, always overridable. The six genres are: Gospels and Acts, Old Testament narrative, Epistles, Hebrew wisdom literature and poetry, Prophetic literature, Apocalyptic literature. Genre determines which COMA prompts appear in Phase 4.
- **Format** — Bible study or talk. *Only the Bible study path is built for now. See section 9.*
- **Duration** — drives the question budget in Phase 6.
- **Group composition** — believers, mixed, or one-to-one with a not-yet-Christian. This affects application guidance and whether the tool requires a gospel-plain question in the Phase 7 audit.
- **Series note** (optional, free text) — e.g. "Week 3 of 8 through Luke 1–2". Purely a note. No series data model. Guidance elsewhere mentions carrying a book's main line across studies and deferring questions to a later week, but the tool does not manage this.

**Then: get the passage in.**

Two paths:

- **Paste.** The user copies from BibleGateway, the YouVersion app, or anywhere else. The tool normalises it.
- **Bundled public domain.** The World English Bible and the King James Version ship with the tool. These serve as a zero-friction demo, an always-available comparison text, and a parser test bed.

**Normalisation must handle:**

- Verse numbers, whether superscript characters or plain digits
- Footnote and cross-reference markers that land mid-sentence
- Editorial section headings — preserved, but marked as editorial so they are never treated as text to be studied
- Trailing copyright blocks and "read full chapter" links
- Translation identification and reference range, recovered from the paste where possible
- **Poetry line breaks.** Critical. Pasted poetry frequently collapses into prose, which destroys the parallelism the user needs to observe. Line structure must survive.

**Then: review the parse.** A mandatory screen showing the parsed result, with the user able to correct verse boundaries, fix line breaks, reclassify headings, and confirm the translation. Parsers fail. Silent failure is far worse than thirty seconds of correction.

**Translations.** One translation is **primary** — the one the group will hold. Everything anchors to it: verse references, questions, and the participant handout. Others are **secondary**, for comparison only. The user may add secondary translations at any point.

Comparison is available two ways, both supported:
- **On demand at a verse** (default) — the user asks to compare a specific verse
- **Side-by-side column** (optional toggle) — for users who prefer it

Alignment is by verse number. Where verse counts differ between translations, the tool flags the mismatch rather than silently misaligning. Changing the primary translation warns that verse anchors need re-checking.

Guidance here must state what comparison is for: noticing that translators made an interpretive decision. It is **not** a way to select the rendering one prefers.

### Phase 2 — Pray and read

A deliberately quiet screen. No fields, nothing to type.

- A prompt to pray before beginning, with brief guidance on why: we are trying to hear what God has said, and the Spirit works through the word rather than around it.
- The passage, displayed well.
- An instruction to read it three or four times, at least once aloud, with no commentaries or study notes.
- A simple read-counter the user can tap, purely to encourage the repetition.

This phase exists to slow the user down. Resist the urge to make it productive.

### Phase 3 — Map the passage

Two tasks on one screen, both anchored to the text.

**a. Structure.** The user divides the passage into sections following the author's own breaks, and names each one in their own words.

Guidance: follow the author's breaks, not chapter or verse divisions. If you later cannot find a single theme, come back here first — a large share of "I'm stuck" is a boundary problem, either cutting mid-argument or bundling two units together.

**b. Mark questions.** The user marks any verse, phrase, or word they do not understand. These are questions only — no other annotation types.

Guidance, which must be explicit: **what confused you will confuse your group.** These marks become candidate background boxes in Phase 6, not study questions. The tool tells them so here, so the marking feels purposeful.

### Phase 4 — COMA

Four categories of preparation notes: Context, Observation, Meaning, Application.

The genre selected in Phase 1 determines which prompts are shown. The full COMA question sets from *One-to-One Bible Reading* by David Helm are reproduced verbatim under permission, with attribution to Matthias Media and Holy Trinity Church displayed on screen.

The user takes free-form notes against each category. Notes can be anchored to specific verses; anchored notes are recycled in Phase 6 as candidate questions of the matching type.

Guidance must make clear that COMA is a **preparation grid, not a study structure**. The group will never see these four headings. This is thinking scaffolding only.

Genre guidance, shown alongside: narrative rewards attention to who does what and what changes; epistles reward following the connectives; poetry rewards repetition and imagery.

### Phase 5 — Theme and aim

The hinge of the whole method. Two sentences.

**Theme** — what the passage says. Offered as a frame the user completes:
> In this passage, [author] shows that \_\_\_\_\_\_.

**Aim** — what the author wanted to happen:
> He wrote it so that his readers would \_\_\_\_\_\_.

Then **the user's aim for their group**, which must flow out of the author's aim rather than from what the user personally found striking.

Then the aim is broken into three fields: what the group should **know**, **feel**, and **do**. These three become the filter for every application question in Phase 6 and a checked item in Phase 7.

**Stuck helpers** — available on demand, not forced:

1. Close the Bible and tell the passage back in three sentences, aloud. What you naturally say sits on top of the theme.
2. Compare the first verse to the last. What has changed? The movement is usually the point.
3. Find the load-bearing sentence — the one clause everything else serves.
4. Ask what the passage is *against*. Nearly every text answers a fear, a false confidence, or a complacency. Naming the opponent often yields theme and aim together.
5. Write a deliberately bad theme sentence and attack it. Editing is easier than generating.

**Litmus tests** — presented as the user leaves the phase, each requiring acknowledgement:

1. Would the author recognise it?
2. Does it need *this* passage, or could you preach it from three others?
3. Could a devout non-Christian affirm it? If yes, you have moralised.
4. Does everything serve it, and does anything actively resist it?
5. What does this passage contribute that another would not?

**The Christ and gospel test** — a distinct step, not folded into the above. The route is:

> Text → its place in the covenant story → its fulfilment in Christ → us, who are in Christ

The user states, in a sentence, how this passage gets to Christ. The tool presents the four traps as checks:

| Trap | Looks like | Check |
|---|---|---|
| Moralism | The character becomes an example to copy | Could a devout non-Christian say this? |
| Allegory | Christ found *under* the text by resemblance | Does the link run through a promise, office, institution, covenant, or an unsolved problem? |
| Christless history | Accurate exposition where Jesus is incidental | Where does this sit on the line from Abraham to Christ? |
| Flattening | Every study ends at the cross regardless of the text | What does *this* passage add? |

Guidance must include: **faithfulness is not the same as certainty.** There is a range of defensible themes. Landing at a different point in the range is not unfaithfulness; landing outside it is. This matters — uncertainty at this step is the single most common place users give up.

### Phase 6 — Build the questions

The longest phase. It must be presented as sequential sub-steps, because collapsing them is what makes people stall.

**6a. Weight the sections.** The user marks each Phase 3 section as carrying heavy, medium, or light weight against the theme. Guidance: uneven weighting is not a coverage failure, it is what having an aim looks like.

**6b. See the budget.** Derived from the duration set in Phase 1.

Suggested totals: 45 minutes → 6–8 questions. One hour → 8–12.

Suggested allocation: context 0–1, observation 3–5, meaning 2–3, application 2–3, plus a prayer point.

Every question carries a **weight**: light (~1 minute), medium (~3), heavy (~6). A running time total is visible throughout the build and compared against the session length. Each support passage costs 3–5 minutes and appears in the same total.

Guidance: err low. Finishing early having landed the aim is a good study; rushing the last four questions means no application happened at all.

**6c. Generate wide.** A brainstorming space with no fields, no filtering, and no evaluation. The user dumps candidates.

Available here:

- **Their own recycled material**, surfaced as candidates:

| From | Becomes | Framing shown to user |
|---|---|---|
| Phase 3 question marks | Candidate **background boxes**, not questions | "What confused you will confuse them — tell them, don't ask them" |
| Phase 4 COMA notes | Candidate questions of matching type | Direct promotion |

- **A formula library**, browsable by question type and by genre. Selecting a formula drops a scaffolded stem with blanks into the brainstorm. The library contains the observation moves (count or list, track the subject, compare, odd grammar, structure, absence), the meaning formulas (logic and connection, cause and purpose, proportion and emphasis, counterfactual, summary, original hearing, theology and Christ, tension and resolution), the context formats, and the application generators (hunt for purpose clauses, use the book's stated purpose, locate the pressure, invert the indicative).

Guidance here must say explicitly: do not evaluate yet. Generating and filtering are separate operations.

**6d. Cut.** A separate view. Each candidate is tested against the theme and aim and either promoted or discarded. Discarded candidates are kept but hidden, in case the user changes their mind.

**6e. Complete each promoted question.** Fields:

- Question text
- Verse anchor (one or more verses in the primary translation)
- Type — context, observation, meaning, or application. Used for balance checking and for ordering. Never shown on the participant handout.
- **Expected answer — required.** A question cannot be promoted without one. This is the single enforced discipline in the tool, and it is deliberate: if you cannot write the expected answer, the question is broken.
- Weight
- Load-bearing — yes or no. Feeds the drop order.
- Anticipated wrong turns and how to redirect (optional)
- Pastoral sensitivity flag (optional) — when set, prompts: who in your group is in the middle of this, and should you raise it privately instead?

**Inline litmus tests**, shown according to the question's type as it is written:

- Context: can they answer it from a verse you have pointed them to?
- Observation: can they answer it by looking? Is the answer worth having? (Easy is fine; trivial is not.)
- Meaning: can they answer it from observations you have already had them make?
- Application: which aim component does it serve — know, feel, or do?

**Automated warnings** on the question text, all soft:

- Opens with Is / Are / Does / Did / Was → possible yes-no question
- Contains "doesn't" or "don't you think" → possible leading question
- Contains two question marks, or "and" followed by a second interrogative → possible double-barrelled question

**6f. Support passages.** The user may attach passages from outside the main text. Three types, distinguished by function:

| Type | What it is | Behaviour |
|---|---|---|
| **Context** | Earlier in the same book, needed to make sense of today's text | Usually becomes framing or the first question |
| **Quoted or alluded** | The author sent you there | Must be printed in the handout; must be framed as a question |
| **Background** | Needed for comprehension, not for discussion | Becomes a box. Never becomes a question. |

Behaviour required:

- Support passage text is displayed distinctly from the main passage — visually subordinate, with the reference always visible so nobody loses their place. It must never compete with the main text.
- **Budget enforcement**: warn at the third support passage of the context or quoted types. Each costs 3–5 minutes.
- **Return question prompt**: when a support passage is attached to a question, the tool prompts for the follow-up question that brings the group back to the main passage. This is the step everyone forgets, and it is why studies finish in the wrong book.

**6g. Sequence.** The user arranges the promoted questions.

Guidance: work in clusters — two or three observations, then the meaning question they have just made answerable. The rule is observation before meaning *for a given piece of text*, not across the whole study. Application stays at the end, because there is one aim.

The tool warns if a meaning question is placed before the observation questions anchored to the same verses.

**6h. Prayer point.** A required field. Drawn from the passage itself.

### Phase 7 — Check and export

**The audit.** A checklist the user works through, each item showing the relevant evidence:

- Every question serves the theme and aim
- Every question has an expected answer
- **Coverage** — a visual map of the passage showing which verses no question touches. Every untouched section must be tagged by the user as *connective tissue*, *deferred*, or *needs a question*. This makes the "does anything resist the theme" test concrete.
- Balance across the four question types
- No meaning question precedes its supporting observations
- Application is last, and moves general before particular
- Application covers the know / feel / do components of the aim
- Total estimated time against session length
- At least two load-bearing questions marked
- A question that makes the gospel plain, **required** where group composition is mixed or one-to-one with a not-yet-Christian
- A prayer point drawn from the passage

Items may be dismissed with acknowledgement. Nothing blocks export.

**Exports — three artefacts:**

**1. Participant handout.** Clean and answer-free.
- Brief introduction if the user wrote one
- The passage, primary translation only
- Numbered questions with white space to write
- Support passages printed inline at the point of need
- Background boxes
- Prayer point
- Translation copyright line
- No theme, no aim, no type labels, no timings, no answers

**2. Leader's notes.** Everything.
- Theme, aim, and the know / feel / do breakdown
- The statement of how the passage gets to Christ
- Section map with weights
- Every question with expected answer, verse anchor, type, weight, and anticipated wrong turns
- Load-bearing questions marked, with a suggested drop order
- Background material decided against but kept in reserve
- Pastoral sensitivity flags
- Translation comparison notes
- Attribution and copyright lines

**3. Project file.** Re-importable, containing everything.

Handout and leader's notes are each available as a print-ready page and as markdown.

---

## 5. The help layer

Present throughout, in three tiers:

- **Inline** — a line or two beside each field, always visible
- **Expandable** — the fuller reasoning, opened on request
- **Worked examples** — a real passage taken through the step, available at every phase

A global toggle reduces guidance to inline only. Default is full guidance, because the training use matters.

The help layer is the tool's substance. It should be written with as much care as the interface.

## 6. Persistence

Work saves automatically in the browser as the user goes. Multiple studies can be kept and reopened. Any study can be exported as a project file and re-imported, which is how a trainee sends work to a trainer for review.

## 7. Licensing and attribution

**Code:** MIT.

**Method content** (guidance text, tests, formulas, examples): CC BY-SA.

**COMA question sets:** reproduced verbatim from *One-to-One Bible Reading* by David Helm, © Matthias Media and Holy Trinity Church, used with permission. Attribution shown wherever they appear, not only on a credits page.

**Bible text:** the tool ships only public domain translations. All other text is supplied by the user. The translation identified at ingest determines the copyright line automatically appended to every export. This is a functional requirement.

**Method attribution:** where a test or framework comes from a named source, say so inline — this teaches the user where to go next. Sources to credit include David Helm and Matthias Media (COMA), Graeme Goldsworthy (biblical theology and the traps), Bryan Chapell (the fallen condition focus), Haddon Robinson (the big idea), Colin Marshall (*Growth Groups*), and Richard Sweatman (*Writing a Small Group Study*).

A full attribution page lists everything.

## 8. Out of scope for this build

- **Talk mode.** Phases 1–5 are shared. Talk mode branches at Phase 6 with a different build process. Design the flow so this branch can be added without restructuring, but do not build it now.
- **Series management.** A free-text note only.
- **Accounts, sync, collaboration.** None.
- **Any generation of the user's content.**

---

## 9. Before you build

The technical approach was discussed with the user and agreed before any code was
written. The decisions are recorded in `PLAN.md`. In summary:

- **Framework/tooling:** React + Vite + TypeScript.
- **Hosting:** GitHub Pages (static), deployed by GitHub Actions.
- **Build approach:** staged, with `PLAN.md` (the plan) and `PROGRESS.md` (the
  live tracker) maintained so work can be tested at each stage and resumed by a
  fresh session.

See `PLAN.md` for storage, parsing, verse anchoring, print output, help-content
authoring, and the full staged build order.
