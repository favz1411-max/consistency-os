import React, { useEffect, useState, useCallback } from 'react';
import { Task, TaskCompletion, UserSettings, RecurrenceType } from './types';
import { formatLocalDate, getTasksForDate } from './utils/calculations';
import { getStoredSettings, saveStoredSettings } from './utils/storage';
import {
  initializeDatabase,
  saveTask,
  saveTasksBatch,
  removeTask,
  saveTaskCompletion
} from './utils/db';
import { TabBar, TabId } from './components/TabBar';
import { TaskModal } from './components/TaskModal';
import { TodayView } from './views/TodayView';
import { CalendarView } from './views/CalendarView';
import { ProgressView } from './views/ProgressView';
import { SettingsView } from './views/SettingsView';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [todayStr] = useState<string>(() => formatLocalDate(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(() => formatLocalDate(new Date()));
  const [settings, setSettings] = useState<UserSettings>(() => getStoredSettings());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [modalInitialDate, setModalInitialDate] = useState<string>(todayStr);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    try {
      const { tasks: loadedTasks, completions: loadedCompletions } = await initializeDatabase();
      setTasks(loadedTasks);
      setCompletions(loadedCompletions);
    } catch (e) {
      console.error('Failed to initialize Consistency OS database:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync light/dark theme class on document root
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleToggleTask = async (taskId: string, dateStr: string) => {
    const completionId = `${dateStr}_${taskId}`;
    const existing = completions.find(c => c.date === dateStr && c.taskId === taskId);
    const nextCompleted = !(existing?.completed ?? false);

    const record: TaskCompletion = {
      id: completionId,
      date: dateStr,
      taskId,
      completed: nextCompleted,
      updatedAt: new Date().toISOString()
    };

    const nextCompletions = nextCompleted
      ? [...completions.filter(c => c.id !== completionId), record]
      : completions.filter(c => c.id !== completionId);

    setCompletions(nextCompletions);
    await saveTaskCompletion(record, nextCompletions);
  };

  const handleSaveTask = async (taskData: {
    id?: string;
    title: string;
    time?: string;
    category?: string;
    date: string;
    recurrence: RecurrenceType;
    repeatDays?: number[];
  }) => {
    if (taskData.id) {
      const existing = tasks.find(t => t.id === taskData.id);
      if (!existing) return;
      const updatedTask: Task = {
        ...existing,
        title: taskData.title,
        time: taskData.time,
        category: taskData.category,
        date: taskData.date,
        recurrence: taskData.recurrence,
        repeatDays: taskData.repeatDays
      };
      const nextTasks = tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
      setTasks(nextTasks);
      await saveTask(updatedTask, nextTasks);
    } else {
      const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order || 0), 0);
      const newTask: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: taskData.title,
        time: taskData.time,
        category: taskData.category,
        date: taskData.date,
        recurrence: taskData.recurrence,
        repeatDays: taskData.repeatDays,
        order: maxOrder + 1,
        createdAt: new Date().toISOString()
      };
      const nextTasks = [...tasks, newTask];
      setTasks(nextTasks);
      await saveTask(newTask, nextTasks);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const nextTasks = tasks.filter(t => t.id !== taskId);
    const nextCompletions = completions.filter(c => c.taskId !== taskId);
    setTasks(nextTasks);
    setCompletions(nextCompletions);
    await removeTask(taskId, nextTasks, nextCompletions);
  };

  const handleReorderTask = async (
    taskId: string,
    direction: 'up' | 'down',
    dateStr: string
  ) => {
    const scheduled = getTasksForDate(dateStr, tasks, completions).map(o => o.task);
    const currentIndex = scheduled.findIndex(t => t.id === taskId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= scheduled.length) return;

    const reorderedScheduled = [...scheduled];
    const [moved] = reorderedScheduled.splice(currentIndex, 1);
    reorderedScheduled.splice(targetIndex, 0, moved);

    // Assign sequential orders to the scheduled tasks for this date
    const orderMap = new Map<string, number>();
    reorderedScheduled.forEach((t, idx) => {
      orderMap.set(t.id, idx + 1);
    });

    const nextTasks = tasks.map(t =>
      orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t
    );

    setTasks(nextTasks);
    await saveTasksBatch(nextTasks);
  };

  const openAddModal = (dateStr: string) => {
    setEditingTask(null);
    setModalInitialDate(dateStr);
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModalInitialDate(task.date);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors">
      <main className="max-w-lg mx-auto px-4 pt-safe pb-24">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Loading planner...
          </div>
        ) : (
          <>
            {activeTab === 'today' && (
              <TodayView
                selectedDate={selectedDate}
                todayStr={todayStr}
                startOfWeek={settings.startOfWeek}
                tasks={tasks}
                completions={completions}
                onSelectDate={setSelectedDate}
                onToggleTask={handleToggleTask}
                onOpenAddModal={openAddModal}
                onOpenEditModal={openEditModal}
                onDeleteTask={handleDeleteTask}
                onReorderTask={handleReorderTask}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarView
                selectedDate={selectedDate}
                todayStr={todayStr}
                startOfWeek={settings.startOfWeek}
                tasks={tasks}
                completions={completions}
                onSelectDate={setSelectedDate}
                onToggleTask={handleToggleTask}
                onOpenAddModal={openAddModal}
                onOpenEditModal={openEditModal}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressView
                todayStr={todayStr}
                startOfWeek={settings.startOfWeek}
                tasks={tasks}
                completions={completions}
                onSelectDateAndOpenToday={dateStr => {
                  setSelectedDate(dateStr);
                  setActiveTab('today');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onDataRestored={loadData}
              />
            )}
          </>
        )}
      </main>

      <TabBar activeTab={activeTab} onSelectTab={setActiveTab} />

      <TaskModal
        isOpen={isTaskModalOpen}
        initialDate={modalInitialDate}
        editingTask={editingTask}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}

export default App;
