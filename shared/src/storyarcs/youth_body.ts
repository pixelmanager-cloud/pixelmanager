// ── YOUTH: THE BODY & GROWING UP — bones, food, sleep and skin (ages 10-14) ───────────────────────
// Everything in this file happens inside the boy's own body: growing pains at two in the morning, boots
// that no longer fit, the first training session that genuinely hurts, the summer he suddenly got quick.
// Parents, mates, coaches and matches exist only as weather at the edges — the subject is always the body
// and what he learns to do with it. Meters used are only those live in childhood (authority = Coach,
// family = Parents, peers = Mates, school = School) and, since these are children, no arc touches earnings,
// market or greed.
import type { StoryArc } from '../storyarc.js';

export const YOUTH_BODY_ARCS: StoryArc[] = [
  {
    id: 'youth-body-growing-pains', title: 'Two in the Morning', icon: '🌙', category: 'crisis',
    minTurn: 1, maxTurn: 30, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It wakes him again: a deep ache in both shins, under the bone rather than on it, the kind you cannot rub out. Nothing happened to cause it. It arrives around two most nights this month and goes by breakfast, which somehow makes it harder to explain to anyone.',
        choices: [
          { id: 'endure', label: 'Lie still and wait it out', desc: 'It always goes. Waking the house would only make it a thing', outcome: 'He lies with his heels flat against the cold part of the sheet and counts backwards from three hundred. It goes at some point; he never notices when. He is tired at school and fine by Thursday, and he does this for most of a year.', effect: { meters: { school: 4 }, energy: -6, attr: { composure: 2 } } },
          { id: 'tell', label: 'Say something in the morning', desc: 'Describe it properly, even though it sounds like nothing', outcome: 'He describes it badly over cereal — under the bone, not on it — and gets warm baths, a hot water bottle and someone checking on him for a week. It does not stop the ache. It stops him lying awake alone with it.', effect: { energy: 3, meters: { family: 6 } } },
          { id: 'stretch', label: 'Get up and stretch it out', desc: 'Calves against the skirting board at two in the morning', outcome: 'He works out, by trial and error on a cold landing, which stretch takes the edge off. It is a small competence and entirely his own, and he will still be doing that stretch at twenty-five.', effect: { energy: -3, attr: { stamina: 1, composure: 1 } } },
        ],
      },
    },
  },

  {
    id: 'youth-body-packed-lunch', title: 'The Lunchbox', icon: '🥪', category: 'offpitch',
    minTurn: 0, maxTurn: 28, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Training is straight after school on Tuesdays, which means the last thing in his body by half six is a sandwich eaten at half twelve. By the second half of the session his legs go hollow and stupid. Somebody has told him this is what food is for, and it had genuinely not occurred to him.',
        choices: [
          { id: 'banana', label: 'Start carrying something to eat at four', desc: 'A banana and a cereal bar in the side of the bag, every day', outcome: 'It is a fussy little routine and he feels daft doing it on the bus. The hollow hour stops happening. He does not connect the two for a month, and then he does, permanently.', effect: { energy: 6, attr: { stamina: 1 } } },
          { id: 'chips', label: 'Get chips on the way with the others', desc: 'Hot, immediate, and what everyone else does', outcome: 'Warm and good and heavy. He does the first twenty minutes with a stone in his stomach and the last twenty with nothing left at all, and he keeps doing it anyway, because the walk to the chip shop is the best part of Tuesday.', effect: { energy: -4 } },
          { id: 'nothing', label: 'Just get on with it', desc: 'Everyone else manages. It is only tiredness', outcome: 'He gets on with it. He is not bad in the hollow hour, only ordinary, and ordinary is easy to be for years without ever knowing why.', effect: { energy: -2, attr: { composure: 1 } } },
        ],
      },
    },
  },

  {
    id: 'youth-body-blisters', title: 'Boots a Size Too Small', icon: '🩹', category: 'crisis',
    minTurn: 2, maxTurn: 32, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His feet have gone up two sizes since Christmas and the boots have not. He curls his toes to fit them, which he has stopped noticing he does. On Saturday he peels off a sock and takes a coin of skin with it, and the boot is his favourite thing he owns.',
        choices: [
          { id: 'admit', label: 'Admit they do not fit', desc: 'Say it out loud, even though replacing them is a whole conversation', outcome: 'He says it, and there is a pause with money in it, and then it gets sorted with a trip to the retail park and something less nice than he had. The new ones are stiff and honest and his feet stop bleeding.', effect: { meters: { family: -3 }, energy: 6, attr: { composure: 1 } } },
          { id: 'plasters', label: 'Tape it and keep going', desc: 'Two plasters, thicker socks, say nothing', outcome: 'The tape works for a fortnight. Then the blister goes under the callus and comes up somewhere new, and he starts landing slightly differently to protect it without deciding to. Small things become other things that way.', effect: { energy: -5, attr: { aggression: 1 }, tag: 'body-bad-boots' }, next: 'later' },
          { id: 'borrow', label: 'Wear the spare pair from the kit bag', desc: 'Ugly, a size big, nobody\'s', outcome: 'They flap and they are the wrong colour and he is quietly mortified for three weeks. He also runs, for the first time in months, without thinking about his feet at all.', effect: { energy: 4, meters: { peers: -2 }, attr: { stamina: 1 } } },
        ],
      },
      later: {
        id: 'later',
        prompt: 'A month on he is walking with the outside of his right foot and his knee has begun to complain on stairs. The boots still fit exactly as badly as they did.',
        choices: [
          { id: 'stop', label: 'Bin them', desc: 'Accept the boots are finished, favourite or not', outcome: 'He puts them in the bin himself and then takes them out again and puts them on top of the wardrobe. The knee quietens within a fortnight and he never quite trusts a tight boot again.', effect: { energy: 5, attr: { composure: 1 } } },
          { id: 'season', label: 'Get to the end of the season in them', desc: 'Six weeks. He can do six weeks', outcome: 'He gets to the end of the season in them and plays the last month at about eight-tenths of himself, which nobody remarks on because eight-tenths of him is still fine.', effect: { energy: -6, form: -0.06, attr: { aggression: 1 } } },
        ],
      },
    },
  },

  {
    id: 'youth-body-late-nights', title: 'One More Game', icon: '🎮', category: 'offpitch',
    minTurn: 3, maxTurn: 34, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has found the hour after midnight. It is his — nobody wants anything from him in it, the house is quiet, the screen is bright. He is getting up at seven and arriving at Thursday training feeling like he has been wrung out and hung on a line, and the two facts sit in his head without touching.',
        choices: [
          { id: 'cut', label: 'Put the phone on the landing', desc: 'Out of the room entirely, every night, starting tonight', outcome: 'The first four nights are unbearably boring. By the second week he is asleep by eleven and waking before the alarm, and Thursday stops being something to survive. He misses the quiet hour and does not get it back.', effect: { energy: 10, attr: { composure: 2 }, tag: 'body-sleeps' } },
          { id: 'half', label: 'Keep it, but only on non-training nights', desc: 'A rule he sets himself and mostly keeps', outcome: 'He mostly keeps it. Mostly turns out to be about two nights in three, which is enough to fix half the problem and leave the other half exactly where it was.', effect: { energy: 4 } },
          { id: 'keep', label: 'Keep the hour', desc: 'It is the only part of the day that belongs to him', outcome: 'He keeps it, and pays for it in the last twenty minutes of every session for a year. He does not regret it, and that is a separate thing from it not costing him anything.', effect: { energy: -8, attr: { creativity: 1, flair: 1 } } },
        ],
      },
    },
  },

  {
    id: 'youth-body-heavy-cold', title: 'A Cold in the Wrong Week', icon: '🤧', category: 'crisis',
    minTurn: 4, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It arrives on the Monday of the week he most wanted to be sharp: thick head, hot face, a cough that lives behind his breastbone. He can still run. Running just costs about twice what it should, and there is a session on Wednesday he has been looking forward to since half term.',
        choices: [
          { id: 'rest', label: 'Sit the week out', desc: 'Two days on the sofa and come back clean', outcome: 'Two days of daytime television and a strange guilt. He comes back on Saturday breathing properly and slightly behind everyone, and is level with them again inside a fortnight.', effect: { energy: 8, form: -0.06, attr: { composure: 1 } } },
          { id: 'push', label: 'Train through it', desc: 'Nobody remembers who trained with a cold; they remember who was there', outcome: 'He trains, badly, twice. The cold goes down into his chest and stays for three weeks, and he spends February at about seventy per cent of himself, coughing on the walk home.', effect: { energy: -12, form: -0.1, attr: { aggression: 1 }, tag: 'body-chesty' } },
          { id: 'half', label: 'Go, but only do the ball work', desc: 'Skip the running, stay in the room', outcome: 'He does the technical half and stands out of the shuttles with his hood up, feeling neither ill enough to be excused nor well enough to be useful. It is the right call and it feels like nothing.', effect: { energy: 2, attr: { composure: 1, teamwork: 1 } } },
        ],
      },
    },
  },

  {
    id: 'youth-body-warm-up', title: 'The Boring Twenty Minutes', icon: '🧘', category: 'offpitch',
    minTurn: 0, maxTurn: 29, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The warm-up is the part he does with his eyes somewhere else — jog to the cone, jog back, the same swinging leg thing everyone does badly. Then one Saturday he goes into a tackle in the first minute cold and something in his groin gives a warning shot, and for ten minutes he cannot lengthen his stride.',
        choices: [
          { id: 'learn', label: 'Start doing it properly', desc: 'Actually feel where the stretch goes, every single time', outcome: 'It is deeply boring for about three months, and then it stops being boring because he can feel the difference in the first five minutes of a game. He is one of two boys in the squad who ever gets there.', effect: { attr: { stamina: 2, composure: 1 }, energy: 4, tag: 'body-warms-up' } },
          { id: 'own', label: 'Build his own version', desc: 'Ignore the group one, work out what his body actually needs', outcome: 'He arrives fifteen minutes early and does his own odd sequence in the corner, which looks like showing off and is not. It works, mostly, and it is his, entirely.', effect: { attr: { stamina: 1, creativity: 1 }, meters: { authority: -2 } } },
          { id: 'ignore', label: 'Carry on as he is', desc: 'It was a twinge. Bodies do that', outcome: 'It was a twinge, and bodies do that, and he gets away with it for two more years — which is exactly long enough to be certain the warm-up does not matter.', effect: { attr: { flair: 1 }, energy: -3 } },
        ],
      },
    },
  },

  {
    id: 'youth-body-changing-room', title: 'The Last One Changed', icon: '👕', category: 'offpitch',
    minTurn: 5, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Something has happened to the changing room this season. Half of them have shoulders now and one has to shave. He is the same shape he was in Year Six and has started doing his shirt off and on in one movement, facing the wall, timing it so nobody is looking.',
        choices: [
          { id: 'wall', label: 'Keep facing the wall', desc: 'It is nobody\'s business and it will pass', outcome: 'It passes, eventually, the way these things do. In the meantime he becomes the quietest person in a loud room, and finds he can hear a lot from there.', effect: { attr: { composure: 2 }, meters: { peers: -2 } } },
          { id: 'joke', label: 'Get the joke in first', desc: 'Say it about himself before anyone else can', outcome: 'He calls himself something unflattering while pulling the shirt over his head and the room laughs with him rather than at him. It costs a little to say and buys a whole season of being left alone.', effect: { meters: { peers: 6 }, attr: { flair: 1, composure: 1 } } },
          { id: 'gym', label: 'Decide to do something about it', desc: 'Press-ups on his bedroom floor, every night, badly', outcome: 'Forty press-ups a night on a carpet that burns his palms. Nothing visible happens for eight months. Then, quite suddenly, something does — and by then the habit is older than the reason for it.', effect: { attr: { stamina: 2 }, energy: -2, tag: 'body-press-ups' } },
        ],
      },
    },
  },

  {
    id: 'youth-body-water', title: 'The Bottle He Never Fills', icon: '💧', category: 'offpitch',
    minTurn: 2, maxTurn: 31, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He gets headaches on Saturday afternoons. Behind the eyes, always after games, always gone by tea. His water bottle comes home about as full as it went, because drinking is something you do when you have stopped, and he does not much like stopping.',
        choices: [
          { id: 'fix', label: 'Drink on every break, whether he wants to or not', desc: 'Make it a rule with no feeling attached', outcome: 'It is an oddly hard habit to build for something so easy. Three weeks in, the Saturday headaches simply stop, and it is almost annoying that it was that.', effect: { energy: 6, attr: { stamina: 1 } } },
          { id: 'dismiss', label: 'Assume it is just what Saturdays feel like', desc: 'Everybody has a head on them after a game', outcome: 'He assumes it, for years. He is a slightly worse player in the last fifteen minutes than in the first fifteen for the whole of that time, and nobody, including him, ever names the reason.', effect: { energy: -5, form: -0.04 } },
        ],
      },
    },
  },

  {
    id: 'youth-body-eyes', title: 'The Bottom Two Lines', icon: '👓', category: 'crisis',
    minTurn: 6, maxTurn: 38, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A routine appointment he had no feelings about. He gets to the bottom two lines of the chart and guesses, confidently, and the room goes quiet in a particular way. It turns out the far post has been slightly soft-edged his entire life and he had assumed everyone\'s was.',
        choices: [
          { id: 'contacts', label: 'Learn to put lenses in', desc: 'Twenty minutes a morning of poking himself in the eye', outcome: 'Ten days of watering eyes and swearing at a mirror. Then a Tuesday session where he sees a runner make the far post before the runner does, and has to stand still for a second at how much of it he had been guessing.', effect: { attr: { creativity: 2, composure: 1 }, form: 0.08, tag: 'body-lenses' } },
          { id: 'glasses', label: 'Glasses off the pitch, squint on it', desc: 'Wear them for homework, manage without for football', outcome: 'His schoolwork gets easier almost overnight. It is a strange sort of consolation. On the pitch he goes on playing the game he built for a blurry world: close, quick, and never quite trusting the long ball.', effect: { meters: { school: 6 }, attr: { flair: 1 } } },
          { id: 'hide', label: 'Tell nobody at the club', desc: 'It is not a thing until somebody makes it a thing', outcome: 'He keeps it to himself and gets very good at reading shoulders and hips instead of watching the ball travel. It is a real skill, learned for a bad reason, and it never leaves him.', effect: { attr: { creativity: 1, composure: 1 }, meters: { authority: -2 } } },
        ],
      },
    },
  },

  {
    id: 'youth-body-first-hurt', title: 'The First Session That Hurt', icon: '🥵', category: 'saga',
    minTurn: 1, maxTurn: 30, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Football has never hurt before. It has been tiring, which is different. Tonight the running goes past tiring into somewhere new — a taste like coins, legs that belong to someone else, the strange discovery that his body has a floor and he has just found it. There are eight minutes left.',
        choices: [
          { id: 'finish', label: 'Finish the eight minutes', desc: 'Slower, uglier, but finish', outcome: 'He finishes them badly and is sick on the grass behind the goal, and then sits in the car with the window down feeling, for reasons he cannot explain, enormous. He will chase that feeling for twenty years.', effect: { energy: -8, attr: { stamina: 2, aggression: 1 }, tag: 'body-found-the-floor' }, next: 'after' },
          { id: 'stop', label: 'Pull up and walk it off', desc: 'There is no medal for the last eight minutes of a Tuesday', outcome: 'He walks the last two laps with his hands on his head, and nobody says anything about it, and he thinks about it all the way home and half of Wednesday.', effect: { energy: -2, attr: { composure: 1 }, tag: 'body-stopped-short' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'He wakes on Wednesday unable to properly bend at the hips and laughs out loud at how much stairs hurt. There is a session on Thursday.',
        choices: [
          { id: 'go', label: 'Go on Thursday anyway', desc: 'Move it out, even if it is rubbish', outcome: 'He is rubbish for the first twenty minutes and then, oddly, better than usual. He learns that soreness is weather rather than injury, which is one of the more useful things he will ever learn.', effect: { attr: { stamina: 1, composure: 1 }, energy: -3 } },
          { id: 'rest', label: 'Give it a day', desc: 'Let the legs come back before asking again', outcome: 'He gives it the day and comes back fresh on Saturday. It is the sensible call, and a small part of him files it away as the day he did not go.', effect: { energy: 6 } },
        ],
      },
    },
  },

  {
    id: 'youth-body-smallest', title: 'Still Waiting', icon: '📏', category: 'crisis',
    minTurn: 3, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The doorframe at home has pencil marks on it, and this year\'s is barely above last year\'s. Boys he was taller than in September now head balls he cannot reach jumping. Nothing has gone wrong with him. He is simply waiting for something that has already happened to everyone else.',
        choices: [
          { id: 'adapt', label: 'Play the game his size can play', desc: 'Get it down, get it moving, stop trying to win headers', outcome: 'He becomes a nuisance at knee height — first to the second ball, impossible to shoulder off because there is nothing to get hold of. When the height finally arrives it lands on top of a skill set the big lads never had to build.', effect: { meters: { peers: 5 }, attr: { creativity: 2, flair: 1 }, tag: 'body-small-skills' }, next: 'later' },
          { id: 'fight', label: 'Refuse to be moved off it', desc: 'Go into everything, give away nothing', outcome: 'He gets flattened a lot and gets up faster than anyone expects, and the flattening stops being worth their while. He also spends the season covered in bruises he does not mention at home.', effect: { meters: { family: 5 }, attr: { aggression: 2 }, energy: -5, tag: 'body-small-fight' }, next: 'later' },
          { id: 'shrink', label: 'Stop going where the contact is', desc: 'Find the space instead of the collision', outcome: 'He drifts to where nobody is, which keeps him on the ball and out of trouble, and slowly teaches him a habit of avoidance that will take years to unpick.', effect: { attr: { creativity: 1 }, form: -0.06, tag: 'body-small-avoid' }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'In April someone measures the doorframe again and there is a gap of four centimetres in six weeks. His shorts are suddenly the wrong length and his knees ache constantly. It is starting.',
        choices: [
          { id: 'patient', label: 'Let it happen and keep it simple', desc: 'Short passes, low centre of gravity, no heroics for a while', outcome: 'He plays within himself for two months while the new legs arrive, and looks ordinary doing it. In September he is four centimetres taller and can still do everything the small boy could.', effect: { attr: { composure: 2, stamina: 1 }, energy: 4 } },
          { id: 'test', label: 'Start using the height straight away', desc: 'Go and win a header, just to know he can', outcome: 'He goes up for one he would never have gone up for and wins it, and grins about it for a week. He also learns that a body arriving in pieces will let you down at the worst moment, twice, before it settles.', effect: { attr: { aggression: 1 }, form: 0.06, energy: -4 } },
        ],
      },
    },
  },

  {
    id: 'youth-body-secret-niggle', title: 'The One He Does Not Mention', icon: '🤫', category: 'crisis',
    minTurn: 7, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a spot low on the front of his hip that goes when he strikes across the ball. Not pain exactly — a warning. He has developed a way of striking that avoids it and a way of jogging out the first ten minutes that hides it, and both of these are now automatic.',
        choices: [
          { id: 'declare', label: 'Say it out loud before the week starts', desc: 'Name it while it is still small and boring', outcome: 'He says it and is given ten days of not doing the thing that hurts. Dull, and it works. He is behind for a fortnight and completely fine by the end of the month.', effect: { energy: 5, form: -0.06, meters: { authority: 3 }, attr: { composure: 2 } } },
          { id: 'manage', label: 'Manage it quietly', desc: 'Warm it up longer, ice it after, tell nobody', outcome: 'He becomes an expert in his own hip: what makes it worse, what buys him ninety minutes. It holds for four months. It is also the beginning of a lifelong habit of not saying things.', effect: { attr: { composure: 1, aggression: 1 }, energy: -4, tag: 'body-hides-niggles' }, next: 'after' },
          { id: 'ignore', label: 'Strike through it and see', desc: 'Hit one properly and find out if it is real', outcome: 'He hits one properly on the Thursday and it is real. Six weeks of not much, and a small permanent carefulness about that side.', effect: { injury: true, energy: -10, form: -0.12 } },
        ],
      },
      after: {
        id: 'after',
        prompt: 'By March the compensating has spread: the other hip is tight now, and he lands slightly wrong on that side. Someone would only have to ask the right question.',
        choices: [
          { id: 'own', label: 'Tell the truth about all of it', desc: 'Four months of it, all at once', outcome: 'It is an embarrassing conversation, mostly because of how long the list is. It is also over in ten minutes, and the relief of not carrying it lasts far longer than the two weeks he sits out.', effect: { energy: 8, meters: { authority: 4 }, attr: { leadership: 1, composure: 1 } } },
          { id: 'carry', label: 'Carry it to the end of the season', desc: 'He has got this far. It is eleven weeks', outcome: 'He gets to the end of the season carrying two things instead of one, playing a slightly smaller version of his own game, and everyone agrees it was a solid if unremarkable year for him.', effect: { energy: -8, form: -0.08, attr: { aggression: 1 } } },
        ],
      },
    },
  },

  {
    id: 'youth-body-fill-out', title: 'Told to Fill Out', icon: '🍽️', category: 'offpitch',
    minTurn: 8, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The word used about him this year is "slight". It is not said unkindly, and it lands the way "slight" lands. He goes home and looks at himself sideways in the mirror on the wardrobe door for longer than he would admit to, and thinks about how you would even go about becoming a different size.',
        choices: [
          { id: 'proper', label: 'Eat properly, three times a day, boringly', desc: 'Breakfast he does not want. Something after training, always', outcome: 'Eating when he is not hungry turns out to be genuinely difficult and completely unglamorous. Over eleven months he puts on the better part of a stone, none of it dramatic, all of it useful.', effect: { attr: { stamina: 2 }, energy: 6, tag: 'body-filled-out' } },
          { id: 'stuff', label: 'Eat everything he can, quickly', desc: 'Volume. Whatever is in the cupboard, twice', outcome: 'He gets heavier in about six weeks and slower in about seven. It takes him most of a year to work out that the two were the same fact, and to undo it.', effect: { energy: -4, form: -0.06 } },
          { id: 'refuse', label: 'Decide slight is a way of playing, not a fault', desc: 'Get better at not being touched instead', outcome: 'He builds a game around never being where the shoulder is: half a yard earlier on everything, first touch always away from the contact. Some weeks it is beautiful. Some weeks he gets knocked off it in the first minute and stays off it.', effect: { attr: { creativity: 2, flair: 1 }, form: -0.02 } },
        ],
      },
    },
  },

  {
    id: 'youth-body-after-game-food', title: 'What He Eats at Five', icon: '🍟', category: 'offpitch',
    minTurn: 6, maxTurn: 37, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The hour after a Saturday game is the hungriest he ever is. It is also the hour where there is nothing in reach but a garage, a chip shop and a vending machine that eats pound coins, and where nobody at all is watching what he does.',
        choices: [
          { id: 'plan', label: 'Have something in the bag for exactly this hour', desc: 'A sandwich made that morning, unglamorous, already there', outcome: 'He eats a slightly squashed sandwich in a car park while the others queue for chips. It is a small unfashionable discipline and it does more for the rest of his Saturday than any of them will believe.', effect: { energy: 6, attr: { stamina: 1 }, meters: { peers: -2 } } },
          { id: 'chips', label: 'Chips with everyone', desc: 'The queue is where the week gets talked about', outcome: 'The queue is genuinely the best part of the week and he would not give it up for anything. He also arrives at Sunday feeling like he never quite finished Saturday.', effect: { meters: { peers: 6 }, energy: -4 } },
          { id: 'nothing', label: 'Wait until he gets home', desc: 'Two hours. It is only two hours', outcome: 'He waits, and eats an enormous tea at eight, and goes to bed too full to sleep well. He does this most weeks for years without ever considering that there was another option.', effect: { energy: -3 } },
        ],
      },
    },
  },

  {
    id: 'youth-body-shin-splints', title: 'Shins', icon: '🦴', category: 'crisis',
    minTurn: 12, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A hot line down the inside of both shins that starts in the warm-up now instead of at the end. He has been playing on hard summer ground four times a week in boots with the studs worn flat, and his body has begun sending an invoice.',
        choices: [
          { id: 'stop', label: 'Stop running on it entirely for three weeks', desc: 'No pitch. Bikes, pool, ball work standing still', outcome: 'Three weeks of the most boring exercise ever invented, watching sessions from the side in a coat in July. The shins go quiet and stay quiet, and he comes back in August having lost nothing that mattered.', effect: { energy: 6, form: -0.08, attr: { composure: 2 }, tag: 'body-shins-managed' } },
          { id: 'reduce', label: 'Cut the running, keep playing games', desc: 'Skip the shuttles, play the matches', outcome: 'A reasonable compromise that half works. The shins settle to a background hum he can live with, and come back every single pre-season for the rest of his career like an old letter.', effect: { energy: -3, attr: { aggression: 1 } } },
          { id: 'through', label: 'Run through it', desc: 'It is only shins. Everyone gets it', outcome: 'It is only shins until it is a stress fracture in the left one, found in September, eight weeks after he could first have stopped.', effect: { injury: true, energy: -12, form: -0.12 } },
        ],
      },
    },
  },

  {
    id: 'youth-body-summer-quick', title: 'The Summer He Got Quick', icon: '⚡', category: 'triumph',
    minTurn: 14, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nothing was trained for it. He goes away in July as one of the tidy ones and comes back in August and finds, in the first minute of the first session, that he arrives at things before he expects to. It is not a small change. It is a different body doing the same job.',
        choices: [
          { id: 'lean', label: 'Use it — go past people, over and over', desc: 'Find out where the ceiling of this new thing is', outcome: 'He spends September running at defenders for the joy of it, and beating most of them, and it is the most fun football has ever been. He also stops passing for about a month. People notice.', effect: { attr: { flair: 2, aggression: 1 }, form: 0.12, meters: { peers: -2 }, tag: 'body-got-quick' }, next: 'after' },
          { id: 'fold', label: 'Fold it into what he already does', desc: 'Same game, half a yard earlier', outcome: 'He does not change a thing on the outside. Everything he already did simply starts working, because he is arriving early enough to have a choice. It is much less exciting and much harder to defend against.', effect: { attr: { composure: 2, creativity: 1 }, form: 0.08, tag: 'body-got-quick' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'By November the others have grown too, and the yard is not free any more. He is fast among fast boys instead of fast among boys.',
        choices: [
          { id: 'work', label: 'Keep the speed by working at it', desc: 'It was given once. It has to be earned from here', outcome: 'He starts doing the dull specific things that keep a body quick, and is quick for the next fifteen years. Nobody who meets him later believes it was ever a gift.', effect: { attr: { stamina: 2 }, energy: -3 } },
          { id: 'skill', label: 'Go back to being the clever one', desc: 'The pace was a loan. The rest is his', outcome: 'He goes back to the game he had before, carrying the pace as a spare rather than a plan, and is a harder player to play against than either version was alone.', effect: { attr: { creativity: 2, composure: 1 } } },
        ],
      },
    },
  },

  {
    id: 'youth-body-dentist', title: 'The Tooth', icon: '🦷', category: 'offpitch',
    minTurn: 11, maxTurn: 42, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has been chewing on one side for two months and thought nothing of it, the way you think nothing of most things. It turns out to be a proper problem, several appointments deep, and it explains the headaches and possibly the fact that he has been sleeping like someone with something on his mind.',
        choices: [
          { id: 'sort', label: 'Get it all sorted, appointments and all', desc: 'Miss two sessions for a dentist. Feel ridiculous about it', outcome: 'He misses two Thursdays for something with no glamour in it whatsoever. He also sleeps properly for the first time since spring, and stops noticing his own head — a head is meant to do exactly that.', effect: { energy: 8, form: 0.04, attr: { composure: 1 } } },
          { id: 'delay', label: 'Put it off until after the season', desc: 'Six weeks. He can chew on one side for six weeks', outcome: 'He puts it off, and chews on one side, and carries a low grey headache into every game in April without ever once connecting the two.', effect: { energy: -6, form: -0.06 } },
          { id: 'guard', label: 'Get a mouthguard while he is there', desc: 'Since he is in the chair anyway', outcome: 'A moulded guard that tastes of nothing and makes him talk like an idiot for the first week. He goes into contact very slightly differently afterwards, the way you do when a thing is protected.', effect: { attr: { aggression: 1, composure: 1 } } },
        ],
      },
    },
  },

  {
    id: 'youth-body-last-year', title: 'What He Could Do Last Year', icon: '🔁', category: 'crisis',
    minTurn: 16, maxTurn: 48, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a turn he has done since he was ten — drop the shoulder, roll it, gone. He goes to do it on Tuesday and his body performs a rough approximation of it, half a beat late, like a translation. Nothing hurts. It is just that the machine has been rebuilt over the summer and nobody sent him the new manual.',
        choices: [
          { id: 'drill', label: 'Rebuild it from scratch, slowly', desc: 'Cone, ball, an hour on his own, until the new legs learn it', outcome: 'Six weeks of doing something badly that he used to do without thinking, alone, after everyone has gone in. In October it comes back, and it is faster than it ever was, because it is being done by a bigger boy.', effect: { attr: { flair: 2, stamina: 1 }, energy: -4, tag: 'body-rebuilt-the-turn' } },
          { id: 'shelve', label: 'Shelve it and play the simple stuff', desc: 'Two touches, right choices, wait for the body to settle', outcome: 'He plays a plain, tidy, useful autumn and lets his body get on with its business. The turn returns on its own in the spring, unannounced, in a game that did not matter.', effect: { attr: { composure: 2, teamwork: 1 }, form: -0.04 } },
          { id: 'force', label: 'Keep trying it in games', desc: 'He is not giving up the best thing he does', outcome: 'He tries it eleven times in four games and it comes off twice, and both times it is worth it. The other nine are turnovers, and he is quietly moved to a part of the pitch where turnovers matter less.', effect: { attr: { flair: 1, aggression: 1 }, form: -0.1, meters: { authority: -3 } } },
        ],
      },
    },
  },
];
