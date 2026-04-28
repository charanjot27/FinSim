import { userProfile } from '@/systems/UserProfile';

interface Step {
  title: string;
  body: string;
  sceneKey?: string;
  highlightSel?: string;
  mood?: 'neutral' | 'warn' | 'win' | 'crypto' | 'quant' | 'vegas';
  ctaLabel?: string;
  activity?: string;
}

export type TourGoTo = (sceneKey: string) => void;

export class TourOverlay {
  private root: HTMLDivElement;
  private open_ = false;
  private stepIdx = 0;
  private steps: Step[];
  private onFinish: (() => void) | null = null;
  private routeTimer: number | null = null;

  constructor(private onGoTo: TourGoTo) {
    this.root = document.getElementById('tour') as HTMLDivElement;
    if (!this.root) throw new Error('Tour root missing (#tour)');
    this.steps = this.buildSteps();
  }

  private buildSteps(): Step[] {
    const prof = userProfile.get();
    const hi = prof.name ? prof.name : 'friend';
    return [

      {
        title: `Follow me, ${hi}.`,
        body: `I\u2019m <b>Mira</b> \u2014 a retired floor trader. I\u2019ll walk you through
               every district personally. Each stop is a real financial skill. Stick close,
               watch what I point at, and by the end you\u2019ll know exactly where you stand.`,
        mood: 'neutral',
        ctaLabel: 'Let\u2019s go \u2192',
        activity: 'Starting the guided walk\u2026',
      },

      {
        title: 'The financial metaverse.',
        body: `This is the world map. Six districts, each teaching a different lesson.
               Press <kbd>M</kbd> anytime to return here. The order matters less than the
               habit of visiting all of them.`,
        sceneKey: 'WorldMapScene',
        highlightSel: '#hud-district',
        mood: 'neutral',
        ctaLabel: 'Show me the first one \u2192',
        activity: 'Opening the world map',
      },

      {
        title: 'Scam Slum \u2014 spot the trap.',
        body: `This is where most retail investors start \u2014 and lose. That NPC Mr. Goldie
               will offer you a <b>guaranteed double in 7 days</b>. Press <kbd>E</kbd> to
               hear him, then walk away. <em>Guaranteed returns do not exist.</em>`,
        sceneKey: 'ScamSlumScene',
        mood: 'warn',
        ctaLabel: 'Got it, what\u2019s next \u2192',
        activity: 'Listening to a pitch and declining it',
      },

      {
        title: 'Wall Street \u2014 your first trade.',
        body: `The US equities floor. Walk to the terminal and press <kbd>E</kbd> to open it.
               Set a <b>stop-loss</b> before you click Buy. Risk <b>1% of your account</b>
               per trade. Position sizing is the only variable you fully control.`,
        sceneKey: 'WallStreetScene',
        mood: 'neutral',
        ctaLabel: 'Onwards \u2192',
        activity: 'Buying one share with a stop-loss',
      },

      {
        title: 'Dalal Street \u2014 the Bombay floor.',
        body: `Same skills, thinner liquidity. Large-caps trade fine; small-caps can gap
               20% on any rumour. Read <b>volumes</b>, not just prices. Every market has
               its own microstructure.`,
        sceneKey: 'DalalStreetScene',
        mood: 'neutral',
        ctaLabel: 'Continue \u2192',
        activity: 'Checking volume before a trade',
      },

      {
        title: 'Crypto Cove \u2014 24/7 volatility.',
        body: `No off-switch, no circuit breakers. Never risk more than you can lose.
               Verify contract addresses from <b>two independent sources</b>. Self-custody
               beats leaving funds on an exchange.`,
        sceneKey: 'CryptoCoveScene',
        mood: 'crypto',
        ctaLabel: 'Ready for the next \u2192',
        activity: 'Opening the Web3 terminal tab',
      },

      {
        title: 'Quant Quarter \u2014 edge from math.',
        body: `Factor models, vol arb, stat-arb. If you can\u2019t articulate your
               <b>Sharpe ratio</b>, you don\u2019t have an edge. And remember: backtests lie.
               Paper-trade any strategy for 90 days before risking real size.`,
        sceneKey: 'QuantQuarterScene',
        mood: 'quant',
        ctaLabel: 'Almost done \u2192',
        activity: 'Reading a backtest metric',
      },

      {
        title: 'Vegas Vice \u2014 the house edge.',
        body: `I\u2019m taking you here on purpose. Negative expectancy is a machine.
               No system, no streak, no "hot hand" beats math over time. Spend five minutes
               here, feel the pull, then <b>leave</b>. That muscle memory is the lesson.`,
        sceneKey: 'VegasViceScene',
        mood: 'vegas',
        ctaLabel: 'Final stop \u2192',
        activity: 'Feeling the pull, walking away',
      },

      {
        title: 'You\u2019re ready.',
        body: `You\u2019ve seen every district. From now on, three rules: <b>size small</b>,
               <b>stops always</b>, <b>skip the scams</b>. Open the <em>Leaderboard</em> to
               see where you stack up, and the <em>Map</em> (press <kbd>M</kbd>) to jump
               between districts. Good luck.`,
        sceneKey: 'WorldMapScene',
        highlightSel: '#btn-menu',
        mood: 'win',
        ctaLabel: 'Finish tour \u2713',
        activity: 'Back at the map \u2014 play begins',
      },
    ];
  }

  isOpen(): boolean { return this.open_; }

  start(onFinish?: () => void): void {
    this.onFinish = onFinish || null;
    this.stepIdx = 0;
    this.steps = this.buildSteps();
    this.open_ = true;
    this.root.classList.remove('hidden');
    requestAnimationFrame(() => this.root.classList.add('visible'));
    this.enter();
  }

  close(): void {
    if (!this.open_) return;
    this.open_ = false;
    this.root.classList.remove('visible');
    window.setTimeout(() => this.root.classList.add('hidden'), 220);
    document.querySelectorAll('.tour-spotlight').forEach(el => el.classList.remove('tour-spotlight'));
    if (this.routeTimer !== null) { window.clearTimeout(this.routeTimer); this.routeTimer = null; }
  }

  private enter(): void {
    const step = this.steps[this.stepIdx];
    if (step.sceneKey) {
      if (this.routeTimer !== null) window.clearTimeout(this.routeTimer);
      this.routeTimer = window.setTimeout(() => this.onGoTo(step.sceneKey!), 120);
    }
    this.render();
  }

  private render(): void {
    const step = this.steps[this.stepIdx];
    const progress = `${this.stepIdx + 1} / ${this.steps.length}`;
    const pillProfile = userProfile.get();
    this.root.innerHTML = `
      <div class="tour-veil tour-veil-soft"></div>
      <div class="tour-card tour-card-corner tour-mood-${step.mood ?? 'neutral'}">
        <div class="tour-mentor">
          <div class="tour-mentor-av">\u{1F9D9}\u200D\u2640\uFE0F</div>
          <div class="tour-mentor-meta">
            <b>Mira \u00B7 Mentor</b>
            <em>Retired floor trader \u00B7 30 years on the Street</em>
          </div>
          <div class="tour-progress">${progress}</div>
        </div>
        ${step.activity ? `<div class="tour-activity"><span class="tour-activity-dot"></span>${this.escape(step.activity)}</div>` : ''}
        <h2 class="tour-title">${step.title}</h2>
        <div class="tour-body">${step.body}</div>
        <div class="tour-dots">
          ${this.steps.map((_, i) => `<span class="tour-dot ${i === this.stepIdx ? 'active' : ''} ${i < this.stepIdx ? 'done' : ''}"></span>`).join('')}
        </div>
        <div class="tour-foot">
          <button class="tour-btn tour-btn-ghost" data-act="skip">Skip tour</button>
          <div class="tour-nav">
            ${this.stepIdx > 0 ? '<button class="tour-btn tour-btn-back" data-act="back">\u2190 Back</button>' : ''}
            <button class="tour-btn tour-btn-next" data-act="next">${step.ctaLabel ?? 'Next \u2192'}</button>
          </div>
        </div>
        <div class="tour-signature">${pillProfile.avatar || '\u{1F464}'} playing as <b>${this.escape(pillProfile.name || 'Investor')}</b></div>
      </div>
    `;
    this.applySpotlight(step.highlightSel);
    this.bind();
  }

  private applySpotlight(sel?: string): void {
    document.querySelectorAll('.tour-spotlight').forEach(el => el.classList.remove('tour-spotlight'));
    if (!sel) return;
    const t = document.querySelector(sel);
    if (t) t.classList.add('tour-spotlight');
  }

  private bind(): void {
    this.root.querySelectorAll('[data-act]').forEach(b => {
      b.addEventListener('click', (e) => {
        const act = (e.currentTarget as HTMLElement).getAttribute('data-act');
        if (act === 'skip')  { this.finish(false); return; }
        if (act === 'back')  {
          this.stepIdx = Math.max(0, this.stepIdx - 1);
          this.enter();
          return;
        }
        if (act === 'next')  {
          if (this.stepIdx >= this.steps.length - 1) { this.finish(true); return; }
          this.stepIdx += 1; this.enter();
        }
      });
    });
  }

  private finish(completed: boolean): void {
    if (completed) userProfile.markTourDone();
    this.close();
    if (this.onFinish) this.onFinish();
  }

  private escape(s: string): string {
    return s.replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' } as Record<string,string>)[c]);
  }
}
