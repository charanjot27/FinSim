import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private stars: Phaser.GameObjects.Graphics[] = [];
  private cityGraphics!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private glowTween?: Phaser.Tweens.Tween;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0E1A2A, 0x0E1A2A, 0x1F3A5F, 0x1F3A5F, 1);
    sky.fillRect(0, 0, W, H);

    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.transition = 'opacity 0.4s';
      loadingEl.style.opacity = '0';
      setTimeout(() => { loadingEl.style.display = 'none'; }, 450);
    }

    for (let i = 0; i < 120; i++) {
      const g = this.add.graphics();
      const x = Math.random() * W;
      const y = Math.random() * H * 0.55;
      const r = Math.random() < 0.15 ? 2 : 1;
      g.fillStyle(0xF4F1EA, Math.random() * 0.5 + 0.3);
      g.fillCircle(x, y, r);
      this.stars.push(g);

      this.tweens.add({
        targets: g,
        alpha: { from: Math.random() * 0.4 + 0.2, to: 1 },
        duration: 800 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000,
        ease: 'Sine.easeInOut',
      });
    }

    this.cityGraphics = this.add.graphics();
    this.drawSkyline(W, H);

    const glow = this.add.graphics();
    glow.fillGradientStyle(0xD4A84B, 0xD4A84B, 0x0E1A2A, 0x0E1A2A, 0.15, 0.15, 0, 0);
    glow.fillRect(0, H * 0.72, W, H * 0.28);

    const ground = this.add.graphics();
    ground.fillStyle(0x0E1A2A);
    ground.fillRect(0, H * 0.82, W, H * 0.18);
    ground.fillStyle(0x1A2B42);
    ground.fillRect(0, H * 0.8, W, 3);

    const road = this.add.graphics();
    road.fillStyle(0x141E2A);
    road.fillRect(0, H * 0.84, W, H * 0.12);
    road.fillStyle(0xD4A84B, 0.6);
    for (let x = 0; x < W; x += 80) {
      road.fillRect(x, H * 0.895, 40, 4);
    }

    this.drawNeonSigns(W, H);

    this.titleText = this.add.text(W / 2, H * 0.22, 'FINSIM', {
      fontFamily: 'Courier New',
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#D4A84B',
      stroke: '#0E1A2A',
      strokeThickness: 12,
    }).setOrigin(0.5).setDepth(30);

    this.add.text(W / 2 + 4, H * 0.22 + 4, 'FINSIM', {
      fontFamily: 'Courier New',
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#1F3A5F',
    }).setOrigin(0.5).setDepth(29);

    this.add.text(W / 2, H * 0.22 + 76, 'THE FINANCIAL METAVERSE', {
      fontFamily: 'Courier New',
      fontSize: '18px',
      letterSpacing: 8,
      color: '#A0B8D0',
      stroke: '#0E1A2A',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);

    this.glowTween = this.tweens.add({
      targets: this.titleText,
      alpha: { from: 0.85, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const districts = [
      { label: '🏙 Scam Slum', color: 0xC44536 },
      { label: '📈 Wall Street', color: 0x1F3A5F },
      { label: '🏛 Dalal Street', color: 0xF4A84B },
      { label: '🪙 Crypto Cove', color: 0x7B2FBE },
      { label: '📊 Quant Quarter', color: 0x1A6B5F },
      { label: '🎰 Vegas Vice', color: 0xC44536 },
    ];

    const pillY = H * 0.55;
    const spacing = W / (districts.length + 1);
    districts.forEach((d, i) => {
      const px = spacing * (i + 1);
      const bg = this.add.graphics().setDepth(28);
      bg.fillStyle(d.color, 0.85);
      bg.fillRoundedRect(px - 72, pillY - 14, 144, 28, 6);
      bg.lineStyle(1, 0xD4A84B, 0.6);
      bg.strokeRoundedRect(px - 72, pillY - 14, 144, 28, 6);

      this.add.text(px, pillY, d.label, {
        fontFamily: 'Courier New',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#F4F1EA',
      }).setOrigin(0.5).setDepth(29);

      bg.setAlpha(0);
      this.tweens.add({
        targets: bg,
        alpha: 1,
        y: '-=6',
        duration: 400,
        delay: 300 + i * 100,
        ease: 'Back.easeOut',
      });
    });

    const startY = H * 0.68;
    const startBg = this.add.graphics().setDepth(30);
    startBg.fillStyle(0xD4A84B);
    startBg.fillRoundedRect(W / 2 - 130, startY - 22, 260, 44, 8);

    const startText = this.add.text(W / 2, startY, '[ PRESS ENTER TO START ]', {
      fontFamily: 'Courier New',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#0E1A2A',
    }).setOrigin(0.5).setDepth(31);

    this.tweens.add({
      targets: [startBg, startText],
      alpha: { from: 1, to: 0.4 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(8, H - 18, 'v1.0 — GTA × Stardew × Bloomberg', {
      fontFamily: 'Courier New',
      fontSize: '10px',
      color: '#4A6B8A',
    }).setDepth(30);

    this.add.text(W - 8, H - 18, 'WASD/Arrows: Move   E/Space: Interact   P: Portfolio   Esc: Close', {
      fontFamily: 'Courier New',
      fontSize: '10px',
      color: '#4A6B8A',
    }).setOrigin(1, 1).setDepth(30);

    this.cameras.main.fadeIn(800, 14, 26, 42);

    const enter = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const space = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const anyKey = this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') this.startGame();
    });
    this.input.on('pointerdown', () => this.startGame());

    const scanlines = this.add.graphics().setDepth(100).setAlpha(0.04);
    for (let y = 0; y < H; y += 3) {
      scanlines.fillStyle(0x000000, 1);
      scanlines.fillRect(0, y, W, 1);
    }
  }

  private drawSkyline(W: number, H: number): void {
    const g = this.cityGraphics;
    const baseY = H * 0.82;

    const buildings: [number, number, number, number][] = [
      [0,    80,  120, 0x1A2B42],
      [70,   60,  180, 0x1F3A5F],
      [120,  100, 240, 0x142238],
      [210,  70,  160, 0x1A2B42],
      [270,  120, 300, 0x1F3A5F],
      [380,  80,  200, 0x142238],
      [450,  60,  140, 0x1A2B42],
      [500,  90,  260, 0x1F3A5F],
      [580,  110, 180, 0x142238],
      [680,  80,  320, 0x1F3A5F],
      [750,  100, 200, 0x1A2B42],
      [840,  130, 160, 0x142238],
      [960,  80,  280, 0x1F3A5F],
      [1030, 100, 200, 0x1A2B42],
      [1120, 80,  160, 0x142238],
      [1190, 100, 240, 0x1F3A5F],
    ];

    buildings.forEach(([bx, bw, bh, col]) => {
      const by = baseY - bh;
      g.fillStyle(col, 1);
      g.fillRect(bx, by, bw, bh);

      if (bh > 220) {
        g.fillStyle(col, 1);
        g.fillRect(bx + bw / 2 - 4, by - 40, 8, 40);
      }

      const wCols = Math.floor(bw / 16);
      const wRows = Math.floor(bh / 18);
      for (let wr = 0; wr < wRows; wr++) {
        for (let wc = 0; wc < wCols; wc++) {
          if (Math.random() > 0.45) {
            const lit = Math.random() > 0.3;
            g.fillStyle(lit ? 0xD4A84B : 0x0E1A2A, lit ? 0.9 : 1);
            g.fillRect(bx + wc * 16 + 4, by + wr * 18 + 4, 6, 8);
          }
        }
      }
    });

    const fgBuildings: [number, number, number][] = [
      [0, 120, 60], [110, 90, 50], [280, 140, 70],
      [550, 110, 55], [800, 130, 65], [1100, 150, 55],
    ];
    fgBuildings.forEach(([bx, bw, bh]) => {
      g.fillStyle(0x0A1520, 1);
      g.fillRect(bx, baseY - bh, bw, bh);
    });
  }

  private drawNeonSigns(W: number, H: number): void {
    const signs = [
      { x: W * 0.15, y: H * 0.72, text: '₹ TRADE NOW', col: '#D4A84B' },
      { x: W * 0.38, y: H * 0.70, text: '📈 BUY LOW SELL HIGH', col: '#4ADE80' },
      { x: W * 0.62, y: H * 0.73, text: '🪙 CRYPTO EXCHANGE', col: '#A855F7' },
      { x: W * 0.84, y: H * 0.71, text: '🎰 BEAT THE MARKET', col: '#F87171' },
    ];

    signs.forEach((s, i) => {
      const t = this.add.text(s.x, s.y, s.text, {
        fontFamily: 'Courier New',
        fontSize: '13px',
        fontStyle: 'bold',
        color: s.col,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(25);

      this.tweens.add({
        targets: t,
        alpha: { from: 0.6, to: 1 },
        duration: 600 + i * 200,
        yoyo: true,
        repeat: -1,
        delay: i * 300,
        ease: 'Stepped',
        easeParams: [4],
      });
    });
  }

  private startGame(): void {
    if (this.scene.isActive('MenuScene')) {
      this.cameras.main.fadeOut(600, 14, 26, 42);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('BootScene');
      });
    }
  }
}
