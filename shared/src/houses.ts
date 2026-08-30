// ── THE RIVAL HOUSES — the other families in the game ───────────────────────────────────────────────
//
// A dynasty needs somebody to be a dynasty AGAINST. Renown on its own is a number that goes up; renown
// with eleven other families climbing the same ladder is a standing, and a standing is the thing you play
// for across generations the way a league table is the thing you play for across a season.
//
// The houses are DERIVED, not stored. Given the save's seed and a generation number this file returns the
// same men every time, so nothing has to be persisted, migrated, or kept in sync — and a save opened five
// generations later reconstructs the whole history of every rival exactly. They are scored through
// `houseRenown`, the identical function the player's own family is scored through, because a table where
// the rivals are graded on a different curve is a table that means nothing.
//
// Each house has a CHARACTER, not just a strength. Some are old names in decline, some are new money on
// the way up, some produce one extraordinary man a century and nothing in between. That variety is what
// makes the table read as a world rather than as difficulty settings.
import { houseRenown, type HouseMember, type HouseStanding } from './renown.js';
import { mintSquadPlayer } from './teams.js';
import type { Player, Role } from './types.js';

function hash32(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 0x2545f491); return (h ^ (h >>> 13)) >>> 0;
}
const frac = (h: number) => h / 4294967296;

/** How a house behaves ACROSS generations — the shape of its history, not its current strength. */
export type HouseArc =
  | 'ancient'    // old money, long since peaked; great early, fading now
  | 'rising'     // new money, getting stronger every generation
  | 'steady'     // reliably good, never spectacular
  | 'volatile'   // a genius one generation, nobody the next
  | 'fallen';    // was enormous, collapsed, occasionally threatens a revival

export interface RivalHouse { name: string; arc: HouseArc; base: number; blurb: string }

/** Twelve families. Names are distinct in shape as well as spelling — on a table read at a glance, four
 *  two-syllable Latinate surnames blur into one another. */
export const RIVAL_HOUSES: RivalHouse[] = [
  { name: 'Vasquez',   arc: 'ancient',  base: 15, blurb: 'Four generations of centre-halves. They were winning things before anyone was watching.' },
  { name: 'Okonkwo',   arc: 'rising',   base: 14, blurb: 'Nobody had heard of them two generations ago. Everybody has now.' },
  { name: 'Lindqvist', arc: 'steady',   base: 15, blurb: 'Never a superstar, never a failure. Six straight generations in the top flight.' },
  { name: 'Brandão',   arc: 'volatile', base: 14, blurb: 'They produce a genius or they produce nothing. There is no middle.' },
  { name: 'Halloran',  arc: 'fallen',   base: 14, blurb: 'They owned this game once. The grandsons are trying to get it back.' },
  { name: 'Yamashita', arc: 'rising',   base: 14, blurb: 'Technical, relentless, and getting better with every boy they send out.' },
  { name: 'Grieve',    arc: 'steady',   base: 14, blurb: 'Hard, honest professionals, every one of them. You will not enjoy playing against them.' },
  { name: 'Abadi',     arc: 'ancient',  base: 15, blurb: 'The oldest name on the list, and they will tell you so.' },
  { name: 'Novakovic', arc: 'volatile', base: 14, blurb: 'A family of extremes. One of them was the best in the world for four years.' },
  { name: 'Sowande',   arc: 'rising',   base: 14, blurb: 'Three brothers, all professionals, and the youngest is the best of them.' },
  { name: 'Kestrelli', arc: 'fallen',   base: 15, blurb: 'A great name that spent a generation in the lower leagues and has not forgotten it.' },
  { name: 'Traoré',    arc: 'steady',   base: 15, blurb: 'Quietly, consistently, the family everyone else measures themselves against.' },
];

/** The ability band a house's man of a given generation is built around. This is where the ARC lives:
 *  the same base produces a very different life depending on whether the family is climbing or falling. */
export function houseQualityAt(h: RivalHouse, generation: number, seed: number): number {
  const g = Math.max(0, generation);
  const jitter = (frac(hash32(seed, generation * 7919, h.name.length * 131)) - 0.5) * 2; // ±1, generation to generation
  // A per-SAVE offset on top, fixed for the whole game. Without it the twelve families were the same
  // twelve families in every save — measured, an ordinary dynasty finished exactly 7th on all five test
  // seeds — and the table read as a fixed difficulty curve rather than as the world this particular
  // dynasty happened to be born into. The Vasquez dominate one save and are ordinary in the next.
  // The swing is wide (±4) and the bases are deliberately close, so it is the ERA that decides who leads
  // rather than a hard-coded pecking order — at ±2.5 the same two families topped every seed tested.
  const era = (frac(hash32(seed, h.name.charCodeAt(0) * 7717 + h.name.length, 0x51ed)) - 0.5) * 8;   // ±4, constant per save
  let q = h.base;   // `era` is applied at the RETURN — every arc below reassigns q from base
  switch (h.arc) {
    case 'ancient': q = h.base + 2 - g * 0.55; break;                       // peaked before you arrived
    case 'rising':  q = h.base - 1.5 + g * 0.6; break;                      // catching you up
    case 'steady':  q = h.base; break;
    // A different draw per generation rather than a trend: the point of this family is that you cannot
    // predict them, so the swing has to be wide enough to actually surprise.
    case 'volatile': q = h.base - 3 + frac(hash32(seed, g * 104729, 7)) * 8; break;
    // A deep trough that climbs back out — great, then gone, then slowly returning.
    case 'fallen':  q = h.base + 3 - Math.max(0, 5 - g * 0.9) - Math.max(0, (3 - g)) * 1.5; break;
  }
  return Math.max(6, Math.min(20, q + jitter + era));
}

/** One rival's man of one generation, on the same terms the player's own family is scored on. */
export function houseManAt(h: RivalHouse, generation: number, seed: number): HouseMember {
  const q = houseQualityAt(h, generation, seed);
  const peak = Math.round(q);
  const r = frac(hash32(seed, generation * 40503, h.name.charCodeAt(0)));
  // Silverware tracks ability sharply — a 12 wins nothing, a 19 wins repeatedly — so the table rewards
  // the families that actually produced greats rather than the ones that merely lasted.
  const titles = peak >= 18 ? 2 + Math.floor(r * 3) : peak >= 15 ? 1 + Math.floor(r * 2) : peak >= 13 ? Math.floor(r * 2) : 0;
  const caps = peak >= 16 ? 30 + Math.round(r * 60) : peak >= 13 ? Math.round(r * 25) : 0;
  return {
    name: `${['Luca', 'Andre', 'Milo', 'Rafa', 'Jonas', 'Tomas', 'Elias', 'Kaito'][hash32(seed, generation, h.base) % 8]} ${h.name}`,
    generation, played: true, peakOverall: peak, caps,
    leagueTitles: titles, cups: Math.floor(titles * 1.5),
    seasons: peak >= 14 ? 12 : peak >= 10 ? 9 : 6,
    bigNights: Math.round(peak / 2),
  };
}

export interface HouseRow extends HouseStanding { house: RivalHouse; latest: HouseMember }

/** Every rival house's standing after `generations` generations, best first. */
export function rivalStandings(seed: number, generations: number): HouseRow[] {
  const rows = RIVAL_HOUSES.map((house) => {
    const men: HouseMember[] = [];
    for (let g = 0; g <= generations; g++) men.push(houseManAt(house, g, seed));
    return { house, latest: men[men.length - 1], ...houseRenown(men) };
  });
  return rows.sort((a, b) => b.renown - a.renown);
}

/** A rival house's current man as an actual, signable, playable footballer.
 *
 *  This is what stops the table being a spreadsheet: the name you are chasing turns up in an opponent's
 *  XI and in your own transfer market, and you can sign him. He is minted through the same path every
 *  rich squad player takes, then RENAMED to carry his family's surname — that surname is the whole point
 *  of him, and it is how the player recognises a rival's boy on a team sheet. */
export function houseManAsPlayer(h: RivalHouse, generation: number, seed: number, id: string, role: Role, age = 24): Player {
  const q = houseQualityAt(h, generation, seed);
  const p = mintSquadPlayer(id, role, q, hash32(seed, generation * 2654435761, h.name.length), age);
  return { ...p, name: houseManAt(h, generation, seed).name };
}

// ── THE RIVAL FAMILIES, ON THE PITCH ───────────────────────────────────────────────────────────────
import { transferFee, type Listing } from './transfermarket.js';
import { overall } from './teams.js';

/** A famous surname costs more than the same player without one. This is the first place renown bites in
 *  a direction the player FEELS rather than reads: you are not buying a centre-half, you are buying a
 *  Vasquez, and the Vasquez know it. */
export const HOUSE_FEE_PREMIUM = 1.35;

const ROLES: Role[] = ['GK', 'DF', 'MF', 'FW'];

/** Rival-house sons on the market this season.
 *
 *  Deliberately RARE — at most one most seasons, occasionally two, often none. The table in the Trophy
 *  Room is only interesting if the names on it are hard to get; a market that offers a rival's boy every
 *  season turns the twelve great families into a supplier. He also has to be roughly at your level, or
 *  the offer is either an insult or an impossibility. */
export function houseListings(seed: number, season: number, tier: number, generation: number, quality: number): Listing[] {
  const out: Listing[] = [];
  for (let i = 0; i < RIVAL_HOUSES.length; i++) {
    const h = RIVAL_HOUSES[i];
    const roll = frac(hash32(seed, season * 6151, i * 977));
    if (roll > 0.03) continue;                                   // ~1 house in 33 offers a son in a season
    const q = houseQualityAt(h, generation, seed);
    // Out of your world, either way. This gate does more than filter: because it compares the family's man
    // to YOUR DIVISION's standard, access to the great houses scales with the pyramid — at the bottom
    // essentially none of them will sign for you, and at the top most of them will. Climbing is what opens
    // the door to the names you are chasing on the table, which is the right thing for climbing to do.
    if (Math.abs(q - quality) > 3.5) continue;
    const role = ROLES[hash32(seed, season, i * 31) % ROLES.length];
    const age = 21 + (hash32(seed, season * 13, i) % 8);
    const p = houseManAsPlayer(h, generation, seed, `hs:${season}:${h.name}`, role, age);
    const ov = overall(p);
    out.push({ player: p, fee: Math.round(transferFee(ov) * HOUSE_FEE_PREMIUM), age, ov });
  }
  return out.slice(0, 2);
}

/** Is this player a rival house's son? Read off the surname, so it survives the round-trip into the squad
 *  and back without needing a flag on Player that every other system would have to carry. */
export function houseOf(name: string): RivalHouse | null {
  const surname = (name || '').trim().split(/\s+/).slice(-1)[0];
  return RIVAL_HOUSES.find((h) => h.name === surname) ?? null;
}
