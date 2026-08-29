import {
  MatchEngine, autoPickXI, buildXI, overall, TICK_SEC, defaultDuty, effectiveDuty, DUTY_LABEL, DUTY_DESC, DUTIES_BY_ROLE, isDutyForRole,
  TACTIC_PRESETS, generateClub, seasonFixtures, seededOpponents, liveTable, contOpponent, CONT_ROUNDS, homeNation, worldCup, playerPath, seededOpponentTactics, LIFE_LABEL, gaffersDiaryEntry, tierName, TIERS,
  FORMATIONS as FORMATION_SHAPES, staffRoster, type StaffMember, boardStanding, deriveExpectation, type BoardMood, type PriorFinish, pressConferenceLine, type PressForm, type PressCompetition, contTieBlurb, wcGroupDramaBlurb, wcKnockoutDramaBlurb, worldCupFinishBlurb,
  transferList, wageForLength, sellValue, squadSeasonWage, moraleEffects, incomingBid, MIN_SQUAD, MAX_SQUAD, type Listing,
  ACHIEVEMENTS, evaluateAchievements, achievementById, type AchSnapshot, lifeAction,
  type Tactics, type Formation, type MatchEvent, type Team, type Club, type Lineup, type Player, type Duty, type Fixture, type PlayedResult, type WCResult, type WCPlayerPath,
} from '@fm/shared';
import { api, hasToken, setToken, clearToken, type Account, type StandingOrders, type MatchPayload, type Trialist, type MissionsData, type ContractInfo } from './api';
import { sprite } from './sprites';
import { crest, crestColors } from './crest';
import { portraitImg, bandForAge } from './portrait';
import { flagImg } from './flag';
import { trophyImg, type TrophyKey } from './trophy';
import { kitTemplate, recolorKit } from './kit';
import { audio } from './audio';
import { commentaryExtra, fillCm } from '../../shared/src/commentary/extra.js';
import { narrateManager, type PersonCtx } from '../../shared/src/managerNarrate.js';
import { pickManagerArc, managerArcById, MGR_TEMPERS, applyMorale, type MgrSituation, type MgrArcEffect, type MgrTemper } from '../../shared/src/managerarc.js';
import { facilityLevelStory } from '../../shared/src/facilities.js';

// Topbar speaker icons — same 24×24 viewBox for both states so the button never changes shape on toggle.
const ICON_SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h3.5l4.5-3.5v13L7.5 15H4z"/><path d="M16 9.2a4 4 0 0 1 0 5.6M18.6 6.6a7.5 7.5 0 0 1 0 10.8"/></svg>';
const ICON_MUTED = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h3.5l4.5-3.5v13L7.5 15H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/></svg>';

/** Single-player manager-season state (per save, in localStorage). `starId` present ⇒ manager phase. */
interface MgrState { season: number; results: PlayedResult[]; starId?: string; starName?: string; starAge?: number; retireAge?: number; titles?: number; trainFocus?: string; staff?: string[]; sponsor?: string;
  // board verdict on the season just gone + that finishing position (feeds next season's expectation)
  lastBoard?: { message: string; mood: BoardMood; expectation: string }; lastFinishPos?: number;
  lastTierMove?: 'promoted' | 'relegated'; // set the season after a promotion/relegation, for the reveal banner
  // international: continental club cup (qualified by a top-3 finish the previous season)
  contElig?: boolean; contRound?: number; contOut?: boolean; contTitles?: number; contBlurb?: string;
  // World-Finals national tournament — the star's nation's knockout run is playable
  wcSeen?: number; wcWins?: number; wcFinals?: number; wcEdition?: number; wcStage?: 'qf' | 'sf' | 'final' | 'done';
  wcRun?: { round: string; my: number; opp: number; oppName: string; won: boolean }[];
  // The Living Squad season report. It used to live ONLY in a class field, so a refresh between the
  // rollover and the renew decision silently discarded every keep-or-lose call the player still had to
  // make — the decisions were gone and the panel came back empty. It belongs in the save. (PT-605)
  squadReport?: any; squadReportSeason?: number;
  /** THE SEASON FEED. Manager events accumulate here as they happen — injuries, signings, contract news,
   *  board mutterings, arc outcomes — and are rendered down the season screen. Before this, the manager's
   *  entire dramatic life was toasts that vanished in two seconds and left nothing to look back at: a
   *  promotion got less text than a throw-in. Capped so a long dynasty cannot bloat the save. */
  feed?: Array<{ season: number; icon: string; text: string }>;
  /** MANAGER ARCS. `arcFired` is every arc this career has seen (never repeated); `arcNow` is the one
   *  awaiting a decision, with the beat it is on. `arcTags` are flags set by past choices, which other
   *  arcs can require or forbid — that is how a consequence outlives the season it happened in. */
  arcFired?: string[]; arcNow?: { id: string; beat: string } | null; arcTags?: string[];
  /** matchday of the last arc offered, so they pace across a season rather than arriving in a clump */
  arcLastMd?: number;
  /** the manager's chosen temperament — gates which arcs fire and colours how the club reacts */
  temper?: MgrTemper;
  /** permanent marks on the club, surviving the manager and every succession */
  clubLegacy?: Array<{ kind: string; label: string; season: number }> }
const BACKROOM_STAFF = [
  { id: 'fitness', icon: '🏋️', name: 'Fitness Coach', cost: 350, desc: 'Sharper conditioning — your side fades less over 90.' },
  { id: 'attack', icon: '⚔️', name: 'Attacking Coach', cost: 350, desc: 'Drills the final third — a small finishing edge, home and away.' },
  { id: 'assistant', icon: '🧠', name: 'Assistant Manager', cost: 500, desc: 'A steady hand — a small all-round edge every match.' },
];

// icons for the stage-aware life meters (keyed by underlying relationship) — used in focus effect labels
const METER_ICON: Record<string, string> = { authority: '🧑‍🏫', peers: '👥', family: '🏠', school: '🎒', agent: '🤝', fans: '📣', sponsors: '📸', partner: '❤️' };
// Readable names for the relationship-meter icons (tooltip + legend so the summer-focus icon-math is decodable — playtest PT-10).
const METER_NAME: Record<string, string> = { authority: 'Coach', peers: 'Teammates', family: 'Family', school: 'School', agent: 'Agent', fans: 'Fans', sponsors: 'Sponsors', partner: 'Partner' };
/** What each meter actually DOES, on the meter itself. The one-time help card named five of the eight and
 *  described them only in aggregate ("a strong meter unlocks better summer opportunities") — and it is
 *  permanently dismissible, three chapters before Fans, Sponsors and Partner first appear, so those three
 *  could never be explained to anybody. A tooltip on the bar cannot be dismissed early. (PT-510) */
const METER_WHAT: Record<string, string> = {
  authority: 'How your coach rates you. High: better coaching offers and more trust in big moments.',
  peers: 'How the dressing room sees you. High: teammates back you up when a season turns.',
  family: 'The people at home. High: a settled head — it steadies you when things go badly.',
  school: 'Your education. High: a safety net, and a level head the papers can’t rattle.',
  agent: 'How well your agent is working for you. High: better money and better moves.',
  fans: 'The terraces. High: they forgive a bad run and lift you on the big days.',
  sponsors: 'Commercial interest. High: bigger endorsement money between seasons.',
  partner: 'Life at home as an adult. High: you play with a clear head; low, and it follows you out.',
};
// Normalize a typed family name at the source: strip anything that isn't a letter/space/'/- (kills the
// HTML-injection vector, PT-78), collapse whitespace, and title-case each word so "MESSI" / "de bruyne"
// store + render as "Messi" / "De Bruyne" (PT-80). Since the cleaned name now flows into the club name, the
// founder/heir surnames and every screen, sanitizing here keeps all of them safe + tidy.
const cleanFamilyName = (raw: string): string =>
  raw.replace(/[^\p{L}\s'-]/gu, '').replace(/\s+/g, ' ').trim().toLowerCase()
     // capitalise the first letter of each name-part — after a space, apostrophe OR hyphen too, so
     // "o'brien-smith" → "O'Brien-Smith" and "d'angelo" → "D'Angelo", not just space-separated words (PT-100)
     .replace(/(^|[\s'-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
// Readable full names for the stat abbreviations shown around the UI (tooltip on hover — playtest fix:
// abbreviations like CMP/CRE/LDR/WRK were unexplained).
const STAT_FULL: Record<string, string> = { pace: 'Pace', strength: 'Strength', passing: 'Passing', shooting: 'Shooting', tackling: 'Tackling', positioning: 'Positioning', workrate: 'Work rate', keeping: 'Goalkeeping', setPiece: 'Set pieces', stamina: 'Stamina', composure: 'Composure', creativity: 'Creativity', leadership: 'Leadership', teamwork: 'Teamwork', aggression: 'Aggression', durability: 'Durability — how well he holds up, and how long he plays on' };
// Pedigree readout — a founding prospect legitimately has 0% (nothing inherited yet), which reads as
// "worthless" next to his potential stars. Signpost it instead of showing a bare "0%". Playtest fix PT-4.
function pedigreeText(pedigree: number, generation?: number): string {
  const pctv = (pedigree * 100) | 0;
  if ((generation ?? 0) === 0 && pctv === 0) return 'first of the line · his heirs will inherit his pedigree';
  return `pedigree ${pctv}%`;
}
const TAG_ICON: Record<string, string> = { composure: '🧊', aggression: '⚔️', creativity: '🎨', teamwork: '🧩', leadership: '🎖️', stamina: '🏃', flair: '✨', keeping: '🧤' };

// KIT customization options (cosmetic identity for the career player, carried to the pro)
const BOOT_COLOURS = [
  { id: 'white', name: 'Classic White', hex: '#f0f0f0' }, { id: 'black', name: 'Blackout', hex: '#1a1a1a' },
  { id: 'red', name: 'Crimson', hex: '#e0483a' }, { id: 'blue', name: 'Electric Blue', hex: '#3a7ce0' },
  { id: 'gold', name: 'Gold', hex: '#e6c14a' }, { id: 'pink', name: 'Hot Pink', hex: '#e653a0' },
  { id: 'green', name: 'Neon Green', hex: '#5bd06a' }, { id: 'orange', name: 'Volt Orange', hex: '#ff8a3b' },
];
const CELEBRATIONS = [
  { id: 'kneeslide', name: 'Knee Slide' }, { id: 'badge', name: 'Kiss the Badge' },
  { id: 'calm', name: 'Ice Cold — Arms Out' }, { id: 'wheel', name: 'Slide & Wheel Away' },
  { id: 'point-sky', name: 'Point to the Sky' }, { id: 'shush', name: 'Shush the Crowd' },
  { id: 'heart', name: 'Heart Hands' }, { id: 'rock', name: 'Rock the Baby' },
];
const HAIRSTYLES = [
  { id: 'buzz', name: 'Buzz Cut' }, { id: 'curls', name: 'Curls' },
  { id: 'quiff', name: 'Quiff' }, { id: 'mohawk', name: 'Mohawk' },
  { id: 'afro', name: 'Afro' }, { id: 'dreadlocks', name: 'Dreadlocks' },
  { id: 'ponytail', name: 'Ponytail' }, { id: 'bald', name: 'Shaved Head' },
];
const ACCESSORIES = [
  { id: 'none', name: 'None' }, { id: 'headband', name: 'Headband' },
  { id: 'wristband', name: 'Wristbands' }, { id: 'snood', name: 'Snood' },
  { id: 'undersleeve', name: 'Undersleeves' }, { id: 'strapping', name: 'Ankle Strapping' },
];

// each life stage re-themes the whole career view — its own accent, backdrop mood + scene banner, so the
// career FEELS like turning a page from a muddy park to a floodlit stadium (the "chapter-like UI").
const CHAPTER_THEME: Record<string, { slug: string; scene: string; accent: string; bg: string; tagline: string }> = {
  Grassroots:   { slug: 'grassroots',   scene: '🌱⚽🥅', accent: '#5bd06a', bg: 'radial-gradient(120% 90% at 50% 0%, rgba(70,150,70,0.20), rgba(20,30,20,0.0) 60%)', tagline: 'Jumpers for goalposts — muddy knees and big dreams.' },
  Academy:      { slug: 'academy',      scene: '🎒📋⚽', accent: '#5aa9ff', bg: 'radial-gradient(120% 90% at 50% 0%, rgba(60,110,200,0.20), rgba(15,20,35,0.0) 60%)', tagline: 'Cones, drills and van journeys — the real schooling begins.' },
  Scholar:      { slug: 'scholar',      scene: '📗🧤⚽', accent: '#3fd4c8', bg: 'radial-gradient(120% 90% at 50% 0%, rgba(50,190,180,0.20), rgba(15,32,30,0.0) 60%)', tagline: 'Scholarship signed — two years to prove you belong.' },
  'Youth Team': { slug: 'youth',        scene: '👕🔥⚽', accent: '#ffa53b', bg: 'radial-gradient(120% 90% at 50% 0%, rgba(210,130,40,0.20), rgba(35,25,15,0.0) 60%)', tagline: 'Knocking on the first-team door — the agents start circling.' },
  Breakthrough: { slug: 'breakthrough', scene: '🏟️📣✨', accent: '#b57bff', bg: 'radial-gradient(120% 90% at 50% 0%, rgba(150,90,230,0.22), rgba(25,15,40,0.0) 60%)', tagline: 'Floodlights and headlines — this is the big time.' },
  'First Team': { slug: 'firstteam',    scene: '⚽🔴⭐', accent: '#ff5e6d', bg: 'radial-gradient(120% 90% at 50% 0%, rgba(220,70,90,0.20), rgba(38,15,20,0.0) 60%)', tagline: 'The shirt is yours now — hold onto it, week after week.' },
  Establishing: { slug: 'establishing', scene: '🏆⭐💫', accent: '#ffd75e', bg: 'radial-gradient(120% 90% at 50% 0%, rgba(210,170,60,0.22), rgba(35,30,10,0.0) 60%)', tagline: 'A name in lights — cement your place among the greats.' },
};

const LEVELS: Record<keyof Omit<Tactics, 'formation' | 'offsideTrap' | 'playOutOfDefence' | 'attackFocus'>, string[]> = {
  mentality: ['Very Defensive', 'Defensive', 'Balanced', 'Attacking', 'Very Attacking'],
  line: ['Very Deep', 'Deep', 'Normal', 'High', 'Very High'],
  press: ['Contain', 'Low', 'Balanced', 'High', 'Gegenpress'],
  tempo: ['Very Patient', 'Patient', 'Balanced', 'Direct', 'Very Direct'],
  width: ['Very Narrow', 'Narrow', 'Balanced', 'Wide', 'Very Wide'],
};
// In-fiction "manager's notebook" explainer for each slider — real coaching principle behind the
// number, not a restatement of the mechanic (docs/research-manager-career.md §3). Pure flavour tooltip.
const TAC_NOTE: Record<keyof typeof LEVELS, string> = {
  mentality: "How far you push bodies forward when you've got the ball — go Attacking and you risk men caught upfield if it breaks down; sit Defensive and you bank numbers behind the ball.",
  line: 'How high your back line holds. A high line compresses the pitch and squeezes the opponent into risky forward passes — but the space in behind grows if it\'s beaten.',
  press: "How hard you hunt the ball the moment you lose it. Full Gegenpress is Klopp's five-second rule: win it back inside five seconds while they're disorganised, or abandon the chase and drop into shape.",
  tempo: 'Patient keeps it on the deck through midfield, working the opening; Direct goes long and early, betting on the second ball over control of it.',
  width: 'How far your shape stretches side to side. Wide creates room out on the flanks for crosses and overlaps; Narrow packs bodies through the middle for combination play.',
};
// ── Match plan: conditional in-game orders ──────────────────────────────────────────────────────
// Pre-match rules the manager arms; each fires ONCE during a single-player match when its trigger is met
// (minute reached + scoreline), auto-shifting your tactics via the engine's setTactics. Shifts are applied
// from the kickoff tactics (last-fired situation wins), each field clamped to the −2..+2 tactic range.
type TacticKey = keyof Omit<Tactics, 'formation'>;
interface PlanRule { id: string; ico: string; ifText: string; thenText: string; minMinute: number; cond: (my: number, opp: number) => boolean; shift: Partial<Record<TacticKey, number>>; fired: string; note?: string }
const MATCH_PLAN_RULES: PlanRule[] = [
  { id: 'chase-ht', ico: '🔴', ifText: 'Losing at half-time', thenText: 'throw men forward — more attacking, higher line', minMinute: 45, cond: (my, opp) => my < opp, shift: { mentality: +1, line: +1, tempo: +1 }, fired: '📋 Behind at the break — going more attacking' },
  { id: 'chase-late', ico: '🟠', ifText: 'Still losing at 70′', thenText: 'all-out attack for the comeback', minMinute: 70, cond: (my, opp) => my < opp, shift: { mentality: +2, line: +1, press: +1, tempo: +1 }, fired: '📋 Chasing the game — all-out attack' },
  { id: 'hold-lead', ico: '🟢', ifText: 'Leading at 75′', thenText: 'see it out — drop deeper, slow the tempo', minMinute: 75, cond: (my, opp) => my > opp, shift: { mentality: -1, line: -1, press: -1, tempo: -1 }, fired: '📋 Protecting the lead — shutting up shop',
    note: '"Park the bus" — an ultra-defensive block with numbers behind the ball. Mourinho, after a 2004 goalless draw: "they brought the bus and they left the bus in front of the goal."' },
  { id: 'push-draw', ico: '🟡', ifText: 'Level at 78′', thenText: 'go for the winner', minMinute: 78, cond: (my, opp) => my === opp, shift: { mentality: +1, tempo: +1 }, fired: '📋 Pushing for a winner' },
  { id: 'manage-2up', ico: '🔵', ifText: 'Two+ goals up after 60′', thenText: 'game management — protect the lead & the legs', minMinute: 60, cond: (my, opp) => my - opp >= 2, shift: { mentality: -1, tempo: -1, press: -1 }, fired: '📋 Comfortable — managing the game out',
    note: 'Real teams deliberately drop deeper and cede possession late while leading — the bet is that less space in behind outweighs the extra pressure they invite.' },
  { id: 'blowout-lead', ico: '🟣', ifText: 'Three+ goals up after 55′', thenText: 'total game management — rest the legs for what\'s ahead', minMinute: 55, cond: (my, opp) => my - opp >= 3, shift: { mentality: -2, tempo: -2, press: -2 }, fired: '📋 Job done — shutting it down completely' },
  { id: 'chase-ht-big', ico: '⚫', ifText: 'Two+ down at half-time', thenText: 'monumental push — maximum attack, high press, high line', minMinute: 45, cond: (my, opp) => opp - my >= 2, shift: { mentality: +2, line: +2, press: +1, tempo: +2 }, fired: '📋 Facing a hiding — throwing absolutely everything forward' },
];
const clampTac = (v: number) => Math.max(-2, Math.min(2, v));

const FORMATIONS: Formation[] = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '3-4-3', '4-1-2-1-2', '5-3-2', '4-5-1', '4-1-4-1', '5-4-1', '4-2-2-2'];
const SLOT_ROLES: Record<Formation, string[]> = {
  '4-4-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
  '4-3-3': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
  '3-5-2': ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
  '4-2-3-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW'],
  '3-4-3': ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
  '4-1-2-1-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
  '5-3-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW'],
  '4-5-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW'],
  '4-1-4-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW'],
  '5-4-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW'],
  '4-2-2-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
};

// ── Pre-match matchup insight (pure flavour, deterministic from the two seeded formation shapes) ──
// Real scouting logic: formations counter each other less by raw shape and more by WHO GETS
// OUTNUMBERED WHERE — a central-midfield overload vs a wide overload, the recurring rock-paper-scissors
// underneath every real formation matchup (see docs/research-manager-career.md §1). Reads the same
// static formation anchors the pitch view already uses — no engine change, no rng, no calibration risk.
const CENTRAL_BAND = 10; // y within 10 of the pitch's 34-wide centre counts as "central"
function midfieldSplit(f: Formation): { central: number; wide: number } {
  const mf = FORMATION_SHAPES[f].filter((s) => s.role === 'MF');
  const central = mf.filter((s) => Math.abs(s.y - 34) <= CENTRAL_BAND).length;
  return { central, wide: mf.length - central };
}
function backLineSize(f: Formation): number { return FORMATION_SHAPES[f].filter((s) => s.role === 'DF').length; }
function wideOutlets(f: Formation): number {
  return FORMATION_SHAPES[f].filter((s) => s.role !== 'GK' && (s.y <= 15 || s.y >= 53)).length;
}
function formationMatchupInsight(mine: Formation, opp: Formation): string {
  const mMine = midfieldSplit(mine), mOpp = midfieldSplit(opp);
  if (mMine.central > mOpp.central) {
    return `Your ${mine}'s midfield should outnumber their ${opp} centrally — look to dominate the middle third.`;
  }
  if (mOpp.central > mMine.central) {
    return `Their ${opp} outnumbers your ${mine} through the middle — expect to be squeezed there; win it back quickly.`;
  }
  const oppWide = wideOutlets(opp), myBack = backLineSize(mine);
  const myWide = wideOutlets(mine), oppBack = backLineSize(opp);
  if (oppWide > myBack) return `Their wide outlets will stretch your ${mine} back line out wide — tuck in and cover the flanks.`;
  if (myWide > oppBack) return `Your ${mine}'s width should overload their ${opp} back line — attack down the channels.`;
  return `Evenly matched shapes (${mine} vs ${opp}) — no clean numbers edge either way; small margins will decide it.`;
}

// ── Team-talk personality nuance (research §4: Ferguson's hairdryer vs Ancelotti's quiet leadership) ──
// Sensitive personalities wilt/backfire under a fiery talk and prefer calm; personalities who thrive on
// the big occasion / drag others up respond well to being fired up. Everyone else is unmoved either way.
// Deliberately SMALL bounded nudges layered on top of the existing bounded homeBoost/conditioning edge
// (see startSpMatchWith()) — never a big swing, calibration stays untouched.
const TALK_SENSITIVE = new Set(['fragile', 'hothead', 'perfectionist']);
const TALK_FIERY = new Set(['biggame', 'leader', 'workhorse', 'maverick', 'showman']);

const $ = (id: string) => document.getElementById(id)!;

// Brief retro toast near top-centre; the CSS animation fades it out after ~2s.
let toastTimer: ReturnType<typeof setTimeout> | undefined;
function toast(msg: string) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('show');
  void el.offsetWidth; // restart the animation if a toast is already showing
  el.classList.add('show');
  // CLEAR THE TEXT once it has faded. The CSS animation takes it to opacity 0, so a player stops seeing it
  // — but textContent stayed set forever, so a stale "cannot buy that" was still IN THE DOM many turns
  // later, including on the manager-handoff screen. Anything reading the page rather than the pixels (a
  // screen reader, an automated playtest) sees a message the game is no longer showing. (PT-1405)
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); el.textContent = ''; }, 2200);
}

// Retro pixel spinner used while the hub fetches data (see .pixel-loader in index.html).
const SPINNER = '<div class="pixel-loader"><div class="pixel-spinner"><i></i><i></i><i></i><i></i></div><span class="txt">Loading…</span></div>';

// Compact "3m ago" style relative time for the results feed.
function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// "2d 4h" / "5h 12m" style countdown for the season banner.
function humanizeMs(ms: number): string {
  if (ms <= 0) return 'now';
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function statColor(v: number): string {
  if (v >= 17) return '#3ad07a';
  if (v >= 14) return '#7bd88f';
  if (v >= 11) return '#c9d17b';
  if (v >= 8) return '#d9a860';
  return '#d16a5a';
}

// NFT rank tiers (LoL-style, escalating icons). Only NFT players get a tier — so the
// presence of a badge differentiates paid stars from free filler players.
const isNftId = (id: string) => id.startsWith('nft:');
interface Tier { key: string; name: string; icon: string }
function nftTier(ov: number): Tier {
  if (ov >= 18) return { key: 'legend', name: 'LEGEND', icon: '👑' };
  if (ov >= 16) return { key: 'diamond', name: 'DIAMOND', icon: '💎' };
  if (ov >= 14) return { key: 'gold', name: 'GOLD', icon: '🥇' };
  if (ov >= 12) return { key: 'silver', name: 'SILVER', icon: '🥈' };
  return { key: 'bronze', name: 'BRONZE', icon: '🥉' };
}
/** The legend tier gets the pixel crown at the two big collectible-card reveal moments (the
 *  "TURNED PRO" flash and the tier badge) — bronze/silver/gold/diamond keep their plain emoji so
 *  the escalating ladder still reads consistently. innerHTML-only: this returns raw SVG markup. */
function tierIconHtml(tier: Tier): string {
  return tier.key === 'legend' ? `<span class="ico-inline">${sprite('crown')}</span>` : tier.icon;
}

// Sort state for the full-squad-stats table. `null` = default role grouping.
type SquadSort = { key: string; dir: 'asc' | 'desc' };
const ROLE_ORDER: Record<string, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };

function statsTableHTML(players: Player[], highlight?: Set<string>, sort?: SquadSort | null): string {
  // The five MENTAL stats and durability are shown here too. This table hard-coded the same ten
  // physical/technical columns it had before the Living Squad existed, so the entire mental layer — which
  // the match engine reads, which traits bump, and which is most of what makes one squad player different
  // from another — was invisible everywhere except a once-a-year report. AGE is here for the same reason:
  // it decides development, decline and retirement, and the manager could not see it. (PT-306)
  const cols: Array<[string, keyof Player['attrs']]> = [
    ['PAC', 'pace'], ['STR', 'strength'], ['PAS', 'passing'], ['SHO', 'shooting'],
    ['TAK', 'tackling'], ['POS', 'positioning'], ['WRK', 'workrate'], ['KEE', 'keeping'],
    ['SET', 'setPiece'], ['STA', 'stamina'],
    ['COM', 'composure'], ['AGG', 'aggression'], ['CRE', 'creativity'], ['TEA', 'teamwork'],
    ['LEA', 'leadership'], ['DUR', 'durability'],
  ];
  // Value a row contributes to a given sort key (number for stats, string for name).
  const sortVal = (p: Player, key: string): number | string => {
    if (key === 'pos') return ROLE_ORDER[p.role];
    if (key === 'name') return p.name.toLowerCase();
    if (key === 'ovr') return overall(p);
    if (key === 'age') return p.age ?? 0;
    return p.attrs[key as keyof Player['attrs']] ?? 0;
  };
  let sorted: Player[];
  if (sort) {
    const d = sort.dir === 'asc' ? 1 : -1;
    sorted = [...players].sort((a, b) => {
      const va = sortVal(a, sort.key), vb = sortVal(b, sort.key);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return cmp !== 0 ? cmp * d : (overall(b) - overall(a));
    });
  } else {
    sorted = [...players].sort((a, b) => (ROLE_ORDER[a.role] - ROLE_ORDER[b.role]) || (overall(b) - overall(a)));
  }
  const arrow = (key: string) => (sort?.key === key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '');
  const th = (label: string, key: string, style = '', title = '') =>
    `<th class="sortable" data-sort="${key}"${title ? ` title="${title}"` : ''}${style ? ` style="${style}"` : ''}>${label}${arrow(key)}</th>`;
  const head = `<tr><th></th>${th('Pos', 'pos', '', 'Position')}${th('Name', 'name', 'text-align:left')}${th('OVR', 'ovr', '', 'Overall rating')}${th('AGE', 'age', '', 'Age — decides growth, decline and when he retires')}${cols.map(([l, k]) => th(l, k, '', STAT_FULL[k] ?? String(k))).join('')}</tr>`;
  const rows = sorted.map((p) => {
    const on = !!highlight?.has(p.id);
    const nft = isNftId(p.id);
    const tier = nft ? nftTier(overall(p)) : null;
    const cells = cols.map(([, k]) => `<td class="stat" style="background:${statColor(p.attrs[k] ?? 0)}">${Math.round(p.attrs[k] ?? 0)}</td>`).join('');
    const mark = on ? '<td class="inxi-mark">●</td>' : '<td></td>';
    const nameCell = tier
      ? `<td class="name nft-name tier-${tier.key}" data-card="${p.id}" title="Your star · ${tier.name} — click to view card">${tier.icon} ${p.name}</td>`
      : `<td class="name" data-card="${p.id}" title="Click to view his card">${p.name}</td>`; // every squad player is a full character now — his card is worth opening (Living Squad)
    return `<tr class="${on ? 'inxi' : ''}${nft ? ' nft-row' : ''}">${mark}<td class="pos role-${p.role}">${p.role}</td>${nameCell}<td class="stat" style="background:${statColor(overall(p))}">${overall(p)}</td><td class="stat age">${p.age ?? '–'}</td>${cells}</tr>`;
  }).join('');
  return `<table class="squad">${head}${rows}</table>`;
}

function squadInsight(team: Team): string {
  const byRole = (r: Player['role']) => team.players.filter((p) => p.role === r);
  const avg = (ps: Player[], k: keyof Player['attrs']) => ps.length ? Math.round(ps.reduce((a, p) => a + (p.attrs[k] ?? 0), 0) / ps.length) : 0;
  const fw = byRole('FW'), df = byRole('DF');
  const best = team.players.reduce((a, b) => (overall(b) > overall(a) ? b : a));
  const tips = [`★ Key player: <b>${best.name}</b> (${best.role}, OVR ${overall(best)})`];
  if (avg(fw, 'pace') >= 15) tips.push(`⚡ Your forwards are quick (pace ${avg(fw, 'pace')}) — a high line + direct tempo suit you.`);
  else if (avg(fw, 'strength') >= 15) tips.push(`💪 Your forwards are strong (strength ${avg(fw, 'strength')}) — long balls pay off.`);
  if (avg(df, 'pace') <= 11) tips.push(`⚠️ Your defenders are slow (pace ${avg(df, 'pace')}) — a high line is risky.`);
  return tips.join('<br>');
}

let GAME: Game;

class Game {
  engine?: MatchEngine;
  running = false;
  silent = false; // when true, flushing events shows no goal flash/shake (used by "skip")
  speed = 1; accum = 0; eventsShown = 0;

  account!: Account;
  club!: Club;
  standingOrders!: StandingOrders;
  draftLineup!: Lineup;
  draftTactics!: Tactics;
  draftDuties: Duty[] = []; // per-slot manager duties, parallel to draftLineup.playerIds
  draftCaptain?: number;    // slot index wearing the armband
  draftTakers: { pen?: number; fk?: number; corner?: number } = {}; // set-piece taker slot indices
  editorMode: 'standing' | 'match' = 'standing';
  squadSort: SquadSort | null = null;
  spFixture: { idx: number; oppClub: Club; oppName: string; oppStrength: number; venue: 'home' | 'away'; neutral?: boolean; oppLineup: Lineup; oppTactics: Tactics; comp?: 'league' | 'cont' | 'wc'; contRound?: number } | null = null; // the single-player fixture being played (neutral = a neutral-ground decider: no fan-zone home bonus, PT-130)
  pendingCont: { myGoals: number; oppGoals: number; oppStrength: number } | null = null; // a continental tie awaiting resolution once the full-time card is dismissed
  pendingWc: { myGoals: number; oppGoals: number; oppName: string } | null = null; // a World-Finals knockout tie awaiting resolution
  /** The last squad-rollover report (Living Squad) — shown on the season screen after a rollover so the
   *  manager sees who grew, who faded, who retired and whose deal is up. */
  pendingSquadReport: any = null;
  draftPlan = new Set<string>();          // armed conditional match-plan rule ids (single-player)
  planFired = new Set<string>();          // rules already triggered this match
  planBaseTactics: Tactics | null = null; // the kickoff tactics — shifts apply relative to this
  mySide: 0 | 1 = 0;   // which team index (0 home / 1 away) is the player in the current match
  homeName = '';
  awayName = '';

  async boot() {
    // unlock audio on the first user interaction (browsers block autoplay until then); once is enough
    const unlock = () => { audio.unlock(); document.removeEventListener('pointerdown', unlock); };
    document.addEventListener('pointerdown', unlock);
    this.loadPrefs(); // reduced-motion etc., applied before first paint
    this.wireStaticButtons();
    this.showScreen('login');
    this.renderMainMenu();
  }

  // ── single-player saves (offline: no login — a "save" is a local profile) ──
  private loadSaves(): Array<{ id: string; token: string; name: string; lastPlayed: number }> {
    try { return JSON.parse(localStorage.getItem('fm_saves') || '[]'); } catch { return []; }
  }
  private saveSaves(s: Array<{ id: string; token: string; name: string; lastPlayed: number }>) { localStorage.setItem('fm_saves', JSON.stringify(s)); }

  private renderMainMenu() {
    $('mm-emblem').innerHTML = `<span class="mm-crown">${sprite('crown')}</span><span class="mm-ball">${sprite('ball')}</span>`;
    const saves = this.loadSaves().sort((a, b) => b.lastPlayed - a.lastPlayed);
    const multi = saves.length > 1; // with one save, Continue already loads it — the list would just duplicate that
    $('mm-buttons').classList.remove('hidden');
    $('mm-newgame').classList.add('hidden');
    const cont = $('mm-continue');
    cont.classList.toggle('hidden', saves.length === 0);
    if (saves.length) cont.textContent = `▶ Continue — ${saves[0].name}`; // name the save it resumes
    $('login-error').textContent = '';
    // the save list is a SWITCHER (only meaningful with 2+ saves); with one save it's just an info row + delete
    $('mm-saves').innerHTML = saves.length
      ? `<div class="mm-saves-lbl">${multi ? 'Switch save' : 'Your save'}</div>` + saves.map((s) => `<div class="mm-save${multi ? ' load' : ''}" data-id="${s.id}"><span class="mm-save-name">${s.name}</span><span class="mm-save-meta">${new Date(s.lastPlayed).toLocaleDateString()} ${new Date(s.lastPlayed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><button class="mm-save-del" data-del="${s.id}" title="Delete save">✕</button></div>`).join('')
      : '';
    if (multi) $('mm-saves').querySelectorAll('.mm-save').forEach((el) => el.addEventListener('click', (e) => { if ((e.target as HTMLElement).dataset.del) return; this.loadSave((el as HTMLElement).dataset.id!); }));
    $('mm-saves').querySelectorAll('.mm-save-del').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); this.deleteSave((el as HTMLElement).dataset.del!); }));
    // pre-focus the most-used action (Continue if a save exists, else New Game) so Enter/Space just works
    const focusBtn = saves.length ? cont : $('mm-new');
    try { (focusBtn as HTMLElement).focus({ preventScroll: true }); } catch { /* not focusable yet */ } // don't auto-scroll the logo off the top of the title screen (PT-98)
  }

  private continueGame() { const s = this.loadSaves().sort((a, b) => b.lastPlayed - a.lastPlayed)[0]; if (s) this.loadSave(s.id); }

  private async loadSave(id: string) {
    const saves = this.loadSaves(); const save = saves.find((s) => s.id === id); if (!save) return;
    setToken(save.token);
    try { this.setMe(await api.me()); save.lastPlayed = Date.now(); this.saveSaves(saves); await this.showHub(); }
    catch { $('login-error').textContent = 'Could not load that save — it may be corrupted.'; clearToken(); }
  }

  private deleteSave(id: string) {
    const save = this.loadSaves().find((s) => s.id === id);
    this.openConfirm(`Delete <b>${save?.name ?? 'this save'}</b>? This bloodline is gone for good — there's no undo.`, 'Delete forever', async () => {
      // "no undo" must mean it: remove the save MODEL from the backend, and sweep every per-handle localStorage
      // key (fm_mgr_/fm_tier_/fm_plan_/fm_ach_/fm_bought_/fm_biddismiss_/onboarding) — not just the index (PT-77)
      try { if (save?.token) await api.deleteSave(save.token); } catch { /* best-effort */ }
      // sweep per-handle keys by the save's TOKEN, not its list id: every per-save key is suffixed with
      // account.handle, which equals the save's UUID token (api.register/me), NOT the name-derived list id —
      // so matching on `id` removed nothing and orphaned every fm_mgr_/tier/ach/heir/… key (PT-131, PT-77 regression)
      try { const suffix = save?.token; if (suffix) for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.includes(suffix)) localStorage.removeItem(k); } } catch { /* ignore */ }
      this.saveSaves(this.loadSaves().filter((s) => s.id !== id)); this.renderMainMenu(); toast('Save deleted');
    });
  }

  // ── settings + confirm dialogs ────────────────────────────────────────────────────────────────
  private static PREFS_KEY = 'fm_prefs';
  private prefs: { reducedMotion: boolean; crt: boolean; uiScale: number; hideCardStats: boolean } = { reducedMotion: false, crt: true, uiScale: 110, hideCardStats: false }; // default a touch larger — text reads bigger out of the box (#1)
  /** Load persisted prefs (defaulting reduced-motion to the OS setting) and apply them app-wide. */
  private loadPrefs() {
    let saved: Partial<{ reducedMotion: boolean; crt: boolean; uiScale: number; hideCardStats: boolean }> = {};
    try { saved = JSON.parse(localStorage.getItem(Game.PREFS_KEY) || '{}'); } catch { /* defaults */ }
    const osReduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scale = Math.max(80, Math.min(140, Number(saved.uiScale) || 110)); // default 110%; allow up to 140% for a bigger-text preference (#1)
    this.prefs = { reducedMotion: saved.reducedMotion ?? osReduced, crt: saved.crt ?? true, uiScale: scale, hideCardStats: saved.hideCardStats ?? false };
    this.applyPrefs();
  }
  private applyPrefs() {
    document.body.classList.toggle('reduced-motion', this.prefs.reducedMotion);
    document.body.classList.toggle('no-crt', !this.prefs.crt);
    // UI scale — zoom the whole document (supported in Chromium/WebView2/WKWebView, our Steam-wrapper targets)
    try { (document.documentElement.style as any).zoom = String(this.prefs.uiScale / 100); } catch { /* ignore */ }
  }
  private savePrefs() { try { localStorage.setItem(Game.PREFS_KEY, JSON.stringify(this.prefs)); } catch { /* ignore */ } }

  /** The settings dialog — reachable from the menu AND mid-game (top-bar ⚙). Music volume + mute and
   *  reduced-motion, applied live. (SFX volume joins here once the SFX set ships.) */
  private openSettings() {
    document.getElementById('settings-ov')?.remove();
    const sw = (on: boolean, key: string) => `<div class="set-sw${on ? ' on' : ''}" role="switch" aria-checked="${on}" tabindex="0" data-sw="${key}"></div>`;
    const ov = document.createElement('div'); ov.id = 'settings-ov';
    ov.innerHTML = `<div class="tt-card set-card">`
      + `<div class="set-head"><div class="tt-title">⚙ SETTINGS</div><button class="set-x" aria-label="Close">✕</button></div>`
      + `<div class="set-row"><div class="set-lbl"><span>Music</span><span class="set-val" id="set-volval">${Math.round(audio.getVolume() * 100)}%</span></div>`
      + `<input type="range" id="set-vol" min="0" max="100" value="${Math.round(audio.getVolume() * 100)}" aria-label="Music volume"></div>`
      + `<div class="set-row"><div class="set-lbl"><span>Mute music</span>${sw(audio.isMuted(), 'music')}</div>`
      + `<div class="set-hint">Silence the soundtrack. Your volume is remembered.</div></div>`
      + `<div class="set-row"><div class="set-lbl"><span>Sound effects</span><span class="set-val" id="set-sfxval">${Math.round(audio.getSfxVolume() * 100)}%</span></div>`
      + `<input type="range" id="set-sfx" min="0" max="100" value="${Math.round(audio.getSfxVolume() * 100)}" aria-label="Sound-effects volume"></div>`
      + `<div class="set-row"><div class="set-lbl"><span>Mute sound effects</span>${sw(audio.isSfxMuted(), 'sfx')}</div>`
      + `<div class="set-hint">The reward chimes on big moments. No routine click sounds.</div></div>`
      + `<div class="set-row"><div class="set-lbl"><span>Reduce motion</span>${sw(this.prefs.reducedMotion, 'motion')}</div>`
      + `<div class="set-hint">Tone down animations and screen transitions (card flips, moving effects).</div></div>`
      + `<div class="set-row"><div class="set-lbl"><span>CRT screen effect</span>${sw(this.prefs.crt, 'crt')}</div>`
      + `<div class="set-hint">The retro scanline + vignette overlay. Turn off for a flat, crisp picture.</div></div>`
      + `<div class="set-row"><div class="set-lbl"><span>UI scale</span><span class="set-val" id="set-scaleval">${this.prefs.uiScale}%</span></div>`
      + `<input type="range" id="set-scale" min="80" max="140" step="5" value="${this.prefs.uiScale}" aria-label="UI scale">`
      + `<div class="set-hint">Make everything bigger or smaller — handy on small screens or from the couch.</div></div>`
      + `<div class="set-row"><div class="set-lbl"><span>Challenge: hide card stats</span>${sw(this.prefs.hideCardStats, 'hidestats')}</div>`
      + `<div class="set-hint">Mask the stat pills on your choice cards each turn — read the action and work out what it trains. Harder and more immersive; “🎯 This calls for” stays visible.</div></div>`
      // PT-504: the onboarding explainers are dismiss-forever, so give them a permanent way back
      + `<div class="set-row"><div class="set-lbl"><span>How to play</span><button id="set-help">📖 Read the rules</button></div>`
      + `<div class="set-hint">The explainers you were shown once, kept here to re-read any time.</div></div>`
      + `</div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); document.removeEventListener('keydown', onEsc); }; // clean up the ESC listener on EVERY close path (PT-81)
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); }); // click backdrop to dismiss
    ov.querySelector('.set-x')!.addEventListener('click', close);
    // music volume — live (mute stays a separate, authoritative switch: dragging volume never un-mutes)
    const vol = ov.querySelector('#set-vol') as HTMLInputElement;
    vol.addEventListener('input', () => { audio.setVolume(Number(vol.value) / 100); $('set-volval').textContent = `${vol.value}%`; });
    // SFX volume — live; preview chime on release only when SFX isn't muted (so "mute SFX" is truly silent)
    const sfx = ov.querySelector('#set-sfx') as HTMLInputElement;
    sfx.addEventListener('input', () => { audio.setSfxVolume(Number(sfx.value) / 100); $('set-sfxval').textContent = `${sfx.value}%`; });
    sfx.addEventListener('change', () => { if (!audio.isSfxMuted()) audio.chime('confirm'); }); // preview once on release
    // UI scale — live
    const scale = ov.querySelector('#set-scale') as HTMLInputElement;
    scale.addEventListener('input', () => { this.prefs.uiScale = Number(scale.value); this.savePrefs(); this.applyPrefs(); $('set-scaleval').textContent = `${scale.value}%`; });
    // toggles wired by data-sw key (robust to row order/additions)
    const flip = (el: HTMLElement, on: boolean) => { el.classList.toggle('on', on); el.setAttribute('aria-checked', String(on)); };
    const byKey = (k: string) => ov.querySelector(`[data-sw="${k}"]`) as HTMLElement;
    const wireSw = (el: HTMLElement, fn: () => void) => {
      if (!el) return;
      el.addEventListener('click', fn);
      el.addEventListener('keydown', (e) => { const k = (e as KeyboardEvent).key; if (k === ' ' || k === 'Enter') { e.preventDefault(); fn(); } });
    };
    wireSw(byKey('music'), () => { const m = audio.toggleMuted(); flip(byKey('music'), m); this.syncMuteBtn(); });
    wireSw(byKey('sfx'), () => { const m = audio.toggleSfxMuted(); flip(byKey('sfx'), m); if (!m) audio.chime('confirm'); });
    wireSw(byKey('motion'), () => { this.prefs.reducedMotion = !this.prefs.reducedMotion; this.savePrefs(); this.applyPrefs(); flip(byKey('motion'), this.prefs.reducedMotion); });
    wireSw(byKey('crt'), () => { this.prefs.crt = !this.prefs.crt; this.savePrefs(); this.applyPrefs(); flip(byKey('crt'), this.prefs.crt); });
    ov.querySelector('#set-help')?.addEventListener('click', () => { close(); this.openHowToPlay(); });
    wireSw(byKey('hidestats'), () => { this.prefs.hideCardStats = !this.prefs.hideCardStats; this.savePrefs(); flip(byKey('hidestats'), this.prefs.hideCardStats); if (this.lastCareerState) this.renderCareer(this.lastCareerState); }); // re-render so the current hand masks/unmasks live (#3)
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } };
    document.addEventListener('keydown', onEsc);
  }

  /** A read-only, always-available copy of both onboarding explainers — reached from Settings, so
   *  dismissing a "Got it ✕" is no longer permanent (PT-504). */
  private openHowToPlay() {
    document.getElementById('settings-ov')?.remove();
    const ov = document.createElement('div'); ov.id = 'settings-ov'; // reuse the centred-overlay styling
    const section = (title: string, rows: string[]) =>
      `<div class="set-row"><div class="set-lbl"><span>${title}</span></div><ul class="cg-help-list htp-list">${rows.map((r) => `<li>${r}</li>`).join('')}</ul></div>`;
    const isManager = !!this.loadMgr().starId;
    const body = section('📖 His career', this.careerHelpRows(this.lastCareerState))
      + (isManager ? section("📋 You're the manager", this.managerHelpRows()) : '');
    ov.innerHTML = `<div class="tt-card set-card">`
      + `<div class="set-head"><div class="tt-title">📖 HOW TO PLAY</div><button class="set-x" aria-label="Close">✕</button></div>`
      + body + `</div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); document.removeEventListener('keydown', onEsc); };
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('.set-x')!.addEventListener('click', close);
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onEsc);
  }

  private syncMuteBtn() { const at = $('audio-toggle'); at.innerHTML = audio.isMuted() ? ICON_MUTED : ICON_SPEAKER; at.classList.toggle('muted', audio.isMuted()); }

  /** A generic yes/cancel confirm overlay (used for destructive actions like deleting a save). */
  private openConfirm(message: string, confirmLabel: string, onYes: () => void) {
    document.getElementById('confirm-ov')?.remove();
    const ov = document.createElement('div'); ov.id = 'confirm-ov';
    ov.innerHTML = `<div class="tt-card"><div class="tt-title">⚠ ARE YOU SURE?</div>`
      + `<div class="tt-sub" style="margin-bottom:6px">${message}</div>`
      + `<div class="cf-btns"><button id="cf-no">Cancel</button><button id="cf-yes" class="danger">${confirmLabel}</button></div></div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('#cf-no')!.addEventListener('click', close);
    ov.querySelector('#cf-yes')!.addEventListener('click', () => { close(); onYes(); });
  }

  /** The in-game pause/menu overlay (top-bar ≡ Menu). Resume is first and pre-focused (expected pause-menu
   *  order); quitting mid-match confirms first so progress isn't lost by accident. */
  private openPauseMenu() {
    document.getElementById('pause-ov')?.remove();
    const ov = document.createElement('div'); ov.id = 'pause-ov'; // id must match the remove() above so reopening replaces, not stacks (PT-79)
    ov.innerHTML = `<div class="tt-card"><div class="set-head"><div class="tt-title">⏸ PAUSED</div><button class="set-x" aria-label="Close">✕</button></div>`
      + `<button class="tt-opt" id="pm-resume"><b>▶ Resume</b><span>Back to the game</span></button>`
      + `<button class="tt-opt" id="pm-settings"><b>⚙ Settings</b><span>Music, motion, screen effects</span></button>`
      + `<button class="tt-opt" id="pm-quit"><b>≡ Quit to menu</b><span>Your progress is saved</span></button></div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); document.removeEventListener('keydown', onEsc); }; // clean up the ESC listener on every close path (PT-81)
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('.set-x')!.addEventListener('click', close);
    ov.querySelector('#pm-resume')!.addEventListener('click', close);
    ov.querySelector('#pm-settings')!.addEventListener('click', () => { close(); this.openSettings(); });
    ov.querySelector('#pm-quit')!.addEventListener('click', () => {
      const midMatch = !$('matchwrap').classList.contains('hidden') && this.engine && !this.engine.state.finished;
      close();
      if (midMatch) this.openConfirm('Quit to the menu <b>during a match</b>? This match won\'t be saved — your season is.', 'Quit to menu', () => this.quitToMenu());
      else this.quitToMenu();
    });
    (ov.querySelector('#pm-resume') as HTMLElement).focus(); // Resume pre-selected, Enter resumes
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } };
    document.addEventListener('keydown', onEsc);
  }
  private quitToMenu() { $('mm-saves').classList.remove('hidden'); this.showScreen('login'); this.renderMainMenu(); }

  /** New Game: silently create a local profile (no handle/password shown) and drop the player in. */
  private async startNewGame(rawName: string) {
    const name = cleanFamilyName(rawName); // PT-40/PT-78/PT-80: capitalise, title-case, strip injection chars
    if (!name) { toast('Enter a family name to begin your bloodline'); try { ($('mm-name') as HTMLInputElement).focus(); } catch { /* */ } return; } // PT-39: don't silently found "My Club"
    const handle = ((name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'club') + '-' + Math.random().toString(36).slice(2, 6)).toLowerCase();
    const password = Math.random().toString(36).slice(2) + 'Aa1'; // random; the player never sees or types it
    $('login-error').textContent = 'Creating your club…';
    try {
      const r = await api.register(handle, password, name);
      setToken(r.token);
      this.setMe({ account: r.account, club: r.club, standingOrders: r.standingOrders });
      const saves = this.loadSaves(); saves.push({ id: handle, token: r.token, name, lastPlayed: Date.now() }); this.saveSaves(saves);
      this.showScoutBoard(); // the FIRST decision: scout + pick your founding prospect (the unique hook)
    } catch { $('login-error').textContent = 'Could not create your club — please try again.'; }
  }

  /** The founding-prospect scouting board — the player's very first choice. Deliberately mysterious: a
   *  position, one glimpsed trait, a hedged note — never the true potential. You pick on a hunch; who he
   *  becomes is the payoff of developing him. */
  private async showScoutBoard() {
    this.showScreen('academy');
    audio.play('scout');
    $('academy-body').innerHTML = SPINNER;
    const ROLE_LABEL: Record<string, string> = { GK: 'a keeper', DF: 'a defender', MF: 'a midfielder', FW: 'a forward' };
    try {
      const { candidates } = await api.scoutProspects(3);
      const cards = candidates.map((c) => `<div class="scout-cand" data-seed="${c.seed}">`
        + `<div class="sc-head"><span class="sc-name">${c.name}</span><span class="sc-age">age 10</span></div>`
        + `<div class="sc-role">Looks like ${ROLE_LABEL[c.roleHint] ?? 'a player'} · <span class="sc-glimpse">${c.glimpse}</span></div>`
        + `<div class="sc-note">“${c.note}”</div>`
        + `<button class="primary sc-sign" data-seed="${c.seed}">Sign him →</button></div>`).join('');
      $('academy-body').innerHTML = `<div class="scout-board"><div class="scout-intro">`
        + `<b>Three kids are on trial.</b> They're ten years old — nobody can tell you how far any of them will go. `
        + `Trust your eye, pick the one to carry the family name, and <b>make</b> him into a star.</div>`
        + `<div class="scout-cands">${cards}</div></div>`;
      $('academy-body').querySelectorAll('.sc-sign').forEach((b) => b.addEventListener('click', () => this.signProspect(Number((b as HTMLElement).dataset.seed))));
    } catch { $('academy-body').innerHTML = '<div class="muted">Could not scout right now.</div>'; }
  }
  private async signProspect(seed: number) {
    try {
      const r = await api.signProspect(seed);
      this.onboarding = true; // now show the academy welcome, with his story ahead
      audio.chime('confirm');
      toast(`✍️ Signed ${r.prospect.name} — the bloodline begins`);
      this.showAcademy();
    } catch { toast('Could not sign him'); }
  }

  // ── achievements ──────────────────────────────────────────────────────────────────────────────
  private loadUnlockedAch(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem('fm_ach_' + (this.account?.handle ?? 'x')) || '[]')); } catch { return new Set(); }
  }
  private saveUnlockedAch(s: Set<string>) {
    try { localStorage.setItem('fm_ach_' + (this.account?.handle ?? 'x'), JSON.stringify([...s])); } catch { /* ignore */ }
  }
  /** Assemble the lifetime-progress snapshot the achievement predicates read, from data already tracked. */
  private async buildAchSnapshot(): Promise<AchSnapshot> {
    const m = this.loadMgr();
    const [pr, lg, pros, hon] = await Promise.all([
      api.prestige().catch(() => null as any),
      api.legends().catch(() => ({ legends: [] as any[] })),
      api.prospects().catch(() => ({ prospects: [] as any[] })),
      api.honours(1000).catch(() => ({ honours: [] as any[] })), // full lifetime ledger (not the cabinet's recent-30) so multi-generation title milestones count everything (PT-114)
    ]);
    const legends = lg.legends ?? [];
    const generation = Math.max(0, ...(pros.prospects ?? []).map((p: any) => p.generation ?? 0));
    const topLegendRating = legends.reduce((mx: number, l: any) => Math.max(mx, l.card?.legendRating ?? 0), 0);
    // LIFETIME title counts come from the persisted honours ledger (by kind), NOT the per-generation MgrState
    // — clearMgr() wipes m.titles/contTitles/wcWins at every succession, so reading them here left multi-gen
    // dynasty achievements (Kings of the League, A Dynasty Forms) permanently locked beside a cabinet that
    // already showed the lifetime total. Match the Trophy Room cabinet's kind buckets exactly (PT-114).
    const titleHonours = (hon.honours ?? []).filter((h: any) => h.title === 1);
    const isWorld = (k?: string) => k === 'world' || k === 'worldfinals';
    const leagueTitles = titleHonours.filter((h: any) => h.kind !== 'continental' && !isWorld(h.kind)).length;
    const contTitles = titleHonours.filter((h: any) => h.kind === 'continental').length;
    const wcWins = titleHonours.filter((h: any) => isWorld(h.kind)).length;
    return {
      leagueTitles,
      contTitles,
      wcWins,
      wcFinals: m.wcFinals ?? 0, // finals REACHED isn't a permanent honour (only titles are recorded); left per-generation
      seasons: pr?.record?.seasons ?? m.season ?? 0,
      wins: pr?.record?.wins ?? 0,
      prestigeIdx: pr?.prestige?.levelIdx ?? 0,
      generation,
      legends: legends.length,
      topLegendRating,
      graduated: (m.starId ? 1 : 0) + legends.length,
      // best division reached: the honours-derived high (lags a season) OR the live tier, so a promotion
      // registers the moment the club goes up (TIERS - clubTier maps tier 1→top idx, tier 10→0) (PT-121)
      topTier: Math.max(pr?.highestTierIdx ?? 0, TIERS - this.clubTier()),
    };
  }
  /** Re-evaluate achievements after a progress event; toast (and chime) anything newly earned. Idempotent. */
  private async checkAchievements(): Promise<void> {
    try {
      const earned = evaluateAchievements(await this.buildAchSnapshot());
      const have = this.loadUnlockedAch();
      const fresh = earned.filter((id) => !have.has(id));
      if (!fresh.length) return;
      fresh.forEach((id) => have.add(id));
      this.saveUnlockedAch(have);
      // stagger the toasts a touch so multiple unlocks in one event don't collapse into one
      fresh.forEach((id, i) => { const a = achievementById(id); if (!a) return; setTimeout(() => { toast(`${a.icon} Achievement unlocked — ${a.name}`); audio.chime('achievement'); }, i * 1400); });
    } catch { /* offline — try again on the next event */ }
  }

  private onboarding = false; // true right after New Game → academy shows a first-time welcome
  private injured = new Map<string, number>(); // playerId → matches remaining out
  private contracts: Record<string, ContractInfo> = {}; // NFT playerId → contract situation
  private season = 0;
  private setMe(me: { account: Account; club: Club; standingOrders: StandingOrders; injuries?: Array<{ player_id: string; matches_remaining: number }>; contracts?: Record<string, ContractInfo>; season?: number }) {
    this.account = me.account; this.club = me.club; this.standingOrders = me.standingOrders;
    this.injured = new Map((me.injuries ?? []).map((i) => [i.player_id, i.matches_remaining]));
    this.contracts = me.contracts ?? {};
    this.season = me.season ?? 0;
  }
  /** NFT players benched by a lapsed contract (unavailable for selection until extended). */
  private lapsed(): Set<string> {
    return new Set(Object.values(this.contracts).filter((c) => !c.available).map((c) => c.playerId));
  }
  /** The squad minus injured AND contract-lapsed players (who can't be fielded) — falls back to the
   *  full squad if benching them would leave fewer than 11, mirroring the server. */
  private availableClub(): Club {
    const out = this.lapsed();
    for (const id of this.injured.keys()) out.add(id);
    if (!out.size) return this.club;
    const healthy = this.club.players.filter((p) => !out.has(p.id));
    return healthy.length >= 11 ? { ...this.club, players: healthy } : this.club;
  }

  private showScreen(s: 'login' | 'hub' | 'lineup' | 'match' | 'scouting' | 'club' | 'academy' | 'trophies' | 'season') {
    for (const id of ['login', 'hub', 'lineup', 'matchwrap', 'scouting', 'club', 'academy', 'trophies', 'season']) $(id).classList.toggle('hidden', id !== (s === 'match' ? 'matchwrap' : s));
    $('logout').classList.toggle('hidden', s === 'login');
    $('app-title').classList.toggle('hidden', s === 'login'); // menu shows the big title already — no duplicate brand
    $('app-title').classList.toggle('clickable', s !== 'login'); // title is "home" once you're in
    if (s !== 'scouting' && this.missionTimer) { clearInterval(this.missionTimer); this.missionTimer = null; } // stop the mission countdown when leaving
    // MUSIC — base track per screen (career-moment screens get refined in renderCareer; retirement/title
    // beats override at their event). Deferred contexts (scout/bigmatch/emotional) fall back gracefully.
    const CTX: Record<typeof s, import('./audio').MusicContext> = { login: 'menu', hub: 'hub', lineup: 'hub', match: 'match', scouting: 'career', club: 'hub', academy: 'career', trophies: 'legends', season: 'hub' };
    audio.play(CTX[s]);
    // ambient pixel backdrop per screen (sits far behind the panels; see #scene-backdrop CSS)
    const SCENE: Record<typeof s, string> = { login: 'stadium', hub: 'office', lineup: 'dressingroom', match: 'stadium', scouting: 'scouting', club: 'dressingroom', academy: 'academy', trophies: 'trophyroom', season: 'pitch' };
    const bg = document.getElementById('scene-backdrop');
    if (bg) bg.style.backgroundImage = `url(/scenes/scene-${SCENE[s]}.png)`;
  }

  private wireStaticButtons() {
    // MUSIC mute toggle (persists via audio.ts; icon reflects state)
    const at = $('audio-toggle');
    const syncAudio = () => { at.innerHTML = audio.isMuted() ? ICON_MUTED : ICON_SPEAKER; at.classList.toggle('muted', audio.isMuted()); };
    syncAudio();
    at.addEventListener('click', () => { audio.toggleMuted(); syncAudio(); });
    $('settings-btn').addEventListener('click', () => this.openSettings());
    const setSpeed = (v: number, id: string) => { this.speed = v; ['spd1', 'spd4', 'spd12'].forEach((b) => $(b).classList.remove('active')); $(id).classList.add('active'); };
    $('spd1').addEventListener('click', () => setSpeed(1, 'spd1'));
    $('spd4').addEventListener('click', () => setSpeed(4, 'spd4'));
    $('spd12').addEventListener('click', () => setSpeed(12, 'spd12'));
    $('toggle-density').addEventListener('click', () => {
      this.commentaryMode = this.commentaryMode === 'full' ? 'key' : 'full';
      $('toggle-density').textContent = this.commentaryMode === 'full' ? '🎙️ Full' : '🎙️ Key';
      $('toggle-density').classList.toggle('on', this.commentaryMode === 'key');
    });
    // live preview of the in-game club name + crest as you type (the club becomes "<name>'s Club")
    const updateNamePreview = () => {
      const raw = cleanFamilyName(($('mm-name') as HTMLInputElement).value); // preview matches the saved name exactly (PT-40/PT-78/PT-80)
      $('mm-preview').innerHTML = raw
        ? `<span class="mp-hint">Your club:</span> ${crest(raw + "'s Club", 26)} <b>${raw}'s Club</b> <span class="mp-hint">· the ${raw} bloodline</span>`
        : `<span class="mp-hint">Enter a family name — your club becomes “&lt;name&gt;'s Club” and the name carries down the generations.</span>`;
    };
    $('mm-new').addEventListener('click', () => { $('mm-buttons').classList.add('hidden'); $('mm-saves').classList.add('hidden'); $('mm-newgame').classList.remove('hidden'); ($('mm-name') as HTMLInputElement).focus(); updateNamePreview(); });
    $('mm-cancel').addEventListener('click', () => { $('mm-saves').classList.remove('hidden'); this.renderMainMenu(); });
    $('mm-name').addEventListener('input', updateNamePreview);
    $('mm-start').addEventListener('click', () => this.startNewGame(($('mm-name') as HTMLInputElement).value));
    $('mm-name').addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') this.startNewGame(($('mm-name') as HTMLInputElement).value); });
    $('mm-continue').addEventListener('click', () => this.continueGame());
    $('logout').addEventListener('click', () => this.openPauseMenu()); // ≡ Menu → pause overlay (Resume / Settings / Quit-to-menu, with confirm mid-match)
    // match keyboard shortcuts: 1/2/3 speed, space pause/resume, s skip, c cycle commentary detail
    document.addEventListener('keydown', (ev) => {
      const k = (ev as KeyboardEvent).key;
      if ($('matchwrap').classList.contains('hidden') || !this.engine || this.engine.state.finished) return;
      const tag = (ev.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (k === '1') setSpeed(1, 'spd1');
      else if (k === '2') setSpeed(4, 'spd4');
      else if (k === '3') setSpeed(12, 'spd12');
      else if (k === ' ') { ev.preventDefault(); this.running = !this.running; toast(this.running ? '▶ Resumed' : '⏸ Paused'); }
      else if (k === 's' || k === 'S') this.skipToEnd();
      else if (k === 'c' || k === 'C') $('toggle-density').click();
    });
    // manager screens (scouting/club) keep their own back→home handlers, but the forward entries
    // are NOT wired from the home: the game is one linear life, not parallel menus.
    $('scouting-back').addEventListener('click', () => this.showHub());
    $('view-trophies').addEventListener('click', () => this.showTrophyRoom());
    $('trophies-back').addEventListener('click', () => this.showHub());
    // unified home: one Club & Dynasty hub, no mode wall
    $('hub-academy').addEventListener('click', () => this.showAcademy());
    $('view-club').addEventListener('click', () => this.showClub()); // the club-facilities coin sink (dynasty-building, not the gated match loop)
    $('season-back').addEventListener('click', () => this.showHub());
    ($('hub-season-dev') as any)?.addEventListener('click', () => this.showSeason()); // TEMP entry until the handoff wires it
    $('app-title').addEventListener('click', () => { if (hasToken()) void this.showHub(); });
    $('academy-back').addEventListener('click', () => this.showHub());
    $('club-back').addEventListener('click', () => this.showHub());
    $('skip').addEventListener('click', () => this.skipToEnd());
    // ('set-team' lives in the manager layer, unlinked from the home for now — see linear-life note in showHub)
    $('autopick').addEventListener('click', () => { this.draftLineup = this.starGuarded(autoPickXI(this.availableClub(), this.draftTactics.formation)); this.rebuildDuties(); this.renderLineupEditor(); });
    $('save-team').addEventListener('click', () => (this.editorMode === 'standing' ? this.saveTeam() : this.kickOffMatch()));
    $('lineup-back').addEventListener('click', () => this.showHub());
    $('toggle-squad').addEventListener('click', () => {
      const panel = $('squad-panel');
      const show = panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !show);
      $('toggle-squad').textContent = show ? '▤ Hide squad stats' : '▤ View full squad stats';
      if (show) this.renderSquadPanel();
    });
  }


  /** A premium collectible card for an NFT star — tier-framed, holographic on the top
   *  tiers. Used both for the mint reveal and for clicking a star to admire it. */
  private showPlayerCard(p: Player, minted = false) {
    const tier = nftTier(overall(p));
    const tokenId = p.id.startsWith('nft:') ? p.id.slice(4) : '';
    const roleName: Record<string, string> = { GK: 'Keeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' };
    const order: Array<[keyof Player['attrs'], string]> = [
      ['pace', 'PAC'], ['shooting', 'SHO'], ['passing', 'PAS'], ['positioning', 'POS'],
      ['tackling', 'TAC'], ['strength', 'STR'], ['workrate', 'WRK'], ['keeping', 'KEE'],
      ['setPiece', 'SET'], ['stamina', 'STA'],
    ];
    const stats = order.map(([k, l]) => `<div class="pc-stat" title="${STAT_FULL[k] ?? k}"><span>${l}</span><b style="color:${statColor(p.attrs[k] ?? 0)}">${Math.round(p.attrs[k] ?? 0)}</b></div>`).join('');
    // FX escalate with tier: sheen from Silver, rotating glow ring + sparkles from Gold up.
    const sparkCount = { bronze: 0, silver: 3, gold: 6, diamond: 10, legend: 16 }[tier.key] ?? 0;
    const sparks = Array.from({ length: sparkCount }, () => {
      const x = Math.round(Math.random() * 90) + 5, y = Math.round(Math.random() * 86) + 7;
      const delay = (Math.random() * 2).toFixed(2), dur = (0.8 + Math.random() * 0.9).toFixed(2);
      return `<i class="pc-spark" style="left:${x}%;top:${y}%;animation-delay:${delay}s;animation-duration:${dur}s">✦</i>`;
    }).join('');
    const ring = tier.key === 'gold' || tier.key === 'diamond' || tier.key === 'legend' ? '<div class="pc-ring"></div>' : '';
    // contract situation (NFT players only): age, deal status, extend/sell — the NFT stays owned either way
    const ci = this.contracts[p.id];
    const stakeHtml = ci ? (ci.staked
      ? `<div class="pc-stake">📋 registered ${ci.stakedSeasons} season${ci.stakedSeasons === 1 ? '' : 's'} — long service earns him a loyalty discount · <a class="pc-link" data-stake="off" data-pid="${p.id}">withdraw from the squad</a></div>`
      : `<div class="pc-stake">⭘ not registered — <a class="pc-link" data-stake="on" data-pid="${p.id}">register him for the season</a></div>`) : '';
    let contractHtml = '';
    // NOTE: single-player has no 'retired' token state — succession goes pro→prospect directly via rebornFields,
    // so the old NFT-era "retired keepsake + Reborn" card branch was unreachable and has been removed (PT-115).
    if (ci) {
      contractHtml = `<div class="pc-contract${ci.available ? '' : ' lapsed'}">`
        + `<div class="pc-crow"><span>Age ${ci.age}${ci.age >= 39 ? ' · nearing retirement' : ''}</span>`
        + `<span>${ci.available ? `<span class="ico-inline ico-lg">${sprite('contract')}</span> ${ci.seasonsLeft} season${ci.seasonsLeft === 1 ? '' : 's'} left` : ci.staked === false ? '⭘ not registered — he can’t play' : '⛔ contract lapsed — benched'}</span></div>`
        + (ci.morale != null ? `<div class="pc-morale"><i>morale</i><span class="pc-mbg"><b style="width:${ci.morale}%"></b></span><span>${ci.moraleLabel}</span></div>` : '')
        // show the TOTAL cost (wage × length), not one season's wage — talks charge the whole deal (PT-32/PT-124)
        + `<div class="pc-cactions"><button class="pc-extend" data-extend="${p.id}"><span class="ico-inline ico-lg">${sprite('seal')}</span> ${ci.available ? 'Re-sign' : 'Extend'} · ~${(ci.extendCost * ci.lengthSeasons).toLocaleString()}c over ${ci.lengthSeasons}y</button>`
        // the bloodline star has no release-clause sale path in single-player — he leaves only via a rival's bid (PT-125)
        + (isNftId(p.id) ? `<span class="pc-sell">leaves only via a rival bid</span>` : `<span class="pc-sell">worth ~${ci.sellValue}c</span>`) + `</div>` + stakeHtml + `</div>`;
    }
    const el = document.createElement('div');
    el.id = 'player-card-ov';
    el.innerHTML =
      `<div class="pc-card tier-${tier.key}">`
      + ring + '<div class="pc-burst"></div>' + sparks
      + (minted ? `<div class="pc-flash">${tierIconHtml(tier)} TURNED PRO · ${tier.name}</div>` : '')
      + `<div class="pc-top"><div class="pc-ovr">${overall(p)}<span>OVR</span></div>`
      + `<div class="pc-tier">${tierIconHtml(tier)}<span>${tier.name}</span></div></div>`
      + `<div class="pc-crest role-${p.role}">${portraitImg(p.name, bandForAge((p as any).age), 84)}<span class="pc-crest-role">${p.role}</span></div>`
      + `<div class="pc-name">${p.name}</div>`
      + `<div class="pc-role">${roleName[p.role] ?? p.role}</div>`
      + `<div class="pc-stats">${stats}</div>`
      + this.careerRecordHtml(p)
      + this.characterHtml(p)
      + contractHtml
      + `<div class="pc-foot">★ ${tier.name}${tokenId ? ` · #${tokenId}` : ''}${!ci && (p as any).age ? ` · age ${(p as any).age}` : ''}</div>` // squad players carry their own age (the star's shows in the contract block)
      + `<button class="pc-close">${minted ? 'Nice ✓' : 'Close'}</button></div>`;
    el.addEventListener('click', async (e) => {
      const t = e.target as HTMLElement;
      if (t.dataset.extend) { await this.extendPlayer(t.dataset.extend); el.remove(); return; }
      if (t.dataset.stake) { el.remove(); await this.stakePlayer(t.dataset.pid!, t.dataset.stake === 'on'); return; }
      if (t === el || t.classList.contains('pc-close')) el.remove();
    });
    document.body.appendChild(el);
  }

  /** A prospect card — a 10-year-old about to live his career. For an heir (gen > 0) this is the payoff
   *  beat of the whole dynasty loop: the family name carries on, and you can develop him on the spot. */
  private showProspectCard(p: import('./api').Prospect, born = false) {
    const stars = '★'.repeat(p.potentialStars) + '☆'.repeat(5 - p.potentialStars);
    const gen = p.generation ?? 0;
    const isGenesis = gen === 0;
    const surname = p.name.trim().split(/\s+/).slice(1).join(' ') || p.name;
    const el = document.createElement('div');
    el.id = 'player-card-ov';
    el.innerHTML = `<div class="pc-card tier-bronze">`
      + `<div class="pc-top"><div class="pc-ovr">10<span>YRS</span></div><div class="pc-tier">🌱<span>PROSPECT</span></div></div>`
      + `<div class="pc-crest role-${p.roleHint}">${portraitImg(p.name, 'youth', 84)}<span class="pc-crest-role">${p.roleHint}</span></div>`
      + `<div class="pc-name">${p.name}</div><div class="pc-role">Youth Prospect${gen ? ` · gen ${gen + 1}` : ''}</div>`
      + (born ? `<div class="pc-flash">${isGenesis ? '🌱 A NEW BLOODLINE BEGINS' : `🌳 THE ${surname.toUpperCase()} NAME LIVES ON`}</div>` : '')
      + `<div class="pc-contract retired"><div class="pc-legend">Potential ${stars} · ${pedigreeText(p.pedigree, gen)}</div>`
      + (gen ? `<div class="pc-stake">Generation ${gen + 1} of the bloodline — a fresh 10-year-old carrying the family name into a whole new career.</div>` : '')
      + (p.note ? `<div class="pc-stake">${p.note}</div>` : '')
      + `</div>`
      + `<div class="pc-foot">🌱 Youth prospect · his story starts at age 10</div>`
      + `<div class="pc-cta"><button class="pc-dev primary" data-dev="${p.id}">Develop him →</button><button class="pc-close">${born ? 'Later' : 'Close'}</button></div></div>`;
    el.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.dataset.dev) { el.remove(); void this.openCareer(t.dataset.dev); return; }
      if (t === el || t.classList.contains('pc-close')) el.remove();
    });
    document.body.appendChild(el);
  }

  /** A lifecycle-at-a-glance panel for the manager's NFT stars — age, contract, morale, staking + quick actions. */
  private nftStatusHtml(): string {
    const nfts = Object.values(this.contracts);
    if (!nfts.length) return '';
    const rows = nfts.map((ci) => {
      const name = this.club.players.find((x) => x.id === ci.playerId)?.name ?? ci.playerId;
      const status = ci.staked === false ? `<span class="ns-tag idle">idle</span>`
        : ci.available ? `<span class="ns-tag ${ci.seasonsLeft <= 1 ? 'warn' : 'ok'}">${ci.seasonsLeft}y left</span>`
        : `<span class="ns-tag lapsed">lapsed</span>`;
      const dot = ci.morale != null ? `<span class="ns-mood" title="morale: ${ci.moraleLabel}" style="background:${ci.morale >= 75 ? '#6ad06a' : ci.morale >= 45 ? '#e0c14a' : '#d06a6a'}"></span>` : '';
      const act = ci.staked === false ? `<button class="ns-act" data-nstake="${ci.playerId}">Register</button>`
        : `<button class="ns-act" data-nextend="${ci.playerId}">${ci.available ? 'Re-sign' : 'Extend'} ~${(ci.extendCost * ci.lengthSeasons).toLocaleString()}c</button>`; // total deal cost (wage × length), not one season (PT-124)
      return `<div class="ns-row" data-open="${ci.playerId}"><span class="ns-name">${dot}${name}</span><span class="ns-age">${ci.age}y</span>${status}${act}</div>`;
    }).join('');
    return `<div class="nft-status"><div class="ns-head">⭐ YOUR STARS — lifecycle at a glance</div>${rows}</div>`;
  }

  /** Register / withdraw a pro (registered = eligible to play + accrues loyalty tenure).
   *  "Stake/unstake" was leftover web3 vocabulary for a squad-REGISTRATION mechanic, explained nowhere and
   *  meaning nothing to a football player. The data field keeps its name — renaming it would need a save
   *  migration — but nothing the player reads says "stake" any more. (PT-506) */
  private async stakePlayer(playerId: string, on: boolean) {
    try {
      await api.stake(playerId, on);
      toast(on ? 'Registered — he can play' : 'Withdrawn — he’s out of the squad');
      this.setMe(await api.me());
      await this.showHub();
      const p = this.club.players.find((x) => x.id === playerId);
      if (p) this.showPlayerCard(p);
    } catch (e: any) { toast(e?.body?.error ?? 'Failed'); }
  }

  /** The NFT's character: temperament, earned traits, and financial nature — the soul of the player. */
  /** Permanent career record for an NFT player (goals/assists/POTM/apps banked across matches). */
  private careerRecordHtml(p: Player): string {
    const ci = this.contracts[p.id];
    if (!ci || (ci.careerApps ?? 0) === 0) return '';
    const g = ci.careerGoals ?? 0, a = ci.careerAssists ?? 0, m = ci.careerPotm ?? 0, ap = ci.careerApps ?? 0;
    return `<div class="pc-career"><span class="pc-career-lbl">CAREER</span>`
      + `<span class="pc-cstat"><b>${g}</b> goals</span>`
      + `<span class="pc-cstat"><b>${a}</b> assists</span>`
      + `<span class="pc-cstat"><b>${m}</b> ★</span>`
      + `<span class="pc-cstat"><b>${ap}</b> apps</span></div>`;
  }
  private characterHtml(p: Player): string {
    const pers = (p as any).personality as string | undefined;
    const traits = ((p as any).traits as string[] | undefined) ?? [];
    const greed = (p as any).greed as number | undefined;
    const market = (p as any).marketability as number | undefined;
    const earnings = (p as any).earnings as number | undefined;
    if (!pers && !traits.length && greed == null) return ''; // nothing to show (e.g. a legacy save's filler)
    // every personality the game can roll — squad players are full characters now, so an unmapped id would
    // surface as a raw slug on their card (Living Squad)
    const PERS: Record<string, string> = { pro: 'Model Pro', biggame: 'Big-Game Player', fragile: 'Fragile', leader: 'Born Leader', workhorse: 'Workhorse', mercurial: 'Mercurial', maverick: 'Maverick', latebloom: 'Late Bloomer', showman: 'Showman', stoic: 'The Stoic', hothead: 'Hothead', perfectionist: 'Perfectionist', joker: 'Dressing-Room Joker' };
    const TRAIT: Record<string, string> = { clinical: 'Clinical Finisher', ballwinner: 'Ball-Winner', metronome: 'Metronome', maestro: 'Creative Maestro', leader: 'Born Leader', livewire: 'Livewire', ironman: 'Iron Man', deadball: 'Dead-Ball Spec.', wall: 'The Wall', biggame: 'Big-Game', engine: 'Box-to-Box Engine', rock: 'Defensive Rock', spark: 'The Spark', aerial: 'Aerial Threat', general2: 'Engine-Room General', showstopper: 'Showstopper', ironwill: 'Iron Will', quarterback: 'The Quarterback', utility: 'Utility Man', injury_prone: 'Injury-Prone', mercenary: 'Mercenary', loyal: 'One-Club Man', marketable: 'Marketable' };
    const flaws = new Set(['injury_prone', 'mercenary', 'loyal', 'marketable']);
    const perks = traits.filter((t) => !flaws.has(t)).map((t) => `<span class="pc-trait perk">${TRAIT[t] ?? t}</span>`);
    const flags = traits.filter((t) => flaws.has(t)).map((t) => `<span class="pc-trait flag">${TRAIT[t] ?? t}</span>`);
    const bar = (label: string, v: number, cls: string) => `<span class="pc-cbar"><i>${label}</i><span class="pc-cbg"><b class="${cls}" style="width:${v * 5}%"></b></span></span>`;
    return `<div class="pc-char">`
      + (pers ? `<div class="pc-crow2">🧠 <b>${PERS[pers] ?? pers}</b></div>` : '')
      + (perks.length || flags.length ? `<div class="pc-traits2">${perks.join('')}${flags.join('')}</div>` : '')
      + `<div class="pc-cbars">${greed != null ? bar('greed', greed, 'g') : ''}${market != null ? bar('fame', market, 'm') : ''}</div>`
      + (earnings ? `<div class="pc-earn">💷 ${earnings.toLocaleString()}c career earnings</div>` : '')
      + `</div>`;
  }

  /** Pay to extend (re-sign) an NFT player's contract, then refresh the squad + reopen the card. */
  private extendPlayer(playerId: string) { this.openContractNegotiation(playerId); } // re-sign now goes through negotiation

  /** Contract-talks modal: pick a deal LENGTH, see his asking wage for it, then make an offer he
   *  accepts / counters / rejects. A longer deal costs more for a mercenary, less for a loyal one. */
  private async openContractNegotiation(playerId: string) {
    let info: Awaited<ReturnType<typeof api.starContractInfo>>;
    try { info = await api.starContractInfo(playerId); } catch { toast('Can’t open talks right now'); return; }
    const demand = { baseWage: info.baseWage, prefLength: info.prefLength, minLength: info.minLength, maxLength: info.maxLength, lengthPremium: info.lengthPremium };
    const name = this.club.players.find((x) => x.id === playerId)?.name ?? 'the player';
    let length = demand.prefLength;
    document.getElementById('settings-ov')?.remove();
    const ov = document.createElement('div'); ov.id = 'settings-ov';
    ov.innerHTML = `<div class="tt-card cn-card"><div class="set-head"><div class="tt-title">✍️ CONTRACT TALKS — ${name}</div><button class="set-x" aria-label="Close">✕</button></div><div id="cn-body"></div></div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('.set-x')!.addEventListener('click', close);
    const render = () => {
      const body = document.getElementById('cn-body'); if (!body) return;
      const ask = wageForLength(demand, length); // per-season wage he wants for a deal this long
      // buttons pass the per-SEASON wage (that's what he judges), but show the TOTAL cost (wage × length) so
      // a longer deal visibly costs more (PT-32). Multipliers span all outcomes (PT-33): 0.8 insults him
      // (reject), 0.92 makes him counter, 1.0 he accepts, 1.18 delights him (accept + bigger morale/loyalty).
      const coins = this.account?.coins ?? 0;
      const offer = (label: string, mult: number, hint: string, cls = '') => {
        const w = Math.round(ask * mult);
        const total = w * length;
        const afford = total <= coins; // disable an offer you can't pay the total for, up front (PT-63)
        return `<button class="cn-offer ${cls}${afford ? '' : ' cn-locked'}"${afford ? ` data-wage="${w}"` : ' disabled'}><span class="cn-o-lbl">${label}</span><span class="cn-o-tot">${total.toLocaleString()}c total</span><span class="cn-o-hint">${afford ? hint : `🔒 need ${(total - coins).toLocaleString()}c more`}</span></button>`;
      };
      body.innerHTML = `<div class="cn-sub">He’d prefer a <b>${demand.prefLength}-season</b> deal — a longer one asks ${demand.lengthPremium >= 0 ? 'a <b>higher</b> wage per season (he wants paid for the commitment)' : 'a <b>lower</b> wage per season (he values the security)'}, and every extra season adds to the <b>total</b> you pay now.</div>`
        + `<div class="cn-row"><span class="cn-lbl">Deal length</span><div class="cn-len">${[2, 3, 4, 5, 6].map((L) => `<button class="cn-l ${L === length ? 'active' : ''}" data-len="${L}">${L}y</button>`).join('')}</div></div>`
        + `<div class="cn-ask">He’s asking <b>${ask.toLocaleString()}c/season</b> — <b>${(ask * length).toLocaleString()}c</b> over ${length} seasons. <span class="cn-coins">💷 you have ${coins.toLocaleString()}c</span></div>`
        + `<div class="cn-offers">`
        + offer('Lowball', 0.8, 'he may walk')
        + offer('Haggle', 0.92, 'he’ll push back')
        + offer('Meet it', 1.0, 'deal done', 'primary')
        + offer('Generous', 1.18, 'delighted + loyal')
        + `</div>`
        + `<div class="cn-result" id="cn-result"></div>`;
      body.querySelectorAll('[data-len]').forEach((b) => b.addEventListener('click', () => { length = Number((b as HTMLElement).dataset.len); render(); }));
      body.querySelectorAll('[data-wage]').forEach((b) => b.addEventListener('click', () => this.submitContractOffer(playerId, Number((b as HTMLElement).dataset.wage), length, close)));
    };
    render();
  }
  private async submitContractOffer(playerId: string, wage: number, length: number, close: () => void) {
    try {
      const r = await api.negotiateStar(playerId, wage, length);
      if (r.coins != null && this.account) this.account.coins = r.coins;
      if (r.outcome === 'accept') {
        audio.chime('success');
        toast(`✍️ ${r.note} · ${length}-season deal · −${(wage * length).toLocaleString()}c`); // the total charged (wage × length), matching the modal — not the per-season wage (PT-61)
        this.setMe(await api.me()); close();
      } else {
        const res = document.getElementById('cn-result');
        if (res) res.innerHTML = `<div class="cn-${r.outcome}">${r.outcome === 'reject' ? '❌' : '🤝'} ${r.note}${r.outcome === 'counter' ? ` He’s holding out for <b>${r.askWage.toLocaleString()}c</b>.` : ''}</div>`;
      }
    } catch (e: any) { toast(e?.body?.error === 'not enough coins' ? `Not enough coins (need ${e.body.need})` : 'Talks broke down'); }
  }

  /** The manager's own legacy — rank + title, from titles/wins/tier. Shown as a hub chip. */
  private async refreshPrestige() {
    try {
      const { prestige: pr } = await api.prestige();
      const el = $('me-prestige');
      el.classList.remove('hidden');
      el.textContent = `${pr.icon} ${pr.title}`;
      el.onclick = () => this.showPrestigeCard(pr);
    } catch { $('me-prestige').classList.add('hidden'); }
  }

  private async refreshDiary() {
    try {
      let entry: string;
      const m = this.loadMgr();
      if (m.starId && this.club) {
        // MANAGER PHASE: feed the diary the REAL local season — results + live table — so it narrates
        // form, win streaks, promotion/relegation watch etc. (rebuilt offline; the old PvP feed is gone).
        const results = m.results ?? [];
        const t = liveTable(this.club.name, this.clubLeagueStrength(), 1, this.leagueSeed(), results, this.clubTier(), this.seasonResultSeed());
        const matches = results.map((r, i) => ({ id: `s${m.season}-m${i}`, myScore: r.myGoals, oppScore: r.oppGoals, oppId: '', oppHandle: '', createdAt: i }));
        const dtier = this.clubTier(); // tier-aware promotion/relegation spots so the diary matches spTableHtml's zones + the real rule, not a tier-blind top-3/bottom-2 (PT-120)
        const table = { position: t.pos, total: t.size, promote: dtier === 1 ? 3 : 2, relegate: dtier < TIERS ? 2 : 0, points: t.me.Pts, topFlight: dtier === 1 }; // top flight → continental/title wording, not "promotion" (PT-138)
        entry = gaffersDiaryEntry({ seasonNumber: m.season, matches, table });
      } else {
        entry = (await api.diary()).entry; // player-career phase: the generic blank-page line
      }
      $('gaffers-diary-text').textContent = entry;
      $('gaffers-diary').classList.toggle('hidden', !entry);
    } catch { $('gaffers-diary').classList.add('hidden'); }
  }

  private showPrestigeCard(pr: { score: number; title: string; icon: string; nextTitle: string | null; nextAt: number | null; progress: number; leagueTitles: number; cupTitles: number }) {
    const el = document.createElement('div');
    el.id = 'player-card-ov';
    el.innerHTML = `<div class="pc-card tier-gold">`
      + `<div class="pc-top"><div class="pc-ovr">${pr.score}<span>PRESTIGE</span></div><div class="pc-tier">${pr.icon}<span>GAFFER</span></div></div>`
      + `<div class="pc-name">${pr.title}</div><div class="pc-role">Manager legacy</div>`
      + `<div class="pc-char"><div class="pc-crow2">🏅 ${pr.leagueTitles} league · 🏆 ${pr.cupTitles} cup</div>`
      + (pr.nextTitle ? `<div class="pc-cbars"><span class="pc-cbar" style="flex:1"><i>→ ${pr.nextTitle}</i><span class="pc-cbg" style="width:80px"><b class="m" style="width:${Math.round(pr.progress * 100)}%"></b></span></span></div>` : `<div class="pc-earn">the pinnacle — an immortal gaffer</div>`)
      + `</div><div class="pc-foot">Earned across your whole managerial career — and it's what the board measures you against: the more you've won, the more they expect of next season.</div>`
      + `<button class="pc-close">Close</button></div>`;
    el.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t === el || t.classList.contains('pc-close')) el.remove(); });
    document.body.appendChild(el);
  }

  // ---- hub ----
  private async showHub() {
    this.showScreen('hub');
    ($('hub-club').querySelector('.legacy-ico') as HTMLElement).innerHTML = sprite('stadium');
    ($('hub-legacy').querySelector('.legacy-ico') as HTMLElement).innerHTML = sprite('trophy');
    $('me-name').innerHTML = `<span class="me-crest">${crest(this.club.name, 22)}</span>${this.club.name}<img class="me-kit" width="20" height="20" alt="" />`;
    // recolor the club's kit template to its own crest colours, then drop it in (async, best-effort)
    void (async () => {
      try {
        const { primary, accent } = crestColors(this.club!.name);
        const url = await recolorKit(kitTemplate(this.club!.name), primary, accent);
        const el = $('me-name').querySelector('.me-kit') as HTMLImageElement | null;
        if (el) el.src = url; else return;
      } catch { /* leave the empty kit img (it shows nothing) */ }
    })();
    $('me-rating').textContent = ''; // PvP ELO — hidden: the game is single-player (multiplayer removed, see direction.md)
    if (this.account.coins != null) {
      $('me-coins').innerHTML = `<span class="ico-inline">${sprite('coin')}</span> ${this.account.coins}`;
      $('hub-club-sub').textContent = `💰 ${this.account.coins.toLocaleString()} to invest — facilities, youth & scouting. Levels are permanent.`;
    }
    void this.refreshPrestige();
    void this.refreshDiary();
    void this.refreshHubPlayer();
    void this.refreshHubLegacy();
  }

  // NOTE: the game is one LINEAR single-player life — you live the bloodline player's career; running the
  // club is a later stage of that same timeline, not a parallel menu. Multiplayer/async-PvP has been REMOVED
  // (with web3): the PvP-facing screens (standings/leaderboard, player transfer market, opponent scouting,
  // matchmaking/fixtures) are intentionally UNLINKED — dead code kept only for reference, slated for deletion
  // in the planned full-offline migration (server logic → @fm/shared + local saves). See docs/direction.md.
  // Do not re-surface them. Single-player content (own youth academy, facilities, season, trophy room) stays.

  /** The "Your Player" block on the home hub — the bloodline you're living, inline with a develop/continue CTA. */
  private async refreshHubPlayer() {
    const el = $('hub-player');
    // MANAGER PHASE: you've handed off — the home shows the managed star + Continue the season.
    const mgr = this.loadMgr();
    if (mgr.starId) {
      const seed = this.leagueSeed();
      const total = seasonFixtures(this.club?.name ?? "club", seed, this.clubTier()).length;
      const md = Math.min(mgr.results.length, total);
      el.innerHTML = `<div class="hub-prow"><div class="hp-main"><div class="hp-name">🧢 Managing ${this.club?.name ?? 'your club'} <span class="hp-stars">★ ${mgr.starName} on the pitch</span></div>`
        + `<div class="hp-meta">Season ${mgr.season} · Matchday ${Math.min(md + 1, total)}/${total}${mgr.starAge ? ` · ${mgr.starName} is ${mgr.starAge}` : ''}</div></div>`
        + `<button class="primary hp-go" id="hub-continue-season">Continue the season →</button></div>`;
      $('hub-continue-season').addEventListener('click', () => this.showSeason());
      return;
    }
    el.innerHTML = SPINNER;
    try {
      const { prospects } = await api.prospects();
      if (!prospects.length) {
        el.innerHTML = `<div class="hub-prow scout"><div class="hp-main"><div class="hp-name">🌱 No prospect yet</div>`
          + `<div class="hp-meta">Scout a 10-year-old and live his whole career — the heart of your dynasty.</div></div>`
          + `<button id="hub-scout" class="primary hp-go">🔎 Scout a prospect →</button></div>`;
        $('hub-scout').addEventListener('click', () => this.showAcademy());
        return;
      }
      // active bloodline = the one already in development, else the newest prospect
      const active = prospects.find((p) => p.careerStarted) ?? prospects[prospects.length - 1];
      const stars = '★'.repeat(active.potentialStars) + '☆'.repeat(5 - active.potentialStars);
      const gen = active.generation ? ` · gen ${active.generation + 1}` : ''; // 1-indexed to match the Bloodline Tree (founder = gen 1) (PT-136)
      const more = prospects.length > 1 ? `<div class="hp-meta" style="margin-top:6px;">+${prospects.length - 1} more in the academy</div>` : '';
      el.innerHTML = `<div class="hub-prow"><div class="hp-main"><div class="hp-name">🌱 ${active.name} <span class="hp-stars">${stars}</span></div>`
        + `<div class="hp-meta">${active.roleHint}${gen} · ${pedigreeText(active.pedigree, active.generation)} ${active.careerStarted ? '· in development' : '· age 10, ready to develop'}</div>${more}</div>`
        + `<button class="primary hp-go" data-dev="${active.id}">${active.careerStarted ? 'Continue his story' : 'Develop'} →</button></div>`;
      el.querySelector('[data-dev]')!.addEventListener('click', () => this.openCareer(active.id));
    } catch { el.innerHTML = '<div class="muted">Could not load your player — please try again.</div>'; }
  }

  /** The Dynasty & Trophy Room summary line on the home hub. */
  private async refreshHubLegacy() {
    try {
      const [h, l] = await Promise.all([api.honours().catch(() => ({ honours: [] })), api.legends().catch(() => ({ legends: [] }))]);
      const titles = h.honours.filter((x) => x.title === 1).length;
      const lines = new Set(l.legends.map((x) => x.playerId)).size;
      if (titles || lines || l.legends.length) {
        $('hub-legacy-sub').textContent = `🏆 ${titles} title${titles === 1 ? '' : 's'} · 🌳 ${lines} bloodline${lines === 1 ? '' : 's'} · ⭐ ${l.legends.length} legend${l.legends.length === 1 ? '' : 's'}`;
      } else {
        $('hub-legacy-sub').textContent = 'Your bloodlines, silverware and retired numbers.';
      }
    } catch { /* leave default text */ }
  }

  // ── SINGLE-PLAYER MANAGER SEASON: play the club's fixtures one at a time vs the seeded fictional league ──
  private mgrKey() { return 'fm_mgr_' + (this.account?.handle ?? ''); }
  private loadMgr(): MgrState {
    try {
      const m = JSON.parse(localStorage.getItem(this.mgrKey()) || '');
      if (m && Array.isArray(m.results)) {
        // Rehydrate the squad report so a refresh mid-decision doesn't lose the renew calls still to be
        // made. Only for the season it was written in — an older one is exactly the stale panel PT-807
        // was about, and showing it again here would reintroduce the bug through the back door.
        if (m.squadReport && m.squadReportSeason === m.season && !this.pendingSquadReport) {
          this.pendingSquadReport = m.squadReport;
        }
        return m;
      }
    } catch { /* fall through */ }
    return { season: 1, results: [] };
  }
  private saveMgr(m: MgrState) { try { localStorage.setItem(this.mgrKey(), JSON.stringify(m)); } catch { /* ignore */ } }
  private planKey(): string { return `fm_plan_${this.account?.handle ?? 'x'}`; }
  private loadPlan(): Set<string> {
    try { const raw = localStorage.getItem(this.planKey()); if (raw) return new Set(JSON.parse(raw)); } catch { /* fall through */ }
    return new Set(['chase-ht', 'hold-lead']); // sensible defaults: chase when behind, see out a lead
  }
  private savePlan() { try { localStorage.setItem(this.planKey(), JSON.stringify([...this.draftPlan])); } catch { /* ignore */ } }
  private clearMgr() { try { localStorage.removeItem(this.mgrKey()); } catch { /* ignore */ } }
  /** manager phase = you've handed off and are now managing the club with a bloodline star on the pitch */
  /** Guarantee the bloodline star starts (manager phase). autoPickXI is generic and can drop him on a
   *  formation change / auto-pick / stale standing orders; this swaps him into the weakest same-role slot
   *  (or the weakest overall) so he's never silently benched — the "your man on the pitch" promise. (PT-20) */
  private starGuarded(lineup: Lineup): Lineup {
    const starId = this.loadMgr().starId;
    // don't force an INJURED or contract-LAPSED star into the XI — availableClub() excludes both, so buildXI
    // would find no player and splice in a nameless NaN-overall "ghost" (PT-73). And if his contract has lapsed,
    // the "benched until re-signed" rule must actually bench him, or re-signing has no teeth (PT-91).
    if (!starId || !this.club || lineup.playerIds.includes(starId) || this.injured.has(starId) || this.lapsed().has(starId)) return lineup;
    const star = this.club.players.find((p) => p.id === starId);
    if (!star) return lineup; // star isn't in this squad (shouldn't happen mid-manager-phase)
    const starters = lineup.playerIds.map((id) => this.club!.players.find((p) => p.id === id)).filter(Boolean) as Player[];
    const sameRole = starters.filter((p) => p.role === star.role);
    const worst = (sameRole.length ? sameRole : starters).slice().sort((a, b) => overall(a) - overall(b))[0];
    if (!worst) return lineup;
    const ids = [...lineup.playerIds]; ids[ids.indexOf(worst.id)] = starId; // swap into his slot (keeps position sensible)
    return { ...lineup, playerIds: ids };
  }
  private leagueSeed(): number { const h = this.account?.handle ?? 'x'; return [...h].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) >>> 0; }
  /** Per-SEASON seed for the OTHER clubs' league results — same division (leagueSeed), different table each
   *  season, so seasons don't replay byte-for-byte (PT-24). Stable within a season, changes at rollover. */
  private seasonResultSeed(): number { return (this.leagueSeed() ^ Math.imul((this.loadMgr().season ?? 1) + 1, 0x9e3779b1)) >>> 0; }
  // the club's current pyramid TIER (1 = top flight … 10 = bottom). A club property that survives the
  // bloodline hand-off (stored apart from the per-generation manager save), so the dynasty climbs one pyramid.
  private clubTier(): number { try { const t = Number(localStorage.getItem('fm_tier_' + (this.account?.handle ?? 'x'))); return t >= 1 && t <= TIERS ? Math.round(t) : TIERS; } catch { return TIERS; } }
  private setClubTier(t: number): void { try { localStorage.setItem('fm_tier_' + (this.account?.handle ?? 'x'), String(Math.max(1, Math.min(TIERS, Math.round(t))))); } catch { /* ignore */ } }
  /** the club's raw squad strength = weighted average overall of the best XI (1-20 scale).
   *  The BLOODLINE STAR carries extra weight. As a flat mean of eleven he was worth at most +1.09 club
   *  strength — an OVR-20 star dropped into an 8.55 squad moved it to 9.64, and a same-level star moved it
   *  by nothing at all — while facilities and staff handed over +2.8 for free. The one player the whole
   *  game is about mattered less than a training-ground upgrade, which is backwards for a game whose pitch
   *  is a bloodline. He now counts as three of the eleven: enough to feel like the difference, not enough
   *  to make the other ten decorative. (PT-904) */
  private static readonly STAR_WEIGHT = 3;
  private squadStrength(): number {
    const starId = this.loadMgr().starId;
    const rated = this.club.players.map((p) => ({ ov: overall(p), star: !!starId && p.id === starId }));
    const xi = rated.sort((a, b) => b.ov - a.ov).slice(0, 11);
    if (!xi.length) return 8;
    let sum = 0, w = 0;
    for (const p of xi) { const k = p.star ? Game.STAR_WEIGHT : 1; sum += p.ov * k; w += k; }
    return sum / w;
  }
  /** the strength the LEAGUE sees — the squad, shifted by the bloodline star's age curve: he peaks in his
   *  mid-20s and declines toward retirement, so the club's results rise then fade over his managed career. */
  private clubLeagueStrength(): number {
    const age = this.loadMgr().starAge ?? 24;
    const mod = age <= 27 ? 0.5 : age <= 30 ? 0 : age <= 33 ? -0.7 : -1.6;
    return this.squadStrength() + mod;
  }
  private ordinal(n: number): string { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]); }
  private facLevels: Record<string, number> = {}; // cached club-facility levels — applied to single-player matches
  /** A player's retirement age varies with him: keepers last longest, pace-reliant forwards fade earliest;
   *  a strong, durable body plays on, a pacey one declines sooner; plus a small individual quirk. ~30–41. */
  /** Which division the bloodline star's career has earned the club. A career is 120 turns of real choices;
   *  arriving in the basement regardless of how it went made the whole thing feel discarded. Career score is
   *  the game's own summary of how well he played, and his overall says what he actually is now — together
   *  they place him. Deliberately never tier 1 or 2: the manager game must keep a climb worth making. */
  private startingTierFor(s: import('./api').CareerState, player: Player): number {
    const score = s.careerScore ?? 0;          // ~1050 is a strong 120-turn career (see the probe's p50)
    const ov = overall(player);
    // score does most of the work; a genuinely elite graduate nudges one further up
    const byScore = score >= 1200 ? 4 : score >= 950 ? 5 : score >= 700 ? 6 : score >= 450 ? 7 : 8;
    // Bands are on the MANAGER-side overall() scale (a typical graduate measures ~11.3 there, not the ~13.3
    // careerOverall() reports on the career screens) — calibrating these to the career scale made almost every
    // graduate read as "weak" and cost him a rung. (PT-1002)
    const elite = ov >= 13 ? 1 : ov >= 11 ? 0 : -1;
    return Math.max(3, Math.min(TIERS, byScore - elite));
  }

  private retireAgeFor(player: Player): number {
    const a = player.attrs as any;
    // Tuned with the pacing trim (Phase 5): the dynasty is the point, so a single managerial spell shouldn't
    // run 15+ seasons. Trimming the base and the long tail keeps retirements plausible (31-38, still a real
    // footballer's career) while pulling the median spell down to ~9-10 seasons.
    let base = 32;
    base += player.role === 'GK' ? 4 : player.role === 'DF' ? 1 : player.role === 'FW' ? -1 : 0;
    const robust = ((a.strength ?? 10) + (a.stamina ?? 10) + (a.durability ?? a.stamina ?? 10)) / 3;
    base += Math.round((robust - 11) * 0.35);          // a durable body plays on
    base -= Math.round(((a.pace ?? 11) - 12) * 0.2);   // pace-reliant players decline earlier
    const h = [...player.id].reduce((x, c) => (x * 31 + c.charCodeAt(0)) >>> 0, 7); // deterministic per player
    base += (h % 5) - 2;                               // an individual quirk (±2 years)
    return Math.max(31, Math.min(38, Math.round(base)));
  }

  private spTableHtml(t: ReturnType<typeof liveTable>, tier = 1): string {
    // top-2 promoted (or top-3 = continental spots in the top flight); bottom-2 relegated (except the basement)
    const zone = (i: number) => i === 0 ? 'champ'
      : (tier > 1 && i <= 1) || (tier === 1 && i <= 2) ? 'promo'
      : tier < TIERS && i >= t.size - 2 ? 'releg' : '';
    const rows = t.table.map((r, i) => `<tr class="lt-row ${r.mine ? 'mine' : ''} ${zone(i)}"><td class="lt-pos">${i + 1}</td><td class="lt-name"><span class="lt-crest">${crest(r.name, 16)}</span>${r.name}</td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GF}</td><td>${r.GD > 0 ? '+' : ''}${r.GD}</td><td class="lt-pts">${r.Pts}</td></tr>`).join('');
    const key = tier === 1 ? '<span class="lt-key"><span class="lt-k promo">■</span> continental · <span class="lt-k releg">■</span> relegation</span>'
      : tier === TIERS ? '<span class="lt-key"><span class="lt-k promo">■</span> promotion</span>'
      : '<span class="lt-key"><span class="lt-k promo">■</span> promotion · <span class="lt-k releg">■</span> relegation</span>';
    return `<table class="lt-table"><thead><tr><th></th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th title="Goals for — the tiebreak after points and goal difference">GF</th><th>GD</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table>${key}`;
  }

  // ── transfer market: buy/sell fictional players (strengthen the squad → climb the pyramid) ──────────
  private openTransferMarket() {
    document.getElementById('settings-ov')?.remove();
    const ov = document.createElement('div'); ov.id = 'settings-ov'; // reuse the centred-overlay styling
    ov.innerHTML = `<div class="tt-card tm-card"><div class="set-head"><div class="tt-title">💰 TRANSFER MARKET</div><button class="set-x" aria-label="Close">✕</button></div><div id="tm-body">${SPINNER}</div></div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); document.removeEventListener('keydown', onEsc); }; // clean up the ESC listener on every close path (PT-81)
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('.set-x')!.addEventListener('click', close);
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } };
    document.addEventListener('keydown', onEsc);
    this.renderTransferMarket();
  }
  private renderTransferMarket() {
    const body = document.getElementById('tm-body'); if (!body) return;
    const m = this.loadMgr(), tier = this.clubTier(), coins = this.account?.coins ?? 0;
    const boughtKey = 'fm_bought_' + (this.account?.handle ?? 'x') + '_' + m.season;
    let bought: string[]; try { bought = JSON.parse(localStorage.getItem(boughtKey) || '[]'); } catch { bought = []; }
    const listings = transferList(this.leagueSeed(), m.season, tier).filter((l) => !bought.includes(l.player.id));
    const squad = this.club.players, sellable = squad.filter((p) => p.id !== m.starId); // the bloodline star can't be sold here
    const squadFull = squad.length >= MAX_SQUAD, squadMin = squad.length <= MIN_SQUAD;
    const buyList = listings.length ? listings.map((l) => {
      const cantAfford = coins < l.fee;
      const reason = squadFull ? `Squad full (max ${MAX_SQUAD})` : cantAfford ? `Not enough coins (need ${l.fee.toLocaleString()}c)` : 'Sign him';
      return `<div class="tm-row"><span class="tm-pos tm-${l.player.role}">${l.player.role}</span><span class="tm-name">${l.player.name}</span><span class="tm-ov">OV ${l.ov} · age ${l.age}</span><button class="tm-buy primary" data-buy="${l.player.id}" title="${reason}" ${cantAfford || squadFull ? 'disabled' : ''}>Buy · ${l.fee.toLocaleString()}c</button></div>`;
    }).join('') : '<div class="muted">The market has cleared for this season.</div>';
    const sellList = sellable.map((p) => { const ov = overall(p), v = sellValue(ov); return `<div class="tm-row"><span class="tm-pos tm-${p.role}">${p.role}</span><span class="tm-name">${p.name}</span><span class="tm-ov">OV ${ov}</span><button class="tm-sell" data-sell="${p.id}" title="${squadMin ? `Can't sell below ${MIN_SQUAD} players` : `Sell for +${v.toLocaleString()}c`}" ${squadMin ? 'disabled' : ''}>Sell · +${v.toLocaleString()}c</button></div>`; }).join('');
    const wageBill = squad.reduce((n, p) => n + squadSeasonWage(overall(p)), 0); // PT-500: the recurring cost of the squad, visible BEFORE you add to it
    body.innerHTML = `<div class="tm-head"><span class="tm-coins"><span class="ico-inline">${sprite('coin')}</span> ${coins.toLocaleString()}c</span> · Squad <b>${squad.length}</b>/${MAX_SQUAD} · ${tierName(tier)} · 💷 wages <b>~${wageBill.toLocaleString()}c</b> a season</div>`
      + `<div class="tm-sub">Buy players to strengthen the squad and climb — the market's quality is scaled to your division. Squad must stay between <b>${MIN_SQUAD}</b> and <b>${MAX_SQUAD}</b>. A signing costs a one-off fee <i>and</i> a wage every season after it, so leave yourself room for the bill.</div>`
      + `<div class="tm-cols"><div class="tm-col"><h4 class="scout-h4">🛒 BUY</h4>${buyList}</div><div class="tm-col"><h4 class="scout-h4">💸 SELL</h4>${sellList}</div></div>`;
    body.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => { const l = listings.find((x) => x.player.id === (b as HTMLElement).dataset.buy); if (l) this.buyPlayerFlow(l, boughtKey); }));
    body.querySelectorAll('[data-sell]').forEach((b) => b.addEventListener('click', () => this.sellPlayerFlow((b as HTMLElement).dataset.sell!)));
  }
  private buyPlayerFlow(l: Listing, boughtKey: string) {
    // confirm the SPEND — buying is the costlier, irreversible action, so it deserves the same guard as sell (PT-30)
    // PT-500: signings DO carry a recurring wage — the old copy ("no wage, he's yours outright") taught the
    // opposite and left the season-end bill unexplained. State both halves of the cost up front.
    const wage = squadSeasonWage(l.ov);
    this.openConfirm(`Sign <b>${l.player.name}</b> (${l.player.role}, OV ${l.ov}) for a one-off <b>${l.fee.toLocaleString()}c</b> transfer fee?`
      + ` <span class="cg-hint-inline">He then draws about <b>${wage.toLocaleString()}c a season</b> in wages, charged with the rest of the squad's bill when the season ends.</span>`, 'Sign him', () => this.doBuyPlayer(l, boughtKey));
  }
  private async doBuyPlayer(l: Listing, boughtKey: string) {
    try {
      const r = await api.buyPlayer(l.player, l.fee);
      if (this.account) this.account.coins = r.coins;
      try { const b = JSON.parse(localStorage.getItem(boughtKey) || '[]'); b.push(l.player.id); localStorage.setItem(boughtKey, JSON.stringify(b)); } catch { /* ignore */ }
      this.setMe(await api.me()); audio.chime('confirm');
      toast(`✍️ Signed ${l.player.name} (OV ${l.ov}) · −${l.fee.toLocaleString()}c fee · ~${squadSeasonWage(l.ov).toLocaleString()}c a season in wages`);
      this.renderTransferMarket();
    } catch (e: any) { toast(e?.body?.error ?? 'Could not sign him'); }
  }
  private async sellPlayerFlow(playerId: string) {
    const p = this.club.players.find((x) => x.id === playerId);
    this.openConfirm(`Sell <b>${p?.name ?? 'this player'}</b> for +${sellValue(p ? overall(p) : 0).toLocaleString()}c?`, 'Sell', async () => {
      try { const r = await api.sellPlayer(playerId); if (this.account) this.account.coins = r.coins; this.setMe(await api.me()); toast(`💸 Sold · +${r.value.toLocaleString()}c`); if (p) this.feedEvent('transfer_out', '💸', this.personCtx(p, false), { fee: r.value }); this.renderTransferMarket(); }
      catch (e: any) { toast(e?.body?.error ?? 'Could not sell'); }
    });
  }

  /** One-time, dismissible first-manager explainer — the jump from "pick 1 of 4 cards" to a full tactics
   *  suite needs a hand (PT-23). Per-save so a new bloodline sees it again. */
  /** THE LIVING SQUAD season report: who grew, who faded, who retired, whose deal is up, and what the
   *  wage bill cost. This is the beat that makes the squad feel like people rather than a static roster. */
  private squadReportHtml(): string {
    const r = this.pendingSquadReport;
    if (!r) return '';
    const nm = (x: any) => `${x.name} <span class="sq-meta">${x.role} · ${x.age}</span>`;
    const rows: string[] = [];
    if (r.storylines?.length) {
      // the human headline of the season, above the numbers (Phase 4)
      rows.push(`<div class="sq-story">` + r.storylines.map((s: string) => `<div class="sq-story-line">📣 ${s}</div>`).join('') + `</div>`);
    }
    if (r.risers?.length) {
      rows.push(`<div class="sq-row up"><span class="sq-lbl">📈 Improved</span><span class="sq-list">`
        + r.risers.slice(0, 5).map((x: any) => `${nm(x)} <b>${x.from}→${x.to}</b>`).join(' · ')
        + (r.risers.length > 5 ? ` <i>+${r.risers.length - 5} more</i>` : '') + `</span></div>`);
    }
    if (r.fallers?.length) {
      rows.push(`<div class="sq-row down"><span class="sq-lbl">📉 Fading</span><span class="sq-list">`
        + r.fallers.slice(0, 5).map((x: any) => `${nm(x)} <b>${x.from}→${x.to}</b>`).join(' · ')
        + (r.fallers.length > 5 ? ` <i>+${r.fallers.length - 5} more</i>` : '') + `</span></div>`);
    }
    if (r.retired?.length) {
      rows.push(`<div class="sq-row ret"><span class="sq-lbl">🎽 Retired</span><span class="sq-list">`
        + r.retired.map((x: any) => `${nm(x)}`).join(' · ') + ` — thanks for the service.</span></div>`);
    }
    if (r.departed?.length) {
      rows.push(`<div class="sq-row ret"><span class="sq-lbl">🚪 Left</span><span class="sq-list">`
        + r.departed.map((x: any) => nm(x)).join(' · ') + ` — their deals ran out and weren't renewed.</span></div>`);
    }
    if (r.intake?.length) {
      rows.push(`<div class="sq-row up"><span class="sq-lbl">🌱 Academy</span><span class="sq-list">`
        + r.intake.map((x: any) => nm(x)).join(' · ')
        + ` — promoted to keep the squad up to strength. Raw, but yours.</span></div>`);
    }
    if (r.expiring?.length) {
      const coins = this.account?.coins ?? 0;
      rows.push(`<div class="sq-row exp"><span class="sq-lbl">📝 Deal up</span><span class="sq-list">`
        + r.expiring.map((x: any) => {
          const afford = coins >= x.renewCost;
          // PT-501: say WHY the price is what it is, on the row itself — morale is what bends it
          const mult = x.morale != null ? moraleEffects(x.morale).extendMult : 1;
          const swing = Math.round((mult - 1) * 100);
          const why = swing > 0 ? ` — <b class="sq-warn">+${swing}% to re-sign</b>, the price of him not being settled; more football brings it down`
            : swing < 0 ? ` — <b class="sq-good">${swing}% to re-sign</b>, a settled man comes cheaper` : '';
          return `<span class="sq-exp">${nm(x)}${x.moraleLabel ? ` <i class="sq-mood">${x.moraleLabel}</i>${why}` : ''} `
            + `<button class="sq-btn" data-renew="${x.id}" data-name="${x.name}" data-cost="${x.renewCost}" ${afford ? '' : 'disabled'} title="${afford ? `Renew for ${x.renewCost.toLocaleString()}c` : `Not enough coins (need ${x.renewCost.toLocaleString()}c)`}">Renew · ${x.renewCost.toLocaleString()}c</button> `
            + `<button class="sq-btn ghost" data-release="${x.id}" data-name="${x.name}" title="Let him leave on a free">Let go</button></span>`;
        }).join(' ') + `</span></div>`);
    }
    if (r.unhappy?.length) {
      // an unsettled player is a decision waiting to happen: he'll cost more to re-sign and sells for less,
      // so the manager needs to see him before the deal is on the table (Phase 3)
      rows.push(`<div class="sq-row unhappy"><span class="sq-lbl">😠 Unsettled</span><span class="sq-list">`
        + r.unhappy.slice(0, 5).map((x: any) => `${nm(x)} <i>${x.moraleLabel}</i>`).join(' · ')
        + (r.unhappy.length > 5 ? ` <i>+${r.unhappy.length - 5} more</i>` : '')
        + ` — men who didn't play enough, or whose deal was left to run down. They hold out for more to re-sign (up to 30% more) and sell for less (up to 20% less). Give them games and it settles.</span></div>`);
    }
    const bill = `<div class="sq-row bill"><span class="sq-lbl">💷 Wages</span><span class="sq-list">−${(r.charged ?? 0).toLocaleString()}c paid for the season`
      + (r.unpaid > 0 ? ` · <b class="sq-warn">${r.unpaid.toLocaleString()}c unpaid — the books are stretched</b>` : '')
      + ` — the whole squad's wages, charged once a year. A bill like this is due again next summer.</span></div>`;
    if (!rows.length && !r.charged) return '';
    return `<div class="sq-report" id="sq-report"><div class="sq-head">👥 THE SQUAD, A YEAR ON<button class="sq-x" id="sq-report-x" title="Dismiss">✕</button></div>${rows.join('')}${bill}</div>`;
  }

  /** Pay to keep an out-of-contract squad player. */
  private async renewSquadFlow(playerId: string, name: string, cost: number) {
    this.openConfirm(`Renew <b>${name}</b>'s contract for <b>${cost.toLocaleString()}c</b>?`, 'Renew', async () => {
      try {
        const r = await api.renewSquadPlayer(playerId);
        if (this.account) this.account.coins = r.coins;
        this.pendingSquadReport = { ...this.pendingSquadReport, expiring: (this.pendingSquadReport?.expiring ?? []).filter((x: any) => x.id !== playerId) };
        { const mm = this.loadMgr(); this.saveMgr({ ...mm, squadReport: this.pendingSquadReport }); }
        this.setMe(await api.me()); audio.chime('confirm');
        toast(`✍️ ${name} re-signs · −${r.cost.toLocaleString()}c`);
        this.showSeason();
      } catch (e: any) { toast(e?.body?.error ?? 'Could not renew'); }
    });
  }
  /** Let an out-of-contract squad player walk. */
  private async releaseSquadFlow(playerId: string, name: string) {
    this.openConfirm(`Let <b>${name}</b> leave on a free? He walks and you save his wages.`, 'Let him go', async () => {
      try {
        await api.releaseSquadPlayer(playerId);
        this.pendingSquadReport = { ...this.pendingSquadReport, expiring: (this.pendingSquadReport?.expiring ?? []).filter((x: any) => x.id !== playerId) };
        { const mm = this.loadMgr(); this.saveMgr({ ...mm, squadReport: this.pendingSquadReport }); }
        this.setMe(await api.me());
        toast(`👋 ${name} leaves the club`);
        this.showSeason();
      } catch (e: any) { toast(e?.body?.error ?? 'Could not release'); }
    });
  }

  /** The manager explainer's bullets. Kept separate from the card so Settings → How to play can re-show
   *  them after the one-time card has been dismissed (PT-504). */
  private managerHelpRows(): string[] {
    const m = this.loadMgr();
    return [
      `<b>Each matchday:</b> set your <b>XI + tactics</b> (or hit Auto-pick), then <b>Play</b> the match — or <b>⏩ Sim</b> to jump ahead.`,
      `<b>Win games to climb the table.</b> Finish top to win the league or earn promotion; finish bottom and you go down.`,
      `<b>${m.starName ?? 'Your bloodline star'} is your key player</b> — his rating drives the whole squad's strength, so keep developing him and always start him.`,
      `<b>Spend coins</b> on the Transfer Market and club facilities to strengthen the side over the seasons.`,
      // PT-500 — the wage bill was a save-wide recurring cost no screen forecast
      `<b>💷 Wages.</b> Everyone on your books draws a wage, players you sign included. The whole bill is charged once, when the season ends — you'll see it on the squad report. Keep a reserve back for it: if the coins aren't there the shortfall is left unpaid and the books are stretched. A bigger, better squad costs more, and climbing a division is what pays for it. The season header shows roughly what you're on the hook for.`,
      // PT-501 — morale drives renew cost and sale value, and nothing said what moved it
      `<b>🙂 Morale.</b> How settled a man is. Playing him lifts it, and so does winning something; leaving him out drops it, and letting his contract run down drops it further. It shows up at the deal table — an unsettled player holds out for up to <b>30% more</b> to re-sign, and sells for up to <b>20% less</b>. Rotating the fringe men into the XI is what keeps them cheap to keep.`,
    ];
  }
  private managerHelpCard(): string {
    if (localStorage.getItem(this.onbKey('fm_mgr_help_done'))) return '';
    return `<div class="cg-help" id="mgr-help"><div class="cg-help-head">📋 YOU'RE THE MANAGER NOW <button class="cg-help-x" id="mgr-help-x">Got it ✕</button></div>`
      + `<ul class="cg-help-list">` + this.managerHelpRows().map((r) => `<li>${r}</li>`).join('') + `</ul></div>`;
  }
  private showSeason() {
    this.spFixture = null;
    this.showScreen('season');
    api.facilities().then((d) => { this.facLevels = Object.fromEntries(d.facilities.map((f) => [f.key, f.level])); }).catch(() => {}); // cache for the match edges
    const clubName = this.club.name, seed = this.leagueSeed();
    const fixtures = seasonFixtures(clubName, seed, this.clubTier());
    const m = this.loadMgr(), played = m.results;
    const t = liveTable(clubName, this.clubLeagueStrength(), 1, seed, played, this.clubTier(), this.seasonResultSeed());
    const nextIdx = played.length, done = nextIdx >= fixtures.length;
    // your seeded RIVAL club — those fixtures are derbies
    const opps = seededOpponents(clubName, seed, this.clubTier());
    const rivalName = opps.length ? opps[seed % opps.length].name : null;
    const fxRows = fixtures.map((f, i) => {
      const derby = f.oppName === rivalName;
      const vTag = `<span class="sf-v ${f.venue === 'H' ? 'home' : 'away'}">${f.venue}</span>`;
      const oppTag = `<span class="sf-opp"><span class="sf-opp-crest">${crest(f.oppName, 15)}</span>${f.oppName}${derby ? ' <span class="sf-derby">🔥 DERBY</span>' : ''}</span>`;
      if (i < played.length) {
        const r = played[i], cls = r.myGoals > r.oppGoals ? 'w' : r.myGoals < r.oppGoals ? 'l' : 'd';
        return `<div class="sf-fx done${derby ? ' derby' : ''}"><span class="sf-md">${i + 1}</span>${vTag}${oppTag}<span class="sf-res ${cls}">${r.myGoals}-${r.oppGoals}</span></div>`;
      }
      const isNext = i === nextIdx;
      return `<div class="sf-fx${isNext ? ' next' : ''}${derby ? ' derby' : ''}"><span class="sf-md">${i + 1}</span>${vTag}${oppTag}${isNext ? `<button class="sf-play primary" id="sf-play">Play ▶</button>` : '<span class="sf-res pending">–</span>'}</div>`;
    }).join('');
    // FORM GUIDE (last 5) + season RECORDS (biggest win, longest unbeaten run)
    const form = played.slice(-5).map((r) => r.myGoals > r.oppGoals ? 'W' : r.myGoals < r.oppGoals ? 'L' : 'D');
    const formStrip = form.length ? ` · ${form.map((x) => `<span class="ff ff-${x.toLowerCase()}">${x}</span>`).join('')}` : '';
    let biggest: { gd: number; gf: number; sc: string } | null = null, run = 0, bestRun = 0;
    // Ties on goal difference break on GOALS SCORED: 2-0 and 3-1 are both +2, but a 3-1 is the better
    // story and this is the one line the player reads to remember his season. It reported "Biggest win
    // 2-0" for a season containing a 3-1 derby. (PT-1004)
    for (const r of played) {
      const gd = r.myGoals - r.oppGoals;
      if (gd > 0 && (!biggest || gd > biggest.gd || (gd === biggest.gd && r.myGoals > biggest.gf))) {
        biggest = { gd, gf: r.myGoals, sc: `${r.myGoals}-${r.oppGoals}` };
      }
      if (gd >= 0) { run++; bestRun = Math.max(bestRun, run); } else run = 0;
    }
    const records = played.length ? `<div class="sf-records">📋 ${biggest ? `Biggest win ${biggest.sc}` : 'No win yet'} · Longest unbeaten ${bestRun}</div>` : '';
    // surface the star's rating + make the star→club link explicit (PT-21: his contribution was invisible)
    const starP0 = m.starId ? this.club.players.find((p) => p.id === m.starId) : undefined;
    const starLine = m.starName && m.starAge
      ? ` · <span title="Your bloodline player is the club's talisman — his rating feeds the whole squad's strength, so the sharper he is, the higher ${clubName} finishes.">★ ${m.starName} · overall (OVR) ${starP0 ? overall(starP0) : '—'} · age ${m.starAge}${m.retireAge ? `, ~retires ${m.retireAge}` : ''}</span>`
      : '';
    const tier = this.clubTier();
    // PT-500: forecast the season's wage bill IN the header, so the end-of-season charge is never a surprise
    const wageBill = this.club.players.reduce((n, p) => n + squadSeasonWage(overall(p)), 0);
    const wageLine = ` · <span class="sf-wages">💷 wage bill ~${wageBill.toLocaleString()}c, due at season's end</span>`;
    const header = done
      ? `<div class="season-summary done"><span class="ss-crest">${crest(clubName, 20)}</span>✅ Season ${m.season} complete — <b>${clubName}</b> finished <b>${this.ordinal(t.pos)}</b> of ${t.size} in <b>${tierName(tier)}</b>${t.pos === 1 ? ' 🏆 CHAMPIONS!' : (t.pos <= 2 && tier > 1) ? ` ⬆️ PROMOTED to ${tierName(tier - 1)}!` : (t.pos >= t.size - 1 && tier < TIERS) ? ` ⬇️ RELEGATED to ${tierName(tier + 1)}` : ''}. <button class="primary" id="sf-next-season">Next season →</button></div>`
      : `<div class="season-summary"><span class="ss-crest">${crest(clubName, 20)}</span><b>${clubName}</b> · <b>${tierName(tier)}</b> · Season ${m.season} · MD ${nextIdx + 1}/${fixtures.length} · <b>${this.ordinal(t.pos)}</b>/${t.size}${formStrip}${starLine}${wageLine}</div>`;
    // INCOMING BID for the star — a rival's offer this season (deterministic); dismissed once per season
    const starP = m.starId ? this.club.players.find((p) => p.id === m.starId) : undefined;
    const bidKey = 'fm_biddismiss_' + (this.account?.handle ?? 'x') + '_' + m.season;
    const bidGone = (() => { try { return localStorage.getItem(bidKey) === '1'; } catch { return false; } })();
    const bid = (starP && m.starAge && !bidGone && !done) ? incomingBid(this.leagueSeed(), m.season, overall(starP), m.starAge) : null;
    const bidLead = bid ? [
      `<b>🤝 ${bid.club}</b> have tabled a <b>${bid.fee.toLocaleString()}c</b> bid for ${m.starName}.`,
      `<b>🤝 ${bid.club}</b> come calling with <b>${bid.fee.toLocaleString()}c</b> for ${m.starName}.`,
      `<b>🤝 ${bid.club}</b> want ${m.starName} badly — <b>${bid.fee.toLocaleString()}c</b> on the table.`,
      `<b>🤝 ${bid.club}</b> test your resolve with <b>${bid.fee.toLocaleString()}c</b> for ${m.starName}.`,
    ][((this.leagueSeed() ^ Math.imul(m.season + 1, 40503)) >>> 0) % 4] : '';
    const bidBanner = bid ? `<div class="sf-bid"><span class="sf-bid-txt">${bidLead} Cash in and bring the heir through early — or keep your dynasty player?</span><span class="sf-bid-btns"><button id="sf-bid-accept" class="primary">Accept ${bid.fee.toLocaleString()}c</button> <button id="sf-bid-reject">Reject</button></span></div>` : '';
    // PROMOTION / RELEGATION reveal — shown at the start of the season after a move (from nextSeason)
    const tierMove = m.lastTierMove && !done && nextIdx <= 2
      ? (() => {
          // vary the reveal by season so a multi-season climb doesn't read word-for-word each time, and don't
          // frame a RELEGATION as a celebratory "welcome to" (PT-88)
          const promoted = m.lastTierMove === 'promoted';
          const line = [
            promoted ? 'The football gets harder from here — this is the reward for the climb.' : 'A bitter drop — but the rebuild, and the climb back, start now.',
            promoted ? 'A division higher, a division tougher. The club has earned its place.' : 'Down a division. The badge is the same; the job is to bounce straight back.',
            promoted ? 'Up among better sides now — savour it, then go again.' : 'A setback for the club. Regroup, and win it back.',
            promoted ? 'The hard yards paid off. New level, new challenge.' : "Relegated, and it stings — this is where a club's character shows.",
          ][((this.leagueSeed() ^ Math.imul(m.season + 1, 2654435761)) >>> 0) % 4];
          return `<div class="sf-tiermove sf-tiermove-${m.lastTierMove}">${promoted ? `⬆️ PROMOTED — up to <b>${tierName(tier)}</b>.` : `⬇️ RELEGATED — down to <b>${tierName(tier)}</b>.`} ${line}</div>`;
        })()
      : '';
    const remaining = fixtures.length - nextIdx;
    const simBtn = done ? '' : `<div style="text-align:center;margin-top:10px;"><button id="sf-sim" style="font-family:var(--display);font-size:11px;padding:7px 14px;">⏩ Sim the remaining ${remaining} ${remaining === 1 ? 'match' : 'matches'}</button></div>`;
    // TRAINING FOCUS — the stat your star works on this season (young grow it, veterans slow their decline)
    const FOCI = ['pace', 'shooting', 'passing', 'tackling', 'strength', 'positioning', 'stamina'];
    const curFocus = m.trainFocus ?? 'passing';
    const focusSel = m.starName ? `<div class="sf-focus">🏋️ <b>Training focus</b> for ${m.starName}: <select id="sf-focus">${FOCI.map((f) => `<option ${f === curFocus ? 'selected' : ''}>${f}</option>`).join('')}</select> <span class="sf-focus-hint">applied when the season ends</span></div>` : '';
    // the board's verdict on LAST season (set in nextSeason) — shown while the new season is still young
    const lb = m.lastBoard;
    // PT-512: keep the target on screen for the whole season it governs, and say what missing it costs
    // (nothing — the board judges the story, it never sacks you), so it stops reading as a live threat.
    const boardLine = lb && !done
      ? `<div class="sf-board sf-board-${lb.mood}">🪑 <b>The board</b>${nextIdx <= 3 ? ` — on last season: “${lb.message}”` : ''} <span class="sf-board-exp">This season they expect ${this.expectationLabel(lb.expectation, tier)}.</span>`
        + ` <span class="cg-hint-inline">A target to chase, not a threat — they'll have their say either way, and your job is never on the line.</span></div>`
      : '';
    this.maybeOfferArc();   // arcs are offered at the season screen, paced across the campaign
    $('season-body').innerHTML = this.managerHelpCard()
      + header
      + bidBanner
      + tierMove
      + boardLine
      + `<div class="sf-gaffer">📔 ${this.gafferTake(played, t.pos, t.size, clubName)}</div>`
      + this.managerArcHtml()
      + this.seasonFeedHtml()
      + this.squadReportHtml()
      + this.sponsorHtml()
      + this.worldCupHtml()
      + this.continentalHtml()
      + (m.starName ? `<div class="sf-tm"><button id="sf-transfers">💰 Transfer Market</button> <span class="sf-tm-hint">buy/sell players to strengthen the squad</span></div>` : '')
      + `<div class="season-cols"><div class="season-fixtures"><h4 class="scout-h4">FIXTURES</h4>${fxRows}${records}${focusSel}${simBtn}</div>`
      + `<div class="season-table-wrap"><h4 class="scout-h4">LEAGUE TABLE — ${tierName(tier).toUpperCase()}</h4>${this.spTableHtml(t, tier)}${this.staffHtml()}</div></div>`;
    $('season-body').querySelectorAll('[data-arcchoice]').forEach((el) =>
      el.addEventListener('click', () => this.resolveArcChoice((el as HTMLElement).dataset.arcchoice!)));
    ($('mgr-help-x') as any)?.addEventListener('click', () => { localStorage.setItem(this.onbKey('fm_mgr_help_done'), '1'); ($('mgr-help') as any)?.remove(); });
    document.getElementById('sq-report-x')?.addEventListener('click', () => { this.pendingSquadReport = null; const mm = this.loadMgr(); this.saveMgr({ ...mm, squadReport: null }); document.getElementById('sq-report')?.remove(); });
    document.querySelectorAll<HTMLElement>('[data-renew]').forEach((b) => b.addEventListener('click', () => this.renewSquadFlow(b.dataset.renew!, b.dataset.name ?? 'him', Number(b.dataset.cost || 0))));
    document.querySelectorAll<HTMLElement>('[data-release]').forEach((b) => b.addEventListener('click', () => this.releaseSquadFlow(b.dataset.release!, b.dataset.name ?? 'him')));
    $('sf-cont-play')?.addEventListener('click', () => this.playContinentalTie());
    $('sf-cont-sim')?.addEventListener('click', () => this.simContinentalTie());
    $('sf-wc-follow')?.addEventListener('click', () => this.followWorldCup());
    document.getElementById('sf-wc-review')?.addEventListener('click', () => { const mm = this.loadMgr(); if (mm.wcEdition != null) this.showWorldCup(this.wcData(mm.wcEdition).wc, this.deriveWcFinish(mm.wcRun ?? [])); }); // re-open the concluded report (PT-72)
    $('sf-wc-play')?.addEventListener('click', () => this.playWorldCupTie());
    $('sf-wc-sim')?.addEventListener('click', () => this.simWorldCupTie());
    $('sf-play')?.addEventListener('click', () => this.playNextSpFixture());
    $('sf-transfers')?.addEventListener('click', () => this.openTransferMarket());
    if (bid) {
      $('sf-bid-accept')?.addEventListener('click', () => this.acceptStarBid(bid, m));
      $('sf-bid-reject')?.addEventListener('click', () => { try { localStorage.setItem(bidKey, '1'); } catch { /* ignore */ } toast('Bid rejected — he stays.'); this.showSeason(); });
    }
    // PT-505: it eats every remaining fixture in one click, so it gets the same guard as selling a player
    $('sf-sim')?.addEventListener('click', () => this.openConfirm(
      `Sim the remaining <b>${remaining}</b> ${remaining === 1 ? 'match' : 'matches'}? You won't get to play them.`,
      'Sim them', () => this.simRemainingFixtures()));
    $('sf-next-season')?.addEventListener('click', () => {
      // don't silently bin an unfinished European run OR an in-progress World Finals when the league fixtures
      // finish first (PT-75 covered the continental strand; PT-95 adds the World Finals).
      const mm = this.loadMgr();
      const contPending = mm.contElig && !mm.contOut && (mm.contRound ?? 0) < 3;
      const wcPending = mm.wcStage != null && mm.wcStage !== 'done';
      if (contPending || wcPending) {
        const what = wcPending && contPending ? 'your Continental Cup run and your World Finals' : wcPending ? 'your World Finals' : `<b>${['the Quarter-Final', 'the Semi-Final', 'the Final'][mm.contRound ?? 0] ?? 'a continental tie'}</b> of the Continental Cup`;
        this.openConfirm(`You still have ${what} to play. Rolling into next season forfeits ${wcPending && contPending ? 'them' : 'it'}. Continue anyway?`, 'Forfeit & continue', () => this.nextSeason());
      } else this.nextSeason();
    });
    ($('sf-focus') as any)?.addEventListener('change', (e: Event) => { const mm = this.loadMgr(); this.saveMgr({ ...mm, trainFocus: (e.target as HTMLSelectElement).value }); });
    $('season-body').querySelectorAll('[data-staff]').forEach((b) => b.addEventListener('click', () => {
      const id = (b as HTMLElement).dataset.staff!;
      const st = BACKROOM_STAFF.find((x) => x.id === id);
      // SAY WHAT THE MONEY BUYS. These coaches have always had real effects — +0.4 club strength each in a
      // simmed match, and conditioning/attacking multipliers in a live one — but nothing ever told the
      // player, so 350 coins bought an invisible edge and read like a decoration.
      const EFFECT: Record<string, string> = {
        fitness: 'Your side tires ~5% less over 90 minutes, home and away.',
        attack: 'A ~3% edge in the final third, home and away.',
        assistant: 'A ~2% all-round edge, and slightly less fatigue.',
      };
      this.openConfirm(
        `Hire <b>${st?.name ?? 'this coach'}</b> for <b>💰 ${(st?.cost ?? 0).toLocaleString()}c</b>?`
        + (st?.desc ? `<br><span class="cf-sub">${st.desc}</span>` : '')
        + (EFFECT[id] ? `<br><span class="cf-sub">▸ ${EFFECT[id]} He stays with the club for good.</span>` : '')
        + `<br><span class="cf-sub">You have ${(this.account?.coins ?? 0).toLocaleString()}c. He stays with the club for good.</span>`,
        `Hire · 💰 ${(st?.cost ?? 0).toLocaleString()}c`, () => this.hireStaff(id));
    }));
    $('season-body').querySelectorAll('[data-sponsor]').forEach((b) => b.addEventListener('click', () => this.chooseSponsor((b as HTMLElement).dataset.sponsor!)));
  }

  private sponsorHtml(): string {
    const m = this.loadMgr();
    if (m.sponsor) return `<div class="sf-sponsor active">📣 Shirt sponsor: <b>${m.sponsor === 'steady' ? 'Steady deal' : 'Performance deal — top-3 bonus pending'}</b></div>`;
    if (m.results.length > 0) return ''; // the deal is chosen at the start of the season
    return `<div class="sf-sponsor"><div class="sf-sponsor-lbl">📣 SHIRT SPONSOR — pick this season's deal:</div>`
      + `<button class="sf-sponsor-opt" data-sponsor="steady"><b>📄 Steady deal</b><span>+450c now, guaranteed</span></button>`
      + `<button class="sf-sponsor-opt" data-sponsor="performance"><b>📈 Performance deal</b><span>+150c now, +400–700c bonus for a top-3 finish</span></button></div>`;
  }
  private async chooseSponsor(deal: string) {
    try {
      const r = await api.spSponsor(deal);
      if (this.account?.coins != null) this.account.coins = r.coins;
      const m = this.loadMgr(); this.saveMgr({ ...m, sponsor: deal });
      toast(`📣 Sponsor signed (+${r.upfront.toLocaleString()}c upfront)`);
      this.showSeason();
    } catch { toast('Could not sign the sponsor'); }
  }

  private staffHtml(): string {
    const owned = this.loadMgr().staff ?? [];
    const coins = this.account?.coins ?? 0; // gate unaffordable hires like the transfer market + facilities do (PT-126)
    const rows = BACKROOM_STAFF.map((s) => {
      const has = owned.includes(s.id);
      const hireBtn = coins < s.cost
        ? `<button class="sf-hire" disabled title="Not enough coins (need ${s.cost}c)">Hire · 💰${s.cost}</button>`
        : `<button class="sf-hire" data-staff="${s.id}">Hire · 💰${s.cost}</button>`;
      return `<div class="sf-staff-row${has ? ' owned' : ''}"><span class="sf-staff-ico">${s.icon}</span><div class="sf-staff-body"><div class="sf-staff-name">${s.name}${has ? ' ✓' : ''}</div><div class="sf-staff-desc">${s.desc}</div></div>`
        + (has ? '' : hireBtn) + `</div>`;
    }).join('');
    return `<h4 class="scout-h4" style="margin-top:18px;">🧑‍🏫 BACKROOM STAFF</h4>${rows}`;
  }
  private async hireStaff(id: string) {
    const s = BACKROOM_STAFF.find((x) => x.id === id); if (!s) return;
    try {
      const r = await api.hireStaff(id);
      if (this.account?.coins != null) this.account.coins = r.coins;
      const m = this.loadMgr(); this.saveMgr({ ...m, staff: [...(m.staff ?? []), id] });
      toast(`🧑‍🏫 Hired ${s.name} (−${r.cost.toLocaleString()}c)`);
      this.showSeason();
    } catch (e: any) { toast(e?.status === 409 ? 'Not enough coins' : 'Could not hire'); }
  }

  /** The bloodline star's current overall (drives his nation's World-Cup strength). */
  private starOverall(): number {
    const id = this.loadMgr().starId;
    const p = this.club?.players.find((x) => x.id === id);
    return p ? overall(p) : Math.round(this.squadStrength());
  }
  private starSurname(): string { const n = this.loadMgr().starName ?? ''; return n.trim().split(/\s+/).slice(1).join(' ') || n || 'the family'; }

  // ── Continental club cup — qualified by a top-3 league finish; a 3-round knockout run alongside the season ──
  private continentalHtml(): string {
    const m = this.loadMgr();
    if (!m.contElig) return '';
    const round = m.contRound ?? 0;
    const blurb = m.contBlurb ? ` <span class="sf-cont-blurb">${m.contBlurb}</span>` : '';
    if (m.contOut) return `<div class="sf-cont out"><span class="sf-cont-lbl">🌍 CONTINENTAL CUP</span> <span class="sf-cont-txt">Knocked out — the European run ends here. There's always next season.${blurb}</span></div>`;
    if (round >= 3) return `<div class="sf-cont won"><span class="sf-cont-lbl">🏆 CONTINENTAL CHAMPIONS</span> <span class="sf-cont-txt"><b>${this.club?.name}</b> are kings of the continent!${blurb}</span></div>`;
    const tie = contOpponent(this.leagueSeed(), m.season, round as 0 | 1 | 2);
    const dots = CONT_ROUNDS.map((r, i) => `<span class="sf-cont-dot ${i < round ? 'won' : i === round ? 'now' : ''}">${['QF', 'SF', 'F'][i]}</span>`).join('');
    return `<div class="sf-cont"><div class="sf-cont-head"><span class="sf-cont-lbl">🌍 CONTINENTAL CUP</span>${dots}</div>`
      + (round === 0 ? `<div class="sf-cont-explain">You qualified by finishing <b>top-3 in the top flight</b> last season. It's a knockout against the best clubs from other nations — win three ties (<b>QF → SF → Final</b>) to be crowned champions of the continent, alongside your league season.</div>` : '')
      + (m.contBlurb ? `<div class="sf-cont-blurb">${m.contBlurb}</div>` : '')
      + `<div class="sf-cont-tie"><b>${tie.label}</b> ${tie.neutral ? '(neutral)' : ''} vs <span class="sf-opp-crest">${crest(tie.oppName, 15)}</span><b>${tie.oppName}</b> · rating ~${tie.oppStrength}</div>`
      + `<div class="sf-cont-btns"><button class="primary" id="sf-cont-play">Play the tie ▶</button> <button id="sf-cont-sim">⏩ Sim it</button></div></div>`;
  }
  private playContinentalTie() {
    const m = this.loadMgr(), round = m.contRound ?? 0;
    if (!m.contElig || m.contOut || round >= 3) return;
    const tie = contOpponent(this.leagueSeed(), m.season, round as 0 | 1 | 2);
    const short = (tie.oppName.match(/[A-Z]/g) ?? ['C', 'O', 'N']).join('').slice(0, 3);
    const oppSeed = (this.leagueSeed() ^ (round * 131)) >>> 0;
    const oppClub = generateClub('cont-' + m.season + '-' + round, tie.oppName, short, 0x8844cc, tie.oppStrength, oppSeed, true);
    const venue: 'home' | 'away' = tie.neutral ? 'home' : (round % 2 === 0 ? 'home' : 'away'); // final on neutral ground, else alternate
    const oppTactics = seededOpponentTactics(oppSeed);
    this.spFixture = { idx: -1, oppClub, oppName: tie.oppName, oppStrength: tie.oppStrength, venue, neutral: tie.neutral, oppLineup: autoPickXI(oppClub, oppTactics.formation), oppTactics, comp: 'cont', contRound: round }; // neutral final: no fan-zone home bonus (PT-130)
    this.openLineup('match', { id: 'cont-opp', handle: tie.oppName, venue });
  }
  private simContinentalTie() {
    const m = this.loadMgr(), round = m.contRound ?? 0;
    if (!m.contElig || m.contOut || round >= 3) return;
    const tie = contOpponent(this.leagueSeed(), m.season, round as 0 | 1 | 2);
    // match the played tie's venue + club edges (PT-129): SF is away, final is neutral, both fold in facilities/staff
    const atHome = !tie.neutral && round % 2 === 0;
    const { strDelta, homeTerm } = this.simEdge(atHome ? 'home' : 'away');
    const r = this.simFixtureResult(this.clubLeagueStrength() + strDelta, tie.oppStrength, ((this.leagueSeed() >>> 0) ^ ((m.season * 331 + round * 17) >>> 0)) >>> 0, homeTerm);
    this.resolveContinental(r.myGoals, r.oppGoals, tie.oppStrength);
  }
  /** Apply a continental tie result: win → advance (or lift the cup); level → seeded shootout; loss → out. */
  private resolveContinental(myGoals: number, oppGoals: number, oppStrength: number) {
    const m = this.loadMgr(), round = m.contRound ?? 0;
    let won = myGoals > oppGoals;
    let pens = false;
    if (myGoals === oppGoals) { pens = true; const h = ((this.leagueSeed() >>> 0) ^ ((m.season * 733 + round * 29) >>> 0)) >>> 0; won = ((h % 1000) / 1000) < (0.5 + (this.clubLeagueStrength() - oppStrength) * 0.03); }
    const label = CONT_ROUNDS[round];
    // a "how the tie felt" line for the continental card (from @fm/shared intl.ts)
    const contBlurb = contTieBlurb(this.leagueSeed(), m.season, round as 0 | 1 | 2, won, pens, myGoals - oppGoals);
    if (won) {
      const nextRound = round + 1;
      if (nextRound >= 3) {
        const contTitles = (m.contTitles ?? 0) + 1;
        this.saveMgr({ ...m, contRound: 3, contTitles, contBlurb });
        this.checkAchievements(); // continental cup won
        audio.chime('triumph');
        toast(`🏆 CONTINENTAL CHAMPIONS! ${this.club?.name} win the cup${pens ? ' on penalties' : ''}`);
        // the flagship cup pays a clear PREMIUM over a league title: the honour (800c) + a 1000c winners' bonus (PT-96)
        api.spSeasonReward({ pos: 1, size: 10, sponsor: undefined, kind: 'continental' }).then((x) => { if (this.account?.coins != null) this.account.coins = x.coins; }).catch(() => {}); // kind:'continental' — a cup, not a league title, and doesn't bump the season (PT-94)
        api.cupPrize(1000).then((x) => { if (this.account?.coins != null) this.account.coins = x.coins; toast(`💰 Continental winners' prize +1,800c`); }).catch(() => {});
      } else {
        this.saveMgr({ ...m, contRound: nextRound, contBlurb });
        const roundPrize = nextRound === 1 ? 250 : 500; // QF win → 250c, SF win → 500c (no longer 0 — PT-96)
        api.cupPrize(roundPrize).then((x) => { if (this.account?.coins != null) this.account.coins = x.coins; }).catch(() => {});
        toast(`✅ ${label} won ${myGoals}-${oppGoals}${pens ? ' (pens)' : ''} — into the ${CONT_ROUNDS[nextRound]}! 💰 +${roundPrize}c`);
      }
    } else {
      this.saveMgr({ ...m, contOut: true, contBlurb });
      toast(`❌ Out of the cup — lost the ${label} ${myGoals}-${oppGoals}${pens ? ' on penalties' : ''}`);
    }
    this.showSeason();
  }

  // ── World-Finals national tournament — every 4 seasons; the star's nation's knockout ties are playable ──
  private wcEditionDue(): number | null {
    const m = this.loadMgr();
    if (m.season % 4 !== 0) return null;            // staged every 4th season
    const edition = m.season / 4;                    // 1,2,3,…
    return m.wcSeen === edition ? null : edition;    // once per staging
  }
  private wcData(edition: number): { wc: WCResult; path: WCPlayerPath; nation: string } {
    const nation = homeNation(this.starSurname());
    const wc = worldCup(this.leagueSeed(), edition, nation, this.starOverall());
    return { wc, path: playerPath(wc), nation };
  }
  private wcStageOpp(path: WCPlayerPath, stage: 'qf' | 'sf' | 'final'): { opp: string; oppStrength: number } {
    return stage === 'qf' ? path.qf! : stage === 'sf' ? path.sf! : path.final!;
  }
  private wcStageLabel(stage: string): string { return stage === 'qf' ? 'Quarter-final' : stage === 'sf' ? 'Semi-final' : 'Final'; }

  /** The World-Finals block in the season view: a teaser before it's followed, then the live knockout run. */
  /** Derive the star's World-Finals finish from his stored knockout run (for re-viewing a concluded report). */
  private deriveWcFinish(run: NonNullable<MgrState['wcRun']>): WCResult['myFinish'] {
    const last = run[run.length - 1];
    if (!last) return 'Group stage';
    if (last.round === 'F') return last.won ? 'Champions' : 'Runners-up';
    if (last.round === 'SF') return 'Semi-finals';
    return 'Quarter-finals';
  }
  private worldCupHtml(): string {
    const m = this.loadMgr();
    // an in-progress knockout run takes priority over the teaser
    if (m.wcStage && m.wcStage !== 'done' && m.wcEdition != null) return this.wcRunHtml();
    // a CONCLUDED World Finals stays reachable that season — the report used to vanish after one viewing (PT-72)
    if (m.wcStage === 'done' && m.wcEdition != null) {
      const fin = this.deriveWcFinish(m.wcRun ?? []);
      return `<div class="sf-wc sf-wc-done"><div class="sf-wc-txt">🌐 <b>World Finals — Edition ${m.wcEdition}</b> · ${fin}.</div><button class="primary" id="sf-wc-review">View the tournament report →</button></div>`;
    }
    const edition = this.wcEditionDue();
    if (edition == null) return '';
    const nation = homeNation(this.starSurname());
    return `<div class="sf-wc"><div class="sf-wc-head">🌐 THE WORLD FINALS — Edition ${edition}</div>`
      + `<div class="sf-wc-txt">The international summer is here — the <b>World Finals</b> come round <b>every four seasons</b>, football's greatest prize. <b>${m.starName ?? 'Your star'}</b> is away with ${flagImg(nation, 18)} <b>${nation}</b>, chasing it.</div>`
      + `<button class="primary" id="sf-wc-follow">Follow the tournament 🌍</button></div>`;
  }
  private wcRunHtml(): string {
    const m = this.loadMgr();
    const stage = m.wcStage as 'qf' | 'sf' | 'final';
    const { path, nation } = this.wcData(m.wcEdition!);
    const dots = (['qf', 'sf', 'final'] as const).map((s, i) => { const order = { qf: 0, sf: 1, final: 2 }; const cur = order[stage]; return `<span class="sf-cont-dot ${i < cur ? 'won' : i === cur ? 'now' : ''}">${['QF', 'SF', 'F'][i]}</span>`; }).join('');
    const opp = this.wcStageOpp(path, stage);
    const runList = (m.wcRun ?? []).map((r) => `<span class="wc-run-chip ${r.won ? 'w' : 'l'}">${r.round} ${r.my}-${r.opp}</span>`).join(' ');
    return `<div class="sf-wc"><div class="sf-wc-head">🌐 THE WORLD FINALS — Edition ${m.wcEdition} · ${flagImg(nation, 18)} ${nation}</div>`
      + `<div class="sf-wc-txt">Group ${String.fromCharCode(65 + path.groupIndex)} ${path.groupFinish?.toLowerCase()} → into the knockouts. ${runList ? `<div class="wc-run-strip">${runList}</div>` : ''}</div>`
      + `<div class="sf-cont-head" style="margin-bottom:7px;">${dots}</div>`
      + `<div class="sf-cont-tie"><b>${this.wcStageLabel(stage)}</b> (neutral) vs ${flagImg(opp.opp, 16)} <b>${opp.opp}</b> · rating ~${opp.oppStrength}</div>`
      + `<div class="sf-cont-btns"><button class="primary" id="sf-wc-play">Play the tie ▶</button> <button id="sf-wc-sim">⏩ Sim it</button></div></div>`;
  }
  private async followWorldCup() {
    const edition = this.wcEditionDue(); if (edition == null) return;
    const m = this.loadMgr();
    const { wc, path } = this.wcData(edition);
    if (!path.qualified) { // group-stage exit — nothing to play; show the full tournament and bank a small payoff
      // persist wcEdition (+ an empty run → deriveWcFinish reads 'Group stage') so the concluded report stays
      // reviewable — the done-surface + review handler both gate on wcEdition != null (PT-128, extends PT-72)
      this.saveMgr({ ...m, wcEdition: edition, wcRun: [], wcSeen: edition, wcStage: 'done' });
      try { const r = await api.spSeasonReward({ pos: 6, size: 10, sponsor: undefined, kind: 'world' }); if (this.account?.coins != null) this.account.coins = r.coins; } catch { /* offline */ }
      this.showWorldCup(wc, 'Group stage'); return;
    }
    this.saveMgr({ ...m, wcEdition: edition, wcStage: 'qf', wcRun: [] }); // qualified → play the knockout run
    this.showSeason();
  }
  private wcTie(stage: 'qf' | 'sf' | 'final') {
    const m = this.loadMgr(); if (m.wcEdition == null) return;
    const { path, nation } = this.wcData(m.wcEdition);
    const opp = this.wcStageOpp(path, stage);
    const short = (opp.opp.match(/[A-Z]/g) ?? ['N', 'A', 'T']).join('').slice(0, 3);
    const oppSeed = (this.leagueSeed() ^ ([...opp.opp].reduce((a, c) => a + c.charCodeAt(0), 0) * 131)) >>> 0;
    const oppClub = generateClub('wc-' + m.wcEdition + '-' + stage, opp.opp, short, 0x3a7bd5, opp.oppStrength, oppSeed, true);
    void nation;
    const oppTactics = seededOpponentTactics(oppSeed);
    this.spFixture = { idx: -1, oppClub, oppName: opp.opp, oppStrength: opp.oppStrength, venue: 'home', neutral: true, oppLineup: autoPickXI(oppClub, oppTactics.formation), oppTactics, comp: 'wc' }; // World-Finals ties are on neutral ground → no fan-zone home bonus (PT-130)
    this.openLineup('match', { id: 'wc-opp', handle: opp.opp, venue: 'home' });
  }
  private playWorldCupTie() { const s = this.loadMgr().wcStage; if (s === 'qf' || s === 'sf' || s === 'final') this.wcTie(s); }
  private simWorldCupTie() {
    const m = this.loadMgr(); const stage = m.wcStage; if (stage !== 'qf' && stage !== 'sf' && stage !== 'final' || m.wcEdition == null) return;
    const { path } = this.wcData(m.wcEdition);
    const opp = this.wcStageOpp(path, stage);
    // World-Finals ties are neutral: no home term (was an unearned +0.25), but training/staff still count (PT-129/130)
    const { strDelta } = this.simEdge('away');
    const r = this.simFixtureResult(this.starOverall() + strDelta, opp.oppStrength, ((this.leagueSeed() >>> 0) ^ ((m.wcEdition * 977 + stage.length * 131) >>> 0)) >>> 0, 0);
    this.resolveWorldCup(r.myGoals, r.oppGoals, opp.opp);
  }
  /** Apply a knockout result: win → next round (or lift the trophy); level → seeded shootout; loss → out. */
  private resolveWorldCup(myGoals: number, oppGoals: number, oppName: string) {
    const m = this.loadMgr(); const stage = m.wcStage as 'qf' | 'sf' | 'final'; if (m.wcEdition == null) return;
    let won = myGoals > oppGoals, pens = false;
    if (myGoals === oppGoals) { // seeded shootout — lean to the stronger side, like the continental cup + the seeded bracket, not a flat coin-flip (PT-69)
      pens = true;
      const oppStrength = this.wcStageOpp(this.wcData(m.wcEdition).path, stage).oppStrength;
      const h = ((this.leagueSeed() >>> 0) ^ ((m.wcEdition * 733 + stage.length * 29) >>> 0)) >>> 0;
      won = ((h % 1000) / 1000) < (0.5 + (this.starOverall() - oppStrength) * 0.03);
    }
    const label = this.wcStageLabel(stage);
    const shortRound = stage === 'qf' ? 'QF' : stage === 'sf' ? 'SF' : 'F';
    const run = [...(m.wcRun ?? []), { round: shortRound, my: myGoals, opp: oppGoals, oppName, won }];
    if (!won) { // knocked out — the run ends here
      const finish = stage === 'final' ? 'Runners-up' : stage === 'sf' ? 'Semi-finals' : 'Quarter-finals';
      this.saveMgr({ ...m, wcStage: 'done', wcSeen: m.wcEdition, wcRun: run, wcFinals: (m.wcFinals ?? 0) + (stage === 'final' ? 1 : 0) });
      toast(`${label} lost ${myGoals}-${oppGoals}${pens ? ' on pens' : ''} — ${finish}`);
      this.concludeWorldCup(finish, oppName); return;
    }
    if (stage === 'final') { // champions!
      this.saveMgr({ ...m, wcStage: 'done', wcSeen: m.wcEdition, wcWins: (m.wcWins ?? 0) + 1, wcFinals: (m.wcFinals ?? 0) + 1, wcRun: run });
      audio.chime('triumph');
      toast(`🏆 WORLD CHAMPIONS! ${homeNation(this.starSurname())} win the final${pens ? ' on penalties' : ''}`);
      this.concludeWorldCup('Champions', oppName); return;
    }
    const next = stage === 'qf' ? 'sf' : 'final';
    this.saveMgr({ ...m, wcStage: next, wcRun: run });
    toast(`✅ ${label} won ${myGoals}-${oppGoals}${pens ? ' (pens)' : ''} — into the ${this.wcStageLabel(next)}!`);
    this.showSeason();
  }
  /** After a played run ends, show the tournament with the star's ACTUAL result + bank the legacy payoff. */
  private async concludeWorldCup(finish: WCResult['myFinish'], finalFoe: string) {
    const m = this.loadMgr();
    try { const r = await api.spSeasonReward({ pos: finish === 'Champions' ? 1 : finish === 'Runners-up' ? 2 : finish === 'Semi-finals' ? 3 : 4, size: 10, sponsor: undefined, kind: 'world' }); if (this.account?.coins != null) this.account.coins = r.coins; toast(`💰 World Finals payoff +${r.prize.toLocaleString()}c`); } catch { /* offline */ }
    const { wc } = this.wcData(m.wcEdition!);
    this.checkAchievements(); // World Finals final reached / won
    this.showWorldCup(wc, finish, finalFoe);
  }
  /** The tournament report. `playedFinish` (+ `finalFoe`) reflect the star's ACTUAL played run and override
   *  the seeded outcome; for a group-stage exit (or no played run) the full seeded bracket is shown instead. */
  private showWorldCup(wc: WCResult, playedFinish?: WCResult['myFinish'], finalFoe?: string) {
    this.showScreen('season');
    audio.play('international'); // the World Finals — a national-team competition, gets the international theme
    const nation = wc.myNation;
    const finish = playedFinish ?? wc.myFinish;
    const run = this.loadMgr().wcRun ?? [];
    const played = playedFinish != null && playedFinish !== 'Group stage' && run.length > 0;
    const groupHtml = wc.groups.map((g, gi) => `<div class="wc-group"><h5>Group ${String.fromCharCode(65 + gi)}</h5>`
      + `<table class="lt-table wc-gtable"><thead><tr><th>Nation</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>`
      + g.rows.map((r, i) => `<tr class="${r.mine ? 'mine' : ''} ${i < 2 ? 'wc-qual' : ''}"><td class="lt-name">${flagImg(r.nation, 15)} ${r.nation}</td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GD > 0 ? '+' : ''}${r.GD}</td><td class="lt-pts">${r.Pts}</td></tr>`).join('')
      + `</tbody></table></div>`).join('');
    // the actual champion for a played run: you (if you won), the side that beat you in the final, else — if
    // you fell earlier — the seeded champion, UNLESS that's a nation YOU knocked out (which would contradict
    // your own run chips). In that case the side that eliminated you is the natural "went on to win it" (PT-36).
    const beaten = new Set(run.filter((r) => r.won).map((r) => r.oppName));
    const eliminator = run.find((r) => !r.won)?.oppName;
    const realChampion = finish === 'Champions' ? nation
      : finish === 'Runners-up' ? (finalFoe ?? wc.champion)
      : (wc.champion !== nation && !beaten.has(wc.champion)) ? wc.champion
      : (eliminator && eliminator !== nation && !beaten.has(eliminator)) ? eliminator
      : (wc.final.a === nation ? wc.final.b : wc.final.a);
    let bracketHtml: string;
    if (played) {
      const runChips = run.map((r) => `<div class="wc-ko-tie ${r.won ? 'mine' : ''}">${flagImg(nation, 15)} <b>${nation}</b> ${r.my}-${r.opp} ${flagImg(r.oppName, 15)} <b>${r.oppName}</b> → <span class="${r.won ? 'wc-win' : 'wc-out'}">${flagImg(r.won ? nation : r.oppName, 14)} ${r.won ? nation : r.oppName}</span></div>`).join('');
      bracketHtml = `<h4 class="scout-h4">${nation.toUpperCase()}'S KNOCKOUT RUN</h4>${runChips}`
        + `<div class="wc-final"><div class="wc-champ">🏆 Champions: ${flagImg(realChampion, 16)} <b>${realChampion}</b></div></div>`;
    } else {
      const koTie = (t: import('@fm/shared').WCTie) => `<div class="wc-ko-tie ${t.mine ? 'mine' : ''}">${flagImg(t.a, 15)} <b>${t.a}</b> ${t.gh}-${t.ga} ${flagImg(t.b, 15)} <b>${t.b}</b>${t.pens ? ' (pens)' : ''} → <span class="wc-win">${flagImg(t.winner, 14)} ${t.winner}</span></div>`;
      const f = wc.final;
      bracketHtml = `<h4 class="scout-h4">QUARTER-FINALS</h4>${wc.quarters.map(koTie).join('')}`
        + `<h4 class="scout-h4">SEMI-FINALS</h4>${wc.semis.map(koTie).join('')}`
        + `<div class="wc-final ${f.mine ? 'mine' : ''}"><div class="wc-final-lbl">🏆 FINAL</div>${flagImg(f.a, 16)} <b>${f.a}</b> ${f.gh}-${f.ga} ${flagImg(f.b, 16)} <b>${f.b}</b>${f.pens ? ' (pens)' : ''}<div class="wc-champ">Champions: ${flagImg(wc.champion, 16)} <b>${wc.champion}</b></div></div>`;
    }
    const badge = finish === 'Champions' ? '🏆 WORLD CHAMPIONS' : finish === 'Runners-up' ? '🥈 Runners-up' : finish === 'Semi-finals' ? '🥉 Semi-finalists' : finish === 'Quarter-finals' ? '🎯 Quarter-finalists' : '⚽ Group stage';
    const wcSeed = this.leagueSeed();
    // seeded, edition-varying verdict (2 variants per finish) instead of one hardcoded line per finish (PT-71);
    // keep the surname flourish for the very top moment.
    const verdict = worldCupFinishBlurb(wcSeed, wc.edition, nation, finish)
      + (finish === 'Champions' ? ` An immortal chapter for the ${this.starSurname()} name.` : '');
    // a deterministic "tournament story" — how the star's group went + how the final played out (from intl.ts)
    const myGi = wc.groups.findIndex((g) => g.rows.some((r) => r.mine));
    const groupDrama = myGi >= 0 ? wcGroupDramaBlurb(wcSeed, wc.edition, myGi, wc.groups[myGi].rows) : '';
    // the seeded final is only the STAR's match when he actually reached it — otherwise this narrated a game he
    // was never in (a QF exit "described" the tournament final). Only show it for a final he played (PT-68).
    const reachedFinal = finish === 'Champions' || finish === 'Runners-up';
    const finalDrama = (!played || reachedFinal) ? wcKnockoutDramaBlurb(wcSeed, wc.edition, wc.final) : '';
    const dramaLine = (groupDrama || finalDrama) ? `<div class="wc-drama">📖 ${[groupDrama, finalDrama].filter(Boolean).join(' ')}</div>` : '';
    $('season-body').innerHTML = `<div class="wc-report"><div class="wc-report-head">🌐 THE WORLD FINALS — Edition ${wc.edition}</div>`
      + `<div class="wc-verdict ${finish === 'Champions' ? 'champ' : ''}"><span class="wc-badge">${badge}</span> ${verdict}</div>`
      + dramaLine
      + `<div class="wc-groups">${groupHtml}</div>`
      + bracketHtml
      + `<div style="text-align:center;margin-top:16px;"><button class="primary" id="wc-back">Back to the season →</button></div></div>`;
    $('wc-back')?.addEventListener('click', () => this.showSeason());
  }

  /** A seeded 'gaffer's take' on the season so far — composed from recent form + league position, so the
   *  season reads as a story, not just a table. Deterministic (no rng). */
  private gafferTake(played: PlayedResult[], pos: number, size: number, club: string): string {
    if (!played.length) return `A new season, a blank page. ${club} kick off with everything to play for.`;
    const last = played[played.length - 1], won = last.myGoals > last.oppGoals, lost = last.myGoals < last.oppGoals;
    let run = 0; for (let i = played.length - 1; i >= 0; i--) { const r = played[i]; if (r.myGoals >= r.oppGoals) run++; else break; }
    let lose = 0; for (let i = played.length - 1; i >= 0; i--) { const r = played[i]; if (r.myGoals < r.oppGoals) lose++; else break; }
    if (pos === 1) return `Top of the table — ${club} are the team to catch. Dare they dream of the title?`;
    if (pos >= size - 1) return `Rooted near the foot of the table — this is a relegation scrap now for ${club}.`;
    if (run >= 3) return `${run} unbeaten and climbing — ${club} are on a real roll.`;
    if (lose >= 2) return `${lose} defeats on the spin — the mood around ${club} has turned; a response is needed.`;
    if (won && last.myGoals - last.oppGoals >= 3) return `A statement win, ${last.myGoals}-${last.oppGoals} — the ${club} fans went home happy.`;
    if (lost) return `A defeat to swallow. ${club} regroup and go again.`;
    if (won) return `A big three points banked — ${club} keep pushing up the table.`;
    return `Honours even, but every point counts in ${club}'s season.`;
  }

  /** A deterministic scoreline for a simulated (not played-live) fixture, by squad strength. `homeTerm` is the
   *  venue edge (default 0.25 for neutral/knockout callers); a league sim passes it per-fixture so an AWAY game
   *  doesn't get an unearned home bias (PT-118). */
  private simFixtureResult(myStr: number, oppStr: number, seed: number, homeTerm = 0.25): PlayedResult {
    // mix the seed before shifting — see clubseason.ts; unmixed, neighbouring fixtures scored identically (PT-900)
    const mixed = (() => { let x = seed >>> 0; x = Math.imul(x ^ (x >>> 16), 2246822507) >>> 0; x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0; return (x ^ (x >>> 16)) >>> 0; })();
    const rnd = (n: number) => (((mixed >>> (n & 15)) ^ (mixed >>> ((n + 7) & 15))) % 100) / 100;
    const diff = (myStr - oppStr) * 0.10 + homeTerm; // eased (PT-901)
    return { myGoals: Math.min(6, Math.max(0, Math.round(1.2 + diff + (rnd(1) - 0.5) * 3.2))), oppGoals: Math.min(6, Math.max(0, Math.round(1.2 - diff + (rnd(2) - 0.5) * 3.2))) };
  }
  /** The club-building edge a SIMMED league fixture should carry — the sim otherwise ignores everything a played
   *  match layers on (facilities, staff, venue), making that investment worthless the moment you sim (PT-118).
   *  Mirrors startSpMatchWith: training-ground + backroom staff help home AND away; fan zone + venue are home-only. */
  private simEdge(venue: 'home' | 'away'): { strDelta: number; homeTerm: number } {
    const trainLvl = this.facLevels.training ?? 1, fanLvl = this.facLevels.fanzone ?? 1;
    const staff = this.loadMgr().staff ?? [];
    let strDelta = (trainLvl - 1) * 0.4;                          // training-ground conditioning — both venues
    if (staff.includes('fitness')) strDelta += 0.4;
    if (staff.includes('attack')) strDelta += 0.4;
    if (staff.includes('assistant')) strDelta += 0.4;
    const homeTerm = venue === 'home' ? 0.25 + (fanLvl - 1) * 0.06 : 0; // venue + fan-zone edge apply at home only
    return { strDelta, homeTerm };
  }
  private simRemainingFixtures() {
    const seed = this.leagueSeed(), clubName = this.club.name;
    const fixtures = seasonFixtures(clubName, seed, this.clubTier()), opps = seededOpponents(clubName, seed, this.clubTier());
    const m = this.loadMgr(), myStr = this.clubLeagueStrength();
    for (let i = m.results.length; i < fixtures.length; i++) {
      const opp = opps.find((o) => o.name === fixtures[i].oppName)!;
      const { strDelta, homeTerm } = this.simEdge(fixtures[i].venue === 'H' ? 'home' : 'away'); // fold in facilities/staff + the correct venue edge
      m.results.push(this.simFixtureResult(myStr + strDelta, opp.strength, ((seed >>> 0) ^ ((m.season * 131 + i) >>> 0)) >>> 0, homeTerm));
    }
    this.saveMgr(m);
    this.showSeason();
  }

  /** Roll into the next season: bank a title if the club finished top, age the star a year, and — once he
   *  reaches the end of his career — trigger his retirement and the succession to the heir. */
  private async nextSeason() {
    const m = this.loadMgr();
    const t = liveTable(this.club.name, this.clubLeagueStrength(), 1, this.leagueSeed(), m.results, this.clubTier(), this.seasonResultSeed());
    // this season's W/D/L (fed to the lifetime manager record that powers prestige)
    const rec = (m.results ?? []).reduce((a, r) => { r.myGoals > r.oppGoals ? a.wins++ : r.myGoals < r.oppGoals ? a.losses++ : a.draws++; return a; }, { wins: 0, draws: 0, losses: 0 });
    // bank the season prize money (coins → reinvest in facilities), closing the manager economy loop
    try { const r = await api.spSeasonReward({ pos: t.pos, size: t.size, sponsor: m.sponsor, tier: this.clubTier(), ...rec }); if (this.account?.coins != null) this.account.coins = r.coins; toast(`💰 Season prize: +${r.prize.toLocaleString()}c${r.sponsorBonus ? ` + 📣 ${r.sponsorBonus.toLocaleString()}c sponsor bonus` : ''}${t.pos === 1 ? ' 🏆 CHAMPIONS!' : ` · ${this.ordinal(t.pos)}`}`); } catch { /* offline: no prize */ }
    // BOARD VERDICT — how the board judges this season vs what your prestige (and last season) earned you.
    // Stored on the save and surfaced atop next season's planning screen (see showSeason).
    let lastBoard: { message: string; mood: BoardMood; expectation: string } | undefined;
    try {
      const { prestige } = await api.prestige();
      // derive the COMING season's expectation from the season JUST ended (t.pos), incl. its tier move — not
      // from m.lastFinishPos (the season before that), which lagged the board a year behind reality (PT-64/66)
      const expectation = deriveExpectation({ prestigeLevelIdx: prestige.levelIdx, priorFinish: this.finishOf(t.pos, t.size, this.clubTier()) });
      const gp = Math.max(1, rec.wins + rec.draws + rec.losses);
      const st = boardStanding((this.leagueSeed() ^ (m.season * 0x9e3779b1)) >>> 0, {
        position: t.pos, total: t.size, promote: 2, relegate: this.clubTier() < TIERS ? 2 : 0, // top-2 up / bottom-2 down (PT-28); no relegation in the basement, so the drop-zone penalty can't fire there (PT-123)
        points: rec.wins * 3 + rec.draws, matchesPlayed: gp, totalMatches: gp, expectation,
      });
      lastBoard = { message: st.message, mood: st.mood, expectation };
    } catch { /* offline / no prestige — skip the verdict */ }
    // TRAINING: the star develops per the focus (young grow it, veterans decline) — his overall shifts the club
    if (m.starId) {
      try { const d = await api.developPlayer(m.starId, { focus: m.trainFocus ?? 'passing', age: m.starAge ?? 27 }); this.setMe(await api.me()); toast(`🏋️ ${m.starName} — off-season training (OVR now ${d.overall})`); } catch { /* offline */ }
    }
    // THE LIVING SQUAD: the rest of the squad lives too — the young improve, the veterans fade, the old
    // retire, deals run out and wages come due. This is what makes the manager's squad feel like people he
    // has to keep investing in rather than a static roster (PT-90/PT-92).
    if (m.starId) {
      // Clear FIRST. This assignment sits inside the try, so when advanceSquadSeason threw the field kept
      // its previous value and the end-of-season panel rendered LAST season's report as if it were
      // current — right down to re-announcing players it had retired a year earlier. (PT-807)
      this.pendingSquadReport = null;
      try {
        const sq = await api.advanceSquadSeason({ trainingLvl: this.facLevels.training ?? 1, wonSomething: t.pos === 1, goodSeason: t.pos <= Math.ceil(t.size / 2) });
        if (this.account?.coins != null) this.account.coins = sq.coins;
        this.setMe(await api.me());
        this.pendingSquadReport = sq;
        const mm = this.loadMgr(); this.saveMgr({ ...mm, squadReport: sq, squadReportSeason: mm.season });
      } catch { /* offline — squad rollover is best-effort, never blocks the season */ }
    }
    if (t.pos === 1) { audio.play('triumph'); audio.chime('triumph'); } // league champions — the victory cue
    // PROMOTION / RELEGATION — the pyramid climb: top-2 go up, bottom-2 go down (club property, survives the heir)
    const tier = this.clubTier();
    const promoted = t.pos <= 2 && tier > 1;
    const relegated = t.pos >= t.size - 1 && tier < TIERS;
    const newTier = promoted ? tier - 1 : relegated ? tier + 1 : tier;
    if (newTier !== tier) this.setClubTier(newTier);
    if (promoted) { toast(`⬆️ PROMOTED to ${tierName(newTier)}!`); audio.chime('triumph'); }
    else if (relegated) toast(`⬇️ Relegated to ${tierName(newTier)}.`); this.feedEvent('relegation', '⬇️', undefined, { from: tierName(tier), to: tierName(newTier) });
    const titles = (m.titles ?? 0) + (t.pos === 1 ? 1 : 0);
    const age = (m.starAge ?? 22) + 1;
    // his playing days are over — the heir comes through. Carry any final-season promotion/relegation into
    // the send-off so it's acknowledged (the reveal banner would be stale for the heir a generation later, PT-27).
    if (age >= (m.retireAge ?? 34)) { this.retireStar(titles, m.contTitles ?? 0, undefined, (promoted || relegated) ? { move: promoted ? 'promoted' : 'relegated', tier: tierName(newTier) } : undefined); return; }
    const qualified = tier === 1 && t.pos <= 3; // only the TOP flight's top-3 book a Continental Cup place
    if (qualified) toast('🌍 Top-3 in the top flight — qualified for the Continental Cup!');
    // new season → fresh sponsor; drop any unfinished World-Finals run (it belongs to its staging season)
    this.saveMgr({ ...m, season: m.season + 1, results: [], starAge: age, titles, sponsor: undefined, contElig: qualified, contRound: 0, contOut: false, contBlurb: undefined, wcStage: undefined, wcEdition: undefined, wcRun: undefined, lastBoard, lastFinishPos: t.pos, lastTierMove: promoted ? 'promoted' : relegated ? 'relegated' : undefined });
    this.checkAchievements(); // titles / seasons / prestige milestones
    this.showSeason();
  }

  /** Map a final league position → the board's shorthand for how that season went, feeding
   *  deriveExpectation()'s momentum nudge. Undefined position (first season) → null (no prior). */
  private finishOf(pos: number | undefined, size: number, tier?: number): PriorFinish {
    if (pos == null) return null;
    // a TIER MOVE is the season's headline — feed it to deriveExpectation so the board's standard reacts to
    // the promotion/relegation itself (its `promotion`/`relegated` nudges were dead before, PT-66)
    if (tier != null) {
      if (pos <= 2 && tier > 1) return 'promotion';
      if (pos >= size - 1 && tier < TIERS) return 'relegated';
    }
    if (pos === 1) return 'title';
    if (pos <= 3) return 'playoffs';           // top-3 books continental football
    if (pos > size - 3) return 'survival';     // scrapping near the bottom
    return 'midtable';
  }

  /** Turn a raw board-expectation enum into player-facing English, clamped to what THIS tier can deliver —
   *  the pyramid has no playoffs (top-2 auto-promote), and the top flight can't be promoted / the basement
   *  can't be relegated, so those targets are rephrased instead of demanding an impossible finish (PT-65/67). */
  private expectationLabel(exp: string, tier: number): string {
    if (tier <= 1) { // top flight — no promotion above it
      if (exp === 'title') return 'the title';
      if (exp === 'promotion' || exp === 'playoffs') return 'a top-half finish and a real title push';
      if (exp === 'survival') return 'to stay up';
      return 'a solid top-flight season';
    }
    if (tier >= TIERS && exp === 'survival') return 'steady progress'; // basement — can't drop
    const MAP: Record<string, string> = { title: 'to win the league', promotion: 'promotion', playoffs: 'a promotion push', midtable: 'a solid mid-table season', survival: 'to avoid the drop' };
    return MAP[exp] ?? exp;
  }

  /** What the retiring star does NEXT — a mostly-narrative choice that colours the epilogue and decides
   *  whether the existing mentoring→heir bonus (dev_bonus on composure/leadership) actually applies. Real
   *  retired pros describe identity loss and pivoting into coaching/media/mentoring (docs/research-player-
   *  career.md §11 — Joe Thompson, Karen Bardsley). */
  private static readonly NEXT_LIFE: Record<'coaching' | 'media' | 'mentoring', { label: string; icon: string; blurb: string }> = {
    coaching: { icon: '🎓', label: 'Move into coaching', blurb: 'He’s already talked about his first badge — the dressing room hasn’t seen the last of him, just from a different angle.' },
    media: { icon: '🎙️', label: 'Move into the media', blurb: 'A studio wants him behind a microphone next season — a new way to stay close to a game he can’t quite leave behind.' },
    mentoring: { icon: '🧭', label: 'Stay close, mentor the heir', blurb: 'He isn’t going far. The next generation of the family will have him in their corner, every step of the way.' },
  };
  // the will/inheritance decision at generation hand-off — a concrete named choice about what the heir
  // carries forward (each maps to a real deterministic effect applied in api.succeed).
  private static readonly WILL: Record<'craft' | 'name' | 'fortune', { label: string; icon: string; blurb: string }> = {
    craft:   { icon: '🧠', label: 'The Craft',   blurb: 'His footballing brain — a mental head-start in the heir’s development.' },
    name:    { icon: '👑', label: 'The Name',    blurb: 'The family renown — the heir starts with more pedigree, more doors open.' },
    fortune: { icon: '💰', label: 'The Fortune', blurb: 'The family wealth — a larger inheritance banked for the club.' },
  };
  private acceptStarBid(bid: { club: string; fee: number }, m: MgrState) {
    const surname = (m.starName ?? '').trim().split(/\s+/).slice(1).join(' ') || 'the family';
    this.openConfirm(`Sell <b>${m.starName}</b> to <b>${bid.club}</b> for <b>${bid.fee.toLocaleString()}c</b>? He leaves the club now — and the next of the <b>${surname}</b> line comes through early to carry the name on.`, 'Sell the star', () => {
      // The fee is NOT banked here — it lands only when the succession completes (bringThroughHeir → succeed),
      // so abandoning the will screen can't keep the cash while the star stays in the squad (PT-60).
      audio.chime('triumph');
      toast(`🤝 ${bid.club} agree ${bid.fee.toLocaleString()}c for ${m.starName} — bring his heir through to seal it`);
      this.retireStar(m.titles ?? 0, m.contTitles ?? 0, { fee: bid.fee, club: bid.club });
    });
  }
  private retireStar(titles: number, contTitles = 0, sold?: { fee: number; club: string }, finalMove?: { move: 'promoted' | 'relegated'; tier: string }) {
    const m = this.loadMgr();
    const seasons = m.season;
    const mentorship = Math.max(0, (m.starAge ?? 30) - 30); // veteran years spent passing on the game to the next gen — only banked if he chooses to mentor
    this.showScreen('academy');
    audio.play('emotional'); // the retirement/succession beat — the bloodline moment (its track carries the weight)
    const surname = (m.starName ?? '').trim().split(/\s+/).slice(1).join(' ') || m.starName || 'the family';
    const honours = [titles ? `${titles} league title${titles === 1 ? '' : 's'}` : '', contTitles ? `${contTitles} continental cup${contTitles === 1 ? '' : 's'}` : '', (m.wcWins ?? 0) ? `${m.wcWins} World Finals title${(m.wcWins ?? 0) === 1 ? '' : 's'}` : ''].filter(Boolean);
    const honourLine = honours.length ? ` and ${honours.join(', ')}` : '';
    // THE HEADLINES STOP: real retired pros describe the abruptness of the press/media drop-off — front
    // pages one day, silence the next, the game already moved on (research §11, Joe Thompson's own words).
    const headlinesLine = ` The back pages carried him for one last day. By the morning after, the game had already moved on to someone else’s story.`;
    const finalMoveLine = finalMove ? ` In his very last season he ${finalMove.move === 'promoted' ? 'took the club up to' : 'saw the club drop to'} <b>${finalMove.tier}</b> — a parting ${finalMove.move === 'promoted' ? 'gift to the fans' : 'blow for the heir to put right'}.` : '';
    const titleLine = sold ? `${m.starName} is sold to ${sold.club}` : `${m.starName} hangs up his boots`;
    // the send-off varies run to run (PT-57) — the emotional peak shouldn't read word-for-word each dynasty
    const era = `${seasons} season${seasons === 1 ? '' : 's'}`;
    const club = `<b>${this.club?.name}</b>`;
    const farewell = [
      `${m.starName} — once the heartbeat of this side on the pitch, latterly the man in the dugout — retires a club great after ${era} steering ${club}${honourLine}. Two careers in the same shirt, one bloodline throughout.`,
      `They'd build a statue for less. After ${era} at ${club}${honourLine}, ${m.starName} steps away for good — a one-club life, on the grass and in the technical area, the fans will talk about for a generation.`,
      `The boots go up for the last time. ${m.starName} leaves ${club} after ${era}${honourLine}, having given the club everything twice over — as its finest player, then as the gaffer who couldn't quite let go.`,
      `Some names become the club. After ${era}${honourLine}, ${m.starName} finally walks away from ${club} — a story that started with a boy's first touch and ended with a veteran's last team-talk.`,
    ][((this.leagueSeed() ^ Math.imul(seasons + 1, 2654435761)) >>> 0) % 4];
    const storyLine = sold
      ? `After ${era} at ${club}${honourLine}, ${m.starName} leaves for <b>${sold.club}</b> in a <b>${sold.fee.toLocaleString()}c</b> deal — a wrench for the fans, but the money reshapes the club’s future.`
      : `${farewell}${finalMoveLine}${headlinesLine}`;
    $('academy-body').innerHTML = `<div class="cg-graduation"><div class="cg-grad-title"><span class="ico-inline ico-lg">${sprite('banner')}</span> ${titleLine}</div>`
      + `<div class="cg-epilogue">${storyLine} But the <b>${surname}</b> name isn't done — the next of the line is about to kick a ball for the very first time.</div>`
      + `<div class="cg-prompt">What does ${m.starName} do next?</div>`
      + `<div class="cg-prompt cg-hint-sub">Only <b>mentoring</b> passes something to the heir — the others are his own next chapter. Your call (#56).</div>`
      + `<div id="cg-nextlife">` + (Object.keys(Game.NEXT_LIFE) as Array<'coaching' | 'media' | 'mentoring'>).map((k) => {
        const nl = Game.NEXT_LIFE[k];
        // disclose the blurb + effect BEFORE committing (was a blind, hidden fake-choice) so the heir bonus is
        // explicit and the trade-off is honest (PT-56)
        const heirBonus = k === 'mentoring' ? Math.min(3, Math.ceil(mentorship / 2)) : 0;
        const eff = k === 'mentoring'
          ? `<div class="cg-effs">🎓 ${heirBonus > 0 ? `gives the heir a <b>+${heirBonus} mentality</b> head-start (composure + leadership)` : 'stays in the heir’s corner'}</div>`
          : `<div class="cg-effs cg-eff-mute">a new chapter for him — no direct effect on the heir</div>`;
        return `<div class="cg-coach" data-nextlife="${k}"><div class="cg-cname">${nl.icon} ${nl.label}</div><div class="cg-cdesc">${nl.blurb}</div>${eff}</div>`;
      }).join('') + `</div></div>`;
    document.querySelectorAll('#cg-nextlife [data-nextlife]').forEach((el) => el.addEventListener('click', () => {
      const choice = (el as HTMLElement).dataset.nextlife as 'coaching' | 'media' | 'mentoring';
      const nl = Game.NEXT_LIFE[choice];
      const appliedMentorship = choice === 'mentoring' ? mentorship : 0; // reuse the existing mentoring→heir bonus, only for this choice
      const windfall = appliedMentorship > 0 ? ` · 🎓 mentored heir (+${Math.min(3, Math.ceil(appliedMentorship / 2))} mentality)` : '';
      // THE WILL: a concrete named choice about what the heir inherits (BitLife-style hand-off decision)
      const willCards = (Object.keys(Game.WILL) as Array<'craft' | 'name' | 'fortune'>).map((k) => {
        const w = Game.WILL[k];
        return `<div class="cg-coach" data-will="${k}"><div class="cg-cname">${w.icon} ${w.label}</div><div class="cg-cdesc">${w.blurb}</div></div>`;
      }).join('');
      // SAY WHAT IS ABOUT TO HAPPEN. Choosing a will tears the entire manager layer down — XI, tactics,
      // fixtures, board, league position all vanish in one step — and drops the player back into ~120 turns
      // of card play. Nothing warned them, and nothing said the CLUB survives it, so it read as losing
      // everything they had built rather than handing it on. (PT-509)
      $('cg-nextlife').outerHTML = `<div class="cg-epilogue">${nl.blurb}</div>`
        + `<div class="cg-grad-windfall">🌳 The bloodline continues${windfall}</div>`
        + `<div class="cg-succession-note">▸ Choosing here starts the heir's own career — around 120 card turns from age 10.`
        + ` <b>The club, its division, your facilities, staff and honours all stay yours</b>; you take the reins again when he breaks into the first team.</div>`
        + `<div class="cg-prompt">What does ${m.starName} pass down to his heir?</div>`
        + `<div id="cg-will">${willCards}</div>`;
      document.querySelectorAll('#cg-will [data-will]').forEach((el) => el.addEventListener('click', () =>
        this.bringThroughHeir(m, seasons, titles, appliedMentorship, (el as HTMLElement).dataset.will as 'craft' | 'name' | 'fortune', sold?.fee ?? 0)));
    }));
  }

  /** Complete the succession: apply the chosen inheritance, record the heirloom for the Trophy Room, and
   *  reveal the heir. */
  private async bringThroughHeir(m: MgrState, seasons: number, titles: number, mentorship: number, inheritance: 'craft' | 'name' | 'fortune', saleFee = 0) {
    const w = Game.WILL[inheritance];
    const will = $('cg-will');
    if (will) will.outerHTML = `<div class="cg-grad-windfall">${w.icon} The heir inherits <b>${w.label}</b></div><button id="cg-heir" class="primary" disabled>Raising the next generation…</button>`;
    try {
      const cups = (m.contTitles ?? 0) + (m.wcWins ?? 0); // continental + World-Finals silverware, onto the permanent legend card (PT-113)
      const r = await api.succeed(m.starId!, { seasons, titles, cups, mentorship, inheritance, saleFee });
      if (this.account && typeof r.coins === 'number') this.account.coins = r.coins; // the sale fee + legacy are banked atomically inside succeed (PT-60)
      this.recordHeirloom(r.prospect.generation, `${w.icon} ${w.label}`); // remembered against the heir's generation
      this.clearMgr(); // back to player phase — the heir's card-career begins
      this.setMe(await api.me());
      this.checkAchievements(); // a legend retired → new generation / legends / rating milestones
      toast(`${w.icon} The heir inherits ${w.label}${(r as any).testimonial ? ` · 🎗️ +${(r as any).testimonial.toLocaleString()}c testimonial` : ''}${r.saleFee ? ` · 💰 +${r.saleFee.toLocaleString()}c from the sale` : ''}${r.legacy ? ` · +${r.legacy.toLocaleString()}c legacy` : ''}`);
      this.showProspectCard(r.prospect, true); // reveal the heir → Develop him → play his career → hand off again
    } catch (e: any) {
      toast(e?.body?.error ?? 'Succession failed');
      const b = $('cg-heir') as HTMLButtonElement | null; if (b) { b.disabled = false; b.textContent = 'Try again →'; b.addEventListener('click', () => this.bringThroughHeir(m, seasons, titles, mentorship, inheritance, saleFee)); }
    }
  }
  // heirlooms: which inheritance each generation was handed, shown in the bloodline tree (per save)
  private recordHeirloom(generation: number, label: string) {
    try { const k = 'fm_heir_' + (this.account?.handle ?? 'x'); const map = JSON.parse(localStorage.getItem(k) || '{}'); map[generation] = label; localStorage.setItem(k, JSON.stringify(map)); } catch { /* ignore */ }
  }
  private loadHeirlooms(): Record<string, string> {
    try { return JSON.parse(localStorage.getItem('fm_heir_' + (this.account?.handle ?? 'x')) || '{}'); } catch { return {}; }
  }

  private playNextSpFixture() {
    const seed = this.leagueSeed(), clubName = this.club.name;
    const fixtures = seasonFixtures(clubName, seed, this.clubTier());
    const idx = this.loadMgr().results.length;
    if (idx >= fixtures.length) return;
    const f = fixtures[idx];
    const opp = seededOpponents(clubName, seed, this.clubTier()).find((o) => o.name === f.oppName)!;
    const short = (opp.name.match(/[A-Z]/g) ?? ['O', 'P', 'P']).join('').slice(0, 3);
    const oppClub = generateClub('sp-' + opp.seed, opp.name, short, 0xcc4444, opp.strength, opp.seed, true);
    const venue: 'home' | 'away' = f.venue === 'H' ? 'home' : 'away';
    const oppTactics = seededOpponentTactics(opp.seed);
    this.spFixture = { idx, oppClub, oppName: opp.name, oppStrength: opp.strength, venue, oppLineup: autoPickXI(oppClub, oppTactics.formation), oppTactics };
    this.openLineup('match', { id: 'sp-opp', handle: opp.name, venue });
  }

  /** The managed STAR player (club owner's own NFT pro) — his personality colours how team talks land. */

  /** Who the pre-kickoff team talk is pitched at: the bloodline star when he's actually in the XI, otherwise
   *  the on-pitch captain (or the best available starter). starGuarded benches an injured/lapsed star, so a
   *  talk keyed unconditionally to the star would praise — and take a mechanical edge from — a man on the
   *  treatment table (PT-119). Uses the same injured/lapsed guard starGuarded computes. */
  private talkFocus(): Player | undefined {
    const sid = this.loadMgr().starId;
    const ids = this.draftLineup?.playerIds ?? [];
    const byId = (id?: string) => (id ? this.club.players.find((p) => p.id === id) : undefined);
    if (sid && ids.includes(sid) && !this.injured.has(sid) && !this.lapsed().has(sid)) return byId(sid); // star is on the pitch
    const capId = this.draftCaptain != null ? ids[this.draftCaptain] : undefined;
    return byId(capId) ?? ids.map((id) => byId(id)).filter(Boolean).sort((x, y) => overall(y!) - overall(x!))[0];
  }

  /** Pre-kickoff TEAM TALK — a real matchday decision. Each tone applies a small, bounded pre-kickoff edge
   *  to your side (deterministic — baked into the match snapshot), then kicks off. A fiery talk fires up
   *  some personalities (Born Leader, Workhorse, Big-Game Player, Maverick, Showman) but is less effective
   *  — or slightly backfires — for sensitive ones (Fragile, Hothead, Perfectionist), who respond better to
   *  a calm talk instead (Ferguson's hairdryer vs Ancelotti's quiet leadership — research §4). Everyone else
   *  is unmoved either way. The modulation stays a SMALL nudge on top of the existing bounded edge — see
   *  startSpMatchWith(). */
  private teamTalkNote(): string {
    const focus = this.talkFocus();
    const pid = focus && (focus as any).personality as string | undefined;
    if (!focus || !pid) return '';
    if (TALK_SENSITIVE.has(pid)) return `🧠 ${focus.name} doesn't respond well to fire and brimstone — a calmer word gets more out of him.`;
    if (TALK_FIERY.has(pid)) return `🧠 ${focus.name} thrives on a rev-up before kickoff — a fiery talk lifts him.`;
    return '';
  }

  private kickOffSpMatch() {
    const sp = this.spFixture!;
    const note = this.teamTalkNote();
    const el = document.createElement('div'); el.id = 'teamtalk-ov'; el.className = 'pc-overlay';
    el.innerHTML = `<div class="tt-card"><div class="tt-title">🗣️ TEAM TALK</div>`
      + `<div class="tt-sub">In the dressing room before ${sp.venue === 'away' ? 'the away trip to' : 'hosting'} <b>${sp.oppName}</b> — set the tone:</div>`
      + (note ? `<div class="tt-note">${note}</div>` : '')
      + `<button class="tt-opt" data-tt="fire"><b>🔥 Go for the throat</b><span>Attack hard — sharper in front of goal, but the legs tire faster</span></button>`
      + `<button class="tt-opt" data-tt="calm"><b>🧊 Keep your shape</b><span>Stay compact and disciplined — fresher late on, harder to break down</span></button>`
      + `<button class="tt-opt" data-tt="focus"><b>🎯 Just play your game</b><span>A calm, balanced edge</span></button></div>`;
    el.addEventListener('click', (e) => {
      const tt = (e.target as HTMLElement).closest('[data-tt]')?.getAttribute('data-tt');
      if (!tt) return;
      el.remove();
      this.startSpMatchWith(tt);
    });
    document.body.appendChild(el);
  }
  private startSpMatchWith(tone: string) {
    const sp = this.spFixture!;
    // ENFORCE THE INVARIANT AT KICKOFF (PT-20): the bloodline star must actually start. The editor re-forces
    // him on every open + formation change, but a manual per-slot swap could drop him with no re-guard before
    // play. Re-apply starGuarded at the one point it matters (a no-op in the normal case where he's already in),
    // and realign duties so the slot he's swapped into gets a sane default rather than the ejected player's duty.
    const guarded = this.starGuarded(this.draftLineup);
    const duties = guarded.playerIds.map((pid, i) => pid === this.draftLineup.playerIds[i]
      ? this.draftDuties[i]
      : defaultDuty(this.club.players.find((p) => p.id === pid)!));
    const myLineup: Lineup = { ...guarded, duties, ...this.draftRoles() };
    const myTeam = buildXI(this.availableClub(), myLineup);
    const starPid = (this.talkFocus() as any)?.personality as string | undefined; // the talk lands on the on-pitch leader when the star is out (PT-119)
    if (tone === 'fire') {
      // sensitive personalities get LESS out of the fiery talk (and tire a touch faster, keyed-up rather
      // than sharp); the ones who thrive on the big rev-up get a touch more. Small, bounded either way.
      const sensitive = starPid && TALK_SENSITIVE.has(starPid), fiery = starPid && TALK_FIERY.has(starPid);
      myTeam.homeBoost = 1.08 + (fiery ? 0.02 : sensitive ? -0.03 : 0);
      myTeam.conditioning = 1.06 + (sensitive ? 0.02 : 0);
    } else if (tone === 'calm') {
      // suits sensitive personalities best (extra composure); the fire-loving ones feel a bit flat under it.
      const sensitive = starPid && TALK_SENSITIVE.has(starPid), fiery = starPid && TALK_FIERY.has(starPid);
      myTeam.conditioning = 0.92 + (sensitive ? -0.02 : fiery ? 0.02 : 0);
    } else { myTeam.homeBoost = 1.04; }                                                  // a small balanced edge, unmodulated
    // CLUB FACILITIES apply to the match: Training Ground → less fitness drain; Fan Zone → home attack edge.
    const trainLvl = this.facLevels.training ?? 1, fanLvl = this.facLevels.fanzone ?? 1;
    myTeam.conditioning = (myTeam.conditioning ?? 1) * (1 - (trainLvl - 1) * 0.05);
    if (sp.venue === 'home' && !sp.neutral) myTeam.homeBoost = (myTeam.homeBoost ?? 1) * (1 + (fanLvl - 1) * 0.02); // fan-zone edge only at a true home game, never a neutral-ground decider (PT-130)
    // BACKROOM STAFF edges (apply home AND away)
    const staff = this.loadMgr().staff ?? [];
    if (staff.includes('fitness')) myTeam.conditioning = (myTeam.conditioning ?? 1) * 0.95;
    if (staff.includes('attack')) myTeam.homeBoost = (myTeam.homeBoost ?? 1) * 1.03;
    if (staff.includes('assistant')) { myTeam.homeBoost = (myTeam.homeBoost ?? 1) * 1.02; myTeam.conditioning = (myTeam.conditioning ?? 1) * 0.98; }
    const oppTeam = buildXI(sp.oppClub, sp.oppLineup);
    const oppTactics: Tactics = sp.oppTactics;
    const iAmHome = sp.venue === 'home';
    const me = { id: 'me', handle: this.club.name, team: myTeam, tactics: this.draftTactics };
    const them = { id: 'opp', handle: sp.oppName, team: oppTeam, tactics: oppTactics };
    this.startMatch({ matchId: 'sp', seed: (Math.random() * 2 ** 31) | 0, result: [0, 0], mySide: iAmHome ? 0 : 1, home: iAmHome ? me : them, away: iAmHome ? them : me });
  }

  // ---- club facilities ----
  private async showClub() {
    this.showScreen('club');
    $('facilities-grid').innerHTML = SPINNER;
    this.renderStaff();
    try { this.renderFacilities(await api.facilities()); }
    catch { $('facilities-grid').innerHTML = '<div class="muted">Could not load — please try again.</div>'; }
  }

  /** The backroom staff — four deterministic, save-stable characters (from @fm/shared staffRoster).
   *  Flavour only; gives the club screen recurring faces the way the player side has its careerCast. */
  private renderStaff() {
    const el = $('club-staff'); if (!el) return;
    const roster = staffRoster(this.leagueSeed());
    const card = (s: StaffMember) => `<div class="cs-card"><span class="cs-role">${s.role}</span>`
      + `<span class="cs-name">${s.name}</span><span class="cs-personality">“${s.personality}”</span></div>`;
    // the coaches you have actually HIRED, and what each is doing — previously invisible
    const hired = this.loadMgr().staff ?? [];
    const EFF: Record<string, string> = {
      fitness: 'tires ~5% less over 90',
      attack: '~3% sharper in the final third',
      assistant: '~2% all-round, and less fatigue',
    };
    const hiredHtml = hired.length
      ? `<div class="cs-title">💼 ON THE PAYROLL</div><div class="cs-hired">`
        + hired.map((h) => {
            const meta = BACKROOM_STAFF.find((x) => x.id === h);
            return `<div class="cs-hired-row">${meta?.icon ?? '🧑‍🏫'} <b>${meta?.name ?? h}</b> — ${EFF[h] ?? 'working away'}</div>`;
          }).join('') + `</div>`
      : '';
    el.innerHTML = `<div class="cs-title">🧑‍🏫 YOUR BACKROOM STAFF</div><div class="cs-grid">`
      + card(roster.assistant) + card(roster.scout) + card(roster.fitnessCoach) + card(roster.goalkeepingCoach)
      + `</div>` + hiredHtml;
  }

  private renderFacilities(d: { coins: number; facilities: import('./api').Facility[] }) {
    this.account.coins = d.coins;
    $('club-coins').innerHTML = `<span class="ico-inline">${sprite('coin')}</span> ${d.coins}`;
    $('facilities-grid').innerHTML = d.facilities.map((f) => {
      const pips = Array.from({ length: f.maxLevel }, (_, i) => `<i class="${i < f.level ? 'on' : ''}"></i>`).join('');
      const maxed = f.level >= f.maxLevel;
      const action = maxed
        ? '<div class="fac-maxed">★ MAX LEVEL</div>'
        : `<div class="fac-next">Next: <b>${f.nextEffect ?? ''}</b></div>`
          + `<button class="fac-up" data-key="${f.key}" ${f.canAfford ? '' : 'disabled'}>Upgrade · 💰 ${f.upgradeCost} ▶</button>`;
      return `<div class="facility ${maxed ? 'maxed' : ''}">`
        + `<div class="fac-top"><span class="fac-icon">${sprite(f.key) || f.icon}</span><span class="fac-name">${f.name}</span><span class="fac-lvl">LVL ${f.level}/${f.maxLevel}</span></div>`
        + `<div class="fac-pips">${pips}</div>`
        + `<div class="fac-blurb">${f.blurb}</div>`
        + `<div class="fac-effect">▸ ${f.effect}</div>`
        + action + `</div>`;
    }).join('');
    Array.from($('facilities-grid').querySelectorAll('button[data-key]')).forEach((b) => {
      const key = (b as HTMLElement).dataset.key!;
      const f = d.facilities.find((x) => x.key === key);
      // Hundreds of coins on one unconfirmed click, with the effect written in club-speak. Confirm it, and
      // say what it actually does — the coins are a season's prize money. (PT-507)
      b.addEventListener('click', () => this.openConfirm(
        `Upgrade <b>${f?.name ?? 'this facility'}</b> to level ${(f?.level ?? 0) + 1} for <b>💰 ${(f?.upgradeCost ?? 0).toLocaleString()}c</b>?`
        + (f?.nextEffect ? `<br><span class="cf-sub">It gets you: ${f.nextEffect}</span>` : '')
        + `<br><span class="cf-sub">You have ${(this.account?.coins ?? 0).toLocaleString()}c. Upgrades are permanent and carry to your heir.</span>`,
        `Upgrade · 💰 ${(f?.upgradeCost ?? 0).toLocaleString()}c`, () => this.upgradeFacility(key)));
    });
  }

  private async upgradeFacility(key: string) {
    try {
      const r = await api.upgradeFacility(key);
      this.account.coins = r.coins;
      toast(`Upgraded to level ${r.level} ✓`);
      // the club physically changing around you — one line per level, so an upgrade reads as something
      // that happened to a place rather than a number going up
      const story = facilityLevelStory(key as any, r.level);
      if (story) this.pushFeed('🏗️', story);
      this.renderFacilities(await api.facilities());
    } catch (e: any) {
      toast(e?.status === 409 ? (String(e?.body?.error ?? '').includes('max') ? 'Already at max level' : 'Not enough coins') : 'Could not upgrade');
    }
  }

  // ---- scouting (trial/loan academy) ----
  private async showScouting() {
    this.showScreen('scouting');
    $('trial-pool').innerHTML = SPINNER;
    try {
      const [d, st] = await Promise.all([api.trials(), api.scoutTiers()]);
      $('loan-cap').textContent = String(d.cap);
      $('loan-signed').textContent = String(d.signedCount);
      $('trial-pool').innerHTML = this.renderTrialPool(d.pool, d.signedCount >= d.cap);
      Array.from($('trial-pool').querySelectorAll('button[data-idx]')).forEach((b) =>
        b.addEventListener('click', () => this.signTrial(Number((b as HTMLElement).dataset.idx))));
      this.renderScoutPanel(st.opp, st.player);
      await this.loadMissions();
    } catch {
      $('trial-pool').innerHTML = '<div class="muted">Could not load — please try again.</div>';
    }
  }

  // ── ACADEMY: the Career game (Layer 1) — develop 10yo prospects into pro players ──
  private async showAcademy() {
    this.showScreen('academy');
    $('academy-head').style.display = ''; // restore the academy board header (hidden during career play)
    audio.play('scout'); // the academy scouting board — scout/pick a prospect (career play switches to 'career' in renderCareer)
    $('academy-body').innerHTML = SPINNER;
    try {
      const { prospects } = await api.prospects();
      const welcome = this.onboarding
        ? `<div class="onboard-welcome"><b>Welcome to ${this.club.name}.</b> Every legend starts as a kid. Here's your first prospect — <b>develop him</b> through his career (age 10→25), graduate him into your squad, and one day his bloodline carries on. Hit <b>Develop →</b> to begin.</div>`
        : '';
      this.onboarding = false;
      const intro = `<div class="scout-sub">Your <b>academy</b> — young players to <b>develop</b> through a full career (age 10→25): play to each chapter's demands, appoint coaches, make the big calls. At 25 they graduate into a pro for your squad — and when they retire, their <b>bloodline</b> lives on through the next generation. <span class="scout-note">A prospect's <b>pedigree %</b> is the quality his bloodline passes down — a higher pedigree means a stronger natural ceiling to develop toward.</span></div>`
        + `<div style="margin:10px 0 14px;"><button id="mint-genesis" class="primary">🔎 Scout a new prospect · 300c</button>`
        + `<div class="scout-sub" style="margin:6px 0 0;">Bring another 10-year-old into your academy to develop alongside your bloodline. The <b>300c</b> is <b>coins</b> — the currency you earn from running your club — so this is you choosing to invest in extra youth.</div></div>`;
      const rows = prospects.length ? prospects.map((p) => {
        const stars = '★'.repeat(p.potentialStars) + '☆'.repeat(5 - p.potentialStars);
        const gen = p.generation ? ` · gen ${p.generation + 1}` : ''; // 1-indexed to match the Bloodline Tree (PT-136)
        const btn = `<button class="primary" data-dev="${p.id}">${p.careerStarted ? 'Continue' : 'Develop'} →</button>`;
        return `<div class="prospect-row"><span class="pr-sprite">${sprite('youth')}</span><div><div class="pr-name">${p.name} <span class="pr-stars" title="His potential — how high he could develop with the right career">${stars}</span></div>`
          + `<div class="pr-meta">${p.roleHint}${gen} · ${pedigreeText(p.pedigree, p.generation)} ${p.careerStarted ? '· in development' : '· age 10, ready to develop'}</div></div>${btn}</div>`;
      }).join('') : '<div class="muted">No prospects yet — scout one above to begin.</div>';
      const { legends } = await api.legends().catch(() => ({ legends: [] as any[] }));
      const hall = legends.length ? `<h4 class="scout-h4" style="margin-top:22px;"><span class="ico-inline ico-lg">${sprite('laurel')}</span> HALL OF LEGENDS</h4>`
        + `<div class="scout-sub">The great careers your bloodlines have had — one card per retirement.</div>`
        + `<div class="legends-grid">` + legends.map((l: any) => `<div class="legend-card"><div class="lc-top">${l.card.icon} <b>${l.card.tier}</b></div>`
          + `<div class="lc-name">${l.name}</div><div class="lc-meta">${l.card.role} · rating ${l.card.legendRating}</div>`
          + `<div class="lc-honours">${l.card.leagueTitles}🏅 ${l.card.cupTitles}🏆 · ${l.card.apps} apps · ${l.card.seasons} seasons</div>`
          + `<div class="lc-note">${l.card.note}</div></div>`).join('') + `</div>` : '';
      $('academy-body').innerHTML = welcome + intro + rows + hall;
      $('mint-genesis').addEventListener('click', () => this.mintGenesis());
      $('academy-body').querySelectorAll('[data-dev]').forEach((b) => b.addEventListener('click', () => this.openCareer((b as HTMLElement).dataset.dev!)));
    } catch { $('academy-body').innerHTML = '<div class="muted">Could not load — please try again.</div>'; }
  }

  /** Trophy Room: the club's honours + the bloodlines (legend chains) you've built — the dynasty legacy. */
  private async showTrophyRoom() {
    this.showScreen('trophies');
    $('trophies-body').innerHTML = SPINNER;
    try {
      const [{ honours }, { legends }] = await Promise.all([api.honours(), api.legends()]);
      const titles = honours.filter((h) => h.title === 1);
      // pick a silverware image for an honour by its kind (self-hides if the file is ever missing)
      const trophyFor = (kind?: string): string => {
        const k: TrophyKey = kind === 'continental' ? 'continental' : kind === 'cup' ? 'cup' : kind === 'worldfinals' || kind === 'world' ? 'worldfinals' : 'league';
        return trophyImg(k, 40);
      };
      // a readable trophy name: the tier's league name (h.tier now holds the pyramid tier — PT-86), or the cup (PT-94)
      const trophyName = (h: { kind?: string; tier?: string }): string => {
        if (h.kind === 'continental') return 'Continental Cup';
        if (h.kind === 'world' || h.kind === 'worldfinals') return 'World Finals';
        const ct = Number(h.tier);
        return ct >= 1 && ct <= TIERS ? `${tierName(ct)} title` : 'League title';
      };
      const cabinet = titles.length
        ? `<div class="tr-cabinet">` + titles.sort((a, b) => a.season_number - b.season_number).map((h) => `<div class="tr-trophy"><div class="tr-trophy-ico">${trophyFor(h.kind)}</div><div class="tr-trophy-name">${trophyName(h)}</div><div class="tr-trophy-sub">Season ${h.season_number}</div></div>`).join('') + `</div>`
        : `<div class="tr-empty"><div class="tr-empty-art">${trophyImg('league', 64)}</div><div class="muted">No trophies yet — win your league to lift your first title.</div></div>`;
      // retired numbers (per-save honour for a top-tier 'Immortal' legend)
      const TOP_TIER = 'Immortal', rKey = 'fm_retired_' + (this.account?.handle ?? '');
      let retired: Array<{ n: number; name: string }>; try { retired = JSON.parse(localStorage.getItem(rKey) || '[]'); } catch { retired = []; }
      const retiredNums = new Set(retired.map((r) => r.n));
      // bloodlines: group legend cards by their base player id → a generational chain
      const byLine = new Map<string, typeof legends>();
      for (const l of legends) { const arr = byLine.get(l.playerId) ?? []; arr.push(l); byLine.set(l.playerId, arr); }
      const lines = [...byLine.values()].map((chain) => chain.slice().sort((a, b) => a.retiredSeason - b.retiredSeason));
      // the family surname a bloodline carries (last name of its founder, falling back to the full name)
      const familyName = (chain: typeof legends) => { const parts = (chain[0]?.name ?? '').trim().split(/\s+/); return parts.slice(1).join(' ') || parts[0] || 'the family'; };
      const heirlooms = this.loadHeirlooms(); // generation → the inheritance that generation was handed
      // one generation as a node on the lineage spine
      const treeNode = (l: typeof legends[number], gi: number) => {
        const num = l.card.number, numTag = num ? ` <span class="tr-gen-num">#${num}</span>` : '';
        const eligible = l.card.tier === TOP_TIER && num && !retiredNums.has(num);
        const retireBtn = eligible ? `<button class="tr-retire" data-num="${num}" data-name="${l.name.replace(/"/g, '&quot;')}">🎽 Retire #${num}</button>` : '';
        const heir = gi >= 1 && heirlooms[gi] ? `<div class="bt-heir">🎁 inherited ${heirlooms[gi]}</div>` : '';
        return `<div class="bt-node"><div class="bt-dot">${l.card.icon}</div>`
          + `<div class="bt-card"><div class="bt-genlbl">Generation ${gi + 1}</div>`
          + `<div class="bt-badge">${l.card.tier}${numTag}</div><div class="bt-name">${l.name}</div>`
          + `<div class="bt-meta">${l.card.role} · rating ${l.card.legendRating} · ${l.card.leagueTitles}🏅 ${l.card.cupTitles}🏆 · ${l.card.apps} apps · ${l.card.seasons} seasons</div>${heir}${retireBtn}</div></div>`;
      };
      // a whole bloodline as a vertical family tree: crest + surname header, then a connected generational spine
      const bloodlineTree = (chain: typeof legends) => {
        const gens = chain.length, majorHonours = chain.reduce((a, l) => a + l.card.leagueTitles + l.card.cupTitles, 0);
        return `<div class="bloodtree"><div class="bt-head"><span class="bt-crest">${sprite('crown')}</span>`
          + `<div><div class="bt-family">The ${familyName(chain)} Line</div>`
          + `<div class="bt-summary">${gens} generation${gens === 1 ? '' : 's'} · ${majorHonours} major honour${majorHonours === 1 ? '' : 's'} across the bloodline</div></div></div>`
          + `<div class="bt-spine">${chain.map((l, i) => treeNode(l, i)).join('')}</div></div>`;
      };
      const bloodlines = lines.length
        ? lines.map((chain) => bloodlineTree(chain)).join('')
        : `<div class="tr-empty"><div class="tr-empty-art">${sprite('crown')}</div><div class="muted">No bloodlines yet — develop a player, field him for a career, and retire him to found a dynasty. Every generation after adds a link to the tree.</div></div>`;
      const retiredSection = retired.length
        ? `<h4 class="scout-h4" style="margin-top:24px;">🎽 RETIRED NUMBERS</h4><div class="scout-sub">Shirts hung up forever for the club's immortals — no future player wears these.</div>`
          + `<div class="tr-cabinet">` + retired.map((r) => `<div class="tr-trophy"><div class="tr-trophy-ico">#${r.n}</div><div class="tr-trophy-name">${r.name}</div><div class="tr-trophy-sub">retired</div></div>`).join('') + `</div>`
        : '';
      const seasons = honours.length ? Math.max(...honours.map((h) => h.season_number)) : 0;
      const summary = `<div class="tr-summary">🏆 ${titles.length} title${titles.length === 1 ? '' : 's'} · 🌳 ${lines.length} bloodline${lines.length === 1 ? '' : 's'} · ⭐ ${legends.length} legend${legends.length === 1 ? '' : 's'}${retired.length ? ` · 🎽 ${retired.length} retired` : ''} · ${seasons} season${seasons === 1 ? '' : 's'} managed</div>`;
      // ACHIEVEMENTS — evaluate live and union with the persisted unlocked set (so the screen is always
      // accurate even if a milestone was crossed without a check firing), then persist the union.
      const earnedAch = new Set([...this.loadUnlockedAch(), ...evaluateAchievements(await this.buildAchSnapshot())]);
      this.saveUnlockedAch(earnedAch);
      const gotCount = ACHIEVEMENTS.filter((a) => earnedAch.has(a.id)).length;
      const achGrid = `<div class="ach-grid">` + ACHIEVEMENTS.map((a) => {
        const got = earnedAch.has(a.id);
        return `<div class="ach ${got ? 'got' : 'locked'}"><span class="ach-ico">${got ? a.icon : '🔒'}</span><div class="ach-txt"><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div></div>`;
      }).join('') + `</div>`;
      const achSection = `<h4 class="scout-h4" style="margin-top:24px;">🏅 ACHIEVEMENTS <span class="ach-count">${gotCount}/${ACHIEVEMENTS.length}</span></h4>` + achGrid;
      $('trophies-body').innerHTML = summary
        + `<h4 class="scout-h4">🏆 TROPHY CABINET</h4>` + cabinet
        + `<h4 class="scout-h4" style="margin-top:24px;">🌳 BLOODLINES</h4><div class="scout-sub">The dynasties you've built — each line is a bloodline across the generations, newest at the bottom.</div>` + bloodlines
        + retiredSection
        + achSection;
      $('trophies-body').querySelectorAll('.tr-retire').forEach((el) => el.addEventListener('click', () => {
        const n = Number((el as HTMLElement).dataset.num); const name = (el as HTMLElement).dataset.name!;
        let cur: Array<{ n: number; name: string }>; try { cur = JSON.parse(localStorage.getItem(rKey) || '[]'); } catch { cur = []; }
        if (!cur.some((r) => r.n === n)) cur.push({ n, name });
        localStorage.setItem(rKey, JSON.stringify(cur));
        toast(`🎽 #${n} retired forever in ${name}'s honour`);
        this.showTrophyRoom();
      }));
    } catch { $('trophies-body').innerHTML = '<div class="muted">Could not load — please try again.</div>'; }
  }

  private async mintGenesis() {
    try {
      const r = await api.genesis();
      if (r.coins != null) this.account.coins = r.coins;
      toast(`🌱 Scouted ${r.prospect.name} (−${r.cost}c)`);
      this.showProspectCard(r.prospect, true);
      await this.showAcademy();
    } catch (e: any) { toast(e?.body?.error === 'supply cap reached' ? 'Supply cap reached — no new tokens' : e?.body?.error === 'not enough coins' ? `Not enough coins (need ${e.body.need})` : (e?.body?.error ?? 'Mint failed')); }
  }

  private async openCareer(prospectId: string) {
    this.lastNarration = '';
    this.lastOutcome = null;
    this.showScreen('academy'); // career plays inside the academy panel — make it visible (may be entered straight from the hub)
    $('academy-body').innerHTML = SPINNER;
    try {
      const cur = await api.getCareer(prospectId).catch(() => null); // 400 if not started yet
      if (cur) { this.renderCareer(cur.state); return; }
      // not started → choose an agent first
      const { agents } = await api.careerAgents();
      const opts = agents.map((a) => {
        const effs = (a as any).effects?.length ? `<div class="cg-effs">${((a as any).effects as string[]).map((e) => `<span class="cg-agent-eff">${e}</span>`).join('')}</div>` : '';
        return `<div class="cg-coach" data-agent="${a.id}"><div class="cg-cname"><span class="ico-inline">${sprite('briefcase')}</span> ${a.name}</div><div class="cg-cdesc">${a.desc}</div>${effs}</div>`;
      }).join('');
      $('academy-body').innerHTML = `<button id="acad-back2" style="margin-bottom:10px;">← Prospects</button>`
        + `<div class="cg-prompt">Sign an <b>agent</b> to represent this prospect — it flavours his whole career. <span class="cg-reassure">No wrong pick here: the tags below (big-stage moments, draft luck, wages, transfer value) play out slowly over the years — a first-timer can happily go with whoever fits the story you want.</span></div>` + opts;
      $('acad-back2').addEventListener('click', () => this.showAcademy());
      this.makeActivatable($('academy-body').querySelectorAll('[data-agent]')); // keyboard a11y for the agent picks
      $('academy-body').querySelectorAll('[data-agent]').forEach((b) => b.addEventListener('click', async () => {
        $('academy-body').innerHTML = SPINNER;
        const r = await api.startCareer(prospectId, (b as HTMLElement).dataset.agent!);
        this.renderCareer(r.state);
      }));
    } catch (e: any) { toast(e?.body?.error ?? 'Could not open career'); this.showAcademy(); }
  }

  /** Render the card-game state and wire the choice for the current phase. */
  /** The New Star Soccer-style life dashboard: energy + the six relationships you juggle. */
  private lifeDashHtml(s: import('./api').CareerState): string {
    if (!s.meters?.length && s.energy == null) return '';
    const meterColor = (v: number) => v >= 66 ? '#5bd06a' : v >= 33 ? '#ffd75e' : '#ff6d6d';
    // stage-aware: the meters you juggle change with age (coach/parents/mates → gaffer/fans/sponsors/partner)
    const meters = (s.meters ?? []).map((m) =>
      `<div class="cg-meter" title="${m.label}: ${m.value}/100 — ${METER_WHAT[m.key] ?? ''}"><span class="cg-m-icon">${m.icon}</span>`
      + `<span class="cg-m-lbl">${m.label}</span>`
      + `<span class="cg-m-bar"><b style="width:${m.value}%;background:${meterColor(m.value)}"></b></span></div>`).join('');
    const low = s.energy != null && s.energy < 35;
    const energy = s.energy != null
      // The NUMBER, not just a word. Energy was readable only as "TIRED" or nothing, with the figure hidden
      // in a title attribute nobody hovers — so a player could not tell 34 from 4, or see a summer's rest
      // working. It also names the consequence and the lever, since it silently taxes every moment. (PT-158)
      ? `<div class="cg-energy${low ? ' low' : ''}" title="Energy ${s.energy}/100${low ? ' — tired: moments suffer until he rests' : ''}"><span>⚡ ENERGY ${s.energy}<span class="cg-e-max">/100</span>${low ? ' · TIRED — moments suffer; rest in the summer' : ''}</span><span class="cg-e-bar"><b style="width:${s.energy}%"></b></span></div>`
      : '';
    const money = s.earnings != null ? `<div class="cg-money">💷 ${s.earnings.toLocaleString()}</div>` : '';
    return `<div class="cg-dash">${energy}${money}<div class="cg-meters">${meters}</div></div>`;
  }
  /** Per-SAVE onboarding flag key — so a brand-new bloodline (New Game) gets the onboarding again, instead
   *  of a global flag suppressing it forever after the first-ever career (playtest fix PT-11). */
  private onbKey(base: string): string { return `${base}_${this.account?.handle ?? 'x'}`; }
  /** First-career coach-marks: contextual, dismissible hints during chapter 1 of a gen-0 career. */
  private tutorialHint(s: import('./api').CareerState): string {
    if (localStorage.getItem(this.onbKey('fm_tut_done'))) return '';
    // one onboarding box at a time: the contextual hints wait until the big "HOW HIS CAREER WORKS" explainer
    // is dismissed, so Grassroots never shows two different "Got it" boxes at once (#2).
    if (!localStorage.getItem(this.onbKey('fm_career_help_done'))) return '';
    if ((s as any).generation > 0) { localStorage.setItem(this.onbKey('fm_tut_done'), '1'); return ''; } // tutorial only on the very first (gen-0) career
    const turn = s.turn ?? 0;
    let hint = '';
    if (s.phase === 'play' && turn < 12) {
      if (turn === 0) hint = '👋 This is a <b>moment</b> in his young career. Read what it <b>needs</b> (the tags), then play the card that <b>fits best</b> — good fits develop him faster.';
      else if (turn <= 2) hint = '📊 Your choices shape his <b>stats</b> and his <b>relationships</b> (the meters above). Grow him with care and he flourishes; neglect it and he regresses.';
      else if (s.energy != null && s.energy < 40) hint = '⚡ His <b>energy</b> is dropping — tired moments go worse. It recovers between chapters, and you can <b>Rest</b>.';
      else hint = '🎯 Keep answering what each moment asks. The more you play to his strengths, the closer he gets to his potential.';
    } else if (s.phase === 'focus') hint = '🌅 <b>Between seasons</b> — choose how he spends the summer to steer his relationships before the next chapter.';
    else if (s.phase === 'draft') hint = '🃏 <b>Draft cards</b> to build his identity — these are the moves he’ll bring to future moments.';
    else if (s.phase === 'coach') hint = '🧑‍🏫 <b>Appoint a coach</b> — they sharpen the work you do in their specialty, compounding his growth.';
    if (turn >= 11) localStorage.setItem(this.onbKey('fm_tut_done'), '1'); // graduate the tutorial after chapter 1
    return hint ? `<div class="cg-tut" id="cg-tut">${hint} <button class="cg-tut-x" id="cg-tut-x">Got it ✕</button></div>` : '';
  }

  /** A one-time, dismissible explainer of the whole career dashboard — shown until the player dismisses it.
   *  Answers the "what is all this / why is it here?" questions (energy, money, relationships, the rival). */
  private careerHelpCard(s: import('./api').CareerState): string {
    if (localStorage.getItem(this.onbKey('fm_career_help_done'))) return '';
    return `<div class="cg-help" id="cg-help"><div class="cg-help-head">📖 HOW HIS CAREER WORKS <button class="cg-help-x" id="cg-help-x">Got it ✕</button></div>`
      + `<ul class="cg-help-list">` + this.careerHelpRows(s).map((r) => `<li>${r}</li>`).join('') + `</ul></div>`;
  }
  /** The career explainer's bullets. Split out so Settings → How to play can re-show them after the
   *  one-time card has been dismissed (PT-504). With no live career state, every bullet is shown. */
  private careerHelpRows(s?: import('./api').CareerState | null): string[] {
    const rows: string[] = [
      `<b>🃏 Moments & cards.</b> Each turn is a moment. Read what it <b>needs</b> (the tags), then play the card that <b>fits best</b> — good fits develop him faster and go better.`,
    ];
    if (!s || s.energy != null) rows.push(`<b>⚡ Energy.</b> Big efforts tire him, and tired moments go worse. It <b>recovers between seasons</b> (the summer screen) — and you can spend a summer choice to <b>Rest</b> and refill it.`);
    if (!s || s.earnings != null) rows.push(`<b>💷 Money & the club's cut.</b> Coins he earns from playing. He's <b>your academy's own</b> — raised in your facilities, wearing your badge — so the club takes a small <b>development cut</b> of everything he earns (you'll see “🏟️ +Xc to the club”), reinvested into the academy that raises the next of the line. The rest is his: between seasons spend it on <b>his life</b>, or <b>invest more back into the club</b>.`);
    if (!s || s.meters?.length) rows.push(`<b>🤝 Relationships (the meters).</b> Coach, family, teammates, school, agent — and, as he grows into a senior professional, the fans, his sponsors and his partner. These aren't just flavour. A <b>strong</b> meter unlocks better summer opportunities and steadies his form; a <b>neglected</b> one (near empty) drags his development and can spark off-pitch trouble. Every moment you play nudges the meters involved — steer them deliberately on the summer screen.`);
    if (!s || s.rival) rows.push(`<b>🆚 Rival.</b> A fellow academy kid living his <i>own</i> career in parallel — you're measured against him. Out-develop him to pull ahead. He's here to give your progress something to chase.`);
    return rows;
  }

  /** The rival to chase — a named academy contemporary running his own career; you're measured against him. */
  private rivalHtml(s: import('./api').CareerState): string {
    const r = s.rival; if (!r) return '';
    const ahead = r.lead >= 0;
    // "you're ahead/behind" — the gap is YOUR career score minus his, so make it unambiguous who leads
    // (placing "▲ ahead" right after his name read as HIM being ahead — playtest fix PT-13).
    return `<div class="cg-rival"><span class="cg-rival-lbl">🆚 RIVAL · ${r.name}</span>`
      + `<span class="cg-rival-gap ${ahead ? 'up' : 'down'}" title="Your career score vs his — out-develop him to stay clear">${ahead ? `you're ▲ ${r.lead} clear` : `you're ▼ ${Math.abs(r.lead)} behind — reel him in`}</span>`
      + (r.news ? `<div class="cg-rival-news">📰 ${r.name} ${r.news}</div>` : '') + `</div>`;
  }

  /** International call-up — the aspirational ceiling. Uncapped at first; caps accrue once he's good enough. */
  private intlHtml(s: import('./api').CareerState): string {
    const i = s.international; if (!i) return '';
    if (!i.capped) return `<div class="cg-intl"><span class="cg-intl-lbl">🌍 INTERNATIONAL</span><span class="cg-intl-txt">Uncapped — keep impressing at this level to earn a national call-up.</span></div>`;
    const nat = i.nation ?? 'his country';
    let capLine = '';
    if (i.lastCap) {
      const c = i.lastCap;
      const venueTxt = c.venue === 'H' ? `home to ${c.oppNation}` : c.venue === 'A' ? `away in ${c.oppNation}` : `${nat} vs ${c.oppNation}`;
      const res = c.ourGoals > c.forGoals ? 'w' : c.ourGoals < c.forGoals ? 'l' : 'd';
      const goalTag = c.scored > 0 ? ` · ⚽ ${c.scored === 2 ? 'braced!' : 'scored!'}` : '';
      capLine = `<div class="cg-intl-cap">📣 Latest call-up (${c.kind}): ${venueTxt} <span class="sf-res ${res}">${c.ourGoals}-${c.forGoals}</span>${goalTag}</div>`;
    }
    return `<div class="cg-intl capped"><div class="cg-intl-row"><span class="cg-intl-lbl">🌍 ${nat.toUpperCase()}</span><span class="cg-intl-txt">Called up for his country — <b>${i.caps}</b> cap${i.caps === 1 ? '' : 's'}</span></div>${capLine}</div>`;
  }

  /** Off-pitch life: fame/image, reputation, endorsement deals (each with an obligation), earned signature
   *  boots and the occasional risky-lifestyle temptation. The be-a-pro layer around the matches. */
  private offPitchHtml(s: import('./api').CareerState): string {
    const o = s.offPitch; if (!o) return '';
    const imgPct = o.image.score;
    const image = `<div class="op-fame"><div class="op-fame-top"><span class="op-lbl">🌟 PUBLIC IMAGE</span><span class="op-tier">${o.image.tier}</span></div>`
      + `<div class="op-bar"><div class="op-bar-fill" style="width:${imgPct}%"></div></div>`
      + `<div class="op-rep">📣 Reputation: <b class="op-rep-${o.reputation.edge}">${o.reputation.label}</b></div></div>`;
    const deals = o.endorsements.length
      ? `<div class="op-deals"><div class="op-sub">🤝 ENDORSEMENTS</div>${o.endorsements.map((d) => `<div class="op-deal"><div class="op-deal-head"><b>${d.brand}</b> <span class="op-deal-tier ${d.tier.toLowerCase()}">${d.tier}</span> <span class="op-deal-pay">+${d.payout.toLocaleString()}c</span></div><div class="op-deal-cat">${d.category}</div><div class="op-deal-obl">⚠ ${d.obligation}</div>${d.strain ? `<div class="op-deal-strain">💥 ${d.strain}</div>` : ''}</div>`).join('')}</div>`
      : `<div class="op-deals op-none">🤝 No endorsements yet — build your profile to attract brands.</div>`;
    const bootChips = o.boots.owned.map((b) => `<span class="op-boot" title="${b.edge}">👟 ${b.name}</span>`).join('');
    const nextBoot = o.boots.next ? `<div class="op-boot-next">🔒 Next: <b>${o.boots.next.boot.name}</b> — ${o.boots.next.boot.unlock} <span class="op-boot-prog">(${o.boots.next.progress}/${o.boots.next.target})</span></div>` : '';
    const boots = `<div class="op-boots"><div class="op-sub">👟 SIGNATURE BOOTS ${o.boots.owned.length ? `<span class="op-count">${o.boots.owned.length} earned</span>` : ''}</div>${bootChips || '<span class="op-none-inline">None earned yet</span>'}${nextBoot}</div>`;
    const tempt = o.temptation ? `<div class="op-tempt"><span class="op-tempt-lbl">🎲 TEMPTATION — ${o.temptation.title}</span><div class="op-tempt-blurb">${o.temptation.blurb}</div></div>` : '';
    return `<div class="cg-offpitch">${image}${deals}${boots}${tempt}</div>`;
  }

  /** The stage objective — a target the club/coach sets for this chapter, with a progress bar. Gives each
   *  stage direction and a reward beat when it's hit. */
  private objectiveHtml(s: import('./api').CareerState): string {
    const o = s.objective; if (!o) return '';
    const pct = Math.min(100, Math.round((o.progress / o.target) * 100));
    return `<div class="cg-objective${o.done ? ' done' : ''}"><div class="cg-obj-top"><span class="cg-obj-lbl">🎯 STAGE OBJECTIVE</span>`
      + `<span class="cg-obj-prog">${o.done ? '✓ complete' : `${o.progress}/${o.target}`}</span></div>`
      + `<div class="cg-obj-desc">${o.desc}</div>`
      + `<div class="cg-obj-bar"><b style="width:${pct}%"></b></div></div>`;
  }

  /** The handoff moment: he's a first-team regular — the game switches from playing his career to
   *  MANAGING the club he plays for. Graduates him into your squad, then enters the manager season. */
  /** Add an event to the season feed. Keeps the most recent FEED_MAX so a twenty-season save stays small. */
  private static readonly FEED_MAX = 240;
  /** Narrate a manager event through the context-tiered layer and put it in the season feed. The tiering is
   *  the point: selling an eleven-season servant and selling a summer signing produce different words. */
  private feedEvent(event: Parameters<typeof narrateManager>[0], icon: string, person?: PersonCtx, vars?: Record<string, unknown>) {
    const m = this.loadMgr();
    const tier = this.clubTier();
    const line = narrateManager(event, {
      seed: this.leagueSeed(),
      person,
      club: { club: this.club?.name ?? 'the club', season: m.season, tier, tierName: tierName(tier) },
      vars: vars as any,
    });
    if (line) this.pushFeed(icon, line);
  }
  /** Build the person context for a squad player — seasons at the club and morale are what the tiers key on. */
  private personCtx(p: Player, isStar = false): PersonCtx {
    const m = this.loadMgr();
    return {
      name: p.name, role: p.role, age: p.age, morale: p.morale, overall: overall(p),
      seasonsAtClub: p.signedSeason != null ? Math.max(0, m.season - p.signedSeason) : 0,
      isStar, wasRegular: (this.standingOrders?.playerIds ?? []).includes(p.id),
      personality: p.personality,
    };
  }
  private pushFeed(icon: string, text: string) {
    if (!text) return;
    const m = this.loadMgr();
    const feed = [...(m.feed ?? []), { season: m.season, icon, text }];
    this.saveMgr({ ...m, feed: feed.slice(-Game.FEED_MAX) });
  }
  /** The feed for the CURRENT season, newest first. */
  private seasonFeedHtml(): string {
    const m = this.loadMgr();
    const rows = (m.feed ?? []).filter((f) => f.season === m.season);
    if (!rows.length) return '';
    const items = rows.slice().reverse().map((f) => `<div class="sf-feed-row"><span class="sf-feed-ico">${f.icon}</span><span>${f.text}</span></div>`).join('');
    return `<details class="sf-feed" open><summary>📰 Your season so far <span class="sf-feed-n">${rows.length}</span></summary>${items}</details>`;
  }
  /** The club's situation, for arc gating. Everything here is already known at the season screen. */
  private mgrSituation(): MgrSituation {
    const m = this.loadMgr();
    const tier = this.clubTier();
    const t = liveTable(this.club?.name ?? '', this.clubLeagueStrength(), 1, this.leagueSeed(), m.results ?? [], tier, this.seasonResultSeed());
    const squad = this.club?.players ?? [];
    const ages = squad.map((p) => p.age ?? 24);
    return {
      season: m.season, tier,
      posFrac: t && t.size > 1 ? (t.pos - 1) / (t.size - 1) : 0.5,
      coins: this.account?.coins ?? 0,
      hasWonderkid: squad.some((p) => (p.age ?? 30) <= 20 && overall(p) >= 10),
      hasVeteran: ages.some((a) => a >= 32),
      hasUnhappy: squad.some((p) => (p.morale ?? 65) < 40),
      squadSize: squad.length,
      tags: new Set(m.arcTags ?? []),
      temper: m.temper,
      facilities: this.facLevels as Record<string, number>,
    };
  }
  /** Offer an arc if none is pending. Called at the season screen; arcs fire 4-6 a season. */
  private maybeOfferArc() {
    const m = this.loadMgr();
    if (m.arcNow || !m.starId) return;
    // PACING: 4-6 a season across an 18-match campaign, so one every three matchdays. Without this they
    // all arrive at once at the season screen and the club's whole dramatic year happens in one sitting.
    const md = m.results?.length ?? 0;
    if (md - (m.arcLastMd ?? -3) < 3) return;
    const fired = new Set(m.arcFired ?? []);
    const salt = (m.season * 7919 + (m.results?.length ?? 0) * 131) >>> 0;
    const id = pickManagerArc((this.leagueSeed() ^ salt) >>> 0, this.mgrSituation(), fired);
    if (!id) return;
    const arc = managerArcById(id);
    if (!arc) return;
    this.saveMgr({ ...m, arcNow: { id, beat: arc.first }, arcFired: [...(m.arcFired ?? []), id], arcLastMd: md });
  }
  /** Apply an arc choice's effects — the club's, not one body's. */
  private applyArcEffect(e: MgrArcEffect | undefined) {
    if (!e) return;
    const m = this.loadMgr();
    if (e.coins && this.account?.coins != null) { this.account.coins = Math.max(0, this.account.coins + e.coins); }
    if (e.squadMorale && this.club) {
      for (const p of this.club.players) p.morale = applyMorale(p.morale ?? 65, e.squadMorale);
    }
    if (e.playerMorale && this.club?.players.length) {
      const sq = this.club.players;
      const pick = e.playerMorale.who === 'star' ? sq.find((p) => p.id === m.starId)
        : e.playerMorale.who === 'unhappiest' ? [...sq].sort((a, b) => (a.morale ?? 65) - (b.morale ?? 65))[0]
        : e.playerMorale.who === 'youngest' ? [...sq].sort((a, b) => (a.age ?? 24) - (b.age ?? 24))[0]
        : e.playerMorale.who === 'oldest' ? [...sq].sort((a, b) => (b.age ?? 24) - (a.age ?? 24))[0]
        : [...sq].sort((a, b) => overall(b) - overall(a))[0];
      if (pick) pick.morale = applyMorale(pick.morale ?? 65, e.playerMorale.delta);
    }
    const next = { ...this.loadMgr() };
    if (e.tag) next.arcTags = [...new Set([...(next.arcTags ?? []), e.tag])];
    if (e.clubLegacy) next.clubLegacy = [...(next.clubLegacy ?? []), { ...e.clubLegacy, season: next.season }];
    this.saveMgr(next);
  }
  /** The pending arc, rendered as a real decision on the season screen. */
  private managerArcHtml(): string {
    const m = this.loadMgr();
    if (!m.arcNow) return '';
    const arc = managerArcById(m.arcNow.id);
    const beat = arc?.beats[m.arcNow.beat];
    if (!arc || !beat) return '';
    const choices = beat.choices.map((c) =>
      `<div class="mgr-arc-choice" data-arcchoice="${c.id}"><div class="cg-cname">${c.label}</div><div class="cg-cdescr">${c.desc}</div></div>`).join('');
    return `<div class="mgr-arc arc-${arc.category}">`
      + `<div class="mgr-arc-head">${arc.icon} ${arc.title.toUpperCase()}</div>`
      + `<div class="mgr-arc-prompt">${beat.prompt}</div>`
      + `<div class="mgr-arc-choices">${choices}</div></div>`;
  }
  /** Resolve a choice: apply its effects, tell the player what happened, then advance or finish. */
  private resolveArcChoice(choiceId: string) {
    const m = this.loadMgr();
    if (!m.arcNow) return;
    const arc = managerArcById(m.arcNow.id);
    const beat = arc?.beats[m.arcNow.beat];
    const choice = beat?.choices.find((c) => c.id === choiceId);
    if (!arc || !choice) return;
    this.applyArcEffect(choice.effect);
    this.pushFeed(arc.icon, `<b>${arc.title}</b> — ${choice.outcome}`);
    const after = this.loadMgr();
    // a `next` beat means the decision has a consequence you see later in the same story
    this.saveMgr({ ...after, arcNow: choice.next && arc.beats[choice.next] ? { id: arc.id, beat: choice.next } : null });
    this.showSeason();
  }
  private handoffKey(pid: string): string { return `fm_handoff_defer_${pid}`; }
  private handoffDeferredAt(pid: string): number {
    try { return Number(localStorage.getItem(this.handoffKey(pid)) || '-1'); } catch { return -1; }
  }
  private renderHandoff(s: import('./api').CareerState) {
    this.showScreen('academy');
    const h = s.handoff!;
    $('academy-body').innerHTML = `<div class="cg-graduation cg-handoff">`
      + `<div class="cg-grad-title">🏆 ${s.name} — a first-team regular</div>`
      + `<div class="cg-epilogue">He's done it. After a full season in the first team — <b>${h.status}</b>, ${h.apps} appearances — ${s.name} is a fixture in the side. This is where his career becomes <b>your club's story</b>: it's time to take the reins. From here you pick the XI, set the tactics, and steer <b>${this.club?.name ?? 'the club'}</b> through the season, with ${s.name} your man on the pitch.</div>`
      + `<div class="cg-grad-windfall">⚽ OVR ${h.overall} · ${h.status}${s.careerScore != null ? ` · ★ career score ${s.careerScore.toLocaleString()}` : ''}</div>`
      + `<div class="cg-temper-q">What kind of gaffer is he going to be?</div>`
      + `<div class="cg-tempers">` + MGR_TEMPERS.map((t, i) =>
          `<div class="cg-temper${i === 0 ? ' on' : ''}" data-temper="${t.id}"><div class="cg-cname">${t.name}</div><div class="cg-cdescr">${t.blurb}</div></div>`).join('') + `</div>`
      + `<button id="cg-takereins" class="primary">🧢 Take the reins as manager →</button>`
      + `<button id="cg-playon" class="ghost">Play on — finish his career first</button>`
      + `<div class="cg-handoff-note">He'll keep playing to 25. You'll be offered the reins again at the next stage.</div></div>`;
    $('cg-playon').addEventListener('click', async () => {
      try { localStorage.setItem(this.handoffKey(s.prospectId), String(s.turn)); } catch { /* ignore */ }
      try { const cur = await api.getCareer(s.prospectId); if (cur?.state) this.renderCareer(cur.state); } catch { /* ignore */ }
    });
    // the chosen temperament gates which arcs fire and colours how the board and dressing room react
    let chosenTemper: MgrTemper = MGR_TEMPERS[0].id;
    $('academy-body').querySelectorAll('[data-temper]').forEach((el) => el.addEventListener('click', () => {
      chosenTemper = (el as HTMLElement).dataset.temper as MgrTemper;
      $('academy-body').querySelectorAll('[data-temper]').forEach((o) => o.classList.toggle('on', o === el));
    }));
    $('cg-takereins').addEventListener('click', async () => {
      try {
        ($('cg-takereins') as HTMLButtonElement).textContent = 'Signing the contracts…';
        const { player } = await api.careerHandoff(s.prospectId);
        this.setMe(await api.me());
        // Make sure the bloodline star actually STARTS — the old base-squad XI benched him. Auto-pick a fresh
        // XI from the merged squad (he's one of the best now) and force him in if anything left him out (PT-17).
        try {
          let ids = autoPickXI(this.club!, this.standingOrders.formation).playerIds;
          if (!ids.includes(s.prospectId) && this.club!.players.some((p) => p.id === s.prospectId)) {
            const starters = ids.map((id) => this.club!.players.find((p) => p.id === id)).filter(Boolean) as Player[];
            const worst = starters.slice().sort((a, b) => overall(a) - overall(b))[0];
            // SWAP IN PLACE. `ids` is positional — index i is formation slot i — so filtering the worst out and
            // appending the star to the end shifted every slot after him, fielding ~1.8 players out of position
            // on the saves where this ran. Replace him in his own slot instead. (PT-952)
            if (worst) ids = ids.map((id) => (id === worst.id ? s.prospectId : id));
          }
          await api.setStandingOrders({ ...this.standingOrders, playerIds: ids });
          this.setMe(await api.me());
        } catch { /* keep the default XI if the auto-pick fails */ }
        const retireAge = this.retireAgeFor(player);
        // START THE CLUB WHERE THE CAREER EARNED. clubTier() falls back to TIERS (the Sunday League) when no
        // tier has been stored, and nothing in the handoff ever stored one — so a player who reached a
        // Continental Final was handed the bottom division of ten, among clubs he'd never seen. It also made
        // the early seasons trivial, since tierStrength(10) is the weakest in the game. The star's career
        // score and his finishing quality now set the entry point: a good career starts you mid-pyramid with
        // somewhere left to climb, a modest one still starts near the bottom. (PT-950/PT-802)
        const startTier = this.startingTierFor(s, player);
        this.setClubTier(startTier);
        // AND BRING THE SQUAD WITH IT. The tier came from his career but the ROSTER was minted at quality 6
        // when the save was created, before a single career turn — so a Continental finalist took over a pub
        // team and was the best player at his own club by a mile. The club he inherits should be the club
        // his career built. (PT-956)
        try {
          const al = await api.alignSquadToTier(startTier);
          this.setMe(await api.me());
          if (al.lifted > 0) toast(`🏟️ ${al.lifted} of the squad step up to ${tierName(startTier)} standard`);
        } catch { /* keep the founding roster if this fails — never block the handoff */ }
        this.saveMgr({ season: 1, results: [], starId: s.prospectId, starName: s.name, starAge: s.age, retireAge, temper: chosenTemper }); // enter manager phase
        toast(`🧢 You're the manager now — ${s.name} is in your squad`);
        this.showSeason();
      } catch (e: any) { toast(e?.body?.error ?? 'Handoff failed'); }
    });
  }

  private renderCareer(s: import('./api').CareerState) {
    // the career view has its own in-context header (cg-head, with a ← back to the academy board), so hide
    // the outer "🎓 ACADEMY / Back to hub" bar while playing a career — it was redundant + cramped (H2/G1).
    $('academy-head').style.display = 'none';
    // HANDOFF: he's established himself as a first-team regular — take the reins as manager.
    // Offered, not forced. The handoff fires at the first chapter boundary where he is a first-team
    // regular — which can be turn ~106, age 22 — while the progress bar counts to /120 and the Academy copy
    // promises "age 10→25". So the career was seized 14 turns and three years before the game said it
    // would end. It is still offered at every subsequent boundary, and graduation at 25 happens regardless;
    // the player simply gets to finish the career he was promised. (PT-1406)
    if (s.handoff && this.handoffDeferredAt(s.prospectId) < s.turn) { this.renderHandoff(s); return; }
    // MUSIC follows the moment: a shock call-up gets tension, a life-event gets drama, else the career loop.
    audio.play(s.callupMoment ? 'tension' : (s.momentKind === 'life' || s.lifeEvent) ? 'drama' : 'career');
    const pct = Math.round((s.turn / s.totalTurns) * 100);
    // re-theme the whole view for this life stage (accent + backdrop + scene banner)
    const th = CHAPTER_THEME[s.chapter] ?? CHAPTER_THEME.Grassroots;
    const acad = $('academy'); acad.dataset.chapter = th.slug;
    acad.style.setProperty('--cg-accent', th.accent); acad.style.setProperty('--cg-bg', th.bg);
    const scene = `<div class="cg-scene"><span class="cg-scene-emoji">${th.scene}</span><span class="cg-scene-tag"><b>${s.chapter}</b> · ${th.tagline}</span></div>`;
    const head = `<div class="cg-head"><button id="cg-back">←</button><span class="cg-age">${s.name} · age ${s.age}</span>`
      + `<span class="cg-chapter">${s.chapter}</span><div class="cg-bar"><i style="width:${pct}%"></i></div><span class="pr-meta">${s.turn}/${s.totalTurns}</span>`
      + (s.careerScore != null ? `<span class="cg-score" title="Career score — climbs with every good moment; beat it next run">★ ${s.careerScore.toLocaleString()}</span>` : '') + `</div>`;
    const evt = s.seasonEvent ? `<div class="cg-event"><b>${s.seasonEvent.name}</b> — ${s.seasonEvent.desc}</div>` : '';
    const prof = s.profile ? this.careerProfileHtml(s.profile) : '';
    const narr = this.lastNarration ? this.outcomeChipHtml() + `<div class="cg-narrate">“${this.lastNarration}”</div>` : '';
    const recap = s.recap ? `<div class="cg-recap"><span class="cg-recap-lbl">📖 The story so far</span>${s.recap}</div>` : '';
    const lifeOutcome = s.lastLifeOutcome ? `<div class="cg-conseq"><div class="cg-conseq-row">${s.lastLifeOutcome}</div></div>` : '';
    const conseq = s.consequences?.length
      ? `<div class="cg-conseq"><span class="cg-conseq-lbl">📋 How the season paid off</span>`
        + s.consequences.map((n) => `<div class="cg-conseq-row">${n}</div>`).join('') + `</div>`
      : '';
    let body = '';
    if (s.phase === 'arc' && (s as any).arc) {
      // STORY ARC beat — a branching storyline moment. Rendered as a distinct, weightier decision.
      const a = (s as any).arc;
      body = `<div class="cg-scenario cg-arc arc-${a.category}"><div class="cg-mtype arc">${a.icon} ${a.title.toUpperCase()}</div><div class="cg-story cg-arc-story">${a.prompt}</div></div>`
        + `<div class="cg-prompt">A moment that could shape his story — what does he do?</div>`
        + `<div class="cg-cards cg-arc-choices">` + a.choices.map((ch: any) => `<div class="cg-card arc-choice" data-act="arc" data-id="${ch.id}"><div class="cg-cname">${ch.label}</div><div class="cg-cdescr">${ch.desc}</div></div>`).join('') + `</div>`;
    } else if (s.phase === 'play' && s.scenario) {
      // the demand — what the moment is asking for. The top tag (biggest weight) is the primary thing to
      // match; render as distinct highlighted pills, labelled, so it never reads like just another card tag.
      const demandTags = Object.entries(s.scenario.demand).sort((a, b) => b[1] - a[1]);
      const tags = demandTags.map(([t], i) => `<span class="cg-dtag${i === 0 ? ' primary' : ''}" title="${i === 0 ? 'Best match — a card with this tag reads the moment perfectly' : 'Also helps — a card with this tag is a partial match'}">${t}</span>`).join('');
      // legend so the green/amber pill colours aren't a mystery: green is the ideal card, amber ones still help (PT-44)
      const demandHint = demandTags.length > 1
        ? '— <b class="cg-h-green">green</b> is the best match, <b class="cg-h-amber">amber</b> also helps; a rarer card develops him more when it fits'
        : '— play a card carrying the <b class="cg-h-green">green</b> tag; a rarer card develops him more when it fits';
      // distinct presentation per moment type — a matchday scoreboard, the training ground, or life off the pitch
      const mk = s.momentKind ?? (s.lifeEvent ? 'life' : 'training');
      let header: string; let prompt: string;
      if (mk === 'match' && s.matchCtx) {
        const mc = s.matchCtx; const [us, them] = mc.score.split('-');
        const big = s.scenario.stakes >= 3 ? ' · ★ THE BIG ONE' : s.scenario.stakes >= 2 ? ' · BIG GAME' : '';
        const rivalTag = s.rivalMoment ? ` · 🆚 vs ${s.rival?.name ?? 'HIS RIVAL'}` : '';
        const callupTag = s.callupMoment ? ' · 🚑 SHOCK CALL-UP' : '';
        const club = mc.club || this.club?.name || 'Your Club';
        header = `<div class="cg-matchday stakes-${s.scenario.stakes}${s.rivalMoment ? ' rivalry' : ''}${s.callupMoment ? ' callup' : ''}">`
          + `<div class="cg-md-top"><span class="cg-md-badge">⚽ MATCHDAY${big}${rivalTag}${callupTag}</span><span class="cg-md-min">${mc.minute}'</span></div>`
          + `<div class="cg-md-fixture"><span class="cg-md-team mine">${club}</span>`
          + `<span class="cg-md-score">${us} <span class="cg-md-ball">${sprite('ball')}</span> ${them}</span>`
          + `<span class="cg-md-team">${mc.opponent}</span></div>`
          + `<div class="cg-md-vs">${mc.home ? '🏟️ Home' : '✈️ Away'} · ${mc.comp}</div></div>`;
        prompt = s.callupMoment ? 'Thrown in cold, hours to think about it — what does he do?' : 'The moment falls to him — what does he do?';
      } else if (mk === 'life' && s.lifeEvent === 'the weight of the name') {
        header = `<div class="cg-mtype pressure">🎭 THE WEIGHT OF THE NAME</div>`;
        prompt = 'The name is a burden today — how does he respond?';
      } else if (mk === 'life' && s.lifeEvent === 'keep_or_cut') {
        header = `<div class="cg-mtype life">📋 KEEP OR CUT?</div>`;
        prompt = 'His scholarship review is coming — how does he make his case?';
      } else if (mk === 'life') {
        const lifeLabel = s.lifeEvent ? (LIFE_LABEL as Record<string, string>)[s.lifeEvent] ?? s.lifeEvent : null;
        header = `<div class="cg-mtype life">⚡ LIFE EVENT${lifeLabel ? ` · ${lifeLabel}` : ' · off the pitch'}</div>`;
        prompt = 'How does he handle it?';
      } else {
        header = `<div class="cg-mtype training">🏋️ TRAINING GROUND</div>`;
        prompt = 'How does he approach the session?';
      }
      body = `<div class="cg-scenario stakes-${s.scenario.stakes} ${mk}">${header}<div class="cg-story">${s.story ?? s.scenario.label}</div><div class="cg-demand"><span class="cg-demand-lbl">🎯 This calls for:</span> ${tags}<span class="cg-demand-hint">${demandHint}</span></div></div>`
        + `<div class="cg-prompt">${prompt}${s.coach ? ` · <b>${s.coach.name}</b> is coaching him` : ''}</div>`
        + `<div class="cg-cards">` + (() => { const used = new Set<string>(); return (s.hand ?? []).map((c) => this.cardHtml(c, 'play', mk === 'life', used, s.turn ?? 0)).join(''); })() + `</div>`;
    } else if (s.phase === 'coach' && s.coaches) {
      body = `<div class="cg-prompt">Appoint a mentor or coach for the coming chapter — they sharpen the work you do in their specialty:</div>`
        + s.coaches.map((c) => `<div class="cg-coach" data-act="coach" data-id="${c.id}"><div class="cg-cname">${c.kind === 'mentor' ? '🧭' : '📋'} ${c.name}</div><div class="cg-cdesc">${c.desc} · <i>${c.specialty.join(', ')}</i></div></div>`).join('');
    } else if (s.phase === 'draft' && s.options) {
      body = `<div class="cg-prompt">Draft <b>${s.picksLeft}</b> card${s.picksLeft === 1 ? '' : 's'} into his deck — the cards you keep decide which moments he can answer well, so they shape the player he becomes. <span class="cg-reassure">Rarity = power: <b>rare</b> and <b>epic</b> cards develop him more when they fit the moment. Cards you don't pick are discarded.</span></div>`
        + `<div class="cg-cards">` + s.options.map((c) => this.cardHtml(c, 'draft')).join('') + `</div>`;
    } else if (s.phase === 'offer' && s.offers) {
      body = `<div class="cg-prompt">A decision off the pitch — money now, or development?</div>`
        + s.offers.map((o) => `<div class="cg-offer" data-act="offer" data-id="${o.id}"><div class="cg-cname">💷 ${o.name}</div><div class="cg-cdesc">${o.desc}</div>`
          + `<div class="cg-effs">${o.earn > 0 ? `+${o.earn.toLocaleString()}c ` : ''}${o.greed > 0 ? '· greedier ' : o.greed < 0 ? '· more loyal ' : ''}${o.market > 0 ? '· more famous ' : ''}${o.form > 0 ? '· sharper' : o.form < 0 ? '· distracted' : ''}</div></div>`).join('');
    } else if (s.phase === 'focus' && s.focus) {
      const effLabel = (e: Record<string, number>) => Object.entries(e).map(([k, v]) => `<span title="${METER_NAME[k] ?? k}">${METER_ICON[k] ?? ''}${v > 0 ? '+' : ''}${v}</span>`).join(' · ');
      const perkLabel = (p?: Record<string, number>) => p ? Object.entries(p).map(([k, v]) => `<span title="${METER_NAME[k] ?? k}">${METER_ICON[k] ?? ''}${v > 0 ? '+' : ''}${v}</span>`).join(' ') : '';
      // legend built from the icons ACTUALLY shown on this screen's tiles (focus effects + lifestyle perks),
      // union'd with the dashboard meters — so a tile can never show a 🏠/❤️ the legend doesn't decode (PT-48).
      const legendPairs = new Map<string, string>([['⚡', 'energy']]);
      for (const f of s.focus) for (const k of Object.keys(f.effects ?? {})) if (METER_ICON[k]) legendPairs.set(METER_ICON[k], METER_NAME[k] ?? k);
      for (const li of s.lifestyle ?? []) for (const k of Object.keys(li.perks ?? {})) if (METER_ICON[k]) legendPairs.set(METER_ICON[k], METER_NAME[k] ?? k);
      for (const m of s.meters ?? []) legendPairs.set(m.icon, m.label);
      const legend = `<div class="cg-legend">${[...legendPairs].map(([i, l]) => `${i} ${l}`).join(' · ')}</div>`;
      // #5: the summer is TWO explicit steps — spend first (a Continue button moves on), then choose the focus.
      // reset the step whenever a NEW summer screen appears (different turn), so it always starts on spending.
      if (s.turn !== this.summerStepTurn) { this.summerStep = 'spend'; this.summerStepTurn = s.turn ?? -1; }
      const hasShop = !s.side && !!s.lifestyle && s.lifestyle.length > 0;
      const budget = s.earnings ?? 0;
      // #7: unaffordable items are shown LOCKED (greyed, unclickable) rather than hidden, with how much more is needed.
      const shopTiles = hasShop ? s.lifestyle!.map((li) => {
        // every spend tile gates on cost — the Back the Club tiles spend the same earnings as a treat does,
        // and exempting them left the one tile that stayed clickable and then failed with a terse error (PT-144)
        const locked = li.cost > budget;
        const effs = li.clubInvest
          ? `<span class="cg-cost">💷 ${li.cost.toLocaleString()}c</span> · <span class="cg-invest-eff">🏛️ +${li.clubInvest.toLocaleString()}c to the club</span>`
          : `<span class="cg-cost">💷 ${li.cost.toLocaleString()}c</span> ${li.recovery ? `· ⚡rec+${li.recovery} ` : ''}${li.market ? `· ⭐fame+${li.market} ` : ''}${perkLabel(li.perks)}`;
        const lock = locked ? `<div class="cg-lock">🔒 need ${(li.cost - budget).toLocaleString()}c more</div>` : '';
        return `<div class="cg-foc buy${li.clubInvest ? ' invest' : ''}${locked ? ' locked' : ''}"${locked ? '' : ` data-act="lifestyle" data-id="${li.id}"`}><div class="cg-cname">💷 ${li.icon} ${li.name}</div><div class="cg-cdescr">${li.blurb}</div><div class="cg-effs">${effs}</div>${lock}</div>`;
      }).join('') : '';
      const budgetBar = hasShop ? `<div class="cg-budget">💷 <b>${budget.toLocaleString()}c</b> left to spend</div>` : '';
      const focusTiles = `<div class="cg-focus">` + s.focus.map((f) => `<div class="cg-foc commit" data-act="focus" data-id="${f.id}"><div class="cg-cname">${f.icon} ${f.name}</div><div class="cg-cdescr">${f.desc}</div>`
        + `<div class="cg-effs">${f.energy ? `⚡${f.energy > 0 ? '+' : ''}${f.energy} ` : ''}${effLabel(f.effects)}${f.tag ? `${TAG_ICON[f.tag] ?? ''} train ${f.tag}` : ''}</div></div>`).join('') + `</div>`;
      if (hasShop && this.summerStep === 'spend') {
        // STEP 1 — spending only, with an explicit Continue to move on (#5)
        body = `<div class="cg-prompt cg-shop-h">💷 <b>Spend your earnings</b> — treat yourself, or back the club. Buy as many as you like, then move on to your summer.</div>`
          + budgetBar + `<div class="cg-focus">` + shopTiles + `</div>`
          + `<div class="cg-summer-next-wrap"><button id="cg-summer-next" class="primary">Done spending — choose your summer →</button></div>`;
      } else {
        // STEP 2 — the summer focus (or the side activity, or a chapter with no shop)
        const focusPrompt = s.side
          ? '🤝 <b>One more thing</b> before pre-season — a smaller side activity, if you fancy it:'
          : '🌅 <b>Choose ONE summer focus</b> — this <b>ends pre-season</b> and starts the next chapter.';
        const backLink = hasShop ? `<button id="cg-summer-back" class="cg-linkbtn">← back to spending (💷 ${budget.toLocaleString()}c left)</button>` : '';
        body = `<div class="cg-prompt">${focusPrompt}</div>` + backLink + legend + focusTiles;
      }
    }
    this.lastCareerState = s;
    // TABS declutter the view: NOW (the current decision + your life dashboard), PLAYER (full identity +
    // deck), KIT (cosmetic customization). The chapter header + scene banner stay above the tabs.
    const TABS: Array<['now' | 'player' | 'kit' | 'league' | 'life', string]> = [['now', '⚽ Now'], ['player', '👤 Player'], ['kit', '🎽 Kit']];
    if (s.offPitch) TABS.push(['life', `💼 Life${s.offPitch.temptation ? ' 🎲' : ''}`]); // fame/deals/boots — senior stages
    if (s.clubSeason) TABS.push(['league', '🏆 League']);
    if (this.careerTab === 'league' && !s.clubSeason) this.careerTab = 'now'; // league tab only exists in senior stages
    if (this.careerTab === 'life' && !s.offPitch) this.careerTab = 'now';       // life tab only exists in senior stages
    const tabBar = `<div class="cg-tabs">` + TABS.map(([t, label]) => `<button class="cg-tab${this.careerTab === t ? ' on' : ''}" data-tab="${t}">${label}</button>`).join('') + `</div>`;
    let content: string;
    if (this.careerTab === 'player') content = prof + this.deckHtml(s);
    else if (this.careerTab === 'kit') content = this.kitTabHtml(s);
    else if (this.careerTab === 'life') content = this.offPitchHtml(s);
    else if (this.careerTab === 'league') content = this.leagueTableHtml(s);
    // ACTION FIRST: the moment + its choice cards sit at the TOP (last turn's outcome just above the new
    // scenario), then the supporting context (objective / rival / dashboard / recap) below — so the one thing
    // you must do is never below the fold. (playtest finding: choice cards were pushed off-screen every turn.)
    else content = narr + evt + body + `<div class="cg-context">` + this.objectiveHtml(s) + this.rivalHtml(s) + this.intlHtml(s) + this.lifeDashHtml(s) + lifeOutcome + conseq + recap + `</div>`;
    const help = this.careerTab === 'now' ? this.careerHelpCard(s) : '';
    const tut = this.careerTab === 'now' ? this.tutorialHint(s) : '';
    $('academy-body').innerHTML = head + scene + help + tut + tabBar + content;
    ($('cg-help-x') as any)?.addEventListener('click', () => { localStorage.setItem(this.onbKey('fm_career_help_done'), '1'); if (this.lastCareerState) this.renderCareer(this.lastCareerState); else ($('cg-help') as any)?.remove(); }); // re-render so the contextual hint takes its place (#2)
    ($('cg-tut-x') as any)?.addEventListener('click', () => { localStorage.setItem(this.onbKey('fm_tut_done'), '1'); ($('cg-tut') as any)?.remove(); });
    $('cg-back').addEventListener('click', () => this.showAcademy());
    $('academy-body').querySelectorAll('.cg-tab').forEach((el) => el.addEventListener('click', () => { this.careerTab = (el as HTMLElement).dataset.tab as any; this.renderCareer(s); }));
    $('academy-body').querySelectorAll('[data-act]').forEach((el) => el.addEventListener('click', () => this.doCareerAct(s.prospectId, { type: (el as HTMLElement).dataset.act!, cardId: (el as HTMLElement).dataset.id! })));
    this.makeActivatable($('academy-body').querySelectorAll('[data-act]')); // keyboard a11y: Tab to a card, Enter/Space to play
    // #5: the summer two-step — Continue moves from spending to the focus choice; Back returns to spending
    document.getElementById('cg-summer-next')?.addEventListener('click', () => { this.summerStep = 'activities'; this.renderCareer(s); });
    document.getElementById('cg-summer-back')?.addEventListener('click', () => { this.summerStep = 'spend'; this.renderCareer(s); });
    if (this.careerTab === 'kit') this.wireKitTab(s);
  }

  /** The developing player's live identity panel — shows him taking shape as you play. */
  private careerProfileHtml(p: import('./api').CareerProfile): string {
    const stars = '★'.repeat(p.stars) + '☆'.repeat(5 - p.stars);
    const key: Array<[string, string]> = [['pace', 'PAC'], ['shooting', 'SHO'], ['passing', 'PAS'], ['tackling', 'TAC'], ['strength', 'STR'], ['composure', 'CMP'], ['creativity', 'CRE'], ['leadership', 'LDR']];
    // A BAR AND A SCALE, not a micro-line of bare abbreviations. This was the game's only stats screen and
    // it rendered as "PAC 10 SHO 14 PAS 16 TAC 9 STR 6 CMP 14 CRE 14 LDR 7" — no bars, no scale, no sense of
    // what counts as good, and the abbreviations expanded only in a tooltip nobody hovers. (PT-160)
    const stat = (k: string) => {
      const v = Number(p.attrs[k] ?? 0);
      return `<span class="cgp-stat" title="${STAT_FULL[k] ?? k}: ${v} out of 20"><b>${key.find((x) => x[0] === k)?.[1]}</b>`
        + `<span class="cgp-bar"><i style="width:${Math.max(0, Math.min(100, v * 5))}%;background:${statColor(v)}"></i></span>`
        + `<em>${v}</em></span>`;
    };
    const traits = p.traitsForming.length ? `<div class="cgp-traits">forming: ${p.traitsForming.map((t) => `<span class="cg-tag">${t}</span>`).join(' ')}</div>` : '';
    return `<div class="cg-profile"><div class="cgp-top">`
      + `<span class="cgp-role role-${p.role}" title="His position emerges from HOW you develop him — the cards you play and stats you grow. The academy scout only glimpsed a hint; this is what he's becoming.">${p.role}${p.traitsForming.length ? ' <span class="cgp-forming">· forming</span>' : ''}</span>`
      + `<span class="cgp-ovr" title="Overall now, and the ceiling the scouts can currently SEE — it rises as he does, so it is a forecast, not a limit.">OVR ${p.currentOverall} <i>→ ${p.potential} scouted ceiling ${stars}</i></span>`
      + `<span class="cgp-pers" title="${p.personality.desc}">🧠 ${p.personality.name}</span>`
      + (p.agent ? `<span class="cgp-meta">🤝 ${p.agent}</span>` : '')
      + (p.coach ? `<span class="cgp-meta">📋 ${p.coach}</span>` : '')
      + `<span class="cgp-meta">💷 ${p.earnings.toLocaleString()}c earned</span></div>`
      + `<div class="cgp-stats">${key.map(([k]) => stat(k)).join('')}</div>`
      + `<div class="cgp-scale">Every attribute runs 1–20. Around 10 is an ordinary senior pro; 15+ is genuinely top level.</div>${traits}</div>`;
  }

  private cardHtml(c: import('./api').CareerCard, act: string, life = false, usedLifeNames?: Set<string>, turn = 0): string {
    const rar = c.rarity && c.rarity !== 'common' ? c.rarity : '';
    // each tag pill carries its own icon + colour class; the card takes the colour of its PRIMARY tag (data-tag)
    // so a hand reads as a scannable spread of identities and matching the demand becomes a visual cue.
    const tags = c.tags.map((t) => `<span class="cg-tag tag-${t}">${TAG_ICON[t] ?? ''} ${t}</span>`).join('');
    const primaryTag = c.tags[0] ?? '';
    // At an off-pitch LIFE EVENT the same card is reframed by the quality it draws on, so "how does he
    // handle it?" gets an off-pitch answer, not an on-pitch move name like "stepover" (PT-43). `usedLifeNames`
    // keeps a whole hand's labels distinct when two cards share a dominant tag (PT-49).
    const la = life ? lifeAction(c.tags, c.id, usedLifeNames, turn) : null;
    if (la && usedLifeNames) usedLifeNames.add(la.name);
    const name = la ? la.name : c.name;
    const desc = la ? la.desc : c.desc;
    // CHALLENGE MODE (#3): when "hide card stats" is on, the boosted-stat pills are masked on the PLAY choice
    // cards, so you infer the stat from the action itself (the action always thematically matches its stat).
    // Draft/deck cards keep their tags so you can still build a deck knowingly.
    const showTags = !(act === 'play' && this.prefs.hideCardStats);
    // The cards are the entire game and they were bare DIVs with a click handler: no role, no tab stop and
    // no accessible name, so to a screen reader the card game read as an unlabelled blank. The name, the
    // description and the qualities it draws on all belong in the label. (PT-160)
    const aria = act === 'view'
      ? `${name}. ${desc ?? ''} ${c.tags.join(', ')}`
      : `Play ${name}. ${desc ?? ''} Draws on ${c.tags.join(' and ')}.${rar ? ` ${rar} card.` : ''}`;
    return `<div class="cg-card ${rar}" data-tag="${primaryTag}" data-act="${act}" data-id="${c.id}"`
      // NOTE: role/tabindex are deliberately NOT set here. makeActivatable() early-returns on anything that
      // already has role="button", so setting it in the markup would have skipped the keydown handler and
      // left the cards focusable but not operable by keyboard — worse than before.
      + ` aria-label="${aria.replace(/"/g, '&quot;').replace(/\s+/g, ' ').trim()}">`
      + `${rar ? `<span class="cg-rarity">${rar}</span>` : ''}<div class="cg-cname">${name}</div>`
      + (desc ? `<div class="cg-cdescr">${desc}</div>` : '') + (showTags ? `<div class="cg-ctags">${tags}</div>` : '<div class="cg-ctags cg-ctags-masked" title="Challenge mode — infer the quality from the action (toggle in Settings)">🎲</div>') + `</div>`;
  }

  private lastNarration = '';
  private lastOutcome?: import('./api').CareerOutcome | null;
  private careerTab: 'now' | 'player' | 'kit' | 'league' | 'life' = 'now';
  private summerStep: 'spend' | 'activities' = 'spend'; // #5: the summer screen is two steps — spend, then choose a focus
  private summerStepTurn = -1;                            // which summer screen the step applies to (reset on a new one)

  /** The club's league table for the season — the small simulated league the bloodline player's club
   *  competes in once he reaches the senior stages. His form + overall drive where the club finishes. */
  private leagueTableHtml(s: import('./api').CareerState): string {
    const cs = s.clubSeason; if (!cs) return '';
    const ord = (n: number) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]); };
    const zone = (i: number) => i === 0 ? 'champ' : i <= 2 ? 'promo' : i >= cs.size - 2 ? 'releg' : '';
    const rows = cs.table.map((r, i) => `<tr class="lt-row ${r.mine ? 'mine' : ''} ${zone(i)}">`
      + `<td class="lt-pos">${i + 1}</td><td class="lt-name">${r.name}</td>`
      + `<td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td>`
      + `<td>${r.GF}</td><td>${r.GA}</td><td>${r.GD > 0 ? '+' : ''}${r.GD}</td><td class="lt-pts">${r.Pts}</td></tr>`).join('');
    return `<div class="cg-league">`
      + `<div class="lt-status"><span class="lt-role">${cs.status}</span><span class="lt-apps">${cs.apps}/${cs.fixtures} apps this season</span></div>`
      + `<div class="lt-head"><b>${cs.me.name}</b> sit <b>${ord(cs.pos)}</b> of ${cs.size} — ${cs.me.W}W ${cs.me.D}D ${cs.me.L}L · ${cs.me.Pts} pts</div>`
      + `<div class="scout-sub">The more he features and the better he plays, the higher his club climbs.</div>`
      + `<table class="lt-table"><thead><tr><th></th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  private lastCareerState?: import('./api').CareerState;

  /** The immediate, legible verdict on the moment just played — a fit read + a performance grade + the
   *  attributes it developed. Colour-coded so a good choice visibly pops (the core NSS feedback loop). */
  private outcomeChipHtml(): string {
    const o = this.lastOutcome;
    if (!o) return '';
    // Two separate things, labelled so they never read as a contradiction:
    // CHOICE — did you pick the card the moment asked for? (about your decision)
    const read = o.answeredAsk
      ? { cls: 'great', label: '🎯 Right card' }
      : o.matchedAsk
        ? { cls: 'good', label: '◑ Partial match' }        // played a called-for (secondary) tag — not wrong, just not the best (PT-44)
        : o.fit >= o.bestFit - 0.18
          ? { cls: 'good', label: '◑ Fair choice' }
          : { cls: 'poor', label: '✗ Wrong card' };
    // RESULT — how the moment actually went (fit + nerve + coaching − fatigue). When the CHOICE was right
    // but the result still dipped, frame it as bad luck on the day, not bad play (reconciles the two pills).
    // Cut points lifted with the demand/nerve retune (PT-700) so "Brilliant" stays a genuine standout rather
    // than the default outcome of a correct card — it was landing on 92% of skilled turns.
    const unlucky = o.answeredAsk && o.success < 0.60;
    const perf = o.success >= 0.80 ? { cls: 'great', label: '⭐ Brilliant' }
      : o.success >= 0.60 ? { cls: 'good', label: '✓ Solid' }
        : o.success >= 0.40 ? { cls: 'mid', label: unlucky ? '◦ Unlucky' : '◦ Scrappy' }
          : { cls: 'poor', label: unlucky ? '✗ Unlucky' : '✗ Poor' };
    const grew = o.tags.length
      ? `<span class="cg-oc-grew">developed ${o.tags.map((t) => `<span class="cg-tag">${t}</span>`).join(' ')}</span>` : '';
    return `<div class="cg-outcome"><span class="cg-oc-pill ${read.cls}" title="Your card choice">${read.label}</span>`
      + `<span class="cg-oc-pill ${perf.cls}" title="How the moment went">${perf.label}</span>${grew}</div>`;
  }

  /** PLAYER tab: the full deck (identity cards) grouped visually. */
  private deckHtml(s: import('./api').CareerState): string {
    const deck = s.deck ?? [];
    if (!deck.length) return '';
    const chem = s.chemistry?.length
      ? `<div class="cg-chemistry"><div class="cg-conseq-lbl">⚗️ Deck chemistry active</div>`
        + s.chemistry.map((c) => `<div class="cg-chem-row"><b>${c.name}</b> <span class="cg-chem-tags">(${c.tags.join(' + ')})</span> — ${c.desc}</div>`).join('') + `</div>`
      : '';
    return `<div class="cg-prompt cg-shop-h">🃏 <b>Your deck</b> — the ${deck.length} cards that define how he plays:</div>`
      + chem
      + `<div class="cg-cards deck">` + deck.map((c) => this.cardHtml(c, 'view')).join('') + `</div>`;
  }

  /** KIT tab: cosmetic identity — squad number, boot colour, celebration, nickname (carries to the pro). */
  private kitTabHtml(s: import('./api').CareerState): string {
    const k = s.kit ?? { number: 10, boots: 'white', celebration: 'kneeslide', nickname: '', hairstyle: 'buzz', accessory: 'none' };
    // Text engine: we only surface identity that actually appears in his STORY. Squad number is real (it's
    // retired in his honour if he becomes a legend); the nickname is what the crowd/commentary calls him.
    // Purely-visual choices (boots colour, hairstyle, accessory, celebration) were cut — nothing renders them.
    return `<div class="cg-kit">`
      + `<div class="cg-prompt">🎽 <b>Identity</b> — this is a text game, so we keep it to the two details that actually show up in his story.</div>`
      + `<div class="cg-kit-row"><label>Squad number <span class="cg-kit-hint">(his for life — retired in his honour if he becomes a club legend)</span></label><input id="kit-number" type="number" min="1" max="99" value="${k.number}"></div>`
      + `<div class="cg-kit-row"><label>Nickname <span class="cg-kit-hint">(what the crowd and the commentary call him)</span></label><input id="kit-nick" type="text" maxlength="20" placeholder="e.g. The Wolf" value="${(k.nickname ?? '').replace(/"/g, '&quot;')}"></div>`
      + `<button id="kit-save" class="cg-kit-save">Save</button>`
      + `</div>`;
  }
  private wireKitTab(s: import('./api').CareerState) {
    $('kit-save').addEventListener('click', async () => {
      const prev = s.kit ?? {} as any; // preserve legacy cosmetic fields the UI no longer exposes
      const kit = {
        number: Math.max(1, Math.min(99, parseInt(($('kit-number') as HTMLInputElement).value) || 10)),
        boots: prev.boots ?? 'white',
        celebration: prev.celebration ?? 'kneeslide',
        nickname: ($('kit-nick') as HTMLInputElement).value.trim(),
        hairstyle: prev.hairstyle ?? 'buzz',
        accessory: prev.accessory ?? 'none',
      };
      try { const r = await api.saveKit(s.prospectId, kit); if (this.lastCareerState) this.lastCareerState.kit = r.kit; s.kit = r.kit; toast('Saved ✓'); }
      catch (e: any) { toast(e?.body?.error ?? 'Could not save'); }
    });
  }

  /** Make click-only divs keyboard-operable (Steam a11y): focusable + Enter/Space triggers the click. */
  private makeActivatable(els: NodeListOf<Element> | Element[]): void {
    els.forEach((el) => {
      const h = el as HTMLElement;
      if (h.getAttribute('role') === 'button') return; // already done
      h.setAttribute('role', 'button'); h.setAttribute('tabindex', '0');
      h.addEventListener('keydown', (e) => { const k = (e as KeyboardEvent).key; if (k === 'Enter' || k === ' ') { e.preventDefault(); h.click(); } });
    });
  }

  private actInFlight = false; // guard: one career action resolves at a time (prevents "card not in hand" on a double/stale click)
  private async doCareerAct(prospectId: string, action: { type: string; cardId: string }) {
    if (!['play', 'draft', 'coach', 'offer', 'focus', 'lifestyle', 'arc'].includes(action.type)) return; // ignore view-only (deck) cards
    if (this.actInFlight) return; // a move is already resolving — ignore the extra click (the hand may have changed)
    this.actInFlight = true;
    $('academy-body').classList.add('cg-acting'); // dim + block the card grid while the move resolves
    if (action.type !== 'lifestyle') this.careerTab = 'now'; // after acting, return to the action view (but stay put while shopping)
    try {
      const r = await api.careerAct(prospectId, action);
      this.lastNarration = r.narration ?? '';
      this.lastOutcome = r.outcome ?? null;
      if (r.clubGain && r.clubGain > 0 && this.account?.coins != null) this.account.coins += r.clubGain; // his earnings feed the club
      if (r.graduated && r.player) {
        this.setMe(await api.me());
        this.checkAchievements(); // first graduate milestone
        audio.chime('success'); // graduation — a real milestone beat
        const player = r.player;
        const windfallLine = r.windfall && r.windfall > 0 ? `<div class="cg-grad-windfall">🏟️ +${r.windfall.toLocaleString()}c to the club — its share of his signing as he turns pro (it funded his rise)</div>` : '';
        // an evocative epilogue of the whole journey, then the pro reveal
        $('academy-body').innerHTML = `<div class="cg-graduation">`
          + `<div class="cg-grad-title">🎓 ${player.name} — the journey's end</div>`
          + `<div class="cg-epilogue">${r.epilogue ?? ''}</div>${windfallLine}`
          + `<button id="cg-reveal">Reveal the pro →</button></div>`;
        $('cg-reveal').addEventListener('click', () => { this.showPlayerCard(player, true); this.showAcademy(); });
      } else if (r.state) {
        this.renderCareer(r.state);
        if (r.clubGain && r.clubGain > 0) toast(`🏟️ +${r.clubGain}c to the club — its development cut of what he earned`);
      }
    } catch (e: any) {
      toast(e?.body?.error ?? 'Move failed');
      // an action can fail if the client's view drifted from the engine's true phase (e.g. a save that
      // straddled an engine change). Re-fetch the real state and re-render so the UI resyncs instead of
      // getting stuck showing a phase the engine has already left (#11 draft soft-lock safety net).
      try { const cur = await api.getCareer(prospectId); if (cur?.state) this.renderCareer(cur.state); } catch { /* leave the view as-is */ }
    }
    finally { this.actInFlight = false; $('academy-body').classList.remove('cg-acting'); }
  }

  // ── Scouting Network: destinations + dispatched trips (sealed → travel → reveal) ──
  private missionTimer: number | null = null;
  private async loadMissions() {
    try {
      const d = await api.missions();
      this.account.coins = d.coins;
      $('trips-per').textContent = String(d.tripsPerSeason);
      $('trips-used').textContent = String(d.tripsUsed);
      $('scout-coins').innerHTML = `<span class="ico-inline">${sprite('coin')}</span> ${d.coins}`;
      const haveTrips = d.tripsLeft > 0;
      $('scout-destinations').innerHTML = d.destinations.map((dest, i) => {
        const risk = Math.min(4, i); // 0 (parks) … 5 (wonderkid) → escalating frame (capped at 4)
        const hit = Math.round(dest.hitRate * 100);
        const up = Math.round(dest.upgradeChance * 100);
        const w = dest.weights;
        const seg = (k: string) => `<i class="b-${k}" style="width:${Math.round((w[k] ?? 0) * 100)}%"></i>`;
        const upPill = up > 0 ? `<span class="pill up">↑ ${up}% upgrade</span>` : '';
        const afford = d.coins >= dest.cost;
        const canSend = haveTrips && afford;
        const label = !haveTrips ? 'No trips left' : !afford ? `Need 💰 ${dest.cost}` : `Send scout · 💰 ${dest.cost} ▶`;
        return `<div class="dest risk-${risk}">`
          + `<div class="dh"><span class="d-name">${dest.name}</span><span class="d-travel">🕓 ${this.travelLabel(dest.travelMins)}</span></div>`
          + `<div class="d-blurb">${dest.blurb}</div>`
          + `<div class="d-odds"><span class="pill hit">🎯 <b>${hit}%</b> sign a player</span>${upPill}<span class="pill cost">💰 ${dest.cost}</span></div>`
          + `<div class="d-band" title="quality mix if a player is found">${seg('raw')}${seg('squad')}${seg('quality')}${seg('gem')}</div>`
          + `<button class="dispatch" data-dest="${dest.id}" ${canSend ? '' : 'disabled'}>${label}</button>`
          + `</div>`;
      }).join('');
      Array.from($('scout-destinations').querySelectorAll('button[data-dest]')).forEach((b) =>
        b.addEventListener('click', () => this.dispatchScout((b as HTMLElement).dataset.dest!)));
      this.renderMissions(d);
    } catch { /* leave missions empty on error */ }
  }

  private travelLabel(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const h = mins / 60;
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
  }

  private renderMissions(d: MissionsData) {
    const capReached = d.loaneeCount >= d.loaneeCap;
    const now = Date.now();
    const rows = d.missions.map((m) => {
      if (!m.revealed) {
        return `<div class="mission travelling" data-ready="${m.readyAt}" data-id="${m.id}">`
          + `<span class="m-dest">🌍 ${m.destName}</span>`
          + `<span class="m-prospect m-status"><span class="m-spinner">⚙️</span> Scout travelling — returns in <b class="m-count">${humanizeMs(m.readyInMs)}</b></span></div>`;
      }
      if (!m.found || !m.player) {
        return `<div class="mission miss" data-id="${m.id}">`
          + `<span class="m-dest">🌍 ${m.destName}</span>`
          + `<span class="m-prospect"><span class="muted">Came back empty-handed — no one worth signing.</span></span></div>`;
      }
      const p = m.player;
      const signed = m.status === 'signed';
      const action = signed ? '<span class="tr-done" style="font-family:var(--body);font-size:17px;color:var(--good)">✓ Signed</span>'
        : capReached ? '<span class="muted">loanee cap</span>'
        : `<button class="sign-m" data-mid="${m.id}">Sign ▶</button>`;
      return `<div class="mission hit" data-id="${m.id}">`
        + `<span class="m-dest">🌍 ${m.destName}</span>`
        + `<span class="m-band band-${m.band}">${(m.band ?? '').toUpperCase()}</span>`
        + `<span class="m-prospect"><span class="m-role role-${p.role}">${p.role}</span>`
        + `<span class="m-name">${p.name}</span><span class="m-ovr">${p.overall}</span></span>${action}</div>`;
    }).join('');
    $('missions-active').innerHTML = rows;
    Array.from($('missions-active').querySelectorAll('button[data-mid]')).forEach((b) =>
      b.addEventListener('click', () => this.signMission((b as HTMLElement).dataset.mid!)));
    this.startMissionTicker(now);
  }

  /** Live-count the travelling trips; when one lands, reload to reveal the prospect. */
  private startMissionTicker(_now: number) {
    if (this.missionTimer) { clearInterval(this.missionTimer); this.missionTimer = null; }
    const travelling = Array.from(document.querySelectorAll('.mission.travelling')) as HTMLElement[];
    if (!travelling.length) return;
    this.missionTimer = window.setInterval(() => {
      const t = Date.now();
      let anyLanded = false;
      for (const el of Array.from(document.querySelectorAll('.mission.travelling')) as HTMLElement[]) {
        const ready = Number(el.dataset.ready);
        const rem = ready - t;
        if (rem <= 0) { anyLanded = true; continue; }
        const c = el.querySelector('.m-count'); if (c) c.textContent = humanizeMs(rem);
      }
      if (anyLanded) { clearInterval(this.missionTimer!); this.missionTimer = null; this.loadMissions(); }
    }, 1000);
  }

  private async dispatchScout(destination: string) {
    try {
      const r = await api.dispatchScout(destination);
      this.account.coins = r.coins;
      toast(`Scout dispatched to ${r.mission.destName} 🌍`);
      await this.loadMissions();
    } catch (e: any) {
      const msg = String(e?.body?.error ?? '');
      toast(e?.status === 409 ? (msg.includes('coins') ? 'Not enough coins for that trip' : 'No scouting trips left this season') : 'Could not dispatch scout');
    }
  }

  private async signMission(id: string) {
    try {
      const r = await api.signMission(id);
      toast(`Signed ${r.player.name} ✓`);
      this.setMe(await api.me());
      await this.showScouting();
    } catch (e: any) {
      toast(e?.status === 409 ? (String(e?.body?.error ?? '').includes('travel') ? 'Your scout is still travelling' : 'You\'ve hit your loanee limit') : 'Could not sign');
    }
  }

  /** Fill the "Your Scouts" cards with the current opposition/player scout tiers. */
  private renderScoutPanel(opp: string, player: string) {
    const oppDesc: Record<string, string> = {
      base: "Reveals an opponent's likely formation + roster — ratings hidden.",
      bronze: 'Now reveals their squad <b>ratings</b>. Likely XI at Silver.',
      silver: 'Reveals ratings + the <b>likely XI</b>. Tactical intel at Gold.',
      gold: 'Full intel: ratings, likely XI, and a <b>tactical read</b>.',
    };
    const playerDesc: Record<string, string> = {
      base: 'Trialists: <b>62</b>/30/7/<b>1%</b> raw/squad/quality/gem. Market shows ratings only.',
      bronze: 'Better trialists (45/38/14/3) + <b>2 key stats</b> shown on listings.',
      silver: 'Better trialists (28/44/22/6) + <b>5 stats</b> shown on listings.',
      gold: 'Best trialists (12/43/33/12) + the <b>full stat sheet</b> on listings.',
    };
    const chip = (id: string, tier: string) => { const el = $(id); el.textContent = tier.toUpperCase(); el.className = `sn-tier tier-${tier}`; };
    chip('opp-tier', opp); chip('player-tier', player);
    $('opp-desc').innerHTML = oppDesc[opp] ?? '';
    $('player-desc').innerHTML = playerDesc[player] ?? '';
  }

  private renderTrialPool(pool: Trialist[], capReached: boolean): string {
    const label: Record<string, string> = { raw: 'Raw', squad: 'Squad', quality: 'Quality', gem: 'Gem' };
    return pool.map((t) => {
      const action = t.signed ? '<span class="tr-done">✓ Signed</span>'
        : capReached ? '<span class="muted">cap reached</span>'
        : `<button data-idx="${t.index}">Sign ▶</button>`;
      return `<div class="trial ${t.signed ? 'signed' : ''} band-${t.band}">`
        + `<span class="tr-band band-${t.band}">${label[t.band] ?? t.band}</span>`
        + `<span class="tr-role role-${t.role}">${t.role}</span>`
        + `<span class="tr-name">${t.name}</span><span class="tr-ovr">${t.overall}</span>${action}</div>`;
    }).join('');
  }

  private async signTrial(index: number) {
    try {
      const r = await api.signTrial(index);
      toast(`Signed ${r.player.name} on loan ✓`);
      this.setMe(await api.me()); // refresh squad so the loanee is selectable in your XI
      await this.showScouting();
    } catch (e: any) {
      toast(e?.status === 409 ? 'You\'ve hit your loanee limit this season' : 'Could not sign');
    }
  }

  // ---- lineup editor (my standing orders) ----
  // Opens the pixel lineup editor either to save your standing orders, or to set a
  // one-off lineup + tactics for a specific match (prefilled from your standing orders).
  private openLineup(mode: 'standing' | 'match', opp?: { id: string; handle: string; venue: 'home' | 'away' }) {
    this.editorMode = mode;
    this.draftPlan = this.loadPlan(); // armed conditional match-plan orders
    this.draftTactics = { ...this.standingOrders.tactics, formation: this.standingOrders.formation };
    // the saved XI can reference players no longer in the squad (e.g. an NFT star that's
    // been transferred/de-listed) — fall back to a valid auto-pick so the editor still opens
    const avail = this.availableClub();
    const owned = new Set(avail.players.map((x) => x.id)); // injured players are unavailable
    const soValid = this.standingOrders.playerIds.length === 11 && this.standingOrders.playerIds.every((id) => owned.has(id));
    this.draftLineup = this.starGuarded(soValid
      ? { formation: this.standingOrders.formation, playerIds: [...this.standingOrders.playerIds] }
      : autoPickXI(avail, this.standingOrders.formation));
    this.draftDuties = this.draftLineup.playerIds.map((pid, i) => {
      const p = this.club.players.find((x) => x.id === pid)!;
      const saved = soValid ? this.standingOrders.duties?.[i] : undefined;
      return saved && isDutyForRole(p.role, saved) ? saved : defaultDuty(p);
    });
    // squad roles (captain + set-piece takers) from the standing orders when the saved XI is intact
    this.draftCaptain = soValid ? (this.standingOrders as any).captainIdx : undefined;
    this.draftTakers = soValid ? { ...((this.standingOrders as any).takers ?? {}) } : {};
    $('lineup-title').textContent = mode === 'standing' ? 'SET MY TEAM' : `SET LINEUP  ${opp!.venue === 'away' ? 'away at' : 'vs'} ${opp!.handle}`;
    // scout the opponent (match mode only): show their expected shape + rated roster
    const sc = $('scout-card');
    if (this.spFixture) {
      // single-player fixture: a lightweight opponent card (no server scout), just their strength
      const stars = '★'.repeat(Math.max(1, Math.round(this.spFixture.oppStrength / 4))) + '☆'.repeat(5 - Math.max(1, Math.round(this.spFixture.oppStrength / 4)));
      // pure flavour: name-check the danger man's duty (their best FW, or best MF if none) — real
      // scouting vocabulary, deterministic from the seeded opponent squad.
      const oppXI = this.spFixture.oppLineup.playerIds.map((pid) => this.spFixture!.oppClub.players.find((p) => p.id === pid)!);
      const dangerMan = [...oppXI].filter((p) => p.role === 'FW').sort((a, b) => overall(b) - overall(a))[0]
        ?? [...oppXI].filter((p) => p.role === 'MF').sort((a, b) => overall(b) - overall(a))[0];
      const dutyNote = dangerMan
        ? `<div class="scout-sub scout-role">👤 <b>${dangerMan.name}</b> — ${DUTY_LABEL[effectiveDuty(dangerMan)]}: ${DUTY_DESC[effectiveDuty(dangerMan)]}</div>` : '';
      sc.classList.remove('hidden');
      sc.innerHTML = `<div class="scout-head">🔍 ${this.spFixture.oppName}</div><div class="scout-sub">${this.spFixture.venue === 'away' ? 'Away' : 'Home'} fixture · squad rating ~${this.spFixture.oppStrength} <span style="color:#e6c76a">${stars}</span></div>${dutyNote}`
        + `<div class="scout-sub scout-matchup" id="scout-matchup">📐 ${formationMatchupInsight(this.draftTactics.formation, this.spFixture.oppTactics.formation)}</div>`;
    } else {
      sc.classList.add('hidden'); sc.innerHTML = '';
    }
    ($('save-team') as HTMLButtonElement).textContent = mode === 'standing' ? 'Save Team' : '▶ Kick Off';
    this.renderLineupEditor();
    // FIRST VISIT: show the XI and a safe way out, and put the nine tactical controls behind a disclosure.
    // The handoff drops a player into this screen one click after a career whose whole interaction was
    // "choose 1 of 4 cards". Once they open the tactics (or come back later) they get the full screen. (PT-503)
    let seen = false;
    try { seen = localStorage.getItem('fm_lineup_seen') === '1'; } catch { seen = true; }
    $('lineup').classList.toggle('simple', !seen);
    $('lineup-firstrun').classList.toggle('hidden', seen);
    $('lineup-advanced').classList.toggle('hidden', seen);
    if (!seen) {
      $('lineup-advanced').onclick = () => {
        $('lineup').classList.remove('simple');
        $('lineup-firstrun').classList.add('hidden');
        $('lineup-advanced').classList.add('hidden');
        try { localStorage.setItem('fm_lineup_seen', '1'); } catch { /* ignore */ }
      };
      // saving from the simple view also counts as having met the screen
      $('save-team').addEventListener('click', () => { try { localStorage.setItem('fm_lineup_seen', '1'); } catch { /* ignore */ } }, { once: true });
    }
    this.showScreen('lineup');
  }

  /** The conditional match-plan panel — only for single-player fixtures (the client is authoritative there;
   *  async-PvP results are server-simulated, so mid-match changes must not diverge). */
  private renderMatchPlan() {
    const host = $('match-plan'); if (!host) return;
    if (this.editorMode !== 'match' || !this.spFixture) { host.innerHTML = ''; return; }
    const rows = MATCH_PLAN_RULES.map((r) => {
      const on = this.draftPlan.has(r.id);
      return `<div class="mp-rule${on ? ' on' : ''}" data-plan="${r.id}"${r.note ? ` title="${r.note}"` : ''}><span class="mp-check">✓</span><span class="mp-ico">${r.ico}</span>`
        + `<span class="mp-body"><span class="mp-if">If ${r.ifText}</span> <span class="mp-then">→ ${r.thenText}</span></span></div>`;
    }).join('');
    host.innerHTML = `<div class="mp-head">📋 MATCH PLAN — conditional orders</div>`
      + `<div class="mp-sub">Arm the moves your side makes automatically as the game unfolds.</div>${rows}`;
    host.querySelectorAll('[data-plan]').forEach((el) => el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.plan!;
      if (this.draftPlan.has(id)) this.draftPlan.delete(id); else this.draftPlan.add(id);
      this.savePlan();
      el.classList.toggle('on');
    }));
  }

  /** The tactics glossary — the same coaching notes that used to exist ONLY in `title=` attributes, put
   *  on screen where a touch player can read them (PT-502). Collapsed by default; the open/closed choice
   *  is remembered so it isn't a fight every matchday. */
  private renderTacticsGlossary(lineHigh: boolean) {
    const host = document.getElementById('tac-help'); if (!host) return;
    let open = false; try { open = localStorage.getItem('fm_tac_help_open') === '1'; } catch { /* default closed */ }
    const items = (Object.keys(LEVELS) as Array<keyof typeof LEVELS>).map((k) => {
      const label = k[0].toUpperCase() + k.slice(1);
      const cur = LEVELS[k][this.draftTactics[k] + 2];
      return `<div class="th-item"><b>${label}</b> <span class="th-cur">— you've set ${cur}</span><br>${TAC_NOTE[k]}</div>`;
    });
    items.push(`<div class="th-item"><b>Offside Trap</b>${lineHigh ? '' : ' <span class="th-cur">— needs a High or Very High line to do anything</span>'}<br>The back line steps up together as the ball is played through, catching the receiver offside. Mistimed, he's clean through on your keeper.</div>`);
    items.push(`<div class="th-item"><b>Play Out From Back</b><br>The keeper always takes the short option instead of hitting it long. It draws the opponent's press onto you and opens space behind them — at the cost of losing the ball in dangerous areas when it goes wrong.</div>`);
    items.push(`<div class="th-item"><b>Attack Focus</b> <span class="th-cur">— you've set ${this.draftTactics.attackFocus === 'wide' ? 'Wing Focus' : this.draftTactics.attackFocus === 'central' ? 'Central Focus' : 'Balanced'}</span><br>Who gets the ball. Wing Focus floods the flanks for crosses and overlaps; Central Focus works it through the middle for cutbacks and one-twos. Use it to lean into your formation's natural shape, or to correct it.</div>`);
    items.push(`<div class="th-item"><b>Duties</b><br>Each man in the XI also has a duty — the job he does within the shape. The one you've picked is spelled out under his name below, and it's worth changing when a player's strengths don't match his slot.</div>`);
    host.innerHTML = `<details id="tac-help-d"${open ? ' open' : ''}><summary>What do these do?</summary>${items.join('')}</details>`;
    document.getElementById('tac-help-d')?.addEventListener('toggle', (ev) => {
      try { localStorage.setItem('fm_tac_help_open', (ev.target as HTMLDetailsElement).open ? '1' : '0'); } catch { /* ignore */ }
    });
  }

  private renderLineupEditor() {
    const tac: string[] = [`<label>Formation<select id="e-formation">${FORMATIONS.map((f) => `<option ${f === this.draftTactics.formation ? 'selected' : ''}>${f}</option>`).join('')}</select></label>`];
    (Object.keys(LEVELS) as Array<keyof typeof LEVELS>).forEach((k) => {
      tac.push(`<label title="${TAC_NOTE[k]}">${k[0].toUpperCase() + k.slice(1)}<select id="e-${k}">${LEVELS[k].map((lab, i) => `<option value="${i - 2}" ${i - 2 === this.draftTactics[k] ? 'selected' : ''}>${lab}</option>`).join('')}</select></label>`);
    });
    // INSTRUCTION toggle (only bites with a high/very-high line): the back four steps up together on
    // a through-ball, catching a receiver without a real pace edge — fewer clean breakaways conceded.
    const lineHigh = this.draftTactics.line >= 1;
    tac.push(`<label class="tac-toggle" title="${lineHigh ? "The back line steps up together to spring the trap — mistime it and they're through." : 'Only bites with a High or Very High defensive line — the back four needs room to step up together.'}"><span>Offside Trap${lineHigh ? '' : ' (needs high line)'}</span><input type="checkbox" id="e-offside" ${this.draftTactics.offsideTrap ? 'checked' : ''} /></label>`);
    tac.push(`<label class="tac-toggle" title="Always the safest short option out of the keeper's hands, drawing the opponent's press forward and opening space in behind it — even under pressure, never force a hopeful long ball."><span>Play Out From Back</span><input type="checkbox" id="e-playout" ${this.draftTactics.playOutOfDefence ? 'checked' : ''} /></label>`);
    const focus = this.draftTactics.attackFocus ?? 'balanced';
    tac.push(`<label title="Bias who gets the ball — lean into (or correct) your formation's natural width. Wide floods the flanks for crosses; Central packs it through the mixer for cutbacks and one-twos.">Attack Focus<select id="e-focus"><option value="balanced" ${focus === 'balanced' ? 'selected' : ''}>Balanced</option><option value="wide" ${focus === 'wide' ? 'selected' : ''}>Wing Focus</option><option value="central" ${focus === 'central' ? 'selected' : ''}>Central Focus</option></select></label>`);
    $('tac-row').innerHTML = tac.join('');
    this.renderTacticsGlossary(lineHigh);
    ($('e-formation') as HTMLSelectElement).addEventListener('change', (ev) => {
      this.draftTactics.formation = (ev.target as HTMLSelectElement).value as Formation;
      const prevDuties = new Map<string, Duty>(); // snapshot player→duty BEFORE the re-pick so it can be preserved (PT-84)
      this.draftLineup.playerIds.forEach((pid, i) => { const d = this.draftDuties[i]; if (d != null) prevDuties.set(pid, d); });
      this.draftLineup = this.starGuarded(autoPickXI(this.availableClub(), this.draftTactics.formation));
      this.rebuildDuties(prevDuties);
      this.renderLineupEditor();
      const mu = document.getElementById('scout-matchup');
      if (mu && this.spFixture) mu.innerHTML = `📐 ${formationMatchupInsight(this.draftTactics.formation, this.spFixture.oppTactics.formation)}`;
    });
    (Object.keys(LEVELS) as Array<keyof typeof LEVELS>).forEach((k) => {
      ($(`e-${k}`) as HTMLSelectElement).addEventListener('change', (ev) => {
        this.draftTactics[k] = Number((ev.target as HTMLSelectElement).value);
        if (k === 'line') this.renderLineupEditor(); // re-render so the trap's "needs high line" hint stays accurate
        this.updateEditorInsight();
      });
    });
    ($('e-offside') as HTMLInputElement).addEventListener('change', (ev) => {
      this.draftTactics.offsideTrap = (ev.target as HTMLInputElement).checked;
      this.updateEditorInsight();
    });
    ($('e-playout') as HTMLInputElement).addEventListener('change', (ev) => {
      this.draftTactics.playOutOfDefence = (ev.target as HTMLInputElement).checked;
      this.updateEditorInsight();
    });
    ($('e-focus') as HTMLSelectElement).addEventListener('change', (ev) => {
      const v = (ev.target as HTMLSelectElement).value;
      this.draftTactics.attackFocus = v === 'wide' || v === 'central' ? v : undefined;
      this.updateEditorInsight();
    });
    this.renderMatchPlan();

    const slots = this.draftLineup.playerIds;
    const benched = this.lapsed(); // NFTs unavailable via a lapsed contract or retirement — not selectable
    const usedElsewhere = (slotIdx: number) => new Set(slots.filter((_, j) => j !== slotIdx));
    const xiHtml = slots.map((pid, i) => {
      const roleForSlot = SLOT_ROLES[this.draftTactics.formation][i];
      const used = usedElsewhere(i);
      const isLoan = (id: string) => id.startsWith('loan-');
      const tagText = (p: Player) => isLoan(p.id) ? ' · LOAN' : isNftId(p.id) ? ` ${nftTier(overall(p)).icon}` : '';
      const opts = this.club.players
        .filter((p) => p.id === pid || (!used.has(p.id) && !this.injured.has(p.id) && !benched.has(p.id))) // hide injured + contract-lapsed/retired
        .sort((a, b) => overall(b) - overall(a))
        .map((p) => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${p.name} (${p.role} ${overall(p)})${tagText(p)}</option>`).join('');
      const cur = this.club.players.find((p) => p.id === pid)!;
      const curTier = nftTier(overall(cur));
      const tag = isLoan(cur.id) ? `<span class="loan" title="Loanee — plays this season only, then leaves">LOAN</span>`
        : isNftId(cur.id) ? `<span class="nft tier-${curTier.key}" data-card="${cur.id}" title="Bloodline star · ${curTier.name} tier — click to view card">${curTier.icon} ${curTier.name}</span>` : '';
      const dutyOpts = DUTIES_BY_ROLE[cur.role]
        .map((d) => `<option value="${d}" title="${DUTY_DESC[d]}" ${d === this.draftDuties[i] ? 'selected' : ''}>${DUTY_LABEL[d]}</option>`).join('');
      const curDutyDesc = DUTY_DESC[this.draftDuties[i]] ?? '';
      const curDutyLabel = DUTY_LABEL[this.draftDuties[i]] ?? '';
      const rb = (role: string, on: boolean, glyph: string, title: string) => `<button class="rb ${role}${on ? ' on' : ''}" data-role="${role}" data-i="${i}" title="${title}">${glyph}</button>`;
      const badges = `<span class="role-badges">`
        + rb('cap', this.draftCaptain === i, '©', 'Captain')
        + rb('pen', this.draftTakers.pen === i, 'P', 'Penalty taker')
        + rb('fk', this.draftTakers.fk === i, 'F', 'Free-kick taker')
        + rb('corner', this.draftTakers.corner === i, 'C', 'Corner taker')
        + `</span>`;
      const oop = cur.role !== roleForSlot; // player fielded out of his natural position (PT-85)
      return `<div class="slot role-${roleForSlot}${oop ? ' slot-oop' : ''}"${oop ? ` title="Out of position — a ${cur.role} in a ${roleForSlot} slot"` : ''}><span class="role role-${roleForSlot}">${roleForSlot}</span><select class="player-sel" data-i="${i}">${opts}</select><select class="duty-sel" data-i="${i}" title="${curDutyDesc}">${dutyOpts}</select>${tag}<span class="ovr" style="color:${statColor(overall(cur))}">${overall(cur)}</span>${oop ? '<span class="slot-oop-badge" title="Out of position">⚠</span>' : ''}${badges}`
        // the chosen duty explained IN the slot — this was hover-only, so touch players never saw it (PT-502)
        + `<div class="slot-duty-note" data-duty-note="${i}">${curDutyLabel ? `${curDutyLabel} — ` : ''}${curDutyDesc}</div></div>`;
    }).join('');
    // validate the XI: warn (don't block) on no keeper / players out of position, so a naive manager gets a signal (PT-85)
    const noGK = !slots.some((_, i) => this.playerAt(i).role === 'GK');
    const oopCount = slots.filter((_, i) => this.playerAt(i).role !== SLOT_ROLES[this.draftTactics.formation][i]).length;
    const warnMsgs = [noGK ? 'no goalkeeper' : '', oopCount ? `${oopCount} player${oopCount > 1 ? 's' : ''} out of position` : ''].filter(Boolean);
    const warn = warnMsgs.length ? `<div class="xi-warn">⚠️ <b>Check your XI:</b> ${warnMsgs.join(' · ')} — they'll still play, but a player out of position underperforms.</div>` : '';
    $('xi').innerHTML = warn + xiHtml;
    Array.from($('xi').querySelectorAll('button.rb')).forEach((b) => {
      b.addEventListener('click', () => {
        const el = b as HTMLElement; const i = Number(el.dataset.i); const role = el.dataset.role!;
        if (role === 'cap') this.draftCaptain = this.draftCaptain === i ? undefined : i;       // one captain, toggle
        else { const k = role as 'pen' | 'fk' | 'corner'; this.draftTakers[k] = this.draftTakers[k] === i ? undefined : i; } // one taker per type, toggle
        this.renderLineupEditor();
      });
    });
    Array.from($('xi').querySelectorAll('select.player-sel')).forEach((sel) => {
      sel.addEventListener('change', (ev) => {
        const t = ev.target as HTMLSelectElement;
        const i = Number(t.dataset.i);
        this.draftLineup.playerIds[i] = t.value;
        this.draftDuties[i] = defaultDuty(this.playerAt(i)); // new player → its default duty
        this.renderLineupEditor();
      });
    });
    Array.from($('xi').querySelectorAll('select.duty-sel')).forEach((sel) => {
      sel.addEventListener('change', (ev) => {
        const t = ev.target as HTMLSelectElement;
        const d = t.value as Duty;
        const i = Number(t.dataset.i);
        this.draftDuties[i] = d;
        t.title = DUTY_DESC[d] ?? ''; // live-refresh the tooltip so it always matches the picked duty
        const note = $('xi').querySelector(`[data-duty-note="${i}"]`); // and the VISIBLE caption beside it (PT-502)
        if (note) note.textContent = `${DUTY_LABEL[d]} — ${DUTY_DESC[d] ?? ''}`;
      });
    });

    const inXI = new Set(slots);
    const bench = this.club.players.filter((p) => !inXI.has(p.id) && !this.injured.has(p.id)).sort((a, b) => overall(b) - overall(a));
    const hurt = this.club.players.filter((p) => this.injured.has(p.id)).sort((a, b) => overall(b) - overall(a));
    const injuredHtml = hurt.length ? `<div class="bench-injured"><b>🤕 Injured:</b> ` + hurt.map((p) => `<span class="inj">${p.name} (${p.role} ${overall(p)}) · ${this.injured.get(p.id)}m</span>`).join(' · ') + '</div>' : '';
    $('bench').innerHTML = `<b>Bench:</b> ` + bench.map((p) => {
      const t = isNftId(p.id) ? nftTier(overall(p)) : null;
      return t ? `<span class="bench-nft tier-${t.key}" data-card="${p.id}" title="Your star · ${t.name} — click to view card">${t.icon} ${p.name} (${p.role} ${overall(p)})</span>`
        : `${p.name} (${p.role} ${overall(p)})`;
    }).join(' · ') + injuredHtml;
    // NFT badges/names open the collectible card
    Array.from(document.querySelectorAll<HTMLElement>('#xi [data-card], #bench [data-card]')).forEach((el) => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => { const p = this.club.players.find((x) => x.id === el.dataset.card); if (p) this.showPlayerCard(p); });
    });
    if (!$('squad-panel').classList.contains('hidden')) this.renderSquadPanel();
    this.updateEditorInsight();
  }

  private playerAt(i: number): Player { return this.club.players.find((p) => p.id === this.draftLineup.playerIds[i])!; }
  /** Reset every slot's duty to its player's auto default (after a formation change / auto-pick). */
  private rebuildDuties(preserve?: Map<string, Duty>) {
    // keep each RETAINED player's hand-set duty across a re-pick (only reset a new player or a duty that's no
    // longer valid for its role) — a formation tweak shouldn't silently wipe the whole setup (PT-84).
    this.draftDuties = this.draftLineup.playerIds.map((pid, i) => {
      const p = this.playerAt(i);
      const kept = preserve?.get(pid);
      return kept != null && isDutyForRole(p.role, kept) ? kept : defaultDuty(p);
    });
  }

  private renderSquadPanel() {
    const panel = $('squad-panel');
    const hurt = this.club.players.filter((p) => this.injured.has(p.id)).sort((a, b) => (this.injured.get(a.id)! - this.injured.get(b.id)!));
    const injHtml = hurt.length ? `<div class="squad-injured">🤕 <b>Injured:</b> ${hurt.map((p) => `${p.name} <span class="m">${this.injured.get(p.id)}m</span>`).join(' · ')}</div>` : '';
    panel.innerHTML = this.nftStatusHtml() + injHtml + statsTableHTML(this.club.players, new Set(this.draftLineup.playerIds), this.squadSort);
    panel.querySelectorAll<HTMLElement>('.ns-act').forEach((b) => b.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (b.dataset.nextend) await this.extendPlayer(b.dataset.nextend);
      else if (b.dataset.nstake) await this.stakePlayer(b.dataset.nstake, true);
    }));
    panel.querySelectorAll<HTMLElement>('.ns-row').forEach((r) => r.addEventListener('click', () => { const p = this.club.players.find((x) => x.id === r.dataset.open); if (p) this.showPlayerCard(p); }));
    panel.querySelectorAll<HTMLElement>('th.sortable').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort!;
        // Same column: toggle asc/desc. New column: start descending.
        if (this.squadSort?.key === key) this.squadSort.dir = this.squadSort.dir === 'desc' ? 'asc' : 'desc';
        else this.squadSort = { key, dir: 'desc' };
        this.renderSquadPanel();
      });
    });
    panel.querySelectorAll<HTMLElement>('[data-card]').forEach((td) => {
      td.addEventListener('click', () => {
        const p = this.club.players.find((x) => x.id === td.dataset.card);
        if (p) this.showPlayerCard(p);
      });
    });
  }

  private updateEditorInsight() {
    $('lineup-insight').innerHTML = squadInsight(buildXI(this.club, this.draftLineup));
  }

  private async saveTeam() {
    const so: StandingOrders = {
      formation: this.draftTactics.formation,
      playerIds: this.draftLineup.playerIds,
      tactics: { ...this.draftTactics },
      duties: [...this.draftDuties],
      ...this.draftRoles(),
    };
    try { const r = await api.setStandingOrders(so); this.standingOrders = r.standingOrders; toast('Team saved ✓'); await this.showHub(); }
    catch { $('lineup-insight').innerHTML = '<span style="color:var(--home)">Could not save — check your XI.</span>'; }
  }

  // ---- match ----
  /** The current captain + set-piece-taker designations, ready to attach to a lineup / standing orders. */
  private draftRoles(): { captainIdx?: number; takers?: { pen?: number; fk?: number; corner?: number } } {
    const t = this.draftTakers;
    const hasTakers = t.pen != null || t.fk != null || t.corner != null;
    return { ...(this.draftCaptain != null ? { captainIdx: this.draftCaptain } : {}), ...(hasTakers ? { takers: { ...t } } : {}) };
  }
  private kickOffMatch() {
    if (!this.spFixture) return;
    // Commit the star-starts invariant to the DRAFT before kickoff (PT-137, cf PT-20): a manual per-slot swap can
    // drop the star from draftLineup with no re-guard, and while startSpMatchWith re-forces him onto the pitch via
    // a local lineup, the team-talk note + personality modulation read this.draftLineup — so without this they'd
    // key to the captain even though the star is playing. Guard the draft here (realigning any swapped slot's duty)
    // so the note, the modulation and the played XI all agree.
    const guarded = this.starGuarded(this.draftLineup);
    if (guarded.playerIds.some((pid, i) => pid !== this.draftLineup.playerIds[i])) {
      this.draftDuties = guarded.playerIds.map((pid, i) => pid === this.draftLineup.playerIds[i] ? this.draftDuties[i] : defaultDuty(this.club.players.find((p) => p.id === pid)!));
      this.draftLineup = guarded;
    }
    this.kickOffSpMatch(); // single-player fixture: build the match locally
  }

  private lastGate = 0;
  private lastInjuries: Array<{ name: string; matches: number }> = [];
  private startMatch(payload: MatchPayload) {
    this.mySide = payload.mySide;
    this.lastGate = payload.gateIncome ?? 0;
    this.lastInjuries = payload.injuries ?? [];
    this.homeName = payload.home.handle;
    this.awayName = payload.away.handle;
    // guarantee the two kits clearly contrast on the pitch even if the clubs' colours are similar
    const dist = (a: number, b: number) => {
      const dr = ((a >> 16) & 255) - ((b >> 16) & 255), dg = ((a >> 8) & 255) - ((b >> 8) & 255), db = (a & 255) - (b & 255);
      return dr * dr + dg * dg + db * db;
    };
    if (dist(payload.home.team.shirtColor, payload.away.team.shirtColor) < 9000) {
      payload.away.team.shirtColor = dist(payload.home.team.shirtColor, 0x3b6bd2) > 9000 ? 0x3b6bd2 : 0xd23b3b;
    }
    this.engine = new MatchEngine([payload.home.team, payload.away.team], payload.seed, [payload.home.tactics, payload.away.tactics]);
    this.matchSeed = payload.seed >>> 0;
    this.cmSeq = 0; this.cmBag = {}; this.lastPick = {};   // fresh banks each match
    this.playerAttrs = new Map();
    for (const t of [payload.home.team, payload.away.team]) {
      for (const p of t.players) this.playerAttrs.set(p.name, p.attrs);
      for (const p of (t.bench ?? [])) this.playerAttrs.set(p.name, p.attrs); // subs appear later
    }
    this.move = null;
    this.liveScore = [0, 0]; this.scorerTally = new Map(); this.lastGoalIdx = -1;
    this.attackBeats = []; this.lastMomentumMin = -99; this.lastAttackMin = 0;
    // match plan: snapshot the kickoff tactics (shifts apply from here) and clear the fired set
    this.planFired = new Set();
    this.planBaseTactics = { ...(payload.mySide === 0 ? payload.home.tactics : payload.away.tactics) };
    this.running = true; this.accum = 0; this.eventsShown = 0;
    this.setMatchNames();
    $('ticker').innerHTML = '';
    this.showScreen('match');
    if (this.spFixture?.comp === 'wc' || this.spFixture?.comp === 'cont') audio.play('bigmatch'); // cup / World-Finals ties get the big-match theme
  }

  private setMatchNames() {
    $('home-name').textContent = this.homeName;
    $('away-name').textContent = this.awayName;
  }

  private async onFullTime() {
    this.running = false;
    // SINGLE-PLAYER fixture: record the result into the club season and return to the season view (no server).
    if (this.spFixture) {
      const s = this.engine!.state;
      const myGoals = s.score[this.mySide], oppGoals = s.score[1 - this.mySide];
      if (this.spFixture.comp === 'cont') {
        const oppStrength = this.spFixture.oppStrength;
        this.showFullTimeCard();               // show the result card, then resolve the tie on dismiss
        this.pendingCont = { myGoals, oppGoals, oppStrength };
        return;
      }
      if (this.spFixture.comp === 'wc') {
        const oppName = this.spFixture.oppName;
        this.showFullTimeCard();
        this.pendingWc = { myGoals, oppGoals, oppName };
        return;
      }
      const m = this.loadMgr();
      m.results.push({ myGoals, oppGoals });
      this.saveMgr(m);
      this.showFullTimeCard();
      return;
    }
    try { this.setMe(await api.me()); } catch { /* keep old rating */ }
    // surface any injuries picked up this match (staggered so they don't overlap the result toast)
    this.lastInjuries.forEach((inj, i) => setTimeout(() => {
      toast(`🤕 ${inj.name} injured — out ${inj.matches} match${inj.matches > 1 ? 'es' : ''}`);
      // the injury record carries a NAME, not an id, so the squad lookup matches on that
      const ip = this.club?.players.find((x) => x.name === inj.name);
      if (ip) this.feedEvent(inj.matches >= 6 ? 'injury_long' : 'injury', '🤕', this.personCtx(ip, ip.id === this.loadMgr().starId), { n: inj.matches });
    }, 800 * (i + 1)));
    this.showFullTimeCard();
  }

  /** Deterministic post-match report: a result narrative, scorers, red cards, and player of the match. */
  private renderMatchReport(events: MatchEvent[], score: [number, number]) {
    const [h, a] = score;
    const home = this.homeName, away = this.awayName;
    // Key everyone by teamIdx+name, NOT name alone — both squads draw from the same 18×18 name pool, so a
    // namesake across the two sides would otherwise merge into one scorer/assister/POTM on the wrong team (PT-117).
    const nkey = (team: 0 | 1, name: string) => `${team}|${name}`;
    const goalsBy = new Map<string, { team: 0 | 1; name: string; mins: number[] }>();
    for (const e of events) if (e.type === 'goal' && e.playerName) {
      const k = nkey(e.teamIdx, e.playerName);
      const g = goalsBy.get(k) ?? { team: e.teamIdx, name: e.playerName, mins: [] };
      g.mins.push(e.minute); goalsBy.set(k, g);
    }
    const winner = h > a ? home : a > h ? away : null;
    const loser = h > a ? away : a > h ? home : null;
    const margin = Math.abs(h - a), hi = Math.max(h, a), lo = Math.min(h, a);
    // OCCASION prefix — a cup tie (and a FINAL above all) must read bigger than a Tuesday league game (PT-82).
    const fx = this.spFixture;
    let occasion = '';
    if (fx?.comp === 'cont') {
      const rn = ['the Quarter-Final', 'the Semi-Final', 'the Final'][fx.contRound ?? 0] ?? 'a continental tie';
      occasion = fx.contRound === 2 ? '🏆 <b>THE CONTINENTAL CUP FINAL.</b> ' : `🌍 <b>Continental Cup — ${rn}.</b> `;
    } else if (fx?.comp === 'wc') {
      occasion = '🌐 <b>World Finals knockout.</b> ';
    } else if (fx && fx.idx >= 0) {
      occasion = fx.venue === 'home' ? '' : ''; // league: keep it plain; the venue already shows on the fixture card
    }
    let lead: string;
    if (!winner) lead = this.cpick([`${home} and ${away} shared the points in a ${h}–${a} draw.`, `Honours even at ${h}–${a}.`, `Nothing to separate them — ${h}–${a}.`, `A hard-fought ${h}–${a} stalemate.`, `${home} ${h}, ${away} ${a} — neither could find the winner.`], h + a, 30);
    else {
      const verb = margin >= 3 ? this.cpick(['ran riot against', 'romped past', 'were rampant against', 'tore', 'demolished'], margin, 31)
        : margin === 2 ? this.cpick(['saw off', 'got the better of', 'had too much for', 'were worth their win over'], margin, 31)
        : this.cpick(['edged out', 'nicked it against', 'just got past', 'squeezed past', 'held on to beat'], margin, 31);
      lead = `${winner} ${verb === 'tore' ? `tore ${loser} apart` : `${verb} ${loser}`}, ${hi}–${lo}.`;
    }
    lead = occasion + lead;
    const reds = events.filter((e) => e.type === 'red_card').map((e) => e.playerName);
    const redLine = reds.length ? ` ${reds.join(' and ')} saw red.` : '';
    const names = [...goalsBy.values()];
    const scLine = names.length ? 'Scorers: ' + names.map((g) => `${g.name} (${g.mins.map((m) => m + "'").join(', ')})`).join(' · ') : 'A goalless stalemate.';
    const assists = new Map<string, { name: string; count: number }>();
    for (const e of events) if (e.type === 'goal' && e.playerName2) { const k = nkey(e.teamIdx, e.playerName2); const a2 = assists.get(k) ?? { name: e.playerName2, count: 0 }; a2.count++; assists.set(k, a2); }
    const asLine = assists.size ? `<div class="scorers">🅰 Assists: ${[...assists.values()].map((a2) => a2.count > 1 ? `${a2.name} ×${a2.count}` : a2.name).join(' · ')}</div>` : '';
    // CONTRIBUTIONS: goals (×2) + assists (×1), with each player's side — so a playmaker's or a non-scoring
    // game is visible, POTM can be an assister (0-0s + assist-only games get a POTM), and your OWN star isn't
    // upstaged on his own report by the opponent's scorer (PT-74). Keyed by teamIdx+name so namesakes don't merge (PT-117).
    const contrib = new Map<string, { pts: number; team: 0 | 1; name: string; goals: number; assists: number }>();
    const bump = (name: string, team: 0 | 1, dg: number, da: number) => { const k = nkey(team, name); const e = contrib.get(k) ?? { pts: 0, team, name, goals: 0, assists: 0 }; e.goals += dg; e.assists += da; e.pts += dg * 2 + da; contrib.set(k, e); };
    for (const e of events) if (e.type === 'goal') { if (e.playerName) bump(e.playerName, e.teamIdx, 1, 0); if (e.playerName2) bump(e.playerName2, e.teamIdx, 0, 1); }
    // spotlight the bloodline star when HE features — goals AND assists (not goals only) (PT-21/PT-74). The star
    // is on the manager's side, which is home (teamIdx 0) at home and away (teamIdx 1) away — see mySide in startMatch.
    const starName = this.loadMgr().starName;
    const myTeamIdx: 0 | 1 = this.spFixture?.venue === 'home' ? 0 : 1;
    const starKey = starName ? nkey(myTeamIdx, starName) : undefined;
    const sc = starKey ? contrib.get(starKey) : undefined;
    const starLineFt = sc && (sc.goals || sc.assists)
      ? `<div class="scorers ft-star">⭐ <b>${starName}</b> ${sc.goals ? `got on the scoresheet${sc.goals >= 2 ? ` — ${sc.goals} goals` : ''}${sc.assists ? ` and set up ${sc.assists}` : ''}` : `set up ${sc.assists} goal${sc.assists > 1 ? 's' : ''}`}</div>`
      : '';
    $('ft-report').innerHTML = `${lead}${redLine}<div class="scorers">${scLine}</div>${asLine}${starLineFt}`;
    // player of the match: most contribution points, tie broken toward YOUR star first, then the winning side
    const winSide: 0 | 1 | null = h > a ? 0 : a > h ? 1 : null;
    const ranked = [...contrib.entries()].sort((x, y) => y[1].pts - x[1].pts
      || (Number(y[0] === starKey) - Number(x[0] === starKey))
      || (Number(y[1].team === winSide) - Number(x[1].team === winSide)));
    const potmEl = $('ft-potm');
    if (ranked.length) {
      const [, c] = ranked[0];
      const bits = [c.goals ? `${c.goals} goal${c.goals > 1 ? 's' : ''}` : '', c.assists ? `${c.assists} assist${c.assists > 1 ? 's' : ''}` : ''].filter(Boolean).join(', ');
      potmEl.classList.remove('hidden');
      potmEl.innerHTML = `<span class="potm-lbl">★ PLAYER OF THE MATCH</span>${c.name}${bits ? ` — ${bits}` : ''}`;
    } else potmEl.classList.add('hidden');
  }

  // Arcade full-time overlay: final score, possession % and total shots (goal + shot_*)
  // per side, then returns to the hub on tap or after a short auto-dismiss.
  private showFullTimeCard() {
    const s = this.engine!.state;
    const tot = s.possession[0] + s.possession[1] || 1;
    const hp = Math.round((s.possession[0] / tot) * 100);
    // Shots on target = goals + saved efforts (shot_missed is off target, so excluded).
    const onTarget: [number, number] = [0, 0];
    for (const e of s.events) if (e.type === 'goal' || e.type === 'shot_saved') onTarget[e.teamIdx]++;

    $('ft-home-name').innerHTML = `<span class="ft-crest">${crest(this.homeName, 20)}</span>${this.homeName}`;
    $('ft-away-name').innerHTML = `<span class="ft-crest">${crest(this.awayName, 20)}</span>${this.awayName}`;
    $('ft-score').textContent = `${s.score[0]} - ${s.score[1]}`;
    $('ft-home-poss').textContent = `${hp}%`;
    $('ft-away-poss').textContent = `${100 - hp}%`;
    $('ft-home-shots').textContent = `${onTarget[0]}`;
    $('ft-away-shots').textContent = `${onTarget[1]}`;
    const count = (ty: string): [number, number] => { const c: [number, number] = [0, 0]; for (const e of s.events) if (e.type === ty) c[e.teamIdx]++; return c; };
    const corners = count('corner'), fouls = count('foul');
    $('ft-home-corners').textContent = `${corners[0]}`; $('ft-away-corners').textContent = `${corners[1]}`;
    $('ft-home-fouls').textContent = `${fouls[0]}`; $('ft-away-fouls').textContent = `${fouls[1]}`;
    this.renderMatchReport(s.events, s.score);
    // single-player post-match REACTION — keyed to the result vs what was expected (your strength vs theirs)
    if (this.spFixture) {
      const my = s.score[this.mySide], opp = s.score[1 - this.mySide], gd = my - opp;
      const edge = this.clubLeagueStrength() - this.spFixture.oppStrength; // + = you were favourites
      let reaction: string;
      if (gd > 0) reaction = edge < -2 ? '🎉 A famous win against the odds — the fans are in raptures!' : gd >= 3 ? '👏 A commanding win — statement made.' : 'A hard-earned three points.';
      else if (gd < 0) reaction = edge > 2 ? '😤 A dismal result — a game the club should have won.' : 'A tough one to take, but the season rolls on.';
      else reaction = edge > 2 ? 'Two points dropped — the fans expected more.' : 'A share of the spoils.';
      $('ft-report').insertAdjacentHTML('beforeend', `<div class="ft-reaction">${reaction}</div>`);
      // the manager at the presser — a different register from the fans' reaction (from @fm/shared press.ts)
      const recent = (this.loadMgr().results ?? []).slice(-5);
      const wl = recent.reduce((a, r) => a + (r.myGoals > r.oppGoals ? 1 : r.myGoals < r.oppGoals ? -1 : 0), 0);
      const form: PressForm = wl >= 2 ? 'hot' : wl <= -2 ? 'cold' : 'level';
      const competition: PressCompetition = this.spFixture.comp === 'cont' ? 'continental' : this.spFixture.comp === 'wc' ? 'international' : 'league';
      const rivals = seededOpponents(this.club.name, this.leagueSeed(), this.clubTier());
      const rivalName = rivals.length ? rivals[this.leagueSeed() % rivals.length].name : null;
      const stakes: 1 | 2 | 3 = this.spFixture.comp === 'wc' || this.spFixture.comp === 'cont' ? 3 : this.spFixture.oppName === rivalName ? 2 : 1;
      const salt = (this.loadMgr().season * 97 + (this.loadMgr().results?.length ?? 0)) >>> 0;
      const line = pressConferenceLine(this.leagueSeed(), salt, { timing: 'post', competition, stakes, form, result: gd > 0 ? 'win' : gd < 0 ? 'loss' : 'draw' });
      $('ft-report').insertAdjacentHTML('beforeend', `<div class="ft-presser">🎙️ <b>At the presser</b> — “${line}”</div>`);
    }
    $('ft-gate').classList.toggle('hidden', this.lastGate <= 0);
    if (this.lastGate > 0) $('ft-gate-amt').textContent = String(this.lastGate);

    const card = $('fulltime-card');
    card.classList.remove('hidden');
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(timer);
      card.removeEventListener('click', dismiss);
      card.classList.add('hidden');
      if (this.pendingCont) { const c = this.pendingCont; this.pendingCont = null; this.spFixture = null; this.resolveContinental(c.myGoals, c.oppGoals, c.oppStrength); return; } // continental tie → advance/out
      if (this.pendingWc) { const c = this.pendingWc; this.pendingWc = null; this.spFixture = null; this.resolveWorldCup(c.myGoals, c.oppGoals, c.oppName); return; } // World-Finals knockout tie → advance/out
      if (this.spFixture) this.showSeason(); else this.showHub(); // SP: back to the season fixture list
    };
    const timer = setTimeout(dismiss, 9000); // longer — there's a match report to read
    card.addEventListener('click', dismiss);
  }

  // "Skip to full-time": run the deterministic engine straight to the end, flush the
  // remaining commentary (without a flurry of goal flashes/shakes), then show the card.
  private skipToEnd() {
    if (!this.engine || this.engine.state.finished) return;
    this.running = false; // stop the animated tick loop from also advancing
    const plan = this.spFixture && this.draftPlan.size;
    while (!this.engine.state.finished) { this.engine.tick(); if (plan) this.evalMatchPlan(); }
    this.silent = true;
    this.syncMatchHud(); // final score/possession/fitness + flush ticker
    this.silent = false;
    this.onFullTime();
  }

  onFrame(dMs: number) {
    if (!this.engine || $('matchwrap').classList.contains('hidden')) return;
    if (this.running) {
      this.accum += (dMs / 1000) * 10 * this.speed;
      while (this.accum >= TICK_SEC && !this.engine.state.finished) {
        this.engine.tick();
        this.accum -= TICK_SEC;
        if (this.engine.state.finished) { this.onFullTime(); break; }
      }
      if (this.spFixture && this.draftPlan.size && !this.engine.state.finished) this.evalMatchPlan();
    }
    this.syncMatchHud();
  }

  /** Fire any armed match-plan order whose trigger (minute + scoreline) is now met — once each. When it
   *  fires, the shift is applied from the kickoff tactics and pushed to the engine mid-match. SP-only. */
  private evalMatchPlan() {
    const s = this.engine!.state;
    const min = Math.floor(s.clockSec / 60);
    const my = s.score[this.mySide], opp = s.score[1 - this.mySide];
    for (const r of MATCH_PLAN_RULES) {
      if (!this.draftPlan.has(r.id) || this.planFired.has(r.id)) continue;
      if (min >= r.minMinute && r.cond(my, opp)) {
        this.planFired.add(r.id);
        const base = this.planBaseTactics ?? this.draftTactics;
        const nt: Tactics = { ...base };
        for (const k in r.shift) (nt as any)[k] = clampTac((base as any)[k] + (r.shift as any)[k]!);
        this.engine!.setTactics(this.mySide, nt);
        toast(r.fired);
      }
    }
  }

  private syncMatchHud() {
    const s = this.engine!.state;
    const scoreText = `${s.score[0]} - ${s.score[1]}`;
    const scoreEl = $('score');
    if (scoreEl.textContent !== scoreText) {
      scoreEl.textContent = scoreText;
      scoreEl.classList.remove('pulse');
      void scoreEl.offsetWidth; // restart the CSS animation
      scoreEl.classList.add('pulse');
    }
    const m = Math.floor(s.clockSec / 60), sec = Math.floor(s.clockSec % 60);
    $('clock').textContent = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    const tot = s.possession[0] + s.possession[1] || 1;
    const hp = Math.round((s.possession[0] / tot) * 100);
    ($('poss-home') as HTMLElement).style.width = `${hp}%`;
    $('poss-home-l').textContent = `${hp}%`;
    $('poss-away-l').textContent = `${100 - hp}%`;
    const fitAvg = s.players[this.mySide].slice(1).reduce((a, p) => a + p.fitness, 0) / 10;
    const fitPct = Math.round(fitAvg * 100);
    const fill = $('fit-fill') as HTMLElement;
    fill.style.width = `${fitPct}%`;
    // hue sweeps 0 (red) → 120 (green) with fitness, so the bar shifts green→amber→red as it drops
    fill.style.background = `hsl(${Math.round(fitAvg * 120)}, 70%, 45%)`;
    $('fit-label').textContent = `Your squad fitness: ${fitPct}%`;
    while (this.eventsShown < s.events.length) this.pushTicker(s.events[this.eventsShown++]);
  }

  private matchSeed = 0;
  /** Deterministic index from the match seed + event index + a salt (so a replay commentates identically). */
  private cidx(len: number, idx: number, salt: number): number {
    let h = (this.matchSeed ^ Math.imul(idx + 1, 374761393) ^ Math.imul(salt, 2246822519)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); h ^= h >>> 16;
    return (h >>> 0) % len;
  }
  private cpick<T>(arr: T[], idx: number, salt: number): T { return arr[this.cidx(arr.length, idx, salt)]; }
  /** A monotonic commentary counter. Several call sites derived their picker index from match STATE that
   *  barely varies — `flushMove` used `seq.length + touches`, and since `seq` is capped at 4 a 2-touch passage
   *  (82% of them) always evaluated to 4, so one lead phrase printed ~190 times in a single match. An
   *  ever-advancing counter is the right index for "which line next". (PT-1200) */
  private cmSeq = 0;
  private lastPick: Record<string, number> = {};
  private cmBag: Record<string, number[]> = {};
  /** cpick as a SHUFFLED BAG: draw a seeded permutation of the bank and deal it out, only reshuffling once
   *  every line has been used. Blocking back-to-back repeats (the previous behaviour) was not enough — a
   *  memoryless hash still clusters, and a live 90-minute capture measured three lines of one bank taking
   *  22% of the whole feed. A bag makes usage exactly even: with a bank of N, no line can appear twice until
   *  all N have appeared once. Still fully deterministic — the shuffle is the same seeded hash. (PT-1204)
   *  The seam between two bags is the one place a repeat could still slip through, so it is patched too. */
  private cpickNR<T>(arr: T[], salt: number, key?: string, vars?: Record<string, string | undefined>): T {
    // AUTHORED LINES merge in here. The live banks are template literals and cannot be edited in parallel,
    // so authors write data (with {p}/{team}/{zone} placeholders) into shared/src/commentary/pack_*.ts and
    // it is substituted at draw time. This is the game's weakest surface — 159 lines against ~700 shown in
    // a single match — so the bank a player actually sees is base + everything authored for that event.
    if (key) {
      const extra = commentaryExtra(key);
      if (extra.length) arr = [...arr, ...extra.map((l: string) => fillCm(l, vars ?? {}) as unknown as T)];
    }
    if (arr.length <= 1) return arr[0];
    // Salts are hand-assigned and 18 of them are reused across different banks, so the bag is keyed by
    // salt AND bank size — otherwise a 4-line bank and a 14-line bank sharing salt 6 would refill each
    // other's bag on every alternating draw and the even-coverage guarantee would evaporate.
    const bagKey = `${salt}:${arr.length}`;
    let bag = this.cmBag[bagKey];
    if (!bag || bag.length === 0) {
      bag = arr.map((_, i) => i);
      for (let i = bag.length - 1; i > 0; i--) {           // seeded Fisher-Yates
        const j = this.cidx(i + 1, this.cmSeq++, salt);
        const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
      }
      // we deal from the END, so guard the seam: don't open a bag with the line that closed the last one
      if (bag.length > 1 && bag[bag.length - 1] === this.lastPick[bagKey]) {
        const t = bag[bag.length - 1]; bag[bag.length - 1] = bag[0]; bag[0] = t;
      }
      this.cmBag[bagKey] = bag;
    }
    const i = bag.pop()!;
    this.lastPick[bagKey] = i;
    return arr[i];
  }
  // running match context for narration (reset each match in startMatch)
  private liveScore: [number, number] = [0, 0];
  private scorerTally = new Map<string, number>();
  private lastGoalIdx = -1;
  private attackBeats: Array<{ t: 0 | 1; min: number }> = []; // rolling attacking moments for momentum
  private lastMomentumMin = -99;
  private lastAttackMin = 0;
  /** Live pressure bar: home share of the attacking beats in the last ~12 minutes. */
  private updatePressure(min: number) {
    const recent = this.attackBeats.filter((b) => min - b.min <= 12);
    const c0 = recent.filter((b) => b.t === 0).length, c1 = recent.filter((b) => b.t === 1).length, tot = c0 + c1;
    const hp = tot ? Math.round((c0 / tot) * 100) : 50;
    ($('pressure-home') as HTMLElement).style.width = `${hp}%`;
    $('pres-home-l').textContent = tot ? `${hp}%` : '';
    $('pres-away-l').textContent = tot ? `${100 - hp}%` : '';
  }
  /** Emit a "sustained pressure" note when one side dominates the attacking beats of the last ~10'. */
  private checkMomentum(min: number) {
    const recent = this.attackBeats.filter((b) => min - b.min <= 10);
    const c0 = recent.filter((b) => b.t === 0).length, c1 = recent.filter((b) => b.t === 1).length;
    const top = Math.max(c0, c1), lead: 0 | 1 = c0 >= c1 ? 0 : 1;
    if (top >= 4 && Math.abs(c0 - c1) >= 3 && min - this.lastMomentumMin >= 8) {
      this.lastMomentumMin = min;
      const team = lead === 0 ? this.homeName : this.awayName;
      this.appendLine(`<span class="cm-min">${min}'</span> <span class="cm-momentum">${this.cpick([`Wave after wave of pressure from ${team} now.`, `${team} are laying siege to this goal.`, `It's all ${team} — the other side can't get out.`, `${team} have really turned the screw here.`], min, 21)}</span>`, 'cm-momentum');
    }
  }
  /** Compose a goal line with running score, scorer tally (brace/hat-trick) and game-state framing. */
  private goalLine(e: MatchEvent, team: string, idx: number): string {
    this.liveScore[e.teamIdx]++;
    const us = this.liveScore[e.teamIdx], them = this.liveScore[1 - e.teamIdx];
    const raw = e.playerName ?? 'someone';
    const n = (this.scorerTally.get(raw) ?? 0) + 1; this.scorerTally.set(raw, n);
    const p = this.descriptor(raw);
    const pool = [`⚽ GOAL! ${p} buries it for ${team}!`, `⚽ IT’S IN! ${p} finishes it off — ${team}!`, `⚽ GOAL! What a strike from ${p}!`, `⚽ ${p} makes no mistake — ${team}!`, `⚽ GET IN! ${p} lashes it home!`, `⚽ Clinical from ${p} — ${team} find the net!`, `⚽ ${p} steals in — ${team} score!`, `⚽ Tucked away by ${p}!`];
    let bi = this.cidx(pool.length, idx, 1);
    if (bi === this.lastGoalIdx) bi = (bi + 1) % pool.length; // never the same phrasing twice running
    this.lastGoalIdx = bi;
    const note = (t: string) => ` <span class="cm-note">${t}</span>`;
    let tally = '';
    if (n === 2) tally = note('His second!');
    else if (n === 3) tally = note('HAT-TRICK!!');
    else if (n >= 4) tally = note(`That’s ${n} for him today!`);
    const diff = us - them, total = us + them, late = e.minute >= 80;
    let state = '';
    if (total === 1) state = note('The deadlock is broken.');
    else if (diff === 0) state = note(this.cpickNR(['Level again!', 'It’s all square!', 'Right back in it!', 'All square once more!', 'Back on terms!'], 9));
    else if (diff < 0) state = note(`A consolation for ${team}.`);
    else if (diff === 1 && late) state = note('This could be the winner!');
    else if (diff === 1) state = note(`${team} back in front.`);
    else if (diff >= 3) state = note('This is turning into a rout.');
    const score = ` <span class="cm-score">${this.liveScore[0]}–${this.liveScore[1]}</span>`;
    const assist = e.playerName2 ? ` <span class="cm-assist">🅰 ${e.playerName2}</span>` : '';
    return pool[bi] + score + tally + state + assist;
  }
  private playerAttrs = new Map<string, any>();
  private commentaryMode: 'full' | 'key' = 'full';
  // events hidden in "Key" mode — the running texture; the big moments always show
  private static MINOR = new Set(['pass', 'tackle_won', 'loose_ball', 'foul', 'free_kick', 'corner', 'fatigue']);
  private move: { teamIdx: 0 | 1; names: string[]; zone?: string } | null = null;
  private zoneWord(z?: string) { return z === 'att' ? 'in the final third' : z === 'def' ? 'deep in their own half' : 'in midfield'; }
  /** A stat-flavoured descriptor for a standout player (deterministic — their highest attribute). */
  private descriptor(name: string): string {
    const a = this.playerAttrs.get(name); if (!a) return name;
    const cand: Array<[number, string]> = [[a.pace ?? 0, 'lightning-quick'], [a.shooting ?? 0, 'sharp-shooting'], [a.strength ?? 0, 'powerful'], [a.passing ?? 0, 'classy'], [a.tackling ?? 0, 'combative'], [a.composure ?? 0, 'ice-cool'], [a.creativity ?? 0, 'inventive'], [a.leadership ?? 0, 'commanding']];
    const [top, adj] = cand.sort((x, y) => y[0] - x[0])[0];
    return top >= 14 ? `the ${adj} ${name}` : name; // only genuine standouts earn an epithet
  }
  private appendLine(html: string, cls = '') {
    const div = document.createElement('div');
    div.className = `cm-line ${cls}`;
    div.innerHTML = html;
    const feed = $('ticker');
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
  }
  /** Render the buffered passage of play (consecutive same-team passes) as one flowing line. */
  private flushMove() {
    const m = this.move; this.move = null;
    if (!m || m.names.length < 2) return;
    const team = m.teamIdx === 0 ? this.homeName : this.awayName;
    const uniq = m.names.filter((n, i) => n && n !== m.names[i - 1]); // collapse give-and-go repeats
    const touches = uniq.length;
    if (touches < 2) return;
    const seq = uniq.slice(-4); // show the last few touches of the chain
    const chain = seq.join(' → ');
    // a genuinely sustained sequence gets a "total control" framing; a short one stays low-key
    const lead = touches >= 7
      ? this.cpickNR([`${touches} passes and counting — `, `Wonderful patience, ${team} (${touches} touches): `, `Total control from ${team} — `,
        `${team} have settled into it (${touches} touches): `, `${touches} unanswered passes — `, `${team} pass it round the shirts: `,
        `A long spell of it now, ${team} — `], 7)
      : this.cpickNR([`${team} work it — `, `Neat from ${team}: `, `Patient build-up, ${team}: `, `${team} keep it: `,
        `${team} knock it about — `, `Tidy stuff from ${team}: `, `${team} take their time: `, `Worked nicely by ${team} — `,
        `${team} coming forward: `, `A move building for ${team} — `, `${team} in possession: `, `Simple and clean, ${team}: `,
        `${team} probing — `, `They shift it, ${team}: `, `${team} look to build: `, `Calmly done by ${team} — `,
        `${team} moving it on: `, `Nothing rushed from ${team}: `, `${team} work an angle — `, `Kept alive by ${team}: `], 7);
    this.appendLine(`<span class="cm-min"></span> <span class="cm-flow">${lead}${chain} ${this.zoneWord(m.zone)}.</span>`, 'cm-flow');
  }
  private pushTicker(e: MatchEvent) {
    const key = this.commentaryMode === 'key';
    // buffer consecutive same-team passes into a flowing "passage of play" (never shown in Key mode)
    if (e.type === 'pass') {
      if (key) return;
      if (this.move && this.move.teamIdx === e.teamIdx) { this.move.names.push(e.playerName2 ?? ''); this.move.zone = e.zone; }
      else { this.flushMove(); this.move = { teamIdx: e.teamIdx, names: [e.playerName ?? '', e.playerName2 ?? ''], zone: e.zone }; }
      return;
    }
    this.flushMove(); // any other event ends the passage
    // track attacking beats (for momentum) regardless of mode; the lull/momentum LINES are Full-only
    const ATTACK_TYPES = ['chance', 'shot_saved', 'shot_missed', 'goal', 'woodwork', 'corner', 'penalty'];
    if (ATTACK_TYPES.includes(e.type)) {
      if (!key && e.minute - this.lastAttackMin >= 10 && e.minute > 12) {
        this.appendLine(`<span class="cm-min">${e.minute}'</span> <span class="cm-lull">${this.cpick(['It had gone a bit flat — but here’s something.', 'The game needed a spark, and this might be it.', 'After a quiet spell, the tempo lifts again.'], e.minute, 22)}</span>`, 'cm-lull');
      }
      this.lastAttackMin = e.minute;
      this.attackBeats.push({ t: e.teamIdx, min: e.minute });
      this.updatePressure(e.minute);
    }
    // Key mode: drop the running texture, keep the big moments
    if (key && Game.MINOR.has(e.type)) return;
    const idx = this.eventsShown;
    const team = e.teamIdx === 0 ? this.homeName : this.awayName;
    const opp = e.teamIdx === 0 ? this.awayName : this.homeName;
    const p = this.descriptor(e.playerName ?? 'someone');
    const zone = this.zoneWord(e.zone);
    const min = `<span class="cm-min">${e.minute}'</span>`;
    const sc = this.liveScore; // running tally (correct in live AND skip-to-end flush)
    let text = '', cls = '';
    switch (e.type) {
      case 'kickoff': text = this.cpickNR(['We’re underway!', 'And the match kicks off!', 'Here we go — game on!', 'The referee gets us started!'], 5, 'kickoff', { p, team, zone }); break;
      case 'goal': cls = 'cm-goal'; text = this.goalLine(e, team, idx); break;
      case 'chance':
        cls = 'cm-chance';
        text = e.counter
          ? this.cpickNR([`They break at pace! ${p} is away for ${team}…`, `Counter-attack, ${team}! ${p} storms clear…`, `Caught square — ${p} springs the trap for ${team}…`, `On the turnover! ${p} races through…`], 2, 'chance', { p, team, zone })
          : this.cpickNR([`${p} works a yard and shapes to shoot…`, `Here come ${team} — ${p} bursts in behind!`, `Big chance! ${p} is in for ${team}…`, `${team} carve it open — ${p} with a sight of goal!`, `${p} shifts it onto his stronger foot…`, `A gap opens up and ${p} goes for it…`], 2, 'chance', { p, team, zone });
        if (e.counter) cls = 'cm-chance cm-counter';
        break;
      case 'shot_saved': cls = 'cm-save'; text = this.cpickNR([`🧤 SAVED! ${opp}’s keeper turns ${p} away!`, `🧤 Denied! A fine stop to keep ${p} out!`, `🧤 What a save — ${p} was sure he’d scored!`, `🧤 Beaten away! ${p} is foiled!`, `🧤 Big hands! ${opp} keep ${p} out!`], 3, 'shot_saved', { p, team, zone }); break;
      case 'shot_missed': cls = 'cm-miss'; text = this.cpickNR([`${p} drags it wide!`, `Off target — ${p} will want that one back.`, `${p} blazes over the bar!`, `Just past the post from ${p}!`, `Wild from ${p} — miles over!`], 4, 'shot_missed', { p, team, zone }); break;
      case 'tackle_won':
        if (e.zone === 'att') { // a turnover won high up the pitch — a pressing trap
          cls = 'cm-press';
          // The second-heaviest event in a match, and it held THREE lines: a live capture found these firing
          // 52/51/49 times in one game — 22% of the whole feed from three strings. (PT-1401)
          text = this.cpickNR([
            `⚡ Won high up! ${p} presses and steals it for ${team} — dangerous!`,
            `⚡ ${team} spring the press — ${p} robs him in the final third!`,
            `⚡ High turnover! ${p} nicks it right on the edge of the box!`,
            `⚡ ${p} closes him down and wins it back for ${team}.`,
            `⚡ Caught in possession — ${p} pounces.`,
            `⚡ ${team} hunt in packs, and ${p} comes away with it.`,
            `⚡ Dispossessed high up the pitch; ${p} has it.`,
            `⚡ ${p} reads the pass and steps in front of it.`,
            `⚡ No time on the ball — ${p} is all over him.`,
            `⚡ ${team} force the mistake, ${p} collects.`,
            `⚡ Turned over cheaply, and ${p} is away with it.`,
            `⚡ ${p} snaps into the challenge and wins it cleanly.`,
            `⚡ The press pays off for ${team} — ${p} has it in a dangerous spot.`,
            `⚡ ${p} harries him into giving it up.`], 6, 'tackle_won', { p, team, zone });
        } else {
          cls = 'cm-tackle';
          text = this.cpickNR([
            `🦵 ${p} wins it back for ${team} ${zone}.`,
            `🦵 Strong challenge — ${p} nicks it for ${team} ${zone}.`,
            `🦵 ${p} steps in and dispossesses the man ${zone}.`,
            `🦵 Turnover! ${p} robs him ${zone}.`,
            `🦵 Well timed from ${p} — he takes the ball cleanly ${zone}.`,
            `🦵 ${p} stands him up and wins the duel ${zone}.`,
            `🦵 Blocked off by ${p} ${zone}; ${team} have it.`,
            `🦵 ${p} slides in and comes away with it ${zone}.`,
            `🦵 A firm shoulder from ${p} and the ball is ${team}'s ${zone}.`,
            `🦵 ${p} jockeys him back and pinches it ${zone}.`,
            `🦵 Intercepted by ${p} ${zone} — read all the way.`,
            `🦵 ${p} refuses to be beaten ${zone} and wins it.`,
            `🦵 Beaten to it by ${p} ${zone}.`,
            `🦵 ${p} nips in front of his man ${zone}.`], 26, 'tackle_won', { p, team, zone });
        }
        break;
      case 'fatigue': cls = 'cm-injury'; text = this.cpickNR([`${p} is blowing hard — the legs are going.`, `${p} looks spent, hands on hips ${zone}.`, `Tiring badly now, ${p} — running on empty.`, `${p} can barely get back — gassed.`], 12, 'fatigue', { p, team, zone }); break;
      case 'woodwork': cls = 'cm-post'; text = this.cpickNR([`🪵 OFF THE POST! ${p} rattles the woodwork — so close!`, `🪵 OFF THE BAR! ${p} is inches away!`, `🪵 It cannons back off the upright — ${p} can't believe it!`], 13, 'woodwork', { p, team, zone }); break;
      // the heaviest bank in the game (~200 draws a match) — it was 4 lines, half of them without a player
      // name, so ~100 draws collapsed onto a handful of strings (PT-1201)
      case 'loose_ball': cls = 'cm-loose'; text = this.cpickNR([
        `The ball breaks loose ${zone}.`, `Cut out! ${p}'s pass is intercepted ${zone}.`,
        `Scrappy — it pinballs around ${zone}.`, `${p}'s ball is cut out ${zone}.`,
        `${p} loses it ${zone}.`, `A heavy touch from ${p} ${zone}.`, `It squirms away from ${p} ${zone}.`,
        `Half-cleared, and it drops ${zone}.`, `${p} can't keep hold of it ${zone}.`,
        `Neither of them wins it — loose ${zone}.`, `Ricochet ${zone}, nobody's ball.`,
        `${p} overhits it ${zone}.`, `A scramble ${zone}.`, `It breaks kindly ${zone}.`,
        `${p}'s touch lets him down ${zone}.`, `Bobbling around ${zone}.`,
        `Cleared, but only as far as ${zone}.`, `${p} stretches and can only poke it ${zone}.`], 8, 'loose_ball', { p, team, zone }); break;
      case 'foul': cls = 'cm-foul'; text = this.cpickNR([`Foul by ${p} ${zone}. Free kick ${team === this.homeName ? this.awayName : this.homeName}.`, `${p} catches his man — referee blows for the foul ${zone}.`, `Cynical from ${p} — that’s a free kick ${zone}.`, `${p} gives it away with a clumsy challenge ${zone}.`], 14, 'foul', { p, team, zone }); break;
      case 'yellow_card': { cls = 'cm-card yellow'; const yc = `<span class="ico-inline">${sprite('card')}</span>`;
        text = this.cpickNR([`${yc} Booked! ${p} goes into the book for that one.`, `${yc} Yellow card for ${p} — the ref had no choice.`, `${yc} ${p} is cautioned. He’ll have to be careful now.`], 15, 'yellow_card', { p, team, zone }); break; }
      case 'red_card': { cls = 'cm-card red'; const rc = `<span class="ico-inline">${sprite('card-red')}</span>`;
        text = e.zone === 'mid'
          ? this.cpickNR([`${rc} SECOND YELLOW — ${p} is OFF! ${team} down to ten!`, `${rc} Two yellows and gone! ${p} takes the long walk — ${team} a man light!`], 16, 'red_card', { p, team, zone })
          : this.cpickNR([`${rc} RED CARD! ${p} is sent off — ${team} down to ten men!`, `${rc} Straight red for ${p}! A moment of madness — ${team} are down to ten!`, `${rc} He’s off! ${p} sees red and ${team} must dig in with ten!`], 16, 'red_card', { p, team, zone }); break; }
      case 'free_kick': cls = 'cm-freekick'; text = this.cpickNR([`Dangerous free kick for ${team} — ${p} stands over it…`, `${p} lines up the free kick in a promising spot…`, `Chance from the set piece — ${p} to deliver for ${team}…`,
        `${team} have a free kick in a dangerous area; ${p} is over it.`, `The wall goes up as ${p} measures his run…`,
        `Inviting position for ${team} — ${p} eyes the near post.`, `${p} stands with his hands on hips, waiting for the whistle…`,
        `A yard outside the box, and ${p} fancies it himself.`], 17, 'free_kick', { p, team, zone }); break;
      case 'penalty': cls = 'cm-pen'; text = this.cpickNR([`⚠️ PENALTY to ${team}! ${p} will take it…`, `⚠️ The ref points to the spot — penalty ${team}! ${p} steps up…`, `⚠️ Spot kick for ${team}! It’s down to ${p}…`], 18, 'penalty', { p, team, zone }); break;
      case 'penalty_missed': cls = 'cm-miss'; text = this.cpickNR([`❌ MISSED! ${p} sends the penalty wide — what a let-off!`, `❌ Saved! The keeper guesses right and denies ${p} from the spot!`, `❌ ${p} blazes the penalty over! He’ll never forget that.`], 19, 'penalty_missed', { p, team, zone }); break;
      case 'corner': cls = 'cm-corner'; text = this.cpickNR([`Corner to ${team} — ${p} to swing it in…`, `${p} jogs over to take the corner for ${team}…`,
        `${team} win a corner; ${p} will take it.`, `Out for a corner — ${p} places the ball on the quadrant.`,
        `Another set piece for ${team}, ${p} over it.`, `${p} waves them forward before he takes it.`,
        `Corner ${team}. The big men are coming up.`, `${p} signals short, and thinks better of it.`,
        `Deep corner coming in from ${p}.`, `${p} takes his time over the corner — ${team} loading the box.`], 20, 'corner', { p, team, zone }); break;
      case 'injury': cls = 'cm-injury'; text = this.cpickNR([`🚑 ${p} is down and hurt — he can’t continue for ${team}.`, `🚑 Trouble for ${team} — ${p} has pulled up injured.`, `🚑 ${p} signals to the bench; that’s him done for the day.`,
        `🚑 ${p} goes down untouched — that never looks good.`, `🚑 The physio is on for ${p}, and shaking his head.`,
        `🚑 ${p} tries to run it off and can't; ${team} will have to change it.`], 23, 'injury', { p, team, zone }); break;
      case 'sub': { const off = e.playerName2 ?? 'a teammate'; cls = 'cm-sub'; text = this.cpickNR([`🔄 Change for ${team}: ${e.playerName} comes on for ${off}.`, `🔄 ${team} go to the bench — ${e.playerName} replaces ${off}.`, `🔄 Fresh legs for ${team}: ${off} off, ${e.playerName} on.`,
        `🔄 ${off} makes way; ${e.playerName} is on for ${team}.`, `🔄 The board goes up — ${e.playerName} for ${off}.`,
        `🔄 ${team} change it: ${e.playerName} replaces a tiring ${off}.`, `🔄 ${off} gets a hand from the crowd as ${e.playerName} comes on.`,
        `🔄 A roll of the dice from ${team} — ${e.playerName} on for ${off}.`], 24, 'sub', { p, team, zone, off, name: e.playerName }); break; }
      case 'halftime': cls = 'cm-break'; text = `⏸ Half-time. ${this.homeName} ${sc[0]}–${sc[1]} ${this.awayName}.`; break;
      case 'fulltime': cls = 'cm-break'; text = `🏁 Full-time! ${this.homeName} ${sc[0]}–${sc[1]} ${this.awayName}.`; break;
    }
    if (e.type === 'goal' && !this.silent) this.celebrateGoal(e);
    this.appendLine(`${min} ${text}`, cls);
    if (e.type === 'goal') ($('ticker').lastElementChild as HTMLElement)?.classList.add('flash');
    if (!key && ATTACK_TYPES.includes(e.type)) this.checkMomentum(e.minute);
  }

  private celebrateGoal(e: MatchEvent) {
    const el = $('goal-flash');
    el.textContent = `⚽ GOAL!  ${e.teamIdx === 0 ? this.homeName : this.awayName}`;
    el.classList.remove('show');
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('show');
  }
}

GAME = new Game();
GAME.boot();

// The match is simulated by the headless deterministic engine and presented as live text
// commentary + HUD. The per-frame match tick loop used to be driven by the 2D render
// scene's `update(t, deltaMs)`; with the 2D pitch removed we drive it here with a plain
// requestAnimationFrame loop, feeding the frame delta into GAME.onFrame — which advances
// the engine over real time (respecting the 1x/4x/12x speed + pause), streams events into
// the commentary feed and updates the running score/clock/possession/pressure. Skip-to-
// full-time and the post-match report card are handled inside GAME independently of this loop.
let lastFrameMs = performance.now();
/** One tick. `maxStep` clamps the delta so a stalled tab can't fast-forward the sim in one giant step. */
function matchStep(now: number, maxStep: number) {
  const dMs = Math.min(now - lastFrameMs, maxStep);
  lastFrameMs = now;
  GAME.onFrame(dMs);
}
function matchFrame(now: number) {
  matchStep(now, 100);
  requestAnimationFrame(matchFrame);
}
requestAnimationFrame(matchFrame);
// requestAnimationFrame does not fire at all in a hidden tab, and this clock is the sim's TIME SOURCE,
// not just a display — so a match left in a background tab froze mid-game and resumed from the same
// minute. Keep it ticking on a timer while hidden. Browsers throttle background timers to roughly 1s,
// so the step ceiling is raised to match: it advances at about the same rate rather than 10x slower.
// (PT-1409)
let hiddenTick: ReturnType<typeof setInterval> | undefined;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    lastFrameMs = performance.now();
    hiddenTick ??= setInterval(() => matchStep(performance.now(), 1000), 200);
  } else if (hiddenTick !== undefined) {
    clearInterval(hiddenTick); hiddenTick = undefined;
    lastFrameMs = performance.now();   // don't bill the sim for time already ticked
  }
});
