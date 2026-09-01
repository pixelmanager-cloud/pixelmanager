// ── CAN THE UNDERDOG TAKE ANYTHING OFF THE FAVOURITE? ────────────────────────────────────────────────
//
// THE BAR THIS REPO DID NOT HAVE. `division_balance` gates goal MARGIN and thrashing RATE, and
// `attack_reach` gates whether the weaker side can reach the box. Not one of them asks the question a
// player actually asks about a league: can the little club WIN?
//
// That gap is not theoretical. Measured on the engine as it stood before the advance floor, on the
// fixture the pyramid stages every week: THE UNDERDOG WON 0% OF THE TIME IN NINE DIVISIONS OUT OF TEN.
// Never, in any seed, in any season. `division_balance` was green throughout, because a league where
// nobody can score is a league of narrow margins and no thrashings — its bars were satisfied by the
// defect rather than despite it. The only reason the pyramid looked competitive at all was a 54% draw
// rate in the basement, and that was an artefact of an engine producing 0.75 goals a match.
//
// So the honest measure of competitiveness is not "were the scores close". It is whether the result can
// go the other way. The advance floor takes the underdog from winning in 1 division to winning in 7,
// while draws fall from 54% to 28% in the basement — which is roughly real football's draw rate, where
// the old 54% was not.
//
// A CAVEAT THIS PROBE CANNOT FIX, recorded so nobody mistakes green for healthy: in real football the
// bottom club takes something off the top club around 25-30% of the time. Here it is about 8%, before
// and after. Quality is still far too decisive in this engine. These bars stop it getting WORSE; they do
// not claim it is right.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { tierStrength, seededOpponents, TIERS } from '../../shared/src/clubseason.js';

const N = Number(process.env.N ?? 40);
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

/** The widest fixture a division actually generates — asked of `seededOpponents`, never re-derived. */
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

let favW = 0, dogW = 0, drew = 0, played = 0, tiersWhereDogWins = 0;
console.log(`  the widest fixture in each division, ${N} matches each:`);
for (let tier = 1; tier <= TIERS; tier++) {
  const sp = measuredSpread(tier), base = tierStrength(tier);
  const qa = Math.max(3, Math.min(20, Math.round(base + sp)));
  const qb = Math.max(3, Math.min(20, Math.round(base - sp)));
  let w = 0, d = 0, l = 0;
  for (let i = 0; i < N; i++) {
    const a = generateTeam('a', 'A', 1, qa, i * 7 + 1, '4-4-2');
    const b = generateTeam('b', 'B', 2, qb, i * 11 + 3, '4-4-2');
    const m = new MatchEngine([a, b], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    while (!m.state.finished) m.tick();
    const gd = m.state.score[0] - m.state.score[1];
    if (gd > 0) w++; else if (gd === 0) d++; else l++;
  }
  favW += w; drew += d; dogW += l; played += N;
  if (l > 0) tiersWhereDogWins++;
  const pc = (x: number) => `${String(Math.round((100 * x) / N)).padStart(3)}%`;
  console.log(`    tier ${String(tier).padStart(2)} (q${qa} v q${qb}):  favourite ${pc(w)}   draw ${pc(d)}   underdog ${pc(l)}`);
}

const favRate = favW / played, dogRate = dogW / played, drawRate = drew / played;
console.log(`\n  across the pyramid: favourite ${(100 * favRate).toFixed(1)}%, draw ${(100 * drawRate).toFixed(1)}%, underdog ${(100 * dogRate).toFixed(1)}%`);
console.log(`  divisions where the underdog EVER wins: ${tiersWhereDogWins}/${TIERS}`);

// THE REAL BAR, and the one the old engine failed outright. A league in which the weaker side cannot win
// is not a league, however narrow its scorelines are.
check(dogRate >= 0.02,
  `the underdog actually wins sometimes (${(100 * dogRate).toFixed(1)}% of the widest fixtures; the pre-floor engine managed 0.6%)`);
check(tiersWhereDogWins >= TIERS / 2,
  `and it can happen in most divisions, not just the basement (${tiersWhereDogWins}/${TIERS}; pre-floor: 1/${TIERS})`);
// A RATCHET on the other side of the same coin: a league can also fail by becoming a procession.
check(favRate <= 0.92,
  `the favourite does not simply always win (${(100 * favRate).toFixed(1)}%, ceiling 92%)`);
// Draws are a real result, not a filler. The pre-floor basement ran at 54% because nobody could score.
check(drawRate <= 0.35,
  `draws are a result and not the default (${(100 * drawRate).toFixed(1)}%, ceiling 35%; real football ~25%)`);

console.log(fails
  ? `\n✗ ${fails} competitiveness check(s) failed — the league's results are not a contest`
  : '\n✓ the underdog can win, in most divisions, and the favourite does not always');
if (fails) process.exit(1);
