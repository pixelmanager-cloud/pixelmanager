import Phaser from 'phaser';
import {
  MatchEngine, autoPickXI, buildXI, overall, PITCH, TICK_SEC, defaultDuty, DUTY_LABEL, DUTIES_BY_ROLE, isDutyForRole,
  TACTIC_PRESETS, type Tactics, type Formation, type MatchEvent, type Team, type Club, type Lineup, type Player, type Duty,
} from '@fm/shared';
import { SCALE, makeBallTexture, makeBallGhostTexture, makePitchTexture, makePlayerFrames, makeShadowTexture, makeCarrierTexture } from './pixelart';
import { api, hasToken, setToken, clearToken, type Account, type StandingOrders, type MatchPayload, type TableRow, type ResultRow, type HonourRow, type Scout, type Trialist, type MarketListing } from './api';
import { walletConfigured, nftConfigured, sendEmailCode, connectEmail, connectInjected, autoConnectInApp, signMessage, claimTokens, mintPlayer, type Account as WalletAccount } from './wallet';

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
    return p.attrs[key as keyof Player['attrs']];
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
    const cells = cols.map(([, k]) => `<td class="stat" style="background:${statColor(p.attrs[k])}">${p.attrs[k]}</td>`).join('');
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
  const avg = (ps: Player[], k: keyof Player['attrs']) => ps.length ? Math.round(ps.reduce((a, p) => a + p.attrs[k], 0) / ps.length) : 0;
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

  private setMe(me: { account: Account; club: Club; standingOrders: StandingOrders }) {
    this.account = me.account; this.club = me.club; this.standingOrders = me.standingOrders;
  }

  private showScreen(s: 'login' | 'hub' | 'lineup' | 'match' | 'standings' | 'scouting' | 'market') {
    for (const id of ['login', 'hub', 'lineup', 'matchwrap', 'standings', 'scouting', 'market']) $(id).classList.toggle('hidden', id !== (s === 'match' ? 'matchwrap' : s));
    $('logout').classList.toggle('hidden', s === 'login');
  }

  private wireStaticButtons() {
    const setSpeed = (v: number, id: string) => { this.speed = v; ['spd1', 'spd4', 'spd12'].forEach((b) => $(b).classList.remove('active')); $(id).classList.add('active'); };
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
    $('market-back').addEventListener('click', () => this.showHub());
    $('sell-btn').addEventListener('click', () => this.sellPlayer());
    const showTab = (tab: 'results' | 'honours') => {
      $('results-feed').classList.toggle('hidden', tab !== 'results');
      $('honours-feed').classList.toggle('hidden', tab !== 'honours');
      $('tab-results').classList.toggle('active', tab === 'results');
      $('tab-honours').classList.toggle('active', tab === 'honours');
    };
    $('tab-results').addEventListener('click', () => showTab('results'));
    $('tab-honours').addEventListener('click', () => showTab('honours'));
    $('skip').addEventListener('click', () => this.skipToEnd());
    $('set-team').addEventListener('click', () => this.openLineup('standing'));
    $('autopick').addEventListener('click', () => { this.draftLineup = autoPickXI(this.club, this.draftTactics.formation); this.rebuildDuties(); this.renderLineupEditor(); });
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
    const stats = order.map(([k, l]) => `<div class="pc-stat"><span>${l}</span><b style="color:${statColor(p.attrs[k])}">${p.attrs[k]}</b></div>`).join('');
    // FX escalate with tier: sheen from Silver, rotating glow ring + sparkles from Gold up.
    const sparkCount = { bronze: 0, silver: 3, gold: 6, diamond: 10, legend: 16 }[tier.key] ?? 0;
    const sparks = Array.from({ length: sparkCount }, () => {
      const x = Math.round(Math.random() * 90) + 5, y = Math.round(Math.random() * 86) + 7;
      const delay = (Math.random() * 2).toFixed(2), dur = (0.8 + Math.random() * 0.9).toFixed(2);
      return `<i class="pc-spark" style="left:${x}%;top:${y}%;animation-delay:${delay}s;animation-duration:${dur}s">✦</i>`;
    }).join('');
    const ring = tier.key === 'gold' || tier.key === 'diamond' || tier.key === 'legend' ? '<div class="pc-ring"></div>' : '';
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
      + `<div class="pc-foot">★ NFT${tokenId ? ` · #${tokenId}` : ''} · Base Sepolia · on-chain</div>`
      + `<button class="pc-close">${minted ? 'Nice ✓' : 'Close'}</button></div>`;
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
          const vb = `<span class="venue ${f.venue}" title="${f.venue === 'home' ? 'Home' : 'Away'}">${f.venue === 'home' ? 'H' : 'A'}</span>`;
          if (f.status === 'played' && f.result) {
            const { my, opp } = f.result;
            const cls = my > opp ? 'w' : my < opp ? 'l' : 'd';
            return `<div class="fixture done"><span class="opp">${vb} <b>${f.clubName}</b> <span class="meta">${f.handle}</span></span><span class="pill ${cls}">${cls.toUpperCase()} ${my}-${opp}</span></div>`;
          }
          const btn = capped
            ? '<button disabled title="Daily limit reached — come back tomorrow">Play ▶</button>'
            : `<button data-opp="${f.opponentId}" data-h="${f.handle}" data-venue="${f.venue}">Play ▶</button>`;
          return `<div class="fixture">${vb} <span class="opp"><b>${f.clubName}</b> <span class="meta">${f.handle} · rating ${f.rating}</span></span>${btn}</div>`;
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
    return rows.map((h) => {
      const champ = h.title === 1;
      const prize = h.coin_reward ? `<span class="hr-prize">💰 ${h.coin_reward}</span>` : '';
      return `<div class="honour-row${champ ? ' champ' : ''}">`
        + `<span class="hr-medal">${champ ? '🏆' : ORDINAL(h.final_pos)}</span>`
        + `<span class="hr-main"><b>Season ${h.season_number}</b> · ${h.tier}</span>`
        + `<span class="hr-fin">${champ ? 'CHAMPION' : `${ORDINAL(h.final_pos)} place`}</span>${prize}</div>`;
    }).join('');
  }

  // ---- scouting (trial/loan academy) ----
  private async showScouting() {
    this.showScreen('scouting');
    $('trial-pool').innerHTML = SPINNER;
    try {
      const d = await api.trials();
      $('loan-cap').textContent = String(d.cap);
      $('loan-signed').textContent = String(d.signedCount);
      $('trial-pool').innerHTML = this.renderTrialPool(d.pool, d.signedCount >= d.cap);
      Array.from($('trial-pool').querySelectorAll('button[data-idx]')).forEach((b) =>
        b.addEventListener('click', () => this.signTrial(Number((b as HTMLElement).dataset.idx))));
    } catch {
      $('trial-pool').innerHTML = '<div class="muted">Could not load — is the server running?</div>';
    }
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
    this.draftLineup = { formation: this.standingOrders.formation, playerIds: [...this.standingOrders.playerIds] };
    // seed duties from saved standing orders where valid, else each player's auto default
    this.draftDuties = this.draftLineup.playerIds.map((pid, i) => {
      const p = this.club.players.find((x) => x.id === pid)!;
      const saved = this.standingOrders.duties?.[i];
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
      this.draftLineup = autoPickXI(this.club, this.draftTactics.formation);
      this.rebuildDuties();
      this.renderLineupEditor();
    });
    (Object.keys(LEVELS) as Array<keyof typeof LEVELS>).forEach((k) => {
      ($(`e-${k}`) as HTMLSelectElement).addEventListener('change', (ev) => { this.draftTactics[k] = Number((ev.target as HTMLSelectElement).value); this.updateEditorInsight(); });
    });

    const slots = this.draftLineup.playerIds;
    const usedElsewhere = (slotIdx: number) => new Set(slots.filter((_, j) => j !== slotIdx));
    $('xi').innerHTML = slots.map((pid, i) => {
      const roleForSlot = SLOT_ROLES[this.draftTactics.formation][i];
      const used = usedElsewhere(i);
      const isLoan = (id: string) => id.startsWith('loan-');
      const tagText = (p: Player) => isLoan(p.id) ? ' · LOAN' : isNftId(p.id) ? ` ${nftTier(overall(p)).icon}` : '';
      const opts = this.club.players
        .filter((p) => p.id === pid || !used.has(p.id))
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
    const bench = this.club.players.filter((p) => !inXI.has(p.id)).sort((a, b) => overall(b) - overall(a));
    $('bench').innerHTML = `<b>Bench:</b> ` + bench.map((p) => {
      const t = isNftId(p.id) ? nftTier(overall(p)) : null;
      return t ? `<span class="bench-nft tier-${t.key}" data-card="${p.id}" title="Owned NFT · ${t.name} — click to view card">${t.icon} ${p.name} (${p.role} ${overall(p)})</span>`
        : `${p.name} (${p.role} ${overall(p)})`;
    }).join(' · ');
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
    panel.innerHTML = statsTableHTML(this.club.players, new Set(this.draftLineup.playerIds), this.squadSort);
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

  private startMatch(payload: MatchPayload) {
    this.mySide = payload.mySide;
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

  private pushTicker(e: MatchEvent) {
    const who = e.teamIdx === 0 ? this.homeName : this.awayName;
    const line: Record<MatchEvent['type'], string> = {
      kickoff: `${e.minute}' Kickoff!`,
      goal: `${e.minute}' ⚽ GOAL! ${e.playerName} (${who})`,
      chance: `${e.minute}' Big chance for ${e.playerName} (${who})...`,
      shot_saved: `${e.minute}' Save! ${e.playerName} (${who}) denied`,
      shot_missed: `${e.minute}' ${e.playerName} (${who}) shoots wide`,
      halftime: `${e.minute}' Half-time`,
      fulltime: `${e.minute}' Full-time`,
    };
    const div = document.createElement('div');
    div.textContent = line[e.type];
    if (e.type === 'goal') { div.style.color = '#ffd75e'; if (!this.silent) this.celebrateGoal(e); }
    else if (e.type === 'chance') div.style.color = '#8ad';
    $('ticker').prepend(div);
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
    // ghost balls (oldest -> newest) drawn just under the ball, at fading alpha
    this.ballTrail = [0.08, 0.14, 0.22, 0.32].map((alpha) =>
      this.add.image(0, 0, 'ball-ghost').setScale(3).setAlpha(alpha).setVisible(false),
    );
    this.ballHist = [];
    this.ballSprite = this.add.image(0, 0, 'ball').setScale(3);
  }

  sync(state: MatchEngine['state']) {
    if (!this.ballSprite) return;
    const frame = Math.floor(Date.now() / 110) % 2; // leg-swap cadence
    const lerp = 0.28;
    for (const t of [0, 1] as const) {
      state.players[t].forEach((ps, i) => {
        const s = this.sprites[t]?.[i]; if (!s) return;
        const tx = ps.x * SCALE, ty = ps.y * SCALE;
        const dx = tx - s.x, dy = ty - s.y;
        const moving = Math.hypot(dx, dy) > 1.2; // chasing a target => running
        s.x += dx * lerp; s.y += dy * lerp;
        if (Math.abs(dx) > 0.4) s.flipX = dx < 0;                       // face the direction of travel
        const key = `p-${t}-${this.teams[t].players[i].role === 'GK' ? 'gk' : 'out'}`;
        s.setTexture(key + (moving ? frame : 0));
        this.shadows[t][i].setPosition(s.x, s.y + 1);
      });
    }
    // ball (sits a touch above its shadow for depth)
    const bx = state.ball.x * SCALE, by = state.ball.y * SCALE;
    this.ballShadow.setPosition(bx + (bx - this.ballSprite.x) * lerp, by);
    this.ballSprite.x += (bx - this.ballSprite.x) * lerp;
    this.ballSprite.y += (by - 4 - this.ballSprite.y) * lerp;
    // subtle fading trail: ghost balls parked at recent rendered positions (visual only)
    const n = this.ballTrail.length;
    this.ballHist.unshift({ x: this.ballSprite.x, y: this.ballSprite.y });
    if (this.ballHist.length > n * 2 + 1) this.ballHist.pop();
    this.ballTrail.forEach((g, i) => {
      const h = this.ballHist[(n - i) * 2]; // newest ghost trails closest, oldest sits furthest back
      if (h) g.setVisible(true).setPosition(h.x, h.y);
      else g.setVisible(false);
    });
    // highlight ring under whoever has the ball
    if (state.carrier) {
      const cs = this.sprites[state.carrier.teamIdx][state.carrier.playerIdx];
      this.carrierRing.setVisible(true).setPosition(cs.x, cs.y + 1);
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
