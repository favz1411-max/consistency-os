import React, { useState } from 'react';
import {
  Habit,
  HabitLog,
  Workout,
  BodyMeasurement,
  DailyWaterLog,
  SleepRecord,
  DigitalSession,
  UserSettings
} from '../types';
import {
  calculateBodyTrend,
  calculateDailyCompletion,
  formatMinutes,
  getOffsetDateString
} from '../utils/calculations';
import {
  TrendingUp,
  Plus,
  Scale,
  Calendar,
  Droplets,
  Moon,
  Dumbbell,
  PhoneOff,
  Flame,
  Award,
  ChevronRight,
  Trash2,
  X
} from 'lucide-react';

interface ProgressViewProps {
  todayStr: string;
  habits: Habit[];
  habitLogs: HabitLog[];
  workouts: Workout[];
  bodyLogs: BodyMeasurement[];
  waterLogs: DailyWaterLog[];
  sleepLogs: SleepRecord[];
  digitalSessions: DigitalSession[];
  settings: UserSettings;
  onSaveBodyLog: (record: BodyMeasurement) => Promise<void>;
  onDeleteBodyLog: (id: string) => Promise<void>;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  todayStr,
  habits,
  habitLogs,
  workouts,
  bodyLogs,
  waterLogs,
  sleepLogs,
  digitalSessions,
  settings,
  onSaveBodyLog,
  onDeleteBodyLog
}) => {
  const [activeSection, setActiveSection] = useState<'consistency' | 'body' | 'sleep_water' | 'workouts'>('consistency');
  const [showAddWeightModal, setShowAddWeightModal] = useState<boolean>(false);

  // Body log input form
  const [weightInput, setWeightInput] = useState<string>('');
  const [waistInput, setWaistInput] = useState<string>('');
  const [chestInput, setChestInput] = useState<string>('');
  const [armsInput, setArmsInput] = useState<string>('');
  const [hipsInput, setHipsInput] = useState<string>('');
  const [bodyNotes, setBodyNotes] = useState<string>('');

  const bodyTrend = calculateBodyTrend(bodyLogs);

  // Past 30 days array for consistency heatmap
  const past30Days = Array.from({ length: 30 }, (_, i) => getOffsetDateString(todayStr, -(29 - i)));

  // Calculate consistency history for past 30 days
  const dailyScores = past30Days.map(date => {
    const res = calculateDailyCompletion(date, habits, habitLogs);
    return {
      date,
      percentage: res.percentage,
      totalScheduled: res.totalScheduled,
      completedCount: res.completedCount
    };
  });

  const averageCompletion30Days =
    dailyScores.length > 0
      ? Math.round(
          dailyScores.reduce((acc, curr) => acc + curr.percentage, 0) / dailyScores.length
        )
      : 0;

  // Habit completion by category
  const categories: Array<Habit['category']> = ['health', 'fitness', 'mind', 'discipline', 'routine'];
  const categoryStats = categories.map(cat => {
    const catHabits = habits.filter(h => h.category === cat);
    if (catHabits.length === 0) return { category: cat, rate: 0, total: 0 };

    let totalSched = 0;
    let completed = 0;

    past30Days.forEach(d => {
      const dObj = new Date(d + 'T12:00:00');
      const dayOfWeek = dObj.getDay();
      catHabits.forEach(h => {
        if (h.scheduleDays.includes(dayOfWeek)) {
          totalSched++;
          if (habitLogs.some(l => l.date === d && l.habitId === h.id && l.completed)) {
            completed++;
          }
        }
      });
    });

    const rate = totalSched > 0 ? Math.round((completed / totalSched) * 100) : 0;
    return { category: cat, rate, total: completed };
  });

  const handleSaveBodyRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const wt = parseFloat(weightInput);
    if (isNaN(wt) || wt <= 0) return;

    const newRecord: BodyMeasurement = {
      id: 'body_' + Date.now(),
      date: todayStr,
      weight: wt,
      waist: waistInput ? parseFloat(waistInput) : undefined,
      chest: chestInput ? parseFloat(chestInput) : undefined,
      arms: armsInput ? parseFloat(armsInput) : undefined,
      hips: hipsInput ? parseFloat(hipsInput) : undefined,
      notes: bodyNotes.trim() || undefined
    };

    await onSaveBodyLog(newRecord);
    setWeightInput('');
    setWaistInput('');
    setChestInput('');
    setArmsInput('');
    setHipsInput('');
    setBodyNotes('');
    setShowAddWeightModal(false);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Progress & Analytics</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Empirical consistency metrics derived strictly from your saved logs
        </p>
      </div>

      {/* Segmented Control */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-medium">
        <button
          onClick={() => setActiveSection('consistency')}
          className={`py-2 rounded-xl transition ${
            activeSection === 'consistency'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Engine
        </button>
        <button
          onClick={() => setActiveSection('body')}
          className={`py-2 rounded-xl transition ${
            activeSection === 'body'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Body
        </button>
        <button
          onClick={() => setActiveSection('sleep_water')}
          className={`py-2 rounded-xl transition ${
            activeSection === 'sleep_water'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Recovery
        </button>
        <button
          onClick={() => setActiveSection('workouts')}
          className={`py-2 rounded-xl transition ${
            activeSection === 'workouts'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Fitness
        </button>
      </div>

      {/* 1. CONSISTENCY ENGINE TAB */}
      {activeSection === 'consistency' && (
        <div className="space-y-4">
          {/* Consistency KPI Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400">30-Day Consistency Average</span>
                <p className="text-3xl font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
                  {averageCompletion30Days}%
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400">Total Workouts</span>
                <p className="text-3xl font-bold font-mono text-white mt-0.5 tabular-nums">
                  {workouts.length}
                </p>
              </div>
            </div>

            {/* 30-Day Heatmap Matrix */}
            <div>
              <p className="text-xs font-semibold text-zinc-300 mb-2">30-Day Consistency Grid</p>
              <div className="grid grid-cols-10 gap-1.5">
                {dailyScores.map(d => {
                  let bg = 'bg-zinc-950 border-zinc-800/80';
                  if (d.percentage === 100) bg = 'bg-emerald-500 border-emerald-400 text-zinc-950';
                  else if (d.percentage >= 75) bg = 'bg-emerald-600 border-emerald-500 text-white';
                  else if (d.percentage >= 50) bg = 'bg-emerald-800 border-emerald-700 text-white';
                  else if (d.percentage > 0) bg = 'bg-emerald-950 border-emerald-900 text-emerald-400';

                  return (
                    <div
                      key={d.date}
                      title={`${d.date}: ${d.percentage}% (${d.completedCount}/${d.totalScheduled})`}
                      className={`h-7 rounded-lg border flex items-center justify-center text-[10px] font-mono transition ${bg}`}
                    >
                      {d.percentage > 0 ? `${d.percentage}` : ''}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 font-mono">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Completion by Category */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Consistency by Life Domain</h2>
            <div className="space-y-3 pt-1">
              {categoryStats.map(stat => (
                <div key={stat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize font-medium text-zinc-300">{stat.category}</span>
                    <span className="font-mono text-emerald-400 font-semibold">{stat.rate}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${stat.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. BODY PROGRESS TAB */}
      {activeSection === 'body' && (
        <div className="space-y-4">
          {/* Body Weight Summary Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400">Current Weight</span>
                <p className="text-3xl font-bold font-mono text-white mt-0.5 tabular-nums">
                  {bodyTrend.latest
                    ? `${bodyTrend.latest.weight} ${settings.unitSystem === 'metric' ? 'kg' : 'lbs'}`
                    : 'No entry'}
                </p>
              </div>
              <button
                onClick={() => setShowAddWeightModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Measurement</span>
              </button>
            </div>

            {/* Delta statistics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
              <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800/80">
                <span className="text-[11px] text-zinc-400">Since Previous</span>
                <p className={`text-base font-bold font-mono mt-0.5 ${
                  bodyTrend.changeFromPrevious < 0
                    ? 'text-emerald-400'
                    : bodyTrend.changeFromPrevious > 0
                    ? 'text-amber-400'
                    : 'text-zinc-300'
                }`}>
                  {bodyTrend.changeFromPrevious > 0 ? '+' : ''}
                  {bodyTrend.changeFromPrevious} {settings.unitSystem === 'metric' ? 'kg' : 'lbs'}
                </p>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800/80">
                <span className="text-[11px] text-zinc-400">From Starting Weight</span>
                <p className={`text-base font-bold font-mono mt-0.5 ${
                  bodyTrend.changeFromStart < 0
                    ? 'text-emerald-400'
                    : bodyTrend.changeFromStart > 0
                    ? 'text-amber-400'
                    : 'text-zinc-300'
                }`}>
                  {bodyTrend.changeFromStart > 0 ? '+' : ''}
                  {bodyTrend.changeFromStart} {settings.unitSystem === 'metric' ? 'kg' : 'lbs'}
                </p>
              </div>
            </div>

            {/* Weight Chart (Offline SVG) */}
            {bodyLogs.length >= 2 ? (
              <div className="pt-2">
                <p className="text-xs font-semibold text-zinc-300 mb-2">Weight Progression Curve</p>
                <div className="h-40 w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
                  {renderWeightSvgChart(bodyLogs, settings.unitSystem)}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic text-center py-2">
                Log at least 2 body weight measurements to view the progression curve.
              </p>
            )}
          </div>

          {/* Body Measurements History Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white px-1">Measurement History</h3>

            {bodyLogs.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-xs text-zinc-500">
                No measurements logged yet. Tap "Log Measurement" above to begin.
              </div>
            ) : (
              <div className="space-y-2">
                {[...bodyLogs]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map(rec => (
                    <div
                      key={rec.id}
                      className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono text-emerald-400 text-[11px]">{rec.date}</span>
                        <p className="font-bold text-sm text-zinc-100 font-mono mt-0.5">
                          {rec.weight} {settings.unitSystem === 'metric' ? 'kg' : 'lbs'}
                        </p>
                        {(rec.waist || rec.chest || rec.arms || rec.hips) && (
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {rec.waist && `Waist: ${rec.waist} · `}
                            {rec.chest && `Chest: ${rec.chest} · `}
                            {rec.arms && `Arms: ${rec.arms}`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteBodyLog(rec.id)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. RECOVERY (SLEEP & WATER) TAB */}
      {activeSection === 'sleep_water' && (
        <div className="space-y-4">
          {/* Sleep Stats */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400">Total Sleep Logged</span>
                <p className="text-xl font-bold font-mono text-purple-400 mt-0.5">
                  {sleepLogs.length} nights recorded
                </p>
              </div>
              <Moon className="w-6 h-6 text-purple-400" />
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              {sleepLogs.slice(-5).reverse().map(s => (
                <div key={s.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs flex items-center justify-between">
                  <span className="font-mono text-zinc-400">{s.date}</span>
                  <span className="font-mono font-semibold text-zinc-200">
                    {formatMinutes(s.durationMinutes)} ({s.bedtime} - {s.wakeTime})
                  </span>
                  <span className="text-amber-400 text-[10px]">{'★'.repeat(s.quality)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Water Intake History */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400">Water Hydration</span>
                <p className="text-xl font-bold font-mono text-blue-400 mt-0.5">
                  Target: {settings.waterTargetMl} ml
                </p>
              </div>
              <Droplets className="w-6 h-6 text-blue-400" />
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              {waterLogs.slice(-5).reverse().map(w => (
                <div key={w.date} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs flex items-center justify-between">
                  <span className="font-mono text-zinc-400">{w.date}</span>
                  <span className="font-mono font-semibold text-blue-300">
                    {w.totalMl} ml
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {Math.round((w.totalMl / settings.waterTargetMl) * 100)}% target
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. FITNESS FREQUENCY TAB */}
      {activeSection === 'workouts' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400">Total Workouts Completed</span>
                <p className="text-3xl font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
                  {workouts.length}
                </p>
              </div>
              <Dumbbell className="w-8 h-8 text-zinc-600" />
            </div>

            <p className="text-xs text-zinc-400">
              Consistency is measured by showing up repeatedly on your scheduled days without extreme spikes or burnout.
            </p>
          </div>
        </div>
      )}

      {/* Log Body Weight Modal */}
      {showAddWeightModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log Body Measurement"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowAddWeightModal(false)}
        >
          <form
            onSubmit={handleSaveBodyRecord}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl text-zinc-100 space-y-3.5 max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-sm">Log Weight & Measurements</h3>
              <button
                type="button"
                onClick={() => setShowAddWeightModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Body Weight ({settings.unitSystem === 'metric' ? 'kg' : 'lbs'}) *
              </label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="500"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                placeholder="e.g. 78.5"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-base text-zinc-100 font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Waist ({settings.unitSystem === 'metric' ? 'cm' : 'in'})</label>
                <input
                  type="number"
                  step="0.5"
                  value={waistInput}
                  onChange={e => setWaistInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-zinc-100"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Chest ({settings.unitSystem === 'metric' ? 'cm' : 'in'})</label>
                <input
                  type="number"
                  step="0.5"
                  value={chestInput}
                  onChange={e => setChestInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Arms ({settings.unitSystem === 'metric' ? 'cm' : 'in'})</label>
                <input
                  type="number"
                  step="0.5"
                  value={armsInput}
                  onChange={e => setArmsInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-zinc-100"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Hips ({settings.unitSystem === 'metric' ? 'cm' : 'in'})</label>
                <input
                  type="number"
                  step="0.5"
                  value={hipsInput}
                  onChange={e => setHipsInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Notes (Optional)</label>
              <input
                type="text"
                placeholder="Morning weigh-in, fasted..."
                value={bodyNotes}
                onChange={e => setBodyNotes(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-98 transition mt-2 shadow-lg shadow-emerald-950/40"
            >
              Save Measurement
            </button>
          </form>
        </div>
      )}
    </div>
  );

  function renderWeightSvgChart(records: BodyMeasurement[], unitSystem: string) {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const weights = sorted.map(r => r.weight);
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;
    const range = Math.max(1, maxW - minW);

    const width = 300;
    const height = 110;
    const padding = 15;

    const points = sorted.map((r, i) => {
      const x = padding + (i / Math.max(1, sorted.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((r.weight - minW) / range) * (height - 2 * padding);
      return { x, y, weight: r.weight, date: r.date };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
        {/* Subtle grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#27272a" strokeWidth="1" />

        {/* Path line */}
        <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#10b981" />
            <circle cx={p.x} cy={p.y} r="1.5" fill="#09090b" />
          </g>
        ))}
      </svg>
    );
  }
};
