import type { StoryArc } from '../storyarc.js';

// SAGA arcs — long, branching, career-shaping storylines that unfold over several turns.
export const SAGA_ARCS: StoryArc[] = [
  {
    id: 'transfer-saga', title: 'The Big Move', icon: '✈️', category: 'saga',
    minTurn: 54, maxTurn: 105, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A giant of the game has come calling — a life-changing move, but it means leaving the club that made him. The agent wants an answer. How does he play it?',
        choices: [
          { id: 'push', label: 'Force the move', desc: 'Hand in a transfer request — burn the bridge, chase the dream', outcome: 'He tells the club he wants out. The fans turn; the move edges closer.', effect: { market: 3, greed: 2, meters: { fans: -18, authority: -8 }, tag: 'pushed' }, next: 'pushed' },
          { id: 'loyal', label: 'Stay loyal', desc: 'Publicly commit to the club — turn the giants down', outcome: 'He kisses the badge and stays. The terraces roar his name.', effect: { form: 0.06, meters: { fans: 16, authority: 6 }, attr: { leadership: 1 }, tag: 'stayed' }, next: 'stayed' },
          { id: 'leverage', label: 'Use it for leverage', desc: 'Let it drag on — angle for a bumper new deal to stay', outcome: 'The saga rumbles on. The club, twitchy, tables a huge renewal to keep him.', effect: { earnings: 700, greed: 1, market: 2, meters: { fans: -4 }, tag: 'leveraged' }, next: 'leveraged' },
          { id: 'crossed-once', label: 'Refuse — he has crossed a divide before', desc: 'He knows exactly what a badge is worth to the people in that stand', outcome: 'He has already pulled on colours he was raised to hate and heard what it does to a city, and he decides once is enough for any career. He stays, and says so plainly.', effect: { attr: { leadership: 1 }, meters: { fans: 18, authority: 8, agent: -6 }, form: 0.05, tag: 'stayed' }, next: 'stayed', requires: 'defected' },
        ],
      },
      pushed: {
        id: 'pushed',
        prompt: 'Deadline day. The move is there to be done — but the fee has stalled and the window is closing. Nerve, or cold feet?',
        choices: [
          { id: 'seal', label: 'Force it through', desc: 'Down tools until it’s signed', outcome: 'It gets done in the final hour. A new giant, a new pressure, a fortune banked.', effect: { earnings: 1200, market: 3, form: -0.08, meters: { fans: -6 } } },
          { id: 'collapse', label: 'Let it collapse', desc: 'Refuse the drama — stay put after all', outcome: 'The deal dies at midnight. He’s stuck at a club whose fans now doubt him.', effect: { form: -0.1, meters: { fans: -10, authority: -6 } } },
        ],
      },
      stayed: {
        id: 'stayed',
        prompt: 'Word of his loyalty spreads. The manager offers him a bigger role as the heartbeat of the side. Does he take the weight?',
        choices: [
          { id: 'accept', label: 'Embrace it', desc: 'Become the club’s talisman', outcome: 'He carries the team on his back — and grows into a leader for it.', effect: { attr: { leadership: 2 }, meters: { authority: 8 }, form: 0.05, energy: -10 } },
          { id: 'quiet', label: 'Keep his head down', desc: 'Let his football do the talking', outcome: 'No fuss, just performances — the fans adore the humility.', effect: { meters: { fans: 8, authority: -4 }, form: 0.04 } },
        ],
      },
      leveraged: {
        id: 'leveraged',
        prompt: 'The new deal is signed — richer, but some in the dressing room feel he held the club to ransom. Mend it, or let it lie?',
        choices: [
          { id: 'mend', label: 'Win the room back', desc: 'Graft, buy the lunches, lead by example', outcome: 'He earns it back the hard way — respect restored.', effect: { meters: { peers: 10, authority: 4 }, attr: { teamwork: 1 } } },
          { id: 'shrug', label: 'It’s just business', desc: 'Let the money talk', outcome: 'He shrugs it off. The wage packet grows; a little warmth is lost.', effect: { greed: 1, meters: { peers: -6 } } },
        ],
      },
    },
  },
  {
    id: 'captaincy-journey', title: 'The Armband', icon: '🎗️', category: 'saga',
    minTurn: 46, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The old skipper is on his way out, and the manager pulls him aside: the armband could be his. It’s an honour — and a target on his back. Does he want it?',
        choices: [
          { id: 'want', label: 'Step up', desc: 'Tell the gaffer he’s ready to lead', outcome: 'He takes the armband, chest out. Now he has to earn the respect that comes with it.', effect: { attr: { leadership: 1 }, meters: { authority: 8 }, tag: 'captain' }, next: 'test' },
          { id: 'defer', label: 'Not yet', desc: 'Say a senior head should wear it first', outcome: 'He defers — humble, but the moment passes to someone else. His turn will come.', effect: { meters: { peers: 8, authority: -2 } } },
        ],
      },
      test: {
        id: 'test',
        prompt: 'First real test as captain: the team is 2-0 down at half-time, heads dropping, and {RIVAL}’s side are running riot. What does he do in that dressing room?',
        choices: [
          { id: 'rally', label: 'Rally them', desc: 'A speech from the heart — drag them back into it', outcome: 'His words land. They come out transformed and salvage a draw. A captain is born.', effect: { attr: { leadership: 2 }, meters: { authority: 10, peers: 8 }, form: 0.06, energy: -6 } },
          { id: 'lead-quiet', label: 'Lead by example', desc: 'Say little — go out and drag them by the collar himself', outcome: 'No speeches, just a performance nobody could ignore. The armband suits him.', effect: { attr: { leadership: 1, stamina: 1 }, meters: { peers: 10 }, form: 0.05, energy: -13 } },
        ],
      },
    },
  },
  {
    id: 'relegation-battle', title: 'The Drop Fight', icon: '🪂', category: 'saga',
    minTurn: 46, maxTurn: 107, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club is sliding toward the drop, the fans are restless, and agents are whispering that a sinking ship is no place for a talent like his. Does he jump, or fight?',
        choices: [
          { id: 'fight', label: 'Fight for the club', desc: 'Publicly commit to keeping them up', outcome: 'He nails his colours to the mast — the fans rally behind their leader.', effect: { attr: { leadership: 1 }, meters: { fans: 14, authority: 6 }, tag: 'fighter' }, next: 'finalday' },
          { id: 'angle', label: 'Angle for an exit', desc: 'Quietly let it be known he’d welcome a move', outcome: 'Word gets out. Some fans feel betrayed just when they needed him most.', effect: { market: 2, meters: { fans: -12 } } },
        ],
      },
      finalday: {
        id: 'finalday',
        prompt: 'The final day. Win and they stay up; anything less and they go down. It’s scoreless, seconds left, and the ball drops to him at the far post. This is it.',
        choices: [
          { id: 'hero', label: 'Gamble everything', desc: 'Throw himself at it — hero or villain', outcome: 'He bundles it in at the death. Survival! Grown men weep in the stands, chanting his name.', effect: { form: 0.12, attr: { aggression: 1 }, meters: { fans: 24, authority: 10 }, energy: -12 } },
          { id: 'safe', label: 'Play the percentages', desc: 'Lay it off to a better-placed teammate', outcome: 'He squares it; the finish is someone else’s, but the point stands and they survive.', effect: { form: 0.06, attr: { teamwork: 1 }, meters: { peers: 12, fans: 10 }, market: -2 } },
        ],
      },
    },
  },
  {
    id: 'saga-title-race', title: 'The Final Day', icon: '🏆', category: 'saga',
    minTurn: 86, maxTurn: 110, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It has come down to this: level on points at the summit, one match left, the title in their own hands if they hold their nerve. The whole season funnels into ninety minutes. How does he carry himself into the biggest week of his life?',
        choices: [
          { id: 'front', label: 'Front the cameras', desc: 'Stand up in the pre-match press room and shoulder the expectation', outcome: 'He looks the nation in the eye and promises nothing but everything. The dressing room stands taller for it.', effect: { attr: { leadership: 2 }, meters: { fans: 12, authority: 6 }, energy: -8, form: -0.03, tag: 'talisman' }, next: 'kickoff' },
          { id: 'insulate', label: 'Shut out the noise', desc: 'Go quiet — phone off, curtains drawn, save every drop for Saturday', outcome: 'He vanishes from the circus and turns up on the day with cold, clear eyes.', effect: { attr: { composure: 2 }, form: 0.05, meters: { peers: 6, fans: -6, authority: -4 }, tag: 'ice' }, next: 'kickoff' },
          { id: 'said-it-before', label: 'Say what he said before the playoff', desc: 'He has spoken to a room with a club’s whole future on one match', outcome: 'He gathers them and repeats, almost word for word, what he told a terrified dressing room the last time everything came down to a single afternoon. It steadied them then, too.', effect: { attr: { leadership: 2, composure: 1 }, meters: { peers: 12, authority: 8 }, energy: -6, tag: 'talisman' }, next: 'kickoff', requires: 'playoff-calm' },
        ],
      },
      kickoff: {
        id: 'kickoff',
        prompt: 'Hour gone, still goalless, and word crackles round the ground that {RIVAL}’s lot have gone ahead in the other game — a single goal now hands them everything. The stadium turns brittle. He gets the ball on the halfway line with acres ahead of him.',
        choices: [
          { id: 'drive', label: 'Drive at them', desc: 'Put his head down and carry the whole club on that one run', outcome: 'He surges through three challenges and rifles it in off the bar. The title tilts back their way and the roar nearly lifts the roof.', effect: { form: 0.14, attr: { aggression: 1, flair: 2 }, meters: { fans: 26, authority: 10, peers: -8 }, energy: -14 }, next: 'whistle' },
          { id: 'orchestrate', label: 'Slow it down', desc: 'Trust the plan — knit the passes, wait for the crack to open', outcome: 'He pulls the tempo back to a walk, teases them out of shape, then threads the pass that unlocks it. Clinical.', effect: { form: 0.1, attr: { creativity: 2, teamwork: 1 }, meters: { peers: 14, fans: 16 }, energy: -6 }, next: 'whistle' },
        ],
      },
      whistle: {
        id: 'whistle',
        prompt: 'The final whistle detonates the stadium — champions, on the last kick of the season, by the width of a single goal. Amid the pile-on and the flares, a reporter shoves a microphone at him for the first word of a new era.',
        choices: [
          { id: 'humble', label: 'Hand it to the badge', desc: 'Give every ounce of it to the fans and the fallen', outcome: 'He dedicates the lot to the supporters who never stopped singing. A club immortal, and a humble one.', effect: { attr: { leadership: 1 }, meters: { fans: 20, authority: 8, sponsors: -6 }, earnings: 400 } },
          { id: 'roar', label: 'Let it all out', desc: 'Rip the shirt off and bellow into the away end', outcome: 'He tears his jersey off and screams at {RIVAL}’s emptying stand. Iconic, feral, and utterly unforgettable.', effect: { attr: { aggression: 1, flair: 2, composure: -1 }, meters: { fans: 16, sponsors: 8, authority: -6 }, market: 3 } },
          { id: 'give-the-mic', label: 'Hand the microphone to the youngest man', desc: 'He fronted every camera all week so that nobody else had to', outcome: 'He has taken every question and every flashbulb of this run-in, so he pulls the teenager in beside him, puts the microphone in the boy’s hand, and steps out of the shot.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 18, fans: 14, authority: 8, sponsors: -6 } }, requires: 'talisman' },
        ],
      },
    },
  },
  {
    id: 'saga-underdog-cup', title: 'The Giant-Killers', icon: '⚔️', category: 'saga',
    minTurn: 54, maxTurn: 105, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club of his modest stature was never meant to still be in this cup, yet the draw has paired them with the reigning champions under the lights. The pundits have already written the scoreline. What does he tell the lads on the coach?',
        choices: [
          { id: 'believe', label: 'Preach belief', desc: 'Convince the room that nobody remembers the favourites', outcome: 'He stands in the aisle and swears they can shock the country. Something electric passes down the coach.', effect: { attr: { leadership: 2 }, meters: { peers: 12, authority: 6 }, form: 0.05, energy: -6, tag: 'believers' }, next: 'giant' },
          { id: 'freedom', label: 'Sell them freedom', desc: 'Tell them there’s no pressure — go and enjoy the ride', outcome: 'He shrugs and grins: nothing to lose, everything to gain. The tension drains out of them.', effect: { attr: { composure: 1, flair: 2 }, meters: { peers: 10, authority: -5 }, form: 0.06, tag: 'loose' }, next: 'giant' },
        ],
      },
      giant: {
        id: 'giant',
        prompt: 'Against all logic they lead by a single goal into the closing stages, but the champions are camped in their half and legs are turning to lead. The bench is screaming two different things at once. What does he do to see it out?',
        choices: [
          { id: 'wall', label: 'Marshal the wall', desc: 'Drop deep, organise bodies, throw himself in front of everything', outcome: 'He drags the whole team behind the ball and heads clear the last desperate cross. They hold. Bedlam.', effect: { attr: { teamwork: 2, aggression: 1, stamina: -1 }, meters: { fans: 22, authority: 8 } }, next: 'aftermath' },
          { id: 'counter', label: 'Hunt the killer second', desc: 'Keep a runner high and gamble on the break to finish them', outcome: 'He springs the counter himself and buries the second at the death. The tie is over as a contest.', effect: { form: 0.12, attr: { flair: 2, aggression: 1 }, meters: { fans: 24, sponsors: 6 } }, next: 'aftermath' },
        ],
      },
      aftermath: {
        id: 'aftermath',
        prompt: 'By dawn his name is on every back page and his phone is thick with sporting directors who never returned his calls before. The little club that raised him suddenly looks like a stepping stone. How does he handle the sudden gravity?',
        choices: [
          { id: 'stay', label: 'Stay for the run', desc: 'Wave the vultures off — see this fairytale to the final', outcome: 'He tells the agents to wait until summer; some stories are worth more than money. The town falls in love.', effect: { attr: { leadership: 1 }, meters: { fans: 18, authority: 6 }, form: 0.04 } },
          { id: 'cashin', label: 'Ride the momentum', desc: 'Let his agent shop the highlight reel while it’s hot', outcome: 'He lets the offers stack up, his valuation ballooning on ninety famous minutes. Business is business.', effect: { market: 4, greed: 1, earnings: 500, meters: { fans: -6, agent: 8 } } },
          { id: 'all-of-us', label: 'Make them value the whole team, not just him', desc: 'He told that coach they could all do it — he meant all of them', outcome: 'He tells the sporting directors that any conversation about him begins with the two teammates nobody has called about, and the little club suddenly has three valuable players instead of one.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 18, fans: 12, agent: -6 }, market: 1 }, requires: 'believers' },
        ],
      },
    },
  },
  {
    id: 'saga-homecoming', title: 'The Return', icon: '🏡', category: 'saga',
    minTurn: 110, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club that first believed in him — the one whose youth pitches he can still smell — comes calling in the autumn of his career, wanting the prodigal son home. It is less money and lower stakes, but it tugs at something the bank balance can’t reach. Does he go back?',
        choices: [
          { id: 'return', label: 'Go home', desc: 'Sign for the club that made him, wages be damned', outcome: 'He puts pen to paper where it all began, throat tight as the old crest goes over his heart.', effect: { attr: { leadership: 1 }, meters: { fans: 16, family: 10 }, earnings: -300, tag: 'homecoming' }, next: 'debut' },
          { id: 'decline', label: 'Chase one more prize', desc: 'Politely turn them down — his legs have a final trophy left in them', outcome: 'He thanks them and says the timing’s wrong; sentiment can wait until the medals are won.', effect: { greed: 1, market: 1, meters: { fans: -4, agent: 4 } } },
        ],
      },
      debut: {
        id: 'debut',
        prompt: 'His second debut, back in front of the terrace that once chanted him as a teenager. But a decade has passed, the legs are slower, and a hungry academy kid is breathing down his neck for the same shirt. What kind of returning hero is he?',
        choices: [
          { id: 'mentor', label: 'Raise the next one', desc: 'Take the kid under his wing rather than block his path', outcome: 'He plays half the minutes and gives the rest to the boy, teaching him everything. A different kind of legacy grows.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 14, authority: 8, fans: 10 }, form: -0.05 }, next: 'legacy' },
          { id: 'prove', label: 'Prove he’s not finished', desc: 'Show the doubters the old magic never left', outcome: 'He runs the game from memory and instinct, silencing anyone who called him a nostalgia signing.', effect: { form: 0.08, attr: { creativity: 2 }, meters: { fans: 18 }, energy: -12 }, next: 'legacy' },
        ],
      },
      legacy: {
        id: 'legacy',
        prompt: 'The season winds down and the club offers to retire his number, hang his shirt in the concourse, name him something more than a player. It is a curtain call dressed as an honour. What does he ask them to make of him?',
        choices: [
          { id: 'ambassador', label: 'Become an institution', desc: 'Accept a role that keeps him bound to the club for life', outcome: 'He signs on as more than a footballer now — a keeper of the flame for whoever wears it next.', effect: { attr: { leadership: 1 }, meters: { fans: 20, authority: 10, family: 6 }, earnings: 200, market: -2 } },
          { id: 'oneofus', label: 'Just be one of them', desc: 'Wave off the pageantry — he only ever wanted to play', outcome: 'He asks them to skip the ceremony; the badge on his chest was always honour enough.', effect: { meters: { fans: 14, peers: 8, sponsors: -8 }, form: 0.03 } },
        ],
      },
    },
  },
  {
    id: 'saga-position-switch', title: 'The Reinvention', icon: '🔄', category: 'saga',
    minTurn: 85, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The yard of pace that made him a terror out wide has quietly slipped away, and the manager sits him down with a diagram: the flyer could have years left in him — as a full-back. It is a demotion dressed as a lifeline, or a lifeline dressed as a demotion. Which does he choose to see?',
        choices: [
          { id: 'embrace', label: 'Reinvent himself', desc: 'Attack the new role like a rookie all over again', outcome: 'He throws his pride in a drawer and spends every session relearning the game from a yard deeper. Humbling, and thrilling.', effect: { attr: { teamwork: 2, stamina: 1 }, meters: { authority: 6, peers: 8 }, tag: 'converted' }, next: 'adapt' },
          { id: 'resist', label: 'Refuse to move back', desc: 'Insist he’s still a winger and demand his old berth', outcome: 'He digs his heels in and fights for the shirt up top, betting his legs can still cash the cheque.', effect: { attr: { aggression: 1 }, meters: { authority: -4, peers: -4 }, form: -0.04, tag: 'stubborn' }, next: 'adapt' },
        ],
      },
      adapt: {
        id: 'adapt',
        prompt: 'Whichever path he took, a night comes that tests it: a rapid young winger — {RIVAL}’s newest weapon — is running straight at him for ninety minutes with everything to prove against a supposedly finished man. How does he win the duel?',
        choices: [
          { id: 'craft', label: 'Out-think him', desc: 'Use every trick a decade of pace once taught him', outcome: 'He shepherds the kid into blind alleys all night, reading him like a book he wrote. Cunning beats quick.', effect: { attr: { composure: 1, creativity: 2 }, meters: { peers: 12, fans: 10, family: -6 }, form: 0.07 } },
          { id: 'graft', label: 'Out-run him anyway', desc: 'Dig into the tank and simply refuse to be beaten', outcome: 'He matches the boy stride for stride to the whistle, lungs screaming, and earns a standing ovation for sheer bloody-mindedness.', effect: { attr: { stamina: 2, aggression: 1 }, meters: { fans: 14, authority: 6 }, form: 0.05, energy: -16 } },
          { id: 'proper-defender', label: 'Defend it like a full-back', desc: 'He learned the position properly instead of faking his way through it', outcome: 'He shows the boy the line, closes the angle, and takes the ball off him with a defender’s footwork he did not own a year ago. The new trade, paid off in a single duel.', effect: { form: 0.09, attr: { teamwork: 2 }, meters: { authority: 10, peers: 8 }, energy: -8 }, requires: 'converted' },
        ],
      },
    },
  },
  {
    id: 'saga-new-signing', title: 'The Replacement', icon: '🪑', category: 'saga',
    minTurn: 86, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club has splashed a club-record fee on a glittering young star who plays his exact position — the message is unsubtle. The new boy is unveiled to fireworks while he watches from the car park. What is his first move?',
        choices: [
          { id: 'welcome', label: 'Take the kid in', desc: 'Be the bigger man — help the newcomer settle', outcome: 'He’s first to shake the new lad’s hand and show him the ropes, however much it stings. Class travels.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { peers: 12, authority: 6 }, tag: 'gracious' }, next: 'battle' },
          { id: 'war', label: 'Declare war', desc: 'Treat the signing as a gauntlet and outwork him daily', outcome: 'He turns every training drill into a private duel, out to prove the money was wasted. The temperature rises.', effect: { attr: { aggression: 2 }, meters: { peers: -4, authority: 2 }, form: 0.05, tag: 'rivalrous' }, next: 'battle' },
        ],
      },
      battle: {
        id: 'battle',
        prompt: 'Injuries force the manager into a corner: for one enormous match he can only start one of them, and he asks the pair to settle it in a behind-closed-doors practice game. Everything hangs on a Tuesday scrimmage nobody will see. How does he approach it?',
        choices: [
          { id: 'masterclass', label: 'Deliver a masterclass', desc: 'Put on a display of pure, unarguable quality', outcome: 'He runs the practice match like a maestro, leaving no doubt whose shirt it is. The staff exchange glances.', effect: { form: 0.1, attr: { creativity: 2 }, meters: { authority: 8, peers: -6 }, energy: -8 }, next: 'verdict' },
          { id: 'selfless', label: 'Make the kid shine', desc: 'Set up chance after chance to prove he lifts a team', outcome: 'He turns provider, gifting the newcomer goals to show his value isn’t measured in his own tally alone.', effect: { attr: { teamwork: 2 }, meters: { peers: 14, authority: -4 }, form: 0.05, market: -3 }, next: 'verdict' },
        ],
      },
      verdict: {
        id: 'verdict',
        prompt: 'The manager pulls him in to deliver the call. Whatever the outcome of the scrimmage, the club’s long-term plan is written in that record fee, and they both know it. What does he say when the door closes?',
        choices: [
          { id: 'fight', label: 'Vow to fight on', desc: 'Tell the gaffer he’ll rip the shirt back off the kid', outcome: 'He refuses the role of elder statesman and swears he’ll start every week on merit. The manager can’t help but admire it.', effect: { attr: { aggression: 1, leadership: 1 }, meters: { authority: 6 }, form: 0.06, energy: -10 } },
          { id: 'terms', label: 'Ask for a fair exit', desc: 'Request a move where he’ll still be first name on the sheet', outcome: 'He asks, with dignity, to be let go somewhere he’ll play — no drama, no burnt bridges.', effect: { market: 2, meters: { agent: 8, fans: -10 }, earnings: 200 } },
          { id: 'share-it', label: 'Propose sharing the shirt openly', desc: 'He welcomed the lad in; neither of them has to be the loser here', outcome: 'He suggests, in front of both of them, a rotation neither man need be ashamed of — and because he was decent to the boy from day one, the boy agrees before the manager does.', effect: { attr: { teamwork: 2, leadership: 1 }, meters: { peers: 14, authority: 8, fans: 6 }, form: 0.05 }, requires: 'gracious' },
        ],
      },
    },
  },
  {
    id: 'saga-loan-abroad', title: 'The Foreign Adventure', icon: '🌍', category: 'saga',
    minTurn: 46, maxTurn: 105, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Frozen out at home, he’s offered a season-long loan to a club in a very different league across the water — new language, new food, a style of play that would rewire everything he knows. It’s a gamble on himself in a place where nobody’s heard his name. Does he go?',
        choices: [
          { id: 'leap', label: 'Take the leap', desc: 'Pack a bag and reinvent himself in a foreign shirt', outcome: 'He signs the loan and lands in a city where his reputation counts for nothing. Terrifying, and exactly what he needed.', effect: { attr: { creativity: 2 }, meters: { family: -6, agent: 6 }, tag: 'abroad' }, next: 'settle' },
          { id: 'homebound', label: 'Stay and fight', desc: 'Refuse to run — win his place back on home soil', outcome: 'He turns the loan down flat and resolves to claw his way back into the manager’s plans instead.', effect: { attr: { aggression: 1 }, meters: { peers: 4 }, form: -0.03 } },
        ],
      },
      settle: {
        id: 'settle',
        prompt: 'Three months in, the football is going well but the loneliness is biting — a foreign dressing room can be a cold place when the jokes fly past in another tongue. A cluster of senior locals sizes him up. How does he win them over?',
        choices: [
          { id: 'immerse', label: 'Learn their world', desc: 'Butcher the language, embrace the culture, become one of them', outcome: 'He orders coffee in fractured phrases and laughs at himself until the room laughs with him. The walls come down.', effect: { attr: { teamwork: 2 }, meters: { peers: 14, sponsors: 4, partner: -6 }, form: 0.06 }, next: 'return' },
          { id: 'football', label: 'Let his feet speak', desc: 'Skip the small talk and simply be undeniable on the pitch', outcome: 'He answers every doubt with the ball at his feet; some things need no translation, and respect follows the goals.', effect: { form: 0.09, attr: { flair: 2 }, meters: { peers: 8, fans: 6 }, energy: -10 }, next: 'return' },
        ],
      },
      return: {
        id: 'return',
        prompt: 'The loan ends with him a fan favourite abroad, and the foreign club table a permanent bid — while his parent club, watching from afar, suddenly remembers he exists. He holds two futures in his hands. Which does he grasp?',
        choices: [
          { id: 'stay-abroad', label: 'Make it permanent', desc: 'Build a life in the country that finally valued him', outcome: 'He signs for good and puts down roots in his adopted home. A new chapter, on his own terms.', effect: { attr: { composure: 1 }, meters: { fans: 12, family: -10 }, earnings: 400, market: 2 } },
          { id: 'go-back', label: 'Return transformed', desc: 'Go home a wiser, harder, more complete footballer', outcome: 'He flies back a different player, the foreign schooling burned into him, ready to prove they were wrong to let him leave.', effect: { attr: { creativity: 2, teamwork: 1 }, meters: { authority: 6, peers: 6 }, form: 0.07, earnings: -200 } },
        ],
      },
    },
  },
  {
    id: 'saga-buyout-clause', title: 'The Clause', icon: '📜', category: 'saga',
    minTurn: 56, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Buried in his contract sits a release clause his agent swore would never be triggered — and this morning a super-club triggered it, in full, in cash. The club is powerless to refuse. He alone controls whether the move happens by simply signing personal terms. The decision is entirely his, and the clock is loud.',
        choices: [
          { id: 'accept', label: 'Answer the call', desc: 'Sign for the giants and step onto the game’s biggest stage', outcome: 'He agrees terms before lunch; the clause has flung open a door to the elite that may never open twice.', effect: { market: 4, greed: 1, earnings: 900, meters: { fans: -10, agent: 10 }, tag: 'clause-taken' }, next: 'fallout' },
          { id: 'reject', label: 'Turn them down', desc: 'Refuse personal terms and honour the club that trusts him', outcome: 'He tells the super-club no, killing a life-changing deal with two words. His current supporters can’t believe their luck.', effect: { attr: { leadership: 1 }, meters: { fans: 22, authority: 8 }, form: 0.05, tag: 'clause-honoured' }, next: 'fallout' },
        ],
      },
      fallout: {
        id: 'fallout',
        prompt: 'His choice has split the room clean in two: some call him ambitious, others call him a mercenary or a mug, and the manager wants a private word about where his head really is now the dust has settled. What does he tell the gaffer?',
        choices: [
          { id: 'allin', label: 'Recommit completely', desc: 'Promise the manager his total focus, whatever the noise', outcome: 'He looks the boss dead in the eye and pledges everything to the cause. Words become deeds within a week.', effect: { attr: { teamwork: 1 }, meters: { authority: 8, peers: 8 }, form: 0.06 } },
          { id: 'renegotiate', label: 'Use it as leverage', desc: 'Let his agent quietly renegotiate off the back of the drama', outcome: 'He parlays the interest into a fatter deal and a longer clause, banking the chaos as profit.', effect: { earnings: 600, greed: 2, market: 2, meters: { agent: 8, peers: -4 } } },
        ],
      },
    },
  },
  {
    id: 'saga-bench-fightback', title: 'Back from the Cold', icon: '🧊', category: 'saga',
    minTurn: 53, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The team sheet goes up and, for the first time in years, his name isn’t on it — dropped to the bench, then dropped from that, watching from a suit in the stand. A new system, a manager who doesn’t rate him, and whispers that his best days are gone. How does he take being frozen out?',
        choices: [
          { id: 'graft', label: 'Out-train everyone', desc: 'Be first in, last out, and impossible to ignore', outcome: 'He treats every empty training pitch like a cup final, running the youngsters into the ground to make a point.', effect: { attr: { stamina: 2, aggression: 1 }, meters: { authority: 4, peers: 8 }, tag: 'grinder' }, next: 'chance' },
          { id: 'sulk', label: 'Let it fester', desc: 'Withdraw, brood, and let the resentment show', outcome: 'He goes cold, half-hearted in drills and short with the staff. The exile only deepens as word spreads.', effect: { attr: { aggression: 1 }, meters: { authority: -6, peers: -6 }, form: -0.06, tag: 'brooder' }, next: 'chance' },
        ],
      },
      chance: {
        id: 'chance',
        prompt: 'Fate cracks the door: an injury and a suspension gut the side an hour before a huge fixture, and the manager, out of options, throws him on with the game slipping away. It may be the only ninety minutes he gets to save his season. What does he pour into it?',
        choices: [
          { id: 'seize', label: 'Seize the moment', desc: 'Play like a man who may never get another minute', outcome: 'He detonates off the bench, turning the match on its head and reminding a full stadium exactly who he is.', effect: { form: 0.13, attr: { creativity: 2, composure: 1 }, meters: { fans: 20, authority: 8 }, energy: -13 }, next: 'reclaim' },
          { id: 'steady', label: 'Do the ugly work', desc: 'Forget the highlights — just be flawless and reliable', outcome: 'No fireworks, just a shift so disciplined the manager can’t leave it out again. Trust, rebuilt in ninety minutes.', effect: { attr: { teamwork: 2 }, meters: { authority: 10, peers: 8 }, form: 0.07, market: -2 }, next: 'reclaim' },
          { id: 'never-stopped', label: 'Play like a man who never stopped', desc: 'Months of empty training pitches left him the fittest man out there', outcome: 'While everyone waits to see whether the rust shows, he simply runs the legs off the pitch — he has not missed a session in months, and it is obvious inside ten minutes.', effect: { form: 0.11, attr: { stamina: 2, aggression: 1 }, meters: { authority: 9, fans: 14 }, energy: -10 }, next: 'reclaim', requires: 'grinder' },
        ],
      },
      reclaim: {
        id: 'reclaim',
        prompt: 'He’s forced his way back into the starting eleven, but the manager makes it plain the shirt is a loan, not a gift — one bad run and he’s back in the cold. How does he pin the place down for good?',
        choices: [
          { id: 'lead', label: 'Become undroppable', desc: 'String together performances no manager could bench', outcome: 'He turns a lifeline into a stranglehold on the shirt, so consistent the debate simply ends.', effect: { attr: { leadership: 1 }, meters: { authority: 10, fans: 12 }, form: 0.06, energy: -12 } },
          { id: 'peace', label: 'Broker a truce', desc: 'Sit the manager down and clear the air man to man', outcome: 'He talks it out honestly, and the frost between them thaws into something like respect.', effect: { attr: { teamwork: 1 }, meters: { authority: 8, peers: -5 }, form: 0.04 } },
        ],
      },
    },
  },
  {
    id: 'saga-derby-season', title: 'The Derby Season', icon: '🗡️', category: 'saga',
    minTurn: 54, maxTurn: 113, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The fixture list drops and the whole city exhales at once — twice this season he faces {RIVAL} and the club across town he was raised to loathe. Everything else is undercard now. How does he set his stall for the year that will define him in these streets?',
        choices: [
          { id: 'firebrand', label: 'Become the villain', desc: 'Feed the hatred — make himself the face of the fixture', outcome: 'He tells a radio phone-in exactly what he thinks of {RIVAL}, and half the city adopts him as its avenging angel overnight.', effect: { attr: { aggression: 2 }, meters: { fans: 14, authority: 4, sponsors: -10 }, tag: 'derby-firebrand' }, next: 'home-leg' },
          { id: 'cold', label: 'Ice in the veins', desc: 'Say nothing — let a season of quiet work do the talking', outcome: 'He refuses to be drawn, and his silence unsettles the other lot more than any headline could.', effect: { attr: { composure: 2 }, meters: { peers: 8, fans: -8 }, form: 0.04, tag: 'derby-cold' }, next: 'away-leg' },
        ],
      },
      'home-leg': {
        id: 'home-leg',
        prompt: 'The first derby, under his own roof, the away end goading him by name from the first whistle. He wins a penalty in front of the enemy corner with the score level and the ground shaking. Does he take the ball himself?',
        choices: [
          { id: 'grab', label: 'Take it himself', desc: 'Snatch the ball and stare down the away end', outcome: 'He buries it and cups an ear to the visiting fans as flares rain down. A local legend is minted in one swing of his boot.', effect: { form: 0.12, attr: { aggression: 1 }, meters: { fans: 22, authority: -5 } }, next: 'reckoning' },
          { id: 'hand', label: 'Hand it to the taker', desc: 'Give it to the designated man and trust the plan', outcome: 'He resists the ego and lays it off; the specialist scores and he wheels away pointing at the badge, not himself.', effect: { attr: { teamwork: 2 }, meters: { peers: 12, fans: 10 }, form: 0.06, market: -2 }, next: 'reckoning' },
        ],
      },
      'away-leg': {
        id: 'away-leg',
        prompt: 'The return, deep in {RIVAL} territory, a hostile bowl that has swallowed better men than him. Chants about his family echo off the stands before kick-off. What kind of afternoon does he decide to have in their house?',
        choices: [
          { id: 'silence', label: 'Silence the ground', desc: 'Answer the abuse with a performance for the ages', outcome: 'He runs the game from the first minute and celebrates the winner with a finger to his lips. Forty thousand throats fall quiet at once.', effect: { form: 0.13, attr: { flair: 2, composure: 1 }, meters: { fans: 24, sponsors: 6 }, energy: -12 }, next: 'reckoning' },
          { id: 'war', label: 'Fight fire with fire', desc: 'Go to war — no tackle ducked, no word left unsaid', outcome: 'He gives back every ounce he takes, booked inside ten minutes and magnificent for the rest. His own fans sing his name for a week.', effect: { attr: { aggression: 2 }, meters: { fans: 16, authority: -6 }, form: 0.05, energy: -8 }, next: 'reckoning' },
        ],
      },
      reckoning: {
        id: 'reckoning',
        prompt: 'The dust settles on the derby double and his name means something in this city it never did before — worshipped on one side of the river, despised on the other. A tabloid offers a fortune for the inside story of his feud with {RIVAL}. How does he close the season?',
        choices: [
          { id: 'legend', label: 'Live the legend', desc: 'Lean into it — become the club’s derby talisman for good', outcome: 'He accepts the mantle of the man who owns this fixture, and the terraces will sing about these months for a generation.', effect: { attr: { leadership: 1 }, meters: { fans: 18, authority: 8 } } },
          { id: 'humble', label: 'Keep it on the grass', desc: 'Turn the money down and let the results speak', outcome: 'He waves the tabloid off; the goals are the only story he wants told. The dressing room respects him all the more for it.', effect: { attr: { composure: 1 }, meters: { peers: 12, fans: 8 }, earnings: -100 } },
          { id: 'sell-and-give', label: 'Sell the story and give the money away', desc: 'He made himself the villain; he gets to decide what the villain is for', outcome: 'He takes the tabloid’s money for the feud he stoked all year and hands every penny to the supporters’ trust, and the city cannot decide whether to boo him or build him a statue.', effect: { attr: { leadership: 1, aggression: 1 }, meters: { fans: 20, sponsors: 6, peers: 8 }, earnings: -200 }, requires: 'derby-firebrand' },
        ],
      },
    },
  },
  {
    id: 'saga-first-europe', title: 'Into Europe', icon: '🌟', category: 'saga',
    minTurn: 46, maxTurn: 107, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'For the first time in the club’s modest history the anthem will play under their own floodlights — a European campaign, a competition his grandfather only ever watched on a grainy telly. The magnitude of it keeps him up at night. How does he carry the club onto this new stage?',
        choices: [
          { id: 'lead', label: 'Shoulder the occasion', desc: 'Demand the armband of responsibility for the big nights', outcome: 'He tells the manager he wants the ball when the anthem fades, however cold the away legs get. Ambition, stated out loud.', effect: { attr: { leadership: 2 }, meters: { authority: 8, fans: 6 }, energy: -8, tag: 'euro-leader' }, next: 'away-cauldron' },
          { id: 'savour', label: 'Soak it all in', desc: 'Treat every whistle-stop city as the reward it is', outcome: 'He photographs the empty stadiums the night before, wide-eyed as the kid who dreamed this. Nothing will rush him.', effect: { attr: { creativity: 2 }, meters: { family: 6, fans: 8, authority: -6 }, form: 0.04, tag: 'euro-dreamer' }, next: 'home-classic' },
        ],
      },
      'away-cauldron': {
        id: 'away-cauldron',
        prompt: 'The draw is unkind: a first knockout tie away in one of the continent’s great fortresses, a two-goal deficit from the home leg, and a wall of noise that never stops for ninety minutes. The tie looks dead. What does he demand of the night?',
        choices: [
          { id: 'roar', label: 'Chase the miracle', desc: 'Throw everything forward and gamble on a famous comeback', outcome: 'He drags the team up the pitch by sheer will and scores twice in a delirious half-hour. The fortress falls, and Europe learns his name.', effect: { form: 0.14, attr: { aggression: 1, stamina: 1 }, meters: { fans: 24, sponsors: 8 }, energy: -16 }, next: 'legacy-night' },
          { id: 'discipline', label: 'Honour the shape', desc: 'Play it tight, take the tie to the wire, and trust his class late', outcome: 'He keeps eleven men calm in the storm and nicks the away goal that turns the whole tie on its head. Cold, brilliant football.', effect: { attr: { composure: 2, teamwork: 1 }, meters: { peers: 12, authority: 6 }, form: 0.08, energy: -7 }, next: 'legacy-night' },
        ],
      },
      'home-classic': {
        id: 'home-classic',
        prompt: 'A glamour side rolls into their little ground for a group-stage night nobody here will ever forget, global cameras trained on a stadium that usually hosts ten thousand. He can feel the whole town holding its breath. How does he want to be remembered from this one match?',
        choices: [
          { id: 'showman', label: 'Put on a show', desc: 'Play with the handbrake off and entertain the watching world', outcome: 'He nutmegs an international full-back and dinks the winner past a keeper worth more than his whole squad. The clip circles the planet by dawn.', effect: { form: 0.12, attr: { flair: 2 }, meters: { fans: 20, sponsors: 10, peers: -6 }, market: 3, energy: -9 }, next: 'legacy-night' },
          { id: 'engine', label: 'Be the engine', desc: 'Run himself into the turf so the glamour boys can’t breathe', outcome: 'He covers every blade of grass and strangles the star men out of the game. The purists purr; the scouts scribble.', effect: { attr: { stamina: 2, teamwork: 1 }, meters: { authority: 8, peers: 10 }, form: 0.07, energy: -16 }, next: 'legacy-night' },
        ],
      },
      'legacy-night': {
        id: 'legacy-night',
        prompt: 'The European run ends in heartbreak a round further than anyone dreamed, and in the quiet of the tunnel afterwards a continental super-club’s scout presses a card into his hand. His whole world could change on the back of these floodlit nights. What does he do with the moment?',
        choices: [
          { id: 'stay', label: 'Finish what he started', desc: 'Keep building the club into a regular on this stage', outcome: 'He pockets the card and says not yet; there are bigger nights to bring home to this town first. The fans crown him one of their own forever.', effect: { attr: { leadership: 1 }, meters: { fans: 18, authority: 8 }, form: 0.04 } },
          { id: 'chase', label: 'Chase the bright lights', desc: 'Let his agent open the door the run has unlocked', outcome: 'He takes the leap toward the elite, the European nights his calling card. A small club’s greatest export walks into a bigger world.', effect: { market: 4, greed: 1, earnings: 800, meters: { fans: -6, agent: 10 } } },
          { id: 'come-back-in-a-year', label: 'Tell the scout to come back in a year', desc: 'He asked for the big nights, and has not finished having them here', outcome: 'He hands the card back and says the man should watch them again next season, when this club is further along — the same ambition he stated out loud, pointed at a longer horizon.', effect: { attr: { leadership: 2 }, meters: { fans: 14, authority: 10, agent: -5 }, form: 0.05, market: 1 }, requires: 'euro-leader' },
        ],
      },
    },
  },
  {
    id: 'saga-transfer-request', title: 'The Request', icon: '📝', category: 'saga',
    minTurn: 46, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His ambition has outgrown the ceiling here, and the honest thing to do is the hardest — walk into the chairman’s office and put a transfer request on the desk. He knows the second he does, the fans who adore him will read it as betrayal. Does he sign the paper?',
        choices: [
          { id: 'file', label: 'Hand it in', desc: 'Put it in writing and accept the storm that follows', outcome: 'He slides the letter across the desk, and by teatime the news is a scrolling banner and his name is a swear word on the terraces.', effect: { market: 3, greed: 1, meters: { fans: -20, authority: -8 }, tag: 'requested' }, next: 'storm' },
          { id: 'talk', label: 'Talk first', desc: 'Ask for a private meeting before he burns anything down', outcome: 'He chooses conversation over conflict, laying out his ambitions face to face and asking the club to help him, not fight him.', effect: { attr: { composure: 1 }, meters: { authority: 4, agent: 4 }, tag: 'requested-quiet' }, next: 'crossroads' },
        ],
      },
      storm: {
        id: 'storm',
        prompt: 'The request leaks in full and the backlash is savage — his shirt burned in the car park, his name jeered when he warms up, a manager who benches him to make a point. Three months of purgatory later, no move has materialised. How does he survive the winter he brought on himself?',
        choices: [
          { id: 'own', label: 'Own the decision', desc: 'Refuse to grovel — keep his head high and his standards higher', outcome: 'He never apologises but he never hides either, playing through the boos until even the hardest critics grudgingly clap. Respect, clawed back.', effect: { attr: { composure: 2, leadership: 1 }, meters: { authority: 6, peers: 8, fans: -8 }, form: 0.05, energy: -10 }, next: 'resolution' },
          { id: 'apologise', label: 'Mend the wound', desc: 'Front the fans, admit the timing was wrong, ask forgiveness', outcome: 'He takes the microphone at an open training day and owns his mistake to their faces. The terraces, moved, begin to thaw.', effect: { attr: { teamwork: 1 }, meters: { fans: 14, authority: 4, agent: -6 }, form: 0.03, market: -3 }, next: 'resolution' },
        ],
      },
      crossroads: {
        id: 'crossroads',
        prompt: 'The quiet approach has kept his reputation intact, but it has also given the club room to stall — they praise his professionalism and offer nothing concrete, banking on his patience. The window is ticking and his ambition is curdling into frustration. What now?',
        choices: [
          { id: 'ultimatum', label: 'Draw a hard line', desc: 'Set a private deadline and mean it', outcome: 'He tells them plainly that patience has a limit, and the sudden steel in his voice finally makes the club take him seriously.', effect: { attr: { aggression: 1 }, meters: { agent: 8, authority: -5 }, market: 2 }, next: 'resolution' },
          { id: 'stay-loyal', label: 'Give them the year', desc: 'Agree to stay one more season if they promise to let him go on his terms', outcome: 'He shakes on a gentleman’s deal — one last season of everything he has, then a blessing to leave. Loyalty, banked as leverage.', effect: { attr: { leadership: 1 }, meters: { fans: 10, authority: 6 }, form: 0.04, earnings: -400 }, next: 'resolution' },
        ],
      },
      resolution: {
        id: 'resolution',
        prompt: 'The saga finally breaks in the summer, and the club sits him down to settle it once and for all — a move can happen, but the terms of his exit are being written in this room. After everything the request has cost and taught him, how does he want the last chapter written?',
        choices: [
          { id: 'clean', label: 'Leave the right way', desc: 'Take a fair move and depart with a handshake, not a grudge', outcome: 'He goes with a lump in his throat and a guard of honour from the youth team he mentored. Ambition and grace, in the end.', effect: { attr: { composure: 1 }, meters: { fans: 12, peers: 8 }, earnings: 500, market: 2 } },
          { id: 'maximise', label: 'Cash the leverage', desc: 'Let his agent squeeze every last pound from the situation', outcome: 'He extracts a signing bonus that raises eyebrows across the game and a contract to match. The saga ends with his bank the clear winner.', effect: { earnings: 900, greed: 2, market: 2, meters: { agent: 10, fans: -6 } } },
          { id: 'the-handshake', label: 'Hold them to the handshake', desc: 'He did this the grown-up way and they promised him a blessing', outcome: 'He never burned anything down and never briefed a reporter, so he simply reminds the room what was agreed across this desk. There is nothing they can decently say but yes.', effect: { attr: { composure: 1, leadership: 1 }, meters: { fans: 14, authority: 8, peers: 8 }, earnings: 400 }, requires: 'requested-quiet' },
        ],
      },
    },
  },
  {
    id: 'saga-three-managers', title: 'The Revolving Door', icon: '🚪', category: 'saga',
    minTurn: 46, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six weeks into the campaign the chairman pulls the trigger, and the manager who built his whole game plan around him is gone. A firefighter arrives with a clipboard, a foreign accent, and a system that has no obvious place for a player like him. How does he greet the new regime?',
        choices: [
          { id: 'adapt', label: 'Learn the new way', desc: 'Study the system and remould himself to fit it', outcome: 'He stays behind with the analysts night after night, bending his game to a shape he never played before. The new boss notices the effort.', effect: { attr: { teamwork: 2 }, meters: { authority: 6, peers: 6 }, tag: 'adaptable' }, next: 'second-boss' },
          { id: 'resist', label: 'Insist on his game', desc: 'Play the way that made him and dare the manager to drop him', outcome: 'He refuses to be reprogrammed and backs his own quality, a gamble that puts him on a collision course with the dugout.', effect: { attr: { aggression: 1, flair: 2 }, meters: { authority: -4 }, form: -0.03, tag: 'immovable' }, next: 'second-boss' },
        ],
      },
      'second-boss': {
        id: 'second-boss',
        prompt: 'The firefighter fails and by February a third manager walks in — a proven winner with a huge ego who wants to know, in the first meeting, whether he is a leader in this dressing room or just a passenger. The whole rest of his season rides on the answer he gives. What does he say?',
        choices: [
          { id: 'leader', label: 'Claim the leadership', desc: 'Tell the new boss he’ll drive the standards through the chaos', outcome: 'He looks the winner in the eye and takes ownership of a broken season, and the manager hands him the responsibility on the spot.', effect: { attr: { leadership: 2 }, meters: { authority: 10, peers: 8 }, form: 0.06, energy: -8 }, next: 'endgame' },
          { id: 'proveit', label: 'Let his boots answer', desc: 'Say nothing and promise to show it on the grass', outcome: 'He makes no speeches and simply produces the most complete football of his life for the run-in. Actions, as always, louder than words.', effect: { attr: { stamina: 1 }, meters: { authority: 6, fans: 10 }, form: 0.08, energy: -14 }, next: 'endgame' },
        ],
      },
      endgame: {
        id: 'endgame',
        prompt: 'Three managers, one bewildering season, and somehow he has come out of it as the one constant the club could rely on. In the summer the third boss — the winner who is staying — offers to build the entire project around him. After the year he’s endured, does he trust it?',
        choices: [
          { id: 'buyin', label: 'Buy into the vision', desc: 'Commit fully to the manager who finally stuck around', outcome: 'He signs on as the cornerstone of a new era, the survivor of the revolving door made its foundation stone. Stability, at last.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { authority: 8, fans: 12 }, earnings: 300 } },
          { id: 'wary', label: 'Keep his options open', desc: 'Nod politely but let his agent listen to the market', outcome: 'He smiles and says the right things, but a season of upheaval has taught him to trust no promise fully. He keeps one eye on the door.', effect: { market: 2, greed: 1, meters: { agent: 8, authority: -2 } } },
          { id: 'a-say-in-it', label: 'Sign — and ask for a say in what comes next', desc: 'He has remade his game for three managers and has earned an opinion', outcome: 'He commits, then asks the board for the one thing no player normally gets: to be in the room, for an hour at least, the next time they choose a manager. To his surprise, they agree.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { authority: 12, peers: 8 }, earnings: 200, form: 0.04 }, requires: 'adaptable' },
        ],
      },
    },
  },
  {
    id: 'saga-promotion-collapse', title: 'The Run-In', icon: '📉', category: 'saga',
    minTurn: 86, maxTurn: 107, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'For thirty games they’ve led the promotion race and safe passage to the big league feels all but stamped — and then, without warning, the wheels come off. Three defeats on the bounce, the chasing pack scenting blood, and a dressing room where the confidence has curdled into fear. As a senior man, what does he do about the panic?',
        choices: [
          { id: 'steady', label: 'Steady the ship', desc: 'Calm the young heads and preach that the job’s still in their hands', outcome: 'He gathers the frightened kids and tells them nerves are the price of the prize. The room breathes a little easier for hearing it.', effect: { attr: { leadership: 2, composure: 1 }, meters: { peers: 12, authority: 8 }, tag: 'steadier' }, next: 'penultimate' },
          { id: 'demand', label: 'Crack the whip', desc: 'Tear a strip off them and demand more before it all slips away', outcome: 'He lets rip in the dressing room, no pass unchallenged, and the shock of his fury snaps a soft squad back to attention.', effect: { attr: { aggression: 2 }, meters: { authority: 6, peers: -2 }, form: 0.04, tag: 'enforcer' }, next: 'penultimate' },
        ],
      },
      penultimate: {
        id: 'penultimate',
        prompt: 'It comes down to the second-to-last match, and defeat would hand the initiative to {RIVAL}’s promotion rivals for good. An hour in it’s deadlocked, legs are gone, and he limps through the pain barrier with a knock that should really see him off. Does he stay on?',
        choices: [
          { id: 'battle', label: 'Play through it', desc: 'Grit his teeth and refuse to leave his team a man down', outcome: 'He hobbles through the last half-hour on one good leg and heads clear the corner that saves the game. Talismanic, and reckless.', effect: { form: 0.1, attr: { aggression: 1, stamina: -1 }, meters: { fans: 18, authority: 8 } }, next: 'final-hurdle' },
          { id: 'off', label: 'Protect himself', desc: 'Signal the bench — no promotion is worth the final day', outcome: 'He takes himself off to save his body for the match that truly decides it, trusting the squad to hold the fort tonight.', effect: { attr: { composure: 1 }, meters: { peers: 6 }, form: 0.03 }, next: 'final-hurdle' },
          { id: 'own-standards', label: 'Stay on — he demanded this of them', desc: 'He tore a strip off them for less; he cannot be the one who walks', outcome: 'He remembers every word he shouted at them a month ago and understands he has made it impossible to come off, so he limps out the ninety and says nothing about it afterwards.', effect: { form: 0.09, energy: -12, attr: { aggression: 1, leadership: 1, stamina: -1 }, meters: { peers: 14, authority: 8 } }, next: 'final-hurdle', requires: 'enforcer' },
        ],
      },
      'final-hurdle': {
        id: 'final-hurdle',
        prompt: 'The last day. Win and they’re up; slip and a season of leading the league becomes the cruellest collapse in the club’s memory. Nil-nil, ten minutes left, and a free-kick on the edge of the box drops to him with the entire town praying behind him. What does he do?',
        choices: [
          { id: 'hero', label: 'Bend it home', desc: 'Back himself to write the ending they’ve waited all year for', outcome: 'He curls it into the top corner and the ground erupts into a decade of pent-up longing. Promotion, on the last day, off his boot.', effect: { form: 0.14, attr: { flair: 2, composure: 1 }, meters: { fans: 26, authority: 10 }, earnings: 300, energy: -8 } },
          { id: 'clever', label: 'Play the odds', desc: 'Roll it clever to a runner and trust the move over the moment', outcome: 'He disguises the pass and slips a teammate in for the winner. Not his name on the goal, but his brain all over it, and up they go.', effect: { form: 0.09, attr: { creativity: 2, teamwork: 1 }, meters: { peers: 14, fans: 16 }, market: -2 } },
        ],
      },
    },
  },
  {
    id: 'saga-lost-season', title: 'The Long Road Back', icon: '🩼', category: 'saga',
    minTurn: 46, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A challenge lands late and wrong and the knee gives way with a sound he’ll hear in his sleep for years. The surgeon’s verdict is brutal: the whole season, gone, and no promises about what comes after. Lying in the recovery suite, how does he choose to face the void?',
        choices: [
          { id: 'attack', label: 'Attack the rehab', desc: 'Turn the treatment room into a personal war he intends to win', outcome: 'He’s in the gym before the swelling’s down, hunting every marginal gain the physios will allow. The comeback starts the same day the injury does.', effect: { injury: true, attr: { stamina: 1, aggression: 1 }, meters: { authority: 4 }, tag: 'rehab-warrior' }, next: 'dark-days' },
          { id: 'grieve', label: 'Let the fear in', desc: 'Confront the terror that his best days might be behind him', outcome: 'He sits with the dread instead of running from it, and somewhere in the honesty finds a quieter, harder resolve to return whole.', effect: { injury: true, attr: { composure: 1 }, meters: { family: 8, partner: 6 }, form: -0.06, tag: 'rehab-shaken' }, next: 'dark-days' },
        ],
      },
      'dark-days': {
        id: 'dark-days',
        prompt: 'Midwinter, months into the grind, and progress has stalled on a plateau no amount of effort seems to crack. The team is thriving without him, a younger man owns his shirt, and a whisper reaches him that the club is planning around his absence. This is the moment the road breaks men. What gets him through it?',
        choices: [
          { id: 'obsess', label: 'Double the work', desc: 'Add solo sessions nobody asked for until the plateau cracks', outcome: 'He films his own drills at dawn and hunts flaws in his gait like a scientist. Slowly, agonisingly, the knee starts to answer.', effect: { attr: { stamina: 2 }, meters: { authority: 6, family: -8 }, form: 0.04, energy: -14 }, next: 'return-day' },
          { id: 'lean', label: 'Lean on his people', desc: 'Let family and the dressing room carry him when his own belief fails', outcome: 'He stops trying to be a hero about it and lets the people who love him hold the weight for a while. He heals in more ways than one.', effect: { attr: { teamwork: 1 }, meters: { family: 10, peers: 10, partner: 8, authority: -6 } }, next: 'return-day' },
        ],
      },
      'return-day': {
        id: 'return-day',
        prompt: 'A full year to the day, his name is back on the bench and the manager turns to him with twenty minutes left and the crowd already rising in salute. His heart is going like a drum. What does he pour into the moment he bled a whole season for?',
        choices: [
          { id: 'statement', label: 'Announce he’s back', desc: 'Go for a moment that erases every doubt in one instant', outcome: 'He wins it late with a finish of pure defiance and sinks to his knees where the injury happened. The stadium weeps with him.', effect: { form: 0.12, attr: { flair: 2 }, meters: { fans: 24, authority: 8 }, energy: -14 } },
          { id: 'careful', label: 'Just feel the grass again', desc: 'Play it safe, get the minutes, and be grateful to be whole', outcome: 'No heroics — just twenty clean, careful minutes and a long exhale at the whistle. Sometimes surviving is the victory.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { fans: 14, family: 8 }, form: 0.05, market: -2 } },
          { id: 'trust-the-work', label: 'Trust the work and play his normal game', desc: 'He attacked every session of this rehab and knows what the knee holds', outcome: 'There is no gingerness and no theatre; he plays the way he always played, because he has spent a whole year finding out exactly what this leg will and will not do.', effect: { form: 0.1, attr: { stamina: 1, composure: 1 }, meters: { fans: 18, authority: 8, family: 5 }, energy: -8 }, requires: 'rehab-warrior' },
        ],
      },
    },
  },
  {
    id: 'saga-fire-sale', title: 'The Fire Sale', icon: '🔥', category: 'saga',
    minTurn: 50, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'As captain he’s the bridge between a dressing room full of frightened teammates and a boardroom quietly liquidating its best assets to balance the books. One by one his closest allies are being sold from under him, and the squad looks to him for answers he doesn’t have. Where does he plant his flag?',
        choices: [
          { id: 'players', label: 'Side with the players', desc: 'Confront the board and demand they stop gutting the team', outcome: 'He marches upstairs and reads the directors the riot act on behalf of the room. The board bristles; the dressing room finds a leader worth following.', effect: { attr: { leadership: 2, aggression: 1 }, meters: { peers: 14, authority: -4 }, tag: 'captain-rebel' }, next: 'showdown' },
          { id: 'bridge', label: 'Broker between them', desc: 'Try to hold squad and board together before it all fractures', outcome: 'He becomes a diplomat in shin pads, carrying honest messages both ways to stop the whole thing collapsing into open war.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { authority: 6, peers: 8 }, tag: 'captain-diplomat' }, next: 'showdown' },
          { id: 'over-their-heads', label: 'Go over the board to the owners themselves', desc: 'He has learned that directors are only ever the messengers', outcome: 'He has watched a boardroom quietly dismantle a dressing room once before, so he stops arguing with the messengers and gets himself into a room with the people who actually decide.', effect: { attr: { leadership: 2, aggression: 1 }, meters: { peers: 12, authority: -6, agent: 5 }, tag: 'captain-rebel' }, next: 'showdown', requires: 'takeover-resist' },
        ],
      },
      showdown: {
        id: 'showdown',
        prompt: 'The board saves the biggest blow for last: they want to sell HIM, the captain, the one thing holding the wreckage together, to fund the rebuild. They frame it as doing right by the club. He has the power to refuse. Does the leader let himself be sold to save the rest?',
        choices: [
          { id: 'sacrifice', label: 'Take the bullet', desc: 'Agree to go so the money keeps the team alive', outcome: 'He accepts the move for the good of a club that’s selling him, walking away a martyr the supporters will canonise for years.', effect: { attr: { leadership: 1 }, meters: { fans: 20, peers: 12 }, earnings: 400, market: 2 }, next: 'aftershock' },
          { id: 'stay-fight', label: 'Refuse to be sold', desc: 'Dig in and force the board to keep its captain', outcome: 'He invokes every right he has and simply will not go, staking his career on dragging this club off the rocks himself.', effect: { attr: { aggression: 1, leadership: 1 }, meters: { fans: 16, authority: -6 }, form: 0.05 }, next: 'aftershock' },
          { id: 'put-it-to-them', label: 'Put it to the dressing room', desc: 'He already fronted the board for them — now let them share the call', outcome: 'He calls the players together, lays the board’s offer out honestly, and tells them he will do whatever the room decides. They decide it together, and it binds them.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 16, authority: 4, fans: 10 } }, next: 'aftershock', requires: 'captain-rebel' },
        ],
      },
      aftershock: {
        id: 'aftershock',
        prompt: 'The window slams shut and the smoke clears on a squad half the size it was in August. Whether he stayed or went, the fans now see him as the one man who stood for something in a summer of surrender. What does he make his legacy from the wreckage?',
        choices: [
          { id: 'rebuild', label: 'Lead the rebuild', desc: 'Take the kids left behind and forge something new from nothing', outcome: 'He anoints himself the spine of a threadbare team and vows to overachieve out of spite. Undermanned, unbowed, unmistakably his side now.', effect: { attr: { leadership: 2, stamina: 1 }, meters: { authority: 10, fans: 14 }, form: 0.05 } },
          { id: 'speak', label: 'Tell the truth', desc: 'Go public about how the club was run into the ground', outcome: 'He breaks ranks in an interview that becomes a lightning rod, naming what everyone knew but nobody dared say. The board never forgives him; the fans never forget it.', effect: { attr: { aggression: 1 }, meters: { fans: 18, authority: -10, sponsors: -4 } } },
        ],
      },
    },
  },
  {
    id: 'saga-final-contract', title: 'The Last Deal', icon: '✍️', category: 'saga',
    minTurn: 90, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The legs have a couple of good years left and everyone in the game knows it — the last real contract of his life. On one side, the club that made his name offers loyalty at a cut wage; on the other, a cash-rich outfit dangles a farewell payday that would set up his grandchildren. Which future does he sign for?',
        choices: [
          { id: 'loyalty', label: 'Stay for love', desc: 'Take the pay cut and finish where his heart lives', outcome: 'He signs for a fraction of his worth to end it at home, and the terraces understand exactly what the gesture cost him.', effect: { attr: { leadership: 1 }, meters: { fans: 20, family: 8, authority: 6 }, earnings: -300, tag: 'stayed-for-love' }, next: 'twilight-home' },
          { id: 'payday', label: 'Take the payday', desc: 'Cash the last big cheque his career will ever offer', outcome: 'He signs the mega-deal with clear eyes; sentiment doesn’t pay the mortgage, and he’s earned the right to be paid what he’s worth once more.', effect: { earnings: 1000, greed: 1, market: 1, meters: { fans: -8, agent: 8 }, tag: 'took-payday' }, next: 'twilight-away' },
          { id: 'write-in-the-after', label: 'Take the cut — if they write in what comes after', desc: 'He turned the giants down for this badge once already', outcome: 'He agrees to the reduced money on one condition: a role at the club for when the boots come off, in ink. Loyalty, he has decided, should be a two-way document this time.', effect: { attr: { leadership: 1 }, meters: { fans: 16, authority: 8, agent: 4 }, earnings: -150, tag: 'stayed-for-love' }, next: 'twilight-home', requires: 'stayed' },
        ],
      },
      'twilight-home': {
        id: 'twilight-home',
        prompt: 'A year into the loyalty deal his body finally begins to betray him — a young manager wants to phase him out gently, but he can still feel the old fire on the big days. How does he want to spend the football he has left at the club he loves?',
        choices: [
          { id: 'mentor', label: 'Pass on the torch', desc: 'Accept a smaller role and pour everything into the next generation', outcome: 'He plays the big nights and gives his weekdays to the academy, teaching kids who’ll wear this shirt long after him. A legacy, not a stat line.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 14, authority: 8, fans: 12 }, form: -0.06 } },
          { id: 'lastdance', label: 'Chase one last trophy', desc: 'Refuse the wind-down and go all-in on a final medal', outcome: 'He tells the young boss he isn’t here to fade away, and drags his aching body toward one more piece of silverware out of sheer will.', effect: { attr: { aggression: 1 }, meters: { fans: 14, authority: 6 }, form: 0.06, energy: -16 } },
        ],
      },
      'twilight-away': {
        id: 'twilight-away',
        prompt: 'The payday club got a footballer, but the fans wanted a saviour, and the money now sits on his shoulders like an accusation every time a pass goes astray. He’s richer than he ever dreamed and lonelier than he expected. How does he justify the deal to himself and to them?',
        choices: [
          { id: 'earn', label: 'Earn every penny', desc: 'Silence the sneers by being worth the fortune to the last day', outcome: 'He plays like a man with a point to prove and gradually turns the doubters, showing the money bought a professional, not a pensioner.', effect: { attr: { composure: 1, stamina: 1 }, meters: { fans: 12, authority: 6 }, form: 0.07 } },
          { id: 'coast', label: 'Take the money and go quiet', desc: 'Do his job, cash his cheque, and make peace with the criticism', outcome: 'He stops trying to win their hearts and simply delivers a solid, unspectacular shift each week. Comfortable, wealthy, and a little hollow.', effect: { greed: 1, meters: { fans: -4, family: 6 }, earnings: 200 } },
        ],
      },
    },
  },
  {
    id: 'saga-elder-role', title: 'The Elder Statesman', icon: '🧓', category: 'saga',
    minTurn: 93, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The manager is gentle but clear: he can’t start every week any more, but a leader like him is worth more to this squad than his ninety minutes. He’s being asked to reinvent his whole identity as an impact sub and a voice in the room. Does the old warrior accept a new kind of importance?',
        choices: [
          { id: 'embrace', label: 'Own the elder role', desc: 'Become the finisher and the conscience of the dressing room', outcome: 'He decides the substitute’s board is just a different kind of stage, and reinvents himself as the man who changes games late and steadies the young in between.', effect: { attr: { leadership: 2 }, meters: { authority: 8, peers: 10 }, tag: 'elder-yes' }, next: 'supersub' },
          { id: 'fight', label: 'Rage against it', desc: 'Refuse to accept the bench and fight for his starting shirt', outcome: 'He tells the boss he isn’t finished starting yet, and turns every training session into a case for his own name in the eleven.', effect: { attr: { aggression: 2, stamina: 1 }, meters: { authority: 4, peers: -2 }, form: 0.04, tag: 'elder-no' }, next: 'proving' },
        ],
      },
      supersub: {
        id: 'supersub',
        prompt: 'His new role is tested on the biggest night of the season — thrown on with twenty minutes left and the team a goal down, the whole plan resting on the old head changing the game. This is exactly the moment he swallowed his pride for. What does he bring off that bench?',
        choices: [
          { id: 'decisive', label: 'Win it late', desc: 'Be the ruthless finisher the role demands', outcome: 'He arrives like a specialist, reads the tiring game in seconds, and buries the winner. The whole bench mobs the wise old head.', effect: { form: 0.11, attr: { composure: 1, flair: 2 }, meters: { fans: 18, authority: 8, peers: -6 }, energy: -6 } },
          { id: 'orchestrate', label: 'Calm the storm', desc: 'Slow the chaos and pull the young team back into shape', outcome: 'He doesn’t score but he settles everything, dictating the closing minutes like a conductor and turning panic into control. Priceless.', effect: { attr: { leadership: 1, teamwork: 1, composure: 1 }, meters: { authority: 10, peers: 8 }, form: 0.05, market: -2 } },
          { id: 'camp-routine', label: 'Fall back on the finisher’s routine', desc: 'He learned this precise craft in an international camp', outcome: 'He does what a national squad taught him — the long warm-up, the cold read of the game from the touchline, the single decisive intervention — and it works exactly as it was designed to.', effect: { form: 0.1, attr: { composure: 1, teamwork: 1 }, meters: { authority: 9, peers: 8 }, energy: -5 }, requires: 'nation-finisher' },
        ],
      },
      proving: {
        id: 'proving',
        prompt: 'His refusal to fade forces the manager’s hand: he gets one run of starts to prove the old dog can still go the distance across a brutal festive schedule. Every ache is magnified, every young pretender is watching. Can the veteran make the manager eat his words?',
        choices: [
          { id: 'defy', label: 'Turn back the clock', desc: 'Pour a career’s cunning into one last vintage run of form', outcome: 'He strings together displays that make a mockery of the calendar, and the manager quietly tears up the plan to phase him out.', effect: { form: 0.09, attr: { stamina: 2, composure: 1 }, meters: { authority: 8, fans: 14 }, energy: -18 } },
          { id: 'accept', label: 'Concede with grace', desc: 'Admit the tank is emptying and take the elder role on his own terms', outcome: 'The schedule wins in the end, and he walks into the manager’s office to accept the substitute’s role with his head held high. Wisdom over pride.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { authority: 6, peers: 10 }, market: -3 } },
        ],
      },
    },
  },
  {
    id: 'saga-cup-run', title: 'The Cup Run', icon: '🏅', category: 'saga',
    minTurn: 46, maxTurn: 110, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It starts as an afterthought — a rotated side in an early round of the domestic cup — but they win, and win again, and suddenly the whole club is dreaming. Now a top-flight giant awaits in the quarters, live on national telly. How does he approach the tie that could turn a run into a story?',
        choices: [
          { id: 'fearless', label: 'Play without fear', desc: 'Attack the giant like there’s nothing to lose', outcome: 'He leads a swashbuckling charge that stuns the favourites, and the cameras leave with a new cult hero to talk about all week.', effect: { attr: { flair: 2, aggression: 1 }, meters: { fans: 16, sponsors: 4 }, form: 0.06, energy: -10, tag: 'cup-cavalier' }, next: 'semi' },
          { id: 'gameplan', label: 'Strangle the game', desc: 'Suffocate the giant and nick it on the break', outcome: 'He marshals a masterclass of discipline, defends for his life, and springs the counter that ends the tie. Ugly, brilliant, unforgettable.', effect: { attr: { teamwork: 2 }, meters: { peers: 10, authority: 6 }, form: 0.05, energy: -6, market: -2, tag: 'cup-tactician' }, next: 'semi' },
        ],
      },
      semi: {
        id: 'semi',
        prompt: 'The semi-final, one game from a final his club last reached before he was born. It goes to a shootout after two exhausted hours, and the manager asks who’s brave enough to take the fifth. The whole run comes down to whether he steps forward. Does he?',
        choices: [
          { id: 'step', label: 'Take the fifth', desc: 'Volunteer for the penalty that sends them to the final', outcome: 'He plants the ball on the spot, ignores a hundred flashing bulbs, and rolls it home cold as ice. Wembley beckons, off his nerve.', effect: { form: 0.1, attr: { composure: 2 }, meters: { fans: 20, authority: 8 }, energy: -10 }, next: 'final' },
          { id: 'inspire', label: 'Lift the takers', desc: 'Let a specialist take it and be the leader who steadies them all', outcome: 'He hangs back, arms round every shaking shooter, and wills them through it one kick at a time. A captain’s shootout, even without the winning kick.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 14, authority: 6 }, form: 0.04, market: -2 }, next: 'final' },
        ],
      },
      final: {
        id: 'final',
        prompt: 'The final. Ninety-odd thousand, a lifetime’s worth of dreaming, and {RIVAL}’s lot standing between his club and its first trophy in a generation. It’s level with minutes left and the ball is at his feet in the arena he pictured as a boy. How does he meet the biggest moment of his career?',
        choices: [
          { id: 'glory', label: 'Seize the glory', desc: 'Back himself to be the hero the day was made for', outcome: 'He shifts it onto his stronger foot and lashes it into the roof of the net. Cup won, city rejoicing, his name carved into the club forever.', effect: { form: 0.14, attr: { flair: 2 }, meters: { fans: 26, sponsors: 10, authority: 8 }, market: 3, energy: -12 } },
          { id: 'team', label: 'Trust the team', desc: 'Draw two men and square it for the simple, certain finish', outcome: 'He commits the defenders and rolls it to a teammate for the tap-in that wins the cup. His assist, their glory, everyone’s day.', effect: { form: 0.1, attr: { teamwork: 2, creativity: 2 }, meters: { peers: 16, fans: 18, sponsors: -6 }, market: -3 } },
          { id: 'the-outrageous', label: 'Try the outrageous thing again', desc: 'Playing without fear is what knocked the giant out in the first place', outcome: 'He does the thing nobody sane attempts in a final — the same fearless swing that beat the favourites in the quarters — and it drops in off the underside of the bar.', effect: { form: 0.14, attr: { flair: 2, aggression: 1 }, meters: { fans: 24, sponsors: 8, peers: -6 }, market: 3, energy: -10 }, requires: 'cup-cavalier' },
        ],
      },
    },
  },
  {
    id: 'saga-new-money', title: 'New Money', icon: '💰', category: 'saga',
    minTurn: 104, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A vast fortune has landed on his modest club overnight, and the dressing room he knew is being buried under a blizzard of superstar signings on wages that dwarf his own. The badge is the same but the soul feels up for sale. As one of the old guard, how does he meet the new order?',
        choices: [
          { id: 'adapt', label: 'Ride the wave', desc: 'Embrace the ambition and fight to belong in the new elite', outcome: 'He decides to grow with the project rather than resent it, hunting a level that keeps him in the team alongside the galácticos.', effect: { attr: { stamina: 1 }, meters: { authority: 4, sponsors: 6, peers: -6 }, form: 0.04, energy: -12, tag: 'newmoney-in' }, next: 'clash' },
          { id: 'soul', label: 'Guard the soul', desc: 'Be the keeper of what the club was before the billions', outcome: 'He appoints himself the conscience of the place, reminding the imports where they are and what these fans expect. Some things money can’t buy.', effect: { attr: { leadership: 2 }, meters: { fans: 12, peers: 8, authority: -5, sponsors: -8 }, tag: 'newmoney-soul' }, next: 'clash' },
        ],
      },
      clash: {
        id: 'clash',
        prompt: 'It boils over in the canteen when a preening superstar mocks the old wages and the local kids in the same breath, and the whole room goes quiet waiting to see if anyone will stand up to the marquee man. All eyes fall on him. What does he do?',
        choices: [
          { id: 'confront', label: 'Put him in his place', desc: 'Face the superstar down in front of everyone', outcome: 'He tells the imported ego exactly where he stands, unflinching, and the room silently decides who the real leader is here.', effect: { attr: { aggression: 1, leadership: 1 }, meters: { peers: 12, authority: -6 }, form: 0.03 }, next: 'verdict' },
          { id: 'win-over', label: 'Win him over', desc: 'Take the superstar out and turn a rival into an ally', outcome: 'He swallows the jibe and invests in the man instead, and by dessert the two are laughing. A dressing room united sooner than anyone expected.', effect: { attr: { teamwork: 2 }, meters: { peers: 10, sponsors: 4, fans: -6 } }, next: 'verdict' },
        ],
      },
      verdict: {
        id: 'verdict',
        prompt: 'A season on, the money has bought trophies and turned his club into a global brand, but he can feel himself becoming a relic in his own home. The sporting director offers a choice: a reduced role at the glamorous new giant, or a proud exit while he’s still first-choice somewhere real. Where does he belong?',
        choices: [
          { id: 'stay', label: 'Stay and belong', desc: 'Accept a smaller part in something enormous', outcome: 'He decides to be a footnote in a dynasty rather than a headline anywhere else, chasing medals he could never have won before the billions came.', effect: { attr: { teamwork: 1 }, meters: { sponsors: 8, authority: 4 }, earnings: 400, market: 1, form: -0.06 } },
          { id: 'leave', label: 'Leave with his soul', desc: 'Walk to a club where he’s still the heartbeat, not the mascot', outcome: 'He turns his back on the riches for a place that still needs him, choosing to matter over to merely belong. The fans he leaves call him the last real one.', effect: { attr: { leadership: 1, composure: 1 }, meters: { fans: 14, peers: 8 }, form: 0.05, earnings: -500, market: -2 } },
        ],
      },
    },
  },
  {
    id: 'saga-wonderkid-shirt', title: 'The Heir Apparent', icon: '👑', category: 'saga',
    minTurn: 82, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The academy has produced a phenomenon — a sixteen-year-old who plays his position with a freedom he can barely remember having — and the whole club knows the boy is coming for his shirt. The manager watches the two of them in every session. How does the veteran handle the heir the club is grooming to replace him?',
        choices: [
          { id: 'mentor', label: 'Anoint the kid', desc: 'Take the wonderkid under his wing and teach him everything', outcome: 'He decides his last great act might be forging the boy who’ll replace him, and pours a decade of knowledge into the wide-eyed teenager.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 12, authority: 8 }, tag: 'heir-mentor' }, next: 'crossover' },
          { id: 'hold', label: 'Fend him off', desc: 'Treat the prodigy as a threat and cling to the shirt', outcome: 'He refuses to hand over anything without a fight, determined to make the kid earn every inch and prove the old man isn’t done.', effect: { attr: { aggression: 1 }, meters: { authority: 4, peers: -2 }, form: 0.05, tag: 'heir-guard' }, next: 'crossover' },
        ],
      },
      crossover: {
        id: 'crossover',
        prompt: 'Midway through the season the manager tries them together in the same side, and it works spectacularly — but the press keeps asking whose team it really is now. A big match arrives where only one can wear the number, and the boss leaves the call, painfully, to the veteran himself. What does he decide?',
        choices: [
          { id: 'step-aside', label: 'Give him the day', desc: 'Tell the manager to start the kid and support from the bench', outcome: 'He volunteers to sit so the future can shine, and watches the boy dazzle with a pride that surprises even him. A torch, willingly passed.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { authority: 8, fans: 12, peers: 10 }, form: -0.06 }, next: 'succession' },
          { id: 'take-it', label: 'Take the shirt', desc: 'Back himself for the big one — the kid can wait his turn', outcome: 'He tells the boss the number’s still his when it matters, and delivers a performance that reminds everyone why. The heir sits, and learns.', effect: { form: 0.08, attr: { composure: 1, flair: 2 }, meters: { authority: 6, fans: 10, peers: -8 }, energy: -6 }, next: 'succession' },
        ],
      },
      succession: {
        id: 'succession',
        prompt: 'By summer the transition is undeniable — the boy is ready, the club is his future, and the veteran must decide what his final relationship with the shirt he owned for a decade will be. How does he write the end of his own reign?',
        choices: [
          { id: 'blessing', label: 'Hand it over with grace', desc: 'Publicly bless the succession and become the kid’s mentor for life', outcome: 'He stands beside the boy at the unveiling and tells the cameras the shirt is in the right hands. A dynasty, secured by an act of grace.', effect: { attr: { leadership: 2 }, meters: { fans: 16, peers: 12, authority: 8 }, market: -3 } },
          { id: 'lastyear', label: 'Squeeze out one more', desc: 'Fight for one final season at the top before he yields', outcome: 'He isn’t ready to be a footnote yet, and backs his body for twelve more months of relevance before he lets the future have it all.', effect: { attr: { stamina: 1, aggression: 1 }, meters: { authority: 4, fans: 8 }, form: 0.06, energy: -14 } },
          { id: 'go-with-him', label: 'Ask to stay beside the boy', desc: 'He built this player; he would like to see the rest of it', outcome: 'He asks the club for a role that keeps him near the young man he made, and signs a deal that is half footballer and half something nobody has a name for yet.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 14, authority: 10, fans: 12 }, form: -0.05, tag: 'coach-track' }, requires: 'heir-mentor' },
        ],
      },
    },
  },
  {
    id: 'saga-lower-league', title: 'The Rebuild', icon: '🧱', category: 'saga',
    minTurn: 96, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Relegation was the wound; the phone call releasing him was the salt. At his age nobody in the top divisions is calling, and the only concrete offer comes from a proud old club rotting in the lower leagues, desperate for someone to lead them out of the wilderness. Does the fallen star drop down to build something?',
        choices: [
          { id: 'accept', label: 'Take the project', desc: 'Sign for the sleeping giant and become its cornerstone', outcome: 'He swaps five-star hotels for muddy training pitches and a squad of hungry kids, betting his final years on dragging a great old name back to life.', effect: { attr: { leadership: 2 }, meters: { fans: 10, authority: 8 }, earnings: -400, tag: 'rebuilder' }, next: 'grind' },
          { id: 'hold-out', label: 'Wait for better', desc: 'Bet on his name to open a door higher up the pyramid', outcome: 'He tells his agent to keep hunting, unwilling to believe the top level is done with him yet, and rolls the dice on his reputation.', effect: { greed: 1, market: 1, meters: { agent: 6 }, form: -0.04 }, next: 'grind' },
        ],
      },
      grind: {
        id: 'grind',
        prompt: 'Wherever he landed, reality bites in the trenches of the lower leagues — freezing away days at grounds with one working floodlight, brutal opponents who see his reputation as a scalp, and a body that no longer bounces back the way it did. What keeps the fallen star going through the mud?',
        choices: [
          { id: 'lead', label: 'Drag them up by the collar', desc: 'Impose top-flight standards on everyone around him', outcome: 'He refuses to let anyone hide from his standards, and slowly his ferocious professionalism starts to lift a whole club’s idea of itself.', effect: { attr: { leadership: 1, stamina: 2 }, meters: { peers: 12, authority: 8 }, form: 0.06, energy: -12 }, next: 'promotion' },
          { id: 'craft', label: 'Play a level above', desc: 'Let his class carve the division open week after week', outcome: 'He’s simply too good for the grade and treats it like a personal exhibition, dropping shoulders and threading passes the division has never seen.', effect: { form: 0.09, attr: { flair: 2, creativity: 2 }, meters: { fans: 14, peers: -8 }, energy: -8 }, next: 'promotion' },
        ],
      },
      promotion: {
        id: 'promotion',
        prompt: 'Against the odds he’s hauled the club to the brink of promotion, and on the final day it’s in their hands. In the last minute of a scoreless, season-defining match, he’s hacked down on the edge of the box and every exhausted eye turns to him over the free-kick. This is what he dropped down for. What does he do?',
        choices: [
          { id: 'redemption', label: 'Complete the redemption', desc: 'Back himself to fire the club and his career back to life', outcome: 'He whips it into the top corner and the ramshackle stand collapses in joy. Promotion won, reputation reborn, the fallen star risen again.', effect: { form: 0.13, attr: { flair: 2 }, meters: { fans: 22, authority: 10 }, market: 2, energy: -10 } },
          { id: 'selfless', label: 'Set up the kid', desc: 'Roll it to the academy boy he’s mentored all year', outcome: 'He disguises it and squares for the local lad to smash home, and lifts the teenager off his feet as the whole town pours onto the pitch. Legacy over glory.', effect: { attr: { teamwork: 2, leadership: 1 }, meters: { peers: 16, fans: 16 }, form: 0.08, market: -3 } },
        ],
      },
    },
  },
  {
    id: 'saga-takeover', title: 'The Takeover', icon: '🤝', category: 'saga',
    minTurn: 46, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Overnight the club is sold and everything he knew about it changes with a press release — new owners, a new badge on the letterhead, a new manager already booked, and a brutal audit of who fits the vision and who doesn’t. His name is on a list he hasn’t seen. How does he greet the regime that now controls his fate?',
        choices: [
          { id: 'impress', label: 'Sell himself to them', desc: 'Treat every session as an audition for the new bosses', outcome: 'He resolves to make himself undroppable before they’ve even watched a tape, turning up the intensity to force his way into the plan.', effect: { attr: { stamina: 1, aggression: 1 }, meters: { authority: 4 }, form: 0.05, tag: 'takeover-buyin' }, next: 'reckoning' },
          { id: 'wary', label: 'Guard the old guard', desc: 'Rally the survivors against a project that discards its history', outcome: 'He becomes the voice of the players who built the club before the money came, wary of a revolution that treats them as furniture.', effect: { attr: { leadership: 2 }, meters: { peers: 12, authority: -4 }, tag: 'takeover-resist' }, next: 'reckoning' },
        ],
      },
      reckoning: {
        id: 'reckoning',
        prompt: 'The new owners make their intentions concrete: a war chest, marquee arrivals, and a demand for instant results that has already cost the fans their cheap tickets and their old kit. He’s offered a central role in the shiny new era — but only if he publicly fronts the changes the terraces despise. What does he choose?',
        choices: [
          { id: 'frontman', label: 'Become the face', desc: 'Champion the project and reap the rewards of the new money', outcome: 'He fronts the glossy launch and pins his colours to the owners’ mast, and the club’s ambitions — and his contract — swell overnight.', effect: { earnings: 500, market: 2, meters: { sponsors: 10, authority: 6, fans: -8 } }, next: 'legacy' },
          { id: 'conscience', label: 'Speak for the terraces', desc: 'Use his platform to hold the new owners to the club’s roots', outcome: 'He tells the new bosses to their faces that a club is its supporters, not its spreadsheet, and the stands adopt him as their champion.', effect: { attr: { leadership: 1 }, meters: { fans: 18, authority: -6 }, form: 0.04 }, next: 'legacy' },
        ],
      },
      legacy: {
        id: 'legacy',
        prompt: 'A year of upheaval later, the takeover has remade the club into something unrecognisable — richer, harder, more ruthless — and he must decide who he is inside it before the transformation swallows the last of the old world. What does he make of himself in the new era?',
        choices: [
          { id: 'thrive', label: 'Thrive in the new world', desc: 'Fully become a player of the ambitious modern club', outcome: 'He sheds the last of his nostalgia and reinvents himself for the elite level the owners demand, chasing trophies the old club never dared dream of.', effect: { attr: { stamina: 1 }, meters: { authority: 6, sponsors: 6, fans: -10 }, form: 0.06, energy: -8 } },
          { id: 'anchor', label: 'Be the last link', desc: 'Stay as the living thread to everything the club used to be', outcome: 'He carries on as the one man who remembers who they were, a bridge between two clubs sharing one crest. The old fans will love him forever for it.', effect: { attr: { leadership: 1 }, meters: { fans: 16, peers: 8, sponsors: -8, authority: -6 } } },
        ],
      },
    },
  },
  {
    id: 'saga-international', title: 'The Call-Up', icon: '🎽', category: 'saga',
    minTurn: 54, maxTurn: 105, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The letter he stopped daring to hope for finally lands: a first senior international call-up, his nation’s badge, a squad full of names he grew up watching. But he’s the outsider, the bolter, and a whole camp of established stars is quietly wondering if he belongs. How does he walk into that dressing room?',
        choices: [
          { id: 'humble', label: 'Earn his place', desc: 'Keep his head down and outwork everyone in camp', outcome: 'He’s first to every session and last to leave, letting sweat rather than talk make his case to a room full of legends.', effect: { attr: { stamina: 1, teamwork: 1 }, meters: { peers: 10, authority: 4 }, energy: -10, tag: 'cap-humble' }, next: 'debut' },
          { id: 'bold', label: 'Show he belongs', desc: 'Play with the swagger that earned the call in the first place', outcome: 'He refuses to shrink, taking on the senior men in training with the fearlessness that got him noticed. The staff exchange approving glances.', effect: { attr: { flair: 2, aggression: 1 }, meters: { fans: 6, authority: 4, peers: -8 }, form: 0.05, tag: 'cap-bold' }, next: 'debut' },
        ],
      },
      debut: {
        id: 'debut',
        prompt: 'His debut comes as a substitute in a tense qualifier, the score level, a nation holding its breath and his own family somewhere in that vast crowd. The manager sends him on with a job to do and a career to launch. What does he make of his first minutes in the shirt?',
        choices: [
          { id: 'moment', label: 'Grab the headline', desc: 'Chase the fairytale goal on his very first appearance', outcome: 'He gambles on a run into the box and steals in to win it late, wheeling away to a debut nobody in that stadium will ever forget.', effect: { form: 0.12, attr: { flair: 2 }, meters: { fans: 18, sponsors: 6, authority: -6 }, market: 2 }, next: 'tournament' },
          { id: 'assured', label: 'Look like he’s always been there', desc: 'Keep it simple and flawless — announce a temperament, not a moment', outcome: 'He never gives the ball away, does the ugly work impeccably, and leaves the pitch having convinced the manager he can be trusted. A career begins quietly.', effect: { attr: { composure: 2, teamwork: 1 }, meters: { authority: 6, peers: 8 }, form: 0.06, market: -2 }, next: 'tournament' },
        ],
      },
      tournament: {
        id: 'tournament',
        prompt: 'The impossible has happened: he’s named in the squad for a major tournament, and by the knockout rounds an injury crisis has thrust the outsider into the starting eleven for a quarter-final his whole country will stop to watch. This is the summit he never dreamed of reaching. What does he do with it?',
        choices: [
          { id: 'hero', label: 'Rise to the summit', desc: 'Deliver the tournament performance of his life on the biggest stage', outcome: 'He plays like a man possessed, dragging his nation through a night they’ll retell for decades, and comes home a household name overnight.', effect: { form: 0.14, attr: { leadership: 1 }, meters: { fans: 24, sponsors: 12 }, market: 4, energy: -16 } },
          { id: 'sacrifice', label: 'Do the unseen work', desc: 'Sacrifice the glory to shackle the opposition’s star man', outcome: 'He spends the night marking the world-class danger out of the game, unglamorous and indispensable, and the pundits finally learn his name for the right reasons.', effect: { attr: { teamwork: 2, stamina: 1 }, meters: { peers: 14, authority: 8 }, form: 0.07, energy: -10, market: -2 } },
        ],
      },
    },
  },
  {
    id: 'saga-tournament-run', title: 'The Summer of a Nation', icon: '🌞', category: 'saga',
    minTurn: 46, maxTurn: 113, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The whole country has gone feverish: his nation has scraped into a major tournament and he has made the plane. On the eve of the opener the gaffer sits him down — he can be the starting fulcrum this side is built around, or the game-changer held back for when a match is dying. Which summer does he want?',
        choices: [
          { id: 'starter', label: 'Start every game', desc: 'Tell the boss he wants the shirt from the first whistle to the last', outcome: 'He looks the manager dead in the eye and asks for the burden of ninety minutes, every round. The staff scribble his name in ink.', effect: { attr: { leadership: 1, stamina: 1 }, meters: { authority: 8, fans: 8 }, energy: -10, tag: 'nation-starter' }, next: 'groups' },
          { id: 'impact', label: 'Be the finisher', desc: 'Embrace the role of the man who wins it late off the bench', outcome: 'He accepts the substitute’s brief with a nod — cold legs, colder head, saved for the death of tight games.', effect: { attr: { composure: 2 }, meters: { peers: 8, fans: -8 }, form: 0.05, tag: 'nation-finisher' }, next: 'super-sub' },
        ],
      },
      groups: {
        id: 'groups',
        prompt: 'Two group games in and the nation is on a knife-edge — a win sends them through, a defeat sends them home in disgrace. He is running the midfield into the ground but the legs are screaming and a booking hangs over him. How does he steer the decisive night?',
        choices: [
          { id: 'drive', label: 'Carry them through', desc: 'Take the game by the throat whatever it costs his body', outcome: 'He drags the side out of the group by sheer will, spent and magnificent, a country chanting his name from a thousand fan parks.', effect: { form: 0.12, attr: { stamina: 1, aggression: 1 }, meters: { fans: 20, authority: 8 }, energy: -16 }, next: 'semi' },
          { id: 'manage', label: 'Manage the game', desc: 'Protect the booking, dictate the tempo, take no reckless risk', outcome: 'He conducts it like a veteran, tempo in his pocket, and threads the pass that settles it without a single rash tackle.', effect: { attr: { composure: 1, creativity: 2 }, meters: { peers: 12, fans: 12 }, form: 0.08, energy: -6 }, next: 'semi' },
        ],
      },
      'super-sub': {
        id: 'super-sub',
        prompt: 'His tournament becomes legend from the bench: three times he has come on and three times he has changed the game. Now, in a tight last-sixteen tie, the manager turns to him earlier than ever with an hour still to play. Does the finisher become a starter?',
        choices: [
          { id: 'seize', label: 'Demand the whole game', desc: 'Play the extra minutes like a man who was never a substitute', outcome: 'He treats the early call as a promotion and never looks back, so decisive that the debate over the eleven ends that night.', effect: { form: 0.11, attr: { flair: 2 }, meters: { fans: 18, authority: 6 }, energy: -12 }, next: 'semi' },
          { id: 'clinical', label: 'Do one thing perfectly', desc: 'Forget the reel — win it with a single ruthless moment', outcome: 'He does almost nothing for an hour, then steals the only goal that matters. A nation exhales as one.', effect: { attr: { composure: 2 }, meters: { fans: 16, sponsors: 8, peers: -6 }, form: 0.07 }, next: 'semi' },
        ],
      },
      semi: {
        id: 'semi',
        prompt: 'The impossible has become real — a semi-final, his country ninety minutes from a final it has not reached in his lifetime, and {RIVAL}’s nation standing in the way with a squad worth ten times his own. The whole summer funnels into this one night. What does he pour into it?',
        choices: [
          { id: 'immortal', label: 'Chase immortality', desc: 'Play the game of his life and drag them to a final', outcome: 'He produces ninety minutes that will be replayed for generations, and a small nation walks into a final on the back of his boots.', effect: { form: 0.14, attr: { leadership: 1, flair: 2 }, meters: { fans: 26, sponsors: 12 }, market: 4, energy: -18 } },
          { id: 'shield', label: 'Do the dirty work', desc: 'Sacrifice his own game to smother their world-class threat', outcome: 'He spends the night as a limpet on their star, unglamorous and unbeatable, and the country reaches the final owing him a debt it can’t name.', effect: { attr: { teamwork: 2, stamina: 1 }, meters: { peers: 14, authority: 8 }, form: 0.06, energy: -12, market: -3 } },
        ],
      },
    },
  },
  {
    id: 'saga-playoff-final', title: 'The Playoff Escape', icon: '🪜', category: 'saga',
    minTurn: 46, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A wretched season has come down to this: safety is no longer in the table but in a one-off relegation playoff, a single winner-stays-up match against a club just as desperate. The manager asks how he wants to lead a dressing room staring into the abyss. What is his message on the eve of it?',
        choices: [
          { id: 'calm', label: 'Preach cold calm', desc: 'Strip the fear out of the room and make it feel like just another game', outcome: 'He tells the frightened lads that panic loses playoffs, not lack of talent, and a jittery squad settles behind his stillness.', effect: { attr: { composure: 2, leadership: 1 }, meters: { peers: 12, authority: 8 }, energy: -6, tag: 'playoff-calm' }, next: 'shootout' },
          { id: 'fire', label: 'Light the fire', desc: 'Fill them with the fury of men fighting for their livelihoods', outcome: 'He reminds them what relegation costs families and careers, and sends a room out snarling for the fight of their lives.', effect: { attr: { aggression: 2, composure: -1 }, meters: { authority: 6, fans: 8 }, form: 0.05, tag: 'playoff-fire' }, next: 'extra-time' },
        ],
      },
      shootout: {
        id: 'shootout',
        prompt: 'Level after ninety, level after extra time, and the club’s entire future collapses down to a penalty shootout under a shrieking sky. The manager is walking the takers along the halfway line and he can see the young lads shrinking. Does he grab the ball?',
        choices: [
          { id: 'step', label: 'Take the first kick', desc: 'Volunteer to lead off and set the tone for the frightened', outcome: 'He plants the opening penalty into the roof of the net and glares back at his own men — now you go. The nerve travels down the line.', effect: { form: 0.1, attr: { composure: 1, leadership: 1 }, meters: { fans: 20, authority: 10 }, energy: -8 } },
          { id: 'anchor', label: 'Take the last', desc: 'Hang back for the kick that could win or lose it all', outcome: 'He waits through five heartbeats of agony and buries the decider, and a stadium that feared the drop erupts into pure release.', effect: { form: 0.12, attr: { composure: 2 }, meters: { fans: 24, sponsors: 6, peers: -6 }, energy: -6 } },
        ],
      },
      'extra-time': {
        id: 'extra-time',
        prompt: 'The furious approach has dragged it into extra time, legs cramping, tempers frayed, a red card already down to ten men. He is on a booking himself with the survival of the club balanced on a razor. How does he see out the chaos?',
        choices: [
          { id: 'lead', label: 'Marshal the ten', desc: 'Drop deep, organise the exhausted, throw his body at everything', outcome: 'He reorganises the wreckage into a wall and heads clear the last cross of the night. They cling on and stay up on their knees.', effect: { attr: { teamwork: 2, aggression: 1, stamina: -1 }, meters: { fans: 22, authority: 8 } } },
          { id: 'gamble', label: 'Gamble on the break', desc: 'Refuse to sit — hunt the one counter that ends it', outcome: 'He backs himself to win it rather than survive it, springs the break, and slides in the goal that keeps the club breathing.', effect: { form: 0.13, attr: { flair: 2, aggression: 1 }, meters: { fans: 20, sponsors: 6 } } },
        ],
      },
    },
  },
  {
    id: 'saga-crossing-over', title: 'Crossing the Divide', icon: '🩸', category: 'saga',
    minTurn: 47, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The unthinkable offer has landed on the table: {RIVAL}, the bitter rivals he was raised to despise and whose fans have jeered him for years, want to sign him. It would be the greatest betrayal his own supporters could imagine — and the biggest deal of his life. Does he cross the divide?',
        choices: [
          { id: 'defect', label: 'Take their shirt', desc: 'Sign for the enemy and damn the consequences', outcome: 'He pulls on the colours he swore he never would, and by nightfall his old effigy is burning in a car park across the city.', effect: { market: 3, greed: 1, earnings: 800, meters: { fans: -24, authority: -6 }, tag: 'defected' }, next: 'reception' },
          { id: 'refuse', label: 'Refuse on principle', desc: 'Turn the enemy down flat, whatever the money', outcome: 'He tells the rivals there isn’t a number on earth that buys him, and his own terraces roar a loyalty song for a week.', effect: { attr: { leadership: 1 }, meters: { fans: 22, authority: 8 }, form: 0.05, tag: 'loyal-refuser' }, next: 'stayed-hero' },
        ],
      },
      reception: {
        id: 'reception',
        prompt: 'His first return to his old ground in the enemy’s shirt is a cauldron of pure hatred — coins, chants about his family, a wall of loathing from the people who once worshipped him. He wins a chance to score against the club that made him. What does he do?',
        choices: [
          { id: 'silence', label: 'Bury it and stay silent', desc: 'Score, then refuse to celebrate against the fans he betrayed', outcome: 'He slots it in and stands stone-still, palms raised in apology, and even the venom in the stands falters for a second.', effect: { form: 0.11, attr: { composure: 2 }, meters: { sponsors: 8, peers: 6, fans: -8 } } },
          { id: 'goad', label: 'Silence them with malice', desc: 'Score and wheel away to bask in their fury', outcome: 'He rifles it home and sprints to cup his ears at the home end, a villain now and forever, adored by his new tribe.', effect: { form: 0.1, attr: { aggression: 2, flair: 2 }, meters: { fans: 14, authority: -8 }, market: 2 } },
        ],
      },
      'stayed-hero': {
        id: 'stayed-hero',
        prompt: 'His refusal has made him a folk hero, and the club rewards the loyalty by naming him the emotional heart of the derby fixture forever after. But {RIVAL} come back with an even more obscene bid the following summer, and the whispers about his ambition return. Does the loyalty hold twice?',
        choices: [
          { id: 'anchor', label: 'Anchor himself for good', desc: 'Reject them again and sign a deal to end his days here', outcome: 'He commits his prime to the badge and lets the enemy know the door is bricked shut. A one-club legend is written into the walls.', effect: { attr: { leadership: 1 }, meters: { fans: 20, authority: 10 }, earnings: 200 } },
          { id: 'human', label: 'Admit he’s tempted', desc: 'Be honest that even loyalty has a breaking point', outcome: 'He tells the press he’s only human and the money is dizzying, and the terraces, uneasy now, wonder how long the fairytale can last.', effect: { greed: 1, market: 2, meters: { fans: -6, agent: 8 } } },
        ],
      },
    },
  },
  {
    id: 'saga-player-coach', title: 'The Player-Coach', icon: '📋', category: 'saga',
    minTurn: 96, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His legs are fading but his mind has never been sharper, and the club offers a role no player his age is ready to hear: player-coach, a foot in the dressing room and a foot in the dugout at once. It means coaching men he still competes with for a shirt. Does he take the twin burden?',
        choices: [
          { id: 'clipboard', label: 'Lean into the coaching', desc: 'Throw himself at the badges and the tactics board', outcome: 'He spends his evenings drawing shapes and his weekends still playing, a bridge between the old world and the new one already forming.', effect: { attr: { leadership: 2, creativity: 2 }, meters: { authority: 8, peers: 6, family: -8 }, form: -0.04, tag: 'coach-track' }, next: 'authority' },
          { id: 'player', label: 'Stay a player first', desc: 'Take the title but guard his place in the eleven fiercely', outcome: 'He accepts the badge but refuses to stop competing, determined to earn his minutes before he ever earns his authority.', effect: { attr: { stamina: 1, aggression: 1 }, meters: { peers: 10, authority: 2 }, form: 0.04, energy: -12, tag: 'still-playing' }, next: 'dressing-room' },
          { id: 'already-doing-it', label: 'Take it — he has been doing the job for free', desc: 'He has already spent seasons teaching the club’s next one', outcome: 'He points out, mildly, that he has been coaching a young player through every session for two seasons already, and asks only that they call the thing what it is.', effect: { attr: { leadership: 2, creativity: 2 }, meters: { authority: 10, peers: 10 }, form: -0.03, tag: 'coach-track' }, next: 'authority', requires: 'heir-mentor' },
        ],
      },
      authority: {
        id: 'authority',
        prompt: 'A rift opens that only he can settle: the manager wants to drop a rebellious young star, and as player-coach he sits on both sides of the door at once — teammate to the kid, lieutenant to the boss. Both are waiting to see whose side he takes. What does he do?',
        choices: [
          { id: 'manager', label: 'Back the dugout', desc: 'Enforce the manager’s call and take the flak from the lads', outcome: 'He delivers the hard news himself and absorbs the young star’s fury, choosing the coach’s chair over the comfort of the room.', effect: { attr: { leadership: 2 }, meters: { authority: 10, peers: -4 } } },
          { id: 'bridge', label: 'Broker the peace', desc: 'Refuse to pick a side and force the two to talk', outcome: 'He locks the boy and the boss in a room and won’t let either leave until the air clears. A diplomat’s badge, quietly earned.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { authority: 6, peers: 10 } } },
        ],
      },
      'dressing-room': {
        id: 'dressing-room',
        prompt: 'His insistence on still playing has bred a strange tension — the younger lads aren’t sure whether to fear him or joke with him, and one openly questions whether a man refereeing his own minutes can be trusted to coach fairly. How does he answer the challenge?',
        choices: [
          { id: 'prove', label: 'Prove it on the grass', desc: 'Silence the doubt by simply being the best player again', outcome: 'He responds with a run of form that makes his selection unarguable, and the questions about favouritism die in the noise of applause.', effect: { form: 0.09, attr: { flair: 2 }, meters: { fans: 12, authority: 6 }, energy: -12 } },
          { id: 'step-aside', label: 'Bench himself', desc: 'Prove his fairness by leaving his own name off the sheet', outcome: 'He drops himself for a huge game to play the kid instead, and the gesture buys a respect no speech ever could.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 14, authority: 8 }, form: -0.06 } },
        ],
      },
    },
  },
  {
    id: 'saga-var-season', title: 'The Video Season', icon: '📺', category: 'saga',
    minTurn: 46, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A season is quietly being warped by the screens: three times now a match-defining decision has been overturned by a distant video review, and twice it has gutted his own side. After a goal is chalked off for a toenail against {RIVAL}, a camera finds him at the tunnel’s mouth. How does he react?',
        choices: [
          { id: 'blast', label: 'Blast the system', desc: 'Tear into the officiating for all the cameras to hear', outcome: 'He unloads on the whole video circus live on air, and a furious game half-agrees with him while the authorities reach for a charge sheet.', effect: { attr: { aggression: 2 }, meters: { fans: 14, authority: -4 }, tag: 'var-firebrand' }, next: 'charge' },
          { id: 'ice', label: 'Bite his tongue', desc: 'Swallow the injustice and refuse to give them a headline', outcome: 'He says only that the players will keep deciding it on the grass, and his icy composure earns more respect than any rant.', effect: { attr: { composure: 2 }, meters: { peers: 8, sponsors: 6 }, form: 0.04, tag: 'var-stoic' }, next: 'title-swing' },
        ],
      },
      charge: {
        id: 'charge',
        prompt: 'His outburst has earned him a disrepute charge and a media pile-on, and the club is split on whether he’s a martyr or a liability. Then, in a vast match, a video review hands his side a soft, contentious penalty — the very system he savaged now rescuing him. How does he handle the irony?',
        choices: [
          { id: 'own', label: 'Own the contradiction', desc: 'Take the gift, score, and admit the system cuts both ways', outcome: 'He buries the spot-kick and tells the cameras, straight-faced, that maybe the machines get one right now and then. The game laughs with him.', effect: { form: 0.1, attr: { flair: 2 }, meters: { fans: 12, authority: 4 }, earnings: -200 } },
          { id: 'refuse', label: 'Refuse the gift', desc: 'Make a stand and hand the ball to someone else', outcome: 'He waves the penalty duty away in protest at the whole charade, a gesture the purists adore and the pundits argue over for weeks.', effect: { attr: { leadership: 1 }, meters: { fans: 10, sponsors: 8, authority: -8 }, market: 2 } },
        ],
      },
      'title-swing': {
        id: 'title-swing',
        prompt: 'It all comes to a head on the final run-in: his team’s season hangs on one last review, a winner sent upstairs to the screens while ninety thousand hold their breath and the officials stare at a monitor for an eternity. He can only stand and wait. What is going through him as the decision comes?',
        choices: [
          { id: 'faith', label: 'Trust the process', desc: 'Keep his men calm and ready however the screen falls', outcome: 'He herds his side into readiness rather than protest, and when the goal is finally given they are already sprinting, sharpest in the chaos.', effect: { form: 0.11, attr: { composure: 2, leadership: 1 }, meters: { authority: 8, fans: 14 } } },
          { id: 'rage', label: 'Rage at the wait', desc: 'Let the officials feel exactly what the delay is doing', outcome: 'He storms the fourth official as the seconds crawl, and whether it helps or not, his fans will forever say he fought for every inch.', effect: { attr: { aggression: 1 }, meters: { fans: 12, authority: -2 }, form: 0.05 } },
        ],
      },
    },
  },
  {
    id: 'saga-armband-handover', title: 'Passing the Armband', icon: '🤝', category: 'saga',
    minTurn: 90, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has worn the captaincy for years, but a fearless young star is emerging as the obvious face of the club’s future, and the manager gently floats the question nobody wanted to ask: is it time to pass the armband on? It is his identity being quietly retired. How does he meet the moment?',
        choices: [
          { id: 'grace', label: 'Hand it over willingly', desc: 'Offer the armband to the kid before he’s asked to give it up', outcome: 'He walks into the manager’s office and volunteers to step aside, choosing dignity over a fight he’d one day lose anyway.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { authority: 6, peers: 12 }, tag: 'handed-over' }, next: 'mentor' },
          { id: 'fight', label: 'Refuse to give it up', desc: 'Insist the armband is earned, not inherited, and hold on', outcome: 'He tells them the young pretender can take it off him on merit, not seniority, and grips the captaincy tighter than ever.', effect: { attr: { aggression: 1, leadership: 1 }, meters: { authority: 4, peers: -2 }, form: 0.04, tag: 'held-on' }, next: 'rivalry' },
          { id: 'as-it-was-done', label: 'Hand it over and stay at his shoulder', desc: 'Somebody did exactly this for him when he was the young one', outcome: 'He gives the band up and asks the manager for one thing in return — that he stands beside the boy for a season, the way an older man once stood beside him.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { authority: 8, peers: 14, fans: 6 }, tag: 'handed-over' }, next: 'mentor', requires: 'captain' },
        ],
      },
      mentor: {
        id: 'mentor',
        prompt: 'The armband is the boy’s now, but he is drowning in the weight of it — a red card, a lost dressing room, a defeat where the youngster froze. The new captain comes to him in tears, unsure he can do it. What kind of elder does he choose to be?',
        choices: [
          { id: 'raise', label: 'Build him back up', desc: 'Pour everything he knows into the frightened kid', outcome: 'He spends weeks quietly rebuilding the boy’s nerve, and the young captain grows into the leader he could never have become alone.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 14, authority: 8, fans: 8 }, form: -0.04 } },
          { id: 'tough', label: 'Toughen him up', desc: 'Refuse the sympathy and demand he stands on his own feet', outcome: 'He tells the kid that leaders don’t get to cry in public and to go earn the respect back, a harsh gift the boy never forgets.', effect: { attr: { leadership: 1, aggression: 1 }, meters: { authority: 6, peers: -6 } } },
        ],
      },
      rivalry: {
        id: 'rivalry',
        prompt: 'Holding on has bred a cold war: the young star, snubbed, has turned sullen, and the dressing room is quietly picking sides between the old captain and the heir he blocked. The manager warns him the poison is spreading. Does he thaw it, or double down?',
        choices: [
          { id: 'reconcile', label: 'Make peace at last', desc: 'Share the leadership before the rift tears the club apart', outcome: 'He finally brings the kid into the fold as his lieutenant, and two captains in all but name drag the squad back together.', effect: { attr: { teamwork: 2, leadership: 1 }, meters: { peers: 12, authority: 8 } } },
          { id: 'dominate', label: 'Crush the challenge', desc: 'Reassert total control and let the pretender wait his turn', outcome: 'He faces the boy down in front of the room and reminds everyone whose team it is, a display of ruthless authority that ends the debate cold.', effect: { attr: { leadership: 1, aggression: 1 }, meters: { authority: 10, peers: -6 } } },
        ],
      },
    },
  },
  {
    id: 'saga-long-ban', title: 'The Ban', icon: '⛔', category: 'saga',
    minTurn: 46, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A moment of madness in the heat of a derby — a wild swing at {RIVAL}’s provocateur caught by every camera — and the disciplinary panel comes down like a hammer: a long ban that rips the heart out of his season. Locked out of the game he loves, how does he serve the sentence?',
        choices: [
          { id: 'contrite', label: 'Own the shame', desc: 'Apologise publicly and vow to come back a better man', outcome: 'He faces the cameras, takes the blame with no excuses, and quietly resolves to turn the exile into something worth having.', effect: { attr: { composure: 1 }, meters: { fans: 8, authority: 4 }, tag: 'ban-contrite' }, next: 'return-game' },
          { id: 'bitter', label: 'Burn with grievance', desc: 'Rage at the injustice and the man who baited him', outcome: 'He tells anyone who’ll listen that he was set up, and nurses the fury like a coal he plans to spend on his return.', effect: { attr: { aggression: 2 }, meters: { fans: 6, authority: -6 }, form: -0.04, tag: 'ban-bitter' }, next: 'revenge-game' },
        ],
      },
      'return-game': {
        id: 'return-game',
        prompt: 'The ban is finally served and he walks back into a stadium unsure whether to cheer him or judge him. His very first touch is a heavy challenge flying in — the exact situation that undid him. The whole ground holds its breath to see if he has truly changed. What does he do?',
        choices: [
          { id: 'ride', label: 'Ride the tackle', desc: 'Take the hit, keep his feet, and let his football answer', outcome: 'He rides the challenge without a flicker of temper and glides away, and a watching game exhales — the fire is finally under control.', effect: { form: 0.1, attr: { composure: 2, aggression: -1 }, meters: { fans: 14, authority: 6 } } },
          { id: 'lead', label: 'Turn saint', desc: 'Spend the day as the calmest, most disciplined man on the pitch', outcome: 'He wears the armband of restraint all afternoon, defusing every flashpoint, a reformed man remaking his whole reputation in ninety minutes.', effect: { attr: { leadership: 1 }, meters: { authority: 8, fans: 12, peers: -6 }, form: 0.06 } },
        ],
      },
      'revenge-game': {
        id: 'revenge-game',
        prompt: 'His comeback lands, by cruel fate, against {RIVAL} — the very rivals whose man he struck, the fixture that cost him everything. The provocateur is grinning at him from the first whistle, hunting the same reaction all over again. Everything he’s built rides on how he answers. What does he do?',
        choices: [
          { id: 'sublime', label: 'Punish them properly', desc: 'Take his revenge in goals, not fists', outcome: 'He channels every ounce of the grievance into a devastating performance and buries them clean, revenge served ice cold and legal.', effect: { form: 0.13, attr: { flair: 2, composure: 1 }, meters: { fans: 18, sponsors: 6 } } },
          { id: 'snap', label: 'Take the bait again', desc: 'Let the old rage win one more time', outcome: 'He bites, just as they hoped, and though he lands the retort he trudges off knowing he learned nothing at all. The cycle turns again.', effect: { attr: { aggression: 2 }, meters: { fans: 4, authority: -8 }, form: -0.06 } },
        ],
      },
    },
  },
  {
    id: 'saga-farewell-tour', title: 'The Long Goodbye', icon: '🎩', category: 'saga',
    minTurn: 105, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has decided: this will be his last season, and the club wants to announce it before a ball is kicked so the whole game can salute him on the way out. A farewell tour of standing ovations in every away ground — or one quiet final year. How does he want to be sent off?',
        choices: [
          { id: 'tour', label: 'Take the tour', desc: 'Announce it early and let every stadium say goodbye', outcome: 'The news breaks and the tributes begin, guards of honour in cities that once booed him, a whole sport doffing its cap.', effect: { attr: { leadership: 1 }, meters: { fans: 16, sponsors: 8 }, form: -0.05, tag: 'farewell-loud' }, next: 'ovations' },
          { id: 'quiet', label: 'Slip away quietly', desc: 'Tell no one and let the season speak for itself', outcome: 'He keeps the secret close, determined to be judged as a player to the last whistle and not a walking tribute act.', effect: { attr: { composure: 2 }, meters: { peers: 10, family: 6, sponsors: -10 }, form: 0.04, tag: 'farewell-quiet' }, next: 'last-run' },
        ],
      },
      ovations: {
        id: 'ovations',
        prompt: 'The tour is a swelling procession of tributes, but a hard truth lurks beneath the applause — the team is chasing something real, and the sentimental send-off is starting to cost them results. The manager wonders aloud if the circus is a distraction. How does he answer it?',
        choices: [
          { id: 'earn', label: 'Play, don’t parade', desc: 'Demand to be treated as a footballer, not a farewell', outcome: 'He tells the boss to bench him the moment he’s a passenger, and backs it up with performances that silence the doubt entirely.', effect: { form: 0.09, attr: { stamina: 1 }, meters: { authority: 8, peers: 8 }, energy: -10 } },
          { id: 'embrace', label: 'Let them have it', desc: 'Give the fans the goodbye they’ve paid to see', outcome: 'He leans into every ovation and gifts the crowds their memories, a lap of honour a year long that no one who saw it forgets.', effect: { attr: { flair: 2 }, meters: { fans: 18, sponsors: 10 }, market: 2, form: -0.06 } },
        ],
      },
      'last-run': {
        id: 'last-run',
        prompt: 'The secret has held and, unburdened by ceremony, he has quietly produced one of the finest seasons of his late career — so good the club begs him to reconsider and play on another year. The temptation to keep going gnaws at him. Does he stick to the goodbye?',
        choices: [
          { id: 'walk', label: 'Walk away on top', desc: 'Retire at the summit, on his own terms, no regrets', outcome: 'He plays his last game as one of his best, then hangs the boots up in the dressing room and closes the door softly. Perfect timing.', effect: { attr: { leadership: 1 }, meters: { fans: 14, family: 8, peers: 10 }, earnings: -600 } },
          { id: 'onemore', label: 'Give it one more year', desc: 'Let the form talk him out of retiring after all', outcome: 'He tears up the goodbye and signs on for one more, gambling that the fairytale can stretch a chapter longer. The clock, unbeaten, keeps ticking.', effect: { attr: { stamina: 1 }, meters: { fans: 8, authority: 4 }, form: 0.05, earnings: 200, greed: 1, energy: -10 } },
        ],
      },
    },
  },
  {
    id: 'saga-goal-difference', title: 'By Goal Difference', icon: '🧮', category: 'saga',
    minTurn: 46, maxTurn: 113, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It is the tightest title race the division has known — his club and {RIVAL}’s dead level on points into the final day, the whole thing to be settled not by results but by goal difference, goals piled up like sandbags against a flood. The manager gathers them: do they defend the margin or attack it? What does he argue for?',
        choices: [
          { id: 'attack', label: 'Chase every goal', desc: 'Argue they must win big and bury the margin beyond doubt', outcome: 'He makes the case for the throat, not the safe hands — pile the goals on and take the title out of anyone else’s reckoning.', effect: { attr: { aggression: 1, flair: 2 }, meters: { authority: 6, fans: 8, peers: -6 }, tag: 'gd-attack' }, next: 'goal-glut' },
          { id: 'control', label: 'Protect the cushion', desc: 'Argue for control — a clean sheet keeps the margin intact', outcome: 'He preaches discipline: don’t throw open a race they lead, strangle the game and let the arithmetic do the rest.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { authority: 6, peers: 8, fans: -8 }, tag: 'gd-control' }, next: 'clean-sheet' },
        ],
      },
      'goal-glut': {
        id: 'goal-glut',
        prompt: 'They have gone for the jugular and it is raining goals at both ends of the country — word filters through that {RIVAL} are matching them strike for strike, the title swinging on a knife with every net rippling. Deep in stoppage time it stands level on difference and he is through on goal. This kick is the title. What does he do?',
        choices: [
          { id: 'smash', label: 'Go for glory', desc: 'Back himself to score the goal that wins the league on difference', outcome: 'He steadies, picks his spot, and lashes it in on the last kick — champions by a single goal of difference, decided by his boot alone.', effect: { form: 0.14, attr: { aggression: 1 }, meters: { fans: 26, authority: 10 }, market: 3, energy: -12 } },
          { id: 'square', label: 'Square the certain goal', desc: 'Roll it to the open man rather than gamble on the angle', outcome: 'He resists the hero’s swing and slides it across for the tap-in that seals the arithmetic. Not his name, but his nerve, that won the league.', effect: { form: 0.1, attr: { teamwork: 2, composure: 1 }, meters: { peers: 14, fans: 16 }, market: -3 } },
        ],
      },
      'clean-sheet': {
        id: 'clean-sheet',
        prompt: 'They have shut up shop to guard the margin, but news crackles round the ground that {RIVAL} have found a goal and drawn the difference dead level — one concession now and the title is gone. There are nervy minutes left and the whole back line is looking to him to hold the line. How does he see it out?',
        choices: [
          { id: 'wall', label: 'Marshal the rearguard', desc: 'Drop deep, organise, and refuse them a single sniff', outcome: 'He conducts the defence like a maestro of the ugly arts, blocks the last shot with his face, and the clean sheet crowns them champions on difference.', effect: { form: 0.11, attr: { teamwork: 2, leadership: 1 }, meters: { authority: 10, fans: 18 }, injury: true, energy: -10 } },
          { id: 'nick', label: 'Nick one to be sure', desc: 'Break the siege and hunt the goal that ends all doubt', outcome: 'He decides sitting on it is death and springs upfield to steal the goal that puts the title beyond arithmetic. Bold, and vindicated.', effect: { form: 0.12, attr: { flair: 2, aggression: 1 }, meters: { fans: 20, sponsors: 6, peers: -8 }, market: 2 } },
        ],
      },
    },
  },
];
