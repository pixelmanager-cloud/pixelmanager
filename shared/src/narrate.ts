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
const BIG_SETTINGS = ['in a white-hot derby', 'with the tie hanging in the balance', 'as tempers frayed and the stakes climbed'];
const HUGE_SETTINGS = ['in the cup final, the whole ground holding its breath', 'with the title on the line', 'on the grandest stage of his young life', 'as sixty thousand roared'];

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
  triumph: ['and it was sublime', 'and it came off brilliantly', '— pure, unarguable quality', 'and it was worth the admission alone'],
  good: ['and it came off', 'and it did the job well', '— a good, clean piece of play', 'and it worked a treat'],
  mixed: ['with mixed results', '— not quite clean, but it held up', 'and just about got away with it', 'in fits and starts'],
  poor: ["but it didn't come off", 'and it fell flat', 'only for it to unravel', 'and the moment slipped away'],
  dismal: ['and it went badly wrong', '— a moment to forget', 'and it fell apart completely', 'and he was left red-faced'],
};
const REACTIONS: Record<string, string[]> = {
  triumph: ['The coaches exchanged a look.', 'You could feel the buzz ripple round the ground.', 'A statement.', 'Scouts scribbled.'],
  good: ['A nod from the gaffer.', 'Good habits.', 'Quietly impressive.', 'The staff liked that.'],
  mixed: ['Something to work on.', 'Raw, but there.', 'Room to grow.', 'A shrug from the bench.'],
  poor: ['The gaffer frowned.', 'A lesson, that.', 'Back to the training ground.', 'He knew it, too.'],
  dismal: ['Heads dropped.', 'One to bury and move on from.', 'The bench winced.', 'A long walk back to the halfway line.'],
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
