import { leaderboard, LbRow } from '@/systems/Leaderboard';
import { formatCurrency } from '@/lib/math';

export class LeaderboardOverlay {
  private root: HTMLDivElement;
  private open_ = false;
  private unsub: (() => void) | null = null;
  private unsubPortfolio: (() => void) | null = null;

  constructor() {
    this.root = document.getElementById('leaderboard') as HTMLDivElement;
    if (!this.root) throw new Error('Leaderboard root missing (#leaderboard)');
    this.bindStatic();
  }

  private bindStatic(): void {
    this.root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.classList.contains('lb-backdrop')) this.close();
      if (t.classList.contains('lb-close'))    this.close();
      if (t.classList.contains('lb-reset'))    { leaderboard.resetDummies(); this.render(); }
    });
  }

  isOpen(): boolean { return this.open_; }

  open(): void {
    if (this.open_) return;
    this.open_ = true;
    this.root.classList.remove('hidden');
    requestAnimationFrame(() => this.root.classList.add('visible'));
    this.render();
    this.unsub = leaderboard.subscribe(() => this.render());

    import('@/systems/PortfolioSystem').then(m => {
      this.unsubPortfolio = m.portfolio.subscribe(() => this.render());
    });
  }

  close(): void {
    if (!this.open_) return;
    this.open_ = false;
    this.root.classList.remove('visible');
    window.setTimeout(() => this.root.classList.add('hidden'), 220);
    this.unsub?.(); this.unsub = null;
    this.unsubPortfolio?.(); this.unsubPortfolio = null;
  }

  toggle(): void { this.open_ ? this.close() : this.open(); }

  private render(): void {
    const rows = leaderboard.getRanked();
    const counts = leaderboard.getCounts();
    const top = rows.slice(0, 3);
    const rest = rows.slice(3);
    const tag = counts.cloud
      ? `Firestore \u00B7 <b>${counts.live}</b> live \u00B7 <b>${counts.bots}</b> bots \u00B7 ${counts.total} total`
      : `Offline preview \u00B7 you vs ${counts.bots} simulated traders \u00B7 sign in to go live`;
    this.root.innerHTML = `
      <div class="lb-backdrop"></div>
      <div class="lb-modal">
        <header class="lb-head">
          <div>
            <h1>Global Leaderboard</h1>
            <p class="lb-tag">${tag}</p>
          </div>
          <button class="lb-close" aria-label="Close">\u2715</button>
        </header>
        <section class="lb-podium">
          ${top.map((r, i) => this.podium(r, i)).join('')}
        </section>
        <section class="lb-table-wrap">
          <table class="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Trader</th>
                <th>District</th>
                <th class="num">Equity</th>
                <th class="num">P&amp;L</th>
                <th class="num">Streak</th>
              </tr>
            </thead>
            <tbody>
              ${rest.map(r => this.tr(r)).join('')}
            </tbody>
          </table>
        </section>
        <footer class="lb-foot">
          <span class="lb-legend">
            <i class="lb-you-dot"></i> You
            <span class="lb-legend-sep">\u00B7</span>
            <span class="lb-live-dot" title="Active in last 60s"></span> live
            <span class="lb-legend-sep">\u00B7</span>
            <span class="lb-bot-ico">\u{1F916}</span> bot
          </span>
          <button class="lb-btn lb-reset">Reshuffle dummies</button>
        </footer>
      </div>
    `;
  }

  private podium(r: LbRow, i: number): string {
    const rank = ['GOLD','SILVER','BRONZE'][i] ?? '';
    return `
      <div class="lb-podium-card lb-pod-${i + 1} ${r.isYou ? 'lb-you' : ''}">
        <span class="lb-pod-rank">${i + 1}</span>
        <span class="lb-pod-badge">${rank}</span>
        <div class="lb-pod-avatar">${r.avatar}</div>
        <div class="lb-pod-name">${this.escape(r.name)}${r.isYou ? ' <em>(you)</em>' : ''}</div>
        <div class="lb-pod-eq">${this.fmt(r.equity)}</div>
        <div class="lb-pod-pnl ${r.pnlPct >= 0 ? 'pos' : 'neg'}">${r.pnlPct >= 0 ? '+' : ''}${r.pnlPct.toFixed(1)}%</div>
      </div>
    `;
  }

  private tr(r: LbRow): string {
    const badge = r.isBot
      ? '<span class="lb-badge lb-badge-bot" title="AI bot">\u{1F916}</span>'
      : r.isLive
        ? '<span class="lb-badge lb-badge-live" title="Active in last 60s"></span>'
        : '';
    const arche = r.archetype ? `<span class="lb-archetype" title="Strategy archetype">${this.escape(r.archetype)}</span>` : '';
    return `
      <tr class="${r.isYou ? 'lb-you-row' : ''}">
        <td class="lb-rank">${r.rank}</td>
        <td class="lb-trader">
          <span class="lb-avatar">${r.avatar}</span>
          <span class="lb-name">${this.escape(r.name)}${r.isYou ? ' <em>(you)</em>' : ''}</span>
          ${arche}
          ${badge}
        </td>
        <td class="lb-district">${this.escape(r.district)}</td>
        <td class="num">${this.fmt(r.equity)}</td>
        <td class="num ${r.pnlPct >= 0 ? 'pos' : 'neg'}">${r.pnlPct >= 0 ? '+' : ''}${r.pnlPct.toFixed(1)}%</td>
        <td class="num">${r.streakDays ?? 0}d</td>
      </tr>
    `;
  }

  private fmt(v: number): string {
    try { return formatCurrency(v, '\u20B9'); } catch { return '\u20B9' + v.toLocaleString(); }
  }

  private escape(s: string): string {
    return s.replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' } as Record<string,string>)[c]);
  }
}
