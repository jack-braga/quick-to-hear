# Handoff — full correctness / completeness / refactor / clean sweep (+ delete v1)

> Paste this whole file — or say *"read `docs/HANDOFF-cleanup-sweep.md` and execute it"* — into a fresh
> Claude Code CLI session. **Use multi-agent workflows for the review/find phase** (explicit opt-in) and
> **single-threaded fixes**. Repo: this directory, branch `main`.

## Goal
A comprehensive health pass over the **active v2 + shared** code, and **fully remove the frozen v1**.
This is a pre-users hardening sweep. **Behaviour-preserving except bug fixes.** **Fix** the safe/clear
items (incremental, gated commits); **report** the risky/ambiguous ones for the owner to triage.

## Read first (but distrust the docs)
`CLAUDE.md` (the 8 inviolable rules, the locked stack, the commit/branch policy), `docs/PROGRESS.md`,
`docs/ROADMAP-v2.md` §5, `docs/V2-UX-BACKLOG.md` §7, `docs/SPEC.md`, and the auto-memories.
**⚠ The docs may be messy, outdated, or outright wrong (owner's words).** Verify every doc claim against
the code; treat docs as a lead, not a source of truth. (Doc accuracy is itself one of the sweep dimensions.)

## Scope
- **Sweep (active):** `src/v2`, `src/lib` (minus the v1-only export bits — see below), `src/types`,
  `src/store`, `src/hooks`, `content/`, `docs/`, `e2e/`, and build config.
- **Delete (v1 — frozen, unmaintained, no users):** `src/pages/*` (Phase1–7 + the v1 print pages),
  the v1 UI in `src/components/*`, the v1 print stack, v1 export (`src/lib/export/model.ts` + its
  markdown), the `#/v1/` route + the "v1 is archived under /v1/" e2e test, and the **"open v1 (archived)"**
  link on the v2 Home page.

### ⚠ v1 deletion is NOT a bulk `rm` — v2 depends on parts of v1 territory (grep-verified)
Map and **preserve/relocate these before deleting**, then delete the rest:
- **`@/lib/export` → `exportOptions`** — used by `src/v2/exportMarkdown.ts` and `src/v2/print/ExportPreview.tsx`
  (copyright line, translation name, method attributions). Keep it (reclassify as shared).
- **The audit (`auditResults` etc.)** — v2's **Check lens** consumes it via `src/v2/export.ts`
  `projectForExport`, which maps a v2 `Study` → a v1-shaped `Study` just to reuse the audit. Keep the audit
  + `projectForExport` (or absorb the audit into v2 and drop the projection — owner-approve if you restructure).
  `handoutModel`/`leaderModel` from `@/lib/export` are referenced by `src/v2/export.test.ts` only.
- **`@/components/passage/PassageView`** — imported by `src/v2/lenses/PastePanel.tsx`. Keep/relocate.
- Shadcn `@/components/ui/*` — grep says **v2 does not import them directly**; confirm before deleting them.
- **Method:** grep every import from active code (`src/v2`, `src/lib`, `src/store`, `src/hooks`, `src/types`)
  into v1 files; produce a **keep / relocate / delete** list; move the "keep" modules into a shared home
  (`src/lib/*`) and fix imports; only then delete the rest. **Gate green after the deletion.**

## Mode per dimension — fix-safe, report-risky
- **Correctness** — *adversarial* bug-hunt on the **pure logic + storage/export/model** (verse/id math in
  `src/lib/verse`, `exportModel`, storage round-trips in `src/lib/storage`, `revisions`/`supersede`,
  `mentions`, image `encode`/`processImage`, the spacer projection, `build`/running-order). Verify each
  finding (independent skeptics — drop it unless it survives), then **fix confirmed bugs**; **report**
  ambiguous ones with a repro. Lighter pass on the React UI (obvious logic errors only).
- **Refactor** — behaviour-preserving only: dedupe, extract shared helpers, delete dead code,
  naming/consistency. **Any structural restructure → write a short plan and get owner approval; never do it
  unilaterally.**
- **Clean** — dead code (especially post-v1 orphans), unused deps/exports, lint/format drift, comment
  hygiene. Fix.
- **Type-safety** — remove `any` / unsafe casts / non-null-assertion abuse where safe; report the rest.
- **Completeness** — **REPORT only (owner triages):** implementation vs `docs/SPEC.md` + the 8 inviolable
  rules (drift, gaps); test-coverage gaps on critical pure logic; stray `TODO`s, dead branches, half-wired
  features.
- **Docs** — treat as SUSPECT. Verify vs code; **fix clear factual errors** (safe); **report** structural /
  outdated problems + a proposed reorg.
- **a11y** — report; fix obvious safe wins (labels, roles, focus order).
- **Performance** — report; fix only obvious wins (no speculative optimisation).
- **Security** — static/offline app; the real surface is **user-supplied Bible paste + attached images**.
  Audit paste-cleaning, image type/size limits, `data:`/`blob:` rendering, and mention/markdown rendering
  for injection. Fix clear issues; report the rest.

## Process
1. **Baseline** — run the full gate; confirm green + record test/e2e counts. `git log --oneline -20` for context.
2. **Map the v2→v1 coupling** (above) → the keep/relocate/delete list.
3. **Review / find — WORKFLOWS (multi-agent).** Fan out reviewers per module × dimension → **adversarially
   verify** each finding (majority-refute; kill uncertain ones) → dedupe → a **prioritised findings list**.
   (This is the explicit opt-in to run `Workflow`.)
4. **Delete v1** dependency-aware (per step 2) → gate green + browser-verify the app still loads/prints.
5. **Apply fixes single-threaded** — one concern per commit, gate green each time: confirmed correctness
   bugs, type-safety, clean/dead-code, safe doc corrections.
6. **Write `docs/SWEEP-FINDINGS.md`** — correctness (fixed vs flagged, each with a repro), completeness
   gaps, doc issues + reorg proposal, risky refactors, security notes — for owner triage.

## Guardrails (house rules — non-negotiable)
- **Gate green at EVERY commit:** `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`.
- **Verify in a real browser (Playwright MCP)** for anything with a runtime surface (especially after the
  v1 deletion and any UI-touching change). NB: the **local preview PWA service worker serves a stale bundle
  after a rebuild** — clear it (`navigator.serviceWorker` unregister + `caches` delete) or rely on e2e
  (fresh context) as the authoritative check.
- Incremental commits scoped to **one concern**; **straight to `main`, drive your own commits + push**;
  **NEVER add Claude/Anthropic co-authorship** to commit messages (a `Claude-Session:` trailer is fine).
- **No behaviour change except bug fixes.** Prototype-led; **pause for owner approval** on big/structural
  steps and on the completeness/doc-reorg calls. **Ask questions in chat prose**, not the AskUserQuestion pop-up.
- Never generate the user's content (rule 1); the passage stays the visual subject; bundled Bibles are
  public-domain only.

## First check-in with the owner (before applying anything beyond safe mechanical fixes)
Present: (a) the **v1 keep/relocate/delete list** for a quick confirm; (b) the **top correctness findings**;
(c) the **completeness + doc report**. Then proceed with fixes.
