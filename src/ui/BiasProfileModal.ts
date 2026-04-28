import { biasProfile, BiasProfileSystem } from '@/systems/BiasProfile';
import { traderScore } from '@/systems/TraderScore';
import { soundManager } from '@/systems/SoundManager';

export class BiasProfileModal {
  private root: HTMLDivElement;
  private open_ = false;

  constructor() {
    let el = document.getElementById('bias-profile-modal') as HTMLDivElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = 'bias-profile-modal';
      el.className = 'bias-profile-modal hidden';
      document.body.appendChild(el);
    }
    this.root = el;
    this.root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.classList.contains('bp-backdrop') || t.classList.contains('bp-close')) this.close();
    });
  }

  isOpen(): boolean { return this.open_; }

  open(): void {
    if (this.open_) return;
    this.open_ = true;
    this.root.classList.remove('hidden');
    requestAnimationFrame(() => this.root.classList.add('visible'));
    this.render();
    soundManager.play('dialogueOpen');
  }

  close(): void {
    if (!this.open_) return;
    this.open_ = false;
    this.root.classList.remove('visible');
    window.setTimeout(() => this.root.classList.add('hidden'), 220);
  }

  toggle(): void { this.open_ ? this.close() : this.open(); }

  private render(): void {
    const snap = biasProfile.get();
    const score = traderScore.get();
    const labels = BiasProfileSystem.labels();

    const allTypes = Object.keys(labels);
    const max = Math.max(1, ...Object.values(snap.byBias));
    const biasRows = allTypes.map(type => {
      const count = snap.byBias[type] ?? 0;
      const pct = (count / max) * 100;
      return `
        <div class="bp-bias-row ${count === 0 ? 'bp-bias-empty' : ''}">
          <div class="bp-bias-name">${labels[type]}</div>
          <div class="bp-bias-bar"><div class="bp-bias-fill" style="width:${pct}%"></div></div>
          <div class="bp-bias-count">${count}</div>
        </div>
      `;
    }).join('');

    const insightsHtml = snap.insights.map(t => `<div class="bp-insight">💡 ${t}</div>`).join('');

    const tierColor: Record<string, string> = {
      Apprentice: '#8a98aa', Disciplined: '#4FD27A', Pro: '#5BB8FF',
      Master: '#F4C542', Legend: '#FF7A2B',
    };
    const tier = score.tier;
    const tierC = tierColor[tier] || '#F4C542';

    const pct = Math.min(100, (score.total / 1000) * 100);
    const r = 60; const c = 2 * Math.PI * r;
    const dash = (pct / 100) * c;

    this.root.innerHTML = `
      <div class="bp-backdrop"></div>
      <div class="bp-modal" role="dialog" aria-labelledby="bp-title">
        <header class="bp-head">
          <div>
            <h1 id="bp-title">Your Trader Profile</h1>
            <p class="bp-sub">Behavioral fingerprint, percentiles vs typical retail, and coaching insights.</p>
          </div>
          <button class="bp-close" aria-label="Close">✕</button>
        </header>

        <section class="bp-grid">
          <div class="bp-card bp-card-score">
            <div class="bp-score-wrap">
              <svg viewBox="0 0 160 160" class="bp-score-ring">
                <circle cx="80" cy="80" r="${r}" fill="none" stroke="#1F2A3F" stroke-width="14"/>
                <circle cx="80" cy="80" r="${r}" fill="none" stroke="${tierC}" stroke-width="14"
                  stroke-linecap="round" stroke-dasharray="${dash} ${c - dash}"
                  transform="rotate(-90 80 80)" class="bp-score-arc"/>
                <text x="80" y="76" text-anchor="middle" class="bp-score-num">${score.total}</text>
                <text x="80" y="98" text-anchor="middle" class="bp-score-tier" fill="${tierC}">${tier.toUpperCase()}</text>
              </svg>
            </div>
            <div class="bp-score-side">
              <h3>FinSim Trader Score</h3>
              <p class="bp-score-blurb">Composite of expectancy, discipline, drawdown control, win rate, and behavioral hygiene.</p>
              <div class="bp-score-grid">
                ${this.scoreCell('Expectancy',  score.components.expectancy,  250)}
                ${this.scoreCell('Discipline',  score.components.discipline,  250)}
                ${this.scoreCell('Drawdown',    score.components.drawdown,    200)}
                ${this.scoreCell('Win Rate',    score.components.winRate,     150)}
                ${this.scoreCell('Behavioral',  score.components.behavioral,  150)}
              </div>
            </div>
          </div>

          <div class="bp-card bp-card-stats">
            <h3>Behavioral Fingerprint</h3>
            <div class="bp-stat-row">
              <div class="bp-stat">
                <div class="bp-stat-num">${snap.fomoPercentile}<span>%ile</span></div>
                <div class="bp-stat-label">FOMO vs peers</div>
                <div class="bp-stat-bar"><div class="bp-stat-fill" style="width:${snap.fomoPercentile}%"></div></div>
              </div>
              <div class="bp-stat">
                <div class="bp-stat-num">${snap.patienceScore}<span>/100</span></div>
                <div class="bp-stat-label">Patience score</div>
                <div class="bp-stat-bar"><div class="bp-stat-fill bp-fill-patience" style="width:${snap.patienceScore}%"></div></div>
              </div>
              <div class="bp-stat">
                <div class="bp-stat-num">${snap.dispositionRatio.toFixed(2)}</div>
                <div class="bp-stat-label">Disposition ratio</div>
                <div class="bp-stat-hint">${snap.dispositionRatio > 1.4 ? 'You cut winners early' : snap.dispositionRatio < 0.7 ? 'You ride winners — pro' : 'Balanced'}</div>
              </div>
              <div class="bp-stat">
                <div class="bp-stat-num">${snap.avgHoldingMinutes}<span>min</span></div>
                <div class="bp-stat-label">Median hold</div>
                <div class="bp-stat-hint">${snap.avgHoldingMinutes < 30 ? 'Scalper tempo' : snap.avgHoldingMinutes < 240 ? 'Intraday' : 'Swing'}</div>
              </div>
            </div>
          </div>

          <div class="bp-card bp-card-bias">
            <h3>Bias Triggers · ${snap.totalTriggers} total${snap.topBias ? ` · top: ${snap.topBias.label}` : ''}</h3>
            <div class="bp-bias-list">${biasRows}</div>
          </div>

          <div class="bp-card bp-card-insights">
            <h3>Coaching Insights</h3>
            ${insightsHtml}
            <p class="bp-foot-note">Profile updates live as you trade. Hard Mode in Settings forces a 60s cool-off after 3 losses.</p>
          </div>
        </section>
      </div>
    `;
  }

  private scoreCell(label: string, val: number, max: number): string {
    const pct = (val / max) * 100;
    return `
      <div class="bp-score-cell">
        <div class="bp-score-cell-label">${label}</div>
        <div class="bp-score-cell-val">${val}<span>/${max}</span></div>
        <div class="bp-score-cell-bar"><div style="width:${pct}%"></div></div>
      </div>
    `;
  }
}
