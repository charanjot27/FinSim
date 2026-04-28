import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { NPC, type NpcArchetype } from '@/entities/NPC';
import { Building, type BuildingConfig } from '@/entities/Building';
import { TILE_SIZE, COLORS } from '@/config/constants';
import { addCommonDecor } from '@/scenes/utils/DistrictDecor';
import { dialogueSystem } from '@/systems/DialogueSystem';
import { allDialogues } from '@/data/dialogues';
import { behaviorTracker } from '@/systems/BehaviorTracker';

interface NpcSpawn {
  id: string;
  archetype: NpcArchetype;
  dialogueId: string;
  speakerName: string;
}

export class WallStreetScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private buildings: Building[] = [];
  private interactKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private nearbyEntity: NPC | Building | null = null;
  private market: 'wall-street' | 'dalal-street' = 'wall-street';
  private onTerminalOpen?: (market: 'wall-street' | 'dalal-street') => void;
  private onEchoOpen?: () => void;
  private hudUpdater?: (district: string) => void;

  constructor() {
    super({ key: 'WallStreetScene' });
  }

  init(data: { market?: 'wall-street' | 'dalal-street' }): void {
    this.market = data.market ?? 'wall-street';
    this.hudUpdater = this.registry.get('hudUpdater');
    this.onTerminalOpen = this.registry.get('onTerminalOpen');
    this.onEchoOpen = this.registry.get('onEchoOpen');
  }

  create(): void {
    this.npcs = [];
    this.buildings = [];
    const districtName = this.market === 'wall-street' ? 'Wall Street' : 'Dalal Street';
    this.hudUpdater?.(districtName);
    behaviorTracker.log('district_enter', { district: districtName });

    const WORLD_W = 50 * TILE_SIZE;
    const WORLD_H = 40 * TILE_SIZE;
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.drawCityGround(WORLD_W, WORLD_H);
    this.drawDistrictLabel(districtName, WORLD_W / 2, 20);

    const T = TILE_SIZE;
    addCommonDecor(this, {
      lamps: [
        [4 * T, 6 * T], [12 * T, 6 * T], [20 * T, 6 * T], [28 * T, 6 * T], [36 * T, 6 * T], [44 * T, 6 * T],
        [4 * T, 34 * T], [12 * T, 34 * T], [20 * T, 34 * T], [28 * T, 34 * T], [36 * T, 34 * T], [44 * T, 34 * T],
        [22 * T, 16 * T], [28 * T, 16 * T],
      ],
      trees: [
        [3 * T, 14 * T, 1.0], [3 * T, 26 * T, 1.1], [47 * T, 14 * T, 1.0], [47 * T, 26 * T, 0.9],
        [14 * T, 30 * T, 1], [36 * T, 30 * T, 1.1], [14 * T, 4 * T, 0.9], [36 * T, 4 * T, 0.9],
      ],
      benches: [
        [22 * T, 22 * T, false], [28 * T, 22 * T, false],
        [10 * T, 18 * T, true], [42 * T, 18 * T, true],
      ],
      planters: [
        [21 * T, 12 * T], [29 * T, 12 * T], [21 * T, 20 * T], [29 * T, 20 * T],
      ],

      signs: [
        [25 * T, 26 * T, 'PLAZA'],
        [4 * T, 24 * T, '🚂 Hub'],
        [40 * T, 16 * T, 'Bank →'],
      ],

      bridges: [
        [25 * T, 32 * T, 220, 38],
      ],
      fountains: [
        [40 * T, 28 * T, 0x1F3A5F],
      ],
    });

    const brokerageLabel = this.market === 'wall-street'
      ? '🏛 NYSE — Enter to Trade'
      : '🏛 BSE — Enter to Trade';
    this.addBuilding(25 * TILE_SIZE, 16 * TILE_SIZE, {
      id: 'brokerage', type: 'brokerage', width: 180, height: 140,
      label: brokerageLabel,
      onEnter: () => {
        if (this.onTerminalOpen) this.onTerminalOpen(this.market);
      },
    });

    this.addBuilding(8 * TILE_SIZE, 8 * TILE_SIZE, {
      id: 'time_machine_ws', type: 'time_machine', width: 110, height: 110,
      label: '🕰 Time Machine',
      onEnter: () => {
        if (this.onEchoOpen) this.onEchoOpen();
      },
    });

    this.addBuilding(40 * TILE_SIZE, 12 * TILE_SIZE, {
      id: 'bank_ws', type: 'bank', width: 110, height: 120, label: 'Central Bank',
    });

    this.addBuilding(4 * TILE_SIZE, 20 * TILE_SIZE, {
      id: 'train_back', type: 'train_station', width: 140, height: 120,
      label: '🚂 Back to Scam Slum',
      onEnter: () => this.fadeToScene('ScamSlumScene'),
    });

    this.addNPC(25 * TILE_SIZE, 22 * TILE_SIZE, {
      id: 'warren_bot',
      archetype: 'mentor',
      dialogueId: 'warren_bot',
      speakerName: 'Warren-bot',
    });

    this.addNPC(8 * TILE_SIZE, 24 * TILE_SIZE, {
      id: 'wallstreet_cabbie',
      archetype: 'neighbor',
      dialogueId: 'wallstreet_cabbie',
      speakerName: 'NYC Cabbie',
    });

    this.player = new Player(this, 6 * TILE_SIZE, 22 * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);

    this.buildings.forEach(b => this.physics.add.collider(this.player, b));
    this.npcs.forEach(n => this.physics.add.collider(this.player, n));

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private drawCityGround(w: number, h: number): void {
    const g = this.add.graphics();

    g.fillStyle(0x3A3F48);
    g.fillRect(0, 0, w, h);

    for (let i = 0; i < 5000; i++) {
       const rx = Math.random() * w;
       const ry = Math.random() * h;
       const size = Math.random() * 2 + 1;
       const alpha = Math.random() * 0.2 + 0.05;
       g.fillStyle(Math.random() < 0.5 ? 0x2A2F38 : 0x4A4F58, alpha);
       g.fillRect(rx, ry, size, size);
    }

    g.lineStyle(1, 0x2A2F38, 0.4);
    for (let y = 0; y < h; y += Math.floor(TILE_SIZE * 1.5)) {
      for (let x = 0; x < w; x += Math.floor(TILE_SIZE * 1.5)) {
        g.strokeRect(x, y, Math.floor(TILE_SIZE * 1.5), Math.floor(TILE_SIZE * 1.5));
      }
    }

    const vRoadX = 24 * TILE_SIZE;
    const vRoadW = 4 * TILE_SIZE;
    g.fillStyle(0x161618);
    g.fillRect(vRoadX, 0, vRoadW, h);

    for(let i=0; i<800; i++) {
        g.fillStyle(0x0a0a0a, 0.3);
        const rx = vRoadX + Math.random() * vRoadW;
        const ry = Math.random() * h;
        g.fillRect(rx, ry, Math.random() * 2 + 1, Math.random() * 3 + 1);
    }

    g.fillStyle(0xD4A84B);
    for (let y = 0; y < h; y += 60) {
      g.fillRect(vRoadX + vRoadW / 2 - 4, y, 3, 30);
      g.fillRect(vRoadX + vRoadW / 2 + 1, y, 3, 30);
    }

    const hRoadY = 24 * TILE_SIZE;
    const hRoadH = 4 * TILE_SIZE;
    g.fillStyle(0x161618);
    g.fillRect(0, hRoadY, w, hRoadH);

    for(let i=0; i<800; i++) {
        g.fillStyle(0x0a0a0a, 0.3);
        const rx = Math.random() * w;
        const ry = hRoadY + Math.random() * hRoadH;
        g.fillRect(rx, ry, Math.random() * 3 + 1, Math.random() * 2 + 1);
    }

    g.fillStyle(0xD4A84B);
    for (let x = 0; x < w; x += 60) {
      g.fillRect(x, hRoadY + hRoadH / 2 - 4, 30, 3);
      g.fillRect(x, hRoadY + hRoadH / 2 + 1, 30, 3);
    }

    g.fillStyle(0xeeeeee, 0.8);
    for (let i = 0; i < 5; i++) {

        g.fillRect(vRoadX + 10 + i * 20, hRoadY - 40, 10, 35);

        g.fillRect(vRoadX + 10 + i * 20, hRoadY + hRoadH + 5, 10, 35);

        g.fillRect(vRoadX - 40, hRoadY + 10 + i * 20, 35, 10);

        g.fillRect(vRoadX + vRoadW + 5, hRoadY + 10 + i * 20, 35, 10);
    }

    for(let i=0; i<15; i++) {
        const mx = Math.random() * w;
        const my = Math.random() * h;

        if ((mx >= vRoadX && mx <= vRoadX + vRoadW) || (my >= hRoadY && my <= hRoadY + hRoadH)) {
           g.fillStyle(0x2a2a2a);
           g.fillCircle(mx, my, 8);
           g.fillStyle(0x1a1a1a);
           g.fillCircle(mx, my, 6);

           g.lineStyle(1, 0x3a3a3a);
           g.lineBetween(mx - 5, my, mx + 5, my);
           g.lineBetween(mx, my - 5, mx, my + 5);
        }
    }

    g.fillStyle(0x1F3A5F);
    for (let i = 0; i < 8; i++) {
      const bx = i * 200 + 50;
      const bh = 40 + Math.random() * 60;
      g.fillRect(bx, 0, 120, bh);

      g.fillStyle(0xD4A84B, 0.8);
      for (let wy = 10; wy < bh - 5; wy += 12) {
        for (let wx = bx + 10; wx < bx + 110; wx += 20) {
          if (Math.random() > 0.4) {
             g.fillRect(wx, wy, 6, 6);

             g.fillStyle(0xD4A84B, 0.2);
             g.fillRect(wx-2, wy-2, 10, 10);
             g.fillStyle(0xD4A84B, 0.8);
          }
        }
      }
      g.fillStyle(0x1F3A5F);
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
      if (this.nearbyEntity) this.nearbyEntity.hideIndicator();
      this.nearbyEntity = closest;
      if (this.nearbyEntity) (this.nearbyEntity as NPC | Building).showIndicator();
    }

    const pressed =
      Phaser.Input.Keyboard.JustDown(this.interactKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    if (pressed && this.nearbyEntity && !dialogueSystem.isActive()) {
      this.interact(this.nearbyEntity);
    }
  }

  private interact(entity: NPC | Building): void {
    if (entity instanceof NPC) {
      const tree = allDialogues[entity.dialogueId];
      if (tree) dialogueSystem.start(tree);
    } else if (entity instanceof Building) {
      if (entity.onEnter) entity.onEnter();
    }
  }
}
