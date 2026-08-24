import Phaser from 'phaser';
import { PITCH } from '@fm/shared';

export const SCALE = 8; // pixels per metre => 840x544 pitch canvas

/**
 * Draw a pixel-art footballer as TWO frames (baseKey+"0" rest, baseKey+"1" stride)
 * so the client can flip between them for a running animation.
 */
export function makePlayerFrames(scene: Phaser.Scene, baseKey: string, shirt: number, gk = false) {
  const skin = 0xd9a066;
  const shorts = gk ? 0x222222 : 0xf0f0f0;
  const body = gk ? 0xd4a017 : shirt;
  for (const frame of [0, 1]) {
    const key = baseKey + frame;
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics();
    g.fillStyle(skin).fillRect(2, 0, 4, 3);                 // head
    g.fillStyle(body).fillRect(1, 3, 6, 4);                 // shirt
    g.fillRect(0, 3, 1, 2).fillRect(7, 3, 1, 2);            // sleeves
    g.fillStyle(shorts).fillRect(2, 7, 4, 2);               // shorts
    if (frame === 0) {                                      // legs together (contact)
      g.fillStyle(skin).fillRect(2, 9, 1, 2).fillRect(5, 9, 1, 2);
      g.fillStyle(0x111111).fillRect(2, 11, 2, 1).fillRect(5, 11, 2, 1);
    } else {                                                // legs striding
      g.fillStyle(skin).fillRect(1, 9, 1, 2).fillRect(6, 9, 1, 2);
      g.fillStyle(0x111111).fillRect(0, 11, 2, 1).fillRect(6, 11, 2, 1);
    }
    g.generateTexture(key, 8, 12);
    g.destroy();
  }
}

/** Soft ground shadow (grounds the sprites, adds depth). */
export function makeShadowTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('shadow')) return;
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.32).fillEllipse(7, 3, 13, 5);
  g.generateTexture('shadow', 14, 6);
  g.destroy();
}

/** Glowing ring drawn under the ball carrier so the eye can follow the play. */
export function makeCarrierTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('carrier')) return;
  const g = scene.add.graphics();
  g.lineStyle(2, 0xffe14d, 0.55).strokeEllipse(9, 9, 16, 8);
  g.lineStyle(2, 0xffe14d, 0.9).strokeEllipse(9, 9, 11, 5);
  g.generateTexture('carrier', 18, 18);
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

/** Plain white ball silhouette (no panel spot) — reused at low alpha for a subtle motion trail. */
export function makeBallGhostTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('ball-ghost')) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff).fillRect(1, 0, 2, 1).fillRect(0, 1, 4, 2).fillRect(1, 3, 2, 1);
  g.generateTexture('ball-ghost', 4, 4);
  g.destroy();
}

/** Pitch: mown checkerboard grass, full markings, goal nets — drawn once at metre scale. */
export function makePitchTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('pitch')) return;
  const w = PITCH.w * SCALE, h = PITCH.h * SCALE;
  const cx = w / 2, cy = h / 2;
  const m = (metres: number) => metres * SCALE;
  const g = scene.add.graphics();

  // checkerboard mown grass
  const cols = 12, rows = 8;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      g.fillStyle((r + c) % 2 === 0 ? 0x2f7a32 : 0x2a6e2d);
      g.fillRect((c * w) / cols, (r * h) / rows, w / cols + 1, h / rows + 1);
    }
  }
  // darker perimeter band for depth (advertising-board surround)
  g.fillStyle(0x14401a, 1);
  g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);

  const white = 0xffffff;
  const line = 0xe6f2e6;
  g.lineStyle(2, line, 0.9);
  // touchlines + halfway + centre circle/spot
  g.strokeRect(3, 3, w - 6, h - 6);
  g.lineBetween(cx, 3, cx, h - 3);
  g.strokeCircle(cx, cy, m(9.15));
  g.fillStyle(line, 0.9).fillCircle(cx, cy, 2.5);

  // boxes: penalty (16.5x40.3), six-yard (5.5x18.3); penalty spot at 11m
  const penW = m(16.5), penH = m(40.3), sixW = m(5.5), sixH = m(18.3), goalH = m(7.32);
  const penY = (h - penH) / 2, sixY = (h - sixH) / 2, goalY = (h - goalH) / 2;
  g.strokeRect(3, penY, penW, penH);
  g.strokeRect(w - 3 - penW, penY, penW, penH);
  g.strokeRect(3, sixY, sixW, sixH);
  g.strokeRect(w - 3 - sixW, sixY, sixW, sixH);
  const spotL = 3 + m(11), spotR = w - 3 - m(11);
  g.fillCircle(spotL, cy, 2.5); g.fillCircle(spotR, cy, 2.5);

  // penalty arcs (the "D") — only the part outside each box
  const arcR = m(9.15), a = Math.acos((penW - m(11)) / arcR);
  g.beginPath(); g.arc(spotL, cy, arcR, -a, a); g.strokePath();
  g.beginPath(); g.arc(spotR, cy, arcR, Math.PI - a, Math.PI + a); g.strokePath();

  // corner arcs
  const cr = m(1);
  g.beginPath(); g.arc(3, 3, cr, 0, Math.PI / 2); g.strokePath();
  g.beginPath(); g.arc(w - 3, 3, cr, Math.PI / 2, Math.PI); g.strokePath();
  g.beginPath(); g.arc(3, h - 3, cr, -Math.PI / 2, 0); g.strokePath();
  g.beginPath(); g.arc(w - 3, h - 3, cr, Math.PI, 1.5 * Math.PI); g.strokePath();

  // goal nets (crosshatch behind each goal line) + solid posts
  const netD = 9;
  for (const side of [0, 1]) {
    const nx = side === 0 ? 3 : w - 3 - netD;
    g.fillStyle(0x1e5322, 0.55).fillRect(nx, goalY, netD, goalH);
    g.lineStyle(1, white, 0.28);
    for (let x = nx; x <= nx + netD; x += 3) g.lineBetween(x, goalY, x, goalY + goalH);
    for (let y = goalY; y <= goalY + goalH; y += 3) g.lineBetween(nx, y, nx + netD, y);
  }
  g.lineStyle(3, white, 1);
  g.lineBetween(3, goalY, 3, goalY + goalH);
  g.lineBetween(w - 3, goalY, w - 3, goalY + goalH);

  g.generateTexture('pitch', w, h);
  g.destroy();
}
