import { AVATAR_OPTIONS, userProfile } from '@/systems/UserProfile';

type OnDone = (startTour: boolean) => void;

export class OnboardingOverlay {
  private root: HTMLDivElement;
  private step = 0;
  private chosenAvatar = AVATAR_OPTIONS[0].id;
  private chosenName = '';
  private onDone: OnDone | null = null;

  constructor() {
    this.root = document.getElementById('onboarding') as HTMLDivElement;
    if (!this.root) throw new Error('Onboarding root missing (#onboarding)');
  }

  open(onDone: OnDone): void {
    this.onDone = onDone;
    this.step = 0;
    const existing = userProfile.get();
    if (existing.name) this.chosenName = existing.name;
    if (existing.avatar) this.chosenAvatar = existing.avatar;
    this.root.classList.remove('hidden');
    requestAnimationFrame(() => this.root.classList.add('visible'));
    this.render();
  }

  close(): void {
    this.root.classList.remove('visible');
    window.setTimeout(() => this.root.classList.add('hidden'), 240);
  }

  private render(): void {
    this.root.innerHTML = `
      <div class="ob-backdrop"></div>
      <div class="ob-card">
        <div class="ob-rail">
          <span class="ob-step ${this.step >= 0 ? 'active' : ''}">1</span>
          <span class="ob-step-div"></span>
          <span class="ob-step ${this.step >= 1 ? 'active' : ''}">2</span>
          <span class="ob-step-div"></span>
          <span class="ob-step ${this.step >= 2 ? 'active' : ''}">3</span>
        </div>
        ${this.step === 0 ? this.stepSignup() :
          this.step === 1 ? this.stepAvatar() :
                            this.stepName()}
      </div>
    `;
    this.bind();
  }

  private stepSignup(): string {
    return `
      <header class="ob-head">
        <h1>Welcome to <span class="ob-brand">FinSim</span></h1>
        <p class="ob-tag">The financial metaverse where you <em>play here, earn there</em>.</p>
      </header>
      <div class="ob-body">
        <p class="ob-lede">Create a local profile to join the leaderboard, track progress across sessions,
        and earn mentor guidance. Everything stays on this device \u2014 no email, no password.</p>
        <div class="ob-features">
          <div class="ob-feat"><span>\u25CE</span><b>Live markets</b><em>Real NASDAQ/NSE prices where available</em></div>
          <div class="ob-feat"><span>\u25C6</span><b>Real lessons</b><em>Every action maps to a real-world skill</em></div>
          <div class="ob-feat"><span>\u25B2</span><b>Leaderboard</b><em>Rank against 20 simulated traders</em></div>
          <div class="ob-feat"><span>\u25CF</span><b>No risk</b><em>₹10,000 virtual seed. Lose it all \u2014 learn, reset</em></div>
        </div>
      </div>
      <footer class="ob-foot">
        <button class="ob-btn ob-btn-ghost" data-act="skip">Skip \u2014 browse only</button>
        <button class="ob-btn ob-btn-primary" data-act="next">Create profile \u2192</button>
      </footer>
    `;
  }

  private stepAvatar(): string {
    const grid = AVATAR_OPTIONS.map(o => `
      <button class="ob-avatar ${o.id === this.chosenAvatar ? 'selected' : ''}"
              style="--t:${o.tint}"
              data-avatar="${o.id}">
        <span class="ob-av-emoji">${o.id}</span>
        <span class="ob-av-label">${o.label}</span>
      </button>
    `).join('');
    return `
      <header class="ob-head">
        <h1>Pick your <span class="ob-brand">alter ego</span></h1>
        <p class="ob-tag">This is just flavour. You can change it anytime from the Profile menu.</p>
      </header>
      <div class="ob-body">
        <div class="ob-avatar-grid">${grid}</div>
      </div>
      <footer class="ob-foot">
        <button class="ob-btn ob-btn-ghost" data-act="back">\u2190 Back</button>
        <button class="ob-btn ob-btn-primary" data-act="next">Continue \u2192</button>
      </footer>
    `;
  }

  private stepName(): string {
    return `
      <header class="ob-head">
        <h1>Almost there. <span class="ob-brand">What should we call you?</span></h1>
        <p class="ob-tag">A display name for the leaderboard and mentor greetings.</p>
      </header>
      <div class="ob-body">
        <div class="ob-name-row">
          <span class="ob-name-avatar">${this.chosenAvatar}</span>
          <input type="text" id="ob-name" class="ob-input" maxlength="24"
                 placeholder="e.g. RakeshNext"
                 value="${this.escape(this.chosenName)}" autocomplete="off" />
        </div>
        <p class="ob-hint">We\u2019ll remember this locally. No account required.</p>
      </div>
      <footer class="ob-foot">
        <button class="ob-btn ob-btn-ghost" data-act="back">\u2190 Back</button>
        <button class="ob-btn ob-btn-primary" data-act="finish">Enter the city \u2192</button>
      </footer>
    `;
  }

  private bind(): void {
    this.root.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const act = (e.currentTarget as HTMLElement).getAttribute('data-act');
        if (act === 'skip')   { this.finish(false, true); return; }
        if (act === 'back')   { this.step = Math.max(0, this.step - 1); this.render(); return; }
        if (act === 'next')   {
          if (this.step === 1) {
            const input = document.getElementById('ob-name') as HTMLInputElement | null;
            if (input) this.chosenName = input.value;
          }
          this.step = Math.min(2, this.step + 1); this.render();
          if (this.step === 2) {
            window.setTimeout(() => (document.getElementById('ob-name') as HTMLInputElement | null)?.focus(), 40);
          }
          return;
        }
        if (act === 'finish') {
          const input = document.getElementById('ob-name') as HTMLInputElement | null;
          const name = input?.value.trim() || 'Investor';
          this.chosenName = name;
          this.finish(true, false);
        }
      });
    });
    this.root.querySelectorAll('.ob-avatar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const a = (e.currentTarget as HTMLElement).getAttribute('data-avatar') || '';
        this.chosenAvatar = a;
        this.render();
      });
    });
    const input = document.getElementById('ob-name') as HTMLInputElement | null;
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.chosenName = input.value.trim() || 'Investor';
        this.finish(true, false);
      }
    });
  }

  private finish(save: boolean, skip: boolean): void {
    if (save) userProfile.setIdentity(this.chosenName || 'Investor', this.chosenAvatar);
    this.close();
    if (this.onDone) this.onDone(!skip);
  }

  private escape(s: string): string {
    return s.replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' } as Record<string,string>)[c]);
  }
}
