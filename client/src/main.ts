import Phaser from 'phaser';
import {
  MatchEngine, generateTeam, PITCH, TICK_SEC,
  DEFAULT_TACTICS, TACTIC_PRESETS, type Tactics, type Formation, type MatchEvent,
} from '@fm/shared';
import { SCALE, makeBallTexture, makePitchTexture, makePlayerTexture } from './pixelart';

const W = PITCH.w * SCALE, H = PITCH.h * SCALE;

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

class MatchScene extends Phaser.Scene {
  private engine!: MatchEngine;
  private sprites: Phaser.GameObjects.Image[][] = [[], []];
  private ballSprite!: Phaser.GameObjects.Image;
  private accum = 0;
  private speed = 1;
  private eventsShown = 0;
  private homeTactics: Tactics = { ...DEFAULT_TACTICS };
  private awayTactics: Tactics = { ...TACTIC_PRESETS.Balanced };

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

    const home = generateTeam('hom', 'Pixel United', 'PIX', 0xd23b3b, 14, seed ^ 0xa5a5, this.homeTactics.formation);
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
