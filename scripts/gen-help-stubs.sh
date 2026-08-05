#!/usr/bin/env bash
# Generate empty teaching-text stub files under content/help/.
#
# Source of truth for the help-key list (the app's useHelp(key) calls and the
# teaching-text agent both key off this). Re-run any time keys are added.
#
#   bash scripts/gen-help-stubs.sh
#
# NEVER clobbers an existing file — authored prose is safe. Only missing stubs
# are created. Each stub carries frontmatter (key/title/phase/tiers/state/source/
# flag) and empty tier sections. See content/README.md for the state/flag policy.

set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="content/help"

# phase | key | tiers (comma-sep) | title
ENTRIES=$(cat <<'EOF'
global|home.intro|inline,expandable|What this tool is
global|home.philosophy|expandable|Why a workbook, not a generator
global|global.guidance-toggle|inline|Guidance detail toggle
global|global.durability|inline|Your work lives only in this browser
global|global.progress|inline|How the phases fit together
global|attribution.inline|inline|Inline source credits
global|attribution.page|page|Attribution & further reading
1|p1.reference|inline|Passage reference
1|p1.genre|inline,expandable|Genre
1|p1.genre.gospels-acts|inline|Genre — Gospels & Acts
1|p1.genre.ot-narrative|inline|Genre — Old Testament narrative
1|p1.genre.epistles|inline|Genre — Epistles
1|p1.genre.wisdom-poetry|inline|Genre — Wisdom & poetry
1|p1.genre.prophetic|inline|Genre — Prophetic
1|p1.genre.apocalyptic|inline|Genre — Apocalyptic
1|p1.format|inline|Study or talk
1|p1.duration|inline|Duration
1|p1.group|inline,expandable|Group composition
1|p1.series|inline|Series note
1|p1.getpassage|inline|Getting the passage in
1|p1.review|inline,expandable|Review the parse
1|p1.primary|inline,expandable|Primary translation
1|p1.comparison|inline,expandable|Comparing translations
1|p1.mismatch|inline|Versification mismatch flag
1|p1.change-primary|inline|Changing the primary translation
2|p2.pray|inline,expandable|Pray first
2|p2.read|inline,expandable|Read it several times
2|p2.counter|inline|Read counter
2|p2.quiet|expandable|Why this screen is quiet
3|p3.structure|inline,expandable|Divide into sections
3|p3.boundaries|expandable|Boundary help
3|p3.marks|inline,expandable|Mark what confuses you
4|p4.overview|inline,expandable|What COMA is for
4|p4.context|inline|Context
4|p4.observation|inline|Observation
4|p4.meaning|inline|Meaning
4|p4.application|inline|Application
4|p4.anchoring|inline|Anchoring a note to verses
4|p4.genre-reading|inline|Reading by genre
5|p5.theme|inline,expandable|Theme
5|p5.author-aim|inline,expandable|The author's aim
5|p5.group-aim|inline,expandable|Your aim for the group
5|p5.know-feel-do|inline,expandable|Know / feel / do
5|p5.faithfulness|inline,expandable|Faithfulness is not certainty
5|p5.christ-route|inline,expandable|How the passage gets to Christ
5|p5.credits|inline|Sources behind this phase
6|p6a.weight|inline|Weight the sections
6|p6b.budget|inline,expandable|The question budget
6|p6c.generate|inline|Generate wide
6|p6.recycled|inline|Recycled candidates
6|p6d.cut|inline|Cut
6|p6e.expected|inline,expandable|Expected answer (required)
6|p6e.type|inline|Question type
6|p6e.weight|inline|Question weight
6|p6e.loadbearing|inline|Load-bearing question
6|p6e.wrongturns|inline|Anticipated wrong turns
6|p6e.pastoral|inline|Pastoral sensitivity
6|p6f.support|inline,expandable|Support passages
6|p6f.return|inline,expandable|The return question
6|p6g.sequence|inline,expandable|Sequencing
6|p6h.prayer|inline|Prayer point
7|p7.audit.intro|inline|The audit
7|p7.coverage|inline,expandable|Coverage map
7|p7.gospel-plain|inline|The gospel-plain question
7|p7.export.handout|inline|Participant handout
7|p7.export.leader|inline|Leader's notes
7|p7.export.project|inline|Project file
EOF
)

created=0
skipped=0
while IFS='|' read -r phase key tiers title; do
  [ -z "${key:-}" ] && continue
  case "$phase" in
    global) dir="$ROOT/global" ;;
    *)      dir="$ROOT/phase$phase" ;;
  esac
  mkdir -p "$dir"
  file="$dir/$key.md"
  if [ -e "$file" ]; then skipped=$((skipped+1)); continue; fi

  {
    echo "---"
    echo "key: $key"
    echo "title: $title"
    echo "phase: $phase"
    echo "tiers: [$tiers]"
    echo "state: todo        # todo -> cited | uncited | flagged (see content/README.md)"
    echo "source:            # inline attribution string, ONLY when state: cited"
    echo "flag:              # what would settle it + where to look, ONLY when state: flagged"
    echo "---"
    echo ""
    IFS=',' read -ra T <<< "$tiers"
    for t in "${T[@]}"; do
      echo "<!-- $t -->"
      echo ""
    done
  } > "$file"
  created=$((created+1))
done <<< "$ENTRIES"

echo "help stubs: $created created, $skipped skipped (already exist)"
