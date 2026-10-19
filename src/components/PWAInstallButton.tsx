import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running standalone on Home Screen, no need to show install banner
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop standard install
  if (isInstallable) {
    return (
      <button
        onClick={install}
        aria-label="Install Consistency OS"
        className={`flex items-center gap-2 rounded-xl bg-emerald-600 font-medium text-white shadow-sm hover:bg-emerald-500 active:scale-95 transition-all whitespace-nowrap shrink-0 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        }`}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (Apple doesn't support beforeinstallprompt, requires Share -> Add to Home Screen)
  return (
    <>
      <button
        onClick={() => setShowIOSGuide(true)}
        aria-label="Install on iPhone Home Screen"
        className={`flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 font-medium text-zinc-200 hover:bg-zinc-700 active:scale-95 transition-all whitespace-nowrap shrink-0 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
        }`}
      >
        <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Add to iPhone</span>
      </button>

      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add to iPhone Home Screen Guide"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-zinc-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  C
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">Install on iPhone</h3>
                  <p className="text-xs text-zinc-400">iPhone 12 Pro & 17 Pro Safari</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close guide"
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-zinc-300">
              <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-medium text-zinc-200">Tap Safari's Share Button</p>
                  <p className="text-zinc-400 mt-0.5">
                    Look for the square icon with an upward arrow <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-zinc-300" /> in the bottom Safari toolbar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="font-medium text-zinc-200">Select "Add to Home Screen"</p>
                  <p className="text-zinc-400 mt-0.5">
                    Scroll down the sharing sheet menu and tap <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-zinc-300" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-xs">
                  3
                </div>
                <div>
                  <p className="font-medium text-zinc-200">Tap "Add" in Top Right</p>
                  <p className="text-zinc-400 mt-0.5">
                    Consistency OS will appear as an app icon on your home screen with offline caching.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-2xl bg-zinc-800 py-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 active:scale-98 transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
