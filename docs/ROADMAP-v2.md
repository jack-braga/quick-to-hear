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
>
> **Build status (2026-08-07): v2.1 ✅ and v2.2 ✅ landed.** The v2 app is the default at `/`; the
> frozen v1 workbook is a separate app under `/v1/`. The reader/Map lens works for real against
> the store (real Luke 1:5–25 + Psalm 23, selection, any-verse sectioning, marks, reload
> persistence, day/night). See **§7 Progress log** for what shipped, deviations, and next up.

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
- **Reference paradigm (resolved — implemented 2026-08-10).** Two *relationships*, not two
  paradigms. **Anchor** is first-class and required: every note/question/mark anchors to verses in
  the **main passage**. A **reference** to another passage is a pointer that lives *inside a note's
  content* — an `@Malachi 4:5-6` mention rendered as an inline chip, **not** a separate anchored
  object. Interactions: click a note's **anchor** → scroll+flash those verses; hover/click an `@`ref
  → peek popover (loads the passage); **Promote** an `@`-mention → a full **Support passage** (the
  v1 support-passage model + `returnQuestion` carry over — it prints in the handout, and in the
  leader's notes when a question shares its verses). **Owner call (2026-08-10): two gestures, not
  three** — the standalone "Cross-reference" action-bar button + palette insert were retired; a
  reference to another passage is only an `@`-mention. (The cross-ref record survives *only* as what
  a promoted mention becomes.)
- **Annotation kinds collapse to three:** **Note** (a "Mark = confusing" and a "Comment" are
  just notes with a flag; notes may carry an optional COMA type), **Question** (the deliverable;
  keeps the expected-answer hard block), **Cross-reference** (a *promoted* `@`-mention — the
  printed Support passage; never created directly, only by promoting a mention inside a note).
- **Floating / study-level notes (yes).** Annotations may be unanchored (or anchored to the whole
  passage) for study-level content — theme, aim, prayer point, notes-to-self — in a distinct
  margin area, separate from verse-anchored cards.
- **Build-lens running-order panel:** the promoted questions as an ordered list with **filter by
  type**, **drag-and-drop reorder**, and **delete**. The anchored cards (spatial) and this list
  (sequence) are two views of one set; the running order is what exports (defaults to verse
  order, freely reorderable — observation before meaning, application last).
- **Parallel translations (built 2026-08-10):** keep **one primary text central** (anchors bind to
  a single source of truth); a **⊕ Parallel** toggle pops a second, verse-aligned column,
  **default single**. A top-bar switcher changes/adds/removes translations; switching the primary
  **swaps** columns (both kept), and hovering a verse lights it in **both**. Reuses the M3
  `alignTranslations` engine; the secondary is read-only so the passage stays the subject.
- **Optional study title** (defaults to the reference) — becomes the handout heading; lives in
  the Set-up lens.

---

## 3. Open design questions (resolve inside the relevant phase)

1. **Manuscript / flatten reading mode — built (2026-08-10; sections-in-every-mode 2026-08-11).** A
   global *Formatted* ↔ *Manuscript* toggle. **Owner call:** Manuscript flattens the *text* — poetry
   → prose, no editorial headings or paragraph breaks — keeping verse **numbers visible** (not
   faint). **Owner call (2026-08-11):** the user's **section bands are kept in every mode** (a
   section should show whether Formatted or Manuscript, and stay dividable) — only the formatting
   inside them flattens. Display-only transform (`manuscriptModel`); sections/annotations untouched. **Owner call:** the "pre-suggest section breaks from the translation's paragraphs"
   idea is **dropped** — *making sections is part of the exegetical work* (the tool must not do the
   user's thinking — Inviolable rule 1). Any-verse sectioning already shipped in v2.2.
2. **Annotation icons/labels — final polish.** The three kinds are decided; the exact glyphs and
   the COMA-type sub-tagging UI are for the annotation-layer phase (v2.4).
3. **Translations UX — resolved (built 2026-08-10; unified 2026-08-11).** One header **Aa Text**
   menu holds every text option: the reading **mode** (Formatted ↔ Manuscript) and the
   **translations**, unified as **✓ = view · ★ = main** — tick two or more to read them in **parallel**
   (any number of columns; no separate toggle). The primary (★) is where notes anchor, but **every**
   column's verses are selectable (anchors are translation-independent verse ids); hovering a verse
   lights it in every column. The header **lens rail** was also replaced by header icons.

---

## 4. Build order

| Phase | Delivers | Notes |
|---|---|---|
| **v2.0 — Direction & prototypes** ✅ | Clickable mockups of the signature screens; lock interaction model + visual language. | `docs/mockups/v2-reader.html` done (reader/Map/`/`/selection/sectioning). |
| **v2.1 — Design system + shell** ✅ | Type scale (scripture serif + mono tooling), tokens, leaf/desk layout, theming, a living styleguide. | Tokens ported to `index.css` + `tailwind.config.ts`; shell in `src/v2/`; `/styleguide`. |
| **v2.2 — Reader / Map lens** ✅ | The selection primitive (drag-range + ⌘-disjoint + click-to-deselect) + floating action bar; the real passage from the store; named section bands (any-verse divide/merge/rename); marks persisted with two-way hover. | Pure libs `v2/reader/{selection,model}.ts` (unit-tested); `ReaderCanvas` a thin component over them. **Any-verse sectioning pulled forward from v2.5 (owner).** Action bar: Mark wired; Note/Question/Cross-ref deferred to v2.4. |
| **v2.3 — The `/` command** ✅ | Slash palette over `bcv_parser` + the bundled book list: jump to verse/ref, insert a cross-reference, switch translation, create note/question/mark on the selection, go to a lens, book completion. | Pure `v2/reader/paletteItems.ts` (+tests); dialog with keyboard nav; `/` global + the command bar open it. (The `@`-mention chips + promote-to-support shipped 2026-08-10 — see §5; the palette's insert-cross-reference was retired then.) |
| **v2.4 — Annotation layer** ✅ | One anchored-annotation surface: Note / Question / Support-passage (+ floating study-notes). Editable margin cards; per-kind accents + two-way hover; the expected-answer hard-block signal. | `study.annotations` (flat union) + pure `v2/annotations.ts`. Action bar = Note / Question / Mark confusing (the standalone Cross-reference was retired 2026-08-10 — references are inline `@`-mentions in a note, promoted to a Support passage). |
| **v2.5 — Reading modes** ✅ | The global Manuscript/flatten toggle (Q4). | Pure `manuscriptModel` flattens the render to one continuous flow (verse numbers only); a segmented toggle in the leaf head, persisted like ink-saver. **Section pre-suggestion dropped (owner): making sections is exegetical work.** Any-boundary sectioning already shipped in v2.2. |
| **v2.6 — Phases as lenses** ✅ | Flesh out the lenses onto the canvas; keep every discipline (the expected-answer hard block, coverage, audit, exports). | All seven lenses live: Set up (full: genre/group/duration/series/intro + paste), **Read** (pray-and-read counter + genre reading tip), Map, **COMA** (verbatim Helm prompts per genre + on-screen attribution), Theme & aim (theme/aim/know-feel-do/Christ route/prayer), Build (running order + per-question load-bearing/aim/gospel-plain), and Check (the audit + coverage). |
| **v2.7 — Exports** ✅ | The two printable documents (handout + leader) + markdown downloads, from a **Check lens** hub; documents restyled to the v2 language with a per-print **Ink-saver / Colour** toggle. | Pure `projectForExport` maps v2 annotations + running order → the v1 export model (`handoutModel`/`leaderModel` reused unchanged); new `src/v2/print/*` render them white-bg + Scripture serif + mono labels + hairline rules, monochrome by default, one lapis accent when the toggle is off (preview + print match; choice persisted). |
| **v2.8 — Teaching + attribution pass** ✅ | Surface the (already-written) `[I]`/`[E]` help in v2 + the attribution page. | A v2 `Help` component — an **(i)** that opens the inline `[I]`, with **▾ Tell me more** for `[E]` (owner: click-to-open, no Full/Brief mode; works the same on touch). Wired across Set-up / Read / COMA / Theme & aim / Build / Check / Home. A v2 **About** page (`#/about`) renders `attribution.page.md` with the "verbatim only for COMA" framing. **The `[X]` worked examples stay unwritten — owner's authorship; the disclosure appears automatically once a `<!-- example -->` block is added.** |

## 5. Progress log

### 2026-08-11 — Shell redesign (header lens rail, unified Text menu, N-column parallel) + Read/COMA re-verify

**Shipped (across five commits) + verified.** A batch of shell/reader refactors landed after the
2026-08-10 lens work; this entry records them and the Read + COMA re-verification against the new
shell (the §3 open questions Q1/Q3 were updated inline, but the log had no dated entry).

- **Lens tracker moved into the header; the left rail was removed** (`c2fa135`). The seven phases are
  now a `nav "Study phases"` in the top bar, freeing the full width for the leaf + margin.
- **Help popover hardened** (`1764414`) — clamps to the viewport and resets font/case so the `(i)`
  never opens off-screen or inherits Scripture/mono styling.
- **Section bands kept in Manuscript mode** (`736f2be`) — sections show (and stay dividable) in every
  reading mode; only the *formatting inside them* flattens (owner call, §3 Q1).
- **Unified "Aa Text" menu + N-column parallel** (`c2e229a`) — one header menu holds the reading mode
  **and** the translations as **✓ = view · ★ = main**; tick 2+ to read them in parallel (any number of
  columns, no separate toggle). Resolves §3 Q3.
- **Parallel action bar opens over the clicked column** (`2b5a1ad`).

- **Read + COMA lenses re-verified (Playwright MCP)** on a real Luke 1:5–25 / WEBBE study, genre
  auto-inferred → *gospels-acts*, against the post-refactor shell:
  - **Read** — the passage renders read-only (the canvas stays put); the pray-and-read counter
    increments **0 → 2** and **rehydrates to 2 after a hard reload** (IndexedDB); the gospels-acts
    reading tip shows; the Help **(i)** opens the inline `[I]`, **▾ Tell me more** reveals the `[E]`,
    ✕ closes. Also correct in **parallel** (WEBBE ‖ ASV, verse-aligned) with the panel intact.
  - **COMA** — all four groups render the **verbatim Helm prompts** for the genre (Context 2 ·
    Observation 5 · Meaning 4 · Application 3); the **Helm attribution renders in-panel** (inviolable
    rule 8); the Help **(i)** opens inline prose + Tell me more + the cited source line. Also correct
    in **parallel**.

Gate green: `typecheck && lint && test (298) && build`; **0 console errors** bar the two known
React-Router future-flag warnings.

### 2026-08-10 — v2.8 teaching help + attribution (surfaced in v2)

**Shipped.** The teaching prose was **already written** (69 files under `content/help/**`, nearly all
with `[I]` + `[E]`); v2's shell just wasn't showing any of it. v2.8 surfaces it.

- **`src/v2/Help.tsx`** — a small **(i)** beside a field. **Owner decision:** all teaching lives
  behind the (i) — **click to open** the inline `[I]`, **▾ Tell me more** for the `[E]` (and the
  `[X]` example once authored), ✕ / click-away / Esc to close. No Full/Brief mode; identical on
  mouse and touch (chosen from a 4-option affordance gallery — Option B). Reuses the pure
  `helpEntry` loader; renders **nothing** where no prose exists. (+ 3 unit tests.)
- **Wired across the lenses** — Set-up (reference/genre/duration/group/series/translations), Read,
  COMA, Theme & aim (theme/author-aim/group-aim/know-feel-do/christ-route/prayer + the ★★
  *faithfulness* reassurance by the heading), Build (the ★★ *expected-answer* rule + sequence),
  Check (the audit + coverage), and Home. Credits travel with the text (e.g. christ-route's
  "— after Goldsworthy").
- **v2 About page** (`#/about`, `src/v2/pages/About.tsx`) renders the authored `attribution.page`
  content, linked from the reader top bar + Home. It frames credit exactly per the owner rule:
  **only COMA is "verbatim, by permission"**; Goldsworthy is "paraphrased and cited, never quoted";
  method + code are "the tool's own." The `[X]` worked examples remain the owner's to write.

Verified live (Playwright MCP): the Theme (i) opens the real `[I]` prose, "Tell me more" reveals the
`[E]`, ✕/Esc/click-away close it; the About page renders the credits + further-reading with the
verbatim-only-for-COMA framing; 0 console errors bar the known Router warnings. Two new e2e. Design
mockups: `docs/mockups/v2-teaching-help.html` + `v2-help-affordances.html`. Gate green:
`typecheck && lint && test (298) && build && test:e2e (16)`.

### 2026-08-10 — Parallel translations (switcher + side-by-side)

**Shipped.** The §2 "parallel translations" decision is now real, resolving §3 Q3.

- **Top-bar switcher** (`TranslationControls`) — the static translation chip became a menu: switch
  the **primary**, **＋ add** another bundled translation for this passage (reusing the Set-up import
  path), **remove** a comparison one.
- **⊕ Parallel toggle** — default **single**; on, it pops a second **verse-aligned** column via the
  tested `alignTranslations` engine. New `ParallelCanvas` renders the two columns; the **primary**
  (left) carries `data-v` + the selection + the annotation tones (it's the source of truth), the
  **secondary** is read-only reference. A secondary picker appears only when >2 are loaded (pasted).
- **Cross-column hover** — hovering a verse in either column (or a margin card) lights it in **both**
  (`data-v` ‖ `data-vsec`, keyed by verse id).
- **Switch = swap, not drop.** Fixed the reader's `switchTranslation`: M3's `setPrimary` *drops* the
  old primary, which is wrong once several translations are loaded — it now just re-designates the
  primary, keeping every translation, so parallel **swaps columns** and stays on.
- **Narrow screens stack** — the grid collapses to one column below `sm`, each cell labelled with its
  translation (no horizontal scroll).
- **Refactor:** the drag-to-range / ⌘-disjoint / ⇧-extend / click selection was extracted from
  `ReaderCanvas` into a shared `useDragSelection` hook, now used by both canvases.

Verified live (Playwright MCP) on Luke 1:5–25: added ASV, popped Parallel (WEBBE ‖ ASV, the
Judea/Judæa · division/course · Elizabeth/Elisabeth contrasts visible), cross-column hover lit both
sides, selection + action bar worked on the primary, switching primary swapped columns while keeping
both, and the narrow layout stacked with per-cell labels; 0 console errors bar the known Router
warnings. New e2e covers add → parallel → cross-column hover → swap. Design mockup:
`docs/mockups/v2-parallel-translations.html`. Gate: `typecheck && lint && test (295) && build &&
test:e2e (14)`.

### 2026-08-10 — v2.5 reading modes (Manuscript toggle)

**Shipped.** A global **Formatted ↔ Manuscript** reading toggle (a segmented control in the leaf
head, present across Read/Map/COMA, persisted in `localStorage` like the ink-saver toggle).

- **Manuscript = flatten everything, keep verse numbers.** Owner steer: keep it dead simple — the
  whole passage becomes one continuous flow with verse numbers inline and nothing else (no poetry
  indents, editorial headings, paragraph breaks, or section bands). Implemented as a **pure
  `manuscriptModel(model)`** transform (+ 3 tests): merges every paragraph across sections into one
  prose band, flattens poetry lines to running prose (joined with a space; red-letter preserved),
  drops editorial headings + blank spacers, keeps Psalm superscriptions (they're scripture). It's
  **display-only** — sections, annotations, and verse anchors are untouched, and the same verse ids
  flow through, so selection + two-way hover keep working. The canvas hides the section chrome
  (band headers + divide handles) when manuscript.
- **Section pre-suggestion: dropped (owner).** The roadmap had also filed "pre-suggest section
  breaks from the translation's paragraphs" under v2.5; the owner cut it — *making sections is part
  of the exegetical work*, so the tool must not pre-do it (Inviolable rule 1). Not built.

Verified live (Playwright MCP): Luke 1:5–25 (prose) flattens from 6 paragraphs to one flow with all
21 verse numbers and no section header; Psalm 23 (poetry) flattens to running prose keeping the
superscription; the choice **persists across a full reload**; Formatted round-trips back to the
paragraphs/section header; annotations (a note + its promoted support passage) survive both modes;
0 console errors bar the known Router warnings. New e2e covers flatten + persist + round-trip. Gate
green: `typecheck && lint && test (295) && build && test:e2e (13)`.

### 2026-08-10 — Inline `@`-mention cross-references (the reference paradigm, built)

**Shipped.** The §2 "reference paradigm" is now real: a reference to **another** passage lives
*inside a note's content* as an inline `@Malachi 4:5-6` chip you can peek and **promote to a Support
passage**. Owner decision this session: **two referencing gestures, not three** — *anchor* a
Note/Question/Mark to the main passage, or `@`-mention another passage in a note. The standalone
"Cross-reference" gesture was retired.

- **Pure `v2/reader/mentions.ts` (+ 11 tests).** `parseMentions(text)` splits a note's plain text
  into text/mention segments, a mention being an `@` + the **longest prefix `bcv_parser` accepts**
  (so `@1 Corinthians 15:3-4` and `@Mal 4:5` work; `jack@busable.com` and a bare `@Malachi` stay
  literal). Text stays a plain string — **no schema change**.
- **`MentionEditor.tsx` — the delicate bit, kept honest.** A contenteditable note surface that
  renders each `@ref` as an atomic chip. The DOM is rebuilt **only when the chip structure changes**
  (a signature diff) — ordinary typing leaves the DOM alone, so the caret never jumps; when a chip
  does form/dissolve we rebuild once and restore the caret by character offset. Verified live by
  typing char-by-char: the chip formed mid-sentence and the text *after* it stayed intact.
- **`MentionPeek.tsx`.** Hover/click a chip → a popover that loads the referenced passage in the
  primary translation via `loadReading` (offline-safe, cached); a **⤴ Promote** button.
- **Promote → Support passage.** `ReaderShell.onPromoteMention` adds a `cross-ref` annotation
  anchored to the host note's verses (de-duped by OSIS; the chip then mutes). `projectForExport`
  already maps that to a v1 support passage, so it prints — a **handout background box** (with the
  fetched passage text), and the **leader's notes** when a question shares its verses. No export
  changes.
- **Retired the standalone gesture.** The action bar is now Note / Question / Mark confusing (no
  "↗ Cross-reference"); the palette's `insert-xref` action + item are gone (an out-of-passage
  reference yields nothing there — it's an `@`-mention). `MentionEditor` is used for **notes only**
  (a question's text is the exported deliverable, so a raw `@ref` must never leak into it).

Verified live (Playwright MCP) end-to-end on a real Luke 1:5–25 / WEBBE study: typed
`@Malachi 4:5-6` in a note on v17 → inline chip → peek loaded Malachi 4:5–6 → promote made a Support
passage (chip muted, de-duped) → reloaded and the chip re-rendered from stored text with its promoted
state → the handout printed the Malachi background box with the fetched text; 0 console errors bar
the known Router warnings. New e2e covers the whole loop. Design mockup that drove the "inline chip"
choice: `docs/mockups/v2-xref-mentions.html`. Gate green: `typecheck && lint && test (292) && build &&
test:e2e (12)`.

### 2026-08-10 — Read + COMA lenses (v2.6 complete)

**Shipped.** The two remaining phase lenses, closing out v2.6 — all seven lenses now render live over
the one canvas.

- **Read lens (SPEC Phase 2).** A margin panel (`src/v2/reader/ReadPanel.tsx`) for the pray-and-read
  discipline paper can't enforce: read slowly, prayerfully, **more than once** before analysing. A
  running count (`study.read.count`, tapped via the store's `incrementRead`, autosaved with the body)
  makes it concrete; a genre-specific `readingTipForGenre` nudges *how* to read. The centre shows the
  passage read-only (no divide/mark affordances — the text stays put, the overlay changes).
- **COMA lens (SPEC Phase 4).** A margin panel (`src/v2/reader/ComaPanel.tsx`) of the guided
  **Context · Observation · Meaning · Application** prompts for the study's genre, via
  `comaSetForGenre()` (David Helm's questions, **verbatim by permission**). The required Helm
  attribution renders in-panel from `comaContent().attribution` because COMA content appears here
  (**inviolable rule 8**); genre-unset / no-set states degrade to a quiet notice. The tool prompts,
  never writes the answers (**rule 1**) — you jot what you see as a note/question in the Map lens.
- **Wiring.** `ReaderShell` branches `read`/`coma` to these panels (centre = `ReaderCanvas` read-only,
  margin = the panel); the old `LIVE_LENSES` placeholder is gone (every lens is live now).

Verified live (Playwright MCP) on a real Luke 1:5–25 study (genre inferred → *gospels-acts*): the Read
counter increments (0 → 2) and **survives a reload**, with the gospels-acts reading tip; the COMA lens
shows all four groups of verbatim prompts **plus** the Helm attribution line; 0 console errors bar the
known Router future-flag warnings. Added a new e2e (`v2 Read + COMA lenses…`). Full gate green:
`typecheck && lint && test (281) && build && test:e2e (11)`.

### 2026-08-07 — v2.1 + v2.2 (this session)

**Shipped.** The v2 app is a **separate app at the root** (`/`); the frozen v1 workbook renders
under `/v1/`. Both share the store, autosave, theme, and PWA — v2.2 changes no schema, so a
study opens in either app.

- **v2.1 — design system + shell.** The mockup's *leaf/desk* palette, *lapis*/*rubric* accents,
  `--leaf-shadow`/`--leaf-radius`, and the three font roles (`font-scripture` · `font-mono` ·
  `font-sans`) are CSS vars in `index.css` (under the existing `.light`/`.dark`) exposed to
  Tailwind (`bg-leaf`, `text-ink`, `text-lapis`, `border-line`, `shadow-leaf`, `animate-verse-flash`…).
  v1 tokens untouched. The shell (`src/v2/ReaderShell.tsx`) matches the mockup: top bar, lens
  rail, central leaf, right margin, command bar, day/night. `/styleguide` is a living reference.
- **v2.2 — reader / Map lens.** Load-bearing logic is pure + unit-tested: `v2/reader/selection.ts`
  (drag-range · ⌘-disjoint · ⇧-extend · click-to-deselect + a selection→reference formatter) and
  `v2/reader/model.ts` (`buildReaderModel` → verse-driven render grouped into named section bands,
  splitting a prose paragraph at any-verse boundaries, preserving poetry/superscriptions/gaps).
  `ReaderCanvas` is a thin component over them; sectioning is wired to the reused `src/lib/map.ts`;
  marks persist through the store. Verified live (Playwright): real Luke 1:5–25 and Psalm 23,
  selection + any-verse divide/merge/rename + marks, **reload persistence**, day + night, 0 console
  errors bar the known Router future-flag warnings. `npm run typecheck && lint && test (255) &&
  build && test:e2e (4)` all green.

**Decisions taken (owner, this session).**
1. **v1↔v2 = two apps.** v1 under `/v1/`, v2 at `/`. Implemented as a **dual-router** in
   `App.tsx`: one `<HashRouter>` per app, chosen by whether the hash starts with `/v1`; v1 mounts
   **unchanged** under `basename="/v1"` (every existing v1 `<Link>` resolves to `#/v1/…` with no
   edits). Boundary crossings use plain `<a href="#/…">` anchors (they fire `hashchange`, which
   re-selects the router). A one-line "archived v1 → current" banner was added to v1's `Layout`.
2. **Any-verse sectioning now** (pulled forward from v2.5). The Manuscript/flatten toggle + break
   pre-suggestion stay in v2.5.
3. **Action bar: Mark wired; Note/Question/Cross-reference deferred to v2.4** (they need the
   annotation-model restructure — wiring them into the v1 schema now would only create debt).

**Deviations / notes.**
- **Set-up lens is minimal** (reference + primary translation + optional title) so v2 stands alone
  now that v1's Phase-1 lives under `/v1/`. The full Set-up (genre, group, duration, comparison
  translations, paste) is v2.6. Added an optional `setup.title` (additive; v1 ignores it).
- Marks are still the v1 single-verse model; "Mark confusing" over a multi-verse selection creates
  one whole-verse mark per selected verse. The 3-kind annotation collapse is v2.4.
- Non-live lenses (COMA/Theme/Build/Check) render the canvas read-only with a "coming (v2.6)" note,
  demonstrating "lenses over one canvas — the text stays put; the overlay changes."

**Polish (same session, owner feedback).**
- Set-up lens reordered: reference → translation → **Load** (Enter still loads).
- **Poetry-in-prose render fixed** — the Magnificat (Luke 1:46–55 is poetry inside a prose block)
  was stranding verse numbers mid-line; restored v1's leading-break rule (break before a poetry
  line except a group's first line; number leads the first rendered line).
- The **leaf background now wraps all content** — the stage no longer stretches the leaf to the
  viewport height (`items-start`), so its background covers the whole passage.
- **Divide affordance made discoverable** — bigger hit area + faint `＋` markers that appear
  whenever the cursor is over the passage (`.qth-scripture:hover`), brightening on direct hover.
- **Mark confusing now takes a note** — added additive-optional `Mark.note`; the margin card is an
  editable, auto-focused textarea (verse text shown as quiet context), persisted and reload-safe.

**Polish round 2 (owner feedback).**
- **Poetry-in-prose render rebuilt** — the Benedictus/Magnificat verses were wrapped in
  `inline-block`s, so a long poetry line dropped to the next row and stranded its number, and
  the highlight painted as broken boxes. Now any verse containing poetry renders as **block
  lines** (each wraps + hangs its indent, number leads the first line) and its highlight is one
  clean box; pure-prose verses stay inline (`box-decoration-break: clone` so wrapped highlights
  are clean too).
- **Anchored ≠ hover** — a marked verse now rests at a warm **rubric tint**; hover/selection stay
  **lapis**. (Verified: marked bg `rgba(166,50,30,.1)`, hover bg `rgba(40,70,138,.1)`.)
- **Multi-verse mark = one card** — a multi-verse selection makes one shared ticket
  (additive `Mark.verseIds`), with a combined anchor label + context; two-way hover lights all its
  verses.
- **Divide affordance** — shown only for the **hovered verse** (before + after), not the whole
  passage. Poetry: a full-width bar in the gap; prose: a **zero-width, overlaid ＋** so revealing
  it never shifts the text. Clicking a divide **focuses the new section's name input**.
- **Section headers** get more space above them.
- **Jump flash** — starts only **after** the scroll settles, runs a slower (2s) rubric-ring fade
  that ends on the verse's resting tint (no transparent gap, no snap to blue).

**Set-up engine — increment 1 (owner-requested, done).** The Set-up lens is now the owner's
flow: a **reference input with book completion** + a **live normalised-ref validator** (`✓ Detected
Luke 1:5–25 · Luke.1.5-Luke.1.25`), **import one or more bundled translations** for it, a loaded
list with verse counts, a **radio primary picker** (`setPrimary` — the top-bar chip follows),
remove-secondary, change-passage, optional title, and a **Start mapping →**. Reuses `parseReference`
+ `loadReading` + the M3 passage builders. The hover two-way link now reads **rubric** (a marked
verse's card hover borders the verse in bolder red, not blue).

**Set-up engine — increment 2: paste-and-clean (done).** "+ Paste your own" opens a v2-styled
review panel (`src/v2/lenses/PastePanel.tsx`) that reuses the pure pipeline wholesale: paste raw →
`analysePaste` (auto-detects reference + translation, strips app chrome, flags uncertain lines) →
an **editable segment review** (line type · verse number · poetry indent · drop) with a **live
preview** → `assembleParsedText` (+ `reversifyToKjv` for the rare foreign-numbered text) → accept.
It adds the pasted text (`source:'pasted'`) to the passage with the same first-is-primary rule as
bundled import; a paste while a passage exists locks to that reference and joins as a comparison.
Verified live end-to-end on a real BibleGateway Psalm 23 (ASV) paste — it renders as poetry in the
Map lens. (App is static/offline, so paste is the only route for non-bundled text — no
BibleGateway/YouVersion API.)

**Annotation layer (v2.4, done).** One unified `study.annotations` surface (a flat union — Note /
Question / Cross-reference, with `verseIds:[]` = a floating study-level note), replacing v2.2's
marks (clean break — old marks don't carry forward). All four action-bar kinds are wired:
**Note**, **Question** (with an **expected-answer** field + a *needs-answer → ready* indicator —
the SPEC 6e hard block signalled; promotion itself is Build/v2.6), **Mark confusing** (a note
flagged confusing), **Cross-reference** (a reference to another passage + a return-question).
Margin cards are editable in place, in per-kind accents (confusing = rubric, question = amber,
note/cross-ref = lapis); verses tint in their annotation's tone and **two-way hover** lights in
that tone. A **Study notes** area holds floating notes. Pure `v2/annotations.ts` (+ tests) owns
the tone/priority/logic. Verified live (all four kinds + floating, tones, hover, ready-flip,
reload) and by a new e2e.

**The `/` command palette (v2.3, done).** A keyboard-first palette over `bcv_parser` + the bundled
book list, opened by `/` anywhere (or the command bar). It resolves the query into: **jump** to a
verse (`:20`) or a reference already in the passage; **insert a cross-reference** to another passage
(→ a cross-ref annotation, anchored to the selection or floating); **switch** the primary
translation (among those loaded); **create** a note/question/mark on the current selection; **go
to** a lens; and **book-name completion**. Pure `v2/reader/paletteItems.ts` (+ tests) owns the
parsing; a thin dialog with `↑ ↓ / ↵ / esc` renders it. Verified live (all actions, global `/`,
0 console errors) + a new e2e.

**Build lens (v2.6, done).** The question annotations as the **running order** — the sequence that
exports. `study.runningOrder` (question-annotation ids) is the source of truth once touched;
anything unordered appends in verse order, so the default is pure verse order. Reorder by
drag-and-drop or ↑/↓; filter by COMA type; set each question's type + expected answer inline (the
SPEC 6e readiness — *needs answer → ready*); jump back to a question's verses (→ Map); delete.
Pure `v2/build.ts` (+ tests). Verified live (verse-order default, reorder + persist, type, ready
flip, jump) + a new e2e.

**Exports (v2.7, done).** The full loop now closes: reference → mark up → questions → order →
**two documents**. A **Check lens** is the export hub (a readiness summary + the SPEC-6e warning +
four actions). A pure `projectForExport(study)` maps the v2 `annotations` + `runningOrder` onto a
v1-shaped `build` (question annotations → ordered `build.questions`; cross-refs → support passages
attached to the question at their verses; an optional study title → the heading), so the **entire
tested v1 export pipeline** (`handoutModel`/`leaderModel` → markdown + the print components) is
reused unchanged. Verified live: the participant **handout** (passage + numbered questions + the
copyright, no answers) and the **leader's notes** (running order with type/answer/anchor, drop
order, copyright + the COMA/method attributions — inviolable rule 8). `.md` downloads for both.

**Completing the study (done).** Three landed together so a real study is complete end to end:
- **Fuller Set-up** — genre (inferred, editable), group composition, duration, series note, intro
  (the intro prints on the handout; duration + group drive the leader's timing + the gospel-plain
  check).
- **Theme & aim lens** — theme, author's aim, group aim, know/feel/do, the route to Christ, and a
  prayer point (new `study.prayerPoint`). These flow into the leader's notes; prayer prints on both.
- **Check / audit** — the tested v1 `auditResults` + `coverageMap` run on the *projected* study, so
  all 11 SPEC-7 checks + per-section coverage (with tagging) compute from the v2 study; nothing
  blocks. The Build lens gained per-question **load-bearing / aim / gospel-plain**, so those checks
  are satisfiable and the leader's notes carry the metadata.

Verified live: theme/aim + know-feel-do + Christ route + prayer in the leader; intro on the handout;
duration → the timing estimate; group=mixed → the gospel-plain check; the audit reading "6 met · 4
need a look" from real study state.

**Print restyle (done).** The documents render in the v2 language — **white page always** (ink-safe,
theme-independent), Scripture serif, mono labels/anchors, hairline rules, no filled boxes. A per-print
**Ink-saver / Colour** toggle (persisted; default ink-saver) flips one lapis accent (verse numbers,
overlines, question numbers) to ink, so the user decides colour-vs-economy; preview and print match.
`src/v2/print/{PrintShell,PrintPassage,HandoutDoc,LeaderDoc}` + the `.qth-doc` CSS scope; v1's print
components stay frozen and are removed with the rest of v1.

**Next up.** *(Read + COMA, the inline `@`-mention cross-references, v2.5 reading modes, parallel
translations, and v2.8 teaching help + attribution all landed 2026-08-10 — see the top of this log.)*
(a) **Remove the v1 crib** — v2 is at parity; delete the frozen v1 source + its superseded print
components. (b) Owner authorship: the `[X]` worked examples (the disclosure is wired). (c) Polish
deferrals: BSB edition; a mobile-responsive shell (the lens rail + margin aren't phone-friendly yet).

---

## 6. Carries over unchanged (do not rebuild)

The v1 **pure libraries** are the load-bearing logic and survive the re-skin: `src/lib/verse/*`
(IDs, ranges, `bcv_parser`), `src/lib/map.ts` (sections, marks, `reconcileMarks`),
`src/lib/questions.ts` (budget, the expected-answer hard block, warnings), `src/lib/audit.ts`
(coverage, the 11 checks), `src/lib/export/*` (handout defined-by-exclusion, leader, markdown),
`src/lib/recycle.ts`, the store, storage/hydrate, the paste normaliser, and the compare/
versification libs. v2 is a new **shell** over these.

## 7. Deferred / ROADMAP (unchanged from v1)

Talk mode; series management; BSB edition (owner to pin the berean.bible USFM); footnote /
cross-ref / rich passage rendering; multi-genre passages; translation-comparison notes in the
leader's notes (SPEC §7 gap); a quarantine-recovery UI. The two owner on-device paste
confirmations remain owed.
