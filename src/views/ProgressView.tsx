import React from 'react';
import { Task, TaskCompletion } from '../types';
import {
  parseLocalDate,
  calculateProgressStats,
  getMonthCalendarGrid,
  calculateDateProgress
} from '../utils/calculations';

interface ProgressViewProps {
  todayStr: string;
  startOfWeek: 0 | 1;
  tasks: Task[];
  completions: TaskCompletion[];
  onSelectDateAndOpenToday: (dateStr: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  todayStr,
  startOfWeek,
  tasks,
  completions,
  onSelectDateAndOpenToday
}) => {
  const stats = calculateProgressStats(todayStr, startOfWeek, tasks, completions);
  const todayDt = parseLocalDate(todayStr);
  const monthGrid = getMonthCalendarGrid(todayDt.getFullYear(), todayDt.getMonth(), startOfWeek);
  const monthName = todayDt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-8">
      <header className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Progress
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Daily task completion and weekly consistency
        </p>
      </header>

      {/* 3 Essential Statistics: Daily Completion %, Weekly Consistency, Tasks Completed */}
      <section
        aria-label="Consistency Summary"
        className="grid grid-cols-3 gap-3"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Today</p>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {stats.todayProgress.percentage}%
          </p>
          <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">
            {stats.todayProgress.completedCount} of {stats.todayProgress.totalCount} done
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">This Week</p>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {stats.weeklyPercentage}%
          </p>
          <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">
            {stats.activeDaysThisWeek}/7 active days
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {stats.totalCompletedAllTime}
          </p>
          <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">
            {stats.currentStreak}d streak
          </p>
        </div>
      </section>

      {/* Compact Weekly Consistency Summary */}
      <section
        aria-label="Weekly Breakdown"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Weekly Consistency
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {stats.weeklyCompletedCount} of {stats.weeklyScheduledCount} scheduled tasks completed through today
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
            {stats.weeklyPercentage}%
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-1">
          {stats.weekDays.map(day => {
            const hasTasks = day.totalCount > 0;
            const isComplete = hasTasks && day.completedCount === day.totalCount;
            const isPartial = day.completedCount > 0 && day.completedCount < day.totalCount;

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => onSelectDateAndOpenToday(day.dateStr)}
                aria-label={`View ${day.dateStr}: ${day.completedCount} of ${day.totalCount} completed`}
                className="flex flex-col items-center gap-1.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
              >
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {day.dayLabel}
                </span>

                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono transition ${
                    isComplete
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                      : isPartial
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                      : day.isToday
                      ? 'border border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {day.dayNumber}
                </div>

                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  {hasTasks ? `${day.completedCount}/${day.totalCount}` : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Simple Monthly Consistency Overview */}
      <section
        aria-label="Monthly Consistency Overview"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {monthName} Overview
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Tap any date to inspect
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {monthGrid.map(cell => {
            const prog = calculateDateProgress(cell.dateStr, tasks, completions);
            const hasTasks = prog.totalCount > 0;
            const isAllDone = hasTasks && prog.completedCount === prog.totalCount;
            const isSomeDone = prog.completedCount > 0 && prog.completedCount < prog.totalCount;

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => onSelectDateAndOpenToday(cell.dateStr)}
                aria-label={`${cell.dateStr}: ${prog.percentage}% completed`}
                className={`h-9 rounded-lg flex items-center justify-center text-xs font-mono transition ${
                  !cell.isCurrentMonth
                    ? 'opacity-25 text-slate-400'
                    : isAllDone
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                    : isSomeDone
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400'
                }`}
              >
                {cell.dayNumber}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
