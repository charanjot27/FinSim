import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { NPC } from '@/entities/NPC';
import { Building, type BuildingConfig } from '@/entities/Building';
import { TILE_SIZE, COLORS } from '@/config/constants';
import { dialogueSystem } from '@/systems/DialogueSystem';
import { allDialogues } from '@/data/dialogues';
import { behaviorTracker } from '@/systems/BehaviorTracker';
import { addCommonDecor } from '@/scenes/utils/DistrictDecor';

interface NpcSpawn {
  id: string;
  archetype: import('@/entities/NPC').NpcArchetype;
  dialogueId: string;
  speakerName: string;
}

export class DalalStreetScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private buildings: Building[] = [];
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private nearbyEntity: NPC | Building | null = null;
  private hudUpdater?: (district: string) => void;
  private onTerminalOpen?: (market: 'wall-street' | 'dalal-street') => void;
  private onEchoOpen?: () => void;

  constructor() {
    super({ key: 'DalalStreetScene' });
  }

  init(): void {
    this.hudUpdater = this.registry.get('hudUpdater');
    this.onTerminalOpen = this.registry.get('onTerminalOpen');
    this.onEchoOpen = this.registry.get('onEchoOpen');
  }

  create(): void {
    this.npcs = [];
    this.buildings = [];
    this.hudUpdater?.('Dalal Street');
    behaviorTracker.log('district_enter', { district: 'Dalal Street' });

    const WORLD_W = 52 * TILE_SIZE;
    const WORLD_H = 42 * TILE_SIZE;
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.drawMumbaiWorld(WORLD_W, WORLD_H);
    this.drawDistrictLabel('🏛 Dalal Street', WORLD_W / 2, 20);
    this.drawSensexTicker(WORLD_W);

    const T = TILE_SIZE;
    addCommonDecor(this, {
      lamps: [
        [4 * T, 8 * T], [12 * T, 8 * T], [20 * T, 8 * T], [28 * T, 8 * T], [36 * T, 8 * T], [44 * T, 8 * T],
        [4 * T, 36 * T], [12 * T, 36 * T], [20 * T, 36 * T], [28 * T, 36 * T], [36 * T, 36 * T], [44 * T, 36 * T],
      ],
      trees: [
        [3 * T, 18 * T, 1.1], [3 * T, 26 * T, 0.9], [49 * T, 18 * T, 1], [49 * T, 26 * T, 1.2],
        [16 * T, 4 * T, 0.9], [32 * T, 4 * T, 1], [16 * T, 40 * T, 1], [32 * T, 40 * T, 0.9],
      ],
      benches: [
        [10 * T, 22 * T, false], [42 * T, 22 * T, false],
        [26 * T, 6 * T, false], [26 * T, 38 * T, false],
      ],
      planters: [
        [8 * T, 12 * T], [44 * T, 12 * T], [8 * T, 32 * T], [44 * T, 32 * T],
      ],
      fountains: [
        [26 * T, 22 * T, 0xF4A84B],
      ],
      bridges: [

        [26 * T, 34 * T, 200, 36],
      ],
      signs: [
        [6 * T, 14 * T, 'BSE →'],
        [46 * T, 14 * T, '← NSE'],
        [26 * T, 30 * T, 'BAZAAR'],
      ],
    });

    this.addBuilding(24 * TILE_SIZE, 12 * TILE_SIZE, {
      id: 'bse_building',
      type: 'brokerage',
      width: 200,
      height: 160,
      label: '🏛 BSE — Bombay Stock Exchange',
      onEnter: () => {
        if (this.onTerminalOpen) this.onTerminalOpen('dalal-street');
      },
    });

    this.addBuilding(42 * TILE_SIZE, 10 * TILE_SIZE, {
      id: 'nse_building',
      type: 'bank',
      width: 130,
      height: 120,
      label: '📈 NSE — National Stock Exchange',
      onEnter: () => {
        dialogueSystem.start(allDialogues.nse_vs_bse, () => {});
      },
    });

    this.addBuilding(6 * TILE_SIZE, 8 * TILE_SIZE, {
      id: 'sebi_office',
      type: 'bank',
      width: 130,
      height: 110,
      label: '⚖ SEBI — Market Regulator',
      onEnter: () => {
        dialogueSystem.start(allDialogues.sebi_explanation, () => {});
      },
    });

    this.addBuilding(6 * TILE_SIZE, 22 * TILE_SIZE, {
      id: 'ipo_window',
      type: 'house',
      width: 130,
      height: 110,
      label: '🎯 IPO Window — New Listings',
      onEnter: () => {
        dialogueSystem.start(allDialogues.ipo_lesson, () => {});
      },
    });

    this.addBuilding(40 * TILE_SIZE, 22 * TILE_SIZE, {
      id: 'zerodha',
      type: 'chai',
      width: 130,
      height: 100,
      label: '💹 Zerodha — Discount Broker',
      onEnter: () => {
        dialogueSystem.start(allDialogues.discount_broker_lesson, () => {});
      },
    });

    this.addBuilding(44 * TILE_SIZE, 30 * TILE_SIZE, {
      id: 'time_machine_ds',
      type: 'time_machine',
      width: 110,
      height: 110,
      label: '🕰 Time Machine — 1992',
      onEnter: () => {
        if (this.onEchoOpen) this.onEchoOpen();
      },
    });

    this.addBuilding(4 * TILE_SIZE, 33 * TILE_SIZE, {
      id: 'train_ds',
      type: 'train_station',
      width: 140,
      height: 120,
      label: '🚂 Exit Dalal Street',
      onEnter: () => this.fadeToScene('WorldMapScene'),
    });

    this.addNPC(26 * TILE_SIZE, 22 * TILE_SIZE, {
      id: 'sensex_mentor',
      archetype: 'mentor',
      dialogueId: 'sensex_mentor',
      speakerName: 'Radhakrishnan',
    });

    this.addNPC(14 * TILE_SIZE, 16 * TILE_SIZE, {
      id: 'harshad_echo',
      archetype: 'scammer_gold',
      dialogueId: 'harshad_warning',
      speakerName: 'The Big Bull',
    });

    this.addNPC(36 * TILE_SIZE, 28 * TILE_SIZE, {
      id: 'retail_trader',
      archetype: 'neighbor',
      dialogueId: 'fo_explanation',
      speakerName: 'Ramesh (Trader)',
    });

    this.addNPC(20 * TILE_SIZE, 18 * TILE_SIZE, {
      id: 'dalal_chaiwala',
      archetype: 'neighbor',
      dialogueId: 'dalal_chaiwala',
      speakerName: 'Ramesh the Chaiwala',
    });

    this.player = new Player(this, 6 * TILE_SIZE, 35 * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);

    this.buildings.forEach(b => this.physics.add.collider(this.player, b));
    this.npcs.forEach(n => this.physics.add.collider(this.player, n));

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private drawMumbaiWorld(w: number, h: number): void {
    const g = this.add.graphics();

    g.fillStyle(0x2E2418);
    g.fillRect(0, 0, w, h);

    for (let y = 0; y < h; y += TILE_SIZE) {
      for (let x = 0; x < w; x += TILE_SIZE) {
        if ((x / TILE_SIZE + y / TILE_SIZE) % 3 === 0) {
          g.fillStyle(0x362B1C, 0.5);
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }

        if (Math.random() < 0.02) {
          g.fillStyle(0xF4A84B, 0.3);
          g.fillCircle(x + Math.random() * TILE_SIZE, y + Math.random() * TILE_SIZE, 2);
        }
      }
    }

    g.fillStyle(0x1A1208);
    g.fillRect(0, 20 * TILE_SIZE, w, 4 * TILE_SIZE);

    g.fillStyle(0xF4A84B);
    for (let x = 0; x < w; x += 60) {
      g.fillRect(x, 22 * TILE_SIZE - 2, 30, 4);
    }

    g.fillStyle(0x2A2010);
    g.fillRect(0, 16 * TILE_SIZE, w, 2 * TILE_SIZE);
    g.fillRect(0, 24 * TILE_SIZE, w, 2 * TILE_SIZE);

    g.fillStyle(0xF4A84B, 0.3);
    g.fillRect(0, 22 * TILE_SIZE - 1, w, 2);

    for (let i = 0; i < 8; i++) {
      const sx = i * (w / 8) + 16;
      const sy = 17 * TILE_SIZE;
      g.fillStyle(0x8B4513);
      g.fillRect(sx, sy, 20, 14);
      g.fillStyle(0xF4A84B);
      g.fillRect(sx - 4, sy - 6, 28, 8);
    }

    g.fillStyle(0x1A1008);
    g.fillCircle(24 * TILE_SIZE + 100, 10 * TILE_SIZE, 60);
    g.fillRect(24 * TILE_SIZE + 40, 10 * TILE_SIZE, 120, 60);

    g.setDepth(-1);
  }

  private drawSensexTicker(w: number): void {
    const stocks = [
      'RELIANCE ▲1.2%', 'TCS ▼0.8%', 'HDFC ▲2.1%', 'INFY ▲0.5%',
      'SENSEX 74,234', 'NIFTY 22,500', 'ADANI ▲5.3%', 'ITC ▲1.8%',
    ];
    let idx = 0;

    const ticker = this.add.text(w / 2, 48, stocks[0], {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: '#F4A84B',
      stroke: '#0E0A04',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    this.time.addEvent({
      delay: 1800,
      loop: true,
      callback: () => {
        idx = (idx + 1) % stocks.length;
        ticker.setText(stocks[idx]);
        const isUp = stocks[idx].includes('▲');
        const isDown = stocks[idx].includes('▼');
        ticker.setColor(isUp ? '#4ADE80' : isDown ? '#F87171' : '#F4A84B');
      },
    });
  }

  private drawDistrictLabel(text: string, x: number, y: number): void {
    this.add.text(x, y, text, {
      fontFamily: 'Courier New',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#F4A84B',
      stroke: '#1A0A04',
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
