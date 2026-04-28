import { portfolio } from '@/systems/PortfolioSystem';

interface SkillCard {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  emoji: string;
  color: string;
  district?: string;
  virtualAction: string;
  realLesson: string;
  nextStep: string;
  apis?: string[];
}

const SKILLS: SkillCard[] = [
  {
    id: 'budgeting',
    title: 'Budgeting',
    subtitle: 'Central Bank',
    tags: ['Budgeting', '50/30/20', 'Cash Flow'],
    emoji: '\ud83c\udfe6',
    color: '#F5E9C9',
    virtualAction: 'Allocate your monthly stipend across needs/wants/savings and survive random expense shocks.',
    realLesson: 'The 50/30/20 rule is the cheapest personal-finance system that works. 50% needs, 30% wants, 20% save/invest.',
    nextStep: 'Open your last 30 days of bank statements. Tag every transaction N/W/S. See the truth.',
  },
  {
    id: 'stocks',
    title: 'Stock Trading',
    subtitle: 'Wall Street & Dalal Street',
    tags: ['Stock Trading', 'Risk %', 'Expectancy'],
    emoji: '\ud83c\udfeb',
    color: '#E7C8B1',
    district: 'WallStreetScene',
    virtualAction: 'Size trades with the 1% rule, journal every close, build positive expectancy over 50+ trades.',
    realLesson: '95% of retail traders lose because they skip position sizing. Shares = (Account \u00d7 Risk%) / |Entry \u2212 Stop|.',
    nextStep: 'Before your next real trade, write the stop-loss in your notes app. If you won\u2019t, don\u2019t take the trade.',
    apis: ['Finnhub', 'Alpha Vantage', 'Yahoo'],
  },
  {
    id: 'fd',
    title: 'Fixed Deposits',
    subtitle: 'The boring millionaire',
    tags: ['Fixed Deposits', 'Compound Interest', 'Safety Net'],
    emoji: '\ud83d\udc8e',
    color: '#C7DCE8',
    virtualAction: 'Lock 6 months of expenses in simulated FDs / HYSAs and watch your sleep quality improve.',
    realLesson: 'An emergency fund (3\u20136 months of expenses) is the foundation of all investing. You cannot take smart risks if one bad month ruins you.',
    nextStep: 'Open a high-yield savings account today. Automate 10% of every paycheck into it.',
  },
  {
    id: 'crypto',
    title: 'Crypto',
    subtitle: 'Crypto Cove',
    tags: ['Crypto', 'Volatility', 'Custody'],
    emoji: '\ud83c\udf0a',
    color: '#B9D8C6',
    district: 'CryptoCoveScene',
    virtualAction: 'Trade 24/7 markets, see the 40% drawdowns, resist revenge-trading after a liquidation.',
    realLesson: 'Crypto teaches volatility viscerally. Position sizes that feel thrilling in crypto reveal how small they should be everywhere.',
    nextStep: 'If you hold crypto IRL, write down your private-key recovery plan. If you can\u2019t, you don\u2019t own it.',
    apis: ['CoinGecko (free)'],
  },
  {
    id: 'tax',
    title: 'Taxes & FIFO',
    subtitle: 'The Taxman',
    tags: ['Tax', 'LTCG', 'Wash Sale'],
    emoji: '\ud83e\uddfe',
    color: '#EAD6B8',
    virtualAction: 'Every sell creates a FIFO lot. US wash-sale blocks 30-day re-buys. India \u20b91.25L LTCG shield applies.',
    realLesson: 'Taxes are the largest single expense of a lifetime. Holding past 1 year (US LTCG) or 12 months (India LTCG) often beats timing the market.',
    nextStep: 'Before your next sell, check the buy date. If \u226412 months away from LTCG, wait.',
  },
  {
    id: 'macro',
    title: 'Macro Literacy',
    subtitle: 'Global weather',
    tags: ['Macro', 'Fed Funds', 'Yield Curve'],
    emoji: '\ud83c\udf10',
    color: '#D7C4E3',
    virtualAction: 'See the Fed Funds Rate, 10Y yield, inversion status, VIX, DXY, oil \u2014 live when FRED key is set.',
    realLesson: 'You don\u2019t need to predict the Fed. You need to know 5 numbers: FFR, 10Y, 2s10s, VIX, CPI. Update monthly.',
    nextStep: 'Bookmark fred.stlouisfed.org/series/FEDFUNDS. Check it once a month.',
    apis: ['FRED (free key)', 'World Bank (no key)'],
  },
  {
    id: 'news',
    title: 'News Hygiene',
    subtitle: 'Source tiers',
    tags: ['News', 'Source Tiers', 'Anti-FOMO'],
    emoji: '\ud83d\udcf0',
    color: '#F0C6C0',
    virtualAction: 'Trades are tagged by source. Twitter/Telegram trades get a Tweet-Trade flag. Wire-only trades improve expectancy.',
    realLesson: 'Tier-1 sources (Reuters, Bloomberg, SEC filings, transcripts) beat TV pundits. If your idea came from a tweet, wait 48h.',
    nextStep: 'Unfollow one finfluencer today. Subscribe to one Fed press-release RSS feed.',
    apis: ['NewsAPI', 'Marketaux'],
  },
  {
    id: 'options',
    title: 'Options Basics',
    subtitle: 'Black\u2013Scholes primer',
    tags: ['Options', 'Greeks', 'Implied Vol'],
    emoji: '\u03a3',
    color: '#CFE3C3',
    virtualAction: 'Price calls & puts with live Greeks (Delta, Gamma, Theta, Vega, Rho). See time decay eat your ATM long.',
    realLesson: 'Most retail options buyers lose because theta grinds them out. Sellers have the edge \u2014 but only with defined risk.',
    nextStep: 'Before buying your first option IRL, calculate max loss on paper. Never risk more than 1% of account on one option.',
  },
  {
    id: 'fire',
    title: 'FIRE Number',
    subtitle: 'Financial independence',
    tags: ['FIRE', '4% Rule', 'Compound'],
    emoji: '\ud83d\udd25',
    color: '#F4C6A6',
    virtualAction: 'Enter your annual expenses. See the 25\u00d7 FIRE target and years-to-freedom at various savings rates.',
    realLesson: 'Your FIRE number \u2248 annual_expenses \u00d7 25. A 50% savings rate \u2248 17 years to freedom, regardless of income.',
    nextStep: 'Calculate your number tonight. Put it on a sticky note. Every raise goes to savings, not lifestyle.',
  },
  {
    id: 'bonds',
    title: 'Bonds & Yield Curve',
    subtitle: 'Boring but vital',
    tags: ['Bonds', 'Duration', 'Inversion'],
    emoji: '\ud83d\udcd6',
    color: '#CFD5E8',
    virtualAction: 'Plot the US yield curve. Spot inversions. Understand why a 4% 10Y Treasury is a real investment, not a relic.',
    realLesson: 'When 2Y yield > 10Y yield, recessions have historically followed within 18 months. Bonds hedge stock crashes.',
    nextStep: 'Check the 2s10s spread today at fred.stlouisfed.org/graph/?g=1c1dg.',
    apis: ['FRED'],
  },
  {
    id: 'web3',
    title: 'Blockchain & Web3',
    subtitle: 'Decentralized ledgers',
    tags: ['Blockchain', 'DeFi', 'Self-Custody'],
    emoji: '\u25c6',
    color: '#C6D6EC',
    virtualAction: 'Read the 7 chain lessons. Watch live BTC/ETH block height, mempool, gas, and DeFi TVL tick in real time.',
    realLesson: 'Decentralization = no single rewriter of history. Custodial \u2260 crypto; if a third party holds your keys, you hold an IOU.',
    nextStep: 'If you own any crypto, verify you can see the address on-chain at a block explorer. If you can\u2019t, it isn\u2019t yours.',
    apis: ['Blockchair', 'DefiLlama', 'Cloudflare-ETH'],
  },
  {
    id: 'scam',
    title: 'Scam Radar',
    subtitle: 'Scam Slum',
    tags: ['Fraud', 'Red Flags', 'Defense'],
    emoji: '\u26a0\ufe0f',
    color: '#EFD7A1',
    district: 'ScamSlumScene',
    virtualAction: 'Face pig-butchering DMs, pump-dump group-chats, and too-good-to-be-true APYs. Learn the 7 red flags.',
    realLesson: 'If the return is guaranteed, the words "financial advisor" are used without licensing checks, or urgency is manufactured \u2014 walk.',
    nextStep: 'Check any platform you use at finra.org/brokercheck (US) or SEBI Intermediary Portal (India).',
  },
  {
    id: 'vegas',
    title: 'Gambling vs Investing',
    subtitle: 'Vegas Vice',
    tags: ['Probability', 'Kelly', 'House Edge'],
    emoji: '\ud83c\udfb0',
    color: '#E9B9B9',
    district: 'VegasViceScene',
    virtualAction: 'See expected value turn negative on every casino game. Watch the math of ruin play out.',
    realLesson: 'Casinos have a house edge of 1\u201315%. Day-trading without edge is a 0\u201310% house edge against yourself.',
    nextStep: 'If you day-trade, audit your last 50 trades. Compute win-rate \u00d7 avg-win vs loss-rate \u00d7 avg-loss.',
  },
];

export class LearnHub {
  private root: HTMLDivElement;
  private open_: boolean = false;

  constructor() {
    this.root = document.getElementById('learn-hub') as HTMLDivElement;
    if (!this.root) throw new Error('LearnHub: #learn-hub not found in DOM');
    this.render();
  }

  private render(): void {
    const cash   = portfolio.getCash();
    const total  = portfolio.getTotalValue();
    const pnl    = portfolio.getTotalPnl();
    const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(0)}` : `\u2212$${Math.abs(pnl).toFixed(0)}`;

    this.root.innerHTML = `
      <div class="lh-backdrop"></div>
      <div class="lh-modal">
        <header class="lh-header">
          <div>
            <h1>\ud83c\udfdb\ufe0f Learn &amp; Earn Hub</h1>
            <p class="lh-tag">Play here \u2192 earn there. Every card maps a game skill to a real-world step.</p>
          </div>
          <div class="lh-stats">
            <div class="lh-stat"><span>Cash</span><b>$${cash.toFixed(0)}</b></div>
            <div class="lh-stat"><span>Total</span><b>$${total.toFixed(0)}</b></div>
            <div class="lh-stat ${pnl >= 0 ? 'pos' : 'neg'}"><span>P&amp;L</span><b>${pnlStr}</b></div>
            <button class="lh-close" id="lh-close" aria-label="Close">\u2715</button>
          </div>
        </header>
        <div class="lh-grid">
          ${SKILLS.map(this.renderCard).join('')}
        </div>
        <footer class="lh-footer">
          <span class="lh-foot-note">\ud83d\udca1 Press <kbd>L</kbd> to toggle this hub. Each card expands on click.</span>
          <span class="lh-foot-note">\u2728 Keys in <code>.env</code> unlock live news &amp; macro.</span>
        </footer>
      </div>
    `;

    this.root.querySelector('#lh-close')?.addEventListener('click', () => this.close());
    this.root.querySelector('.lh-backdrop')?.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLDivElement>('.lh-card').forEach(card => {
      card.addEventListener('click', () => card.classList.toggle('expanded'));
    });
    this.root.querySelectorAll<HTMLButtonElement>('.lh-goto').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const district = btn.dataset.district;
        if (district) {
          type FinsimWindow = Window & { finsim?: { goTo?: (scene: string) => void } };
          const w = window as FinsimWindow;
          w.finsim?.goTo?.(district);
          this.close();
        }
      });
    });
  }

  private renderCard = (s: SkillCard): string => {
    const apiChips = (s.apis || []).map(a => `<span class="lh-api-chip">${a}</span>`).join('');
    return `
      <article class="lh-card" data-id="${s.id}" style="--card-color: ${s.color}">
        <div class="lh-tile">
          <div class="lh-tile-top">
            <span class="lh-tile-emoji">${s.emoji}</span>
          </div>
          <div class="lh-tile-bottom">
            <h3>${s.title}</h3>
            <p>${s.subtitle}</p>
          </div>
        </div>
        <div class="lh-tags">
          ${s.tags.map(t => `<span class="lh-pill">${t}</span>`).join('')}
        </div>
        <div class="lh-drawer">
          <div class="lh-row"><span class="lh-icon">\ud83c\udfae</span><div><b>In-game:</b> ${s.virtualAction}</div></div>
          <div class="lh-row"><span class="lh-icon">\ud83d\udcda</span><div><b>Real life:</b> ${s.realLesson}</div></div>
          <div class="lh-row lh-step"><span class="lh-icon">\u2b50</span><div><b>Do today:</b> ${s.nextStep}</div></div>
          ${apiChips ? `<div class="lh-apis">Live data: ${apiChips}</div>` : ''}
          ${s.district ? `<button class="lh-goto" data-district="${s.district}">Open district \u2192</button>` : ''}
        </div>
      </article>
    `;
  };

  open(): void {
    this.render();
    this.root.classList.remove('hidden');
    this.open_ = true;
  }

  close(): void {
    this.root.classList.add('hidden');
    this.open_ = false;
  }

  toggle(): void { this.open_ ? this.close() : this.open(); }
  isOpen(): boolean { return this.open_; }
}
