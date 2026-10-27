import React, { useRef, useState } from 'react';
import { UserSettings } from '../types';
import { exportAllData, importData, clearAllLocalData } from '../utils/db';
import { validateBackupData } from '../utils/calculations';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { BackupGuideModal } from '../components/BackupGuideModal';
import {
  Download,
  Upload,
  Trash2,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onDataRestored: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataRestored
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showBackupGuideModal, setShowBackupGuideModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await exportAllData(settings);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `consistency-os-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMsg({
        type: 'success',
        text: `Backup saved as consistency-os-backup-${dateStr}.json.`
      });
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to export backup file.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validation = validateBackupData(parsed);

      if (!validation.valid || !validation.sanitizedData) {
        setStatusMsg({ type: 'error', text: validation.error || 'Invalid backup file.' });
        return;
      }

      await importData({
        tasks: validation.sanitizedData.tasks,
        taskCompletions: validation.sanitizedData.taskCompletions
      });

      if (validation.sanitizedData.settings) {
        const s = validation.sanitizedData.settings;
        onUpdateSettings({
          ...settings,
          theme: s.theme === 'dark' ? 'dark' : settings.theme,
          startOfWeek: s.startOfWeek === 0 ? 0 : 1
        });
      }

      await onDataRestored();
      setStatusMsg({
        type: 'success',
        text: `Restored ${validation.sanitizedData.tasks.length} tasks and ${validation.sanitizedData.taskCompletions.length} completion records.`
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Could not parse JSON file. Please select a valid Consistency OS backup.'
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetAll = async () => {
    await clearAllLocalData();
    await onDataRestored();
    setConfirmClear(false);
    setStatusMsg({ type: 'success', text: 'All local data has been reset to starter defaults.' });
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Appearance, calendar preferences, and local-first backups
        </p>
      </header>

      {statusMsg && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl border text-xs font-medium ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Display & Calendar Preferences */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        {/* Theme */}
        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Appearance</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Switch between light and dark planner surfaces
            </p>
          </div>
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                settings.theme === 'light'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                settings.theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Start of Week */}
        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Start of Week</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              First column in weekly and monthly calendars
            </p>
          </div>
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, startOfWeek: 1 })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                settings.startOfWeek === 1
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Monday
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, startOfWeek: 0 })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                settings.startOfWeek === 0
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Sunday
            </button>
          </div>
        </div>
      </section>

      {/* Data Backup, Restore & Migration */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Local Data & Backups
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Your tasks and completion records are stored privately on this device. Export a JSON file anytime to back up or transfer between your iPhone and PC.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export JSON'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowBackupGuideModal(true)}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 transition"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Step-by-Step Backup & Device Migration Guide</span>
        </button>

        {/* Reset Data */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset All Local Tasks & History</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2.5">
              <p className="text-xs text-rose-800 dark:text-rose-200 font-medium">
                Reset all tasks and completion history on this device? Make sure you have exported a JSON backup first.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* iPhone Home Screen Installation */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              iPhone Home Screen App
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Works offline in full-screen mode from your iPhone Home Screen
            </p>
          </div>
          <PWAInstallButton compact />
        </div>
      </section>

      <BackupGuideModal
        isOpen={showBackupGuideModal}
        onClose={() => setShowBackupGuideModal(false)}
        onTriggerExport={handleExport}
        onTriggerImportClick={() => fileInputRef.current?.click()}
        isExporting={isExporting}
      />
    </div>
  );
};
