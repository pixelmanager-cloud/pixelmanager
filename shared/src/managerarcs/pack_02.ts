// Manager-arc authoring pack 02. ONE author owns this file — nobody else writes to it.
// See shared/src/managerarc.ts for the ManagerArc shape, the situation gates and the effect vocabulary.
//
// This pack: the boardroom and the transfer window. The people upstairs, and the people on the phone.
import type { ManagerArc } from '../managerarc.js';

export const MGR_ARCS_02: ManagerArc[] = [
  // ── BOARDROOM ────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-takeover-rumour', title: 'Men In The Car Park', icon: '🏛️', category: 'boardroom',
    when: { minSeason: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three men walked the pitch on Tuesday morning and nobody introduced them. The chairman says it was a survey. There was no survey.',
        choices: [
          { id: 'ask', label: 'Ask the chairman straight', desc: 'Make him say the word out loud', outcome: 'He says the club is not for sale in the tone of a man reading it off a card. Then he asks how the left-back’s knee is.', effect: { boardMood: -1, tag: 'mgr-smelled-a-takeover' }, next: 'wait' },
          { id: 'ignore', label: 'Get on with the football', desc: 'It is not his club and never was', outcome: 'He takes training. It is the best session for a month, because for ninety minutes nobody upstairs exists.', effect: { squadMorale: 4 }, next: 'wait' },
          { id: 'position', label: 'Make himself useful to whoever it is', desc: 'A quiet word with the men in the coats', outcome: 'He shakes two hands and gives one honest answer about the squad. It may be the smartest thing he ever did, or a sackable one.', effect: { prestige: 1, boardMood: -2, tag: 'mgr-courted-the-buyers' }, next: 'wait' },
        ],
      },
      wait: {
        id: 'wait',
        prompt: 'Nothing happens for eleven weeks. Then a statement goes up on the club website at ten past four on a Friday.',
        choices: [
          { id: 'welcome', label: 'Welcome them publicly', desc: 'Say the right things and mean about half of them', outcome: 'The new people like him for a fortnight, which is roughly a fortnight longer than they liked his predecessor.', effect: { boardMood: 2, coins: 300 } },
          { id: 'guarded', label: 'Say nothing until he knows more', desc: 'No promises to people he has not met', outcome: 'He is described in one paper as cautious. In the building it is read as loyal to the old man, and that cuts both ways.', effect: { boardMood: -1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-new-chairman', title: 'The New Man', icon: '🎩', category: 'boardroom',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The new chairman has been in post nine days and has already moved the furniture in the boardroom. He wants an hour. He has a laptop with him.',
        choices: [
          { id: 'charm', label: 'Give him the hour and the tour', desc: 'Training ground, laundry, the lot', outcome: 'They end up in the kit room talking about boilers for twenty minutes. He leaves warmer than he arrived and no better informed.', effect: { boardMood: 2 } },
          { id: 'numbers', label: 'Meet him with numbers', desc: 'Speak the language he brought with him', outcome: 'The spreadsheet holds up. He asks two good questions and one that shows he has never watched a full match in his life.', effect: { boardMood: 1, prestige: 1, tag: 'mgr-speaks-their-language' } },
          { id: 'terms', label: 'Ask what he wants from him', desc: 'Get the expectation on the table on day one', outcome: 'He says survival, then says top half, then laughs. Two of those were true and neither man knows which.', effect: { boardMood: -1, coins: 180 } },
        ],
      },
    },
  },
  {
    id: 'mgr-budget-cut-midseason', title: 'A Revised Figure', icon: '✂️', category: 'boardroom',
    when: { minSeason: 2, maxCoins: 400 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The budget agreed in June has been revised in November. Nobody revised it upwards in his lifetime. The email arrives at 7.40 on a matchday.',
        choices: [
          { id: 'swallow', label: 'Take it and say nothing', desc: 'Absorb it, protect the room', outcome: 'The players never hear about it. He rewrites the January plan on the back of a team sheet and bins the good version.', effect: { boardMood: 2, prestige: -1 } },
          { id: 'fight', label: 'Go upstairs before kick-off', desc: 'Now, while he still has leverage', outcome: 'He wins about a third of it back and loses whatever goodwill was in the room. He takes the third.', effect: { coins: 150, boardMood: -2 } },
          { id: 'youth', label: 'Rebuild the plan around the kids', desc: 'Spend nothing, promote two', outcome: 'Two seventeen-year-olds are told on the Monday. One of them cries in the car park, and not from nerves.', effect: { playerMorale: { who: 'youngest', delta: 14 }, squadMorale: -3, tag: 'mgr-went-young' } },
        ],
      },
    },
  },
  {
    id: 'mgr-director-team-sheet', title: 'Opinions On The Eleven', icon: '📋', category: 'boardroom',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A director stops him in the corridor to say the number nine is not being used properly. He says it lightly, the way people say things they have rehearsed.',
        choices: [
          { id: 'polite', label: 'Thank him and change nothing', desc: 'Agree with the words, ignore the content', outcome: 'It works for a month. Then it happens again, in front of two other directors, and the lightness has gone out of it.', effect: { boardMood: 1, tag: 'mgr-humoured-a-director' } },
          { id: 'shut', label: 'Tell him where the line is', desc: 'Firmly, in the corridor, out loud', outcome: 'The director does not raise his voice, which is worse. He simply stops speaking to him entirely, for two years.', effect: { boardMood: -2, prestige: 1, squadMorale: 3 } },
          { id: 'invite', label: 'Invite him to a video session', desc: 'Let the clips do the arguing', outcome: 'Forty minutes of the number nine making runs nobody found. The director goes quiet and, to his credit, never mentions it again.', effect: { boardMood: 1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-rival-approach', title: 'A Better Job', icon: '📞', category: 'boardroom',
    when: { minSeason: 3, maxPos: 0.4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club two divisions of ambition above this one has asked permission to speak to him. His chairman rang to tell him he had said no, and then said the decision was his.',
        choices: [
          { id: 'stay', label: 'Stay, and say so publicly', desc: 'Kill it before it grows', outcome: 'He says it into a microphone on the Friday and means it on the Friday. The terraces sing his name for six weeks.', effect: { boardMood: 3, squadMorale: 8, prestige: -1, clubLegacy: { kind: 'reputation', label: 'The manager who turned them down' } } },
          { id: 'listen', label: 'Take the meeting', desc: 'No harm in hearing a number', outcome: 'It leaks by Wednesday. He stays anyway, which nobody believes, and the goodwill he had is now a thing he has to earn back.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-took-the-meeting' } },
          { id: 'leverage', label: 'Use it upstairs', desc: 'A new contract, a bigger budget, today', outcome: 'He gets both. The chairman signs the paper and looks at him differently across the table for the rest of his time at the club.', effect: { coins: 500, boardMood: -1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-sponsor-demand', title: 'The Sponsor Would Like', icon: '🤝', category: 'boardroom',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The shirt sponsor wants the first team on a shoot the morning after an away trip of three hundred miles. Commercial say it is worth a lot. It is worth a lot.',
        choices: [
          { id: 'do-it', label: 'Send the squad', desc: 'The money is real and the training is not sacred', outcome: 'Four hours in a cold warehouse pretending to laugh. The session that afternoon is the worst of the season and the invoice is paid.', effect: { coins: 350, squadMorale: -7 } },
          { id: 'send-few', label: 'Send three and the mascot', desc: 'Give them something, keep the rest in bed', outcome: 'Commercial are unhappy, the sponsor never notices, and the three who went are quietly furious for a week.', effect: { coins: 180, playerMorale: { who: 'star', delta: -5 }, boardMood: -1 } },
          { id: 'refuse', label: 'Refuse outright', desc: 'Recovery is the job', outcome: 'He wins the argument and it costs the club a renewal clause nobody tells him about until June.', effect: { squadMorale: 6, boardMood: -3, coins: -120 } },
        ],
      },
    },
  },
  {
    id: 'mgr-stadium-plan', title: 'Drawings On A Table', icon: '🏗️', category: 'boardroom',
    when: { minSeason: 4 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They have unrolled plans for a new stand on the boardroom table. It closes the corner where the loudest thousand have stood since before anybody in the room was born.',
        choices: [
          { id: 'back', label: 'Back the build', desc: 'Seats, money, a future', outcome: 'It goes up in fourteen months and it is very good. Something in the noise on a Tuesday night is never quite the same.', effect: { boardMood: 3, coins: 250, clubLegacy: { kind: 'stand', label: 'The new corner stand' } } },
          { id: 'fight-corner', label: 'Fight for the corner', desc: 'Ask them to build around the singers', outcome: 'It costs more and takes longer and they do it. Twenty years later there are still men who buy him a drink for it.', effect: { boardMood: -2, prestige: 2, clubLegacy: { kind: 'tradition', label: 'The corner they kept' } } },
          { id: 'neutral', label: 'Stay out of it', desc: 'Bricks are not his department', outcome: 'The plans go through. He is asked about it on local radio and gives an answer so careful it makes the paper for being careful.', effect: { boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-audit', title: 'Two Weeks Of Boxes', icon: '🧾', category: 'boardroom',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Auditors have taken over the room next to the physio. They want signing-on schedules, agent invoices and a receipt for a minibus from four years ago.',
        choices: [
          { id: 'cooperate', label: 'Give them everything', desc: 'Open every drawer and let them look', outcome: 'It takes a fortnight of his time and finds nothing worse than sloppiness. The relief in the boardroom is the loudest thing that month.', effect: { boardMood: 2, prestige: 1 } },
          { id: 'delegate', label: 'Hand it to the secretary and go coaching', desc: 'It is not a football problem', outcome: 'The club secretary does it alone, badly, and takes six weeks. Something small and awkward turns up in March.', effect: { boardMood: -1, tag: 'mgr-audit-loose-end' } },
          { id: 'lawyer', label: 'Ask for his own representation', desc: 'Protect himself first', outcome: 'Perfectly reasonable and read as an admission by everyone above him. His signature is checked twice on everything from then on.', effect: { boardMood: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-owner-gone-quiet', title: 'Unreturned Calls', icon: '📵', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 500 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The owner has not answered a call in five weeks. Wages went out late. Nobody upstairs will say the word cashflow, so everybody says timing.',
        choices: [
          { id: 'chase', label: 'Fly out and knock on his door', desc: 'Two days, his own money, no appointment', outcome: 'He gets ten minutes in a hotel lobby and a promise. The promise is honoured six weeks later, mostly.', effect: { coins: 300, boardMood: 1, prestige: 1, tag: 'mgr-chased-the-owner' } },
          { id: 'cover', label: 'Hold the building together', desc: 'Tell the staff it is fine and act like it is', outcome: 'The kit man and two physios stay because he asked them to. He does not sleep well for a month.', effect: { squadMorale: 5, prestige: -1 } },
          { id: 'go-public', label: 'Say it out loud on Friday', desc: 'Force a hand in front of a microphone', outcome: 'It is on the front of the local paper by Saturday. The money appears on Monday and so does a letter about his conduct.', effect: { coins: 400, boardMood: -3, tag: 'mgr-went-public' } },
        ],
      },
    },
  },
  {
    id: 'mgr-marquee-forced', title: 'A Name They Want', icon: '🌟', category: 'boardroom',
    when: { minSeason: 3, minCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board have found a signing. He is thirty-two, he sells shirts, and he does not run. They have already told the sponsor about him.',
        choices: [
          { id: 'sign', label: 'Sign him and make it work', desc: 'Build a shape around his legs', outcome: 'Nine goals, no pressing, and the ground is fuller than it has been in six years. Half the coaching staff hate every minute of it.', effect: { coins: -600, boardMood: 3, squadMorale: -4, prestige: 1, tag: 'mgr-took-the-marquee' } },
          { id: 'refuse', label: 'Refuse the signing', desc: 'Say no to the board and to the money', outcome: 'They accept it with a stiffness that lasts until Christmas. The budget for the summer is quietly smaller.', effect: { boardMood: -3, squadMorale: 6, coins: -100 } },
          { id: 'counter', label: 'Offer them a different name', desc: 'Someone he wants, sold as someone they want', outcome: 'He spends an evening making a twenty-four-year-old sound like an event. It half works, which is more than he expected.', effect: { coins: -400, boardMood: 1, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-contract-offer', title: 'Two More Years', icon: '🖊️', category: 'boardroom',
    when: { minSeason: 3, maxPos: 0.55 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They have put an extension in front of him. It is not much more money and it is a great deal more time. The pen on the table is the club’s pen.',
        choices: [
          { id: 'sign', label: 'Sign it', desc: 'Security, and a longer rope', outcome: 'The photograph goes up on the website. Everybody involved knows a contract has never once stopped a sacking.', effect: { boardMood: 2, prestige: 1, tag: 'mgr-extended' } },
          { id: 'haggle', label: 'Push for the budget instead of the salary', desc: 'Trade his own money for the squad’s', outcome: 'They agree because it is cheaper. He signs for less than he was worth and gets two players he needed.', effect: { coins: 450, boardMood: 1, squadMorale: 5 } },
          { id: 'wait', label: 'Let it sit until spring', desc: 'See where the table lands first', outcome: 'The offer is not repeated in spring. It is not withdrawn either. It simply stops being mentioned.', effect: { boardMood: -1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-fans-forum', title: 'A Room Of Season Tickets', icon: '🎤', category: 'boardroom',
    when: { minSeason: 2, minPos: 0.45 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board have arranged a supporters’ forum and put him on the panel with two directors. Three hundred tickets went in an hour, which is not usually a good sign.',
        choices: [
          { id: 'honest', label: 'Tell them the truth about the money', desc: 'Even the parts the directors would rather he did not', outcome: 'The room goes very quiet and then applauds him for a long time. Two seats along, a director stares at the table.', effect: { boardMood: -2, prestige: 3, tag: 'mgr-told-the-terraces' } },
          { id: 'loyal', label: 'Defend the board all night', desc: 'Take the questions meant for them', outcome: 'He absorbs two hours of it and gives nothing away. Upstairs they remember. On the terraces, so do they.', effect: { boardMood: 3, prestige: -2 } },
          { id: 'football', label: 'Talk only about football', desc: 'Shape, injuries, the run of fixtures', outcome: 'Forty minutes of genuinely interesting coaching talk in a room that came for a fight. It works better than anyone expected.', effect: { prestige: 1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-sell-the-training-ground', title: 'The Land At The Back', icon: '🚜', category: 'boardroom',
    when: { minSeason: 4, maxCoins: 350, facility: { key: 'training', min: 3 } }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A developer wants the two pitches behind the training ground. The board want the money. The under-18s want somewhere to play on a Thursday.',
        choices: [
          { id: 'sell', label: 'Let it go', desc: 'Take the cash and share the pitches', outcome: 'The money clears in April. The youth teams train on a rota and the best sixteen-year-old goes to a club with grass.', effect: { coins: 700, boardMood: 3, playerMorale: { who: 'youngest', delta: -12 }, tag: 'mgr-sold-the-pitches' } },
          { id: 'block', label: 'Block it', desc: 'Stand in front of the diggers', outcome: 'He spends every ounce of credit he has and keeps two fields of grass. Nobody ever thanks him for it in public.', effect: { boardMood: -3, prestige: 1, clubLegacy: { kind: 'tradition', label: 'The back pitches, kept' } } },
          { id: 'half', label: 'Sell one, keep one', desc: 'Split the difference and satisfy no one', outcome: 'A compromise everyone can live with and nobody defends. There is one pitch, and it is bald by February.', effect: { coins: 380, boardMood: 1, playerMorale: { who: 'youngest', delta: -4 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-stand-renaming', title: 'A Name On The Bricks', icon: '🪧', category: 'boardroom',
    when: { minSeason: 5 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A donor has offered enough to clear the overdraft. He would like the North Stand to carry his family name. It currently carries the name of a street that no longer exists.',
        choices: [
          { id: 'accept', label: 'Take the money', desc: 'A name is only paint', outcome: 'The overdraft goes. So does the old sign, into a skip, and a man in his seventies is photographed rescuing it.', effect: { coins: 800, boardMood: 3, prestige: -1, clubLegacy: { kind: 'stand', label: 'The stand that was sold' } } },
          { id: 'refuse', label: 'Refuse on principle', desc: 'Some things are not for sale', outcome: 'The donor goes elsewhere and the club spends two years in the red. The sign is still there. So, eventually, is he.', effect: { boardMood: -3, prestige: 2, clubLegacy: { kind: 'tradition', label: 'The stand that kept its name' } } },
          { id: 'compromise', label: 'Offer him a lounge instead', desc: 'His name on something smaller', outcome: 'He takes it, faintly insulted, and gives about half. The lounge carpet is very good and nobody uses the room.', effect: { coins: 380, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-ticket-rise', title: 'Nine Pounds More', icon: '🎟️', category: 'boardroom',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Season tickets are going up and the board would like him in the video announcing it. Commercial have written him three sentences about ambition.',
        choices: [
          { id: 'front', label: 'Do the video', desc: 'Be the face of it', outcome: 'It is a bad two minutes that will be replayed every time the team loses for the next four years.', effect: { boardMood: 3, coins: 200, prestige: -2 } },
          { id: 'refuse-video', label: 'Refuse to front it', desc: 'Let the men who decided it announce it', outcome: 'A director reads the sentences instead and does it badly. Upstairs, the refusal is filed away and remembered.', effect: { boardMood: -2, prestige: 1 } },
          { id: 'condition', label: 'Do it if the kids’ prices are frozen', desc: 'A price for his face', outcome: 'They freeze them. He says the three sentences and adds a fourth of his own, which is the only one anybody quotes.', effect: { boardMood: 1, prestige: 1, coins: 120 } },
        ],
      },
    },
  },
  {
    id: 'mgr-sporting-director', title: 'A Layer Above', icon: '🗂️', category: 'boardroom',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They have appointed a sporting director. He found out from a press release forwarded to him by a reporter, with the word "thoughts?" above it.',
        choices: [
          { id: 'work-with', label: 'Take him to lunch on the first day', desc: 'Decide to make it work before it can fail', outcome: 'The man turns out to be good, and the recruitment gets sharper than it has ever been. It is still one more voice in every decision.', effect: { boardMood: 2, coins: 200, prestige: -1, tag: 'mgr-has-a-sd' } },
          { id: 'territory', label: 'Draw the line at the first team', desc: 'He picks the eleven and that is all', outcome: 'The line holds for a season and a half. Then a signing arrives that he did not ask for and did not want.', effect: { boardMood: -2, prestige: 1 } },
          { id: 'resign-threat', label: 'Tell the board it is him or them', desc: 'A gamble on his own standing', outcome: 'They blink, and the appointment is quietly restructured into a scouting role. He has now used something he cannot use twice.', effect: { boardMood: -3, prestige: 2, tag: 'mgr-played-his-ace' } },
        ],
      },
    },
  },
  {
    id: 'mgr-kitman-redundancy', title: 'Forty-One Years', icon: '🧺', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 300 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The restructure has three names on it. One of them has washed the kit since before the manager was born and knows every player’s boot size without looking.',
        choices: [
          { id: 'save-him', label: 'Take the cut from his own budget', desc: 'Lose a scout, keep the kit man', outcome: 'The old man never learns why his name came off the list. Recruitment is one pair of eyes lighter for two years.', effect: { coins: -150, squadMorale: 7, boardMood: -1, prestige: 1 } },
          { id: 'sign-off', label: 'Sign the list', desc: 'It is the job, and the numbers are the numbers', outcome: 'He tells him himself rather than letting HR do it. The handshake at the door takes a long time.', effect: { coins: 200, boardMood: 2, squadMorale: -8 } },
          { id: 'testimonial', label: 'Sign it, then organise a night for him', desc: 'A full house and a cheque', outcome: 'Eleven hundred people come. It does not give him his job back and everybody in the room knows that.', effect: { coins: 80, squadMorale: -3, prestige: 2, clubLegacy: { kind: 'tradition', label: 'The kit man’s night' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-badge-redesign', title: 'The Crest', icon: '🛡️', category: 'boardroom',
    when: { minSeason: 4 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Marketing have modernised the badge. The ship has gone. The date has gone. There is a circle now, and it works very well on a phone screen.',
        choices: [
          { id: 'back-it', label: 'Support it publicly', desc: 'It is a logo, and the club needs the sales', outcome: 'It sells. Three thousand people sign something online and the old badge appears on flags for the next decade.', effect: { boardMood: 3, coins: 250, prestige: -2, clubLegacy: { kind: 'tradition', label: 'The badge they changed' } } },
          { id: 'kill-it', label: 'Tell the board to bin it', desc: 'Spend his standing on a drawing', outcome: 'It is quietly shelved and the marketing manager leaves in the summer. The ship stays on the shirt.', effect: { boardMood: -2, prestige: 2, clubLegacy: { kind: 'tradition', label: 'The badge they kept' } } },
          { id: 'silent', label: 'Have no view at all', desc: 'He coaches, they draw', outcome: 'Asked about it eleven times in one press conference, he says eleven versions of nothing, and looks smaller each time.', effect: { prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-preseason-tour', title: 'Four Thousand Miles', icon: '✈️', category: 'boardroom',
    when: { minSeason: 3, minCoins: 200 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Commercial have sold a pre-season tour. Three matches, eleven days, two time zones, and a squad that needs six weeks of running.',
        choices: [
          { id: 'go', label: 'Take the full squad', desc: 'The money is the point and everybody goes', outcome: 'It is worth a great deal and costs him a fortnight of fitness work. Two hamstrings go in September.', effect: { coins: 550, squadMorale: -5, boardMood: 3 } },
          { id: 'split', label: 'Send half and keep half home', desc: 'Kids on the plane, seniors on the grass', outcome: 'The promoters complain about the team sheet. Four young players get eleven days they will remember all their lives.', effect: { coins: 300, playerMorale: { who: 'youngest', delta: 12 }, boardMood: -1 } },
          { id: 'refuse-tour', label: 'Refuse to go', desc: 'Pre-season is not a sales trip', outcome: 'The contract is broken and the club pays a penalty. The team is fitter in August than it has been in years.', effect: { coins: -300, squadMorale: 8, boardMood: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-shareholder-revolt', title: 'A Letter With Signatures', icon: '📜', category: 'boardroom',
    when: { minSeason: 4, minPos: 0.6 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nine minority shareholders have written a letter. It is polite for four paragraphs and then it is not. His name appears twice.',
        choices: [
          { id: 'meet', label: 'Meet them in a back room', desc: 'Nine men, one manager, no directors', outcome: 'Two hours of it. He leaves having converted about four of them and having said one thing he should not have.', effect: { prestige: 1, boardMood: -1, tag: 'mgr-met-the-shareholders' } },
          { id: 'board-first', label: 'Hand it straight to the chairman', desc: 'Not his fight, and be seen not fighting it', outcome: 'The chairman is grateful in a way that will be worth something in March. The letter is answered badly and leaks.', effect: { boardMood: 2, prestige: -1 } },
          { id: 'results', label: 'Answer it with results', desc: 'No reply, no meeting, no comment', outcome: 'He wins three of the next four and the letter dies. Had he lost three, it would have been a very different spring.', effect: { squadMorale: 4, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-wage-cap', title: 'A Ceiling On Wages', icon: '📐', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 450 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A wage structure has been imposed with a hard number at the top of it. The best player at the club is above the number and his deal expires in eighteen months.',
        choices: [
          { id: 'enforce', label: 'Enforce it evenly', desc: 'No exceptions, starting with the best paid', outcome: 'It is fair and it is coherent and it will cost the club its best player for nothing in two summers.', effect: { boardMood: 3, playerMorale: { who: 'best', delta: -14 }, squadMorale: 4, tag: 'mgr-held-the-structure' } },
          { id: 'exception', label: 'Carve out one exception', desc: 'Break it once, for the right man', outcome: 'He stays. Within six weeks four agents know the ceiling has a door in it, and every negotiation after that is harder.', effect: { boardMood: -1, playerMorale: { who: 'best', delta: 12 }, squadMorale: -6, coins: -200 } },
          { id: 'bonus', label: 'Move the money into bonuses', desc: 'Keep the ceiling, pay for winning', outcome: 'Accountancy dressed as philosophy, and it holds for a season. The finance director is not fooled but is quietly impressed.', effect: { boardMood: 1, squadMorale: 3, coins: -120 } },
        ],
      },
    },
  },
  {
    id: 'mgr-board-leak', title: 'Somebody Talked', icon: '💧', category: 'boardroom',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A team-selection argument that happened in a room with five people in it is in a Sunday paper by the weekend. Three of the five are directors.',
        choices: [
          { id: 'hunt', label: 'Find out who', desc: 'Ask each of them, one at a time', outcome: 'He works it out in a fortnight and can prove nothing. The man knows he knows, and that will do.', effect: { boardMood: -1, prestige: 1, tag: 'mgr-knows-the-leak' } },
          { id: 'stop-sharing', label: 'Stop telling them anything', desc: 'Shorter meetings from now on', outcome: 'The leaks stop. So does any chance of the board understanding a decision before they read about it.', effect: { boardMood: -2, squadMorale: 3 } },
          { id: 'feed', label: 'Feed the leak something useful', desc: 'If it runs, let it run his way', outcome: 'A story about the club’s ambition appears the following month. It is his sentence, in someone else’s mouth, and it works.', effect: { prestige: 2, boardMood: 1, tag: 'mgr-uses-the-press' } },
        ],
      },
    },
  },
  {
    id: 'mgr-five-year-plan', title: 'A Document By Friday', icon: '📊', category: 'boardroom',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board want a five-year plan. In writing. He has been at the club long enough to know that nobody here has survived five years since the eighties.',
        choices: [
          { id: 'honest-doc', label: 'Write what he actually believes', desc: 'Slow, cheap, young, and unglamorous', outcome: 'Eleven pages, no pictures, entirely truthful. Two directors call it the best thing they have read and one calls it a lack of ambition.', effect: { boardMood: 1, prestige: 2, tag: 'mgr-has-a-plan' } },
          { id: 'ambition-doc', label: 'Write what they want to read', desc: 'Promotion, a category upgrade, a cup run', outcome: 'It is warmly received and quoted back at him in every difficult meeting for the next three years.', effect: { boardMood: 3, coins: 200, tag: 'mgr-promised-the-earth' } },
          { id: 'refuse-doc', label: 'Tell them he does not do documents', desc: 'Judge him on Saturdays', outcome: 'It sounds strong in the room and reads as arrogance in the minutes. Someone else writes a plan with his name on it.', effect: { boardMood: -3, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-the-agm', title: 'Any Other Business', icon: '🏢', category: 'boardroom',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The annual meeting is in the function room with the bad acoustics. He is on the top table beside a jug of water and a chairman who has been up since four.',
        choices: [
          { id: 'take-questions', label: 'Take the questions himself', desc: 'Two hours, no filter', outcome: 'He answers everything, including the ones aimed at the board. It is generous and slightly foolish and the room loves him for it.', effect: { prestige: 2, boardMood: -1 } },
          { id: 'brief', label: 'Give ten minutes and leave', desc: 'A statement, thank you, goodnight', outcome: 'Efficient and cold. The report in the paper is about what he did not say, which is the only interesting thing there was.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'ask-for', label: 'Use it to ask for something', desc: 'Say the budget number in front of the members', outcome: 'The chairman’s face does not move. The number is in the minutes now, and the minutes are public.', effect: { coins: 300, boardMood: -3, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-benefactor-strings', title: 'A Man With A Cheque', icon: '💼', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 300 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A local businessman will fund two signings. He would like a seat on the board, a parking space, and his nephew given a look in the under-21s.',
        choices: [
          { id: 'take-all', label: 'Take the lot', desc: 'Money now, awkwardness later', outcome: 'Two players arrive and so does the nephew, who is honestly not far off. The parking space becomes a running joke.', effect: { coins: 600, boardMood: 2, squadMorale: -3, tag: 'mgr-took-the-cheque' } },
          { id: 'trim', label: 'Take the money, refuse the nephew', desc: 'One line, held', outcome: 'He gives about half of what he offered and never quite forgives it. Half is still more than the club had.', effect: { coins: 300, prestige: 1, boardMood: -1 } },
          { id: 'refuse-all', label: 'Send him away', desc: 'The club is not for renting', outcome: 'The window passes with nothing done. In three years the man funds a rival and it is mentioned every single time they meet.', effect: { boardMood: -3, prestige: 2, clubLegacy: { kind: 'rivalry', label: 'The benefactor who went elsewhere' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-chairmans-son', title: 'On The Staff', icon: '👔', category: 'boardroom',
    when: { minSeason: 2 }, weight: 3, temper: ['disciplinarian', 'builder', 'tactician'], first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The chairman’s son has been added to the coaching staff as an analyst. He is twenty-four, keen, and has not been told he is nobody’s idea but his father’s.',
        choices: [
          { id: 'use-him', label: 'Give him real work', desc: 'Set-pieces, opposition clips, deadlines', outcome: 'He is up at five, he is thorough, and by March the set-piece numbers are the best in the division. Nobody expected that.', effect: { squadMorale: 4, boardMood: 2, prestige: 1 } },
          { id: 'sideline', label: 'Keep him well away from the group', desc: 'Nothing that matters, nothing that leaks', outcome: 'He spends a year making coffee and filing clips nobody watches. Everything said in the staff room reaches the boardroom anyway.', effect: { boardMood: -1, squadMorale: -2 } },
          { id: 'refuse-him', label: 'Tell the chairman no', desc: 'The staff is his, or it is not his', outcome: 'The lad goes to another club and does well. Every good thing he ever does is mentioned in the boardroom for a decade.', effect: { boardMood: -3, prestige: 1, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-cash-friendly', title: 'A Midweek For Money', icon: '💷', category: 'boardroom',
    when: { minSeason: 2, maxCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board have agreed a midweek friendly against a club nobody here likes, for a fee that covers a month of wages. It falls between two league games.',
        choices: [
          { id: 'full-side', label: 'Play a strong side', desc: 'Give them a game and take the money', outcome: 'They win it and it turns nasty in the second half. Twenty-two thousand come and one centre-half misses six weeks.', effect: { coins: 400, squadMorale: 5, playerMorale: { who: 'oldest', delta: -8 }, clubLegacy: { kind: 'rivalry', label: 'The midweek that got out of hand' } } },
          { id: 'kids', label: 'Play the under-21s', desc: 'Take the fee, protect the eleven', outcome: 'Beaten heavily in front of a full house. The fee still clears and it is talked about for a long time.', effect: { coins: 400, squadMorale: -4, playerMorale: { who: 'youngest', delta: 6 } } },
          { id: 'cancel', label: 'Get it cancelled', desc: 'Ask for it to be moved to July', outcome: 'It is moved and the fee halves. He has the fixture list he wanted and the finance director has a hole.', effect: { coins: 180, boardMood: -2, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-overdraft-covenant', title: 'The Bank Would Like A Word', icon: '🏦', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club has breached a covenant. There is a meeting on Thursday at which men in suits will decide whether wages go out on the twenty-eighth.',
        choices: [
          { id: 'attend', label: 'Go to the bank himself', desc: 'Sit in the room and answer for the football', outcome: 'He explains what the money is actually for, in plain words, for forty minutes. The extension is granted for six months.', effect: { coins: 250, boardMood: 2, prestige: 1 } },
          { id: 'sell-fast', label: 'Put someone up for sale immediately', desc: 'Cash before Thursday', outcome: 'A deal is done in four days at a price nobody would take in June. It solves the week and costs the season.', effect: { coins: 500, squadMorale: -10, playerMorale: { who: 'best', delta: -8 }, tag: 'mgr-fire-sale' } },
          { id: 'stay-out', label: 'Stay out of it entirely', desc: 'He coaches, they bank', outcome: 'It resolves without him and he learns the terms in April. Two of the terms are about his budget.', effect: { coins: -150, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-data-department', title: 'Three Analysts And A Server', icon: '💻', category: 'boardroom',
    when: { minSeason: 3, minCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board have money for a recruitment department or for one more player. They want him to choose, which is generous and also a trap.',
        choices: [
          { id: 'build-dept', label: 'Build the department', desc: 'Three people, a database, no signings', outcome: 'The season is one player short and nobody notices until March. In two years the recruitment is unrecognisable.', effect: { coins: -300, squadMorale: -5, boardMood: 1, tag: 'mgr-built-recruitment' } },
          { id: 'player', label: 'Take the player', desc: 'Points now, always points now', outcome: 'He is decent and available and plays thirty-eight games. The database remains a spreadsheet on the chief scout’s laptop.', effect: { coins: -300, squadMorale: 6 } },
          { id: 'both-badly', label: 'Try for both', desc: 'A cheaper player, a smaller department', outcome: 'One analyst and a squad player. Neither is enough to change anything, which is a way of losing twice.', effect: { coins: -300, boardMood: -1, squadMorale: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-youth-budget-cut', title: 'The Academy Line', icon: '🌱', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 350 }, weight: 3, temper: ['builder', 'players-manager'], first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The academy budget is the easiest line on the sheet to cut, because it costs nothing this year and everything in six.',
        choices: [
          { id: 'defend', label: 'Defend it to the last penny', desc: 'Cut the first team instead', outcome: 'He takes it out of his own squad budget and does not mention it to the players. The under-16s keep their coach.', effect: { coins: -200, playerMorale: { who: 'youngest', delta: 10 }, boardMood: -2, tag: 'mgr-protected-the-academy' } },
          { id: 'accept-cut', label: 'Let it go for a year', desc: 'One year only, on the record', outcome: 'One year becomes three, the way one year always does. Two good age groups are lost before anybody counts them.', effect: { coins: 250, boardMood: 2, playerMorale: { who: 'youngest', delta: -10 } } },
          { id: 'restructure', label: 'Cut it and change what it is for', desc: 'Fewer teams, better coaches, local only', outcome: 'Half the intake goes and the half that stays gets twice the attention. It is either brave or a dressed-up retreat.', effect: { coins: 120, boardMood: 1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-director-resigns', title: 'He Walked Out On Tuesday', icon: '🚪', category: 'boardroom',
    when: { minSeason: 3, minPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A director has resigned and given an interview about it. The word he uses about the football side is drift, and he says it four times.',
        choices: [
          { id: 'answer', label: 'Answer him publicly', desc: 'Line by line, on the Friday', outcome: 'He is better at it than the director and wins the exchange comfortably. It keeps the story alive another nine days.', effect: { prestige: 2, boardMood: -1, squadMorale: -3 } },
          { id: 'silence', label: 'Refuse to discuss a former director', desc: 'One sentence, then football', outcome: 'It dies inside a week. Two players ask him about it in private and he tells them the truth, which is that it stung.', effect: { boardMood: 2, squadMorale: 4 } },
          { id: 'internal', label: 'Address it with the squad first', desc: 'Before they read it on their phones', outcome: 'Ten minutes in the canteen. He says the word drift himself and asks them whether it is fair, and lets the silence sit.', effect: { squadMorale: 7, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-january-statement', title: 'Something For The Supporters', icon: '📣', category: 'boardroom',
    when: { minSeason: 2, minPos: 0.55, minCoins: 200 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Gates are down and the mood is flat. The board want a signing in January that will be noticed, whether or not it makes the team better.',
        choices: [
          { id: 'statement-signing', label: 'Sign somebody people have heard of', desc: 'A name, a queue in the club shop, a lift', outcome: 'Eleven hundred extra through the gate for the next home game. He plays six times and is a substitute by March.', effect: { coins: -450, boardMood: 3, squadMorale: 5, prestige: -1 } },
          { id: 'useful', label: 'Sign the boring one he actually needs', desc: 'A left-footed centre-half nobody will cheer', outcome: 'Nobody queues for a shirt with his name on it. The goals-against column halves and no one connects the two.', effect: { coins: -300, squadMorale: 4, boardMood: -1 } },
          { id: 'nothing', label: 'Sign nobody', desc: 'Bank it for the summer', outcome: 'A long, quiet, angry January. The summer budget is intact and every point dropped is now his fault twice.', effect: { boardMood: -2, coins: 200, squadMorale: -5 } },
        ],
      },
    },
  },
  {
    id: 'mgr-stadium-naming', title: 'A Sponsor On The Roof', icon: '🔤', category: 'boardroom',
    when: { minSeason: 4, maxCoins: 400 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A naming-rights deal is on the table. The ground has been called the same thing since 1904 and would be called something else by August.',
        choices: [
          { id: 'take-deal', label: 'Back the deal', desc: 'It is four years of a decent centre-forward', outcome: 'The signs change. Nobody in the town ever uses the new name, not once, not in twenty years, but the money is real.', effect: { coins: 700, boardMood: 3, prestige: -1, clubLegacy: { kind: 'reputation', label: 'The ground with two names' } } },
          { id: 'oppose', label: 'Oppose it openly', desc: 'Stand up in the meeting and say so', outcome: 'It falls through. The club is poorer by a great deal and the old name survives him, which was rather the point.', effect: { boardMood: -3, prestige: 2, clubLegacy: { kind: 'tradition', label: 'The name they would not sell' } } },
          { id: 'split-name', label: 'Push for the old name kept alongside', desc: 'Both names, one sign', outcome: 'A clumsy compromise on every letterhead. The sponsor pays less and the supporters mock it warmly rather than coldly.', effect: { coins: 400, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-cut-the-staff', title: 'Two From The Bench', icon: '🧤', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 300 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has been asked to lose two coaches. One of them was here before him and knows every player at the club by their mother’s first name.',
        choices: [
          { id: 'keep-old', label: 'Keep the one who was here first', desc: 'Institutional memory over his own man', outcome: 'His own assistant goes instead and does not speak to him again. The club runs smoother than it has any right to.', effect: { squadMorale: 5, boardMood: 1, prestige: -1 } },
          { id: 'keep-own', label: 'Keep his own people', desc: 'Loyalty to the men who came with him', outcome: 'The old coach clears his desk in an afternoon. Three senior players find reasons to be somewhere else that day.', effect: { squadMorale: -8, boardMood: 1, tag: 'mgr-cleared-the-old-guard' } },
          { id: 'take-cut', label: 'Offer his own money instead', desc: 'Halve his salary, keep the staff', outcome: 'The board accept it faster than he expected. He never tells anyone, and one of the coaches works it out anyway.', effect: { coins: 100, squadMorale: 8, boardMood: 2, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-points-deduction', title: 'A Charge Sheet', icon: '⚖️', category: 'boardroom',
    when: { minSeason: 4, maxCoins: 300 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The league has charged the club over filings that predate him by two years. A deduction is being discussed in a room he will never see.',
        choices: [
          { id: 'shield', label: 'Keep it entirely away from the squad', desc: 'They play the season in front of them', outcome: 'He carries it alone for eleven weeks. When it lands, they are eight points better off than they would have been.', effect: { squadMorale: 6, prestige: 1, boardMood: 1 }, next: 'verdict' },
          { id: 'tell-them', label: 'Tell the players everything', desc: 'The arithmetic, the risk, all of it', outcome: 'Nobody sulks. They win at a place they have not won at in years and somebody says the word siege in the tunnel.', effect: { squadMorale: 9, boardMood: -1, tag: 'mgr-siege-mentality' }, next: 'verdict' },
        ],
      },
      verdict: {
        id: 'verdict',
        prompt: 'The verdict comes down on a Wednesday afternoon. Points, suspended in part, and a fine the club cannot comfortably pay.',
        choices: [
          { id: 'appeal', label: 'Push the board to appeal', desc: 'Lawyers, delay, hope', outcome: 'Two of the points come back in May and the legal bill eats a signing. On balance it was worth it, just about.', effect: { coins: -250, boardMood: -1, prestige: 1 } },
          { id: 'accept-it', label: 'Accept it and move on', desc: 'Play the table as it stands', outcome: 'He never mentions the deduction again. The players mention it constantly, which turns out to be useful.', effect: { squadMorale: 5, boardMood: 2, clubLegacy: { kind: 'reputation', label: 'The season with points taken off' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-testimonial-ask', title: 'One Last Night', icon: '🕯️', category: 'boardroom',
    when: { minSeason: 4, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A player with a decade of service wants a testimonial. The board are unenthusiastic; the fixture list is unforgiving; he is thirty-four and has three months left in his legs.',
        choices: [
          { id: 'push', label: 'Push it through', desc: 'A summer date, a full house, a proper night', outcome: 'Nine thousand come to a meaningless match in July. He cries at the halfway line and so does half the main stand.', effect: { boardMood: -1, playerMorale: { who: 'oldest', delta: 16 }, squadMorale: 6, clubLegacy: { kind: 'tradition', label: 'The testimonial night' } } },
          { id: 'decline', label: 'Tell him it cannot happen', desc: 'Say it himself rather than let the board', outcome: 'He takes it well, which makes it worse. He plays out the season professionally and leaves without a word said against anyone.', effect: { playerMorale: { who: 'oldest', delta: -14 }, squadMorale: -6, boardMood: 2 } },
          { id: 'shirt', label: 'Give him something else instead', desc: 'Retire the shirt he has worn for ten years', outcome: 'It costs nothing and means more. The number goes out of circulation and stays out long after everyone in the room is gone.', effect: { playerMorale: { who: 'oldest', delta: 12 }, prestige: 1, clubLegacy: { kind: 'number', label: 'A number taken out of circulation' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-agents-client-pushed', title: 'A Friend Of The Board', icon: '🕵️', category: 'boardroom',
    when: { minSeason: 3, minCoins: 200 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A director has an agent friend, and the agent friend has a midfielder. The midfielder is fine. The fee is not fine and the commission is worse.',
        choices: [
          { id: 'do-deal', label: 'Do the deal', desc: 'Keep the peace and pay over the odds', outcome: 'He plays thirty games and is perfectly adequate. The commission line appears in the audit and is asked about twice.', effect: { coins: -500, boardMood: 2, squadMorale: 2, tag: 'mgr-paid-the-commission' } },
          { id: 'block-deal', label: 'Block it', desc: 'Say the word commission out loud in the meeting', outcome: 'The room goes cold and the deal dies. The director stops attending training and starts attending other conversations.', effect: { boardMood: -3, prestige: 2 } },
          { id: 'renegotiate', label: 'Take the player, halve the commission', desc: 'Make the agent choose', outcome: 'The agent takes it because he needs the deal. He never brings this club a player again, which may or may not be a loss.', effect: { coins: -350, boardMood: -1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-chairman-ill', title: 'He Was Not At The Game', icon: '🩺', category: 'boardroom',
    when: { minSeason: 4 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The chairman has missed three matches. He has not missed three matches since 1991. Nobody upstairs will explain and everybody upstairs knows.',
        choices: [
          { id: 'visit', label: 'Go and see him', desc: 'No agenda, no notebook', outcome: 'An hour of talking about a centre-forward from thirty years ago. Neither of them mentions the present once.', effect: { boardMood: 2, prestige: 1, tag: 'mgr-sat-with-the-chairman' } },
          { id: 'hold', label: 'Hold the football side steady', desc: 'Give him one less thing', outcome: 'He runs the club’s week himself, quietly, past his remit. When the chairman returns, the desk is exactly as he left it.', effect: { boardMood: 3, squadMorale: -2 } },
          { id: 'succession', label: 'Ask who is in charge now', desc: 'Practical, cold, necessary', outcome: 'The question is answered honestly and remembered badly. It was the right question and it was asked eight weeks too early.', effect: { boardMood: -2, coins: 150 } },
        ],
      },
    },
  },
  {
    id: 'mgr-fan-trust-bid', title: 'The Supporters Want In', icon: '🧣', category: 'boardroom',
    when: { minSeason: 4 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A supporters’ trust has raised enough for a small stake and a seat at the table. The board would prefer he said something discouraging about it.',
        choices: [
          { id: 'support', label: 'Say he would welcome it', desc: 'Out loud, on the record', outcome: 'The stake goes through. There is now a season-ticket holder in every boardroom meeting, which changes the room permanently.', effect: { boardMood: -2, prestige: 2, clubLegacy: { kind: 'tradition', label: 'A supporter on the board' } } },
          { id: 'discourage', label: 'Give the board their sentence', desc: 'Say it is a distraction and move on', outcome: 'It stalls. The trust remembers, and the next time the club needs the terraces they are slower to come.', effect: { boardMood: 2, prestige: -2 } },
          { id: 'silent-trust', label: 'Say it is not a football matter', desc: 'True, and cowardly, and safe', outcome: 'Nobody is angry with him. Nobody is anything with him. It is the most forgettable answer he gives all year.', effect: { boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-groundshare', title: 'Somebody Else’s Pitch', icon: '🏟️', category: 'boardroom',
    when: { minSeason: 4, maxCoins: 250 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A groundshare has been proposed for two seasons while the roof is replaced. The ground in question belongs to a club this one has hated since before the war.',
        choices: [
          { id: 'accept-share', label: 'Accept it', desc: 'Two seasons of away games at home', outcome: 'They play in front of half-empty stands at a ground that smells wrong. The roof gets done and something in the club does not recover for years.', effect: { coins: 400, squadMorale: -8, boardMood: 2, clubLegacy: { kind: 'rivalry', label: 'The two years spent at their ground' } } },
          { id: 'fight-share', label: 'Fight for a smaller local ground', desc: 'Worse facilities, right postcode', outcome: 'Four thousand capacity, one stand, and a pitch that cuts up in November. Every home game feels like a cup tie.', effect: { coins: -200, squadMorale: 6, boardMood: -2, prestige: 1 } },
          { id: 'phase', label: 'Push to phase the work instead', desc: 'Stay put, one stand at a time, four years', outcome: 'It costs more and takes twice as long. Nobody ever plays a home game anywhere else, which is what he was actually protecting.', effect: { coins: -350, boardMood: -1, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-promotion-bonus', title: 'The Bonus Schedule', icon: '🧮', category: 'boardroom',
    when: { minSeason: 2, maxPos: 0.35 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The squad’s bonus schedule was written when the club expected to be mid-table. They are not mid-table, and the players have worked out what the clause is worth.',
        choices: [
          { id: 'honour', label: 'Tell the board to pay it in full', desc: 'A deal is a deal, in April as in July', outcome: 'The finance director looks physically unwell. The dressing room learns something about him that money cannot buy back.', effect: { coins: -500, squadMorale: 12, boardMood: -2, tag: 'mgr-paid-in-full' } },
          { id: 'renegotiate-bonus', label: 'Ask the senior players to restructure', desc: 'Less now, more if it is done', outcome: 'They agree, because he asks properly. Two of them are quietly worse off and never say a word about it.', effect: { coins: 200, squadMorale: -4, boardMood: 2 } },
          { id: 'stay-out-bonus', label: 'Leave it to the board and the agents', desc: 'Not his money, not his fight', outcome: 'It is settled badly in a meeting he is not in. Three players spend the run-in with a grievance instead of a hamstring.', effect: { squadMorale: -8, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-relegation-clause', title: 'The Clause In His Own Deal', icon: '📎', category: 'boardroom',
    when: { minSeason: 3, minPos: 0.75 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His own contract halves if the club goes down. It is a normal clause and it has never once felt normal, and there are nine games left.',
        choices: [
          { id: 'ignore-it', label: 'Never mention it to anyone', desc: 'It is not the players’ problem', outcome: 'He does not bring it up, not once, not even to his own staff. It sits behind everything he says for two months.', effect: { squadMorale: 4, prestige: 1 } },
          { id: 'waive', label: 'Waive it in front of the board', desc: 'Take the cut either way', outcome: 'It buys enormous credit upstairs and costs him real money. It also removes the last argument for keeping him if it goes wrong.', effect: { boardMood: 3, coins: 200, prestige: 1, tag: 'mgr-waived-his-clause' } },
          { id: 'renegotiate-clause', label: 'Get it removed now', desc: 'While there is still leverage', outcome: 'They remove it and something changes in how they look at him. He is now expensive to sack and easy to resent.', effect: { boardMood: -3, coins: -150 } },
        ],
      },
    },
  },
  {
    id: 'mgr-award-dinner', title: 'A Table At The Front', icon: '🥂', category: 'boardroom',
    when: { minSeason: 3, maxPos: 0.3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a dinner. He has been nominated for something and the directors have bought a table at the front and told the local paper about it.',
        choices: [
          { id: 'attend', label: 'Go, and take the coaching staff', desc: 'Ten seats, his people in all of them', outcome: 'He does not win. His assistant gets very drunk and says something true and beautiful about him at one in the morning.', effect: { squadMorale: 3, prestige: 1, boardMood: 1 } },
          { id: 'skip', label: 'Stay at the training ground', desc: 'There is a game on Saturday', outcome: 'The empty chair is photographed. It reads as focus to some people and as rudeness to the people who paid for the table.', effect: { boardMood: -2, prestige: 1, squadMorale: 3 } },
          { id: 'send-someone', label: 'Send the youth coach in his place', desc: 'Give the night to somebody who never gets one', outcome: 'He goes in a borrowed suit and has the evening of his life. It is mentioned at the club for years afterwards.', effect: { prestige: 1, playerMorale: { who: 'youngest', delta: 6 }, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-women-side', title: 'The Other Side Of The Club', icon: '⚽', category: 'boardroom',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The women’s side train on the worst pitch at the complex at the worst time of day. The board have asked, casually, whether he thinks that matters.',
        choices: [
          { id: 'share', label: 'Give them the main pitches two days a week', desc: 'And move his own sessions', outcome: 'His staff grumble for a month and then stop. The standard of the football on that pitch on a Tuesday goes up sharply.', effect: { boardMood: -1, prestige: 2, clubLegacy: { kind: 'tradition', label: 'One club, one training ground' } } },
          { id: 'not-my-remit', label: 'Say it is not his department', desc: 'True, and easy', outcome: 'The pitch stays as it is. Two years later somebody else fixes it and is rightly praised for it.', effect: { boardMood: 1 } },
          { id: 'money', label: 'Ask the board to fund it properly instead', desc: 'Not his pitches, their budget', outcome: 'He argues for a line on a spreadsheet that costs him nothing and gains him nothing. Half of it is granted.', effect: { boardMood: -1, coins: -100, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-board-wants-style', title: 'A Way Of Playing', icon: '🎨', category: 'boardroom',
    when: { minSeason: 3 }, weight: 3, temper: ['tactician', 'chancer', 'firefighter'], first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board have decided the club should have an identity. They mean they would like it to be nicer to watch. They have brought a document with the word philosophy in the title.',
        choices: [
          { id: 'agree-style', label: 'Adopt it publicly', desc: 'Play the football they are asking for', outcome: 'It is better to watch and worse to win with, for about fourteen games. Then it is neither, and then it is both.', effect: { boardMood: 2, squadMorale: -4, prestige: 1, tag: 'mgr-signed-the-philosophy' } },
          { id: 'results-first', label: 'Tell them results are the identity', desc: 'Nothing pretty about the bottom four', outcome: 'They accept it without agreeing. The document is not mentioned again until the next bad run, when it is mentioned constantly.', effect: { boardMood: -2, squadMorale: 4 } },
          { id: 'rewrite', label: 'Rewrite the document himself', desc: 'Same words, his football underneath', outcome: 'Four pages that say what he already does in language they already like. It is cynical and it works completely.', effect: { boardMood: 2, prestige: 1, coins: 100 } },
        ],
      },
    },
  },

  // ── TRANSFER ─────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-unexpected-bid', title: 'A Fax On A Tuesday', icon: '📠', category: 'transfer',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A bid has come in for the best player at the club. It is more money than the club has seen in a decade and it arrived without a phone call first.',
        choices: [
          { id: 'reject', label: 'Reject it flatly', desc: 'No negotiation, no second bid invited', outcome: 'The rejection is public by six. He plays that Saturday and is applauded off, and his agent is on the phone by Monday.', effect: { boardMood: -2, squadMorale: 8, playerMorale: { who: 'best', delta: -6 }, tag: 'mgr-rejected-a-bid' } },
          { id: 'accept-bid', label: 'Take the money', desc: 'Reinvest three ways', outcome: 'Three players in for the price of one out. Two of them are useful and none of them is him.', effect: { coins: 900, squadMorale: -10, boardMood: 3, tag: 'mgr-cashed-in' } },
          { id: 'ask-him', label: 'Put it to the player', desc: 'His career, his call', outcome: 'He asks for a day and comes back having decided to stay, which nobody in the building expected.', effect: { playerMorale: { who: 'best', delta: 12 }, squadMorale: 6, boardMood: -1, coins: -50 } },
        ],
      },
    },
  },
  {
    id: 'mgr-agent-auction', title: 'Somebody Else Is Bidding', icon: '🎯', category: 'transfer',
    when: { minSeason: 2, minCoins: 250 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The agent keeps mentioning another club. He never names it. He mentions it four times in nine minutes, which is how you know it may not exist.',
        choices: [
          { id: 'call-bluff', label: 'Call it', desc: 'One offer, a deadline of Friday', outcome: 'Friday comes and goes. The player signs on the Monday for the original number, sulking slightly.', effect: { coins: -350, squadMorale: 4, prestige: 1, tag: 'mgr-called-a-bluff' } },
          { id: 'pay-up', label: 'Improve the offer', desc: 'End it now before it becomes a story', outcome: 'Done in an afternoon and the agent is delighted, which is never a good sign about the price paid.', effect: { coins: -520, squadMorale: 5 } },
          { id: 'walk', label: 'Walk away', desc: 'Spend it on someone with a quieter agent', outcome: 'The player signs for a club in another division four days later, for less than the original offer.', effect: { boardMood: 1, squadMorale: -3, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-agreed-terms-elsewhere', title: 'He Has Already Said Yes', icon: '✍️', category: 'transfer',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A player under contract has agreed personal terms with somebody else. He has not told the club. He has told two team-mates, which is the same as telling the club.',
        choices: [
          { id: 'confront', label: 'Have it out with him', desc: 'Behind a closed door, today', outcome: 'He does not deny it. He does not apologise either, and the honesty is somehow harder to be angry at.', effect: { playerMorale: { who: 'star', delta: -8 }, squadMorale: -3 }, next: 'window' },
          { id: 'freeze-out', label: 'Leave him out until it is resolved', desc: 'Train with the under-21s from Monday', outcome: 'The team is worse without him and everybody can see the point being made. Two senior players think it is the right call and one does not.', effect: { squadMorale: -5, boardMood: -1, tag: 'mgr-froze-a-player' }, next: 'window' },
          { id: 'use-him', label: 'Keep picking him', desc: 'He is still the best option on Saturday', outcome: 'He plays superbly, which is the worst possible outcome for everyone’s peace of mind.', effect: { squadMorale: 3, playerMorale: { who: 'star', delta: 5 } }, next: 'window' },
        ],
      },
      window: {
        id: 'window',
        prompt: 'The window shuts in six days. The other club’s bid is short and their patience is shorter.',
        choices: [
          { id: 'sell-cheap', label: 'Let him go for what is offered', desc: 'Take the money, take the loss', outcome: 'Under value, and done. The dressing room understands and the boardroom writes down the number and remembers it.', effect: { coins: 450, boardMood: -1, squadMorale: 3 } },
          { id: 'hold-him', label: 'Hold him to the contract', desc: 'A year of a man who wants to be elsewhere', outcome: 'He stays and gives about eighty per cent of what he has for a season, then leaves for nothing.', effect: { squadMorale: -6, boardMood: -2, tag: 'mgr-held-a-hostage' } },
        ],
      },
    },
  },
  {
    id: 'mgr-failed-medical', title: 'Something On The Scan', icon: '🩻', category: 'transfer',
    when: { minSeason: 2, minCoins: 200 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The signing is at the training ground with his family. The doctor has come out of the room with a face on and a folder, and the announcement is scheduled for two o’clock.',
        choices: [
          { id: 'pull-out', label: 'Pull the deal', desc: 'Send him home and start again', outcome: 'He is told in an office by a man he met an hour ago. He plays four more years elsewhere without a problem.', effect: { coins: 200, squadMorale: -3, boardMood: 1 } },
          { id: 'restructure-deal', label: 'Restructure it around the risk', desc: 'Shorter deal, appearance money, lower fee', outcome: 'The agent hates it and the player signs it anyway. He is worth every penny for two years and then the knee does what knees do.', effect: { coins: -280, squadMorale: 5, tag: 'mgr-gambled-on-a-knee' } },
          { id: 'proceed', label: 'Sign him as agreed', desc: 'Trust the player over the picture', outcome: 'The doctor puts his objection in writing, which is what doctors do when they are certain and overruled.', effect: { coins: -450, squadMorale: 6, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-swap-deal', title: 'One For One', icon: '🔁', category: 'transfer',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A swap has been floated. Their striker, our midfielder, no money either way. Both clubs think they are getting the better of it, which is either a good sign or the whole problem.',
        choices: [
          { id: 'do-swap', label: 'Do it', desc: 'A need for a surplus', outcome: 'The striker scores on his debut. The midfielder is captain there within a year and it is mentioned every single time they play.', effect: { squadMorale: 4, playerMorale: { who: 'star', delta: -5 }, clubLegacy: { kind: 'rivalry', label: 'The swap that got away' } } },
          { id: 'cash-instead', label: 'Ask for cash on top', desc: 'Value the difference properly', outcome: 'They add a modest amount and the deal is done a fortnight later, by which time both players have gone slightly off the boil.', effect: { coins: 220, squadMorale: 2 } },
          { id: 'no-swap', label: 'Refuse to trade with them', desc: 'Not with that club, not ever', outcome: 'Principle costs a striker the team badly needed. The supporters, to be fair, are entirely behind him on it.', effect: { squadMorale: -4, prestige: 1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-trialist-asks', title: 'A Lad At The Gate', icon: '🚧', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A released twenty-year-old has driven ninety miles and is standing at the training ground gate asking for two weeks. He has his boots in a carrier bag.',
        choices: [
          { id: 'give-two-weeks', label: 'Give him the fortnight', desc: 'Nothing promised beyond the fortnight', outcome: 'He is nowhere near it on day one and something in him by day nine. He gets a one-year deal and plays eighty games.', effect: { squadMorale: 4, playerMorale: { who: 'youngest', delta: 6 }, coins: -60, tag: 'mgr-took-a-chance-on-a-kid' } },
          { id: 'one-session', label: 'One session, then decide', desc: 'Be fair and be quick about it', outcome: 'One session is not enough to see anything and everybody knows it. He is thanked and sent home before lunch.', effect: { prestige: -1 } },
          { id: 'send-away', label: 'Send him away', desc: 'The squad is closed and the staff are stretched', outcome: 'He is polite about it, which is worse. Somebody at the gate takes his number and nobody ever rings it.', effect: { boardMood: 1, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-loan-recall', title: 'They Want Him Back', icon: '↩️', category: 'transfer',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The loanee has been the best player at the club since October. His parent club have had two injuries and a recall clause, and they have just used the word January.',
        choices: [
          { id: 'beg', label: 'Ring their manager personally', desc: 'Ask for six weeks, manager to manager', outcome: 'He gets four weeks and a favour owed the other way. Four weeks is two home games and both of them matter.', effect: { squadMorale: 4, prestige: 1, tag: 'mgr-owes-a-favour' } },
          { id: 'pay', label: 'Offer to buy him outright', desc: 'Spend the whole January budget on one man', outcome: 'They say no and then say a number. The number is absurd and the club pays about two thirds of it.', effect: { coins: -650, squadMorale: 8, boardMood: -2 } },
          { id: 'let-go', label: 'Let him go and say the right things', desc: 'Thank him publicly, move on', outcome: 'He goes back, plays twice, and is loaned somewhere else in the summer. The team win one of the next six.', effect: { squadMorale: -8, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-bargain-nobody-spotted', title: 'Page Four Of The List', icon: '🔎', category: 'transfer',
    when: { minSeason: 2, maxCoins: 500 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A scout has been going on about a twenty-three-year-old in a struggling side for two months. Everyone else in the room thinks he is a squad player. The scout does not.',
        choices: [
          { id: 'trust-scout', label: 'Trust the scout', desc: 'Sign him on his word alone', outcome: 'He is a squad player for eleven weeks and then he is not. The scout never once says anything about it, which says plenty.', effect: { coins: -180, squadMorale: 5, prestige: 1, tag: 'mgr-backed-a-scout' } },
          { id: 'watch-more', label: 'Go and watch him himself', desc: 'Three games, no more delay after that', outcome: 'Two poor games and one where he is the only one on the pitch playing football. He signs, in March, for more.', effect: { coins: -300, squadMorale: 4 } },
          { id: 'pass', label: 'Pass', desc: 'Trust the room, not the outlier', outcome: 'He goes for a modest fee elsewhere and is worth eight times that inside two years. The scout leaves in the summer.', effect: { boardMood: 1, prestige: -2, tag: 'mgr-let-one-go' } },
        ],
      },
    },
  },
  {
    id: 'mgr-cannot-settle', title: 'He Has Not Unpacked', icon: '🧳', category: 'transfer',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The summer signing has been here four months and is still in a hotel. His family have not come. He trains hard and plays like a man doing arithmetic.',
        choices: [
          { id: 'family', label: 'Fix the living situation himself', desc: 'A house, a school place, a week off to move them', outcome: 'It takes him three phone calls and a favour. By February the player is the best in the side and never forgets it.', effect: { coins: -120, playerMorale: { who: 'unhappiest', delta: 16 }, squadMorale: 4 } },
          { id: 'buddy', label: 'Put a senior player in charge of him', desc: 'Not the manager’s job, somebody’s job', outcome: 'They are inseparable within a month. Two other lads who were also quietly struggling attach themselves to the same pair.', effect: { squadMorale: 7, playerMorale: { who: 'unhappiest', delta: 8 } } },
          { id: 'cut-loss', label: 'Get him off the wage bill', desc: 'A loan home in January', outcome: 'He goes back to where he came from and scores fourteen. The fee written off is on the accounts for three years.', effect: { coins: -200, boardMood: -2, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-bidding-war', title: 'Three Clubs, One Player', icon: '⚔️', category: 'transfer',
    when: { minSeason: 3, minCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two other clubs are in for the target. One can pay more and one can offer European football, and this club can offer neither.',
        choices: [
          { id: 'sell-the-club', label: 'Sell him the project', desc: 'Two hours, a whiteboard, and the truth', outcome: 'He signs for less than he could have earned elsewhere. Nobody believes it until the photograph goes up.', effect: { coins: -450, squadMorale: 8, prestige: 2, tag: 'mgr-sold-the-project' } },
          { id: 'overpay', label: 'Break the wage structure for him', desc: 'Win it with money the club has not got', outcome: 'He signs. Four members of the existing squad find out what he is on inside a fortnight, because they always do.', effect: { coins: -650, squadMorale: -8, boardMood: -2 } },
          { id: 'move-on', label: 'Move to the second name on the list', desc: 'Quietly, before the story breaks', outcome: 'The second name signs in two days for half the money and is honestly not far behind. Nobody writes a word about it.', effect: { coins: -280, squadMorale: 3, boardMood: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-bad-reputation-striker', title: 'Twenty Goals, One Problem', icon: '🚩', category: 'transfer',
    when: { minSeason: 2, requiresTag: 'mgr-strict' }, weight: 4, temper: ['disciplinarian', 'players-manager', 'firefighter'], first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The striker is available cheaply and scores wherever he goes. He has also been moved on by three clubs in four years, and none of them will say why on the phone.',
        choices: [
          { id: 'sign-him', label: 'Sign him and set the terms', desc: 'One rule, written down, no second chance', outcome: 'Eighteen goals and one incident in March that is dealt with in a morning. It was worth it, narrowly.', effect: { coins: -300, squadMorale: -4, boardMood: 1, tag: 'mgr-took-the-risk' }, next: 'later' },
          { id: 'pass-striker', label: 'Pass on him', desc: 'The room is worth more than the goals', outcome: 'The team scores nine fewer goals than it needed to. The dressing room is the calmest it has been in years.', effect: { squadMorale: 6, boardMood: -2 } },
          { id: 'loan-first', label: 'Take him on loan first', desc: 'Three months of evidence', outcome: 'He is superb and impeccable for three months, which proves precisely nothing, and now there is a decision to make with a price attached.', effect: { coins: -120, squadMorale: 3 }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'In February he is late twice in a week and brilliant on the Saturday in between.',
        choices: [
          { id: 'fine-him', label: 'Fine him and play him', desc: 'Punished and picked', outcome: 'The fine is real and the message is muddy. Two younger players start arriving at exactly the last acceptable minute.', effect: { coins: 40, squadMorale: -4, playerMorale: { who: 'star', delta: -3 } } },
          { id: 'drop-him', label: 'Drop him for the derby', desc: 'The rule was the rule', outcome: 'They lose it one-nil and he watches from the stand. Nobody at the club is ever late again for as long as this manager stays.', effect: { squadMorale: 6, boardMood: -2, playerMorale: { who: 'star', delta: -10 }, clubLegacy: { kind: 'tradition', label: 'The standards set in a derby week' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-sell-to-rival', title: 'Their Money Spends The Same', icon: '💸', category: 'transfer',
    when: { minSeason: 3, maxCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The best offer for the club captain has come from twelve miles down the road. It is a third more than anybody else has offered and there are two derbies a season.',
        choices: [
          { id: 'take-it', label: 'Take their money', desc: 'A fee is a fee and the roof needs doing', outcome: 'He scores against them in November and does not celebrate, and it makes no difference at all to what is sung.', effect: { coins: 800, boardMood: 3, squadMorale: -12, clubLegacy: { kind: 'rivalry', label: 'The captain they sold down the road' } } },
          { id: 'refuse-rival', label: 'Refuse to deal with them', desc: 'Anywhere but there', outcome: 'He goes abroad for a third less. The supporters understand exactly what was done and why, and it is remembered warmly for decades.', effect: { coins: 520, squadMorale: 5, prestige: 2, clubLegacy: { kind: 'tradition', label: 'Never to that club' } } },
          { id: 'keep-captain', label: 'Keep him and lose him for nothing', desc: 'One more season together', outcome: 'One brilliant, doomed season, and then a free transfer in June. He would do it again and the finance director would not.', effect: { squadMorale: 10, boardMood: -3, playerMorale: { who: 'oldest', delta: 10 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-buyback-clause', title: 'A Clause In Small Print', icon: '📑', category: 'transfer',
    when: { minSeason: 3, needs: 'wonderkid' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The bid for the young one comes with a buy-back clause attached, at a figure that will look small in three years. The selling club always feels clever at this point.',
        choices: [
          { id: 'insist', label: 'Insist on the buy-back and a sell-on', desc: 'Both, or no deal', outcome: 'They agree to one and split the difference on the other. It is the best piece of negotiating anybody does at this club all decade.', effect: { coins: 500, prestige: 2, playerMorale: { who: 'youngest', delta: -6 }, tag: 'mgr-kept-a-buyback' } },
          { id: 'more-cash', label: 'Trade the clause for cash now', desc: 'Money this window beats options later', outcome: 'A larger cheque and no strings. He is worth six times the fee within four years and there is nothing to be done about it.', effect: { coins: 800, boardMood: 3, tag: 'mgr-sold-the-future' } },
          { id: 'refuse-sale', label: 'Refuse to sell at all', desc: 'Keep him and see what he becomes', outcome: 'He stays another eighteen months, gets better, and the next offer is bigger. The board spend those eighteen months tense.', effect: { boardMood: -2, playerMorale: { who: 'youngest', delta: 10 }, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-free-agent-october', title: 'Still Without A Club', icon: '🆓', category: 'transfer',
    when: { minSeason: 2, needs: 'thin-squad' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A thirty-three-year-old with four hundred games behind him has been training alone in a park since July. He will sign until January for almost nothing.',
        choices: [
          { id: 'sign-vet', label: 'Sign him', desc: 'Six weeks to get fit, then eleven games', outcome: 'He is a yard short and reads the game better than anyone at the club. Two young midfielders improve just by standing near him.', effect: { coins: -80, squadMorale: 6, playerMorale: { who: 'youngest', delta: 8 }, tag: 'mgr-signed-an-old-head' } },
          { id: 'coach-role', label: 'Offer him a coaching job instead', desc: 'Honest about where the legs are', outcome: 'He is insulted for a fortnight and takes it, and is running the under-18s within two years. He was always going to be good at it.', effect: { coins: -50, prestige: 1, playerMorale: { who: 'youngest', delta: 5 } } },
          { id: 'no-vet', label: 'Say no', desc: 'The minutes should go to the young ones', outcome: 'He signs for a rival in the same division and plays twenty-nine games. Some of them are against this club.', effect: { squadMorale: -4, playerMorale: { who: 'youngest', delta: 5 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-giant-wants-the-kid', title: 'A Very Big Club Rang', icon: '🏆', category: 'transfer',
    when: { minSeason: 2, needs: 'wonderkid' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One of the biggest clubs in the country want the sixteen-year-old. They are offering a compensation figure and a tour of a training ground that looks like an airport.',
        choices: [
          { id: 'let-him-choose', label: 'Drive him there himself', desc: 'Let him see it and decide with his eyes open', outcome: 'He comes back quiet and signs a scholarship here the following week. It is the single best day the academy has ever had.', effect: { playerMorale: { who: 'youngest', delta: 18 }, prestige: 2, coins: -60, tag: 'mgr-kept-the-kid' } },
          { id: 'take-comp', label: 'Take the compensation', desc: 'It funds the academy for three years', outcome: 'The money does real good for a lot of boys nobody has heard of. He plays for England and it is mentioned every single time.', effect: { coins: 550, boardMood: 3, playerMorale: { who: 'youngest', delta: -10 } } },
          { id: 'block-kid', label: 'Refuse to cooperate at all', desc: 'No visit, no meeting, no reply', outcome: 'They go around him and speak to the family anyway. He finds out from the boy’s father, at a Sunday game, in the rain.', effect: { playerMorale: { who: 'youngest', delta: -8 }, prestige: -1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-keeper-crisis', title: 'Both Goalkeepers', icon: '🧤', category: 'transfer',
    when: { minSeason: 2, needs: 'thin-squad' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One goalkeeper is out until April and the other went over on his wrist in the warm-up. The emergency loan window shuts at five o’clock.',
        choices: [
          { id: 'emergency-loan', label: 'Take whoever is available', desc: 'A name off a list, sight unseen', outcome: 'He arrives ninety minutes before kick-off, learns three names, and keeps a clean sheet. Nobody can explain it afterwards.', effect: { coins: -70, squadMorale: 5, boardMood: 1 } },
          { id: 'youth-keeper', label: 'Play the eighteen-year-old', desc: 'Throw him in and stand next to him', outcome: 'Four goals conceded and two saves that make people sit up. He is the number one within eighteen months.', effect: { playerMorale: { who: 'youngest', delta: 14 }, squadMorale: -5, tag: 'mgr-blooded-a-keeper' } },
          { id: 'outfield', label: 'Put a defender in goal', desc: 'No fee, no loan, a lot of nerve', outcome: 'It is chaos and it is somehow one-one. The photograph of him in the gloves is on the wall of a pub for twenty years.', effect: { squadMorale: 8, boardMood: -2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-embargo', title: 'No Signings Permitted', icon: '🚫', category: 'transfer',
    when: { minSeason: 3, maxCoins: 200 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club is under an embargo. Nothing in, nothing loaned, nothing until the filings are clean. The squad is eighteen men and two of them are seventeen.',
        choices: [
          { id: 'work-with-it', label: 'Coach what is in the building', desc: 'Retrain two players out of position', outcome: 'A full-back becomes a midfielder and is better at it. The season is survived by a margin nobody enjoys.', effect: { squadMorale: 5, prestige: 2, tag: 'mgr-coached-through-an-embargo' } },
          { id: 'push-board', label: 'Force the board to clear it', desc: 'Every day, until the paperwork is done', outcome: 'It is lifted eleven days before the window shuts, which is just enough time to sign the wrong player in a hurry.', effect: { coins: -250, boardMood: -2, squadMorale: 3 } },
          { id: 'freebies', label: 'Fill the gaps with free agents', desc: 'Whoever the rules still allow', outcome: 'Three men out of contract, all of them thirty-plus, all of them grateful. Two are useless and one plays every minute.', effect: { coins: -90, squadMorale: 2, playerMorale: { who: 'oldest', delta: 8 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-refuses-loan', title: 'He Will Not Go', icon: '🧍', category: 'transfer',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A twenty-year-old has been offered a loan at a level he would play every week. He does not want to go. He says he can get in this team, and he is wrong, but only just.',
        choices: [
          { id: 'force', label: 'Tell him he is going', desc: 'Best thing for him, whatever he thinks', outcome: 'He goes, sulking, and plays forty games. He comes back a footballer and never quite forgives the way it was done.', effect: { playerMorale: { who: 'youngest', delta: -8 }, prestige: 1, tag: 'mgr-forced-a-loan' } },
          { id: 'keep-him', label: 'Let him stay and fight', desc: 'Take him at his word', outcome: 'Nine substitute appearances and a year of his career gone. He is honest enough in May to say the manager had been right.', effect: { playerMorale: { who: 'youngest', delta: 6 }, squadMorale: -3 } },
          { id: 'deal', label: 'Give him six games to prove it', desc: 'A window, then the loan if not', outcome: 'He gets two starts and does enough in one of them to make it complicated. Nothing is resolved and January arrives anyway.', effect: { squadMorale: 3, playerMorale: { who: 'youngest', delta: 4 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-late-agent-fee', title: 'One More Number', icon: '💰', category: 'transfer',
    when: { minSeason: 2, minCoins: 200 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Everything is agreed. The player is in the building. At twenty to eleven the agent mentions a fee for himself that has not been mentioned before.',
        choices: [
          { id: 'pay-agent', label: 'Pay it', desc: 'Do not lose a player over the last four per cent', outcome: 'Signed with fourteen minutes to spare. The fee is in the accounts under a heading that fools nobody.', effect: { coins: -420, squadMorale: 5, boardMood: -1 } },
          { id: 'refuse-agent', label: 'Refuse and let the clock run', desc: 'Call it, at twenty to eleven', outcome: 'The agent folds with six minutes left, because he was never going to walk away either.', effect: { coins: -300, prestige: 2, squadMorale: 5, tag: 'mgr-held-the-line-late' } },
          { id: 'split-fee', label: 'Split it with the selling club', desc: 'Ring their chairman at half ten', outcome: 'Two clubs pay half of something neither should pay at all. Everybody signs and nobody is happy, which is a deal.', effect: { coins: -360, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-video-signing', title: 'Signed Off A Screen', icon: '📹', category: 'transfer',
    when: { minSeason: 2, minCoins: 250 }, weight: 3, temper: ['chancer', 'tactician'], first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The recommendation is a twenty-two-year-old two thousand miles away. There are eleven clips, a data profile, and no one at the club has seen him in a stadium.',
        choices: [
          { id: 'sign-blind', label: 'Sign him off the clips', desc: 'Trust the numbers and the eye', outcome: 'He arrives lighter than expected and takes four months to adapt. In year two he is the best player in the division.', effect: { coins: -400, squadMorale: -3, tag: 'mgr-signed-off-video' } },
          { id: 'go-see', label: 'Fly out and watch him live', desc: 'Two days, one match, his own eyes', outcome: 'He watches him do very little for an hour and everything in ten minutes. He signs him and knows exactly why.', effect: { coins: -430, squadMorale: 4, prestige: 1 } },
          { id: 'skip-video', label: 'Stick to players people have seen', desc: 'The league he knows, the players he knows', outcome: 'A safe signing who does exactly what was expected. The other lad goes elsewhere for triple within two seasons.', effect: { coins: -350, squadMorale: 3, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-selling-club-label', title: 'What The Club Is For', icon: '🏷️', category: 'transfer',
    when: { minSeason: 5, maxCoins: 350 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three of the last four best players have been sold in consecutive summers. A reporter uses the phrase selling club in a question and the room does not disagree with him.',
        choices: [
          { id: 'own-it', label: 'Own the label', desc: 'Say it is the model and defend the model', outcome: 'It becomes the club’s identity: buy young, develop, sell, repeat. It works, it pays, and it wins nothing for a long time.', effect: { boardMood: 3, coins: 300, squadMorale: -5, clubLegacy: { kind: 'reputation', label: 'A selling club, and good at it' } } },
          { id: 'reject-label', label: 'Reject it publicly', desc: 'Promise the next one stays', outcome: 'The promise is on tape. It is played back to him the summer after next, in a press conference, twice.', effect: { boardMood: -2, squadMorale: 8, prestige: 1, tag: 'mgr-promised-to-keep-them' } },
          { id: 'deflect', label: 'Turn the question back on the board', desc: 'Ask who signs the paperwork', outcome: 'It is a very good line and it makes the back page. There is a meeting on Monday that he does not enjoy.', effect: { boardMood: -3, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-released-kid-returns', title: 'The One They Let Go', icon: '🔙', category: 'transfer',
    when: { minSeason: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A boy released by this academy at fifteen is now twenty-one and tearing up a division below. He is available. His father has not been to this ground since the day of the letter.',
        choices: [
          { id: 'sign-return', label: 'Sign him and say sorry properly', desc: 'To him and to his father, in person', outcome: 'The father does not soften for a year. The player signs and gives the club everything, which is somehow both a triumph and an accusation.', effect: { coins: -280, squadMorale: 6, prestige: 1, clubLegacy: { kind: 'tradition', label: 'The one they got back' } } },
          { id: 'sign-quiet', label: 'Just do the deal', desc: 'No apology, no ceremony', outcome: 'He signs and plays well and is asked about the release in every interview for two years. He is very polite about it every time.', effect: { coins: -280, squadMorale: 3 } },
          { id: 'pass-return', label: 'Pass on him', desc: 'The scouts were not wrong then and are not now', outcome: 'He goes up two divisions in three years. The club’s academy report that year contains a paragraph nobody wants to read.', effect: { prestige: -2, boardMood: -1, coins: 100 } },
        ],
      },
    },
  },
  {
    id: 'mgr-injured-target-cheap', title: 'Available Because Of The Knee', icon: '🦵', category: 'transfer',
    when: { minSeason: 2, maxCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A player who would never otherwise be near this club is six months into a rehab and out of contract. He would cost almost nothing and play almost nothing this season.',
        choices: [
          { id: 'take-punt', label: 'Sign him for eighteen months', desc: 'Pay for next season, not this one', outcome: 'He does nothing at all until March and is the best player at the club for the whole of the year after.', effect: { coins: -140, boardMood: -2, squadMorale: -2, tag: 'mgr-bet-on-a-rehab' } },
          { id: 'incentive', label: 'Offer appearance-based terms', desc: 'Low basic, real money if he plays', outcome: 'He signs it grudgingly and it protects the club completely. It also means he trains through pain he should not train through.', effect: { coins: -70, squadMorale: 2 } },
          { id: 'no-punt', label: 'Spend the money on a fit player', desc: 'This season is the season he is judged on', outcome: 'A reliable player for reliable money. Reliable is exactly what the team already had eleven of.', effect: { coins: -300, squadMorale: 3, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-captain-in-a-swap', title: 'They Want The Captain In It', icon: '🎽', category: 'transfer',
    when: { minSeason: 3, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The deal for the striker only works if the captain goes the other way. He is thirty-one, he has been here nine years, and nobody has told him yet.',
        choices: [
          { id: 'tell-him-first', label: 'Tell him before anybody else', desc: 'His office, no agents, the whole truth', outcome: 'He listens, asks two questions, and says he will go if it helps. It is the hardest twenty minutes of the manager’s year.', effect: { playerMorale: { who: 'oldest', delta: -6 }, squadMorale: 4, coins: 100, prestige: 1 } },
          { id: 'kill-deal', label: 'Kill the deal', desc: 'He is not a makeweight in anything', outcome: 'The striker signs elsewhere and scores twenty-two. The captain plays another three years and lifts something in the last of them.', effect: { boardMood: -2, squadMorale: 8, playerMorale: { who: 'oldest', delta: 14 } } },
          { id: 'let-agents', label: 'Let the agents handle it', desc: 'Keep his hands clean', outcome: 'The captain learns his fate from a phone call in a car park. Nine years, and that is how it ends.', effect: { coins: 300, squadMorale: -12, playerMorale: { who: 'oldest', delta: -16 }, tag: 'mgr-let-a-legend-go-badly' } },
        ],
      },
    },
  },
  {
    id: 'mgr-release-clause-triggered', title: 'Somebody Paid It', icon: '🔓', category: 'transfer',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A release clause nobody expected anybody to meet has been met, in full, by bank transfer, on a Thursday morning. There is nothing to negotiate.',
        choices: [
          { id: 'good-grace', label: 'Handle it with good grace', desc: 'A statement, a handshake, a good word', outcome: 'He leaves saying the right things and means them. Two other agents make a note about how this club treats a departure.', effect: { coins: 700, squadMorale: -6, prestige: 1, tag: 'mgr-good-goodbye' } },
          { id: 'persuade', label: 'Try to talk him out of it', desc: 'One conversation, no pressure applied', outcome: 'He is already gone in his head and has been for a month. The conversation is honest and completely futile.', effect: { coins: 700, squadMorale: -8, playerMorale: { who: 'star', delta: -5 } } },
          { id: 'spend-it-fast', label: 'Spend it all before the board see it', desc: 'Two replacements, this week', outcome: 'Both signed inside nine days. It is decisive and slightly panicked and one of them is a mistake.', effect: { coins: 200, squadMorale: 5, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-loanee-too-good', title: 'Borrowed And Brilliant', icon: '⭐', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The loanee is the best thing in the side and belongs to somebody else. His parent club’s coaching staff have started coming to matches.',
        choices: [
          { id: 'buy-option', label: 'Push for an option to buy now', desc: 'Fix a price before the price moves', outcome: 'They set it high and agree to it. It looks expensive in January and absurdly cheap in June.', effect: { coins: -150, prestige: 1, tag: 'mgr-fixed-a-price' } },
          { id: 'play-less', label: 'Manage his minutes down', desc: 'Keep him fresh, keep him quiet', outcome: 'It fools nobody and costs points. The player notices before the parent club does and asks him straight out why.', effect: { squadMorale: -5, playerMorale: { who: 'star', delta: -6 } } },
          { id: 'showcase', label: 'Play him every minute and enjoy it', desc: 'Take the season he is giving them', outcome: 'He is magnificent for five months and gone forever in July. Nobody who watched it would trade the five months.', effect: { squadMorale: 8, boardMood: 1, coins: -40 } },
        ],
      },
    },
  },
  {
    id: 'mgr-strange-structure', title: 'Payable In Instalments', icon: '🧷', category: 'transfer',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A bid from abroad is large and structured across five years, with two of the payments contingent on things the buying club controls entirely.',
        choices: [
          { id: 'accept-structure', label: 'Accept it', desc: 'The headline figure is the headline figure', outcome: 'The announcement is enormous. Three years later the club is chasing two instalments through a governing body.', effect: { coins: 400, boardMood: 3, tag: 'mgr-took-instalments' } },
          { id: 'demand-cash', label: 'Demand more of it up front', desc: 'Less money, sooner, certain', outcome: 'They cut the headline by a third and pay most of it in August. The finance director sleeps for the first time in months.', effect: { coins: 550, boardMood: 1, prestige: 1 } },
          { id: 'walk-structure', label: 'Walk away from it', desc: 'Not with those clauses', outcome: 'No sale, and a player who now knows a life-changing move was blocked over paperwork he will never see.', effect: { playerMorale: { who: 'best', delta: -10 }, boardMood: -2, squadMorale: -4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-inducement', title: 'An Envelope Offered', icon: '🤐', category: 'transfer',
    when: { minSeason: 3 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'An intermediary, over a very good dinner, explains how these things are usually arranged in his part of the world. He is not joking and he is not embarrassed.',
        choices: [
          { id: 'refuse-flat', label: 'End the dinner', desc: 'Coat, door, no discussion', outcome: 'He pays for his own meal and drives home. The deal collapses and the player signs elsewhere within a fortnight.', effect: { prestige: 2, squadMorale: -3, boardMood: -1, tag: 'mgr-clean-hands' } },
          { id: 'report', label: 'Report it to the club and the league', desc: 'In writing, that night', outcome: 'Months of statements and a hearing he must attend twice. Nothing is proven and everyone in the game hears about it.', effect: { prestige: 1, boardMood: -2, clubLegacy: { kind: 'reputation', label: 'The club that reported it' } } },
          { id: 'ignore-it', label: 'Pretend it was not said', desc: 'Do the deal, forget the dinner', outcome: 'The player signs and is very good. There is a conversation in his head that he has again, occasionally, for years.', effect: { coins: -350, squadMorale: 5, prestige: -2, tag: 'mgr-looked-away' } },
        ],
      },
    },
  },
  {
    id: 'mgr-lower-league-trialist', title: 'From Two Divisions Down', icon: '🥾', category: 'transfer',
    when: { minSeason: 2, maxCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A twenty-four-year-old from part-time football has been in for a week and has been the best player in every session. The staff are split on whether it means anything.',
        choices: [
          { id: 'sign-parttime', label: 'Sign him', desc: 'Two years, small money, big jump', outcome: 'It takes him a season to look like he belongs and then he never looks like anything else. He is captain in four years.', effect: { coins: -70, squadMorale: 4, prestige: 1, tag: 'mgr-found-one' } },
          { id: 'reserve-games', label: 'Give him three reserve games first', desc: 'Evidence before ink', outcome: 'He is quiet in two and unplayable in the third. By then another club has offered him a contract and he takes it.', effect: { prestige: -1, squadMorale: -2 } },
          { id: 'no-parttime', label: 'Thank him and let him go', desc: 'Training is not Saturday', outcome: 'He goes back to the day job and to Saturdays in front of four hundred people. He was, in fact, good enough.', effect: { boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-loan-window-last-day', title: 'The Loan Window Shuts', icon: '🕔', category: 'transfer',
    when: { minSeason: 2, maxCoins: 300 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'No money, one window left open, and a squad that is a centre-half short of being able to survive an injury. The loan list is nine names and seven of them are wrong.',
        choices: [
          { id: 'take-any', label: 'Take the best of a bad list', desc: 'A body is a body in February', outcome: 'He is slow and he organises. Nobody would sign him in June and he is worth six points between now and May.', effect: { coins: -60, squadMorale: 3 } },
          { id: 'wait-summer', label: 'Take nobody', desc: 'Nine games with what there is', outcome: 'The centre-half plays every minute and finishes the season on one leg. It is close, and it holds.', effect: { squadMorale: -4, boardMood: 2, playerMorale: { who: 'oldest', delta: -6 } } },
          { id: 'favour', label: 'Ring in the favour he is owed', desc: 'Ask a bigger club for one of theirs', outcome: 'A very good twenty-year-old arrives on Friday. The favour is spent and the man who granted it will be back for it.', effect: { coins: -40, squadMorale: 7, prestige: -1, tag: 'mgr-spent-a-favour' } },
        ],
      },
    },
  },
  {
    id: 'mgr-old-boy-returns', title: 'He Wants To Come Home', icon: '🏠', category: 'transfer',
    when: { minSeason: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A player sold from here six years ago is thirty-three and out of favour, and has let it be known he would come back for a fraction of his wages.',
        choices: [
          { id: 'bring-back', label: 'Bring him home', desc: 'A year, sentiment included in the price', outcome: 'The ground is louder for his first game than it has been in years. He gives fourteen good games and then his body stops.', effect: { coins: -120, squadMorale: 8, prestige: 1, clubLegacy: { kind: 'tradition', label: 'The homecoming' } } },
          { id: 'player-coach', label: 'Offer a player-coach role', desc: 'Half a squad number, half a staff badge', outcome: 'It is a fudge and it works. He plays eleven times and teaches two young forwards more than the manager can.', effect: { coins: -100, playerMorale: { who: 'youngest', delta: 10 }, squadMorale: 5 } },
          { id: 'say-no-home', label: 'Say no, kindly', desc: 'Do not let him be remembered like this', outcome: 'He signs for a rival instead and plays against them in October. He is applauded by the home end anyway, which stings.', effect: { squadMorale: -3, boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-clearout', title: 'Nine Off The Wage Bill', icon: '🧹', category: 'transfer',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There are twenty-six professionals and about eighteen who will play. Somebody has to tell the other eight, and the list has been on his desk for four days.',
        choices: [
          { id: 'one-by-one', label: 'Tell each of them himself', desc: 'A morning, eight conversations, no HR', outcome: 'It takes four hours and empties him completely. Every one of them shakes his hand and two of them mean it.', effect: { coins: 350, squadMorale: -4, prestige: 2, tag: 'mgr-did-it-himself' } },
          { id: 'list-on-wall', label: 'Put the list up', desc: 'Fast, clear, brutal', outcome: 'It is done by nine in the morning. It is talked about in that dressing room for the rest of the manager’s time there.', effect: { coins: 350, squadMorale: -12, boardMood: 1 } },
          { id: 'keep-two', label: 'Keep two he was told to cut', desc: 'Carry the wages, keep the room', outcome: 'Both are squad players who never complain and hold the group together in March. The finance director never sees the value.', effect: { coins: 200, squadMorale: 5, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-wonderkid-clause', title: 'The Number In His Contract', icon: '🧨', category: 'transfer',
    when: { minSeason: 3, needs: 'wonderkid' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The boy’s first professional deal has a clause in it from before anybody knew what he would become. It is now roughly a fifth of what he is worth, and it is public.',
        choices: [
          { id: 'new-deal', label: 'Get a new deal signed this week', desc: 'More money, longer, clause removed', outcome: 'He signs, because he is nineteen and he likes it here. In two years he will be told what it cost him and he will shrug.', effect: { coins: -250, playerMorale: { who: 'youngest', delta: 10 }, boardMood: 2, tag: 'mgr-closed-the-clause' } },
          { id: 'let-it-ride', label: 'Leave it and hope nobody triggers it', desc: 'Say nothing, cross fingers', outcome: 'Nobody triggers it for eleven months. Then somebody does, on the last day of a window, and there is no reply available.', effect: { coins: 500, squadMorale: -8, boardMood: -2 } },
          { id: 'honest-with-him', label: 'Tell him exactly what he is worth', desc: 'Then let him decide', outcome: 'Nobody has ever been straight with him about money before. He signs a shorter deal, and trusts the manager entirely from that day.', effect: { coins: -150, playerMorale: { who: 'youngest', delta: 16 }, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-rival-castoff', title: 'Surplus Down The Road', icon: '♻️', category: 'transfer',
    when: { minSeason: 3, maxCoins: 450 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club twelve miles away are letting a midfielder go for nothing. He is twenty-eight, he is good, and he has celebrated a goal in front of this ground’s away end.',
        choices: [
          { id: 'sign-castoff', label: 'Sign him', desc: 'A free footballer is a free footballer', outcome: 'He is booed by his own supporters for a month and then scores in a derby and is never booed again.', effect: { coins: -60, squadMorale: 4, prestige: -1, tag: 'mgr-crossed-the-divide' } },
          { id: 'ask-fans', label: 'Have him address the supporters first', desc: 'A video, an honest one', outcome: 'He does it badly and sincerely and it works because of the badly. Half the reaction is warm and half is never going to be.', effect: { coins: -60, squadMorale: 3, prestige: 1 } },
          { id: 'no-castoff', label: 'Leave him', desc: 'Some players cannot cross that line', outcome: 'He signs for somebody else in the division and is superb. The manager is asked about it four times and answers honestly every time.', effect: { squadMorale: -2, prestige: 1, clubLegacy: { kind: 'rivalry', label: 'The line that is not crossed' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-scout-insists', title: 'The Chief Scout Digs In', icon: '📒', category: 'transfer',
    when: { minSeason: 2, minCoins: 200 }, weight: 3, temper: ['builder', 'tactician', 'disciplinarian'], first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The chief scout has put his job on the recommendation. The manager has watched the same player twice and does not see it. One of them is wrong and both are certain.',
        choices: [
          { id: 'defer', label: 'Defer to the scout', desc: 'That is what he is paid for', outcome: 'The player is exactly as ordinary as feared for a year and then very good for three. It is a lesson taken badly and taken.', effect: { coins: -320, squadMorale: 2, prestige: 1, tag: 'mgr-deferred-to-the-scout' } },
          { id: 'overrule', label: 'Overrule him', desc: 'The manager picks the team and the squad', outcome: 'The scout accepts it and something between them cools permanently. He leaves at the end of the season for a bigger club.', effect: { boardMood: 1, prestige: -1, coins: 100 } },
          { id: 'third-eye', label: 'Send a third pair of eyes', desc: 'Two more games, somebody neutral', outcome: 'The report comes back somewhere in the middle, which is the least useful outcome available. The player signs elsewhere meanwhile.', effect: { squadMorale: -2, boardMood: -1 } },
        ],
      },
    },
  },
];
