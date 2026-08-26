#!/usr/bin/env bash
# Launch the whole LOCAL web3 stack for the career+manager loop:
#   1) Anvil (local chain), 2) deploy LifecycleNFT, 3) the game server (chain-wired),
#   4) the Vite client. Then open http://localhost:5173 and play.
#
# Usage:   ./scripts/dev-web3.sh            (starts everything)
#          ./scripts/dev-web3.sh --fresh    (also wipes the off-chain dev DB tokens)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$PATH:$HOME/.foundry/bin"

# Anvil's deterministic first-deploy address + first dev key (stable across fresh Anvil runs).
LIFECYCLE_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
DEV_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

echo "▸ (re)starting Anvil…"
pkill -f anvil 2>/dev/null || true; sleep 1
( anvil > /tmp/anvil.log 2>&1 & )
sleep 3

echo "▸ deploying LifecycleNFT to Anvil…"
( cd "$ROOT/contracts" && SUPPLY_CAP=10000 forge script script/DeployLifecycleNFT.s.sol \
    --rpc-url http://127.0.0.1:8545 --private-key "$DEV_KEY" --broadcast 2>&1 | grep -iE "deployed at" )

if [ "$1" = "--fresh" ]; then
  echo "▸ wiping off-chain dev tokens (fresh start on wallet-owned)…"
  sqlite3 "$ROOT/server/fm.db" "DELETE FROM tokens; DELETE FROM player_stats; DELETE FROM awards;" 2>/dev/null || true
fi

echo "▸ starting the game server (:8787, chain-wired)…"
lsof -ti:8787 | xargs kill 2>/dev/null || true; sleep 1
( cd "$ROOT/server" && \
  FM_DB=fm.db ADMIN_SECRET=devtest \
  LIFECYCLE_ADDRESS=$LIFECYCLE_ADDRESS \
  LIFECYCLE_RPC=http://127.0.0.1:8545 \
  LIFECYCLE_CHAIN_ID=31337 \
  LIFECYCLE_SIGNER_KEY=$DEV_KEY \
  npm run dev > /tmp/fmserver.log 2>&1 & )
sleep 4

echo "▸ starting the Vite client (:5173)…"
lsof -ti:5173 | xargs kill 2>/dev/null || true; sleep 1
( cd "$ROOT/client" && npm run dev > /tmp/fmclient.log 2>&1 & )
sleep 3

echo ""
echo "✅ Local web3 stack up. Play at:  http://localhost:5173"
echo "   login: devbuild / devpass123   (or Create Club)"
echo "   logs:  /tmp/anvil.log  /tmp/fmserver.log  /tmp/fmclient.log"
