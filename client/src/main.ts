import Phaser from 'phaser';
import {
  MatchEngine, autoPickXI, buildXI, overall, PITCH, TICK_SEC,
  TACTIC_PRESETS, type Tactics, type Formation, type MatchEvent, type Team, type Club, type Lineup, type Player,
} from '@fm/shared';
import { SCALE, makeBallTexture, makePitchTexture, makePlayerFrames, makeShadowTexture, makeCarrierTexture } from './pixelart';
import { api, hasToken, setToken, clearToken, type Account, type StandingOrders, type MatchPayload, type TableRow } from './api';

const W = PITCH.w * SCALE, H = PITCH.h * SCALE;

const LEVELS: Record<keyof Omit<Tactics, 'formation'>, string[]> = {
  mentality: ['Very Defensive', 'Defensive', 'Balanced', 'Attacking', 'Very Attacking'],
  line: ['Very Deep', 'Deep', 'Normal', 'High', 'Very High'],
  press: ['Contain', 'Low', 'Balanced', 'High', 'Gegenpress'],
  tempo: ['Very Patient', 'Patient', 'Balanced', 'Direct', 'Very Direct'],
  width: ['Very Narrow', 'Narrow', 'Balanced', 'Wide', 'Very Wide'],
};
const FORMATIONS: Formation[] = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'];
const SLOT_ROLES: Record<Formation, string[]> = {
  '4-4-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
  '4-3-3': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
  '3-5-2': ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
  '4-2-3-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW'],
};

const $ = (id: string) => document.getElementById(id)!;

function statColor(v: number): string {
  if (v >= 17) return '#3ad07a';
  if (v >= 14) return '#7bd88f';
  if (v >= 11) return '#c9d17b';
  if (v >= 8) return '#d9a860';
  return '#d16a5a';
}

function statsTableHTML(players: Player[], highlight?: Set<string>): string {
  const cols: Array<[string, keyof Player['attrs']]> = [
    ['PAC', 'pace'], ['STR', 'strength'], ['PAS', 'passing'], ['SHO', 'shooting'],
    ['TAK', 'tackling'], ['POS', 'positioning'], ['WRK', 'workrate'], ['KEE', 'keeping'],
  ];
  const roleOrder: Record<string, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };
  const sorted = [...players].sort((a, b) => (roleOrder[a.role] - roleOrder[b.role]) || (overall(b) - overall(a)));
  const head = `<tr><th></th><th>Pos</th><th style="text-align:left">Name</th><th>OVR</th>${cols.map(([l]) => `<th>${l}</th>`).join('')}</tr>`;
  const rows = sorted.map((p) => {
    const on = !!highlight?.has(p.id);
    const cells = cols.map(([, k]) => `<td class="stat" style="background:${statColor(p.attrs[k])}">${p.attrs[k]}</td>`).join('');
    const mark = on ? '<td class="inxi-mark">●</td>' : '<td></td>';
    return `<tr class="${on ? 'inxi' : ''}">${mark}<td class="pos role-${p.role}">${p.role}</td><td class="name">${p.name}</td><td class="stat" style="background:${statColor(overall(p))}">${overall(p)}</td>${cells}</tr>`;
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
  speed = 1; accum = 0; eventsShown = 0;

  account!: Account;
  club!: Club;
  standingOrders!: StandingOrders;
  draftLineup!: Lineup;
  draftTactics!: Tactics;
  editorMode: 'standing' | 'match' = 'standing';
  pendingOpp?: { id: string; handle: string };
  awayHandle = '';

  async boot() {
    this.wireStaticButtons();
    if (hasToken()) {
      try { this.setMe(await api.me()); await this.showHub(); return; }
      catch { clearToken(); }
    }
    this.showScreen('login');
  }

  private setMe(me: { account: Account; club: Club; standingOrders: StandingOrders }) {
    this.account = me.account; this.club = me.club; this.standingOrders = me.standingOrders;
  }

  private showScreen(s: 'login' | 'hub' | 'lineup' | 'match') {
    for (const id of ['login', 'hub', 'lineup', 'matchwrap']) $(id).classList.toggle('hidden', id !== (s === 'match' ? 'matchwrap' : s));
    $('logout').classList.toggle('hidden', s === 'login');
  }

  private wireStaticButtons() {
    const setSpeed = (v: number, id: string) => { this.speed = v; ['spd1', 'spd4', 'spd12'].forEach((b) => $(b).classList.remove('active')); $(id).classList.add('active'); };
    $('spd1').addEventListener('click', () => setSpeed(1, 'spd1'));
    $('spd4').addEventListener('click', () => setSpeed(4, 'spd4'));
    $('spd12').addEventListener('click', () => setSpeed(12, 'spd12'));
    $('register-btn').addEventListener('click', () => this.doRegister());
    $('handle-input').addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') this.doRegister(); });
    $('logout').addEventListener('click', () => { clearToken(); this.showScreen('login'); });
    $('set-team').addEventListener('click', () => this.openLineup('standing'));
    $('autopick').addEventListener('click', () => { this.draftLineup = autoPickXI(this.club, this.draftTactics.formation); this.renderLineupEditor(); });
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
  private async doRegister() {
    const handle = ($('handle-input') as HTMLInputElement).value.trim();
    $('login-error').textContent = '';
    try {
      const r = await api.register(handle);
      setToken(r.token);
      this.setMe({ account: r.account, club: r.club, standingOrders: r.standingOrders });
      await this.showHub();
    } catch (e: any) {
      $('login-error').textContent = e?.status === 409 ? 'Handle already taken — pick another.'
        : e?.status === 400 ? 'Handle must be 2–20 characters.'
        : 'Could not reach the server. Is it running?';
    }
  }

  // ---- hub ----
  private async showHub() {
    this.showScreen('hub');
    $('me-name').textContent = this.club.name;
    $('me-rating').textContent = `RATING ${this.account.rating}`;
    $('league-table').innerHTML = '<div class="muted">Loading…</div>';
    try {
      const [opps, tbl, mine] = await Promise.all([api.opponents(), api.table(), api.myMatches()]);
      $('league-table').innerHTML = this.renderLeagueTable(tbl.table);
      $('opponents').innerHTML = opps.opponents.length
        ? opps.opponents.map((o) => `<div class="fixture"><span class="opp"><b>${o.clubName}</b> <span class="meta">${o.handle} · rating ${o.rating}</span></span><button data-opp="${o.id}" data-h="${o.handle}">Play ▶</button></div>`).join('')
        : '<div class="muted">No opponents yet — register another handle in a second browser/incognito window to play against.</div>';
      Array.from($('opponents').querySelectorAll('button[data-opp]')).forEach((b) =>
        b.addEventListener('click', () => this.play((b as HTMLElement).dataset.opp!, (b as HTMLElement).dataset.h!)));
      $('my-matches').innerHTML = mine.matches.length
        ? mine.matches.map((m) => {
            const iAmHome = m.home_id === this.account.id;
            const my = iAmHome ? m.home_score : m.away_score, opp = iAmHome ? m.away_score : m.home_score;
            const cls = my > opp ? 'w' : my < opp ? 'l' : 'd';
            return `<div class="mm-row"><span class="${cls}">${cls.toUpperCase()}</span> ${my} - ${opp}</div>`;
          }).join('')
        : '<div class="muted">No matches yet.</div>';
    } catch {
      $('opponents').innerHTML = '<div class="muted">Could not load — is the server running?</div>';
    }
  }

  private renderLeagueTable(rows: TableRow[]): string {
    const head = '<tr><th>#</th><th style="text-align:left">Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th>Rtg</th></tr>';
    const body = rows.map((r, i) => {
      const gd = r.GD > 0 ? `+${r.GD}` : `${r.GD}`;
      return `<tr class="${r.id === this.account.id ? 'me' : ''}"><td class="pos">${i + 1}</td><td class="club">${r.handle}</td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GF}</td><td>${r.GA}</td><td>${gd}</td><td class="pts">${r.Pts}</td><td>${r.rating}</td></tr>`;
    }).join('');
    return `<table class="league">${head}${body}</table>`;
  }

  // ---- lineup editor (my standing orders) ----
  // Opens the pixel lineup editor either to save your standing orders, or to set a
  // one-off lineup + tactics for a specific match (prefilled from your standing orders).
  private openLineup(mode: 'standing' | 'match', opp?: { id: string; handle: string }) {
    this.editorMode = mode;
    this.pendingOpp = opp;
    this.draftTactics = { ...this.standingOrders.tactics, formation: this.standingOrders.formation };
    this.draftLineup = { formation: this.standingOrders.formation, playerIds: [...this.standingOrders.playerIds] };
    $('lineup-title').textContent = mode === 'standing' ? 'SET MY TEAM' : `SET LINEUP  vs ${opp!.handle}`;
    ($('save-team') as HTMLButtonElement).textContent = mode === 'standing' ? 'Save Team' : '▶ Kick Off';
    this.renderLineupEditor();
    this.showScreen('lineup');
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
      const opts = this.club.players
        .filter((p) => p.id === pid || !used.has(p.id))
        .sort((a, b) => overall(b) - overall(a))
        .map((p) => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${p.name} (${p.role} ${overall(p)})</option>`).join('');
      const cur = this.club.players.find((p) => p.id === pid)!;
      return `<div class="slot role-${roleForSlot}"><span class="role role-${roleForSlot}">${roleForSlot}</span><select data-i="${i}">${opts}</select><span class="ovr" style="color:${statColor(overall(cur))}">${overall(cur)}</span></div>`;
    }).join('');
    Array.from($('xi').querySelectorAll('select')).forEach((sel) => {
      sel.addEventListener('change', (ev) => {
        const t = ev.target as HTMLSelectElement;
        this.draftLineup.playerIds[Number(t.dataset.i)] = t.value;
        this.renderLineupEditor();
      });
    });

    const inXI = new Set(slots);
    const bench = this.club.players.filter((p) => !inXI.has(p.id)).sort((a, b) => overall(b) - overall(a));
    $('bench').innerHTML = `<b>Bench:</b> ${bench.map((p) => `${p.name} (${p.role} ${overall(p)})`).join(' · ')}`;
    if (!$('squad-panel').classList.contains('hidden')) this.renderSquadPanel();
    this.updateEditorInsight();
  }

  private renderSquadPanel() {
    $('squad-panel').innerHTML = statsTableHTML(this.club.players, new Set(this.draftLineup.playerIds));
  }

  private updateEditorInsight() {
    $('lineup-insight').innerHTML = squadInsight(buildXI(this.club, this.draftLineup));
  }

  private async saveTeam() {
    const so: StandingOrders = {
      formation: this.draftTactics.formation,
      playerIds: this.draftLineup.playerIds,
      tactics: { ...this.draftTactics },
    };
    try { const r = await api.setStandingOrders(so); this.standingOrders = r.standingOrders; await this.showHub(); }
    catch { $('lineup-insight').innerHTML = '<span style="color:var(--home)">Could not save — check your XI.</span>'; }
  }

  // ---- match ----
  // "Play" opens the lineup editor so you set a lineup + tactics for THIS match.
  private play(opponentId: string, handle: string) {
    this.openLineup('match', { id: opponentId, handle });
  }

  private async kickOffMatch() {
    if (!this.pendingOpp) return;
    $('lineup-insight').innerHTML = '<span style="color:var(--cyan)">Playing…</span>';
    try {
      const payload = await api.createMatch(this.pendingOpp.id, this.draftLineup, this.draftTactics);
      this.startMatch(payload, this.pendingOpp.handle);
    } catch { await this.showHub(); }
  }

  private startMatch(payload: MatchPayload, awayHandle: string) {
    this.awayHandle = awayHandle;
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
    $('home-name').textContent = this.club.name;
    $('away-name').textContent = awayHandle;
    $('ticker').innerHTML = '';
    this.scene!.buildSprites(this.engine.teams);
    this.showScreen('match');
  }

  private async onFullTime() {
    this.running = false;
    try { this.setMe(await api.me()); } catch { /* keep old rating */ }
    setTimeout(() => this.showHub(), 1600);
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
    $('score').textContent = `${s.score[0]} - ${s.score[1]}`;
    const m = Math.floor(s.clockSec / 60), sec = Math.floor(s.clockSec % 60);
    $('clock').textContent = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    const tot = s.possession[0] + s.possession[1] || 1;
    const hp = Math.round((s.possession[0] / tot) * 100);
    ($('poss-home') as HTMLElement).style.width = `${hp}%`;
    $('poss-home-l').textContent = `${hp}%`;
    $('poss-away-l').textContent = `${100 - hp}%`;
    const fitAvg = s.players[0].slice(1).reduce((a, p) => a + p.fitness, 0) / 10;
    $('fit-label').textContent = `Your squad fitness: ${Math.round(fitAvg * 100)}%`;
    while (this.eventsShown < s.events.length) this.pushTicker(s.events[this.eventsShown++]);
  }

  private pushTicker(e: MatchEvent) {
    const who = e.teamIdx === 0 ? this.club.shortName : this.awayHandle;
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
    if (e.type === 'goal') { div.style.color = '#ffd75e'; this.celebrateGoal(e); }
    else if (e.type === 'chance') div.style.color = '#8ad';
    $('ticker').prepend(div);
  }

  private celebrateGoal(e: MatchEvent) {
    const el = $('goal-flash');
    el.textContent = `⚽ GOAL!  ${e.teamIdx === 0 ? this.club.name : this.awayHandle}`;
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
  private teams!: [Team, Team];

  create() {
    makePitchTexture(this);
    makeBallTexture(this);
    makeShadowTexture(this);
    makeCarrierTexture(this);
    this.add.image(0, 0, 'pitch').setOrigin(0);
    GAME.scene = this;
    GAME.boot();
  }

  buildSprites(teams: [Team, Team]) {
    this.teams = teams;
    [...this.sprites.flat(), ...this.shadows.flat()].forEach((s) => s.destroy());
    this.ballSprite?.destroy(); this.ballShadow?.destroy(); this.carrierRing?.destroy();
    // draw order (Canvas = creation order): shadows -> ball shadow -> carrier ring -> players -> ball
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
