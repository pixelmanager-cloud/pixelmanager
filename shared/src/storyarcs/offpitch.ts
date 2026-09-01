import type { StoryArc } from '../storyarc.js';

// OFFPITCH arcs — the life around the football: fame, money, media, temptation, identity. Move fame/greed/earnings.
export const OFFPITCH_ARCS: StoryArc[] = [
  {
    id: 'media-storm', title: 'Back Page Storm', icon: '📰', category: 'offpitch',
    minTurn: 46, maxTurn: 110, weight: 2, first: 'open',
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
    minTurn: 46, maxTurn: 113, weight: 2, first: 'open',
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
    minTurn: 50, maxTurn: 110, weight: 2, first: 'open',
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
          { id: 'deliver', label: 'Let the football answer', desc: 'Wear them Saturday and put on a show', outcome: 'He laces the new boots and turns in a man-of-the-match display. The advert looks like a documentary.', effect: { market: 3, form: 0.1, attr: { flair: 2 }, meters: { fans: 8, sponsors: 5 } } },
          { id: 'milk', label: 'Ride the hype circuit', desc: 'Store openings, signings, more shoots', outcome: 'He spends the week smiling for phones and misses two proper sessions. The buzz is deafening; the legs are heavy.', effect: { earnings: 350, market: 2, greed: 2, form: -0.15, attr: { stamina: -1 }, meters: { sponsors: 6, authority: -3 } } },
        ],
      },
    },
  },
  {
    id: 'off-documentary', title: 'All Access', icon: '🎬', category: 'offpitch',
    minTurn: 47, maxTurn: 113, weight: 2, first: 'open',
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
    minTurn: 53, maxTurn: 116, weight: 2, first: 'open',
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
    id: 'off-nightlife', title: 'The Table in the Corner', icon: '🍸', category: 'offpitch',
    minTurn: 56, maxTurn: 105, weight: 2, first: 'open',
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
    minTurn: 46, maxTurn: 107, weight: 2, first: 'open',
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
    minTurn: 56, maxTurn: 116, weight: 2, first: 'open',
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
    minTurn: 59, maxTurn: 116, weight: 2, first: 'open',
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
    minTurn: 62, maxTurn: 116, weight: 2, first: 'open',
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
  {
    id: 'off-videogame', title: 'Cover Star', icon: '🎮', category: 'offpitch',
    minTurn: 56, maxTurn: 113, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The people behind the biggest football game on earth want his face on the box — every shop window, every loading screen, forty million copies. It’s the kind of fame money can’t manufacture, but the motion-capture week lands slap in the middle of pre-season.',
        choices: [
          { id: 'accept', label: 'Take the cover', desc: 'Global icon status, mocap and all', outcome: 'He spends a week in a dotted suit pretending to score, and by autumn his face is on every shelf from Seoul to São Paulo.', effect: { earnings: 700, market: 5, greed: 2, form: -0.1, meters: { sponsors: 9, fans: 6 }, tag: 'cover-star' }, next: 'ratings' },
          { id: 'defer', label: 'Do it in the off-season', desc: 'Say yes, but protect the pre-season', outcome: 'He negotiates the shoot into June so nothing touches his training. Smaller splash on timing, sharper legs.', effect: { earnings: 500, market: 3, meters: { sponsors: 5, authority: 3 } } },
          { id: 'decline', label: 'Leave it for the superstars', desc: 'A cover is a crown he hasn’t earned', outcome: 'He tells them he’d rather be worth the box than just be on it. The developers respect the refusal, oddly.', effect: { greed: -2, form: 0.05, meters: { authority: 4, peers: 3 } } },
        ],
      },
      ratings: {
        id: 'ratings',
        prompt: 'Launch week, and the game’s player ratings drop him two points from last year. The internet decides the cover star is overrated, and the memes write themselves faster than he can play.',
        choices: [
          { id: 'silence-pitch', label: 'Answer on the pitch', desc: 'Let a hat-trick edit the rating', outcome: 'He says nothing and buries a Saturday hat-trick instead. The devs quietly patch his numbers up by Monday.', effect: { market: 3, form: 0.1, attr: { composure: 1 }, meters: { fans: 8, authority: 4 } } },
          { id: 'meltdown', label: 'Fire back online', desc: 'Post the stats, name the analysts', outcome: 'He argues with strangers about pace ratings at midnight. It trends, it looks small, and the manager sees it.', effect: { market: 2, greed: 1, form: -0.1, meters: { fans: -3, authority: -4 } } },
        ],
      },
    },
  },
  {
    id: 'off-crypto', title: 'The Whitepaper', icon: '🪙', category: 'offpitch',
    minTurn: 46, maxTurn: 110, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A slick founder in an unstructured blazer wants him fronting a new crypto coin — a fee up front, a bag of tokens, one promo post to his millions. The whitepaper is forty pages of words that don’t quite become sentences.',
        choices: [
          { id: 'shill', label: 'Post the promo', desc: 'Bank the fee, tweet the token', outcome: 'He fires off one glossy post and the coin moons for a fortnight. Easy money, and a queue of fans piling in on his word.', effect: { earnings: 600, market: 2, greed: 3, meters: { fans: -4, sponsors: 3 }, tag: 'shilled-coin' }, next: 'rug' },
          { id: 'invest-quiet', label: 'Invest, don’t endorse', desc: 'Put in his own money, keep it private', outcome: 'He puts a modest punt in with his own cash and keeps his name off it. His risk, nobody else’s.', effect: { earnings: -100, greed: 2, form: -0.05, meters: { agent: -2 } } },
          { id: 'bin-it', label: 'Bin the blazer', desc: 'Won’t sell a coin he can’t explain', outcome: 'He hands the whitepaper back and says he’ll not point his fans at something he doesn’t understand. Sound instinct.', effect: { greed: -2, form: 0.05, meters: { fans: 5, agent: 3, authority: 3 }, tag: 'sound-money' } },
        ],
      },
      rug: {
        id: 'rug',
        prompt: 'Three weeks later the coin collapses to nothing overnight — the founder’s wallet drained, his blazer and his socials both deleted. The fans who followed him in are furious, and the press has the receipts.',
        choices: [
          { id: 'refund', label: 'Make it right', desc: 'Refund the fee, apologise publicly', outcome: 'He gives back every penny of the fee and posts a proper mea culpa. It stings the wallet but saves the trust.', effect: { earnings: -600, greed: -3, meters: { fans: 6, authority: 3 }, attr: { leadership: 1 } } },
          { id: 'deny-crypto', label: 'Not my problem', desc: 'Claim he was misled, keep the fee', outcome: 'He insists he was a victim too and keeps the cheque. The lawyers may agree; the terrace does not.', effect: { market: -2, greed: 1, form: -0.1, meters: { fans: -10, sponsors: -4 } } },
        ],
      },
    },
  },
  {
    id: 'off-restaurant', title: 'Front of House', icon: '🍽️', category: 'offpitch',
    minTurn: 62, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He’s always fancied a place of his own — white tablecloths, his name over the door, a table permanently kept for the lads. A restaurateur mate has the site and the chef; all it needs is his money and his face.',
        choices: [
          { id: 'flagship', label: 'Open a flagship', desc: 'Big site in the city, his name, all in', outcome: 'He sinks a fortune into leather booths and an open kitchen. Opening night is a red carpet; the overheads are a monster.', effect: { earnings: -400, market: 3, greed: 1, form: -0.05, meters: { sponsors: 4, partner: -2 }, tag: 'restaurateur' }, next: 'review' },
          { id: 'silent', label: 'Be a silent backer', desc: 'Money in, name off the door', outcome: 'He bankrolls a slice and lets the pros run it without his face on the menu. Cleaner, quieter, less to go wrong.', effect: { earnings: -200, market: 1, meters: { agent: 3 } } },
          { id: 'no-thanks', label: 'Keep eating out', desc: 'Restaurants ruin footballers and marriages', outcome: 'He decides he’d rather be a regular than a landlord and keeps his weekends free. No headaches, no staff rotas.', effect: { greed: -1, form: 0.05, meters: { partner: 4, family: 3 } } },
        ],
      },
      review: {
        id: 'review',
        prompt: 'A famously vicious critic slips in unannounced and files a two-star hatchet job — “a footballer’s ego with a wine list.” It’s all anyone at the training ground wants to talk about.',
        choices: [
          { id: 'fix-it', label: 'Roll up his sleeves', desc: 'New chef, new menu, take the notes', outcome: 'He swallows his pride, changes the kitchen, and quietly invites the critic back. Six months on it’s booked out for weeks.', effect: { earnings: 200, market: 2, greed: -1, meters: { sponsors: 3 }, attr: { composure: 1 } } },
          { id: 'war-critic', label: 'Go to war with the critic', desc: 'Blast the review, ban them for life', outcome: 'He posts a furious rebuttal and bars the critic from the door. It makes headlines and makes the place a punchline.', effect: { market: 2, greed: 1, form: -0.1, meters: { fans: -3, sponsors: -3 } } },
        ],
      },
    },
  },
  {
    id: 'off-autobiography', title: 'The Tell-All', icon: '📖', category: 'offpitch',
    minTurn: 90, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A publisher waves a six-figure advance for his life story, ghostwritten and out by Christmas. The catch is what sells: they want the dressing-room feuds, the manager who froze him out, the night it all nearly went wrong.',
        choices: [
          { id: 'tell-all', label: 'Spill everything', desc: 'Name names, settle scores, sell copies', outcome: 'He hands the ghost every grudge he’s ever held. It flies off the shelves and sets three phones ringing with lawyers on the line.', effect: { earnings: 500, market: 4, greed: 2, form: -0.1, meters: { peers: -10, authority: -5, fans: 4 }, tag: 'burned-bridges' }, next: 'serialised' },
          { id: 'gracious', label: 'Tell it with grace', desc: 'Honest, warm, nobody knifed', outcome: 'He writes the story straight, generous even about the men who wronged him. It sells steadily and everyone comes off well.', effect: { earnings: 300, market: 2, meters: { peers: 6, authority: 4, fans: 3 }, attr: { leadership: 1 } } },
          { id: 'wait', label: 'Not while he’s playing', desc: 'The book can wait for the boots', outcome: 'He tells the publisher to come back when he’s retired and the dust has settled. The advance stays on the table.', effect: { greed: -1, form: 0.05, meters: { peers: 3, authority: 3 } } },
        ],
      },
      serialised: {
        id: 'serialised',
        prompt: 'A tabloid buys the serialisation rights and rips the juiciest chapter out of context across four days of back pages. A former teammate he actually likes is collateral damage, and the man isn’t answering his texts.',
        choices: [
          { id: 'apologise-mate', label: 'Go and make peace', desc: 'Drive over, apologise face to face', outcome: 'He turns up on the doorstep unannounced and eats humble pie in person. It’s awkward, but the friendship survives it.', effect: { market: -1, meters: { peers: 7, authority: 2 }, attr: { teamwork: 1 } } },
          { id: 'ride-sales', label: 'Ride the sales', desc: 'Let the serialisation run, watch it chart', outcome: 'He lets the paper keep printing and watches the book hit number one. The royalties are lovely; the friendship is not.', effect: { earnings: 250, market: 2, greed: 2, meters: { peers: -8, fans: -2 } } },
        ],
      },
    },
  },
  {
    id: 'off-reality-tv', title: 'Prime Time', icon: '📺', category: 'offpitch',
    minTurn: 50, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A Saturday-night entertainment show wants him as a guest — the good sofa, the primetime slot, a bit where he takes penalties against a comedian in a chicken suit. His agent says it’ll make him a household name beyond the back pages.',
        choices: [
          { id: 'go-on', label: 'Do the show', desc: 'Charm the sofa, become telly-famous', outcome: 'He’s a natural — warm, funny, self-deprecating — and by Monday grandmothers who’ve never watched football know his name.', effect: { earnings: 200, market: 4, greed: 1, meters: { fans: 8, sponsors: 5 }, tag: 'telly-friendly' }, next: 'panel' },
          { id: 'straight-bat', label: 'Keep it to football', desc: 'Do a serious sit-down instead, no chicken suit', outcome: 'He picks a proper interview over the light-entertainment circus and comes across as thoughtful. Smaller audience, better reputation.', effect: { market: 2, meters: { authority: 4, fans: 3 } } },
          { id: 'no-tv', label: 'Stay off the box', desc: 'He’s a footballer, not a turn', outcome: 'He turns the sofa down flat and lets his football do the talking. Some call it dull; the manager calls it professional.', effect: { greed: -1, form: 0.05, meters: { authority: 4 } } },
        ],
      },
      panel: {
        id: 'panel',
        prompt: 'The offers pour in off the back of it — a panel show, a celebrity cook-off, a reality format that would have him living in a villa for six weeks in the summer. His profile has never been hotter, nor his diary emptier of football.',
        choices: [
          { id: 'one-off', label: 'Pick one, keep it light', desc: 'A single fun spot, nothing that eats the summer', outcome: 'He does one cheerful cameo and politely bins the rest. He stays likeable without ever becoming a full-time celebrity.', effect: { earnings: 150, market: 2, meters: { fans: 4, authority: 2 } } },
          { id: 'villa', label: 'Chase the fame', desc: 'Sign the villa show, become a personality', outcome: 'He signs up for six weeks in the sun and the whole nation votes on his love life. The fee is huge; pre-season is a rumour.', effect: { earnings: 500, market: 4, greed: 3, form: -0.15, meters: { sponsors: 6, authority: -6, partner: -5 } } },
        ],
      },
    },
  },
  {
    id: 'off-kit-warband', title: 'The Bidding War', icon: '⚔️', category: 'offpitch',
    minTurn: 53, maxTurn: 113, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His boot contract is up, and two rival kit giants are now openly outbidding each other for his feet. One offers eye-watering money; the other offers less but a genuine seat at the design table and a decade-long partnership.',
        choices: [
          { id: 'top-dollar', label: 'Take the biggest cheque', desc: 'Whoever pays most, wins the feet', outcome: 'He signs with the highest bidder and the number leaks within the hour. Career-defining money, and a sponsor who now owns his calendar.', effect: { earnings: 800, market: 4, greed: 3, form: -0.05, meters: { sponsors: 10, agent: 4 }, tag: 'big-boot-deal' }, next: 'clause' },
          { id: 'partnership', label: 'Take the partnership', desc: 'Less cash, real say, ten years', outcome: 'He picks the long game over the big number and shakes on a decade. The brand builds him a legacy, not just an advert.', effect: { earnings: 400, market: 3, meters: { sponsors: 6, authority: 4 }, attr: { leadership: 1 } } },
          { id: 'stay-loyal', label: 'Re-sign with the current lot', desc: 'Loyalty over the auction', outcome: 'He waves off the bidding war and stays with the brand that backed him early. They reward the loyalty and mean it.', effect: { earnings: 300, greed: -1, form: 0.05, meters: { sponsors: 5, fans: 3 } } },
        ],
      },
      clause: {
        id: 'clause',
        prompt: 'The lawyers surface an appearance clause buried in the mega-deal: a punishing minimum of promo days a year, and a fixture-week photo shoot the manager will detest. The money was real; so are the strings.',
        choices: [
          { id: 'renegotiate', label: 'Fight the clause', desc: 'Send it back, protect the football', outcome: 'He digs in and forces the promo days down to something humane. The brand grumbles; the manager quietly thanks him.', effect: { earnings: -100, meters: { sponsors: -3, authority: 4 }, attr: { composure: 1 } } },
          { id: 'honour', label: 'Honour every day of it', desc: 'Signed is signed — do the shoots', outcome: 'He works every promo day to the letter, fixture weeks and all. The sponsors adore him; his legs feel the mileage.', effect: { earnings: 200, market: 2, greed: 1, form: -0.1, meters: { sponsors: 6, authority: -3 } } },
        ],
      },
    },
  },
  {
    id: 'off-tax-scheme', title: 'The Wheeze', icon: '🧾', category: 'offpitch',
    minTurn: 59, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A wealth adviser to half the dressing room pitches a “perfectly legal” film-financing scheme that magically shrinks his tax bill to almost nothing. Everyone’s in it, he says. The brochure gleams; something about it hums wrong.',
        choices: [
          { id: 'pay-tax', label: 'Just pay the tax', desc: 'Boring, clean, sleep at night', outcome: 'He tells the adviser he’ll pay what he owes like a grown-up. A bigger bill now, and no envelope from the taxman later.', effect: { earnings: -200, greed: -2, meters: { agent: 3, family: 3, authority: 3 }, attr: { composure: 1 }, tag: 'clean-books' } },
          { id: 'dip-in', label: 'Put a little in', desc: 'Small stake, test the water', outcome: 'He hedges — a modest amount into the scheme, the rest above board. Half-clever, and half-exposed if it turns.', effect: { earnings: 150, greed: 2, form: -0.05, meters: { agent: -2 }, tag: 'in-the-scheme' }, next: 'letter' },
          { id: 'go-heavy', label: 'Shelter the lot', desc: 'Everyone’s doing it — pile in', outcome: 'He shovels a fortune into the wheeze and pockets the “saving.” The number looks glorious right up until it doesn’t.', effect: { earnings: 400, greed: 3, form: -0.1, meters: { agent: -4, family: -2 }, tag: 'in-the-scheme' }, next: 'letter' },
        ],
      },
      letter: {
        id: 'letter',
        prompt: 'Two years on, a brown envelope lands: the taxman has ruled the whole scheme abusive and wants every penny back, with interest, and a headline naming the footballers involved.',
        choices: [
          { id: 'settle-fast', label: 'Settle and apologise', desc: 'Pay it all back, get ahead of the story', outcome: 'He pays the bill in full and puts out a plain statement before the papers can frame it. Expensive, but the wound closes clean.', effect: { earnings: -450, greed: -2, market: -1, meters: { fans: 2, authority: 2 }, attr: { composure: 1 } } },
          { id: 'fight-hmrc', label: 'Fight it in the courts', desc: 'Lawyer up, drag it out for years', outcome: 'He lawyers up and the case grinds on, his name in the papers every quarter. He might win; the reputation loses regardless.', effect: { earnings: -300, market: -2, form: -0.1, greed: 1, meters: { fans: -6, sponsors: -4 } } },
        ],
      },
    },
  },
  {
    id: 'off-exhibition-tour', title: 'The Circus', icon: '✈️', category: 'offpitch',
    minTurn: 62, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His agent has stitched together a lucrative winter exhibition tour — three continents in ten days, friendlies against local sides for enormous appearance fees. The money is silly. So are the flight times and the pitches.',
        choices: [
          { id: 'full-tour', label: 'Do the whole circus', desc: 'Every leg, every fee, every red-eye', outcome: 'He does all three continents and banks a small fortune. He comes home jet-lagged, tight-hamstringed, and a step slow for a month.', effect: { earnings: 700, market: 3, greed: 3, form: -0.15, energy: -10, meters: { agent: 6, authority: -5 }, tag: 'road-weary' }, next: 'twinge' },
          { id: 'one-leg', label: 'Do a single leg', desc: 'One appearance, home for the rest', outcome: 'He picks the one date that makes sense and flies straight home. A tidy fee, no wrecked body, an agent slightly sulking.', effect: { earnings: 300, market: 1, meters: { agent: -1, authority: 2 } } },
          { id: 'rest-instead', label: 'Rest through the window', desc: 'Use the break to recover, not to earn', outcome: 'He turns the whole tour down and spends the window resting and rehabbing niggles. His January self will thank his December self.', effect: { greed: -2, form: 0.1, energy: 8, meters: { authority: 4, family: 4 } } },
        ],
      },
      twinge: {
        id: 'twinge',
        prompt: 'On the final leg, on a bobbling pitch in stifling heat, he feels a twinge in the hamstring stretching for a meaningless goal. The physio back home is not going to be pleased.',
        choices: [
          { id: 'pull-out', label: 'Pull out and ice it', desc: 'Sit the last game, fly home to the physio', outcome: 'He limps off at half-time, refunds part of the fee, and gets it scanned the moment he lands. Caught early, it’s only a scare.', effect: { earnings: -150, energy: 4, meters: { authority: 3 }, attr: { composure: 1 } } },
          { id: 'play-on', label: 'Play the fee out', desc: 'Finish the game, the money’s contracted', outcome: 'He grits through the ninety to honour the fee, and the twinge becomes a tear on the flight home. A costly kind of professional.', effect: { earnings: 100, greed: 1, form: -0.15, injury: true, meters: { authority: -4, agent: -3 } } },
        ],
      },
    },
  },
  {
    id: 'off-club-invest', title: 'The Non-League Punt', icon: '🏟️', category: 'offpitch',
    minTurn: 90, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The struggling non-league club from his hometown — the one his grandad watched from the terrace — is up for sale before it folds. For the price of a nice car he could own it. It would never make him a penny, and everyone back home would know his name forever.',
        choices: [
          { id: 'buy-in', label: 'Buy the club', desc: 'Save the hometown side, become the owner', outcome: 'He buys it, fixes the roof, and stands in the away end like a fan again. It drains money and fills something the money never could.', effect: { earnings: -400, market: 2, greed: -3, meters: { family: 8, fans: 8, authority: 4 }, attr: { leadership: 1 }, tag: 'club-owner' }, next: 'boardroom' },
          { id: 'sponsor', label: 'Sponsor, don’t own', desc: 'Cover the shortfall, skip the boardroom', outcome: 'He quietly underwrites their season without taking the keys. The club survives; his weekends stay his own.', effect: { earnings: -150, greed: -1, meters: { family: 4, fans: 4 } } },
          { id: 'stay-out', label: 'Let it be someone else’s dream', desc: 'Owning a club is a career, not a hobby', outcome: 'He decides a footballer can’t run a football club and keeps his focus on his own pitch. Sensible; a little sad.', effect: { greed: 1, form: 0.05, meters: { family: -3, authority: 2 } } },
        ],
      },
      boardroom: {
        id: 'boardroom',
        prompt: 'Halfway through the season the manager he inherited is sinking the club toward relegation, and the old-timers on the board want him to swing the axe. It’s a call that would eat his week and test whether he can be ruthless with people.',
        choices: [
          { id: 'back-manager', label: 'Back the manager', desc: 'Loyalty and patience over panic', outcome: 'He gives the gaffer money and time instead of the sack, and a late run keeps them up by a point. Nerve held, faith rewarded.', effect: { market: 1, greed: -1, meters: { peers: 4, authority: 4 }, attr: { leadership: 1 } } },
          { id: 'let-it-drain', label: 'Let it consume him', desc: 'Micro-manage every crisis himself', outcome: 'He can’t stop meddling and spends match weeks glued to his club’s spreadsheets. His own form dips as his ownership grows.', effect: { earnings: -100, form: -0.1, meters: { family: -2, authority: -2 } } },
        ],
      },
    },
  },
  {
    id: 'off-watch-ambassador', title: 'Time Piece', icon: '⌚', category: 'offpitch',
    minTurn: 56, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A storied Swiss watchmaker wants him as a global ambassador — a wrist on their campaigns, a seat at the yacht-week launches, a drawer of timepieces worth more than his first car. Old money, quiet class, and a whiff of a world he wasn’t born into.',
        choices: [
          { id: 'ambassador', label: 'Wear the crown', desc: 'Sign as global face, embrace the glamour', outcome: 'He fronts the campaign in a linen suit on a Riviera balcony, and suddenly he’s in a different tax bracket of fame. The watches keep coming.', effect: { earnings: 600, market: 4, greed: 2, meters: { sponsors: 8 }, tag: 'watch-face' }, next: 'flaunt' },
          { id: 'wear-quietly', label: 'Take the deal, skip the yachts', desc: 'Sign, but keep it low-key', outcome: 'He signs the contract but ducks the champagne circuit, wearing the watch to training instead of on a superyacht. Grounded glamour.', effect: { earnings: 400, market: 2, meters: { sponsors: 4, partner: 2 } } },
          { id: 'not-me', label: 'That’s not his world', desc: 'He’s a lad from the estate, not a yacht', outcome: 'He decides the whole scene fits him like someone else’s suit and turns it down. Stays exactly who he was. ', effect: { greed: -2, form: 0.05, meters: { family: 4, fans: 3 } } },
        ],
      },
      flaunt: {
        id: 'flaunt',
        prompt: 'A magazine spread frames him dripping in the brand’s gold on a superyacht, and it lands the same week the club’s season-ticket prices rise. On the terraces where he grew up, the optics are dreadful.',
        choices: [
          { id: 'balance-image', label: 'Show the other side', desc: 'Back it with a visible bit of grounded graft', outcome: 'He balances the gloss with a low-key visit to the food bank his mum uses and lets that be the story instead. The mood settles.', effect: { market: 1, greed: -1, meters: { fans: 6, family: 4 }, attr: { leadership: 1 } } },
          { id: 'lean-in', label: 'Lean into the luxury', desc: 'More yachts, more gold, own the flash', outcome: 'He doubles down on the champagne lifestyle and the spreads keep coming. The sponsors love the image; the Kop starts to cool.', effect: { earnings: 200, market: 3, greed: 3, form: -0.05, meters: { fans: -6, sponsors: 5 } } },
        ],
      },
    },
  },
  {
    id: 'off-viral-advert', title: 'The Advert', icon: '🎥', category: 'offpitch',
    minTurn: 47, maxTurn: 113, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A soft-drink brand wants him for a big-budget advert with a concept that’s either genius or humiliating — him singing an old pop hit in a supermarket while doing keepy-ups. Directed properly it could go viral; directed badly it could haunt him forever.',
        choices: [
          { id: 'commit', label: 'Fully commit to the bit', desc: 'Sing it, sell it, no half measures', outcome: 'He throws himself in with zero shame, and the daft charm of it is undeniable. It racks up a hundred million views in a week.', effect: { earnings: 400, market: 5, greed: 1, meters: { fans: 9, sponsors: 7 }, tag: 'viral-advert' }, next: 'aftermath' },
          { id: 'tone-down', label: 'Do it, but rein it in', desc: 'Keep some dignity, less singing', outcome: 'He waters the concept down until it’s safe and mildly forgettable. Nobody laughs, but nobody laughs at him either.', effect: { earnings: 300, market: 2, meters: { sponsors: 4 } } },
          { id: 'refuse-advert', label: 'Refuse to be a punchline', desc: 'Won’t risk becoming a meme', outcome: 'He decides the downside isn’t worth the fee and passes. His dignity intact, his agent’s spreadsheet less so.', effect: { greed: -1, form: 0.05, meters: { agent: -2, authority: 3 } } },
        ],
      },
      aftermath: {
        id: 'aftermath',
        prompt: 'The advert is everywhere — brilliant, but now the whole ground sings the jingle at him whenever he touches the ball, opposition fans loudest of all. It’s affectionate, mostly, and just a little bit maddening.',
        choices: [
          { id: 'embrace-jingle', label: 'Play along with it', desc: 'Celebrate a goal with the keepy-up bit', outcome: 'He answers the chants by scoring and doing the advert’s move as a celebration. The whole thing tips from mockery into legend.', effect: { market: 3, form: 0.1, attr: { flair: 2 }, meters: { fans: 8, peers: 3 } } },
          { id: 'let-it-rattle', label: 'Let it get under his skin', desc: 'Snap at the singing, look rattled', outcome: 'He lets the endless jingle needle him and it shows in his touch. A silly advert quietly costing him his rhythm.', effect: { market: 1, form: -0.1, meters: { fans: -2, authority: -2 } } },
        ],
      },
    },
  },
  {
    id: 'off-music-crossover', title: 'The Featured Verse', icon: '🎤', category: 'offpitch',
    minTurn: 50, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A chart-topping rapper he’s become mates with invites him into the studio and the celebrity orbit that comes with it — award-show afterparties, a cameo in a music video, whispers of an actual guest verse. It’s a dazzling world with very late nights.',
        choices: [
          { id: 'dive-in', label: 'Dive into the scene', desc: 'Videos, parties, maybe a verse', outcome: 'He becomes a fixture front-row at every show and the crossover clips do numbers. Glamorous, magnetic, and murder on the sleep schedule.', effect: { earnings: 200, market: 4, greed: 2, form: -0.15, energy: -6, meters: { fans: 6, peers: 4, authority: -5 }, tag: 'celeb-orbit' }, next: 'video-shoot' },
          { id: 'cameo-only', label: 'One cameo, then home', desc: 'A fun appearance, no lifestyle change', outcome: 'He does a single cameo, has a laugh, and is in bed by midnight. A taste of the glamour without the hangover.', effect: { market: 2, meters: { fans: 3, peers: 3 } } },
          { id: 'friend-not-fame', label: 'Keep the mate, skip the scene', desc: 'Value the friendship over the flashbulbs', outcome: 'He stays close to his pal but ducks the circus around him, meeting for quiet dinners instead of loud premieres. Real friendship, no headlines.', effect: { greed: -1, form: 0.05, meters: { peers: 5, partner: 3 } } },
        ],
      },
      'video-shoot': {
        id: 'video-shoot',
        prompt: 'The music video shoot runs until 4am the night before a match, and a paparazzi shot catches him leaving a club with the whole entourage. The manager sees it before he’s even had breakfast.',
        choices: [
          { id: 'apologise-gaffer', label: 'Front the manager', desc: 'Own the lapse, promise it’s a one-off', outcome: 'He walks into the office first thing and admits the timing was daft. The gaffer’s stern but the honesty buys him a pass.', effect: { form: -0.05, meters: { authority: 3 }, attr: { composure: 1 } } },
          { id: 'lifestyle', label: 'Keep living the double life', desc: 'Studio by night, football by day', outcome: 'He insists he can burn the candle at both ends and keeps up the nightlife. The clips stay glorious; his sharpness quietly frays.', effect: { market: 2, greed: 2, form: -0.15, energy: -5, meters: { authority: -6, partner: -4 } } },
        ],
      },
    },
  },
  {
    id: 'off-betting-sponsor', title: 'The House Always Wins', icon: '🎲', category: 'offpitch',
    minTurn: 56, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A betting firm offers a personal sponsorship — his face on the app, a fee that dwarfs his last three boot deals combined. But a lad in his old youth team gambled everything away, and he knows exactly who these ads are aimed at.',
        choices: [
          { id: 'take-money', label: 'Take the money', desc: 'It’s legal, it pays — sign it', outcome: 'He signs and his face lands on every betting slip in the country. The cheque is enormous; a certain kind of fan quietly loses respect.', effect: { earnings: 700, market: 2, greed: 3, meters: { fans: -6, sponsors: 6 }, tag: 'gambling-face' }, next: 'backlash' },
          { id: 'refuse-ethics', label: 'Refuse on principle', desc: 'Won’t sell that to those kids', outcome: 'He turns the money down cold and says why — he’s seen where it ends. The refusal earns a respect no cheque could buy.', effect: { greed: -3, form: 0.05, meters: { fans: 8, family: 5, authority: 4 }, attr: { leadership: 1 }, tag: 'took-a-stand' } },
          { id: 'counter-offer', label: 'Redirect the deal', desc: 'Front their responsible-gambling arm instead', outcome: 'He tells them he’ll only front the safer-gambling campaign, not the come-ons. Less money, and a genuinely clever bit of good.', effect: { earnings: 250, market: 2, greed: -1, meters: { fans: 5, sponsors: 3, authority: 3 } } },
        ],
      },
      backlash: {
        id: 'backlash',
        prompt: 'A hard-hitting documentary on football’s gambling problem uses his advert as its poster image, and campaigners name him at a parliamentary hearing. The money’s banked, but the association is now stuck to him.',
        choices: [
          { id: 'tear-up', label: 'Tear up the contract', desc: 'Walk away, give the fee to addiction charities', outcome: 'He rips up the deal early and hands the fee to gambling-support charities. It costs him a fortune and rebuilds a reputation.', effect: { earnings: -500, greed: -3, market: 1, meters: { fans: 8, authority: 4 }, attr: { leadership: 1 } } },
          { id: 'ride-contract', label: 'See out the contract', desc: 'Signed is signed — ignore the noise', outcome: 'He honours the deal to the last day and lets the criticism wash over him. The money stays; so does the asterisk by his name.', effect: { market: -1, greed: 1, form: -0.05, meters: { fans: -5, sponsors: 4 } } },
        ],
      },
    },
  },
  {
    id: 'off-supplement', title: 'The Green Powder', icon: '🥤', category: 'offpitch',
    minTurn: 62, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Rather than front someone else’s brand, his agent suggests building his own — a range of recovery shakes and green powders with his name and his supposed daily routine on every tub. He’d own it outright; he’d also own whatever it does or doesn’t do.',
        choices: [
          { id: 'build-honest', label: 'Build it properly', desc: 'Real science, real ingredients, no lies', outcome: 'He insists on a proper nutritionist and honest claims, and actually uses the stuff himself. It grows slowly and stands up to scrutiny.', effect: { earnings: 300, market: 3, greed: 1, form: -0.05, meters: { sponsors: 5, fans: 3 }, tag: 'own-brand' }, next: 'claims' },
          { id: 'license-name', label: 'Just license the name', desc: 'Slap his face on it, let others run it', outcome: 'He rents his name to the venture and stays hands-off. Passive money, and a product he can’t fully vouch for.', effect: { earnings: 400, market: 2, greed: 2, meters: { sponsors: 4, agent: 2 }, tag: 'own-brand' }, next: 'claims' },
          { id: 'no-brand', label: 'Not his name on a tub', desc: 'Won’t sell magic dust to teenagers', outcome: 'He decides he doesn’t believe in the stuff enough to sell it and walks away. No revenue stream, no snake oil either.', effect: { greed: -2, form: 0.05, meters: { authority: 3, fans: 2 } } },
        ],
      },
      claims: {
        id: 'claims',
        prompt: 'A watchdog challenges the marketing — one of the powders promises a bit more than the evidence backs up, and a viral thread accuses him of flogging pricey placebo to impressionable kids. The brand’s his name, so the complaint is his face.',
        choices: [
          { id: 'reformulate', label: 'Fix the claims', desc: 'Pull the dodgy line, tighten the science', outcome: 'He orders the overreaching product reformulated and the claims dialled back to what’s true. It dents sales and saves the name.', effect: { earnings: -150, greed: -1, meters: { fans: 5, authority: 3 }, attr: { composure: 1 } } },
          { id: 'defend-hard', label: 'Defend it hard', desc: 'Double down, sell harder, ignore the thread', outcome: 'He backs the marketing and pushes sales even harder. The margins are lovely until the regulator picks up the phone.', effect: { earnings: 200, market: -1, greed: 2, form: -0.05, meters: { fans: -5, sponsors: -2 } } },
        ],
      },
    },
  },
  {
    id: 'off-charity-gala', title: 'The Guest List', icon: '🎩', category: 'offpitch',
    minTurn: 56, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He’s asked to headline a glittering charity gala — auction, black tie, cameras on the red carpet. Then his team notices the event’s biggest donor is a businessman under a cloud of very ugly allegations, seated, of course, right beside him on the top table.',
        choices: [
          { id: 'pull-out', label: 'Pull out quietly', desc: 'Won’t share a table with that', outcome: 'He withdraws before the seating plan leaks and privately tells the organisers why. Awkward for a night, clean for a career.', effect: { greed: -1, form: 0.05, meters: { family: 4, authority: 4 }, attr: { composure: 1 }, tag: 'clean-hands' } },
          { id: 'attend-distance', label: 'Attend but keep him at arm’s length', desc: 'Show up for the cause, avoid the donor', outcome: 'He goes for the charity but manoeuvres himself to the far end of the room and off every photo with the man. A tightrope, walked carefully.', effect: { market: 1, earnings: -50, meters: { fans: 4, authority: 2 } }, next: 'photo' },
          { id: 'headline-anyway', label: 'Headline it regardless', desc: 'It’s for charity — ignore the guest list', outcome: 'He headlines the night and raises a genuine fortune for the cause, donor and all. The money’s real; so is the photo that surfaces.', effect: { earnings: 100, market: 2, greed: 1, meters: { fans: 3, sponsors: 3 }, tag: 'bad-optics' }, next: 'photo' },
        ],
      },
      photo: {
        id: 'photo',
        prompt: 'Sure enough, a photographer catches a single shot of him shaking the donor’s hand, and by morning it’s the picture running with every story about the man’s case. His people are asking how he wants to handle it.',
        choices: [
          { id: 'clarify', label: 'Get ahead of it', desc: 'A clear statement, the money still did good', outcome: 'He puts out a straight statement condemning the allegations and pointing at the charity total. The story loses its teeth by lunchtime.', effect: { market: 1, meters: { fans: 4, authority: 3 }, attr: { leadership: 1 } } },
          { id: 'ignore-photo', label: 'Say nothing and hope', desc: 'Ride it out, let it blow over', outcome: 'He stays silent and the photo does the talking for a fortnight. It fades eventually, but the association lingers a while.', effect: { market: -1, form: -0.05, meters: { fans: -4, sponsors: -2 } } },
        ],
      },
    },
  },
  {
    id: 'off-streaming-channel', title: 'Going Live', icon: '🔴', category: 'offpitch',
    minTurn: 47, maxTurn: 113, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A mate with a ring light and a business plan reckons he should launch his own channel — gaming streams, vlogs from the car park, unfiltered chat straight to a million subscribers. No press officer, no filter, no net.',
        choices: [
          { id: 'go-live', label: 'Build the channel', desc: 'Cameras on, unfiltered, own the audience', outcome: 'He starts streaming late-night gaming sessions and the numbers explode, but the schedule bleeds into his sleep and the club’s comms man twitches.', effect: { earnings: 300, market: 4, greed: 2, form: -0.1, energy: -5, meters: { fans: 8, sponsors: 4, authority: -3 }, tag: 'goes-live' }, next: 'hot-mic' },
          { id: 'ghost-team', label: 'Hire a team to run it', desc: 'Curated content, editors, safe hands', outcome: 'He lets a proper production crew shape the output so nothing goes out raw. Slicker, safer, and a touch less him.', effect: { earnings: 150, market: 2, meters: { fans: 4, agent: 3 } } },
          { id: 'no-channel', label: 'Keep his life off camera', desc: 'His downtime isn’t a broadcast', outcome: 'He decides the last thing he needs is a red dot watching him relax and passes on the whole idea.', effect: { greed: -1, form: 0.05, meters: { partner: 4, authority: 3 } } },
        ],
      },
      'hot-mic': {
        id: 'hot-mic',
        prompt: 'Mid-stream, deep in a game and forgetting the chat is watching, he mutters something sharp about the manager’s tactics. The clip is scissored out and doing the rounds before he’s even logged off.',
        choices: [
          { id: 'apologise-clip', label: 'Own it before it grows', desc: 'Address it straight, ring the gaffer', outcome: 'He pauses the stream, posts a plain apology, and speaks to the manager face to face before training. Handled fast, defused clean.', effect: { form: 0.05, meters: { authority: 4, fans: 3 }, attr: { composure: 1 } } },
          { id: 'lean-content', label: 'Milk it for content', desc: 'Do a whole video reacting to the drama', outcome: 'He turns the leak into its own episode and the views soar, but the dressing room decides he’ll say anything for a click.', effect: { earnings: 100, market: 3, greed: 2, form: -0.1, meters: { peers: -6, authority: -5, fans: 4 } } },
        ],
      },
    },
  },
  {
    id: 'off-esports', title: 'The Roster', icon: '🕹️', category: 'offpitch',
    minTurn: 53, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'An esports outfit wants his name and his money on their org — a founding stake in a competitive gaming team, jerseys with his badge, a bootcamp house full of teenagers who’ve never kicked a ball. His agent smells the next big media vertical; his accountant smells burning cash.',
        choices: [
          { id: 'co-own', label: 'Take a founding stake', desc: 'Buy in big, name on the org, all in', outcome: 'He sinks a serious sum into the roster and turns up to their first LAN like a proud chairman. A whole new world, and a whole new drain on his attention.', effect: { earnings: -300, market: 3, greed: 1, form: -0.05, meters: { fans: 6, sponsors: 4 }, tag: 'esports-owner' }, next: 'grand-final' },
          { id: 'small-angel', label: 'Be a small angel investor', desc: 'A modest cheque, no operational say', outcome: 'He puts a token amount in and lets the actual gamers run it. Skin in the game, none of the headaches.', effect: { earnings: -100, market: 1, meters: { sponsors: 2 } } },
          { id: 'pass-esports', label: 'Stick to the grass', desc: 'One sport at a time is plenty', outcome: 'He decides he barely understands the football calendar as it is and leaves the joysticks to someone else.', effect: { greed: -1, form: 0.05, meters: { authority: 3 } } },
        ],
      },
      'grand-final': {
        id: 'grand-final',
        prompt: 'His roster reaches a grand final that clashes with a crucial match week. The org begs him to fly out and sit in the crowd for the cameras; the manager has already noticed his head is somewhere near a games console.',
        choices: [
          { id: 'stay-focused', label: 'Watch from home', desc: 'Send support, stay with the squad', outcome: 'He sends the lads a video message and stays glued to his own preparation instead. The org sulks; his gaffer nods.', effect: { form: 0.05, meters: { authority: 4, peers: 2 } } },
          { id: 'fly-out', label: 'Fly out for the final', desc: 'Be there in the arena, damn the fixture', outcome: 'He jets across for the spectacle, arrives back jet-lagged the day before kick-off, and plays like a man who slept on a plane.', effect: { earnings: 50, market: 2, greed: 1, form: -0.15, energy: -6, meters: { fans: 4, authority: -5 } } },
        ],
      },
    },
  },
  {
    id: 'off-biopic', title: 'The Silver Screen', icon: '🎞️', category: 'offpitch',
    minTurn: 62, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A film director with awards on his shelf wants him for a cameo in a big-budget sports drama — one scene, a few lines, his face on a cinema poster the size of a house. It’s glamorous, flattering, and a fortnight of his in-season time.',
        choices: [
          { id: 'take-role', label: 'Take the cameo', desc: 'Learn the lines, hit the red carpet', outcome: 'He spends two weeks on set discovering acting is harder than it looks, and his scene actually lands. Hollywood comes calling; his touch goes quiet for a bit.', effect: { earnings: 400, market: 4, greed: 1, form: -0.1, meters: { fans: 6, sponsors: 5 }, tag: 'screen-tested' }, next: 'premiere' },
          { id: 'consult-only', label: 'Consult, don’t act', desc: 'Advise on the football, skip the camera', outcome: 'He offers to make the football look real without stepping in front of the lens himself. Useful, uncredited, undistracting.', effect: { earnings: 100, market: 1, meters: { authority: 3 } } },
          { id: 'decline-role', label: 'Leave acting to actors', desc: 'His stage has grass on it', outcome: 'He tells the director he’d only embarrass himself and stays exactly where he belongs.', effect: { greed: -1, form: 0.05, meters: { authority: 3, peers: 2 } } },
        ],
      },
      premiere: {
        id: 'premiere',
        prompt: 'The premiere lands the night before a fixture, black tie and flashbulbs and an afterparty that runs till dawn. The studio expects their new face; the manager expects him fresh.',
        choices: [
          { id: 'walk-carpet-leave', label: 'Walk the carpet, then vanish', desc: 'Do the photos, skip the party, home early', outcome: 'He does twenty minutes of poses, ducks the champagne, and is asleep before midnight. Professional to the last flashbulb.', effect: { market: 2, meters: { authority: 4, sponsors: 3 }, attr: { composure: 1 } } },
          { id: 'full-hollywood', label: 'Live the Hollywood night', desc: 'Afterparty, the lot, sleep is for civilians', outcome: 'He drinks in the whole glittering night and rolls into training on fumes and a hangover. The photos are stunning; the legs are lead.', effect: { earnings: 50, market: 3, greed: 2, form: -0.15, energy: -7, meters: { fans: 3, authority: -6, partner: -3 } } },
        ],
      },
    },
  },
  {
    id: 'off-fragrance', title: 'The Scent', icon: '🧴', category: 'offpitch',
    minTurn: 56, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A luxury house wants to bottle him — a signature fragrance and grooming range, his bare torso on a department-store column, a name whispered in an advert that cost more than a striker. Vanity, aftershave, and an awful lot of money.',
        choices: [
          { id: 'launch-scent', label: 'Bottle the brand', desc: 'Torso on the billboard, name on the bottle', outcome: 'He poses oiled and brooding for a campaign that plasters him across every perfume hall, and the range shifts by the crate. Peak vanity, peak profile.', effect: { earnings: 500, market: 4, greed: 2, meters: { sponsors: 8, fans: 4 }, tag: 'fragrance-face' }, next: 'sniff-test' },
          { id: 'grooming-only', label: 'Just the grooming line', desc: 'Practical products, keep the shirt on', outcome: 'He does a low-key range of razors and balms and refuses the topless column. Tasteful, tidy, and rather more him.', effect: { earnings: 250, market: 2, meters: { sponsors: 4, partner: 2 } } },
          { id: 'no-scent', label: 'He won’t be a mannequin', desc: 'Not selling himself by the bottle', outcome: 'He decides a footballer oiled up in a shop window isn’t a look he needs and walks away from the lot.', effect: { greed: -1, form: 0.05, meters: { authority: 3, partner: 3 } } },
        ],
      },
      'sniff-test': {
        id: 'sniff-test',
        prompt: 'The topless billboard goes up right by the training ground, and the dressing room is merciless — the nickname writes itself and follows him to every corner and free kick. The banter is affectionate, mostly, but relentless.',
        choices: [
          { id: 'laugh-along', label: 'Laugh along with the lads', desc: 'Bring bottles in, take the ribbing', outcome: 'He hands out samples in the changing room and cops the jokes with a grin. The nickname sticks but so does the goodwill.', effect: { market: 1, meters: { peers: 5, fans: 3 }, attr: { teamwork: 1 } } },
          { id: 'get-precious', label: 'Get precious about it', desc: 'Bristle at the mockery, sulk in the corner', outcome: 'He takes the ribbing badly and snaps at a teammate over it, and suddenly the joke has teeth. A silly billboard souring a good room.', effect: { form: -0.05, meters: { peers: -5, authority: -2 } } },
        ],
      },
    },
  },
  {
    id: 'off-paparazzi', title: 'The Long Lens', icon: '📸', category: 'offpitch',
    minTurn: 86, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A photographer with a lens like a drainpipe has been parked outside his house for a week, papping his partner on the school run and his kids in the garden. The pictures aren’t scandalous — they’re just his family, sold by the frame, and he’s had enough.',
        choices: [
          { id: 'confront', label: 'Confront him at the gate', desc: 'Words on the doorstep, tell him to move', outcome: 'He marches out and has it out with the snapper, and of course a second lens catches him red-faced and jabbing a finger. The row becomes the story.', effect: { market: 2, form: -0.05, meters: { partner: 4, fans: -2, authority: -3 }, tag: 'lost-rag' }, next: 'front-page' },
          { id: 'legal-route', label: 'Go the legal route', desc: 'Privacy lawyers, harassment order, calmly', outcome: 'He says nothing and lets solicitors slap a harassment notice on the man. Slower, costlier, and it holds up.', effect: { earnings: -100, meters: { partner: 6, family: 5 }, attr: { composure: 1 } } },
          { id: 'grin-bear', label: 'Grin and bear it', desc: 'It comes with the territory — ignore him', outcome: 'He tells his partner to keep her head down and treats the lens as furniture. It works, but the resentment simmers at home.', effect: { meters: { partner: -3, fans: 1 } } },
        ],
      },
      'front-page': {
        id: 'front-page',
        prompt: 'The finger-jabbing photo runs on the front page under a headline calling him a hot-headed hypocrite. A charity for press freedom wants a word; his partner just wants the whole thing to stop.',
        choices: [
          { id: 'turn-story', label: 'Turn it into a cause', desc: 'Speak up for family privacy, calmly and well', outcome: 'He gives one measured interview about kids and long lenses, and public sympathy swings hard his way. A bad photo turned into a fair point.', effect: { market: 1, meters: { fans: 6, family: 5, partner: 4 }, attr: { leadership: 1 } } },
          { id: 'feud-on', label: 'Keep the feud burning', desc: 'Trade barbs with the paper for a fortnight', outcome: 'He keeps sparring publicly with the tabloid and it keeps the pictures selling. The war entertains everyone but the people in his house.', effect: { market: 2, greed: 1, form: -0.05, meters: { partner: -6, fans: -2 } } },
        ],
      },
    },
  },
  {
    id: 'off-supercars', title: 'The Garage', icon: '🏎️', category: 'offpitch',
    minTurn: 53, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The first big cheque cleared and now there’s a dealer on the phone every week — a matte-black hypercar, a limited run, delivered on a flatbed with a bow. The garage could become a gallery. The fans on the food-bank end of town might not see it that way.',
        choices: [
          { id: 'collect', label: 'Build the collection', desc: 'One of everything, engines and all', outcome: 'He fills a warehouse with growling metal and posts the walk-round, and the timeline splits between envy and eye-rolls. Beautiful machines, tricky optics.', effect: { earnings: -400, market: 3, greed: 3, meters: { fans: -4, peers: 3 }, tag: 'petrolhead' }, next: 'speeding' },
          { id: 'one-toy', label: 'Just the one dream car', desc: 'A single indulgence, kept sensible', outcome: 'He buys the one car he genuinely loves and stops there, garaging it more than he drives it. A treat, not a habit.', effect: { earnings: -150, market: 1, greed: 1, meters: { partner: 2 } } },
          { id: 'sensible-car', label: 'Keep driving the sensible one', desc: 'Money in the bank, not on the drive', outcome: 'He keeps the same understated motor and quietly invests the rest. Nobody films a man in a five-year-old estate.', effect: { greed: -2, form: 0.05, meters: { family: 4, authority: 3 }, tag: 'sound-money' } },
        ],
      },
      speeding: {
        id: 'speeding',
        prompt: 'Inevitably, a speed camera catches one of them doing a frankly heroic number on a dual carriageway, and the story writes itself alongside a photo of the whole gleaming fleet. Points, a fine, and a lecture from the club’s image people.',
        choices: [
          { id: 'contrite', label: 'Take it on the chin', desc: 'Plead guilty, apologise, sell a car for charity', outcome: 'He pays the fine, does the driving-awareness course without complaint, and auctions one motor for a road-safety charity. Contrition well spent.', effect: { earnings: 100, greed: -2, market: 1, meters: { fans: 5, authority: 3 }, attr: { composure: 1 } } },
          { id: 'no-lesson', label: 'Shrug it off', desc: 'Pay the fine, keep the foot heavy', outcome: 'He treats the fine as a rounding error and is snapped speeding again within the month. The club’s patience thins visibly.', effect: { market: 1, greed: 1, form: -0.05, meters: { authority: -5, fans: -3 } } },
        ],
      },
    },
  },
  {
    id: 'off-political-endorsement', title: 'The Rosette', icon: '🗳️', category: 'offpitch',
    minTurn: 62, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'An election is looming and a party’s people come courting hard — they want him on a platform, a photo with the candidate, that famous face lending them a bit of the terrace. Half his fans vote one way, half the other, and every one of them is watching.',
        choices: [
          { id: 'endorse', label: 'Pin on the rosette', desc: 'Back the candidate, share a stage', outcome: 'He stands on the platform and says the words, and instantly he’s a hero to one half of the ground and a traitor to the other. Football just got political.', effect: { market: 3, greed: 1, form: -0.05, meters: { fans: -4, sponsors: -3, authority: 2 }, tag: 'took-a-side' }, next: 'fallout' },
          { id: 'issue-not-party', label: 'Back a cause, not a party', desc: 'Champion the issue, skip the rosette', outcome: 'He declines the party but throws his weight behind the actual issue they were fighting over. Principled, and much harder to weaponise.', effect: { market: 1, meters: { fans: 4, authority: 4 }, attr: { leadership: 1 } } },
          { id: 'stay-neutral', label: 'Stay out of it', desc: 'His job is football, not politics', outcome: 'He tells them politely that he’ll not tell anyone how to vote and keeps the dressing room a neutral country.', effect: { greed: -1, form: 0.05, meters: { peers: 4, authority: 3 } } },
        ],
      },
      fallout: {
        id: 'fallout',
        prompt: 'The candidate he backed gets caught saying something ugly on a hot mic, and now his own smiling face is stapled to it in every share and screenshot. His people are asking whether he stands by the man or cuts him loose.',
        choices: [
          { id: 'distance', label: 'Condemn and distance', desc: 'Denounce the remark, step well back', outcome: 'He puts out a firm statement disowning the comment and makes clear it isn’t what he signed up for. The damage scabs over.', effect: { market: 1, meters: { fans: 3, authority: 3 }, attr: { composure: 1 } } },
          { id: 'loyal-error', label: 'Stand by him regardless', desc: 'Loyalty over the storm, ride it out', outcome: 'He defends the candidate out of stubborn loyalty and the association hardens around him. A costly lesson in whose hand you shake.', effect: { market: 2, greed: 1, form: -0.1, meters: { fans: -6, sponsors: -4 } } },
        ],
      },
    },
  },
  {
    id: 'off-mansion-build', title: 'Planning Permission', icon: '🏗️', category: 'offpitch',
    minTurn: 82, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He’s bought a slab of green-belt land and drawn up plans for a dream home — pool, cinema, a five-a-side barn out back. Then the parish council digs in, the neighbours form a residents’ association, and the local paper decides a footballer’s mansion is front-page news.',
        choices: [
          { id: 'fight-plan', label: 'Fight the objections', desc: 'Barristers, appeals, build it as drawn', outcome: 'He lawyers the plans through appeal after appeal and eventually wins, but the village now hates the sight of him and the saga drags for a year.', effect: { earnings: -300, market: 2, greed: 2, form: -0.05, meters: { fans: -3, family: -2, authority: -2 }, tag: 'planning-war' }, next: 'neighbours' },
          { id: 'compromise', label: 'Work with the council', desc: 'Scale it back, plant trees, win them round', outcome: 'He trims the design, hires a local architect, and takes the neighbours a scale model over tea. Slower, cheaper on goodwill, and it gets built.', effect: { earnings: -150, meters: { family: 4, authority: 3 }, attr: { composure: 1 } } },
          { id: 'buy-elsewhere', label: 'Buy something already built', desc: 'Skip the war, buy a finished house', outcome: 'He decides the fight isn’t worth a decade of grudges and buys a done-up place across the county instead.', effect: { earnings: -200, greed: -1, form: 0.05, meters: { partner: 4 } } },
        ],
      },
      neighbours: {
        id: 'neighbours',
        prompt: 'Construction traffic churns the lane to mud, a protest banner goes up on the church railings, and a viral clip shows a pensioner in wellies calling him a wrecker of the countryside. The club’s community team would rather he weren’t a villain in his own village.',
        choices: [
          { id: 'mend-fences', label: 'Mend fences literally', desc: 'Fix the lane, fund the village hall roof', outcome: 'He resurfaces the churned lane at his own cost and quietly pays for the village hall roof, and the banners come down. Bridges rebuilt with tarmac.', effect: { earnings: -100, greed: -1, market: 1, meters: { fans: 5, family: 4 }, attr: { leadership: 1 } } },
          { id: 'wall-up', label: 'Build the wall higher', desc: 'Gates, hedges, shut the village out', outcome: 'He answers the protest with taller gates and denser hedging and simply stops speaking to the place. Peace of a cold, resented kind.', effect: { earnings: -150, greed: 1, meters: { fans: -3, family: -2 } } },
        ],
      },
    },
  },
  {
    id: 'off-dressing-room-dance', title: 'The Trend', icon: '💃', category: 'offpitch',
    minTurn: 46, maxTurn: 110, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The squad’s youngest lads have a little dressing-room dance they film after every win, and this week they’ve dragged him into the middle of it, phone already rolling. It’s daft, it’s harmless, and it’s about to be seen by ten million people if he lets it post.',
        choices: [
          { id: 'go-viral', label: 'Nail the dance', desc: 'Commit, learn the steps, let it fly', outcome: 'He throws himself into the routine with unexpected rhythm and the clip detonates online overnight. Suddenly the veteran is the most relatable man in the league.', effect: { market: 4, greed: 1, meters: { fans: 8, peers: 6 }, attr: { flair: 2 }, tag: 'dance-viral' }, next: 'brand-calls' },
          { id: 'awkward-cameo', label: 'Do it, badly, on purpose', desc: 'Shuffle through it, laugh it off', outcome: 'He plants himself and does a deliberately hopeless dad-dance, and the wholesome awkwardness of it charms everyone anyway.', effect: { market: 2, meters: { fans: 4, peers: 4 } } },
          { id: 'wave-off', label: 'Wave the camera away', desc: 'Leave the dancing to the kids', outcome: 'He grins, ruffles a young lad’s hair, and ducks out of frame. No clip, no fuss, dignity fully intact.', effect: { form: 0.05, meters: { peers: 3, authority: 2 } } },
        ],
      },
      'brand-calls': {
        id: 'brand-calls',
        prompt: 'Off the back of the viral clip, brands are queuing up to have him do the dance in their adverts, and a chat show wants it live. It’s a lot of money for a jig, but a captain doing sponsored TikToks all week is a certain kind of look.',
        choices: [
          { id: 'keep-it-pure', label: 'Keep it just for the lads', desc: 'Turn the brands down, keep it dressing-room only', outcome: 'He tells the sponsors the dance belongs to the squad, not a soft-drink account, and the fans respect him twice as hard for it.', effect: { market: 1, greed: -1, meters: { fans: 6, peers: 5, authority: 3 } } },
          { id: 'cash-the-dance', label: 'Cash in on the moment', desc: 'Monetise every wiggle while it’s hot', outcome: 'He flogs the routine to three brands in a week and films sponsored versions between sessions. The money’s quick; the shine wears off just as fast.', effect: { earnings: 250, market: 2, greed: 3, form: -0.1, meters: { peers: -3, authority: -3, sponsors: 5 } } },
        ],
      },
    },
  },
];
