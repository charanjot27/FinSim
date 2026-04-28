export interface PositionSizeInput {
  accountSize: number;
  riskPercent: number;
  entryPrice: number;
  stopPrice: number;
}

export interface PositionSizeResult {
  riskAmount: number;
  perShareRisk: number;
  maxShares: number;
  positionValue: number;
  leverageNeeded: number;
  ok: boolean;
  reason?: string;
}

export function positionSize({ accountSize, riskPercent, entryPrice, stopPrice }: PositionSizeInput): PositionSizeResult {
  const riskAmount = accountSize * (riskPercent / 100);
  const perShareRisk = Math.abs(entryPrice - stopPrice);
  if (perShareRisk <= 0) return {
    riskAmount, perShareRisk: 0, maxShares: 0, positionValue: 0, leverageNeeded: 0,
    ok: false, reason: 'Stop must differ from entry.',
  };
  const maxShares = Math.floor(riskAmount / perShareRisk);
  const positionValue = maxShares * entryPrice;
  const leverageNeeded = accountSize === 0 ? 0 : positionValue / accountSize;
  return {
    riskAmount, perShareRisk, maxShares, positionValue, leverageNeeded,
    ok: maxShares > 0,
    reason: maxShares <= 0 ? 'Risk budget too small for this stop distance.' : undefined,
  };
}

export function rMultiple(entry: number, exit: number, stop: number, side: 'long' | 'short' = 'long'): number {
  const risk = Math.abs(entry - stop);
  if (risk === 0) return 0;
  const pnl = side === 'long' ? exit - entry : entry - exit;
  return pnl / risk;
}

export interface ExpectancyInput {
  winRate: number;
  avgWinR: number;
  avgLossR: number;
}

export function expectancy({ winRate, avgWinR, avgLossR }: ExpectancyInput): number {
  return winRate * avgWinR - (1 - winRate) * avgLossR;
}

export function expectancyFromRs(rList: number[]): { E: number; winRate: number; avgWinR: number; avgLossR: number; trades: number } {
  if (rList.length === 0) return { E: 0, winRate: 0, avgWinR: 0, avgLossR: 0, trades: 0 };
  const wins = rList.filter(r => r > 0);
  const losses = rList.filter(r => r < 0);
  const winRate = wins.length / rList.length;
  const avgWinR = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLossR = losses.length ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;
  return { E: expectancy({ winRate, avgWinR, avgLossR }), winRate, avgWinR, avgLossR, trades: rList.length };
}

export function kelly(winRate: number, avgWin: number, avgLoss: number): number {
  if (avgLoss <= 0) return 0;
  const b = avgWin / avgLoss;
  return (b * winRate - (1 - winRate)) / b;
}

export function correlationWarning(correlations: { symbol: string; corr: number }[], threshold = 0.7): {
  clustered: string[]; message: string | null;
} {
  const clustered = correlations.filter(c => c.corr >= threshold).map(c => c.symbol);
  if (clustered.length < 2) return { clustered, message: null };
  return {
    clustered,
    message: `Your positions in ${clustered.join(', ')} are ${Math.round(threshold * 100)}%+ correlated. That's not ${clustered.length} bets — it's one bet.`,
  };
}

export function annualizedReturn(startEquity: number, endEquity: number, periods: number, periodsPerYear = 252): number {
  if (startEquity <= 0 || periods <= 0) return 0;
  return Math.pow(endEquity / startEquity, periodsPerYear / periods) - 1;
}
