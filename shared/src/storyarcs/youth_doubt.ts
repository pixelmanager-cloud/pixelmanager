// ── YOUTH DOUBT ARCS — pressure, nerves and the inside of his head, ages 10-14 ────────────────────
// Not what happens to him: what he makes of it. Slumps nobody notices, Saturdays he dreads, the safe pass
// he plays because he is frightened of the other one, the highlight clip he cannot bear to watch, the week
// he wants off and cannot say so. Ordinary childhood self-doubt, handled plainly. No agents, no money —
// children. Meters used: authority (Coach), family (Parents), peers (Mates), school.
import type { StoryArc } from '../storyarc.js';

export const YOUTH_DOUBT_ARCS: StoryArc[] = [
  {
    id: 'youth-doubt-nothing-comes-off', title: 'A Run of Nothing', icon: '🌫️', category: 'crisis',
    minTurn: 3, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four games now where nothing has come off. Not badly — he is not falling over, he is not giving it away. It is just that every ball he plays arrives half a yard behind where it should, and he can feel the game happening a fraction of a second before he gets there.',
        choices: [
          { id: 'simplify', label: 'Cut everything back to the basics', desc: 'Two touches, nothing clever, until it comes back', outcome: 'He decides to do only what he is certain of for a fortnight. It is dull to watch and duller to play, but by the third week the half-yard has quietly closed up again.', effect: { form: 0.05, attr: { composure: 2 } }, next: 'later' },
          { id: 'force', label: 'Try to force his way out of it', desc: 'Do more, run further, demand it', outcome: 'He chases the game for eighty minutes and gets nothing for it except a stitch and a mood, because you cannot bully form back into your own feet.', effect: { energy: -8, form: -0.04, attr: { stamina: 1, aggression: 1 } }, next: 'later' },
          { id: 'wait', label: 'Decide it is weather and wait it out', desc: 'It has gone before, and come back', outcome: 'He tells himself flatly that this happens and that it ends, and mostly manages to believe it. Some Saturdays he believes it less than others.', effect: { attr: { composure: 1 } }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'It does end, eventually, in a nothing game on a Tuesday, with a pass he would not have remembered in any other month. He notices himself noticing it.',
        choices: [
          { id: 'note', label: 'Remember how it felt to be in it', desc: 'So he knows it is survivable next time', outcome: 'He files the whole month away carefully: it went, it came back, and nothing he did in a panic had much to do with either. That is worth more than the pass was.', effect: { attr: { composure: 2 }, form: 0.04 } },
          { id: 'relief', label: 'Just be relieved and think no more about it', desc: 'Forget the month, keep the Tuesday', outcome: 'He throws the month away with the sock tape and plays the rest of the season without once looking back at it — its own kind of sense.', effect: { form: 0.06, energy: 4 } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-dreading-saturday', title: 'The Saturday Feeling', icon: '🕗', category: 'crisis',
    minTurn: 2, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It starts on Thursday now. A small, flat weight under the ribs that is not quite fear, and it grows all Friday, and by Saturday morning he is quiet at breakfast and wishes it were raining hard enough to call the game off. He wants to play. He also wants it to be six o clock already.',
        choices: [
          { id: 'name', label: 'Give the feeling a name', desc: 'Decide it is just wanting it, wearing the wrong coat', outcome: 'He works out for himself that the weight and the wanting are the same thing arriving early. It does not go away, but it stops being frightening once it has a name.', effect: { attr: { composure: 2 } } },
          { id: 'routine', label: 'Build a Saturday morning that never changes', desc: 'Same breakfast, same boots, same order', outcome: 'Toast, then boots, then the bag by the door — the same nine minutes every week. The routine gives the feeling somewhere to sit until kick-off comes and takes it away.', effect: { attr: { composure: 2 }, energy: 3, tag: 'saturday-routine' } },
          { id: 'hide', label: 'Say nothing and get through it', desc: 'Everyone else seems fine', outcome: 'He assumes he is the only one carrying it, which is wrong, and carries it alone all season, which is heavy and unnecessary and entirely normal for eleven.', effect: { energy: -5, form: -0.03, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-safe-pass', title: 'The Safe Ball', icon: '↩️', category: 'crisis',
    minTurn: 4, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has stopped playing the difficult pass. He can still see it — it is there every time, the one through the gap — and every time he rolls it sideways instead and nobody says anything, because sideways is never wrong. He knows exactly why he is doing it and he keeps doing it anyway.',
        choices: [
          { id: 'try', label: 'Play the hard one and accept the cost', desc: 'Even if it goes straight out for a throw', outcome: 'The first three go astray and he feels every one. The fourth splits them open. He decides the three were the price of the fourth, and starts paying it more willingly.', effect: { attr: { creativity: 2, flair: 1 }, form: -0.03 }, next: 'weeks' },
          { id: 'stay', label: 'Keep it safe until he feels sure again', desc: 'Confidence first, risk after', outcome: 'He plays a hundred easy passes and gets none of them wrong, and the certainty creeps back the slow way. The gap is still there, waiting, unattempted.', effect: { attr: { composure: 2, teamwork: 1 }, form: 0.04 }, next: 'weeks' },
          { id: 'admit', label: 'Admit to himself it is fear, not tactics', desc: 'Stop dressing it up as a decision', outcome: 'He stops telling himself it is the sensible option. Just naming it properly makes the sideways pass harder to play, which turns out to be the point.', effect: { attr: { composure: 1, creativity: 1 } }, next: 'weeks' },
        ],
      },
      weeks: {
        id: 'weeks',
        prompt: 'Weeks later, one-nil up with ten to go, the gap opens again and there is a boy in space beyond it. Nobody watching would ever know if he did not see it.',
        choices: [
          { id: 'through', label: 'Slide it through', desc: 'Because he saw it', outcome: 'He slides it through. It does not lead to a goal and barely anyone notices, but he walks off knowing he did not lie to himself about what he saw.', effect: { attr: { creativity: 1, leadership: 1 }, form: 0.05 } },
          { id: 'keep', label: 'Keep the ball and see the game out', desc: 'One-nil is a result', outcome: 'He takes it into the corner instead and they win it, and he is honest enough afterwards to admit he is not sure which of the two reasons made the choice.', effect: { attr: { composure: 2 }, meters: { authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-cant-enjoy-win', title: 'Winning and Not Feeling It', icon: '😐', category: 'crisis',
    minTurn: 5, maxTurn: 42, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They win four-one and he scores two, and in the car afterwards he cannot find the feeling anywhere. He keeps checking for it, the way you check a pocket. All he can think about is the header he missed at nought-nought and how badly he took his second touch in the first half.',
        choices: [
          { id: 'list', label: 'Make himself list three good things', desc: 'Out loud, before he is allowed to list the bad', outcome: 'He forces out three, grudgingly, and by the third one the day has started to feel a bit more like the day everyone else had.', effect: { attr: { composure: 2 }, form: 0.04, tag: 'three-good-things' } },
          { id: 'accept', label: 'Accept that this is how his head works', desc: 'Chase the standard, not the feeling', outcome: 'He decides the missed header is simply what he is going to think about, and that it is fuel rather than a fault. It works, in a way, and costs something too.', effect: { attr: { composure: 1, aggression: 1 }, energy: -4, tag: 'never-satisfied' } },
          { id: 'ask', label: 'Ask why everyone else can just be pleased', desc: 'It seems like a skill he was not given', outcome: 'He asks the question honestly and gets the honest answer, which is that they are not thinking about it as hard as he is, and that this is mostly a gift and occasionally not.', effect: { attr: { composure: 1 }, meters: { family: 4, peers: 3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-clip', title: 'Watching Himself Back', icon: '📱', category: 'crisis',
    minTurn: 6, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Someone has cut a clip of him from the weekend and it goes round the group chat: forty seconds, music over the top, three touches that looked better from the touchline than they felt. He watches it eleven times and hates every version of himself in it — the way he runs, the way his head drops, how slow it all looks.',
        choices: [
          { id: 'delete', label: 'Watch it once more and leave it alone', desc: 'Nothing good is coming from the twelfth time', outcome: 'He shuts the phone in a drawer and goes outside. The clip is exactly as good or bad as it was before he memorised it, and he never watches it again.', effect: { attr: { composure: 2 }, energy: 3 } },
          { id: 'study', label: 'Watch it properly, coldly, for the useful bits', desc: 'Stop looking at how he looks', outcome: 'He forces himself past how he looks and into what he did, and finds two genuinely useful things about his first touch buried under all the embarrassment.', effect: { attr: { composure: 1, creativity: 1 }, form: 0.04, tag: 'studies-clips' } },
          { id: 'spiral', label: 'Keep watching', desc: 'Find every flaw and hold onto them', outcome: 'He watches it until it stops meaning anything and takes all forty seconds to bed with him. He plays the next game trying not to look like the boy in the clip.', effect: { form: -0.05, energy: -5, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-first-nerves', title: 'The First Time It Mattered', icon: '🫨', category: 'saga',
    minTurn: 1, maxTurn: 32, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has played a hundred games and never once felt this. Standing on the halfway line waiting for the whistle, his legs have gone strange and his mouth is dry and he genuinely wonders whether he is ill. Nothing about the game is different. Something about how much he wants it is.',
        choices: [
          { id: 'through', label: 'Play through it and find out it fades', desc: 'Ten minutes, then it is just football', outcome: 'The first tackle takes it clean out of him, and afterwards he understands something useful: the worst of it is always before, never during.', effect: { attr: { composure: 2 }, form: 0.04, tag: 'nerves-known' } },
          { id: 'freeze', label: 'Let it get to him', desc: 'Hide from the ball for twenty minutes', outcome: 'He spends twenty minutes making sure the ball does not come near him, and then hates himself more for that than he would have for any mistake.', effect: { form: -0.06, attr: { composure: 1 } } },
          { id: 'welcome', label: 'Decide the feeling is a good sign', desc: 'It only turns up when it means something', outcome: 'He works out that his body only does this when the game is worth doing, and starts, cautiously, to take it as a compliment.', effect: { attr: { composure: 1, leadership: 1 }, form: 0.05 } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-after-the-good-game', title: 'The Week After', icon: '⏳', category: 'crisis',
    minTurn: 3, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He played the best game of his life last Saturday and has spent all week being reminded of it. Now it is Friday and the only thought in his head is that he cannot possibly do that again, and that everyone is going to turn up expecting him to.',
        choices: [
          { id: 'reset', label: 'Treat it as a completely new game', desc: 'Last week is not owed to anybody', outcome: 'He decides last Saturday belongs to last Saturday. He plays a perfectly ordinary game and is not troubled by it. A rarer skill than the good game was.', effect: { attr: { composure: 2 }, form: 0.05 } },
          { id: 'repeat', label: 'Try to reproduce it exactly', desc: 'Same runs, same shots, same everything', outcome: 'He spends the first half trying to recreate a thing that only happened because he was not thinking, and the harder he reaches for it the further away it gets.', effect: { form: -0.05, energy: -5, attr: { flair: 1 } } },
          { id: 'quiet', label: 'Ask people to stop mentioning it', desc: 'Kindly, but genuinely', outcome: 'He tells them, embarrassed, that it makes it worse rather than better. They are surprised, and they stop, and the Friday gets slightly easier to stand in.', effect: { attr: { composure: 1 }, meters: { family: 4, peers: 3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-invisible-slump', title: 'Nobody Notices', icon: '🫥', category: 'crisis',
    minTurn: 7, maxTurn: 44, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six weeks of playing badly and nobody has said a word. He is still picked, still gets the same nod at the end, still gets told he did all right. Which is somehow worse — either they are being kind, or they cannot tell the difference between this and him playing properly.',
        choices: [
          { id: 'ask', label: 'Ask someone straight whether they have noticed', desc: 'Risk the answer being yes', outcome: 'He asks, and is told yes, obviously, and that everyone assumed he knew and was working on it. Six weeks of invisibility undone in one sentence.', effect: { attr: { composure: 1, leadership: 1 }, meters: { authority: 5 }, form: 0.04 } },
          { id: 'standard', label: 'Hold his own standard regardless', desc: 'Judge himself by what he knows, not what he is told', outcome: 'He decides that whether anyone else can tell is beside the point, and grinds through it privately. It is lonely and it works.', effect: { attr: { composure: 2, stamina: 1 }, energy: -4, tag: 'own-standard' } },
          { id: 'coast', label: 'Take the reassurance at face value', desc: 'Maybe it is only in his head', outcome: 'He lets himself believe it is all imagined and coasts another month, and when the drop finally does get mentioned it is a longer way back than it needed to be.', effect: { form: -0.05, energy: 4 } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-saying-it', title: 'Telling Someone', icon: '💬', category: 'crisis',
    minTurn: 8, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has been struggling for a month and has told nobody, on the grounds that saying it out loud would make it a real thing rather than a bad patch. Tonight someone asks him a soft, ordinary question — all right, are you — and there is a gap where the answer usually is.',
        choices: [
          { id: 'say', label: 'Say it', desc: 'Badly, in about nine words', outcome: 'He says he does not know, and that he is frightened of it not working. It comes out clumsily and it is the truest thing he has said all month, and nothing bad happens.', effect: { attr: { composure: 2, leadership: 1 }, meters: { family: 8 }, form: 0.04, tag: 'said-it-out-loud' }, next: 'after' },
          { id: 'half', label: 'Give half of it', desc: 'Enough to be honest, not enough to worry anyone', outcome: 'He says he is a bit tired and leaves the rest of it where it is. It counts for something, and he knows exactly how much of it he kept back.', effect: { meters: { family: 4 }, attr: { composure: 1 } }, next: 'after' },
          { id: 'fine', label: 'Say he is fine', desc: 'Because the answer is always fine', outcome: 'He says he is fine in the voice he keeps for it. The question does not come round again for a long while, and he half wishes it would.', effect: { energy: -4, attr: { composure: 1 } }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'Nothing changes overnight. But the month afterwards has a slightly different shape, depending on how much of it he is still carrying by himself.',
        choices: [
          { id: 'again', label: 'Decide he will say it earlier next time', desc: 'A month was too long', outcome: 'He makes a private rule that a fortnight is long enough to sit with something on his own. It is one of the more useful rules he ever makes.', effect: { attr: { composure: 2 }, meters: { family: 4 } } },
          { id: 'own', label: 'Keep it his own to sort out', desc: 'Talking is not the same as fixing', outcome: 'He decides the fixing is still his job either way, and gets on with it quietly. He is not entirely wrong, and not entirely right either.', effect: { attr: { composure: 1, stamina: 1 }, form: 0.03 } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-week-off', title: 'A Week Off', icon: '🛋️', category: 'offpitch',
    minTurn: 6, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He wants a week off. Not for good, not because of anything — he just wants one Saturday where he wakes up and it is only a Saturday. The wanting itself is what bothers him: he is fairly sure the boys who make it never want a week off.',
        choices: [
          { id: 'take', label: 'Take it', desc: 'One week, no ball, no guilt allowed', outcome: 'He takes the week, feels guilty for three days of it, and comes back on the fourth wanting to play so badly he goes out in the dark to do it.', effect: { energy: 12, form: 0.05, attr: { composure: 1 }, tag: 'took-a-week' }, next: 'after' },
          { id: 'push', label: 'Push through and say nothing', desc: 'Wanting a rest is not a reason for one', outcome: 'He plays every day of the week he wanted off and plays all of it flat, and learns nothing except that he can make himself do things.', effect: { energy: -10, form: -0.04, attr: { stamina: 2 } }, next: 'after' },
          { id: 'half', label: 'Keep the games, drop everything else', desc: 'A compromise he can live with', outcome: 'He plays the Saturday and does absolutely nothing else all week, and finds most of what he needed was in the nothing rather than the not playing.', effect: { energy: 6, attr: { composure: 1 } }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The wanting comes back a few months later, the same way, on an ordinary Wednesday.',
        choices: [
          { id: 'normal', label: 'Treat it as normal now', desc: 'Everyone gets tired of things they love', outcome: 'The second time it frightens him far less. He handles it in an afternoon rather than a fortnight, and it goes.', effect: { attr: { composure: 2 }, energy: 5 } },
          { id: 'worry', label: 'Worry about what it means', desc: 'Whether wanting a break means not wanting it', outcome: 'He spends a while genuinely troubled by the question, before working out that they are two different things wearing the same coat.', effect: { attr: { composure: 1 }, energy: -3, form: 0.03 } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-found-out', title: 'Found Out', icon: '🎭', category: 'crisis',
    minTurn: 9, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A quiet, persistent conviction has settled in him: that he is not actually as good as people currently think, that the last two years were mostly luck and being tall early, and that at some point fairly soon everybody is going to notice at once.',
        choices: [
          { id: 'evidence', label: 'Test it against the evidence', desc: 'Count the games, not the feeling', outcome: 'He goes back through the season honestly and finds the feeling does not survive contact with the actual list of things he has done. It comes back anyway, but weaker.', effect: { attr: { composure: 2 }, form: 0.04 } },
          { id: 'work', label: 'Try to outwork the fear', desc: 'Be so prepared there is nothing to find out', outcome: 'He trains as though he is behind, which makes him better and keeps him tired, and does not touch the fear itself at all.', effect: { attr: { stamina: 2, aggression: 1 }, energy: -7, form: 0.04, tag: 'outworks-the-fear' } },
          { id: 'hide', label: 'Avoid anything he might fail at', desc: 'Nothing exposed, nothing exposed', outcome: 'He quietly stops volunteering for anything he is not certain of. It works perfectly, in the sense that nobody finds out anything at all, including him.', effect: { form: -0.04, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-boy-in-red', title: 'The Boy He Never Meets Again', icon: '👤', category: 'crisis',
    minTurn: 5, maxTurn: 42, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A friendly against a club from two counties over, and there is a boy in red who is simply better than him at everything, calmly, without seeming to try. Ninety minutes, one handshake, and he will never see him again as long as he lives. He thinks about him for a month.',
        choices: [
          { id: 'measure', label: 'Use him as the measure', desc: 'That is the standard now, wherever he is', outcome: 'He keeps the boy in red in his head as a bar to get over, and trains against a ghost for a season. The ghost never gets tired and never has a bad week.', effect: { attr: { aggression: 1, stamina: 1 }, form: 0.05, energy: -4, tag: 'boy-in-red' } },
          { id: 'let', label: 'Let him go', desc: 'One game, one afternoon, one boy', outcome: 'He works out that he has built an entire career for a boy he watched for ninety minutes, and that the boy probably went home and worried about someone else.', effect: { attr: { composure: 2 }, energy: 4 } },
          { id: 'steal', label: 'Take one thing off him and drop the rest', desc: 'The way he received the ball half-turned', outcome: 'He copies exactly one habit — the half-turn before the ball arrives — and lets the rest of the boy go. Within a month it is his own and he stops thinking about where it came from.', effect: { attr: { creativity: 2 }, form: 0.04 } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-when-watched', title: 'When Someone Is Watching', icon: '👀', category: 'crisis',
    minTurn: 4, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'On his own against a wall, or in a game nobody cares about, everything works. The moment there is a line of people along the touchline, his first touch goes strange and his feet get heavier and he becomes a slightly worse player than he actually is. He has noticed the pattern and cannot switch it off.',
        choices: [
          { id: 'narrow', label: 'Shrink the game down to the next pass', desc: 'The touchline is not in it', outcome: 'He teaches himself to make the world about four yards wide for ninety minutes. It takes half a season and it holds, mostly, on the days he remembers to do it.', effect: { attr: { composure: 2 }, form: 0.05, tag: 'narrows-the-world' }, next: 'test' },
          { id: 'expose', label: 'Deliberately play where people watch', desc: 'The cage, the park, the games with an audience', outcome: 'He starts choosing the pitch with people round it instead of the quiet one. It is horrible for a month and then it is simply normal, which was the whole idea.', effect: { attr: { composure: 1, flair: 2 }, energy: -4 }, next: 'test' },
          { id: 'perform', label: 'Try to play for them', desc: 'Give the touchline something worth watching', outcome: 'He plays to the crowd and finds it makes everything both louder and worse, because now every touch has an audience he has personally invited.', effect: { attr: { flair: 1 }, form: -0.04, meters: { peers: 3 } }, next: 'test' },
        ],
      },
      test: {
        id: 'test',
        prompt: 'Then a game with three deep along one side and a man with a clipboard who is almost certainly there for somebody else entirely.',
        choices: [
          { id: 'same', label: 'Play exactly the game he plays on his own', desc: 'No more, no less', outcome: 'He plays his ordinary game, well, and walks off knowing it was the same one he plays against the wall. That is the whole victory and it is a large one.', effect: { attr: { composure: 2 }, form: 0.06 } },
          { id: 'extra', label: 'Find another ten per cent for it', desc: 'If they are watching, give them something', outcome: 'He raises it and it comes off, this time. He is aware, walking off, that he has made himself dependent on the touchline being there.', effect: { form: 0.07, attr: { flair: 1 }, energy: -5 } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-too-hard', title: 'Harder On Himself Than Anyone', icon: '🪞', category: 'crisis',
    minTurn: 2, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'When another boy miscontrols one he says bad luck and means it. When he does the same he calls himself something under his breath that he would never say to anybody else, and then carries it for three more minutes and misses the next thing too.',
        choices: [
          { id: 'kinder', label: 'Talk to himself the way he talks to them', desc: 'Out loud if he has to', outcome: 'He starts saying next one, deliberately, the same two words he gives everyone else. It feels ridiculous for a fortnight and then it starts working.', effect: { attr: { composure: 2, teamwork: 1 }, form: 0.05, tag: 'next-one' } },
          { id: 'reset', label: 'Give himself five seconds and then a rule', desc: 'Angry until the ball goes out, then done', outcome: 'He allows himself five seconds of fury and then it is over by rule. Some days he cheats and takes twenty, but the rule mostly holds.', effect: { attr: { composure: 1, aggression: 1 }, form: 0.04 } },
          { id: 'keep', label: 'Keep the edge', desc: 'The anger is why he is any good', outcome: 'He decides the sharpness is the engine and refuses to blunt it. It drives him hard and it costs him the odd twenty minutes of every bad game.', effect: { attr: { aggression: 2 }, form: 0.03, energy: -4, tag: 'sharp-edge' } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-no-stakes', title: 'A Game That Does Not Count', icon: '🌤️', category: 'triumph',
    minTurn: 12, maxTurn: 46, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A friendly arranged at two days notice against nobody in particular, no league points, no table, half the squad missing and a parent running the line. He realises somewhere around the twentieth minute that he is enjoying himself more than he has all year, and that this is quite a sad thing to realise.',
        choices: [
          { id: 'notice', label: 'Notice what the difference actually is', desc: 'Nothing about the football has changed', outcome: 'The football is identical. The only missing thing is the part of him that watches himself play. He tries, from then on, to leave that part in the changing room.', effect: { attr: { composure: 2, flair: 1 }, form: 0.06, tag: 'left-the-watcher' } },
          { id: 'enjoy', label: 'Just have the afternoon', desc: 'No lesson required', outcome: 'He plays two hours of football for no reason whatsoever and goes home filthy and happy, and does not examine it. Possibly the correct response.', effect: { energy: 8, form: 0.05, meters: { peers: 4 } } },
          { id: 'guilt', label: 'Feel guilty for enjoying the easy one', desc: 'Anyone can play well when it does not matter', outcome: 'He talks himself out of the afternoon on the way home on the grounds that it did not count, and arrives back with less than he left with.', effect: { form: -0.03, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-good-label', title: 'Told He Is Good', icon: '🏷️', category: 'crisis',
    minTurn: 11, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It has become a fact about him, the way his height is. He is the one who is good. Nobody says it as praise any more, they say it as a description, and somewhere in the last year it stopped being something he gets to enjoy and started being something he has to keep proving weekly.',
        choices: [
          { id: 'separate', label: 'Separate what he does from what he is', desc: 'He plays well. He is not the word.', outcome: 'He works out, slowly, that good is a thing he does on Saturdays rather than a thing he has to be at all times. It takes a weight off he did not know he was under.', effect: { attr: { composure: 2 }, form: 0.05, tag: 'not-the-label' }, next: 'test' },
          { id: 'carry', label: 'Carry it and let it drive him', desc: 'If they say it, live up to it', outcome: 'He takes the description as an obligation and meets it most weeks. The weeks he does not meet it are worse than they would otherwise have been.', effect: { attr: { leadership: 1, aggression: 1 }, form: 0.04, energy: -5 }, next: 'test' },
          { id: 'shrug', label: 'Refuse the whole conversation', desc: 'Stop agreeing and stop arguing', outcome: 'He starts changing the subject every time it comes up, neither modest nor pleased, and the label loses some of its grip through simple lack of feeding.', effect: { attr: { composure: 1 }, meters: { peers: 3 } }, next: 'test' },
        ],
      },
      test: {
        id: 'test',
        prompt: 'Then a genuinely poor game, watched by people who have only ever been told he is good.',
        choices: [
          { id: 'own', label: 'Own it plainly', desc: 'That was bad. Next week.', outcome: 'He says it was poor, out loud, without decorating it, and finds that admitting it costs him almost nothing and ends the whole subject.', effect: { attr: { composure: 2, leadership: 1 }, meters: { authority: 4 } } },
          { id: 'excuse', label: 'Explain it away', desc: 'The pitch, the position, the week he had', outcome: 'He gives three reasons that are all partly true, and knows while he is saying them that the reason he is saying them is the label.', effect: { form: -0.03, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-perfect', title: 'The Perfect Version', icon: '📐', category: 'crisis',
    minTurn: 14, maxTurn: 48, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a version of the game in his head that he plays against every week: the one where every touch is clean and nothing is scruffy. He has never once played that game. He measures every actual Saturday against it and every actual Saturday loses.',
        choices: [
          { id: 'lower', label: 'Change what he is measuring against', desc: 'Last month, not the imaginary version', outcome: 'He starts comparing himself to himself in October rather than to a boy who does not exist. The results are immediately less bleak and considerably more useful.', effect: { attr: { composure: 2 }, form: 0.05, tag: 'measures-against-himself' } },
          { id: 'keep', label: 'Keep the perfect version', desc: 'It is the only reason he improves', outcome: 'He hangs on to the imaginary game and chases it. It pulls him forward, which is real, and it means he never quite arrives anywhere, which is also real.', effect: { attr: { creativity: 1, aggression: 1 }, form: 0.04, energy: -5, tag: 'chases-perfect' } },
          { id: 'scruffy', label: 'Learn to like the scruffy ones', desc: 'A toe-poke counts the same', outcome: 'He makes himself admire an ugly cleared header and a shinned finish, and slowly the game gets bigger than the narrow, beautiful thing he had it down as.', effect: { attr: { teamwork: 2, composure: 1 }, form: 0.04 } },
        ],
      },
    },
  },
  {
    id: 'youth-doubt-quit-thought', title: 'The Thought of Stopping', icon: '🚪', category: 'crisis',
    minTurn: 16, maxTurn: 48, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Walking back with his bag one evening, he thinks, quite calmly, that he could just not go any more. Nobody would stop him. The thought is not dramatic and it is not a decision — it arrives, sits there for a minute, and frightens him slightly for being so easy to think.',
        choices: [
          { id: 'sit', label: 'Let the thought finish', desc: 'Follow it all the way to Saturday without it', outcome: 'He imagines the Saturday properly: the empty morning, the not-knowing-what-to-do. By the end of the walk the thought has answered itself and gone quiet.', effect: { attr: { composure: 2 }, form: 0.04, tag: 'thought-about-stopping' }, next: 'after' },
          { id: 'scare', label: 'Push it away quickly', desc: 'Do not look at it', outcome: 'He shoves it under and walks faster. It surfaces twice more that winter, each time in the same place, and each time he does the same thing with it.', effect: { energy: -4, attr: { composure: 1 } }, next: 'after' },
          { id: 'talk', label: 'Mention it to someone that evening', desc: 'Not as a threat — just as a thing he thought', outcome: 'He says it out loud, carefully, and it is taken seriously and not panicked over. Saying it turns out to shrink it to roughly its actual size.', effect: { meters: { family: 7 }, attr: { composure: 1, leadership: 1 } }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'He goes on Saturday, obviously. But he knows now that going is a thing he does rather than a thing that simply happens to him.',
        choices: [
          { id: 'choose', label: 'Decide he is choosing it', desc: 'Every week, on purpose', outcome: 'He starts thinking of it as a decision he renews rather than a track he is on. It makes the hard weeks harder to complain about and easier to get through.', effect: { attr: { composure: 2, leadership: 1 }, form: 0.05 } },
          { id: 'quiet', label: 'Say nothing and keep going', desc: 'Some things do not need concluding', outcome: 'He never mentions the evening again to anyone and goes every week for years, and remembers the exact stretch of pavement for the rest of his life.', effect: { attr: { composure: 1, stamina: 1 }, form: 0.03 } },
        ],
      },
    },
  },
];
