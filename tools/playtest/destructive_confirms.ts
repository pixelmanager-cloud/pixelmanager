// AN ACTION THAT DESTROYS SOMETHING THE PLAYER CANNOT GET BACK MUST ASK FIRST.
//
// The game already has openConfirm and uses it well in places — quitting mid-match, scaling a facility
// back, selling a player. Three of the most expensive actions in the game did not ask honestly — two
// never went through it at all, and the third asked without saying what it would cost:
//
//   The squad report's ✕. That panel is the ONLY surface in the game that emits the data-renew /
//   data-release buttons — a comment in main.ts says so in as many words — and a man left unrenewed walks
//   at the rollover. Dismissing it with deals still up forfeited every one of them, permanently, with no
//   warning, no undo and no way back to the screen.
//
//   "🧢 Take the reins as manager". Pressed while already managing, its handler rewrites manager state with
//   `season: 1, results: [], sponsor: undefined, contElig: undefined, …` and a different starId — so a
//   season in progress, the sponsor deal and any cup run are gone, and another man becomes the bloodline
//   star. The only note on that screen pushes the player TOWARD the button, saying the offer will not come
//   again.
//
//   "Sell the star" on a mid-season bid. Its banner is offered ONLY while the season is running, and
//   accepting reaches the SAME reset through retireStar → bringThroughHeir → resetMgrForHeir. On top of the
//   erased fixtures the year's money goes: the league prize, the sponsor bonus and the whole of
//   seasonFacilityIncome are paid once, by nextSeason, and that call is never reached. The confirm named
//   only the star leaving — a fee on screen, and no mention of the campaign it ends.
//
// All three now ask, and all three name what is lost. This probe holds them there, and is written as a rule
// about the class rather than about these buttons.
//
// Run: `npx tsx tools/playtest/destructive_confirms.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== Irreversible actions route through a confirmation ===');

// The helper must still exist and still be a real dialog, or every assertion below is decorative.
ok(/private openConfirm\(message: string, confirmLabel: string, onYes: \(\) => void\)/.test(src),
   'openConfirm still exists with an onYes callback (the mechanism these depend on)');
const confirms = (src.match(/this\.openConfirm\(/g) ?? []).length;
console.log(`  ..   ${confirms} confirmation site(s) in the client`);
ok(confirms >= 4, 'the game confirms a handful of things (this is not measuring an empty set)');

/** The body of the click handler registered for `id`, brace-matched from its addEventListener. */
function handlerFor(id: string): string {
  const at = src.indexOf(`getElementById('${id}')?.addEventListener('click'`);
  const at2 = at >= 0 ? at : src.indexOf(`$('${id}').addEventListener('click'`);
  if (at2 < 0) return '';
  let depth = 0;
  for (let i = src.indexOf('{', at2); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(at2, i + 1); }
  }
  return '';
}

// ── the squad report's ✕ ──
const sqx = handlerFor('sq-report-x');
ok(sqx.length > 0, 'the squad report dismiss handler was found');
ok(/openConfirm/.test(sqx), "dismissing the squad report asks first when there is something to lose");
ok(/expiring/.test(sqx), '...and the decision is made on whether any deals are actually up');
// PRESENCE IS NOT REACHABILITY. Testing only that `openConfirm` appears somewhere in the handler passes on
// a body that returns before ever reaching it — a mutation that replaced the guarded early return with a
// bare `return wipe();` left the confirm sitting there unreachable, and the /openConfirm/ test stayed green.
// The guard below is the load-bearing one; it is phrased as the player-visible rule so a failure says what
// actually broke.
const wipeCalls = (sqx.match(/wipe\(\)/g) ?? []).length;
console.log(`  ..   the dismiss handler calls wipe() ${wipeCalls} time(s)`);
ok(wipeCalls === 1, 'wipe() is CALLED once — the no-deals shortcut; the destructive path passes it to openConfirm by reference');
ok(/'Dismiss anyway', wipe\)/.test(sqx), 'the destructive path runs the wipe only as the confirmation\'s callback');
// It must still be free when nothing is at stake — a confirm on a harmless action is its own friction.
ok(/if \(!up\.length\) return wipe\(\);/.test(sqx) || /expiring[^)]*\)\s*\?\s*/.test(sqx),
   'the wipe is reached ONLY via the no-deals shortcut or the confirmed path — never straight through');

// ── taking the reins over a live manager season ──
const reins = handlerFor('cg-takereins');
ok(reins.length > 0, 'the take-the-reins handler was found');
ok(/openConfirm/.test(reins), 'taking the reins over a running season asks first');
ok(/cur\.starId/.test(reins), '...and only when a star is already on the pitch');
ok(/doTakeReins/.test(reins), 'the guarded path still reaches the real handover');

// The confirm has to SAY what it costs. A dialog that asks without telling is worse than none.
for (const word of ['season', 'sponsor']) {
  ok(new RegExp(word, 'i').test(reins), `the confirmation names what is lost ('${word}')`);
}

// ── selling the star out of a running season ──
// The message, not the whole method: bounded by `this.openConfirm(` and the confirm's own label, so a
// mis-slice can only come back empty (loud) and can never swallow enough of main.ts for these words to be
// found somewhere else and pass vacuously. 'season' and 'sponsor' appear all over this file; inside a
// 450-character dialog they mean what they say.
const bidAt = src.indexOf('private acceptStarBid(');
const msgAt = bidAt >= 0 ? src.indexOf('this.openConfirm(', bidAt) : -1;
const msgEnd = msgAt >= 0 ? src.indexOf(", 'Sell the star'", msgAt) : -1;
const sell = msgEnd > msgAt ? src.slice(msgAt, msgEnd) : '';
console.log(`  ..   the sell-the-star confirm message is ${sell.length} char(s) of source`);
ok(sell.length > 0, 'the sell-the-star confirmation was found (openConfirm, up to its own label)');
ok(sell.length < 1200, '...and the slice is one dialog, not a runaway span of the file');
// It has to SAY what it costs, exactly as the take-the-reins confirm above does — the write is the same one.
for (const [word, re] of [['season', /\bseason\b/i], ['results', /\bresult/i], ['the money', /\bprize\b|\bincome\b/i], ['sponsor', /\bsponsor\b/i], ['cup run', /\bcup run\b/i]] as const) {
  ok(re.test(sell), `the sale confirmation names what is lost ('${word}')`);
}
// AND THE WARNING MUST STAY TRUE. If the sale ever stops tearing the season down, this copy becomes a lie
// and has to be rewritten with it; that is why the destructive write is asserted here and not assumed.
const heirReset = src.slice(src.indexOf('private resetMgrForHeir()'), src.indexOf('private resetMgrForHeir()') + 900);
ok(/season: 1, results: \[\]/.test(heirReset) && /sponsor: undefined/.test(heirReset),
   'the succession the sale runs into still clears the season, its results and the sponsor (the loss being announced)');

console.log(fails ? `\n✗ ${fails} — something irreversible happens without asking` : '\n✓ every irreversible action asks, and says what it costs');
if (fails) process.exitCode = 1;
