# Handoff — implement the triaged sweep decisions

> Paste this into a fresh Claude Code CLI session — or say *"read `docs/HANDOFF-sweep-fixes.md` and
> execute it."* Repo: this directory, branch `main`. This is the **implementation** follow-up to the
> health sweep: the owner has triaged every finding in `docs/SWEEP-FINDINGS.md`; the decisions are below.

## Context (read first)
- The v2+shared **health sweep is done**: v1 was deleted, 13 commits landed + pushed (`00fcb44..325bab1`).
- **`docs/SWEEP-FINDINGS.md`** has the full detail + repro for every item referenced here (by its `§`/number).
  Read it — this handoff gives the *decision + approach*; the findings doc gives the *evidence*.
- **`CLAUDE.md`** — the 8 inviolable rules, the (now-corrected) stack, the commit/branch policy. Note its
  "Start every session here" section is **stale** (still calls v1 "frozen") — you will rewrite it (Group O).
- The app is 100% v2 now: `App.tsx` mounts only `V2App`; the passage is the canvas; annotations over it.

## Guardrails (house rules — non-negotiable)
- **Gate green at EVERY commit:** `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`.
- **⚠ Do NOT mask exit codes when gating.** Run the gate as a `set -e` chain (or check `$?` per step) and
  **read the typecheck/lint output for errors** — `npm run typecheck | tail` swallows tsc's exit code and
  will hide a real break. (This bit the last session.) A reliable form:
  `( set -e; npm run typecheck; npm run lint; npm test; npm run build; npm run test:e2e; echo ALL_PASSED ) 2>&1 | tail`
- **Verify runtime-affecting changes in a real browser (Playwright MCP)** — use `npm run dev` (no service
  worker; avoids the stale-bundle trap), not `vite preview`. e2e (fresh context) is the authoritative check.
- **Incremental commits, one concern each, straight to `main`, drive your own commits + push.**
- **NEVER add Claude/Anthropic co-authorship** to commit messages. A `Claude-Session:` trailer is fine.
- **No behaviour change except the intended fix.** Add a regression test with each behavioural fix.
- Never generate the user's content (rule 1); passage stays the visual subject; bundled Bibles are PD-only.
- **Update `docs/PROGRESS.md`** as you land groups so a fresh session can resume; keep `SWEEP-FINDINGS.md`
  in sync (mark items done).

## Do NOT do (deferred / keep-as-is — do not re-litigate)
- **Deferred:** §3.1 translation-comparison-notes (a feature → ROADMAP); §3.2 Talk-format audit robustness
  (fix when Talk mode is built); §1.10e cross-book verse label (latent — passages are single-book); Talk mode;
  BSB translation.
- **Keep as-is (owner-confirmed):** `components/ui/button.tsx` (used by `PwaReloadToast` — don't inline/delete);
  the import path **fails the whole file** on a bad image (don't switch to drop-the-image); **Home counts
  *authored* questions, Check counts *exported*** — this cross-view difference is intended, don't "unify" it.
- **§1.7 is a DELETE, not a fix** — see Group I. Don't "fix" the unreachable note-drop; remove the dead code.

---

## The work — suggested commit sequence

Grouped so independent/low-risk work lands first and the verify-heavy ones (paste, audit, a11y) are isolated.
Each group = one or a few commits. Order is a suggestion; keep each commit independently green.

### Group A — Store / persistence hardening (§1.4, §1.5, §1.6, §1.10f)  ·  *start here (foundational, no UI risk)*
1. **§1.4 `setPassage` clears `dirty` before the write** (`src/store/study.ts`). Mirror `flushSave`: apply the
   new `current` but clear `dirty` **only after** `putStudyFull` resolves; on failure keep `dirty:true` +
   `setError(...)`. (The deeper "retry the passage store via autosave" is out of scope — just stop the silent
   loss + surface the error.)
2. **§1.5 SetupLens swallowed errors** (`src/v2/lenses/SetupLens.tsx`). Wrap `makePrimary`/`remove`/
   `changePassage` in try/catch + `setError`, mirroring the existing `addBundled`.
3. **§1.6 change-passage orphans** (`SetupLens.tsx` `changePassage`). Add a **confirm-then-clear**: warn
   "this clears the cards/marks/theme anchored to the old passage", and on confirm clear
   `annotations`/`themeAim`/`map` alongside resetting the passage. (New store action or extend `setPassage`.)
4. **§1.10f `getStudy` re-quarantines every read** (`src/lib/storage/studies.ts`). Dedupe the quarantine by
   study id (don't append a new record each failed read); flag or hide the ghost Home row.
   *Verify:* unit tests (fake-indexeddb) + a quick browser check that Set-up errors surface.

### Group B — Paste parser overhaul (§1.1 multi-chapter + §1.10a, §1.10b, §1.10c)  ·  *owner-in-the-loop test*
All in `src/lib/paste/` (`paste.ts`, `clean.ts`) + `PasteReview`/`PastePanel`.
- **§1.1 (owner chose B): build multi-chapter paste.** Add chapter-reset detection to `acceptMarker`'s
  monotonic gate so a verse number resetting to 1 (crossing a chapter boundary) is recognised, and wire
  `assembleParsedText`'s existing chapter-rollover branch (currently unreachable). Distinguish a legitimate
  reset-to-1 from a content "1".
- **§1.10a** lone verse-number line in poetry → empty `startsVerse` segment loses the boundary (open the verse
  even with empty body, or handle in `assemble`).
- **§1.10b** an edited continuation-first segment can mint `BOOK.CH.0` — floor the verse number to ≥1 with
  correct chapter handling (the naive clamp isn't neutral — see the finding).
- **§1.10c** `looksLikeTranslationName` can drop a real scripture line — guard against dropping verse-like prose
  (a line starting with a verse number, or that reads as prose).
- Add golden fixtures for each; extend `paste.test.ts`.
- **⚠ OWNER-IN-THE-LOOP TEST for §1.1:** set up Playwright MCP against `npm run dev`, create a study, get to
  the Set-up → "Paste your own" screen, then **ask the owner to paste a real cross-chapter BibleGateway
  passage (e.g. Luke 1:79–2:2) and reply "done"** (they can also paste the copied text into the CLI). Then
  verify the parse splits the chapters correctly on the review screen. Do not fabricate the paste input.

### Group C — Drop Hebrew psalm numbering (§1.8)
Remove `reversifyToKjv`, the `HEBREW_PSALMS` table, `FOREIGN_SYSTEMS`/`findVersificationSystem`, and the
"Verse numbering" selector on the pasted-secondary path (`src/lib/compare.ts`, `src/v2/lenses/PastePanel.tsx`).
Assume standard English/KJV numbering. **Add one plain note** on the paste-comparison screen: *"Comparison
assumes standard English verse numbering. If your pasted translation numbers Psalm verses differently, the
alignment may be off."* Keep the number-equality + `present`-flag alignment (it stays for the normal case).
Remove the now-dead tests. *Verify:* gate + a browser check of the paste-secondary flow.

### Group D — `@`-mention word-boundary guard (§1.10d)
`src/v2/reader/mentions.ts` `parseMentions` — require `@` to start a word (match the editor's `pendingRange`
rule), so a mid-word `@ref` (emails) no longer chips/exports. Note in the commit that already-saved studies'
mid-word `@` now render as plain text (correct). +test.

### Group E — extraPassages verse-list label (§1.9)
`src/lib/verse/reference.ts` + `src/v2/lenses/SetupLens.tsx`. Distinguish a **single-book discontiguous verse
list** (one bcv match, several comma-spans) from **genuinely separate passages**, so the "Detected …" label and
the "more than one passage" note are accurate (show all spans, or a "verse list" label). +test.

### Group F — Multi-tab conflict banner (§3.3)
The detection is **already wired and working** (`broadcast.ts` + the store's `applyExternalSave` sets
`conflict:true` when another tab saves a newer copy; `reloadCurrent()` exists). Only the UI is missing: render
a small banner in the reader when `study`'s store `conflict === true` — "This study changed in another tab" +
a **Reload** button calling `reloadCurrent()`. Informational only (it warns + offers reload; it does not block
a last-write-wins save — that's out of scope). *Verify:* two browser tabs on the same study.

### Group G — COMA cross-genre double-count (§1.3)
`src/v2/reader/ComaPanel.tsx` + the coma annotation model + `ReaderShell.onAddComaAnswer`. Add a **genre
discriminator** to the COMA answer key so an answer under one genre's row doesn't also render under another
genre's identical-prompt row (and the per-heading "answered" count stops double-counting). Additive-optional
schema field; handle old answers (no genre) gracefully. +test.

### Group H — Audit reads what actually exports (§1.2)  ·  *the biggest one; do it deliberately*
Today the Check-lens audit runs on `projectForExport`, whose support passages + minutes are unrelated to the
printed document (it reads `'note'`-kind cards for support, not `'question'`/`'study-note'` mentions, and uses
`weight` not `estimateMinutes`). **Rebuild the audit's input from `exportModel`** so the checks see the real
support passages and real per-question minutes:
- Derive `build.supportPassages` from the same source `exportModel.supportFor` uses (question `mentions` +
  study-note inline `@`-mentions marked include-for-group).
- Make the time-vs-length check reflect `exportModel`'s real minutes (`annotationMinutes`/`totalMinutes`),
  not the coarse weight bucket — either carry a minutes field into the projection and have the audit read it,
  or compute the time check in `CheckLens` from `exportModel.totalMinutes`.
Keep it behaviour-preserving elsewhere; the audit stays soft (nothing blocks). +tests. *Verify in browser:*
attach a reference to a question + set per-question minutes, confirm the Check time total + support match the
exported document.

### Group I — v1-vestige deletion (§1.7 + §6.1 + §6.2)  ·  *one cleanup commit (or two)*
All dead post-v1 code reachable only through unused surface. Scope carefully; gate after.
- **§1.7 `map.marks`:** remove the `marks` field from `MapSchema`, the `Mark`/`note`/`verseIds` schema,
  `reconcileMarks`'s mark logic + its call in `setPassage`, and `makeVerseMark`/`makeSpanMark` + their tests.
  **Keep `map.sections`** (live — Survey lens). Safe: studies are non-upgradable and `map.marks` is always `[]`.
- **§6.1 recycle orphan:** remove `src/lib/recycle.ts`, the store's `recycleToPool` action, and their tests
  (only the deleted v1 pages called it).
- **§6.2 dead exports:** remove `revisionsByOrigin` + `hasBookSource` from `src/v2/revisions.ts` + their tests.
- Grep for any lingering reference before deleting; gate green after.

### Group J — Security (§2.1, §2.2)
- **§2.1** `src/v2/exportMarkdown.ts` — escape/strip `]` and `\` in the image caption before
  `![caption](url)` so a caption can't inject markup into the downloaded `.md`. +test.
- **§2.2** `src/lib/paste/clean.ts` — strip the junk **C0/C1/DEL control chars** in `preclean`, and **fix the
  overclaiming comment** ("bidi controls are all normalised"). **Do NOT strip the bidi isolates (U+2066–2069)
  or ALM (U+061C)** — they're legitimate in RTL/Hebrew scripture. +test.

### Group K — Accessibility (§4.1/§4.2, §4.3, §4.4)
- **§4.1+§4.2 comboboxes** (`MentionEditor.tsx`, `SetupLens` book-completion, `ReferenceCombobox.tsx`) — wire
  the standard combobox ARIA (`role=combobox`/`aria-expanded`/`aria-controls`/`aria-activedescendant`; move
  `role=option` onto the interactive element). They share a pattern — do them together.
- **§4.3 CommandPalette** — add `aria-modal`, a focus trap, and Esc-to-close.
- **§4.4 AttachImageRow** — add a keyboard way to reorder images (up/down buttons or arrow-key handling), since
  reorder sets print order.
*Verify in browser* + keyboard walkthrough.

### Group L — Performance (§5.1)
`src/v2/ReaderShell.tsx` — memoize `viewedTranslations` and the `translations`/`labels` arrays passed to
`ParallelCanvas` so hovering in parallel view stops rebuilding the per-translation verse maps every mouse-move.
Behaviour-preserving. *Verify in browser* (parallel view with 2+ translations still renders + highlights).

### Group M — Effect-deps churn (§6.4)
`MarginAnnotations.tsx:160` + `ComaPanel.tsx:71` — depend on the specific fields, not the whole `props` object,
so the focus effect stops running every render.

### Group N — Test coverage + pin bcv option (§3.4)
Add tests for the never-lose-data branches: `getStudy` load-quarantine, corrupt-image import (beyond the cases
already added), single-chapter-book `verseCount`/`chapterCount` (Jude/Philemon/etc.), and the cross-chapter
`rangeRef` label (`src/v2/reader/model.ts`). **Pin `single_chapter_1_strategy:'chapter'`** in the bcv options
(`src/lib/verse/reference.ts`) so those counts don't depend on an unpinned default. No new Bible download
needed — verse counts come from `bcv_parser` metadata.

### Group O — Doc reorg (§8)  ·  *last*
- Move the v1 build log + `PLAN.md` + the v1 `HANDOFF-*` / `DEV-SESSION-PROMPT` docs into `docs/archive/`.
- Keep `SPEC.md`, but add a short **"v1 phases → v2 lenses"** map at the top.
- Consolidate the live state into one current `PROGRESS.md` + `ROADMAP-v2.md`; drop the stale "v1 is frozen,
  read these v1 docs" pointers.
- **Rewrite `CLAUDE.md`'s "Start every session here"** to point at the v2 docs (v1 is deleted, not frozen).

---

## First steps
1. Read `CLAUDE.md` + `docs/SWEEP-FINDINGS.md` (+ this file). `git log --oneline -15` for context.
2. Baseline gate (the `set -e` chain above) — confirm green (347 unit / 37 e2e) before touching anything.
3. Work group by group (A→O is a reasonable order). Commit + push each; update `PROGRESS.md`.
4. Pause for the owner on the **§1.1 paste test** (Group B) and on anything ambiguous — ask in chat prose,
   not the AskUserQuestion pop-up.
