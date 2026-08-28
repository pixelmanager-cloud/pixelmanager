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

_(both launch-pass balance flags fixed 2026-08-28 — see below)_

- [x] **PT-2 (manager balance): top-flight titles are too rare (~5%/season).** FIXED — top-tier transfer market now offers title-contender signings (headroom +3 at tiers 1–2) so an investing dynasty can build a squad that exceeds the league. Probe: title rate 5% → **18%**. A peak club that has climbed to
  tier 1 wins the league only ~5% of seasons — climbing is achievable (94%) but *winning* the top flight is a
  grind. Target 12–25%. Likely the peak club-strength arc is too low vs `tierStrength(1)`, or the top tier's
  spread is too tight. Source: `analyze_manager_career.ts`. `shared/src/clubseason.ts`.
- [x] **PT-1 (player content): ~24% of turns are a "bad hand"** FIXED — `ensurePlayableHand()` swaps in a fair-fit card from the deck when the draw is dead. Probe: bad-hand 24% → **2%**, skilled Solid+ 71% → **94%**. — no card in the drawn hand gets even a fair
  fit for the demand, forcing a weak play with no acknowledgement. Under the 25% flag threshold but worth
  improving: guarantee a fair-fit card in the draw, or have the narration acknowledge "nothing in his locker
  fit this" instead of implying the player misplayed. Source: `analyze_player_career.ts`. `shared/src/career.ts` refillHand.

## Fixed (validated by the harness)

- [x] Core card loop: skilled play now rewarded (Solid+ **71%** vs random 27%) after demand normalized by max
  not sum + variance cut. (was: perfect play routinely graded "Poor")
- [x] Rival now beatable by good play (**100%** of skilled careers vs 9% random) after rate 6–9 → 3–5/turn.
  (was: mathematically impossible to keep pace)
