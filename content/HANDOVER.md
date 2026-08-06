# HANDOVER — Teaching-text authoring (Quick to Hear)

> Working handoff note. **Not shipped to users.** For a fresh Claude Code session
> continuing the teaching-text work. Snapshot as of 2026-08-06, after Batch 4.

## What this task is
Author the tool's teaching text (help prose + method data) under `content/`. Read
these first, in order:
1. `docs/TEACHING-TEXT-AGENT-PROMPT.md` — the full brief (the governing document).
2. `content/README.md` — the state/flag policy (cited / uncited / flagged).
3. `docs/TEACHING-TEXT.md` — the inventory (every key + what it should cover).
4. `docs/SPEC.md` — the seven-phase behaviour spec (its "Guidance:" lines are first drafts to polish).
5. `content/DEFERRALS.md` — deferred ideas, the sweep how-to, the held-sources list.
6. This file.

## Environment & git flow
- You are on branch `teaching` in a git worktree: `/Users/jack-braga/Documents/Projects/repos/quick-to-hear-teaching`.
- `main` is checked out in the SIBLING worktree `/Users/jack-braga/Documents/Projects/repos/quick-to-hear`, where an ACTIVE dev session is building the app (uncommitted WIP in `src/`). Do not disturb it.
- **Flow each batch:** author on `teaching` → `git add content/ && git commit` → `git push origin teaching` → merge into main from the sibling worktree:
  `git -C /Users/jack-braga/Documents/Projects/repos/quick-to-hear merge --no-ff teaching -m "..."` then `git -C /Users/jack-braga/Documents/Projects/repos/quick-to-hear push origin main`.
  The merge is content-only and disjoint from the dev WIP; snapshot `git -C <main> status --short` before/after and confirm it is byte-identical.
- **NEVER add Claude/Anthropic co-authorship to commits.** No `Co-Authored-By: Claude`. A `Claude-Session:` link line is fine.
- **Touch ONLY** `content/` (help + method), the attribution/further-reading content, `content/DEFERRALS.md`, and this file. Do NOT touch `src/`, `docs/`, or app config.

## The citation policy (do not break this)
- **CITED** only if you have READ the source **in your own session**. You have not read the PDFs yet. To cite anything, OPEN and READ the relevant PDF yourself. The Phase-B map below tells you where things are; it is NOT a substitute for reading. Recognising a title or recalling an argument is not reading.
- **UNCITED** = plain teaching text, no attribution, no hedging ("as some put it", "following X"). This is the default and correct for most of the tool.
- **FLAGGED** = uncited, plus a `flag:` note naming the likely work + what to check, as a shortcut for a later citation sweep. Record hypothesised sources even on uncited items, but only ACTIONABLE flags (name the work + what to check); say plainly when something is the project's own with nothing to chase.
- Governing rule: an uncited true statement is fine; a cited false one is not. When in doubt, do not cite.
- **Ship ACS material UNCITED** (owner's decision): good content, no church named.
- **Never interpret Scripture** as teaching. The worked example (Luke 1:39–80) is owner-supplied; scaffold empty `[X]` slots only, last, and let the owner fill the interpretation.

## Sources held (in `~/Downloads/quick-to-hear-docs/`)
| File | Held | Gives | Read yet? |
|---|---|---|---|
| `Preparing+a+Small+Group+Study+at+ACS+v4.pdf` | full (5pp) | study-prep disciplines; ACS Gospels/Acts COMA set (permission-labelled) | yes — ships uncited |
| `one-to-one-COMA.pdf` | full (21pp) | the six COMA genre sets, VERBATIM by permission (Matthias Media/HTC) | **NOT yet — read for Batch 5** |
| `PREACHING_THE_WHOLE_BIBLE_AS_CHRISTIAN_S.pdf` | part (intro, ch.1–2, start ch.3) | traps, Christ-route, gospel-before-law, the self-criticism | yes — Goldsworthy, cited where used |
| `growthGroups.pdf` | part (front, intro, topic 1) | Marshall goals, leader-as-teacher (home.philosophy) | yes |
| `trellisVine.pdf` | part (front, ch.1) | training / word-ministry rationale (home.philosophy) | **NOT yet — read when drafting home.philosophy** |
| `claims-to-vet.md`, `trusted-sources.md`, `bible-study-tool-flow-spec.md` | — | worklist + provenance + flow | as needed |

## Phase-B verification map (verified this session — but RE-READ before citing)
- **ACS §A** (movements-of-thought; "the big idea"; sketch answers; time per question; prioritise/drop; rephrase; rushing to "do" without "done" → moralism; application is corporate + think/speak/act/love; pray before and again after more specifically): ALL confirmed, near-verbatim. Ship UNCITED per owner.
- **Marshall §A** (train as Bible teachers/pastors not facilitators — broad goal 2; identify good/bad interpretive habits — specific goal 1; Christ-centred goals from Col 2:6-7): confirmed. Growth Groups is Matthias Media (citable where used).
- **Goldsworthy §A** (the predictable "Jesus bit", intro; moralising / pious examples + Clowney, ch.1 p.3; "how does this passage testify to Christ?", ch.2 close p.21; gospel-before-law / watch the "therefore" / "naked law", intro p.xiv; good exegesis without wider context → "law without any visible grace" / Eph 6:4, ch.2 p.20; "the whole Bible is the context of the text" / analogy of Scripture, ch.2 p.16): ALL confirmed. **The deliberate self-criticism: ch.1 p.4** ("Inductive Bible study books are a prime source of the problem… this method alone is insufficient… makes enormous assumptions about the ability of people to see how this portion of text actually fits into the total unity of Scripture… or else ignores the necessity to do so"; the phrase "good as far as it goes" is his). Eerdmans → paraphrase + short phrase only, no extended quotation.
- **Overreach findings:** (a) Marshall goal-1 is about the LEADER identifying habits, not "studies form good habits in the group" (that stronger claim is ACS, not Marshall). (b) The five-item Christ-connection list (promise/covenant/office/institution/unsolved problem) is the PROJECT'S OWN, not Goldsworthy's. (c) The four-trap TABLE and the check questions are the project's own; Allegory is NOT in the held Goldsworthy chapters (flagged). (d) Do not overstate the Christ-connection into "a full biblical-theology lecture every time" — Goldsworthy explicitly denies this (ch.2 p.16).
- **claims-to-vet §B** (Chapell FCF + "deadly be's"; Robinson big-idea definition; Lucas "melodic line"; Simeon; Perkins; David Cook; theme-and-aim lineage): none citable from held sources → strip the name, ship uncited, add to Further Reading, flag. (Simeon's *Horae Homileticae* preface and Perkins's *Arte of Prophecying* are public domain — flag as findable.)

## Working agreement (owner's cadence — follow exactly)
- **Batch flow:** draft a small batch → run a general-purpose falsification sub-agent (only job: falsify — were cited sources read this session? is each claim supported by what the source actually says? has any condensation drifted? has Scripture been interpreted? does anything overreach? is anything mis-marked CITED? any em-dashes?) → fix everything → present in the output format → **wait for the owner's explicit affirmation** → write files → commit to `teaching` → merge to `main` → push.
- **Present and wait.** Do not roll from one batch/phase into the next without an explicit go. "Start a batch" is not "write files before affirmation." (See memory `pause-for-confirmation-between-steps`.)
- **No em-dashes in shipped prose.** The only allowed dash is the `— after X` attribution credit. Say things once; be to the point; warm, plain, unsentimental, tooltip-length.
- **Output format per item:** Where it goes / Teaching text (inline + expandable) / Basis / State / Flag note / Note.
- Report a **progress tally** each batch (X of ~131 authorable units: 67 help + ~64 method items).
- **Decisions already made:** Goldsworthy self-criticism → full on the About page (`home.philosophy`) + a one-line echo already placed at `p5.christ-route`. Credits + Further Reading → one page, two sections (Phase E). `p5.credits` deferred to Phase E (only Goldsworthy is cited in Phase 5; do NOT inline-credit Chapell/Robinson — not held).

## Progress (2026-08-06, on `main`) — 24 of ~131 units, Batches 1–4 shipped
- **Phase 3 COMPLETE:** p3.structure, p3.boundaries, p3.marks.
- **Phase 5 COMPLETE** (bar `p5.credits` → Phase E): p5.faithfulness, p5.theme, p5.author-aim, p5.christ-route (CITED: Goldsworthy), p5.group-aim, p5.know-feel-do.
- **Phase 6:** p6e.expected done.
- **Method:** `traps.yaml` (CITED: Goldsworthy for the trap concepts; table + checks project's own; Allegory flagged), `stuck-helpers.yaml` (5), `litmus.yaml` `theme[]` (5). All other method files still `todo`.

## Next up (suggested order)
1. **Batch 5 = Phase 4 (COMA).** READ `one-to-one-COMA.pdf` yourself. Transcribe `coma.yaml` VERBATIM (6 genre sets), `state: cited`, keep the Matthias Media/HTC attribution rendering wherever COMA appears. Then `genres.yaml` (6 reading tips) and the Phase 4 help (p4.overview, p4.context/observation/meaning/application, p4.anchoring, p4.genre-reading). The 6 `p1.genre.*` one-liners can pair here or with Phase 1.
2. `litmus.yaml` `question[]` (4) — the Phase 6e per-type inline tests.
3. Phase 6 help (14) + `formulas.yaml` (~20) + `warnings.yaml` (3).
4. Phase 1 (18, mostly tool-mechanics [I], uncited) + Phase 2 (4).
5. Phase 7 (6 help) + `audit.yaml` (11).
6. Global (7): home.intro, home.philosophy (READ `trellisVine.pdf` + Growth Groups; put the Goldsworthy self-criticism here in full), guidance-toggle, durability, progress, attribution.page (Credits + Further Reading — Phase E), attribution.inline.
7. **Phase E assembly:** reconcile inline attributions; build the one-page Credits + Further Reading (annotated; must NOT imply the tool's content came from the listed books); write `p5.credits`.
8. **Worked example (Luke 1:39–80):** scaffold empty labelled `[X]` slots ONLY; owner supplies all interpretation. Last.
9. **Deliverables 6 & 7:** the flag summary (scan `flag:` fields) + closing report (what ships uncited, what is flagged, what the owner still needs to write).

## Voice & tradition (bake into everything)
Conservative, Sydney Anglican, Evangelical. Plain, warm, unsentimental, free of jargon from other streams, tooltip-length. The owner draws on: Phillip Jensen, Chris Braga, Andrew Barry, Carl Matthei, Tony Payne, Tim Keller, Don Carson, Graeme Goldsworthy, Broughton Knox, Peter Jensen, Paul Grimmond, John Piper, John Stott, J. I. Packer, Dave Jensen, Kevin DeYoung, John Chapman, Dick Lucas, Martyn Lloyd-Jones, Vaughan Roberts, Colin Marshall, David Helm, Richard Sweatman, Donald Robinson, David Cook, John Calvin. **This list shapes VOICE and the Further Reading page only. It does NOT license citing anyone — cite only what you have read this session.**

## Handy commands
- Approx. flag scan: `grep -rn "flag:" content/ | grep -Ev "flag: *(\}|#|$)"`
- Validate YAML/frontmatter with `ruby -ryaml` (see git history for the one-liners used in Batches 1–4).
- `git worktree list`; merge flow as above.
