// A SUBSTITUTE INHERITS THE SHIRT, NOT THE MAN'S RECORD.
//
// `booked` is keyed team*100 + SLOT INDEX (engine.ts:139), and `makeSub` overwrites
// `teams[t].players[outI]` without clearing the slot's card state. So a left-back booked on 40' who comes
// off on 58' handed his caution to the fresh man, whose first bookable foul read as a SECOND yellow: sent
// off for a card he never received, and his side played out the match a man down.
//
// This checks the invariant directly rather than trusting a rate: no player may be dismissed for a second
// yellow unless a yellow was earlier recorded FOR THAT PLAYER ID.
import { MatchEngine, generateClub, autoPickXI, buildXI, seededOpponentTactics } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

let seconds = 0, unearned = 0, subs = 0, matches = 0;
for (let i = 0; i < 220; i++) {
  const a = generateClub('sub-a' + i, 'A', 0x3b6bd2, 11, 4100 + i, true);
  const b = generateClub('sub-b' + i, 'B', 0xcc4444, 11, 8100 + i, true);
  const ta = seededOpponentTactics(4100 + i), tb = seededOpponentTactics(8100 + i);
  const e = new MatchEngine([buildXI(a, autoPickXI(a, ta.formation)), buildXI(b, autoPickXI(b, tb.formation))], (5150 ^ i) >>> 0, [ta, tb] as any);
  let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
  matches++;
  const yellowed = new Set<string>();
  for (const ev of e.state.events as any[]) {
    if (ev.type === 'sub') subs++;
    if (ev.type === 'yellow_card' && ev.playerId) yellowed.add(`${ev.teamIdx}|${ev.playerId}`);
    if (ev.type !== 'red_card') continue;
    // `sendOff` encodes the kind in `zone`: 'mid' for a second yellow, undefined for a straight red.
    // (An odd channel, but it is the one the client reads to print "SECOND YELLOW".)
    if (ev.zone !== 'mid') continue;
    seconds++;
    if (ev.playerId && !yellowed.has(`${ev.teamIdx}|${ev.playerId}`)) unearned++;
  }
}
console.log(`  ${matches} matches, ${subs} substitutions, ${seconds} second-yellow dismissals`);
// Both guards matter: with no substitutions the bug cannot occur, and with no second yellows the check is
// vacuous. The first version of this probe measured 0 of 0 and reported a pass -- a check that cannot fail.
ok(subs > 0, `substitutions actually happen, or this check proves nothing (${subs})`);
ok(seconds > 0, `second yellows actually occur, or this check proves nothing (${seconds})`);
ok(unearned === 0, `nobody is sent off for a second yellow without a first (${unearned} of ${seconds})`);
console.log(fails ? `\n✗ ${fails} sub-identity check(s) failed` : `\n✓ a card belongs to the player, not to the shirt`);
if (fails) process.exitCode = 1;
