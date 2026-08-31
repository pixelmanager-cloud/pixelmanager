// ── WHAT THIS GUARDS: shared/src/mental.ts — the five-stat mental layer and the earned traits ────────
//
// `mental.ts` is 24 lines and, until this file, had never been imported by a single harness. It is also
// the only thing that makes a career-built player play differently from a generated stat-block, so it is
// what the bloodline actually inherits. Two claims live in its header comment and nowhere else:
//
//   1. NEUTRALITY — "a player WITHOUT mental stats yields 1.0 / 0.0 and behaves exactly as before".
//      That is what keeps `npm run verify` green, so the day it stopped being true every calibration
//      gate in the repo would move for a reason nobody would trace back to this file.
//   2. THAT IT REACHES THE PITCH AT ALL. Every effect here is a small centred nudge to a probability, so
//      a typo'd trait id, a dropped `mMul`, or a `k` accidentally left at 0 would be COMPLETELY SILENT:
//      the engine still runs, the scorelines still look like football, `verify` still passes, and the
//      inheritance system quietly becomes decorative. Same defect class as a bonus keyed on an id no
//      catalogue entry has — a hook that cannot fire, forever, with nothing red anywhere.
//
// So every claim about behaviour is checked end-to-end through the real MatchEngine. Asserting
// `mMul(20, 0.2) === 1.1` proves arithmetic; it does not prove the engine still calls it. Each of the
// five mental stats and each of the five trait ids `engine.ts` reads is verified LIVE by moving one and
// requiring real match outcomes to move with it, and the trait ids are checked against the players the
// game actually mints rather than against a list retyped here.
//
// The section marked MEASURED is deliberately NOT gated. Those are defects found while writing this
// file; pinning today's behaviour would turn this harness red the day somebody fixes one. They are
// measured on every run so they stay visible, and they are written up rather than asserted.
import { hasTrait, mAdd, mMul, teamLeadership } from './src/mental.js';
import { MatchEngine } from './src/engine.js';
import { generateTeam, generateClub, overall } from './src/teams.js';
import { DEFAULT_TACTICS } from './src/tactics.js';
import { TRAITS } from './src/career.js';
import { TIERS, tierStrength } from './src/clubseason.js';
import type { MatchEvent, Player, Team } from './src/types.js';

let fails = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`);
  if (!cond) fails++;
};

/** The five stats mental.ts exists for, and the five trait ids engine.ts reads. Both lists are the
 *  SUBJECT here, not a convenience: if one stops being read, its sweep below goes to zero. */
const MENTALS = ['composure', 'aggression', 'creativity', 'teamwork', 'leadership'] as const;
const ENGINE_TRAITS = ['clinical', 'ballwinner', 'metronome', 'maestro', 'wall'] as const;

const NEAR = (a: number, b: number, eps = 1e-12) => Math.abs(a - b) <= eps;
const clone = (t: Team): Team => ({ ...t, players: t.players.map((p) => ({ ...p, attrs: { ...p.attrs } })) });
const setM = (t: Team, k: (typeof MENTALS)[number], v: number | undefined) => { for (const p of t.players) p.attrs[k] = v; };
const setAll = (t: Team, v: number | undefined) => { for (const k of MENTALS) setM(t, k, v); };
const bare = (traits: unknown, leadership?: number): Player => ({
  id: 't', name: 'T', role: 'MF', anchor: { x: 0, y: 0 },
  attrs: { pace: 10, strength: 10, passing: 10, shooting: 10, tackling: 10, positioning: 10, workrate: 10, keeping: 10, setPiece: 10, stamina: 10, leadership },
  traits: traits as string[] | undefined,
});

// ── §1  the algebra: centred at 10, symmetric, bounded, and the two forms are one curve ──────────────
console.log('=== 1. mAdd / mMul are ONE centred curve, bounded by k ===');
{
  // k brackets everything engine.ts uses (0.05 … 0.2) plus degenerate, oversized and negative k.
  const KS = [0, 0.02, 0.05, 0.07, 0.08, 0.1, 0.12, 0.18, 0.2, 0.5, 1, 2, -0.2, -1];
  const STATS = Array.from({ length: 20 }, (_, i) => i + 1);
  let neutral = 0, sameCurve = 0, symmetric = 0, bounded = 0, monotone = 0, n = 0;
  for (const k of KS) {
    // THE NEUTRAL POINT IS 10, WRITTEN AS 10. mental.ts derives it as `norm(10) - NEUTRAL` from two of
    // its own constants; re-deriving it the same way here would pass for ANY pair of constants that
    // happen to agree, which is precisely the "gate that rebuilds its fixture from the thing under test"
    // failure division_balance.ts records against itself. 10 is the football scale's midpoint, and being
    // centred on it is the entire claim that keeps base/NFT/test players unchanged.
    if (mMul(10, k) === 1 && mAdd(10, k) === 0 && mMul(undefined, k) === 1 && mAdd(undefined, k) === 0) neutral++;
    for (const s of STATS) {
      n++;
      if (NEAR(mMul(s, k) - 1, mAdd(s, k))) sameCurve++;                      // multiplier and adder agree
      if (NEAR(mAdd(10 - (s - 10), k), -mAdd(s, k))) symmetric++;             // equal and opposite about 10
      const lim = Math.abs(k) * 0.5;
      if (Math.abs(mAdd(s, k)) <= lim + 1e-12 && Math.abs(mMul(s, k) - 1) <= lim + 1e-12) bounded++;
      if (s < 20) {
        const step = mAdd(s + 1, k) - mAdd(s, k);
        if (k > 0 ? step > 0 : k < 0 ? step < 0 : step === 0) monotone++;
      }
    }
  }
  ok('stat 10 (and a missing stat) is exactly neutral for every k', neutral === KS.length, `${neutral}/${KS.length} k values`);
  ok('mMul(s,k) - 1 === mAdd(s,k) everywhere', sameCurve === n, `${sameCurve}/${n}`);
  ok('the curve is equal-and-opposite about 10', symmetric === n, `${symmetric}/${n}`);
  ok('|effect| never exceeds k/2 over the legal 1-20 range', bounded === n, `${bounded}/${n}`);
  ok('strictly monotone in the stat (sign follows k)', monotone === KS.length * 19, `${monotone}/${KS.length * 19}`);
  // A multiplier reaching 0 would erase a duel outright. |k| < 2 is ten times the largest k in engine.ts.
  let positive = 0, m = 0;
  for (const k of KS.filter((x) => Math.abs(x) < 2)) for (const s of STATS) { m++; if (mMul(s, k) > 0) positive++; }
  ok('mMul stays strictly positive for every |k| < 2', positive === m, `${positive}/${m}`);
  // Out-of-range but FINITE input must not produce garbage. It is NOT clamped back to 1-20 (see MEASURED),
  // but it must at least stay finite, or one odd stat turns a probability into NaN.
  let finite = 0, f = 0;
  for (const k of KS) for (const s of [-40, -1, 0, 21, 40, 1e6]) { f++; if (Number.isFinite(mMul(s, k)) && Number.isFinite(mAdd(s, k))) finite++; }
  ok('finite input always yields finite output', finite === f, `${finite}/${f}`);
}

// ── §2  hasTrait: exact whole ids, and the SAME namespace the game actually mints ────────────────────
console.log('\n=== 2. hasTrait matches whole trait IDS, in the namespace the game writes ===');
const CATALOGUE = TRAITS.map((t) => t.id);
{
  ok('a player with NO trait list is not a false positive', hasTrait(bare(undefined), 'clinical') === false);
  ok('a null trait list is not a false positive', hasTrait(bare(null), 'clinical') === false);
  ok('an empty trait list is not a false positive', hasTrait(bare([]), 'clinical') === false);
  ok('an exact id matches', hasTrait(bare(['clinical']), 'clinical') === true);
  ok('an id in second position still matches', hasTrait(bare(['mercenary', 'wall']), 'wall') === true);

  // Substring probes DERIVED FROM THE CATALOGUE, not invented. `Array.includes` is exact today; an
  // implementation that normalised or joined the list would light these up. Every probe is a real
  // fragment of a real id, so this cannot be satisfied by an id set that happens to be well separated.
  let bleed = 0, probes = 0;
  for (const id of CATALOGUE) {
    const frags = [id.slice(0, -1), id.slice(1), id.slice(1, -1), id.slice(0, Math.max(1, Math.floor(id.length / 2)))].filter((x) => x.length > 2 && x !== id);
    for (const frag of new Set(frags)) { probes++; if (hasTrait(bare([id]), frag)) bleed++; }
  }
  ok('a proper FRAGMENT of a real id never matches it', bleed === 0, `${probes} fragments from ${CATALOGUE.length} ids`);
  let cross = 0, pairs = 0;
  for (const a of CATALOGUE) for (const b of CATALOGUE) if (a !== b) { pairs++; if (hasTrait(bare([a]), b)) cross++; }
  ok('no catalogue id matches any OTHER catalogue id', cross === 0, `${pairs} ordered pairs`);
  const missing = ENGINE_TRAITS.filter((t) => !CATALOGUE.includes(t));
  ok('every trait id the engine reads is a real earnable trait', missing.length === 0, missing.length ? missing.join(',') : ENGINE_TRAITS.join(','));
}

// ── the pyramid census: real minted squads, reused by the producer check and the MEASURED section ────
interface Census { squads: number; players: number; gks: number; gkWall: number; inverted: number; bestLead: number; trait: Record<string, number>; foreign: string[] }
function census(tier: number, samples: number): Census {
  const c: Census = { squads: 0, players: 0, gks: 0, gkWall: 0, inverted: 0, bestLead: 0, trait: {}, foreign: [] };
  for (const id of ENGINE_TRAITS) c.trait[id] = 0;
  for (let s = 0; s < samples; s++) {
    const club = generateClub(`c${s}`, `C${s}`, 1, tierStrength(tier), s * 7919 + tier, true);
    for (const p of club.players) {
      c.players++;
      for (const t of p.traits ?? []) if (typeof t !== 'string' || !CATALOGUE.includes(t)) c.foreign.push(String(t));
      for (const id of ENGINE_TRAITS) if (hasTrait(p, id)) c.trait[id]++;
      if (p.role === 'GK') { c.gks++; if (hasTrait(p, 'wall')) c.gkWall++; }
    }
    const xi = club.players.slice(0, 11);
    const best = Math.max(...xi.map((p) => p.attrs.leadership ?? 10));
    const bi = xi.findIndex((p) => (p.attrs.leadership ?? 10) === best);
    if (teamLeadership(xi.map((p, i) => (i === bi ? { ...p, captain: true } : p))) < teamLeadership(xi)) c.inverted++;
    c.bestLead += best; c.squads++;
  }
  return c;
}
const CENSUS = Array.from({ length: TIERS }, (_, i) => census(i + 1, 30));
{
  // THE PRODUCER CONTRACT — the check that actually protects the trait bonuses. `teams.ts:136` writes
  // `earned.map((t) => t.id)` while `tokens.ts:248` writes `.name` for the career screen; the two live
  // four lines apart in style and one of them is what hasTrait can read. If the wrong one ever reached
  // Player.traits, or the catalogue ids were renamed, every trait bonus in engine.ts would go dark in
  // total silence. So: read the players the game really mints and confirm the ids line up.
  const foreign = CENSUS.flatMap((c) => c.foreign);
  const totalPlayers = CENSUS.reduce((s, c) => s + c.players, 0);
  ok('every trait a real minted player carries is a catalogue id', foreign.length === 0, foreign.length ? `${foreign.length} foreign, e.g. ${foreign.slice(0, 3).join(',')}` : `${totalPlayers} players across ${TIERS} tiers`);
  const seen = ENGINE_TRAITS.filter((id) => CENSUS.some((c) => c.trait[id] > 0));
  ok('every engine-read trait is actually reachable on a real minted player', seen.length === ENGINE_TRAITS.length, `${seen.length}/${ENGINE_TRAITS.length}: ${seen.join(',')}`);
}

// ── §3  teamLeadership: bounded, monotone, and the armband means what the comment says ───────────────
console.log('\n=== 3. teamLeadership is a SMALL, bounded, monotone team effect ===');
{
  const squad = (leads: Array<number | undefined>, capIdx = -1): Player[] =>
    leads.map((l, i) => ({ ...bare(undefined, l), id: `p${i}`, name: `P${i}`, captain: i === capIdx ? true : undefined }));
  const eleven = (l: number | undefined) => squad(Array.from({ length: 11 }, () => l));

  ok('an XI with no leadership stats is exactly neutral', teamLeadership(eleven(undefined)) === 0);
  ok('an XI of tens is exactly neutral', teamLeadership(eleven(10)) === 0);
  ok('naming a captain on a neutral XI is still exactly neutral', teamLeadership(squad(Array.from({ length: 11 }, () => 10), 4)) === 0);
  ok('one leader does not drag an otherwise-neutral XI negative', teamLeadership(squad([15, ...Array.from({ length: 10 }, () => undefined)])) > 0);

  // The bonus lands straight on goalProb (engine.ts:656), which spans 0.03-0.90. It has to stay small
  // enough that it cannot outweigh shot quality, or one stat decides matches on its own.
  let worst = 0, cases = 0;
  for (let a = 1; a <= 20; a++) for (let b = 1; b <= 20; b++) for (const cap of [-1, 0, 1]) {
    cases++;
    worst = Math.max(worst, Math.abs(teamLeadership(squad([a, b, ...Array.from({ length: 9 }, () => 10)], cap))));
  }
  ok('the team bonus never exceeds ±0.025 of goal probability', worst <= 0.025 + 1e-12, `worst |bonus| ${worst.toFixed(5)} over ${cases} squads`);

  // Monotone: a better-led side is never handed a worse bonus. This is the one property the engine's
  // caller relies on, and it must hold in both branches.
  let monoFree = 0, monoCap = 0, steps = 0;
  for (let l = 1; l < 20; l++) {
    steps++;
    if (teamLeadership(eleven(l + 1)) > teamLeadership(eleven(l))) monoFree++;
    if (teamLeadership(squad(Array.from({ length: 11 }, () => l + 1), 0)) > teamLeadership(squad(Array.from({ length: 11 }, () => l), 0))) monoCap++;
  }
  ok('raising every player\'s leadership always raises the bonus (no captain)', monoFree === steps, `${monoFree}/${steps}`);
  ok('...and with a captain named', monoCap === steps, `${monoCap}/${steps}`);

  // The captain branch must read the CAPTAIN, not the best man in the room — otherwise the armband is
  // decoration and the manager's designation means nothing.
  const mixed = [20, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
  const capBest = teamLeadership(squad(mixed, 0)), capWorst = teamLeadership(squad(mixed, 1)), noCap = teamLeadership(squad(mixed));
  ok('naming the best leader beats naming the worst', capBest > capWorst, `${capBest.toFixed(5)} vs ${capWorst.toFixed(5)}`);
  ok('a poor skipper costs a strong side its natural leader', capWorst < noCap, `${capWorst.toFixed(5)} vs ${noCap.toFixed(5)} uncaptained`);
  // The armband is an AMPLIFIER (0.05 against 0.045), so it can only ever move the number by a hair.
  // Bounding the hair is what stops "slightly amplified" quietly becoming "doubled" in a later tune —
  // and it bounds the cost of the sign inversion reported as M2 below.
  let widest = 0;
  for (let l = 1; l <= 20; l++) {
    const s = Array.from({ length: 11 }, () => l);
    widest = Math.max(widest, Math.abs(teamLeadership(squad(s, 0)) - teamLeadership(squad(s))));
  }
  ok('the armband never shifts the bonus by more than 0.0025', widest <= 0.0025 + 1e-12, `widest ${widest.toFixed(5)}`);
}

// ── §4  end-to-end: NEUTRAL when absent, demonstrably LIVE when present ──────────────────────────────
console.log('\n=== 4. through the real MatchEngine ===');
const N = Number(process.env.QA_MENTAL_N ?? 14);
const sig = (evts: MatchEvent[], score: [number, number]) =>
  `${score[0]}-${score[1]}|${evts.map((e) => `${e.minute}${e.type}${e.teamIdx}${e.playerName ?? ''}`).join(';')}`;

const FIXTURES = Array.from({ length: N }, (_, i) => {
  // Sweep the pyramid rather than one quality point: an effect measured at a single squad strength is
  // an extremum standing in for a population, which this repo has shipped before.
  const q = 8 + (i % 9);
  return { a: generateTeam('a', 'A', 1, q, i * 7919 + 1, '4-4-2'), b: generateTeam('b', 'B', 2, q, i * 7919 + 1, '4-4-2'), seed: i * 104729 + 3 };
});
function sweep(mut: (a: Team, b: Team) => void): { sigs: string[]; gd: number; gf: number } {
  const sigs: string[] = []; let gd = 0, gf = 0;
  for (const f of FIXTURES) {
    const a = clone(f.a), b = clone(f.b); mut(a, b);
    const m = new MatchEngine([a, b], f.seed, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    while (!m.state.finished) m.tick();
    const score = m.state.score as [number, number];
    sigs.push(sig(m.state.events, score)); gd += score[0] - score[1]; gf += score[0];
  }
  return { sigs, gd: gd / N, gf: gf / N };
}
const moved = (x: string[], y: string[]) => x.filter((s, i) => s !== y[i]).length;

const BASE = sweep(() => {});
{
  // NEUTRALITY — the claim that keeps `verify` green. A squad with the layer spelled out as tens must be
  // indistinguishable from one that has never heard of it: every event, not just the final score.
  const tens = sweep((a, b) => { setAll(a, 10); setAll(b, 10); for (const p of [...a.players, ...b.players]) p.traits = []; });
  ok('an all-10 mental layer + empty traits replays the bare match EXACTLY', moved(BASE.sigs, tens.sigs) === 0, `${N} fixtures, ${moved(BASE.sigs, tens.sigs)} differ`);
  const junk = sweep((a) => { for (const p of a.players) p.traits = ['not-a-trait', 'CLINICAL', 'Clinical Finisher']; });
  ok('unknown, upper-cased and display-NAME trait ids are inert', moved(BASE.sigs, junk.sigs) === 0, `${moved(BASE.sigs, junk.sigs)} of ${N} fixtures moved`);
}
{
  // THE WHOLE LAYER REACHES THE PITCH. Unwired, or with every k zeroed, these two configurations are the
  // same match and the swing is exactly 0.
  const hi = sweep((a, b) => { setAll(a, 20); setAll(b, 1); });
  const lo = sweep((a, b) => { setAll(a, 1); setAll(b, 20); });
  const swing = hi.gd - lo.gd;
  ok('max-mental XI vs min-mental XI swings goal difference by 2+ a match', swing >= 2, `${swing.toFixed(2)} goals/match (GD ${hi.gd.toFixed(2)} vs ${lo.gd.toFixed(2)})`);
}
{
  // EVERY STAT, INDIVIDUALLY. Dropping `mMul(def.attrs.aggression, …)` leaves the other four working and
  // every aggregate gate green; only a per-stat sweep can see one hook go dark.
  const rates: string[] = []; let live = 0;
  for (const k of MENTALS) {
    const r = moved(BASE.sigs, sweep((a) => setM(a, k, 20)).sigs);
    rates.push(`${k} ${Math.round((100 * r) / N)}%`);
    if (r >= 2) live++;
  }
  ok('each of the five mental stats measurably changes real matches', live === MENTALS.length, rates.join('  '));
}
{
  // EVERY TRAIT ID, INDIVIDUALLY — the check that a bonus keyed on a string literal can actually fire.
  const rates: string[] = []; let live = 0;
  for (const id of ENGINE_TRAITS) {
    const r = moved(BASE.sigs, sweep((a) => { for (const p of a.players) if (id !== 'wall' || p.role === 'GK') p.traits = [id]; }).sigs);
    rates.push(`${id} ${Math.round((100 * r) / N)}%`);
    if (r >= 3) live++;
  }
  ok('each of the five engine-read traits measurably changes real matches', live === ENGINE_TRAITS.length, rates.join('  '));
}

// ── MEASURED (NOT gated) — defects found writing this file ───────────────────────────────────────────
// Reported rather than asserted: pinning today's behaviour would turn this harness red the day somebody
// fixes one of them. Every number below is measured on this run, not quoted from a comment.
console.log('\n=== MEASURED — reported as defects, NOT gated ===');
{
  // M1 — a non-finite mental stat is not defended against. `norm` is `(v ?? 10) / 20`, which catches
  // null/undefined and lets NaN straight through — unlike `overall()` twelve files away in teams.ts,
  // whose own comment records that exactly this NaN "permanently poisoned the wallet". A NaN reaching
  // goalProb makes `rng() < NaN` false forever, so the side simply stops scoring, silently.
  const nan = sweep((a) => { a.players[5].attrs.leadership = NaN; });
  console.log(`  M1 ONE outfielder with a NaN leadership → team A scores ${(nan.gf * N).toFixed(0)} in ${N} matches; healthy baseline ${(BASE.gf * N).toFixed(0)}. No throw, no log, overall() still reads normal.`);
  console.log(`     mMul(NaN,0.2)=${mMul(NaN, 0.2)}  mAdd(NaN,0.1)=${mAdd(NaN, 0.1)}  teamLeadership([one NaN player])=${teamLeadership([bare(undefined, NaN)])}`);

  // M2 — teamLeadership's comment promises "Naming your best leader = strictly best". It used not to be:
  // the armband AMPLIFIED (0.05 vs 0.045), and amplifying a below-neutral number makes it worse, so the
  // claim inverted for every squad whose best leader is under 10 — 30% of tier 7 and 100% of tiers 8, 9
  // and 10, which is where every dynasty starts. Fixed by making the armband a clamped BONUS. These were
  // console.log lines when this harness was written, because the defect was live and a bar would have
  // made the build red; now that it is fixed they are bars, or the fix has nothing holding it.
  const rows = CENSUS.map((c, i) => ({ tier: i + 1, pct: Math.round((100 * c.inverted) / c.squads), lead: c.bestLead / c.squads }))
    .filter((r) => r.pct > 0).map((r) => `tier ${r.tier} (best leader ${r.lead.toFixed(1)}): ${r.pct}%`);
  ok('naming the best leader as captain is never WORSE, at any tier', rows.length === 0,
    rows.length ? rows.join('; ') : 'no inversions in any division');
  ok('an empty squad reads as neutral, not as the worst-led side in the game', teamLeadership([]) === 0,
    `teamLeadership([]) = ${teamLeadership([])}`);
  // and the weakness of the lower divisions must SURVIVE that fix — a neutral floor would erase it
  const weak = CENSUS[TIERS - 1].bestLead / CENSUS[TIERS - 1].squads;
  ok('the bottom division still reads as genuinely poorly led', weak < 9, `tier ${TIERS} best leader ${weak.toFixed(1)}`);

  // M4 — the sim path cannot see any of this. `squadStrength()` is a mean of `overall()`, and
  // `overall()` reads none of the five mental stats.
  const t = generateTeam('a', 'A', 1, 12, 42, '4-4-2');
  const mean = (x: Team) => x.players.reduce((s, p) => s + overall(p), 0) / x.players.length;
  const lo = clone(t), hi = clone(t), phys = clone(t);
  setAll(lo, 1); setAll(hi, 20);
  for (const p of phys.players) p.attrs.pace = Math.min(20, p.attrs.pace + 3);
  console.log(`  M4 overall() moves ${(mean(hi) - mean(lo)).toFixed(4)} between a min-mental and a max-mental XI (+3 pace moves it ${(mean(phys) - mean(t)).toFixed(4)}) — the layer that swings goal difference several goals a match is worth exactly that much to the table, the market and the Sim button.`);

  // M5 — the traits the engine reads are only reachable near the top of the pyramid, and The Wall gets
  // RARER as keepers get better, because eligibleTraits(...).slice(0, MAX_TRAITS) takes catalogue order
  // and 'wall' sits ninth, behind traits an elite keeper also qualifies for.
  for (const tier of [1, 2, 3, 6, 8, 10]) {
    const c = CENSUS[tier - 1];
    const pct = (n: number, d: number) => `${d ? Math.round((100 * n) / d) : 0}%`;
    console.log(`  M5 tier ${String(tier).padStart(2)}: ` + ENGINE_TRAITS.map((id) => `${id} ${pct(c.trait[id], c.players)}`).join(' ') + `  | keepers with The Wall ${pct(c.gkWall, c.gks)}`);
  }
}

console.log(fails ? `\n✗ ${fails} mental-layer check(s) failed` : '\n✓ the mental layer is neutral when absent and demonstrably live when present');
if (fails) process.exit(1);
