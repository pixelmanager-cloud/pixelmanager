// THE RECOVERY FROM AN EVICTED localStorage MUST BE REACHABLE — AND MUST NOT FIRE ON A CAREER STILL BEING LIVED.
//
// refreshHubPlayer holds the only code in the game that fills in `starAge`, `retireAge` and `temper` from
// the durable save, and the only line that tells the player his career was rebuilt. It was gated on
// `!mgr.starId` — and `loadMgr()` falls back to `rebuiltMgrState()`, which names the star off the played
// 'pro' token. So on the exact save the block exists to rescue, `mgr.starId` was ALWAYS truthy and the
// block could never run. The early return above it needs `starAge != null` to render "Continue the season",
// nothing else ever writes `starAge` at a hub the player cannot get past, and the three other writers
// (nextSeason twice, the handoff) all live behind that door. An evicted manager therefore came back to a
// hub offering "Scout a prospect" over his own club, permanently. A dead `if` is invisible: the file
// compiles, the screen renders, and the branch simply never executes — which is why this is measured.
//
// The opposite mistake is just as bad and is one character away. `mgr.starAge == null` alone ALSO matches
// a generation-one save where the player pressed "Play on — finish his career first" and let his man
// graduate: nothing has written `fm_mgr_*` yet, so the rebuild names the fresh 'pro' the same way. Firing
// there installs a manager the handoff screen has just told the player he cannot become, with a default
// temperament and no founding tier. The gate must separate the two, so this drives both.
//
// Checked at the source level because main.ts is a browser module nothing can import: the probe LIFTS the
// star selection and the gate out of the file and EVALUATES them against the states an eviction, a
// succession and a declined handoff actually leave behind — built through the real `tokenContract`, so the
// contract shape is measured rather than assumed. If the block can no longer be found the probe FAILS
// rather than quietly passing over nothing.
//
// Run: `npx tsx tools/playtest/mgr_recovery_reachable.ts`
import { readFileSync } from 'node:fs';
import { tokenContract, tokenToPlayer } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The premises this measurement rests on ===');

const rbAt = src.indexOf('private rebuiltMgrState()');
const rbEnd = src.indexOf('\n  }', rbAt);
const rebuild = rbAt > 0 && rbEnd > rbAt ? src.slice(rbAt, rbEnd) : '';
ok(/starId: star\.id/.test(rebuild), 'rebuiltMgrState still names the star off the played token — an evicted save comes back WITH a starId');
ok(!/starAge/.test(rebuild), '...and still cannot supply starAge — which is the half that has to be recovered');
const lmAt = src.indexOf('private loadMgr()');
ok(lmAt > 0 && /return this\.rebuiltMgrState\(\);/.test(src.slice(lmAt, rbAt)), 'loadMgr still falls back to that rebuild when localStorage holds nothing');
ok(/if \(mgr\.starId && mgr\.starAge != null\) \{/.test(src), 'the hub still opens the season only once starAge is known — so an unrecovered save has no way in');
// The standing XI is the durable half's only record that the handoff happened: the handoff writes the star
// into it, and the editor that could otherwise put him there is reachable only from the season screen.
ok((src.match(/this\.openLineup\('standing'\)/g) ?? []).length === 1 && /sf-teamsheet[\s\S]{0,160}this\.openLineup\('standing'\)/.test(src),
   'the standing XI is still editable only from the season screen — so the star being named in it means a manager put him there');
ok(/starId: s\.prospectId, starName: s\.name, starAge: s\.age/.test(src), 'the handoff is still what writes a COMPLETE manager state (starId + starAge together)');

// ── the states an eviction, a succession and a declined handoff actually leave behind ──
const SEASON = 8;
const ATTRS = JSON.stringify({ pace: 14, shooting: 15, passing: 14, positioning: 13, physical: 13, technique: 15 });
function token(over: Record<string, unknown>): any {
  return {
    id: 'nft:1', owner_id: 'me', generation: 2, state: 'pro', name: 'Vic Hale', branch: 'played',
    genes_json: '{}', pedigree: 40, dev_bonus_json: '{}', attrs_json: ATTRS,
    prime_season: 5, signed_season: 5, length_seasons: 4, staked_since: 5,
    morale: 70, greed: 10, marketability: 10, earnings: 1000, peak_overall: 15,
    ach_seasons: 3, ach_apps: 90, ach_league: 1, ach_cup: 0, ach_promotions: 1, ach_tier: 3,
    ...over,
  };
}
/** api.me() as client/src/api.ts builds it: contracts off every non-prospect token, club.players off the
 *  base squad PLUS the pro/retired tokens that actually played (fieldablePlayers). The base squad carries
 *  no token ids, so `contracts[p.id]` can only ever match a merged token. */
function meOf(tokens: any[], xi: string[]) {
  const contracts: Record<string, any> = {};
  for (const t of tokens) if (t.state !== 'prospect') contracts[t.id] = { playerId: t.id, ...tokenContract(t, SEASON), rebornId: null };
  const players: any[] = [{ id: 'p1', name: 'Base One', role: 'GK', age: 24 }, { id: 'p2', name: 'Base Two', role: 'DF', age: 26 }];
  for (const t of tokens) if ((t.state === 'pro' || t.state === 'retired') && /[0-9]/.test(String(t.attrs_json ?? ''))) players.push(tokenToPlayer(t));
  return { club: { players }, contracts, standingOrders: { playerIds: ['p1', 'p2', ...xi] } };
}
const STAR = token({});
const OLD_MAN = token({ id: 'nft:9', name: 'Ted Hale', state: 'retired', generation: 1 });
const HEIR = token({ id: 'nft:1', state: 'prospect', name: 'Sam Hale', generation: 3, attrs_json: null });
/** What rebuiltMgrState hands back for a played 'pro' with nothing in localStorage. */
const rebuilt = (season: number, titles: number) => ({ season, results: [], titles, starId: 'nft:1', starName: 'Vic Hale', starGen: 2 });

type Case = { name: string; me: any; mgr: any; model: any; fires: boolean; star: string | null };
const CASES: Case[] = [
  { name: 'evicted mid-dynasty — the save this block exists for', fires: true, star: 'nft:1',
    me: meOf([STAR, OLD_MAN], ['nft:1']), mgr: rebuilt(4, 2), model: { honours: [{ season_number: 3, tier: '4', title: 1 }] } },
  { name: 'evicted in the manager\'s very first season, before any honour is filed', fires: true, star: 'nft:1',
    me: meOf([STAR], ['nft:1']), mgr: rebuilt(1, 0), model: { honours: [] } },
  { name: 'he pressed "Play on" and the man graduated — the reins were declined, not lost', fires: false, star: null,
    me: meOf([STAR], []), mgr: rebuilt(1, 0), model: { honours: [] } },
  { name: 'just after a succession — the state names no star at all', fires: false, star: null,
    me: meOf([HEIR, OLD_MAN], ['nft:9']), mgr: { season: 1, results: [] }, model: { honours: [{ season_number: 9, tier: '2', title: 0 }] } },
  { name: 'a complete manager state — recovery must not rewrite a live season', fires: false, star: null,
    me: meOf([STAR], ['nft:1']), mgr: { ...rebuilt(4, 2), starAge: 28, retireAge: 34, temper: 'builder' }, model: { honours: [] } },
];

console.log('\n=== ...and the gate the hub actually ships ===');

type Gate = (me: any, mgr: any, model: any) => { fires: boolean; starId: string | null };
/** Lift the recovery block's star selection and its `if` out of refreshHubPlayer as a runnable gate. */
function lift(): Gate | null {
  const i = src.indexOf('private async refreshHubPlayer()');
  if (i < 0) return null;
  const end = src.indexOf('\n  /** The Dynasty & Trophy Room', i);
  const body = src.slice(i, end > i ? end : src.length);
  const from = body.search(/^ *const star = /m);
  if (from < 0) return null;
  const gate = /^ *if \(star &&([\s\S]*?)\) \{$/m.exec(body.slice(from));
  if (!gate) return null;
  const js = (body.slice(from, from + gate.index) + `\nreturn { fires: !!(star &&${gate[1]}), starId: star ? star.id : null };`)
    .replace(/\s+as\s+(any|string)\b/g, '')     // the two casts; nothing else in this span is TS
    .replace(/\bthis\./g, 'self.');
  try {
    const f = new Function('me', 'mgr', 'self', 'getActiveModel', js) as any;
    return (me, mgr, model) => f(me, mgr, { rebuildingMgr: false }, () => model);
  } catch { return null; }
}
const shipped = lift();
ok(!!shipped, 'the recovery block\'s star selection and gate could be read out of refreshHubPlayer — they moved, so this probe would be blind');

/** How badly a candidate gate reads those five states. */
function score(g: Gate) {
  const wrong: string[] = [];
  for (const c of CASES) {
    let r: { fires: boolean; starId: string | null };
    try { r = g(c.me, c.mgr, c.model); } catch { wrong.push(c.name); continue; }
    if (r.fires !== c.fires || (c.fires && r.starId !== c.star)) wrong.push(c.name);
  }
  return wrong;
}

// MUTATION CONTROLS. Both are real gates this line has carried or been offered, and both are wrong; if the
// five states could not catch them, the assertion under them would be passing over nothing.
const pickOld = (me: any) => me.club.players.find((p: any) => me.contracts?.[p.id]?.state === 'pro')
  ?? me.club.players.find((p: any) => me.contracts?.[p.id]);
const asShipped: Gate = (me, mgr) => { const s = pickOld(me); return { fires: !!(s && !mgr.starId), starId: s ? s.id : null }; };
const asSketched: Gate = (me, mgr) => { const s = pickOld(me); return { fires: !!(s && mgr.starAge == null), starId: s ? s.id : null }; };
const wrongShipped = score(asShipped), wrongSketched = score(asSketched);
console.log(`  ..   over ${CASES.length} states: the \`!mgr.starId\` gate misreads ${wrongShipped.length} (${wrongShipped.join('; ') || 'none'})`);
console.log(`  ..   ...and a bare \`starAge == null\` gate misreads ${wrongSketched.length} (${wrongSketched.join('; ') || 'none'})`);
ok(wrongShipped.length >= 2 && wrongSketched.length >= 1,
   `these states can see a wrong gate at all (${wrongShipped.length} and ${wrongSketched.length} of ${CASES.length} caught)`);

if (shipped) {
  const wrong = score(shipped);
  console.log(`  ..   the shipped gate misreads ${wrong.length} of ${CASES.length}`);
  for (const c of CASES) {
    let got: any; try { got = shipped(c.me, c.mgr, c.model); } catch (e) { got = { fires: 'threw', starId: String(e) }; }
    ok(got.fires === c.fires && (!c.fires || got.starId === c.star),
       `${c.fires ? 'recovers' : 'stays out of'}: ${c.name} — fires=${got.fires}${got.fires ? `, installs ${got.starId}` : ''}`);
  }
}

console.log(fails ? `\n✗ ${fails} problem(s) — the manager-career recovery fires on the wrong saves` : '\n✓ the recovery reaches an evicted career and leaves a living one alone');
if (fails) process.exitCode = 1;
