/**
 * Pure calculation and calendar scheduling logic for Consistency OS.
 * Decoupled from React and DOM for deterministic unit testing.
 */

import { Task, TaskCompletion, LegacyHabit, LegacyHabitLog } from '../types';

/**
 * Formats a Date object as local YYYY-MM-DD without UTC timezone drift.
 */
export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string at local noon (12:00) to avoid DST boundary issues.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

/**
 * Returns a YYYY-MM-DD date string offset by `offsetDays` from `baseDateStr`.
 */
export function getOffsetDateString(baseDateStr: string, offsetDays: number): string {
  const dt = parseLocalDate(baseDateStr);
  dt.setDate(dt.getDate() + offsetDays);
  return formatLocalDate(dt);
}

/**
 * Returns the 7 YYYY-MM-DD dates for the week containing `selectedDateStr`.
 */
export function getWeekDates(selectedDateStr: string, startOfWeek: 0 | 1 = 1): string[] {
  const dt = parseLocalDate(selectedDateStr);
  const currentDay = dt.getDay(); // 0 = Sun .. 6 = Sat
  const diff = (currentDay - startOfWeek + 7) % 7;
  const startDate = new Date(dt);
  startDate.setDate(dt.getDate() - diff);

  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + idx);
    return formatLocalDate(d);
  });
}

/**
 * Generates a monthly calendar grid (35 or 42 cells) aligned to `startOfWeek`.
 */
export function getMonthCalendarGrid(
  year: number,
  monthIndex: number, // 0 = Jan .. 11 = Dec
  startOfWeek: 0 | 1 = 1
): Array<{ dateStr: string; dayNumber: number; isCurrentMonth: boolean }> {
  const firstOfMonth = new Date(year, monthIndex, 1, 12, 0, 0);
  const daysInMonth = new Date(year, monthIndex + 1, 0, 12, 0, 0).getDate();
  const leadingOffset = (firstOfMonth.getDay() - startOfWeek + 7) % 7;

  const totalCells = leadingOffset + daysInMonth > 35 ? 42 : 35;
  const startCellDate = new Date(year, monthIndex, 1 - leadingOffset, 12, 0, 0);

  return Array.from({ length: totalCells }, (_, idx) => {
    const cellDate = new Date(startCellDate);
    cellDate.setDate(startCellDate.getDate() + idx);
    return {
      dateStr: formatLocalDate(cellDate),
      dayNumber: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === monthIndex
    };
  });
}

/**
 * Determines whether a task is scheduled to appear on `dateStr` (YYYY-MM-DD).
 * Recurring tasks generate daily occurrences dynamically without duplicating stored records.
 */
export function isTaskScheduledForDate(task: Task, dateStr: string): boolean {
  if (!task || !dateStr) return false;
  if (task.excludedDates && task.excludedDates.includes(dateStr)) {
    return false;
  }

  if (task.recurrence === 'once') {
    return task.date === dateStr;
  }

  // Recurring tasks only appear on or after their start date
  if (dateStr < task.date) {
    return false;
  }

  const dayOfWeek = parseLocalDate(dateStr).getDay();

  if (task.recurrence === 'daily') {
    return true;
  }

  if (task.recurrence === 'weekdays') {
    const activeDays =
      task.repeatDays && task.repeatDays.length > 0 ? task.repeatDays : [1, 2, 3, 4, 5];
    return activeDays.includes(dayOfWeek);
  }

  if (task.recurrence === 'weekly') {
    const anchorDay =
      task.repeatDays && task.repeatDays.length > 0
        ? task.repeatDays[0]
        : parseLocalDate(task.date).getDay();
    return dayOfWeek === anchorDay;
  }

  return false;
}

/**
 * Resolves all scheduled tasks for `dateStr` and their date-specific completion status.
 * Completing a task on one date never marks its other occurrences complete.
 */
export function getTasksForDate(
  dateStr: string,
  tasks: Task[],
  completions: TaskCompletion[]
): Array<{ task: Task; completed: boolean }> {
  const completionMap = new Map<string, boolean>();
  for (const c of completions) {
    if (c.date === dateStr) {
      completionMap.set(c.taskId, Boolean(c.completed));
    }
  }

  const scheduled = tasks
    .filter(t => isTaskScheduledForDate(t, dateStr))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });

  return scheduled.map(task => ({
    task,
    completed: completionMap.get(task.id) ?? false
  }));
}

/**
 * Calculates daily completion summary for `dateStr`.
 */
export function calculateDateProgress(
  dateStr: string,
  tasks: Task[],
  completions: TaskCompletion[]
): {
  completedCount: number;
  totalCount: number;
  percentage: number;
} {
  const occurrences = getTasksForDate(dateStr, tasks, completions);
  const totalCount = occurrences.length;
  const completedCount = occurrences.filter(o => o.completed).length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    completedCount,
    totalCount,
    percentage
  };
}

/**
 * Calculates simple, calm consistency statistics for the Progress screen.
 */
export function calculateProgressStats(
  todayStr: string,
  startOfWeek: 0 | 1,
  tasks: Task[],
  completions: TaskCompletion[]
): {
  todayProgress: { completedCount: number; totalCount: number; percentage: number };
  totalCompletedAllTime: number;
  weeklyCompletedCount: number;
  weeklyScheduledCount: number;
  weeklyPercentage: number;
  activeDaysThisWeek: number;
  currentStreak: number;
  weekDays: Array<{
    dateStr: string;
    dayLabel: string;
    dayNumber: number;
    completedCount: number;
    totalCount: number;
    percentage: number;
    isToday: boolean;
    isFuture: boolean;
  }>;
} {
  const todayProgress = calculateDateProgress(todayStr, tasks, completions);
  const totalCompletedAllTime = completions.filter(c => c.completed).length;

  const weekDates = getWeekDates(todayStr, startOfWeek);
  const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let weeklyCompletedCount = 0;
  let weeklyScheduledCount = 0;
  let activeDaysThisWeek = 0;

  const weekDays = weekDates.map(dStr => {
    const dt = parseLocalDate(dStr);
    const prog = calculateDateProgress(dStr, tasks, completions);
    const isFuture = dStr > todayStr;

    if (!isFuture) {
      weeklyCompletedCount += prog.completedCount;
      weeklyScheduledCount += prog.totalCount;
    }
    if (prog.completedCount > 0) {
      activeDaysThisWeek += 1;
    }

    return {
      dateStr: dStr,
      dayLabel: shortDayNames[dt.getDay()],
      dayNumber: dt.getDate(),
      completedCount: prog.completedCount,
      totalCount: prog.totalCount,
      percentage: prog.percentage,
      isToday: dStr === todayStr,
      isFuture
    };
  });

  const weeklyPercentage =
    weeklyScheduledCount > 0
      ? Math.round((weeklyCompletedCount / weeklyScheduledCount) * 100)
      : 0;

  // Calculate consecutive active days streak up to today
  let currentStreak = 0;
  for (let offset = 0; offset < 365; offset++) {
    const checkDate = getOffsetDateString(todayStr, -offset);
    const prog = calculateDateProgress(checkDate, tasks, completions);

    if (prog.totalCount === 0) {
      if (offset === 0) continue;
      break;
    }

    if (prog.completedCount > 0) {
      currentStreak += 1;
    } else {
      // If today has tasks not yet completed, check if yesterday had an active streak
      if (offset === 0) continue;
      break;
    }
  }

  return {
    todayProgress,
    totalCompletedAllTime,
    weeklyCompletedCount,
    weeklyScheduledCount,
    weeklyPercentage,
    activeDaysThisWeek,
    currentStreak,
    weekDays
  };
}

/**
 * Converts legacy v1 Habit / HabitLog records into minimalist Task / TaskCompletion records,
 * filtering out pure fitness/workout/calorie/step-counter boilerplate habits while keeping
 * meaningful daily planning habits and all user-created habits.
 */
export function migrateLegacyHabitsToTasks(
  legacyHabits: LegacyHabit[],
  legacyLogs: LegacyHabitLog[],
  fallbackStartDate: string
): { tasks: Task[]; completions: TaskCompletion[] } {
  const fitnessBoilerplateIds = new Set([
    'habit_workout',
    'habit_nutrition',
    'habit_daily_walk',
    'habit_walk',
    'habit_drink_water'
  ]);

  const tasks: Task[] = [];
  const validTaskIds = new Set<string>();

  legacyHabits.forEach((h, idx) => {
    if (!h || !h.id || !h.name) return;
    // Skip default fitness/water/step boilerplate, but keep routine/mind or custom user habits
    if (fitnessBoilerplateIds.has(h.id)) return;

    const schedule = Array.isArray(h.scheduleDays) ? h.scheduleDays : [0, 1, 2, 3, 4, 5, 6];
    const isEveryDay = schedule.length === 7;
    const isSingleDay = schedule.length === 1;

    const recurrence: Task['recurrence'] = isEveryDay
      ? 'daily'
      : isSingleDay
      ? 'weekly'
      : 'weekdays';

    const categoryLabel =
      h.routine === 'morning'
        ? 'Morning'
        : h.routine === 'evening'
        ? 'Evening'
        : h.category
        ? h.category.charAt(0).toUpperCase() + h.category.slice(1)
        : 'Routine';

    const startDate =
      h.createdAt && /^\d{4}-\d{2}-\d{2}/.test(h.createdAt)
        ? h.createdAt.slice(0, 10)
        : fallbackStartDate;

    const migratedTask: Task = {
      id: h.id,
      title: h.name,
      category: categoryLabel,
      recurrence,
      date: startDate,
      repeatDays: schedule,
      order: typeof h.order === 'number' ? h.order : idx + 1,
      createdAt: h.createdAt || new Date().toISOString()
    };

    tasks.push(migratedTask);
    validTaskIds.add(migratedTask.id);
  });

  const completions: TaskCompletion[] = [];
  for (const log of legacyLogs) {
    if (!log || !log.date || !log.habitId || !validTaskIds.has(log.habitId)) continue;
    if (!log.completed) continue;
    completions.push({
      id: `${log.date}_${log.habitId}`,
      date: log.date,
      taskId: log.habitId,
      completed: true,
      updatedAt: log.updatedAt || new Date().toISOString()
    });
  }

  return { tasks, completions };
}

/**
 * Schema Validation for Backup JSON Import (supports both v2 Planner backups and v1 Legacy backups).
 */
export function validateBackupData(data: unknown): {
  valid: boolean;
  error?: string;
  sanitizedData?: {
    version: number;
    appName: string;
    tasks: Task[];
    taskCompletions: TaskCompletion[];
    settings: Record<string, unknown>;
  };
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

  let tasks: Task[] = Array.isArray(obj.tasks) ? (obj.tasks as Task[]) : [];
  let taskCompletions: TaskCompletion[] = Array.isArray(obj.taskCompletions)
    ? (obj.taskCompletions as TaskCompletion[])
    : [];

  // If importing a v1 backup that had `habits` and `habitLogs`, migrate them safely
  if (tasks.length === 0 && Array.isArray(obj.habits)) {
    const fallbackDate = formatLocalDate(new Date());
    const migrated = migrateLegacyHabitsToTasks(
      obj.habits as LegacyHabit[],
      Array.isArray(obj.habitLogs) ? (obj.habitLogs as LegacyHabitLog[]) : [],
      fallbackDate
    );
    tasks = migrated.tasks;
    taskCompletions = migrated.completions;
  }

  return {
    valid: true,
    sanitizedData: {
      version: 2,
      appName: obj.appName,
      tasks,
      taskCompletions,
      settings:
        typeof obj.settings === 'object' && obj.settings !== null
          ? (obj.settings as Record<string, unknown>)
          : {}
    }
  };
}
