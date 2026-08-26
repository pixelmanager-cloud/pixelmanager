import Phaser from 'phaser';
import {
  MatchEngine, autoPickXI, buildXI, overall, PITCH, TICK_SEC, defaultDuty, DUTY_LABEL, DUTIES_BY_ROLE, isDutyForRole,
  TACTIC_PRESETS, type Tactics, type Formation, type MatchEvent, type Team, type Club, type Lineup, type Player, type Duty,
} from '@fm/shared';
import { SCALE, makeBallTexture, makeBallGhostTexture, makePitchTexture, makePlayerFrames, makeShadowTexture, makeCarrierTexture } from './pixelart';
import { api, hasToken, setToken, clearToken, type Account, type StandingOrders, type MatchPayload, type TableRow, type ResultRow, type HonourRow, type Scout, type Trialist, type MarketListing, type CupData, type MissionsData, type ContractInfo } from './api';
import { walletConfigured, nftConfigured, sendEmailCode, connectEmail, connectInjected, autoConnectInApp, signMessage, claimTokens, mintPlayer, mintScout, type Account as WalletAccount } from './wallet';

const W = PITCH.w * SCALE, H = PITCH.h * SCALE;

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
    const cells = cols.map(([, k]) => `<td class="stat" style="background:${statColor(p.attrs[k] ?? 0)}">${p.attrs[k] ?? 0}</td>`).join('');
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
  scene?: MatchScene;
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
  editorMode: 'standing' | 'match' = 'standing';
  squadSort: SquadSort | null = null;
  pendingOpp?: { id: string; handle: string; venue: 'home' | 'away' };
  mySide: 0 | 1 = 0;   // which team index (0 home / 1 away) is the player in the current match
  homeName = '';
  awayName = '';

  async boot() {
    this.wireStaticButtons();
    this.wireWallet();
    if (hasToken()) {
      try { this.setMe(await api.me()); await this.showHub(); return; }
      catch { clearToken(); }
    }
    this.showScreen('login');
  }

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

  private showScreen(s: 'login' | 'hub' | 'lineup' | 'match' | 'standings' | 'scouting' | 'market' | 'club' | 'academy') {
    for (const id of ['login', 'hub', 'lineup', 'matchwrap', 'standings', 'scouting', 'market', 'club', 'academy']) $(id).classList.toggle('hidden', id !== (s === 'match' ? 'matchwrap' : s));
    $('logout').classList.toggle('hidden', s === 'login');
    if (s !== 'scouting' && this.missionTimer) { clearInterval(this.missionTimer); this.missionTimer = null; } // stop the mission countdown when leaving
  }

  private wireStaticButtons() {
    const setSpeed = (v: number, id: string) => { this.speed = v; ['spd1', 'spd4', 'spd12'].forEach((b) => $(b).classList.remove('active')); $(id).classList.add('active'); };
    $('toggle-2d').addEventListener('click', () => {
      const game = $('game'); const on = game.classList.toggle('hidden') === false;
      $('toggle-2d').classList.toggle('on', on);
    });
    $('spd1').addEventListener('click', () => setSpeed(1, 'spd1'));
    $('spd4').addEventListener('click', () => setSpeed(4, 'spd4'));
    $('spd12').addEventListener('click', () => setSpeed(12, 'spd12'));
    $('register-btn').addEventListener('click', () => this.doRegister());
    $('login-btn').addEventListener('click', () => this.doLogin());
    $('handle-input').addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') $('password-input').focus(); });
    $('password-input').addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') this.doLogin(); });
    $('logout').addEventListener('click', () => { clearToken(); this.showScreen('login'); });
    $('view-standings').addEventListener('click', () => this.showStandings());
    $('standings-back').addEventListener('click', () => this.showHub());
    $('view-scouting').addEventListener('click', () => this.showScouting());
    $('scouting-back').addEventListener('click', () => this.showHub());
    $('view-market').addEventListener('click', () => this.showMarket());
    $('view-academy').addEventListener('click', () => this.showAcademy());
    $('academy-back').addEventListener('click', () => this.showHub());
    $('market-back').addEventListener('click', () => this.showHub());
    $('view-club').addEventListener('click', () => this.showClub());
    $('club-back').addEventListener('click', () => this.showHub());
    $('sell-btn').addEventListener('click', () => this.sellPlayer());
    const showTab = (tab: 'results' | 'cup' | 'honours') => {
      $('results-feed').classList.toggle('hidden', tab !== 'results');
      $('cup-feed').classList.toggle('hidden', tab !== 'cup');
      $('honours-feed').classList.toggle('hidden', tab !== 'honours');
      $('tab-results').classList.toggle('active', tab === 'results');
      $('tab-cup').classList.toggle('active', tab === 'cup');
      $('tab-honours').classList.toggle('active', tab === 'honours');
      if (tab === 'cup') void this.loadCup();
    };
    $('tab-results').addEventListener('click', () => showTab('results'));
    $('tab-cup').addEventListener('click', () => showTab('cup'));
    $('tab-honours').addEventListener('click', () => showTab('honours'));
    $('skip').addEventListener('click', () => this.skipToEnd());
    $('set-team').addEventListener('click', () => this.openLineup('standing'));
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

  // ---- login ----
  private creds(): { handle: string; password: string } {
    return { handle: ($('handle-input') as HTMLInputElement).value.trim(), password: ($('password-input') as HTMLInputElement).value };
  }

  private async doRegister() {
    const { handle, password } = this.creds();
    $('login-error').textContent = '';
    if (password.length < 4) { $('login-error').textContent = 'Pick a password of at least 4 characters.'; return; }
    try {
      const r = await api.register(handle, password);
      setToken(r.token);
      this.setMe({ account: r.account, club: r.club, standingOrders: r.standingOrders });
      await this.showHub();
    } catch (e: any) {
      $('login-error').textContent = e?.status === 409 ? 'Handle already taken — log in instead, or pick another.'
        : e?.status === 400 ? 'Handle must be 2–20 chars and password 4–64.'
        : 'Could not reach the server. Is it running?';
    }
  }

  private async doLogin() {
    const { handle, password } = this.creds();
    $('login-error').textContent = '';
    if (!handle || password.length < 4) { $('login-error').textContent = 'Enter your handle and password.'; return; }
    try {
      const r = await api.login(handle, password);
      setToken(r.token);
      this.setMe({ account: r.account, club: r.club, standingOrders: r.standingOrders });
      await this.showHub();
    } catch (e: any) {
      $('login-error').textContent = e?.status === 401 ? 'Wrong handle or password.'
        : e?.status === 404 ? 'That account has no club — try creating one.'
        : 'Could not reach the server. Is it running?';
    }
  }

  // ---- wallet sign-in (web3 Step 1) ----
  private wireWallet() {
    const hint = $('wallet-hint');
    if (!walletConfigured()) {
      // still show the buttons, but explain they need a thirdweb clientId
      hint.innerHTML = 'Wallet sign-in needs <code>VITE_THIRDWEB_CLIENT_ID</code> — set it to enable email/browser-wallet login.';
    }
    $('wallet-injected-btn').addEventListener('click', () => this.walletFlow(() => connectInjected()));
    $('wallet-email-btn').addEventListener('click', () => {
      $('wallet-email-flow').classList.toggle('hidden');
    });
    // email is two steps: "Send code" → "Verify & sign in"
    let codeSent = false;
    $('wallet-email-go').addEventListener('click', async () => {
      const email = ($('wallet-email') as HTMLInputElement).value.trim();
      if (!email) { toast('Enter your email'); return; }
      const btn = $('wallet-email-go') as HTMLButtonElement;
      if (!codeSent) {
        btn.disabled = true; $('wallet-hint').textContent = 'Sending code…';
        try { await sendEmailCode(email); codeSent = true; $('wallet-code').classList.remove('hidden'); btn.textContent = 'Verify & sign in'; $('wallet-hint').textContent = 'Enter the code we emailed you.'; }
        catch (e: any) { $('wallet-hint').textContent = e?.message ?? 'Could not send code.'; }
        finally { btn.disabled = false; }
      } else {
        const code = ($('wallet-code') as HTMLInputElement).value.trim();
        if (!code) { toast('Enter the code'); return; }
        await this.walletFlow(() => connectEmail(email, code));
      }
    });
    $('link-wallet').addEventListener('click', () => this.walletFlow(() => connectInjected(), true));
    $('faucet-btn').addEventListener('click', () => this.claimFaucet());
    $('mint-player').addEventListener('click', () => this.mintStarPlayer());
  }

  /** Mint a star PlayerNFT with the linked wallet; it then shows up in the squad. */
  private async mintStarPlayer() {
    const linked = this.account.wallet;
    if (!linked) { toast('Link a wallet first'); return; }
    const short = `${linked.slice(0, 6)}…${linked.slice(-4)}`;
    const btn = $('mint-player') as HTMLButtonElement;
    const prev = btn.textContent;
    btn.disabled = true;
    try {
      btn.textContent = 'Connecting…';
      let signer = await autoConnectInApp();
      if (!signer || signer.address.toLowerCase() !== linked) {
        const injected = await connectInjected().catch(() => null);
        if (injected) signer = injected;
      }
      if (!signer) { toast('Connect a wallet to mint'); return; }
      if (signer.address.toLowerCase() !== linked) { toast(`Connect the wallet linked to this club (${short})`); return; }
      const before = new Set(this.club.players.filter((p) => p.id.startsWith('nft:')).map((p) => p.id));
      btn.textContent = 'Minting…';
      await mintPlayer(signer);
      // the tx is mined; give the RPC a couple tries to reflect the new token, then name it
      btn.textContent = 'Revealing…';
      let minted: typeof this.club.players[number] | undefined;
      for (let attempt = 0; attempt < 5 && !minted; attempt++) {
        this.setMe(await api.me());
        minted = this.club.players.filter((p) => p.id.startsWith('nft:') && !before.has(p.id)).sort((a, b) => overall(b) - overall(a))[0];
        if (!minted) await new Promise((r) => setTimeout(r, 1500));
      }
      await this.showHub();
      if (minted) this.showPlayerCard(minted, true);
      else toast('Minted ✓ — your ★ NFT star will appear in Set My Team shortly');
    } catch (e: any) {
      const m = String(e?.message ?? '');
      toast(/insufficient|funds|gas/i.test(m) ? `${short} needs Base Sepolia ETH for gas` : ((e?.shortMessage ?? m) || 'Mint failed'));
    } finally { btn.disabled = false; btn.textContent = prev; }
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
    const stats = order.map(([k, l]) => `<div class="pc-stat"><span>${l}</span><b style="color:${statColor(p.attrs[k] ?? 0)}">${p.attrs[k] ?? 0}</b></div>`).join('');
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
      + (minted ? `<div class="pc-flash">${tier.icon} ${tier.name} STAR MINTED</div>` : '')
      + `<div class="pc-top"><div class="pc-ovr">${overall(p)}<span>OVR</span></div>`
      + `<div class="pc-tier">${tier.icon}<span>${tier.name}</span></div></div>`
      + `<div class="pc-crest role-${p.role}"><span class="pc-crest-role">${p.role}</span></div>`
      + `<div class="pc-name">${p.name}</div>`
      + `<div class="pc-role">${roleName[p.role] ?? p.role}</div>`
      + `<div class="pc-stats">${stats}</div>`
      + this.characterHtml(p)
      + contractHtml
      + `<div class="pc-foot">★ NFT${tokenId ? ` · #${tokenId}` : ''} · Base Sepolia · on-chain</div>`
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

  /** A prospect card — a 10-year-old awaiting development in the Career game (Layer 1). */
  private showProspectCard(p: import('./api').Prospect, born = false) {
    const stars = '★'.repeat(p.potentialStars) + '☆'.repeat(5 - p.potentialStars);
    const isGenesis = (p.generation ?? 0) === 0;
    const el = document.createElement('div');
    el.id = 'player-card-ov';
    el.innerHTML = `<div class="pc-card tier-bronze">`
      + `<div class="pc-top"><div class="pc-ovr">10<span>YRS</span></div><div class="pc-tier">🌱<span>PROSPECT</span></div></div>`
      + `<div class="pc-crest role-${p.roleHint}"><span class="pc-crest-role">${p.roleHint}</span></div>`
      + `<div class="pc-name">${p.name}</div><div class="pc-role">Youth Prospect${p.generation ? ` · gen ${p.generation}` : ''}</div>`
      + (born ? `<div class="pc-flash">${isGenesis ? '🌱 GENESIS PROSPECT MINTED' : '🌱 NEXT GENERATION BORN'}</div>` : '')
      + `<div class="pc-contract retired"><div class="pc-legend">Potential ${stars} · pedigree ${(p.pedigree * 100 | 0)}%</div>`
      + (p.note ? `<div class="pc-stake">${p.note}</div>` : '')
      + `<div class="pc-stake">Develops 10→25 in the Career game (coming soon)</div></div>`
      + `<div class="pc-foot">★ Prospect NFT · to be developed · on-chain</div>`
      + `<button class="pc-close">${born ? 'Nice ✓' : 'Close'}</button></div>`;
    el.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t === el || t.classList.contains('pc-close')) el.remove(); });
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
  private characterHtml(p: Player): string {
    const pers = (p as any).personality as string | undefined;
    const traits = ((p as any).traits as string[] | undefined) ?? [];
    const greed = (p as any).greed as number | undefined;
    const market = (p as any).marketability as number | undefined;
    const earnings = (p as any).earnings as number | undefined;
    if (!pers && !traits.length && greed == null) return ''; // base players have no character layer
    const PERS: Record<string, string> = { pro: 'Model Pro', biggame: 'Big-Game Player', fragile: 'Fragile', leader: 'Born Leader', workhorse: 'Workhorse', mercurial: 'Mercurial', maverick: 'Maverick' };
    const TRAIT: Record<string, string> = { clinical: 'Clinical Finisher', ballwinner: 'Ball-Winner', metronome: 'Metronome', maestro: 'Creative Maestro', leader: 'Born Leader', livewire: 'Livewire', ironman: 'Iron Man', deadball: 'Dead-Ball Spec.', wall: 'The Wall', biggame: 'Big-Game', injury_prone: 'Injury-Prone', mercenary: 'Mercenary', loyal: 'One-Club Man', marketable: 'Marketable' };
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

  private async refreshTokenBalance() {
    try {
      const t = await api.tokenBalance();
      $('me-token').textContent = t.balance != null ? `💠 ${Number(t.balance).toLocaleString()} ${t.symbol}` : `💠 — ${t.symbol}`;
    } catch { $('me-token').textContent = '💠 —'; }
  }

  /** Faucet: claim test tokens with the wallet that's actually LINKED to this club. */
  private async claimFaucet() {
    const linked = this.account.wallet;
    if (!linked) { toast('Link a wallet first'); return; }
    const short = `${linked.slice(0, 6)}…${linked.slice(-4)}`;
    const btn = $('faucet-btn') as HTMLButtonElement;
    const prev = btn.textContent;
    btn.disabled = true;
    try {
      btn.textContent = 'Connecting…';
      // find the connected wallet that matches the linked address (so tokens + gas + limit all line up)
      let signer = await autoConnectInApp();
      if (!signer || signer.address.toLowerCase() !== linked) {
        const injected = await connectInjected().catch(() => null);
        if (injected) signer = injected;
      }
      if (!signer) { toast('Connect a wallet to claim'); return; }
      if (signer.address.toLowerCase() !== linked) {
        toast(`Connect the wallet linked to this club (${short}) to claim`);
        return;
      }
      btn.textContent = 'Claiming…';
      await claimTokens(signer, '1000'); // recipient = signer = the linked wallet
      toast('Claimed 1000 test tokens ✓');
      await this.refreshTokenBalance();
    } catch (e: any) {
      const m = String(e?.message ?? '');
      toast(/insufficient|funds|gas/i.test(m) ? `${short} needs a little Base Sepolia ETH for gas` : ((e?.shortMessage ?? m) || 'Claim failed'));
    } finally { btn.disabled = false; btn.textContent = prev; }
  }

  /** Connect → sign the server nonce → verify (sign in) or link to the current account. */
  private async walletFlow(connect: () => Promise<WalletAccount>, link = false) {
    try {
      $('wallet-hint').textContent = 'Opening wallet…';
      const account = await connect();
      const { message } = await api.walletNonce(account.address);
      const signature = await signMessage(account, message);
      if (link) {
        const r = await api.walletLink(account.address, signature);
        toast(`Wallet linked ✓`);
        this.setMe(await api.me());
        await this.showHub();
        void r;
      } else {
        const r = await api.walletVerify(account.address, signature);
        setToken(r.token);
        this.setMe({ account: r.account, club: r.club, standingOrders: r.standingOrders });
        await this.showHub();
      }
    } catch (e: any) {
      const msg = e?.body?.error ?? e?.message ?? 'Wallet sign-in failed.';
      $('wallet-hint').textContent = msg;
      if (link) toast(msg);
    }
  }

  // ---- hub ----
  private async showHub() {
    this.showScreen('hub');
    $('me-name').textContent = this.club.name;
    $('me-rating').textContent = `RATING ${this.account.rating}`;
    const w = this.account.wallet;
    $('me-wallet').classList.toggle('hidden', !w);
    if (w) $('me-wallet').textContent = `🔗 ${w.slice(0, 6)}…${w.slice(-4)}`;
    $('link-wallet').classList.toggle('hidden', !!w); // offer linking only when none is set
    $('faucet-btn').classList.add('hidden'); // self-serve faucet deferred (plain token has no claim); distribute via airdrop/transfer on testnet
    $('mint-player').classList.toggle('hidden', !(w && nftConfigured())); // mint a star once a wallet is linked + NFT deployed
    $('me-token').classList.toggle('hidden', !w);
    if (w) void this.refreshTokenBalance();
    if (this.account.coins != null) $('me-coins').textContent = `💰 ${this.account.coins}`;
    void this.refreshPrestige();
    $('fixtures-progress').textContent = '';
    $('opponents').innerHTML = SPINNER;
    try {
      const { fixtures, played, total, playedToday, dailyCap } = await api.fixtures();
      const capped = playedToday >= dailyCap;
      $('fixtures-progress').textContent = total ? `${played} / ${total} played · ${playedToday}/${dailyCap} today` : '';
      if (!total) {
        $('opponents').innerHTML = '<div class="muted">No pod-mates yet — as players join your pod, fixtures appear here. (Register another handle in a second browser to test.)</div>';
      } else {
        $('opponents').innerHTML = fixtures.map((f) => {
          const vb = `<span class="venue ${f.venue}" title="${f.venue === 'home' ? 'Home' : 'Away'} fixture">${f.venue === 'home' ? 'HOME' : 'AWAY'}</span>`;
          if (f.status === 'played' && f.result) {
            const { my, opp } = f.result;
            const cls = my > opp ? 'w' : my < opp ? 'l' : 'd';
            return `<div class="fixture done">${vb} <span class="opp"><b>${f.clubName}</b></span><span class="pill ${cls}">${cls.toUpperCase()} ${my}-${opp}</span></div>`;
          }
          const btn = capped
            ? '<button class="fx-play" disabled title="Daily limit reached — come back tomorrow">Play ▶</button>'
            : `<button class="fx-play" data-opp="${f.opponentId}" data-h="${f.handle}" data-venue="${f.venue}">Play ▶</button>`;
          return `<div class="fixture">${vb} <span class="opp"><b>${f.clubName}</b> <span class="meta">rating ${f.rating}</span></span>${btn}</div>`;
        }).join('');
        Array.from($('opponents').querySelectorAll('button[data-opp]')).forEach((b) =>
          b.addEventListener('click', () => this.play((b as HTMLElement).dataset.opp!, (b as HTMLElement).dataset.h!, (b as HTMLElement).dataset.venue as 'home' | 'away')));
        if (played === total) $('opponents').insertAdjacentHTML('beforeend', '<div class="muted" style="margin-top:8px">✓ All fixtures played — standings lock in at season\'s end.</div>');
        else if (capped) $('opponents').insertAdjacentHTML('beforeend', `<div class="muted" style="margin-top:8px">⏳ Daily limit reached (${playedToday}/${dailyCap}) — more fixtures tomorrow.</div>`);
      }
    } catch {
      $('opponents').innerHTML = '<div class="muted">Could not load — is the server running?</div>';
    }
  }

  // ---- standings / results page ----
  private async showStandings() {
    this.showScreen('standings');
    $('standings-table').innerHTML = SPINNER;
    $('results-feed').innerHTML = '';
    $('honours-feed').innerHTML = '';
    try {
      const [st, res, hon] = await Promise.all([api.standings(), api.results(), api.honours()]);
      $('season-banner').innerHTML = `<b>${st.tier}</b> · Pod ${st.pod + 1} · Season ${st.season.number} · ends in ${humanizeMs(st.season.endsAt - Date.now())}`;
      $('standings-table').innerHTML = this.renderLeagueTable(st.table, { promote: st.promote, relegate: st.relegate });
      $('results-feed').innerHTML = this.renderResults(res.results);
      $('honours-feed').innerHTML = this.renderHonours(hon.honours);
    } catch {
      $('season-banner').textContent = '';
      $('standings-table').innerHTML = '<div class="muted">Could not load — is the server running?</div>';
    }
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
      this.renderScoutPanel(st.opp, st.player, st.nft.enabled);
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
      const { prospects, supply, cap } = await api.prospects();
      const intro = `<div class="scout-sub">Your youth prospects — 10-year-olds to <b>develop</b> through a career (age 10→25): play to each chapter's demands, appoint coaches, and make the big calls. At 25 the SAME NFT graduates into a pro you can field. Mint a fresh genesis prospect, or breed one by retiring a player and choosing <b>Reborn</b>. <span style="color:var(--muted);">· fixed supply: <b>${supply.toLocaleString()}</b> / ${cap.toLocaleString()} minted</span></div>`
        + `<div style="margin:10px 0 14px;"><button id="mint-genesis" class="primary">🌱 Mint a genesis prospect · 300c</button></div>`;
      const rows = prospects.length ? prospects.map((p) => {
        const stars = '★'.repeat(p.potentialStars) + '☆'.repeat(5 - p.potentialStars);
        const gen = p.generation ? ` · gen ${p.generation}` : '';
        const btn = `<button class="primary" data-dev="${p.id}">${p.careerStarted ? 'Continue' : 'Develop'} →</button>`;
        return `<div class="prospect-row"><div><div class="pr-name">🌱 ${p.name} <span class="pr-stars">${stars}</span></div>`
          + `<div class="pr-meta">${p.roleHint}${gen} · pedigree ${(p.pedigree * 100) | 0}% ${p.careerStarted ? '· in development' : '· age 10, ready to develop'}</div></div>${btn}</div>`;
      }).join('') : '<div class="muted">No prospects yet — mint a genesis prospect above to begin.</div>';
      const { legends } = await api.legends().catch(() => ({ legends: [] as any[] }));
      const hall = legends.length ? `<h4 class="scout-h4" style="margin-top:22px;">🏅 HALL OF LEGENDS</h4>`
        + `<div class="scout-sub">The great careers your bloodlines have had — one card per retirement.</div>`
        + `<div class="legends-grid">` + legends.map((l: any) => `<div class="legend-card"><div class="lc-top">${l.card.icon} <b>${l.card.tier}</b></div>`
          + `<div class="lc-name">${l.name}</div><div class="lc-meta">${l.card.role} · rating ${l.card.legendRating}</div>`
          + `<div class="lc-honours">${l.card.leagueTitles}🏅 ${l.card.cupTitles}🏆 · ${l.card.apps} apps · ${l.card.seasons} seasons</div>`
          + `<div class="lc-note">${l.card.note}</div></div>`).join('') + `</div>` : '';
      $('academy-body').innerHTML = intro + rows + hall;
      $('mint-genesis').addEventListener('click', () => this.mintGenesis());
      $('academy-body').querySelectorAll('[data-dev]').forEach((b) => b.addEventListener('click', () => this.openCareer((b as HTMLElement).dataset.dev!)));
    } catch { $('academy-body').innerHTML = '<div class="muted">Could not load — is the server running?</div>'; }
  }

  private async mintGenesis() {
    try {
      const r = await api.genesis();
      if (r.coins != null) this.account.coins = r.coins;
      toast(`🌱 ${r.prospect.name} minted (−${r.cost}c) — ${r.supply}/${r.cap} in the economy`);
      this.showProspectCard(r.prospect, true);
      await this.showAcademy();
    } catch (e: any) { toast(e?.body?.error === 'supply cap reached' ? 'Supply cap reached — no new tokens' : e?.body?.error === 'not enough coins' ? `Not enough coins (need ${e.body.need})` : (e?.body?.error ?? 'Mint failed')); }
  }

  private async openCareer(prospectId: string) {
    this.lastNarration = '';
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
  private renderCareer(s: import('./api').CareerState) {
    const pct = Math.round((s.turn / s.totalTurns) * 100);
    const head = `<div class="cg-head"><button id="cg-back">←</button><span class="cg-age">${s.name} · age ${s.age}</span>`
      + `<span class="cg-chapter">${s.chapter}</span><div class="cg-bar"><i style="width:${pct}%"></i></div><span class="pr-meta">${s.turn}/${s.totalTurns}</span></div>`;
    const evt = s.seasonEvent ? `<div class="cg-event"><b>${s.seasonEvent.name}</b> — ${s.seasonEvent.desc}</div>` : '';
    const prof = s.profile ? this.careerProfileHtml(s.profile) : '';
    const narr = this.lastNarration && s.phase === 'play' ? `<div class="cg-narrate">“${this.lastNarration}”</div>` : '';
    let body = '';
    if (s.phase === 'play' && s.scenario) {
      const tags = Object.entries(s.scenario.demand).sort((a, b) => b[1] - a[1]).map(([t]) => `<span class="cg-tag">${t}</span>`).join('');
      body = `<div class="cg-scenario stakes-${s.scenario.stakes}"><div class="cg-story">${s.story ?? s.scenario.label}</div><div class="cg-demand">${tags}</div></div>`
        + `<div class="cg-prompt">How does he respond?${s.coach ? ` · <b>${s.coach.name}</b> is coaching him` : ''}</div>`
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
    }
    $('academy-body').innerHTML = head + prof + narr + evt + body;
    $('cg-back').addEventListener('click', () => this.showAcademy());
    $('academy-body').querySelectorAll('[data-act]').forEach((el) => el.addEventListener('click', () => this.doCareerAct(s.prospectId, { type: (el as HTMLElement).dataset.act!, cardId: (el as HTMLElement).dataset.id! })));
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
  private async doCareerAct(prospectId: string, action: { type: string; cardId: string }) {
    try {
      const r = await api.careerAct(prospectId, action);
      this.lastNarration = r.narration ?? '';
      if (r.graduated && r.player) {
        this.setMe(await api.me());
        if (this.lastNarration) toast(this.lastNarration);
        toast(`🎓 ${r.player.name} graduates as a pro!`);
        this.showPlayerCard(r.player, true);
        this.showAcademy();
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
      const action = signed ? '<span class="tr-done" style="font-family:var(--body);font-size:14px;color:var(--good)">✓ Signed</span>'
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

  /** Fill the "Your Scouts" cards with live tiers + wire the free scout-mint upgrade buttons. */
  private renderScoutPanel(opp: string, player: string, nftEnabled: boolean) {
    const ORDER = ['base', 'bronze', 'silver', 'gold'];
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
    const wireMint = (btnId: string, track: 'opp' | 'player', tier: string) => {
      const btn = $(btnId) as HTMLButtonElement;
      const i = ORDER.indexOf(tier);
      const next = i >= 0 && i < 3 ? ORDER[i + 1] : null;
      if (!nftEnabled || !this.account.wallet || !next) { btn.classList.add('hidden'); return; }
      const id = (track === 'opp' ? 1 : 4) + i; // opp:1/2/3  player:4/5/6
      btn.classList.remove('hidden');
      btn.textContent = `★ Mint ${next.toUpperCase()} scout — free`;
      btn.onclick = () => this.mintScoutTier(btnId, id);
    };
    wireMint('mint-opp', 'opp', opp);
    wireMint('mint-player-scout', 'player', player);
    $('scout-hint').textContent = nftEnabled
      ? 'Mint scout NFTs (free on testnet) to unlock deeper opposition intel + rarer trialists.'
      : 'Higher scout tiers unlock once the Scout NFT contract is live.';
  }

  private async mintScoutTier(btnId: string, id: number) {
    const btn = $(btnId) as HTMLButtonElement;
    const prev = btn.textContent;
    btn.disabled = true;
    try {
      btn.textContent = 'Connecting…';
      const signer = await this.connectLinkedWallet();
      if (!signer) return;
      btn.textContent = 'Minting…';
      await mintScout(signer, id);
      toast('Scout upgraded ✓');
      await this.showScouting(); // re-reads tiers (higher now) + re-rolls the trial pool at the new tier
    } catch (e: any) {
      const m = String(e?.message ?? '');
      toast(/insufficient|funds|gas/i.test(m) ? 'Wallet needs Base Sepolia ETH for gas' : ((e?.shortMessage ?? m) || 'Mint failed'));
    } finally { btn.disabled = false; btn.textContent = prev; }
  }

  /** Connect the wallet that's linked to this club (resume email session, else injected). */
  private async connectLinkedWallet(): Promise<WalletAccount | null> {
    const linked = this.account.wallet;
    if (!linked) { toast('Link a wallet first'); return null; }
    let signer = await autoConnectInApp();
    if (!signer || signer.address.toLowerCase() !== linked) {
      const injected = await connectInjected().catch(() => null);
      if (injected) signer = injected;
    }
    if (!signer) { toast('Connect a wallet'); return null; }
    if (signer.address.toLowerCase() !== linked) { toast(`Connect the wallet linked to this club (${linked.slice(0, 6)}…${linked.slice(-4)})`); return null; }
    return signer;
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
      return `<div class="slot role-${roleForSlot}"><span class="role role-${roleForSlot}">${roleForSlot}</span><select class="player-sel" data-i="${i}">${opts}</select><select class="duty-sel" data-i="${i}" title="This player's duty — how they play">${dutyOpts}</select>${tag}<span class="ovr" style="color:${statColor(overall(cur))}">${overall(cur)}</span></div>`;
    }).join('');
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
    };
    try { const r = await api.setStandingOrders(so); this.standingOrders = r.standingOrders; toast('Team saved ✓'); await this.showHub(); }
    catch { $('lineup-insight').innerHTML = '<span style="color:var(--home)">Could not save — check your XI.</span>'; }
  }

  // ---- match ----
  // "Play" opens the lineup editor so you set a lineup + tactics for THIS match (home or away leg).
  private play(opponentId: string, handle: string, venue: 'home' | 'away' = 'home') {
    this.openLineup('match', { id: opponentId, handle, venue });
  }

  private async kickOffMatch() {
    if (!this.pendingOpp) return;
    $('lineup-insight').innerHTML = '<span style="color:var(--cyan)">Playing…</span>';
    try {
      const lineup: Lineup = { ...this.draftLineup, duties: [...this.draftDuties] };
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
    this.running = true; this.accum = 0; this.eventsShown = 0;
    this.setMatchNames();
    $('ticker').innerHTML = '';
    this.scene!.buildSprites(this.engine.teams);
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
    const timer = setTimeout(dismiss, 4500);
    card.addEventListener('click', dismiss);
  }

  // "Skip to full-time": run the deterministic engine straight to the end, flush the
  // remaining commentary (without a flurry of goal flashes/shakes), then show the card.
  private skipToEnd() {
    if (!this.engine || this.engine.state.finished) return;
    this.running = false; // stop the animated tick loop from also advancing
    while (!this.engine.state.finished) this.engine.tick();
    this.silent = true;
    this.scene!.sync(this.engine.state);
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
    this.scene!.sync(this.engine.state);
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
  /** Deterministic pick from the match seed + event index + a salt — so a replay commentates identically. */
  private cpick<T>(arr: T[], idx: number, salt: number): T {
    let h = (this.matchSeed ^ Math.imul(idx + 1, 374761393) ^ Math.imul(salt, 2246822519)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); h ^= h >>> 16;
    return arr[(h >>> 0) % arr.length];
  }
  private pushTicker(e: MatchEvent) {
    const idx = this.eventsShown; // stable per event
    const team = e.teamIdx === 0 ? this.homeName : this.awayName;
    const opp = e.teamIdx === 0 ? this.awayName : this.homeName;
    const p = e.playerName ?? 'someone';
    const min = `<span class="cm-min">${e.minute}'</span>`;
    const sc = this.engine?.state.score ?? [0, 0];
    let text = '', cls = '';
    switch (e.type) {
      case 'kickoff': text = this.cpick(['We’re underway!', 'And the match kicks off!', 'Here we go — game on!', 'The referee gets us started!'], idx, 5); break;
      case 'goal': cls = 'cm-goal'; text = this.cpick([`⚽ GOAL! ${p} buries it for ${team}!`, `⚽ IT’S IN! ${p} finishes it off — ${team}!`, `⚽ GOAL! What a strike from ${p}! ${team} score!`, `⚽ ${p} makes no mistake — ${team}!`, `⚽ GET IN! ${p} lashes it home for ${team}!`, `⚽ Clinical from ${p} — ${team} find the net!`], idx, 1) + ` <span class="cm-score">${sc[0]}–${sc[1]}</span>`; break;
      case 'chance': cls = 'cm-chance'; text = this.cpick([`${p} works a yard and shapes to shoot…`, `Here come ${team} — ${p} bursts in behind!`, `Big chance! ${p} is in for ${team}…`, `${team} carve it open — ${p} with a sight of goal!`, `${p} shifts it onto his stronger foot…`, `A gap opens up and ${p} goes for it…`], idx, 2); break;
      case 'shot_saved': cls = 'cm-save'; text = this.cpick([`🧤 SAVED! ${opp}’s keeper turns ${p} away!`, `🧤 Denied! A fine stop to keep ${p} out!`, `🧤 What a save — ${p} was sure he’d scored!`, `🧤 Beaten away! ${p} is foiled!`, `🧤 Big hands! ${opp} keep ${p} out!`], idx, 3); break;
      case 'shot_missed': cls = 'cm-miss'; text = this.cpick([`${p} drags it wide!`, `Off target — ${p} will want that one back.`, `${p} blazes over the bar!`, `Just past the post from ${p}!`, `Wild from ${p} — miles over!`], idx, 4); break;
      case 'halftime': cls = 'cm-break'; text = `⏸ Half-time. ${this.homeName} ${sc[0]}–${sc[1]} ${this.awayName}.`; break;
      case 'fulltime': cls = 'cm-break'; text = `🏁 Full-time! ${this.homeName} ${sc[0]}–${sc[1]} ${this.awayName}.`; break;
    }
    const div = document.createElement('div');
    div.className = `cm-line ${cls}`;
    div.innerHTML = `${min} ${text}`;
    if (e.type === 'goal' && !this.silent) this.celebrateGoal(e);
    const feed = $('ticker');
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight; // auto-scroll to the newest line
  }

  private celebrateGoal(e: MatchEvent) {
    const el = $('goal-flash');
    el.textContent = `⚽ GOAL!  ${e.teamIdx === 0 ? this.homeName : this.awayName}`;
    el.classList.remove('show');
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('show');
    this.scene?.goalShake();
  }
}

class MatchScene extends Phaser.Scene {
  private sprites: Phaser.GameObjects.Image[][] = [[], []];
  private ppos: { x: number; y: number }[][] = [[], []]; // lerped ground positions (the running bob lifts only the drawn sprite, not the shadow)
  private shadows: Phaser.GameObjects.Image[][] = [[], []];
  private ballSprite!: Phaser.GameObjects.Image;
  private ballShadow!: Phaser.GameObjects.Image;
  private carrierRing!: Phaser.GameObjects.Image;
  private ballTrail: Phaser.GameObjects.Image[] = []; // fading ghosts behind the ball (visual only)
  private ballHist: { x: number; y: number }[] = [];  // recent rendered ball positions
  private teams!: [Team, Team];

  create() {
    makePitchTexture(this);
    makeBallTexture(this);
    makeBallGhostTexture(this);
    makeShadowTexture(this);
    makeCarrierTexture(this);
    this.add.image(0, 0, 'pitch').setOrigin(0);
    GAME.scene = this;
    GAME.boot();
  }

  buildSprites(teams: [Team, Team]) {
    this.teams = teams;
    [...this.sprites.flat(), ...this.shadows.flat(), ...this.ballTrail].forEach((s) => s.destroy());
    this.ballSprite?.destroy(); this.ballShadow?.destroy(); this.carrierRing?.destroy();
    // draw order (Canvas = creation order): shadows -> ball shadow -> carrier ring -> players -> trail -> ball
    this.shadows = [0, 1].map((t) => teams[t].players.map(() => this.add.image(0, 0, 'shadow').setScale(2.4).setDepth(0)));
    this.ballShadow = this.add.image(0, 0, 'shadow').setScale(1.1);
    this.carrierRing = this.add.image(0, 0, 'carrier').setScale(2.4).setVisible(false);
    this.sprites = [0, 1].map((t) =>
      teams[t].players.map((p) => {
        const key = `p-${t}-${p.role === 'GK' ? 'gk' : 'out'}`;
        makePlayerFrames(this, key, teams[t].shirtColor, p.role === 'GK');
        return this.add.image(-99, -99, key + '0').setScale(3).setOrigin(0.5, 0.85);
      }),
    );
    this.ppos = [0, 1].map((t) => teams[t].players.map(() => ({ x: -99, y: -99 })));
    // ghost balls (oldest -> newest) drawn just under the ball; a smooth alpha+scale
    // ramp sampled from consecutive frames gives a short, tapering motion trail.
    this.ballTrail = [0.06, 0.10, 0.16, 0.24, 0.34, 0.46].map((alpha) =>
      this.add.image(0, 0, 'ball-ghost').setScale(1.8 + alpha * 3).setAlpha(alpha).setVisible(false),
    );
    this.ballHist = [];
    this.ballSprite = this.add.image(0, 0, 'ball').setScale(3);
  }

  sync(state: MatchEngine['state']) {
    if (!this.ballSprite) return;
    const now = Date.now();
    const frame = Math.floor(now / 110) % 2; // leg-swap cadence
    const lerp = 0.28;
    for (const t of [0, 1] as const) {
      state.players[t].forEach((ps, i) => {
        const s = this.sprites[t]?.[i]; if (!s) return;
        const pos = this.ppos[t][i];
        const tx = ps.x * SCALE, ty = ps.y * SCALE;
        const dx = tx - pos.x, dy = ty - pos.y;
        const moving = Math.hypot(dx, dy) > 1.2; // chasing a target => running
        pos.x += dx * lerp; pos.y += dy * lerp;  // logical ground position (shadow tracks this)
        if (Math.abs(dx) > 0.4) s.flipX = dx < 0;                       // face the direction of travel
        // subtle run bob: the sprite lifts on each stride; per-player phase so the team doesn't bounce in unison.
        const bob = moving ? Math.abs(Math.sin(now / 90 + i)) * 1.5 : 0;
        s.setPosition(pos.x, pos.y - bob);
        const key = `p-${t}-${this.teams[t].players[i].role === 'GK' ? 'gk' : 'out'}`;
        s.setTexture(key + (moving ? frame : 0));
        this.shadows[t][i].setPosition(pos.x, pos.y + 1);
      });
    }
    // ball (sits a touch above its shadow for depth)
    const bx = state.ball.x * SCALE, by = state.ball.y * SCALE;
    this.ballShadow.setPosition(bx + (bx - this.ballSprite.x) * lerp, by);
    this.ballSprite.x += (bx - this.ballSprite.x) * lerp;
    this.ballSprite.y += (by - 4 - this.ballSprite.y) * lerp;
    // subtle fading trail: ghost balls parked at recent rendered positions (visual only).
    // Sampling consecutive frames (newest -> oldest) keeps the trail short and smooth.
    const n = this.ballTrail.length;
    this.ballHist.unshift({ x: this.ballSprite.x, y: this.ballSprite.y });
    if (this.ballHist.length > n + 1) this.ballHist.pop();
    this.ballTrail.forEach((g, i) => {
      const h = this.ballHist[n - i]; // ghost i (fainter as i drops) sits at an older frame
      if (h) g.setVisible(true).setPosition(h.x, h.y);
      else g.setVisible(false);
    });
    // highlight the ball carrier with a gently pulsing glow so the eye can follow the play
    if (state.carrier) {
      const gp = this.ppos[state.carrier.teamIdx][state.carrier.playerIdx];
      const pulse = 0.5 + 0.5 * Math.sin(now / 170);
      this.carrierRing.setVisible(true).setPosition(gp.x, gp.y + 1)
        .setAlpha(0.7 + 0.3 * pulse).setScale(2.4 + 0.22 * pulse);
    } else this.carrierRing.setVisible(false);
  }

  // Brief, subtle camera shake to punctuate a goal. Purely cosmetic: the shake
  // runs on the render camera and never touches the (seeded) simulation, and its
  // fixed real-time duration is independent of match speed.
  goalShake() { this.cameras.main.shake(250, 0.004); }

  update(_t: number, deltaMs: number) { GAME.onFrame(deltaMs); }
}

GAME = new Game();
new Phaser.Game({ type: Phaser.CANVAS, parent: 'game', width: W, height: H, pixelArt: true, backgroundColor: '#0a0a16', scene: MatchScene });
