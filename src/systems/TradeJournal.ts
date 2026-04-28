export interface JournalEntry {
  id: string;
  timestamp: number;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entry: number;
  stop: number;
  target: number;
  thesis: string;
  emotion: number;
  sources: string[];
  riskPct: number;
  closedAt?: number;
  exit?: number;
  rOutcome?: number;
}

const KEY = 'finsim.journal.v1';

type Listener = (entries: JournalEntry[]) => void;

class TradeJournalSystem {
  private entries: JournalEntry[] = [];
  private listeners: Listener[] = [];

  constructor() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.entries = JSON.parse(raw);
    } catch {  }
  }

  add(e: Omit<JournalEntry, 'id' | 'timestamp'>): JournalEntry {
    const entry: JournalEntry = { ...e, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: Date.now() };
    this.entries.push(entry);
    this.save();
    return entry;
  }

  close(id: string, exit: number, rOutcome: number): void {
    const e = this.entries.find(x => x.id === id);
    if (!e) return;
    e.closedAt = Date.now();
    e.exit = exit;
    e.rOutcome = rOutcome;
    this.save();
  }

  list(): JournalEntry[] { return [...this.entries].sort((a, b) => b.timestamp - a.timestamp); }

  closedR(): number[] { return this.entries.filter(e => typeof e.rOutcome === 'number').map(e => e.rOutcome as number); }

  weekdayStats(): { day: string; winRate: number; avgR: number; count: number }[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, i) => {
      const xs = this.entries.filter(e => typeof e.rOutcome === 'number' && new Date(e.timestamp).getDay() === i);
      if (xs.length === 0) return { day, winRate: 0, avgR: 0, count: 0 };
      const wins = xs.filter(e => (e.rOutcome ?? 0) > 0).length;
      const avgR = xs.reduce((s, e) => s + (e.rOutcome ?? 0), 0) / xs.length;
      return { day, winRate: wins / xs.length, avgR, count: xs.length };
    });
  }

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn); fn(this.entries);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private save(): void {
    if (this.entries.length > 500) this.entries = this.entries.slice(-500);
    try { localStorage.setItem(KEY, JSON.stringify(this.entries)); } catch {  }
    this.listeners.forEach(fn => fn(this.entries));
  }
}

export const tradeJournal = new TradeJournalSystem();
(window as unknown as Record<string, unknown>).tradeJournal = tradeJournal;
