// Manager-arc authoring pack 06. ONE author owns this file — nobody else writes to it.
// See shared/src/managerarc.ts for the ManagerArc shape, the situation gates and the effect vocabulary.
//
// This pack takes the business of running a club: the people upstairs who own it, the market he has to buy
// in, and the people who write about him. Boardroom arcs gate on money and the table, transfer arcs on the
// window and on having somebody worth wanting, media arcs on the season being far enough along that there
// is something to write about.
import type { ManagerArc } from '../managerarc.js';

export const MGR_ARCS_06: ManagerArc[] = [
  // ── BOARDROOM ────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p06-owner-xi', title: 'A Suggestion About Saturday', icon: '🪑', category: 'boardroom',
    when: { minSeason: 2, minPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The owner rings on a Thursday night. He has watched the last four games from a box and he has a thought about the left side. He says he is only asking.',
        choices: [
          { id: 'humour', label: 'Say you will look at it', desc: 'Agree to nothing, promise a look', outcome: 'He is delighted. He rings again the following Thursday, and the Thursday after that, and by November it is a standing arrangement nobody agreed to.', effect: { boardMood: 2, prestige: -1, tag: 'mgr-p06-owner-calls' } },
          { id: 'refuse', label: 'Tell him the team is yours', desc: 'Once, politely, and only once', outcome: 'The call ends quickly. He does not ring again about the side, and the next time the club is beaten he does not ring at all.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-p06-held-the-line' } },
          { id: 'invite', label: 'Invite him to the meeting', desc: 'Let him watch the work being done', outcome: 'He sits at the back for ninety minutes of clips and leaves before the end. He never mentions the left side again, but he mentions the length of the meeting for years.', effect: { boardMood: 1, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-directors-son', title: 'A Boy Coming In On Tuesday', icon: '📋', category: 'boardroom',
    when: { minSeason: 2, maxPos: 0.7 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One of the directors mentions, at the end of a long meeting about something else, that his lad is between clubs. He is seventeen. He will come in Tuesday for a look.',
        choices: [
          { id: 'honest', label: 'Judge him like anybody else', desc: 'Two weeks, the same sessions, the same standard', outcome: 'He is a decent footballer and not a good enough one. The report says so in plain language and goes upstairs unedited. The director thanks him and does not mean it.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-p06-straight-with-board' } },
          { id: 'keep', label: 'Sign him for the under-21s', desc: 'Cheap, harmless, and it buys a year of peace', outcome: 'He takes a shirt off somebody who deserved it more. The academy staff say nothing to the manager and everything to each other.', effect: { boardMood: 3, squadMorale: -5, prestige: -2, tag: 'mgr-p06-favour-done' } },
          { id: 'refuse', label: 'Say no before he arrives', desc: 'Do not let it start', outcome: 'He does it on the phone, in under a minute, and spends the rest of the season being asked for things by a man who now expects to be refused.', effect: { boardMood: -3, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-rebrand', title: 'The New Crest', icon: '🛡️', category: 'boardroom',
    when: { minSeason: 3, maxTier: 4 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A marketing firm has been paid a great deal of money to remove the ship from the badge. The presentation uses the word "scalable" eleven times. Nobody from the town is in the room.',
        choices: [
          { id: 'fight', label: 'Fight it publicly', desc: 'Stand with the supporters, against the people who pay him', outcome: 'The ship stays. Two thousand people who have never met him decide he is one of theirs, and the board decide something else entirely.', effect: { boardMood: -3, prestige: 3, clubLegacy: { kind: 'tradition', label: 'the badge the supporters saved' } } },
          { id: 'quiet', label: 'Stay out of it', desc: 'Not his badge, not his fight', outcome: 'The new crest goes up over the ticket office in July. He is asked about it forty times and says the same nine words each time.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'trade', label: 'Trade it for something', desc: 'Let them have the badge, ask for the squad', outcome: 'The ship goes. A striker arrives. There is a version of that sentence in which he comes out of it well and this is not one of them.', effect: { coins: 380, boardMood: 2, prestige: -2, clubLegacy: { kind: 'tradition', label: 'the year the crest changed' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-betting-sponsor', title: 'Front Of Shirt', icon: '💷', category: 'boardroom',
    when: { minSeason: 2, maxCoins: 350 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The shirt deal on the table is from a betting firm and it is worth more than the other three combined. The commercial director calls it transformational. One of the club chaplains has already written in.',
        choices: [
          { id: 'take', label: 'Back the deal', desc: 'The money is real and the squad is short', outcome: 'The money arrives in August. So does a letter from a supporter whose son is not well, and he keeps it in a drawer rather than answering it.', effect: { coins: 520, boardMood: 2, prestige: -2, tag: 'mgr-p06-betting-shirt' } },
          { id: 'oppose', label: 'Say no, and say why', desc: 'On the record, with the reasons', outcome: 'The deal dies. The replacement is a local haulier paying a third as much, and every squad decision for two years is made in that gap.', effect: { coins: -180, boardMood: -3, prestige: 3, clubLegacy: { kind: 'reputation', label: 'turned down the betting money' } } },
          { id: 'condition', label: 'Take it with conditions', desc: 'Nothing on the youth kit, nothing in the academy', outcome: 'He gets the carve-out in writing and the money is smaller for it. It is the sort of compromise that satisfies nobody and is probably right.', effect: { coins: 300, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-the-debt', title: 'What The Club Owes', icon: '📉', category: 'boardroom',
    when: { minSeason: 4, maxCoins: 150 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The refinancing did not happen. Nobody says the word administration in the meeting but somebody has written it on the agenda in the third item and then crossed it out.',
        choices: [
          { id: 'defer', label: 'Defer his own wages', desc: 'Six months, quietly, no announcement', outcome: 'It is not enough to matter financially and it changes what the staff are willing to do for him, which turns out to matter more.', effect: { coins: 90, squadMorale: 6, prestige: 2, tag: 'mgr-p06-deferred-wages' } },
          { id: 'sell', label: 'Put the best player on the market', desc: 'One sale buys eighteen months', outcome: 'He goes for less than he is worth because everyone knows the club has to sell. The phrase gets used in three papers and then it sticks.', effect: { coins: 620, squadMorale: -10, playerMorale: { who: 'best', delta: -12 }, clubLegacy: { kind: 'reputation', label: 'a selling club' } } },
          { id: 'demand', label: 'Demand the board find the money', desc: 'It is their club and their mess', outcome: 'They find some of it, from a source nobody will name, and he is now a man who knows there was money and does not know where it came from.', effect: { coins: 280, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-assistant-poached', title: 'They Want The Number Two', icon: '🤝', category: 'boardroom',
    when: { minSeason: 3, maxPos: 0.45 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club two divisions up want the assistant. As their manager, not their coach. He has known about it for four days and has told the boss on the fifth, which is either loyalty or something else.',
        choices: [
          { id: 'bless', label: 'Tell him to go', desc: 'Drive him to the meeting if he needs it', outcome: 'He goes. The staff room is quieter and every young coach at the club now knows what happens here when your turn comes.', effect: { squadMorale: -6, prestige: 3, tag: 'mgr-p06-let-him-go' } },
          { id: 'block', label: 'Refuse permission', desc: 'He is under contract and the season is live', outcome: 'The club say no on his behalf and mean it. He stays, works hard, and is never quite in the room in the same way again.', effect: { boardMood: 1, squadMorale: 2, prestige: -2, tag: 'mgr-p06-blocked-assistant' } },
          { id: 'match', label: 'Get the board to improve his deal', desc: 'Money and a title, today, not in June', outcome: 'It works. It also establishes, for everyone watching, exactly what the club does when somebody else comes calling.', effect: { coins: -160, boardMood: -1, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-scouting-cut', title: 'The Scouting Line', icon: '🔎', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 300 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The budget for next year has one line reduced by sixty per cent and it is the one with the mileage claims in it. Four part-time scouts, all of them over sixty, all of them at a game every Saturday since before he was born.',
        choices: [
          { id: 'accept', label: 'Let it go', desc: 'Take the cut, protect the playing budget', outcome: 'He rings each of them himself rather than letting a letter do it. Two are gracious. One is not, and he was right not to be.', effect: { coins: 180, boardMood: 2, prestige: -2, tag: 'mgr-p06-lost-the-scouts' } },
          { id: 'defend', label: 'Defend the line', desc: 'Argue that the cheap players come from here', outcome: 'He wins it by producing a list of eleven players the club signed for nothing and sold for something. The list is short enough to be worrying.', effect: { boardMood: -1, tag: 'mgr-p06-kept-the-scouts' } },
          { id: 'pay', label: 'Pay them out of the coaching budget', desc: 'Move the money and tell nobody', outcome: 'It holds for a season. The finance director finds it in the spring and does not raise it, which is its own kind of message.', effect: { coins: -120, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-embargo', title: 'The Embargo', icon: '🚫', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 120 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A form went in late. Not by much. The league have applied the embargo the way the league always does, which is exactly as the rules say and with no interest at all in the circumstances.',
        choices: [
          { id: 'youth', label: 'Fill the gaps from the academy', desc: 'No signings, so no choice', outcome: 'Three boys make debuts in six weeks. Two of them are not ready and one of them is, and the one who is would have waited two more years otherwise.', effect: { playerMorale: { who: 'youngest', delta: 14 }, squadMorale: -4, tag: 'mgr-p06-embargo-youth' } },
          { id: 'appeal', label: 'Push the club to appeal', desc: 'Spend money on lawyers instead of players', outcome: 'The appeal takes eleven weeks and fails on a technicality that was explained to nobody. The legal bill is a full-back.', effect: { coins: -200, boardMood: -2 } },
          { id: 'blame', label: 'Make sure the club owns it', desc: 'It was an administrative failure and it should be said so', outcome: 'The statement goes out with the word "our" in it. Somebody in the office knows exactly whose form it was, and so, now, does everybody else.', effect: { boardMood: -3, prestige: 1, squadMorale: 5 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-touchline-ban', title: 'The Appeal', icon: '⚖️', category: 'boardroom',
    when: { minSeason: 2, minPos: 0.55 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three games from the touchline and a fine. The charge is worded carefully enough that fighting it means calling a fourth official a liar in writing.',
        choices: [
          { id: 'fight', label: 'Appeal it', desc: 'On the record, with the video', outcome: 'It is upheld and the ban becomes four. He was right about the incident and that turned out to be the least relevant fact in the room.', effect: { coins: -90, prestige: 1, boardMood: -2, tag: 'mgr-p06-appealed' } },
          { id: 'accept', label: 'Take it', desc: 'Serve it, pay it, say nothing', outcome: 'He watches three games from a seat behind the dugout with a phone he is not supposed to use. The side wins two of them, which is a fact he keeps hearing about.', effect: { coins: -60, boardMood: 1 } },
          { id: 'stand', label: 'Take it and say why he did it', desc: 'Own the words, explain the cause', outcome: 'He describes exactly what was said to one of his players and by whom. The ban stands. The player never forgets it.', effect: { coins: -60, squadMorale: 8, prestige: 2, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-stand-naming', title: 'Naming Rights', icon: '🏟️', category: 'boardroom',
    when: { minSeason: 5, maxCoins: 400 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A double-glazing company will pay to have their name on the North Stand for ten years. The stand is currently named after a man who played six hundred games and died in the car park in 1987.',
        choices: [
          { id: 'sell', label: 'Let it be sold', desc: 'The money keeps the club solvent', outcome: 'The new sign goes up in June. Nobody in the ground calls it the new name. Not once, not in ten years.', effect: { coins: 450, boardMood: 3, prestige: -3, clubLegacy: { kind: 'stand', label: 'the stand that was sold' } } },
          { id: 'block', label: 'Kill it', desc: 'Make it politically impossible', outcome: 'He mentions the man by name in a press conference, unprompted, and tells a story about him. The deal is dead within a week and nobody can say who killed it.', effect: { boardMood: -2, prestige: 3, clubLegacy: { kind: 'stand', label: 'the name that stayed' } } },
          { id: 'split', label: 'Sell a different stand', desc: 'The one with nothing on it', outcome: 'The away end is now named after a double-glazing company. It is a smaller cheque and an entirely acceptable joke.', effect: { coins: 260, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-ticket-rise', title: 'Eight Per Cent', icon: '🎫', category: 'boardroom',
    when: { minSeason: 3, maxPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Season tickets go up eight per cent on the back of a good year. He is asked to say, in the announcement, that the squad is being invested in. He has seen the budget.',
        choices: [
          { id: 'say', label: 'Say the line', desc: 'It is not quite false', outcome: 'It is used in the club video with music under it. In August the squad is one loanee better and the video is still on the website.', effect: { boardMood: 2, prestige: -2, tag: 'mgr-p06-said-the-line' } },
          { id: 'refuse', label: 'Refuse to front it', desc: 'Let a director sell the price rise', outcome: 'The commercial department are told he is unavailable. The chairman does it himself, badly, and remembers who made him do it.', effect: { boardMood: -2, prestige: 2 } },
          { id: 'reframe', label: 'Front it, and promise it goes on players', desc: 'Make the promise public so it binds them', outcome: 'The money does go on players, because he made it impossible for it not to. It also means the next window belongs to a sentence he said in a car park in May.', effect: { coins: 300, boardMood: -1, tag: 'mgr-p06-public-promise' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-training-ground', title: 'Bricks Or Players', icon: '🏗️', category: 'boardroom',
    when: { minSeason: 4, minCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is enough for a striker or enough for a third pitch and a gym that does not flood. The architect has brought a model. It has tiny trees on it.',
        choices: [
          { id: 'bricks', label: 'Build it', desc: 'Something that outlasts everybody in the room', outcome: 'The side finishes lower than it should. In four years there are kids training on a surface that does not turn to soup in November, and none of them know why.', effect: { coins: -520, squadMorale: -6, boardMood: 1, clubLegacy: { kind: 'tradition', label: 'the training ground he built' } } },
          { id: 'player', label: 'Sign the striker', desc: 'Win now, flood later', outcome: 'He scores fourteen. The gym still floods and the manager still has a job, and those two facts are related.', effect: { coins: -480, squadMorale: 8, boardMood: 2 } },
          { id: 'half', label: 'Do neither properly', desc: 'A pitch, a loan striker, both half-measures', outcome: 'The pitch is drained and the loanee is adequate. It is the decision a sensible man makes and nobody remembers it at all.', effect: { coins: -400, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-briefing-director', title: 'Somebody Is Talking', icon: '🕳️', category: 'boardroom',
    when: { minSeason: 3, minPos: 0.55 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A story appears with three details in it that were only ever said in one room. The room had nine people in it and he can narrow it to two.',
        choices: [
          { id: 'confront', label: 'Name it in the meeting', desc: 'Say the three details out loud and wait', outcome: 'Nobody admits anything. The leaking stops for four months and the man who did it is now an enemy who knows he is suspected.', effect: { boardMood: -2, tag: 'mgr-p06-called-the-leak' } },
          { id: 'starve', label: 'Stop telling them things', desc: 'Give the board less and the leaks dry up', outcome: 'It works. It also means that when he needs the board to understand something complicated, they have had six months of not being told anything.', effect: { boardMood: -1, prestige: 1, tag: 'mgr-p06-closed-off' } },
          { id: 'feed', label: 'Feed one of them a false detail', desc: 'Find out which of the two it is', outcome: 'It appears in print within nine days. He now knows, and knowing is worth less than he expected because he cannot do anything with it.', effect: { boardMood: -1, prestige: -1, tag: 'mgr-p06-knows-the-leak' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-chairman-ill', title: 'The Chairman Is Not Well', icon: '🕯️', category: 'boardroom',
    when: { minSeason: 5 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has been absent for six weeks and the club has said nothing. His daughter rings the manager directly, which she has never done, to ask whether her father can be driven to a home game without a fuss.',
        choices: [
          { id: 'quiet', label: 'Arrange it quietly', desc: 'A car, a lift, nobody told', outcome: 'He watches a nil-nil from the back of the directors box and grips the manager’s arm at the end without saying anything. Four months later there is a minute’s applause.', effect: { prestige: 2, boardMood: 2, clubLegacy: { kind: 'tradition', label: 'the applause in the seventh minute' } } },
          { id: 'ask', label: 'Ask what happens next', desc: 'Somebody has to talk about the shares', outcome: 'She answers honestly and he wishes she had not. He now knows more about the club’s future than the board does and can act on none of it.', effect: { boardMood: -1, tag: 'mgr-p06-knows-the-succession' } },
          { id: 'distance', label: 'Keep out of the family’s business', desc: 'He is the manager, not a friend', outcome: 'It is correct and it is cold. The daughter arranges it herself and remembers, when the shares are hers, exactly who was helpful.', effect: { boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-takeover', title: 'Due Diligence', icon: '📄', category: 'boardroom',
    when: { minSeason: 4, maxCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three men in the boardroom on a Tuesday with a translator and a laptop. Nobody has told the manager who they are. He has worked it out from the fact that the finance director has had his hair cut.',
        choices: [
          { id: 'help', label: 'Give them everything they ask for', desc: 'Full access, full honesty, no gloss', outcome: 'They value the squad lower than the club does and say so. The deal completes anyway and he is the only person in the building who told them the truth.', effect: { boardMood: -1, prestige: 2, tag: 'mgr-p06-helped-the-buyers' } },
          { id: 'sell', label: 'Sell them the project', desc: 'His plan, his players, his pitch', outcome: 'They like him. He has now attached himself to a takeover that may not happen and to owners nobody has checked.', effect: { boardMood: 1, coins: 200, tag: 'mgr-p06-backed-the-buyers' } },
          { id: 'ignore', label: 'Carry on as if it is not happening', desc: 'It is above his pay grade and beneath his attention', outcome: 'He takes training. The deal collapses in November for reasons never made public, and he is the only member of staff who did not waste a month on it.', effect: { squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-board-seat', title: 'A Seat At The Table', icon: '🪑', category: 'boardroom',
    when: { minSeason: 6, maxPos: 0.35 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They offer him a place on the board. It comes with a vote, a fiduciary duty, and the end of being able to say that the money is nothing to do with him.',
        choices: [
          { id: 'take', label: 'Take the seat', desc: 'Be in the room when it is decided', outcome: 'He votes for a wage cap in March and has to sell it to the dressing room in April. Both of those things are now his.', effect: { boardMood: 3, prestige: 2, squadMorale: -6, tag: 'mgr-p06-on-the-board' } },
          { id: 'decline', label: 'Stay a football manager', desc: 'Keep the line where it is', outcome: 'He says it is because he wants to be able to argue with them. They take it well and the seat is offered to somebody else within a fortnight.', effect: { boardMood: -1, squadMorale: 4 } },
          { id: 'later', label: 'Ask for it in writing, for later', desc: 'Not now, but on the record', outcome: 'It is agreed and minuted. He has traded a present advantage for a future one, in an industry where nobody has a future.', effect: { boardMood: 1, tag: 'mgr-p06-promised-a-seat' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-relegation-clause', title: 'Clause Nine', icon: '✒️', category: 'boardroom',
    when: { minSeason: 3, minPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The new contract is two years and better money. Clause nine reduces it to a month’s notice if the club goes down. The club secretary calls it standard and does not look up.',
        choices: [
          { id: 'sign', label: 'Sign it as it is', desc: 'Take the security that exists', outcome: 'He signs and puts it in a drawer. In February the drawer is the first thing he thinks about after a bad Tuesday night.', effect: { boardMood: 2, prestige: -1, tag: 'mgr-p06-signed-clause-nine' } },
          { id: 'strike', label: 'Have it taken out', desc: 'No clause, or no signature', outcome: 'They take it out and shorten the deal to eighteen months to compensate. He has bought protection with time and both of them know it.', effect: { boardMood: -1, prestige: 1 } },
          { id: 'unsigned', label: 'Work without a contract', desc: 'Nothing signed, nothing owed either way', outcome: 'It is a strange kind of freedom. Every agent in the country knows within three weeks, and so does every chairman.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-p06-no-contract' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-preseason-tour', title: 'Eleven Days In July', icon: '✈️', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 300 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The commercial tour pays for a full-back. It is eleven days, four flights, three sponsor events and two games on surfaces the fitness coach has described in an email marked confidential.',
        choices: [
          { id: 'go', label: 'Go, and make it work', desc: 'Take the money and manage the load', outcome: 'They come back with the cheque and two hamstrings. The full-back arrives in August and one of the hamstrings does not.', effect: { coins: 400, squadMorale: -6, boardMood: 2 } },
          { id: 'refuse', label: 'Refuse to take the first team', desc: 'Send the under-21s and a coach', outcome: 'The sponsors are unimpressed, the fee is halved, and the senior squad have the best pre-season they have had in years.', effect: { coins: 180, squadMorale: 8, boardMood: -3, tag: 'mgr-p06-refused-the-tour' } },
          { id: 'split', label: 'Split the squad', desc: 'Half go east, half stay and work', outcome: 'Neither group does anything properly. It is the fairest possible arrangement and the least useful one.', effect: { coins: 300, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-safe-standing', title: 'The Works', icon: '🔩', category: 'boardroom',
    when: { minSeason: 4, minTier: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The stadium works overrun. Two thousand fewer seats for the first eight home games, and the club has already sold the season tickets.',
        choices: [
          { id: 'front', label: 'Front the apology himself', desc: 'Stand in the fanzone and take it', outcome: 'He is there for ninety minutes and answers every question, including the ones he cannot answer. Nobody who was there ever gives him a hard time again.', effect: { prestige: 3, boardMood: -1, tag: 'mgr-p06-faced-them' } },
          { id: 'delegate', label: 'Let the club handle it', desc: 'It is an operations matter', outcome: 'A statement goes out at four on a Friday. It is the correct process and it makes the club look exactly like every other club.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'compensate', label: 'Push for refunds nobody budgeted', desc: 'Money back, out of the football budget if necessary', outcome: 'The refunds happen. In January there is no money for a loan goalkeeper and he cannot say why, because he agreed to it in September.', effect: { coins: -240, prestige: 2, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-wage-structure', title: 'The Structure', icon: '📊', category: 'boardroom',
    when: { minSeason: 3, minCoins: 350, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One signing has broken the wage ceiling by forty per cent. Four existing players have found out within eleven days, which is nine days longer than anyone expected.',
        choices: [
          { id: 'level', label: 'Level everybody up', desc: 'Fix it with money the club does not have', outcome: 'The room is calm and the wage bill is a problem for a future manager, who may well be him.', effect: { coins: -420, squadMorale: 10, boardMood: -3, tag: 'mgr-p06-broke-the-ceiling' } },
          { id: 'explain', label: 'Explain the market to them', desc: 'Honestly, individually, no comfort offered', outcome: 'Three of them accept it. The fourth is a good professional who is simply never quite the same about the club again.', effect: { squadMorale: -5, playerMorale: { who: 'unhappiest', delta: -10 }, prestige: 1 } },
          { id: 'bonus', label: 'Rebuild it around bonuses', desc: 'Small basics, big rewards for winning', outcome: 'It is fairer and it is fragile. A bad autumn now costs the players money as well as points.', effect: { coins: -120, squadMorale: 3, boardMood: 2, tag: 'mgr-p06-bonus-heavy' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-academy-category', title: 'The Category', icon: '🎓', category: 'boardroom',
    when: { minSeason: 4, minCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Holding the academy’s category costs more each year than it returns. An accountant has done the sums honestly and the honest answer is to drop a level.',
        choices: [
          { id: 'hold', label: 'Fund it', desc: 'Whatever the spreadsheet says', outcome: 'It costs a squad player a year for four years. The fifth year produces two first-teamers and a fee, and nobody links the two things.', effect: { coins: -300, boardMood: -2, clubLegacy: { kind: 'tradition', label: 'kept the academy' } } },
          { id: 'drop', label: 'Drop a category', desc: 'Fewer boys, better spent', outcome: 'Six coaches go and the recruitment area shrinks to the county. The saving is real and the loss will be somebody else’s to discover.', effect: { coins: 260, boardMood: 2, prestige: -2, tag: 'mgr-p06-cut-the-academy' } },
          { id: 'partner', label: 'Partner with a bigger club', desc: 'Their money, their pick of the boys', outcome: 'The funding is secured and so is their first refusal on anyone worth having. It is a sensible arrangement between unequal parties.', effect: { coins: 180, prestige: -1, tag: 'mgr-p06-feeder-deal' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-supporters-trust', title: 'A Seat For The Trust', icon: '🧣', category: 'boardroom',
    when: { minSeason: 4, minPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The supporters trust want an observer at board meetings. They have three thousand members, a solicitor working free, and a very well-organised letter.',
        choices: [
          { id: 'support', label: 'Back them publicly', desc: 'Say it is a good idea, on the record', outcome: 'They get their observer. He is thorough, quiet, and asks one question a meeting that nobody wants asked.', effect: { boardMood: -3, prestige: 3, clubLegacy: { kind: 'tradition', label: 'a supporters seat in the boardroom' } } },
          { id: 'neutral', label: 'Stay out of it', desc: 'Governance is not football', outcome: 'The request is refused in a letter that thanks them warmly. He is asked about it at every press conference for a month.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'meet', label: 'Meet them himself instead', desc: 'No seat, but a monthly hour with the manager', outcome: 'It is a smaller offer honestly made and they take it. It also becomes one more hour a month he does not have.', effect: { prestige: 2, boardMood: -1, tag: 'mgr-p06-meets-the-trust' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-agent-fees', title: 'Note Fourteen', icon: '🧾', category: 'boardroom',
    when: { minSeason: 4, minCoins: 200 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The published accounts show what the club paid intermediaries last year. It is more than the academy costs. A local reporter has already done the division and put it in a headline.',
        choices: [
          { id: 'defend', label: 'Defend it as the cost of business', desc: 'Everyone pays it, nobody says it', outcome: 'He says the words and hears himself say them. They are true and they sound like something a man in a different job would say.', effect: { boardMood: 2, prestige: -2 } },
          { id: 'reform', label: 'Insist on a cap', desc: 'A published limit, deal by deal', outcome: 'Two agents stop returning calls. The club misses a player it wanted in January and gets one it can live with in February.', effect: { coins: 150, boardMood: -1, prestige: 2, tag: 'mgr-p06-agent-cap' } },
          { id: 'silent', label: 'Refuse to discuss the accounts', desc: 'Not his document, not his answer', outcome: 'It runs for eight days rather than three. The finance director eventually does an interview and makes it considerably worse.', effect: { boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-owner-loan', title: 'At Six Per Cent', icon: '🏦', category: 'boardroom',
    when: { minSeason: 4, maxCoins: 180 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The owner will put money in. Not as equity — as a loan, secured on the ground, at six per cent. He describes this as the same thing.',
        choices: [
          { id: 'take', label: 'Push the board to take it', desc: 'The squad needs it now', outcome: 'The money lands and two players arrive. The club’s ground is now security against a debt to a man who chooses the manager.', effect: { coins: 560, boardMood: 2, prestige: -2, tag: 'mgr-p06-owner-loan' } },
          { id: 'oppose', label: 'Argue against it', desc: 'Not on the ground, not at that rate', outcome: 'The loan is refused. The window passes with nothing spent and the argument he won costs him fourteen points he cannot prove he would have had.', effect: { boardMood: -2, squadMorale: -6, prestige: 2 } },
          { id: 'condition', label: 'Take it, unsecured or not at all', desc: 'The money without the ground', outcome: 'He gets half as much on worse terms and the ground stays the club’s. It is the least impressive outcome and the only defensible one.', effect: { coins: 280, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the ground was never put up' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-sale-leaseback', title: 'Sell And Lease Back', icon: '🗝️', category: 'boardroom',
    when: { minSeason: 5, maxCoins: 200 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A property company will buy the training ground and rent it back for twenty-five years. The presentation is very good. The word "unlocks" appears on four slides.',
        choices: [
          { id: 'yes', label: 'Back it', desc: 'Turn bricks into a squad', outcome: 'The squad is transformed for two seasons. The rent is a fixture in every budget for the rest of the club’s existence.', effect: { coins: 700, boardMood: 3, clubLegacy: { kind: 'reputation', label: 'sold the training ground' } } },
          { id: 'no', label: 'Kill it', desc: 'Argue that the club must own something', outcome: 'He talks two directors round in a corridor with a page of numbers. The club keeps its land and finishes exactly where it was going to finish.', effect: { boardMood: -2, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the club still owns its land' } } },
          { id: 'partial', label: 'Sell the far pitches only', desc: 'Enough for a signing, not the whole site', outcome: 'The academy loses two pitches and gains a striker. The under-16s train on a rota and nobody in the first team notices.', effect: { coins: 340, boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-staff-bonus', title: 'Who Gets The Bonus', icon: '💼', category: 'boardroom',
    when: { minSeason: 3, maxPos: 0.3, minCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The promotion bonus pot is written for the playing squad. The kit man has been here twenty-six years and is not in the document.',
        choices: [
          { id: 'share', label: 'Insist the staff are included', desc: 'Everyone in the building or nobody', outcome: 'The pot is split wider and each player gets less. Two agents ring about it. The kit man says nothing at all and cries in the laundry.', effect: { coins: -180, squadMorale: -4, prestige: 3, tag: 'mgr-p06-shared-the-pot' } },
          { id: 'own', label: 'Pay the staff from his own bonus', desc: 'Quietly, and never mention it', outcome: 'It gets out in about a fortnight, because these things do. He is furious about that and it does him more good than anything he said all year.', effect: { coins: -90, prestige: 2, squadMorale: 3 } },
          { id: 'leave', label: 'Leave the document alone', desc: 'It is the players who win the games', outcome: 'The players are paid what they were promised. The kit man is given a framed shirt and is very gracious about it.', effect: { squadMorale: 6, boardMood: 1, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-written-target', title: 'In Writing', icon: '📌', category: 'boardroom',
    when: { minSeason: 2, maxPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The summer review ends with the chairman asking him to put a target in an email. Not a promise, he says. Just something for the file.',
        choices: [
          { id: 'ambitious', label: 'Aim high', desc: 'Name a finish that would be an achievement', outcome: 'The email is nine words long. In March a version of those nine words appears in a newspaper, and the file has done what files do.', effect: { boardMood: 3, prestige: -1, tag: 'mgr-p06-target-high' } },
          { id: 'low', label: 'Aim low deliberately', desc: 'Set a bar he can clear in his sleep', outcome: 'It is accepted without comment, which tells him what they think of the squad. Clearing it in February is worth nothing at all.', effect: { boardMood: -1, tag: 'mgr-p06-target-low' } },
          { id: 'refuse', label: 'Send nothing', desc: 'No email, no file', outcome: 'He is asked twice more and then not again. There is nothing in writing, which protects him from everything except the actual table.', effect: { boardMood: -2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-director-of-football', title: 'A Structure Above Him', icon: '🗂️', category: 'boardroom',
    when: { minSeason: 4, minPos: 0.45 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They want a director of football. The chairman says it is to protect the manager from the recruitment. Nobody in football has ever meant that sentence.',
        choices: [
          { id: 'accept', label: 'Accept it and work with him', desc: 'Take the help, keep the team', outcome: 'The man is good at his job and signs two players the manager would not have chosen. One of them is excellent.', effect: { boardMood: 2, prestige: -1, coins: 200, tag: 'mgr-p06-has-a-dof' } },
          { id: 'choose', label: 'Insist on choosing him', desc: 'If there is one, he is the manager’s appointment', outcome: 'He gets the man he wanted, who is loyal and slightly out of his depth. The structure exists and does nothing, which was the point.', effect: { boardMood: -1, coins: -120 } },
          { id: 'fight', label: 'Fight it to the end', desc: 'One voice on football or find another manager', outcome: 'He wins. It is now on the record that he is difficult to work with, and that record is read by every board he ever meets.', effect: { boardMood: -3, prestige: 1, tag: 'mgr-p06-no-dof' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-audit', title: 'The Auditors', icon: '🧮', category: 'boardroom',
    when: { minSeason: 5, maxCoins: 250 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The accounts are filed late for the second year. The auditors want to see the bonus arrangements, which exist in three places and agree in none of them.',
        choices: [
          { id: 'cooperate', label: 'Hand over everything', desc: 'Every note, every text message', outcome: 'It takes nine days of his time in the middle of a season. Two arrangements he inherited are unwound and one player is worse off and blames him.', effect: { playerMorale: { who: 'star', delta: -10 }, boardMood: 1, prestige: 1 } },
          { id: 'minimal', label: 'Give them what is asked and nothing more', desc: 'Answer the question, not the implied one', outcome: 'The report is signed with a paragraph in it that reads oddly to anybody who knows how to read one.', effect: { boardMood: 2, tag: 'mgr-p06-qualified-accounts' } },
          { id: 'clean', label: 'Insist on rewriting all of it', desc: 'One document, one truth, from now on', outcome: 'It is a month of work that improves nothing this season and makes the next three cleaner than they would have been.', effect: { coins: -80, boardMood: -1, prestige: 2, tag: 'mgr-p06-cleaned-the-books' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-shirt-numbers', title: 'The Number', icon: '🔢', category: 'boardroom',
    when: { minSeason: 6, maxTier: 5 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A former captain has died. The family have asked, through a friend, whether the club might retire his number. The commercial department point out that it is currently on eleven hundred replica shirts.',
        choices: [
          { id: 'retire', label: 'Retire it', desc: 'Nobody wears it again', outcome: 'The announcement is short and the applause is not. A number goes out of use at a club that will be here long after everyone involved.', effect: { prestige: 2, boardMood: -1, clubLegacy: { kind: 'number', label: 'a number retired' } } },
          { id: 'award', label: 'Give it to one player a season', desc: 'Earned, not retired', outcome: 'The first man to get it is thirty-three and plays the best year of his life in it. The family are there when it is handed over.', effect: { playerMorale: { who: 'oldest', delta: 14 }, squadMorale: 6, clubLegacy: { kind: 'tradition', label: 'the shirt that has to be earned' } } },
          { id: 'decline', label: 'Say no, kindly', desc: 'Numbers are for the players who are here', outcome: 'He writes to the family himself rather than letting the club do it. They accept it. He is not sure he would have.', effect: { boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },

  // ── TRANSFER ─────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p06-tribunal', title: 'The Tribunal', icon: '⚖️', category: 'transfer',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A seventeen-year-old has gone for nothing to a club that can pay him properly. The compensation is being set by a panel in a room in London and the club’s case is a folder of appearance records.',
        choices: [
          { id: 'fight', label: 'Argue the full case', desc: 'Coaches, hours, everything the club put in', outcome: 'The award is more than expected and less than he is worth. Every agent in the region now knows this club fights, which cuts both ways.', effect: { coins: 340, prestige: 1, tag: 'mgr-p06-fought-tribunal' } },
          { id: 'settle', label: 'Settle quickly', desc: 'Less money, no eight months of it', outcome: 'A smaller cheque in six weeks rather than a bigger one in a year. The finance director is delighted and the academy manager is not.', effect: { coins: 190, boardMood: 2 } },
          { id: 'sellon', label: 'Take less, take a sell-on', desc: 'A small cheque now and twenty per cent later', outcome: 'The boy plays eleven senior games in four years and the twenty per cent is worth almost nothing. It was still the right shape of bet.', effect: { coins: 90, tag: 'mgr-p06-sell-on-held' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-agent-three', title: 'One Man, Three Players', icon: '🕴️', category: 'transfer',
    when: { minSeason: 3, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The same agent represents the captain, the goalkeeper and the boy who came in from the academy last year. He has begun ringing about all three in the same conversation.',
        choices: [
          { id: 'split', label: 'Deal with each contract separately', desc: 'Three conversations, three rooms, three months apart', outcome: 'It is slower and it costs him a summer. Two are signed and the third goes, and none of it happened as a package.', effect: { coins: -180, squadMorale: 4, prestige: 1, tag: 'mgr-p06-split-the-agent' } },
          { id: 'package', label: 'Do the lot in one meeting', desc: 'Efficient, and exactly what he wants', outcome: 'All three signed by Friday, all three overpaid by roughly the same margin. The agent buys lunch and it is the most expensive lunch in the club’s history.', effect: { coins: -420, squadMorale: 10, boardMood: -2 } },
          { id: 'freeze', label: 'Refuse to deal with him at all', desc: 'The club talks to players, not to him', outcome: 'It is legally awkward and practically impossible. Two contracts run down and one player leaves in June for nothing.', effect: { squadMorale: -8, playerMorale: { who: 'star', delta: -12 }, tag: 'mgr-p06-froze-the-agent' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-swap', title: 'A Swap', icon: '🔁', category: 'transfer',
    when: { minSeason: 3, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They will take the man who wants to leave and give back one of theirs who wants the same thing. Two unhappy players, changing dressing rooms, no money moving.',
        choices: [
          { id: 'do-it', label: 'Do the deal', desc: 'A fresh start for both, no cheque either way', outcome: 'Theirs is better than expected for nine weeks and then reverts. The club has swapped a problem it understood for one it does not.', effect: { playerMorale: { who: 'unhappiest', delta: 12 }, squadMorale: 2, tag: 'mgr-p06-did-the-swap' } },
          { id: 'cash', label: 'Insist on money instead', desc: 'Sell his, buy nobody', outcome: 'They pay, reluctantly, and the squad is a man light in a position it cannot afford to be light in.', effect: { coins: 300, squadMorale: -6 } },
          { id: 'keep', label: 'Keep his own and fix him', desc: 'A month of work rather than a transaction', outcome: 'It half works. He plays eight good games and asks again in January, more politely and more firmly.', effect: { playerMorale: { who: 'unhappiest', delta: 6 }, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-free-agent', title: 'Eight Months Out', icon: '🧍', category: 'transfer',
    when: { minSeason: 2, maxCoins: 200, needs: 'thin-squad' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He was very good three years ago. He has not played since March and he trains alone in a park with a man who used to be at the club. He will sign for almost nothing.',
        choices: [
          { id: 'sign', label: 'Sign him', desc: 'Free, fit-ish, and desperate to prove it', outcome: 'Six weeks to get him going and then eleven games that keep the club up. He is gone in June and it does not matter.', effect: { coins: -40, squadMorale: 6, tag: 'mgr-p06-took-the-free' } },
          { id: 'trial', label: 'Bring him in on trial only', desc: 'A month, no promises, no shirt', outcome: 'He is honest about how hard it is. He signs elsewhere on the last day of the trial for a contract, which is what he needed and this club would not give.', effect: { squadMorale: -2 } },
          { id: 'pass', label: 'Pass', desc: 'There is a reason nobody has taken him', outcome: 'He scores against them in April. The reason turns out to have been a divorce and a bad agent, and neither of those things stops a man playing.', effect: { boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-medical', title: 'The Scan', icon: '🩻', category: 'transfer',
    when: { minSeason: 2, minCoins: 300 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Everything is agreed. The knee comes back with something on it that the club doctor describes as manageable and will not put in writing.',
        choices: [
          { id: 'proceed', label: 'Sign him anyway', desc: 'Take the risk on the player they need', outcome: 'He plays twenty-six games in the first season and none at all in the second. Both halves of that were on the scan.', effect: { coins: -450, squadMorale: 8, boardMood: -2, tag: 'mgr-p06-signed-the-knee' } },
          { id: 'renegotiate', label: 'Cut the fee', desc: 'Use it, coldly, at the last minute', outcome: 'It works and the player knows exactly what happened. He arrives with a grievance about a club he has not played for yet.', effect: { coins: -260, playerMorale: { who: 'star', delta: -6 } } },
          { id: 'walk', label: 'Walk away', desc: 'No signing, no argument, no explanation given', outcome: 'He signs three divisions down and plays a hundred and forty games. The doctor is not wrong; he is just not right in this instance.', effect: { boardMood: 1, squadMorale: -4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-buyback', title: 'The Buy-Back', icon: '↩️', category: 'transfer',
    when: { minSeason: 3, needs: 'wonderkid' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They will pay well for the young one. They also want a buy-back at a fixed price, which is their way of saying they think he will be worth four times it.',
        choices: [
          { id: 'accept', label: 'Take the money and the clause', desc: 'Cash now, a door left open', outcome: 'He is back in three years at a price that looks like theft, on wages the club cannot pay. The door was open onto a wall.', effect: { coins: 700, playerMorale: { who: 'youngest', delta: -8 }, tag: 'mgr-p06-buyback-given' } },
          { id: 'refuse', label: 'No clause', desc: 'Sell him properly or not at all', outcome: 'The fee drops by a fifth and the deal is clean. In four years there is no clause to be bitter about, only a player.', effect: { coins: 520, prestige: 1 } },
          { id: 'sellon', label: 'Swap it for a sell-on', desc: 'No buy-back, thirty per cent of the next one', outcome: 'They agree quickly, which is the first sign it was the wrong trade. Six years later the thirty per cent pays for a stand.', effect: { coins: 480, tag: 'mgr-p06-big-sell-on' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-obligation-loan', title: 'The Obligation', icon: '📎', category: 'transfer',
    when: { minSeason: 3, maxCoins: 300 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A loan, free, for a season, with an obligation to buy at four hundred if he plays twenty games. It is a good player and a bad clause and they arrive together.',
        choices: [
          { id: 'take', label: 'Take it', desc: 'Worry about game twenty in February', outcome: 'He is on nineteen in March and everyone in the building knows it, including him.', effect: { squadMorale: 6, coins: -20, tag: 'mgr-p06-obligation-live' } },
          { id: 'negotiate', label: 'Get the trigger raised', desc: 'Thirty games, not twenty', outcome: 'They agree and add a fee for the loan. The club pays now to protect itself from a bill it might never have received.', effect: { coins: -140, squadMorale: 4 } },
          { id: 'decline', label: 'Take a worse player, free and clean', desc: 'Nothing owed in June', outcome: 'The worse player is worse. The budget in the summer is untouched and there is a version of the season where that matters more.', effect: { squadMorale: -3, boardMood: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-bid-accepted', title: 'A Bid Has Been Accepted', icon: '📞', category: 'transfer',
    when: { minSeason: 3, maxCoins: 200 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He finds out from the player, who found out from his agent, who was told by the buying club. The bid was accepted on Tuesday. It is Thursday.',
        choices: [
          { id: 'row', label: 'Have it out upstairs', desc: 'Now, loudly, with the door open', outcome: 'The apology is immediate and worthless. It will happen again, though next time somebody will remember to ring him first.', effect: { boardMood: -3, prestige: 2, squadMorale: 4, tag: 'mgr-p06-bid-row' } },
          { id: 'player', label: 'Go straight to the player', desc: 'Get to him before anyone else does', outcome: 'They talk for an hour in a car park. He stays until January and plays like a man who was asked rather than sold.', effect: { playerMorale: { who: 'best', delta: 10 }, squadMorale: 5, boardMood: -1 } },
          { id: 'take', label: 'Let it happen and take the money', desc: 'The number is a good number', outcome: 'He goes on the Saturday. The replacement arrives in three weeks and is fine, and the dressing room learns what the club is.', effect: { coins: 600, squadMorale: -8, boardMood: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-family-wont-move', title: 'Two Hundred Miles', icon: '🚗', category: 'transfer',
    when: { minSeason: 2, minCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The player wants to come. His wife has a job she has spent nine years getting and a mother twenty minutes from the house. Nobody has asked her anything yet.',
        choices: [
          { id: 'help', label: 'Solve it properly', desc: 'Schools, a house, whatever the club can do', outcome: 'It takes six weeks and a lot of small favours. He signs, they settle, and he plays four seasons rather than one.', effect: { coins: -380, squadMorale: 6, prestige: 2, tag: 'mgr-p06-moved-the-family' } },
          { id: 'commute', label: 'Let him commute', desc: 'Digs in the week, home at weekends', outcome: 'He does forty thousand miles in a year and is a marvellous professional about it. By March he looks like a man who lives in a car.', effect: { coins: -340, squadMorale: 2, playerMorale: { who: 'star', delta: -6 } } },
          { id: 'walk', label: 'Move on to somebody else', desc: 'A player who wants to be here', outcome: 'The alternative is not as good and turns up on the Monday with his own removal van. There is something to be said for that.', effect: { coins: -220, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-work-permit', title: 'The Points', icon: '🛂', category: 'transfer',
    when: { minSeason: 3, minCoins: 300 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He is two points short. The appeal needs three independent experts to say he is exceptional and one of the three has never seen him play.',
        choices: [
          { id: 'appeal', label: 'Run the appeal', desc: 'Lawyers, videos, a hearing in eight weeks', outcome: 'It is granted on the last possible day. He has missed the whole of pre-season and looks like a stranger until November.', effect: { coins: -420, squadMorale: -2, tag: 'mgr-p06-won-the-permit' } },
          { id: 'loan-out', label: 'Park him abroad for a year', desc: 'Loan him to a club where he can play', outcome: 'He plays thirty games in another country, qualifies comfortably, and is wanted by three better clubs by the time he is available.', effect: { coins: -180, tag: 'mgr-p06-parked-abroad' } },
          { id: 'drop', label: 'Drop it', desc: 'Sign somebody who can actually play on Saturday', outcome: 'The domestic alternative costs more and is available immediately. It is the boring decision and the squad is better for it in September.', effect: { coins: -460, squadMorale: 5, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-bidding-war', title: 'The Same Player', icon: '🥊', category: 'transfer',
    when: { minSeason: 3, minCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club they finished above last year want him too, and have said so publicly, which is a tactic. The price has risen eighty thousand in nine days without either club bidding.',
        choices: [
          { id: 'pay', label: 'Pay whatever it takes', desc: 'Win it, and be seen to win it', outcome: 'He signs and the fee is a record. He is a good player at a stupid price and the stupid price is now the club’s benchmark.', effect: { coins: -680, squadMorale: 8, boardMood: -2, prestige: 2, tag: 'mgr-p06-won-the-war' } },
          { id: 'walk', label: 'Walk away early and loudly', desc: 'Let them have him at the inflated price', outcome: 'They pay it. He is injured in October and their manager is asked about the fee every week until Christmas.', effect: { boardMood: 2, squadMorale: -4 } },
          { id: 'divert', label: 'Buy the other one quietly', desc: 'The lad nobody is talking about, half the price', outcome: 'Nobody notices for a year. Then they notice for about five years, and the manager keeps a very straight face about the whole thing.', effect: { coins: -320, squadMorale: 4, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-domino', title: 'The Domino', icon: '🁣', category: 'transfer',
    when: { minSeason: 3, maxCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Their striker will come, but only when their club sign a replacement, and that replacement’s club want a goalkeeper first. Four clubs, one afternoon, and a fax machine somebody has had to find.',
        choices: [
          { id: 'wait', label: 'Wait it out', desc: 'Sit on the phone until eleven', outcome: 'Three of the four go through. The one that does not is the one at the front, and the club ends the window exactly where it started.', effect: { squadMorale: -6, boardMood: -1 } },
          { id: 'plan-b', label: 'Go to the alternative at seven', desc: 'Cut it loose while there is still time', outcome: 'Plan B is signed by half past nine and is a worse player who is here. The domino falls at 11.42 without them.', effect: { coins: -280, squadMorale: 3, tag: 'mgr-p06-took-plan-b' } },
          { id: 'grease', label: 'Pay to unstick the front of it', desc: 'Cover part of somebody else’s deal', outcome: 'It works and it is faintly humiliating and the club has paid two fees for one player. He arrives at 11.51 with no boots.', effect: { coins: -420, squadMorale: 8, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-sell-to-rival', title: 'Not To Them', icon: '🚩', category: 'transfer',
    when: { minSeason: 4, maxCoins: 200 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The best offer is from the club up the road. It is a hundred and forty more than the next one and every supporter in the town will see him in their shirt in August.',
        choices: [
          { id: 'take', label: 'Take the best money', desc: 'It is a business and the number is the number', outcome: 'He scores against them in November and does not celebrate, which somehow makes it worse. The extra hundred and forty buys a full-back.', effect: { coins: 640, prestige: -2, squadMorale: -6, clubLegacy: { kind: 'rivalry', label: 'the one they sold up the road' } } },
          { id: 'refuse', label: 'Sell him elsewhere for less', desc: 'Anywhere but there', outcome: 'The lower offer is accepted and the difference is a squad player the club now cannot afford. Nobody in the town ever complains about it.', effect: { coins: 500, prestige: 2, tag: 'mgr-p06-not-to-them' } },
          { id: 'keep', label: 'Refuse to sell at all', desc: 'Keep him and let the contract run', outcome: 'He stays, sulks until October, and is superb from Christmas. He leaves for nothing in the summer and it was still probably right.', effect: { squadMorale: 6, playerMorale: { who: 'best', delta: -8 }, boardMood: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-recall', title: 'The Recall', icon: '📥', category: 'transfer',
    when: { minSeason: 3, needs: 'thin-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The boy on loan is playing every week and has scored six. The club that has him would like to keep him until May. The recall window shuts on Thursday.',
        choices: [
          { id: 'recall', label: 'Bring him back', desc: 'The squad is short and he is in form', outcome: 'He comes back and is a substitute for eleven weeks. The form was made of playing, and it does not survive the bench.', effect: { squadMorale: 3, playerMorale: { who: 'youngest', delta: -12 }, tag: 'mgr-p06-recalled-him' } },
          { id: 'leave', label: 'Leave him there', desc: 'Let him finish the season playing', outcome: 'He ends with fourteen and comes back in June a different footballer. Between now and then the manager has to find the games from somewhere else.', effect: { squadMorale: -5, playerMorale: { who: 'youngest', delta: 12 } } },
          { id: 'fee', label: 'Leave him and charge them for it', desc: 'A fee to waive the recall', outcome: 'They pay it without arguing, which suggests it was too cheap. The boy hears about it and understands, correctly, that he was traded.', effect: { coins: 160, playerMorale: { who: 'youngest', delta: -6 }, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-non-league-trialist', title: 'A Man From The Northern League', icon: '🥾', category: 'transfer',
    when: { minSeason: 2, maxCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He is twenty-four, works on the bins, and has done something in a training game that made two of the senior players laugh in the way players laugh when they are embarrassed.',
        choices: [
          { id: 'sign', label: 'Sign him', desc: 'Two years, low money, no fuss', outcome: 'He is short of everything except the thing he cannot be taught. Eighteen months later he is the first name on the sheet.', effect: { coins: -30, squadMorale: 5, prestige: 2, tag: 'mgr-p06-bins-to-boots' } },
          { id: 'develop', label: 'Keep him part-time for a year', desc: 'Train with the 21s, keep the job', outcome: 'He does both for eleven months and then his employer stops being flexible. He picks the job, because he has a mortgage.', effect: { prestige: -1 } },
          { id: 'send-back', label: 'Send him back with a word', desc: 'Not ready, and told why', outcome: 'He goes back and scores forty in two seasons. Somebody else signs him for a hundred and twenty thousand and the manager watches it happen.', effect: { boardMood: 1, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-scout-credit', title: 'Who Found Him', icon: '🔦', category: 'transfer',
    when: { minSeason: 4, minCoins: 300 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The player everyone is pleased about was watched eleven times by a part-timer who drives a van. The recruitment head has done the presentation and used the word "we" throughout.',
        choices: [
          { id: 'name', label: 'Name him publicly', desc: 'In the press conference, by name', outcome: 'The van driver is mortified and delighted. The recruitment head is neither, and the next presentation is noticeably more honest.', effect: { prestige: 2, boardMood: -1, tag: 'mgr-p06-gave-credit' } },
          { id: 'pay', label: 'Get him a finder’s fee', desc: 'Money rather than a mention', outcome: 'It takes three months of pushing and it is not much. He buys a better car and covers twice the ground next season.', effect: { coins: -60, tag: 'mgr-p06-paid-the-scout' } },
          { id: 'quiet', label: 'Say nothing and remember it', desc: 'Keep the department calm', outcome: 'The head takes the credit and the van driver takes the hint. Two years later he is scouting for somebody else and finding them players.', effect: { boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-wonderkid-clause', title: 'Two Point One', icon: '🌟', category: 'transfer',
    when: { needs: 'wonderkid', minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The release clause in the boy’s contract was set when he was fifteen by a man who no longer works here. It is a number a big club would pay without a meeting.',
        choices: [
          { id: 'renew', label: 'Get him on a new deal now', desc: 'More money, no clause, this week', outcome: 'It costs a fortune in wages for a boy with sixteen appearances. It also removes the number, and the number was the whole problem.', effect: { coins: -300, playerMorale: { who: 'youngest', delta: 12 }, boardMood: -2, tag: 'mgr-p06-clause-removed' } },
          { id: 'wait', label: 'Wait until the summer', desc: 'Let him play, negotiate from strength', outcome: 'The clause is triggered in January by a club that had been told to wait as well. He is gone by the Wednesday.', effect: { coins: 520, squadMorale: -8, tag: 'mgr-p06-clause-triggered' } },
          { id: 'tell', label: 'Tell the boy exactly what it means', desc: 'The truth, in a room, with his father there', outcome: 'He is seventeen and takes it seriously. He signs a shorter deal on smaller money because somebody was straight with him.', effect: { coins: -140, playerMorale: { who: 'youngest', delta: 8 }, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-veteran-coaching', title: 'Not A Playing Contract', icon: '🧓', category: 'transfer',
    when: { needs: 'veteran', minSeason: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He is thirty-six and there is no playing contract in the offer. There is a coaching role, part-time, on a third of the money, and it is on the table today.',
        choices: [
          { id: 'offer', label: 'Put it to him straight', desc: 'This or nothing, and here is why', outcome: 'He takes a week and takes the job. He is a natural at it and does not touch a ball again, and misses it visibly for two years.', effect: { playerMorale: { who: 'oldest', delta: -6 }, squadMorale: 5, coins: -60, tag: 'mgr-p06-veteran-coaching' } },
          { id: 'one-more', label: 'Give him one more year playing', desc: 'Twelve months, low money, no promises of minutes', outcome: 'He plays nine games and is finished by February. He gets a proper send-off, which the coaching job would never have given him.', effect: { playerMorale: { who: 'oldest', delta: 12 }, coins: -110, squadMorale: 4 } },
          { id: 'release', label: 'Let him go entirely', desc: 'A clean end, somewhere else', outcome: 'He signs for a club two divisions down and plays thirty-eight games. He is asked about this club in every interview and is very generous about it.', effect: { coins: 80, squadMorale: -4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-panic-buy', title: 'Nine Fit Players', icon: '🚑', category: 'transfer',
    when: { needs: 'thin-squad', minSeason: 2, minPos: 0.5 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two more went down at the weekend. There are nine outfield players fit for Tuesday and one of them is a goalkeeper who used to play centre-half at school.',
        choices: [
          { id: 'emergency', label: 'Take anybody available', desc: 'Two bodies by Monday, quality irrelevant', outcome: 'Both are dreadful and both start eleven games. The club survives the month and spends the summer undoing it.', effect: { coins: -220, squadMorale: 4, boardMood: -1, tag: 'mgr-p06-panic-bought' } },
          { id: 'kids', label: 'Promote from the youth side', desc: 'Three boys, straight in', outcome: 'One of them is completely out of his depth and says so afterwards, honestly, in a way that does him credit. Another does not look out of place at all.', effect: { playerMorale: { who: 'youngest', delta: 10 }, squadMorale: -3 } },
          { id: 'grind', label: 'Play the fit ones into the ground', desc: 'Same eleven, every three days, and pray', outcome: 'They get through it. Two more break down in March and the run-in is played by a squad that has nothing left in it.', effect: { squadMorale: -8, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-trim-squad', title: 'Twenty-Nine Players', icon: '✂️', category: 'transfer',
    when: { needs: 'big-squad', minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There are twenty-nine professionals and eighteen shirts in a matchday squad. Eleven men will spend the season in a gym being paid to be available.',
        choices: [
          { id: 'cull', label: 'Move eight of them on', desc: 'Loans, frees, whatever it takes', outcome: 'The wage bill drops and so does the mood. Two of the eight are excellent at their next club, which is the risk and it lands.', effect: { coins: 260, squadMorale: -8, boardMood: 2, tag: 'mgr-p06-trimmed' } },
          { id: 'keep', label: 'Keep them all', desc: 'It is a long season and bodies get hurt', outcome: 'In February he is grateful. In November he had eleven unhappy men in a gym and a coach who could not get a session going.', effect: { coins: -180, squadMorale: -3, boardMood: -2 } },
          { id: 'rotate', label: 'Promise real rotation', desc: 'A cup run and a genuine second eleven', outcome: 'He keeps the promise for two months and then the league gets tight. Nobody says anything and everybody notices.', effect: { squadMorale: 6, tag: 'mgr-p06-rotation-promise' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-video-signing', title: 'On Video Only', icon: '📼', category: 'transfer',
    when: { minSeason: 3, minCoins: 350 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nobody at the club has seen him live. There are eleven clips, a data model that likes him a great deal, and a league nobody in the room has watched a full game of.',
        choices: [
          { id: 'trust', label: 'Trust the numbers', desc: 'Sign him off the model', outcome: 'The model was right about the football and silent about everything else. He is a wonderful player who cannot cope with the weather or the language.', effect: { coins: -480, squadMorale: 2, boardMood: -1, tag: 'mgr-p06-signed-on-data' } },
          { id: 'go', label: 'Fly out and watch him', desc: 'Two days, one game, his own eyes', outcome: 'He watches him for ninety minutes and does not like the way he walks back. The club saves a fortune and never finds out whether he was right.', effect: { coins: -40, prestige: 1 } },
          { id: 'loan', label: 'Take him on loan first', desc: 'Six months, an option, no commitment', outcome: 'The selling club charge for the privilege and put an option fee on it that rises monthly. It is expensive caution and it is still caution.', effect: { coins: -200, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-third-party', title: 'A Fund In The Deal', icon: '💼', category: 'transfer',
    when: { minSeason: 4, maxCoins: 220 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'An investment fund will pay half the fee for half the player’s future value. The lawyer says it is not permitted in this form and there is a form in which it is.',
        choices: [
          { id: 'take', label: 'Do the deal', desc: 'Half a player is better than none', outcome: 'The signing happens and the paperwork is elaborate. Every future decision about that player is made by somebody in another country.', effect: { coins: -180, squadMorale: 6, prestige: -2, tag: 'mgr-p06-third-party' } },
          { id: 'refuse', label: 'Have nothing to do with it', desc: 'The club owns its players', outcome: 'The player goes elsewhere and does well. The club is clean in a way nobody outside the building notices or rewards.', effect: { squadMorale: -4, prestige: 2 } },
          { id: 'report', label: 'Report the approach', desc: 'Tell the league it was offered', outcome: 'It goes nowhere. Two agents stop calling and one of them was useful, and there is no way of knowing whether it was worth it.', effect: { prestige: 1, boardMood: -2, tag: 'mgr-p06-reported-it' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-signing-fee', title: 'A Fee For Him', icon: '🤏', category: 'transfer',
    when: { minSeason: 3, minCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The agent would like a payment to himself, on top of the commission, to make the deal happen. He says it in a car park with the engine running.',
        choices: [
          { id: 'pay', label: 'Pay it through the club', desc: 'Declared, invoiced, above board', outcome: 'It is legal and it is in the accounts and it looks exactly like what it is. The deal completes and the number sits there for anyone to read.', effect: { coins: -220, squadMorale: 5, prestige: -1, tag: 'mgr-p06-paid-the-fee' } },
          { id: 'refuse', label: 'Say no and let the deal die', desc: 'Not that, not once', outcome: 'The player signs elsewhere within a week. The manager has a principle and a hole in midfield and the principle does not press.', effect: { squadMorale: -5, prestige: 2 } },
          { id: 'around', label: 'Go directly to the player', desc: 'Cut the man in the car park out', outcome: 'It works, barely, and it makes an enemy who represents fourteen professionals. That bill arrives over about four years.', effect: { coins: -160, squadMorale: 4, tag: 'mgr-p06-cut-him-out' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-sell-on-cheque', title: 'A Cheque From Nowhere', icon: '💌', category: 'transfer',
    when: { minSeason: 5, maxCoins: 300 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A boy sold six years ago for very little has moved for a great deal. The sell-on clause somebody insisted on at the time is now worth more than last summer’s entire budget.',
        choices: [
          { id: 'squad', label: 'Put it all in the squad', desc: 'Spend it while it is there', outcome: 'Three signings in a fortnight. The season is transformed and the money is gone and there will not be another cheque like it.', effect: { coins: -100, squadMorale: 12, boardMood: -1 } },
          { id: 'debt', label: 'Clear the debt with it', desc: 'Boring, and it fixes something real', outcome: 'The club owes nothing for the first time in eleven years. Nothing whatsoever happens on the pitch as a result and he knows that going in.', effect: { coins: 400, boardMood: 3, prestige: -1, clubLegacy: { kind: 'reputation', label: 'debt-free, once' } } },
          { id: 'academy', label: 'Put it into the academy', desc: 'The thing that produced the cheque', outcome: 'Pitches, coaches, a proper minibus. In eight years there is another cheque, and the manager who gets it will not know why.', effect: { coins: -80, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the academy that pays for itself' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-captain-january', title: 'The Captain Wants Out', icon: '🎖️', category: 'transfer',
    when: { needs: 'unhappy-player', minSeason: 3, minPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He knocks on the door in the second week of January. He does not want more money. He wants to play in a side that is going somewhere, and he says it kindly, which is worse.',
        choices: [
          { id: 'let-go', label: 'Let him go', desc: 'He has earned the right to ask', outcome: 'He is applauded off in his last game by three thousand people who understand. The armband goes to a man who is not ready for it.', effect: { coins: 380, squadMorale: -8, prestige: 2, tag: 'mgr-p06-captain-gone' } },
          { id: 'hold', label: 'Hold him to the contract', desc: 'Eighteen months left and no deal at any price', outcome: 'He stays and is professional to the last inch, which is somehow the most damning thing he could have been.', effect: { squadMorale: -4, playerMorale: { who: 'star', delta: -12 }, boardMood: 1 } },
          { id: 'convince', label: 'Show him the plan', desc: 'Where the club is going and who is coming', outcome: 'He believes about sixty per cent of it, which is enough. He signs an extension in May and the manager has to make the rest of it true.', effect: { playerMorale: { who: 'star', delta: 10 }, squadMorale: 6, tag: 'mgr-p06-sold-the-plan' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-released-boy', title: 'The One They Let Go', icon: '🔙', category: 'transfer',
    when: { minSeason: 4, maxCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A lad released at eighteen has spent two years in non-league growing four inches and learning how to head a ball. He is available and he has not forgotten the phone call.',
        choices: [
          { id: 'sign', label: 'Bring him back', desc: 'Admit the club got it wrong', outcome: 'He signs and says almost nothing for a month. Then he scores at the far post from a corner and points at the youth-team coach who released him.', effect: { coins: -60, squadMorale: 6, prestige: 1, tag: 'mgr-p06-brought-him-back' } },
          { id: 'apologise', label: 'Go and see him first', desc: 'Explain the decision before offering anything', outcome: 'It takes two hours and a very awkward cup of tea. He signs anyway, and the awkward tea is why he re-signs three years later.', effect: { coins: -70, squadMorale: 4, prestige: 2 } },
          { id: 'pass', label: 'Leave it', desc: 'The original judgement was probably right', outcome: 'He signs for a club in the division below and plays two hundred games. It was probably right and it will never feel like it.', effect: { boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-halve-the-wages', title: 'Half The Money', icon: '📝', category: 'transfer',
    when: { minSeason: 3, maxCoins: 200, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The renewal on the table is half of what he is on. He has three children in local schools and eleven years of service and he has already heard the number from somebody else.',
        choices: [
          { id: 'straight', label: 'Deliver it himself', desc: 'Face to face, no HR, no letter', outcome: 'It is a horrible forty minutes. He takes it, because of how it was done, and he tells the dressing room it was done properly.', effect: { coins: 140, playerMorale: { who: 'oldest', delta: -6 }, squadMorale: 4, prestige: 2 } },
          { id: 'fight', label: 'Fight the board for more', desc: 'Get the number up, take it from elsewhere', outcome: 'He gets it to two thirds by giving up a loan fee he had wanted. It is a good deed with a cost only he can see.', effect: { coins: -60, playerMorale: { who: 'oldest', delta: 10 }, boardMood: -2 } },
          { id: 'letter', label: 'Let the club send it', desc: 'It is a contractual matter', outcome: 'The letter arrives on a Tuesday. Eleven years end in an envelope and the dressing room talks about nothing else for a fortnight.', effect: { coins: 160, squadMorale: -10, prestige: -2, tag: 'mgr-p06-sent-the-letter' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-injured-signing', title: 'Paid For And Injured', icon: '🩼', category: 'transfer',
    when: { minSeason: 3, maxCoins: 250 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The record signing did his ankle in the second training session. The instalments are due in October, January and July regardless, and he will not play before March.',
        choices: [
          { id: 'protect', label: 'Wrap him up entirely', desc: 'No timelines, no press, no pressure', outcome: 'He is back in March and looks like a footballer by May. The manager spends six months answering the same question in eleven different ways.', effect: { squadMorale: 3, boardMood: -2, tag: 'mgr-p06-protected-him' } },
          { id: 'rush', label: 'Get him back for the run-in', desc: 'Three weeks early, strapped, on the bench', outcome: 'He plays forty minutes at Easter and does the same ankle. The second one takes longer than the first.', effect: { coins: -120, squadMorale: -6, boardMood: -1 } },
          { id: 'claim', label: 'Fight the selling club', desc: 'Argue the ankle was known about', outcome: 'The correspondence lasts eight months and settles for a small amount. Two clubs now find this club difficult to do business with.', effect: { coins: 120, prestige: -2, tag: 'mgr-p06-litigious' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-last-day-star', title: 'Twenty To Eleven', icon: '⏱️', category: 'transfer',
    when: { minSeason: 3, minCoins: 100, maxPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Twenty minutes left in the window and an offer for the best player that is roughly twice what he is worth. There is no time to replace him and everyone knows that, including the club making the offer.',
        choices: [
          { id: 'sell', label: 'Take it', desc: 'That much money changes the club', outcome: 'The squad is worse on Saturday and richer for three years. He is told at ten past eleven and does not shake anybody’s hand.', effect: { coins: 800, squadMorale: -12, playerMorale: { who: 'best', delta: -10 }, boardMood: 3, tag: 'mgr-p06-cashed-in' } },
          { id: 'keep', label: 'Turn it down', desc: 'The season is the season', outcome: 'The phone stops at eleven. The dressing room finds out on Thursday what was refused and plays like it for four months.', effect: { squadMorale: 14, boardMood: -3, prestige: 2, tag: 'mgr-p06-kept-him' } },
          { id: 'defer', label: 'Sell him in June, agreed today', desc: 'Take the money later, keep him now', outcome: 'They agree, at a lower number, and everybody spends the season knowing. He is excellent and slightly absent, all year.', effect: { coins: 560, squadMorale: -4, playerMorale: { who: 'best', delta: 4 } } },
        ],
      },
    },
  },

  {
    id: 'mgr-p06-loan-army', title: 'Nine Out On Loan', icon: '🗺️', category: 'transfer',
    when: { minSeason: 4, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nine players are out on loan at seven clubs. Two coaches are supposed to watch them all and neither has seen four of them since September.',
        choices: [
          { id: 'visit', label: 'Go and watch them himself', desc: 'A midweek game a fortnight, all season', outcome: 'He does twelve grounds in five months and misses two of his own analysis meetings. Six of the nine come back better and know he was there.', effect: { squadMorale: 6, prestige: 1, boardMood: -1, tag: 'mgr-p06-watched-the-loans' } },
          { id: 'cull', label: 'Cut the number to four', desc: 'Recall the rest, manage what he can see', outcome: 'Five of them come home to a bench and a gym. Two are sold in the summer at a loss because nobody had seen them play.', effect: { coins: -60, squadMorale: -5, boardMood: 1 } },
          { id: 'hire', label: 'Get a loan manager appointed', desc: 'One person whose whole job is the nine', outcome: 'It costs a salary the club claimed it did not have. The reports are excellent and dull and prevent two bad decisions in one year.', effect: { coins: -140, prestige: 1, tag: 'mgr-p06-loan-manager' } },
        ],
      },
    },
  },

  // ── MEDIA ────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p06-documentary', title: 'The Crew', icon: '🎥', category: 'media',
    when: { minSeason: 3, maxPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club has sold access for a series. The contract says the dressing room at half time. The director is twenty-nine and very good and has already been told twice to stand further back.',
        choices: [
          { id: 'full', label: 'Give them everything', desc: 'If it is happening, do it properly', outcome: 'Episode four contains ninety seconds of him at half time that make him look either magnificent or unhinged, depending entirely on the viewer.', effect: { coins: 260, prestige: 2, squadMorale: -6, tag: 'mgr-p06-doc-full-access' }, next: 'aired' },
          { id: 'limit', label: 'Fight for the dressing room', desc: 'Everywhere else, but not in there', outcome: 'The series is duller and the players are looser. The production company complain in writing and the club apologises on his behalf.', effect: { coins: 180, squadMorale: 5, boardMood: -2 }, next: 'aired' },
          { id: 'ban', label: 'Refuse to take part at all', desc: 'Let them film the stadium and the supporters', outcome: 'They make it anyway, without him, and the absence of the manager becomes the story of the series.', effect: { coins: 120, prestige: -2, boardMood: -2 }, next: 'aired' },
        ],
      },
      aired: {
        id: 'aired',
        prompt: 'It goes out in November. The first person to mention it is a player’s mother, and the second is a chairman of another club, at a funeral.',
        choices: [
          { id: 'own', label: 'Laugh about it publicly', desc: 'Get in front of it before anyone else does', outcome: 'It defuses most of it. The clip still exists and will still exist in twenty years and is played every time he is appointed anywhere.', effect: { prestige: 1, squadMorale: 4 } },
          { id: 'ignore', label: 'Never mention it again', desc: 'Not one word, to anybody', outcome: 'The silence is noted. The players quote it at each other for a year and stop the moment he walks in.', effect: { squadMorale: 2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-phone-in', title: 'The Phone-In', icon: '📻', category: 'media',
    when: { minSeason: 2, minPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The local radio phone-in ran for two hours after Saturday and one hundred per cent of it was about him. Somebody rang in and read out his substitutions in order, slowly.',
        choices: [
          { id: 'go-on', label: 'Go on the show', desc: 'Two hours, live, taking the calls himself', outcome: 'He is on for ninety minutes and answers eleven callers by name. Four of them apologise on air. It does not change a result.', effect: { prestige: 3, boardMood: -1, tag: 'mgr-p06-did-the-phone-in' } },
          { id: 'ignore', label: 'Never listen to it', desc: 'And tell the staff not to either', outcome: 'The instruction lasts nine days. Somebody has it on in the kit room and he hears his own name through a door.', effect: { squadMorale: -2 } },
          { id: 'dismiss', label: 'Dismiss it from the podium', desc: 'Call it what he thinks it is', outcome: 'The phrase "men in sheds" is used and is on the front of the paper by Tuesday. It is now a thing he said, permanently.', effect: { prestige: -2, boardMood: -1, squadMorale: 4, tag: 'mgr-p06-men-in-sheds' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-columnist', title: 'He Played Here', icon: '🖋️', category: 'media',
    when: { minSeason: 3, minPos: 0.55 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The column is by a man who made four hundred appearances for this club and has a stand-side seat for life. He has written that the side has no identity and he has written it well.',
        choices: [
          { id: 'invite', label: 'Invite him in', desc: 'A morning at the training ground, no cameras', outcome: 'He watches a session, asks four very good questions and writes a warmer piece. He also does not change his mind about the identity.', effect: { prestige: 2, tag: 'mgr-p06-let-him-in' } },
          { id: 'rebut', label: 'Answer it in the press conference', desc: 'Point by point, by name', outcome: 'It becomes a feud between a manager and a man the supporters love, and there is no version of that in which the manager wins.', effect: { prestige: -2, boardMood: -1, tag: 'mgr-p06-feud' } },
          { id: 'nothing', label: 'Say nothing', desc: 'He is entitled to his column', outcome: 'The column continues weekly and gets no worse and no better. Three players read it every week and one of them agrees with it.', effect: { squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-leaked-teamsheet', title: 'Out By Eleven', icon: '📋', category: 'media',
    when: { minSeason: 2, minPos: 0.4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The side is on a supporters forum at eleven on Friday morning and it is correct. All eleven, in shape, including the change nobody outside four people knew about.',
        choices: [
          { id: 'change', label: 'Change the side', desc: 'Make the leak worthless, cost the preparation', outcome: 'Two men who prepared all week do not play. The leak is neutralised and so, roughly, is the performance.', effect: { squadMorale: -6, tag: 'mgr-p06-changed-for-the-leak' } },
          { id: 'hunt', label: 'Find the source', desc: 'Narrow it, quietly, over a fortnight', outcome: 'It is a member of staff’s brother-in-law and a bit of showing off. It is dealt with and the building is colder for two months.', effect: { squadMorale: -4, prestige: 1, tag: 'mgr-p06-found-the-leak' } },
          { id: 'later', label: 'Stop naming the side until Saturday', desc: 'Nobody knows until an hour before', outcome: 'It works and it makes preparation harder for everybody, including the analysts and the man doing the warm-up.', effect: { squadMorale: -2, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-press-officer-quit', title: 'Nobody In The Chair', icon: '🎙️', category: 'media',
    when: { minSeason: 3, minPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The press officer resigned on Wednesday over something that was not her fault. On Friday the chair beside him at the press conference is empty and there are nine reporters in the room.',
        choices: [
          { id: 'alone', label: 'Do it on his own', desc: 'No help, no cut-off, no time limit', outcome: 'It runs to thirty-five minutes and he answers everything. Two of the answers are considerably better than the club would have allowed.', effect: { prestige: 2, boardMood: -2, tag: 'mgr-p06-unmanaged' } },
          { id: 'cancel', label: 'Cancel the media until it is filled', desc: 'Written statements only', outcome: 'The league fine the club twice. The reporting gets noticeably less generous and nobody can prove the two things are connected.', effect: { coins: -80, prestige: -2 } },
          { id: 'promote', label: 'Put the young one in the chair', desc: 'Twenty-three, one month in the job', outcome: 'She is terrified and then rather good. She stops him saying two things he was going to say and one of them would have cost him his job.', effect: { prestige: 1, squadMorale: 2, tag: 'mgr-p06-new-press-officer' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-mangled-quote', title: 'Lost In Translation', icon: '🗣️', category: 'media',
    when: { minSeason: 3, minTier: 1, maxTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He did an interview in his second language after a European tie. The word he used means "limited" at home and something much closer to "useless" where it was printed, and the player has seen it.',
        choices: [
          { id: 'private', label: 'Sort it with the player first', desc: 'Before a single word is said publicly', outcome: 'They talk it through in twenty minutes and the player is fine. The story runs for another four days and neither of them mentions it again.', effect: { playerMorale: { who: 'star', delta: 8 }, squadMorale: 4 } },
          { id: 'correct', label: 'Issue a correction', desc: 'A statement, with the actual word in it', outcome: 'It is the sort of statement that keeps a story alive for a week. The correction is accurate and completely ineffective.', effect: { prestige: -1, boardMood: -1 } },
          { id: 'never-again', label: 'Never do it in that language again', desc: 'Interpreter, always, from now on', outcome: 'The answers become shorter and safer and duller. Something that made him likeable abroad quietly stops happening.', effect: { prestige: -2, tag: 'mgr-p06-interpreter-only' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-clause-in-print', title: 'The Number In The Paper', icon: '📰', category: 'media',
    when: { needs: 'wonderkid', minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A national has the release clause. Not approximately — the exact figure, to the thousand, which means somebody has read the contract.',
        choices: [
          { id: 'deny', label: 'Deny there is one', desc: 'Flatly, and hope it holds', outcome: 'It holds for nine days. When it does not, he is a manager who denied something that was true, and that is the part that lasts.', effect: { prestige: -3, tag: 'mgr-p06-denied-it' } },
          { id: 'confirm', label: 'Confirm it and set the price talk', desc: 'Yes, and here is what it would take', outcome: 'The number becomes the boy’s valuation everywhere. Two clubs are put off by it and one is not.', effect: { boardMood: -1, playerMorale: { who: 'youngest', delta: -6 }, tag: 'mgr-p06-clause-public' } },
          { id: 'protect', label: 'Talk only about the player', desc: 'Refuse the number, talk about the footballer', outcome: 'He does eleven minutes on the boy’s left foot and takes no questions on money. It is a masterclass and it delays the inevitable by a fortnight.', effect: { playerMorale: { who: 'youngest', delta: 8 }, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-podcast-source', title: 'Somebody Is Talking To The Podcast', icon: '🎧', category: 'media',
    when: { minSeason: 3, minPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The supporters podcast knows what was said in the Monday meeting. Not the gist — the phrasing. Forty thousand people download it on a Wednesday.',
        choices: [
          { id: 'address', label: 'Address it with the squad', desc: 'Everyone in the room, once, no accusations', outcome: 'He says it plainly and sits down. Nothing leaks for eleven weeks and then something does, in the same voice.', effect: { squadMorale: -4, tag: 'mgr-p06-addressed-the-leak' } },
          { id: 'use', label: 'Use it', desc: 'Say things in meetings meant to travel', outcome: 'It is a strange, cynical piece of management and it works twice. The third time it is obvious and everybody feels slightly worse.', effect: { prestige: -1, squadMorale: -2, tag: 'mgr-p06-fed-the-podcast' } },
          { id: 'meet', label: 'Go on the podcast', desc: 'An hour, unedited, with the two of them', outcome: 'It is the best interview he has ever done and the club’s press department are furious about the platform rather than the content.', effect: { prestige: 3, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-photographer', title: 'The Man At The Fence', icon: '📷', category: 'media',
    when: { minSeason: 2, minPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody is photographing training through a gap in the hedge with a long lens. He is on a public footpath and he is entirely within his rights.',
        choices: [
          { id: 'screen', label: 'Put up screens', desc: 'Six thousand pounds of green plastic', outcome: 'The photographs stop and the screens become the story. A drone appears within a month, which nobody had budgeted for.', effect: { coins: -70, prestige: -1 } },
          { id: 'move', label: 'Train somewhere else', desc: 'The far pitches, out of sight', outcome: 'The far pitches are worse and it costs them a fortnight of proper work. The photographer walks a bit further and finds another gap.', effect: { squadMorale: -3 } },
          { id: 'invite', label: 'Invite him in', desc: 'Front of the queue, and rules', outcome: 'He takes better pictures, publishes fewer of them, and rings the club first when he has something. It is a very cheap solution.', effect: { prestige: 2, tag: 'mgr-p06-tamed-the-lens' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-old-quote', title: 'Nine Years Ago', icon: '🗞️', category: 'media',
    when: { minSeason: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Something he said about this club nine years ago, when he was somewhere else and much younger, has been found and screenshotted. It is not defensible and it was a joke at the time.',
        choices: [
          { id: 'apologise', label: 'Apologise properly', desc: 'No context, no explanation, just sorry', outcome: 'It ends the story in three days. Two supporters groups accept it and one does not, and the one that does not is loud for a year.', effect: { prestige: 1, boardMood: 1, tag: 'mgr-p06-apologised' } },
          { id: 'context', label: 'Explain the context', desc: 'What was happening, and who he was then', outcome: 'It is all true and it reads like excuses. The story runs for nine days instead of three.', effect: { prestige: -2 } },
          { id: 'ignore', label: 'Ignore it entirely', desc: 'It is nine years old', outcome: 'It dies on its own by Thursday. It reappears, without fail, every time the club loses three in a row for the rest of his time here.', effect: { boardMood: -1, tag: 'mgr-p06-old-quote-live' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-rival-dig', title: 'A Line About Him', icon: '😐', category: 'media',
    when: { minSeason: 2, maxPos: 0.6 }, weight: 3, temper: ['disciplinarian', 'chancer', 'firefighter'], first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The manager of the club above them has been asked about the fixture and has answered with a sentence about budgets that is technically a compliment.',
        choices: [
          { id: 'return', label: 'Give it back with interest', desc: 'On the record, better than his', outcome: 'It is a good line and it is everywhere by teatime. It also guarantees that the next fixture is played by two sides who have read it.', effect: { prestige: 2, squadMorale: 6, boardMood: -1, tag: 'mgr-p06-started-something' } },
          { id: 'agree', label: 'Agree with him publicly', desc: 'Yes, their budget is bigger. Print it', outcome: 'It removes every bit of air from the story and it is impossible to argue with. It also sounds, faintly, like an excuse in advance.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'inside', label: 'Say nothing and use it inside', desc: 'Print it out, pin it up, no comment', outcome: 'The sheet is on the wall by Thursday. Nobody mentions it and everybody has read it, which is the whole idea.', effect: { squadMorale: 10, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-touchline-row', title: 'On Camera', icon: '📺', category: 'media',
    when: { minSeason: 2, minPos: 0.55 }, weight: 3, temper: ['disciplinarian', 'firefighter', 'chancer'], first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eleven seconds of him and the opposition bench, with the audio, on every highlights package by nine o’clock. The words are legible even without sound.',
        choices: [
          { id: 'apologise', label: 'Apologise to everybody', desc: 'The official, the other bench, the club', outcome: 'It is accepted quickly and generously. The clip is still played every time the two clubs meet, for years.', effect: { prestige: -1, boardMood: 2, tag: 'mgr-p06-said-sorry' } },
          { id: 'defend', label: 'Stand by it', desc: 'Explain what was said to his player first', outcome: 'It splits the room in half. Half the game thinks he is right and the half with the votes thinks he is a problem.', effect: { squadMorale: 10, prestige: 1, boardMood: -3 } },
          { id: 'joke', label: 'Make a joke of it', desc: 'Take the heat out with a laugh', outcome: 'It works on the night and looks flippant by the Monday, when the charge letter arrives and the joke is quoted in it.', effect: { coins: -70, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-hospital-visit', title: 'The Visit In A Bad Week', icon: '🏥', category: 'media',
    when: { minSeason: 2, minPos: 0.7 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The children’s ward visit was booked in August. It falls on the Thursday after a fourth defeat and there will be cameras, because that is how these things are funded.',
        choices: [
          { id: 'go-all', label: 'Take the whole squad', desc: 'Everybody, no exceptions, two hours', outcome: 'Two players are visibly wrecked by it and better for it. The pictures look like a club trying to distract from results and are not.', effect: { squadMorale: 8, prestige: 1 } },
          { id: 'go-alone', label: 'Go himself, no cameras', desc: 'Quietly, and ask the club not to publicise it', outcome: 'It is reported anyway, by a parent, in a way that is much better than any press release. He is genuinely annoyed about it.', effect: { prestige: 3, boardMood: -1, tag: 'mgr-p06-went-quietly' } },
          { id: 'postpone', label: 'Move it to a better week', desc: 'The football has to come first', outcome: 'It is rearranged for March and the ward understands completely, which is somehow the worst possible response.', effect: { squadMorale: -4, prestige: -2, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-exclusive-trade', title: 'A Trade', icon: '🤐', category: 'media',
    when: { minSeason: 3, minPos: 0.5 }, weight: 3, temper: ['chancer', 'tactician', 'players-manager'], first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A reporter has something about a player’s private life that he is not going to run. He mentions this while asking, separately, for a sit-down interview in the international break.',
        choices: [
          { id: 'deal', label: 'Give him the interview', desc: 'Understand the arrangement, never name it', outcome: 'The interview is fine. The arrangement now exists and can be drawn on again, by him, whenever he chooses.', effect: { prestige: 1, tag: 'mgr-p06-owes-a-favour' } },
          { id: 'refuse', label: 'Refuse and warn the player', desc: 'No deal, and tell him what is out there', outcome: 'The story runs in three weeks. The player was ready for it, which mattered more than whether it appeared.', effect: { playerMorale: { who: 'star', delta: 10 }, prestige: 2, squadMorale: 4 } },
          { id: 'report', label: 'Take it to the club’s lawyers', desc: 'Put it on a formal footing', outcome: 'Letters are exchanged and nothing is published. That reporter never asks him another question that is not hostile.', effect: { coins: -60, prestige: -1, tag: 'mgr-p06-lawyered-up' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-players-post', title: 'Posted At Two In The Morning', icon: '📱', category: 'media',
    when: { needs: 'wonderkid', minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The nineteen-year-old has posted something about the substitution. It is up for forty minutes, deleted at half past two, and screenshotted by four thousand people.',
        choices: [
          { id: 'fine', label: 'Fine him and say so', desc: 'Two weeks wages, publicly confirmed', outcome: 'The squad understands the line. The boy understands it too, and he understands it as the club choosing the story over him.', effect: { coins: 40, squadMorale: 4, playerMorale: { who: 'youngest', delta: -12 }, tag: 'mgr-p06-fined-the-kid' } },
          { id: 'protect', label: 'Take the blame himself', desc: 'Say the substitution was wrong', outcome: 'It is not true and everybody knows it is not true. The boy plays like a man in debt for two months.', effect: { playerMorale: { who: 'youngest', delta: 14 }, prestige: -2, squadMorale: 6 } },
          { id: 'teach', label: 'Make him do the press himself', desc: 'Sit him in front of them on Friday', outcome: 'It is eleven of the longest minutes of his life. He is never careless with a phone again and neither is anyone who watched it.', effect: { playerMorale: { who: 'youngest', delta: -4 }, squadMorale: 5, prestige: 2, tag: 'mgr-p06-taught-him' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-boycott-paper', title: 'Not Speaking To Them', icon: '🚷', category: 'media',
    when: { minSeason: 3, minPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The local paper has run a back page with his face and a countdown clock on it. The reporter who wrote it has been coming to this training ground for nineteen years and did not choose the headline.',
        choices: [
          { id: 'ban', label: 'Ban the paper', desc: 'No access, no interviews, indefinitely', outcome: 'The coverage becomes hostile in a way it was not before. The reporter who did not choose the headline is the one who suffers.', effect: { prestige: -2, boardMood: -1, tag: 'mgr-p06-banned-the-paper' } },
          { id: 'reporter', label: 'Deal with the reporter, not the paper', desc: 'Tell him it was not personal and carry on', outcome: 'He is quietly grateful and remains professional. The desk that wrote the headline learns nothing at all.', effect: { prestige: 1 } },
          { id: 'editor', label: 'Go and see the editor', desc: 'Unannounced, at their office', outcome: 'It is a civil half hour and the countdown clock does not return. He has spent something to get that, and he is not sure what.', effect: { prestige: 2, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-miked-up', title: 'A Microphone On The Bench', icon: '🎤', category: 'media',
    when: { minSeason: 3, maxPos: 0.5, minTier: 1, maxTier: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The broadcaster wants him wired for the Sunday game. It pays the club and there is no delay, only an editor in a truck who has been described as reasonable.',
        choices: [
          { id: 'yes', label: 'Wear it', desc: 'Take the money, be himself', outcome: 'He forgets it exists by the twentieth minute, which is exactly what they were paying for. Ninety seconds of it are replayed for a decade.', effect: { coins: 200, prestige: 2, boardMood: 1, tag: 'mgr-p06-miked-up' } },
          { id: 'no', label: 'Refuse', desc: 'The bench is not a studio', outcome: 'The club loses the fee and the broadcaster picks a different manager, whose ninety seconds are on every montage that season.', effect: { boardMood: -2, prestige: -1 } },
          { id: 'staff', label: 'Put it on the assistant', desc: 'Somebody with a better temperament', outcome: 'The assistant is calm, articulate and unexpectedly funny. Two clubs ring about him before Christmas.', effect: { coins: 200, prestige: -1, tag: 'mgr-p06-assistant-on-telly' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-autobiography', title: 'Chapter Eleven', icon: '📖', category: 'media',
    when: { minSeason: 5 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A player he released four years ago has written a book. There is a chapter about this club with his name in it eleven times and a description of a conversation he remembers differently.',
        choices: [
          { id: 'silent', label: 'Say nothing at all', desc: 'Not one line, not to anybody', outcome: 'The book sells for a fortnight and disappears. His version is the only version on the record, permanently, because he never contested it.', effect: { prestige: -1, tag: 'mgr-p06-uncontested' } },
          { id: 'answer', label: 'Give his account', desc: 'What was actually said, and why', outcome: 'It is fair and detailed and it puts the book back on the front of the sports pages for another week.', effect: { prestige: 1, boardMood: -1 } },
          { id: 'ring', label: 'Ring the player', desc: 'Not the publisher, not the press. Him', outcome: 'They talk for an hour and neither changes his mind. The paperback has a slightly softer version of the chapter in it.', effect: { prestige: 2, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-boring-charge', title: 'The Word Boring', icon: '💤', category: 'media',
    when: { minSeason: 3, maxPos: 0.4 }, weight: 3, temper: ['tactician', 'disciplinarian', 'builder'], first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Fourth in the table and a pundit has spent four minutes on a Sunday programme explaining why watching them is a chore. He is not entirely wrong and the clips he used were well chosen.',
        choices: [
          { id: 'points', label: 'Point at the table', desc: 'Fourth. Next question', outcome: 'It is unanswerable and it makes him sound exactly like the man in the clips. The supporters, quietly, half agree with the pundit.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'change', label: 'Change how they play', desc: 'Open it up, take the risk', outcome: 'They are considerably better to watch and they take four points from five games. He changes it back in November and says nothing.', effect: { squadMorale: 5, boardMood: -2, tag: 'mgr-p06-opened-up' } },
          { id: 'lean', label: 'Lean into it', desc: 'Make dullness the club’s identity', outcome: 'It becomes a joke the supporters own. Somebody makes a flag out of it and it is a genuinely funny flag.', effect: { squadMorale: 6, prestige: 2, clubLegacy: { kind: 'reputation', label: 'hard to beat and hard to watch' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p06-club-statement', title: 'Written For Him', icon: '📃', category: 'media',
    when: { minSeason: 3, minPos: 0.65 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A statement attributed to him lands in his inbox at ten past four with a request to approve it by half past. He did not write a word of it and it uses the phrase "moving forward".',
        choices: [
          { id: 'approve', label: 'Approve it', desc: 'It is broadly what he thinks', outcome: 'It goes out under his name and reads like nothing he has ever said out loud. Two players ask him about it and he cannot quote it back.', effect: { boardMood: 2, prestige: -2, tag: 'mgr-p06-signed-off-the-copy' } },
          { id: 'rewrite', label: 'Rewrite it himself', desc: 'Four sentences, his words, sent at 4.29', outcome: 'It is shorter, blunter, and quoted in full everywhere. The communications department are not asked their view and do not offer it.', effect: { prestige: 2, boardMood: -1 } },
          { id: 'refuse', label: 'Refuse to have his name on it', desc: 'Let the club say it as the club', outcome: 'It goes out unattributed and reads as evasive, which it is. He is asked about it eleven times on Friday and answers honestly each time.', effect: { boardMood: -2, prestige: 1 } },
        ],
      },
    },
  },
];
