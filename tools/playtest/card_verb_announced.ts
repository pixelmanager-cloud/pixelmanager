// A DRAFT PICK THAT ANNOUNCES ITSELF AS "PLAY".
//
// cardHtml renders the only control the card game has, and makeActivatable stamps role="button" on that
// bare DIV — which makes its aria-label the WHOLE announcement: it overrides the visible .cg-cname and
// .cg-cdescr, so the verb the label opens with is the only verb a keyboard or screen-reader player is ever
// given. That label was `act === 'view' ? ... : \`Play ${name}. ...\``, i.e. the play verb hard-coded on the
// else branch — and the else branch is what the DRAFT phase takes too. So on the screen that reads "Draft
// N cards into his deck", every option announced as "Play <card>": the verb for the reversible,
// once-per-moment action, spoken over the irreversible pick that shapes the rest of the career. keepFocus's
// own post-mortem in the same file already records what confusing those two costs — "another irreversible
// commit" — so these two verbs are known here to be dangerous to swap.
//
// THIS PROBE DOES NOT GREP FOR THE WORD. It lifts cardHtml's real label expression out of main.ts and
// evaluates it once per act that a real call site passes — the acts are discovered by scanning the call
// sites, not typed in here, so a new phase that reuses cardHtml cannot slip through unannounced. The draft
// verb is then checked against the draft screen's own instruction copy, so it has to be the word the screen
// is asking for and not merely any word that isn't "Play".
//
// MUTATION TEST — each of these must turn a line below red: put `Play` back on the else branch; change the
// draft verb to a word the draft prompt does not use ("Take"); drop `${name}` out of the label; delete the
// `'draft'` call site (the coverage check goes red rather than passing over an empty list); drop the
// `showTags` gate off the `Draws on …` clause, or invert it so the label never names the tags. Every
// announcement is echoed on a `..` line, so a check that measured an empty string shows up in the log
// instead of passing as a green tick over nothing.
//
// Run: `npx tsx tools/playtest/card_verb_announced.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== A card announces the verb its own screen is asking for ===');

/** The body of a method, brace-matched from its signature. */
function bodyOf(signature: string): string {
  const at = src.indexOf(signature);
  if (at < 0) return '';
  let depth = 0;
  for (let i = src.indexOf('{', at); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(at, i + 1); }
  }
  return '';
}

const card = bodyOf('private cardHtml(c: import(\'./api\').CareerCard, act: string');
ok(card.length > 0, 'cardHtml still exists (the single renderer every card on every screen goes through)');

// ── which acts actually reach it ──────────────────────────────────────────────────────────────────────
// Discovered from the call sites, so this list cannot rot into a stale copy of the truth, and so an act
// with no call site cannot make the checks below vacuous.
const acts = [...src.matchAll(/this\.cardHtml\(\s*[^,()]+,\s*'([a-z]+)'/g)].map((m) => m[1]);
console.log(`  ..   cardHtml call sites pass act=[${acts.join(', ')}]`);
ok(acts.length >= 3 && acts.includes('draft') && acts.includes('play') && acts.includes('view'),
   'the play, draft and deck-list call sites were all found (this is not measuring an empty list)');

/** What each screen is actually asking the player to do. `null` = no action, so no verb. */
const EXPECT: Record<string, { verb: string | null; why: string }> = {
  play:  { verb: 'Play',  why: 'a moment: the card is played into it' },
  draft: { verb: 'Draft', why: 'a draft: the card is committed to the deck for the rest of the career' },
  view:  { verb: null,    why: 'the deck list: nothing is activated, so the label opens with the card name' },
};
for (const a of new Set(acts)) {
  ok(a in EXPECT, `act '${a}' has a decided announcement verb — a new phase reusing cardHtml must choose one`);
}

// ── render the real label ─────────────────────────────────────────────────────────────────────────────
// Lifted from cardHtml from the showTags line to the return, so it carries whatever the file really
// computes for the label, comments and all — not a paraphrase of it. The lift starts ON `const showTags`
// (it used to start on the line after) because challenge mode's mask has to reach the label as well as the
// pills, and a gate outside the lifted span is a gate this probe cannot see. `this` is not the app inside
// `new Function`, so the one `this.prefs` on that line is rewritten to a `prefs` argument the caller
// supplies — lifting it verbatim would make every announce() throw instead of measuring anything.
const from = card.indexOf('const showTags');
const end = card.indexOf('return `<div class="cg-card');
const labelSrc = from >= 0 && end > from ? card.slice(from, end).replace(/this\.prefs\b/g, 'prefs') : '';
console.log(`  ..   lifted label source: ${labelSrc.replace(/\s+/g, ' ').trim().slice(0, 160) || '(none)'}`);
ok(/\bconst aria\b/.test(labelSrc), 'the accessible-name expression was lifted out of cardHtml');

const C = { id: 'shoulder_drop', name: 'Drop of the shoulder', desc: 'He shifts his weight and goes.',
            tags: ['flair', 'technique'], rarity: 'rare' };
function announce(act: string, hideCardStats = false): string {
  try {
    const f = new Function('act', 'name', 'desc', 'c', 'rar', 'prefs', `${labelSrc}\nreturn aria;`);
    // cardHtml collapses whitespace on its way into the attribute; a reader hears the collapsed string.
    return String(f(act, C.name, C.desc, C, C.rarity, { hideCardStats })).replace(/\s+/g, ' ').trim();
  } catch (e) { return `(threw: ${(e as Error).message})`; }
}

const heard: Record<string, string> = {};
for (const a of new Set(acts)) {
  heard[a] = announce(a);
  console.log(`  ..   act='${a}' is announced as: "${heard[a]}"`);
  // Non-vacuity: if the label ever stops naming the card, every verb check below would be reading a
  // string with nothing in it, and "does not say Play" would pass for the worst possible reason.
  ok(heard[a].includes(C.name) && heard[a].includes(C.desc),
     `act '${a}' still names the card and reads its description (the label is not empty)`);
}

for (const a of new Set(acts)) {
  const want = EXPECT[a];
  if (!want) continue;
  const first = heard[a].split(' ')[0] ?? '';
  if (want.verb === null) {
    ok(heard[a].startsWith(C.name), `act '${a}' opens with the card's name, not a verb — ${want.why}`);
  } else {
    ok(first === want.verb, `act '${a}' is announced "${want.verb} <card>" — ${want.why} (heard "${first}")`);
  }
  // The specific defect: the play verb spoken over a different, irreversible act.
  if (a !== 'play') {
    ok(!/\bPlay\b/.test(heard[a]), `act '${a}' does not tell the player he is PLAYING the card`);
  }
}

// ── and challenge mode has to reach the announcement, not just the pills ──────────────────────────────
// "Challenge: hide card stats" masks the tag pills on the PLAY cards so you read the action and work out
// what it trains. The pills were the only thing it masked: the aria-label being the whole announcement,
// the label went on saying "Draws on flair and technique" and handed a screen-reader player the exact
// answer the 🎲 exists to withhold — the game's one difficulty setting did nothing for him. Rendering BOTH
// states is what keeps this honest: a label that never named the qualities would be a deletion rather than
// a mask, and the OFF check below is what catches that.
const shown = announce('play', false);
const masked = announce('play', true);
console.log(`  ..   play, "hide card stats" OFF: "${shown}"`);
console.log(`  ..   play, "hide card stats" ON:  "${masked}"`);
ok(C.tags.every((t) => shown.includes(t)),
   `with "hide card stats" off the label still names what the card draws on (${C.tags.join(', ')})`);
ok(C.tags.every((t) => !masked.includes(t)),
   'with "hide card stats" ON the label masks them too — the pills and the announcement hide the same thing');
ok(masked.includes(C.name) && masked.includes(C.desc),
   'the masked label still names and describes the card — challenge mode hides the stats, not the card');

// ── and the spoken verb has to be the one on screen ───────────────────────────────────────────────────
// Without this the probe only asserts "not Play", which any word satisfies. The draft screen states its own
// action in the instruction above the cards ("Draft N cards into his deck"), so the word a reader hears can
// be checked against the word a sighted player reads. Only draft: the moment screens ask a question rather
// than naming the action ("How does he handle it?"), so there is no on-screen word there to match.
const draftAt = src.indexOf("s.phase === 'draft' && s.options");
const draftEnd = src.indexOf("this.cardHtml(c, 'draft')", draftAt);
const draftCopy = draftAt < 0 || draftEnd < 0 ? '' : src.slice(draftAt, draftEnd)
  .replace(/\$\{[^{}]*\}/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
console.log(`  ..   draft screen reads: "${draftCopy.slice(0, 140)}"`);
ok(draftCopy.length > 60, 'the draft screen\'s own instruction copy was located');
const spoken = (heard.draft ?? '').split(' ')[0] ?? '';
ok(spoken.length > 0 && new RegExp(`\\b${spoken.replace(/[^\w]/g, '')}\\b`).test(draftCopy),
   `the verb a reader hears on the draft screen ("${spoken}") is the word that screen itself uses`);

// The announcement only matters because the card is a button: role="button" makes aria-label the entire
// accessible name and drops the visible text. If that ever stops being true, the verb stops being the whole
// story and this probe is measuring the wrong thing.
const activatable = bodyOf('private makeActivatable(els: NodeListOf<Element> | Element[]): void');
ok(/setAttribute\('role', 'button'\)/.test(activatable),
   'the cards are still given role="button" — which is why aria-label is the whole announcement');

console.log(fails ? `\n✗ ${fails} problem(s) — a card announces a verb for an action it does not perform`
                  : '\n✓ every card screen announces its own verb');
if (fails) process.exitCode = 1;
