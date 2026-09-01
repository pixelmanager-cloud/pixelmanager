// A RED CARD HAS TO COST SOMETHING.
//
// `sendOff` parks the dismissed player on the touchline, and most loops skip him -- but `reset()` rebuilt
// EVERY slot from its formation anchor with no `sentOff` check, and it runs from `giveKickoff` after every
// goal and at half-time. So the sent-off man was teleported back into the shape and played on: `pressureOn`
// counted him as a pressing body (worth up to -pressure * 0.18 on the opponent's passing) and
// `chaseLooseBall` let him win 50/50s. The punishment was largely refunded at the next restart.
//
// Also guards the injury seeding, because both were symptoms of the same habit -- deriving match state from
// position and minute instead of from the match.
import { MatchEngine, generateClub, autoPickXI, buildXI, seededOpponentTactics, PITCH } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

let reds = 0, strayTicks = 0, matchesWithRed = 0;
const injPairs = new Set<string>();
let injuries = 0, awayInjuries = 0;

for (let i = 0; i < 260; i++) {
  const a = generateClub('rc-a' + i, 'A', 0x3b6bd2, 11, 4400 + i, true);
  const b = generateClub('rc-b' + i, 'B', 0xcc4444, 11, 8800 + i, true);
  const ta = seededOpponentTactics(4400 + i), tb = seededOpponentTactics(8800 + i);
  const e = new MatchEngine([buildXI(a, autoPickXI(a, ta.formation)), buildXI(b, autoPickXI(b, tb.formation))], (6260 ^ i) >>> 0, [ta, tb] as any);
  const off: Array<{ t: 0 | 1; i: number }> = [];
  let g = 0, sawRed = false;
  while (!e.state.finished && g++ < 40000) {
    e.tick();
    // pick up any new dismissal, then hold every dismissed man to the touchline for the rest of the match
    for (const ev of e.state.events as any[]) {
      if (ev.type !== 'red_card' || ev.seen) continue;
      ev.seen = true; reds++; sawRed = true;
      const idx = e.teams[ev.teamIdx].players.findIndex((p: any) => p.id === ev.playerId);
      if (idx >= 0) off.push({ t: ev.teamIdx, i: idx });
    }
    for (const o of off) {
      const ps = (e.state as any).players[o.t][o.i];
      const parked = o.t === 0 ? ps.x <= 2 : ps.x >= PITCH.w - 2;
      if (!parked) strayTicks++;
    }
  }
  if (sawRed) matchesWithRed++;
  for (const ev of e.state.events as any[]) {
    if (ev.type !== 'injury') continue;
    injuries++; injPairs.add(`t${ev.teamIdx} m${ev.minute}`);
    if (ev.teamIdx === 1) awayInjuries++;
  }
}

console.log(`  ${reds} dismissals across ${matchesWithRed} matches; ${injuries} injuries in ${injPairs.size} distinct (team,minute) pairs`);
ok(reds > 0, `red cards actually occur, or this check proves nothing (${reds})`);
ok(strayTicks === 0, `a dismissed player never returns to the pitch (${strayTicks} stray ticks)`);
// The injury trigger derived from minute and team alone, so the entire game had ONE injury: home side,
// minute 61, slot 10 -- and the away team could not be injured at any minute of any match.
ok(injuries > 0, `injuries actually occur, or this check proves nothing (${injuries})`);
ok(injPairs.size >= 5, `injuries are not one hard-coded moment (${injPairs.size} distinct team/minute pairs)`);
ok(awayInjuries > 0, `the away side can be injured at all (${awayInjuries})`);
console.log(fails ? `\n✗ ${fails} red-card/injury check(s) failed` : `\n✓ a dismissal sticks, and injuries belong to the match`);
if (fails) process.exitCode = 1;
