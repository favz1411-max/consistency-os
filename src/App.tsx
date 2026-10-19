/**
 * Consistency OS — Personal Fitness & Digital Discipline Operating System
 * Full local-first, zero-runtime-cost, offline-capable PWA architecture.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  FocusSession,
  UserSettings
} from './types';
import {
  openDB,
  initializeDatabase,
  getAllFromStore,
  putInStore,
  deleteFromStore,
  DEFAULT_INITIAL_HABITS,
  DEFAULT_ROUTINES
} from './utils/db';
import { getStoredSettings, saveStoredSettings, DEFAULT_SETTINGS } from './utils/storage';
import { TabBar, TabId } from './components/TabBar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { RestTimerModal } from './components/RestTimerModal';
import { AppleFitnessStepsModal } from './components/AppleFitnessStepsModal';
import { parseStepsFromText } from './utils/calculations';
import { TodayView } from './views/TodayView';
import { FitnessView } from './views/FitnessView';
import { HabitsView } from './views/HabitsView';
import { DisciplineView } from './views/DisciplineView';
import { ProgressView } from './views/ProgressView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isRestTimerOpen, setIsRestTimerOpen] = useState<boolean>(false);
  const [isStepsModalOpen, setIsStepsModalOpen] = useState<boolean>(false);
  const [stepSyncNotice, setStepSyncNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // App State collections
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [bodyLogs, setBodyLogs] = useState<BodyMeasurement[]>([]);
  const [waterLogs, setWaterLogs] = useState<DailyWaterLog[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepRecord[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<DailyNutritionLog[]>([]);
  const [digitalSessions, setDigitalSessions] = useState<DigitalSession[]>([]);
  const [commitments, setCommitments] = useState<DailyCommitment[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);

  // Current local date in YYYY-MM-DD
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateString();

  // Load all data from IndexedDB
  const reloadAllData = useCallback(async () => {
    try {
      await initializeDatabase();
      const loadedHabits = await getAllFromStore<Habit>('habits');
      const loadedHabitLogs = await getAllFromStore<HabitLog>('habit_logs');
      const loadedWorkouts = await getAllFromStore<Workout>('workouts');
      const loadedRoutines = await getAllFromStore<WorkoutRoutine>('routines');
      const loadedBodyLogs = await getAllFromStore<BodyMeasurement>('body_logs');
      const loadedWaterLogs = await getAllFromStore<DailyWaterLog>('water_logs');
      const loadedSleepLogs = await getAllFromStore<SleepRecord>('sleep_logs');
      const loadedNutritionLogs = await getAllFromStore<DailyNutritionLog>('nutrition_logs');
      const loadedDigitalLogs = await getAllFromStore<DigitalSession>('digital_logs');
      const loadedCommitments = await getAllFromStore<DailyCommitment>('commitments');
      const loadedFocusSessions = await getAllFromStore<FocusSession>('focus_sessions');

      setHabits(loadedHabits.sort((a, b) => a.order - b.order));
      setHabitLogs(loadedHabitLogs);
      setWorkouts(loadedWorkouts);
      setRoutines(loadedRoutines);
      setBodyLogs(loadedBodyLogs);
      setWaterLogs(loadedWaterLogs);
      setSleepLogs(loadedSleepLogs);
      setNutritionLogs(loadedNutritionLogs);
      setDigitalSessions(loadedDigitalLogs);
      setCommitments(loadedCommitments);
      setFocusSessions(loadedFocusSessions);
    } catch (e) {
      console.error('Error loading IndexedDB data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial mount
  useEffect(() => {
    const stored = getStoredSettings();
    setSettings(stored);
    reloadAllData();
  }, [reloadAllData]);

  // Ensure a step habit exists and return it
  const ensureStepHabit = useCallback(async (): Promise<Habit> => {
    const existing = habits.find(
      h => h.id === 'habit_walk' || h.name.toLowerCase().includes('step') || h.unit === 'steps'
    );
    if (existing) return existing;

    const fallbackHabit: Habit =
      DEFAULT_INITIAL_HABITS.find(h => h.id === 'habit_walk') || {
        id: 'habit_walk',
        name: 'Walk or move daily (8,000+ steps)',
        category: 'fitness',
        targetType: 'numeric',
        targetValue: 8000,
        unit: 'steps',
        scheduleDays: [0, 1, 2, 3, 4, 5, 6],
        routine: 'anytime',
        order: habits.length + 1,
        createdAt: new Date().toISOString()
      };

    await putInStore('habits', fallbackHabit);
    setHabits(prev => [...prev, fallbackHabit]);
    return fallbackHabit;
  }, [habits]);

  // Steps logging (single day)
  const handleLogSteps = useCallback(
    async (steps: number, sourceLabel = 'Apple Fitness', dateStr = todayStr) => {
      const stepHabit = await ensureStepHabit();
      const logId = `${dateStr}_${stepHabit.id}`;
      const updatedLog: HabitLog & { id: string } = {
        id: logId,
        date: dateStr,
        habitId: stepHabit.id,
        completed: steps >= (stepHabit.targetValue || 8000),
        value: steps,
        notes: sourceLabel,
        updatedAt: new Date().toISOString()
      };
      await putInStore('habit_logs', updatedLog);
      setHabitLogs(prev => {
        const idx = prev.findIndex(l => l.date === dateStr && l.habitId === stepHabit.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updatedLog;
          return copy;
        }
        return [...prev, updatedLog];
      });
    },
    [ensureStepHabit, todayStr]
  );

  // Batch import steps (multi-day from Apple Health XML / CSV / JSON)
  const handleBatchImportSteps = useCallback(
    async (entries: Array<{ date: string; steps: number }>, sourceLabel: string) => {
      const stepHabit = await ensureStepHabit();
      const nowIso = new Date().toISOString();
      for (const entry of entries) {
        const logId = `${entry.date}_${stepHabit.id}`;
        const updatedLog: HabitLog & { id: string } = {
          id: logId,
          date: entry.date,
          habitId: stepHabit.id,
          completed: entry.steps >= (stepHabit.targetValue || 8000),
          value: entry.steps,
          notes: sourceLabel,
          updatedAt: nowIso
        };
        await putInStore('habit_logs', updatedLog);
      }
      const refreshedLogs = await getAllFromStore<HabitLog>('habit_logs');
      setHabitLogs(refreshedLogs);
    },
    [ensureStepHabit]
  );

  // Detect iOS Shortcut URL parameter (?steps=8450&source=apple_fitness) after DB loads
  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;
    const search = window.location.search;
    if (!search || !search.toLowerCase().includes('steps=')) return;

    const extracted = parseStepsFromText(search);
    if (extracted !== null) {
      handleLogSteps(extracted, 'Apple Fitness iOS Shortcut').then(() => {
        setStepSyncNotice(
          `Synced ${extracted.toLocaleString()} steps from Apple Fitness Shortcut!`
        );
      });
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [isLoading, handleLogSteps]);

  // Update Settings handler
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  // Toggle habit completion on a given date (defaults to today)
  const handleToggleHabit = async (habitId: string, currentStatus: boolean, customValue?: number) => {
    const newStatus = !currentStatus;
    const logId = `${todayStr}_${habitId}`;
    const updatedLog: HabitLog & { id: string } = {
      id: logId,
      date: todayStr,
      habitId,
      completed: newStatus,
      value: customValue,
      updatedAt: new Date().toISOString()
    };

    await putInStore('habit_logs', updatedLog);
    setHabitLogs(prev => {
      const idx = prev.findIndex(l => l.date === todayStr && l.habitId === habitId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedLog;
        return copy;
      }
      return [...prev, updatedLog];
    });
  };

  // Save / Update Habit
  const handleSaveHabit = async (habit: Habit) => {
    await putInStore('habits', habit);
    setHabits(prev => {
      const idx = prev.findIndex(h => h.id === habit.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = habit;
        return copy;
      }
      return [...prev, habit];
    });
  };

  // Delete Habit
  const handleDeleteHabit = async (habitId: string) => {
    await deleteFromStore('habits', habitId);
    setHabits(prev => prev.filter(h => h.id !== habitId));
  };

  // Reorder Habits
  const handleReorderHabits = async (reorderedHabits: Habit[]) => {
    setHabits(reorderedHabits);
    for (const h of reorderedHabits) {
      await putInStore('habits', h);
    }
  };

  // Water Intake logging
  const handleAddWater = async (amountMl: number) => {
    const existing = waterLogs.find(w => w.date === todayStr) || {
      date: todayStr,
      totalMl: 0,
      targetMl: settings.waterTargetMl,
      entries: []
    };

    const newEntry = {
      id: 'w_' + Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amountMl
    };

    const updatedLog: DailyWaterLog = {
      ...existing,
      totalMl: existing.totalMl + amountMl,
      entries: [...existing.entries, newEntry]
    };

    await putInStore('water_logs', updatedLog);
    setWaterLogs(prev => {
      const idx = prev.findIndex(w => w.date === todayStr);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedLog;
        return copy;
      }
      return [...prev, updatedLog];
    });
  };

  // Sleep logging
  const handleUpdateSleep = async (bedtime: string, wakeTime: string, quality: number) => {
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    const bTotal = bH * 60 + bM;
    const wTotal = wH * 60 + wM;
    const durationMinutes = wTotal >= bTotal ? wTotal - bTotal : 24 * 60 - bTotal + wTotal;

    const sleepRecord: SleepRecord = {
      id: 'sleep_' + todayStr,
      date: todayStr,
      bedtime,
      wakeTime,
      durationMinutes,
      quality,
      notes: ''
    };

    await putInStore('sleep_logs', sleepRecord);
    setSleepLogs(prev => {
      const idx = prev.findIndex(s => s.date === todayStr);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = sleepRecord;
        return copy;
      }
      return [...prev, sleepRecord];
    });
  };

  // Workout operations
  const handleSaveWorkout = async (workout: Workout) => {
    await putInStore('workouts', workout);
    setWorkouts(prev => [...prev.filter(w => w.id !== workout.id), workout]);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    await deleteFromStore('workouts', workoutId);
    setWorkouts(prev => prev.filter(w => w.id !== workoutId));
  };

  const handleSaveRoutine = async (routine: WorkoutRoutine) => {
    await putInStore('routines', routine);
    setRoutines(prev => [...prev.filter(r => r.id !== routine.id), routine]);
  };

  const handleDeleteRoutine = async (routineId: string) => {
    await deleteFromStore('routines', routineId);
    setRoutines(prev => prev.filter(r => r.id !== routineId));
  };

  // Digital discipline operations
  const handleSaveSession = async (session: DigitalSession) => {
    await putInStore('digital_logs', session);
    setDigitalSessions(prev => [...prev, session]);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteFromStore('digital_logs', sessionId);
    setDigitalSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleSaveCommitment = async (commitment: DailyCommitment) => {
    await putInStore('commitments', commitment);
    setCommitments(prev => {
      const idx = prev.findIndex(c => c.date === commitment.date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = commitment;
        return copy;
      }
      return [...prev, commitment];
    });
  };

  const handleSaveFocusSession = async (session: FocusSession) => {
    await putInStore('focus_sessions', session);
    setFocusSessions(prev => [...prev, session]);
  };

  const handleUpdateAppLimits = async (limits: Record<string, number>) => {
    const updated = { ...settings, appLimits: limits };
    handleUpdateSettings(updated);
  };

  // Body progress operations
  const handleSaveBodyLog = async (record: BodyMeasurement) => {
    await putInStore('body_logs', record);
    setBodyLogs(prev => [...prev.filter(b => b.id !== record.id), record]);
  };

  const handleDeleteBodyLog = async (id: string) => {
    await deleteFromStore('body_logs', id);
    setBodyLogs(prev => prev.filter(b => b.id !== id));
  };

  // Current step data derived from step habit log
  const stepHabit = habits.find(
    h => h.id === 'habit_walk' || h.name.toLowerCase().includes('step') || h.unit === 'steps'
  );
  const todayStepLog = stepHabit
    ? habitLogs.find(l => l.date === todayStr && l.habitId === stepHabit.id)
    : undefined;
  const currentSteps = todayStepLog?.value || 0;
  const targetSteps = stepHabit?.targetValue || 8000;
  const lastStepSyncSource = todayStepLog?.notes;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Apple Fitness Shortcut Deep-Link Sync Banner */}
      {stepSyncNotice && (
        <div className="w-full max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 pt-3">
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-700/80 text-xs text-emerald-200 flex items-center justify-between gap-2">
            <span>{stepSyncNotice}</span>
            <button
              type="button"
              onClick={() => setStepSyncNotice(null)}
              className="text-emerald-400 hover:text-white font-semibold px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main View Container (responsive mobile canvas up to max-w-5xl on desktop) */}
      <main className="flex-1 w-full max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 pt-safe">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-400">Loading Consistency OS...</p>
          </div>
        ) : (
          <>
            {activeTab === 'today' && (
              <TodayView
                todayStr={todayStr}
                habits={habits}
                habitLogs={habitLogs}
                workouts={workouts}
                waterLogs={waterLogs}
                sleepLogs={sleepLogs}
                digitalSessions={digitalSessions}
                commitments={commitments}
                settings={settings}
                onToggleHabit={handleToggleHabit}
                onAddWater={handleAddWater}
                onUpdateSleep={handleUpdateSleep}
                onLogSteps={handleLogSteps}
                onOpenStepsModal={() => setIsStepsModalOpen(true)}
                onNavigateTab={setActiveTab}
                onOpenRestTimer={() => setIsRestTimerOpen(true)}
              />
            )}

            {activeTab === 'fitness' && (
              <FitnessView
                todayStr={todayStr}
                workouts={workouts}
                routines={routines}
                settings={settings}
                currentSteps={currentSteps}
                targetSteps={targetSteps}
                lastStepSyncSource={lastStepSyncSource}
                onOpenStepsModal={() => setIsStepsModalOpen(true)}
                onSaveWorkout={handleSaveWorkout}
                onSaveRoutine={handleSaveRoutine}
                onDeleteRoutine={handleDeleteRoutine}
                onDeleteWorkout={handleDeleteWorkout}
                onOpenRestTimer={() => setIsRestTimerOpen(true)}
              />
            )}

            {activeTab === 'habits' && (
              <HabitsView
                todayStr={todayStr}
                habits={habits}
                habitLogs={habitLogs}
                onToggleHabit={handleToggleHabit}
                onSaveHabit={handleSaveHabit}
                onDeleteHabit={handleDeleteHabit}
                onReorderHabits={handleReorderHabits}
              />
            )}

            {activeTab === 'discipline' && (
              <DisciplineView
                todayStr={todayStr}
                digitalSessions={digitalSessions}
                commitments={commitments}
                focusSessions={focusSessions}
                settings={settings}
                onSaveSession={handleSaveSession}
                onDeleteSession={handleDeleteSession}
                onSaveCommitment={handleSaveCommitment}
                onSaveFocusSession={handleSaveFocusSession}
                onUpdateAppLimits={handleUpdateAppLimits}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressView
                todayStr={todayStr}
                habits={habits}
                habitLogs={habitLogs}
                workouts={workouts}
                bodyLogs={bodyLogs}
                waterLogs={waterLogs}
                sleepLogs={sleepLogs}
                digitalSessions={digitalSessions}
                settings={settings}
                onSaveBodyLog={handleSaveBodyLog}
                onDeleteBodyLog={handleDeleteBodyLog}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onDataReload={reloadAllData}
                onOpenStepsModal={() => setIsStepsModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Global Workout Rest Timer Modal */}
      <RestTimerModal
        isOpen={isRestTimerOpen}
        onClose={() => setIsRestTimerOpen(false)}
        defaultDurationSeconds={settings.restTimerSeconds}
      />

      {/* Global Apple Fitness & Daily Steps Sync Modal */}
      <AppleFitnessStepsModal
        isOpen={isStepsModalOpen}
        onClose={() => setIsStepsModalOpen(false)}
        currentSteps={currentSteps}
        targetSteps={targetSteps}
        lastSyncSource={lastStepSyncSource}
        onSaveSteps={(steps, sourceLabel) => handleLogSteps(steps, sourceLabel)}
        onBatchImportSteps={handleBatchImportSteps}
      />

      {/* Bottom Mobile Tab Bar */}
      <TabBar activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}
