import { positionSize, expectancyFromRs, kelly } from '@/lib/risk';
import { blackScholes, STRATEGIES } from '@/lib/options';
import { sharpe, sortino, maxDrawdown } from '@/lib/indicators';
import { getUpcomingEconEvents } from '@/data/econCalendar';
import {
  sampleUSYieldCurve, sampleIndiaYieldCurve, isInverted, sampleMacroSnapshot, regimeRead,
} from '@/data/macro';
import { NEWS_SOURCES } from '@/data/newsSources';
import {
  evaluateLifeBasics, sipFutureValue, fireNumber, compound, budget503020,
  type LifeBasicsState,
} from '@/data/personalFinance';
import { taxLedger } from '@/systems/TaxLedger';
import { tradeJournal } from '@/systems/TradeJournal';
import { portfolio } from '@/systems/PortfolioSystem';
import { marketEngine } from '@/systems/MarketEngine';
import { fetchLiveNews, fetchLiveMacro, realData } from '@/systems/RealDataProvider';
import {
  CHAIN_LESSONS, fetchChainStats, fetchEthGasGwei, fetchTopDefi, chainCaps,
} from '@/data/blockchain';

type TabId = 'risk' | 'greeks' | 'econ' | 'tax' | 'macro' | 'journal' | 'basics' | 'news' | 'web3';

export class ProTerminal {
  private modal: HTMLElement;
  private tabsEl: HTMLElement;
  private bodyEl: HTMLElement;
  private active: TabId = 'risk';

  constructor() {
    this.modal = document.getElementById('pro-terminal')!;
    this.tabsEl = document.getElementById('pro-tabs')!;
    this.bodyEl = document.getElementById('pro-body')!;
    document.getElementById('pro-close')?.addEventListener('click', () => this.close());
    this.buildTabs();
  }

  private buildTabs(): void {
    const tabs: { id: TabId; label: string; icon: string }[] = [
      { id: 'risk',    label: 'Risk',    icon: '\ud83c\udfaf' },
      { id: 'greeks',  label: 'Options', icon: '\u03a3' },
      { id: 'econ',    label: 'Econ',    icon: '\ud83d\udcc5' },
      { id: 'tax',     label: 'Tax',     icon: '\ud83e\udde6' },
      { id: 'macro',   label: 'Macro',   icon: '\ud83c\udf10' },
      { id: 'journal', label: 'Journal', icon: '\ud83d\udcd2' },
      { id: 'news',    label: 'News',    icon: '\ud83d\udcf0' },
      { id: 'web3',    label: 'Web3',    icon: '\u25c6' },
      { id: 'basics',  label: 'Basics',  icon: '\ud83c\udfe0' },
    ];
    this.tabsEl.innerHTML = '';
    tabs.forEach(t => {
      const b = document.createElement('button');
      b.className = `pro-tab${t.id === this.active ? ' active' : ''}`;
      b.dataset.tabid = t.id;
      b.innerHTML = `<span class="pro-tab-icon">${t.icon}</span> ${t.label}`;
      b.onclick = () => { this.active = t.id; this.buildTabs(); this.render(); };
      this.tabsEl.appendChild(b);
    });
    this.render();
  }

  open(): void { this.modal.classList.remove('hidden'); this.render(); }
  close(): void { this.modal.classList.add('hidden'); }
  isOpen(): boolean { return !this.modal.classList.contains('hidden'); }

  private render(): void {
    switch (this.active) {
      case 'risk': this.renderRisk(); break;
      case 'greeks': this.renderGreeks(); break;
      case 'econ': this.renderEcon(); break;
      case 'tax': this.renderTax(); break;
      case 'macro': this.renderMacro(); break;
      case 'journal': this.renderJournal(); break;
      case 'news': this.renderNews(); break;
      case 'web3': this.renderWeb3(); break;
      case 'basics': this.renderBasics(); break;
    }
  }

  private renderWeb3(): void {
    const lessons = CHAIN_LESSONS.map(l => `
      <article class="pro-lesson">
        <header><h4>${l.title}</h4><span class="pro-lesson-tag">${l.oneLine}</span></header>
        <p>${l.body}</p>
        <p class="pro-lesson-irl"><b>IRL:</b> ${l.irl}</p>
      </article>
    `).join('');
    this.bodyEl.innerHTML = `
      <h3 class="pro-h">\u25c6 Blockchain &amp; Decentralization Literacy</h3>
      <p class="pro-sub">The minimum model you need to reason about Web3 without getting scammed or over-excited.</p>
      <div class="pro-lessons">${lessons}</div>
      <h4 class="pro-h2">Live On-Chain Stats <span class="pro-mini-badge">${chainCaps.providers}</span></h4>
      <div id="pro-chain-grid" class="pro-stats wide pro-live-loading">Fetching chain data\u2026</div>
      <h4 class="pro-h2" style="margin-top:12px">Top DeFi Protocols (by TVL) \u2014 DefiLlama</h4>
      <div id="pro-defi-list" class="pro-live-loading">Loading\u2026</div>
      <p class="pro-sub" style="margin-top:10px">\u{1F4A1} These numbers are a public utility. Check them before trusting any "DeFi yield" claim.</p>
    `;
    this.populateWeb3();
  }

  private async populateWeb3(): Promise<void> {
    const grid = document.getElementById('pro-chain-grid');
    const defiEl = document.getElementById('pro-defi-list');
    try {
      const [btc, eth, gas, defi] = await Promise.all([
        fetchChainStats('bitcoin'),
        fetchChainStats('ethereum'),
        fetchEthGasGwei(),
        fetchTopDefi(8),
      ]);
      const cells: string[] = [];
      if (btc) {
        cells.push(`<div><label>BTC block height</label><span>${btc.blockHeight.toLocaleString()}</span><em class="pro-mini">${new Date(btc.asOf).toLocaleTimeString()}</em></div>`);
        if (btc.mempoolTx != null) cells.push(`<div><label>BTC mempool</label><span>${btc.mempoolTx.toLocaleString()} tx</span></div>`);
        if (btc.medianFeeUSD != null) cells.push(`<div><label>BTC median fee</label><span>$${btc.medianFeeUSD.toFixed(2)}</span></div>`);
      }
      if (eth) {
        cells.push(`<div><label>ETH block height</label><span>${eth.blockHeight.toLocaleString()}</span></div>`);
        if (eth.blocksPerHour != null) cells.push(`<div><label>ETH blocks/hr</label><span>${eth.blocksPerHour.toFixed(0)}</span></div>`);
      }
      if (gas != null) cells.push(`<div><label>ETH gas</label><span>${gas.toFixed(1)} gwei</span></div>`);
      if (grid) {
        if (cells.length > 0) {
          grid.className = 'pro-stats wide';
          grid.innerHTML = cells.join('');
        } else {
          grid.innerHTML = '<em>Live chain data unavailable right now.</em>';
        }
      }
      if (defiEl) {
        if (defi.length > 0) {
          defiEl.className = 'pro-defi-list';
          defiEl.innerHTML = defi.map((p, i) => `
            <div class="pro-defi-row">
              <span class="pro-defi-rank">${i + 1}</span>
              <span class="pro-defi-name">${p.protocol}</span>
              <span class="pro-defi-chain">${p.chain}${p.category ? ' \u00b7 ' + p.category : ''}</span>
              <span class="pro-defi-tvl">$${(p.tvl / 1e9).toFixed(2)}B</span>
            </div>`).join('');
        } else {
          defiEl.innerHTML = '<em>DefiLlama unavailable right now.</em>';
        }
      }
    } catch {
      if (grid) grid.innerHTML = '<em>Live chain data unavailable right now.</em>';
      if (defiEl) defiEl.innerHTML = '<em>DefiLlama unavailable right now.</em>';
    }
  }

  private getEquity(): number {
    const cash = portfolio.getCash();
    const hv = portfolio.getHoldings().reduce((s, h) => {
      const px = marketEngine.getStock(h.symbol)?.price ?? h.avgPrice;
      return s + px * h.quantity;
    }, 0);
    return cash + hv;
  }

  private renderRisk(): void {
    const equity = this.getEquity();
    const rOutcomes = portfolio.getROutcomes();
    const exp = expectancyFromRs(rOutcomes);
    this.bodyEl.innerHTML = `
      <h3 class="pro-h">\ud83c\udfaf Risk-First Position Sizing</h3>
      <p class="pro-sub">"Amateurs think about profits. Pros think about losses." Shares = (Account \u00d7 Risk%) / (Entry \u2212 Stop)</p>
      <div class="pro-grid-2">
        <label>Account size <input id="rk-acct" type="number" value="${equity.toFixed(0)}"/></label>
        <label>Risk % <input id="rk-risk" type="number" step="0.1" value="1"/></label>
        <label>Entry <input id="rk-entry" type="number" step="0.01"/></label>
        <label>Stop-loss <input id="rk-stop" type="number" step="0.01"/></label>
      </div>
      <button id="rk-calc" class="pro-btn pro-btn-primary">Calculate</button>
      <div id="rk-out" class="pro-result"></div>
      <h4 class="pro-h2">Edge Stats (last ${exp.trades} closed trades)</h4>
      <div class="pro-stats">
        <div><label>Expectancy</label><span class="${exp.E >= 0 ? 'pos' : 'neg'}">${exp.E.toFixed(3)} R</span></div>
        <div><label>Win rate</label><span>${(exp.winRate * 100).toFixed(1)}%</span></div>
        <div><label>Avg win</label><span class="pos">${exp.avgWinR.toFixed(2)}R</span></div>
        <div><label>Avg loss</label><span class="neg">${exp.avgLossR.toFixed(2)}R</span></div>
        <div><label>Kelly f*</label><span>${(kelly(exp.winRate, exp.avgWinR || 1, exp.avgLossR || 1) * 100).toFixed(1)}%</span></div>
        <div><label>Trades</label><span>${exp.trades}</span></div>
      </div>
    `;
    document.getElementById('rk-calc')?.addEventListener('click', () => {
      const acct = parseFloat((document.getElementById('rk-acct') as HTMLInputElement).value);
      const risk = parseFloat((document.getElementById('rk-risk') as HTMLInputElement).value);
      const entry = parseFloat((document.getElementById('rk-entry') as HTMLInputElement).value);
      const stop = parseFloat((document.getElementById('rk-stop') as HTMLInputElement).value);
      if ([acct, risk, entry, stop].some(x => !Number.isFinite(x))) return;
      const r = positionSize({ accountSize: acct, riskPercent: risk, entryPrice: entry, stopPrice: stop });
      const pctOfAcct = acct > 0 ? (r.positionValue / acct) * 100 : 0;
      document.getElementById('rk-out')!.innerHTML = `
        <div class="pro-callout ${r.ok ? 'ok' : 'warn'}">
          <strong>${r.ok ? `Buy ${r.maxShares} shares.` : '\u26a0 Cannot size.'}</strong><br/>
          Notional: $${r.positionValue.toFixed(0)} (${pctOfAcct.toFixed(1)}% of account)<br/>
          Per-share risk: $${r.perShareRisk.toFixed(2)} \u2022 Total risk: $${r.riskAmount.toFixed(2)} (${risk}% cap)<br/>
          Leverage: ${r.leverageNeeded.toFixed(2)}x ${r.reason ? `<br/><em class="warn">${r.reason}</em>` : ''}
        </div>`;
    });
  }

  private renderGreeks(): void {
    const strategyList = Object.entries(STRATEGIES).map(([k, v]) => `<li><strong>${k}</strong> \u2014 ${v}</li>`).join('');
    this.bodyEl.innerHTML = `
      <h3 class="pro-h">\u03a3 Black-Scholes Greeks</h3>
      <p class="pro-sub">European options. Greeks are rates of change \u2014 gamma is delta's acceleration; vega is vol sensitivity.</p>
      <div class="pro-grid-3">
        <label>Spot S <input id="gk-S" type="number" value="100"/></label>
        <label>Strike K <input id="gk-K" type="number" value="100"/></label>
        <label>Days to expiry <input id="gk-T" type="number" value="30"/></label>
        <label>Rate r % <input id="gk-r" type="number" value="5" step="0.1"/></label>
        <label>Implied Vol % <input id="gk-sig" type="number" value="25" step="0.5"/></label>
        <label>Type <select id="gk-type"><option value="call">Call</option><option value="put">Put</option></select></label>
      </div>
      <button id="gk-calc" class="pro-btn pro-btn-primary">Price + Greeks</button>
      <div id="gk-out" class="pro-result"></div>
      <h4 class="pro-h2">Multi-Leg Strategies</h4>
      <ul class="pro-list">${strategyList}</ul>
    `;
    document.getElementById('gk-calc')?.addEventListener('click', () => {
      const S = parseFloat((document.getElementById('gk-S') as HTMLInputElement).value);
      const K = parseFloat((document.getElementById('gk-K') as HTMLInputElement).value);
      const T = parseFloat((document.getElementById('gk-T') as HTMLInputElement).value) / 365;
      const r = parseFloat((document.getElementById('gk-r') as HTMLInputElement).value) / 100;
      const sigma = parseFloat((document.getElementById('gk-sig') as HTMLInputElement).value) / 100;
      const type = (document.getElementById('gk-type') as HTMLSelectElement).value as 'call' | 'put';
      const g = blackScholes({ S, K, T, r, sigma, type });
      document.getElementById('gk-out')!.innerHTML = `
        <div class="pro-stats">
          <div><label>Price</label><span class="pos">$${g.price.toFixed(2)}</span></div>
          <div><label>Delta</label><span>${g.delta.toFixed(3)}</span></div>
          <div><label>Gamma</label><span>${g.gamma.toFixed(4)}</span></div>
          <div><label>Theta/day</label><span class="neg">$${(g.theta / 365).toFixed(2)}</span></div>
          <div><label>Vega/1%</label><span>$${(g.vega / 100).toFixed(2)}</span></div>
          <div><label>Rho</label><span>${g.rho.toFixed(3)}</span></div>
        </div>`;
    });
  }

  private renderEcon(): void {
    const evs = getUpcomingEconEvents(Date.now()).slice(0, 10);
    const rows = evs.map(e => `
      <tr class="imp-${e.impact}">
        <td>${new Date(e.datetime).toLocaleString()}</td>
        <td>${e.region}</td>
        <td>${e.title}</td>
        <td><span class="impact-pill ${e.impact}">${e.impact}</span></td>
        <td>${e.blurb}</td>
      </tr>
    `).join('');
    this.bodyEl.innerHTML = `
      <h3 class="pro-h">\ud83d\udcc5 Economic Calendar</h3>
      <p class="pro-sub">Algos front-run retail on event prints. Wait 30 minutes minimum before trading the reaction.</p>
      <table class="pro-table">
        <thead><tr><th>When</th><th>Region</th><th>Event</th><th>Impact</th><th>Note</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  private renderTax(): void {
    const year = new Date().getFullYear();
    const usProj = taxLedger.projectTax('US', year, 85000) as { shortTerm: number; longTerm: number; total: number };
    const inProj = taxLedger.projectTax('IN', year, 1500000) as { shortTerm: number; longTerm: number; total: number };
    this.bodyEl.innerHTML = `
      <h3 class="pro-h">\ud83e\udde6 Tax Awareness</h3>
      <p class="pro-sub">FIFO lots tracked across every buy/sell. Long-term = held > 1 year (US) or > 1 year (India listed equity).</p>
      <h4 class="pro-h2">US \u2014 ordinary income $85,000</h4>
      <div class="pro-stats">
        <div><label>Realized LT</label><span class="${usProj.longTerm >= 0 ? 'pos' : 'neg'}">$${usProj.longTerm.toFixed(2)}</span></div>
        <div><label>Realized ST</label><span class="${usProj.shortTerm >= 0 ? 'pos' : 'neg'}">$${usProj.shortTerm.toFixed(2)}</span></div>
        <div><label>Est. tax</label><span class="neg">$${usProj.total.toFixed(0)}</span></div>
      </div>
      <h4 class="pro-h2">India \u2014 ordinary income \u20b915,00,000</h4>
      <div class="pro-stats">
        <div><label>Realized LT</label><span class="${inProj.longTerm >= 0 ? 'pos' : 'neg'}">\u20b9${inProj.longTerm.toFixed(0)}</span></div>
        <div><label>Realized ST</label><span class="${inProj.shortTerm >= 0 ? 'pos' : 'neg'}">\u20b9${inProj.shortTerm.toFixed(0)}</span></div>
        <div><label>Est. tax</label><span class="neg">\u20b9${inProj.total.toFixed(0)}</span></div>
      </div>
      <h4 class="pro-h2">Rules refresher</h4>
      <ul class="pro-list">
        <li><strong>US Wash sale:</strong> Selling at a loss, buying back within 30 days defers the loss \u2014 added to new basis.</li>
        <li><strong>India LTCG:</strong> 12.5% over \u20b91.25L/yr on listed equity. STCG 20% flat.</li>
        <li><strong>80C:</strong> \u20b91.5L/yr across ELSS + PPF + EPF + NPS (Tier 1) + life-insurance premiums.</li>
        <li><strong>Tax-loss harvest:</strong> Sell underwater positions in December to offset realized gains \u2014 buy back after 31 days.</li>
      </ul>`;
  }

  private renderMacro(): void {
    const usYc = sampleUSYieldCurve();
    const inYc = sampleIndiaYieldCurve();
    const usInv = isInverted(usYc);
    const inInv = isInverted(inYc);
    const snap = sampleMacroSnapshot();
    const regime = regimeRead(snap);
    this.bodyEl.innerHTML = `
      <h3 class="pro-h">\ud83c\udf10 Macro Dashboard</h3>
      <div class="pro-callout" style="border-left-color:${regime.color}">
        <strong>${regime.regime}</strong> \u2014 ${regime.note}
      </div>
      <h4 class="pro-h2">US Yield Curve ${usInv.inverted ? `<span class="warn">\u2022 INVERTED 2s10s ${(usInv.spread2s10s * 100).toFixed(0)}bps</span>` : '<span class="ok">\u2022 normal</span>'}</h4>
      <div class="pro-yield-row">${usYc.map(p => `<div class="yc-cell"><span>${p.tenor}</span><strong>${p.yield.toFixed(2)}%</strong></div>`).join('')}</div>
      <h4 class="pro-h2">India G-Sec Curve ${inInv.inverted ? '<span class="warn">\u2022 INVERTED</span>' : '<span class="ok">\u2022 normal</span>'}</h4>
      <div class="pro-yield-row">${inYc.map(p => `<div class="yc-cell"><span>${p.tenor}</span><strong>${p.yield.toFixed(2)}%</strong></div>`).join('')}</div>
      <h4 class="pro-h2">Cross-Asset Snapshot</h4>
      <div class="pro-stats wide">
        <div><label>VIX</label><span>${snap.vix.toFixed(2)}</span></div>
        <div><label>MOVE</label><span>${snap.move.toFixed(1)}</span></div>
        <div><label>DXY</label><span>${snap.dxy.toFixed(2)}</span></div>
        <div><label>WTI</label><span>$${snap.wti.toFixed(2)}</span></div>
        <div><label>Gold</label><span>$${snap.gold.toFixed(2)}</span></div>
        <div><label>Copper</label><span>$${snap.copper.toFixed(2)}</span></div>
        <div><label>BTC</label><span>$${snap.btc.toFixed(0)}</span></div>
        <div><label>HY OAS</label><span>${snap.hyOAS} bps</span></div>
        <div><label>10Y real</label><span>${snap.tenYReal.toFixed(2)}%</span></div>
        <div><label>P(hike)</label><span>${(snap.fomcProbHike * 100).toFixed(0)}%</span></div>
      </div>
      <h4 class="pro-h2">Live Macro <span class="pro-mini-badge">${realData.providers.macro}</span></h4>
      <div id="pro-live-macro" class="pro-live-loading">Loading real-world stats\u2026</div>
      <p class="pro-sub" style="margin-top:8px">\u{1F4A1} These are the 5\u20138 numbers that explain most market moves. Bookmark them.</p>`;
    this.populateLiveMacro();
  }

  private async populateLiveMacro(): Promise<void> {
    try {
      const pts = await fetchLiveMacro();
      const el = document.getElementById('pro-live-macro');
      if (!el) return;
      el.className = 'pro-stats wide';
      el.innerHTML = pts.map(p => `
        <div title="${p.commentary.replace(/"/g, '&quot;')}">
          <label>${p.label}</label>
          <span>${Number.isFinite(p.value) ? p.value.toFixed(2) : '\u2014'} ${p.unit}</span>
          <em class="pro-mini">${p.asOf} \u00b7 ${p.source}</em>
        </div>`).join('');
    } catch {
      const el = document.getElementById('pro-live-macro');
      if (el) el.innerHTML = '<em>Live data unavailable \u2014 showing sample. Add FRED key in .env to unlock.</em>';
    }
  }

  private renderJournal(): void {
    const entries = tradeJournal.list().slice(0, 20);
    const stats = tradeJournal.weekdayStats();
    const rows = entries.map(e => `
      <tr class="${e.closedAt ? ((e.rOutcome ?? 0) > 0 ? 'pos' : 'neg') : ''}">
        <td>${new Date(e.timestamp).toLocaleDateString()}</td>
        <td>${e.symbol}</td>
        <td>${e.side}</td>
        <td>${e.entry.toFixed(2)}</td>
        <td>${e.stop?.toFixed(2) ?? '\u2014'}</td>
        <td>${e.rOutcome?.toFixed(2) ?? '\u2014'}R</td>
        <td>${e.emotion ?? '\u2014'}/10</td>
        <td>${(e.thesis ?? '').slice(0, 40)}</td>
      </tr>`).join('');
    const wdRows = stats.map(s => s.count > 0
      ? `<div class="wd-cell ${s.winRate >= 0.5 ? 'pos' : 'neg'}"><strong>${s.day}</strong><br/>${(s.winRate * 100).toFixed(0)}% win<br/>${s.avgR.toFixed(2)}R avg<br/>n=${s.count}</div>`
      : `<div class="wd-cell"><strong>${s.day}</strong><br/>no data</div>`).join('');
    this.bodyEl.innerHTML = `
      <h3 class="pro-h">\ud83d\udcd2 Trade Journal</h3>
      <h4 class="pro-h2">Weekday pattern (hindsight)</h4>
      <div class="pro-weekdays">${wdRows}</div>
      <h4 class="pro-h2">Recent entries</h4>
      <table class="pro-table">
        <thead><tr><th>Date</th><th>Sym</th><th>Side</th><th>Entry</th><th>Stop</th><th>R</th><th>Emo</th><th>Thesis</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="8" style="text-align:center;opacity:.6">No entries yet \u2014 log a trade via the terminal.</td></tr>'}</tbody>
      </table>`;
  }

  private renderNews(): void {
    const rows = NEWS_SOURCES.map(s => `
      <tr>
        <td>${s.name}</td>
        <td><span class="trust-pill t-${s.kind}">${s.kind}</span></td>
        <td><span class="trust-score" style="--score:${s.trust}%">${s.trust}</span></td>
        <td>${s.blurb}</td>
      </tr>`).join('');
    this.bodyEl.innerHTML = `
      <h3 class="pro-h">\ud83d\udcf0 News Source Trust Matrix</h3>
      <p class="pro-sub">Signal vs. noise. Primary sources (SEC filings, earnings transcripts) beat pundits. The tip is free because you are the exit liquidity.</p>
      <table class="pro-table">
        <thead><tr><th>Source</th><th>Kind</th><th>Trust</th><th>Notes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <h4 class="pro-h2" style="margin-top:16px">Live Headlines <span class="pro-mini-badge">${realData.providers.news}</span></h4>
      <div id="pro-live-news" class="pro-live-loading">Fetching latest\u2026</div>
      <p class="pro-sub" style="margin-top:8px">\u{1F4A1} Before trading on a headline: is it wire-tier? Has it hit two independent sources? If no \u2014 wait 48h.</p>`;
    this.populateLiveNews();
  }

  private async populateLiveNews(): Promise<void> {
    try {
      const items = await fetchLiveNews();
      const el = document.getElementById('pro-live-news');
      if (!el) return;
      el.className = 'pro-news-list';
      el.innerHTML = items.slice(0, 10).map(n => {
        const t = new Date(n.publishedAt);
        const when = Number.isFinite(t.getTime()) ? t.toLocaleString() : n.publishedAt;
        const linkOpen  = n.url && n.url !== '#' ? `<a href="${n.url}" target="_blank" rel="noopener noreferrer">` : '';
        const linkClose = linkOpen ? '</a>' : '';
        return `
          <article class="pro-news-item">
            <div class="pro-news-head">
              <span class="trust-pill t-${n.tier}">${n.tier}</span>
              <span class="pro-news-src">${n.source}</span>
              <span class="pro-news-when">${when}</span>
            </div>
            <div class="pro-news-title">${linkOpen}${n.title}${linkClose}</div>
            ${n.summary ? `<div class="pro-news-sum">${n.summary}</div>` : ''}
            ${n.tickers?.length ? `<div class="pro-news-tk">${n.tickers.map(t => `<span>${t}</span>`).join('')}</div>` : ''}
          </article>`;
      }).join('');
    } catch {
      const el = document.getElementById('pro-live-news');
      if (el) el.innerHTML = '<em>Live news unavailable \u2014 add NewsAPI or Marketaux key in .env to unlock.</em>';
    }
  }

  private renderBasics(): void {
    const raw = localStorage.getItem('finsim.basics.v1');
    const s: LifeBasicsState = raw ? JSON.parse(raw) : {
      monthlyExpenses: 50000, emergencyFund: 0,
      hasHealthInsurance: false, hasTermLife: false,
      highInterestDebt: 0, creditScore: 720, country: 'US',
    };
    const rpt = evaluateLifeBasics(s);
    const sipFv = sipFutureValue(10000, 0.12, 20);
    const fireN = fireNumber(600000, 0.04);
    const comp30 = compound(100000, 0.10, 30);
    const b = budget503020(100000);
    this.bodyEl.innerHTML = `
      <h3 class="pro-h">\ud83c\udfe0 Personal Finance Gate</h3>
      <p class="pro-sub">Before Wall Street unlocks: emergency fund \u2265 6 months, no high-interest debt, health + term insurance, credit score healthy.</p>
      <div class="pro-callout ${rpt.canInvestRiskCapital ? 'ok' : 'warn'}">
        <strong>${rpt.canInvestRiskCapital ? '\u2713 Cleared to trade \u2014 keep the basics solid.' : '\u26a0 Fix these before risking the next rupee/dollar:'}</strong>
        <ul>${rpt.messages.map(m => `<li>${m}</li>`).join('')}</ul>
      </div>
      <div class="pro-grid-3">
        <label>Monthly expenses <input id="bs-mx" type="number" value="${s.monthlyExpenses}"/></label>
        <label>Emergency fund <input id="bs-ef" type="number" value="${s.emergencyFund}"/></label>
        <label>High-interest debt <input id="bs-debt" type="number" value="${s.highInterestDebt}"/></label>
        <label>Health insurance <select id="bs-hi"><option value="n" ${!s.hasHealthInsurance ? 'selected' : ''}>No</option><option value="y" ${s.hasHealthInsurance ? 'selected' : ''}>Yes</option></select></label>
        <label>Term life <select id="bs-tl"><option value="n" ${!s.hasTermLife ? 'selected' : ''}>No</option><option value="y" ${s.hasTermLife ? 'selected' : ''}>Yes</option></select></label>
        <label>Credit score <input id="bs-cs" type="number" value="${s.creditScore}"/></label>
        <label>Country <select id="bs-co"><option value="US" ${s.country === 'US' ? 'selected' : ''}>US</option><option value="IN" ${s.country === 'IN' ? 'selected' : ''}>IN</option></select></label>
      </div>
      <button id="bs-save" class="pro-btn pro-btn-primary">Save</button>
      <h4 class="pro-h2">Boring Wealth Builders</h4>
      <div class="pro-stats wide">
        <div><label>SIP \u20b910k/mo @ 12% \u00d7 20y</label><span class="pos">\u20b9${sipFv.toFixed(0)}</span></div>
        <div><label>\u20b91L @ 10% \u00d7 30y</label><span class="pos">\u20b9${comp30.toFixed(0)}</span></div>
        <div><label>FIRE # (\u20b96L/yr, 4% SWR)</label><span>\u20b9${fireN.toFixed(0)}</span></div>
        <div><label>50/30/20 of \u20b91L</label><span>N \u20b9${b.needs.toFixed(0)} \u00b7 W \u20b9${b.wants.toFixed(0)} \u00b7 S \u20b9${b.savings.toFixed(0)}</span></div>
      </div>
      <h4 class="pro-h2">Portfolio Edge Metrics</h4>
      ${this.renderEdgeMetrics()}
    `;
    document.getElementById('bs-save')?.addEventListener('click', () => {
      const s2: LifeBasicsState = {
        monthlyExpenses: parseFloat((document.getElementById('bs-mx') as HTMLInputElement).value) || 0,
        emergencyFund: parseFloat((document.getElementById('bs-ef') as HTMLInputElement).value) || 0,
        hasHealthInsurance: (document.getElementById('bs-hi') as HTMLSelectElement).value === 'y',
        hasTermLife: (document.getElementById('bs-tl') as HTMLSelectElement).value === 'y',
        highInterestDebt: parseFloat((document.getElementById('bs-debt') as HTMLInputElement).value) || 0,
        creditScore: parseFloat((document.getElementById('bs-cs') as HTMLInputElement).value) || 720,
        country: (document.getElementById('bs-co') as HTMLSelectElement).value as 'US' | 'IN',
      };
      localStorage.setItem('finsim.basics.v1', JSON.stringify(s2));
      this.render();
    });
  }

  private renderEdgeMetrics(): string {
    const rs = portfolio.getROutcomes();
    if (rs.length < 2) return '<p class="pro-sub">Close some trades to see Sharpe / Sortino / Max DD.</p>';
    const sh = sharpe(rs).toFixed(2);
    const so = sortino(rs).toFixed(2);
    let cum = 0;
    const equity = rs.map(r => { cum += r; return 10000 * (1 + cum * 0.01); });
    const dd = maxDrawdown(equity);
    return `<div class="pro-stats">
      <div><label>Sharpe</label><span>${sh}</span></div>
      <div><label>Sortino</label><span>${so}</span></div>
      <div><label>Max DD</label><span class="neg">${(dd.maxDD * 100).toFixed(1)}%</span></div>
      <div><label>R outcomes</label><span>${rs.length}</span></div>
    </div>`;
  }
}
