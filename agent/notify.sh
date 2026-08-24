#!/usr/bin/env bash
# Sends a status line to Telegram if TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set,
# and always echoes it to the log. Sourced by run.sh.
notify() {
  local msg="$1"
  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_CHAT_ID}" \
      --data-urlencode "text=🤖 dev-agent: ${msg}" >/dev/null 2>&1 || true
  fi
  echo "[notify] ${msg}"
}
