import { Task, TaskCompletion, LegacyHabit, LegacyHabitLog } from '../types';
import { formatLocalDate, migrateLegacyHabitsToTasks } from './calculations';
import {
  getStoredTasksBackup,
  saveStoredTasksBackup,
  getStoredCompletionsBackup,
  saveStoredCompletionsBackup,
  isV2MigrationDone,
  markV2MigrationDone,
  clearPlannerLocalStorage
} from './storage';

const DB_NAME = 'consistency_os_db';
const DB_VERSION = 2;

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

      // Primary v2 stores for the Daily Task Calendar
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('date', 'date', { unique: false });
        taskStore.createIndex('order', 'order', { unique: false });
      }

      if (!db.objectStoreNames.contains('task_completions')) {
        const completionStore = db.createObjectStore('task_completions', { keyPath: 'id' });
        completionStore.createIndex('date', 'date', { unique: false });
        completionStore.createIndex('taskId', 'taskId', { unique: false });
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

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(storeName)) {
    return [];
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

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

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(storeName)) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Default starter tasks for a fresh installation of Consistency OS Planner.
 */
export function createDefaultStarterTasks(todayStr: string): Task[] {
  const nowIso = new Date().toISOString();
  return [
    {
      id: 'task_morning_review',
      title: 'Review priorities for the day',
      time: '08:30',
      category: 'Routine',
      recurrence: 'daily',
      date: todayStr,
      order: 1,
      createdAt: nowIso
    },
    {
      id: 'task_deep_work',
      title: 'Focused work block on primary project',
      time: '10:00',
      category: 'Work',
      recurrence: 'weekdays',
      date: todayStr,
      repeatDays: [1, 2, 3, 4, 5],
      order: 2,
      createdAt: nowIso
    },
    {
      id: 'task_reading',
      title: 'Read for 20 minutes',
      time: '20:30',
      category: 'Personal',
      recurrence: 'daily',
      date: todayStr,
      order: 3,
      createdAt: nowIso
    },
    {
      id: 'task_plan_tomorrow',
      title: 'Clear inbox & prepare tomorrow’s schedule',
      time: '21:30',
      category: 'Routine',
      recurrence: 'daily',
      date: todayStr,
      order: 4,
      createdAt: nowIso
    }
  ];
}

/**
 * Initializes the database, migrating any legacy v1 habits/completions if present,
 * reconciling with localStorage backup, or seeding calm starter tasks on first launch.
 */
export async function initializeDatabase(): Promise<{
  tasks: Task[];
  completions: TaskCompletion[];
}> {
  const todayStr = formatLocalDate(new Date());
  let idbTasks = await getAllFromStore<Task>('tasks');
  let idbCompletions = await getAllFromStore<TaskCompletion>('task_completions');

  const backupTasks = getStoredTasksBackup();
  const backupCompletions = getStoredCompletionsBackup();

  // Reconcile if localStorage has tasks that IndexedDB missed on rapid iOS PWA close
  if (idbTasks.length === 0 && backupTasks.length > 0) {
    for (const t of backupTasks) {
      await putInStore('tasks', t);
    }
    idbTasks = backupTasks;
  }

  if (idbCompletions.length === 0 && backupCompletions.length > 0) {
    for (const c of backupCompletions) {
      await putInStore('task_completions', c);
    }
    idbCompletions = backupCompletions;
  }

  // One-time migration from v1 habits/habit_logs if no v2 tasks exist yet
  if (idbTasks.length === 0 && !isV2MigrationDone()) {
    const legacyHabits = await getAllFromStore<LegacyHabit>('habits');
    const legacyLogs = await getAllFromStore<LegacyHabitLog>('habit_logs');

    if (legacyHabits.length > 0) {
      const migrated = migrateLegacyHabitsToTasks(legacyHabits, legacyLogs, todayStr);
      if (migrated.tasks.length > 0) {
        for (const t of migrated.tasks) {
          await putInStore('tasks', t);
        }
        for (const c of migrated.completions) {
          await putInStore('task_completions', c);
        }
        idbTasks = migrated.tasks;
        idbCompletions = migrated.completions;
      }
    }

    // Seed starter planner tasks if still empty after checking legacy habits
    if (idbTasks.length === 0) {
      const starters = createDefaultStarterTasks(todayStr);
      for (const t of starters) {
        await putInStore('tasks', t);
      }
      idbTasks = starters;
    }

    markV2MigrationDone();
  }

  saveStoredTasksBackup(idbTasks);
  saveStoredCompletionsBackup(idbCompletions);

  return {
    tasks: idbTasks,
    completions: idbCompletions
  };
}

export async function saveTask(task: Task, allTasks: Task[]): Promise<void> {
  saveStoredTasksBackup(allTasks);
  await putInStore('tasks', task);
}

export async function saveTasksBatch(tasks: Task[]): Promise<void> {
  saveStoredTasksBackup(tasks);
  for (const t of tasks) {
    await putInStore('tasks', t);
  }
}

export async function removeTask(taskId: string, remainingTasks: Task[], remainingCompletions: TaskCompletion[]): Promise<void> {
  saveStoredTasksBackup(remainingTasks);
  saveStoredCompletionsBackup(remainingCompletions);
  await deleteFromStore('tasks', taskId);

  const existingCompletions = await getAllFromStore<TaskCompletion>('task_completions');
  for (const c of existingCompletions) {
    if (c.taskId === taskId) {
      await deleteFromStore('task_completions', c.id);
    }
  }
}

export async function saveTaskCompletion(
  completion: TaskCompletion,
  allCompletions: TaskCompletion[]
): Promise<void> {
  saveStoredCompletionsBackup(allCompletions);
  if (completion.completed) {
    await putInStore('task_completions', completion);
  } else {
    await deleteFromStore('task_completions', completion.id);
  }
}

export async function exportAllData(settings: unknown): Promise<string> {
  const tasks = await getAllFromStore<Task>('tasks');
  const taskCompletions = await getAllFromStore<TaskCompletion>('task_completions');

  const payload = {
    appName: 'Consistency OS',
    version: 2,
    exportedAt: new Date().toISOString(),
    settings,
    tasks,
    taskCompletions
  };

  return JSON.stringify(payload, null, 2);
}

export async function importData(sanitizedPayload: {
  tasks: Task[];
  taskCompletions: TaskCompletion[];
}): Promise<void> {
  await clearStore('tasks');
  await clearStore('task_completions');

  for (const t of sanitizedPayload.tasks) {
    await putInStore('tasks', t);
  }
  for (const c of sanitizedPayload.taskCompletions) {
    if (c.completed) {
      await putInStore('task_completions', {
        ...c,
        id: c.id || `${c.date}_${c.taskId}`
      });
    }
  }

  saveStoredTasksBackup(sanitizedPayload.tasks);
  saveStoredCompletionsBackup(sanitizedPayload.taskCompletions);
  markV2MigrationDone();
}

export async function clearAllLocalData(): Promise<{
  tasks: Task[];
  completions: TaskCompletion[];
}> {
  await clearStore('tasks');
  await clearStore('task_completions');
  clearPlannerLocalStorage();

  const todayStr = formatLocalDate(new Date());
  const starters = createDefaultStarterTasks(todayStr);
  for (const t of starters) {
    await putInStore('tasks', t);
  }
  saveStoredTasksBackup(starters);
  saveStoredCompletionsBackup([]);
  markV2MigrationDone();

  return {
    tasks: starters,
    completions: []
  };
}
