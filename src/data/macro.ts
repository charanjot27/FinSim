export interface YieldCurvePoint { tenor: string; yield: number; }

export function sampleUSYieldCurve(): YieldCurvePoint[] {
  return [
    { tenor: '1M', yield: 5.38 },
    { tenor: '3M', yield: 5.33 },
    { tenor: '6M', yield: 5.15 },
    { tenor: '1Y', yield: 4.90 },
    { tenor: '2Y', yield: 4.45 },
    { tenor: '5Y', yield: 4.20 },
    { tenor: '10Y', yield: 4.28 },
    { tenor: '30Y', yield: 4.50 },
  ];
}

export function sampleIndiaYieldCurve(): YieldCurvePoint[] {
  return [
    { tenor: '3M', yield: 6.65 },
    { tenor: '6M', yield: 6.72 },
    { tenor: '1Y', yield: 6.80 },
    { tenor: '2Y', yield: 6.92 },
    { tenor: '5Y', yield: 7.05 },
    { tenor: '10Y', yield: 7.15 },
    { tenor: '30Y', yield: 7.30 },
  ];
}

export function isInverted(curve: YieldCurvePoint[]): { inverted: boolean; spread2s10s: number } {
  const y2 = curve.find(p => p.tenor === '2Y')?.yield ?? 0;
  const y10 = curve.find(p => p.tenor === '10Y')?.yield ?? 0;
  return { inverted: y10 < y2, spread2s10s: y10 - y2 };
}

export interface MacroSnapshot {
  vix: number;
  move: number;
  dxy: number;
  tenYReal: number;
  hyOAS: number;
  wti: number;
  gold: number;
  copper: number;
  btc: number;
  fomcProbHike: number;
}

export function sampleMacroSnapshot(): MacroSnapshot {
  return {
    vix: 13.8,
    move: 95.2,
    dxy: 104.35,
    tenYReal: 1.82,
    hyOAS: 315,
    wti: 78.40,
    gold: 2345.50,
    copper: 4.42,
    btc: 65420,
    fomcProbHike: 0.12,
  };
}

export function regimeRead(m: MacroSnapshot): { regime: string; note: string; color: string } {
  if (m.vix > 25 && m.hyOAS > 500) return { regime: 'Risk-Off', note: 'Vol up, credit stressed. Defensive tilt.', color: '#E04A3C' };
  if (m.vix < 15 && m.hyOAS < 350) return { regime: 'Risk-On', note: 'Low vol, tight credit. Carry trades working.', color: '#4FD27A' };
  if (m.copper > 4.5 && m.wti > 80) return { regime: 'Reflation', note: 'Commodities bid. Industrials + energy.', color: '#F4C542' };
  return { regime: 'Mixed', note: 'No clear regime. Tighten stops.', color: '#B074FF' };
}
