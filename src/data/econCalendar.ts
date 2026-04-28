export interface EconEvent {
  id: string;
  region: 'US' | 'IN' | 'EU' | 'CN';
  title: string;
  category: 'rates' | 'cpi' | 'jobs' | 'gdp' | 'earnings' | 'meeting' | 'other';
  impact: 'low' | 'med' | 'high';
  datetime: number;
  blurb: string;
}

const DAY = 86400000;
const HOUR = 3600000;

export function getUpcomingEconEvents(now: number = Date.now()): EconEvent[] {
  const nextFirstWed = nextWeekdayAt(now, 3, 14, 0);
  const nextCPIDay = nextWeekdayAt(now, 2, 8, 30);
  const nextNFPDay = nextFridayAt(now, 8, 30);
  const nextRBIDay = nextWeekdayAt(now, 4, 10, 0);
  const events: EconEvent[] = [
    { id: 'fomc', region: 'US', title: 'FOMC Rate Decision', category: 'rates', impact: 'high',
      datetime: nextFirstWed, blurb: 'Fed funds rate + dot plot + Powell presser. Biggest macro event of the cycle.' },
    { id: 'cpi', region: 'US', title: 'US CPI (YoY + Core)', category: 'cpi', impact: 'high',
      datetime: nextCPIDay, blurb: 'Headline & core CPI drive rate expectations. Trades in first 30 min are roulette.' },
    { id: 'nfp', region: 'US', title: 'Non-Farm Payrolls', category: 'jobs', impact: 'high',
      datetime: nextNFPDay, blurb: 'Jobs, unemployment rate, avg hourly earnings. First Friday of the month.' },
    { id: 'rbi_mpc', region: 'IN', title: 'RBI MPC Decision', category: 'rates', impact: 'high',
      datetime: nextRBIDay, blurb: 'Indian repo rate + governor commentary. Moves HDFCBANK, ICICIBANK most.' },
    { id: 'ind_cpi', region: 'IN', title: 'India CPI Inflation', category: 'cpi', impact: 'med',
      datetime: now + 5 * DAY + 10 * HOUR, blurb: 'Monthly CPI print. >6% breaches RBI upper tolerance band.' },
    { id: 'ecb', region: 'EU', title: 'ECB Rate Decision', category: 'rates', impact: 'high',
      datetime: now + 14 * DAY, blurb: 'Lagarde presser follows. EUR volatility spike.' },
    { id: 'pmi_cn', region: 'CN', title: 'China PMI', category: 'other', impact: 'med',
      datetime: now + 3 * DAY + 2 * HOUR, blurb: 'Manufacturing & services PMI. Moves copper, iron ore, miners.' },
    { id: 'retail_sales', region: 'US', title: 'US Retail Sales', category: 'other', impact: 'med',
      datetime: now + 6 * DAY + 13 * HOUR, blurb: 'Consumer health barometer. Moves WMT, AMZN, TGT.' },
  ];
  return events.sort((a, b) => a.datetime - b.datetime);
}

export function withinEventWindow(now: number, mins = 30): EconEvent | null {
  const events = getUpcomingEconEvents(now);
  const window = mins * 60 * 1000;
  for (const e of events) {
    if (e.impact !== 'high') continue;
    if (Math.abs(e.datetime - now) <= window) return e;
  }
  return null;
}

function nextWeekdayAt(from: number, dayOfWeek: number, hour: number, minute: number): number {
  const d = new Date(from);
  const diff = (dayOfWeek + 7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

function nextFridayAt(from: number, hour: number, minute: number): number {
  return nextWeekdayAt(from, 5, hour, minute);
}
