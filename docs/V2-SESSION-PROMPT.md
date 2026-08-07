# V2 Session Prompt — build "Quick to Hear" v2 (the text-central overhaul)

> Paste this into a fresh Claude Code session to start (or continue) the v2 build. It is the
> handoff. Read the docs it points to before writing code.

You are building **v2** of "Quick to Hear" — a ground-up UI/UX overhaul of a free, static,
account-less browser workbook for preparing a Bible study. **v1 (Stages 0–10) is complete and
shipped on `main`; it is now frozen as a reference, not a product to maintain.**

## The decision that frames everything (owner, 2026-08-07)

- **There are no users.** So: **clean break.** v1 is **deprecated/frozen** — do NOT keep it
  shippable, do NOT migrate its data. **Studies are non-upgradable** — no `hydrate`/migration
  from v1 docs; evolve the schema freely.
- v2 is an **overhaul of the shell + how the seven phases are presented**, NOT new domain logic.
  **Reuse the v1 pure libraries** — they are the load-bearing logic and carry over.
- **Keep the v1 source in-tree as a crib** until v2 reaches parity; then it gets removed. Don't
  delete v1 yet — read it, copy/adapt from it.

## Start here (read in this order)

1. **`docs/ROADMAP-v2.md`** — the thesis, the **locked decisions** (§2), the open questions (§3),
   and the build order v2.0–v2.8 (§4). **Authoritative.** Read it fully.
2. **`docs/mockups/v2-reader.html`** — the clickable prototype. It IS the interaction model and
   visual language to match: passage-as-canvas, lenses over one canvas, drag-to-range selection,
   sectioning as named bands, the `/` command palette, right-margin annotation cards, day/night.
   Serve it over http to view (`python3 -m http.server` in `docs/mockups/`; `file://` is blocked).
3. **`CLAUDE.md`** — inviolable rules, stack, licensing boundary, commit/branch policy. **All
   still apply.**
4. **`docs/SPEC.md`** — the seven phases. **Behaviour is unchanged**; only the shell changes.
5. **v1 as reference:** `src/lib/**` (the pure libs to reuse), `src/pages/Phase*.tsx` (what each
   phase does), `src/types/study.ts` (the model to evolve), `docs/PROGRESS.md` (the v1 build log).

## The thesis (ROADMAP-v2 §1)

**The passage is the canvas** — one central, always-visible text; every section band, mark, note,
question, cross-reference, and comment is an **annotation anchored to a verse selection** layered
over it. The seven phases become **lenses** over that one canvas (the discipline stays; the shell
changes). `/` is the universal keyboard-first primitive for referencing and every insert/action.
Visual: a warm "leaf on a desk" surface, **lapis** accent, Scripture in a humanist serif, every
anchor/command in monospace — *a manuscript that answers to a command line*.

## Locked decisions — do NOT re-litigate (ROADMAP-v2 §2)

Lenses over one canvas · right-margin annotation cards · universal `/` command · sectioning as
named bands available from load · **weighting lives in the Build lens, not Map** · selection =
drag-to-range + ⌘-disjoint + ⌘-toggle + click-again-to-deselect (native highlight suppressed) ·
two-way verse↔note hover · select-a-section stores the **verse range as a snapshot** (not a live
section link). Plus:

- **Reference paradigm:** annotations anchor to **main-passage verses** (first-class); a reference
  to another passage is an **`@`-mention inside a note's content** (a chip), not a separate
  anchored object. Click a note's anchor → jump+flash its verses; hover an `@`ref → peek; click →
  open. Promote an `@`-mention → a **Support passage** (v1 model + return-question).
- **Annotation kinds → three:** **Note** (mark/comment are notes with a flag; optional COMA type),
  **Question** (keeps the expected-answer hard block), **Cross-reference**.
- **Floating/study-level notes** allowed (theme, aim, prayer, notes-to-self) — unanchored, own area.
- **Build-lens running-order panel:** ordered questions with **filter by type + drag-drop reorder
  + delete**; the running order is what exports.
- **Parallel translations:** one primary central; secondaries as tabs, optional side-by-side,
  default single (reuse the M3 compare lib).
- **Optional study title** (defaults to reference; handout heading).
- **The one hard block stays** (SPEC 6e): a question cannot be promoted without an expected answer.
- **Form state = controlled inputs + Zustand store, NOT react-hook-form** (owner-confirmed).

## Do — the first chunk (ROADMAP-v2 §4: v2.1 → v2.2)

**v2.1 — design system + shell.** Extract the mockup's tokens into the Tailwind theme (the leaf/
desk palette, lapis/rubric accents, the serif-Scripture / mono-tooling / system-UI pairing, the
type scale) + a small styleguide page. Stand up the v2 app shell: top bar, lens rail, central
leaf, right margin, bottom command bar, day/night — matching the mockup.

**v2.2 — the reader / Map lens, for real.** A route that renders the **real primary passage from
the store** (not hand-typed text) with: drag-selection + ⌘-disjoint + click-to-deselect, the
floating action bar, and sectioning (named bands, divide/merge) wired to the reused `src/lib/map.ts`,
**persisting marks + sections** to the store. Prove it against real **Luke 1:5–25** (narrative +
dialogue), a **Psalm** (poetry lines/gaps), and **reload persistence**.

House pattern (keep it): **load-bearing logic stays a pure lib with unit tests; the page is a thin
component over it.** Reuse the v1 pure libs directly (`verse/`, `map.ts`, `questions.ts`,
`audit.ts`, `export/`, `recycle.ts`, `paste/`, `compare.ts`); adapt the `Study` model where v2
adds things (floating notes, `@`-mentions, study title, the 3-kind annotation collapse) — no
migration burden, so change it freely.

Build one slice at a time, each **testable and committable**.

## Constraints / house rules (unchanged — CLAUDE.md)

- **Inviolable rules:** the passage is the subject (nothing out-competes it visually); **never
  generate the user's content**; the one hard block (6e); recycle forward with provenance;
  guidance at the moment of need; work is never lost (autosave + export; honest about
  browser-only limits); **shipped Bibles are public-domain only** (WEBBE + ASV); **COMA
  attribution renders wherever COMA content appears.**
- **Attribution wording (owner):** only the **COMA sets (David Helm)** may be called "reproduced
  verbatim"; frame everything else as "after / informed by," **never "copied."**
- **Commits:** **NEVER add Claude/Anthropic co-authorship** (no `Co-Authored-By: Claude`, ever; a
  `Claude-Session:` link is fine). **Work straight to `main` and push** — drive your own commits;
  don't wait to be asked. Keep commits scoped.
- **Licensing boundary:** `/` code is MIT; `/content` (help prose + method data) is CC BY-SA.

## Verify (acceptance — do it, don't assume)

`npm run typecheck && npm run lint && npm test && npm run build` (+ `npm run test:e2e`) all green;
**0 console errors** bar the known React-Router future-flag warnings. **Drive the new reader route
in a real browser** (Playwright MCP): confirm the real passage renders (poetry/gaps included),
selection + sectioning work and **persist across a reload**, and day/night both look right.

## Hand off

Update `docs/ROADMAP-v2.md` (tick v2.1/v2.2 when their goals hold; append a short progress/decision
note; record deviations). Keep the roadmap accurate enough that the next fresh session continues
cleanly. Commit AND push to `main`.

## Owner decisions already made — do NOT re-ask

(a) v1 deprecated/frozen; **studies non-upgradable; clean break** (no migration). (b) All the
locked decisions above. (c) Form state = controlled inputs + Zustand store (not react-hook-form).
(d) Teaching content + the attribution "verbatim only for COMA" sweep are **deferred to v2.8**
(after the UI settles — we'll know the real gaps then). (e) BSB edition still deferred (owner to
pin the berean.bible USFM edition). (f) Reuse the M3 `reversifyToKjv` converter (not the reversify
npm) if versification comes up.

**Stop and ask the owner only if a locked decision looks wrong, or a phase can't meet its goal.**
Otherwise, build.
