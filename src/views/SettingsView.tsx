import React, { useState, useRef } from 'react';
import { UserSettings } from '../types';
import { exportAllData, importData, clearAllLocalData } from '../utils/db';
import { validateBackupData } from '../utils/calculations';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { BackupGuideModal } from '../components/BackupGuideModal';
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Shield,
  Smartphone,
  Globe,
  Sliders,
  Check,
  AlertTriangle,
  Info,
  ExternalLink,
  Lock,
  BookOpen,
  Footprints,
  X
} from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onDataReload: () => Promise<void>;
  onOpenStepsModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataReload,
  onOpenStepsModal
}) => {
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [showBackupGuide, setShowBackupGuide] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states for local preferences
  const [waterTarget, setWaterTarget] = useState<number>(settings.waterTargetMl);
  const [sleepTargetHours, setSleepTargetHours] = useState<number>(settings.sleepTargetMinutes / 60);

  const handleSavePreferences = () => {
    onUpdateSettings({
      ...settings,
      waterTargetMl: waterTarget,
      sleepTargetMinutes: Math.round(sleepTargetHours * 60)
    });
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const json = await exportAllData(settings);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `consistency-os-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export data: ' + String(e));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateBackupData(parsed);

        if (!validation.valid || !validation.sanitizedData) {
          setImportStatus(`Import Error: ${validation.error || 'Invalid format'}`);
          return;
        }

        if (confirm('Importing this backup will overwrite current local records with the backup file data. Continue?')) {
          await importData(validation.sanitizedData);
          if (validation.sanitizedData.settings) {
            onUpdateSettings({
              ...settings,
              ...(validation.sanitizedData.settings as UserSettings)
            });
          }
          await onDataReload();
          setImportStatus('Backup successfully imported! All records updated.');
        }
      } catch (err) {
        setImportStatus('Failed to parse JSON file. Ensure you uploaded a valid Consistency OS backup.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmClearAll = async () => {
    await clearAllLocalData();
    await onDataReload();
    setShowClearConfirmModal(false);
    alert('All personal records cleared. Default seed habits and routines restored.');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings & Privacy</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Local-first storage controls, system targets, and deployment guidance
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-5 space-y-6 lg:space-y-0 items-start">
      {/* PWA Home Screen Installation & Apple Fitness Section */}
      <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>iPhone PWA & Apple Fitness</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Home Screen install & Apple Fitness step count bridge
            </p>
          </div>
          <PWAInstallButton compact />
        </div>

        <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80 text-xs text-zinc-400 space-y-1">
          <p>• <strong>iPhone 12 Pro & 17 Pro:</strong> Open in Safari, tap the <em>Share</em> button, and select <em>Add to Home Screen</em>.</p>
          <p>• <strong>Offline Caching:</strong> All assets, scripts, and local IndexedDB operate with 100% offline support after initial load.</p>
        </div>

        <button
          type="button"
          onClick={onOpenStepsModal}
          className="w-full py-2.5 px-3.5 rounded-2xl border border-emerald-800/70 bg-emerald-950/30 hover:bg-emerald-900/40 text-xs font-medium text-emerald-300 transition flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-emerald-400" />
            <span>Configure Apple Fitness Step Count Sync & Import</span>
          </span>
          <span className="text-emerald-400 font-semibold">Open →</span>
        </button>
      </section>

      {/* Targets & Unit Preferences */}
      <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Targets & Units</span>
        </h2>

        {/* Unit System */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-medium text-zinc-200">Measurement System</p>
            <p className="text-zinc-500">Weight and distance units</p>
          </div>
          <div className="flex items-center bg-zinc-950 rounded-xl p-1 border border-zinc-800 shrink-0">
            <button
              onClick={() => onUpdateSettings({ ...settings, unitSystem: 'metric' })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                settings.unitSystem === 'metric'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Metric (kg/cm)
            </button>
            <button
              onClick={() => onUpdateSettings({ ...settings, unitSystem: 'imperial' })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                settings.unitSystem === 'imperial'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Imperial (lb/in)
            </button>
          </div>
        </div>

        {/* Daily Water Target */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
          <div>
            <p className="font-medium text-zinc-200">Daily Water Target</p>
            <p className="text-zinc-500">Target intake in millilitres</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="100"
              min="500"
              max="6000"
              value={waterTarget}
              onChange={e => setWaterTarget(Number(e.target.value))}
              onBlur={handleSavePreferences}
              className="w-20 rounded-xl border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-center font-mono text-zinc-100"
            />
            <span className="text-zinc-500">ml</span>
          </div>
        </div>

        {/* Daily Sleep Target */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
          <div>
            <p className="font-medium text-zinc-200">Daily Sleep Target</p>
            <p className="text-zinc-500">Target sleep duration</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              min="4"
              max="12"
              value={sleepTargetHours}
              onChange={e => setSleepTargetHours(Number(e.target.value))}
              onBlur={handleSavePreferences}
              className="w-20 rounded-xl border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-center font-mono text-zinc-100"
            />
            <span className="text-zinc-500">hours</span>
          </div>
        </div>

        {/* Start of Week */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
          <div>
            <p className="font-medium text-zinc-200">Start of Week</p>
            <p className="text-zinc-500">Calendar view starting day</p>
          </div>
          <div className="flex items-center bg-zinc-950 rounded-xl p-1 border border-zinc-800">
            <button
              onClick={() => onUpdateSettings({ ...settings, startOfWeek: 1 })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                settings.startOfWeek === 1
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monday
            </button>
            <button
              onClick={() => onUpdateSettings({ ...settings, startOfWeek: 0 })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                settings.startOfWeek === 0
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sunday
            </button>
          </div>
        </div>
      </section>

      {/* Data Privacy & Local-First Philosophy */}
      <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Local Data Privacy Notice</span>
        </h2>
        <div className="space-y-2 text-xs text-zinc-300">
          <p>
            <strong>Zero Remote Upload:</strong> 100% of your personal health, weight, habits, workouts, and screen time records reside locally inside your device's browser IndexedDB database.
          </p>
          <p>
            <strong>Storage Warning:</strong> If you clear Safari website data or lose your device, locally stored data will be wiped. Keep regular offline JSON exports using the Backup button below.
          </p>
          <p className="text-zinc-500 text-[11px]">
            No advertisements. No tracking pixels. No runtime cloud database. No analytics.
          </p>
        </div>
      </section>

      {/* Backup & Restore Section */}
      <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Backup & Migration</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowBackupGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-800/80 bg-emerald-950/50 hover:bg-emerald-900/60 text-xs font-medium text-emerald-300 transition active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Migration Guide</span>
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Transfer your records between Windows, iPhone 12 Pro, and iPhone 17 Pro by exporting and importing a single JSON backup.
        </p>

        {importStatus && (
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-700 text-xs text-zinc-200">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 font-semibold text-xs text-zinc-100 flex items-center justify-center gap-2 transition active:scale-95 border border-zinc-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isExporting ? 'Exporting...' : 'Export JSON'}</span>
          </button>

          <label className="py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 font-semibold text-xs text-zinc-100 flex items-center justify-center gap-2 transition active:scale-95 border border-zinc-700 cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import JSON</span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {/* Step-by-Step Instructions Banner Button */}
        <button
          type="button"
          onClick={() => setShowBackupGuide(true)}
          className="w-full py-2.5 px-3.5 rounded-2xl border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 text-xs font-medium text-zinc-300 hover:text-white transition flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Step-by-Step Backup & Device Migration Instructions</span>
          </span>
          <span className="text-emerald-400 font-semibold">Open →</span>
        </button>

        {/* Clear Data Button */}
        <div className="pt-2 border-t border-zinc-800">
          <button
            onClick={() => setShowClearConfirmModal(true)}
            className="w-full py-2.5 rounded-xl border border-red-900/40 bg-red-950/20 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Application & Clear Data</span>
          </button>
        </div>
      </section>

      {/* Free Static Hosting (GitHub Pages) Guide */}
      <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Free Static Hosting Guide (GitHub Pages)</span>
        </h2>
        <div className="space-y-2 text-xs text-zinc-300">
          <p>
            <strong>Hosting vs Data Storage:</strong> GitHub Pages serves the static application bundle (HTML, JS, CSS, PWA service worker) over free HTTPS. It does <em>not</em> store any of your data. Your data lives exclusively on your iPhone inside IndexedDB.
          </p>
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
            <p>1. Push this project to <code>github.com/favz1411-max/consistency-os</code> on the <code>main</code> branch.</p>
            <p>2. In GitHub, open <strong>Settings → Pages</strong>.</p>
            <p>3. Under <strong>Build and deployment</strong>, set <strong>Source</strong> to <strong>GitHub Actions</strong>.</p>
            <p>4. The included <code>.github/workflows/deploy.yml</code> workflow will automatically build and publish your app to <code>https://favz1411-max.github.io/consistency-os/</code>.</p>
          </div>
        </div>
      </section>
      </div>

      {/* App Version Info */}
      <div className="text-center text-xs text-zinc-600 font-mono">
        Consistency OS v{settings.appVersion} · Zero Cloud Footprint · Pure Offline PWA
      </div>

      {/* Step-by-Step Backup & Device Migration Modal */}
      <BackupGuideModal
        isOpen={showBackupGuide}
        onClose={() => setShowBackupGuide(false)}
        onTriggerExport={handleExportJSON}
        onTriggerImportClick={() => fileInputRef.current?.click()}
        isExporting={isExporting}
      />

      {/* Safety Clear Confirmation Modal */}
      {showClearConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Clear Data"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowClearConfirmModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-zinc-100 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-white">Clear All Local Data?</h3>
              <p className="text-xs text-zinc-300">
                This will irreversibly delete all habits, logs, workouts, body measurements, and digital discipline sessions on this device.
              </p>
            </div>

            <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <p>• We recommend exporting a JSON backup before proceeding.</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-200"
              >
                Export JSON Backup First
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClearAll}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs active:scale-95 transition"
                >
                  Clear Everything
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
