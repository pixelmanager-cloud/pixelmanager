import Phaser from 'phaser';
import { MatchEngine, generateTeam, PITCH, TICK_SEC, type MatchEvent } from '@fm/shared';
import { SCALE, makeBallTexture, makePitchTexture, makePlayerTexture } from './pixelart';

const W = PITCH.w * SCALE, H = PITCH.h * SCALE;

class MatchScene extends Phaser.Scene {
  private engine!: MatchEngine;
  private sprites: Phaser.GameObjects.Image[][] = [[], []];
  private ballSprite!: Phaser.GameObjects.Image;
  private accum = 0;
  private speed = 1;               // game-seconds per real second multiplier baseline
  private eventsShown = 0;

  create() {
    makePitchTexture(this);
    makeBallTexture(this);
    this.add.image(0, 0, 'pitch').setOrigin(0);
    this.newMatch();

    const setSpeed = (s: number, id: string) => {
      this.speed = s;
      document.querySelectorAll('#hud button').forEach((b) => b.classList.remove('active'));
      document.getElementById(id)!.classList.add('active');
    };
    document.getElementById('spd1')!.addEventListener('click', () => setSpeed(1, 'spd1'));
    document.getElementById('spd4')!.addEventListener('click', () => setSpeed(4, 'spd4'));
    document.getElementById('spd12')!.addEventListener('click', () => setSpeed(12, 'spd12'));
    document.getElementById('newmatch')!.addEventListener('click', () => this.newMatch());
  }

  private newMatch() {
    const seed = Math.floor(Math.random() * 2 ** 31);
    const home = generateTeam('hom', 'Pixel United', 'PIX', 0xd23b3b, 70, seed ^ 0xa5a5);
    const away = generateTeam('awy', 'Retro City', 'RET', 0x3b6bd2, 68, seed ^ 0x5a5a);
    this.engine = new MatchEngine([home, away], seed);
    this.eventsShown = 0;
    document.getElementById('home-name')!.textContent = home.name;
    document.getElementById('away-name')!.textContent = away.name;
    document.getElementById('ticker')!.innerHTML = '';

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
    // real-time pacing: 1x plays a match in ~9 min (10 game-sec per real sec)
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
    document.getElementById('score')!.textContent = `${s.score[0]} - ${s.score[1]}`;
    const m = Math.floor(s.clockSec / 60), sec = Math.floor(s.clockSec % 60);
    document.getElementById('clock')!.textContent = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    while (this.eventsShown < s.events.length) {
      this.pushTicker(s.events[this.eventsShown++]);
    }
  }

  private pushTicker(e: MatchEvent) {
    const team = this.engine.teams[e.teamIdx].shortName;
    const line: Record<MatchEvent['type'], string> = {
      kickoff: `${e.minute}' Kickoff!`,
      goal: `${e.minute}' ⚽ GOAL! ${e.playerName} (${team})`,
      shot_saved: `${e.minute}' Save! ${e.playerName} (${team}) denied`,
      shot_missed: `${e.minute}' ${e.playerName} (${team}) shoots wide`,
      halftime: `${e.minute}' Half-time`,
      fulltime: `${e.minute}' Full-time`,
    };
    const div = document.createElement('div');
    div.textContent = line[e.type];
    if (e.type === 'goal') div.style.color = '#ffd75e';
    const ticker = document.getElementById('ticker')!;
    ticker.prepend(div);
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
