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

  // 9 — a MARRIAGE strained by relocation and transfers
  {
    id: 'rel-marriage-relocation', title: 'The Fourth City in Six Years', icon: '📦', category: 'relationship',
    minTurn: 80, maxTurn: 190, weight: 3, first: 'boxes',
    beats: {
      boxes: {
        id: 'boxes',
        prompt: 'The move goes through and she smiles for the cameras, but that night he finds her sat among the packing boxes she never quite finished unpacking from the last club. Another city, another set of schools for the kids, another circle of friends she has to build from scratch — all for his career.',
        choices: [
          { id: 'promise-roots', label: 'Promise this is the last one', desc: 'Tell the club he wants a long deal and roots', outcome: 'He asks his agent to chase stability over the next big payday, and she cries with relief into his shoulder. Home, at last, will mean a house they get to keep.', effect: { meters: { partner: 16, family: 8, agent: -4 }, attr: { composure: 1 }, tag: 'settling' }, next: 'ultimatum' },
          { id: 'chase-career', label: 'Chase the career anyway', desc: 'The window to play at the top is short — take it', outcome: 'He explains that the top years are few, and she nods, and something in her goes quiet. The suitcase in the hall stays half-packed, just in case.', effect: { meters: { partner: -10, family: -4 }, attr: { aggression: 1 }, form: 0.05, tag: 'drifting' }, next: 'ultimatum' },
        ],
      },
      ultimatum: {
        id: 'ultimatum',
        prompt: 'A monster offer lands from abroad — a fifth country, a fifth uprooting. She sits him down and says, without anger, that she loves him but she cannot keep dissolving her whole life every eighteen months. This one is his to choose, and she wants him to know the cost.',
        choices: [
          { id: 'turn-it-down', label: 'Turn the move down', desc: 'Some things matter more than a badge', outcome: 'He rings the agent and says no, and puts the family first for the first time in a decade. The marriage steadies like a boat finding calm water.', effect: { meters: { partner: 20, family: 12, agent: -8 }, attr: { leadership: 1, composure: 2 } } },
          { id: 'go-together', label: 'Ask her to gamble once more', desc: 'One last adventure, all in, together', outcome: 'He makes the case with everything he has, and she agrees to one final leap — on the condition it truly is the last. They fly out hand in hand, hearts in throats.', effect: { meters: { partner: 6, family: -2 }, earnings: 40, attr: { aggression: 1 }, form: 0.06 } },
        ],
      },
    },
  },

  // 10 — a SIBLING whose own football dream stalled
  {
    id: 'rel-sibling-dream', title: 'The Brother Who Didn’t Make It', icon: '🥀', category: 'relationship',
    minTurn: 50, maxTurn: 175, weight: 2, first: 'release',
    beats: {
      release: {
        id: 'release',
        prompt: 'His older brother — the one who taught him to strike a ball in the back garden, who was always the more gifted of the two — gets released by his non-league side at thirty. He turns up at the door with a carrier bag of boots and a smile that doesn’t reach his eyes.',
        choices: [
          { id: 'lift-him', label: 'Lift him back up', desc: 'A coaching badge, a role, a reason to stay in the game', outcome: 'He quietly funds his brother’s coaching qualifications and gets him a foot in an academy door. Pride is a delicate thing to hand a man — he does it gently.', effect: { meters: { family: 16 }, attr: { leadership: 1, teamwork: 1 }, earnings: -8, tag: 'lifting-brother' }, next: 'jealousy' },
          { id: 'give-space', label: 'Give him room to grieve', desc: 'Don’t rush to fix what needs to be felt', outcome: 'He resists the urge to solve it and just listens over a pint, night after night. Some losses a man has to sit inside before he can climb out.', effect: { meters: { family: 10 }, attr: { composure: 2 }, tag: 'lifting-brother' }, next: 'jealousy' },
        ],
      },
      jealousy: {
        id: 'jealousy',
        prompt: 'Months on, at their mum’s birthday, the brother has one too many and it spills out — the envy he’s carried for years, that the wrong one of them made it. The whole room goes silent around the two of them.',
        choices: [
          { id: 'own-luck', label: 'Own how thin the line was', desc: 'Admit it could easily have gone the other way', outcome: 'He tells him the truth: an injury here, a scout looking the other way there, and their lives would have swapped. The honesty lands harder than any denial, and the brothers hold on.', effect: { meters: { family: 14 }, attr: { composure: 2, leadership: 1 } } },
          { id: 'walk-away', label: 'Walk out to cool down', desc: 'Say nothing he can’t take back, leave the room', outcome: 'He steps into the cold garden rather than fire back, and lets the storm pass. They never quite finish the conversation — but they don’t break, either.', effect: { meters: { family: 4 }, attr: { composure: 1, aggression: 1 } } },
        ],
      },
    },
  },

  // 11 — a demanding FOOTBALL DAD who won't let go
  {
    id: 'rel-football-dad', title: 'The Man in the Stand with the Notebook', icon: '📋', category: 'relationship',
    minTurn: 42, maxTurn: 140, weight: 2, first: 'critique',
    beats: {
      critique: {
        id: 'critique',
        prompt: 'His dad has driven to every game since he was six, and after every one there’s the same debrief in the car park — the notebook of things he did wrong, the tone that made a boy feel he was never quite enough. He’s a grown professional now, and it still cuts.',
        choices: [
          { id: 'draw-line', label: 'Draw a firm line', desc: 'Tell him, gently but clearly, that the coaching stops now', outcome: 'He sits his father down and says he needs a dad in the stand, not a critic in the car park. It wounds the old man — but for the first time the boy breathes.', effect: { meters: { family: 6, authority: 4 }, attr: { leadership: 2, composure: 1 }, tag: 'boundary-set' }, next: 'thaw' },
          { id: 'keep-pleasing', label: 'Keep chasing his approval', desc: 'Take the notes, nod, try to finally be enough', outcome: 'He swallows it again and trains twice as hard trying to earn a word of praise that never quite comes. The hunger sharpens his game and hollows something out in him.', effect: { meters: { family: 2 }, attr: { aggression: 1, stamina: 1 }, form: 0.05, tag: 'still-pleasing' }, next: 'thaw' },
        ],
      },
      thaw: {
        id: 'thaw',
        prompt: 'The old man falls ill and, from a hospital chair, finally says the thing he never could: that he was hard because he was frightened of wasting the gift, and that he’s proud — has always been proud — and just forgot to say it.',
        choices: [
          { id: 'forgive', label: 'Let it heal', desc: 'Take the words, forgive the years, hold his hand', outcome: 'He tells his dad it’s alright, that he heard him even when the praise was buried, and the two of them cry the way men in their family never do. The wound finally closes.', effect: { meters: { family: 18 }, attr: { composure: 2, leadership: 1 } } },
          { id: 'too-late', label: 'Struggle to let it in', desc: 'The apology is real — but so are the years', outcome: 'He nods and holds the hand and can’t quite make the years dissolve on cue. Forgiveness, he learns, isn’t a switch — but he starts down the road.', effect: { meters: { family: 8 }, attr: { composure: 1, aggression: 1 } } },
        ],
      },
    },
  },

  // 12 — GRIEF over a mentor/coach who passed away
  {
    id: 'rel-coach-passing', title: 'The Whistle That Went Quiet', icon: '🕯️', category: 'relationship',
    minTurn: 60, maxTurn: 190, weight: 2, first: 'news',
    beats: {
      news: {
        id: 'news',
        prompt: 'The youth coach who first believed in him — who drove him to trials, who told a scrawny kid he had something — dies suddenly over the summer. The funeral falls two days before the season opener, and the family have asked him to speak.',
        choices: [
          { id: 'eulogy', label: 'Stand up and speak', desc: 'Put into words what the old man gave him', outcome: 'He stands before a packed church and finds the words for a debt he can never repay. He plays the opener with the man’s old motto scrawled inside his boot.', effect: { meters: { family: 6, fans: 6, authority: 6 }, attr: { leadership: 2, composure: 1 }, tag: 'grieving-coach' }, next: 'legacy' },
          { id: 'grieve-quiet', label: 'Grieve out of the spotlight', desc: 'Sit at the back, no cameras, no speech', outcome: 'He slips into the back pew in a plain coat and mourns as just another old boy the coach shaped. Some grief isn’t for the papers, and he keeps this one close.', effect: { meters: { peers: 4 }, attr: { composure: 2 }, form: -0.05, tag: 'grieving-coach' }, next: 'legacy' },
        ],
      },
      legacy: {
        id: 'legacy',
        prompt: 'Weeks later, the coach’s widow hands him a shoebox: every match report the old man ever wrote about him, kept for twenty years. At the bottom is a note asking one thing — that he pass it on, the way it was passed to him.',
        choices: [
          { id: 'fund-academy', label: 'Fund the grassroots club', desc: 'Keep the little club’s lights on in his name', outcome: 'He endows the crumbling boys’ club with a pitch and a coach’s wage, and hangs the old man’s name over the gate. The whistle goes quiet; the work carries on.', effect: { meters: { fans: 10, family: 8, sponsors: 4 }, earnings: -12, attr: { leadership: 2 } } },
          { id: 'coach-himself', label: 'Do the driving himself', desc: 'Spend his days off with the kids, boots on', outcome: 'He starts turning up on Sunday mornings to run drills for muddy nine-year-olds, giving them the hours the old man once gave him. It’s the truest way he knows to say thank you.', effect: { meters: { fans: 8, peers: 4 }, attr: { leadership: 1, teamwork: 2 } } },
        ],
      },
    },
  },

  // 13 — a CHILDHOOD FRIEND who wants to be his agent
  {
    id: 'rel-friend-agent', title: 'A Handshake Between Mates', icon: '🤞', category: 'relationship',
    minTurn: 55, maxTurn: 165, weight: 2, first: 'pitch',
    beats: {
      pitch: {
        id: 'pitch',
        prompt: 'His mate from the estate — sharp as a tack, no contacts, no licence yet — sits him down with a business plan on a laptop that keeps freezing. He wants to represent him. No agent has ever cared about him the way this lad has, but caring isn’t the same as being able.',
        choices: [
          { id: 'take-chance', label: 'Take a chance on him', desc: 'Loyalty over polish — help him get qualified', outcome: 'He fronts the cost of the licence and hands his mate a shot nobody else would. It’s a gamble on a friendship, and the whole estate is watching to see if it pays.', effect: { meters: { agent: 10, peers: 6 }, earnings: -6, attr: { teamwork: 1 }, tag: 'mate-as-agent' }, next: 'firstdeal' },
          { id: 'stay-pro', label: 'Keep business and mates apart', desc: 'Love him too much to risk it on a contract', outcome: 'He tells him, kindly, that he’d rather keep him as the friend who’ll be at his funeral than the agent who might not be. The lad’s gutted — but he understands.', effect: { meters: { peers: 8, agent: 2 }, attr: { composure: 2 }, tag: 'kept-mate' }, next: 'firstdeal' },
        ],
      },
      firstdeal: {
        id: 'firstdeal',
        prompt: 'A career-defining negotiation lands — a move that needs a seasoned shark across the table. If the mate’s in charge, he’s visibly out of his depth against men who do this in their sleep. The friendship and the deal are suddenly on the same table.',
        choices: [
          { id: 'back-him', label: 'Back his mate to the hilt', desc: 'Sit beside him, learn together, sink or swim', outcome: 'He refuses to undercut his friend and coaches him through it in the evenings. The deal comes in rougher than a shark would’ve got — but it’s theirs, and it holds.', effect: { meters: { agent: 12, peers: 10 }, market: -6, attr: { leadership: 1, teamwork: 1 } } },
          { id: 'bring-shark', label: 'Bring in a heavyweight', desc: 'Protect the deal, keep the mate on the team', outcome: 'He hires a big-name negotiator and finds his friend a real role beside them, salvaging the friendship and the fee both. Pragmatism, dressed as kindness — and maybe it is.', effect: { meters: { agent: 4, peers: -2 }, market: 8, attr: { composure: 2 } } },
        ],
      },
    },
  },

  // 14 — LOYALTY to the physio who saved his career
  {
    id: 'rel-physio-loyalty', title: 'The Hands That Put Him Back Together', icon: '🩹', category: 'relationship',
    minTurn: 75, maxTurn: 195, weight: 2, first: 'comeback',
    beats: {
      comeback: {
        id: 'comeback',
        prompt: 'A blown knee that three surgeons called career-ending — and one quiet club physio who refused to accept it, dragging him through eighteen months of dawn rehab nobody saw. Now a glamour club wants him, and the small club’s physio isn’t part of the package.',
        choices: [
          { id: 'take-him', label: 'Insist the physio comes too', desc: 'Make it a condition of the move', outcome: 'He tells the new club plainly: the man who rebuilt his knee comes with him, or there’s no deal. They grumble, then agree, and loyalty gets written into the contract.', effect: { meters: { authority: 6, peers: 8, agent: -4 }, attr: { leadership: 2 }, tag: 'physio-loyal' }, next: 'crisis' },
          { id: 'thank-leave', label: 'Thank him and move on', desc: 'A generous parting gift, a clean goodbye', outcome: 'He can’t force the transfer, so he sets the physio up with a lump sum and a glowing word in every ear he can reach. Gratitude, paid forward as best he can.', effect: { meters: { peers: 4 }, earnings: -6, attr: { composure: 1 }, tag: 'physio-parted' }, next: 'crisis' },
        ],
      },
      crisis: {
        id: 'crisis',
        prompt: 'A tweak in the same knee, mid-season, and the new club’s medical staff want to rush him back for a huge fixture. His gut says the old physio would have told him to wait. The specialist he trusts is a phone call away, and disagreeing publicly means defying the manager.',
        choices: [
          { id: 'trust-old', label: 'Trust the man who knows the knee', desc: 'Ring the old physio, follow his read, sit it out', outcome: 'He phones the one man who truly knows that joint and takes his word over the club’s clock. He misses the big one — and saves a decade of the ones after it.', effect: { meters: { authority: -4, peers: 6 }, attr: { composure: 2, leadership: 1 } } },
          { id: 'trust-club', label: 'Do as the new club asks', desc: 'Play the fixture, trust the men on the payroll', outcome: 'He takes the injection and starts the game, chasing the manager’s approval over an old friend’s caution. The knee holds this time — but he doesn’t sleep easy on it.', effect: { meters: { authority: 8, peers: -2 }, attr: { aggression: 1 }, form: 0.05 } },
        ],
      },
    },
  },

  // 15 — a FAN who has written to him for years
  {
    id: 'rel-pen-pal-fan', title: 'Seat 14, Row F, Every Week', icon: '✉️', category: 'relationship',
    minTurn: 65, maxTurn: 195, weight: 2, first: 'letters',
    beats: {
      letters: {
        id: 'letters',
        prompt: 'For six years a lad in a wheelchair has posted him a letter after every single match — never asking for a thing, just telling him what the football means from Seat 14, Row F. This week the letter is in a different hand: the boy’s mother, saying he’s in hospital and it’s serious.',
        choices: [
          { id: 'visit', label: 'Go to the hospital', desc: 'No cameras, no fuss — just turn up', outcome: 'He drives over after training with a signed shirt and sits for an hour talking football with a boy who lights up like a floodlight. Some things are worth more than any fee.', effect: { meters: { fans: 16, family: 4 }, attr: { composure: 1, leadership: 1 }, tag: 'letters-answered' }, next: 'return' },
          { id: 'write-back', label: 'Write him back at last', desc: 'Six years of letters finally get a reply', outcome: 'He sits down and writes the boy the letter he should have written years ago, page after page in his own hand. It’s not a visit — but it’s real, and it’s his.', effect: { meters: { fans: 10 }, attr: { composure: 2 }, tag: 'letters-answered' }, next: 'return' },
        ],
      },
      return: {
        id: 'return',
        prompt: 'Months on, the boy pulls through and is coming back to Seat 14 for the first time since the scare. The club wants to make a big pre-match presentation of it. The boy, through his mum, has quietly said he’d hate the spotlight.',
        choices: [
          { id: 'his-way', label: 'Do it the boy’s way', desc: 'Wave off the cameras, meet him quietly instead', outcome: 'He tells the club no ceremony, and instead walks over to Row F before kickoff for a private word and a handshake. The boy beams; the moment stays theirs.', effect: { meters: { fans: 14, sponsors: -2 }, attr: { leadership: 2, composure: 1 } } },
          { id: 'club-moment', label: 'Let the club mark it', desc: 'A stadium standing for one brave kid', outcome: 'He lets the ground rise to its feet for the boy, forty thousand voices for one lad in Row F. It’s bigger than the boy wanted — but the roar carries him for years.', effect: { meters: { fans: 12, sponsors: 6 }, attr: { leadership: 1 }, form: 0.05 } },
        ],
      },
    },
  },

  // 16 — a new MANAGER who becomes a father figure
  {
    id: 'rel-manager-father', title: 'The Gaffer Who Saw Him', icon: '🧥', category: 'relationship',
    minTurn: 50, maxTurn: 170, weight: 3, first: 'arrival',
    beats: {
      arrival: {
        id: 'arrival',
        prompt: 'A new manager arrives, old-school and grey at the temples, and within a month he’s doing the thing no coach ever bothered to: asking how the lad is, not how he played. He takes him for a coffee and talks about life more than tactics. It’s unfamiliar — and it lands somewhere deep.',
        choices: [
          { id: 'open-up', label: 'Let him in', desc: 'Trust the old man, take the guidance', outcome: 'He starts staying behind to talk, really talk, and finds himself steadier for it than any drill ever made him. The gaffer becomes the steadying voice he never had.', effect: { meters: { authority: 12, family: 4 }, attr: { composure: 2, leadership: 1 }, form: 0.06, tag: 'gaffer-bond' }, next: 'sacking' },
          { id: 'stay-guarded', label: 'Keep his guard up', desc: 'He’s been let down before — trust is earned', outcome: 'He keeps it professional and gives the warmth a wide berth, having learned the hard way what happens when you rely on people. The gaffer, patient, just leaves the door open.', effect: { meters: { authority: 4 }, attr: { composure: 1, aggression: 1 }, tag: 'gaffer-wary' }, next: 'sacking' },
        ],
      },
      sacking: {
        id: 'sacking',
        prompt: 'A bad run, boardroom knives, and the manager is sacked on a wet Tuesday. The man who finally saw him is clearing his desk. The incoming boss wants a public show of unity, and the players are being told not to make a fuss on the way out.',
        choices: [
          { id: 'walk-him-out', label: 'Walk him out the front door', desc: 'Defy the club, honour the man', outcome: 'He ignores the memo, carries the old man’s boxes to the car in front of the cameras, and shakes his hand where everyone can see. Some debts you pay loudly, board or no board.', effect: { meters: { authority: -8, peers: 10, fans: 8 }, attr: { leadership: 2, composure: 1 } } },
          { id: 'private-goodbye', label: 'Say goodbye behind closed doors', desc: 'Keep the peace, keep the bond private', outcome: 'He finds him in the empty office, thanks him for everything out of the cameras’ reach, and promises to visit. The gratitude is no less real for being quiet.', effect: { meters: { authority: 4, family: 6 }, attr: { composure: 2 } } },
        ],
      },
    },
  },

  // 17 — a PARTNER with their own big career (two-body problem)
  {
    id: 'rel-two-body', title: 'Two Careers, One Calendar', icon: '📅', category: 'relationship',
    minTurn: 70, maxTurn: 185, weight: 3, first: 'clash',
    beats: {
      clash: {
        id: 'clash',
        prompt: 'She’s a surgeon on the brink of a post she’s worked fifteen years for — in a city eight hundred miles from his club. They’ve been doing planes and hotel weekends for a year, and the pretence that it’s sustainable is wearing thin. One of them, it seems, has to shrink to fit the other.',
        choices: [
          { id: 'back-her', label: 'Put her career first this time', desc: 'She’s bent to his for years — his turn', outcome: 'He tells her to take the post and starts quietly asking his agent about clubs near her hospital. For once the football moves for the marriage, not the other way round.', effect: { meters: { partner: 18, agent: -4 }, attr: { composure: 2, leadership: 1 }, tag: 'her-turn' }, next: 'balance' },
          { id: 'ask-her-wait', label: 'Ask her to wait one more year', desc: 'His peak years are shorter than a surgeon’s', outcome: 'He makes the case that his window closes first, and she agrees to defer — but he sees the dream she’s parking, and the guilt rides shotgun all season.', effect: { meters: { partner: -6 }, attr: { aggression: 1 }, form: 0.05, tag: 'his-turn' }, next: 'balance' },
        ],
      },
      balance: {
        id: 'balance',
        prompt: 'However it landed, the strain has taught them both that neither can be the moon to the other’s planet forever. Over a late kitchen-table wine, she asks the real question: how do two big lives actually share one home?',
        choices: [
          { id: 'build-system', label: 'Build a real system', desc: 'Shared diary, protected days, ironclad rules', outcome: 'They map the season and her rota onto one wall calendar and ring-fence the days that are sacred. It’s unromantic as hell, and it saves them — a partnership of equals, run like one.', effect: { meters: { partner: 16, family: 6 }, attr: { teamwork: 2, composure: 1 } } },
          { id: 'coast-hope', label: 'Trust love to sort it out', desc: 'They’ll figure it out as they go, like always', outcome: 'They toast to muddling through and leave the details to fate, because they always have. It works, mostly — until the next clash, which they both quietly know is coming.', effect: { meters: { partner: 6 }, attr: { composure: 1 } } },
        ],
      },
    },
  },

  // 18 — FALLOUT then RECONCILIATION with an old teammate
  {
    id: 'rel-old-teammate-reconcile', title: 'Ten Years of Not Speaking', icon: '🕰️', category: 'relationship',
    minTurn: 100, maxTurn: 200, weight: 2, first: 'reunion',
    beats: {
      reunion: {
        id: 'reunion',
        prompt: 'A decade ago a title slipped away, a dressing-room blame-storm turned ugly, and he and his old strike partner said things that ended a brotherhood. Now a testimonial throws them into the same room for the first time since. The old friend catches his eye across the buffet and doesn’t look away.',
        choices: [
          { id: 'cross-room', label: 'Cross the room first', desc: 'Be the bigger man, offer the hand', outcome: 'He walks over before he can talk himself out of it and says the sorry he’s owed for ten years. The old friend’s face crumples, and two stubborn men finally put it down.', effect: { meters: { peers: 14, fans: 4 }, attr: { leadership: 2, composure: 1 }, tag: 'olive-branch' }, next: 'rebuild' },
          { id: 'stay-cold', label: 'Keep his distance', desc: 'Ten years of silence don’t undo in an evening', outcome: 'He nods once, coldly, and keeps to his side of the room, pride still sitting where the friendship used to. He leaves early, and the knot in his chest travels home with him.', effect: { meters: { peers: -4 }, attr: { aggression: 1, composure: 1 }, tag: 'still-cold' }, next: 'rebuild' },
        ],
      },
      rebuild: {
        id: 'rebuild',
        prompt: 'Weeks later the old teammate rings out of the blue — he’s starting a coaching venture for kids from their old estate and there’s a place in it with his name on. It’s a hand extended, and a test of whether ten years can really be crossed.',
        choices: [
          { id: 'join-him', label: 'Say yes and mean it', desc: 'Rebuild the partnership off the pitch', outcome: 'He signs on, and the two of them stand on a windswept training ground again, older and softer, doing something that matters. The best partnerships, it turns out, get a second half.', effect: { meters: { peers: 16, fans: 6 }, attr: { teamwork: 2, leadership: 1 } } },
          { id: 'well-wish', label: 'Wish him well from afar', desc: 'Peace made — but not a business partner', outcome: 'He tells him he’s proud of him and means it, but keeps the venture at arm’s length. The friendship is mended; he’s just learned to guard how much he pours into it.', effect: { meters: { peers: 8 }, attr: { composure: 2 } } },
        ],
      },
    },
  },

  // 19 — taking a TROUBLED YOUNG PRO under his wing
  {
    id: 'rel-troubled-youngster', title: 'The Talent on the Edge', icon: '🎢', category: 'relationship',
    minTurn: 105, maxTurn: 195, weight: 2, first: 'trouble',
    beats: {
      trouble: {
        id: 'trouble',
        prompt: 'The most gifted teenager the club has produced in years is also its biggest headache — late for training, wrong crowd, a red-top scandal every fortnight. The manager’s ready to sell before he self-destructs. He recognises the wildness; he was nearly that kid once.',
        choices: [
          { id: 'adopt-him', label: 'Take him on personally', desc: 'Vouch for him, pull him close, be accountable', outcome: 'He stands up in front of the manager and stakes his own name on the boy, then drags him to breakfast every morning whether he likes it or not. A reckless gamble on a kid worth saving.', effect: { meters: { authority: -4, peers: 8 }, attr: { leadership: 2, teamwork: 1 }, tag: 'saving-kid' }, next: 'relapse' },
          { id: 'warn-once', label: 'Give him one straight warning', desc: 'Tell him the truth once, then let it be his choice', outcome: 'He pulls the lad aside and tells him exactly where this road ends, having half-walked it himself, then steps back. You can hold a door open; you can’t shove someone through it.', effect: { meters: { peers: 4 }, attr: { leadership: 1, composure: 1 }, tag: 'warned-kid' }, next: 'relapse' },
        ],
      },
      relapse: {
        id: 'relapse',
        prompt: 'It goes wrong before it goes right — a 3am call, the boy in bother again, everything he tried to build looking like a waste. The kid is on the line, terrified, asking for the one person who didn’t give up on him.',
        choices: [
          { id: 'show-up', label: 'Get in the car', desc: 'Show up, no lecture, just be there', outcome: 'He drives out into the dark and gets the boy home, and this time the lesson finally takes. Sometimes a young man just needs to learn that someone will always come. The kid turns the corner for good.', effect: { meters: { peers: 14, fans: 6, authority: 6 }, attr: { leadership: 2, composure: 1 }, form: 0.05 } },
          { id: 'hand-off', label: 'Hand him to the professionals', desc: 'Love isn’t enough — get him real help', outcome: 'He gets the boy to people trained for this rather than trying to be a saviour he isn’t. It feels like letting go — but it’s the wisest thing he does, and the kid slowly mends.', effect: { meters: { peers: 8, authority: 4 }, attr: { composure: 2, leadership: 1 } } },
        ],
      },
    },
  },

  // 20 — a GODCHILD/NEPHEW he coaches on the quiet
  {
    id: 'rel-godchild-coach', title: 'Sunday Mornings in the Park', icon: '⚽', category: 'relationship',
    minTurn: 90, maxTurn: 190, weight: 2, first: 'talent',
    beats: {
      talent: {
        id: 'talent',
        prompt: 'His late best friend’s son — his godson, ten years old and football-mad — turns out to have a genuine spark, and no dad around to nurture it. On his days off, quietly, no cameras, he’s started meeting the boy in the park with a bag of balls.',
        choices: [
          { id: 'commit', label: 'Commit to every Sunday', desc: 'Rain or shine, be the man his dad would’ve been', outcome: 'He guards those Sunday mornings like fixtures, teaching the boy the game and, without saying it, standing in a gap a good man left behind. It becomes the truest hour of his week.', effect: { meters: { family: 14, peers: 4 }, attr: { teamwork: 1, leadership: 1 }, tag: 'godson-coach' }, next: 'crossroads' },
          { id: 'get-him-scouted', label: 'Fast-track him to an academy', desc: 'Open the doors his talent deserves', outcome: 'He makes a quiet call and gets the boy a proper trial at a proper club, giving him the leg-up his dad never could. The lad’s buzzing — and something in it feels rushed.', effect: { meters: { family: 8, authority: 2 }, attr: { leadership: 1 }, tag: 'godson-scouted' }, next: 'crossroads' },
        ],
      },
      crossroads: {
        id: 'crossroads',
        prompt: 'A big academy offers the boy a place — but it means residential digs, a hard road, and the childhood his own father was robbed of ending early. The lad’s mum asks him, as the closest thing to a dad the boy has, what he honestly thinks she should do.',
        choices: [
          { id: 'protect-childhood', label: 'Tell her to let him be a kid', desc: 'The game will still be there at sixteen', outcome: 'He advises her to keep the boy home and let him love the game before it becomes a job. Fewer men would turn a talent down for a childhood — he does it without blinking.', effect: { meters: { family: 16 }, attr: { composure: 2, leadership: 1 } } },
          { id: 'chase-dream', label: 'Back the big move', desc: 'Give him the shot the boy is desperate for', outcome: 'He tells her the boy has to try, and promises to be there for every wobble along the way. He signs up to be the steady hand through a road he knows is brutal.', effect: { meters: { family: 10, peers: 2 }, attr: { leadership: 1, teamwork: 1 } } },
        ],
      },
    },
  },

  // 21 — a MEDIA PUNDIT who used to be his teammate
  {
    id: 'rel-pundit-expartner', title: 'The Voice in the Gantry', icon: '🎙️', category: 'relationship',
    minTurn: 95, maxTurn: 200, weight: 2, first: 'roasted',
    beats: {
      roasted: {
        id: 'roasted',
        prompt: 'An old teammate — who shared a room with him on a hundred away trips — has retired into punditry, and this Monday he takes him apart on live television: past it, a liability, time to walk away. The words sting more coming from a man who once knew his heart.',
        choices: [
          { id: 'call-him', label: 'Call him, not the papers', desc: 'Sort it man to man, off the record', outcome: 'He rings him that night and asks, plainly, what happened to loyalty. The old friend admits the gantry made him forget the dressing room, and they clear the air like grown men.', effect: { meters: { peers: 10 }, attr: { composure: 2, leadership: 1 }, tag: 'pundit-truce' }, next: 'proof' },
          { id: 'answer-pitch', label: 'Answer him on the grass', desc: 'Say nothing — let the football talk', outcome: 'He bites his tongue in every interview and pours the anger into his game instead. The next month is the best football he’s played in years, every touch a rebuttal.', effect: { meters: { fans: 6, peers: -2 }, attr: { aggression: 2, composure: 1 }, form: 0.06, tag: 'pundit-feud' }, next: 'proof' },
        ],
      },
      proof: {
        id: 'proof',
        prompt: 'He wins the big one — the trophy that shuts every doubter up — and the cameras find him at the whistle. In the gantry, the old teammate is waiting for a word, knowing full well what he said in the autumn. This is the moment to shape how the story is told.',
        choices: [
          { id: 'gracious', label: 'Be gracious on air', desc: 'No gloating — reach across the divide', outcome: 'He tells the nation the criticism made him better and thanks his old mate for the fire. Grace, on the biggest stage, wins him more than the trophy ever could.', effect: { meters: { fans: 12, peers: 8, sponsors: 6 }, attr: { leadership: 2, composure: 1 } } },
          { id: 'remind-him', label: 'Remind him, live, of every word', desc: 'Let the man eat his autumn column on air', outcome: 'He looks down the lens and repeats the pundit’s own words back at him, and the studio squirms. It’s deliciously satisfying — and it costs a friendship he half-wanted back.', effect: { meters: { fans: 8, peers: -6 }, attr: { aggression: 1, composure: 1 }, form: 0.05 } },
        ],
      },
    },
  },

  // 22 — HOMESICKNESS eased by a countryman in the squad
  {
    id: 'rel-countryman', title: 'A Voice from Home', icon: '🧳', category: 'relationship',
    minTurn: 45, maxTurn: 150, weight: 3, first: 'lonely',
    beats: {
      lonely: {
        id: 'lonely',
        prompt: 'Six months into a move abroad and he’s drowning quietly — a language he can’t crack, food that tastes of nowhere, a phone full of a home eight hours behind. Then the club signs a lad from his own city, who greets him in the accent he grew up with and something in his chest finally unclenches.',
        choices: [
          { id: 'lean-in', label: 'Cling to the familiar', desc: 'Home cooking, home tongue, a brother abroad', outcome: 'They cook the food of home in a foreign kitchen and rattle away in dialect nobody around can follow. For the first time since he landed, the homesickness loosens its grip.', effect: { meters: { peers: 12, family: 6 }, attr: { composure: 2, teamwork: 1 }, form: 0.05, tag: 'homesick-eased' }, next: 'adapt' },
          { id: 'stay-brave', label: 'Force himself to integrate', desc: 'Lean on the countryman, but push into the new', outcome: 'He takes the comfort but makes himself sit with the local lads too, wrestling the language a phrase at a time. Harder, lonelier some nights — but he’s building a life, not a bubble.', effect: { meters: { peers: 8, authority: 4 }, attr: { composure: 1, leadership: 1 }, tag: 'integrating' }, next: 'adapt' },
        ],
      },
      adapt: {
        id: 'adapt',
        prompt: 'A year on, the countryman — his lifeline — gets an offer to go back home, and asks him straight: should he stay for the friendship, or take the move that’s right for his own family? The answer will cost one of them something either way.',
        choices: [
          { id: 'send-home', label: 'Tell him to go home', desc: 'Family over friendship — send him back', outcome: 'He tells him to take it, that no mate is worth another man’s homesickness, and hides how much he’ll miss the only voice from home. The bigger the love, the easier the letting go.', effect: { meters: { peers: 14, family: 4 }, attr: { leadership: 1, composure: 2 } } },
          { id: 'ask-stay', label: 'Admit he needs him here', desc: 'Be honest about how much it would hurt', outcome: 'He swallows his pride and tells the truth — that he’s not sure he’d cope without him — and the lad chooses to stay one more year. It’s selfish, and it’s human, and he’s grateful.', effect: { meters: { peers: 10, family: 2 }, attr: { teamwork: 2 }, form: 0.05 } },
        ],
      },
    },
  },

  // 23 — a PUBLIC PROPOSAL / WEDDING clash with the season
  {
    id: 'rel-proposal-clash', title: 'A Ring and a Fixture List', icon: '💍', category: 'relationship',
    minTurn: 60, maxTurn: 180, weight: 3, first: 'plan',
    beats: {
      plan: {
        id: 'plan',
        prompt: 'He’s got the ring, he’s got the nerve, and he’s got a fixture list that swallows every date worth proposing on. The lads are egging him on to do it on the pitch after a big win — forty thousand people, kiss cam, the lot. She’d either love it or die of embarrassment, and he genuinely can’t tell which.',
        choices: [
          { id: 'grand-gesture', label: 'Do it on the pitch', desc: 'Big win, big screen, down on one knee', outcome: 'He drops to a knee on the centre circle as the stadium roars, and she says yes through tears with the whole world watching. Reckless, romantic, and instantly the club’s favourite clip of the season.', effect: { meters: { partner: 12, fans: 12, sponsors: 8 }, attr: { leadership: 1, composure: 1 }, tag: 'engaged-public' }, next: 'wedding' },
          { id: 'private-moment', label: 'Keep it just for them', desc: 'No crowd — the kitchen, a quiet morning', outcome: 'He does it over coffee in their kitchen with no audience but the kettle, because some moments aren’t for selling. She cries into his shoulder, and it belongs entirely to them.', effect: { meters: { partner: 18, family: 6 }, attr: { composure: 2 }, tag: 'engaged-private' }, next: 'wedding' },
        ],
      },
      wedding: {
        id: 'wedding',
        prompt: 'The only week that works for the wedding collides with a Champions League tie the manager insists is non-negotiable. Two families, a booked venue, and a gaffer with folded arms — something has to bend, and everyone’s looking at him to say which.',
        choices: [
          { id: 'wedding-first', label: 'Marry her, miss the tie', desc: 'Tell the gaffer some things come first', outcome: 'He looks the manager in the eye and says he’ll take the fine and the fury, because he only marries her once. He walks down the aisle a man who knows exactly what matters.', effect: { meters: { partner: 20, family: 12, authority: -8 }, attr: { leadership: 2, composure: 1 } } },
          { id: 'move-wedding', label: 'Move the wedding for the club', desc: 'Reschedule the day, play the tie', outcome: 'They shift the whole thing to the summer and he plays the game of his life on what should’ve been his wedding night. She forgives him — and quietly files it away with the rest.', effect: { meters: { partner: -6, authority: 10 }, attr: { aggression: 1, composure: 1 }, form: 0.06, tag: 'wedding-delayed' } },
        ],
      },
    },
  },
];
