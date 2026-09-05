// THE TOAST FOR BACKING THE CLUB NAMED THE MECHANIC THAT DID NOT RUN.
//
// `careerAct` funds clubGain from two independent sources: the club's development cut of the earnings the
// turn produced, and — on a lifestyle turn — clubInvestOf(cardId), coins the player CHOSE to hand over.
// `buyLifestyle` only ever SPENDS earnings (`this.earnings -= it.cost`), so on a Back-the-Club purchase the
// earnings delta is negative, `Math.max(0, …)` clamps the wage-cut term to exactly 0, and every coin of
// clubGain is the player's own money. The one worded confirmation he got said the opposite — "its
// development cut of what he earned", the club skimming his wages, at the moment he backed it out of his
// own pocket. The tile that sold him the choice reads "every coin goes to the club".
//
// This RUNS both halves rather than grepping for wording. The gain arithmetic is sliced out of api.ts and
// evaluated over real careers, so "the wage-cut term paid 0 here" is measured on the production expression
// instead of being read off it; the toast statement is sliced out of main.ts and executed with a stub
// `toast`, so the strings compared are the ones a player is actually shown.
//
// BOTH DIRECTIONS ARE PINNED, so deleting the phrase everywhere cannot satisfy this: the earnings-driven
// path must KEEP calling it the development cut, and only the investment path must stop. The sample counts
// print as `..` margins because an assertion over zero measured purchases is green for nothing.
//
// Run: `npx tsx tools/playtest/club_invest_toast_truth.ts`
import { readFileSync } from 'node:fs';
import { Career, LIFESTYLE, clubInvestOf, mulberry32, fit } from '../../shared/src/career.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The club-coins toast names the mechanic that actually paid ===');

// ── the production arithmetic, lifted out of careerAct ────────────────────────────────────────────────
const API = readFileSync('client/src/api.ts', 'utf8');
const CUT = Number(API.match(/const CLUB_WAGE_CUT = ([\d.]+);/)?.[1]);
ok(Number.isFinite(CUT) && CUT > 0, `careerAct still takes a development cut of earnings (CLUB_WAGE_CUT = ${CUT})`);
const GAIN_AT = API.indexOf('let clubGain = Math.round(');
const TAIL = 'clubInvestOf(action.cardId);';
const gainSrc = GAIN_AT > 0 ? API.slice(GAIN_AT, API.indexOf(TAIL, GAIN_AT) + TAIL.length) : '';
ok(/clubInvestOf\(action\.cardId\)/.test(gainSrc) && /Math\.max\(0, c\.earnings - earningsBefore\)/.test(gainSrc),
  'clubGain is still the wage cut plus the lifestyle investment');
const clubGainOf = new Function('c', 'earningsBefore', 'action', 'CLUB_WAGE_CUT', 'clubInvestOf',
  `${gainSrc}\nreturn clubGain;`) as (c: any, before: number, a: any, cut: number, inv: typeof clubInvestOf) => number;

// ── the production toast, lifted out of doCareerAct ───────────────────────────────────────────────────
const MAIN = readFileSync('client/src/main.ts', 'utf8');
const HEAD = 'if (r.clubGain && r.clubGain > 0) toast(';
const T_AT = MAIN.indexOf(HEAD);
ok(T_AT > 0, 'doCareerAct still announces a positive clubGain with a single toast(…) call');
let depth = 0, end = T_AT + HEAD.length - 1;
for (; end < MAIN.length; end++) { const ch = MAIN[end]; if (ch === '(') depth++; else if (ch === ')' && --depth === 0) break; }
const stmt = MAIN.slice(T_AT, end + 1);
const say = (clubGain: number, type: string, cardId: string) => {
  let said: string | null = null;
  new Function('r', 'action', 'toast', stmt)({ clubGain }, { type, cardId }, (m: string) => { said = m; });
  return said;
};

// ── measure: on each path, what actually paid? ────────────────────────────────────────────────────────
const INVEST = LIFESTYLE.filter((i) => (i.clubInvest ?? 0) > 0);
ok(INVEST.length >= 2, `${INVEST.length} lifestyle items pay the club directly (2 today) — there is something to buy`);

let buys = 0, wageTermPaid = 0, belowGuard = 0, amountUnsaid = 0, playGains = 0;
const lines = new Map<string, number>();
for (let s = 0; s < 60; s++) {
  const c: any = new Career(s, s % 2 ? 'keeper' : 'outfield');
  const rng = mulberry32(s ^ 0x5eed);
  let guard = 0;
  while (!c.finished && guard++ < 3000) {
    const st: any = c.current();
    if (st.phase === 'arc') { c.resolveArc(st.arc.choices[Math.floor(rng() * st.arc.choices.length)].id); continue; }
    if (st.phase === 'focus') {
      for (const it of (c.lifestyleOffer ?? [])) {
        if (!(it.clubInvest > 0) || c.earnings < it.cost) continue;
        const before = c.earnings;
        c.buyLifestyle(it.id);
        const gain = clubGainOf(c, before, { type: 'lifestyle', cardId: it.id }, CUT, clubInvestOf);
        buys++;
        if (gain !== clubInvestOf(it.id)) wageTermPaid++;   // the mechanic the toast names must pay 0c here
        if (!(gain > 0)) belowGuard++;                      // …and the purchase must still be announced
        const line = say(gain, 'lifestyle', it.id);
        if (!line?.replace(/,/g, '').includes(String(gain))) amountUnsaid++;
        if (line) lines.set(line, (lines.get(line) ?? 0) + 1);
      }
      c.chooseFocus(st.focus[0].id); continue;
    }
    if (st.phase === 'offer') { c.resolveOffer(st.offers?.[0]?.id ?? 'develop'); continue; }
    if (st.phase === 'coach') { c.appointCoach(st.coaches[0].id); continue; }
    if (st.phase === 'draft') { c.draft(st.options[0].id); continue; }
    const before = c.earnings;
    const byFit = [...st.hand].sort((a: any, b: any) => fit(b, st.scenario) - fit(a, st.scenario));
    c.play(byFit[0].id);
    if (clubGainOf(c, before, { type: 'play', cardId: byFit[0].id }, CUT, clubInvestOf) > 0) playGains++;
  }
}

ok(buys >= 100, `${buys} Back-the-Club purchases driven through the real engine — the check has something to run over`);
ok(playGains >= 100, `${playGains} playing turns paid a real development cut — the other branch is live too`);
ok(wageTermPaid === 0, `on every purchase the wage cut paid 0c and the whole gain was his investment (${buys - wageTermPaid}/${buys})`);
ok(belowGuard === 0, `and every one cleared the toast's >0 guard, so the player is told (${buys - belowGuard}/${buys})`);
console.log(`  ..   ${lines.size} distinct toast line(s) shown for a Back-the-Club buy`);
for (const [l, n] of lines) console.log(`         ×${n}  ${l}`);

// ── the wording, on the real strings ──────────────────────────────────────────────────────────────────
const invested = [...lines.keys()];
const earned = say(250, 'play', 'card-x');
console.log(`  ..   the earnings path says: ${earned}`);
ok(invested.length > 0 && invested.every((l) => !/\bearn|development cut/i.test(l)),
  'no Back-the-Club toast credits the club with a cut of what he earned');
ok(amountUnsaid === 0, `each still names the number of coins that moved (${buys - amountUnsaid}/${buys})`);
ok(!!earned && /development cut/i.test(earned) && earned.includes('250'),
  'and the earnings-driven path still calls it the development cut, so this is not fixed by deleting the phrase');

console.log(fails ? `\n✗ ${fails} check(s) failed — the club-coins toast names a mechanic that paid nothing` : '\n✓ each path is announced by the mechanic that actually paid');
if (fails) process.exitCode = 1;
