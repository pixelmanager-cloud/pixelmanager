// PLAYING AT HOME SHOULD BE WORTH SOMETHING, AND IT SHOULD BE WORTH IT TO WHOEVER IS AT HOME.
//
// There was no venue effect in this game at all. `fanHomeBoost` is a Fan Zone UPGRADE and returns exactly
// 1.0 at level 1, so an unimproved club got nothing for hosting. And it was worse than missing: the team
// talk sets `myTeam.homeBoost` to 1.04-1.08 in EVERY match, home or away, while `oppTeam.homeBoost` was
// never assigned anywhere -- so the player carried a shot-volume edge in every fixture of his career and a
// host never carried one. A permanent player advantage wearing a home advantage's name.
//
// Two things are guarded here, because fixing one without the other is how this happened:
//   1. the CALIBRATION — HOME_EDGE actually produces a home edge, and the engine is symmetric without it;
//   2. the WIRING — both match paths hand the edge to the side that is actually hosting.
import { readFileSync } from 'node:fs';
import { MatchEngine, generateTeam, autoPickXI, buildXI, DEFAULT_TACTICS, HOME_EDGE } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

function run(boost: number, n = 500) {
  let h = 0, a = 0, d = 0;
  for (let i = 0; i < n; i++) {
    const t: any = generateTeam('x', 'X', 0x445566, 12, 1000 + i, '4-4-2');
    const xi = buildXI(t, autoPickXI(t, '4-4-2'));
    // THE SAME ELEVEN ON BOTH SIDES. Anything other than a coin flip at boost 1.0 would be a geometry bug,
    // not a home advantage, and would make every number below meaningless.
    const e: any = new MatchEngine([{ ...xi, homeBoost: boost }, xi], 5000 + i, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
    if (e.state.score[0] > e.state.score[1]) h++; else if (e.state.score[1] > e.state.score[0]) a++; else d++;
  }
  return { homePpg: (3 * h + d) / n, awayPpg: (3 * a + d) / n, h, a, d, n };
}

console.log('=== Playing at home is worth something ===');
const flat = run(1.0);
const edge = run(HOME_EDGE);
console.log(`  no edge:   home ${flat.homePpg.toFixed(2)} ppg vs away ${flat.awayPpg.toFixed(2)}  (${flat.h}W-${flat.d}D-${flat.a}L)`);
console.log(`  HOME_EDGE: home ${edge.homePpg.toFixed(2)} ppg vs away ${edge.awayPpg.toFixed(2)}  (${edge.h}W-${edge.d}D-${edge.a}L)`);
// Identical elevens, so a real gap either way at boost 1.0 is an engine asymmetry. +/-0.25 ppg is about
// three standard errors at this n.
ok(Math.abs(flat.homePpg - flat.awayPpg) < 0.25,
  `the engine is symmetric with no edge (gap ${(flat.homePpg - flat.awayPpg).toFixed(2)} ppg)`);
ok(edge.homePpg - edge.awayPpg > 0.15,
  `HOME_EDGE buys a real home advantage (+${(edge.homePpg - edge.awayPpg).toFixed(2)} ppg)`);
// Real football is about +0.33 to +0.40. Half of that is what shot volume can buy without distorting the
// match; three times it would mean something has run away.
ok(edge.homePpg - edge.awayPpg < 0.60,
  `but not an implausible one (+${(edge.homePpg - edge.awayPpg).toFixed(2)} ppg; real football is about +0.35)`);

console.log('\n=== ...and it goes to whoever is hosting ===');
const main = readFileSync('client/src/main.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
// The defect was that only the PLAYER's team was ever given a venue edge. Both match paths -- the one that
// plays the fixture and the one that sims it -- must hand it to the opponent when the opponent is at home.
const oppGets = (main.match(/oppTeam\.homeBoost\s*=/g) ?? []).length;
ok(oppGets >= 2, `both the played and simmed paths give the host his edge when it is the opponent (${oppGets} sites)`);
ok(/HOME_EDGE/.test(main), 'and they use the shared HOME_EDGE rather than a second copy of the number');
console.log(fails ? `\n✗ ${fails} home-advantage check(s) failed` : `\n✓ home advantage exists, and belongs to the home side`);
if (fails) process.exitCode = 1;
