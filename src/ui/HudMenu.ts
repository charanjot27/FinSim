export class HudMenu {
  private trigger: HTMLButtonElement;
  private panel: HTMLDivElement;
  private open_ = false;

  constructor() {
    this.trigger = document.getElementById('btn-menu') as HTMLButtonElement;
    this.panel   = document.getElementById('hud-menu') as HTMLDivElement;
    if (!this.trigger || !this.panel) throw new Error('HudMenu: HUD menu DOM missing');
    this.bind();
  }

  private bind(): void {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    this.panel.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('.hud-menu-item');
      if (item) this.close();
    });
    document.addEventListener('click', (e) => {
      if (!this.open_) return;
      if (!this.panel.contains(e.target as Node) && !this.trigger.contains(e.target as Node)) {
        this.close();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.open_) this.close();
    });
  }

  open(): void {
    this.panel.hidden = false;
    requestAnimationFrame(() => this.panel.classList.add('visible'));
    this.trigger.classList.add('active');
    this.trigger.setAttribute('aria-expanded', 'true');
    this.open_ = true;
  }

  close(): void {
    this.panel.classList.remove('visible');
    this.trigger.classList.remove('active');
    this.trigger.setAttribute('aria-expanded', 'false');
    window.setTimeout(() => { this.panel.hidden = true; }, 220);
    this.open_ = false;
  }

  toggle(): void { this.open_ ? this.close() : this.open(); }
}
