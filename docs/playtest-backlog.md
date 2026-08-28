# Playtest backlog — continuous testing findings

The living issue list produced by the playtest harness. Newest findings on top. Status: `[ ]` open · `[~]` in progress · `[x]` fixed.

## The harness (how testing runs)

Three complementary layers, because different problems need different tools:

1. **Headless balance/content probes** (`tools/playtest/*.ts`, `npm run playtest`) — simulate hundreds–thousands
   of careers/seasons through the deterministic engine, no browser. Catch *balance/content* issues at scale
   (is skilled play rewarded? is the rival beatable? can you climb the pyramid? are titles winnable?). Fast,
   parallel-safe, run anywhere (incl. Vultr overnight). This is the 24/7 workhorse.
   - `analyze_player_career.ts` — skilled-vs-random policy across many careers.
   - `analyze_manager_career.ts` — dynasty climb up the 10-tier pyramid.
2. **Browser UX agent** (`.claude/agents/ux-playtester.md`, Opus) — actually plays the game in-browser and
   critiques *interface/UX/content-feel* from a fresh-player POV (the layer that found the core card bugs).
   Best run as periodic passes while a session is live (it drives the one Browser pane, so passes serialise).
3. **This backlog** — findings from both layers, deduped + triaged, that we then fix.

**Constraints (honest):** the headless probes are deterministic, so continuous value comes from *sweeping
new seeds/configs* each pass, not re-running identical checks. Browser agents share one pane → they run one
at a time, not truly parallel. True survive-the-Mac-sleeping 24/7 = run the headless layer on a Vultr VPS
(the browser layer needs the desktop app). See [[feedback-overnight-vultr-agents]].

---

## Open findings

_None from the harness right now — the two launch-pass balance flags are fixed. New findings land here from the rotating cron passes (browser UX agent + probes)._

## Fixed (validated by the harness)

- [x] **PT-2 — top-flight titles too rare (~5%/season).** Top-tier transfer market now offers title-contender
  signings (headroom +3 at tiers 1–2) so an investing dynasty can build a squad that exceeds the league — an
  earned, coin-gated reward. Probe: title rate **5% → 18%**. `shared/src/transfermarket.ts`.
- [x] **PT-1 — ~24% of turns were a "bad hand"** (no fair-fit card, forced weak play). `ensurePlayableHand()`
  now swaps in a fair-fit card from the deck when the draw is dead; a dead hand only remains when the DECK
  itself can't answer (a deck-building signal). Probe: bad-hand **24% → 2%**, skilled Solid+ **71% → 94%**.
  `shared/src/career.ts`.
- [x] Core card loop: skilled play rewarded (Solid+ 71→94% vs random ~33%) — demand normalized by max not
  sum + variance cut. (was: perfect play routinely graded "Poor")
- [x] Rival beatable by good play (100% of skilled careers) after rate 6–9 → 3–5/turn. (was: impossible)
