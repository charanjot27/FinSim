import Phaser from 'phaser';
import { PLAYER_SPEED, TILE_SIZE } from '@/config/constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private facing: 'up' | 'down' | 'left' | 'right' = 'down';
  public movementLocked = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setSize(20, 20);
    this.setOffset(6, 10);
    this.setDepth(10);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = scene.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Player['wasd'];
  }

  static generateTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('player')) return;

    const FRAME_W = 32;
    const FRAME_H = 32;
    const COLS = 4;
    const ROWS = 4;
    const canvas = scene.textures.createCanvas('player', FRAME_W * COLS, FRAME_H * ROWS);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const SKIN = '#F0C090';
    const SKIN_SHADE = '#B8875A';
    const HAIR = '#2A1608';
    const HAIR_SHADE = '#140804';
    const SHIRT = '#3A7BC8';
    const SHIRT_SHADE = '#2050A0';
    const SHIRT_HILITE = '#6AA8E0';
    const PANTS = '#1F2E48';
    const PANTS_SHADE = '#0E1A2A';
    const SHOES = '#2A1810';
    const BELT = '#6A3A18';
    const BUCKLE = '#F4C542';
    const OUTLINE = '#0A0808';

    const directions = ['down', 'left', 'right', 'up'];
    directions.forEach((dir, row) => {
      for (let frame = 0; frame < COLS; frame++) {
        const x = frame * FRAME_W;
        const y = row * FRAME_H;
        drawCharacter(ctx, x, y, FRAME_W, FRAME_H, dir, frame);
      }
    });

    function drawCharacter(
      c: CanvasRenderingContext2D,
      ox: number, oy: number,
      w: number, h: number,
      dir: string, frame: number
    ) {
      c.clearRect(ox, oy, w, h);
      const centerX = ox + w / 2;

      const bob = (frame === 1 || frame === 3) ? 1 : 0;

      c.fillStyle = 'rgba(0,0,0,0.38)';
      c.beginPath();
      c.ellipse(centerX, oy + h - 2, 9, 3, 0, 0, Math.PI * 2);
      c.fill();

      const leftLegX = centerX - 5;
      const rightLegX = centerX + 1;
      c.fillStyle = PANTS;
      if (frame === 1) {
        c.fillRect(leftLegX, oy + 22, 4, 5);
        c.fillRect(rightLegX, oy + 23, 4, 4);
      } else if (frame === 3) {
        c.fillRect(leftLegX, oy + 23, 4, 4);
        c.fillRect(rightLegX, oy + 22, 4, 5);
      } else {
        c.fillRect(leftLegX, oy + 22, 4, 5);
        c.fillRect(rightLegX, oy + 22, 4, 5);
      }

      c.fillStyle = PANTS_SHADE;
      c.fillRect(leftLegX, oy + 22, 1, 5);
      c.fillRect(rightLegX, oy + 22, 1, 5);

      c.fillStyle = SHOES;
      c.fillRect(leftLegX, oy + 26, 4, 2);
      c.fillRect(rightLegX, oy + 26, 4, 2);

      c.fillStyle = '#4A2A15';
      c.fillRect(leftLegX, oy + 26, 4, 1);
      c.fillRect(rightLegX, oy + 26, 4, 1);

      c.fillStyle = SHIRT;
      c.fillRect(centerX - 7, oy + 12 + bob, 14, 10);

      c.fillStyle = SHIRT_SHADE;
      c.fillRect(centerX + 3, oy + 12 + bob, 4, 10);

      c.fillStyle = SHIRT_HILITE;
      c.fillRect(centerX - 7, oy + 12 + bob, 1, 10);

      c.fillStyle = SHIRT_SHADE;
      c.fillRect(centerX - 2, oy + 12 + bob, 4, 2);

      c.strokeStyle = OUTLINE;
      c.lineWidth = 1;
      c.strokeRect(centerX - 7, oy + 12 + bob, 14, 10);

      c.fillStyle = BELT;
      c.fillRect(centerX - 7, oy + 21 + bob, 14, 2);
      c.fillStyle = BUCKLE;
      c.fillRect(centerX - 1, oy + 21 + bob, 2, 2);

      const armSwing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
      c.fillStyle = SHIRT;
      c.fillRect(centerX - 8, oy + 13 + bob + armSwing, 2, 7);
      c.fillRect(centerX + 6, oy + 13 + bob - armSwing, 2, 7);
      c.strokeStyle = OUTLINE;
      c.strokeRect(centerX - 8, oy + 13 + bob + armSwing, 2, 7);
      c.strokeRect(centerX + 6, oy + 13 + bob - armSwing, 2, 7);

      c.fillStyle = SKIN;
      c.fillRect(centerX - 8, oy + 20 + bob + armSwing, 2, 2);
      c.fillRect(centerX + 6, oy + 20 + bob - armSwing, 2, 2);

      c.fillStyle = SKIN_SHADE;
      c.fillRect(centerX - 2, oy + 11 + bob, 4, 2);

      c.fillStyle = SKIN;
      c.beginPath();
      c.arc(centerX, oy + 9 + bob, 5, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = SKIN_SHADE;
      c.beginPath();
      c.arc(centerX, oy + 9 + bob, 5, -Math.PI / 2, Math.PI / 2);
      c.fill();
      c.strokeStyle = OUTLINE;
      c.beginPath();
      c.arc(centerX, oy + 9 + bob, 5, 0, Math.PI * 2);
      c.stroke();

      c.fillStyle = HAIR;
      if (dir === 'down' || dir === 'left' || dir === 'right') {
        c.beginPath();
        c.arc(centerX, oy + 7 + bob, 5, Math.PI, 0);
        c.fill();

        c.fillRect(centerX - 4, oy + 7 + bob, 3, 2);

        c.fillStyle = HAIR_SHADE;
        c.fillRect(centerX + 1, oy + 5 + bob, 4, 2);
      } else {

        c.beginPath();
        c.arc(centerX, oy + 9 + bob, 5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = HAIR_SHADE;
        c.fillRect(centerX - 2, oy + 11 + bob, 4, 1);
      }

      if (dir === 'down') {

        c.fillStyle = OUTLINE;
        c.fillRect(centerX - 2, oy + 9 + bob, 1, 2);
        c.fillRect(centerX + 1, oy + 9 + bob, 1, 2);

        c.fillStyle = '#FFFFFF';
        c.fillRect(centerX - 2, oy + 9 + bob, 1, 1);
        c.fillRect(centerX + 1, oy + 9 + bob, 1, 1);

        c.fillStyle = SKIN_SHADE;
        c.fillRect(centerX, oy + 10 + bob, 1, 1);

        c.fillStyle = '#6A2020';
        c.fillRect(centerX - 1, oy + 12 + bob, 3, 1);
      } else if (dir === 'left') {
        c.fillStyle = OUTLINE;
        c.fillRect(centerX - 3, oy + 9 + bob, 1, 2);
        c.fillStyle = '#FFFFFF';
        c.fillRect(centerX - 3, oy + 9 + bob, 1, 1);
        c.fillStyle = '#6A2020';
        c.fillRect(centerX - 2, oy + 12 + bob, 2, 1);
      } else if (dir === 'right') {
        c.fillStyle = OUTLINE;
        c.fillRect(centerX + 2, oy + 9 + bob, 1, 2);
        c.fillStyle = '#FFFFFF';
        c.fillRect(centerX + 2, oy + 9 + bob, 1, 1);
        c.fillStyle = '#6A2020';
        c.fillRect(centerX, oy + 12 + bob, 2, 1);
      }
    }

    canvas.refresh();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        canvas.add(row * COLS + col, 0, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
      }
    }

    if (!scene.anims.exists('player-idle-down')) {
      scene.anims.create({ key: 'player-idle-down',  frames: [{ key: 'player', frame: 0 }] });
      scene.anims.create({ key: 'player-idle-left',  frames: [{ key: 'player', frame: 4 }] });
      scene.anims.create({ key: 'player-idle-right', frames: [{ key: 'player', frame: 8 }] });
      scene.anims.create({ key: 'player-idle-up',    frames: [{ key: 'player', frame: 12 }] });
      scene.anims.create({ key: 'player-walk-down',  frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),  frameRate: 8, repeat: -1 });
      scene.anims.create({ key: 'player-walk-left',  frames: scene.anims.generateFrameNumbers('player', { start: 4, end: 7 }),  frameRate: 8, repeat: -1 });
      scene.anims.create({ key: 'player-walk-right', frames: scene.anims.generateFrameNumbers('player', { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
      scene.anims.create({ key: 'player-walk-up',    frames: scene.anims.generateFrameNumbers('player', { start: 12, end: 15 }), frameRate: 8, repeat: -1 });
    }
  }

  update(): void {
    if (this.movementLocked) {
      this.setVelocity(0);
      this.anims.play(`player-idle-${this.facing}`, true);
      return;
    }

    const left = this.cursors.left?.isDown || this.wasd.A.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D.isDown;
    const up = this.cursors.up?.isDown || this.wasd.W.isDown;
    const down = this.cursors.down?.isDown || this.wasd.S.isDown;

    let vx = 0, vy = 0;
    if (left) vx -= PLAYER_SPEED;
    if (right) vx += PLAYER_SPEED;
    if (up) vy -= PLAYER_SPEED;
    if (down) vy += PLAYER_SPEED;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.setVelocity(vx, vy);

    if (Math.abs(vx) > Math.abs(vy)) {
      if (vx > 0) this.facing = 'right';
      else if (vx < 0) this.facing = 'left';
    } else if (vy !== 0) {
      if (vy > 0) this.facing = 'down';
      else this.facing = 'up';
    }

    if (vx === 0 && vy === 0) {
      this.anims.play(`player-idle-${this.facing}`, true);
    } else {
      this.anims.play(`player-walk-${this.facing}`, true);
    }
  }

  getFacing(): 'up' | 'down' | 'left' | 'right' {
    return this.facing;
  }
}
