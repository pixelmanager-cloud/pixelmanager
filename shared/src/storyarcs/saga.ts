import type { StoryArc } from '../storyarc.js';

// SAGA arcs — long, branching, career-shaping storylines that unfold over several turns.
export const SAGA_ARCS: StoryArc[] = [
  {
    id: 'transfer-saga', title: 'The Big Move', icon: '✈️', category: 'saga',
    minTurn: 90, maxTurn: 175, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A giant of the game has come calling — a life-changing move, but it means leaving the club that made him. The agent wants an answer. How does he play it?',
        choices: [
          { id: 'push', label: 'Force the move', desc: 'Hand in a transfer request — burn the bridge, chase the dream', outcome: 'He tells the club he wants out. The fans turn; the move edges closer.', effect: { market: 3, greed: 2, meters: { fans: -18, authority: -8 }, tag: 'pushed' }, next: 'pushed' },
          { id: 'loyal', label: 'Stay loyal', desc: 'Publicly commit to the club — turn the giants down', outcome: 'He kisses the badge and stays. The terraces roar his name.', effect: { form: 0.06, meters: { fans: 16, authority: 6 }, attr: { leadership: 1 }, tag: 'stayed' }, next: 'stayed' },
          { id: 'leverage', label: 'Use it for leverage', desc: 'Let it drag on — angle for a bumper new deal to stay', outcome: 'The saga rumbles on. The club, twitchy, tables a huge renewal to keep him.', effect: { earnings: 700, greed: 1, market: 2, meters: { fans: -4 }, tag: 'leveraged' }, next: 'leveraged' },
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
          { id: 'accept', label: 'Embrace it', desc: 'Become the club’s talisman', outcome: 'He carries the team on his back — and grows into a leader for it.', effect: { attr: { leadership: 2, composure: 1 }, meters: { authority: 8 }, form: 0.05 } },
          { id: 'quiet', label: 'Keep his head down', desc: 'Let his football do the talking', outcome: 'No fuss, just performances — the fans adore the humility.', effect: { meters: { fans: 8 }, form: 0.04 } },
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
    minTurn: 100, maxTurn: 185, weight: 2, first: 'open',
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
          { id: 'rally', label: 'Rally them', desc: 'A speech from the heart — drag them back into it', outcome: 'His words land. They come out transformed and salvage a draw. A captain is born.', effect: { attr: { leadership: 2, composure: 1 }, meters: { authority: 10, peers: 8 }, form: 0.06 } },
          { id: 'lead-quiet', label: 'Lead by example', desc: 'Say little — go out and drag them by the collar himself', outcome: 'No speeches, just a performance nobody could ignore. The armband suits him.', effect: { attr: { leadership: 1, stamina: 1 }, meters: { peers: 10 }, form: 0.05 } },
        ],
      },
    },
  },
  {
    id: 'relegation-battle', title: 'The Drop Fight', icon: '🪂', category: 'saga',
    minTurn: 95, maxTurn: 180, weight: 2, first: 'open',
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
          { id: 'hero', label: 'Gamble everything', desc: 'Throw himself at it — hero or villain', outcome: 'He bundles it in at the death. Survival! Grown men weep in the stands, chanting his name.', effect: { form: 0.12, attr: { composure: 1, aggression: 1 }, meters: { fans: 24, authority: 10 } } },
          { id: 'safe', label: 'Play the percentages', desc: 'Lay it off to a better-placed teammate', outcome: 'He squares it; the finish is someone else’s, but the point stands and they survive.', effect: { form: 0.06, attr: { teamwork: 1 }, meters: { peers: 12, fans: 10 } } },
        ],
      },
    },
  },
  {
    id: 'saga-title-race', title: 'The Final Day', icon: '🏆', category: 'saga',
    minTurn: 100, maxTurn: 185, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It has come down to this: level on points at the summit, one match left, the title in their own hands if they hold their nerve. The whole season funnels into ninety minutes. How does he carry himself into the biggest week of his life?',
        choices: [
          { id: 'front', label: 'Front the cameras', desc: 'Stand up in the pre-match press room and shoulder the expectation', outcome: 'He looks the nation in the eye and promises nothing but everything. The dressing room stands taller for it.', effect: { attr: { leadership: 2, composure: 1 }, meters: { fans: 12, authority: 6 }, tag: 'talisman' }, next: 'kickoff' },
          { id: 'insulate', label: 'Shut out the noise', desc: 'Go quiet — phone off, curtains drawn, save every drop for Saturday', outcome: 'He vanishes from the circus and turns up on the day with cold, clear eyes.', effect: { attr: { composure: 2 }, form: 0.05, meters: { peers: 6 }, tag: 'ice' }, next: 'kickoff' },
        ],
      },
      kickoff: {
        id: 'kickoff',
        prompt: 'Hour gone, still goalless, and word crackles round the ground that {RIVAL}’s lot have gone ahead in the other game — a single goal now hands them everything. The stadium turns brittle. He gets the ball on the halfway line with acres ahead of him.',
        choices: [
          { id: 'drive', label: 'Drive at them', desc: 'Put his head down and carry the whole club on that one run', outcome: 'He surges through three challenges and rifles it in off the bar. The title tilts back their way and the roar nearly lifts the roof.', effect: { form: 0.14, attr: { aggression: 1, flair: 1 }, meters: { fans: 26, authority: 10 } }, next: 'whistle' },
          { id: 'orchestrate', label: 'Slow it down', desc: 'Trust the plan — knit the passes, wait for the crack to open', outcome: 'He pulls the tempo back to a walk, teases them out of shape, then threads the pass that unlocks it. Clinical.', effect: { form: 0.1, attr: { creativity: 2, teamwork: 1 }, meters: { peers: 14, fans: 16 } }, next: 'whistle' },
        ],
      },
      whistle: {
        id: 'whistle',
        prompt: 'The final whistle detonates the stadium — champions, on the last kick of the season, by the width of a single goal. Amid the pile-on and the flares, a reporter shoves a microphone at him for the first word of a new era.',
        choices: [
          { id: 'humble', label: 'Hand it to the badge', desc: 'Give every ounce of it to the fans and the fallen', outcome: 'He dedicates the lot to the supporters who never stopped singing. A club immortal, and a humble one.', effect: { attr: { leadership: 1 }, meters: { fans: 20, authority: 8 }, earnings: 400 } },
          { id: 'roar', label: 'Let it all out', desc: 'Rip the shirt off and bellow into the away end', outcome: 'He tears his jersey off and screams at {RIVAL}’s emptying stand. Iconic, feral, and utterly unforgettable.', effect: { attr: { aggression: 1, flair: 1 }, meters: { fans: 16, sponsors: 8 }, market: 3 } },
        ],
      },
    },
  },
  {
    id: 'saga-underdog-cup', title: 'The Giant-Killers', icon: '⚔️', category: 'saga',
    minTurn: 90, maxTurn: 175, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club of his modest stature was never meant to still be in this cup, yet the draw has paired them with the reigning champions under the lights. The pundits have already written the scoreline. What does he tell the lads on the coach?',
        choices: [
          { id: 'believe', label: 'Preach belief', desc: 'Convince the room that nobody remembers the favourites', outcome: 'He stands in the aisle and swears they can shock the country. Something electric passes down the coach.', effect: { attr: { leadership: 2 }, meters: { peers: 12, authority: 6 }, form: 0.05, tag: 'believers' }, next: 'giant' },
          { id: 'freedom', label: 'Sell them freedom', desc: 'Tell them there’s no pressure — go and enjoy the ride', outcome: 'He shrugs and grins: nothing to lose, everything to gain. The tension drains out of them.', effect: { attr: { composure: 1, flair: 1 }, meters: { peers: 10 }, form: 0.06, tag: 'loose' }, next: 'giant' },
        ],
      },
      giant: {
        id: 'giant',
        prompt: 'Against all logic they lead by a single goal into the closing stages, but the champions are camped in their half and legs are turning to lead. The bench is screaming two different things at once. What does he do to see it out?',
        choices: [
          { id: 'wall', label: 'Marshal the wall', desc: 'Drop deep, organise bodies, throw himself in front of everything', outcome: 'He drags the whole team behind the ball and heads clear the last desperate cross. They hold. Bedlam.', effect: { attr: { teamwork: 2, aggression: 1, stamina: -1 }, meters: { fans: 22, authority: 8 } }, next: 'aftermath' },
          { id: 'counter', label: 'Hunt the killer second', desc: 'Keep a runner high and gamble on the break to finish them', outcome: 'He springs the counter himself and buries the second at the death. The tie is over as a contest.', effect: { form: 0.12, attr: { flair: 1, aggression: 1 }, meters: { fans: 24, sponsors: 6 } }, next: 'aftermath' },
        ],
      },
      aftermath: {
        id: 'aftermath',
        prompt: 'By dawn his name is on every back page and his phone is thick with sporting directors who never returned his calls before. The little club that raised him suddenly looks like a stepping stone. How does he handle the sudden gravity?',
        choices: [
          { id: 'stay', label: 'Stay for the run', desc: 'Wave the vultures off — see this fairytale to the final', outcome: 'He tells the agents to wait until summer; some stories are worth more than money. The town falls in love.', effect: { attr: { leadership: 1 }, meters: { fans: 18, authority: 6 }, form: 0.04 } },
          { id: 'cashin', label: 'Ride the momentum', desc: 'Let his agent shop the highlight reel while it’s hot', outcome: 'He lets the offers stack up, his valuation ballooning on ninety famous minutes. Business is business.', effect: { market: 4, greed: 1, earnings: 500, meters: { fans: -6, agent: 8 } } },
        ],
      },
    },
  },
  {
    id: 'saga-homecoming', title: 'The Return', icon: '🏡', category: 'saga',
    minTurn: 130, maxTurn: 190, weight: 2, first: 'open',
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
          { id: 'mentor', label: 'Raise the next one', desc: 'Take the kid under his wing rather than block his path', outcome: 'He plays half the minutes and gives the rest to the boy, teaching him everything. A different kind of legacy grows.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 14, authority: 8, fans: 10 } }, next: 'legacy' },
          { id: 'prove', label: 'Prove he’s not finished', desc: 'Show the doubters the old magic never left', outcome: 'He runs the game from memory and instinct, silencing anyone who called him a nostalgia signing.', effect: { form: 0.08, attr: { creativity: 1, composure: 1 }, meters: { fans: 18 } }, next: 'legacy' },
        ],
      },
      legacy: {
        id: 'legacy',
        prompt: 'The season winds down and the club offers to retire his number, hang his shirt in the concourse, name him something more than a player. It is a curtain call dressed as an honour. What does he ask them to make of him?',
        choices: [
          { id: 'ambassador', label: 'Become an institution', desc: 'Accept a role that keeps him bound to the club for life', outcome: 'He signs on as more than a footballer now — a keeper of the flame for whoever wears it next.', effect: { attr: { leadership: 1 }, meters: { fans: 20, authority: 10, family: 6 }, earnings: 200 } },
          { id: 'oneofus', label: 'Just be one of them', desc: 'Wave off the pageantry — he only ever wanted to play', outcome: 'He asks them to skip the ceremony; the badge on his chest was always honour enough.', effect: { meters: { fans: 14, peers: 8 }, form: 0.03 } },
        ],
      },
    },
  },
  {
    id: 'saga-position-switch', title: 'The Reinvention', icon: '🔄', category: 'saga',
    minTurn: 140, maxTurn: 195, weight: 2, first: 'open',
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
          { id: 'craft', label: 'Out-think him', desc: 'Use every trick a decade of pace once taught him', outcome: 'He shepherds the kid into blind alleys all night, reading him like a book he wrote. Cunning beats quick.', effect: { attr: { composure: 2, creativity: 1 }, meters: { peers: 12, fans: 10 }, form: 0.07 } },
          { id: 'graft', label: 'Out-run him anyway', desc: 'Dig into the tank and simply refuse to be beaten', outcome: 'He matches the boy stride for stride to the whistle, lungs screaming, and earns a standing ovation for sheer bloody-mindedness.', effect: { attr: { stamina: 2, aggression: 1 }, meters: { fans: 14, authority: 6 }, form: 0.05 } },
        ],
      },
    },
  },
  {
    id: 'saga-new-signing', title: 'The Replacement', icon: '🪑', category: 'saga',
    minTurn: 110, maxTurn: 185, weight: 2, first: 'open',
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
          { id: 'masterclass', label: 'Deliver a masterclass', desc: 'Put on a display of pure, unarguable quality', outcome: 'He runs the practice match like a maestro, leaving no doubt whose shirt it is. The staff exchange glances.', effect: { form: 0.1, attr: { creativity: 1, composure: 1 }, meters: { authority: 8, peers: 6 } }, next: 'verdict' },
          { id: 'selfless', label: 'Make the kid shine', desc: 'Set up chance after chance to prove he lifts a team', outcome: 'He turns provider, gifting the newcomer goals to show his value isn’t measured in his own tally alone.', effect: { attr: { teamwork: 2 }, meters: { peers: 14, authority: 4 }, form: 0.05 }, next: 'verdict' },
        ],
      },
      verdict: {
        id: 'verdict',
        prompt: 'The manager pulls him in to deliver the call. Whatever the outcome of the scrimmage, the club’s long-term plan is written in that record fee, and they both know it. What does he say when the door closes?',
        choices: [
          { id: 'fight', label: 'Vow to fight on', desc: 'Tell the gaffer he’ll rip the shirt back off the kid', outcome: 'He refuses the role of elder statesman and swears he’ll start every week on merit. The manager can’t help but admire it.', effect: { attr: { aggression: 1, leadership: 1 }, meters: { authority: 6 }, form: 0.06 } },
          { id: 'terms', label: 'Ask for a fair exit', desc: 'Request a move where he’ll still be first name on the sheet', outcome: 'He asks, with dignity, to be let go somewhere he’ll play — no drama, no burnt bridges.', effect: { market: 2, meters: { agent: 8, fans: 4 }, earnings: 200 } },
        ],
      },
    },
  },
  {
    id: 'saga-loan-abroad', title: 'The Foreign Adventure', icon: '🌍', category: 'saga',
    minTurn: 95, maxTurn: 175, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Frozen out at home, he’s offered a season-long loan to a club in a very different league across the water — new language, new food, a style of play that would rewire everything he knows. It’s a gamble on himself in a place where nobody’s heard his name. Does he go?',
        choices: [
          { id: 'leap', label: 'Take the leap', desc: 'Pack a bag and reinvent himself in a foreign shirt', outcome: 'He signs the loan and lands in a city where his reputation counts for nothing. Terrifying, and exactly what he needed.', effect: { attr: { composure: 1, creativity: 1 }, meters: { family: -6, agent: 6 }, tag: 'abroad' }, next: 'settle' },
          { id: 'homebound', label: 'Stay and fight', desc: 'Refuse to run — win his place back on home soil', outcome: 'He turns the loan down flat and resolves to claw his way back into the manager’s plans instead.', effect: { attr: { aggression: 1 }, meters: { peers: 4 }, form: -0.03 } },
        ],
      },
      settle: {
        id: 'settle',
        prompt: 'Three months in, the football is going well but the loneliness is biting — a foreign dressing room can be a cold place when the jokes fly past in another tongue. A cluster of senior locals sizes him up. How does he win them over?',
        choices: [
          { id: 'immerse', label: 'Learn their world', desc: 'Butcher the language, embrace the culture, become one of them', outcome: 'He orders coffee in fractured phrases and laughs at himself until the room laughs with him. The walls come down.', effect: { attr: { teamwork: 2 }, meters: { peers: 14, sponsors: 4 }, form: 0.06 }, next: 'return' },
          { id: 'football', label: 'Let his feet speak', desc: 'Skip the small talk and simply be undeniable on the pitch', outcome: 'He answers every doubt with the ball at his feet; some things need no translation, and respect follows the goals.', effect: { form: 0.09, attr: { flair: 1, composure: 1 }, meters: { peers: 8, fans: 6 } }, next: 'return' },
        ],
      },
      return: {
        id: 'return',
        prompt: 'The loan ends with him a fan favourite abroad, and the foreign club table a permanent bid — while his parent club, watching from afar, suddenly remembers he exists. He holds two futures in his hands. Which does he grasp?',
        choices: [
          { id: 'stay-abroad', label: 'Make it permanent', desc: 'Build a life in the country that finally valued him', outcome: 'He signs for good and puts down roots in his adopted home. A new chapter, on his own terms.', effect: { attr: { composure: 1 }, meters: { fans: 12, family: 4 }, earnings: 400, market: 2 } },
          { id: 'go-back', label: 'Return transformed', desc: 'Go home a wiser, harder, more complete footballer', outcome: 'He flies back a different player, the foreign schooling burned into him, ready to prove they were wrong to let him leave.', effect: { attr: { creativity: 1, teamwork: 1 }, meters: { authority: 6, peers: 6 }, form: 0.07 } },
        ],
      },
    },
  },
  {
    id: 'saga-buyout-clause', title: 'The Clause', icon: '📜', category: 'saga',
    minTurn: 120, maxTurn: 190, weight: 2, first: 'open',
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
          { id: 'allin', label: 'Recommit completely', desc: 'Promise the manager his total focus, whatever the noise', outcome: 'He looks the boss dead in the eye and pledges everything to the cause. Words become deeds within a week.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { authority: 8, peers: 8 }, form: 0.06 } },
          { id: 'renegotiate', label: 'Use it as leverage', desc: 'Let his agent quietly renegotiate off the back of the drama', outcome: 'He parlays the interest into a fatter deal and a longer clause, banking the chaos as profit.', effect: { earnings: 600, greed: 2, market: 2, meters: { agent: 8, peers: -4 } } },
        ],
      },
    },
  },
  {
    id: 'saga-bench-fightback', title: 'Back from the Cold', icon: '🧊', category: 'saga',
    minTurn: 115, maxTurn: 190, weight: 2, first: 'open',
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
          { id: 'seize', label: 'Seize the moment', desc: 'Play like a man who may never get another minute', outcome: 'He detonates off the bench, turning the match on its head and reminding a full stadium exactly who he is.', effect: { form: 0.13, attr: { creativity: 1, composure: 1 }, meters: { fans: 20, authority: 8 } }, next: 'reclaim' },
          { id: 'steady', label: 'Do the ugly work', desc: 'Forget the highlights — just be flawless and reliable', outcome: 'No fireworks, just a shift so disciplined the manager can’t leave it out again. Trust, rebuilt in ninety minutes.', effect: { attr: { teamwork: 2, composure: 1 }, meters: { authority: 10, peers: 8 }, form: 0.07 }, next: 'reclaim' },
        ],
      },
      reclaim: {
        id: 'reclaim',
        prompt: 'He’s forced his way back into the starting eleven, but the manager makes it plain the shirt is a loan, not a gift — one bad run and he’s back in the cold. How does he pin the place down for good?',
        choices: [
          { id: 'lead', label: 'Become undroppable', desc: 'String together performances no manager could bench', outcome: 'He turns a lifeline into a stranglehold on the shirt, so consistent the debate simply ends.', effect: { attr: { leadership: 1, composure: 1 }, meters: { authority: 10, fans: 12 }, form: 0.06 } },
          { id: 'peace', label: 'Broker a truce', desc: 'Sit the manager down and clear the air man to man', outcome: 'He talks it out honestly, and the frost between them thaws into something like respect.', effect: { attr: { teamwork: 1 }, meters: { authority: 8, peers: 6 }, form: 0.04 } },
        ],
      },
    },
  },
];
