# Match-Engine Calibration Baseline — main @ b57aa88

Captured by `npx tsx shared/qa_calibration_baseline.ts` (N=1500 per headline metric, smaller N for the
pairwise/preset comparisons — see each line). This is a **measurement snapshot, not a pass/fail gate**
(`fuzz_test.ts`/`strategy_test.ts` already gate `npm run verify`) — it exists so a future reconcile against
an engine-tactics branch has a concrete, same-methodology number to diff against instead of eyeballing it.

To refresh: `npx tsx shared/qa_calibration_baseline.ts` (takes ~2-3 minutes on this machine — a full 90'
match costs ~35-40ms here, so keep N modest unless wall-clock time isn't a concern; override with
`QA_N=<n>`).

## Headline calibration (even-quality 13v13, default tactics, N=1500)

- **Goals/match (total):** 2.567 — home avg **1.266**, away avg **1.301**
- **0-0 rate:** 11.27%
- **Total-goals distribution:** 0g 11.3% · 1g 19.6% · 2g 24.3% · 3g 17.5% · 4g 12.2% · 5g 8.7% · 6g 3.7% · 7g 1.3% · 8g 1.0% · 9g 0.5%

## Equal-quality home/away split (quality swept 3..20, N=1500)

- **Home 38.40% / Away 39.07% / Draw 22.53%** — near-symmetric (away is marginally ahead here, well within
  noise at this N; not a home-advantage regression signal on its own, but worth re-checking against this
  exact number after a tactics change).

## Quality gradient (home q=13 fixed, away q varies, N=150/row)

| Away quality | Home (q=13) win rate |
|---|---|
| 5  | 95.3% |
| 9  | 86.7% |
| 13 | 35.3% *(mirrors the equal-quality split above, modulo home/away sample noise at N=150)* |
| 17 | 9.3% |
| 20 | 0.7% |

Monotonically decreasing as the away side gets stronger, as expected — no inversion.

## Strategy/tactics edges (`strategy_test.ts`-style, reproduced at slightly higher N here)

- **Preset head-to-heads (N=38/matchup):**
  - Gegenpress vs Park the Bus: **30W-7D-1L** (78.9%-18.4%-2.6%)
  - Tiki-Taka vs Route One: **22W-6D-10L** (57.9%-15.8%-26.3%)
  - Counter vs Gegenpress: **21W-4D-13L** (55.3%-10.5%-34.2%) — counter beats press, as designed
- **Duty — poacher vs target-man forward shots/match (N=50):** POACHER **26.00** vs TARGET-MAN **13.08**
  (ratio **1.99×** — a poacher line shoots almost twice as often)
- **Shape — wide (3-4-3) vs narrow (diamond 4-1-2-1-2), N=50:** **29W-8D-13L** (58.0%-16.0%-26.0%) — wide
  beats narrow
- **Anti-spam field check (N=10/matchup, 8-tactic field):** highest field-average win rate = **Tiki-Taka
  at 44.0%** — comfortably under `strategy_test.ts`'s `<60%` no-dominant-tactic gate

## What to watch for on reconcile

Re-run this same script against the merged/tactics-updated branch and diff line-for-line against the
numbers above. The tightest, most diagnostic signals to watch (least sample noise, most sensitive to a
tactics-formula change):
1. **Goals/match total** (2.567) and **0-0 rate** (11.27%) — the core scoring calibration.
2. **Poacher/target-man shot ratio** (1.99×) — directly tests `deriveMods`/duty-weighting math; a change
   here means the duty system's shot-generation weighting moved.
3. **Wide vs narrow win split** (58/16/26) and the three **preset head-to-heads** — these are the most
   sensitive to `tactics.ts`'s slider-to-modifier formulas (`attackPush`/`widthScale`/`directness`/etc.),
   so a real tactics-engine change should visibly move at least one of these, and an *unintended*
   regression (e.g. width no longer mattering) would show up as these collapsing toward 50/50.
4. **Anti-spam max field win rate** (44.0%, gate <60%) — if a tactics change accidentally makes one preset
   dominant, this is the number that will cross the line first.

A large swing in the quality-gradient table (home q=13 vs varying away quality) would instead point to the
stats-vs-tactics balance shifting (tactics starting to overpower raw ability, or vice versa) rather than a
tactics-specific bug — worth distinguishing from a #3-type tactics-formula regression.
