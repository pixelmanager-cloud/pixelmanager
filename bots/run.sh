#!/usr/bin/env bash
# Overnight bug-hunt harness: a DISPOSABLE game server + N monkey bots (+ optional LLM
# bots) + a season-roller. Everything runs against a throwaway sqlite db that is wiped on
# start, so it never touches prod. Bugs land in bots/bugs.jsonl. Safe to nohup overnight.
#
# Env knobs: PORT, N_MONKEYS, LLM_BOTS, ROLL_MINUTES, ADMIN_SECRET,
#            LLM_BASE_URL/LLM_API_KEY/LLM_MODEL (for the LLM bots).
set -u
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"; BOTS="$ROOT/bots"
DB="$BOTS/bot-run.db"
PORT="${PORT:-8799}"
N_MONKEYS="${N_MONKEYS:-6}"
LLM_BOTS="${LLM_BOTS:-0}"
ROLL_MINUTES="${ROLL_MINUTES:-20}"
ADMIN_SECRET="${ADMIN_SECRET:-botsecret}"
export BUGLOG="$BOTS/bugs.jsonl"
export BOT_TARGET="http://localhost:$PORT"

PIDS=()
cleanup(){ echo "[run] stopping…"; for p in "${PIDS[@]:-}"; do kill "$p" 2>/dev/null; done; }
trap cleanup EXIT INT TERM

rm -f "$DB"* ; : > "$BOTS/server.log" ; : > "$BUGLOG"
echo "[run] $(date -u) starting throwaway server on :$PORT (db reset)"
FM_DB="$DB" PORT="$PORT" MATCHES_PER_DAY=100000 SCOUT_TRAVEL_SCALE=0 ADMIN_SECRET="$ADMIN_SECRET" \
  npm run start -w server > "$BOTS/server.log" 2>&1 &
PIDS+=($!)

for i in $(seq 1 60); do curl -sf "$BOT_TARGET/health" >/dev/null 2>&1 && break; sleep 1; done
if ! curl -sf "$BOT_TARGET/health" >/dev/null 2>&1; then echo "[run] server never came up:"; tail -20 "$BOTS/server.log"; exit 1; fi
echo "[run] server up"

for i in $(seq 1 "$N_MONKEYS"); do
  BOT_ID="m$i" node "$BOTS/monkey.mjs" > "$BOTS/monkey_$i.log" 2>&1 &
  PIDS+=($!)
done
echo "[run] launched $N_MONKEYS monkey bots"

if [ "${LLM_BOTS}" -gt 0 ] 2>/dev/null; then
  if [ -z "${LLM_API_KEY:-}" ] && [ -z "${LLM_BASE_URL:-}" ]; then
    echo "[run] LLM_BOTS=$LLM_BOTS but no LLM_API_KEY/LLM_BASE_URL set — skipping LLM bots"
  else
    for i in $(seq 1 "$LLM_BOTS"); do
      BOT_ID="llm$i" node "$BOTS/llm-bot.mjs" > "$BOTS/llm_$i.log" 2>&1 &
      PIDS+=($!)
    done
    echo "[run] launched $LLM_BOTS LLM bots (model ${LLM_MODEL:-?})"
  fi
fi

echo "[run] rolling seasons every ${ROLL_MINUTES}m; bugs → $BUGLOG"
while true; do
  sleep $((ROLL_MINUTES * 60))
  if curl -s -X POST "$BOT_TARGET/admin/rollover" -H "x-admin-secret: $ADMIN_SECRET" >/dev/null 2>&1; then
    echo "[roll] $(date -u +%H:%M) forced a season rollover"
  fi
done
