import type { StoryArc } from '../storyarc.js';

// SIGNATURE arcs — rare, low-probability one-off moments that become "the playthrough where…". Keep short.
export const SIGNATURE_ARCS: StoryArc[] = [
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
  {
    id: 'last-minute-winner', title: 'The 96th Minute', icon: '⏱️', category: 'signature',
    minTurn: 110, maxTurn: 200, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Deep into stoppage time, the scores level in a game the club had to win, one last corner swings in — and it falls to him six yards out with the keeper stranded.',
        choices: [
          { id: 'smash', label: 'Lash it in', desc: 'No thinking — just hit it', outcome: 'The net bulges and the stadium detonates. He wheels away, shirt off, booked and beaming. Scenes.', effect: { form: 0.12, market: 3, attr: { composure: 1, aggression: 1 }, meters: { fans: 20, peers: 10 } } },
          { id: 'compose', label: 'Take a touch', desc: 'Kill it dead, pick his spot, ice in the veins', outcome: 'One touch, side-foot, bottom corner — the coolest head in the ground. A finish they’ll show for years.', effect: { form: 0.1, market: 3, attr: { composure: 2 }, meters: { fans: 18 } } },
        ],
      },
    },
  },
];
