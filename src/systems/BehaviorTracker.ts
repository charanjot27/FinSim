import type { BehaviorEvent, BiasDetection, Transaction } from '@/types';
import { BIAS_THRESHOLDS } from '@/config/constants';
import { portfolio } from './PortfolioSystem';
import { marketEngine } from './MarketEngine';
import { withinEventWindow } from '@/data/econCalendar';

const STORAGE_KEY = 'finsim.behavior.v1';

type InterventionHandler = (bias: BiasDetection) => void;

export interface PreTradeContext {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  hasStop?: boolean;
  riskPct?: number;
  sources?: string[];
  lastSocialScrollMs?: number;
}

type EventSub = (e: { type: string; payload: Record<string, unknown> }) => void;

export class BehaviorTracker {
  private events: BehaviorEvent[] = [];
  private interventionHandlers: InterventionHandler[] = [];
  private eventSubs: EventSub[] = [];
  private lastSocialScroll = 0;

  constructor() { this.load(); }

  subscribe(fn: EventSub): () => void {
    this.eventSubs.push(fn);
    return () => { this.eventSubs = this.eventSubs.filter(s => s !== fn); };
  }

  private load(): void {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) this.events = JSON.parse(raw); }
    catch (e) { console.warn('[Behavior] Load failed:', e); }
  }

  private save(): void {
    if (this.events.length > 500) this.events = this.events.slice(-500);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events)); }
    catch (e) { console.warn('[Behavior] Save failed:', e); }
  }

  log(eventType: string, payload: Record<string, unknown> = {}): void {
    this.events.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(), eventType, payload,
    });
    if (eventType === 'social_scroll') this.lastSocialScroll = Date.now();
    this.save();
    const notice = { type: eventType, payload };
    for (const s of this.eventSubs) { try { s(notice); } catch (e) { console.warn('[Behavior] sub err', e); } }
  }

  checkPreTradeBias(symbol: string, side: 'buy' | 'sell', quantity: number): BiasDetection | null {
    return this.checkPreTrade({ symbol, side, quantity });
  }

  checkPreTrade(ctx: PreTradeContext): BiasDetection | null {
    return (
      this.checkFOMO(ctx) ||
      this.checkRevenge(ctx) ||
      this.checkOverconfidence(ctx) ||
      this.checkNakedTrade(ctx) ||
      this.checkNewsRoulette(ctx) ||
      this.checkTweetTrade(ctx) ||
      this.checkConcentration(ctx) ||
      null
    );
  }

  private checkFOMO(ctx: PreTradeContext): BiasDetection | null {
    if (ctx.side !== 'buy') return null;
    const stock = marketEngine.getStock(ctx.symbol);
    if (!stock) return null;
    const recent = stock.candles.slice(-10);
    if (recent.length < 2) return null;
    const start = recent[0].open, end = recent[recent.length - 1].close;
    const pctMove = ((end - start) / start) * 100;
    if (pctMove < BIAS_THRESHOLDS.FOMO_PUMP_PCT) return null;
    return {
      type: 'fomo',
      severity: pctMove > 10 ? 'high' : 'medium',
      title: 'FOMO Alert',
      message: `${ctx.symbol} just pumped ${pctMove.toFixed(1)}% in the last 10 minutes. You\u2019re buying the top.`,
      statistic: 'Retail traders who buy after a >5% pump lose money 67% of the time in the next 30 days.',
    };
  }

  private checkRevenge(ctx: PreTradeContext): BiasDetection | null {
    if (ctx.side !== 'buy') return null;
    const recentTxs = portfolio.getTransactions().slice(-5);
    const losses = this.countRecentLosses(recentTxs);
    if (losses < BIAS_THRESHOLDS.REVENGE_LOSS_COUNT) return null;
    const avgSize = this.averageRecentTradeSize(recentTxs);
    const stock = marketEngine.getStock(ctx.symbol);
    const size = (stock?.price ?? 0) * ctx.quantity;
    if (avgSize === 0 || size <= avgSize * BIAS_THRESHOLDS.REVENGE_SIZE_MULTIPLIER) return null;
    return {
      type: 'revenge_trading', severity: 'high', title: 'Revenge Trading Detected',
      message: `You\u2019ve lost ${losses} trades in a row and you\u2019re sizing up ${((size / avgSize - 1) * 100).toFixed(0)}% bigger.`,
      statistic: '78% of traders who revenge-trade after a loss string lose more on the next trade.',
    };
  }

  private checkOverconfidence(ctx: PreTradeContext): BiasDetection | null {
    if (ctx.side !== 'buy') return null;
    const recentTxs = portfolio.getTransactions().slice(-5);
    const wins = this.countRecentWins(recentTxs);
    if (wins < BIAS_THRESHOLDS.OVERCONFIDENCE_WIN_COUNT) return null;
    const avgSize = this.averageRecentTradeSize(recentTxs);
    const stock = marketEngine.getStock(ctx.symbol);
    const size = (stock?.price ?? 0) * ctx.quantity;
    if (avgSize === 0 || size <= avgSize * 2) return null;
    return {
      type: 'overconfidence', severity: 'medium', title: 'Overconfidence Warning',
      message: `You\u2019ve won ${wins} trades in a row. Now you\u2019re doubling position size. Bull runs end.`,
      statistic: 'Winning streaks produce the biggest losses. Regression to mean is mathematically inevitable.',
    };
  }

  private checkNakedTrade(ctx: PreTradeContext): BiasDetection | null {
    if (ctx.side !== 'buy') return null;
    if (ctx.hasStop) return null;
    return {
      type: 'naked_trade', severity: 'high', title: 'Naked Trade',
      message: 'You\u2019re entering without a stop-loss. Pros always know their exit before their entry.',
      statistic: 'Traders without pre-set stops risk 3x more capital than intended on average losing trades.',
    };
  }

  private checkNewsRoulette(_ctx: PreTradeContext): BiasDetection | null {
    const event = withinEventWindow(Date.now(), 30);
    if (!event) return null;
    return {
      type: 'news_roulette', severity: 'high', title: 'News Roulette',
      message: `${event.title} is within 30 minutes (${new Date(event.datetime).toLocaleString()}). First-reaction moves reverse 60% of the time.`,
      statistic: 'Algos front-run retail on event prints. Wait 30 min minimum.',
    };
  }

  private checkTweetTrade(ctx: PreTradeContext): BiasDetection | null {
    const viaTweet = ctx.sources?.includes('twitter') || ctx.sources?.includes('telegram') || ctx.sources?.includes('whatsapp');
    const scrolledRecently = Date.now() - (ctx.lastSocialScrollMs ?? this.lastSocialScroll) < 5 * 60 * 1000;
    if (!viaTweet && !scrolledRecently) return null;
    return {
      type: 'tweet_trade', severity: 'medium', title: 'Tweet Trade',
      message: 'You\u2019re acting on a social-media tip. That\u2019s where pump-and-dumps live.',
      statistic: 'The tip is free because you are the exit liquidity.',
    };
  }

  private checkConcentration(ctx: PreTradeContext): BiasDetection | null {
    if (ctx.side !== 'buy') return null;
    const stock = marketEngine.getStock(ctx.symbol);
    if (!stock) return null;
    const sector = stock.sector;
    const holdings = portfolio.getHoldings();
    const sameSector = holdings.filter(h => marketEngine.getStock(h.symbol)?.sector === sector);
    if (sameSector.length < 3) return null;
    return {
      type: 'concentration', severity: 'medium', title: 'Concentration Risk',
      message: `You already hold ${sameSector.length} ${sector} names. Adding ${ctx.symbol} = one bet, not five.`,
      statistic: 'Sector-correlated positions move together in drawdowns. Diversify across sectors, not within one.',
    };
  }

  private countRecentLosses(txs: Transaction[]): number {
    const sells = txs.filter(t => t.side === 'sell').slice().reverse();
    let count = 0;
    for (const sell of sells) { if (this.wasSellALoss(sell) === true) count++; else break; }
    return count;
  }

  private countRecentWins(txs: Transaction[]): number {
    const sells = txs.filter(t => t.side === 'sell').slice().reverse();
    let count = 0;
    for (const sell of sells) { if (this.wasSellALoss(sell) === false) count++; else break; }
    return count;
  }

  private wasSellALoss(sell: Transaction): boolean | null {
    const all = portfolio.getTransactions();
    const priorBuys = all.filter(t => t.symbol === sell.symbol && t.side === 'buy' && t.timestamp < sell.timestamp);
    if (priorBuys.length === 0) return null;
    const avgBuy = priorBuys.reduce((s, t) => s + t.price * t.quantity, 0) / priorBuys.reduce((s, t) => s + t.quantity, 0);
    return sell.price < avgBuy;
  }

  private averageRecentTradeSize(txs: Transaction[]): number {
    const buys = txs.filter(t => t.side === 'buy');
    if (buys.length === 0) return 0;
    return buys.reduce((s, t) => s + t.price * t.quantity, 0) / buys.length;
  }

  onIntervention(fn: InterventionHandler): () => void {
    this.interventionHandlers.push(fn);
    return () => { this.interventionHandlers = this.interventionHandlers.filter(h => h !== fn); };
  }

  triggerIntervention(bias: BiasDetection): void {
    this.log('bias_detected', { type: bias.type, severity: bias.severity });
    this.interventionHandlers.forEach(h => h(bias));
  }

  getEvents(): BehaviorEvent[] { return this.events; }
  reset(): void { this.events = []; localStorage.removeItem(STORAGE_KEY); }
}

export const behaviorTracker = new BehaviorTracker();
(window as unknown as { behavior: BehaviorTracker }).behavior = behaviorTracker;
