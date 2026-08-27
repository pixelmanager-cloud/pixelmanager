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
const CAPTAIN_NAMES = ['skipper Voss', 'captain Ellery', 'the armband-wearer Sokol', 'skipper Da Silva', 'club captain Hendricks'];
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
  Scholar: ['in a youth-league fixture', 'in front of the scholarship staff', 'with his YTS place on the line', 'on a bitter midweek youth night', 'in a trial game against older lads', 'with the academy director watching closely'],
  'Youth Team': ['in a reserve-team match', 'with a couple of scouts jotting notes', 'in front of a smattering of regulars', 'on a wind-whipped afternoon', 'in a tight, chippy reserve derby', 'with a first-team coach watching from the tunnel'],
  Breakthrough: ['in front of a proper crowd now', 'with the first-team staff watching on', 'as the terraces found their voice', 'under real floodlights, real pressure', 'with the home end starting to sing his name', 'on a raucous midweek night'],
  'First Team': ['as a first-team regular now', 'with the shirt his to lose', 'in front of a demanding home crowd', 'with the pressure of a starting spot', 'under the weight of real expectation', 'on a proper league Saturday'],
  Establishing: ['before a full, expectant stand', 'with cameras tracking his every touch', 'in the thick of a proper contest', 'with a lot of eyes on him', 'as a sell-out crowd leaned in', 'with the pundits watching for a reason to doubt him'],
};
// big-moment settings override the chapter setting when the stakes are high
const BIG_SETTINGS = ['in a white-hot derby', 'with the tie hanging in the balance', 'as tempers frayed and the stakes climbed', 'in a bruising six-pointer', 'with promotion on the line', 'under the lights, everything to play for', 'with the season threatening to turn on this one game', 'in the Boxing Day six-pointer', 'on Community Shield curtain-raiser day', 'under the floodlights on a European night', 'in the Youth Cup final', 'with a relegation rival in town', 'in a testimonial the old man deserved', 'as the away end bounced all afternoon'];
const HUGE_SETTINGS = ['in the cup final, the whole ground holding its breath', 'with the title on the line', 'on the grandest stage of his young life', 'as sixty thousand roared', 'in the last minute of the biggest game of the season', 'with silverware within touching distance', 'in front of a nation watching at home', 'in the derby to end all derbies', 'with promotion, the title, everything riding on ninety minutes', 'on a European night the whole city will remember', 'with the trophy close enough to touch', 'in a winner-takes-all decider', 'as the whole country stopped to watch'];

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
  latebloom: 'Better every single week, this lad.',
  showman: 'He plays with a grin and one eye on the crowd.',
  stoic: 'Nothing about his face ever gives it away.',
  hothead: 'It could go off at any second, and everyone knows it.',
  perfectionist: 'Even that wasn’t quite good enough, by his own standard.',
  joker: 'Somewhere in the huddle, he’s already found something to laugh about.',
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
  latebloom: ['growing into it,', 'sharper than last month,', 'still learning,'],
  showman: ['playing to the gallery,', 'with a flourish,', 'grinning,'],
  stoic: ['face like stone,', 'without a flicker,', 'utterly unmoved,'],
  hothead: ['jaw clenched,', 'simmering,', 'right on the edge,'],
  perfectionist: ['already dissecting it in his head,', 'never quite satisfied,', 'chasing the perfect version,'],
  joker: ['with a wink,', 'cracking a smile,', 'enjoying himself far too much,'],
};
// season-event prefixes (weave the chapter's story into the beat)
const EVENT_PREFIX: Record<string, string> = {
  'serious-injury': 'Still fighting his way back from a bad injury, ',
  'hot-streak': 'In the form of his life, ',
  slump: 'Low on confidence, ',
  'new-gaffer': 'Desperate to catch the new gaffer’s eye, ',
  knock: 'Carrying a knock he wouldn’t admit to, ',
  breakthrough: 'Riding the wave of a breakout season, ',
  'cup-run': 'Buzzing off a thrilling cup run, ',
  'transfer-links': 'Trying to tune out the transfer talk, ',
  'fan-favourite': 'Roared on by supporters who adore him, ',
};

// ── SCENARIO STORY: describe the SITUATION the player faces this turn (before he chooses) ──
const KIND_SETUP: Record<string, string[]> = {
  match: ['The game is finely poised.', 'The match hangs in the balance.', 'This is where games are won and lost.', 'The tempo is rising and the tackles are flying in.', 'Both sides are trading blows and neither will blink.', 'It’s scrappy, tight, and crying out for someone to take control.', 'The clock is ticking and the game needs a hero.', 'The ball has just broken loose in a dangerous area.', 'One mistake here and the game turns on its head.', 'The crowd senses something is about to happen.', 'A set-piece is coming and the shape needs to hold.', 'A wet pitch, a heavy ball, and a game turning into a battle of wills.', 'The visiting end has gone quiet — this is his chance to silence the home crowd.', 'A red card has left his side a man light, and someone has to step up.', 'It’s the last action of the half, and the whistle is seconds away.', 'A goal either way here changes the whole complexion of the match.', 'The opposition’s best player has gone quiet — someone else needs to be the difference.', 'A corner is about to be swung in, and the box is a scrum.'],
  training: ['On the training ground, the coaches are watching closely.', 'The gaffer has set up a pointed drill.', 'It’s a sharp session, and the staff want to see something specific.', 'Cones out, whistle sharp — this is a test dressed up as a drill.', 'A small-sided game, but the staff are marking cards.', 'Rondos done, now the real work: he’s being pushed today.', 'The fitness coach has set a target and is timing every rep.', 'A tactical shape drill, and the staff want it drilled right.', 'A one-on-one against the reserve-team hardman — no easy reps today.', 'Video session done; now he has to prove he took it in.', 'A recovery session the day after a hard match, legs like lead.', 'A specific weakness has been flagged, and today’s whole session is built around fixing it.', 'The analyst has pulled up clips of exactly what went wrong last time.', 'A friendly, low-key five-a-side that somehow always turns competitive.', 'Pre-season doubles: two sessions, no excuses, everyone watching the fitness numbers.', 'A youth-team kid has been drafted in to make up the numbers, and he’s not going easy.'],
  social: ['Away from the pitch, his character is being tested.', 'In the dressing room, the mood needs handling.', 'Off the field, who he is matters as much as how he plays.', 'A quiet word is needed, and everyone’s watching how he takes it.', 'The group dynamic is fragile, and he’s in the middle of it.', 'This one won’t show on the stat sheet — but it counts.', 'A senior pro has pulled him aside for a word he didn’t ask for.', 'The club wants an answer, and there’s no ducking this one.', 'Team-mates are watching to see what kind of character he really is.', 'Away from the cameras, this is the moment that shapes a reputation.', 'A team meal, and the seating plan says more than anyone will admit.', 'A young player has come to him for advice, and he isn’t sure he has any to give.', 'The captain has called a players-only meeting, and eyes keep flicking his way.', 'A club function, small talk with people who matter more than they let on.', 'A long coach journey home after a bad result, and the silence says everything.'],
  // LIFE-EVENT kinds (real mechanic — see career.ts Scenario.life / LIFE_CONSEQUENCE)
  contract: ['The agent’s phone won’t stop ringing. A big decision looms.', 'Money and loyalty are pulling in different directions.', 'A career-shaping choice has landed on his plate.', 'The club has put a number on the table, and it isn’t quite what he hoped.', 'A deadline day looms and terms still aren’t agreed.'],
  loan: ['A loan move is on the table — a fork in the road.', 'Stay and fight for minutes, or leave to find them elsewhere?', 'The club want him to go and toughen up somewhere real.', 'A smaller club wants him for the season, first-team football guaranteed.', 'Comfort at home, or a real chance somewhere colder and harder?'],
  setback: ['A very public mistake to bounce back from.', 'The headlines weren’t kind. Now he has to answer them.', 'Confidence dented, reputation on the line — this is about response.', 'A howler nobody will let him forget just yet.', 'The kind of week that either breaks a young player or forges him.'],
  media: ['A story has broken and his name is in it.', 'The papers have got hold of something, and now it’s everywhere.', 'Cameras and microphones where there used to be none — a storm to manage.', 'A quote, taken out of context, is doing the rounds.', 'Journalists camped outside training, all wanting the same answer.'],
  loyalty: ['The club he grew up supporting have come calling.', 'A boyhood dream is dangled in front of him — and it complicates everything.', 'Head or heart? The club of his childhood wants an answer.', 'The shirt he wore as a kid could be his to wear for real.', 'An old scarf in a drawer at home suddenly means everything again.'],
  role: ['The gaffer has laid out where he stands in the pecking order — and it isn’t where he hoped.', 'A blunt conversation about his role, and no easy way to take it.', 'Told plainly what he is and isn’t in this squad — now he has to respond.', 'A new signing in his position has changed the maths overnight.', 'Reduced to impact sub, and asked to be grateful for it.'],
  fallout: ['Words were said in the dressing room that can’t be unsaid.', 'A rift with a teammate has spilled out where everyone can see it.', 'The changing room has taken sides, and he’s in the middle of it.', 'A training-ground bust-up nobody quite wants to talk about.', 'An old friend in the squad now barely looks at him.'],
  injury_comeback: ['Weeks of rehab behind him, and the first minutes back feel like starting over.', 'His body says yes; his head still isn’t sure.', 'Cleared to play, but nobody — least of all him — knows if it’s too soon.', 'A tentative first tackle since the injury, and everything hinges on how it feels.', 'The physio room has become a second home; today he finally leaves it behind.'],
  transfer_rumour: ['His name is all over the transfer pages this week.', 'A release clause figure has somehow found its way into the papers.', 'Scouts from a bigger club were reportedly in the stands on Saturday.', 'His agent won’t confirm or deny it, which somehow says everything.', 'Team-mates keep asking if it’s true — he isn’t sure himself.'],
  manager_fallout: ['A blazing row with the manager after being hooked at half-time.', 'The gaffer publicly questioned his attitude, and it stung.', 'Frozen out of the manager’s plans overnight, for reasons nobody explained.', 'A training-ground disagreement that got louder than it should have.', 'The manager’s trust in him feels like it’s hanging by a thread.'],
  charity: ['A morning at a local school, a room full of kids who idolise him.', 'A hospital visit that puts the whole game into perspective.', 'His name attached to a cause bigger than football, for once.', 'A community coaching session on the pitch where it all started for him.', 'A charity match for an old team-mate whose career ended too soon.'],
  social_storm: ['An old post has resurfaced, and it’s spreading fast.', 'A throwaway comment online has become a full-blown story.', 'Thousands of strangers suddenly have an opinion about him.', 'A photo, taken without his knowledge, is everywhere by lunchtime.', 'His phone won’t stop buzzing, and none of it is good news.'],
  family_illness: ['A phone call from home changes everything, right before kick-off week.', 'A parent’s health scare has his mind a thousand miles from the training ground.', 'Torn between being where the team needs him and where his family does.', 'News from home he wasn’t ready to hear.', 'A hospital corridor, a waiting room, and a match he can barely think about.'],
  romance: ['Someone new in his life, and it’s starting to feel serious.', 'A big, public step in his relationship — the kind that can’t be undone.', 'Balancing a settling-down life with the chaos of a football schedule.', 'A quiet proposal, planned for months, finally about to happen.', 'The first time he’s introduced someone to the people who matter most.'],
};
// What the moment ASKS of him. Kept setting-neutral so it reads sensibly whether the
// situation is a training drill, a dressing-room moment or a cup tie (a drill is not
// "the kind of moment careers are remembered for" — that mismatch kills the immersion).
const DEMAND: Record<string, string[]> = {
  aggression: ['They want to see some steel from him.', 'It’s about winning the physical battle.', 'He needs to show he won’t be pushed around.', 'It calls for a bit of nastiness, in the right way.', 'This is a moment to plant a flag and not budge.', 'They need to see he can dish it out as well as take it.'],
  creativity: ['They’re looking for a spark of invention.', 'It wants imagination — something unexpected.', 'He needs a solution no one else can see.', 'It calls for a moment nobody saw coming.', 'The situation is crying out for a flash of ingenuity.', 'They want proof he can think a half-step ahead of everyone else.'],
  composure: ['It asks for a cool head under pressure.', 'The test is whether he can keep calm.', 'He needs to slow it down and stay in control.', 'It’s about not letting the moment get too big for him.', 'They want to see the pulse stay steady when it matters.', 'The test is simple: can he trust himself under the heat?'],
  teamwork: ['It’s about bringing others into the play.', 'They want to see him link it and share it.', 'It’s a test of how he lifts the players around him.', 'It calls for the unselfish option, not the flashy one.', 'They want to see him make someone else look good.', 'The moment rewards trust — giving it up and getting it back.'],
  leadership: ['They want him to take charge of this.', 'It’s a chance to show he can lead.', 'He needs to grab it and drag the rest with him.', 'It calls for someone to stand up and be counted.', 'They need a voice, and it might as well be his.', 'This is the kind of moment that either makes a captain or exposes one.'],
  stamina: ['It’s a test of his engine.', 'It comes down to who keeps going longest.', 'They want to see him cover every blade of grass.', 'It’s about the effort nobody notices until it’s missing.', 'The legs are tired — the question is whether his are, too.', 'They want to see if there’s anything left in the tank.'],
  flair: ['It’s a chance to show his imagination.', 'It’s the moment to try something bold.', 'They want to see a bit of magic from him.', 'It calls for something the coaching manual doesn’t cover.', 'This is the moment to back himself and go for broke.', 'They want to see him make it look easy when it isn’t.'],
  keeping: ['It’s down to him to keep them out.', 'It’s a test of his hands and his nerve.', 'They need him to be the wall behind them.', 'It calls for a shot-stopper’s stubbornness.', 'The moment needs a clean take and no fuss.', 'They want to see him command the space that’s his.'],
};
const pickFrom = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

// ── LIFE-STAGE FRAMING: a much wider bank of human, specific texture per age band — the stuff of an
// actual childhood/adolescence/career, not just a generic "he's young" clause. Keyed on the CHAPTER
// (band name) rather than a bare age bracket, so it lines up exactly with what that stage is really
// about (school and parents at Grassroots; digs and homesickness at Scholar; captaincy and legacy at
// Establishing) per the "much more human depth per band" brief.
const FRAME_BY_CHAPTER: Record<string, string[]> = {
  Grassroots: [
    'Homework still not done and Mum already shouting for the car, ', 'With Dad on the touchline in the cold, arms folded, willing him on, ',
    'Picked near-last at school again but not here, not on this pitch, ', 'A growth spurt has left him gangly and not quite sure where his own feet are, ',
    'Terrified of being dropped for Saturday after one bad training session, ', 'His new coach has spotted something in him nobody else has, ',
    'Still the smallest kid in his year at school, ', 'With his best mate from school lining up right beside him, ',
    'Fresh off a school report that mentioned football more than maths, ', 'Desperate to make the actual team, not just the bench, ',
  ],
  Academy: [
    'Bussed in after school again, kit bag heavier than his school one, ', 'Word is the coaches are trimming the squad soon, and nobody feels safe, ',
    'Another growth spurt, another summer of feeling like a stranger in his own body, ', 'Homework forgotten in his bag, again, ',
    'His mum still drives him to every single session without complaint, ', 'A new coach has arrived and the old certainties are gone, ',
    'Watching mates from school drift away as football swallows every weekend, ', 'Desperate to prove last week’s axing was a mistake, ',
    'Torn between the exam next week and the extra session tonight, ', 'Finally feeling like one of the good ones in this year group, ',
  ],
  Scholar: [
    'Homesick in digs that still don’t feel like home, ', 'A string of released team-mates has the whole dorm on edge, ',
    'An agent’s number saved in his phone for the first time, unsure whether to call it, ', 'A trial game against a bigger club’s youth side, everything riding on ninety minutes, ',
    'His coach has never once told him he’ll make it — and never once told him he won’t, ', 'The scholarship paperwork made it feel real for the first time, ',
    'Missing his own bed, his own kitchen, his own life, ', 'A fierce, needling rivalry with the lad who plays his exact position, ',
    'Grades slipping while the football consumes every hour, ', 'The academy director watching from the side, clipboard in hand, ',
  ],
  'Youth Team': [
    'Reserve football has taught him the game has real teeth, ', 'His agent is starting to make real calls on his behalf now, ',
    'A loan away is being quietly discussed, and it terrifies and thrills him in equal measure, ', 'Fighting a lad he used to room with for the same one shirt, ',
    'The first-team coach watched from the touchline again today — no idea what he made of it, ', 'Independence, a flat of his own, and nobody to tell him what time to be in, ',
    'Old digs-mates are already being released around him, ', 'A first taste of training with the senior pros, and it showed him how far there still is to go, ',
    'Money is starting to change hands and it feels strange to be worth something, ', 'His name mentioned, for the first time, in a first-team team-talk, ',
  ],
  Breakthrough: [
    'His agent is fielding calls he never used to get, ', 'The first proper contract talk of his life is looming, ',
    'A journalist wants "five minutes," and he still doesn’t trust himself with a microphone, ', 'The senior dressing room hasn’t fully let him in yet, ',
    'Transfer talk has started, and he can’t work out if it’s flattering or terrifying, ', 'His face is starting to appear where it never has before, ',
    'A veteran pro has taken it upon himself to test the new boy, ', 'The manager who gave him his chance is exactly the one he doesn’t want to let down, ',
    'His family still can’t quite believe what’s happening to him, ', 'One eye on the shirt he wants, one eye on the man currently wearing it, ',
  ],
  'First Team': [
    'Whispers of the captaincy have started, and he’s not sure he’s ready, ', 'The wages now support people who aren’t just him, ',
    'A run of poor form has the phone-ins circling, ', 'A kid from the academy looks at him the way he used to look at the senior pros, ',
    'His family life pulls at him just as hard as the football now does, ', 'Expectation sits on him like a second shirt, ',
    'The dressing room looks to him for the answer now, not the other way round, ', 'Somewhere between "promising" and "the finished article," and everyone can feel it, ',
    'A slump nobody can quite explain, least of all him, ', 'Money, fame and football pulling in three different directions at once, ',
  ],
  Establishing: [
    'The armband has his name on it more often than not these days, ', 'Younger lads at the club study the way he trains, ',
    'His investments matter almost as much as his form now, ', 'What he leaves behind is starting to matter more than what he does today, ',
    'A testimonial is being quietly discussed by people who assume he’ll retire a legend, ', 'His own kids are old enough to watch him play and understand it, ',
    'The next contract might be his last big one, and everyone in the building knows it, ', 'A younger version of himself is coming up through the ranks, watching, learning, waiting, ',
    'Reputation now precedes him into every room he walks into, ', 'He’s become the answer to the question a young pro used to ask about him, ',
  ],
};
/** Weave the age/chapter into the situation so a 12-year-old on a park pitch reads unlike a 23-year-old. */
function ageFraming(rng: () => number, age?: number, chapter?: string): string {
  if (chapter && FRAME_BY_CHAPTER[chapter]) return pickFrom(rng, FRAME_BY_CHAPTER[chapter]);
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

// ── HUGE MOMENTS (stakes 3 — the rarest, biggest occasions: cup finals, title deciders, promotion
// play-offs) get a genuine multi-beat sequence instead of one sentence: a TENSION build-up before the
// card is even played, then (on top of the usual result/reaction) an AFTERMATH line on how it's REMEMBERED
// — the kind of standout peak a 200-turn career should have only a handful of.
const HUGE_TENSION = [
  'Ninety minutes of football have come down to this one moment.', 'Everything he has worked for since he was a boy is riding on the next few seconds.',
  'The whole stadium seems to hold its breath at once.', 'This is the moment careers are actually remembered for.',
  'Every eye in the ground, and plenty watching at home, are on him right now.', 'There is no bigger stage than this, and it has fallen to him.',
];
const HUGE_AFTERMATH: Record<'triumph' | 'good', string[]> = {
  triumph: ['This is the moment they’ll show highlight reels of for years.', 'Whatever happens next in his career, this will be the moment people bring up first.', 'Somewhere, a boy watching at home just decided he wants to be a footballer.', 'This is the kind of moment a statue gets built on.'],
  good: ['It won’t make the front pages, but everyone inside the stadium knows what it meant.', 'Not the headline act, but exactly the moment the team needed from him.', 'A quiet, vital contribution on the biggest of stages.'],
};
const HUGE_AFTERMATH_BAD = ['It’s the kind of moment that follows a player around for a long time.', 'The biggest stage has a way of finding a player’s weakest moment — and it just did.', 'He will replay this one in his head for longer than he’d like.', 'Not every big-stage story has a happy ending, and this is one of them.'];

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
  // HUGE moments (stakes 3) get a genuine multi-beat sequence: tension build-up before, a remembered-by
  // aftermath after — the standout peaks a long career should have only a handful of.
  const tension = ctx.stakes === 3 ? pick(HUGE_TENSION) + ' ' : '';
  const aftermath = ctx.stakes === 3
    ? ' ' + (b === 'triumph' ? pick(HUGE_AFTERMATH.triumph) : b === 'good' ? pick(HUGE_AFTERMATH.good) : b === 'poor' || b === 'dismal' ? pick(HUGE_AFTERMATH_BAD) : '')
    : '';
  return `${tension}${milestone}${cap(lead)}, ${action} ${cardName} ${result}. ${reaction}${flavor}${castReact}${aftermath}`;
}

// ── LIFE EVENTS: the resolution beat for a mid-chapter dilemma (see career.ts Scenario.life /
// LIFE_CONSEQUENCE). Distinct from narratePlay — these read like a real off-pitch moment resolving, not
// a football action, though the CARD is still named (it's the trait/approach he leans on to get through it).
const LIFE_APPROACH = ['He falls back on', 'It’s', 'He leans on', 'What gets him through it is', 'He draws on'];
const LIFE_RESOLUTION: Record<string, { good: string[]; bad: string[] }> = {
  contract: {
    good: ['and terms are agreed — a weight off everyone’s shoulders.', 'and the club gets its man signed, both sides happy with the number.', 'and the negotiation ends in a handshake, not a stand-off.'],
    bad: ['and talks stall — the whole thing drags into another window.', 'and it turns sour; trust with the club takes a hit.', 'and he walks away feeling short-changed, and it shows.'],
  },
  loan: {
    good: ['and the move is made on his terms — a fresh start, eyes open.', 'and everyone leaves the room agreeing it’s the right call.', 'and he heads out the door with the club’s blessing, not its doubts.'],
    bad: ['and the decision leaves a sour taste, whichever way it goes.', 'and he second-guesses himself the moment it’s made.', 'and it feels less like a choice than a shove out the door.'],
  },
  setback: {
    good: ['and the response silences the doubters faster than anyone expected.', 'and he answers the only way that matters — with performance.', 'and the story quietly dies a day later.'],
    bad: ['and the mistake follows him round for weeks.', 'and the response only adds fuel to the story.', 'and confidence takes another knock right when he needed it least.'],
  },
  media: {
    good: ['and he handles the cameras like he’s done it for years.', 'and the story fizzles out, exactly as he hoped.', 'and even the press pack seem to respect how he took it.'],
    bad: ['and one clumsy line becomes the only thing anyone remembers.', 'and the story runs longer than it ever should have.', 'and he comes off looking worse than the situation deserved.'],
  },
  loyalty: {
    good: ['and the boyhood club gets its answer, and it’s the right one for him.', 'and he makes peace with the decision, whichever way it fell.', 'and even the ones disappointed respect how he handled it.'],
    bad: ['and he second-guesses the decision almost immediately.', 'and somebody, somewhere, feels betrayed by the choice.', 'and it’s handled clumsily enough to leave a mark.'],
  },
  role: {
    good: ['and he takes the honest conversation on the chin, and it earns respect.', 'and he turns a demotion into fuel rather than a grudge.', 'and the gaffer notices the maturity in how he took it.'],
    bad: ['and the resentment is obvious to everyone in the building.', 'and the sulk does him no favours with the manager.', 'and it curdles into a much bigger problem than it needed to be.'],
  },
  fallout: {
    good: ['and the two of them clear the air like adults.', 'and the dressing room breathes a sigh of relief.', 'and it’s forgotten by the next training session.'],
    bad: ['and the rift only gets wider.', 'and the dressing room quietly picks sides.', 'and it lingers, unresolved, for weeks.'],
  },
  injury_comeback: {
    good: ['and the body holds up — a proper return, at last.', 'and the confidence comes flooding back with the first good touch.', 'and the physio room finally feels like history.'],
    bad: ['and there’s a wince nobody wants to see so soon.', 'and the doubt creeps straight back in.', 'and the comeback stalls before it’s properly begun.'],
  },
  transfer_rumour: {
    good: ['and he lets his football do the talking, and it goes quiet.', 'and he handles the noise without it touching his form.', 'and the speculation rolls off him like water.'],
    bad: ['and the distraction shows up in his performances.', 'and the story only grows louder for the lack of a denial.', 'and the dressing room starts to wonder if he even wants to stay.'],
  },
  manager_fallout: {
    good: ['and the two of them find a way back to something workable.', 'and a clear-the-air conversation actually clears the air.', 'and the manager’s trust, slowly, starts to return.'],
    bad: ['and the relationship never quite recovers.', 'and he finds himself further from the team than ever.', 'and the manager’s patience looks to be running out.'],
  },
  charity: {
    good: ['and it’s the kind of day that reminds everyone, including him, why it all matters.', 'and the goodwill it earns him is worth more than any headline.', 'and he leaves with a perspective the training ground can’t give him.'],
    bad: ['and even this, somehow, gets twisted into a story about him.', 'and he can’t quite hide that his mind is elsewhere.', 'and it feels more like an obligation ticked off than anything felt.'],
  },
  social_storm: {
    good: ['and a calm, measured response takes the sting out of it within a day.', 'and he refuses to feed it, and it dies down.', 'and the club’s media team quietly thank him for how he handled it.'],
    bad: ['and it snowballs into something much bigger than it should have been.', 'and the reaction only pours fuel on it.', 'and it’s still being talked about a week later.'],
  },
  family_illness: {
    good: ['and being there for his family, for once, comes before anything else — and everyone at the club understands.', 'and he finds a strength in it he didn’t know he had.', 'and, difficult as it is, the people who matter most know he showed up.'],
    bad: ['and the weight of it never quite leaves him, even back on the training ground.', 'and it’s an emptiness no result can fill this week.', 'and he goes through the motions, mind a thousand miles away.'],
  },
  romance: {
    good: ['and it’s a rare, uncomplicated kind of happy.', 'and a settled home life starts to show in his football too.', 'and, for once, the biggest headline in his life has nothing to do with football.'],
    bad: ['and the timing, as ever, could not be worse.', 'and something has to give, and it’s not obvious what.', 'and he handles it clumsily, the way anyone might.'],
  },
};
/** The resolution beat for a mid-chapter LIFE EVENT (contract standoff, loan call, media storm, etc.) —
 *  distinct from narratePlay: this reads like an off-pitch moment resolving, using the same success band. */
export function narrateLifeEvent(kind: string, cardName: string, success: number, ctx: NarrateCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const good = band(success) === 'triumph' || band(success) === 'good';
  const table = LIFE_RESOLUTION[kind] ?? LIFE_RESOLUTION.setback;
  const resline = pick(good ? table.good : table.bad);
  const approach = pick(LIFE_APPROACH);
  const cast = ctx.careerSeed != null ? careerCast(ctx.careerSeed) : null;
  const castReact = cast && rng() < 0.3 && good
    ? ' ' + pick([`${cast.gaffer} appreciates how he handled it.`, `Even ${cast.rival} would admit that was well played.`, `His agent breathes a quiet sigh of relief.`])
    : '';
  return `${approach} ${cardName} ${resline}${castReact}`;
}

// ── RIVALRY STORYLINE: the seeded academy rival isn't just a number to chase — a slice of big-stage MATCH
// moments (see career.ts Scenario.rival) are framed as a straight head-to-head against him, with a real
// consequence (RIVAL_CONSEQUENCE) attached and a narrative payoff that names the actual lead swing.
const RIVAL_SETUP = [
  '{rival} is out there today too — right in his eye line the whole game.', 'Everyone in the ground knows the subplot: him against {rival}, all over again.',
  'This one always means a little more when {rival}’s on the other side.', 'He can see {rival} warming up down the other end — old habits, old rivalries.',
  '{rival} has never quite let him forget the last time these two met.', 'The whispers in the tunnel all say the same thing: settle it against {rival}, right here.',
];
const RIVAL_RESOLUTION = {
  good: [
    'and he gets the better of {rival} again — the story of their whole rivalry, really.', 'and it’s one more for the ledger against {rival}.',
    'and {rival} has no answer for it — none at all.', 'and the bragging rights are his, at least until next time.',
  ],
  bad: [
    'and {rival} gets the better of this one.', 'and it’s {rival}’s turn to enjoy the bragging rights.',
    'and he can’t find an answer to {rival} today.', 'and {rival} will not let him forget this one in a hurry.',
  ],
};
/** The SITUATION for a rivalry-flagged big moment — call before the card is played. */
export function rivalMomentStory(rivalName: string, moment: string | null, ctx: ScenarioCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const setup = pickFrom(rng, RIVAL_SETUP).replace('{rival}', rivalName);
  return moment ? `It’s ${moment} — and ${setup.charAt(0).toLowerCase() + setup.slice(1)}` : setup;
}
export interface RivalPayoff { rivalName: string; leadBefore: number; leadAfter: number }
/** The RESOLUTION beat for a rivalry moment — names the actual lead swing (overtook him / fell behind). */
export function narrateRivalMoment(cardName: string, success: number, ctx: NarrateCtx, payoff: RivalPayoff): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const good = band(success) === 'triumph' || band(success) === 'good';
  const resline = pick(good ? RIVAL_RESOLUTION.good : RIVAL_RESOLUTION.bad).replace(/{rival}/g, payoff.rivalName);
  const swing = payoff.leadBefore < 0 && payoff.leadAfter >= 0 ? ` He’s overtaken ${payoff.rivalName} in the race that matters most to him.`
    : payoff.leadBefore >= 0 && payoff.leadAfter < 0 ? ` ${payoff.rivalName} has just gone back ahead of him — and it stings.`
    : '';
  return `He goes to work on ${cardName} ${resline}${swing}`;
}
// ── SHOCK CALL-UP: the seeded reskin of a first-teamer going down hours before kickoff (see
// career.ts Scenario.callup) — nervier framing than a routine big game, a bigger reward for standing up
// to it. Real anecdote behind it: Sammy McIlroy told four hours before kickoff in 1971, scored on debut.
const CALLUP_SETUP = [
  'The phone call came four hours before kick-off — someone’s gone down injured, and it’s him in the XI.', 'He was warming the bench for the reserves; now the physio is strapping HIS ankle for the first team.',
  'A late fitness test has failed. No time to think about it — he’s starting.', 'Suspension, a red card review, a withdrawal — whatever the reason, the sheet has his name on it tonight.',
  'The kit man is already laying his shirt out in the home dressing room. Nobody warned him this morning.', 'One phone call and his whole week changed — he’s starting, and there’s no time left to be nervous about it.',
];
const CALLUP_RESOLUTION = {
  good: [
    'and he looks like he’s been starting there for years.', 'and the shock call-up becomes the best story of his career so far.',
    'and nobody in that stadium would ever guess he found out four hours ago.', 'and it’s the kind of debut managers dream of handing a kid.',
  ],
  bad: [
    'and the nerves get the better of him.', 'and it’s a chastening first taste of it, the kind you learn from.',
    'and the step up shows, painfully, just how big it is.', 'and he looks every inch a boy thrown in before he was ready.',
  ],
};
/** The SITUATION for a shock call-up — call before the card is played. */
export function callupMomentStory(moment: string | null, ctx: ScenarioCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const setup = pickFrom(rng, CALLUP_SETUP);
  return moment ? `It’s ${moment} — and ${setup.charAt(0).toLowerCase() + setup.slice(1)}` : setup;
}
/** The RESOLUTION beat for a shock call-up. */
export function narrateCallupMoment(cardName: string, success: number, ctx: NarrateCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const good = band(success) === 'triumph' || band(success) === 'good';
  const resline = pick(good ? CALLUP_RESOLUTION.good : CALLUP_RESOLUTION.bad);
  const cast = ctx.careerSeed != null ? careerCast(ctx.careerSeed) : null;
  const reax = cast && rng() < 0.3
    ? ' ' + (good ? `${cast.gaffer} could not have asked for more.` : `${cast.gaffer} will give him another chance — everyone gets one bad night.`)
    : '';
  return `Thrown in cold, he goes to work on ${cardName} ${resline}${reax}`;
}

// Deterministic "news" about the rival's own career — surfaced as a small ticker alongside the score, so
// he feels like a real career unfolding in parallel, not just a number that climbs on a fixed schedule.
const RIVAL_NEWS: Record<string, string[]> = {
  Grassroots: ['is turning heads in the district league too.', 'has just been picked up by a bigger local side.', 'scored a hat-trick at the weekend — word travels fast.'],
  Academy: ['has been fast-tracked up an age group.', 'picked up an injury that will keep him out for a spell.', 'is the other name scouts keep mentioning in the same breath.'],
  Scholar: ['has signed his own scholarship forms at a rival academy.', 'is being talked about as the standout of his year group.', 'had a quiet trial and it showed.'],
  'Youth Team': ['has broken into a reserve side of his own.', 'is on the fringes of a first-team squad now.', 'picked up his first taste of first-team training this month.'],
  Breakthrough: ['has made his own first-team debut.', 'is being linked with a move across the city.', 'scored the winner in a game that made the papers.'],
  'First Team': ['has just signed a new long-term contract.', 'was named in a team of the season shortlist.', 'is dealing with a loss of form of his own.'],
  Establishing: ['has been given the captain’s armband at his club.', 'is being talked about for a testimonial of his own.', 'is closing in on a personal milestone.'],
};
/** A small seeded "news" beat about the rival's own career, appropriate to the current life stage. */
export function rivalNews(seed: number, chapter: string): string {
  const bank = RIVAL_NEWS[chapter] ?? RIVAL_NEWS.Establishing;
  const rng = mulberry32((seed ^ 0x1a2b3c) >>> 0);
  return pickFrom(rng, bank);
}

// ── NON-PLAY CHOICES: a flavour beat when he appoints a coach, drafts a card, or takes an offer ──
export function narrateCoach(name: string, kind: string, specialty: string[], ctx: NarrateCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const role = kind === 'mentor' ? 'mentor' : 'coach';
  const spec = specialty.slice(0, 2).join(' and ') || 'his all-round game';
  const cast = ctx.careerSeed != null ? careerCast(ctx.careerSeed) : null;
  const nod = cast && rng() < 0.35 ? ` ${cast.gaffer} approves of the appointment.` : '';
  return pickFrom(rng, [
    `He’s put himself under ${name}, a ${role} who’ll sharpen his ${spec}.`,
    `${name} takes him on — the kind of ${role} who lives and breathes ${spec}.`,
    `A new voice in his ear: ${name}, brought in to hone his ${spec}.`,
    `Under ${name} now — every session bent towards ${spec}.`,
  ]) + nod;
}
export function narrateDraft(cardName: string, _tags: string[], ctx: NarrateCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  return pickFrom(rng, [
    `He’s added ${cardName} to his game — another string to his bow.`,
    `${cardName}, drilled and drilled until it’s second nature.`,
    `A new weapon in the locker: ${cardName} is part of who he is now.`,
    `Hours on the training ground pay off — ${cardName} is his to call on.`,
  ]);
}
export function narrateOffer(name: string, effs: { earn: number; greed: number; market: number; form: number }, ctx: NarrateCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const cast = ctx.careerSeed != null ? careerCast(ctx.careerSeed) : null;
  const money = effs.earn > 0, dev = effs.form > 0;
  if (money && !dev) return pickFrom(rng, [`He took the money — ${name}. The bank balance swells; the purists wince.`, `${name}: he cashed in. Who could blame a young man from where he started?`, `The chequebook won out. ${name}, signed.`]);
  if (dev && !money) return pickFrom(rng, [`He turned down the payday to keep growing — ${name}. The long game.`, `${name}: development over dollars. ${cast ? cast.gaffer + ' nodded.' : 'The staff nodded.'}`, `Patience over pounds — ${name}. A mature head on young shoulders.`]);
  return pickFrom(rng, [`A big call off the pitch: ${name}.`, `${name} — a decision that will shape more than his bank balance.`, `Off the field, ${name} — the kind of choice that defines a career.`]);
}

// ── CHAPTER RECAP + GRADUATION EPILOGUE (the story-so-far beats) ──
export interface RecapCtx { chapter: string; nextChapter?: string | null; age: number; careerSeed: number; personalityId?: string; overall?: number; seasonEventId?: string | null }
/** A short "the story so far" passage shown at an age-chapter boundary. */
export function chapterRecap(ctx: RecapCtx): string {
  const rng = mulberry32(((ctx.careerSeed >>> 0) ^ Math.imul(ctx.age, 2654435761)) >>> 0);
  const cast = careerCast(ctx.careerSeed);
  const openers: Record<string, string[]> = {
    Grassroots: ['The park-pitch years are behind him now.', 'It began, as these things do, on a cold Sunday morning.', 'Muddy knees and orange segments at half-time — that was the start of it.', 'Nobody scouted him then. Nobody needed to.'],
    Academy: ['The academy has shaped him.', 'Two seasons of drills, van journeys and hard lessons.', 'Cones, ladders, video sessions — the academy grind, day after day.', 'He learned the game properly here, whether he liked it or not.'],
    Scholar: ['The scholarship years tested more than his football.', 'A scholar now — the game got serious, and so did he.', 'Digs, homework, double sessions — the sacrifices started to add up.', 'The letters after his name changed. So did the expectations.'],
    'Youth Team': ['The youth team taught him the game has teeth.', 'Reserve football is unglamorous — and it has toughened him.', 'Empty stands, cold Tuesday nights, and men twice his age kicking lumps out of him.', 'The kid gloves came off in the youth ranks.'],
    Breakthrough: ['The breakthrough came, as it had to.', 'The first-team door has creaked open.', 'A phone call, a training-ground nod, and suddenly he belonged with the big boys.', 'The gap between reserve and first team closed faster than anyone expected.'],
    'First Team': ['He is a first-team regular now — the shirt his to keep.', 'Week after week, he answered the bell.', 'The name on the team sheet stopped being a surprise.', 'He stopped looking over his shoulder and started setting the standard.'],
    Establishing: ['He belongs here now.', 'No longer the kid — a fixture, a name.', 'The dressing room defers to him a little more with each passing month.', 'Younger lads watch how he trains now. That tells you everything.'],
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
    latebloom: 'He was never the best kid in the room — until, quietly, he was.',
    showman: 'He always played with a grin, and the crowd always grinned back.',
    stoic: 'Nobody ever quite worked out what was going on behind those eyes. Maybe that was the point.',
    hothead: 'The temper cost him as much as it won him — and it won him plenty.',
    perfectionist: 'He was never once satisfied. It’s exactly why he got this far.',
    joker: 'He never took himself too seriously. Everyone else took him plenty seriously enough.',
  };
  const pers = ctx.personalityId && persLine[ctx.personalityId] ? ' ' + persLine[ctx.personalityId] : '';
  const start = pickFrom(rng, [
    'It started on a park pitch with jumpers for goalposts.', 'Fifteen years ago he was the smallest kid on a muddy rec.', 'From a scatter of parents on a touchline to this.',
    'A school report once said he needed to concentrate less on football and more on his times tables.', 'He can still remember the exact colour of his first proper boots.',
    'Somewhere there’s a photo of him, aged ten, grinning with a medal too big for a ten-year-old’s neck.',
  ]);
  const close = pickFrom(rng, [
    `${cast.gaffer} always said he’d make it. He was right.`, `${cap0(cast.mentor)} shook his hand and said little. He didn’t need to.`, `Somewhere, ${cast.rival} is watching, and wondering.`,
    `His family were there for every step of it — and they’re still there now.`, `${cast.captain} is already talking about a dressing room with him in it.`,
    `Fifteen years of Sunday mornings and van journeys, and it was worth every single one.`,
  ]);
  return `${start} At twenty-five, ${ctx.name} emerges as ${tier}.${pers} ${close}`;
}
