// PROSE INSIDE A BUTTON IS STILL PROSE.
//
// The two shirt-sponsor cards on the season screen are <button>s, so they take the sheet's global button
// rule — `button { … letter-spacing: 0.5px; text-transform: uppercase; … }` — and every element nested in
// one inherits it. They are not labels: each is a card carrying a <b> title and a <span> of terms. So the
// season's one-shot 450c decision was read in all-caps body copy, and the coin suffix came out capitalised:
// "+450C NOW, GUARANTEED" and "+150C NOW, +400–700C BONUS FOR A TOP-3 FINISH" — a unit this client writes
// lowercase in every other coin readout.
//
// The sheet already knows the rule and keeps it three times over: `.mode-card`, `.cn-offer .cn-o-hint` and
// `.slot .role-badges .rb` each reset text-transform and letter-spacing against exactly this inheritance,
// and the manager-arc choice sitting on the same screen escapes it only by being a <div> rather than a
// <button>. This card is the one that got missed, and nothing could see it, because CSS has no way to fail.
//
// VACUITY. The reset is worth nothing if the cards stop being buttons, if the copy stops being prose, or
// if the global button rule stops shouting — so all three are read first, and each is a FAIL rather than a
// skip. Mutation test: delete `text-transform: none` from `.sf-sponsor-opt` and the gate goes red; delete
// `text-transform: uppercase` from the `button` rule and the premise branch says so out loud instead of
// silently passing; change a card's markup to a <div> and the premise assertions go red.
//
// Run: `npx tsx tools/playtest/sponsor_card_casing.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const html = readFileSync('client/index.html', 'utf8');
const main = readFileSync('client/src/main.ts', 'utf8');

/** The declaration block for a selector, so an assertion reads one rule rather than the whole file. */
function rule(sel: string): string {
  const i = html.indexOf(sel + ' {');
  if (i < 0) return '';
  const open = html.indexOf('{', i), close = html.indexOf('}', open);
  return close < 0 ? '' : html.slice(i, close + 1);
}

console.log('=== the shirt-sponsor cards read as prose, not as a shouted label ===');

// ── 1. THE PREMISE. Both options must still be <button class="sf-sponsor-opt"> cards holding a <b> title
// and a <span> of terms, and that copy must still be written lowercase — otherwise there is no casing left
// for the reset below to protect and this whole file is enforcing nothing.
const cards = [...main.matchAll(/<button class="sf-sponsor-opt"[^>]*><b>([^<]*)<\/b><span>([^<]*)<\/span><\/button>/g)];
console.log(`  ..   ${cards.length} sponsor card(s) emitted: ${cards.map((c) => `"${c[1].trim()} / ${c[2].trim()}"`).join('  ')}`);
ok(cards.length >= 2, 'both shirt-sponsor options are still <button class="sf-sponsor-opt"> cards');
ok(cards.length > 0 && cards.every((c) => /[a-z]/.test(c[1]) && /[a-z]/.test(c[2])),
   'their titles and their terms are written as prose, so uppercasing them is a visible change');
ok(cards.some((c) => /\d+c\b/.test(c[2])), '…and they quote coins with the lowercase c suffix the rest of the client uses');

// ── 2. THE INHERITANCE being reset. If the global button rule ever stops shouting, the reset guards
// nothing and this probe must say so rather than stay quietly green on a dead assertion.
const btn = /\n[ \t]*button \{([^}]*)\}/.exec(html)?.[1] ?? '';
ok(btn.length > 0, 'the global button rule is still where this file thinks it is');
const shouts = /text-transform:\s*uppercase/.test(btn);
console.log(`  ..   the global button rule ${shouts ? 'still uppercases' : 'NO LONGER uppercases'} every button and everything nested inside one`);

// ── 3. THE FIX, on the card itself rather than on a descendant — the same place `.mode-card` and
// `.slot .role-badges .rb` put it, so the <b> title is corrected along with the <span> of terms.
const card = rule('.sf-sponsor-opt');
ok(card.length > 0, 'the sponsor-card rule still exists');
if (!shouts) {
  console.log('  ..   nothing uppercases these cards any more — re-read this probe before trusting it');
  ok(!/text-transform:\s*uppercase/.test(card), 'and the card does not reintroduce the shouting on its own');
} else {
  ok(/text-transform:\s*none/.test(card), 'the card resets text-transform, so its terms are not shouted');
  ok(/letter-spacing:\s*0(?![.\d])/.test(card), 'the card resets letter-spacing, so its body copy is not tracked like a label');
}

// ── 4. AND NOTHING PUTS IT BACK. A reset on the card is only as good as the rules that follow it, so
// every other rule naming this card is read too.
const others = [...html.matchAll(/^[ \t]*([^{}\n]*\.sf-sponsor-opt[^{}\n]*)\{([^}]*)\}/gm)]
  .filter((m) => m[1].trim() !== '.sf-sponsor-opt');
console.log(`  ..   ${others.length} further rule(s) name the card: ${others.map((m) => m[1].trim()).join(', ')}`);
ok(others.length > 0, 'the card really does have descendant rules, so the loop below measures something');
for (const m of others) {
  ok(!/text-transform:\s*uppercase/.test(m[2]), `${m[1].trim()} does not put the shouting back`);
  ok(!/letter-spacing:\s*0\.\d/.test(m[2]), `${m[1].trim()} does not put the label tracking back`);
}

console.log(fails ? `\n✗ ${fails} — the sponsor terms would be painted in capitals` : '\n✓ the sponsor cards are read as the prose they are');
if (fails) process.exitCode = 1;
