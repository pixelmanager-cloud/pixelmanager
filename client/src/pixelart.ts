import Phaser from 'phaser';
import { PITCH } from '@fm/shared';

export const SCALE = 8; // pixels per metre => 840x544 pitch canvas

/** Draw a pixel-art footballer (8x12) onto a texture: shirt color + skin + shorts. */
export function makePlayerTexture(scene: Phaser.Scene, key: string, shirt: number, gk = false) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  const skin = 0xd9a066;
  const shorts = gk ? 0x222222 : 0xf0f0f0;
  const body = gk ? 0xd4a017 : shirt;
  // head
  g.fillStyle(skin).fillRect(2, 0, 4, 3);
  // shirt
  g.fillStyle(body).fillRect(1, 3, 6, 4);
  g.fillRect(0, 3, 1, 2).fillRect(7, 3, 1, 2); // sleeves
  // shorts
  g.fillStyle(shorts).fillRect(2, 7, 4, 2);
  // legs
  g.fillStyle(skin).fillRect(2, 9, 1, 2).fillRect(5, 9, 1, 2);
  // boots
  g.fillStyle(0x111111).fillRect(2, 11, 2, 1).fillRect(5, 11, 2, 1);
  g.generateTexture(key, 8, 12);
  g.destroy();
}

export function makeBallTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('ball')) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff).fillRect(1, 0, 2, 1).fillRect(0, 1, 4, 2).fillRect(1, 3, 2, 1);
  g.fillStyle(0x333333).fillRect(1, 1, 1, 1);
  g.generateTexture('ball', 4, 4);
  g.destroy();
}

/** Pitch: striped grass, touchlines, boxes, centre circle — drawn once at metre scale. */
export function makePitchTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('pitch')) return;
  const w = PITCH.w * SCALE, h = PITCH.h * SCALE;
  const g = scene.add.graphics();
  for (let i = 0; i < 12; i++) {
    g.fillStyle(i % 2 === 0 ? 0x2f7a32 : 0x2a6e2d);
    g.fillRect((i * w) / 12, 0, w / 12 + 1, h);
  }
  g.lineStyle(2, 0xcfe8cf, 0.9);
  g.strokeRect(2, 2, w - 4, h - 4);
  g.lineBetween(w / 2, 2, w / 2, h - 2);
  g.strokeCircle(w / 2, h / 2, 9.15 * SCALE);
  // penalty boxes (16.5m deep, 40.3m wide) and goals
  const boxW = 16.5 * SCALE, boxH = 40.3 * SCALE, goalH = 7.32 * SCALE;
  g.strokeRect(2, (h - boxH) / 2, boxW, boxH);
  g.strokeRect(w - 2 - boxW, (h - boxH) / 2, boxW, boxH);
  g.lineStyle(4, 0xffffff, 1);
  g.lineBetween(2, (h - goalH) / 2, 2, (h + goalH) / 2);
  g.lineBetween(w - 2, (h - goalH) / 2, w - 2, (h + goalH) / 2);
  g.generateTexture('pitch', w, h);
  g.destroy();
}
