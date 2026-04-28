import type { BiasDetection, Transaction } from '@/types';
import { firebaseAuth } from '@/systems/FirebaseAuth';
import { portfolio } from '@/systems/PortfolioSystem';
import { biasProfile } from '@/systems/BiasProfile';
import { traderScore } from '@/systems/TraderScore';
import { getApp } from 'firebase/app';
import {
  getFunctions, httpsCallable, connectFunctionsEmulator,
  type Functions,
} from 'firebase/functions';

interface CoachInput {
  biasType: string;
  severity?: 'low' | 'medium' | 'high';
  symbol?: string;
  side?: 'buy' | 'sell';
  recentTrades?: Array<{ symbol: string; side: 'buy' | 'sell'; qty: number; pnlPct?: number }>;
  stats?: {
    winRatePct?: number;
    medianHoldMin?: number;
    biasTriggers30d?: number;
    fomoPercentile?: number;
    traderScore?: number;
    tier?: string;
  };
}
interface CoachResponse { message: string; cached: boolean; }

const REQUEST_TIMEOUT_MS = 4_000;
const SESSION_CACHE_TTL_MS = 30 * 60 * 1000;

class MiraCoachSystem {
  private functions: Functions | null = null;
  private cache = new Map<string, { msg: string; expiresAt: number }>();
  private inflight = new Map<string, Promise<string | null>>();

  private getFn(): Functions | null {
    if (this.functions) return this.functions;
    try {
      const app = getApp();
      const fns = getFunctions(app, 'us-central1');

      if (import.meta.env.VITE_FUNCTIONS_EMULATOR === 'true') {
        try { connectFunctionsEmulator(fns, '127.0.0.1', 5001); }
        catch {  }
      }
      this.functions = fns;
      return fns;
    } catch {
      return null;
    }
  }

  private hash(input: CoachInput): string {
    const b = {
      bias: input.biasType,
      sev: input.severity ?? 'medium',
      sym: input.symbol ?? '',
      side: input.side ?? '',
      wr: input.stats?.winRatePct != null ? Math.round(input.stats.winRatePct / 10) * 10 : null,
      fomo: input.stats?.fomoPercentile != null ? Math.round(input.stats.fomoPercentile / 20) * 20 : null,
      tier: input.stats?.tier ?? '',
      n: input.recentTrades?.length ?? 0,
    };
    return JSON.stringify(b);
  }

  private buildPayload(bias: BiasDetection, ctx?: { symbol?: string; side?: 'buy' | 'sell' }): CoachInput {
    const txs: Transaction[] = portfolio.getTransactions().slice(-8);
    const recentTrades = txs.map(t => ({
      symbol: t.symbol,
      side:   t.side === 'sell' ? 'sell' as const : 'buy' as const,
      qty:    t.quantity,

    }));

    const snap = biasProfile.get();
    const score = traderScore.get();

    return {
      biasType: bias.type,
      severity: bias.severity,
      symbol:   ctx?.symbol,
      side:     ctx?.side,
      recentTrades,
      stats: {
        medianHoldMin:   snap.avgHoldingMinutes,
        biasTriggers30d: snap.totalTriggers,
        fomoPercentile:  snap.fomoPercentile,
        traderScore:     score.total,
        tier:            score.tier,
      },
    };
  }

  async getCoachingMessage(
    bias: BiasDetection,
    ctx?: { symbol?: string; side?: 'buy' | 'sell' },
  ): Promise<string | null> {
    const auth = firebaseAuth.getState();
    if (auth.status !== 'signed-in') return null;

    const fn = this.getFn();
    if (!fn) return null;

    const payload = this.buildPayload(bias, ctx);
    const key = this.hash(payload);

    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.msg;

    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = this.callWithTimeout(fn, payload, key);
    this.inflight.set(key, promise);
    try { return await promise; }
    finally { this.inflight.delete(key); }
  }

  private async callWithTimeout(
    fn: Functions,
    payload: CoachInput,
    key: string,
  ): Promise<string | null> {
    try {
      const callable = httpsCallable<CoachInput, CoachResponse>(fn, 'miraCoach');
      const winner = await Promise.race([
        callable(payload).then(r => r.data),
        new Promise<null>(resolve => setTimeout(() => resolve(null), REQUEST_TIMEOUT_MS)),
      ]);
      if (!winner || !winner.message) return null;
      this.cache.set(key, {
        msg: winner.message,
        expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
      });
      return winner.message;
    } catch (err) {
      console.warn('[MiraCoach] call failed', err);
      return null;
    }
  }
}

export const miraCoach = new MiraCoachSystem();
(window as unknown as { miraCoach: MiraCoachSystem }).miraCoach = miraCoach;
