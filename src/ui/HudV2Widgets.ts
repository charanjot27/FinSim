import { traderScore } from '@/systems/TraderScore';
import { dailyMissions } from '@/systems/DailyMissions';
import { soundManager } from '@/systems/SoundManager';

export class HudV2Widgets {
  private banner!: HTMLDivElement;
  private chip!: HTMLButtonElement;
  private streak!: HTMLDivElement;

  constructor(private openBiasProfile: () => void) {
    this.mountChip();
    this.mountBanner();
    this.bindSubscriptions();
  }

  private mountChip(): void {
    const left = document.querySelector('#hud .hud-left') as HTMLElement | null;
    if (!left) return;

    const btn = document.createElement('button');
    btn.id = 'hud-trader-score';
    btn.className = 'trader-score-chip';
    btn.title = 'Open your Trader Profile';
    btn.setAttribute('aria-label', 'Trader Score — open profile');
    btn.innerHTML = `
      <span class="ts-icon">◆</span>
      <span class="ts-meta">
        <span class="ts-num">0</span>
        <span class="ts-tier">Apprentice</span>
      </span>
    `;
    btn.addEventListener('click', () => {
      soundManager.play('click');
      this.openBiasProfile();
    });
    btn.addEventListener('mouseenter', () => soundManager.play('hover'));
    left.appendChild(btn);
    this.chip = btn;

    const streak = document.createElement('div');
    streak.id = 'hud-streak';
    streak.className = 'streak-chip hidden';
    streak.innerHTML = `<span class="streak-flame">🔥</span><span class="streak-num">0</span><span class="streak-text">day streak</span>`;
    left.appendChild(streak);
    this.streak = streak;
  }

  private mountBanner(): void {
    const banner = document.createElement('div');
    banner.id = 'daily-mission-banner';
    banner.className = 'mission-banner hidden';
    banner.innerHTML = `
      <span class="mb-ico">🎯</span>
      <div class="mb-body">
        <div class="mb-title"></div>
        <div class="mb-blurb"></div>
      </div>
      <div class="mb-progress">
        <div class="mb-bar"><div class="mb-fill"></div></div>
        <div class="mb-count"></div>
      </div>
      <button class="mb-collapse" aria-label="Collapse mission banner">−</button>
    `;
    document.body.appendChild(banner);
    this.banner = banner;

    banner.querySelector('.mb-collapse')?.addEventListener('click', (e) => {
      e.stopPropagation();
      banner.classList.toggle('collapsed');
    });
    banner.addEventListener('click', () => {
      banner.classList.toggle('collapsed');
    });
  }

  private bindSubscriptions(): void {
    const renderScore = () => {
      const s = traderScore.get();
      const num = this.chip.querySelector('.ts-num')!;
      const tier = this.chip.querySelector('.ts-tier')!;
      const oldNum = parseInt(num.textContent || '0', 10);
      num.textContent = String(s.total);
      tier.textContent = s.tier;
      this.chip.dataset.tier = s.tier.toLowerCase();
      if (oldNum !== 0 && oldNum !== s.total) {
        this.chip.classList.remove('flash-up', 'flash-down');

        void this.chip.offsetWidth;
        this.chip.classList.add(s.total > oldNum ? 'flash-up' : 'flash-down');
      }
    };
    renderScore();
    traderScore.subscribe(renderScore);

    const renderMission = () => {
      const m = dailyMissions.get();
      const hudVisible = !document.getElementById('hud')?.classList.contains('hidden');
      if (!hudVisible) {
        this.banner.classList.add('hidden');
        this.streak.classList.add('hidden');
        return;
      }
      this.banner.classList.remove('hidden');
      requestAnimationFrame(() => this.banner.classList.add('visible'));
      this.banner.classList.toggle('completed', m.completed);
      (this.banner.querySelector('.mb-title') as HTMLElement).textContent =
        m.completed ? `✓ Mission complete: ${m.mission.title}` : `Daily Mission · ${m.mission.title}`;
      (this.banner.querySelector('.mb-blurb') as HTMLElement).textContent =
        m.completed ? m.mission.reward : m.mission.blurb;
      (this.banner.querySelector('.mb-count') as HTMLElement).textContent =
        `${m.progress}/${m.mission.goal}`;
      const fill = this.banner.querySelector('.mb-fill') as HTMLElement;
      fill.style.width = `${Math.min(100, (m.progress / m.mission.goal) * 100)}%`;

      if (m.streakDays > 0) {
        this.streak.classList.remove('hidden');
        (this.streak.querySelector('.streak-num') as HTMLElement).textContent = String(m.streakDays);
      } else {
        this.streak.classList.add('hidden');
      }
    };
    renderMission();
    dailyMissions.subscribe(renderMission);

    const hud = document.getElementById('hud');
    if (hud) {
      const obs = new MutationObserver(renderMission);
      obs.observe(hud, { attributes: true, attributeFilter: ['class'] });
    }
  }
}
