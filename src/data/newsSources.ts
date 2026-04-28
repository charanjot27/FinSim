export interface NewsSource {
  id: string;
  name: string;
  kind: 'primary' | 'wire' | 'tv' | 'social' | 'transcript';
  trust: number;
  blurb: string;
}

export const NEWS_SOURCES: NewsSource[] = [
  { id: 'sec',    name: 'SEC EDGAR filings (10-K/10-Q/8-K)', kind: 'primary',    trust: 98, blurb: 'Primary source. Legally liable. Zero noise.' },
  { id: 'bse',    name: 'BSE / NSE corporate announcements', kind: 'primary',    trust: 96, blurb: 'Indian primary source. Check before believing any rumor.' },
  { id: 'earnings', name: 'Earnings call transcripts',        kind: 'transcript', trust: 90, blurb: 'Management\u2019s own words. Read the Q&A, not the prepared remarks.' },
  { id: 'reuters', name: 'Reuters / Bloomberg wire',          kind: 'wire',       trust: 85, blurb: 'Fast, generally accurate. Still check primary for big numbers.' },
  { id: 'ft',      name: 'Financial Times / WSJ',             kind: 'wire',       trust: 82, blurb: 'Deep reporting. Op-eds are opinion, not news.' },
  { id: 'cnbc',    name: 'CNBC / Bloomberg TV',               kind: 'tv',         trust: 55, blurb: 'Entertainment that happens near finance. Noise ratio is high.' },
  { id: 'zee',     name: 'Zee Business / CNBC Awaaz',         kind: 'tv',         trust: 40, blurb: 'Hot-take engine. Great charts, terrible trading advice.' },
  { id: 'twitter', name: 'Twitter/X financial accounts',      kind: 'social',     trust: 25, blurb: 'Pump-and-dump playground. Great for memes, bad for positions.' },
  { id: 'telegram',name: 'Telegram tip channels',             kind: 'social',     trust: 5,  blurb: 'If the tip is free, you\u2019re the product. Almost always a scam.' },
  { id: 'whatsapp',name: 'WhatsApp forwards',                 kind: 'social',     trust: 2,  blurb: 'Where retirement savings go to die. Your mom got scammed here.' },
];

export function sourceScore(sourceIds: string[]): { score: number; verdict: string; worst: NewsSource | null } {
  if (sourceIds.length === 0) return { score: 50, verdict: 'No source cited — impulse trade.', worst: null };
  const sources = NEWS_SOURCES.filter(s => sourceIds.includes(s.id));
  if (sources.length === 0) return { score: 30, verdict: 'Unknown source — treat with suspicion.', worst: null };
  const avg = sources.reduce((s, x) => s + x.trust, 0) / sources.length;
  const worst = sources.reduce((w, s) => !w || s.trust < w.trust ? s : w, null as NewsSource | null);
  let verdict: string;
  if (avg >= 85) verdict = 'Primary/wire-grade research. Keep stacking.';
  else if (avg >= 65) verdict = 'Mixed — good sources diluted by TV noise.';
  else if (avg >= 40) verdict = 'Mostly opinion media. Verify at primary source before sizing up.';
  else verdict = '⚠ You are trading gossip. Stop.';
  return { score: avg, verdict, worst };
}
