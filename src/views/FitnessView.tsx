import React, { useState } from 'react';
import {
  Workout,
  WorkoutRoutine,
  ExerciseLog,
  ExerciseSet,
  UserSettings
} from '../types';
import { COMMON_EXERCISES } from '../utils/db';
import {
  Plus,
  Play,
  Check,
  Trash2,
  Copy,
  Edit2,
  Timer,
  Dumbbell,
  Calendar,
  Trophy,
  History,
  Info,
  ChevronDown,
  ChevronUp,
  Footprints
} from 'lucide-react';

interface FitnessViewProps {
  todayStr: string;
  workouts: Workout[];
  routines: WorkoutRoutine[];
  settings: UserSettings;
  currentSteps: number;
  targetSteps: number;
  lastStepSyncSource?: string;
  onOpenStepsModal: () => void;
  onSaveWorkout: (workout: Workout) => Promise<void>;
  onSaveRoutine: (routine: WorkoutRoutine) => Promise<void>;
  onDeleteRoutine: (routineId: string) => Promise<void>;
  onDeleteWorkout: (workoutId: string) => Promise<void>;
  onOpenRestTimer: () => void;
}

export const FitnessView: React.FC<FitnessViewProps> = ({
  todayStr,
  workouts,
  routines,
  settings,
  currentSteps,
  targetSteps,
  lastStepSyncSource,
  onOpenStepsModal,
  onSaveWorkout,
  onSaveRoutine,
  onDeleteRoutine,
  onDeleteWorkout,
  onOpenRestTimer
}) => {
  const [activeTab, setActiveTab] = useState<'log' | 'routines' | 'history' | 'prs'>('log');

  // Active workout in-progress state
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(routines[0]?.id || '');
  const [workoutRoutineName, setWorkoutRoutineName] = useState<string>('');
  const [workoutCategory, setWorkoutCategory] = useState<'strength' | 'cardio' | 'mobility' | 'recovery'>('strength');
  const [workoutDuration, setWorkoutDuration] = useState<number>(45);
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [activeExercises, setActiveExercises] = useState<ExerciseLog[]>([]);
  const [isLoggingActive, setIsLoggingActive] = useState<boolean>(false);

  // Routine editing modal state
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);

  // Exercise picker modal state
  const [showExercisePicker, setShowExercisePicker] = useState<boolean>(false);

  // Start workout from routine
  const startWorkoutFromRoutine = (routine: WorkoutRoutine) => {
    setSelectedRoutineId(routine.id);
    setWorkoutRoutineName(routine.name);
    const exercises: ExerciseLog[] = routine.exercises.map(ex => ({
      id: 'ex_' + Math.random().toString(36).substr(2, 9),
      exerciseName: ex.name,
      targetMuscle: ex.targetMuscle,
      isBodyweight: ex.isBodyweight,
      sets: Array.from({ length: ex.defaultSets }, (_, i) => ({
        id: 'set_' + Math.random().toString(36).substr(2, 9),
        setNumber: i + 1,
        reps: ex.defaultReps || 10,
        weight: ex.defaultWeight || 0,
        completed: false
      }))
    }));
    setActiveExercises(exercises);
    setIsLoggingActive(true);
    setActiveTab('log');
  };

  const startBlankWorkout = () => {
    setSelectedRoutineId('');
    setWorkoutRoutineName('Custom Strength Session');
    setActiveExercises([]);
    setIsLoggingActive(true);
    setActiveTab('log');
  };

  const addExerciseToActive = (name: string, targetMuscle: string, isBodyweight: boolean) => {
    const newEx: ExerciseLog = {
      id: 'ex_' + Math.random().toString(36).substr(2, 9),
      exerciseName: name,
      targetMuscle,
      isBodyweight,
      sets: [
        {
          id: 'set_' + Math.random().toString(36).substr(2, 9),
          setNumber: 1,
          reps: 10,
          weight: isBodyweight ? 0 : 20,
          completed: false
        }
      ]
    };
    setActiveExercises(prev => [...prev, newEx]);
    setShowExercisePicker(false);
  };

  const addSetToExercise = (exerciseId: string) => {
    setActiveExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSet = {
          id: 'set_' + Math.random().toString(36).substr(2, 9),
          setNumber: ex.sets.length + 1,
          reps: lastSet?.reps || 10,
          weight: lastSet?.weight || 0,
          completed: false
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  };

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
    setActiveExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const filtered = ex.sets.filter(s => s.id !== setId);
        return {
          ...ex,
          sets: filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }))
        };
      })
    );
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: 'reps' | 'weight' | 'completed',
    value: number | boolean
  ) => {
    setActiveExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map(s => (s.id === setId ? { ...s, [field]: value } : s))
        };
      })
    );
  };

  const removeExerciseFromActive = (exerciseId: string) => {
    setActiveExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const handleFinishWorkout = async () => {
    if (activeExercises.length === 0) {
      alert('Please add at least one exercise before saving.');
      return;
    }

    const newWorkout: Workout = {
      id: 'w_' + Date.now(),
      date: todayStr,
      routineName: workoutRoutineName || 'Workout Session',
      category: workoutCategory,
      durationMinutes: workoutDuration,
      exercises: activeExercises,
      notes: workoutNotes
    };

    await onSaveWorkout(newWorkout);
    setIsLoggingActive(false);
    setActiveExercises([]);
    setWorkoutNotes('');
    setActiveTab('history');
  };

  // Calculate Personal Records from workout history
  const calculatePersonalRecords = () => {
    const prMap = new Map<string, { maxWeight: number; maxRepsAtMaxWeight: number; date: string }>();

    workouts.forEach(w => {
      w.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          if (s.completed && s.weight && s.weight > 0) {
            const current = prMap.get(ex.exerciseName);
            if (!current || s.weight > current.maxWeight) {
              prMap.set(ex.exerciseName, {
                maxWeight: s.weight,
                maxRepsAtMaxWeight: s.reps || 1,
                date: w.date
              });
            }
          }
        });
      });
    });

    return Array.from(prMap.entries()).map(([exerciseName, data]) => ({
      exerciseName,
      ...data
    }));
  };

  const personalRecords = calculatePersonalRecords();

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header & Rest Timer CTA */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Fitness & Training</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Progressive resistance & bodyweight discipline
          </p>
        </div>
        <button
          onClick={onOpenRestTimer}
          aria-label="Rest Timer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-zinc-700 bg-zinc-900 text-xs font-medium text-emerald-400 hover:bg-zinc-800 transition shadow-sm"
        >
          <Timer className="w-4 h-4" />
          <span>Rest Timer</span>
        </button>
      </div>

      {/* Apple Fitness Daily Steps Summary Banner */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
            <Footprints className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400">Apple Fitness Steps</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono truncate">
                {lastStepSyncSource || 'Local'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold font-mono text-white tabular-nums">
                {currentSteps.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                / {targetSteps.toLocaleString()} steps
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenStepsModal}
          className="px-3.5 py-2 rounded-xl border border-emerald-700/70 bg-emerald-950/50 hover:bg-emerald-900/60 text-xs font-semibold text-emerald-300 transition shrink-0 active:scale-95"
        >
          Sync Steps
        </button>
      </div>

      {/* Segmented Control */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-medium">
        <button
          onClick={() => setActiveTab('log')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'log'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {isLoggingActive ? 'Active' : 'Start'}
        </button>
        <button
          onClick={() => setActiveTab('routines')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'routines'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Routines
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'history'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('prs')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'prs'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Records
        </button>
      </div>

      {/* 1. LOG WORKOUT TAB */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          {!isLoggingActive ? (
            /* Workout Launcher */
            <div className="space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Start Today's Session</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Select a scheduled routine or start a custom blank session
                  </p>
                </div>

                <div className="space-y-2">
                  {routines.map(routine => (
                    <div
                      key={routine.id}
                      className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950/60 flex items-center justify-between hover:border-zinc-700 transition"
                    >
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{routine.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {routine.exercises.length} exercises · {routine.exercises.map(e => e.name).slice(0, 2).join(', ')}...
                        </p>
                      </div>
                      <button
                        onClick={() => startWorkoutFromRoutine(routine)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white active:scale-95 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start</span>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={startBlankWorkout}
                  className="w-full py-3 rounded-2xl border border-dashed border-zinc-700 hover:border-emerald-500 text-xs font-medium text-zinc-300 hover:text-emerald-400 transition text-center"
                >
                  + Start Blank Custom Workout
                </button>
              </div>

              {/* Safety & Progression Notice */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-zinc-400">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Consistency OS focuses on sustainable, injury-free progression. We never prescribe extreme volume or automatically bump weights without your deliberate confirmation.
                </p>
              </div>
            </div>
          ) : (
            /* Active Workout In-Progress Logger */
            <div className="space-y-4">
              <div className="bg-zinc-900/90 border border-emerald-900/50 rounded-3xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <input
                      type="text"
                      value={workoutRoutineName}
                      onChange={e => setWorkoutRoutineName(e.target.value)}
                      placeholder="Workout Name"
                      className="text-lg font-bold text-white bg-transparent border-b border-zinc-700 focus:border-emerald-500 outline-none w-full"
                    />
                    <p className="text-xs text-zinc-400 mt-1">Logging session for {todayStr}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onOpenRestTimer}
                      aria-label="Open Rest Timer"
                      className="h-9 px-3 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-medium text-emerald-400 flex items-center gap-1"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>Timer</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={workoutDuration}
                      onChange={e => setWorkoutDuration(Number(e.target.value))}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Type</label>
                    <select
                      value={workoutCategory}
                      onChange={e => setWorkoutCategory(e.target.value as any)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
                    >
                      <option value="strength">Strength Training</option>
                      <option value="cardio">Cardio / Conditioning</option>
                      <option value="mobility">Mobility / Core</option>
                      <option value="recovery">Active Recovery</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Exercises in Session */}
              <div className="space-y-3">
                {activeExercises.map(exercise => (
                  <div
                    key={exercise.id}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-zinc-100">{exercise.exerciseName}</h3>
                        <p className="text-[11px] text-zinc-400">{exercise.targetMuscle}</p>
                      </div>
                      <button
                        onClick={() => removeExerciseFromActive(exercise.id)}
                        aria-label={`Remove ${exercise.exerciseName}`}
                        className="text-zinc-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sets Table */}
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-12 gap-1 text-[10px] text-zinc-400 px-1 font-mono">
                        <span className="col-span-2">SET</span>
                        <span className="col-span-4">REPS</span>
                        <span className="col-span-4">{exercise.isBodyweight ? 'BODYWEIGHT' : `WEIGHT (${settings.unitSystem === 'metric' ? 'KG' : 'LBS'})`}</span>
                        <span className="col-span-2 text-center">DONE</span>
                      </div>

                      {exercise.sets.map(set => (
                        <div
                          key={set.id}
                          className={`grid grid-cols-12 gap-1 items-center p-1.5 rounded-xl border transition ${
                            set.completed
                              ? 'bg-emerald-950/20 border-emerald-900/40'
                              : 'bg-zinc-950/60 border-zinc-800/80'
                          }`}
                        >
                          <span className="col-span-2 text-xs font-mono font-medium text-zinc-400 px-1">
                            #{set.setNumber}
                          </span>
                          <div className="col-span-4">
                            <input
                              type="number"
                              min="1"
                              value={set.reps || ''}
                              onChange={e => updateSet(exercise.id, set.id, 'reps', Number(e.target.value))}
                              placeholder="Reps"
                              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2 py-1 text-xs font-mono text-center text-zinc-100"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              disabled={exercise.isBodyweight}
                              value={exercise.isBodyweight ? 0 : set.weight ?? ''}
                              onChange={e => updateSet(exercise.id, set.id, 'weight', Number(e.target.value))}
                              placeholder={exercise.isBodyweight ? 'BW' : '0'}
                              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2 py-1 text-xs font-mono text-center text-zinc-100 disabled:opacity-50"
                            />
                          </div>
                          <div className="col-span-2 flex items-center justify-center">
                            <button
                              onClick={() => {
                                updateSet(exercise.id, set.id, 'completed', !set.completed);
                                if (!set.completed) {
                                  // Prompt rest timer on set completion!
                                  onOpenRestTimer();
                                }
                              }}
                              aria-label={`Mark set ${set.setNumber} complete`}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                                set.completed
                                  ? 'bg-emerald-500 text-zinc-950 font-bold'
                                  : 'border border-zinc-700 text-zinc-400 hover:border-emerald-500'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Set button */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => addSetToExercise(exercise.id)}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Set</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Exercise & Finish Controls */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setShowExercisePicker(true)}
                  className="w-full py-3 rounded-2xl border border-zinc-700 bg-zinc-900 font-semibold text-xs text-zinc-200 hover:bg-zinc-800 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Add Exercise</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (confirm('Discard this workout in progress?')) {
                        setIsLoggingActive(false);
                        setActiveExercises([]);
                      }
                    }}
                    className="py-3 px-4 rounded-2xl border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinishWorkout}
                    className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/40 active:scale-98 transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Complete & Save Workout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. ROUTINES TAB */}
      {activeTab === 'routines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Saved Workout Routines</h2>
            <button
              onClick={() => {
                setEditingRoutine({
                  id: 'routine_' + Date.now(),
                  name: 'New Custom Routine',
                  targetDays: [1, 3, 5],
                  exercises: [
                    { name: 'Barbell Back Squat', targetMuscle: 'Quadriceps', defaultSets: 3, defaultReps: 8, defaultWeight: 60, isBodyweight: false }
                  ]
                });
              }}
              className="text-xs text-emerald-400 font-medium hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Routine</span>
            </button>
          </div>

          <div className="space-y-3">
            {routines.map(routine => (
              <div
                key={routine.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-base text-zinc-100">{routine.name}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Target Days:{' '}
                      {routine.targetDays.length === 0
                        ? 'Flexible'
                        : routine.targetDays
                            .map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
                            .join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingRoutine(routine)}
                      aria-label="Edit routine"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const duplicate: WorkoutRoutine = {
                          ...routine,
                          id: 'routine_' + Date.now(),
                          name: `${routine.name} (Copy)`
                        };
                        onSaveRoutine(duplicate);
                      }}
                      aria-label="Duplicate routine"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {routines.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete routine "${routine.name}"?`)) {
                            onDeleteRoutine(routine.id);
                          }
                        }}
                        aria-label="Delete routine"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-950/60 rounded-2xl p-3 border border-zinc-800/80 space-y-1.5">
                  <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    {routine.exercises.length} Exercises Included:
                  </p>
                  {routine.exercises.map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-zinc-300">
                      <span>{ex.name}</span>
                      <span className="font-mono text-zinc-400">
                        {ex.defaultSets} × {ex.defaultReps || 10} {ex.isBodyweight ? 'BW' : `${ex.defaultWeight || 0}${settings.unitSystem === 'metric' ? 'kg' : 'lbs'}`}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => startWorkoutFromRoutine(routine)}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
                >
                  Start This Routine
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. WORKOUT HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white">Completed Workout Log</h2>

          {workouts.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
              <History className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-300">No workouts recorded yet.</p>
              <p className="text-xs text-zinc-500 mt-1">Start a workout in the Start tab to build your log.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...workouts]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(workout => (
                  <div
                    key={workout.id}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] text-emerald-400 font-mono">
                          {workout.date}
                        </span>
                        <h3 className="font-semibold text-base text-white mt-0.5">
                          {workout.routineName}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          {workout.durationMinutes} minutes · {workout.exercises.length} exercises
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Delete this workout log?')) {
                            onDeleteWorkout(workout.id);
                          }
                        }}
                        aria-label="Delete workout record"
                        className="p-1.5 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                      {workout.exercises.map((ex, i) => (
                        <div key={i} className="text-xs bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/60">
                          <p className="font-medium text-zinc-200">{ex.exerciseName}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[11px] text-zinc-400">
                            {ex.sets.map((s, si) => (
                              <span key={si} className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                {s.reps}r @ {ex.isBodyweight ? 'BW' : `${s.weight}${settings.unitSystem === 'metric' ? 'kg' : 'lbs'}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {workout.notes && (
                      <p className="text-xs text-zinc-400 italic pt-1">
                        "{workout.notes}"
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 4. PERSONAL RECORDS TAB */}
      {activeTab === 'prs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Personal Records & Strength Progression</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Calculated strictly from your completed workout logs</p>
            </div>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>

          {personalRecords.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
              <Trophy className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-300">No records yet.</p>
              <p className="text-xs text-zinc-500 mt-1">
                Log completed workouts with weights to automatically generate your personal bests.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {personalRecords.map((pr, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-100">{pr.exerciseName}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Achieved on {pr.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold font-mono text-emerald-400">
                      {pr.maxWeight} {settings.unitSystem === 'metric' ? 'kg' : 'lbs'}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {pr.maxRepsAtMaxWeight} reps
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add Exercise"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowExercisePicker(false)}
        >
          <div
            className="w-full max-w-sm max-h-[80vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl text-zinc-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-semibold text-sm">Select Exercise</h3>
              <button
                onClick={() => setShowExercisePicker(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto space-y-1.5 my-3 flex-1 no-scrollbar pr-1">
              {COMMON_EXERCISES.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => addExerciseToActive(ex.name, ex.targetMuscle, ex.isBodyweight)}
                  className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800 flex items-center justify-between text-left transition"
                >
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">{ex.name}</p>
                    <p className="text-[10px] text-zinc-400">{ex.targetMuscle}</p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {ex.isBodyweight ? 'Bodyweight' : 'Weights'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Routine Edit Modal */}
      {editingRoutine && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Routine"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setEditingRoutine(null)}
        >
          <form
            onSubmit={async e => {
              e.preventDefault();
              await onSaveRoutine(editingRoutine);
              setEditingRoutine(null);
            }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm max-h-[85vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl text-zinc-100 space-y-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-sm">Edit Routine</h3>
              <button
                type="button"
                onClick={() => setEditingRoutine(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Routine Name</label>
              <input
                type="text"
                value={editingRoutine.name}
                onChange={e => setEditingRoutine({ ...editingRoutine, name: e.target.value })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                required
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Target Days of Week</label>
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, dayIdx) => {
                  const isSelected = editingRoutine.targetDays.includes(dayIdx);
                  return (
                    <button
                      key={dayIdx}
                      type="button"
                      onClick={() => {
                        const newDays = isSelected
                          ? editingRoutine.targetDays.filter(d => d !== dayIdx)
                          : [...editingRoutine.targetDays, dayIdx];
                        setEditingRoutine({ ...editingRoutine, targetDays: newDays });
                      }}
                      className={`py-2 text-xs font-semibold rounded-lg border transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-400'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-500'
                      }`}
                    >
                      {dayChar}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-98 transition mt-3"
            >
              Save Routine
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
