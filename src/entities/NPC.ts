import Phaser from 'phaser';

export type NpcArchetype =
  | 'scammer_gold'
  | 'scammer_mlm'
  | 'scammer_preipo'
  | 'mentor'
  | 'station_master'
  | 'neighbor'
  | 'mom';

interface NpcPalette {
  skin: string;
  skinShade: string;
  hair: string;
  hairShade: string;
  shirt: string;
  shirtShade: string;
  pants: string;
  accent: string;
}

const PALETTES: Record<NpcArchetype, NpcPalette> = {
  scammer_gold:    { skin:'#E3B189', skinShade:'#B8855F', hair:'#1F1A15', hairShade:'#0A0808', shirt:'#C42030', shirtShade:'#8A0A18', pants:'#1F1F1F', accent:'#F4C542' },
  scammer_mlm:     { skin:'#F0CFAA', skinShade:'#C49A78', hair:'#4A2A18', hairShade:'#2A1508', shirt:'#E458A8', shirtShade:'#A82878', pants:'#2A1F40', accent:'#FFE0F0' },
  scammer_preipo:  { skin:'#DCAA82', skinShade:'#A87E58', hair:'#15110C', hairShade:'#050302', shirt:'#3A6B48', shirtShade:'#1A4020', pants:'#1E1E1E', accent:'#8FE8A8' },
  mentor:          { skin:'#E8C8A3', skinShade:'#B89775', hair:'#C8C8C8', hairShade:'#6A6A6A', shirt:'#2E4E7B', shirtShade:'#1A2F50', pants:'#1A2030', accent:'#F4C542' },
  station_master:  { skin:'#D9A87E', skinShade:'#A87848', hair:'#2A2015', hairShade:'#100808', shirt:'#1F3A5F', shirtShade:'#0A1A30', pants:'#0E1A2A', accent:'#F4C542' },
  neighbor:        { skin:'#E3B189', skinShade:'#B8855F', hair:'#3F2818', hairShade:'#201008', shirt:'#4A8ABF', shirtShade:'#2A5080', pants:'#2A2A3A', accent:'#CCCCCC' },
  mom:             { skin:'#EAC59A', skinShade:'#B8906B', hair:'#5A2F1A', hairShade:'#2A1508', shirt:'#C0608A', shirtShade:'#8A3058', pants:'#3F2A3F', accent:'#E8B0C0' },
};

export class NPC extends Phaser.Physics.Arcade.Sprite {
  public npcId: string;
  public archetype: NpcArchetype;
  public dialogueId: string;
  public speakerName: string;
  private indicator?: Phaser.GameObjects.Text;
  private indicatorBg?: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      id: string;
      archetype: NpcArchetype;
      dialogueId: string;
      speakerName: string;
    }
  ) {
    const textureKey = `npc_${config.archetype}`;
    NPC.generateTexture(scene, config.archetype);
    super(scene, x, y, textureKey);
    this.npcId = config.id;
    this.archetype = config.archetype;
    this.dialogueId = config.dialogueId;
    this.speakerName = config.speakerName;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    this.setSize(24, 24);
    this.setOffset(4, 8);
    this.setDepth(10);

    scene.tweens.add({
      targets: this,
      y: y - 2,
      duration: 1200 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const plate = scene.add.graphics();
    plate.fillStyle(0x0E1A2A, 0.85);
    plate.fillRoundedRect(-28, -30, 56, 14, 3);
    plate.lineStyle(1, 0xF4C542, 0.8);
    plate.strokeRoundedRect(-28, -30, 56, 14, 3);
    plate.setDepth(11);

    const nameLabel = scene.add.text(x, y - 24, config.speakerName, {
      fontFamily: 'Courier New',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#F4E6C3',
    }).setOrigin(0.5).setDepth(12);
    nameLabel.setStroke('#0A1020', 2);

    plate.x = x;
    plate.y = y;
  }

  static generateTexture(scene: Phaser.Scene, archetype: NpcArchetype): void {
    const key = `npc_${archetype}`;
    if (scene.textures.exists(key)) return;

    const palette = PALETTES[archetype];
    const W = 32, H = 32;
    const canvas = scene.textures.createCanvas(key, W, H);
    if (!canvas) return;
    const c = canvas.getContext();
    const cx = W / 2;
    const OUTLINE = '#0A0808';

    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.beginPath();
    c.ellipse(cx, H - 2, 10, 3, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = palette.pants;
    c.fillRect(cx - 5, 22, 4, 6);
    c.fillRect(cx + 1, 22, 4, 6);

    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(cx - 5, 22, 1, 6);
    c.fillRect(cx + 1, 22, 1, 6);

    c.fillStyle = '#1A0F08';
    c.fillRect(cx - 5, 27, 4, 2);
    c.fillRect(cx + 1, 27, 4, 2);

    c.fillStyle = '#3A2515';
    c.fillRect(cx - 5, 27, 4, 1);
    c.fillRect(cx + 1, 27, 4, 1);

    c.fillStyle = palette.shirt;
    c.fillRect(cx - 7, 12, 14, 11);

    c.fillStyle = palette.shirtShade;
    c.fillRect(cx + 3, 12, 4, 11);

    c.fillStyle = this.lighten(palette.shirt, 20);
    c.fillRect(cx - 7, 12, 1, 11);

    c.strokeStyle = OUTLINE;
    c.lineWidth = 1;
    c.strokeRect(cx - 7, 12, 14, 11);

    c.fillStyle = palette.shirt;
    c.fillRect(cx - 8, 13, 2, 8);
    c.fillRect(cx + 6, 13, 2, 8);
    c.strokeStyle = OUTLINE;
    c.strokeRect(cx - 8, 13, 2, 8);
    c.strokeRect(cx + 6, 13, 2, 8);

    c.fillStyle = palette.skin;
    c.fillRect(cx - 8, 20, 2, 2);
    c.fillRect(cx + 6, 20, 2, 2);

    c.fillStyle = palette.skinShade;
    c.fillRect(cx - 2, 11, 4, 2);

    c.fillStyle = palette.skin;
    c.beginPath();
    c.arc(cx, 8, 5, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = palette.skinShade;
    c.beginPath();
    c.arc(cx, 8, 5, -Math.PI / 2, Math.PI / 2);
    c.fill();
    c.strokeStyle = OUTLINE;
    c.beginPath();
    c.arc(cx, 8, 5, 0, Math.PI * 2);
    c.stroke();

    this.drawHair(c, archetype, cx, palette);

    c.fillStyle = OUTLINE;
    c.fillRect(cx - 2, 7, 1, 2);
    c.fillRect(cx + 1, 7, 1, 2);

    c.fillStyle = '#FFFFFF';
    c.fillRect(cx - 2, 7, 1, 1);
    c.fillRect(cx + 1, 7, 1, 1);

    this.drawMouth(c, archetype, cx);

    this.drawAccessory(c, archetype, cx, palette);

    canvas.refresh();
  }

  private static drawHair(c: CanvasRenderingContext2D, a: NpcArchetype, cx: number, p: NpcPalette) {
    c.fillStyle = p.hair;
    switch (a) {
      case 'scammer_gold':

        c.beginPath();
        c.arc(cx, 6, 5, Math.PI, 0);
        c.fill();
        c.fillRect(cx - 5, 4, 10, 3);

        c.fillStyle = p.hairShade;
        c.fillRect(cx, 4, 4, 2);
        c.fillStyle = '#4A3A20';
        c.fillRect(cx - 4, 3, 2, 1);
        break;
      case 'scammer_mlm':

        c.beginPath();
        c.arc(cx - 1, 5, 7, Math.PI, 0);
        c.fill();
        c.fillStyle = p.hairShade;
        c.fillRect(cx + 1, 4, 5, 3);

        c.fillStyle = p.accent;
        c.fillRect(cx - 7, 4, 2, 2);
        c.fillRect(cx - 8, 3, 1, 4);
        break;
      case 'scammer_preipo':

        c.fillStyle = '#8B1A8B';
        c.fillRect(cx - 5, 3, 10, 5);
        c.fillStyle = '#B54ABB';
        c.fillRect(cx - 5, 3, 10, 2);
        c.fillStyle = '#1A1A1A';
        c.fillRect(cx - 5, 7, 10, 1);

        c.fillStyle = '#F4C542';
        c.fillRect(cx - 1, 1, 2, 2);
        break;
      case 'mentor':

        c.beginPath();
        c.arc(cx, 6, 5, Math.PI, 0);
        c.fill();
        c.fillStyle = p.hairShade;
        c.fillRect(cx - 4, 5, 3, 2);
        c.fillRect(cx + 1, 4, 4, 2);
        break;
      case 'station_master':

        c.fillStyle = '#1A2030';
        c.fillRect(cx - 6, 1, 12, 4);
        c.fillStyle = '#0E1A2A';
        c.fillRect(cx - 7, 4, 14, 2);

        c.fillStyle = '#F4C542';
        c.fillRect(cx - 1, 2, 2, 2);

        c.fillStyle = '#050608';
        c.fillRect(cx - 6, 5, 12, 1);
        break;
      case 'neighbor':

        c.fillStyle = p.hair;
        c.fillRect(cx - 5, 5, 10, 2);
        c.fillStyle = p.hairShade;
        c.fillRect(cx - 4, 4, 8, 1);
        break;
      case 'mom':

        c.beginPath();
        c.arc(cx, 7, 5, Math.PI, 0);
        c.fill();
        c.fillStyle = p.hairShade;
        c.fillRect(cx - 4, 6, 3, 2);

        c.fillStyle = p.hair;
        c.beginPath();
        c.arc(cx, 3, 3, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = p.hairShade;
        c.fillRect(cx + 1, 2, 2, 2);

        c.fillStyle = '#F4C542';
        c.fillRect(cx + 4, 9, 1, 2);
        break;
    }
  }

  private static drawMouth(c: CanvasRenderingContext2D, a: NpcArchetype, cx: number) {
    c.fillStyle = '#3A1A20';
    if (a === 'scammer_gold' || a === 'scammer_mlm' || a === 'scammer_preipo') {

      c.fillRect(cx - 1, 10, 3, 1);
      c.fillRect(cx + 2, 9, 1, 1);
    } else if (a === 'mom') {

      c.fillRect(cx - 2, 10, 4, 1);
      c.fillStyle = '#C47080';
      c.fillRect(cx - 2, 10, 4, 1);
    } else if (a === 'mentor') {

      c.fillRect(cx - 2, 10, 4, 1);
    } else {

      c.fillRect(cx - 1, 10, 3, 1);
    }
  }

  private static drawAccessory(c: CanvasRenderingContext2D, a: NpcArchetype, cx: number, p: NpcPalette) {
    switch (a) {
      case 'scammer_gold':

        c.fillStyle = p.accent;
        c.fillRect(cx - 4, 14, 2, 1);
        c.fillRect(cx - 1, 15, 2, 1);
        c.fillRect(cx + 2, 14, 2, 1);

        c.fillStyle = p.accent;
        c.fillRect(cx + 7, 19, 2, 2);
        c.strokeStyle = '#8A6A20';
        c.strokeRect(cx + 7, 19, 2, 2);

        c.fillStyle = '#0A0A0A';
        c.fillRect(cx - 3, 7, 3, 2);
        c.fillRect(cx + 1, 7, 3, 2);
        c.fillStyle = '#3A3A3A';
        c.fillRect(cx, 7, 1, 2);

        c.fillStyle = p.accent;
        c.fillRect(cx + 1, 10, 1, 1);
        break;
      case 'scammer_mlm':

        c.fillStyle = p.accent;
        c.fillRect(cx - 7, 12, 14, 1);

        c.fillStyle = '#F4F1EA';
        c.fillRect(cx + 7, 15, 4, 7);
        c.strokeStyle = '#3A2515';
        c.strokeRect(cx + 7, 15, 4, 7);
        c.fillStyle = '#1A1A1A';
        c.fillRect(cx + 8, 16, 2, 1);
        c.fillRect(cx + 8, 18, 2, 1);
        c.fillRect(cx + 8, 20, 2, 1);

        c.fillStyle = p.accent;
        c.fillRect(cx - 5, 10, 1, 2);
        c.fillRect(cx + 4, 10, 1, 2);
        break;
      case 'scammer_preipo':

        c.fillStyle = '#0A0A0A';
        c.strokeStyle = '#0A0A0A';
        c.lineWidth = 1;
        c.strokeRect(cx - 4, 7, 3, 2);
        c.strokeRect(cx, 7, 3, 2);
        c.fillRect(cx - 1, 8, 1, 1);

        c.fillStyle = p.accent;
        c.fillRect(cx - 5, 14, 3, 3);
        c.fillStyle = '#0A0A0A';
        c.fillRect(cx - 4, 15, 1, 1);
        break;
      case 'mentor':

        c.strokeStyle = '#0A0A0A';
        c.lineWidth = 1;
        c.strokeRect(cx - 4, 7, 3, 2);
        c.strokeRect(cx, 7, 3, 2);

        c.fillStyle = p.accent;
        c.fillRect(cx - 2, 12, 4, 2);
        c.fillRect(cx - 3, 11, 1, 3);
        c.fillRect(cx + 2, 11, 1, 3);

        c.fillStyle = '#4A2A12';
        c.fillRect(cx + 7, 17, 4, 4);
        c.strokeStyle = '#1A0F08';
        c.strokeRect(cx + 7, 17, 4, 4);
        c.fillStyle = p.accent;
        c.fillRect(cx + 8, 18, 2, 1);
        break;
      case 'station_master':

        c.fillStyle = p.accent;
        c.fillRect(cx, 14, 1, 1);
        c.fillRect(cx, 17, 1, 1);
        c.fillRect(cx, 20, 1, 1);

        c.fillStyle = '#8A8A8A';
        c.fillRect(cx - 4, 14, 2, 1);
        c.fillRect(cx - 4, 15, 1, 2);

        c.fillStyle = '#0A0808';
        c.fillRect(cx - 3, 10, 6, 1);
        break;
      case 'neighbor':

        c.fillStyle = '#3F2818';
        c.fillRect(cx - 2, 10, 5, 1);

        c.fillStyle = p.accent;
        c.fillRect(cx + 3, 15, 3, 3);
        c.strokeStyle = '#1A1A1A';
        c.strokeRect(cx + 3, 15, 3, 3);
        break;
      case 'mom':

        c.fillStyle = p.accent;
        c.fillRect(cx - 5, 15, 10, 7);
        c.strokeStyle = '#8A3058';
        c.strokeRect(cx - 5, 15, 10, 7);

        c.fillStyle = '#C47080';
        c.fillRect(cx - 2, 18, 4, 3);

        c.fillStyle = '#F4C542';
        c.fillRect(cx - 1, 12, 2, 1);

        c.fillStyle = '#8A6A20';
        c.fillRect(cx + 7, 17, 1, 5);
        c.fillStyle = '#C8B090';
        c.fillRect(cx + 6, 15, 3, 2);
        break;
    }
  }

  private static lighten(hex: string, amt: number): string {
    const h = hex.replace('#', '');
    const r = Math.min(255, parseInt(h.slice(0, 2), 16) + amt);
    const gg = Math.min(255, parseInt(h.slice(2, 4), 16) + amt);
    const b = Math.min(255, parseInt(h.slice(4, 6), 16) + amt);
    return `rgb(${r},${gg},${b})`;
  }

  showIndicator(): void {
    if (this.indicator) return;
    const x = this.x;
    const y = this.y - 40;

    this.indicatorBg = this.scene.add.graphics();
    this.indicatorBg.fillStyle(0xF4C542, 1);
    this.indicatorBg.fillCircle(x, y, 12);
    this.indicatorBg.lineStyle(2, 0x1A1A1A);
    this.indicatorBg.strokeCircle(x, y, 12);
    this.indicatorBg.setDepth(20);

    this.indicator = this.scene.add.text(x, y, 'E', {
      fontFamily: 'Courier New',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#1A1A1A',
    }).setOrigin(0.5).setDepth(21);

    this.scene.tweens.add({
      targets: [this.indicator, this.indicatorBg],
      y: '-=4',
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  hideIndicator(): void {
    if (this.indicator) {
      this.indicator.destroy();
      this.indicator = undefined;
    }
    if (this.indicatorBg) {
      this.indicatorBg.destroy();
      this.indicatorBg = undefined;
    }
  }
}
