// THE CONTINENTAL FINAL IS PLAYED ON NEUTRAL GROUND WHETHER YOU PLAY IT OR SIM IT.
//
// The tie card above the two buttons prints "(neutral)" for the final, `contOpponent` flags it
// `neutral: r === 2`, and the PLAYED path honours that: `startSpMatchWith` guards BOTH of its venue lines
// with `!sp.neutral`, so on a final nobody carries a host's edge. `simContinentalTie` could not honour it,
// because `simEdge` only speaks `'home' | 'away'` — 'neutral' cannot be expressed in its signature. The
// final therefore resolved to `'away'`, and simEdge's away branch is an ACTIVE PENALTY (`-0.25`), not
// merely a missing bonus: pressing "Sim it" on the club's biggest match handed the opponent the full home
// edge that the played path gives to nobody. Worst case below, that is 11.3 points of win probability.
//
// The sibling competition already gets this right and says so — `simWorldCupTie` destructures `strDelta`
// alone and passes a literal `0` for the home term, "was an unearned +0.25" (PT-129/130).
//
// Guarded here because a venue term is invisible from the outside: it produces a plausible scoreline, no
// error, no NaN, and the result is deterministic per save, so no player can even see it as variance.
//   1. the final really IS the neutral round, and the played path really does treat it as neutral —
//      otherwise "the sim matches the played tie" agrees about nothing;
//   2. the lift can see a venue term at all: the quarter-final must come out positive and the semi-final
//      negative, or everything below is reading a constant;
//   3. THE CHECK — the home term that actually reaches `simFixtureResult` for the final is 0;
//   4. and the club's own edge still reaches it, so nobody "fixes" this by simming the final bare.
//
// The venue decision is LIFTED OUT OF main.ts AND EVALUATED rather than pattern-matched: main.ts is a
// browser module nothing can import, and an `atHome` that consulted `tie.neutral` and then threw the
// answer away would satisfy any grep.
//
// Run: `npx tsx tools/playtest/cont_final_neutral.ts`
import { readFileSync } from 'node:fs';
import { contOpponent, goalPair, mixSeed, trainingConditioning, dataEdge, fanHomeBoost } from '@fm/shared';

const src = readFileSync('client/src/main.ts', 'utf8');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== A simmed Continental Cup final is played on the neutral ground it says it is ===');

/** The BODY of a method on Game — the signature line is dropped whole, because simEdge's return-type
 *  annotation carries a `{` of its own — down to the first brace at method indentation. */
function methodBody(sig: string): string {
  const n = src.split(sig).length - 1;
  ok(n === 1, `\`${sig}\` appears exactly once in client/src/main.ts (found ${n})`);
  if (n !== 1) { console.log('\n✗ the continental sim moved or was renamed — this probe is blind and must be re-pointed, not deleted'); process.exit(1); }
  const i = src.indexOf(sig), end = src.indexOf('\n  }', i);
  return src.slice(src.indexOf('\n', i) + 1, end);
}
/** `new Function` is a JavaScript parser: rewrite `this.` and strip the one TypeScript cast these bodies
 *  carry. Narrow on purpose — a cast this does not know about throws below, so the probe goes red rather
 *  than silently measuring nothing. */
const deTs = (s: string) => s.replace(/ as 0 \| 1 \| 2\b/g, '').replace(/\bthis\./g, 'self.');

const edgeBody = deTs(methodBody("private simEdge(venue: 'home' | 'away')"));
const tieBody = deTs(methodBody('private simContinentalTie()'));
const playBody = methodBody('private playContinentalTie()');
type Edge = { strDelta: number; homeTerm: number };
let edgeFn: (venue: string, self: any, tc: any, de: any, fh: any) => Edge;
let tieFn: (self: any, contOpponent: any) => void;
try {
  edgeFn = new Function('venue', 'self', 'trainingConditioning', 'dataEdge', 'fanHomeBoost', edgeBody) as any;
  tieFn = new Function('self', 'contOpponent', tieBody) as any;
} catch (e) {
  ok(false, `the venue decision could not be lifted out of main.ts and run (${(e as Error).message})`);
  console.log('\n✗ lift failed — re-point this probe rather than deleting it');
  process.exit(1);
}

type Fac = { training: number; fanzone: number; data: number };
const L1: Fac = { training: 1, fanzone: 1, data: 1 };
const MY_STRENGTH = 15;

/** Run the real venue decision for one round and report what actually reached `simFixtureResult`. */
function simTie(round: 0 | 1 | 2, fac: Fac = L1, staff: string[] = []) {
  let got: { myStr: number; oppStr: number; homeTerm: number } | null = null;
  const self: any = {
    facLevels: fac,
    loadMgr: () => ({ contRound: round, contElig: true, contOut: false, season: 4, staff }),
    genSeed: () => 20250905,
    clubLeagueStrength: () => MY_STRENGTH,
    simEdge: (v: string) => edgeFn(v, self, trainingConditioning, dataEdge, fanHomeBoost),
    simFixtureResult: (myStr: number, oppStr: number, _seed: number, homeTerm: number) => {
      got = { myStr, oppStr, homeTerm }; return { myGoals: 1, oppGoals: 0 };
    },
    resolveContinental: () => {},
  };
  tieFn(self, contOpponent);
  if (got === null) { ok(false, `round ${round}: the lifted tie never reached simFixtureResult — the lift is dead and nothing below means anything`); process.exit(1); }
  return got as { myStr: number; oppStr: number; homeTerm: number };
}

// ── 1. the final really is the neutral round, and the played path really honours it ───────────────
let neutralFinals = 0, hostedEarlier = 0;
for (let s = 1; s <= 400; s++) for (let season = 1; season <= 12; season++) {
  if (contOpponent(s, season, 2).neutral) neutralFinals++;
  if (!contOpponent(s, season, 0).neutral && !contOpponent(s, season, 1).neutral) hostedEarlier++;
}
console.log(`  ..   contOpponent over 4,800 (seed, season) draws: final neutral ${neutralFinals}/4800 · QF and SF neutral 0/${hostedEarlier}`);
ok(neutralFinals === 4800 && hostedEarlier === 4800, 'the final is the neutral round and the earlier two are not (else there is nothing here to check)');
ok(/neutral: tie\.neutral/.test(playBody), 'the PLAYED tie still carries `neutral: tie.neutral` into the fixture');
ok((src.split("if (sp.venue === 'home' && !sp.neutral)").length - 1) === 1
  && (src.split("if (sp.venue !== 'home' && !sp.neutral)").length - 1) === 1,
  'and startSpMatchWith still withholds BOTH venue edges on a neutral tie (so "the sim matches the played tie" means something)');

// ── 2. the lift can see a venue term at all ───────────────────────────────────────────────────────
const qf = simTie(0), sf = simTie(1), fin = simTie(2);
const sgn = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(3)}`;
console.log(`  ..   home term reaching simFixtureResult: QF ${sgn(qf.homeTerm)} · SF ${sgn(sf.homeTerm)} · FINAL ${sgn(fin.homeTerm)}`);
ok(qf.homeTerm > 0, `the quarter-final is at home and carries a host's edge (${sgn(qf.homeTerm)})`);
ok(sf.homeTerm < 0, `the semi-final is away and carries the away penalty (${sgn(sf.homeTerm)}) — so this harness reads the real venue`);

// ── 3. THE CHECK ──────────────────────────────────────────────────────────────────────────────────
ok(fin.homeTerm === 0, `the FINAL is neutral: neither side gets a venue term (got ${sgn(fin.homeTerm)})`);

// ── 4. ...but the club you built still turns up for it ────────────────────────────────────────────
const maxed = simTie(2, { training: 5, fanzone: 5, data: 5 }, ['fitness', 'attack', 'assistant']);
console.log(`  ..   neutral final, facilities L1 vs L5 + full backroom: strength ${fin.myStr.toFixed(2)} → ${maxed.myStr.toFixed(2)}`);
ok(maxed.myStr > fin.myStr, 'neutral ground withholds the VENUE edge only — training, data and staff still reach the final');

// ── SIZE, and the mutation control that stops the check above being decoration ────────────────────
// The real goalPair for the ninety minutes plus resolveContinental's seeded shootout (0.5 + gap*0.03) for
// a level tie. If a home term could not move this number, assertion 3 would be guarding nothing at all.
function winRate(homeTerm: number, gap: number) {
  let won = 0;
  const N = 20000;
  for (let s = 1; s <= N; s++) {
    const h = mixSeed(Math.imul(s, 2654435761) >>> 0);
    const [mine, theirs] = goalPair(h, gap * 0.10 + homeTerm);
    if (mine > theirs) won++;
    else if (mine === theirs && ((mixSeed((h ^ 0x5bf03635) >>> 0) % 1000) / 1000) < 0.5 + gap * 0.03) won++;
  }
  return won / N;
}
const GAPS = [-4, -2, 0, 2, 4];
const neutralWin = GAPS.map((g) => winRate(0, g));
const awayWin = GAPS.map((g) => winRate(-0.25, g));
const row = (r: number[]) => GAPS.map((g, i) => `${g >= 0 ? '+' : ''}${g}:${(r[i] * 100).toFixed(1)}%`).join(' · ');
console.log(`  ..   win% by strength gap, final on neutral ground: ${row(neutralWin)}`);
console.log(`  ..   win% by strength gap, final simmed AWAY:       ${row(awayWin)}`);
const cost = Math.max(...GAPS.map((_, i) => neutralWin[i] - awayWin[i]));
console.log(`  ..   an away term on the final costs up to ${(cost * 100).toFixed(1)} percentage points of win probability`);
ok(cost > 0.05, `the measurement can see a venue term at all (forcing -0.25 costs ${(cost * 100).toFixed(1)}pp — the mutation control for the check above)`);

console.log(fails ? `\n✗ ${fails} check(s) failed — the continental final is not being simmed on the neutral ground it is played on` : '\n✓ the continental final is neutral whether you play it or sim it');
if (fails) process.exitCode = 1;
