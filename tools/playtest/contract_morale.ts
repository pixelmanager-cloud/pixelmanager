// HOW YOU TREAT YOUR STAR AT THE TABLE MUST MATTER.
//
// evaluateContractOffer returns a moraleDelta — +6 for terms he is delighted with, +3 for terms he merely
// accepts, 0 for a counter, -6 for an offer he is insulted by — and no caller had ever applied it. So a
// generous deal and a grudging one landed identically (both got only the flat `extended` +10), and
// lowballing him was entirely free, because negotiateStar returns on the non-accept paths before touching
// morale at all.
//
// Checked by OUTCOME, not by reading the source: the question is whether his morale actually differs.
//
// Two traps this probe fell into first, both worth stating so the next reader does not repeat them:
// the reference wage is `baseWage` (starContractInfo has no `askWage`), so a probe reaching for the wrong
// field silently offers a pittance and every outcome is 'reject'; and the star's morale does NOT surface
// through api.me() — he lives as a Token merged in for reads — so it has to come off the token.
//
// Run: `npx tsx tools/playtest/contract_morale.ts`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, localStore } from '../../client/src/save.js';
import { buildDynasty } from '../dev_dynasty_save.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** A fresh save each time: morale is cumulative on the token, so reusing one contaminates the next case. */
async function offer(mult: number, slot: string): Promise<{ outcome: string; before: number; after: number }> {
  __setBackendForTests(createInMemoryBackend());
  const pid = await buildDynasty({ gens: 1, familyName: 'Ashcombe', slot });
  const info: any = await api.starContractInfo(pid);
  const base = Math.max(1, Math.round(Number(info.baseWage)));
  const before = Number((await localStore.getToken(pid) as any)?.morale ?? 65);
  let outcome = 'threw';
  try { outcome = (await api.negotiateStar(pid, Math.round(base * mult), 3) as any).outcome; } catch { /* rejection/funds */ }
  const after = Number((await localStore.getToken(pid) as any)?.morale ?? 65);
  return { outcome, before, after };
}

async function main() {
  console.log('=== Contract terms move the star\'s morale ===');
  const insult  = await offer(0.50, 'cm-insult');
  const meet    = await offer(1.05, 'cm-meet');
  const lavish  = await offer(1.40, 'cm-lavish');
  for (const [label, r] of [['insulting', insult], ['meeting his ask', meet], ['generous', lavish]] as const) {
    console.log(`  ..   ${label.padEnd(16)} outcome=${r.outcome.padEnd(8)} morale ${r.before} -> ${r.after} (${r.after - r.before >= 0 ? '+' : ''}${r.after - r.before})`);
  }
  ok(insult.outcome === 'reject', 'an offer at half his wage is still rejected (the setup is right)');
  ok(insult.after < insult.before, 'insulting him at the table costs morale — it used to be free');
  ok(meet.outcome === 'accept' && lavish.outcome === 'accept', 'offers at and above his number are accepted');
  ok(meet.after > meet.before, 're-signing him is a positive');
  ok(lavish.after - lavish.before > meet.after - meet.before,
     `generosity beats meeting the number (+${lavish.after - lavish.before} vs +${meet.after - meet.before})`);

  console.log(fails ? `\n✗ ${fails} failure(s) — the terms are not reaching his morale` : '\n✓ generous, adequate and insulting all land differently');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
