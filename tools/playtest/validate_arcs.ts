// Story-arc validator — the quality gate for the arc library. Checks every arc for structural + content
// correctness so a bad arc (invalid tag, dangling beat reference, duplicate id, empty prose) can never ship
// or brick a career. Run standalone or via `npm run playtest`.  npx tsx tools/playtest/validate_arcs.ts
import { LIFESTYLE } from '../../shared/src/career.js';
import { ARCS } from '../../shared/src/storyarc.js';

const TAGS = new Set(['composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'stamina', 'flair', 'keeping']);
const METERS = new Set(['authority', 'peers', 'family', 'school', 'agent', 'fans', 'sponsors', 'partner']);
const CATEGORIES = new Set(['saga', 'crisis', 'triumph', 'relationship', 'signature', 'offpitch']);
const EFFECT_KEYS = new Set(['energy', 'form', 'earnings', 'market', 'greed', 'meters', 'attr', 'injury', 'tag']);

let errors = 0;
const err = (arc: string, msg: string) => { console.log(`  FAIL [${arc}] ${msg}`); errors++; };

const ids = new Set<string>();
for (const a of ARCS) {
  const A = a.id || '<no id>';
  if (!a.id) err(A, 'missing id');
  if (ids.has(a.id)) err(A, `duplicate arc id (each arc id must be globally unique across all category files)`);
  ids.add(a.id);
  if (!a.title || !a.icon) err(A, 'missing title/icon');
  if (!CATEGORIES.has(a.category)) err(A, `invalid category "${a.category}"`);
  if (!(a.minTurn >= 0 && a.maxTurn > a.minTurn && a.maxTurn <= 210)) err(A, `bad turn window ${a.minTurn}..${a.maxTurn}`);
  if (!(a.weight > 0)) err(A, 'weight must be > 0');
  if (!a.beats || !a.beats[a.first]) err(A, `first beat "${a.first}" not found`);
  const beatIds = new Set(Object.keys(a.beats ?? {}));
  for (const [bid, beat] of Object.entries(a.beats ?? {})) {
    if (beat.id !== bid) err(A, `beat "${bid}" has mismatched inner id "${beat.id}"`);
    if (!beat.prompt || beat.prompt.length < 20) err(A, `beat "${bid}" prompt too short/empty`);
    if (!beat.choices?.length || beat.choices.length < 2) err(A, `beat "${bid}" needs ≥2 choices`);
    const cids = new Set<string>();
    for (const ch of beat.choices ?? []) {
      if (!ch.id || !ch.label || !ch.desc || !ch.outcome) err(A, `beat "${bid}" choice "${ch.id ?? '?'}" missing id/label/desc/outcome`);
      if (cids.has(ch.id)) err(A, `beat "${bid}" duplicate choice id "${ch.id}"`);
      cids.add(ch.id);
      if (ch.outcome && ch.outcome.length < 15) err(A, `beat "${bid}" choice "${ch.id}" outcome too short`);
      if (ch.next && !beatIds.has(ch.next)) err(A, `beat "${bid}" choice "${ch.id}" → "${ch.next}" is a dangling reference`);
      const e = ch.effect;
      if (e) for (const k of Object.keys(e)) if (!EFFECT_KEYS.has(k)) err(A, `beat "${bid}" choice "${ch.id}" unknown effect key "${k}" (a stat like stamina/flair belongs inside attr:{}, a relationship inside meters:{})`);
      if (e?.attr) for (const t of Object.keys(e.attr)) if (!TAGS.has(t)) err(A, `beat "${bid}" choice "${ch.id}" invalid attr tag "${t}" (valid: ${[...TAGS].join('/')})`);
      if (e?.meters) for (const m of Object.keys(e.meters)) if (!METERS.has(m)) err(A, `beat "${bid}" choice "${ch.id}" invalid meter "${m}" (valid: ${[...METERS].join('/')})`);
      if (e?.form != null && Math.abs(e.form) > 0.2) err(A, `beat "${bid}" choice "${ch.id}" form ${e.form} out of sane range (±0.2)`);
    }
    // every non-first beat must be reachable from some choice.next
    if (bid !== a.first) { const reachable = Object.values(a.beats).some((b) => b.choices.some((c) => c.next === bid)); if (!reachable) err(A, `beat "${bid}" is unreachable (no choice points to it)`); }
  }
}

console.log(`=== Story-arc validator — ${ARCS.length} arcs, ${[...ids].length} unique ids ===`);
const byCat: Record<string, number> = {};
for (const a of ARCS) byCat[a.category] = (byCat[a.category] ?? 0) + 1;
console.log('  by category: ' + Object.entries(byCat).map(([c, n]) => `${c} ${n}`).join(' · '));

// ── AGE-APPROPRIATENESS GUARD ─────────────────────────────────────────────────────────────────────
// The career is 120 turns: Grassroots 0-11 (age 10-12), Academy 12-27 (13-14), Scholar 28-45 (15-16).
// An arc that can start before turn 46 is shown to a CHILD, so adult material must not be reachable there.
// This exists because a full romance arc with an adult ("Ask her out") and a MARRIAGE PROPOSAL were both
// firing on a 15-year-old — the gates were wrong in the original 202-turn library and the rescale carried
// them over faithfully. A regression here is a content-safety issue, not a polish one.
const CHILD_TURN_LIMIT = 46;
// Deliberately targets the PLAYER'S OWN adult life, not any mention of an adult world. A kid attending a
// relative's wedding, or a lift-share that "ends like a marriage", is fine — him having a girlfriend,
// proposing, moving in with a partner, or being in a casino is not.
const ADULT_WORDS = /\b(his girlfriend|ask(?:s)? her out|asked her out|propose(?:d)? to her|his fianc|moved in together|moving in together|his partner|nightclub|casino|gambling|gambler|mortgage|dating her)\b/i;
// Tiered by what the material actually requires, since "adult" isn't one age. Turn 46 = 17 (driving age),
// 56 = 18 (drinking/gambling), 86 = 21 (raising a child). Each pattern is deliberately narrow — the false
// positives that had to be excluded are noted, because a guard that cries wolf gets switched off:
//   case-sensitive `He drives`  — so "It drives him hard" passes
//   `(?! off\b)`                — so "before he drives off" (a lift home) passes
//   `(?<!who )`                 — so "the coach who drove him to every trial" passes
// and it deliberately does NOT match "a session", "champagne", "his child" or "his son", which is what keeps
// the whole 211-arc youth library, tri-promotion and rel-estranged-parent clean.
const AGE_RULES: Array<{ what: string; limit: number; re: RegExp; iconOnly?: boolean }> = [
  { what: 'driving',      limit: 46,  re: /(?<!who )\bHe drives(?! off\b)|\bhis own car\b|\bbehind the wheel\b|\bdriving licence\b/ },
  { what: 'alcohol',      limit: 56,  re: /\bover a pint\b|\bdrinking spiral\b|\bhis drinking\b|\bpints\b/i },
  // The body-text patterns above are deliberately narrow to avoid false positives ("a gamble" on a risky
  // pass, "barely", "pub team"), but that narrowness let three genuinely 18+ arcs — two drinking, one
  // betting sponsorship — sit at age 17 after a windows rescale. An arc's ICON is a far stronger signal
  // than its prose: nobody labels a football moment 🍺 or 🎰 by accident. Checked on icon + title only.
  { what: 'drink/gambling icon', limit: 56, re: /🍺|🍸|🍷|🥂|🎰|🎲/, iconOnly: true },
  { what: 'gambling',     limit: 56,  re: /\bmatch-fixing\b|\bfix a match\b|\bplace(?:d|s)? a bet\b|\bhis betting\b|\bgambling debt/i },
  { what: 'guardianship', limit: 86,  re: /\bgodson\b|\bgodchild\b|\bbecoming a father\b|\bhis newborn\b/i },
];
let ageFails = 0;
for (const a of ARCS) {
  const body = JSON.stringify(a.beats);
  if (a.minTurn < CHILD_TURN_LIMIT) {
    const hit = body.match(ADULT_WORDS);
    if (hit) { console.log(`  FAIL [${a.id}] minTurn ${a.minTurn} reaches a child (< ${CHILD_TURN_LIMIT}) but contains adult material: "${hit[0]}"`); ageFails++; }
  }
  for (const rule of AGE_RULES) {
    if (a.minTurn >= rule.limit) continue;
    // icon rules read the arc's label, not its prose — that is the whole point of them
    const hit = (rule.iconOnly ? `${a.icon ?? ''} ${a.title ?? ''}` : body).match(rule.re);
    if (hit) { console.log(`  FAIL [${a.id}] minTurn ${a.minTurn} is below the ${rule.what} limit (${rule.limit}) but contains: "${hit[0]}"`); ageFails++; }
  }
}
// The guard above only ever checked ARCS — and a live playtest then found "Driving Lessons" on sale to a
// 15-year-old on the summer spend screen. Lifestyle items are age-gated by chapter INDEX, not turn, and were
// a whole category nothing validated. (PT-1405)
const CH = ['Grassroots(10-12)', 'Academy(13-14)', 'Scholar(15-16)', 'Youth Team(17-18)', 'Breakthrough(19-20)', 'First Team(21-22)', 'Establishing(23-25)'];
const ITEM_RULES: Array<{ what: string; minIdx: number; re: RegExp }> = [
  { what: 'driving (17+)',   minIdx: 3, re: /driving|the open road|behind the wheel|first car/i },
  { what: 'drinking (18+)',  minIdx: 4, re: /\bbar\b|champagne|vodka|nightclub/i },
  { what: 'gambling (18+)',  minIdx: 4, re: /casino|betting|a flutter/i },
  { what: 'property (18+)',  minIdx: 4, re: /mortgage|his own place|buy(?:s)? a house/i },
];
for (const it of LIFESTYLE) {
  for (const rule of ITEM_RULES) {
    if (it.minChapterIdx >= rule.minIdx) continue;
    if (rule.re.test(`${it.name} ${it.blurb}`)) {
      console.log(`  FAIL [lifestyle:${it.id}] on sale from ${CH[it.minChapterIdx]} but is ${rule.what}: "${it.name}"`);
      ageFails++;
    }
  }
}
if (ageFails) { console.log(`\n✗ ${ageFails} arc(s) expose adult material to a child`); process.exitCode = 1; }
else console.log('  ok   no adult material reachable before age 17');

// The summary MUST account for age failures too. It used to report only `errors`, so an age violation
// printed "✗ 1 arc(s) expose adult material to a child" and then "✓ all 414 arcs valid" directly beneath
// it — anything reading the last line (a person skimming, or a probe tailing the output) saw a pass.
const total = errors + ageFails;
console.log(total ? `\n✗ ${total} arc validation error(s) — ${errors} structural, ${ageFails} age-gating` : `\n✓ all ${ARCS.length} arcs valid`);
if (total) process.exit(1);
