// ── ONE BAD NUMBER IN A SAVE MUST NOT BREAK A MATCH ──────────────────────────────────────────────────
//
// `engine.ts` has its OWN `norm`, separate from the one in `mental.ts`. When the mental layer was
// hardened, only `mental.ts` was guarded — the engine's, which reads the ten PHYSICAL stats, was left as
// bare `stat / 20`. The hole was half closed, and the half left open was the more dangerous one.
//
// NaN propagates in total silence here: `clamp(NaN, lo, hi)` is NaN because Math.min/max pass it through,
// and `rng() < NaN` is false FOREVER. Nothing throws, nothing logs, the match completes normally and the
// scoreline looks plausible. Measured before the guard, over 40 matches: a keeper with NaN `keeping`
// conceded ZERO goals against a healthy baseline of 52 — one bad number in a save file made a goalkeeper
// literally unbeatable. `overall()` in teams.ts has carried exactly this guard for a long time, and its
// own comment records that this class once "permanently poisoned the wallet".
//
// A non-finite stat is not reachable through the shipped UI today. It is reachable through a partially
// written save, a schema migration, or any future stat added to `PlayerAttrs` after saves exist — which
// is precisely how the wallet bug happened. This asserts the resilience directly.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import type { Team } from '../../shared/src/types.js';

const N = Number(process.env.N ?? 30);
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };
const clone = (t: Team): Team => JSON.parse(JSON.stringify(t));

function run(mut: (a: Team) => void) {
  let gf = 0, ga = 0;
  for (let i = 0; i < N; i++) {
    const a = clone(generateTeam('a', 'A', 1, 14, i * 7919 + 1, '4-4-2'));
    const b = clone(generateTeam('b', 'B', 2, 14, i * 7919 + 1, '4-4-2'));
    mut(a);
    const m = new MatchEngine([a, b], i * 104729 + 3, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    while (!m.state.finished) m.tick();
    gf += m.state.score[0]; ga += m.state.score[1];
    if (!Number.isFinite(m.state.score[0]) || !Number.isFinite(m.state.score[1])) return { gf: NaN, ga: NaN };
  }
  return { gf, ga };
}

const STATS = ['pace', 'shooting', 'tackling', 'passing', 'strength', 'positioning', 'stamina', 'workrate', 'keeping'] as const;
const base = run(() => {});
console.log(`  baseline over ${N} matches: A ${base.gf} - ${base.ga} B`);

for (const k of STATS) {
  const r = run((a) => { (a.players[5].attrs as Record<string, number>)[k] = NaN; });
  check(Number.isFinite(r.gf) && r.ga > 0 && r.ga < base.ga * 2.5 && r.gf > base.gf * 0.4,
    `an outfielder with NaN ${k} still plays a real match (A ${r.gf} - ${r.ga} B)`);
}

// THE ONE THAT WAS ACTUALLY CATASTROPHIC. A keeper is the single point where a NaN turned into an
// absolute: not "slightly wrong" but "cannot be scored against at all".
const gk = run((a) => { (a.players[0].attrs as Record<string, number>).keeping = NaN; });
check(gk.ga > 0, `a keeper with NaN keeping is not UNBEATABLE (conceded ${gk.ga} in ${N}; before the guard: 0)`);

// The guard's promise is substitution, not merely non-crashing: NaN must behave as exactly 10.
const ten = run((a) => { (a.players[0].attrs as Record<string, number>).keeping = 10; });
check(gk.gf === ten.gf && gk.ga === ten.ga,
  `a NaN stat resolves to exactly the scale's neutral 10 (NaN ${gk.gf}-${gk.ga} vs explicit-10 ${ten.gf}-${ten.ga})`);

console.log(fails
  ? `\n✗ ${fails} NaN-resilience check(s) failed — one bad number in a save can still break a match`
  : '\n✓ a non-finite stat degrades to the neutral 10 instead of silently breaking the match');
if (fails) process.exit(1);
