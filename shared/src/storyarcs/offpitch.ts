import type { StoryArc } from '../storyarc.js';

// OFFPITCH arcs — the life around the football: fame, money, media, temptation, identity. Move fame/greed/earnings.
export const OFFPITCH_ARCS: StoryArc[] = [
  {
    id: 'media-storm', title: 'Back Page Storm', icon: '📰', category: 'offpitch',
    minTurn: 95, maxTurn: 185, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A tabloid runs a story — half true, twisted for the headline — and by lunchtime it’s everywhere. The club’s press officer wants to know how he wants to play it.',
        choices: [
          { id: 'front', label: 'Face it head-on', desc: 'Front up, own what’s true, kill the rest', outcome: 'He fronts the cameras, calm and straight. The story dies in a day and his stock rises.', effect: { attr: { composure: 1 }, market: 1, meters: { fans: 8 }, tag: 'stood-tall' } },
          { id: 'silence', label: 'Say nothing', desc: 'Refuse to feed it — let it burn out', outcome: 'He goes silent and lets the noise exhaust itself. It works, mostly, but the whispers linger.', effect: { meters: { fans: -2, sponsors: 2 } } },
          { id: 'lawyer', label: 'Lawyer up', desc: 'Come out swinging — sue the paper', outcome: 'The legal threat makes bigger headlines than the story did. A costly, noisy distraction.', effect: { earnings: -200, market: 2, form: -0.05, meters: { partner: -4 } } },
        ],
      },
    },
  },
  {
    id: 'the-endorsement', title: 'The Big Deal', icon: '💰', category: 'offpitch',
    minTurn: 100, maxTurn: 190, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A global brand slides a life-changing endorsement across the table — the money is absurd, but the schedule of shoots and appearances would eat into everything else.',
        choices: [
          { id: 'sign', label: 'Sign it', desc: 'Take the money, become a brand', outcome: 'He signs. The bank balance and the billboards balloon — and so do the demands on his time.', effect: { earnings: 900, market: 4, greed: 2, form: -0.05, meters: { sponsors: 10 } } },
          { id: 'balance', label: 'Negotiate it down', desc: 'Less money, fewer obligations — football first', outcome: 'He trims the deal so it never touches his football. Smaller cheque, clearer head.', effect: { earnings: 400, market: 2, meters: { sponsors: 4 } } },
          { id: 'reject', label: 'Turn it down', desc: 'Not yet — nothing off the pitch matters more than the game', outcome: 'He walks away from a fortune to protect his focus. The purists love him for it.', effect: { greed: -2, form: 0.05, meters: { fans: 6, authority: 4 } } },
        ],
      },
    },
  },
];
