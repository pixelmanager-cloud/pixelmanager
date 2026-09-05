// THE DEAL TABLE MUST NOT THREATEN A DEPARTURE THE GAME CANNOT CARRY OUT.
//
// "Lowball — he may walk", and on the reject "He's insulted by the offer and walks away from the table."
// Nothing walks. submitContractOffer (main.ts) calls close() only on 'accept', so after a reject the four
// offer buttons and their listeners are still in the DOM and the same man can be signed a second later; and
// moraleEffects().wantsAway — the one flag that could ever turn a morale collapse into a departure — has no
// consumer anywhere in shared/src or client/src, so there is no indirect route either. "May" was wrong as
// well as "walk": 0.8 sits under evaluateContractOffer's 0.9 reject line at every length, so Lowball ALWAYS
// rejects. The only thing that actually happens is -6 morale, and the panel showed no morale at all.
//
// A threat the game cannot carry out is worse than a typo, because the player prices his decision on it: he
// reads "he may walk", presses it anyway, is told the man walked away, and is then looking at a table that
// is still fully open with no way to tell whether talks are over or whether he wasted a click — while the
// cost he did pay quietly makes his star dearer to re-sign, and stacks every time he presses it again.
//
// PREMISE FIRST, MEASURED NOT ASSUMED. Sections 1-3 establish that the departure really is unreachable and
// the rejection really is certain. If someone later implements a genuine walk-away, those go red BEFORE the
// copy assertions and tell the reader to retire this probe, instead of the probe silently forbidding prose
// about a feature that now exists. That is the shape phantom_mechanics.ts uses for the same class of bug.
//
// Run: `npx tsx tools/playtest/contract_walk_copy.ts`
import { readFileSync, readdirSync } from 'node:fs';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, localStore } from '../../client/src/save.js';
import { evaluateContractOffer, wageForLength, lengthPremiumFor } from '../../shared/src/contracts.js';
import { moraleEffects } from '../../shared/src/morale.js';
import { buildDynasty } from '../dev_dynasty_save.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const LOWBALL = 0.8; // what the Lowball button offers — checked against source in section 4, not assumed

/** Every combination the button can be pressed in: the personality spread sets the length premium, which
 *  is the only thing that moves the ask away from baseWage. Wages start at 80 deliberately — at an ask of
 *  1c, `Math.round(1 * 0.8)` is 1 and the ratio comes back 1.0, which would be a real accept and not a
 *  probe artefact to paper over. */
function certainty() {
  let cases = 0, accepted = 0;
  for (const personality of ['maverick', 'mercurial', 'leader', 'workhorse', undefined]) {
    for (const prefLength of [2, 3, 4, 5, 6]) {
      for (const baseWage of [80, 250, 900, 4000, 15000]) {
        const d = { baseWage, prefLength, minLength: 2, maxLength: 6, lengthPremium: lengthPremiumFor(personality) };
        for (let L = 2; L <= 6; L++) {
          cases++;
          if (evaluateContractOffer(d, Math.round(wageForLength(d, L) * LOWBALL), L).outcome !== 'reject') accepted++;
        }
      }
    }
  }
  return { cases, accepted };
}

function tsFiles(root: string): string[] {
  return (readdirSync(root, { recursive: true }) as string[]).filter((f) => f.endsWith('.ts')).map((f) => `${root}/${f}`);
}

async function main() {
  console.log('=== The deal table describes only what the negotiation can do ===');

  // ── 1. THE REJECTION IS CERTAIN, so the hint must not hedge about it.
  const cert = certainty();
  console.log(`  ..   ${cert.cases} demand/length combination(s) offered at ×${LOWBALL}; ${cert.accepted} escaped rejection`);
  // VACUITY GUARD: a renamed export or a mistyped loop bound would make the next line a zero-of-zero pass.
  ok(cert.cases > 100, `the engine was actually exercised (${cert.cases} combinations)`);
  ok(cert.accepted === 0, 'a Lowball is rejected every single time — there is no gamble to hedge about');

  // ── 2. NOTHING READS `wantsAway`, so no morale collapse can ever become a departure either.
  ok(moraleEffects(10).wantsAway === true && moraleEffects(90).wantsAway === false,
     'moraleEffects still produces a wantsAway flag (the premise of the search below)');
  const sources = [...tsFiles('shared/src'), ...tsFiles('client/src')];
  console.log(`  ..   ${sources.length} source file(s) searched for a wantsAway consumer`);
  ok(sources.length > 40, `the source trees were actually walked (${sources.length} files)`);
  // STRIP COMMENTS FIRST. The fix for this very bug names `wantsAway` in the comment explaining why the
  // copy no longer threatens a walk, so a raw grep reports the post-mortem as the crime — the same trap
  // phantom_mechanics.ts and destructive_delete.ts each document. The line below then guards the stripper:
  // if it ever ate code instead of comments the search would go silently vacuous.
  const code = (f: string) => readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const DECL = 'shared/src/morale.ts'; // where the flag is produced — a declaration, not a consumer
  ok(/\bwantsAway\b/.test(code(DECL)), 'the wantsAway declaration survives comment-stripping (code is not being eaten)');
  const consumers = sources.filter((f) => f !== DECL && /\bwantsAway\b/.test(code(f)));
  for (const c of consumers) console.log(`       reads wantsAway: ${c}`);
  ok(consumers.length === 0, `nothing consumes wantsAway, so a hand-forcing exit is unreachable (${consumers.length} consumer(s))`);

  // ── 3. AND HE IS STILL AT THE TABLE AFTERWARDS — measured by outcome, through the same facade the modal
  // calls. Three lowballs in a row, then his number: if a reject ever really ended the talks, the accept
  // below stops happening and this probe says so before it says a word about the copy.
  __setBackendForTests(createInMemoryBackend());
  const pid = await buildDynasty({ gens: 1, familyName: 'Ashcombe', slot: 'cw-walk' });
  const morale = async () => Number((await localStore.getToken(pid) as any)?.morale ?? 65);
  const before = await morale();
  const asks: number[] = [];
  let first: any = null, firstAfter = before;
  for (let i = 0; i < 3; i++) {
    const info: any = await api.starContractInfo(pid);
    asks.push(Math.round(Number(info.baseWage)));
    const r: any = await api.negotiateStar(pid, Math.round(Number(info.baseWage) * LOWBALL), 3);
    if (!first) { first = r; firstAfter = await morale(); }
  }
  const walked = await morale();
  const info: any = await api.starContractInfo(pid);
  const back: any = await api.negotiateStar(pid, Math.round(Number(info.baseWage) * 1.25), 3);
  const state = (await localStore.getToken(pid) as any)?.state;
  console.log(`  ..   three lowballs: morale ${before} -> ${walked}, his ask ${asks.join('c -> ')}c, then he signed: ${back.outcome}`);
  ok(first?.outcome === 'reject', 'the setup is right — a Lowball at ×0.8 is rejected (not priced out, not accepted)');
  ok(walked < before, 'the lowballs actually cost him morale (a stacked, permanent cost)');
  ok(back.outcome === 'accept' && state === 'pro',
     'after three "walks away from the table" he is still a pro and still signable — no walk happened');

  // ── 4. THE COPY, held to that. Both strings are read out of source, so a reworded threat is caught too.
  const mainTs = readFileSync('client/src/main.ts', 'utf8');
  const contractsTs = readFileSync('shared/src/contracts.ts', 'utf8');
  const hint = mainTs.match(/offer\('Lowball',\s*([\d.]+),\s*'([^']*)'/);
  const note = contractsTs.match(/outcome: 'reject',[^\n]*?note: '([^']*)'/);
  // VACUITY GUARD: if either shape moves, the match is null and every assertion below would pass on an
  // empty string. Fail loudly instead — an unfindable string is an unchecked string.
  ok(!!hint, 'the Lowball button hint was found in main.ts');
  ok(!!note, 'the reject note was found in contracts.ts');
  ok(hint?.[1] === String(LOWBALL), `the Lowball button still offers ×${LOWBALL} (the multiplier section 1 measured)`);
  const DEPARTURE = /\bwalk(s|ed|ing)?\b|\bleav(e|es|ing)\b|\bquits?\b|\bout the door\b|\btransfer request\b/i;
  const HEDGE = /\bmay\b|\bmight\b|\bcould\b|\bperhaps\b|\brisks?\b/i;
  for (const [what, text] of [['Lowball hint', hint?.[2] ?? ''], ['reject note', note?.[1] ?? '']] as const) {
    console.log(`  ..   ${what}: "${text}"`);
    ok(!DEPARTURE.test(text), `the ${what} does not threaten a departure the game cannot carry out`);
  }
  ok(!HEDGE.test(hint?.[2] ?? ''), 'the Lowball hint does not hedge about an outcome that is certain');

  // ── 5. AND THE COST IT DOES CHARGE IS ON SCREEN. -6 morale is the whole of what a rejected offer does,
  // and the modal showed no morale anywhere — so it could be stacked without a single number moving.
  ok(typeof first?.moraleDelta === 'number' && first.moraleDelta < 0,
     'negotiateStar hands the rejected offer\'s moraleDelta back to the caller');
  ok(first?.moraleDelta === firstAfter - before,
     `the delta reported is the one applied (${first?.moraleDelta} vs ${firstAfter - before})`);
  const at = mainTs.indexOf("document.getElementById('cn-result')");
  ok(at > 0, 'the #cn-result renderer was found in main.ts');
  ok(at > 0 && /moraleDelta/.test(mainTs.slice(at, at + 900)), 'the #cn-result renderer puts that morale change on screen');

  console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
