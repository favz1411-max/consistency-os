import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        aria-label="Install Consistency OS"
        className={`flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white font-medium text-white dark:text-slate-900 shadow-2xs hover:opacity-90 transition-all whitespace-nowrap shrink-0 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs'
        }`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowIOSGuide(true)}
        aria-label="Add to iPhone Home Screen"
        className={`flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all whitespace-nowrap shrink-0 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
        }`}
      >
        <Share2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>Add to Home Screen</span>
      </button>

      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add to iPhone Home Screen Guide"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl text-slate-900 dark:text-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-semibold text-sm">Add to iPhone Home Screen</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">iPhone Safari Installation</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close guide"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="font-mono font-semibold text-slate-900 dark:text-white">01.</span>
                <p>
                  Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-0.5" /> in Safari’s bottom toolbar.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="font-mono font-semibold text-slate-900 dark:text-white">02.</span>
                <p>
                  Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-0.5" /> <strong>Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="font-mono font-semibold text-slate-900 dark:text-white">03.</span>
                <p>
                  Tap <strong>Add</strong> in the top-right corner to launch Consistency OS as a full-screen offline planner.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 dark:bg-white py-2.5 text-xs font-semibold text-white dark:text-slate-900 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
