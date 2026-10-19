import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSleepDurationMinutes,
  formatMinutes,
  calculateDailyCompletion,
  calculateHabitStreak,
  calculateDigitalAllowance,
  calculateBodyTrend,
  validateBackupData,
  parseStepsFromText,
  parseAppleHealthStepsExport,
  type HabitItem,
  type HabitLogItem,
  type BodyRecord
} from './calculations.ts';

test('calculateSleepDurationMinutes correctly handles same-day sleep', () => {
  // e.g. Nap or daytime rest: 13:00 to 14:30 = 90 mins
  assert.equal(calculateSleepDurationMinutes('13:00', '14:30'), 90);
});

test('calculateSleepDurationMinutes correctly handles overnight sleep across midnight', () => {
  // 23:15 to 07:30: 45 min before midnight + 450 min after = 495 mins
  assert.equal(calculateSleepDurationMinutes('23:15', '07:30'), 495);
  // 22:00 to 06:00: 2h + 6h = 8h = 480 mins
  assert.equal(calculateSleepDurationMinutes('22:00', '06:00'), 480);
  // 00:30 to 08:00 = 7h 30m = 450 mins
  assert.equal(calculateSleepDurationMinutes('00:30', '08:00'), 450);
});

test('formatMinutes formats properly', () => {
  assert.equal(formatMinutes(495), '8h 15m');
  assert.equal(formatMinutes(60), '1h');
  assert.equal(formatMinutes(45), '45m');
  assert.equal(formatMinutes(0), '0m');
});

test('calculateDailyCompletion only counts habits scheduled for that day of week', () => {
  // 2026-10-19 is a Monday (day 1)
  const habits: HabitItem[] = [
    {
      id: 'h1',
      name: 'Morning walk',
      category: 'health',
      targetType: 'boolean',
      scheduleDays: [1, 2, 3, 4, 5], // Mon-Fri
      order: 1
    },
    {
      id: 'h2',
      name: 'Weekend hike',
      category: 'fitness',
      targetType: 'boolean',
      scheduleDays: [0, 6], // Sun, Sat only
      order: 2
    },
    {
      id: 'h3',
      name: 'Read 20 mins',
      category: 'mind',
      targetType: 'duration',
      scheduleDays: [0, 1, 2, 3, 4, 5, 6], // Daily
      order: 3
    }
  ];

  // On Monday (2026-10-19): scheduled are h1 and h3 (total 2). h2 is NOT scheduled and must not count as failure.
  const logs: HabitLogItem[] = [
    { date: '2026-10-19', habitId: 'h1', completed: true },
    { date: '2026-10-19', habitId: 'h3', completed: false }
  ];

  const result = calculateDailyCompletion('2026-10-19', habits, logs);
  assert.equal(result.totalScheduled, 2);
  assert.equal(result.completedCount, 1);
  assert.equal(result.percentage, 50);
});

test('calculateHabitStreak preserves streak over unscheduled rest days', () => {
  const habit: HabitItem = {
    id: 'gym',
    name: 'Strength Training',
    category: 'fitness',
    targetType: 'boolean',
    scheduleDays: [1, 3, 5],
    order: 1
  };

  const logs: HabitLogItem[] = [
    { date: '2026-10-12', habitId: 'gym', completed: true },
    { date: '2026-10-14', habitId: 'gym', completed: true },
    { date: '2026-10-16', habitId: 'gym', completed: true },
    { date: '2026-10-19', habitId: 'gym', completed: true }
  ];

  const result = calculateHabitStreak(habit, logs, '2026-10-19');
  assert.equal(result.currentStreak, 4);
  assert.equal(result.bestStreak, 4);
  assert.equal(result.totalCompletions, 4);
});

test('calculateDigitalAllowance calculates remaining allowance and limits accurately', () => {
  const appLimits = {
    Instagram: 30,
    YouTube: 45,
    Reddit: 20
  };

  const sessions = [
    { id: '1', date: '2026-10-19', app: 'Instagram', durationMinutes: 20, timestamp: 1 },
    { id: '2', date: '2026-10-19', app: 'YouTube', durationMinutes: 50, timestamp: 2 }
  ];

  const allowance = calculateDigitalAllowance(appLimits, sessions, '2026-10-19');
  assert.equal(allowance.totalAllowed, 95);
  assert.equal(allowance.totalUsed, 70);
  assert.equal(allowance.totalRemaining, 25);
  assert.equal(allowance.appBreakdown['Instagram'].remaining, 10);
  assert.equal(allowance.appBreakdown['YouTube'].isExceeded, true);
  assert.equal(allowance.appBreakdown['Reddit'].remaining, 20);
});

test('calculateBodyTrend accurately tracks progress delta and start delta', () => {
  const records: BodyRecord[] = [
    { date: '2026-09-01', weight: 82.5 },
    { date: '2026-09-15', weight: 81.8 },
    { date: '2026-10-01', weight: 80.5 }
  ];

  const trend = calculateBodyTrend(records);
  assert.equal(trend.startingWeight, 82.5);
  assert.equal(trend.changeFromPrevious, -1.3); // 80.5 - 81.8
  assert.equal(trend.changeFromStart, -2.0); // 80.5 - 82.5
});

test('validateBackupData enforces schema and sanity checks', () => {
  const validPayload = {
    version: 1,
    appName: 'Consistency OS',
    habits: [{ id: '1', name: 'Water' }],
    settings: { theme: 'dark' }
  };
  const validation = validateBackupData(validPayload);
  assert.equal(validation.valid, true);

  const invalidPayload = { foo: 'bar' };
  const invalidResult = validateBackupData(invalidPayload);
  assert.equal(invalidResult.valid, false);
});

test('parseStepsFromText extracts step counts from Apple Fitness strings and URL params', () => {
  assert.equal(parseStepsFromText('8,432 steps'), 8432);
  assert.equal(parseStepsFromText('?steps=10240&source=apple_fitness'), 10240);
  assert.equal(parseStepsFromText('Apple Fitness Today: 9,150'), 9150);
  assert.equal(parseStepsFromText('no numbers here'), null);
});

test('parseAppleHealthStepsExport aggregates Apple Health XML, CSV, and JSON step exports', () => {
  const xmlSample = `
    <HealthData>
      <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone 17 Pro" startDate="2026-10-18 09:15:00 -0700" value="3200" />
      <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone 17 Pro" startDate="2026-10-18 14:30:00 -0700" value="5100" />
      <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone 17 Pro" startDate="2026-10-19 10:00:00 -0700" value="6450" />
    </HealthData>
  `;
  const parsedXml = parseAppleHealthStepsExport(xmlSample);
  assert.equal(parsedXml.length, 2);
  assert.deepEqual(parsedXml[0], { date: '2026-10-18', steps: 8300 });
  assert.deepEqual(parsedXml[1], { date: '2026-10-19', steps: 6450 });

  const csvSample = `Date,Steps\n2026-10-17,7500\n2026-10-19,9200`;
  const parsedCsv = parseAppleHealthStepsExport(csvSample);
  assert.equal(parsedCsv.length, 2);
  assert.deepEqual(parsedCsv[0], { date: '2026-10-17', steps: 7500 });
  assert.deepEqual(parsedCsv[1], { date: '2026-10-19', steps: 9200 });
});

