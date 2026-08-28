import type { StoryArc } from '../storyarc.js';

// CRISIS arcs — adversity storylines: injuries, slumps, fall-outs, scandals, pressure to overcome.
export const CRISIS_ARCS: StoryArc[] = [
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
    id: 'manager-fallout', title: 'Out in the Cold', icon: '❄️', category: 'crisis',
    minTurn: 100, maxTurn: 185, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A new manager arrives and takes an instant dislike to him — dropped to the bench, frozen out, briefed against in the press. His whole career suddenly hangs on how he reacts.',
        choices: [
          { id: 'graft', label: 'Win him over', desc: 'Head down, train like a demon, force the gaffer’s hand', outcome: 'He becomes impossible to ignore in training — respect grudgingly earned.', effect: { attr: { stamina: 1 }, meters: { authority: 8 }, form: 0.04, tag: 'grafted' }, next: 'crossroads' },
          { id: 'clash', label: 'Confront him', desc: 'Demand to know where he stands — clear the air, or blow it up', outcome: 'A blazing row behind closed doors. It’s honest, at least. The lines are drawn.', effect: { meters: { authority: -6 }, tag: 'clashed' }, next: 'crossroads' },
        ],
      },
      crossroads: {
        id: 'crossroads',
        prompt: 'Weeks of exile later, a chance: an injury crisis means he’s needed, away at {RIVAL}’s club, the gaffer with no other option. One game to change everything.',
        choices: [
          { id: 'statement', label: 'Make a statement', desc: 'Play the game of his life and shame the doubters', outcome: 'He runs the show and silences the lot of them. You can’t drop him now.', effect: { form: 0.1, attr: { composure: 1, creativity: 1 }, meters: { fans: 12, authority: 6 } } },
          { id: 'move-on', label: 'Play for a move', desc: 'A tidy game — enough to remind other clubs he exists', outcome: 'Solid, professional, and the scouts in the stand take note. The exit door beckons.', effect: { market: 3, form: 0.03 } },
        ],
      },
    },
  },
];
