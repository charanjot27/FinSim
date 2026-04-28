import type { Lot } from '@/lib/taxes';
import { sellFIFO, taxUSCapGains, taxIndiaCapGains, type TaxCountry } from '@/lib/taxes';

const KEY = 'finsim.taxledger.v1';

interface LedgerState {
  lots: Lot[];
  realized: { symbol: string; year: number; shortTerm: number; longTerm: number; washSale: boolean; date: number }[];
}

class TaxLedgerSystem {
  private state: LedgerState = { lots: [], realized: [] };

  constructor() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.state = JSON.parse(raw);
    } catch {  }
  }

  addLot(symbol: string, quantity: number, costBasis: number): void {
    this.state.lots.push({ symbol, quantity, costBasis, purchasedAt: Date.now() });
    this.save();
  }

  sell(symbol: string, quantity: number, price: number, country: TaxCountry, recent: { side: 'buy' | 'sell'; symbol: string; timestamp: number }[]) {
    const lots = this.state.lots.filter(l => l.symbol === symbol);
    const result = sellFIFO(lots, quantity, price, Date.now(), country, recent);

    this.state.lots = this.state.lots.filter(l => l.quantity > 0);
    const year = new Date().getFullYear();
    this.state.realized.push({
      symbol, year,
      shortTerm: result.shortTermGain,
      longTerm:  result.longTermGain,
      washSale:  result.washSaleFlag,
      date: Date.now(),
    });
    this.save();
    return result;
  }

  getLots(symbol?: string): Lot[] {
    return symbol ? this.state.lots.filter(l => l.symbol === symbol) : [...this.state.lots];
  }

  getRealized(year?: number) {
    return year ? this.state.realized.filter(r => r.year === year) : [...this.state.realized];
  }

  projectTax(country: TaxCountry, year = new Date().getFullYear(), ordinaryIncome = 0) {
    const totals = this.getRealized(year).reduce((a, r) => ({
      shortTerm: a.shortTerm + r.shortTerm,
      longTerm:  a.longTerm + r.longTerm,
    }), { shortTerm: 0, longTerm: 0 });
    if (country === 'US') {
      return { ...totals, ...taxUSCapGains(totals.longTerm, totals.shortTerm, ordinaryIncome) };
    }
    return { ...totals, ...taxIndiaCapGains(totals.longTerm, totals.shortTerm) };
  }

  reset(): void {
    this.state = { lots: [], realized: [] };
    this.save();
  }

  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch {  }
  }
}

export const taxLedger = new TaxLedgerSystem();
(window as unknown as Record<string, unknown>).taxLedger = taxLedger;
