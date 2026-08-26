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
  Grassroots: ['on a muddy park pitch', 'under grey skies at the local rec', 'with a scatter of parents watching from the touchline', 'on a frostbitten Sunday-league morning', 'beside a car park that doubled as a stand', 'with jumpers for goalposts barely holding up', 'as a stray dog wandered across the far touchline'],
  Academy: ["on the academy's back pitches", 'in a youth-team fixture', 'under the academy floodlights', 'in a coaches-only trial game', 'in a behind-closed-doors development game', 'with the academy director leaning on the railing', 'on a crisp morning at the training complex'],
  'Youth Team': ['in a reserve-team match', 'with a couple of scouts jotting notes', 'in front of a smattering of regulars', 'on a wind-whipped afternoon', 'in an under-21s league fixture', 'with a first-team coach passing through to watch', 'on a bobbly pitch at a non-league ground'],
  Breakthrough: ['in front of a proper crowd now', 'with the first-team staff watching on', 'as the terraces found their voice', 'under real floodlights, real pressure', 'with his name finally on the teamsheet', 'as the home end chanted for a debutant', 'in his first real taste of the senior game'],
  Establishing: ['before a full, expectant stand', 'with cameras tracking his every touch', 'in the thick of a proper contest', 'with a lot of eyes on him', 'with the pundits picking over his every decision', 'in a match the whole division was watching', 'as the crowd rose to meet the occasion'],
};
// big-moment settings override the chapter setting when the stakes are high
const BIG_SETTINGS = ['in a white-hot derby', 'with the tie hanging in the balance', 'as tempers frayed and the stakes climbed', 'in a bruising six-pointer', 'with promotion on the line', 'under the lights, everything to play for', 'in a fiery local grudge match', 'with a play-off place at stake', 'as the challenges turned bruising and the stakes climbed', 'with the season teetering on this result'];
const HUGE_SETTINGS = ['in the cup final, the whole ground holding its breath', 'with the title on the line', 'on the grandest stage of his young life', 'as sixty thousand roared', 'in the last minute of the biggest game of the season', 'with silverware within touching distance', 'in the semi-final, one step from glory', 'with the whole city watching on', 'as a nervous nation held its breath', 'in the deciding game of the entire campaign'];

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
  triumph: ['and it was sublime', 'and it came off brilliantly', '— pure, unarguable quality', 'and it was worth the admission alone', 'and the whole thing was a joy to watch', 'and he made it look absurdly easy', 'and jaws hit the floor', 'and it was the moment of the match', 'and it was simply breathtaking', 'and the ground erupted', '— a genuine touch of genius', 'and it belonged in a far better league', 'and he judged it to perfection', 'and, for a beat, time seemed to stop'],
  good: ['and it came off', 'and it did the job well', '— a good, clean piece of play', 'and it worked a treat', 'and it was tidy, assured stuff', 'and he executed it without fuss', 'and it drew a ripple of approval', 'and it came off nicely', 'and it was neatly done', '— solid, dependable work', 'and it did exactly what was needed', 'and he handled it with real assurance', 'and it earned an appreciative murmur'],
  mixed: ['with mixed results', '— not quite clean, but it held up', 'and just about got away with it', 'in fits and starts', '— the right idea, roughly done', 'and it half-worked', 'and it was a scrappy affair', '— promising, if unpolished', 'and it wobbled but survived', 'and it was more effort than elegance', '— decent intent, patchy delivery', 'and it just about stood up'],
  poor: ["but it didn't come off", 'and it fell flat', 'only for it to unravel', 'and the moment slipped away', 'but the execution let him down', 'and it came to nothing', 'and it fizzled out', 'but it never really threatened', 'and the chance went begging', 'only for it to break down', 'and it amounted to little', 'but he snatched at it'],
  dismal: ['and it went badly wrong', '— a moment to forget', 'and it fell apart completely', 'and he was left red-faced', 'and it was a total mess', 'and the crowd groaned', 'and it was a complete shambles', 'and it could hardly have gone worse', '— a plain embarrassment', 'and it unravelled from the off', 'and he wished the ground would swallow him', 'and it was painful to watch'],
};
const REACTIONS: Record<string, string[]> = {
  triumph: ['The coaches exchanged a look.', 'You could feel the buzz ripple round the ground.', 'A statement.', 'Scouts scribbled.', 'The bench was on its feet.', 'One for the highlight reel.', 'Even the opposition applauded.', 'The gaffer allowed himself a smile.', 'They will be talking about that for weeks.', 'Pure class.', 'The whole squad mobbed him.', 'You could hear the gasp roll round the stands.', 'A moment of real quality.'],
  good: ['A nod from the gaffer.', 'Good habits.', 'Quietly impressive.', 'The staff liked that.', 'Ticked a box.', 'Exactly what was asked.', 'Well judged.', 'The coaches noted it.', 'Sensible stuff.', 'No complaints there.', 'That is the standard.', 'A reassuring sign.'],
  mixed: ['Something to work on.', 'Raw, but there.', 'Room to grow.', 'A shrug from the bench.', 'Half a mark.', "There's a player in there.", 'Work in progress.', 'The tools are there.', 'A bit of both.', 'The gaffer tilted his head.', 'Not the finished article.', 'Encouraging, in patches.'],
  poor: ['The gaffer frowned.', 'A lesson, that.', 'Back to the training ground.', 'He knew it, too.', 'Words at half-time, surely.', 'File under learning.', 'The bench went quiet.', 'One to review on Monday.', 'He blew out his cheeks.', 'The coaches shared a glance.', 'Not his finest.', 'A chance gone.'],
  dismal: ['Heads dropped.', 'One to bury and move on from.', 'The bench winced.', 'A long walk back to the halfway line.', 'The gaffer looked away.', 'Best forgotten.', 'The dugout groaned as one.', 'He hung his head.', 'That one will sting.', 'The gaffer buried his face in his hands.', 'A moment he would replay all week.', 'Nothing to be said about that.'],
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
