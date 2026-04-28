import { behaviorTracker } from './BehaviorTracker';
import { portfolio } from './PortfolioSystem';
import type { Transaction } from '@/types';

export interface BiasProfileSnapshot {
  totalTriggers: number;
  byBias: Record<string, number>;
  topBias: { type: string; label: string; count: number } | null;
  fomoPercentile: number;
  patienceScore: number;
  dispositionRatio: number;
  avgHoldingMinutes: number;
  insights: string[];
}

const BIAS_LABELS: Record<string, string> = {
  fomo: 'FOMO Buying',
  revenge_trading: 'Revenge Trading',
  overconfidence: 'Overconfidence',
  naked_trade: 'No-Stop Trading',
  news_roulette: 'News Roulette',
  tweet_trade: 'Social Tip Trading',
  concentration: 'Sector Concentration',
};

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function computeAvgHoldingMinutes(txs: Transaction[]): number {

  const buysBySym: Record<string, Transaction[]> = {};
  const holdMs: number[] = [];
  for (const t of txs) {
    if (t.side === 'buy') {
      (buysBySym[t.symbol] ??= []).push(t);
    } else {
      const buys = buysBySym[t.symbol];
      if (!buys || buys.length === 0) continue;
      const buy = buys.shift();
      if (buy) holdMs.push(t.timestamp - buy.timestamp);
    }
  }
  if (holdMs.length === 0) return 0;
  return Math.round(median(holdMs) / 60_000);
}

function computeDispositionRatio(txs: Transaction[]): number {

  let winSum = 0, winN = 0, lossSum = 0, lossN = 0;
  for (const t of txs) {
    if (t.side !== 'sell') continue;
    const priorBuys = txs.filter(b => b.symbol === t.symbol && b.side === 'buy' && b.timestamp < t.timestamp);
    if (priorBuys.length === 0) continue;
    const avgBuy = priorBuys.reduce((a, b) => a + b.price * b.quantity, 0) /
                   priorBuys.reduce((a, b) => a + b.quantity, 0);
    if (avgBuy === 0) continue;
    const pct = ((t.price - avgBuy) / avgBuy) * 100;
    if (pct >= 0) { winSum += pct; winN++; } else { lossSum += pct; lossN++; }
  }
  if (winN === 0 || lossN === 0) return 1;
  const avgWin = winSum / winN;
  const avgLoss = -(lossSum / lossN);
  if (avgLoss === 0) return avgWin > 0 ? 2 : 1;

  return Math.min(5, +(avgLoss / avgWin).toFixed(2));
}

export class BiasProfileSystem {
  get(): BiasProfileSnapshot {
    const events = behaviorTracker.getEvents();
    const txs = portfolio.getTransactions();
    const triggers = events.filter(e => e.eventType === 'bias_detected');

    const byBias: Record<string, number> = {};
    for (const t of triggers) {
      const type = String((t.payload as Record<string, unknown>)?.type ?? 'unknown');
      byBias[type] = (byBias[type] ?? 0) + 1;
    }

    let topBias: BiasProfileSnapshot['topBias'] = null;
    let topCount = 0;
    for (const [type, count] of Object.entries(byBias)) {
      if (count > topCount) {
        topCount = count;
        topBias = { type, count, label: BIAS_LABELS[type] ?? type };
      }
    }

    const fomoCount = byBias.fomo ?? 0;
    const tradeCount = Math.max(1, txs.length);
    const fomoRate = fomoCount / tradeCount;

    const fomoPercentile = Math.round(Math.min(100, Math.max(5, (fomoRate / 0.18) * 50)));

    const avgHoldingMinutes = computeAvgHoldingMinutes(txs);

    const patienceScore = Math.round(Math.min(95, Math.max(5, (avgHoldingMinutes / 240) * 95)));

    const dispositionRatio = computeDispositionRatio(txs);

    const insights: string[] = [];
    if (topBias && topBias.count >= 3) {
      insights.push(`Your most frequent bias is ${topBias.label}. Set a 60-second cooling-off rule before triggers.`);
    }
    if (fomoPercentile >= 70) {
      insights.push(`You're in the top ${100 - fomoPercentile}% for FOMO — wait for a 30-min retracement before chasing pumps.`);
    }
    if (dispositionRatio > 1.4) {
      insights.push(`Disposition ratio ${dispositionRatio.toFixed(2)} — you cut winners too early and ride losers. Set targets, not feelings.`);
    } else if (dispositionRatio < 0.7 && txs.length > 6) {
      insights.push(`Disposition ratio ${dispositionRatio.toFixed(2)} — you let winners run. Pro behaviour.`);
    }
    if (patienceScore < 25 && txs.length > 4) {
      insights.push(`Median hold ${avgHoldingMinutes} min — too short. Long-term wealth lives in 6+ hour holds.`);
    }
    if (insights.length === 0) {
      insights.push(`Trade more to unlock a personalized bias profile. Each bias trigger is logged anonymously.`);
    }

    return {
      totalTriggers: triggers.length,
      byBias,
      topBias,
      fomoPercentile,
      patienceScore,
      dispositionRatio,
      avgHoldingMinutes,
      insights,
    };
  }

  static labels(): Record<string, string> { return BIAS_LABELS; }
}

export const biasProfile = new BiasProfileSystem();
(window as unknown as { biasProfile: BiasProfileSystem }).biasProfile = biasProfile;
