export interface UserProfile {
  name: string;
  avatar: string;
  createdAt: number;
  onboarded: boolean;
  tourDone: boolean;
}

const KEY = 'finsim.profile.v1';

export const AVATAR_OPTIONS: { id: string; label: string; tint: string }[] = [
  { id: '👨‍💼', label: 'Analyst',        tint: '#7da9d4' },
  { id: '👩‍💼', label: 'Trader',         tint: '#b97af0' },
  { id: '🧔',    label: 'Value Investor', tint: '#f0a860' },
  { id: '👩‍🎓', label: 'Quant',          tint: '#5fc6b4' },
  { id: '🦁',    label: 'Bull',           tint: '#f08848' },
  { id: '🐻',    label: 'Bear',           tint: '#906842' },
  { id: '🦉',    label: 'Sage',           tint: '#a88c5a' },
  { id: '🚀',    label: 'Degen',          tint: '#e05c8e' },
  { id: '🧑‍💻',  label: 'Hacker',         tint: '#5a9c6b' },
  { id: '🎩',    label: 'VC',             tint: '#48628c' },
];

const DEFAULT: UserProfile = {
  name: '', avatar: '', createdAt: 0, onboarded: false, tourDone: false,
};

export class UserProfileStore {
  private profile: UserProfile;
  private subs: Array<(p: UserProfile) => void> = [];

  constructor() {
    this.profile = this.read();
  }

  private read(): UserProfile {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT };
      const p = JSON.parse(raw) as UserProfile;
      return { ...DEFAULT, ...p };
    } catch {
      return { ...DEFAULT };
    }
  }

  private write(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.profile)); } catch {  }
    for (const s of this.subs) { try { s(this.profile); } catch {  } }
  }

  get(): UserProfile { return { ...this.profile }; }

  isOnboarded(): boolean { return this.profile.onboarded; }
  isTourDone(): boolean { return this.profile.tourDone; }

  setIdentity(name: string, avatar: string): void {
    const clean = (name || '').trim().slice(0, 24) || 'Investor';
    this.profile.name = clean;
    this.profile.avatar = avatar || AVATAR_OPTIONS[0].id;
    this.profile.onboarded = true;
    if (!this.profile.createdAt) this.profile.createdAt = Date.now();
    this.write();
  }

  markTourDone(): void {
    this.profile.tourDone = true;
    this.write();
  }

  reset(): void {
    this.profile = { ...DEFAULT };
    this.write();
  }

  subscribe(fn: (p: UserProfile) => void): () => void {
    this.subs.push(fn);
    return () => { this.subs = this.subs.filter(s => s !== fn); };
  }
}

export const userProfile = new UserProfileStore();
