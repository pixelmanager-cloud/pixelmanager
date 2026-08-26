// Career-game NARRATION — turns each card you play into a beat in a real person's life. Deterministic
// (seeded from the career + turn), so a career replays identically and reads like a story. The tone
// shifts with the player's AGE/chapter, the STAKES of the moment, how WELL it came off, his TEMPERAMENT,
// and whatever SEASON EVENT is coloring the chapter. No LLM — seeded template composition with wide
// vocabulary so it rarely repeats.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface NarrateCtx {
  age: number; chapter: string; stakes: 1 | 2 | 3; personalityId: string;
  seasonEventId?: string | null; seed: number;
}

// settings by chapter (age band) — a young park pitch grows into a stadium
const SETTINGS: Record<string, string[]> = {
  Grassroots: ['on a muddy park pitch', 'under grey skies at the local rec', 'with a scatter of parents watching from the touchline', 'on a frostbitten Sunday-league morning'],
  Academy: ["on the academy's back pitches", 'in a youth-team fixture', 'under the academy floodlights', 'in a coaches-only trial game'],
  'Youth Team': ['in a reserve-team match', 'with a couple of scouts jotting notes', 'in front of a smattering of regulars', 'on a wind-whipped afternoon'],
  Breakthrough: ['in front of a proper crowd now', 'with the first-team staff watching on', 'as the terraces found their voice', 'under real floodlights, real pressure'],
  Establishing: ['before a full, expectant stand', 'with cameras tracking his every touch', 'in the thick of a proper contest', 'with a lot of eyes on him'],
};
// big-moment settings override the chapter setting when the stakes are high
const BIG_SETTINGS = ['in a white-hot derby', 'with the tie hanging in the balance', 'as tempers frayed and the stakes climbed', 'in a bruising six-pointer', 'with promotion on the line', 'under the lights, everything to play for'];
const HUGE_SETTINGS = ['in the cup final, the whole ground holding its breath', 'with the title on the line', 'on the grandest stage of his young life', 'as sixty thousand roared', 'in the last minute of the biggest game of the season', 'with silverware within touching distance'];

// action verbs by the card's dominant tag
const VERBS: Record<string, string[]> = {
  aggression: ['flew into', 'threw himself into', 'crunched into', 'went in hard for'],
  creativity: ['conjured', 'threaded', 'dreamed up', 'engineered'],
  composure: ['calmly produced', 'coolly executed', 'took his time over', 'nervelessly played'],
  flair: ['lit up the moment with', 'produced a piece of magic —', 'brought the crowd up with', 'dared to try'],
  leadership: ['took charge with', 'rallied the lads with', 'demanded the ball and', 'led by example with'],
  teamwork: ['linked up for', 'worked the ball into', 'combined for', 'selflessly played'],
  stamina: ['dug deep for', 'powered through for', 'ran himself into the ground for', 'kept going for'],
  keeping: ['pulled off', 'commanded his box with', 'stood tall for', 'threw himself across for'],
};
// results + reactions by outcome band
const RESULTS: Record<string, string[]> = {
  triumph: ['and it was sublime', 'and it came off brilliantly', '— pure, unarguable quality', 'and it was worth the admission alone', 'and the whole thing was a joy to watch', 'and he made it look absurdly easy', 'and jaws hit the floor', 'and it was the moment of the match'],
  good: ['and it came off', 'and it did the job well', '— a good, clean piece of play', 'and it worked a treat', 'and it was tidy, assured stuff', 'and he executed it without fuss', 'and it drew a ripple of approval'],
  mixed: ['with mixed results', '— not quite clean, but it held up', 'and just about got away with it', 'in fits and starts', '— the right idea, roughly done', 'and it half-worked'],
  poor: ["but it didn't come off", 'and it fell flat', 'only for it to unravel', 'and the moment slipped away', 'but the execution let him down', 'and it came to nothing'],
  dismal: ['and it went badly wrong', '— a moment to forget', 'and it fell apart completely', 'and he was left red-faced', 'and it was a total mess', 'and the crowd groaned'],
};
const REACTIONS: Record<string, string[]> = {
  triumph: ['The coaches exchanged a look.', 'You could feel the buzz ripple round the ground.', 'A statement.', 'Scouts scribbled.', 'The bench was on its feet.', 'One for the highlight reel.', 'Even the opposition applauded.'],
  good: ['A nod from the gaffer.', 'Good habits.', 'Quietly impressive.', 'The staff liked that.', 'Ticked a box.', 'Exactly what was asked.'],
  mixed: ['Something to work on.', 'Raw, but there.', 'Room to grow.', 'A shrug from the bench.', 'Half a mark.', "There's a player in there."],
  poor: ['The gaffer frowned.', 'A lesson, that.', 'Back to the training ground.', 'He knew it, too.', 'Words at half-time, surely.', 'File under learning.'],
  dismal: ['Heads dropped.', 'One to bury and move on from.', 'The bench winced.', 'A long walk back to the halfway line.', 'The gaffer looked away.', 'Best forgotten.'],
};
// occasional temperament flavor
const PERSONALITY: Record<string, string> = {
  maverick: 'He never does it the easy way.',
  fragile: 'The nerves were written all over him.',
  leader: 'The armband would suit him.',
  biggame: 'He lives for these.',
  workhorse: 'No one on that pitch worked harder.',
  mercurial: "You never quite know which version you'll get.",
  pro: 'Consummate, as ever.',
};
// season-event prefixes (weave the chapter's story into the beat)
const EVENT_PREFIX: Record<string, string> = {
  'serious-injury': 'Still fighting his way back from a bad injury, ',
  'hot-streak': 'In the form of his life, ',
  slump: 'Low on confidence, ',
  'new-gaffer': 'Desperate to catch the new gaffer’s eye, ',
  knock: 'Carrying a knock he wouldn’t admit to, ',
  breakthrough: 'Riding the wave of a breakout season, ',
};

// ── SCENARIO STORY: describe the SITUATION the player faces this turn (before he chooses) ──
const KIND_SETUP: Record<string, string[]> = {
  match: ['The game is finely poised.', 'The match hangs in the balance.', 'This is where games are won and lost.', 'The tempo is rising and the tackles are flying in.'],
  training: ['On the training ground, the coaches are watching closely.', 'The gaffer has set up a pointed drill.', 'It’s a sharp session, and the staff want to see something specific.'],
  social: ['Away from the pitch, his character is being tested.', 'In the dressing room, the mood needs handling.', 'Off the field, who he is matters as much as how he plays.'],
};
const DEMAND: Record<string, string> = {
  aggression: 'It needs someone to win the dirty battles and stop the opposition playing.',
  creativity: 'It needs a spark of invention to unlock a stubborn defence.',
  composure: 'It needs a cool head to keep things calm under pressure.',
  teamwork: 'It needs him to knit the play together and bring others in.',
  leadership: 'It needs someone to grab this by the scruff of the neck.',
  stamina: 'It needs legs — someone to cover the ground and outrun them.',
  flair: 'It needs a bit of magic to lift the crowd.',
  keeping: 'It falls to the keeper to stand tall and keep them out.',
};
/** A narrative description of the moment the player is living through, from the scenario. */
export function scenarioStory(kind: string, topTag: string, moment: string | null, seed: number): string {
  const rng = mulberry32(seed >>> 0);
  const demand = DEMAND[topTag] ?? DEMAND.teamwork;
  if (moment) return `It’s ${moment}. ${demand}`;
  const setup = (KIND_SETUP[kind] ?? KIND_SETUP.match)[Math.floor(rng() * (KIND_SETUP[kind] ?? KIND_SETUP.match).length)];
  return `${setup} ${demand}`;
}

// ── GRADUATION: an evocative career-summary passage at age 25, when a prospect finishes developing and
// becomes a pro. Seeded from the finished career so it reads identically on every replay. It covers the
// JOURNEY (park pitch → professional), the KIND of player he became (role, tier, standout stats), his
// TEMPERAMENT + earned TRAITS, and a closing note on how he handled the big stage. ──
export interface GraduationCtx {
  name: string; role: 'GK' | 'DF' | 'MF' | 'FW'; overall: number;
  attrs: Record<string, number>; traitNames: string[];
  personalityId: string; bigMoments: number; seriousInjuries: number; seed: number;
}
// the humble beginnings every career shares, then the arrival at the pro game
const GRAD_ORIGINS = [
  'It began on the muddy park pitches, a ten-year-old chasing a ball through the puddles.',
  'Fifteen years ago he was just another kid on the local rec, dreaming out loud.',
  'From frostbitten Sunday mornings and a scatter of parents on the touchline, the road began.',
  'Nobody was watching when he started — a boy, a ball, and the long climb ahead of him.',
  'Once he was the smallest lad in the youth-team huddle, all knees and nerves.',
];
const GRAD_ARRIVAL = [
  'Now, at twenty-five, he steps up a fully-fledged professional.',
  'And here he is at last — the academy behind him, the first team calling.',
  'Fifteen seasons on, he graduates a pro, the boyhood dream made real.',
  'The long apprenticeship is over; the professional game is his to take.',
  'The kid is gone; a man in his prime walks out to meet the senior game.',
];
const GRAD_ROLE: Record<string, string[]> = {
  GK: ['a goalkeeper', 'the last line of defence', 'a keeper', 'the man between the sticks'],
  DF: ['a defender', 'a defensive rock', 'a centre-half', 'a stopper who relishes the ugly side'],
  MF: ['a midfielder', 'an engine-room man', 'a midfield operator', 'a schemer in the middle of it all'],
  FW: ['a forward', 'a striker', 'an attacker', 'a threat in the final third'],
};
const gradTier = (ovr: number): string[] =>
  ovr >= 17 ? ['a genuine star', 'a top-class talent', 'the real deal']
  : ovr >= 14 ? ['an accomplished pro', 'a polished operator', 'a proper player']
  : ovr >= 11 ? ['a dependable pro', 'a solid professional', 'a useful squad man']
  : ['a rough-and-ready prospect', 'a raw work in progress', 'one still with plenty to prove'];
// each attribute's headline descriptor — the top two developed stats colour the summary
const GRAD_STAT: Record<string, string> = {
  pace: 'genuine pace to burn', strength: 'the strength to bully a back line', stamina: 'lungs that never quit',
  passing: 'a passing range that picks locks', shooting: 'a finish you can trust', tackling: 'a tackle like a slamming gate',
  positioning: 'a sharp reading of the game', workrate: 'a tireless engine', keeping: 'safe, certain hands',
  setPiece: 'a lethal dead ball', composure: 'ice in the veins', aggression: 'a hard competitive edge',
  creativity: 'the vision to unlock a defence', teamwork: 'a selfless streak', leadership: 'a natural authority',
};
const GRAD_TEMPERAMENT: Record<string, string[]> = {
  pro: ['A model professional to the core', 'Metronomic, dependable, no drama'],
  biggame: ['Born for the big occasion', 'The bigger the game, the bigger he plays'],
  fragile: ['Still learning to handle the heat', 'Gifted — but fragile when it boils over'],
  leader: ['A leader others follow', 'The armband seems to find him'],
  workhorse: ['A relentless worker', 'First to every loose ball, last to stop running'],
  mercurial: ['Maddening and magnificent by turns', 'Genius one week, anonymous the next'],
  maverick: ['Brilliant, stubborn, entirely his own man', 'He was never going to do it the easy way'],
};
// join a short list with commas and a trailing "and"
const listWords = (xs: string[]): string =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

/** An evocative, seeded career-summary passage for a player graduating to the pro game at 25. */
export function narrateGraduation(ctx: GraduationCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const origin = pick(GRAD_ORIGINS);
  const arrival = pick(GRAD_ARRIVAL);
  const tier = pick(gradTier(ctx.overall));
  const role = pick(GRAD_ROLE[ctx.role] ?? GRAD_ROLE.MF);
  // standout: the two highest developed attributes, if genuinely notable
  const standout = Object.keys(GRAD_STAT)
    .map((k) => [k, ctx.attrs[k] ?? 0] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .filter(([, v]) => v >= 12)
    .map(([k]) => GRAD_STAT[k]);
  const strengths = standout.length ? ` — ${listWords(standout)}` : '';
  const kind = `${cap(ctx.name)} leaves the academy ${tier}, ${role}${strengths}.`;

  const temperament = pick(GRAD_TEMPERAMENT[ctx.personalityId] ?? GRAD_TEMPERAMENT.pro) + '.';
  const traits = ctx.traitNames.length
    ? ` ${pick(['They will remember him for', 'What sets him apart:', 'His calling card:'])} ${listWords(ctx.traitNames)}.`
    : '';
  const closing = ctx.bigMoments >= 6 ? ' He answered on the biggest stages, time and again.'
    : ctx.bigMoments >= 3 ? ' He showed, more than once, that he could deliver when it mattered.'
    : ctx.seriousInjuries > 0 ? ' He got here the hard way, battling back from injury to make it at all.'
    : ' The real proving ground starts now, in the professional game itself.';

  return `${origin} ${arrival} ${kind} ${temperament}${traits}${closing}`;
}

const band = (success: number) => (success >= 0.8 ? 'triumph' : success >= 0.62 ? 'good' : success >= 0.42 ? 'mixed' : success >= 0.24 ? 'poor' : 'dismal');
const domTag = (tags: string[]) => tags.find((t) => VERBS[t]) ?? 'teamwork';

/** One immersive sentence (or two) for a card played this turn. */
export function narratePlay(cardName: string, cardTags: string[], success: number, ctx: NarrateCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const b = band(success);
  const setting = ctx.stakes === 3 ? pick(HUGE_SETTINGS) : ctx.stakes === 2 ? pick(BIG_SETTINGS) : pick(SETTINGS[ctx.chapter] ?? SETTINGS.Academy);
  const verb = pick(VERBS[domTag(cardTags)]);
  const result = pick(RESULTS[b]);
  const reaction = pick(REACTIONS[b]);
  const prefix = ctx.seasonEventId && EVENT_PREFIX[ctx.seasonEventId] ? EVENT_PREFIX[ctx.seasonEventId] : '';
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const lead = prefix ? prefix + setting : cap(setting);
  const flavor = (b === 'triumph' || b === 'dismal') && rng() < 0.7 && PERSONALITY[ctx.personalityId] ? ' ' + PERSONALITY[ctx.personalityId] : '';
  return `${cap(lead)}, he ${verb} ${cardName} ${result}. ${reaction}${flavor}`;
}
