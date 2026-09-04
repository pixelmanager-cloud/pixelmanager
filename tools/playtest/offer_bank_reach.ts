// WHICH OFFER BANK A REAL CAREER CAN ACTUALLY REACH.
//
// `narrateOffer` (shared/src/narrate.ts) branches three ways — OFFER_MONEY when he takes the cash,
// OFFER_DEV when he turns it down to keep growing, OFFER_NEUTRAL as the fallback. The develop branch had
// never fired. It read `dev && !money` with `money = earn > 0`, and EVERY offer the game deals carries
// positive earn — DEVELOP_OFFERS still pay 90-140 coins for staying put — so `money` was always true, the
// exclusive could not be satisfied, and all nine OFFER_DEV lines ("He picked minutes over wages",
// "Patience over pounds") were unreachable prose. Turning the payday down narrated from the
// archetype-neutral fallback, on the one screen whose entire purpose is money-vs-fame-vs-development.
//
// It survived because nothing measured which BANK the sentence came from. qa_text_lint_fuzz calls
// narrateOffer with random effects and lints the string it gets back, so it is green whatever the caller
// passes, and the two archetypes that DO reach authored prose made the screen look fed.
//
// So this walks the production path — drive real Careers, take a chosen archetype at every offer screen,
// and let `actWithNarration` produce the sentence the player would read — then asks which bank it came
// from. The banks are enumerated through their only public door, `narrateOffer` itself, by feeding it
// synthetic effects that isolate each branch; the probe never reads `earn` or `form`, only the sentence,
// so it cannot be satisfied by a caller that routes on the right field in the wrong direction.
//
// OFFER_NEUTRAL is deliberately NOT asserted reachable. Once develop routes to its own bank nothing in the
// offer data lands on the fallback, which is what a fallback is for — do not "fix" that by editing offers.
// BRAND offers (earn > 0, form < 0) share OFFER_MONEY with MONEY offers by design: both are cashing in.
//
// Run: `npx tsx tools/playtest/offer_bank_reach.ts`
import { Career } from '../../shared/src/career.js';
import { actWithNarration } from '../../shared/src/tokens.js';
import { narrateOffer, type NarrateCtx } from '../../shared/src/narrate.js';
import type { Track } from '../../shared/src/types.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

type Effs = { earn: number; greed: number; market: number; form: number };
/** One synthetic offer per branch, chosen so each isolates exactly one bank both before and after the fix
 *  — a develop-shaped offer that pays nothing, a money-shaped one that costs form, and a null offer. */
const DEV_EFFS: Effs   = { earn:   0, greed: 0, market: 0, form:  0.06 };
const MONEY_EFFS: Effs = { earn: 900, greed: 0, market: 0, form: -0.08 };
const NEUT_EFFS: Effs  = { earn:   0, greed: 0, market: 0, form:  0    };
const ctxOf = (seed: number): NarrateCtx => ({ age: 20, chapter: 'First Team', stakes: 2, personalityId: 'grafter', seed });

/** Enumerate a bank by the only door it has: `pickFrom` indexes `floor(rng() * len)`, so sweeping the seed
 *  walks the whole list. Keyed by NAME as well as branch because every line interpolates the offer name. */
const cache = new Map<string, Set<string>>();
function bank(tag: string, name: string, effs: Effs): Set<string> {
  const key = `${tag} ${name}`;
  let s = cache.get(key);
  if (!s) {
    s = new Set<string>();
    for (let i = 0; i < 600; i++) s.add(narrateOffer(name, effs, ctxOf(i)));
    cache.set(key, s);
  }
  return s;
}

/** Drive a career to the end, answering every phase — the same shape callup_bank_reach.ts uses — but take
 *  `prefer` at every offer screen and keep the sentence the game would have shown for it. */
function drive(seed: number, track: Track, prefer: string) {
  const c = new Career(seed, track);
  const out: { id: string; name: string; line: string }[] = [];
  let step = 0;
  while (!c.finished && step < 600) {
    const st = c.current() as any;
    const pick = (xs: any[]): any => xs[step % xs.length];
    try {
      if (st.phase === 'offer') {
        const of = (st.offers as any[]).find((o) => o.id === prefer) ?? st.offers[0];
        const line = actWithNarration(c, { type: 'offer', cardId: of.id });
        if (line) out.push({ id: of.id, name: of.name, line });
      }
      else if (st.phase === 'arc') c.resolveArc(pick(st.arc.choices).id);
      else if (st.phase === 'focus') c.chooseFocus(pick(st.focus).id);
      else if (st.phase === 'coach') c.appointCoach(pick(st.coaches).id);
      else if (st.phase === 'draft') c.draft(pick(st.options).id);
      else if (st.phase === 'lifestyle') c.buyLifestyle(pick(st.items).id);
      else { if (!c.hand.length) break; c.play(c.hand[step % c.hand.length].id); }
    } catch { break; }
    step++;
  }
  return out;
}

console.log('=== The offer banks a real career can reach ===');
const picks: { id: string; name: string; line: string }[] = [];
const TRACKS: Track[] = ['outfield', 'goalkeeper'];
for (const track of TRACKS) for (let seed = 1; seed <= 8; seed++) for (const prefer of ['develop', 'money', 'brand']) picks.push(...drive(seed, track, prefer));

const names = [...new Set(picks.map((p) => p.name))];
ok(names.length > 0, 'a driven career reached the offer screen at all (otherwise everything below is vacuous)');
let overlap = 0;
for (const nm of names) {
  const D = bank('dev', nm, DEV_EFFS), M = bank('money', nm, MONEY_EFFS), N = bank('neut', nm, NEUT_EFFS);
  overlap += [...D].filter((x) => M.has(x) || N.has(x)).length + [...M].filter((x) => N.has(x)).length;
}
console.log(`  ..   ${names.length} distinct offer(s) taken; per-name banks: DEV ${bank('dev', names[0], DEV_EFFS).size}, MONEY ${bank('money', names[0], MONEY_EFFS).size}, NEUTRAL ${bank('neut', names[0], NEUT_EFFS).size} line(s)`);
ok(overlap === 0, `the three banks share no line (${overlap} shared) — a sentence names exactly one archetype`);

const from: Record<string, Record<string, number>> = {};
let unclassified = 0;
for (const p of picks) {
  const b = bank('dev', p.name, DEV_EFFS).has(p.line) ? 'DEV'
    : bank('money', p.name, MONEY_EFFS).has(p.line) ? 'MONEY'
    : bank('neut', p.name, NEUT_EFFS).has(p.line) ? 'NEUTRAL' : 'none';
  if (b === 'none') unclassified++;
  from[p.id] ??= {};
  from[p.id][b] = (from[p.id][b] ?? 0) + 1;
}
const total = (id: string) => Object.values(from[id] ?? {}).reduce((a, b) => a + b, 0);
const n = (id: string, b: string) => from[id]?.[b] ?? 0;
for (const id of Object.keys(from).sort()) console.log(`  ..   '${id}' taken ${total(id)}x: ${Object.entries(from[id]).map(([k, v]) => `${v} from ${k}`).join(', ')}`);

// VACUITY GUARD. Every assertion below counts offers actually taken; with none, "no archetype reached the
// wrong bank" is trivially true. Mutation-test this probe by making `drive` skip the offer phase (or by
// returning early from rollOffer) — this line must go red before any of the reach checks do.
ok(total('develop') >= 20 && total('money') >= 20 && total('brand') >= 20,
   `enough of each archetype taken to measure (develop ${total('develop')}, money ${total('money')}, brand ${total('brand')})`);
ok(unclassified === 0, `every narration belongs to a known bank (${unclassified} unclassified)`);
ok(n('develop', 'DEV') === total('develop'),
   `turning the money down reaches OFFER_DEV (${n('develop', 'DEV')}/${total('develop')}) — the "he picked minutes over wages" bank is not dead prose`);
ok(n('money', 'MONEY') === total('money') && n('brand', 'MONEY') === total('brand'),
   `cashing in still reaches OFFER_MONEY (${n('money', 'MONEY') + n('brand', 'MONEY')}/${total('money') + total('brand')}) — the fix did not swap one dead bank for another`);

console.log(fails ? `\n✗ ${fails} — an offer archetype has no prose of its own` : '\n✓ every offer archetype the game deals reaches its own bank');
if (fails) process.exitCode = 1;
