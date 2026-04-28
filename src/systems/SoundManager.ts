type SfxName =
  | 'click'
  | 'hover'
  | 'dialogueOpen'
  | 'dialogueClose'
  | 'choice'
  | 'type'
  | 'buy'
  | 'sell'
  | 'error'
  | 'alert'
  | 'success'
  | 'unlock'
  | 'coin'
  | 'portal'
  | 'trainHorn'
  | 'trainChug'
  | 'trainBrake'
  | 'stationBell'
  | 'stationAnnounce';

const MUTE_KEY = 'finsim.sound.muted';

class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private started = false;
  private listeners: Array<(muted: boolean) => void> = [];

  constructor() {
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      this.muted = false;
    }
  }

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.45;
      this.master.connect(this.ctx.destination);
      this.started = true;
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  isMuted(): boolean { return this.muted; }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch {  }
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.45;
    this.listeners.forEach(fn => fn(this.muted));
    return this.muted;
  }

  onMuteChange(fn: (muted: boolean) => void): void {
    this.listeners.push(fn);
  }

  private beep(opts: {
    freq: number;
    duration: number;
    type?: OscillatorType;
    attack?: number;
    release?: number;
    volume?: number;
    slideTo?: number;
    delay?: number;
  }): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;

    const now = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const attack = opts.attack ?? 0.005;
    const release = opts.release ?? 0.08;
    const vol = opts.volume ?? 0.25;

    osc.type = opts.type ?? 'square';
    osc.frequency.setValueAtTime(opts.freq, now);
    if (opts.slideTo !== undefined) {
      osc.frequency.linearRampToValueAtTime(opts.slideTo, now + opts.duration);
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack);
    gain.gain.linearRampToValueAtTime(vol * 0.7, now + opts.duration - release);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + opts.duration + 0.02);
  }

  private noise(duration: number, volume = 0.15): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
  }

  play(name: SfxName): void {
    if (this.muted) return;
    switch (name) {
      case 'click':
        this.beep({ freq: 680, duration: 0.06, type: 'square', volume: 0.18 });
        break;
      case 'hover':
        this.beep({ freq: 520, duration: 0.04, type: 'sine', volume: 0.08 });
        break;
      case 'dialogueOpen':
        this.beep({ freq: 340, duration: 0.08, type: 'triangle', volume: 0.22 });
        this.beep({ freq: 520, duration: 0.12, type: 'triangle', volume: 0.18, delay: 0.06 });
        break;
      case 'dialogueClose':
        this.beep({ freq: 520, duration: 0.08, type: 'triangle', volume: 0.2 });
        this.beep({ freq: 340, duration: 0.1, type: 'triangle', volume: 0.16, delay: 0.05 });
        break;
      case 'choice':
        this.beep({ freq: 760, duration: 0.06, type: 'square', volume: 0.18 });
        this.beep({ freq: 1020, duration: 0.08, type: 'square', volume: 0.14, delay: 0.05 });
        break;
      case 'type':
        this.beep({ freq: 420 + Math.random() * 80, duration: 0.02, type: 'square', volume: 0.04 });
        break;
      case 'buy':
        this.beep({ freq: 440, duration: 0.08, type: 'square', volume: 0.2 });
        this.beep({ freq: 660, duration: 0.1, type: 'square', volume: 0.2, delay: 0.07 });
        this.beep({ freq: 880, duration: 0.14, type: 'triangle', volume: 0.18, delay: 0.15 });
        break;
      case 'sell':
        this.beep({ freq: 660, duration: 0.08, type: 'square', volume: 0.2 });
        this.beep({ freq: 440, duration: 0.14, type: 'triangle', volume: 0.18, delay: 0.07 });
        break;
      case 'error':
        this.beep({ freq: 220, duration: 0.12, type: 'sawtooth', volume: 0.2 });
        this.beep({ freq: 180, duration: 0.18, type: 'sawtooth', volume: 0.18, delay: 0.1 });
        break;
      case 'alert':
        this.beep({ freq: 880, duration: 0.1, type: 'square', volume: 0.22 });
        this.beep({ freq: 660, duration: 0.1, type: 'square', volume: 0.22, delay: 0.12 });
        this.beep({ freq: 880, duration: 0.14, type: 'square', volume: 0.22, delay: 0.24 });
        break;
      case 'success':
        this.beep({ freq: 523, duration: 0.08, type: 'triangle', volume: 0.22 });
        this.beep({ freq: 659, duration: 0.08, type: 'triangle', volume: 0.22, delay: 0.07 });
        this.beep({ freq: 784, duration: 0.14, type: 'triangle', volume: 0.22, delay: 0.14 });
        this.beep({ freq: 1047, duration: 0.2, type: 'triangle', volume: 0.22, delay: 0.21 });
        break;
      case 'unlock':
        this.beep({ freq: 392, duration: 0.1, type: 'triangle', volume: 0.22 });
        this.beep({ freq: 494, duration: 0.1, type: 'triangle', volume: 0.22, delay: 0.08 });
        this.beep({ freq: 587, duration: 0.1, type: 'triangle', volume: 0.22, delay: 0.16 });
        this.beep({ freq: 784, duration: 0.22, type: 'triangle', volume: 0.22, delay: 0.24 });
        this.noise(0.2, 0.08);
        break;
      case 'coin':
        this.beep({ freq: 988, duration: 0.08, type: 'square', volume: 0.18 });
        this.beep({ freq: 1319, duration: 0.14, type: 'square', volume: 0.18, delay: 0.06 });
        break;
      case 'portal':
        this.beep({ freq: 220, duration: 0.5, type: 'sawtooth', volume: 0.15, slideTo: 880 });
        this.noise(0.4, 0.1);
        break;

      case 'trainHorn':

        this.beep({ freq: 165, duration: 0.55, type: 'sawtooth', volume: 0.22, attack: 0.04, release: 0.18 });
        this.beep({ freq: 220, duration: 0.55, type: 'sawtooth', volume: 0.18, attack: 0.04, release: 0.18 });
        this.beep({ freq: 330, duration: 0.55, type: 'sawtooth', volume: 0.10, attack: 0.04, release: 0.18 });

        this.noise(0.35, 0.06);
        break;
      case 'trainChug':

        this.beep({ freq: 90, duration: 0.18, type: 'sawtooth', volume: 0.18, attack: 0.005, release: 0.12 });
        this.noise(0.22, 0.10);
        break;
      case 'trainBrake':

        this.beep({ freq: 1800, duration: 0.6, type: 'sine', volume: 0.10, slideTo: 600, attack: 0.05, release: 0.4 });
        this.beep({ freq: 2400, duration: 0.5, type: 'triangle', volume: 0.06, slideTo: 900, attack: 0.05, release: 0.3, delay: 0.1 });
        this.noise(0.5, 0.05);
        break;
      case 'stationBell':

        this.beep({ freq: 988, duration: 0.6, type: 'sine', volume: 0.18, attack: 0.005, release: 0.5 });
        this.beep({ freq: 784, duration: 0.7, type: 'sine', volume: 0.18, attack: 0.005, release: 0.6, delay: 0.35 });
        break;
      case 'stationAnnounce':

        this.beep({ freq: 523, duration: 0.5, type: 'triangle', volume: 0.12, attack: 0.02, release: 0.4 });
        this.beep({ freq: 659, duration: 0.6, type: 'triangle', volume: 0.10, attack: 0.02, release: 0.5, delay: 0.15 });
        this.beep({ freq: 784, duration: 0.7, type: 'triangle', volume: 0.10, attack: 0.02, release: 0.55, delay: 0.3 });
        this.noise(0.3, 0.04);
        break;
    }
  }
}

export const soundManager = new SoundManager();

const unlock = () => {
  try { (soundManager as unknown as { ensureCtx: () => AudioContext | null }).ensureCtx(); } catch {  }
  window.removeEventListener('pointerdown', unlock);
  window.removeEventListener('keydown', unlock);
};
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });
