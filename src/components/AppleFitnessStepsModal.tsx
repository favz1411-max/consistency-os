import React, { useState, useRef, useEffect } from 'react';
import {
  Footprints,
  Smartphone,
  ClipboardPaste,
  FileUp,
  Check,
  Copy,
  Info,
  X
} from 'lucide-react';
import {
  parseStepsFromText,
  parseAppleHealthStepsExport
} from '../utils/calculations';

interface AppleFitnessStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSteps: number;
  targetSteps: number;
  lastSyncSource?: string;
  onSaveSteps: (steps: number, sourceLabel?: string) => void;
  onBatchImportSteps: (entries: Array<{ date: string; steps: number }>, sourceLabel: string) => Promise<void>;
}

export const AppleFitnessStepsModal: React.FC<AppleFitnessStepsModalProps> = ({
  isOpen,
  onClose,
  currentSteps,
  targetSteps,
  lastSyncSource,
  onSaveSteps,
  onBatchImportSteps
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'shortcut' | 'file'>('quick');
  const [stepsInput, setStepsInput] = useState<string>(currentSteps.toString());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStepsInput(currentSteps.toString());
      setStatusMessage(null);
    }
  }, [isOpen, currentSteps]);

  if (!isOpen) return null;

  const baseAppUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://your-app-url.github.io/';

  const shortcutTemplateUrl = `${baseAppUrl}?steps=[Calculation Result]&source=apple_fitness`;

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseStepsFromText(stepsInput);
    if (parsed !== null) {
      onSaveSteps(parsed, 'Manual / Apple Fitness Entry');
      onClose();
    } else {
      setStatusMessage('Please enter a valid step count between 0 and 200,000.');
    }
  };

  const handlePasteFromClipboard = async () => {
    setStatusMessage(null);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const extracted = parseStepsFromText(text);
        if (extracted !== null) {
          setStepsInput(extracted.toString());
          onSaveSteps(extracted, 'Apple Fitness Clipboard');
          setStatusMessage(`Synced ${extracted.toLocaleString()} steps from clipboard!`);
          return;
        } else {
          setStatusMessage('Clipboard did not contain a recognizable step number. Paste it into the box below.');
          return;
        }
      }
      setStatusMessage('Tap inside the Step Count input box and select "Paste" to paste from Apple Fitness.');
    } catch {
      setStatusMessage('Browser blocked automatic clipboard read. Long-press the Step Count input below and tap Paste.');
    }
  };

  const handleCopyShortcutUrl = async () => {
    try {
      await navigator.clipboard.writeText(shortcutTemplateUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setStatusMessage('Copy the URL template shown in the box above.');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      const entries = parseAppleHealthStepsExport(content);

      if (entries.length === 0) {
        setStatusMessage(
          'No step records found in file. Upload an Apple Health export.xml, CSV (YYYY-MM-DD,steps), or JSON file.'
        );
        return;
      }

      await onBatchImportSteps(entries, 'Apple Health / Fitness Export');
      const latest = entries[entries.length - 1];
      setStepsInput(latest.steps.toString());
      setStatusMessage(
        `Imported ${entries.length} day(s) of Apple Fitness step records! Latest (${latest.date}): ${latest.steps.toLocaleString()} steps.`
      );
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Apple Fitness and Daily Steps Sync"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[88vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 shadow-2xl text-zinc-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
              <Footprints className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm sm:text-base">
                Daily Steps & Apple Fitness
              </h3>
              <p className="text-xs text-zinc-400">
                Target: {targetSteps.toLocaleString()} steps · {lastSyncSource || 'Local Record'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Apple Fitness Steps modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs font-medium my-3.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('quick');
              setStatusMessage(null);
            }}
            className={`py-2 px-2 rounded-xl transition whitespace-nowrap ${
              activeTab === 'quick'
                ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Quick Sync
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('shortcut');
              setStatusMessage(null);
            }}
            className={`py-2 px-2 rounded-xl transition whitespace-nowrap ${
              activeTab === 'shortcut'
                ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            iOS Shortcut
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('file');
              setStatusMessage(null);
            }}
            className={`py-2 px-2 rounded-xl transition whitespace-nowrap ${
              activeTab === 'file'
                ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Health Export
          </button>
        </div>

        {statusMessage && (
          <div className="mb-3 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/70 text-xs text-emerald-200 shrink-0">
            {statusMessage}
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar text-xs text-zinc-300">
          {activeTab === 'quick' && (
            <form onSubmit={handleSaveManual} className="space-y-4">
              {/* Honest iOS Disclosure */}
              <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-start gap-2.5 text-[11px] text-zinc-400">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-zinc-200">iOS Safari Note:</strong> Web browsers cannot silently poll Apple HealthKit in the background. Use <strong>Paste from Clipboard</strong>, our <strong>1-Tap iOS Shortcut</strong>, or enter your Apple Fitness step count below.
                </p>
              </div>

              {/* One-Tap Paste from Apple Fitness / Clipboard */}
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="w-full py-3 px-4 rounded-2xl border border-emerald-700/60 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-98"
              >
                <ClipboardPaste className="w-4 h-4 shrink-0" />
                <span>Paste Step Count from Apple Fitness</span>
              </button>

              <div>
                <label htmlFor="apple-fitness-steps-input" className="text-xs text-zinc-400 block mb-1.5">
                  Today's Step Count (Apple Fitness / Pedometer)
                </label>
                <input
                  id="apple-fitness-steps-input"
                  type="text"
                  inputMode="numeric"
                  value={stepsInput}
                  onChange={e => setStepsInput(e.target.value)}
                  placeholder="e.g. 8450"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-base text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Quick Increment Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[1000, 2500, 5000].map(inc => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => {
                      const curr = parseStepsFromText(stepsInput) || 0;
                      setStepsInput((curr + inc).toString());
                    }}
                    className="py-2 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-xs font-mono text-zinc-300 transition active:scale-95"
                  >
                    +{inc.toLocaleString()}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-98 transition shadow-lg shadow-emerald-950/40"
              >
                Save Today's Steps
              </button>
            </form>
          )}

          {activeTab === 'shortcut' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>1-Tap Apple Fitness Shortcut Bridge</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Apple's built-in <strong>Shortcuts</strong> app on your iPhone 12 Pro & 17 Pro has direct permission to read Apple Fitness / Health steps and pass them straight into Consistency OS via a deep link URL.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950/50 border border-zinc-800/70 space-y-2">
                <p className="font-semibold text-zinc-100">Create This 3-Step Shortcut on iPhone:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 leading-relaxed">
                  <li>
                    Open the <strong>Shortcuts</strong> app on your iPhone and tap <strong>+</strong>.
                  </li>
                  <li>
                    Add action <strong>Find Health Samples</strong>: set <em>Type</em> to <strong>Steps</strong> and <em>Start Date</em> to <strong>is Today</strong>.
                  </li>
                  <li>
                    Add action <strong>Calculate Statistics</strong>: choose <strong>Sum</strong> of the Health Samples.
                  </li>
                  <li>
                    Add action <strong>Open URLs</strong> and paste the URL template below (replacing <code>[Calculation Result]</code> with the Sum variable):
                  </li>
                </ol>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-emerald-300 break-all">
                  {shortcutTemplateUrl}
                </div>

                <button
                  type="button"
                  onClick={handleCopyShortcutUrl}
                  className="w-full py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 flex items-center justify-center gap-1.5 transition"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{copiedUrl ? 'Copied URL Template!' : 'Copy Shortcut URL Template'}</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-500">
                Tip: You can even set a <strong>Personal Automation</strong> in the iPhone Shortcuts app (e.g. when closing the Apple Fitness app or at 9:00 PM daily) to run this shortcut automatically.
              </p>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <FileUp className="w-4 h-4 shrink-0" />
                  <span>Import Apple Health / Fitness Export</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Upload an Apple Health <code>export.xml</code> file, or a <code>.csv</code> / <code>.json</code> step export. Consistency OS sums all step samples per day directly on your device.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/70 space-y-1.5 text-zinc-400">
                <p className="font-semibold text-zinc-200">Supported Formats (100% Local Processing):</p>
                <p>• <strong>Apple Health XML (<code>export.xml</code>):</strong> Automatically aggregates <code>HKQuantityTypeIdentifierStepCount</code> records by date.</p>
                <p>• <strong>CSV / JSON:</strong> Rows formatted as <code>YYYY-MM-DD,steps</code> or JSON array <code>[{"{date, steps}"}]</code>.</p>
              </div>

              <label className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-lg shadow-emerald-950/40">
                <FileUp className="w-4 h-4" />
                <span>Select Apple Health XML / CSV / JSON File</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml,.csv,.json,.txt"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
