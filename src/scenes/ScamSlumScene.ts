import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { NPC, type NpcArchetype } from '@/entities/NPC';
import { Building, type BuildingConfig } from '@/entities/Building';
import { TILE_SIZE, COLORS } from '@/config/constants';
import { dialogueSystem } from '@/systems/DialogueSystem';
import { allDialogues } from '@/data/dialogues';
import { portfolio } from '@/systems/PortfolioSystem';
import { behaviorTracker } from '@/systems/BehaviorTracker';
import { addCommonDecor } from '@/scenes/utils/DistrictDecor';

interface NpcSpawn {
  id: string;
  archetype: NpcArchetype;
  dialogueId: string;
  speakerName: string;
}

export class ScamSlumScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private buildings: Building[] = [];
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private nearbyEntity: NPC | Building | null = null;
  private hudUpdater?: (district: string) => void;
  private onEchoOpen?: () => void;

  constructor() {
    super({ key: 'ScamSlumScene' });
  }

  init(data: { hudUpdater?: (district: string) => void; onEchoOpen?: () => void }): void {

    this.hudUpdater = this.registry.get('hudUpdater');
    this.onEchoOpen = this.registry.get('onEchoOpen');
  }

  create(): void {
    this.hudUpdater?.('Scam Slum');
    behaviorTracker.log('district_enter', { district: 'Scam Slum' });

    const WORLD_W = 50 * TILE_SIZE;
    const WORLD_H = 40 * TILE_SIZE;
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.drawGround(WORLD_W, WORLD_H);
    this.drawDistrictLabel('Scam Slum', WORLD_W / 2, 20);

    const T = TILE_SIZE;
    addCommonDecor(this, {
      lamps: [
        [10 * T, 10 * T], [20 * T, 10 * T], [30 * T, 10 * T], [40 * T, 10 * T],
        [10 * T, 30 * T], [20 * T, 30 * T], [30 * T, 30 * T], [40 * T, 30 * T],
      ],
      trees: [
        [3 * T, 18 * T, 0.9], [47 * T, 18 * T, 0.85],
        [3 * T, 28 * T, 1.0], [47 * T, 28 * T, 1.0],
      ],
      benches: [
        [16 * T, 22 * T, false], [34 * T, 22 * T, false],
      ],
      planters: [
        [12 * T, 18 * T], [38 * T, 18 * T],
      ],
      signs: [
        [25 * T, 14 * T, '🚂 STATION'],
      ],
    });

    this.addBuilding(4 * TILE_SIZE, 5 * TILE_SIZE, {
      id: 'player_home', type: 'house', width: 96, height: 96, label: 'Your Home',
    });
    this.addBuilding(24 * TILE_SIZE, 6 * TILE_SIZE, {
      id: 'neighbor_home', type: 'house', width: 96, height: 96, label: 'Neighbor',
    });
    this.addBuilding(12 * TILE_SIZE, 20 * TILE_SIZE, {
      id: 'chai_stall', type: 'chai', width: 80, height: 64, label: 'Chai Stall',
    });
    this.addBuilding(36 * TILE_SIZE, 12 * TILE_SIZE, {
      id: 'casino', type: 'casino', width: 120, height: 100, label: 'Underground Casino',
    });
    this.addBuilding(25 * TILE_SIZE, 32 * TILE_SIZE, {
      id: 'time_machine', type: 'time_machine', width: 110, height: 110, label: '🕰 Time Machine',
      onEnter: () => {
        if (this.onEchoOpen) this.onEchoOpen();
      },
    });

    this.addBuilding(44 * TILE_SIZE, 20 * TILE_SIZE, {
      id: 'train_station', type: 'train_station', width: 140, height: 120, label: '🚂 Train Station',
      onEnter: () => {
        dialogueSystem.start(allDialogues.train_master, (flags) => {
          if (flags.includes('unlock.wall_street') || flags.includes('unlock.crypto_cove')) {
            this.fadeToScene('WorldMapScene');
          } else if (flags.includes('unlock.dalal_street')) {
            this.fadeToScene('WorldMapScene');
          }
        });
      },
    });

    this.addBuilding(10 * TILE_SIZE, 36 * TILE_SIZE, {
      id: 'world_map_portal',
      type: 'time_machine',
      width: 100,
      height: 100,
      label: '🌍 World Map',
      onEnter: () => this.fadeToScene('WorldMapScene'),
    });

    this.addNPC(14 * TILE_SIZE, 10 * TILE_SIZE, {
      id: 'scammer_goldie',
      archetype: 'scammer_gold',
      dialogueId: 'scammer_gold_chain',
      speakerName: 'Mr. Goldie',
    });
    this.addNPC(30 * TILE_SIZE, 25 * TILE_SIZE, {
      id: 'scammer_priya',
      archetype: 'scammer_mlm',
      dialogueId: 'scammer_mlm',
      speakerName: 'Priya',
    });
    this.addNPC(8 * TILE_SIZE, 28 * TILE_SIZE, {
      id: 'scammer_rohit',
      archetype: 'scammer_preipo',
      dialogueId: 'scammer_pre_ipo',
      speakerName: 'Rohit',
    });

    this.addNPC(22 * TILE_SIZE, 18 * TILE_SIZE, {
      id: 'slum_newspaper_kid',
      archetype: 'neighbor',
      dialogueId: 'slum_newspaper_kid',
      speakerName: 'Newspaper Boy',
    });

    this.player = new Player(this, 6 * TILE_SIZE, 8 * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);

    this.buildings.forEach(b => this.physics.add.collider(this.player, b));
    this.npcs.forEach(n => this.physics.add.collider(this.player, n));

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.events.on('update', () => this.checkQuestProgress());
  }

  private drawGround(w: number, h: number): void {
    const g = this.add.graphics();

    g.fillStyle(0x2d1f1b);
    g.fillRect(0, 0, w, h);

    for (let i = 0; i < 4000; i++) {
       const rx = Math.random() * w;
       const ry = Math.random() * h;
       const size = Math.random() * 2 + 1;
       const alpha = Math.random() * 0.4 + 0.1;
       g.fillStyle(Math.random() < 0.5 ? 0x1f1411 : 0x3d2b25, alpha);
       g.fillRect(rx, ry, size, size);
    }

    const roadY = 18 * TILE_SIZE;
    const roadH = 4 * TILE_SIZE;
    g.fillStyle(0x1a1a1a);
    g.fillRect(0, roadY, w, roadH);

    for (let i = 0; i < 1500; i++) {
        g.fillStyle(0x000000, 0.3);
        const rx = Math.random() * w;
        const ry = roadY + Math.random() * roadH;
        g.fillRect(rx, ry, Math.random() * 3 + 1, Math.random() * 2 + 1);
    }

    g.fillStyle(0x2d1f1b, 0.5);
    for (let x = 0; x < w; x+= 10) {
        g.fillCircle(x + Math.random() * 10, roadY, Math.random() * 8 + 2);
        g.fillCircle(x + Math.random() * 10, roadY + roadH, Math.random() * 8 + 2);
    }

    g.fillStyle(0x888888, 0.4);
    for (let x = 0; x < w; x += 80) {
      g.fillRect(x, roadY + roadH / 2 - 2, 40, 4);
    }

    const vRoadX = 40 * TILE_SIZE;
    g.fillStyle(0x1a1a1a);
    g.fillRect(vRoadX, roadY, 4 * TILE_SIZE, h - roadY);

    for (let i = 0; i < 600; i++) {
        g.fillStyle(0x000000, 0.3);
        const rx = vRoadX + Math.random() * (4 * TILE_SIZE);
        const ry = roadY + Math.random() * (h - roadY);
        g.fillRect(rx, ry, Math.random() * 3 + 1, Math.random() * 2 + 1);
    }

    g.fillStyle(0x888888, 0.4);
    for (let y = roadY + roadH; y < h; y += 80) {
      g.fillRect(vRoadX + 2 * TILE_SIZE - 2, y, 4, 40);
    }

    for (let i = 0; i < 40; i++) {

        let rx, ry;
        if (Math.random() > 0.3) {
             rx = Math.random() * w;
             ry = roadY + Math.random() * roadH;
        } else {
             rx = vRoadX + Math.random() * (4*TILE_SIZE);
             ry = roadY + Math.random() * (h - roadY);
        }

        g.fillStyle(0x0a0a0a, 0.7);
        g.fillEllipse(rx, ry, 12 + Math.random()*15, 6 + Math.random()*8);

        if (Math.random() < 0.4) {

             g.fillStyle(0x4a6a8a, 0.4);
             g.fillEllipse(rx+2, ry+1, 8 + Math.random()*6, 4 + Math.random()*3);
        }
    }

    g.fillStyle(0x2a4a2a, 0.6);
    for (let i = 0; i < 300; i++) {
        const rx = Math.random() * w;
        const ry = Math.random() * h;

        if ((ry < roadY - 10 || ry > roadY + roadH + 10) && (rx < vRoadX - 10 || rx > vRoadX + 4*TILE_SIZE + 10)) {
             g.fillRect(rx, ry, 4, 4);
             g.fillRect(rx+1, ry-2, 2, 6);
        }
    }

    g.setDepth(-1);
  }

  private drawDistrictLabel(text: string, x: number, y: number): void {
    this.add.text(x, y, text, {
      fontFamily: 'Courier New',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#D4A84B',
      stroke: '#0E1A2A',
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

  private fadeToScene(sceneKey: string, data?: object): void {
    this.cameras.main.fadeOut(500, 14, 26, 42);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey, data);
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
      if (d < closestDist) {
        closest = entity;
        closestDist = d;
      }
    });

    if (closest !== this.nearbyEntity) {
      if (this.nearbyEntity) {
        this.nearbyEntity.hideIndicator();
      }
      this.nearbyEntity = closest;
      if (this.nearbyEntity) {
        (this.nearbyEntity as NPC | Building).showIndicator();
      }
    }

    const interactPressed =
      Phaser.Input.Keyboard.JustDown(this.interactKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    if (interactPressed && this.nearbyEntity && !dialogueSystem.isActive()) {
      this.interact(this.nearbyEntity);
    }
  }

  private interact(entity: NPC | Building): void {
    if (entity instanceof NPC) {
      const tree = allDialogues[entity.dialogueId];
      if (tree) {
        dialogueSystem.start(tree);
      }
    } else if (entity instanceof Building) {
      if (entity.onEnter) {
        entity.onEnter();
      }
    }
  }

  private checkQuestProgress(): void {

  }
}
