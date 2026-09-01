// THROWAWAY — does the 'chance' EVENT equal a clear-run flag set? (resolveShot also pushes 'chance' for
// a poacher rebound, engine.ts:941 — if that is common, any ticks-per-chance figure using the event as a
// denominator is diluted.)
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { FORMATIONS, type Formation } from '../../shared/src/formations.js';
const SHAPES = Object.keys(FORMATIONS) as Formation[];
const mk = (f: Formation, s: number) => { const c = generateTeam(`t${s}`, 'T', 0x445566, 12, s, f); return buildXI(c, autoPickXI(c, f)); };
const E: any = (MatchEngine as any).prototype; const origShot = E.resolveShot;
let inShot = 0, flagSets = [0, 0], chanceInShot = 0, chanceTotal = 0;
E.resolveShot = function (this: any, ...a: any[]) { inShot++; const b = this.state.events.length; const r = origShot.apply(this, a); inShot--; chanceInShot += this.state.events.slice(b).filter((e: any) => e.type === 'chance').length; return r; };
let ev = 0, sets = 0;
let seed = 1;
for (const A of SHAPES) for (const B of SHAPES) { if (A === B) continue;
  const s = seed++; const e: any = new MatchEngine([mk(A, s * 7 + 1), mk(B, s * 7 + 2)], s, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  let prev: [number, number] = [-1, -1], g = 0;
  while (!e.state.finished && g++ < 20000) { e.tick(); for (const t of [0, 1] as const) { if (e.clearRun[t] >= 0 && e.clearRun[t] !== prev[t]) sets++; prev[t] = e.clearRun[t]; } }
  ev += e.state.events.filter((x: any) => x.type === 'chance').length;
}
console.log(`'chance' events=${ev}  clearRun flag-sets=${sets}  of which pushed from inside resolveShot (poacher rebound)=${chanceInShot}  => event overcount = ${(100 * (ev - sets) / sets).toFixed(1)}%`);
