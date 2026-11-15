/**
 * App State Management
 * Handles audio opt-in, mute status, current route, and theme.
 * All localStorage operations use try/catch per spec requirements.
 */

export interface AppState {
  soundOptIn: boolean | null; // null = unprompted, true = opted in, false = silent
  isMuted: boolean;
  theme: 'public' | 'research';
  currentRoute: string;
}

const STORAGE_KEY_SOUND = 'earth_jukebox_sound_opt_in';
const STORAGE_KEY_MUTE = 'earth_jukebox_muted';

function getStoredBoolean(key: string): boolean | null {
  try {
    const val = localStorage.getItem(key);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

function setStoredBoolean(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Graceful fallback when localStorage is disabled/sandboxed
  }
}

class StateStore {
  private state: AppState = {
    soundOptIn: getStoredBoolean(STORAGE_KEY_SOUND),
    isMuted: getStoredBoolean(STORAGE_KEY_MUTE) ?? false,
    theme: 'public',
    currentRoute: window.location.hash.slice(1) || '/'
  };

  private listeners: Set<(state: AppState) => void> = new Set();

  getState(): AppState {
    return { ...this.state };
  }

  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const current = this.getState();
    this.listeners.forEach(fn => fn(current));
  }

  setSoundOptIn(optIn: boolean): void {
    this.state.soundOptIn = optIn;
    setStoredBoolean(STORAGE_KEY_SOUND, optIn);
    this.notify();
  }

  toggleMute(): void {
    this.state.isMuted = !this.state.isMuted;
    setStoredBoolean(STORAGE_KEY_MUTE, this.state.isMuted);
    this.notify();
  }

  setRoute(route: string): void {
    this.state.currentRoute = route;
    // Research Lab always uses the light research theme; others use public dark
    this.state.theme = route === '/lab' ? 'research' : 'public';
    document.documentElement.setAttribute('data-theme', this.state.theme);
    this.notify();
  }
}

export const store = new StateStore();
