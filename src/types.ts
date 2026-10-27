export type RecurrenceType = 'once' | 'daily' | 'weekdays' | 'weekly';

export interface Task {
  id: string;
  title: string;
  time?: string; // Optional HH:MM (24h or formatted)
  category?: string; // Optional simple category e.g. 'Routine', 'Work', 'Personal', 'Mind'
  recurrence: RecurrenceType;
  date: string; // YYYY-MM-DD (target date for 'once', or start date for recurring)
  repeatDays?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  excludedDates?: string[]; // Optional dates excluded from recurrence
  order: number;
  createdAt: string;
}

export interface TaskCompletion {
  id: string; // `${date}_${taskId}`
  date: string; // YYYY-MM-DD
  taskId: string;
  completed: boolean;
  updatedAt: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  startOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  appVersion: string;
}

// Legacy interfaces retained solely for safe migration of existing v1 habit data
export interface LegacyHabit {
  id: string;
  name: string;
  category?: string;
  scheduleDays?: number[];
  routine?: 'morning' | 'evening' | 'anytime';
  order?: number;
  createdAt?: string;
}

export interface LegacyHabitLog {
  id?: string;
  date: string;
  habitId: string;
  completed: boolean;
  updatedAt?: string;
}
