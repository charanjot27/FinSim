function normCDF(x: number): number {

  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return 0.5 * (1 + sign * y);
}

function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface BSInput {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  type: 'call' | 'put';
}

export interface Greeks {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export function blackScholes({ S, K, T, r, sigma, type }: BSInput): Greeks {
  if (T <= 0 || sigma <= 0) {
    const intrinsic = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
    return { price: intrinsic, delta: intrinsic > 0 ? (type === 'call' ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const Nd1 = normCDF(d1), Nd2 = normCDF(d2);
  const pdf1 = normPDF(d1);
  if (type === 'call') {
    const price = S * Nd1 - K * Math.exp(-r * T) * Nd2;
    return {
      price,
      delta: Nd1,
      gamma: pdf1 / (S * sigma * Math.sqrt(T)),
      theta: -(S * pdf1 * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2,
      vega:  S * pdf1 * Math.sqrt(T),
      rho:   K * T * Math.exp(-r * T) * Nd2,
    };
  } else {
    const price = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
    return {
      price,
      delta: Nd1 - 1,
      gamma: pdf1 / (S * sigma * Math.sqrt(T)),
      theta: -(S * pdf1 * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normCDF(-d2),
      vega:  S * pdf1 * Math.sqrt(T),
      rho:  -K * T * Math.exp(-r * T) * normCDF(-d2),
    };
  }
}

export function impliedVolatility(
  targetPrice: number, S: number, K: number, T: number, r: number, type: 'call' | 'put',
): number {
  let lo = 0.0001, hi = 5.0;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const { price } = blackScholes({ S, K, T, r, sigma: mid, type });
    if (Math.abs(price - targetPrice) < 1e-4) return mid;
    if (price > targetPrice) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

export interface Leg { type: 'call' | 'put'; side: 'long' | 'short'; strike: number; premium: number; qty: number; }

export function strategyPayoff(legs: Leg[], spots: number[]): { spot: number; payoff: number }[] {
  const netPremium = legs.reduce((s, l) => s + (l.side === 'long' ? -l.premium : l.premium) * l.qty, 0);
  return spots.map(S => {
    let intrinsic = 0;
    for (const l of legs) {
      const v = l.type === 'call' ? Math.max(0, S - l.strike) : Math.max(0, l.strike - S);
      intrinsic += (l.side === 'long' ? v : -v) * l.qty;
    }
    return { spot: S, payoff: intrinsic + netPremium };
  });
}

export const STRATEGIES = {
  bull_call: 'Long lower-strike call + short higher-strike call. Debit. Limited risk, limited reward.',
  bear_put: 'Long higher-strike put + short lower-strike put. Debit. Profits on the way down.',
  iron_condor: 'Short OTM put + long further OTM put + short OTM call + long further OTM call. Credit, range-bound.',
  straddle: 'Long ATM call + long ATM put. Debit. Profits on big moves either direction.',
  strangle: 'Long OTM call + long OTM put. Cheaper straddle, needs bigger move.',
  butterfly: 'Body + two wings (1:2:1). Low debit, max profit at body strike.',
  calendar: 'Short near-term + long far-term same strike. Theta harvesting.',
  covered_call: 'Own 100 shares + short OTM call. Yield strategy, capped upside.',
  cash_secured_put: 'Short OTM put with cash to buy 100 shares if assigned. Get paid to wait.',
  wheel: 'Cash-secured puts → if assigned, covered calls on shares → repeat.',
} as const;
