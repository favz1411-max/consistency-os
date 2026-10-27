import React, { useState, useEffect } from 'react';
import { Task, RecurrenceType } from '../types';
import { parseLocalDate } from '../utils/calculations';
import { X, Clock, Repeat, Calendar as CalendarIcon, Trash2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  initialDate: string;
  editingTask: Task | null;
  onClose: () => void;
  onSave: (taskData: {
    id?: string;
    title: string;
    time?: string;
    category?: string;
    date: string;
    recurrence: RecurrenceType;
    repeatDays?: number[];
  }) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

const SUGGESTED_CATEGORIES = ['Routine', 'Work', 'Personal', 'Mind', 'Errands'];
const WEEKDAYS = [
  { day: 1, label: 'M', full: 'Monday' },
  { day: 2, label: 'T', full: 'Tuesday' },
  { day: 3, label: 'W', full: 'Wednesday' },
  { day: 4, label: 'T', full: 'Thursday' },
  { day: 5, label: 'F', full: 'Friday' },
  { day: 6, label: 'S', full: 'Saturday' },
  { day: 0, label: 'S', full: 'Sunday' }
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  initialDate,
  editingTask,
  onClose,
  onSave,
  onDelete
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(initialDate);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('once');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (editingTask) {
      setTitle(editingTask.title);
      setTime(editingTask.time || '');
      setCategory(editingTask.category || '');
      setDate(editingTask.date || initialDate);
      setRecurrence(editingTask.recurrence);
      if (editingTask.repeatDays && editingTask.repeatDays.length > 0) {
        setRepeatDays(editingTask.repeatDays);
      } else {
        const defaultDay = parseLocalDate(editingTask.date || initialDate).getDay();
        setRepeatDays(editingTask.recurrence === 'weekly' ? [defaultDay] : [1, 2, 3, 4, 5]);
      }
    } else {
      setTitle('');
      setTime('');
      setCategory('');
      setDate(initialDate);
      setRecurrence('once');
      setRepeatDays([1, 2, 3, 4, 5]);
    }
  }, [isOpen, editingTask, initialDate]);

  if (!isOpen) return null;

  const toggleRepeatDay = (dayNum: number) => {
    setRepeatDays(prev => {
      if (prev.includes(dayNum)) {
        if (prev.length === 1) return prev; // Keep at least 1 selected day
        return prev.filter(d => d !== dayNum);
      }
      return [...prev, dayNum].sort();
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a task title.');
      return;
    }

    setIsSaving(true);
    try {
      const targetDayOfWeek = parseLocalDate(date).getDay();
      const computedRepeatDays =
        recurrence === 'weekdays'
          ? repeatDays
          : recurrence === 'weekly'
          ? [targetDayOfWeek]
          : undefined;

      await onSave({
        id: editingTask?.id,
        title: trimmed,
        time: time.trim() || undefined,
        category: category.trim() || undefined,
        date,
        recurrence,
        repeatDays: computedRepeatDays
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editingTask ? 'Edit Task' : 'New Task'}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl text-slate-900 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold tracking-tight">
            {editingTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Task Title */}
          <div>
            <label htmlFor="task-title-input" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Task
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="What needs to get done?"
              autoFocus
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300 transition"
            />
            {error && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-1.5">
                {error}
              </p>
            )}
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-date-input" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{recurrence === 'once' ? 'Date' : 'Start Date'}</span>
              </label>
              <input
                id="task-date-input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300"
              />
            </div>

            <div>
              <label htmlFor="task-time-input" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Time (Optional)</span>
              </label>
              <input
                id="task-time-input"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300"
              />
            </div>
          </div>

          {/* Recurrence Selector */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              <Repeat className="w-3.5 h-3.5" />
              <span>Repeat</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {(
                [
                  { id: 'once', label: 'Once' },
                  { id: 'daily', label: 'Daily' },
                  { id: 'weekdays', label: 'Days' },
                  { id: 'weekly', label: 'Weekly' }
                ] as Array<{ id: RecurrenceType; label: string }>
              ).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRecurrence(opt.id)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition ${
                    recurrence === opt.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {recurrence === 'weekdays' && (
              <div className="mt-3 flex items-center justify-between gap-1.5">
                {WEEKDAYS.map(w => {
                  const selected = repeatDays.includes(w.day);
                  return (
                    <button
                      key={w.day}
                      type="button"
                      aria-label={`Repeat on ${w.full}`}
                      aria-pressed={selected}
                      onClick={() => toggleRepeatDay(w.day)}
                      className={`w-9 h-9 rounded-xl text-xs font-semibold transition ${
                        selected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            )}

            {recurrence === 'weekly' && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Repeats every week on{' '}
                {
                  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
                    parseLocalDate(date).getDay()
                  ]
                }
                .
              </p>
            )}
          </div>

          {/* Optional Category */}
          <div>
            <label htmlFor="task-category-input" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Category (Optional)
            </label>
            <input
              id="task-category-input"
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Work, Routine, Personal"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(category === cat ? '' : cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition ${
                    category === cat
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
            {editingTask && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  await onDelete(editingTask.id);
                  onClose();
                }}
                aria-label={`Delete task ${editingTask.title}`}
                className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold transition shadow-xs"
              >
                {editingTask ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
