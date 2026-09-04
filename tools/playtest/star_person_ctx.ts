// THE MAN THE WHOLE GAME IS ABOUT MUST BE NARRATED AS THE MAN HE IS.
//
// The bloodline star is a Token, not a squad `Player`. `tokenToPlayer` builds him out of
// id/name/role/attrs/traits/personality/greed/marketability/earnings and stamps NO age, NO morale and NO
// signedSeason; `fieldablePlayers` merges exactly that object into `club.players`. So `personCtx`, which
// reads those three straight off the Player, handed `tierFor` `{age: undefined, morale: undefined,
// seasonsAtClub: 0}` for the one character the game is built around.
//
// The headline is not the lines that went unused, it is the lines that FIRED. `tierFor` reads `yrs <= 1`
// as `.newcomer`, so an eleven-season bloodline servant could be told 'He has been here five weeks and
// half of them will now be spent on a bench with a bag of ice' and 'He is not even in the squad
// photograph yet.' Wrong words are worse than missing ones. Underneath that, every `.servant`,
// `.veteran`, `.young` and `.unhappy` line written for him was unreachable — 53 of them on the
// rival-bid beat alone, which is the biggest money decision in the game.
//
// Measured rather than read: this builds a real dynasty through the offline facade, LIFTS THE REAL
// `personCtx` BODY out of client/src/main.ts and runs it, then puts the result through the real
// `tierFor` / `eligible`. A squad player who does carry a signedSeason is put through the same evaluator,
// so the harness has to tell two men apart rather than agree with itself.
//
// MUTATION TEST: drop the `?? ci?.age` fallback, or the `ci?.stakedSeasons ?? 0` arm, from personCtx and
// six assertions below go red — which is exactly how the tree this was written against left them. The
// `..` lines print the contract row and the merged Player so a GREEN run still shows its working, and the
// decade-man assertion is what stops the tier checks quietly passing on a 24-year-old if the fixture ever
// stops running long enough to make one.
//
// Run: `npx tsx tools/playtest/star_person_ctx.ts`
import { readFileSync } from 'node:fs';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';
import { buildDynasty } from '../dev_dynasty_save.js';
import { tierFor, eligible, type PersonCtx } from '../../shared/src/managerNarrate.js';
import { MGR_EXTRA_1 } from '../../shared/src/manager/pack_1.js';
import { overall } from '../../shared/src/teams.js';

const SRC = 'client/src/main.ts';
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** Lift `personCtx`'s body out of main.ts. The body is plain JS — `this.loadMgr()`, `this.season`,
 *  `this.contracts`, `this.standingOrders`, `overall(p)` — so it runs verbatim against a stub `this`
 *  built from a real api.me(). Grepping the source instead would pass the day someone writes a fallback
 *  that reads the wrong field. */
function liftPersonCtx(src: string): ((p: any, isStar: boolean) => PersonCtx) | null {
  const sig = src.indexOf('private personCtx(');
  if (sig < 0) return null;
  const open = src.indexOf('{', src.indexOf(')', sig));
  if (open < 0) return null;
  let depth = 0, end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) { end = i; break; }
  }
  if (end < 0) return null;
  const body = src.slice(open + 1, end);
  const fn = new Function('p', 'isStar', 'overall', body) as any;
  return function (this: any, p: any, isStar: boolean) { return fn.call(this, p, isStar, overall); };
}

async function main() {
  console.log('=== The bloodline star is narrated as the servant he is ===');

  const src = readFileSync(SRC, 'utf8');
  const lifted = liftPersonCtx(src);
  ok(lifted !== null, `personCtx was located and lifted out of ${SRC} (nothing below means anything without it)`);
  if (!lifted) { console.log('\n✗ could not read the code under test'); process.exit(1); }

  __setBackendForTests(createInMemoryBackend());
  const pid = await buildDynasty({ gens: 1, familyName: 'Ashcombe', slot: 'star-person-ctx' });
  // buildDynasty stops at five manager seasons; `.servant` needs eight, and a decade man is the whole
  // point of the check, so run the rollover on past it.
  for (let i = 0; i < 6; i++) {
    await api.spSeasonReward({ pos: 2, size: 14, wins: 18, draws: 8, losses: 12, tier: 3, starId: pid, kind: 'league' });
    await api.advanceSquadSeason({ trainingLvl: 2, wonSomething: false, goodSeason: true });
  }
  const me: any = await api.me();
  const star = me.club.players.find((p: any) => p.id === pid);
  ok(!!star, 'the star is in the fieldable squad (the merge that makes this bug possible still happens)');
  const ci = me.contracts[pid];
  ok(!!ci, 'the client holds a contract row for him');
  console.log(`  ..   season ${me.season}: contract row says age ${ci?.age}, morale ${ci?.morale}, registered ${ci?.stakedSeasons} season(s)`);
  console.log(`  ..   his merged Player carries age=${star?.age} morale=${star?.morale} signedSeason=${star?.signedSeason}`);
  ok((ci?.stakedSeasons ?? 0) >= 8 && (ci?.age ?? 0) >= 33,
     `the fixture really is a decade man (${ci?.stakedSeasons} seasons, age ${ci?.age}) — otherwise the tiers below prove nothing`);

  const self = { loadMgr: () => ({ season: me.season }), season: me.season, standingOrders: me.standingOrders, contracts: me.contracts };
  const ctx = lifted.call(self, star, true);
  console.log(`  ..   personCtx(star) -> age=${ctx.age} morale=${ctx.morale} seasonsAtClub=${ctx.seasonsAtClub}`);
  const keys = tierFor('injury', ctx);
  console.log(`  ..   tierFor('injury') -> ${keys.join(', ')}`);

  // THE HEADLINE: the wrong bank firing, not the right one lying idle.
  ok(!keys.includes('injury.newcomer'),
     'an eleven-season star is NOT tiered as a newcomer — he was, and got "He has been here five weeks"');
  const pool = eligible('injury', ctx);
  const newcomerLines = new Set((MGR_EXTRA_1 as any)['injury.newcomer'] as string[]);
  ok(newcomerLines.size > 0, 'the newcomer bank still exists (this is not measuring an empty set)');
  ok(!pool.some((l) => newcomerLines.has(l)),
     `none of the ${newcomerLines.size} newcomer lines can be said about him`);

  // ...and the tiers written FOR him now reach him.
  ok(keys.includes('injury.servant'), 'his service is known — `.servant` is on the table');
  ok(ctx.age === ci.age, `his age reaches the narration (${ctx.age}) — it was undefined, so \`.veteran\` and \`.young\` could never fire`);
  ok(keys.includes('injury.veteran'), 'at 33+ he is tiered a veteran');
  ok(typeof ctx.morale === 'number', `his morale reaches the narration (${ctx.morale}) — it was undefined, so \`.unhappy\` could never fire`);

  // CONTROL. A squad player has a real signedSeason and no contract row at all, so the existing path must
  // still own him — if the evaluator were faking it, or the fallback stole this path, this goes red.
  const mate = me.club.players.find((p: any) => p.id !== pid && p.signedSeason != null);
  ok(!!mate, 'there is a signed squad player to check against (the control is not vacuous)');
  if (mate) {
    const mc = lifted.call(self, mate, false);
    console.log(`  ..   control ${mate.name}: signedSeason=${mate.signedSeason} -> seasonsAtClub=${mc.seasonsAtClub}, contract row=${me.contracts[mate.id] ? 'yes' : 'none'}`);
    ok(mc.seasonsAtClub === Math.max(0, me.season - mate.signedSeason),
       'a squad player is still counted from his own signedSeason, not from the star\'s fallback');
  }

  console.log(fails ? `\n✗ ${fails} failure(s) — the star's context is blank and the wrong tier is firing` : '\n✓ the star arrives at the narration with an age, a morale and his years of service');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
