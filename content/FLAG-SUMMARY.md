# FLAG SUMMARY — citation sweep worklist (internal)

> Working note. **Not shipped to users.** Deliverable 6. Every open `flag:` in `content/`,
> grouped by the held-back source that would settle it, so a later sweep can act without a
> code search. Generated from the `flag:` fields in `help/**/*.md` and `method/*.yaml`.
> Re-scan with: `grep -rn "^flag:" content/help/` and the per-item `flag:` in `method/*.yaml`.
>
> **Governing rule:** an uncited true statement is fine; a cited false one is not. Everything
> below currently **ships uncited (or, for `translations.yaml`, flagged)** and is correct as-is.
> A flag is an *opportunity* to cite or enrich if a source is obtained, not a defect.

---

## 1. Fee & Stuart, *How to Read the Bible for All Its Worth* (not held) — the largest cluster
Genre, the literary unit, observation/meaning technique, translations chapter.
- **Genre taxonomy:** `p1.genre`, `p1.genre.gospels-acts`, `.ot-narrative`, `.epistles`,
  `.wisdom-poetry`, `.prophetic`, `.apocalyptic`, `p4.genre-reading`; `genres.yaml` (all 6 tips).
- **Literary unit / author's breaks:** `p3.boundaries`, `p3.structure`.
- **Translations (its own chapter):** `p1.comparison`.
- **Observation moves:** `formulas.yaml` count-or-list, track-the-subject, compare, odd-grammar,
  structure, absence.
- **Meaning moves:** logic-and-connection, cause-and-purpose, proportion-emphasis, counterfactual,
  tension-resolution, original-hearing (historical context).
- **Context formats:** where-in-the-book, whats-just-happened (spec never enumerated these).
- **Application:** book-stated-purpose.
- **Litmus:** author-recognise (authorial intent; also Duvall & Hays, *Grasping God's Word*, not held).
→ **Action:** obtain Fee & Stuart; check the genre chapters, the literary-unit discussion, the
  translations chapter, and the inductive observation/meaning technique; cite or enrich where matched.

## 2. Richard Sweatman, *Writing a Small Group Study* (Matthias Media, 2018 — held-back)
The single most on-point book for the tool's task; title/publisher confirmed.
- **Question craft:** `p6e.expected`, `warnings.yaml` (yes-no, leading, double-barrelled).
- **Formula wording:** the observation moves (with Fee & Stuart), hunt-purpose-clauses.
→ **Action:** obtain Sweatman; check question-writing craft, expected answers, and the
  open/closed/leading/double-barrelled material; cite or enrich.

## 3. Colin Marshall, *Growth Groups* — specific held-back topics
- **Topic 6, "Answers about questions" (p. 53):** `warnings.yaml` (all 3), `litmus.yaml`
  observation (worth-having / easy-not-trivial), `p6e.expected`.
- **Topic 4, "Preparing a Bible study" (p. 31):** `p6b.budget` (question quantities / timings).
- **Word ministry / training (with *The Trellis and the Vine*):** `home.philosophy`.
→ **Action:** obtain the held-back *Growth Groups* topics 4 and 6 (pp. 31, 53); reconcile the
  budget numbers and the question-craft; check to cite.

## 4. Haddon Robinson, *Biblical Preaching* (not held) — the "big idea" (idea + purpose)
- `p5.theme` (the exegetical-idea-plus-purpose definition), `p5.author-aim`, `p5.credits`,
  `litmus.yaml` needs-this-passage + contributes-uniquely, `stuck-helpers.yaml`
  load-bearing-sentence, `formulas.yaml` summary.
→ **Action:** obtain Robinson; check the big-idea definition (idea + purpose); cite the theme/aim
  material if it matches; otherwise it stays the project's own. **Do not inline-credit unless read.**

## 5. Bryan Chapell, *Christ-Centered Preaching* (not held) — the Fallen Condition Focus
- `p5.author-aim` (the reader-effect side), `p5.credits`, `stuck-helpers.yaml` what-is-it-against,
  `formulas.yaml` locate-the-pressure.
→ **Action:** obtain Chapell; check the FCF; cite or reword the "what is it against" / "locate the
  pressure" heuristics if matched. **Do not inline-credit unless read.**

## 6. Goldsworthy — later chapters / *Gospel and Kingdom* (partly held)
Intro + chs. 1-2 and start of ch. 3 were read; later chapters were **not**.
- **The connection-route list** (a promise, a covenant, an office, an institution, an unsolved
  problem) is the project's own → `p5.christ-route`: check ch. 7 ("How Does the Gospel Function in
  the Bible?") or *Gospel and Kingdom* for an enumeration.
- **Allegory** and **Christless preaching** are not in the held chapters → `traps.yaml`: check
  later chapters (allegory/typology; ch. 9 on Christless preaching).
→ **Action:** obtain the later chapters or *Gospel and Kingdom*; cite if matched. (`p4.overview`,
  `home.philosophy`, `p5.credits`, `p5.christ-route`, `traps.yaml` already cite what *was* read.)

## 7. Jensen & Grimmond, *The Archer and the Arrow* (Matthias Media, not held)
Closest to the tradition on theme-and-aim.
- `p5.author-aim` — check this **first** for the theme-and-aim-as-a-pair / aim-as-effect lineage.
→ **Action:** obtain; cite if it matches; otherwise the framing stays the project's own.

## 8. ACS, *Preparing a Small Group Study* (HELD) — ships UNCITED by owner decision
Documented for the record; **no action needed** unless the owner reverses the ship-uncited call.
- `p3.structure` (divide-and-head), `p3.boundaries` (movements of thought), `p5.theme` (big-idea
  phrasing), `p5.know-feel-do` (thinking/speaking/acting/loving; corporate), `p6e.expected`
  (sec. iv.3), `stuck-helpers.yaml` tell-it-back + load-bearing-sentence, `formulas.yaml` summary.

## 9. Low priority / minor
- **Reformed indicative-imperative** (Ridderbos, Bavinck; not held): `formulas.yaml`
  invert-the-indicative. Broad staple; unlikely to need citing.
- **Public-domain classics** (findable): Simeon, *Horae Homileticae* (preface); Perkins, *The Arte
  of Prophecying* — support the text-sets-the-aim tradition; on the Further Reading page.

---

## Not teaching-text (outside this remit)
- **`content/method/translations.yaml`** carries 3 `state: flagged` items. This is bundled-
  translation config (ids → display name + copyright line), authored by the dev/build side, not by
  the teaching-text pass. Left as found; noted here only so the flag scan is complete.

## Genuinely the project's own (nothing to chase)
The hard-block enforcement of the expected answer; the four-way trap table and its checks; the
connection-route list; the coverage tags; faithfulness-is-not-certainty; "the struggle is the
training"; the boundary-problem claim; and most stem wording. No source will "settle" these; they
are the tool's design and stand on their own.
