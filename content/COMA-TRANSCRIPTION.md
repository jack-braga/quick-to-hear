# COMA transcription — manual task (owner)

> Working note. **Not shipped to users.** This is a fill-in guide for transcribing
> `content/method/coma.yaml` by hand. The teaching-text session deliberately did **not**
> reproduce Helm's question wording (it is verbatim-by-permission content, and echoing it
> through the tooling tripped a content filter). You transcribe the exact wording from your
> own permitted copy; everything here is structure and instructions only.

## What this is

`content/method/coma.yaml` holds the six genre COMA question sets, reproduced **verbatim by
permission** from David Helm, *One-to-One Bible Reading* (© Matthias Media & Holy Trinity
Church, 2011). This is the one file in the project that is quoted rather than authored. You
type the exact question wording; you do not paraphrase or improve it.

## Where the text lives in the PDF

Source file on disk: `~/Downloads/quick-to-hear-docs/one-to-one-COMA.pdf` (21 pp).

- **pp. 2–13** — the six genre sheets, two pages each, in the order below. Each sheet is
  headed **Context / Observation / Meaning / Application**. **This is what goes into
  `coma.yaml`.**
- **pp. 14–21** — *"Eight weeks through Mark's Gospel"*, a sample reading plan (Weeks 1–8).
  **Do not transcribe this.** It is passage-specific (it quotes particular Mark texts), so it
  is not a reusable genre grid and does not belong in `coma.yaml`.

## Fill-in checklist (item counts per heading)

The `coma.yaml` skeleton already has the six genre keys and four empty lists each. Populate
each list to these counts, so you can confirm nothing was dropped or doubled:

| Genre (yaml key)                 | PDF pp. | Context | Observation | Meaning | Application |
|----------------------------------|:-------:|:-------:|:-----------:|:-------:|:-----------:|
| Gospels and Acts (`gospels-acts`)|  2–3    |   2     |     5       |   4     |     3       |
| OT narrative (`ot-narrative`)    |  4–5    |   2     |     5       |   4     |     2       |
| Epistles (`epistles`)            |  6–7    |   3     |     3       |   4     |     3       |
| Wisdom & poetry (`wisdom-poetry`)|  8–9    |   2     |     5       |   4     |     3       |
| Prophetic (`prophetic`)          | 10–11   |   3     |     4       |   3     |     4       |
| Apocalyptic (`apocalyptic`)      | 12–13   |   2     |     4       |   3     |     4       |

Each list item is **one bullet** from the sheet, verbatim, as a YAML string. Some bullets run
to more than one sentence (a question plus a follow-up prompt) — keep those as a **single**
string, exactly as printed. Preserve the printed detail: the curly quotes around `'editorial'`
and `'memories'`, the parenthetical asides, and British spellings (`behaviour`).

## Three things to set when the lists are full

1. `state: todo` → **`state: cited`**.
2. `source:` currently reads `OTOBR-Sheets-for-copying-A4.pdf`. The file you have is
   `one-to-one-COMA.pdf` (same content — the One-To-One Bible Reading copying sheets). Point
   it at whichever you actually transcribe from.
3. Leave the `attribution:` string as it is. Per `content/README.md` it is a **hard
   requirement** that this line renders on screen wherever COMA content appears, not only on
   the credits page. Keep it attached to the data so it cannot drift.

## Shape reminder (structure only — placeholder text, not Helm's wording)

```yaml
genres:
  epistles:
    context:
      - "First context bullet, verbatim from the sheet."
      - "Second context bullet, verbatim."
      - "Third context bullet, verbatim."
    observation:
      - "..."   # 3 items
    meaning:
      - "..."   # 4 items
    application:
      - "..."   # 3 items
```

## Notes

- **Until the lists are filled**, `coma.yaml` carries a `placeholder:` field with a
  user-visible "not the real questions yet" notice, meant to render wherever COMA prompts
  would appear while `state` is not `cited`. It stops showing the moment you set
  `state: cited`, so you cannot mistake the placeholder grid for Helm's real questions during
  testing. (The app needs to render that field for it to show.)
- Only `coma.yaml` is verbatim Helm. The rest of Phase 4 (`genres.yaml` reading tips and the
  `p4.*` help prose) is the project's own authored teaching text, drafted separately by the
  teaching-text session — no permission or filter issue there.
- The sheets carry no extra editorial framing to reproduce beyond the four category headings;
  the only attribution owed is the Matthias Media / HTC line already in the file.
- After entering the lists, validate the YAML before committing (a stray quote or colon inside
  a bullet is the likely failure mode).
