import { gbmStep } from '@/lib/math';
import { seedStock, WALL_STREET_STOCKS, DALAL_STREET_STOCKS } from '@/data/stocks';
import { fetchLiveBatch, fetchCoinGeckoTop } from './MarketAPI';
import type { Stock, Candle } from '@/types';

type Listener = (stocks: Map<string, Stock>) => void;

export class MarketEngine {
  private stocks = new Map<string, Stock>();
  private listeners: Listener[] = [];
  private tickInterval: number | null = null;
  private candleInterval: number | null = null;
  private refreshInterval: number | null = null;
  private tickRateMs = 2000;
  private candleRateMs = 60000;
  private refreshRateMs = 120_000;
  private lastRefresh = 0;
  private liveProviderLabel = 'simulated';

  constructor() {
    [...WALL_STREET_STOCKS, ...DALAL_STREET_STOCKS].forEach(seed => {
      this.stocks.set(seed.symbol, seedStock(seed));
    });
  }

  start(): void {
    if (this.tickInterval !== null) return;
    this.tickInterval = window.setInterval(() => this.tick(), this.tickRateMs);
    this.candleInterval = window.setInterval(() => this.closeCandle(), this.candleRateMs);
    this.refreshInterval = window.setInterval(() => this.refreshLive(), this.refreshRateMs);
    this.refreshLive().catch(() => {  });
  }

  stop(): void {
    if (this.tickInterval !== null) { window.clearInterval(this.tickInterval); this.tickInterval = null; }
    if (this.candleInterval !== null) { window.clearInterval(this.candleInterval); this.candleInterval = null; }
    if (this.refreshInterval !== null) { window.clearInterval(this.refreshInterval); this.refreshInterval = null; }
  }

  async refreshLive(): Promise<void> {
    try {
      const wsSymbols = WALL_STREET_STOCKS.map(s => s.symbol);
      const dsYahoo = DALAL_STREET_STOCKS.map(s => `${s.symbol}.NS`);

      const [wsQuotes, dsQuotes, cgQuotes] = await Promise.all([
        fetchLiveBatch(wsSymbols, 3).catch(() => [] as Awaited<ReturnType<typeof fetchLiveBatch>>),
        fetchLiveBatch(dsYahoo, 3).catch(() => [] as Awaited<ReturnType<typeof fetchLiveBatch>>),
        fetchCoinGeckoTop(20).catch(() => [] as Awaited<ReturnType<typeof fetchCoinGeckoTop>>),
      ]);

      let updated = 0;
      wsSymbols.forEach((sym, i) => {
        const q = wsQuotes[i]; if (!q) return;
        const s = this.stocks.get(sym); if (!s) return;
        s.price = q.price; s.prevClose = q.prevClose;
        if (q.high) s.high = q.high; if (q.low) s.low = q.low; if (q.open) s.open = q.open;
        this.liveProviderLabel = q.provider; updated++;
      });

      dsYahoo.forEach((yhSym, i) => {
        const q = dsQuotes[i]; if (!q) return;
        const plain = yhSym.replace('.NS', '');
        const s = this.stocks.get(plain); if (!s) return;
        s.price = q.price; s.prevClose = q.prevClose;
        if (q.high) s.high = q.high; if (q.low) s.low = q.low; if (q.open) s.open = q.open;
        this.liveProviderLabel = q.provider; updated++;
      });

      cgQuotes.forEach(q => {
        const existing = this.stocks.get(q.symbol);
        if (existing) {
          existing.price = q.price; existing.prevClose = q.prevClose;
          if (q.high) existing.high = q.high; if (q.low) existing.low = q.low;
        } else {
          this.stocks.set(q.symbol, {
            symbol: q.symbol, name: q.symbol, currency: '$', sector: 'Crypto',
            price: q.price, prevClose: q.prevClose,
            open: q.open ?? q.price, high: q.high ?? q.price, low: q.low ?? q.price,
            drift: 0.2, volatility: 0.8,
            candles: [{ time: Date.now(), open: q.price, high: q.price, low: q.price, close: q.price, volume: 0 }],
          });
        }
        updated++;
      });

      if (updated > 0) {
        this.lastRefresh = Date.now();
        this.emit();
        console.info(`[Market] Live refresh: ${updated} quotes via ${this.liveProviderLabel}`);
      }
    } catch (e) {
      console.warn('[Market] Live refresh failed, staying simulated:', e);
    }
  }

  private tick(): void {
    const dtSec = this.tickRateMs / 1000;
    this.stocks.forEach(stock => {
      stock.price = gbmStep(stock.price, stock.drift, stock.volatility, dtSec);
      const current = stock.candles[stock.candles.length - 1];
      if (current) {
        current.close = stock.price;
        current.high = Math.max(current.high, stock.price);
        current.low = Math.min(current.low, stock.price);
      }
    });
    this.emit();
  }

  private closeCandle(): void {
    const now = Date.now();
    this.stocks.forEach(stock => {
      const newCandle: Candle = {
        time: now, open: stock.price, high: stock.price, low: stock.price, close: stock.price,
        volume: Math.floor(50000 + Math.random() * 500000),
      };
      stock.candles.push(newCandle);
      if (stock.candles.length > 200) stock.candles.shift();
    });
  }

  getStock(symbol: string): Stock | undefined { return this.stocks.get(symbol); }
  getAllStocks(): Map<string, Stock> { return this.stocks; }

  getStocksByMarket(market: 'wall-street' | 'dalal-street' | 'crypto'): Stock[] {
    if (market === 'crypto') {
      const out: Stock[] = [];
      this.stocks.forEach(s => { if (s.sector === 'Crypto') out.push(s); });
      return out.sort((a, b) => b.price - a.price);
    }
    const seeds = market === 'wall-street' ? WALL_STREET_STOCKS : DALAL_STREET_STOCKS;
    return seeds.map(s => this.stocks.get(s.symbol)!).filter(Boolean);
  }

  getProviderLabel(): string { return this.liveProviderLabel; }
  getLastRefresh(): number { return this.lastRefresh; }

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private emit(): void { this.listeners.forEach(fn => fn(this.stocks)); }
}

export const marketEngine = new MarketEngine();
(window as unknown as Record<string, unknown>).marketEngine = marketEngine;
