// REGISTER GUARD for the prompt corpus (PT-404). At ~49,000 authored lines nobody can read them all, and
// the failure mode is not a bad line — it is 500 lines with the same shape, which is exactly what makes
// prose read as generated rather than authored. Volume without this check makes the game worse, not better.
import { KIND_SETUP } from '../../shared/src/prompts/kind_setup.js';
import { DEMAND } from '../../shared/src/prompts/demand.js';
import { FRAME_BY_CHAPTER } from '../../shared/src/prompts/frame.js';
import { CHILD_SETUP } from '../../shared/src/prompts/child_setup.js';
import { SETTINGS } from '../../shared/src/prompts/settings.js';
import { EVENT_PREFIX } from '../../shared/src/prompts/event_prefix.js';
import { BIG_SETTINGS } from '../../shared/src/prompts/big_settings.js';
import { LIFESTYLE, COACHES, AGENTS, CARD_DESC } from '../../shared/src/career.js';

const all: Array<[string, string]> = [];
for (const [bank, data] of Object.entries({ KIND_SETUP, DEMAND, FRAME_BY_CHAPTER, CHILD_SETUP, SETTINGS, EVENT_PREFIX })) {
  for (const [key, lines] of Object.entries(data as Record<string, string[]>)) for (const l of lines) all.push([`${bank}.${key}`, l]);
}
for (const l of BIG_SETTINGS) all.push(['BIG_SETTINGS', l]);

const checks: Array<[string, boolean, string]> = [];
const say = (name: string, ok: boolean, val: string) => checks.push([name, ok, val]);

// 1. AMERICANISMS — the library is British and has been kept clean by hand; at scale it needs enforcing
const US = /\b(soccer|cleats|mom|gotten|practice field|tryouts?|roster|offense|defense|jersey|field goal|freshman|vacation|apartment|elevator|candy|fall season)\b/i;
const usHits = all.filter(([, l]) => US.test(l));
say('no Americanisms', usHits.length === 0, usHits.length ? `${usHits.length}, e.g. "${usHits[0][1].slice(0, 50)}"` : '0');

// 2. SHAPE CLUSTERING — the same opening three words over and over is the tell
const opens = new Map<string, number>();
for (const [, l] of all) {
  const k = l.toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/).slice(0, 3).join(' ');
  if (k) opens.set(k, (opens.get(k) ?? 0) + 1);
}
const topOpen = [...opens.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
const openShare = 100 * topOpen[1] / Math.max(1, all.length);
say('no single opening dominates (< 2.0% of lines)', openShare < 2.0, `"${topOpen[0]}" ${openShare.toFixed(2)}%`);

// 2b. ENDINGS — the mirror, and the axis where generated prose usually clusters HARDEST ("…and he knows
// it", "…in a way he can't name"). Measured at 0.14% worst when this was added, which is genuinely good;
// the check exists to keep it that way rather than to fix it.
const ends = new Map<string, number>();
for (const [, l] of all) {
  const k = l.toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/).filter(Boolean).slice(-3).join(' ');
  if (k) ends.set(k, (ends.get(k) ?? 0) + 1);
}
const topEnd = [...ends.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
const endShare = 100 * topEnd[1] / Math.max(1, all.length);
say('no single ending dominates (< 1.0% of lines)', endShare < 1.0, `"${topEnd[0]}" ${endShare.toFixed(2)}%`);

// 2c. EMOTING — naming the feeling instead of showing it is the loudest tell of generated prose. The
// corpus sat at 0.7% when this was added; the check guards the habit, it does not create it.
const ABSTRACT = /\b(fear|pride|doubt|hope|love|shame|confidence|belief|respect|trust|anger|joy|sadness|despair)\b/i;
const emoting = all.filter(([, l]) => ABSTRACT.test(l));
say('lines show rather than name the feeling (< 4%)', 100 * emoting.length / Math.max(1, all.length) < 4,
  `${(100 * emoting.length / Math.max(1, all.length)).toFixed(1)}%`);

// 3. LENGTH SPREAD — a CRUDE PROXY, recorded as such so nobody mistakes it for a law. Uniform length reads
// mechanical, so this nudges toward variety. Two things worth knowing before anyone tunes it: the game's
// own ORIGINAL hand-written corpus measures sd 2.5 and would fail this gate, and an earlier house rule of
// "8-16 words" mathematically capped sd near 2.3, so the style guide and this check contradicted each other
// for the first several authoring waves. The gate is deliberately stricter than the source material,
// because at ~49,000 lines uniformity becomes visible in a way it never was at 489. Verified NOT gamed:
// the length histogram is a clean unimodal curve, not the two humps that padding-to-hit-a-number produces.
const lens = all.map(([, l]) => l.split(/\s+/).length);
const mean = lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length);
const sd = Math.sqrt(lens.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, lens.length));
say('sentence length actually varies (sd >= 3.0 words)', sd >= 3.0, `mean ${mean.toFixed(1)}, sd ${sd.toFixed(1)}`);

// 4. THE APPOSITIVE TIC — ", which is …" was already an audible tic once (PT-203)
const tic = all.filter(([, l]) => /,\s*which is\b/i.test(l));
say('the ", which is …" tic stays rare (< 2%)', 100 * tic.length / Math.max(1, all.length) < 2, `${tic.length} lines`);

// 5. SECOND PERSON — prompts are third-person about "he"; "you" leaks from other surfaces
// "thank you" / "you name it" are idioms, not the second person addressing the player — a guard that
// cries wolf gets switched off, so they are excluded rather than left to be argued about every wave.
// REPORTED SPEECH IS NOT SECOND PERSON. A manager saying "'You'll know in April,'" or an app telling him
// to rate his sleep is dialogue inside a third-person sentence — the narrator has not turned to address
// the player. The old rule flagged those as register breaks and would have had authors delete good
// writing to satisfy it, so quoted spans are stripped before the test rather than argued about each wave.
const unquoted = (l: string) => l.replace(/['"‘’“”][^'"‘’“”]*['"‘’“”]/g, ' ');
// THE IMPERSONAL "YOU" IS NOT THE SECOND PERSON. "Nobody warns you that the biggest day is a Tuesday" and
// "a hamstring gives you about a second of warning" are ordinary English generics — the narrator has not
// turned to address the player any more than "you can see the ground from the bypass" does. Flagging them
// flagged eleven lines, nine of which are good writing, and this file's own comment two lines up says why
// that matters: a guard that cries wolf gets switched off.
//
// What IS a register break is a line that does both at once — the generic "you" and the third-person "he"
// in the same breath, about the same man, which is the clash a reader actually notices:
//     "Two hundred appearances gets you a plaque on the corridor wall … and he is roughly a quarter of the
//      way there"
// That is the one this now catches, along with genuine direct address (an imperative aimed at the player).
const secondPerson = (l: string) => /(?<!thank )\byou\b|\byour\b/i.test(unquoted(l)) && !/thank you|you name it/i.test(l);
const thirdPerson = (l: string) => /\b(he|him|his)\b/i.test(unquoted(l));
const mixed = all.filter(([, l]) => secondPerson(l) && thirdPerson(l));
say('no line mixes "you" and "he" about the same man', mixed.length === 0,
  mixed.length ? `${mixed.length}, e.g. "${mixed[0][1].slice(0, 70)}"` : '0');
// 5b. THE OPTION COPY WAS OUTSIDE EVERY CHECK ABOVE. This probe loads seven PROMPT banks, and the ~300
// player-facing strings on the things a player actually clicks — lifestyle purchases, coaches, agents, card
// descriptions — live in career.ts and were read by nothing. That is how "Give back to where you came from
// — the people love him." shipped: a single sentence that addresses the player as `you` and then talks
// about him as `he`, which is the exact clash check 5 exists to catch. It matters more here than in a
// prompt bank, because a lifestyle blurb is reused VERBATIM as the outcome narration and lands inside the
// .cg-narrate quote box that every other turn fills with third-person prose.
//
// Three lines legitimately mix the two, because their "him/his" is a DIFFERENT man. They are named here
// rather than pattern-matched away, so a fourth cannot join them quietly.
const OTHER_MAN = new Set([
  'A wise old pro takes you under his wing',                                  // the coach's wing, not the player's
  'Use your frame, shoulder to shoulder, to knock him off it.',               // the opponent being knocked off the ball
  'Stand your ground and block it at his feet, brave as they come.',          // the opponent's feet
]);
const optionCopy: Array<[string, string]> = [];
const collect = (src: string, o: any) => {
  for (const f of ['name', 'blurb', 'desc', 'perk']) if (typeof o?.[f] === 'string') optionCopy.push([`${src}.${f}`, o[f]]);
};
for (const it of LIFESTYLE) collect(`LIFESTYLE.${it.id}`, it);
for (const it of COACHES as any[]) collect(`COACHES.${it.id}`, it);
for (const it of AGENTS as any[]) collect(`AGENTS.${it.id}`, it);
for (const [k, v] of Object.entries(CARD_DESC)) optionCopy.push([`CARD_DESC.${k}`, v]);
console.log(`  note option copy scanned: ${optionCopy.length} string(s) across LIFESTYLE/COACHES/AGENTS/CARD_DESC`);
// VACUITY GUARD: an import that resolved to undefined, or a renamed field, would scan nothing and pass.
say('the option copy was actually loaded (not a zero-of-zero pass)', optionCopy.length > 200, `${optionCopy.length}`);
const optMixed = optionCopy.filter(([, l]) => secondPerson(l) && thirdPerson(l) && !OTHER_MAN.has(l));
for (const [k, l] of optMixed) console.log(`       ${k}: ${l}`);
say('no option blurb switches person about the player himself', optMixed.length === 0,
  optMixed.length ? `${optMixed.length}, e.g. "${optMixed[0][1].slice(0, 70)}"` : '0');

// reported separately, not asserted: the impersonal-you count, so a drift toward second-person narration
// is still visible in the output even though it does not fail the build.
const impersonal = all.filter(([, l]) => secondPerson(l) && !thirdPerson(l));
console.log(`  note impersonal "you" (generic, not address): ${impersonal.length} line(s) — register, not a defect`);

// 6. PLACEHOLDERS — narrate.ts substitutes exactly {rival} and {mentor} in a setup line. Anything else
// renders LITERALLY on screen, so an author inventing {gaffer} or {captain} ships a visible bug. With tens
// of thousands of authored lines this cannot be caught by reading.
const ALLOWED = new Set(['{rival}', '{mentor}']);
const badPh: Array<[string, string]> = [];
for (const [k, l] of all) for (const m of l.match(/\{[^}]*\}/g) ?? []) if (!ALLOWED.has(m)) badPh.push([k, m]);
say('only {rival} and {mentor} placeholders are used', badPh.length === 0,
  badPh.length ? `${badPh.length}, e.g. ${badPh[0][1]} in ${badPh[0][0]}` : '0');

console.log(`=== Prompt register — ${all.length} lines ===`);
let fails = 0;
for (const [n, ok, v] of checks) { console.log(`  ${ok ? 'OK  ' : 'FLAG'} ${n}  (${v})`); if (!ok) fails++; }
console.log(fails ? `\n⚠ ${fails} register concern(s)` : `\n✓ the corpus still reads authored`);
if (fails) process.exitCode = 1;
