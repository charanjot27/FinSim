export type TaxCountry = 'US' | 'IN';

export interface Lot {
  symbol: string;
  quantity: number;
  costBasis: number;
  purchasedAt: number;
}

export interface SellResult {
  lotsConsumed: { lot: Lot; qty: number; proceeds: number; cost: number; gain: number; heldDays: number; isLTCG: boolean }[];
  totalGain: number;
  shortTermGain: number;
  longTermGain: number;
  washSaleFlag: boolean;
}

export function sellFIFO(
  lots: Lot[], sellQty: number, sellPrice: number, sellAt: number, country: TaxCountry,
  recentOpposite: { side: 'buy' | 'sell'; symbol: string; timestamp: number }[] = [],
): SellResult {
  const out: SellResult = {
    lotsConsumed: [], totalGain: 0, shortTermGain: 0, longTermGain: 0, washSaleFlag: false,
  };
  let remaining = sellQty;
  const ordered = [...lots].sort((a, b) => a.purchasedAt - b.purchasedAt);
  for (const lot of ordered) {
    if (remaining <= 0) break;
    if (lot.quantity <= 0) continue;
    const qty = Math.min(lot.quantity, remaining);
    const proceeds = qty * sellPrice;
    const cost = qty * lot.costBasis;
    const gain = proceeds - cost;
    const heldDays = (sellAt - lot.purchasedAt) / 86400000;
    const isLTCG = isLongTerm(heldDays, country);
    out.lotsConsumed.push({ lot, qty, proceeds, cost, gain, heldDays, isLTCG });
    out.totalGain += gain;
    if (isLTCG) out.longTermGain += gain; else out.shortTermGain += gain;
    lot.quantity -= qty;
    remaining -= qty;
  }

  if (country === 'US' && out.totalGain < 0) {
    const symbol = ordered[0]?.symbol;
    const window = 30 * 86400000;
    out.washSaleFlag = recentOpposite.some(t =>
      t.side === 'buy' && t.symbol === symbol && Math.abs(t.timestamp - sellAt) <= window,
    );
  }
  return out;
}

export function isLongTerm(heldDays: number, country: TaxCountry): boolean {
  if (country === 'US') return heldDays >= 365;

  return heldDays >= 365;
}

export function taxUSCapGains(ltcg: number, stcg: number, ordinaryIncome = 0): { ltcgTax: number; stcgTax: number; total: number; bracketLT: string } {

  const totalIncome = ordinaryIncome + ltcg;
  let ltRate = 0; let bracket = '0%';
  if (totalIncome > 518900) { ltRate = 0.2; bracket = '20%'; }
  else if (totalIncome > 47025) { ltRate = 0.15; bracket = '15%'; }

  let stRate = 0.22;
  if (ordinaryIncome <= 11600) stRate = 0.10;
  else if (ordinaryIncome <= 47150) stRate = 0.12;
  else if (ordinaryIncome <= 100525) stRate = 0.22;
  else if (ordinaryIncome <= 191950) stRate = 0.24;
  else if (ordinaryIncome <= 243725) stRate = 0.32;
  else if (ordinaryIncome <= 609350) stRate = 0.35;
  else stRate = 0.37;
  const ltcgTax = Math.max(0, ltcg) * ltRate;
  const stcgTax = Math.max(0, stcg) * stRate;
  return { ltcgTax, stcgTax, total: ltcgTax + stcgTax, bracketLT: bracket };
}

export function taxIndiaCapGains(ltcg: number, stcg: number): { ltcgTax: number; stcgTax: number; total: number } {

  const exemption = 125000;
  const taxableLT = Math.max(0, ltcg - exemption);
  const ltcgTax = taxableLT * 0.125;
  const stcgTax = Math.max(0, stcg) * 0.20;
  return { ltcgTax, stcgTax, total: ltcgTax + stcgTax };
}

export function harvestCandidates(holdings: { symbol: string; unrealizedPL: number }[], minLoss = 500): typeof holdings {
  return holdings.filter(h => h.unrealizedPL <= -minLoss).sort((a, b) => a.unrealizedPL - b.unrealizedPL);
}

export function india80CRemaining(contributions: { elss?: number; ppf?: number; nps?: number; epf?: number; lifeIns?: number; others?: number } = {}): number {
  const used = (contributions.elss ?? 0) + (contributions.ppf ?? 0) + (contributions.nps ?? 0) +
               (contributions.epf ?? 0) + (contributions.lifeIns ?? 0) + (contributions.others ?? 0);
  return Math.max(0, 150000 - used);
}
