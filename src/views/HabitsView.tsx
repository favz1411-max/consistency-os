import React, { useState } from 'react';
import { Habit, HabitLog, HabitCategory, TargetType } from '../types';
import { calculateHabitStreak, getOffsetDateString } from '../utils/calculations';
import {
  Plus,
  Check,
  Flame,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Calendar,
  Sun,
  Sunset,
  Clock,
  Sparkles,
  X
} from 'lucide-react';

interface HabitsViewProps {
  todayStr: string;
  habits: Habit[];
  habitLogs: HabitLog[];
  onToggleHabit: (habitId: string, currentStatus: boolean, value?: number) => void;
  onSaveHabit: (habit: Habit) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onReorderHabits: (reorderedHabits: Habit[]) => Promise<void>;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  todayStr,
  habits,
  habitLogs,
  onToggleHabit,
  onSaveHabit,
  onDeleteHabit,
  onReorderHabits
}) => {
  const [filterRoutine, setFilterRoutine] = useState<'all' | 'morning' | 'anytime' | 'evening'>('all');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<HabitCategory>('health');
  const [targetTypeInput, setTargetTypeInput] = useState<TargetType>('boolean');
  const [targetValInput, setTargetValInput] = useState<number>(1);
  const [unitInput, setUnitInput] = useState('');
  const [scheduleDaysInput, setScheduleDaysInput] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [routineInput, setRoutineInput] = useState<'morning' | 'evening' | 'anytime'>('anytime');

  // Past 7 days array for weekly grid
  const past7Days = Array.from({ length: 7 }, (_, i) => getOffsetDateString(todayStr, -(6 - i)));

  const openCreateModal = () => {
    setNameInput('');
    setCategoryInput('health');
    setTargetTypeInput('boolean');
    setTargetValInput(1);
    setUnitInput('');
    setScheduleDaysInput([0, 1, 2, 3, 4, 5, 6]);
    setRoutineInput('anytime');
    setIsCreatingNew(true);
    setEditingHabit(null);
  };

  const openEditModal = (habit: Habit) => {
    setNameInput(habit.name);
    setCategoryInput(habit.category);
    setTargetTypeInput(habit.targetType);
    setTargetValInput(habit.targetValue || 1);
    setUnitInput(habit.unit || '');
    setScheduleDaysInput([...habit.scheduleDays]);
    setRoutineInput(habit.routine || 'anytime');
    setEditingHabit(habit);
    setIsCreatingNew(false);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    if (editingHabit) {
      const updated: Habit = {
        ...editingHabit,
        name: nameInput.trim(),
        category: categoryInput,
        targetType: targetTypeInput,
        targetValue: targetTypeInput !== 'boolean' ? targetValInput : undefined,
        unit: targetTypeInput !== 'boolean' ? unitInput.trim() : undefined,
        scheduleDays: scheduleDaysInput,
        routine: routineInput
      };
      await onSaveHabit(updated);
    } else {
      const newHabit: Habit = {
        id: 'habit_' + Date.now(),
        name: nameInput.trim(),
        category: categoryInput,
        targetType: targetTypeInput,
        targetValue: targetTypeInput !== 'boolean' ? targetValInput : undefined,
        unit: targetTypeInput !== 'boolean' ? unitInput.trim() : undefined,
        scheduleDays: scheduleDaysInput,
        routine: routineInput,
        order: habits.length + 1,
        createdAt: new Date().toISOString()
      };
      await onSaveHabit(newHabit);
    }

    setEditingHabit(null);
    setIsCreatingNew(false);
  };

  const moveHabit = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= habits.length) return;

    const copy = [...habits];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    // Update order indices
    const updated = copy.map((h, i) => ({ ...h, order: i + 1 }));
    onReorderHabits(updated);
  };

  const filteredHabits = habits.filter(h => {
    if (filterRoutine === 'all') return true;
    return h.routine === filterRoutine;
  });

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Habit Architecture</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Daily systems, streaks, and routines
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white active:scale-95 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Routine Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-medium">
        {[
          { id: 'all', label: 'All Habits' },
          { id: 'morning', label: 'Morning' },
          { id: 'anytime', label: 'Daytime' },
          { id: 'evening', label: 'Evening' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterRoutine(tab.id as any)}
            className={`py-2 rounded-xl transition ${
              filterRoutine === tab.id
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {filteredHabits.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
            <Sparkles className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-300">No habits in this routine.</p>
            <p className="text-xs text-zinc-500 mt-1">Tap New Habit to create a custom habit or routine.</p>
          </div>
        ) : (
          filteredHabits.map((habit, index) => {
            const streakData = calculateHabitStreak(habit, habitLogs, todayStr);
            const todayLog = habitLogs.find(l => l.date === todayStr && l.habitId === habit.id);
            const isCompletedToday = !!todayLog?.completed;

            return (
              <div
                key={habit.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 space-y-3"
              >
                {/* Header row: Checkbox, Name, Category & Action buttons */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => onToggleHabit(habit.id, isCompletedToday)}
                      aria-label={`Toggle ${habit.name}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isCompletedToday
                          ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                          : 'border-2 border-zinc-700 hover:border-emerald-500'
                      }`}
                    >
                      {isCompletedToday && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                    <div className="min-w-0">
                      <h3
                        className={`text-sm font-semibold truncate ${
                          isCompletedToday ? 'text-zinc-400 line-through' : 'text-zinc-100'
                        }`}
                      >
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <span className="capitalize">{habit.category}</span>
                        <span>·</span>
                        <span className="capitalize">{habit.routine}</span>
                        {habit.targetType !== 'boolean' && habit.targetValue && (
                          <>
                            <span>·</span>
                            <span>Target: {habit.targetValue} {habit.unit}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit, Move, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveHabit(index, 'up')}
                      disabled={index === 0}
                      aria-label="Move habit up"
                      className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-20"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveHabit(index, 'down')}
                      disabled={index === habits.length - 1}
                      aria-label="Move habit down"
                      className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-20"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(habit)}
                      aria-label="Edit habit"
                      className="p-1 text-zinc-400 hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete habit "${habit.name}"?`)) {
                          onDeleteHabit(habit.id);
                        }
                      }}
                      aria-label="Delete habit"
                      className="p-1 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Consistency Grid & Streaks */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  {/* Past 7 Days Mini Tracker */}
                  <div className="flex items-center gap-1.5">
                    {past7Days.map(date => {
                      const dObj = new Date(date + 'T12:00:00');
                      const dayOfWeek = dObj.getDay();
                      const isScheduled = habit.scheduleDays.includes(dayOfWeek);
                      const isDone = habitLogs.some(
                        l => l.date === date && l.habitId === habit.id && l.completed
                      );
                      const dayChar = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayOfWeek];

                      return (
                        <div key={date} className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-mono text-zinc-400">{dayChar}</span>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] transition ${
                              isDone
                                ? 'bg-emerald-500 text-zinc-950 font-bold'
                                : isScheduled
                                ? 'border border-zinc-700 bg-zinc-950 text-zinc-400'
                                : 'bg-zinc-800/30 text-zinc-500 opacity-40'
                            }`}
                          >
                            {isDone ? '✓' : isScheduled ? '·' : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Streaks */}
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-[10px] text-zinc-400">Current</p>
                      <p className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5 justify-end">
                        <Flame className="w-3 h-3 fill-current" />
                        <span>{streakData.currentStreak}d</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400">Best</p>
                      <p className="text-xs font-mono font-medium text-zinc-300">
                        {streakData.bestStreak}d
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Habit Modal */}
      {(isCreatingNew || editingHabit) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingHabit ? 'Edit Habit' : 'Create Habit'}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => {
            setIsCreatingNew(false);
            setEditingHabit(null);
          }}
        >
          <form
            onSubmit={handleSaveForm}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm max-h-[85vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl text-zinc-100 space-y-3.5 overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-sm">
                {editingHabit ? 'Edit Habit' : 'Create New Habit'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingHabit(null);
                }}
                className="text-xs text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Habit Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="e.g. Read 20 pages"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Category</label>
                <select
                  value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
                >
                  <option value="health">Health</option>
                  <option value="fitness">Fitness</option>
                  <option value="mind">Mind</option>
                  <option value="discipline">Discipline</option>
                  <option value="routine">Routine</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Routine</label>
                <select
                  value={routineInput}
                  onChange={e => setRoutineInput(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
                >
                  <option value="morning">Morning</option>
                  <option value="anytime">Daytime / Anytime</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Target Type</label>
                <select
                  value={targetTypeInput}
                  onChange={e => setTargetTypeInput(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
                >
                  <option value="boolean">Yes / No</option>
                  <option value="numeric">Numeric Goal</option>
                  <option value="duration">Duration (Min)</option>
                </select>
              </div>

              {targetTypeInput !== 'boolean' && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Target Goal</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={targetValInput}
                      onChange={e => setTargetValInput(Number(e.target.value))}
                      className="w-16 rounded-xl border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs font-mono text-zinc-100"
                    />
                    <input
                      type="text"
                      placeholder="unit (e.g. ml, pages)"
                      value={unitInput}
                      onChange={e => setUnitInput(e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-100"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Scheduled Days</label>
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, dayIdx) => {
                  const isSelected = scheduleDaysInput.includes(dayIdx);
                  return (
                    <button
                      key={dayIdx}
                      type="button"
                      onClick={() => {
                        const next = isSelected
                          ? scheduleDaysInput.filter(d => d !== dayIdx)
                          : [...scheduleDaysInput, dayIdx];
                        setScheduleDaysInput(next);
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
              className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-98 transition mt-2 shadow-lg shadow-emerald-950/40"
            >
              {editingHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
