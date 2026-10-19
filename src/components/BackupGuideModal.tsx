import React, { useState } from 'react';
import {
  Download,
  Upload,
  Smartphone,
  Laptop,
  FolderOpen,
  ShieldCheck,
  AlertCircle,
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
      aria-label="Step-by-Step Backup and Device Migration Guide"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[88vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 shadow-2xl text-zinc-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm sm:text-base">
                Backup & Device Migration Guide
              </h3>
              <p className="text-xs text-zinc-400">
                Move records between iPhone 12 Pro, 17 Pro & Windows PC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close backup guide"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs font-medium my-3.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveStep('export')}
            className={`py-2 px-1 rounded-xl transition whitespace-nowrap ${
              activeStep === 'export'
                ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            1. Export
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('transfer')}
            className={`py-2 px-1 rounded-xl transition whitespace-nowrap ${
              activeStep === 'transfer'
                ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            2. Transfer
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('import')}
            className={`py-2 px-1 rounded-xl transition whitespace-nowrap ${
              activeStep === 'import'
                ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            3. Restore
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('safety')}
            className={`py-2 px-1 rounded-xl transition whitespace-nowrap ${
              activeStep === 'safety'
                ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            4. Safety
          </button>
        </div>

        {/* Scrollable Step Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar text-xs text-zinc-300">
          {activeStep === 'export' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Step 1: Export a Complete Snapshot</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Consistency OS packages all of your habits, streaks, workouts, routines, body measurements, sleep, hydration, and digital discipline logs into a single portable <code className="text-zinc-200 font-mono">.json</code> file.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/70">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-100">On iPhone 12 Pro or iPhone 17 Pro</p>
                    <p className="text-zinc-400 mt-0.5 leading-relaxed">
                      1. Tap <strong>Export JSON</strong> below.<br />
                      2. Safari will prompt: <em>Do you want to download "consistency-os-backup-YYYY-MM-DD.json"?</em><br />
                      3. Tap <strong>Download</strong>. The file is saved directly into your iPhone's built-in <strong>Files</strong> app under the <strong>Downloads</strong> folder.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/70">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    B
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-100">On Your Windows PC</p>
                    <p className="text-zinc-400 mt-0.5 leading-relaxed">
                      1. Click <strong>Export JSON</strong>.<br />
                      2. Your browser will immediately save the file to your Windows <code>Downloads</code> folder.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onTriggerExport}
                disabled={isExporting}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-98 shadow-lg shadow-emerald-950/40"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating Backup File...' : 'Export Backup File Now'}</span>
              </button>
            </div>
          )}

          {activeStep === 'transfer' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Step 2: Move the File to Your Other Device</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Because Consistency OS uses zero cloud servers for privacy, you control how the backup file moves between your devices—no Mac required.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/70 space-y-1">
                  <p className="font-semibold text-zinc-100">
                    Option 1: iPhone 12 Pro ↔ iPhone 17 Pro (AirDrop or iCloud Drive)
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    • <strong>Via iCloud Drive (Automatic):</strong> If both iPhones use the same Apple ID and Safari saves to <em>iCloud Drive → Downloads</em> in the Files app, the exported file will automatically appear on your other iPhone within seconds.<br />
                    • <strong>Via AirDrop:</strong> Open the <strong>Files</strong> app on your first iPhone, long-press the backup file, tap <strong>Share → AirDrop</strong>, and select your other iPhone.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/70 space-y-1">
                  <p className="font-semibold text-zinc-100">
                    Option 2: Windows PC ↔ iPhone (No Mac Needed)
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    • <strong>Google Drive / iCloud Web:</strong> Upload the exported <code>.json</code> file to your Google Drive or iCloud Drive, then download it onto your other device.<br />
                    • <strong>Self-Email:</strong> Attach the <code>.json</code> file to an email to yourself, open the email on your target device, and tap <strong>Save to Files</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'import' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>Step 3: Import & Verify on Target Device</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Importing validates the file structure before updating your device database so malformed or wrong files can never corrupt your records.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/70 space-y-1.5">
                  <p className="font-semibold text-zinc-100">How to Restore:</p>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-400 leading-relaxed">
                    <li>Open <strong>Consistency OS → Settings</strong> on the destination device.</li>
                    <li>Tap <strong>Import JSON</strong> (or use the button below).</li>
                    <li>On iPhone, tap <strong>Choose File</strong> and select your <code>consistency-os-backup-....json</code> file from the <strong>Files</strong> app.</li>
                    <li>Confirm the restore prompt when asked. Your habits, streaks, workouts, and settings will immediately populate.</li>
                  </ol>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onTriggerImportClick();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl border border-emerald-600/60 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-98"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Select Backup JSON File to Import</span>
              </button>
            </div>
          )}

          {activeStep === 'safety' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Data Integrity & Safety Rules</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  How Consistency OS protects your personal history during backups and device switches:
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/70 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-zinc-100">Automatic Schema Validation</p>
                    <p className="text-zinc-400 mt-0.5">
                      Every imported file is checked for valid version headers and collection arrays before touching your database.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/70 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-zinc-100">Duplicate-Import Protection</p>
                    <p className="text-zinc-400 mt-0.5">
                      Importing a backup cleanly replaces object stores by unique ID so importing the same file twice will never create duplicate habits or workouts.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-900/40 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-300">Recommended Weekly Routine</p>
                    <p className="text-zinc-400 mt-0.5">
                      Export a backup once a week (e.g., Sunday evening) and before clearing Safari browser cache or upgrading phones.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="pt-4 mt-3 border-t border-zinc-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-400 hover:text-white transition"
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
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 flex items-center gap-1.5 transition"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
