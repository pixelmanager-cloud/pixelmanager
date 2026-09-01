// ── EVERY TRAIT IN THE CATALOGUE HAS TO REACH THE GAME ───────────────────────────────────────────────
//
// A trait reaches the game exactly two ways: an `apply` hook that bumps a stat when it is locked in, or a
// `hasTrait` read somewhere the match is decided. Nine of nineteen traits had NEITHER, so they were pure
// decoration on a player card — 18.4% of every filled trait slot on squad players, and 60.4% on graduated
// bloodline stars, where `biggame` alone sat on 57.5% of careers doing nothing.
//
// This is the sibling of `field_wiring.ts` and `wired.ts`: a structural check that the thing exists AND a
// behavioural check that it bites. Both halves are needed. A `hasTrait` call site proves only that the id
// is mentioned; it took a measured match to show that hooking `livewire` into `beatsLastDefender`'s
// paceGap would have been worth +24.4% goals a match while the two speed terms are worth +7.2%.
import { readFileSync } from 'node:fs';
import { MatchEngine } from '../../shared/src/engine.js';
import { TRAITS } from '../../shared/src/career.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import type { Team } from '../../shared/src/types.js';
import { rollMatchInjuries } from '../../shared/src/injuries.js';

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

// ── structural: is the id read anywhere the game is decided? ──
const SRC = ['engine.ts', 'mental.ts', 'injuries.ts', 'morale.ts', 'contracts.ts', 'squad.ts', 'teams.ts']
  .map((f) => { try { return readFileSync(new URL(`../../shared/src/${f}`, import.meta.url), 'utf8'); } catch { return ''; } })
  .join('\n');
const unreached = TRAITS.filter((t) => !t.apply && !SRC.includes(`'${t.id}'`)).map((t) => t.id);
check(unreached.length === 0,
  `every trait in the catalogue has an \`apply\` or a \`hasTrait\` call site${unreached.length ? ` — inert: ${unreached.join(', ')}` : ''}`);

// ── behavioural: does giving it to a side actually change the match? ──
const N = Number(process.env.N ?? 24);
const clone = (t: Team): Team => JSON.parse(JSON.stringify(t));
const sig = (m: MatchEngine) => `${m.state.score[0]}-${m.state.score[1]}|${m.state.events.length}`;

function sweep(mut: (a: Team, b: Team) => void): string[] {
  const out: string[] = [];
  for (let i = 0; i < N; i++) {
    const a = clone(generateTeam('a', 'A', 1, 14, i * 7919 + 1, '4-4-2'));
    const b = clone(generateTeam('b', 'B', 2, 14, i * 7919 + 1, '4-4-2'));
    mut(a, b);
    const m = new MatchEngine([a, b], i * 104729 + 3, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    while (!m.state.finished) m.tick();
    out.push(sig(m));
  }
  return out;
}
const BASE = sweep(() => {});
const moved = (x: string[]) => x.filter((s, i) => s !== BASE[i]).length;

// `biggame` is deliberately inert on an ordinary league week — it reads Team.stakes, which is absent
// unless the fixture is a cup tie. So it is measured WITH the occasion set, and separately asserted to
// change nothing without it. That pair is the whole point of the trait.
const NEWLY_WIRED: Array<{ id: string; setup?: (a: Team) => void }> = [
  { id: 'leader' }, { id: 'ironman' }, { id: 'general2' }, { id: 'livewire' }, { id: 'spark' },
  { id: 'biggame', setup: (a) => { a.stakes = 1; } },
];
for (const { id, setup } of NEWLY_WIRED) {
  const r = moved(sweep((a) => { for (const p of a.players) p.traits = [id]; setup?.(a); }));
  check(r >= 2, `'${id}' measurably changes real matches (${r}/${N} fixtures moved)`);
}
// `ironwill` is NOT reachable through MatchEngine: injuries are rolled by `rollMatchInjuries` AFTER the
// match, from `runMatch`. Measuring it on match signatures scored 0/24 and would have been read as a dead
// hook — the probe was wrong, not the wiring. It gets the path it actually lives on.
{
  const gassed = new Array(11).fill(0.35); // a tired XI, where the injury roll actually has teeth
  let base = 0, willed = 0;
  for (let i = 0; i < 400; i++) {
    const t = clone(generateTeam('a', 'A', 1, 14, i * 7919 + 1, '4-4-2'));
    base += rollMatchInjuries(t, gassed, 1, i * 31 + 7).length;
    for (const p of t.players) p.traits = ['ironwill'];
    willed += rollMatchInjuries(t, gassed, 1, i * 31 + 7).length;
  }
  check(willed < base, `'ironwill' measurably reduces injuries (${base} → ${willed} over 400 tired matches)`);
}

const occasionless = moved(sweep((a) => { for (const p of a.players) p.traits = ['biggame']; }));
check(occasionless === 0,
  `'biggame' is INERT on an ordinary league week, where Team.stakes is absent (${occasionless}/${N} moved)`);

console.log(fails
  ? `\n✗ ${fails} trait-wiring check(s) failed — a trait on a player's card does not reach the pitch`
  : '\n✓ every trait in the catalogue reaches the game, and the ones just wired all bite');
if (fails) process.exit(1);
