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

export class CryptoCoveScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private buildings: Building[] = [];
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private nearbyEntity: NPC | Building | null = null;
  private hudUpdater?: (district: string) => void;
  private onTerminalOpen?: (market: 'wall-street' | 'dalal-street') => void;
  private onEchoOpen?: () => void;
  private neonTicker!: Phaser.GameObjects.Text;
  private tickerSymbols = ['BTC ▲2.3%', 'ETH ▼1.1%', 'SOL ▲8.7%', 'DOGE ▲420%', 'SHIB ▼99%', 'BNB ▲3.4%'];
  private tickerIdx = 0;

  constructor() {
    super({ key: 'CryptoCoveScene' });
  }

  init(): void {
    this.hudUpdater = this.registry.get('hudUpdater');
    this.onTerminalOpen = this.registry.get('onTerminalOpen');
    this.onEchoOpen = this.registry.get('onEchoOpen');
  }

  create(): void {
    this.npcs = [];
    this.buildings = [];
    this.hudUpdater?.('Crypto Cove');
    behaviorTracker.log('district_enter', { district: 'Crypto Cove' });

    const WORLD_W = 52 * TILE_SIZE;
    const WORLD_H = 42 * TILE_SIZE;
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.drawCryptoWorld(WORLD_W, WORLD_H);
    this.drawDistrictLabel('🪙 Crypto Cove', WORLD_W / 2, 20);

    const T = TILE_SIZE;
    addCommonDecor(this, {
      lamps: [
        [6 * T, 8 * T], [14 * T, 8 * T], [22 * T, 8 * T], [30 * T, 8 * T], [38 * T, 8 * T], [46 * T, 8 * T],
        [6 * T, 36 * T], [14 * T, 36 * T], [22 * T, 36 * T], [30 * T, 36 * T], [38 * T, 36 * T], [46 * T, 36 * T],
      ],
      trees: [
        [3 * T, 16 * T, 1.2], [3 * T, 28 * T, 1.0], [49 * T, 16 * T, 1.0], [49 * T, 28 * T, 1.2],
        [10 * T, 4 * T, 0.9], [42 * T, 4 * T, 1], [10 * T, 40 * T, 0.9], [42 * T, 40 * T, 1.1],
      ],
      benches: [
        [16 * T, 22 * T, false], [36 * T, 22 * T, false],
        [26 * T, 32 * T, false], [26 * T, 6 * T, false],
      ],
      planters: [
        [9 * T, 12 * T], [43 * T, 12 * T], [9 * T, 32 * T], [43 * T, 32 * T],
      ],

      bridges: [
        [26 * T, 26 * T, 240, 36],
      ],
      fountains: [
        [40 * T, 28 * T, 0x7B2FBE],
      ],
      signs: [
        [6 * T, 20 * T, 'DEX →'],
        [46 * T, 20 * T, '← NFTs'],
        [26 * T, 32 * T, 'BOARDWALK'],
      ],
    });

    this.addBuilding(24 * TILE_SIZE, 14 * TILE_SIZE, {
      id: 'dex',
      type: 'brokerage',
      width: 180,
      height: 140,
      label: '⚡ DEX Exchange — Trade Crypto',
      onEnter: () => {
        if (this.onTerminalOpen) this.onTerminalOpen('wall-street');
      },
    });

    this.addBuilding(8 * TILE_SIZE, 10 * TILE_SIZE, {
      id: 'rug_casino',
      type: 'casino',
      width: 130,
      height: 120,
      label: '🚨 Rug Pull Simulator',
      onEnter: () => {
        dialogueSystem.start(allDialogues.rug_pull_lesson, () => {});
      },
    });

    this.addBuilding(40 * TILE_SIZE, 8 * TILE_SIZE, {
      id: 'nft_gallery',
      type: 'bank',
      width: 120,
      height: 100,
      label: '🖼 NFT Gallery',
      onEnter: () => {
        dialogueSystem.start(allDialogues.nft_lesson, () => {});
      },
    });

    this.addBuilding(45 * TILE_SIZE, 28 * TILE_SIZE, {
      id: 'time_machine_cc',
      type: 'time_machine',
      width: 110,
      height: 110,
      label: '🕰 Time Machine',
      onEnter: () => {
        if (this.onEchoOpen) this.onEchoOpen();
      },
    });

    this.addBuilding(4 * TILE_SIZE, 32 * TILE_SIZE, {
      id: 'train_cc',
      type: 'train_station',
      width: 140,
      height: 120,
      label: '🚂 Exit Crypto Cove',
      onEnter: () => this.fadeToScene('WorldMapScene'),
    });

    this.addNPC(26 * TILE_SIZE, 22 * TILE_SIZE, {
      id: 'satoshi_bot',
      archetype: 'mentor',
      dialogueId: 'satoshi_bot',
      speakerName: 'Satoshi-bot',
    });

    this.addNPC(14 * TILE_SIZE, 16 * TILE_SIZE, {
      id: 'rug_puller',
      archetype: 'scammer_gold',
      dialogueId: 'rug_pull_scammer',
      speakerName: 'CryptoKing99',
    });

    this.addNPC(36 * TILE_SIZE, 24 * TILE_SIZE, {
      id: 'defi_farmer',
      archetype: 'neighbor',
      dialogueId: 'defi_explanation',
      speakerName: 'DeFi Dave',
    });

    this.addNPC(20 * TILE_SIZE, 26 * TILE_SIZE, {
      id: 'crypto_surfer',
      archetype: 'neighbor',
      dialogueId: 'crypto_surfer',
      speakerName: 'Surfer Sam',
    });

    this.player = new Player(this, 6 * TILE_SIZE, 35 * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);

    this.buildings.forEach(b => this.physics.add.collider(this.player, b));
    this.npcs.forEach(n => this.physics.add.collider(this.player, n));

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.neonTicker = this.add.text(WORLD_W / 2, 48, this.tickerSymbols[0], {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: '#A855F7',
      stroke: '#0A0A0A',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        this.tickerIdx = (this.tickerIdx + 1) % this.tickerSymbols.length;
        this.neonTicker.setText(this.tickerSymbols[this.tickerIdx]);
      },
    });
  }

  private drawCryptoWorld(w: number, h: number): void {
    const g = this.add.graphics();

    g.fillStyle(0x0A0A1A);
    g.fillRect(0, 0, w, h);

    for (let y = 0; y < h; y += TILE_SIZE) {
      for (let x = 0; x < w; x += TILE_SIZE) {
        g.lineStyle(0.5, 0x7B2FBE, 0.25);
        g.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }

    g.fillStyle(0x120A24);
    g.fillRoundedRect(TILE_SIZE * 2, TILE_SIZE * 3, w - TILE_SIZE * 4, h - TILE_SIZE * 6, 40);

    g.lineStyle(3, 0x7B2FBE, 0.8);
    g.strokeRoundedRect(TILE_SIZE * 2, TILE_SIZE * 3, w - TILE_SIZE * 4, h - TILE_SIZE * 6, 40);

    g.lineStyle(2, 0x7B2FBE, 0.5);

    g.lineBetween(24 * TILE_SIZE, TILE_SIZE * 4, 24 * TILE_SIZE, h - TILE_SIZE * 4);

    g.lineBetween(TILE_SIZE * 3, 22 * TILE_SIZE, w - TILE_SIZE * 3, 22 * TILE_SIZE);

    g.lineStyle(1, 0xA855F7, 0.3);
    g.lineBetween(0, 0, w, h);
    g.lineBetween(w, 0, 0, h);

    const nodes = [
      [24 * TILE_SIZE, 8 * TILE_SIZE],
      [24 * TILE_SIZE, 22 * TILE_SIZE],
      [10 * TILE_SIZE, 22 * TILE_SIZE],
      [40 * TILE_SIZE, 22 * TILE_SIZE],
    ];
    nodes.forEach(([nx, ny]) => {
      g.fillStyle(0x7B2FBE, 0.4);
      g.fillCircle(nx, ny, 8);
      g.lineStyle(2, 0xA855F7, 0.7);
      g.strokeCircle(nx, ny, 12);
    });

    const symbols = ['₿', 'Ξ', '◎', '⟠'];
    symbols.forEach((s, i) => {
      const sx = (i + 0.5) * (w / 4);
      this.add.text(sx, TILE_SIZE * 2, s, {
        fontFamily: 'Courier New',
        fontSize: '22px',
        color: '#7B2FBE',
      }).setOrigin(0.5).setDepth(0).setAlpha(0.4);
      this.add.text(sx, h - TILE_SIZE * 2, s, {
        fontFamily: 'Courier New',
        fontSize: '22px',
        color: '#7B2FBE',
      }).setOrigin(0.5).setDepth(0).setAlpha(0.4);
    });

    g.setDepth(-1);
  }

  private drawDistrictLabel(text: string, x: number, y: number): void {
    this.add.text(x, y, text, {
      fontFamily: 'Courier New',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#A855F7',
      stroke: '#0A0A1A',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
  }

  private addBuilding(x: number, y: number, config: BuildingConfig): void {
    const b = new Building(this, x, y, config);
    this.buildings.push(b);
  }

  private addNPC(x: number, y: number, config: NpcSpawn): void {
    const npc = new NPC(this, x, y, config);
    this.npcs.push(npc);
  }

  private fadeToScene(sceneKey: string): void {
    this.cameras.main.fadeOut(500, 10, 5, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey);
    });
  }

  override update(): void {
    if (dialogueSystem.isActive()) {
      this.player.movementLocked = true;
    } else {
      this.player.movementLocked = false;
    }

    this.player.update();

    const INTERACT_RANGE = 60;
    let closest: NPC | Building | null = null;
    let closestDist = INTERACT_RANGE;

    [...this.npcs, ...this.buildings].forEach(entity => {
      const dx = entity.x - this.player.x;
      const dy = entity.y - this.player.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < closestDist) { closest = entity; closestDist = d; }
    });

    if (closest !== this.nearbyEntity) {
      if (this.nearbyEntity) this.nearbyEntity.hideIndicator();
      this.nearbyEntity = closest;
      if (this.nearbyEntity) (this.nearbyEntity as NPC | Building).showIndicator();
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
