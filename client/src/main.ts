import {
  MatchEngine, autoPickXI, buildXI, overall, TICK_SEC, defaultDuty, DUTY_LABEL, DUTIES_BY_ROLE, isDutyForRole,
  TACTIC_PRESETS, type Tactics, type Formation, type MatchEvent, type Team, type Club, type Lineup, type Player, type Duty,
} from '@fm/shared';
import { api, hasToken, setToken, clearToken, type Account, type StandingOrders, type MatchPayload, type TableRow, type ResultRow, type HonourRow, type Scout, type Trialist, type MarketListing, type CupData, type MissionsData, type ContractInfo, type LeaderStat, type AwardRow } from './api';

// icons for the stage-aware life meters (keyed by underlying relationship) — used in focus effect labels
const METER_ICON: Record<string, string> = { authority: '🧑‍🏫', peers: '👥', family: '🏠', school: '🎒', agent: '🤝', fans: '📣', sponsors: '📸', partner: '❤️' };

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

const LEVELS: Record<keyof Omit<Tactics, 'formation'>, string[]> = {
  mentality: ['Very Defensive', 'Defensive', 'Balanced', 'Attacking', 'Very Attacking'],
  line: ['Very Deep', 'Deep', 'Normal', 'High', 'Very High'],
  press: ['Contain', 'Low', 'Balanced', 'High', 'Gegenpress'],
  tempo: ['Very Patient', 'Patient', 'Balanced', 'Direct', 'Very Direct'],
  width: ['Very Narrow', 'Narrow', 'Balanced', 'Wide', 'Very Wide'],
};
const FORMATIONS: Formation[] = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '3-4-3', '4-1-2-1-2', '5-3-2', '4-5-1'];
const SLOT_ROLES: Record<Formation, string[]> = {
  '4-4-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
  '4-3-3': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
  '3-5-2': ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
  '4-2-3-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW'],
  '3-4-3': ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
  '4-1-2-1-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
  '5-3-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW'],
  '4-5-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW'],
};

const $ = (id: string) => document.getElementById(id)!;

// Brief retro toast near top-centre; the CSS animation fades it out after ~2s.
function toast(msg: string) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('show');
  void el.offsetWidth; // restart the animation if a toast is already showing
  el.classList.add('show');
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

const ORDINAL = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// League pyramid, bottom → top. Mirrors TIERS in server/seasons.ts; the INDEX (0-9)
// drives how flashy a trophy looks — a Sunday-League cup is humble, a World-Class one gleams.
const TIER_NAMES = [
  'SUNDAY LEAGUE', 'COUNTY', 'REGIONAL', 'NATIONAL', 'LEAGUE TWO',
  'LEAGUE ONE', 'CHAMPIONSHIP', 'PREMIER', 'CONTINENTAL', 'WORLD CLASS',
];
const tierIndexOf = (tier: string): number => Math.max(0, TIER_NAMES.indexOf(tier));
// Five visual grades mapped across the 10 tiers (reuses the NFT tier feel).
const TROPHY_GRADES = ['bronze', 'silver', 'gold', 'diamond', 'legend'] as const;
const trophyGrade = (tierIdx: number): typeof TROPHY_GRADES[number] => TROPHY_GRADES[Math.min(4, Math.floor(tierIdx / 2))];

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

// Sort state for the full-squad-stats table. `null` = default role grouping.
type SquadSort = { key: string; dir: 'asc' | 'desc' };
const ROLE_ORDER: Record<string, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };

function statsTableHTML(players: Player[], highlight?: Set<string>, sort?: SquadSort | null): string {
  const cols: Array<[string, keyof Player['attrs']]> = [
    ['PAC', 'pace'], ['STR', 'strength'], ['PAS', 'passing'], ['SHO', 'shooting'],
    ['TAK', 'tackling'], ['POS', 'positioning'], ['WRK', 'workrate'], ['KEE', 'keeping'],
    ['SET', 'setPiece'], ['STA', 'stamina'],
  ];
  // Value a row contributes to a given sort key (number for stats, string for name).
  const sortVal = (p: Player, key: string): number | string => {
    if (key === 'pos') return ROLE_ORDER[p.role];
    if (key === 'name') return p.name.toLowerCase();
    if (key === 'ovr') return overall(p);
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
  const th = (label: string, key: string, style = '') =>
    `<th class="sortable" data-sort="${key}"${style ? ` style="${style}"` : ''}>${label}${arrow(key)}</th>`;
  const head = `<tr><th></th>${th('Pos', 'pos')}${th('Name', 'name', 'text-align:left')}${th('OVR', 'ovr')}${cols.map(([l, k]) => th(l, k)).join('')}</tr>`;
  const rows = sorted.map((p) => {
    const on = !!highlight?.has(p.id);
    const nft = isNftId(p.id);
    const tier = nft ? nftTier(overall(p)) : null;
    const cells = cols.map(([, k]) => `<td class="stat" style="background:${statColor(p.attrs[k] ?? 0)}">${Math.round(p.attrs[k] ?? 0)}</td>`).join('');
    const mark = on ? '<td class="inxi-mark">●</td>' : '<td></td>';
    const nameCell = tier
      ? `<td class="name nft-name tier-${tier.key}" data-card="${p.id}" title="Owned NFT · ${tier.name} — click to view card">${tier.icon} ${p.name}</td>`
      : `<td class="name">${p.name}</td>`;
    return `<tr class="${on ? 'inxi' : ''}${nft ? ' nft-row' : ''}">${mark}<td class="pos role-${p.role}">${p.role}</td>${nameCell}<td class="stat" style="background:${statColor(overall(p))}">${overall(p)}</td>${cells}</tr>`;
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
  pendingOpp?: { id: string; handle: string; venue: 'home' | 'away' };
  mySide: 0 | 1 = 0;   // which team index (0 home / 1 away) is the player in the current match
  homeName = '';
  awayName = '';

  async boot() {
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
    const saves = this.loadSaves().sort((a, b) => b.lastPlayed - a.lastPlayed);
    $('mm-buttons').classList.remove('hidden');
    $('mm-newgame').classList.add('hidden');
    $('mm-continue').classList.toggle('hidden', saves.length === 0);
    $('login-error').textContent = '';
    $('mm-saves').innerHTML = saves.length
      ? `<div class="mm-saves-lbl">Your saves</div>` + saves.map((s) => `<div class="mm-save" data-id="${s.id}"><span class="mm-save-name">${s.name}</span><span class="mm-save-meta">${new Date(s.lastPlayed).toLocaleDateString()}</span><button class="mm-save-del" data-del="${s.id}" title="Delete save">✕</button></div>`).join('')
      : '';
    $('mm-saves').querySelectorAll('.mm-save').forEach((el) => el.addEventListener('click', (e) => { if ((e.target as HTMLElement).dataset.del) return; this.loadSave((el as HTMLElement).dataset.id!); }));
    $('mm-saves').querySelectorAll('.mm-save-del').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); this.deleteSave((el as HTMLElement).dataset.del!); }));
  }

  private continueGame() { const s = this.loadSaves().sort((a, b) => b.lastPlayed - a.lastPlayed)[0]; if (s) this.loadSave(s.id); }

  private async loadSave(id: string) {
    const saves = this.loadSaves(); const save = saves.find((s) => s.id === id); if (!save) return;
    setToken(save.token);
    try { this.setMe(await api.me()); save.lastPlayed = Date.now(); this.saveSaves(saves); await this.showHub(); }
    catch { $('login-error').textContent = 'Could not load that save (is the game server running?).'; clearToken(); }
  }

  private deleteSave(id: string) { this.saveSaves(this.loadSaves().filter((s) => s.id !== id)); this.renderMainMenu(); }

  /** New Game: silently create a local profile (no handle/password shown) and drop the player in. */
  private async startNewGame(rawName: string) {
    const name = rawName.trim() || 'My Club';
    const handle = ((name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'club') + '-' + Math.random().toString(36).slice(2, 6)).toLowerCase();
    const password = Math.random().toString(36).slice(2) + 'Aa1'; // random; the player never sees or types it
    $('login-error').textContent = 'Creating your club…';
    try {
      const r = await api.register(handle, password, name);
      setToken(r.token);
      this.setMe({ account: r.account, club: r.club, standingOrders: r.standingOrders });
      const saves = this.loadSaves(); saves.push({ id: handle, token: r.token, name, lastPlayed: Date.now() }); this.saveSaves(saves);
      this.onboarding = true; // lead a new player straight to their first prospect (the unique hook)
      this.showAcademy();
    } catch { $('login-error').textContent = 'Could not create your club. Is the game server running?'; }
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

  private showScreen(s: 'login' | 'hub' | 'lineup' | 'match' | 'standings' | 'scouting' | 'market' | 'club' | 'academy' | 'trophies') {
    for (const id of ['login', 'hub', 'lineup', 'matchwrap', 'standings', 'scouting', 'market', 'club', 'academy', 'trophies']) $(id).classList.toggle('hidden', id !== (s === 'match' ? 'matchwrap' : s));
    $('logout').classList.toggle('hidden', s === 'login');
    $('app-title').classList.toggle('hidden', s === 'login'); // menu shows the big title already — no duplicate brand
    $('app-title').classList.toggle('clickable', s !== 'login'); // title is "home" once you're in
    if (s !== 'scouting' && this.missionTimer) { clearInterval(this.missionTimer); this.missionTimer = null; } // stop the mission countdown when leaving
  }

  private wireStaticButtons() {
    const setSpeed = (v: number, id: string) => { this.speed = v; ['spd1', 'spd4', 'spd12'].forEach((b) => $(b).classList.remove('active')); $(id).classList.add('active'); };
    $('spd1').addEventListener('click', () => setSpeed(1, 'spd1'));
    $('spd4').addEventListener('click', () => setSpeed(4, 'spd4'));
    $('spd12').addEventListener('click', () => setSpeed(12, 'spd12'));
    $('toggle-density').addEventListener('click', () => {
      this.commentaryMode = this.commentaryMode === 'full' ? 'key' : 'full';
      $('toggle-density').textContent = this.commentaryMode === 'full' ? '🎙️ Full' : '🎙️ Key';
      $('toggle-density').classList.toggle('on', this.commentaryMode === 'key');
    });
    $('mm-new').addEventListener('click', () => { $('mm-buttons').classList.add('hidden'); $('mm-saves').classList.add('hidden'); $('mm-newgame').classList.remove('hidden'); ($('mm-name') as HTMLInputElement).focus(); });
    $('mm-cancel').addEventListener('click', () => { $('mm-saves').classList.remove('hidden'); this.renderMainMenu(); });
    $('mm-start').addEventListener('click', () => this.startNewGame(($('mm-name') as HTMLInputElement).value));
    $('mm-name').addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') this.startNewGame(($('mm-name') as HTMLInputElement).value); });
    $('mm-continue').addEventListener('click', () => this.continueGame());
    $('logout').addEventListener('click', () => { $('mm-saves').classList.remove('hidden'); this.showScreen('login'); this.renderMainMenu(); }); // single-player: "quit to menu" keeps the save
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
    // manager screens (standings/scouting/market/club) keep their own back→home handlers, but the
    // forward entries are NOT wired from the home: the game is one linear life, not parallel menus.
    $('standings-back').addEventListener('click', () => this.showHub());
    $('scouting-back').addEventListener('click', () => this.showHub());
    $('view-trophies').addEventListener('click', () => this.showTrophyRoom());
    $('trophies-back').addEventListener('click', () => this.showHub());
    // unified home: one Club & Dynasty hub, no mode wall
    $('hub-academy').addEventListener('click', () => this.showAcademy());
    $('app-title').addEventListener('click', () => { if (hasToken()) void this.showHub(); });
    $('academy-back').addEventListener('click', () => this.showHub());
    $('market-back').addEventListener('click', () => this.showHub());
    $('club-back').addEventListener('click', () => this.showHub());
    $('sell-btn').addEventListener('click', () => this.sellPlayer());
    const showTab = (tab: 'results' | 'leaders' | 'cup' | 'honours') => {
      $('results-feed').classList.toggle('hidden', tab !== 'results');
      $('leaders-feed').classList.toggle('hidden', tab !== 'leaders');
      $('cup-feed').classList.toggle('hidden', tab !== 'cup');
      $('honours-feed').classList.toggle('hidden', tab !== 'honours');
      $('tab-results').classList.toggle('active', tab === 'results');
      $('tab-leaders').classList.toggle('active', tab === 'leaders');
      $('tab-cup').classList.toggle('active', tab === 'cup');
      $('tab-honours').classList.toggle('active', tab === 'honours');
      if (tab === 'cup') void this.loadCup();
      if (tab === 'leaders') void this.loadLeaders();
    };
    $('tab-results').addEventListener('click', () => showTab('results'));
    $('tab-leaders').addEventListener('click', () => showTab('leaders'));
    $('tab-cup').addEventListener('click', () => showTab('cup'));
    $('tab-honours').addEventListener('click', () => showTab('honours'));
    $('skip').addEventListener('click', () => this.skipToEnd());
    // ('set-team' lives in the manager layer, unlinked from the home for now — see linear-life note in showHub)
    $('autopick').addEventListener('click', () => { this.draftLineup = autoPickXI(this.availableClub(), this.draftTactics.formation); this.rebuildDuties(); this.renderLineupEditor(); });
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
    const stats = order.map(([k, l]) => `<div class="pc-stat"><span>${l}</span><b style="color:${statColor(p.attrs[k] ?? 0)}">${Math.round(p.attrs[k] ?? 0)}</b></div>`).join('');
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
    const stakeHtml = ci && !ci.retired ? (ci.staked
      ? `<div class="pc-stake">🔒 staked ${ci.stakedSeasons} season${ci.stakedSeasons === 1 ? '' : 's'} — loyalty discount · <a class="pc-link" data-stake="off" data-pid="${p.id}">unstake</a></div>`
      : `<div class="pc-stake">⭘ not staked — <a class="pc-link" data-stake="on" data-pid="${p.id}">stake to make eligible</a></div>`) : '';
    let contractHtml = '';
    if (ci && ci.retired) { // retired → a legacy keepsake + the chance to breed the next generation
      const lg = ci.legend;
      contractHtml = `<div class="pc-contract retired">`
        + `<div class="pc-crow"><span>Age ${ci.age} · Retired</span><span>${lg?.icon ?? '🏅'} ${lg?.tier ?? 'Legend'}</span></div>`
        + (lg ? `<div class="pc-legend">Legend rating ${lg.legendRating} · ${lg.leagueTitles}🏅 ${lg.cupTitles}🏆 · ${lg.apps} apps · ${lg.seasons} seasons</div>` : '')
        + `<div class="pc-cactions">${ci.rebornId ? '<span class="pc-sell">bloodline continued ✓</span>' : `<button class="pc-reborn" data-reborn="${p.id}">✦ Reborn — breed the next generation · 150c</button>`}</div>`
        + (lg?.note ? `<div class="pc-stake">${lg.note}</div>` : '') + `</div>`;
    } else if (ci) {
      contractHtml = `<div class="pc-contract${ci.available ? '' : ' lapsed'}">`
        + `<div class="pc-crow"><span>Age ${ci.age}${ci.age >= 39 ? ' · nearing retirement' : ''}</span>`
        + `<span>${ci.available ? `📜 ${ci.seasonsLeft} season${ci.seasonsLeft === 1 ? '' : 's'} left` : ci.staked === false ? '⭘ idle — not staked' : '⛔ contract lapsed — benched'}</span></div>`
        + (ci.morale != null ? `<div class="pc-morale"><i>morale</i><span class="pc-mbg"><b style="width:${ci.morale}%"></b></span><span>${ci.moraleLabel}</span></div>` : '')
        + `<div class="pc-cactions"><button class="pc-extend" data-extend="${p.id}">${ci.available ? 'Re-sign' : 'Extend'} · ${ci.extendCost}c · ${ci.lengthSeasons}y</button>`
        + `<span class="pc-sell">or sell ~${ci.sellValue}c</span></div>` + stakeHtml + `</div>`;
    }
    const el = document.createElement('div');
    el.id = 'player-card-ov';
    el.innerHTML =
      `<div class="pc-card tier-${tier.key}">`
      + ring + '<div class="pc-burst"></div>' + sparks
      + (minted ? `<div class="pc-flash">${tier.icon} TURNED PRO · ${tier.name}</div>` : '')
      + `<div class="pc-top"><div class="pc-ovr">${overall(p)}<span>OVR</span></div>`
      + `<div class="pc-tier">${tier.icon}<span>${tier.name}</span></div></div>`
      + `<div class="pc-crest role-${p.role}"><span class="pc-crest-role">${p.role}</span></div>`
      + `<div class="pc-name">${p.name}</div>`
      + `<div class="pc-role">${roleName[p.role] ?? p.role}</div>`
      + `<div class="pc-stats">${stats}</div>`
      + this.careerRecordHtml(p)
      + this.characterHtml(p)
      + contractHtml
      + `<div class="pc-foot">★ ${tier.name}${tokenId ? ` · #${tokenId}` : ''}</div>`
      + `<button class="pc-close">${minted ? 'Nice ✓' : 'Close'}</button></div>`;
    el.addEventListener('click', async (e) => {
      const t = e.target as HTMLElement;
      if (t.dataset.extend) { await this.extendPlayer(t.dataset.extend); el.remove(); return; }
      if (t.dataset.reborn) { el.remove(); await this.rebornPlayer(t.dataset.reborn); return; }
      if (t.dataset.stake) { el.remove(); await this.stakePlayer(t.dataset.pid!, t.dataset.stake === 'on'); return; }
      if (t === el || t.classList.contains('pc-close')) el.remove();
    });
    document.body.appendChild(el);
  }

  /** Breed a retired legend's next generation — a 10-year-old PROSPECT that re-enters the Career game. */
  private async rebornPlayer(playerId: string) {
    try {
      const r = await api.reborn(playerId);
      this.setMe(await api.me());
      await this.showHub();
      toast(`✦ Next generation bred (−${r.cost}c)`);
      this.showProspectCard(r.prospect, true);
    } catch (err: any) {
      toast(err?.body?.error === 'already reborn' ? 'Bloodline already continued' : err?.body?.error === 'not enough coins' ? `Not enough coins (need ${err.body.need})` : (err?.body?.error ?? 'Reborn failed'));
    }
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
      + `<div class="pc-crest role-${p.roleHint}"><span class="pc-crest-role">${p.roleHint}</span></div>`
      + `<div class="pc-name">${p.name}</div><div class="pc-role">Youth Prospect${gen ? ` · gen ${gen}` : ''}</div>`
      + (born ? `<div class="pc-flash">${isGenesis ? '🌱 A NEW BLOODLINE BEGINS' : `🌳 THE ${surname.toUpperCase()} NAME LIVES ON`}</div>` : '')
      + `<div class="pc-contract retired"><div class="pc-legend">Potential ${stars} · pedigree ${(p.pedigree * 100 | 0)}%</div>`
      + (gen ? `<div class="pc-stake">Generation ${gen} of the bloodline — a fresh 10-year-old carrying the family name into a whole new career.</div>` : '')
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
      const status = ci.retired ? `<span class="ns-tag retired">retired</span>`
        : ci.staked === false ? `<span class="ns-tag idle">idle</span>`
        : ci.available ? `<span class="ns-tag ${ci.seasonsLeft <= 1 ? 'warn' : 'ok'}">${ci.seasonsLeft}y left</span>`
        : `<span class="ns-tag lapsed">lapsed</span>`;
      const dot = ci.morale != null ? `<span class="ns-mood" title="morale: ${ci.moraleLabel}" style="background:${ci.morale >= 75 ? '#6ad06a' : ci.morale >= 45 ? '#e0c14a' : '#d06a6a'}"></span>` : '';
      const act = ci.retired ? `<button class="ns-act" data-nreborn="${ci.playerId}">Reborn 150c</button>`
        : ci.staked === false ? `<button class="ns-act" data-nstake="${ci.playerId}">Stake</button>`
        : `<button class="ns-act" data-nextend="${ci.playerId}">${ci.available ? 'Re-sign' : 'Extend'} ${ci.extendCost}c</button>`;
      return `<div class="ns-row" data-open="${ci.playerId}"><span class="ns-name">${dot}${name}</span><span class="ns-age">${ci.age}y</span>${status}${act}</div>`;
    }).join('');
    return `<div class="nft-status"><div class="ns-head">⭐ YOUR STARS — lifecycle at a glance</div>${rows}</div>`;
  }

  /** Stake / unstake a pro token (staked = eligible to play + earns loyalty tenure). */
  private async stakePlayer(playerId: string, on: boolean) {
    try {
      await api.stake(playerId, on);
      toast(on ? 'Staked — eligible to play' : 'Unstaked — now idle');
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
    if (!pers && !traits.length && greed == null) return ''; // base players have no character layer
    const PERS: Record<string, string> = { pro: 'Model Pro', biggame: 'Big-Game Player', fragile: 'Fragile', leader: 'Born Leader', workhorse: 'Workhorse', mercurial: 'Mercurial', maverick: 'Maverick' };
    const TRAIT: Record<string, string> = { clinical: 'Clinical Finisher', ballwinner: 'Ball-Winner', metronome: 'Metronome', maestro: 'Creative Maestro', leader: 'Born Leader', livewire: 'Livewire', ironman: 'Iron Man', deadball: 'Dead-Ball Spec.', wall: 'The Wall', biggame: 'Big-Game', engine: 'Box-to-Box Engine', rock: 'Defensive Rock', spark: 'The Spark', injury_prone: 'Injury-Prone', mercenary: 'Mercenary', loyal: 'One-Club Man', marketable: 'Marketable' };
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
  private async extendPlayer(playerId: string) {
    try {
      const r = await api.extendContract(playerId);
      toast(`Re-signed · −${(this.contracts[playerId]?.extendCost ?? 0)}c · ${r.contract.lengthSeasons}-season deal`);
      this.setMe(await api.me());
      await this.showHub();
      const p = this.club.players.find((x) => x.id === playerId);
      if (p) this.showPlayerCard(p);
    } catch (err: any) {
      toast(err?.body?.error === 'not enough coins' ? `Not enough coins (need ${err.body.need})` : (err?.body?.error ?? 'Extend failed'));
    }
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
      const { entry } = await api.diary();
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
      + `</div><div class="pc-foot">earned across your whole managerial career</div>`
      + `<button class="pc-close">Close</button></div>`;
    el.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t === el || t.classList.contains('pc-close')) el.remove(); });
    document.body.appendChild(el);
  }

  // ---- hub ----
  private async showHub() {
    this.showScreen('hub');
    $('me-name').textContent = this.club.name;
    $('me-rating').textContent = `RATING ${this.account.rating}`;
    if (this.account.coins != null) $('me-coins').textContent = `💰 ${this.account.coins}`;
    void this.refreshPrestige();
    void this.refreshDiary();
    void this.refreshHubPlayer();
    void this.refreshHubLegacy();
  }

  // NOTE: the manager season/fixtures loop (api.fixtures/this.play) is intentionally NOT surfaced on the
  // home. The game is one LINEAR life — you live the bloodline player's career; running the club is a
  // later stage of that same timeline, not a parallel menu. Phase 2 fuses club matches into the player's
  // own season. The manager screens (standings/club/market/scouting) remain in code, unlinked, until then.

  /** The "Your Player" block on the home hub — the bloodline you're living, inline with a develop/continue CTA. */
  private async refreshHubPlayer() {
    const el = $('hub-player');
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
      const gen = active.generation ? ` · gen ${active.generation}` : '';
      const more = prospects.length > 1 ? `<div class="hp-meta" style="margin-top:6px;">+${prospects.length - 1} more in the academy</div>` : '';
      el.innerHTML = `<div class="hub-prow"><div class="hp-main"><div class="hp-name">🌱 ${active.name} <span class="hp-stars">${stars}</span></div>`
        + `<div class="hp-meta">${active.roleHint}${gen} · pedigree ${(active.pedigree * 100) | 0}% ${active.careerStarted ? '· in development' : '· age 10, ready to develop'}</div>${more}</div>`
        + `<button class="primary hp-go" data-dev="${active.id}">${active.careerStarted ? 'Continue his story' : 'Develop'} →</button></div>`;
      el.querySelector('[data-dev]')!.addEventListener('click', () => this.openCareer(active.id));
    } catch { el.innerHTML = '<div class="muted">Could not load your player — is the server running?</div>'; }
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

  // ---- standings / results page ----
  private async showStandings() {
    this.showScreen('standings');
    $('standings-table').innerHTML = SPINNER;
    $('results-feed').innerHTML = '';
    $('honours-feed').innerHTML = '';
    try {
      const [st, res, hon, aw] = await Promise.all([api.standings(), api.results(), api.honours(), api.awards()]);
      $('season-banner').innerHTML = `<b>${st.tier}</b> · Pod ${st.pod + 1} · Season ${st.season.number} · ends in ${humanizeMs(st.season.endsAt - Date.now())}`;
      $('standings-table').innerHTML = this.renderLeagueTable(st.table, { promote: st.promote, relegate: st.relegate });
      $('results-feed').innerHTML = this.renderResults(res.results);
      $('honours-feed').innerHTML = this.renderAwards(aw.awards) + this.renderHonours(hon.honours);
    } catch {
      $('season-banner').textContent = '';
      $('standings-table').innerHTML = '<div class="muted">Could not load — is the server running?</div>';
    }
  }

  private renderAwards(rows: AwardRow[]): string {
    if (!rows.length) return '';
    const META: Record<string, { icon: string; name: string; unit: string }> = {
      golden_boot: { icon: '🥇', name: 'Golden Boot', unit: 'goals' },
      playmaker: { icon: '🅰', name: 'Playmaker', unit: 'assists' },
      league_best: { icon: '🏅', name: 'League Best Player', unit: '★ POTM' },
    };
    const cards = rows.map((a) => {
      const m = META[a.kind] ?? { icon: '🏆', name: a.kind, unit: '' };
      return `<div class="aw-card"><span class="aw-icon">${m.icon}</span><div class="aw-body">`
        + `<div class="aw-name">${m.name}</div>`
        + `<div class="aw-player">${a.player_name}</div>`
        + `<div class="aw-meta">S${a.season_number} · ${a.tier} · ${a.value} ${m.unit}</div></div></div>`;
    }).join('');
    return `<div class="aw-title">★ Individual Awards</div><div class="aw-grid">${cards}</div>`;
  }
  private renderHonours(rows: HonourRow[]): string {
    if (!rows.length) return '<div class="muted">No finished seasons yet — play on to make history.</div>';
    const trophies = rows.filter((h) => h.title === 1);
    const cabinet = this.renderTrophyCabinet(trophies);
    // Full placement history below the cabinet (every archived finish, trophy or not).
    const history = rows.map((h) => {
      const champ = h.title === 1;
      const isCup = h.kind === 'cup';
      const prize = h.coin_reward ? `<span class="hr-prize">💰 ${h.coin_reward}</span>` : '';
      const label = champ ? (isCup ? 'CUP WINNERS' : 'CHAMPIONS') : `${ORDINAL(h.final_pos)} place`;
      const medal = champ ? (isCup ? '🏆' : '🥇') : ORDINAL(h.final_pos);
      return `<div class="honour-row${champ ? ' champ' : ''}">`
        + `<span class="hr-medal">${medal}</span>`
        + `<span class="hr-main"><b>Season ${h.season_number}</b> · ${h.tier}${isCup ? ' · Cup' : ''}</span>`
        + `<span class="hr-fin">${label}</span>${prize}</div>`;
    }).join('');
    return cabinet + `<div class="honour-history-title">Full record</div>` + history;
  }

  /** Trophy Cabinet — one gleaming trophy per championship (league title or cup win),
   *  its shine escalating with the league tier it was won at. */
  private renderTrophyCabinet(trophies: HonourRow[]): string {
    if (!trophies.length) {
      return '<div class="trophy-cabinet empty"><div class="tc-shelf"></div>'
        + '<div class="muted tc-empty">Your cabinet is bare. Win your pod\'s league or lift the Pod Cup to fill these shelves — the higher the division, the more your silverware gleams.</div></div>';
    }
    // Grouped onto shelves of up to 4 trophies each (newest first).
    const cards = trophies.map((h) => this.trophyCardHtml(h));
    const shelves: string[] = [];
    for (let i = 0; i < cards.length; i += 4) {
      shelves.push(`<div class="tc-row">${cards.slice(i, i + 4).join('')}</div><div class="tc-shelf"></div>`);
    }
    const count = trophies.length;
    return `<div class="trophy-cabinet"><div class="tc-header">🏆 Trophy Cabinet <span class="tc-count">${count} ${count === 1 ? 'trophy' : 'trophies'}</span></div>${shelves.join('')}</div>`;
  }

  private trophyCardHtml(h: HonourRow): string {
    const idx = tierIndexOf(h.tier);
    const grade = trophyGrade(idx);
    const isCup = h.kind === 'cup';
    const kindLabel = isCup ? 'Pod Cup' : 'League Title';
    const sparkles = grade === 'legend' || grade === 'diamond'
      ? '<span class="tc-spark s1">✦</span><span class="tc-spark s2">✧</span><span class="tc-spark s3">✦</span>' : '';
    return `<div class="trophy-card grade-${grade} ${isCup ? 'cup' : 'league'}" title="${h.tier} ${kindLabel}, Season ${h.season_number}">`
      + `<div class="tc-glow"></div>${sparkles}`
      + `<div class="tc-cup">🏆</div>`
      + `<div class="tc-kind">${kindLabel}</div>`
      + `<div class="tc-tier">${h.tier}</div>`
      + `<div class="tc-season">Season ${h.season_number}</div></div>`;
  }

  private async loadCup() {
    $('cup-feed').innerHTML = SPINNER;
    try { $('cup-feed').innerHTML = this.renderCup(await api.cup()); }
    catch { $('cup-feed').innerHTML = '<div class="muted">Could not load the cup.</div>'; }
  }

  private async loadLeaders() {
    $('leaders-feed').innerHTML = SPINNER;
    try {
      const l = await api.leaders();
      const table = (title: string, rows: LeaderStat[], val: (r: LeaderStat) => string, unit: string) => {
        if (!rows.length) return `<div class="lb-block"><div class="lb-title">${title}</div><div class="muted lb-empty">No ${unit} yet this season.</div></div>`;
        const items = rows.map((r, i) => `<div class="lb-row"><span class="lb-rank">${i + 1}</span><span class="lb-name">${r.name}</span><span class="lb-club">${r.club}</span><span class="lb-val">${val(r)}</span></div>`).join('');
        return `<div class="lb-block"><div class="lb-title">${title}</div>${items}</div>`;
      };
      $('leaders-feed').innerHTML =
        `<div class="lb-note">This season, your pod (${l.tier} · Pod ${l.pod + 1}). Goals & assists build each player's permanent record — for NFT players it's banked on-chain-style into their career tally.</div>` +
        table('🥇 Golden Boot — top scorers', l.scorers, (r) => `${r.goals}`, 'goals') +
        table('🅰 Playmaker — top assists', l.assisters, (r) => `${r.assists}`, 'assists') +
        table('★ Player-of-the-Match awards', l.potm, (r) => `${r.potm}`, 'awards');
    } catch { $('leaders-feed').innerHTML = '<div class="muted">Could not load the leaderboards.</div>'; }
  }

  private renderCup(c: CupData): string {
    if (!c.rounds.length) return '<div class="muted">The Pod Cup needs at least two clubs in your pod — as managers join, the bracket fills in.</div>';
    const note = '<div class="cup-note">A knockout among your pod. Draws are settled by a penalty shootout — your best <b>set-piece</b> takers vs their keeper. The bracket firms up as managers set their teams; the champion is crowned at season\'s end.</div>';
    const champ = c.championHandle ? `<div class="cup-champ">🏆 <span>Projected champion</span> <b>${c.championHandle}</b></div>` : '';
    const rounds = c.rounds.map((r) => {
      const ties = r.ties.map((t) => {
        const homeWin = t.winnerId === t.homeId;
        const score = t.pens ? `${t.homeScore}-${t.awayScore} <span class="ct-pens">(${t.pens[0]}-${t.pens[1]}p)</span>` : `${t.homeScore}-${t.awayScore}`;
        const mine = t.homeId === c.me || t.awayId === c.me ? ' mine' : '';
        return `<div class="cup-tie${mine}">`
          + `<span class="ct-team home ${homeWin ? 'win' : ''}">${t.homeHandle}</span>`
          + `<span class="ct-score">${score}</span>`
          + `<span class="ct-team away ${!homeWin ? 'win' : ''}">${t.awayHandle}</span></div>`;
      }).join('');
      const byes = r.byes.length ? `<div class="cup-byes">Byes: ${r.byes.map((b) => b.handle).join(' · ')}</div>` : '';
      return `<div class="cup-round"><div class="cup-round-name">${r.name}</div>${ties}${byes}</div>`;
    }).join('');
    return champ + note + `<div class="cup-bracket">${rounds}</div>`;
  }

  // ---- club facilities ----
  private async showClub() {
    this.showScreen('club');
    $('facilities-grid').innerHTML = SPINNER;
    try { this.renderFacilities(await api.facilities()); }
    catch { $('facilities-grid').innerHTML = '<div class="muted">Could not load — is the server running?</div>'; }
  }

  private renderFacilities(d: { coins: number; facilities: import('./api').Facility[] }) {
    this.account.coins = d.coins;
    $('club-coins').textContent = `💰 ${d.coins}`;
    $('facilities-grid').innerHTML = d.facilities.map((f) => {
      const pips = Array.from({ length: f.maxLevel }, (_, i) => `<i class="${i < f.level ? 'on' : ''}"></i>`).join('');
      const maxed = f.level >= f.maxLevel;
      const action = maxed
        ? '<div class="fac-maxed">★ MAX LEVEL</div>'
        : `<div class="fac-next">Next: <b>${f.nextEffect ?? ''}</b></div>`
          + `<button class="fac-up" data-key="${f.key}" ${f.canAfford ? '' : 'disabled'}>Upgrade · 💰 ${f.upgradeCost} ▶</button>`;
      return `<div class="facility ${maxed ? 'maxed' : ''}">`
        + `<div class="fac-top"><span class="fac-icon">${f.icon}</span><span class="fac-name">${f.name}</span><span class="fac-lvl">LVL ${f.level}/${f.maxLevel}</span></div>`
        + `<div class="fac-pips">${pips}</div>`
        + `<div class="fac-blurb">${f.blurb}</div>`
        + `<div class="fac-effect">▸ ${f.effect}</div>`
        + action + `</div>`;
    }).join('');
    Array.from($('facilities-grid').querySelectorAll('button[data-key]')).forEach((b) =>
      b.addEventListener('click', () => this.upgradeFacility((b as HTMLElement).dataset.key!)));
  }

  private async upgradeFacility(key: string) {
    try {
      const r = await api.upgradeFacility(key);
      this.account.coins = r.coins;
      toast(`Upgraded to level ${r.level} ✓`);
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
      $('trial-pool').innerHTML = '<div class="muted">Could not load — is the server running?</div>';
    }
  }

  // ── ACADEMY: the Career game (Layer 1) — develop 10yo prospects into pro players ──
  private async showAcademy() {
    this.showScreen('academy');
    $('academy-body').innerHTML = SPINNER;
    try {
      const { prospects } = await api.prospects();
      const welcome = this.onboarding
        ? `<div class="onboard-welcome"><b>Welcome to ${this.club.name}.</b> Every legend starts as a kid. Here's your first prospect — <b>develop him</b> through his career (age 10→25), graduate him into your squad, and one day his bloodline carries on. Hit <b>Develop →</b> to begin.</div>`
        : '';
      this.onboarding = false;
      const intro = `<div class="scout-sub">Your <b>academy</b> — young players to <b>develop</b> through a full career (age 10→25): play to each chapter's demands, appoint coaches, make the big calls. At 25 they graduate into a pro for your squad — and when they retire, their <b>bloodline</b> lives on through the next generation.</div>`
        + `<div style="margin:10px 0 14px;"><button id="mint-genesis" class="primary">🔎 Scout a new prospect · 300c</button></div>`;
      const rows = prospects.length ? prospects.map((p) => {
        const stars = '★'.repeat(p.potentialStars) + '☆'.repeat(5 - p.potentialStars);
        const gen = p.generation ? ` · gen ${p.generation}` : '';
        const btn = `<button class="primary" data-dev="${p.id}">${p.careerStarted ? 'Continue' : 'Develop'} →</button>`;
        return `<div class="prospect-row"><div><div class="pr-name">🌱 ${p.name} <span class="pr-stars">${stars}</span></div>`
          + `<div class="pr-meta">${p.roleHint}${gen} · pedigree ${(p.pedigree * 100) | 0}% ${p.careerStarted ? '· in development' : '· age 10, ready to develop'}</div></div>${btn}</div>`;
      }).join('') : '<div class="muted">No prospects yet — scout one above to begin.</div>';
      const { legends } = await api.legends().catch(() => ({ legends: [] as any[] }));
      const hall = legends.length ? `<h4 class="scout-h4" style="margin-top:22px;">🏅 HALL OF LEGENDS</h4>`
        + `<div class="scout-sub">The great careers your bloodlines have had — one card per retirement.</div>`
        + `<div class="legends-grid">` + legends.map((l: any) => `<div class="legend-card"><div class="lc-top">${l.card.icon} <b>${l.card.tier}</b></div>`
          + `<div class="lc-name">${l.name}</div><div class="lc-meta">${l.card.role} · rating ${l.card.legendRating}</div>`
          + `<div class="lc-honours">${l.card.leagueTitles}🏅 ${l.card.cupTitles}🏆 · ${l.card.apps} apps · ${l.card.seasons} seasons</div>`
          + `<div class="lc-note">${l.card.note}</div></div>`).join('') + `</div>` : '';
      $('academy-body').innerHTML = welcome + intro + rows + hall;
      $('mint-genesis').addEventListener('click', () => this.mintGenesis());
      $('academy-body').querySelectorAll('[data-dev]').forEach((b) => b.addEventListener('click', () => this.openCareer((b as HTMLElement).dataset.dev!)));
    } catch { $('academy-body').innerHTML = '<div class="muted">Could not load — is the server running?</div>'; }
  }

  /** Trophy Room: the club's honours + the bloodlines (legend chains) you've built — the dynasty legacy. */
  private async showTrophyRoom() {
    this.showScreen('trophies');
    $('trophies-body').innerHTML = SPINNER;
    try {
      const [{ honours }, { legends }] = await Promise.all([api.honours(), api.legends()]);
      const titles = honours.filter((h) => h.title === 1);
      const cabinet = titles.length
        ? `<div class="tr-cabinet">` + titles.sort((a, b) => a.season_number - b.season_number).map((h) => `<div class="tr-trophy"><div class="tr-trophy-ico">🏆</div><div class="tr-trophy-name">${h.tier}</div><div class="tr-trophy-sub">Season ${h.season_number}${h.kind && h.kind !== 'league' ? ` · ${h.kind}` : ''}</div></div>`).join('') + `</div>`
        : `<div class="muted">No trophies yet — win your pod to lift your first title.</div>`;
      // retired numbers (per-save honour for a top-tier 'Immortal' legend)
      const TOP_TIER = 'Immortal', rKey = 'fm_retired_' + (this.account?.handle ?? '');
      let retired: Array<{ n: number; name: string }>; try { retired = JSON.parse(localStorage.getItem(rKey) || '[]'); } catch { retired = []; }
      const retiredNums = new Set(retired.map((r) => r.n));
      // bloodlines: group legend cards by their base player id → a generational chain
      const byLine = new Map<string, typeof legends>();
      for (const l of legends) { const arr = byLine.get(l.playerId) ?? []; arr.push(l); byLine.set(l.playerId, arr); }
      const lines = [...byLine.values()].map((chain) => chain.slice().sort((a, b) => a.retiredSeason - b.retiredSeason));
      const genCard = (l: typeof legends[number], i: number, len: number) => {
        const num = l.card.number, numTag = num ? ` <span class="tr-gen-num">#${num}</span>` : '';
        const eligible = l.card.tier === TOP_TIER && num && !retiredNums.has(num);
        const retireBtn = eligible ? `<button class="tr-retire" data-num="${num}" data-name="${l.name.replace(/"/g, '&quot;')}">🎽 Retire #${num}</button>` : '';
        return `<div class="tr-gen"><div class="tr-gen-badge">${l.card.icon} ${l.card.tier}${numTag}</div><div class="tr-gen-name">${l.name}</div><div class="tr-gen-meta">${l.card.role} · rating ${l.card.legendRating} · ${l.card.leagueTitles}🏅 ${l.card.cupTitles}🏆 · ${l.card.apps} apps</div>${retireBtn}</div>${i < len - 1 ? '<div class="tr-arrow">↓ next generation</div>' : ''}`;
      };
      const bloodlines = lines.length
        ? lines.map((chain) => `<div class="tr-line">` + chain.map((l, i) => genCard(l, i, chain.length)).join('') + `</div>`).join('')
        : `<div class="muted">No bloodlines yet — develop a player, field him for a career, and retire him to found a dynasty. Every generation after adds a link to the tree.</div>`;
      const retiredSection = retired.length
        ? `<h4 class="scout-h4" style="margin-top:24px;">🎽 RETIRED NUMBERS</h4><div class="scout-sub">Shirts hung up forever for the club's immortals — no future player wears these.</div>`
          + `<div class="tr-cabinet">` + retired.map((r) => `<div class="tr-trophy"><div class="tr-trophy-ico">#${r.n}</div><div class="tr-trophy-name">${r.name}</div><div class="tr-trophy-sub">retired</div></div>`).join('') + `</div>`
        : '';
      const seasons = honours.length ? Math.max(...honours.map((h) => h.season_number)) : 0;
      const summary = `<div class="tr-summary">🏆 ${titles.length} title${titles.length === 1 ? '' : 's'} · 🌳 ${lines.length} bloodline${lines.length === 1 ? '' : 's'} · ⭐ ${legends.length} legend${legends.length === 1 ? '' : 's'}${retired.length ? ` · 🎽 ${retired.length} retired` : ''} · ${seasons} season${seasons === 1 ? '' : 's'} managed</div>`;
      $('trophies-body').innerHTML = summary
        + `<h4 class="scout-h4">🏆 TROPHY CABINET</h4>` + cabinet
        + `<h4 class="scout-h4" style="margin-top:24px;">🌳 BLOODLINES</h4><div class="scout-sub">The dynasties you've built — each line is a bloodline across the generations, newest at the bottom.</div>` + bloodlines
        + retiredSection;
      $('trophies-body').querySelectorAll('.tr-retire').forEach((el) => el.addEventListener('click', () => {
        const n = Number((el as HTMLElement).dataset.num); const name = (el as HTMLElement).dataset.name!;
        let cur: Array<{ n: number; name: string }>; try { cur = JSON.parse(localStorage.getItem(rKey) || '[]'); } catch { cur = []; }
        if (!cur.some((r) => r.n === n)) cur.push({ n, name });
        localStorage.setItem(rKey, JSON.stringify(cur));
        toast(`🎽 #${n} retired forever in ${name}'s honour`);
        this.showTrophyRoom();
      }));
    } catch { $('trophies-body').innerHTML = '<div class="muted">Could not load — is the game running?</div>'; }
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
      const opts = agents.map((a) => `<div class="cg-coach" data-agent="${a.id}"><div class="cg-cname">🤝 ${a.name}</div><div class="cg-cdesc">${a.desc}</div></div>`).join('');
      $('academy-body').innerHTML = `<button id="acad-back2" style="margin-bottom:10px;">← Prospects</button>`
        + `<div class="cg-prompt">Sign an <b>agent</b> to represent this prospect — it shapes his whole career (exposure, opportunities, and how much he'll want to be paid).</div>` + opts;
      $('acad-back2').addEventListener('click', () => this.showAcademy());
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
      `<div class="cg-meter" title="${m.label}: ${m.value}/100"><span class="cg-m-icon">${m.icon}</span>`
      + `<span class="cg-m-lbl">${m.label}</span>`
      + `<span class="cg-m-bar"><b style="width:${m.value}%;background:${meterColor(m.value)}"></b></span></div>`).join('');
    const low = s.energy != null && s.energy < 35;
    const energy = s.energy != null
      ? `<div class="cg-energy${low ? ' low' : ''}" title="Energy ${s.energy}/100${low ? ' — tired: moments suffer until you rest' : ''}"><span>⚡ ENERGY${low ? ' · TIRED' : ''}</span><span class="cg-e-bar"><b style="width:${s.energy}%"></b></span></div>`
      : '';
    const money = s.earnings != null ? `<div class="cg-money">💷 ${s.earnings.toLocaleString()}</div>` : '';
    return `<div class="cg-dash">${energy}${money}<div class="cg-meters">${meters}</div></div>`;
  }
  /** First-career coach-marks: contextual, dismissible hints during chapter 1 of a gen-0 career. */
  private tutorialHint(s: import('./api').CareerState): string {
    if (localStorage.getItem('fm_tut_done')) return '';
    if ((s as any).generation > 0) { localStorage.setItem('fm_tut_done', '1'); return ''; } // tutorial only on the very first (gen-0) career
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
    if (turn >= 11) localStorage.setItem('fm_tut_done', '1'); // graduate the tutorial after chapter 1
    return hint ? `<div class="cg-tut" id="cg-tut">${hint} <button class="cg-tut-x" id="cg-tut-x">Got it ✕</button></div>` : '';
  }

  private renderCareer(s: import('./api').CareerState) {
    const pct = Math.round((s.turn / s.totalTurns) * 100);
    // re-theme the whole view for this life stage (accent + backdrop + scene banner)
    const th = CHAPTER_THEME[s.chapter] ?? CHAPTER_THEME.Grassroots;
    const acad = $('academy'); acad.dataset.chapter = th.slug;
    acad.style.setProperty('--cg-accent', th.accent); acad.style.setProperty('--cg-bg', th.bg);
    const scene = `<div class="cg-scene"><span class="cg-scene-emoji">${th.scene}</span><span class="cg-scene-tag"><b>${s.chapter}</b> · ${th.tagline}</span></div>`;
    const head = `<div class="cg-head"><button id="cg-back">←</button><span class="cg-age">${s.name} · age ${s.age}</span>`
      + `<span class="cg-chapter">${s.chapter}</span><div class="cg-bar"><i style="width:${pct}%"></i></div><span class="pr-meta">${s.turn}/${s.totalTurns}</span></div>`;
    const evt = s.seasonEvent ? `<div class="cg-event"><b>${s.seasonEvent.name}</b> — ${s.seasonEvent.desc}</div>` : '';
    const prof = s.profile ? this.careerProfileHtml(s.profile) : '';
    const narr = this.lastNarration ? this.outcomeChipHtml() + `<div class="cg-narrate">“${this.lastNarration}”</div>` : '';
    const recap = s.recap ? `<div class="cg-recap"><span class="cg-recap-lbl">📖 The story so far</span>${s.recap}</div>` : '';
    const conseq = s.consequences?.length
      ? `<div class="cg-conseq"><span class="cg-conseq-lbl">📋 How the season paid off</span>`
        + s.consequences.map((n) => `<div class="cg-conseq-row">${n}</div>`).join('') + `</div>`
      : '';
    let body = '';
    if (s.phase === 'play' && s.scenario) {
      const tags = Object.entries(s.scenario.demand).sort((a, b) => b[1] - a[1]).map(([t]) => `<span class="cg-tag">${t}</span>`).join('');
      // distinct presentation per moment type — a matchday scoreboard, the training ground, or life off the pitch
      const mk = s.momentKind ?? (s.lifeEvent ? 'life' : 'training');
      let header: string; let prompt: string;
      if (mk === 'match' && s.matchCtx) {
        const mc = s.matchCtx; const [us, them] = mc.score.split('-');
        const big = s.scenario.stakes >= 3 ? ' · ★ THE BIG ONE' : s.scenario.stakes >= 2 ? ' · BIG GAME' : '';
        header = `<div class="cg-matchday stakes-${s.scenario.stakes}">`
          + `<div class="cg-md-top"><span class="cg-md-badge">⚽ MATCHDAY${big}</span><span class="cg-md-min">${mc.minute}'</span></div>`
          + `<div class="cg-md-score">${us} <b>–</b> ${them}</div>`
          + `<div class="cg-md-vs">vs <b>${mc.opponent}</b> · ${mc.home ? '🏟️ Home' : '✈️ Away'}</div>`
          + `<div class="cg-md-comp">${mc.comp}</div></div>`;
        prompt = 'The moment falls to him — what does he do?';
      } else if (mk === 'life') {
        header = `<div class="cg-mtype life">⚡ LIFE EVENT${s.lifeEvent ? ` · ${s.lifeEvent}` : ' · off the pitch'}</div>`;
        prompt = 'How does he handle it?';
      } else {
        header = `<div class="cg-mtype training">🏋️ TRAINING GROUND</div>`;
        prompt = 'How does he approach the session?';
      }
      body = `<div class="cg-scenario stakes-${s.scenario.stakes} ${mk}">${header}<div class="cg-story">${s.story ?? s.scenario.label}</div><div class="cg-demand">${tags}</div></div>`
        + `<div class="cg-prompt">${prompt}${s.coach ? ` · <b>${s.coach.name}</b> is coaching him` : ''}</div>`
        + `<div class="cg-cards">` + (s.hand ?? []).map((c) => this.cardHtml(c, 'play')).join('') + `</div>`;
    } else if (s.phase === 'coach' && s.coaches) {
      body = `<div class="cg-prompt">Appoint a mentor or coach for the coming chapter — they sharpen the work you do in their specialty:</div>`
        + s.coaches.map((c) => `<div class="cg-coach" data-act="coach" data-id="${c.id}"><div class="cg-cname">${c.kind === 'mentor' ? '🧭' : '📋'} ${c.name}</div><div class="cg-cdesc">${c.desc} · <i>${c.specialty.join(', ')}</i></div></div>`).join('');
    } else if (s.phase === 'draft' && s.options) {
      body = `<div class="cg-prompt">Draft <b>${s.picksLeft}</b> card${s.picksLeft === 1 ? '' : 's'} to add to your deck — this is how you build your identity:</div>`
        + `<div class="cg-cards">` + s.options.map((c) => this.cardHtml(c, 'draft')).join('') + `</div>`;
    } else if (s.phase === 'offer' && s.offers) {
      body = `<div class="cg-prompt">A decision off the pitch — money now, or development?</div>`
        + s.offers.map((o) => `<div class="cg-offer" data-act="offer" data-id="${o.id}"><div class="cg-cname">💷 ${o.name}</div><div class="cg-cdesc">${o.desc}</div>`
          + `<div class="cg-effs">${o.earn > 0 ? `+${o.earn}c ` : ''}${o.greed > 0 ? '· greedier ' : o.greed < 0 ? '· more loyal ' : ''}${o.market > 0 ? '· more famous ' : ''}${o.form > 0 ? '· sharper' : o.form < 0 ? '· distracted' : ''}</div></div>`).join('');
    } else if (s.phase === 'focus' && s.focus) {
      const effLabel = (e: Record<string, number>) => Object.entries(e).map(([k, v]) => `${METER_ICON[k] ?? ''}${v > 0 ? '+' : ''}${v}`).join(' · ');
      const perkLabel = (p?: Record<string, number>) => p ? Object.entries(p).map(([k, v]) => `${METER_ICON[k] ?? ''}${v > 0 ? '+' : ''}${v}`).join(' ') : '';
      const shop = (!s.side && s.lifestyle && s.lifestyle.length)
        ? `<div class="cg-prompt cg-shop-h">💷 <b>Treat yourself</b> — spend earnings (you have <b>${(s.earnings ?? 0).toLocaleString()}c</b>) on your life off the pitch. Age-appropriate to where you are now:</div>`
          + `<div class="cg-focus">` + s.lifestyle.map((li) => `<div class="cg-foc buy" data-act="lifestyle" data-id="${li.id}"><div class="cg-cname">${li.icon} ${li.name}</div><div class="cg-cdescr">${li.blurb}</div>`
            + `<div class="cg-effs"><span class="cg-cost">💷 ${li.cost.toLocaleString()}c</span> ${li.recovery ? `· ⚡rec+${li.recovery} ` : ''}${li.market ? `· ⭐fame+${li.market} ` : ''}${perkLabel(li.perks)}</div></div>`).join('') + `</div>`
        : '';
      const focusPrompt = s.side
        ? '🤝 <b>One more thing</b> before pre-season — a smaller side activity, if you fancy it:'
        : '🌅 <b>Between seasons</b> — how do you spend the summer? Steer your relationships before the next chapter.';
      body = `<div class="cg-prompt">${focusPrompt}</div>`
        + `<div class="cg-focus">` + s.focus.map((f) => `<div class="cg-foc" data-act="focus" data-id="${f.id}"><div class="cg-cname">${f.icon} ${f.name}</div><div class="cg-cdescr">${f.desc}</div>`
          + `<div class="cg-effs">${f.energy ? `⚡${f.energy > 0 ? '+' : ''}${f.energy} ` : ''}${effLabel(f.effects)}</div></div>`).join('') + `</div>` + shop;
    }
    this.lastCareerState = s;
    // TABS declutter the view: NOW (the current decision + your life dashboard), PLAYER (full identity +
    // deck), KIT (cosmetic customization). The chapter header + scene banner stay above the tabs.
    const TABS: Array<['now' | 'player' | 'kit', string]> = [['now', '⚽ Now'], ['player', '👤 Player'], ['kit', '🎽 Kit']];
    const tabBar = `<div class="cg-tabs">` + TABS.map(([t, label]) => `<button class="cg-tab${this.careerTab === t ? ' on' : ''}" data-tab="${t}">${label}</button>`).join('') + `</div>`;
    let content: string;
    if (this.careerTab === 'player') content = prof + this.deckHtml(s);
    else if (this.careerTab === 'kit') content = this.kitTabHtml(s);
    else content = this.lifeDashHtml(s) + narr + recap + conseq + evt + body;
    const tut = this.careerTab === 'now' ? this.tutorialHint(s) : '';
    $('academy-body').innerHTML = head + scene + tut + tabBar + content;
    ($('cg-tut-x') as any)?.addEventListener('click', () => { localStorage.setItem('fm_tut_done', '1'); ($('cg-tut') as any)?.remove(); });
    $('cg-back').addEventListener('click', () => this.showAcademy());
    $('academy-body').querySelectorAll('.cg-tab').forEach((el) => el.addEventListener('click', () => { this.careerTab = (el as HTMLElement).dataset.tab as any; this.renderCareer(s); }));
    $('academy-body').querySelectorAll('[data-act]').forEach((el) => el.addEventListener('click', () => this.doCareerAct(s.prospectId, { type: (el as HTMLElement).dataset.act!, cardId: (el as HTMLElement).dataset.id! })));
    if (this.careerTab === 'kit') this.wireKitTab(s);
  }

  /** The developing player's live identity panel — shows him taking shape as you play. */
  private careerProfileHtml(p: import('./api').CareerProfile): string {
    const stars = '★'.repeat(p.stars) + '☆'.repeat(5 - p.stars);
    const key: Array<[string, string]> = [['pace', 'PAC'], ['shooting', 'SHO'], ['passing', 'PAS'], ['tackling', 'TAC'], ['strength', 'STR'], ['composure', 'CMP'], ['creativity', 'CRE'], ['leadership', 'LDR']];
    const stat = (k: string) => `<span class="cgp-stat"><b>${key.find((x) => x[0] === k)?.[1]}</b> ${p.attrs[k] ?? 0}</span>`;
    const traits = p.traitsForming.length ? `<div class="cgp-traits">forming: ${p.traitsForming.map((t) => `<span class="cg-tag">${t}</span>`).join(' ')}</div>` : '';
    return `<div class="cg-profile"><div class="cgp-top">`
      + `<span class="cgp-role role-${p.role}">${p.role}</span>`
      + `<span class="cgp-ovr">OVR ${p.currentOverall} <i>→ ${p.potential} pot ${stars}</i></span>`
      + `<span class="cgp-pers" title="${p.personality.desc}">🧠 ${p.personality.name}</span>`
      + (p.agent ? `<span class="cgp-meta">🤝 ${p.agent}</span>` : '')
      + (p.coach ? `<span class="cgp-meta">📋 ${p.coach}</span>` : '')
      + `<span class="cgp-meta">💷 ${p.earnings}c earned</span></div>`
      + `<div class="cgp-stats">${key.map(([k]) => stat(k)).join('')}</div>${traits}</div>`;
  }

  private cardHtml(c: import('./api').CareerCard, act: string): string {
    const rar = c.rarity && c.rarity !== 'common' ? c.rarity : '';
    const tags = c.tags.map((t) => `<span class="cg-tag">${t}</span>`).join('');
    return `<div class="cg-card ${rar}" data-act="${act}" data-id="${c.id}">${rar ? `<span class="cg-rarity">${rar}</span>` : ''}<div class="cg-cname">${c.name}</div>`
      + (c.desc ? `<div class="cg-cdescr">${c.desc}</div>` : '') + `<div class="cg-ctags">${tags}</div></div>`;
  }

  private lastNarration = '';
  private lastOutcome?: import('./api').CareerOutcome | null;
  private careerTab: 'now' | 'player' | 'kit' = 'now';
  private lastCareerState?: import('./api').CareerState;

  /** The immediate, legible verdict on the moment just played — a fit read + a performance grade + the
   *  attributes it developed. Colour-coded so a good choice visibly pops (the core NSS feedback loop). */
  private outcomeChipHtml(): string {
    const o = this.lastOutcome;
    if (!o) return '';
    // FIT READ — did you pick the card the moment was asking for?
    const read = o.answeredAsk
      ? { cls: 'great', label: '🎯 Perfect read' }
      : o.fit >= o.bestFit - 0.18
        ? { cls: 'good', label: '◑ Good read' }
        : { cls: 'poor', label: '✗ Against his game' };
    // PERFORMANCE — how the moment actually went (fit + nerve + coaching − fatigue).
    const perf = o.success >= 0.78 ? { cls: 'great', label: '⭐ Brilliant' }
      : o.success >= 0.58 ? { cls: 'good', label: '✓ Solid' }
        : o.success >= 0.38 ? { cls: 'mid', label: '◦ Scrappy' }
          : { cls: 'poor', label: '✗ Poor' };
    const grew = o.tags.length
      ? `<span class="cg-oc-grew">developed ${o.tags.map((t) => `<span class="cg-tag">${t}</span>`).join(' ')}</span>` : '';
    return `<div class="cg-outcome"><span class="cg-oc-pill ${read.cls}">${read.label}</span>`
      + `<span class="cg-oc-pill ${perf.cls}">${perf.label}</span>${grew}</div>`;
  }

  /** PLAYER tab: the full deck (identity cards) grouped visually. */
  private deckHtml(s: import('./api').CareerState): string {
    const deck = s.deck ?? [];
    if (!deck.length) return '';
    return `<div class="cg-prompt cg-shop-h">🃏 <b>Your deck</b> — the ${deck.length} cards that define how he plays:</div>`
      + `<div class="cg-cards deck">` + deck.map((c) => this.cardHtml(c, 'view')).join('') + `</div>`;
  }

  /** KIT tab: cosmetic identity — squad number, boot colour, celebration, nickname (carries to the pro). */
  private kitTabHtml(s: import('./api').CareerState): string {
    const k = s.kit ?? { number: 10, boots: 'white', celebration: 'kneeslide', nickname: '', hairstyle: 'buzz', accessory: 'none' };
    const boots = BOOT_COLOURS.map((b) => `<button type="button" class="cg-swatch${k.boots === b.id ? ' on' : ''}" data-boot="${b.id}" title="${b.name}" style="background:${b.hex}"></button>`).join('');
    const cels = CELEBRATIONS.map((c) => `<option value="${c.id}"${k.celebration === c.id ? ' selected' : ''}>${c.name}</option>`).join('');
    const hairs = HAIRSTYLES.map((h) => `<option value="${h.id}"${(k.hairstyle ?? 'buzz') === h.id ? ' selected' : ''}>${h.name}</option>`).join('');
    const accs = ACCESSORIES.map((a) => `<option value="${a.id}"${(k.accessory ?? 'none') === a.id ? ' selected' : ''}>${a.name}</option>`).join('');
    return `<div class="cg-kit">`
      + `<div class="cg-prompt">🎽 <b>Kit & identity</b> — make him unmistakably yours. Purely cosmetic, and it carries into the pro.</div>`
      + `<div class="cg-kit-row"><label>Squad number</label><input id="kit-number" type="number" min="1" max="99" value="${k.number}"></div>`
      + `<div class="cg-kit-row"><label>Nickname <span class="cg-kit-hint">(what the crowd calls him)</span></label><input id="kit-nick" type="text" maxlength="20" placeholder="e.g. The Wolf" value="${(k.nickname ?? '').replace(/"/g, '&quot;')}"></div>`
      + `<div class="cg-kit-row"><label>Boots</label><div class="cg-swatches">${boots}</div></div>`
      + `<div class="cg-kit-row"><label>Signature celebration</label><select id="kit-cel">${cels}</select></div>`
      + `<div class="cg-kit-row"><label>Hairstyle</label><select id="kit-hair">${hairs}</select></div>`
      + `<div class="cg-kit-row"><label>Accessory</label><select id="kit-acc">${accs}</select></div>`
      + `<button id="kit-save" class="cg-kit-save">Save kit</button>`
      + `</div>`;
  }
  private wireKitTab(s: import('./api').CareerState) {
    let boot = (s.kit?.boots) ?? 'white';
    $('academy-body').querySelectorAll('.cg-swatch').forEach((el) => el.addEventListener('click', () => {
      boot = (el as HTMLElement).dataset.boot!;
      $('academy-body').querySelectorAll('.cg-swatch').forEach((x) => x.classList.remove('on'));
      el.classList.add('on');
    }));
    $('kit-save').addEventListener('click', async () => {
      const kit = {
        number: Math.max(1, Math.min(99, parseInt(($('kit-number') as HTMLInputElement).value) || 10)),
        boots: boot,
        celebration: ($('kit-cel') as HTMLSelectElement).value,
        nickname: ($('kit-nick') as HTMLInputElement).value.trim(),
        hairstyle: ($('kit-hair') as HTMLSelectElement).value,
        accessory: ($('kit-acc') as HTMLSelectElement).value,
      };
      try { const r = await api.saveKit(s.prospectId, kit); if (this.lastCareerState) this.lastCareerState.kit = r.kit; s.kit = r.kit; toast('Kit saved ✓'); }
      catch (e: any) { toast(e?.body?.error ?? 'Could not save kit'); }
    });
  }

  private async doCareerAct(prospectId: string, action: { type: string; cardId: string }) {
    if (!['play', 'draft', 'coach', 'offer', 'focus', 'lifestyle'].includes(action.type)) return; // ignore view-only (deck) cards
    if (action.type !== 'lifestyle') this.careerTab = 'now'; // after acting, return to the action view (but stay put while shopping)
    try {
      const r = await api.careerAct(prospectId, action);
      this.lastNarration = r.narration ?? '';
      this.lastOutcome = r.outcome ?? null;
      if (r.graduated && r.player) {
        this.setMe(await api.me());
        const player = r.player;
        // an evocative epilogue of the whole journey, then the pro reveal
        $('academy-body').innerHTML = `<div class="cg-graduation">`
          + `<div class="cg-grad-title">🎓 ${player.name} — the journey's end</div>`
          + `<div class="cg-epilogue">${r.epilogue ?? ''}</div>`
          + `<button id="cg-reveal">Reveal the pro →</button></div>`;
        $('cg-reveal').addEventListener('click', () => { this.showPlayerCard(player, true); this.showAcademy(); });
      } else if (r.state) {
        this.renderCareer(r.state);
      }
    } catch (e: any) { toast(e?.body?.error ?? 'Move failed'); }
  }

  // ── Scouting Network: destinations + dispatched trips (sealed → travel → reveal) ──
  private missionTimer: number | null = null;
  private async loadMissions() {
    try {
      const d = await api.missions();
      this.account.coins = d.coins;
      $('trips-per').textContent = String(d.tripsPerSeason);
      $('trips-used').textContent = String(d.tripsUsed);
      $('scout-coins').textContent = `💰 ${d.coins}`;
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

  // ── Transfer market ─────────────────────────────────────────────────────────
  private async showMarket() {
    this.showScreen('market');
    $('market-list').innerHTML = SPINNER;
    $('my-listings').innerHTML = '';
    try {
      const d = await api.market();
      this.account.coins = d.coins;
      $('market-coins').textContent = `💰 ${d.coins}`;
      const reveal: Record<string, string> = {
        base: 'ratings only', bronze: 'ratings + 2 key stats', silver: 'ratings + 5 stats', gold: 'the full stat sheet',
      };
      const tName: Record<string, string> = { base: 'Base', bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };
      $('market-scout').innerHTML = `🔎 Your <b>${tName[d.tier] ?? d.tier}</b> player scout reveals <b>${reveal[d.tier] ?? ''}</b> on each listing — 🔒 stats unlock with a higher scout.`;
      // sell dropdown: squad players not already listed and not loanees
      const listed = new Set(d.mine.map((l) => l.playerId));
      const sellable = this.club.players.filter((p) => !p.id.startsWith('loan-') && !listed.has(p.id)).sort((a, b) => overall(b) - overall(a));
      const sel = $('sell-player') as HTMLSelectElement;
      sel.innerHTML = sellable.length
        ? sellable.map((p) => `<option value="${p.id}">${p.name} (${p.role} ${overall(p)})</option>`).join('')
        : '<option value="">No sellable players</option>';
      // my active listings
      $('my-listings').innerHTML = d.mine.length
        ? d.mine.map((l) => `<div class="listing-mine"><span class="mkt-role role-${l.player.role}">${l.player.role}</span>`
            + `<span class="lm-name">${l.player.name} (OVR ${l.player.overall})</span><span class="lm-price">💰 ${l.price}</span>`
            + `<button data-cancel="${l.id}">Cancel</button></div>`).join('')
        : '';
      // the open market
      $('market-list').innerHTML = d.listings.length
        ? d.listings.map((l) => this.renderMarketCard(l, d.coins)).join('')
        : '<div class="muted">Nothing for sale right now. List one of your players above, or check back later.</div>';
      Array.from($('market-list').querySelectorAll('button[data-buy]')).forEach((b) =>
        b.addEventListener('click', () => this.buyListing((b as HTMLElement).dataset.buy!)));
      Array.from($('my-listings').querySelectorAll('button[data-cancel]')).forEach((b) =>
        b.addEventListener('click', () => this.cancelListing((b as HTMLElement).dataset.cancel!)));
    } catch {
      $('market-list').innerHTML = '<div class="muted">Could not load — is the server running?</div>';
    }
  }

  private renderMarketCard(l: MarketListing, coins: number): string {
    const lab: Record<string, string> = { pace: 'PAC', strength: 'STR', passing: 'PAS', shooting: 'SHO', tackling: 'TAC', positioning: 'POS', workrate: 'WOR', keeping: 'GK', setPiece: 'SET', stamina: 'STA' };
    const attrs = Object.entries(l.player.attrs).map(([k, v]) => `<span class="at">${lab[k] ?? k} <b>${v}</b></span>`).join('');
    const locks = l.player.hidden > 0 ? `<span class="at locked">🔒 ${l.player.hidden} hidden</span>` : '';
    const afford = coins >= l.price;
    const buy = `<button data-buy="${l.id}" ${afford ? '' : 'disabled title="Not enough coins"'}>Buy ▶</button>`;
    return `<div class="mkt ${l.player.overall >= 15 ? 'gem' : ''}">`
      + `<div class="mkt-top"><span class="mkt-role role-${l.player.role}">${l.player.role}</span>`
      + `<span class="mkt-name">${l.player.name}</span><span class="mkt-ovr">OVR ${l.player.overall}</span></div>`
      + `<div class="mkt-attrs">${attrs}${locks}</div>`
      + `<div class="mkt-bot"><span class="mkt-price">💰 ${l.price}</span><span class="mkt-seller">${l.sellerHandle}</span>${buy}</div></div>`;
  }

  private async sellPlayer() {
    const playerId = ($('sell-player') as HTMLSelectElement).value;
    const priceInput = $('sell-price') as HTMLInputElement;
    const price = Number(priceInput.value);
    if (!playerId) { toast('Pick a player to sell'); return; }
    if (!price || price < 10) { toast('Set a price (min 10 coins)'); return; }
    try { await api.listPlayer(playerId, price); toast('Listed for sale ✓'); priceInput.value = ''; await this.showMarket(); }
    catch (e: any) { toast(e?.body?.error ?? 'Could not list'); }
  }

  private async buyListing(id: string) {
    try {
      const r = await api.buyListing(id);
      toast(`Signed ${r.player.name} ✓`);
      this.setMe(await api.me()); // refresh coins + squad
      await this.showMarket();
    } catch (e: any) { toast(e?.body?.error ?? 'Could not buy'); }
  }

  private async cancelListing(id: string) {
    try { await api.cancelListing(id); toast('Listing withdrawn'); await this.showMarket(); }
    catch { toast('Could not cancel'); }
  }

  private renderResults(rows: ResultRow[]): string {
    if (!rows.length) return '<div class="muted">No matches played yet.</div>';
    const name = (handle: string, id: string, win: boolean) =>
      `<span class="rr-team${win ? ' win' : ''}${id === this.account.id ? ' you' : ''}">${handle}</span>`;
    return rows.map((r) => {
      const mine = r.home_id === this.account.id || r.away_id === this.account.id;
      return `<div class="result-row${mine ? ' me' : ''}">`
        + `<span class="rr-teams">${name(r.home_handle, r.home_id, r.home_score > r.away_score)}`
        + `<span class="rr-vs">vs</span>${name(r.away_handle, r.away_id, r.away_score > r.home_score)}</span>`
        + `<span class="rr-score">${r.home_score} - ${r.away_score}</span>`
        + `<span class="rr-when">${timeAgo(r.created_at)}</span></div>`;
    }).join('');
  }

  private renderLeagueTable(rows: TableRow[], zones?: { promote?: number; relegate?: number }): string {
    const head = '<tr><th>#</th><th style="text-align:left">Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th>Rtg</th></tr>';
    const promote = zones?.promote ?? 0, relegate = zones?.relegate ?? 0;
    // only mark a relegation zone when the pod is big enough to actually have one
    const relegFrom = rows.length > promote + relegate ? rows.length - relegate : rows.length;
    const body = rows.map((r, i) => {
      const gd = r.GD > 0 ? `+${r.GD}` : `${r.GD}`;
      const zone = i < promote ? ' promo' : i >= relegFrom ? ' releg' : '';
      return `<tr class="${r.id === this.account.id ? 'me' : ''}${zone}"><td class="pos">${i + 1}</td><td class="club">${r.handle}</td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GF}</td><td>${r.GA}</td><td>${gd}</td><td class="pts">${r.Pts}</td><td>${r.rating}</td></tr>`;
    }).join('');
    return `<table class="league">${head}${body}</table>`;
  }

  // ---- lineup editor (my standing orders) ----
  // Opens the pixel lineup editor either to save your standing orders, or to set a
  // one-off lineup + tactics for a specific match (prefilled from your standing orders).
  private openLineup(mode: 'standing' | 'match', opp?: { id: string; handle: string; venue: 'home' | 'away' }) {
    this.editorMode = mode;
    this.pendingOpp = opp;
    this.draftTactics = { ...this.standingOrders.tactics, formation: this.standingOrders.formation };
    // the saved XI can reference players no longer in the squad (e.g. an NFT star that's
    // been transferred/de-listed) — fall back to a valid auto-pick so the editor still opens
    const avail = this.availableClub();
    const owned = new Set(avail.players.map((x) => x.id)); // injured players are unavailable
    const soValid = this.standingOrders.playerIds.length === 11 && this.standingOrders.playerIds.every((id) => owned.has(id));
    this.draftLineup = soValid
      ? { formation: this.standingOrders.formation, playerIds: [...this.standingOrders.playerIds] }
      : autoPickXI(avail, this.standingOrders.formation);
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
    if (mode === 'match' && opp) {
      sc.classList.remove('hidden');
      sc.innerHTML = '<div class="scout-head">🔍 Scouting…</div>';
      api.scout(opp.id).then((s) => { if (this.pendingOpp?.id === opp.id) sc.innerHTML = this.renderScout(s); }).catch(() => sc.classList.add('hidden'));
      // load the plan we last used vs this opponent (overrides the standing-orders default)
      api.plan(opp.id).then((r) => {
        if (!r.plan || this.pendingOpp?.id !== opp.id || this.editorMode !== 'match') return;
        const owned = new Set(this.club.players.map((x) => x.id));
        if (r.plan.playerIds.length !== 11 || !r.plan.playerIds.every((id) => owned.has(id))) return;
        this.draftTactics = { ...r.plan.tactics, formation: r.plan.formation };
        this.draftLineup = { formation: r.plan.formation, playerIds: [...r.plan.playerIds] };
        this.draftDuties = this.draftLineup.playerIds.map((pid, i) => {
          const pl = this.club.players.find((x) => x.id === pid)!;
          const d = r.plan!.duties?.[i];
          return d && isDutyForRole(pl.role, d) ? d : defaultDuty(pl);
        });
        this.renderLineupEditor();
        toast(`Loaded your plan vs ${opp.handle}`);
      }).catch(() => {});
    } else {
      sc.classList.add('hidden'); sc.innerHTML = '';
    }
    ($('save-team') as HTMLButtonElement).textContent = mode === 'standing' ? 'Save Team' : '▶ Kick Off';
    this.renderLineupEditor();
    this.showScreen('lineup');
  }

  private renderScout(s: Scout): string {
    const roster = s.players
      .map((p) => {
        const rating = p.overall != null ? `<b>${p.overall}</b>` : `<b class="lk" title="Upgrade your opposition scout to reveal ratings">🔒</b>`;
        return `<span class="sp ${p.likelyXI ? 'xi' : ''}"><span class="rl role-${p.role}">${p.role}</span><span class="nm">${p.name}</span>${rating}</span>`;
      }).join('');
    const tierBadge = `<span class="opp-tier tier-${s.tier}">SCOUT: ${s.tier.toUpperCase()}</span>`;
    // note adapts to what this tier reveals, and teases what the next tier unlocks
    const note = s.reveal.likelyXI
      ? 'Their squad, best-rated first (highlighted = likely XI). Set your shape &amp; duties to counter them.'
      : s.reveal.overalls
        ? 'Their squad with ratings, best-rated first. 🔒 Likely XI is revealed at Silver scout.'
        : '🔒 Base scout: roster &amp; shape only. Player ratings unlock at Bronze, likely XI at Silver, tactical intel at Gold.';
    const intel = s.intel ? `<div class="scout-intel">🎯 ${s.intel}</div>` : '';
    return `<div class="scout-head">🔍 SCOUTING <b>${s.clubName}</b> · likely <b>${s.formation}</b> · rating ${s.rating} ${tierBadge}</div>`
      + `<div class="scout-note">${note}</div>`
      + `<div class="scout-roster">${roster}</div>`
      + intel;
  }

  private renderLineupEditor() {
    const tac: string[] = [`<label>Formation<select id="e-formation">${FORMATIONS.map((f) => `<option ${f === this.draftTactics.formation ? 'selected' : ''}>${f}</option>`).join('')}</select></label>`];
    (Object.keys(LEVELS) as Array<keyof typeof LEVELS>).forEach((k) => {
      tac.push(`<label>${k[0].toUpperCase() + k.slice(1)}<select id="e-${k}">${LEVELS[k].map((lab, i) => `<option value="${i - 2}" ${i - 2 === this.draftTactics[k] ? 'selected' : ''}>${lab}</option>`).join('')}</select></label>`);
    });
    $('tac-row').innerHTML = tac.join('');
    ($('e-formation') as HTMLSelectElement).addEventListener('change', (ev) => {
      this.draftTactics.formation = (ev.target as HTMLSelectElement).value as Formation;
      this.draftLineup = autoPickXI(this.availableClub(), this.draftTactics.formation);
      this.rebuildDuties();
      this.renderLineupEditor();
    });
    (Object.keys(LEVELS) as Array<keyof typeof LEVELS>).forEach((k) => {
      ($(`e-${k}`) as HTMLSelectElement).addEventListener('change', (ev) => { this.draftTactics[k] = Number((ev.target as HTMLSelectElement).value); this.updateEditorInsight(); });
    });

    const slots = this.draftLineup.playerIds;
    const benched = this.lapsed(); // NFTs unavailable via a lapsed contract or retirement — not selectable
    const usedElsewhere = (slotIdx: number) => new Set(slots.filter((_, j) => j !== slotIdx));
    $('xi').innerHTML = slots.map((pid, i) => {
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
        : isNftId(cur.id) ? `<span class="nft tier-${curTier.key}" data-card="${cur.id}" title="NFT star · ${curTier.name} tier — click to view card">${curTier.icon} ${curTier.name}</span>` : '';
      const dutyOpts = DUTIES_BY_ROLE[cur.role]
        .map((d) => `<option value="${d}" ${d === this.draftDuties[i] ? 'selected' : ''}>${DUTY_LABEL[d]}</option>`).join('');
      const rb = (role: string, on: boolean, glyph: string, title: string) => `<button class="rb ${role}${on ? ' on' : ''}" data-role="${role}" data-i="${i}" title="${title}">${glyph}</button>`;
      const badges = `<span class="role-badges">`
        + rb('cap', this.draftCaptain === i, '©', 'Captain')
        + rb('pen', this.draftTakers.pen === i, 'P', 'Penalty taker')
        + rb('fk', this.draftTakers.fk === i, 'F', 'Free-kick taker')
        + rb('corner', this.draftTakers.corner === i, 'C', 'Corner taker')
        + `</span>`;
      return `<div class="slot role-${roleForSlot}"><span class="role role-${roleForSlot}">${roleForSlot}</span><select class="player-sel" data-i="${i}">${opts}</select><select class="duty-sel" data-i="${i}" title="This player's duty — how they play">${dutyOpts}</select>${tag}<span class="ovr" style="color:${statColor(overall(cur))}">${overall(cur)}</span>${badges}</div>`;
    }).join('');
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
        this.draftDuties[Number(t.dataset.i)] = t.value as Duty;
      });
    });

    const inXI = new Set(slots);
    const bench = this.club.players.filter((p) => !inXI.has(p.id) && !this.injured.has(p.id)).sort((a, b) => overall(b) - overall(a));
    const hurt = this.club.players.filter((p) => this.injured.has(p.id)).sort((a, b) => overall(b) - overall(a));
    const injuredHtml = hurt.length ? `<div class="bench-injured"><b>🤕 Injured:</b> ` + hurt.map((p) => `<span class="inj">${p.name} (${p.role} ${overall(p)}) · ${this.injured.get(p.id)}m</span>`).join(' · ') + '</div>' : '';
    $('bench').innerHTML = `<b>Bench:</b> ` + bench.map((p) => {
      const t = isNftId(p.id) ? nftTier(overall(p)) : null;
      return t ? `<span class="bench-nft tier-${t.key}" data-card="${p.id}" title="Owned NFT · ${t.name} — click to view card">${t.icon} ${p.name} (${p.role} ${overall(p)})</span>`
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
  private rebuildDuties() { this.draftDuties = this.draftLineup.playerIds.map((_, i) => defaultDuty(this.playerAt(i))); }

  private renderSquadPanel() {
    const panel = $('squad-panel');
    const hurt = this.club.players.filter((p) => this.injured.has(p.id)).sort((a, b) => (this.injured.get(a.id)! - this.injured.get(b.id)!));
    const injHtml = hurt.length ? `<div class="squad-injured">🤕 <b>Injured:</b> ${hurt.map((p) => `${p.name} <span class="m">${this.injured.get(p.id)}m</span>`).join(' · ')}</div>` : '';
    panel.innerHTML = this.nftStatusHtml() + injHtml + statsTableHTML(this.club.players, new Set(this.draftLineup.playerIds), this.squadSort);
    panel.querySelectorAll<HTMLElement>('.ns-act').forEach((b) => b.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (b.dataset.nextend) await this.extendPlayer(b.dataset.nextend);
      else if (b.dataset.nreborn) await this.rebornPlayer(b.dataset.nreborn);
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
  // "Play" opens the lineup editor so you set a lineup + tactics for THIS match (home or away leg).
  private play(opponentId: string, handle: string, venue: 'home' | 'away' = 'home') {
    this.openLineup('match', { id: opponentId, handle, venue });
  }

  /** The current captain + set-piece-taker designations, ready to attach to a lineup / standing orders. */
  private draftRoles(): { captainIdx?: number; takers?: { pen?: number; fk?: number; corner?: number } } {
    const t = this.draftTakers;
    const hasTakers = t.pen != null || t.fk != null || t.corner != null;
    return { ...(this.draftCaptain != null ? { captainIdx: this.draftCaptain } : {}), ...(hasTakers ? { takers: { ...t } } : {}) };
  }
  private async kickOffMatch() {
    if (!this.pendingOpp) return;
    $('lineup-insight').innerHTML = '<span style="color:var(--cyan)">Playing…</span>';
    try {
      const lineup: Lineup = { ...this.draftLineup, duties: [...this.draftDuties], ...this.draftRoles() };
      const payload = await api.createMatch(this.pendingOpp.id, lineup, this.draftTactics, this.pendingOpp.venue);
      this.startMatch(payload);
    } catch (e: any) {
      if (e?.status === 429) toast('Daily match limit reached — come back tomorrow');
      else if (e?.status === 409) toast('You already played this fixture this season');
      await this.showHub();
    }
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
    this.playerAttrs = new Map();
    for (const t of [payload.home.team, payload.away.team]) {
      for (const p of t.players) this.playerAttrs.set(p.name, p.attrs);
      for (const p of (t.bench ?? [])) this.playerAttrs.set(p.name, p.attrs); // subs appear later
    }
    this.move = null;
    this.liveScore = [0, 0]; this.scorerTally = new Map(); this.lastGoalIdx = -1;
    this.attackBeats = []; this.lastMomentumMin = -99; this.lastAttackMin = 0;
    this.running = true; this.accum = 0; this.eventsShown = 0;
    this.setMatchNames();
    $('ticker').innerHTML = '';
    this.showScreen('match');
  }

  private setMatchNames() {
    $('home-name').textContent = this.homeName;
    $('away-name').textContent = this.awayName;
  }

  private async onFullTime() {
    this.running = false;
    try { this.setMe(await api.me()); } catch { /* keep old rating */ }
    // surface any injuries picked up this match (staggered so they don't overlap the result toast)
    this.lastInjuries.forEach((inj, i) => setTimeout(() => toast(`🤕 ${inj.name} injured — out ${inj.matches} match${inj.matches > 1 ? 'es' : ''}`), 800 * (i + 1)));
    this.showFullTimeCard();
  }

  /** Deterministic post-match report: a result narrative, scorers, red cards, and player of the match. */
  private renderMatchReport(events: MatchEvent[], score: [number, number]) {
    const [h, a] = score;
    const home = this.homeName, away = this.awayName;
    const goalsBy = new Map<string, { team: 0 | 1; mins: number[] }>();
    for (const e of events) if (e.type === 'goal' && e.playerName) {
      const g = goalsBy.get(e.playerName) ?? { team: e.teamIdx, mins: [] };
      g.mins.push(e.minute); goalsBy.set(e.playerName, g);
    }
    const winner = h > a ? home : a > h ? away : null;
    const loser = h > a ? away : a > h ? home : null;
    const margin = Math.abs(h - a), hi = Math.max(h, a), lo = Math.min(h, a);
    let lead: string;
    if (!winner) lead = this.cpick([`${home} and ${away} shared the points in a ${h}–${a} draw.`, `Honours even at ${h}–${a}.`, `Nothing to separate them — ${h}–${a}.`], h + a, 30);
    else {
      const verb = margin >= 3 ? this.cpick(['ran riot against', 'romped past', 'were rampant against'], margin, 31)
        : margin === 2 ? this.cpick(['saw off', 'got the better of', 'had too much for'], margin, 31)
        : this.cpick(['edged out', 'nicked it against', 'just got past'], margin, 31);
      lead = `${winner} ${verb} ${loser}, ${hi}–${lo}.`;
    }
    const reds = events.filter((e) => e.type === 'red_card').map((e) => e.playerName);
    const redLine = reds.length ? ` ${reds.join(' and ')} saw red.` : '';
    const names = [...goalsBy.entries()];
    const scLine = names.length ? 'Scorers: ' + names.map(([n, g]) => `${n} (${g.mins.map((m) => m + "'").join(', ')})`).join(' · ') : 'A goalless stalemate.';
    const assists = new Map<string, number>();
    for (const e of events) if (e.type === 'goal' && e.playerName2) assists.set(e.playerName2, (assists.get(e.playerName2) ?? 0) + 1);
    const asLine = assists.size ? `<div class="scorers">🅰 Assists: ${[...assists.entries()].map(([n, c]) => c > 1 ? `${n} ×${c}` : n).join(' · ')}</div>` : '';
    $('ft-report').innerHTML = `${lead}${redLine}<div class="scorers">${scLine}</div>${asLine}`;
    // player of the match: most goals, tie broken toward the winning side
    const winSide: 0 | 1 | null = h > a ? 0 : a > h ? 1 : null;
    names.sort((x, y) => y[1].mins.length - x[1].mins.length || (Number(y[1].team === winSide) - Number(x[1].team === winSide)));
    const potmEl = $('ft-potm');
    if (names.length) {
      const [n, g] = names[0];
      potmEl.classList.remove('hidden');
      potmEl.innerHTML = `<span class="potm-lbl">★ PLAYER OF THE MATCH</span>${n}${g.mins.length >= 2 ? ` — ${g.mins.length} goals` : ''}`;
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

    $('ft-home-name').textContent = this.homeName;
    $('ft-away-name').textContent = this.awayName;
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
      this.showHub();
    };
    const timer = setTimeout(dismiss, 9000); // longer — there's a match report to read
    card.addEventListener('click', dismiss);
  }

  // "Skip to full-time": run the deterministic engine straight to the end, flush the
  // remaining commentary (without a flurry of goal flashes/shakes), then show the card.
  private skipToEnd() {
    if (!this.engine || this.engine.state.finished) return;
    this.running = false; // stop the animated tick loop from also advancing
    while (!this.engine.state.finished) this.engine.tick();
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
    }
    this.syncMatchHud();
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
    else if (diff === 0) state = note(this.cpick(['Level again!', 'It’s all square!', 'Right back in it!'], idx, 9));
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
      ? this.cpick([`${touches} passes and counting — `, `Wonderful patience, ${team} (${touches} touches): `, `Total control from ${team} — `], touches, 7)
      : this.cpick([`${team} work it — `, `Neat from ${team}: `, `Patient build-up, ${team}: `, `${team} keep it: `], seq.length + touches, 7);
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
      case 'kickoff': text = this.cpick(['We’re underway!', 'And the match kicks off!', 'Here we go — game on!', 'The referee gets us started!'], idx, 5); break;
      case 'goal': cls = 'cm-goal'; text = this.goalLine(e, team, idx); break;
      case 'chance':
        cls = 'cm-chance';
        text = e.counter
          ? this.cpick([`They break at pace! ${p} is away for ${team}…`, `Counter-attack, ${team}! ${p} storms clear…`, `Caught square — ${p} springs the trap for ${team}…`, `On the turnover! ${p} races through…`], idx, 2)
          : this.cpick([`${p} works a yard and shapes to shoot…`, `Here come ${team} — ${p} bursts in behind!`, `Big chance! ${p} is in for ${team}…`, `${team} carve it open — ${p} with a sight of goal!`, `${p} shifts it onto his stronger foot…`, `A gap opens up and ${p} goes for it…`], idx, 2);
        if (e.counter) cls = 'cm-chance cm-counter';
        break;
      case 'shot_saved': cls = 'cm-save'; text = this.cpick([`🧤 SAVED! ${opp}’s keeper turns ${p} away!`, `🧤 Denied! A fine stop to keep ${p} out!`, `🧤 What a save — ${p} was sure he’d scored!`, `🧤 Beaten away! ${p} is foiled!`, `🧤 Big hands! ${opp} keep ${p} out!`], idx, 3); break;
      case 'shot_missed': cls = 'cm-miss'; text = this.cpick([`${p} drags it wide!`, `Off target — ${p} will want that one back.`, `${p} blazes over the bar!`, `Just past the post from ${p}!`, `Wild from ${p} — miles over!`], idx, 4); break;
      case 'tackle_won':
        if (e.zone === 'att') { // a turnover won high up the pitch — a pressing trap
          cls = 'cm-press';
          text = this.cpick([`⚡ Won high up! ${p} presses and steals it for ${team} — dangerous!`, `⚡ ${team} spring the press — ${p} robs him in the final third!`, `⚡ High turnover! ${p} nicks it right on the edge of the box!`], idx, 6);
        } else {
          cls = 'cm-tackle';
          text = this.cpick([`🦵 ${p} wins it back for ${team} ${zone}.`, `🦵 Strong challenge — ${p} nicks it for ${team} ${zone}.`, `🦵 ${p} steps in and dispossesses the man ${zone}.`, `🦵 Turnover! ${p} robs him ${zone}.`], idx, 6);
        }
        break;
      case 'fatigue': cls = 'cm-injury'; text = this.cpick([`${p} is blowing hard — the legs are going.`, `${p} looks spent, hands on hips ${zone}.`, `Tiring badly now, ${p} — running on empty.`, `${p} can barely get back — gassed.`], idx, 12); break;
      case 'woodwork': cls = 'cm-post'; text = this.cpick([`🪵 OFF THE POST! ${p} rattles the woodwork — so close!`, `🪵 OFF THE BAR! ${p} is inches away!`, `🪵 It cannons back off the upright — ${p} can't believe it!`], idx, 13); break;
      case 'loose_ball': cls = 'cm-loose'; text = this.cpick([`The ball breaks loose ${zone}.`, `Cut out! ${p}'s pass is intercepted ${zone}.`, `Scrappy — it pinballs around ${zone}.`, `${p}'s ball is cut out ${zone}.`], idx, 8); break;
      case 'foul': cls = 'cm-foul'; text = this.cpick([`Foul by ${p} ${zone}. Free kick ${team === this.homeName ? this.awayName : this.homeName}.`, `${p} catches his man — referee blows for the foul ${zone}.`, `Cynical from ${p} — that’s a free kick ${zone}.`, `${p} gives it away with a clumsy challenge ${zone}.`], idx, 14); break;
      case 'yellow_card': cls = 'cm-card yellow'; text = this.cpick([`🟨 Booked! ${p} goes into the book for that one.`, `🟨 Yellow card for ${p} — the ref had no choice.`, `🟨 ${p} is cautioned. He’ll have to be careful now.`], idx, 15); break;
      case 'red_card': cls = 'cm-card red'; text = e.zone === 'mid'
        ? this.cpick([`🟥 SECOND YELLOW — ${p} is OFF! ${team} down to ten!`, `🟥 Two yellows and gone! ${p} takes the long walk — ${team} a man light!`], idx, 16)
        : this.cpick([`🟥 RED CARD! ${p} is sent off — ${team} down to ten men!`, `🟥 Straight red for ${p}! A moment of madness — ${team} are down to ten!`, `🟥 He’s off! ${p} sees red and ${team} must dig in with ten!`], idx, 16); break;
      case 'free_kick': cls = 'cm-freekick'; text = this.cpick([`Dangerous free kick for ${team} — ${p} stands over it…`, `${p} lines up the free kick in a promising spot…`, `Chance from the set piece — ${p} to deliver for ${team}…`], idx, 17); break;
      case 'penalty': cls = 'cm-pen'; text = this.cpick([`⚠️ PENALTY to ${team}! ${p} will take it…`, `⚠️ The ref points to the spot — penalty ${team}! ${p} steps up…`, `⚠️ Spot kick for ${team}! It’s down to ${p}…`], idx, 18); break;
      case 'penalty_missed': cls = 'cm-miss'; text = this.cpick([`❌ MISSED! ${p} sends the penalty wide — what a let-off!`, `❌ Saved! The keeper guesses right and denies ${p} from the spot!`, `❌ ${p} blazes the penalty over! He’ll never forget that.`], idx, 19); break;
      case 'corner': cls = 'cm-corner'; text = this.cpick([`Corner to ${team} — ${p} to swing it in…`, `${p} jogs over to take the corner for ${team}…`], idx, 20); break;
      case 'injury': cls = 'cm-injury'; text = this.cpick([`🚑 ${p} is down and hurt — he can’t continue for ${team}.`, `🚑 Trouble for ${team} — ${p} has pulled up injured.`, `🚑 ${p} signals to the bench; that’s him done for the day.`], idx, 23); break;
      case 'sub': { const off = e.playerName2 ?? 'a teammate'; cls = 'cm-sub'; text = this.cpick([`🔄 Change for ${team}: ${e.playerName} comes on for ${off}.`, `🔄 ${team} go to the bench — ${e.playerName} replaces ${off}.`, `🔄 Fresh legs for ${team}: ${off} off, ${e.playerName} on.`], idx, 24); break; }
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
function matchFrame(now: number) {
  // clamp the delta so a backgrounded/stalled tab can't fast-forward the sim in one giant step
  const dMs = Math.min(now - lastFrameMs, 100);
  lastFrameMs = now;
  GAME.onFrame(dMs);
  requestAnimationFrame(matchFrame);
}
requestAnimationFrame(matchFrame);
