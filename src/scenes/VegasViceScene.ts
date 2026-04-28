import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { NPC } from '@/entities/NPC';
import { Building, type BuildingConfig } from '@/entities/Building';
import { TILE_SIZE } from '@/config/constants';
import { dialogueSystem } from '@/systems/DialogueSystem';
import { allDialogues } from '@/data/dialogues';
import { behaviorTracker } from '@/systems/BehaviorTracker';
import { expectedValue } from '@/lib/math';
import { addCommonDecor } from '@/scenes/utils/DistrictDecor';

interface NpcSpawn {
  id: string;
  archetype: import('@/entities/NPC').NpcArchetype;
  dialogueId: string;
  speakerName: string;
}

export class VegasViceScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private buildings: Building[] = [];
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private nearbyEntity: NPC | Building | null = null;
  private hudUpdater?: (district: string) => void;
  private onEchoOpen?: () => void;

  private rouletteGraphics!: Phaser.GameObjects.Graphics;
  private rouletteAngle = 0;
  private isSpinning = false;
  private evDisplay!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'VegasViceScene' });
  }

  init(): void {
    this.hudUpdater = this.registry.get('hudUpdater');
    this.onEchoOpen = this.registry.get('onEchoOpen');
  }

  create(): void {
    this.npcs = [];
    this.buildings = [];
    this.hudUpdater?.('Vegas Vice');
    behaviorTracker.log('district_enter', { district: 'Vegas Vice' });

    const WORLD_W = 52 * TILE_SIZE;
    const WORLD_H = 42 * TILE_SIZE;
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.drawVegasWorld(WORLD_W, WORLD_H);
    this.drawDistrictLabel('🎰 Vegas Vice', WORLD_W / 2, 20);

    const T = TILE_SIZE;
    addCommonDecor(this, {
      lamps: [
        [4 * T, 8 * T], [14 * T, 8 * T], [24 * T, 8 * T], [34 * T, 8 * T], [44 * T, 8 * T],
        [4 * T, 36 * T], [14 * T, 36 * T], [24 * T, 36 * T], [34 * T, 36 * T], [44 * T, 36 * T],
      ],
      trees: [
        [3 * T, 16 * T, 1.0], [3 * T, 28 * T, 1.0], [49 * T, 16 * T, 1.0], [49 * T, 28 * T, 1.1],
      ],
      benches: [
        [12 * T, 22 * T, false], [40 * T, 22 * T, false],
        [26 * T, 12 * T, false],
      ],
      planters: [
        [8 * T, 14 * T], [44 * T, 14 * T], [8 * T, 30 * T], [44 * T, 30 * T],
      ],
      fountains: [
        [26 * T, 30 * T, 0xE8375A],
      ],
      signs: [
        [6 * T, 18 * T, 'CASINO'],
        [46 * T, 18 * T, 'POKER'],
      ],
    });

    this.rouletteGraphics = this.add.graphics().setDepth(5);
    this.drawRouletteWheel(WORLD_W / 2, 5 * TILE_SIZE, 60);

    this.drawEVBoard(WORLD_W);

    this.addBuilding(24 * TILE_SIZE, 14 * TILE_SIZE, {
      id: 'main_casino',
      type: 'casino',
      width: 200,
      height: 160,
      label: '🎲 Grand Casino — Probability Lab',
      onEnter: () => {
        dialogueSystem.start(allDialogues.probability_lesson, () => {});
      },
    });

    this.addBuilding(8 * TILE_SIZE, 10 * TILE_SIZE, {
      id: 'sports_book',
      type: 'bank',
      width: 130,
      height: 110,
      label: '⚽ Sports Book — Bet Analysis',
      onEnter: () => {
        dialogueSystem.start(allDialogues.kelly_criterion_lesson, () => {});
      },
    });

    this.addBuilding(44 * TILE_SIZE, 10 * TILE_SIZE, {
      id: 'poker_room',
      type: 'house',
      width: 130,
      height: 110,
      label: '🃏 Poker Room — Pot Odds',
      onEnter: () => {
        dialogueSystem.start(allDialogues.poker_lesson, () => {});
      },
    });

    this.addBuilding(44 * TILE_SIZE, 28 * TILE_SIZE, {
      id: 'time_machine_vv',
      type: 'time_machine',
      width: 110,
      height: 110,
      label: '🕰 Time Machine',
      onEnter: () => {
        if (this.onEchoOpen) this.onEchoOpen();
      },
    });

    this.addBuilding(4 * TILE_SIZE, 32 * TILE_SIZE, {
      id: 'train_vv',
      type: 'train_station',
      width: 140,
      height: 120,
      label: '🚂 Exit Vegas Vice',
      onEnter: () => this.fadeToScene('WorldMapScene'),
    });

    this.addNPC(26 * TILE_SIZE, 22 * TILE_SIZE, {
      id: 'probability_prof',
      archetype: 'mentor',
      dialogueId: 'probability_mentor',
      speakerName: 'Prof. Pascal',
    });

    this.addNPC(14 * TILE_SIZE, 24 * TILE_SIZE, {
      id: 'gambler',
      archetype: 'neighbor',
      dialogueId: 'gamblers_fallacy',
      speakerName: 'Lucky Larry',
    });

    this.addNPC(38 * TILE_SIZE, 24 * TILE_SIZE, {
      id: 'house_edge',
      archetype: 'scammer_gold',
      dialogueId: 'house_edge_lesson',
      speakerName: 'The House',
    });

    this.addNPC(20 * TILE_SIZE, 28 * TILE_SIZE, {
      id: 'vegas_magician',
      archetype: 'neighbor',
      dialogueId: 'vegas_magician',
      speakerName: 'The Amazing Vinod',
    });

    this.player = new Player(this, 6 * TILE_SIZE, 35 * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);

    this.buildings.forEach(b => this.physics.add.collider(this.player, b));
    this.npcs.forEach(n => this.physics.add.collider(this.player, n));

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (!this.isSpinning) return;
        this.rouletteAngle += 0.05;
        this.rouletteGraphics.clear();
        this.drawRouletteWheel(WORLD_W / 2, 5 * TILE_SIZE, 60);
      },
    });

    this.time.delayedCall(1000, () => { this.isSpinning = true; });
  }

  private drawVegasWorld(w: number, h: number): void {
    const g = this.add.graphics();

    g.fillStyle(0x0D0508);
    g.fillRect(0, 0, w, h);

    g.fillStyle(0x180D1A);
    g.fillRect(0, 0, w, h);

    g.fillStyle(0x0A0A0A);
    g.fillRect(0, 20 * TILE_SIZE, w, 4 * TILE_SIZE);

    g.lineStyle(2, 0xE8375A, 0.7);
    g.lineBetween(0, 20 * TILE_SIZE, w, 20 * TILE_SIZE);
    g.lineBetween(0, 24 * TILE_SIZE, w, 24 * TILE_SIZE);

    g.fillStyle(0xD4A84B);
    for (let x = 0; x < w; x += 80) {
      g.fillRect(x, 22 * TILE_SIZE - 2, 40, 4);
    }

    const neonColors = [0xE8375A, 0xD4A84B, 0xA855F7, 0x4ADE80, 0x38BDF8];
    for (let i = 0; i < 12; i++) {
      const bx = Math.random() * w;
      const by = Math.random() * h * 0.6 + h * 0.1;
      const col = neonColors[Math.floor(Math.random() * neonColors.length)];
      g.lineStyle(2, col, 0.5);
      g.strokeRect(bx - 20, by - 8, 40, 16);
    }

    g.fillStyle(0x1A0D20);
    g.fillRect(0, 24 * TILE_SIZE, w, 2 * TILE_SIZE);
    g.fillRect(0, 16 * TILE_SIZE, w, 2 * TILE_SIZE);

    for (let i = 0; i < 4; i++) {
      const sx = (i + 0.5) * (w / 4);
      g.fillStyle(0xD4A84B, 0.04);
      g.fillCircle(sx, h * 0.3, 120);
    }

    g.setDepth(-1);
  }

  private drawRouletteWheel(cx: number, cy: number, r: number): void {
    const g = this.rouletteGraphics;
    const segments = 37;
    const greenSlots = [0];
    const redSlots = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

    for (let i = 0; i < segments; i++) {
      const startAngle = this.rouletteAngle + (i / segments) * Math.PI * 2;
      const endAngle = this.rouletteAngle + ((i + 1) / segments) * Math.PI * 2;

      if (greenSlots.includes(i)) {
        g.fillStyle(0x1A6B5F);
      } else if (redSlots.includes(i)) {
        g.fillStyle(0xC44536);
      } else {
        g.fillStyle(0x1A1A1A);
      }

      g.beginPath();
      g.moveTo(cx, cy);
      g.arc(cx, cy, r, startAngle, endAngle, false, 0.01);
      g.closePath();
      g.fillPath();
    }

    g.lineStyle(3, 0xD4A84B, 1);
    g.strokeCircle(cx, cy, r);
    g.lineStyle(1, 0xD4A84B, 0.5);
    g.strokeCircle(cx, cy, r - 8);

    g.fillStyle(0xD4A84B);
    g.fillCircle(cx, cy, 6);

    g.fillStyle(0xF4F1EA);
    g.fillCircle(cx, cy - r + 5, 4);
  }

  private drawEVBoard(w: number): void {

    const bets = [
      { name: 'Red/Black (Roulette)', prob: 18/37, payout: 1, stake: 1 },
      { name: 'Single Number', prob: 1/37, payout: 35, stake: 1 },
      { name: 'Stock Market (S&P)', prob: 0.62, payout: 1.15, stake: 1 },
      { name: 'Lottery Ticket', prob: 1/14000000, payout: 10000000, stake: 2 },
    ];

    const boardX = TILE_SIZE * 30;
    const boardY = TILE_SIZE * 26;

    const bg = this.add.graphics().setDepth(6);
    bg.fillStyle(0x0D0508, 0.9);
    bg.fillRoundedRect(boardX, boardY, 260, 120, 6);
    bg.lineStyle(1, 0xD4A84B, 0.7);
    bg.strokeRoundedRect(boardX, boardY, 260, 120, 6);

    this.add.text(boardX + 10, boardY + 8, 'EXPECTED VALUE CALCULATOR', {
      fontFamily: 'Courier New', fontSize: '9px', fontStyle: 'bold', color: '#D4A84B',
    }).setDepth(7);

    bets.forEach((bet, i) => {
      const ev = expectedValue([
        { probability: bet.prob, payoff: bet.payout - bet.stake },
        { probability: 1 - bet.prob, payoff: -bet.stake },
      ]);
      const evColor = ev >= 0 ? '#4ADE80' : '#F87171';
      this.add.text(boardX + 10, boardY + 24 + i * 22, bet.name, {
        fontFamily: 'Courier New', fontSize: '9px', color: '#A0B8D0',
      }).setDepth(7);
      this.add.text(boardX + 250, boardY + 24 + i * 22, `EV: ${ev >= 0 ? '+' : ''}${ev.toFixed(3)}`, {
        fontFamily: 'Courier New', fontSize: '9px', color: evColor,
      }).setOrigin(1, 0).setDepth(7);
    });
  }

  private drawDistrictLabel(text: string, x: number, y: number): void {
    this.add.text(x, y, text, {
      fontFamily: 'Courier New',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#E8375A',
      stroke: '#0D0508',
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
