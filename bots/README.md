# Overnight bug-hunt harness

Automated players that hammer a **throwaway** game server overnight and log bugs.
Never point these at prod — they spawn junk accounts, spam matches, and force season
rollovers. `run.sh` starts its own disposable sqlite server (wiped on start).

## Run it

```bash
bash bots/run.sh
```

Env knobs (all optional):

| var | default | meaning |
|---|---|---|
| `PORT` | 8799 | throwaway server port |
| `N_MONKEYS` | 6 | deterministic monkey bots (no LLM, no tokens) |
| `LLM_BOTS` | 0 | LLM "curious human" bots (needs the `LLM_*` vars below) |
| `ROLL_MINUTES` | 20 | how often to force a season rollover |
| `ADMIN_SECRET` | botsecret | secret for the disposable server's admin routes |
| `LLM_BASE_URL` | — | OpenAI-compatible endpoint (e.g. a LiteLLM proxy `http://localhost:4000/v1`) |
| `LLM_API_KEY` | — | key for that endpoint |
| `LLM_MODEL` | gpt-4o-mini | model id (any LiteLLM-routable model — Grok/Gemini/DeepSeek/Haiku) |

Example with LLM bots via a LiteLLM proxy:

```bash
LLM_BOTS=2 LLM_BASE_URL=http://localhost:4000/v1 LLM_API_KEY=sk-... LLM_MODEL=claude-haiku-4-5-20251001 \
  N_MONKEYS=6 bash bots/run.sh
```

## What it checks

- **monkey.mjs** — random-but-valid actions (play matches, scout, upgrade facilities,
  trade) asserting invariants after each: 11 players/side with finite stats & positions,
  coins never negative, facility cost/level accounting, squad ≥ 11, no 5xx. On a match
  invariant break it captures the **seed + both teams** so the deterministic engine
  replays the failure exactly. Distinguishes legit 4xx rejections from real breakage.
- **llm-bot.mjs** — an LLM picks one action per turn and flags anything that looks
  broken/nonsensical (UX & logic bugs a scripted bot won't notice).

## Read the results

```bash
tail -f bots/bugs.jsonl          # bugs as they're found (JSONL)
cat bots/server.log              # the throwaway server's output (5xx stack traces)
```

Each bug line has `kind`, the endpoint, and (for match bugs) a `repro` blob with the seed.

## Stop it

```bash
pkill -f bots/run.sh; pkill -f bots/monkey.mjs; pkill -f bots/llm-bot.mjs; pkill -f 'tsx src/index.ts'
```
