export function gbmStep(
  currentPrice: number,
  drift: number,
  volatility: number,
  dtSeconds: number
): number {
  const dt = dtSeconds / (365 * 24 * 60 * 60);
  const z = boxMuller();
  const drift_term = (drift - 0.5 * volatility * volatility) * dt;
  const diffusion_term = volatility * Math.sqrt(dt) * z;
  return currentPrice * Math.exp(drift_term + diffusion_term);
}

export function boxMuller(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function sharpeRatio(
  returns: number[],
  riskFreeRate = 0.04
): number {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  const stddev = Math.sqrt(variance);
  if (stddev === 0) return 0;
  return (mean - riskFreeRate) / stddev;
}

export function kellyFraction(
  winProbability: number,
  winAmount: number,
  lossAmount: number
): number {
  const b = winAmount / lossAmount;
  const q = 1 - winProbability;
  return (b * winProbability - q) / b;
}

export function expectedValue(
  outcomes: { probability: number; payoff: number }[]
): number {
  return outcomes.reduce((sum, o) => sum + o.probability * o.payoff, 0);
}

export function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const slice = values.slice(i - period + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / period);
    }
  }
  return result;
}

export function rsi(values: number[], period = 14): number[] {
  const result: number[] = [NaN];
  const gains: number[] = [0];
  const losses: number[] = [0];
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  for (let i = 1; i < values.length; i++) {
    if (i < period) {
      result.push(NaN);
      continue;
    }
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    if (avgLoss === 0) result.push(100);
    else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

export function ammSwap(
  reserveIn: number,
  reserveOut: number,
  amountIn: number,
  feeBps = 30
): { amountOut: number; priceImpact: number; newReserveIn: number; newReserveOut: number } {
  const amountInAfterFee = amountIn * (10000 - feeBps) / 10000;
  const k = reserveIn * reserveOut;
  const newReserveIn = reserveIn + amountInAfterFee;
  const newReserveOut = k / newReserveIn;
  const amountOut = reserveOut - newReserveOut;
  const priceBefore = reserveOut / reserveIn;
  const priceAfter = newReserveOut / newReserveIn;
  const priceImpact = (priceBefore - priceAfter) / priceBefore;
  return { amountOut, priceImpact, newReserveIn, newReserveOut };
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (abs >= 1e7) return `${sign}${symbol}${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}${symbol}${(abs / 1e5).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}${symbol}${Math.floor(abs).toLocaleString('en-IN')}`;
  return `${sign}${symbol}${abs.toFixed(2)}`;
}

export function formatPct(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}
