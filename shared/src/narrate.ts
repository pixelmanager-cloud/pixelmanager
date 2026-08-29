// Career-game NARRATION — turns each card you play into a beat in a real person's life. Deterministic
import { KIND_SETUP } from './prompts/kind_setup.js';
import { DEMAND } from './prompts/demand.js';
import { FRAME_BY_CHAPTER } from './prompts/frame.js';
import { CHILD_SETUP } from './prompts/child_setup.js';
import { SETTINGS } from './prompts/settings.js';
import { EVENT_PREFIX } from './prompts/event_prefix.js';
import { BIG_SETTINGS } from './prompts/big_settings.js';

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

// (seeded from the career + turn), so a career replays identically and reads like a story. The tone
// shifts with the player's AGE/chapter, the STAKES of the moment, how WELL it came off, his TEMPERAMENT,
// the recurring CHARACTERS around him, and whatever SEASON EVENT is coloring the chapter. No LLM —
// seeded template composition with a wide vocabulary so it rarely repeats.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface NarrateCtx {
  age: number; chapter: string; stakes: 1 | 2 | 3; personalityId: string; turn?: number;
  /** the moment's kind — big-occasion match prose must not land on training/off-pitch moments (PT-147) */
  kind?: 'match' | 'social' | 'training';
  seasonEventId?: string | null; seed: number; careerSeed?: number;
  /** the player's family surname — cast names avoid colliding with it (PT-141) */
  castAvoid?: string;
  /** a milestone this beat represents (first goal, debut, cup-final delivery…) — special-cased */
  milestone?: string | null;
}
export interface ScenarioCtx {
  seed: number; age?: number; chapter?: string; seasonEventId?: string | null; careerSeed?: number; turn?: number; castAvoid?: string;
}

// ── RECURRING CHARACTERS: a small seeded cast, stable across a whole career (derived from careerSeed) ──
const GAFFER_NAMES = ['Hargreaves', 'Doyle', 'Ferreira', 'Brandt', 'Okonkwo', 'Salgado', 'Whelan', 'Redmond', 'Ashcroft', 'Vasquez', 'Kowalski', 'Mbeki'];
const RIVAL_NAMES = ['Turner', 'Bianchi', 'Novak', 'Halvorsen', 'De Groot', 'Adeyemi', 'Rossi', 'Lindqvist', 'Marchetti', 'Bauer'];
const MENTOR_NAMES = ['old Franny', 'the veteran Delgado', 'club legend Pearce', 'wily old Ivanov', 'the skipper-emeritus Blake', 'grizzled Marcus Reid'];
const CAPTAIN_NAMES = ['skipper Voss', 'captain Ellery', 'the armband-wearer Sokol', 'skipper Da Silva', 'club captain Hendricks'];
export interface CareerCast { gaffer: string; rival: string; mentor: string; captain: string }
/** The seeded recurring cast. `avoid` (the player's family surname) is skipped so the coach/rival/mentor/captain
 *  never share the bloodline's own name — "Coach Okonkwo" for the Okonkwo family reads as a bug (PT-141). This
 *  rng is careerCast-local (seeded only from careerSeed, not the career's main stream), so the collision-skip
 *  never perturbs career replay. */
// `avoid` is REQUIRED (pass undefined deliberately if you mean it). It was optional, and three call sites
// simply forgot it — the story-arc branch, the chapter recap and the graduation epilogue — so the seeded
// rival renamed himself between the arc you were reading and the recap of the chapter it was in. An
// optional argument that must not be omitted is a bug waiting for a new call site; the compiler can hold
// this invariant and a grep cannot. (PT-602)
export function careerCast(careerSeed: number, avoid: string | undefined): CareerCast {
  const rng = mulberry32((careerSeed >>> 0) ^ 0x9e3779b9);
  const av = (avoid ?? '').trim().toLowerCase();
  const pick = (a: readonly string[]): string => {
    let i = Math.floor(rng() * a.length);
    for (let guard = 0; av && a[i].toLowerCase().includes(av) && guard < a.length; guard++) i = (i + 1) % a.length;
    return a[i];
  };
  return { gaffer: pick(GAFFER_NAMES), rival: pick(RIVAL_NAMES), mentor: pick(MENTOR_NAMES), captain: pick(CAPTAIN_NAMES) };
}



// tag-specific triumph colour — occasionally used instead of a generic result so a flair moment reads
// unlike a keeping one (per-tag result colour)
// Replaces the generic result on 55% of triumphs — the game's reward line — and it was a straight
// coin-flip between two options per tag, so one string landed 12x in a single career. Six each. (PT-406)
const TAG_TRIUMPH: Record<string, string[]> = {
  aggression: ['and the whole midfield bent to his will', 'and the opponent thought twice after that',
    'and the game had a new centre of gravity', 'and nobody fancied the next duel with him',
    'and he simply refused to be second to it', 'and the tempo became whatever he decided it was'],
  creativity: ['and it split the pitch open like a scalpel', 'and nobody else on the field had seen the pass',
    'and the defence was still turning when the ball arrived', 'and it came from a picture only he had',
    'and the obvious ball never even occurred to him', 'and geometry seemed to bend for a second'],
  composure: ['and you’d never have known the stakes', 'and time seemed to slow around him',
    'and the noise might as well not have existed', 'and his pulse never troubled itself',
    'and he took the extra half-second nobody else had', 'and the panic around him never reached his feet'],
  flair: ['and the crowd came up as one', 'and grown adults gasped',
    'and the away end applauded despite themselves', 'and it will be on a screen somewhere for years',
    'and there was an audible intake of breath', 'and someone in the stand simply started laughing'],
  leadership: ['and suddenly the whole team stood taller', 'and the tie turned on that act of will',
    'and ten other players remembered what they were there for', 'and the heads that had dropped came back up',
    'and he dragged the rest of them into it', 'and the belief arrived from somewhere, all at once'],
  teamwork: ['and it was a goal built by six players and finished by one', 'and the move was a thing of collective beauty',
    'and every pass in it had been unselfish', 'and it was the whole team in one movement',
    'and nobody could tell you who deserved the credit', 'and it was a training-ground drill made flesh'],
  stamina: ['on legs that had no right to carry him', 'when everyone else had emptied the tank',
    'in the ninety-fourth minute of a game he had run all night', 'long after the rest had stopped making the run',
    'with a body that had asked to stop an hour earlier', 'because he was the only one still able to get there'],
  keeping: ['and he saved his side single-handed', 'and the striker held his head in disbelief',
    'and it was the save of the season, whatever comes next', 'and he got a hand to something he had no right to reach',
    'and the goal simply refused to happen', 'and his defenders just looked at each other'],
};
// results + reactions by outcome band (≥6 each)
// register spread within each band so a long career doesn't read one emotional note throughout — wry,
// tender, tense and flatly matter-of-fact lines sit alongside the straightforwardly triumphant/dismal ones.
const RESULTS: Record<string, string[]> = {
  triumph: ['and it was sublime', 'and it came off brilliantly', '— pure, unarguable quality', 'and it was worth the admission alone', 'and the whole thing was a joy to watch', 'and he made it look absurdly easy', 'and jaws hit the floor', 'and it was the moment of the match', '— and that, really, is that', 'and there’s something almost tender in how easy he makes it look'],
  good: ['and it came off', 'and it did the job well', '— a good, clean piece of play', 'and it worked a treat', 'and it was tidy, assured stuff', 'and he executed it without fuss', 'and it drew a ripple of approval', 'and it was exactly the right call', '— nothing spectacular, just correct', 'and it’s the kind of moment nobody but the coaches will ever mention again'],
  mixed: ['with mixed results', '— not quite clean, but it held up', 'and just about got away with it', 'in fits and starts', '— the right idea, roughly done', 'and it half-worked', '— ambition outrunning execution', 'and it was a qualified success', 'and somewhere between the two, a shrug will do'],
  poor: ["but it didn't come off", 'and it fell flat', 'only for it to unravel', 'and the moment slipped away', 'but the execution let him down', 'and it came to nothing', 'and the chance evaporated', 'and, quietly, he knows exactly why'],
  dismal: ['and it went badly wrong', '— a moment to forget', 'and it fell apart completely', 'and he was left red-faced', 'and it was a total mess', 'and the crowd groaned', 'and it was a genuine howler', 'and there’s a strange, dark humour in just how wrong it went'],
};
const REACTIONS: Record<string, string[]> = {
  triumph: ['The coaches exchanged a look.', 'You could feel the buzz ripple round the ground.', 'A statement.', 'Scouts scribbled.', 'The bench was on its feet.', 'One for the highlight reel.', 'Even the opposition applauded.', 'That one will be talked about.', 'Somebody, somewhere, will tell this story wrong in twenty years.', 'The kind of thing that gets a kid remembered.', 'Pure theatre.', 'That is why they come to watch.', 'A moment he’ll replay in his head for weeks — for the right reasons.'],
  good: ['A nod from the gaffer.', 'Good habits.', 'Quietly impressive.', 'The staff liked that.', 'Ticked a box.', 'Exactly what was asked.', 'Solid, dependable stuff.', 'Nothing to write home about — but nothing to hide, either.', 'Coach-pleasing stuff.', 'The unglamorous work, done right.', 'Another brick in the wall.', 'Reliable — and that counts for plenty.'],
  mixed: ['Something to work on.', 'Raw, but there.', 'Room to grow.', 'A shrug from the bench.', 'Half a mark.', "There's a player in there.", 'The talent is obvious; the polish isn’t — yet.', 'Filed under needs-work, not panic.', 'Promising, if unpolished.', 'The intent was right, at least.', 'One for the review room.', 'Better than it looked, maybe.'],
  poor: ['The gaffer frowned.', 'A lesson, that.', 'Back to the training ground.', 'He knew it, too.', 'Words at half-time, surely.', 'File under learning.', 'A teachable moment.', 'Not the end of the world. Doesn’t feel like that right now, though.', 'Chalk it up and move on.', 'A wince from the touchline.', 'He’ll stew on that one.', 'Learn it now, not later.'],
  dismal: ['Heads dropped.', 'One to bury and move on from.', 'The bench winced.', 'A long walk back to the halfway line.', 'The gaffer looked away.', 'Best forgotten.', 'He’ll want the ground to swallow him.', 'Somewhere, someone is already making a joke of it.', 'You could hear a pin drop on the bench.', 'A moment he’ll want deleted.', 'The gaffer’s jaw tightened.', 'File it under never again.'],
};
// park/school-football reactions for the youngest chapters — no stadiums, benches, scouts or "the ground"
// (that senior-crowd vocabulary jars against jumpers-for-goalposts) (PT-103)
const CHILD_REACTIONS: Record<string, string[]> = {
  triumph: ['The parents on the touchline cheered.', 'His mates mobbed him.', 'The coach grinned and clapped.', 'One the whole school will hear about on Monday.', 'A dad on the sideline actually gasped.', 'The kind of goal you dream about in the back garden.', 'His best mate couldn’t believe it.', 'He’ll be buzzing about it all week.'],
  good: ['A thumbs-up from the coach.', 'His mum smiled from the sideline.', 'Good, solid stuff for his age.', 'The coach nodded — he liked that.', 'Exactly what was asked of him.', 'Quietly getting the hang of it.'],
  mixed: ['Something to practise in the garden.', 'Raw, but the spark is there.', 'A “keep at it” from the coach.', 'Getting there, slowly.', 'The idea was right, at least.', 'One to work on at training.'],
  poor: ['The coach called him over for a quiet word.', 'A lesson for a young lad.', 'Back to practising at the park.', 'He knew it straight away.', 'Nothing a bit of practice won’t fix.', 'Chin up — he’s still learning.'],
  dismal: ['His head dropped.', 'One to shake off — he’s only a kid.', 'A long trudge back for the restart.', 'He’ll want to forget that one.', 'His mates will remind him for weeks.', 'Not his finest hour on the park.'],
};
// per-personality VOICE: colours the beat throughout. Multiple OUTCOME-NEUTRAL variants per temperament so
// it doesn't recycle one line every game, and reads fine on a win OR a loss (observations about the player,
// never praise for a poor result). Playtest fix PT-3.
const PERSONALITY: Record<string, string[]> = {
  maverick: ['He never does it the easy way.', 'Always the unexpected with him.', 'He’d find a hard way through an open door.', 'Predictable is the one thing he’ll never be.', 'The coaching manual doesn’t have a page for him.', 'He sees a pass nobody else is even looking for.', 'Method to the madness, usually.', 'You don’t coach that out of a player — you just hope he aims it well.', 'He\'d rather be wrong his own way than right someone else\'s.', 'The staff have stopped trying to standardise him.', 'There is always a simpler option, and he is rarely interested in it.', 'Watching him is never dull, whatever else it is.'],
  fragile: ['The nerves were written all over him.', 'You could see the doubt flicker.', 'He carries the weight visibly.', 'Confidence comes and goes with this one.', 'One kind word away from his best, one harsh one from his worst.', 'The talent has never been the question with him.', 'He feels every moment twice as hard as most.', 'A settled head would unlock so much more.', 'He needs an arm round him more than a rollicking.', 'The head goes before the legs ever do.', 'On a good day you forget he was ever in doubt.', 'He believes the bad reviews and not the good ones.'],
  leader: ['The armband would suit him.', 'Others look to him without thinking.', 'He sets the tone, good day or bad.', 'A voice the dressing room follows.', 'He drags the players around him up a level.', 'The kind who’s loudest when it’s quietest.', 'Responsibility seems to make him bigger, not smaller.', 'You can build a team around a head like his.', 'He speaks last and everyone waits for it.', 'The younger ones copy how he warms up.', 'He takes the blame that isn’t his and passes on credit that is.', 'A captain long before anyone gives him the armband.'],
  biggame: ['He lives for these.', 'The bigger the stage, the more he shows up.', 'Occasions like this find him.', 'He’s built for the spotlight.', 'The nerves that shrink others seem to feed him.', 'Give him a crowd and a cause and watch.', 'The routine games bore him; the huge ones wake him.', 'He saves his best for when it’s watched.', 'Ordinary Tuesdays are the problem, not finals.', 'He walks out slower when the ground is fuller.', 'The bigger it gets, the calmer he looks.', 'Some players survive these nights. He enjoys them.'],
  workhorse: ['He never stopped running.', 'Covered every blade of grass, that lad.', 'Effort is never the question with him.', 'The engine simply doesn’t cut out.', 'First to press, last to stop.', 'He does the unseen work all afternoon.', 'You could set a clock by his work rate.', 'The legs of two players in one shirt.', 'He is still closing down at 88 minutes when it is 4–0.', 'The stats never quite capture what he did.', 'He makes the run that drags a defender away and gets nothing for it.', 'Ask his teammates who they’d pick first.'],
  mercurial: ["You never quite know which version you'll get.", 'Brilliance and frustration in the same breath.', 'A riddle, this one.', 'Two players in one shirt.', 'Genius and maddening, ten minutes apart.', 'The highs are higher and the lows are lower with him.', 'A coin-flip of a footballer — but what a coin.', 'When it clicks, nobody’s better; when it doesn’t…', 'He can look disinterested for an hour and decide a game in a minute.', 'The staff have given up predicting him.', 'On his day there is no one; the question is how many days.', 'You pick him and find out which one turned up.'],
  pro: ['Consummate, as ever.', 'Nothing left to chance with him.', 'Professional to his boots.', 'He does the simple things right.', 'Prepared, every single time.', 'No fuss, no drama, just the job done.', 'The staff never have to think about him twice.', 'A model for the younger lads to copy.', 'He is the first in and it is not close.', 'The same routine, in every ground, every week.', 'Nothing about his career will ever be an accident.', 'Dull, if you find reliability dull.'],
  latebloom: ['Better every single week, this lad.', 'Still growing into himself.', 'The best of him is ahead.', 'A work in progress, and improving.', 'The penny is dropping, a bit more each game.', 'He’s catching up to his own potential in real time.', 'Whatever they’re doing with him, it’s working.', 'A slow burn, but the flame is climbing.', 'He was nowhere near this a year ago.', 'The gap between him and the rest is closing every month.', 'Nobody rated him at fourteen. They do now.', 'He is arriving late and arriving anyway.'],
  showman: ['He plays with a grin and one eye on the crowd.', 'Never happier than with an audience.', 'A touch of theatre in everything he does.', 'He wants to entertain as much as win.', 'The flick was on before the simple pass ever occurred to him.', 'He’d rather do it with style than without.', 'Half footballer, half performer.', 'The crowd is his co-star, and he knows it.', 'He plays the game he watched as a boy, not the one on the whiteboard.', 'The simple pass is available. It is also boring.', 'He hears the crowd and answers it.', 'Style is not a bonus for him, it is the point.'],
  stoic: ['Nothing about his face ever gives it away.', 'Unreadable, as always.', 'The same expression, whatever happens.', 'Calm as still water, this one.', 'You’d never know from him whether it was a final or a friendly.', 'Not a flicker, win or lose.', 'The pulse never seems to climb.', 'Ice where others carry nerves.', 'A goal and a goal-kick get the same face.', 'He does not celebrate, and he does not sulk.', 'You would have to ask him, and he would not tell you.', 'The temperature never changes with him.'],
  // these three carried 4 lines where the other ten carried 8, and ~23% of heirs draw one of them,
  // so those careers read measurably more repetitively (17x for one line vs 13x max elsewhere) — PT-405
  hothead: ['It could go off at any second, and everyone knows it.', 'The fuse is always short.', 'Passion and trouble, forever close.', 'One decision from brilliance or the book.',
    'He plays on the edge because he doesn’t know where else to stand.', 'The referee has already learned his name.', 'Channel it and he’s frightening; don’t, and he’s gone.', 'The fire is the talent — that’s the problem.', 'The best and worst minutes of his career will be the same minute.', 'He argues with teammates who are on his side.', 'You can see it building three passes before it happens.', 'All that heat, and nowhere sensible to put it.'],
  perfectionist: ['He’ll pick holes in it later, whatever anyone says.', 'Never satisfied, this one.', 'His own harshest critic.', 'By his own standard, there’s always more.',
    'He’ll be thinking about the one he misplaced, not the rest.', 'Praise slides straight off him.', 'The standard he’s chasing may not actually exist.', 'Good is a word he seems not to accept about himself.', 'He watches the clips of the ones that went wrong.', 'A win with a bad performance in it is still a bad night.', 'He apologises for passes that arrived perfectly well.', 'Nothing is ever quite finished, to him.'],
  joker: ['Somewhere in the huddle, he’s already found something to laugh about.', 'A grin is never far away.', 'He keeps it light, whatever the score.', 'The dressing room’s favourite.',
    'He’d have the lads laughing at half-time in a cup final.', 'Nothing seems to weigh on him for long.', 'The jokes are how he handles it, which the staff worked out early.', 'Morale goes wherever he goes.', 'He is the reason the coach has to say "settle down" twice.', 'Nobody stays in a mood around him for long.', 'The lightness is not a lack of seriousness, whatever it looks like.', 'He would have the room laughing at a funeral, gently.'],
};
// personality-flavoured verbs woven in occasionally so the temperament is felt, not just stated
// A career has exactly ONE personality, so this player sees only his own row — and it was drawn on ~50% of
// ~94 turns, meaning three phrases carried ~47 draws and each opened a line ~16 times. It is the closest
// thing the prose has to the star's own voice, so thinness here reads as the game not knowing him. Nine
// each. (Bank size does not change the rng draw COUNT — `pick` consumes one value either way — so save
// replay is unaffected.) (PT-402)
const PERSONALITY_ADV: Record<string, string[]> = {
  maverick: ['with a swagger,', 'grinning,', 'off the cuff,', 'because why not,', 'with a shrug at the coaching notes,',
    'improvising,', 'as though the textbook were optional,', 'trusting the moment,', 'delighted with himself,'],
  fragile: ['tentatively,', 'jaw tight,', 'heart in mouth,', 'half-expecting it to go wrong,', 'talking himself into it,',
    'with a glance at the bench,', 'hoping nobody was watching too closely,', 'breath held,', 'willing his hands to stop shaking,'],
  leader: ['barking orders,', 'chest out,', 'taking responsibility,', 'dragging them with him,', 'because somebody had to,',
    'first to demand it,', 'setting the tone,', 'refusing to let heads drop,', 'shouldering it,'],
  biggame: ['relishing it,', 'eyes lit up,', 'right at home,', 'as the noise swelled,', 'built for exactly this,',
    'feeding off the occasion,', 'utterly unbothered by the size of it,', 'as if the crowd were his,', 'alive to it,'],
  workhorse: ['lungs burning,', 'without a word,', 'for the fifth time that half,', 'legs gone and running anyway,',
    'because the work does not do itself,', 'unglamorously,', 'covering ground nobody thanks him for,', 'again,', 'still going,'],
  mercurial: ['on a whim,', 'inscrutable as ever,', 'in one of his moods,', 'for reasons known only to him,',
    'having decided, apparently, to bother,', 'unreadable,', 'as the mood took him,', 'brilliant one minute, absent the next,', 'on some private impulse,'],
  pro: ['methodically,', 'as drilled,', 'ice in his veins,', 'exactly as rehearsed,', 'without fuss,',
    'the way he has a thousand times,', 'entirely within himself,', 'to the letter,', 'unhurried,'],
  latebloom: ['growing into it,', 'sharper than last month,', 'still learning,', 'better than he was in September,',
    'catching up fast,', 'with a confidence that is new,', 'improving in front of them,', 'later than most and getting there,', 'finding it,'],
  showman: ['playing to the gallery,', 'with a flourish,', 'grinning,', 'for the cameras,', 'with an unnecessary stepover,',
    'because the crowd wanted it,', 'milking it,', 'with one eye on the highlights,', 'theatrically,'],
  stoic: ['face like stone,', 'without a flicker,', 'utterly unmoved,', 'giving nothing away,', 'as though it cost him nothing,',
    'expressionless,', 'without celebrating,', 'the same as he would a training drill,', 'unmoved either way,'],
  hothead: ['jaw clenched,', 'simmering,', 'right on the edge,', 'still furious about the last one,', 'with the referee in his ear,',
    'spoiling for it,', 'a word away from trouble,', 'nostrils flaring,', 'daring someone to say something,'],
  perfectionist: ['already dissecting it in his head,', 'never quite satisfied,', 'chasing the perfect version,',
    'unhappy with it even so,', 'replaying the touch he got wrong,', 'to a standard only he can see,',
    'certain it could have been cleaner,', 'grading himself harshly,', 'not quite right, to his eye,'],
  joker: ['with a wink,', 'cracking a smile,', 'enjoying himself far too much,', 'saying something unrepeatable,',
    'laughing before it landed,', 'to groans from the bench,', 'entirely unserious,', 'having made someone laugh first,', 'grin already spreading,'],
};




const pickFrom = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

// ── OFF-PITCH RESPONSES (PT-43): at a LIFE EVENT the player still plays a football card, but showing its
// on-pitch move name ("Take your man on with a stepover") as the way to handle homework or a family scare
// reads as a content bug. Reframe each card by the QUALITY it draws on (its dominant tag) into an off-pitch
// choice — a title + subtitle for the card UI, and a noun phrase that splices into the resolution prose
// ("He falls back on <noun> and …"). Stable per card id so the same card always reads the same way.
type LifeAction = { name: string; desc: string; noun: string };
const LIFE_ACTION: Record<string, LifeAction[]> = {
  composure: [
    { name: 'Keep a cool head', desc: 'Stay calm and deal with it, no drama', noun: 'his cool head' },
    { name: 'Take it in his stride', desc: 'Not let it rattle him', noun: 'an unflappable calm' },
    { name: 'Ride it out calmly', desc: 'Let the storm pass without reacting', noun: 'a level head' },
    { name: 'Let it wash over him', desc: 'Refuse to give it any weight', noun: 'a stillness that unnerves people' },
    { name: 'Wait for the noise to stop', desc: 'Say nothing until it passes', noun: 'his knack for outlasting a storm' },
    { name: 'Deal with it and move on', desc: 'No fuss, no post-mortem', noun: 'an unsentimental streak' },
  ],
  aggression: [
    { name: 'Stand his ground', desc: 'Meet it head-on and refuse to back down', noun: 'his stubborn streak' },
    { name: 'Front up to it', desc: 'Square up to the problem, no flinching', noun: 'a refusal to be pushed around' },
    { name: 'Dig his heels in', desc: 'Hold firm and make his point', noun: 'a bloody-minded streak' },
    { name: 'Push back twice as hard', desc: 'Make it clear he will not be moved', noun: 'an edge people learn to respect' },
    { name: 'Say the unsayable thing', desc: 'Put it on the table, bluntly', noun: 'a willingness to have the row' },
    { name: 'Refuse to let it go', desc: 'Follow it all the way through', noun: 'a stubbornness that borders on a fault' },
  ],
  creativity: [
    { name: 'Find another way', desc: 'Think around the problem', noun: 'his knack for a solution nobody else sees' },
    { name: 'Talk his way through', desc: 'A clever answer to a tricky spot', noun: 'quick thinking' },
    { name: 'Improvise a fix', desc: 'Come at it from an angle no one expects', noun: 'a bit of improvisation' },
    { name: 'Come at it sideways', desc: 'Try the answer nobody expects', noun: 'a mind that will not sit still' },
    { name: 'Make something out of nothing', desc: 'Improvise, and hope', noun: 'his talent for the unlikely' },
    { name: 'Change the question', desc: 'Refuse the choice he was offered', noun: 'an unwillingness to accept the obvious' },
  ],
  teamwork: [
    { name: 'Lean on the people around him', desc: 'Not try to carry it alone', noun: 'the people around him' },
    { name: 'Share the load', desc: 'Bring others in rather than bottle it up', noun: 'his instinct to share the load' },
    { name: 'Talk it through with the group', desc: 'Sort it together, not on his own', noun: 'the trust of the dressing room' },
    { name: 'Get everyone in a room', desc: 'Sort it out together or not at all', noun: 'an instinct for pulling people in' },
    { name: 'Take the smaller part', desc: 'Let someone else have the moment', noun: 'a lack of interest in the credit' },
    { name: 'Cover for someone else', desc: 'Carry it so they do not have to', noun: 'a habit of shouldering other people\'s weight' },
  ],
  leadership: [
    { name: 'Take charge of it', desc: 'Front up and own the situation', noun: 'his instinct to take charge' },
    { name: 'Set the example', desc: 'Handle it the way he’d want others to', noun: 'a quiet authority' },
    { name: 'Lead from the front', desc: 'Show everyone how it’s done', noun: 'his sense of responsibility' },
    { name: 'Say what nobody will', desc: 'Be the one who names it', noun: 'a voice people wait for' },
    { name: 'Take the blame himself', desc: 'Whether or not it was his', noun: 'a broad set of shoulders' },
    { name: 'Set the standard and hold it', desc: 'Do it right and let them follow', noun: 'a way of raising the room' },
  ],
  stamina: [
    { name: 'Grind through it', desc: 'Head down, outlast the hard part', noun: 'sheer persistence' },
    { name: 'Keep going', desc: 'Refuse to let it wear him down', noun: 'a refusal to be worn down' },
    { name: 'Tough it out', desc: 'Put in the graft nobody sees', noun: 'a bottomless work ethic' },
    { name: 'Outlast it', desc: 'Simply be the last one standing', noun: 'a refusal to tire' },
    { name: 'Do the boring work first', desc: 'Grind out the unglamorous part', noun: 'an appetite for the dull hours' },
    { name: 'Keep going long after sensible', desc: 'Well past the point of reason', noun: 'a body that answers when asked' },
  ],
  flair: [
    { name: 'Front it out', desc: 'Carry it off with easy confidence', noun: 'an easy confidence' },
    { name: 'Charm his way through', desc: 'Disarm it with a bit of personality', noun: 'his natural charm' },
    { name: 'Style it out', desc: 'Wave it off like it’s nothing', noun: 'an unshakeable swagger' },
    { name: 'Do it with a bit of style', desc: 'If it is worth doing, make it memorable', noun: 'a taste for the theatrical' },
    { name: 'Enjoy himself', desc: 'Refuse to treat it as a chore', noun: 'a lightness that carries him' },
    { name: 'Make a moment of it', desc: 'Give people something to talk about', noun: 'an eye for the occasion' },
  ],
  keeping: [
    { name: 'Hold the line', desc: 'Be the steady, dependable one', noun: 'a steady, dependable streak' },
    { name: 'Stay solid', desc: 'Keep it together and see it out', noun: 'his composure under pressure' },
    { name: 'Be the safe pair of hands', desc: 'The one everyone can rely on', noun: 'a reassuring dependability' },
    { name: 'Read it before it happens', desc: 'Be where it is going to be', noun: 'an instinct for anticipation' },
    { name: 'Command his area', desc: 'Take charge of the space around him', noun: 'an authority in his own patch' },
    { name: 'Hold his line', desc: 'Trust the position and stay', noun: 'a discipline that rarely breaks' },
  ],
};
const strHash = (s: string): number => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
/** Reframe a football card as an off-pitch response, keyed on its dominant tag and stable per card id.
 *  `avoid` (names already used by other cards in the same hand) lets the caller keep a hand's off-pitch
 *  labels DISTINCT even when two cards share a dominant tag (PT-49). */
/** `rotate` (pass the turn) makes the phrasing MOVE over a career. Selection used to be
 *  `strHash(id) % pool.length` and nothing else — stable per card forever — so the eight off-pitch cards a
 *  ten-year-old is offered were still the identical eight labels at twenty-two, and growing the pool could
 *  not change that, because a given card always mapped to the same entry. (PT-809) */
export function lifeAction(tags: string[], id: string, avoid?: ReadonlySet<string>, rotate = 0): LifeAction {
  const pool = LIFE_ACTION[tags[0]] ?? LIFE_ACTION.composure;
  const start = (strHash(id) + Math.floor(rotate / 6)) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const cand = pool[(start + i) % pool.length];
    if (!avoid || !avoid.has(cand.name)) return cand;
  }
  return pool[start]; // every variant already taken (hand bigger than the pool) — fall back to the stable pick
}

const gcd = (a: number, b: number): number => { while (b) { [a, b] = [b, a % b]; } return a; };
// Deterministic, no-near-repeat pick: consecutive turns walk the WHOLE pool before any entry repeats, so
// flavour lines can't recycle a few turns apart (PT-9/PT-42/PT-101). `salt` (from the career seed) rotates
// each career's start so two careers don't read identically. The effective stride is forced COPRIME to the
// pool length — otherwise a stride that shares a factor with n (e.g. stride 13 on a 13-line bank) degenerates
// to a constant index and the same line prints every turn (the PT-104 regression).
function pickByTurn<T>(arr: readonly T[], turn: number, stride: number, salt: number): T {
  const n = arr.length;
  if (n <= 1) return arr[0];
  let s = (((stride % n) + n) % n) || 1;
  while (gcd(s, n) !== 1) s = (s % n) + 1; // bump to the nearest stride coprime to n (always terminates: gcd(1,n)=1)
  const idx = (((turn * s + salt) % n) + n) % n;
  return arr[idx];
}


const CHILD_CHAPTERS = new Set(['Grassroots', 'Academy']);


/** Weave the age/chapter into the situation so a 12-year-old on a park pitch reads unlike a 23-year-old.
 *  Turn-strided (not random) so the frame walks the whole bank before repeating within a chapter (PT-9). */
function ageFraming(turn: number, salt: number, age?: number, chapter?: string): string {
  if (chapter && FRAME_BY_CHAPTER[chapter]) return pickByTurn(FRAME_BY_CHAPTER[chapter], turn, 7, salt);
  if (age == null) return '';
  if (age <= 12) return pickByTurn(['Barely up to the crossbar, ', 'A boy among boys, ', 'Still finding his feet in the game, '], turn, 7, salt);
  if (age <= 15) return pickByTurn(['A gangly teenager with a lot to prove, ', 'Growing into his frame, ', 'Hungry and a little raw, '], turn, 7, salt);
  if (age <= 18) return pickByTurn(['On the cusp of the first team, ', 'A prospect the club is watching carefully, ', 'With the academy behind him and the real thing ahead, '], turn, 7, salt);
  if (age <= 21) return pickByTurn(['Establishing himself now, ', 'No longer a kid, expectations rising, ', 'A young man with a reputation to build, '], turn, 7, salt);
  return pickByTurn(['A senior figure in the making, ', 'In his pomp, ', 'With the experience to know exactly what this is, '], turn, 7, salt);
}

/** A narrative description of the moment the player is living through, from the scenario. */
export function scenarioStory(kind: string, topTag: string, moment: string | null, ctx: ScenarioCtx | number): string {
  // back-compat: a bare seed number still works
  const c: ScenarioCtx = typeof ctx === 'number' ? { seed: ctx } : ctx;
  const rng = mulberry32(c.seed >>> 0);
  const salt = (c.careerSeed ?? c.seed) >>> 0;
  const turn = c.turn ?? 0;
  const demand = pickByTurn(DEMAND[topTag] ?? DEMAND.teamwork, turn, 13, salt);
  // A season-long event colours the chapter, but stamping its opener on EVERY prompt makes a small pool
  // dominate (PT-54). Show it on ~half the turns (deterministic gate) and let the chapter's own frame carry
  // the rest — the event still recurs, the prose stays varied.
  const eventTint = c.seasonEventId && EVENT_PREFIX[c.seasonEventId] && strHash(salt + ':evt:' + turn) % 2 === 0
    ? pickByTurn(EVENT_PREFIX[c.seasonEventId], turn, 7, salt) : '';
  const cast = c.careerSeed != null ? careerCast(c.careerSeed, c.castAvoid) : null;
  // occasionally attribute the situation to a recurring character (its own sentence — follows a full stop)
  // a child on a park pitch has a coach, parents on the touchline and rival kids — never a club captain or a
  // veteran mentor, so Grassroots/Academy get their own park-appropriate cast framings (PT-133, cf PT-46/103)
  const charRaw = cast && rng() < 0.4
    ? (c.chapter && CHILD_CHAPTERS.has(c.chapter)
        ? pickByTurn([`Coach ${cast.gaffer} wants to see how he handles it.`, `Beat ${cast.rival} to it and he'll never hear the end of it.`, `His mum's watching from the touchline.`, `Coach ${cast.gaffer} has been talking about this one all week.`, `${cap(cast.rival)} is watching from the other side.`, `His dad has taken the morning off for it.`, `The whole team is buzzing about it.`], turn, 5, salt)
        : pickByTurn([`${cap(cast.mentor)} reckons this is the making of him.`, `${cap(cast.gaffer)} wants to see how he handles it.`, `${cap(cast.captain)} is looking his way.`, `Beat ${cast.rival} to it and the point is made.`,
            `${cap(cast.gaffer)} has picked him for a reason.`, `${cap(cast.mentor)} has been waiting to see this.`, `${cap(cast.captain)} has already had a word.`,
            `${cap(cast.rival)} is having a good week. That rankles.`, `There are people here to watch him specifically.`, `${cap(cast.gaffer)} said one sentence to him before kick-off.`], turn, 5, salt))
    : '';
  const charline = charRaw ? ' ' + charRaw : '';
  // The frame ("Terrified of being dropped, ") describes HIM; the setup describes the SITUATION — splicing
  // them with a comma dangles and reads broken (PT-42). Instead render the frame as its own opening sentence
  // (trailing ", " → ". ") and let the setup stand as the next sentence: clean, grammatical, multi-beat.
  const asSentence = (f: string) => cap(f).replace(/,\s*$/, '.');
  const frameRaw = eventTint || ageFraming(turn, salt, c.age, c.chapter);
  const frameSentence = frameRaw ? asSentence(frameRaw) + ' ' : '';
  if (moment) {
    return `${frameSentence}It’s ${momentPhrase(moment)}. ${demand}${charline}`.trim();
  }
  // youngest chapters draw park/school-football language, not the senior reserve-team banks (PT-46)
  const pool = c.chapter && CHILD_CHAPTERS.has(c.chapter) && CHILD_SETUP[kind] ? CHILD_SETUP[kind] : KIND_SETUP[kind] ?? KIND_SETUP.match;
  let setup = pickByTurn(pool, turn, 11, salt);
  // recurring-character payoff: friend_rivalry / mentor_crossroads name the SAME seeded rival/mentor
  // across the whole career, so the callback lands rather than reading as a random stranger each time.
  if (setup.includes('{rival}')) setup = setup.replace(/\{rival\}/g, cast ? cast.rival : 'his old mate');
  if (setup.includes('{mentor}')) setup = setup.replace(/\{mentor\}/g, cast ? cast.mentor : 'his old mentor');
  return `${frameSentence}${setup} ${demand}${charline}`.trim();
}

const band = (success: number) => (success >= 0.8 ? 'triumph' : success >= 0.62 ? 'good' : success >= 0.42 ? 'mixed' : success >= 0.24 ? 'poor' : 'dismal');
const domTag = (tags: string[]) => tags.find((t) => VERBS[t]) ?? 'teamwork';

// ── DEBUT: research shows first-team debuts as visceral, almost drug-like highs ("floating across the
// grass" — Steve Coppell, 1975) — and just as often a chastening night that DOESN'T end a career (Phil
// Chisnall's 1961 debut ended 5-1, and he kept his place). A milestone flourish that reads either way.
const DEBUT_EUPHORIA = [
  'It’s beyond a fairy tale — he isn’t running out there, he’s floating across the grass.', 'Whatever else his career becomes, nothing will ever quite match this first, perfect afternoon.',
  'Pure, drug-like euphoria — the kind old pros still describe decades later, word for word.', 'He will remember every blade of grass on this pitch for the rest of his life.',
];
const DEBUT_ROUGH = [
  'A tough afternoon to start a career on — but a bad debut has never once ended a good one.', 'Not the dream start, but plenty of careers worth having began exactly like this.', 'It stings tonight. In a year it will just be the answer to a trivia question about how it all began.',
];

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
// BIG GAMES (stakes 2) get a lighter occasion-beat than the rare HUGE (stakes 3) moments — enough that a
// big night reads bigger than a Tuesday session, without stealing the peak reserved for the huge ones (PT-12).
const BIG_BEAT: Record<'triumph' | 'good' | 'bad', string[]> = {
  triumph: ['On a big night, he stood up.', 'The occasion asked the question; he answered it.', 'When the game got big, so did he.', 'A performance the big games are made for.'],
  good: ['A steady head when the occasion swelled.', 'He didn’t shrink from the moment.', 'Composed, with the stakes raised.'],
  bad: ['The occasion got the better of him this time.', 'On the big night, the moment passed him by.', 'The stakes climbed and he couldn’t quite go with them.'],
};

/** One immersive sentence (or two) for a card played this turn. */
export function narratePlay(cardName: string, cardTags: string[], success: number, ctx: NarrateCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const b = band(success);
  const tag = domTag(cardTags);
  // turn-strided selection for the repeating flavour surfaces (setting / result / reaction) so consecutive
  // turns walk each pool instead of colliding on the same line a few turns apart (PT-101). salt from the
  // career seed keeps two careers distinct; different strides keep the three surfaces out of lockstep.
  const salt = (ctx.careerSeed ?? ctx.seed) >>> 0;
  const turn = ctx.turn ?? 0;
  // Big-occasion settings describe a MATCH ("in a white-hot derby"), so they must not be stamped on a
  // training session or an off-pitch moment just because the stakes are high — the same bleed PT-15 fixed
  // for moment labels. Non-match moments always use the chapter's own setting bank.
  const bigOccasion = (ctx.kind ?? 'match') === 'match' && ctx.stakes >= 2;
  const setting = bigOccasion && ctx.stakes === 3 ? pickByTurn(HUGE_SETTINGS, turn, 7, salt)
    : bigOccasion ? pickByTurn(BIG_SETTINGS, turn, 7, salt)
    : pickByTurn(SETTINGS[ctx.chapter] ?? SETTINGS.Academy, turn, 7, salt);
  const verb = pick(VERBS[tag]);
  // per-tag result colour on a big success; otherwise the generic band result
  const result = b === 'triumph' && TAG_TRIUMPH[tag] && rng() < 0.55 ? pickByTurn(TAG_TRIUMPH[tag], turn, 11, salt) : pickByTurn(RESULTS[b], turn, 11, salt);
  // the youngest chapters get park/school reactions, not stadium/scout/bench vocabulary (PT-103)
  const reactionPool = CHILD_CHAPTERS.has(ctx.chapter) && CHILD_REACTIONS[b] ? CHILD_REACTIONS[b] : REACTIONS[b];
  const reaction = pickByTurn(reactionPool, turn, 13, salt);
  // the outcome carries the season-event colour only sometimes — the scenario prompt already shows it, so
  // stamping it on every outcome too doubled the repetition across the two surfaces (PT-54)
  const prefix = ctx.seasonEventId && EVENT_PREFIX[ctx.seasonEventId] && rng() < 0.4 ? pick(EVENT_PREFIX[ctx.seasonEventId]) : '';
  const lead = prefix ? prefix + setting : cap(setting);
  // personality VOICE: an adverbial colour before the verb (felt throughout), plus the rare stated clause
  const adv = PERSONALITY_ADV[ctx.personalityId] && rng() < 0.5 ? pick(PERSONALITY_ADV[ctx.personalityId]) + ' ' : '';
  // the personality closer is a positive-leaning observation, so only append it on a GOOD outcome — on a
  // failed one it read as praise for the moment that just went wrong (e.g. "the engine doesn't cut out"
  // right after "it fell apart completely") (PT-102). The temperament is still felt via the adverb above.
  const flavor = (b === 'triumph' || b === 'good') && rng() < 0.6 && PERSONALITY[ctx.personalityId] ? ' ' + pickByTurn(PERSONALITY[ctx.personalityId], turn, 3, salt) : ''; // strided so the small persona bank doesn't recycle one line (PT-104)
  // a recurring character sometimes reacts
  const cast = ctx.careerSeed != null ? careerCast(ctx.careerSeed, ctx.castAvoid) : null;
  const castReact = cast && rng() < 0.25
    ? ' ' + (CHILD_CHAPTERS.has(ctx.chapter)
        // park-football cast, no senior captain/mentor (PT-133); widened from 4 (PT-403)
        ? pick([`Coach ${cast.gaffer} gave him a nod.`, `His dad cheered louder than anyone.`, `His teammates mobbed him.`, `One in the eye for ${cast.rival}.`,
            `Coach ${cast.gaffer} pretended not to be pleased.`, `Someone's parent shouted his name.`, `The touchline made a noise it hadn't all morning.`,
            `${cap(cast.rival)} didn't look over. He'd seen it.`, `He was still buzzing about it on the walk home.`, `His dad said nothing, and grinned the whole way back.`])
        : pick([`${cap(cast.gaffer)} said nothing, but noted it.`, `${cap(cast.mentor)} allowed himself a smile.`, `${cap(cast.captain)} clapped him on the back.`, `One in the eye for ${cast.rival}.`,
            `${cap(cast.gaffer)} made a mark on his sheet.`, `${cap(cast.mentor)} had seen that coming for weeks.`, `${cap(cast.captain)} said his name in the huddle.`,
            `${cap(cast.rival)} watched it and said nothing.`, `The bench were up before the ball landed.`, `${cap(cast.gaffer)} let the staff know about that one later.`]))
    : '';
  const milestone = ctx.milestone && MILESTONE[ctx.milestone] ? MILESTONE[ctx.milestone] : '';
  const action = adv ? `he, ${adv}${verb}` : `he ${verb}`; // "he, grinning, flew into …"
  // HUGE moments (stakes 3) get a genuine multi-beat sequence: tension build-up before, a remembered-by
  // aftermath after — the standout peaks a long career should have only a handful of.
  const tension = ctx.stakes === 3 ? pick(HUGE_TENSION) + ' ' : '';
  // a stakes-3 match is a career-defining occasion — it must NEVER collapse to one flat sentence, so EVERY
  // grade (incl. the 'mixed' band that used to fall through to '') gets a remembered-by aftermath beat (PT-109).
  const aftermath = ctx.stakes === 3
    ? ' ' + (b === 'triumph' ? pick(HUGE_AFTERMATH.triumph) : b === 'good' || b === 'mixed' ? pick(HUGE_AFTERMATH.good) : pick(HUGE_AFTERMATH_BAD))
    : '';
  // DEBUT EUPHORIA / "a rough debut isn't the end": a distinct flourish on the career-first beat, coloured
  // by how it actually went — real debut anecdotes read either as euphoric or as a night to shrug off.
  const debutFlourish = ctx.milestone === 'debut'
    ? ' ' + (b === 'triumph' || b === 'good' ? pick(DEBUT_EUPHORIA) : b === 'poor' || b === 'dismal' ? pick(DEBUT_ROUGH) : '')
    : '';
  // BIG GAME (stakes 2) occasion-beat — bigger than routine, lighter than the HUGE stakes-3 sequence.
  const bigBeat = ctx.stakes === 2 && rng() < 0.7
    ? ' ' + (b === 'triumph' ? pick(BIG_BEAT.triumph) : b === 'good' || b === 'mixed' ? pick(BIG_BEAT.good) : pick(BIG_BEAT.bad)) // 'mixed' no longer falls through to nothing (PT-109)
    : '';
  return `${tension}${milestone}${cap(lead)}, ${action} ${cardName} ${result}. ${reaction}${flavor}${castReact}${aftermath}${bigBeat}${debutFlourish}`;
}

// ── LIFE EVENTS: the resolution beat for a mid-chapter dilemma (see career.ts Scenario.life /
// LIFE_CONSEQUENCE). Distinct from narratePlay — these read like a real off-pitch moment resolving, not
// a football action, though the CARD is still named (it's the trait/approach he leans on to get through it).
// Prefixes EVERY life event and every social resolution — ~25 firings a career from five options. (PT-406)
const LIFE_APPROACH = ['He falls back on', 'It’s', 'He leans on', 'What gets him through it is', 'He draws on',
  'He gets through it on', 'What carries him is', 'He meets it with', 'The thing that holds is',
  'He answers it with', 'What he has, in the end, is', 'He steadies himself on'];
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
  // off-pitch CHARACTER moments (the 'social' scenario kind) — resolved on who he is, not a scoreline
  social: {
    good: ['and he comes out of it with a little more respect than he went in.', 'and the right people quietly clock it — that sort of thing sticks.', 'and it says more about the man he’s becoming than any goal could.', 'and the group notices, even if nobody says a word about it.'],
    bad: ['and it doesn’t quite land — one of those the room quietly files away.', 'and he gets it wrong, and knows it the second the words are out.', 'and it leaves a slightly sour note that hangs around longer than it should.', 'and he fumbles it, the kind of small misstep people remember.'],
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
  mentor_crossroads: {
    good: ['and {mentor}’s old advice lands exactly the way it always used to.', 'and he leaves the call with {mentor} seeing the game — and himself — a little clearer.', 'and years of trust between him and {mentor} pays off once again.'],
    bad: ['and, for the first time, {mentor}’s advice feels out of date.', 'and he quietly decides to find his own answer instead of {mentor}’s this time.', 'and the call with {mentor} ends more awkward than either of them wanted.'],
  },
  friend_rivalry: {
    good: ['and he and {rival} shake hands after, the friendship bigger than the result.', 'and the needle between him and {rival} stays good-natured, right where it belongs.', 'and it sharpens both him and {rival} rather than souring anything.'],
    bad: ['and something real gets lost between him and {rival} that day.', 'and the handshake with {rival} after is colder than either would admit.', 'and an old friendship with {rival} is left carrying a new weight.'],
  },
  new_money: {
    good: ['and he keeps his feet on the ground — same digs, same mates, just a fatter account.', 'and {mentor}’s warning lands; he handles the money like an adult about it.', 'and he quietly sets most of it aside, the sensible way, and says nothing about it.'],
    bad: ['and it goes to his head faster than anyone expected.', 'and the new money buys him a bit of distance from people who used to matter.', 'and {mentor}’s warning turns out to be exactly right — and exactly too late.'],
  },
  move_abroad: {
    good: ['and it starts to feel like home sooner than he expected.', 'and the language comes easier than the football ever needed to.', 'and he settles in a way that makes the whole gamble look obvious in hindsight.'],
    bad: ['and the homesickness doesn’t let up, no matter how well it’s going on the pitch.', 'and he counts down the days to the next trip home like a kid at boarding school.', 'and something about the move still doesn’t sit right, months in.'],
  },
};
// INJURY COMEBACK — "rush back" (aggression/stamina-led, real reinjury-risk cost on a bad outcome) vs
// "patient graded return" (anything else — the safe, documented "fear of reinjury" grind). Distinct
// resolution prose per approach, layered on the standard good/bad LIFE_RESOLUTION.injury_comeback lines.
const INJURY_APPROACH_LINE: Record<'rush' | 'patient', { good: string[]; bad: string[] }> = {
  rush: {
    good: ['He pushed to come back early, and for once the gamble pays off in full.', 'Against the physio’s better judgement, he rushed it — and it held.'],
    bad: ['He pushed to come back too soon, and the body sends him a warning he can’t ignore.', 'Rushing it felt right at the time; right now, it very much doesn’t.'],
  },
  patient: {
    good: ['He took the slow, graded route back, and the patience is rewarded.', 'No shortcuts, no rush — just a careful, honest return, done properly.'],
    bad: ['Even the patient route has its bad days — this is one of them.', 'He did it the right way, by the book, and it still didn’t quite click today.'],
  },
};
/** The resolution beat for a mid-chapter LIFE EVENT (contract standoff, loan call, media storm, etc.) —
 *  distinct from narratePlay: this reads like an off-pitch moment resolving, using the same success band.
 *  `approach` ('rush'/'patient') only ever arrives for injury_comeback (see career.ts's lastLifeEvent). */
export function narrateLifeEvent(kind: string, cardName: string, success: number, ctx: NarrateCtx, approach?: 'rush' | 'patient', cardTags?: string[], cardId?: string): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const good = band(success) === 'triumph' || band(success) === 'good';
  const table = LIFE_RESOLUTION[kind] ?? LIFE_RESOLUTION.setback;
  const cast = ctx.careerSeed != null ? careerCast(ctx.careerSeed, ctx.castAvoid) : null;
  let resline = pick(good ? table.good : table.bad);
  // same recurring-character payoff as scenarioStory above — the resolution names the SAME rival/mentor
  if (resline.includes('{rival}')) resline = resline.replace(/\{rival\}/g, cast ? cast.rival : 'his old mate');
  if (resline.includes('{mentor}')) resline = resline.replace(/\{mentor\}/g, cast ? cast.mentor : 'his old mentor');
  const approachLine = kind === 'injury_comeback' && approach
    ? ' ' + pick(good ? INJURY_APPROACH_LINE[approach].good : INJURY_APPROACH_LINE[approach].bad)
    : '';
  const lead = pick(LIFE_APPROACH);
  // a child at Grassroots/Academy has no agent — use park-appropriate reactions, mirroring PT-133 (PT-143)
  const castReact = cast && rng() < 0.3 && good
    ? ' ' + (CHILD_CHAPTERS.has(ctx.chapter)
        ? pick([`Coach ${cast.gaffer} appreciates how he handled it.`, `Even ${cast.rival} would admit that was well played.`, `His mates are impressed.`,
            `Coach ${cast.gaffer} tells someone about it that evening.`, `Nobody expected him to handle it that well.`, `${cap(cast.rival)} has gone quiet about it.`,
            `His mum hears a version of it twice.`, `It goes down rather better than he'd feared.`])
        : pick([`${cap(cast.gaffer)} appreciates how he handled it.`, `Even ${cast.rival} would admit that was well played.`, `His agent breathes a quiet sigh of relief.`,
            `${cap(cast.gaffer)} noted the way he dealt with it.`, `It reflects well on him in rooms he wasn't in.`, `${cap(cast.rival)} would not have handled it as neatly.`,
            `The staff mention it approvingly.`, `That will have been noticed upstairs.`]))
    : '';
  // Splice a tag-derived quality ("his cool head"), NOT the on-pitch card name — an off-pitch moment isn't
  // resolved by "a defence-splitting pass" (PT-43). Fall back to the raw name only if tags weren't supplied.
  const token = cardTags && cardId ? lifeAction(cardTags, cardId, undefined, ctx.turn ?? 0).noun : cardName;
  return `${lead} ${token} ${resline}${approachLine}${castReact}`;
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
  return moment ? `It’s ${momentPhrase(moment)} — and ${setup.charAt(0).toLowerCase() + setup.slice(1)}` : setup;
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
// age-neutral: this reskin fires from Breakthrough (19) through Establishing (23-25), so no line may cast him as
// a "kid" making his "debut" — a settled 25-year-old thrust in at short notice is not a debutant (PT-135).
const CALLUP_RESOLUTION = {
  good: [
    'and he looks like he’s been starting there for years.', 'and the shock call-up becomes the best story of his season.',
    'and nobody in that stadium would ever guess he found out four hours ago.', 'and it’s the kind of last-minute start managers dream of handing out.',
  ],
  bad: [
    'and the nerves get the better of him.', 'and it’s a chastening night, the kind you learn from.',
    'and the step up shows, painfully, just how big it is.', 'and he looks every inch a man caught cold, undercooked for the occasion.',
  ],
};
/** The SITUATION for a shock call-up — call before the card is played. */
export function callupMomentStory(moment: string | null, ctx: ScenarioCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const setup = pickFrom(rng, CALLUP_SETUP);
  return moment ? `It’s ${momentPhrase(moment)} — and ${setup.charAt(0).toLowerCase() + setup.slice(1)}` : setup;
}
/** The RESOLUTION beat for a shock call-up. */
export function narrateCallupMoment(cardName: string, success: number, ctx: NarrateCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const good = band(success) === 'triumph' || band(success) === 'good';
  const resline = pick(good ? CALLUP_RESOLUTION.good : CALLUP_RESOLUTION.bad);
  const cast = ctx.careerSeed != null ? careerCast(ctx.careerSeed, ctx.castAvoid) : null;
  const reax = cast && rng() < 0.3
    ? ' ' + (good ? `${cap(cast.gaffer)} could not have asked for more.` : `${cap(cast.gaffer)} will give him another chance — everyone gets one bad night.`)
    : '';
  return `Thrown in cold, he goes to work on ${cardName} ${resline}${reax}`;
}

// ── ACADEMY KEEP-OR-CUT SCARE: a tense "will he be kept?" scholarship-decision beat at the Academy/
// Scholar/Youth Team stages (real release odds — 85% of scholars released within two years, per
// docs/research-player-career.md §1 — but this is HIS story: the bloodline star always comes through it).
// TONE RULE: hopeful and serious only — never a real cut, never any hint of the tragedy the release
// research documents. The tension is real; the outcome never is in doubt.
const SCARE_SETUP: Record<string, string[]> = {
  Academy: [
    'Word is the coaches are trimming the squad again at the end of term, and nobody in the year group feels safe.',
    'A couple of letters have already gone out to other families. His hasn’t come. Yet.',
    'The kit room is full of quiet, nervous talk about who gets let go this summer.',
  ],
  Scholar: [
    'Scholarship review week. Two years of trials come down to a sit-down with the academy director.',
    'A string of released team-mates has the whole dorm on edge — and today it’s his turn to be called in.',
    'The paperwork that made this feel real two years ago is about to decide whether it carries on.',
  ],
  'Youth Team': [
    'A cull of the older age group is coming, and the coaches have started having "the conversations."',
    'He’s watched older lads get the call to the office and not come back the same. Today it’s his name on the list.',
    'One more contract review before first-team football is even a conversation — if there’s still a contract to review.',
  ],
};
const SCARE_RESOLUTION_GOOD = [
  'and the answer, when it comes, is the one he needed: he’s being kept on. Two years of worry, gone in a sentence.',
  'and the director doesn’t make him wait — he’s staying. He’s out of that office and on the phone home before the door shuts.',
  'and it’s good news: the club is keeping faith in him. He allows himself, finally, to breathe out.',
];
const SCARE_RESOLUTION_SHAKY = [
  'and it’s close — the room goes quiet for a beat too long — but the answer is still yes. He’s staying.',
  'and he braces for the worst, but they back him anyway. Not every doubt gets answered kindly, but this one just did.',
  'and it wasn’t the case he wanted to make for himself, yet somehow it was enough. He’s kept on — and he knows exactly how close it was.',
];
/** The SITUATION for the academy keep-or-cut scare — call before the card is played. */
export function academyScareStory(chapter: string, seed: number): string {
  const rng = mulberry32(seed >>> 0);
  return pickFrom(rng, SCARE_SETUP[chapter] ?? SCARE_SETUP.Academy);
}
/** The RESOLUTION beat — he is ALWAYS kept on (see TONE RULE above); only the framing (comfortable vs
 *  narrow) reads from how the moment right before the decision actually went. */
/** The scholarship-review scare ("KEEP OR CUT?"). It is an OFF-PITCH moment, so it must name the
 *  tag-derived quality the card screen showed him — not the raw matchday deck name. It used to print
 *  "He falls back on Defence-Splitter to make his case", naming a passing card that was never on screen,
 *  while every other off-pitch resolution correctly said "his instinct to share the load". Same defect
 *  narrateLifeEvent already solved; this call site simply never got the tags. (PT-156) */
export function narrateAcademyScare(cardName: string, success: number, ctx: NarrateCtx, cardTags?: string[], cardId?: string): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const strong = band(success) === 'triumph' || band(success) === 'good';
  const resline = pick(strong ? SCARE_RESOLUTION_GOOD : SCARE_RESOLUTION_SHAKY);
  const token = cardTags && cardId ? lifeAction(cardTags, cardId, undefined, ctx.turn ?? 0).noun : cardName;
  return `He falls back on ${token} to make his case ${resline}`;
}

// Deterministic "news" about the rival's own career — surfaced as a small ticker alongside the score, so
// he feels like a real career unfolding in parallel, not just a number that climbs on a fixed schedule.
// On screen on EVERY one of the 120 turns — the most-read string in the game. At six lines a chapter its
// whole 42-line library was seen ~2.9 times a career, and inside one 20-turn stage the six headlines
// cycled 3.3 times, so a line recurred every sixth turn for a whole stage. Twelve each. (PT-407)
const RIVAL_NEWS: Record<string, string[]> = {
  Grassroots: ['is turning heads in the district league too.', 'has just been picked up by a bigger local side.', 'scored a hat-trick at the weekend — word travels fast.', 'got a mention in the local paper’s youth round-up.', 'has a dad who tells anyone who’ll listen how good he is.', 'was the talk of the school tournament last week.', 'has been asked to train with the year above.', 'missed a month with a broken wrist, by all accounts.', 'is playing for two teams most weekends.', 'had a scout\'s dad watching him last Sunday.', 'is apparently unplayable on a dry pitch.', 'keeps getting moved to defence, which he hates.'],
  Academy: ['has been fast-tracked up an age group.', 'picked up an injury that will keep him out for a spell.', 'is the other name scouts keep mentioning in the same breath.', 'has been handed a longer academy deal.', 'captained his age group at the weekend.', 'went cold in front of goal this month, by all accounts.', 'has grown four inches over the summer.', 'is said to be homesick and struggling with the travel.', 'was rested for a fortnight — nothing serious.', 'has started doing extras after every session.', 'fell out with a coach and sat one out.', 'was the only one of his group kept on.'],
  Scholar: ['has signed his own scholarship forms at a rival academy.', 'is being talked about as the standout of his year group.', 'had a quiet trial and it showed.', 'is said to have caught the eye of a bigger club’s scouts.', 'is struggling with the step up, whisper the coaches.', 'earned a call to a regional select side.', 'has been put on a strength programme over the winter.', 'played ninety minutes for the reserves and did fine.', 'is being talked about as a late developer.', 'picked up a knock that nagged all season.', 'was left out of the squad for a cup tie and sulked.', 'has had a growth spurt and lost his touch with it.'],
  'Youth Team': ['has broken into a reserve side of his own.', 'is on the fringes of a first-team squad now.', 'picked up his first taste of first-team training this month.', 'has gone out on loan to get some minutes.', 'is reportedly unhappy with his game time.', 'bagged a brace for the reserves at the weekend.', 'trained with the first team on a Thursday and stayed up.', 'was left out of the travelling squad again.', 'has changed position and looks better for it.', 'is out of contract in the summer, they say.', 'got a full debut in a cup game nobody watched.', 'is being courted by a club two divisions higher.'],
  Breakthrough: ['has made his own first-team debut.', 'is being linked with a move across the city.', 'scored the winner in a game that made the papers.', 'has been named on a young-player-to-watch list.', 'is nursing a knock that’s cost him his place.', 'signed his first professional contract this week.', 'has had a bad month and lost his shirt.', 'is on the bench more often than not now.', 'got a mention on a highlights programme.', 'has been told he\'ll be sold if he doesn\'t sign.', 'played through an injury and made it worse.', 'is suddenly the one they build the side around.'],
  'First Team': ['has just signed a new long-term contract.', 'was named in a team-of-the-season shortlist.', 'is dealing with a loss of form of his own.', 'has been linked with a big-money move abroad.', 'earned a first international call-up.', 'is captaining his side more often these days.', 'turned down a move and everyone has an opinion.', 'has fallen out with the manager, if you believe the papers.', 'is in the middle of the best run of his career.', 'was carried off on a stretcher last month.', 'has been made captain in someone\'s absence.', 'has gone six games without a goal and knows it.'],
  Establishing: ['has been given the captain’s armband at his club.', 'is being talked about for a testimonial of his own.', 'is closing in on a personal milestone.', 'has hinted he might retire within a couple of seasons.', 'moved into coaching badges alongside playing.', 'broke a long-standing club record last month.', 'has started talking about the end of his career.', 'signed one last big contract, they reckon.', 'is being written about as a possible coach.', 'has taken a young lad under his wing.', 'is not the player he was, and plays like he knows it.', 'had a testimonial announced this week.'],
};
/** A small seeded "news" beat about the rival's own career, appropriate to the current life stage.
 *  Turn-strided so his parallel story moves on turn to turn instead of freezing on one headline (PT-45). */
export function rivalNews(seed: number, chapter: string, turn = 0): string {
  const bank = RIVAL_NEWS[chapter] ?? RIVAL_NEWS.Establishing;
  return pickByTurn(bank, turn, 7, (seed ^ 0x1a2b3c) >>> 0);
}

// ── NON-PLAY CHOICES: a flavour beat when he appoints a coach, drafts a card, or takes an offer ──
export function narrateCoach(name: string, kind: string, specialty: string[], ctx: NarrateCtx): string {
  const rng = mulberry32(ctx.seed >>> 0);
  const role = kind === 'mentor' ? 'mentor' : 'coach';
  const spec = specialty.slice(0, 2).join(' and ') || 'his all-round game';
  const cast = ctx.careerSeed != null ? careerCast(ctx.careerSeed, ctx.castAvoid) : null;
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
  const cast = ctx.careerSeed != null ? careerCast(ctx.careerSeed, ctx.castAvoid) : null;
  const money = effs.earn > 0, dev = effs.form > 0;
  if (money && !dev) return pickFrom(rng, [`He took the money — ${name}. The bank balance swells; the purists wince.`, `${name}: he cashed in. Who could blame a young man from where he started?`, `The chequebook won out. ${name}, signed.`]);
  if (dev && !money) return pickFrom(rng, [`He turned down the payday to keep growing — ${name}. The long game.`, `${name}: development over dollars. ${cast ? cast.gaffer + ' nodded.' : 'The staff nodded.'}`, `Patience over pounds — ${name}. A mature head on young shoulders.`]);
  return pickFrom(rng, [`A big call off the pitch: ${name}.`, `${name} — a decision that will shape more than his bank balance.`, `Off the field, ${name} — the kind of choice that defines a career.`]);
}

// ── CHAPTER RECAP + GRADUATION EPILOGUE (the story-so-far beats) ──
export interface RecapCtx { chapter: string; nextChapter?: string | null; age: number; careerSeed: number; personalityId?: string; overall?: number; seasonEventId?: string | null; castAvoid?: string }
/** A short "the story so far" passage shown at an age-chapter boundary. */
export function chapterRecap(ctx: RecapCtx): string {
  const rng = mulberry32(((ctx.careerSeed >>> 0) ^ Math.imul(ctx.age, 2654435761)) >>> 0);
  const cast = careerCast(ctx.careerSeed, ctx.castAvoid);
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
  const middle = pickFrom(rng, [`${cap(cast.gaffer)} has pushed him hard.`, `${cap(cast.mentor)} has taken him under his wing.`, `He’s measured himself against ${cast.rival} at every step.`, `${cap(cast.captain)} says the makings are there.`]);
  const ahead = ctx.nextChapter
    ? pickFrom(rng, [` Now comes the ${ctx.nextChapter} chapter — and the pressure that comes with it.`, ` The ${ctx.nextChapter} stage awaits, tougher than the last.`])
    : '';
  return `${open} ${middle}${ahead}`;
}
/** Capitalise a sentence-initial name. The ONE helper — see PT-810. */
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
/** A moment label rendered as PROSE. These strings double as UI badges, where some are shouted
 *  ("CUP FINAL") and others are already sentence case ("Derby Day"). Splicing them raw produced
 *  "It's CUP FINAL — and he..." next to a correct "It's Derby Day." in the same run. Shouted labels get
 *  title case; anything already mixed-case is left exactly as the author wrote it. (PT-810) */
function momentPhrase(m: string): string {
  const letters = m.replace(/[^A-Za-z]/g, '');
  if (!letters || letters !== letters.toUpperCase()) return m;   // not a shouted label — leave it alone
  return m.toLowerCase().replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
}

export interface EpilogueCtx { name: string; careerSeed: number; personalityId?: string; overall: number; topTraits?: string[]; role?: string; castAvoid?: string }
/** An evocative summary of the whole 10→25 journey, shown at graduation before the pro reveal. */
export function graduationEpilogue(ctx: EpilogueCtx): string {
  const rng = mulberry32(((ctx.careerSeed >>> 0) ^ 0x5f3759df) >>> 0);
  const cast = careerCast(ctx.careerSeed, ctx.castAvoid);
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
    `${cap(cast.gaffer)} always said he’d make it. He was right.`,
    `${cap(cast.mentor)} — the same voice at the end of the phone through every crossroads — shook his hand and said little. He didn’t need to.`,
    `Somewhere, ${cast.rival} — the mate turned rival turned, somehow, still a friend — is watching, and wondering.`,
    `His family were there for every step of it — and they’re still there now.`, `${cap(cast.captain)} is already talking about a dressing room with him in it.`,
    `Fifteen years of Sunday mornings and van journeys, and it was worth every single one.`,
    `He and ${cast.rival} came up together, fell out, and came out the other side still able to look each other in the eye. That, in the end, might be the real story.`,
    `${cap(cast.mentor)}’s advice is still in his head, all these years on — even the bits of it he eventually chose to ignore.`,
  ]);
  return `${start} At twenty-five, ${ctx.name} emerges as ${tier}.${pers} ${close}`;
}
