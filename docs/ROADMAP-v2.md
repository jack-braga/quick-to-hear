# Quick to Hear — v2 roadmap (the text-central overhaul)

> **Status (2026-08-07):** the planned build (Stages 0–10, M1–M4) is complete and shipped on
> `main`. v2 is a **UI/UX overhaul**, not new domain logic — the pure libraries (verse
> anchoring, audit, exports, recycle-forward) carry over unchanged. This doc holds the thesis,
> the decisions we've locked, the questions still open, and the build order. It's a working
> document — edit it as decisions land.
>
> **Clean break (owner, 2026-08-07):** there are **no users**, so v1 is **deprecated and frozen
> as a reference** — do not maintain it, keep it shippable, or migrate its data. **Studies are
> non-upgradable**: no `hydrate`/migration path from v1 docs; evolve the schema freely. Keep the
> v1 source in-tree as a crib until v2 reaches parity, then remove it. **Reuse the v1 pure
> libraries** (the load-bearing logic); the overhaul is the shell + how the phases are presented.
>
> First artifact: the clickable prototype at `docs/mockups/v2-reader.html`. Fresh sessions:
> **`docs/V2-SESSION-PROMPT.md`** is the handoff.

---

## 1. The thesis

**The passage is the canvas.** One central, always-visible text; everything else — section
bands, marks, notes, questions, cross-references, comments — is an **annotation anchored to a
verse selection**, layered over it. The seven phases become **lenses** over that same canvas
(the discipline stays; only the shell changes). `/` is the one keyboard-first primitive for
referencing and for every insert/action.

Visual language: a warm "leaf on a desk" reading surface, **lapis** accent (the ultramarine of
illuminated manuscripts), Scripture in a humanist serif, every anchor/command in monospace — *a
manuscript that answers to a command line*. Full day/night.

---

## 2. Decisions locked (owner-confirmed)

- **Lenses over one canvas** — not seven separate pages. Switching phase changes what you do to
  the text and what overlays it; the text stays put.
- **Right-margin annotation cards** — Google-Docs-style, roughly aligned to their verses.
- **Universal `/` command** — references *and* actions (new question, note, mark, insert
  support, switch translation, jump to verse, run the audit).
- **Sectioning = named bands over the text**, available from the moment the passage loads (not
  gated behind a numbered step). Divide by a hover "＋ divide here" affordance; merge with `⌫`;
  each band has an inline-editable name + its verse range.
- **Weighting (light/med/heavy) belongs to the Build lens, not the Map lens.** The same section
  band shows different affordances per lens; weight is a Build-time judgment, so it doesn't
  clutter Map. (Removed from the Map prototype.)
- **Selection is drag-to-range** (press and drag across verses), **⌘/Ctrl adds a disjoint
  range**, **⇧ extends** from the last anchor. Native text-highlight is suppressed
  (annotation-first); copy-to-clipboard becomes its own action later.
- **Two-way hover linking** — hovering a verse lights every note about it, and hovering a note
  lights its verses.
- **Select-a-section is shorthand for its verse range, stored as verses (a snapshot)** — not a
  live link to the section. If the section boundaries later change, the annotation keeps the
  verses it was made against. (Consistent with the existing anchor-ID model + `reconcileMarks`.)
- **Selection details:** ⌘/Ctrl-click toggles a single verse in/out; a plain click on the sole
  selected verse **deselects** it. Action-bar kinds carry icons: `✎ Note · ? Question ·
  ⚑ Mark confusing · ↗ Cross-reference`.
- **Reference paradigm (resolved).** Two *relationships*, not two paradigms. **Anchor** is
  first-class and required: every note/question/mark anchors to verses in the **main passage**.
  A **reference** to another passage is a pointer that lives *inside a note's content* — an
  `@Malachi 4:5-6` mention rendered as a chip, **not** a separate anchored object. Interactions:
  click a note's **anchor** → scroll+flash those verses; hover an `@`ref → peek popover; click an
  `@`ref → open/pull it in. **Promote** an `@`-mention → a full **Support passage** (printed in
  the handout, framed with a return-question — the v1 support-passage model + `returnQuestion`
  carry over).
- **Annotation kinds collapse to three:** **Note** (a "Mark = confusing" and a "Comment" are
  just notes with a flag; notes may carry an optional COMA type), **Question** (the deliverable;
  keeps the expected-answer hard block), **Cross-reference** (an `@`-mention / promoted support).
- **Floating / study-level notes (yes).** Annotations may be unanchored (or anchored to the whole
  passage) for study-level content — theme, aim, prayer point, notes-to-self — in a distinct
  margin area, separate from verse-anchored cards.
- **Build-lens running-order panel:** the promoted questions as an ordered list with **filter by
  type**, **drag-and-drop reorder**, and **delete**. The anchored cards (spatial) and this list
  (sequence) are two views of one set; the running order is what exports (defaults to verse
  order, freely reorderable — observation before meaning, application last).
- **Parallel translations:** keep **one primary text central** (anchors bind to a single source
  of truth); secondaries are **tabs** you can pop **side-by-side** or collapse, **default
  single**. Reuses the M3 compare feature (per-verse peek + optional side-by-side); kept
  subordinate so the passage stays the subject.
- **Optional study title** (defaults to the reference) — becomes the handout heading; lives in
  the Set-up lens.

---

## 3. Open design questions (resolve inside the relevant phase)

1. **Manuscript / flatten reading mode + verse-level sectioning — agreed in principle, unbuilt.**
   A reading toggle: *Formatted* (poetry lines, paragraphs, headings) ↔ *Manuscript* (continuous
   prose, verse numbers faint/hidden). **Both require one verse-driven render**, which *also*
   enables **section breaks between any two verses** (the prototype splits at paragraph gaps for
   demo simplicity). Ship the verse-driven render once (v2.5) and get both. Detail to settle:
   how faint/hidden verse numbers get in Manuscript mode while staying selectable.
2. **Annotation icons/labels — final polish.** The three kinds are decided; the exact glyphs and
   the COMA-type sub-tagging UI are for the annotation-layer phase (v2.4).
3. **Translations UX detail.** Tab affordance vs. a translations menu; how the side-by-side
   column behaves on narrow screens. Settle when the translations lens is built.

---

## 4. Build order

| Phase | Delivers | Notes |
|---|---|---|
| **v2.0 — Direction & prototypes** *(in progress)* | Clickable mockups of the signature screens; lock interaction model + visual language. | `docs/mockups/v2-reader.html` done (reader/Map/`/`/selection/sectioning). Next: Build lens; an export. |
| **v2.1 — Design system + shell** | Type scale (scripture serif + mono tooling), tokens, leaf/desk layout, theming, component inventory, a living styleguide. | Extract the mockup's tokens into the real app (Tailwind theme). |
| **v2.2 — Selection primitive** | Drag-range + ⌘-disjoint selection + the floating action bar, over the existing anchor logic. | The load-bearing interaction. Reuse `map.ts` anchor model. |
| **v2.3 — The `/` command** | Slash palette over `bcv_parser` + the bundled book list: reference, insert support, jump, switch translation, run actions. | Resolve open Q1/Q2 (vocabulary) here. |
| **v2.4 — Annotation layer** | One anchored-annotation surface unifying marks + COMA notes + comments (+ floating notes, Q3). Recycle-forward preserved. | Resolve Q1–Q3. |
| **v2.5 — Sectioning + reading modes** | Verse-driven render → any-boundary sectioning + the Manuscript/flatten toggle (Q4). Pre-suggest breaks from the translation's own paragraphs/headings. | |
| **v2.6 — Phases as lenses** | Re-flow 1–7 onto the canvas as modes; keep every discipline (budget, the expected-answer hard block, coverage, audit, exports). Question ordering (Q5). | Migrate incrementally so the app stays shippable throughout. |
| **v2.7 — Exports refresh** | Handout + leader restyled to the new language; carry the Stage-10 wins (coverage pips, support placement, pastoral). | |
| **v2.8 — Teaching + attribution pass** *(deferred)* | Fill the [I]/[E]/[X] help tiers now that gaps are visible; sweep attribution so only COMA reads as "verbatim," everything else "after/informed by" (owner rule). COMA transcription. | Deferred until the UI settles — we'll know the real gaps then. |

---

## 5. Carries over unchanged (do not rebuild)

The v1 **pure libraries** are the load-bearing logic and survive the re-skin: `src/lib/verse/*`
(IDs, ranges, `bcv_parser`), `src/lib/map.ts` (sections, marks, `reconcileMarks`),
`src/lib/questions.ts` (budget, the expected-answer hard block, warnings), `src/lib/audit.ts`
(coverage, the 11 checks), `src/lib/export/*` (handout defined-by-exclusion, leader, markdown),
`src/lib/recycle.ts`, the store, storage/hydrate, the paste normaliser, and the compare/
versification libs. v2 is a new **shell** over these.

## 6. Deferred / ROADMAP (unchanged from v1)

Talk mode; series management; BSB edition (owner to pin the berean.bible USFM); footnote /
cross-ref / rich passage rendering; multi-genre passages; translation-comparison notes in the
leader's notes (SPEC §7 gap); a quarantine-recovery UI. The two owner on-device paste
confirmations remain owed.
