import Phaser from 'phaser';
import {
  MatchEngine, generateTeam, overall, PITCH, TICK_SEC,
  DEFAULT_TACTICS, TACTIC_PRESETS, type Tactics, type Formation, type MatchEvent, type Team, type Player,
} from '@fm/shared';
import { SCALE, makeBallTexture, makePitchTexture, makePlayerTexture } from './pixelart';

const W = PITCH.w * SCALE, H = PITCH.h * SCALE;

// Fixed seed for the manager's own club, so Pixel United is a PERSISTENT squad
// across matches (only the opponent and the match simulation vary).
const HOME_SEED = 990201;
const HOME_QUALITY = 14;

// slider option labels, value -2..2
const LEVELS: Record<keyof Omit<Tactics, 'formation'>, string[]> = {
  mentality: ['Very Defensive', 'Defensive', 'Balanced', 'Attacking', 'Very Attacking'],
  line: ['Very Deep', 'Deep', 'Normal', 'High', 'Very High'],
  press: ['Contain', 'Low', 'Balanced', 'High', 'Gegenpress'],
  tempo: ['Very Patient', 'Patient', 'Balanced', 'Direct', 'Very Direct'],
  width: ['Very Narrow', 'Narrow', 'Balanced', 'Wide', 'Very Wide'],
};
const FORMATIONS: Formation[] = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'];

const $ = (id: string) => document.getElementById(id)!;

/** Colour a 1-20 stat cell: green (strong) -> red (weak). */
function statColor(v: number): string {
  if (v >= 17) return '#3ad07a';
  if (v >= 14) return '#7bd88f';
  if (v >= 11) return '#c9d17b';
  if (v >= 8) return '#d9a860';
  return '#d16a5a';
}

class MatchScene extends Phaser.Scene {
  private engine!: MatchEngine;
  private sprites: Phaser.GameObjects.Image[][] = [[], []];
  private ballSprite!: Phaser.GameObjects.Image;
  private accum = 0;
  private speed = 1;
  private eventsShown = 0;
  private homeTactics: Tactics = { ...DEFAULT_TACTICS };
  private awayTactics: Tactics = { ...TACTIC_PRESETS.Balanced };
  private squadSide: 0 | 1 = 0;

  create() {
    makePitchTexture(this);
    makeBallTexture(this);
    this.add.image(0, 0, 'pitch').setOrigin(0);
    this.buildTacticsUI();
    this.newMatch();

    const setSpeed = (s: number, id: string) => {
      this.speed = s;
      ['spd1', 'spd4', 'spd12'].forEach((b) => $(b).classList.remove('active'));
      $(id).classList.add('active');
    };
    $('spd1').addEventListener('click', () => setSpeed(1, 'spd1'));
    $('spd4').addEventListener('click', () => setSpeed(4, 'spd4'));
    $('spd12').addEventListener('click', () => setSpeed(12, 'spd12'));
    $('newmatch').addEventListener('click', () => this.newMatch());

    // view + squad-side toggles
    $('view-match').addEventListener('click', () => this.showView('match'));
    $('view-squad').addEventListener('click', () => this.showView('squad'));
    $('sq-home').addEventListener('click', () => { this.squadSide = 0; $('sq-home').classList.add('active'); $('sq-away').classList.remove('active'); this.renderSquad(); });
    $('sq-away').addEventListener('click', () => { this.squadSide = 1; $('sq-away').classList.add('active'); $('sq-home').classList.remove('active'); this.renderSquad(); });
  }

  private showView(v: 'match' | 'squad') {
    const squad = v === 'squad';
    $('squad').style.display = squad ? 'block' : 'none';
    $('main').style.display = squad ? 'none' : 'flex';
    $('view-squad').classList.toggle('active', squad);
    $('view-match').classList.toggle('active', !squad);
    if (squad) this.renderSquad();
  }

  private buildTacticsUI() {
    // formation dropdown
    const fSel = $('t-formation') as HTMLSelectElement;
    FORMATIONS.forEach((f) => fSel.add(new Option(f, f)));
    fSel.value = this.homeTactics.formation;
    fSel.addEventListener('change', () => { this.homeTactics.formation = fSel.value as Formation; this.newMatch(); });

    // five slider selects
    (Object.keys(LEVELS) as Array<keyof typeof LEVELS>).forEach((key) => {
      const sel = $(`t-${key}`) as HTMLSelectElement;
      LEVELS[key].forEach((label, i) => sel.add(new Option(label, String(i - 2))));
      sel.value = String(this.homeTactics[key]);
      sel.addEventListener('change', () => this.applyLiveTactics());
    });

    // preset buttons
    const box = $('presets');
    Object.keys(TACTIC_PRESETS).forEach((name) => {
      const b = document.createElement('button');
      b.textContent = name;
      b.addEventListener('click', () => { this.homeTactics = { ...TACTIC_PRESETS[name] }; this.syncTacticsUI(); this.newMatch(); });
      box.appendChild(b);
    });
  }

  private syncTacticsUI() {
    ($('t-formation') as HTMLSelectElement).value = this.homeTactics.formation;
    (Object.keys(LEVELS) as Array<keyof typeof LEVELS>).forEach((key) => {
      ($(`t-${key}`) as HTMLSelectElement).value = String(this.homeTactics[key]);
    });
  }

  private applyLiveTactics() {
    (Object.keys(LEVELS) as Array<keyof typeof LEVELS>).forEach((key) => {
      this.homeTactics[key] = Number(($(`t-${key}`) as HTMLSelectElement).value);
    });
    this.engine?.setTactics(0, { ...this.homeTactics });
  }

  private newMatch() {
    const seed = Math.floor(Math.random() * 2 ** 31);
    // opponent gets a random tactical identity for variety
    const presetNames = Object.keys(TACTIC_PRESETS);
    this.awayTactics = { ...TACTIC_PRESETS[presetNames[Math.floor(Math.random() * presetNames.length)]] };

    // persistent squad: fixed seed (varies only with the chosen formation shape)
    const fIdx = FORMATIONS.indexOf(this.homeTactics.formation);
    const home = generateTeam('hom', 'Pixel United', 'PIX', 0xd23b3b, HOME_QUALITY, HOME_SEED + fIdx * 1000, this.homeTactics.formation);
    const away = generateTeam('awy', 'Retro City', 'RET', 0x3b6bd2, 13, seed ^ 0x5a5a, this.awayTactics.formation);
    this.engine = new MatchEngine([home, away], seed, [{ ...this.homeTactics }, { ...this.awayTactics }]);
    this.eventsShown = 0;
    $('home-name').textContent = home.name;
    $('away-name').textContent = `${away.name} [${this.awayTactics.formation}]`;
    $('ticker').innerHTML = '';

    this.sprites.flat().forEach((s) => s.destroy());
    this.ballSprite?.destroy();
    this.sprites = [0, 1].map((t) =>
      this.engine.teams[t].players.map((p) => {
        const key = `p-${t}-${p.role === 'GK' ? 'gk' : 'out'}`;
        makePlayerTexture(this, key, this.engine.teams[t].shirtColor, p.role === 'GK');
        return this.add.image(0, 0, key).setScale(3).setOrigin(0.5, 0.85);
      }),
    );
    this.ballSprite = this.add.image(0, 0, 'ball').setScale(3);
    this.syncSprites();
    if ($('squad').style.display === 'block') this.renderSquad();
  }

  // ---- squad screen ----

  private renderSquad() {
    const team = this.engine.teams[this.squadSide];
    const isHome = this.squadSide === 0;
    $('sq-team').textContent = isHome ? `${team.name}  (${this.homeTactics.formation})` : `${team.name}  (${this.awayTactics.formation})`;
    $('sq-insights').innerHTML = this.insights(team, isHome);

    const cols: Array<[string, keyof Player['attrs']]> = [
      ['PAC', 'pace'], ['STR', 'strength'], ['PAS', 'passing'], ['SHO', 'shooting'],
      ['TAK', 'tackling'], ['POS', 'positioning'], ['WRK', 'workrate'], ['KEE', 'keeping'],
    ];
    const head = `<tr><th>#</th><th>Pos</th><th style="text-align:left">Name</th><th>OVR</th>${cols.map(([l]) => `<th>${l}</th>`).join('')}</tr>`;
    const rows = team.players.map((p, i) => {
      const cells = cols.map(([, k]) => `<td class="stat" style="background:${statColor(p.attrs[k])}">${p.attrs[k]}</td>`).join('');
      return `<tr class="${p.role === 'GK' ? 'gk' : ''}"><td>${i + 1}</td><td class="pos">${p.role}</td><td class="name">${p.name}</td><td class="stat" style="background:${statColor(overall(p))}">${overall(p)}</td>${cells}</tr>`;
    }).join('');
    $('sq-table').innerHTML = `<table class="squad">${head}${rows}</table>`;
  }

  private insights(team: Team, isHome: boolean): string {
    const byRole = (r: Player['role']) => team.players.filter((p) => p.role === r);
    const avg = (ps: Player[], k: keyof Player['attrs']) => ps.length ? Math.round(ps.reduce((a, p) => a + p.attrs[k], 0) / ps.length) : 0;
    const fw = byRole('FW'), df = byRole('DF');
    const fwPace = avg(fw, 'pace'), fwStr = avg(fw, 'strength'), fwSho = avg(fw, 'shooting');
    const dfPace = avg(df, 'pace'), dfTak = avg(df, 'tackling');
    const best = team.players.reduce((a, b) => (overall(b) > overall(a) ? b : a));
    const who = isHome ? 'Your' : 'Their';
    const tips: string[] = [];
    tips.push(`★ Key player: <b>${best.name}</b> (${best.role}, OVR ${overall(best)})`);
    if (fwPace >= 15) tips.push(`⚡ ${who} forwards are quick (pace ${fwPace}) — ${isHome ? 'a high line + direct tempo suit you' : 'don\'t push your line too high'}.`);
    else if (fwStr >= 15) tips.push(`💪 ${who} forwards are strong (strength ${fwStr}) — ${isHome ? 'Route One / long balls pay off' : 'they\'ll win aerial duels'}.`);
    else tips.push(`${who} forwards: pace ${fwPace}, shooting ${fwSho}, strength ${fwStr}.`);
    if (dfPace <= 11) tips.push(`⚠️ ${who} defenders are slow (pace ${dfPace}) — ${isHome ? 'a high line is risky; sit deeper' : 'exploit with pace in behind (high line + direct)'}.`);
    else tips.push(`${who} defenders: tackling ${dfTak}, pace ${dfPace}.`);
    return tips.join('<br>');
  }

  update(_t: number, deltaMs: number) {
    const gameSecPerRealSec = 10 * this.speed;
    this.accum += (deltaMs / 1000) * gameSecPerRealSec;
    while (this.accum >= TICK_SEC && !this.engine.state.finished) {
      this.engine.tick();
      this.accum -= TICK_SEC;
    }
    this.syncSprites();
    this.syncHud();
  }

  private syncSprites() {
    const s = this.engine.state;
    for (const t of [0, 1] as const) {
      s.players[t].forEach((ps, i) => this.sprites[t][i].setPosition(ps.x * SCALE, ps.y * SCALE));
    }
    this.ballSprite.setPosition(s.ball.x * SCALE, s.ball.y * SCALE - 4);
  }

  private syncHud() {
    const s = this.engine.state;
    $('score').textContent = `${s.score[0]} - ${s.score[1]}`;
    const m = Math.floor(s.clockSec / 60), sec = Math.floor(s.clockSec % 60);
    $('clock').textContent = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

    // possession bar
    const tot = s.possession[0] + s.possession[1] || 1;
    const hp = Math.round((s.possession[0] / tot) * 100);
    ($('poss-home') as HTMLElement).style.width = `${hp}%`;
    $('poss-home-l').textContent = `${hp}%`;
    $('poss-away-l').textContent = `${100 - hp}%`;

    // home squad fitness (outfield average)
    const fitAvg = s.players[0].slice(1).reduce((a, p) => a + p.fitness, 0) / 10;
    $('fit-label').textContent = `Your squad fitness: ${Math.round(fitAvg * 100)}%`;

    while (this.eventsShown < s.events.length) this.pushTicker(s.events[this.eventsShown++]);
  }

  private pushTicker(e: MatchEvent) {
    const team = this.engine.teams[e.teamIdx].shortName;
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

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  pixelArt: true,
  backgroundColor: '#10141c',
  scene: MatchScene,
});
