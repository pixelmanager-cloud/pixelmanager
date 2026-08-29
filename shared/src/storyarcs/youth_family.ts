// ── YOUTH FAMILY ARCS — home, parents, siblings, grandparents (Grassroots + Academy, ages 10-14) ──
// Everything in this file happens at the kitchen table, in the car, or in somebody's front room. No coaches,
// no scouts, no school — those are other people's chapters. A boy this age doesn't earn and isn't worth
// anything to anyone except the people who wash his kit, so no earnings/market/greed ever appear here.
// Meters used are only those live in childhood: family (Parents), authority (his Coach), peers (Mates),
// school. The register is understated British realism: small sacrifices, small resentments, no speeches.
import type { StoryArc } from '../storyarc.js';

export const YOUTH_FAMILY_ARCS: StoryArc[] = [
  {
    id: 'youth-fam-redundancy', title: 'The Envelope on the Worktop', icon: '📄', category: 'crisis',
    minTurn: 3, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His dad is home on a Tuesday afternoon in his work clothes, sitting at the table with the kettle not switched on. The letter stays on the worktop for three days before anyone moves it. Nobody says the word, but the subs for next season are due at the end of the month.',
        choices: [
          { id: 'offer', label: 'Offer to stop for a bit', desc: 'Say he\'ll skip the season if it helps', outcome: 'He offers, quietly, over the washing up. His dad tells him not to be daft and then has to leave the room for a minute.', effect: { meters: { family: 10 }, attr: { composure: 1 }, tag: 'fam-offered-to-quit' }, next: 'month' },
          { id: 'quiet', label: 'Say nothing and keep going', desc: 'Don\'t make it another thing they have to carry', outcome: 'He acts like he hasn\'t noticed anything, which is its own kind of work. He stops asking for anything at all that winter.', effect: { meters: { family: 5 }, attr: { composure: 1, stamina: 1 }, energy: -4, tag: 'fam-said-nothing' }, next: 'month' },
          { id: 'ask', label: 'Ask him straight out', desc: 'He\'s eleven, not stupid — ask what\'s happening', outcome: 'He asks. His dad tells him the truth, more of it than he meant to, and something shifts between them that doesn\'t shift back.', effect: { meters: { family: 8 }, attr: { leadership: 1 }, tag: 'fam-asked-straight' }, next: 'month' },
        ],
      },
      month: {
        id: 'month',
        prompt: 'The subs get paid. He finds out later they came out of the holiday money, and that nobody was ever going to tell him.',
        choices: [
          { id: 'repay', label: 'Play like it was borrowed', desc: 'Treat every session as something owed', outcome: 'He trains like a boy paying off a debt. It makes him relentless, and it takes him years to learn to just enjoy it again.', effect: { form: 0.08, energy: -8, attr: { stamina: 1, aggression: 1 }, meters: { family: 6, authority: 6 } } },
          { id: 'thanks', label: 'Just say thank you', desc: 'No grand gesture — say it and mean it', outcome: 'He says thanks and leaves it there. His mum tells him years later it was the only time that whole autumn she felt like they were winning.', effect: { meters: { family: 12 }, attr: { composure: 1, teamwork: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-mum-played', title: 'She Was Better Than Him', icon: '⚽', category: 'relationship',
    minTurn: 1, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A box in the loft: his mum, sixteen, in a county shirt, holding a trophy he\'s never heard of. She played until there was nowhere left to play. She has never once mentioned it, and she watches every one of his games from the far corner of the pitch saying nothing.',
        choices: [
          { id: 'ask', label: 'Ask her about it', desc: 'Get the box down and make her talk', outcome: 'She talks for an hour, then stops abruptly and puts the lid back on. But after that she stands nearer the halfway line.', effect: { meters: { family: 10 }, attr: { creativity: 1 }, tag: 'fam-mum-talked' }, next: 'garden' },
          { id: 'leave', label: 'Put the lid back on', desc: 'Some boxes are in the loft for a reason', outcome: 'He puts it back exactly as he found it. He looks at her differently on the touchline from then on, and never tells her why.', effect: { meters: { family: 5 }, attr: { composure: 1 }, tag: 'fam-mum-quiet' }, next: 'garden' },
        ],
      },
      garden: {
        id: 'garden',
        prompt: 'On a light evening she comes out to the garden in her work shoes and asks for the ball.',
        choices: [
          { id: 'learn', label: 'Let her show him something', desc: 'Take the coaching from the one person who never gives it', outcome: 'She shows him a way of taking the ball across her body that nobody at the club has taught him. It stays in his game for twenty years.', effect: { attr: { creativity: 1, flair: 1 }, meters: { family: 10 }, form: 0.05 } },
          { id: 'beat', label: 'Try to nutmeg his mum', desc: 'He\'s a kid and she\'s in work shoes — easy', outcome: 'She takes it off him twice and doesn\'t gloat, which is worse. He goes to bed furious and gets up early to practise.', effect: { attr: { flair: 1, aggression: 1 }, meters: { family: 8 }, energy: -4 } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-absent-dad', title: 'The Space by the Fence', icon: '🚪', category: 'saga',
    minTurn: 2, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His dad said he\'d come to this one. At kick-off there is a gap by the fence where he isn\'t, and the boy spends the first twenty minutes checking it instead of watching the ball. He plays the second half like he doesn\'t care, which fools nobody.',
        choices: [
          { id: 'stop', label: 'Stop looking at the fence', desc: 'Decide, at eleven, to stop expecting him', outcome: 'He makes himself watch only the ball. It works, mostly, and it costs him something he can\'t name yet.', effect: { attr: { composure: 2 }, meters: { family: -4 }, form: 0.05, tag: 'fam-stopped-looking' }, next: 'later' },
          { id: 'ring', label: 'Ring him after', desc: 'Give him the chance to explain', outcome: 'The phone rings out. He leaves a message about the game that is far more cheerful than he feels.', effect: { meters: { family: -2 }, attr: { teamwork: 1 }, energy: -4, tag: 'fam-rang-dad' }, next: 'later' },
          { id: 'nan', label: 'Walk home with whoever did come', desc: 'Somebody was there — go home with them', outcome: 'His nan walks him home the long way and buys chips and doesn\'t mention his dad once. It is exactly the right amount of talking.', effect: { meters: { family: 8 }, attr: { composure: 1 }, tag: 'fam-nan-walked' }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'Months on, his dad turns up at a game unannounced, standing right where the gap used to be, shouting encouragement like a man who has been there all along.',
        choices: [
          { id: 'play', label: 'Play the best game of his life', desc: 'Show him exactly what he\'s been missing', outcome: 'He scores twice and doesn\'t look at the fence once. His dad tells everyone in the car park that he gets it from him.', effect: { form: 0.1, energy: -8, attr: { flair: 1, aggression: 1 }, meters: { family: 4, peers: 4 } } },
          { id: 'normal', label: 'Play his normal game', desc: 'Don\'t let the man on the touchline change anything', outcome: 'He plays exactly as he would have anyway. Afterwards he says thanks for coming, in the voice you\'d use on a neighbour.', effect: { attr: { composure: 2 }, form: 0.04, meters: { family: -2, authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-nans-house', title: 'Sunday at Nan\'s', icon: '🍽️', category: 'relationship',
    minTurn: 0, maxTurn: 34, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Sunday dinner at his nan\'s has happened every week since before he was born, at one o\'clock, no exceptions. This season the fixtures go up and half of them kick off at half twelve. His mum reads the list out loud at the table and nobody eats for a second.',
        choices: [
          { id: 'football', label: 'Miss the dinners', desc: 'Play the games, eat at nan\'s when he can', outcome: 'His nan says of course, love, and keeps a plate under foil for him every single week whether he comes or not.', effect: { meters: { family: -4, authority: 6 }, attr: { stamina: 1 }, tag: 'fam-missed-sundays' }, next: 'plate' },
          { id: 'nan', label: 'Keep the dinners', desc: 'Some things are older than football', outcome: 'He tells the club he can\'t do the early kick-offs. His nan never finds out that was a choice, which is how he wants it.', effect: { meters: { family: 12, authority: -6 }, attr: { teamwork: 1 }, tag: 'fam-kept-sundays' }, next: 'plate' },
          { id: 'move', label: 'Ask nan to move it to five', desc: 'Change a thirty-year habit for a child\'s hobby', outcome: 'She moves it. Nobody says how big that is, but his grandad mentions the new time to everyone he meets for a fortnight.', effect: { meters: { family: 8 }, attr: { leadership: 1 }, tag: 'fam-moved-sundays' }, next: 'plate' },
        ],
      },
      plate: {
        id: 'plate',
        prompt: 'In February his nan is in hospital for a week and there is no dinner at all. The house on Sunday is very quiet.',
        choices: [
          { id: 'cook', label: 'Try to do it himself', desc: 'A twelve-year-old and a bag of potatoes', outcome: 'It is a disaster and everyone eats it anyway. His grandad says it was nearly as good as hers, which is a lie they all accept.', effect: { meters: { family: 12 }, attr: { leadership: 1, teamwork: 1 } } },
          { id: 'visit', label: 'Go and sit with her instead', desc: 'Miss training, take the fixture list in', outcome: 'He reads her the fixtures off the sheet and she makes him do the away ones twice. She is home by the following Sunday.', effect: { meters: { family: 10, authority: -4 }, attr: { composure: 1 }, energy: 4 } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-holiday', title: 'A Week in Wales', icon: '🏖️', category: 'offpitch',
    minTurn: 4, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The caravan is booked for the last week of August — it has been booked since January, and it is the only week off his mum gets all year. The tournament everyone has been talking about lands squarely in the middle of it.',
        choices: [
          { id: 'go', label: 'Go on the holiday', desc: 'One week, one family, one caravan', outcome: 'He goes. He is sulky for two days and fine after that, and he swims in the sea with his little sister until his lips go blue.', effect: { energy: 12, meters: { family: 12, peers: -4, authority: -4 }, tag: 'fam-went-away' }, next: 'back' },
          { id: 'stay', label: 'Stay for the tournament', desc: 'Ask to stop at a mate\'s for the week', outcome: 'They let him. His mum sends a photo of the beach every day, and he doesn\'t work out until much later why that hurt.', effect: { form: 0.06, energy: -8, meters: { family: -8, peers: 8, authority: 6 }, tag: 'fam-stayed-back' }, next: 'back' },
          { id: 'half', label: 'Half the week each', desc: 'Drive back on the Wednesday for the games', outcome: 'His dad does a six-hour round trip mid-holiday without complaining once, and falls asleep in a deckchair every afternoon after.', effect: { energy: -4, meters: { family: 4, authority: 4 }, attr: { stamina: 1 }, tag: 'fam-split-week' }, next: 'back' },
        ],
      },
      back: {
        id: 'back',
        prompt: 'September. The photos from the caravan go up on the fridge, and one of them has an obvious space in it.',
        choices: [
          { id: 'own', label: 'Own the choice', desc: 'Say it out loud rather than let it sit', outcome: 'He says he\'d make the same call again, and that he\'s sorry it hurt. Both halves of that land.', effect: { attr: { leadership: 1, composure: 1 }, meters: { family: 8 } } },
          { id: 'promise', label: 'Promise next year is theirs', desc: 'One year off, whatever\'s on', outcome: 'He promises. He keeps it, too — for one summer — and it becomes the week the whole family talks about for years.', effect: { meters: { family: 12 }, attr: { teamwork: 1 }, energy: 4 } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-nan-ill', title: 'The Chair by the Window', icon: '🪟', category: 'crisis',
    minTurn: 6, maxTurn: 44, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His nan has been ill since the spring and now watches from a chair by the front window instead of the touchline. She asks about every game in enormous detail — the weather, the pitch, who played left-back — because the detail is the only way she gets to be there.',
        choices: [
          { id: 'detail', label: 'Give him every last detail', desc: 'Come home and talk him through all ninety minutes', outcome: 'He learns to describe a match properly: the shape, the moment it turned, the mistake nobody else spotted. It changes how he watches football.', effect: { attr: { creativity: 1, composure: 1 }, meters: { family: 12 }, tag: 'fam-match-reports' }, next: 'after' },
          { id: 'film', label: 'Get someone to film it for him', desc: 'A phone on the fence beats a description', outcome: 'His dad films it badly, mostly sky and shouting. His nan watches all of it twice, sky included.', effect: { meters: { family: 10 }, attr: { teamwork: 1 }, tag: 'fam-filmed-for-him' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'On a Saturday in November the game is at eleven and the hospital visiting hour is at eleven too.',
        choices: [
          { id: 'hospital', label: 'Go to the hospital', desc: 'There will be other games', outcome: 'He goes. His grandad is annoyed with him for missing it, and holds his hand the whole time he\'s telling him off.', effect: { meters: { family: 14, authority: -6 }, attr: { composure: 1 }, energy: -4 } },
          { id: 'play', label: 'Play, because he asked him to', desc: 'She was very clear about it', outcome: 'He plays because she told him to, and gets to the ward at two with mud still on his knees to report back. That was the point.', effect: { form: 0.06, meters: { family: 10, authority: 6 }, attr: { stamina: 1, composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-split', title: 'Two Front Doors', icon: '🔑', category: 'crisis',
    minTurn: 5, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His dad has a flat now, on the other side of town, with a spare duvet and no kit bag. Training nights fall on the wrong side of the arrangement, and the two adults are being extremely polite to each other about it in a way that is worse than shouting.',
        choices: [
          { id: 'logistics', label: 'Sort the logistics himself', desc: 'Learn the buses, keep boots at both houses', outcome: 'He becomes twelve years old and horribly organised: two kit bags, two sets of shin pads, a timetable in his head.', effect: { attr: { leadership: 1, composure: 1 }, meters: { family: 6 }, energy: -6, tag: 'fam-two-bags' }, next: 'touchline' },
          { id: 'football', label: 'Let football be the one thing that doesn\'t change', desc: 'Whatever the week looks like, Tuesday is training', outcome: 'Training becomes the only fixed point in his week, and he clings to it in a way the coaches read as dedication.', effect: { form: 0.06, meters: { authority: 8, family: -2 }, attr: { stamina: 1 }, tag: 'fam-football-anchor' }, next: 'touchline' },
          { id: 'ask', label: 'Ask them to just talk to each other', desc: 'Say the thing everyone is avoiding', outcome: 'He asks them, at the kitchen table, to sort the Tuesdays out between them. They do. It costs him something to be the one who said it.', effect: { attr: { leadership: 2 }, meters: { family: 8 }, energy: -4, tag: 'fam-asked-them' }, next: 'touchline' },
        ],
      },
      touchline: {
        id: 'touchline',
        prompt: 'At the next home game they both come, and stand at opposite ends of the same touchline.',
        choices: [
          { id: 'both', label: 'Go to both of them at full time', desc: 'Walk one way, then the other', outcome: 'He does the long walk to each of them in turn. It becomes the routine for years, and he never once makes either wait.', effect: { attr: { teamwork: 1, composure: 1 }, meters: { family: 10 } } },
          { id: 'ignore', label: 'Pretend he can\'t see either of them', desc: 'Ninety minutes where none of it exists', outcome: 'For ninety minutes the touchline is empty in both directions and he plays free of all of it. He is very hard to get out of the changing room afterwards.', effect: { form: 0.08, attr: { composure: 2 }, meters: { family: -4, peers: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-stepdad', title: 'The Man Who Puts the Bins Out', icon: '🏠', category: 'relationship',
    minTurn: 12, maxTurn: 46, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His mum\'s new fella has been round every weekend since Easter and now keeps a coat on the hook. He knows nothing whatsoever about football, and he has started standing at the games anyway, in the wrong shoes, clapping at the wrong moments.',
        choices: [
          { id: 'teach', label: 'Teach him the game', desc: 'Explain offside to him in the car until he gets it', outcome: 'He explains it four times. By November the man is arguing about the offside law with strangers on the touchline, badly, on his behalf.', effect: { meters: { family: 10 }, attr: { leadership: 1, teamwork: 1 }, tag: 'fam-taught-him' }, next: 'boots' },
          { id: 'cold', label: 'Keep him at arm\'s length', desc: 'He\'s not his dad and he isn\'t going to pretend', outcome: 'He is polite and nothing more. The man keeps coming to the games anyway, every week, and never once asks for credit.', effect: { meters: { family: -4 }, attr: { composure: 1 }, tag: 'fam-arms-length' }, next: 'boots' },
        ],
      },
      boots: {
        id: 'boots',
        prompt: 'One night he comes downstairs and finds him at the back door with a nail brush, cleaning the mud out of his studs, because nobody asked him to.',
        choices: [
          { id: 'sit', label: 'Sit down and do the other boot', desc: 'Say nothing, pick up the brush', outcome: 'They clean boots in silence for ten minutes. It is the first evening the house feels like it has four people in it rather than three and a visitor.', effect: { meters: { family: 12 }, attr: { teamwork: 1, composure: 1 } } },
          { id: 'thanks', label: 'Say thanks and go back up', desc: 'Acknowledge it, but not too much', outcome: 'He says thanks and goes up. He hears the brush start again behind him, and lies awake thinking about it longer than he expected.', effect: { meters: { family: 6 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-uncle', title: 'The Uncle Who Knows', icon: '🗣️', category: 'offpitch',
    minTurn: 3, maxTurn: 40, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His uncle has never played above pub level and has an opinion on everything: that he\'s too slight, that he needs to shoot more, that a lad he knew was ten times better and never got a sniff. He delivers all of it at family gatherings, loudly, in front of everyone.',
        choices: [
          { id: 'nod', label: 'Nod and let it wash over him', desc: 'Nothing good comes from arguing at a buffet', outcome: 'He nods along and gives nothing back. His mum catches his eye across the room and he can see her deciding not to say anything either.', effect: { attr: { composure: 2 }, meters: { family: 4 }, tag: 'fam-let-it-go' }, next: 'pitch' },
          { id: 'argue', label: 'Argue back', desc: 'He\'s twelve and he\'s had enough', outcome: 'He tells him, in front of the whole kitchen, that he\'s never actually watched him play. The room goes quiet. His dad doesn\'t tell him off in the car.', effect: { attr: { aggression: 1, leadership: 1 }, meters: { family: -4 }, tag: 'fam-argued-back' }, next: 'pitch' },
          { id: 'listen', label: 'Take the one true thing out of it', desc: 'Somewhere in all that noise is a point about shooting', outcome: 'He decides the shooting bit is fair and spends the winter working on it. He never tells his uncle where the idea came from.', effect: { attr: { creativity: 1, flair: 1 }, form: 0.05, meters: { family: 4 }, tag: 'fam-took-the-note' }, next: 'pitch' },
        ],
      },
      pitch: {
        id: 'pitch',
        prompt: 'In March his uncle actually turns up to a game, on his own, and stands right at the back where he thinks nobody can see him.',
        choices: [
          { id: 'ignore', label: 'Play like he isn\'t there', desc: 'Don\'t give him the satisfaction of trying', outcome: 'He plays his ordinary, excellent game. His uncle doesn\'t say a word about football at Christmas, which everyone notices.', effect: { form: 0.05, attr: { composure: 1 }, meters: { family: 4 } } },
          { id: 'show', label: 'Give him something to talk about', desc: 'One outrageous thing, just for the back of the crowd', outcome: 'He tries the ridiculous finish and it comes off. His uncle claims to have predicted it for the next fifteen years.', effect: { attr: { flair: 2 }, form: 0.06, energy: -4, meters: { family: 6, peers: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-car', title: 'The Estate with the Dodgy Clutch', icon: '🚗', category: 'crisis',
    minTurn: 7, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The car dies on the ring road on a Saturday morning with three kits in the boot and forty minutes to kick-off. The garage quote is more than the car is worth. His mum reads it twice and puts her phone face down on the table.',
        choices: [
          { id: 'buses', label: 'Work out the buses', desc: 'Two changes, an hour and ten, a very early alarm', outcome: 'He does the route on paper and then does it, every week, in the dark half the winter. Nobody at the club ever finds out.', effect: { energy: -10, attr: { stamina: 1, composure: 1 }, meters: { family: 8 }, tag: 'fam-buses' }, next: 'lift' },
          { id: 'lifts', label: 'Ask around for lifts', desc: 'Swallow the pride and ask another family', outcome: 'A family two streets over say yes without hesitating and never mention petrol money. It takes him a while to stop apologising every time he gets in.', effect: { meters: { peers: 8, family: 4 }, attr: { teamwork: 1 }, tag: 'fam-took-lifts' }, next: 'lift' },
          { id: 'fewer', label: 'Cut down to the games that matter', desc: 'Drop the midweeks, keep the Saturdays', outcome: 'He misses half a season of Tuesdays. He gets them back eventually; the car never comes back at all.', effect: { form: -0.05, meters: { family: 6, authority: -6 }, attr: { composure: 1 }, tag: 'fam-cut-back' }, next: 'lift' },
        ],
      },
      lift: {
        id: 'lift',
        prompt: 'In spring his mum gets a lift sorted permanently — a neighbour going that way anyway, she says. He later finds out the neighbour wasn\'t going that way at all.',
        choices: [
          { id: 'thank', label: 'Thank the neighbour properly', desc: 'Knock on the door and say it to his face', outcome: 'He knocks and says thanks. The man is embarrassed and gruff about it and drives him for another two years.', effect: { meters: { family: 8, peers: 6 }, attr: { leadership: 1, teamwork: 1 } } },
          { id: 'quiet', label: 'Keep quiet and never be late', desc: 'Repay it by being on the kerb five minutes early, always', outcome: 'He is never once late, for two full years. It becomes a habit that follows him into every dressing room he ever walks into.', effect: { attr: { composure: 1, stamina: 1 }, meters: { family: 6, authority: 6 } } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-wedding', title: 'A Suit and a Cup Tie', icon: '💒', category: 'offpitch',
    minTurn: 8, maxTurn: 46, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His cousin\'s wedding is on the Saturday of the cup semi-final. He is down as an usher, the suit is hired and paid for, and his aunt has been planning this since he was nine years old.',
        choices: [
          { id: 'wedding', label: 'Go to the wedding', desc: 'Suit, buttonhole, the whole day', outcome: 'He ushers, he behaves, he dances with his nan. He checks the score in the toilets at four o\'clock and tells nobody they lost.', effect: { meters: { family: 14, authority: -8 }, energy: 4, attr: { teamwork: 1 }, tag: 'fam-went-wedding' }, next: 'photo' },
          { id: 'game', label: 'Play the semi-final', desc: 'Ask his aunt to release him from the suit', outcome: 'His aunt says of course, in the voice that means it isn\'t. He plays a semi-final with that voice in his head all afternoon.', effect: { form: 0.05, energy: -8, meters: { family: -8, authority: 8 }, attr: { aggression: 1 }, tag: 'fam-played-semi' }, next: 'photo' },
          { id: 'both', label: 'Do the church and leave before the meal', desc: 'Suit off in the car, boots on at half two', outcome: 'He arrives at the ground still smelling of aftershave and confetti, and plays the last hour on adrenaline and vol-au-vents.', effect: { energy: -12, form: 0.03, meters: { family: 6, authority: 4 }, attr: { stamina: 1 }, tag: 'fam-did-both' }, next: 'photo' },
        ],
      },
      photo: {
        id: 'photo',
        prompt: 'The wedding photos come back in a big envelope and get passed round at his nan\'s for weeks.',
        choices: [
          { id: 'own', label: 'Look at them properly with everyone', desc: 'Sit down and go through the lot', outcome: 'He goes through the whole envelope twice, asking who everyone is. His aunt stops being cool with him halfway through the second pass.', effect: { meters: { family: 10 }, attr: { teamwork: 1, composure: 1 } } },
          { id: 'skip', label: 'Find a reason to be somewhere else', desc: 'He knows what the photos will and won\'t show', outcome: 'He is out at the park every time the envelope comes out. Nobody makes a thing of it, which is how he knows it is a thing.', effect: { meters: { family: -4 }, attr: { flair: 1 }, form: 0.04 } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-camcorder', title: 'Every Minute of Every Game', icon: '🎥', category: 'relationship',
    minTurn: 2, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His dad films everything. Every match, from behind the fence, narrating quietly to himself. The tapes are stacked in the front room in date order, and the other lads have started doing an impression of him.',
        choices: [
          { id: 'watch', label: 'Sit down and watch them with him', desc: 'Sunday nights, the pair of them and the telly', outcome: 'They watch back the whole game, pausing it constantly. He starts seeing the pitch from the outside, which is a rare thing at twelve.', effect: { attr: { creativity: 1, composure: 1 }, meters: { family: 10 }, form: 0.05, tag: 'fam-watched-back' }, next: 'ask' },
          { id: 'embarrassed', label: 'Ask him to stop', desc: 'The impressions have got to him', outcome: 'He asks him not to bring the camera. His dad says no problem, mate, and stands at the fence with his hands in his pockets looking like he doesn\'t know where to put them.', effect: { meters: { family: -6, peers: 6 }, attr: { composure: 1 }, tag: 'fam-asked-stop' }, next: 'ask' },
        ],
      },
      ask: {
        id: 'ask',
        prompt: 'Years\' worth of tapes, and he realises the camera is always on him and never once on his little sister\'s netball.',
        choices: [
          { id: 'redirect', label: 'Point it at her for once', desc: 'Ask his dad to film a netball match', outcome: 'His dad films the netball, badly, and his sister watches it back four times. It costs him one Saturday and buys him a sister.', effect: { meters: { family: 12 }, attr: { teamwork: 1, leadership: 1 } } },
          { id: 'keep', label: 'Let his dad have his thing', desc: 'The tapes are how he says it', outcome: 'He lets him keep filming. Twenty years later the tapes are the only footage of his childhood anyone has, and he is grateful and slightly ashamed at once.', effect: { meters: { family: 8 }, attr: { composure: 1 }, form: 0.03 } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-hope', title: 'The One Who Might', icon: '🕯️', category: 'saga',
    minTurn: 10, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'At a family do he overhears his mum telling somebody that he\'s the one who\'s going to get out. She says it proudly, and slightly too loud, and he stands in the hallway with a plate of sausage rolls feeling the whole family land on his shoulders at once.',
        choices: [
          { id: 'carry', label: 'Carry it', desc: 'Let it be the reason he works harder than anyone', outcome: 'He decides to be worth it. It makes him ferocious and it makes every bad game feel like letting down eleven people who weren\'t even there.', effect: { form: 0.08, energy: -8, attr: { aggression: 1, stamina: 1 }, meters: { family: 8 }, tag: 'fam-carries-it' }, next: 'talk' },
          { id: 'set-down', label: 'Refuse to carry it', desc: 'It\'s a game and he\'s a child', outcome: 'He decides, privately, that it isn\'t his job to rescue anyone. He plays lighter for it, and feels guilty about that too.', effect: { attr: { composure: 2, flair: 1 }, form: 0.05, meters: { family: -2 }, tag: 'fam-set-it-down' }, next: 'talk' },
        ],
      },
      talk: {
        id: 'talk',
        prompt: 'Later that week his mum asks, in the car, whether he heard what she said.',
        choices: [
          { id: 'honest', label: 'Tell her what it felt like', desc: 'Say that it\'s heavy', outcome: 'He tells her it scares him. She pulls over and tells him she\'d rather have him than a footballer, and he believes about eighty per cent of it.', effect: { meters: { family: 12 }, attr: { composure: 1, leadership: 1 } } },
          { id: 'deny', label: 'Say he didn\'t hear anything', desc: 'Let her keep the version where he didn\'t', outcome: 'He says he didn\'t hear. She looks relieved, and he keeps the weight to himself, which is the choice he\'ll keep making for years.', effect: { meters: { family: 4 }, attr: { composure: 2 }, energy: -4 } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-little-brother', title: 'The Shadow in the Garden', icon: '👦', category: 'relationship',
    minTurn: 1, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His little brother has started doing everything he does: the same haircut, the same way of pulling his socks up, the same celebration. He is in the garden at all hours waiting to be picked, and he is not very good.',
        choices: [
          { id: 'coach', label: 'Actually teach him', desc: 'An hour a week, properly, like a coach would', outcome: 'He teaches him to strike a ball with his laces. It takes six weeks and the first time it comes off the boy screams the street down.', effect: { meters: { family: 10 }, attr: { leadership: 2, teamwork: 1 }, energy: -4, tag: 'fam-taught-brother' }, next: 'game' },
          { id: 'shrug', label: 'Let him hang around', desc: 'He can join in, but this is proper practice', outcome: 'The boy fetches the ball out of the hedge two hundred times a night and thinks it\'s the greatest thing that\'s ever happened to him.', effect: { form: 0.05, attr: { flair: 1 }, meters: { family: 4 }, tag: 'fam-brother-fetches' }, next: 'game' },
          { id: 'push', label: 'Tell him to find his own thing', desc: 'Being a copy of someone won\'t make him happy', outcome: 'He says it kindly and it lands like a slap. The boy takes up swimming and is county standard within three years.', effect: { meters: { family: -4 }, attr: { composure: 1, leadership: 1 }, tag: 'fam-sent-him-off' }, next: 'game' },
        ],
      },
      game: {
        id: 'game',
        prompt: 'His brother\'s first proper match is at the same time as his own, on the pitch next door.',
        choices: [
          { id: 'watch', label: 'Watch the last ten minutes of his', desc: 'Sprint over still in his own kit', outcome: 'He gets there for the last ten and stands where he can be seen. His brother tells people about it for the rest of his life.', effect: { meters: { family: 12 }, attr: { teamwork: 1 }, energy: -4 } },
          { id: 'own', label: 'Stay for his own warm-down', desc: 'Do the professional thing', outcome: 'He does everything right and gets home to a boy who scored and wanted to tell him first. He gets the story second-hand off his mum.', effect: { attr: { stamina: 1, composure: 1 }, meters: { authority: 6, family: -4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-cousin-quit', title: 'The Cousin Who Was Better', icon: '📦', category: 'saga',
    minTurn: 9, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His cousin, four years older, was the best player anyone in the family had ever seen — and packed it in at sixteen. Nobody explains why. He works nights now, and at Christmas he watches football with the sound off.',
        choices: [
          { id: 'ask', label: 'Ask him what happened', desc: 'Corner him in the kitchen and just ask', outcome: 'He tells him: that it stopped being fun about a year before he stopped, and nobody noticed. It is the most useful thing anyone tells him all year.', effect: { attr: { composure: 1, creativity: 1 }, meters: { family: 8 }, tag: 'fam-cousin-talked' }, next: 'later' },
          { id: 'avoid', label: 'Don\'t go near it', desc: 'Some things you don\'t ask a grown man about', outcome: 'He leaves it alone. His cousin asks him instead, quietly, whether he\'s still enjoying it — and waits properly for the answer.', effect: { attr: { composure: 1 }, meters: { family: 6 }, tag: 'fam-cousin-asked-him' }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'In February his cousin turns up unannounced at a Sunday game and stands on his own on the far side.',
        choices: [
          { id: 'invite', label: 'Ask him to come and train with him', desc: 'Get him back on grass, even just once', outcome: 'They do an hour on the park in the dark. His cousin\'s touch is still there, and neither of them says anything about that.', effect: { attr: { creativity: 1, flair: 1 }, form: 0.05, meters: { family: 10 }, energy: -4 } },
          { id: 'listen', label: 'Ask him what he saw', desc: 'Take the one honest opinion in his family', outcome: 'His cousin tells him two things he\'s doing wrong that no coach has mentioned, then apologises for interfering. He works on both.', effect: { attr: { creativity: 1, composure: 1 }, form: 0.06, meters: { family: 8 } } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-kit-wash', title: 'Half Nine on a Sunday Night', icon: '🧺', category: 'relationship',
    minTurn: 0, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The kit comes home caked and goes back out clean, and he has genuinely never once wondered how. Then one Sunday he comes down for a drink at half nine and his mum is at the sink with a nail brush and a bowl of cold water, doing the socks by hand because the machine won\'t shift the pitch.',
        choices: [
          { id: 'learn', label: 'Ask her to show him how', desc: 'Take over the socks from now on', outcome: 'She shows him: cold water first, always. He does his own kit from then on, badly at first, and she stops setting an alarm for Sunday nights.', effect: { meters: { family: 12 }, attr: { teamwork: 1, composure: 1 }, tag: 'fam-does-own-kit' }, next: 'bag' },
          { id: 'help', label: 'Stand there and dry them', desc: 'Do the boring half so she isn\'t on her own', outcome: 'He dries and folds while she scrubs, and they talk about nothing for forty minutes. It becomes a Sunday thing.', effect: { meters: { family: 10 }, attr: { teamwork: 1 }, energy: -4, tag: 'fam-sunday-sink' }, next: 'bag' },
          { id: 'bed', label: 'Take his drink and go up', desc: 'She\'d only tell him to go to bed anyway', outcome: 'He goes up. He lies there listening to the tap running downstairs and can\'t get to sleep for a long time.', effect: { meters: { family: 2 }, attr: { composure: 1 }, tag: 'fam-went-up' }, next: 'bag' },
        ],
      },
      bag: {
        id: 'bag',
        prompt: 'A fortnight later he leaves his kit festering in the bag until Saturday morning, and finds it washed and folded on the end of his bed anyway.',
        choices: [
          { id: 'say', label: 'Say sorry, properly', desc: 'Not a mumble on the way out the door', outcome: 'He apologises properly and means it. She tells him it\'s nothing; the bag never gets left again.', effect: { meters: { family: 10 }, attr: { leadership: 1, composure: 1 } } },
          { id: 'rule', label: 'Make it a rule for himself', desc: 'Bag emptied within an hour of getting in, forever', outcome: 'He makes the rule and keeps it. Kit men at three different clubs will one day comment on it without ever knowing where it came from.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { family: 8, authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-dinner-table', title: 'The Plate Under Foil', icon: '🍲', category: 'offpitch',
    minTurn: 4, maxTurn: 42, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Training finishes at half eight and the family eat at six. His dinner sits under foil on the hob most nights, and he eats it alone at the kitchen table while everyone else is in the front room with the telly on.',
        choices: [
          { id: 'later', label: 'Ask them to hold dinner', desc: 'Eat as four, even if it means eating at nine', outcome: 'They shift to nine o\'clock, which suits nobody and everybody. His little sister falls asleep at the table twice a week and refuses to eat earlier.', effect: { meters: { family: 12 }, attr: { teamwork: 1 }, energy: -4, tag: 'fam-late-dinners' }, next: 'sat' },
          { id: 'alone', label: 'Eat alone and let them get on', desc: 'Don\'t bend the whole house round his timetable', outcome: 'He eats under the strip light most nights of his childhood. He gets very good at his own company, which is not entirely a gift.', effect: { attr: { composure: 2 }, meters: { family: -2 }, tag: 'fam-eats-alone' }, next: 'sat' },
          { id: 'company', label: 'Ask for one person to sit with him', desc: 'Whoever\'s free, just don\'t make him eat on his own', outcome: 'They rota it without telling him. It takes him months to realise it isn\'t a coincidence that someone is always at the table.', effect: { meters: { family: 8 }, attr: { teamwork: 1, composure: 1 }, tag: 'fam-rota' }, next: 'sat' },
        ],
      },
      sat: {
        id: 'sat',
        prompt: 'Saturday morning, the one meal a week the whole house is at the table for, and he has an away game at eleven.',
        choices: [
          { id: 'sit', label: 'Sit down and eat with them', desc: 'Leave twenty minutes later than he\'d like', outcome: 'He eats with them and arrives at the ground last of anyone. He is fine. He would have been fine either way.', effect: { meters: { family: 10 }, energy: 4, attr: { composure: 1 } } },
          { id: 'go', label: 'Take it in the car', desc: 'Toast in his hand, out the door', outcome: 'He eats it in the passenger seat and crumbs the whole footwell. His mum saves him a proper breakfast for the Sunday instead.', effect: { energy: -2, form: 0.04, meters: { family: 4, authority: 4 }, attr: { stamina: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-fam-nightshift', title: 'The Hours She Works', icon: '🌃', category: 'crisis',
    minTurn: 11, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His mum has picked up nights at the depot because the money is better and the hours mean she can still do the school run. She sleeps in the afternoons with the curtains shut. She has not seen him play since October, and she asks about every game as though she had.',
        choices: [
          { id: 'wake', label: 'Wake her up when he gets in', desc: 'She said to, and she meant it', outcome: 'He wakes her every Saturday teatime and tells her the whole game while she\'s still half asleep. She misses nothing and gets almost no sleep.', effect: { meters: { family: 10 }, attr: { teamwork: 1 }, tag: 'fam-wakes-her' }, next: 'shift' },
          { id: 'let', label: 'Let her sleep', desc: 'She needs the four hours more than he needs an audience', outcome: 'He leaves a note on the fridge with the score on it every week. She keeps every single one in a drawer.', effect: { meters: { family: 8 }, attr: { composure: 1 }, tag: 'fam-leaves-notes' }, next: 'shift' },
        ],
      },
      shift: {
        id: 'shift',
        prompt: 'The cup final is on a Saturday afternoon. She could swap the Friday night shift to be there, and she\'d lose the money and the sleep and be on her feet for twenty-six hours.',
        choices: [
          { id: 'ask', label: 'Ask her to come', desc: 'Say out loud that he wants her there', outcome: 'She swaps the shift and stands on the touchline grey with tiredness, and is the loudest person at the ground.', effect: { meters: { family: 14 }, form: 0.06, attr: { leadership: 1 }, energy: -2 } },
          { id: 'excuse', label: 'Tell her it\'s not a big one', desc: 'Give her a way out she can take without guilt', outcome: 'He plays it down so she\'ll sleep. She finds out afterwards what it actually was, and doesn\'t speak to him for a whole evening.', effect: { meters: { family: -4 }, attr: { composure: 1, teamwork: 1 } } },
          { id: 'both', label: 'Ask her to come to the second half only', desc: 'Half a shift\'s sleep, half a game', outcome: 'She arrives at half time in her work fleece and stands at the back. He sees her the moment she gets there.', effect: { meters: { family: 10 }, form: 0.04, attr: { composure: 1 } } },
        ],
      },
    },
  },
];
