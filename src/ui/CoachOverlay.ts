import { behaviorTracker } from '@/systems/BehaviorTracker';
import { miraCoach } from '@/systems/MiraCoach';
import type { BiasDetection } from '@/types';

interface CoachMessage {
  when: RegExp;
  icon: string;
  title: string;
  body: (ctx: Record<string, unknown>) => string;
}

const LESSONS: CoachMessage[] = [
  {
    when: /^trade_executed$/,
    icon: '\ud83d\udcc8',
    title: 'Real-world lesson',
    body: (ctx) => {
      const side = ctx.side as string;
      const hasStop = Boolean(ctx.stop);
      if (!hasStop && side === 'buy') return 'You bought without a stop-loss. IRL this is how 80% of retail accounts blow up. Next trade: write the exit first.';
      if (ctx.source === 'twitter' || ctx.source === 'telegram') return 'Trade sourced from social media. In the real world, tier-1 wire services (Reuters, Bloomberg) beat finfluencers. Wait 48h on social tips.';
      return `Good: stop defined upfront means risk = (entry \u2212 stop) \u00d7 qty. Save this pattern \u2014 it is 95% of real-world trading skill.`;
    },
  },
  {
    when: /^bias_detected$/,
    icon: '\ud83e\udde0',
    title: 'Cognitive bias detected',
    body: (ctx) => {
      const kind = (ctx.kind || ctx.type) as string;
      const map: Record<string, string> = {
        FOMO:          'FOMO buys chase tops. IRL rule: if the chart made a green candle in the last 30m, wait. Come back tomorrow.',
        REVENGE:       'Revenge trades double down after a loss. IRL: losing streak > 3? Close the app for 24h. Data says your edge is off.',
        OVERCONFIDENCE:'After 3 wins, brains lower risk perception. IRL: cut size by 50% after a streak. Mean reversion is real.',
        NAKED_TRADE:   'No stop = gambling. Pros never enter a position without pre-defining max loss.',
        NEWS_ROULETTE: 'Trading every headline = news roulette. IRL: wait for wire confirmation + 2 independent sources.',
        TWEET_TRADE:   'Acting on a tweet without corroboration. Check SEC filings or official company PR first.',
      };
      return map[kind] || 'Bias detected. Over-trading is the #1 killer of real accounts.';
    },
  },
  {
    when: /^portfolio_loaded$/,
    icon: '\u2728',
    title: 'Welcome back',
    body: () => 'Every session records your decisions, biases, and R-multiples \u2014 exactly like an IRL trade journal. Press L for the Learn Hub.',
  },
];

interface QueuedMsg {
  icon: string;
  title: string;
  body: string;

  liveBody?: Promise<string | null>;
}

export class CoachOverlay {
  private root: HTMLDivElement;
  private queue: QueuedMsg[] = [];
  private showing = false;
  private currentToken = 0;

  constructor() {
    this.root = document.getElementById('coach-overlay') as HTMLDivElement;
    if (!this.root) throw new Error('CoachOverlay: #coach-overlay missing');
    behaviorTracker.subscribe((event) => this.handleEvent(event));
  }

  private handleEvent(event: { type: string; payload: Record<string, unknown> }): void {
    for (const l of LESSONS) {
      if (l.when.test(event.type)) {
        const queued: QueuedMsg = {
          icon: l.icon, title: l.title, body: l.body(event.payload),
        };

        if (event.type === 'bias_detected') {
          const p = event.payload;
          const bias: BiasDetection = {
            type:      String(p.type || p.kind || 'unknown') as BiasDetection['type'],
            severity:  (p.severity as BiasDetection['severity']) || 'medium',
            title:     l.title,
            message:   queued.body,
            statistic: '',
          };
          queued.liveBody = miraCoach.getCoachingMessage(bias, {
            symbol: typeof p.symbol === 'string' ? p.symbol : undefined,
            side:   p.side === 'buy' || p.side === 'sell' ? p.side : undefined,
          });
        }
        this.enqueue(queued);
        break;
      }
    }
  }

  private enqueue(msg: QueuedMsg): void {
    this.queue.push(msg);
    if (!this.showing) this.showNext();
  }

  private showNext(): void {
    const msg = this.queue.shift();
    if (!msg) { this.showing = false; return; }
    this.showing = true;
    const token = ++this.currentToken;

    this.root.innerHTML = `
      <div class="coach-toast">
        <span class="coach-icon">${msg.icon}</span>
        <div class="coach-body">
          <div class="coach-title">${this.escape(msg.title)}</div>
          <div class="coach-text">${this.escape(msg.body)}</div>
        </div>
        <button class="coach-close" aria-label="dismiss">\u2715</button>
      </div>
    `;
    this.root.classList.add('visible');
    const closer = () => this.dismiss();
    this.root.querySelector('.coach-close')?.addEventListener('click', closer);
    const autoCloseTimer = window.setTimeout(closer, 6500);

    if (msg.liveBody) {
      msg.liveBody.then((live) => {
        if (!live || token !== this.currentToken) return;
        const textEl  = this.root.querySelector('.coach-text');
        const titleEl = this.root.querySelector('.coach-title');
        if (!textEl || !titleEl) return;
        textEl.textContent = live;
        if (!titleEl.querySelector('.coach-mira-chip')) {
          const chip = document.createElement('span');
          chip.className = 'coach-mira-chip';
          chip.textContent = 'Mira AI';
          titleEl.appendChild(chip);
        }

        window.clearTimeout(autoCloseTimer);
        window.setTimeout(closer, 8000);
      }).catch(() => {  });
    }
  }

  private dismiss(): void {
    this.root.classList.remove('visible');
    window.setTimeout(() => this.showNext(), 250);
  }

  private escape(s: string): string {
    return s.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]!));
  }
}
