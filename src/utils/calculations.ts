/**
 * Pure calculation logic for Consistency OS
 * Decoupled from React and DOM for high testability and reliability.
 */

export interface HabitItem {
  id: string;
  name: string;
  category: 'health' | 'fitness' | 'mind' | 'discipline' | 'routine';
  targetType: 'boolean' | 'numeric' | 'duration';
  targetValue?: number;
  unit?: string;
  scheduleDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  routine?: 'morning' | 'evening' | 'anytime';
  order: number;
}

export interface HabitLogItem {
  date: string; // YYYY-MM-DD
  habitId: string;
  completed: boolean;
  value?: number;
}

export interface SleepRecord {
  date: string;
  bedtime: string; // "HH:MM"
  wakeTime: string; // "HH:MM"
  durationMinutes: number;
  quality: number; // 1-5
  isRestDay?: boolean;
}

export interface BodyRecord {
  date: string;
  weight: number;
  waist?: number;
  chest?: number;
  arms?: number;
  hips?: number;
  notes?: string;
}

export interface DigitalSession {
  id: string;
  date: string;
  app: string;
  durationMinutes: number;
  timestamp: number;
}

/**
 * Calculates sleep duration in minutes, correctly handling overnight bedtimes.
 * e.g., bedtime 23:15, wake 07:30 -> 495 minutes (8h 15m).
 */
export function calculateSleepDurationMinutes(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 0;
  const [bHour, bMin] = bedtime.split(':').map(Number);
  const [wHour, wMin] = wakeTime.split(':').map(Number);

  if (isNaN(bHour) || isNaN(bMin) || isNaN(wHour) || isNaN(wMin)) return 0;

  const bedTotalMin = bHour * 60 + bMin;
  const wakeTotalMin = wHour * 60 + wMin;

  if (wakeTotalMin >= bedTotalMin) {
    return wakeTotalMin - bedTotalMin;
  }
  // Crosses midnight
  return (24 * 60 - bedTotalMin) + wakeTotalMin;
}

/**
 * Format minutes into readable hours and minutes string, e.g. "7h 45m"
 */
export function formatMinutes(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Calculate completion percentage for a specific date.
 * Rules:
 * - Only includes habits scheduled for that day of week.
 * - Does not count unscheduled habits or rest days as failures.
 * - If no habits are scheduled, returns 100% if rest day/none scheduled or 0 if empty.
 */
export function calculateDailyCompletion<T extends HabitItem>(
  dateStr: string,
  habits: T[],
  logs: HabitLogItem[],
  options?: { workoutScheduled?: boolean; workoutCompleted?: boolean }
): {
  percentage: number;
  completedCount: number;
  totalScheduled: number;
  scheduledHabits: T[];
} {
  const dateObj = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // Filter habits active on this day
  const scheduledHabits = habits.filter(h => h.scheduleDays.includes(dayOfWeek));
  let totalScheduled = scheduledHabits.length;
  let completedCount = 0;

  for (const habit of scheduledHabits) {
    const log = logs.find(l => l.date === dateStr && l.habitId === habit.id);
    if (log && log.completed) {
      completedCount++;
    }
  }

  // If workouts are scheduled as a daily component
  if (options?.workoutScheduled) {
    totalScheduled += 1;
    if (options.workoutCompleted) {
      completedCount += 1;
    }
  }

  const percentage = totalScheduled === 0 ? 0 : Math.round((completedCount / totalScheduled) * 100);

  return {
    percentage,
    completedCount,
    totalScheduled,
    scheduledHabits
  };
}

/**
 * Helper to get date string offset by days (YYYY-MM-DD)
 */
export function getOffsetDateString(baseDateStr: string, offsetDays: number): string {
  const d = new Date(baseDateStr + 'T12:00:00');
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

/**
 * Calculates current streak and best streak for a habit.
 * Rules:
 * - Unscheduled days do NOT break a streak.
 * - If today is a scheduled day and not yet completed, the streak from yesterday is still alive.
 * - Best streak is the maximum consecutive scheduled-completions historically.
 */
export function calculateHabitStreak(
  habit: HabitItem,
  logs: HabitLogItem[],
  todayDateStr: string
): { currentStreak: number; bestStreak: number; totalCompletions: number } {
  // Sort logs by date ascending
  const habitLogsMap = new Map<string, boolean>();
  let totalCompletions = 0;

  logs.forEach(l => {
    if (l.habitId === habit.id && l.completed) {
      habitLogsMap.set(l.date, true);
      totalCompletions++;
    }
  });

  // Calculate current streak backwards from today
  let currentStreak = 0;
  let checkDate = todayDateStr;
  let isCheckingToday = true;

  // Check up to 365 days back
  for (let i = 0; i < 365; i++) {
    const d = new Date(checkDate + 'T12:00:00');
    const dayOfWeek = d.getDay();
    const isScheduled = habit.scheduleDays.includes(dayOfWeek);

    if (isScheduled) {
      const completed = habitLogsMap.get(checkDate);
      if (completed) {
        currentStreak++;
      } else {
        // If today is scheduled and not yet completed, don't break yet—check if yesterday continued
        if (isCheckingToday) {
          // just skip today, keep checking yesterday
        } else {
          // Missed scheduled day: streak broken
          break;
        }
      }
    }
    // Unscheduled days are skipped without breaking streak
    isCheckingToday = false;
    checkDate = getOffsetDateString(checkDate, -1);
  }

  // Calculate best streak across all logged dates
  let bestStreak = currentStreak;
  if (habitLogsMap.size > 0) {
    const dates = Array.from(habitLogsMap.keys()).sort();
    if (dates.length > 0) {
      const earliestDate = dates[0];
      let tempStreak = 0;
      let walkDate = earliestDate;

      while (walkDate <= todayDateStr) {
        const d = new Date(walkDate + 'T12:00:00');
        const dayOfWeek = d.getDay();
        const isScheduled = habit.scheduleDays.includes(dayOfWeek);

        if (isScheduled) {
          if (habitLogsMap.get(walkDate)) {
            tempStreak++;
            if (tempStreak > bestStreak) bestStreak = tempStreak;
          } else {
            tempStreak = 0;
          }
        }
        walkDate = getOffsetDateString(walkDate, 1);
      }
    }
  }

  return {
    currentStreak,
    bestStreak,
    totalCompletions
  };
}

/**
 * Calculates digital discipline allowance and remaining budget
 */
export function calculateDigitalAllowance(
  appLimits: Record<string, number>, // in minutes
  sessions: DigitalSession[],
  dateStr: string
): {
  totalAllowed: number;
  totalUsed: number;
  totalRemaining: number;
  isOverLimit: boolean;
  appBreakdown: Record<
    string,
    {
      allowed: number;
      used: number;
      remaining: number;
      percentUsed: number;
      isExceeded: boolean;
    }
  >;
} {
  const daySessions = sessions.filter(s => s.date === dateStr);
  const appBreakdown: Record<
    string,
    {
      allowed: number;
      used: number;
      remaining: number;
      percentUsed: number;
      isExceeded: boolean;
    }
  > = {};

  let totalAllowed = 0;
  let totalUsed = 0;

  for (const [app, limit] of Object.entries(appLimits)) {
    totalAllowed += limit;
    const used = daySessions
      .filter(s => s.app.toLowerCase() === app.toLowerCase())
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    totalUsed += used;
    const remaining = Math.max(0, limit - used);
    const percentUsed = limit > 0 ? Math.round((used / limit) * 100) : 0;
    const isExceeded = used > limit;

    appBreakdown[app] = {
      allowed: limit,
      used,
      remaining,
      percentUsed,
      isExceeded
    };
  }

  const totalRemaining = Math.max(0, totalAllowed - totalUsed);
  const isOverLimit = totalUsed > totalAllowed;

  return {
    totalAllowed,
    totalUsed,
    totalRemaining,
    isOverLimit,
    appBreakdown
  };
}

/**
 * Body weight progress trends
 */
export function calculateBodyTrend(records: BodyRecord[]): {
  latest?: BodyRecord;
  previous?: BodyRecord;
  changeFromPrevious: number;
  changeFromStart: number;
  startingWeight?: number;
} {
  if (!records || records.length === 0) {
    return {
      changeFromPrevious: 0,
      changeFromStart: 0
    };
  }

  // Sort ascending by date
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : undefined;
  const start = sorted[0];

  const changeFromPrevious = previous ? Number((latest.weight - previous.weight).toFixed(2)) : 0;
  const changeFromStart = Number((latest.weight - start.weight).toFixed(2));

  return {
    latest,
    previous,
    changeFromPrevious,
    changeFromStart,
    startingWeight: start.weight
  };
}

/**
 * Schema Validation for Backup JSON Import
 */
export function validateBackupData(data: unknown): {
  valid: boolean;
  error?: string;
  sanitizedData?: Record<string, unknown>;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Backup data must be a valid JSON object.' };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== 'number' && typeof obj.version !== 'string') {
    return { valid: false, error: 'Missing or invalid backup version identifier.' };
  }

  if (!obj.appName || typeof obj.appName !== 'string') {
    return { valid: false, error: 'Unrecognized backup file. Expected Consistency OS backup.' };
  }

  // Sanitize structure
  const sanitized: Record<string, unknown> = {
    version: obj.version,
    exportDate: obj.exportDate || new Date().toISOString(),
    appName: obj.appName,
    habits: Array.isArray(obj.habits) ? obj.habits : [],
    habitLogs: Array.isArray(obj.habitLogs) ? obj.habitLogs : [],
    workouts: Array.isArray(obj.workouts) ? obj.workouts : [],
    routines: Array.isArray(obj.routines) ? obj.routines : [],
    bodyLogs: Array.isArray(obj.bodyLogs) ? obj.bodyLogs : [],
    waterLogs: Array.isArray(obj.waterLogs) ? obj.waterLogs : [],
    sleepLogs: Array.isArray(obj.sleepLogs) ? obj.sleepLogs : [],
    nutritionLogs: Array.isArray(obj.nutritionLogs) ? obj.nutritionLogs : [],
    digitalLogs: Array.isArray(obj.digitalLogs) ? obj.digitalLogs : [],
    focusSessions: Array.isArray(obj.focusSessions) ? obj.focusSessions : [],
    settings: typeof obj.settings === 'object' && obj.settings !== null ? obj.settings : {}
  };

  return {
    valid: true,
    sanitizedData: sanitized
  };
}

/**
 * Extracts a valid daily step count from raw text, clipboard strings, or URL query strings.
 * Examples:
 * - "8,432 steps" -> 8432
 * - "?steps=9120&source=apple_fitness" -> 9120
 * - "10500" -> 10500
 */
export function parseStepsFromText(raw: string): number | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Check if it looks like a URL or query parameter containing steps=
  const urlMatch = trimmed.match(/[?&]steps=([0-9,]+)/i);
  if (urlMatch && urlMatch[1]) {
    const val = parseInt(urlMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(val) && val >= 0 && val <= 200000) return val;
  }

  // Otherwise extract the first standalone number (allowing commas like 8,450)
  const numMatch = trimmed.match(/\b(\d{1,3}(?:,\d{3})+|\d+)\b/);
  if (!numMatch || !numMatch[1]) return null;

  const parsed = parseInt(numMatch[1].replace(/,/g, ''), 10);
  if (isNaN(parsed) || parsed < 0 || parsed > 200000) return null;
  return parsed;
}

/**
 * Parses Apple Health / Apple Fitness step count exports from:
 * 1. Apple Health XML (<Record type="HKQuantityTypeIdentifierStepCount" startDate="2026-10-19 ..." value="450"/>)
 * 2. CSV ("date,steps\n2026-10-19,8450")
 * 3. JSON ([{"date": "2026-10-19", "steps": 8450}])
 * Aggregates multiple samples on the same day into daily totals sorted by date ascending.
 */
export function parseAppleHealthStepsExport(
  content: string
): Array<{ date: string; steps: number }> {
  if (!content || typeof content !== 'string') return [];
  const trimmed = content.trim();
  if (!trimmed) return [];

  const dailyTotals = new Map<string, number>();

  const addStepsForDate = (dateStr: string, stepsVal: number) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
    if (isNaN(stepsVal) || stepsVal <= 0 || stepsVal > 200000) return;
    const prev = dailyTotals.get(dateStr) || 0;
    dailyTotals.set(dateStr, Math.min(200000, Math.round(prev + stepsVal)));
  };

  // 1. Check JSON format
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed.data) ? parsed.data : [];
      for (const item of list) {
        if (item && typeof item === 'object') {
          const rawDate = String(item.date || item.startDate || '').slice(0, 10);
          const rawSteps = Number(item.steps ?? item.value ?? item.count);
          addStepsForDate(rawDate, rawSteps);
        }
      }
      return Array.from(dailyTotals.entries())
        .map(([date, steps]) => ({ date, steps }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch {
      // Fall through if not valid JSON
    }
  }

  // 2. Check Apple Health XML (<Record ... type="HKQuantityTypeIdentifierStepCount" ... />)
  if (trimmed.includes('HKQuantityTypeIdentifierStepCount') || trimmed.includes('<Record')) {
    const recordRegex = /<Record[^>]*type=["']HKQuantityTypeIdentifierStepCount["'][^>]*>/gi;
    const matches = trimmed.match(recordRegex) || [];
    for (const tag of matches) {
      const dateMatch = tag.match(/startDate=["'](\d{4}-\d{2}-\d{2})/i);
      const valMatch = tag.match(/value=["']([0-9.]+)["']/i);
      if (dateMatch && valMatch) {
        addStepsForDate(dateMatch[1], parseFloat(valMatch[1]));
      }
    }
    return Array.from(dailyTotals.entries())
      .map(([date, steps]) => ({ date, steps }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // 3. Fallback: CSV / line-by-line ("YYYY-MM-DD,8450" or "YYYY-MM-DD;8450")
  const lines = trimmed.split(/\r?\n/);
  for (const line of lines) {
    const rowMatch = line.trim().match(/^(\d{4}-\d{2}-\d{2})[,;\t\s]+([0-9.]+)/);
    if (rowMatch) {
      addStepsForDate(rowMatch[1], parseFloat(rowMatch[2]));
    }
  }

  return Array.from(dailyTotals.entries())
    .map(([date, steps]) => ({ date, steps }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

