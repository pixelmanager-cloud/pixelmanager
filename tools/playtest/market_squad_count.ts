// THE TRANSFER MARKET MUST COUNT THE SQUAD THE ENGINE BOUNDS.
//
// `this.club` is the MERGED club: `api.me()` returns `mergedClub()`, and `fieldablePlayers` appends every
// pro/retired token that actually played a career -- the living bloodline star, and any forebear who kept
// his attributes. The facade bounds the RAW list instead: `c.club.players.length` in buyPlayer, sellPlayer,
// signTrial and signMission. So the market screen counted a squad at least one bigger than the one the
// engine enforces, and its header and BOTH its gates were computed from that number:
//   - the header prints "Squad 15/28" over a club the facade has 14 men registered at
//   - at MIN_SQUAD the Sell button stays ENABLED and the click returns the error toast
//     "you can't sell below 14 players"
//   - short of MAX_SQUAD every Buy button renders disabled, titled "Squad full (max 28)", for a signing the
//     facade would have taken
// The very next line in the same function already knew -- the wage-bill fix filters the `nft:` ids out
// before it totals the bill -- and the counter three lines above it never got the same treatment.
//
// The live half drives the REAL facade to both bounds and measures the window in which the two counts
// disagree. If that window is empty it FAILS rather than passing, because then the source check below is
// guarding nothing. The source half is static because `renderTransferMarket` writes a template string into
// the DOM and cannot be called from Node.
//
// Run: `npx tsx tools/playtest/market_squad_count.ts`
import { readFileSync } from 'node:fs';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, getActiveModel } from '../../client/src/save.js';
import { MIN_SQUAD, MAX_SQUAD } from '../../shared/src/market.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** The card career, played the way dev_dynasty_save plays it -- whatever phase is pending, take the first
 *  legal option. All this probe needs from it is a token that reaches state 'pro' with real attributes,
 *  because that is exactly what fieldablePlayers merges into the club the market screen reads. */
function bestCard(s: any): string {
  const dem = s.scenario?.demand ?? {};
  let best = s.hand[0], bestScore = -Infinity;
  for (const c of s.hand) {
    let score = 0;
    for (const [tag, w] of Object.entries(dem)) score += (Number((c.tags ?? {})[tag]) || 0) * Number(w);
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best.id;
}
async function playCareer(pid: string): Promise<void> {
  for (let guard = 0; guard < 4000; guard++) {
    const { state }: any = await api.getCareer(pid);
    if (!state || state.finished) return;
    const s: any = state;
    const act = s.phase === 'arc' ? { type: 'arc', cardId: s.arc.choices[0].id }
      : s.phase === 'focus' ? { type: 'focus', cardId: s.focus[0].id }
      : s.phase === 'offer' ? { type: 'offer', cardId: s.offers[0].id }
      : s.phase === 'coach' ? { type: 'coach', cardId: s.coaches[0].id }
      : s.phase === 'draft' ? { type: 'draft', cardId: s.options[0].id }
      : { type: 'play', cardId: bestCard(s) };
    const r: any = await api.careerAct(pid, act);
    if (r.graduated) return;
  }
  throw new Error('the founding career never graduated');
}

async function main() {
  console.log('=== The Transfer Market counts the squad the engine bounds ===');

  // -- the live half: how far apart are the two counts, and where does that bite? --
  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', 'Ashcombe', 20260902, 'probe-market-count');
  const { candidates }: any = await api.scoutProspects(3);
  const pid = ((await api.signProspect(candidates[0].seed)) as any).prospect.id;
  await api.startCareer(pid, null);
  await playCareer(pid);   // he graduates a pro, and from here on he merges into every api.me()

  const counts = async () => {
    const me: any = await api.me();
    return { merged: me.club.players.length, registered: getActiveModel().club.players.length, players: me.club.players as any[] };
  };
  const c0 = await counts();
  const gap = c0.merged - c0.registered;
  console.log(`  ..   api.me() lists ${c0.merged} player(s); the facade has ${c0.registered} registered -- a gap of ${gap}`);
  // WITHOUT A GAP EVERY CHECK BELOW IS VACUOUS. Mutation-test this probe by deleting the `playCareer`
  // call above: with the star still a prospect nothing merges, the two counts agree, and this is the
  // assertion that must go red rather than the whole file quietly reporting green.
  ok(gap > 0, 'the merged club really is bigger than the registered squad (or this probe measures nothing)');
  ok(c0.players.filter((p) => !p.id.startsWith('nft:')).length === c0.registered,
     `dropping the \`nft:\` ids reconstructs the registered squad exactly (${c0.players.filter((p) => !p.id.startsWith('nft:')).length} vs ${c0.registered})`);
  ok(getActiveModel().club.players.every((p) => !p.id.startsWith('nft:')),
     'no registered player carries an `nft:` id, so that filter never drops a man the engine counts');

  // THE SELL BOUND. Sell until the facade refuses, then read BOTH counts at the refusal.
  let refusal = '';
  for (let i = 0; i < 40 && !refusal; i++) {
    const { players } = await counts();
    const raw = new Set(getActiveModel().club.players.map((p) => p.id));
    const target = players.find((p) => raw.has(p.id) && p.id !== pid)!;
    try { await api.sellPlayer(target.id); } catch (e: any) { refusal = String(e?.message ?? e); }
  }
  const atMin = await counts();
  console.log(`  ..   selling stops at ${atMin.registered} registered / ${atMin.merged} listed -- "${refusal}"`);
  ok(refusal.includes(String(MIN_SQUAD)) && atMin.registered === MIN_SQUAD, `the facade bounds the REGISTERED squad at MIN_SQUAD (${MIN_SQUAD})`);
  ok(atMin.merged > MIN_SQUAD, `and the merged list is still above it (${atMin.merged}) -- a gate read off that number leaves Sell enabled onto an error toast`);

  // THE BUY BOUND, from the other end. Free synthetic signings: the fee is not what is under test, the
  // squad-size bound is, and buyPlayer clamps a 0 fee rather than rejecting it.
  const template = getActiveModel().club.players[0];
  let signedAtFull = false;
  for (let i = 0; i < 40; i++) {
    const before = await counts();
    if (before.registered >= MAX_SQUAD) break;
    try { await api.buyPlayer({ ...template, id: `probe-filler-${i}` } as any, 0); }
    catch (e: any) { console.log(`  ..   buy refused at ${before.registered} registered / ${before.merged} listed -- ${e?.message ?? e}`); break; }
    if (before.merged >= MAX_SQUAD) signedAtFull = true;   // the window the disabled Buy button sits in
  }
  const atMax = await counts();
  console.log(`  ..   buying stops at ${atMax.registered} registered / ${atMax.merged} listed`);
  ok(atMax.registered === MAX_SQUAD, `the facade bounds the REGISTERED squad at MAX_SQUAD (${MAX_SQUAD})`);
  ok(signedAtFull, `the facade took a signing while the merged list already read ${MAX_SQUAD}+ -- the window in which every Buy button is wrongly disabled`);

  // -- the source half: renderTransferMarket builds a template string into the DOM, so it cannot be called
  //    from Node. Check the three places that consume the count instead. --
  const src = readFileSync('client/src/main.ts', 'utf8');
  const from = src.indexOf('private renderTransferMarket()');
  const to = src.indexOf('private buyPlayerFlow(', from);
  ok(from > 0 && to > from, 'renderTransferMarket is where it was');
  const block = src.slice(from, to);

  // Anchored separately so a rename cannot make the real check below vacuous by simply not matching.
  const gates = /const squadFull = (\w+)\.length >= MAX_SQUAD, squadMin = (\w+)\.length <= MIN_SQUAD;/.exec(block);
  const header = /Squad <b>\$\{(\w+)\.length\}<\/b>\/\$\{MAX_SQUAD\}/.exec(block);
  ok(!!gates, 'the buy gate and the sell gate are still derived from one list length');
  ok(!!header, 'the header still prints that squad count');
  if (gates && header) {
    const named = [...new Set([gates[1], gates[2], header[1]])];
    ok(named.length === 1, `the header and both gates read the SAME list (${named.join(', ')})`);
    const decl = new RegExp(`const ${named[0]} = ([^;]+);`).exec(block);
    ok(!!decl, `${named[0]} is declared inside renderTransferMarket`);
    if (decl) {
      console.log(`  ..   the market counts \`${named[0]} = ${decl[1].trim()}\``);
      ok(/\.filter\(/.test(decl[1]) && /nft:/.test(decl[1]),
         `${named[0]} drops the merge-only \`nft:\` tokens, so it is the ${MIN_SQUAD}..${MAX_SQUAD} list the facade enforces`);
    }
  }

  console.log(fails ? `\n✗ ${fails} -- the market is counting men the engine has not registered` : '\n✓ the counter and both gates read the registered squad');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
