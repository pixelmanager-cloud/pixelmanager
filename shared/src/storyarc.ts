// ── STORY ARCS: multi-turn, branching, consequential storylines that make each career unique ─────────
// A career threads a DIFFERENT subset of these (seeded probability + trigger conditions), each unfolds over
// a few turns, branches on the player's choices, and leaves lasting marks (stats, meters, fame, earnings,
// form) — so no two playthroughs feel the same. Deterministic: arc selection + progression are pure
// functions of (seed, turn, prior choices), so the Career's snapshot-replay stays byte-identical.
import type { Tag } from './career.js';

/** What a chosen branch does to the player — every field optional; applied on top of normal development. */
export interface ArcEffect {
  energy?: number; form?: number; earnings?: number; market?: number; greed?: number;
  meters?: Partial<Record<string, number>>;      // relationship nudges (authority/family/peers/fans/…)
  attr?: Partial<Record<Tag, number>>;            // a small, permanent development lean
  injury?: boolean;                               // marks a serious injury (lasting fragility)
  tag?: string;                                   // a short state flag remembered on the career (opens/closes later beats)
}
export interface ArcChoice {
  id: string; label: string; desc: string;
  outcome: string;                                // the resolution prose shown after picking
  effect?: ArcEffect;
  next?: string | null;                           // next beat id (branch), or null/undefined = the arc ends here
  requires?: string;                              // only offered if this state flag was set earlier in the arc
}
export interface ArcBeat { id: string; prompt: string; choices: ArcChoice[] }
export interface StoryArc {
  id: string; title: string; icon: string;
  category: 'saga' | 'crisis' | 'triumph' | 'relationship' | 'signature';
  minTurn: number; maxTurn: number;               // when it may start (turn = career age progression)
  weight: number;                                 // relative likelihood among eligible arcs
  rare?: boolean;                                 // a low-probability "signature" one-off
  first: string;                                  // the opening beat id
  beats: Record<string, ArcBeat>;
}

// ── the arc library (vertical slice — expands over time) ─────────────────────────────────────────────
// {RIVAL} is substituted with the career's seeded academy nemesis so the story feels personal + recurring.
export const ARCS: StoryArc[] = [
  {
    id: 'transfer-saga', title: 'The Big Move', icon: '✈️', category: 'saga',
    minTurn: 90, maxTurn: 175, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A giant of the game has come calling — a life-changing move, but it means leaving the club that made him. The agent wants an answer. How does he play it?',
        choices: [
          { id: 'push', label: 'Force the move', desc: 'Hand in a transfer request — burn the bridge, chase the dream', outcome: 'He tells the club he wants out. The fans turn; the move edges closer.', effect: { market: 3, greed: 2, meters: { fans: -18, authority: -8 }, tag: 'pushed' }, next: 'pushed' },
          { id: 'loyal', label: 'Stay loyal', desc: 'Publicly commit to the club — turn the giants down', outcome: 'He kisses the badge and stays. The terraces roar his name.', effect: { form: 0.06, meters: { fans: 16, authority: 6 }, attr: { leadership: 1 }, tag: 'stayed' }, next: 'stayed' },
          { id: 'leverage', label: 'Use it for leverage', desc: 'Let it drag on — angle for a bumper new deal to stay', outcome: 'The saga rumbles on. The club, twitchy, tables a huge renewal to keep him.', effect: { earnings: 700, greed: 1, market: 2, meters: { fans: -4 }, tag: 'leveraged' }, next: 'leveraged' },
        ],
      },
      pushed: {
        id: 'pushed',
        prompt: 'Deadline day. The move is there to be done — but the fee has stalled and the window is closing. Nerve, or cold feet?',
        choices: [
          { id: 'seal', label: 'Force it through', desc: 'Down tools until it’s signed', outcome: 'It gets done in the final hour. A new giant, a new pressure, a fortune banked.', effect: { earnings: 1200, market: 3, form: -0.08, meters: { fans: -6 } } },
          { id: 'collapse', label: 'Let it collapse', desc: 'Refuse the drama — stay put after all', outcome: 'The deal dies at midnight. He’s stuck at a club whose fans now doubt him.', effect: { form: -0.1, meters: { fans: -10, authority: -6 } } },
        ],
      },
      stayed: {
        id: 'stayed',
        prompt: 'Word of his loyalty spreads. The manager offers him a bigger role as the heartbeat of the side. Does he take the weight?',
        choices: [
          { id: 'accept', label: 'Embrace it', desc: 'Become the club’s talisman', outcome: 'He carries the team on his back — and grows into a leader for it.', effect: { attr: { leadership: 2, composure: 1 }, meters: { authority: 8 }, form: 0.05 } },
          { id: 'quiet', label: 'Keep his head down', desc: 'Let his football do the talking', outcome: 'No fuss, just performances — the fans adore the humility.', effect: { meters: { fans: 8 }, form: 0.04 } },
        ],
      },
      leveraged: {
        id: 'leveraged',
        prompt: 'The new deal is signed — richer, but some in the dressing room feel he held the club to ransom. Mend it, or let it lie?',
        choices: [
          { id: 'mend', label: 'Win the room back', desc: 'Graft, buy the lunches, lead by example', outcome: 'He earns it back the hard way — respect restored.', effect: { meters: { peers: 10, authority: 4 }, attr: { teamwork: 1 } } },
          { id: 'shrug', label: 'It’s just business', desc: 'Let the money talk', outcome: 'He shrugs it off. The wage packet grows; a little warmth is lost.', effect: { greed: 1, meters: { peers: -6 } } },
        ],
      },
    },
  },
  {
    id: 'injury-comeback', title: 'The Long Road Back', icon: '🩹', category: 'crisis',
    minTurn: 70, maxTurn: 180, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A sickening challenge from {RIVAL}, a twist, a silence in the stadium. The scan confirms the worst — months on the sidelines. How does he face the rehab?',
        choices: [
          { id: 'grind', label: 'Attack the rehab', desc: 'First in, last out — obsess over every session', outcome: 'He throws himself at it, driven by the memory of {RIVAL}’s tackle.', effect: { energy: -10, attr: { stamina: 2 }, meters: { authority: 6 }, tag: 'grinder' }, next: 'return' },
          { id: 'patient', label: 'Trust the process', desc: 'Do exactly what the medics say, no more', outcome: 'He resists the urge to rush, and lets the body heal properly.', effect: { attr: { composure: 1 }, tag: 'patient' }, next: 'return' },
          { id: 'dark', label: 'Struggle with it', desc: 'The dark days come — doubt, frustration, isolation', outcome: 'The mind is harder than the knee. Some nights he wonders if he’ll be the same.', effect: { form: -0.08, meters: { partner: -6, family: 6 }, tag: 'shaken' }, next: 'return' },
        ],
      },
      return: {
        id: 'return',
        prompt: 'Comeback day, off the bench, the crowd on its feet. The first fifty-fifty is his to win — and {RIVAL} is the man in front of him. Does he go in?',
        choices: [
          { id: 'brave', label: 'Fly into it', desc: 'Show the knee — and himself — there’s no fear left', outcome: 'He wins it clean, and the ground erupts. The demons are buried. He is back.', effect: { form: 0.1, attr: { aggression: 1, composure: 1 }, meters: { fans: 14, authority: 6 } } },
          { id: 'guard', label: 'Protect himself', desc: 'Ease back in — no heroics on day one', outcome: 'He plays it safe and comes through unscathed — the sharpness will return in time.', effect: { form: 0.03, meters: { fans: 4 } } },
        ],
      },
    },
  },
  {
    id: 'wonder-goal', title: 'The Goal They’ll Never Forget', icon: '⚡', category: 'signature',
    minTurn: 100, maxTurn: 200, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ball drops to him on the halfway line, the whole pitch ahead, the game on a knife-edge. There is a moment where time seems to slow. What does he do?',
        choices: [
          { id: 'solo', label: 'Take them all on', desc: 'Head down, everything or nothing', outcome: 'He beats one, two, three, and buries it. A goal replayed for a generation — the {RIVAL} of it all forgotten in an instant.', effect: { form: 0.12, market: 4, attr: { flair: 2, creativity: 1 }, meters: { fans: 22 }, tag: 'legend-goal' } },
          { id: 'team', label: 'Play the killer pass', desc: 'The unselfish option, the right option', outcome: 'He slides in the winner for a teammate — no glory, all class. The room loves him for it.', effect: { form: 0.08, attr: { teamwork: 1, creativity: 1 }, meters: { peers: 14, fans: 8 } } },
        ],
      },
    },
  },
];

const arcById = new Map(ARCS.map((a) => [a.id, a]));
export const arcByIdOf = (id: string): StoryArc | undefined => arcById.get(id);

/** Pure 32-bit hash → [0,1). Mirrors the technique used for life/rival gating (no rng draw). */
function h01(a: number, b: number, c = 0x9e3779b1): number {
  let h = (a ^ Math.imul(b + 0x6d2b79f5, 0x85ebca6b) ^ Math.imul(c, 0xc2b2ae35)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 13), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Should a NEW arc start at this turn? Deterministic per (seed, turn); respects each arc's window, avoids
 *  repeats (fired set), and keeps arcs rare enough to feel special. Returns the arc id, or null. */
export function pickArcStart(seed: number, turn: number, fired: ReadonlySet<string>): string | null {
  // a low base rate so arcs are events, not every-turn noise (rarer for 'signature' arcs)
  const eligible = ARCS.filter((a) => !fired.has(a.id) && turn >= a.minTurn && turn <= a.maxTurn);
  if (!eligible.length) return null;
  const gate = h01(seed >>> 0, turn * 131 + 7, 0x51a3);
  const baseRate = 0.05;                         // ~1 arc-start check in 20 turns passes
  if (gate >= baseRate) return null;
  // weighted pick among eligible (rare arcs weighted down further)
  const weights = eligible.map((a) => a.weight * (a.rare ? 0.4 : 1));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = h01(seed >>> 0, turn * 977 + 13, 0x2bd1) * total;
  for (let i = 0; i < eligible.length; i++) { r -= weights[i]; if (r <= 0) return eligible[i].id; }
  return eligible[0].id;
}

/** Substitute story placeholders (currently the seeded rival name) into a beat's prose. */
export function fillArcText(text: string, rivalName: string): string {
  return text.replace(/\{RIVAL\}/g, rivalName);
}
