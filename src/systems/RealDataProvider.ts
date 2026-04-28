const NEWS_KEY      = import.meta.env.VITE_NEWSAPI_KEY as string | undefined;
const MARKETAUX_KEY = import.meta.env.VITE_MARKETAUX_KEY as string | undefined;
const FRED_KEY      = import.meta.env.VITE_FRED_KEY as string | undefined;

export interface RealNewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary?: string;
  tickers?: string[];
  tier: 'wire' | 'primary' | 'tv' | 'social' | 'transcript' | 'unknown';
}

export interface RealMacroPoint {
  series: string;
  label: string;
  value: number;
  unit: string;
  asOf: string;
  source: string;
  commentary: string;
}

export interface WorldBankPoint {
  country: string;
  indicator: string;
  value: number;
  year: number;
}

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;
function memo<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return Promise.resolve(hit.data as T);
  return fn().then(d => { cache.set(key, { at: Date.now(), data: d }); return d; });
}

async function fetchNewsAPI(): Promise<RealNewsItem[]> {
  if (!NEWS_KEY) throw new Error('no-key');
  const url = `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=20&apiKey=${NEWS_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NewsAPI ${res.status}`);
  const data = await res.json() as { articles: Array<{ title: string; source: { name: string }; url: string; publishedAt: string; description?: string }> };
  return (data.articles || []).map(a => ({
    title: a.title,
    source: a.source?.name ?? 'Unknown',
    url: a.url,
    publishedAt: a.publishedAt,
    summary: a.description,
    tier: classifyTier(a.source?.name ?? ''),
  }));
}

async function fetchMarketaux(symbols?: string): Promise<RealNewsItem[]> {
  if (!MARKETAUX_KEY) throw new Error('no-key');
  const sym = symbols ? `&symbols=${encodeURIComponent(symbols)}` : '';
  const url = `https://api.marketaux.com/v1/news/all?language=en&filter_entities=true${sym}&limit=20&api_token=${MARKETAUX_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Marketaux ${res.status}`);
  const data = await res.json() as { data: Array<{ title: string; source: string; url: string; published_at: string; description?: string; entities?: Array<{ symbol: string }> }> };
  return (data.data || []).map(a => ({
    title: a.title,
    source: a.source,
    url: a.url,
    publishedAt: a.published_at,
    summary: a.description,
    tickers: a.entities?.map(e => e.symbol).filter(Boolean),
    tier: classifyTier(a.source),
  }));
}

function classifyTier(source: string): RealNewsItem['tier'] {
  const s = source.toLowerCase();
  if (/(reuters|bloomberg|ap |associated press)/.test(s)) return 'wire';
  if (/(wsj|wall street journal|financial times|ft|cnbc|nikkei|mint|economic times|moneycontrol)/.test(s)) return 'primary';
  if (/(fox business|cnn|tv|today show)/.test(s)) return 'tv';
  if (/(twitter|reddit|tiktok|youtube|seeking alpha|zerohedge)/.test(s)) return 'social';
  if (/(transcript|prepared remarks|earnings call)/.test(s)) return 'transcript';
  return 'unknown';
}

export function fetchLiveNews(symbols?: string): Promise<RealNewsItem[]> {
  return memo(`news:${symbols ?? 'top'}`, async () => {
    try { return await fetchMarketaux(symbols); } catch {  }
    try { return await fetchNewsAPI(); } catch {  }
    return FALLBACK_NEWS;
  });
}

const FALLBACK_NEWS: RealNewsItem[] = [
  { title: 'Fed holds rates steady; Powell warns against premature easing', source: 'Reuters',    url: '#', publishedAt: new Date().toISOString(), tier: 'wire',    summary: 'FOMC kept fed funds rate at 5.25–5.50%, signaling data-dependent path.' },
  { title: 'CPI prints hotter than expected; bonds sell off',              source: 'Bloomberg',  url: '#', publishedAt: new Date().toISOString(), tier: 'wire',    summary: 'Core CPI 0.3% MoM vs 0.2% exp; 10Y yield jumps 9bp.' },
  { title: 'Nvidia reports earnings beat, guides conservatively',           source: 'WSJ',        url: '#', publishedAt: new Date().toISOString(), tier: 'primary', summary: 'Data center up 73% YoY. Gross margin 75%.', tickers: ['NVDA'] },
  { title: 'Unknown Twitter account claims XYZ will buy ABC',              source: 'Twitter',    url: '#', publishedAt: new Date().toISOString(), tier: 'social',  summary: 'No corroboration. Textbook pump signal.' },
];

const FRED_SERIES: Record<string, { label: string; unit: string; teach: string }> = {
  FEDFUNDS:   { label: 'Fed Funds Rate',         unit: '%',    teach: 'Sets the floor for every US loan. Up = risk assets get squeezed.' },
  CPIAUCSL:   { label: 'CPI (All Urban)',        unit: 'idx',  teach: 'If inflation prints hot, the Fed delays cuts → bonds/stocks wobble.' },
  UNRATE:     { label: 'Unemployment',           unit: '%',    teach: 'Low = Fed keeps hiking. >4.5% = recession alarm, flight to bonds.' },
  DGS10:      { label: '10Y Treasury Yield',     unit: '%',    teach: 'The world\u2019s discount rate. Stocks hate when this spikes.' },
  DGS2:       { label: '2Y Treasury Yield',      unit: '%',    teach: '2s10s inversion (2Y > 10Y) has preceded every modern US recession.' },
  VIXCLS:     { label: 'VIX (fear gauge)',       unit: 'pts',  teach: '<15 complacent, 15\u201325 normal, 25\u201335 stressed, >40 panic.' },
  DCOILWTICO: { label: 'WTI Crude Oil',          unit: '$/bbl',teach: 'Up = inflation pressure + pain for airlines, win for XOM/CVX.' },
  DTWEXBGS:   { label: 'Dollar Index (broad)',   unit: 'idx',  teach: 'Strong USD hurts multinationals earning abroad + emerging markets.' },
};

async function fetchFREDSeries(series: string): Promise<RealMacroPoint | null> {
  if (!FRED_KEY) return null;
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as { observations?: Array<{ date: string; value: string }> };
    const obs = data.observations?.[0];
    if (!obs) return null;
    const meta = FRED_SERIES[series];
    return {
      series,
      label: meta.label,
      value: parseFloat(obs.value),
      unit: meta.unit,
      asOf: obs.date,
      source: 'FRED (St. Louis Fed)',
      commentary: meta.teach,
    };
  } catch { return null; }
}

export function fetchLiveMacro(): Promise<RealMacroPoint[]> {
  return memo('macro:all', async () => {
    if (!FRED_KEY) return FALLBACK_MACRO;
    const ids = Object.keys(FRED_SERIES);
    const results = await Promise.all(ids.map(fetchFREDSeries));
    const live = results.filter((x): x is RealMacroPoint => x !== null);
    return live.length > 0 ? live : FALLBACK_MACRO;
  });
}

const FALLBACK_MACRO: RealMacroPoint[] = Object.entries(FRED_SERIES).map(([id, m]) => ({
  series: id, label: m.label, value: pickFallbackValue(id), unit: m.unit,
  asOf: new Date().toISOString().slice(0, 10),
  source: 'Sample (no FRED key)', commentary: m.teach,
}));

function pickFallbackValue(id: string): number {
  const defaults: Record<string, number> = {
    FEDFUNDS: 5.33, CPIAUCSL: 313.7, UNRATE: 4.0, DGS10: 4.28, DGS2: 4.72,
    VIXCLS: 16.5, DCOILWTICO: 82.3, DTWEXBGS: 121.5,
  };
  return defaults[id] ?? 0;
}

export async function fetchWorldBank(indicator: string, countries = 'USA;IND;CHN;DEU;JPN'): Promise<WorldBankPoint[]> {
  return memo(`wb:${indicator}:${countries}`, async () => {
    try {
      const url = `https://api.worldbank.org/v2/country/${countries}/indicator/${indicator}?format=json&per_page=200`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json() as [unknown, Array<{ country: { value: string }; value: number | null; date: string }>];
      const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
      const byCountry = new Map<string, WorldBankPoint>();
      for (const r of rows) {
        if (r.value == null) continue;
        const key = r.country.value;
        if (!byCountry.has(key)) {
          byCountry.set(key, { country: r.country.value, indicator, value: r.value, year: parseInt(r.date, 10) });
        }
      }
      return Array.from(byCountry.values());
    } catch { return []; }
  });
}

export const realData = {
  hasNews:  Boolean(NEWS_KEY || MARKETAUX_KEY),
  hasMacro: Boolean(FRED_KEY),
  hasWorldBank: true,
  providers: {
    news:  [NEWS_KEY && 'NewsAPI', MARKETAUX_KEY && 'Marketaux'].filter(Boolean).join(' + ') || 'Sample',
    macro: FRED_KEY ? 'FRED' : 'Sample',
  },
};
