import type { Holding, Transaction } from '@/types';
import { STARTING_CASH } from '@/config/constants';
import { marketEngine } from './MarketEngine';
import { taxLedger } from './TaxLedger';
import { expectancyFromRs, rMultiple } from '@/lib/risk';
import { firebaseAuth } from './FirebaseAuth';

const STORAGE_KEY = 'finsim.portfolio.v1';

interface PortfolioState {
  cash: number;
  holdings: Holding[];
  transactions: Transaction[];
  flags: string[];
  totalDeposited: number;
  rOutcomes: number[];
  stops: Record<string, number>;
  targets: Record<string, number>;
}

type Listener = (state: PortfolioState) => void;

export interface TradeOptions {
  stopPrice?: number;
  targetPrice?: number;
  riskPct?: number;
  country?: 'US' | 'IN';
  orderType?: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop' | 'oco' | 'bracket';
}

export class PortfolioSystem {
  private state: PortfolioState;
  private listeners: Listener[] = [];
  private syncTimer: number | null = null;

  constructor() {
    this.state = this.load();
    firebaseAuth.subscribe((auth) => {
      if (auth.status === 'signed-in') {
        firebaseAuth.load<PortfolioState>('portfolio').then(remote => {
          if (remote && (remote as PortfolioState).transactions) {
            if ((remote as PortfolioState).transactions.length > this.state.transactions.length) {
              this.state = { ...this.defaultState(), ...remote } as PortfolioState;
              this.save();
              this.emit();
            }
          }
        }).catch(() => {  });
      }
    });
  }

  private defaultState(): PortfolioState {
    return {
      cash: STARTING_CASH,
      holdings: [],
      transactions: [],
      flags: [],
      totalDeposited: STARTING_CASH,
      rOutcomes: [],
      stops: {},
      targets: {},
    };
  }

  private load(): PortfolioState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...this.defaultState(), ...parsed };
      }
    } catch (e) {
      console.warn('[Portfolio] load failed:', e);
    }
    return this.defaultState();
  }

  private save(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch (e) { console.warn('[Portfolio] save failed', e); }
    if (this.syncTimer) window.clearTimeout(this.syncTimer);
    this.syncTimer = window.setTimeout(() => {
      firebaseAuth.save('portfolio', this.state).catch(() => {  });
    }, 1500);
  }

  getState(): Readonly<PortfolioState> { return this.state; }
  getCash(): number { return this.state.cash; }
  getHoldings(): Holding[] { return this.state.holdings; }
  getTransactions(): Transaction[] { return this.state.transactions; }
  getROutcomes(): number[] { return [...this.state.rOutcomes]; }
  getExpectancy() { return expectancyFromRs(this.state.rOutcomes); }

  getStop(symbol: string): number | undefined { return this.state.stops[symbol]; }
  getTarget(symbol: string): number | undefined { return this.state.targets[symbol]; }

  getHoldingsValue(): number {
    return this.state.holdings.reduce((sum, h) => {
      const stock = marketEngine.getStock(h.symbol);
      const currentPrice = stock?.price ?? h.avgPrice;
      return sum + currentPrice * h.quantity;
    }, 0);
  }

  getTotalValue(): number { return this.state.cash + this.getHoldingsValue(); }
  getTotalPnl(): number { return this.getTotalValue() - this.state.totalDeposited; }

  hasFlag(flag: string): boolean { return this.state.flags.includes(flag); }
  setFlag(flag: string): void {
    if (!this.hasFlag(flag)) { this.state.flags.push(flag); this.save(); this.emit(); }
  }

  addCash(amount: number): void {
    this.state.cash += amount;
    if (amount > 0) this.state.totalDeposited += amount;
    this.save(); this.emit();
  }

  buy(symbol: string, quantity: number, district = 'Wall Street', opts: TradeOptions = {}): { ok: boolean; error?: string; transaction?: Transaction } {
    const stock = marketEngine.getStock(symbol);
    if (!stock) return { ok: false, error: 'Stock not found' };

    const cost = stock.price * quantity;
    if (cost > this.state.cash) {
      return { ok: false, error: `Insufficient cash. Need ${cost.toFixed(2)}, have ${this.state.cash.toFixed(2)}.` };
    }

    this.state.cash -= cost;

    const existing = this.state.holdings.find(h => h.symbol === symbol);
    if (existing) {
      const totalCost = existing.avgPrice * existing.quantity + cost;
      const totalQty = existing.quantity + quantity;
      existing.avgPrice = totalCost / totalQty;
      existing.quantity = totalQty;
    } else {
      this.state.holdings.push({ symbol, quantity, avgPrice: stock.price });
    }

    taxLedger.addLot(symbol, quantity, stock.price);

    if (opts.stopPrice) this.state.stops[symbol] = opts.stopPrice;
    if (opts.targetPrice) this.state.targets[symbol] = opts.targetPrice;

    const tx: Transaction = {
      id: this.newId(), timestamp: Date.now(),
      symbol, side: 'buy', quantity, price: stock.price, district,
    };
    this.state.transactions.push(tx);
    this.save(); this.emit();
    return { ok: true, transaction: tx };
  }

  sell(symbol: string, quantity: number, district = 'Wall Street', opts: TradeOptions = {}): { ok: boolean; error?: string; pnl?: number; rOutcome?: number; transaction?: Transaction; fifoResult?: ReturnType<typeof taxLedger.sell> } {
    const stock = marketEngine.getStock(symbol);
    if (!stock) return { ok: false, error: 'Stock not found' };

    const holding = this.state.holdings.find(h => h.symbol === symbol);
    if (!holding) return { ok: false, error: 'You do not hold this stock.' };
    if (holding.quantity < quantity) return { ok: false, error: `Only hold ${holding.quantity} shares.` };

    const country: 'US' | 'IN' = opts.country ?? (district === 'Dalal Street' ? 'IN' : 'US');
    const proceeds = stock.price * quantity;
    const costBasis = holding.avgPrice * quantity;
    const pnl = proceeds - costBasis;

    const stop = this.state.stops[symbol];
    let rOutcome: number | undefined;
    if (stop && stop !== holding.avgPrice) {
      rOutcome = rMultiple(holding.avgPrice, stock.price, stop, 'long');
      this.state.rOutcomes.push(rOutcome);
      if (this.state.rOutcomes.length > 500) this.state.rOutcomes = this.state.rOutcomes.slice(-500);
    }

    const fifoResult = taxLedger.sell(symbol, quantity, stock.price, country, this.state.transactions.slice(-40));

    this.state.cash += proceeds;
    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      this.state.holdings = this.state.holdings.filter(h => h.symbol !== symbol);
      delete this.state.stops[symbol];
      delete this.state.targets[symbol];
    }

    const tx: Transaction = {
      id: this.newId(), timestamp: Date.now(),
      symbol, side: 'sell', quantity, price: stock.price, district,
    };
    this.state.transactions.push(tx);
    this.save(); this.emit();
    return { ok: true, pnl, rOutcome, transaction: tx, fifoResult };
  }

  setStop(symbol: string, stop: number): void { this.state.stops[symbol] = stop; this.save(); this.emit(); }
  setTarget(symbol: string, target: number): void { this.state.targets[symbol] = target; this.save(); this.emit(); }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.load();
    this.emit();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private emit(): void { this.listeners.forEach(fn => fn(this.state)); }
  private newId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
}

export const portfolio = new PortfolioSystem();
(window as unknown as { portfolio: PortfolioSystem }).portfolio = portfolio;
