const ETHERSCAN_KEY = import.meta.env.VITE_ETHERSCAN_KEY as string | undefined;

export interface ChainLesson {
  id: string;
  title: string;
  oneLine: string;
  body: string;
  irl: string;
}

export const CHAIN_LESSONS: ChainLesson[] = [
  {
    id: 'hash-chain',
    title: 'What a blockchain actually is',
    oneLine: 'An append-only ledger where each block hashes the one before it.',
    body: 'Tampering with block N changes its hash, which breaks every hash after it. That\u2019s why "immutable" is a property of the data structure, not a promise by a company.',
    irl: 'When someone says "trust the blockchain", they mean trust the math. Not the exchange holding the coins.',
  },
  {
    id: 'decentralization',
    title: 'Decentralization vs. distribution',
    oneLine: 'Many nodes run the same rules; no single party can rewrite history.',
    body: 'Distribution = many copies. Decentralization = no central controller. Bitcoin is both. Your bank is distributed (many servers) but centralized (one authority).',
    irl: 'Ask: if this company disappeared tomorrow, would my assets still exist? If no \u2192 it isn\u2019t decentralized, regardless of marketing.',
  },
  {
    id: 'custody',
    title: 'Custody: your keys, your coins',
    oneLine: 'If a third party holds your private key, you have an IOU, not crypto.',
    body: 'Exchange accounts are custodial \u2014 you\u2019re a creditor. Self-custody wallets (hardware, seed phrase) mean you and only you can sign transactions.',
    irl: 'Mt. Gox, FTX, Celsius. Every decade, a big custodian fails. "Not your keys, not your coins" is not a meme, it\u2019s forensic history.',
  },
  {
    id: 'consensus',
    title: 'Consensus: PoW vs PoS',
    oneLine: 'How the network agrees on the next block without a boss.',
    body: 'Proof-of-Work (Bitcoin): burn electricity to earn the right to propose. Proof-of-Stake (Ethereum post-Merge): lock up capital; get slashed if you misbehave.',
    irl: 'Energy debate is real but narrow. The deeper question: which design best resists capture?',
  },
  {
    id: 'smart-contracts',
    title: 'Smart contracts & DeFi',
    oneLine: 'Code running on-chain that moves money without intermediaries.',
    body: 'Uniswap is 500 lines of Solidity that replaces a stock exchange. Aave is a lending protocol with no bank. All audits are public \u2014 and all bugs are too.',
    irl: 'Before sending funds to a DeFi protocol, check: is it audited? Immutable or upgradable? Who holds the admin key?',
  },
  {
    id: 'stables',
    title: 'Stablecoins: the actual utility',
    oneLine: 'Dollar-pegged tokens (USDC, USDT) power 90% of crypto volume.',
    body: 'USDC is reserve-backed (Circle). USDT is opaque (Tether). DAI is crypto-collateralised. Algorithmic stables (UST) keep exploding.',
    irl: 'Send $100 across borders in 10 seconds for 20 cents. That\u2019s the use case. Everything else is speculation about speculation.',
  },
  {
    id: 'risks',
    title: 'The 7 real risks',
    oneLine: 'Not volatility. Those are boring.',
    body: 'Rug-pulls, bridge hacks, admin-key exploits, oracle manipulation, custodial insolvency, lost seed phrases, and your own sloppy OPSEC. Volatility is the least of it.',
    irl: 'Never reveal seed phrases. Verify contract addresses from two sources. Small amounts first. Test transactions.',
  },
];

export interface ChainStats {
  chain: 'bitcoin' | 'ethereum';
  blockHeight: number;
  difficulty?: number;
  hashrate?: number;
  mempoolTx?: number;
  medianFeeUSD?: number;
  blocksPerHour?: number;
  asOf: number;
  source: string;
}

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 60_000;
function memo<T>(k: string, fn: () => Promise<T>): Promise<T> {
  const h = cache.get(k);
  if (h && Date.now() - h.at < TTL) return Promise.resolve(h.data as T);
  return fn().then(d => { cache.set(k, { at: Date.now(), data: d }); return d; });
}

async function blockchairStats(chain: 'bitcoin' | 'ethereum'): Promise<ChainStats | null> {
  try {
    const url = `https://api.blockchair.com/${chain}/stats`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json() as { data: Record<string, number> };
    const d = j.data;
    return {
      chain,
      blockHeight:  d.blocks ?? 0,
      difficulty:   d.difficulty,
      hashrate:     d.hashrate_24h,
      mempoolTx:    d.mempool_transactions,
      medianFeeUSD: d.median_transaction_fee_24h_usd ?? d.average_transaction_fee_24h_usd,
      blocksPerHour: d.blocks_24h ? d.blocks_24h / 24 : undefined,
      asOf: Date.now(),
      source: 'Blockchair',
    };
  } catch { return null; }
}

async function ethGasGwei(): Promise<number | null> {
  if (ETHERSCAN_KEY) {
    try {
      const url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        const j = await res.json() as { result?: { ProposeGasPrice?: string } };
        const g = parseFloat(j.result?.ProposeGasPrice ?? '');
        if (Number.isFinite(g)) return g;
      }
    } catch {  }
  }

  try {
    const res = await fetch('https://cloudflare-eth.com', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] }),
    });
    if (!res.ok) return null;
    const j = await res.json() as { result?: string };
    if (!j.result) return null;
    const wei = parseInt(j.result, 16);
    return wei / 1e9;
  } catch { return null; }
}

export function fetchChainStats(chain: 'bitcoin' | 'ethereum'): Promise<ChainStats | null> {
  return memo(`chain:${chain}`, () => blockchairStats(chain));
}

export function fetchEthGasGwei(): Promise<number | null> {
  return memo('eth:gas', ethGasGwei);
}

export interface DefiTvlPoint { protocol: string; tvl: number; chain: string; category?: string; }

export function fetchTopDefi(limit = 8): Promise<DefiTvlPoint[]> {
  return memo(`defi:${limit}`, async () => {
    try {
      const res = await fetch('https://api.llama.fi/protocols');
      if (!res.ok) return [];
      const arr = await res.json() as Array<{ name: string; tvl: number; chain: string; category?: string }>;
      return arr.slice(0, limit).map(p => ({
        protocol: p.name, tvl: p.tvl, chain: p.chain, category: p.category,
      }));
    } catch { return []; }
  });
}

export const chainCaps = {
  hasEtherscanKey: Boolean(ETHERSCAN_KEY),
  providers: ['Blockchair', 'DefiLlama', ETHERSCAN_KEY ? 'Etherscan' : 'Cloudflare-ETH RPC'].join(' + '),
};
