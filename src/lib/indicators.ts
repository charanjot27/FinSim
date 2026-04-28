export function sma(values: number[], period: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : NaN);
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const out: number[] = [];
  const k = 2 / (period + 1);
  let prev = NaN;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(NaN); continue; }
    if (i === period - 1) {

      let sum = 0;
      for (let j = 0; j < period; j++) sum += values[j];
      prev = sum / period;
      out.push(prev);
      continue;
    }
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function rsi(values: number[], period = 14): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  if (values.length <= period) return out;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgG = gains / period, avgL = losses / period;
  out[period] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const fastE = ema(values, fast);
  const slowE = ema(values, slow);
  const macdLine = values.map((_, i) => (isNaN(fastE[i]) || isNaN(slowE[i])) ? NaN : fastE[i] - slowE[i]);

  const clean = macdLine.map(v => isNaN(v) ? 0 : v);
  const sig = ema(clean, signal).map((v, i) => isNaN(macdLine[i]) ? NaN : v);
  const hist = macdLine.map((m, i) => (isNaN(m) || isNaN(sig[i])) ? NaN : m - sig[i]);
  return { macd: macdLine, signal: sig, histogram: hist };
}

export function bollingerBands(values: number[], period = 20, mult = 2) {
  const mid = sma(values, period);
  const upper: number[] = [];
  const lower: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (isNaN(mid[i])) { upper.push(NaN); lower.push(NaN); continue; }
    const slice = values.slice(i - period + 1, i + 1);
    const mean = mid[i];
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper.push(mean + mult * sd);
    lower.push(mean - mult * sd);
  }
  return { upper, middle: mid, lower };
}

export function atr(candles: { high: number; low: number; close: number }[], period = 14): number[] {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (i === 0) { tr.push(c.high - c.low); continue; }
    const pc = candles[i - 1].close;
    tr.push(Math.max(c.high - c.low, Math.abs(c.high - pc), Math.abs(c.low - pc)));
  }
  return ema(tr, period);
}

export function logReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) out.push(Math.log(prices[i] / prices[i - 1]));
  return out;
}

export function annualizedVolatility(prices: number[], periodsPerYear = 252): number {
  const r = logReturns(prices);
  if (r.length < 2) return 0;
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  const variance = r.reduce((s, v) => s + (v - mean) ** 2, 0) / (r.length - 1);
  return Math.sqrt(variance * periodsPerYear);
}

export function maxDrawdown(equity: number[]): { maxDD: number; peakIdx: number; troughIdx: number } {
  let peak = equity[0] ?? 0, peakIdx = 0, maxDD = 0, troughIdx = 0;
  for (let i = 0; i < equity.length; i++) {
    if (equity[i] > peak) { peak = equity[i]; peakIdx = i; }
    const dd = peak === 0 ? 0 : (peak - equity[i]) / peak;
    if (dd > maxDD) { maxDD = dd; troughIdx = i; }
  }
  return { maxDD, peakIdx, troughIdx };
}

export function sharpe(returns: number[], rf = 0, periodsPerYear = 252): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const sd = Math.sqrt(returns.reduce((s, v) => s + (v - mean) ** 2, 0) / (returns.length - 1));
  if (sd === 0) return 0;
  return ((mean - rf / periodsPerYear) / sd) * Math.sqrt(periodsPerYear);
}

export function sortino(returns: number[], rf = 0, periodsPerYear = 252): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downsides = returns.filter(r => r < 0);
  if (downsides.length === 0) return Infinity;
  const dsd = Math.sqrt(downsides.reduce((s, v) => s + v * v, 0) / downsides.length);
  if (dsd === 0) return 0;
  return ((mean - rf / periodsPerYear) / dsd) * Math.sqrt(periodsPerYear);
}

export function calmar(equity: number[]): number {
  if (equity.length < 2) return 0;
  const { maxDD } = maxDrawdown(equity);
  if (maxDD === 0) return 0;
  const totalRet = equity[equity.length - 1] / equity[0] - 1;

  const years = equity.length / 252;
  const annRet = Math.pow(1 + totalRet, 1 / Math.max(years, 0.01)) - 1;
  return annRet / maxDD;
}

export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ax = a.slice(-n), bx = b.slice(-n);
  const meanA = ax.reduce((s, v) => s + v, 0) / n;
  const meanB = bx.reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const da = ax[i] - meanA, db = bx[i] - meanB;
    num += da * db; denA += da * da; denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

export function beta(assetReturns: number[], benchReturns: number[]): number {
  const n = Math.min(assetReturns.length, benchReturns.length);
  if (n < 2) return 0;
  const a = assetReturns.slice(-n), b = benchReturns.slice(-n);
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let cov = 0, varB = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - meanA) * (b[i] - meanB);
    varB += (b[i] - meanB) ** 2;
  }
  return varB === 0 ? 0 : cov / varB;
}

export function vwap(candles: { high: number; low: number; close: number; volume: number }[]): number {
  let sumPV = 0, sumV = 0;
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3;
    sumPV += tp * c.volume;
    sumV += c.volume;
  }
  return sumV === 0 ? 0 : sumPV / sumV;
}
