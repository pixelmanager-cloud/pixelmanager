// ── YOUTH: MATES, TEAMMATES & BELONGING — the changing room years (ages 10-14) ────────────────────
// Everything in this file happens between the boy and the other boys. No parents, no coaches, no scouts,
// no teachers: the drama is peer-shaped — who sits next to who on the minibus, who gets left out of the
// group chat, who covers for who, which mate you keep when two of them stop speaking. Meters used are only
// those live in childhood (authority = Coach, family = Parents, peers = Mates, school = School) and, since
// these are children, no arc touches earnings, market or greed.
import type { StoryArc } from '../storyarc.js';

export const YOUTH_MATES_ARCS: StoryArc[] = [
  {
    id: 'youth-mates-stopped-coming', title: 'The One Who Stopped Coming', icon: '🚪', category: 'relationship',
    minTurn: 1, maxTurn: 14, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His mate has missed three sessions in a row. Nobody in the squad says anything about it — they just count the bibs differently now. On the walk home he passes the boy\'s street and sees him on the wall outside the shop with lads from the year above, ball nowhere.',
        choices: [
          { id: 'stop', label: 'Stop and talk to him', desc: 'Ask what happened, in front of his new mates', outcome: 'He stops. The boy is short with him, and the lads on the wall snort. But on Thursday he is back at training, boots badly tied, saying nothing about any of it.', effect: { meters: { peers: 8 }, attr: { leadership: 1 }, tag: 'mates-went-back' }, next: 'after' },
          { id: 'walk', label: 'Keep walking', desc: 'He knows where training is. It isn\'t a secret', outcome: 'He walks on. The boy sees him see him, and neither of them mentions it, then or ever.', effect: { meters: { peers: -4 }, attr: { composure: 1 }, tag: 'mates-walked-past' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'Weeks later the squad is picking teams for a small-sided game and his mate\'s name comes up last, said in the voice you use for someone who isn\'t really one of you any more.',
        choices: [
          { id: 'pick', label: 'Pick him first', desc: 'Say the name before anyone else can make it a joke', outcome: 'He says the name first and flat, like it was obvious, and the joke never gets made. The boy plays like his hair is on fire.', effect: { meters: { peers: 10 }, attr: { leadership: 1, teamwork: 1 } } },
          { id: 'quiet', label: 'Let the room decide', desc: 'It isn\'t his job to fix everyone', outcome: 'He keeps out of it. The boy gets picked last and plays like it, and something between them thins out for good.', effect: { meters: { peers: -3 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-nickname', title: 'The Name That Stuck', icon: '🏷️', category: 'relationship',
    minTurn: 0, maxTurn: 10, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody in the changing room gives him a nickname on his second week. It is not cruel, exactly — it is about the way he runs — and the whole squad is using it by Saturday. Nobody has called him his actual name in a fortnight.',
        choices: [
          { id: 'own', label: 'Take it and make it his', desc: 'Answer to it louder than anyone says it', outcome: 'He starts answering to it before they finish saying it, and within a month it stops being a joke about him and starts being what he is called. Two of them shorten it to something almost fond.', effect: { meters: { peers: 10 }, attr: { flair: 1, composure: 1 } } },
          { id: 'fight', label: 'Tell them to pack it in', desc: 'Say it once, clearly, and mean it', outcome: 'He says it once, evenly, and most of them stop. One doesn\'t, for a while, until nobody laughs with him any more.', effect: { meters: { peers: -3 }, attr: { leadership: 1 } } },
          { id: 'endure', label: 'Say nothing and wait it out', desc: 'Things that get no reaction usually die', outcome: 'He gives it nothing at all for six weeks and it withers, the way these things do. He is quieter in that room afterwards than he was before.', effect: { meters: { peers: 3 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-two-friends', title: 'Choosing Sides', icon: '⚖️', category: 'crisis',
    minTurn: 2, maxTurn: 16, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His two closest mates in the squad have fallen out over something neither will explain. Both of them find him separately, tell him a version, and wait. The changing room has already split into halves and he is standing in the gap.',
        choices: [
          { id: 'neither', label: 'Refuse to pick', desc: 'Stay mates with both and take the cost', outcome: 'He keeps sitting with whoever he sat with, and for a fortnight both of them treat him like a traitor. Then it passes, and he is the only one who came out with two friends.', effect: { meters: { peers: 6 }, attr: { composure: 1, leadership: 1 }, tag: 'mates-neutral' }, next: 'after' },
          { id: 'closer', label: 'Back the one he\'s closer to', desc: 'Loyalty means choosing, and he knows who', outcome: 'He picks a side, and it is warm on that side. The other boy stops passing to him in training for a long time, and it shows in the results.', effect: { meters: { peers: -2 }, attr: { aggression: 1 }, tag: 'mates-picked-side' }, next: 'after' },
          { id: 'right', label: 'Back whoever was actually right', desc: 'Work out what happened, then say so', outcome: 'He asks enough questions to work out the truth and says it out loud to both of them. Neither enjoys it. Both, later, trust him more than they did.', effect: { meters: { peers: 4 }, attr: { leadership: 1, composure: 1 }, tag: 'mates-truth' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'A month on, the pair of them are speaking again, and the squad has moved on to something else. But there is a first team-talk of the new season and the group looks around for who is going to say something.',
        choices: [
          { id: 'speak', label: 'Say it', desc: 'Somebody has to, and everybody is looking at him', outcome: 'He says something short and unclever about all of them being in it. It isn\'t a speech, but it is him that said it, and the room settles.', effect: { meters: { peers: 8 }, attr: { leadership: 1, teamwork: 1 } } },
          { id: 'look', label: 'Look at the floor', desc: 'Let somebody louder do it', outcome: 'He studies his laces until somebody else fills the silence. He is relieved, and then, on the bus, faintly annoyed with himself.', effect: { attr: { composure: 1 }, meters: { peers: 2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-boot-money', title: 'The Money in the Boot Bag', icon: '💷', category: 'crisis',
    minTurn: 3, maxTurn: 18, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two lads have had money go missing from their bags in a fortnight. On the third Saturday he comes back early for a forgotten shinpad and sees a teammate with his hand in somebody else\'s coat. The boy sees him see it. Neither moves.',
        choices: [
          { id: 'tell', label: 'Tell the squad who it was', desc: 'They have a right to know, and it stops today', outcome: 'He says the name. The thefts stop and so does the boy, who is gone from the club inside a month and never speaks to him again.', effect: { meters: { peers: 4 }, attr: { leadership: 1 }, tag: 'mates-named-thief' } },
          { id: 'private', label: 'Say it to him alone', desc: 'Give him one chance and mean the threat', outcome: 'He tells him, on the steps, that it stops or he tells everyone. It stops. They are strange with each other for a year, and the boy quietly pays one of them back.', effect: { meters: { peers: 8 }, attr: { composure: 1, leadership: 1 }, tag: 'mates-warned-thief' } },
          { id: 'nothing', label: 'Say nothing at all', desc: 'It isn\'t his money and it isn\'t his business', outcome: 'He says nothing. A quiet kid who did nothing wrong gets blamed for it by the rest of them, and he carries that for longer than he expects.', effect: { meters: { peers: -6 }, attr: { composure: 1 }, tag: 'mates-said-nothing' } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-away-room', title: 'Sharing a Room', icon: '🛏️', category: 'relationship',
    minTurn: 6, maxTurn: 24, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'First away trip with an overnight stay. The rooming list pairs him with the lad nobody rooms with — quiet, from the other end of the county, plays well and says about nine words a season. There is a free bed in the room where everyone wants to be.',
        choices: [
          { id: 'stay', label: 'Stay where he\'s put', desc: 'Room with him and see what happens', outcome: 'They stay up too late with the telly on mute, and the boy talks more in three hours than he has all year. On the pitch next morning they find each other twice without looking.', effect: { meters: { peers: 8 }, attr: { teamwork: 1 }, tag: 'mates-roomed' }, next: 'season' },
          { id: 'swap', label: 'Swap into the good room', desc: 'It\'s one night and he wants to enjoy it', outcome: 'He swaps, and the night is loud and brilliant. The quiet boy sleeps on his own and is fine about it in a way that is worse than sulking.', effect: { meters: { peers: 4 }, attr: { flair: 1 }, tag: 'mates-swapped' }, next: 'season' },
        ],
      },
      season: {
        id: 'season',
        prompt: 'The trip ends and the season grinds on. By March the squad has hardened into groups — who warms up with who, who saves a seat.',
        choices: [
          { id: 'mix', label: 'Keep crossing between them', desc: 'Refuse to belong to only one group', outcome: 'He drifts between the cliques all season, welcome everywhere and central nowhere, and ends up the one everyone tells things to.', effect: { meters: { peers: 6 }, attr: { teamwork: 1, composure: 1 } } },
          { id: 'settle', label: 'Settle into his group', desc: 'Pick his three and be properly theirs', outcome: 'He picks his three and they become the kind of friends you get once. The rest of the squad is polite to him and nothing more.', effect: { meters: { peers: 8 }, attr: { teamwork: 1 }, form: 0.04 } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-group-chat', title: 'The Group Chat', icon: '📱', category: 'crisis',
    minTurn: 4, maxTurn: 20, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody makes a second group chat — the squad, minus one lad. It is funnier than the real one, because the joke is him. Forty messages in, his phone buzzes with a photo of the boy stretching, captioned in a way that will follow him for years.',
        choices: [
          { id: 'leave', label: 'Leave the chat', desc: 'Get out, and let them see the name go grey', outcome: 'He leaves without a word. Three of them ask why and he doesn\'t answer, and within a week two others have gone too and the chat dies of embarrassment.', effect: { meters: { peers: -2 }, attr: { leadership: 1, composure: 1 } } },
          { id: 'warn', label: 'Warn the lad it exists', desc: 'He should hear it from a mate first', outcome: 'He tells him quietly by the gate. The boy goes red and says thanks, and never quite trusts any of the others again — including, a bit, him.', effect: { meters: { peers: 4 }, attr: { leadership: 1 }, tag: 'mates-warned-chat' } },
          { id: 'mute', label: 'Mute it and say nothing', desc: 'He didn\'t start it and he isn\'t adding to it', outcome: 'He mutes it and never types in it once. Months later, when it all comes out, he is technically in the screenshots.', effect: { meters: { peers: 2 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-lift-share', title: 'The Lift', icon: '🚗', category: 'relationship',
    minTurn: 0, maxTurn: 9, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A lad from two streets over has been getting the same lift as him to training all season — three in the back, kit bags on knees, the same four songs. Then the boy is moved to the other age group and the lift stops making sense.',
        choices: [
          { id: 'keep', label: 'Keep the lift going anyway', desc: 'Different sessions, same car, longer wait', outcome: 'He waits forty minutes in a cold car park twice a week so the arrangement survives. It works out. Twenty years later they are still in touch.', effect: { energy: -4, meters: { peers: 10 }, attr: { teamwork: 1 }, tag: 'mates-kept-lift' } },
          { id: 'end', label: 'Let it end', desc: 'It was a lift, not a marriage', outcome: 'It just stops, without either of them deciding. They nod in corridors for a year and then not even that.', effect: { meters: { peers: -2 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-initiation', title: 'Singing on the Table', icon: '🎤', category: 'relationship',
    minTurn: 1, maxTurn: 12, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Squad tradition: every new lad stands on a bench and sings. His turn comes on a Tuesday with fourteen boys hammering the lockers. He knows one verse of one song and his voice has started doing the thing where it goes both ways in a sentence.',
        choices: [
          { id: 'sing', label: 'Get up and murder it', desc: 'Loud, awful, all the way through', outcome: 'He is genuinely terrible and does not stop, and they are still shouting the chorus at him in April. He is in, completely, from that Tuesday.', effect: { meters: { peers: 12 }, attr: { flair: 1, composure: 1 } } },
          { id: 'refuse', label: 'Refuse', desc: 'Stand there and take the noise instead', outcome: 'He shakes his head and lets them bay at him until they get bored. Nobody makes him. They also don\'t forget he wouldn\'t.', effect: { meters: { peers: -5 }, attr: { composure: 1, leadership: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-never-picked', title: 'The Boy Who Never Gets On', icon: '🪑', category: 'relationship',
    minTurn: 2, maxTurn: 18, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One lad has been on the bench for the whole season. He comes to everything, warms up harder than anyone, and gets four minutes in November. At the end of a game he is the first one clapping and it costs him something to do it.',
        choices: [
          { id: 'sit', label: 'Sit with him on the bus', desc: 'Not to say anything clever — just sit there', outcome: 'He sits next to him and talks about nothing for an hour. The boy doesn\'t mention the football and neither does he, and that turns out to be the point.', effect: { meters: { peers: 10 }, attr: { teamwork: 1 }, tag: 'mates-sat-with' }, next: 'chance' },
          { id: 'push', label: 'Tell him he\'s good enough', desc: 'Say the thing nobody has said to him', outcome: 'He tells him, badly and honestly, that he is better than his minutes. The boy laughs it off and then trains like a lunatic for a month.', effect: { meters: { peers: 6 }, attr: { leadership: 1 }, tag: 'mates-encouraged' }, next: 'chance' },
        ],
      },
      chance: {
        id: 'chance',
        prompt: 'Last game of the season, three-nil up, and the boy finally gets twenty minutes. He is nervous to the point of being ill with it. Then the ball breaks and there is a chance on — his, or the easy pass.',
        choices: [
          { id: 'pass', label: 'Give it to him', desc: 'Square it and let him have the moment', outcome: 'He rolls it across and the boy puts it in, and the celebration is the loudest thing that has happened all year. Nobody remembers who passed.', effect: { meters: { peers: 12 }, attr: { teamwork: 1 }, form: 0.04 } },
          { id: 'score', label: 'Take it himself', desc: 'It\'s his shot and he\'s the one who scores', outcome: 'He takes it and scores, properly, and it\'s a good goal. The boy is first to him in the pile-on, and hugs him, and means it, mostly.', effect: { form: 0.08, attr: { flair: 1 }, meters: { peers: 2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-credit', title: 'Somebody Else\'s Goal', icon: '🙊', category: 'relationship',
    minTurn: 5, maxTurn: 22, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A scruffy goal goes in off a deflection. He got the last touch — he felt it come off his shin — but the striker has already wheeled away with his shirt over his head and the squad has decided whose it was. In the changing room they are still saying the striker\'s name.',
        choices: [
          { id: 'claim', label: 'Say it was his', desc: 'It was. Say so, in front of everyone', outcome: 'He says it and the room goes briefly odd. The striker gives it up with bad grace, and for a month the lads call him greedy in a way that only half sounds like a joke.', effect: { meters: { peers: -4 }, attr: { aggression: 1, leadership: 1 } } },
          { id: 'let', label: 'Let him have it', desc: 'He hasn\'t scored since September', outcome: 'He lets it go and joins in the noise. On the bus the striker leans over and says, quietly, that he knows. That is worth more than the goal was.', effect: { meters: { peers: 10 }, attr: { teamwork: 1, composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-covering', title: 'Covering for Him', icon: '🤐', category: 'crisis',
    minTurn: 3, maxTurn: 20, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A window goes through at the back of the changing rooms. It was his mate — messing about with a ball he\'d been told to put away — and the whole squad gets kept behind while it gets sorted out. Fourteen boys standing on wet concrete, and one of them knows.',
        choices: [
          { id: 'cover', label: 'Keep his mouth shut', desc: 'You don\'t give up a mate. Everyone stands there', outcome: 'He stands there with the rest of them and says nothing for an hour. His mate never says thank you out loud, and never needs to.', effect: { meters: { peers: 10, authority: -4 }, attr: { teamwork: 1 }, tag: 'mates-covered' }, next: 'later' },
          { id: 'nudge', label: 'Tell him to own up', desc: 'Not grass him — get him to do it himself', outcome: 'He gets in his ear until the boy puts his hand up. It costs the boy a fortnight of stick and saves everyone else the evening. They are closer for it, oddly.', effect: { meters: { peers: 4, authority: 4 }, attr: { leadership: 1 }, tag: 'mates-nudged' }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'Not long after, the same mate wants him to bunk off the end of a session to get to something else. He is already halfway out of his boots and grinning, and he is only going if the two of them go together.',
        choices: [
          { id: 'go', label: 'Go with him', desc: 'It\'s twenty minutes of cool-down. Who cares', outcome: 'They go, and it is one of the better afternoons of that year, and it is also the first time he learns that getting away with something feels thinner than expected.', effect: { energy: 4, meters: { peers: 8, authority: -6 }, attr: { flair: 1 } } },
          { id: 'stay', label: 'Stay', desc: 'Tell him to go on without him', outcome: 'He stays and finishes the session on his own. His mate calls him boring for a week and then, quietly, starts staying too.', effect: { energy: -4, meters: { peers: -2, authority: 6 }, attr: { stamina: 1, composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-other-club', title: 'The Lad from the Other Lot', icon: '🤝', category: 'relationship',
    minTurn: 4, maxTurn: 20, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The kid who plays for the club they are supposed to hate turns out to be all right. They meet at a summer five-a-side and end up talking for an hour about nothing. His own squad has opinions about this, loudly, on Monday.',
        choices: [
          { id: 'openly', label: 'Be mates with him openly', desc: 'Let them say what they want', outcome: 'He keeps knocking about with him and takes a fortnight of grief for it. It dies down, and he has a friend outside the whole thing, which he needs more than he knows.', effect: { meters: { peers: -3 }, attr: { composure: 1, leadership: 1 }, tag: 'mates-rival-friend' }, next: 'derby' },
          { id: 'quiet', label: 'Keep it to himself', desc: 'Some friendships don\'t need an audience', outcome: 'He keeps it off the pitch and out of the changing room. It works, and it also means he is careful with people in a way he wasn\'t before.', effect: { attr: { composure: 1 }, meters: { peers: 2 }, tag: 'mates-rival-secret' }, next: 'derby' },
        ],
      },
      derby: {
        id: 'derby',
        prompt: 'They are drawn against each other in the cup. The friend is on the other wing, and his own squad spend the whole warm-up talking about doing him early.',
        choices: [
          { id: 'hard', label: 'Play him as hard as anyone', desc: 'Friendship stops at the whistle', outcome: 'He goes through him inside two minutes and helps him up. They both play brilliantly and shake hands at the end while their teammates glare.', effect: { attr: { aggression: 1, composure: 1 }, form: 0.06, meters: { peers: 6 } } },
          { id: 'soft', label: 'Not go through him', desc: 'He isn\'t doing that to a mate', outcome: 'He pulls out of one tackle and everyone sees. It costs a goal and a week of comments, and he still doesn\'t regret it as much as he probably should.', effect: { form: -0.05, meters: { peers: -5 }, attr: { teamwork: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-joke-too-far', title: 'The Joke That Went Too Far', icon: '😬', category: 'crisis',
    minTurn: 6, maxTurn: 24, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The changing-room wind-up they do to everyone — kit hidden, boots up in the rafters — happens to the youngest lad on a night when he is already close to tears about something none of them know about. He goes very quiet and then he goes home in his socks.',
        choices: [
          { id: 'chase', label: 'Go after him', desc: 'Out into the car park in his own socks', outcome: 'He catches him at the gate and walks him to the car park with the boots under his arm, and neither of them says much. The boy never forgets that he came out.', effect: { meters: { peers: 10 }, attr: { leadership: 1, teamwork: 1 }, tag: 'mates-went-after' }, next: 'room' },
          { id: 'stay', label: 'Stay in the room', desc: 'It was a joke. He\'ll be fine tomorrow', outcome: 'He stays and laughs with the rest of them, and it is genuinely funny for about four more minutes. Then it isn\'t, and nobody says so.', effect: { meters: { peers: 3 }, attr: { composure: 1 }, tag: 'mates-stayed-in' }, next: 'room' },
        ],
      },
      room: {
        id: 'room',
        prompt: 'Next session, the same lads are lining up the same joke on the same boy, laughing before they\'ve started. They want him in on it — being in on it is the whole thing.',
        choices: [
          { id: 'stop', label: 'Stop it', desc: 'Put the boots back on the peg in front of them', outcome: 'He takes the boots down and puts them back without saying much. Somebody calls him a bore. The joke doesn\'t happen again all season.', effect: { meters: { peers: 4 }, attr: { leadership: 1 } } },
          { id: 'join', label: 'Join in', desc: 'Being outside the joke is its own risk', outcome: 'He joins in and the room loves him for it, and the boy laughs along in the way you do when you have no other option.', effect: { meters: { peers: 8 }, attr: { flair: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-copied', title: 'The One They Copy', icon: '👣', category: 'triumph',
    minTurn: 7, maxTurn: 26, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He notices, over a few weeks, that three of them have started tying their laces the way he does, and one has taken up his warm-up routine wholesale. Nobody has said anything. He is, apparently, the one they watch.',
        choices: [
          { id: 'lead', label: 'Set the standard on purpose', desc: 'If they\'re copying, give them something worth copying', outcome: 'He starts arriving early because he knows two of them will, and stays late because they will too. The whole group gets better without a word being said about it.', effect: { energy: -6, meters: { peers: 8, authority: 6 }, attr: { leadership: 1, stamina: 1 } } },
          { id: 'ignore', label: 'Pretend not to notice', desc: 'The moment he acknowledges it, it gets weird', outcome: 'He carries on as if he hasn\'t seen it, which is its own kind of leadership. They keep copying anyway.', effect: { meters: { peers: 4 }, attr: { composure: 1 } } },
          { id: 'awkward', label: 'Make a joke of it', desc: 'Take the mickey out of the lad doing it', outcome: 'He takes the mickey and the boy laughs and stops doing it, and something small closes down between them that never quite opens again.', effect: { meters: { peers: -4 }, attr: { flair: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-quiet-house', title: 'What He Doesn\'t Talk About', icon: '🌧️', category: 'relationship',
    minTurn: 5, maxTurn: 22, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His mate has been off for a month — snappy in drills, no jokes, first out of the room. On the walk to the bus stop the boy says, flatly and without looking up, that things are bad at home, and then immediately talks about something else.',
        choices: [
          { id: 'ask', label: 'Ask him about it', desc: 'Go back to what he just said', outcome: 'He asks, badly, and his mate tells him more than either of them expected. Nothing is fixed. But the boy is different at training the next week, and it is because somebody asked.', effect: { meters: { peers: 10 }, attr: { leadership: 1, composure: 1 } } },
          { id: 'normal', label: 'Let him change the subject', desc: 'Give him the normal thing to stand in', outcome: 'He follows him onto the other subject and keeps it going the whole way to the stop. Some weeks that is exactly what a mate is for.', effect: { meters: { peers: 8 }, attr: { teamwork: 1 } } },
          { id: 'football', label: 'Just get him playing', desc: 'Drag him to the park and say nothing at all', outcome: 'He knocks for him every day for a fortnight and they play until it\'s dark. Neither mentions anything. It helps more than talking would have.', effect: { energy: -4, meters: { peers: 8 }, attr: { stamina: 1, teamwork: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-come-with-me', title: 'Come With Me', icon: '🧭', category: 'crisis',
    minTurn: 8, maxTurn: 26, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His best mate in the squad is leaving for another club up the road, and wants him to come too. He has it all worked out — same session nights, same lift, the two of them in the same team again by September. He asks in the car park and won\'t stop looking at him.',
        choices: [
          { id: 'stay', label: 'Stay', desc: 'Tell him the truth: he isn\'t going', outcome: 'He says no on the spot, because dressing it up would be worse. His mate takes it badly for a summer, and rings him in October like nothing ever happened.', effect: { meters: { peers: -3, authority: 6 }, attr: { composure: 1, leadership: 1 }, tag: 'mates-stayed-put' }, next: 'after' },
          { id: 'think', label: 'Say he\'ll think about it', desc: 'Because he genuinely will', outcome: 'He says he\'ll think about it and then does, for weeks, badly. His mate builds a whole summer on a maybe, and the letting-down takes longer and hurts more.', effect: { meters: { peers: -2 }, attr: { composure: 1 }, tag: 'mates-dithered' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'September. His mate is gone and the changing room has a gap in it exactly the shape of one person. The peg next to his stays empty for three weeks and then a new lad puts his bag on it.',
        choices: [
          { id: 'welcome', label: 'Talk to the new lad', desc: 'It isn\'t his fault whose peg it was', outcome: 'He talks to him on day one about nothing important. They are not what he had before. They become, over two years, something else that is also good.', effect: { meters: { peers: 8 }, attr: { teamwork: 1 } } },
          { id: 'keep', label: 'Keep the old mate close', desc: 'Different clubs, same Sunday park', outcome: 'They play in the park every Sunday all winter and the friendship survives on nothing but that. The new lad finds his own way in without him.', effect: { energy: -4, meters: { peers: 6 }, attr: { stamina: 1, teamwork: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-popular', title: 'Being the Popular One', icon: '🌟', category: 'relationship',
    minTurn: 2, maxTurn: 15, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somewhere in the middle of a season he becomes the one everyone wants to be near — his name first in the picking, his jokes repeated, a small crowd around his peg. He didn\'t do anything to cause it and he has no idea how to hold it.',
        choices: [
          { id: 'spend', label: 'Spend it on somebody else', desc: 'Use the room\'s attention to pull someone in', outcome: 'He starts putting the quiet lads in his jokes instead of at the end of them, and the shape of the whole squad changes over about six weeks.', effect: { meters: { peers: 10 }, attr: { leadership: 1, teamwork: 1 } } },
          { id: 'enjoy', label: 'Enjoy it', desc: 'He\'s twelve. Let him have it', outcome: 'He enjoys it enormously for about four months, and is a bit unbearable, and grows out of it on his own the way most of them do.', effect: { meters: { peers: 6 }, attr: { flair: 1 } } },
          { id: 'shrink', label: 'Shrink away from it', desc: 'All that looking makes him uncomfortable', outcome: 'He goes quiet and the crowd finds someone louder within a month. He is relieved, and he is also not picked first again for a long time.', effect: { meters: { peers: -3 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mates-last-word', title: 'The Row on the Minibus', icon: '🚌', category: 'crisis',
    minTurn: 4, maxTurn: 20, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Beaten late, and on the way home his mate says — half to the window — that they lost it because of him. He says it loud enough for the front seats. Fourteen boys go very interested in their phones.',
        choices: [
          { id: 'row', label: 'Have it out there and then', desc: 'On the bus, in front of everyone', outcome: 'It gets loud and ugly for two minutes and then it is over. They both feel sick about it for a week and then it never gets mentioned again.', effect: { meters: { peers: -4 }, attr: { aggression: 1 }, tag: 'mates-bus-row' }, next: 'monday' },
          { id: 'swallow', label: 'Say nothing', desc: 'Look out of his own window and let it sit', outcome: 'He says nothing at all for the last forty minutes. His mate has to sit with it too, which turns out to be worse for him than a row would have been.', effect: { attr: { composure: 1 }, meters: { peers: -2 }, tag: 'mates-bus-silence' }, next: 'monday' },
        ],
      },
      monday: {
        id: 'monday',
        prompt: 'Tuesday training. His mate is on the far side of the pitch and has been all night, and the squad has quietly arranged itself so the two of them never end up in the same drill.',
        choices: [
          { id: 'first', label: 'Speak first', desc: 'Walk over and say something ordinary', outcome: 'He goes over and says something completely mundane about the weather, and that is the apology, and both of them know it. They warm up together.', effect: { meters: { peers: 8 }, attr: { leadership: 1, composure: 1 } } },
          { id: 'wait', label: 'Wait for him', desc: 'He said it. He can fix it', outcome: 'He waits. It takes eleven days and comes out as a shove and a grin in a rondo, which is how it works at that age.', effect: { meters: { peers: 4 }, attr: { aggression: 1 } } },
        ],
      },
    },
  },
];
