// THE RULES THE STYLESHEET SETS FOR ITSELF, ENFORCED.
//
// client/index.html states several house rules in its own comments and then breaks them, silently, because
// CSS has no way to fail. Each assertion here corresponds to a rule the sheet already declares and a defect
// that shipped under it.
//
//   SEMANTIC COLOUR IS NEVER DECORATIVE. The sheet says so in as many words: "green means good, red means
//   bad". The full-time card was --good green for every result, so a 0-5 defeat was announced in success
//   green inside a glowing green border, with the opposition's hat-trick scorer in a green Player-of-the-
//   Match chip. An earlier pass fixed exactly this on the HUD score and never looked at the card.
//
//   A GRADIENT THAT ENCODES A VALUE BELONGS TO THE TRACK. The morale bar painted the full red-amber-green
//   ramp inside the FILL, so the fill always ended green whatever its width — morale 8 and morale 100 were
//   the same colour and the bar's only signal was its length.
//
//   REDUCED MOTION MEANS LESS WAITING TOO. The clamp zeroed animation-duration and left animation-delay, so
//   a player who asked for less motion still sat through a staged reveal's 1.05s hold with nothing moving.
//
//   A RESERVED COLUMN NEEDS A WIDTH. flushMove writes an empty <span class="cm-min"></span> to hold the
//   minute column on continuation lines, which a zero-width inline span cannot do.
//
// Run: `npx tsx tools/playtest/visual_rules.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const html = readFileSync('client/index.html', 'utf8');

/** The declaration block for a selector, so an assertion reads one rule rather than the whole file. */
function rule(sel: string): string {
  const i = html.indexOf(sel + ' {');
  if (i < 0) return '';
  const open = html.indexOf('{', i), close = html.indexOf('}', open);
  return close < 0 ? '' : html.slice(i, close + 1);
}

console.log('=== The stylesheet keeps the rules it sets for itself ===');

// The law itself must still be written down, or these assertions are enforcing a rule nobody agreed to.
ok(/SEMANTIC colour, which is reserved and never decorative/.test(html),
   'the sheet still declares that semantic colour is never decorative');

console.log('\n-- a scoreline is neutral information, not a good outcome --');
for (const sel of ['#fulltime-card #ft-score', '#fulltime-card .ft-inner', '#fulltime-card .ft-head', '#ft-potm']) {
  const r = rule(sel);
  ok(r.length > 0, `${sel} still exists`);
  ok(!/var\(--good\)/.test(r), `${sel} does not paint a result-independent element with the success colour`);
}
// …and the HUD score, which the same pass fixed first, must not drift back.
ok(!/var\(--good\)/.test(rule('#hud .score')) || html.indexOf('#hud .score { color: #fff') > 0,
   'the HUD score is still the neutral broadcast plate');

console.log('\n-- a value-encoding gradient is anchored to its track --');
const mor = rule('.pc-card .pc-mbg b');
ok(mor.length > 0, 'the morale fill rule still exists');
ok(/background-size:\s*\d+px/.test(mor),
   'the morale ramp is sized to the track, so a short fill shows the red end rather than the whole ramp');

console.log('\n-- reduced motion removes the waiting as well as the movement --');
const clamps = [...html.matchAll(/animation-duration:\s*0\.001ms\s*!important;([^}]*)/g)].map((m) => m[0]);
console.log(`  ..   ${clamps.length} motion clamp(s) in the sheet`);
ok(clamps.length >= 2, 'both clamps are present (the OS media query and the in-game switch)');
for (const c of clamps) ok(/animation-delay:\s*0\.001ms\s*!important/.test(c), 'a motion clamp also zeroes animation-delay');

console.log('\n-- a reserved column has a width --');
const cm = rule('#ticker .cm-min');
ok(cm.length > 0, 'the minute-stamp rule still exists');
ok(/min-width:\s*\d+px/.test(cm), 'the minute column has a width, so the empty span reserving it does something');
ok(/display:\s*inline-block/.test(cm), '...and a display that lets a width apply');

console.log(fails ? `\n✗ ${fails} — the sheet is breaking a rule it states itself` : '\n✓ every stated rule holds');
if (fails) process.exitCode = 1;
