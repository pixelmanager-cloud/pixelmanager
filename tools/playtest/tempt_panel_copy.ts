// A BADGE ON A TAB IS A PROMISE THAT SOMETHING IS WAITING. THIS ONE HAD NOTHING BEHIND IT.
//
// The Life tab wore a 🎲 on every turn `computeOffPitch` produced a temptation — 6.5 badged turns a career
// for a clean reputation, ~14 for an edgy one — and the panel it opened rendered a heading and a blurb and
// NOTHING else: no `data-act`, no button, no handler. The ten blurbs were written as two-branch dilemmas
// ("Easy money, or a story you don't want written.", "Loyalty, or a slippery slope?"), so what the badge
// summoned the player to was a moral choice with no branch to take. §100: CK took option (a) — no badge,
// and the blurbs reworded into observed flavour, so the panel reads as colour rather than a prompt.
//
// This pins the SHAPE OF THE PROMISE rather than any particular wording: the tab label may not vary on
// whether a temptation is live, neither the label nor the panel heading may wear the 🎲 that advertised a
// roll, and no temptation string may put a question, an either/or, or a second-person offer to a player
// who has no way to answer it. (The second-person rule is blunt on purpose. Elsewhere on this tab "you" is
// the term of a deal he already signed — an endorsement obligation. Here it is an offer he cannot accept,
// which is the whole defect, and dropping a question mark alone would let it straight back in.)
//
// CHECK 1 DECIDES WHETHER THE REST OF THIS FILE SHOULD EXIST. It reads the panel's own markup and confirms
// it is still inert. If somebody wires the real two-option choice — §100 option (b), recorded under
// "Deferred" in docs/game-upgrade-ideas.md — that check goes red FIRST, and this probe wants RETIRING:
// the badge and the dilemmas are honest again the moment there is something to choose.
//
// Run: `npx tsx tools/playtest/tempt_panel_copy.ts`
import { readFileSync } from 'node:fs';
import { computeOffPitch } from '../../shared/src/offpitch.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== the Life tab advertises no choice the temptation panel cannot give ===');

const src = readFileSync('client/src/main.ts', 'utf8');

// ── 1. THE PREMISE, read from the render site rather than assumed. Also the vacuity guard for the panel
// check below: if the markup is ever renamed away from `o.temptation.blurb`, this goes red instead of the
// 🎲 check quietly passing over a line that no longer exists.
const panel = src.split('\n').filter((l) => l.includes('o.temptation.blurb'));
ok(panel.length === 1, `exactly one line in main.ts renders the temptation panel (found ${panel.length})`);
const inert = panel.length > 0 && panel.every((l) => !/data-act|<button|onclick=|data-id/.test(l));
ok(inert, 'the temptation panel is still inert — no data-act, no button, no handler to press');
if (!inert) console.log('  ..   the choice looks WIRED — if that is real, §100 (b) has landed: the badge and the '
  + 'dilemma wording are honest again, and this probe should be retired rather than the panel edited back');

// ── 2. THE BADGE. One line pushes the Life tab; its label must not know whether a temptation exists.
const tab = src.split('\n').filter((l) => l.includes("TABS.push(['life'"));
ok(tab.length === 1, `exactly one line pushes the Life tab (found ${tab.length}) — not a zero-of-zero pass`);
for (const l of tab) {
  console.log(`  ..   Life tab: ${l.trim()}`);
  ok(!/temptation/.test(l), 'the Life tab label does not vary on whether a temptation is live');
  ok(!l.includes('🎲'), 'the Life tab label wears no 🎲');
}
// The panel's own heading carried the same die and the same word. A tab with no badge that opens onto
// "🎲 TEMPTATION — …" makes the identical promise one click later.
for (const l of panel) ok(!l.includes('🎲'), 'the temptation panel heading wears no 🎲 either');

// ── 3. THE TEN STRINGS, harvested by RUNNING the engine rather than by reading offpitch.ts, so wording
// that never reaches a player cannot satisfy this, and an eleventh temptation is linted the day it lands.
const seen = new Map<string, { title: string; blurb: string }>();
let calls = 0;
for (let s = 0; s < 400; s++) {
  for (const turn of [60, 90, 120, 150, 180]) {
    calls++;
    const op = computeOffPitch({ careerScore: 400, caps: 2, seed: (s * 2654435761) % 2147483647, turn,
      tags: { aggression: 18, flair: 14 }, bigWins: 1, flair: 9 });
    if (op.temptation) seen.set(op.temptation.kind, { title: op.temptation.title, blurb: op.temptation.blurb });
  }
}
console.log(`  ..   ${seen.size} distinct temptations harvested from ${calls} computeOffPitch calls`);
// VACUITY GUARD: ten are authored in offpitch.ts. Fewer means the harvest missed some (or the gate stopped
// firing) and the lint below would report green having read half the corpus.
ok(seen.size >= 10, `every authored temptation was reached (${seen.size} of the 10 in offpitch.ts)`);

const PROMPTS: { re: RegExp; what: string }[] = [
  { re: /\?/, what: 'asks a question the panel has no answer for' },
  { re: /[,—–]\s*or\b/i, what: 'offers an either/or with no button behind either branch' },
  { re: /\byou(?:r|rs|rself)?\b/i, what: 'addresses the player as the one who decides' },
];
const bad: string[] = [];
for (const [kind, t] of seen) {
  for (const [field, text] of [['title', t.title], ['blurb', t.blurb]] as const) {
    for (const p of PROMPTS) if (p.re.test(text)) bad.push(`${kind}.${field} ${p.what}: "${text}"`);
  }
}
for (const b of bad) console.log(`       ${b}`);
console.log(`  ..   ${seen.size * 2} strings linted, ${bad.length} flagged`);
ok(bad.length === 0, `every temptation observes something happening rather than putting a choice (${bad.length} flagged)`);

console.log(fails ? `\n✗ the Life panel still promises a choice it cannot give`
                  : `\n✓ no badge, no die, and ten observations rather than ten unanswered prompts`);
if (fails) process.exitCode = 1;
