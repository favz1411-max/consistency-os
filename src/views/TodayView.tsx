import React from 'react';
import { Task, TaskCompletion } from '../types';
import {
  parseLocalDate,
  getWeekDates,
  getOffsetDateString,
  getTasksForDate,
  calculateDateProgress
} from '../utils/calculations';
import {
  Check,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2
} from 'lucide-react';

interface TodayViewProps {
  selectedDate: string;
  todayStr: string;
  startOfWeek: 0 | 1;
  tasks: Task[];
  completions: TaskCompletion[];
  onSelectDate: (dateStr: string) => void;
  onToggleTask: (taskId: string, dateStr: string) => void;
  onOpenAddModal: (dateStr: string) => void;
  onOpenEditModal: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTask: (taskId: string, direction: 'up' | 'down', dateStr: string) => void;
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatRecurrenceLabel(task: Task): string | null {
  if (task.recurrence === 'daily') return 'Daily';
  if (task.recurrence === 'weekly') return 'Weekly';
  if (task.recurrence === 'weekdays') {
    const days = task.repeatDays || [1, 2, 3, 4, 5];
    if (days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d))) {
      return 'Weekdays';
    }
    return days.map(d => SHORT_DAYS[d]).join(', ');
  }
  return null;
}

export const TodayView: React.FC<TodayViewProps> = ({
  selectedDate,
  todayStr,
  startOfWeek,
  tasks,
  completions,
  onSelectDate,
  onToggleTask,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteTask,
  onReorderTask
}) => {
  const parsedSelected = parseLocalDate(selectedDate);
  const weekDates = getWeekDates(selectedDate, startOfWeek);
  const dayTasks = getTasksForDate(selectedDate, tasks, completions);
  const { completedCount, totalCount } = calculateDateProgress(selectedDate, tasks, completions);

  const isSelectedToday = selectedDate === todayStr;

  const formattedFullDate = parsedSelected.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-7 pb-8">
      {/* Date Header & Primary Action */}
      <header className="flex items-start justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{isSelectedToday ? 'Today' : parsedSelected.getFullYear()}</span>
            {!isSelectedToday && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onSelectDate(todayStr)}
                  className="text-slate-900 dark:text-white underline underline-offset-4 hover:opacity-80 transition"
                >
                  Return to Today
                </button>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {formattedFullDate}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
            {totalCount === 0
              ? 'No tasks scheduled'
              : `${completedCount} of ${totalCount} completed`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenAddModal(selectedDate)}
          aria-label="Add Task"
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-4 py-2.5 text-xs font-semibold shadow-xs transition shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </header>

      {/* Compact Horizontal Weekly Calendar Strip */}
      <section aria-label="Weekly Calendar Strip" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {parsedSelected.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelectDate(getOffsetDateString(selectedDate, -7))}
              aria-label="Previous week"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectDate(getOffsetDateString(selectedDate, 7))}
              aria-label="Next week"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weekDates.map(dStr => {
            const dt = parseLocalDate(dStr);
            const isSelected = dStr === selectedDate;
            const isToday = dStr === todayStr;
            const prog = calculateDateProgress(dStr, tasks, completions);
            const hasTasks = prog.totalCount > 0;
            const allDone = hasTasks && prog.completedCount === prog.totalCount;

            return (
              <button
                key={dStr}
                type="button"
                onClick={() => onSelectDate(dStr)}
                aria-label={`Select ${dStr}`}
                aria-pressed={isSelected}
                className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition min-h-[60px] ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
                    : isToday
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span
                  className={`text-[11px] ${
                    isSelected
                      ? 'text-slate-300 dark:text-slate-600'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {SHORT_DAYS[dt.getDay()]}
                </span>
                <span className="text-sm font-mono mt-0.5">{dt.getDate()}</span>
                <span
                  className={`mt-1 text-[10px] font-mono leading-none ${
                    !hasTasks
                      ? 'opacity-0'
                      : isSelected
                      ? 'text-slate-300 dark:text-slate-600'
                      : allDone
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {hasTasks ? `${prog.completedCount}/${prog.totalCount}` : '·'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily Task List */}
      <section aria-label="Tasks for Selected Date">
        {dayTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-3">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Your schedule for this day is clear.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Add a task for {isSelectedToday ? 'today' : formattedFullDate} or set up a recurring daily routine.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onOpenAddModal(selectedDate)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Task</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80">
            {dayTasks.map(({ task, completed }, idx) => {
              const recurrenceLabel = formatRecurrenceLabel(task);
              const metaParts: string[] = [];
              if (task.time) metaParts.push(task.time);
              if (task.category) metaParts.push(task.category);
              if (recurrenceLabel) metaParts.push(recurrenceLabel);

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3.5 transition ${
                    completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={completed}
                      aria-label={`Mark "${task.title}" as ${completed ? 'incomplete' : 'complete'}`}
                      onClick={() => onToggleTask(task.id, selectedDate)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                        completed
                          ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                          : 'border-slate-300 dark:border-slate-600 hover:border-slate-900 dark:hover:border-slate-300 bg-transparent'
                      }`}
                    >
                      {completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium leading-snug break-words ${
                          completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </p>

                      {metaParts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {metaParts.map((part, pIdx) => (
                            <React.Fragment key={pIdx}>
                              {pIdx > 0 && <span aria-hidden="true">·</span>}
                              <span className={pIdx === 0 && task.time ? 'font-mono' : ''}>
                                {part}
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subtle Reorder, Edit & Delete Controls */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {dayTasks.length > 1 && (
                      <>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => onReorderTask(task.id, 'up', selectedDate)}
                          aria-label={`Move "${task.title}" up`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 transition"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === dayTasks.length - 1}
                          onClick={() => onReorderTask(task.id, 'down', selectedDate)}
                          aria-label={`Move "${task.title}" down`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 transition"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(task)}
                      aria-label={`Edit "${task.title}"`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      aria-label={`Delete "${task.title}"`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
