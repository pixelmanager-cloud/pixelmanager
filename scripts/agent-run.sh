#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Overnight autonomous agents for Pixel Manager.
#
# Runs one or both scoped Claude Code agents (Sonnet), each on its OWN fresh branch
# off origin/main, each driven by its brief in docs/agents/. Each iteration asks the
# agent to implement exactly ONE backlog item, keep `npm run verify` green, and commit.
# At the end each agent's branch is pushed and a PR is opened for morning review.
#
# The agents run UNATTENDED with --dangerously-skip-permissions. That is deliberate and
# safe here because: (1) each works only on a throwaway branch, (2) nothing is merged
# automatically — you review and merge the PRs yourself, (3) they are scoped to separate
# lanes by their briefs. Never point this at your main branch.
#
# Usage:
#   ./scripts/agent-run.sh player      # just the player-career agent
#   ./scripts/agent-run.sh manager     # just the manager-career agent
#   ./scripts/agent-run.sh both        # both, sequentially (default)
#
# Keep the Mac awake for the whole run:
#   caffeinate -i ./scripts/agent-run.sh both
#
# Tunables (env):
#   ITERS=6        backlog items to attempt per agent (default 6)
#   MODEL=sonnet   model alias for the agents (default sonnet)
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

WHICH="${1:-both}"
ITERS="${ITERS:-6}"
MODEL="${MODEL:-sonnet}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
STAMP="$(date +%Y%m%d-%H%M)"
LOG_DIR="$REPO_ROOT/docs/agents/logs"
mkdir -p "$LOG_DIR"

log() { echo "[$(date +%H:%M:%S)] $*"; }

# ── preflight ────────────────────────────────────────────────────────────────
command -v claude >/dev/null 2>&1 || { echo "ERROR: 'claude' CLI not found in PATH."; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "ERROR: not inside a git repo."; exit 1; }
# gh is optional: with it we open PRs; without it we push branches and print the compare URL.
HAVE_GH=0
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then HAVE_GH=1; else
  log "note: 'gh' CLI not installed/authenticated — branches will be pushed and PR URLs printed instead of auto-opened."
  log "      (to auto-open PRs: 'brew install gh && gh auth login')"
fi
REMOTE_URL="$(git remote get-url origin 2>/dev/null)"
REPO_SLUG="$(echo "$REMOTE_URL" | sed -E 's#.*github.com[:/]+([^/]+/[^/.]+)(\.git)?#\1#')"

log "Fetching origin…"
git fetch origin -q

run_agent() {
  local name="$1" brief="docs/agents/$1-career-agent.md"
  local branch="agent/${name}-${STAMP}"
  local logf="$LOG_DIR/${name}-${STAMP}.log"
  [ -f "$brief" ] || { log "SKIP $name: brief $brief not found"; return; }

  log "=== ${name^^}-CAREER AGENT → branch $branch (${ITERS} iterations, model $MODEL) ==="
  # start clean from the latest main; leftover uncommitted work from a prior agent is discarded
  git reset --hard -q HEAD
  git switch -C "$branch" origin/main -q

  local base_commit; base_commit="$(git rev-parse HEAD)"
  for i in $(seq 1 "$ITERS"); do
    log "  [$name] iteration $i/$ITERS …"
    local prompt
    prompt="$(cat "$brief")

---
AUTONOMOUS RUN — branch \`$branch\`, iteration $i of $ITERS.
Follow the brief exactly. First check whether your queue file (docs/agents/queue/${name}.md) exists:
- If it does NOT exist yet: this is Phase 1 — brainstorm hard and write your ranked queue, then commit it.
- If it DOES exist: this is Phase 2+ — run \`git log --oneline origin/main..HEAD\` to see what's done, pick
  the TOP not-yet-done item in your queue, implement just that one item, run the required verification, and
  commit ONLY if green (item + queue tick together; revert and mark blocked if you cannot get it green).
Do exactly one thing this turn (either build the queue, or complete one queue item). Do NOT push and do NOT
open a PR — that is handled for you."
    claude -p "$prompt" --model "$MODEL" --dangerously-skip-permissions >>"$logf" 2>&1 \
      || log "  [$name] iteration $i exited non-zero (see $logf) — continuing"
  done

  local n_commits; n_commits="$(git rev-list --count "${base_commit}..HEAD")"
  if [ "$n_commits" -eq 0 ]; then
    log "  [$name] produced no commits — nothing to open a PR for."
    return
  fi

  log "  [$name] $n_commits commit(s). Pushing $branch…"
  git push -u origin "$branch" -q
  local body
  body="$(printf 'Autonomous overnight work by the **%s-career agent** (Sonnet), scoped by \x60docs/agents/%s-career-agent.md\x60, working its self-authored queue \x60docs/agents/queue/%s.md\x60.\n\n%s commit(s), roughly one queue item each. Every commit was made only with \x60npm run verify\x60 green.\n\n⚠️ Review carefully before merging — this is unattended agent output. Cherry-pick / drop individual commits as you see fit.\n\nSession log: \x60%s\x60' "$name" "$name" "$name" "$n_commits" "docs/agents/logs/${name}-${STAMP}.log")"
  if [ "$HAVE_GH" -eq 1 ]; then
    gh pr create --base main --head "$branch" \
      --title "Overnight ${name}-career agent — ${STAMP}" \
      --body "$body" >>"$logf" 2>&1 \
      && log "  [$name] PR opened." \
      || log "  [$name] PR creation failed (see $logf); branch is pushed — open it manually."
  else
    log "  [$name] branch pushed. Open a PR here:"
    log "    https://github.com/${REPO_SLUG}/compare/main...${branch}?expand=1"
  fi
}

case "$WHICH" in
  player)  run_agent player ;;
  manager) run_agent manager ;;
  both)    run_agent player; run_agent manager ;;
  *) echo "Usage: $0 [player|manager|both]"; exit 1 ;;
esac

# return the working tree to main for the morning
git reset --hard -q HEAD
git switch main -q 2>/dev/null || git switch -c main origin/main -q
log "Done. Review the PR(s) with:  gh pr list --state open"
