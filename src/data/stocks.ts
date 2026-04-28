import type { Stock, Candle } from '@/types';
import { gbmStep } from '@/lib/math';

export interface StockSeed {
  symbol: string;
  name: string;
  currency: string;
  sector: string;
  startingPrice: number;
  drift: number;
  volatility: number;
}

export const WALL_STREET_STOCKS: StockSeed[] = [
  { symbol: 'AAPL',  name: 'Apple Inc.',          currency: '$', sector: 'Tech',      startingPrice: 182,  drift: 0.12,  volatility: 0.25 },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',     currency: '$', sector: 'Tech',      startingPrice: 420,  drift: 0.14,  volatility: 0.22 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',       currency: '$', sector: 'Tech',      startingPrice: 178,  drift: 0.10,  volatility: 0.28 },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',     currency: '$', sector: 'Retail',    startingPrice: 195,  drift: 0.13,  volatility: 0.30 },
  { symbol: 'TSLA',  name: 'Tesla Inc.',          currency: '$', sector: 'Auto',      startingPrice: 240,  drift: 0.08,  volatility: 0.55 },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',        currency: '$', sector: 'Semis',     startingPrice: 880,  drift: 0.25,  volatility: 0.45 },
  { symbol: 'META',  name: 'Meta Platforms',      currency: '$', sector: 'Social',    startingPrice: 510,  drift: 0.15,  volatility: 0.32 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway',  currency: '$', sector: 'Finance',   startingPrice: 420,  drift: 0.09,  volatility: 0.15 },
  { symbol: 'JPM',   name: 'JPMorgan Chase',      currency: '$', sector: 'Banking',   startingPrice: 195,  drift: 0.08,  volatility: 0.20 },
  { symbol: 'WMT',   name: 'Walmart Inc.',        currency: '$', sector: 'Retail',    startingPrice: 82,   drift: 0.07,  volatility: 0.15 },
];

export const DALAL_STREET_STOCKS: StockSeed[] = [
  { symbol: 'RELIANCE',   name: 'Reliance Industries',   currency: '₹', sector: 'Conglomerate', startingPrice: 2950,  drift: 0.11, volatility: 0.22 },
  { symbol: 'TCS',        name: 'Tata Consultancy',      currency: '₹', sector: 'IT',           startingPrice: 4100,  drift: 0.10, volatility: 0.20 },
  { symbol: 'HDFCBANK',   name: 'HDFC Bank',             currency: '₹', sector: 'Banking',      startingPrice: 1580,  drift: 0.09, volatility: 0.18 },
  { symbol: 'INFY',       name: 'Infosys Ltd.',          currency: '₹', sector: 'IT',           startingPrice: 1820,  drift: 0.09, volatility: 0.22 },
  { symbol: 'ICICIBANK',  name: 'ICICI Bank',            currency: '₹', sector: 'Banking',      startingPrice: 1190,  drift: 0.10, volatility: 0.21 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel',         currency: '₹', sector: 'Telecom',      startingPrice: 1450,  drift: 0.11, volatility: 0.24 },
  { symbol: 'ITC',        name: 'ITC Ltd.',              currency: '₹', sector: 'FMCG',         startingPrice: 435,   drift: 0.07, volatility: 0.17 },
  { symbol: 'ADANIENT',   name: 'Adani Enterprises',     currency: '₹', sector: 'Conglomerate', startingPrice: 2650,  drift: 0.12, volatility: 0.48 },
  { symbol: 'TITAN',      name: 'Titan Company',         currency: '₹', sector: 'Consumer',     startingPrice: 3480,  drift: 0.15, volatility: 0.28 },
  { symbol: 'WIPRO',      name: 'Wipro Ltd.',            currency: '₹', sector: 'IT',           startingPrice: 295,   drift: 0.06, volatility: 0.26 },
];

export function seedStock(seed: StockSeed): Stock {
  const candles: Candle[] = [];
  const now = Date.now();

  const candleIntervalSec = 60;
  let price = seed.startingPrice * 0.95;
  for (let i = 99; i >= 0; i--) {
    const open = price;
    const close = gbmStep(price, seed.drift, seed.volatility, candleIntervalSec);
    const high = Math.max(open, close) * (1 + Math.random() * 0.003);
    const low = Math.min(open, close) * (1 - Math.random() * 0.003);
    candles.push({
      time: now - i * candleIntervalSec * 1000,
      open, high, low, close,
      volume: Math.floor(100000 + Math.random() * 900000),
    });
    price = close;
  }
  return {
    symbol: seed.symbol,
    name: seed.name,
    currency: seed.currency,
    sector: seed.sector,
    price: candles[candles.length - 1].close,
    prevClose: candles[0].open,
    open: candles[0].open,
    high: Math.max(...candles.map(c => c.high)),
    low: Math.min(...candles.map(c => c.low)),
    drift: seed.drift,
    volatility: seed.volatility,
    candles,
  };
}
