import type { StoryArc } from '../storyarc.js';

// SAGA arcs — long, branching, career-shaping storylines that unfold over several turns.
export const SAGA_ARCS: StoryArc[] = [
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
    id: 'captaincy-journey', title: 'The Armband', icon: '🎗️', category: 'saga',
    minTurn: 100, maxTurn: 185, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The old skipper is on his way out, and the manager pulls him aside: the armband could be his. It’s an honour — and a target on his back. Does he want it?',
        choices: [
          { id: 'want', label: 'Step up', desc: 'Tell the gaffer he’s ready to lead', outcome: 'He takes the armband, chest out. Now he has to earn the respect that comes with it.', effect: { attr: { leadership: 1 }, meters: { authority: 8 }, tag: 'captain' }, next: 'test' },
          { id: 'defer', label: 'Not yet', desc: 'Say a senior head should wear it first', outcome: 'He defers — humble, but the moment passes to someone else. His turn will come.', effect: { meters: { peers: 8, authority: -2 } } },
        ],
      },
      test: {
        id: 'test',
        prompt: 'First real test as captain: the team is 2-0 down at half-time, heads dropping, and {RIVAL}’s side are running riot. What does he do in that dressing room?',
        choices: [
          { id: 'rally', label: 'Rally them', desc: 'A speech from the heart — drag them back into it', outcome: 'His words land. They come out transformed and salvage a draw. A captain is born.', effect: { attr: { leadership: 2, composure: 1 }, meters: { authority: 10, peers: 8 }, form: 0.06 } },
          { id: 'lead-quiet', label: 'Lead by example', desc: 'Say little — go out and drag them by the collar himself', outcome: 'No speeches, just a performance nobody could ignore. The armband suits him.', effect: { attr: { leadership: 1, stamina: 1 }, meters: { peers: 10 }, form: 0.05 } },
        ],
      },
    },
  },
  {
    id: 'relegation-battle', title: 'The Drop Fight', icon: '🪂', category: 'saga',
    minTurn: 95, maxTurn: 180, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club is sliding toward the drop, the fans are restless, and agents are whispering that a sinking ship is no place for a talent like his. Does he jump, or fight?',
        choices: [
          { id: 'fight', label: 'Fight for the club', desc: 'Publicly commit to keeping them up', outcome: 'He nails his colours to the mast — the fans rally behind their leader.', effect: { attr: { leadership: 1 }, meters: { fans: 14, authority: 6 }, tag: 'fighter' }, next: 'finalday' },
          { id: 'angle', label: 'Angle for an exit', desc: 'Quietly let it be known he’d welcome a move', outcome: 'Word gets out. Some fans feel betrayed just when they needed him most.', effect: { market: 2, meters: { fans: -12 } } },
        ],
      },
      finalday: {
        id: 'finalday',
        prompt: 'The final day. Win and they stay up; anything less and they go down. It’s scoreless, seconds left, and the ball drops to him at the far post. This is it.',
        choices: [
          { id: 'hero', label: 'Gamble everything', desc: 'Throw himself at it — hero or villain', outcome: 'He bundles it in at the death. Survival! Grown men weep in the stands, chanting his name.', effect: { form: 0.12, attr: { composure: 1, aggression: 1 }, meters: { fans: 24, authority: 10 } } },
          { id: 'safe', label: 'Play the percentages', desc: 'Lay it off to a better-placed teammate', outcome: 'He squares it; the finish is someone else’s, but the point stands and they survive.', effect: { form: 0.06, attr: { teamwork: 1 }, meters: { peers: 12, fans: 10 } } },
        ],
      },
    },
  },
];
