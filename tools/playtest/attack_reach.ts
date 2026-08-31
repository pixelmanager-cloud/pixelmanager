// ── CAN THE WEAKER SIDE ATTACK AT ALL? ───────────────────────────────────────────────────────────────
//
// `division_balance` asks whether the league's scorelines are competitive. It can be satisfied two ways:
// by a genuine contest, or by keeping total goals so low that nobody can win by six. The engine currently
// satisfies it the second way, and this probe is what makes that visible.
//
// Measured on the fixture the pyramid stages every week (a six-point quality gap inside one division),
// the weaker side takes 0.1-0.7 SHOTS A MATCH against the stronger side's 8-9 — a ratio of 20:1 to 70:1,
// where real football's top-vs-bottom is about 1.8:1. It is not being outplayed; it is shut out. That is
// also WHY the league gate can only be held by suppressing volume: a side that never scores turns every
// extra goal the other side gets into pure margin, so any move toward realistic shot counts turns the
// pyramid into a weekly 6-0 (measured: 89% of top-vs-bottom fixtures a thrashing at football volume).
//
// WHERE IT IS NOT. Eight mechanisms were dialled across orders of magnitude and the weak side's shot
// count never left 0.1-0.7:
//   - duel quality sensitivity (nulled entirely — box ratio still 19-42:1)
//   - pass-completion quality sensitivity (nulled entirely)
//   - the `beatsLastDefender` pace step (smoothed to a probability)
//   - chase-down rate for already-beaten defenders
//   - CHANCE_RANGE, i.e. how near goal a ball-in-behind counts as a chance
//   - tackle rate, shot appetite, clear-run appetite
// Only pace compression moved the ratio at all, and it did so by SUPPRESSING THE STRONG SIDE (8.8 shots
// to 4.3), not by freeing the weak one. A defect that survives having every one of its candidate causes
// nulled is structural, not mistuned.
//
// WHAT THE SHAPE SAYS. Both sides get the SAME NUMBER OF POSSESSIONS (467 v 467 a match). They differ
// entirely in what they do with one: the strong side brings 47% of its possessions inside 18m, the weak
// side 2.7%, and 42% of weak possessions never get within 60m of the goal at all. With per-defender
// tackle odds forced identical, the only asymmetry left is HOW MANY DEFENDERS REACH THE CARRIER PER TICK
// — which is pace — so the amplifier is the number of challenge rolls, compounded over a spell, not the
// odds of any one of them. Fixing it means changing how possession advances up the pitch, which is an
// engine redesign and is written up for CK in docs/decisions-for-ck.md.
//
// The bars below are RATCHETS on a known-bad number, in this file's own convention: they exist so the
// defect cannot quietly get worse, and so that a future fix has a number to move. The equal-possession
// assertion is a REAL bar — it is currently true, and it is what localises the defect to retention
// rather than to chance creation. If it ever breaks, this diagnosis is wrong.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { PITCH } from '../../shared/src/types.js';
import { tierStrength, seededOpponents } from '../../shared/src/clubseason.js';

const N = Number(process.env.N ?? 60);
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };
const SHOTY = new Set(['shot_missed', 'shot_saved', 'goal', 'woodwork']);

/** The widest fixture a division actually generates — asked of `seededOpponents`, not re-derived from a
 *  local copy of its arithmetic (the mistake `division_balance` documents at length). */
function measuredSpread(tier: number, samples = 400): number {
  let w = 0;
  for (let s = 0; s < samples; s++) {
    const c = seededOpponents('Mine', s * 7919 + 13, tier);
    if (!c.length) continue;
    const st = c.map((x) => x.strength);
    w = Math.max(w, (Math.max(...st) - Math.min(...st)) / 2);
  }
  return Math.max(1, Math.round(w));
}

const BANDS = [18, 25, 35, 45, 60, 999];
let worstRatio = 0, weakestShots = Infinity, worstSpellSkew = 0, worstBoxShare = Infinity;

for (const tier of [2, 5]) {
  const sp = measuredSpread(tier), base = tierStrength(tier);
  const qa = Math.max(3, Math.min(20, Math.round(base + sp)));
  const qb = Math.max(3, Math.min(20, Math.round(base - sp)));
  const shots = [0, 0], goals = [0, 0], spells = [0, 0];
  const hist = [BANDS.map(() => 0), BANDS.map(() => 0)];

  for (let i = 0; i < N; i++) {
    const a = generateTeam('a', 'A', 0x1, qa, i * 7 + 1, '4-4-2');
    const b = generateTeam('b', 'B', 0x2, qb, i * 11 + 3, '4-4-2');
    const m = new MatchEngine([a, b], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    let cur = -1, best = Infinity;
    const flush = () => {
      if (cur >= 0 && best < Infinity) { hist[cur][BANDS.findIndex((x) => best <= x)]++; spells[cur]++; }
    };
    while (!m.state.finished) {
      m.tick();
      const c = m.state.carrier;
      if (!c) continue;
      if (c.teamIdx !== cur) { flush(); cur = c.teamIdx; best = Infinity; }
      const gx = c.teamIdx === 0 ? PITCH.w : 0;
      best = Math.min(best, Math.hypot(gx - m.state.ball.x, PITCH.h / 2 - m.state.ball.y));
    }
    flush();
    for (const e of m.state.events) if (SHOTY.has(e.type)) shots[e.teamIdx]++;
    goals[0] += m.state.score[0]; goals[1] += m.state.score[1];
  }

  const ratio = shots[1] > 0 ? shots[0] / shots[1] : Infinity;
  worstRatio = Math.max(worstRatio, Number.isFinite(ratio) ? ratio : 999);
  weakestShots = Math.min(weakestShots, shots[1] / N);
  worstSpellSkew = Math.max(worstSpellSkew, Math.abs(spells[0] - spells[1]) / Math.max(1, spells[0] + spells[1]));
  worstBoxShare = Math.min(worstBoxShare, hist[1][0] / Math.max(1, spells[1]));

  console.log(`\ntier ${tier}  q ${qa} v ${qb}   (real football's top-vs-bottom: ~1.8:1 on shots)`);
  console.log(`   shots   ${(shots[0] / N).toFixed(1)} v ${(shots[1] / N).toFixed(1)}   ratio ${Number.isFinite(ratio) ? `${ratio.toFixed(1)}:1` : 'shut out entirely'}`);
  console.log(`   goals   ${(goals[0] / N).toFixed(2)} v ${(goals[1] / N).toFixed(2)}`);
  console.log(`   possessions ${(spells[0] / N).toFixed(0)} v ${(spells[1] / N).toFixed(0)}  <- near-equal: the defect is RETENTION, not chance creation`);
  console.log(`   closest approach ${'<=18m'.padStart(7)}${'<=25m'.padStart(8)}${'<=35m'.padStart(8)}${'<=45m'.padStart(8)}${'<=60m'.padStart(8)}${'>60m'.padStart(8)}`);
  for (const t of [0, 1]) {
    const tot = spells[t] || 1;
    console.log(`   ${t === 0 ? 'STRONG ' : 'weak   '}         ` + hist[t].map((v) => `${(100 * v / tot).toFixed(1)}%`.padStart(7)).join(' '));
  }
}

console.log('');
// REAL BAR — this is what localises the defect. Both sides win the ball back a comparable number of
// times; the disparity is entirely in what a possession becomes. If this ever fails, the write-up in
// docs/decisions-for-ck.md is diagnosing the wrong thing and needs redoing from measurement.
check(worstSpellSkew <= 0.15,
  `both sides get a comparable number of possessions (worst skew ${(100 * worstSpellSkew).toFixed(1)}%) — so the shut-out is retention, not chance creation`);
// RATCHETS on the known-bad numbers. Target, when the redesign lands: ~5 shots a match for the weaker
// side (a ~1.8:1 ratio). NOT ratcheted on the RATIO: at 0.08 shots a match the denominator is about five
// events across the whole sample, so the ratio swings between 60:1 and 110:1 on sampling noise alone and
// a bar on it would flap without the engine changing. The weak side's ABSOLUTE count is the stable
// quantity, so that is what is guarded; the ratio is printed for orientation only.
check(weakestShots >= 0.02,
  `[known-bad] the weaker side still takes SOME shots (now ${weakestShots.toFixed(2)}/match)`);

// NOT A BAR — THE SUCCESS CRITERION FOR THE ENGINE REDESIGN (§66), reported so it cannot be forgotten.
//
// On the shipped engine this reads 0.0%, and a ratchet at zero is vacuous: it is a check that cannot
// fail, which is the defect class this repo is full of. So it is printed, not asserted, until there is a
// number worth protecting.
//
// Read it together with the shot ratio above, because on main the ratio LIES. Main scores 7.6:1 on shots
// — close to real football's 1.8:1 and far better than the rebuild branch's 26:1 — while the weaker side
// enters the penalty area exactly never. Its 4.5 "shots" a match are hopeful efforts from ~45m, which the
// old geometry counted as shots because distance barely entered the conversion. The branch looks worse on
// this ratio precisely BECAUSE its shots are real. Judge an engine by the box share, not the shot count.
console.log(`\n  MEASURED, not gated — weaker side's possessions reaching inside 18m: ${(100 * worstBoxShare).toFixed(1)}%`);
console.log(`  (stronger side: ~47%. Real football's underdog: roughly 15-25%. THIS is what §66's redesign has to move.)`);

console.log(fails
  ? `\n✗ ${fails} attack-reach check(s) failed`
  : '\n✓ attack reach measured — the weaker side is shut out, and the cause is localised to retention');
if (fails) process.exit(1);
