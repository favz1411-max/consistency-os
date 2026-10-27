import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatLocalDate,
  parseLocalDate,
  getOffsetDateString,
  getWeekDates,
  getMonthCalendarGrid,
  isTaskScheduledForDate,
  getTasksForDate,
  calculateDateProgress,
  calculateProgressStats,
  migrateLegacyHabitsToTasks,
  validateBackupData
} from './calculations';
import { Task, TaskCompletion, LegacyHabit, LegacyHabitLog } from '../types';

test('formatLocalDate and parseLocalDate preserve local YYYY-MM-DD without drift', () => {
  const parsed = parseLocalDate('2025-05-08');
  assert.equal(formatLocalDate(parsed), '2025-05-08');
  assert.equal(getOffsetDateString('2025-05-08', 1), '2025-05-09');
  assert.equal(getOffsetDateString('2025-05-08', -8), '2025-04-30');
});

test('getWeekDates returns 7 consecutive dates aligned to startOfWeek', () => {
  // 2025-05-08 is a Thursday
  const monWeek = getWeekDates('2025-05-08', 1);
  assert.equal(monWeek.length, 7);
  assert.equal(monWeek[0], '2025-05-05'); // Monday
  assert.equal(monWeek[6], '2025-05-11'); // Sunday

  const sunWeek = getWeekDates('2025-05-08', 0);
  assert.equal(sunWeek[0], '2025-05-04'); // Sunday
  assert.equal(sunWeek[6], '2025-05-10'); // Saturday
});

test('getMonthCalendarGrid produces 35 or 42 aligned cells covering the month', () => {
  const grid = getMonthCalendarGrid(2025, 4, 1); // May 2025, Monday start
  assert.ok(grid.length === 35 || grid.length === 42);
  const currentMonthCells = grid.filter(c => c.isCurrentMonth);
  assert.equal(currentMonthCells.length, 31);
  assert.equal(currentMonthCells[0].dateStr, '2025-05-01');
  assert.equal(currentMonthCells[30].dateStr, '2025-05-31');
});

test('isTaskScheduledForDate handles once, daily, weekdays, and weekly recurrence accurately', () => {
  const onceTask: Task = {
    id: 't_once',
    title: 'Dentist appointment',
    recurrence: 'once',
    date: '2025-05-08',
    order: 1,
    createdAt: '2025-05-01T00:00:00.000Z'
  };
  assert.equal(isTaskScheduledForDate(onceTask, '2025-05-08'), true);
  assert.equal(isTaskScheduledForDate(onceTask, '2025-05-09'), false);

  const dailyTask: Task = {
    id: 't_daily',
    title: 'Morning planning',
    recurrence: 'daily',
    date: '2025-05-05',
    order: 2,
    createdAt: '2025-05-05T00:00:00.000Z'
  };
  assert.equal(isTaskScheduledForDate(dailyTask, '2025-05-04'), false); // before start date
  assert.equal(isTaskScheduledForDate(dailyTask, '2025-05-05'), true);
  assert.equal(isTaskScheduledForDate(dailyTask, '2025-05-10'), true);

  const weekdaysTask: Task = {
    id: 't_weekdays',
    title: 'Deep work block',
    recurrence: 'weekdays',
    date: '2025-05-01',
    repeatDays: [1, 3, 5], // Mon, Wed, Fri
    order: 3,
    createdAt: '2025-05-01T00:00:00.000Z'
  };
  assert.equal(isTaskScheduledForDate(weekdaysTask, '2025-05-05'), true); // Monday
  assert.equal(isTaskScheduledForDate(weekdaysTask, '2025-05-06'), false); // Tuesday
  assert.equal(isTaskScheduledForDate(weekdaysTask, '2025-05-07'), true); // Wednesday

  const weeklyTask: Task = {
    id: 't_weekly',
    title: 'Weekly review',
    recurrence: 'weekly',
    date: '2025-05-04', // Sunday
    repeatDays: [0],
    order: 4,
    createdAt: '2025-05-04T00:00:00.000Z'
  };
  assert.equal(isTaskScheduledForDate(weeklyTask, '2025-05-04'), true);
  assert.equal(isTaskScheduledForDate(weeklyTask, '2025-05-05'), false);
  assert.equal(isTaskScheduledForDate(weeklyTask, '2025-05-11'), true);
});

test('completing a recurring task on one date does not mark other dates complete', () => {
  const dailyTask: Task = {
    id: 't_read',
    title: 'Read 20 pages',
    recurrence: 'daily',
    date: '2025-05-01',
    order: 1,
    createdAt: '2025-05-01T00:00:00.000Z'
  };

  const completions: TaskCompletion[] = [
    {
      id: '2025-05-08_t_read',
      date: '2025-05-08',
      taskId: 't_read',
      completed: true,
      updatedAt: '2025-05-08T10:00:00.000Z'
    }
  ];

  const may8 = getTasksForDate('2025-05-08', [dailyTask], completions);
  const may9 = getTasksForDate('2025-05-09', [dailyTask], completions);

  assert.equal(may8.length, 1);
  assert.equal(may8[0].completed, true);

  assert.equal(may9.length, 1);
  assert.equal(may9[0].completed, false);
});

test('calculateDateProgress and calculateProgressStats compute accurate percentages', () => {
  const tasks: Task[] = [
    {
      id: 't1',
      title: 'Task 1',
      recurrence: 'daily',
      date: '2025-05-01',
      order: 1,
      createdAt: '2025-05-01T00:00:00.000Z'
    },
    {
      id: 't2',
      title: 'Task 2',
      recurrence: 'daily',
      date: '2025-05-01',
      order: 2,
      createdAt: '2025-05-01T00:00:00.000Z'
    }
  ];

  const completions: TaskCompletion[] = [
    {
      id: '2025-05-08_t1',
      date: '2025-05-08',
      taskId: 't1',
      completed: true,
      updatedAt: '2025-05-08T09:00:00.000Z'
    }
  ];

  const dayProg = calculateDateProgress('2025-05-08', tasks, completions);
  assert.equal(dayProg.completedCount, 1);
  assert.equal(dayProg.totalCount, 2);
  assert.equal(dayProg.percentage, 50);

  const stats = calculateProgressStats('2025-05-08', 1, tasks, completions);
  assert.equal(stats.todayProgress.percentage, 50);
  assert.equal(stats.totalCompletedAllTime, 1);
  assert.equal(stats.activeDaysThisWeek, 1);
  assert.equal(stats.currentStreak, 1);
});

test('migrateLegacyHabitsToTasks filters out fitness boilerplate and preserves routine/user habits', () => {
  const legacyHabits: LegacyHabit[] = [
    { id: 'habit_workout', name: 'Complete workout', scheduleDays: [1, 2, 3, 4, 5] },
    { id: 'habit_daily_walk', name: 'Walk 8,000 steps', scheduleDays: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'habit_reading', name: 'Read for 20 minutes', routine: 'evening', scheduleDays: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'custom_1', name: 'Write journal notes', category: 'personal', scheduleDays: [1, 3, 5] }
  ];

  const legacyLogs: LegacyHabitLog[] = [
    { date: '2025-05-08', habitId: 'habit_workout', completed: true },
    { date: '2025-05-08', habitId: 'habit_reading', completed: true },
    { date: '2025-05-08', habitId: 'custom_1', completed: false }
  ];

  const migrated = migrateLegacyHabitsToTasks(legacyHabits, legacyLogs, '2025-05-01');
  assert.equal(migrated.tasks.length, 2);
  assert.equal(migrated.tasks[0].id, 'habit_reading');
  assert.equal(migrated.tasks[0].recurrence, 'daily');
  assert.equal(migrated.tasks[1].id, 'custom_1');
  assert.equal(migrated.tasks[1].recurrence, 'weekdays');
  assert.equal(migrated.completions.length, 1);
  assert.equal(migrated.completions[0].taskId, 'habit_reading');
});

test('validateBackupData accepts v2 planner backups and migrates v1 habit backups', () => {
  const v2Backup = {
    appName: 'Consistency OS',
    version: 2,
    tasks: [
      {
        id: 't1',
        title: 'Plan day',
        recurrence: 'daily',
        date: '2025-05-01',
        order: 1,
        createdAt: '2025-05-01T00:00:00.000Z'
      }
    ],
    taskCompletions: [],
    settings: { theme: 'light', startOfWeek: 1 }
  };

  const resV2 = validateBackupData(v2Backup);
  assert.equal(resV2.valid, true);
  assert.equal(resV2.sanitizedData?.tasks.length, 1);

  const v1Backup = {
    appName: 'Consistency OS',
    version: 1,
    habits: [{ id: 'habit_reading', name: 'Read 20 minutes', scheduleDays: [0, 1, 2, 3, 4, 5, 6] }],
    habitLogs: [{ date: '2025-05-08', habitId: 'habit_reading', completed: true }]
  };

  const resV1 = validateBackupData(v1Backup);
  assert.equal(resV1.valid, true);
  assert.equal(resV1.sanitizedData?.tasks.length, 1);
  assert.equal(resV1.sanitizedData?.taskCompletions.length, 1);
});
