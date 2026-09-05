// THE TOAST MUST NAME THE CAP THAT ACTUALLY REFUSED.
//
// Signing is refused for TWO unrelated reasons on the scouting screen, and both come back as a 409:
// LOANEE_CAP ("you can sign at most 3 loanees a season") bounds how many loanees a SEASON, MAX_SQUAD
// ("your squad is full (max 28)") bounds how many players a SQUAD may hold. `signTrial` collapsed both to
// 'You've hit your loanee limit this season' and `signMission` to 'You've hit your loanee limit', so a
// manager at 28 registered players with ZERO loanees signed was told he had hit a limit of 3 that the
// counter three lines above the button -- "up to 3 loanees this season (0 signed)" -- says he is 0 of the
// way to. Wrong cap, and therefore the wrong remedy: wait for next season, rather than sell or release
// someone. The Buy button has always named this one correctly ("Squad full (max 28)").
//
// Status alone cannot tell the two apart -- both are 409 out of the same `apiErr` -- so the only thing
// that can is the error TEXT, which is why the check below drives the facade into each state for real and
// then runs the client's own catch body against the error object that came back. Neither half is a copy of
// the other: the messages are not retyped here, they are produced by evaluating the shipped catch, and the
// errors are not synthesised, they are thrown by the shipped facade.
//
// MUTATION TESTS (each turns this file red, and only this file):
//   - delete the `msg.includes('squad is full')` branch from either catch  -> "names the squad cap" fails
//   - misspell it as 'squad full' (it does not match `your squad is full`) -> same
//   - drop the loanee branch and answer every 409 with the squad line      -> "still names the loanee cap"
//   - reword api.ts's throw without rewording the client's guard           -> "names the squad cap" fails
//   - remove the squad-full throw from api.ts's signTrial                  -> the squad-full 409 assertion
//     fails rather than this file quietly passing on an unreachable state
//
// Run: `npx tsx tools/playtest/sign_cap_named.ts`
import { readFileSync } from 'node:fs';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, getActiveModel } from '../../client/src/save.js';
import { MAX_SQUAD } from '../../shared/src/market.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

// Length-preserving comment mask: this codebase's comments quote the broken code they replaced verbatim
// (destructive_delete.ts and css_hooks.ts both reported a fixed defect as still present by reading one),
// and a brace inside a comment would derail the matcher below. Blanking to spaces keeps every index in
// the mask lined up with the same index in `src`, so the body can still be sliced out of the real source.
const src = readFileSync('client/src/main.ts', 'utf8');
const mask = src.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '));

/** The body of the first `catch` inside `private async <method>(`, brace-matched, comments and all. */
function catchBodyOf(method: string): string | null {
  const at = mask.indexOf(`private async ${method}(`);
  if (at < 0) return null;
  const c = mask.indexOf('catch', at);
  const open = c < 0 ? -1 : mask.indexOf('{', mask.indexOf(')', c));
  if (open < 0) return null;
  for (let i = open, depth = 0; i < mask.length; i++) {
    if (mask[i] === '{') depth++;
    else if (mask[i] === '}' && --depth === 0) return src.slice(open + 1, i);
  }
  return null;
}

/** Run the shipped catch body against a real error and return what it put in the toast. */
function said(body: string, e: any): string {
  let out: string | undefined;
  try {
    new Function('e', 'toast', 'MAX_SQUAD', body)(e, (m: string) => { out = m; }, MAX_SQUAD);
  } catch (err: any) {
    // The catch body stopped being plain evaluable JS -- a type annotation, a `this.`, a new import. That
    // is a probe that needs teaching, not a silent pass.
    return `<<the catch body could not be evaluated: ${err?.message ?? err}>>`;
  }
  return out ?? '<<the catch said nothing at all>>';
}

async function main() {
  console.log('=== A refused signing names the cap that refused it ===');

  // -- the state the finding is about: a FULL SQUAD with the loanee counter still on zero --
  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', 'Ashcombe', 20260902, 'probe-sign-cap-full');
  const template = getActiveModel().club.players[0];
  for (let i = 0; i < 80 && getActiveModel().club.players.length < MAX_SQUAD; i++) {
    await api.buyPlayer({ ...template, id: `probe-filler-${i}` } as any, 0);  // free: the bound is what is under test, not the fee
  }
  const t: any = await api.trials();
  console.log(`  ..   registered ${getActiveModel().club.players.length}/${MAX_SQUAD}, loanees ${t.signedCount}/${t.cap} -- the contradiction the player is shown`);
  ok(getActiveModel().club.players.length >= MAX_SQUAD, `the squad really is at MAX_SQUAD (${MAX_SQUAD})`);
  ok(t.signedCount === 0 && t.cap > 0, `and NO loanee place is used (${t.signedCount} of ${t.cap}) -- without this the old message would merely be redundant, not false`);
  let errFull: any = null;
  try { await api.signTrial(t.pool[0].index); } catch (e) { errFull = e; }
  console.log(`  ..   api.signTrial -> ${errFull?.status} "${errFull?.body?.error}"`);
  ok(errFull?.status === 409 && /squad is full/.test(String(errFull?.body?.error ?? '')),
     'the facade refuses it as a SQUAD problem (or there is nothing here to name)');

  // A trip still in the air, for the branch signMission already had.
  await api.cupPrize(5000);
  const dest = ((await api.missions(0)) as any).destinations[0];
  const trip: any = await api.dispatchScout(dest.id, 0);
  let errTravel: any = null;
  try { await api.signMission(trip.mission.id, 0); } catch (e) { errTravel = e; }
  ok(errTravel?.status === 409 && /travel/.test(String(errTravel?.body?.error ?? '')), 'a scout still travelling is also a 409');

  // -- the OTHER 409, from a second save: three loanees signed, squad nowhere near full --
  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', 'Brookden', 20260903, 'probe-sign-cap-loan');
  const pool: any = await api.trials();
  for (const p of pool.pool.slice(0, pool.cap)) await api.signTrial(p.index);
  const after: any = await api.trials();
  let errLoan: any = null;
  try { await api.signTrial((after.pool[after.cap] ?? after.pool[0]).index); } catch (e) { errLoan = e; }
  console.log(`  ..   loanees ${after.signedCount}/${after.cap}, registered ${getActiveModel().club.players.length} -- api.signTrial -> ${errLoan?.status} "${errLoan?.body?.error}"`);
  ok(after.signedCount === after.cap && getActiveModel().club.players.length < MAX_SQUAD,
     'the loanee cap is reached with the squad NOT full, so the two refusals are genuinely different states');
  ok(errLoan?.status === 409 && /loanee/.test(String(errLoan?.body?.error ?? '')), 'that one is refused as a LOANEE problem');
  ok(errFull?.status === errLoan?.status, `and both arrive as the same status (${errLoan?.status}) -- the text is the only thing that can tell them apart`);

  // -- signMission bounds the squad with the SAME throw, so the error above stands for both paths --
  const facade = readFileSync('client/src/api.ts', 'utf8');
  const throws = facade.match(/if \(c\.club\.players\.length >= MAX_SQUAD\) throw apiErr\(`your squad is full \(max \$\{MAX_SQUAD\}\)`, \{\}, 409\);/g) ?? [];
  console.log(`  ..   ${throws.length} facade path(s) refuse a signing with that exact squad-full 409`);
  ok(throws.length >= 3, 'buyPlayer, signTrial and signMission all still throw the identical squad-full 409');

  // -- the client's own catch bodies, run against those real errors --
  for (const method of ['signTrial', 'signMission']) {
    const body = catchBodyOf(method);
    ok(!!body, `${method}'s catch block is where it was`);
    if (!body) continue;
    const onFull = said(body, errFull), onLoan = said(body, errLoan), onOther = said(body, { status: 500, body: {} });
    console.log(`  ..   ${method}  full-squad -> "${onFull}"`);
    console.log(`  ..   ${method}  loanee-cap -> "${onLoan}"`);
    ok(/squad/i.test(onFull) && onFull.includes(String(MAX_SQUAD)) && !/loan/i.test(onFull),
       `${method} tells a full squad it is a SQUAD bound of ${MAX_SQUAD}, not a loanee limit`);
    ok(/loan/i.test(onLoan) && !/squad/i.test(onLoan), `${method} still names the loanee cap when THAT is what refused`);
    ok(!/loan/i.test(onOther) && !/squad/i.test(onOther), `${method} invents no cap for a failure that is neither (said "${onOther}")`);
    if (method === 'signMission') {
      const onTravel = said(body, errTravel);
      console.log(`  ..   ${method}  travelling -> "${onTravel}"`);
      ok(/travel/i.test(onTravel), 'signMission keeps the scout-still-travelling branch it already had');
    }
  }

  console.log(fails ? `\n✗ ${fails} — a refused signing names a cap the player has not reached` : '\n✓ every refused signing names the cap that refused it');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
