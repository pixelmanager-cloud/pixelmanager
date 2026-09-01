// THE FIRST SCREEN MUST NOT DECIDE THE CAREER. A new player picks goalkeeper or outfield before he knows
// anything about the game, and that choice used to be worth +3.125 overall (95% CI [2.972, 3.278]) --
// larger than any decision he makes in the 120 turns that follow.
//
// The cause was arithmetic, not design: `careerOverall` averaged GK over THREE stats against five for DF
// and MF, and averaging fewer regresses to the mean less. None of the three was a gene-capped physical
// either, so a keeper dodged the one term that holds outfield ratings down.
import { simCareer, careerOverall } from '../../shared/src/career.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const STYLE: any = { name: 'B', pref: { composure: 1, teamwork: 0.8 }, skill: 0.85 };
const N = 300;
const d: number[] = [];
let gkSum = 0, outSum = 0;
for (let s = 0; s < N; s++) {
  // MATCHED SEEDS: the same career seed down both tracks, so the difference is the track and nothing else.
  const g: any = simCareer(s, STYLE, undefined, 'goalkeeper');
  const o: any = simCareer(s, STYLE, undefined, 'outfield');
  const go = careerOverall(g.attrs, g.role), oo = careerOverall(o.attrs, o.role);
  gkSum += go; outSum += oo; d.push(go - oo);
}
const mean = d.reduce((a, b) => a + b, 0) / d.length;
const sd = Math.sqrt(d.reduce((a, b) => a + (b - mean) ** 2, 0) / (d.length - 1));
const ci = 1.96 * sd / Math.sqrt(d.length);
console.log(`=== Neither track is the right answer ===`);
console.log(`  ${N} matched seeds: GK ${(gkSum / N).toFixed(2)}  outfield ${(outSum / N).toFixed(2)}  gap ${mean >= 0 ? '+' : ''}${mean.toFixed(3)} +/- ${ci.toFixed(3)}`);
// A whole point of overall is a lot for a coin flip taken in ignorance; half of one is tolerable.
ok(Math.abs(mean) < 1.0, `picking a track is not worth a point of overall (${mean >= 0 ? '+' : ''}${mean.toFixed(3)})`);
ok(gkSum / N > 8 && outSum / N > 8, `both tracks still graduate real players (GK ${(gkSum / N).toFixed(1)}, outfield ${(outSum / N).toFixed(1)})`);
console.log(fails ? `\n✗ ${fails} track-parity check(s) failed` : `\n✓ the first screen is a choice of fantasy, not of rating`);
if (fails) process.exitCode = 1;
