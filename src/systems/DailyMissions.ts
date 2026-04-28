export interface Mission {
  id: string;
  title: string;
  blurb: string;
  goal: number;
  metric: 'trades' | 'no_bias_trades' | 'with_stop' | 'win_streak' | 'visit_district' | 'echo_complete';
  reward: string;
}

export interface MissionState {
  date: string;
  mission: Mission;
  progress: number;
  completed: boolean;
  streakDays: number;
  lastCompletedDate: string | null;
}

const KEY = 'finsim.dailymissions.v1';

const POOL: Mission[] = [
  { id: 'd_no_fomo', title: 'Cold Hands',         blurb: 'Make 3 trades today without triggering a FOMO alert.',  goal: 3, metric: 'no_bias_trades', reward: '+25 Trader Score · Patience badge' },
  { id: 'd_with_stop', title: 'Always Armed',     blurb: 'Place 2 buys with a stop-loss attached.',                goal: 2, metric: 'with_stop',       reward: '+30 Trader Score · Discipline badge' },
  { id: 'd_visit',    title: 'Globe Trotter',     blurb: 'Visit any 2 different districts today.',                  goal: 2, metric: 'visit_district',  reward: '+15 Trader Score · Explorer badge' },
  { id: 'd_winstreak', title: 'Hot Hand',         blurb: 'Close 2 winning trades back-to-back.',                    goal: 2, metric: 'win_streak',      reward: '+40 Trader Score · Sniper badge' },
  { id: 'd_echo',     title: 'Time Traveller',    blurb: 'Complete 1 Echo Scenario — a real historical case.',      goal: 1, metric: 'echo_complete',   reward: '+20 Trader Score · Historian badge' },
  { id: 'd_volume',   title: 'Active Trader',     blurb: 'Make 5 round-trip trades today.',                          goal: 5, metric: 'trades',          reward: '+15 Trader Score · Volume badge' },
];

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function pickForDay(date: string): Mission {

  let hash = 0;
  for (let i = 0; i < date.length; i++) hash = (hash * 31 + date.charCodeAt(i)) | 0;
  return POOL[Math.abs(hash) % POOL.length];
}

function isYesterday(prev: string | null, today: string): boolean {
  if (!prev) return false;
  const t = new Date(today + 'T00:00:00');
  const y = new Date(t.getTime() - 24 * 60 * 60 * 1000);
  const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  return prev === yKey;
}

export class DailyMissionsSystem {
  private state: MissionState;
  private subs: Array<(s: MissionState) => void> = [];
  private visitedToday = new Set<string>();

  constructor() {
    this.state = this.load() ?? this.fresh();
    if (this.state.date !== todayKey()) this.rollOver();
  }

  private fresh(): MissionState {
    const date = todayKey();
    return {
      date,
      mission: pickForDay(date),
      progress: 0,
      completed: false,
      streakDays: 0,
      lastCompletedDate: null,
    };
  }

  private rollOver(): void {
    const today = todayKey();
    const carry = this.state.completed && isYesterday(this.state.lastCompletedDate, today)
      ? this.state.streakDays + 1
      : (this.state.completed ? 1 : 0);
    this.state = {
      date: today,
      mission: pickForDay(today),
      progress: 0,
      completed: false,
      streakDays: carry,
      lastCompletedDate: this.state.lastCompletedDate,
    };
    this.visitedToday.clear();
    this.save(); this.emit();
  }

  private load(): MissionState | null {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  }
  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch {  }
  }
  private emit(): void { this.subs.forEach(s => s(this.state)); }

  get(): MissionState {
    if (this.state.date !== todayKey()) this.rollOver();
    return this.state;
  }

  subscribe(fn: (s: MissionState) => void): () => void {
    this.subs.push(fn);
    return () => { this.subs = this.subs.filter(s => s !== fn); };
  }

  noteTrade(opts: { hadBiasTrigger: boolean; hadStop: boolean; isWin: boolean }): void {
    const m = this.state.mission;
    if (this.state.completed) return;
    if (m.metric === 'trades') this.bump(1);
    else if (m.metric === 'no_bias_trades' && !opts.hadBiasTrigger) this.bump(1);
    else if (m.metric === 'with_stop' && opts.hadStop) this.bump(1);
    else if (m.metric === 'win_streak') {
      if (opts.isWin) this.bump(1);
      else if (!this.state.completed) {

        this.state.progress = 0;
        this.save(); this.emit();
      }
    }
  }
  noteDistrictVisit(district: string): void {
    if (this.state.completed) return;
    if (this.state.mission.metric !== 'visit_district') return;
    if (this.visitedToday.has(district)) return;
    this.visitedToday.add(district);
    this.bump(1);
  }
  noteEchoComplete(): void {
    if (this.state.completed) return;
    if (this.state.mission.metric === 'echo_complete') this.bump(1);
  }

  private bump(by: number): void {
    this.state.progress = Math.min(this.state.mission.goal, this.state.progress + by);
    if (this.state.progress >= this.state.mission.goal && !this.state.completed) {
      this.state.completed = true;
      const today = todayKey();
      this.state.streakDays = isYesterday(this.state.lastCompletedDate, today)
        ? this.state.streakDays + 1
        : 1;
      this.state.lastCompletedDate = today;
    }
    this.save(); this.emit();
  }
}

export const dailyMissions = new DailyMissionsSystem();
(window as unknown as { dailyMissions: DailyMissionsSystem }).dailyMissions = dailyMissions;
