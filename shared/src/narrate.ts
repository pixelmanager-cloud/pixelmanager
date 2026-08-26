// Career-game NARRATION — turns each card you play into a beat in a real person's life. Deterministic
// (seeded from the career + turn), so a career replays identically and reads like a story. The tone
// shifts with the player's AGE/chapter, the STAKES of the moment, how WELL it came off, his TEMPERAMENT,
// the recurring CHARACTERS around him, and whatever SEASON EVENT is coloring the chapter. No LLM —
// seeded template composition with a wide vocabulary so it rarely repeats.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface NarrateCtx {
  age: number; chapter: string; stakes: 1 | 2 | 3; personalityId: string;
  seasonEventId?: string | null; seed: number; careerSeed?: number;
  /** a milestone this beat represents (first goal, debut, cup-final delivery…) — special-cased */
  milestone?: string | null;
}
export interface ScenarioCtx {
  seed: number; age?: number; chapter?: string; seasonEventId?: string | null; careerSeed?: number;
}

// ── RECURRING CHARACTERS: a small seeded cast, stable across a whole career (derived from careerSeed) ──
const GAFFER_NAMES = ['Hargreaves', 'Doyle', 'Ferreira', 'Brandt', 'Okonkwo', 'Salgado', 'Whelan', 'Redmond', 'Ashcroft', 'Vasquez', 'Kowalski', 'Mbeki'];
const RIVAL_NAMES = ['Turner', 'Bianchi', 'Novak', 'Halvorsen', 'De Groot', 'Adeyemi', 'Rossi', 'Lindqvist', 'Marchetti', 'Bauer'];
const MENTOR_NAMES = ['old Franny', 'the veteran Delgado', 'club legend Pearce', 'wily old Ivanov', 'the skipper-emeritus Blake', 'grizzled Marcus Reid'];
const CAPTAIN_NAMES = ['the skipper, Voss', 'captain Ellery', 'the armband-wearer Sokol', 'skipper Da Silva', 'club captain Hendricks'];
export interface CareerCast { gaffer: string; rival: string; mentor: string; captain: string }
export function careerCast(careerSeed: number): CareerCast {
  const rng = mulberry32((careerSeed >>> 0) ^ 0x9e3779b9);
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(rng() * a.length)];
  return { gaffer: pick(GAFFER_NAMES), rival: pick(RIVAL_NAMES), mentor: pick(MENTOR_NAMES), captain: pick(CAPTAIN_NAMES) };
}

// settings by chapter (age band) — a young park pitch grows into a stadium
const SETTINGS: Record<string, string[]> = {
  Grassroots: ['on a muddy park pitch', 'under grey skies at the local rec', 'with a scatter of parents watching from the touchline', 'on a frostbitten Sunday-league morning', 'between two sets of jumpers-for-goalposts', 'as a dog wandered across the far corner'],
  Academy: ["on the academy's back pitches", 'in a youth-team fixture', 'under the academy floodlights', 'in a coaches-only trial game', 'on the manicured academy turf', 'in front of the youth-development staff'],
  'Youth Team': ['in a reserve-team match', 'with a couple of scouts jotting notes', 'in front of a smattering of regulars', 'on a wind-whipped afternoon', 'in a tight, chippy reserve derby', 'with a first-team coach watching from the tunnel'],
  Breakthrough: ['in front of a proper crowd now', 'with the first-team staff watching on', 'as the terraces found their voice', 'under real floodlights, real pressure', 'with the home end starting to sing his name', 'on a raucous midweek night'],
  Establishing: ['before a full, expectant stand', 'with cameras tracking his every touch', 'in the thick of a proper contest', 'with a lot of eyes on him', 'as a sell-out crowd leaned in', 'with the pundits watching for a reason to doubt him'],
};
// big-moment settings override the chapter setting when the stakes are high
const BIG_SETTINGS = ['in a white-hot derby', 'with the tie hanging in the balance', 'as tempers frayed and the stakes climbed', 'in a bruising six-pointer', 'with promotion on the line', 'under the lights, everything to play for', 'with the season threatening to turn on this one game'];
const HUGE_SETTINGS = ['in the cup final, the whole ground holding its breath', 'with the title on the line', 'on the grandest stage of his young life', 'as sixty thousand roared', 'in the last minute of the biggest game of the season', 'with silverware within touching distance', 'in front of a nation watching at home'];

// action verbs by the card's dominant tag (≥6 each so beats rarely repeat)
const VERBS: Record<string, string[]> = {
  aggression: ['flew into', 'threw himself into', 'crunched into', 'went in hard for', 'snapped into', 'bristled into', 'stood his ground for'],
  creativity: ['conjured', 'threaded', 'dreamed up', 'engineered', 'invented', 'sketched out', 'unpicked the lock with'],
  composure: ['calmly produced', 'coolly executed', 'took his time over', 'nervelessly played', 'unhurriedly slotted in', 'kept his head and delivered', 'measured out'],
  flair: ['lit up the moment with', 'produced a piece of magic —', 'brought the crowd up with', 'dared to try', 'flicked out', 'brazenly attempted', 'showboated into'],
  leadership: ['took charge with', 'rallied the lads with', 'demanded the ball and', 'led by example with', 'grabbed the game by the collar with', 'dragged the team forward with'],
  teamwork: ['linked up for', 'worked the ball into', 'combined for', 'selflessly played', 'dovetailed into', 'knitted the move with', 'played the percentages with'],
  stamina: ['dug deep for', 'powered through for', 'ran himself into the ground for', 'kept going for', 'gutted out', 'found one last surge for', 'refused to stop for'],
  keeping: ['pulled off', 'commanded his box with', 'stood tall for', 'threw himself across for', 'clawed out', 'read it early and produced', 'got a strong hand to'],
};
// tag-specific triumph colour — occasionally used instead of a generic result so a flair moment reads
// unlike a keeping one (per-tag result colour)
const TAG_TRIUMPH: Record<string, string[]> = {
  aggression: ['and the whole midfield bent to his will', 'and the opponent thought twice after that'],
  creativity: ['and it split the pitch open like a scalpel', 'and nobody else on the field had seen the pass'],
  composure: ['and you’d never have known the stakes', 'and time seemed to slow around him'],
  flair: ['and the crowd came up as one', 'and grown adults gasped'],
  leadership: ['and suddenly the whole team stood taller', 'and the tie turned on that act of will'],
  teamwork: ['and it was a goal built by six players and finished by one', 'and the move was a thing of collective beauty'],
  stamina: ['on legs that had no right to carry him', 'when everyone else had emptied the tank'],
  keeping: ['and he saved his side single-handed', 'and the striker held his head in disbelief'],
};
// results + reactions by outcome band (≥6 each)
const RESULTS: Record<string, string[]> = {
  triumph: ['and it was sublime', 'and it came off brilliantly', '— pure, unarguable quality', 'and it was worth the admission alone', 'and the whole thing was a joy to watch', 'and he made it look absurdly easy', 'and jaws hit the floor', 'and it was the moment of the match'],
  good: ['and it came off', 'and it did the job well', '— a good, clean piece of play', 'and it worked a treat', 'and it was tidy, assured stuff', 'and he executed it without fuss', 'and it drew a ripple of approval', 'and it was exactly the right call'],
  mixed: ['with mixed results', '— not quite clean, but it held up', 'and just about got away with it', 'in fits and starts', '— the right idea, roughly done', 'and it half-worked', '— ambition outrunning execution', 'and it was a qualified success'],
  poor: ["but it didn't come off", 'and it fell flat', 'only for it to unravel', 'and the moment slipped away', 'but the execution let him down', 'and it came to nothing', 'and the chance evaporated'],
  dismal: ['and it went badly wrong', '— a moment to forget', 'and it fell apart completely', 'and he was left red-faced', 'and it was a total mess', 'and the crowd groaned', 'and it was a genuine howler'],
};
const REACTIONS: Record<string, string[]> = {
  triumph: ['The coaches exchanged a look.', 'You could feel the buzz ripple round the ground.', 'A statement.', 'Scouts scribbled.', 'The bench was on its feet.', 'One for the highlight reel.', 'Even the opposition applauded.', 'That one will be talked about.'],
  good: ['A nod from the gaffer.', 'Good habits.', 'Quietly impressive.', 'The staff liked that.', 'Ticked a box.', 'Exactly what was asked.', 'Solid, dependable stuff.'],
  mixed: ['Something to work on.', 'Raw, but there.', 'Room to grow.', 'A shrug from the bench.', 'Half a mark.', "There's a player in there.", 'The talent is obvious; the polish isn’t — yet.'],
  poor: ['The gaffer frowned.', 'A lesson, that.', 'Back to the training ground.', 'He knew it, too.', 'Words at half-time, surely.', 'File under learning.', 'A teachable moment.'],
  dismal: ['Heads dropped.', 'One to bury and move on from.', 'The bench winced.', 'A long walk back to the halfway line.', 'The gaffer looked away.', 'Best forgotten.', 'He’ll want the ground to swallow him.'],
};
// per-personality VOICE: colours the beat throughout (not just a rare tag-on clause)
const PERSONALITY: Record<string, string> = {
  maverick: 'He never does it the easy way.',
  fragile: 'The nerves were written all over him.',
  leader: 'The armband would suit him.',
  biggame: 'He lives for these.',
  workhorse: 'No one on that pitch worked harder.',
  mercurial: "You never quite know which version you'll get.",
  pro: 'Consummate, as ever.',
};
// personality-flavoured verbs woven in occasionally so the temperament is felt, not just stated
const PERSONALITY_ADV: Record<string, string[]> = {
  maverick: ['with a swagger,', 'grinning,', 'off the cuff,'],
  fragile: ['tentatively,', 'jaw tight,', 'heart in mouth,'],
  leader: ['barking orders,', 'chest out,', 'taking responsibility,'],
  biggame: ['relishing it,', 'eyes lit up,', 'right at home,'],
  workhorse: ['lungs burning,', 'without a word,', 'for the fifth time that half,'],
  mercurial: ['on a whim,', 'inscrutable as ever,', 'in one of his moods,'],
  pro: ['methodically,', 'as drilled,', 'ice in his veins,'],
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
  match: ['The game is finely poised.', 'The match hangs in the balance.', 'This is where games are won and lost.', 'The tempo is rising and the tackles are flying in.', 'Both sides are trading blows and neither will blink.', 'It’s scrappy, tight, and crying out for someone to take control.', 'The clock is ticking and the game needs a hero.'],
  training: ['On the training ground, the coaches are watching closely.', 'The gaffer has set up a pointed drill.', 'It’s a sharp session, and the staff want to see something specific.', 'Cones out, whistle sharp — this is a test dressed up as a drill.', 'A small-sided game, but the staff are marking cards.', 'Rondos done, now the real work: he’s being pushed today.'],
  social: ['Away from the pitch, his character is being tested.', 'In the dressing room, the mood needs handling.', 'Off the field, who he is matters as much as how he plays.', 'A quiet word is needed, and everyone’s watching how he takes it.', 'The group dynamic is fragile, and he’s in the middle of it.', 'This one won’t show on the stat sheet — but it counts.'],
  // rare life-event kinds (see career.ts life events)
  contract: ['The agent’s phone won’t stop ringing. A big decision looms.', 'Money and loyalty are pulling in different directions.', 'A career-shaping choice has landed on his plate.'],
  loan: ['A loan move is on the table — a fork in the road.', 'Stay and fight for minutes, or leave to find them elsewhere?', 'The club want him to go and toughen up somewhere real.'],
  setback: ['A very public mistake to bounce back from.', 'The headlines weren’t kind. Now he has to answer them.', 'Confidence dented, reputation on the line — this is about response.'],
};
const DEMAND: Record<string, string[]> = {
  aggression: ['It needs someone to win the dirty battles and stop the opposition playing.', 'It needs an edge — someone to bite into tackles and set the tone.', 'Somebody has to stop being bullied and start doing the bullying.'],
  creativity: ['It needs a spark of invention to unlock a stubborn defence.', 'Someone has to see the pass no one else can.', 'This calls for imagination — a moment from nothing.'],
  composure: ['It needs a cool head to keep things calm under pressure.', 'Panic loses this; someone has to slow it all down.', 'The moment demands ice, not fire.'],
  teamwork: ['It needs him to knit the play together and bring others in.', 'This is about the collective — link it, share it, trust it.', 'Someone has to be the glue and make the whole thing tick.'],
  leadership: ['It needs someone to grab this by the scruff of the neck.', 'The team is looking for a leader to step up — right now.', 'Somebody has to drag the rest of them with him.'],
  stamina: ['It needs legs — someone to cover the ground and outrun them.', 'This is a test of engine as much as ability.', 'Whoever wants it most, and can run longest, wins it.'],
  flair: ['It needs a bit of magic to lift the crowd.', 'This is a stage for the outrageous — dare something.', 'The kind of moment careers are remembered for.'],
  keeping: ['It falls to the keeper to stand tall and keep them out.', 'Everything now rests on the last line — no mistakes.', 'The goal is under siege; someone has to be a wall.'],
};
const pickFrom = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

/** Weave the age/chapter into the situation so a 12-year-old on a park pitch reads unlike a 23-year-old. */
function ageFraming(rng: () => number, age?: number, chapter?: string): string {
  if (age == null) return '';
  if (age <= 12) return pickFrom(rng, ['Barely up to the crossbar, ', 'A boy among boys, ', 'Still finding his feet in the game, ']);
  if (age <= 15) return pickFrom(rng, ['A gangly teenager with a lot to prove, ', 'Growing into his frame, ', 'Hungry and a little raw, ']);
  if (age <= 18) return pickFrom(rng, ['On the cusp of the first team, ', 'A prospect the club is watching carefully, ', 'With the academy behind him and the real thing ahead, ']);
  if (age <= 21) return pickFrom(rng, ['Establishing himself now, ', 'No longer a kid, expectations rising, ', 'A young man with a reputation to build, ']);
  return pickFrom(rng, ['A senior figure in the making, ', 'In his pomp, ', 'With the experience to know exactly what this is, ']);
}

/** A narrative description of the moment the player is living through, from the scenario. */
export function scenarioStory(kind: string, topTag: string, moment: string | null, ctx: ScenarioCtx | number): string {
  // back-compat: a bare seed number still works
  const c: ScenarioCtx = typeof ctx === 'number' ? { seed: ctx } : ctx;
  const rng = mulberry32(c.seed >>> 0);
  const demand = pickFrom(rng, DEMAND[topTag] ?? DEMAND.teamwork);
  const eventTint = c.seasonEventId && EVENT_PREFIX[c.seasonEventId] ? EVENT_PREFIX[c.seasonEventId] : '';
  const cast = c.careerSeed != null ? careerCast(c.careerSeed) : null;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  // occasionally attribute the situation to a recurring character (capitalised — it follows a full stop)
  const charRaw = cast && rng() < 0.4
    ? pickFrom(rng, [`${cap(cast.mentor)} reckons this is the making of him.`, `${cast.gaffer} wants to see how he handles it.`, `${cap(cast.captain)} is looking his way.`, `Beat ${cast.rival} to it and the point is made.`])
    : '';
  const charline = charRaw ? ' ' + charRaw : '';
  if (moment) {
    const frame = eventTint || ageFraming(rng, c.age, c.chapter);
    return `${frame ? cap(frame) + `it’s ${moment}.` : `It’s ${moment}.`} ${demand}${charline}`;
  }
  const setup = pickFrom(rng, KIND_SETUP[kind] ?? KIND_SETUP.match);
  const frame = eventTint || ageFraming(rng, c.age, c.chapter);
  return `${frame ? cap(frame) + setup.charAt(0).toLowerCase() + setup.slice(1) : setup} ${demand}${charline}`;
}

const band = (success: number) => (success >= 0.8 ? 'triumph' : success >= 0.62 ? 'good' : success >= 0.42 ? 'mixed' : success >= 0.24 ? 'poor' : 'dismal');
const domTag = (tags: string[]) => tags.find((t) => VERBS[t]) ?? 'teamwork';

// milestone flourishes — prepended when a beat marks a career-first
const MILESTONE: Record<string, string> = {
  debut: '🎬 His debut. ',
  first_goal: '⚽ His first-ever goal. ',
  first_big_win: '🏆 The biggest win of his young career. ',
  cup_final: '🏟️ A cup final, no less. ',
  first_start: '📋 His first start. ',
};

/** One immersive sentence (or two) for a card played this turn. */
export function narratePlay(cardName: string, cardTags: string[], success: number, ctx: NarrateCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const b = band(success);
  const tag = domTag(cardTags);
  const setting = ctx.stakes === 3 ? pick(HUGE_SETTINGS) : ctx.stakes === 2 ? pick(BIG_SETTINGS) : pick(SETTINGS[ctx.chapter] ?? SETTINGS.Academy);
  const verb = pick(VERBS[tag]);
  // per-tag result colour on a big success; otherwise the generic band result
  const result = b === 'triumph' && TAG_TRIUMPH[tag] && rng() < 0.55 ? pick(TAG_TRIUMPH[tag]) : pick(RESULTS[b]);
  const reaction = pick(REACTIONS[b]);
  const prefix = ctx.seasonEventId && EVENT_PREFIX[ctx.seasonEventId] ? EVENT_PREFIX[ctx.seasonEventId] : '';
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const lead = prefix ? prefix + setting : cap(setting);
  // personality VOICE: an adverbial colour before the verb (felt throughout), plus the rare stated clause
  const adv = PERSONALITY_ADV[ctx.personalityId] && rng() < 0.5 ? pick(PERSONALITY_ADV[ctx.personalityId]) + ' ' : '';
  const flavor = (b === 'triumph' || b === 'dismal') && rng() < 0.6 && PERSONALITY[ctx.personalityId] ? ' ' + PERSONALITY[ctx.personalityId] : '';
  // a recurring character sometimes reacts
  const cast = ctx.careerSeed != null ? careerCast(ctx.careerSeed) : null;
  const castReact = cast && rng() < 0.25
    ? ' ' + pick([`${cast.gaffer} said nothing, but noted it.`, `${cap(cast.mentor)} allowed himself a smile.`, `${cast.captain} clapped him on the back.`, `One in the eye for ${cast.rival}.`])
    : '';
  const milestone = ctx.milestone && MILESTONE[ctx.milestone] ? MILESTONE[ctx.milestone] : '';
  const action = adv ? `he, ${adv}${verb}` : `he ${verb}`; // "he, grinning, flew into …"
  return `${milestone}${cap(lead)}, ${action} ${cardName} ${result}. ${reaction}${flavor}${castReact}`;
}

// ── CHAPTER RECAP + GRADUATION EPILOGUE (the story-so-far beats) ──
export interface RecapCtx { chapter: string; nextChapter?: string | null; age: number; careerSeed: number; personalityId?: string; overall?: number; seasonEventId?: string | null }
/** A short "the story so far" passage shown at an age-chapter boundary. */
export function chapterRecap(ctx: RecapCtx): string {
  const rng = mulberry32(((ctx.careerSeed >>> 0) ^ Math.imul(ctx.age, 2654435761)) >>> 0);
  const cast = careerCast(ctx.careerSeed);
  const openers: Record<string, string[]> = {
    Grassroots: ['The park-pitch years are behind him now.', 'It began, as these things do, on a cold Sunday morning.'],
    Academy: ['The academy has shaped him.', 'Two seasons of drills, van journeys and hard lessons.'],
    'Youth Team': ['The youth team taught him the game has teeth.', 'Reserve football is unglamorous — and it has toughened him.'],
    Breakthrough: ['The breakthrough came, as it had to.', 'The first-team door has creaked open.'],
    Establishing: ['He belongs here now.', 'No longer the kid — a fixture, a name.'],
  };
  const open = pickFrom(rng, openers[ctx.chapter] ?? openers.Academy);
  const middle = pickFrom(rng, [`${cast.gaffer} has pushed him hard.`, `${cap0(cast.mentor)} has taken him under his wing.`, `He’s measured himself against ${cast.rival} at every step.`, `${cast.captain} says the makings are there.`]);
  const ahead = ctx.nextChapter
    ? pickFrom(rng, [` Now comes the ${ctx.nextChapter} chapter — and the pressure that comes with it.`, ` The ${ctx.nextChapter} stage awaits, tougher than the last.`])
    : '';
  return `${open} ${middle}${ahead}`;
}
function cap0(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

export interface EpilogueCtx { name: string; careerSeed: number; personalityId?: string; overall: number; topTraits?: string[]; role?: string }
/** An evocative summary of the whole 10→25 journey, shown at graduation before the pro reveal. */
export function graduationEpilogue(ctx: EpilogueCtx): string {
  const rng = mulberry32(((ctx.careerSeed >>> 0) ^ 0x5f3759df) >>> 0);
  const cast = careerCast(ctx.careerSeed);
  const tier = ctx.overall >= 17 ? 'a genuine star in the making' : ctx.overall >= 14 ? 'a real player, ready for the step up' : ctx.overall >= 11 ? 'a dependable pro with more to give' : 'a grafter who has earned his shot';
  const persLine: Record<string, string> = {
    maverick: 'They never could tame the flair in him — and stopped trying.',
    fragile: 'The nerves never fully left, but he learned to play through them.',
    leader: 'Somewhere along the way, the others started following him.',
    biggame: 'The bigger the day, the more he seemed to want the ball.',
    workhorse: 'Nobody outworked him. Nobody ever will.',
    mercurial: 'Brilliant one week, baffling the next — but never boring.',
    pro: 'Professional to his boots, from the very first session.',
  };
  const pers = ctx.personalityId && persLine[ctx.personalityId] ? ' ' + persLine[ctx.personalityId] : '';
  const start = pickFrom(rng, ['It started on a park pitch with jumpers for goalposts.', 'Fifteen years ago he was the smallest kid on a muddy rec.', 'From a scatter of parents on a touchline to this.']);
  const close = pickFrom(rng, [`${cast.gaffer} always said he’d make it. He was right.`, `${cap0(cast.mentor)} shook his hand and said little. He didn’t need to.`, `Somewhere, ${cast.rival} is watching, and wondering.`]);
  return `${start} At twenty-five, ${ctx.name} emerges as ${tier}.${pers} ${close}`;
}
