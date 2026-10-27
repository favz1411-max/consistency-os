import { Task, TaskCompletion, UserSettings } from '../types';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  startOfWeek: 1, // Monday
  appVersion: '2.0.0'
};

const SETTINGS_KEY = 'consistency_os_settings';
const TASKS_BACKUP_KEY = 'consistency_os_tasks_backup_v2';
const COMPLETIONS_BACKUP_KEY = 'consistency_os_completions_backup_v2';
const MIGRATION_V2_DONE_KEY = 'consistency_os_migrated_v2';

export function getStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      startOfWeek: parsed.startOfWeek === 0 ? 0 : 1,
      appVersion: '2.0.0'
    };
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

/**
 * Synchronous localStorage mirror for tasks and completions so iPhone Home Screen PWA
 * and Safari always retain immediate durability across app closes.
 */
export function getStoredTasksBackup(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredTasksBackup(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_BACKUP_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to mirror tasks to localStorage', e);
  }
}

export function getStoredCompletionsBackup(): TaskCompletion[] {
  try {
    const raw = localStorage.getItem(COMPLETIONS_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredCompletionsBackup(completions: TaskCompletion[]): void {
  try {
    localStorage.setItem(COMPLETIONS_BACKUP_KEY, JSON.stringify(completions));
  } catch (e) {
    console.error('Failed to mirror task completions to localStorage', e);
  }
}

export function isV2MigrationDone(): boolean {
  try {
    return localStorage.getItem(MIGRATION_V2_DONE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markV2MigrationDone(): void {
  try {
    localStorage.setItem(MIGRATION_V2_DONE_KEY, 'true');
  } catch {
    // ignore
  }
}

export function clearPlannerLocalStorage(): void {
  try {
    localStorage.removeItem(TASKS_BACKUP_KEY);
    localStorage.removeItem(COMPLETIONS_BACKUP_KEY);
  } catch {
    // ignore
  }
}
