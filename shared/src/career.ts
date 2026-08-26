// Career Sim — Layer 1. A turn-by-turn card game that DEVELOPS a player into a Player NFT.
// Each turn you're dealt a HAND from your deck and face a seeded SCENARIO demanding certain
// playing-style tags; you play one card. How your choices PATTERN out over a career becomes the
// player's stat SHAPE (playstyle); how WELL you played becomes the MAGNITUDE. Fully deterministic
// (seeded, no Date.now/Math.random) so a career is a pure function of (seed, choices) — replayable
// and verifiable on-chain later. See docs/two-layer-architecture.md.

// ── deterministic RNG (mulberry32) ──
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function seedFrom(...parts: Array<string | number>): number {
  let h = 2166136261; const s = parts.join(':');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── style tags: the vocabulary linking card-play to stats ──
export type Tag = 'composure' | 'aggression' | 'creativity' | 'teamwork' | 'leadership' | 'stamina' | 'flair' | 'keeping';
export const TAGS: Tag[] = ['composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'stamina', 'flair', 'keeping'];
// outfield play never demands the keeping tag (that's the goalkeeper track's domain)
const OUTFIELD_TAGS: Tag[] = ['composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'stamina', 'flair'];

export type Track = 'outfield' | 'goalkeeper';
export interface SeasonEvent { id: string; name: string; desc: string }
/** One recorded development decision. A career is fully reconstructable from (seed, track, actions). */
export interface Action { type: 'play' | 'draft' | 'coach' | 'offer' | 'focus'; cardId: string }
/** Everything needed to persist/trade an in-progress prospect (stored off-chain, keyed by tokenId).
 *  Deterministic → the current stats can be re-derived + verified by replaying it. */
export interface CareerSnapshot { seed: number; track: Track; agentId?: string; actions: Action[] }

export type Rarity = 'common' | 'rare' | 'epic';
export interface Card { id: string; name: string; tags: Tag[]; rarity?: Rarity }
export const RARITY_POWER: Record<Rarity, number> = { common: 1, rare: 2, epic: 3 };
export const cardPower = (c: Card) => RARITY_POWER[c.rarity ?? 'common'];
// Differentiated deck: each tag has both PURE (single-tag) and BLEND (dual-tag) cards, so a
// player can specialise cleanly or mix. No tag routes exclusively through another.
export const DECK: Card[] = [
  { id: 'ice-veins',   name: 'Ice in the Veins', tags: ['composure'] },
  { id: 'cool-finish', name: 'Cool Finish',      tags: ['composure', 'flair'] },
  { id: 'read-game',   name: 'Read the Game',    tags: ['composure', 'aggression'] },
  { id: 'crunch',      name: 'Crunching Tackle', tags: ['aggression'] },
  { id: 'last-ditch',  name: 'Last-Ditch Block', tags: ['aggression', 'teamwork'] },
  { id: 'dark-arts',   name: 'Dark Arts',        tags: ['aggression', 'leadership'] },
  { id: 'splitter',    name: 'Defence-Splitter', tags: ['creativity'] },
  { id: 'killer-ball', name: 'Killer Ball',      tags: ['creativity', 'teamwork'] },
  { id: 'no-look',     name: 'No-look Pass',     tags: ['creativity', 'flair'] },
  { id: 'anchor',      name: 'Anchor the Middle', tags: ['teamwork'] },
  { id: 'hold-up',     name: 'Hold-up Play',     tags: ['teamwork', 'composure'] },
  { id: 'captain',     name: "Captain's Speech", tags: ['leadership'] },
  { id: 'rally',       name: 'Rally the Team',   tags: ['leadership', 'stamina'] },
  { id: 'lung-buster', name: 'Lung-buster Run',  tags: ['stamina'] },
  { id: 'box-to-box',  name: 'Box-to-Box',       tags: ['stamina', 'creativity'] },
  { id: 'overlap',     name: 'Overlapping Run',  tags: ['stamina', 'flair'] },
  { id: 'stepover',    name: 'Stepover',         tags: ['flair'] },
  { id: 'mazy',        name: 'Mazy Dribble',     tags: ['flair', 'creativity'], rarity: 'rare' },
  // RARE / EPIC signature cards — drafting one is a big identity commitment (higher power → bigger stat pull)
  { id: 'wand',        name: 'A Wand of a Left Foot', tags: ['creativity', 'flair'], rarity: 'epic' },
  { id: 'poacher',     name: "Poacher's Instinct",    tags: ['composure', 'flair'], rarity: 'epic' },
  { id: 'general',     name: 'Defensive General',     tags: ['aggression', 'composure'], rarity: 'epic' },
  { id: 'engine-epic', name: 'Relentless Engine',     tags: ['stamina', 'teamwork'], rarity: 'epic' },
  { id: 'talisman',    name: 'Talisman',              tags: ['leadership', 'creativity'], rarity: 'epic' },
  { id: 'enforcer',    name: 'The Enforcer',          tags: ['aggression', 'leadership'], rarity: 'rare' },
  // expansion batch — more variety of moments
  { id: 'trivela',     name: 'Trivela',               tags: ['flair', 'creativity'], rarity: 'rare' },
  { id: 'nutmeg',      name: 'Nutmeg',                tags: ['flair'] },
  { id: 'recovery',    name: 'Recovery Sprint',       tags: ['stamina', 'aggression'] },
  { id: 'thru-lines',  name: 'Through the Lines',     tags: ['creativity', 'composure'] },
  { id: 'streetwise',  name: 'Streetwise',            tags: ['aggression', 'composure'] },
  { id: 'trigger',     name: 'Trigger the Press',     tags: ['aggression', 'teamwork'] },
  { id: 'switch',      name: 'Switch the Play',       tags: ['creativity', 'leadership'] },
  { id: 'clutch',      name: 'Clutch Moment',         tags: ['composure', 'leadership'], rarity: 'epic' },
  // expansion batch — shore up the under-served teamwork / stamina / leadership moments
  { id: 'backs-wall',  name: 'Backs to the Wall',     tags: ['teamwork', 'leadership'] },
  { id: 'second-wind', name: 'Second Wind',           tags: ['stamina'] },
  { id: 'shuttle',     name: 'Shuttle Runs',          tags: ['stamina', 'teamwork'] },
  { id: 'one-two',     name: 'One-Two',               tags: ['teamwork', 'creativity'] },
  { id: 'drag-back',   name: 'Drag-back Turn',        tags: ['flair', 'composure'] },
  { id: 'vocal',       name: 'Vocal Leader',          tags: ['leadership'] },
  { id: 'roar',        name: 'Roar of Defiance',      tags: ['leadership', 'teamwork'], rarity: 'rare' },
  { id: 'iron-lung',   name: 'Iron Lung',             tags: ['stamina', 'leadership'], rarity: 'epic' },
  // ── BIG VARIETY EXPANSION: many more moments per tag so a long career rarely repeats a card ──
  // composure
  { id: 'slow-it',     name: 'Slow it Down',          tags: ['composure'] },
  { id: 'unflappable', name: 'Unflappable',           tags: ['composure'] },
  { id: 'panenka',     name: 'Panenka Penalty',       tags: ['composure'], rarity: 'rare' },
  { id: 'time-tackle', name: 'Time the Tackle',       tags: ['composure', 'aggression'] },
  { id: 'the-pause',   name: 'The Pause',             tags: ['composure', 'creativity'], rarity: 'rare' },
  { id: 'reverse',     name: 'Reverse Pass',          tags: ['composure', 'creativity'] },
  // flair
  { id: 'cheeky-flick', name: 'Cheeky Flick',         tags: ['flair'] },
  { id: 'rabona',      name: 'Rabona',                tags: ['flair'], rarity: 'rare' },
  { id: 'elastico',    name: 'Elástico',              tags: ['flair'], rarity: 'rare' },
  { id: 'rainbow',     name: 'Rainbow Flick',         tags: ['flair'], rarity: 'rare' },
  { id: 'aud-chip',    name: 'Audacious Chip',        tags: ['flair', 'composure'] },
  { id: 'roulette',    name: 'Marseille Roulette',    tags: ['flair', 'stamina'], rarity: 'rare' },
  { id: 'showboat',    name: 'Showboat',              tags: ['flair', 'creativity'] },
  // aggression
  { id: 'slide',       name: 'Slide Tackle',          tags: ['aggression'] },
  { id: 'win-header',  name: 'Win the Header',        tags: ['aggression'] },
  { id: 'agg-press',   name: 'Aggressive Press',      tags: ['aggression'] },
  { id: 'block-shot',  name: 'Block the Shot',        tags: ['aggression', 'teamwork'] },
  { id: 'shepherd',    name: 'Shepherd it Out',       tags: ['aggression', 'composure'] },
  { id: 'lead-press',  name: 'Lead the Press',        tags: ['aggression', 'leadership'] },
  // creativity
  { id: 'vision',      name: 'Vision',                tags: ['creativity'] },
  { id: 'half-space',  name: 'Find the Half-Space',   tags: ['creativity'] },
  { id: 'diagonal',    name: 'Raking Diagonal',       tags: ['creativity'] },
  { id: 'lofted',      name: 'Lofted Through-Ball',   tags: ['creativity', 'flair'] },
  { id: 'dictate',     name: 'Dictate the Tempo',     tags: ['creativity', 'leadership'] },
  // teamwork
  { id: 'link',        name: 'Link the Play',         tags: ['teamwork'] },
  { id: 'cover-space', name: 'Cover the Space',       tags: ['teamwork'] },
  { id: 'press-unit',  name: 'Press as a Unit',       tags: ['teamwork'] },
  { id: 'overload',    name: 'Create the Overload',   tags: ['teamwork', 'creativity'] },
  { id: 'hold-shape',  name: 'Hold the Shape',        tags: ['teamwork', 'composure'] },
  { id: 'selfless',    name: 'Selfless Graft',        tags: ['teamwork', 'stamina'] },
  // leadership
  { id: 'marshal',     name: 'Marshal the Line',      tags: ['leadership'] },
  { id: 'demand-ball', name: 'Demand the Ball',       tags: ['leadership'] },
  { id: 'step-up',     name: 'Step Up',               tags: ['leadership', 'composure'] },
  { id: 'gee-up',      name: 'Gee Them Up',           tags: ['leadership', 'stamina'] },
  { id: 'armband',     name: 'Wear the Armband',      tags: ['leadership', 'teamwork'], rarity: 'rare' },
  // stamina
  { id: 'press-90',    name: 'Press for 90',          tags: ['stamina'] },
  { id: 'engine-room', name: 'Engine Room',           tags: ['stamina'] },
  { id: 'late-run',    name: 'Late Run',              tags: ['stamina'] },
  { id: 'counter-press', name: 'Counter-Press',       tags: ['stamina', 'aggression'] },
  { id: 'up-and-down', name: 'Up and Down',           tags: ['stamina', 'teamwork'] },
  // rare / epic signatures
  { id: 'maestro',     name: 'Midfield Maestro',      tags: ['creativity', 'composure'], rarity: 'epic' },
  { id: 'destroyer',   name: 'The Destroyer',         tags: ['aggression', 'stamina'], rarity: 'epic' },
  { id: 'fox-box',     name: 'Fox in the Box',        tags: ['composure', 'flair'], rarity: 'rare' },
  { id: 'set-piece',   name: 'Set-Piece Specialist',  tags: ['creativity', 'composure'], rarity: 'rare' },
  { id: 'target-man',  name: 'Target Man',            tags: ['teamwork', 'aggression'], rarity: 'rare' },
  { id: 'winger-wiz',  name: "Winger's Magic",        tags: ['flair', 'stamina'], rarity: 'epic' },
  { id: 'libero',      name: 'Ball-Playing Libero',   tags: ['composure', 'creativity'], rarity: 'rare' },
  { id: 'box-crash',   name: 'Crash the Box',         tags: ['stamina', 'aggression'] },
];

// The small deck EVERY outfield career starts with; the rest is drafted between seasons.
const STARTER_IDS = ['ice-veins', 'crunch', 'splitter', 'anchor', 'lung-buster', 'stepover', 'hold-up'];
export const STARTER_DECK: Card[] = DECK.filter((c) => STARTER_IDS.includes(c.id));
export const DRAFT_POOL: Card[] = DECK.filter((c) => !STARTER_IDS.includes(c.id));

// The goalkeeper track's deck: keeping-focused with a few shared mental cards. A GK career draws
// from this instead of the outfield DECK, so `keeping` (and the calm/commanding traits that suit a
// keeper) is what grows.
export const GK_DECK: Card[] = [
  { id: 'shot-stop',   name: 'Shot-Stopper',      tags: ['keeping'] },
  { id: 'point-blank', name: 'Point-Blank Save',  tags: ['keeping', 'composure'] },
  { id: 'one-on-one',  name: 'Smother the 1-on-1', tags: ['keeping', 'aggression'] },
  { id: 'command',     name: 'Command the Area',  tags: ['keeping', 'leadership'] },
  { id: 'claim-cross', name: 'Claim the Cross',   tags: ['keeping', 'composure'] },
  { id: 'sweeper',     name: 'Sweeper-Keeper',    tags: ['keeping', 'stamina'] },
  { id: 'distribution', name: 'Quick Distribution', tags: ['keeping', 'creativity'] },
  { id: 'goal-kick',   name: 'Pinged Goal-Kick',  tags: ['keeping', 'flair'] },
  { id: 'organise',    name: 'Organise the Wall',  tags: ['leadership', 'composure'] },
  { id: 'calm-back',   name: 'Calm it at the Back', tags: ['composure', 'teamwork'] },
  { id: 'penalty-hero', name: 'Penalty Hero',      tags: ['keeping', 'composure'], rarity: 'epic' },
  { id: 'sweeper-elite', name: 'Modern Sweeper',   tags: ['keeping', 'creativity'], rarity: 'rare' },
  // expansion batch — more keeping moments
  { id: 'fingertip',   name: 'Fingertip Save',    tags: ['keeping'] },
  { id: 'parry',       name: 'Parry the Danger',  tags: ['keeping', 'aggression'] },
  { id: 'safe-hands',  name: 'Safe Hands',        tags: ['keeping', 'teamwork'] },
  { id: 'wonder-save', name: 'Wonder Save',       tags: ['keeping', 'flair'], rarity: 'rare' },
  // ── GK variety expansion ──
  { id: 'tip-over',    name: 'Tip it Over',       tags: ['keeping'] },
  { id: 'reflex',      name: 'Reflex Save',       tags: ['keeping'] },
  { id: 'stay-big',    name: 'Stay Big',          tags: ['keeping', 'composure'] },
  { id: 'narrow-ang',  name: 'Narrow the Angle',  tags: ['keeping', 'composure'] },
  { id: 'punch-clear', name: 'Punch Clear',       tags: ['keeping', 'aggression'] },
  { id: 'brave-feet',  name: 'Brave at his Feet', tags: ['keeping', 'aggression'] },
  { id: 'command-box', name: 'Command the Box',   tags: ['keeping', 'leadership'] },
  { id: 'throw-launch', name: 'Throw a Counter',  tags: ['keeping', 'creativity'] },
  { id: 'play-short',  name: 'Play it Short',     tags: ['keeping', 'teamwork'] },
  { id: 'double-save', name: 'Double Save',       tags: ['keeping', 'stamina'], rarity: 'rare' },
  { id: 'one-handed',  name: 'One-Handed Stop',   tags: ['keeping', 'flair'], rarity: 'rare' },
  { id: 'spot-king',   name: 'Spot-Kick King',    tags: ['keeping', 'leadership'], rarity: 'rare' },
  { id: 'save-season', name: 'Save of the Season', tags: ['keeping'], rarity: 'epic' },
];
const GK_STARTER_IDS = ['shot-stop', 'claim-cross', 'organise', 'calm-back'];
const GK_STARTER: Card[] = GK_DECK.filter((c) => GK_STARTER_IDS.includes(c.id));
const GK_DRAFT_POOL: Card[] = GK_DECK.filter((c) => !GK_STARTER_IDS.includes(c.id));
/** A card's display name by id (across both decks) — for narration/UI. */
export const cardName = (id: string): string => [...DECK, ...GK_DECK].find((c) => c.id === id)?.name ?? id;

/** What the player actually DOES when a card is played — the story-mode "meaning" of each choice. */
export const CARD_DESC: Record<string, string> = {
  'ice-veins': 'Keep a cool head when it matters most.', 'cool-finish': 'Pick your spot and finish with ice-cold composure.',
  'read-game': 'Read the danger early and step in before it develops.', crunch: 'Fly into a hard, committed tackle to win it back.',
  'last-ditch': 'Throw your body in the way with a desperate block.', 'dark-arts': 'Use the dark arts — a clever foul, a word in the ear — to break up play.',
  splitter: 'Slide a defence-splitting pass through the eye of a needle.', 'killer-ball': 'Pick out the killer ball to release a runner.',
  'no-look': 'Disguise it with a no-look pass to wrong-foot everyone.', anchor: 'Sit in and anchor the midfield, keeping it all ticking.',
  'hold-up': 'Hold the ball up, back to goal, and bring others into play.', captain: "Rally the team with a rousing captain's speech.",
  rally: 'Dig in and drive the team on when legs are tiring.', 'lung-buster': 'Make a lung-busting run from deep to support the attack.',
  'box-to-box': 'Cover every blade of grass, box to box.', overlap: 'Bomb forward on the overlap to stretch the play.',
  stepover: 'Take your man on with a stepover and a burst of pace.', mazy: 'Set off on a mazy dribble, gliding past challenges.',
  wand: 'Produce a moment of pure magic with that wand of a left foot.', poacher: "Ghost in with a poacher's instinct to pounce.",
  general: 'Marshal the defence like a general, organising everything.', 'engine-epic': 'Run and run — a relentless engine that never stops.',
  talisman: 'Drag the team forward on your own, the talisman.', enforcer: "Impose yourself — no one's getting past.",
  trivela: 'Wrap your foot round it with an outrageous trivela.', nutmeg: "Slip it through your marker's legs — nutmeg!",
  recovery: 'Turn and sprint back to snuff out the danger.', 'thru-lines': 'Carry it calmly through the lines, breaking the press.',
  streetwise: 'Do the streetwise thing — buy the foul, kill the tempo.', trigger: 'Trigger the press and hunt the ball down as a unit.',
  switch: 'Switch the play with one sweep of the boot to the free man.', clutch: 'Stand up in the clutch and deliver when it counts.',
  'backs-wall': 'Marshal a backs-to-the-wall rearguard and see the storm out together.', 'second-wind': 'Find a second wind and keep going when the tank looks empty.',
  shuttle: 'Put in the hard yards, shuttling across to cover for a teammate.', 'one-two': 'Play a slick one-two and spin off the back of your marker.',
  'drag-back': 'Drag it back on a sixpence and leave your man for dead.', vocal: 'Never stop talking — organise, cajole and demand more from those around you.',
  roar: 'Let out a roar of defiance and rally everyone for one more stand.', 'iron-lung': 'Run the legs off everyone and lead by sheer relentless example.',
  'shot-stop': 'Spring across your goal to make a vital save.', 'point-blank': 'Somehow keep out a point-blank effort.',
  'one-on-one': 'Rush out and smother the one-on-one.', command: 'Come and claim it, commanding your box.',
  'claim-cross': 'Rise to pluck the cross out of the air.', sweeper: 'Sweep up behind the defence like an extra outfielder.',
  distribution: 'Launch a swift counter with sharp distribution.', 'goal-kick': 'Ping a pinpoint goal-kick to start the attack.',
  organise: 'Organise the wall and bark out the orders.', 'calm-back': 'Calm it down at the back — no panic.',
  'penalty-hero': 'Guess right and become the hero from the spot.', 'sweeper-elite': 'Play as a modern sweeper-keeper, starting moves from the back.',
  fingertip: 'Get a vital fingertip to it and turn it round the post.', parry: 'Attack the ball and parry the danger to safety.',
  'safe-hands': 'Gather it cleanly with safe hands to settle everyone.', 'wonder-save': 'Somehow pull off a wonder save that defies belief.',
  // expansion descriptions — outfield
  'slow-it': 'Take the sting out of the game and keep it under control.', unflappable: 'Refuse to be rattled as the crowd turns up the heat.',
  panenka: 'Dink it straight down the middle from the spot with pure nerve.', 'time-tackle': 'Wait, wait… then win it clean with perfect timing.',
  'the-pause': 'Freeze the defence with a disguised pause before you release it.', reverse: 'Roll a reverse pass against the grain to spring the door open.',
  'cheeky-flick': 'A cheeky backheel flick that leaves the stadium gasping.', rabona: 'Wrap your leg behind the standing one and whip it — a rabona.',
  elastico: 'Snap it one way then the other in the blink of an eye.', rainbow: 'Scoop it up and over his head — pure showboat.',
  'aud-chip': 'Spot the keeper off his line and dink it over with impudence.', roulette: 'Spin away through the challenge with a Marseille roulette.',
  showboat: 'Juggle it past your man and draw the fury of the bench.', slide: 'Commit to a full-blooded sliding tackle to win it back.',
  'win-header': 'Attack the ball and win the aerial duel with a thumping header.', 'agg-press': 'Hound the ball-carrier and force the mistake.',
  'block-shot': 'Throw yourself in front of the shot for the team.', shepherd: 'Usher the winger away from danger — calm, strong, patient.',
  'lead-press': 'Set the trigger and drag the whole team up to hunt the ball.', vision: 'See a pass no one else in the ground even imagined.',
  'half-space': 'Drift into the pocket between the lines and turn to face goal.', diagonal: 'Spray a fifty-yard diagonal onto a teammate’s boot.',
  lofted: 'Loft it delicately over the last man into the runner’s stride.', dictate: 'Get on the ball again and again and pull every string.',
  link: 'Be the glue — one touch, keep it moving, bring others in.', 'cover-space': 'Do the unseen work, filling the space the runner left.',
  'press-unit': 'Move as one, squeezing the pitch for the whole team.', overload: 'Drift across to make it two-on-one and free the full-back.',
  'hold-shape': 'Discipline over instinct — hold your position and trust it.', selfless: 'Do the running for others, closing every angle.',
  marshal: 'Push them up, drop them back — organise the whole line.', 'demand-ball': 'Show for it when others hide and take responsibility.',
  'step-up': 'Grab the ball in the shoot-out — you’ll take one.', 'gee-up': 'Sprint back to your keeper and fire everyone up.',
  armband: 'Be the one who holds it together when it’s all coming apart.', 'press-90': 'Never give the defenders a single moment’s peace all game.',
  'engine-room': 'Cover ground others simply can’t, over and over.', 'late-run': 'Time the run into the box when everyone else is spent.',
  'counter-press': 'Win it back within five seconds of losing it.', 'up-and-down': 'Get up and back all game as a tireless wing-back.',
  maestro: 'Conduct the entire match to your own private rhythm.', destroyer: 'Break up everything and cover every blade — the screen.',
  'fox-box': 'Always in the right place — a natural fox in the box.', 'set-piece': 'Whip a dead ball onto a sixpence, every single time.',
  'target-man': 'Win it, hold it, bring the runners in — the focal point.', 'winger-wiz': 'Terrorise the full-back down the flank all afternoon.',
  libero: 'Stride out from the back, a ball-playing libero splitting the lines.', 'box-crash': 'Crash the box late and get on the end of it.',
  // expansion descriptions — goalkeeper
  'tip-over': 'Get a strong hand up and tip it over the bar.', reflex: 'React to the deflection on pure reflex and keep it out.',
  'stay-big': 'Hold your ground in the one-on-one and stay tall.', 'narrow-ang': 'Set yourself, make the goal small, force the miss.',
  'punch-clear': 'Attack the cross and punch it clear to safety.', 'brave-feet': 'Spread yourself at the striker’s feet without flinching.',
  'command-box': 'Come and claim everything — bark the orders.', 'throw-launch': 'Roll it out fast to spring a lightning counter.',
  'play-short': 'Start the build-up calmly and short from the back.', 'double-save': 'Save one, scramble up, and save the rebound too.',
  'one-handed': 'A full-stretch, one-handed save that beggars belief.', 'spot-king': 'Own the shoot-out and stand tall from twelve yards.',
  'save-season': 'The kind of save they’ll still show years from now.',
};

// deck-building config
export const OFFER_SIZE = 5;   // cards shown at a between-season draft (a wider choice from the big pool)
export const DRAFT_PICKS = 3;  // how many you add each draft → a deck that grows to ~25 over the 7 chapters

// ── BACKROOM STAFF: at each age-chapter break you appoint a mentor/coach for the coming chapter.
// A coach amplifies your work in their SPECIALTY — you get better SUCCESS playing cards in those tags,
// so that development compounds. Appoint one that matches your identity to sharpen it, or one that
// shores up a weakness. A strategic layer on top of deck-building.
export interface Coach { id: string; name: string; kind: 'coach' | 'mentor'; desc: string; specialty: Tag[]; bonus: number }
export const COACHES: Coach[] = [
  { id: 'finishing',  name: 'Finishing Coach',   kind: 'coach',  desc: 'Hours drilling the work in front of goal',   specialty: ['composure', 'flair'], bonus: 0.12 },
  { id: 'technical',  name: 'Technical Coach',    kind: 'coach',  desc: 'Endless reps on close control & vision',      specialty: ['creativity', 'flair'], bonus: 0.12 },
  { id: 'defensive',  name: 'Defensive Coach',    kind: 'coach',  desc: 'Drills the dark arts of defending',           specialty: ['aggression', 'teamwork'], bonus: 0.12 },
  { id: 'fitness',    name: 'Fitness Coach',      kind: 'coach',  desc: 'Runs you into the ground — and back',         specialty: ['stamina'], bonus: 0.14 },
  { id: 'mentality',  name: 'Mentality Coach',    kind: 'coach',  desc: 'Builds the mind as much as the body',         specialty: ['composure', 'leadership'], bonus: 0.12 },
  { id: 'veteran',    name: 'Veteran Mentor',     kind: 'mentor', desc: 'A wise old pro takes you under his wing',     specialty: ['composure', 'leadership', 'teamwork'], bonus: 0.1 },
  { id: 'playmaker',  name: 'Playmaker Mentor',   kind: 'mentor', desc: 'A legendary no.10 shows you how to see it',   specialty: ['creativity', 'teamwork'], bonus: 0.12 },
  { id: 'warrior',    name: 'Warrior Mentor',     kind: 'mentor', desc: 'An old-school hard man teaches you to bite',  specialty: ['aggression', 'stamina'], bonus: 0.12 },
  { id: 'gk-coach',   name: 'Goalkeeping Coach',  kind: 'coach',  desc: 'Shot-stopping, handling, commanding the box', specialty: ['keeping'], bonus: 0.14 },
  { id: 'leadership', name: 'Leadership Coach',   kind: 'coach',  desc: 'Turns quiet lads into captains',              specialty: ['leadership'], bonus: 0.14 },
  { id: 'pressing',   name: 'Pressing Coach',     kind: 'coach',  desc: 'Choreographs the collective press',           specialty: ['stamina', 'aggression'], bonus: 0.12 },
  { id: 'creative',   name: 'Creativity Coach',   kind: 'coach',  desc: 'Frees the imagination in tight spaces',       specialty: ['creativity', 'composure'], bonus: 0.12 },
  { id: 'talisman-m', name: 'Talisman Mentor',    kind: 'mentor', desc: 'A born matchwinner teaches you to seize it',  specialty: ['flair', 'leadership'], bonus: 0.12 },
  { id: 'general-m',  name: 'The General',        kind: 'mentor', desc: 'A commanding centre-half drills your reading of the game', specialty: ['aggression', 'composure', 'teamwork'], bonus: 0.11 },
];
export const COACH_OFFER = 3; // choices shown at each appointment

// ── SPORTS AGENTS: chosen when you start a career, an agent shapes your whole trajectory — how much
// EXPOSURE you get (big-stage moments), how good your opportunities are (draft luck), your market
// VALUE, and how GREEDY you turn out (what it'll cost a manager to keep you). A super-agent maximises
// fame and fees but makes you mercenary; a family advisor keeps you loyal and cheap.
export interface Agent { id: string; name: string; desc: string; exposure: number; draftLuck: number; greed: number; valueMod: number }
export const AGENTS: Agent[] = [
  { id: 'ambitious', name: 'Ambitious Agent',  desc: 'Chases the big stage and the big move',        exposure: 1.4,  draftLuck: 1.2,  greed: 3,  valueMod: 1.1 },
  { id: 'loyal',     name: 'Loyal Agent',      desc: 'Keeps you grounded, settled and well-liked',   exposure: 1.0,  draftLuck: 1.0,  greed: -3, valueMod: 1.0 },
  { id: 'super',     name: 'Super-Agent',      desc: 'Elite connections and elite fees — for a cut', exposure: 1.6,  draftLuck: 1.35, greed: 6,  valueMod: 1.25 },
  { id: 'family',    name: 'Family Advisor',   desc: 'A trusted relative — in it for you, not money', exposure: 0.95, draftLuck: 1.0,  greed: -5, valueMod: 0.95 },
  { id: 'showman',   name: 'The Showman',      desc: 'Markets you relentlessly — fame over fees',     exposure: 1.5,  draftLuck: 1.1,  greed: 2,  valueMod: 1.2 },
  { id: 'grafter',   name: 'The Grafter’s Agent', desc: 'Old-school; picks clubs where you’ll play', exposure: 1.05, draftLuck: 1.15, greed: -2, valueMod: 1.0 },
];
export const agentById = (id?: string) => AGENTS.find((a) => a.id === id) ?? null;
/** how each temperament tilts greed (nature) — layered on the agent's influence */
const PERSONALITY_GREED: Record<string, number> = { maverick: 3, mercurial: 2, biggame: 1, fragile: 0, workhorse: -1, pro: -2, leader: -2, latebloom: -1, showman: 3 };

// Manager-side contract economics (contractCost / contractLength / releaseClause / Contract …) live in
// contracts.ts so the Manager game gets them via the barrel without the Layer-1 sim. Re-exported here
// for the career harness's convenience.
export { contractCost, contractLength, releaseClause, breederRevenue, contractExpirySeason, contractActive, contractView, signContract, type Contract, type PlayerContractView } from './contracts.js';

// ── FINANCIAL DECISIONS: at most age-chapter breaks (from the Academy on) an OFFER lands on the table.
// This is the money layer of a player's life — and it MUST trade against the pitch. Chase the money and
// your earnings, fame and greed climb but you lose a step of development that chapter (a distracted,
// unsettled season); stay grounded and you develop keenly, stay cheap, but never cash in. `earn` is a
// coin figure (a signing/deal), `form` a one-chapter success nudge, the rest permanent temperament.
export interface Offer { id: string; name: string; desc: string; earn: number; greed: number; market: number; form: number }
export const OFFERS: Offer[] = [
  { id: 'money',   name: 'Big-Money Move',   desc: 'A rich club abroad triples your wages — but it means uprooting and settling in all over again', earn: 900, greed: 2,  market: 2, form: -0.08 },
  { id: 'brand',   name: 'Boot & Kit Deal',  desc: 'A lucrative sponsorship and a rising profile — and the distractions that come with fame',       earn: 500, greed: 1,  market: 3, form: -0.05 },
  { id: 'develop', name: 'Stay & Develop',   desc: 'Turn the money down, knuckle down at your club — you develop keenly and the fans adore you',    earn: 120, greed: -2, market: 0, form:  0.06 },
];
export const OFFER_CHOICES = 3;
/** Deterministic financial offer set for a chapter (all three archetypes; the player picks their path). */
export function rollOffer(_rng: () => number, _turn: number): Offer[] { return OFFERS; }

// ── FOCUS: between each chapter you decide how to spend the summer. Deterministic + development-neutral
// (moves energy + relationships only, no rng), so it steers which meters you carry into the next chapter
// — and thus which consequences bite — without disturbing the graduation trajectory. Stage-appropriate:
// a kid rests / studies / plays with mates; a pro tends a partner, works his agent, courts sponsors.
export interface FocusOption { id: string; icon: string; name: string; desc: string; energy: number; effects: Partial<Record<MeterKey, number>> }
const FOCUS_REST: FocusOption = { id: 'rest', icon: '🛌', name: 'Rest & Recharge', desc: 'A proper summer off. Come back fresh.', energy: +22, effects: { family: +4, peers: +3 } };
const FOCUS_BY_CHAPTER: Record<string, FocusOption[]> = {
  Grassroots: [
    { id: 'family',  icon: '🏠', name: 'Family Time',     desc: 'Kickabouts in the garden with your folks. Grounding.', energy: +10, effects: { family: +14, peers: +3 } },
    { id: 'mates',   icon: '🧒', name: 'Out With Mates',  desc: 'Long summer days with your mates. Priceless at this age.', energy: +6, effects: { peers: +16, family: -3 } },
    { id: 'skills',  icon: '⚽', name: 'Skills in the Park', desc: 'Hours against a wall. The coach will notice.', energy: -8, effects: { authority: +14, peers: +2 } },
  ],
  Academy: [
    { id: 'school',  icon: '🎒', name: 'Hit the Books',   desc: 'Keep the grades up — a fallback and a discipline.', energy: -6, effects: { school: +16, family: +6 } },
    { id: 'impress', icon: '🧑‍🏫', name: 'Impress the Coach', desc: 'Extra sessions, first to arrive. Staff love a grafter.', energy: -10, effects: { authority: +16, peers: -3 } },
    { id: 'mates',   icon: '🧒', name: 'Team Bonding',    desc: 'Tight with the lads — a dressing room that fights for you.', energy: +4, effects: { peers: +15, school: -4 } },
  ],
  Scholar: [
    { id: 'agent',   icon: '🤝', name: 'Sign With an Agent', desc: 'Someone to fight your corner as the offers start to whisper.', energy: -6, effects: { agent: +20 } },
    { id: 'impress', icon: '🧑‍🏫', name: 'Extra Sessions',   desc: 'Stay behind, do the ugly work. The coach is watching who wants it.', energy: -12, effects: { authority: +16, peers: -2 } },
    { id: 'school',  icon: '🎒', name: 'Finish Your Studies', desc: 'A scholar in name — keep the qualifications as a safety net.', energy: -6, effects: { school: +16, peers: +2 } },
  ],
  'Youth Team': [
    { id: 'partner', icon: '❤️', name: 'A New Romance',    desc: 'You’ve met someone. Settled and happy off the pitch.', energy: +12, effects: { partner: +18 } },
    { id: 'agent',   icon: '🤝', name: 'Work Your Agent',  desc: 'Dinners and phone calls — get him fighting for you.', energy: -8, effects: { agent: +18, authority: -2 } },
    { id: 'impress', icon: '🧑‍🏫', name: 'Court the Gaffer', desc: 'Make yourself undroppable in pre-season.', energy: -12, effects: { authority: +16, partner: -4 } },
  ],
  Breakthrough: [
    { id: 'partner', icon: '❤️', name: 'Time With Partner', desc: 'Protect your relationship as the spotlight grows.', energy: +10, effects: { partner: +16, fans: -2 } },
    { id: 'fans',    icon: '📣', name: 'Work the Fans',     desc: 'Community days, autographs — the terraces will sing your name.', energy: -8, effects: { fans: +18, partner: -4 } },
    { id: 'agent',   icon: '🤝', name: 'Lean on Your Agent', desc: 'Position yourself for the big move.', energy: -6, effects: { agent: +16, authority: -3 } },
  ],
  'First Team': [
    { id: 'starter', icon: '🧑‍🏫', name: 'Nail Your Starting Spot', desc: 'Pre-season graft — make the shirt yours and undroppable.', energy: -12, effects: { authority: +16, peers: -2 } },
    { id: 'fans',    icon: '📣', name: 'Give Back to the Fans', desc: 'Become a terrace favourite — they’ll carry you on the bad days.', energy: -8, effects: { fans: +16, partner: -3 } },
    { id: 'partner', icon: '❤️', name: 'Time With Partner', desc: 'A stable home life behind the rising star.', energy: +10, effects: { partner: +16, fans: -2 } },
  ],
  Establishing: [
    { id: 'sponsors', icon: '📸', name: 'Sponsor Duties',   desc: 'Shoots and appearances. The brand — and the bank — grow.', energy: -12, effects: { sponsors: +18, peers: -4 } },
    { id: 'fans',     icon: '📣', name: 'Icon of the Terraces', desc: 'Give the supporters everything. Become untouchable.', energy: -8, effects: { fans: +16, partner: -3 } },
    { id: 'partner',  icon: '❤️', name: 'Settle Down',       desc: 'A stable home life behind the superstar.', energy: +10, effects: { partner: +16, sponsors: -4 } },
  ],
};
/** The between-chapter focus choices for a life stage (Rest is always available). */
export function rollFocus(chapter: string): FocusOption[] {
  return [...(FOCUS_BY_CHAPTER[chapter] ?? FOCUS_BY_CHAPTER.Establishing), FOCUS_REST];
}

/** Seeded coach choices for a track: outfield sees no GK-only coach, GK sees the GK coach + mental ones. */
export function rollCoaches(rng: () => number, track: Track, n = COACH_OFFER): Coach[] {
  const pool = COACHES.filter((c) => (track === 'goalkeeper' ? true : !c.specialty.includes('keeping')));
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(n, pool.length));
}

// ── scenarios: each moment demands a weighted mix of tags; kind biases the demand ──
// stakes 1 (normal) / 2 (big) / 3 (huge). Big moments are worth MORE (shape you harder) and are
// riskier (more variance) — this is where reputations are made and the Big-Game Player trait is earned.
export interface Scenario { id: string; kind: 'match' | 'social' | 'training'; demand: Partial<Record<Tag, number>>; label: string; stakes: 1 | 2 | 3 }
const KIND_BIAS: Record<Scenario['kind'], Tag[]> = {
  match: TAGS,                                                   // anything can come up in a match
  social: ['leadership', 'composure', 'teamwork'],              // dressing room / media
  training: ['stamina', 'creativity', 'flair', 'aggression'],   // sharpen the tools
};
const KIND_POOL: Scenario['kind'][] = ['match', 'match', 'match', 'social', 'training'];
// goalkeeper moments demand keeping heavily, plus the calm/commanding traits that suit a keeper
const GK_BIAS: Tag[] = ['keeping', 'keeping', 'keeping', 'composure', 'leadership', 'creativity'];
const BIG_MOMENTS = ['Derby Day', 'Cup Quarter-Final', 'Relegation Six-Pointer', 'Live on TV', 'Top-of-the-Table Clash', 'The Return to a Former Club', 'A Scout-Packed Showcase', 'Local Bragging Rights'];
const HUGE_MOMENTS = ['CUP FINAL', 'Title Decider', 'Promotion Play-Off Final', 'The Last Day of the Season', 'A Cup Semi Under the Lights', 'The Biggest Game in the Club’s History'];

/** A seeded scenario. Tag demand comes from the current AGE BAND (age-appropriate); stakes are gated
 *  by the band (no cup finals at grassroots). `demandBias` (a gaffer's demand) leans the demand. */
export function makeScenario(rng: () => number, i: number, track: Track = 'outfield', demandBias?: Tag | null, band?: AgeBand, exposure = 1): Scenario {
  const kind = KIND_POOL[Math.floor(rng() * KIND_POOL.length)];
  const bias = track === 'goalkeeper' ? GK_BIAS : (band ? band.demand : OUTFIELD_TAGS);
  const n = 1 + Math.floor(rng() * Math.min(3, bias.length));
  const pool = [...new Set([...bias].sort(() => rng() - 0.5))].slice(0, n);
  const raw = pool.map(() => 0.3 + rng());
  const demand: Partial<Record<Tag, number>> = {};
  pool.forEach((t, k) => { demand[t] = raw[k]; });
  if (demandBias) demand[demandBias] = (demand[demandBias] ?? 0) + 0.6;  // the gaffer wants more of this
  const sum = Object.values(demand).reduce((a, b) => a + (b ?? 0), 0) || 1;
  for (const t of Object.keys(demand) as Tag[]) demand[t] = (demand[t] ?? 0) / sum;
  const maxStakes = band ? band.maxStakes : 3;
  const r = rng();
  const stakes: 1 | 2 | 3 = maxStakes >= 3 && r < 0.05 * exposure ? 3 : maxStakes >= 2 && r < 0.22 * exposure ? 2 : 1; // an agent's exposure = more big stages
  const moment = stakes === 3 ? HUGE_MOMENTS[Math.floor(rng() * HUGE_MOMENTS.length)]
    : stakes === 2 ? BIG_MOMENTS[Math.floor(rng() * BIG_MOMENTS.length)] : null;
  const label = moment ? `★ ${moment}` : `${kind}: ${Object.keys(demand).join(' / ')}`;
  return { id: `sc${i}`, kind, demand, label, stakes };
}

/** How well a card's tags satisfy a scenario's demand, 0..1. */
export function fit(card: Card, sc: Scenario): number {
  let f = 0;
  for (const t of card.tags) f += sc.demand[t] ?? 0;
  return clamp(f, 0, 1);
}

export interface Choice { cardId: string; tags: Tag[]; power: number; fit: number; bestFit: number; success: number; scenario: string; stakes: number }

// ── career config ──
export const HAND_SIZE = 4;

// A player's DEVELOPMENT is a human life from age 10 → 25, rendered as SEVEN age chapters (a longer, more
// textured journey — not a 300-turn grind, but far more than a slideshow). Scenarios + stakes are
// age-gated: a 12-year-old plays park football; cup finals only come once you're in the first team. A
// draft + a life-milestone event + a summer focus fire at each of the seven chapter boundaries.
export const START_AGE = 10, PRO_AGE = 25, RETIRE_AGE = 40;
export interface AgeBand { name: string; from: number; to: number; turns: number; maxStakes: 1 | 2 | 3; demand: Tag[] }
export const AGE_BANDS: AgeBand[] = [
  { name: 'Grassroots',   from: 10, to: 12, turns: 12, maxStakes: 1, demand: ['flair', 'stamina', 'creativity', 'teamwork'] },
  { name: 'Academy',      from: 13, to: 14, turns: 14, maxStakes: 1, demand: ['flair', 'stamina', 'creativity', 'teamwork', 'composure', 'aggression'] },
  { name: 'Scholar',      from: 15, to: 16, turns: 16, maxStakes: 2, demand: OUTFIELD_TAGS },
  { name: 'Youth Team',   from: 17, to: 18, turns: 18, maxStakes: 2, demand: OUTFIELD_TAGS },
  { name: 'Breakthrough', from: 19, to: 20, turns: 18, maxStakes: 3, demand: OUTFIELD_TAGS },
  { name: 'First Team',   from: 21, to: 22, turns: 18, maxStakes: 3, demand: OUTFIELD_TAGS },
  { name: 'Establishing', from: 23, to: 25, turns: 16, maxStakes: 3, demand: OUTFIELD_TAGS },
];
export const TOTAL_TURNS = AGE_BANDS.reduce((s, b) => s + b.turns, 0);

// ── STAGE-AWARE LIFE METERS ────────────────────────────────────────────────
// The relationships you juggle change as you grow up: a 10-year-old has a coach, his
// parents and his mates — no fans, sponsors or partner. They fade in at the right age
// (an agent + first partner as a youth; fans as you break through; sponsors as a star),
// and the same underlying relationship is RE-LABELLED by stage (coach → gaffer, mates
// → dressing room). Eight underlying keys; only 3–5 are active in any chapter.
export type MeterKey = 'authority' | 'peers' | 'family' | 'school' | 'agent' | 'fans' | 'sponsors' | 'partner';
export interface MeterDesc { key: MeterKey; icon: string; label: string; }
const METER: Record<string, MeterDesc> = {
  coach:     { key: 'authority', icon: '🧑‍🏫', label: 'Coach' },
  gaffer:    { key: 'authority', icon: '👔', label: 'Gaffer' },
  parents:   { key: 'family',    icon: '🏠', label: 'Parents' },
  mates:     { key: 'peers',     icon: '🧒', label: 'Mates' },
  teammates: { key: 'peers',     icon: '👥', label: 'Teammates' },
  team:      { key: 'peers',     icon: '👥', label: 'Dressing Room' },
  school:    { key: 'school',    icon: '🎒', label: 'School' },
  agent:     { key: 'agent',     icon: '🤝', label: 'Agent' },
  fans:      { key: 'fans',      icon: '📣', label: 'Fans' },
  sponsors:  { key: 'sponsors',  icon: '📸', label: 'Sponsors' },
  partner:   { key: 'partner',   icon: '❤️', label: 'Partner' },
};
const CHAPTER_METERS: Record<string, string[]> = {
  Grassroots:   ['coach', 'parents', 'mates'],
  Academy:      ['coach', 'parents', 'teammates', 'school'],
  Scholar:      ['coach', 'teammates', 'school', 'agent'],   // scholarship years: an agent enters, school still counts
  'Youth Team': ['coach', 'teammates', 'agent', 'partner'],
  Breakthrough: ['gaffer', 'team', 'fans', 'agent', 'partner'],
  'First Team': ['gaffer', 'team', 'fans', 'sponsors', 'partner'],
  Establishing: ['gaffer', 'team', 'fans', 'sponsors', 'partner'],
};
/** The age-appropriate meters (key + icon + stage label) for a given life chapter. */
export function activeMeters(chapter: string): MeterDesc[] {
  return (CHAPTER_METERS[chapter] ?? CHAPTER_METERS.Establishing).map((n) => METER[n]);
}
// cumulative turn index at which each band ENDS (last band end = TOTAL_TURNS)
const BAND_ENDS = AGE_BANDS.reduce<number[]>((acc, b) => [...acc, (acc[acc.length - 1] ?? 0) + b.turns], []);
/** The band a given development turn falls in, plus the player's age at that turn. */
export function bandAt(turn: number): { index: number; band: AgeBand; age: number } {
  let index = BAND_ENDS.findIndex((end) => turn < end);
  if (index < 0) index = AGE_BANDS.length - 1;
  const band = AGE_BANDS[index];
  const start = index === 0 ? 0 : BAND_ENDS[index - 1];
  const frac = band.turns > 1 ? (turn - start) / (band.turns - 1) : 0;
  return { index, band, age: Math.round(band.from + frac * (band.to - band.from)) };
}

/**
 * A stateful career the client drives one turn at a time. Deterministic given (seed, choices):
 * RNG is consumed in a fixed order (scenario → resolve → draw) regardless of which card is picked,
 * so replaying the same choice ids reproduces the exact same player.
 */
export class Career {
  private rng: () => number;
  private drawPile: Card[] = [];
  private discard: Card[] = [];
  private pool: Card[];              // the cards this career can DRAFT between seasons
  hand: Card[] = [];
  deck: Card[];                      // the player's growing deck (identity)
  scenario!: Scenario;
  turn = 0;
  log: Choice[] = [];
  actions: Action[] = [];           // every play/draft decision — the trade-able, resumable record
  finished = false;
  /** When set, the career is paused for a between-chapter DRAFT: pick DRAFT_PICKS of these to add. */
  pendingDraft: { options: Card[]; picksLeft: number } | null = null;
  /** When set, the career is paused to APPOINT a mentor/coach for the coming chapter. */
  pendingCoaches: Coach[] | null = null;
  coach: Coach | null = null;              // the staff member active this chapter (boosts their specialty)
  /** When set, a FINANCIAL OFFER is on the table (choose your path) before appointing a coach. */
  pendingOffer: Offer[] | null = null;
  /** When set, the career pauses at a chapter break for a FOCUS choice: how to spend the summer. */
  pendingFocus: FocusOption[] | null = null;
  /** How your relationships PAID OFF (or bit back) over the chapter that just ended — surfaced at the break. */
  chapterConsequences: string[] = [];
  earnings = 0;                            // running career earnings (coins) — wages + deals taken
  marketBonus = 0;                         // fame accrued from financial/brand decisions (→ marketability)
  greedBonus = 0;                          // greed accrued from chasing money in-career (→ final greed)
  seriousInjuries = 0;                     // major injuries suffered in development → lasting fragility
  /** The narrative event coloring the current age chapter (a new gaffer, a hot streak, a knock…). */
  seasonEvent: SeasonEvent | null = null;
  private demandBias: Tag | null = null;   // the gaffer's demand this chapter → scenarios lean this tag
  private formBonus = 0;                    // hot streak / slump → success nudge this chapter
  private extraPicks = 0;                   // a breakthrough chapter → +draft picks at the next draft

  // ── New Star Soccer-style life sim (deterministic — evolves from seeded outcomes, no extra rng) ──
  /** stamina spent living the career; recovers between chapters. Purely surfaced for now. */
  energy = 100;
  /** underlying relationships (0–100). Which are ACTIVE + how they're LABELLED depends on the life
   *  stage (a 10yo has a coach + parents + mates; a star has a gaffer + fans + sponsors + partner). */
  standing: Record<MeterKey, number> =
    { authority: 50, peers: 50, family: 62, school: 55, agent: 45, fans: 38, sponsors: 32, partner: 48 };
  private life(k: MeterKey, d: number) { if (this.chapterMeterKeys.has(k)) this.standing[k] = clamp(this.standing[k] + d, 0, 100); }
  /** the meter keys that are ACTIVE this life stage (age-appropriate) — only these move + display. */
  private get chapterMeterKeys(): Set<MeterKey> { return new Set(activeMeters(this.chapter).map((m) => m.key)); }
  /** the age-appropriate meters (key + icon + stage label + value) for the current chapter's dashboard. */
  get meters(): Array<{ key: MeterKey; icon: string; label: string; value: number }> {
    return activeMeters(this.chapter).map((m) => ({ ...m, value: this.standing[m.key] }));
  }

  readonly personality: Personality;
  readonly agent: Agent | null;            // the sports agent signed at career start — shapes exposure, opportunities, greed, value
  constructor(readonly seed: number, readonly track: Track = 'outfield', agentId?: string) {
    this.rng = mulberry32(seed);
    this.personality = rollPersonality(seed);   // innate temperament shapes how big moments / slumps play out
    this.agent = agentById(agentId);
    this.deck = [...(track === 'goalkeeper' ? GK_STARTER : STARTER_DECK)];
    this.pool = track === 'goalkeeper' ? GK_DRAFT_POOL : DRAFT_POOL;
    this.drawPile = this.shuffle([...this.deck]);
    this.refillHand();
    this.scenario = makeScenario(this.rng, this.turn, track, null, bandAt(0).band, this.exposure);
  }
  private get exposure() { return this.agent?.exposure ?? 1; }

  /** The player's current age + life chapter (Grassroots … Establishing). */
  get age() { return bandAt(Math.min(this.turn, TOTAL_TURNS - 1)).age; }
  get chapter() { return bandAt(Math.min(this.turn, TOTAL_TURNS - 1)).band.name; }

  /** Persist/trade this in-progress prospect: everything needed to resume it later or elsewhere. */
  snapshot(): CareerSnapshot { return { seed: this.seed, track: this.track, agentId: this.agent?.id, actions: [...this.actions] }; }

  /** The financial/agent context graduate() needs (greed, fame, earnings, injuries, exposure). */
  finContext(): GraduateCtx {
    return { seriousInjuries: this.seriousInjuries, agentGreed: this.agent?.greed ?? 0, agentExposure: this.agent?.exposure ?? 1, greedBonus: this.greedBonus, marketBonus: this.marketBonus, earnings: this.earnings };
  }

  /** Reconstruct a career from a snapshot by replaying its actions (deterministic → exact state). A
   *  buyer resumes development from precisely where the seller left off. */
  static resume(snap: CareerSnapshot): Career {
    const c = new Career(snap.seed, snap.track, snap.agentId);
    for (const a of snap.actions) { if (a.type === 'draft') c.draft(a.cardId, true); else if (a.type === 'coach') c.appointCoach(a.cardId, true); else if (a.type === 'offer') c.resolveOffer(a.cardId); else if (a.type === 'focus') c.chooseFocus(a.cardId, true); else c.play(a.cardId, true); }
    return c;
  }

  /** Current state: a 'coach' phase (appoint staff), a 'draft' phase (add a card), or a 'play' phase. */
  current() {
    if (this.pendingFocus) return { phase: 'focus' as const, age: this.age, chapter: this.chapter, focus: this.pendingFocus, seasonEvent: this.seasonEvent, consequences: this.chapterConsequences, energy: this.energy, deck: this.deck, finished: this.finished };
    if (this.pendingOffer) return { phase: 'offer' as const, age: this.age, chapter: this.chapter, offers: this.pendingOffer, earnings: this.earnings, deck: this.deck, finished: this.finished };
    if (this.pendingCoaches) return { phase: 'coach' as const, age: this.age, chapter: this.chapter, coaches: this.pendingCoaches, deck: this.deck, finished: this.finished };
    if (this.pendingDraft) return { phase: 'draft' as const, age: this.age, chapter: this.chapter, options: this.pendingDraft.options, picksLeft: this.pendingDraft.picksLeft, deck: this.deck, finished: this.finished };
    return { phase: 'play' as const, turn: this.turn, age: this.age, chapter: this.chapter, scenario: this.scenario, coach: this.coach, hand: this.hand, deck: this.deck, finished: this.finished };
  }

  /** CHOOSE how to spend the summer between chapters (energy + relationships; no development effect). */
  chooseFocus(focusId: string, tolerant = false) {
    if (!this.pendingFocus) throw new Error('no focus pending');
    let opt = this.pendingFocus.find((o) => o.id === focusId);
    if (!opt) {
      if (!tolerant) throw new Error('focus not on offer');
      opt = FOCUS_REST; // replay: the chosen focus drifted off this stage's list — a neutral rest
    }
    this.energy = clamp(this.energy + opt.energy, 0, 100);
    for (const [k, d] of Object.entries(opt.effects)) this.standing[k as MeterKey] = clamp(this.standing[k as MeterKey] + (d ?? 0), 0, 100);
    this.actions.push({ type: 'focus', cardId: focusId });
    this.pendingFocus = null;
    this.pendingOffer = rollOffer(this.rng, this.turn);
  }
  /** Replay/robustness: an old snapshot (pre-focus) resolving an offer skips the summer neutrally. */
  private autoResolveFocus() {
    if (!this.pendingFocus) return;
    this.pendingFocus = null;
    this.pendingOffer = rollOffer(this.rng, this.turn);
  }

  /** RESOLVE the financial offer on the table: apply its money/fame/greed/form, then move to the coach. */
  resolveOffer(offerId: string) {
    this.autoResolveFocus();
    if (!this.pendingOffer) throw new Error('no offer pending');
    const offer = this.pendingOffer.find((o) => o.id === offerId);
    if (!offer) throw new Error('offer not on table');
    this.earnings += offer.earn;
    this.greedBonus += offer.greed;
    this.marketBonus += offer.market;
    this.formBonus += offer.form;                 // added on top of the chapter's season-event form
    this.actions.push({ type: 'offer', cardId: offerId });
    this.pendingOffer = null;
    this.pendingCoaches = rollCoaches(this.rng, this.track);
  }

  /** APPOINT a mentor/coach for the coming chapter; then proceed to the card draft. */
  appointCoach(coachId: string, tolerant = false) {
    if (!this.pendingCoaches) throw new Error('no coach appointment pending');
    let coach = this.pendingCoaches.find((c) => c.id === coachId);
    if (!coach) {
      if (!tolerant) throw new Error('coach not on offer');
      coach = COACHES.find((c) => c.id === coachId) ?? this.pendingCoaches[0]; // replay: honour intent, else take the first
    }
    this.coach = coach;
    this.actions.push({ type: 'coach', cardId: coachId });
    this.pendingCoaches = null;
    this.openDraft();
  }

  /** DRAFT: add one of the offered cards to your deck (identity-building). */
  draft(cardId: string, tolerant = false) {
    if (!this.pendingDraft) throw new Error('no draft pending');
    let i = this.pendingDraft.options.findIndex((c) => c.id === cardId);
    if (i < 0) {
      if (!tolerant || this.pendingDraft.options.length === 0) throw new Error('card not on offer');
      i = 0; // replay: the intended card isn't on this (drifted) offer — take the first available
    }
    const card = this.pendingDraft.options.splice(i, 1)[0];
    this.actions.push({ type: 'draft', cardId });
    this.deck.push(card);
    this.discard.push(card);        // it enters the draw rotation right away
    if (--this.pendingDraft.picksLeft <= 0) { this.pendingDraft = null; this.startNextChapter(); }
  }

  /** Play a card from the current hand; resolves, logs, advances (into a draft at a season break).
   *  `tolerant` (replay only): if content drift moved the stored card out of the hand, fall back to the
   *  best-fit card so an old career never bricks — live play keeps validating. */
  play(cardId: string, tolerant = false): Choice {
    if (this.finished) throw new Error('career finished');
    if (this.pendingFocus) throw new Error('choose a focus first');
    if (this.pendingOffer) throw new Error('resolve the financial offer first');
    if (this.pendingCoaches) throw new Error('appoint a coach first');
    if (this.pendingDraft) throw new Error('resolve the draft first');
    let idx = this.hand.findIndex((c) => c.id === cardId);
    if (idx < 0) {
      if (!tolerant || this.hand.length === 0) throw new Error('card not in hand');
      idx = this.hand.reduce((best, c, i, arr) => (fit(c, this.scenario) > fit(arr[best], this.scenario) ? i : best), 0);
    }
    this.actions.push({ type: 'play', cardId });
    const bestFit = Math.max(...this.hand.map((c) => fit(c, this.scenario))); // best you COULD have played this turn
    const card = this.hand.splice(idx, 1)[0];
    const f = fit(card, this.scenario);
    // stakes add variance (nerves), scaled by temperament; personality lifts/sinks big moments and
    // dampens slumps; form (season event) nudges success.
    const variance = (0.3 + 0.15 * (this.scenario.stakes - 1)) * this.personality.variance;
    const bigGame = this.scenario.stakes >= 2 ? this.personality.bigGame : 0;
    const form = this.formBonus < 0 ? this.formBonus * this.personality.resilience : this.formBonus;
    // your coach lifts success when you play to their specialty (good coaching → that development compounds)
    const coaching = this.coach && card.tags.some((t) => this.coach!.specialty.includes(t)) ? this.coach.bonus : 0;
    // FATIGUE: running on empty saps a moment (below 35 energy it bites, up to −0.12 at flat 0). Makes
    // Rest and the energy-giving focus choices a real trade-off against a busy, big-moment-heavy chapter.
    const fatigue = this.energy < 35 ? ((35 - this.energy) / 35) * 0.12 : 0;
    const success = clamp(f + (this.rng() - 0.5) * variance + form + bigGame + coaching - fatigue, 0, 1);
    const choice: Choice = { cardId: card.id, tags: card.tags, power: cardPower(card), fit: f, bestFit, success, scenario: this.scenario.label, stakes: this.scenario.stakes };
    this.log.push(choice);
    this.updateLife(choice); // NSS meters + energy react to how the moment went (deterministic, no rng)
    this.discard.push(card);
    this.turn++;
    if (this.turn >= TOTAL_TURNS) { this.finished = true; return choice; }
    // at an age-chapter boundary: relationships pay off (or bite), a narrative EVENT fires, then you
    // choose a summer FOCUS, take a financial offer, appoint a coach and draft.
    if (BAND_ENDS.includes(this.turn)) { this.advanceSeasonEvent(); this.earnings += 40 + this.turn * 12; this.pendingFocus = rollFocus(this.chapter); }
    else { this.refillHand(); this.scenario = makeScenario(this.rng, this.turn, this.track, this.demandBias, bandAt(this.turn).band, this.exposure); }
    return choice;
  }

  /** NSS life meters react to a played moment (deterministic — reads the choice, consumes no rng). */
  private updateLife(choice: Choice) {
    const s = choice.success, big = choice.stakes >= 2, kind = this.scenario.kind;
    const perf = (s - 0.5) * (big ? 6 : 4); // roughly -3..+3, bigger on big stages
    const answeredAsk = choice.fit >= choice.bestFit - 0.05; // did you do what the moment demanded?
    const rev = (k: MeterKey) => (50 - this.standing[k]) * 0.022; // gentle mean-reversion → meters breathe but don't spiral
    const social = kind === 'social', teamy = choice.tags.includes('teamwork') || choice.tags.includes('leadership');
    // life() only moves meters ACTIVE this chapter, so we can nudge the whole set and the
    // age-appropriate ones respond (a kid's coach/parents/mates; a star's gaffer/fans/sponsors).
    this.life('authority', Math.round(perf * (answeredAsk ? 1.2 : 0.7) + rev('authority'))); // coach → gaffer
    this.life('peers',     Math.round((s - 0.45) * 3 * (teamy ? 1.5 : 1) + rev('peers')));    // mates → dressing room
    this.life('family',    Math.round((social ? perf * 0.9 : perf * 0.3) + rev('family')));   // parents: leaning on them helps
    this.life('school',    Math.round((social ? 1.2 : -1.0) + rev('school')));                // study time vs football-obsessed
    this.life('agent',     Math.round(Math.max(0, perf) * 0.6 + rev('agent')));               // an agent loves a rising asset
    this.life('fans',      Math.round(perf * (kind === 'match' ? 1.1 : 0.6) + rev('fans')));
    this.life('sponsors',  Math.round(Math.max(0, perf) * 0.5 + rev('sponsors') * 0.5));
    if (social) this.life('partner', Math.round(perf * 1.3 + rev('partner')));                // personal life tended in social moments
    this.energy = clamp(this.energy - (choice.stakes >= 3 ? 8 : big ? 6 : 4), 0, 100); // bigger moments drain more — energy is a running resource across the chapter
  }

  /** How the chapter's relationships PAY OFF or BITE (deterministic — reads the end-of-chapter meters,
   *  no rng). Returns narration + mechanical deltas (form → next chapter's success, energy, earnings). */
  private computeConsequences(endedChapter: string): { notes: string[]; form: number; energy: number; earn: number; market: number } {
    const active = new Set(activeMeters(endedChapter).map((m) => m.key));
    const v = this.standing; const notes: string[] = []; let form = 0, energy = 0, earn = 0, market = 0;
    const boss = ['Breakthrough', 'First Team', 'Establishing'].includes(endedChapter) ? 'The gaffer' : 'The coach';
    if (active.has('authority')) {
      if (v.authority < 32) { form -= 0.10; notes.push(`🚫 ${boss} has lost patience — you spend the season in and out of the side.`); }
      else if (v.authority > 70) { form += 0.06; notes.push(`✅ ${boss} trusts you completely — first name on the teamsheet.`); }
    }
    if (active.has('peers')) {
      if (v.peers < 32) { form -= 0.06; notes.push('🧊 The dressing room has turned frosty — you feel alone out there.'); }
      else if (v.peers > 70) { form += 0.04; notes.push('🤝 The lads would run through a wall for you.'); }
    }
    if (active.has('partner')) {
      if (v.partner < 26) { energy -= 18; form -= 0.05; v.partner = Math.max(v.partner, 45); notes.push('💔 Your relationship broke down — a draining few months before a fresh start.'); }
      else if (v.partner > 72) { energy += 12; notes.push('❤️ Settled and happy at home — you play with a clear head.'); }
    }
    if (active.has('family')) {
      if (v.family < 30) notes.push('🏠 Tension at home is weighing on you.');
      else if (v.family > 70) { energy += 8; notes.push('🏠 A rock-solid family behind you.'); }
    }
    if (active.has('school') && v.school < 30) notes.push('🎒 Your grades have collapsed — the academy is worried.');
    if (active.has('agent')) {
      if (v.agent > 70) { market += 1; notes.push('🤝 Your agent is buzzing — serious interest in you.'); }
      else if (v.agent < 30) notes.push('🤝 Your agent has gone quiet on you.');
    }
    if (active.has('fans')) {
      if (v.fans > 72) { earn += 120; notes.push('📣 The terraces worship you — a loyalty bonus lands.'); }
      else if (v.fans < 28) { form -= 0.03; notes.push('📣 The fans are on your back.'); }
    }
    if (active.has('sponsors') && v.sponsors > 68) { earn += 200; market += 1; notes.push('📸 Sponsors are queuing up — the brand pays out.'); }
    return { notes, form, energy, earn, market };
  }

  /** Roll the narrative event for the upcoming age chapter and apply its mechanical effect. */
  private advanceSeasonEvent() {
    const conseq = this.computeConsequences(bandAt(this.turn - 1).band.name); // read the chapter that just ended
    this.chapterConsequences = conseq.notes;
    this.energy = clamp(this.energy + 34 + conseq.energy, 0, 100);  // a summer restores some energy (± how life is going) — but not a full reset, so it stays a resource
    this.earnings += conseq.earn; this.marketBonus += conseq.market;
    this.life('partner', -6); this.life('family', -4); this.life('school', -3); // relationships drift over a summer if untended
    this.demandBias = null;
    const doneIdx = BAND_ENDS.indexOf(this.turn);               // the chapter that just ended
    const window = doneIdx >= 0 ? AGE_BANDS[doneIdx].turns : HAND_SIZE;
    const from = Math.max(0, this.log.length - window);
    const lastAvg = this.log.slice(from).reduce((s, c) => s + c.success, 0) / Math.max(1, this.log.length - from);
    const playedWell = lastAvg >= 0.55;
    let form = 0; // this chapter's event form (consequence form added on top, below — rng order preserved)
    // a rare SERIOUS INJURY: months out (a big dip this chapter) AND lasting fragility (durability↓)
    if (this.rng() < 0.06) { form = -0.2; this.seriousInjuries++; this.seasonEvent = { id: 'serious-injury', name: 'Serious Injury', desc: 'Months on the sidelines — a setback that will linger.' }; }
    else {
      const r = this.rng();
      if (playedWell && r < 0.25) { this.extraPicks += 1; this.seasonEvent = { id: 'breakthrough', name: 'Breakthrough Season', desc: 'A breakout campaign earns you extra coaching time — an extra draft pick.' }; }
      else if (r < 0.40) { const pool = this.track === 'goalkeeper' ? (['keeping', 'composure', 'leadership'] as Tag[]) : OUTFIELD_TAGS; this.demandBias = pool[Math.floor(this.rng() * pool.length)]; this.seasonEvent = { id: 'new-gaffer', name: 'New Manager', desc: `The new gaffer wants more ${this.demandBias} out of you.` }; }
      else if (r < 0.52) { form = 0.12; this.seasonEvent = { id: 'hot-streak', name: 'Purple Patch', desc: "You're in the form of your life — everything comes off." }; }
      else if (r < 0.60) { form = 0.08; this.seasonEvent = { id: 'cup-run', name: 'Cup Run', desc: 'A thrilling cup run has the whole club buzzing — he’s riding the wave.' }; }
      else if (r < 0.72) { form = -0.12; this.seasonEvent = { id: 'slump', name: 'Loss of Form', desc: 'A dip in confidence to battle through.' }; }
      else if (r < 0.80) { form = -0.05; this.seasonEvent = { id: 'transfer-links', name: 'Transfer Speculation', desc: 'His name is in the papers — a distraction he could do without.' }; }
      else if (r < 0.88) { form = -0.06; this.seasonEvent = { id: 'knock', name: 'Niggling Injury', desc: 'A knock to manage — not quite at your sharpest.' }; }
      else if (r < 0.94) { form = 0.06; this.seasonEvent = { id: 'fan-favourite', name: 'Fan Favourite', desc: 'The supporters have taken to him — he feeds off their energy.' }; }
      else { this.seasonEvent = { id: 'steady', name: 'Steady Progress', desc: 'A solid, unremarkable season of graft.' }; }
    }
    this.formBonus = form + conseq.form; // relationships tilt the coming chapter on top of its event
  }

  /** Offer OFFER_SIZE cards from the pool, weighted so epics are rare. */
  private openDraft() {
    const luck = this.agent?.draftLuck ?? 1;   // a good agent gets you better opportunities (rarer cards on offer)
    const weight = (c: Card) => Math.max(1, Math.round(c.rarity === 'epic' ? luck * luck : c.rarity === 'rare' ? 3 * luck : 6));
    // draft only cards you DON'T already own → with a big pool every draft is fresh (real variety, no
    // seeing the same card twice). Fall back to the full pool only if you've somehow drafted it dry.
    const owned = new Set(this.deck.map((c) => c.id));
    const source = this.pool.filter((c) => !owned.has(c.id));
    const draftable = source.length >= OFFER_SIZE ? source : this.pool;
    const bag = draftable.flatMap((c) => Array(weight(c)).fill(c) as Card[]);
    const options: Card[] = [];
    const picked = new Set<string>();
    let guard = 0;
    while (options.length < Math.min(OFFER_SIZE, draftable.length) && guard++ < 400) {
      const c = bag[Math.floor(this.rng() * bag.length)];
      if (!picked.has(c.id)) { picked.add(c.id); options.push(c); }
    }
    this.pendingDraft = { options, picksLeft: Math.min(DRAFT_PICKS + this.extraPicks, options.length) };
    this.extraPicks = 0;
  }

  private startNextChapter() {
    this.refillHand();
    this.scenario = makeScenario(this.rng, this.turn, this.track, this.demandBias, bandAt(this.turn).band, this.exposure);
  }

  private refillHand() { while (this.hand.length < HAND_SIZE) this.hand.push(this.drawOne()); }
  private drawOne(): Card {
    if (this.drawPile.length === 0) { this.drawPile = this.shuffle(this.discard); this.discard = []; }
    return this.drawPile.pop()!;
  }
  private shuffle(cards: Card[]): Card[] {
    const a = [...cards];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
}

// ── derivation: compress a finished career into a Player (PlayerAttrs v2 + role) ──
// SHAPE = tag frequency → which stats grow (peaked). MAGNITUDE = avg success → how high.
// + regression toward baseline + seeded noise so identical styles ≠ identical players.
export interface CareerPlayerAttrs {
  // physical / technical (what the Manager engine reads today)
  pace: number; strength: number; stamina: number;
  passing: number; shooting: number; tackling: number; positioning: number; workrate: number; keeping: number; setPiece: number;
  // mental (NEW — shaped by career play; the engine will read these for diversity)
  composure: number; aggression: number; creativity: number; teamwork: number; leadership: number;
  // injury resistance — robust physique, dented by serious injuries suffered in development
  durability: number;
}
export type Role = 'GK' | 'DF' | 'MF' | 'FW';
export interface CareerPlayer { attrs: CareerPlayerAttrs; role: Role; overall: number; genes: Genes; traits: string[]; personality: string; greed: number; marketability: number; earnings: number }
/** Financial/agent context carried out of a career into graduation (all optional → neutral defaults). */
export interface GraduateCtx { seriousInjuries?: number; agentGreed?: number; agentExposure?: number; greedBonus?: number; marketBonus?: number; earnings?: number; legacyBonus?: Partial<Record<keyof CareerPlayerAttrs, number>> }

// ── PERSONALITY: an innate temperament (nature), seeded at genesis like genes. It shapes HOW a player
// handles their career — steadiness vs volatility, and whether they rise or wilt under pressure — and
// becomes a permanent, human, Manager-engine-readable attribute (a Big-Game Player is calmer in finals,
// a Fragile one is not). Genes = physical nature; personality = mental nature; the stats are nurture.
export interface Personality { id: string; name: string; desc: string; variance: number; bigGame: number; resilience: number; signature?: keyof CareerPlayerAttrs }
export const PERSONALITIES: Personality[] = [
  { id: 'pro',       name: 'Model Professional', desc: 'Metronomic, dependable, no drama',        variance: 0.75, bigGame: 0.02, resilience: 0.6 },
  { id: 'biggame',   name: 'Big-Game Player',    desc: 'Lives for the big occasion',             variance: 1.0,  bigGame: 0.14, resilience: 0.8, signature: 'composure' },
  { id: 'fragile',   name: 'Fragile',            desc: 'Wilts when the heat comes on',           variance: 1.1,  bigGame: -0.12, resilience: 1.35 },
  { id: 'leader',    name: 'Born Leader',        desc: 'Drags everyone up to his level',         variance: 0.9,  bigGame: 0.06, resilience: 0.6, signature: 'leadership' },
  { id: 'workhorse', name: 'Workhorse',          desc: 'Never stops, never hides',               variance: 0.85, bigGame: 0.02, resilience: 0.4, signature: 'stamina' },
  { id: 'mercurial', name: 'Mercurial',          desc: 'Genius one week, anonymous the next',    variance: 1.45, bigGame: 0.05, resilience: 1.1 },
  { id: 'maverick',  name: 'Maverick',           desc: 'Brilliant, infuriating, his own man',    variance: 1.5,  bigGame: 0.08, resilience: 1.1, signature: 'creativity' },
  { id: 'latebloom', name: 'Late Bloomer',       desc: 'Slow to start, but never stops improving', variance: 1.0, bigGame: 0.03, resilience: 0.9, signature: 'stamina' },
  { id: 'showman',   name: 'Showman',            desc: 'Plays for the crowd — thrilling, maddening', variance: 1.35, bigGame: 0.10, resilience: 1.0, signature: 'creativity' },
];
const PERSONALITY_WEIGHTS = [5, 2, 2, 2, 3, 2, 1, 2, 1]; // Model Pro most common; Maverick/Showman rarest
export function rollPersonality(seed: number): Personality {
  const rng = mulberry32(seed ^ 0x9e37b1);
  const bag = PERSONALITIES.flatMap((p, i) => Array(PERSONALITY_WEIGHTS[i]).fill(p) as Personality[]);
  return bag[Math.floor(rng() * bag.length)];
}

// ── HYBRID model: raw physical stats are INNATE (a floor→ceiling band seeded at genesis and
// inherited via lineage); the career only decides how much of that band you REALISE. Technical +
// mental stats are fully career-developed. This makes natural pace/strength scarce (can't be
// grinded → market value) and gives bloodlines a real purpose (you inherit physical potential,
// then earn everything else — so "optimal bloodlines" can't be solved).
export interface Band { floor: number; ceiling: number }
export interface Genes { pace: Band; strength: Band; stamina: Band }
export const INNATE: ReadonlyArray<keyof CareerPlayerAttrs> = ['pace', 'strength', 'stamina'];

/** Genesis genes: each innate stat gets a random floor and a ceiling above it. Some players are
 *  naturally quick/strong (high band), others never will be (low band) no matter how they train. */
export function rollGenes(seed: number): Genes {
  const rng = mulberry32(seed ^ 0x6e6ee5);
  const band = (): Band => {
    const floor = Math.round(2 + rng() * 10);                                  // 2..12
    const ceiling = clamp(Math.round(floor + 4 + rng() * 10), floor + 3, 20);  // floor+3 .. 20
    return { floor, ceiling };
  };
  return { pace: band(), strength: band(), stamina: band() };
}

/** Child genes for lineage: inherited bands biased toward the parent's, regressed toward the
 *  population mean and re-rolled with variance — inheritance is a BIAS ON A RANDOM ROLL, never a
 *  deterministic copy, so bloodlines stay diverse and un-solvable. keepPct = how strongly the
 *  parent shows through (~0.5–0.7). */
export function inheritGenes(parent: Genes, seed: number, keepPct = 0.6, ceilingLift = 0): Genes {
  const rng = mulberry32(seed ^ 0x50f);
  const MEAN_FLOOR = 7, MEAN_CEIL = 13;
  const inheritBand = (b: Band): Band => {
    const floor = clamp(Math.round(b.floor * keepPct + MEAN_FLOOR * (1 - keepPct) + (rng() - 0.5) * 4), 1, 15);
    // a decorated, durable bloodline lifts the son's physical CEILING (better potential — earned, bounded)
    const ceiling = clamp(Math.round(b.ceiling * keepPct + MEAN_CEIL * (1 - keepPct) + (rng() - 0.5) * 4 + ceilingLift), floor + 3, 20);
    return { floor, ceiling };
  };
  return { pace: inheritBand(parent.pace), strength: inheritBand(parent.strength), stamina: inheritBand(parent.stamina) };
}

// ── ACHIEVEMENT LEGACY: a player's on-pitch career follows the NFT into the next generation. A father
// who won things and lasted at the top breeds a son with a head-start — but from TEAM achievements only
// (trophies, promotions, the level he competed at, longevity), NEVER personal tallies like goals/assists
// which would unfairly favour attackers. So a decorated centre-back or keeper passes on exactly as much
// pedigree as a decorated striker. The boosts are position-neutral (a winner's mentality + physical
// pedigree) and bounded — an earned edge, not pay-to-win.
export interface PlayerAchievements {
  seasons: number;         // seasons played (longevity)
  apps: number;            // appearances
  leagueTitles: number;    // league championships won with the squad
  cupTitles: number;       // cups won with the squad
  promotions: number;      // times the club climbed a division while he was in it
  highestTierIdx: number;  // the highest division he competed in (0 Sunday … 9 World Class)
}
export interface LegacyBoost {
  ceilingLift: number;                                  // +0..3 to the son's inherited physical ceilings
  devBonus: Partial<Record<keyof CareerPlayerAttrs, number>>; // small post-development nudges (mentality)
  pedigree: number;                                     // 0..1 summary (fame of the bloodline; UI/market)
  note: string;
}
/** Turn a player's TEAM achievements into the (bounded, position-neutral) pedigree his son is born with. */
export function legacyBoost(a: PlayerAchievements): LegacyBoost {
  const tierMult = 1 + a.highestTierIdx * 0.4;                       // winning higher up is worth more
  const trophyPts = (a.leagueTitles + a.cupTitles * 0.7 + a.promotions * 0.4) * tierMult;
  const winner = clamp(trophyPts / 12, 0, 1);                        // 0..1 how decorated the father was
  const longevity = clamp((a.seasons + a.apps * 0.05) / 16, 0, 1);   // 0..1 durability of the career
  const ceilingLift = clamp(Math.round(longevity * 2 + winner), 0, 3); // athletic + winning bloodline
  const devBonus: Partial<Record<keyof CareerPlayerAttrs, number>> = {
    leadership: Math.round(winner * 2),                              // winners breed a winning mentality…
    composure: Math.round(winner * 1.5),                            // …calm on the big stage (position-neutral)
  };
  const pedigree = clamp(0.6 * winner + 0.4 * longevity, 0, 1);
  const note = winner > 0.66 ? 'elite pedigree — a dynasty bloodline' : winner > 0.33 ? 'proven pedigree' : longevity > 0.5 ? 'a long, dependable career' : 'a modest playing record';
  return { ceilingLift, devBonus, pedigree, note };
}

// each stat's source tags (≥1 each); keeping has none (GK is a future dedicated path)
const STAT_SOURCES: Record<Exclude<keyof CareerPlayerAttrs, 'durability'>, Tag[]> = { // durability is computed from physique below, not from tags
  pace: ['stamina', 'flair'], strength: ['aggression', 'stamina'], stamina: ['stamina'],
  passing: ['creativity', 'teamwork'], shooting: ['flair', 'composure'], tackling: ['aggression'],
  positioning: ['teamwork', 'composure'], workrate: ['stamina', 'teamwork'], keeping: ['keeping'], setPiece: ['composure', 'creativity'],
  composure: ['composure'], aggression: ['aggression'], creativity: ['creativity'], teamwork: ['teamwork'], leadership: ['leadership'],
};
const BASELINE = 7, SPREAD = 12, PEAK = 1.5;

export function deriveStats(log: Choice[], seed: number, genes: Genes = rollGenes(seed)): CareerPlayerAttrs {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const innate = new Set<keyof CareerPlayerAttrs>(INNATE);
  const freq = Object.fromEntries(TAGS.map((t) => [t, 0])) as Record<Tag, number>;
  // weight by card power AND stakes: a great play in a cup final shapes you more than a training drill
  for (const c of log) for (const t of c.tags) freq[t] += c.power * c.stakes;
  const maxFreq = Math.max(1, ...TAGS.map((t) => freq[t]));
  const norm = Object.fromEntries(TAGS.map((t) => [t, freq[t] / maxFreq])) as Record<Tag, number>;
  // MAGNITUDE = how well you actually played (avg success across the career). With a capped flywheel
  // this spreads by skill: a player who plays high-fit cards banks more success → higher stats.
  const avgSuccess = log.reduce((s, c) => s + c.success, 0) / Math.max(1, log.length);
  const magnitude = 0.5 + 0.7 * avgSuccess; // ~0.5x (played poorly) .. ~1.2x (played superbly)

  const out = {} as CareerPlayerAttrs;
  for (const stat of Object.keys(STAT_SOURCES) as (keyof typeof STAT_SOURCES)[]) {
    const src = STAT_SOURCES[stat];
    const shape = src.length ? src.reduce((s, t) => s + norm[t], 0) / src.length : 0;
    const peaked = Math.pow(shape, PEAK);
    const noise = (rng() - 0.5) * 3;
    if (innate.has(stat)) {
      // INNATE: the career only decides how far up your genetic band [floor, ceiling] you realise.
      const band = genes[stat as 'pace' | 'strength' | 'stamina'];
      const realised = clamp(peaked * magnitude, 0, 1); // 0 = never trained it, 1 = maxed your potential
      out[stat] = clamp(Math.round(band.floor + realised * (band.ceiling - band.floor) + noise * 0.4), 1, 20);
    } else {
      // DEVELOPED: technical/mental grow freely with play.
      out[stat] = clamp(Math.round((BASELINE + peaked * SPREAD) * magnitude + noise), 1, 20);
    }
  }
  out.durability = clamp(Math.round(5 + 0.3 * out.strength + 0.3 * out.stamina + (rng() - 0.5) * 3), 1, 20); // ~11-12 for a healthy career; injury penalty applied at graduate
  return out;
}

// Per-role baselines subtract the "easy" stats so roles come out ~balanced (attacking stats are
// generally higher, which used to over-produce FW/MF and starve DF). A career is the role it's
// most ABOVE its own baseline in. GK is decided first: a real keeping stat means a goalkeeper.
const ROLE_CORE: Record<Role, (keyof CareerPlayerAttrs)[]> = {
  GK: ['keeping', 'positioning', 'composure'],
  DF: ['tackling', 'strength', 'aggression', 'positioning'],
  MF: ['passing', 'creativity', 'teamwork', 'stamina'],
  FW: ['shooting', 'pace', 'composure', 'creativity'],
};
// baselines = the population mean core-avg per role (measured), so a career is whichever role it's
// most ABOVE its own typical in → DF/MF/FW come out ~balanced instead of attacking stats winning.
const ROLE_BASELINE: Record<Role, number> = { GK: 8, DF: 11.77, MF: 12.56, FW: 12.86 };

/** Derive the role: a goalkeeper if `keeping` is genuinely developed, else the outfield role the
 *  player is most above-baseline in (baselines calibrated so DF/MF/FW come out roughly balanced). */
export function deriveRole(a: CareerPlayerAttrs): Role {
  if (a.keeping >= 12) return 'GK'; // only the GK track develops keeping this high
  const score = (r: Role) => ROLE_CORE[r].reduce((s, k) => s + a[k], 0) / ROLE_CORE[r].length - ROLE_BASELINE[r];
  return (['DF', 'MF', 'FW'] as Role[]).reduce((best, r) => (score(r) > score(best) ? r : best), 'DF');
}

/** Role-weighted overall (each role values the stats that matter to it). */
export function careerOverall(a: CareerPlayerAttrs, role: Role): number {
  const core: Record<Role, (keyof CareerPlayerAttrs)[]> = {
    GK: ['keeping', 'positioning', 'composure'],
    DF: ['tackling', 'strength', 'positioning', 'aggression', 'composure'],
    MF: ['passing', 'creativity', 'teamwork', 'stamina', 'composure'],
    FW: ['shooting', 'pace', 'composure', 'creativity'],
  };
  const keys = core[role];
  return Math.round(keys.reduce((s, k) => s + a[k], 0) / keys.length);
}

// ── TRAITS: earned identity perks that differentiate players beyond raw stats and give the Manager
// engine hooks to read later ("Big-Game Player" → composure in finals, etc.). A career becomes
// ELIGIBLE for a trait by how it developed; the player locks in up to MAX_TRAITS (the client lets a
// human choose; the sim auto-picks). Some traits also nudge a stat.
export const MAX_TRAITS = 2;
export interface Trait { id: string; name: string; desc: string; eligible: (a: CareerPlayerAttrs, log: Choice[]) => boolean; apply?: (a: CareerPlayerAttrs) => void }
export const TRAITS: Trait[] = [
  { id: 'clinical',  name: 'Clinical Finisher',    desc: 'Ice-cold in front of goal',        eligible: (a) => a.shooting >= 15 && a.composure >= 14, apply: (a) => { a.shooting = clamp(a.shooting + 1, 1, 20); } },
  { id: 'ballwinner', name: 'Ball-Winner',         desc: 'Wins it back relentlessly',        eligible: (a) => a.tackling >= 15 && a.aggression >= 13, apply: (a) => { a.tackling = clamp(a.tackling + 1, 1, 20); } },
  { id: 'metronome', name: 'Metronome',            desc: 'Never misplaces a pass',           eligible: (a) => a.passing >= 15 && a.teamwork >= 13 },
  { id: 'maestro',   name: 'Creative Maestro',     desc: 'Unlocks the tightest defences',    eligible: (a) => a.creativity >= 16 },
  { id: 'leader',    name: 'Born Leader',          desc: 'Lifts the whole team',             eligible: (a) => a.leadership >= 15 },
  { id: 'livewire',  name: 'Livewire',             desc: 'Blistering, frightening pace',     eligible: (a) => a.pace >= 16 },
  { id: 'ironman',   name: 'Iron Man',             desc: 'Runs all day, every day',          eligible: (a) => a.stamina >= 15 && a.strength >= 13 },
  { id: 'deadball',  name: 'Dead-Ball Specialist', desc: 'Lethal from set pieces',           eligible: (a) => a.setPiece >= 15, apply: (a) => { a.setPiece = clamp(a.setPiece + 1, 1, 20); } },
  { id: 'wall',      name: 'The Wall',             desc: 'Unbeatable between the sticks',     eligible: (a) => a.keeping >= 16 },
  { id: 'biggame',   name: 'Big-Game Player',      desc: 'Turns up when it matters most',    eligible: (_a, log) => log.filter((c) => c.stakes >= 2 && c.success >= 0.75).length >= 5 },
  { id: 'engine',    name: 'Box-to-Box Engine',    desc: 'Covers every blade of grass',      eligible: (a) => a.stamina >= 14 && a.teamwork >= 14, apply: (a) => { a.stamina = clamp(a.stamina + 1, 1, 20); } },
  { id: 'rock',      name: 'Defensive Rock',       desc: 'Immovable at the back',            eligible: (a) => a.tackling >= 14 && a.strength >= 14, apply: (a) => { a.strength = clamp(a.strength + 1, 1, 20); } },
  { id: 'spark',     name: 'The Spark',            desc: 'Makes something from nothing',     eligible: (a) => a.creativity >= 14 && a.pace >= 14 },
];

/** Which traits a finished career qualifies for (before the player locks any in). */
export function eligibleTraits(attrs: CareerPlayerAttrs, log: Choice[]): Trait[] {
  return TRAITS.filter((t) => t.eligible(attrs, log));
}

/** Finish a career log into a complete Player (attrs + role + overall + traits). Genes default to a
 *  fresh genesis roll; pass inherited genes (lineage). `pickTraits` chooses among the eligible traits
 *  (the client lets a human pick; defaults to the first MAX_TRAITS for the sim). */
export function graduate(log: Choice[], seed: number, genes: Genes = rollGenes(seed), pickTraits?: (eligible: Trait[]) => Trait[], ctx: GraduateCtx = {}): CareerPlayer {
  const { seriousInjuries = 0, agentGreed = 0, agentExposure = 1, greedBonus = 0, marketBonus = 0, earnings = 0, legacyBonus } = ctx;
  const attrs = deriveStats(log, seed, genes);
  const personality = rollPersonality(seed);                          // same temperament the career developed under
  if (personality.signature) attrs[personality.signature] = clamp(attrs[personality.signature] + 1, 1, 20);
  // inherited pedigree from a decorated father (team achievements) — a bounded, position-neutral head-start
  if (legacyBonus) for (const k of Object.keys(legacyBonus) as (keyof CareerPlayerAttrs)[]) attrs[k] = clamp(attrs[k] + (legacyBonus[k] ?? 0), 1, 20);
  // serious injuries in development leave a lasting fragility (injury-proneness the Manager game reads)
  attrs.durability = clamp(attrs.durability - Math.round(seriousInjuries * 2.5), 1, 20);
  // GREED (financial temperament): what it'll cost a manager to keep this player. Set by the AGENT he
  // signed with, his nature, and the money he chased in-career. High → mercenary; low → a loyal one-club man.
  const gRng = mulberry32(seed ^ 0x9e3779b9);
  const greed = clamp(Math.round(9 + agentGreed + greedBonus + (PERSONALITY_GREED[personality.id] ?? 0) + (gRng() - 0.5) * 4), 1, 20);
  // MARKETABILITY (brand/fame): star turns on the big stage, a flashy temperament, agent exposure and
  // brand deals build it. The Manager game turns it into COMMERCIAL income — so a fan-favourite helps
  // pay his own wages, giving greed a genuine upside instead of being a pure tax.
  const starTurns = log.filter((c) => c.stakes >= 2 && c.success >= 0.7).length;
  const flair = personality.id === 'maverick' || personality.id === 'mercurial' ? 3 : personality.id === 'biggame' ? 2 : 0;
  const marketability = clamp(Math.round(5 + starTurns * 0.6 + flair + (agentExposure - 1) * 8 + marketBonus + (gRng() - 0.5) * 2), 1, 20);
  const eligible = eligibleTraits(attrs, log);
  const chosen = (pickTraits ? pickTraits(eligible) : eligible.slice(0, MAX_TRAITS)).slice(0, MAX_TRAITS);
  for (const t of chosen) t.apply?.(attrs); // trait bonuses apply before role/overall
  const flaws = attrs.durability <= 6 ? ['injury_prone'] : []; // a flaw flag, separate from earned perks
  if (greed >= 15) flaws.push('mercenary');                    // financially greedy — costs a fortune to extend
  else if (greed <= 5) flaws.push('loyal');                    // a bargain to keep — a one-club man
  if (marketability >= 15) flaws.push('marketable');           // a brand — boosts commercial income for his club
  const role = deriveRole(attrs);
  return { attrs, role, overall: careerOverall(attrs, role), genes, traits: [...chosen.map((t) => t.id), ...flaws], personality: personality.id, greed, marketability, earnings };
}

// ── AGE CURVE (playing phase, age 25 → 40) ──
// The minted Player NFT's stats are the PRIME (age 25, graduation). The Manager game applies this
// read-time curve so ability truly ARCS — RISE → PEAK → DECLINE — over the 15 pro seasons. The prime
// isn't the top: PHYSICAL (pace/strength/stamina/workrate) peaks ~25 and then falls STEADILY (a
// pace-merchant fades hard by his 30s), CRAFT (technique) matures a touch then plateaus, and WISDOM
// (composure/leadership/positioning/keeping) keeps rising into the 30s. Net effect: athletic players
// peak early and depreciate; cerebral players peak ~29-31 and age gracefully — so WHEN you sell, hold,
// or retire a player actually matters (and young prospects appreciate). Immutable base + this curve.
const PHYSICAL: (keyof CareerPlayerAttrs)[] = ['pace', 'strength', 'stamina', 'workrate'];
const WISDOM: (keyof CareerPlayerAttrs)[] = ['composure', 'leadership', 'positioning', 'keeping'];
const CRAFT: (keyof CareerPlayerAttrs)[] = ['passing', 'shooting', 'tackling', 'creativity', 'setPiece', 'teamwork'];
export function ageCurve(prime: CareerPlayerAttrs, age: number): CareerPlayerAttrs {
  const phys = age <= 26 ? 1 : clamp(1 - (age - 26) * 0.042, 0.4, 1);  // peaks ~25-26, then −4.2%/yr (floor .40)
  const wis = clamp(1 + (age - 25) * 0.02, 1, 1.16);                   // experience rises +2%/yr into the 30s (cap +16%)
  const craft = clamp(1 + (age - 25) * 0.01, 1, 1.05);                 // technique matures then plateaus (cap +5%)
  const out = { ...prime };
  for (const k of PHYSICAL) out[k] = clamp(Math.round(prime[k] * phys), 1, 20);
  for (const k of WISDOM) out[k] = clamp(Math.round(prime[k] * wis), 1, 20);
  for (const k of CRAFT) out[k] = clamp(Math.round(prime[k] * craft), 1, 20);
  return out;
}

// ── PROSPECT VALUATION (the market for in-development players) ──
// A half-developed prospect is priced on: current ability, how much upside remains (age → turns left),
// and its physical gene ceiling (the scarce, un-grindable part). Deterministic + verifiable.
export interface ProspectValue { age: number; chapter: string; role: Role; currentOverall: number; potential: number; physicalCeiling: number; stars: number }
export function prospectValuation(c: Career, genes: Genes): ProspectValue {
  const partial = deriveStats(c.log, c.seed, genes);           // stats so far (deterministic)
  const role = deriveRole(partial);
  const current = careerOverall(partial, role);
  const remaining = Math.max(0, 1 - c.turn / TOTAL_TURNS);     // fraction of the career still to develop
  const geneCeil = (genes.pace.ceiling + genes.strength.ceiling + genes.stamina.ceiling) / 3;
  // a rough prime-overall ceiling: physical bounded by genes, technique/mental by a well-played nominal ~17
  const ceiling = clamp(Math.round(0.45 * geneCeil + 0.55 * 17), current, 20);
  const potential = Math.round(current + remaining * (ceiling - current)); // projected prime if developed well
  const stars = clamp(Math.round((potential + remaining * 3) / 4.2 * (c.agent?.valueMod ?? 1)), 1, 5); // a good agent markets the prospect (higher perceived value)
  return { age: c.age, chapter: c.chapter, role, currentOverall: current, potential, physicalCeiling: Math.round(geneCeil), stars };
}

// ── balance helper: auto-play a career under a "style" policy (picks the best hand card) ──
export interface Style { name: string; pref: Partial<Record<Tag, number>>; skill: number }
export function simCareer(seed: number, style: Style, genes: Genes = rollGenes(seed), track: Track = 'outfield', agentId?: string): CareerPlayer {
  const career = new Career(seed, track, agentId);
  const rng = mulberry32(seed ^ 0x1234567);
  const prefScore = (c: Card) => c.tags.reduce((s, t) => s + (style.pref[t] ?? 0), 0);
  while (!career.finished) {
    const st = career.current();
    if (st.phase === 'focus') {
      // summer focus: shore up the neediest active relationship (lowest meter), else rest.
      const lowest = [...career.meters].sort((a, b) => a.value - b.value)[0];
      const pick = st.focus.find((f) => lowest && f.effects[lowest.key as MeterKey] != null && f.effects[lowest.key as MeterKey]! > 0) ?? st.focus[st.focus.length - 1];
      career.chooseFocus(pick.id);
      continue;
    }
    if (st.phase === 'offer') {
      // financial path: ambitious/mercenary careers chase the money; grounded ones stay & develop.
      const wantsMoney = (career.agent?.greed ?? 0) + (PERSONALITY_GREED[career.personality.id] ?? 0) + (rng() - 0.5) * 4;
      const pick = wantsMoney > 1 ? (rng() < 0.5 ? 'money' : 'brand') : wantsMoney < -1 ? 'develop' : (rng() < 0.5 ? 'brand' : 'develop');
      career.resolveOffer(pick);
      continue;
    }
    if (st.phase === 'coach') {
      // appoint the coach whose specialty best matches your identity (amplify your strengths).
      let best = st.coaches[0], bs = -Infinity;
      for (const c of st.coaches) { const score = c.specialty.reduce((s, t) => s + (style.pref[t] ?? 0), 0) + rng() * 0.05; if (score > bs) { bs = score; best = c; } }
      career.appointCoach(best.id);
      continue;
    }
    if (st.phase === 'draft') {
      // DRAFT: take the offered card that best advances your identity (pref × power).
      let best = st.options[0], bestScore = -Infinity;
      for (const c of st.options) { const score = prefScore(c) * cardPower(c) + rng() * 0.05; if (score > bestScore) { bestScore = score; best = c; } }
      career.draft(best.id);
      continue;
    }
    // PLAY: style drives choice (shape); skill sharpens how much you also weigh fit (magnitude).
    let best = st.hand[0], bestScore = -Infinity;
    for (const c of st.hand) {
      const score = prefScore(c) * 2 + style.skill * 3 * fit(c, st.scenario) + rng() * 0.05;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    career.play(best.id);
  }
  return graduate(career.log, seed, genes, undefined, career.finContext());
}
