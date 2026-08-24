# Setting up the on-server dev agent on Vultr

This runs a headless Claude Code developer that works through `agent/backlog.md`,
one task at a time, and opens a PR for each. It **never** pushes to `main`; every
change goes through a PR gated by CI, which you review and merge (Netlify builds a
deploy preview for each PR automatically).

You run the steps below on the server. Claude cannot do these — they need your
Vultr account, an Anthropic API key, and a GitHub token.

---

## 1. Provision the box
Create a Vultr **Ubuntu 24.04** instance (the smallest "Regular" plan is plenty —
this is a build box, not a web server). SSH in as a non-root user (create one with
`adduser dev && usermod -aG sudo dev` if needed), then work as that user.

## 2. Install the toolchain
```bash
# Node 20 + git + gh (GitHub CLI)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo mkdir -p -m 755 /etc/apt/keyrings && \
  wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null && \
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null && \
  sudo apt-get update && sudo apt-get install -y gh

# Claude Code
npm install -g @anthropic-ai/claude-code
```

## 3. Clone the repo
```bash
cd ~ && git clone https://github.com/pixelmanager-cloud/pixelmanager.git ~/pixelmanager
cd ~/pixelmanager && npm ci
git config user.name "pixelmanager dev-agent"
git config user.email "your-agent-email@example.com"
```

## 4. Authenticate GitHub (for pushing branches + opening PRs)
```bash
gh auth login          # choose HTTPS, paste a token with 'repo' + 'workflow' scope
gh auth setup-git      # makes git use gh's credentials
```
Tip: create a **fine-grained Personal Access Token** limited to just the
`pixelmanager` repo (Contents: read/write, Pull requests: read/write).

## 5. Secrets file (never committed — it's gitignored)
```bash
cat > ~/pixelmanager/agent/.env <<'EOF'
ANTHROPIC_API_KEY=sk-ant-...           # your Anthropic key
REPO_DIR=/home/YOURUSER/pixelmanager
MAX_RUNS_PER_DAY=12                     # hard cap on agent runs/day (spend guardrail)
MAX_TURNS=40                            # cap tool-steps per run
# Optional Telegram status pings (reuse your existing bot):
# TELEGRAM_BOT_TOKEN=123:abc
# TELEGRAM_CHAT_ID=123456
EOF
chmod 600 ~/pixelmanager/agent/.env
```

## 6. Smoke-test one run by hand
```bash
cd ~/pixelmanager
set -a && source agent/.env && set +a
bash agent/run.sh
```
It should pick the top backlog task, work on a branch, run `npm run verify`, and
open a PR. Check GitHub for the PR and its Netlify preview link.

## 7. Put it on a schedule (systemd timer)
```bash
mkdir -p ~/.config/systemd/user
cp ~/pixelmanager/agent/agent-dev.service ~/.config/systemd/user/
cp ~/pixelmanager/agent/agent-dev.timer   ~/.config/systemd/user/
# the unit uses %h/%i; simplest is to hardcode paths for a single user:
sed -i "s|%h|$HOME|g; s|User=%i|User=$USER|g" ~/.config/systemd/user/agent-dev.service
systemctl --user daemon-reload
systemctl --user enable --now agent-dev.timer
sudo loginctl enable-linger "$USER"   # keep the timer running when you're logged out
```
Watch it: `journalctl --user -u agent-dev.service -f`

---

## Controlling the agent day to day
- **Give it work:** edit `agent/backlog.md` on `main` (add `- [ ]` tasks, top =
  next). It picks up new tasks on the next run. You can edit it via GitHub directly.
- **Pause it:** `touch ~/pixelmanager/agent/STOP` (delete the file to resume).
- **Change the budget:** edit `MAX_RUNS_PER_DAY` in `agent/.env`.
- **Change cadence:** edit `OnUnitActiveSec` in the timer, then
  `systemctl --user daemon-reload && systemctl --user restart agent-dev.timer`.
- **Review its work:** each task arrives as a PR with a Netlify preview. Merge to
  ship, or comment/close to reject. Nothing reaches the live site without you.

## Safety recap
- Agent works only on `agent/*` branches; **never** on `main`.
- Every PR must pass CI (`npm run verify`) before it can merge.
- Daily run cap + per-run turn cap bound API spend.
- Secrets stay in `agent/.env` (chmod 600, gitignored); the agent is told never
  to read or commit them.
- `agent/STOP` is an instant kill switch.
