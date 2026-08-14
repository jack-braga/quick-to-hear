# Dev-Session Handoff Prompt (template)

The build runs **one stage per Claude Code session**, each handing off to the next via
`docs/PROGRESS.md`. This file is the reusable prompt. To start a session, copy the
block below and set `STAGE` to the stage you want done (from `PLAN.md` §6).

The durable handoff is `PROGRESS.md` — a fresh session needs nothing but the repo and
this prompt. The "emit the next prompt" step just saves you re-typing.

---

## The prompt (copy from here)

```
You are implementing ONE stage of the "Quick to Hear" build, then handing off.

STAGE TO DO THIS SESSION: Stage <N> — <title>

Start:
1. Read docs/PROGRESS.md (current state + decision log), then the "Stage <N>" entry in
   docs/PLAN.md §6, then the relevant phase(s) in docs/SPEC.md, then CLAUDE.md.
   Confirm Stage <N> is genuinely the next incomplete stage; if PROGRESS disagrees,
   stop and tell me.
2. If package.json exists: `npm ci` then `npm run typecheck && npm run lint && npm test
   && npm run build` to confirm a green baseline before changing anything.

Do:
3. Implement ONLY Stage <N>. Honour the cross-cutting rules (PLAN §5) and the locked
   decisions (PLAN §2) — do not re-litigate settled choices; if you believe one is
   wrong, raise it, don't silently deviate.
4. Reuse the sibling repos where PLAN says to (../local-ledger template, ../twice-daily
   Bible pipeline, ../krenoda theming/tests). Do not copy local-ledger's dep list
   wholesale (see PLAN §2 dependency hygiene).
5. Teaching text is NOT your job — it is authored separately. Where a help key or
   method-data field is empty, wire the app to read it and show a "guidance to be
   written" placeholder. Do not write teaching prose. content/ is already scaffolded.

Verify (this is the acceptance gate — do it, don't assume):
6. Run the stage's "How to test" from PLAN §6 — unit tests AND the manual/e2e check.
   Actually exercise the behaviour (use the /verify skill or drive the app); paste the
   evidence. `typecheck && lint && test && build` must pass.

Hand off:
7. Update docs/PROGRESS.md: tick the stage box only if its "Done when" holds; set
   "Next up"; fill "Test entry points" with the exact commands/URLs/sample passages
   that exercise what you built; append a decision/deviation-log entry for anything
   that diverged from PLAN (and fix PLAN if a decision actually changed).
8. Commit AND push to `main` (straight-to-main is the owner's policy — no users yet).
   NEVER add Claude co-authorship to the commit message (no `Co-Authored-By: Claude`).
9. Output, as your final message, a ready-to-paste prompt for the NEXT session: this
   same block with STAGE set to the next stage, plus a 3-5 line summary of what you
   built, what to watch for, and anything I need to decide before it starts.

Stop and ask me if: a locked decision looks wrong, the stage can't meet its "Done when"
without scope you can't justify, or you hit an open question from PLAN §8. Batch
questions; don't drip them.
```

---

## Notes

- **Scope discipline is the point.** One stage per session keeps context small and each
  handoff clean. Resist "while I'm here" creep into the next stage.
- **PROGRESS.md is the source of truth** for what's done — keep it honest; a ticked box
  that isn't really done breaks the next session.
- **Commits: straight to `main`, push when done, never Claude co-authorship** (see
  `CLAUDE.md`). A session in a git worktree is the exception — it commits to its own
  branch, which is merged back afterwards.
- **Open questions** (PLAN §8: worked-example passage, real paste samples, BSB
  sourcing, repo name) surface at the stage that needs them — the prompt tells the
  session to stop and ask rather than guess.
