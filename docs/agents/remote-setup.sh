#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-shot bootstrap for running the overnight code agents on a fresh Linux box
# (e.g. a Vultr Ubuntu VPS). Idempotent — safe to re-run. Installs Node, the
# Claude Code CLI, the GitHub CLI, and clones/updates the repo.
#
# It does NOT store any secrets. After it finishes, you export your API key,
# authenticate gh, and launch the agents (it prints the exact commands).
#
# Usage on the box:
#   curl -fsSL https://raw.githubusercontent.com/pixelmanager-cloud/pixelmanager/main/docs/agents/remote-setup.sh | bash
#   # …or copy this file over and:  bash remote-setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="https://github.com/pixelmanager-cloud/pixelmanager.git"
REPO_DIR="${REPO_DIR:-$HOME/pixelmanager}"
SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"

say() { echo -e "\n\033[1;36m▶ $*\033[0m"; }

say "Updating apt + base tools"
$SUDO apt-get update -y -q
$SUDO apt-get install -y -q git curl ca-certificates tmux

if ! command -v node >/dev/null 2>&1; then
  say "Installing Node.js 20 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
  $SUDO apt-get install -y -q nodejs
else
  say "Node already present: $(node -v)"
fi

if ! command -v claude >/dev/null 2>&1; then
  say "Installing the Claude Code CLI (npm -g)"
  $SUDO npm install -g @anthropic-ai/claude-code
else
  say "claude already present: $(claude --version 2>/dev/null | head -1)"
fi

if ! command -v gh >/dev/null 2>&1; then
  say "Installing the GitHub CLI"
  $SUDO mkdir -p -m 755 /etc/apt/keyrings
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | $SUDO tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null
  $SUDO chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | $SUDO tee /etc/apt/sources.list.d/github-cli.list >/dev/null
  $SUDO apt-get update -y -q && $SUDO apt-get install -y -q gh
else
  say "gh already present: $(gh --version | head -1)"
fi

if [ -d "$REPO_DIR/.git" ]; then
  say "Repo exists — updating $REPO_DIR"
  git -C "$REPO_DIR" checkout main -q && git -C "$REPO_DIR" pull -q
else
  say "Cloning repo to $REPO_DIR"
  git clone -q "$REPO_URL" "$REPO_DIR"
fi

say "Installing npm dependencies"
( cd "$REPO_DIR" && npm install --no-audit --no-fund )

cat <<EOF

✔ Box is ready.  Now, one time:

  export ANTHROPIC_API_KEY=sk-ant-...      # your key (how claude auths headless)
  gh auth login                            # GitHub.com → HTTPS → paste a token

Then launch the agents in a persistent session:

  tmux new -s agents
  export ANTHROPIC_API_KEY=sk-ant-...      # re-export inside tmux
  cd "$REPO_DIR"
  ./scripts/agent-run.sh both
  # detach: Ctrl-b then d      reattach later: tmux attach -t agents

In the morning:  gh pr list --state open   (or review from your Mac)
EOF
