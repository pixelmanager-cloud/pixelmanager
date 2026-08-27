// QA fuzz harness — MANAGER/CLUB, INTERNATIONAL and OFF-PITCH loops.
// Fuzzes shared/src/clubseason.ts (league table, fixtures, live table), shared/src/intl.ts
// (continental cup ties, national call-ups, worldCup()/playerPath()) and shared/src/offpitch.ts
// (computeOffPitch) across many seeds. Asserts: no NaN/Infinity, tables sum correctly, no
// duplicate/lost teams in brackets, winners come from prior-round winners, determinism, bounds.
// New file — does not modify shared/src. Run: `npx tsx shared/qa_meta_loops_fuzz.ts`.

import {
  seededLeague, seededOpponents, seasonFixtures, seasonTable, clubSeason, liveTable,
  firstTeamReady, squadRole, FIXTURES_PER_SEASON, type LeagueClub, type TableRow, type PlayedResult,
} from './src/clubseason.js';
import {
  tieScore, contOpponent, nationalFixture, worldCup, playerPath, homeNation, NATIONS,
} from './src/intl.js';
import { computeOffPitch } from './src/offpitch.js';

const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// ── CLUB SEASON ──────────────────────────────────────────────────────────────
console.log('\n[qa-meta] clubseason fuzz...');
{
  const N = 3000;
  let checked = 0;
  for (let i = 0; i < N; i++) {
    const seed = (i * 2654435761) >>> 0;
    const myClub = ['Marlow', 'Marlow Athletic', 'Riverside Rovers', 'X', ''][i % 5] || 'Marlow';
    const myStrength = [1, 3, 8, 12, 16, 20, 25, -3][i % 8]; // include out-of-normal-range values
    const ctx = `seed=${seed} myClub="${myClub}" myStrength=${myStrength} i=${i}`;
    try {
      const clubs = seededLeague(myClub, myStrength, seed);
      if (clubs.length !== 10) log(`seededLeague: expected 10 clubs, got ${clubs.length}  ${ctx}`);
      const names = new Set(clubs.map((c) => c.name));
      if (names.size !== clubs.length) log(`seededLeague: duplicate club names ${JSON.stringify(clubs.map((c) => c.name))}  ${ctx}`);
      if (clubs.filter((c) => c.mine).length !== 1) log(`seededLeague: expected exactly 1 "mine" club, got ${clubs.filter((c) => c.mine).length}  ${ctx}`);
      for (const c of clubs) if (!finite(c.strength)) log(`seededLeague: non-finite strength for ${c.name}  ${ctx}`);

      const fixtures = seasonFixtures(myClub, seed);
      if (fixtures.length !== FIXTURES_PER_SEASON) log(`seasonFixtures: expected ${FIXTURES_PER_SEASON} fixtures, got ${fixtures.length}  ${ctx}`);
      // Marlow should face each of the 9 opponents exactly twice (once H, once A) over 18 fixtures
      const oppCounts: Record<string, { H: number; A: number }> = {};
      for (const f of fixtures) { (oppCounts[f.oppName] ??= { H: 0, A: 0 })[f.venue]++; }
      const oppNames = Object.keys(oppCounts);
      if (oppNames.length !== 9) log(`seasonFixtures: expected 9 distinct opponents, got ${oppNames.length}: ${oppNames.join(',')}  ${ctx}`);
      for (const [n, c] of Object.entries(oppCounts)) if (c.H !== 1 || c.A !== 1) log(`seasonFixtures: opponent ${n} played H=${c.H} A=${c.A} (want 1/1)  ${ctx}`);

      const table = seasonTable(clubs, seed);
      checked++;
      // table sums: total points/games conservation
      const totalP = table.reduce((s, r) => s + r.P, 0);
      const expectedP = 2 * clubs.length * (clubs.length - 1); // each club plays every other twice (home+away); P counted once per row per game
      if (totalP !== expectedP) log(`seasonTable: total games played ${totalP} != expected ${expectedP}  ${ctx}`);
      const totalGF = table.reduce((s, r) => s + r.GF, 0), totalGA = table.reduce((s, r) => s + r.GA, 0);
      if (totalGF !== totalGA) log(`seasonTable: total GF(${totalGF}) != total GA(${totalGA}) — goals don't balance  ${ctx}`);
      for (const r of table) {
        if (r.W + r.D + r.L !== r.P) log(`seasonTable: W+D+L != P for ${r.name}: ${JSON.stringify(r)}  ${ctx}`);
        if (r.Pts !== r.W * 3 + r.D) log(`seasonTable: Pts mismatch for ${r.name}: ${JSON.stringify(r)}  ${ctx}`);
        if (r.GD !== r.GF - r.GA) log(`seasonTable: GD mismatch for ${r.name}: ${JSON.stringify(r)}  ${ctx}`);
        for (const k of ['P', 'W', 'D', 'L', 'GF', 'GA', 'Pts'] as const) if (!finite(r[k]) || r[k] < 0) log(`seasonTable: ${r.name}.${k}=${r[k]} invalid  ${ctx}`);
      }
      // sort order: non-increasing Pts
      for (let k = 1; k < table.length; k++) if (table[k].Pts > table[k - 1].Pts) log(`seasonTable: sort order broken at index ${k}  ${ctx}`);

      const cs = clubSeason(myClub, Math.max(1, myStrength), Math.min(1, Math.max(0, i / N)), seed);
      if (cs.pos < 1 || cs.pos > cs.size) log(`clubSeason: pos=${cs.pos} out of [1,${cs.size}]  ${ctx}`);

      // live table incrementally vs full season table when fully played should match final standings
      const played: PlayedResult[] = fixtures.map((f, r) => ({ myGoals: r % 3, oppGoals: (r + 1) % 3 })); // arbitrary but deterministic
      const lv = liveTable(myClub, 12, 0.5, seed, played);
      if (lv.pos < 1 || lv.pos > lv.size) log(`liveTable: pos=${lv.pos} out of [1,${lv.size}]  ${ctx}`);
      if (lv.matchday !== played.length) log(`liveTable: matchday=${lv.matchday} != played.length=${played.length}  ${ctx}`);
      for (const r of lv.table) if (r.W + r.D + r.L !== r.P) log(`liveTable: W+D+L != P for ${r.name}  ${ctx}`);
    } catch (err) {
      log(`EXCEPTION: ${(err as Error).stack ?? err}  ${ctx}`);
    }
  }
  console.log(`[qa-meta] clubseason: ${checked}/${N} checked`);

  // squadRole / firstTeamReady bounds across the full stat space
  for (let band = 0; band <= 8; band++) {
    for (let ovr = 0; ovr <= 25; ovr++) {
      const sr = squadRole(band, ovr);
      if (!finite(sr.share) || sr.share < 0 || sr.share > 1) log(`squadRole share out of [0,1]: band=${band} ovr=${ovr} -> ${sr.share}`);
      if (!finite(sr.apps) || sr.apps < 0 || sr.apps > FIXTURES_PER_SEASON) log(`squadRole apps out of [0,${FIXTURES_PER_SEASON}]: band=${band} ovr=${ovr} -> ${sr.apps}`);
      const ftr = firstTeamReady(band, ovr, 0);
      if (typeof ftr !== 'boolean') log(`firstTeamReady non-boolean: band=${band} ovr=${ovr}`);
    }
  }

  // determinism: identical inputs must be byte-identical
  const a = JSON.stringify(clubSeason('Marlow', 14, 0.6, 12345));
  const b = JSON.stringify(clubSeason('Marlow', 14, 0.6, 12345));
  if (a !== b) log('DETERMINISM BREAK: clubSeason(same args) produced different output across two calls');
}

// ── INTERNATIONAL: continental cup + call-ups ────────────────────────────────
console.log('\n[qa-meta] intl (continental + call-ups) fuzz...');
{
  const N = 2000;
  for (let i = 0; i < N; i++) {
    const seed = (i * 40503) >>> 0;
    const season = i % 40;
    const ctx = `seed=${seed} season=${season} i=${i}`;
    for (const r of [0, 1, 2] as const) {
      try {
        const tie = contOpponent(seed, season, r);
        if (!finite(tie.oppStrength) || tie.oppStrength < 1 || tie.oppStrength > 20) log(`contOpponent: oppStrength=${tie.oppStrength} out of [1,20] round=${r}  ${ctx}`);
        if (!tie.oppName) log(`contOpponent: empty oppName round=${r}  ${ctx}`);
        if (r === 2 && !tie.neutral) log(`contOpponent: final (round 2) should be neutral  ${ctx}`);
      } catch (err) { log(`EXCEPTION contOpponent: ${(err as Error).stack ?? err} round=${r}  ${ctx}`); }
    }
    try {
      const nation = homeNation(`Surname${i}`);
      if (!NATIONS.includes(nation)) log(`homeNation returned unknown nation "${nation}"  ${ctx}`);
      const overall = 4 + (i % 20);
      const cu = nationalFixture(seed, 1 + (i % 50), nation, overall);
      if (!NATIONS.includes(cu.oppNation)) log(`nationalFixture: unknown oppNation "${cu.oppNation}"  ${ctx}`);
      if (cu.oppNation === nation) log(`nationalFixture: opponent equals own nation  ${ctx}`);
      if (!['H', 'A', 'N'].includes(cu.venue)) log(`nationalFixture: bad venue "${cu.venue}"  ${ctx}`);
      if (!finite(cu.forGoals) || !finite(cu.ourGoals) || cu.forGoals < 0 || cu.ourGoals < 0) log(`nationalFixture: bad goals ${JSON.stringify(cu)}  ${ctx}`);
      if (!finite(cu.scored) || cu.scored < 0) log(`nationalFixture: bad scored=${cu.scored}  ${ctx}`);
    } catch (err) { log(`EXCEPTION nationalFixture: ${(err as Error).stack ?? err}  ${ctx}`); }
  }

  // tieScore bounds across extreme strength gaps
  for (let a = -10; a <= 30; a += 5) for (let b = -10; b <= 30; b += 5) {
    const [gh, ga] = tieScore(a, b, (a * 97 + b * 131) >>> 0);
    if (!finite(gh) || !finite(ga) || gh < 0 || ga < 0 || gh > 6 || ga > 6) log(`tieScore out of [0,6]: a=${a} b=${b} -> [${gh},${ga}]`);
  }
}

// ── WORLD CUP ────────────────────────────────────────────────────────────────
console.log('\n[qa-meta] worldCup + playerPath fuzz...');
{
  const N = 2000;
  let checked = 0;
  for (let i = 0; i < N; i++) {
    const seed = (i * 6700417) >>> 0;
    const edition = i % 12;
    const myNation = NATIONS[i % NATIONS.length];
    const myStrength = [1, 5, 10, 14, 20, 25][i % 6];
    const ctx = `seed=${seed} edition=${edition} myNation=${myNation} myStrength=${myStrength} i=${i}`;
    try {
      const wc = worldCup(seed, edition, myNation, myStrength);
      checked++;
      // field: exactly 16 unique nations, includes myNation
      if (wc.field.length !== 16) log(`worldCup: field size ${wc.field.length} != 16  ${ctx}`);
      if (new Set(wc.field).size !== wc.field.length) log(`worldCup: duplicate nations in field: ${wc.field.join(',')}  ${ctx}`);
      if (!wc.field.includes(myNation)) log(`worldCup: myNation not in field  ${ctx}`);
      // groups: 4 groups of 4, covering the field exactly once
      const groupNations = wc.groups.flatMap((g) => g.rows.map((r) => r.nation));
      if (groupNations.length !== 16) log(`worldCup: groups cover ${groupNations.length} nations, want 16  ${ctx}`);
      if (new Set(groupNations).size !== 16) log(`worldCup: groups have duplicate/lost nations  ${ctx}`);
      for (const g of wc.groups) {
        if (g.rows.length !== 4) log(`worldCup: group size ${g.rows.length} != 4  ${ctx}`);
        const totalP = g.rows.reduce((s, r) => s + r.P, 0);
        if (totalP !== 4 * 3) log(`worldCup: group total games ${totalP} != 12  ${ctx}`); // round robin of 4 = 6 matches * 2 rows each
        const gf = g.rows.reduce((s, r) => s + r.GF, 0), ga = g.rows.reduce((s, r) => s + r.GA, 0);
        if (gf !== ga) log(`worldCup: group GF(${gf}) != GA(${ga})  ${ctx}`);
        for (let k = 1; k < g.rows.length; k++) if (g.rows[k].Pts > g.rows[k - 1].Pts) log(`worldCup: group sort order broken  ${ctx}`);
      }
      // quarters: winners must come from the group winners/runners-up that fed them
      const groupWinners = wc.groups.map((g) => g.rows[0].nation);
      const groupRunners = wc.groups.map((g) => g.rows[1].nation);
      for (const q of wc.quarters) {
        if (!groupWinners.includes(q.a) && !groupRunners.includes(q.a)) log(`worldCup: QF participant "${q.a}" is not a group winner/runner-up  ${ctx}`);
        if (!groupWinners.includes(q.b) && !groupRunners.includes(q.b)) log(`worldCup: QF participant "${q.b}" is not a group winner/runner-up  ${ctx}`);
        if (q.winner !== q.a && q.winner !== q.b) log(`worldCup: QF winner "${q.winner}" is neither participant  ${ctx}`);
        if (!finite(q.gh) || !finite(q.ga) || q.gh < 0 || q.ga < 0) log(`worldCup: QF bad score [${q.gh},${q.ga}]  ${ctx}`);
      }
      const qfWinners = wc.quarters.map((q) => q.winner);
      // semis must be built from QF winners (semis[0] from QF0/QF1, semis[1] from QF2/QF3)
      const expectedSemiPairs = [[qfWinners[0], qfWinners[1]], [qfWinners[2], qfWinners[3]]];
      wc.semis.forEach((s, idx) => {
        const [x, y] = expectedSemiPairs[idx];
        if (!((s.a === x && s.b === y) || (s.a === y && s.b === x))) log(`worldCup: SF${idx} participants [${s.a},${s.b}] don't match expected QF winners [${x},${y}]  ${ctx}`);
        if (s.winner !== s.a && s.winner !== s.b) log(`worldCup: SF winner "${s.winner}" is neither participant  ${ctx}`);
      });
      const sfWinners = wc.semis.map((s) => s.winner);
      if (!((wc.final.a === sfWinners[0] && wc.final.b === sfWinners[1]) || (wc.final.a === sfWinners[1] && wc.final.b === sfWinners[0])))
        log(`worldCup: final participants [${wc.final.a},${wc.final.b}] don't match SF winners [${sfWinners.join(',')}]  ${ctx}`);
      if (wc.champion !== wc.final.winner) log(`worldCup: champion "${wc.champion}" != final.winner "${wc.final.winner}"  ${ctx}`);
      if (!wc.final.neutral === undefined) { /* no neutral field on WCTie, skip */ }
      if (!finite(wc.legacyMult) || wc.legacyMult < 1 || wc.legacyMult > 2.01) log(`worldCup: legacyMult=${wc.legacyMult} out of expected [1,2]  ${ctx}`);

      // myFinish consistency with actual bracket participation
      const inQF = wc.quarters.some((q) => q.mine);
      const inSF = wc.semis.some((s) => s.mine);
      const inFinal = wc.final.mine;
      if (wc.champion === myNation && wc.myFinish !== 'Champions') log(`worldCup: won it all but myFinish="${wc.myFinish}"  ${ctx}`);
      if (inFinal && wc.champion !== myNation && wc.myFinish !== 'Runners-up') log(`worldCup: lost final but myFinish="${wc.myFinish}"  ${ctx}`);
      if (inSF && !inFinal && wc.myFinish !== 'Semi-finals') log(`worldCup: lost SF but myFinish="${wc.myFinish}"  ${ctx}`);
      if (inQF && !inSF && wc.myFinish !== 'Quarter-finals') log(`worldCup: lost QF but myFinish="${wc.myFinish}"  ${ctx}`);

      // playerPath internal consistency
      const path = playerPath(wc);
      if (path.qualified) {
        if (!path.qf || !path.sf || !path.final) log(`playerPath: qualified but missing qf/sf/final  ${ctx}`);
        if (path.seededChampion !== wc.champion) log(`playerPath: seededChampion mismatch  ${ctx}`);
      }
    } catch (err) {
      log(`EXCEPTION worldCup/playerPath: ${(err as Error).stack ?? err}  ${ctx}`);
    }
  }
  console.log(`[qa-meta] worldCup: ${checked}/${N} checked`);

  // determinism
  const wcA = JSON.stringify(worldCup(777, 3, 'Astoria', 15));
  const wcB = JSON.stringify(worldCup(777, 3, 'Astoria', 15));
  if (wcA !== wcB) log('DETERMINISM BREAK: worldCup(same args) produced different output across two calls');
}

// ── OFF-PITCH ─────────────────────────────────────────────────────────────────
console.log('\n[qa-meta] computeOffPitch fuzz...');
{
  const N = 4000;
  let checked = 0;
  for (let i = 0; i < N; i++) {
    const seed = (i * 2246822519) >>> 0;
    const careerScore = [-100, 0, 50, 500, 900, 5000, 1e9][i % 7];
    const caps = [0, 1, 5, 50, -1][i % 5];
    const turn = i % 200;
    const bigWins = [0, 1, 10, 100][i % 4];
    const flair = [-5, 0, 10, 20, 1000][i % 5];
    const tags = { teamwork: (i % 20), leadership: (i % 15), composure: (i % 25), aggression: (i % 18), flair: (i % 12) };
    const ctx = `seed=${seed} careerScore=${careerScore} caps=${caps} turn=${turn} bigWins=${bigWins} flair=${flair} i=${i}`;
    try {
      const op = computeOffPitch({ careerScore, caps, seed, turn, tags, bigWins, flair });
      checked++;
      if (!finite(op.image.score) || op.image.score < 0 || op.image.score > 100) log(`computeOffPitch: image.score=${op.image.score} out of [0,100]  ${ctx}`);
      if (!finite(op.reputation.score)) log(`computeOffPitch: reputation.score non-finite  ${ctx}`);
      if (!['clean', 'edgy'].includes(op.reputation.edge)) log(`computeOffPitch: bad reputation.edge "${op.reputation.edge}"  ${ctx}`);
      if (!Array.isArray(op.endorsements) || op.endorsements.length > 3) log(`computeOffPitch: endorsements length ${op.endorsements.length} out of [0,3]  ${ctx}`);
      for (const e of op.endorsements) {
        if (!finite(e.payout) || e.payout < 0) log(`computeOffPitch: endorsement payout=${e.payout} invalid  ${ctx}`);
        if (!['Local', 'National', 'Global'].includes(e.tier)) log(`computeOffPitch: bad endorsement tier "${e.tier}"  ${ctx}`);
      }
      if (!Array.isArray(op.boots.owned)) log(`computeOffPitch: boots.owned not an array  ${ctx}`);
      if (op.boots.next) {
        if (!finite(op.boots.next.progress) || !finite(op.boots.next.target)) log(`computeOffPitch: boots.next progress/target non-finite  ${ctx}`);
        if (op.boots.next.progress > op.boots.next.target) log(`computeOffPitch: boots.next progress(${op.boots.next.progress}) > target(${op.boots.next.target})  ${ctx}`);
      }
    } catch (err) {
      log(`EXCEPTION computeOffPitch: ${(err as Error).stack ?? err}  ${ctx}`);
    }
  }
  console.log(`[qa-meta] computeOffPitch: ${checked}/${N} checked`);

  // determinism
  const input = { careerScore: 620, caps: 8, seed: 4242, turn: 12, tags: { teamwork: 10, leadership: 5 }, bigWins: 2, flair: 6 };
  const opA = JSON.stringify(computeOffPitch(input));
  const opB = JSON.stringify(computeOffPitch(input));
  if (opA !== opB) log('DETERMINISM BREAK: computeOffPitch(same args) produced different output across two calls');
}

if (failures.length) {
  console.error(`\n[qa-meta] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-meta] clean — no invariant violations found.');
