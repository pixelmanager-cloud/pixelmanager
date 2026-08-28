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

  // 1 — a ROMANCE that steadies or distracts him
  {
    id: 'rel-the-romance', title: 'Someone Worth Coming Home To', icon: '💞', category: 'relationship',
    minTurn: 48, maxTurn: 175, weight: 3, first: 'meet',
    beats: {
      meet: {
        id: 'meet',
        prompt: 'She works the coffee cart near the training ground and hasn’t the faintest idea who he is — which, frankly, is the most attractive thing about her. He’s got a big fixture list and a fragile little heart. Does he ask?',
        choices: [
          { id: 'ask-her', label: 'Ask her out', desc: 'Fumble the words, mean every one of them', outcome: 'She says yes before he’s finished the sentence. For the first time in months, football isn’t the only thing on his mind.', effect: { meters: { partner: 14, fans: 2 }, attr: { composure: 1 }, tag: 'courting' }, next: 'crunch' },
          { id: 'keep-head-down', label: 'Keep his head down', desc: 'Season first, feelings later', outcome: 'He orders his flat white, says nothing, and walks off telling himself it was the professional call. It doesn’t feel like one.', effect: { meters: { partner: -3 }, attr: { composure: 1 } } },
        ],
      },
      crunch: {
        id: 'crunch',
        prompt: 'Three months in and she asks him, gently, why he never switches off — why the phone’s out at dinner, why the analysis clips play in bed. Something has to give the night before a cup tie.',
        choices: [
          { id: 'be-present', label: 'Put the phone away', desc: 'She gets tonight; the manager gets tomorrow', outcome: 'He goes to bed on time, mind quiet for once, and wakes up lighter than he has in weeks. She’s become his ground wire.', effect: { meters: { partner: 16 }, attr: { composure: 2 }, form: 0.06 } },
          { id: 'chase-game', label: 'Bury himself in the tie', desc: 'Love can wait; the manager can’t', outcome: 'He watches clips till 2am and plays a blinder — but he catches her packing a small bag by the door, and the win tastes of nothing.', effect: { meters: { partner: -12 }, attr: { creativity: 1 }, form: 0.05, tag: 'distracted' } },
        ],
      },
    },
  },

  // 2 — a FAMILY ILLNESS
  {
    id: 'rel-family-illness', title: 'The Phone Call at Full Time', icon: '🏥', category: 'relationship',
    minTurn: 44, maxTurn: 168, weight: 2, first: 'diagnosis',
    beats: {
      diagnosis: {
        id: 'diagnosis',
        prompt: 'His mum’s voice is too steady on the phone, the way it goes when she’s trying not to frighten him. Tests, a ward, a word he has to ask her to spell. The gaffer’s named him for Saturday. What does he do?',
        choices: [
          { id: 'go-home', label: 'Go home to her', desc: 'Ask for compassionate leave, sit by the bed', outcome: 'He drives through the night and holds her hand while the machines beep. The team plays without him — and he doesn’t regret a second.', effect: { meters: { family: 18, authority: -4 }, attr: { composure: 1 }, tag: 'at-bedside' }, next: 'recovery' },
          { id: 'play-for-her', label: 'Play it for her', desc: 'She’d never forgive him for missing a match', outcome: 'She orders him to play, so he does, and dedicates the goal to a hospital bed forty miles away. He falls apart in the shower after.', effect: { meters: { family: 8, fans: 6 }, attr: { aggression: 1 }, form: 0.06, tag: 'at-bedside' }, next: 'recovery' },
        ],
      },
      recovery: {
        id: 'recovery',
        prompt: 'Weeks on, she’s turned a corner — frailer, but here, and sat in her chair giving him grief about his haircut. She wants to talk about what the scare taught him.',
        choices: [
          { id: 'closer', label: 'Hold them closer', desc: 'Buy Mum and Dad the house, be present, mean it', outcome: 'He moves them nearer the ground and starts driving over on days off. Football gave him the means; the fright gave him the sense.', effect: { meters: { family: 16 }, attr: { leadership: 1, teamwork: 1 } } },
          { id: 'harden', label: 'Bottle it and push on', desc: 'Turn the fear into fuel and say nothing', outcome: 'He thanks her, kisses her forehead, and drives back to training with the ache locked in a box. It makes him ruthless — and a little cold.', effect: { meters: { family: 4 }, attr: { aggression: 2, composure: 1 }, form: 0.05 } },
        ],
      },
    },
  },

  // 3 — BECOMING A FATHER
  {
    id: 'rel-becoming-father', title: 'The Smallest Signing', icon: '👶', category: 'relationship',
    minTurn: 70, maxTurn: 180, weight: 2, first: 'news',
    beats: {
      news: {
        id: 'news',
        prompt: 'She meets him at the door with a little white stick behind her back and a smile she can’t hold in. He’s going to be a dad. There’s a midweek European away trip pencilled in for right around the due date.',
        choices: [
          { id: 'all-in', label: 'Promise to be there', desc: 'No trip, no excuses — he’s in the delivery room', outcome: 'He tells the manager straight: family first, and means it. She cries, he cries, the neighbours probably hear the pair of them.', effect: { meters: { partner: 16, family: 12 }, attr: { composure: 1 }, tag: 'expecting' }, next: 'firstnight' },
          { id: 'hedge', label: 'Say he’ll try', desc: 'Football’s his living; he can’t promise the impossible', outcome: 'He hedges, and watches the light dim in her eyes a little. It’s honest — but honesty doesn’t always warm a house.', effect: { meters: { partner: -6, family: 4 }, attr: { composure: 1 }, tag: 'expecting' }, next: 'firstnight' },
        ],
      },
      firstnight: {
        id: 'firstnight',
        prompt: 'The baby comes at 4am after a night that rewrote what he thought fear was. Now there’s a tiny person asleep on his chest and a match in seventy-two hours. The world looks entirely different.',
        choices: [
          { id: 'grow-up', label: 'Play like a father', desc: 'Someone’s watching now — be worth watching', outcome: 'Something settles in him overnight. He plays with a calm nobody’s seen before, like a man who finally knows what it’s all for.', effect: { meters: { family: 14, partner: 10, fans: 4 }, attr: { leadership: 2, composure: 2 }, form: 0.07 } },
          { id: 'overwhelmed', label: 'Run on empty', desc: 'No sleep, no focus, just love and exhaustion', outcome: 'He’s a zombie at training and misspaces every pass, but he wouldn’t trade the bags under his eyes for a hat-trick. Balance can come later.', effect: { meters: { family: 12, partner: 12 }, attr: { teamwork: 1 }, form: -0.05 } },
        ],
      },
    },
  },

  // 4 — a TEAMMATE BEST-FRIEND bond
  {
    id: 'rel-best-mate', title: 'Thick as Thieves', icon: '🤝', category: 'relationship',
    minTurn: 45, maxTurn: 165, weight: 3, first: 'bond',
    beats: {
      bond: {
        id: 'bond',
        prompt: 'The new lad in the dressing room laughs at exactly the same daft things he does and reads his runs before he’s even made them. Off the pitch they’re inseparable within a fortnight. On it, there’s a partnership begging to be built.',
        choices: [
          { id: 'build-it', label: 'Build the partnership', desc: 'Extra sessions, telepathy, two minds one move', outcome: 'They stay behind to drill one-twos until the floodlights die. By month’s end defenders can’t tell where one of them ends and the other begins.', effect: { meters: { peers: 16 }, attr: { teamwork: 2, creativity: 1 }, form: 0.06, tag: 'brothers' }, next: 'loyalty' },
          { id: 'keep-light', label: 'Keep it to the banter', desc: 'Great mate, but keep football football', outcome: 'They’re thick as thieves in the canteen and merely fine on the pitch. A good friendship — and a partnership left on the table.', effect: { meters: { peers: 8 }, attr: { teamwork: 1 }, tag: 'brothers' }, next: 'loyalty' },
        ],
      },
      loyalty: {
        id: 'loyalty',
        prompt: 'A club comes in for his mate — more money, bigger badge — and the lad’s torn in half about it. He turns up at the flat at midnight asking, honestly, what he should do.',
        choices: [
          { id: 'set-free', label: 'Tell him to go', desc: 'Push his brother toward the bigger stage', outcome: 'He tells him to take it, because that’s what you do for family. They embrace at the airport and swear the friendship outlasts any transfer.', effect: { meters: { peers: 14 }, attr: { leadership: 1, teamwork: 1 } } },
          { id: 'beg-stay', label: 'Beg him to stay', desc: 'Finish what they started, together', outcome: 'He makes the case for one more year, one more crack at it together — and the lad stays. Selfish, maybe. But some things are worth being selfish for.', effect: { meters: { peers: 10, authority: -2 }, attr: { teamwork: 2 }, form: 0.05 } },
        ],
      },
    },
  },

  // 5 — a TEAMMATE FEUD
  {
    id: 'rel-teammate-feud', title: 'Two Kings, One Dressing Room', icon: '⚔️', category: 'relationship',
    minTurn: 52, maxTurn: 170, weight: 2, first: 'spark',
    beats: {
      spark: {
        id: 'spark',
        prompt: 'A senior pro — thick with {RIVAL} from their old academy days — keeps freezing him out: no pass when he’s clean through, a sneer at his ideas in the meeting room. It comes to a head over a missed penalty and a shove in the tunnel.',
        choices: [
          { id: 'stand-up', label: 'Stand his ground', desc: 'Chest to chest, let the room see he won’t fold', outcome: 'He fronts up in front of everyone, and the dressing room splits down the middle. Nobody doubts his bottle now — but the air stays poisonous.', effect: { meters: { peers: -8, authority: 4 }, attr: { aggression: 2, leadership: 1 }, tag: 'at-war' }, next: 'resolution' },
          { id: 'ice-him', label: 'Freeze him right back', desc: 'Kill him with cold professionalism', outcome: 'He answers every dig with silence and every snub with a better performance. The feud simmers, quiet and vicious, all season.', effect: { meters: { peers: -4 }, attr: { composure: 2 }, form: 0.05, tag: 'at-war' }, next: 'resolution' },
        ],
      },
      resolution: {
        id: 'resolution',
        prompt: 'Come the spring, they need each other — a relegation six-pointer, and the two of them the only ones capable of winning it. The manager locks them in a room and says: sort it, or you both sit.',
        choices: [
          { id: 'truce', label: 'Broker a truce', desc: 'Not friends — but professionals, for the badge', outcome: 'They shake hands like men defusing a bomb, and go out and dismantle the opposition together. Respect, hard-won, is worth more than warmth.', effect: { meters: { peers: 12, authority: 6 }, attr: { teamwork: 2, leadership: 1 }, form: 0.06 } },
          { id: 'no-surrender', label: 'Refuse to bend', desc: 'He’d rather win alone than smile at a snake', outcome: 'He won’t give an inch, so the manager benches the pair of them and the club goes down fighting shorthanded. Principle, at a brutal price.', effect: { meters: { peers: -10, authority: -6 }, attr: { aggression: 2 }, form: -0.06 } },
        ],
      },
    },
  },

  // 6 — a RIFT WITH HIS AGENT
  {
    id: 'rel-agent-rift', title: 'The Man Who Takes His Cut', icon: '📉', category: 'relationship',
    minTurn: 60, maxTurn: 175, weight: 2, first: 'discovery',
    beats: {
      discovery: {
        id: 'discovery',
        prompt: 'An accountant flags it first: the agent who’s repped him since he was sixteen has been quietly funnelling image-rights money into a side deal nobody explained. The same man once drove four hours to sit with him after a debut nightmare.',
        choices: [
          { id: 'confront', label: 'Confront him head-on', desc: 'Look him in the eye and demand the truth', outcome: 'He drives to the office and lays the papers on the desk. The agent’s excuses curdle in the air, and a decade of trust cracks clean down the middle.', effect: { meters: { agent: -14 }, attr: { leadership: 1, aggression: 1 }, tag: 'betrayed' }, next: 'decision' },
          { id: 'lawyer-up', label: 'Say nothing, lawyer up', desc: 'Gather everything before he tips his hand', outcome: 'He keeps smiling down the phone while a solicitor quietly builds the file. Cold, calculated — the way you deal with someone who taught you to be it.', effect: { meters: { agent: -8 }, attr: { composure: 2 }, tag: 'betrayed' }, next: 'decision' },
        ],
      },
      decision: {
        id: 'decision',
        prompt: 'The agent comes to him hollow-eyed, admitting the mess was to plug a gambling hole, begging for one more chance. Fifteen years of shared history sits on the table between them.',
        choices: [
          { id: 'cut-loose', label: 'Cut him loose', desc: 'Terminate the deal, walk away clean', outcome: 'He tears up the contract and hands his career to someone new. It aches like a bereavement — but a man who lies once will lie again.', effect: { meters: { agent: -18, sponsors: 4 }, attr: { leadership: 2, composure: 1 } } },
          { id: 'second-chance', label: 'Give him one last rope', desc: 'New terms, full transparency, zero more slips', outcome: 'He keeps him on the tightest of leashes, every penny audited. Loyalty, or foolishness — only the next scandal will tell which.', effect: { meters: { agent: 8, family: 2 }, attr: { composure: 1 } } },
        ],
      },
    },
  },

  // 7 — reconnecting with an ESTRANGED PARENT
  {
    id: 'rel-estranged-parent', title: 'The Empty Seat at Every Game', icon: '🚪', category: 'relationship',
    minTurn: 46, maxTurn: 170, weight: 2, first: 'letter',
    beats: {
      letter: {
        id: 'letter',
        prompt: 'A letter arrives in shaky handwriting he half-recognises: the father who walked out when he was nine, who never once came to a match, saying he’s watched every game from afar and would like — if he’s allowed — to talk.',
        choices: [
          { id: 'reply', label: 'Agree to meet', desc: 'A café, neutral ground, one hour, no promises', outcome: 'He sits across from a stranger with his own eyes and his own frown, and twenty years of resentment loosens by a single, painful notch.', effect: { meters: { family: 8 }, attr: { composure: 2 }, tag: 'reaching-out' }, next: 'reckoning' },
          { id: 'burn-it', label: 'Bin the letter', desc: 'He didn’t come when it mattered — too late now', outcome: 'He throws it in the fire and tells himself he feels nothing. He plays with a fury that weekend that says otherwise.', effect: { meters: { family: -4 }, attr: { aggression: 2 }, form: 0.05 } },
        ],
      },
      reckoning: {
        id: 'reckoning',
        prompt: 'The old man asks, quietly, if he might come to a game — sit in the stand, just once, and watch his son play in the flesh. There’s a ticket in his pocket he hasn’t decided whether to hand over.',
        choices: [
          { id: 'give-ticket', label: 'Hand him the ticket', desc: 'Let him fill the seat that was empty for years', outcome: 'He looks up mid-match and finds him there, weeping in the away end. Some wounds don’t heal — but this one, at last, stops bleeding.', effect: { meters: { family: 14, fans: 2 }, attr: { composure: 2, leadership: 1 }, form: 0.05 } },
          { id: 'not-yet', label: 'Tell him not yet', desc: 'Coffee’s one thing; the stand is sacred', outcome: 'He says maybe one day, and keeps the ticket in his drawer. Forgiveness, he decides, is a road you walk in your own time.', effect: { meters: { family: 6 }, attr: { composure: 1 } } },
        ],
      },
    },
  },

  // 8 — an ACADEMY KID who looks up to him (he becomes the mentor)
  {
    id: 'rel-mentor-kid', title: 'The Kid Who Wears His Number', icon: '🌱', category: 'relationship',
    minTurn: 95, maxTurn: 185, weight: 2, first: 'shadow',
    beats: {
      shadow: {
        id: 'shadow',
        prompt: 'A fifteen-year-old from the academy has started copying everything: the pre-match ritual, the socks, the number on the back. He’s buzzing with talent and terrified of his own shadow, and he keeps hovering at the edge of first-team training.',
        choices: [
          { id: 'take-under-wing', label: 'Take him under his wing', desc: 'Extra sessions, hard truths, a steady hand', outcome: 'He becomes the boy’s old head, staying back to drill the same things a veteran once drilled into him. The circle closes, and it feels right.', effect: { meters: { authority: 8, peers: 6 }, attr: { leadership: 2, teamwork: 1 }, tag: 'mentoring' }, next: 'debut' },
          { id: 'tough-love', label: 'Send him to sink or swim', desc: 'Toughen up — the game won’t coddle him', outcome: 'He tells the kid to figure it out like everyone else did, and the boy shrinks a little. Maybe it builds him. Maybe it breaks something.', effect: { meters: { authority: 2, peers: -2 }, attr: { aggression: 1 }, tag: 'mentoring' }, next: 'debut' },
        ],
      },
      debut: {
        id: 'debut',
        prompt: 'Two seasons on, the boy — a man now — is named for his own debut, white as a sheet in the tunnel. He looks over for the nod, the way you look to family. This is the moment everything he poured in gets tested.',
        choices: [
          { id: 'settle-him', label: 'Settle his nerves', desc: 'An arm round the shoulder, the right quiet word', outcome: 'He whispers the thing the old head once told him, and the kid walks out three inches taller and plays a blinder. Legacy isn’t medals — it’s this.', effect: { meters: { authority: 12, peers: 10, fans: 4 }, attr: { leadership: 2, composure: 1 }, form: 0.06 } },
          { id: 'step-back', label: 'Let him stand alone', desc: 'He’s ready — time to cut the last cord', outcome: 'He gives him a wink and nothing more, trusting the work to hold. The boy stumbles early, then finds himself — and does it on his own two feet.', effect: { meters: { authority: 8, peers: 6 }, attr: { leadership: 1, teamwork: 1 } } },
        ],
      },
    },
  },
];
