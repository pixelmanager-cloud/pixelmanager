// ── THE ASSERTIONS THAT WERE MEASURING NOISE ─────────────────────────────────────────────────────────
// strategy_test.ts decides whether one duty is better than another by summing goals over SIXTY matches and
// comparing two totals. The effects it is asking about are a tenth to a fifth of a goal a game, against a
// match-to-match standard deviation of about 1.75. At n=60 the standard error on the difference is ~0.22 —
// bigger than every effect being tested. Measured directly:
//
//     anchor - ball-winner          -0.120  95% CI [-0.337, 0.097]
//     anchor - box-to-box           -0.176  95% CI [-0.389, 0.037]
//     play-out-of-defence ON - OFF  +0.072  95% CI [-0.117, 0.261]
//
// Every one of those intervals spans zero. The assertions were not passing because the engine was right;
// they were coin flips, and they landed differently on every calibration change made during the rebuild —
// which is exactly how a rebuild spends its time chasing failures that are not there. A check that reports
// a different answer for the same code is worse than no check.
//
// So the fine-grained tactical orderings live HERE instead, at a sample size that can actually resolve
// them, and they are stated as what they are: a paired mean difference with a confidence interval. A
// comparison whose interval spans zero FAILS — not because the engine is necessarily wrong, but because
// the claim in the assertion is not supported, and an unsupported claim about a duty is a duty that does
// not do what its description says. This runs in `playtest`, not `verify`, because it costs minutes.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import type { Team, Duty, Tactics, Role } from '../../shared/src/types.js';

const N = Number(process.env.N ?? 900);
let fails = 0;

interface Diff { mean: number; lo: number; hi: number; n: number }
function diff(samples: number[]): Diff {
  const n = samples.length;
  const mean = samples.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const se = sd / Math.sqrt(n);
  return { mean, lo: mean - 1.96 * se, hi: mean + 1.96 * se, n };
}
/** `claim` must be supported: the whole interval on the correct side of zero. */
function expectLower(label: string, d: Diff) {
  const ok = d.hi < 0;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(52)} ${d.mean >= 0 ? '+' : ''}${d.mean.toFixed(3)}  95% CI [${d.lo.toFixed(3)}, ${d.hi.toFixed(3)}]  n=${d.n}`);
  if (!ok) fails++;
}
function expectHigher(label: string, d: Diff) {
  const ok = d.lo > 0;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(52)} ${d.mean >= 0 ? '+' : ''}${d.mean.toFixed(3)}  95% CI [${d.lo.toFixed(3)}, ${d.hi.toFixed(3)}]  n=${d.n}`);
  if (!ok) fails++;
}

const mk = (q: number, s: number, f: any = '4-4-2') => generateTeam(`t${s}`, 'T', 'T', 0x1, q, s, f);
const withDuty = (t: Team, role: Role, duty: Duty): Team => ({ ...t, players: t.players.map((p) => (p.role === role ? { ...p, duty } : p)) });
const run = (a: Team, b: Team, ta: Tactics, tb: Tactics, seed: number) => {
  const m = new MatchEngine([a, b], seed, [ta, tb]);
  while (!m.state.finished) m.tick();
  const shots = (i: 0 | 1) => m.state.events.filter((e) => e.teamIdx === i && (e.type === 'goal' || e.type.startsWith('shot'))).length;
  const tot = m.state.possession[0] + m.state.possession[1] || 1;
  return { ga: m.state.score[1], gf: m.state.score[0], shots: shots(0), poss: m.state.possession[0] / tot };
};

// ── duties measured by what they claim to do ─────────────────────────────────────────────────────────
const direct: Tactics = { ...DEFAULT_TACTICS, formation: '4-3-3', mentality: 1, tempo: 2 };
function concedeDiff(role: Role, a: Duty, b: Duty): Diff {
  const d: number[] = [];
  for (let i = 0; i < N; i++) {
    const atk = mk(13, i * 11 + 3, '4-3-3');
    const ga = (duty: Duty) => run(withDuty(mk(13, i * 7 + 1), role, duty), atk, DEFAULT_TACTICS, direct, i * 31 + 5).ga;
    d.push(ga(a) - ga(b));
  }
  return diff(d);
}
console.log(`\nDEFENSIVE DUTIES — goals conceded against a direct attack, paired on seed (want the claim's duty LOWER)`);
expectLower('anchor concedes less than ball-winner', concedeDiff('MF', 'anchor', 'ball-winner'));
expectLower('anchor concedes less than box-to-box', concedeDiff('MF', 'anchor', 'box-to-box'));
expectLower('sweeper concedes less than stopper', concedeDiff('DF', 'sweeper', 'stopper'));
expectLower('sweeper concedes less than cover', concedeDiff('DF', 'sweeper', 'cover'));

console.log(`\nINSTRUCTIONS`);
{
  const hp: Tactics = { ...DEFAULT_TACTICS, press: 2 };
  const d: number[] = [];
  for (let i = 0; i < N; i++) {
    const ga = (on: boolean) => run(mk(13, i * 7 + 1), mk(13, i * 11 + 3), { ...DEFAULT_TACTICS, playOutOfDefence: on }, hp, i * 31 + 5).ga;
    d.push(ga(true) - ga(false));
  }
  expectLower('play-out-of-defence concedes less vs a high press', diff(d));
}
{
  const shotDiff = (formation: any, fa: 'wide' | 'central', fb: 'wide' | 'central') => {
    const d: number[] = [];
    for (let i = 0; i < N; i++) {
      const sh = (f: 'wide' | 'central') => run(mk(13, i * 7 + 1, formation), mk(13, i * 11 + 3), { ...DEFAULT_TACTICS, formation, attackFocus: f }, DEFAULT_TACTICS, i * 31 + 5).shots;
      d.push(sh(fa) - sh(fb));
    }
    return diff(d);
  };
  expectHigher('3-4-3 (wide shape) shoots more with CENTRAL focus', shotDiff('3-4-3', 'central', 'wide'));
  expectHigher('diamond (narrow shape) shoots more with WIDE focus', shotDiff('4-1-2-1-2', 'wide', 'central'));
}

console.log(fails
  ? `\n✗ ${fails} tactical claim(s) unsupported at n=${N} — the option does not do what its description says`
  : `\n✓ every tactical claim is supported at n=${N}`);
if (fails) process.exit(1);
