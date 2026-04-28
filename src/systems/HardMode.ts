import { portfolio } from './PortfolioSystem';
import type { Transaction } from '@/types';

const KEY = 'finsim.hardmode.v1';
const COOLOFF_MS = 60_000;

interface State {
  enabled: boolean;
  lockedUntil: number;
  lossStreak: number;
}

type Listener = (s: State) => void;

export class HardModeSystem {
  private state: State;
  private listeners: Listener[] = [];
  private lastSeenTxId: string | null = null;

  constructor() {
    this.state = this.load();
    portfolio.subscribe(() => this.onPortfolio());
  }

  private load(): State {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { lossStreak: 0, lockedUntil: 0, enabled: false, ...JSON.parse(raw) };
    } catch {  }
    return { enabled: false, lockedUntil: 0, lossStreak: 0 };
  }
  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch {  }
  }
  private emit(): void { this.listeners.forEach(l => l(this.state)); }

  isEnabled(): boolean { return this.state.enabled; }
  setEnabled(on: boolean): void {
    this.state.enabled = on;
    if (!on) this.state.lockedUntil = 0;
    this.save(); this.emit();
  }

  isLocked(): boolean {
    if (!this.state.enabled) return false;
    if (this.state.lockedUntil <= Date.now()) {
      if (this.state.lockedUntil !== 0) {
        this.state.lockedUntil = 0;
        this.save();
      }
      return false;
    }
    return true;
  }

  remainingMs(): number {
    if (!this.isLocked()) return 0;
    return Math.max(0, this.state.lockedUntil - Date.now());
  }

  getState(): State { return { ...this.state }; }
  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private onPortfolio(): void {
    if (!this.state.enabled) return;
    const txs = portfolio.getTransactions();
    if (txs.length === 0) return;
    const last = txs[txs.length - 1];
    if (last.id === this.lastSeenTxId) return;
    this.lastSeenTxId = last.id;
    if (last.side !== 'sell') return;
    const wasLoss = this.wasSellALoss(last, txs);
    if (wasLoss === null) return;
    if (wasLoss) this.state.lossStreak += 1;
    else this.state.lossStreak = 0;

    if (this.state.lossStreak >= 3 && this.state.lockedUntil < Date.now()) {
      this.state.lockedUntil = Date.now() + COOLOFF_MS;
      this.state.lossStreak = 0;
      this.emit();
    }
    this.save();
  }

  private wasSellALoss(sell: Transaction, txs: Transaction[]): boolean | null {
    const priorBuys = txs.filter(t => t.symbol === sell.symbol && t.side === 'buy' && t.timestamp < sell.timestamp);
    if (priorBuys.length === 0) return null;
    const avgBuy = priorBuys.reduce((a, t) => a + t.price * t.quantity, 0) /
                   priorBuys.reduce((a, t) => a + t.quantity, 0);
    return sell.price < avgBuy;
  }
}

export const hardMode = new HardModeSystem();
(window as unknown as { hardMode: HardModeSystem }).hardMode = hardMode;
