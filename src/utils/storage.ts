import { UserSettings } from '../types';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  unitSystem: 'metric',
  waterTargetMl: 2500,
  sleepTargetMinutes: 480, // 8 hours
  startOfWeek: 1, // Monday
  restTimerSeconds: 90,
  appLimits: {
    Instagram: 20,
    TikTok: 15,
    YouTube: 30,
    Reddit: 15,
    'Social / Other': 20
  },
  focusPreserveTimer: true,
  hapticEnabled: true,
  appVersion: '1.0.0'
};

const SETTINGS_KEY = 'consistency_os_settings';
const ACTIVE_SESSION_KEY = 'consistency_os_active_session';
const REST_TIMER_KEY = 'consistency_os_rest_timer';

export function getStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.warn('Failed to parse settings from localStorage, using defaults', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export interface ActiveScrollSessionState {
  app: string;
  startedAt: number; // timestamp
  elapsedSeconds: number;
  isRunning: boolean;
}

export function getStoredActiveSession(): ActiveScrollSessionState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredActiveSession(session: ActiveScrollSessionState | null): void {
  try {
    if (!session) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    }
  } catch (e) {
    console.error('Failed to update active session state', e);
  }
}

export interface ActiveRestTimerState {
  targetSeconds: number;
  remainingSeconds: number;
  startedAt: number;
  isRunning: boolean;
}

export function getStoredRestTimer(): ActiveRestTimerState | null {
  try {
    const raw = localStorage.getItem(REST_TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredRestTimer(timer: ActiveRestTimerState | null): void {
  try {
    if (!timer) {
      localStorage.removeItem(REST_TIMER_KEY);
    } else {
      localStorage.setItem(REST_TIMER_KEY, JSON.stringify(timer));
    }
  } catch (e) {
    console.error('Failed to update rest timer state', e);
  }
}
