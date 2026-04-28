export interface DCFInput {
  fcf0: number;
  growthY1to5: number;
  growthTerminal: number;
  wacc: number;
  shares: number;
  netCash?: number;
  years?: number;
}

export interface DCFResult {
  fairValuePerShare: number;
  enterpriseValue: number;
  equityValue: number;
  pvExplicit: number;
  pvTerminal: number;
  terminalValue: number;
  projection: { year: number; fcf: number; pv: number }[];
}

export function dcf({ fcf0, growthY1to5, growthTerminal, wacc, shares, netCash = 0, years = 5 }: DCFInput): DCFResult {
  if (wacc <= growthTerminal) {

    return {
      fairValuePerShare: 0, enterpriseValue: 0, equityValue: 0,
      pvExplicit: 0, pvTerminal: 0, terminalValue: 0, projection: [],
    };
  }
  const projection: { year: number; fcf: number; pv: number }[] = [];
  let fcf = fcf0;
  let pvExplicit = 0;
  for (let t = 1; t <= years; t++) {
    fcf = fcf * (1 + growthY1to5);
    const pv = fcf / Math.pow(1 + wacc, t);
    projection.push({ year: t, fcf, pv });
    pvExplicit += pv;
  }
  const terminalFCF = fcf * (1 + growthTerminal);
  const terminalValue = terminalFCF / (wacc - growthTerminal);
  const pvTerminal = terminalValue / Math.pow(1 + wacc, years);
  const enterpriseValue = pvExplicit + pvTerminal;
  const equityValue = enterpriseValue + netCash;
  return {
    fairValuePerShare: shares > 0 ? equityValue / shares : 0,
    enterpriseValue, equityValue, pvExplicit, pvTerminal, terminalValue, projection,
  };
}

export function comps(target: { eps: number; ebitda: number; revenue: number; bookValue: number; price: number; shares: number }, peers: { pe: number; evEbitda: number; ps: number; pb: number }[]) {
  const mean = (k: keyof typeof peers[number]) => peers.reduce((s, p) => s + p[k], 0) / Math.max(peers.length, 1);
  const pe = mean('pe'), evEb = mean('evEbitda'), ps = mean('ps'), pb = mean('pb');
  return {
    impliedByPE: target.eps * pe,
    impliedByEVEBITDA: (target.ebitda * evEb) / Math.max(target.shares, 1),
    impliedByPS: (target.revenue * ps) / Math.max(target.shares, 1),
    impliedByPB: target.bookValue * pb,
    peerAvgPE: pe, peerAvgEVEBITDA: evEb, peerAvgPS: ps, peerAvgPB: pb,
  };
}

export function dupont(netIncome: number, revenue: number, assets: number, equity: number) {
  const netMargin = revenue === 0 ? 0 : netIncome / revenue;
  const assetTurnover = assets === 0 ? 0 : revenue / assets;
  const equityMultiplier = equity === 0 ? 0 : assets / equity;
  const roe = netMargin * assetTurnover * equityMultiplier;
  return { roe, netMargin, assetTurnover, equityMultiplier };
}

export interface RedFlagInput {
  revenueGrowth: number;
  accountsReceivableGrowth: number;
  cashFromOps: number;
  netIncome: number;
  auditorChanged: boolean;
  cfoDeparted: boolean;
  relatedPartyTxns: number;
  insiderSellingDollars: number;
  shortInterestPct: number;
  daysToCover: number;
}

export function redFlags(x: RedFlagInput): { flag: string; severity: 'low' | 'med' | 'high'; why: string }[] {
  const out: { flag: string; severity: 'low' | 'med' | 'high'; why: string }[] = [];
  if (x.accountsReceivableGrowth > x.revenueGrowth * 1.5 && x.revenueGrowth > 0) {
    out.push({ flag: 'Aggressive revenue recognition', severity: 'high',
      why: `AR growing ${((x.accountsReceivableGrowth) * 100).toFixed(0)}% vs revenue ${((x.revenueGrowth) * 100).toFixed(0)}% — channel stuffing risk.` });
  }
  if (x.netIncome > 0 && x.cashFromOps < x.netIncome * 0.5) {
    out.push({ flag: 'Earnings not converting to cash', severity: 'high',
      why: 'CFO < 50% of net income. Accrual earnings unsupported by cash.' });
  }
  if (x.auditorChanged) out.push({ flag: 'Auditor change', severity: 'med', why: 'Recent auditor change — enhanced scrutiny warranted.' });
  if (x.cfoDeparted) out.push({ flag: 'CFO departure', severity: 'med', why: 'CFO exit often precedes restatements.' });
  if (x.relatedPartyTxns >= 3) out.push({ flag: 'Related-party transactions', severity: 'med', why: `${x.relatedPartyTxns} related-party deals — check pricing and governance.` });
  if (x.shortInterestPct > 0.15) out.push({ flag: 'High short interest', severity: 'low', why: `${(x.shortInterestPct * 100).toFixed(1)}% short — crowded short or conviction bears.` });
  if (x.daysToCover > 10) out.push({ flag: 'Squeeze risk', severity: 'low', why: `${x.daysToCover.toFixed(1)} days-to-cover — squeeze setup.` });
  if (x.insiderSellingDollars > 10_000_000) out.push({ flag: 'Heavy insider selling', severity: 'med', why: `$${(x.insiderSellingDollars / 1e6).toFixed(1)}M insider sales.` });
  return out;
}
