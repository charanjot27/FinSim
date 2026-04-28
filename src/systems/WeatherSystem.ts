export type WeatherKind = 'sunny' | 'overcast' | 'rain' | 'thunder' | 'snow';
export type Season = 'spring' | 'summer' | 'monsoon' | 'winter';

interface Drop { x: number; y: number; v: number; l: number; }
interface Flake { x: number; y: number; v: number; r: number; d: number; }

export class WeatherSystem {
  private root: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private drops: Drop[] = [];
  private flakes: Flake[] = [];
  private kind: WeatherKind = 'sunny';
  private season: Season = 'summer';
  private rafId = 0;
  private lastTick = 0;
  private autoTimer: number | null = null;
  private flashAt = 0;

  constructor() {
    this.root = document.getElementById('weather') as HTMLDivElement;
    if (!this.root) throw new Error('Weather root missing (#weather)');
    this.canvas = this.root.querySelector('canvas.weather-canvas') as HTMLCanvasElement;
    if (!this.canvas) throw new Error('Weather canvas missing');
    const c = this.canvas.getContext('2d');
    if (!c) throw new Error('Weather canvas 2d context missing');
    this.ctx = c;
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.season = this.detectSeason();
    this.applySeasonTint();
    this.setKind('sunny');
    this.startAuto();
  }

  private detectSeason(): Season {
    const m = new Date().getMonth();
    if (m <= 1 || m === 11) return 'winter';
    if (m >= 2 && m <= 4)   return 'spring';
    if (m >= 5 && m <= 8)   return 'monsoon';
    return 'summer';
  }

  private applySeasonTint(): void {
    document.documentElement.setAttribute('data-season', this.season);
  }

  private resize(): void {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setSeason(s: Season): void {
    this.season = s;
    this.applySeasonTint();
  }

  getKind(): WeatherKind { return this.kind; }
  getSeason(): Season { return this.season; }

  setKind(k: WeatherKind): void {
    this.kind = k;
    this.drops = [];
    this.flakes = [];
    document.documentElement.setAttribute('data-weather', k);

    if (k === 'rain' || k === 'thunder') {
      const count = k === 'thunder' ? 420 : 260;
      for (let i = 0; i < count; i++) this.drops.push(this.newDrop());
    }
    if (k === 'snow') {
      for (let i = 0; i < 140; i++) this.flakes.push(this.newFlake());
    }
    this.ensureLoop();
  }

  private newDrop(): Drop {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      v: 6 + Math.random() * 7,
      l: 10 + Math.random() * 12,
    };
  }

  private newFlake(): Flake {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      v: 0.7 + Math.random() * 1.4,
      r: 1 + Math.random() * 2.2,
      d: Math.random() * Math.PI * 2,
    };
  }

  private ensureLoop(): void {
    if (this.rafId) return;
    const loop = (t: number) => {
      const dt = this.lastTick ? Math.min(64, t - this.lastTick) : 16;
      this.lastTick = t;
      this.tick(dt);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private tick(dt: number): void {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.kind === 'rain' || this.kind === 'thunder') {
      ctx.strokeStyle = 'rgba(170, 200, 230, .45)';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      for (const d of this.drops) {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.l);
        ctx.stroke();
        d.y += d.v * (dt / 16);
        d.x -= 0.4 * (dt / 16);
        if (d.y > canvas.height) {
          d.y = -20;
          d.x = Math.random() * canvas.width;
        }
      }
      if (this.kind === 'thunder' && performance.now() - this.flashAt > 4200 && Math.random() < 0.003) {
        this.flashAt = performance.now();
        this.root.classList.add('weather-flash');
        window.setTimeout(() => this.root.classList.remove('weather-flash'), 180);
      }
    } else if (this.kind === 'snow') {
      ctx.fillStyle = 'rgba(255, 255, 255, .8)';
      for (const f of this.flakes) {
        f.d += 0.02;
        f.y += f.v * (dt / 16);
        f.x += Math.sin(f.d) * 0.6;
        if (f.y > canvas.height + 4) {
          f.y = -4; f.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private startAuto(): void {
    if (this.autoTimer !== null) return;

    const weights: Record<Season, Array<[WeatherKind, number]>> = {
      spring:  [['sunny', 5], ['overcast', 3], ['rain', 1]],
      summer:  [['sunny', 7], ['overcast', 2], ['thunder', 1]],
      monsoon: [['rain', 5], ['thunder', 3], ['overcast', 2], ['sunny', 1]],
      winter:  [['overcast', 4], ['sunny', 3], ['snow', 2], ['rain', 1]],
    };
    const pick = () => {
      const w = weights[this.season];
      const total = w.reduce((s, [, n]) => s + n, 0);
      let r = Math.random() * total;
      for (const [k, n] of w) { r -= n; if (r <= 0) return k; }
      return 'sunny' as WeatherKind;
    };
    this.autoTimer = window.setInterval(() => {
      const next = pick();
      if (next !== this.kind) this.setKind(next);
    }, 55_000);
  }
}
