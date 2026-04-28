export interface LifeBasicsState {
  monthlyExpenses: number;
  emergencyFund: number;
  hasHealthInsurance: boolean;
  hasTermLife: boolean;
  highInterestDebt: number;
  creditScore: number;
  country: 'US' | 'IN';
}

export interface LifeBasicsReport {
  emergencyMonths: number;
  emergencyOk: boolean;
  debtBlocker: boolean;
  insuranceOk: boolean;
  creditOk: boolean;
  canInvestRiskCapital: boolean;
  messages: string[];
}

export function evaluateLifeBasics(s: LifeBasicsState): LifeBasicsReport {
  const emergencyMonths = s.monthlyExpenses === 0 ? Infinity : s.emergencyFund / s.monthlyExpenses;
  const emergencyOk = emergencyMonths >= 6;
  const debtBlocker = s.highInterestDebt > 0;
  const insuranceOk = s.hasHealthInsurance && s.hasTermLife;
  const creditOk = s.country === 'IN' ? s.creditScore >= 750 : s.creditScore >= 700;
  const messages: string[] = [];
  if (!emergencyOk) messages.push(`Build 6-month emergency fund first. You have ${emergencyMonths.toFixed(1)} months.`);
  if (debtBlocker) messages.push(`Kill high-interest debt (${s.highInterestDebt.toLocaleString()}) before investing — it beats any stock.`);
  if (!s.hasHealthInsurance) messages.push(`No health insurance = one hospital visit wipes out portfolio. Fix this.`);
  if (!s.hasTermLife) messages.push(`Term life (not ULIP) if you have dependents.`);
  if (!creditOk) messages.push(`Credit score below threshold — fix before leveraged strategies.`);
  return {
    emergencyMonths, emergencyOk, debtBlocker, insuranceOk, creditOk,
    canInvestRiskCapital: emergencyOk && !debtBlocker && insuranceOk,
    messages,
  };
}

export function sipFutureValue(monthlyContribution: number, annualReturn: number, years: number): number {
  const r = annualReturn / 12;
  const n = years * 12;
  if (r === 0) return monthlyContribution * n;
  return monthlyContribution * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

export function stepUpSIP(baseMonthly: number, stepPct: number, annualReturn: number, years: number): number {
  const r = annualReturn / 12;
  let total = 0;
  let pmt = baseMonthly;
  for (let y = 1; y <= years; y++) {
    const n = 12;
    let yearFV: number;
    if (r === 0) yearFV = pmt * n;
    else yearFV = pmt * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);

    total = total * Math.pow(1 + r, 12) + yearFV;
    pmt = pmt * (1 + stepPct);
  }
  return total;
}

export function fireNumber(annualSpend: number, swr = 0.04): number {
  return annualSpend / swr;
}

export function compound(pv: number, rate: number, years: number, compoundsPerYear = 1): number {
  const n = compoundsPerYear * years;
  return pv * Math.pow(1 + rate / compoundsPerYear, n);
}

export function budget503020(monthlyIncome: number) {
  return { needs: monthlyIncome * 0.5, wants: monthlyIncome * 0.3, savings: monthlyIncome * 0.2 };
}
