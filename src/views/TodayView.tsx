import React, { useState } from 'react';
import {
  Habit,
  HabitLog,
  Workout,
  DailyWaterLog,
  SleepRecord,
  DigitalSession,
  DailyCommitment,
  UserSettings
} from '../types';
import {
  calculateDailyCompletion,
  calculateSleepDurationMinutes,
  formatMinutes,
  calculateDigitalAllowance
} from '../utils/calculations';
import {
  Check,
  Plus,
  Flame,
  Droplets,
  Moon,
  Footprints,
  PhoneOff,
  Dumbbell,
  ArrowRight,
  Sun,
  Sunset,
  Sparkles,
  Timer
} from 'lucide-react';
import { TabId } from '../components/TabBar';

interface TodayViewProps {
  todayStr: string; // YYYY-MM-DD
  habits: Habit[];
  habitLogs: HabitLog[];
  workouts: Workout[];
  waterLogs: DailyWaterLog[];
  sleepLogs: SleepRecord[];
  digitalSessions: DigitalSession[];
  commitments: DailyCommitment[];
  settings: UserSettings;
  onToggleHabit: (habitId: string, currentStatus: boolean, value?: number) => void;
  onAddWater: (amountMl: number) => void;
  onUpdateSleep: (bedtime: string, wakeTime: string, quality: number) => void;
  onLogSteps: (steps: number, sourceLabel?: string) => void;
  onOpenStepsModal: () => void;
  onNavigateTab: (tab: TabId) => void;
  onOpenRestTimer: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  todayStr,
  habits,
  habitLogs,
  workouts,
  waterLogs,
  sleepLogs,
  digitalSessions,
  commitments,
  settings,
  onToggleHabit,
  onAddWater,
  onUpdateSleep,
  onOpenStepsModal,
  onNavigateTab,
  onOpenRestTimer
}) => {
  const [showSleepModal, setShowSleepModal] = useState(false);

  // Form states for modals
  const todaySleep = sleepLogs.find(s => s.date === todayStr);
  const [bedtimeInput, setBedtimeInput] = useState(todaySleep?.bedtime || '23:00');
  const [waketimeInput, setWaketimeInput] = useState(todaySleep?.wakeTime || '07:00');
  const [qualityInput, setQualityInput] = useState(todaySleep?.quality || 4);

  // Water data
  const todayWater = waterLogs.find(w => w.date === todayStr);
  const currentWaterMl = todayWater?.totalMl || 0;
  const waterPercentage = Math.min(100, Math.round((currentWaterMl / settings.waterTargetMl) * 100));

  // Workout status
  const todayWorkout = workouts.find(w => w.date === todayStr);
  const todayDayOfWeek = new Date(todayStr + 'T12:00:00').getDay();
  // Check if today is a scheduled training day or rest day based on routines
  const isWorkoutScheduled = habits.some(h => h.id === 'habit_workout' && h.scheduleDays.includes(todayDayOfWeek));

  // Daily Completion calculation
  const completionData = calculateDailyCompletion(todayStr, habits, habitLogs);
  const scheduledHabits = completionData.scheduledHabits;

  // Digital discipline allowance calculation
  const digitalAdherence = calculateDigitalAllowance(settings.appLimits, digitalSessions, todayStr);
  const todayCommitment = commitments.find(c => c.date === todayStr);

  // Find step log from habits if steps habit exists
  const stepHabit = habits.find(
    h => h.id === 'habit_walk' || h.name.toLowerCase().includes('step') || h.unit === 'steps'
  );
  const stepLog = stepHabit ? habitLogs.find(l => l.date === todayStr && l.habitId === stepHabit.id) : null;
  const currentSteps = stepLog?.value || 0;
  const targetSteps = stepHabit?.targetValue || 8000;
  const stepPercentage = Math.min(100, Math.round((currentSteps / targetSteps) * 100));
  const stepSourceLabel = stepLog?.notes || 'Apple Fitness';

  // Date formatting
  const dateObj = new Date(todayStr + 'T12:00:00');
  const formattedFullDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Group scheduled habits by routine
  const morningHabits = scheduledHabits.filter(h => h.routine === 'morning');
  const eveningHabits = scheduledHabits.filter(h => h.routine === 'evening');
  const anytimeHabits = scheduledHabits.filter(h => h.routine !== 'morning' && h.routine !== 'evening');

  const handleSaveSleep = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSleep(bedtimeInput, waketimeInput, qualityInput);
    setShowSleepModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Greeting */}
      <section className="pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              {formattedFullDate}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
              Consistency OS
            </h1>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition"
          >
            v1.0
          </button>
        </div>

        {/* Daily Focus Card */}
        <div className="mt-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs text-zinc-400">Daily Focus</p>
            <p className="text-sm font-medium text-zinc-200">
              Execute what is scheduled. Protect your attention.
            </p>
          </div>
          <button
            onClick={onOpenRestTimer}
            aria-label="Open Rest Timer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition whitespace-nowrap shrink-0"
          >
            <Timer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Rest Timer</span>
          </button>
        </div>
      </section>

      <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start space-y-6 lg:space-y-0">
        <div className="lg:col-span-5 space-y-3">
          {/* 2. Today's Core Metric Scoreboard */}
          <section className="grid grid-cols-2 gap-3">
        {/* Completion Ring Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Daily Completion</span>
            <span className="font-mono tabular-nums">{completionData.completedCount}/{completionData.totalScheduled}</span>
          </div>

          <div className="my-3 flex items-center gap-3">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" className="stroke-zinc-800" strokeWidth="3" fill="none" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  className="stroke-emerald-500 transition-all duration-500"
                  strokeWidth="3"
                  strokeDasharray="94.2"
                  strokeDashoffset={94.2 - (94.2 * (completionData.percentage / 100))}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span className="absolute font-mono font-bold text-sm text-white">
                {completionData.percentage}%
              </span>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-zinc-300 font-medium">
                {completionData.percentage === 100
                  ? 'All Done!'
                  : `${completionData.totalScheduled - completionData.completedCount} remaining`}
              </p>
              <p className="text-[11px] text-zinc-500">
                Scheduled for today
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('habits')}
            className="flex items-center justify-between text-[11px] font-medium text-emerald-400 hover:text-emerald-300 pt-2 border-t border-zinc-800/80"
          >
            <span>View All Habits</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Workout / Rest Day Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Fitness Status</span>
            <Dumbbell className="w-3.5 h-3.5 text-zinc-400" />
          </div>

          <div className="my-2">
            {todayWorkout ? (
              <div>
                <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Workout Logged</span>
                </p>
                <p className="text-xs text-zinc-300 mt-1 line-clamp-1">
                  {todayWorkout.routineName} ({todayWorkout.durationMinutes}m)
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {todayWorkout.exercises.length} exercises completed
                </p>
              </div>
            ) : isWorkoutScheduled ? (
              <div>
                <p className="text-sm font-semibold text-zinc-100">Training Day</p>
                <p className="text-xs text-zinc-400 mt-1">Ready for your session</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Not logged yet</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-zinc-300">Active Recovery</p>
                <p className="text-xs text-zinc-400 mt-1">Scheduled rest day</p>
                <p className="text-[11px] text-emerald-500 mt-0.5">Rest is part of progress</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('fitness')}
            className="flex items-center justify-between text-[11px] font-medium text-emerald-400 hover:text-emerald-300 pt-2 border-t border-zinc-800/80"
          >
            <span>{todayWorkout ? 'View Workout' : 'Start Workout'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* 3. Water & Sleep Rapid Widgets */}
      <section className="grid grid-cols-2 gap-3">
        {/* Water Intake Widget */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <span>Water</span>
            </span>
            <span className="font-mono tabular-nums text-zinc-300">{currentWaterMl} / {settings.waterTargetMl}ml</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden my-3">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${waterPercentage}%` }}
            />
          </div>

          {/* Quick-add buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAddWater(250)}
              aria-label="Add 250ml water"
              className="flex-1 py-1.5 text-xs rounded-xl border border-zinc-700 bg-zinc-800/80 font-medium text-zinc-200 hover:bg-zinc-700 active:scale-95 transition"
            >
              +250ml
            </button>
            <button
              onClick={() => onAddWater(500)}
              aria-label="Add 500ml water"
              className="flex-1 py-1.5 text-xs rounded-xl border border-zinc-700 bg-zinc-800/80 font-medium text-zinc-200 hover:bg-zinc-700 active:scale-95 transition"
            >
              +500ml
            </button>
          </div>
        </div>

        {/* Sleep Duration Widget */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              <span>Sleep</span>
            </span>
            <button
              onClick={() => setShowSleepModal(true)}
              className="text-[11px] text-emerald-400 font-medium hover:underline"
            >
              {todaySleep ? 'Edit' : 'Log'}
            </button>
          </div>

          <div className="my-2">
            {todaySleep ? (
              <div>
                <p className="text-xl font-bold font-mono tracking-tight text-white tabular-nums">
                  {formatMinutes(todaySleep.durationMinutes)}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                  <span>{todaySleep.bedtime} → {todaySleep.wakeTime}</span>
                  <span>·</span>
                  <span>{'★'.repeat(todaySleep.quality)}</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-zinc-300">No sleep logged</p>
                <p className="text-[11px] text-zinc-500 mt-1">Tap Log to record last night's rest</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowSleepModal(true)}
            className="w-full py-1.5 text-xs rounded-xl border border-zinc-700 bg-zinc-800/80 font-medium text-zinc-200 hover:bg-zinc-700 active:scale-95 transition text-center"
          >
            {todaySleep ? 'Update Sleep' : 'Log Sleep'}
          </button>
        </div>
      </section>

      {/* 4. Movement / Steps & Digital Discipline Budget Strip */}
      <section className="grid grid-cols-2 gap-3">
        {/* Steps / Movement (Apple Fitness Sync) */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Footprints className="w-3.5 h-3.5 text-emerald-400" />
              <span>Daily Steps</span>
            </span>
            <button
              onClick={onOpenStepsModal}
              className="text-[11px] text-emerald-400 font-medium hover:underline"
            >
              Sync
            </button>
          </div>

          <div className="my-2">
            <div className="flex items-baseline justify-between gap-1">
              <p className="text-xl font-bold font-mono text-white tabular-nums">
                {currentSteps.toLocaleString()}
              </p>
              <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[90px]">
                {stepSourceLabel}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden my-1.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${stepPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              Target: {targetSteps.toLocaleString()} steps
            </p>
          </div>

          <button
            onClick={onOpenStepsModal}
            className="w-full py-1.5 text-xs rounded-xl border border-zinc-700 bg-zinc-800/80 font-medium text-zinc-200 hover:bg-zinc-700 active:scale-95 transition text-center"
          >
            Apple Fitness Sync
          </button>
        </div>

        {/* Digital Discipline Allowance */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <PhoneOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Screen Time</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">In-App</span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold font-mono text-white tabular-nums">
                {digitalAdherence.totalUsed}m
              </p>
              <span className={`text-[11px] font-mono ${
                digitalAdherence.isOverLimit ? 'text-red-400 font-bold' : 'text-zinc-400'
              }`}>
                {digitalAdherence.totalRemaining}m left
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Budget: {digitalAdherence.totalAllowed}m daily
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('discipline')}
            className="w-full py-1.5 text-xs rounded-xl border border-zinc-700 bg-zinc-800/80 font-medium text-zinc-200 hover:bg-zinc-700 active:scale-95 transition text-center"
          >
            Session Timer
          </button>
        </div>
      </section>
      </div>

      {/* 5. Today's Habit Checklist */}
      <section className="lg:col-span-7 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Today's Habits</h2>
          <span className="text-xs text-zinc-400">
            {completionData.completedCount} of {completionData.totalScheduled} completed
          </span>
        </div>

        {scheduledHabits.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
            <Sparkles className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-300">No habits scheduled for today.</p>
            <p className="text-xs text-zinc-500 mt-1">Enjoy your rest day or configure daily schedules in Habits.</p>
            <button
              onClick={() => onNavigateTab('habits')}
              className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
            >
              Open Habits
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Morning Routine */}
            {morningHabits.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400/90 px-1">
                  <Sun className="w-3.5 h-3.5" />
                  <span>Morning Routine</span>
                </div>
                <div className="space-y-2">
                  {morningHabits.map(habit => renderHabitRow(habit))}
                </div>
              </div>
            )}

            {/* Anytime Habits */}
            {anytimeHabits.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 px-1">
                  <span>Daytime & Anytime</span>
                </div>
                <div className="space-y-2">
                  {anytimeHabits.map(habit => renderHabitRow(habit))}
                </div>
              </div>
            )}

            {/* Evening Routine */}
            {eveningHabits.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-purple-400/90 px-1">
                  <Sunset className="w-3.5 h-3.5" />
                  <span>Evening Routine</span>
                </div>
                <div className="space-y-2">
                  {eveningHabits.map(habit => renderHabitRow(habit))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      </div>

      {/* Sleep Modal */}
      {showSleepModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log Sleep Record"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowSleepModal(false)}
        >
          <form
            onSubmit={handleSaveSleep}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-zinc-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-sm">Log Sleep & Recovery</h3>
              <button
                type="button"
                onClick={() => setShowSleepModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Bedtime</label>
                <input
                  type="time"
                  value={bedtimeInput}
                  onChange={e => setBedtimeInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Wake Time</label>
                <input
                  type="time"
                  value={waketimeInput}
                  onChange={e => setWaketimeInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 font-mono"
                  required
                />
              </div>
            </div>

            {/* Calculated duration display */}
            <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 text-xs flex items-center justify-between">
              <span className="text-zinc-400">Total Duration:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {formatMinutes(calculateSleepDurationMinutes(bedtimeInput, waketimeInput))}
              </span>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Perceived Quality (1-5)</label>
              <div className="flex items-center justify-between gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setQualityInput(star)}
                    className={`flex-1 py-2 text-xs rounded-xl font-medium border transition ${
                      qualityInput >= star
                        ? 'border-purple-500 bg-purple-950/40 text-purple-300'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-500'
                    }`}
                  >
                    ★ {star}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-98 transition mt-2 shadow-lg shadow-emerald-950/30"
            >
              Save Sleep Entry
            </button>
          </form>
        </div>
      )}
    </div>
  );

  function renderHabitRow(habit: Habit) {
    const log = habitLogs.find(l => l.date === todayStr && l.habitId === habit.id);
    const isCompleted = !!log?.completed;

    return (
      <div
        key={habit.id}
        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
          isCompleted
            ? 'bg-zinc-900/40 border-emerald-900/40'
            : 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onToggleHabit(habit.id, isCompleted)}
            aria-label={`Toggle habit ${habit.name}`}
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
              isCompleted
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'border-2 border-zinc-700 hover:border-emerald-500'
            }`}
          >
            {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
          </button>
          <div className="min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-100'
              }`}
            >
              {habit.name}
            </p>
            {habit.targetType === 'numeric' && habit.targetValue && (
              <p className="text-[11px] text-zinc-400">
                Target: {habit.targetValue} {habit.unit}
              </p>
            )}
            {habit.targetType === 'duration' && habit.targetValue && (
              <p className="text-[11px] text-zinc-400">
                Duration: {habit.targetValue} {habit.unit || 'min'}
              </p>
            )}
          </div>
        </div>

        {/* Numeric quick adjust if numeric habit */}
        {habit.targetType === 'numeric' && (
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-xs font-mono text-zinc-400 tabular-nums">
              {log?.value || 0}/{habit.targetValue}
            </span>
            <button
              onClick={() => onToggleHabit(habit.id, true, (log?.value || 0) + (habit.unit === 'ml' ? 250 : 1))}
              aria-label={`Increment ${habit.name}`}
              className="w-7 h-7 rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }
};
