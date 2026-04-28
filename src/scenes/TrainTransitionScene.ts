import Phaser from 'phaser';
import { soundManager } from '@/systems/SoundManager';

interface TrainData {
  destination: string;
  label?: string;
  color?: number;
}

export class TrainTransitionScene extends Phaser.Scene {
  private destination = 'WorldMapScene';
  private label = 'Destination';
  private accent = 0xF4C542;

  constructor() {
    super({ key: 'TrainTransitionScene' });
  }

  init(data: TrainData): void {
    this.destination = data.destination ?? 'WorldMapScene';
    this.label = data.label ?? 'Destination';
    this.accent = data.color ?? 0xF4C542;
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x05080F, 0x05080F, 0x0E1A2A, 0x102236, 1, 1, 1, 1);
    sky.fillRect(0, 0, W, H);

    const skyline = this.add.graphics();
    skyline.fillStyle(0x0A1628, 1);
    let x = 0;
    while (x < W) {
      const w = 30 + Math.random() * 60;
      const h = 50 + Math.random() * 90;
      skyline.fillRect(x, H * 0.55 - h, w, h);

      skyline.fillStyle(0xF4C542, 0.5);
      for (let r = 0; r < Math.floor(h / 18); r++) {
        for (let c = 0; c < Math.floor(w / 14); c++) {
          if (Math.random() > 0.55) {
            skyline.fillRect(x + 4 + c * 14, H * 0.55 - h + 6 + r * 18, 4, 6);
          }
        }
      }
      skyline.fillStyle(0x0A1628, 1);
      x += w + 2;
    }

    const stars = this.add.graphics();
    stars.fillStyle(0xFFFFFF, 1);
    for (let i = 0; i < 80; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H * 0.5;
      const r = Math.random() < 0.85 ? 1 : 2;
      stars.fillCircle(sx, sy, r);
    }
    stars.setAlpha(0.7);
    this.tweens.add({ targets: stars, alpha: { from: 0.4, to: 0.9 }, duration: 1800, yoyo: true, repeat: -1 });

    const groundY = H * 0.72;
    const ground = this.add.graphics();
    ground.fillStyle(0x1B2638, 1); ground.fillRect(0, groundY, W, H - groundY);

    ground.fillStyle(0x40332A, 1);
    for (let i = 0; i < W; i += 32) {
      ground.fillRect(i, groundY + 22, 22, 8);
    }

    ground.fillStyle(0x8C8C94, 1);
    ground.fillRect(0, groundY + 18, W, 3);
    ground.fillRect(0, groundY + 32, W, 3);

    ground.fillStyle(0x2E3A50, 1);
    ground.fillRect(0, groundY, W, 2);

    const lampLayer = this.add.graphics();
    for (let lx = 60; lx < W; lx += 180) {
      lampLayer.fillStyle(0x222B3C, 1);
      lampLayer.fillRect(lx, groundY - 70, 3, 70);
      lampLayer.fillStyle(0xFFD580, 0.85);
      lampLayer.fillCircle(lx + 1, groundY - 75, 5);
      lampLayer.fillStyle(0xFFD580, 0.18);
      lampLayer.fillCircle(lx + 1, groundY - 75, 14);
    }

    const banner = this.add.graphics().setDepth(50);
    banner.fillStyle(0x0E1A2A, 0.92);
    banner.fillRoundedRect(W / 2 - 220, 36, 440, 70, 12);
    banner.lineStyle(2, this.accent, 0.85);
    banner.strokeRoundedRect(W / 2 - 220, 36, 440, 70, 12);

    this.add.text(W / 2, 60, '🚂 NOW DEPARTING', {
      fontFamily: 'Courier New',
      fontSize: '13px',
      letterSpacing: 4,
      color: '#A0B8D0',
    }).setOrigin(0.5).setDepth(51);

    const destLabel = this.add.text(W / 2, 88, `→  ${this.label.toUpperCase()}`, {
      fontFamily: 'Courier New',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#F4E0A8',
      stroke: '#0E1A2A',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(51);

    this.tweens.add({
      targets: destLabel,
      alpha: { from: 1, to: 0.65 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const train = this.add.container(0, 0).setDepth(40);
    const trainBaseY = groundY - 8;
    const startX = -560;

    const loco = this.add.graphics();

    loco.fillStyle(0x000000, 0.35);
    loco.fillEllipse(120, trainBaseY + 2, 240, 14);

    loco.fillStyle(0x2A3F5F, 1);
    loco.fillRoundedRect(50, trainBaseY - 60, 180, 50, 10);
    loco.fillStyle(0x3A557A, 1);
    loco.fillRoundedRect(50, trainBaseY - 60, 180, 18, { tl: 10, tr: 10, bl: 0, br: 0 });

    loco.fillStyle(0x1A2536, 1);
    loco.fillRect(80, trainBaseY - 90, 16, 35);
    loco.fillStyle(0x0E1A2A, 1);
    loco.fillRect(75, trainBaseY - 92, 26, 6);

    loco.fillStyle(0x4A6B8A, 1);
    loco.fillRoundedRect(0, trainBaseY - 80, 60, 70, { tl: 8, tr: 0, bl: 0, br: 0 });
    loco.fillStyle(0xF4F1EA, 0.8);
    loco.fillRect(8, trainBaseY - 70, 44, 22);

    loco.fillStyle(0x2A3F5F, 1);
    loco.fillRect(28, trainBaseY - 70, 4, 22);

    loco.fillStyle(0x1A2536, 1);
    loco.beginPath();
    loco.moveTo(230, trainBaseY - 10);
    loco.lineTo(260, trainBaseY - 10);
    loco.lineTo(245, trainBaseY + 6);
    loco.closePath();
    loco.fillPath();

    loco.fillStyle(0xFFEFA0, 1);
    loco.fillCircle(225, trainBaseY - 35, 7);
    loco.fillStyle(0xFFFFFF, 0.8);
    loco.fillCircle(225, trainBaseY - 35, 3);

    loco.fillStyle(0xFFEFA0, 0.18);
    loco.beginPath();
    loco.moveTo(232, trainBaseY - 35);
    loco.lineTo(W + 100, trainBaseY - 80);
    loco.lineTo(W + 100, trainBaseY - 5);
    loco.closePath();
    loco.fillPath();

    const wheelStyle = (g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number) => {
      g.fillStyle(0x0E1A2A, 1); g.fillCircle(cx, cy, r);
      g.fillStyle(0x4A6B8A, 1); g.fillCircle(cx, cy, r - 3);
      g.fillStyle(0x0E1A2A, 1); g.fillCircle(cx, cy, 3);

      g.lineStyle(2, 0x0E1A2A, 1);
      g.lineBetween(cx, cy - r + 3, cx, cy + r - 3);
      g.lineBetween(cx - r + 3, cy, cx + r - 3, cy);
    };
    wheelStyle(loco, 70, trainBaseY - 4, 14);
    wheelStyle(loco, 130, trainBaseY - 4, 18);
    wheelStyle(loco, 195, trainBaseY - 4, 18);
    train.add(loco);

    const drawCarriage = (offsetX: number, fillColor: number) => {
      const c = this.add.graphics();
      c.fillStyle(0x000000, 0.32);
      c.fillEllipse(offsetX + 90, trainBaseY + 2, 200, 12);
      c.fillStyle(fillColor, 1);
      c.fillRoundedRect(offsetX, trainBaseY - 70, 180, 60, 6);
      c.fillStyle(0x0E1A2A, 1);
      c.fillRect(offsetX, trainBaseY - 70, 180, 4);
      c.fillRect(offsetX, trainBaseY - 14, 180, 4);

      c.fillStyle(0xFFEFA0, 0.85);
      for (let i = 0; i < 4; i++) {
        c.fillRoundedRect(offsetX + 12 + i * 42, trainBaseY - 60, 30, 32, 4);
      }

      c.fillStyle(0x0E1A2A, 0.9);
      c.fillRect(offsetX + 168, trainBaseY - 60, 6, 50);

      wheelStyle(c, offsetX + 30, trainBaseY - 4, 14);
      wheelStyle(c, offsetX + 150, trainBaseY - 4, 14);

      c.lineStyle(3, 0x0E1A2A, 1);
      c.lineBetween(offsetX - 6, trainBaseY - 16, offsetX, trainBaseY - 16);
      train.add(c);
      return c;
    };
    drawCarriage(245, 0xC44536);
    drawCarriage(440, 0x1A6B5F);

    train.x = startX;

    const smokeTimer = this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        const tx = train.x + 88;
        const ty = trainBaseY - 95;
        const puff = this.add.circle(tx, ty, 6 + Math.random() * 4, 0xCFCFCF, 0.7).setDepth(45);
        this.tweens.add({
          targets: puff,
          x: tx + (Math.random() - 0.5) * 30,
          y: ty - 90 - Math.random() * 60,
          scale: 3 + Math.random() * 2,
          alpha: 0,
          duration: 1400 + Math.random() * 600,
          ease: 'Sine.easeOut',
          onComplete: () => puff.destroy(),
        });
      },
    });

    soundManager.play('stationBell');
    this.time.delayedCall(450, () => soundManager.play('trainHorn'));

    const chugTimer = this.time.addEvent({
      delay: 220,
      loop: true,
      callback: () => soundManager.play('trainChug'),
    });

    this.time.delayedCall(1700, () => soundManager.play('trainBrake'));
    this.time.delayedCall(2200, () => soundManager.play('trainHorn'));

    const targetX = W + 400;
    this.tweens.add({
      targets: train,
      x: targetX,
      duration: 2400,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        chugTimer.remove();
        smokeTimer.remove();
      },
    });

    this.time.delayedCall(900, () => this.cameras.main.shake(900, 0.0035));

    this.cameras.main.fadeIn(300, 5, 8, 15);
    this.time.delayedCall(2500, () => {
      this.cameras.main.fadeOut(420, 14, 26, 42);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        chugTimer.remove();
        smokeTimer.remove();
        this.scene.start(this.destination);
      });
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      chugTimer.remove();
      smokeTimer.remove();
      this.scene.start(this.destination);
    });

    this.input.once('pointerdown', () => {
      chugTimer.remove();
      smokeTimer.remove();
      this.cameras.main.fadeOut(200, 14, 26, 42);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.destination));
    });
  }
}
