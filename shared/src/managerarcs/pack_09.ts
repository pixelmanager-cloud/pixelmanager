// Manager-arc authoring pack 09. ONE author owns this file — nobody else writes to it.
// See shared/src/managerarc.ts for the ManagerArc shape, the situation gates and the effect vocabulary.
//
// This pack is mostly about winning, which is the hardest thing to write, because a victory lap is not a
// decision. So every triumph here has a bill attached: the lad who does not get a medal, the stand that
// sells out and prices somebody out, the number that somebody wants back now that it is worth something,
// the promotion that arrives with a wage clause in every contract. Triumph arcs gate on maxPos 0.4 or
// tighter — nothing in here fires from mid-table.
import type { ManagerArc } from '../managerarc.js';

export const MGR_ARCS_09: ManagerArc[] = [
  // ── TRIUMPH ──────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p09-number-back', title: 'He Wants It Back', icon: '🔟', category: 'triumph',
    when: { minSeason: 3, maxPos: 0.3 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two years ago he was out of the side and gave up the ten without being asked, which everybody thought was good of him. He has just had the season of his life in a squad number nobody can remember. His agent puts it in an email under a heading about something else.',
        choices: [
          { id: 'give', label: 'Give it back to him', desc: 'He earned it twice over', outcome: 'The lad currently wearing it is twenty-two and says it is not a problem. He is a fortnight out of the side by Easter and it is not because of a shirt, and he will always half believe it was.', effect: { playerMorale: { who: 'best', delta: 14 }, squadMorale: -3, coins: -40 } },
          { id: 'refuse', label: 'It stays where it is', desc: 'You do not take a number off a man in possession', outcome: 'He accepts it in about four seconds, which is how he accepts everything. The agent rings the chief executive instead and the chief executive rings the manager.', effect: { playerMorale: { who: 'best', delta: -9 }, boardMood: -1, prestige: 1 } },
          { id: 'retire', label: 'Neither of them has it next year', desc: 'Put it away for the man who wore it in the sixties', outcome: 'It makes the local paper and a family write in. It also solves nothing at all for two footballers who both wanted the same thing on their back.', effect: { squadMorale: -2, prestige: 2, clubLegacy: { kind: 'number', label: 'the ten is not issued here' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-no-cabinet', title: 'Nowhere To Put It', icon: '🏆', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.25, minTier: 3 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The cup is in the boot room on a chair. The club has a cabinet, in the corridor by the ticket office, and it holds a shield from 1953 and eleven photographs. The new thing does not fit through the door of it.',
        choices: [
          { id: 'build', label: 'Have a proper case made', desc: 'Glass, lit, in the foyer where people come in', outcome: 'It costs more than anybody expected because of the lighting. Two supporters who paid in at the turnstile every week for thirty years think out loud about what else that money might have done.', effect: { coins: -120, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the case in the foyer' } } },
          { id: 'chair', label: 'Leave it on the chair', desc: 'It is a football club, not a museum', outcome: 'It is on that chair for four years. Every new signing is photographed next to it on his first morning and nobody ever plans that.', effect: { squadMorale: 6, prestige: -1 } },
          { id: 'tour', label: 'Send it round the schools instead', desc: 'It can live in a van', outcome: 'Eleven schools in a fortnight and a dent in the base that the engraver cannot do anything about. The board are pleased. The kitman, who has cleaned it every Friday, is not.', effect: { squadMorale: 3, boardMood: 2, coins: -30 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-theirs-applaud', title: 'Applauded By Theirs', icon: '👏', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four-one at their place and their own supporters are still in, on their feet, clapping our lot off. It is generous and it is also a message to the men in their dugout, who have to walk down the same tunnel.',
        choices: [
          { id: 'acknowledge', label: 'Send the players over to them', desc: 'Applaud it back, all the way round', outcome: 'It looks magnificent on the highlights. Their manager is gone within a month and there are people in that town who half blame a football team for waving.', effect: { prestige: 3, squadMorale: 5, tag: 'mgr-took-the-applause' } },
          { id: 'quiet', label: 'Straight down the tunnel', desc: 'Take nothing that is not ours', outcome: 'One of the young lads gets it wrong and goes over on his own, and stands there for a bit, and comes back. Nobody says anything to him about it.', effect: { prestige: 1, squadMorale: -2 } },
          { id: 'say', label: 'Mention it in the press room', desc: 'Thank them properly, by name of the stand', outcome: 'It reads warmly everywhere except in the one place it was meant. Their supporters\' group put out a statement clarifying that it was not for us.', effect: { prestige: 2, boardMood: 1, tag: 'mgr-said-it-out-loud' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-promotion-clauses', title: 'Every Contract Has A Clause', icon: '📈', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.12, minTier: 2 }, weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They went up on the Saturday. On the Monday the finance director puts a single sheet on the desk: twenty-three automatic uplifts, all triggered at once, and a wage bill that is now larger than the one belonging to the club that finished above them last year.',
        choices: [
          { id: 'honour', label: 'Pay all of it', desc: 'They signed it, they earned it, it is not a negotiation', outcome: 'Nobody in the dressing room finds out how close it was, which is the point. There is no money for a striker and everyone spends August talking about that instead.', effect: { coins: -420, squadMorale: 8, boardMood: -2 } },
          { id: 'renegotiate', label: 'Go round the room and ask them to spread it', desc: 'Same money, over three years, for a squad that stays together', outcome: 'Eighteen say yes on the spot. Five do not, and four of those five are in the best eleven, and the room now knows exactly who they were.', effect: { coins: -180, squadMorale: -6, prestige: 1, tag: 'mgr-spread-the-uplifts' } },
          { id: 'sell', label: 'Sell one of them to pay for the rest', desc: 'Somebody funds this and it will not be the board', outcome: 'The offer that comes in is decent and the player is grateful, and the supporters spend the whole summer explaining to each other why a promoted club has sold its best midfielder.', effect: { coins: 340, squadMorale: -9, boardMood: 2, clubLegacy: { kind: 'reputation', label: 'they always sell one after a good year' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-new-sheet', title: 'The New Sheet', icon: '📋', category: 'triumph',
    when: { minSeason: 3, maxPos: 0.2 }, weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The objectives for last season said mid-table and consolidation. The new ones, typed in the same font, on the same headed paper, say top six. Nothing else about the club has changed. The budget is the same to the pound.',
        choices: [
          { id: 'sign', label: 'Sign it', desc: 'Do not start a war over a piece of paper', outcome: 'It sits in a drawer until February, when they are ninth and it comes out of the drawer in a meeting he is not chairing.', effect: { boardMood: 2, prestige: -1, tag: 'mgr-signed-the-target' } },
          { id: 'push', label: 'Ask what has changed', desc: 'In the room, politely, and wait for an answer', outcome: 'The answer is that last season happened. He points out that last season was the best in twenty years and cannot be the new floor. Two directors agree with him and neither says so out loud.', effect: { boardMood: -2, prestige: 2 } },
          { id: 'trade', label: 'Accept it, and ask for the money that goes with it', desc: 'Top six needs two players and a physio', outcome: 'He gets one player and half a physio. The target stays exactly where it was, which he expected, and the wording is now his as well as theirs.', effect: { coins: 200, boardMood: -1, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-peaked-november', title: 'They Were Best In November', icon: '🍂', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.3 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Fourth, which is remarkable, and every man in that dressing room played his best football before Christmas. The running numbers have been sliding since January in a straight line you could draw with a ruler. Nobody outside the building has noticed yet.',
        choices: [
          { id: 'rest', label: 'Take the running out of the week', desc: 'Two days off, no doubles, ride it home', outcome: 'They are fresher and slower to press and they draw four in a row. It is enough. It is also visibly not the same side, and the supporters can see it even if they cannot name it.', effect: { squadMorale: 7, boardMood: -1 } },
          { id: 'push', label: 'Push through it', desc: 'There are nine games and then four months off', outcome: 'They get to May on empty and finish above where anyone thought. Three of them start pre-season in the treatment room and one is still there in September.', effect: { squadMorale: -5, prestige: 2, coins: -70, tag: 'mgr-emptied-the-tank' } },
          { id: 'rotate', label: 'Play the ones who have not played', desc: 'Six changes and mean it', outcome: 'The fringe men are electric for forty minutes and then it is a different game. Two results go and the six of them have at least stopped looking at him like that.', effect: { squadMorale: 4, prestige: -2, playerMorale: { who: 'unhappiest', delta: 12 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-got-them-there', title: 'The Man Who Got Them There', icon: '🎟️', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.15 }, weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He scored in the semi-final and in the round before that and he is not good enough for this one. That is the plain truth of it and the manager has known it for eleven days and has not said it to anybody, including the player, including his own assistant.',
        choices: [
          { id: 'tell-early', label: 'Tell him on the Wednesday', desc: 'Three days to sit with it, in his own house', outcome: 'He trains well. He is impeccable in the hotel and impeccable on the bench and he does not speak to the manager again in nine months of Tuesdays.', effect: { playerMorale: { who: 'star', delta: -18 }, squadMorale: 3, prestige: 1 }, next: 'after' },
          { id: 'tell-late', label: 'Let him find out with the team sheet', desc: 'Keep the week normal for everybody', outcome: 'The room goes quiet at the point where his name is not read out. Two senior men look at the floor. It is not the atmosphere anybody wanted an hour before the biggest game the club has had.', effect: { playerMorale: { who: 'star', delta: -22 }, squadMorale: -7 }, next: 'after' },
          { id: 'pick-him', label: 'Play him anyway', desc: 'You do not drop a man for the day he built', outcome: 'He is off after fifty-eight minutes having done nothing wrong except be exactly what he is. He knows the substitution better than anyone in the ground.', effect: { playerMorale: { who: 'star', delta: 6 }, prestige: -2, boardMood: -1 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'They win it. On the pitch afterwards there is a photographer who wants the eleven and a man in a tracksuit standing slightly outside the group.',
        choices: [
          { id: 'pull', label: 'Pull him into the middle of it', desc: 'By the arm, before the shutter goes', outcome: 'It is the photograph that ends up framed in the corridor. He has told people since that it was the worst four seconds of his career and the best thing anyone has done for him.', effect: { squadMorale: 8, playerMorale: { who: 'star', delta: 12 } } },
          { id: 'leave', label: 'Leave him to have it his own way', desc: 'Not everybody wants a hand on the shoulder', outcome: 'He stands there for a while and then joins in from the edge. In the pictures he is always half behind somebody.', effect: { squadMorale: 2, playerMorale: { who: 'star', delta: -5 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-cup-tied', title: 'Cup-Tied', icon: '🚫', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.25, needs: 'wonderkid' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He played in the first round, the second round and the quarter-final while he was on loan at a club three divisions down, before anybody here knew what he was. He has been the best player in every round since he came back. He cannot be named on Saturday and the competition has been very clear about it.',
        choices: [
          { id: 'travel', label: 'Take him with the squad anyway', desc: 'Suit, coach, hotel, everything but the sheet', outcome: 'He carries the water and does it properly. Somebody photographs him in the tunnel in a club suit and the caption underneath it is unkind about the rules and about him.', effect: { playerMorale: { who: 'youngest', delta: 8 }, squadMorale: 4 } },
          { id: 'appeal', label: 'Appeal it, all week, loudly', desc: 'Letters, phone calls, the press room', outcome: 'It fails, as everyone said it would, and the week before the biggest game of the season has been about paperwork. The lad is grateful and slightly embarrassed by all of it.', effect: { prestige: -1, playerMorale: { who: 'youngest', delta: 12 }, boardMood: -1, coins: -40 } },
          { id: 'rest', label: 'Give him the weekend off', desc: 'Send him home to watch it with his family', outcome: 'He watches it in his mother\'s front room and is on his feet with everybody else. He is also nowhere in a single photograph of the day and always will be.', effect: { playerMorale: { who: 'youngest', delta: -10 }, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-grading-officer', title: 'The Grading Officer', icon: '📏', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.12, minTier: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Promotion was the easy part. A man with a clipboard walks the ground on a wet Tuesday and produces a list: the away turnstiles, the floodlight lux, a medical room that is a converted store, and a stand that holds fewer people than the certificate says it does.',
        choices: [
          { id: 'spend', label: 'Do the lot before August', desc: 'Every item, signed off, no arguments', outcome: 'It swallows the transfer budget entirely. The squad that went up goes up unchanged, which is romantic in July and a problem by October.', effect: { coins: -500, boardMood: 1, prestige: 1, tag: 'mgr-fixed-the-ground' } },
          { id: 'minimum', label: 'Do the minimum and ask for a derogation', desc: 'Lights and turnstiles, argue about the rest', outcome: 'They get a season\'s grace on the stand and spend the whole of it with a thousand seats taped off. The money buys a centre-forward who is worth it.', effect: { coins: -180, boardMood: -1, squadMorale: 5 } },
          { id: 'groundshare', label: 'Play somewhere else for a year', desc: 'Ten miles down the road while the work is done', outcome: 'The football is fine. The crowd is two thirds of what it was and one of the supporters\' clubs folds during the season and does not come back.', effect: { coins: 120, prestige: -3, clubLegacy: { kind: 'reputation', label: 'the year they played away from home' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-forty-years-in-that-seat', title: 'Forty Years In That Seat', icon: '💺', category: 'triumph',
    when: { minSeason: 3, maxPos: 0.2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The main stand has sold out for every home game since November, for the first time since anybody can date. Commercial have modelled a price rise and it is a big number. There is a letter on the desk from a man who has had the same seat since the year the roof went on.',
        choices: [
          { id: 'raise', label: 'Let them put the prices up', desc: 'The money is real and the squad needs it', outcome: 'Renewals hold at ninety-one per cent, which everyone calls a success. The nine per cent includes several families who had four seats together and now have none.', effect: { coins: 300, prestige: -2, boardMood: 2, tag: 'mgr-backed-the-rise' } },
          { id: 'freeze', label: 'Argue for a freeze', desc: 'Not in the season they finally came back', outcome: 'He wins it and it is the last thing he wins in that room for a while. Every subsequent request has that decision quoted back at it.', effect: { boardMood: -3, prestige: 3, tag: 'mgr-froze-the-prices' } },
          { id: 'protect', label: 'Raise it, but ring-fence the long-standing ones', desc: 'Twenty years in a seat, you keep your price', outcome: 'It is administratively horrible and it works. There are people paying two different prices in the same row and one or two of them find out.', effect: { coins: 140, prestige: 1, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the old price for the old seats' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-three-not-ours', title: 'Three Of Them Are Not Ours', icon: '🔁', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.15, minTier: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The spine of the side that went up is a centre-half, a midfielder and a winger, and all three belong to somebody else until the last day of June. Two of the parent clubs have already said no to a permanent. One has not said anything at all, which is worse.',
        choices: [
          { id: 'chase', label: 'Spend the summer chasing all three', desc: 'Every phone call, every fee, whatever it takes', outcome: 'He gets one, at a price that everybody agrees is silly. He also spends July doing that instead of finding the two players he actually needed.', effect: { coins: -380, squadMorale: 5, boardMood: -2 } },
          { id: 'replace', label: 'Let them all go and rebuild', desc: 'Start again with money and a plan', outcome: 'It is the correct decision and it is joyless. The supporters spend August comparing every new man to somebody who was only ever borrowed.', effect: { coins: -140, squadMorale: -6, prestige: 1, tag: 'mgr-rebuilt-after-promotion' } },
          { id: 'reloan', label: 'Take them all again on loan', desc: 'Same three, one more year, kick it down the road', outcome: 'Two say yes and it works and the club is exactly where it was twelve months on, with the same conversation and less money.', effect: { coins: -200, squadMorale: 7, boardMood: -1, clubLegacy: { kind: 'reputation', label: 'a club built on other people\'s players' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-chip-shop', title: 'The Place On The A-Road', icon: '🍟', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.25 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The coach stopped at a chip shop on a dual carriageway in October because the traffic was bad, and they won that night, and they have stopped there before every away game since. It adds forty minutes. The sports science department has raised it twice, in writing.',
        choices: [
          { id: 'keep', label: 'Keep stopping', desc: 'They believe in it and belief is not free', outcome: 'It is in a national paper by March and the owner puts a framed shirt above the fryer. The nutritionist stops attending the away trips and nobody notices for a month.', effect: { squadMorale: 9, prestige: -1, clubLegacy: { kind: 'tradition', label: 'the chip shop stop' } } },
          { id: 'end', label: 'End it after the next away win', desc: 'Finish it on a high, on his terms', outcome: 'They lose the game after and two of them say the word out loud in the dressing room. It is a joke. It is not entirely a joke.', effect: { squadMorale: -6, prestige: 1 } },
          { id: 'move', label: 'Move it to the coach', desc: 'Same food, on board, no stop', outcome: 'The chips arrive lukewarm in a foil tray and the whole thing quietly dies within three weeks. Nobody blames him and everybody knows.', effect: { squadMorale: -3, coins: -20 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-agent-who-never-rang', title: 'The Agent Who Never Rang', icon: '📞', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.25, needs: 'wonderkid' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'For two years the boy\'s calls went to a junior at the agency. Since February the man whose name is on the door has rung the manager four times, been to two games, and sent a Christmas hamper in April.',
        choices: [
          { id: 'engage', label: 'Take the calls and use them', desc: 'A man like that knows what the market is', outcome: 'He learns more about his own player\'s value in one lunch than in two years of internal meetings. He also gives a very capable man a way in that he did not have before.', effect: { prestige: 1, tag: 'mgr-talks-to-agents', coins: 40 } },
          { id: 'freeze', label: 'Deal only with the junior', desc: 'The one who answered when it was hard', outcome: 'The junior is delighted, and out of a job by the summer, and the boy signs somewhere else eventually with a man he barely knows.', effect: { playerMorale: { who: 'youngest', delta: -6 }, prestige: 2 } },
          { id: 'tell-boy', label: 'Show the boy the phone log', desc: 'Dates, times, who rang and when', outcome: 'He is nineteen and it lands hard. He stays two more years out of something that is loyalty and something that is not, and one day he works out which.', effect: { playerMorale: { who: 'youngest', delta: 10 }, squadMorale: -2, tag: 'mgr-showed-him' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-number-in-the-paper', title: 'A Number In The Paper', icon: '📰', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.25, needs: 'wonderkid' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody has published the release clause. To the pound, correct, in the second paragraph of a piece about a good season. Nine people at the club knew that number and one of them did not keep it.',
        choices: [
          { id: 'hunt', label: 'Find out who', desc: 'Nine people, nine conversations, this week', outcome: 'He works it out by Thursday and it is somebody he liked. The clause is still in the paper and now there is a hole in his own building where a decent man used to be.', effect: { prestige: 1, boardMood: -1, squadMorale: -4, tag: 'mgr-found-the-leak' } },
          { id: 'own', label: 'Confirm it publicly and price it as a floor', desc: 'That is the minimum, not the asking price', outcome: 'It is bold and it stops the drip of stories. Two clubs walk away and the one that stays knows he has to be bold too.', effect: { prestige: 2, coins: 60, boardMood: 1 } },
          { id: 'nothing', label: 'Say nothing about any of it', desc: 'Never confirm a number, ever', outcome: 'The number is now simply true in every article for the rest of the window. The lad reads all of them and starts doing arithmetic about his own wages.', effect: { playerMorale: { who: 'star', delta: -8 }, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-man-before-him', title: 'The Man Before Him', icon: '🚪', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nine of the fourteen who have played this season were signed by the manager who was sacked eighteen months ago. He has given an interview. It is warm, it is generous, and it uses the word "foundations" three times.',
        choices: [
          { id: 'credit', label: 'Give him the credit publicly', desc: 'Name him, mean it, in the press room', outcome: 'It costs nothing and it is true. It is also quoted back at the manager every time a result goes, by people who were not being kind when they quoted it.', effect: { prestige: 2, boardMood: -1, tag: 'mgr-shared-the-credit' } },
          { id: 'correct', label: 'Point out what has changed', desc: 'Same players, different football, and here is why', outcome: 'The analysis is unanswerable and he sounds smaller for having made it. Two of the nine read it as a comment on them.', effect: { prestige: -1, squadMorale: -4, boardMood: 1 } },
          { id: 'invite', label: 'Invite him to a game', desc: 'Directors\' box, a drink after, no cameras', outcome: 'He comes, and he is good company, and he is back in work within the year at a club that beats them twice.', effect: { prestige: 1, squadMorale: 3, coins: -20 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-his-own-bonus', title: 'His Own Bonus', icon: '💰', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.12, minTier: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His contract has a promotion bonus in it that was written when nobody thought it would ever be paid. The chief executive raises it in the corridor rather than in a meeting, which tells him everything about how the conversation is going to go.',
        choices: [
          { id: 'take', label: 'Take every penny of it', desc: 'It was negotiated, it was earned, it is his', outcome: 'They pay it without a murmur and the number reaches the dressing room within a fortnight, because these numbers always do. It changes nothing on a Tuesday and something at Christmas.', effect: { boardMood: -2, squadMorale: -3, prestige: 1 } },
          { id: 'waive', label: 'Put it into the staff pot', desc: 'Kitmen, physios, the women in the office', outcome: 'Twenty-nine people who have never had a bonus get one. It is the single most popular thing he does at the club and he can never do it again.', effect: { coins: -150, boardMood: 2, prestige: 2, tag: 'mgr-gave-the-bonus-away' } },
          { id: 'trade', label: 'Trade it for the budget', desc: 'Keep the money in the club, spend it on a player', outcome: 'They accept immediately, which is when he realises how cheap it was. There is a left-back in the building by July who would not otherwise be.', effect: { coins: 200, boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-flag-with-his-face', title: 'A Flag With His Face On It', icon: '🚩', category: 'triumph',
    when: { minSeason: 3, maxPos: 0.2 }, weight: 3, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Twenty feet by twelve, hand-painted in a garage over six weeks, and it is his face. It goes up in the corner before kick-off and it covers about ninety seats, which the safety officer mentions immediately and the supporters do not want to hear.',
        choices: [
          { id: 'allow', label: 'Ask the club to find a way', desc: 'Move the seats, find the money, let it stay', outcome: 'It stays. He does not enjoy walking out under his own face and he never says so. It is still there two managers later and nobody quite knows what to do with it.', effect: { prestige: 3, coins: -60, clubLegacy: { kind: 'tradition', label: 'the flag in the corner' } } },
          { id: 'redirect', label: 'Ask them to paint the team instead', desc: 'Same flag, different face, no argument', outcome: 'They take it exactly as intended and they are not offended, and the second flag is somehow never quite finished.', effect: { squadMorale: 5, prestige: -1 } },
          { id: 'refuse', label: 'Have it taken down', desc: 'Ninety seats is ninety people', outcome: 'The seats get sold. The men who made it come to every game and stand in the same place and do not sing his name any more.', effect: { prestige: -3, coins: 80, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-favourites', title: 'Favourites', icon: '🎲', category: 'triumph',
    when: { minSeason: 3, maxPos: 0.15 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'For the first time in the club\'s history the bookmakers have them as favourites for something. It is on a board in a shop window on the high street and three players have photographed it.',
        choices: [
          { id: 'embrace', label: 'Tell them they deserve to be', desc: 'Stand in it, do not hide from it', outcome: 'They play like a side that expects to win, which is new and is worth points. They also stop playing like a side that expects nothing, which was worth points too.', effect: { squadMorale: 8, prestige: 1, tag: 'mgr-owned-the-favouritism' } },
          { id: 'dismiss', label: 'Rubbish it in public', desc: 'Underdogs, always, whatever the board says', outcome: 'It is unconvincing for the first time. The squad hear a man saying a thing he has stopped believing and one of them says as much to a journalist, off the record.', effect: { prestige: -2, squadMorale: -3 } },
          { id: 'ignore', label: 'Refuse to discuss it at all', desc: 'Not in meetings, not in the press room, not once', outcome: 'The silence is loud. By February the players are talking about it exclusively among themselves, which is the one place he cannot get at it.', effect: { squadMorale: -4, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-invoice-for-the-pitch', title: 'The Invoice For The Pitch', icon: '🌱', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.15 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They came on at the whistle, all of them, and it was one of the great afternoons. The groundsman has been out there since six the next morning with a fork. There is a bill for re-turfing, a bill for a broken barrier, and a letter about it from the league.',
        choices: [
          { id: 'pay-quietly', label: 'Pay it and say nothing', desc: 'It was worth it and that is the end of it', outcome: 'The money comes out of a budget that had a physiotherapy table in it. The table is on the list again next year and the year after.', effect: { coins: -190, prestige: 1, squadMorale: 4 } },
          { id: 'appeal-letter', label: 'Answer the league in full', desc: 'Describe what actually happened out there', outcome: 'The fine is halved, eventually, in a letter that arrives in September. The phrase he used about stewarding is repeated at three other clubs and one of their safety officers writes to complain.', effect: { coins: -90, prestige: -1, boardMood: 1 } },
          { id: 'ask-fans', label: 'Let the supporters put it right', desc: 'A collection, and a working party with forks', outcome: 'Sixty people turn up on a Sunday and the pitch is fine by August. It also establishes that the club will ask them for money, which somebody upstairs files away.', effect: { coins: -40, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the Sunday they mended the pitch' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-waiting-list', title: 'The Waiting List', icon: '📝', category: 'triumph',
    when: { minSeason: 3, maxPos: 0.2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Season tickets have sold out in eleven days and there is a list with two thousand names on it. Some of those names have been coming for thirty years and did not renew in time because they always paid in August.',
        choices: [
          { id: 'strict', label: 'The list is the list', desc: 'First come, no exceptions, no phone calls', outcome: 'It is scrupulously fair and it is brutal. A man who has missed nine home games since 1988 watches the first six on a television in a pub.', effect: { prestige: 1, boardMood: 1, coins: 120 } },
          { id: 'discretion', label: 'Find room for the long-standing ones', desc: 'A hundred seats held back, quietly', outcome: 'The hundred becomes a hundred and forty because somebody in the office cannot say no. Two people who were told there was nothing find out about it and write to the paper.', effect: { prestige: -1, squadMorale: 2, coins: -40 } },
          { id: 'expand', label: 'Push the board to open the old end', desc: 'It has been shut for nine years and it need not be', outcome: 'It is open by November and it is cold and it is loud, and the safety certificate for it costs more than the tickets in it will bring in for three years.', effect: { coins: -280, prestige: 3, boardMood: -2, clubLegacy: { kind: 'stand', label: 'the old end reopened' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-shirts-from-that-night', title: 'The Shirts From That Night', icon: '👕', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.15 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club would like the eleven shirts from the final for a display, and has asked in an email with the word "heritage" in it. Nine of them have already been given to fathers, brothers and a physio who was there for the bad years.',
        choices: [
          { id: 'collect', label: 'Ask the players to get them back', desc: 'Go round the room, one at a time', outcome: 'They all say yes because he asked. One of them has to ring his father about it and describes that phone call to people for years afterwards.', effect: { squadMorale: -6, prestige: 1, boardMood: 2 } },
          { id: 'refuse', label: 'Tell the club no', desc: 'They were given away and that is what a shirt is for', outcome: 'The display goes up with photographs instead and looks perfectly good. A director mentions in a meeting that the manager decides what belongs to the club now.', effect: { squadMorale: 7, boardMood: -2, prestige: 1 } },
          { id: 'replicas', label: 'Have eleven made up instead', desc: 'Same shirts, same numbers, no history in them', outcome: 'Nobody who looks at the case will ever know. Two players know, and one of them thinks it is funny and the other thinks it is the whole problem with the place.', effect: { coins: -70, boardMood: 1, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-cup-goalkeeper', title: 'The Cup Goalkeeper', icon: '🧤', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The second keeper has played every round, kept three clean sheets and saved a penalty in the quarter-final. The first-choice passed a fitness test on Thursday afternoon, at the second attempt, on a pitch with nobody shooting at him.',
        choices: [
          { id: 'loyalty', label: 'The cup keeper plays', desc: 'He got them here and he is not injured', outcome: 'He is excellent. The first-choice does not travel on the coach, by his own request, and is at another club before the leaves are off the trees.', effect: { squadMorale: 6, playerMorale: { who: 'best', delta: -16 }, prestige: 1, tag: 'mgr-kept-the-cup-keeper' } },
          { id: 'first', label: 'The number one comes back in', desc: 'The biggest game gets the best goalkeeper', outcome: 'It is defensible in every way and the room does not defend it. The second keeper warms up the man who replaced him and does it properly, in front of everybody.', effect: { squadMorale: -8, playerMorale: { who: 'unhappiest', delta: -14 }, boardMood: 1 } },
          { id: 'ask', label: 'Put it to the two of them', desc: 'A room, no staff, and whatever they come out with', outcome: 'They come out with the right answer in nine minutes and it is not the manager\'s answer. He goes with theirs and spends the whole game knowing whose decision it is.', effect: { squadMorale: 9, prestige: -2, tag: 'mgr-let-them-decide' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-will-anybody-come', title: 'Will Anybody Come', icon: '🚌', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.12, minTier: 4 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The town has twelve thousand people in it and a market square that holds perhaps four hundred. Somebody has hired a flat-bed lorry. The alternative is a night in the function room with the players\' families and a buffet.',
        choices: [
          { id: 'lorry', label: 'Do the lorry', desc: 'Square, microphone, whatever turns up', outcome: 'Two and a half thousand turn up and the square cannot hold them and the police close a road they had not planned to close. Nobody who was there has stopped talking about it.', effect: { prestige: 3, squadMorale: 8, coins: -50, clubLegacy: { kind: 'tradition', label: 'the day they filled the square' } } },
          { id: 'room', label: 'The function room', desc: 'Families, a buffet, nothing to go wrong', outcome: 'It is warm and it is small and every player\'s mother is in a photograph. The town has a trophy in it for one night and does not get to see it.', effect: { squadMorale: 6, prestige: -1, coins: -20 } },
          { id: 'nothing', label: 'Nothing at all', desc: 'Pre-season starts in five weeks', outcome: 'It is the professional call. It also means that the only celebration the club has had in forty years happened entirely inside a dressing room with the door shut.', effect: { prestige: -2, squadMorale: -4, boardMood: 1, tag: 'mgr-skipped-the-parade' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-five-years-on-the-table', title: 'Five Years On The Table', icon: '🖊️', category: 'triumph',
    when: { minSeason: 3, maxPos: 0.2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They want him to sign for five years on the back of it. More money, an office with a window, and a clause on page six that lets anybody take him for a sum that would not buy a full-back in the division above.',
        choices: [
          { id: 'sign', label: 'Sign it as written', desc: 'Security now, worry about page six later', outcome: 'The club announce it with a photograph of a handshake. Two seasons on, a phone call happens that he has no power at all to stop.', effect: { boardMood: 3, coins: -80, tag: 'mgr-signed-long' } },
          { id: 'strip', label: 'Sign it without the clause', desc: 'Everything else, but that page goes', outcome: 'They agree, after eleven days and a shorter term. Both sides now know exactly what the other was trying to do in June.', effect: { boardMood: -1, prestige: 2 } },
          { id: 'wait', label: 'Do not sign anything', desc: 'A year left, and let the year speak', outcome: 'It is a strong position and an exhausting one. Every press conference from October onwards contains a question about it and the players start reading the answers.', effect: { boardMood: -2, squadMorale: -4, prestige: 1, tag: 'mgr-ran-his-deal-down' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-taking-it-round', title: 'Taking It Round', icon: '🥇', category: 'triumph',
    when: { minSeason: 2, maxPos: 0.15, requiresTag: 'mgr-community' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Forty-one requests in nine days. Two hospitals, a hospice, eleven schools, four supporters\' branches and a working men\'s club that has had a photograph of the 1974 side on the wall since 1974. The players are supposed to be off from Monday.',
        choices: [
          { id: 'all', label: 'Do all of it', desc: 'Split the squad, three a day, three weeks', outcome: 'It is the best thing the club has ever done for the place it is in. Four players come back to pre-season having had six days off and two of them are cooked by September.', effect: { prestige: 3, squadMorale: -5, boardMood: 2, coins: -40 } },
          { id: 'staff', label: 'Send the staff with it', desc: 'Coaches, kitmen, the chief executive, no players', outcome: 'The trophy still turns up everywhere and nobody complains out loud. Every photograph from that summer has a man in a club polo shirt in it and no footballers.', effect: { prestige: 1, squadMorale: 4, coins: -20 } },
          { id: 'some', label: 'Pick eight and go', desc: 'The two hospitals, the hospice, five schools', outcome: 'The thirty-three that get a letter instead accept it graciously. The working men\'s club takes down the 1974 photograph and does not put anything up in its place.', effect: { prestige: 2, squadMorale: 1, tag: 'mgr-chose-eight' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-nine-miles-further', title: 'Nine Miles Further', icon: '🚧', category: 'triumph',
    when: { minSeason: 3, maxPos: 0.2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three good years have finally unlocked the training ground. Four pitches, a gym with a roof that does not leak, a canteen. It is nine miles further out, on the wrong side of the town for every player who lives here and for the boys who come after school.',
        choices: [
          { id: 'move', label: 'Take it', desc: 'You do not turn down four pitches', outcome: 'The seniors adjust in a fortnight. The under-fifteens lose eleven boys inside a year because their mothers finish work at half five and the bus does not go that way.', effect: { prestige: 2, squadMorale: 5, boardMood: 2, clubLegacy: { kind: 'reputation', label: 'the club that moved out of town' } } },
          { id: 'split', label: 'Seniors out, academy stays', desc: 'Two sites, two budgets, one club', outcome: 'It costs half again to run and it keeps the boys. It also means the young ones stop bumping into first-team players in a corridor, which is where most of them learned what this is.', effect: { coins: -220, squadMorale: 3, prestige: -1 } },
          { id: 'refuse', label: 'Turn it down and fix what is here', desc: 'A roof, a gym, the drainage on the far pitch', outcome: 'The board are baffled and then relieved about the money. Every rival within thirty miles has better facilities within four years and the recruitment staff say so, weekly.', effect: { coins: -130, boardMood: -1, prestige: -2, tag: 'mgr-stayed-in-town' } },
        ],
      },
    },
  },

  // ── DRESSING ROOM ────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p09-the-song', title: 'Stand On The Chair', icon: '🎤', category: 'dressing-room',
    when: { minSeason: 1 }, temper: ['players-manager','chancer'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'New signings sing. It has been that way here since before anybody in the building arrived. The one who came in on Thursday is twenty-nine, has been at six clubs, and has said, pleasantly, that he would rather not.',
        choices: [
          { id: 'insist', label: 'He sings', desc: 'Everybody has, nobody died', outcome: 'He gets through half a verse of something nobody recognises and sits down. He is a good professional for two years and he is never once in the group of five who stay behind on a Friday.', effect: { squadMorale: 4, playerMorale: { who: 'star', delta: -10 } } },
          { id: 'excuse', label: 'Let him off', desc: 'A grown man asked politely', outcome: 'The room accepts it without a word and remembers it perfectly. The next new lad is nineteen and gets no such offer, and works out why on his own.', effect: { squadMorale: -4, playerMorale: { who: 'star', delta: 8 } } },
          { id: 'replace', label: 'Change what the forfeit is', desc: 'Two minutes on his feet about where he is from', outcome: 'It is better than the singing ever was and three of the senior men say so. It is also the manager rewriting something that was theirs and not his.', effect: { squadMorale: 2, prestige: 1, tag: 'mgr-changed-the-ritual' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-interpreter', title: 'He Does The Translating', icon: '🗣️', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One player translates for two others, in meetings, in sessions, in the medical room. He does it well. He has now missed the last four minutes of every team meeting for a season because he is still explaining the first ten.',
        choices: [
          { id: 'hire', label: 'Pay for somebody properly', desc: 'Two mornings a week, on the staff', outcome: 'The player gets his meetings back and loses something he had not realised he liked, which was being needed by two men who now speak to somebody else.', effect: { coins: -90, squadMorale: 4, playerMorale: { who: 'star', delta: -5 } } },
          { id: 'lessons', label: 'Put the two of them in lessons', desc: 'Three hours a week, club time, mandatory', outcome: 'One takes to it and is ordering his own coffee by Christmas. The other is thirty-one, hates it, and is embarrassed in front of the group for the first time in his life.', effect: { coins: -60, squadMorale: 3, playerMorale: { who: 'oldest', delta: -9 } } },
          { id: 'keep', label: 'Leave it as it is', desc: 'It works and it costs nothing', outcome: 'It carries on. He is a translator with a contract as a footballer and by March he has stopped asking questions of his own in any meeting.', effect: { playerMorale: { who: 'star', delta: -8 }, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-penalty-standing-down', title: 'He Does Not Want Them', icon: '🥅', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has taken them for three years and scored nearly all of them. He missed one in October and one in December and on Tuesday he came to the office and said he does not want the next one. He has clearly rehearsed the sentence.',
        choices: [
          { id: 'accept', label: 'Take him off them', desc: 'No argument, no speech, next name on the list', outcome: 'The relief comes off him like heat. He also never takes another one anywhere for the rest of his career and he is twenty-six.', effect: { playerMorale: { who: 'best', delta: 10 }, squadMorale: -2 } },
          { id: 'push', label: 'Tell him he is still taking them', desc: 'The next one is his and that is not a discussion', outcome: 'He scores it, in the eighty-eighth minute, in front of the away end, and does not celebrate at all. He does not look at the bench either.', effect: { playerMorale: { who: 'best', delta: -6 }, squadMorale: 5, prestige: 1 } },
          { id: 'compete', label: 'Make it an open competition on Fridays', desc: 'Whoever scores most that week takes them', outcome: 'A twenty-year-old wins it four weeks running and is magnificent. In April he misses one that matters, in a stadium far bigger than any he has played in, and the whole idea is on trial afterwards.', effect: { squadMorale: 4, playerMorale: { who: 'youngest', delta: 6 }, tag: 'mgr-penalty-competition' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-coaching-his-own-son', title: 'His Boy Is In The Group', icon: '👨‍👦', category: 'dressing-room',
    when: { minSeason: 2 }, temper: ['builder','disciplinarian'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One of the coaches has a son in the under-eighteens. The boy is decent. He is not the best of them and he has started every game since September, and one of the other fathers has said so in the car park, to another father, loudly enough.',
        choices: [
          { id: 'move-coach', label: 'Move the coach to another age group', desc: 'No blame, no announcement, new rota', outcome: 'The boy plays less immediately, which answers the question everybody was asking. The coach is excellent with the fourteens and says nothing about any of it for two years.', effect: { squadMorale: 2, prestige: 1, tag: 'mgr-split-them-up' } },
          { id: 'watch', label: 'Go and watch three games himself', desc: 'Stand on the far side, say nothing, decide', outcome: 'The boy is better than the car park thinks and worse than his father thinks. The manager now owns a judgement he cannot explain to either of them.', effect: { prestige: 2, squadMorale: -1 } },
          { id: 'nothing', label: 'Leave it entirely alone', desc: 'It is the youth team and there are bigger fires', outcome: 'It runs all season. Two families take their boys elsewhere in the summer and the reason they give the academy secretary is not the real one.', effect: { squadMorale: -3, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-the-masseur', title: 'The Man With The Table', icon: '💆', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The masseur has been here nineteen years and every player in the building talks to him with his face in a hole. He knows who is unhappy, who is injured and not saying, and who has been on the phone to an agent. He has never repeated one word of it.',
        choices: [
          { id: 'ask', label: 'Ask him what he hears', desc: 'Once, straight, and take whatever comes', outcome: 'He says he would rather not, kindly, and then answers one of the questions anyway because it is about a knee. The room somehow knows by Thursday that a conversation happened.', effect: { squadMorale: -6, prestige: -1, tag: 'mgr-asked-the-masseur' } },
          { id: 'protect', label: 'Tell him he never has to', desc: 'In front of two players, deliberately', outcome: 'It is the cheapest thing he ever buys. He also spends the next two years knowing that the best-informed man at the club is not going to tell him anything.', effect: { squadMorale: 8, prestige: 1 } },
          { id: 'route', label: 'Ask him to send them to the welfare officer', desc: 'Not what they said, just that they should go', outcome: 'Three men go who would never have gone. One of them works out who sent him and stops using the table.', effect: { squadMorale: 4, playerMorale: { who: 'unhappiest', delta: 7 }, coins: -30 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-will-not-fly', title: 'He Will Not Fly', icon: '✈️', category: 'dressing-room',
    when: { minSeason: 2, minTier: 1, maxTier: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has not flown since he was twenty-two and he has not told anybody why. There are four away trips this season where the coach is nine hours each way and the club cannot afford for its best midfielder to arrive at a hotel at two in the morning.',
        choices: [
          { id: 'drive', label: 'Let him travel by road', desc: 'A driver, a car, whenever he needs it', outcome: 'It works and it costs about what you would think. Two other players ask about the car within a month and neither of them is frightened of anything.', effect: { coins: -110, playerMorale: { who: 'best', delta: 12 }, squadMorale: -4 } },
          { id: 'help', label: 'Get him help for it', desc: 'Properly, privately, on the club', outcome: 'It takes seven months and he flies to the last away game of the season with his hands flat on his knees the whole way. He asks the manager not to make anything of it.', effect: { coins: -80, playerMorale: { who: 'best', delta: 16 }, prestige: 1, tag: 'mgr-got-him-help' } },
          { id: 'squad', label: 'Leave him out of those four', desc: 'Four games, four other players, no fuss', outcome: 'The four other players are grateful. He watches his side lose two of them from his own front room and is never quite the same about the away trips he does go on.', effect: { playerMorale: { who: 'best', delta: -12 }, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-quiet-room', title: 'Somewhere Quiet', icon: '🕯️', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two of them ask for a room before kick-off. Ten minutes, no music, door shut. The only spare room at this ground is the referee\'s old changing room, which is where the staff have their tea and where the tactics board has lived for eleven years.',
        choices: [
          { id: 'give', label: 'Give them the room', desc: 'Move the board, move the tea, done', outcome: 'By March there are six of them in there and the noise in the main dressing room has changed shape. The two who started it are the calmest men at the club.', effect: { squadMorale: 5, tag: 'mgr-made-the-room' } },
          { id: 'corridor', label: 'Point them at the physio room', desc: 'It is free for twenty minutes and nobody uses it', outcome: 'It smells of liniment and there is a man on a table in it half the time. They use it anyway and never ask for anything again.', effect: { squadMorale: -2, playerMorale: { who: 'unhappiest', delta: -6 } } },
          { id: 'no', label: 'Not before a game', desc: 'The hour before kick-off belongs to the group', outcome: 'They accept it. They now do it in a car in the car park and come in eleven minutes before the warm-up, which is not what he wanted either.', effect: { squadMorale: -5, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-first-contract-advice', title: 'What The Old Pro Told Them', icon: '📑', category: 'dressing-room',
    when: { minSeason: 2, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three scholars are being offered their first professional terms. The oldest player at the club has told all three, in the canteen, not to sign the first thing that is put in front of them, and has explained precisely why, using a number from his own career.',
        choices: [
          { id: 'back', label: 'Tell him he was right', desc: 'Out loud, where the boys can hear it', outcome: 'The three of them get better deals and one gets a great deal. The chief executive asks the manager whose side he thinks he is on and does not entirely mean it as a question.', effect: { coins: -120, squadMorale: 8, boardMood: -2, prestige: 1 } },
          { id: 'warn', label: 'Ask him to stay out of it', desc: 'Quietly, man to man, no witnesses', outcome: 'He agrees immediately and says he understands, and he does not say another word to a young player about anything for the rest of his time here.', effect: { playerMorale: { who: 'oldest', delta: -12 }, squadMorale: -5, boardMood: 1 } },
          { id: 'formalise', label: 'Put him in the meetings', desc: 'On the boys\' side of the table, officially', outcome: 'Nobody has ever done that here. It slows every negotiation down by weeks and it means no sixteen-year-old signs anything alone in this building again.', effect: { squadMorale: 6, boardMood: -2, coins: -60, clubLegacy: { kind: 'tradition', label: 'nobody signs their first deal alone' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-armband-for-one-game', title: 'For One Game', icon: '🎗️', category: 'dressing-room',
    when: { minSeason: 2, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He asks for the armband for Saturday. Not the job — the armband, for ninety minutes. His grandfather brought him here for twenty years and is not going to be well enough to come again after this one.',
        choices: [
          { id: 'yes', label: 'Give it to him', desc: 'One game, and tell the captain why', outcome: 'The captain is fine about it and looks about two inches shorter walking out second. The photograph of the coin toss is in a frame in a house in the next town within a fortnight.', effect: { playerMorale: { who: 'oldest', delta: 18 }, squadMorale: 4 } },
          { id: 'no', label: 'Say no, and explain it properly', desc: 'The armband is not a gift', outcome: 'He says he understands and he does understand. He also plays the game like a man who has something to prove to somebody in the main stand, and it is the best hour of his season.', effect: { playerMorale: { who: 'oldest', delta: -8 }, squadMorale: -3, prestige: 1 } },
          { id: 'other', label: 'Find another way to do it', desc: 'Lead them out, mascot, a seat in the box', outcome: 'It is thoughtful and everybody says so and it was not what he asked for. He mentions the armband once more, years later, in a room with a drink in his hand.', effect: { playerMorale: { who: 'oldest', delta: 5 }, squadMorale: 3, coins: -20 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-wont-warm-up-there', title: 'Not In Front Of That Corner', icon: '🧊', category: 'dressing-room',
    when: { minSeason: 2, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He was abused from that corner for ninety minutes in September by people who had travelled to do it. On Saturday the warm-up is scheduled at that end and he has asked the fitness coach, not the manager, whether it could be the other one.',
        choices: [
          { id: 'switch', label: 'Warm up at the other end', desc: 'No explanation given to anybody', outcome: 'Nobody notices except the away support, who notice immediately and enjoy it. He has a good game and the noise from that corner is worse in the second half.', effect: { playerMorale: { who: 'unhappiest', delta: 10 }, squadMorale: 2, prestige: -1 } },
          { id: 'together', label: 'Warm up there, all of them, in a line', desc: 'Twenty yards from it, the whole squad', outcome: 'It is a proper moment and he will not forget it. It also puts a nineteen-year-old substitute in front of that corner for the first time in his life.', effect: { squadMorale: 9, playerMorale: { who: 'youngest', delta: -6 }, prestige: 2, tag: 'mgr-stood-with-him' } },
          { id: 'report', label: 'Report it and say so publicly', desc: 'Names, seats, the club will pursue it', outcome: 'Four people are banned and it takes fourteen months. For most of those months he is the story rather than a footballer, and he did not ask to be.', effect: { playerMorale: { who: 'unhappiest', delta: -4 }, prestige: 3, boardMood: -1, coins: -50 } },
        ],
      },
    },
  },

  // ── BOARDROOM ────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p09-directors-son', title: 'Work Experience', icon: '🖥️', category: 'boardroom',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A director\'s son is doing six weeks in the analysis room. He is nineteen, he is not stupid, and on Wednesday a clip he cut ended up in the Thursday meeting because the analyst was ill and the boy had done the work.',
        choices: [
          { id: 'use', label: 'Use him properly', desc: 'Real tasks, real deadlines, no favours', outcome: 'He is good and he works late and he is worth a wage by week four. His father has now watched a manager give his son something and will remember it in a meeting about something else.', effect: { boardMood: 2, prestige: -1, coins: -30 } },
          { id: 'sideline', label: 'Keep him away from the first team', desc: 'Academy clips, filing, the archive', outcome: 'He does six weeks of nothing and goes home. The analyst has an extra pair of hands for none of it and mentions that, once, to the right person.', effect: { boardMood: -1, prestige: 1 } },
          { id: 'end', label: 'End the placement', desc: 'Politely, this week, before it is anything', outcome: 'It is handled well and it is still a manager telling a director that his son is a problem. Nothing is said about it and something has changed in that room.', effect: { boardMood: -3, prestige: 2, tag: 'mgr-sent-the-son-home' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-due-diligence', title: 'The Man With The Folder', icon: '📁', category: 'boardroom',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody is thinking about buying the club. Before that happens there is a consultant, and he is in the staff meeting, the medical meeting and the recruitment meeting, saying nothing and writing everything down. He has asked for the coaching budget by line.',
        choices: [
          { id: 'open-up', label: 'Give him everything he asks for', desc: 'Full access, all of it, no editing', outcome: 'The report is fair and quotes him accurately, including the bit about the scouting budget being indefensible. The scouting budget is cut in the summer.', effect: { boardMood: 2, coins: -60, prestige: 1 } },
          { id: 'manage', label: 'Give him the meetings, not the numbers', desc: 'Anything about football, nothing about money', outcome: 'He gets the numbers from the finance office in a day and a half. Somebody has now written down that the manager was obstructive.', effect: { boardMood: -2, prestige: 1, tag: 'mgr-held-back' } },
          { id: 'court', label: 'Sit down with him properly', desc: 'Two hours, his questions, then two of his own', outcome: 'He learns more about who is buying the club than anybody upstairs has told him. It also means that when the sale falls through, the current board know exactly whose side he sounded like.', effect: { prestige: 2, boardMood: -2, tag: 'mgr-talked-to-the-buyer' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-scouts-or-subscription', title: 'Eleven Men And A Laptop', icon: '💻', category: 'boardroom',
    when: { minSeason: 2, facility: { key: 'scouting', min: 4 } }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eleven part-time scouts, mileage and a pie each, against a data subscription that costs slightly less and covers forty leagues. The finance director has done the comparison honestly, which is what makes it difficult.',
        choices: [
          { id: 'data', label: 'Take the subscription', desc: 'Forty leagues beats eleven men in cars', outcome: 'It finds two players inside a year that nobody would have found. It also means the club stops having a man at every under-eighteens game within thirty miles, and the first anybody notices is when a local boy signs elsewhere.', effect: { coins: 40, prestige: 1, boardMood: 2, tag: 'mgr-went-to-data' } },
          { id: 'scouts', label: 'Keep the men', desc: 'They have been going to those grounds for years', outcome: 'They are loyal and thorough and slow. Two of them are outstanding, four are not, and he has just spent a favour keeping all eleven rather than have that conversation.', effect: { coins: -40, prestige: -1, boardMood: -1 } },
          { id: 'both', label: 'Find the money for both', desc: 'Cut something else, anything else', outcome: 'The something else turns out to be the second physiotherapist. In February there are four men in a treatment room and one pair of hands.', effect: { coins: -110, boardMood: -1, squadMorale: -5 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-early-bird', title: 'The Early-Bird Deadline', icon: '📅', category: 'boardroom',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Commercial want the season-ticket campaign live on the last day of the season, with a deadline in mid-June. He will not have signed anybody by mid-June. The brochure has a photograph of three players in it and one of them is out of contract.',
        choices: [
          { id: 'agree', label: 'Let it go out', desc: 'They need the cash flow and they always have', outcome: 'It sells well on the back of the season just gone. Two of the three in the photograph are gone by August and the messages about it are not aimed at the commercial department.', effect: { coins: 220, prestige: -2, boardMood: 2 } },
          { id: 'delay', label: 'Ask them to push it to July', desc: 'Sell a squad that exists', outcome: 'They lose about a fifth of the early renewals to nothing more than people going on holiday. The manager is now personally attached to a number in a spreadsheet.', effect: { coins: -140, boardMood: -2, prestige: 1, tag: 'mgr-moved-the-campaign' } },
          { id: 'neutral', label: 'Take the players off the brochure', desc: 'The badge, the ground, and nobody\'s face', outcome: 'It is the dullest campaign the club has run and it does perfectly acceptable numbers. The three players notice that they are not on it and one of them asks why.', effect: { coins: 60, squadMorale: -3, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-briefing-against-the-assistant', title: 'Somebody Is Briefing', icon: '🗞️', category: 'boardroom',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three pieces in six weeks, all of them warm about the manager and cold about his assistant. All three contain a detail that only came out of a boardroom. The assistant has read every one and has not mentioned any of them.',
        choices: [
          { id: 'confront', label: 'Raise it in the boardroom', desc: 'All of them in the room, one question', outcome: 'It stops that week. It also confirms to five people that the manager will bring this sort of thing into a meeting, and two of them adjust what they say in front of him permanently.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-called-it-out' } },
          { id: 'public', label: 'Defend him publicly instead', desc: 'Two minutes in the press room, unprompted', outcome: 'The assistant thanks him in the car park and means it. The next piece says the manager is protecting a coach he privately knows is not good enough.', effect: { prestige: 1, squadMorale: 4, boardMood: -1 } },
          { id: 'nothing', label: 'Say nothing and watch', desc: 'Find out who, first, and use it later', outcome: 'He knows by March and does nothing with it. The assistant takes a job at a smaller club in the summer and says in his leaving speech that nobody ever told him what he had done wrong.', effect: { prestige: -1, squadMorale: -5, boardMood: 1 } },
        ],
      },
    },
  },

  // ── MEDIA ────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p09-the-crew', title: 'A Camera In The Corridor', icon: '🎬', category: 'media',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A production company wants a season. Everything: the coach, the half-times, the meeting on the Monday after a bad one. The money is real and would pay for a full-back. They have done this at two other clubs and one of those managers is out of the game.',
        choices: [
          { id: 'all-access', label: 'Give them the lot', desc: 'No conditions, no editorial control, take the money', outcome: 'It is magnificent television. There are eleven seconds in episode four where he says something true about a player, and that player\'s children are at school with children who watch it.', effect: { coins: 260, prestige: 2, squadMorale: -8, tag: 'mgr-let-the-cameras-in' }, next: 'after' },
          { id: 'limits', label: 'Everything except the dressing room', desc: 'Corridors, coach, training, nothing behind that door', outcome: 'They agree and then spend nine months filming a closed door, which becomes the running motif of the whole series. The money is thirty per cent less.', effect: { coins: 150, prestige: 1, squadMorale: -2 }, next: 'after' },
          { id: 'refuse-crew', label: 'Turn it down', desc: 'It is a football club, not a set', outcome: 'The board accept it and mention the full-back twice. A rival two divisions below does the series instead and becomes, for one summer, more famous than anyone in this building.', effect: { boardMood: -2, squadMorale: 5, prestige: -1 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'His own children ask him, at a table, whether he is going to be on it.',
        choices: [
          { id: 'honest-kids', label: 'Tell them exactly what it is', desc: 'Including the parts he is not sure about', outcome: 'They are more interested than he expected and less impressed than he feared. One of them asks a question about a player he has been avoiding thinking about.', effect: { prestige: 1 } },
          { id: 'brush', label: 'Change the subject', desc: 'It is work, and work stays at work', outcome: 'It works for about a year. The rule is his and he is the one who breaks it, in the car, after a night game.', effect: { squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-thirty-years-on-that-beat', title: 'The Man Who Covered Them', icon: '✒️', category: 'media',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The reporter who has covered the club since the seventies has been let go by the paper. His replacement is twenty-three, based sixty miles away, writes about four clubs and has never been in the building.',
        choices: [
          { id: 'accredit', label: 'Give the old man a seat anyway', desc: 'Press box, car park pass, as long as he wants it', outcome: 'He is there every week and files nothing anywhere. He also knows things about the club\'s history that nobody has written down and now sits four feet from a man who has never asked him anything.', effect: { prestige: 2, coins: -20, clubLegacy: { kind: 'tradition', label: 'his seat in the press box' } } },
          { id: 'court-new', label: 'Bring the new one in properly', desc: 'A morning at the training ground, no agenda', outcome: 'She is sharp and she is fair and the coverage doubles. The old man reads it at home and stops coming to games entirely by December.', effect: { prestige: 1, boardMood: 1 } },
          { id: 'neither', label: 'Deal with the paper, not the person', desc: 'Whoever they send gets the same as everyone', outcome: 'It is consistent and it is cold. The club loses the only journalist who ever defended it in print and gains nothing that can be measured.', effect: { prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-piece-about-the-family', title: 'They Want To Write About The House', icon: '🏠', category: 'media',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A weekend magazine wants a long piece. Him, the family, the kitchen table, where his children go to school. The writer is good — properly good — and that is what makes it a decision rather than a no.',
        choices: [
          { id: 'do-it', label: 'Do it at home, all of it', desc: 'Kitchen, dog, the lot', outcome: 'It is the best thing anybody has written about him. For about four months afterwards, strangers know which road he lives on and one of them writes to him after a defeat.', effect: { prestige: 3, boardMood: 1, tag: 'mgr-opened-the-house' } },
          { id: 'ground', label: 'Do it at the training ground', desc: 'Same interview, wrong table', outcome: 'It comes out honest and slightly flat, and the writer says so to a colleague, and that gets back. The family stay entirely out of it, which was the whole point.', effect: { prestige: 1 } },
          { id: 'no-piece', label: 'No', desc: 'Not the children, not for anything', outcome: 'It is the right call and it closes a door that was worth having open. He is described in that magazine, twice more in three years, by people who have never met him.', effect: { prestige: -1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-club-channel-segment', title: 'Two Minutes For The Channel', icon: '📺', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club\'s own channel wants a weekly segment. Him, a chair, two minutes, reading out questions sent in by supporters. Subscriptions are down and somebody has worked out that his face is the only thing that moves them.',
        choices: [
          { id: 'do-weekly', label: 'Do it every week', desc: 'Thursday, after training, however he feels', outcome: 'Subscriptions go up by a third and it is a genuinely warm little thing. He is also now on camera on a Thursday in the week they lost three, answering a question from a nine-year-old.', effect: { coins: 130, prestige: 1, boardMood: 2, tag: 'mgr-does-the-segment' } },
          { id: 'delegate', label: 'Put a player in the chair instead', desc: 'Rotate it, one a week, paid', outcome: 'It is better than his would have been. One of them is so good at it that by March he has an agent for that as well as for football.', effect: { coins: 70, squadMorale: 4, playerMorale: { who: 'star', delta: 6 } } },
          { id: 'monthly', label: 'Once a month, on his terms', desc: 'And never in the week of a bad result', outcome: 'The commercial department accept it and quietly stop promoting it. It runs four times and is not commissioned again.', effect: { coins: 20, boardMood: -1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p09-programme-note', title: 'What He Put In The Programme', icon: '📖', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The opposition manager has used his programme notes to make a point about the way this club plays. It is dressed up as a compliment. It arrives, in print, in the away dressing room, ninety minutes before kick-off, and somebody has left one on the physio table.',
        choices: [
          { id: 'read-it', label: 'Read it out to them', desc: 'All of it, flat, no commentary', outcome: 'They win three-nil and it is the loudest dressing room of the season. It also means that for the rest of his time here, every away programme gets read by somebody looking for a reason.', effect: { squadMorale: 9, prestige: -1, tag: 'mgr-read-it-out' } },
          { id: 'bin', label: 'Put it in the bin', desc: 'Before anybody else picks it up', outcome: 'Four of them have already seen it. They play well and nobody mentions it, and one of the senior men thinks less of him for pretending it had not happened.', effect: { squadMorale: -3, prestige: 1 } },
          { id: 'answer', label: 'Answer it in his own notes', desc: 'A fortnight later, in print, at home', outcome: 'It is elegant and everybody enjoys it. He has now started something that runs for four years and involves two managers who will not shake hands on a touchline.', effect: { prestige: 2, boardMood: -1, clubLegacy: { kind: 'rivalry', label: 'the programme notes feud' } } },
        ],
      },
    },
  },
];
