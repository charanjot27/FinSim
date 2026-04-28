import { portfolio } from '@/systems/PortfolioSystem';
import { userProfile } from '@/systems/UserProfile';
import { firebaseAuth } from '@/systems/FirebaseAuth';
import {
  getFirestore, collection, doc, setDoc, onSnapshot, writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';

export interface LbRow {
  rank: number;
  name: string;
  avatar: string;
  equity: number;
  pnlPct: number;
  district: string;
  isYou: boolean;
  streakDays?: number;
  isBot?: boolean;
  isLive?: boolean;
  updatedAt?: number;
  archetype?: string;
}

const KEY = 'finsim.leaderboard.v2';
const LIVE_WINDOW_MS = 60_000;
const DEBOUNCE_MS   = 5_000;
const HEARTBEAT_MS  = 30_000;
const BOT_PREFIX    = 'bot_';

interface Player {
  name: string; avatar: string; equity: number; pnlPct: number;
  district: string; streakDays: number;
  isBot?: boolean;
  archetype?: string;
  updatedAt?: number;
  uid?: string;
}

const SEED: Player[] = [
  { name: 'Quant Karen',   avatar: '👩\u200D🎓', equity: 487_320, pnlPct:  48.2, district: 'Quant Quarter',   streakDays: 34, archetype: 'Quant', isBot: true },
  { name: 'Disciplined Dev', avatar: '🧔',    equity: 412_080, pnlPct:  41.0, district: 'Wall Street',     streakDays: 28, archetype: 'Trend',  isBot: true },
  { name: 'Yolo Yash',     avatar: '🚀',    equity: 389_665, pnlPct: -12.4, district: 'Crypto Cove',     streakDays: 19, archetype: 'Yolo',   isBot: true },
  { name: 'Value Vikram',  avatar: '🦉',    equity: 331_120, pnlPct:  33.1, district: 'Wall Street',     streakDays: 41, archetype: 'Value',  isBot: true },
  { name: 'Patient Priya', avatar: '👩\u200D💼', equity: 288_940, pnlPct:  28.8, district: 'Wall Street',     streakDays: 55, archetype: 'Buy & Hold', isBot: true },
  { name: 'DCA Diana',     avatar: '🦁',    equity: 244_770, pnlPct:  24.4, district: 'Dalal Street',    streakDays: 60, archetype: 'DCA',    isBot: true },
  { name: 'Momentum Maya', avatar: '🎩',    equity: 198_550, pnlPct:  19.8, district: 'Dalal Street',    streakDays:  9, archetype: 'Momentum', isBot: true },
  { name: 'Degen Deepak',  avatar: '🚀',    equity: 176_220, pnlPct:  76.0, district: 'Crypto Cove',     streakDays:  4, archetype: 'Yolo',   isBot: true },
  { name: 'Graham Gita',   avatar: '🧔',    equity: 162_300, pnlPct:  16.2, district: 'Wall Street',     streakDays: 60, archetype: 'Value',  isBot: true },
  { name: 'Scalper Sam',   avatar: '🧑\u200D💻', equity: 149_080, pnlPct:  14.9, district: 'Quant Quarter',   streakDays:  8, archetype: 'Scalper', isBot: true },
  { name: 'Mean-Rev Mira', avatar: '👩\u200D💼', equity: 131_445, pnlPct:  13.1, district: 'Quant Quarter',   streakDays: 15, archetype: 'Mean-Rev', isBot: true },
  { name: 'Skeptic Sandeep', avatar: '🦉',  equity: 118_200, pnlPct:  11.8, district: 'Scam Slum',       streakDays: 22, archetype: 'Cynic',  isBot: true },
  { name: 'Index Indira',  avatar: '👩\u200D💼', equity:  98_760, pnlPct:   9.8, district: 'Wall Street',     streakDays:  6, archetype: 'Indexer', isBot: true },
  { name: 'Bagholder Ben', avatar: '🐻',    equity:  82_400, pnlPct:  -4.2, district: 'Crypto Cove',     streakDays: 17, archetype: 'Bagholder', isBot: true },
  { name: 'Breakout Bilal',avatar: '🎩',    equity:  71_520, pnlPct:   7.1, district: 'Wall Street',     streakDays: 11, archetype: 'Breakout', isBot: true },
  { name: 'FOMO Faisal',   avatar: '👨\u200D💼', equity:  58_990, pnlPct:   5.9, district: 'Dalal Street',    streakDays:  3, archetype: 'FOMO',   isBot: true },
  { name: 'Forex Farah',   avatar: '👩\u200D💼', equity:  47_250, pnlPct:   4.7, district: 'Forex Plaza',     streakDays: 14, archetype: 'Forex',  isBot: true },
  { name: 'Coin-Flip Karan', avatar: '🚀',  equity:  39_880, pnlPct: -23.1, district: 'Vegas Vice',      streakDays:  2, archetype: 'Gambler', isBot: true },
  { name: 'Learner Arjun', avatar: '🧑\u200D💻', equity:  28_120, pnlPct:   2.8, district: 'Scam Slum',       streakDays:  5, archetype: 'Newbie', isBot: true },
  { name: 'Newbie Neha',   avatar: '🦁',    equity:  16_530, pnlPct:   1.6, district: 'Scam Slum',       streakDays:  1, archetype: 'Newbie', isBot: true },
];

function loadOrSeed(): Player[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw) as Player[];
      if (Array.isArray(arr) && arr.length) {

        return arr.map(p => ({ ...p, isBot: true }));
      }
    }
  } catch {  }
  const drifted = SEED.map(p => ({
    ...p,
    isBot: true,
    equity: Math.round(p.equity * (1 + (Math.random() - 0.5) * 0.03)),
  }));
  try { localStorage.setItem(KEY, JSON.stringify(drifted)); } catch {  }
  return drifted;
}

export class LeaderboardSystem {
  private localBots: Player[];
  private cloudPlayers: Map<string, Player> = new Map();
  private cloudReady = false;
  private myUid: string | null = null;
  private subs: Array<() => void> = [];

  private db: Firestore | null = null;
  private unsubCloud: (() => void) | null = null;
  private pubDebounce: number | null = null;
  private heartbeat: number | null = null;

  constructor() {
    this.localBots = loadOrSeed();

    setInterval(() => this.offlineTick(), 8000);
  }

  private offlineTick(): void {
    if (this.cloudReady) return;
    let mutated = false;
    this.localBots = this.localBots.map(p => {
      const drift = (Math.random() - 0.5) * 0.004;
      const next = Math.max(1000, Math.round(p.equity * (1 + drift)));
      if (next !== p.equity) mutated = true;
      return { ...p, equity: next, pnlPct: +((p.pnlPct + drift * 100).toFixed(2)) };
    });
    if (mutated) {
      try { localStorage.setItem(KEY, JSON.stringify(this.localBots)); } catch {  }
      this.emit();
    }
  }

  cloudInit(uid: string): void {
    if (this.cloudReady && this.myUid === uid) return;
    this.myUid = uid;
    try { this.db = getFirestore(getApp()); } catch { this.db = null; return; }
    if (!this.db) return;
    this.unsubCloud?.();
    this.unsubCloud = onSnapshot(collection(this.db, 'leaderboard'), (snap) => {
      const next = new Map<string, Player>();
      snap.forEach(d => {
        const data = d.data() as Player;
        next.set(d.id, { ...data, uid: d.id });
      });
      this.cloudPlayers = next;
      this.cloudReady = true;
      this.emit();
    }, (err) => {
      console.warn('[Leaderboard] cloud subscribe failed', err);
      this.cloudReady = false;
    });

    if (this.heartbeat !== null) window.clearInterval(this.heartbeat);
    this.heartbeat = window.setInterval(() => this.publishNow(), HEARTBEAT_MS);

    this.publishNow();
  }

  cloudTeardown(): void {
    this.unsubCloud?.(); this.unsubCloud = null;
    if (this.heartbeat !== null) { window.clearInterval(this.heartbeat); this.heartbeat = null; }
    if (this.pubDebounce !== null) { window.clearTimeout(this.pubDebounce); this.pubDebounce = null; }
    this.cloudPlayers.clear();
    this.cloudReady = false;
    this.myUid = null;
    this.emit();
  }

  publish(): void {
    if (!this.cloudReady || !this.db || !this.myUid) return;
    if (this.pubDebounce !== null) window.clearTimeout(this.pubDebounce);
    this.pubDebounce = window.setTimeout(() => this.publishNow(), DEBOUNCE_MS);
  }

  private publishNow(): void {
    if (!this.db || !this.myUid) return;
    const prof = userProfile.get();
    const equity = portfolio.getTotalValue();
    const basis = 10_000;
    const row: Player = {
      name: prof.name || 'Investor',
      avatar: prof.avatar || '👤',
      equity,
      pnlPct: +(((equity - basis) / basis) * 100).toFixed(2),
      district: document.getElementById('hud-district')?.textContent?.trim() || 'Scam Slum',
      streakDays: 1,
      isBot: false,
      updatedAt: Date.now(),
    };
    setDoc(doc(this.db, 'leaderboard', this.myUid), row).catch(e => {
      console.warn('[Leaderboard] publish failed', e);
    });
  }

  async seedBots(): Promise<{ ok: boolean; count: number; reason?: string }> {
    if (!this.db) {
      try { this.db = getFirestore(getApp()); } catch { return { ok: false, count: 0, reason: 'Firebase not initialized' }; }
    }
    if (firebaseAuth.getState().status !== 'signed-in') {
      return { ok: false, count: 0, reason: 'Sign in first so security rules allow writes' };
    }
    try {
      const batch = writeBatch(this.db);
      SEED.forEach((p, i) => {
        const uid = `${BOT_PREFIX}${String(i).padStart(3, '0')}`;
        batch.set(doc(this.db!, 'leaderboard', uid), { ...p, isBot: true, updatedAt: Date.now() });
      });
      await batch.commit();
      return { ok: true, count: SEED.length };
    } catch (e) {
      console.error('[Leaderboard] seedBots failed', e);
      return { ok: false, count: 0, reason: String((e as Error).message || e) };
    }
  }

  subscribe(fn: () => void): () => void {
    this.subs.push(fn);
    return () => { this.subs = this.subs.filter(s => s !== fn); };
  }

  getRanked(): LbRow[] {
    const prof = userProfile.get();
    const youEquity = portfolio.getTotalValue();
    const basis = 10_000;
    const youPct = +(((youEquity - basis) / basis) * 100).toFixed(2);
    const now = Date.now();

    let all: Player[];
    if (this.cloudReady) {

      all = [];
      this.cloudPlayers.forEach(p => {
        if (p.uid === this.myUid) {
          all.push({
            ...p,
            name: prof.name || p.name,
            avatar: prof.avatar || p.avatar,
            equity: youEquity,
            pnlPct: youPct,
            district: document.getElementById('hud-district')?.textContent?.trim() || p.district,
          });
        } else {
          all.push(p);
        }
      });

      if (this.myUid && !this.cloudPlayers.has(this.myUid)) {
        all.push({
          name: prof.name || 'You',
          avatar: prof.avatar || '👤',
          equity: youEquity, pnlPct: youPct,
          district: document.getElementById('hud-district')?.textContent?.trim() || 'Scam Slum',
          streakDays: 1,
          isBot: false,
          uid: this.myUid,
          updatedAt: now,
        });
      }
    } else {

      all = [...this.localBots, {
        name: prof.name || 'You',
        avatar: prof.avatar || '👤',
        equity: youEquity,
        pnlPct: youPct,
        district: document.getElementById('hud-district')?.textContent?.trim() || 'Scam Slum',
        streakDays: 1,
        isBot: false,
        uid: 'you-local',
        updatedAt: now,
      }];
    }

    all.sort((a, b) => b.equity - a.equity);
    return all.map((p, i) => {
      const isYou = this.cloudReady ? p.uid === this.myUid : p.uid === 'you-local';
      const isLive = !p.isBot && !!p.updatedAt && now - p.updatedAt < LIVE_WINDOW_MS;
      return {
        rank: i + 1,
        name: p.name,
        avatar: p.avatar,
        equity: p.equity,
        pnlPct: p.pnlPct,
        district: p.district,
        streakDays: p.streakDays,
        isYou,
        isBot: !!p.isBot,
        isLive,
        updatedAt: p.updatedAt,
        archetype: p.archetype,
      };
    });
  }

  getCounts(): { live: number; bots: number; total: number; cloud: boolean } {
    const now = Date.now();
    if (this.cloudReady) {
      let live = 0, bots = 0;
      this.cloudPlayers.forEach(p => {
        if (p.isBot) bots++;
        else if (p.updatedAt && now - p.updatedAt < LIVE_WINDOW_MS) live++;
      });
      return { live, bots, total: this.cloudPlayers.size, cloud: true };
    }
    return { live: 0, bots: this.localBots.length, total: this.localBots.length, cloud: false };
  }

  resetDummies(): void {
    try { localStorage.removeItem(KEY); } catch {  }
    this.localBots = loadOrSeed();
    this.emit();
  }

  private emit(): void { for (const s of this.subs) s(); }
}

export const leaderboard = new LeaderboardSystem();

(window as unknown as Record<string, unknown>).leaderboard = leaderboard;
