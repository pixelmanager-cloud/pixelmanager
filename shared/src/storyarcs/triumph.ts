import type { StoryArc } from '../storyarc.js';

// TRIUMPH arcs — the highs: finals, milestones, awards, first goals, personal glory.
export const TRIUMPH_ARCS: StoryArc[] = [
  {
    id: 'cup-final-day', title: 'The Final', icon: '🏆', category: 'triumph',
    minTurn: 46, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A cup final — the biggest day of his life so far. The night before, sleepless in the team hotel, the enormity of it pressing down. How does he steady himself?',
        choices: [
          { id: 'calm', label: 'Embrace the nerves', desc: 'Accept the fear, breathe, trust the work', outcome: 'He makes peace with it. By kickoff he’s ice — this is exactly where he wants to be.', effect: { attr: { composure: 1 }, meters: { authority: 4 }, tag: 'ready' }, next: 'moment' },
          { id: 'hype', label: 'Channel the fire', desc: 'Let the adrenaline build — go out snarling', outcome: 'He arrives at the ground bouncing off the walls, ready to run through one.', effect: { attr: { aggression: 1 }, form: 0.03, tag: 'fired' }, next: 'moment' },
        ],
      },
      moment: {
        id: 'moment',
        prompt: 'Extra time, still level, and the final swings on a single chance that falls to him at the back post. A nation watching. The keeper set. This is the moment careers are measured by.',
        choices: [
          { id: 'bury', label: 'Bury it', desc: 'First-time, no hesitation', outcome: 'He lashes it home and lifts the cup as the confetti falls. A day that outlives him.', effect: { form: 0.12, market: 4, attr: { composure: 1, aggression: 1 }, meters: { fans: 22, authority: 8 } } },
          { id: 'dink', label: 'Dink the keeper', desc: 'Audacity on the biggest stage', outcome: 'He chips it, impossibly cool, and the ball floats in. Some men are built for this.', effect: { form: 0.12, market: 4, attr: { flair: 2 }, meters: { fans: 20 } } },
        ],
      },
    },
  },
  {
    id: 'tri-promotion', title: 'Up We Go', icon: '🎉', category: 'triumph',
    minTurn: 46, maxTurn: 105, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A whole season of Tuesday nights in the rain, and it comes down to this: win today and the club goes up. The dressing room is a coiled spring. What does he tell the lads before they walk out?',
        choices: [
          { id: 'lead', label: 'Give the speech', desc: 'Stand up, look each man in the eye, demand it', outcome: 'His voice fills the room and grown men nod like schoolboys. They walk out believing.', effect: { attr: { leadership: 1 }, meters: { peers: 8, authority: 5 }, tag: 'voice' }, next: 'whistle' },
          { id: 'quiet', label: 'Let his boots talk', desc: 'Say nothing, lace up, lead by doing', outcome: 'He says not a word, only tightens his laces. The others read the calm and match it.', effect: { attr: { composure: 1 }, form: 0.04, tag: 'still' }, next: 'whistle' },
        ],
      },
      whistle: {
        id: 'whistle',
        prompt: 'Full time, and the pitch vanishes under a tide of supporters who waited years for this. Promotion is theirs. In the chaos, a touchline reporter shoves a microphone at him. What comes out?',
        choices: [
          { id: 'humble', label: 'Credit the club', desc: 'Point to the badge, the fans, the grind', outcome: 'He talks only of the tea ladies and the away-day faithful. The terraces adore him for it.', effect: { form: 0.08, meters: { fans: 18, authority: 6 }, attr: { teamwork: 1 } } },
          { id: 'hungry', label: 'Aim higher already', desc: 'Say this division was never the ceiling', outcome: 'Champagne in his hair, he vows this is only base camp. The chairman raises an eyebrow, and smiles.', effect: { form: 0.1, market: 3, meters: { sponsors: 8, fans: 10 }, attr: { aggression: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-player-of-year', title: 'Player of the Year', icon: '🌟', category: 'triumph',
    minTurn: 50, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The votes are counted and the whisper becomes fact: he has pipped {RIVAL} to the Player of the Year by a single ballot. A black-tie night, the great and the good watching, his name read aloud. How does he take the stage?',
        choices: [
          { id: 'gracious', label: 'Salute {RIVAL}', desc: 'Name his rival from the podium, mean it', outcome: 'He thanks {RIVAL} for dragging the best from him all year. The room warms; even his rival applauds.', effect: { attr: { leadership: 1 }, meters: { peers: 12, fans: 8 }, tag: 'class' }, next: 'after' },
          { id: 'relish', label: 'Savour every second', desc: 'Milk the ovation, let it wash over him', outcome: 'He lingers at the microphone, drinking it in, and the cameras love the glint in his eye.', effect: { form: 0.06, market: 3, meters: { sponsors: 10, fans: 10 }, tag: 'shine' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'By morning the trophy sits on his kitchen table and the phone will not stop. An agent from a glossier league is circling; his old coach texts only: "stay hungry, son." Which voice does he heed?',
        choices: [
          { id: 'stay', label: 'Keep the head down', desc: 'Bin the noise, back to the training pitch', outcome: 'He drives to the ground before dawn and runs the extra laps alone. Awards, he decides, are earned again each week.', effect: { form: 0.09, attr: { stamina: 1, composure: 1 }, meters: { authority: 6 } } },
          { id: 'cash', label: 'Cash the moment', desc: 'Let the agent chase the boot deals', outcome: 'The endorsements roll in and his face goes up on billboards. Comfortable, lucrative, and a touch distracting.', effect: { earnings: 5, market: 4, meters: { sponsors: 14, agent: 8 }, form: -0.03 } },
        ],
      },
    },
  },
  {
    id: 'tri-hundredth-goal', title: 'The Hundredth', icon: '💯', category: 'triumph',
    minTurn: 56, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ninety-nine career goals, and the whole ground knows it. Late on, the ball breaks to him six yards out with the net gaping — but a teammate on his weaker side has an even simpler tap-in. The hundredth, or the team?',
        choices: [
          { id: 'square', label: 'Square it', desc: 'Give the goal away, put the side first', outcome: 'He rolls it across for the easiest of finishes and wheels away grinning. The milestone can wait; the win cannot.', effect: { attr: { teamwork: 2 }, meters: { peers: 14, authority: 6 }, tag: 'selfless' }, next: 'reach' },
          { id: 'finish', label: 'Take it himself', desc: 'A hundred goals does not come twice', outcome: 'He buries it and the number goes up in lights. A record is a record, and this one is his.', effect: { form: 0.08, market: 2, attr: { aggression: 1 }, meters: { fans: 12 }, tag: 'greedy' } },
        ],
      },
      reach: {
        id: 'reach',
        prompt: 'The hundredth arrives a fortnight later, a scruffy poked finish that will look ugly forever in the highlight reels. Ugly or not, it is done. How does he mark the round number?',
        choices: [
          { id: 'family', label: 'Point to the stand', desc: 'Dedicate it to the folks who drove him everywhere', outcome: 'He sprints to where his family sit and presses the badge to his chest. Every early morning was for this.', effect: { form: 0.07, meters: { family: 16, fans: 8 }, attr: { composure: 1 } } },
          { id: 'crowd', label: 'Feed the frenzy', desc: 'Slide to the corner flag, arms wide', outcome: 'He whips off the shirt and lets the roar break over him, booking and all. Worth every yellow card.', effect: { form: 0.09, market: 2, meters: { fans: 16, sponsors: 6 }, attr: { flair: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-first-cap', title: 'The First Cap', icon: '🎽', category: 'triumph',
    minTurn: 46, maxTurn: 99, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A letter with the crest on it: he has been called up. His country, the senior side, at last. The night before his debut he sits alone with the shirt laid across the bed. What runs through him?',
        choices: [
          { id: 'pride', label: 'Ring home first', desc: 'Phone the family before anyone else knows', outcome: 'He calls his mother and hears her cry down the line. Whatever comes now, that moment is theirs forever.', effect: { attr: { composure: 1 }, meters: { family: 14, fans: 6 }, tag: 'grounded' }, next: 'anthem' },
          { id: 'focus', label: 'Study the opposition', desc: 'Turn nerves into preparation, watch the tapes', outcome: 'He fills a notebook with the winger he must stop, sleeping little and learning much.', effect: { attr: { teamwork: 1 }, form: 0.04, tag: 'primed' }, next: 'anthem' },
        ],
      },
      anthem: {
        id: 'anthem',
        prompt: 'Debut day. The anthem plays and a lump rises in his throat as the cameras pan the line. He gets forty minutes off the bench and does himself proud. Afterwards, how does he carry a full international?',
        choices: [
          { id: 'modest', label: 'Wear it lightly', desc: 'One cap is a start, not an arrival', outcome: 'He frames the shirt but tells reporters the real work begins now. The manager notes the maturity.', effect: { form: 0.08, attr: { composure: 1, leadership: 1 }, meters: { authority: 6, peers: 6 } } },
          { id: 'declare', label: 'Announce himself', desc: 'Tell the nation this is only cap one', outcome: 'He looks the cameras dead-on and promises fifty more. Bold, and the public eats it up.', effect: { form: 0.06, market: 3, meters: { fans: 14, sponsors: 8 }, attr: { aggression: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-captain-country', title: 'His Country’s Armband', icon: '🎖️', category: 'triumph',
    minTurn: 85, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The manager pulls him aside in the hotel corridor and hands him the armband. Captain of his country. The boy who was once too small, too slow, too something, will lead the anthem line. How does he shoulder it?',
        choices: [
          { id: 'servant', label: 'Lead by serving', desc: 'A captain carries the kit, not the ego', outcome: 'He tells the squad the armband changes nothing but his workload. They stand a little taller around him.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 14, authority: 8 }, tag: 'humble-cap' }, next: 'walkout' },
          { id: 'crown', label: 'Own the honour', desc: 'Let the nation see how much it means', outcome: 'He wears it like a crown, chest out for the cameras, and the country falls in behind him.', effect: { form: 0.06, market: 3, meters: { fans: 16, sponsors: 6 }, attr: { leadership: 1 }, tag: 'proud-cap' }, next: 'walkout' },
        ],
      },
      walkout: {
        id: 'walkout',
        prompt: 'He leads them out under a roaring stadium, mascot by the hand, the whole nation on its feet. At nil-nil a young debutant beside him is visibly shaking. What does the captain do?',
        choices: [
          { id: 'arm', label: 'Steady the kid', desc: 'An arm round the shoulder, a quiet word', outcome: 'He calms the youngster with a joke and a nod, and the boy plays the game of his life. That is what the armband is for.', effect: { form: 0.08, attr: { leadership: 1, composure: 1 }, meters: { peers: 12, authority: 6 } } },
          { id: 'drive', label: 'Drag them forward', desc: 'Demand more, roar the whole side up the pitch', outcome: 'He bellows and gestures and hauls the team by the scruff to a famous win. Fearsome, and effective.', effect: { form: 0.09, attr: { aggression: 1, leadership: 1 }, meters: { fans: 12, authority: 5 } } },
        ],
      },
    },
  },
  {
    id: 'tri-club-record', title: 'Into the Books', icon: '📖', category: 'triumph',
    minTurn: 62, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A name that has stood in the club record books for forty years is about to be erased — and replaced with his. One more appearance, or one more goal, and a legend of the old photographs is overtaken. How does he approach the milestone?',
        choices: [
          { id: 'respect', label: 'Honour the old great', desc: 'Seek out the record-holder before the match', outcome: 'He visits the ageing legend and asks his blessing. The old man grips his hand and passes the torch gladly.', effect: { attr: { leadership: 1, composure: 1 }, meters: { authority: 8, fans: 10 }, tag: 'torch' }, next: 'moment' },
          { id: 'chase', label: 'Hunt it down', desc: 'Fix on the number and go get it', outcome: 'He tells no one and lets his football do the talking, ticking closer with every clean strike.', effect: { form: 0.05, attr: { aggression: 1 }, meters: { peers: 6 }, tag: 'hunt' }, next: 'moment' },
        ],
      },
      moment: {
        id: 'moment',
        prompt: 'It falls on a grey afternoon in front of a half-full ground — no cup, no cameras, just the record quietly broken. The stadium announcer reads out the new number. How does the new record-holder respond?',
        choices: [
          { id: 'club', label: 'Give it to the club', desc: 'Tell them the record belongs to the shirt', outcome: 'He lifts the ball to the main stand and says the number is the club’s, not his. A one-club heart, and the terraces know it.', effect: { form: 0.08, meters: { fans: 16, authority: 8 }, attr: { teamwork: 1 } } },
          { id: 'legacy', label: 'Set the bar higher', desc: 'Vow to leave a mark no one can touch', outcome: 'He promises to push the record so far it outlives him too. Ambition carved into the honours board.', effect: { form: 0.07, market: 3, meters: { sponsors: 8, fans: 8 }, attr: { aggression: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-testimonial', title: 'The Testimonial', icon: '👏', category: 'triumph',
    minTurn: 99, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A decade and more in the same shirt, and the club grants him a testimonial — a whole evening in his honour, old teammates flying in, the ground selling out to say thank you. What does he want the night to be?',
        choices: [
          { id: 'charity', label: 'Give it all away', desc: 'Send every penny to the local hospital', outcome: 'He donates the entire gate to the children’s ward down the road. The city loves him more than ever, and rightly.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { fans: 18, authority: 6 }, tag: 'giver' }, next: 'lap' },
          { id: 'reunion', label: 'Make it a reunion', desc: 'Fill the pitch with every old friend', outcome: 'He gathers the whole cast of his career for one last kickabout, laughter echoing round the old ground.', effect: { form: 0.05, meters: { peers: 16, family: 8 }, attr: { composure: 1 }, tag: 'reunion' }, next: 'lap' },
        ],
      },
      lap: {
        id: 'lap',
        prompt: 'Late in the night he takes a lap of the pitch he has called home for so long, the crowd chanting the name they have sung a thousand Saturdays. His eyes sting. How does he close the evening?',
        choices: [
          { id: 'speech', label: 'Thank every soul', desc: 'Grab the mic, name the kitmen and the fans', outcome: 'He thanks the groundsman and the turnstile men by name, and the whole ground weeps with him.', effect: { form: 0.06, meters: { fans: 16, authority: 6 }, attr: { leadership: 1 } } },
          { id: 'kids', label: 'Bring the family on', desc: 'Walk the lap with his children beside him', outcome: 'He carries his youngest on his shoulders round the pitch, and the picture makes every back page.', effect: { form: 0.07, meters: { family: 16, fans: 8 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-silence-doubters', title: 'Silence the Doubters', icon: '🤫', category: 'triumph',
    minTurn: 47, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They wrote him off — the pundit who called him a waste of a wage, the forum that laughed, the coach who let him go. And here he is, man of the match against the very club that binned him, {RIVAL} watching from the other bench. How does the redemption feel?',
        choices: [
          { id: 'ice', label: 'Play it stone cold', desc: 'No celebration, just a long hard stare', outcome: 'He refuses to celebrate, only fixes {RIVAL} with a look that says everything words could not. Chilling.', effect: { attr: { composure: 1, aggression: 1 }, meters: { peers: 8, authority: 6 }, tag: 'cold' }, next: 'mic' },
          { id: 'roar', label: 'Roar it out', desc: 'Cup the ears at the away end, let it fly', outcome: 'He cups his ears at the doubters and roars until his throat is raw. Every doubt, screamed back at them.', effect: { form: 0.08, attr: { aggression: 1 }, meters: { fans: 14 }, tag: 'loud' }, next: 'mic' },
        ],
      },
      mic: {
        id: 'mic',
        prompt: 'The same pundit who buried him now wants a word on camera, all smiles, pretending the old words were never said. The microphone hovers. What does he give them?',
        choices: [
          { id: 'grace', label: 'Kill them with class', desc: 'Smile, thank the doubters for the fuel', outcome: 'He thanks his critics warmly for the motivation and walks off. Gracious, devastating, unanswerable.', effect: { form: 0.09, attr: { composure: 1, leadership: 1 }, meters: { authority: 8, fans: 10 } } },
          { id: 'receipts', label: 'Read the receipts', desc: 'Quote their own words back at them', outcome: 'He recites the old headline line by line, live on air, and lets the silence do the rest. The clip goes everywhere.', effect: { form: 0.07, market: 3, attr: { aggression: 1 }, meters: { fans: 14, sponsors: 4 } } },
        ],
      },
    },
  },
  {
    id: 'tri-league-title', title: 'Champions', icon: '🏆', category: 'triumph',
    minTurn: 56, maxTurn: 119, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The maths is done, the results are in from across the country, and the title is theirs with a game to spare. Champions. In the sweaty roar of the dressing room, someone shoves a phone in his face for the first words the world will hear. What does he say?',
        choices: [
          { id: 'earned', label: 'Point to the graft', desc: 'Name the winter nights and the aching mornings', outcome: 'He talks of the pre-season hills and the games nobody watched. A champion who never forgot the climb.', effect: { attr: { teamwork: 1, leadership: 1 }, meters: { peers: 12, authority: 8 }, tag: 'grafter' }, next: 'parade' },
          { id: 'kings', label: 'Declare them kings', desc: 'Let it rip — the best in the land, say it loud', outcome: 'He roars that nobody can touch them now, champagne stinging his eyes. The city believes every word.', effect: { form: 0.08, market: 3, meters: { fans: 16, sponsors: 6 }, tag: 'anointed' }, next: 'parade' },
        ],
      },
      parade: {
        id: 'parade',
        prompt: 'The open-top bus crawls through streets packed ten deep, a sea of scarves and smoke, the trophy passed from hand to hand above their heads. He has waited his whole life for this ride. How does he take it in?',
        choices: [
          { id: 'soak', label: 'Drink it all in', desc: 'Learn every face, remember it forever', outcome: 'He leans over the rail and shakes every hand he can reach, burning the day into memory. Some mornings never fade.', effect: { form: 0.1, meters: { fans: 18, authority: 6 }, attr: { composure: 1 } } },
          { id: 'again', label: 'Vow to defend it', desc: 'Tell the crowd one is never enough', outcome: 'Trophy aloft, he promises the parade will run again next May. The fans chant his name till they are hoarse.', effect: { form: 0.09, market: 4, attr: { aggression: 1 }, meters: { fans: 14, sponsors: 8 } } },
        ],
      },
    },
  },
  {
    id: 'tri-european-night', title: 'European Night', icon: '⭐', category: 'triumph',
    minTurn: 82, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A foreign stadium under a black sky, forty thousand of theirs against the world, and the biggest trophy the continent offers on a plinth by the tunnel. This is the night boys dream about on wet playgrounds. How does he walk out into it?',
        choices: [
          { id: 'still', label: 'Go quiet and cold', desc: 'Shut out the noise, become pure focus', outcome: 'He hears nothing but his own breath as the anthem swells. By kickoff he is a machine, all feeling locked away.', effect: { attr: { composure: 2 }, meters: { authority: 6 }, tag: 'euro-ice' }, next: 'lift' },
          { id: 'feel', label: 'Feel every inch of it', desc: 'Let the enormity in, ride the goosebumps', outcome: 'The hair on his arms stands up as the floodlights blaze. He lets it fill him and plays like a man possessed.', effect: { form: 0.06, attr: { flair: 1 }, meters: { fans: 10 }, tag: 'euro-fire' }, next: 'lift' },
        ],
      },
      lift: {
        id: 'lift',
        prompt: 'They have won it. The great cup is his to raise into a continental night, ribbons in the club colours, a whole generation of supporters sobbing in the stands. As the confetti cannons fire, what does he do first?',
        choices: [
          { id: 'team', label: 'Wait for the whole squad', desc: 'No one lifts it until the last sub is up', outcome: 'He refuses to touch it until every reserve and physio is on the podium. Then, together, they hoist it as one.', effect: { form: 0.1, attr: { teamwork: 1, leadership: 1 }, meters: { peers: 16, authority: 8 } } },
          { id: 'sky', label: 'Raise it to the heavens', desc: 'Lift it alone, roar it at the stars', outcome: 'He thrusts it skyward and screams into the night, a picture that hangs in the club museum for decades.', effect: { form: 0.12, market: 5, attr: { aggression: 1 }, meters: { fans: 18, sponsors: 8 } } },
        ],
      },
    },
  },
  {
    id: 'tri-team-of-season', title: 'Team of the Season', icon: '🏅', category: 'triumph',
    minTurn: 50, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The division names its eleven best of the campaign, voted by every manager and captain in the league, and his name is on the sheet among the household stars. Peer-picked, the truest kind of honour. How does he receive the news?',
        choices: [
          { id: 'peers', label: 'Treasure the peer vote', desc: 'It means most that rivals chose him', outcome: 'He tells the press it hits differently when the men who marked him all year put him there. Respect, earned the hard way.', effect: { attr: { teamwork: 1, composure: 1 }, meters: { peers: 14, authority: 6 }, tag: 'respected' }, next: 'shoot' },
          { id: 'proof', label: 'Call it proof', desc: 'Treat it as vindication of a long climb', outcome: 'He says quietly that a lad once released on a free is now in the league eleven. Let the doubters chew on that.', effect: { form: 0.06, market: 2, meters: { fans: 10, sponsors: 4 }, tag: 'vindicated' }, next: 'shoot' },
        ],
      },
      shoot: {
        id: 'shoot',
        prompt: 'They gather the chosen eleven for the glossy team photo, a row of the season\'s finest in pristine kit under studio lights. Standing shoulder to shoulder with names he grew up idolising, how does he carry himself?',
        choices: [
          { id: 'belong', label: 'Stand like he belongs', desc: 'Chin up, no awe, an equal among them', outcome: 'He shakes each hand as a peer, not a fan, and the veterans clock the quiet confidence. He is one of them now.', effect: { form: 0.08, attr: { leadership: 1 }, meters: { peers: 10, authority: 6 } } },
          { id: 'learn', label: 'Pick their brains', desc: 'Corner the veterans, soak up the wisdom', outcome: 'He spends the shoot mining the old pros for secrets, notebook of the mind filling fast. Hungry to be better still.', effect: { form: 0.07, attr: { composure: 1, teamwork: 1 }, meters: { peers: 12 } } },
        ],
      },
    },
  },
  {
    id: 'tri-golden-boot', title: 'The Golden Boot', icon: '👟', category: 'triumph',
    minTurn: 56, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The final day of the season, and the top-scorer race is a dead heat: him and {RIVAL}, level on goals, both playing at the same hour on opposite sides of the country. The Golden Boot goes to whoever nets one more. How does he play it?',
        choices: [
          { id: 'hunt', label: 'Hunt the goal', desc: 'Chase every scrap, gamble on the shoulder', outcome: 'He plays on the last defender\'s toes all afternoon and pounces twice. {RIVAL} blanks; the Boot is his alone.', effect: { form: 0.1, attr: { aggression: 1, flair: 1 }, meters: { fans: 14 }, tag: 'sharpshooter' }, next: 'boot' },
          { id: 'team', label: 'Play for the win', desc: 'Forget the tally, do the job the team needs', outcome: 'He drops deep, creates two and taps in a third almost by accident. The Boot lands his way, honestly earned.', effect: { form: 0.08, attr: { teamwork: 1, composure: 1 }, meters: { peers: 12, authority: 4 }, tag: 'complete' }, next: 'boot' },
        ],
      },
      boot: {
        id: 'boot',
        prompt: 'The golden trophy is presented on the pitch, a season of finishing distilled into one gleaming boot. His children run on to hold it, tiny hands around the prize. What does the moment mean to him?',
        choices: [
          { id: 'dedicate', label: 'Give it to the kids', desc: 'Press it into his children\'s hands for good', outcome: 'He tells them the Boot is theirs to keep, that every goal was for their faces in the stand. They beam; so does he.', effect: { form: 0.07, meters: { family: 16, fans: 8 }, attr: { composure: 1 } } },
          { id: 'more', label: 'Set it as a floor', desc: 'Declare this the first of many', outcome: 'Boot held high, he vows to make it a habit, not a highlight. The strikers of the league take note, and worry.', effect: { form: 0.09, market: 4, attr: { aggression: 1 }, meters: { fans: 12, sponsors: 6 } } },
        ],
      },
    },
  },
  {
    id: 'tri-domestic-cup', title: 'The Underdog Cup', icon: '🥇', category: 'triumph',
    minTurn: 46, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A cup run nobody predicted — a small club, replay after replay, giant after giant slain, and now the final itself against the moneyed favourites. The whole neutral nation is behind the little side. How does he treat the fairytale?',
        choices: [
          { id: 'believe', label: 'Preach belief', desc: 'Tell the lads the story is theirs to write', outcome: 'He gathers the youngsters and swears fairytales are won, not wished for. They walk out with fire in their boots.', effect: { attr: { leadership: 2 }, meters: { peers: 12, authority: 6 }, tag: 'believer' }, next: 'giant' },
          { id: 'loose', label: 'Play with freedom', desc: 'No pressure, no fear, just express it', outcome: 'He tells them nobody expected this, so swing free and enjoy it. The looseness turns them lethal.', effect: { form: 0.06, attr: { flair: 1, composure: 1 }, meters: { peers: 8 }, tag: 'fearless' }, next: 'giant' },
        ],
      },
      giant: {
        id: 'giant',
        prompt: 'They have done it — the minnows have toppled the giants and the cup is going to a town that has never won a thing. Grown men who stood on that terrace as boys are weeping. How does he mark a triumph this improbable?',
        choices: [
          { id: 'town', label: 'Give it to the town', desc: 'Lift it toward the away end and the whole place', outcome: 'He carries the cup to the corner where his hometown crammed in and holds it there until his arms shake. Theirs forever.', effect: { form: 0.1, meters: { fans: 18, authority: 6 }, attr: { teamwork: 1 } } },
          { id: 'proof', label: 'Call it a warning', desc: 'Tell the big clubs the little ones are coming', outcome: 'He grins down the camera and says the giants should sleep lighter now. Cheeky, defiant, and the underdogs love it.', effect: { form: 0.08, market: 3, attr: { aggression: 1 }, meters: { fans: 14, sponsors: 4 } } },
        ],
      },
    },
  },
  {
    id: 'tri-first-senior-goal', title: 'The First One', icon: '⚽', category: 'triumph',
    minTurn: 46, maxTurn: 72, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His first senior goal. A scrappy thing bundled in off his shin in front of a half-empty stand on a cold afternoon — but it is his, the first of a career, and the net will never bulge like this again. How does the boy react?',
        choices: [
          { id: 'run', label: 'Run to the family', desc: 'Sprint straight to where they always sit', outcome: 'He tears off toward the little cluster who drove him to every trial and points until they see him. All of it, for that look on their faces.', effect: { attr: { composure: 1 }, meters: { family: 14, fans: 6 }, tag: 'first-goal' }, next: 'after' },
          { id: 'roar', label: 'Roar it out', desc: 'Slide on the knees, let the relief explode', outcome: 'He slides across the wet turf screaming, months of doubt pouring out at once. The bench mobs him grinning.', effect: { form: 0.06, attr: { aggression: 1 }, meters: { peers: 8 }, tag: 'first-goal' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'In the dressing room afterwards the match ball sits in his lap, teammates\' signatures scrawled across it in marker. A veteran leans over and asks, half-joking, what he means to do with the rest of his career. What does the youngster say?',
        choices: [
          { id: 'hundreds', label: 'Promise hundreds more', desc: 'Look him dead-on, mean every word', outcome: 'He says this is goal one of hundreds and does not blink. The old pro nods slowly; he has seen that look before, in the good ones.', effect: { form: 0.08, attr: { aggression: 1, composure: 1 }, meters: { peers: 8, authority: 4 } } },
          { id: 'humble', label: 'Just savour today', desc: 'Refuse to look past this one moment', outcome: 'He says he only wants to enjoy tonight and worry about tomorrow tomorrow. Wise beyond the years, and the room warms to him.', effect: { form: 0.06, attr: { composure: 1, teamwork: 1 }, meters: { peers: 10, family: 6 } } },
        ],
      },
    },
  },
  {
    id: 'tri-first-eleven', title: 'The First XI', icon: '🧢', category: 'triumph',
    minTurn: 53, maxTurn: 107, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'For years he has been the impact sub, the squad man, the one who watches the big nights from the bench. Now the manager reads the international team sheet and his name is in it — the starting eleven, a competitive fixture, at last. How does he process it?',
        choices: [
          { id: 'earned', label: 'Own the promotion', desc: 'Tell himself the wait made him ready', outcome: 'He decides the long apprenticeship was the making of him and strides into the XI like he has always belonged. No stage fright now.', effect: { attr: { composure: 1, leadership: 1 }, meters: { authority: 6, peers: 8 }, tag: 'starter' }, next: 'perform' },
          { id: 'prove', label: 'Treat it as a trial', desc: 'One start is nothing without a performance', outcome: 'He refuses to celebrate a place he might lose, pouring the nerves into preparation. The shirt will have to be prised off him.', effect: { form: 0.05, attr: { stamina: 1 }, meters: { authority: 4 }, tag: 'hungry-start' }, next: 'perform' },
        ],
      },
      perform: {
        id: 'perform',
        prompt: 'Ninety minutes of his first international start, and he was the best man on the pitch — assured, tireless, undroppable. The manager singles him out in the press room. How does he handle becoming a fixture in the side?',
        choices: [
          { id: 'quiet', label: 'Let it settle quietly', desc: 'No fuss, back to the training ground', outcome: 'He nods at the praise and says only that he intends to keep the shirt. The manager likes a man who wants it that badly.', effect: { form: 0.08, attr: { composure: 1, teamwork: 1 }, meters: { authority: 8, peers: 6 } } },
          { id: 'ambition', label: 'Aim for the armband', desc: 'Say out loud he wants to lead one day', outcome: 'He tells the room this is a start, and one day he means to captain the side. Bold, and the country marks the ambition.', effect: { form: 0.06, market: 3, attr: { leadership: 1 }, meters: { fans: 10, sponsors: 4 } } },
        ],
      },
    },
  },
  {
    id: 'tri-tournament-final', title: 'The Summer Final', icon: '🌍', category: 'triumph',
    minTurn: 62, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A whole summer of tournament football, a nation daring to dream, and now the unthinkable — his country has reached the final of a major championship, one game from immortality. The night before, the squad is wired to snapping. What does he bring to the room?',
        choices: [
          { id: 'calm', label: 'Be the still centre', desc: 'Lower the temperature, spread the calm', outcome: 'He moves quietly among the young lads, cracking small jokes, bleeding the tension out of the air. By morning the camp breathes easy.', effect: { attr: { composure: 2, leadership: 1 }, meters: { peers: 14, authority: 6 }, tag: 'anchor' }, next: 'final' },
          { id: 'rally', label: 'Light the fire', desc: 'Remind them what one night can make them', outcome: 'He tells them that men become legends on nights like tomorrow, and eyes around the room start to blaze. Ready to run through walls.', effect: { form: 0.06, attr: { aggression: 1, leadership: 1 }, meters: { peers: 10, fans: 8 }, tag: 'igniter' }, next: 'final' },
        ],
      },
      final: {
        id: 'final',
        prompt: 'The final itself, a nation holding its breath, and it comes down to the finest margins deep into the night. When the last whistle blows, his country are champions of the continent for the first time in living memory. How does the moment take him?',
        choices: [
          { id: 'knees', label: 'Fall to the turf', desc: 'Drop to his knees, let it all pour out', outcome: 'He collapses to the grass and weeps openly, a career and a childhood and a whole nation crashing over him at once. Unforgettable.', effect: { form: 0.12, meters: { fans: 20, family: 8 }, attr: { composure: 1 } } },
          { id: 'anthem', label: 'Lead the anthem', desc: 'Turn to the fans and start them singing', outcome: 'He faces the wall of his own supporters and conducts the anthem with the medal round his neck. A moment replayed for generations.', effect: { form: 0.11, market: 5, attr: { leadership: 1 }, meters: { fans: 22, sponsors: 8 } } },
        ],
      },
    },
  },
  {
    id: 'tri-leader-award', title: 'Leader of the League', icon: '📣', category: 'triumph',
    minTurn: 90, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A season of dragging an unfancied side up the table by sheer force of will, and the league honours it with an award rarely given to a player: recognition for leadership, the captain who set the standard for every dressing room in the division. How does he wear the acclaim?',
        choices: [
          { id: 'share', label: 'Push it to the squad', desc: 'Insist leadership is a group of men, not one', outcome: 'He says a captain is only as good as the lads who follow, and lists a dozen unsung names. The armband, worn exactly right.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 16, authority: 8 }, tag: 'true-captain' }, next: 'legacy' },
          { id: 'accept', label: 'Accept it proudly', desc: 'Take the credit for standards he set', outcome: 'He accepts that he set the tone daily and drove them further than the table said they belonged. Quiet, deserved pride.', effect: { form: 0.07, market: 2, attr: { leadership: 1 }, meters: { authority: 8, fans: 8 }, tag: 'standard-setter' }, next: 'legacy' },
        ],
      },
      legacy: {
        id: 'legacy',
        prompt: 'A young apprentice, wide-eyed, asks him afterwards what leadership actually is — how a man learns to carry others. It is the question of his career. What does the captain tell the boy?',
        choices: [
          { id: 'example', label: 'It is example', desc: 'Tell him to be first in, last out, always', outcome: 'He says leadership is being the hardest worker in the room when nobody is watching. The boy writes it on his heart.', effect: { form: 0.08, attr: { leadership: 1, stamina: 1 }, meters: { peers: 10, authority: 6 } } },
          { id: 'listen', label: 'It is listening', desc: 'Tell him a captain hears before he speaks', outcome: 'He says the loudest voice leads nobody; you learn each man and lift him his own way. Wisdom the youngster will carry for years.', effect: { form: 0.07, attr: { leadership: 1, teamwork: 1 }, meters: { peers: 12, authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'tri-appearance-milestone', title: 'Five Hundred', icon: '🔢', category: 'triumph',
    minTurn: 93, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Five hundred appearances in the same shirt — a number few reach at any club, a testament not to genius but to loyalty, durability, and love. The club marks the milestone before kickoff, the whole ground rising as the number flashes up. What runs through him?',
        choices: [
          { id: 'loyal', label: 'Cherish the one badge', desc: 'Reflect on a lifetime given to one club', outcome: 'He thinks of the offers turned down and does not regret one, pressing the crest to his lips as the stadium roars. Home is home.', effect: { attr: { teamwork: 1, composure: 1 }, meters: { fans: 16, authority: 8 }, tag: 'one-club' }, next: 'walk' },
          { id: 'body', label: 'Salute his own body', desc: 'Marvel quietly at every mile in the legs', outcome: 'He thinks of the ice baths and the physios and the mornings he could barely walk. Five hundred games; every one paid for in sweat.', effect: { form: 0.05, attr: { stamina: 2 }, meters: { peers: 8 }, tag: 'ironman' }, next: 'walk' },
        ],
      },
      walk: {
        id: 'walk',
        prompt: 'They present him a golden shirt with the number stitched on the back, and ask him to say a word to the packed stands who have watched him grow from a nervous teenager into a club institution. What does he give the faithful?',
        choices: [
          { id: 'thanks', label: 'Thank the terraces', desc: 'Tell them they made every game worth it', outcome: 'He says the number belongs to the men and women who never missed a Saturday, and the ground sings his name till the walls shake.', effect: { form: 0.08, meters: { fans: 18, authority: 6 }, attr: { leadership: 1 } } },
          { id: 'more', label: 'Promise a few more', desc: 'Grin and say the legs have games left', outcome: 'He winks and swears there are more Saturdays in him yet. The old ground laughs and adores him all the more.', effect: { form: 0.07, attr: { stamina: 1, composure: 1 }, meters: { fans: 14, family: 6 } } },
        ],
      },
    },
  },
  {
    id: 'tri-comeback-poty', title: 'Back from the Dark', icon: '🌅', category: 'triumph',
    minTurn: 62, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A year ago the surgeons told him he might not play again. Now he stands at the awards night, the season\'s finest, holding the Player of the Year after the finest campaign of his life. The comeback nobody believed in is complete. How does he take the podium?',
        choices: [
          { id: 'thank', label: 'Thank the ones who rebuilt him', desc: 'Name the physios and the dark mornings', outcome: 'He reads out the names of the medics and rehab staff who dragged him back from nothing. Not a dry eye among them.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { peers: 12, authority: 6 }, tag: 'reborn' }, next: 'lesson' },
          { id: 'defiant', label: 'Answer the doubters', desc: 'Remind the room he was written off', outcome: 'He holds the trophy up and says softly that he read every obituary of his career — and here he is. The room erupts.', effect: { form: 0.07, market: 3, attr: { aggression: 1 }, meters: { fans: 14, sponsors: 4 }, tag: 'defiant-return' }, next: 'lesson' },
        ],
      },
      lesson: {
        id: 'lesson',
        prompt: 'A reporter asks the obvious question: does the game feel different now, having nearly lost it? He turns the trophy slowly in his hands before answering. What has the dark year taught him?',
        choices: [
          { id: 'grateful', label: 'Play with gratitude now', desc: 'Say every match is a gift he nearly lost', outcome: 'He says he will never take another ninety minutes for granted, and means it to his bones. A player remade, richer for the loss.', effect: { form: 0.09, attr: { composure: 2 }, meters: { authority: 6, fans: 10 } } },
          { id: 'fierce', label: 'Play hungrier than ever', desc: 'Say the dark year sharpened him', outcome: 'He says nearly losing it lit a fire that will not go out; he means to make up every stolen month. Ferocious, and fearsome.', effect: { form: 0.08, attr: { aggression: 1, stamina: 1 }, meters: { peers: 8, fans: 8 } } },
        ],
      },
    },
  },
  {
    id: 'tri-homecoming', title: 'Hometown Hero', icon: '🏙️', category: 'triumph',
    minTurn: 59, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The town he grew up in — the estate, the cracked pitches, the school that never had much — throws open its doors to honour its most famous son with a civic reception, the mayor, the old teachers, a plaque on the wall of his first club. How does he come home?',
        choices: [
          { id: 'roots', label: 'Come home as one of them', desc: 'Walk the old streets, no entourage', outcome: 'He arrives on foot with no security, knocking on doors he knew as a boy. The town clasps him back as its own.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { fans: 16, family: 10 }, tag: 'humble-hero' }, next: 'give' },
          { id: 'pride', label: 'Wear it with pride', desc: 'Let the town celebrate loud and proud', outcome: 'He lets them line the streets and cheer, and stands on the town-hall steps beaming. A local legend, and glad to be one.', effect: { form: 0.06, market: 2, meters: { fans: 16, sponsors: 4 }, tag: 'local-legend' }, next: 'give' },
        ],
      },
      give: {
        id: 'give',
        prompt: 'At the reception a nervous boy from his old estate, no boots to his name, asks shyly if the dream is really possible for someone like them. The whole hall goes quiet, waiting. What does the hometown hero do?',
        choices: [
          { id: 'fund', label: 'Fund the next generation', desc: 'Pledge to rebuild the pitches he grew up on', outcome: 'He promises new pitches, boots and coaching for every kid on the estate, and signs it there and then. The town will never forget.', effect: { form: 0.08, earnings: -3, meters: { fans: 18, authority: 6 }, attr: { leadership: 1 } } },
          { id: 'mentor', label: 'Take the boy under his wing', desc: 'Hand him his own boots, promise to watch him', outcome: 'He unlaces his boots on the spot and gives them to the boy, vowing to follow his progress himself. A moment the child will chase forever.', effect: { form: 0.07, meters: { fans: 14, family: 8 }, attr: { leadership: 1, teamwork: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-fans-player', title: 'The People\'s Choice', icon: '💙', category: 'triumph',
    minTurn: 50, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Not the pundits, not the managers — the supporters themselves have voted him their Player of the Year, tens of thousands of ballots from the very people who pay at the turnstile. Of all the trophies, this is the one from the heart. How does he receive it?',
        choices: [
          { id: 'them', label: 'Say it is theirs', desc: 'Insist the fans win it, not him', outcome: 'He tells the ground the award belongs to the men and women who sing through the rain, and lifts it toward the Kop. They roar back as one.', effect: { attr: { teamwork: 1, composure: 1 }, meters: { fans: 18, authority: 6 }, tag: 'terrace-favourite' }, next: 'bond' },
          { id: 'humbled', label: 'Admit it moves him', desc: 'Let the crowd see it means the most', outcome: 'He confesses this trophy hit harder than any other, voice cracking as he thanks them. The bond, sealed for life.', effect: { form: 0.07, meters: { fans: 16, sponsors: 4 }, attr: { composure: 1 }, tag: 'beloved' }, next: 'bond' },
        ],
      },
      bond: {
        id: 'bond',
        prompt: 'After the presentation the supporters wait by the players\' gate in the cold, hundreds of them, scarves and shirts held out for a signature. He is exhausted and the team bus is idling. What does he do?',
        choices: [
          { id: 'stay', label: 'Stay till the last one', desc: 'Sign and photograph every last supporter', outcome: 'He tells the bus to wait and works down the whole line in the dark, signing every scrap. The fans who chose him love him twice over.', effect: { form: 0.08, meters: { fans: 18, sponsors: 4 }, attr: { teamwork: 1 } } },
          { id: 'shirt', label: 'Give away the shirt', desc: 'Hand his match shirt to a young supporter', outcome: 'He peels off the shirt he won it in and drapes it over a shivering kid at the front. The photograph makes every local paper.', effect: { form: 0.07, market: 2, meters: { fans: 16, family: 4 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-first-trophy', title: 'First Silver', icon: '🥈', category: 'triumph',
    minTurn: 56, maxTurn: 119, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club has existed for over a century and never once won a thing — a proud, unlucky old side whose cabinet has always stood empty. And now, as captain, he is ninety minutes from changing that forever. What does he tell them before they walk out to make history?',
        choices: [
          { id: 'history', label: 'Invoke the ghosts', desc: 'Play for every fan who never saw silver', outcome: 'He speaks of the grandfathers who died waiting and the boys they can make immortal today. The room walks out on fire.', effect: { attr: { leadership: 2 }, meters: { peers: 12, fans: 8 }, tag: 'history-maker' }, next: 'lift' },
          { id: 'calm', label: 'Keep them calm', desc: 'Strip the weight of a century away', outcome: 'He tells them to forget the hundred barren years and just play the game in front of them. The pressure drains from the room.', effect: { form: 0.06, attr: { composure: 1, teamwork: 1 }, meters: { peers: 10 }, tag: 'unburdened' }, next: 'lift' },
        ],
      },
      lift: {
        id: 'lift',
        prompt: 'They have won it. As captain, he is the first man in the club\'s entire history to lift a trophy, an old and long-suffering support delirious in the stands, some of them grey and weeping. How does he mark a moment a hundred years in the making?',
        choices: [
          { id: 'elders', label: 'Call up the old fans', desc: 'Bring the oldest supporters onto the pitch', outcome: 'He waves the club\'s most ancient season-ticket holders down to lift it with him. They touch the silver with shaking hands and sob. Perfect.', effect: { form: 0.11, meters: { fans: 20, authority: 8 }, attr: { leadership: 1 } } },
          { id: 'first', label: 'Vow it is the first', desc: 'Promise the empty cabinet fills from here', outcome: 'He lifts it and roars that the drought ends tonight and never returns. A captain who just rewrote a century, and means to write more.', effect: { form: 0.1, market: 4, attr: { aggression: 1, leadership: 1 }, meters: { fans: 16, sponsors: 6 } } },
        ],
      },
    },
  },
  {
    id: 'tri-season-record', title: 'The Record Haul', icon: '📈', category: 'triumph',
    minTurn: 53, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One more goal and he breaks his own personal best for a single season — the most he has ever scored in a campaign, a private summit no one else measures but him. It has been the quiet obsession of the whole year. How does he chase the last one?',
        choices: [
          { id: 'patient', label: 'Trust it will come', desc: 'Keep doing the right things, no forcing', outcome: 'He resists snatching at chances and lets the goal find him — a clean, calm finish that tops the tally. Patience, rewarded.', effect: { attr: { composure: 2 }, meters: { peers: 6, authority: 4 }, tag: 'clinical' }, next: 'mark' },
          { id: 'greedy', label: 'Go for the throat', desc: 'Shoot on sight, chase the number down', outcome: 'He hunts it obsessively, shooting from everywhere, and finally smashes one in off the bar. The record is his, greedily taken.', effect: { form: 0.07, attr: { aggression: 1, flair: 1 }, meters: { fans: 10 }, tag: 'ruthless' }, next: 'mark' },
        ],
      },
      mark: {
        id: 'mark',
        prompt: 'The record season is in the books — more goals than he has ever managed, more than he perhaps thought himself capable of. As the campaign closes, a reporter asks whether he has finally found his ceiling. How does he answer?',
        choices: [
          { id: 'higher', label: 'Deny the ceiling', desc: 'Insist next year the number climbs again', outcome: 'He shakes his head and says this is a floor to build on, not a peak to admire. The league\'s defenders read it and shudder.', effect: { form: 0.09, market: 3, attr: { aggression: 1 }, meters: { fans: 12, sponsors: 6 } } },
          { id: 'grateful', label: 'Credit the team', desc: 'Say every goal was built by others', outcome: 'He lists the creators and the grafters who fed him all year, insisting the record is theirs as much as his. Class, quietly shown.', effect: { form: 0.08, attr: { teamwork: 1, composure: 1 }, meters: { peers: 14, authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'tri-world-crown', title: 'On Top of the World', icon: '🌐', category: 'triumph',
    minTurn: 85, maxTurn: 119, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The World Cup final, the whole planet watching, and after a summer that will never come again his country are champions of the world. There is no bigger stage than the one he has just conquered. As the ticker tape falls, what fills him first?',
        choices: [
          { id: 'disbelief', label: 'Let it sink in slowly', desc: 'Stand still and try to believe it is real', outcome: 'He stands rooted amid the bedlam, staring at the sky, unable to make the enormity feel true. The greatest moment of his life, and he wants it to last.', effect: { attr: { composure: 1 }, meters: { fans: 20, family: 8 }, tag: 'world-champ' }, next: 'trophy' },
          { id: 'nation', label: 'Turn to the travelling fans', desc: 'Sprint to the supporters who crossed the world', outcome: 'He tears straight to the wall of his own people, arms flung wide, and roars with them until nothing is left. This crown is theirs too.', effect: { form: 0.08, attr: { leadership: 1 }, meters: { fans: 22, sponsors: 6 }, tag: 'world-champ' }, next: 'trophy' },
        ],
      },
      trophy: {
        id: 'trophy',
        prompt: 'The golden trophy comes down the line of medalled men, and now it is in his hands, heavier and more real than any dream of it. A lifetime of Sundays on frozen parks led here. How does he hold the moment?',
        choices: [
          { id: 'kiss', label: 'Kiss it and pass it on', desc: 'Honour the badge, then share it round', outcome: 'He presses his lips to the gold, lifts it once to the heavens, then hands it straight to the youngest debutant. A champion of the world, and still a servant of the team.', effect: { form: 0.12, attr: { teamwork: 1, leadership: 1 }, meters: { peers: 16, authority: 8 } } },
          { id: 'immortal', label: 'Raise it for the ages', desc: 'Lift it alone and roar it into history', outcome: 'He thrusts it skyward and bellows until his voice cracks, the image beamed into a billion homes. A photograph that will outlive everyone in the stadium.', effect: { form: 0.14, market: 6, attr: { aggression: 1 }, meters: { fans: 24, sponsors: 10 } } },
        ],
      },
    },
  },
  {
    id: 'tri-treble', title: 'The Clean Sweep', icon: '🧹', category: 'triumph',
    minTurn: 82, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'League, cup and the big one — three trophies in a single season, a treble that only a handful of sides in history have ever managed. The last of the three is secured, and the achievement is almost too large to hold. How does he frame a campaign like no other?',
        choices: [
          { id: 'sacrifice', label: 'Name the price paid', desc: 'Speak of the games no body should survive', outcome: 'He talks of the sixty matches, the ice baths and the weddings missed, and says a treble is bought in flesh. The dressing room nods, drained and immortal.', effect: { attr: { stamina: 1, teamwork: 1 }, meters: { peers: 14, authority: 8 }, tag: 'treble-winner' }, next: 'legacy' },
          { id: 'history', label: 'Claim the place in history', desc: 'Say it plainly — few ever do this', outcome: 'He looks down the cameras and says only a handful of teams ever complete the sweep, and now theirs is one. Not arrogance; simple, staggering fact.', effect: { form: 0.09, market: 4, meters: { fans: 16, sponsors: 8 }, tag: 'treble-winner' }, next: 'legacy' },
        ],
      },
      legacy: {
        id: 'legacy',
        prompt: 'Three trophies gleam on the table before the exhausted, jubilant squad, and someone asks the question that always follows a mountain conquered: where does a team possibly go from here? How does he answer for them all?',
        choices: [
          { id: 'savour', label: 'Refuse to look past it', desc: 'Insist on savouring a feat this rare', outcome: 'He says a night like this must be lived, not spent already planning the next, and orders the champagne opened. Some peaks are for standing on a while.', effect: { form: 0.08, attr: { composure: 1 }, meters: { peers: 12, fans: 8 } } },
          { id: 'quadruple', label: 'Point even higher', desc: 'Wonder aloud what a fourth would feel like', outcome: 'He grins and asks why a team that took three could not chase everything going. The manager laughs, but the fire in the room does not dim.', effect: { form: 0.1, market: 4, attr: { aggression: 1 }, meters: { fans: 12, sponsors: 6 } } },
        ],
      },
    },
  },
  {
    id: 'tri-final-motm', title: 'Man of the Match', icon: '🎬', category: 'triumph',
    minTurn: 56, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The showpiece final is won, and when they read out the man of the match it is his name that echoes round the great stadium — the best player on the grandest day, chosen above every star on the pitch, {RIVAL} among them. How does he wear the individual honour?',
        choices: [
          { id: 'deflect', label: 'Hand it to the team', desc: 'Insist eleven men earned this, not one', outcome: 'He accepts the small trophy and immediately names the defender who ran himself into the ground, saying the award should be cut in pieces. Class on the biggest stage.', effect: { attr: { teamwork: 1, composure: 1 }, meters: { peers: 12, authority: 6 }, tag: 'final-motm' }, next: 'stage' },
          { id: 'own', label: 'Own the performance', desc: 'Accept that today he was simply the best', outcome: 'He allows himself a rare admission that on the day that mattered most, he delivered — and glances, just once, toward {RIVAL}. Quiet, earned pride.', effect: { form: 0.09, market: 3, attr: { flair: 1 }, meters: { fans: 14, sponsors: 6 }, tag: 'final-motm' }, next: 'stage' },
        ],
      },
      stage: {
        id: 'stage',
        prompt: 'The cameras swarm him afterwards, the pundits already calling it the defining performance of the final, the clip looping on every screen. This is the biggest platform his career has offered. What does he do with the microphone?',
        choices: [
          { id: 'gracious', label: 'Praise the beaten', desc: 'Salute the opponents who pushed them all the way', outcome: 'He spends his airtime honouring the side they defeated, saying finals need two great teams. The neutral watching warms to him at once.', effect: { form: 0.08, attr: { leadership: 1, composure: 1 }, meters: { authority: 8, fans: 10 } } },
          { id: 'promise', label: 'Promise the next one', desc: 'Tell the world this is a habit, not a one-off', outcome: 'He looks into the lens and vows the next final will end the same way. Bold, box-office, and the sponsors are already circling.', effect: { form: 0.07, market: 4, attr: { aggression: 1 }, meters: { fans: 12, sponsors: 10 } } },
        ],
      },
    },
  },
  {
    id: 'tri-hat-trick', title: 'Three, and the Ball Under His Arm', icon: '🎩', category: 'triumph',
    minTurn: 54, maxTurn: 105, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two goals to his name already, and now a third chance falls at his feet — the first hat-trick of his career one clean strike away, the crowd on their feet begging for it. The keeper stands between him and the match ball he will keep forever. How does he take it on?',
        choices: [
          { id: 'cool', label: 'Pick his spot', desc: 'Slow the heartbeat, place it with precision', outcome: 'He takes a breath the whole ground can feel, then rolls it calmly inside the far post. His first hat-trick, sealed with ice in the veins.', effect: { attr: { composure: 2 }, meters: { fans: 12, peers: 6 }, tag: 'hat-trick' }, next: 'ball' },
          { id: 'venom', label: 'Smash it home', desc: 'No holding back — leather it into the roof', outcome: 'He throws everything into it and the net nearly rips from the frame. Three goals, and the loudest roar of his young life crashing over him.', effect: { form: 0.08, attr: { aggression: 1, flair: 1 }, meters: { fans: 14 }, tag: 'hat-trick' }, next: 'ball' },
        ],
      },
      ball: {
        id: 'ball',
        prompt: 'The referee tucks the match ball under his arm and hands it over at the whistle, teammates queueing to sign it. His first hat-trick ball, a keepsake for a lifetime. What does he do with the treasure?',
        choices: [
          { id: 'home', label: 'Take it to his family', desc: 'Carry it straight to the people who believed', outcome: 'He drives it home that night and sets it on the mantelpiece beside old boyhood trophies. The ones who ferried him to training get the first look.', effect: { form: 0.07, attr: { composure: 1 }, meters: { family: 14, fans: 6 } } },
          { id: 'giveaway', label: 'Toss it to the terrace', desc: 'Fling the ball into the delirious stand', outcome: 'On impulse he hurls it into the arms of the singing supporters, deciding the memory is enough. The gesture makes him theirs for good.', effect: { form: 0.06, market: 2, attr: { flair: 1 }, meters: { fans: 14, sponsors: 4 } } },
        ],
      },
    },
  },
  {
    id: 'tri-invincibles', title: 'Unbeaten', icon: '🛡️', category: 'triumph',
    minTurn: 62, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The final whistle of the final match, and the record stands unblemished: a whole season played, not a single game lost. Invincible. Only a rare few sides in the game\'s long history have ever gone a campaign untouched. How does he grasp what they have built?',
        choices: [
          { id: 'perfection', label: 'Marvel at the standard', desc: 'Reflect on a discipline sustained for a year', outcome: 'He speaks of the concentration it takes to never once slip in ten long months, and says the achievement is about relentlessness, not flair. Awe, quietly earned.', effect: { attr: { composure: 1, stamina: 1 }, meters: { peers: 14, authority: 8 }, tag: 'invincible' }, next: 'record' },
          { id: 'defiant', label: 'Throw it at the doubters', desc: 'Remind everyone they were written off in August', outcome: 'He recalls the pundits who tipped them for mid-table and asks how the unbeaten side looks now. Defiant, and the terraces roar their agreement.', effect: { form: 0.09, attr: { aggression: 1 }, meters: { fans: 16, sponsors: 4 }, tag: 'invincible' }, next: 'record' },
        ],
      },
      record: {
        id: 'record',
        prompt: 'The pundits are already asking whether the unbeaten run can stretch into next season, whether the invincibles can become something without end. He knows how fragile perfection is. What does he say about carrying the streak on?',
        choices: [
          { id: 'guard', label: 'Vow to protect it', desc: 'Treat every future game as a record to defend', outcome: 'He says the streak is a thing to be guarded with their lives now, and swears they will fight for every point. The steel in his voice is unmistakable.', effect: { form: 0.08, attr: { leadership: 1, composure: 1 }, meters: { authority: 6, peers: 10 } } },
          { id: 'humble', label: 'Refuse to jinx it', desc: 'Play down the streak, keep feet on the floor', outcome: 'He laughs off the questions and says one unbeaten season is a gift you never demand twice. Wise, and the dressing room stays hungry rather than smug.', effect: { form: 0.07, attr: { teamwork: 1 }, meters: { peers: 12, fans: 6 } } },
        ],
      },
    },
  },
  {
    id: 'tri-knighthood', title: 'The Honour', icon: '🎗', category: 'triumph',
    minTurn: 105, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A letter arrives bearing a crest more ancient than any club\'s: the nation wishes to honour him formally for his services to the game, a distinction reserved for the very few. The boy from nowhere is to be recognised by the country itself. How does he receive the news?',
        choices: [
          { id: 'humbled', label: 'Feel unworthy of it', desc: 'Struggle to believe the honour is meant for him', outcome: 'He reads the letter three times, certain there is a mistake, and thinks of the lads he came up with who never got the breaks. Humbled to his core.', effect: { attr: { composure: 1 }, meters: { family: 12, fans: 8 }, tag: 'honoured' }, next: 'ceremony' },
          { id: 'dedicate', label: 'Accept it for others', desc: 'Decide at once whose name it truly belongs to', outcome: 'He resolves on the spot that the honour is for his old coaches and his parents, not himself, and says so before anyone can ask. Grace, immediate and genuine.', effect: { form: 0.06, attr: { leadership: 1, teamwork: 1 }, meters: { family: 14, authority: 6 }, tag: 'honoured' }, next: 'ceremony' },
        ],
      },
      ceremony: {
        id: 'ceremony',
        prompt: 'The day of the ceremony arrives, all pomp and marble and cameras, his family in their finest beside him. It is a world away from the muddy touchlines that made him. How does he carry himself through the grandeur?',
        choices: [
          { id: 'roots', label: 'Stay the same man', desc: 'Wear the honour without changing a thing', outcome: 'He shakes every hand exactly as he would at the training ground, and takes his family for chips afterwards. The honour changes his title, not his heart.', effect: { form: 0.07, attr: { composure: 1 }, meters: { family: 12, fans: 10 } } },
          { id: 'platform', label: 'Use the moment', desc: 'Speak up for the grassroots game that raised him', outcome: 'He turns his few words to the crumbling parks and volunteer coaches who need help, and the plea makes every front page. An honour turned to purpose.', effect: { form: 0.06, market: 2, attr: { leadership: 1 }, meters: { fans: 12, authority: 8 } } },
        ],
      },
    },
  },
  {
    id: 'tri-young-player', title: 'The Bright Young Thing', icon: '🌱', category: 'triumph',
    minTurn: 46, maxTurn: 78, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Barely out of his teens and already the game has noticed: he is named the division\'s Young Player of the Year, the brightest of a new generation, his face suddenly on every back page and every scout\'s list. How does a boy handle a spotlight this sudden?',
        choices: [
          { id: 'grounded', label: 'Keep his feet planted', desc: 'Treat the award as a starting line, not a summit', outcome: 'He tells the cameras that young player awards are a promise to keep, not a prize to enjoy, and drives back to his digs. Old head on young shoulders.', effect: { attr: { composure: 1 }, meters: { authority: 6, family: 8 }, tag: 'wonderkid' }, next: 'hype' },
          { id: 'ambition', label: 'Aim past the age brackets', desc: 'Declare he wants the seniors\' awards next', outcome: 'He says respectfully that young player is nice, but he is coming for the real thing soon. The bravado makes headlines and marks him as one to watch.', effect: { form: 0.07, market: 3, attr: { aggression: 1 }, meters: { fans: 12, agent: 6 }, tag: 'wonderkid' }, next: 'hype' },
        ],
      },
      hype: {
        id: 'hype',
        prompt: 'The award opens a floodgate: agents, boot deals, glossy magazines, a bigger club sniffing already. It is a lot for a young man who was in academy digs a year ago. Which way does he lean as the noise swells?',
        choices: [
          { id: 'work', label: 'Bury himself in the work', desc: 'Ignore the circus, live on the training pitch', outcome: 'He switches the phone off and stays behind for extra finishing every evening, letting his football answer the hype. The coaches quietly adore him for it.', effect: { form: 0.08, attr: { stamina: 1, composure: 1 }, meters: { authority: 6, peers: 6 } } },
          { id: 'brand', label: 'Build the profile', desc: 'Let the agent turn the buzz into deals', outcome: 'He signs the boot contract and the magazine covers, cashing in while the light shines brightest. Lucrative and dazzling, if a touch dizzying for one so young.', effect: { earnings: 4, market: 4, attr: { flair: 1 }, meters: { agent: 14 }, form: -0.03 } },
        ],
      },
    },
  },
  {
    id: 'tri-pass-legend', title: 'Past the Legend', icon: '🪜', category: 'triumph',
    minTurn: 90, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One more and he passes a name that has sat untouched at the top of the all-time list for a generation — a giant of the game, a face on the stand outside, a legend he grew up worshipping. To overtake him feels almost like trespass. How does he approach it?',
        choices: [
          { id: 'reverent', label: 'Honour the legend first', desc: 'Seek the great man out before he passes him', outcome: 'He visits the ageing icon and tells him no record erases what he was. The old man smiles and says records are meant to be broken by the right sort. Blessing given.', effect: { attr: { composure: 1, leadership: 1 }, meters: { authority: 8, fans: 10 }, tag: 'passed-legend' }, next: 'moment' },
          { id: 'driven', label: 'Let the number pull him', desc: 'Fix on the milestone and hunt it clean', outcome: 'He says nothing to anyone and simply keeps scoring, the tally creeping toward a name spoken in hushed tones. The football does all the talking.', effect: { form: 0.06, attr: { aggression: 1 }, meters: { peers: 6 }, tag: 'passed-legend' }, next: 'moment' },
        ],
      },
      moment: {
        id: 'moment',
        prompt: 'It is done — his name now stands alone at the summit, above the idol of his childhood, a figure children will one day chase the way he chased another. The record is his. How does he mark stepping past a hero?',
        choices: [
          { id: 'humble', label: 'Bow to the man he passed', desc: 'Point to the legend\'s name on the stand', outcome: 'He gestures to the great one\'s name high on the stadium wall and mouths a thank you. Even at the summit, he never forgets who lit the path.', effect: { form: 0.08, attr: { teamwork: 1, composure: 1 }, meters: { fans: 14, authority: 6 } } },
          { id: 'era', label: 'Claim the era', desc: 'Declare the top of the list his own now', outcome: 'He allows himself to say the record is his and he means to push it out of reach for decades. Ambition befitting a man who just made history.', effect: { form: 0.09, market: 4, attr: { aggression: 1 }, meters: { fans: 12, sponsors: 6 } } },
        ],
      },
    },
  },
  {
    id: 'tri-farewell-trophy', title: 'The Last Dance', icon: '🎭', category: 'triumph',
    minTurn: 110, maxTurn: 123, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His retirement is announced, the boots hung up at the final whistle of this very match — and by some perfect twist of fate, that last match is a final his side can win. To bow out lifting silverware is a script no player dares write. How does he go into his last ninety minutes?',
        choices: [
          { id: 'empty', label: 'Leave nothing behind', desc: 'Empty the tank one final, glorious time', outcome: 'He resolves to give every last drop, to be carried off with nothing left to spend. Whatever the body has hidden away, today it all comes out.', effect: { attr: { stamina: 1, aggression: 1 }, meters: { peers: 12, authority: 6 }, tag: 'farewell' }, next: 'whistle' },
          { id: 'savour', label: 'Drink in every second', desc: 'Play the last game slowly, memorise it all', outcome: 'He decides to notice everything — the grass, the noise, the faces — so no moment of the last dance is lost. He plays with a strange, luminous calm.', effect: { form: 0.06, attr: { composure: 2 }, meters: { fans: 12, family: 8 }, tag: 'farewell' }, next: 'whistle' },
        ],
      },
      whistle: {
        id: 'whistle',
        prompt: 'The impossible ending holds: they win it, and his final act as a footballer is to lift a trophy, medal cold against his chest, a career closing on the highest note there is. As the celebrations begin, how does he say goodbye?',
        choices: [
          { id: 'family', label: 'Walk off with his family', desc: 'Take his children onto the pitch for the last time', outcome: 'He gathers his kids and walks the lap with them on his shoulders, the crowd chanting his name into the night. The game gave him this, and now he gives it back to them.', effect: { form: 0.1, meters: { family: 16, fans: 12 }, attr: { composure: 1 } } },
          { id: 'boots', label: 'Leave his boots on the spot', desc: 'Set the boots on the centre circle and walk', outcome: 'He unlaces them, places them gently on the centre spot, and walks off barefoot to a standing ovation that does not stop. An exit the club will speak of forever.', effect: { form: 0.11, market: 3, attr: { leadership: 1 }, meters: { fans: 18, authority: 8 } } },
        ],
      },
    },
  },
];
