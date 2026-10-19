import {
  Habit,
  HabitLog,
  Workout,
  WorkoutRoutine,
  BodyMeasurement,
  DailyWaterLog,
  SleepRecord,
  DailyNutritionLog,
  DigitalSession,
  DailyCommitment,
  FocusSession
} from '../types';

const DB_NAME = 'consistency_os_db';
const DB_VERSION = 1;

export interface InitialSeedResult {
  isFirstLaunch: boolean;
}

let dbInstance: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported on this device.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Habits
      if (!db.objectStoreNames.contains('habits')) {
        const store = db.createObjectStore('habits', { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('order', 'order', { unique: false });
      }

      // 2. Habit Logs
      if (!db.objectStoreNames.contains('habit_logs')) {
        const store = db.createObjectStore('habit_logs', { keyPath: 'id' }); // id: `${date}_${habitId}`
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('habitId', 'habitId', { unique: false });
      }

      // 3. Workouts
      if (!db.objectStoreNames.contains('workouts')) {
        const store = db.createObjectStore('workouts', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }

      // 4. Workout Routines
      if (!db.objectStoreNames.contains('routines')) {
        db.createObjectStore('routines', { keyPath: 'id' });
      }

      // 5. Body measurements
      if (!db.objectStoreNames.contains('body_logs')) {
        const store = db.createObjectStore('body_logs', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }

      // 6. Water logs (one per day)
      if (!db.objectStoreNames.contains('water_logs')) {
        db.createObjectStore('water_logs', { keyPath: 'date' });
      }

      // 7. Sleep logs (one per day)
      if (!db.objectStoreNames.contains('sleep_logs')) {
        db.createObjectStore('sleep_logs', { keyPath: 'date' });
      }

      // 8. Nutrition logs (one per day)
      if (!db.objectStoreNames.contains('nutrition_logs')) {
        db.createObjectStore('nutrition_logs', { keyPath: 'date' });
      }

      // 9. Digital Discipline Sessions
      if (!db.objectStoreNames.contains('digital_logs')) {
        const store = db.createObjectStore('digital_logs', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }

      // 10. Commitments
      if (!db.objectStoreNames.contains('commitments')) {
        db.createObjectStore('commitments', { keyPath: 'date' });
      }

      // 11. Focus Sessions
      if (!db.objectStoreNames.contains('focus_sessions')) {
        const store = db.createObjectStore('focus_sessions', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Generic helper to get all items from a store
 */
export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic helper to put (insert or update) an item into a store
 */
export async function putInStore<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic helper to delete by key
 */
export async function deleteFromStore(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic helper to get by key
 */
export async function getFromStore<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Default Suggested Habits as requested
 */
export const DEFAULT_INITIAL_HABITS: Habit[] = [
  {
    id: 'habit_wake_up',
    name: 'Wake up at planned time',
    category: 'routine',
    targetType: 'boolean',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    routine: 'morning',
    order: 1,
    iconName: 'AlarmClock',
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit_drink_water',
    name: 'Drink 500ml water after waking',
    category: 'health',
    targetType: 'numeric',
    targetValue: 500,
    unit: 'ml',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    routine: 'morning',
    order: 2,
    iconName: 'Droplets',
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit_workout',
    name: 'Complete workout or active recovery',
    category: 'fitness',
    targetType: 'boolean',
    scheduleDays: [1, 2, 3, 4, 5], // Mon to Fri by default
    routine: 'anytime',
    order: 3,
    iconName: 'Dumbbell',
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit_nutrition',
    name: 'Eat according to nutrition plan',
    category: 'health',
    targetType: 'boolean',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    routine: 'anytime',
    order: 4,
    iconName: 'Salad',
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit_daily_walk',
    name: 'Walk or move 8,000+ steps',
    category: 'fitness',
    targetType: 'numeric',
    targetValue: 8000,
    unit: 'steps',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    routine: 'anytime',
    order: 5,
    iconName: 'Footprints',
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit_limit_scrolling',
    name: 'Stay within scrolling budget',
    category: 'discipline',
    targetType: 'boolean',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    routine: 'anytime',
    order: 6,
    iconName: 'SmartphoneOff',
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit_reading',
    name: 'Read or learn for 20 minutes',
    category: 'mind',
    targetType: 'duration',
    targetValue: 20,
    unit: 'min',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    routine: 'evening',
    order: 7,
    iconName: 'BookOpen',
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit_prepare_tomorrow',
    name: 'Prepare clothes & schedule for tomorrow',
    category: 'routine',
    targetType: 'boolean',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    routine: 'evening',
    order: 8,
    iconName: 'CheckSquare',
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit_sleep_on_time',
    name: 'Sleep at planned time',
    category: 'health',
    targetType: 'boolean',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    routine: 'evening',
    order: 9,
    iconName: 'Moon',
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'routine_full_body_a',
    name: 'Full Body Foundations A',
    targetDays: [1, 4], // Mon, Thu
    exercises: [
      { name: 'Barbell Back Squat', targetMuscle: 'Quadriceps / Glutes', defaultSets: 3, defaultReps: 8, defaultWeight: 60, isBodyweight: false },
      { name: 'Flat Dumbbell Bench Press', targetMuscle: 'Chest / Triceps', defaultSets: 3, defaultReps: 10, defaultWeight: 20, isBodyweight: false },
      { name: 'Chest-Supported Dumbbell Row', targetMuscle: 'Upper Back / Lats', defaultSets: 3, defaultReps: 10, defaultWeight: 18, isBodyweight: false },
      { name: 'Romanian Deadlift', targetMuscle: 'Hamstrings / Glutes', defaultSets: 3, defaultReps: 10, defaultWeight: 50, isBodyweight: false },
      { name: 'Plank Hold', targetMuscle: 'Core', defaultSets: 3, defaultReps: 1, isBodyweight: true }
    ]
  },
  {
    id: 'routine_full_body_b',
    name: 'Full Body Foundations B',
    targetDays: [3, 6], // Wed, Sat
    exercises: [
      { name: 'Overhead Barbell Press', targetMuscle: 'Shoulders', defaultSets: 3, defaultReps: 8, defaultWeight: 35, isBodyweight: false },
      { name: 'Pull-ups or Lat Pulldowns', targetMuscle: 'Lats / Biceps', defaultSets: 3, defaultReps: 8, isBodyweight: true },
      { name: 'Walking Dumbbell Lunges', targetMuscle: 'Legs / Balance', defaultSets: 3, defaultReps: 12, defaultWeight: 12, isBodyweight: false },
      { name: 'Hanging Knee Raises', targetMuscle: 'Abs', defaultSets: 3, defaultReps: 12, isBodyweight: true }
    ]
  },
  {
    id: 'routine_bodyweight_core',
    name: 'Home Mobility & Core',
    targetDays: [2, 5], // Tue, Fri
    exercises: [
      { name: 'Push-ups', targetMuscle: 'Chest / Triceps', defaultSets: 4, defaultReps: 15, isBodyweight: true },
      { name: 'Bodyweight Squats', targetMuscle: 'Quadriceps', defaultSets: 4, defaultReps: 20, isBodyweight: true },
      { name: 'Glute Bridges', targetMuscle: 'Glutes', defaultSets: 3, defaultReps: 15, isBodyweight: true },
      { name: 'Bird Dogs', targetMuscle: 'Lower Back / Core', defaultSets: 3, defaultReps: 10, isBodyweight: true }
    ]
  }
];

export const COMMON_EXERCISES = [
  { name: 'Barbell Back Squat', targetMuscle: 'Quadriceps / Glutes', isBodyweight: false },
  { name: 'Barbell Deadlift', targetMuscle: 'Posterior Chain', isBodyweight: false },
  { name: 'Romanian Deadlift', targetMuscle: 'Hamstrings / Glutes', isBodyweight: false },
  { name: 'Flat Barbell Bench Press', targetMuscle: 'Chest', isBodyweight: false },
  { name: 'Incline Dumbbell Press', targetMuscle: 'Upper Chest', isBodyweight: false },
  { name: 'Overhead Shoulder Press', targetMuscle: 'Shoulders', isBodyweight: false },
  { name: 'Pull-up', targetMuscle: 'Lats / Biceps', isBodyweight: true },
  { name: 'Chin-up', targetMuscle: 'Biceps / Lats', isBodyweight: true },
  { name: 'Push-up', targetMuscle: 'Chest / Core', isBodyweight: true },
  { name: 'Barbell Bent Over Row', targetMuscle: 'Back', isBodyweight: false },
  { name: 'Dumbbell Row', targetMuscle: 'Lats', isBodyweight: false },
  { name: 'Lateral Raise', targetMuscle: 'Lateral Deltoids', isBodyweight: false },
  { name: 'Dumbbell Bicep Curl', targetMuscle: 'Biceps', isBodyweight: false },
  { name: 'Tricep Rope Pushdown', targetMuscle: 'Triceps', isBodyweight: false },
  { name: 'Walking Lunge', targetMuscle: 'Quads / Glutes', isBodyweight: false },
  { name: 'Bulgarian Split Squat', targetMuscle: 'Quadriceps', isBodyweight: false },
  { name: 'Plank Hold', targetMuscle: 'Core', isBodyweight: true },
  { name: 'Hanging Leg Raise', targetMuscle: 'Abdominals', isBodyweight: true },
  { name: 'Face Pulls', targetMuscle: 'Rear Delts / Rotator Cuff', isBodyweight: false },
  { name: 'Calf Raises', targetMuscle: 'Calves', isBodyweight: false }
];

/**
 * Initializes Database with seed habits and routines if empty
 */
export async function initializeDatabase(): Promise<InitialSeedResult> {
  const existingHabits = await getAllFromStore<Habit>('habits');
  if (existingHabits.length === 0) {
    for (const h of DEFAULT_INITIAL_HABITS) {
      await putInStore('habits', h);
    }
    for (const r of DEFAULT_ROUTINES) {
      await putInStore('routines', r);
    }
    return { isFirstLaunch: true };
  }
  return { isFirstLaunch: false };
}

/**
 * Export full database to JSON
 */
export async function exportAllData(settings: unknown): Promise<string> {
  const habits = await getAllFromStore('habits');
  const habitLogs = await getAllFromStore('habit_logs');
  const workouts = await getAllFromStore('workouts');
  const routines = await getAllFromStore('routines');
  const bodyLogs = await getAllFromStore('body_logs');
  const waterLogs = await getAllFromStore('water_logs');
  const sleepLogs = await getAllFromStore('sleep_logs');
  const nutritionLogs = await getAllFromStore('nutrition_logs');
  const digitalLogs = await getAllFromStore('digital_logs');
  const commitments = await getAllFromStore('commitments');
  const focusSessions = await getAllFromStore('focus_sessions');

  const payload = {
    appName: 'Consistency OS',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    habits,
    habitLogs,
    workouts,
    routines,
    bodyLogs,
    waterLogs,
    sleepLogs,
    nutritionLogs,
    digitalLogs,
    commitments,
    focusSessions
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Restore data from sanitized import payload
 */
export async function importData(sanitizedPayload: Record<string, unknown>): Promise<void> {
  const db = await openDB();

  // Clear relevant stores and populate
  const storesToPopulate: Array<{ key: string; store: string }> = [
    { key: 'habits', store: 'habits' },
    { key: 'habitLogs', store: 'habit_logs' },
    { key: 'workouts', store: 'workouts' },
    { key: 'routines', store: 'routines' },
    { key: 'bodyLogs', store: 'body_logs' },
    { key: 'waterLogs', store: 'water_logs' },
    { key: 'sleepLogs', store: 'sleep_logs' },
    { key: 'nutritionLogs', store: 'nutrition_logs' },
    { key: 'digitalLogs', store: 'digital_logs' },
    { key: 'commitments', store: 'commitments' },
    { key: 'focusSessions', store: 'focus_sessions' }
  ];

  for (const item of storesToPopulate) {
    const list = sanitizedPayload[item.key];
    if (Array.isArray(list)) {
      // Clear store first to avoid duplicate conflicts
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(item.store, 'readwrite');
        const s = tx.objectStore(item.store);
        const req = s.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Put records
      for (const rec of list) {
        await putInStore(item.store, rec);
      }
    }
  }
}

/**
 * Clear all data from all object stores
 */
export async function clearAllLocalData(): Promise<void> {
  const db = await openDB();
  const storeNames = [
    'habits',
    'habit_logs',
    'workouts',
    'routines',
    'body_logs',
    'water_logs',
    'sleep_logs',
    'nutrition_logs',
    'digital_logs',
    'commitments',
    'focus_sessions'
  ];

  for (const name of storeNames) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(name, 'readwrite');
      const store = tx.objectStore(name);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Restore seed habits so user is ready to go or start fresh
  for (const h of DEFAULT_INITIAL_HABITS) {
    await putInStore('habits', h);
  }
  for (const r of DEFAULT_ROUTINES) {
    await putInStore('routines', r);
  }
}
