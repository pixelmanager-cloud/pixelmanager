// Career Sim — Layer 1. A turn-by-turn card game that DEVELOPS a player into a Player NFT.
// Each turn you're dealt a HAND from your deck and face a seeded SCENARIO demanding certain
// playing-style tags; you play one card. How your choices PATTERN out over a career becomes the
// player's stat SHAPE (playstyle); how WELL you played becomes the MAGNITUDE. Fully deterministic
// (seeded, no Date.now/Math.random) so a career is a pure function of (seed, choices) — replayable
// and verifiable on-chain later. See docs/two-layer-architecture.md.
import { arcByIdOf, pickArcStart, type ArcEffect } from './storyarc.js';

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
export interface Action { type: 'play' | 'draft' | 'coach' | 'offer' | 'focus' | 'lifestyle' | 'arc'; cardId: string }
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
  { id: 'maestro', name: 'Midfield Maestro',      tags: ['creativity', 'composure'], rarity: 'epic' },
  { id: 'destroyer',   name: 'The Destroyer',         tags: ['aggression', 'stamina'], rarity: 'epic' },
  { id: 'fox-box',     name: 'Fox in the Box',        tags: ['composure', 'flair'], rarity: 'rare' },
  { id: 'set-piece',   name: 'Set-Piece Specialist',  tags: ['creativity', 'composure'], rarity: 'rare' },
  { id: 'target-man',  name: 'Target Man',            tags: ['teamwork', 'aggression'], rarity: 'rare' },
  { id: 'winger-wiz',  name: "Winger's Magic",        tags: ['flair', 'stamina'], rarity: 'epic' },
  { id: 'libero',      name: 'Ball-Playing Libero',   tags: ['composure', 'creativity'], rarity: 'rare' },
  { id: 'box-crash',   name: 'Crash the Box',         tags: ['stamina', 'aggression'] },
  // ── HUGE VARIETY EXPANSION #2: many more moments per tag, so a 200-turn career keeps feeling fresh ──
  // composure
  { id: 'nerves-steel',   name: 'Nerves of Steel',            tags: ['composure'] },
  { id: 'big-moment',     name: 'Big Moment Man',             tags: ['composure', 'leadership'], rarity: 'rare' },
  { id: 'no-panic',       name: 'No Panic',                   tags: ['composure'] },
  { id: 'ice-cold-spot',  name: 'Ice-Cold from the Spot',     tags: ['composure'], rarity: 'rare' },
  { id: 'composed-touch', name: 'A Composed First Touch',     tags: ['composure', 'creativity'] },
  // flair
  { id: 'flick-on',       name: 'Flick-On',                   tags: ['flair', 'teamwork'] },
  { id: 'audacious',      name: 'Audacious Backheel',         tags: ['flair'] },
  { id: 'samba',          name: 'Samba Skill',                tags: ['flair', 'creativity'], rarity: 'rare' },
  { id: 'bicycle',        name: 'Bicycle Kick',               tags: ['flair'], rarity: 'epic' },
  { id: 'cruyff',         name: 'Cruyff Turn',                tags: ['flair', 'creativity'], rarity: 'rare' },
  { id: 'sombrero',       name: 'Sombrero Flick',             tags: ['flair'] },
  // aggression
  { id: 'bruiser',        name: 'Bruising Challenge',         tags: ['aggression'] },
  { id: 'no-nonsense',    name: 'No-Nonsense Clearance',      tags: ['aggression', 'teamwork'] },
  { id: 'body-check',     name: 'Shoulder to Shoulder',       tags: ['aggression'] },
  { id: 'hunt-pack',      name: 'Hunt in a Pack',             tags: ['aggression', 'teamwork'] },
  { id: 'red-mist',       name: 'Red Mist Moment',            tags: ['aggression'], rarity: 'rare' },
  // creativity
  { id: 'through-eye',    name: 'Through the Eye of a Needle', tags: ['creativity'], rarity: 'rare' },
  { id: 'disguised-pass', name: 'The Disguised Pass',         tags: ['creativity'] },
  { id: 'weighted-pass',  name: 'Perfectly Weighted Pass',    tags: ['creativity', 'composure'] },
  { id: 'outside-boot',   name: 'Outside of the Boot',        tags: ['creativity', 'flair'] },
  { id: 'spatial-iq',     name: 'Spatial Awareness',          tags: ['creativity', 'teamwork'] },
  // teamwork
  { id: 'bricklayer',     name: 'Bricklayer',                 tags: ['teamwork'] },
  { id: 'team-ethic',     name: 'Team Ethic',                 tags: ['teamwork'] },
  { id: 'tracking-back',  name: 'Tracking Back',              tags: ['teamwork', 'stamina'] },
  { id: 'plug-gap',       name: 'Plug the Gap',               tags: ['teamwork'] },
  // leadership
  { id: 'captain-arm',    name: 'Lead by Example',            tags: ['leadership'] },
  { id: 'dressing-voice', name: 'Dressing Room Voice',        tags: ['leadership', 'teamwork'] },
  { id: 'calm-fire',      name: 'Calm Under Fire',            tags: ['leadership', 'composure'] },
  { id: 'gaffer-word',    name: 'A Word from the Gaffer',     tags: ['leadership'], rarity: 'rare' },
  { id: 'never-say-die',  name: 'Never-Say-Die Spirit',       tags: ['leadership', 'stamina'] },
  // stamina
  { id: 'marathon-man',   name: 'Marathon Man',               tags: ['stamina'] },
  { id: 'extra-yard',     name: 'Find the Extra Yard',        tags: ['stamina'] },
  { id: 'gas-tank',       name: 'Full Tank',                  tags: ['stamina'] },
  { id: 'relentless',     name: 'Relentless Pressing',        tags: ['stamina', 'aggression'] },
  { id: 'legs-of-steel',  name: 'Legs of Steel',              tags: ['stamina'], rarity: 'rare' },
  // rare / epic signatures
  { id: 'matchwinner',    name: 'Matchwinner',                tags: ['flair', 'composure'], rarity: 'epic' },
  { id: 'wonderkid',      name: 'Wonderkid Moment',           tags: ['creativity', 'flair'], rarity: 'epic' },
];

// The small deck EVERY outfield career starts with; the rest is drafted between seasons.
const STARTER_IDS = ['ice-veins', 'crunch', 'splitter', 'anchor', 'lung-buster', 'stepover', 'hold-up'];
export const STARTER_DECK: Card[] = DECK.filter((c) => STARTER_IDS.includes(c.id));
export const DRAFT_POOL: Card[] = DECK.filter((c) => !STARTER_IDS.includes(c.id));

// DECK CHEMISTRY — REMOVED 2026-09-01, on CK's call. Eight named tag-pair synergies gave a small
// permanent lean toward their two tags when a deck collected enough cards carrying both.
//
// Removed rather than tuned because THREE OF THE EIGHT MADE THE PLAYER WORSE. Measured at n=150 careers
// each, applied exactly as the game applied it: engine-room -0.173 overall, playmaker -0.053, flanker
// -0.027. The game congratulated a player for building Engine-Room Chemistry and then punished him for
// it. And the BEST of the eight was +0.207 against 1.25 of seed noise, so not one was perceptible across
// careers either.
//
// Tuning was rejected on its own terms: the signs are inconsistent, so raising the reward makes the three
// negative ones MORE negative. Each would have to be re-tagged first, which is design work, not tuning.
//
// The argument for keeping it was that it was the best candidate for giving the card draft a real
// decision -- and that argument died with the re-measurement of that claim, which DOES NOT REPRODUCE:
// reading the moment is worth +4.8 overall against 1.25 of noise, roughly 4:1 in favour of skill. The
// draft already has decisions. Chemistry was not the fix for a problem that turned out not to exist.

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
  // ── GK variety expansion #2 ──
  { id: 'read-forward',    name: "Read the Forward's Mind", tags: ['keeping', 'composure'] },
  { id: 'quick-reflex',    name: 'Lightning Reflexes',      tags: ['keeping'] },
  { id: 'commanding-punch', name: 'Commanding Punch',       tags: ['keeping', 'aggression'] },
  { id: 'sweeper-dash',    name: 'Sweeper Dash',            tags: ['keeping', 'stamina'] },
  { id: 'long-throw',      name: 'Raking Long Throw',       tags: ['keeping', 'creativity'] },
  { id: 'penalty-read',    name: 'Read the Penalty',        tags: ['keeping', 'composure'], rarity: 'rare' },
  { id: 'shotstop-clinic', name: 'Shot-Stopping Clinic',    tags: ['keeping'], rarity: 'rare' },
  { id: 'last-line',       name: 'Last Line of Defence',    tags: ['keeping', 'leadership'] },
  { id: 'brave-block',     name: 'Brave Block at Feet',     tags: ['keeping', 'aggression'] },
  { id: 'calm-high-ball',  name: 'Calm Under the High Ball', tags: ['keeping', 'composure'] },
  { id: 'acrobatic',       name: 'Acrobatic Save',          tags: ['keeping', 'flair'], rarity: 'epic' },
  { id: 'leader-box',      name: 'Leader of the Box',       tags: ['keeping', 'leadership'], rarity: 'rare' },
];
const GK_STARTER_IDS = ['shot-stop', 'claim-cross', 'organise', 'calm-back'];
const GK_STARTER: Card[] = GK_DECK.filter((c) => GK_STARTER_IDS.includes(c.id));
const GK_DRAFT_POOL: Card[] = GK_DECK.filter((c) => !GK_STARTER_IDS.includes(c.id));
/** A card's display name by id (across both decks) — for narration/UI. */
export const cardName = (id: string): string => [...DECK, ...GK_DECK].find((c) => c.id === id)?.name ?? id;
/** A card's tags by id (across both decks) — lets off-pitch life events reframe a football card by what
 *  quality it draws on, instead of showing its on-pitch move name where it makes no sense (PT-43). */
export const cardTags = (id: string): string[] => [...DECK, ...GK_DECK].find((c) => c.id === id)?.tags ?? [];

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
  // expansion descriptions #2 — outfield
  'nerves-steel': 'Not a flicker of doubt — pure nerves of steel.', 'big-moment': 'Stand tall and drag the team through the biggest moment of the season.',
  'no-panic': 'Everyone around you is losing it — you stay dead calm.', 'ice-cold-spot': 'Walk up, no fuss, and bury it from the spot.',
  'composed-touch': 'Kill it stone dead with a composed first touch, then look up.', 'flick-on': 'A deft flick-on into the path of a teammate.',
  audacious: 'Try the outrageous backheel — and pull it off.', samba: 'A flash of samba skill that has the crowd on its feet.',
  bicycle: 'Launch into an overhead bicycle kick — the stuff of highlight reels.', cruyff: 'Drag it behind your standing leg and spin the defender inside out.',
  sombrero: 'Flick it up and over his head with a sombrero — pure disrespect.', bruiser: 'Go through the ball, not around it — a bruising challenge.',
  'no-nonsense': 'No fuss, no frills — just clear your lines.', 'body-check': 'Use your frame, shoulder to shoulder, to knock him off it.',
  'hunt-pack': 'Close him down together, in a pack, and leave him nowhere to go.', 'red-mist': "Let the red mist come down for one reckless moment.",
  'through-eye': 'Thread it through a gap that shouldn’t exist.', 'disguised-pass': 'Sell the dummy with your eyes, then play it the other way.',
  'weighted-pass': 'Weight it perfectly onto a teammate’s stride.', 'outside-boot': 'Curl it round with the outside of the boot.',
  'spatial-iq': 'See the picture forming before anyone else does.', bricklayer: 'Do the unglamorous work, brick by brick, that nobody notices.',
  'team-ethic': 'Put the team above yourself, every single time.', 'tracking-back': 'Sprint the length of the pitch to track your man back.',
  'plug-gap': 'Spot the hole in the shape and fill it before it’s exploited.', 'captain-arm': 'Lead by example — first to every fifty-fifty.',
  'dressing-voice': 'Be the voice that cuts through the noise in the dressing room.', 'calm-fire': 'Stay composed while everything round you is chaos.',
  'gaffer-word': 'A quiet word from the gaffer lands, and you deliver.', 'never-say-die': 'Refuse to accept it’s over, right to the final whistle.',
  'marathon-man': 'Still sprinting in the 90th minute like it’s the first.', 'extra-yard': 'Find one more yard when your legs say no.',
  'gas-tank': 'A full tank when everyone else is running on empty.', relentless: 'Press and press and press — give them no time on the ball.',
  'legs-of-steel': 'Legs that simply refuse to tire, minute after minute.', matchwinner: 'One moment, out of nothing, that wins the whole game.',
  wonderkid: 'A touch of pure class that reminds everyone why they rated you.',
  // expansion descriptions #2 — goalkeeper
  'read-forward': 'Read the striker’s intentions a split-second before he acts.', 'quick-reflex': 'React on pure instinct before your brain catches up.',
  'commanding-punch': 'Come and punch it clear with real authority.', 'sweeper-dash': 'Race off your line to sweep up behind a high defence.',
  'long-throw': 'Launch a raking throw to spark a counter in seconds.', 'penalty-read': 'Guess the corner and get there — read the penalty.',
  'shotstop-clinic': 'A clinic in shot-stopping, save after save.', 'last-line': 'Be the very last line — nothing gets past you today.',
  'brave-block': 'Stand your ground and block it at his feet, brave as they come.', 'calm-high-ball': 'Rise above the chaos and claim the high ball with total calm.',
  acrobatic: 'Contort yourself into an acrobatic save that defies gravity.', 'leader-box': 'Own your box and organise everyone in front of you.',
};

// deck-building config
export const OFFER_SIZE = 5;   // cards shown at a between-season draft (a wider choice from the big pool)
export const DRAFT_PICKS = 3;  // how many you add each draft → a deck that grows to ~25 over the 7 chapters

// ── LIFESTYLE: the money you earn is meant to be SPENT. Between chapters you can buy one-off lifestyle
// upgrades with your career earnings — each a permanent perk (a meter boost, better energy recovery, or
// marketability/fame that carries into the pro). It's the flip side of banking your earnings for a higher
// valuation: spend now for a better career, or hoard for a richer graduate. Deterministic (no rng).
// chapter index reference: 0 Grassroots · 1 Academy · 2 Scholar · 3 Youth Team · 4 Breakthrough · 5 First Team · 6 Establishing
export interface LifestyleItem { id: string; icon: string; name: string; blurb: string; cost: number; minChapterIdx: number; maxChapterIdx?: number; recovery?: number; market?: number; greed?: number; perks?: Partial<Record<MeterKey, number>>; clubInvest?: number;
  /** METER-GATED: only on offer once ALL these standings are met — a high-standing OPPORTUNITY. */
  minMeter?: Partial<Record<MeterKey, number>>;
  /** METER-GATED: only on offer while ALL these standings are BELOW threshold — a low-standing TROUBLE
   *  intervention (paying to fix a mess, not a treat). */
  maxMeter?: Partial<Record<MeterKey, number>>;
}
/** How much of his earnings a lifestyle choice diverts to the club (0 = a personal treat, not an investment). */
export function clubInvestOf(itemId: string): number { return LIFESTYLE.find((i) => i.id === itemId)?.clubInvest ?? 0; }
export const LIFESTYLE: LifestyleItem[] = [
  // Grassroots / Academy — a kid: boots, a bike, a console, gifts for the folks (cheap; kid items retire by Youth Team)
  { id: 'boots',    icon: '👟', name: 'Your First Proper Boots', blurb: 'No more borrowed pairs — the boots the other kids have.',    cost: 80,   minChapterIdx: 0, maxChapterIdx: 2, perks: { authority: 5, peers: 3 } },
  { id: 'bike',     icon: '🚲', name: 'A New Bike',              blurb: 'Ride to training with your mates like a proper crew.',      cost: 130,  minChapterIdx: 0, maxChapterIdx: 2, perks: { peers: 6, family: 3 } },
  { id: 'console',  icon: '🎮', name: 'A Games Console',         blurb: 'Unwind with the lads online after a hard session.',         cost: 240,  minChapterIdx: 1, maxChapterIdx: 3, recovery: 3, perks: { peers: 8, school: -3 } },
  { id: 'gift-fam', icon: '🎁', name: 'Treat Your Parents',      blurb: 'Say thanks for the early mornings and endless lifts.',      cost: 300,  minChapterIdx: 1, maxChapterIdx: 4, perks: { family: 14 } },
  // Scholar — a teenager finding independence: driving lessons, better digs, courting the agent
  { id: 'driving',  icon: '🚦', name: 'Driving Lessons',         blurb: 'Freedom on the open road is finally within reach.',         cost: 420,  minChapterIdx: 3, maxChapterIdx: 4, perks: { peers: 5, partner: 4 } },
  { id: 'digs',     icon: '🛏️', name: 'Nicer Digs',             blurb: 'Better lodgings near the training ground — rest properly.', cost: 650,  minChapterIdx: 2, maxChapterIdx: 4, recovery: 4, perks: { peers: 4 } },
  { id: 'agent-din', icon: '🍽️', name: 'Wine & Dine Your Agent', blurb: 'Keep your agent hungry and fighting your corner.',          cost: 550,  minChapterIdx: 2, maxChapterIdx: 5, greed: 1, perks: { agent: 14 } },
  // Youth Team — a young pro: first car, designer clobber, your own place
  { id: 'wheels',   icon: '🚗', name: 'Your First Car',           blurb: 'Freedom on four wheels — and a few admiring glances.',      cost: 1000, minChapterIdx: 3, market: 1, perks: { peers: 6, partner: 4 } },
  { id: 'wardrobe', icon: '🕶️', name: 'A Designer Wardrobe',      blurb: 'Turn up looking the part — the brands start to notice.',    cost: 900,  minChapterIdx: 5, market: 1, greed: 1, perks: { sponsors: 8 } },
  { id: 'moveout',  icon: '🏡', name: 'Your Own Place',           blurb: 'Independence at last — your own space to recharge.',        cost: 1300, minChapterIdx: 3, recovery: 5, perks: { partner: 6 } },
  // Breakthrough — earning real money: marginal-gains, giving back, looking after family
  { id: 'chef',     icon: '🥗', name: 'Personal Chef & Trainer',  blurb: 'Marginal gains — you recover better and live right.',       cost: 1600, minChapterIdx: 4, recovery: 8 },
  { id: 'charity',  icon: '🎗️', name: 'Start a Foundation',       blurb: 'Give back to where you came from — the people love him.',   cost: 2200, minChapterIdx: 4, market: 2, perks: { fans: 12 } },
  { id: 'family',   icon: '💝', name: 'Buy Your Family a Home',    blurb: 'The dream — set the people who raised you up for life.',    cost: 2800, minChapterIdx: 4, market: 1, perks: { family: 22, partner: 4 } },
  // First Team / Establishing — a star: statement pieces, smart money, the mansion
  { id: 'watch',    icon: '⌚', name: 'A Statement Watch',         blurb: 'The one everyone clocks as you step off the coach.',        cost: 1500, minChapterIdx: 5, market: 1, greed: 1, perks: { sponsors: 6 } },
  { id: 'invest',   icon: '📈', name: 'A Property Portfolio',      blurb: 'Money makes money — a smart nest egg for after football.',  cost: 3200, minChapterIdx: 5, market: 3 },
  { id: 'mansion',  icon: '🏰', name: 'The Dream Mansion',         blurb: 'Gates, a pool, the lot — you have truly arrived.',          cost: 6000, minChapterIdx: 6, market: 2, greed: 1, recovery: 6, perks: { partner: 8, fans: 6 } },
  { id: 'supercar', icon: '🏎️', name: 'A Supercar',               blurb: 'Turn heads pulling into the car park — the boyhood dream, made real.', cost: 2400, minChapterIdx: 5, market: 1, perks: { fans: 8 } },
  { id: 'testim',   icon: '🎟️', name: 'Pledge a Testimonial Fund', blurb: 'Set some earnings aside for a benefit match — the dressing room notices.', cost: 2600, minChapterIdx: 5, perks: { peers: 14, fans: 6 } },
  { id: 'restaurant', icon: '🍷', name: 'Boutique Restaurant Investment', blurb: 'Put your name over the door of a place the whole city is talking about.', cost: 4200, minChapterIdx: 6, market: 2, greed: 1, perks: { sponsors: 8 } },
  // Real trade-offs: a flashy purchase that BUYS fame/fans but COSTS a relationship — money doesn't just
  // add, it reallocates. Lets a career choose an image, not just a shopping list.
  { id: 'flash-jewellery', icon: '💎', name: 'Flash the Jewellery', blurb: 'Chains and watches on full display — the cameras love it, the dressing room less so.', cost: 1100, minChapterIdx: 4, market: 2, greed: 1, perks: { fans: 10, peers: -10 } },
  { id: 'nightclub', icon: '🍾', name: 'A Night Out That Makes the Papers', blurb: 'A big night, splashed across the tabloids the next morning.', cost: 700, minChapterIdx: 4, market: 1, perks: { fans: 6, partner: -12, authority: -6 } },
  { id: 'private-tutor', icon: '📚', name: 'A Private Tutor', blurb: 'Keep learning off the pitch — a level head the papers can never take from you.', cost: 500, minChapterIdx: 2, maxChapterIdx: 3, perks: { school: 16, family: 6 } },
  { id: 'youth-coach-gift', icon: '🎁', name: 'Give Back to Your First Club', blurb: 'A donation to the grassroots club that made you — a nod to where it all started.', cost: 900, minChapterIdx: 5, perks: { fans: 10, family: 8 } },
  { id: 'entourage', icon: '🕴️', name: 'Build an Entourage', blurb: 'Old mates on the payroll now — loyal, but it costs, and the club whispers about who’s really around you.', cost: 1800, minChapterIdx: 5, greed: 1, perks: { peers: 12, authority: -6 } },
  // Player-directed investing — put earnings into the CLUB instead of a personal treat. Repeatable (never
  // marked "owned"), no personal perk — the trade-off is you vs the dynasty. The coins are credited to the
  // club server-side (clubInvestOf); buyLifestyle only spends the earnings and stays available.
  { id: 'invest-club-sm', icon: '🏛️', name: "Back the Club",       blurb: "Put earnings into the club's future instead of your own — every coin goes to the club.", cost: 150, minChapterIdx: 1, clubInvest: 150 },
  { id: 'invest-club-lg', icon: '🏟️', name: 'Back the Club — Big', blurb: 'A major injection into the club from your own pocket — the dynasty over the lifestyle.',       cost: 600, minChapterIdx: 3, clubInvest: 600 },
  // METER-GATED OPPORTUNITIES — tending a relationship has real teeth: a genuinely high standing unlocks
  // something money alone can't buy (only shows up on the shelf once you've earned the standing for it).
  { id: 'testimonial-seat', icon: '🎗️', name: 'A Seat on the Testimonial Committee', blurb: 'The fans have taken to him so completely, the club asks him to help plan his own future send-off.', cost: 1200, minChapterIdx: 5, market: 1, perks: { sponsors: 6 }, minMeter: { fans: 75 } },
  { id: 'dressing-room-mvp', icon: '🏅', name: 'Voted Dressing-Room Player of the Year', blurb: 'His own team-mates put him top of the pile — a peer-voted honour money could never buy.', cost: 400, minChapterIdx: 4, perks: { authority: 8, fans: 4 }, minMeter: { peers: 75 } },
  { id: 'trusted-voice', icon: '📣', name: "The Gaffer's Trusted Voice", blurb: 'So complete is the manager\'s trust, he starts being consulted before big calls are made.', cost: 800, minChapterIdx: 4, perks: { peers: 8, agent: 6 }, minMeter: { authority: 78 } },
  // METER-GATED TROUBLE — a low standing doesn't just cost you passively; it opens a costly damage-control
  // shelf you'd rather not need. Paying doesn't undo the mess, but it stops the bleeding.
  { id: 'crisis-pr', icon: '🧯', name: 'Hire a Crisis PR Team', blurb: 'The fans have turned on him and it shows no sign of blowing over — time to pay someone to manage the fallout.', cost: 900, minChapterIdx: 4, perks: { fans: 14 }, maxMeter: { fans: 25 } },
  { id: 'agent-firing', icon: '✂️', name: 'Cut Your Agent Loose', blurb: 'The relationship has soured beyond repair — an expensive, awkward, necessary split.', cost: 600, minChapterIdx: 3, perks: { agent: 30 }, maxMeter: { agent: 20 } },
  { id: 'counselling', icon: '🛋️', name: 'See a Relationship Counsellor', blurb: 'Things at home have got bad enough that pretending it will sort itself out isn’t working anymore.', cost: 500, minChapterIdx: 3, perks: { partner: 20 }, maxMeter: { partner: 25 } },
  // More texture: mischief and friendship purchases that don't fit a neat category above.
  { id: 'prank-fund', icon: '🎈', name: 'Fund the Dressing-Room Prank War', blurb: 'Bankroll the escalating nonsense — cling film on the boots, itching powder in the gloves. Worth every penny.', cost: 350, minChapterIdx: 3, perks: { peers: 12 } },
  { id: 'road-trip', icon: '🚐', name: 'A Road Trip With the Old Crew', blurb: 'Pile the mates from home into a van for a few days before pre-season — a last taste of before-all-this.', cost: 600, minChapterIdx: 3, maxChapterIdx: 5, perks: { peers: 10, family: 4 } },
  { id: 'club-legend-lunch', icon: '🍽️', name: 'Take a Club Legend to Lunch', blurb: 'Pick the brains of the man whose picture is on the wall — some things you can only learn over a meal.', cost: 450, minChapterIdx: 4, perks: { authority: 10 } },
];

// ── BACKROOM STAFF: at each age-chapter break you appoint a mentor/coach for the coming chapter.
// A coach amplifies your work in their SPECIALTY — you get better SUCCESS playing cards in those tags,
// so that development compounds. Appoint one that matches your identity to sharpen it, or one that
// shores up a weakness. A strategic layer on top of deck-building.
export interface Coach { id: string; name: string; kind: 'coach' | 'mentor'; desc: string; specialty: Tag[]; bonus: number }
export const COACHES: Coach[] = [
  { id: 'finishing',  name: 'Finishing Coach',   kind: 'coach',  desc: 'Hours drilling the work in front of goal',   specialty: ['composure', 'flair'], bonus: 0.074 },
  { id: 'technical',  name: 'Technical Coach',    kind: 'coach',  desc: 'Endless reps on close control & vision',      specialty: ['creativity', 'flair'], bonus: 0.074 },
  { id: 'defensive',  name: 'Defensive Coach',    kind: 'coach',  desc: 'Drills the dark arts of defending',           specialty: ['aggression', 'teamwork'], bonus: 0.074 },
  { id: 'fitness',    name: 'Fitness Coach',      kind: 'coach',  desc: 'Runs you into the ground — and back',         specialty: ['stamina'], bonus: 0.087 },
  { id: 'mentality',  name: 'Mentality Coach',    kind: 'coach',  desc: 'Builds the mind as much as the body',         specialty: ['composure', 'leadership'], bonus: 0.074 },
  { id: 'veteran',    name: 'Veteran Mentor',     kind: 'mentor', desc: 'A wise old pro takes you under his wing',     specialty: ['composure', 'leadership', 'teamwork'], bonus: 0.062 },
  { id: 'playmaker',  name: 'Playmaker Mentor',   kind: 'mentor', desc: 'A legendary no.10 shows you how to see it',   specialty: ['creativity', 'teamwork'], bonus: 0.074 },
  { id: 'warrior',    name: 'Warrior Mentor',     kind: 'mentor', desc: 'An old-school hard man teaches you to bite',  specialty: ['aggression', 'stamina'], bonus: 0.074 },
  { id: 'gk-coach',   name: 'Goalkeeping Coach',  kind: 'coach',  desc: 'Shot-stopping, handling, commanding the box', specialty: ['keeping'], bonus: 0.087 },
  { id: 'leadership', name: 'Leadership Coach',   kind: 'coach',  desc: 'Turns quiet lads into captains',              specialty: ['leadership'], bonus: 0.087 },
  { id: 'pressing',   name: 'Pressing Coach',     kind: 'coach',  desc: 'Choreographs the collective press',           specialty: ['stamina', 'aggression'], bonus: 0.074 },
  { id: 'creative',   name: 'Creativity Coach',   kind: 'coach',  desc: 'Frees the imagination in tight spaces',       specialty: ['creativity', 'composure'], bonus: 0.074 },
  { id: 'talisman-m', name: 'Talisman Mentor',    kind: 'mentor', desc: 'A born matchwinner teaches you to seize it',  specialty: ['flair', 'leadership'], bonus: 0.074 },
  { id: 'general-m',  name: 'The General',        kind: 'mentor', desc: 'A commanding centre-half drills your reading of the game', specialty: ['aggression', 'composure', 'teamwork'], bonus: 0.068 },
  { id: 'setpiece',   name: 'Set-Piece Coach',    kind: 'coach',  desc: 'Free-kicks, corners, every rehearsed dead ball',           specialty: ['composure', 'creativity', 'flair'], bonus: 0.062 },
  { id: 'psych',      name: 'Sports Psychologist', kind: 'coach', desc: 'Gets inside your head — and settles it',                   specialty: ['composure'], bonus: 0.093 },
  { id: 'scout-m',    name: 'Scout Mentor',       kind: 'mentor', desc: 'An old scout teaches you what the eye in the stand looks for', specialty: ['flair', 'creativity'], bonus: 0.074 },
  { id: 'youth-guru', name: 'Youth Development Guru', kind: 'mentor', desc: 'Coaxes raw talent out at its own pace, never forcing it', specialty: ['creativity', 'stamina'], bonus: 0.068 },
  { id: 'analytics',  name: 'Data & Analytics Coach', kind: 'coach', desc: 'Numbers over instinct — drills the patterns the data reveals', specialty: ['composure', 'teamwork'], bonus: 0.068 },
  { id: 'man-mgmt',   name: 'Man-Management Specialist', kind: 'mentor', desc: 'Knows exactly which button to push in which player', specialty: ['leadership', 'teamwork'], bonus: 0.081 },
  { id: 'street',     name: 'Street-Football Mentor', kind: 'mentor', desc: 'Learned the game on concrete, not carpet — and it shows', specialty: ['flair', 'creativity'], bonus: 0.081 },
  { id: 'discipline', name: 'Old-School Disciplinarian', kind: 'coach', desc: 'Fear and respect in equal measure — no excuses, ever', specialty: ['aggression', 'leadership'], bonus: 0.074 },
  { id: 'nutrition',  name: 'Nutrition & Recovery Coach', kind: 'coach', desc: 'What goes in matters as much as what comes out', specialty: ['stamina'], bonus: 0.081 },
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
  { id: 'fixer',     name: 'The Local Fixer',   desc: 'Knows every scout in the county — low fuss, right doors', exposure: 0.85, draftLuck: 1.45, greed: -4, valueMod: 0.9 },
  { id: 'showman',   name: 'The Showman',      desc: 'Markets you relentlessly — fame over fees',     exposure: 1.5,  draftLuck: 1.1,  greed: 2,  valueMod: 1.2 },
  { id: 'grafter',   name: 'The Grafter’s Agent', desc: 'Old-school; picks clubs where you’ll play', exposure: 1.05, draftLuck: 1.15, greed: -2, valueMod: 1.0 },
  { id: 'maverick-a', name: 'The Maverick Agent', desc: 'Unconventional, controversial, occasionally brilliant', exposure: 1.2,  draftLuck: 1.3,  greed: 4,  valueMod: 1.1 },
  { id: 'boutique',   name: 'Boutique Agency',    desc: 'A small, hand-picked roster — total personal attention', exposure: 0.9,  draftLuck: 1.2,  greed: -1, valueMod: 1.05 },
  { id: 'legal',      name: 'The Legal Eagle',    desc: 'Reads every clause twice — protects you, slows everything down', exposure: 0.8, draftLuck: 0.95, greed: -3, valueMod: 0.95 },
  { id: 'superstar-a', name: 'Global Superstar Agency', desc: 'The biggest names, the biggest cut, the biggest stage', exposure: 1.7, draftLuck: 1.3, greed: 7, valueMod: 1.3 },
];
export const agentById = (id?: string) => AGENTS.find((a) => a.id === id) ?? null;
/** how each temperament tilts greed (nature) — layered on the agent's influence */
const PERSONALITY_GREED: Record<string, number> = { maverick: 3, mercurial: 2, biggame: 1, fragile: 0, workhorse: -1, pro: -2, leader: -2, latebloom: -1, showman: 3, stoic: -1, hothead: 2, perfectionist: -1, joker: 1 };

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
// Three ARCHETYPES (stable ids for replay safety), each with several concrete offers so the between-season
// money decision isn't the identical screen every year (PT-16). The character is constant per id — 'money'
// = big cash + greed − form, 'brand' = fame, 'develop' = turn it down and grow — only the specifics vary.
const MONEY_OFFERS: Offer[] = [
  { id: 'money', name: 'Big-Money Move',    desc: 'A rich club abroad triples your wages — but it means uprooting and settling in all over again', earn: 900, greed: 2, market: 2, form: -0.08 },
  { id: 'money', name: 'The Release Clause', desc: 'A rival triggers your buyout — a life-changing payday, but you leave the badge that made you', earn: 1100, greed: 3, market: 2, form: -0.09 },
  { id: 'money', name: 'A Gulf Fortune',     desc: 'An offer from abroad that makes no sporting sense and every financial one — chase the cheque?', earn: 1400, greed: 4, market: 1, form: -0.11 },
  { id: 'money', name: 'The Loyalty Bonus',  desc: 'A fat renewal to stay put — the money without the move, but the wage packet goes to his head', earn: 700, greed: 2, market: 1, form: -0.05 },
];
const BRAND_OFFERS: Offer[] = [
  { id: 'brand', name: 'Boot & Kit Deal',    desc: 'A lucrative sponsorship and a rising profile — and the distractions that come with fame',    earn: 500, greed: 1, market: 3, form: -0.05 },
  { id: 'brand', name: 'A Magazine Cover',   desc: 'A glossy shoot and a fashion tie-in — his face is everywhere now, for better and worse',      earn: 420, greed: 1, market: 4, form: -0.06 },
  { id: 'brand', name: 'The Boot Launch',    desc: 'His own signature boot drops this summer — huge exposure, and eyes that are no longer all on the pitch', earn: 620, greed: 1, market: 3, form: -0.05 },
  { id: 'brand', name: 'Docu-series Deal',   desc: 'Cameras follow him for a season — the fame spikes, the focus wobbles',                       earn: 540, greed: 2, market: 4, form: -0.07 },
];
// These used to have NO downside: positive form, negative greed (a cheaper re-sign) and positive
// marketability, with forgone earnings as the only cost — and "The One-Club Man" advertised itself as "the
// fans adore him, the money waits, the football gets better", which is not a choice, it is a correct
// answer. Turning down the money now costs PROFILE: staying put means fewer eyes on him, and marketability
// is what pays for sponsors and the lifestyle that lifts his meters. Money buys reach; loyalty buys
// football. (PT-157)
const DEVELOP_OFFERS: Offer[] = [
  { id: 'develop', name: 'Stay & Develop',   desc: 'Turn the money down and knuckle down — he develops keenly, but the bigger stage forgets him for a while',   earn: 120, greed: -2, market: -1, form: 0.06 },
  { id: 'develop', name: 'Back the Project', desc: 'Reject the interest and commit to the club’s plan — he grows, though nobody outside the town is watching', earn: 100, greed: -2, market: 0, form: 0.07 },
  { id: 'develop', name: 'Head Down, Work',  desc: 'No deals, no distractions — a pure season of graft that sharpens his game and keeps him out of the papers',     earn: 90, greed: -3, market: -2, form: 0.08 },
  { id: 'develop', name: 'The One-Club Man', desc: 'Publicly pledge his future here — the terraces will love him for it, and the money and the limelight both go elsewhere', earn: 140, greed: -3, market: 0, form: 0.06 },
];
export const OFFERS: Offer[] = [MONEY_OFFERS[0], BRAND_OFFERS[0], DEVELOP_OFFERS[0]]; // canonical set (kept for any external ref)
export const OFFER_CHOICES = 3;
/** Deterministic financial offer set for a chapter — one variant of each archetype, indexed by turn so the
 *  specific offers differ season to season while the money/fame/develop choice (and ids) stay stable. */
// A 13-year-old academy kid does NOT get offered a release-clause buyout, a Gulf fortune or a docu-series.
// The senior banks above are for players with a professional contract; these are the age-real equivalents —
// travel money, a local shop's kit deal, a soccer-school gig — so the between-season money decision keeps its
// shape (money vs fame vs development) without handing a child a senior-pro dilemma (PT-146, cf PT-134).
const YOUTH_MONEY_OFFERS: Offer[] = [
  { id: 'money', name: 'Expenses Covered',   desc: 'The club offers to cover travel and kit for the season — it takes a real weight off at home', earn: 60, greed: 1, market: 0, form: -0.02 },
  { id: 'money', name: 'A Saturday Job',     desc: 'Weekend work at the sports shop — his own money for the first time, but it eats into his rest', earn: 90, greed: 2, market: 0, form: -0.05 },
  { id: 'money', name: 'The Soccer School',  desc: 'Helping coach the little ones in the holidays for pocket money — good money, long days', earn: 75, greed: 1, market: 1, form: -0.03 },
];
const YOUTH_BRAND_OFFERS: Offer[] = [
  { id: 'brand', name: 'The Local Paper',    desc: 'A photo and a write-up in the county paper — his nan buys six copies, and everyone at school sees it', earn: 25, greed: 0, market: 2, form: -0.02 },
  { id: 'brand', name: "A Shop's Boot Deal", desc: 'The sports shop on the high street will kit him out if he wears their stuff — free boots, small strings', earn: 50, greed: 1, market: 2, form: -0.02 },
  { id: 'brand', name: 'The Club Video',     desc: "A clip of him goes on the academy's channel — a taste of being watched, and of what that does to a boy", earn: 20, greed: 0, market: 3, form: -0.04 },
];
/** The three offers at a chapter break. Takes the CAREER SEED, not the rng: it must not consume a draw
 *  (that would shift every later roll and break replay), but it must still differ between careers.
 *  It previously ignored the seed entirely — `Math.imul(turn + 1, salt)` and nothing else — and the six
 *  chapter breaks land on fixed turns, so every career ever played saw the same six screens in the same
 *  order, and the weak mixing made the t46/t66/t86 trios come out identical to each other as well.
 *  40 careers produced just 12 distinct offer narrations. A proper hash of (seed, turn) fixes both. (PT-400) */
export function rollOffer(seed: number, turn: number): Offer[] {
  const at = (arr: Offer[], salt: number) => {
    let h = (Math.imul(seed ^ salt, 2654435761) ^ Math.imul(turn + 1, 374761393)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); h ^= h >>> 16;
    return arr[(h >>> 0) % arr.length];
  };
  // Youth Team (bandIdx 3, age 17-18) is where a first professional deal becomes plausible; below that the
  // offers stay age-real. Pure band lookup — no rng draw, so the offer stream is unchanged for older careers.
  const youth = bandAt(Math.min(turn, TOTAL_TURNS - 1)).index < 3;
  return [
    at(youth ? YOUTH_MONEY_OFFERS : MONEY_OFFERS, 2654435761),
    at(youth ? YOUTH_BRAND_OFFERS : BRAND_OFFERS, 40503),
    at(DEVELOP_OFFERS, 2246822519),
  ];
}

// ── FOCUS: between each chapter you decide how to spend the summer. Deterministic + development-neutral
// (moves energy + relationships only, no rng), so it steers which meters you carry into the next chapter
// — and thus which consequences bite — without disturbing the graduation trajectory. Stage-appropriate:
// a kid rests / studies / plays with mates; a pro tends a partner, works his agent, courts sponsors.
export interface FocusOption { id: string; icon: string; name: string; desc: string; energy: number; effects: Partial<Record<MeterKey, number>>; tag?: Tag }
const FOCUS_REST: FocusOption = { id: 'rest', icon: '🛌', name: 'Rest & Recharge', desc: 'A proper summer off. Come back fresh.', energy: +22, effects: { family: +4, peers: +3 } };
const FOCUS_BY_CHAPTER: Record<string, FocusOption[]> = {
  Grassroots: [
    { id: 'family',  icon: '🏠', name: 'Family Time',     desc: 'Kickabouts in the garden with your folks. Grounding.', energy: +10, effects: { family: +14, peers: +3 } },
    { id: 'mates',   icon: '🧒', name: 'Out With Mates',  desc: 'Long summer days with your mates. Priceless at this age.', energy: +6, effects: { peers: +16, family: -3 } },
    { id: 'skills',  icon: '⚽', name: 'Skills in the Park', desc: 'Hours against a wall. The coach will notice.', energy: -8, effects: { authority: +14, peers: +2 } },
    { id: 'firstcoach', icon: '🧑‍🏫', name: 'Sunday Mornings With Your First Coach', desc: 'He sees something in you and gives up his weekends to work on it — a bond that shapes you.', energy: -4, effects: { authority: +18, family: +2 } },
    { id: 'streetball', icon: '🏙️', name: 'Street Football Til Dark', desc: 'No coaches, no rules, just jumpers for goalposts and the older kids never taking it easy on you.', energy: -6, effects: { peers: +12, authority: +4 } },
  ],
  Academy: [
    { id: 'school',  icon: '🎒', name: 'Hit the Books',   desc: 'Keep the grades up — a fallback and a discipline.', energy: -6, effects: { school: +16, family: +6 } },
    { id: 'impress', icon: '🧑‍🏫', name: 'Impress the Coach', desc: 'Extra sessions, first to arrive. Staff love a grafter.', energy: -10, effects: { authority: +16, peers: -3 } },
    { id: 'mates',   icon: '🧒', name: 'Team Bonding',    desc: 'Tight with the lads — a dressing room that fights for you.', energy: +4, effects: { peers: +15, school: -4 } },
    { id: 'rivalry', icon: '🔥', name: 'Chase Your Best Mate', desc: 'You and your closest friend push each other every single session — it sharpens you both, but it stings when he pips you to a place.', energy: -6, effects: { peers: +8, authority: +8 } },
    { id: 'video', icon: '📹', name: 'Study the Pros on VHS', desc: 'Rewinding the same clip over and over, trying to steal a touch you saw on the telly.', energy: -4, effects: { peers: +2 }, tag: 'creativity' },
  ],
  Scholar: [
    { id: 'agent',   icon: '🤝', name: 'Sign With an Agent', desc: 'Someone to fight your corner as the offers start to whisper.', energy: -6, effects: { agent: +20 } },
    { id: 'impress', icon: '🧑‍🏫', name: 'Extra Sessions',   desc: 'Stay behind, do the ugly work. The coach is watching who wants it.', energy: -12, effects: { authority: +16, peers: -2 } },
    { id: 'school',  icon: '🎒', name: 'Finish Your Studies', desc: 'A scholar in name — keep the qualifications as a safety net.', energy: -6, effects: { school: +16, peers: +2 } },
    { id: 'setback', icon: '💪', name: 'Bounce Back From the Cut', desc: 'A string of released mates rattles the digs — you knuckle down and refuse to be next.', energy: -10, effects: { authority: +12, family: +6 } },
    { id: 'homesick', icon: '📞', name: 'Call Home Every Night', desc: 'Digs still don\'t feel like home — a nightly phone call keeps you tethered to who you are.', energy: +6, effects: { family: +16, peers: -2 } },
  ],
  'Youth Team': [
    { id: 'partner', icon: '❤️', name: 'A New Romance',    desc: 'You’ve met someone. Settled and happy off the pitch.', energy: +12, effects: { partner: +18 } },
    { id: 'agent',   icon: '🤝', name: 'Work Your Agent',  desc: 'Dinners and phone calls — get him fighting for you.', energy: -8, effects: { agent: +18, authority: -2 } },
    { id: 'impress', icon: '🧑‍🏫', name: 'Court the Gaffer', desc: 'Make yourself undroppable in pre-season.', energy: -12, effects: { authority: +16, partner: -4 } },
    { id: 'loan',    icon: '🚐', name: 'Push for a Loan Move', desc: 'Real senior football, away from home comforts — game time that toughens you up fast.', energy: -8, effects: { agent: +10, authority: +8, partner: -4 } },
    { id: 'firstflat', icon: '🔑', name: 'Move Into Your First Flat', desc: 'Your own front door for the first time — freedom, and a lot more washing-up.', energy: +8, effects: { peers: +6, family: -4 } },
  ],
  Breakthrough: [
    { id: 'partner', icon: '❤️', name: 'Time With Partner', desc: 'Protect your relationship as the spotlight grows.', energy: +10, effects: { partner: +16, fans: -2 } },
    { id: 'fans',    icon: '📣', name: 'Work the Fans',     desc: 'Community days, autographs — the terraces will sing your name.', energy: -8, effects: { fans: +18, partner: -4 } },
    { id: 'agent',   icon: '🤝', name: 'Lean on Your Agent', desc: 'Position yourself for the big move.', energy: -6, effects: { agent: +16, authority: -3 } },
    { id: 'contract', icon: '✍️', name: 'Talk Terms on Your First Pro Deal', desc: 'The club wants you tied down — negotiate hard, but don’t burn the bridge to the manager who gave you your chance.', energy: -8, effects: { agent: +14, authority: -4, fans: +4 } },
    { id: 'oldmentor', icon: '📖', name: 'Reconnect With an Old Mentor', desc: 'A visit to the coach who first believed in you — a reminder of where all this started.', energy: +6, effects: { authority: +10, family: +4 } },
  ],
  'First Team': [
    { id: 'starter', icon: '🧑‍🏫', name: 'Nail Your Starting Spot', desc: 'Pre-season graft — make the shirt yours and undroppable.', energy: -12, effects: { authority: +16, peers: -2 } },
    { id: 'fans',    icon: '📣', name: 'Give Back to the Fans', desc: 'Become a terrace favourite — they’ll carry you on the bad days.', energy: -8, effects: { fans: +16, partner: -3 } },
    { id: 'partner', icon: '❤️', name: 'Time With Partner', desc: 'A stable home life behind the rising star.', energy: +10, effects: { partner: +16, fans: -2 } },
    { id: 'leadership', icon: '🎗️', name: 'Grow Into a Leader', desc: 'The younger lads look to you now — start acting like the senior pro you’re becoming.', energy: -10, effects: { authority: +10, peers: +12 } },
    { id: 'oldfriend', icon: '🤜', name: 'Catch Up With an Old Friend', desc: 'The mate you came up with is at a rival club now — a beer and a reminder of simpler days.', energy: +8, effects: { peers: +10, fans: -2 } },
  ],
  Establishing: [
    { id: 'sponsors', icon: '📸', name: 'Sponsor Duties',   desc: 'Shoots and appearances. The brand — and the bank — grow.', energy: -12, effects: { sponsors: +18, peers: -4 } },
    { id: 'fans',     icon: '📣', name: 'Icon of the Terraces', desc: 'Give the supporters everything. Become untouchable.', energy: -8, effects: { fans: +16, partner: -3 } },
    { id: 'partner',  icon: '❤️', name: 'Settle Down',       desc: 'A stable home life behind the superstar.', energy: +10, effects: { partner: +16, sponsors: -4 } },
    { id: 'legacy',   icon: '👑', name: 'Think About Your Legacy', desc: 'What do you want them to say about you when it’s all over? You start carrying yourself like it.', energy: -6, effects: { authority: +10, fans: +10, peers: -2 } },
    { id: 'givingback', icon: '🧑‍🏫', name: 'Coach a Grassroots Session', desc: 'An afternoon back where you started, watching some kid make the same mistakes you did.', energy: -4, effects: { fans: +8, family: +6 } },
  ],
};
// ── LIGHT ATTRIBUTE FOCUS (a soft skill-tree): from Youth Team on, the summer offers one or two picks
// that ALSO nudge a specific stat family — a small, player-directed lean layered on top of the
// card-driven "earned, not chosen" development. No rng, no meter effects of its own beyond the small
// energy cost — the reward is purely the tag nudge (applied in deriveStats, see FOCUS_TAG_WEIGHT).
const TAG_FOCUS_BY_CHAPTER: Record<string, Array<{ id: string; icon: string; name: string; desc: string; tag: Tag }>> = {
  Grassroots:     [
    { id: 'focus_flair0',     icon: '🎨', name: 'Try Tricks in the Garden',      desc: 'Keepie-uppies against the shed wall until it’s dark — nobody taught you this, you just love it.', tag: 'flair' },
    { id: 'focus_stamina0',   icon: '🏃', name: 'Run to School and Back',        desc: 'Every day, rain or shine, because it beats the bus and it keeps you fit.', tag: 'stamina' },
  ],
  Academy:        [
    { id: 'focus_teamwork0',  icon: '🧩', name: 'Learn to Play for the Team',    desc: 'The coaches keep saying it: it’s not about you, it’s about the shirt.', tag: 'teamwork' },
    { id: 'focus_aggression0', icon: '⚔️', name: 'Toughen Up in the Tackle',     desc: 'Bigger lads, harder ground — learn to compete or get left behind.', tag: 'aggression' },
  ],
  Scholar:        [
    { id: 'focus_composure0', icon: '🧊', name: 'Work on Your Head, Not Just Your Feet', desc: 'A sports psychologist the club brought in — some of it actually sticks.', tag: 'composure' },
    { id: 'focus_creativity0', icon: '🎨', name: 'Spend Hours on the Rondo',     desc: 'Small-sided, tight spaces — the kind of practice that teaches you to see a pass before it’s there.', tag: 'creativity' },
  ],
  'Youth Team':   [
    { id: 'focus_stamina',    icon: '🏃', name: 'Punish Yourself in Pre-Season', desc: 'Double sessions, extra miles — build the engine now while your body can take it.', tag: 'stamina' },
    { id: 'focus_teamwork',   icon: '🧩', name: 'Study the Shape',               desc: 'Hours with the whiteboard and the analyst — learn to read the team, not just the ball.', tag: 'teamwork' },
  ],
  Breakthrough:   [
    { id: 'focus_composure',  icon: '🧊', name: 'Work on Big-Game Composure',    desc: 'Visualisation, breathing, reps under pressure — train the nerves as hard as the legs.', tag: 'composure' },
    { id: 'focus_creativity', icon: '🎨', name: 'Sharpen Your Vision',           desc: 'Extra time on the training pitch, trying passes no one else sees.', tag: 'creativity' },
  ],
  'First Team':   [
    { id: 'focus_leadership', icon: '🎖️', name: 'Grow Into a Leader on the Pitch', desc: 'Start talking, start organising — take on the responsibility.', tag: 'leadership' },
    { id: 'focus_aggression', icon: '⚔️', name: 'Sharpen Your Edge',             desc: 'Add a nastier, more competitive streak to your game.', tag: 'aggression' },
  ],
  Establishing:   [
    { id: 'focus_flair',      icon: '✨', name: 'Perfect a Signature Move',      desc: 'One trick, drilled a thousand times, until it’s unstoppable.', tag: 'flair' },
    { id: 'focus_leadership2', icon: '🎖️', name: 'Become the Dressing-Room Leader', desc: 'The senior voice everyone else follows now.', tag: 'leadership' },
  ],
};
const GK_TAG_FOCUS_BY_CHAPTER: Record<string, { id: string; icon: string; name: string; desc: string; tag: Tag }> = {
  Grassroots:     { id: 'focus_keeping0a', icon: '🧤', name: 'Dive Around in the Back Garden', desc: 'Nobody asked you to go in goal — you just never wanted to come out again.', tag: 'keeping' },
  Academy:        { id: 'focus_keeping0b', icon: '🧤', name: 'Learn Your Angles', desc: 'The goalkeeping coach keeps moving you six inches at a time until you start to see why.', tag: 'keeping' },
  Scholar:        { id: 'focus_keeping0c', icon: '🧤', name: 'Catch, Don’t Punch', desc: 'A stubborn habit the coaches are slowly drilling out of you, cross by cross.', tag: 'keeping' },
  'Youth Team':   { id: 'focus_keeping1', icon: '🧤', name: 'Extra Hours on the Shot-Stopping Machine', desc: 'Ball after ball, low and hard — drill the reactions until they’re instinct.', tag: 'keeping' },
  Breakthrough:   { id: 'focus_keeping2', icon: '🧤', name: 'Master Commanding Your Box',              desc: 'Crosses, corners, one-on-ones — own every inch of your penalty area.', tag: 'keeping' },
  'First Team':   { id: 'focus_keeping3', icon: '🧤', name: 'Perfect Your Distribution',                desc: 'Turn every save into the first pass of a counter-attack.', tag: 'keeping' },
  Establishing:   { id: 'focus_keeping4', icon: '🧤', name: 'Become the Last Word',                     desc: 'The kind of keeper a defence plays with total confidence in front of.', tag: 'keeping' },
};
const TAG_FOCUS_ENERGY = -5; // a light, deliberate training focus — a small energy cost, no meter swing

/** The between-chapter focus choices for a life stage (Rest is always available). `standing`, if given,
 *  adds a high-variance RISK pick for later chapters — sized off current state, not rng (see below).
 *  `track` adds a GK-specific attribute-focus pick from Youth Team onward. */
export function rollFocus(chapter: string, standing?: Record<MeterKey, number>, track: Track = 'outfield', hasAgent = false): FocusOption[] {
  // Don't offer to sign an agent he already signed. A player who took the Super-Agent during onboarding
  // still saw "🤝 Sign With an Agent" on the age-15 summer screen with the AGENT meter sitting in his HUD
  // — the clearest "the game isn't tracking me" signal in a live playtest, and it devalues the choice the
  // onboarding made him make. (PT-153)
  const base = (FOCUS_BY_CHAPTER[chapter] ?? FOCUS_BY_CHAPTER.Establishing).filter((f) => !(hasAgent && f.id === 'agent'));
  const risk = standing ? riskFocusFor(chapter, standing) : null;
  const tagPicks = (TAG_FOCUS_BY_CHAPTER[chapter] ?? []).map((t) => ({ id: t.id, icon: t.icon, name: t.name, desc: t.desc, energy: TAG_FOCUS_ENERGY, effects: {}, tag: t.tag }));
  const gk = track === 'goalkeeper' ? GK_TAG_FOCUS_BY_CHAPTER[chapter] : null;
  const gkPick = gk ? [{ id: gk.id, icon: gk.icon, name: gk.name, desc: gk.desc, energy: TAG_FOCUS_ENERGY, effects: {}, tag: gk.tag }] : [];
  // Rest stays LAST — it's the deliberate, meter-neutral fallback the balance harness picks when nothing
  // else matches a need, so it must never be displaced by the newer attribute-focus picks.
  return [...base, ...(risk ? [risk] : []), ...tagPicks, ...gkPick, FOCUS_REST];
}

// ── RISK FOCUS: from Breakthrough onward, a bold high-variance pick alongside the safe ones — a small
// guaranteed cost for a fan swing sized off your CURRENT fan standing (more headroom when you're not yet
// adored, less once you are). Deterministic from state, not rng — same replay-safe contract as the rest.
const RISK_FOCUS_CHAPTERS = new Set(['Breakthrough', 'First Team', 'Establishing']);
function riskFocusFor(chapter: string, standing: Record<MeterKey, number>): FocusOption | null {
  if (!RISK_FOCUS_CHAPTERS.has(chapter)) return null;
  const gain = Math.round(8 + (100 - (standing.fans ?? 50)) * 0.28); // low standing = more room to swing
  return {
    id: 'risk_press', icon: '🎤', name: 'Speak to the Press',
    desc: `A bold, headline-grabbing interview — could win the terraces over big (+${gain} fans), but the dressing room won't love the grandstanding.`,
    energy: -10, effects: { fans: +gain, peers: -8 },
  };
}

// ── SIDE FOCUS: from Breakthrough onward, a smaller SECOND summer pick alongside the main one — a
// public-facing extra with a tiny nudge, on top of (not instead of) the main focus. Same deterministic,
// development-neutral contract as the main focus (energy + relationships only, no rng).
const FOCUS_SIDE_SKIP: FocusOption = { id: 'side_skip', icon: '➖', name: 'Nothing Else', desc: 'Keep it simple this summer — no extra commitments.', energy: 0, effects: {} };
const SIDE_FOCUS_BY_CHAPTER: Record<string, FocusOption[]> = {
  Scholar: [
    { id: 'letters',  icon: '✉️', name: 'Write Home',          desc: 'A quick letter back to the people who can\'t make every game.', energy: -2, effects: { family: +6 } },
    { id: 'trial',    icon: '🎽', name: 'Turn Out for a Trial Game', desc: 'An extra, unpaid ninety minutes in front of a watching scout.', energy: -4, effects: { authority: +6 } },
  ],
  'Youth Team': [
    { id: 'digsparty', icon: '🎉', name: 'A Night In With the Digs Lads', desc: 'Cheap pizza and FIFA with the other academy kids — small, but it matters.', energy: -2, effects: { peers: +6 } },
    { id: 'reserves',  icon: '🎽', name: 'Volunteer for an Extra Reserves Game', desc: 'Nobody\'s forcing you, but the minutes are the minutes.', energy: -4, effects: { authority: +6 } },
  ],
  Breakthrough: [
    { id: 'charity',  icon: '🤝', name: 'Charity Five-a-Side', desc: 'A low-key kickabout for a good cause — the fans notice the little things.', energy: -3, effects: { fans: +6 } },
    { id: 'mediaday', icon: '📷', name: 'A Media Day',         desc: 'An hour of interviews and photos squeezed in between the main plans.',        energy: -3, effects: { agent: +6 } },
  ],
  'First Team': [
    { id: 'charity', icon: '🤝', name: 'Charity Five-a-Side', desc: 'A low-key kickabout for a good cause — the fans notice the little things.', energy: -3, effects: { fans: +6 } },
    { id: 'signing', icon: '✍️', name: 'A Signing Session',   desc: 'An afternoon at the club shop, meeting the people who pay to watch you.',    energy: -3, effects: { sponsors: +6 } },
  ],
  Establishing: [
    { id: 'charity',   icon: '🤝', name: 'Charity Five-a-Side',   desc: 'A low-key kickabout for a good cause — even a superstar remembers where he came from.', energy: -3, effects: { fans: +6 } },
    { id: 'boardroom', icon: '🥂', name: 'A Boardroom Appearance', desc: 'Handshakes and small talk with the people who run the club.',                           energy: -3, effects: { sponsors: +6 } },
  ],
};

/** Seeded coach choices for a track: outfield sees no GK-only coach, GK sees the GK coach + mental ones. */
export function rollCoaches(rng: () => number, track: Track, n = COACH_OFFER): Coach[] {
  const pool = COACHES.filter((c) => (track === 'goalkeeper' ? true : !c.specialty.includes('keeping')));
  const shuffled = shuffleSeeded(pool, rng);
  return shuffled.slice(0, Math.min(n, pool.length));
}

// ── scenarios: each moment demands a weighted mix of tags; kind biases the demand ──
// stakes 1 (normal) / 2 (big) / 3 (huge). Big moments are worth MORE (shape you harder) and are
// riskier (more variance) — this is where reputations are made and the Big-Game Player trait is earned.
export interface Scenario { id: string; kind: 'match' | 'social' | 'training'; demand: Partial<Record<Tag, number>>; label: string; stakes: 1 | 2 | 3; life?: LifeKind | null; rival?: boolean; callup?: boolean }
// RIVALRY CONSEQUENCE: a real, distinct payoff when a big-stage MATCH scenario is framed as a head-to-head
// against the seeded academy rival (see careerCast in narrate.ts — this module doesn't need his name, just
// the mechanic). Bigger than a routine big-game swing: bragging rights are worth more than the occasion alone.
const RIVAL_CONSEQUENCE = { good: { fans: 8, agent: 4 } as Partial<Record<MeterKey, number>>, bad: { fans: -5 } as Partial<Record<MeterKey, number>>, earnGood: 80 };
// SHOCK CALL-UP CONSEQUENCE: a senior first-teamer goes down injured/suspended hours before kickoff and he's
// thrown straight in (see makeScenario's `callup` gate + the "shock call-up" research hook — a real, common
// debut anecdote). Nervier than a routine big game, so it swings bigger both ways: a big reward for standing
// up to it, a real dent if the nerves get him.
const CALLUP_CONSEQUENCE = { good: { authority: 10, fans: 8 } as Partial<Record<MeterKey, number>>, bad: { authority: -8, fans: -3 } as Partial<Record<MeterKey, number>>, earnGood: 100 };

// ── LIFE EVENTS: a fraction of low-stakes SOCIAL moments become a proper off-pitch dilemma — a contract
// standoff, a loan decision, a media storm — instead of a generic dressing-room beat. Resolved by the SAME
// card play (fit/success unchanged), but the OUTCOME carries a real, persisted consequence: differentiated
// meter/earnings swings on top of the usual updateLife() reaction (see LIFE_CONSEQUENCE, applied in play()).
// Selection is a pure hash of (seed, turn) — NOT drawn from the rng() stream — so it never perturbs the
// scenario's demand/stakes or any other rng-derived number; only development-touching where the consequence
// itself nudges standing (small, same order of magnitude as the existing per-turn meter reactions).
export type LifeKind = 'contract' | 'loan' | 'setback' | 'media' | 'loyalty' | 'role' | 'fallout'
  | 'injury_comeback' | 'transfer_rumour' | 'manager_fallout' | 'charity' | 'social_storm' | 'family_illness' | 'romance'
  | 'mentor_crossroads' | 'friend_rivalry' | 'new_money' | 'move_abroad';
export const LIFE_KINDS: LifeKind[] = ['contract', 'loan', 'setback', 'media', 'loyalty', 'role', 'fallout', 'injury_comeback', 'transfer_rumour', 'manager_fallout', 'charity', 'social_storm', 'family_illness', 'romance', 'mentor_crossroads', 'friend_rivalry', 'new_money', 'move_abroad'];
// SENIOR-only life milestones — a senior contract standoff, a release-clause transfer, a marriage/settling-down,
// a first big payday, an international move — must not land on a 15-16-year-old scholar (FIFA even bans a minor's
// foreign transfer). These fire only from Breakthrough (bandIdx >= 4, age ~19+); younger bands draw from the
// age-appropriate YOUTH_LIFE_KINDS instead. Pure-hash indexed (no rng draw), so this shifts no rng-draw count (PT-134).
export const SENIOR_LIFE_KINDS: LifeKind[] = ['contract', 'transfer_rumour', 'romance', 'new_money', 'move_abroad'];
export const YOUTH_LIFE_KINDS: LifeKind[] = LIFE_KINDS.filter((k) => !SENIOR_LIFE_KINDS.includes(k));
export const LIFE_LABEL: Record<LifeKind, string> = {
  contract: 'a contract standoff', loan: 'a loan-move decision', setback: 'bouncing back from a public mistake',
  media: 'a media storm', loyalty: 'a boyhood-club approach', role: 'a squad-role ultimatum', fallout: 'a public falling-out with a teammate',
  injury_comeback: 'fighting his way back from injury', transfer_rumour: 'transfer speculation swirling around him',
  manager_fallout: 'a falling-out with the manager', charity: 'a charity and community appearance',
  social_storm: 'a social-media storm', family_illness: 'a family illness pulling at him', romance: 'settling down off the pitch',
  mentor_crossroads: 'a crossroads moment with an old mentor', friend_rivalry: 'an old friendship turning into real rivalry',
  new_money: 'a first big payday changing the money around him', move_abroad: 'a life-changing move to a foreign club',
};
// good/bad meter + earnings swing per life-kind, applied ON TOP of the generic per-turn reaction — this is
// what makes a life event mechanically distinct from an ordinary social scenario, not just a re-skin.
const LIFE_CONSEQUENCE: Record<LifeKind, { good: Partial<Record<MeterKey, number>>; bad: Partial<Record<MeterKey, number>>; earnGood?: number; earnBad?: number }> = {
  contract:         { good: { agent: 10, authority: 4 },  bad: { agent: -8, authority: -6 }, earnGood: 150 },
  loan:             { good: { authority: 8, agent: 4 },   bad: { authority: -6, peers: -4 } },
  setback:          { good: { fans: 6, authority: 6 },    bad: { fans: -8, authority: -8 } },
  media:            { good: { fans: 8, sponsors: 4 },     bad: { fans: -6, agent: -4 } },
  loyalty:          { good: { fans: 10, family: 6 },      bad: { agent: -6, fans: -4 } },
  role:             { good: { authority: 8 },             bad: { authority: -10, peers: -4 } },
  fallout:          { good: { peers: 6, authority: 4 },   bad: { peers: -12, authority: -4 } },
  injury_comeback:  { good: { authority: 6, family: 4 },  bad: { authority: -4, family: -4 } },
  transfer_rumour:  { good: { agent: 8, fans: -2 },       bad: { agent: -4, peers: -6 } },
  manager_fallout:  { good: { authority: 4, peers: 4 },   bad: { authority: -14 } },
  charity:          { good: { fans: 10, family: 4 },      bad: { fans: 2 } },
  social_storm:     { good: { fans: 6, sponsors: 4 },     bad: { fans: -10, sponsors: -8 } },
  family_illness:   { good: { family: 10 },               bad: { family: -14, authority: -4 } },
  romance:          { good: { partner: 16 },              bad: { partner: -10 } },
  mentor_crossroads: { good: { authority: 10, peers: 4 }, bad: { authority: -6, family: -4 } },
  friend_rivalry:   { good: { peers: 8, fans: 4 },        bad: { peers: -10 } },
  new_money:        { good: { family: 6, peers: 6 },      bad: { peers: -10, family: -4 } },
  move_abroad:      { good: { authority: 8, agent: 4 },   bad: { family: -8, peers: -4 } },
};
/** Pure deterministic hash → [0,1), independent of the career's rng() stream (never consumes it). */
/** A seeded Fisher-Yates shuffle. MUST be used instead of `arr.sort(() => rng() - 0.5)`: an inconsistent
 *  sort comparator consumes a number of rng() draws that depends on the ENGINE'S sort implementation (V8
 *  measured 9-12 draws for the same 6-element array), so the identical save replayed in a different browser
 *  — or after a V8 upgrade — rebuilt a different career from turn 0. This game's saves are (seed + action
 *  list) replays, so that quietly broke the whole save model. Fisher-Yates always consumes exactly n-1
 *  draws, making replay engine-independent. (PT-600) */
function shuffleSeeded<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function pureHash01(seed: number, turn: number, salt: number): number { return mulberry32(((seed ^ Math.imul(turn + 1, 2654435761)) ^ salt) >>> 0)(); }
// turn-strided index: walks a pool with a stride made coprime to its length, so successive turns land on
// non-adjacent, non-repeating entries instead of birthday-clustering the way a fresh random draw does.
// Used to stop the same big-game occasion label recurring within one chapter (PT-111).
function stridedIdx(len: number, turn: number, salt: number, baseStride: number): number {
  if (len <= 1) return 0;
  const gcd = (a: number, b: number): number => { while (b) { [a, b] = [b, a % b]; } return a; };
  let s = (((baseStride % len) + len) % len) || 1;
  while (gcd(s, len) !== 1) s = (s % len) + 1;
  return (((turn * s + salt) % len) + len) % len;
}
const KIND_BIAS: Record<Scenario['kind'], Tag[]> = {
  match: TAGS,                                                   // anything can come up in a match
  social: ['leadership', 'composure', 'teamwork'],              // dressing room / media
  training: ['stamina', 'creativity', 'flair', 'aggression'],   // sharpen the tools
};
const KIND_POOL: Scenario['kind'][] = ['match', 'match', 'match', 'social', 'training'];
// goalkeeper moments demand keeping heavily, plus the calm/commanding traits that suit a keeper
const GK_BIAS: Tag[] = ['keeping', 'keeping', 'keeping', 'composure', 'leadership', 'creativity'];
// SENIOR big-game occasions (Breakthrough onward). "Boxing Day Away Day" had a venue baked in that contradicted
// a home fixture (PT-107) — now venue-neutral. Senior-club framings stay out of the youth bank below.
const BIG_MOMENTS = ['Derby Day', 'Cup Quarter-Final', 'Relegation Six-Pointer', 'Live on TV', 'Top-of-the-Table Clash', 'The Return to a Former Club', 'A Scout-Packed Showcase', 'Local Bragging Rights',
  'The Boxing Day Fixture', 'A New Manager\'s First Big Test', 'A Point to Prove to the Doubters', 'The Fixture the Fans Circle', 'A Testimonial for a Club Legend', 'Under the Lights, First Time on This Stage'];
// YOUTH big-game occasions (Grassroots..Youth Team) — no relegation six-pointers, testimonials, TV or new-manager
// framings that a 15–18-year-old on the academy circuit would never face (PT-107).
const YOUTH_BIG_MOMENTS = ['Derby Day', 'The Youth-Cup Quarter-Final', 'A Scout-Packed Showcase', 'Local Bragging Rights', 'A Point to Prove', 'The Big Trial Against a Bigger Club', 'The Game the Coaches Are Watching', 'First Time Under the Floodlights', 'The Grudge Match With the School Down the Road', 'The Fixture the Academy Circles'];
const HUGE_MOMENTS = ['CUP FINAL', 'Title Decider', 'Promotion Play-Off Final', 'The Last Day of the Season', 'A Cup Semi Under the Lights', 'The Biggest Game in the Club’s History',
  'A Continental Final', 'The Match That Decides Who Goes Down', 'A Derby With the Title on the Line', 'A Comeback From the Brink', 'The Game Your Whole Career Gets Judged On'];

/** A seeded scenario. Tag demand comes from the current AGE BAND (age-appropriate); stakes are gated
 *  by the band (no cup finals at grassroots). `demandBias` (a gaffer's demand) leans the demand. */
export function makeScenario(rng: () => number, i: number, track: Track = 'outfield', demandBias?: Tag | null, band?: AgeBand, exposure = 1, seed?: number): Scenario {
  const kind = KIND_POOL[Math.floor(rng() * KIND_POOL.length)];
  const bias = track === 'goalkeeper' ? GK_BIAS : (band ? band.demand : OUTFIELD_TAGS);
  const n = 1 + Math.floor(rng() * Math.min(3, bias.length));
  const pool = [...new Set(shuffleSeeded(bias, rng))].slice(0, n);
  const raw = pool.map(() => 0.3 + rng());
  // KIND_BIAS IS STILL DEAD, DELIBERATELY, AND THIS IS THE SECOND TIME IT HAS BEEN LEFT THAT WAY.
  //
  // The defect is real: KIND_BIAS describes which tags each kind of scenario should ask for, nothing reads
  // it, and 75% of social and training scenarios demand a tag their own kind excludes — a media scrum
  // asking an outfielder for `keeping`. I fixed it by substituting off-kind tags through pureHash01,
  // verified that the rng DRAW STREAM was byte-identical, and concluded stored careers were safe.
  //
  // THE DRAW STREAM WAS NEVER WHAT WAS AT RISK. An adversarial replay found it: changing `demand` changes
  // `fit`, which changes `success`, which changes energy and injuries, which changes the PHASE SEQUENCE —
  // so a stored action list no longer matches the career it is replayed into. loadCareer's tolerant path
  // does not throw, it silently TRUNCATES: of six recorded careers, four diverged, and one lost 108 of its
  // 120 turns — a finished 25-year-old reloading as a 13-year-old. Byte-identical rng protected nothing,
  // and my verifying it is what stopped anyone looking further.
  //
  // The substitution also collapsed distinct drawn tags onto the same allowed tag, taking single-tag
  // social scenarios from 29.9% to 41.8% — directly against PT-700, which exists to make moments test the
  // deck rather than hand you a gimme.
  //
  // Fixing this properly needs the demand to change WITHOUT the replay diverging: either a save-version
  // gate that replays pre-existing careers on the old rule, or making replay tolerant of a changed demand
  // by re-deriving success from the stored choice rather than recomputing it. Both are real work. Until
  // then the wrong-flavoured demand stays, because a wrong tag in a prompt is a blemish and a silently
  // truncated dynasty is not.
  const demand: Partial<Record<Tag, number>> = {};
  pool.forEach((t, k) => { demand[t] = raw[k]; });
  if (demandBias) demand[demandBias] = (demand[demandBias] ?? 0) + 0.6;  // the gaffer wants more of this
  // Normalise so the TOP-demanded tag = 1.0 (was sum=1, which diluted multi-tag demands so a card matching
  // the main need still scored a low fit → skilled play felt random). Now a card that addresses the biggest
  // need reads as a strong fit; extra matched tags still add (fit sums, clamped at 1) so covering more is
  // better, and a card that matches nothing important stays low. This is the core "good play feels good" fix.
  const mx = Math.max(...(Object.values(demand) as number[]), 0.001);
  // Normalise the TOP demand to 0.78, not 1.0. At 1.0 any card carrying the top tag scored a full 1.0 (fit is
  // clamped at 1), so a correct play was arithmetically incapable of being less than Brilliant at ordinary
  // stakes: 92% of skilled turns graded Brilliant and career outcomes spread only 8.8% between best and worst.
  // At 0.78 a single-tag answer is good but not maximal, and COVERING A SECOND demanded tag is what restores
  // it to 1.0 — so reading the whole demand becomes the actual skill. (PT-700)
  const TOP_DEMAND = 0.78;
  for (const t of Object.keys(demand) as Tag[]) demand[t] = ((demand[t] ?? 0) / mx) * TOP_DEMAND;
  const maxStakes = band ? band.maxStakes : 3;
  const r = rng();
  const stakes: 1 | 2 | 3 = maxStakes >= 3 && r < 0.05 * exposure ? 3 : maxStakes >= 2 && r < 0.17 * exposure ? 2 : 1; // an agent's exposure = more big stages; big games kept scarcer so they land as occasions (PT-111)
  // BIG GAMES demand more: a high-stakes moment gets at least two things asked of it (and a huge one, three),
  // so it genuinely tests the deck rather than being a single-tag gimme behind a dramatic header (PT-12).
  // Pure hash of (seed, turn) → no rng draw, so it never perturbs older careers that predate this.
  if (stakes >= 2 && seed != null) {
    const want = stakes >= 3 ? 3 : 2;
    let guard = 0;
    while (Object.keys(demand).length < want && guard < 8) {
      const extras = bias.filter((t) => !(t in demand));
      if (!extras.length) break;
      demand[extras[Math.floor(pureHash01(seed, i, 0x71b12 + guard) * extras.length)]] = 0.6 - guard * 0.08;
      guard++;
    }
  }
  // draw the moment pick unconditionally (keeps the rng stream stable) but only USE a match-flavoured moment
  // name for MATCH scenarios — "Derby Day"/"Cup Final" was bleeding onto training/life moments (PT-15).
  // youth chapters (Grassroots..Youth Team) draw age-appropriate big-game names, not senior-club ones (PT-107).
  // One rng() draw either way, so the stream — and determinism — is unchanged; only the chosen string differs.
  const bigPool = band && AGE_BANDS.indexOf(band) <= 3 ? YOUTH_BIG_MOMENTS : BIG_MOMENTS;
  // TWO DRAWS AT STAKES 3, ONE OTHERWISE — and that asymmetry is now load-bearing, so it must not be
  // "tidied away". The comment here used to claim one draw either way, which is false: this draw always
  // happens and the HUGE_MOMENTS pick below takes a second when stakes === 3. Replay is safe because
  // `stakes` comes from the same stream, so both sides agree — but anyone who deletes this deliberately
  // dead draw, or retunes the stakes thresholds, silently rewrites every career already saved.
  const bigRoll = Math.floor(rng() * bigPool.length); void bigRoll; // deliberately dead: holds the stream
  const momentPick = stakes === 3 ? HUGE_MOMENTS[Math.floor(rng() * HUGE_MOMENTS.length)]
    : stakes === 2 ? bigPool[stridedIdx(bigPool.length, i, (seed ?? 0) >>> 0, 7)] : null; // ...but pick the label by a turn-strided walk so it doesn't repeat within a chapter (PT-111)
  const moment = kind === 'match' ? momentPick : null;
  // LIFE EVENT: a slice of low-stakes social moments, from Scholar onward, become an off-pitch dilemma
  // instead of a generic dressing-room beat. A pure hash of (seed, turn) — costs no rng() draws, so it
  // never perturbs demand/stakes/moment above for careers that predate this feature or don't hit the gate.
  const bandIdx = band ? AGE_BANDS.indexOf(band) : -1;
  const lifePool = bandIdx >= 4 ? LIFE_KINDS : YOUTH_LIFE_KINDS; // Scholar/Youth-Team (bandIdx 2-3) get only age-appropriate milestones (PT-134)
  const life: LifeKind | null = seed != null && kind === 'social' && stakes === 1 && bandIdx >= 2 && pureHash01(seed, i, 0x5a17e) < 0.37
    ? lifePool[Math.floor(pureHash01(seed, i, 0x1123bc) * lifePool.length)]
    : null;
  // RIVALRY MOMENT: a slice of big-stage MATCH scenarios, from Youth Team on, become an explicit
  // head-to-head against the seeded academy rival — same pure-hash technique as `life`, no extra rng()
  // draws, so it never perturbs demand/stakes/moment for careers that predate this or don't hit the gate.
  const rival = seed != null && kind === 'match' && stakes >= 2 && bandIdx >= 3 && pureHash01(seed, i, 0x72195) < 0.3;
  // SHOCK CALL-UP: from Breakthrough on, a slice of big-stage MATCH moments become a "shock call-up" — a
  // senior first-teamer is out and he's told hours before kickoff he's starting. Same pure-hash technique
  // as `life`/`rival` (no extra rng() draws); mutually exclusive with a rivalry moment so one big-stage
  // reskin doesn't crowd out another.
  const callup = !rival && seed != null && kind === 'match' && stakes >= 2 && bandIdx >= 4 && pureHash01(seed, i, 0x9c41f) < 0.18;
  const label = life ? LIFE_LABEL[life] : moment ? `★ ${moment}` : `${kind}: ${Object.keys(demand).join(' / ')}`;
  return { id: `sc${i}`, kind, demand, label, stakes, life, rival, callup };
}

/** How well a card's tags satisfy a scenario's demand, 0..1. */
export function fit(card: Card, sc: Scenario): number {
  let f = 0;
  for (const t of card.tags) f += sc.demand[t] ?? 0;
  return clamp(f, 0, 1);
}

export interface Choice { cardId: string; tags: Tag[]; power: number; fit: number; bestFit: number; success: number; scenario: string; stakes: number; matchedAsk: boolean }

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
  { name: 'Academy',      from: 13, to: 14, turns: 16, maxStakes: 1, demand: ['flair', 'stamina', 'creativity', 'teamwork', 'composure', 'aggression'] },
  { name: 'Scholar',      from: 15, to: 16, turns: 18, maxStakes: 2, demand: OUTFIELD_TAGS },
  { name: 'Youth Team',   from: 17, to: 18, turns: 20, maxStakes: 2, demand: OUTFIELD_TAGS },
  { name: 'Breakthrough', from: 19, to: 20, turns: 20, maxStakes: 3, demand: OUTFIELD_TAGS },
  { name: 'First Team',   from: 21, to: 22, turns: 18, maxStakes: 3, demand: OUTFIELD_TAGS },
  { name: 'Establishing', from: 23, to: 25, turns: 16, maxStakes: 3, demand: OUTFIELD_TAGS },
];
/** Did this card carry a tag the moment actually asked for? Used by the debut guarantee, which must only
 *  fire for a genuinely correct read — a player who opens with the wrong card still learns that it cost him. */
function matchedAskEarly(card: { tags: string[] }, demand: Record<string, number>): boolean {
  return card.tags.some((t) => (demand[t] ?? 0) > 0);
}

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
// A meter the player SPENDS COINS ON must be on screen. Family was hidden from Scholar onward — five of
// the seven chapters — while "Treat Your Parents 🏠+14" and "Buy Your Family a Home" were on sale in all
// of them, so the player was paying into a bar he could not see. Agent was hidden at First Team and
// Establishing while "Wine & Dine Your Agent" and "Cut Your Agent Loose" both moved it. Family in
// particular belongs everywhere in a game about a bloodline. tools/playtest/meters.ts guards this. (PT-154)
const CHAPTER_METERS: Record<string, string[]> = {
  Grassroots:   ['coach', 'parents', 'mates'],
  Academy:      ['coach', 'parents', 'teammates', 'school'],
  Scholar:      ['coach', 'parents', 'teammates', 'school', 'agent'],   // scholarship years: an agent enters, school still counts
  'Youth Team': ['coach', 'parents', 'teammates', 'school', 'agent', 'partner'],
  Breakthrough: ['gaffer', 'parents', 'team', 'fans', 'agent', 'partner'],
  'First Team': ['gaffer', 'parents', 'team', 'fans', 'sponsors', 'agent', 'partner'],
  Establishing: ['gaffer', 'parents', 'team', 'fans', 'sponsors', 'agent', 'partner'],
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

/** Re-word a season event for the life stage it lands in — the mechanics (form/rng) never change, only
 *  how it's told: a kid's "new gaffer" is a new coach his mum hears about at the school gates; a
 *  20-something's is the same event but about a real manager and real transfer speculation. Keeps each
 *  age band feeling distinctly lived-in without touching a single number. */
const EVENT_FLAVOR: Record<string, Partial<Record<'kid' | 'teen', (bias?: string | null) => { name: string; desc: string }>>> = {
  'new-gaffer': {
    kid:  (bias) => ({ name: 'New Coach', desc: `The club brings in a new coach for the season — he wants to see more ${bias} out on the pitch.` }),
    teen: (bias) => ({ name: 'New Coach', desc: `The academy appoints a new coach — he's made it clear he wants more ${bias} from your game.` }),
  },
  'transfer-links': {
    kid:  () => ({ name: 'Whispers Around the Club', desc: 'Other academies are said to be watching you — exciting to hear, hard to ignore at training.' }),
    teen: () => ({ name: 'Scouts in the Stands', desc: 'Word is bigger clubs have taken notice — flattering, and a proper distraction from the football.' }),
  },
  'fan-favourite': {
    kid:  () => ({ name: 'Local Hero', desc: 'Word is getting round the local leagues about you — the other parents ask about you on the touchline.' }),
    teen: () => ({ name: 'Academy Buzz', desc: 'The younger lads in the academy look up to you now — you’re the one they all talk about.' }),
  },
  'cup-run': {
    kid:  () => ({ name: 'A Cup Run With the School Team', desc: 'A giant-killing cup run has the whole school buzzing about you.' }),
    teen: () => ({ name: 'A Cup Run With the Academy Side', desc: 'A thrilling academy cup run — scouts are starting to take notice.' }),
  },
  knock: {
    kid:  () => ({ name: 'A Sore Ankle', desc: 'A knock from an awkward tackle in Sunday league — nothing serious, but it nags.' }),
    teen: () => ({ name: 'A Niggling Knock', desc: 'A knock picked up in training — the physio says it’s nothing, but you can feel it.' }),
  },
  'serious-injury': {
    kid:  () => ({ name: 'A Scary Fall', desc: 'A bad landing in a Sunday league game — nothing broken, but you’re out for weeks, and it shakes you more than the ankle does.' }),
    teen: () => ({ name: 'A Long Lay-Off', desc: 'A bad injury in an academy match sends you for scans — months of rehab ahead, and the first time football’s ever felt like it could be taken away.' }),
  },
  breakthrough: {
    kid:  () => ({ name: 'Best Player at School', desc: 'Everything clicks this year — you’re the best player in your year group, and the coaches start giving you extra one-on-one time.' }),
    teen: () => ({ name: 'Breakout Year', desc: 'A breakout year in the academy — the staff carve out extra individual sessions just for you.' }),
  },
  'hot-streak': {
    kid:  () => ({ name: 'On Fire', desc: 'Every game this term you’re the best player on the pitch — it just clicks, and you can’t explain why.' }),
    teen: () => ({ name: 'Can’t Miss', desc: 'You can’t miss right now — every session, every match, it’s just coming off.' }),
  },
  slump: {
    kid:  () => ({ name: 'A Rough Patch', desc: 'Games just aren’t going your way lately — the bounce of the ball, a bit of confidence, gone missing.' }),
    teen: () => ({ name: 'Dip in Form', desc: 'You can feel it — the touch isn’t quite there, and it’s got into your head a bit.' }),
  },
  steady: {
    kid:  () => ({ name: 'Just Getting On With It', desc: 'A quiet year — no fireworks, just steady improvement, week after week.' }),
    teen: () => ({ name: 'Solid Progress', desc: 'Nothing flashy this year, but steady, unglamorous improvement — the kind that adds up.' }),
  },
  'international-honour': {
    kid:  () => ({ name: 'District Selection', desc: 'A letter home: you’ve been picked for the district representative side — your name read out in front of the whole school.' }),
    teen: () => ({ name: 'Youth International Honours', desc: 'Selected for the youth international set-up — a shirt with your country’s crest on it, and pride nobody in the family saw coming.' }),
  },
};
/** Which flavor tier an age band's events should read as — kids/early-teens vs everyone from Youth Team on. */
const flavorTier = (chapter: string): 'kid' | 'teen' | null =>
  chapter === 'Grassroots' ? 'kid' : chapter === 'Academy' || chapter === 'Scholar' ? 'teen' : null;

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
  /** Set by `loadCareer` when a replay could NOT apply every stored action.
   *
   *  Replay is deliberately tolerant — a card or coach that drifted since the career started degrades to a
   *  best-fit fallback rather than bricking the save. But the last resort is a `break`, and that used to be
   *  completely silent: no log, no flag, nothing any caller could read. Measured, one turn of schedule drift
   *  desynced 20 of 20 recorded careers and lost 108-115 of their 120 turns, and the player was shown a
   *  25-year-old international as a 12-year-old at Grassroots with nothing anywhere saying why.
   *
   *  Worse than the loss: `careerAct` appends each new action to the STORED list, which still holds all 120,
   *  while the replay keeps stopping at 10 — so play moves the counter by one, vanishes on reload, and
   *  `finished` is never reached, which means the prospect never graduates and THE BLOODLINE CAN NEVER
   *  ADVANCE ANOTHER GENERATION. A save that refuses to open is recoverable. That one is not. */
  replay?: { applied: number; stored: number };
  /** When set, the career is paused for a between-chapter DRAFT: pick DRAFT_PICKS of these to add. */
  pendingDraft: { options: Card[]; picksLeft: number } | null = null;
  /** When set, the career is paused to APPOINT a mentor/coach for the coming chapter. */
  pendingCoaches: Coach[] | null = null;
  coach: Coach | null = null;              // the staff member active this chapter (boosts their specialty)
  /** When set, a FINANCIAL OFFER is on the table (choose your path) before appointing a coach. */
  pendingOffer: Offer[] | null = null;
  /** When set, a STORY-ARC beat is on the table — a branching, multi-turn storyline decision that interjects
   *  between routine moments and leaves lasting marks (see storyarc.ts). Purely additive to the turn flow. */
  pendingArc: { arcId: string; beatId: string } | null = null;
  private firedArcs = new Set<string>();   // arcs already lived this career (no repeats)
  /** STATE FLAGS SET BY ARC CHOICES. `ArcEffect.tag` is documented as "a short state flag remembered on
   *  the career (opens/closes later beats)" and is written on 732 of 1,650 arc options — 44% — and was
   *  discarded on arrival, because applyArcEffect had no branch for it. `ArcChoice.requires` was marked
   *  "(reserved)" and evaluated nowhere. Both are live now, so a choice can genuinely close a door later.
   *  Safe for replay: zero arcs currently use `requires`, so nothing that exists changes behaviour until
   *  content is written against it. Consumes no rng — arc selection is a pure hash, not a draw. */
  arcTags = new Set<string>();
  /** When set, the career pauses at a chapter break for a FOCUS choice: how to spend the summer. */
  pendingFocus: FocusOption[] | null = null;
  /** The chapter whose smaller SIDE focus round is currently on offer (Breakthrough onward, once per chapter). */
  private sideFocusFor: string | null = null;
  /** lifestyle upgrades bought with career earnings (permanent perks). */
  ownedLifestyle: string[] = [];
  /** the soft skill-tree: summer training focuses picked from Youth Team on, tallied per tag — a small,
   *  deliberate lean applied on top of the card-driven development in deriveStats (see FOCUS_TAG_WEIGHT). */
  attrFocus: Partial<Record<Tag, number>> = {};
  private energyRecoveryBonus = 0;   // better living → more energy restored each summer
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
  /** Form is BOUNDED. Unclamped it was the single thing that killed late-career difficulty: it drifted from
   *  +0.024 in the opening turns to +0.384 by turn 60, which pushed `success` over the Brilliant line before
   *  nerve was even rolled — the share of turns where Brilliant was ARITHMETICALLY GUARANTEED went from 1.5%
   *  early to 82% from turn 50. Positive form is capped much tighter than negative: a purple patch should be
   *  a nudge, a slump should still be able to bite. (PT-1300) */
  private addForm(d: number) { this.formBonus = Math.max(-0.30, Math.min(0.15, this.formBonus + d)); }
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
  /** The player's family surname — narration-only, set by loadCareer from the token name so the recurring cast
   *  never collides with the bloodline's own name (PT-141). Not part of the seed/replay; unset in pure sims. */
  familyName = '';
  constructor(readonly seed: number, readonly track: Track = 'outfield', agentId?: string) {
    this.rng = mulberry32(seed);
    this.personality = rollPersonality(seed);   // innate temperament shapes how big moments / slumps play out
    this.agent = agentById(agentId);
    this.deck = [...(track === 'goalkeeper' ? GK_STARTER : STARTER_DECK)];
    this.pool = track === 'goalkeeper' ? GK_DRAFT_POOL : DRAFT_POOL;
    this.drawPile = this.shuffle([...this.deck]);
    this.refillHand();
    this.scenario = makeScenario(this.rng, this.turn, track, null, bandAt(0).band, this.exposure, this.seed);
    this.ensurePlayableHand();
  }
  private get exposure() { return this.agent?.exposure ?? 1; }

  /** The player's current age + life chapter (Grassroots … Establishing). */
  get age() { return bandAt(Math.min(this.turn, TOTAL_TURNS - 1)).age; }
  get chapter() { return bandAt(Math.min(this.turn, TOTAL_TURNS - 1)).band.name; }

  /** Persist/trade this in-progress prospect: everything needed to resume it later or elsewhere. */
  snapshot(): CareerSnapshot { return { seed: this.seed, track: this.track, agentId: this.agent?.id, actions: [...this.actions] }; }

  /** The financial/agent context graduate() needs (greed, fame, earnings, injuries, exposure). */
  finContext(): GraduateCtx {
    const attrFocus: Partial<Record<Tag, number>> = { ...this.attrFocus };
    return { seriousInjuries: this.seriousInjuries, agentGreed: this.agent?.greed ?? 0, agentExposure: this.agent?.exposure ?? 1, greedBonus: this.greedBonus, marketBonus: this.marketBonus, earnings: this.earnings, attrFocus };
  }

  /** Reconstruct a career from a snapshot by replaying its actions (deterministic → exact state). A
   *  buyer resumes development from precisely where the seller left off. */
  static resume(snap: CareerSnapshot): Career {
    const c = new Career(snap.seed, snap.track, snap.agentId);
    for (const a of snap.actions) { if (a.type === 'draft') c.draft(a.cardId, true); else if (a.type === 'coach') c.appointCoach(a.cardId, true); else if (a.type === 'offer') c.resolveOffer(a.cardId); else if (a.type === 'focus') c.chooseFocus(a.cardId, true); else if (a.type === 'lifestyle') c.buyLifestyle(a.cardId, true); else if (a.type === 'arc') c.resolveArc(a.cardId); else c.play(a.cardId, true); }
    return c;
  }

  /** Current state: a 'coach' phase (appoint staff), a 'draft' phase (add a card), or a 'play' phase. */
  current() {
    if (this.pendingArc) {
      const arc = arcByIdOf(this.pendingArc.arcId), beat = arc?.beats[this.pendingArc.beatId];
      if (arc && beat) return { phase: 'arc' as const, age: this.age, chapter: this.chapter, deck: this.deck, energy: this.energy, finished: this.finished,
        arc: { id: arc.id, title: arc.title, icon: arc.icon, category: arc.category, prompt: beat.prompt, // {RIVAL} filled in careerState (has the seeded rival name)
          // A choice gated on a flag the career never earned is not offered. Nothing filters today — zero
          // arcs carry `requires` — so this changes no existing content; it makes the gate usable.
          choices: beat.choices.filter((c) => !c.requires || this.arcTags.has(c.requires))
            .map((c) => ({ id: c.id, label: c.label, desc: c.desc })) } };
      this.pendingArc = null; // corrupt reference → drop the arc, fall through
    }
    if (this.pendingFocus) return { phase: 'focus' as const, age: this.age, chapter: this.chapter, focus: this.pendingFocus, side: this.sideFocusFor === this.chapter, lifestyle: this.lifestyleOffer, earnings: this.earnings, seasonEvent: this.seasonEvent, consequences: this.chapterConsequences, energy: this.energy, deck: this.deck, finished: this.finished };
    if (this.pendingOffer) return { phase: 'offer' as const, age: this.age, chapter: this.chapter, offers: this.pendingOffer, earnings: this.earnings, deck: this.deck, finished: this.finished };
    if (this.pendingCoaches) return { phase: 'coach' as const, age: this.age, chapter: this.chapter, coaches: this.pendingCoaches, deck: this.deck, finished: this.finished };
    if (this.pendingDraft) return { phase: 'draft' as const, age: this.age, chapter: this.chapter, options: this.pendingDraft.options, picksLeft: this.pendingDraft.picksLeft, deck: this.deck, finished: this.finished };
    return { phase: 'play' as const, turn: this.turn, age: this.age, chapter: this.chapter, scenario: this.scenario, coach: this.coach, hand: this.hand, deck: this.deck, finished: this.finished };
  }

  /** CHOOSE how to spend the summer between chapters (energy + relationships; no development effect). */
  chooseFocus(focusId: string, tolerant = false) {
    if (!this.pendingFocus) { if (tolerant) return; throw new Error('no focus pending'); } // replay across structural drift: skip a focus that no longer lands here
    let opt = this.pendingFocus.find((o) => o.id === focusId);
    if (!opt) {
      if (!tolerant) throw new Error('focus not on offer');
      opt = FOCUS_REST; // replay: the chosen focus drifted off this stage's list — a neutral rest
    }
    this.energy = clamp(this.energy + opt.energy, 0, 100);
    for (const [k, d] of Object.entries(opt.effects)) this.standing[k as MeterKey] = clamp(this.standing[k as MeterKey] + (d ?? 0), 0, 100);
    if (opt.tag) this.attrFocus[opt.tag] = (this.attrFocus[opt.tag] ?? 0) + 1; // the soft skill-tree lean
    // A proper summer off clears a lingering DIP: it lifts most of a negative form bonus and retires a
    // slump/knock banner, so a Rest & Recharge visibly resets confidence rather than carrying it over (PT-51).
    if (opt.id === 'rest' && this.formBonus < 0) {
      this.formBonus = Math.min(0, this.formBonus + 0.12);
      if (this.formBonus >= -0.01 && this.seasonEvent && ['slump', 'knock', 'transfer-links'].includes(this.seasonEvent.id)) {
        this.seasonEvent = { id: 'form-back', name: 'Back to Form', desc: 'A summer to reset — he comes back with his head clear and his confidence back.' };
      }
    }
    this.actions.push({ type: 'focus', cardId: focusId });
    this.pendingFocus = null;
    // Breakthrough onward: a second, smaller SIDE focus round follows the main pick (once per chapter).
    const sideOpts = SIDE_FOCUS_BY_CHAPTER[this.chapter];
    if (sideOpts && this.sideFocusFor !== this.chapter) {
      this.sideFocusFor = this.chapter;
      this.pendingFocus = [...sideOpts, FOCUS_SIDE_SKIP];
    } else {
      this.sideFocusFor = null;
      this.pendingOffer = rollOffer(this.seed, this.turn);
    }
  }
  /** Lifestyle upgrades UNLOCKED right now (offered at the between-chapter focus screen). Note this
   *  includes ones he cannot yet afford — see the comment on the return below; they are shown locked, not
   *  hidden. It previously said "affordable + unlocked", contradicting its own implementation two lines down.
   *  Meter-gated items only appear once the relevant standing actually earns (or costs) them — see
   *  LifestyleItem.minMeter/maxMeter: relationships gate real opportunities and real trouble, not just flavour. */
  get lifestyleOffer(): LifestyleItem[] {
    const chapterIdx = bandAt(Math.min(this.turn, TOTAL_TURNS - 1)).index;
    const meterGatesPass = (it: LifestyleItem) =>
      (!it.minMeter || Object.entries(it.minMeter).every(([k, v]) => this.standing[k as MeterKey] >= (v ?? 0))) &&
      (!it.maxMeter || Object.entries(it.maxMeter).every(([k, v]) => this.standing[k as MeterKey] <= (v ?? 100)));
    // include items he can't yet AFFORD (the client shows them locked/greyed, not hidden — #7); still gated by
    // chapter + meter so only currently-relevant options appear. buyLifestyle re-checks the cost on purchase.
    return LIFESTYLE.filter((it) => !this.ownedLifestyle.includes(it.id) && chapterIdx >= it.minChapterIdx && (it.maxChapterIdx == null || chapterIdx <= it.maxChapterIdx) && meterGatesPass(it));
  }
  /** BUY a lifestyle upgrade with career earnings — a permanent perk. Does NOT advance the phase (you can
   *  buy several at a break, then choose your summer focus). Deterministic, no rng. */
  buyLifestyle(itemId: string, tolerant = false) {
    const it = LIFESTYLE.find((i) => i.id === itemId);
    if (!it || this.ownedLifestyle.includes(itemId) || this.earnings < it.cost) { if (tolerant) return; throw new Error('cannot buy that'); }
    this.earnings -= it.cost;
    this.actions.push({ type: 'lifestyle', cardId: itemId });
    // club investment: a repeatable choice that only spends earnings here (the coins reach the club
    // server-side). No "owned" flag (so it stays available) and no personal perk — the whole point.
    if (it.clubInvest) return;
    this.ownedLifestyle.push(itemId);
    this.energyRecoveryBonus += it.recovery ?? 0;
    this.marketBonus += it.market ?? 0;
    this.greedBonus += it.greed ?? 0;
    for (const [k, d] of Object.entries(it.perks ?? {})) this.standing[k as MeterKey] = clamp(this.standing[k as MeterKey] + (d ?? 0), 0, 100);
  }

  /** Replay/robustness: an old snapshot (pre-focus) resolving an offer skips the summer neutrally. */
  private autoResolveFocus() {
    if (!this.pendingFocus) return;
    this.pendingFocus = null;
    this.pendingOffer = rollOffer(this.seed, this.turn);
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
    this.addForm(offer.form);                     // added on top of the chapter's season-event form (clamped)
    this.actions.push({ type: 'offer', cardId: offerId });
    this.pendingOffer = null;
    this.pendingCoaches = rollCoaches(this.rng, this.track);
  }
  /** Resolve the current STORY-ARC beat: apply the chosen branch's effects, advance to the next beat (or end
   *  the arc), record the choice. Returns the outcome prose ({RIVAL} still to be filled by the caller). */
  resolveArc(choiceId: string): string {
    if (!this.pendingArc) throw new Error('no arc beat pending');
    const arc = arcByIdOf(this.pendingArc.arcId), beat = arc?.beats[this.pendingArc.beatId];
    if (!arc || !beat) { this.pendingArc = null; throw new Error('arc beat missing'); }
    const choice = beat.choices.find((c) => c.id === choiceId) ?? beat.choices[0];
    this.applyArcEffect(choice.effect);
    this.actions.push({ type: 'arc', cardId: choice.id });
    if (choice.next && arc.beats[choice.next]) this.pendingArc = { arcId: arc.id, beatId: choice.next };
    else { this.firedArcs.add(arc.id); this.pendingArc = null; }
    return choice.outcome;
  }
  private applyArcEffect(e?: ArcEffect): void {
    if (!e) return;
    if (e.form) this.addForm(e.form);
    if (e.earnings) this.earnings += e.earnings;
    if (e.market) this.marketBonus += e.market;
    if (e.greed) this.greedBonus += e.greed;
    if (e.energy) this.energy = clamp(this.energy + e.energy, 0, 100);
    if (e.injury) this.seriousInjuries++;
    if (e.meters) for (const [k, v] of Object.entries(e.meters)) this.life(k as MeterKey, v ?? 0);
    if (e.attr) for (const [t, v] of Object.entries(e.attr)) this.attrFocus[t as Tag] = (this.attrFocus[t as Tag] ?? 0) + (v ?? 0);
    if (e.tag) this.arcTags.add(e.tag);
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
    if (this.pendingArc) throw new Error('resolve the story beat first');
    if (this.pendingFocus) throw new Error('choose a focus first');
    if (this.pendingOffer) throw new Error('resolve the financial offer first');
    if (this.pendingCoaches) throw new Error('appoint a coach first');
    if (this.pendingDraft) throw new Error('resolve the draft first');
    // a life-event's "how it went" line is a one-turn aftermath beat — clear the PREVIOUS one here so it can't
    // stay pinned across the following turns (it was never cleared, so it lingered until another fired) (PT-108).
    // Presentational only (no stat impact), so determinism is unaffected. This turn's event re-sets it below.
    this.lastLifeEvent = null;
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
    // variance = nerves. Kept modest at low stakes so SKILL (fit) dominates the outcome — a strong fit should
    // reliably read well — while big games still swing more. (Was 0.3 base, which drowned out good play.)
    // Nerve has to be able to actually bite: at 0.18 the maximum downswing was 0.09 against the 0.22 needed to
    // drop a right card below Brilliant, so ordinary turns had no downside at all. (PT-700)
    const variance = (0.26 + 0.16 * (this.scenario.stakes - 1)) * this.personality.variance;
    const bigGame = this.scenario.stakes >= 2 ? this.personality.bigGame : 0;
    const form = this.formBonus < 0 ? this.formBonus * this.personality.resilience : this.formBonus;
    // your coach lifts success when you play to their specialty (good coaching → that development compounds)
    // COACHING helps where coaching helps: on the moments he is NOT already answering perfectly. As a flat
    // bonus it was a free +0.06 the deck learned to farm — drafting into one identity pushed the
    // specialty-match rate from 0% to 57% over a career, so the bonus quietly grew exactly when the player
    // needed it least, and stacked on top of a card that was already a full-fit answer. Scaling it by the
    // REMAINING headroom keeps a good coach worth appointing without letting a specialised deck mine him.
    // (PT-1303)
    const coachHit = this.coach && card.tags.some((t) => this.coach!.specialty.includes(t));
    const coaching = coachHit ? this.coach!.bonus * (1 - Math.min(1, f)) * 2 : 0;
    // FATIGUE: running on empty saps a moment (below 35 energy it bites, up to −0.12 at flat 0). Makes
    // Rest and the energy-giving focus choices a real trade-off against a busy, big-moment-heavy chapter.
    const fatigue = this.energy < 35 ? ((35 - this.energy) / 35) * 0.12 : 0;
    // CARD QUALITY matters, not just the tag match. `fit` saturates at 1.0 for ANY card carrying the
    // demanded tag, so success was `1.0 + noise` and a right card was a near-guaranteed Brilliant: measured
    // 90% Solid+, 48% Brilliant and 1% Poor across 400 skilled careers. There was no decision in the turn —
    // find the tag, play it, win. Card rarity already drove which STATS grew but was ignored by the outcome,
    // so a common and an epic card played identically. Now a common card played into its demand reads Solid
    // and Brilliant has to be earned, which makes holding an epic for a big moment a real choice. (PT-700/151/1407)
    // Raised from 0.10 with the PT-158 energy fix: a permanent fatigue penalty of up to -0.12 had been
    // silently doing much of the difficulty work, and removing it lifted Solid+ from 71% to 85%. Difficulty
    // now comes from the intended lever rather than from the player being exhausted for 77% of his career.
    // A multiplier compounded badly: top demand is normalised to 0.78, so scaling THAT by 0.72 put a
    // well-played common card at 0.56 — on the Solid line. A flat penalty keeps the scale and still
    // separates the tiers: common 0.68, rare 0.73, epic 0.78 before nerves.
    const quality = (cardPower(card) - 1) / 2;                  // common 0 · rare 0.5 · epic 1
    const base = f - 0.15 * (1 - quality);
    let success = clamp(base + (this.rng() - 0.5) * variance + form + bigGame + coaching - fatigue, 0, 1);
    // THE DEBUT IS NOT A DICE ROLL. Measured across 25 fresh new games playing the best-fitting card every
    // time, the very first move of the game returned an IDENTICAL success of 0.5949 in 24 of them — five
    // thousandths under the 0.60 "Solid" line — so a new player's first act was to read the moment
    // correctly and be told "🎯 Right card · ◦ Unlucky". That is the first thing almost every player who
    // ever buys this game will see, and it teaches exactly the wrong lesson: that doing the right thing
    // does not work. The opening move now rewards a correct read. It is one turn out of a hundred and
    // twenty, it only applies when the card genuinely fits, and everything after it is as hard as before.
    if (this.turn === 0 && matchedAskEarly(card, this.scenario.demand) && f >= bestFit * 0.9) {
      success = Math.max(success, 0.72);
    }
    // did the played card carry ANY tag the moment actually called for (primary OR secondary)? — so a
    // called-for-but-secondary tag is never branded "wrong", only partial (PT-44)
    const matchedAsk = card.tags.some((t) => (this.scenario.demand[t] ?? 0) > 0);
    const choice: Choice = { cardId: card.id, tags: card.tags, power: cardPower(card), fit: f, bestFit, success, scenario: this.scenario.label, stakes: this.scenario.stakes, matchedAsk };
    this.log.push(choice);
    // FORM is momentum, not a chapter-long stamp: a slump LIFTS as he strings good games together, and a
    // purple patch cools if results dip — so "Loss of Form" no longer brands every scenario for ~40 turns
    // regardless of how he plays. Once a negative event's form has recovered, retire its banner. (PT-14)
    if (this.formBonus < 0 && success >= 0.55) {
      // recover faster so sustained good play VISIBLY lifts a dip within a few turns — at +0.03 a -0.12 slump
      // dragged its "Low on confidence" banner across ~an in-game year of brilliant turns (PT-51). +0.06 clears
      // a typical dip in ~2-3 strong games; a standout (Brilliant, ≥0.78) lifts it faster still.
      this.formBonus = Math.min(0, this.formBonus + (success >= 0.78 ? 0.09 : 0.06));
      if (this.formBonus >= -0.01 && this.seasonEvent && ['slump', 'knock', 'transfer-links', 'serious-injury'].includes(this.seasonEvent.id)) {
        this.seasonEvent = { id: 'form-back', name: 'Back to Form', desc: 'He’s battled through the dip — confidence restored.' };
      }
    } else if (this.formBonus > 0) {
      // cool by 15% EVERY turn (was: only when success < 0.45, which fired on 0.2-0.8% of skilled turns, so a
      // purple patch effectively never ended and simply accumulated all career). A run of good results still
      // outruns the decay; a quiet spell now genuinely gives the edge back. (PT-1300)
      this.formBonus = Math.max(0, this.formBonus * 0.85 - (success < 0.45 ? 0.03 : 0));
    }
    this.updateLife(choice); // NSS meters + energy react to how the moment went (deterministic, no rng)
    if (this.scenario.life) this.applyLifeConsequence(this.scenario.life, success, card.tags); // the life-event's OWN, distinct payoff
    if (this.scenario.rival) this.applyRivalConsequence(success); // bragging rights are worth more than the occasion alone
    if (this.scenario.callup) this.applyCallupConsequence(success); // thrown in cold — a bigger swing than a routine big game
    this.discard.push(card);
    this.turn++;
    if (this.turn >= TOTAL_TURNS) { this.finished = true; return choice; }
    // at an age-chapter boundary: relationships pay off (or bite), a narrative EVENT fires, then you
    // choose a summer FOCUS, take a financial offer, appoint a coach and draft.
    if (BAND_ENDS.includes(this.turn)) { this.advanceSeasonEvent(); this.earnings += 40 + this.turn * 20; this.pendingFocus = rollFocus(this.chapter, this.standing, this.track, !!this.agent); }
    else {
      this.refillHand(); this.scenario = makeScenario(this.rng, this.turn, this.track, this.demandBias, bandAt(this.turn).band, this.exposure, this.seed); this.ensurePlayableHand();
      // STORY ARC: a branching storyline may interject before the next routine moment (deterministic, no rng
      // draw — so it never perturbs the scenario/draw stream). The arc's beats then play out before this scenario.
      if (!this.pendingArc) { const arcId = pickArcStart(this.seed, this.turn, this.firedArcs, TOTAL_TURNS); if (arcId) { const a = arcByIdOf(arcId); if (a) this.pendingArc = { arcId, beatId: a.first }; } }
    }
    return choice;
  }

  /** How the LAST life event resolved — surfaced for narration (a distinct "how it went" beat). `approach`
   *  is only ever set for injury_comeback (see below) — 'rush' vs 'patient' graded return. */
  lastLifeEvent: { kind: LifeKind; success: number; good: boolean; approach?: 'rush' | 'patient' } | null = null;
  /** A life event's OWN distinct payoff — on top of the generic updateLife() reaction — so a contract
   *  standoff and a family illness leave genuinely different marks on the same 'good outcome'.
   *
   *  INJURY COMEBACK (docs/research-player-career.md §5 — "fear of reinjury" as the dominant late-stage
   *  psychological barrier): which CARD he leans on decides his approach. An aggression/stamina-led card
   *  reads as "rush back" — greater reward if it comes off, a real reinjury-risk cost (energy + authority)
   *  if it doesn't. Anything else reads as the safe, documented "patient graded return" — no extra upside,
   *  but no extra risk either. */
  private applyLifeConsequence(kind: LifeKind, success: number, cardTags?: Tag[]) {
    const good = success >= 0.55;
    const cq = LIFE_CONSEQUENCE[kind];
    const eff = good ? cq.good : cq.bad;
    for (const [k, d] of Object.entries(eff)) this.life(k as MeterKey, d ?? 0);
    const earn = good ? (cq.earnGood ?? 0) : (cq.earnBad ?? 0);
    if (earn) this.earnings += earn;
    let approach: 'rush' | 'patient' | undefined;
    if (kind === 'injury_comeback' && cardTags) {
      const rushed = cardTags.some((t) => t === 'aggression' || t === 'stamina');
      approach = rushed ? 'rush' : 'patient';
      if (rushed) {
        if (good) this.earnings += 40; // came back hard and it held — worth more than the safe route
        else { this.energy = clamp(this.energy - 10, 0, 100); this.life('authority', -3); } // reinjury-risk cost
      }
    }
    this.lastLifeEvent = { kind, success, good, approach };
  }

  /** How the LAST rivalry moment resolved — surfaced for narration (overtake/fall-behind payoff). */
  lastRivalMoment: { success: number; good: boolean } | null = null;
  /** A head-to-head vs the rival carries a bigger swing than a routine big-game moment — bragging rights. */
  private applyRivalConsequence(success: number) {
    const good = success >= 0.55;
    const eff = good ? RIVAL_CONSEQUENCE.good : RIVAL_CONSEQUENCE.bad;
    for (const [k, d] of Object.entries(eff)) this.life(k as MeterKey, d ?? 0);
    if (good && RIVAL_CONSEQUENCE.earnGood) this.earnings += RIVAL_CONSEQUENCE.earnGood;
    this.lastRivalMoment = { success, good };
  }

  /** How the LAST shock call-up resolved — surfaced for narration. */
  lastCallupMoment: { success: number; good: boolean } | null = null;
  /** Thrown in cold for a first-teamer — a bigger swing, good or bad, than a routine big-game moment. */
  private applyCallupConsequence(success: number) {
    const good = success >= 0.55;
    const eff = good ? CALLUP_CONSEQUENCE.good : CALLUP_CONSEQUENCE.bad;
    for (const [k, d] of Object.entries(eff)) this.life(k as MeterKey, d ?? 0);
    if (good && CALLUP_CONSEQUENCE.earnGood) this.earnings += CALLUP_CONSEQUENCE.earnGood;
    this.lastCallupMoment = { success, good };
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
    this.energy = clamp(this.energy - (choice.stakes >= 3 ? 7 : big ? 5 : 3), 0, 100); // bigger moments drain more — energy is a running resource across the chapter (eased with the summer-restore fix, PT-158)
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
    // A SUMMER HAS TO ROUGHLY OFFSET A SEASON. A chapter is ~17 turns draining 4-8 each, so ~75-95 a
    // chapter — against a flat +34 restore, which meant energy fell off a cliff and never came back:
    // measured, it hit ZERO by turn 40 and stayed there for the remaining 80 turns, with 77% of a career
    // spent under the TIRED line carrying a permanent success penalty and no lever to fix it. Restoring to
    // a FLOOR keeps energy a real within-chapter resource (you still end a hard season on fumes) without
    // letting the career fall into a hole it can never climb out of. (PT-158)
    const restored = this.energy + 34 + this.energyRecoveryBonus + conseq.energy;
    this.energy = clamp(Math.max(restored, 85 + this.energyRecoveryBonus), 0, 100);
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
      // a LOSS OF FORM only befalls a player who was NOT flying — you don't suddenly slump off the back of a
      // brilliant chapter (PT-51). Played the last chapter well? this rolls a steady season instead of a dip.
      else if (r < 0.72) { if (playedWell) { this.seasonEvent = { id: 'steady', name: 'Steady Progress', desc: 'A solid, unremarkable season of graft.' }; } else { form = -0.12; this.seasonEvent = { id: 'slump', name: 'Loss of Form', desc: 'A dip in confidence to battle through.' }; } }
      else if (r < 0.80) { form = -0.05; this.seasonEvent = { id: 'transfer-links', name: 'Transfer Speculation', desc: 'His name is in the papers — a distraction he could do without.' }; }
      else if (r < 0.88) { form = -0.06; this.seasonEvent = { id: 'knock', name: 'Niggling Injury', desc: 'A knock to manage — not quite at your sharpest.' }; }
      else if (r < 0.94) { form = 0.06; this.seasonEvent = { id: 'fan-favourite', name: 'Fan Favourite', desc: 'The supporters have taken to him — he feeds off their energy.' }; }
      // a rarer, distinct-feeling honour carved out of the old catch-all: national pride rather than
      // local love (fan-favourite) or a breakout campaign (breakthrough). NOTE: named 'international-honour',
      // NOT 'call-up' — that word is already taken by the unrelated "shock call-up" scenario mechanic
      // (career.ts Scenario.callup / narrate.ts CALLUP_SETUP) which means being thrown into a first-team
      // match at short notice. This is full senior/youth international selection — a different feeling.
      else if (r < 0.97) { form = 0.05; this.seasonEvent = { id: 'international-honour', name: 'International Recognition', desc: 'Full international honours — a shirt with his country’s crest on it, pride nobody in the family saw coming.' }; }
      else { this.seasonEvent = { id: 'steady', name: 'Steady Progress', desc: 'A solid, unremarkable season of graft.' }; }
    }
    // reword for the stage it lands in (pure narration — the id, and every mechanical effect above, is untouched)
    const tier = flavorTier(this.chapter);
    const flavor = tier && this.seasonEvent ? EVENT_FLAVOR[this.seasonEvent.id]?.[tier] : undefined;
    if (flavor && this.seasonEvent) this.seasonEvent = { ...this.seasonEvent, ...flavor(this.demandBias) };
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
    this.scenario = makeScenario(this.rng, this.turn, this.track, this.demandBias, bandAt(this.turn).band, this.exposure, this.seed);
    this.ensurePlayableHand();
  }

  private refillHand() { while (this.hand.length < HAND_SIZE) this.hand.push(this.drawOne()); }
  /** After a scenario is set, make sure the hand holds at least ONE fair-fit option for it — if a better
   *  card exists anywhere in the deck (draw pile or discard), swap it in for the hand's worst card. This
   *  removes "dead" hands caused purely by draw luck; a genuinely unanswerable hand now only happens when
   *  the DECK itself can't address the moment (a deck-building signal, not random punishment). */
  private ensurePlayableHand(): void {
    const FAIR = 0.45;
    const fitOf = (c: Card) => fit(c, this.scenario);
    if (this.hand.length === 0 || Math.max(...this.hand.map(fitOf)) >= FAIR) return;
    let bestFit = Math.max(...this.hand.map(fitOf), 0), pick: { pool: Card[]; i: number } | null = null;
    for (const pool of [this.drawPile, this.discard]) {
      for (let i = 0; i < pool.length; i++) { const f = fitOf(pool[i]); if (f > bestFit) { bestFit = f; pick = { pool, i }; } }
    }
    if (!pick) return; // nowhere in the deck fits — leave it (the deck can't answer this moment)
    const worst = this.hand.reduce((w, c, i, arr) => (fitOf(c) < fitOf(arr[w]) ? i : w), 0);
    const incoming = pick.pool.splice(pick.i, 1)[0];
    this.discard.push(this.hand[worst]); // the displaced card returns to the rotation
    this.hand[worst] = incoming;
  }
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
export interface GraduateCtx { seriousInjuries?: number; agentGreed?: number; agentExposure?: number; greedBonus?: number; marketBonus?: number; earnings?: number; legacyBonus?: Partial<Record<keyof CareerPlayerAttrs, number>>; attrFocus?: Partial<Record<Tag, number>> }

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
  { id: 'stoic',     name: 'The Stoic',          desc: 'Utterly unreadable, utterly unbothered',    variance: 0.5,  bigGame: 0.05, resilience: 0.25 },
  { id: 'hothead',   name: 'Hothead',            desc: 'Wears his heart, and his temper, on his sleeve', variance: 1.3, bigGame: -0.05, resilience: 1.4, signature: 'aggression' },
  { id: 'perfectionist', name: 'Perfectionist',  desc: 'Never satisfied, always sharpening the edges', variance: 0.8, bigGame: 0.04, resilience: 0.5, signature: 'positioning' },
  { id: 'joker',     name: 'Dressing-Room Joker', desc: 'Lightens the mood, occasionally at his own expense', variance: 1.15, bigGame: 0.03, resilience: 0.7, signature: 'teamwork' },
];
const PERSONALITY_WEIGHTS = [5, 2, 2, 2, 3, 2, 1, 2, 1, 2, 2, 2, 2]; // Model Pro most common; Maverick/Showman rarest
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

// how much one summer's attribute-focus pick (see rollFocus) leans a tag's frequency — deliberately small:
// comparable to one strong (epic, stakes-3) card play, so a handful of picks across a career nudges shape
// without overriding the card-driven "earned, not chosen" development.
const FOCUS_TAG_WEIGHT = 6;

export function deriveStats(log: Choice[], seed: number, genes: Genes = rollGenes(seed), attrFocus?: Partial<Record<Tag, number>>): CareerPlayerAttrs {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const innate = new Set<keyof CareerPlayerAttrs>(INNATE);
  const freq = Object.fromEntries(TAGS.map((t) => [t, 0])) as Record<Tag, number>;
  // weight by card power AND stakes: a great play in a cup final shapes you more than a training drill
  for (const c of log) for (const t of c.tags) freq[t] += c.power * c.stakes;
  if (attrFocus) for (const t of TAGS) freq[t] += (attrFocus[t] ?? 0) * FOCUS_TAG_WEIGHT; // the soft skill-tree lean
  const maxFreq = Math.max(1, ...TAGS.map((t) => freq[t]));
  const norm = Object.fromEntries(TAGS.map((t) => [t, freq[t] / maxFreq])) as Record<Tag, number>;
  // MAGNITUDE = how well you actually played (avg success across the career). With a capped flywheel
  // this spreads by skill: a player who plays high-fit cards banks more success → higher stats.
  const avgSuccess = log.reduce((s, c) => s + c.success, 0) / Math.max(1, log.length);
  const magnitude = 0.5 + 0.7 * avgSuccess; // ~0.5x (played poorly) .. ~1.2x (played superbly)

  const out = {} as CareerPlayerAttrs;
  for (const stat of Object.keys(STAT_SOURCES) as (keyof typeof STAT_SOURCES)[]) {
    const src = STAT_SOURCES[stat];
    // SHAPE CANNOT GO NEGATIVE. `freq` accumulates card power x stakes AND the focus lean
    // (attrFocus[t] * FOCUS_TAG_WEIGHT), and neither term is sign-guarded — a negative contribution drives
    // freq[t] below zero, and maxFreq's `Math.max(1, ...)` floor only guards the DIVISOR, not the numerator.
    // A negative shape then hits `Math.pow(shape, 1.5)`, and a negative base with a fractional exponent is
    // NaN. That NaN lands straight in a graduated player's attrs, and NaN attrs are the exact input the
    // match engine warns about (norm(NaN) -> NaN fitness -> NaN positions -> invisible players).
    // Measured on goalkeeper careers: stamina and durability both NaN.
    // Clamping at 0 is a no-op for every well-formed career, so existing careers are unchanged.
    const shape = Math.max(0, src.length ? src.reduce((s, t) => s + norm[t], 0) / src.length : 0);
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
export interface Trait { id: string; roles?: Role[]; name: string; desc: string; eligible: (a: CareerPlayerAttrs, log: Choice[]) => boolean; apply?: (a: CareerPlayerAttrs) => void }
// CUT 2026-09-01 — `utility` ("can play almost anywhere and do a job") and `showstopper` ("the player
// fans pay to watch"). Both were inert, and unlike the other seven they had nowhere to land:
//   - utility described relief from an out-of-position penalty that does not exist. `buildXI` reassigns
//     only the anchor and keeps every player's own role; nothing anywhere punishes a mis-slotted man. The
//     trait could not be given an effect, only a penalty invented for it to remove.
//   - showstopper's natural hook is `squadMarketability` -> `sponsorIncome`, and that chain is BROKEN
//     upstream: no mint path sets `marketability` on a squad player and the bloodline star is not in
//     `club.players`, so `squadMarketability` returns exactly 10 for every club forever and `brandMult`
//     is pinned at 1.0. Wiring the trait would have hooked it to a dead number. Repair that chain first
//     and showstopper is the obvious trait to hang off it.
// The client keeps display names for both (main.ts's TRAIT map is deliberately a superset of this
// catalogue) so a save that already carries one still renders it properly instead of a raw slug.
export const TRAITS: Trait[] = [
  { id: 'clinical', roles: ['FW'],  name: 'Clinical Finisher',    desc: 'Ice-cold in front of goal',        eligible: (a) => a.shooting >= 15 && a.composure >= 14, apply: (a) => { a.shooting = clamp(a.shooting + 1, 1, 20); } },
  { id: 'ballwinner', roles: ['DF', 'MF'], name: 'Ball-Winner',         desc: 'Wins it back relentlessly',        eligible: (a) => a.tackling >= 15 && a.aggression >= 13, apply: (a) => { a.tackling = clamp(a.tackling + 1, 1, 20); } },
  { id: 'metronome', roles: ['MF', 'DF'], name: 'Metronome',            desc: 'Never misplaces a pass',           eligible: (a) => a.passing >= 15 && a.teamwork >= 13 },
  { id: 'maestro', roles: ['MF', 'FW'],   name: 'Creative Maestro',     desc: 'Unlocks the tightest defences',    eligible: (a) => a.creativity >= 16 },
  { id: 'leader',    name: 'Born Leader',          desc: 'Lifts the whole team',             eligible: (a) => a.leadership >= 15 },
  { id: 'livewire', roles: ['FW', 'MF'],  name: 'Livewire',             desc: 'Blistering, frightening pace',     eligible: (a) => a.pace >= 16 },
  { id: 'ironman',   name: 'Iron Man',             desc: 'Runs all day, every day',          eligible: (a) => a.stamina >= 15 && a.strength >= 13 },
  { id: 'deadball',  name: 'Dead-Ball Specialist', desc: 'Lethal from set pieces',           eligible: (a) => a.setPiece >= 15, apply: (a) => { a.setPiece = clamp(a.setPiece + 1, 1, 20); } },
  { id: 'wall', roles: ['GK'],      name: 'The Wall',             desc: 'Unbeatable between the sticks',     eligible: (a) => a.keeping >= 16 },
  { id: 'biggame',   name: 'Big-Game Player',      desc: 'Turns up when it matters most',    eligible: (_a, log) => log.filter((c) => c.stakes >= 2 && c.success >= 0.75).length >= 5 },
  { id: 'engine', roles: ['MF'],    name: 'Box-to-Box Engine',    desc: 'Covers every blade of grass',      eligible: (a) => a.stamina >= 14 && a.teamwork >= 14, apply: (a) => { a.stamina = clamp(a.stamina + 1, 1, 20); } },
  { id: 'rock', roles: ['DF'],      name: 'Defensive Rock',       desc: 'Immovable at the back',            eligible: (a) => a.tackling >= 14 && a.strength >= 14, apply: (a) => { a.strength = clamp(a.strength + 1, 1, 20); } },
  { id: 'spark', roles: ['MF', 'FW'],     name: 'The Spark',            desc: 'Makes something from nothing',     eligible: (a) => a.creativity >= 14 && a.pace >= 14 },
  { id: 'aerial', roles: ['DF', 'FW'],    name: 'Aerial Threat',        desc: 'Wins everything in the air',       eligible: (a) => a.strength >= 14 && a.pace <= 10, apply: (a) => { a.strength = clamp(a.strength + 1, 1, 20); } },
  { id: 'general2', roles: ['MF'],  name: 'Engine-Room General',  desc: 'Drags the team through matches by will alone', eligible: (a) => a.stamina >= 14 && a.leadership >= 13 },
  { id: 'ironwill',  name: 'Iron Will',            desc: 'Never seems to get injured',       eligible: (a) => a.durability >= 16 },
  { id: 'quarterback', roles: ['MF', 'DF'], name: 'The Quarterback',    desc: 'Picks locks from forty yards with a single pass', eligible: (a) => a.passing >= 16, apply: (a) => { a.passing = clamp(a.passing + 1, 1, 20); } },
];

/** Which traits a finished career qualifies for (before the player locks any in).
 *
 *  ROLE AFFINITY FIRST, then catalogue order. Both callers take `.slice(0, MAX_TRAITS)` off the front of
 *  this list, so whatever sits earliest in TRAITS won — and the catalogue is ordered by nothing in
 *  particular. `wall` is ninth, behind `metronome` (passing) and `leader` (leadership), which a good
 *  keeper also qualifies for. Measured over 4,200 generated keepers: 71.3% were ELIGIBLE for The Wall and
 *  only 59.9% of those got it — and the effect INVERTED with quality, because a better keeper qualifies
 *  for more of the traits ahead of it. Elite keepers (quality >= 15) held it just 21.7% of the time: the
 *  better the goalkeeper, the less likely he was to have the goalkeeping trait. The match engine reads
 *  `hasTrait(gk, 'wall')` directly, so this was a live effect on saves, not a cosmetic card detail.
 *
 *  Sorting is STABLE and role-matching traits merely move ahead of role-neutral ones, so a player's
 *  eligibility is unchanged and untagged traits (leader, ironman, deadball, biggame, ironwill, utility)
 *  keep their relative order. Passing no role reproduces the old ordering exactly. */
export function eligibleTraits(attrs: CareerPlayerAttrs, log: Choice[], role?: Role): Trait[] {
  const eligible = TRAITS.filter((t) => t.eligible(attrs, log));
  if (!role) return eligible;
  // PRIMARY role beats SECONDARY beats untagged. A flat includes() test was not enough: `ballwinner`
  // (['DF','MF']) and `metronome` (['MF','DF']) are both DF-tagged and both sit earlier than `rock`
  // (['DF']), so a defender still took the first two and lost his own signature trait 49.7% of the time,
  // rising to 73% for elite defenders. Ordering `roles` puts a trait's home role first, so a trait that
  // is mainly a midfield one ranks below a defender's own.
  const fit = (t: Trait) => (t.roles?.[0] === role ? 0 : t.roles?.includes(role) ? 1 : 2);
  return eligible
    .map((t, i) => ({ t, i, f: fit(t) }))
    .sort((a, b) => a.f - b.f || a.i - b.i)
    .map((x) => x.t);
}

/** Finish a career log into a complete Player (attrs + role + overall + traits). Genes default to a
 *  fresh genesis roll; pass inherited genes (lineage). `pickTraits` chooses among the eligible traits
 *  (the client lets a human pick; defaults to the first MAX_TRAITS for the sim). */
export function graduate(log: Choice[], seed: number, genes: Genes = rollGenes(seed), pickTraits?: (eligible: Trait[]) => Trait[], ctx: GraduateCtx = {}): CareerPlayer {
  const { seriousInjuries = 0, agentGreed = 0, agentExposure = 1, greedBonus = 0, marketBonus = 0, earnings = 0, legacyBonus, attrFocus } = ctx;
  const attrs = deriveStats(log, seed, genes, attrFocus);
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
  const eligible = eligibleTraits(attrs, log, deriveRole(attrs)); // role-relevant traits first (see eligibleTraits)
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
// AGE CURVE — REMOVED 2026-09-01. A read-time `ageCurve(prime, age)` used to live here, projecting a
// player's stats from an immutable age-25 prime: physical falling, wisdom rising into the 30s. It had no
// production caller in its life; its one consumer was `career_sim.ts`'s printout, inside `npm run verify`,
// so every gate run advertised an arc the shipped game never applied.
//
// Removed rather than wired, on CK's call: a player's temperament is career-forged and does not drift with
// age. The manager phase ages the physical/technical stats through `developAttrs` (lifecycle.ts) and
// `ageSquadAttrs` (transfermarket.ts), and the mental layer stays as the career made it.
//
// It could not have been wired as written in any case: the signature projects from a PRIME the manager
// phase does not keep — `api.ts` overwrites `attrs_json` with the developed attrs every rollover — so
// applied per season it compounds, pinning composure and leadership at 20 by the mid-30s and flooring
// pace at 1. Anything reviving this idea needs a bounded per-season delta, not a projection.

// ── PROSPECT VALUATION (the market for in-development players) ──
// A half-developed prospect is priced on: current ability, how much upside remains (age → turns left),
// and its physical gene ceiling (the scarce, un-grindable part). Deterministic + verifiable.
export interface ProspectValue { age: number; chapter: string; role: Role; currentOverall: number; potential: number; physicalCeiling: number; stars: number }
export function prospectValuation(c: Career, genes: Genes): ProspectValue {
  const partial = deriveStats(c.log, c.seed, genes, c.attrFocus); // stats so far (deterministic)
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
    if (st.phase === 'arc') { career.resolveArc((st as any).arc.choices[Math.floor(rng() * (st as any).arc.choices.length)].id); continue; } // a story-arc beat — pick a branch (style-neutral here)
    if (st.phase === 'focus') {
      // summer focus: an identity-matching attribute-focus pick (the soft skill-tree) beats a relationship
      // top-up beats a plain rest — a style-consistent career leans into its own strengths when it can.
      const tagPick = [...st.focus].filter((f) => f.tag && (style.pref[f.tag] ?? 0) > 0).sort((a, b) => (style.pref[b.tag!] ?? 0) - (style.pref[a.tag!] ?? 0))[0];
      const lowest = [...career.meters].sort((a, b) => a.value - b.value)[0];
      const pick = tagPick ?? st.focus.find((f) => lowest && f.effects[lowest.key as MeterKey] != null && f.effects[lowest.key as MeterKey]! > 0) ?? st.focus[st.focus.length - 1];
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
