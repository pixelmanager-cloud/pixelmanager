import type { StoryArc } from '../storyarc.js';

// TRIUMPH arcs — the highs: finals, milestones, awards, first goals, personal glory.
export const TRIUMPH_ARCS: StoryArc[] = [
  {
    id: 'cup-final-day', title: 'The Final', icon: '🏆', category: 'triumph',
    minTurn: 100, maxTurn: 195, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A cup final — the biggest day of his life so far. The night before, sleepless in the team hotel, the enormity of it pressing down. How does he steady himself?',
        choices: [
          { id: 'calm', label: 'Embrace the nerves', desc: 'Accept the fear, breathe, trust the work', outcome: 'He makes peace with it. By kickoff he’s ice — this is exactly where he wants to be.', effect: { attr: { composure: 1 }, meters: { authority: 4 }, tag: 'ready' }, next: 'moment' },
          { id: 'hype', label: 'Channel the fire', desc: 'Let the adrenaline build — go out snarling', outcome: 'He arrives at the ground bouncing off the walls, ready to run through one.', effect: { attr: { aggression: 1 }, form: 0.03, tag: 'fired' }, next: 'moment' },
        ],
      },
      moment: {
        id: 'moment',
        prompt: 'Extra time, still level, and the final swings on a single chance that falls to him at the back post. A nation watching. The keeper set. This is the moment careers are measured by.',
        choices: [
          { id: 'bury', label: 'Bury it', desc: 'First-time, no hesitation', outcome: 'He lashes it home and lifts the cup as the confetti falls. A day that outlives him.', effect: { form: 0.12, market: 4, attr: { composure: 1, aggression: 1 }, meters: { fans: 22, authority: 8 } } },
          { id: 'dink', label: 'Dink the keeper', desc: 'Audacity on the biggest stage', outcome: 'He chips it, impossibly cool, and the ball floats in. Some men are built for this.', effect: { form: 0.12, market: 4, attr: { flair: 2 }, meters: { fans: 20 } } },
        ],
      },
    },
  },
];
