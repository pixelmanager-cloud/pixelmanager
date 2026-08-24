#!/usr/bin/env bash
#
# On-server dev agent — one task per invocation.
#   pulls main -> picks next open backlog task (no existing PR) -> runs headless
#   Claude Code on a fresh branch -> re-verifies (build + engine tests) -> opens a
#   PR for human review. Never pushes to main. Safe to run on a timer.
#
# Required env: ANTHROPIC_API_KEY, and `gh` authenticated for the repo.
# Optional env: REPO_DIR, MAX_RUNS_PER_DAY (default 12), MAX_TURNS (default 40),
#               TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/pixelmanager}"
cd "$REPO_DIR"
# shellcheck source=/dev/null
source agent/notify.sh

# --- kill switch ---
if [ -f agent/STOP ]; then echo "STOP file present — agent paused."; exit 0; fi

# --- daily budget cap (bounds API spend) ---
CAP="${MAX_RUNS_PER_DAY:-12}"
TODAY="$(date +%F)"
STATE="agent/.runstate"
COUNT=0
if [ -f "$STATE" ]; then read -r d c < "$STATE" || true; [ "${d:-}" = "$TODAY" ] && COUNT="${c:-0}"; fi
if [ "$COUNT" -ge "$CAP" ]; then echo "Daily run cap reached ($CAP)."; exit 0; fi

# --- sync to latest main ---
git checkout main --quiet
git fetch origin --quiet
git reset --hard origin/main --quiet
npm ci --silent

# --- choose the first open task that has no open PR yet (matched by branch slug) ---
slugify() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '-' | sed -E 's/-+/-/g; s/^-//; s/-$//' | cut -c1-40; }
OPEN_BRANCHES="$(gh pr list --state open --json headRefName -q '.[].headRefName' 2>/dev/null || true)"
TASK=""; SLUG=""
while IFS= read -r t; do
  [ -z "$t" ] && continue
  s="$(slugify "$t")"
  if printf '%s\n' "$OPEN_BRANCHES" | grep -q "^agent/${s}-"; then
    continue   # already has an open PR
  fi
  TASK="$t"; SLUG="$s"; break
done < <(grep -E '^- \[ \] ' agent/backlog.md | sed -E 's/^- \[ \] //')

if [ -z "$TASK" ]; then echo "No open tasks without a PR — nothing to do."; exit 0; fi
echo "Selected task: $TASK"

# --- fresh branch ---
BRANCH="agent/${SLUG}-$(date +%m%d%H%M)"
git checkout -b "$BRANCH" --quiet

# --- run the agent (headless Claude Code, no interactive prompts) ---
PROMPT="$(cat agent/AGENT.md)

## Your task for this run
$TASK

Implement it now, following every rule above. Remember: stay on this branch,
run \`npm run verify\` and make it pass, tick this task's box in agent/backlog.md,
then commit. Do not push or open a PR."

set +e
claude -p "$PROMPT" --dangerously-skip-permissions --max-turns "${MAX_TURNS:-40}" \
  > agent/last-report.txt 2>&1
set -e
echo "$TODAY $((COUNT + 1))" > "$STATE"   # count the run against the cap regardless of outcome

# --- authoritative verification gate (independent of what the agent claims) ---
if ! npm run verify > agent/verify.log 2>&1; then
  notify "❌ verify failed for: $TASK — no PR opened. Tail: $(tail -c 400 agent/verify.log)"
  git checkout main --quiet; git branch -D "$BRANCH" --quiet || true
  exit 1
fi

# --- did the agent actually change anything? ---
if git diff --quiet main -- . ':(exclude)agent/last-report.txt' ':(exclude)agent/verify.log'; then
  notify "⚠️ no changes produced for: $TASK (likely blocked). Report: $(tail -c 500 agent/last-report.txt)"
  git checkout main --quiet; git branch -D "$BRANCH" --quiet || true
  exit 0
fi

# --- commit anything left uncommitted, push, open PR ---
git add -A
git reset -q -- agent/last-report.txt agent/verify.log agent/.runstate 2>/dev/null || true
git commit -q -m "agent: $TASK" || true    # no-op if the agent already committed
git push -u origin "$BRANCH" --quiet

BODY="Automated PR from the on-server dev agent.

**Task:** ${TASK}

**Agent summary (tail):**
\`\`\`
$(tail -c 2500 agent/last-report.txt)
\`\`\`

\`npm run verify\` (client build + engine regression tests) passed locally before this PR was opened. CI will re-verify. Please review before merging."

# GitHub caps PR titles at 256 chars, so truncate; the full task is in the body.
TITLE="agent: $(printf '%s' "$TASK" | cut -c1-90)"
gh pr create --title "$TITLE" --body "$BODY" --base main --head "$BRANCH" >/dev/null
PR_URL="$(gh pr view "$BRANCH" --json url -q .url)"
notify "✅ opened PR for: $TASK
$PR_URL"
git checkout main --quiet
