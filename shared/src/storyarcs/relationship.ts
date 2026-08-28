import type { StoryArc } from '../storyarc.js';

// RELATIONSHIP arcs — people who shape him: mentors, teammates, family, partners, {RIVAL}. Meters matter here.
export const RELATIONSHIP_ARCS: StoryArc[] = [
  {
    id: 'the-mentor', title: 'The Old Head', icon: '🧭', category: 'relationship',
    minTurn: 55, maxTurn: 150, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A grizzled veteran, twenty years in the game and every scar to show for it, takes the young lad under his wing. He offers to stay behind after training, every day. Does he take him up on it?',
        choices: [
          { id: 'learn', label: 'Soak it all up', desc: 'Extra hours, every drill, hang on his every word', outcome: 'He becomes the old man’s shadow — and it shows in the little details of his game.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { authority: 8 }, tag: 'protege' }, next: 'goodbye' },
          { id: 'polite', label: 'Politely decline', desc: 'He’d rather find his own way', outcome: 'He nods, says thanks, and goes his own road. Independent — for better or worse.', effect: { attr: { creativity: 1 }, meters: { authority: -2 } } },
        ],
      },
      goodbye: {
        id: 'goodbye',
        prompt: 'The old head plays his last game and hangs up his boots. In the tunnel afterward he grips the young man’s shoulder: “It’s your team now, son.” How does he carry it?',
        choices: [
          { id: 'honour', label: 'Honour him', desc: 'Vow to lead the way the old man taught him', outcome: 'He picks up the torch. Everything the veteran gave him now runs through the side.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { authority: 10, peers: 8 }, form: 0.05 } },
          { id: 'own-path', label: 'Make it his own', desc: 'Respect the past, but do it his way', outcome: 'He keeps the lessons, drops the rest, and builds his own kind of leader.', effect: { attr: { leadership: 1, creativity: 1 }, meters: { peers: 6 } } },
        ],
      },
    },
  },
];
