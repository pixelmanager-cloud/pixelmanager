# QA / Sim / Bug-Hunt Report — Football Royalty

Living report from the QA sim-fuzzing agent. Base commit: `b57aa88` (confirmed via `git log --oneline -1`
after `git reset --hard main`; both `npm run verify` and `npx tsx shared/career_sim.ts` were GREEN before
any QA work began).

## UPDATE — 2026-08-27, offline-first repair + relaunch pass (base commit `4601959`)

Fresh `git reset --hard main` picked up a large stretch of intervening work, most importantly a full
**offline-first pivot**: the entire `server/` directory (web3/multiplayer/marketplace layer) is now
GONE from the repo — the game is a pure client-side, offline single-player app (`client/src/api.ts` is
now the "server", backed by a local `LocalStore`). This retroactively resolved two of this report's
findings and broke three harnesses that imported from the now-deleted `server/src/*`:

- **H1 (unbounded coin mint via repeated `POST /sp/season-reward`/`POST /sp/sponsor`) — RESOLVED BY
  REMOVAL.** There is no server, no network endpoint, and no other player's economy to defend in an
  offline single-player game — calling your own local save's reward function repeatedly only affects
  your own save, the same as any other single-player economy lever. Not re-flagged.
- **M3 (`pos > size` → negative prize) — ALREADY FIXED**, independently, in the ported
  `client/src/api.ts::spSeasonReward`: `size` is clamped first, then `pos = Math.max(1, Math.min(size,
  ...))` cross-clamps against it, and `prize = Math.max(0, ...)` floors at zero. Confirmed by direct
  sweep of the full pos×size domain (see `shared/qa_money_loop_fuzz.ts`, rewritten this pass — 300
  combinations, zero negative/non-finite payouts).
- **M1/M2 (NaN-slider / NaN-strength propagation in `tactics.ts`/`intl.ts`/`clubseason.ts`) — ALREADY
  FIXED.** All three now guard with an explicit `Number.isFinite(...)` check before the arithmetic
  (`deriveMods()`'s `fin()` helper, `tieScore()`'s `aStr`/`bStr` guard, `simMatch()`'s equivalent) —
  confirmed by reading current source; the suggested `clampFinite` fix-spec at the bottom of this file
  was superseded by these narrower, already-applied guards and is now historical only.
- **L1 (`contractCost()` negative-greed edge) — ALREADY FIXED** (`greedFactor` clamps `greed` via
  `clamp(greed, 1, 20)` before use).

**New findings this pass, both harness bugs (not game bugs) — found and fixed:**
- `shared/qa_meta_loops_fuzz.ts` and `shared/qa_career_state_fuzz.ts` both asserted
  `computeOffPitch().endorsements.length <= 3`, but `shared/src/offpitch.ts` intentionally awards a 4th
  endorsement deal to a true global icon (`imageScore >= 88`) — documented in that function's own
  comment ("A true global icon lands a 4th deal — the portfolio a real superstar carries."). The
  assertion predated that feature and was flagging correct, designed behavior as a bug. Widened both to
  `<= 4`. No game code changed.

**Harness repairs (import paths only, no logic changes) — 3 harnesses that broke when `server/` was
deleted, now green again:**
- `shared/qa_boundary_fuzz.ts` — `ageOf` moved `server/src/tokens.js` → `shared/src/tokens.js`.
- `shared/qa_career_state_fuzz.ts` — `careerState`/`careerSeedFor`/`Token` moved to
  `shared/src/tokens.js`/`shared/src/token.js`.
- `shared/qa_dynasty_fuzz.ts` — `developAttrs` moved `server/src/lifecycle.js` → `shared/src/lifecycle.js`.

**`shared/qa_money_loop_fuzz.ts` — fully rewritten** (not just re-pointed): its old premise was a
line-by-line mirror of dead `server/src/index.ts` route handlers, including the now-moot H1 exploit.
Rewritten to drive the REAL `client/src/api.ts` offline facade (in-memory backend, same pattern as
`client/qa_offline_facade.ts`) through its actual economy surface — `spSeasonReward`, `spSponsor`,
`hireStaff`, `genesis` — checking prize bounds/monotonicity across the full pos×size domain, that
insufficient-funds throws never partially deduct, and that coins never go negative across 400
randomized economy calls. All green.

**Large-scale sim results this pass (all clean, no new invariant violations):**
- `shared/qa_dynasty_fuzz.ts` at `QA_ROOTS=200 QA_GENS=25` — 200 dynasties × 25 generations = **5,000
  generation-lifecycles** (career → graduate → 15 pro/manager seasons with real `clubSeason()` +
  continental-cup `tieScore()`/`contOpponent()` fixtures each season → retirement/legacy → reborn →
  next generation), plus determinism-replay and snapshot/resume round-trip checks. Clean.
- `shared/qa_career_fuzz.ts` at `QA_N=20000` — 20,000 random-choice careers (mixed tracks/agents/
  personalities), 0 softlocks, 0 exceptions, 0 invariant violations.
- `npm run verify` — full green (client build, `strategy_test.ts`, `fuzz_test.ts`, `career_sim.ts`,
  `qa_savestore.ts`, `qa_offline_facade.ts`).
- `npx tsx shared/qa_calibration_baseline.ts` re-run on `4601959` reproduced the **exact same numbers,
  to 3 decimal places**, as the recorded baseline captured on `b57aa88` (goals/match 2.567, 0-0 rate
  11.27%, home/away/draw 38.40/39.07/22.53%, all preset/duty/shape head-to-heads identical) — the
  match-engine core has had **zero calibration drift** across all of this development window.
- `strategy_test.ts`/`fuzz_test.ts` reference metrics (this session): 2.80 goals/match (strategy_test),
  5.36 goals/match / 43%-43% home-away (fuzz_test) — both within the documented reference bands (~2.80
  and ~5.0-5.6 / 43/43%).

No crashes, NaN/Infinity/undefined leaks, negative economy values, softlocks, or determinism breaks were
found anywhere in `shared/` this pass. All prior open findings are either resolved-by-removal or already
fixed in current `main`; the remaining open item is purely a `server/`-references cleanup (see backlog).

Methodology: new, standalone deterministic fuzz harnesses (this agent does not edit any file under
`shared/src/` or the existing `career.ts`/`engine.ts`/`career_sim.ts`/`fuzz_test.ts`/`strategy_test.ts`).
Each harness is runnable directly with `npx tsx <file>` and prints an exact reproducing seed/context for
every violation. Findings below are ranked most-severe first.

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 3 |
| LOW | 1 |

**Update (deeper autonomous pass, still on `b57aa88`):** added 4 more standalone harnesses covering the
full multi-generation dynasty/fusion loop, `careerState()` (the server's presentational layer) driven
turn-by-turn, and documented-threshold/boundary exactness. Found one more MEDIUM (M2, the same root
pattern as M1 — see below) in a second, independent location; everything else (7500+ simulated
generation-lifecycles across 300 dynasties 25 generations deep, ~168,000 `careerState()` calls, and
thousands of threshold/boundary probes) came back clean.

**Update (focused money-loop + calibration-baseline pass, still on `b57aa88`):** went straight at the real
server-side economy code (`server/src/index.ts`/`tokens.ts`, not a proxy) per the coordinator's request and
found the two HIGH findings below — both genuine, currently-live gaps, not synthetic/out-of-domain probes
like L1. Also captured a large-N match-engine calibration baseline (`docs/qa-calibration-baseline.md`) and
a copy-pasteable FIX-SPEC appendix for M1/M2/L1 at the bottom of this file.

No exceptions, softlocks, NaN/Infinity leaks, out-of-range attributes, non-determinism, or bracket/table
integrity failures were found across ~40,000+ simulated careers, ~130 simulated matches at extreme
quality/tactics extremes (on top of the existing `fuzz_test.ts`'s 2000 matches), ~3000 club-league seasons,
~2000 continental-cup/national-callup fixtures, ~2000 World-Cup-style tournaments, and ~4000 off-pitch
(`computeOffPitch`) evaluations. **No `Date.now()`/`Math.random()` was found anywhere in `shared/src/`** —
the engine is genuinely rng-free/replay-safe at the source level (confirmed by `grep`).

---

## HIGH

### H1 — `POST /sp/season-reward` and `POST /sp/sponsor` have no per-season/per-account claim guard: an authenticated client can mint unbounded coins by repeating the call
- **File/function:** `server/src/index.ts`, `POST /sp/season-reward` (~line 620) and `POST /sp/sponsor` (~line 636).
- **The code (verbatim, current main):**
  ```ts
  app.post('/sp/season-reward', { preHandler: requireAuth }, async (req, reply) => {
    const ownerId = req.account!.id;
    const body = req.body as any;
    const pos = Math.max(1, Math.min(20, Math.floor(Number(body?.pos) || 10)));
    const size = Math.max(2, Math.min(30, Math.floor(Number(body?.size) || 10)));
    const frac = (pos - 1) / (size - 1);
    const prize = pos === 1 ? 800 : Math.round(120 + (1 - frac) * 480);
    const sponsorBonus = String(body?.sponsor) === 'performance' && pos <= 3 ? (pos === 1 ? 700 : 400) : 0;
    await db.addCoins(ownerId, prize + sponsorBonus);
    return { ok: true, prize, sponsorBonus, coins: await db.getCoins(ownerId) };
  });
  ```
  Nothing before `db.addCoins` reads or writes a "season already claimed" flag, a season number, or any
  other per-account state. `POST /sp/sponsor` (paying a flat 450/150 coin upfront) has the identical gap.
- **Repro:** `npx tsx shared/qa_money_loop_fuzz.ts` — section "repeat-call mint check". Confirmed by
  code-reading + `grep -rn "claimed\|season-guard\|already.*reward" server/src/*.ts` (no matches for this
  route anywhere in the codebase) — this is not a fuzzable race, it's a straightforwardly-missing check.
  Live repro once a dev server is up: log in, then `POST /sp/season-reward {"pos":1,"size":20,"sponsor":"performance"}`
  as many times in a row as you like — every single call pays out **+1500 coins** (800 prize + 700
  sponsor bonus), with zero cooldown or state change that would stop a second identical call.
- **Expected:** a season's prize/sponsor payout can be claimed exactly once per (account, season) —
  the server should look up the account's *current* season/club state itself (or at minimum record a
  claimed-season marker) rather than trusting whatever `pos`/`size`/`sponsor` the client's body claims,
  and reject a repeat claim for a season already paid.
- **Actual:** every call pays out in full, with no limit on call frequency — an account can mint
  effectively unlimited coins in the current build.
- **Likely cause:** the route comment says "the single-player manager season is client-side, so it
  reports its finish here to bank the prize money" — the server was written to trust the client's
  self-report of its single-player season result, and no one added the obvious next step (record that
  this season's prize was paid, and require the caller to be past a season boundary) once that trust
  model was set. `/sp/sponsor` looks like an upfront-per-season deal picked once at kickoff, with the
  same missing state.
- **Severity rationale:** HIGH, not CRITICAL — this is a single-player, non-adversarial economy (no other
  player is harmed), so it isn't a multiplayer-integrity or real-money issue. But it completely defeats the
  stated design intent quoted in `server/src/tokens.ts`'s own header comment — *"with fixed supply, token
  demand comes from the ACTIVITY of cycling the set, not from minting more"* — coins buy `GENESIS_COST`
  prospects, `REBORN_COST` re-breeds, and `STAFF_COSTS` staff, all of which are meant to be scarcity-gated
  sinks; an unbounded faucet upstream makes every one of those costs meaningless. This is exactly the kind
  of "gameable exploit" the coordinator asked this pass to specifically hunt for.
- **Suggested fix (design only — not applied):** the cleanest fix is to make the server, not the client,
  the source of truth for "which season is this and have you been paid for it" — e.g. store a
  `last_reward_season` (and `last_sponsor_season`) column on the account/club row, read the account's
  current season number server-side (the codebase already has `ensureSeason(db, Date.now())` in
  `server/src/seasons.ts`, used elsewhere in `index.ts`), and `return reply.code(409)` if that season's
  reward/sponsor deal has already been claimed — bumping the stored season number on success.

---

## MEDIUM

### M1 — `Tactics` sliders are not sanitized; a non-finite (`NaN`) slider silently corrupts player positions instead of erroring or clamping
- **File/function:** `shared/src/tactics.ts` (`resolveTactics`-style derivation reading `t.mentality`/`t.line`/`t.press`/`t.tempo`/`t.width` directly, e.g. lines ~62-65: `attackPush: 6 + t.mentality * 3.0`, `lineShift: t.line * 4.5`, etc.) consumed by `shared/src/engine.ts`'s `MatchEngine`.
- **Repro:** `npx tsx shared/qa_match_edge_fuzz.ts` — section "out-of-range tactic sliders", `extreme-slider=NaN seed=562`. Minimal repro:
  ```ts
  import { MatchEngine } from './src/engine.js';
  import { generateTeam } from './src/teams.js';
  const teamA = generateTeam('A','A','AAA',0xff0000,12,562,'4-4-2');
  const teamB = generateTeam('B','B','BBB',0x0000ff,12,563,'4-4-2');
  const tA = { formation: '4-4-2', mentality: NaN, line: NaN, press: NaN, tempo: NaN, width: NaN };
  const tB = { formation: '4-4-2', mentality: 0, line: 0, press: 0, tempo: 0, width: 0 };
  const m = new MatchEngine([teamA, teamB], 562, [tA, tB]);
  for (let i = 0; i < 100 && !m.state.finished; i++) m.tick();
  console.log(m.state.players[0][0]); // { x: NaN, y: NaN, ... }
  ```
- **Expected:** either the constructor validates/clamps tactic sliders to the documented `[-2, 2]` integer
  range and throws or clamps a bad value, or the engine is at least robust to non-finite input and keeps
  players on the pitch.
- **Actual:** all 11 outfield/GK players on the affected side immediately get `NaN` `x`/`y` (and this
  propagates for the whole match — it does not throw, so a corrupted match silently completes with a
  broken visual state on the corrupted side while the score is still produced as integers).
- **Likely cause:** `tactics.ts` does no input validation/clamping before doing arithmetic with the raw
  slider values (`t.mentality * 3.0` etc.), so any NaN/garbage entering `Tactics` (e.g. from a save-file
  corruption, a bad manager-UI computation upstream, or a bug in whatever assembles a `Tactics` object
  before it reaches `MatchEngine`) has no containment at the engine boundary.
- **Severity rationale:** MEDIUM not HIGH/CRITICAL because ordinary, integer-slider-driven UI paths cannot
  produce this today (confirmed clean for all *finite* out-of-range values tested: -100, -10, -3, 3, 10,
  100 — the engine handles those gracefully, likely via internal clamping of derived quantities). It's a
  defensive-coding gap that would only bite if a NaN ever leaks into a `Tactics` object from somewhere
  else in the codebase (a save/load bug, a division-by-zero upstream, etc.) — worth a guard at the
  `MatchEngine` boundary so such a bug fails loudly instead of shipping a silently-broken match.

### M2 — Same root cause as M1, second location: `tieScore()`/`simMatch()` propagate `NaN` strength straight into `NaN` goals in both `shared/src/intl.ts` (World Cup / continental cup) and `shared/src/clubseason.ts` (the club league)
- **File/function:** `shared/src/intl.ts`'s `tieScore(aStr, bStr, h, neutral)` — `const diff = (aStr - bStr) * 0.12 + ...; const gh = Math.min(6, Math.max(0, Math.round(1.2 + diff + ...)));` — and the structurally identical `simMatch()` in `shared/src/clubseason.ts`. Both do arithmetic directly on the raw strength inputs with no finiteness check, and `Math.max(0, NaN)` / `Math.min(6, NaN)` are themselves `NaN`, so the "clamp" does nothing for a `NaN` input.
- **Repro:** `npx tsx shared/qa_boundary_fuzz.ts` — section "worldCup nation-strength extremes". Minimal repro:
  ```ts
  import { worldCup } from './src/intl.js';
  import { clubSeason } from './src/clubseason.js';
  const wc = worldCup(12345, 1, 'Astoria', NaN);
  console.log(wc.groups[0].rows[0]); // { ..., GF: NaN, GA: NaN, GD: NaN, Pts: <still an integer> }
  const cs = clubSeason('Marlow', NaN, 0.5, 12345);
  console.log(cs.me); // { ..., GF: NaN, GA: NaN, GD: NaN, W: 0, D: 18, L: 0, Pts: 18 }
  ```
- **Expected:** goal tallies stay finite integers (or the function rejects/clamps a non-finite strength) regardless of what's passed in as a team/nation "strength".
- **Actual:** every goals-for/goals-against cell for the affected side becomes `NaN` (silently propagating through the whole tournament/season — `GD` becomes `NaN` too), while `W`/`D`/`L`/`Pts` stay valid integers because `gh > ga` / `gh < ga` both evaluate `false` for `NaN` operands, so the match is scored as a **draw** by default. This means a `NaN` strength doesn't even fail visibly in the standings table — it just quietly turns every affected fixture into a 0-pt-looking draw with garbage goal columns.
- **Likely cause:** identical pattern to M1 — pure presentational/simulation modules that assume their numeric inputs are already sane (a real `Player.overall`/pedigree-derived strength is always `[1,20]` in practice) and never guard against a `NaN` leaking in from a bad upstream computation (e.g. a division by a zero-length roster, an unset stat defaulting to `undefined` and coercing to `NaN`, etc.).
- **Severity rationale:** MEDIUM, same reasoning as M1 — not reachable through the normal gameplay paths audited in this pass (`careerState()`'s club-season/international code always feeds a real overall-derived strength), but it's the *second* independent module found with this exact defensive-coding gap, which suggests it's a systemic pattern worth a single shared clamp/finite-guard utility rather than three separate point fixes (`tactics.ts`, `intl.ts`, `clubseason.ts`).

### M3 — `/sp/season-reward`'s prize formula goes NEGATIVE when the client-supplied `pos` exceeds `size` (both are clamped independently, but never cross-validated)
- **File/function:** `server/src/index.ts`, the same `POST /sp/season-reward` handler as H1: `pos` is clamped to `[1,20]`, `size` to `[2,30]`, independently — nothing enforces `pos <= size`.
- **Repro:** `npx tsx shared/qa_money_loop_fuzz.ts` — section "prize formula — bounds + monotonicity". Minimal repro (pure math, mirrors the handler exactly):
  ```ts
  const pos = Math.max(1, Math.min(20, 20));   // 20
  const size = Math.max(2, Math.min(30, 2));   // 2
  const frac = (pos - 1) / (size - 1);         // 19
  const prize = pos === 1 ? 800 : Math.round(120 + (1 - frac) * 480); // Math.round(120 - 8640) = -8520
  ```
  `POST /sp/season-reward {"pos":20,"size":2}` → `prize = -8520`, and the handler unconditionally calls
  `db.addCoins(ownerId, prize + sponsorBonus)` — i.e. it would **deduct 8520 coins** from the caller's own
  balance instead of paying a prize.
- **Expected:** `prize` should never go negative — worst case should floor at the documented "~120 for
  last" (or 0), regardless of what `pos`/`size` combination the client sends.
- **Actual:** `prize` scales linearly with `frac = (pos-1)/(size-1)`, which is unbounded above 1 whenever
  `pos > size` within their independently-valid ranges — the more `pos` "overshoots" `size`, the more
  negative the prize (worst case in-range: `pos=20, size=2` → `-8520`).
- **Likely cause:** the formula assumes `frac` always lands in `[0,1]` (i.e. `1 <= pos <= size`), which is
  true for a *real* season report, but the handler never checks that invariant against the client-supplied
  `size` before computing it.
- **Severity rationale:** MEDIUM — an attacker can only harm their own account this way (not a genuine
  exploit target for gain, unlike H1), but it's a real correctness bug that could corrupt a player's coin
  balance (potentially driving it negative, if `db.addCoins` doesn't itself floor at 0) from a client bug
  or a garbled network request, not just a malicious one — worth a `Math.max(0, prize)` and a `pos =
  Math.min(pos, size)` clamp regardless of H1's fix.

---

## LOW

### L1 — `contractCost()` has no input validation; a `greed` below about −8 makes the extension fee go NEGATIVE
- **File/function:** `shared/src/contracts.ts`, `contractCost(overall, age, greed, earnings)`: `greedFactor = 0.6 + 0.08 * greed` goes negative once `greed < -7.5`, and the function returns `Math.round(overall * overall * 1.2 * ageFactor * greedFactor * wageMult)` — a negative multiplier flows straight through to a negative final cost.
- **Repro:** `npx tsx shared/qa_economy_fuzz.ts` — section "contracts.ts fuzz", out-of-domain note. Minimal repro:
  ```ts
  import { contractCost } from './src/contracts.js';
  console.log(contractCost(12, 27, -15, 0)); // negative coin cost to extend a contract
  ```
- **Expected:** a contract extension should never cost negative coins (at worst free / a small floor).
- **Actual:** returns a negative number once `greed <= -8`.
- **Why LOW not MEDIUM/HIGH:** `greed` is **always** produced by `career.ts`'s `graduate()`, which clamps it to `[1, 20]` before it's ever stored on a player — so this path is not reachable through any normal gameplay flow found in this codebase today. It's purely a defensive-coding gap: `contractCost`/`contractView` take a raw `number` with no validation, so if any future caller (a save-migration script, a manually-constructed test player, a modding/debug tool) ever passes an ungoverned `greed` value, the economy silently produces a negative wage instead of erroring. A one-line `clamp(greed, 1, 20)` (or documenting the precondition loudly) at the top of `contractCost` would close this off cheaply.

---

## Notes on things checked and found CLEAN (for future QA agents / to avoid re-litigating)

- **No `Date.now()`/`Math.random()` anywhere in `shared/src/`** (`grep -rn "Date.now\|Math.random" shared/src`) — confirmed replay-safe at the source level.
- **Career loop** (`shared/qa_career_fuzz.ts`, ~13,300 checks): random-choice-strategy careers (8000, mixed
  outfield/goalkeeper tracks, all 7 agents + none), `simCareer()` combinatorial sweep (3000, including
  degenerate styles — all-zero prefs, all-max prefs, negative prefs — and extreme gene bands `[1,4]` /
  `[17,20]`), determinism re-checks (300), and `inheritGenes` lineage bounds (2000, `keepPct` 0.0-1.0,
  `ceilingLift` 0-4). All attrs/overall/greed/marketability stayed in `[1,20]`, all careers terminated at
  exactly `TOTAL_TURNS`, `Career.resume()` from a snapshot reproduced byte-identical `graduate()` output
  and choice logs, and `simCareer()` called twice with identical args was byte-identical. No exceptions,
  no softlocks.
- **Match engine** (`shared/qa_match_edge_fuzz.ts`, on top of the existing `fuzz_test.ts`): extreme
  quality-1-vs-quality-20 mismatches across all 64 formation pairings (no hangs, no upsets of the strong
  side, integer scores); all finite out-of-range tactic sliders (±10, ±100) handled without error or
  off-pitch/non-finite positions; determinism replay of 40 full matches was byte-identical; `MatchEngine`
  does **not** mutate the input `Team` objects passed to its constructor (30 checks); ultra-attack vs
  ultra-defend tactics for the same seed/opponent produced different goal totals (tactics are not a no-op).
- **Club season loop** (`shared/qa_meta_loops_fuzz.ts`, 3000 seeds incl. negative/zero/huge `myStrength`
  and edge-case club names): `seededLeague` always returns exactly 10 unique clubs with exactly one
  `mine: true`; `seasonFixtures` always gives Marlow exactly 18 fixtures against exactly 9 distinct
  opponents, each home-and-away exactly once; `seasonTable`/`liveTable` conserve total goals (GF≡GA) and
  games (`W+D+L===P`, `Pts===3W+D`), sort order is non-increasing on `Pts`; `squadRole`/`firstTeamReady`
  stayed in bounds across the full band×overall grid; `clubSeason` is deterministic across repeat calls.
- **International loop** (`shared/qa_meta_loops_fuzz.ts`, 2000 seeds): `contOpponent`/`nationalFixture`
  strengths and scorelines stayed in bounds, opponents never equal your own nation, continental finals are
  always neutral-ground. `worldCup()`/`playerPath()` (2000 editions): the 16-nation field is always unique
  and includes `myNation`; the 4 groups of 4 partition the field exactly once with no duplicate/lost
  nations; every group's goals balance (GF≡GA) and sort order holds; **every quarter-final participant is
  a real group winner/runner-up, every semi-final pairing is built from the correct pair of QF winners,
  the final is built from the correct pair of SF winners, and `champion === final.winner`** — no bracket
  corruption anywhere across 2000 tournaments; `myFinish` was consistent with actual bracket participation
  in every case; `worldCup()` is deterministic across repeat calls.
- **Off-pitch loop** (`shared/qa_meta_loops_fuzz.ts`, 4000 inputs incl. negative/huge `careerScore`,
  negative `caps`, huge `flair`): `image.score` always clamped to `[0,100]`, `endorsements.length` always
  `≤ 3`, endorsement payouts always non-negative, `boots.next.progress ≤ target` always held, and
  `computeOffPitch` is deterministic across repeat calls with identical input.
- **Manager-side economy** (`shared/qa_economy_fuzz.ts`, ~14,000 checks across `contracts.ts`,
  `prestige.ts`, `morale.ts`, `legacy.ts`, `staking.ts` within each module's real/documented input
  domain): `contractCost`/`contractLength`/`releaseClause` stay non-negative and in-bounds for the
  realistic `greed ∈ [1,20]` domain those values actually come from; `contractActive`'s expiry boundary
  is exact (active the season before expiry, inactive at/after); `managerPrestige.progress` stays in
  `[0,1]` and `levelIdx` in range across thousands of randomized (including malformed/out-of-band)
  `ManagerRecord`s; a 5000-event morale random-walk plus `driftMorale` never left `[0,100]`;
  `moraleEffects`' `extendMult`/`sellMult` stayed within their documented caps even for wildly
  out-of-range starting morale; `legacyCard.mintable` was consistent with the `legendRating ≥ 65`
  threshold in every one of 3000 cases; `staking.ts`'s discount/progress/bonus functions all stayed
  bounded across extreme (including negative and huge) tenure values. One LOW finding (L1) came out of
  deliberately probing `contractCost` far outside the domain its `greed` input is ever actually
  constructed in.
- **Full dynasty/fusion loop, end-to-end, many generations** (`shared/qa_dynasty_fuzz.ts`, 300 dynasties
  × 25 generations = 7500 generation-lifecycles, plus a 10-dynasty and a 90-generation-career deep pass):
  drove the whole chain a save actually walks — career → `graduate()` → 15 simulated pro seasons (real
  `clubSeason()` table positions + continental-cup runs via real `contOpponent()`/`tieScore()`, attrs
  developed each season via the server's real, pure `developAttrs()`) → retirement (`legacyCard()`) →
  reborn (`legacyBoost()` → `inheritGenes()` → the next generation), repeated 25 generations deep from one
  root seed. Every generation's attrs/overall/genes stayed in bounds with **no cross-generation drift or
  blow-up** (pedigree stayed in `[0,1]`, gene ceilings stayed in `[1,20]` every generation, no runaway
  accumulation past a 5,000,000-coin sanity cap across the whole mirrored economy-bridge chain —
  `CLUB_WAGE_CUT`/`PRO_SIGNING_SHARE`/`RETIREMENT_LEGACY_SHARE`, mirrored from `server/src/index.ts`'s
  route-local consts since they aren't exported). **The entire multi-generation chain replayed
  byte-identically from the same root seed** across 10 full dynasties, and a dedicated replay-round-trip
  pass (`Career.resume()` from a snapshot → `graduate()`) matched the original `graduate()` output exactly
  across 90 generation-careers spanning multiple dynasties.
- **`careerState()` stress** (`shared/qa_career_state_fuzz.ts`, up to 1500 full careers driven turn-by-turn
  through the server's actual presentational function — ~168,000 `careerState()` calls, using a
  minimal hand-built `Token` fixture since `careerState()` needs no DB/network): both tracks, all 7
  agents + none, `clubName` present/absent, `clubLevel` 0-4, and a "badPlayer" policy (always plays the
  worst-fit card) specifically to depress recent form and exercise low-form/legacy-pressure paths. Every
  presentational field checked every turn: `profile` (`currentOverall`/`potential` ∈ `[1,20]`, `stars` ∈
  `[1,5]`), `offPitch`, `clubSeason`, `international`, `objective` (`progress ≤ target`, `done` consistent),
  `handoff` (only fires with `apps ≥ 11`, matching the source's own gate), and the **"weight of the
  name" legacy-pressure** narrative path for heirs of a legend (`generation > 0 && pedigree ≥ 0.6`) — all
  code paths (legacy-pressure, handoff, off-pitch, international call-ups, objectives, chapter recaps)
  were confirmed to actually fire during the sweep, not just theoretically reachable. No exceptions, no
  malformed fields, at any turn, in any phase.
- **Boundary/threshold exactness** (`shared/qa_boundary_fuzz.ts`): `ageOf()` clamps to `[25,40]` and hits
  the retirement age (`40`) at exactly `season = primeSeason + 15`, never before, and stays pinned at `40`
  after (100 `(prime, season)` pairs); `squadRole()`'s status label (`Key player`/`Regular starter`/
  `Squad rotation`/`Breaking in`) matched its own documented apps-threshold in all 182 `(band, overall)`
  cells; `firstTeamReady()` matched its documented `9 + clubLevel*1.2` formula exactly across 2002
  `(band, clubLevel, overall)` cells; `computeOffPitch()`'s image-tier, endorsement-count, endorsement-tier
  and reputation-edge cut points all flip exactly where documented; the off-pitch temptation gate's
  empirical trigger rate over 20,000 turns matched its documented ~26% (edgy)/~12% (clean) odds to within
  1 percentage point. **This pass is also where M2 was found** (`worldCup()`'s `NaN`-strength probe).
- **Real server economy** (`shared/qa_money_loop_fuzz.ts`): `STAFF_COSTS` are sane positive costs;
  `succeed()`/`reborn()`'s retirement-legacy math (`Math.round(earnings * RETIREMENT_LEGACY_SHARE)`) and
  mentorship dev-bonus (`Math.min(3, Math.ceil(mentorship/2))`) stay bounded and non-negative across 3000
  probes, and the real handler code correctly guards a would-be-negative legacy with `if (legacy > 0)`
  before paying (so a corrupted/negative-earnings token can't drain coins through this path); the real
  career→club bridge (mirrored `CLUB_WAGE_CUT`/`PRO_SIGNING_SHARE` applied to 4000 *actually-`graduate()`d*
  careers' earnings, not synthetic numbers) never produced NaN/negative amounts, and both `clubGain` and
  `windfall` stayed bounded by the career's own earnings cap (the `OFFERS` table in `shared/src/career.ts`
  keeps a single career's earnings in the low thousands); `clubInvestOf()` (a real, exported import) is
  non-negative for every real and bogus item id tried; `GENESIS_COST`/`REBORN_COST`/`MARKET_FEE_PCT` are
  sane and market-sale proceeds never exceed the listing price. **This is also where H1 and M3 were
  found** (`/sp/season-reward` and `/sp/sponsor`'s missing claim-guard, and the `pos>size` negative-prize
  formula bug).

---

## Harnesses added (new files, run via `npx tsx`)

| File | Loop covered | Scale (default) |
|---|---|---|
| `shared/qa_career_fuzz.ts` | Career (random-choice fuzz, `simCareer` sweep, determinism, lineage) | ~13,300 checks (`QA_N` env overrides the main sweep) |
| `shared/qa_meta_loops_fuzz.ts` | Club season, continental cup, national call-ups, World Cup, off-pitch | ~15,000 checks |
| `shared/qa_match_edge_fuzz.ts` | Match engine edge cases (extreme quality/tactics, determinism, immutability) | ~170 matches |
| `shared/qa_economy_fuzz.ts` | Manager economy: contracts, prestige, morale, legacy cards, staking | ~14,000 checks |
| `shared/qa_dynasty_fuzz.ts` | Full multi-generation dynasty/fusion loop (career→pro→retire→reborn) | 300 dynasties × 25 gens (`QA_ROOTS`/`QA_GENS` env) |
| `shared/qa_career_state_fuzz.ts` | `careerState()` driven every turn (server presentational layer) | 250 careers by default (`QA_N` env; run at 1500 in this pass) |
| `shared/qa_boundary_fuzz.ts` | Documented-threshold exactness: ageOf, squadRole, firstTeamReady, worldCup extremes, offPitch tiers/temptation | ~4300 boundary probes |
| `shared/qa_money_loop_fuzz.ts` | Real server economy: STAFF_COSTS, /sp/season-reward + /sp/sponsor, succeed()/reborn() legacy math, career→club bridge, GENESIS/REBORN/MARKET_FEE | Found H1, M3 (see above) |
| `shared/qa_calibration_baseline.ts` | Large-N match-engine calibration snapshot for reconcile diffing | see `docs/qa-calibration-baseline.md` |

Re-run everything:
```
npx tsx shared/qa_career_fuzz.ts && npx tsx shared/qa_meta_loops_fuzz.ts && npx tsx shared/qa_match_edge_fuzz.ts && \
npx tsx shared/qa_economy_fuzz.ts && npx tsx shared/qa_dynasty_fuzz.ts && npx tsx shared/qa_career_state_fuzz.ts && \
npx tsx shared/qa_boundary_fuzz.ts && npx tsx shared/qa_money_loop_fuzz.ts
```
(`qa_calibration_baseline.ts` is a measurement tool, not a pass/fail gate — see `docs/qa-calibration-baseline.md`.)

## Softlock / performance caps — already comprehensively covered (no new harness needed)

Every harness in this pass that drives a match or a career to completion enforces a hard termination
bound and reports a failure (never a silent hang) if it's exceeded — this was built in from the very
first batch, not bolted on at the end, so there's nothing left to add here without duplicating existing
coverage:

| Loop | Bound | Enforced in |
|---|---|---|
| Match (ticks) | `EXPECTED_TICKS × 2` = 21,600 ticks (2× a full 90') | `shared/fuzz_test.ts` (existing, in `npm run verify`), `shared/qa_match_edge_fuzz.ts` |
| Career (turns/steps) | `TOTAL_TURNS × 10..20 + 2000..5000` steps | `shared/qa_career_fuzz.ts`, `shared/qa_career_state_fuzz.ts`, `shared/qa_dynasty_fuzz.ts` |

Across this pass's full run history — tens of thousands of matches and career-lifecycles — **not one hit
its cap**: every match finished at or near the expected 10,800-tick 90-minute budget, and every career
finished at exactly `TOTAL_TURNS`. No pathological slowdown or softlock was found anywhere in the engine
or career sim.

---

## Known limitations of this pass (for the next QA agent)

- **`qa_dynasty_fuzz.ts`'s economy-bridge constants are mirrored, not imported.** `CLUB_WAGE_CUT`,
  `PRO_SIGNING_SHARE` and `RETIREMENT_LEGACY_SHARE` live as un-exported consts inside route handlers in
  `server/src/index.ts` (search for those names). If a future change edits those numbers, this harness's
  copies will silently go stale — worth exporting them from `server/src/index.ts` (or a shared constants
  module) so a test can import the real values instead of a hand-copied literal.
- **`qa_dynasty_fuzz.ts`'s pro-season simulation is a simplified proxy**, not a literal replay of the
  server's season-rollover (`server/src/lifecycle.ts`'s `advanceTokensAtRollover`, `server/src/seasons.ts`)
  — it calls the same real, pure `clubSeason()`/`contOpponent()`/`tieScore()`/`developAttrs()` functions
  the server uses, but the season-to-season bookkeeping (apps counted, promotion tracking — `promotions`
  is currently hard-coded to 0 in this harness, not modeled) is a hand-rolled approximation. It's good
  enough to stress the shared math across many generations, but a bug that only manifests in the DB-backed
  `advanceTokensAtRollover`/`ensureSeason` orchestration itself (transaction ordering, partial writes,
  concurrent owners, etc.) would need a DB-backed integration harness, which this pass did not build.
- **`retireAgeFor`, as such, does not exist in the codebase** — retirement age is a fixed literal
  (`age >= 40`) checked in `server/src/lifecycle.ts#advanceTokensAtRollover`, with `ageOf()` (in
  `server/src/tokens.ts`) doing the clamping. This report's ageOf boundary checks cover the equivalent
  ground the request described.
- **This report is document-only, as instructed** — the fixes below (H1, M3, M1, M2, L1) were NOT applied
  to feature code; they're specified precisely enough for a one-shot reconcile pass.

---

# FIX-SPEC APPENDIX (design only — none of this has been applied)

Copy-pasteable exact diffs/specs for the findings above, ordered by how they'd land (economy fix first,
since it's the one live exploit; then the shared NaN-guard utility; then the contractCost clamp).

## Fix for H1 — `/sp/season-reward` + `/sp/sponsor` missing claim guard

**Design:** the server must know the account's *current* season itself (it already can — `ensureSeason(db,
Date.now())` is used elsewhere in `server/src/index.ts`) and refuse a second claim for a season already
paid. Minimal-diff approach: add two nullable "last claimed season" columns to the account/club row (or a
tiny new `sp_claims` table keyed by `(owner_id, kind)`), and check-then-set them in each handler.

1. **Store schema** (`server/src/store.ts` + whichever `store-*.ts` backends exist) — add to the account
   row (or a new small table):
   ```ts
   sp_reward_season: number | null;   // last season number a season-reward payout was claimed for
   sp_sponsor_season: number | null;  // last season number a sponsor deal was taken for
   ```
2. **`server/src/index.ts`, `POST /sp/season-reward`:**
   ```ts
   app.post('/sp/season-reward', { preHandler: requireAuth }, async (req, reply) => {
     const ownerId = req.account!.id;
     const s = await ensureSeason(db, Date.now());               // NEW — server-side season, not client-trusted
     const account = await db.accountById(ownerId);
     if (account?.sp_reward_season === s.number) {                // NEW — one claim per season
       return reply.code(409).send({ error: 'season reward already claimed this season' });
     }
     const body = req.body as any;
     const pos = Math.max(1, Math.min(20, Math.floor(Number(body?.pos) || 10)));
     const size = Math.max(2, Math.min(pos, 30, Math.floor(Number(body?.size) || 10))); // NEW — pos<=size, fixes M3 too
     const frac = (pos - 1) / (Math.max(2, size) - 1);
     const prize = pos === 1 ? 800 : Math.round(120 + (1 - frac) * 480);
     const sponsorBonus = String(body?.sponsor) === 'performance' && pos <= 3 ? (pos === 1 ? 700 : 400) : 0;
     await db.addCoins(ownerId, prize + sponsorBonus);
     await db.setSpRewardSeason(ownerId, s.number);                // NEW — record the claim
     return { ok: true, prize, sponsorBonus, coins: await db.getCoins(ownerId) };
   });
   ```
3. **`server/src/index.ts`, `POST /sp/sponsor`:** identical pattern — check `account.sp_sponsor_season !==
   s.number` before paying `upfront`, then `db.setSpSponsorSeason(ownerId, s.number)` after.
4. Add `setSpRewardSeason(id, season)` / `setSpSponsorSeason(id, season)` to the `Store` interface and both
   backends (`store-sqlite.ts` and whichever prod store exists), mirroring the existing `setRating()`
   pattern already in `server/src/store.ts`.

**Note for reconcile:** if the single-player season is ever migrated to be fully server-computed (rather
than client-reported), this whole claim-guard becomes moot — the server would just pay out once, at the
moment IT resolves the season, and these endpoints could be removed. Until then, this is the minimal fix.

## Fix for M3 — `pos > size` negative prize

Already folded into the H1 diff above (`size = Math.max(2, Math.min(pos, 30, ...))` forces `size >= pos`
so `frac` can never exceed 1). If H1 isn't picked up immediately, apply this narrower fix on its own:
```ts
// server/src/index.ts, POST /sp/season-reward
const pos = Math.max(1, Math.min(20, Math.floor(Number(body?.pos) || 10)));
const size = Math.max(pos, 2, Math.min(30, Math.floor(Number(body?.size) || 10))); // NEW: size >= pos
const frac = (pos - 1) / (size - 1);
const prize = pos === 1 ? 800 : Math.max(0, Math.round(120 + (1 - frac) * 480));   // NEW: floor at 0
```

## Fix for M1 + M2 — one shared `sanitizeFinite`/`clampFinite` utility, three call sites

**Design:** add one tiny, dependency-free helper and call it at the three points identified in this pass
where a raw external number flows into gameplay arithmetic with no guard. Put it somewhere genuinely
shared and low-level — `shared/src/rng.ts` already holds small numeric primitives used across the engine,
so it's the natural home (no new file needed); export it from `shared/src/index.ts`'s barrel.

**1. Add the utility** (`shared/src/rng.ts`, or a new `shared/src/num.ts` if the maintainers prefer a
dedicated home — either way, export it from `shared/src/index.ts`):
```ts
/** Coerce any input to a finite number, falling back to `fallback` (default 0) for NaN/±Infinity/non-numbers.
 *  Use at every boundary where an external/client-supplied number reaches gameplay arithmetic. */
export function clampFinite(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
```

**2. `shared/src/tactics.ts` — sanitize `Tactics` sliders in `deriveMods()` (fixes M1):**
```ts
export function deriveMods(t: Tactics): TacticMods {
  // NEW — sanitize once, at the top, so every downstream calculation is guaranteed finite. Sliders are
  // documented as integers in [-2,2]; clamp to that range (not just "finite") so garbage input degrades
  // to a neutral tactic instead of an extreme one.
  const clampSlider = (v: number) => Math.max(-2, Math.min(2, clampFinite(v, 0)));
  const mentality = clampSlider(t.mentality), line = clampSlider(t.line), press = clampSlider(t.press);
  const tempo = clampSlider(t.tempo), width = clampSlider(t.width);
  return {
    attackPush: 6 + mentality * 3.0,
    lineShift: line * 4.5,
    pressCount: press >= 2 ? 3 : press >= 0 ? 2 : 1,
    pressIntensity: 1 + press * 0.24,
    directness: tempo * 0.32,
    widthScale: 1 + width * 0.10,
    staminaDrain: 1 + Math.max(0, press) * 0.18 + Math.max(0, tempo) * 0.1 + Math.max(0, mentality) * 0.06,
  };
}
```
(Import `clampFinite` from wherever it lands, e.g. `import { clampFinite } from './rng.js';`.)

**3. `shared/src/intl.ts` — sanitize `tieScore()`'s strength inputs (fixes M2, part 1):**
```ts
export function tieScore(aStr: number, bStr: number, h: number, neutral = false): [number, number] {
  const a = clampFinite(aStr, 10), b = clampFinite(bStr, 10); // NEW — 10 = a neutral mid-table strength
  const diff = (a - b) * 0.12 + (neutral ? 0 : 0.25);
  const gh = Math.min(6, Math.max(0, Math.round(1.2 + diff + (frac(h, 1) - 0.5) * 2.2)));
  const ga = Math.min(6, Math.max(0, Math.round(1.2 - diff + (frac(h, 2) - 0.5) * 2.2)));
  return [gh, ga];
}
```
(Import `clampFinite` at the top of `intl.ts`.)

**4. `shared/src/clubseason.ts` — sanitize `simMatch()`'s strength inputs (fixes M2, part 2):**
```ts
function simMatch(a: LeagueClub, b: LeagueClub, h: number): [number, number] {
  const rnd = (n: number) => (((h >>> (n & 15)) ^ (h >>> ((n + 7) & 15))) % 100) / 100;
  const aStr = clampFinite(a.strength, 10), bStr = clampFinite(b.strength, 10); // NEW
  const diff = (aStr - bStr) * 0.12 + 0.25;
  const gh = Math.min(6, Math.max(0, Math.round(1.2 + diff + (rnd(1) - 0.5) * 2.2)));
  const ga = Math.min(6, Math.max(0, Math.round(1.2 - diff + (rnd(2) - 0.5) * 2.2)));
  return [gh, ga];
}
```
(Import `clampFinite` at the top of `clubseason.ts`.)

**Verification after applying:** re-run `npx tsx shared/qa_match_edge_fuzz.ts` and `npx tsx
shared/qa_boundary_fuzz.ts` — both currently `process.exit(1)` specifically on the M1/M2 NaN cases; a
correct fix turns them green without touching any other assertion in either file (no other failures were
found in either harness on `b57aa88`).

## Fix for L1 — `contractCost()` negative-greed edge

**`shared/src/contracts.ts`:**
```ts
export function contractCost(overall: number, age: number, greed: number, earnings = 0): number {
  const g = clamp(greed, 1, 20); // NEW — greed is always produced in [1,20] by graduate(); enforce the precondition here too
  const ageFactor = age <= 30 ? 1 : clamp(1 - (age - 30) * 0.06, 0.4, 1);
  const greedFactor = 0.6 + 0.08 * g;
  const wageMult = 1 + clamp(earnings / 12000, 0, 0.4);
  return Math.max(0, Math.round(overall * overall * 1.2 * ageFactor * greedFactor * wageMult)); // NEW — floor at 0 too, belt-and-braces
}
```
(`clamp` is already defined at the top of `contracts.ts` — no new import needed.)

**Verification after applying:** re-run `npx tsx shared/qa_economy_fuzz.ts` with its out-of-domain probe
un-commented/widened to the previously-failing range (`greed <= -8`) — should stay non-negative.
