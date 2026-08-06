# content/ — deferrals & sweep notes

Working notes for later passes. **Not shipped to users.** Two sections:

1. Deferred content-structure enhancement ideas (from the owner).
2. How to run the citation/quote sweep (the flag log itself lives in frontmatter).

---

## 1. Deferred enhancements

**Richer per-field structure (owner, 2026-08-05).** Each help field could carry more than
the current tiers. Candidate structure per field:

- **brief explanation** — exists as `[inline]`.
- **longer explanation** — exists as `[expandable]`.
- **worked example** — the `[X]` tier target; deferred. Owner supplies it (Luke 1:39–80);
  it is not authored by the teaching-text agent (passage interpretation).
- **"what to avoid / what not to do"** — NEW. Partially covered globally by `warnings.yaml`
  (question warnings) and `traps.yaml` (Christ-connection traps), but there is no
  *per-field* version.
- **a quick self-test / litmus question** — NEW per-field. `litmus.yaml` (theme + per-type)
  and `audit.yaml` (Phase 7) cover some of this, but not per-field.

Status: **deferred for a later sweep.** The two genuinely new tiers ("avoid", "self-test")
would need the app to render new tiers, so they are partly dev work as well — note for a
dev session; out of the teaching-text remit.

**Suggested external resources — videos, summaries, commentaries (owner, 2026-08-06).**
Very non-essential; schedule **near the end**. Ideas for extending the resources / Further
Reading layer beyond books:

- Suggest **BibleProject videos** and **TGC book summaries** alongside the passage or book.
- Add **commentaries** as pointers (Calvin; TGC; etc.).

Status: **deferred, low priority.** Licensing caveat — link out rather than reproduce.
Calvin's commentaries are public domain (could be linked or, later, excerpted); BibleProject
and TGC content is not ours to reproduce, so these are signposts / links only. Fits as an
optional extension of the Phase E Further Reading page, not core method text.

---

## 2. Citation / quote sweep

Flags live in each content item's frontmatter `flag:` field (`help/**/*.md` and
`method/*.yaml`), so the flag summary is a scan. To list every open flag:

```
grep -rn "^flag:" content/ | grep -v "flag:$"
```

Each flag names the likely work and where to look, so a later sweep with more sources can
cite or quote-replace the text.

**Convention adopted (extends `content/README.md`):** *any* item may carry a `flag:` note
recording a hypothesised source, not only `state: flagged` items. `state` still reflects the
citation status (`cited` / `uncited`); `flag` is the sweep shortcut.

**Held this session (full or part):**
- ACS, *Preparing to Lead a Small Group Study* — full.
- Helm, *One-to-One Bible Reading* (COMA sheets) — full; verbatim by permission.
- Goldsworthy, *Preaching the Whole Bible as Christian Scripture* — part (intro, ch. 1–2, start ch. 3).
- Marshall, *Growth Groups* — part (front matter, intro, topic 1).
- Marshall & Payne, *The Trellis and the Vine* — part (front matter, ch. 1).

**Key held-back targets named in flags (priority for a later sweep):**
- Sweatman, *Writing a Small Group Study* (the single most on-point source; not held).
- *Growth Groups* topics 4 ("Preparing a Bible study", p. 31) and 6 ("Answers about questions", p. 53).
- Goldsworthy later chapters (esp. ch. 7) and *Gospel and Kingdom*.
- Jensen & Grimmond, *The Archer and the Arrow* (check first for theme-and-aim; Matthias-published).
- Robinson, *Biblical Preaching* ("the big idea").
- Chapell, *Christ-Centered Preaching* (Fallen Condition Focus; "deadly be's").
- Fee & Stuart, *How to Read the Bible for All Its Worth* (literary unit / genre).
- Simeon, *Horae Homileticae* preface (public domain; findable).
- Perkins, *The Arte of Prophecying* (public domain; findable).
