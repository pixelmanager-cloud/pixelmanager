// ── YOUTH ARCS: THE SEASON & THE CALENDAR (ages 10-14) ────────────────────────────────────────────
// A boy's year is not January to December. It runs from the first sweat of pre-season to the last
// handshake in May, and everything he knows about himself is measured against that ring: the kit handed
// out in August, the fixture list on the noticeboard, the Christmas tournament, the wet grind of
// February, the run-in, the presentation night, the long empty gap after. These arcs are about the
// SEASON itself — its openings, its landmarks and its endings — not about any one match, coach, mate or
// parent inside it. Meters used: authority (Coach), family, peers, school. No money anywhere: children.
import type { StoryArc } from '../storyarc.js';

export const YOUTH_SEASON_ARCS: StoryArc[] = [
  {
    id: 'youth-season-preseason-first-day', title: 'First Day Back', icon: '🌾', category: 'saga',
    minTurn: 0, maxTurn: 32, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'July. The grass is yellow and hard as a road and the goalmouths have grown over. Nine weeks of nothing have happened to everybody, and it shows in the first ten minutes: lads bent double, lads pretending not to be. Nobody has touched a ball in anger since May.',
        choices: [
          { id: 'lead-run', label: 'Run at the front and stay there', desc: 'Set the tone for the whole year in one afternoon', outcome: 'He finishes every shuttle first and is sick behind the goal afterwards where he thinks nobody can see. Two of them saw. It becomes the story of the summer.', effect: { energy: -14, form: 0.08, attr: { stamina: 2 }, meters: { authority: 5, peers: 3 }, tag: 'season-preseason-front' }, next: 'week' },
          { id: 'pace', label: 'Pace himself and last the session', desc: 'Nobody wins a season in July', outcome: 'He runs sensibly, finishes mid-pack and is the only one who looks the same at the end as at the start. It is noticed, quietly, by the man with the stopwatch.', effect: { energy: -6, attr: { composure: 1, stamina: 1 }, meters: { authority: 2 }, tag: 'season-preseason-paced' }, next: 'week' },
          { id: 'suffer', label: 'Suffer badly and hide it', desc: 'He has grown two inches and lost everything else', outcome: 'His legs are somebody else\'s. He gets through it by counting cones and telling nobody, and lies in bed that night doing sums about how far behind he is.', effect: { energy: -10, form: -0.06, attr: { composure: 1 }, tag: 'season-preseason-behind' }, next: 'week' },
        ],
      },
      week: {
        id: 'week',
        prompt: 'By Friday the yellow grass has been cut, the balls are out and it has stopped being punishment and started being football again. It happens so gradually that he cannot name the day it turned.',
        choices: [
          { id: 'love', label: 'Admit he missed it', desc: 'Out loud, walking to the car', outcome: 'He says he missed it and feels stupid for about four seconds. Then it just sits there being true — the best thing about the whole week.', effect: { form: 0.06, attr: { teamwork: 1 }, meters: { family: 3, peers: 3 } } },
          { id: 'private', label: 'Keep it to himself', desc: 'Some things get smaller when you say them', outcome: 'He says nothing at all and carries the feeling home intact. He will remember the smell of that cut grass longer than he remembers most goals.', effect: { form: 0.05, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-fixture-list', title: 'The Fixture List Goes Up', icon: '📋', category: 'saga',
    minTurn: 0, maxTurn: 34, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A single sheet of A4 appears on the clubhouse wall, crooked, held by three drawing pins. Thirty-one Sundays with dates and names next to them. The whole year exists now, in advance, and half the squad is crowded round it reading their own future.',
        choices: [
          { id: 'photo', label: 'Copy every date into his phone', desc: 'Make the year real, all of it', outcome: 'He puts all thirty-one into his phone that evening, then sits looking at them. It is the first time he has ever seen a year laid out and known where he will be in it.', effect: { attr: { composure: 1 }, meters: { authority: 2 }, tag: 'season-fixtures-mapped' }, next: 'one' },
          { id: 'scan', label: 'Look only for the big ones', desc: 'Find the two names that matter and stop reading', outcome: 'He finds the away trip in November and the last-day fixture and stops caring about the other twenty-nine. A habit he will have to break.', effect: { form: 0.04, attr: { aggression: 1 }, tag: 'season-fixtures-cherrypicked' }, next: 'one' },
          { id: 'walk', label: 'Walk past it', desc: 'It only matters what happens on the day', outcome: 'He lets the others crowd it and goes to get changed. Somebody calls him boring. He is not sure whether he is being calm or pretending to be.', effect: { attr: { composure: 2 }, meters: { peers: -2 }, tag: 'season-fixtures-ignored' }, next: 'one' },
        ],
      },
      one: {
        id: 'one',
        prompt: 'One line on the sheet is his own birthday. He will be playing on it. Somebody\'s mum says that\'s a shame, love.',
        choices: [
          { id: 'glad', label: 'Say he\'d rather be playing', desc: 'And mean it', outcome: 'He says he\'d rather be playing than anything, and the woman laughs and tells his mother, who repeats it for years as though it explained him.', effect: { form: 0.05, meters: { family: 3 } } },
          { id: 'ask', label: 'Quietly wish it were free', desc: 'One year, one Sunday off, at the right time', outcome: 'He doesn\'t say it. But he notices he wanted the day, and files the wanting away somewhere he won\'t look at it again until he is much older.', effect: { attr: { composure: 1 }, meters: { family: 2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-new-kit', title: 'The New Kit', icon: '👕', category: 'triumph',
    minTurn: 1, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The bags come out of the boot of a car and the kit for the year is handed round in the car park, still folded, still smelling of plastic. It is not quite the same as last season\'s — the collar has changed and the sponsor is a different local garage. There are no names on the backs, only numbers.',
        choices: [
          { id: 'number', label: 'Ask for a particular number', desc: 'Say it out loud before anyone else does', outcome: 'He asks for it in front of everybody, which takes more than he expected. He gets it. He will pretend for years that he wasn\'t bothered either way.', effect: { attr: { leadership: 1, flair: 1 }, meters: { authority: 2, peers: 2 }, tag: 'season-kit-claimed' }, next: 'night' },
          { id: 'take', label: 'Take whatever he\'s given', desc: 'Whichever shirt is left at the bottom', outcome: 'He ends up with a number nobody wants and wears it for the whole year without one word about it, which does him more good than the number would have.', effect: { attr: { teamwork: 2 }, meters: { authority: 3, peers: 3 }, tag: 'season-kit-took' }, next: 'night' },
          { id: 'swap', label: 'Swap with a smaller lad', desc: 'The shirt he wanted, given away in the car park', outcome: 'He hands over the shirt he actually wanted to a boy half a head shorter who wanted it more, and gets nothing for it except the boy\'s face.', effect: { attr: { teamwork: 2, leadership: 1 }, meters: { peers: 5 }, tag: 'season-kit-gave' }, next: 'night' },
        ],
      },
      night: {
        id: 'night',
        prompt: 'He wears it round the house that evening for no reason, with socks pulled up, and then does not take it off to eat his tea.',
        choices: [
          { id: 'keep', label: 'Sleep in it', desc: 'Actually sleep in it', outcome: 'He sleeps in it and it is creased and hot by morning and he does not regret a second. There is one season in a life where a shirt does that, and this is it.', effect: { form: 0.06, attr: { flair: 1 }, meters: { family: 3 } } },
          { id: 'fold', label: 'Fold it away for Sunday', desc: 'Keep it new until it counts', outcome: 'He folds it and puts it at the top of the drawer where he can see it, and does not touch it again until the morning of the first game.', effect: { form: 0.04, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-opening-day', title: 'The First Sunday', icon: '🚩', category: 'saga',
    minTurn: 1, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Opening day. The lines have been freshly marked and are almost too bright, the nets are new, nobody has lost anything yet and everybody in the league is equal for one more hour. He has been awake since six.',
        choices: [
          { id: 'declare', label: 'Say what he wants from the year', desc: 'In the huddle, before kick-off', outcome: 'He says it, badly, and a couple of them laugh. Then they win, and by January two of the lads are saying it back to him as if it had always been the plan.', effect: { form: 0.07, attr: { leadership: 2 }, meters: { peers: 3, authority: 2 }, tag: 'season-opener-spoke' }, next: 'after' },
          { id: 'quiet', label: 'Say nothing and just start', desc: 'Thirty-one to go, no speeches', outcome: 'He keeps it shut and plays. It is a season, not a cup final, and treating it as one is a skill most of them will not learn for another decade.', effect: { attr: { composure: 2 }, meters: { authority: 2 }, tag: 'season-opener-quiet' }, next: 'after' },
          { id: 'burn', label: 'Empty himself in the first half', desc: 'Everything, immediately, on day one', outcome: 'He runs the first forty minutes as though it were the last forty of May, and spends the second half walking. They still win. He learns something about the shape of a year.', effect: { energy: -12, form: 0.05, attr: { stamina: 1, aggression: 1 }, tag: 'season-opener-burned' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'Afterwards somebody\'s dad reads out the league table from his phone. One game played. They are top of it, alphabetically or otherwise, and everyone pretends not to care.',
        choices: [
          { id: 'enjoy', label: 'Enjoy being top of nothing', desc: 'It will never be this simple again', outcome: 'He lets himself enjoy a table one game old, and is right to. By November it is a different document entirely and reads like bad news.', effect: { form: 0.05, meters: { peers: 3 } } },
          { id: 'dismiss', label: 'Point out it means nothing', desc: 'Thirty games left', outcome: 'He says it means nothing. True, and unpopular. The dad with the phone calls him a miserable little professional, approvingly.', effect: { attr: { composure: 1 }, meters: { authority: 3, peers: -2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-christmas-tournament', title: 'The Christmas Tournament', icon: '🎄', category: 'saga',
    minTurn: 3, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A sports hall in the week between the terms. Six teams, seven-minute games, a trestle table selling mince pies and weak tea, tinsel taped to the crossbar. It counts for absolutely nothing and everybody in the building is behaving as though it counts for a great deal.',
        choices: [
          { id: 'serious', label: 'Take it deadly seriously', desc: 'Treat seven minutes like ninety', outcome: 'He plays every one of the seven-minute games as though promotion depended on it, and by the fifth he is the only one still sprinting. They win it. He is unbearable in the car.', effect: { energy: -10, form: 0.07, attr: { aggression: 1, stamina: 1 }, meters: { authority: 3, peers: -2 }, tag: 'season-xmas-serious' }, next: 'end' },
          { id: 'fun', label: 'Play like it\'s Christmas', desc: 'Try the things he\'d never try in a league game', outcome: 'He tries three ridiculous things, two of which fail hilariously and one of which goes in off the tinsel. It is the most he has enjoyed football since August.', effect: { form: 0.06, attr: { flair: 2, creativity: 1 }, meters: { peers: 5 }, tag: 'season-xmas-fun' }, next: 'end' },
          { id: 'young', label: 'Carry the two youngest through it', desc: 'Two lads a year below have been drafted in', outcome: 'He spends the afternoon feeding two terrified boys the ball in places where they cannot fail. Neither ever forgets it; he barely remembers by February.', effect: { attr: { teamwork: 2, leadership: 1 }, meters: { peers: 4, authority: 3 }, tag: 'season-xmas-carried' }, next: 'end' },
        ],
      },
      end: {
        id: 'end',
        prompt: 'They give out a plastic trophy the size of a mug and a selection box each. Outside it is dark at half past three and the car park smells of frost and hot dogs.',
        choices: [
          { id: 'trophy', label: 'Keep the plastic trophy', desc: 'On the shelf, dead centre', outcome: 'It goes on the shelf and stays there through everything that comes later, chipped, meaning nothing to anyone else in the house.', effect: { form: 0.04, meters: { family: 3 } } },
          { id: 'give', label: 'Give it to one of the little ones', desc: 'He\'ll have others', outcome: 'He hands the mug-sized trophy to a nine-year-old on the way out. It is one of the very few things he does that year that costs him nothing and is remembered by somebody else forever.', effect: { attr: { leadership: 2 }, meters: { peers: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-boxing-day', title: 'Boxing Day', icon: '❄️', category: 'saga',
    minTurn: 3, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Twenty-sixth of December, ten in the morning, a pitch like a fridge shelf. The whole family has been up since seven for it. Half the squad has eaten nothing but chocolate for thirty hours and one lad is playing in a Christmas jumper under his shirt.',
        choices: [
          { id: 'go', label: 'Go, obviously', desc: 'It never occurs to him not to', outcome: 'He goes. Six of the squad don\'t. The coach does not mention it once all winter, and remembers exactly who was there.', effect: { energy: -8, form: 0.07, attr: { stamina: 1 }, meters: { authority: 6, peers: 2 }, tag: 'season-boxingday-went' }, next: 'after' },
          { id: 'family', label: 'Stay for the family day', desc: 'His nan is down from Tuesday to Friday, once a year', outcome: 'He stays, plays cards with his nan and watches the score come through on somebody\'s phone. He is completely happy and slightly sick about it at the same time.', effect: { energy: 5, meters: { family: 6, authority: -4 }, attr: { composure: 1 }, tag: 'season-boxingday-stayed' }, next: 'after' },
          { id: 'drag', label: 'Go, and drag two others out of bed', desc: 'Phone them from the car', outcome: 'He rings two of them from the car and both turn up, one of them furious, in the wrong boots. They play with nine instead of seven. He is the reason.', effect: { energy: -9, attr: { leadership: 2 }, meters: { authority: 5, peers: 3 }, tag: 'season-boxingday-dragged' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'Whatever happened, by one o\'clock he is back in a warm house that smells of yesterday, with mud on his shins and a plate of leftovers, and the year is nearly over.',
        choices: [
          { id: 'best', label: 'Decide this is his favourite day of the year', desc: 'And say so', outcome: 'He says Boxing Day football is the best day of the year and half the room disagrees loudly. He never changes his mind about it, not once, not ever.', effect: { form: 0.05, meters: { family: 3 }, attr: { teamwork: 1 } } },
          { id: 'tired', label: 'Fall asleep in the chair by two', desc: 'Boots still by the door', outcome: 'He is asleep sitting up before the film starts, mud drying on his legs. Somebody takes a photograph that stays on the fridge for years.', effect: { energy: 8, meters: { family: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-february-grind', title: 'The Middle of February', icon: '🌧️', category: 'crisis',
    minTurn: 4, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The part of the season nobody writes about. Dark at four, training under one working floodlight, three games called off in a row and then a fourth played on a pitch that is essentially soup. Nine weeks of this left. Nobody is watching and nothing is being decided.',
        choices: [
          { id: 'ritual', label: 'Turn up regardless, every single week', desc: 'Make attendance the whole point', outcome: 'He does not miss one. Not the frozen one, not the flooded one, not the one where four turned up. It is the least glamorous thing he ever does and possibly the most important.', effect: { energy: -10, attr: { stamina: 2, composure: 1 }, meters: { authority: 6 }, tag: 'season-feb-never-missed' }, next: 'thaw' },
          { id: 'sharpen', label: 'Use the dead weeks on one thing', desc: 'Weak foot, in the dark, on his own', outcome: 'He gives the whole of February to his weak foot in a car park with a wall. In April people start saying he\'s two-footed as though he always was.', effect: { energy: -8, attr: { creativity: 1, flair: 1 }, form: 0.05, tag: 'season-feb-sharpened' }, next: 'thaw' },
          { id: 'drift', label: 'Let himself drift for a few weeks', desc: 'Everyone else has', outcome: 'He coasts through the dark end of winter like most of them, and in March discovers that the two lads who didn\'t coast are now slightly ahead of him.', effect: { energy: 6, form: -0.07, meters: { authority: -3, peers: 2 }, tag: 'season-feb-drifted' }, next: 'thaw' },
        ],
      },
      thaw: {
        id: 'thaw',
        prompt: 'Then one Tuesday at the end of the month it is still light at half five, and the whole session feels different for no reason anyone can name.',
        choices: [
          { id: 'notice', label: 'Notice it and say so', desc: '"It\'s light."', outcome: 'He says it out loud and everybody looks up at the sky like idiots for a second. The session is the best they have had since October.', effect: { form: 0.07, meters: { peers: 3 }, attr: { teamwork: 1 } } },
          { id: 'work', label: 'Say nothing and use the extra hour', desc: 'Stay on after the others go in', outcome: 'He stays out in the last of the light until his mother flashes the car headlights twice. February is over and he has come out of it in front.', effect: { energy: -6, form: 0.06, attr: { stamina: 1 }, meters: { authority: 3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-nothing-to-play-for', title: 'Nothing To Play For', icon: '🪫', category: 'crisis',
    minTurn: 5, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Mid-April. They cannot go up and they cannot go down. Six fixtures left that decide precisely nothing, against teams in the same position, in front of nobody. The season has not ended; it has simply stopped mattering, which is worse.',
        choices: [
          { id: 'standards', label: 'Play the dead games like real ones', desc: 'Because that is who he is, apparently', outcome: 'He plays the six meaningless games exactly as he played the meaningful ones. Two people notice. One of them keeps a list, and his name goes on it.', effect: { energy: -9, form: 0.06, attr: { composure: 2 }, meters: { authority: 6, peers: -1 }, tag: 'season-dead-standards' }, next: 'last' },
          { id: 'experiment', label: 'Use them to try being someone else', desc: 'A different position, a different game', outcome: 'With nothing to lose he plays six weeks somewhere new and is bad at it for four of them. In the fifth something clicks that changes what kind of player he becomes.', effect: { form: -0.04, attr: { creativity: 2, teamwork: 1 }, meters: { authority: 3 }, tag: 'season-dead-experimented' }, next: 'last' },
          { id: 'coast', label: 'Coast to the end with everyone else', desc: 'Nobody is going to remember April', outcome: 'He drops to the level of the games and finds it is a very easy level to drop to and a hard one to climb back out of in August.', effect: { energy: 6, form: -0.08, attr: { composure: -1 }, meters: { peers: 3, authority: -4 }, tag: 'season-dead-coasted' }, next: 'last' },
        ],
      },
      last: {
        id: 'last',
        prompt: 'On the last of the six the coach names an unchanged side and says, without any edge in it, that he can tell everything he needs to know about a lad by what he does in April.',
        choices: [
          { id: 'hear', label: 'Take it as it was meant', desc: 'A sentence to keep', outcome: 'He hears it properly, which most of them don\'t, and repeats it to himself for the rest of his career whenever a fixture looks like it doesn\'t count.', effect: { attr: { composure: 2, leadership: 1 }, meters: { authority: 4 } } },
          { id: 'shrug', label: 'Let it go past him', desc: 'It\'s a line coaches say', outcome: 'It goes in one ear. He will come back to it at twenty-three, in an entirely different April, and understand it far too late to have used it.', effect: { attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-run-in', title: 'The Run-In', icon: '🏁', category: 'triumph',
    minTurn: 6, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Five games left and everything still possible. The Sunday-morning league has turned, briefly, into something with weight: results elsewhere are being checked on phones in car parks, and grown men who have said nothing all year are suddenly speaking to the referee.',
        choices: [
          { id: 'front', label: 'Ask for the ball when it\'s heaviest', desc: 'The last twenty minutes of tight games', outcome: 'He wants it when nobody else does, four weeks running. He does not do anything spectacular with it. He simply keeps asking, and it is the reason they hold on.', effect: { energy: -10, form: 0.08, attr: { leadership: 2, composure: 1 }, meters: { authority: 5, peers: 4 }, tag: 'season-runin-wanted-it' }, next: 'final' },
          { id: 'calm', label: 'Be the calm one in a squad of screamers', desc: 'Somebody has to be', outcome: 'While the touchline loses it every week he says almost nothing and plays the simple pass. Adults describe him as "old for his age" — half a compliment.', effect: { form: 0.06, attr: { composure: 3 }, meters: { authority: 4 }, tag: 'season-runin-calm' }, next: 'final' },
          { id: 'tight', label: 'Tighten up completely', desc: 'It matters, so he stops playing', outcome: 'The weight gets into his feet. For three weeks he is the safest, smallest version of himself, and he hates every minute of being that boy.', effect: { form: -0.07, attr: { composure: 1 }, meters: { authority: -2 }, tag: 'season-runin-tightened' }, next: 'final' },
        ],
      },
      final: {
        id: 'final',
        prompt: 'It comes down to the last Sunday and a result somewhere else that they cannot affect. Twenty of them stand in a car park round one phone waiting for a score to update.',
        choices: [
          { id: 'watch', label: 'Stand and watch the phone with them', desc: 'However it goes, together', outcome: 'The screen refreshes and the car park either erupts or goes completely silent. Either way he is standing in the middle of it, and remembers the waiting more than the answer.', effect: { attr: { teamwork: 2 }, meters: { peers: 5 } } },
          { id: 'away', label: 'Walk to the car and let someone tell him', desc: 'He can\'t stand there watching', outcome: 'He sits in the passenger seat with the door open and hears the noise from forty yards away, and knows what it means before anybody says a word.', effect: { attr: { composure: 2 }, meters: { family: 3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-last-game', title: 'The Last Sunday', icon: '🌇', category: 'saga',
    minTurn: 7, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Final whistle of the season. The nets come down straight away, the corner flags go into a bag, and somebody\'s dad starts loading the goals onto a trailer while lads are still on the pitch. Thirty-one Sundays, finished, in about four minutes.',
        choices: [
          { id: 'stay', label: 'Stay out on the pitch till they clear it', desc: 'The last one off', outcome: 'He sits on the grass in his kit while the posts come down around him, for no reason he can explain, until his dad calls him twice. He does this at the end of every season for the rest of his life.', effect: { attr: { composure: 2 }, meters: { family: 2 }, tag: 'season-lastgame-stayed' }, next: 'goodbye' },
          { id: 'help', label: 'Help carry the goals to the trailer', desc: 'Ten minutes of nobody\'s glory', outcome: 'He carries posts and nets with two dads and the caretaker while the rest go for chips. The caretaker remembers his name for years afterwards.', effect: { energy: -5, attr: { teamwork: 2 }, meters: { authority: 4 }, tag: 'season-lastgame-helped' }, next: 'goodbye' },
          { id: 'off', label: 'Get changed and go, quickly', desc: 'He doesn\'t like endings', outcome: 'He is in the car before most of them are off the pitch. It is easier that way and he knows exactly what he is avoiding while he does it.', effect: { attr: { composure: 1 }, meters: { peers: -3 }, tag: 'season-lastgame-fled' }, next: 'goodbye' },
        ],
      },
      goodbye: {
        id: 'goodbye',
        prompt: 'In the car park it becomes obvious that two or three of them will not be back in August — not dramatically, just school, or a move, or a season\'s worth of quiet losing interest. Nobody says goodbye properly because nobody says it at all.',
        choices: [
          { id: 'say', label: 'Say something to the one who\'s going', desc: 'Even if it comes out wrong', outcome: 'He says the wrong thing badly to a boy he has played beside for three years, and they shake hands like small men. It is the best he can do and it is enough.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { peers: 5 } } },
          { id: 'assume', label: 'Assume he\'ll see them in August', desc: 'Everyone comes back', outcome: 'He says see you in a few weeks and means it. In August two of the names are simply not there, and no announcement is ever made about either of them.', effect: { attr: { composure: 1 }, meters: { peers: -2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-presentation-night', title: 'Presentation Night', icon: '🏵️', category: 'crisis',
    minTurn: 8, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A function room above a pub. Chicken and chips, a projector that won\'t work, forty families at round tables. Every lad gets a small trophy for turning up, and then there are three real ones. He knows before it starts that his name is a possibility, and he has told nobody that he knows.',
        choices: [
          { id: 'expect', label: 'Let himself expect it', desc: 'Sit forward when they start reading', outcome: 'They read a different name for player of the year, one he half-expected but had argued out of his head. He claps hard, for a long time, and his ears go hot.', effect: { form: -0.05, attr: { composure: 1 }, meters: { peers: -1 }, tag: 'season-presentation-missed-out' }, next: 'after' },
          { id: 'brace', label: 'Decide beforehand that it isn\'t him', desc: 'So it can\'t land on him', outcome: 'He talks himself out of it in the car on the way. When it isn\'t him he feels almost nothing, and is troubled later by how well he has learned to do that.', effect: { attr: { composure: 2 }, tag: 'season-presentation-braced' }, next: 'after' },
          { id: 'happy', label: 'Be genuinely pleased for the lad who wins', desc: 'He has had the better year and everyone knows it', outcome: 'He is on his feet before anyone, and it is not performance. The winner\'s mother tells his mother about it at the bar, twice.', effect: { attr: { teamwork: 2, leadership: 1 }, meters: { peers: 5, family: 2 }, tag: 'season-presentation-generous' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'On the way out the coach stops him by the door with a hand on the shoulder and says there were about four votes in it, and that he shouldn\'t read anything into a room full of dads with a pen.',
        choices: [
          { id: 'fuel', label: 'Keep the four votes', desc: 'Carry the number into pre-season', outcome: 'He does not forget the number for a single week of the summer. In August he comes back at a level nobody has seen from him, for a reason he will never explain.', effect: { form: 0.07, attr: { aggression: 1, stamina: 1 }, meters: { authority: 3 } } },
          { id: 'let', label: 'Let it go before he gets to the car', desc: 'It\'s a night in a room above a pub', outcome: 'He decides in the doorway that it is a raffle, and puts his participation trophy on the shelf with the rest. It is genuinely the healthier choice and it costs him something.', effect: { attr: { composure: 2 }, meters: { family: 3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-player-of-the-year', title: 'The Envelope at the End', icon: '🥇', category: 'triumph',
    minTurn: 8, maxTurn: 46, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The same function room, the same chicken and chips — and this time it is his name that comes out of the microphone. Forty families clap. He has to walk between two rows of tables to get to the front and he has no idea what to do with his hands.',
        choices: [
          { id: 'speech', label: 'Say a few words when the mic is offered', desc: 'Twelve years old, in front of everyone', outcome: 'He thanks the coaches and then, unprompted, the two lads who never get picked. The room goes quiet in a good way. His grandmother cries into a napkin.', effect: { form: 0.06, attr: { leadership: 3 }, meters: { peers: 5, authority: 4, family: 5 }, tag: 'season-poty-spoke' }, next: 'after' },
          { id: 'grab', label: 'Take it and get back to his seat', desc: 'Shake the hand, say cheers, sit down', outcome: 'He is back in his chair inside fifteen seconds, red to the ears, holding a trophy he cannot look at. His father does not stop grinning all night.', effect: { form: 0.05, attr: { composure: 1 }, meters: { family: 5 }, tag: 'season-poty-quiet' }, next: 'after' },
          { id: 'share', label: 'Say it should have been someone else', desc: 'And name him', outcome: 'He says {RIVAL} had the better season, which is arguably true and definitely awkward, and the room isn\'t sure whether to laugh. {RIVAL} never forgets it.', effect: { attr: { teamwork: 2, leadership: 1 }, meters: { peers: 6, authority: -1 }, tag: 'season-poty-deflected' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The trophy is heavier than it looks and has last year\'s winner engraved above his name. That boy is not in the room; he left the club in October.',
        choices: [
          { id: 'sober', label: 'Read the name above his own and go quiet', desc: 'One year, that\'s all', outcome: 'He reads the whole list on the plinth and finds that he knows almost none of the names. It is the first genuinely sobering thing football has ever taught him.', effect: { attr: { composure: 3 }, tag: 'season-poty-sobered' } },
          { id: 'enjoy', label: 'Enjoy it completely for one night', desc: 'Take it to bed, put it on the windowsill', outcome: 'He allows himself the whole night without a single sensible thought, and it is one of about four evenings from that entire decade he can still describe in detail.', effect: { form: 0.06, meters: { family: 4 }, attr: { flair: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-sign-on-again', title: 'Signing On For Another Year', icon: '✍️', category: 'saga',
    minTurn: 8, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A registration form on a clipboard in the corridor at the end of June: name, date of birth, a parent\'s signature, a tick box. It is not a contract and it means nothing legally, but it is the club asking him, in the only language it has, whether he is coming back.',
        choices: [
          { id: 'sign', label: 'Sign it on the spot', desc: 'Before anyone can change their mind', outcome: 'He has the pen out of the coach\'s hand before the sentence is finished. Something in the man\'s face suggests he was not entirely sure of the answer.', effect: { form: 0.05, meters: { authority: 5, family: 2 }, attr: { teamwork: 1 }, tag: 'season-signon-instant' }, next: 'others' },
          { id: 'think', label: 'Say he\'ll take it home and think', desc: 'Two clubs, one Sunday morning', outcome: 'He asks for a week. The coach says take two, in a voice that has cooled by about a degree, and the form sits on the kitchen table looking at him.', effect: { attr: { composure: 2 }, meters: { authority: -3, family: 3 }, tag: 'season-signon-hesitated' }, next: 'others' },
          { id: 'ask', label: 'Ask what he\'d be signing on to be', desc: 'Starter, or squad?', outcome: 'He asks the question a twelve-year-old is not supposed to ask. The coach answers it honestly and neither of them enjoys the ten seconds in the middle.', effect: { attr: { leadership: 2, composure: 1 }, meters: { authority: 2 }, tag: 'season-signon-asked' }, next: 'others' },
        ],
      },
      others: {
        id: 'others',
        prompt: 'By the middle of July the group chat reveals who has signed and who has not. Two have gone to the club across town. One has simply not answered anybody since May.',
        choices: [
          { id: 'chase', label: 'Message the one who\'s gone silent', desc: 'Nothing about football', outcome: 'He sends a message that isn\'t about signing on at all, and gets a reply four days later. The lad comes back to training in August and stays for two more years.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 6 } } },
          { id: 'leave', label: 'Leave it — people drift, it\'s a season thing', desc: 'He\'s twelve; this happens every June', outcome: 'He lets it lie, and it turns out that was the last summer that boy played football at all. He finds this out years later, in a pub, and it lands harder than he expects.', effect: { attr: { composure: 1 }, meters: { peers: -2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-long-gap', title: 'The Long Gap', icon: '⏳', category: 'crisis',
    minTurn: 9, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Seven weeks without a fixture. Not an injury, not a punishment — the calendar has simply run out. His whole week is built round Sunday and there is no Sunday. By the second week he does not know what to do with an afternoon.',
        choices: [
          { id: 'wall', label: 'Go and find a wall', desc: 'Every day, alone, until the season restarts', outcome: 'He takes a ball to the same wall for seven weeks. Nobody sees a minute of it and it is the single largest jump in his ability that year.', effect: { energy: -8, form: 0.07, attr: { creativity: 2, stamina: 1 }, tag: 'season-gap-wall' }, next: 'return' },
          { id: 'other', label: 'Do something that isn\'t football', desc: 'Bikes, the pool, the six weeks other kids get', outcome: 'He spends the gap being twelve instead of being a footballer, and comes back rested, brown and slightly slower, laughing more than he has since Christmas.', effect: { energy: 12, form: -0.04, attr: { flair: 1, teamwork: 1 }, meters: { family: 4, peers: 4 }, tag: 'season-gap-lived' }, next: 'return' },
          { id: 'lost', label: 'Rattle round the house not knowing himself', desc: 'Without Sunday there\'s no shape to anything', outcome: 'He is short-tempered and bored for six weeks and cannot explain to anyone why. It is the first time he understands how much of him the season is holding up.', effect: { energy: 4, form: -0.05, attr: { composure: 1 }, meters: { family: -3 }, tag: 'season-gap-adrift' }, next: 'return' },
        ],
      },
      return: {
        id: 'return',
        prompt: 'The message finally comes: back Tuesday, usual place, bring water. He reads it about nine times.',
        choices: [
          { id: 'early', label: 'Be there forty minutes early', desc: 'Sit on the ball waiting for the gate to open', outcome: 'He is at the locked gate before the coach\'s car pulls in. The man says nothing, and unlocks it, and remembers it in November when he is picking a captain.', effect: { form: 0.05, meters: { authority: 5 }, attr: { leadership: 1 } } },
          { id: 'normal', label: 'Turn up like it\'s any other Tuesday', desc: 'Don\'t make a thing of it', outcome: 'He arrives at the normal time, plays badly for twenty minutes and then perfectly well, and the seven weeks close up behind him as though they never happened.', effect: { form: 0.03, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-anniversary', title: 'A Year To The Day', icon: '🗓️', category: 'offpitch',
    minTurn: 10, maxTurn: 46, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His mother mentions, cooking, that it is a year to the day since his first game for them — she knows because of a photograph on her phone with a date on it. Same pitch this Sunday, roughly the same weather, a different boy in the same shirt.',
        choices: [
          { id: 'compare', label: 'Look at the photo properly', desc: 'Him, twelve months ago, in a shirt too big', outcome: 'He looks at a boy who did not know anything yet and is briefly, uncomfortably fond of him. Then he notices the sleeves fit now, and that is the whole year in one detail.', effect: { attr: { composure: 2 }, meters: { family: 4 }, tag: 'season-anniv-looked' }, next: 'sunday' },
          { id: 'audit', label: 'Ask himself whether he\'s actually better', desc: 'Honestly, not kindly', outcome: 'He does the sum seriously and decides yes at some things and no at others, which at twelve is an unusually accurate answer and slightly deflating.', effect: { attr: { composure: 1, creativity: 1 }, tag: 'season-anniv-audited' }, next: 'sunday' },
          { id: 'shrug', label: 'Say it\'s only a year', desc: 'He\'s not interested in looking backwards', outcome: 'He says a year isn\'t anything and goes to get his boots. His mother keeps the photo anyway, and sends it to him on the same date for the next decade.', effect: { form: 0.04, meters: { family: 2 }, tag: 'season-anniv-shrugged' }, next: 'sunday' },
        ],
      },
      sunday: {
        id: 'sunday',
        prompt: 'On the Sunday there is a boy in the changing room playing his first game for them, sat in the corner with his socks already on an hour early, saying nothing.',
        choices: [
          { id: 'sit', label: 'Go and sit next to him', desc: 'Same corner, same silence, better company', outcome: 'He sits down beside him and talks about nothing in particular until the boy\'s shoulders come down. Twelve months ago somebody did not do that for him.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 5, authority: 3 } } },
          { id: 'leave', label: 'Leave him to it', desc: 'He got through it on his own', outcome: 'He remembers being that nervous and decides the boy will survive it as he did. He is right, and it is still the wrong call, and he half knows it at the time.', effect: { attr: { composure: 1 }, meters: { peers: -2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-back-and-changed', title: 'Everyone Came Back Different', icon: '📏', category: 'crisis',
    minTurn: 12, maxTurn: 48, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'First session of the new season. Two lads have grown four inches, one has a voice like his father\'s, and a boy who could barely get a game in May is suddenly the quickest in the group. Nothing has been announced and yet the whole pecking order is different.',
        choices: [
          { id: 'reset', label: 'Accept the year starts from zero', desc: 'Whatever he was in May is gone', outcome: 'He decides last season\'s standing is worthless and behaves accordingly, which spares him three months of the resentment the others carry around all autumn.', effect: { form: 0.05, attr: { composure: 2, teamwork: 1 }, meters: { authority: 3 }, tag: 'season-reset-accepted' }, next: 'place' },
          { id: 'insist', label: 'Play like he\'s still who he was', desc: 'Rank was earned, not lent', outcome: 'He turns up assuming the standing he left with, and spends six weeks being visibly annoyed that nobody has consulted the previous season\'s table.', effect: { form: -0.06, attr: { aggression: 1 }, meters: { peers: -4, authority: -2 }, tag: 'season-reset-resisted' }, next: 'place' },
          { id: 'study', label: 'Watch the boy who\'s overtaken him', desc: 'Learn what changed over one summer', outcome: 'Instead of resenting him he spends August working out exactly what the lad now does differently, and steals two of it by October.', effect: { attr: { creativity: 2, composure: 1 }, form: 0.04, meters: { peers: 2 }, tag: 'season-reset-studied' }, next: 'place' },
        ],
      },
      place: {
        id: 'place',
        prompt: 'By the third week the new order has set, the way it always does, and it will now hold more or less until May.',
        choices: [
          { id: 'work', label: 'Take the long view and work at it', desc: 'Nine months is a long time', outcome: 'He treats the pecking order as a thing that moves slowly rather than never, and by Christmas he has moved two places up it without anybody announcing that either.', effect: { energy: -7, form: 0.06, attr: { stamina: 1 }, meters: { authority: 4 } } },
          { id: 'accept', label: 'Settle where he is for the year', desc: 'And be very good at that job', outcome: 'He stops trying to be somebody else\'s player and becomes extremely reliable at being his own, which is worth more than the two places would have been.', effect: { form: 0.05, attr: { teamwork: 2, composure: 1 }, meters: { peers: 3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-trials-for-next-year', title: 'Trialling For Next Season\'s Squad', icon: '🎽', category: 'crisis',
    minTurn: 14, maxTurn: 48, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'May, and the season is barely finished when the notices go out: three evenings of open sessions to build next year\'s group. Everyone who is already in has to come. Forty outsiders in numbered bibs turn up as well. Nine months of being a member of something reduced to three Wednesdays.',
        choices: [
          { id: 'host', label: 'Behave like it\'s his club', desc: 'Learn the trialists\' names and pass to them', outcome: 'He treats the strangers as teammates for three evenings, which costs him a couple of chances to shine and buys him something the staff notice more.', effect: { form: -0.03, attr: { leadership: 2, teamwork: 2 }, meters: { authority: 6, peers: 4 }, tag: 'season-trials-hosted' }, next: 'list' },
          { id: 'prove', label: 'Treat every trialist as a threat', desc: 'One of them is here for his shirt', outcome: 'He plays three sharp, selfish, excellent evenings and does not learn a single name. He is kept on, and two of the coaches use the word "individual" about him.', effect: { form: 0.07, attr: { aggression: 2 }, meters: { authority: 2, peers: -3 }, tag: 'season-trials-fought' }, next: 'list' },
          { id: 'flat', label: 'Turn up empty after a long season', desc: 'He has nothing left and it shows', outcome: 'Nine months of football have taken everything and the three Wednesdays get the worst version of him. He knows it while it is happening. That is the horrible part.', effect: { energy: -10, form: -0.07, attr: { composure: 1 }, meters: { authority: -3 }, tag: 'season-trials-flat' }, next: 'list' },
        ],
      },
      list: {
        id: 'list',
        prompt: 'The following week the group for next season is read out in the changing room, in alphabetical order, by a man reading off his phone. It takes ninety seconds. His name is in it. Four names from the season just finished are not.',
        choices: [
          { id: 'find', label: 'Go and find one of the four', desc: 'Before he\'s out of the car park', outcome: 'He catches one of them by the gate and says something clumsy and true. The lad nods, says cheers, and gets in his mum\'s car, and that is the end of three years.', effect: { attr: { leadership: 2 }, meters: { peers: 5 }, tag: 'season-trials-said-goodbye' } },
          { id: 'relief', label: 'Feel the relief and be ashamed of it', desc: 'Glad it was them', outcome: 'The first thing he feels is relief, the second is shame at the first, and both are entirely normal and neither is ever mentioned to a living soul.', effect: { attr: { composure: 2 }, meters: { peers: -1 } } },
          { id: 'quiet', label: 'Say nothing to anybody and go home', desc: 'There isn\'t a right thing to say', outcome: 'He goes home and does not mention it at tea. In August the four gaps in the changing room are filled by strangers within a fortnight.', effect: { attr: { composure: 1 }, meters: { family: -1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-season-season-ticket', title: 'The Season Ticket', icon: '🎟️', category: 'offpitch',
    minTurn: 11, maxTurn: 48, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A card in his name arrives in an envelope in July: the same seat, block G, for the next thirty-eight home games. It is renewed every summer without discussion, like a bill. It also clashes, at least six times a year, with his own fixtures.',
        choices: [
          { id: 'own', label: 'Choose his own fixtures every time', desc: 'Six wasted seats a season', outcome: 'He gives the card up whenever the two collide and the seat sits empty or goes to a cousin. Nobody makes him feel bad about it, which somehow makes it worse.', effect: { form: 0.05, meters: { authority: 4, family: -2 }, attr: { stamina: 1 }, tag: 'season-ticket-plays' }, next: 'end' },
          { id: 'ground', label: 'Keep the six Saturdays for the ground', desc: 'Same seat, same man, since he was six', outcome: 'He keeps the six and watches football instead of playing it, next to the same person he has sat next to since he was six. It is not nothing, and he knows exactly what it costs.', effect: { form: -0.03, meters: { family: 6 }, attr: { creativity: 1 }, tag: 'season-ticket-goes' }, next: 'end' },
          { id: 'watch', label: 'Go, and watch one player for ninety minutes', desc: 'Not the ball — one man in his position', outcome: 'He spends the whole afternoon watching one player off the ball and comes home with three things to try. It changes what going to the ground is for.', effect: { attr: { creativity: 2, composure: 1 }, form: 0.04, meters: { family: 3 }, tag: 'season-ticket-studies' }, next: 'end' },
        ],
      },
      end: {
        id: 'end',
        prompt: 'On the last home game of the year the man in the next seat says, half-joking, that one of these seasons he\'ll be watching him from up here instead.',
        choices: [
          { id: 'promise', label: 'Say it like a promise', desc: '"You will."', outcome: 'He says it flatly and the man laughs, and then stops laughing, because the boy is not joking at all. Neither of them mentions it again for years.', effect: { form: 0.05, attr: { leadership: 1 }, meters: { family: 4 } } },
          { id: 'deflect', label: 'Laugh it off', desc: 'Some things you don\'t say out loud', outcome: 'He laughs and changes the subject, and spends the whole walk to the car thinking about the seat he was sitting in and the pitch he was looking at.', effect: { attr: { composure: 2 }, meters: { family: 2 } } },
        ],
      },
    },
  },
];
