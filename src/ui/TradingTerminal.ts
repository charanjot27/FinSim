import { portfolio } from '@/systems/PortfolioSystem';
import { marketEngine } from '@/systems/MarketEngine';
import { behaviorTracker } from '@/systems/BehaviorTracker';
import { formatCurrency, formatPct } from '@/lib/math';
import { soundManager } from '@/systems/SoundManager';
import type { Stock, BiasDetection } from '@/types';

export class TradingTerminal {
  private modal: HTMLElement;
  private titleEl: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private stockListEl: HTMLElement;
  private stockNameEl: HTMLElement;
  private stockPriceEl: HTMLElement;
  private stockChangeEl: HTMLElement;
  private chartCanvas: HTMLCanvasElement;
  private qtyInput: HTMLInputElement;
  private stopInput: HTMLInputElement;
  private targetInput: HTMLInputElement;
  private riskInput: HTMLInputElement;
  private sourceSelect: HTMLSelectElement;
  private orderSelect: HTMLSelectElement;
  private riskPreview: HTMLElement;
  private buyBtn: HTMLButtonElement;
  private sellBtn: HTMLButtonElement;
  private resultEl: HTMLElement;
  private selected: Stock | null = null;
  private market: 'wall-street' | 'dalal-street' = 'wall-street';
  private unsubscribe: (() => void) | null = null;
  private biasHandler: ((bias: BiasDetection) => void) | null = null;

  constructor(biasHandler: (bias: BiasDetection) => void) {
    this.modal = document.getElementById('trading-terminal')!;
    this.titleEl = document.getElementById('terminal-title')!;
    this.closeBtn = document.getElementById('terminal-close') as HTMLButtonElement;
    this.stockListEl = document.getElementById('stock-list')!;
    this.stockNameEl = document.getElementById('stock-name')!;
    this.stockPriceEl = document.getElementById('stock-price')!;
    this.stockChangeEl = document.getElementById('stock-change')!;
    this.chartCanvas = document.getElementById('price-chart') as HTMLCanvasElement;
    this.qtyInput = document.getElementById('trade-qty') as HTMLInputElement;
    this.stopInput = document.getElementById('trade-stop') as HTMLInputElement;
    this.targetInput = document.getElementById('trade-target') as HTMLInputElement;
    this.riskInput = document.getElementById('trade-risk') as HTMLInputElement;
    this.sourceSelect = document.getElementById('trade-source') as HTMLSelectElement;
    this.orderSelect = document.getElementById('trade-order') as HTMLSelectElement;
    this.riskPreview = document.getElementById('risk-preview')!;
    this.buyBtn = document.getElementById('btn-buy') as HTMLButtonElement;
    this.sellBtn = document.getElementById('btn-sell') as HTMLButtonElement;
    this.resultEl = document.getElementById('trade-result')!;
    this.biasHandler = biasHandler;

    this.closeBtn.addEventListener('click', () => {
      soundManager.play('click');
      this.close();
    });
    this.buyBtn.addEventListener('click', () => this.executeTrade('buy'));
    this.sellBtn.addEventListener('click', () => this.executeTrade('sell'));
    this.buyBtn.addEventListener('mouseenter', () => soundManager.play('hover'));
    this.sellBtn.addEventListener('mouseenter', () => soundManager.play('hover'));

    ['input', 'change'].forEach(ev => {
      [this.qtyInput, this.stopInput, this.riskInput].forEach(el =>
        el.addEventListener(ev, () => this.updateRiskPreview()));
    });
  }

  private updateRiskPreview(): void {
    if (!this.selected) { this.riskPreview.className = 'risk-preview'; return; }
    const qty = parseInt(this.qtyInput.value, 10);
    const stop = parseFloat(this.stopInput.value);
    const risk = parseFloat(this.riskInput.value);
    const entry = this.selected.price;
    const equity = portfolio.getTotalValue();
    if (!stop || !qty || qty < 1) {
      this.riskPreview.className = 'risk-preview visible warn';
      this.riskPreview.innerHTML = '\u26a0 Stop-loss required. Know your exit before your entry.';
      return;
    }
    const dollarRisk = Math.abs(entry - stop) * qty;
    const pctOfAccount = (dollarRisk / equity) * 100;
    const riskCap = (risk / 100) * equity;
    const notional = entry * qty;
    const notionalPct = (notional / equity) * 100;
    const okRisk = dollarRisk <= riskCap;
    this.riskPreview.className = `risk-preview visible ${okRisk ? 'ok' : 'warn'}`;
    this.riskPreview.innerHTML = `
      ${okRisk ? '\u2713' : '\u26a0'}
      Risk: <strong>${this.selected.currency}${dollarRisk.toFixed(2)}</strong> (${pctOfAccount.toFixed(2)}% of ${this.selected.currency}${equity.toFixed(0)}) \u00b7
      Notional: <strong>${this.selected.currency}${notional.toFixed(0)}</strong> (${notionalPct.toFixed(1)}%)
      ${!okRisk ? ` \u00b7 <em>Above ${risk}% cap \u2014 reduce size.</em>` : ''}
    `;
  }

  open(market: 'wall-street' | 'dalal-street'): void {
    this.market = market;
    this.titleEl.textContent = market === 'wall-street'
      ? '🏛 NYSE Trading Terminal — Wall Street'
      : '🏛 BSE/NSE Terminal — Dalal Street';

    this.renderStockList();
    this.modal.classList.remove('hidden');
    soundManager.play('dialogueOpen');

    this.unsubscribe = marketEngine.subscribe(() => {
      this.renderStockList();
      if (this.selected) {
        const fresh = marketEngine.getStock(this.selected.symbol);
        if (fresh) {
          this.selected = fresh;
          this.renderSelectedStock();
        }
      }
    });

    behaviorTracker.log('terminal_open', { market });
  }

  close(): void {
    this.modal.classList.add('hidden');
    this.resultEl.className = 'trade-result';
    this.resultEl.textContent = '';
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  isOpen(): boolean {
    return !this.modal.classList.contains('hidden');
  }

  private renderStockList(): void {
    const stocks = marketEngine.getStocksByMarket(this.market);
    this.stockListEl.innerHTML = '';
    stocks.forEach(stock => {
      const change = stock.price - stock.prevClose;
      const pct = (change / stock.prevClose) * 100;
      const isActive = this.selected?.symbol === stock.symbol;

      const row = document.createElement('div');
      row.className = `stock-row${isActive ? ' active' : ''}`;
      row.innerHTML = `
        <div class="stock-row-top">
          <span class="stock-row-symbol">${stock.symbol}</span>
          <span>${stock.currency}${stock.price.toFixed(2)}</span>
        </div>
        <div class="stock-row-bottom">
          <span>${stock.sector}</span>
          <span style="color:${pct >= 0 ? '#4A9B5E' : '#C44536'}">${formatPct(pct)}</span>
        </div>
      `;
      row.onclick = () => {
        this.selected = stock;
        this.renderStockList();
        this.renderSelectedStock();
      };
      this.stockListEl.appendChild(row);
    });

    if (!this.selected && stocks.length > 0) {
      this.selected = stocks[0];
      this.renderSelectedStock();
    }
  }

  private renderSelectedStock(): void {
    if (!this.selected) return;
    const s = this.selected;
    const change = s.price - s.prevClose;
    const pct = (change / s.prevClose) * 100;

    this.stockNameEl.textContent = `${s.symbol} — ${s.name}`;
    this.stockPriceEl.textContent = `${s.currency}${s.price.toFixed(2)}`;
    this.stockChangeEl.className = `stock-change ${pct >= 0 ? 'positive' : 'negative'}`;
    this.stockChangeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${formatPct(pct)})`;

    this.drawChart();
  }

  private drawChart(): void {
    if (!this.selected) return;
    const ctx = this.chartCanvas.getContext('2d');
    if (!ctx) return;

    const candles = this.selected.candles.slice(-80);
    const W = this.chartCanvas.width;
    const H = this.chartCanvas.height;
    const PADDING = { top: 10, right: 50, bottom: 20, left: 10 };
    const chartW = W - PADDING.left - PADDING.right;
    const chartH = H - PADDING.top - PADDING.bottom;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    if (candles.length === 0) return;

    const allHighs = candles.map(c => c.high);
    const allLows = candles.map(c => c.low);
    const maxPrice = Math.max(...allHighs);
    const minPrice = Math.min(...allLows);
    const range = maxPrice - minPrice || 1;

    const candleW = chartW / candles.length;
    const bodyW = Math.max(2, candleW * 0.7);

    ctx.strokeStyle = '#2C4364';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#5A5A5A';
    for (let i = 0; i <= 4; i++) {
      const y = PADDING.top + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + chartW, y);
      ctx.stroke();
      const priceAtY = maxPrice - (range * i) / 4;
      ctx.fillText(priceAtY.toFixed(2), PADDING.left + chartW + 4, y + 3);
    }

    candles.forEach((candle, i) => {
      const x = PADDING.left + i * candleW + candleW / 2;
      const highY = PADDING.top + ((maxPrice - candle.high) / range) * chartH;
      const lowY = PADDING.top + ((maxPrice - candle.low) / range) * chartH;
      const openY = PADDING.top + ((maxPrice - candle.open) / range) * chartH;
      const closeY = PADDING.top + ((maxPrice - candle.close) / range) * chartH;

      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#4A9B5E' : '#C44536';

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(1, Math.abs(closeY - openY));
      ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyH);
    });

    const latestY = PADDING.top + ((maxPrice - this.selected.price) / range) * chartH;
    ctx.strokeStyle = '#D4A84B';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PADDING.left, latestY);
    ctx.lineTo(PADDING.left + chartW, latestY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private executeTrade(side: 'buy' | 'sell'): void {
    if (!this.selected) {
      this.showResult('Select a stock first.', 'error');
      return;
    }
    const qty = parseInt(this.qtyInput.value, 10);
    if (!qty || qty < 1) {
      this.showResult('Enter a valid quantity.', 'error');
      return;
    }
    const stopPrice = parseFloat(this.stopInput.value);
    const targetPrice = parseFloat(this.targetInput.value);
    const riskPct = parseFloat(this.riskInput.value) || 1;
    const source = this.sourceSelect.value;
    const orderType = this.orderSelect.value as 'market' | 'limit' | 'stop' | 'bracket';
    const hasStop = Number.isFinite(stopPrice) && stopPrice > 0;

    if (side === 'buy' && !hasStop) {
      this.showResult('\u26a0 Stop-loss required for new positions. Pros know their exit before their entry.', 'error');
      return;
    }

    const bias = behaviorTracker.checkPreTrade({
      symbol: this.selected.symbol, side, quantity: qty,
      hasStop, riskPct, sources: [source],
    });
    if (bias && this.biasHandler) {
      this.biasHandler(bias);
      (window as unknown as { __pendingTrade?: () => void }).__pendingTrade = () => this.doTrade(side, qty, stopPrice, targetPrice, riskPct, orderType, source);
      return;
    }

    this.doTrade(side, qty, stopPrice, targetPrice, riskPct, orderType, source);
  }

  private doTrade(
    side: 'buy' | 'sell', qty: number,
    stopPrice?: number, targetPrice?: number, riskPct?: number,
    orderType?: 'market' | 'limit' | 'stop' | 'bracket', source?: string,
  ): void {
    if (!this.selected) return;
    const district = this.market === 'wall-street' ? 'Wall Street' : 'Dalal Street';
    const opts = Number.isFinite(stopPrice) ? { stopPrice, targetPrice, riskPct, orderType } : undefined;
    const result = side === 'buy'
      ? portfolio.buy(this.selected.symbol, qty, district, opts)
      : portfolio.sell(this.selected.symbol, qty, district, opts);

    if (result.ok) {
      const pnl = (result as { pnl?: number }).pnl;
      if (side === 'sell' && pnl !== undefined) {
        const pnlStr = pnl >= 0 ? `+${formatCurrency(pnl, '$')}` : formatCurrency(pnl, '$');
        this.showResult(`Sold ${qty} ${this.selected.symbol}. P&L: ${pnlStr}`, 'success');
        soundManager.play(pnl >= 0 ? 'coin' : 'sell');
      } else {
        this.showResult(`Bought ${qty} ${this.selected.symbol} at ${this.selected.currency}${this.selected.price.toFixed(2)}`, 'success');
        soundManager.play('buy');
      }
      behaviorTracker.log('trade_executed', {
        symbol: this.selected.symbol, side, qty, price: this.selected.price,
        stop: stopPrice, target: targetPrice, riskPct, orderType, source,
      });
    } else {
      this.showResult(result.error || 'Trade failed.', 'error');
      soundManager.play('error');
    }
  }

  private showResult(msg: string, type: 'success' | 'error'): void {
    this.resultEl.className = `trade-result ${type}`;
    this.resultEl.textContent = msg;
    window.setTimeout(() => {
      this.resultEl.className = 'trade-result';
      this.resultEl.textContent = '';
    }, 4000);
  }
}
