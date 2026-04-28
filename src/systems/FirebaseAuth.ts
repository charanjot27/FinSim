import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  type Auth, type User,
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:        import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:     import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:         import.meta.env.VITE_FIREBASE_APP_ID,
};

export type AuthState =
  | { status: 'offline'; reason: string }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: { uid: string; email: string | null; name: string | null; photoURL: string | null } };

type Listener = (state: AuthState) => void;

class FirebaseAuthSystem {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private listeners: Listener[] = [];
  private state: AuthState = { status: 'offline', reason: 'Firebase not configured' };
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      this.state = { status: 'offline', reason: 'Firebase env vars missing — running in local-only mode' };
      console.info('[FirebaseAuth] Offline mode (set VITE_FIREBASE_* in .env to enable)');
      this.emit();
      return;
    }
    try {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.state = { status: 'signed-out' };
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          this.state = { status: 'signed-in', user: this.toPublicUser(user) };
          this.ensureUserDoc(user).catch(e => console.warn('[FirebaseAuth] user doc error', e));
        } else {
          this.state = { status: 'signed-out' };
        }
        this.emit();
      });
      this.emit();
    } catch (e) {
      console.error('[FirebaseAuth] init failed', e);
      this.state = { status: 'offline', reason: 'Firebase init failed' };
      this.emit();
    }
  }

  async signInWithGoogle(): Promise<void> {
    if (!this.auth) { alert('Sign-in unavailable: Firebase not configured.'); return; }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async signOutUser(): Promise<void> {
    if (!this.auth) return;
    await signOut(this.auth);
  }

  async save(path: string, data: unknown): Promise<void> {
    if (!this.db || this.state.status !== 'signed-in') return;
    await setDoc(doc(this.db, 'users', this.state.user.uid, 'state', path), { ...(data as object), updatedAt: Date.now() }, { merge: true });
  }

  async load<T>(path: string): Promise<T | null> {
    if (!this.db || this.state.status !== 'signed-in') return null;
    const snap = await getDoc(doc(this.db, 'users', this.state.user.uid, 'state', path));
    return snap.exists() ? (snap.data() as T) : null;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    fn(this.state);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  getState(): AuthState { return this.state; }

  private emit(): void { this.listeners.forEach(fn => fn(this.state)); }

  private toPublicUser(user: User) {
    return { uid: user.uid, email: user.email, name: user.displayName, photoURL: user.photoURL };
  }

  private async ensureUserDoc(user: User): Promise<void> {
    if (!this.db) return;
    await setDoc(
      doc(this.db, 'users', user.uid),
      { email: user.email, name: user.displayName, photoURL: user.photoURL, lastSeen: Date.now() },
      { merge: true },
    );
  }
}

export const firebaseAuth = new FirebaseAuthSystem();
(window as unknown as Record<string, unknown>).firebaseAuth = firebaseAuth;
