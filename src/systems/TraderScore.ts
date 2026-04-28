import { portfolio } from './PortfolioSystem';
import { behaviorTracker } from './BehaviorTracker';
import type { Transaction } from '@/types';

export interface TraderScoreBreakdown {
  total: number;
  tier: 'Apprentice' | 'Disciplined' | 'Pro' | 'Master' | 'Legend';
  components: {
    expectancy: number;
    discipline: number;
    drawdown: number;
    winRate: number;
    behavioral: number;
  };
}

const KEY = 'finsim.traderscore.v1';

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }

function computeMaxDrawdown(equityCurve: number[]): number {
  if (equityCurve.length === 0) return 0;
  let peak = equityCurve[0];
  let maxDd = 0;
  for (const v of equityCurve) {
    if (v > peak) peak = v;
    const dd = peak === 0 ? 0 : (peak - v) / peak;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

function reconstructEquity(txs: Transaction[]): number[] {

  let cash = 10_000;
  const holdings: Record<string, { qty: number; avg: number }> = {};
  const samples: number[] = [cash];
  for (const t of txs) {
    if (t.side === 'buy') {
      cash -= t.price * t.quantity;
      const h = holdings[t.symbol] ?? { qty: 0, avg: 0 };
      const totalCost = h.avg * h.qty + t.price * t.quantity;
      const totalQty  = h.qty + t.quantity;
      holdings[t.symbol] = { qty: totalQty, avg: totalQty ? totalCost / totalQty : 0 };
    } else {
      cash += t.price * t.quantity;
      const h = holdings[t.symbol] ?? { qty: 0, avg: 0 };
      h.qty = Math.max(0, h.qty - t.quantity);
      holdings[t.symbol] = h;
    }
    let mark = cash;
    for (const sym of Object.keys(holdings)) {

      const last = txs.slice().reverse().find(x => x.symbol === sym);
      if (last) mark += holdings[sym].qty * last.price;
    }
    samples.push(mark);
  }
  return samples;
}

export class TraderScore {
  private last: TraderScoreBreakdown;
  private subs: Array<(s: TraderScoreBreakdown) => void> = [];

  constructor() {
    this.last = this.load() ?? this.computeBreakdown();
    portfolio.subscribe(() => this.recompute());
    behaviorTracker.subscribe(() => this.recompute());
  }

  private load(): TraderScoreBreakdown | null {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  }
  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.last)); } catch {  }
  }

  private computeBreakdown(): TraderScoreBreakdown {
    const txs = portfolio.getTransactions();
    const events = behaviorTracker.getEvents();
    const rs = portfolio.getROutcomes();

    let wins = 0, closed = 0;
    const sells = txs.filter(t => t.side === 'sell');
    for (const s of sells) {
      const priorBuys = txs.filter(t => t.symbol === s.symbol && t.side === 'buy' && t.timestamp < s.timestamp);
      if (priorBuys.length === 0) continue;
      const avgBuy = priorBuys.reduce((a, t) => a + t.price * t.quantity, 0) /
                     priorBuys.reduce((a, t) => a + t.quantity, 0);
      closed++;
      if (s.price > avgBuy) wins++;
    }
    const winRatePct = closed === 0 ? 0 : (wins / closed) * 100;
    const winRateScore = clamp((winRatePct - 30) * 4.3, 0, 150);

    const avgR = rs.length === 0 ? 0 : rs.reduce((a, r) => a + r, 0) / rs.length;
    const expectancyScore = clamp((avgR + 0.5) * 250, 0, 250);

    const buys = txs.filter(t => t.side === 'buy');

    const disciplinePct = closed === 0 ? 0 : (rs.length / closed) * 100;
    const disciplineScore = clamp(disciplinePct * 2.5, 0, 250);

    const eq = reconstructEquity(txs);
    const maxDd = computeMaxDrawdown(eq);

    const drawdownScore = clamp(200 - (maxDd * 100) * 6.66, 0, 200);

    const biasEvents = events.filter(e => e.eventType === 'bias_detected').length;
    const tradeCount = Math.max(1, buys.length + sells.length);
    const biasRate = biasEvents / tradeCount;
    const behavioralScore = clamp(150 - biasRate * 600, 0, 150);

    const total = Math.round(
      expectancyScore + disciplineScore + drawdownScore + winRateScore + behavioralScore
    );

    let tier: TraderScoreBreakdown['tier'] = 'Apprentice';
    if (total >= 850)      tier = 'Legend';
    else if (total >= 700) tier = 'Master';
    else if (total >= 500) tier = 'Pro';
    else if (total >= 300) tier = 'Disciplined';

    return {
      total,
      tier,
      components: {
        expectancy:  Math.round(expectancyScore),
        discipline:  Math.round(disciplineScore),
        drawdown:    Math.round(drawdownScore),
        winRate:     Math.round(winRateScore),
        behavioral:  Math.round(behavioralScore),
      },
    };
  }

  private recompute(): void {
    const next = this.computeBreakdown();
    if (next.total !== this.last.total) {
      this.last = next;
      this.save();
      this.subs.forEach(s => s(next));
    } else {
      this.last = next;
    }
  }

  get(): TraderScoreBreakdown { return this.last; }
  subscribe(fn: (s: TraderScoreBreakdown) => void): () => void {
    this.subs.push(fn);
    return () => { this.subs = this.subs.filter(s => s !== fn); };
  }
}

export const traderScore = new TraderScore();
(window as unknown as { traderScore: TraderScore }).traderScore = traderScore;
