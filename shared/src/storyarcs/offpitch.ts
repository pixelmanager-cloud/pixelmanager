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
  {
    id: 'off-boot-launch', title: 'The Signature Boot', icon: '👟', category: 'offpitch',
    minTurn: 110, maxTurn: 185, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A kit giant wants to build a signature boot around his name — his colourway, his silhouette stitched into the tongue. The design team wants him in a studio for a week of fittings and film.',
        choices: [
          { id: 'allin', label: 'Go all in on the design', desc: 'Own every detail — make it truly his', outcome: 'He obsesses over the studlings and the leather until it feels like an extension of his foot. Marketing goes feral.', effect: { earnings: 500, market: 4, greed: 1, form: -0.05, meters: { sponsors: 9 }, tag: 'boot-owner' }, next: 'reveal' },
          { id: 'lend', label: 'Lend the name, skip the studio', desc: 'Sign off remotely, keep training uninterrupted', outcome: 'He rubber-stamps the mock-ups over a video call and drives straight back to the training ground.', effect: { earnings: 300, market: 2, meters: { sponsors: 4 } }, next: 'reveal' },
          { id: 'pass', label: 'Not ready to be a brand', desc: 'A signature boot is for legends — earn it first', outcome: 'He tells them to come back when the medals justify it. Humble, and quietly the right call.', effect: { greed: -1, form: 0.05, meters: { authority: 3, fans: 4 } } },
        ],
      },
      reveal: {
        id: 'reveal',
        prompt: 'Launch day. The boot drops with a slick film of him ghosting past defenders in slow motion. The stock sells out by teatime, and now everyone expects him to play like the advert.',
        choices: [
          { id: 'deliver', label: 'Let the football answer', desc: 'Wear them Saturday and put on a show', outcome: 'He laces the new boots and turns in a man-of-the-match display. The advert looks like a documentary.', effect: { market: 3, form: 0.1, attr: { flair: 1 }, meters: { fans: 8, sponsors: 5 } } },
          { id: 'milk', label: 'Ride the hype circuit', desc: 'Store openings, signings, more shoots', outcome: 'He spends the week smiling for phones and misses two proper sessions. The buzz is deafening; the legs are heavy.', effect: { earnings: 350, market: 2, greed: 2, form: -0.15, attr: { stamina: -1 }, meters: { sponsors: 6, authority: -3 } } },
        ],
      },
    },
  },
  {
    id: 'off-documentary', title: 'All Access', icon: '🎬', category: 'offpitch',
    minTurn: 105, maxTurn: 190, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A streaming giant pitches a fly-on-the-wall documentary — cameras in the dressing room, the kitchen, the physio table. Total access, a fat fee, and no promise about how the edit paints him.',
        choices: [
          { id: 'open-up', label: 'Let them in properly', desc: 'Raw and honest — trust the story', outcome: 'He hands over the keys to his life. It could canonise him or filet him; either way it will be watched by millions.', effect: { earnings: 600, market: 5, greed: 1, meters: { sponsors: 7, partner: -4 }, tag: 'mic-on' }, next: 'edit' },
          { id: 'staged', label: 'Only the shiny bits', desc: 'Curated access, PR minder on set', outcome: 'He gives them the training-ground montage and nothing near his front door. Safe, glossy, a touch hollow.', effect: { earnings: 350, market: 2, meters: { sponsors: 4, partner: 1 } } },
          { id: 'decline', label: 'Keep the door shut', desc: 'His private life isn’t content', outcome: 'He turns down the cameras flat. Some call it precious; those close to him call it wise.', effect: { greed: -2, meters: { partner: 6, family: 5 } } },
        ],
      },
      edit: {
        id: 'edit',
        prompt: 'The rough cut lands. The producers have leaned hard on a dressing-room row and a raw moment with his family — gripping television, but not quite the man he thinks he is.',
        choices: [
          { id: 'fight-edit', label: 'Fight for the edit', desc: 'Demand changes, protect the people in it', outcome: 'He wrangles the producers for a fairer cut and shields his family from the worst of it. Costs him goodwill on set.', effect: { market: 1, meters: { partner: 7, family: 6, sponsors: -3 }, attr: { leadership: 1 } } },
          { id: 'let-run', label: 'Let it run', desc: 'Drama sells — take the numbers', outcome: 'He lets the tears and the temper stay in. It trends worldwide and the dinner table goes quiet for a week.', effect: { earnings: 200, market: 4, greed: 2, form: -0.05, meters: { fans: 6, partner: -8, family: -5 } } },
        ],
      },
    },
  },
  {
    id: 'off-foundation', title: 'The Foundation', icon: '🤝', category: 'offpitch',
    minTurn: 115, maxTurn: 195, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He grew up on a estate where the cages had no nets and the coaches had no budget. His agent floats setting up a foundation to fund pitches back home — real work, real time, no cheque coming back.',
        choices: [
          { id: 'hands-on', label: 'Build it hands-on', desc: 'His name, his time, his childhood streets', outcome: 'He pours money and weekends into it, laying the first bit of astro himself. It grounds him like nothing else.', effect: { earnings: -400, market: 3, greed: -3, meters: { fans: 10, family: 6, authority: 5 }, attr: { leadership: 1 }, tag: 'gives-back' }, next: 'gala' },
          { id: 'cheque', label: 'Write the cheque, delegate the rest', desc: 'Fund it, let others run it', outcome: 'He bankrolls the thing and lets a trust handle the graft. Good done, at arm’s length.', effect: { earnings: -200, market: 2, greed: -1, meters: { fans: 5, sponsors: 2 } } },
          { id: 'later', label: 'Park it for now', desc: 'Football first — charity when the career’s banked', outcome: 'He tells his agent it can wait until the boots are hung up. Understandable, if a little cold.', effect: { greed: 1, meters: { fans: -3, family: -2 } } },
        ],
      },
      gala: {
        id: 'gala',
        prompt: 'A year on, the foundation throws a fundraising gala mid-season. It clashes with a heavy fixture week, and the manager makes a pointed remark about candles and canapés.',
        choices: [
          { id: 'attend', label: 'Show up and speak', desc: 'It’s his cause — stand up for it', outcome: 'He gives a speech that has the room in bits and raises a fortune, then trains bleary the next morning.', effect: { earnings: 300, market: 2, form: -0.1, meters: { fans: 8, authority: -2, family: 4 } } },
          { id: 'send-regrets', label: 'Send a video, stay in bed', desc: 'Rest the legs, film a message', outcome: 'He records a heartfelt clip and gets a proper night’s sleep. The cause survives; his sharpness does too.', effect: { form: 0.05, meters: { fans: 2, authority: 3 } } },
        ],
      },
    },
  },
  {
    id: 'off-nightlife', title: 'Last Orders', icon: '🍸', category: 'offpitch',
    minTurn: 100, maxTurn: 175, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It’s a rare free midweek and the group chat is buzzing — a VIP table, a promoter throwing comps, half the squad already en route. There’s a phone at every angle in that place, and a match on Saturday.',
        choices: [
          { id: 'stay-in', label: 'Stay in', desc: 'Boring wins leagues — early night', outcome: 'He leaves the chat on read and gets his eight hours. Nobody films a man asleep by ten.', effect: { form: 0.1, energy: 5, meters: { authority: 4, partner: 3 } } },
          { id: 'one-drink', label: 'One and done', desc: 'Show face, sip water, leave by eleven', outcome: 'He shows willing, nurses a lime soda, and slips out before it turns. A careful tightrope, walked well.', effect: { market: 1, meters: { peers: 5, partner: -1 } }, next: 'morning' },
          { id: 'big-night', label: 'Off the leash', desc: 'Table service, phones out, let loose', outcome: 'He goes big, and by 3am the videos are already doing numbers. Fun, until it isn’t.', effect: { market: 3, greed: 1, form: -0.15, energy: -8, meters: { peers: 6, fans: -4, authority: -6, partner: -6 }, tag: 'seen-out' }, next: 'morning' },
        ],
      },
      morning: {
        id: 'morning',
        prompt: 'A clip surfaces the next morning — nothing scandalous, just a footballer being a lad — but the phone-in shows are already chewing it over and the gaffer’s office door is open.',
        choices: [
          { id: 'own-it', label: 'Own it to the manager', desc: 'Walk in first, no excuses', outcome: 'He fronts up before he’s summoned, takes the bollocking on the chin, and it’s forgotten by Friday.', effect: { attr: { composure: 1 }, meters: { authority: 5 }, form: 0.05 } },
          { id: 'deny', label: 'Play it down', desc: 'Insist it’s nothing, blame the angle', outcome: 'He shrugs it off and hopes it dies. It mostly does, but the manager files it away.', effect: { market: 1, meters: { authority: -4, peers: 2 } } },
        ],
      },
    },
  },
  {
    id: 'off-social-misstep', title: 'The Deleted Tweet', icon: '📱', category: 'offpitch',
    minTurn: 95, maxTurn: 180, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Twenty minutes after a gutting defeat, thumb still hot, he fires off a post that reads as a dig at a teammate. The likes climb; so does the dread. Screenshots never sleep.',
        choices: [
          { id: 'apologise', label: 'Own it fast', desc: 'Delete, apologise, ring the teammate', outcome: 'He deletes it, phones the lad, and posts a straight apology. Handled like a grown-up before it festers.', effect: { attr: { teamwork: 1 }, market: -1, meters: { peers: 6, fans: 3, authority: 3 } } },
          { id: 'double-down', label: 'Double down', desc: 'Stand by it — honesty’s not a crime', outcome: 'He leaves it up and adds a defiant follow-up. It trends, the dressing room chills, the manager fumes.', effect: { market: 3, greed: 1, form: -0.1, meters: { peers: -8, authority: -5, fans: -3 }, tag: 'loose-thumbs' } },
          { id: 'go-dark', label: 'Hand the phone to the agent', desc: 'Delete it, go quiet, let the noise die', outcome: 'He wipes it and lets his agent run the accounts for a fortnight. Out of sight, slowly out of mind.', effect: { market: -1, meters: { agent: 4, peers: 2 } } },
        ],
      },
    },
  },
  {
    id: 'off-property', title: 'Bricks and Mortar', icon: '🏠', category: 'offpitch',
    minTurn: 120, maxTurn: 195, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A mate-of-a-mate pitches him a property play — a block of new-builds, guaranteed yields, get in before it moves. The numbers dazzle; the paperwork is thin and the man talks very fast.',
        choices: [
          { id: 'due-diligence', label: 'Do it properly', desc: 'Real advisers, real diligence, take the time', outcome: 'He hires a proper firm, picks a boring safe portfolio instead, and sleeps easy while it quietly compounds.', effect: { earnings: -300, greed: -1, meters: { agent: 3, family: 4 }, attr: { composure: 1 }, tag: 'sound-money' } },
          { id: 'punt', label: 'Take the punt', desc: 'Trust the tip, wire the deposit', outcome: 'He wires the lot on a handshake and a glossy brochure. High risk, and the fast-talking man has gone quiet.', effect: { earnings: 200, greed: 3, form: -0.05, meters: { agent: -4, family: -3 }, tag: 'over-exposed' }, next: 'reckoning' },
          { id: 'walk', label: 'Walk away', desc: 'If it sounds too good, it is', outcome: 'He smells the pitch and passes. No windfall, but no 3am cold sweats either.', effect: { greed: -2, meters: { agent: 2 } } },
        ],
      },
      reckoning: {
        id: 'reckoning',
        prompt: 'Six months on, the development stalls — planning refused, the operator dodging calls. His money’s locked in a half-dug hole and the papers have caught the scent.',
        choices: [
          { id: 'lawyer-up', label: 'Fight to claw it back', desc: 'Lawyers, forensic accountants, the lot', outcome: 'He spends more chasing it and recovers a slice. A brutal, expensive lesson in reading the small print.', effect: { earnings: -200, market: -1, meters: { agent: -2, partner: -3 }, attr: { composure: 1 } } },
          { id: 'write-off', label: 'Write it off, move on', desc: 'Chalk it up, protect the head', outcome: 'He swallows the loss and refuses to let it poison his season. Painful, but the football stays clean.', effect: { earnings: -150, form: 0.05, greed: -2, meters: { family: 2 } } },
        ],
      },
    },
  },
  {
    id: 'off-fashion-line', title: 'The Label', icon: '🧥', category: 'offpitch',
    minTurn: 125, maxTurn: 195, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His tunnel fits have become a thing — photographers wait for the walk-in now. A designer friend suggests turning the look into an actual label, his name on the collar. Fashion is a jealous mistress, mind.',
        choices: [
          { id: 'build-brand', label: 'Build it seriously', desc: 'Proper studio, proper drops, his taste', outcome: 'He throws himself into fabrics and fittings and the first drop sells out overnight. A second career flickers into life.', effect: { earnings: 400, market: 4, greed: 1, form: -0.1, meters: { sponsors: 8, partner: -2 }, tag: 'fashion-name' } },
          { id: 'capsule', label: 'One capsule collection', desc: 'A small drop, low commitment, test it', outcome: 'He does a tidy little capsule and keeps it as a hobby, not a job. Enough to scratch the itch without the migraine.', effect: { earnings: 200, market: 2, meters: { sponsors: 4 } } },
          { id: 'just-wear', label: 'Just wear the clothes', desc: 'Style’s a passion, not a business', outcome: 'He decides the walk-in is quite enough and lets someone else run a fashion empire. Keeps his weekends his own.', effect: { greed: -1, form: 0.05, meters: { partner: 3, fans: 2 } } },
        ],
      },
    },
  },
  {
    id: 'off-fan-culture', title: 'Number on the Wall', icon: '🎨', category: 'offpitch',
    minTurn: 130, maxTurn: 195, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Overnight, a mural of him goes up on a gable end near the ground — thirty feet of his celebration, his shirt number already a chant on the Kop. Something has tipped: he isn’t just a player here, he’s folklore.',
        choices: [
          { id: 'embrace', label: 'Embrace the bond', desc: 'Visit the mural, thank the fans, mean it', outcome: 'He turns up unannounced with a can of paint and the artist, and the photo of it goes round the world. The terrace is his forever.', effect: { market: 3, meters: { fans: 12, authority: 4 }, attr: { leadership: 1 }, tag: 'terrace-idol' } },
          { id: 'humble', label: 'Deflect to the team', desc: 'Grateful, but point at the badge not the face', outcome: 'He thanks them warmly and insists the mural should’ve been the whole XI. The fans adore him more for it.', effect: { market: 1, meters: { fans: 8, peers: 5, authority: 3 } } },
          { id: 'cash-in', label: 'Trademark the number', desc: 'Merch the chant, sell the shirt', outcome: 'He moves to trademark his number and flog the merch. The tills ring; some on the terrace mutter about selling the soul.', effect: { earnings: 350, market: 2, greed: 3, meters: { fans: -5, sponsors: 6 } } },
        ],
      },
    },
  },
];
