import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Plus, Minus, Bell } from 'lucide-react';
import { getStoredRestTimer, saveStoredRestTimer, ActiveRestTimerState } from '../utils/storage';

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDurationSeconds?: number;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  isOpen,
  onClose,
  defaultDurationSeconds = 90
}) => {
  const [targetSeconds, setTargetSeconds] = useState(defaultDurationSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultDurationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore saved rest timer on initial load
  useEffect(() => {
    const saved = getStoredRestTimer();
    if (saved) {
      if (saved.isRunning) {
        const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
        const rem = Math.max(0, saved.remainingSeconds - elapsed);
        setTargetSeconds(saved.targetSeconds);
        setRemainingSeconds(rem);
        setIsRunning(rem > 0);
        setHasFinished(rem === 0);
      } else {
        setTargetSeconds(saved.targetSeconds);
        setRemainingSeconds(saved.remainingSeconds);
        setIsRunning(false);
      }
    }
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setHasFinished(true);
            saveStoredRestTimer(null);
            // Play gentle web audio chime if supported
            try {
              const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
              osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
              gain.gain.setValueAtTime(0.15, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.6);
            } catch {
              // Ignore audio context errors on browsers blocking autoplay
            }
            return 0;
          }
          const next = prev - 1;
          const currentSaved: ActiveRestTimerState = {
            targetSeconds,
            remainingSeconds: next,
            startedAt: Date.now(),
            isRunning: true
          };
          saveStoredRestTimer(currentSaved);
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, targetSeconds]);

  const handleStart = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(targetSeconds);
    }
    setIsRunning(true);
    setHasFinished(false);
    saveStoredRestTimer({
      targetSeconds,
      remainingSeconds: remainingSeconds === 0 ? targetSeconds : remainingSeconds,
      startedAt: Date.now(),
      isRunning: true
    });
  };

  const handlePause = () => {
    setIsRunning(false);
    saveStoredRestTimer({
      targetSeconds,
      remainingSeconds,
      startedAt: Date.now(),
      isRunning: false
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(targetSeconds);
    setHasFinished(false);
    saveStoredRestTimer(null);
  };

  const adjustTime = (deltaSeconds: number) => {
    const next = Math.max(15, remainingSeconds + deltaSeconds);
    setRemainingSeconds(next);
    if (next > targetSeconds) setTargetSeconds(next);
  };

  const setPreset = (sec: number) => {
    setTargetSeconds(sec);
    setRemainingSeconds(sec);
    setIsRunning(false);
    setHasFinished(false);
    saveStoredRestTimer(null);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressRatio = targetSeconds > 0 ? (targetSeconds - remainingSeconds) / targetSeconds : 0;
  const strokeDashoffset = 283 - 283 * progressRatio;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rest Timer"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-zinc-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm">Workout Rest Timer</h3>
            <p className="text-xs text-zinc-400">Keep rest intervals consistent</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close rest timer"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Circular Progress & Display */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-zinc-800"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className={`transition-all duration-300 ${
                  hasFinished ? 'stroke-amber-400' : 'stroke-emerald-500'
                }`}
                strokeWidth="6"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-bold font-mono tracking-tight text-white tabular-nums">
                {formattedTime}
              </span>
              <span className="text-xs text-zinc-400 mt-1">
                {hasFinished ? 'Rest Complete!' : isRunning ? 'Resting...' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Quick Adjustment buttons */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => adjustTime(-15)}
              className="px-2.5 py-1 text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition"
            >
              -15s
            </button>
            <button
              onClick={() => adjustTime(15)}
              className="px-2.5 py-1 text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition"
            >
              +15s
            </button>
            <button
              onClick={() => adjustTime(30)}
              className="px-2.5 py-1 text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition"
            >
              +30s
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-1.5 mb-5">
          {[45, 60, 90, 120].map(sec => (
            <button
              key={sec}
              onClick={() => setPreset(sec)}
              className={`py-1.5 text-xs font-medium rounded-xl border transition ${
                targetSeconds === sec
                  ? 'border-emerald-500 bg-emerald-950/60 text-emerald-400'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            aria-label="Reset timer"
            className="h-12 w-12 rounded-2xl border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 active:scale-95 transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {isRunning ? (
            <button
              onClick={handlePause}
              className="flex-1 h-12 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center justify-center gap-2 active:scale-98 transition shadow-lg shadow-amber-900/20"
            >
              <Pause className="w-5 h-5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 active:scale-98 transition shadow-lg shadow-emerald-900/20"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{remainingSeconds < targetSeconds && remainingSeconds > 0 ? 'Resume' : 'Start Rest'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
