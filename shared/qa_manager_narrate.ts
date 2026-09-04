// Does the manager narration actually KNOW WHO IT IS TALKING ABOUT? That is the whole design claim —
// selling an eleven-season servant and selling a summer signing must not draw the same line — so it is
// tested rather than asserted.
import { narrateManager, eligible, tierFor, fillMgr, type MgrEvent, type PersonCtx, type FillVars } from './src/managerNarrate.js';
// THE FIXTURES ARE THE REAL CONTENT, NOT A LIKENESS OF IT. The first draft of this spread hand-wrote what
// it believed the call sites pass — 13 facility names including a 'Car Park', and five invented scouting
// destinations. The game has 12 facilities, none called that, and six destinations with entirely different
// names ('Local Parks', 'Wonderkid Circuit'). A distinctness probe measured against invented strings tells
// you the hash spreads over strings, which was never in doubt; it cannot tell you the shipped feed varies.
import { FACILITY_KEYS, FACILITY_META } from './src/facilities.js';
import { DESTINATIONS } from './src/missions.js';

let fails = 0;
const ok = (n: string, c: boolean, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}${d ? `  (${d})` : ''}`); if (!c) fails++; };

const servant = { name: 'Kofi Moreau', seasonsAtClub: 11, age: 31, morale: 70 };
const newcomer = { name: 'Jonas Alder', seasonsAtClub: 0, age: 24, morale: 65 };
const star = { name: 'Ravi Kestrel', seasonsAtClub: 6, age: 28, morale: 80, isStar: true };
const club = { club: 'Marlow', season: 12, tier: 4, tierName: 'League Two', fromTierName: 'the National League', toTierName: 'League Two' };

console.log('=== 1. context decides the tier ===');
ok('a servant resolves to servant lines', tierFor('transfer_out', servant).includes('transfer_out.servant'));
ok('a newcomer does not', !tierFor('transfer_out', newcomer).includes('transfer_out.servant'));
ok('the bloodline star gets his own tier', tierFor('transfer_out', star).includes('transfer_out.star'));
ok('every tiering still falls back to the general bank', tierFor('transfer_out', newcomer).includes('transfer_out'));

console.log('\n=== 2. different people get different words ===');
{
  const a = narrateManager('transfer_out', { seed: 99, person: servant, club });
  const b = narrateManager('transfer_out', { seed: 99, person: newcomer, club });
  ok('a servant and a newcomer do not read the same', a !== b, `"${String(a).slice(0, 40)}…" vs "${String(b).slice(0, 40)}…"`);
  const servantPool = eligible('transfer_out', servant);
  const newPool = eligible('transfer_out', newcomer);
  ok('the servant pool is strictly larger', servantPool.length > newPool.length, `${servantPool.length} vs ${newPool.length}`);
}

console.log('\n=== 3. deterministic, and never silent ===');
{
  ok('same inputs give the same line', narrateManager('injury', { seed: 7, person: star, club }) === narrateManager('injury', { seed: 7, person: star, club }));
  const EVENTS = ['injury','injury_long','injury_return','transfer_in','transfer_out','released','bid_received','bid_rejected','contract_renewed','contract_expired','promotion','relegation','title','near_miss','retirement','youth_intake','scout_dispatched','scout_found','scout_empty','facility_upgraded','staff_hired'] as const;
  const silent = EVENTS.filter((e) => !narrateManager(e, { seed: 3, person: servant, club, vars: { n: '2 seasons', fee: 420 } }));
  ok('every event narrates', silent.length === 0, silent.length ? `silent: ${silent.join(', ')}` : `${EVENTS.length} events`);
}

console.log('\n=== 4. placeholders resolve ===');
{
  const lines = EVENTS_CHECK();
  const unresolved = lines.filter((l) => /\{(p|club|from|to|n|fee)\}/.test(l));
  ok('no supported placeholder is left unfilled', unresolved.length === 0, unresolved[0] ?? '');
}
function EVENTS_CHECK(): string[] {
  const out: string[] = [];
  for (const e of ['transfer_out','promotion','relegation','contract_renewed','bid_received','youth_intake','scout_dispatched'] as const) {
    for (let s = 0; s < 40; s++) {
      const l = narrateManager(e, { seed: s, person: servant, club, vars: { n: 'two seasons', fee: 420, to: 'the north coast' } });
      if (l) out.push(l);
    }
  }
  return out;
}

// The other half of the design claim, and the half nothing measured: the narration also has to know WHICH
// ONE. The line index keyed on (seed, event, person, season), so a season's facility upgrades — 13
// facilities, 10 levels each — were one sentence printed thirteen times out of a 120-line bank, and the
// same for every specialist hired and every scouting trip. Nothing caught it because every check above
// varies the PERSON, and these are exactly the events that have no person to vary.
console.log('\n=== 5. two firings of one event in one season are not the same sentence ===');
{
  // Averaged over seeds, not asserted on one: the index is a modulo, so it will collide by birthday now and
  // then. The claim is that the spread is near-perfect on average and never collapses to a single line,
  // which is what a player actually sees over a season.
  const SEEDS = Array.from({ length: 200 }, (_, i) => i * 7919 + 1);
  const spread = (label: string, event: MgrEvent, person: PersonCtx | undefined, cases: FillVars[]) => {
    const pool = eligible(event, person, cases[0]).length;
    // Not vacuous: with fewer than three firings, or a bank smaller than the number of firings, "they read
    // differently" would be a claim about nothing.
    ok(`${label}: enough firings, and a bank big enough for them to differ`, cases.length >= 3 && pool >= cases.length, `${cases.length} firings, ${pool} lines`);
    let total = 0, worst = cases.length;
    for (const seed of SEEDS) {
      const seen = new Set<string>();
      for (const vars of cases) seen.add(String(narrateManager(event, { seed, person, club, vars })));
      total += seen.size; worst = Math.min(worst, seen.size);
    }
    const mean = total / SEEDS.length;
    ok(`${label}: a season's firings mostly read differently`, mean >= cases.length * 0.85, `mean ${mean.toFixed(2)} distinct of ${cases.length}`);
    ok(`${label}: never a whole season of one sentence`, worst >= 2, `worst of ${SEEDS.length} seeds gives ${worst}`);
  };
  // The real call sites, read from the modules that define them rather than transcribed: every upgradeable
  // facility (FACILITY_KEYS/FACILITY_META), every scouting destination (DESTINATIONS), and the three
  // hireable specialists — BACKROOM_STAFF lives in client/src/main.ts, which shared/ must not import, so
  // those three names are the one transcription left and they are asserted against main.ts by feed_wired.
  spread('facility_upgraded', 'facility_upgraded', undefined,
    FACILITY_KEYS.map((k, i) => ({ n: (i % 10) + 1, name: FACILITY_META[k].name, fee: 300 + i * 10 })));
  spread('staff_hired', 'staff_hired', undefined,
    ['Fitness Coach', 'Attacking Coach', 'Assistant Manager'].map((name) => ({ name })));
  spread('scout_dispatched', 'scout_dispatched', star, DESTINATIONS.map((d) => ({ to: d.name })));
  spread('scout_empty', 'scout_empty', undefined, DESTINATIONS.map((d) => ({ to: d.name })));
  // Replay safety: the same firing must still draw the same line, and the order a call site built its vars
  // in must not matter — the index reads values, not object identity or key order.
  ok('the same firing still reads the same, whatever order the vars were built in',
    narrateManager('facility_upgraded', { seed: 4, club, vars: { n: 3, name: 'Gym', fee: 400 } })
    === narrateManager('facility_upgraded', { seed: 4, club, vars: { fee: 400, name: 'Gym', n: 3 } }));
}

// The prose is the only channel in the game that prints money, and it was the only one printing it raw:
// the filler stringified {fee} with String(), which has no grouping. A four-figure offer reached the season
// log as '3058c on the table' with the bid banner directly above it reading '3,058c' — the same number,
// twice, spelled two ways. bid_received is where the exposure is (25 of its authored lines carry {fee}, it
// fires about one season in three, and its fees are four figures every time), not facility_upgraded, which
// is the loudest case but only three lines.
console.log('\n=== 6. money in the prose is punctuated like money everywhere else ===');
{
  const FEE = 14000, RAW = String(FEE), GROUPED = '14,000';   // the top rung of COST_TO_REACH, and an ordinary star bid
  const MONEY: MgrEvent[] = ['bid_received', 'transfer_in', 'transfer_out', 'facility_upgraded', 'scout_found'];
  const vars: FillVars = { fee: FEE, n: 4, name: 'Rivermouth Athletic', to: 'the north coast' };
  // EVERY authored line, not a sample: one firing only ever shows one line, so `eligible` is the only way
  // to know that all of them punctuate rather than that the ones this seed drew happened to.
  let authored = 0;
  const unpunctuated: string[] = [];
  for (const e of MONEY) for (const line of eligible(e, star)) {
    if (!line.includes('{fee}')) continue;
    authored++;
    if (!fillMgr(line, { p: star.name, club: club.club, ...vars }).includes(GROUPED)) unpunctuated.push(line);
  }
  // NOT VACUOUS, and this is the check that keeps it that way: if a later edit retires {fee} from these
  // banks the assertion below would pass over an empty list. Mutation-test the pair by deleting the `fee`
  // branch in fillMgr — `authored` stays where it is and the next line goes red.
  ok('the money banks really do carry {fee}', authored >= 30, `${authored} authored lines carry {fee}`);
  ok('every one of them prints the fee grouped', unpunctuated.length === 0,
    unpunctuated.length ? `${unpunctuated.length} raw, e.g. "${unpunctuated[0].slice(0, 52)}…"` : `${authored} lines`);
  // …and through the entry point the feed actually calls, so a filler that stopped being used would show.
  let drew = 0, raw = 0;
  for (const e of MONEY) for (let s = 0; s < 300; s++) {
    const l = narrateManager(e, { seed: s, person: star, club, vars }) ?? '';
    if (l.includes(GROUPED) || l.includes(RAW)) drew++;
    if (l.includes(RAW)) raw++;
  }
  ok('these seeds really do reach the fee lines', drew >= 100, `${drew} of ${MONEY.length * 300} firings printed the fee`);
  ok('no firing prints a bare 14000', raw === 0, `${raw} unpunctuated firings`);
  // Both edges of the rule's SCOPE. {n} rides the same callback carrying a facility level and a player's
  // age — counts, which must not be grouped — and a fee a call site already wrote out in words must reach
  // the sentence unchanged.
  ok('{n} is a count, not money', fillMgr('level {n}', { n: 1000 }) === 'level 1000');
  ok('a fee written in words passes through', fillMgr('{fee} for him', { fee: 'a club record' }) === 'a club record for him');
}

console.log(fails ? `\n✗ ${fails} manager-narration check(s) failed` : '\n✓ the manager narration knows who it is talking about');
if (fails) process.exit(1);
