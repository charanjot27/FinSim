import Phaser from 'phaser';
import { portfolio } from '@/systems/PortfolioSystem';
import { soundManager } from '@/systems/SoundManager';

interface DistrictNode {
  key: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  color: number;
  icon: string;
  locked: boolean;
  unlockFlag: string;
}

export class WorldMapScene extends Phaser.Scene {
  private hudUpdater?: (district: string) => void;

  constructor() {
    super({ key: 'WorldMapScene' });
  }

  init(): void {
    this.hudUpdater = this.registry.get('hudUpdater');
  }

  create(): void {
    this.hudUpdater?.('World Map');
    const W = this.scale.width;
    const H = this.scale.height;

    this.drawGrass(W, H);
    this.drawPlazaAndPaths(W, H);

    const banner = this.add.graphics().setDepth(38);
    banner.fillStyle(0x0E1A2A, 0.78);
    banner.fillRoundedRect(W / 2 - 230, 12, 460, 56, 10);
    banner.lineStyle(1.5, 0xD4A84B, 0.55);
    banner.strokeRoundedRect(W / 2 - 230, 12, 460, 56, 10);

    this.add.text(W / 2, 30, '⬡ FINSIM — CENTRAL PLAZA ⬡', {
      fontFamily: 'Courier New',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#F4E0A8',
      stroke: '#0E1A2A',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(40);

    this.add.text(W / 2, 56, 'WALK A PATH — SELECT A DISTRICT TO ENTER', {
      fontFamily: 'Courier New',
      fontSize: '11px',
      letterSpacing: 4,
      color: '#A6C0AC',
    }).setOrigin(0.5).setDepth(40);

    const nodes: DistrictNode[] = [
      {
        key: 'ScamSlumScene',
        label: 'Scam Slum',
        sublabel: 'Learn to spot fraud',
        x: W * 0.18,
        y: H * 0.65,
        color: 0xC44536,
        icon: '🕵️',
        locked: false,
        unlockFlag: '',
      },
      {
        key: 'WallStreetScene',
        label: 'Wall Street',
        sublabel: 'US Equities & ETFs',
        x: W * 0.38,
        y: H * 0.35,
        color: 0x1F3A5F,
        icon: '📈',
        locked: false,
        unlockFlag: 'unlock.wall_street',
      },
      {
        key: 'DalalStreetScene',
        label: 'Dalal Street',
        sublabel: 'Indian Markets (NSE)',
        x: W * 0.62,
        y: H * 0.35,
        color: 0xF4A84B,
        icon: '🏛',
        locked: false,
        unlockFlag: 'unlock.dalal_street',
      },
      {
        key: 'CryptoCoveScene',
        label: 'Crypto Cove',
        sublabel: 'DeFi, AMM & Rug Pulls',
        x: W * 0.82,
        y: H * 0.55,
        color: 0x7B2FBE,
        icon: '🪙',
        locked: false,
        unlockFlag: 'unlock.crypto_cove',
      },
      {
        key: 'QuantQuarterScene',
        label: 'Quant Quarter',
        sublabel: 'Algo Trading & Backtesting',
        x: W * 0.55,
        y: H * 0.62,
        color: 0x1A6B5F,
        icon: '📊',
        locked: false,
        unlockFlag: 'unlock.quant_quarter',
      },
      {
        key: 'VegasViceScene',
        label: 'Vegas Vice',
        sublabel: 'Probability & Expected Value',
        x: W * 0.28,
        y: H * 0.55,
        color: 0xE8375A,
        icon: '🎰',
        locked: false,
        unlockFlag: 'unlock.vegas_vice',
      },
    ];

    nodes.forEach(n => { if (n.unlockFlag) portfolio.setFlag(n.unlockFlag); });

    this.drawPathsBetweenNodes(nodes);

    this.drawDecorations(W, H, nodes);

    nodes.forEach((node, idx) => {
      this.createDistrictNode(node, idx);
    });

    const cash = portfolio.getCash();
    const total = portfolio.getTotalValue();
    const pnl = portfolio.getTotalPnl();
    const pnlSign = pnl >= 0 ? '+' : '';
    const pnlColor = pnl >= 0 ? '#4ADE80' : '#F87171';

    const statBg = this.add.graphics().setDepth(39);
    statBg.fillStyle(0x0E1A2A, 0.9);
    statBg.fillRoundedRect(W / 2 - 260, H - 52, 520, 40, 6);
    statBg.lineStyle(1, 0xD4A84B, 0.4);
    statBg.strokeRoundedRect(W / 2 - 260, H - 52, 520, 40, 6);

    this.add.text(W / 2 - 230, H - 32, `Cash: ₹${Math.round(cash).toLocaleString('en-IN')}`, {
      fontFamily: 'Courier New', fontSize: '12px', color: '#F4F1EA',
    }).setOrigin(0, 0.5).setDepth(40);

    this.add.text(W / 2, H - 32, `Portfolio: ₹${Math.round(total).toLocaleString('en-IN')}`, {
      fontFamily: 'Courier New', fontSize: '12px', color: '#F4F1EA',
    }).setOrigin(0.5).setDepth(40);

    this.add.text(W / 2 + 130, H - 32, `P&L: ${pnlSign}₹${Math.round(pnl).toLocaleString('en-IN')}`, {
      fontFamily: 'Courier New', fontSize: '12px', color: pnlColor,
    }).setOrigin(0, 0.5).setDepth(40);

    this.input.keyboard!.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(400, 46, 110, 58);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('ScamSlumScene');
      });
    });

    this.cameras.main.fadeIn(400, 46, 110, 58);

    this.time.delayedCall(450, () => soundManager.play('stationBell'));
    this.time.delayedCall(1200, () => soundManager.play('stationAnnounce'));
  }

  private createDistrictNode(node: DistrictNode, idx: number): void {
    const R = 56;
    const g = this.add.graphics().setDepth(20);

    if (node.locked) {

      g.fillStyle(0x0A1520, 0.95);
      g.fillCircle(node.x, node.y, R);
      g.lineStyle(2, 0x2A3F5F, 1);
      g.strokeCircle(node.x, node.y, R);

      this.add.text(node.x, node.y - 10, '🔒', {
        fontSize: '24px',
      }).setOrigin(0.5).setDepth(21);

      this.add.text(node.x, node.y + 16, node.label, {
        fontFamily: 'Courier New',
        fontSize: '11px',
        color: '#4A6B8A',
      }).setOrigin(0.5).setDepth(21);

      this.add.text(node.x, node.y + R + 14, 'LOCKED', {
        fontFamily: 'Courier New',
        fontSize: '10px',
        color: '#C44536',
        letterSpacing: 3,
      }).setOrigin(0.5).setDepth(21);

      this.add.text(node.x, node.y + R + 26, `Visit Scam Slum first`, {
        fontFamily: 'Courier New',
        fontSize: '9px',
        color: '#3A5570',
      }).setOrigin(0.5).setDepth(21);

    } else {

      g.fillStyle(node.color, 0.2);
      g.fillCircle(node.x, node.y, R);
      g.fillStyle(node.color, 0.15);
      g.fillCircle(node.x, node.y, R - 8);

      const ring = this.add.graphics().setDepth(19);
      ring.lineStyle(2, node.color, 0.7);
      ring.strokeCircle(node.x, node.y, R);

      this.tweens.add({
        targets: ring,
        alpha: { from: 0.7, to: 0.15 },
        scaleX: { from: 1, to: 1.3 },
        scaleY: { from: 1, to: 1.3 },
        duration: 1500,
        repeat: -1,
        delay: idx * 250,
        ease: 'Sine.easeOut',
      });

      this.add.text(node.x, node.y - 12, node.icon, {
        fontSize: '28px',
      }).setOrigin(0.5).setDepth(22);

      this.add.text(node.x, node.y + 18, node.label, {
        fontFamily: 'Courier New',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#F4F1EA',
        stroke: '#0E1A2A',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(22);

      this.add.text(node.x, node.y + R + 14, node.sublabel, {
        fontFamily: 'Courier New',
        fontSize: '10px',
        color: '#A0B8D0',
      }).setOrigin(0.5).setDepth(22);

      const hitZone = this.add.zone(node.x, node.y, R * 2 + 20, R * 2 + 20)
        .setDepth(25)
        .setInteractive({ cursor: 'pointer' });

      hitZone.on('pointerover', () => {
        g.clear();
        g.fillStyle(node.color, 0.4);
        g.fillCircle(node.x, node.y, R);
        g.lineStyle(3, 0xD4A84B, 1);
        g.strokeCircle(node.x, node.y, R);
      });

      hitZone.on('pointerout', () => {
        g.clear();
        g.fillStyle(node.color, 0.2);
        g.fillCircle(node.x, node.y, R);
        g.fillStyle(node.color, 0.15);
        g.fillCircle(node.x, node.y, R - 8);
        g.lineStyle(2, node.color, 0.5);
        g.strokeCircle(node.x, node.y, R);
      });

      hitZone.on('pointerdown', () => {
        soundManager.play('click');
        soundManager.play('stationBell');
        this.cameras.main.fadeOut(420, 5, 8, 15);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('TrainTransitionScene', {
            destination: node.key,
            label: node.label,
            color: node.color,
          });
        });
      });

    }
  }

  private drawGrass(W: number, H: number): void {
    const g = this.add.graphics().setDepth(0);

    g.fillGradientStyle(0x4A8C3A, 0x4A8C3A, 0x2E6B30, 0x356E33, 1);
    g.fillRect(0, 0, W, H);

    const highlight = this.add.graphics().setDepth(0);
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(80, W - 80);
      const y = Phaser.Math.Between(80, H - 100);
      const r = Phaser.Math.Between(80, 160);
      highlight.fillStyle(0x8DCB6A, 0.06);
      highlight.fillCircle(x, y, r);
    }

    const noise = this.add.graphics().setDepth(0);
    const palette = [0x6FB048, 0x568F34, 0x3E7A28, 0x7BC55A];
    const SPECKS = 2200;
    for (let i = 0; i < SPECKS; i++) {
      noise.fillStyle(palette[i % palette.length], 0.35 + (i % 3) * 0.05);
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      noise.fillRect(x, y, 1, Phaser.Math.Between(1, 2));
    }

    const tufts = this.add.graphics().setDepth(0);
    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(20, W - 20);
      const y = Phaser.Math.Between(80, H - 80);
      tufts.fillStyle(0x5BA63E, 0.7);
      tufts.fillRect(x,     y,     1, 3);
      tufts.fillRect(x + 2, y - 1, 1, 4);
      tufts.fillRect(x + 4, y,     1, 3);
      tufts.fillStyle(0x3E7A28, 0.55);
      tufts.fillRect(x + 1, y + 3, 1, 1);
    }
  }

  private drawPlazaAndPaths(W: number, H: number): void {
    const cx = W / 2;
    const cy = H / 2;
    const plaza = this.add.graphics().setDepth(1);

    const R = Math.min(W, H) * 0.22;
    const oct: number[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 - Math.PI / 8;
      oct.push(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    }
    plaza.fillStyle(0xB8A887, 1);
    plaza.beginPath();
    plaza.moveTo(oct[0], oct[1]);
    for (let i = 2; i < oct.length; i += 2) plaza.lineTo(oct[i], oct[i + 1]);
    plaza.closePath();
    plaza.fillPath();

    plaza.lineStyle(1, 0x9A8868, 0.7);
    for (let r = R - 18; r > 30; r -= 22) plaza.strokeCircle(cx, cy, r);

    plaza.lineStyle(1, 0x9A8868, 0.4);
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 * i) / 16;
      plaza.lineBetween(
        cx + Math.cos(a) * 30,
        cy + Math.sin(a) * 30,
        cx + Math.cos(a) * (R - 8),
        cy + Math.sin(a) * (R - 8),
      );
    }

    plaza.lineStyle(3, 0x8C7A5C, 1);
    plaza.beginPath();
    plaza.moveTo(oct[0], oct[1]);
    for (let i = 2; i < oct.length; i += 2) plaza.lineTo(oct[i], oct[i + 1]);
    plaza.closePath();
    plaza.strokePath();

    const fc = this.add.graphics().setDepth(2);
    fc.fillStyle(0x8C7A5C, 1);
    fc.fillCircle(cx, cy, 26);
    fc.fillStyle(0x4FA3D8, 1);
    fc.fillCircle(cx, cy, 22);
    fc.fillStyle(0x88C8E6, 0.55);
    fc.fillCircle(cx, cy, 18);
    fc.fillStyle(0xB8A887, 1);
    fc.fillCircle(cx, cy, 8);
    fc.fillStyle(0xE8DFC8, 1);
    fc.fillCircle(cx, cy, 4);

    const jet = this.add.graphics().setDepth(3);
    jet.fillStyle(0xE8F4FA, 0.85);
    jet.fillRect(cx - 1, cy - 14, 2, 14);
    this.tweens.add({
      targets: jet,
      alpha: { from: 0.45, to: 0.9 },
      scaleY: { from: 0.7, to: 1.15 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const ripple = this.add.graphics().setDepth(2);
    ripple.lineStyle(1, 0xE8F4FA, 0.55);
    ripple.strokeCircle(cx, cy, 16);
    this.tweens.add({
      targets: ripple,
      alpha: { from: 0.55, to: 0 },
      scaleX: { from: 1, to: 1.6 },
      scaleY: { from: 1, to: 1.6 },
      duration: 1800,
      repeat: -1,
      ease: 'Quad.easeOut',
    });
  }

  private drawPathsBetweenNodes(nodes: DistrictNode[]): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const path = this.add.graphics().setDepth(1);

    const drawCobblestone = (x1: number, y1: number, x2: number, y2: number): void => {

      path.lineStyle(22, 0x6E5F45, 1);
      path.lineBetween(x1, y1, x2, y2);

      path.lineStyle(18, 0xC9B991, 1);
      path.lineBetween(x1, y1, x2, y2);

      path.lineStyle(1, 0x9A8868, 0.55);
      path.lineBetween(x1, y1, x2, y2);

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;
      const ux = dx / len;
      const uy = dy / len;

      const px = -uy;
      const py = ux;
      const W2 = 9;
      path.lineStyle(1, 0x9A8868, 0.5);
      for (let s = 16; s < len - 4; s += 16) {
        const mx = x1 + ux * s;
        const my = y1 + uy * s;
        path.lineBetween(mx - px * W2, my - py * W2, mx + px * W2, my + py * W2);
      }
    };

    nodes.forEach(n => drawCobblestone(n.x, n.y, cx, cy));
  }

  private drawDecorations(W: number, H: number, nodes: DistrictNode[]): void {
    const cx = W / 2;
    const cy = H / 2;

    const treeRing: Array<[number, number, number]> = [];
    const margin = 36;
    const COLS = 11;
    for (let i = 0; i <= COLS; i++) {
      const x = margin + (i * (W - margin * 2)) / COLS + (i % 2 === 0 ? 0 : 8);
      treeRing.push([x, margin + 6, 14 + (i % 3) * 2]);
      treeRing.push([x, H - margin - 36, 14 + (i % 3) * 2]);
    }
    const ROWS = 5;
    for (let i = 1; i < ROWS; i++) {
      const y = margin + (i * (H - margin * 2 - 60)) / ROWS;
      treeRing.push([margin + 4, y, 14]);
      treeRing.push([W - margin - 4, y, 14]);
    }
    treeRing.forEach(([x, y, r]) => this.drawTree(x, y, r));

    nodes.forEach((n, i) => {
      const t = 0.55;
      const lx = cx + (n.x - cx) * t;
      const ly = cy + (n.y - cy) * t;

      const dx = n.x - cx;
      const dy = n.y - cy;
      const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len;
      const py = dx / len;
      const side = i % 2 === 0 ? 1 : -1;
      this.drawLampPost(lx + px * 22 * side, ly + py * 22 * side);
    });

    const cardinals = [
      [cx - 130, cy - 130], [cx + 130, cy - 130],
      [cx - 130, cy + 130], [cx + 130, cy + 130],
    ];
    cardinals.forEach(([x, y]) => this.drawLampPost(x, y));

    this.drawBench(cx - 110, cy + 10, false);
    this.drawBench(cx + 110, cy + 10, false);
    this.drawBench(cx - 10, cy - 110, true);
    this.drawBench(cx - 10, cy + 110, true);

    [
      [margin + 24,     margin + 48],
      [W - margin - 24, margin + 48],
      [margin + 24,     H - margin - 80],
      [W - margin - 24, H - margin - 80],
      [cx - 60, cy - 60], [cx + 60, cy - 60],
      [cx - 60, cy + 60], [cx + 60, cy + 60],
    ].forEach(([x, y]) => this.drawPlanter(x, y));

    this.drawParkSign(W * 0.5, H - 90);
  }

  private drawTree(x: number, y: number, r: number): void {
    const g = this.add.graphics().setDepth(2);

    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(x + 2, y + r + 1, r * 1.7, r * 0.6);

    g.fillStyle(0x4A2A10, 1);
    g.fillRect(x - 2, y, 4, 6);

    g.fillStyle(0x2E6B30, 1);
    g.fillCircle(x - r * 0.4, y - 2, r * 0.85);
    g.fillCircle(x + r * 0.4, y - 2, r * 0.85);
    g.fillCircle(x,           y - r * 0.6, r * 0.95);

    g.fillStyle(0x4FA050, 0.85);
    g.fillCircle(x - r * 0.3, y - r * 0.3, r * 0.5);
    g.fillStyle(0x6FC560, 0.55);
    g.fillCircle(x - r * 0.45, y - r * 0.5, r * 0.25);
  }

  private drawLampPost(x: number, y: number): void {
    const g = this.add.graphics().setDepth(5);

    g.fillStyle(0x1A1A1A, 1);
    g.fillRect(x - 4, y + 14, 8, 4);
    g.fillStyle(0x2A2A2A, 1);
    g.fillRect(x - 3, y + 10, 6, 4);

    g.fillStyle(0x232323, 1);
    g.fillRect(x - 1, y - 16, 2, 26);

    g.fillStyle(0x232323, 1);
    g.fillRect(x - 8, y - 16, 16, 2);

    g.fillStyle(0x3A3A3A, 1);
    g.fillRect(x - 10, y - 18, 5, 4);
    g.fillRect(x + 5,  y - 18, 5, 4);

    g.fillStyle(0xFFE8A0, 1);
    g.fillCircle(x - 7.5, y - 14, 2.5);
    g.fillCircle(x + 7.5, y - 14, 2.5);

    const halo = this.add.graphics().setDepth(4).setAlpha(0.45);
    halo.fillStyle(0xFFE3A0, 0.35);
    halo.fillCircle(x - 7.5, y - 14, 14);
    halo.fillCircle(x + 7.5, y - 14, 14);

    this.tweens.add({
      targets: halo,
      alpha: { from: 0.35, to: 0.55 },
      duration: 1800 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawBench(x: number, y: number, vertical: boolean): void {
    const g = this.add.graphics().setDepth(4);

    g.fillStyle(0x000000, 0.25);
    if (vertical) g.fillEllipse(x + 1, y + 13, 12, 26);
    else          g.fillEllipse(x + 1, y + 6,  30, 8);

    if (vertical) {

      g.fillStyle(0x6E4A2A, 1);
      g.fillRect(x - 3, y - 12, 6, 24);
      g.fillStyle(0x8A5E36, 1);
      g.fillRect(x - 2, y - 12, 4, 24);
      g.fillStyle(0x3A2418, 1);
      g.fillRect(x - 4, y - 10, 1, 6);
      g.fillRect(x + 3, y - 10, 1, 6);
      g.fillRect(x - 4, y + 4,  1, 6);
      g.fillRect(x + 3, y + 4,  1, 6);
    } else {

      g.fillStyle(0x3A2418, 1);
      g.fillRect(x - 14, y - 6, 28, 3);
      g.fillStyle(0x6E4A2A, 1);
      g.fillRect(x - 14, y - 2, 28, 5);
      g.fillStyle(0x8A5E36, 1);
      g.fillRect(x - 14, y - 2, 28, 1);
      g.fillStyle(0x3A2418, 1);
      g.fillRect(x - 13, y + 3, 2, 5);
      g.fillRect(x + 11, y + 3, 2, 5);
    }
  }

  private drawPlanter(x: number, y: number): void {
    const g = this.add.graphics().setDepth(3);

    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(x + 1, y + 8, 18, 6);

    g.fillStyle(0x6A4A38, 1);
    g.fillRect(x - 8, y - 2, 16, 9);
    g.fillStyle(0x8A6A50, 1);
    g.fillRect(x - 8, y - 2, 16, 2);
    g.lineStyle(1, 0x4A2E1E, 1);
    g.strokeRect(x - 8, y - 2, 16, 9);

    g.fillStyle(0x2E1E14, 1);
    g.fillRect(x - 7, y - 1, 14, 2);

    g.fillStyle(0x2E6B30, 1);
    g.fillCircle(x - 4, y - 4, 4);
    g.fillCircle(x + 4, y - 4, 4);
    g.fillCircle(x,     y - 6, 5);
    g.fillStyle(0x6FC560, 0.8);
    g.fillCircle(x - 2, y - 6, 2);

    const flowers = [0xE94B6E, 0xF4C542, 0xB85ADB, 0xEE7A3A];
    const c = flowers[Math.floor(Math.random() * flowers.length)];
    g.fillStyle(c, 1);
    g.fillCircle(x - 3, y - 5, 1.4);
    g.fillCircle(x + 3, y - 5, 1.4);
    g.fillCircle(x,     y - 8, 1.6);
  }

  private drawParkSign(x: number, y: number): void {
    const g = this.add.graphics().setDepth(6);

    g.fillStyle(0x3A2418, 1);
    g.fillRect(x - 26, y - 4, 3, 22);
    g.fillRect(x + 23, y - 4, 3, 22);

    g.fillStyle(0x8A5E36, 1);
    g.fillRect(x - 30, y - 16, 60, 14);
    g.fillStyle(0xA67644, 1);
    g.fillRect(x - 30, y - 16, 60, 2);
    g.lineStyle(1.5, 0x3A2418, 1);
    g.strokeRect(x - 30, y - 16, 60, 14);

    this.add.text(x, y - 9, 'CENTRAL PLAZA', {
      fontFamily: 'Courier New',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#F4E0A8',
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(7);
  }
}
