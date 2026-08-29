// BASE manager-narration bank. Deliberately small: it exists to establish the VOICE and to prove the
// tiering, and is then extended by authoring packs (see managerNarrate.ts).
//
// The tier suffix is what gives these depth. `transfer_out.servant` is a man who has been at the club eight
// seasons or more; `transfer_out.newcomer` barely unpacked. They are different events and must never share
// a line. A key with no suffix is the general fallback.
//
// Placeholders: {p} player, {club} club, {from}/{to} division names, {n} a count, {fee} coins.
import type { Bank } from '../prompts/merge.js';

export const BASE_MGR: Bank = {
  // ── INJURY ────────────────────────────────────────────────────────────────────────────────────
  injury: [
    '{p} goes down awkwardly and does not get up on his own.',
    'The physio is on, and she is not hurrying, which is its own answer.',
    '{p} tries to run it off, stops, and puts his hands on his head.',
    'He walks off under his own steam. That is the only good news in it.',
  ],
  'injury.star': [
    '{p} is helped down the tunnel, and the whole ground knows what it just watched.',
    'Of all the players to lose, and at this point in the season.',
  ],
  'injury.veteran': [
    'At his age these take longer, and everybody in the room knows the arithmetic.',
    '{p} has felt this one before. That is the part that worries him.',
  ],
  'injury.young': [
    'First serious one of his life, and nobody has told him yet how long it feels.',
  ],
  injury_long: [
    'Months, not weeks. {p} will not kick a ball again this season.',
    'The scan comes back worse than the shrug on the pitch suggested.',
  ],
  injury_return: [
    '{p} is back in the squad, and back is not the same as ready.',
    'He trains fully for the first time since it happened. Nobody makes a fuss of it.',
  ],

  // ── TRANSFERS ─────────────────────────────────────────────────────────────────────────────────
  transfer_in: [
    '{p} signs for {club}. The photographs take eleven minutes and mean nothing yet.',
    'A new number on the back of a new shirt, and a dressing room to win over.',
  ],
  'transfer_in.young': [
    '{p} arrives young enough that the club is buying what he might become.',
  ],
  transfer_out: [
    '{p} leaves {club} for {fee}c. Business, mostly.',
    'He clears his peg, shakes a few hands, and is gone before training ends.',
  ],
  'transfer_out.servant': [
    'Eleven seasons, and it ends in a car park with the engine running.',
    '{p} has been here longer than most of the staff. The room is quieter for a week.',
    'Nobody wanted to be the one to say it was time. Somebody had to.',
  ],
  'transfer_out.star': [
    'Selling {p} is not a squad decision. It is the end of a chapter of the club.',
  ],
  'transfer_out.unhappy': [
    'He had wanted to go for a while, and everybody had pretended not to notice.',
    'The handshake is brief. Both sides are relieved and neither will say so.',
  ],
  'transfer_out.newcomer': [
    'He barely unpacked. Some signings never take, and this one did not.',
  ],
  released: [
    '{p} is released. There is no announcement, just a name missing from a list.',
  ],
  'released.servant': [
    'After everything, it is a phone call on a Tuesday. It always is.',
  ],
  bid_received: [
    '{fee}c on the table for {p}, and a decision that will not wait.',
  ],
  'bid_received.star': [
    'They want the bloodline player, and they have put a number on him that makes it a real question.',
  ],
  bid_rejected: [
    'The bid is turned down. {p} finds out the way everyone does, from a screen.',
  ],

  // ── CONTRACTS ─────────────────────────────────────────────────────────────────────────────────
  contract_renewed: [
    '{p} signs on for another {n}. A pen, a photograph, and back to work.',
  ],
  'contract_renewed.servant': [
    'Another {n} for a man who has never played for anyone else. The terraces will like that.',
  ],
  'contract_renewed.unhappy': [
    'He signs, eventually, and both sides know exactly what it cost to get there.',
  ],
  contract_expired: [
    "{p}'s deal runs out and nobody moves to fix it. That is a decision too.",
  ],

  // ── THE CLIMB ─────────────────────────────────────────────────────────────────────────────────
  promotion: [
    '{club} go up. {from} is behind them and {to} does not care who they used to be.',
    'Promotion. Grown men in the away end who have followed this club for thirty years.',
    'The pitch is full of people within nine seconds of the whistle.',
  ],
  relegation: [
    'Down to {to}. The applause at the end is the worst part, because it is kind.',
    'Relegated. Somebody has to stand in front of the cameras and account for a year.',
  ],
  title: [
    'Champions. Whatever happens afterwards, that word is permanent now.',
  ],
  near_miss: [
    'One place, one point, one game. It will be brought up for years.',
  ],

  // ── ENDINGS AND BEGINNINGS ────────────────────────────────────────────────────────────────────
  retirement: [
    '{p} retires. He is a name in the honours list now, and a coat on a peg somewhere else.',
  ],
  'retirement.servant': [
    'He came as a boy and leaves with grey in his beard. One club, all of it.',
  ],
  'retirement.star': [
    'The bloodline player hangs them up. The family name goes on; his part in it does not.',
  ],
  youth_intake: [
    '{n} come up from the academy, and one of them will matter. Nobody knows which.',
  ],

  // ── SCOUTING ──────────────────────────────────────────────────────────────────────────────────
  scout_dispatched: [
    'A scout goes out to {to} with a bag and a fortnight.',
  ],
  scout_found: [
    'He comes back with {p}, and a story about the pitch he found him on.',
  ],
  scout_empty: [
    'Nothing. Two weeks, a lot of miles, and a notebook full of players who are not good enough.',
  ],

  // ── THE CLUB ITSELF ───────────────────────────────────────────────────────────────────────────
  facility_upgraded: [
    'The builders are in. It will be better next season, and unusable this month.',
  ],
  staff_hired: [
    'A new voice on the training ground. The players work out quickly whether it is worth listening to.',
  ],
};
