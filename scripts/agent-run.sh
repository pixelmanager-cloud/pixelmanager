#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CONTINUOUS overnight autonomous devs for Pixel Manager.
#
# Each agent (Sonnet) works forever on its OWN evergreen branch: it brainstorms a
# ranked queue, works it down one committed item at a time, and when the queue is
# empty it brainstorms MORE goals and keeps going. Its PR is kept live so you just
# review the accumulated commits each morning and merge what you like — when a PR is
# merged, the agent picks up the new main and carries on.
#
# The two agents INTERLEAVE on a single checkout (one commits, then the other), so
# no worktrees are needed. Each keeps `npm run verify` green before committing.
#
# Usage:
#   ./scripts/agent-run.sh both      # both agents, forever (default)
#   ./scripts/agent-run.sh player    # just one, forever
#
# STOP it gracefully (finishes the current item, pushes, exits):
#   ./scripts/agent-stop.sh           # or:  touch docs/agents/STOP
#
# Tunables (env):
#   MODEL=sonnet     model alias (default sonnet)
#   PACE_SECS=20     pause between cycles (default 20s)
#   MAX_CYCLES=0     0 = run forever; N = stop after N cycles per agent
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

WHICH="${1:-both}"
MODEL="${MODEL:-sonnet}"
PACE_SECS="${PACE_SECS:-20}"
MAX_CYCLES="${MAX_CYCLES:-0}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
LOG_DIR="$REPO_ROOT/docs/agents/logs"; mkdir -p "$LOG_DIR"
STOPFILE="$REPO_ROOT/docs/agents/STOP"
rm -f "$STOPFILE"

log() { echo "[$(date +%H:%M:%S)] $*"; }

command -v claude >/dev/null 2>&1 || { echo "ERROR: 'claude' CLI not found in PATH."; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "ERROR: not inside a git repo."; exit 1; }
HAVE_GH=0
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then HAVE_GH=1; else
  log "note: 'gh' not installed/authenticated — branches are pushed and PR URLs printed instead of auto-opened/managed."
fi
REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
REPO_SLUG="$(echo "$REMOTE_URL" | sed -E 's#.*github.com[:/]+([^/]+/[^/.]+)(\.git)?#\1#')"

case "$WHICH" in
  player)  AGENTS=(player) ;;
  manager) AGENTS=(manager) ;;
  both)    AGENTS=(player manager) ;;
  *) echo "Usage: $0 [player|manager|both]"; exit 1 ;;
esac

# ── ensure the agent's evergreen branch is checked out (reuse local/remote, else fork main)
checkout_branch() {
  local name="$1" branch="agent/$name"
  git reset --hard -q HEAD 2>/dev/null || true   # clear any stragglers (commits are preserved)
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    git switch -q "$branch"
  elif git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
    git switch -q -c "$branch" "origin/$branch"
  else
    git switch -q -C "$branch" origin/main
  fi
}

# ── keep the PR live: open one when there's work; if it was MERGED, roll onto the new main
sync_pr() {
  local name="$1" branch="agent/$name"
  git push -q -u origin "$branch" 2>>"$LOG_DIR/$name.log" || log "  [$name] push failed (see log)"
  [ "$HAVE_GH" -eq 1 ] || { log "  [$name] PR: https://github.com/${REPO_SLUG}/compare/main...${branch}?expand=1"; return; }
  local state; state="$(gh pr view "$branch" --json state -q .state 2>/dev/null || echo NONE)"
  if [ "$state" = "MERGED" ]; then
    log "  [$name] previous PR merged — rolling branch onto the new main."
    git fetch origin -q; git reset --hard -q origin/main; git push -q -f origin "$branch" 2>/dev/null || true
  elif [ "$state" = "NONE" ] || [ "$state" = "CLOSED" ]; then
    if [ "$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)" -gt 0 ]; then
      gh pr create --base main --head "$branch" \
        --title "Autonomous ${name}-career agent (live)" \
        --body "$(printf 'Continuous autonomous work by the **%s-career agent** (Sonnet), scoped by \x60docs/agents/%s-career-agent.md\x60, working its self-authored, self-replenishing queue \x60docs/agents/queue/%s.md\x60.\n\nThis PR updates live as the agent works. Every commit is made only with \x60npm run verify\x60 green.\n\n⚠️ Unattended agent output — review before merging; cherry-pick / drop commits freely. Merging this PR makes the agent roll onto the new main and continue.' "$name" "$name" "$name")" \
        >>"$LOG_DIR/$name.log" 2>&1 && log "  [$name] opened a fresh PR." || true
    fi
  fi
}

# ── one turn of the agent (brainstorm the queue, or complete one queue item)
one_turn() {
  local name="$1" brief="docs/agents/$name-career-agent.md" branch="agent/$name"
  local prompt
  prompt="$(cat "$brief")

---
CONTINUOUS AUTONOMOUS RUN — branch \`$branch\`. You run in an endless loop; this is one turn.
Check your queue file \`docs/agents/queue/$name.md\`:
- If it does NOT exist: brainstorm hard and write your ranked queue, then commit it.
- If it exists but EVERY item is already ticked done: brainstorm 8–12 brand-new goals, append them
  (ranked), and commit the queue update — never run out of ambition.
- Otherwise: implement the TOP not-yet-done item, run the required verification, and commit ONLY if green
  (tick the item in the queue in the same commit; if you cannot get it green, revert with
  \`git checkout -- .\` and mark it blocked).
Do exactly ONE thing this turn. Do NOT push and do NOT open a PR — that is handled for you."
  claude -p "$prompt" --model "$MODEL" --dangerously-skip-permissions >>"$LOG_DIR/$name.log" 2>&1
}

log "Starting CONTINUOUS agents: ${AGENTS[*]}  (model $MODEL, pace ${PACE_SECS}s, max_cycles ${MAX_CYCLES})"
log "Stop anytime with: ./scripts/agent-stop.sh   (or: touch docs/agents/STOP)"
git fetch origin -q || true

cycle=0
fails=0
while :; do
  [ -f "$STOPFILE" ] && { log "STOP file seen — exiting after $cycle cycle(s)."; break; }
  [ "$MAX_CYCLES" -gt 0 ] && [ "$cycle" -ge "$MAX_CYCLES" ] && { log "Reached MAX_CYCLES=$MAX_CYCLES — exiting."; break; }
  cycle=$((cycle+1))
  for name in "${AGENTS[@]}"; do
    [ -f "$STOPFILE" ] && break
    log "cycle $cycle · [$name] working…"
    checkout_branch "$name"
    local_before="$(git rev-parse HEAD)"
    if one_turn "$name"; then fails=0; else
      fails=$((fails+1)); log "  [$name] claude exited non-zero (fail streak $fails). See $LOG_DIR/$name.log"
      if [ "$fails" -ge 6 ]; then log "6 consecutive failures — check the API key / setup. Exiting."; exit 1; fi
      sleep 30; continue
    fi
    if [ "$(git rev-parse HEAD)" != "$local_before" ]; then
      log "  [$name] committed — syncing PR."
      sync_pr "$name"
    else
      log "  [$name] no commit this turn."
    fi
  done
  # return the working tree to main between cycles so a human peeking sees a clean checkout
  git reset --hard -q HEAD 2>/dev/null || true
  git switch -q main 2>/dev/null || git switch -q -C main origin/main
  [ -f "$STOPFILE" ] && { log "STOP file seen — exiting."; break; }
  sleep "$PACE_SECS"
done

git reset --hard -q HEAD 2>/dev/null || true
git switch -q main 2>/dev/null || true
rm -f "$STOPFILE"
log "Agents stopped. Review live/most-recent PRs with:  gh pr list --state open"
