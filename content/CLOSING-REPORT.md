# CLOSING REPORT — teaching-text authoring (internal)

> Working note. **Not shipped to users.** Deliverable 7. What ships uncited, what is cited, what
> is flagged, and what the owner still needs to write. Snapshot at the end of the authoring pass.

## Status: authoring complete

Every place the tool needs teaching text is now written, except the two items that are the
owner's by design (the verbatim COMA sets and the worked example). Counts:

- **Help (`content/help/**/*.md`): 67 files, all authored.** 5 cited, 62 uncited.
- **Method (`content/method/*.yaml`): all items authored except `coma.yaml`.**
  `traps.yaml` cited; `genres` (6), `formulas` (20), `litmus` (9), `stuck-helpers` (5),
  `warnings` (3), `audit` (11) all uncited; `coma.yaml` is `todo` (owner's manual task);
  `translations.yaml` (3 flagged) is dev/build config, not teaching text.

Delivered in 19 affirmed batches, each falsified before shipping, committed to `teaching` and
merged to `main` (content-only merges; the parallel dev WIP was verified byte-identical before and
after every merge).

## What ships CITED (6 items) — only what was read this session, or held by permission

| Item | Source |
|---|---|
| `coma.yaml` (attribution string; renders wherever COMA shows) | David Helm, *One-to-One Bible Reading* — **verbatim by permission** (Matthias Media / HTC) |
| `p4.overview` | COMA's four categories, after Helm (copying sheets, read this session) |
| `traps.yaml` | Goldsworthy, *Preaching the Whole Bible* (Intro, chs. 1-2) — trap concept |
| `p5.christ-route` | Goldsworthy, ch. 1 (p. 4) — the assume/skip point |
| `p5.credits` | Goldsworthy — the Christ test and the idea of the traps |
| `home.philosophy` | Goldsworthy, ch. 1 (p. 4) — the inductive-guide self-criticism |
| `attribution.page` | Credits: Helm (permission) + Goldsworthy (read this session) |

Every citation is paraphrase plus, at most, a short phrase ("good as far as it goes"); no extended
quotation (Eerdmans). COMA is reproduced verbatim under its permission. The two authors actually
read this session are **Helm** (COMA sheets) and **Goldsworthy** (ch. 1); everyone else in Further
Reading is a recommendation, not a source of the tool's content.

## What ships UNCITED — the default, and correct

The large majority of the teaching text is the project's own plain teaching prose: no attribution,
no hedging ("as some put it", "following X"). This is deliberate and right per the citation policy.
It includes all the tool-mechanics guidance (Phases 1-2, 6-7 fields), the question formulas, the
litmus tests, the stuck-helpers, the soft warnings, the audit lines, and the genre one-liners.

**ACS material ships uncited by the owner's decision** (good content, no church named), even though
ACS is held. Its lineage is recorded in the flags for the record only.

## What is FLAGGED for a later sweep

~60 items carry an actionable `flag:` naming the held-back work and what to check. Full worklist in
**`FLAG-SUMMARY.md`**, grouped by source. The high-value targets, in rough priority:

1. **Fee & Stuart, *How to Read the Bible for All Its Worth*** — genre, literary unit, translations,
   observation/meaning technique (the biggest cluster).
2. **Sweatman, *Writing a Small Group Study*** — question craft (the most on-point book).
3. ***Growth Groups* topics 4 (p. 31) and 6 (p. 53)** — budget numbers and question craft.
4. **Robinson, *Biblical Preaching*** — the big idea (idea + purpose) for theme/aim.
5. **Chapell, *Christ-Centered Preaching*** — the Fallen Condition Focus.
6. **Goldsworthy later chapters / *Gospel and Kingdom*** — the connection-route list, allegory,
   Christless preaching.
7. **Jensen & Grimmond, *The Archer and the Arrow*** — theme-and-aim lineage (check first).

## What the OWNER still needs to write or do

1. **Transcribe `coma.yaml`** — the six genre COMA question sets, verbatim from the source, then set
   `state: cited`. Step-by-step guide + per-genre item counts in **`COMA-TRANSCRIPTION.md`**. Until
   then, a user-visible placeholder marks the grid as not-yet-real (the app must render the
   `placeholder` field while state is not `cited`).
2. **The worked example** (Luke 1:39-80, or whichever passage becomes the demo). The teaching-text
   pass does **not** write this: it is passage interpretation, which is the owner's. When the app
   is ready for it, scaffold empty labelled `[X]` slots only and let the owner fill every answer.
3. **Curate the Further Reading list** on `attribution.page` (add or cut; the ~11 shown are the
   task-relevant subset of the owner's wider list, preserved in `INSPIRATION.md`).
4. **Optional: run the citation sweep** if any held-back source is obtained (see `FLAG-SUMMARY.md`).

## Notes for the record

- **No em-dashes in shipped prose**, except the two sanctioned "— after Goldsworthy / Helm" credits
  (`home.philosophy`, `p4.overview`). Verified per batch.
- **No Scripture interpreted** anywhere in the authored text; the Christ-connection and theology
  stems are empty scaffolds for the user, and the doctrinal rationale in `p2.pray` / `home.philosophy`
  is general, not passage-specific.
- **Dev WIP safe:** every merge to `main` touched only `content/`; the sibling worktree's
  uncommitted `src/` work was byte-identical before and after each merge.
- **Internal docs (not shipped):** `HANDOVER.md`, `INSPIRATION.md`, `COMA-TRANSCRIPTION.md`,
  `DEFERRALS.md`, `FLAG-SUMMARY.md`, and this file.
