import { firebaseAuth, type AuthState } from '@/systems/FirebaseAuth';

export class AuthBar {
  private container: HTMLElement;
  private button: HTMLButtonElement;
  private avatar: HTMLImageElement;
  private label: HTMLElement;

  constructor() {
    this.container = document.getElementById('auth-bar')!;
    this.button = document.getElementById('auth-button') as HTMLButtonElement;
    this.avatar = document.getElementById('auth-avatar') as HTMLImageElement;
    this.label = document.getElementById('auth-label')!;

    this.button.addEventListener('click', () => this.onClick());
    firebaseAuth.init();
    firebaseAuth.subscribe(s => this.render(s));
  }

  private async onClick(): Promise<void> {
    const s = firebaseAuth.getState();
    if (s.status === 'signed-in') {
      await firebaseAuth.signOutUser();
    } else if (s.status === 'signed-out') {
      try { await firebaseAuth.signInWithGoogle(); }
      catch (e) { console.warn('[AuthBar] sign-in failed', e); }
    } else {
      alert('Firebase not configured. Copy .env.example \u2192 .env and add VITE_FIREBASE_* keys.');
    }
  }

  private render(s: AuthState): void {
    if (s.status === 'signed-in') {
      this.avatar.src = s.user.photoURL ?? '';
      this.avatar.style.display = s.user.photoURL ? 'block' : 'none';
      this.label.textContent = s.user.name ?? s.user.email ?? 'Signed in';
      this.button.textContent = 'Sign out';
      this.container.classList.add('signed-in');
    } else if (s.status === 'signed-out') {
      this.avatar.style.display = 'none';
      this.label.textContent = 'Local only';
      this.button.textContent = 'Sign in with Google';
      this.container.classList.remove('signed-in');
    } else {
      this.avatar.style.display = 'none';
      this.label.textContent = 'Offline';
      this.button.textContent = 'Configure';
      this.container.classList.remove('signed-in');
    }
  }
}
