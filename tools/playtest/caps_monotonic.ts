// A CAREER RECORD THAT COUNTS BACKWARDS.
//
// The INTERNATIONAL panel is a HUD redrawn every turn, and its cap total was re-derived from scratch each
// time: `Math.round((turn - 60) * rate(prof.currentOverall))`. `currentOverall` is `deriveStats` over the
// WHOLE log — shape through `norm`, magnitude through `avgSuccess` — and it is not monotonic, so a single
// flat fortnight could drop him a point, across a rate threshold, and re-price every cap he had already
// won: 0.25/0.4 = 0.625 of them, gone. Across the 80 careers driven below the displayed number fell 89
// times in 37 of them, by as much as 8 caps in one turn, and when it reached 0 `capped` went false and
// intlHtml printed "Uncapped — keep impressing at this level to earn a national call-up" on the screen
// that had said "Called up for his country — 6 caps" the turn before. `caps` also feeds computeOffPitch,
// where it sets the PUBLIC IMAGE bar and gates the `cap-pride` and `road-warrior` signature boots, so the
// same fall un-earned boots the player had already collected.
//
// So this walks the production path — drive a career, ask `careerState` for the panel on every senior
// turn, and read `international` exactly as the client does. It never recomputes the ladder itself, so it
// cannot be satisfied by a fix that only makes the probe's own arithmetic monotone.
//
// THE FROZEN RECORD IS DELIBERATELY NOT ASSERTED HERE. `careerHonours` runs a second copy of this ladder
// at graduation, on the GRADUATED overall — traits, the focus award and any inherited legacy bonus, none
// of which the live panel can see — and the two already disagreed, badly, before this: committed career
// seed 12 in golden-careers.json freezes 24 caps against a panel that never showed more than 15, and for
// an HEIR carrying a legacy bonus (every generation after the first) they disagreed in 65 of these 80
// careers on the tree BEFORE this change, against 67 after. Closing that gap means regenerating the golden
// fixture — 4 of the 11 committed careers move, and seed 5 loses his caps and his nation outright — which
// is a decision, not a bug fix. The gap is printed as a `..` margin so it stays visible while it is open.
// (W18-14)
//
// Run: `npx tsx tools/playtest/caps_monotonic.ts`
import { Career, rollGenes } from '../../shared/src/career.js';
import { careerState, graduatedFields } from '../../shared/src/tokens.js';
import type { Token } from '../../shared/src/token.js';
import type { Track } from '../../shared/src/types.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const SURNAMES = ['Ashcombe', 'Baldini', 'Corrigan', 'Delacroix', 'Egerton', 'Fenwick', 'Grieve', 'Halvorsen'];
const tokenFor = (seed: number, track: Track): Token => ({
  id: `cm-${seed}-${track}`, name: `Rafa ${SURNAMES[seed % SURNAMES.length]}`, state: 'prospect', generation: 0,
  pedigree: 0, career_seed: seed, track, agent_id: null,
  genes_json: JSON.stringify(rollGenes(seed)), dev_bonus_json: '{}',
} as unknown as Token);

interface Run { falls: { turn: number; from: number; to: number }[]; uncaps: number; rises: number; maxRise: number; peakCaps: number; lastCaps: number; frozenCaps: number; observed: number }

/** Drive one career, reading the panel the client reads on every turn it exists. `policy` varies which
 *  card is taken so the sweep is not one style of play — a fall is policy-dependent, not seed-dependent. */
function run(seed: number, track: Track, policy: number): Run {
  const c: any = new Career(seed, track);
  const token = tokenFor(seed, track);
  const r: Run = { falls: [], uncaps: 0, rises: 0, maxRise: 0, peakCaps: 0, lastCaps: 0, frozenCaps: 0, observed: 0 };
  let prev: { caps: number; capped: boolean } | null = null;
  let step = 0;
  while (!c.finished && step < 800) {
    const raw = c.current() as any;
    // careerState is expensive and the panel only exists from the senior stages on, so only ask from the
    // turn the cap window opens. Asking earlier would only add `international: null` observations.
    if (c.turn >= 60) {
      const intl = (careerState(token, c) as any).international as { capped: boolean; caps: number } | null;
      if (intl) {
        r.observed++;
        if (prev) {
          if (intl.caps < prev.caps) r.falls.push({ turn: c.turn, from: prev.caps, to: intl.caps });
          if (intl.caps > prev.caps) { r.rises++; r.maxRise = Math.max(r.maxRise, intl.caps - prev.caps); }
          if (prev.capped && !intl.capped) r.uncaps++;
        }
        prev = { caps: intl.caps, capped: intl.capped };
        r.peakCaps = Math.max(r.peakCaps, intl.caps);
        r.lastCaps = intl.caps;
      }
    }
    const pick = (xs: any[]): any => xs[(policy === 0 ? 0 : policy === 1 ? xs.length - 1 : step * policy + seed) % xs.length];
    try {
      if (raw.phase === 'arc') c.resolveArc(pick(raw.arc.choices).id);
      else if (raw.phase === 'focus') c.chooseFocus(pick(raw.focus).id);
      else if (raw.phase === 'offer') c.resolveOffer(policy === 0 ? 'develop' : policy === 1 ? 'money' : 'brand');
      else if (raw.phase === 'coach') c.appointCoach(pick(raw.coaches).id);
      else if (raw.phase === 'draft') c.draft(pick(raw.options).id);
      else if (raw.phase === 'lifestyle') c.buyLifestyle(pick(raw.items).id);
      else { if (!c.hand.length) break; c.play(pick(c.hand).id); }
    } catch { break; }
    step++;
  }
  const grad = graduatedFields(token, c) as Record<string, unknown>;
  r.frozenCaps = Number((JSON.parse(String(grad.career_honours_json ?? '{}')) as { caps?: number }).caps ?? 0);
  return r;
}

console.log('=== The international cap count is a record, so it only ever goes up ===');
const TRACKS: Track[] = ['outfield', 'goalkeeper'];
const runs: Array<Run & { label: string }> = [];
for (const track of TRACKS) for (const policy of [0, 1, 2, 3]) for (let seed = 1; seed <= 10; seed++) {
  runs.push({ ...run(seed, track, policy), label: `seed ${seed} ${track} p${policy}` });
}

const observed = runs.reduce((s, r) => s + r.observed, 0);
const everCapped = runs.filter((r) => r.peakCaps > 0).length;
const rises = runs.reduce((s, r) => s + r.rises, 0);
console.log(`  ..   ${runs.length} driven careers · ${observed} panel renders read · ${everCapped} careers were capped at some point`);
console.log(`  ..   the count rose ${rises} time(s), biggest single rise ${Math.max(0, ...runs.map((r) => r.maxRise))} cap(s)`);

// VACUITY GUARDS. "It never fell" is trivially true of a panel that never appears, and of a cap total that
// is 0 in every career. Mutation-test the whole file by forcing the cap rate to 0 in careerState — these
// two lines must go red before the monotonicity check does.
ok(observed >= 1000, `enough panel renders to measure (${observed}) — with none, every check below is vacuous`);
ok(everCapped >= runs.length / 2, `most driven careers actually earn caps (${everCapped}/${runs.length}) — a game with no capped careers cannot regress one`);
ok(rises > 0, `the count still MOVES (${rises} rise(s)) — a constant is monotonic and worthless`);

const fell = runs.filter((r) => r.falls.length);
const totalFalls = fell.reduce((s, r) => s + r.falls.length, 0);
const worst = fell.flatMap((r) => r.falls).sort((a, b) => (b.from - b.to) - (a.from - a.to))[0];
ok(totalFalls === 0, `the displayed cap count never falls (${fell.length}/${runs.length} careers fell, ${totalFalls} fall(s)`
  + (worst ? `, worst turn ${worst.turn}: ${worst.from} -> ${worst.to}` : '') + ')');

const uncapped = runs.reduce((s, r) => s + r.uncaps, 0);
ok(uncapped === 0, `a capped man never reverts to "Uncapped" (${uncapped} reversion(s)) — main.ts's intlHtml swaps the whole panel on \`capped\``);

const disagree = runs.filter((r) => r.lastCaps !== r.frozenCaps);
console.log(`  ..   ${disagree.length}/${runs.length} careers end on a legend card that disagrees with the last panel`
  + (disagree.length ? ` (by up to ${Math.max(...disagree.map((d) => Math.abs(d.lastCaps - d.frozenCaps)))} caps)` : '')
  + " — careerHonours' own ladder, not asserted here (see the header)");

console.log(fails ? `\n✗ ${fails} — the cap total is not a record the player can trust` : '\n✓ the international cap count only ever climbs');
if (fails) process.exitCode = 1;
