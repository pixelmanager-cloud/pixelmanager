// Manager-arc authoring pack 04. ONE author owns this file — nobody else writes to it.
// See shared/src/managerarc.ts for the ManagerArc shape, the situation gates and the effect vocabulary.
//
// Category: `club` — the institution, the town, and everybody in the building who is not in the first team.
// The groundsman, the kit man, the academy, the trust, the tea bar, the stand with the wrong name on it.
// This is where a dynasty's history comes from, so `clubLegacy` lives here more than anywhere else.
import type { ManagerArc } from '../managerarc.js';

export const MGR_ARCS_04: ManagerArc[] = [
  // ── the pitch and the man who keeps it ───────────────────────────────────────────────────────────────
  {
    id: 'mgr-groundsman-pitch', title: 'The Man And His Grass', icon: '🌱', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The groundsman has been here since before the manager was born. He would like the training pitches rested for a fortnight. He has said it politely twice and this is the third time.',
        choices: [
          { id: 'rest', label: 'Rest them', desc: 'Train on the astro and take the moaning', outcome: 'Two weeks of hard plastic and sore shins. In April the pitch is the best in the division and everybody has forgotten why.', effect: { squadMorale: -5, prestige: 1, tag: 'mgr-pitch-respected' } },
          { id: 'refuse', label: 'Keep training on them', desc: 'The season is now, the grass is later', outcome: 'By February there is a bald half-circle where the rondos happen. The groundsman stops offering opinions, which is not the same as agreeing.', effect: { squadMorale: 3, prestige: -1 } },
          { id: 'ask', label: 'Ask him what he needs instead', desc: 'Let the man who knows tell you', outcome: 'He wants a second mower and a lad three mornings a week. It costs less than a fortnight of anything else.', effect: { coins: -140, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-flooded-pitch', title: 'Under Water', icon: '🌧️', category: 'club',
    when: { minTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It has rained for nine days. The near corner of the pitch is holding an inch of standing water and the referee is coming at ten. Somebody has brought a fork from home.',
        choices: [
          { id: 'fork', label: 'Fork it and hope', desc: 'Forty volunteers, one morning, a lot of forks', outcome: 'They get the game on. Half the town is stood on the pitch at nine in the morning in wellingtons, and somebody photographs it, and that photograph goes on the wall.', effect: { prestige: 2, coins: -20, clubLegacy: { kind: 'tradition', label: 'the morning the town forked the pitch' } } },
          { id: 'call', label: 'Call it off early', desc: 'Save everybody a wasted day', outcome: 'Sensible, and the away support had already left. They are on the phone about it for a week.', effect: { prestige: -1, coins: -180 } },
          { id: 'drainage', label: 'Spend the money on drainage', desc: 'Fix the corner properly, this summer', outcome: 'A digger, six weeks and a bill that makes the treasurer sit down. The corner never floods again in anybody\'s lifetime.', effect: { coins: -420, boardMood: -1, clubLegacy: { kind: 'reputation', label: 'a ground that never loses a game to weather' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p04-floodlight-failure', title: 'Lights Out', icon: '💡', category: 'club',
    when: { minTier: 5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Sixty-eight minutes in, the far bank of floodlights goes off with a sound like a door shutting. The players stand in the half-dark waiting to be told something.',
        choices: [
          { id: 'wait', label: 'Wait it out on the pitch', desc: 'Keep them warm, keep them out there', outcome: 'Twenty-two minutes in the cold and the lights come back. They lose the thread of the game and a goal with it.', effect: { squadMorale: -6 } },
          { id: 'inside', label: 'Take them in', desc: 'Warm, dry, and out of rhythm', outcome: 'They come back out flat and the away side do not. Somebody in the boardroom says the word "generator" for the first time in eleven years.', effect: { squadMorale: -3, boardMood: -1 } },
          { id: 'replace', label: 'Replace the whole rig in the summer', desc: 'LEDs, a warranty, and a hole in the budget', outcome: 'The new lights are so bright the first night that the old boys in the paddock complain about them. It is the only complaint anyone makes for a decade.', effect: { coins: -500, prestige: 1, clubLegacy: { kind: 'reputation', label: 'the best-lit ground in the division' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-pitch-shared-rugby', title: 'The Other Studs', icon: '🏉', category: 'club',
    when: { minTier: 5, maxCoins: 500 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The rugby club rent the ground on Sundays and it pays for the water bill. It also leaves the middle third looking like a ploughed field by November.',
        choices: [
          { id: 'keep', label: 'Keep taking their money', desc: 'The bills do not care about the surface', outcome: 'The pitch is a disgrace by Christmas and the accounts are the healthiest they have been in years.', effect: { coins: 260, squadMorale: -5 } },
          { id: 'end', label: 'End the arrangement', desc: 'A better pitch, a worse balance sheet', outcome: 'The rugby lads go three miles down the road and take their bar takings with them. The grass comes back beautifully.', effect: { coins: -200, squadMorale: 4, boardMood: -1 } },
          { id: 'split', label: 'Move them to the second pitch', desc: 'Awkward, cheaper, keeps everybody', outcome: 'It takes four meetings and two apologies. Both clubs get most of what they wanted and neither says thank you.', effect: { coins: 120, prestige: 1 } },
        ],
      },
    },
  },

  // ── the kit man, the tea bar, the people ─────────────────────────────────────────────────────────────
  {
    id: 'mgr-kit-man-forty-years', title: 'Forty Years Of Washing', icon: '🧺', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The kit man started here when the shirts were still numbered one to eleven. He has begun leaving early on Thursdays and nobody wants to be the one to ask why.',
        choices: [
          { id: 'ask', label: 'Ask him', desc: 'Sit on the skip and talk about nothing first', outcome: 'His wife is ill. He has not told a soul. The manager reorganises the Thursday rota that afternoon and never mentions it again.', effect: { prestige: 1, squadMorale: 4, tag: 'mgr-looks-after-staff' } },
          { id: 'assistant', label: 'Get him some help', desc: 'A youth-teamer on the washing, quietly', outcome: 'He is insulted for about six days and then relieved. The lad learns more about the club in a month than in three years of coaching.', effect: { coins: -60, squadMorale: 3 } },
          { id: 'retire', label: 'Suggest it might be time', desc: 'Kindly, and far too soon', outcome: 'He says nothing, finishes the week, and hands his keys in on the Friday. The peg with his coat on it stays empty for a year.', effect: { squadMorale: -8, prestige: -2, tag: 'mgr-cold-with-staff' } },
        ],
      },
    },
  },
  {
    id: 'mgr-kit-man-testimonial', title: 'A Night For The Kit Man', icon: '🎟️', category: 'club',
    when: { minSeason: 4 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody in the supporters\' club suggests a testimonial night for the kit man. Not a match. A room above a pub, a raffle, and everybody who ever played here.',
        choices: [
          { id: 'host', label: 'Do it at the ground', desc: 'The main stand lounge, the badge on the tickets', outcome: 'Four hundred people, a raffle that raises more than anybody expected, and an old centre-half crying at the bar. It becomes an annual thing.', effect: { coins: -80, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the kit man\'s night, every January' } } },
          { id: 'attend', label: 'Just turn up and buy a raffle ticket', desc: 'Let the fans own it', outcome: 'He stands at the back for two hours and is home by ten. It is exactly the right amount of interference, which is none.', effect: { prestige: 1 } },
          { id: 'skip', label: 'Send apologies, it is a Tuesday', desc: 'There is a game on Saturday', outcome: 'Nobody says a word about it. It is remembered anyway, in that quiet way small places remember things.', effect: { prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-tea-bar-kettle', title: 'The Tea Bar', icon: '☕', category: 'club',
    when: { minTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The urn in the tea bar has died. The two women who have run it since the eighties have been boiling kettles instead and the queue now stretches past the turnstile.',
        choices: [
          { id: 'buy', label: 'Buy them a proper one', desc: 'Out of the football budget, no forms', outcome: 'It costs less than a set of bibs. They put a hand-written sign on it thanking him, and it is still there four managers later.', effect: { coins: -40, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the sign on the urn in the tea bar' } } },
          { id: 'refurb', label: 'Refurbish the whole kiosk', desc: 'Do it once, do it right', outcome: 'Stainless steel, a second serving hatch, and takings up a third. They miss the old counter and say so every week.', effect: { coins: -260, boardMood: 1 } },
          { id: 'outsource', label: 'Let a catering firm take it on', desc: 'Somebody else\'s problem, somebody else\'s margin', outcome: 'The coffee is better and costs twice as much. The two women are thanked in a newsletter and never come back.', effect: { coins: 300, prestige: -2, tag: 'mgr-outsourced-the-tea' } },
        ],
      },
    },
  },
  {
    id: 'mgr-turnstile-operator', title: 'Gate Four', icon: '🔓', category: 'club',
    when: { minSeason: 2, minTier: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The man on gate four has been letting the same three lads in for nothing since about 2011. The safety officer has finally written it down in a report.',
        choices: [
          { id: 'sack', label: 'Let him go', desc: 'It is theft, however small', outcome: 'It is theft. It is also forty quid a season and thirty years of Saturdays. The gate is manned by an agency lad now and the queue is slower.', effect: { coins: 40, prestige: -1 } },
          { id: 'quiet', label: 'Have a quiet word and bury the report', desc: 'Deal with it in the building', outcome: 'It stops. Nobody upstairs ever hears about it, which is a decision he is choosing to be comfortable with.', effect: { prestige: 1, boardMood: -1, tag: 'mgr-protects-the-staff' } },
          { id: 'formalise', label: 'Give the three lads free season tickets', desc: 'Make the wrong thing an official right thing', outcome: 'It turns out all three have been coming since their dad died. Somebody in the office cries. The club calls it a hardship scheme and quietly gives out nine more.', effect: { coins: -120, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the gate four seats, given away every year' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-club-secretary-paper', title: 'The Woman With The Folders', icon: '🗂️', category: 'club',
    when: { minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club secretary does registrations, fixtures, the lottery and the funerals. She does all of it on paper because the system the league sold them does not work. She is sixty-three.',
        choices: [
          { id: 'system', label: 'Buy a system that works', desc: 'Money now, hours back forever', outcome: 'Three weeks of swearing at a laptop and then it is fine. She finds she has Wednesdays again and does not know what to do with them.', effect: { coins: -180, boardMood: 1 } },
          { id: 'hire', label: 'Hire her an assistant', desc: 'Somebody to learn everything she knows', outcome: 'The assistant lasts. Six years on she is the secretary and still does the funerals on paper, because that bit should be on paper.', effect: { coins: -100, prestige: 1 } },
          { id: 'leave', label: 'Leave it alone', desc: 'It has worked for thirty years', outcome: 'It works for another two. Then she is off for a fortnight with a broken wrist and nobody can find anything at all.', effect: { boardMood: -1 } },
        ],
      },
    },
  },

  // ── the academy and its kids ─────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-academy-release-day', title: 'The Letters', icon: '✉️', category: 'club',
    when: { minSeason: 2, facility: { key: 'youth', min: 3 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nine of the under-sixteens are being released. Somebody has to tell them, and the youth coach has done it for the last four years and has asked, once, not to do it again.',
        choices: [
          { id: 'himself', label: 'Do it himself', desc: 'One at a time, with the parents in the room', outcome: 'It takes a whole day and he is no use to anybody by four o\'clock. Two of the dads shake his hand on the way out. One does not.', effect: { prestige: 2, tag: 'mgr-does-the-hard-bit' }, next: 'after' },
          { id: 'coach', label: 'Let the youth coach do it', desc: 'It is his job and he is good at it', outcome: 'He does it properly, because he always does. He also puts his coaching badges application in that same week.', effect: { prestige: -1 }, next: 'after' },
          { id: 'placement', label: 'Ring round before the letters go', desc: 'Find every one of them somewhere to land', outcome: 'Four days on the phone and seven of the nine have a trial somewhere by the Friday. The other two do not, and he remembers their names for years.', effect: { coins: -40, prestige: 2, clubLegacy: { kind: 'reputation', label: 'a club that finds released boys a club' } }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'One of the released boys is back on the training ground eighteen months later, in another club\'s tracksuit, and plays very well indeed against the lads he grew up with.',
        choices: [
          { id: 'congratulate', label: 'Go and shake his hand after', desc: 'On the pitch, in front of everybody', outcome: 'He is embarrassed and delighted. Every academy parent watching files it away as evidence about what kind of place this is.', effect: { prestige: 1 } },
          { id: 'nothing', label: 'Let him have his day', desc: 'Stay in the technical area', outcome: 'He leaves without a word from anybody at the club he was at for six years. There is nothing wrong with it, exactly.', effect: {} },
        ],
      },
    },
  },
  {
    id: 'mgr-academy-minibus', title: 'The Minibus', icon: '🚐', category: 'club',
    when: { minTier: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The academy minibus has failed its MOT on four counts. Three of the under-fourteens cannot get to training any other way, and one of them lives eleven miles out.',
        choices: [
          { id: 'new', label: 'Buy a new one', desc: 'Money the first team was going to get', outcome: 'It is white and boring and it runs. The three lads keep coming, and one of them is in the first team six years later.', effect: { coins: -300, prestige: 1 } },
          { id: 'fix', label: 'Patch it through another year', desc: 'A welder and an optimistic garage', outcome: 'It passes on the retest and smells of diesel all winter. Nobody enjoys it and everybody gets where they are going.', effect: { coins: -80 } },
          { id: 'parents', label: 'Ask the parents to sort lifts', desc: 'A rota and a group chat', outcome: 'It works for two of the three. The lad eleven miles out drifts away by Christmas and signs for nobody.', effect: { coins: 0, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-youth-coach-poached', title: 'Somebody Wants Your Youth Coach', icon: '🎣', category: 'club',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club two divisions up has offered the under-eighteens coach nearly double. He has told the manager before he told his wife, which says something.',
        choices: [
          { id: 'match', label: 'Find the money', desc: 'Take it out of somewhere that will hurt later', outcome: 'He stays. The scouting budget is halved to do it and nobody outside two offices ever knows why.', effect: { coins: -260, prestige: 1, tag: 'mgr-kept-the-coach' } },
          { id: 'promote', label: 'Offer him the first-team bench instead', desc: 'Less money, more of a life', outcome: 'He takes it. The eighteens are worse for two years and the first team is better for ten.', effect: { squadMorale: 3, prestige: 1 } },
          { id: 'bless', label: 'Tell him to go', desc: 'Drive him to the meeting if he needs a lift', outcome: 'He goes, and rings twice a year for a decade, and sends the club two players it could not otherwise have got near.', effect: { prestige: 1, clubLegacy: { kind: 'reputation', label: 'a club that lets good people leave well' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-academy-vs-first-team', title: 'Whose Money Is It', icon: '⚖️', category: 'club',
    when: { minSeason: 3, minCoins: 300 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is one pot of money and two things to spend it on: a striker who will keep them up this year, or an academy that might produce three players in six.',
        choices: [
          { id: 'striker', label: 'Buy the striker', desc: 'This season is the only one you are judged on', outcome: 'He scores eleven and they finish safe. The academy building keeps its leaking roof and its 1990s gym.', effect: { coins: -400, squadMorale: 6, boardMood: 2 } },
          { id: 'academy', label: 'Spend it on the academy', desc: 'Plant a tree you may not sit under', outcome: 'A roof, a gym, and two full-time coaches. Nobody claps a roof. Three of the boys under it end up worth ten times what it cost.', effect: { coins: -400, boardMood: -2, prestige: 1, clubLegacy: { kind: 'reputation', label: 'a club that grows its own' }, tag: 'mgr-academy-first' } },
          { id: 'split', label: 'Split it', desc: 'Half a striker and half a roof', outcome: 'A loan forward on wages they can just about carry, and the roof done in sections over two summers. Neither thing is quite finished.', effect: { coins: -400, squadMorale: 2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-academy-boy-family', title: 'The Boy Who Stopped Coming', icon: '🚪', category: 'club',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One of the fifteen-year-olds has missed three weeks. The coach has been round twice. There is no car on the drive any more and the boy will not come to the door.',
        choices: [
          { id: 'visit', label: 'Go round himself', desc: 'A first-team manager on a doorstep in the rain', outcome: 'He sits in the front room for an hour with a mother who has not slept. The boy is back on the Tuesday. It is not really about football.', effect: { prestige: 2, tag: 'mgr-goes-round' } },
          { id: 'support', label: 'Put a support package round the family', desc: 'Travel, boots, and a name to ring', outcome: 'The club is not set up for this and does it anyway, badly and well. Two more families use the same thing within a year.', effect: { coins: -100, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the quiet fund for academy families' } } },
          { id: 'release', label: 'Release him', desc: 'The programme cannot carry a ghost', outcome: 'The paperwork takes eight minutes. Everybody agrees it was the right call and nobody in that room feels good about it.', effect: { prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-academy-category-audit', title: 'The Audit', icon: '📋', category: 'club',
    when: { minSeason: 3, minTier: 1, maxTier: 3, facility: { key: 'youth', min: 4 } }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The academy audit is in a fortnight. To keep the grading they need two more full-time staff, a hydrotherapy pool nobody will use, and a document that is currently eleven pages of nothing.',
        choices: [
          { id: 'comply', label: 'Build what the form wants', desc: 'Pool, staff, paperwork, tick, tick, tick', outcome: 'They keep the grading and the funding. The pool is used four times in its first year, all of them by the audit team.', effect: { coins: -520, boardMood: 1 } },
          { id: 'drop', label: 'Let the grading drop', desc: 'Coach better, tick fewer boxes', outcome: 'They lose the funding and a level of access to boys they were never going to keep anyway. Two rival academies stop worrying about them.', effect: { coins: 200, prestige: -1, tag: 'mgr-dropped-category' } },
          { id: 'argue', label: 'Fight the criteria in writing', desc: 'A long letter, a longer meeting', outcome: 'He wins one point out of five, which is one more than anybody has managed before. The rest of it he builds anyway.', effect: { coins: -380, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-academy-schoolboy-poach', title: 'The Boy And The Big Club', icon: '🕊️', category: 'club',
    when: { minSeason: 2, minTier: 3, facility: { key: 'youth', min: 3 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A Premier League academy would like the twelve-year-old. They have been to his school. They have not been to the club, because they do not have to.',
        choices: [
          { id: 'fight', label: 'Fight to keep him', desc: 'Sit with the parents and be honest about minutes', outcome: 'He stays a year longer than he would have and gets three hundred more hours of proper coaching out of it. Then he goes anyway.', effect: { prestige: 1, coins: 120 } },
          { id: 'deal', label: 'Do a deal and let him go', desc: 'Compensation now, a sell-on clause forever', outcome: 'The cheque is modest and the clause is not. Eight years later it pays for a stand roof.', effect: { coins: 260, tag: 'mgr-sell-on-clause' } },
          { id: 'refuse-cooperate', label: 'Refuse to make it easy', desc: 'No release, no meeting, no goodwill', outcome: 'They take him regardless because they always do, and the club has now made an enemy of a place it will need a favour from.', effect: { coins: 60, prestige: -1, clubLegacy: { kind: 'rivalry', label: 'bad blood with a Premier League academy' } } },
        ],
      },
    },
  },

  // ── supporters, trust, tickets ───────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-supporters-trust-seat', title: 'A Seat At The Table', icon: '🤝', category: 'club',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The supporters\' trust has raised enough to buy a small stake and would like a seat on the board. The chairman would like the manager to say publicly that it is a bad idea.',
        choices: [
          { id: 'back', label: 'Back the trust', desc: 'Say it out loud, on the record', outcome: 'The trust gets its seat. The boardroom is colder for him for a year, and the terrace is his for a decade.', effect: { boardMood: -2, prestige: 3, clubLegacy: { kind: 'tradition', label: 'a supporters\' seat on the board' } } },
          { id: 'silent', label: 'Say nothing either way', desc: 'It is not a football matter', outcome: 'It is not a football matter, which is a thing people say when they do not want to answer. Both sides note it.', effect: {} },
          { id: 'chairman', label: 'Back the chairman', desc: 'He is the one who employs you', outcome: 'The stake is bought out at a small profit and the trust folds within two years. The chairman does not forget it. Neither do they.', effect: { boardMood: 2, prestige: -2, tag: 'mgr-fans-distrust' } },
        ],
      },
    },
  },
  {
    id: 'mgr-ticket-price-row', title: 'Twenty-Eight Pounds', icon: '🎫', category: 'club',
    when: { minSeason: 2, minTier: 1, maxTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board has put the cheapest adult ticket up by four pounds. There is a banner about it. The manager is asked about the banner at the Friday press conference.',
        choices: [
          { id: 'defend', label: 'Defend the club', desc: 'Costs, wages, the squad you asked for', outcome: 'It is all true and it lands like a company statement, because that is what it is. The banner is bigger the following week.', effect: { boardMood: 2, prestige: -2 } },
          { id: 'side', label: 'Side with the supporters', desc: 'Say the price is too high, in public', outcome: 'The clip does the rounds all weekend. Upstairs is furious. He is applauded onto the pitch on Saturday by people who have just paid the extra four pounds.', effect: { boardMood: -3, prestige: 3, tag: 'mgr-fans-champion' } },
          { id: 'kids', label: 'Propose free entry for under-twelves', desc: 'Give something back somewhere else', outcome: 'They lose a bit of money and gain nine hundred children. Ten years on, some of them buy season tickets of their own.', effect: { coins: -160, prestige: 2, clubLegacy: { kind: 'tradition', label: 'free entry for under-twelves' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-away-coach-breakdown', title: 'The Coach On The Hard Shoulder', icon: '🚌', category: 'club',
    when: { minTier: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two hundred miles away, the supporters\' coach has broken down on the hard shoulder in the dark. Kick-off is in ninety minutes. The travel secretary is ringing everybody she knows.',
        choices: [
          { id: 'pay', label: 'Pay for a replacement coach', desc: 'Out of club money, tonight', outcome: 'They get in at twenty past eight and miss the first half. Every one of them tells the story for the rest of their lives.', effect: { coins: -180, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the night the club sent a coach for the coach' } } },
          { id: 'refund', label: 'Refund the tickets and send apologies', desc: 'The correct, bloodless answer', outcome: 'Everybody gets their money back and nobody sees the game. It is entirely fair and it satisfies no one.', effect: { coins: -60 } },
          { id: 'players', label: 'Have the players wait for them', desc: 'Ask the referee for a delayed kick-off', outcome: 'The referee says no, the away side say no, and the request is in the papers by Monday as either magnificent or ridiculous.', effect: { prestige: 1, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-fanzine-interview', title: 'The Fanzine', icon: '📰', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The fanzine has been going twenty-two years, is printed at a shop by the station, and has asked for an interview. It is rude about the club roughly every other issue.',
        choices: [
          { id: 'do-it', label: 'Do it, properly', desc: 'An hour, no press officer in the room', outcome: 'It is the best interview he gives all season because the questions are better. Two lines of it are on the club forum for years.', effect: { prestige: 2, boardMood: -1 } },
          { id: 'guarded', label: 'Do it with the press officer sat in', desc: 'Safe, short and useless', outcome: 'They print it in full with a note explaining the conditions, which is more damaging than anything he said.', effect: { prestige: -1 } },
          { id: 'decline', label: 'Decline', desc: 'They were rude about the team sheet in March', outcome: 'The next issue has a blank half-page where the interview would have gone. It is a very effective blank half-page.', effect: { prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-fans-forum-night', title: 'Fans\' Forum', icon: '🎤', category: 'club',
    when: { minSeason: 2, minPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A hundred and forty people in the function room, a roving microphone, and a run of one win in eight. The first hand goes up before he has sat down.',
        choices: [
          { id: 'honest', label: 'Answer everything straight', desc: 'Including the two questions with no good answer', outcome: 'Two and a half hours. He is shredded on the substitutions and he concedes the point, and the room ends up on his side for admitting it.', effect: { prestige: 2, boardMood: -1, tag: 'mgr-straight-with-fans' } },
          { id: 'deflect', label: 'Keep it about effort and belief', desc: 'Say nothing that can be quoted', outcome: 'They clap politely and go home unconvinced. Somebody films the whole thing on a phone and it does not help.', effect: { prestige: -1 } },
          { id: 'players', label: 'Bring two players with him', desc: 'Let them hear it themselves', outcome: 'One of them is superb and one of them is nineteen and out of his depth. The room learns something about both.', effect: { squadMorale: -4, prestige: 1, playerMorale: { who: 'youngest', delta: -6 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-safe-standing-rail', title: 'The Singing Section', icon: '📣', category: 'club',
    when: { minSeason: 3, minTier: 1, maxTier: 3, facility: { key: 'fanzone', min: 3 } }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A group want a rail-seating block behind the goal, all season tickets moved, one price, no allocated seats within it. The safety advisory group has a list of objections as long as your arm.',
        choices: [
          { id: 'build', label: 'Build it', desc: 'Nine hundred seats moved and a lot of letters', outcome: 'The noise in the second half of the first game is unlike anything the ground has produced in twenty years. The letters were worth it.', effect: { coins: -340, prestige: 2, clubLegacy: { kind: 'stand', label: 'the rail block behind the north goal' } } },
          { id: 'trial', label: 'Trial it in one small block', desc: 'Two hundred, one season, see', outcome: 'It works and it is too small, which everybody predicted. It gets bigger in three years and nobody remembers the objections.', effect: { coins: -120, prestige: 1 } },
          { id: 'no', label: 'Leave the ground as it is', desc: 'It is somebody else\'s decision anyway', outcome: 'The group move themselves to the corner and sing there instead, badly served by the acoustics and by the club.', effect: { prestige: -1 } },
        ],
      },
    },
  },

  // ── the town ─────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-food-bank-car-park', title: 'The Van In The Car Park', icon: '🥫', category: 'club',
    when: { minSeason: 2, facility: { key: 'community', min: 2 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A food bank has been collecting outside the ground on matchdays from the back of a van. The commercial manager says it looks bad in front of the sponsors\' entrance.',
        choices: [
          { id: 'inside', label: 'Give them a room inside', desc: 'The old ticket office, keys and all', outcome: 'They are warm and dry and take twice as much. The sponsors, when asked, turn out to be entirely in favour and put a pallet in themselves.', effect: { coins: -20, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the food bank in the old ticket office' } } },
          { id: 'move', label: 'Move them to the far gate', desc: 'Still there, just not there', outcome: 'Collections drop by a third because nobody walks that way. The commercial manager is happy. He is the only one.', effect: { prestige: -2 } },
          { id: 'players', label: 'Put the squad on the van', desc: 'An hour before kick-off, in kit, every home game', outcome: 'It is awkward for two weeks and then it is just what they do. Two players keep doing it after they leave the club.', effect: { squadMorale: 4, prestige: 2, clubLegacy: { kind: 'tradition', label: 'players on the food bank collection before every home game' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-school-partnership', title: 'The Headteacher', icon: '🏫', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A headteacher from the estate behind the ground writes asking if anybody from the club could come in and read to a Year Four class. She apologises twice in the letter for asking.',
        choices: [
          { id: 'go', label: 'Go himself, every fortnight', desc: 'Thursday mornings, no cameras', outcome: 'He is worse at it than the goalkeeper, who takes over in March and is magnificent. It never appears on the club\'s channels once.', effect: { prestige: 2, squadMorale: 3, clubLegacy: { kind: 'tradition', label: 'Thursday mornings at the school behind the ground' } } },
          { id: 'programme', label: 'Build a proper schools programme', desc: 'Four schools, a coach, a budget line', outcome: 'It takes a year to set up and outlives three managers. Nine hundred children a week, and one of them signs professional forms in 2039.', effect: { coins: -240, prestige: 2, boardMood: -1 } },
          { id: 'send', label: 'Send a signed shirt and apologies', desc: 'The season is busy', outcome: 'The shirt goes in a frame in the corridor. The letter is not answered, exactly, and the head does not write again.', effect: { coins: -20, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-derby-day-town', title: 'The Town On Derby Day', icon: '🔥', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The derby is on a Sunday lunchtime and the police want it earlier still. Half the town works with the other half. The market traders have asked if they should bother opening.',
        choices: [
          { id: 'hard', label: 'Talk it up all week', desc: 'Ours, theirs, and what it means', outcome: 'The ground is a wall of noise and the game is a foul-strewn mess they win 1-0. It is talked about in pubs for thirty years.', effect: { squadMorale: 8, prestige: 2, clubLegacy: { kind: 'rivalry', label: 'the derby that shut the market' } } },
          { id: 'calm', label: 'Play it down all week', desc: 'Three points, same as any other', outcome: 'Nobody believes him, including his own players. They start slowly and are lucky to draw.', effect: { squadMorale: -3 } },
          { id: 'joint', label: 'Do a joint statement with the other manager', desc: 'Ask both ends to keep it about football', outcome: 'It is mocked by roughly everybody and there is not a single arrest. He would do it again.', effect: { prestige: 1, clubLegacy: { kind: 'tradition', label: 'the joint derby appeal, read out before kick-off' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-minutes-silence', title: 'A Minute', icon: '🕯️', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A supporter who never missed a home game in fifty-one years has died. The family have asked for a minute\'s silence. The away support have a reputation.',
        choices: [
          { id: 'silence', label: 'A minute\'s silence', desc: 'Ask both ends, and hope', outcome: 'You could hear the traffic. The away end were immaculate and their manager mentions it afterwards, and something between the clubs softens for a decade.', effect: { prestige: 2, clubLegacy: { kind: 'rivalry', label: 'the silence both ends kept' } } },
          { id: 'applause', label: 'A minute\'s applause instead', desc: 'Safer, warmer, less easy to ruin', outcome: 'It is loud and it goes on for ninety seconds because nobody wants to be the one to stop. His daughter is in the directors\' box in bits.', effect: { prestige: 1 } },
          { id: 'seat', label: 'Leave his seat empty for the season', desc: 'A small brass plate, no announcement', outcome: 'Row H, seat 14. People point it out to their children. It is still there long after everybody who knew him has gone.', effect: { coins: -20, clubLegacy: { kind: 'tradition', label: 'the empty seat in row H' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-mural-wall', title: 'The Gable End', icon: '🎨', category: 'club',
    when: { minSeason: 4 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody has painted a mural of the 1974 side on the gable end of a terraced house near the ground. The council have called it unauthorised. The owner of the house would like it to stay.',
        choices: [
          { id: 'fund', label: 'Pay for the permissions', desc: 'Planning, a surveyor and an anti-graffiti coat', outcome: 'It stays. It is on the front of the away travel guide within two seasons and on a stamp, briefly, in 2041.', effect: { coins: -80, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the 1974 mural on the gable end' } } },
          { id: 'commission', label: 'Commission more of them', desc: 'A trail of them, round the streets', outcome: 'Six walls, two arguments about who deserves one, and a matchday that now starts an hour earlier for a lot of people.', effect: { coins: -220, prestige: 2 } },
          { id: 'distance', label: 'Stay out of it', desc: 'It is a council matter and a private wall', outcome: 'It is painted over on a Tuesday morning by two men in a cherry picker. Somebody photographs the blank wall and that photograph does the rounds instead.', effect: { prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-hospital-visit', title: 'The Children\'s Ward', icon: '🏥', category: 'club',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The hospital visit is in the diary for the week before Christmas, as it has been every year since anybody can remember. This year it clashes with a rearranged away game and a travel day.',
        choices: [
          { id: 'go-all', label: 'Take the whole squad anyway', desc: 'Move the travel, lose the afternoon', outcome: 'They travel through the night and are dreadful on the Saturday. Four of them go back on their own in January.', effect: { squadMorale: 4, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the Christmas ward visit, never once missed' } } },
          { id: 'go-few', label: 'Send four players and the manager', desc: 'Keep the rest on the schedule', outcome: 'It is a smaller thing than usual and still means everything to the ward. Nobody outside the building notices the difference.', effect: { prestige: 1 } },
          { id: 'cancel', label: 'Cancel it for this year', desc: 'The game has to come first', outcome: 'The ward manager is gracious about it, which is worse than if she had not been. The run of years is broken and never restarted.', effect: { prestige: -2, tag: 'mgr-broke-the-tradition' } },
        ],
      },
    },
  },
  {
    id: 'mgr-town-flood', title: 'When The Town Went Under', icon: '🌊', category: 'club',
    when: { minSeason: 3 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The river has come up over the bridge and four hundred houses are under a foot of water. The ground is on the high side of town and has heating, showers and a function room.',
        choices: [
          { id: 'open-up', label: 'Open the ground', desc: 'Beds in the lounge, showers, a kitchen', outcome: 'Two hundred people sleep in the main stand for five nights. The club is not a football club that week and is more of one afterwards than it has ever been.', effect: { coins: -160, prestige: 3, clubLegacy: { kind: 'tradition', label: 'the week the ground took the town in' } } },
          { id: 'collection', label: 'Run a collection at the next game', desc: 'Buckets on the turnstiles', outcome: 'Eleven thousand pounds in buckets and a lorry of donated goods in the car park. Useful, real, and slightly less than the club could have done.', effect: { coins: -40, prestige: 2 } },
          { id: 'fixture', label: 'Concentrate on getting the game on', desc: 'People need something normal', outcome: 'The game goes ahead in front of a small crowd and there is an argument in the local paper for a fortnight about whether it should have.', effect: { prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },

  // ── the ground itself ────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-stand-rebuild-name', title: 'What To Call It', icon: '🏗️', category: 'club',
    when: { minSeason: 4, minCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The old wooden stand is finally coming down and something with a roof and legroom is going up. There are three names on the shortlist and none of them are the one everybody in the pub uses.',
        choices: [
          { id: 'sponsor', label: 'Sell the naming rights', desc: 'Six figures a year from a firm nobody has heard of', outcome: 'The money is real and pays for the academy for a decade. Not one supporter ever calls it by its name.', effect: { coins: 600, prestige: -1, clubLegacy: { kind: 'stand', label: 'a sponsored stand nobody uses the name of' } } },
          { id: 'player', label: 'Name it after the club\'s greatest player', desc: 'The obvious one, done properly', outcome: 'He unveils it himself at eighty-one, in the rain, and cannot get through the second sentence. The photograph is in the boardroom forever.', effect: { coins: -80, prestige: 2, clubLegacy: { kind: 'stand', label: 'a stand named for the club\'s greatest player' } } },
          { id: 'pub-name', label: 'Use the name the pub uses', desc: 'The Coalyard End, officially', outcome: 'The board think it is common. Within a season it is on the tickets, the signage and a tattoo on somebody\'s forearm.', effect: { boardMood: -1, prestige: 2, clubLegacy: { kind: 'stand', label: 'the Coalyard End, officially at last' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p04-badge-redesign', title: 'The Badge', icon: '🛡️', category: 'club',
    when: { minSeason: 3, minTier: 1, maxTier: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A sponsor and a design agency have produced a new badge. It is a clean roundel. The lamp and the sheaf of corn are gone, and so is the year.',
        choices: [
          { id: 'accept', label: 'Let it through', desc: 'It is a badge, and the money is a squad player', outcome: 'The money buys a right-back. There is a petition with nineteen thousand names on it by the end of the week.', effect: { coins: 500, prestige: -3, tag: 'mgr-badge-changed', clubLegacy: { kind: 'reputation', label: 'the club that lost its old badge' } } },
          { id: 'fight', label: 'Fight it publicly', desc: 'Stand in front of the crest at the presser', outcome: 'The sponsor walks. The badge stays exactly as it was and there is a hole in the budget shaped like a right-back.', effect: { coins: -300, prestige: 3, clubLegacy: { kind: 'tradition', label: 'the badge kept, at the cost of a sponsor' } } },
          { id: 'compromise', label: 'Get the year and the lamp back in', desc: 'Six weeks of meetings about a lamp', outcome: 'A tidier badge with the lamp in it. Nobody loves it and nobody burns anything. That is a result of sorts.', effect: { coins: 300, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-groundshare-offer', title: 'Somebody Else\'s Ground', icon: '🏟️', category: 'club',
    when: { minSeason: 3, maxCoins: 300 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The ground needs work the club cannot pay for. A club nine miles away has offered a groundshare for two seasons while it is done. Nine miles is not far and is a different world.',
        choices: [
          { id: 'share', label: 'Take the groundshare', desc: 'Two seasons away, then home to a better ground', outcome: 'They lose a third of the crowd and never get all of it back. The ground they come home to is excellent and half-empty.', effect: { coins: 400, prestige: -2, tag: 'mgr-groundshared' } },
          { id: 'stay', label: 'Stay, and do the work in stages', desc: 'Live on a building site for five years', outcome: 'Tarpaulin, scaffolding and a reduced capacity every winter. Nobody leaves. It takes twice as long and costs more.', effect: { coins: -300, prestige: 2, clubLegacy: { kind: 'reputation', label: 'a club that never left its ground' } } },
          { id: 'community', label: 'Raise it from the town', desc: 'A share issue and a very long summer', outcome: 'Eleven hundred small investors and a wall of names in the concourse. It nearly does not work, twice.', effect: { coins: 250, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the wall of names in the concourse' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-museum-room', title: 'The Room Under The Stand', icon: '🏆', category: 'club',
    when: { minSeason: 4 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A retired steward has been quietly collecting the club\'s history in his loft for thirty years. Programmes, shirts, the 1958 minute book. He is asking if the club wants it before his family throws it out.',
        choices: [
          { id: 'museum', label: 'Give it a room', desc: 'Under the main stand, open two hours before kick-off', outcome: 'Volunteers run it. The minute book turns out to settle an argument about a name that had been going since the seventies.', effect: { coins: -120, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the museum under the main stand' } } },
          { id: 'digitise', label: 'Photograph the lot and put it online', desc: 'Cheaper, wider, less real', outcome: 'Forty thousand images, catalogued by six volunteers over two years. Anybody in the world can read the 1958 minute book. Nobody can smell it.', effect: { coins: -60, prestige: 1 } },
          { id: 'decline', label: 'Politely decline', desc: 'There is nowhere to put it', outcome: 'Most of it goes to a collector in another county. Two boxes go in a skip, and one of those boxes had the 1958 minute book in it.', effect: { prestige: -2, tag: 'mgr-lost-the-archive' } },
        ],
      },
    },
  },
  {
    id: 'mgr-away-end-roof', title: 'The Away End Has No Roof', icon: '☔', category: 'club',
    when: { minTier: 4 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The away end is open to the weather and has been since 1996. Visiting supporters have started bringing it up in fanzines. The club\'s own fans quite enjoy that.',
        choices: [
          { id: 'roof', label: 'Put a roof on it', desc: 'Money spent on other people\'s supporters', outcome: 'It is the least popular expenditure of the decade with his own crowd and buys the club goodwill in nine other towns.', effect: { coins: -300, prestige: 1, clubLegacy: { kind: 'reputation', label: 'a club that roofed the away end' } } },
          { id: 'leave', label: 'Leave it', desc: 'It is a fortress and a joke and both are useful', outcome: 'Nothing changes. Away fans keep coming, keep getting wet, and keep singing about it, which is arguably a service.', effect: {} },
          { id: 'ponchos', label: 'Hand out ponchos at the gate', desc: 'Cheap, silly, and something', outcome: 'Two thousand yellow ponchos with the badge on. It becomes a running joke that outlasts him and sells surprisingly well in the shop.', effect: { coins: 60, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the yellow ponchos at the away gate' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-clock-stopped', title: 'The Clock', icon: '🕰️', category: 'club',
    when: { minSeason: 2, minTier: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The clock on the main stand stopped at twenty past four in March and nobody has fixed it. Two supporters have written in. One wants it mended and one wants it left exactly where it is.',
        choices: [
          { id: 'mend', label: 'Mend it', desc: 'A man from the cathedral, half a day', outcome: 'It runs again, three minutes fast, and stays three minutes fast for the next thirty years because nobody can be bothered.', effect: { coins: -40, clubLegacy: { kind: 'tradition', label: 'the clock that runs three minutes fast' } } },
          { id: 'leave', label: 'Leave it stopped', desc: 'The letter made a decent case', outcome: 'It stays at twenty past four. New supporters assume it means something. Eventually it does.', effect: { prestige: 1, clubLegacy: { kind: 'tradition', label: 'the clock stopped at twenty past four' } } },
          { id: 'digital', label: 'Replace it with a screen', desc: 'Time, score, and a sponsor\'s logo', outcome: 'It is accurate, legible and hateful. The old clock face is in the museum within a year with a small card explaining it.', effect: { coins: 120, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-car-park-sale', title: 'The Car Park', icon: '🅿️', category: 'club',
    when: { minSeason: 3, maxCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A developer wants the car park for flats. It would clear the overdraft twice over. It is also where the coaches turn round, where the food bank parks, and where everybody meets before a game.',
        choices: [
          { id: 'sell', label: 'Sell it', desc: 'Solvency now, nowhere to stand forever', outcome: 'The books are clean for the first time in eleven years. On matchdays the street outside is a mess and always will be.', effect: { coins: 700, boardMood: 3, prestige: -2, clubLegacy: { kind: 'reputation', label: 'the club that sold its car park' } } },
          { id: 'refuse', label: 'Refuse', desc: 'Live with the overdraft', outcome: 'The overdraft is still there. So is the tarmac, and the burger van, and the bloke who has sold the fanzine from the same spot since 2003.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-kept-the-car-park' } },
          { id: 'lease', label: 'Lease half of it', desc: 'Weekday parking for the office block', outcome: 'A barrier, an app, and a modest monthly cheque. On Saturdays the barrier is up and nothing has changed.', effect: { coins: 220, boardMood: 1 } },
        ],
      },
    },
  },

  // ── the women's team ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-womens-team-training', title: 'Sharing The Training Ground', icon: '🤝', category: 'club',
    when: { minSeason: 2, facility: { key: 'women', min: 2 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The women\'s team have been given the far pitch and the portable cabin. Their manager has asked, reasonably, for one of the two grass pitches on a Tuesday and access to the gym before eight.',
        choices: [
          { id: 'give', label: 'Give them the good pitch on Tuesdays', desc: 'Move his own session to the astro', outcome: 'His players grumble for a fortnight. The two squads start using the same canteen and the building changes in a way that is hard to write down.', effect: { squadMorale: -3, prestige: 2, tag: 'mgr-backed-the-womens-team' } },
          { id: 'gym', label: 'Give them the gym and keep the pitch', desc: 'Half of what was asked for', outcome: 'It is better than nothing and everybody involved knows it is half. The request comes back in March, politely, again.', effect: { prestige: 1 } },
          { id: 'refuse', label: 'Keep the first team\'s schedule', desc: 'His job is the first team', outcome: 'Entirely defensible. Two years later the women\'s side are in a higher division than the men and train somewhere else entirely.', effect: { prestige: -2, tag: 'mgr-blocked-the-womens-team' } },
        ],
      },
    },
  },
  {
    id: 'mgr-womens-final-clash', title: 'Two Games, One Saturday', icon: '📅', category: 'club',
    when: { minSeason: 3, facility: { key: 'women', min: 3 } }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The women\'s team have a cup final at three o\'clock. The men are at home at three o\'clock. Nobody in the fixtures office noticed until a supporter pointed it out on a forum.',
        choices: [
          { id: 'move-men', label: 'Move the men\'s game to the evening', desc: 'Ask the league, annoy the broadcasters', outcome: 'It takes four phone calls and a favour. Fourteen hundred supporters go to the final and the ground is full again at half seven.', effect: { coins: -120, prestige: 3, clubLegacy: { kind: 'tradition', label: 'the day the men moved for the women\'s final' } } },
          { id: 'both', label: 'Put the final on the big screen after', desc: 'A compromise nobody asked for', outcome: 'Six hundred people stay to watch a recording of a game they knew the result of. It is oddly lovely and definitely not the same.', effect: { prestige: 1 } },
          { id: 'nothing', label: 'Leave both as they are', desc: 'Two games, two crowds, no fuss', outcome: 'The final is played in front of two hundred and eleven people. The clip of the empty stand travels a lot further than the highlights.', effect: { prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-womens-badge-parity', title: 'The Same Shirt', icon: '👕', category: 'club',
    when: { minSeason: 3, minTier: 1, maxTier: 4, facility: { key: 'women', min: 3 } }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The women\'s side are still playing in last season\'s kit with a different sponsor on it. The kit supplier says a matching run is not commercially viable for that quantity.',
        choices: [
          { id: 'insist', label: 'Insist on the same kit', desc: 'Absorb the cost, change the contract', outcome: 'It costs more than it should and looks, from the stands, like nothing at all has changed. That is the entire point.', effect: { coins: -180, prestige: 2, clubLegacy: { kind: 'tradition', label: 'one kit, both teams, no exceptions' } } },
          { id: 'own', label: 'Let them have their own identity', desc: 'A different shirt, on purpose, designed with them', outcome: 'They pick something with the 1974 collar on it and it outsells the men\'s home shirt in December, which nobody predicted.', effect: { coins: 140, prestige: 1 } },
          { id: 'accept', label: 'Accept the supplier\'s answer', desc: 'It is a contract, not a principle', outcome: 'It is a contract. It is photographed every week by people who think it is a principle.', effect: { prestige: -1 } },
        ],
      },
    },
  },

  // ── old players, ghosts, and the club's dead ─────────────────────────────────────────────────────────
  {
    id: 'mgr-old-player-in-trouble', title: 'The Man At The Gate', icon: '🚪', category: 'club',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A man who made two hundred and eleven appearances for the club is at the training ground gate asking if there is any work going. He is sixty-two and it has clearly taken him a long time to come.',
        choices: [
          { id: 'job', label: 'Find him something', desc: 'Matchday host, two days a week, real money', outcome: 'He is very good at it. He also gets, back, a thing he did not know he had lost, which is somewhere to be on a Tuesday.', effect: { coins: -100, prestige: 2, clubLegacy: { kind: 'tradition', label: 'a job at the club for anybody who played two hundred games' } } },
          { id: 'money', label: 'Sort him some money quietly', desc: 'From the former players\' fund, no forms', outcome: 'It helps for four months. He does not come back, which he thinks is dignity and the manager knows is not.', effect: { coins: -140, prestige: 1 } },
          { id: 'refer', label: 'Point him at the players\' union', desc: 'They have people who do this properly', outcome: 'They do have people who do this properly, and they help him. He never comes to the ground again.', effect: { prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-ex-manager-funeral', title: 'The Old Manager', icon: '⚰️', category: 'club',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The manager who took this club up in 1989 has died. He was sacked eighteen months later and never came back to the ground. The family have not asked the club for anything.',
        choices: [
          { id: 'attend', label: 'Take the whole squad to the funeral', desc: 'Suits, a coach, the back of the church', outcome: 'The church is full and half of it is in club ties. His widow says two sentences to the manager that he thinks about for years.', effect: { coins: -60, squadMorale: 3, prestige: 2, tag: 'mgr-honours-the-dead' } },
          { id: 'stand', label: 'Name something after him', desc: 'The tunnel, or the training pitch he built', outcome: 'The tunnel. His name is over the players\' heads every time they go out, which is a better memorial than a service.', effect: { coins: -40, prestige: 2, clubLegacy: { kind: 'stand', label: 'the tunnel named for the 1989 manager' } } },
          { id: 'statement', label: 'Put out a statement', desc: 'Warm, correct, three paragraphs', outcome: 'It is a good statement. The family thank the press office by email and that is the end of it.', effect: {} },
        ],
      },
    },
  },
  {
    id: 'mgr-retire-a-number', title: 'The Number Six Shirt', icon: '6️⃣', category: 'club',
    when: { minSeason: 5 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A campaign has started to retire the number six. The man who wore it made six hundred and four appearances and died at fifty-eight. A young centre-half has just asked for it.',
        choices: [
          { id: 'retire', label: 'Retire it', desc: 'Nobody wears six here again', outcome: 'The squad numbers skip from five to seven forever. Visiting supporters ask about it and get told the whole story, every time.', effect: { prestige: 2, clubLegacy: { kind: 'number', label: 'the number six, retired' } } },
          { id: 'give', label: 'Give it to the young lad', desc: 'A shirt is for wearing', outcome: 'He wears it well and is asked about it in every interview for four years. He handles it better than anybody expected.', effect: { playerMorale: { who: 'youngest', delta: 10 }, prestige: 1, clubLegacy: { kind: 'number', label: 'the number six, always given to a young centre-half' } } },
          { id: 'earned', label: 'Make it something to be earned', desc: 'Awarded each season, by the squad', outcome: 'The vote is taken in the dressing room in July and announced on the pitch. It becomes the most wanted thing at the club.', effect: { squadMorale: 6, clubLegacy: { kind: 'tradition', label: 'the number six, voted for by the squad each July' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-ashes-on-the-pitch', title: 'The Centre Circle', icon: '⚱️', category: 'club',
    when: { minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A family have asked to scatter ashes on the pitch. The groundsman says he has done fourteen and never told anyone. There is now a policy document that says no.',
        choices: [
          { id: 'allow', label: 'Do it anyway, quietly', desc: 'Half seven on a Tuesday, four people, no cameras', outcome: 'It takes six minutes. The family write a letter the manager keeps in a drawer for the rest of his career.', effect: { prestige: 1, tag: 'mgr-ignores-the-policy' } },
          { id: 'garden', label: 'Build a garden of remembrance', desc: 'A proper place, behind the north stand', outcome: 'Nine benches and a low wall for plaques. The waiting list for a plaque is four years within a decade.', effect: { coins: -140, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the garden of remembrance behind the north stand' } } },
          { id: 'policy', label: 'Follow the policy', desc: 'It exists for reasons and they are real', outcome: 'The family are written to kindly and correctly. The groundsman says nothing at all and carries on doing what he has always done.', effect: {} },
        ],
      },
    },
  },

  // ── commerce, sponsors, the shop ─────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-club-shop-decline', title: 'The Shop', icon: '🛍️', category: 'club',
    when: { minSeason: 2, minTier: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club shop is a portakabin that opens for two hours before kick-off and sells four things. The woman who runs it has ordered the same quantities since 2014.',
        choices: [
          { id: 'invest', label: 'Put a proper shop in the concourse', desc: 'Stock, staff, card machines that work', outcome: 'Takings triple in a season. The portakabin becomes the away supporters\' hut and is sworn at fondly for years.', effect: { coins: -220, boardMood: 2 } },
          { id: 'online', label: 'Do it online instead', desc: 'Cheaper, wider, colder', outcome: 'It sells to expat supporters in three continents and nobody in the town ever holds a shirt before buying it.', effect: { coins: 240, prestige: -1 } },
          { id: 'leave', label: 'Leave her to it', desc: 'She knows what people buy here', outcome: 'Takings stay flat and the queue stays cheerful. The finance director puts it in a report as an underperforming asset.', effect: { boardMood: -1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-sponsor-front-of-shirt', title: 'The Name On The Front', icon: '💰', category: 'club',
    when: { minSeason: 3, minTier: 1, maxTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two shirt sponsors on the table. One is a betting firm paying three times the other. The other is the scaffolding company that has sponsored the shirt since 1998 and cannot go higher.',
        choices: [
          { id: 'betting', label: 'Take the betting money', desc: 'It is a lot of money and everybody does it', outcome: 'The academy is funded for four years. Nine hundred children wear a betting logo on their backs and somebody writes about that.', effect: { coins: 600, prestige: -2, tag: 'mgr-betting-sponsor' } },
          { id: 'loyal', label: 'Stay with the scaffolders', desc: 'Less money, forty years of Saturdays', outcome: 'The owner is at every away game and cries at the announcement. The budget is what it is and the shirt looks right.', effect: { coins: 200, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the scaffolders on the shirt since 1998' } } },
          { id: 'kids', label: 'Betting on the adults, nothing on the kids', desc: 'Split the deal, take the smaller cheque', outcome: 'The betting firm knock a quarter off for it. The junior shirts have the badge and nothing else and look better for it.', effect: { coins: 420, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-matchday-programme', title: 'The Programme', icon: '📕', category: 'club',
    when: { minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The programme sells four hundred copies and loses money on every one. It has come out for every home game since 1946, including the two played behind closed doors.',
        choices: [
          { id: 'keep', label: 'Keep printing it', desc: 'Losing money on purpose, for a reason', outcome: 'An unbroken run nobody else in the country has. It costs about the same as a physio\'s wages and is worth more than that to some people.', effect: { coins: -100, prestige: 1, clubLegacy: { kind: 'tradition', label: 'a programme printed for every home game since 1946' } } },
          { id: 'digital', label: 'Move it to a free digital edition', desc: 'Modern, sensible, weightless', outcome: 'It is read more and kept by nobody. The collectors\' fair on the ring road has a whole table of the old ones by Christmas.', effect: { coins: 60, prestige: -1 } },
          { id: 'annual', label: 'One big printed annual instead', desc: 'Kill the run, keep the paper', outcome: 'It is a beautiful object and it is not a programme. The run of seventy-nine years ends and the letters page is brutal about it.', effect: { coins: 40, prestige: -1, tag: 'mgr-ended-the-programme' } },
        ],
      },
    },
  },
  {
    id: 'mgr-pie-supplier', title: 'The Pies', icon: '🥧', category: 'club',
    when: { minTier: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The bakery three streets away has supplied the pies for thirty-one years. A national caterer has offered a contract worth four times as much and their pie is, objectively, worse.',
        choices: [
          { id: 'stay', label: 'Stay with the bakery', desc: 'Turn down real money over a pie', outcome: 'The pie remains the single most frequently praised thing about visiting this ground. Away forums have a running list.', effect: { coins: -60, prestige: 2, clubLegacy: { kind: 'reputation', label: 'the best pie in the division' } } },
          { id: 'switch', label: 'Take the contract', desc: 'Four times the money is four times the money', outcome: 'The money is useful and the pies are a grey disappointment. The bakery closes eighteen months later and everybody joins those two facts up.', effect: { coins: 280, prestige: -2 } },
          { id: 'both', label: 'Both — bakery in the home end', desc: 'A fudge that annoys the caterer', outcome: 'The caterer accepts a reduced deal with bad grace. The home end queue is longer than the away end queue for the first time ever.', effect: { coins: 140 } },
        ],
      },
    },
  },
  {
    id: 'mgr-corporate-box-conversion', title: 'The Family Corner', icon: '🍽️', category: 'club',
    when: { minSeason: 3, minTier: 1, maxTier: 3, facility: { key: 'stadium', min: 3 } }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The commercial department want to convert the family corner into eight hospitality boxes. Six hundred cheap seats out, forty expensive ones in, and a much better number at the end of it.',
        choices: [
          { id: 'boxes', label: 'Build the boxes', desc: 'The number at the end of it is a player', outcome: 'The boxes sell out. The corner that used to be full of eight-year-olds is now full of people eating at half time with their backs to the pitch.', effect: { coins: 480, boardMood: 2, prestige: -2 } },
          { id: 'keep', label: 'Keep the family corner', desc: 'Cheap seats, noisy children, no revenue', outcome: 'It stays full and stays cheap. Two of the eight-year-olds in it are on the pitch by the time he leaves.', effect: { boardMood: -2, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the family corner, never sold' } } },
          { id: 'half', label: 'Four boxes and half the corner', desc: 'Split the difference, please nobody', outcome: 'A wall goes up between them. The children can hear the cutlery and the boxes can hear the children.', effect: { coins: 240, boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },

  // ── traditions, arguments about them ─────────────────────────────────────────────────────────────────
  {
    id: 'mgr-boxing-day-training', title: 'Boxing Day', icon: '🎄', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club has opened training to the public on the morning of Boxing Day since the sixties. The sports scientist has produced a chart showing why it should stop.',
        choices: [
          { id: 'keep', label: 'Keep it', desc: 'Six hundred people, freezing, delighted', outcome: 'The session is ten per cent worse and the morning is worth more than that. A generation of children get an autograph in a cold car park.', effect: { squadMorale: 3, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the Boxing Day open training session' } } },
          { id: 'stop', label: 'Stop it', desc: 'Trust the chart, take the criticism', outcome: 'The players are fresher and win on the 27th. There is a paragraph about it in the local paper every Christmas for the next nine years.', effect: { squadMorale: 4, prestige: -2, tag: 'mgr-ended-boxing-day' } },
          { id: 'move', label: 'Move it to the 27th evening', desc: 'Keep the thing, move the date', outcome: 'Fewer people come and those who do are the ones who really wanted to. It is a smaller, better version of a worse idea.', effect: { prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-walk-out-song', title: 'The Song They Come Out To', icon: '🎵', category: 'club',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The team have come out to the same record since 1978. It is scratchy, it is out of copyright, and the new commercial partner has suggested something with more energy.',
        choices: [
          { id: 'keep', label: 'Keep the record', desc: 'Scratches and all', outcome: 'Four thousand people who cannot sing, singing. The commercial partner watches it once from the directors\' box and never mentions it again.', effect: { prestige: 2, clubLegacy: { kind: 'tradition', label: 'the 1978 record they walk out to' } } },
          { id: 'change', label: 'Change it', desc: 'Something modern, something loud', outcome: 'It is louder and it means nothing. Somebody starts singing the old one over the top of it and by March that is what happens every week.', effect: { prestige: -2 } },
          { id: 'both', label: 'New song for the warm-up, old one for the walk-out', desc: 'Give the sponsor a slot that is not the moment', outcome: 'Everybody gets something and the moment is untouched. It is the sort of solution nobody thanks you for.', effect: { coins: 80, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-last-game-lap', title: 'The Last Home Game', icon: '👏', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Last home game of a season that has gone nowhere. Tradition says a lap of appreciation. Two of the players have asked, privately, whether they really have to.',
        choices: [
          { id: 'do-it', label: 'Do the lap', desc: 'All of them, families included, whatever the mood', outcome: 'Three thousand stay and clap and it is warmer than anybody deserved. The two who did not want to are the last ones off.', effect: { squadMorale: 5, prestige: 1 } },
          { id: 'skip', label: 'Skip it', desc: 'Nobody has earned a lap of anything', outcome: 'The players go straight down the tunnel. It is honest and it reads, from the stands, as sulking.', effect: { squadMorale: -3, prestige: -2 } },
          { id: 'manager', label: 'Send the players in and do it himself', desc: 'One man, one lap, all of it', outcome: 'He walks the whole thing on his own and applauds every stand. It is either dignity or theatre and the town decides it is the first.', effect: { prestige: 3, squadMorale: -2, tag: 'mgr-walked-it-alone' } },
        ],
      },
    },
  },
  {
    id: 'mgr-centenary-year', title: 'A Hundred Years', icon: '💯', category: 'club',
    when: { minSeason: 4 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It is the club\'s centenary season. There is a committee, a budget of almost nothing, and eleven competing ideas about how to mark it.',
        choices: [
          { id: 'kit', label: 'A centenary kit and a friendly', desc: 'The 1930s shirt, one night in July', outcome: 'The shirt sells out in nine days and the friendly draws a bigger crowd than four league games. It pays for itself twice.', effect: { coins: 260, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the centenary shirt, brought back every ten years' } } },
          { id: 'book', label: 'Commission a proper history', desc: 'Two years of research, four hundred pages', outcome: 'It settles three arguments and starts one. Every player who has ever signed here gets a copy, and most of them read it.', effect: { coins: -180, prestige: 2 } },
          { id: 'town', label: 'A hundred acts for the town', desc: 'One a week, small, unglamorous, all season', outcome: 'A bench, a defibrillator, a scout hut roof. Nobody covers it nationally. There is a laminated list of the hundred in the reception to this day.', effect: { coins: -300, prestige: 3, clubLegacy: { kind: 'reputation', label: 'the hundred acts of the centenary year' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-half-time-draw', title: 'The Half-Time Draw', icon: '🎰', category: 'club',
    when: { minTier: 4 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The half-time draw is read out by a man with a microphone who has been doing it since 1991 and takes eleven minutes. It funds the youth team. Nobody can hear a word.',
        choices: [
          { id: 'keep', label: 'Leave it exactly as it is', desc: 'Eleven minutes of nobody hearing anything', outcome: 'It raises nine thousand pounds that season. When he retires the club cannot find anybody willing to do it as badly and as well.', effect: { coins: 100, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the eleven-minute half-time draw' } } },
          { id: 'screen', label: 'Put the numbers on the screen', desc: 'Faster, clearer, silent', outcome: 'Two minutes instead of eleven and takings drop by a fifth, which nobody can explain and everybody suspects they understand.', effect: { coins: 20 } },
          { id: 'app', label: 'Move the lottery online', desc: 'Direct debits, a wider net', outcome: 'It raises four times as much from people who have never been to the ground. The bloke with the microphone is thanked in a newsletter.', effect: { coins: 300, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-mascot-argument', title: 'The Mascot', icon: '🐐', category: 'club',
    when: { minSeason: 2, minTier: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The mascot costume is twenty years old, smells of a cupboard, and has one eye that will not stay on. The marketing department have designed a sleeker replacement with a name that tested well.',
        choices: [
          { id: 'repair', label: 'Have the old one repaired', desc: 'A seamstress in the town, one week', outcome: 'The eye is fixed and the smell is not. Children are frightened of it in exactly the way they have always been frightened of it.', effect: { coins: -20, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the mascot with the wandering eye' } } },
          { id: 'replace', label: 'Take the new one', desc: 'Sleek, clean, focus-grouped', outcome: 'It looks like every other mascot in the league. There is a campaign to bring the old one back and the old one is in a bin behind the laundry.', effect: { coins: -120, prestige: -1 } },
          { id: 'both', label: 'Keep both', desc: 'The new one for sponsors, the old one for the fans', outcome: 'Two mascots. They do a routine together that is, briefly, the most popular thing the club produces.', effect: { coins: -140, prestige: 1 } },
        ],
      },
    },
  },

  // ── staff and the building ───────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-canteen-cook', title: 'The Woman In The Canteen', icon: '🍲', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The new nutritionist has produced a menu. The woman who has cooked here for nineteen years has read it and put it on the noticeboard with one word written on it in biro.',
        choices: [
          { id: 'nutritionist', label: 'Back the nutritionist', desc: 'The science is not wrong', outcome: 'The food is better for them and the canteen empties at one o\'clock. She retires in the summer and the room is never the same.', effect: { squadMorale: -4, prestige: -1 } },
          { id: 'cook', label: 'Back the cook', desc: 'They eat what she makes and they eat together', outcome: 'The nutritionist leaves within a year for a club that listens. The squad still sit down together at one o\'clock every day.', effect: { squadMorale: 6, prestige: -1 } },
          { id: 'together', label: 'Put the two of them in a room', desc: 'And leave them there until there is a menu', outcome: 'They come out three hours later with a menu and a working relationship. The rice pudding survives, on Fridays only.', effect: { squadMorale: 5, prestige: 2, clubLegacy: { kind: 'tradition', label: 'rice pudding on Fridays' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-physio-room-condition', title: 'The Treatment Room', icon: '🩹', category: 'club',
    when: { minTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The treatment room is a converted store cupboard with one bed and a plug socket that sparks. The physio has stopped mentioning it because mentioning it has never worked.',
        choices: [
          { id: 'build', label: 'Build a proper one', desc: 'Two beds, a plunge pool and wiring that is legal', outcome: 'Days lost to injury drop by a third over two seasons. Nobody attributes it to a room, which is fine, because the room does not need the credit.', effect: { coins: -280, squadMorale: 5, boardMood: -1 } },
          { id: 'socket', label: 'Fix the socket and buy a second bed', desc: 'The cheapest version of doing something', outcome: 'It is better. It is still a cupboard, and the physio still treats a hamstring with somebody\'s coat on the back of the door.', effect: { coins: -60, squadMorale: 2 } },
          { id: 'wait', label: 'Wait until the summer', desc: 'There is a season to get through', outcome: 'The summer comes and the money goes on a striker. The physio applies for a job at the hospital in October.', effect: { squadMorale: -4, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-analyst-hire', title: 'The Lad With The Laptop', icon: '💻', category: 'club',
    when: { minSeason: 2, minTier: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A twenty-three-year-old has been sending unsolicited analysis to the club for eight months. It is unpaid, it is unasked for, and about a third of it is genuinely useful.',
        choices: [
          { id: 'hire', label: 'Put him on the staff', desc: 'Small wage, a desk, a chance', outcome: 'The coaching staff resent him for a season and rely on him by the second. He is at a Premier League club within five years.', effect: { coins: -120, prestige: 1, tag: 'mgr-hired-the-analyst' } },
          { id: 'freelance', label: 'Pay him per report', desc: 'Cheap, arms-length, no desk', outcome: 'He keeps sending them and they get worse, because nobody is telling him what actually happened in the games.', effect: { coins: -40 } },
          { id: 'ignore', label: 'Keep ignoring it', desc: 'The staff have enough voices in their ears', outcome: 'The emails stop in March. In November he is quoted in a national paper analysing one of their defeats, accurately.', effect: { prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-steward-training', title: 'The Stewards', icon: '🦺', category: 'club',
    when: { minSeason: 2, minTier: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two stewards have been filmed dragging a seventeen-year-old out of the away end by his hood. The steward supervisor says the lad was climbing on a seat. Both things are true.',
        choices: [
          { id: 'training', label: 'Retrain the whole steward team', desc: 'Two days, proper trainers, real money', outcome: 'Ejections halve within a season and complaints from away clubs stop. The two stewards involved are among the best on the course.', effect: { coins: -160, prestige: 2, clubLegacy: { kind: 'reputation', label: 'a ground away supporters are treated properly in' } } },
          { id: 'discipline', label: 'Stand the two of them down', desc: 'Somebody has to answer for the clip', outcome: 'The clip stops circulating. The other stewards close ranks, and the next incident is dealt with quietly and never reported at all.', effect: { prestige: -1 } },
          { id: 'back', label: 'Back the stewards publicly', desc: 'They do a hard job for very little', outcome: 'They are enormously loyal to him afterwards. The away club\'s supporters association writes a letter that goes unanswered.', effect: { prestige: -1, tag: 'mgr-backed-the-stewards' } },
        ],
      },
    },
  },
  {
    id: 'mgr-scout-network-old-boys', title: 'The Old Scouts', icon: '🔍', category: 'club',
    when: { minSeason: 3, minTier: 3, facility: { key: 'scouting', min: 3 } }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The scouting network is nine men over seventy who watch Sunday football for petrol money and a bacon roll. The data company\'s pitch says they can be replaced by a subscription.',
        choices: [
          { id: 'keep', label: 'Keep the nine men', desc: 'Petrol money and bacon rolls', outcome: 'One of them finds a left-back on a council pitch that no database in the world had heard of. That is the whole argument.', effect: { coins: -60, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the nine Sunday scouts' } } },
          { id: 'subscribe', label: 'Buy the subscription', desc: 'Data on forty thousand players', outcome: 'It is genuinely useful and finds them two signings. The council pitches go unwatched and the nine men stop being asked.', effect: { coins: -200, prestige: -1 } },
          { id: 'both', label: 'Both, and let them argue', desc: 'Feed the database to the old men', outcome: 'Six of them refuse to use it. Three become better scouts than they have ever been and one of them is seventy-eight.', effect: { coins: -240, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-laundry-outsourcing', title: 'The Laundry Contract', icon: '🧼', category: 'club',
    when: { minSeason: 3, maxCoins: 400 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A firm has offered to take the laundry off the club\'s hands for less than it costs to do in-house. The two women who do it now are also the two women who do the boot room and the flowers.',
        choices: [
          { id: 'outsource', label: 'Sign the contract', desc: 'Save the money, lose the pair of them', outcome: 'The kit comes back in vans, on time, in bags. Nobody does the flowers and nobody notices for eight weeks.', effect: { coins: 180, squadMorale: -3, prestige: -1 } },
          { id: 'keep', label: 'Keep it in-house', desc: 'Pay more to keep two people', outcome: 'The finance director flags it twice a year forever. The boot room is spotless and both women are at the promotion parade on the front of the bus.', effect: { coins: -80, squadMorale: 3, boardMood: -1 } },
          { id: 'partial', label: 'Outsource the training kit only', desc: 'Matchdays stay in the building', outcome: 'A sensible split that halves the work and keeps the people. The vans come Tuesdays and the shirts are still done by hand.', effect: { coins: 80 } },
        ],
      },
    },
  },

  // ── low-tier specifics ───────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-clubhouse-bar', title: 'The Bar Takings', icon: '🍺', category: 'club',
    when: { minTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'At this level the bar pays the wages. It is open until one on a Saturday and the neighbours have complained to the council for the third time this year.',
        choices: [
          { id: 'defend', label: 'Fight the licence review', desc: 'A solicitor and a lot of signatures', outcome: 'They keep the licence with conditions and the bill is most of a month\'s takings. The neighbours are now permanent enemies.', effect: { coins: -160, prestige: 1 } },
          { id: 'close-early', label: 'Close at eleven', desc: 'Lose the money, keep the peace', outcome: 'Takings drop a third and the wage bill has to come down with it. One player leaves over forty pounds a week.', effect: { coins: -220, squadMorale: -4 } },
          { id: 'soundproof', label: 'Soundproof the function room', desc: 'Money the club does not have', outcome: 'A loan, six weeks of work and a room that no longer leaks noise onto the street. Two years later the loan is paid and the bar is thriving.', effect: { coins: -300, boardMood: -1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-volunteers-committee', title: 'The Committee', icon: '📌', category: 'club',
    when: { minTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Everything here is done by eleven volunteers. Two of them have fallen out about the raffle and are refusing to be in the same room, and one of those two also does the pitch markings.',
        choices: [
          { id: 'mediate', label: 'Sit them both down', desc: 'An hour of something that is not football', outcome: 'It takes an hour and a half and one of them apologises. The lines get painted on the Friday and nobody mentions the raffle again.', effect: { prestige: 2 } },
          { id: 'pick', label: 'Pick a side', desc: 'The one who marks the pitch', outcome: 'The lines get painted. The other one takes the raffle book, the tombola and eleven years of knowledge home with her.', effect: { coins: -60, prestige: -1 } },
          { id: 'structure', label: 'Write down who does what', desc: 'The least romantic solution available', outcome: 'A laminated list on the clubhouse wall. It is mocked for a month and quietly prevents about nine future arguments.', effect: { prestige: 1, clubLegacy: { kind: 'tradition', label: 'the laminated list on the clubhouse wall' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-non-league-fa-cup-money', title: 'The Cup Cheque', icon: '💷', category: 'club',
    when: { minTier: 5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A cup run has produced a cheque bigger than anything in the club\'s history. There is a meeting on the Tuesday and everybody in the room wants it spent on something different.',
        choices: [
          { id: 'squad', label: 'Spend it on the squad', desc: 'One good season, right now', outcome: 'Three signings and a genuine promotion push that falls a point short. The money is gone by May and the roof still leaks.', effect: { coins: -200, squadMorale: 10, boardMood: 1 } },
          { id: 'ground', label: 'Spend it on the ground', desc: 'Stanchions, seats and a grading certificate', outcome: 'The ground meets the criteria for two divisions above. Nobody sings about a grading certificate and it is there in twenty years.', effect: { coins: -200, prestige: 2, clubLegacy: { kind: 'stand', label: 'the stand the cup run built' } } },
          { id: 'bank', label: 'Put it in the bank', desc: 'The dullest possible answer', outcome: 'It sits there. Four years later it is the reason the club still exists during a very bad winter, and only three people ever know that.', effect: { coins: 400, boardMood: 2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-players-wages-cash', title: 'The Brown Envelopes', icon: '✉️', category: 'club',
    when: { minTier: 6 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Half the squad are paid in cash on a Thursday out of the bar takings. It has always been done this way and the new treasurer has said, out loud, that it cannot continue.',
        choices: [
          { id: 'formalise', label: 'Put everybody on the books', desc: 'Tax, contracts and a much bigger number', outcome: 'The wage bill effectively rises a third overnight. Four players leave. The club is, for the first time, entirely legitimate.', effect: { coins: -240, squadMorale: -8, prestige: 1, clubLegacy: { kind: 'reputation', label: 'a club that pays everybody properly' } } },
          { id: 'continue', label: 'Leave it as it is', desc: 'It has worked for forty years', outcome: 'It works for another two, and then somebody at the league asks a question and the answer takes eight months and a fine.', effect: { squadMorale: 4, boardMood: -2, tag: 'mgr-cash-wages' } },
          { id: 'phase', label: 'Phase it over two seasons', desc: 'Slowly, quietly, contract by contract', outcome: 'Nobody has to leave and nobody enjoys the paperwork. By the end of it the treasurer sleeps at night.', effect: { coins: -120, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-groundhopper-visit', title: 'The Groundhoppers', icon: '📷', category: 'club',
    when: { minTier: 5 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Forty groundhoppers are coming on a Tuesday night because the ground is on a list of ones to see before they are gone. They will spend money on pies and badges and photograph the turnstiles.',
        choices: [
          { id: 'welcome', label: 'Roll it out', desc: 'A tour, a badge, the boardroom opened up', outcome: 'They spend three times what a normal crowd does and write about it for months. Eleven of them come back the following season.', effect: { coins: 140, prestige: 1 } },
          { id: 'normal', label: 'Treat it as a normal Tuesday', desc: 'They came for the ground, not the fuss', outcome: 'They get exactly what they came for, which is a cold Tuesday and a bad pitch. Several of them say it was perfect.', effect: { coins: 60 } },
          { id: 'annoyed', label: 'Ask them not to photograph the training pitch', desc: 'There are trialists on it', outcome: 'They comply immediately and are slightly hurt. The club appears in a book that year in one dry, unflattering paragraph.', effect: { prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-ground-grading-deadline', title: 'The Grading Deadline', icon: '📏', category: 'club',
    when: { minTier: 5, maxPos: 0.3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They are top of the league in February and the ground does not meet the grading criteria for the division above. There are eighty-three days and a list with nine things on it.',
        choices: [
          { id: 'build', label: 'Do the work now', desc: 'Borrow it, build it, worry later', outcome: 'Two hundred seats, a covered terrace and a turnstile count that just passes. They go up. The debt takes six years.', effect: { coins: -520, boardMood: -1, prestige: 2, clubLegacy: { kind: 'stand', label: 'the two hundred seats built in eighty-three days' } } },
          { id: 'wait', label: 'Wait and see if they actually go up', desc: 'Sensible, and possibly fatal', outcome: 'They go up and are refused promotion on grading. It is in the national papers for one day and in the town forever.', effect: { squadMorale: -12, prestige: -3, tag: 'mgr-denied-promotion' } },
          { id: 'appeal', label: 'Apply for a derogation', desc: 'A letter, a hearing, a lot of hope', outcome: 'They get twelve months\' grace on four of the nine and have to do the rest. It is exhausting and it works.', effect: { coins: -260, prestige: 1 } },
        ],
      },
    },
  },

  // ── top-flight specifics ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-preseason-tour-far', title: 'The Tour', icon: '✈️', category: 'club',
    when: { minSeason: 2, minTier: 1, maxTier: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The commercial department have booked eleven days on the other side of the world. Three flights, four appearances, two friendlies against sides who will not travel to meet them halfway.',
        choices: [
          { id: 'go', label: 'Go, and make it work', desc: 'Train at midnight local time if you have to', outcome: 'The money is enormous and the players are wrecked until September. They lose two of the first four and the tour is never blamed.', effect: { coins: 700, squadMorale: -6, boardMood: 2 } },
          { id: 'refuse', label: 'Refuse to take a full squad', desc: 'Fringe players and academy kids', outcome: 'The commercial partners are furious and the academy kids are transformed by it. Two of them are in the side by Christmas.', effect: { coins: 300, boardMood: -2, playerMorale: { who: 'youngest', delta: 12 } } },
          { id: 'shorten', label: 'Fight it down to five days', desc: 'One flight, one game, home', outcome: 'Half the money and a squad that can still run in August. The department bring the eleven-day plan back the following summer.', effect: { coins: 400, squadMorale: -2, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-kickoff-time-broadcast', title: 'Twelve Thirty On A Sunday', icon: '📺', category: 'club',
    when: { minSeason: 2, minTier: 1, maxTier: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The away game has been moved to a Sunday lunchtime, two hundred and forty miles away, with no trains before nine. Four hundred travelling supporters have already bought tickets.',
        choices: [
          { id: 'coaches', label: 'Pay for the coaches', desc: 'Free travel for everyone with a ticket', outcome: 'Eight coaches leave at six in the morning and the away end is full and loud. It costs about a week of one player\'s wages.', effect: { coins: -180, prestige: 3, clubLegacy: { kind: 'tradition', label: 'free coaches whenever the telly moves an away game' } } },
          { id: 'complain', label: 'Complain about it publicly', desc: 'Name the broadcaster at the press conference', outcome: 'It is quoted everywhere and changes nothing. Two other managers say the same thing that week, which is more than usual.', effect: { prestige: 2, boardMood: -2 } },
          { id: 'accept', label: 'Accept it', desc: 'The money from that camera pays for everything', outcome: 'It does pay for everything. Three hundred and forty of the four hundred still get there, and eleven of them lose a day\'s pay for it.', effect: { boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-legacy-fans-priced-out', title: 'Where Have The Kids Gone', icon: '📉', category: 'club',
    when: { minSeason: 4, minTier: 1, maxTier: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A survey has come back. The average age in the ground has gone up nine years in a decade and the section that was full of teenagers is now full of tourists with phones.',
        choices: [
          { id: 'scheme', label: 'Launch a young season-ticket scheme', desc: 'Under-twenty-fives, half price, thousand seats', outcome: 'It is oversubscribed in a fortnight and costs real revenue. The noise in the ground in year two is measurably different.', effect: { coins: -400, prestige: 3, clubLegacy: { kind: 'tradition', label: 'the thousand half-price seats for the under-twenty-fives' } } },
          { id: 'accept', label: 'Accept the market', desc: 'A full ground is a full ground', outcome: 'Every seat is sold every week to somebody. The atmosphere is described in three separate away fanzines as a library.', effect: { coins: 200, prestige: -2, clubLegacy: { kind: 'reputation', label: 'a quiet ground, full every week' } } },
          { id: 'atmosphere', label: 'Spend the money on flags and drums instead', desc: 'Buy the noise rather than the people', outcome: 'It looks tremendous on television and sounds hollow from the pitch. The survey next year is worse.', effect: { coins: -120, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-owner-rebrand', title: 'A New Direction', icon: '🎯', category: 'club',
    when: { minSeason: 4, minTier: 1, maxTier: 3 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'New owners have a deck. It has the word "brand" in it forty times, a proposed change of colours, and a slide about relocating to a site by the motorway.',
        choices: [
          { id: 'fight', label: 'Fight all of it', desc: 'Publicly, from day one, at cost', outcome: 'The colours survive. The relocation is shelved for six years. He is sacked in eighteen months and cheered off the pitch.', effect: { boardMood: -3, prestige: 3, clubLegacy: { kind: 'tradition', label: 'the colours nobody was allowed to change' } } },
          { id: 'pick', label: 'Pick one thing to defend', desc: 'The ground, and let the rest go', outcome: 'They stay in the town. The badge is modernised, the away kit is grey, and the away kit is grey forever.', effect: { boardMood: -1, prestige: 1, coins: 300 } },
          { id: 'go-along', label: 'Go along with it', desc: 'Owners come and go, so do managers', outcome: 'The investment is enormous and real. Something else, harder to put in a deck, is spent at the same time.', effect: { coins: 800, boardMood: 3, prestige: -3, clubLegacy: { kind: 'reputation', label: 'a club rebranded by its owners' } } },
        ],
      },
    },
  },

  // ── odds, ends and small human things ────────────────────────────────────────────────────────────────
  {
    id: 'mgr-training-ground-fence', title: 'The Hole In The Fence', icon: '🚧', category: 'club',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a hole in the training ground fence that eleven-year-olds have used to watch sessions for about twenty years. The security review has a line item about it.',
        choices: [
          { id: 'mend', label: 'Mend the fence', desc: 'The review is not wrong about the liability', outcome: 'The fence is mended. The children stand on a wall on the other side of the lane instead and can see almost nothing.', effect: { coins: -40, prestige: -1 } },
          { id: 'gate', label: 'Put a gate there instead', desc: 'Open on Thursdays, supervised', outcome: 'Thirty children a week, signed in, stood behind a rope. Two of them sign for the club and one of them is on the coaching staff in 2050.', effect: { coins: -70, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the Thursday gate at the training ground' } } },
          { id: 'ignore', label: 'Leave it and say nothing', desc: 'It has been there twenty years', outcome: 'It stays. The line item is carried forward in every review for the next decade and nobody ever actions it.', effect: {} },
        ],
      },
    },
  },
  {
    id: 'mgr-club-cat', title: 'The Cat', icon: '🐈', category: 'club',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A cat has lived under the main stand for six years, is fed by four different people who do not know about each other, and got onto the pitch during a televised game.',
        choices: [
          { id: 'adopt', label: 'Make it official', desc: 'A vet, a collar, a name on the website', outcome: 'It has more social media followers than the reserve team within a month. The kit man is listed as its keeper and is very serious about it.', effect: { coins: -20, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the cat under the main stand' } } },
          { id: 'rehome', label: 'Have it rehomed', desc: 'A stadium is not a home for an animal', outcome: 'It goes to a farm and is, presumably, fine. The tone of the correspondence about it is worse than anything the results produced that season.', effect: { prestige: -2 } },
          { id: 'ignore', label: 'Do nothing at all', desc: 'It is a cat', outcome: 'It carries on being fed four times a day by four people and gets onto the pitch twice more. Nobody minds either time.', effect: {} },
        ],
      },
    },
  },
  {
    id: 'mgr-hand-painted-sign', title: 'The Sign On The Gate', icon: '🪧', category: 'club',
    when: { minSeason: 3, minTier: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The sign over the players\' entrance was hand-painted in 1963 by a supporter who was a signwriter. It is flaking badly and the brand guidelines have a replacement in the correct typeface.',
        choices: [
          { id: 'restore', label: 'Have it restored', desc: 'Find somebody who still does this by hand', outcome: 'A woman in her seventies spends nine days on it. Every player touches it on the way out because that is what you do here.', effect: { coins: -80, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the hand-painted sign every player touches' } } },
          { id: 'replace', label: 'Replace it', desc: 'Vinyl, correct, permanent', outcome: 'It is legible and square and nobody touches it. The old one is in a store room for two years and then it is not.', effect: { coins: -20, prestige: -2 } },
          { id: 'both', label: 'New sign outside, old one in the tunnel', desc: 'Move the thing that matters inside', outcome: 'The players walk under it every week and the sponsors see the correct typeface from the car park. Both audiences are satisfied.', effect: { coins: -50, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-tunnel-superstition', title: 'Somebody Wants To Move The Bell', icon: '🔔', category: 'club',
    when: { minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a bell in the tunnel that the captain rings before every home game. The health and safety report says it is fixed to a wall that is coming down in the refurbishment.',
        choices: [
          { id: 'move', label: 'Move the wall around the bell', desc: 'Redraw the plans, add six weeks', outcome: 'The bell stays exactly where it is and the corridor is now an awkward shape. Every visiting player asks about it.', effect: { coins: -160, squadMorale: 4, clubLegacy: { kind: 'tradition', label: 'the bell in the tunnel, and the wall built around it' } } },
          { id: 'relocate', label: 'Rehang it further down', desc: 'Same bell, four metres left', outcome: 'It is the same bell and it does not feel like the same bell for about a season. Then it does.', effect: { coins: -20 } },
          { id: 'scrap', label: 'Retire it', desc: 'It is a bell on a wall', outcome: 'It goes in a display case in reception with a card. The captain rings nothing, and the first home game feels short of about four seconds.', effect: { squadMorale: -5, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-club-anthem-recording', title: 'The Record', icon: '💿', category: 'club',
    when: { minSeason: 3, maxPos: 0.25 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody wants the squad to record a cup-final song. It is a genuinely terrible idea with a long and celebrated history at clubs exactly like this one.',
        choices: [
          { id: 'record', label: 'Record it', desc: 'An afternoon in a studio above a carpet shop', outcome: 'It is dreadful. It charts at number sixty-one, raises money for the academy and is played in the ground every year forever.', effect: { coins: 100, squadMorale: 6, prestige: -1, clubLegacy: { kind: 'tradition', label: 'the cup-final record, still played every season' } } },
          { id: 'refuse', label: 'Refuse', desc: 'Focus, professionalism, and a cup final', outcome: 'They lose the final anyway and there is no record of the week. It is the correct decision and it is remembered as a joyless one.', effect: { squadMorale: -3, prestige: -1 } },
          { id: 'fans', label: 'Let the supporters record it instead', desc: 'A pub, a choir, four hundred people', outcome: 'It is better than the players would have managed and costs nothing. Somebody\'s dad on a keyboard is the star of it.', effect: { coins: 60, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-open-day-summer', title: 'The Open Day', icon: '🎪', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The open day is in July. Last year eleven hundred people came and the queue for autographs took three hours. The players have been asked to give up a Sunday.',
        choices: [
          { id: 'all-day', label: 'Everybody, all day, until the queue is gone', desc: 'Nobody goes home before the last child', outcome: 'It runs until half six. Two players are visibly fed up by four and both sign every last thing anyway.', effect: { squadMorale: -3, prestige: 3, clubLegacy: { kind: 'tradition', label: 'nobody leaves the open day until the queue does' } } },
          { id: 'slots', label: 'Ticketed slots, two hours each', desc: 'Organised, humane, less magic', outcome: 'It is smooth and pleasant and finished by three. Attendance drops a third the following year and nobody knows why.', effect: { prestige: 1 } },
          { id: 'skip', label: 'Give the squad the day off', desc: 'Pre-season is hard enough', outcome: 'The open day is run by the academy and the mascot and about eight hundred people come anyway and enjoy themselves.', effect: { squadMorale: 4, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-disabled-access', title: 'The Twelve Spaces', icon: '♿', category: 'club',
    when: { minSeason: 2, minTier: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There are twelve wheelchair spaces and a waiting list of forty-one. Eleven of the twelve are behind a pillar or beside the away support. Somebody has done the maths in a letter.',
        choices: [
          { id: 'build', label: 'Build a proper platform', desc: 'Forty spaces, halfway line, a lift that works', outcome: 'It costs a fortune and takes a summer. The first game on it, somebody who has not seen a goal scored in nine years sees one.', effect: { coins: -460, boardMood: -1, prestige: 3, clubLegacy: { kind: 'stand', label: 'the accessible platform on the halfway line' } } },
          { id: 'partial', label: 'Move the existing twelve somewhere better', desc: 'Cheap, quick, still twelve', outcome: 'Twelve people can see. Twenty-nine cannot, and the letter comes back in September with more names on it.', effect: { coins: -120, prestige: 1 } },
          { id: 'stream', label: 'Offer them a free stream instead', desc: 'A solution that solves the wrong problem', outcome: 'It is meant well and lands appallingly. The phrase "watch from home" is quoted back at the club for years.', effect: { coins: -40, prestige: -3, tag: 'mgr-access-row' } },
        ],
      },
    },
  },
  {
    id: 'mgr-lost-property-drawer', title: 'The Drawer In Reception', icon: '🔑', category: 'club',
    when: { minSeason: 2 }, weight: 1, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Lost property has become a filing cabinet and a corner. There is a wedding ring in it that has been unclaimed for four years and a scarf somebody has rung about eleven times.',
        choices: [
          { id: 'appeal', label: 'Put an appeal out for the ring', desc: 'One post, one photograph', outcome: 'A man in his eighties rings on the Monday. It was his wife\'s, he lost it at a game in 2021, and she died in 2023.', effect: { prestige: 2 } },
          { id: 'clear', label: 'Clear the lot to charity', desc: 'It is a corner full of gloves', outcome: 'Nine bin bags to the shop on the high street. Somebody rings about a scarf in November and is told, kindly, that it has gone.', effect: { coins: 20, prestige: -1 } },
          { id: 'cabinet', label: 'Buy a proper cabinet and a logbook', desc: 'The dullest fix available', outcome: 'Everything is labelled and dated and about a third more of it goes home to the right person. Nobody ever mentions it.', effect: { coins: -20 } },
        ],
      },
    },
  },
  {
    id: 'mgr-club-chaplain', title: 'The Chaplain', icon: '🙏', category: 'club',
    when: { minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club chaplain has been coming in on Wednesdays for eleven years and is retiring. He is not religious about it, in the main. He is mostly a man who noticed when people were struggling.',
        choices: [
          { id: 'replace', label: 'Appoint another one', desc: 'Same day, same role, a new face', outcome: 'It takes two years for anybody to open up to the new one. Then somebody does, at exactly the right moment, and the role justifies itself again.', effect: { coins: -40, squadMorale: 3, prestige: 1 } },
          { id: 'psychologist', label: 'Replace the role with a psychologist', desc: 'Modern, evidenced, clinical', outcome: 'Genuinely better for the four players who use it and no use whatsoever to the groundsman, who used to talk to the chaplain every Wednesday.', effect: { coins: -140, squadMorale: 4, prestige: -1 } },
          { id: 'nothing', label: 'Let the role go', desc: 'It was always a bit of an oddity', outcome: 'Nothing bad happens for two years. Then something does, and everybody in the building thinks about Wednesdays.', effect: { coins: 40, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-tannoy-announcer', title: 'The Voice Of The Ground', icon: '🔊', category: 'club',
    when: { minSeason: 3, minTier: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The announcer has read the teams out since 1997 in the same order with the same pause before the number nine. He has had a stroke and would like to keep doing it.',
        choices: [
          { id: 'keep', label: 'Keep him', desc: 'A chair by the mic and more time', outcome: 'He is slower and the pause before the number nine is longer and the whole ground waits for it. It is the best it has ever been.', effect: { prestige: 2, clubLegacy: { kind: 'tradition', label: 'the pause before the number nine' } } },
          { id: 'share', label: 'Pair him with somebody younger', desc: 'Share the job, keep the voice', outcome: 'He does the teams and nothing else. The arrangement is meant to last a season and lasts nine years.', effect: { prestige: 1 } },
          { id: 'retire', label: 'Retire him with a presentation', desc: 'Kind, final, and his decision made for him', outcome: 'He is applauded round the pitch at half time and does not come to a game again. The new announcer is very good and says the number nine straight through.', effect: { prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-ball-boys-payment', title: 'The Ball Boys', icon: '🧒', category: 'club',
    when: { minSeason: 2, minTier: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The ball boys are academy under-thirteens who stand in the rain for two hours and are given a bag of crisps. Somebody has pointed out that the club is a commercial operation.',
        choices: [
          { id: 'pay', label: 'Pay them properly', desc: 'A rate, a contract, a payslip', outcome: 'It costs almost nothing and every one of them keeps the first payslip. Two other clubs copy it within a year.', effect: { coins: -60, prestige: 2, clubLegacy: { kind: 'tradition', label: 'ball boys paid a proper rate' } } },
          { id: 'perks', label: 'Give them tickets instead', desc: 'Two seats each for the next home game', outcome: 'Their families come and spend money in the tea bar. It is cheaper than paying them and it is not the same thing.', effect: { coins: -20 } },
          { id: 'nothing', label: 'Leave it', desc: 'They queue up to do it as it is', outcome: 'They do queue up to do it. There is a piece in a national paper about ball boys eighteen months later and the club is in it.', effect: { prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-away-day-hosts', title: 'The Away Boardroom', icon: '🍵', category: 'club',
    when: { minSeason: 2, minTier: 3 }, weight: 1, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Visiting directors get a sandwich and a plastic cup here. The club has just been to a ground where they were given a proper meal and a tour, and it is being raised at the next board meeting.',
        choices: [
          { id: 'upgrade', label: 'Do it properly', desc: 'A hot meal, a host, a small gift', outcome: 'Word gets round the division within a season. Two loan deals happen partly because somebody remembered a good afternoon here.', effect: { coins: -120, boardMood: 1, prestige: 1 } },
          { id: 'keep', label: 'Keep the sandwiches', desc: 'It is not a hotel', outcome: 'Nothing changes and nobody starves. The club\'s reputation among visiting directors is described, in one letter, as brisk.', effect: {} },
          { id: 'players', label: 'Spend the money on the away dressing room instead', desc: 'Better showers, worse sandwiches', outcome: 'Visiting players notice and visiting directors do not. Two of those players sign here within five years.', effect: { coins: -120, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-pitch-invasion-promotion', title: 'When They Come On', icon: '🎉', category: 'club',
    when: { minSeason: 2, maxPos: 0.15, minTier: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'If they win, four thousand people are coming onto that pitch. The safety officer wants a plan. The plan the police want involves horses.',
        choices: [
          { id: 'let-it', label: 'Let them have it', desc: 'Get the players off first and stand back', outcome: 'A goalpost goes and the pitch needs relaying. Nobody is hurt and thirty years later people describe where they were stood.', effect: { coins: -180, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the afternoon they took the goalposts' } } },
          { id: 'stage', label: 'Do it properly with a stage after', desc: 'Keep them off, bring the players back out', outcome: 'It is organised and safe and about half as good. Twelve people come on anyway and are dealt with unnecessarily firmly.', effect: { coins: -60, prestige: 1 } },
          { id: 'police', label: 'Take the police plan', desc: 'Horses, cordons, a locked pitch', outcome: 'Not one person gets on. The club is invoiced for it and there are two arrests, both of teenagers, both regretted by everybody.', effect: { coins: -240, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-loan-player-digs', title: 'Digs', icon: '🛏️', category: 'club',
    when: { minSeason: 2, minTier: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The young loan signing is in a hotel by the ring road on his own, three hundred miles from home, and has been for six weeks. He is nineteen and has stopped answering his phone to the coaches.',
        choices: [
          { id: 'digs', label: 'Move him into digs with a family', desc: 'The old way, a spare room, a cooked tea', outcome: 'He is a different footballer within a fortnight. He goes back to that house at Christmas for the next twenty years.', effect: { coins: -60, playerMorale: { who: 'youngest', delta: 14 }, prestige: 1, clubLegacy: { kind: 'tradition', label: 'digs with a local family for every young loan' } } },
          { id: 'flat', label: 'Get him a flat in town', desc: 'Independence, a front door of his own', outcome: 'Better than the hotel and still quiet at seven in the evening. He is fine. He is not much more than fine.', effect: { coins: -100, playerMorale: { who: 'youngest', delta: 5 } } },
          { id: 'buddy', label: 'Make a senior player responsible for him', desc: 'Lifts, meals, a phone that gets answered', outcome: 'The senior player takes it seriously and complains about it constantly. The lad plays the best football of his career.', effect: { playerMorale: { who: 'youngest', delta: 10 }, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-supporter-illness-fund', title: 'The Bucket Collection', icon: '🪣', category: 'club',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A season-ticket holder\'s daughter needs treatment abroad. The supporters have organised a bucket collection and asked whether the club will let them do it at the turnstiles.',
        choices: [
          { id: 'match', label: 'Let them, and match whatever they raise', desc: 'Out of a budget with no line for this', outcome: 'The buckets take nine thousand. The club matches it without a press release and the family find out from the treasurer.', effect: { coins: -240, prestige: 3, clubLegacy: { kind: 'tradition', label: 'the club matches every bucket collection' } } },
          { id: 'allow', label: 'Let them do it', desc: 'The club\'s job is to open the gates', outcome: 'Nine thousand pounds in buckets on a wet Tuesday. The club is thanked in a way that is entirely deserved and slightly undeserved.', effect: { prestige: 1 } },
          { id: 'decline', label: 'Point them at the club charity', desc: 'There is a process for this', outcome: 'There is a process. It takes eleven weeks and produces less money, and the family stop coming.', effect: { prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-shirt-numbering-tradition', title: 'One To Eleven', icon: '🔢', category: 'club',
    when: { minSeason: 3, minTier: 4 }, weight: 1, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'At this level the club still numbers the shirts one to eleven by position each week. Three players have asked if they can have squad numbers like everybody else.',
        choices: [
          { id: 'keep', label: 'Keep it', desc: 'The number tells you where he plays', outcome: 'A left-winger wears eleven and a centre-half wears five and every child in the ground learns the shape of a team without being told.', effect: { prestige: 1, clubLegacy: { kind: 'tradition', label: 'shirts numbered one to eleven, by position' } } },
          { id: 'change', label: 'Move to squad numbers', desc: 'Sell more shirts with names on', outcome: 'The shop takes a great deal more money. Somebody wears seventy-seven and an old man in the paddock says something about it every week.', effect: { coins: 160, prestige: -1 } },
          { id: 'compromise', label: 'One to eleven for the starters, squad numbers for the bench', desc: 'A muddle with a logic to it', outcome: 'It confuses the announcer, the printer and the referee\'s assistant. It lasts one season and is remembered fondly.', effect: { coins: 40 } },
        ],
      },
    },
  },
  {
    id: 'mgr-under-soil-heating', title: 'Frozen', icon: '❄️', category: 'club',
    when: { minTier: 3, maxCoins: 600 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three home games called off in January for frost. The refunds, the rearranged midweeks and the lost bar takings add up to more than anybody wants to say out loud.',
        choices: [
          { id: 'install', label: 'Install undersoil heating', desc: 'An enormous bill and no more frozen Januarys', outcome: 'It takes a summer and a loan. They never lose another home game to frost and the running cost is mentioned in every budget meeting for a decade.', effect: { coins: -560, boardMood: -1, clubLegacy: { kind: 'reputation', label: 'a pitch that has never frozen since' } } },
          { id: 'covers', label: 'Buy pitch covers and a lot of volunteers', desc: 'The cheap version that mostly works', outcome: 'Twenty people rolling out covers at nine at night in a wind. It saves two games out of three and creates a small, strange fellowship.', effect: { coins: -160, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the cover crew, out in every frost' } } },
          { id: 'live', label: 'Live with it', desc: 'It has frozen every January since 1921', outcome: 'It freezes again next January. The fixture pile-up in April costs them four points they can point at precisely.', effect: { squadMorale: -4, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-ex-player-testimonial-ask', title: 'A Testimonial Nobody Wants', icon: '🎗️', category: 'club',
    when: { minSeason: 4 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A player who gave the club eleven years and left badly has asked for a testimonial. Half the boardroom remember the eleven years. The other half remember the leaving.',
        choices: [
          { id: 'grant', label: 'Give him the game', desc: 'A July evening, a full squad, no conditions', outcome: 'Six thousand come. He speaks for four minutes on the pitch and apologises for something most of them had forgotten.', effect: { coins: -40, prestige: 2, boardMood: -1 } },
          { id: 'conditional', label: 'Grant it with conditions', desc: 'A friendly, yes; the first team, no', outcome: 'He takes it, because it is that or nothing. It is a smaller night than he deserved and larger than the board wanted.', effect: { prestige: 1 } },
          { id: 'refuse', label: 'Refuse', desc: 'He knows exactly why', outcome: 'It is entirely defensible and it is in a Sunday paper within a month, told from his side, and his side is quite persuasive.', effect: { prestige: -2, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-training-ground-move', title: 'Leaving The Old Training Ground', icon: '📦', category: 'club',
    when: { minSeason: 4, minCoins: 500 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The new training ground is finished. Four pitches, a proper gym, glass. The old one is a farmhouse, two pitches and a boiler that has to be hit. Everybody says they are glad and about half of them mean it.',
        choices: [
          { id: 'clean-break', label: 'Move everything and sell the old site', desc: 'Forward, and no looking back', outcome: 'The new place is superb and silent. It takes three years to feel like anywhere at all, and the boiler is a story people tell.', effect: { coins: 400, squadMorale: -4, boardMood: 2 } },
          { id: 'keep-old', label: 'Keep the old site for the academy', desc: 'The kids get the farmhouse', outcome: 'Two sites to maintain, and the fifteen-year-olds grow up somewhere that has a smell and a history. Several of them prefer it.', effect: { coins: -200, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the academy in the old farmhouse' } } },
          { id: 'take-things', label: 'Take pieces of it with you', desc: 'The boot room door, the boiler, the sign', outcome: 'A door that does not match anything, hung in a glass corridor. It is quietly one of the best things about the new building.', effect: { coins: -40, squadMorale: 3, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-badge-on-the-kit-of-the-town', title: 'Everybody\'s Badge', icon: '🧵', category: 'club',
    when: { minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nine junior sides in the town play in the club\'s colours with a slightly wrong version of the badge on the chest. The lawyers have drafted a letter about trademarks.',
        choices: [
          { id: 'licence', label: 'Give them all a licence for nothing', desc: 'And send them the proper artwork', outcome: 'Nine hundred children in the correct badge. Three of them sign here. The letter is deleted and the lawyer is baffled.', effect: { prestige: 2, clubLegacy: { kind: 'tradition', label: 'the badge given free to every junior side in the town' } } },
          { id: 'kit', label: 'Supply their kit as well', desc: 'A cost line that will grow every year', outcome: 'It grows every year. It is also the reason that when the club is in trouble in 2044 the town turns out.', effect: { coins: -260, prestige: 3 } },
          { id: 'send', label: 'Send the letter', desc: 'A trademark you do not defend is a trademark you lose', outcome: 'Legally correct. Nine junior clubs change their shirts and one of them changes to the rivals\' colours out of spite.', effect: { prestige: -3, tag: 'mgr-sued-the-kids' } },
        ],
      },
    },
  },
  {
    id: 'mgr-safety-certificate-cut', title: 'The Capacity Cut', icon: '🧯', category: 'club',
    when: { minSeason: 3, minTier: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The safety certificate has been cut by two thousand pending work on a terrace. It is six weeks before the biggest home game in years and there are already tickets in people\'s hands.',
        choices: [
          { id: 'rush', label: 'Get the work done in six weeks', desc: 'Overtime, weekends, a contractor who owes a favour', outcome: 'It is signed off on the Thursday before. The bill has a number on it that the finance director reads out twice.', effect: { coins: -420, prestige: 1 } },
          { id: 'refund', label: 'Ballot and refund two thousand', desc: 'Fair, transparent and miserable', outcome: 'The ballot is run properly and two thousand people who had a ticket do not have one. Eleven of them never renew.', effect: { coins: -120, prestige: -1 } },
          { id: 'screen', label: 'Put the game on a screen in the town hall', desc: 'Somewhere for the two thousand to be', outcome: 'Fourteen hundred of them go. It is not the same and it is a great deal better than a refund and an afternoon at home.', effect: { coins: -60, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-first-team-visit-reserves', title: 'The Reserves Play On A Thursday', icon: '🌙', category: 'club',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The reserves play on Thursday nights in front of about sixty people, half of whom are parents. No first-team player has been to one since the manager arrived.',
        choices: [
          { id: 'attend', label: 'Make the whole first team attend one', desc: 'Stand behind the goal, in the cold, like everybody else', outcome: 'The under-twenty-ones play out of their skins. Two of them are on the bench on Saturday and one of them is not the one anybody expected.', effect: { squadMorale: 2, playerMorale: { who: 'youngest', delta: 10 }, prestige: 1 } },
          { id: 'himself', label: 'Go himself, every week', desc: 'Thursday nights, on his own, notebook out', outcome: 'He misses two family evenings a month and knows the name of every player at the club, which turns out to matter more than anybody predicted.', effect: { prestige: 2, tag: 'mgr-knows-every-name' } },
          { id: 'move', label: 'Move the games to Saturday mornings', desc: 'More people, worse preparation', outcome: 'The crowd trebles to a hundred and eighty. The players lose a proper matchday rhythm and the coaches say so all season.', effect: { prestige: 1, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-club-in-administration-town', title: 'The Rivals Go Under', icon: '⚫', category: 'club',
    when: { minSeason: 4 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club nine miles away has gone into administration. Their supporters have been singing about this club for sixty years and are now standing outside their own ground with buckets.',
        choices: [
          { id: 'help', label: 'Send help', desc: 'A collection, a friendly, and the use of the training ground', outcome: 'It is not popular in the pubs for about a fortnight. The fixture between the two clubs is never quite the same again, and it is better.', effect: { coins: -140, prestige: 2, clubLegacy: { kind: 'rivalry', label: 'the derby that changed when one club nearly died' } } },
          { id: 'silent', label: 'Say nothing', desc: 'It is not this club\'s business', outcome: 'Nothing is said, nothing is done and nothing is forgotten. The next derby has an edge to it that has no humour in it at all.', effect: { clubLegacy: { kind: 'rivalry', label: 'a derby with no humour left in it' } } },
          { id: 'poach', label: 'Sign four of their best players', desc: 'They are available and the club needs them', outcome: 'Four excellent signings for almost nothing. It is entirely legal, it is what everybody else is doing, and it is remembered as something else.', effect: { coins: -80, squadMorale: 6, prestige: -2, clubLegacy: { kind: 'rivalry', label: 'the four players taken while they were down' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-media-suite-vs-creche', title: 'The Room Under The Stand', icon: '🚼', category: 'club',
    when: { minSeason: 3, minTier: 2, maxTier: 5 }, weight: 1, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is one spare room. The media department want it for a studio, and a group of supporters want it for a matchday creche so that parents of small children can actually come.',
        choices: [
          { id: 'creche', label: 'The creche', desc: 'Fewer clips, more people in the ground', outcome: 'It is booked out from the first week. Forty adults a game who had not been in five years, and a room that sounds like a nursery.', effect: { coins: -80, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the matchday creche under the stand' } } },
          { id: 'studio', label: 'The studio', desc: 'Content, sponsors, reach', outcome: 'The output is much better and a sponsor pays for the lighting. The creche group are told there may be space in a couple of years.', effect: { coins: 220, prestige: -1 } },
          { id: 'share', label: 'Both, on different days', desc: 'A studio on Tuesdays, a creche on Saturdays', outcome: 'It works badly and it works. There is a permanent argument about a green screen and about eleven hundred hours of childcare a year.', effect: { coins: 60, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-ground-name-sponsor', title: 'Selling The Ground\'s Name', icon: '🏷️', category: 'club',
    when: { minSeason: 3, minTier: 1, maxTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The ground has been called the same thing since 1908 because that is the road it is on. There is an offer on the table to call it something else for eight years.',
        choices: [
          { id: 'sell', label: 'Sell the name', desc: 'Eight years of certainty, one name gone', outcome: 'The money underwrites the academy and two signings. Every supporter, every commentator and eventually every sponsor keeps using the old name.', effect: { coins: 700, boardMood: 3, prestige: -3, clubLegacy: { kind: 'reputation', label: 'a ground with a sold name nobody uses' } } },
          { id: 'refuse', label: 'Refuse', desc: 'Turn down money over a road name', outcome: 'It stays what it has been since 1908. The gap in the budget is filled by selling a midfielder in January.', effect: { coins: -200, prestige: 3, clubLegacy: { kind: 'tradition', label: 'the ground name never sold' } } },
          { id: 'stand-only', label: 'Sell a stand name instead', desc: 'Give them something smaller', outcome: 'They take it at a third of the price. One stand has a company on it and the ground has its name and everybody can live with that.', effect: { coins: 300, prestige: -1, clubLegacy: { kind: 'stand', label: 'the sponsored stand, and the ground that kept its name' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-remembrance-poppy-row', title: 'The Eleventh', icon: '🌺', category: 'club',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A former player who served is laying a wreath before the game. Somebody has suggested a flypast, a band and a full ceremony. His family have asked whether it could be shorter.',
        choices: [
          { id: 'small', label: 'Keep it small', desc: 'A wreath, a bugler, silence, kick-off', outcome: 'Ninety seconds and not a sound. The family are grateful and one of the sponsors is disappointed there was no photograph of it.', effect: { prestige: 2, clubLegacy: { kind: 'tradition', label: 'the short remembrance, done properly' } } },
          { id: 'full', label: 'Do the full ceremony', desc: 'Band, standards, twenty minutes', outcome: 'It is impressive and long and the delayed kick-off annoys the broadcaster. The family stand through all of it and say nothing.', effect: { prestige: -1, boardMood: 1 } },
          { id: 'ask', label: 'Ask the family to decide it', desc: 'Hand the whole thing over', outcome: 'They choose a wreath, a piper and his grandson to lay it. It is better than anything the club would have designed.', effect: { prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-boot-room-tradition', title: 'The Boot Room', icon: '👟', category: 'club',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The coaching staff still have a cup of tea in the boot room after every session and it is where every real decision about this club gets made. The new performance director would like those conversations minuted.',
        choices: [
          { id: 'refuse', label: 'Refuse to minute it', desc: 'A room where people can be wrong out loud', outcome: 'Nothing is written down and everything is said. The director writes a paragraph about governance that nobody upstairs reads.', effect: { prestige: 1, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the boot room, never minuted' } } },
          { id: 'comply', label: 'Minute it', desc: 'Transparency, records, accountability', outcome: 'The conversations move to the car park. The minutes are immaculate and describe about a fifth of what actually happens.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'invite', label: 'Invite the director in', desc: 'Give him a cup and a chair', outcome: 'He is quiet for three weeks and then argues brilliantly about a full-back. The request to minute it is never mentioned again.', effect: { prestige: 2, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-club-historian-argument', title: 'The Founding Date', icon: '📜', category: 'club',
    when: { minSeason: 4 }, weight: 1, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club historian has found a newspaper report proving the club was founded two years earlier than the badge says. The centenary was celebrated on the wrong date, twice.',
        choices: [
          { id: 'correct', label: 'Correct the badge', desc: 'Two numbers, a lot of stock to reprint', outcome: 'The date changes. There are people who will tell you, with real feeling, that they preferred the wrong one.', effect: { coins: -100, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the founding date corrected by two years' } } },
          { id: 'keep', label: 'Keep the date on the badge', desc: 'It has been wrong for a hundred years', outcome: 'The badge stays wrong and the history book gets a footnote. The historian is furious in a very polite and permanent way.', effect: { prestige: -1 } },
          { id: 'celebrate', label: 'Celebrate the earlier date as well', desc: 'Two anniversaries, no losers', outcome: 'A second birthday, in a different month, with a different friendly. It is faintly ridiculous and it sells a lot of shirts.', effect: { coins: 140, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-community-trust-split', title: 'The Community Arm', icon: '🌳', category: 'club',
    when: { minSeason: 3, minTier: 1, maxTier: 4, facility: { key: 'community', min: 5 } }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club\'s community trust now employs more people than the football side and has been offered funding to become fully independent. The commercial department would rather it stayed in-house.',
        choices: [
          { id: 'independent', label: 'Let it go independent', desc: 'More funding, less control', outcome: 'It doubles in size in four years and does work the club could never have funded. It also stops turning up when marketing want a photograph.', effect: { prestige: 2, coins: -100, clubLegacy: { kind: 'reputation', label: 'a community trust bigger than the football club' } } },
          { id: 'keep', label: 'Keep it in-house', desc: 'One badge, one message, one budget', outcome: 'The funding goes elsewhere. The trust does good work at half the scale and is on every piece of club marketing.', effect: { coins: 160, prestige: -1 } },
          { id: 'shared', label: 'Independent, with a seat kept for the club', desc: 'The fiddliest possible structure', outcome: 'Four months of lawyers. It ends up with most of the funding and most of the connection, and no one is entirely satisfied.', effect: { coins: -60, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-away-fans-tickets-cut', title: 'Cutting The Away Allocation', icon: '✂️', category: 'club',
    when: { minSeason: 3, minTier: 1, maxTier: 4 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The commercial case for cutting the away allocation to the minimum and selling those seats at home prices is on one sheet of paper and it is a very persuasive sheet of paper.',
        choices: [
          { id: 'cut', label: 'Cut it to the minimum', desc: 'Eleven hundred extra home seats a game', outcome: 'The revenue is exactly as predicted. Every away club in the division cuts theirs in return within two seasons.', effect: { coins: 340, prestige: -2, clubLegacy: { kind: 'reputation', label: 'the club that cut the away end first' } } },
          { id: 'keep', label: 'Keep the full allocation', desc: 'Turn down the money, keep the noise', outcome: 'Three thousand away supporters make a Tuesday night feel like something. The sheet of paper comes back every summer.', effect: { boardMood: -1, prestige: 2 } },
          { id: 'reciprocal', label: 'Offer every club a reciprocal deal', desc: 'Full allocations both ways, agreed in writing', outcome: 'Six clubs sign it and four do not. It is the only thing the manager does that year that gets mentioned at the league AGM.', effect: { prestige: 2, clubLegacy: { kind: 'tradition', label: 'the reciprocal away allocation agreement' } } },
        ],
      },
    },
  },
];
