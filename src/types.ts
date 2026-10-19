export type HabitCategory = 'health' | 'fitness' | 'mind' | 'discipline' | 'routine';

export type TargetType = 'boolean' | 'numeric' | 'duration';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  targetType: TargetType;
  targetValue?: number;
  unit?: string;
  scheduleDays: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  routine?: 'morning' | 'evening' | 'anytime';
  order: number;
  iconName?: string;
  createdAt: string;
}

export interface HabitLog {
  date: string; // YYYY-MM-DD
  habitId: string;
  completed: boolean;
  value?: number;
  notes?: string;
  updatedAt: string;
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  durationSeconds?: number;
  completed: boolean;
  rpe?: number;
}

export interface ExerciseLog {
  id: string;
  exerciseName: string;
  targetMuscle: string;
  isBodyweight: boolean;
  sets: ExerciseSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  routineName: string;
  category: 'strength' | 'cardio' | 'mobility' | 'recovery';
  startTime?: string;
  durationMinutes: number;
  exercises: ExerciseLog[];
  notes?: string;
  isRestDay?: boolean;
}

export interface RoutineExerciseTemplate {
  name: string;
  targetMuscle: string;
  defaultSets: number;
  defaultReps?: number;
  defaultWeight?: number;
  isBodyweight: boolean;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  targetDays: number[]; // Days of week
  exercises: RoutineExerciseTemplate[];
}

export interface BodyMeasurement {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // in kg or lbs according to user unit preference
  waist?: number; // in cm or in
  chest?: number;
  arms?: number;
  hips?: number;
  notes?: string;
}

export interface WaterEntry {
  id: string;
  time: string; // HH:MM
  amountMl: number;
}

export interface DailyWaterLog {
  date: string; // YYYY-MM-DD
  totalMl: number;
  targetMl: number;
  entries: WaterEntry[];
}

export interface SleepRecord {
  id: string;
  date: string; // YYYY-MM-DD (date wake up)
  bedtime: string; // HH:MM
  wakeTime: string; // HH:MM
  durationMinutes: number;
  quality: number; // 1 to 5
  isRestDay?: boolean;
  notes?: string;
}

export interface NutritionMeal {
  id: string;
  name: string;
  time: string;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatsGrams?: number;
  notes?: string;
}

export interface DailyNutritionLog {
  date: string; // YYYY-MM-DD
  meals: NutritionMeal[];
  notes?: string;
}

export interface DigitalSession {
  id: string;
  date: string; // YYYY-MM-DD
  app: string;
  durationMinutes: number;
  timestamp: number;
  isFocusSession?: boolean;
}

export interface DailyCommitment {
  date: string; // YYYY-MM-DD
  noScrollCommitted: boolean;
  lockedUntil?: string; // ISO string
  lapseCount: number;
  completed: boolean;
  notes?: string;
}

export interface FocusSession {
  id: string;
  date: string;
  type: 'deep_work' | 'workout' | 'reading' | 'meditation' | 'digital_detox';
  durationMinutes: number;
  completed: boolean;
  timestamp: number;
  notes?: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  unitSystem: 'metric' | 'imperial'; // metric: kg, cm, ml; imperial: lbs, in, fl oz
  waterTargetMl: number;
  sleepTargetMinutes: number;
  startOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  restTimerSeconds: number;
  appLimits: Record<string, number>; // in minutes, e.g. { Instagram: 20, TikTok: 15, YouTube: 30, Reddit: 15, Other: 30 }
  focusPreserveTimer: boolean;
  hapticEnabled: boolean;
  appVersion: string;
}
