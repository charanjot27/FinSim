const FINNHUB_KEY     = import.meta.env.VITE_FINNHUB_KEY as string | undefined;
const ALPHA_KEY       = import.meta.env.VITE_ALPHAVANTAGE_KEY as string | undefined;

export interface LiveQuote {
  symbol: string;
  price: number;
  prevClose: number;
  high?: number;
  low?: number;
  open?: number;
  currency?: string;
  provider: 'finnhub' | 'yahoo' | 'alpha' | 'coingecko';
  fetchedAt: number;
}

export interface LiveCandle { time: number; open: number; high: number; low: number; close: number; volume: number; }

const CG_BASE = 'https://api.coingecko.com/api/v3';
const COIN_MAP: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', AVAX: 'avalanche-2',
  MATIC: 'matic-network', LINK: 'chainlink', DOT: 'polkadot', UNI: 'uniswap',
};

export async function fetchCoinGeckoTop(limit = 20): Promise<LiveQuote[]> {
  const url = `${CG_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const arr = await res.json() as Array<{ symbol: string; current_price: number; high_24h: number; low_24h: number; price_change_24h: number; }>;
  const now = Date.now();
  return arr.map(c => ({
    symbol: c.symbol.toUpperCase(),
    price: c.current_price,
    prevClose: c.current_price - c.price_change_24h,
    high: c.high_24h,
    low: c.low_24h,
    currency: '$',
    provider: 'coingecko',
    fetchedAt: now,
  }));
}

export async function fetchCoinCandles(symbolOrId: string, days = 30): Promise<LiveCandle[]> {
  const id = COIN_MAP[symbolOrId.toUpperCase()] ?? symbolOrId.toLowerCase();
  const url = `${CG_BASE}/coins/${id}/ohlc?vs_currency=usd&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko ohlc ${res.status}`);
  const arr = await res.json() as Array<[number, number, number, number, number]>;
  return arr.map(([t, o, h, l, c]) => ({ time: t, open: o, high: h, low: l, close: c, volume: 0 }));
}

const FH_BASE = 'https://finnhub.io/api/v1';

export async function fetchFinnhubQuote(symbol: string): Promise<LiveQuote | null> {
  if (!FINNHUB_KEY) return null;
  const res = await fetch(`${FH_BASE}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
  if (!res.ok) return null;
  const d = await res.json() as { c: number; h: number; l: number; o: number; pc: number; };
  if (!d.c) return null;
  return {
    symbol, price: d.c, prevClose: d.pc, high: d.h, low: d.l, open: d.o,
    currency: '$', provider: 'finnhub', fetchedAt: Date.now(),
  };
}

const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function fetchYahooQuote(symbol: string): Promise<LiveQuote | null> {
  try {
    const res = await fetch(`${YF_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=2d`);
    if (!res.ok) return null;
    const json = await res.json() as {
      chart: { result: { meta: { regularMarketPrice: number; chartPreviousClose: number; currency: string; regularMarketDayHigh?: number; regularMarketDayLow?: number; regularMarketOpen?: number; } }[] }
    };
    const m = json.chart?.result?.[0]?.meta;
    if (!m) return null;
    return {
      symbol,
      price: m.regularMarketPrice,
      prevClose: m.chartPreviousClose,
      high: m.regularMarketDayHigh,
      low: m.regularMarketDayLow,
      open: m.regularMarketOpen,
      currency: m.currency === 'INR' ? '\u20b9' : '$',
      provider: 'yahoo',
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export async function fetchYahooCandles(symbol: string, interval = '1d', range = '3mo'): Promise<LiveCandle[]> {
  const res = await fetch(`${YF_BASE}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`);
  if (!res.ok) return [];
  const json = await res.json() as {
    chart: { result: { timestamp: number[]; indicators: { quote: { open: number[]; high: number[]; low: number[]; close: number[]; volume: number[]; }[] } }[] }
  };
  const r = json.chart?.result?.[0];
  if (!r) return [];
  const q = r.indicators.quote[0];
  return r.timestamp.map((t, i) => ({
    time: t * 1000, open: q.open[i], high: q.high[i], low: q.low[i], close: q.close[i], volume: q.volume[i],
  })).filter(c => Number.isFinite(c.close));
}

const AV_BASE = 'https://www.alphavantage.co/query';
export async function fetchAlphaQuote(symbol: string): Promise<LiveQuote | null> {
  if (!ALPHA_KEY) return null;
  const res = await fetch(`${AV_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_KEY}`);
  if (!res.ok) return null;
  const d = await res.json() as { 'Global Quote'?: Record<string, string> };
  const g = d['Global Quote']; if (!g) return null;
  const price = parseFloat(g['05. price']);
  if (!Number.isFinite(price)) return null;
  return {
    symbol,
    price,
    prevClose: parseFloat(g['08. previous close']),
    high: parseFloat(g['03. high']),
    low: parseFloat(g['04. low']),
    open: parseFloat(g['02. open']),
    currency: '$',
    provider: 'alpha',
    fetchedAt: Date.now(),
  };
}

export async function fetchLiveQuote(symbol: string): Promise<LiveQuote | null> {
  try {
    const fh = await fetchFinnhubQuote(symbol);
    if (fh) return fh;
  } catch {  }
  try {
    const yh = await fetchYahooQuote(symbol);
    if (yh) return yh;
  } catch {  }
  try {
    const av = await fetchAlphaQuote(symbol);
    if (av) return av;
  } catch {  }
  return null;
}

export async function fetchLiveBatch(symbols: string[], concurrency = 4): Promise<(LiveQuote | null)[]> {
  const results: (LiveQuote | null)[] = new Array(symbols.length).fill(null);
  let idx = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (idx < symbols.length) {
      const my = idx++;
      results[my] = await fetchLiveQuote(symbols[my]);
    }
  });
  await Promise.all(workers);
  return results;
}
