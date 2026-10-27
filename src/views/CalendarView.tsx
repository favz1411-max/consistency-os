import React, { useState } from 'react';
import { Task, TaskCompletion } from '../types';
import {
  parseLocalDate,
  getMonthCalendarGrid,
  getTasksForDate,
  calculateDateProgress
} from '../utils/calculations';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Pencil,
  Trash2
} from 'lucide-react';

interface CalendarViewProps {
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
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  todayStr,
  startOfWeek,
  tasks,
  completions,
  onSelectDate,
  onToggleTask,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteTask
}) => {
  const initialDt = parseLocalDate(selectedDate);
  const [viewYear, setViewYear] = useState(initialDt.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDt.getMonth());

  const weekdayHeaders =
    startOfWeek === 1
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const gridCells = getMonthCalendarGrid(viewYear, viewMonth, startOfWeek);
  const monthLabel = new Date(viewYear, viewMonth, 1, 12, 0, 0).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleJumpToday = () => {
    const dt = parseLocalDate(todayStr);
    setViewYear(dt.getFullYear());
    setViewMonth(dt.getMonth());
    onSelectDate(todayStr);
  };

  const selectedDateTasks = getTasksForDate(selectedDate, tasks, completions);
  const selectedProg = calculateDateProgress(selectedDate, tasks, completions);
  const selectedFormatted = parseLocalDate(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review past completion history or schedule future dates
          </p>
        </div>

        <button
          type="button"
          onClick={handleJumpToday}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          Today
        </button>
      </header>

      {/* Monthly Calendar Grid Card */}
      <section
        aria-label="Monthly Calendar"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {monthLabel}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekdayHeaders.map(day => (
            <div
              key={day}
              className="text-[11px] font-medium text-slate-400 dark:text-slate-500 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {gridCells.map(cell => {
            const isSelected = cell.dateStr === selectedDate;
            const isToday = cell.dateStr === todayStr;
            const prog = calculateDateProgress(cell.dateStr, tasks, completions);
            const hasTasks = prog.totalCount > 0;
            const hasCompleted = prog.completedCount > 0;
            const isAllCompleted = hasTasks && prog.completedCount === prog.totalCount;

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => onSelectDate(cell.dateStr)}
                aria-label={`${cell.dateStr}, ${prog.completedCount} of ${prog.totalCount} tasks completed`}
                aria-pressed={isSelected}
                className={`flex flex-col items-center justify-center py-2 rounded-xl transition min-h-[52px] ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
                    : isToday
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : cell.isCurrentMonth
                    ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <span className="text-xs font-mono">{cell.dayNumber}</span>

                {/* Subtle Task & Completion Fraction Indicator */}
                <span
                  className={`mt-1 text-[9px] font-mono leading-none ${
                    !hasTasks
                      ? 'opacity-0'
                      : isSelected
                      ? 'text-slate-300 dark:text-slate-600'
                      : isAllCompleted
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : hasCompleted
                      ? 'text-slate-600 dark:text-slate-300'
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

      {/* Selected Date Task Schedule */}
      <section aria-label="Selected Date Tasks" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {selectedFormatted}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {selectedProg.totalCount === 0
                ? 'No tasks scheduled'
                : `${selectedProg.completedCount} of ${selectedProg.totalCount} completed`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenAddModal(selectedDate)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-3.5 py-2 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Task</span>
          </button>
        </div>

        {selectedDateTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No tasks scheduled for {selectedFormatted}.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80">
            {selectedDateTasks.map(({ task, completed }) => (
              <div
                key={task.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 transition ${
                  completed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={completed}
                    aria-label={`Mark "${task.title}" as ${completed ? 'incomplete' : 'complete'} on ${selectedDate}`}
                    onClick={() => onToggleTask(task.id, selectedDate)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                      completed
                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-900 dark:hover:border-slate-300'
                    }`}
                  >
                    {completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium break-words ${
                        completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {task.title}
                    </p>
                    {(task.time || task.category || task.recurrence !== 'once') && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {task.time && <span className="font-mono">{task.time}</span>}
                        {task.time && task.category && <span aria-hidden="true">·</span>}
                        {task.category && <span>{task.category}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
