// Does the manager narration actually KNOW WHO IT IS TALKING ABOUT? That is the whole design claim —
// selling an eleven-season servant and selling a summer signing must not draw the same line — so it is
// tested rather than asserted.
import { narrateManager, eligible, tierFor } from './src/managerNarrate.js';

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

console.log(fails ? `\n✗ ${fails} manager-narration check(s) failed` : '\n✓ the manager narration knows who it is talking about');
if (fails) process.exit(1);
