interface MapNode {
  id: string;
  name: string;
  sceneKey: string;
  x: number;
  y: number;
  icon: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tagline: string;
  tip: string;
  realLesson: string;
  unlockFlag?: string;
}

const NODES: MapNode[] = [
  { id: 'scam',  name: 'Scam Slum',    sceneKey: 'ScamSlumScene',    x: 18, y: 72, icon: '\u26A0', difficulty: 1,
    tagline: 'Where it starts.',
    tip: 'Press E near NPCs to hear pitches. Every guaranteed-return offer is a trap. Practice saying no before you learn to say yes.',
    realLesson: 'Fraud-spotting is the highest-ROI skill in finance. One avoided scam beats a year of stock-picking.' },
  { id: 'wall',  name: 'Wall Street',  sceneKey: 'WallStreetScene',  x: 48, y: 38, icon: '\u25B2', difficulty: 2,
    tagline: 'US equities.',
    tip: 'Open the terminal (press E). Set a stop-loss before you click Buy. Risk 1% of your account per trade.',
    realLesson: 'Position sizing is the single variable you control. Markets decide the rest.' },
  { id: 'dalal', name: 'Dalal Street', sceneKey: 'DalalStreetScene', x: 72, y: 46, icon: '\u25CF', difficulty: 2,
    tagline: 'Indian equities.',
    tip: 'Liquidity is thinner here. Large-caps are fine; small-caps can gap 20% on any rumour.',
    realLesson: 'Every market has its own microstructure. Read volumes, not just prices.' },
  { id: 'crypto',name: 'Crypto Cove',  sceneKey: 'CryptoCoveScene',  x: 30, y: 22, icon: '\u25C6', difficulty: 3,
    tagline: '24/7 volatility.',
    tip: 'Never put more than you can lose. Check contract addresses from two sources. Self-custody > exchange.',
    realLesson: '90% of DeFi volume is stablecoins. The rest is speculation about speculation.' },
  { id: 'quant', name: 'Quant Quarter',sceneKey: 'QuantQuarterScene',x: 58, y: 18, icon: '\u03A3', difficulty: 4,
    tagline: 'Edge from math.',
    tip: 'Factor models, vol arb, stat-arb. If you don\u2019t know what your Sharpe is, you don\u2019t have an edge.',
    realLesson: 'Backtests lie. Paper-trade any strategy for 90 days before risking real size.' },
  { id: 'vegas', name: 'Vegas Vice',   sceneKey: 'VegasViceScene',   x: 84, y: 72, icon: '\u2660', difficulty: 5,
    tagline: 'The house edge.',
    tip: 'This district is here so you feel the pull. Every spin lowers expected value. Come in, feel it, leave.',
    realLesson: 'Negative expectancy is a machine. No strategy, no "system", no streak beats math.' },
];

export class MapHints {
  private root: HTMLDivElement;
  private open_ = false;

  constructor(private onGoTo: (sceneKey: string) => void) {
    this.root = document.getElementById('map-hints') as HTMLDivElement;
    if (!this.root) throw new Error('MapHints root missing (#map-hints)');
    this.root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.classList.contains('mh-backdrop')) this.close();
      if (t.classList.contains('mh-close'))    this.close();
      const node = t.closest('.mh-node') as HTMLElement | null;
      if (node) this.select(node.getAttribute('data-id') || '');
      const go = t.closest('[data-go]') as HTMLElement | null;
      if (go) {
        const key = go.getAttribute('data-go');
        if (key) { this.close(); this.onGoTo(key); }
      }
    });
  }

  isOpen(): boolean { return this.open_; }

  open(): void {
    if (this.open_) return;
    this.open_ = true;
    this.root.classList.remove('hidden');
    requestAnimationFrame(() => this.root.classList.add('visible'));
    this.render(NODES[0].id);
  }

  close(): void {
    if (!this.open_) return;
    this.open_ = false;
    this.root.classList.remove('visible');
    window.setTimeout(() => this.root.classList.add('hidden'), 220);
  }

  toggle(): void { this.open_ ? this.close() : this.open(); }

  private select(id: string): void {
    const n = NODES.find(x => x.id === id) || NODES[0];
    this.render(n.id);
  }

  private render(activeId: string): void {
    const n = NODES.find(x => x.id === activeId) || NODES[0];
    const nodes = NODES.map(m => `
      <button class="mh-node ${m.id === activeId ? 'active' : ''}"
              style="left:${m.x}%;top:${m.y}%"
              data-id="${m.id}"
              title="${this.escape(m.name)}">
        <span class="mh-node-dot"></span>
        <span class="mh-node-icon">${m.icon}</span>
        <span class="mh-node-label">${this.escape(m.name)}</span>
        <span class="mh-node-diff" aria-label="difficulty">${'\u25AA'.repeat(m.difficulty)}${'\u25AB'.repeat(5 - m.difficulty)}</span>
      </button>
    `).join('');
    const lines = this.buildPaths();
    this.root.innerHTML = `
      <div class="mh-backdrop"></div>
      <div class="mh-modal">
        <header class="mh-head">
          <div>
            <h1>Financial Metaverse \u2014 Map</h1>
            <p class="mh-tag">Tap a district. Each lesson compounds on the last. No wrong order, only wrong size.</p>
          </div>
          <button class="mh-close" aria-label="Close">\u2715</button>
        </header>
        <div class="mh-layout">
          <div class="mh-canvas">
            <svg class="mh-paths" viewBox="0 0 100 100" preserveAspectRatio="none">
              ${lines}
            </svg>
            <div class="mh-skyline"></div>
            ${nodes}
          </div>
          <aside class="mh-panel">
            <div class="mh-panel-head">
              <span class="mh-panel-icon">${n.icon}</span>
              <div>
                <h2>${this.escape(n.name)}</h2>
                <em>${this.escape(n.tagline)}</em>
              </div>
              <span class="mh-diff-label">difficulty ${n.difficulty}/5</span>
            </div>
            <h3>Hint</h3>
            <p class="mh-tip">${n.tip}</p>
            <h3>Real-world lesson</h3>
            <p class="mh-real">${n.realLesson}</p>
            <button class="mh-go" data-go="${n.sceneKey}">Travel to ${this.escape(n.name)} \u2192</button>
          </aside>
        </div>
      </div>
    `;
  }

  private buildPaths(): string {

    const order = ['scam', 'wall', 'crypto', 'quant', 'dalal', 'vegas'];
    const pts = order.map(id => NODES.find(n => n.id === id)!).filter(Boolean);
    const segs: string[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]; const b = pts[i + 1];
      segs.push(`<path d="M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 10}, ${b.x} ${b.y}"
                       fill="none" stroke="rgba(198,157,90,.45)" stroke-width=".35"
                       stroke-dasharray="1 1.4" />`);
    }
    return segs.join('');
  }

  private escape(s: string): string {
    return s.replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' } as Record<string,string>)[c]);
  }
}
