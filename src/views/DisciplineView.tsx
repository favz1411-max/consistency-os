import React, { useState, useEffect, useRef } from 'react';
import {
  DigitalSession,
  DailyCommitment,
  FocusSession,
  UserSettings
} from '../types';
import {
  calculateDigitalAllowance,
  formatMinutes
} from '../utils/calculations';
import {
  getStoredActiveSession,
  saveStoredActiveSession,
  ActiveScrollSessionState
} from '../utils/storage';
import {
  PhoneOff,
  Play,
  Pause,
  Square,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
  CheckCircle,
  RotateCcw,
  BookOpen,
  ChevronRight,
  Sliders,
  X
} from 'lucide-react';

interface DisciplineViewProps {
  todayStr: string;
  digitalSessions: DigitalSession[];
  commitments: DailyCommitment[];
  focusSessions: FocusSession[];
  settings: UserSettings;
  onSaveSession: (session: DigitalSession) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onSaveCommitment: (commitment: DailyCommitment) => Promise<void>;
  onSaveFocusSession: (session: FocusSession) => Promise<void>;
  onUpdateAppLimits: (limits: Record<string, number>) => Promise<void>;
}

export const DisciplineView: React.FC<DisciplineViewProps> = ({
  todayStr,
  digitalSessions,
  commitments,
  focusSessions,
  settings,
  onSaveSession,
  onDeleteSession,
  onSaveCommitment,
  onSaveFocusSession,
  onUpdateAppLimits
}) => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'commitment' | 'limits' | 'guide'>('tracker');

  // Active in-app scrolling timer state
  const [selectedApp, setSelectedApp] = useState<string>('Instagram');
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Focus Timer state
  const [focusType, setFocusType] = useState<'deep_work' | 'workout' | 'reading' | 'digital_detox'>('deep_work');
  const [focusTargetMinutes, setFocusTargetMinutes] = useState<number>(25);
  const [focusElapsedSeconds, setFocusElapsedSeconds] = useState<number>(0);
  const [focusRunning, setFocusRunning] = useState<boolean>(false);
  const focusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Modals
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState<boolean>(false);
  const [showLapseModal, setShowLapseModal] = useState<boolean>(false);
  const [lapseNotes, setLapseNotes] = useState<string>('');
  const [showLimitEditModal, setShowLimitEditModal] = useState<boolean>(false);
  const [tempLimits, setTempLimits] = useState<Record<string, number>>({ ...settings.appLimits });

  // Today's commitment
  const todayCommitment = commitments.find(c => c.date === todayStr) || {
    date: todayStr,
    noScrollCommitted: false,
    lapseCount: 0,
    completed: false
  };

  // Allowance data
  const allowance = calculateDigitalAllowance(settings.appLimits, digitalSessions, todayStr);

  // Restore saved active session across reloads
  useEffect(() => {
    const saved = getStoredActiveSession();
    if (saved) {
      setSelectedApp(saved.app);
      if (saved.isRunning) {
        const diff = Math.floor((Date.now() - saved.startedAt) / 1000);
        setElapsedSeconds(saved.elapsedSeconds + diff);
        setTimerRunning(true);
      } else {
        setElapsedSeconds(saved.elapsedSeconds);
        setTimerRunning(false);
      }
    }
  }, []);

  // Scrolling session timer tick
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          saveStoredActiveSession({
            app: selectedApp,
            startedAt: Date.now(),
            elapsedSeconds: next,
            isRunning: true
          });
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, selectedApp]);

  // Focus session timer tick
  useEffect(() => {
    if (focusRunning) {
      focusIntervalRef.current = setInterval(() => {
        setFocusElapsedSeconds(prev => {
          if (prev + 1 >= focusTargetMinutes * 60) {
            clearInterval(focusIntervalRef.current!);
            setFocusRunning(false);
            // Auto complete focus session
            onSaveFocusSession({
              id: 'focus_' + Date.now(),
              date: todayStr,
              type: focusType,
              durationMinutes: focusTargetMinutes,
              completed: true,
              timestamp: Date.now()
            });
            return focusTargetMinutes * 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
    }
    return () => {
      if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
    };
  }, [focusRunning, focusTargetMinutes, focusType, todayStr]);

  const handleStartTimer = () => {
    setTimerRunning(true);
    saveStoredActiveSession({
      app: selectedApp,
      startedAt: Date.now(),
      elapsedSeconds,
      isRunning: true
    });
  };

  const handlePauseTimer = () => {
    setTimerRunning(false);
    saveStoredActiveSession({
      app: selectedApp,
      startedAt: Date.now(),
      elapsedSeconds,
      isRunning: false
    });
  };

  const handleEndSession = async () => {
    setTimerRunning(false);
    saveStoredActiveSession(null);

    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
    if (elapsedSeconds >= 10) {
      const newSession: DigitalSession = {
        id: 'ds_' + Date.now(),
        date: todayStr,
        app: selectedApp,
        durationMinutes: durationMins,
        timestamp: Date.now()
      };
      await onSaveSession(newSession);
    }

    setElapsedSeconds(0);
    setSessionNotes('');
  };

  const handleToggleNoScrollCommitment = async (activate: boolean) => {
    if (activate) {
      setShowBlockConfirmModal(true);
    } else {
      await onSaveCommitment({
        ...todayCommitment,
        noScrollCommitted: false,
        lockedUntil: undefined
      });
    }
  };

  const confirmBlockToday = async () => {
    const endOfDay = new Date(todayStr + 'T23:59:59').toISOString();
    await onSaveCommitment({
      ...todayCommitment,
      noScrollCommitted: true,
      lockedUntil: endOfDay,
      completed: true
    });
    setShowBlockConfirmModal(false);
  };

  const handleLogLapse = async () => {
    await onSaveCommitment({
      ...todayCommitment,
      lapseCount: todayCommitment.lapseCount + 1,
      notes: lapseNotes ? `${todayCommitment.notes ? todayCommitment.notes + ' | ' : ''}${lapseNotes}` : todayCommitment.notes
    });
    setLapseNotes('');
    setShowLapseModal(false);
  };

  const timerMin = Math.floor(elapsedSeconds / 60);
  const timerSec = elapsedSeconds % 60;
  const formattedStopwatch = `${timerMin}:${timerSec < 10 ? '0' : ''}${timerSec}`;

  const focusMin = Math.floor(focusElapsedSeconds / 60);
  const focusSec = focusElapsedSeconds % 60;
  const formattedFocus = `${focusMin}:${focusSec < 10 ? '0' : ''}${focusSec}`;

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Digital Discipline</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Conscious screen time limits & focus commitments
        </p>
      </div>

      {/* Transparent Disclaimer Badge */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-zinc-200">Device Transparency:</strong> Web browsers cannot detect background iOS activity or intercept native apps. All records here reflect deliberate in-app session tracking. For native blocking, see our iOS Screen Time guide below.
        </p>
      </div>

      {/* Segmented Control */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-medium">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'tracker'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Session Timer
        </button>
        <button
          onClick={() => setActiveTab('commitment')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'commitment'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Commitment
        </button>
        <button
          onClick={() => setActiveTab('limits')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'limits'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Budgets
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'guide'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          iOS Guide
        </button>
      </div>

      {/* 1. SESSION TRACKER TAB */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          {/* Daily Allowance Overview Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Today's Scrolling Budget</span>
              <span className={`font-mono font-semibold ${
                allowance.isOverLimit ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {allowance.totalUsed}m / {allowance.totalAllowed}m used
              </span>
            </div>

            {/* Visual Budget Progress Bar */}
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  allowance.isOverLimit ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, (allowance.totalUsed / Math.max(1, allowance.totalAllowed)) * 100)}%`
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>{allowance.totalRemaining}m remaining today</span>
              {allowance.isOverLimit && (
                <span className="text-red-400 font-medium">Over daily budget</span>
              )}
            </div>
          </div>

          {/* Active In-App Session Stopwatch */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 text-center space-y-4 shadow-xl">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                In-App Session Tracker
              </span>
              <h2 className="text-sm text-zinc-400 mt-0.5">
                Track and constrain your distracting app sessions
              </h2>
            </div>

            {/* App Selector */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {Object.keys(settings.appLimits).map(app => (
                <button
                  key={app}
                  onClick={() => {
                    if (!timerRunning) setSelectedApp(app);
                  }}
                  disabled={timerRunning}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                    selectedApp === app
                      ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {app}
                </button>
              ))}
            </div>

            {/* Big Stopwatch Display */}
            <div className="py-4">
              <span className="text-5xl font-mono font-bold tracking-tight text-white tabular-nums">
                {formattedStopwatch}
              </span>
              <p className="text-xs text-zinc-400 mt-2">
                Tracking: <strong className="text-zinc-200">{selectedApp}</strong> ({allowance.appBreakdown[selectedApp]?.remaining || 0}m left)
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {timerRunning ? (
                <button
                  onClick={handlePauseTimer}
                  className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-2 active:scale-95 transition shadow-lg shadow-amber-900/30"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Session</span>
                </button>
              ) : (
                <button
                  onClick={handleStartTimer}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 active:scale-95 transition shadow-lg shadow-emerald-950/40"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{elapsedSeconds > 0 ? 'Resume Session' : 'Start Session'}</span>
                </button>
              )}

              {elapsedSeconds > 0 && (
                <button
                  onClick={handleEndSession}
                  className="px-5 py-3 rounded-2xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition"
                >
                  <Square className="w-4 h-4" />
                  <span>End & Log</span>
                </button>
              )}
            </div>
          </div>

          {/* Today's Logged Sessions List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white px-1">Today's Logged Sessions</h3>

            {digitalSessions.filter(s => s.date === todayStr).length === 0 ? (
              <p className="text-xs text-zinc-500 p-4 bg-zinc-900/40 rounded-2xl text-center border border-zinc-800/60">
                No sessions tracked today. Your phone has remained undisturbed!
              </p>
            ) : (
              digitalSessions
                .filter(s => s.date === todayStr)
                .map(session => (
                  <div
                    key={session.id}
                    className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-zinc-200">{session.app}</p>
                      <p className="text-[11px] text-zinc-400">
                        {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium text-emerald-400">
                        {session.durationMinutes} min
                      </span>
                      <button
                        onClick={() => onDeleteSession(session.id)}
                        aria-label="Delete session"
                        className="text-zinc-500 hover:text-red-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* 2. COMMITMENT & FOCUS SESSIONS TAB */}
      {activeTab === 'commitment' && (
        <div className="space-y-4">
          {/* Commit to No Scrolling Mode */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Commitment to No Scrolling</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Psychological commitment lock. Reclaim your focus for the day.
                </p>
              </div>
              <span
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                  todayCommitment.noScrollCommitted
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {todayCommitment.noScrollCommitted ? 'Active Lock' : 'Inactive'}
              </span>
            </div>

            {todayCommitment.noScrollCommitted ? (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Lock className="w-4 h-4" />
                  <span>Committed until 11:59 PM tonight</span>
                </div>
                <p className="text-xs text-zinc-300">
                  You committed to zero non-essential scrolling today. Honor your contract with yourself.
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-emerald-900/40">
                  <button
                    onClick={() => setShowLapseModal(true)}
                    className="flex-1 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-medium text-amber-400 hover:bg-zinc-800 transition"
                  >
                    I Slipped Up (Log & Reset)
                  </button>
                  <button
                    onClick={() => handleToggleNoScrollCommitment(false)}
                    className="py-2 px-3 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Activating this mode commits you to zero mindless browsing for the rest of today.
                </p>
                <button
                  onClick={() => setShowBlockConfirmModal(true)}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white active:scale-95 transition shadow-lg shadow-emerald-950/40"
                >
                  Block Non-Essential Scrolling for Rest of Today
                </button>
              </div>
            )}

            {todayCommitment.lapseCount > 0 && (
              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs text-zinc-400">
                <span>Recorded lapses today: <strong className="text-amber-400">{todayCommitment.lapseCount}</strong>. Every moment is an opportunity to restart.</span>
              </div>
            )}
          </div>

          {/* Focus Session Pomodoro Timer */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Focus Session Timer</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Dedicate an uninterrupted block of time to deep work, reading, or training
              </p>
            </div>

            {/* Preset selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { type: 'deep_work', label: 'Deep Work', mins: 25 },
                { type: 'reading', label: 'Reading', mins: 20 },
                { type: 'workout', label: 'Training', mins: 45 },
                { type: 'digital_detox', label: 'Detox', mins: 60 }
              ].map(p => (
                <button
                  key={p.type}
                  onClick={() => {
                    if (!focusRunning) {
                      setFocusType(p.type as any);
                      setFocusTargetMinutes(p.mins);
                      setFocusElapsedSeconds(0);
                    }
                  }}
                  disabled={focusRunning}
                  className={`py-2 px-1 text-xs font-medium rounded-xl border text-center transition ${
                    focusType === p.type
                      ? 'border-purple-500 bg-purple-950/50 text-purple-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {p.label}
                  <span className="block text-[10px] font-mono text-zinc-500">{p.mins}m</span>
                </button>
              ))}
            </div>

            {/* Focus Clock */}
            <div className="py-2 text-center">
              <span className="text-4xl font-mono font-bold text-white tabular-nums">
                {formattedFocus} / {focusTargetMinutes}:00
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {focusRunning ? (
                <button
                  onClick={() => setFocusRunning(false)}
                  className="px-6 py-2.5 rounded-2xl bg-amber-600 text-white font-semibold text-xs active:scale-95 transition"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => setFocusRunning(true)}
                  className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs active:scale-95 transition shadow-lg shadow-purple-950/40"
                >
                  {focusElapsedSeconds > 0 ? 'Resume Focus' : 'Start Focus Block'}
                </button>
              )}

              {focusElapsedSeconds > 0 && (
                <button
                  onClick={() => {
                    setFocusRunning(false);
                    setFocusElapsedSeconds(0);
                  }}
                  className="px-4 py-2.5 rounded-2xl border border-zinc-700 bg-zinc-800 text-xs text-zinc-300"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. BUDGETS & LIMITS TAB */}
      {activeTab === 'limits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Daily App Allowances</h2>
            <button
              onClick={() => {
                setTempLimits({ ...settings.appLimits });
                setShowLimitEditModal(true);
              }}
              className="text-xs text-emerald-400 font-medium hover:underline flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Budgets</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {Object.entries(settings.appLimits).map(([app, limit]) => {
              const used = allowance.appBreakdown[app]?.used || 0;
              const remaining = Math.max(0, limit - used);
              const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
              const isExceeded = used > limit;

              return (
                <div
                  key={app}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-zinc-100">{app}</h3>
                      <p className="text-[11px] text-zinc-400">
                        Allowance: <span className="font-mono text-zinc-300">{limit}m</span> daily
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-xs font-semibold ${isExceeded ? 'text-red-400' : 'text-emerald-400'}`}>
                        {used}m logged
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {remaining}m remaining
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${isExceeded ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. APPLE SCREEN TIME & NATIVE ROADMAP GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-white">Apple iOS Built-in Screen Time Setup</h2>
            <p className="text-xs text-zinc-300">
              For hard, OS-level app blocking on your iPhone 12 Pro or 17 Pro right now, configure Apple's native Screen Time settings.
            </p>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 space-y-1">
                <p className="font-semibold text-emerald-400">Step 1: Open iOS Settings & Screen Time</p>
                <p className="text-zinc-400">Go to <strong>Settings → Screen Time</strong> and enable it if not already active.</p>
              </div>

              <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 space-y-1">
                <p className="font-semibold text-emerald-400">Step 2: Add App Limits</p>
                <p className="text-zinc-400">Tap <strong>App Limits → Add Limit</strong>. Select <em>Social</em> or select specific apps (Instagram, TikTok, YouTube). Set your preferred limit (e.g., 20 minutes) and toggle on <strong>Block at End of Limit</strong>.</p>
              </div>

              <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 space-y-1">
                <p className="font-semibold text-emerald-400">Step 3: Set Downtime</p>
                <p className="text-zinc-400">Tap <strong>Downtime</strong> and schedule it for your sleep hours (e.g., 10:30 PM to 7:00 AM). During Downtime, only essential apps (Phone, Messages) and Consistency OS will remain usable.</p>
              </div>

              <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 space-y-1">
                <p className="font-semibold text-emerald-400">Step 4: Use a Screen Time Passcode</p>
                <p className="text-zinc-400">Set a Screen Time passcode known only to a trusted accountability partner, or memorize a complex code to create friction against impulsive overrides.</p>
              </div>
            </div>
          </div>

          {/* Technical Native Companion Roadmap */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-200">
              Future Native iOS Companion Roadmap
            </h3>
            <p className="text-xs text-zinc-400">
              Apple provides three specialized frameworks for third-party parental and self-regulation apps:
            </p>
            <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
              <li><strong className="text-zinc-100">FamilyControls:</strong> Grants authorization to request app tokens without exposing user browsing or sensitive app data.</li>
              <li><strong className="text-zinc-100">DeviceActivity:</strong> Monitors thresholds and runs background schedules.</li>
              <li><strong className="text-zinc-100">ManagedSettings:</strong> Applies shields and restrictions directly to selected apps.</li>
            </ul>
            <p className="text-[11px] text-zinc-500 pt-1">
              Note: These frameworks strictly require a native Xcode project in Swift with Apple Developer entitlement approval. Web browsers cannot execute them.
            </p>
          </div>
        </div>
      )}

      {/* Block Confirm Modal */}
      {showBlockConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Commitment"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowBlockConfirmModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-zinc-100 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto">
              <Lock className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-white">Commit to No Scrolling?</h3>
              <p className="text-xs text-zinc-300">
                You are committing to zero non-essential social browsing for the rest of today (until midnight).
              </p>
            </div>

            <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <p>• Web apps cannot forcefully close native iPhone apps.</p>
              <p>• This is a sacred self-discipline contract.</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowBlockConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmBlockToday}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs active:scale-95 transition"
              >
                Yes, Commit Today
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lapse Recovery Modal */}
      {showLapseModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log Lapse and Reset"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowLapseModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-zinc-100 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-sm">Honest Reflection</h3>
              <button
                onClick={() => setShowLapseModal(false)}
                className="text-xs text-zinc-400"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              A lapse is not a failure—it is feedback. What triggered the urge to scroll?
            </p>

            <textarea
              rows={3}
              value={lapseNotes}
              onChange={e => setLapseNotes(e.target.value)}
              placeholder="e.g. Boredom while waiting in line / stress after work..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            />

            <button
              onClick={handleLogLapse}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs active:scale-95 transition"
            >
              Log Reflection & Resume Discipline
            </button>
          </div>
        </div>
      )}

      {/* Edit Limits Modal */}
      {showLimitEditModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Limits"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowLimitEditModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-zinc-100 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-sm">Configure Daily Budgets</h3>
              <button
                onClick={() => setShowLimitEditModal(false)}
                className="text-xs text-zinc-400"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(tempLimits).map(([app, limit]) => (
                <div key={app} className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-zinc-200">{app}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={limit}
                      onChange={e => setTempLimits({ ...tempLimits, [app]: Number(e.target.value) })}
                      className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-center font-mono text-zinc-100"
                    />
                    <span className="text-zinc-500">min</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={async () => {
                await onUpdateAppLimits(tempLimits);
                setShowLimitEditModal(false);
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs mt-2"
            >
              Save Budgets
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
