#!/usr/bin/env bash
# Gracefully stop the continuous agents: they finish the current item, push, and exit.
#   ./scripts/agent-stop.sh          # graceful (default)
#   ./scripts/agent-stop.sh --now    # graceful + also kill any running agent-run.sh / claude
set -uo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
touch "$REPO_ROOT/docs/agents/STOP"
echo "Requested stop — agents will exit after the current turn."
if [ "${1:-}" = "--now" ]; then
  pkill -f 'scripts/agent-run.sh' 2>/dev/null && echo "killed agent-run.sh" || true
  pkill -f 'claude -p'            2>/dev/null && echo "killed running claude turn" || true
fi
