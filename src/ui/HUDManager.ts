import { portfolio } from '@/systems/PortfolioSystem';
import { marketEngine } from '@/systems/MarketEngine';
import { formatCurrency } from '@/lib/math';
import { soundManager } from '@/systems/SoundManager';

export class HUDManager {
  private hud: HTMLElement;
  private cashEl: HTMLElement;
  private portfolioEl: HTMLElement;
  private districtEl: HTMLElement;
  private btnPortfolio: HTMLButtonElement;
  private btnHelp: HTMLButtonElement;
  private btnSound: HTMLButtonElement | null;
  private currentDistrict = 'Scam Slum';
  private lastCash = 0;
  private lastPortfolio = 0;

  constructor(
    private openPortfolio: () => void,
    private openHelp: () => void
  ) {
    this.hud = document.getElementById('hud')!;
    this.cashEl = document.getElementById('hud-cash')!;
    this.portfolioEl = document.getElementById('hud-portfolio')!;
    this.districtEl = document.getElementById('hud-district')!;
    this.btnPortfolio = document.getElementById('btn-portfolio') as HTMLButtonElement;
    this.btnHelp = document.getElementById('btn-help') as HTMLButtonElement;
    this.btnSound = document.getElementById('btn-sound') as HTMLButtonElement | null;

    this.btnPortfolio.addEventListener('click', () => {
      soundManager.play('click');
      this.openPortfolio();
    });
    this.btnPortfolio.addEventListener('mouseenter', () => soundManager.play('hover'));

    this.btnHelp.addEventListener('click', () => {
      soundManager.play('click');
      this.openHelp();
    });
    this.btnHelp.addEventListener('mouseenter', () => soundManager.play('hover'));

    if (this.btnSound) {
      this.updateSoundButton(soundManager.isMuted());
      this.btnSound.addEventListener('click', () => {
        const nowMuted = soundManager.toggleMute();
        this.updateSoundButton(nowMuted);
        if (!nowMuted) soundManager.play('click');
      });
      this.btnSound.addEventListener('mouseenter', () => soundManager.play('hover'));
    }

    portfolio.subscribe(() => this.update());
    marketEngine.subscribe(() => this.update());
    this.update();
  }

  private updateSoundButton(muted: boolean): void {
    if (!this.btnSound) return;
    this.btnSound.textContent = muted ? '🔇' : '🔊';
    this.btnSound.classList.toggle('is-muted', muted);
    this.btnSound.title = muted ? 'Unmute sound' : 'Mute sound';
  }

  show(): void { this.hud.classList.remove('hidden'); }
  hide(): void { this.hud.classList.add('hidden'); }

  setDistrict(district: string): void {
    this.currentDistrict = district;
    this.districtEl.textContent = district;
  }

  update(): void {
    const cash = portfolio.getCash();
    const holdings = portfolio.getHoldingsValue();
    this.cashEl.textContent = formatCurrency(cash, '').trim();
    this.portfolioEl.textContent = formatCurrency(holdings, '').trim();

    if (this.lastCash !== 0 && Math.abs(cash - this.lastCash) > 1) {
      this.flashValue(this.cashEl, cash > this.lastCash);
    }
    if (this.lastPortfolio !== 0 && Math.abs(holdings - this.lastPortfolio) > 1) {
      this.flashValue(this.portfolioEl, holdings > this.lastPortfolio);
    }
    this.lastCash = cash;
    this.lastPortfolio = holdings;
  }

  private flashValue(el: HTMLElement, positive: boolean): void {
    const color = positive ? '#4FD27A' : '#E04A3C';
    el.style.transition = 'color 0.1s, text-shadow 0.1s';
    el.style.color = color;
    el.style.textShadow = `0 0 12px ${color}`;
    window.setTimeout(() => {
      el.style.color = '';
      el.style.textShadow = '';
    }, 350);
  }
}
