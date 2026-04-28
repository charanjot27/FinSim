import Phaser from 'phaser';

export interface DecorOpts {
  depth?: number;
}

export function drawStreetLamp(
  scene: Phaser.Scene,
  x: number,
  y: number,
  opts: DecorOpts = {},
): void {
  const depth = opts.depth ?? 12;
  const g = scene.add.graphics().setDepth(depth);

  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(x, y + 2, 26, 7);

  g.fillStyle(0x1B2638, 1);
  g.fillRect(x - 6, y - 6, 12, 6);
  g.fillStyle(0x0E1A2A, 1);
  g.fillRect(x - 7, y - 9, 14, 3);

  g.fillStyle(0x222B3C, 1);
  g.fillRect(x - 1.5, y - 60, 3, 54);

  g.fillRect(x - 11, y - 60, 22, 3);

  g.fillStyle(0x0E1A2A, 1);
  g.fillRect(x - 8, y - 72, 16, 12);
  g.fillStyle(0x1B2638, 1);
  g.fillRect(x - 6, y - 70, 12, 8);

  const bulb = scene.add.circle(x, y - 66, 3.5, 0xFFE08A, 1).setDepth(depth + 1);

  const halo = scene.add.circle(x, y - 66, 22, 0xFFE08A, 0.18).setDepth(depth);
  scene.tweens.add({
    targets: [halo],
    alpha: { from: 0.18, to: 0.32 },
    scaleX: { from: 1, to: 1.15 },
    scaleY: { from: 1, to: 1.15 },
    duration: 1500 + Math.random() * 500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  scene.tweens.add({
    targets: [bulb],
    alpha: { from: 0.95, to: 1 },
    duration: 700,
    yoyo: true,
    repeat: -1,
  });
}

export function drawTree(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1,
  opts: DecorOpts = {},
): void {
  const depth = opts.depth ?? 11;
  const g = scene.add.graphics().setDepth(depth);
  const r = 18 * scale;

  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(x + 4, y + 2, r * 2.4, r * 0.5);

  g.fillStyle(0x4A2F18, 1);
  g.fillRect(x - 3 * scale, y - 6, 6 * scale, 16 * scale);

  g.fillStyle(0x6B4424, 1);
  g.fillRect(x - 3 * scale, y - 6, 2 * scale, 16 * scale);

  const canopyColors = [0x2E7D32, 0x388E3C, 0x43A047];
  const baseCY = y - 18 * scale;
  g.fillStyle(canopyColors[0], 1);
  g.fillCircle(x, baseCY, r);
  g.fillStyle(canopyColors[1], 1);
  g.fillCircle(x - r * 0.55, baseCY - r * 0.3, r * 0.85);
  g.fillCircle(x + r * 0.55, baseCY - r * 0.25, r * 0.9);
  g.fillStyle(canopyColors[2], 1);
  g.fillCircle(x - r * 0.2, baseCY - r * 0.6, r * 0.7);

  g.fillStyle(0x66BB6A, 0.7);
  g.fillCircle(x - r * 0.35, baseCY - r * 0.4, r * 0.35);
}

export function drawBench(
  scene: Phaser.Scene,
  x: number,
  y: number,
  vertical = false,
  opts: DecorOpts = {},
): void {
  const depth = opts.depth ?? 10;
  const g = scene.add.graphics().setDepth(depth);
  if (vertical) {

    g.fillStyle(0x000000, 0.3); g.fillRect(x - 8, y - 22, 18, 50);

    g.fillStyle(0x2A2018, 1);
    g.fillRect(x - 7, y - 22, 3, 50);
    g.fillRect(x + 4, y - 22, 3, 50);

    g.fillStyle(0x6B4424, 1); g.fillRect(x - 7, y - 22, 14, 50);

    g.fillStyle(0x4A2F18, 1);
    g.fillRect(x - 7, y - 9, 14, 2);
    g.fillRect(x - 7, y + 4, 14, 2);
    g.fillRect(x - 7, y + 17, 14, 2);

    g.fillStyle(0x8B5E32, 1); g.fillRect(x - 7, y - 22, 14, 2);
  } else {

    g.fillStyle(0x000000, 0.3); g.fillRect(x - 22, y - 8, 50, 18);
    g.fillStyle(0x2A2018, 1);
    g.fillRect(x - 22, y - 7, 3, 18);
    g.fillRect(x + 19, y - 7, 3, 18);
    g.fillStyle(0x6B4424, 1); g.fillRect(x - 22, y - 7, 50, 14);
    g.fillStyle(0x4A2F18, 1);
    g.fillRect(x - 9, y - 7, 2, 14);
    g.fillRect(x + 4, y - 7, 2, 14);
    g.fillRect(x + 17, y - 7, 2, 14);
    g.fillStyle(0x8B5E32, 1); g.fillRect(x - 22, y - 7, 50, 2);
  }
}

export function drawBridge(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  width = 120,
  height = 38,
  opts: DecorOpts = {},
): void {
  const depth = opts.depth ?? 9;
  const g = scene.add.graphics().setDepth(depth);
  const left = cx - width / 2;
  const top = cy - height / 2;

  g.fillStyle(0x2D5775, 0.95);
  g.fillRoundedRect(left - 8, top - 4, width + 16, height + 12, 6);

  g.fillStyle(0x6BB1D6, 0.6);
  for (let i = 0; i < 6; i++) {
    g.fillRect(left + 10 + i * (width / 6), top + 8 + (i % 2) * 6, 12, 2);
  }

  g.fillStyle(0x6B4424, 1);
  g.fillRoundedRect(left, top, width, height, 4);

  g.fillStyle(0x3D2614, 1);
  for (let px = left + 12; px < left + width; px += 14) {
    g.fillRect(px, top, 1.5, height);
  }

  g.fillStyle(0x8B5E32, 1);
  g.fillRect(left, top - 4, width, 4);
  g.fillRect(left, top + height, width, 4);

  g.fillStyle(0x4A2F18, 1);
  for (let px = left + 8; px < left + width; px += 22) {
    g.fillRect(px, top - 8, 3, 6);
    g.fillRect(px, top + height + 2, 3, 6);
  }

  g.fillStyle(0x3D2614, 1);
  g.fillRect(left - 2, top - 12, 6, 16);
  g.fillRect(left + width - 4, top - 12, 6, 16);
  g.fillRect(left - 2, top + height - 4, 6, 16);
  g.fillRect(left + width - 4, top + height - 4, 6, 16);
}

export function drawPlanter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  opts: DecorOpts = {},
): void {
  const depth = opts.depth ?? 10;
  const g = scene.add.graphics().setDepth(depth);

  g.fillStyle(0x6E4936, 1);
  g.fillRect(x - 14, y - 10, 28, 20);
  g.fillStyle(0x8B5E32, 1);
  g.fillRect(x - 14, y - 12, 28, 4);

  g.fillStyle(0x3D2614, 1);
  g.fillRect(x - 12, y - 10, 24, 4);

  g.fillStyle(0x2E7D32, 1);
  g.fillCircle(x - 8, y - 14, 6);
  g.fillCircle(x + 6, y - 14, 6);
  g.fillCircle(x, y - 18, 7);

  const flowerColors = [0xE8375A, 0xF4C542, 0xC8A8E9, 0xFF8AB6];
  for (let i = 0; i < 4; i++) {
    const fx = x - 9 + i * 6;
    const fy = y - 18 + (i % 2) * 4;
    g.fillStyle(flowerColors[i % flowerColors.length], 1);
    g.fillCircle(fx, fy, 2);
  }
}

export function drawSignpost(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: DecorOpts = {},
): void {
  const depth = opts.depth ?? 12;
  const g = scene.add.graphics().setDepth(depth);

  g.fillStyle(0x4A2F18, 1); g.fillRect(x - 2, y - 4, 4, 32);

  g.fillStyle(0x8B5E32, 1); g.fillRoundedRect(x - 38, y - 30, 76, 22, 3);
  g.fillStyle(0x6B4424, 1); g.fillRoundedRect(x - 36, y - 28, 72, 18, 2);

  g.fillStyle(0x222B3C, 1);
  g.fillCircle(x - 32, y - 24, 1.5);
  g.fillCircle(x + 32, y - 24, 1.5);

  scene.add.text(x, y - 19, text, {
    fontFamily: 'Courier New',
    fontSize: '9px',
    fontStyle: 'bold',
    color: '#F4E0A8',
  }).setOrigin(0.5).setDepth(depth + 1);
}

export function drawFountain(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color = 0x6BB1D6,
  opts: DecorOpts = {},
): void {
  const depth = opts.depth ?? 8;
  const g = scene.add.graphics().setDepth(depth);

  g.fillStyle(0x9C8B6F, 1);
  g.fillCircle(x, y, 32);
  g.fillStyle(0x7A6B52, 1);
  g.fillCircle(x, y, 28);
  g.fillStyle(0xC0AE8C, 1);
  g.fillCircle(x, y, 23);

  g.fillStyle(color, 0.85);
  g.fillCircle(x, y, 20);

  g.fillStyle(0x9C8B6F, 1);
  g.fillCircle(x, y, 6);

  const jet = scene.add.circle(x, y - 18, 5, 0xCCE6F2, 0.85).setDepth(depth + 1);
  scene.tweens.add({
    targets: jet,
    y: y - 32,
    scaleX: 0.3,
    scaleY: 1.6,
    alpha: 0.3,
    duration: 1300,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  const ripple = scene.add.circle(x, y, 22, color, 0).setDepth(depth + 1);
  ripple.setStrokeStyle(2, 0xCCE6F2, 0.7);
  scene.tweens.add({
    targets: ripple,
    scaleX: { from: 0.7, to: 1.4 },
    scaleY: { from: 0.7, to: 1.4 },
    alpha: { from: 0.7, to: 0 },
    duration: 1800,
    repeat: -1,
  });
}

export function addCommonDecor(
  scene: Phaser.Scene,
  positions: {
    lamps?: [number, number][];
    trees?: [number, number, number?][];
    benches?: [number, number, boolean?][];
    planters?: [number, number][];
    bridges?: [number, number, number?, number?][];
    signs?: [number, number, string][];
    fountains?: [number, number, number?][];
  },
): void {
  positions.lamps?.forEach(([x, y]) => drawStreetLamp(scene, x, y));
  positions.trees?.forEach(([x, y, s]) => drawTree(scene, x, y, s ?? 1));
  positions.benches?.forEach(([x, y, v]) => drawBench(scene, x, y, v ?? false));
  positions.planters?.forEach(([x, y]) => drawPlanter(scene, x, y));
  positions.bridges?.forEach(([cx, cy, w, h]) => drawBridge(scene, cx, cy, w, h));
  positions.signs?.forEach(([x, y, t]) => drawSignpost(scene, x, y, t));
  positions.fountains?.forEach(([x, y, c]) => drawFountain(scene, x, y, c));
}
