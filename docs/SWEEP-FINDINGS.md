# Sweep findings — v2 + shared health pass (2026-08-14)

A full correctness / completeness / refactor / clean / a11y / performance / security / doc sweep of the
**active v2 + shared** code, plus the **deletion of the frozen v1**. Review was multi-agent (two workflows:
9 module-clusters + a supplementary store/autosave/lenses pass), each finding adversarially verified
(refute-or-die) before it counted.

**This file is the triage list: what was *reported* (needs an owner decision) — not fixed.** What *was*
fixed is at the bottom (§9) and in the git log. Gate is green at every commit
(`typecheck && lint && test && build && test:e2e`); the final state is **347 unit tests + 37 e2e**.

> **Implementation status (2026-08-14 — executing `docs/HANDOFF-sweep-fixes.md`):**
> - ✅ **Group A** (`33dcd56`): §1.4, §1.5, §1.6, §1.10f — done.
> - ✅ **Group B** (`b366c82` + `10586f3`): §1.10a, §1.10b, §1.10c, §1.1 (owner-verified live) — done.
> - ⏭️ Groups C–O pending. See the handoff for the owner-triaged decision on each.

> Severity is the reviewer's, re-checked by me. "Latent" = real defect with no currently-reachable
> trigger (guard it before the feature that would reach it lands).

---

## 1. Correctness — flagged for a product decision (not fixed)

Each of these is a *confirmed* bug, but the fix requires choosing a behaviour, changing a model + migration,
or touching frozen audit internals — so I left it for you.

### 1.1 Cross-chapter paste is silently mis-structured — `src/lib/paste/paste.ts:143` (HIGH)
`acceptMarker`'s monotonic gate never detects a chapter boundary where verse numbers reset to 1, so a
paste spanning e.g. **Luke 1:79–2:2** folds all of chapter 2 into 1:80 as continuation, **unflagged** (the
`assemble` chapter-rollover branch at ~L426 is unreachable from analyse output).
**Decision:** declare paste single-chapter-only (flag/reject multi-chapter), **or** add chapter-reset
detection that distinguishes a legitimate reset-to-1 from a content "1". The latter is the harder,
heuristic-heavy option. Recommend at minimum **flagging** a suspected reset so it's never silent.

### 1.2 The Check-lens audit still diverges from the export on support + time — `src/v2/export.ts:45` (MEDIUM)
*Partially fixed:* the audit now drops `reserved` questions (commit `fc5a8c3`). **Still divergent:**
- **Support passages:** `projectForExport` derives `build.supportPassages` from `'note'`-kind cards, but
  `exportModel.supportFor` derives support from **`'question'` mentions + `'study-note'` inline mentions**
  (different kinds). So the audit's support set is unrelated to what actually prints → time-vs-length
  undercounts and coverage never sees cross-refs.
- **Minutes:** `projectForExport` carries `weight` (→ `WEIGHT_MINUTES`, 1/3/6) but the v2 Build UI only sets
  `estimateMinutes`; every projected question collapses to 3 min in the audit while the export uses the real
  estimate. The "over the session length" check essentially never fires.
**Recommendation:** rebuild `projectForExport` (or just the CheckLens time/coverage inputs) on top of
`exportModel` so the audit reflects the actual exported document — a small but structural change to how the
audit gets its input, hence left for approval.

### 1.3 COMA answers double-count across genres — `src/v2/reader/ComaPanel.tsx:80` (MEDIUM)
Answer-cards are keyed by `comaType + comaPrompt` only, and `coma.yaml` has verbatim-identical prompt
strings across genres. In a multi-genre study, an answer added under one genre's row also renders under the
identical-prompt row of another genre, and the per-heading "answered" count double-counts.
**Decision:** thread a genre discriminator through the coma annotation model (needs a schema field +
migration + a call on whether identical prompts *should* share an answer).

### 1.4 `setPassage` clears `dirty` before the write — a failed persist loses the passage — `src/store/study.ts:139` (MEDIUM, rule 6)
`setPassage` sets `{ current, dirty:false }` optimistically, then `await putStudyFull`. Unlike `flushSave`
(which clears `dirty` only after a successful write, so a throw leaves it retryable), a `putStudyFull`
rejection here strands the new passage in memory with `dirty:false` and **nothing retries it**;
`putStudyFull` is also non-atomic (body then passage), so a partial failure desyncs the two stores.
Autosave only ever writes the body, so it can't retry the passage regardless.
**Recommendation:** clear `dirty` only after the write resolves; surface the error (see §1.5); and decide how
the passage store gets retried (it's outside the autosave body path today). Rule-6-adjacent — worth
prioritising.

### 1.5 `makePrimary`/`remove`/`changePassage` swallow a failed persist silently — `src/v2/lenses/SetupLens.tsx:100` (LOW, ties to 1.4)
These call `setPassage` as `void …` with no try/catch (unlike `addBundled`, which wraps it + `setError`). A
rejected IndexedDB write is unhandled, no error shows, and `dirty` is already false so nothing retries.
**Recommendation:** wrap in try/catch + surface the error, mirroring `addBundled` (small, safe — fold into
the §1.4 fix).

### 1.6 "Change passage" orphans annotations/marks/theme on the old verse ids — `src/v2/lenses/SetupLens.tsx:108` (MEDIUM)
`changePassage` sets `{ translations:{}, primaryId:null }`. `setPassage` only reconciles `map` (and only
when a primary exists), and never touches `annotations`/`themeAim`, so every card, mark, and theme survives
anchored to a passage with no text; `reconcileMarks` also keeps marks whose verse is absent, so loading a
different reference afterward doesn't clean them up.
**Decision:** confirm + clear on change-passage, or an explicit carry-over decision.

### 1.7 `reconcileMarks` drops the user's note when a span mark degrades — `src/lib/map.ts:225` (MEDIUM, latent)
The span-degrade branch returns a fresh literal `{ id, kind:'verse', verseId, text }` instead of spreading
the original, silently dropping `mark.note`/`mark.verseIds` (the other two branches spread `...mark`).
**Latent today** — no current path writes `note`/`verseIds` onto a `map.marks` entry (the confusing-note
moved to the annotation surface) — so no real study loses data now. The obvious `...mark` fix also carries
`verseIds` forward on degrade, which is a semantic call. **Recommendation:** spread `...mark` in the degrade
branch when/if marks regain a `note`.

### 1.8 Hebrew-numbering silently misaligns any psalm outside the 8-row table — `src/lib/compare.ts:191` (MEDIUM)
`reversifyToKjv` only has rules for Ps 3,4,5,6,51,52,54,60; any other psalm with a Masoretic-superscription
verse 1 (7,8,9,18,30,38,42,44–49,55–65,…) hits the identity path and pushes nothing to `unmappable`, so it
shifts nothing and warns nothing — the exact silent-misalignment the module exists to prevent.
**Decision:** expand the table (needs BHS verification) **or** flag "no rule for this chapter" (which would
false-positive on un-shifted psalms like Ps 1/2/23). Scholarly-data call.

### 1.9 `extraPassages` mislabels a same-book verse list — `src/lib/verse/reference.ts:100` (MEDIUM)
`extraPassages: matches.length > 1 || spans.length > 1` also fires for a single discontiguous verse list
(one bcv match, several comma-spans), and `osis`/`start`/`end` capture only the first span. So for
`Luke 1:1,16-17,32` SetupLens shows "detected Luke 1:1" + a "more than one passage" note, while `loadReading`
actually loads the whole union. **Decision:** distinguish a verse-list flag from `extraPassages`, and/or make
`osis` reflect all spans.

### 1.10 Lower-severity paste/parse edge cases (all LOW, mostly latent)
- **`paste.ts:213`** — a lone verse-number line in poetry yields an empty `startsVerse` segment; `assemble`'s
  `if (!text) continue` skips it *before* opening the verse, so the boundary is lost mid-passage.
- **`paste.ts:439`** — an edited continuation-first segment can mint a phantom `BOOK.CH.0` (initial
  `prevNumber = -1` → `n = 0`); reachable via PasteReview re-assembling user-edited segments.
- **`paste.ts:280`** — `looksLikeTranslationName` can drop a real scripture line (e.g. "This cup is the new
  testament…") as the translation name after a lone reference line.
- **`mentions.ts:55`** — `parseMentions` lacks the editor's "`@` must start a word" guard, so `me@John 3:16`
  chips mid-word and can export as a support passage. Fixing changes already-saved studies (behaviour change).
- **`selection.ts:104`** — `formatVerseIds` labels a cross-book selection with the first book's name (latent;
  passages are single-book today).
- **`storage/studies.ts:70`** — `getStudy` re-quarantines an unreadable study on **every** read (new id each
  time), growing the quarantine store unbounded, and `listStudies` still shows a clickable ghost row.

---

## 2. Security — flagged (static app; real surface = paste + attached images)

### 2.1 Unescaped image caption in the exported markdown — `src/v2/exportMarkdown.ts:32` (LOW)
`![${im.caption}](${url})` interpolates the caption raw; a caption with `]`/`(`/`)` breaks out of the alt
text and injects markup into the downloaded `.md`. In-app previews are safe (React escapes), and the URL is a
trusted `data:` URI, so it's low — but it's also a plain robustness bug (a caption like "see [fig]" malforms
the image). **Recommendation:** escape/strip the alt-text terminator. *(The related import-side MIME
breakout was fixed in `4f91392`.)*

### 2.2 `preclean` misses newer bidi/control characters — `src/lib/paste/clean.ts:11,17` (LOW)
`INVISIBLE_RE` covers legacy bidi (202A–202E, 200E/F, 2060, FEFF) but **not** the Unicode 6.3 isolates
LRI/RLI/FSI/PDI (2066–2069) or ALM (061C) — the Trojan-Source spoof set; and C0/C1/DEL controls survive into
segment text. Not XSS (React escapes), so impact is visual-reordering only, and stripping 061C/isolates could
corrupt legitimate RTL/Arabic scripture. **Decision:** confirm the exact set to strip (and fix the
"bidi controls are all normalised" comment, which overclaims).

---

## 3. Completeness — vs SPEC + the 8 rules (report-only)

- The **expected-answer hard block (rule 3)** and the **answer-free handout invariant** both hold in v2
  (verified in the markdown + print renderers).
- **Translation-comparison notes** (SPEC §7 leader's-notes item) — no capture field exists; never built.
- **Talk-format `auditResults` returns < 11 items** (`src/lib/audit.ts:302`) — `know-feel-do`/`two-load-bearing`
  are `if (build)` with no `else`; unreachable today (Talk is an unbuilt stub; the v2 projection is always
  study-format) but worth a defensive `n/a` push before Talk lands.
- **Multi-tab conflict guard is dead** (`src/store/study.ts:197`) — `conflict` is set but no UI reads it and
  `reloadCurrent` has no caller. Either wire the conflict UI or remove the dead machinery.
- **Test-coverage gaps on the never-lose-data branches:** `getStudy` load-quarantine path, corrupt-image
  import beyond the cases added in `4f91392`, single-chapter-book `verseCount`/`chapterCount` (depends on an
  unpinned `single_chapter_1_strategy` bcv option — recommend pinning it), and the cross-chapter `rangeRef`
  label branch (`src/v2/reader/model.ts:116`).

---

## 4. Accessibility — flagged (obvious safe wins were fixed in `0a4dc22`)

- **MentionEditor `@`-autocomplete** (`src/v2/reader/MentionEditor.tsx:484`) — no combobox ARIA
  (`role=combobox`/`aria-expanded`/`aria-controls`/`aria-activedescendant`); `role=option` sits on the `<li>`
  while the focusable element is the nested `<button>`. Wire the combobox pattern.
- **SetupLens book-completion** (`:153`) and **ReferenceCombobox** (`:73`) — same missing combobox ARIA.
- **CommandPalette** (`:71`) — dialog is not modal (no `aria-modal`, no focus trap).
- **AttachImageRow reorder** (`:118`) — drag-only, no keyboard alternative (determines print order).

These are real but involved (interaction/ARIA work), so reported rather than fixed in a hardening pass.

---

## 5. Performance — flagged

- **Parallel view rebuilds every per-translation verse map on every hover** — `src/v2/ReaderShell.tsx:458`.
  `viewedTranslations` and the `translations`/`labels` arrays passed to `ParallelCanvas` are fresh identities
  each render, and `onVerseHover` sets state on every cell mouseenter, so moving the pointer across verses
  rebuilds N `Map`s + a full bands walk each move. **Recommendation:** memoize the three arrays
  (behaviour-preserving). Left for a focused, browser-verified perf pass.

---

## 6. Refactor / clean — flagged (safe cleanups were done; these need a call)

- **`recycle.ts` + the store `recycleToPool` action** are post-v1 orphans (only the deleted v1 pages called
  `recycleToPool`; `recycle.ts` is now reachable only through that unused store action). Kept for now (gate
  stays green). **Recommendation:** remove the action + `recycle.ts` + its store tests in a dedicated clean
  commit — needs your nod (it touches the shared store's API and deletes tests).
- **`revisionsByOrigin` + `hasBookSource`** (`src/v2/revisions.ts:17,21`) are dead exports (test-only). The
  `hasBookSource` docstring also claims an export-integrity use no caller implements. Wire them into the
  Deepen/Weigh round views they were presumably built for, or drop them + their tests.
- **`ui/button.tsx` is the only surviving shadcn primitive** (kept — `PwaReloadToast` uses it). If you'd
  rather `PwaReloadToast` not depend on it, inline a plain button and drop the last `ui/` file.
- **Effect deps churn** — `MarginAnnotations.tsx:160` and `ComaPanel.tsx:71` depend on the whole `props`
  object (new identity each render), so the focus effect runs every render (harmless due to an early-out).
  Depend on the specific fields instead.

---

## 7. Refuted (surfaced but killed under verification — no action)

Recording these so they don't get re-raised: the ⌘/Ctrl-deselect anchor behaviour (`selection.ts` — matches
the OS multi-select convention), `alignTranslations` row ordering (`compare.ts` — documented-intentional,
status/counts are order-independent), the `useStorageEstimate` disposer (benign no-op in React 18), the
`ThemeAimLens` `setAck` "stale closure" (unreachable — the store returns a fresh `current` each call, forcing
a re-render between clicks), and `download.ts` synchronous URL revoke (correct on Chromium/Firefox; no
concrete repro).

---

## 8. Doc structure — reorg proposal (report; nothing done beyond factual fixes)

The doc set is layered around a v1-frozen / v2-active split that the v1 deletion makes obsolete:
`PROGRESS.md` is a ~1,490-line v1 build log with a v2 pointer bolted on top; `PLAN.md` (Stages 0–10) and much
of `PROGRESS.md` describe code that no longer exists; `SPEC.md` is the v1 seven-phase brief while the app is
now 10 lenses. **Proposed reorg (for your approval):**
1. Move the v1 build log + `PLAN.md` + the v1 `HANDOFF-*`/`DEV-SESSION-PROMPT` docs into `docs/archive/`.
2. Keep `SPEC.md` (behaviour *intent* still governs — but add a short "v1 phases → v2 lenses" map at the top).
3. Fold the live v2 state into a single current `PROGRESS.md` + `ROADMAP-v2.md`; delete the stale "v1 is
   frozen, read these v1 docs" pointers.
4. Rewrite `CLAUDE.md`'s "Start every session here" to point at the v2 docs (the v1 crib is gone).

Factual doc errors were already fixed: two stale code comments (`95537ec`), the `projectForExport` +
`ThemeAimLens` docstrings, and `CLAUDE.md`'s stack (`1b6c789` — react-hook-form, WEBBE+ASV, parser name).

---

## 9. What was fixed in this sweep (for reference)

| Commit | What |
|---|---|
| `9f882e9` | **Delete v1** (37 files) — dependency-aware; keep `PassageView`, `ui/button`, `audit`, `recycle`, slim `lib/export` |
| `95537ec` | docs: two stale code comments |
| `9b199f0` | fix: paste verse-number field → `null` not `0` on non-numeric input (phantom verse 0) |
| `e4b28a3` | refactor: derive image `accept` from `ACCEPTED_MIME` |
| `c77d0ad` | fix: Home shows the real question count (`toSummary` counts annotations) |
| `4f91392` | fix(import): validate project-file images up front — MIME/size/decode, **no ghost study** (b4/b5/w-h) |
| `fc5a8c3` | fix: Check lens audits only what exports (drops `reserved`) |
| `26614f5` | fix: `weighedText` — an unfinished Weigh "revise" no longer blanks the leader's theme/aim |
| `96f3e56` | fix: SetupLens keeps bundled-add buttons after a paste-first setup |
| `0a4dc22` | a11y: Check sr-only status + Weigh field labels |
| `1707655` | clean: merge `extract.ts` identical branches (+ drop dead `emittedAny`); unshadow SetupLens `primary` |
| `1b6c789` | docs: correct `CLAUDE.md` stack |

### Design choices I made (so you can veto)
- **Import hardening (`4f91392`)** — an invalid embedded image **fails the whole import** (quarantined, like a
  malformed body), rather than dropping the one image and keeping the study. Chosen for consistency with the
  existing corrupt-file handling and because import is the untrusted surface. The friendlier alternative
  (drop the bad image + keep the study) would need a per-image warning channel that `ImportResult` doesn't
  have.
- **Reserved filter (`fc5a8c3`)** — the Check lens now counts/audits the *exported* question set. A study
  whose questions are all reserved reads as `canExport = false` (edge case; study-notes-only export isn't
  offered — pre-existing).
- **`weighedText` (`26614f5`)** — added a separate helper for the export's "committed value" rather than
  changing `supersede`, so WeighPanel's authoring editor (bound to `supersede().primary`) is untouched.
- **Home vs Check question count (`c77d0ad` + `fc5a8c3`)** — a deliberate cross-view difference: **Home**
  counts *authored* questions (`toSummary` includes `reserved` ones, so the study list reflects all your
  work), while **Check + export** count only the *exported* set (reserved dropped). A 5-question study with 2
  held back reads "5 questions" on Home and "3" in Check. If you'd rather they match, either count is a
  one-line change — flagging so it's your call, not an accident.
