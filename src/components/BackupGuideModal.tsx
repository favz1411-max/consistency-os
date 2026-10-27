import React, { useState } from 'react';
import {
  Download,
  Upload,
  Smartphone,
  FolderOpen,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  X,
  FileJson
} from 'lucide-react';

interface BackupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerExport: () => Promise<void>;
  onTriggerImportClick: () => void;
  isExporting?: boolean;
}

export const BackupGuideModal: React.FC<BackupGuideModalProps> = ({
  isOpen,
  onClose,
  onTriggerExport,
  onTriggerImportClick,
  isExporting = false
}) => {
  const [activeStep, setActiveStep] = useState<'export' | 'transfer' | 'import' | 'safety'>('export');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Backup and Device Migration Guide"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 dark:bg-black/75 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[86vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl text-slate-900 dark:text-slate-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">
                Backup & Device Transfer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Move your tasks & history between iPhone and PC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close backup guide"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium my-4 shrink-0">
          {(
            [
              { id: 'export', label: '1. Export' },
              { id: 'transfer', label: '2. Transfer' },
              { id: 'import', label: '3. Restore' },
              { id: 'safety', label: '4. Safety' }
            ] as const
          ).map(step => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id)}
              className={`py-2 px-1 rounded-lg transition whitespace-nowrap ${
                activeStep === step.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar text-xs text-slate-600 dark:text-slate-300">
          {activeStep === 'export' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Step 1: Export a Backup File</span>
                </div>
                <p className="leading-relaxed">
                  Consistency OS exports all of your tasks, recurring schedules, completion history, and preferences into a single portable <code className="font-mono">.json</code> file.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-white">On iPhone (Safari or Home Screen App)</p>
                  <p className="mt-1 leading-relaxed">
                    Tap <strong>Export Backup File Now</strong> below, then tap <strong>Download</strong> when prompted. Your file is saved in the iPhone <strong>Files</strong> app under <strong>Downloads</strong>.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-white">On Windows PC</p>
                  <p className="mt-1 leading-relaxed">
                    Click <strong>Export Backup File Now</strong> to save the JSON file directly to your <code>Downloads</code> folder.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onTriggerExport}
                disabled={isExporting}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating Backup...' : 'Export Backup File Now'}</span>
              </button>
            </div>
          )}

          {activeStep === 'transfer' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Step 2: Send to Your Other Device</span>
                </div>
                <p className="leading-relaxed">
                  Your data stays strictly on your devices—no account or cloud server is required.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">iPhone ↔ iPhone</p>
                <p className="leading-relaxed">
                  Use <strong>AirDrop</strong> from the Files app, or save the file into <strong>iCloud Drive</strong> so it appears automatically on your second iPhone.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">Windows PC ↔ iPhone</p>
                <p className="leading-relaxed">
                  Upload the <code>.json</code> file to Google Drive, iCloud Drive Web, or email it to yourself and save it to the Files app on your iPhone.
                </p>
              </div>
            </div>
          )}

          {activeStep === 'import' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>Step 3: Restore Backup</span>
                </div>
                <p className="leading-relaxed">
                  Select your backup JSON file to restore all tasks, recurring schedules, and completion records.Legacy v1 habit backups are also automatically migrated.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onTriggerImportClick();
                  onClose();
                }}
                className="w-full py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Choose Backup File to Import</span>
              </button>
            </div>
          )}

          {activeStep === 'safety' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Local-First Data Protection</span>
                </div>
                <p className="leading-relaxed">
                  How Consistency OS keeps your task schedule safe:
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-slate-900 dark:text-white shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Dual Persistence (IndexedDB + LocalStorage)</p>
                  <p className="mt-0.5">
                    Every task and completion is saved to both IndexedDB and localStorage so reopening the Home Screen app never loses recent changes.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-slate-900 dark:text-white shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Legacy Habit Compatibility</p>
                  <p className="mt-0.5">
                    Importing an older Consistency OS v1 backup automatically converts your habits and completion logs into daily/weekly tasks.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            Close
          </button>

          {activeStep !== 'safety' ? (
            <button
              type="button"
              onClick={() => {
                const order: Array<'export' | 'transfer' | 'import' | 'safety'> = [
                  'export',
                  'transfer',
                  'import',
                  'safety'
                ];
                const nextIdx = order.indexOf(activeStep) + 1;
                if (nextIdx < order.length) setActiveStep(order[nextIdx]);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 transition"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
