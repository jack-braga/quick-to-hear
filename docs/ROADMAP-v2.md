# Quick to Hear — v2 roadmap (the text-central overhaul)

> **Status (2026-08-07):** the planned build (Stages 0–10, M1–M4) is complete and shipped on
> `main`. v2 is a **UI/UX overhaul**, not new domain logic — the pure libraries (verse
> anchoring, audit, exports, recycle-forward) carry over unchanged. This doc holds the thesis,
> the decisions we've locked, the questions still open, and the build order. It's a working
> document — edit it as decisions land.
>
> First artifact: the clickable prototype at `docs/mockups/v2-reader.html`.

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

---

## 3. Open design questions (resolve before/inside the relevant phase)

1. **Annotation vocabulary — collapse the overlapping kinds.** Today there are mark / note /
   comment / question / support. Proposal: **three primitives** — **Note** (any observation,
   with an optional COMA type; a "Mark = confusing" and a "Comment" are just notes with a flag),
   **Question** (the deliverable; carries the expected-answer hard block), and
   **Cross-reference** (points to another passage). Fewer, clearer, better icons/labels.
   *Pending owner confirmation.*
2. **One reference paradigm, not two.** Anchoring (what verses a note is *about*) and a
   cross-reference (another passage a note *points to*) are different axes, but a cross-ref
   isn't a separate paradigm — it's a Note/Question whose anchor is the main text and which also
   carries an outward pointer. Inline `@Malachi 4:5-6` mentions inside any note become linked
   chips. **Keep one model:** everything anchors to verses; some annotations also point out.
3. **Floating / study-level notes.** Allow annotations with no verse anchor (or anchored to the
   whole passage) for study-level content — theme, aim, prayer point, a note-to-self. These live
   in a distinct area (top/bottom of the margin), separate from verse-anchored cards.
4. **Manuscript / flatten reading mode + verse-level sectioning.** A reading toggle:
   *Formatted* (poetry lines, paragraphs, headings) ↔ *Manuscript* (continuous prose, verse
   numbers faint/hidden). **Both require one verse-driven render**, which *also* enables
   **section breaks between any two verses** (not only at paragraph gaps — the current prototype
   splits at paragraph boundaries for demo simplicity). Ship the verse-driven render once and
   get both.
5. **Question ordering — spatial vs sequence.** Questions live anchored on the text (spatial),
   but the handout needs a deliberate teaching **sequence** (observation before meaning,
   application last). Resolution: two views of the same set — *anchored* (on the canvas) and an
   ordered *running order* panel in the Build lens (defaulting to verse order, freely
   reorderable). The order is what exports.

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
