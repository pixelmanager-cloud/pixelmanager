// THE FAME GATE'S COMMENT MUST QUOTE THE TURNS ITS OWN CLAMP USES.
//
// `computeOffPitch`'s maturity gate is the ONLY documentation of when public fame is allowed to build, and
// it described a career that cannot happen: "marketability ramps from ~mid-teens (turn 90) to full by the
// First-Team years (turn 150)" sat directly above `clamp((turn - 54) / 36, 0, 1)`. The prose is a leftover
// from the 202→120 band rescale — turn 150 is 30 turns past the END of a 120-turn career, and turn 90 is
// First Team age 21, not mid-teens — so anyone retuning the Life tab from it was reading a range off the
// end of the map, in the wrong direction, on both ends.
//
// The gate is therefore DERIVED, not a spell-check: the ramp endpoints are read out of the clamp, the ages
// out of `bandAt`, the career length out of `TOTAL_TURNS`. Retune the formula tomorrow and this goes red
// until the sentence above it moves too — which is the whole point, because that is the edit that broke it.
//
// Run: `npx tsx tools/playtest/offpitch_maturity_doc.ts`
import { readFileSync } from 'node:fs';
import { bandAt, TOTAL_TURNS } from '../../shared/src/career.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== the off-pitch fame gate quotes the turns its own clamp ramps over ===');

const src = readFileSync('shared/src/offpitch.ts', 'utf8');
const lines = src.split('\n');

// ── 1. THE RAMP, read from the code rather than assumed. If the clamp is ever reshaped this goes red FIRST
// and names the change, instead of §3 comparing the comment against a number parsed out of thin air.
const at = lines.findIndex((l) => /const maturity = clamp\(/.test(l));
const form = at >= 0 ? /clamp\(\(turn - (\d+)\) \/ (\d+), 0, 1\)/.exec(lines[at]) : null;
ok(!!form, 'the maturity clamp was located in shared/src/offpitch.ts (not a zero-of-zero pass)');
if (!form) { console.log('\n1 FAILED'); process.exit(1); }
const rampStart = Number(form[1]);
const rampFull = rampStart + Number(form[2]);
console.log(`  ..   clamp: maturity ramps turn ${rampStart} → ${rampFull} of ${TOTAL_TURNS} career turns`);
console.log(`  ..   turn ${rampStart} is ${bandAt(rampStart).band.name} age ${bandAt(rampStart).age}; turn ${rampFull} is ${bandAt(rampFull).band.name} age ${bandAt(rampFull).age}`);
// Margin worth printing: offPitch is only computed from band 4 up (tokens.ts), so the ramp's first bite is
// later than its start — a reader retuning this needs the effective floor, not just the formula's.
const firstComputed = [...Array(TOTAL_TURNS).keys()].find((t) => bandAt(t).index >= 4) ?? -1;
console.log(`  ..   first turn offPitch is computed at all is ${firstComputed} (${bandAt(firstComputed).band.name}), where maturity is already ${((firstComputed - rampStart) / Number(form[2])).toFixed(2)}`);

// ── 2. THE PROSE. The run of `//` lines directly above the clamp — the sentence a reader takes the range
// from. Guarded, because a comment that has been moved or deleted would leave §3 passing over an empty
// string: the zero-of-zero green that kept four dead `transition: width` rules alive here for months.
const block: string[] = [];
for (let i = at - 1; i >= 0 && /^\s*\/\//.test(lines[i]); i--) block.unshift(lines[i].replace(/^\s*\/\/ ?/, ''));
const prose = block.join(' ').replace(/\s+/g, ' ').trim();
console.log(`  ..   ${block.length} comment line(s) above the clamp, ${prose.length} chars`);
ok(block.length >= 3 && /\bturn \d+/.test(prose), 'the gate is still documented in turns directly above the clamp');

// ── 3. AND IT QUOTES THE CLAMP'S OWN ENDPOINTS, in order, with the age bandAt actually returns at each.
// The age pairing is not decoration: "mid-teens" was the half of the old sentence that no turn number
// could have contradicted, and it was wrong by a whole chapter.
const cited = [...prose.matchAll(/\bturns? (\d+)\b/g)].map((x) => Number(x[1]));
console.log(`  ..   comment quotes turn(s): ${cited.join(', ') || '(none)'}`);
const impossible = cited.filter((t) => t >= TOTAL_TURNS);
for (const t of impossible) console.log(`       turn ${t} cannot occur — the career is ${TOTAL_TURNS} turns long`);
ok(impossible.length === 0, `every turn quoted is one a career actually reaches (${impossible.length} past the end)`);
ok(cited.length === 2 && cited[0] === rampStart && cited[1] === rampFull,
   `the turns quoted are the clamp's own endpoints, in order (${rampStart} → ${rampFull})`);

const pairs = [...prose.matchAll(/\bturn (\d+), age (\d+)\b/g)].map((x) => [Number(x[1]), Number(x[2])] as const);
console.log(`  ..   ${pairs.length} of ${cited.length} quoted turn(s) carry an age, in the form "turn N, age A"`);
ok(pairs.length === cited.length, 'each quoted turn says how old the player is at it');
const wrong = pairs.filter(([t, a]) => bandAt(t).age !== a || !prose.includes(bandAt(t).band.name));
for (const [t, a] of wrong) console.log(`       turn ${t} is ${bandAt(t).band.name} age ${bandAt(t).age}, quoted as age ${a}${prose.includes(bandAt(t).band.name) ? '' : ` (and the comment never names "${bandAt(t).band.name}")`}`);
ok(pairs.length > 0 && wrong.length === 0, 'and names the chapter and age bandAt gives for that turn');

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
