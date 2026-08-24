import Phaser from 'phaser';
import {
  MatchEngine, generateClub, autoPickXI, buildXI, overall, PITCH, TICK_SEC,
  TACTIC_PRESETS, type Tactics, type Formation, type MatchEvent, type Team, type Club, type Lineup, type Player,
} from '@fm/shared';
import { SCALE, makeBallTexture, makePitchTexture, makePlayerTexture } from './pixelart';

const W = PITCH.w * SCALE, H = PITCH.h * SCALE;
const HOME_SEED = 990201, HOME_QUALITY = 14;
const ROUND_INTERVAL_MS = 60 * 60 * 1000; // one gauntlet of 5 matches per hour
const HALFTIME_SEC = 45 * 60;

const LEVELS: Record<keyof Omit<Tactics, 'formation'>, string[]> = {
  mentality: ['Very Defensive', 'Defensive', 'Balanced', 'Attacking', 'Very Attacking'],
  line: ['Very Deep', 'Deep', 'Normal', 'High', 'Very High'],
  press: ['Contain', 'Low', 'Balanced', 'High', 'Gegenpress'],
  tempo: ['Very Patient', 'Patient', 'Balanced', 'Direct', 'Very Direct'],
  width: ['Very Narrow', 'Narrow', 'Balanced', 'Wide', 'Very Wide'],
};
const FORMATIONS: Formation[] = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'];
const CPU_CLUBS: Array<[string, string, number]> = [
  ['Retro City', 'RET', 0x3b6bd2], ['Neon Rovers', 'NEO', 0x9b3bd2], ['Byte United', 'BYT', 0x2fae6a],
  ['Sprite Athletic', 'SPR', 0xe08a2a], ['Vector Town', 'VEC', 0x2ab0c0], ['Glitch FC', 'GLI', 0xc0392b],
  ['8-Bit Wanderers', 'WAN', 0x7f8c2a], ['Cyber Albion', 'CYB', 0x4a69bd], ['Pixel Rangers', 'RNG', 0xd23b7a],
];

const $ = (id: string) => document.getElementById(id)!;
const rnd = () => Math.random();
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

function statColor(v: number): string {
  if (v >= 17) return '#3ad07a';
  if (v >= 14) return '#7bd88f';
  if (v >= 11) return '#c9d17b';
  if (v >= 8) return '#d9a860';
  return '#d16a5a';
}

/** Colour-coded stats table for a set of players; players in `highlight` are marked. */
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

/** Human-readable description of a team's strategy (non-balanced traits only). */
function tacticWords(t: Tactics): string {
  const p: string[] = [];
  const m: Record<number, string> = { [-2]: 'very defensive', [-1]: 'defensive', 1: 'attacking', 2: 'very attacking' };
  const ln: Record<number, string> = { [-2]: 'a very deep line', [-1]: 'a deep line', 1: 'a high line', 2: 'a very high line' };
  const pr: Record<number, string> = { [-2]: 'sitting off (contain)', [-1]: 'a low press', 1: 'a high press', 2: 'an intense gegenpress' };
  const tp: Record<number, string> = { [-2]: 'very patient build-up', [-1]: 'patient build-up', 1: 'a direct tempo', 2: 'a very direct tempo' };
  const wd: Record<number, string> = { [-2]: 'very narrow', [-1]: 'narrow', 1: 'wide', 2: 'very wide' };
  if (t.mentality) p.push(m[t.mentality]);
  if (t.line) p.push(ln[t.line]);
  if (t.press) p.push(pr[t.press]);
  if (t.tempo) p.push(tp[t.tempo]);
  if (t.width) p.push(wd[t.width]);
  return p.length ? p.join(', ') : 'a balanced approach';
}

/** Suggest how to counter the opponent's tactics. */
function counterAdvice(o: Tactics): string {
  const tips: string[] = [];
  if (o.line >= 1) tips.push('they hold a high line — go <b>Direct</b> and use pace in behind');
  if (o.line <= -1 || o.mentality <= -1) tips.push('they sit deep — be <b>Patient</b>, go <b>Wide</b> and keep probing');
  if (o.press >= 1) tips.push('they press hard — play <b>Direct</b> to beat the press; they may tire late, so watch their fitness');
  if (o.press <= -1) tips.push('they give you time — dominate with <b>Patient</b> build-up');
  if (o.mentality >= 1 && o.line >= 0) tips.push('they commit forward — sit a touch <b>deeper</b> and counter');
  if (!tips.length) tips.push('a balanced side — match them and let your better players decide it');
  return tips.slice(0, 2).join('; ') + '.';
}

function insightFor(team: Team, isHome: boolean): string {
  const byRole = (r: Team['players'][0]['role']) => team.players.filter((p) => p.role === r);
  const avg = (ps: Team['players'], k: keyof Team['players'][0]['attrs']) => ps.length ? Math.round(ps.reduce((a, p) => a + p.attrs[k], 0) / ps.length) : 0;
  const fw = byRole('FW'), df = byRole('DF');
  const fwPace = avg(fw, 'pace'), fwStr = avg(fw, 'strength');
  const dfPace = avg(df, 'pace');
  const best = team.players.reduce((a, b) => (overall(b) > overall(a) ? b : a));
  const who = isHome ? 'Your' : 'Their';
  const tips: string[] = [`★ Key player: <b>${best.name}</b> (${best.role}, OVR ${overall(best)})`];
  if (fwPace >= 15) tips.push(`⚡ ${who} forwards are quick (pace ${fwPace}) — ${isHome ? 'a high line + direct tempo suit you' : "don't push your line too high"}.`);
  else if (fwStr >= 15) tips.push(`💪 ${who} forwards are strong (strength ${fwStr}) — ${isHome ? 'long balls / Route One pay off' : 'they win aerial duels'}.`);
  if (dfPace <= 11) tips.push(`⚠️ ${who} defenders are slow (pace ${dfPace}) — ${isHome ? 'a high line is risky' : 'exploit with pace in behind'}.`);
  return tips.join('<br>');
}

// ---- persisted round state ----
interface Fixture {
  opp: Club; oppLineup: Lineup; oppTactics: Tactics; matchSeed: number;
  myLineup?: Lineup; myTactics?: Tactics; result?: [number, number];
}
interface Round { createdAt: number; fixtures: Fixture[]; }

function newRound(now: number): Round {
  const clubs = [...CPU_CLUBS].sort(() => rnd() - 0.5).slice(0, 5);
  const fixtures: Fixture[] = clubs.map(([name, short, color], i) => {
    const quality = 12 + Math.floor(rnd() * 4);
    const opp = generateClub(`cpu${i}`, name, short, color, quality, Math.floor(rnd() * 2 ** 31));
    const oppTactics: Tactics = { ...pick(Object.values(TACTIC_PRESETS)) };
    return { opp, oppLineup: autoPickXI(opp, oppTactics.formation), oppTactics, matchSeed: Math.floor(rnd() * 2 ** 31) };
  });
  return { createdAt: now, fixtures };
}

let GAME: Game;

class Game {
  club: Club = generateClub('pix', 'Pixel United', 'PIX', 0xd23b3b, HOME_QUALITY, HOME_SEED);
  round: Round;
  screen: 'hub' | 'lineup' | 'match' = 'hub';
  scene?: MatchScene;

  engine?: MatchEngine;
  activeFixture = -1;
  running = false; paused = false; halftimeDone = false;
  speed = 1; accum = 0; eventsShown = 0;

  editorMode: 'prematch' | 'halftime' = 'prematch';
  draftLineup!: Lineup;
  draftTactics!: Tactics;

  constructor() {
    const saved = localStorage.getItem('fm_round_v2');
    this.round = saved ? JSON.parse(saved) : newRound(Date.now());
    if (!saved) this.save();
    this.wireStaticButtons();
    setInterval(() => { if (this.screen === 'hub') this.renderTimer(); }, 1000);
  }

  private save() { localStorage.setItem('fm_round_v2', JSON.stringify(this.round)); }

  boot() { this.showScreen('hub'); }

  // ---- screen switching ----
  private showScreen(s: 'hub' | 'lineup' | 'match') {
    this.screen = s;
    $('hub').classList.toggle('hidden', s !== 'hub');
    $('lineup').classList.toggle('hidden', s !== 'lineup');
    $('matchwrap').classList.toggle('hidden', s !== 'match');
    if (s === 'hub') this.renderHub();
  }

  private wireStaticButtons() {
    const setSpeed = (v: number, id: string) => { this.speed = v; ['spd1', 'spd4', 'spd12'].forEach((b) => $(b).classList.remove('active')); $(id).classList.add('active'); };
    $('spd1').addEventListener('click', () => setSpeed(1, 'spd1'));
    $('spd4').addEventListener('click', () => setSpeed(4, 'spd4'));
    $('spd12').addEventListener('click', () => setSpeed(12, 'spd12'));
    $('new-round').addEventListener('click', () => this.tryNewRound());
    $('autopick').addEventListener('click', () => { this.draftLineup = autoPickXI(this.club, this.draftTactics.formation); this.renderLineupEditor(); });
    $('toggle-squad').addEventListener('click', () => {
      const panel = $('squad-panel');
      const show = panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !show);
      $('toggle-squad').textContent = show ? '▤ Hide squad stats' : '▤ View full squad stats';
      if (show) this.renderSquadPanel();
    });
    $('toggle-opp').addEventListener('click', () => {
      const panel = $('opp-panel');
      const show = panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !show);
      $('toggle-opp').textContent = show ? '👁 Hide opponent lineup' : '👁 View opponent lineup';
      if (show) {
        const f = this.round.fixtures[this.activeFixture];
        $('opp-panel').innerHTML = statsTableHTML(buildXI(f.opp, f.oppLineup).players);
      }
    });
    $('lineup-back').addEventListener('click', () => this.showScreen('hub'));
    $('kickoff').addEventListener('click', () => (this.editorMode === 'prematch' ? this.kickOff() : this.resumeMatch(true)));
    $('ht-adjust').addEventListener('click', () => this.openLineup(this.activeFixture, 'halftime'));
    $('ht-resume').addEventListener('click', () => this.resumeMatch(false));
  }

  // ---- HUB ----
  private renderHub() {
    const played = this.round.fixtures.filter((f) => f.result);
    let w = 0, d = 0, l = 0, gf = 0, ga = 0;
    for (const f of played) { const [a, b] = f.result!; gf += a; ga += b; if (a > b) w++; else if (a < b) l++; else d++; }
    $('record').textContent = `Record: ${w}W ${d}D ${l}L`;
    $('record2').innerHTML = played.length
      ? `Points: <b>${w * 3 + d}</b> &nbsp; Goals: ${gf}-${ga} &nbsp; (${played.length}/5 played)`
      : `Set a lineup and tactics for each opponent, then play. Results lock at full-time.`;

    $('fixtures').innerHTML = this.round.fixtures.map((f, i) => {
      let res = '<span class="res">— play ▶</span>';
      if (f.result) { const [a, b] = f.result; const cls = a > b ? 'w' : a < b ? 'l' : 'd'; res = `<span class="res ${cls}">${a} - ${b}</span>`; }
      const best = f.opp.players.reduce((x, y) => (overall(y) > overall(x) ? y : x));
      return `<div class="fixture" data-i="${i}">
        <span class="num">${i + 1}</span>
        <span class="opp"><b>${f.opp.name}</b> <span class="meta">[${f.oppTactics.formation}] · star ${best.name} (${overall(best)})</span></span>
        ${res}</div>`;
    }).join('');
    Array.from(document.querySelectorAll('.fixture')).forEach((el) => {
      const i = Number((el as HTMLElement).dataset.i);
      if (!this.round.fixtures[i].result) el.addEventListener('click', () => this.openLineup(i, 'prematch'));
    });
    this.renderTimer();
  }

  private renderTimer() {
    const age = Date.now() - this.round.createdAt;
    const left = ROUND_INTERVAL_MS - age;
    const btn = $('new-round') as HTMLButtonElement;
    if (left <= 0) { $('timer').textContent = 'New round available'; btn.disabled = false; }
    else {
      const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
      $('timer').textContent = `Next round in ${mm}:${String(ss).padStart(2, '0')}`;
      btn.disabled = true;
    }
  }

  private tryNewRound() {
    if (Date.now() - this.round.createdAt < ROUND_INTERVAL_MS) return;
    this.round = newRound(Date.now());
    this.save();
    this.renderHub();
  }

  // ---- LINEUP EDITOR (shared by pre-match & half-time) ----
  private openLineup(fixtureIdx: number, mode: 'prematch' | 'halftime') {
    this.activeFixture = fixtureIdx;
    this.editorMode = mode;
    const f = this.round.fixtures[fixtureIdx];
    if (mode === 'prematch') {
      this.draftTactics = f.myTactics ? { ...f.myTactics } : { ...TACTIC_PRESETS.Balanced };
      this.draftLineup = f.myLineup ? { ...f.myLineup, playerIds: [...f.myLineup.playerIds] } : autoPickXI(this.club, this.draftTactics.formation);
    } // half-time keeps current draft* (already the in-match lineup/tactics)
    $('lineup-title').textContent = mode === 'prematch' ? `SET YOUR LINEUP  vs ${f.opp.name}` : 'HALF-TIME — ADJUST';
    ($('kickoff') as HTMLButtonElement).textContent = mode === 'prematch' ? 'Kick Off' : 'Resume Match';
    $('lineup-back').classList.toggle('hidden', mode === 'halftime');
    this.renderLineupEditor();
    this.showScreen('lineup');
  }

  private renderLineupEditor() {
    // tactics row: formation + 5 sliders
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

    // XI slots
    const slots = this.draftLineup.playerIds;
    const usedElsewhere = (slotIdx: number) => new Set(slots.filter((_, j) => j !== slotIdx));
    $('xi').innerHTML = slots.map((pid, i) => {
      const roleForSlot = this.slotRole(i);
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

    // bench
    const inXI = new Set(slots);
    const bench = this.club.players.filter((p) => !inXI.has(p.id)).sort((a, b) => overall(b) - overall(a));
    $('bench').innerHTML = `<b>Bench:</b> ${bench.map((p) => `${p.name} (${p.role} ${overall(p)})`).join(' · ')}`;
    if (!$('squad-panel').classList.contains('hidden')) this.renderSquadPanel();
    this.renderScout();
    this.updateEditorInsight();
  }

  private renderSquadPanel() {
    if (!this.draftLineup) return;
    $('squad-panel').innerHTML = statsTableHTML(this.club.players, new Set(this.draftLineup.playerIds));
  }

  private renderScout() {
    const f = this.round.fixtures[this.activeFixture];
    if (!f) return;
    const oppTeam = buildXI(f.opp, f.oppLineup);
    $('scout-summary').innerHTML =
      `<b>${f.opp.name}</b> set up in <b>${f.oppTactics.formation}</b>, playing ${tacticWords(f.oppTactics)}.<br>`
      + `${insightFor(oppTeam, false)}<br>`
      + `<span class="counter">🎯 To beat them: ${counterAdvice(f.oppTactics)}</span>`;
    if (!$('opp-panel').classList.contains('hidden')) $('opp-panel').innerHTML = statsTableHTML(oppTeam.players);
  }

  private slotRole(i: number): string {
    // derive the slot's role from the formation table via a built XI (roles carried from formation)
    const roles: Record<Formation, string[]> = {
      '4-4-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
      '4-3-3': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
      '3-5-2': ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
      '4-2-3-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW'],
    };
    return roles[this.draftTactics.formation][i];
  }

  private updateEditorInsight() {
    const team = buildXI(this.club, this.draftLineup);
    $('lineup-insight').innerHTML = insightFor(team, true);
  }

  // ---- MATCH ----
  private kickOff() {
    const f = this.round.fixtures[this.activeFixture];
    f.myLineup = { ...this.draftLineup, playerIds: [...this.draftLineup.playerIds] };
    f.myTactics = { ...this.draftTactics };
    const myTeam = buildXI(this.club, f.myLineup);
    const oppTeam = buildXI(f.opp, f.oppLineup);
    this.engine = new MatchEngine([myTeam, oppTeam], f.matchSeed, [{ ...f.myTactics }, { ...f.oppTactics }]);
    this.running = true; this.paused = false; this.halftimeDone = false; this.accum = 0; this.eventsShown = 0;
    $('halftime').classList.add('hidden');
    $('home-name').textContent = this.club.name;
    $('away-name').textContent = `${f.opp.name} [${f.oppTactics.formation}]`;
    $('ticker').innerHTML = '';
    this.scene!.buildSprites(this.engine.teams);
    this.showScreen('match');
  }

  private pauseHalfTime() {
    this.paused = true;
    $('halftime').classList.remove('hidden');
  }

  private resumeMatch(applyChanges: boolean) {
    if (applyChanges && this.engine) {
      const f = this.round.fixtures[this.activeFixture];
      f.myLineup = { ...this.draftLineup, playerIds: [...this.draftLineup.playerIds] };
      f.myTactics = { ...this.draftTactics };
      const myTeam = buildXI(this.club, f.myLineup);
      this.engine.applyHalfTimeChanges(0, myTeam, { ...f.myTactics });
      this.scene!.buildSprites(this.engine.teams);
    }
    this.paused = false; this.halftimeDone = true;
    $('halftime').classList.add('hidden');
    this.showScreen('match');
  }

  private onFullTime() {
    this.running = false;
    const f = this.round.fixtures[this.activeFixture];
    f.result = [this.engine!.state.score[0], this.engine!.state.score[1]];
    this.save();
    setTimeout(() => this.showScreen('hub'), 1400); // brief pause on the final whistle
  }

  onFrame(dMs: number) {
    if (this.screen !== 'match' || !this.engine) return;
    if (this.running && !this.paused) {
      this.accum += (dMs / 1000) * 10 * this.speed;
      while (this.accum >= TICK_SEC && !this.engine.state.finished) {
        this.engine.tick();
        this.accum -= TICK_SEC;
        if (!this.halftimeDone && this.engine.state.clockSec >= HALFTIME_SEC) { this.pauseHalfTime(); break; }
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
    const team = this.engine!.teams[e.teamIdx].shortName;
    const line: Record<MatchEvent['type'], string> = {
      kickoff: `${e.minute}' Kickoff!`,
      goal: `${e.minute}' ⚽ GOAL! ${e.playerName} (${team})`,
      chance: `${e.minute}' Big chance for ${e.playerName} (${team})...`,
      shot_saved: `${e.minute}' Save! ${e.playerName} (${team}) denied`,
      shot_missed: `${e.minute}' ${e.playerName} (${team}) shoots wide`,
      halftime: `${e.minute}' Half-time`,
      fulltime: `${e.minute}' Full-time`,
    };
    const div = document.createElement('div');
    div.textContent = line[e.type];
    if (e.type === 'goal') div.style.color = '#ffd75e';
    else if (e.type === 'chance') div.style.color = '#8ad';
    $('ticker').prepend(div);
  }
}

class MatchScene extends Phaser.Scene {
  private sprites: Phaser.GameObjects.Image[][] = [[], []];
  private ballSprite!: Phaser.GameObjects.Image;

  create() {
    try {
      makePitchTexture(this);
      makeBallTexture(this);
      this.add.image(0, 0, 'pitch').setOrigin(0);
      GAME.scene = this;
      GAME.boot();
    } catch (e) { console.log('CREATEERR::', (e as Error).stack); }
  }

  buildSprites(teams: [Team, Team]) {
    this.sprites.flat().forEach((s) => s.destroy());
    this.ballSprite?.destroy();
    this.sprites = [0, 1].map((t) =>
      teams[t].players.map((p) => {
        const key = `p-${t}-${p.role === 'GK' ? 'gk' : 'out'}`;
        makePlayerTexture(this, key, teams[t].shirtColor, p.role === 'GK');
        return this.add.image(0, 0, key).setScale(3).setOrigin(0.5, 0.85);
      }),
    );
    this.ballSprite = this.add.image(0, 0, 'ball').setScale(3);
  }

  sync(state: MatchEngine['state']) {
    if (!this.ballSprite) return;
    for (const t of [0, 1] as const) {
      state.players[t].forEach((ps, i) => this.sprites[t]?.[i]?.setPosition(ps.x * SCALE, ps.y * SCALE));
    }
    this.ballSprite.setPosition(state.ball.x * SCALE, state.ball.y * SCALE - 4);
  }

  update(_t: number, deltaMs: number) { GAME.onFrame(deltaMs); }
}

GAME = new Game();
new Phaser.Game({ type: Phaser.CANVAS, parent: 'game', width: W, height: H, pixelArt: true, backgroundColor: '#10141c', scene: MatchScene });
