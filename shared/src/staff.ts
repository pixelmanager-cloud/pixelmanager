// ── Manager's backroom staff — a small seeded cast of recurring characters for the MANAGER side ──
// The player-career side already has a recurring cast (narrate.ts's careerCast: gaffer/rival/mentor/
// captain, derived from careerSeed). The manager side had nothing equivalent — audit finding: no
// system owns assistant-manager/scout/coach characters at all. This module fills that gap the same
// way: a small roster, deterministic from the save seed, stable for the life of a save. Pure data +
// a pure accessor + light flavour-quip pools — no mechanics, no effect on results or tactics.

function hash32(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const nameSeed = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) >>> 0;
function pick<T>(h: number, arr: readonly T[]): T { return arr[h % arr.length]; }

export type StaffRole = 'Assistant Manager' | 'Head Scout' | 'Fitness Coach' | 'Goalkeeping Coach';

const STAFF_SURNAMES = [
  'Whitfield', 'Osei', 'Callaghan', 'Verhoeven', 'Mancuso', 'Duclos', 'Radovic', 'Iwata',
  'Byrne', 'Skov', 'Petrosyan', 'Larsson', 'Nakamura', 'Kowalczyk', 'Farrelly', 'Onyema',
  'Aguirre', 'Bergstrom', 'Chukwu', 'Delahunty', 'Esposito', 'Fenwick', 'Gallardo', 'Halloran',
];
const STAFF_FIRST = [
  'Malcolm', 'Ines', 'Declan', 'Priya', 'Ronan', 'Sofia', 'Kofi', 'Elena', 'Bram', 'Nadia',
  'Aled', 'Marta', 'Owen', 'Yara', 'Fabio', 'Greta', 'Idris', 'Lena', 'Callum', 'Aya',
];

/** One-line personality pools per role, so the same person keeps a consistent flavour whenever they're
 *  referenced across a whole save — a blunt assistant stays blunt in October and in May. */
const PERSONALITY: Record<StaffRole, string[]> = {
  'Assistant Manager': [
    'A blunt, no-nonsense voice in the dressing room — says the thing everyone else is thinking.',
    'Meticulous with the details other coaches forget; keeps the gaffer honest between matches.',
    'A calming presence when things go wrong, and the first to celebrate when they go right.',
    'Old-school and fiercely loyal — has turned down bigger jobs to stay part of this project.',
    'Sharp tactical eye, quieter personality — does the best work away from the cameras.',
    'Fizzes with energy on the training pitch; the squad feed off it on matchday.',
  ],
  'Head Scout': [
    'Has an uncanny nose for a bargain — three of the last five signings came from a tip-off.',
    'Meticulous, spreadsheet-obsessed, and rarely wrong about a player once the file is closed.',
    'Trusts the eye test over the numbers — has been on the road watching football for decades.',
    'Young, sharp, and increasingly convinced data will change how the club recruits forever.',
    'Discreet to a fault — nobody outside the building ever hears about a target before it happens.',
    'A born networker with contacts in every league on the continent.',
  ],
  'Fitness Coach': [
    'Runs a training ground like a laboratory — every session logged, every load managed.',
    'A former player who never fully hung up the boots; still the fittest one on the training pitch.',
    'Popular with the squad for keeping sessions sharp instead of gruelling for the sake of it.',
    'Obsessive about recovery protocols — has cut soft-tissue injuries noticeably since arriving.',
    'Old-fashioned about fitness work, and not shy about saying the new methods are overrated.',
    'Quietly building a reputation as one of the best in the business at squad conditioning.',
  ],
  'Goalkeeping Coach': [
    'A specialist through and through — talks about goalkeeping the way others talk about religion.',
    'Demanding, detail-obsessed, and has never once let a keeper skip a distribution drill.',
    'Former international stopper; still saves shots better than most first-teamers can strike them.',
    'Softly spoken but relentless — keepers either love the process or struggle with it.',
    'Big on video analysis — every save and every mistake gets replayed and dissected.',
    'Builds real trust with young keepers — several academy prospects point to those sessions directly.',
  ],
};

export interface StaffMember { name: string; role: StaffRole; personality: string }
export interface StaffRoster {
  assistant: StaffMember;
  scout: StaffMember;
  fitnessCoach: StaffMember;
  goalkeepingCoach: StaffMember;
}

function person(seed: number, role: StaffRole, salt: number): StaffMember {
  const h = hash32(seed, salt);
  const first = pick(hash32(h, 1), STAFF_FIRST);
  const last = pick(hash32(h, 2), STAFF_SURNAMES);
  const personality = pick(hash32(h, 3), PERSONALITY[role]);
  return { name: `${first} ${last}`, role, personality };
}

/** The manager's backroom staff for this save — deterministic from the save seed, stable for the
 *  life of the save (same seed always returns the same four people). Presentational only. */
export function staffRoster(seed: number): StaffRoster {
  return {
    assistant: person(seed, 'Assistant Manager', 101),
    scout: person(seed, 'Head Scout', 202),
    fitnessCoach: person(seed, 'Fitness Coach', 303),
    goalkeepingCoach: person(seed, 'Goalkeeping Coach', 404),
  };
}

// ── Staff quips — small, deterministic flavour lines a staff member might offer around a moment ──
// Not tied to any mechanic: purely presentational colour a caller can surface alongside the diary/
// press systems (e.g. "{assistant.name} on the touchline: ...").
export type StaffMoment = 'bigWin' | 'bigLoss' | 'signing' | 'preSeason' | 'milestone';
const QUIP: Record<StaffRole, Record<StaffMoment, string[]>> = {
  'Assistant Manager': {
    bigWin: [`"That's the level we should be at every week," they tell the group.`, `"Don't get carried away — but yes, that felt good," comes the rare admission, with a smile.`],
    bigLoss: [`"We regroup, we work, we go again," they say, already onto the next session mentally.`, `"That one's on all of us. No excuses in this dressing room," is the message to the players.`],
    signing: [`"Good bit of business, that," comes the approving nod at the new arrival.`, `"Fits exactly what we needed. Now it's about settling the new arrival in quickly."`],
    preSeason: [`"Foundations first. The results follow if the work's right," they tell the squad.`, `"New season, same standards. Nothing gets handed to anyone here."`],
    milestone: [`"Proud doesn't begin to cover it," they say, watching from the touchline.`, `"Moments like this are what make the long days worth it."`],
  },
  'Head Scout': {
    bigWin: [`"Told you the squad had more in it," comes the knowing grin.`, `"Performances like that make finding upgrades a lot harder — happily."`],
    bigLoss: [`"Nothing in that result changes what I saw watching this group all summer," they say.`, `"One bad night. The list of targets doesn't change because of it."`],
    signing: [`"Been watching this one for eighteen months. Delighted it's finally over the line," they say.`, `"Best piece of business we'll do this window, mark my words."`],
    preSeason: [`"The recruitment plan is set. Now it's about patience," they tell the board.`, `"A few names still on the list, but the spine of the squad is right."`],
    milestone: [`"Scouted this one as a kid. Never gets old, seeing days like this," they say quietly.`, `"That's exactly the trajectory the reports always said was possible."`],
  },
  'Fitness Coach': {
    bigWin: [`"Legs were fresh, and it showed in the last twenty minutes," they say, pleased.`, `"That's the conditioning work paying off in real time."`],
    bigLoss: [`"Physically we were there. Whatever went wrong wasn't fitness," comes the firm response.`, `"We regroup in the gym tomorrow, same as any other week."`],
    signing: [`"Already sent over the individual programme — up to speed inside a fortnight."`, `"Good athlete. Looking forward to working with the new arrival."`],
    preSeason: [`"Best pre-season numbers I've had at this club," goes the report to the gaffer.`, `"The squad's in good shape. The building blocks are there."`],
    milestone: [`"Years of graft behind a moment like that," they say, arms folded, watching on.`, `"That's what all the early mornings are for."`],
  },
  'Goalkeeping Coach': {
    bigWin: [`"Clean night between the sticks. Exactly the platform we build from," they say.`, `"Distribution was excellent all evening — that starts on the training pitch."`],
    bigLoss: [`"We'll go through every one of those goals on Monday, no exceptions," they say.`, `"Concentration lapses. Fixable, and we'll fix them."`],
    signing: [`"Good technique, good size, coachable — I like what I've seen already."`, `"The kicking needs work, but the raw material is there."`],
    preSeason: [`"New shot-stopping drills this summer. Keepers have bought straight into it."`, `"Solid group of keepers this year. Healthy competition for the jersey."`],
    milestone: [`"Every keeper remembers their first one of those. Not one this squad will forget."`, `"That's a special moment for a goalkeeper. Thoroughly deserved."`],
  },
};

/** A deterministic staff quip for a given moment — same (seed, member role, moment, salt) always
 *  reads the same, but varies member-to-member and moment-to-moment. `salt` (e.g. round/season
 *  number) lets a caller vary the pick across repeated moments of the same kind. */
export function staffQuip(seed: number, role: StaffRole, moment: StaffMoment, salt = 0): string {
  const h = hash32(seed, nameSeed(role), nameSeed(moment), salt);
  return pick(h, QUIP[role][moment]);
}
