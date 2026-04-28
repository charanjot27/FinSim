import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { NPC } from '@/entities/NPC';
import { Building, type BuildingConfig } from '@/entities/Building';
import { TILE_SIZE } from '@/config/constants';
import { dialogueSystem } from '@/systems/DialogueSystem';
import { allDialogues } from '@/data/dialogues';
import { behaviorTracker } from '@/systems/BehaviorTracker';
import { marketEngine } from '@/systems/MarketEngine';
import { sharpeRatio } from '@/lib/math';
import { addCommonDecor } from '@/scenes/utils/DistrictDecor';

interface NpcSpawn {
  id: string;
  archetype: import('@/entities/NPC').NpcArchetype;
  dialogueId: string;
  speakerName: string;
}

export class QuantQuarterScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private buildings: Building[] = [];
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private nearbyEntity: NPC | Building | null = null;
  private hudUpdater?: (district: string) => void;
  private onTerminalOpen?: (market: 'wall-street' | 'dalal-street') => void;
  private onEchoOpen?: () => void;
  private chartGraphics!: Phaser.GameObjects.Graphics;
  private liveChartTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'QuantQuarterScene' });
  }

  init(): void {
    this.hudUpdater = this.registry.get('hudUpdater');
    this.onTerminalOpen = this.registry.get('onTerminalOpen');
    this.onEchoOpen = this.registry.get('onEchoOpen');
  }

  create(): void {
    this.npcs = [];
    this.buildings = [];
    this.hudUpdater?.('Quant Quarter');
    behaviorTracker.log('district_enter', { district: 'Quant Quarter' });

    const WORLD_W = 52 * TILE_SIZE;
    const WORLD_H = 42 * TILE_SIZE;
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.drawQuantWorld(WORLD_W, WORLD_H);
    this.drawDistrictLabel('📊 Quant Quarter', WORLD_W / 2, 20);

    const T = TILE_SIZE;
    addCommonDecor(this, {
      lamps: [
        [4 * T, 6 * T], [12 * T, 6 * T], [20 * T, 6 * T], [32 * T, 6 * T], [40 * T, 6 * T], [48 * T, 6 * T],
        [4 * T, 36 * T], [12 * T, 36 * T], [20 * T, 36 * T], [32 * T, 36 * T], [40 * T, 36 * T], [48 * T, 36 * T],
      ],
      trees: [
        [3 * T, 18 * T, 1.0], [3 * T, 28 * T, 1.0], [49 * T, 18 * T, 1.1], [49 * T, 28 * T, 1.0],
        [10 * T, 4 * T, 0.9], [42 * T, 4 * T, 1.0], [10 * T, 40 * T, 0.9], [42 * T, 40 * T, 1.1],
      ],
      benches: [
        [16 * T, 22 * T, false], [36 * T, 22 * T, false],
      ],
      planters: [
        [8 * T, 14 * T], [44 * T, 14 * T], [8 * T, 30 * T], [44 * T, 30 * T],
      ],
      bridges: [
        [26 * T, 32 * T, 200, 36],
      ],
      fountains: [
        [10 * T, 28 * T, 0x1A6B5F],
      ],
      signs: [
        [6 * T, 14 * T, 'LAB →'],
        [46 * T, 14 * T, '← BACKTEST'],
      ],
    });

    this.chartGraphics = this.add.graphics().setDepth(5);
    this.drawLiveChart(WORLD_W);

    this.liveChartTimer = this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => this.drawLiveChart(WORLD_W),
    });

    this.addBuilding(24 * TILE_SIZE, 12 * TILE_SIZE, {
      id: 'quant_terminal',
      type: 'brokerage',
      width: 180,
      height: 140,
      label: '🖥 Algo Terminal — Execute Strategy',
      onEnter: () => {
        if (this.onTerminalOpen) this.onTerminalOpen('wall-street');
      },
    });

    this.addBuilding(8 * TILE_SIZE, 8 * TILE_SIZE, {
      id: 'backtest_lab',
      type: 'bank',
      width: 130,
      height: 110,
      label: '🧪 Backtest Lab',
      onEnter: () => {
        dialogueSystem.start(allDialogues.backtest_lesson, () => {});
      },
    });

    this.addBuilding(42 * TILE_SIZE, 8 * TILE_SIZE, {
      id: 'risk_engine',
      type: 'bank',
      width: 130,
      height: 110,
      label: '⚖ Risk Engine',
      onEnter: () => {
        dialogueSystem.start(allDialogues.risk_management, () => {});
      },
    });

    this.addBuilding(44 * TILE_SIZE, 28 * TILE_SIZE, {
      id: 'time_machine_qq',
      type: 'time_machine',
      width: 110,
      height: 110,
      label: '🕰 Time Machine',
      onEnter: () => {
        if (this.onEchoOpen) this.onEchoOpen();
      },
    });

    this.addBuilding(4 * TILE_SIZE, 32 * TILE_SIZE, {
      id: 'train_qq',
      type: 'train_station',
      width: 140,
      height: 120,
      label: '🚂 Exit Quant Quarter',
      onEnter: () => this.fadeToScene('WorldMapScene'),
    });

    this.addNPC(26 * TILE_SIZE, 20 * TILE_SIZE, {
      id: 'quant_mentor',
      archetype: 'mentor',
      dialogueId: 'quant_mentor',
      speakerName: 'Dr. Simons',
    });

    this.addNPC(14 * TILE_SIZE, 26 * TILE_SIZE, {
      id: 'algo_trader',
      archetype: 'neighbor',
      dialogueId: 'algo_explanation',
      speakerName: 'AlgoBot',
    });

    this.addNPC(36 * TILE_SIZE, 26 * TILE_SIZE, {
      id: 'quant_intern',
      archetype: 'neighbor',
      dialogueId: 'quant_intern',
      speakerName: 'Priya the Intern',
    });

    this.drawStatBoard(WORLD_W);

    this.player = new Player(this, 6 * TILE_SIZE, 35 * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);

    this.buildings.forEach(b => this.physics.add.collider(this.player, b));
    this.npcs.forEach(n => this.physics.add.collider(this.player, n));

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private drawQuantWorld(w: number, h: number): void {
    const g = this.add.graphics();

    g.fillStyle(0x0A1215);
    g.fillRect(0, 0, w, h);

    const HEX_SIZE = 30;
    for (let row = 0; row < h / (HEX_SIZE * 1.73); row++) {
      for (let col = 0; col < w / (HEX_SIZE * 2); col++) {
        const hx = col * HEX_SIZE * 2 + (row % 2 === 0 ? 0 : HEX_SIZE);
        const hy = row * HEX_SIZE * 0.87;
        g.lineStyle(0.5, 0x1A6B5F, 0.25);
        this.drawHex(g, hx, hy, HEX_SIZE - 2);
      }
    }

    g.lineStyle(2, 0x1A6B5F, 0.5);
    g.lineBetween(24 * TILE_SIZE, TILE_SIZE * 3, 24 * TILE_SIZE, h - TILE_SIZE * 3);
    g.lineBetween(TILE_SIZE * 2, 22 * TILE_SIZE, w - TILE_SIZE * 2, 22 * TILE_SIZE);

    for (let i = 0; i < 50; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      g.fillStyle(0x4ADE80, Math.random() * 0.3 + 0.1);
      g.fillCircle(px, py, 1);
    }

    g.setDepth(-1);
  }

  private drawHex(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number): void {
    const points: number[][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
    }
    g.beginPath();
    g.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < 6; i++) g.lineTo(points[i][0], points[i][1]);
    g.closePath();
    g.strokePath();
  }

  private drawLiveChart(w: number): void {
    const g = this.chartGraphics;
    g.clear();

    const stockMap = marketEngine.getAllStocks();
    const stocksArr = Array.from(stockMap.values());
    const stock = stocksArr.find((s) => s.symbol === 'AAPL') || stocksArr[0];
    if (!stock) return;

    const candles = stock.candles.slice(-30);
    if (candles.length < 2) return;

    const CX = w / 2 - 300;
    const CY = 2 * TILE_SIZE;
    const CW = 600;
    const CH = 80;

    g.fillStyle(0x0A1215, 0.85);
    g.fillRoundedRect(CX - 5, CY - 5, CW + 10, CH + 20, 4);
    g.lineStyle(1, 0x1A6B5F, 0.6);
    g.strokeRoundedRect(CX - 5, CY - 5, CW + 10, CH + 20, 4);

    this.add.text(CX + CW / 2, CY - 2, `${stock.symbol} ${stock.price.toFixed(2)} — Live`, {
      fontFamily: 'Courier New',
      fontSize: '10px',
      color: '#4ADE80',
    }).setOrigin(0.5, 1).setDepth(6);

    const prices = candles.map((c: { close: number }) => c.close);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const barW = CW / candles.length;

    candles.forEach((candle: { open: number; close: number; high: number; low: number }, i: number) => {
      const x = CX + i * barW;
      const bodyBot = CY + CH - ((Math.min(candle.open, candle.close) - minP) / range) * CH;
      const bodyTop = CY + CH - ((Math.max(candle.open, candle.close) - minP) / range) * CH;
      const bodyH = Math.max(1, bodyBot - bodyTop);
      const isGreen = candle.close >= candle.open;

      g.fillStyle(isGreen ? 0x4ADE80 : 0xF87171, 0.9);
      g.fillRect(x + 1, bodyTop, barW - 2, bodyH);

      const highY = CY + CH - ((candle.high - minP) / range) * CH;
      const lowY = CY + CH - ((candle.low - minP) / range) * CH;
      g.lineStyle(1, isGreen ? 0x4ADE80 : 0xF87171, 0.7);
      g.lineBetween(x + barW / 2, highY, x + barW / 2, bodyTop);
      g.lineBetween(x + barW / 2, bodyBot, x + barW / 2, lowY);
    });
  }

  private drawStatBoard(w: number): void {
    const stockMap2 = marketEngine.getAllStocks();
    const stocksArr2 = Array.from(stockMap2.values());
    const stock = stocksArr2.find((s) => s.symbol === 'AAPL') || stocksArr2[0];

    let sharpe = 0;
    if (stock && stock.candles.length > 2) {
      const candles: { close: number }[] = stock.candles.slice(-20);
      const returns = candles.map((c, i, arr) =>
        i === 0 ? 0 : (c.close - arr[i - 1].close) / arr[i - 1].close
      ).slice(1);
      sharpe = sharpeRatio(returns, 0.04 / 252);
    }

    const boardX = 30 * TILE_SIZE;
    const boardY = 26 * TILE_SIZE;

    const bg = this.add.graphics().setDepth(6);
    bg.fillStyle(0x0A1215, 0.9);
    bg.fillRoundedRect(boardX, boardY, 220, 100, 6);
    bg.lineStyle(1, 0x1A6B5F, 0.7);
    bg.strokeRoundedRect(boardX, boardY, 220, 100, 6);

    this.add.text(boardX + 10, boardY + 8, 'QUANT METRICS', {
      fontFamily: 'Courier New', fontSize: '11px', fontStyle: 'bold', color: '#4ADE80',
    }).setDepth(7);

    const metrics = [
      { label: 'Sharpe Ratio', value: sharpe.toFixed(3), color: sharpe > 1 ? '#4ADE80' : '#F87171' },
      { label: 'Strategy', value: 'BUY & HOLD', color: '#A0B8D0' },
      { label: 'Benchmark', value: 'SPY +12.3%', color: '#D4A84B' },
    ];

    metrics.forEach((m, i) => {
      this.add.text(boardX + 10, boardY + 28 + i * 22, `${m.label}:`, {
        fontFamily: 'Courier New', fontSize: '10px', color: '#4A6B8A',
      }).setDepth(7);
      this.add.text(boardX + 210, boardY + 28 + i * 22, m.value, {
        fontFamily: 'Courier New', fontSize: '10px', color: m.color,
      }).setOrigin(1, 0).setDepth(7);
    });
  }

  private drawDistrictLabel(text: string, x: number, y: number): void {
    this.add.text(x, y, text, {
      fontFamily: 'Courier New',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#4ADE80',
      stroke: '#0A1215',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
  }

  private addBuilding(x: number, y: number, config: BuildingConfig): void {
    this.buildings.push(new Building(this, x, y, config));
  }

  private addNPC(x: number, y: number, config: NpcSpawn): void {
    this.npcs.push(new NPC(this, x, y, config));
  }

  private fadeToScene(sceneKey: string): void {
    this.liveChartTimer?.remove();
    this.cameras.main.fadeOut(500, 14, 26, 42);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey));
  }

  override update(): void {
    this.player.movementLocked = dialogueSystem.isActive();
    this.player.update();

    const INTERACT_RANGE = 60;
    let closest: NPC | Building | null = null;
    let closestDist = INTERACT_RANGE;

    [...this.npcs, ...this.buildings].forEach(entity => {
      const d = Math.hypot(entity.x - this.player.x, entity.y - this.player.y);
      if (d < closestDist) { closest = entity; closestDist = d; }
    });

    if (closest !== this.nearbyEntity) {
      this.nearbyEntity?.hideIndicator();
      this.nearbyEntity = closest;
      (this.nearbyEntity as NPC | Building | null)?.showIndicator();
    }

    const pressed =
      Phaser.Input.Keyboard.JustDown(this.interactKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    if (pressed && this.nearbyEntity && !dialogueSystem.isActive()) {
      const ent = this.nearbyEntity as NPC | Building;
      if (ent instanceof NPC) {
        const tree = allDialogues[(ent as NPC).dialogueId];
        if (tree) dialogueSystem.start(tree);
      } else if (ent instanceof Building && (ent as Building).onEnter) {
        (ent as Building).onEnter!();
      }
    }
  }
}
