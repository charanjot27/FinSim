import Phaser from 'phaser';

export type BuildingType =
  | 'house'
  | 'brokerage'
  | 'bank'
  | 'chai'
  | 'train_station'
  | 'casino'
  | 'time_machine'
  | 'crypto'
  | 'quant'
  | 'forex';

export interface BuildingConfig {
  id: string;
  type: BuildingType;
  width: number;
  height: number;
  label: string;
  onEnter?: () => void;
}

export class Building extends Phaser.GameObjects.Container {
  public buildingId: string;
  public buildingType: BuildingType;
  public onEnter?: () => void;
  private indicator?: Phaser.GameObjects.Text;
  private indicatorBg?: Phaser.GameObjects.Graphics;
  private animLayer?: Phaser.GameObjects.Graphics;
  private animTween?: Phaser.Tweens.Tween;
  private animTime = 0;
  private animEvent?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, config: BuildingConfig) {
    super(scene, x, y);
    this.buildingId = config.id;
    this.buildingType = config.type;
    this.onEnter = config.onEnter;

    const shadow = scene.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillEllipse(0, config.height / 2 + 2, config.width * 1.1, 14);
    this.add(shadow);

    if (scene.textures.exists(config.type)) {
      const sprite = scene.add.sprite(0, 0, config.type);

      const scale = Math.min(config.width / sprite.width, config.height / sprite.height) * 2;
      sprite.setScale(scale);

      sprite.setOrigin(0.5, 0.7);
      this.add(sprite);
    } else {
      const graphics = scene.add.graphics();
      this.drawBuilding(graphics, config.type, config.width, config.height);
      this.add(graphics);
    }

    this.animLayer = scene.add.graphics();
    this.add(this.animLayer);
    this.startAnimations(config.type, config.width, config.height);

    const label = scene.add.text(0, -config.height / 2 - 18, config.label, {
      fontFamily: 'Courier New',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#F4E6C3',
      backgroundColor: 'rgba(26, 43, 66, 0.92)',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
    label.setStroke('#0E1A2A', 2);
    this.add(label);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(config.width, config.height * 0.7);
    body.setOffset(-config.width / 2, -config.height / 2 + config.height * 0.3);
    body.setImmovable(true);
    body.allowGravity = false;
    this.setSize(config.width, config.height);
    this.setDepth(5);

    this.once('destroy', () => {
      this.animEvent?.remove(false);
      this.animTween?.stop();
    });
  }

  private drawBuilding(g: Phaser.GameObjects.Graphics, type: BuildingType, w: number, h: number) {
    switch (type) {
      case 'house':         this.drawHouse(g, w, h); break;
      case 'brokerage':     this.drawBrokerage(g, w, h); break;
      case 'bank':          this.drawBank(g, w, h); break;
      case 'chai':          this.drawChaiStall(g, w, h); break;
      case 'train_station': this.drawTrainStation(g, w, h); break;
      case 'casino':        this.drawCasino(g, w, h); break;
      case 'time_machine':  this.drawTimeMachine(g, w, h); break;
      case 'crypto':        this.drawCrypto(g, w, h); break;
      case 'quant':         this.drawQuant(g, w, h); break;
      case 'forex':         this.drawForex(g, w, h); break;
    }
  }

  private drawHouse(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    const hw = w / 2, hh = h / 2;
    const wallTop = -hh + h * 0.35;
    const wallBot = hh;

    g.fillStyle(0x4A3A28);
    g.fillRect(-hw - 2, wallBot - 6, w + 4, 8);

    g.fillStyle(0xB85A3E);
    g.fillRect(-hw, wallTop, w, wallBot - wallTop);

    g.lineStyle(1, 0x6A2A18, 0.5);
    for (let by = wallTop + 6; by < wallBot; by += 6) {
      g.lineBetween(-hw, by, hw, by);
      const offset = ((by - wallTop) / 6) % 2 === 0 ? 0 : 8;
      for (let bx = -hw + offset; bx < hw; bx += 16) {
        g.lineBetween(bx, by, bx, by + 6);
      }
    }
    g.lineStyle(2, 0x3A1A0A);
    g.strokeRect(-hw, wallTop, w, wallBot - wallTop);

    g.fillStyle(0x8A2A1A);
    g.fillTriangle(-hw - 6, wallTop + 2, hw + 6, wallTop + 2, 0, -hh);

    g.lineStyle(1, 0x4A1208, 0.6);
    for (let rr = 0; rr < 5; rr++) {
      const y = -hh + (rr + 1) * (h * 0.35 / 5);
      const spread = ((y - (-hh)) / (wallTop - (-hh))) * (hw + 6);
      g.lineBetween(-spread, y, spread, y);
    }
    g.lineStyle(2, 0x2A0A04);
    g.strokeTriangle(-hw - 6, wallTop + 2, hw + 6, wallTop + 2, 0, -hh);

    g.fillStyle(0x6A3A28);
    g.fillRect(hw - 18, -hh + 6, 10, 20);
    g.lineStyle(2, 0x2A1208);
    g.strokeRect(hw - 18, -hh + 6, 10, 20);
    g.fillStyle(0x3A1A0A);
    g.fillRect(hw - 20, -hh + 4, 14, 4);

    const doorW = 18, doorH = h * 0.28;
    g.fillStyle(0x4A2A12);
    g.fillRect(-doorW / 2, wallBot - doorH, doorW, doorH);
    g.lineStyle(1, 0x1A0A04);
    g.strokeRect(-doorW / 2, wallBot - doorH, doorW, doorH);

    g.lineBetween(-3, wallBot - doorH + 2, -3, wallBot - 2);
    g.lineBetween(3, wallBot - doorH + 2, 3, wallBot - 2);

    g.fillStyle(0xF4C542);
    g.fillCircle(5, wallBot - doorH / 2, 1.5);

    g.fillStyle(0x3A3A3A);
    g.fillRect(-doorW / 2 - 3, wallBot, doorW + 6, 3);

    this.drawWindow(g, -hw + 16, wallTop + h * 0.15, 14, 14);
    this.drawWindow(g, hw - 30, wallTop + h * 0.15, 14, 14);

    g.fillStyle(0x3A2515);
    g.fillRect(-hw + 8, wallBot - 12, 16, 4);
    g.fillStyle(0xE04A6B); g.fillCircle(-hw + 12, wallBot - 14, 2);
    g.fillStyle(0xF4C542); g.fillCircle(-hw + 16, wallBot - 14, 2);
    g.fillStyle(0xB85ADB); g.fillCircle(-hw + 20, wallBot - 14, 2);
  }

  private drawWindow(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {

    g.fillStyle(0x2A6B48);
    g.fillRect(x - 4, y, 3, h);
    g.fillRect(x + w + 1, y, 3, h);

    g.fillStyle(0xFFE08A);
    g.fillRect(x, y, w, h);

    g.lineStyle(1, 0x2A1208);
    g.lineBetween(x + w / 2, y, x + w / 2, y + h);
    g.lineBetween(x, y + h / 2, x + w, y + h / 2);
    g.strokeRect(x, y, w, h);

    g.fillStyle(0x3A2515);
    g.fillRect(x - 2, y + h, w + 4, 2);
  }

  private drawBrokerage(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    const hw = w / 2, hh = h / 2;

    g.fillStyle(0xC8C1B0);
    g.fillRect(-hw - 8, hh - 10, w + 16, 10);
    g.fillStyle(0xA89E8A);
    g.fillRect(-hw - 12, hh - 4, w + 24, 4);
    g.lineStyle(1, 0x6A5A48);
    g.lineBetween(-hw - 8, hh - 10, hw + 8, hh - 10);
    g.lineBetween(-hw - 12, hh - 4, hw + 12, hh - 4);

    const pedBaseY = -hh + h * 0.18;
    g.fillStyle(0xE8DFC8);
    g.fillTriangle(-hw - 6, pedBaseY, hw + 6, pedBaseY, 0, -hh);
    g.lineStyle(2, 0x4A4030);
    g.strokeTriangle(-hw - 6, pedBaseY, hw + 6, pedBaseY, 0, -hh);

    g.fillStyle(0xF4C542);
    g.fillRect(-hw + 8, -hh + h * 0.05, w - 16, 10);
    g.lineStyle(1, 0x8A6A20);
    g.strokeRect(-hw + 8, -hh + h * 0.05, w - 16, 10);

    for (let s = 0; s < 3; s++) {
      const sx = -hw + 20 + (s * (w - 40)) / 2;
      this.drawStar(g, sx, -hh + h * 0.05 + 5, 3, 0x8A6A20);
    }

    g.fillStyle(0xC8C1B0);
    g.fillRect(-hw - 4, pedBaseY, w + 8, 8);
    g.lineStyle(1, 0x6A5A48);
    g.strokeRect(-hw - 4, pedBaseY, w + 8, 8);

    const colCount = 5;
    const colTop = pedBaseY + 8;
    const colBot = hh - 10;
    const colH = colBot - colTop;
    const colW = 10;
    for (let i = 0; i < colCount; i++) {
      const cx = -hw + 12 + (i * (w - 24)) / (colCount - 1);

      g.fillStyle(0xD8D0BA);
      g.fillRect(cx - colW / 2 - 2, colBot - 4, colW + 4, 4);

      g.fillStyle(0xEFE5CE);
      g.fillRect(cx - colW / 2, colTop + 4, colW, colH - 8);

      g.lineStyle(1, 0xB8B0A0, 0.8);
      g.lineBetween(cx - 2, colTop + 6, cx - 2, colBot - 6);
      g.lineBetween(cx + 2, colTop + 6, cx + 2, colBot - 6);

      g.fillStyle(0xD8D0BA);
      g.fillRect(cx - colW / 2 - 2, colTop, colW + 4, 4);
    }

    g.fillStyle(0x1A2B42);
    g.fillRect(-hw + 4, colTop + 6, w - 8, colH - 10);

    const doorW = 26, doorH = 32;
    g.fillStyle(0x0E1A2A);
    g.fillRect(-doorW / 2, colBot - doorH, doorW, doorH);

    g.fillStyle(0xF4C542);
    g.fillRect(-doorW / 2 - 2, colBot - doorH - 3, doorW + 4, 3);

    g.fillStyle(0xF4C542);
    g.fillCircle(0, colBot - doorH / 2, 1.5);

    const flagX = hw - 8, flagY = -hh - 4;
    g.fillStyle(0x3A2515);
    g.lineStyle(1, 0x1A0F08);
    g.fillRect(flagX, flagY, 1, 20);
    g.fillStyle(0xC44536);
    g.fillRect(flagX + 1, flagY, 10, 4);
    g.fillStyle(0xF4F1EA);
    g.fillRect(flagX + 1, flagY + 4, 10, 2);
    g.fillStyle(0x1F3A5F);
    g.fillRect(flagX + 1, flagY - 1, 4, 3);
  }

  private drawStar(g: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number) {
    g.fillStyle(color);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size : size / 2;
      const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
  }

  private drawBank(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    const hw = w / 2, hh = h / 2;
    const wallTop = -hh + h * 0.35;
    const wallBot = hh;

    g.fillStyle(0xA89E8A);
    g.fillRect(-hw - 4, wallBot - 8, w + 8, 8);

    g.fillStyle(0xD9CFB4);
    g.fillRect(-hw, wallTop, w, wallBot - wallTop - 8);

    g.lineStyle(1, 0x8A7A5A, 0.7);
    for (let sy = wallTop; sy < wallBot - 8; sy += 10) {
      const oy = ((sy - wallTop) / 10) % 2 === 0 ? 0 : 12;
      g.lineBetween(-hw, sy, hw, sy);
      for (let sx = -hw + oy; sx < hw; sx += 24) {
        g.lineBetween(sx, sy, sx, sy + 10);
      }
    }
    g.lineStyle(2, 0x5A4A30);
    g.strokeRect(-hw, wallTop, w, wallBot - wallTop - 8);

    g.fillStyle(0xC8BDA0);
    g.fillRect(-hw - 4, wallTop - 6, w + 8, 8);
    g.lineStyle(2, 0x5A4A30);
    g.strokeRect(-hw - 4, wallTop - 6, w + 8, 8);

    const domeR = hw * 0.55;
    const domeCy = wallTop - 6;
    g.fillStyle(0x3A8A8A);
    g.beginPath();
    g.arc(0, domeCy, domeR, Math.PI, 0);
    g.closePath();
    g.fillPath();

    g.fillStyle(0x5ABABA);
    g.beginPath();
    g.arc(-domeR * 0.3, domeCy, domeR * 0.55, Math.PI, Math.PI * 1.6);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0x1A4A4A);
    g.beginPath();
    g.arc(0, domeCy, domeR, Math.PI, 0);
    g.closePath();
    g.strokePath();

    g.fillStyle(0xF4C542);
    g.fillRect(-1, domeCy - domeR - 10, 2, 10);
    g.fillCircle(0, domeCy - domeR - 11, 3);

    for (let i = 0; i < 4; i++) {
      const cx = -hw + 14 + (i * (w - 28)) / 3;
      g.fillStyle(0xF0E5CE);
      g.fillRect(cx - 2, wallTop + 4, 4, wallBot - wallTop - 12);
      g.fillStyle(0xC8BDA0);
      g.fillRect(cx - 3, wallTop + 2, 6, 3);
      g.fillRect(cx - 3, wallBot - 11, 6, 3);
    }

    g.fillStyle(0xF4C542);
    g.fillCircle(0, wallTop + h * 0.2, 12);
    g.lineStyle(2, 0x8A6A20);
    g.strokeCircle(0, wallTop + h * 0.2, 12);

    g.fillStyle(0x1A1A1A);
    g.fillRect(-1, wallTop + h * 0.2 - 7, 2, 14);
    g.fillRect(-5, wallTop + h * 0.2 - 4, 10, 2);
    g.fillRect(-5, wallTop + h * 0.2 + 2, 10, 2);

    g.lineStyle(1, 0x2A6B48);
    for (let la = 0; la < 5; la++) {
      const ang = Math.PI + (la * 0.2);
      g.fillStyle(0x2A6B48);
      g.fillCircle(-14 - Math.cos(ang) * 2, wallTop + h * 0.2 + Math.sin(ang) * 2, 1.5);
      g.fillCircle(14 + Math.cos(ang) * 2, wallTop + h * 0.2 + Math.sin(ang) * 2, 1.5);
    }

    this.drawBarredWindow(g, -hw + 12, wallTop + h * 0.4, 16, 20);
    this.drawBarredWindow(g, hw - 28, wallTop + h * 0.4, 16, 20);

    const doorW = 22, doorH = h * 0.28;
    g.fillStyle(0x2A1808);
    g.fillRect(-doorW / 2, wallBot - doorH - 8, doorW, doorH);

    g.beginPath();
    g.arc(0, wallBot - doorH - 8, doorW / 2, Math.PI, 0);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xF4C542);
    g.fillCircle(4, wallBot - doorH / 2 - 8, 1.5);
    g.lineStyle(1, 0x8A6A20);
    g.lineBetween(0, wallBot - doorH - 8, 0, wallBot - 8);
  }

  private drawBarredWindow(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {

    g.fillStyle(0x3A2A18);
    g.fillRect(x - 2, y, w + 4, h);

    g.fillStyle(0x8AA8C8);
    g.fillRect(x, y + 2, w, h - 4);

    g.lineStyle(1, 0x1A1A1A);
    for (let bx = x + 4; bx < x + w; bx += 4) {
      g.lineBetween(bx, y + 2, bx, y + h - 2);
    }

    g.lineStyle(1, 0x1A0F08);
    g.strokeRect(x - 2, y, w + 4, h);
  }

  private drawChaiStall(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    const hw = w / 2, hh = h / 2;
    const stallTop = -hh + h * 0.5;

    g.fillStyle(0x5A3A18);
    g.fillRect(-hw, stallTop - 4, 5, hh - stallTop + 5);
    g.fillRect(hw - 5, stallTop - 4, 5, hh - stallTop + 5);
    g.lineStyle(1, 0x2A1208);
    g.strokeRect(-hw, stallTop - 4, 5, hh - stallTop + 5);
    g.strokeRect(hw - 5, stallTop - 4, 5, hh - stallTop + 5);

    g.fillStyle(0xE89048);
    g.fillRect(-hw + 5, stallTop, w - 10, hh - stallTop);

    g.lineStyle(1, 0x8A4A18, 0.6);
    for (let cx = -hw + 12; cx < hw - 5; cx += 10) {
      g.lineBetween(cx, stallTop, cx, hh);
    }
    g.lineStyle(2, 0x6A2A0A);
    g.strokeRect(-hw + 5, stallTop, w - 10, hh - stallTop);

    const awningH = h * 0.3;
    const stripes = 6;
    const sw = (w + 8) / stripes;
    for (let i = 0; i < stripes; i++) {
      g.fillStyle(i % 2 === 0 ? 0xC44536 : 0xF4F1EA);
      g.fillTriangle(
        -hw - 4 + i * sw, stallTop,
        -hw - 4 + (i + 1) * sw, stallTop,
        -hw - 4 + i * sw + sw / 2, stallTop - awningH
      );
    }

    g.lineStyle(2, 0x6A1A10);
    for (let i = 0; i < stripes; i++) {
      const ax = -hw - 4 + i * sw;
      g.lineBetween(ax, stallTop, ax + sw / 2, stallTop - awningH);
      g.lineBetween(ax + sw / 2, stallTop - awningH, ax + sw, stallTop);
    }

    g.fillStyle(0xF4E6C3);
    g.fillRect(-22, stallTop + 6, 44, 14);
    g.lineStyle(2, 0x6A2A0A);
    g.strokeRect(-22, stallTop + 6, 44, 14);

    this.drawPixelText(g, 'CHAI', -16, stallTop + 9, 0x6A2A0A);

    const kettleY = hh - 10;
    g.fillStyle(0x8A8A8A);
    g.fillCircle(-hw + 18, kettleY, 6);
    g.fillRect(-hw + 12, kettleY - 2, 12, 4);
    g.fillStyle(0x3A3A3A);
    g.fillRect(-hw + 16, kettleY - 8, 4, 2);
    g.fillRect(-hw + 22, kettleY - 4, 4, 2);

    for (let tc = 0; tc < 3; tc++) {
      const cx = 4 + tc * 10;
      g.fillStyle(0xF4F1EA);
      g.fillRect(cx, kettleY - 3, 5, 6);
      g.fillStyle(0x6A3A18);
      g.fillRect(cx + 1, kettleY - 2, 3, 2);
      g.lineStyle(1, 0x3A2515);
      g.strokeRect(cx, kettleY - 3, 5, 6);
    }

    for (let f = 0; f < 5; f++) {
      const fx = -hw + 10 + f * ((w - 20) / 4);
      const colors = [0xC44536, 0xF4C542, 0x4A9B5E, 0x3A8AC8, 0xB85ADB];
      g.fillStyle(colors[f]);
      g.fillTriangle(fx, -hh + 4, fx + 6, -hh + 4, fx + 3, -hh + 10);
    }
  }

  private drawPixelText(g: Phaser.GameObjects.Graphics, text: string, x: number, y: number, color: number) {
    const font: Record<string, string[]> = {
      C: ['111','100','100','100','111'],
      H: ['101','101','111','101','101'],
      A: ['111','101','111','101','101'],
      I: ['111','010','010','010','111'],
    };
    g.fillStyle(color);
    let cx = x;
    for (const ch of text) {
      const glyph = font[ch];
      if (!glyph) { cx += 4; continue; }
      for (let gy = 0; gy < 5; gy++) {
        for (let gx = 0; gx < 3; gx++) {
          if (glyph[gy][gx] === '1') g.fillRect(cx + gx, y + gy, 1, 1);
        }
      }
      cx += 4;
    }
  }

  private drawTrainStation(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    const hw = w / 2, hh = h / 2;
    const wallTop = -hh + h * 0.25;

    g.fillStyle(0x6A7080);
    g.fillRect(-hw, wallTop, w, hh - wallTop);

    g.lineStyle(1, 0x3A4050, 0.7);
    for (let sy = wallTop + 8; sy < hh; sy += 8) {
      g.lineBetween(-hw, sy, hw, sy);
    }
    for (let sx = -hw + 14; sx < hw; sx += 14) {
      g.lineBetween(sx, wallTop, sx, hh);
    }
    g.lineStyle(2, 0x1A2030);
    g.strokeRect(-hw, wallTop, w, hh - wallTop);

    g.fillStyle(0x3A2030);
    g.fillTriangle(-hw - 8, wallTop, hw + 8, wallTop, 0, -hh);

    g.lineStyle(1, 0x1A0F15, 0.7);
    for (let rr = 0; rr < 4; rr++) {
      const ry = -hh + (rr + 1) * ((wallTop - (-hh)) / 4);
      const spread = ((ry - (-hh)) / (wallTop - (-hh))) * (hw + 8);
      g.lineBetween(-spread, ry, spread, ry);
    }
    g.lineStyle(2, 0x0A0408);
    g.strokeTriangle(-hw - 8, wallTop, hw + 8, wallTop, 0, -hh);

    const clockR = 14;
    g.fillStyle(0xE8D8B0);
    g.fillCircle(0, wallTop + h * 0.22, clockR);
    g.lineStyle(2, 0x1A1A1A);
    g.strokeCircle(0, wallTop + h * 0.22, clockR);

    g.lineStyle(1, 0x1A1A1A);
    for (let tt = 0; tt < 12; tt++) {
      const a = (tt / 12) * Math.PI * 2 - Math.PI / 2;
      g.lineBetween(
        Math.cos(a) * (clockR - 3), wallTop + h * 0.22 + Math.sin(a) * (clockR - 3),
        Math.cos(a) * (clockR - 1), wallTop + h * 0.22 + Math.sin(a) * (clockR - 1)
      );
    }

    g.lineStyle(2, 0x1A1A1A);
    g.lineBetween(0, wallTop + h * 0.22, -7, wallTop + h * 0.22 - 2);
    g.lineBetween(0, wallTop + h * 0.22, 5, wallTop + h * 0.22 - 7);
    g.fillStyle(0xC44536);
    g.fillCircle(0, wallTop + h * 0.22, 2);

    const archW = 32, archH = h * 0.4;
    g.fillStyle(0x1A1A2A);
    g.fillRect(-archW / 2, hh - archH, archW, archH);
    g.beginPath();
    g.arc(0, hh - archH, archW / 2, Math.PI, 0);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xF4C542);
    g.fillRect(-4, hh - archH - archW / 2 - 3, 8, 4);

    this.drawLantern(g, -archW / 2 - 8, hh - archH + 8);
    this.drawLantern(g, archW / 2 + 8, hh - archH + 8);

    g.fillStyle(0x4A4A50);
    g.fillRect(-hw - 6, hh, w + 12, 4);

    g.fillStyle(0xC44536);
    g.fillRect(-hw + 8, wallTop + 6, w - 16, 12);
    g.lineStyle(1, 0xF4C542);
    g.strokeRect(-hw + 8, wallTop + 6, w - 16, 12);
  }

  private drawLantern(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x1A1A1A);
    g.fillRect(x - 4, y, 8, 10);
    g.fillStyle(0xFFD560);
    g.fillRect(x - 2, y + 2, 4, 6);
    g.fillStyle(0x1A1A1A);
    g.fillRect(x - 5, y - 2, 10, 2);
    g.fillRect(x - 1, y - 6, 2, 4);
  }

  private drawCasino(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    const hw = w / 2, hh = h / 2;
    const wallTop = -hh + h * 0.22;

    g.fillStyle(0x3A0F2A);
    g.fillRect(-hw, wallTop, w, hh - wallTop);
    g.lineStyle(2, 0x1A0408);
    g.strokeRect(-hw, wallTop, w, hh - wallTop);

    g.fillStyle(0xF4C542);
    g.fillRect(-hw - 4, wallTop - 6, w + 8, 10);
    g.fillStyle(0xC48A20);
    g.fillRect(-hw - 4, wallTop + 4, w + 8, 2);
    g.lineStyle(2, 0x6A4010);
    g.strokeRect(-hw - 4, wallTop - 6, w + 8, 10);

    for (let i = 0; i < 10; i++) {
      const bx = -hw + 8 + i * ((w - 16) / 9);
      g.fillStyle(i % 2 === 0 ? 0xFF6FCF : 0x00E8E8);
      g.fillCircle(bx, wallTop - 1, 2);
    }

    g.fillStyle(0x1A0408);
    g.fillRect(-hw + 12, wallTop + 10, w - 24, 18);
    g.lineStyle(2, 0xFF6FCF);
    g.strokeRect(-hw + 12, wallTop + 10, w - 24, 18);

    g.fillStyle(0xFF6FCF);
    const letters = 'CASINO';
    const lw = (w - 28) / letters.length;
    for (let i = 0; i < letters.length; i++) {
      const lx = -hw + 14 + i * lw;
      g.fillRect(lx, wallTop + 14, lw - 2, 10);
    }

    const doorW = 34, doorH = h * 0.35;
    g.fillStyle(0x6A0A1A);
    g.fillRect(-doorW / 2, hh - doorH, doorW, doorH);
    g.lineStyle(2, 0xF4C542);
    g.strokeRect(-doorW / 2, hh - doorH, doorW, doorH);
    g.lineBetween(0, hh - doorH, 0, hh);

    g.fillStyle(0xF4C542);
    g.fillCircle(-4, hh - doorH / 2, 1.5);
    g.fillCircle(4, hh - doorH / 2, 1.5);

    g.fillStyle(0x1A0408);
    g.fillRect(-hw + 10, hh - doorH - 18, 24, 22);
    g.lineStyle(1, 0x00E8E8);
    g.strokeRect(-hw + 10, hh - doorH - 18, 24, 22);

    g.fillStyle(0xF4C542);
    g.fillRect(-hw + 13, hh - doorH - 14, 5, 14);
    g.fillStyle(0xE04A6B);
    g.fillRect(-hw + 20, hh - doorH - 14, 5, 14);
    g.fillStyle(0x4A9B5E);
    g.fillRect(-hw + 27, hh - doorH - 14, 5, 14);

    g.fillStyle(0xCC2244);
    g.fillRect(-hw + 34, hh - doorH - 10, 2, 8);

    g.fillStyle(0xF4F1EA);
    g.fillRect(hw - 26, hh - doorH - 16, 14, 14);
    g.fillRect(hw - 16, hh - doorH - 22, 14, 14);
    g.lineStyle(1, 0x1A1A1A);
    g.strokeRect(hw - 26, hh - doorH - 16, 14, 14);
    g.strokeRect(hw - 16, hh - doorH - 22, 14, 14);
    g.fillStyle(0x1A1A1A);
    g.fillCircle(hw - 22, hh - doorH - 12, 1);
    g.fillCircle(hw - 18, hh - doorH - 8, 1);
    g.fillCircle(hw - 14, hh - doorH - 4, 1);
    g.fillCircle(hw - 12, hh - doorH - 18, 1);
    g.fillCircle(hw - 4, hh - doorH - 18, 1);
    g.fillCircle(hw - 8, hh - doorH - 14, 1);

    const palmX = -hw - 10, palmY = hh - 6;
    g.fillStyle(0x4A2A10);
    g.fillRect(palmX - 1, palmY - 40, 2, 40);
    g.fillStyle(0x2A6B48);
    for (let fr = 0; fr < 6; fr++) {
      const ang = Math.PI + (fr / 5) * Math.PI;
      const fx = palmX + Math.cos(ang) * 12;
      const fy = palmY - 40 + Math.sin(ang) * 6;
      g.fillTriangle(palmX, palmY - 40, fx, fy, fx + 2, fy + 2);
    }
  }

  private drawTimeMachine(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    const hw = w / 2, hh = h / 2;

    g.fillStyle(0x2A1A3A);
    g.fillRect(-hw, hh - 10, w, 10);
    g.lineStyle(1, 0x0A0008);
    g.strokeRect(-hw, hh - 10, w, 10);

    g.fillStyle(0x3A1F4A);
    g.fillRect(-hw, -hh + h * 0.2, w, hh - 10 - (-hh + h * 0.2));

    g.beginPath();
    g.arc(0, -hh + h * 0.2, hw, Math.PI, 0);
    g.closePath();
    g.fillPath();

    g.lineStyle(3, 0xF4C542);
    g.beginPath();
    g.arc(0, -hh + h * 0.2, hw, Math.PI, 0);
    g.moveTo(-hw, -hh + h * 0.2);
    g.lineTo(-hw, hh - 10);
    g.lineTo(hw, hh - 10);
    g.lineTo(hw, -hh + h * 0.2);
    g.strokePath();

    g.fillStyle(0x0E1020);
    g.fillRect(-hw + 8, -hh + h * 0.25, w - 16, hh - 18 - (-hh + h * 0.25));
    g.beginPath();
    g.arc(0, -hh + h * 0.25, hw - 8, Math.PI, 0);
    g.closePath();
    g.fillPath();

    const runes = ['✦', '✧', '◈', '✺', '✦'];
    for (let r = 0; r < 5; r++) {
      const ang = Math.PI + (r + 1) * (Math.PI / 6);
      const rx = Math.cos(ang) * (hw - 6);
      const ry = -hh + h * 0.2 + Math.sin(ang) * (hw - 6);
      this.drawRune(g, rx, ry, runes[r]);
    }

    g.fillStyle(0x00E8E8);
    g.fillTriangle(-6, -hh + h * 0.2 - 20, 6, -hh + h * 0.2 - 20, 0, -hh + h * 0.2 - 36);
    g.fillStyle(0x88FFFF);
    g.fillTriangle(-3, -hh + h * 0.2 - 22, 3, -hh + h * 0.2 - 22, 0, -hh + h * 0.2 - 32);
  }

  private drawRune(g: Phaser.GameObjects.Graphics, x: number, y: number, _sym: string) {
    g.fillStyle(0xF4C542);
    g.fillRect(x - 2, y - 2, 4, 4);
    g.fillStyle(0xFFE8A0);
    g.fillRect(x - 1, y - 1, 2, 2);
  }

  private drawCrypto(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    const hw = w / 2, hh = h / 2;
    const wallTop = -hh + h * 0.1;

    g.fillStyle(0x0A1228);
    g.fillRect(-hw, wallTop, w, hh - wallTop);
    g.lineStyle(2, 0x00E8E8);
    g.strokeRect(-hw, wallTop, w, hh - wallTop);

    for (let gy = wallTop + 10; gy < hh - 20; gy += 14) {
      for (let gx = -hw + 8; gx < hw - 8; gx += 14) {
        const alt = ((gx + gy) / 14) % 2 === 0;
        g.fillStyle(alt ? 0x00E8E8 : 0xFF6FCF);
        g.fillRect(gx, gy, 8, 8);
        g.fillStyle(0x0A1228);
        g.fillRect(gx + 2, gy + 2, 4, 4);
      }
    }

    g.fillStyle(0xF4A020);
    g.fillCircle(0, wallTop + 16, 12);
    g.fillStyle(0x1A1A1A);
    g.fillRect(-1, wallTop + 8, 2, 16);
    g.fillRect(-5, wallTop + 11, 10, 2);
    g.fillRect(-5, wallTop + 17, 10, 2);
    g.fillRect(-5, wallTop + 21, 10, 2);

    const doorW = 30, doorH = h * 0.3;
    g.fillStyle(0x1A0A30);
    g.fillRect(-doorW / 2, hh - doorH, doorW, doorH);
    g.lineStyle(2, 0xB85ADB);
    g.strokeRect(-doorW / 2, hh - doorH, doorW, doorH);

    g.fillStyle(0xB85ADB);
    g.fillRect(-doorW / 2 + 2, hh - doorH - 3, doorW - 4, 2);
  }

  private drawQuant(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    const hw = w / 2, hh = h / 2;
    const wallTop = -hh + h * 0.05;

    g.fillStyle(0x1A3A5A);
    g.fillRect(-hw, wallTop, w, hh - wallTop);

    for (let gy = wallTop + 4; gy < hh - 16; gy += 8) {
      g.lineStyle(1, 0x4A8ACC, 0.8);
      g.lineBetween(-hw, gy, hw, gy);
    }
    for (let gx = -hw + 8; gx < hw; gx += 10) {
      g.lineStyle(1, 0x4A8ACC, 0.8);
      g.lineBetween(gx, wallTop, gx, hh - 4);
    }

    g.fillStyle(0x88CCFF);
    g.fillRect(-hw + 2, wallTop, 3, hh - wallTop);
    g.lineStyle(2, 0x0E2038);
    g.strokeRect(-hw, wallTop, w, hh - wallTop);

    g.fillStyle(0x4A9B5E);
    for (let b = 0; b < 5; b++) {
      g.fillRect(-hw + 12 + b * 14, hh - 20 - Math.random() * 10, 6, 14);
    }

    g.fillStyle(0xF4C542);
    g.fillRect(-6, wallTop + 10, 12, 2);
    g.fillRect(-6, wallTop + 22, 12, 2);
    g.fillRect(-6, wallTop + 10, 2, 14);

    g.lineStyle(2, 0xF4C542);
    g.lineBetween(-6, wallTop + 10, 4, wallTop + 16);
    g.lineBetween(-6, wallTop + 22, 4, wallTop + 16);

    const doorW = 24, doorH = h * 0.22;
    g.fillStyle(0x0A1A30);
    g.fillRect(-doorW / 2, hh - doorH, doorW, doorH);
    g.lineStyle(2, 0x00E8E8);
    g.strokeRect(-doorW / 2, hh - doorH, doorW, doorH);
  }

  private drawForex(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    const hw = w / 2, hh = h / 2;
    const wallTop = -hh + h * 0.2;

    g.fillStyle(0x2E4E7B);
    g.fillRect(-hw, wallTop, w, hh - wallTop);
    g.lineStyle(2, 0x0E1A2A);
    g.strokeRect(-hw, wallTop, w, hh - wallTop);

    g.fillStyle(0x3A8AC8);
    g.fillCircle(0, wallTop + h * 0.18, 14);
    g.fillStyle(0x2A6B48);
    g.fillCircle(-4, wallTop + h * 0.18 - 2, 4);
    g.fillCircle(3, wallTop + h * 0.18 + 3, 5);
    g.lineStyle(1, 0xF4F1EA, 0.8);
    g.strokeCircle(0, wallTop + h * 0.18, 14);

    g.lineStyle(1, 0xF4F1EA, 0.4);
    g.beginPath();
    g.arc(0, wallTop + h * 0.18, 14, Math.PI * 0.8, Math.PI * 2.2);
    g.strokePath();

    const flagColors = [0xC44536, 0xF4F1EA, 0x1F3A5F, 0xF4C542, 0x4A9B5E, 0xFF6FCF];
    for (let f = 0; f < flagColors.length; f++) {
      g.fillStyle(flagColors[f]);
      g.fillRect(-hw + 8 + f * 12, wallTop - 6, 10, 8);
    }

    g.fillStyle(0xF4E6C3);
    g.fillRect(-hw + 10, hh - h * 0.4, w - 20, h * 0.15);
    g.lineStyle(1, 0x2A2015);
    g.strokeRect(-hw + 10, hh - h * 0.4, w - 20, h * 0.15);
    this.drawPixelText(g, 'FX', -5, hh - h * 0.4 + 3, 0x2A2015);

    const doorW = 22, doorH = h * 0.22;
    g.fillStyle(0x0A1A30);
    g.fillRect(-doorW / 2, hh - doorH, doorW, doorH);
    g.lineStyle(2, 0xF4C542);
    g.strokeRect(-doorW / 2, hh - doorH, doorW, doorH);
  }

  private startAnimations(type: BuildingType, w: number, h: number): void {
    if (!this.animLayer) return;
    const layer = this.animLayer;

    if (type === 'time_machine') {

      this.animEvent = this.scene.time.addEvent({
        delay: 60,
        loop: true,
        callback: () => {
          this.animTime += 0.1;
          layer.clear();
          const cx = 0, cy = -h / 2 + h * 0.4;
          const radius = Math.min(w, h) * 0.28;

          for (let ring = 0; ring < 3; ring++) {
            const rr = radius - ring * 6;
            for (let i = 0; i < 12; i++) {
              const a = this.animTime * (ring + 1) * 0.5 + (i / 12) * Math.PI * 2;
              const px = cx + Math.cos(a) * rr;
              const py = cy + Math.sin(a) * rr * 0.6;
              const c = ring === 0 ? 0xB85ADB : ring === 1 ? 0x00E8E8 : 0xF4C542;
              layer.fillStyle(c, 0.8 - ring * 0.2);
              layer.fillCircle(px, py, 2);
            }
          }

          layer.fillStyle(0xFFE8A0, 0.5 + Math.sin(this.animTime * 2) * 0.2);
          layer.fillCircle(cx, cy, 8);
          layer.fillStyle(0xFFFFFF, 0.8);
          layer.fillCircle(cx, cy, 3);
        }
      });
    } else if (type === 'casino') {

      let on = true;
      this.animEvent = this.scene.time.addEvent({
        delay: 320,
        loop: true,
        callback: () => {
          on = !on;
          layer.clear();
          const wallTop = -h / 2 + h * 0.22;
          for (let i = 0; i < 10; i++) {
            const bx = -w / 2 + 8 + i * ((w - 16) / 9);
            const lit = on ? (i % 2 === 0) : (i % 2 === 1);
            if (lit) {
              layer.fillStyle(i % 2 === 0 ? 0xFFB0E8 : 0x88FFFF, 0.9);
              layer.fillCircle(bx, wallTop - 1, 3);
              layer.fillStyle(0xFFFFFF, 0.8);
              layer.fillCircle(bx, wallTop - 1, 1);
            }
          }

          layer.fillStyle(on ? 0xFF6FCF : 0xB85ADB, 0.25);
          layer.fillRect(-w / 2 + 12, wallTop + 10, w - 24, 18);
        }
      });
    } else if (type === 'chai') {

      const particles: { x: number, y: number, life: number }[] = [];
      this.animEvent = this.scene.time.addEvent({
        delay: 140,
        loop: true,
        callback: () => {
          if (particles.length < 6) {
            particles.push({ x: -w / 2 + 18 + (Math.random() - 0.5) * 4, y: h / 2 - 16, life: 1 });
          }
          layer.clear();
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.y -= 1.5;
            p.x += (Math.random() - 0.5) * 0.8;
            p.life -= 0.06;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            layer.fillStyle(0xF4F1EA, p.life * 0.6);
            layer.fillCircle(p.x, p.y, 2 + (1 - p.life) * 2);
          }
        }
      });
    } else if (type === 'train_station') {

      this.animEvent = this.scene.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
          this.animTime = (this.animTime + 1) % 60;
          layer.clear();
          const ang = (this.animTime / 60) * Math.PI * 2 - Math.PI / 2;
          const cx = 0, cy = -h / 2 + h * 0.25 + h * 0.22 - (h * 0.25);

          const centerY = -h / 2 + h * 0.25 + h * 0.22;
          layer.lineStyle(1, 0xC44536);
          layer.lineBetween(cx, centerY, cx + Math.cos(ang) * 9, centerY + Math.sin(ang) * 9);
        }
      });
    } else if (type === 'crypto') {

      let phase = 0;
      this.animEvent = this.scene.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          phase += 0.2;
          layer.clear();
          const wallTop = -h / 2 + h * 0.1;
          for (let gy = wallTop + 10; gy < h / 2 - 20; gy += 14) {
            for (let gx = -w / 2 + 8; gx < w / 2 - 8; gx += 14) {
              const d = Math.sin(phase - (gx + gy) * 0.05);
              if (d > 0.7) {
                layer.fillStyle(0x00FFFF, (d - 0.7) * 3);
                layer.fillRect(gx + 2, gy + 2, 4, 4);
              }
            }
          }
        }
      });
    } else if (type === 'quant') {

      this.animEvent = this.scene.time.addEvent({
        delay: 180,
        loop: true,
        callback: () => {
          this.animTime += 0.3;
          layer.clear();
          for (let b = 0; b < 5; b++) {
            const barH = 6 + Math.abs(Math.sin(this.animTime + b * 0.7)) * 14;
            layer.fillStyle(0x88FFAA, 0.9);
            layer.fillRect(-w / 2 + 12 + b * 14, h / 2 - 20, 6, -barH);
            layer.fillStyle(0xFFFFFF, 0.5);
            layer.fillRect(-w / 2 + 12 + b * 14, h / 2 - 20 - barH, 6, 1);
          }
        }
      });
    }
  }

  showIndicator(): void {
    if (this.indicator) return;
    this.indicatorBg = this.scene.add.graphics();
    this.indicatorBg.fillStyle(0xF4C542, 1);
    this.indicatorBg.fillCircle(this.x, this.y - this.height / 2 - 30, 12);
    this.indicatorBg.lineStyle(2, 0x1A1A1A);
    this.indicatorBg.strokeCircle(this.x, this.y - this.height / 2 - 30, 12);
    this.indicatorBg.setDepth(20);

    this.indicator = this.scene.add.text(this.x, this.y - this.height / 2 - 30, 'E', {
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
