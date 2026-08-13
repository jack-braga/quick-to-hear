# Handoff — build "attach images to questions / study notes" (v2, deferred §6 item)

> Paste this whole file into a fresh Claude Code CLI session to build the feature. **Nothing is built
> yet** — this is a scoped brief + a precise surface map + the open decisions to settle with the owner
> first. The v2 flow redesign and its polish pass are **complete and shipped**; this is a new, optional
> §6 feature the owner chose to pick up next.

You are working in **Quick to Hear** (`/Users/jack-braga/Documents/Projects/repos/quick-to-hear`, branch
`main`) — a free, static, account-less, **offline** browser workbook for preparing a Bible study. Read
`CLAUDE.md` first (inviolable rules + stack + commit policy).

## The feature (one sentence)
Let the user **attach one or more images to a question card or a study-note card** so the images print
in the two output documents (participant handout + leader's notes) — e.g. a map, a diagram, a photo of
a place, a manuscript scan.

## Read first (in order)
1. This handoff (the brief + surface map below).
2. `CLAUDE.md` — the **inviolable rules** (esp. rule 1 & rule 6 & rule 7) and the commit/branching policy.
3. `docs/V2-UX-BACKLOG.md` **§6** (this is item "Images in a study, somehow — 'definitely defer'") and
   **§7** (the current 10-lens flow, so you know where Write/Build sit).
4. The mockup `docs/mockups/v2-images.html` (serve: `cd docs/mockups && python3 -m http.server 8899`) —
   the **card affordance (Variant A, chosen)** + the print layout.
5. The files in **"Surface map"** below — read them before touching anything.
6. Auto-memories: `v2-ui-overhaul` (current shipped state), `pause-for-confirmation-between-steps`,
   `prefer-chat-questions-over-tool`, `no-claude-coauthor-in-commits`, `form-state-controlled-inputs-standard`.

## Inviolable constraints (these shape the whole design)
- **Rule 1 — never generate the user's content.** The tool **never sources, generates, or suggests an
  image.** The user attaches **their own** image (upload from disk). We only store, place, and print it.
- **Rule 6/7 — offline, no server, work-never-lost.** There is **no upload endpoint.** Image bytes must
  live **locally in IndexedDB** and be **embedded** into exports (data URIs) — nothing is fetched over
  the network. Autosave must keep working; a study must survive a reload with its images intact.
- **Copyright.** The auto-appended export copyright line is about the **Bible translation**, not images.
  A user's own photo/diagram is their responsibility — at most a one-line "your images are your own" note;
  do **not** build any rights management.
- **The passage stays the subject** (rule 2): images live on cards and in the output docs, never
  competing with the biblical text in the reader.

## Architecture — most of this is already decided by the codebase
Images should **mirror how references (`mentions`) attach to a card** — the same additive-field +
`onEdit` patch + export-block + `ExportPreview` render pattern. Concretely:

- **Model** (`src/types/study.ts`) — `AnnotationSchema` is a **flat, additive-optional zod object** (NOT
  a strict union), so adding `images?` needs **no `CURRENT_SCHEMA_VERSION` bump** (currently `2`); old
  docs default it. Attach to `'question'` and `'study-note'` kinds. Mirror `mentions` — an
  `images?: ImageRef[]` (ordered) or `images?: Record<imageId, ImageMeta>` (keyed), each entry carrying a
  stable **image id**, a **caption/alt** string, and (per the storage decision below) either the bytes or
  just the id.
- **Authoring UI** — clone `src/v2/reader/AttachReferenceRow.tsx` into an **`AttachImageRow`**. It persists
  with a one-line store patch: `onEdit(card.id, { images: … })`. Wire it in **two** places, exactly where
  `AttachReferenceRow` already sits: `src/v2/reader/MarginAnnotations.tsx` (question card, ~line 284; add a
  study-note path too) and `src/v2/lenses/BuildPanel.tsx` (~line 175). The backing store fn is
  `ReaderShell.onEditAnnotation` (`applyToCurrent`, ~line 291) — already passed as `onEdit` everywhere.
  The upload is an `<input type="file" accept="image/*">` → read the file → **downscale/compress** →
  store → patch.
- **Export model** (`src/v2/exportModel.ts`) — add an `images` field to `QuestionBlock` (~line 30) and
  `StudyNoteBlock` (~line 47), and write an **`imagesFor(a)`** beside `supportFor(a)` (~line 111),
  populated in the `.map(...)` at ~lines 140–169. Respect `reserved` (excluded, ~line 137) and
  `hideFromGroup` (study-note leader-only, in `participantBlocks`, ~line 188).
- **Print / preview** (`src/v2/print/ExportPreview.tsx`) — one component drives **both** the Build live
  preview and the print routes (so they can't drift). Mirror the `SupportPassage` sub-component (~line 43):
  render an `<img>` inside the block loops at ~lines 185–187 (question) and ~218–220 (study-note). Print is
  `window.print()` over the **live DOM** (`src/v2/print/PrintShell.tsx`), and `index.html` has **no CSP**,
  so `data:`/`blob:` `<img>` render freely. If bytes are stored as Blobs, add a **`resolveImageDataUrls(study)`**
  async step mirroring `src/v2/print/supportTexts.ts` `resolveSupportTextsV2`, and pass it in like the
  existing `supportTexts` prop (used by `src/v2/pages/PrintHandout.tsx` / `PrintLeader.tsx`).
- **Markdown** (`src/v2/exportMarkdown.ts`) — mirror `support(block)` (~line 21) with an image emitter.
  Self-contained markdown means `![caption](data:image/…;base64,…)` — flag the file-size bloat.

## THE key decision — where do the image bytes live? (settle with the owner first)
- **Option A — dedicated `STORE_IMAGES` object store** (bytes keyed by image id; annotation holds id only).
  Mirrors the **existing `passages` split** in `src/lib/storage/db.ts` (done precisely so the big,
  rarely-changed payload stays out of the constant autosave). Needs: a `DB_VERSION` bump (currently `1`) +
  `upgrade` branch; a store action analogous to `setPassage`/`putPassage`; the async `resolveImageDataUrls`
  before print; and **base64-encoding at project-export time** (Blobs can't round-trip `JSON.stringify` in
  `serializeStudy`). **Recommended** — keeps multi-MB bytes off the per-keystroke autosave path.
- **Option B — inline base64 data-URI string on the annotation.** Dead simple, round-trips in JSON for
  free, no DB bump. But every autosave re-serialises the whole study body (`putStudy`), so inline images
  make each save multi-MB. Only acceptable if images are aggressively downscaled to small thumbnails.

Either way: **downscale + compress on import** (e.g. cap the longest edge ~1600px, re-encode JPEG/WebP
~0.8 via a canvas) so IndexedDB and the exports stay sane; and reuse `src/hooks/useStorageEstimate.ts`
(`navigator.storage.estimate()`) for a size/quota warning.

## Open questions for the owner — ASK IN CHAT PROSE (owner dislikes the pop-up)
1. **Storage:** Option A (side blob store, recommended) or B (inline base64)?
2. **Downscale on import:** confirm we re-encode to a max edge (~1600px) + WebP/JPEG — the tool touches the
   *bytes* but not the *content*, so this is fine under rule 1. Owner OK?
3. **Which document(s)?** A **study-note** image prints for the group like the note itself (respecting
   `hideFromGroup` → leader-only). A **question** image — participant handout (a shared stimulus) *and*
   leader, or leader-only? Confirm.
4. **Caption/alt** — one short caption per image (prints under it + serves as alt text)? Recommend yes.
5. **One image per card or many?** If many, ordering (drag, or upload order)?
6. **Project file** (`.qth.json` export/import): embed image bytes as base64 (portable, bigger) or
   reference-only (lighter, images don't travel)? Recommend **embed** (work-never-lost + portable).
7. **Placement in print:** max width, and where relative to the question/answer/support-passage?

## Suggested slices (build one at a time; each gated + browser-verified + committed)
1. **Model + storage** — the `images` field on `Annotation`; the chosen storage (Option A: new store +
   `DB_VERSION` bump + store action + serialize/hydrate handling); downscale util. **Pure libs + unit
   tests, no UI.** Include a project-file round-trip test (export → import keeps images).
2. **Authoring** — `AttachImageRow` on question + study-note cards (upload → downscale → thumbnail →
   caption → remove), wired in `MarginAnnotations` (Write) and `BuildPanel` (Build). Browser-verify:
   attach, reload, still there. **Card affordance = Variant A (thumbnail strip) — DECIDED (owner,
   2026-08-13);** see the mockup `docs/mockups/v2-images.html` (an `🖼 add image` button beside
   `↗ add reference`; attached images as ~90px thumbnails with an inline caption + a delete corner).
3. **Export** — `imagesFor` + block fields + `ExportPreview` `<img>` render + `resolveImageDataUrls` for
   print + the markdown data-URI emitter. Browser-verify the **print route** shows the image
   (participant vs leader per the decision) and page-cuts sensibly.
4. **Polish** — quota warning (`useStorageEstimate`), `hideFromGroup` interaction, alt text, and a mockup
   pass if the card/print layout needs owner reaction.

## House rules (from CLAUDE.md — non-negotiable)
- **Prototype-led:** for any non-trivial UI (the card affordance, the print layout), build a mockup in
  `docs/mockups/*.html` and let the owner react **before** building. Present a plan and **pause for a go**
  on big steps. **Ask questions in chat prose**, not the AskUserQuestion pop-up.
- **Verify in a real browser (Playwright MCP)** — not just tests. For this feature that means: actually
  upload an image, reload, and open the **print route** to confirm it renders in the PDF/print view.
- **Gate before every commit:** `npm run typecheck && npm run lint && npm test && npm run build` +
  `npm run test:e2e`.
- **Work straight to `main`; drive your own commits + push.** **NEVER add Claude/Anthropic co-authorship**
  to commit messages (a `Claude-Session:` trailer is fine). Keep commits scoped to the slice; update
  `docs/PROGRESS.md` / `docs/V2-UX-BACKLOG.md` §6 when done.
- **Never generate the user's content** — the user supplies every image.

## Surface map — exact files, types, functions (read these)
**Model**
- `src/types/study.ts` — `AnnotationSchema`/`type Annotation` (~200–243, flat additive-optional);
  `ANNOTATION_KINDS` (~146); the mirror pattern `mentions`/`MentionMeta` (~158–167, 241);
  `CURRENT_SCHEMA_VERSION` (~22, currently `2`); `StudySchema`/`Study` (~411–433).
- `src/v2/annotations.ts` — `makeAnnotation` (~171), `annotationMeta` (~102), `toneFor` (~22).

**Authoring UI**
- `src/v2/reader/AttachReferenceRow.tsx` — **clone this** (`attach`/`remove` = `onEdit` patches, ~15–36).
- `src/v2/reader/MarginAnnotations.tsx` — `card(a)` (~165); `AttachReferenceRow` mount (~284); `onEdit` prop (~86).
- `src/v2/lenses/BuildPanel.tsx` — `AttachReferenceRow` mount (~175); per-card `onEdit` toggles.
- `src/v2/ReaderShell.tsx` — `onEditAnnotation` (~291, the `applyToCurrent` patch); `onSetMentionMeta` (~300, deep-merge shape).

**Export**
- `src/v2/exportModel.ts` — `QuestionBlock` (~30), `StudyNoteBlock` (~47), `ExportModel` (~60),
  `SupportRef`/`supportFor` (~23, ~111 — mirror as `ImageRef`/`imagesFor`), `participantBlocks` (~188),
  the `.filter(a=>!a.reserved)` (~137).
- `src/v2/exportMarkdown.ts` — `handoutMarkdown`/`leaderMarkdown` (~25, ~46), `support(block)` (~21).
- `src/v2/print/ExportPreview.tsx` — `ExportPreview` (~82), `SupportPassage` (~43, mirror it), block loops
  (~185–187, ~218–220), `supportTexts` prop (~74).
- `src/v2/print/supportTexts.ts` — `resolveSupportTextsV2` (~13, mirror as `resolveImageDataUrls`).
- `src/v2/pages/PrintHandout.tsx` / `PrintLeader.tsx`, `src/v2/print/PrintShell.tsx` (`window.print()`).
- `src/v2/lenses/CheckLens.tsx` — the download/print buttons; `src/v2/export.ts` — `downloadV2Handout/Leader`.

**Storage**
- `src/lib/storage/db.ts` — `getDB`, stores `STORE_STUDIES`/`STORE_PASSAGES`/`STORE_QUARANTINE`,
  `DB_VERSION` (~32, currently `1`). The `passages` split is the template for a `STORE_IMAGES` store.
- `src/lib/storage/studies.ts` — `putStudy` (~65, whole body per autosave), `getStudy`, `deleteStudy`
  (~83 — add image cleanup), `serializeStudy`/`importStudy` (~93, ~132 — JSON; Blobs don't round-trip).
- `src/lib/storage/hydrate.ts` — `hydrate` (~56); additive field = no migration; a bytes-side-store move = a `migrate` branch.
- `src/store/study.ts` — `useStudyStore`, `applyToCurrent` (~125), `flushSave` (~186), `setPassage` (~128,
  the side-store write template). `src/hooks/useAutosave.ts`, `src/hooks/useStorageEstimate.ts`.
- `src/lib/download.ts` — `downloadTextFile` (Blob + objectURL pattern).

**PWA** — `vite.config.ts` `VitePWA`/`workbox` (~30): user image bytes are runtime-only (IndexedDB), so
they're **outside** precache and the 2 MiB precache budget — no PWA/bundle change needed. No CSP in
`index.html`, so `data:`/`blob:` images render in app + print.

## Provenance
Written 2026-08-13, right after the v2 flow redesign + the §1/§2/§4 polish pass shipped (see
`docs/V2-UX-BACKLOG.md` §7/§7.8 and `docs/ROADMAP-v2.md` §5). This is the first §6 item to be picked up.
