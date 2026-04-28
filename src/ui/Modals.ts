import { portfolio } from '@/systems/PortfolioSystem';
import { marketEngine } from '@/systems/MarketEngine';
import { formatCurrency, formatPct } from '@/lib/math';
import { soundManager } from '@/systems/SoundManager';

export class PortfolioModal {
  private modal: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private cashEl: HTMLElement;
  private holdingsValueEl: HTMLElement;
  private pnlEl: HTMLElement;
  private holdingsBody: HTMLElement;
  private txBody: HTMLElement;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.modal = document.getElementById('portfolio-modal')!;
    this.closeBtn = document.getElementById('portfolio-close') as HTMLButtonElement;
    this.cashEl = document.getElementById('pf-cash')!;
    this.holdingsValueEl = document.getElementById('pf-holdings-value')!;
    this.pnlEl = document.getElementById('pf-pnl')!;
    this.holdingsBody = document.getElementById('holdings-body')!;
    this.txBody = document.getElementById('transactions-body')!;

    this.closeBtn.addEventListener('click', () => {
      soundManager.play('click');
      this.close();
    });
  }

  open(): void {
    this.render();
    this.modal.classList.remove('hidden');
    soundManager.play('dialogueOpen');
    this.unsubscribe = marketEngine.subscribe(() => this.render());
  }

  close(): void {
    this.modal.classList.add('hidden');
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  isOpen(): boolean {
    return !this.modal.classList.contains('hidden');
  }

  private render(): void {
    const cash = portfolio.getCash();
    const holdingsValue = portfolio.getHoldingsValue();
    const pnl = portfolio.getTotalPnl();

    this.cashEl.textContent = formatCurrency(cash);
    this.holdingsValueEl.textContent = formatCurrency(holdingsValue);
    this.pnlEl.textContent = formatCurrency(pnl);
    this.pnlEl.className = `summary-value ${pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`;

    const holdings = portfolio.getHoldings();
    this.holdingsBody.innerHTML = '';
    if (holdings.length === 0) {
      this.holdingsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#5A5A5A">No holdings yet. Visit a brokerage to trade.</td></tr>';
    } else {
      holdings.forEach(h => {
        const stock = marketEngine.getStock(h.symbol);
        const currentPrice = stock?.price ?? h.avgPrice;
        const curr = stock?.currency ?? '';
        const pnl = (currentPrice - h.avgPrice) * h.quantity;
        const pnlPct = ((currentPrice - h.avgPrice) / h.avgPrice) * 100;
        const pnlCls = pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${h.symbol}</strong></td>
          <td>${h.quantity}</td>
          <td>${curr}${h.avgPrice.toFixed(2)}</td>
          <td>${curr}${currentPrice.toFixed(2)}</td>
          <td class="${pnlCls}">${pnl >= 0 ? '+' : ''}${curr}${pnl.toFixed(2)} (${formatPct(pnlPct)})</td>
        `;
        this.holdingsBody.appendChild(tr);
      });
    }

    const txs = portfolio.getTransactions().slice(-20).reverse();
    this.txBody.innerHTML = '';
    if (txs.length === 0) {
      this.txBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#5A5A5A">No transactions yet.</td></tr>';
    } else {
      txs.forEach(tx => {
        const tr = document.createElement('tr');
        const date = new Date(tx.timestamp);
        const timeStr = `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
        const sideCls = tx.side === 'buy' ? 'pnl-positive' : 'pnl-negative';
        tr.innerHTML = `
          <td>${timeStr}</td>
          <td><strong>${tx.symbol}</strong></td>
          <td class="${sideCls}">${tx.side.toUpperCase()}</td>
          <td>${tx.quantity}</td>
          <td>${tx.price.toFixed(2)}</td>
        `;
        this.txBody.appendChild(tr);
      });
    }
  }
}

import type { BiasDetection } from '@/types';

export class BiasToast {
  private toast: HTMLElement;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private proceedBtn: HTMLButtonElement;
  private cancelBtn: HTMLButtonElement;
  private pendingTrade: (() => void) | null = null;

  constructor() {
    this.toast = document.getElementById('bias-toast')!;
    this.titleEl = document.getElementById('toast-title')!;
    this.bodyEl = document.getElementById('toast-body')!;
    this.proceedBtn = document.getElementById('toast-proceed') as HTMLButtonElement;
    this.cancelBtn = document.getElementById('toast-cancel') as HTMLButtonElement;

    this.proceedBtn.addEventListener('click', () => {
      soundManager.play('click');
      if (this.pendingTrade) this.pendingTrade();
      this.hide();
    });
    this.cancelBtn.addEventListener('click', () => {
      soundManager.play('click');
      this.pendingTrade = null;
      (window as unknown as { __pendingTrade?: () => void }).__pendingTrade = undefined;
      this.hide();
    });
  }

  show(bias: BiasDetection): void {
    this.titleEl.textContent = bias.title;
    this.bodyEl.innerHTML = `${bias.message}<br><br><em style="color:#F4C542">${bias.statistic}</em>`;
    this.toast.classList.remove('hidden');
    soundManager.play('alert');

    this.pendingTrade = (window as unknown as { __pendingTrade?: () => void }).__pendingTrade ?? null;
  }

  hide(): void {
    this.toast.classList.add('hidden');
    this.pendingTrade = null;
  }
}

export class HelpModal {
  private modal: HTMLElement;
  private closeBtn: HTMLButtonElement;

  constructor() {
    this.modal = document.getElementById('help-modal')!;
    this.closeBtn = document.getElementById('help-close') as HTMLButtonElement;
    this.closeBtn.addEventListener('click', () => {
      soundManager.play('click');
      this.close();
    });
  }

  open(): void {
    this.modal.classList.remove('hidden');
    soundManager.play('dialogueOpen');
  }
  close(): void { this.modal.classList.add('hidden'); }
  isOpen(): boolean { return !this.modal.classList.contains('hidden'); }
}

import type { EchoScenario } from '@/types';
import { getRandomEchoScenario } from '@/data/echoScenarios';

export class EchoModal {
  private modal: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private contentEl: HTMLElement;
  private scenario: EchoScenario | null = null;

  constructor() {
    this.modal = document.getElementById('echo-modal')!;
    this.closeBtn = document.getElementById('echo-close') as HTMLButtonElement;
    this.contentEl = document.getElementById('echo-content')!;
    this.closeBtn.addEventListener('click', () => {
      soundManager.play('click');
      this.close();
    });
  }

  open(scenario?: EchoScenario): void {
    this.scenario = scenario ?? getRandomEchoScenario();
    this.renderPrompt();
    this.modal.classList.remove('hidden');
    soundManager.play('portal');
  }

  close(): void { this.modal.classList.add('hidden'); }
  isOpen(): boolean { return !this.modal.classList.contains('hidden'); }

  private renderPrompt(): void {
    if (!this.scenario) return;
    const s = this.scenario;
    const headlinesHtml = s.headlines.map(h => `<div class="echo-headline">📰 ${h}</div>`).join('');
    const actionsHtml = s.actions.map(a =>
      `<button class="echo-action-btn" data-action="${a.id}">${a.label}</button>`
    ).join('');

    this.contentEl.innerHTML = `
      <div class="echo-scenario">
        <h3 style="color:#D4A84B">🕰 Scenario: ${s.titleHidden}</h3>
        <div class="echo-context">${s.contextHidden}</div>
        <h4 style="color:#D4A84B;margin-bottom:8px">Today's Headlines:</h4>
        <div class="echo-headlines">${headlinesHtml}</div>
        <canvas id="echo-chart" width="800" height="200" style="width:100%;background:#000;border:2px solid #2C4364;border-radius:4px;margin:20px 0;"></canvas>
        <h4 style="color:#D4A84B;margin-bottom:8px">What do you do?</h4>
        <div class="echo-actions">${actionsHtml}</div>
      </div>
    `;

    this.drawEchoChart();

    this.contentEl.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(btn => {
      btn.addEventListener('mouseenter', () => soundManager.play('hover'));
      btn.addEventListener('click', () => {
        soundManager.play('choice');
        const actionId = btn.dataset.action!;
        this.revealResult(actionId);
      });
    });
  }

  private drawEchoChart(): void {
    if (!this.scenario) return;
    const canvas = document.getElementById('echo-chart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.scenario.chartData;
    const W = canvas.width;
    const H = canvas.height;
    const P = 20;
    const chartW = W - P * 2;
    const chartH = H - P * 2;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#2C4364';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = P + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(P, y);
      ctx.lineTo(P + chartW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#D4A84B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((price, i) => {
      const x = P + (i / (data.length - 1)) * chartW;
      const y = P + ((max - price) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  private revealResult(chosenActionId: string): void {
    if (!this.scenario) return;
    const s = this.scenario;
    const chosen = s.actions.find(a => a.id === chosenActionId);
    const correct = chosenActionId === s.correctActionId;
    const fraudCls = s.isFraud ? 'echo-reveal-fraud' : '';
    soundManager.play(correct ? 'success' : 'error');

    const verdict = correct
      ? `<h3 style="color:#4A9B5E">✓ You matched the winning move!</h3>`
      : s.isFraud && chosenActionId === 'run_the_scam'
        ? `<h3 style="color:#C44536">✗ You just committed a crime.</h3>`
        : `<h3>Not the best move.</h3>`;

    this.contentEl.innerHTML += `
      <div class="echo-reveal ${fraudCls}">
        ${verdict}
        <p style="margin:12px 0"><strong>Your action:</strong> ${chosen?.label}</p>
        <p style="margin:12px 0"><strong>Result:</strong> ${chosen?.outcomeIfChosen}</p>
        <hr style="margin:16px 0;border-color:#2C4364">
        <h3 style="color:#D4A84B">The Real Story</h3>
        <p style="margin:12px 0"><strong>${s.titleRevealed}</strong></p>
        <p style="margin:12px 0">${s.contextRevealed}</p>
        <p style="margin:12px 0"><strong>${s.heroName}:</strong> ${s.heroOutcome}</p>
        <div class="echo-lesson">
          <strong style="color:#D4A84B">📚 Lesson:</strong> ${s.lesson}
        </div>
      </div>
    `;

    this.contentEl.scrollTop = this.contentEl.scrollHeight;
  }
}
