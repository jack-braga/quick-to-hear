# `content/` — teaching text & method data (CC BY-SA)

This directory holds **all the tool's teaching content**, separate from code so it can
be edited without touching TypeScript, and separately licensed (**CC BY-SA 4.0** — see
`LICENSE`). Code is MIT; content is CC BY-SA; the boundary is this directory.

> **Status:** scaffolding only. The prose is intentionally **empty** — it is authored
> later by the teaching-text agent (see `docs/TEACHING-TEXT-AGENT-PROMPT.md`) or by
> hand. The inventory of what goes where is `docs/TEACHING-TEXT.md`.

## Layout

```
content/
  LICENSE                     # CC BY-SA 4.0 + the COMA verbatim-by-permission notice
  help/                       # prose guidance, one Markdown file per key
    global/  phase1/ … phase7/
  method/                     # structured method data (YAML), rendered programmatically
    coma.yaml                 # verbatim Helm COMA sets, 6 genres  (attribution REQUIRED)
    formulas.yaml             # ~20 question-formula stems
    litmus.yaml               # 5 theme tests + 4 per-type question tests
    traps.yaml                # the 4 Christ-connection traps
    stuck-helpers.yaml        # 5 Phase-5 "stuck" helpers
    genres.yaml               # 6 genres: label + reading tip + which COMA set
    warnings.yaml             # 3 soft question-warning messages
    audit.yaml                # 11 Phase-7 audit checks
    translations.yaml         # bundled translation ids → display name + copyright line
```

Help stubs are generated from the key list in `scripts/gen-help-stubs.sh` (re-run it
after adding keys; it never clobbers authored files).

## Help file format (`help/**/<key>.md`)

Frontmatter + one section per tier. The app loads by `key`, renders the tiers, and the
global guidance toggle collapses to `inline` only.

```markdown
---
key: p5.faithfulness
title: Faithfulness is not certainty
phase: 5
tiers: [inline, expandable]
state: todo        # see "State & flag policy" below
source:            # inline attribution string, ONLY when state: cited
flag:              # what would settle it + where to look, ONLY when state: flagged
---

<!-- inline -->
(one or two sentences, always visible)

<!-- expandable -->
(the fuller reasoning, behind "tell me more")
```

Tiers: `inline` (always shown), `expandable` (on request), `example` (worked example),
`page` (a full page, e.g. attribution). A key uses only the tiers in its frontmatter.

## State & flag policy (matches the teaching-text agent)

Every piece of content resolves to one **state**. This is where the agent's
CITED / UNCITED / FLAGGED outcome is recorded so it survives editing and can be listed
without a code search:

- `todo` — not yet written (the stub default).
- `cited` — verified against a source read this session; put the inline attribution in
  `source:`.
- `uncited` — ships as plain teaching text, **no attribution, no hedging**. `source:` empty.
- `flagged` — uncited, but a later sweep might settle it; put the actionable note in
  `flag:` ("if *Growth Groups* topic 6 becomes available, check pp. 53–56 …").

Governing rule (from the agent brief): **an uncited true statement is fine; a cited
false one is not.** When in doubt, don't cite. Never interpret Scripture as teaching —
passage-specific interpretation and worked examples come from the owner.

Method-data items (`method/*.yaml`) carry the same `state` / `source` / `flag` fields
per item, so the policy applies there too.

## COMA attribution (hard requirement)

`coma.yaml` holds text reproduced **verbatim by permission** from David Helm,
*One-to-One Bible Reading* (© Matthias Media & Holy Trinity Church, 2011). The
`attribution` string in that file **must render on screen wherever COMA content
appears** — not only on the attribution page. Do not let it drift from the data.

## Listing flags

Because `state`/`flag` live in frontmatter and YAML (not code comments), the flag
summary is a scan of these files — e.g. every `state: flagged` entry and its `flag:`
note. The teaching-text agent produces that summary as a deliverable.
