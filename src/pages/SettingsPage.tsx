import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { PACKAGE_DEFINITIONS } from '../constants/constructionData';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { 
  Settings, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldAlert, 
  Database, 
  CheckCircle2, 
  Layers,
  FileText
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { exportJSON, importJSON, resetDemoData, projects, properties, tasks, photos } = useData();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleExport = () => {
    const jsonStr = exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arthibuild-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const res = importJSON(content);
          setImportStatus(res);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-600" />
          <span>System Settings & Data Management</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Local browser persistence controls, JSON backup/restore, and package configuration
        </p>
      </div>

      {importStatus && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          importStatus.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <span>{importStatus.message}</span>
          <button onClick={() => setImportStatus(null)} className="font-bold px-2 py-0.5">Dismiss</button>
        </div>
      )}

      {/* Storage & Architecture Disclaimer Card */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Database className="w-4 h-4 text-amber-600" />
          <span>Browser Local Storage Architecture</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          As specified by the application constraints, ArthiBuild operates completely frontend-only without external SQL or cloud database servers. All records—including projects, units, custom packages, stage tasks, site photo previews, and delivery forecasts—persist reliably in your browser's <code>localStorage</code> sandbox.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono text-slate-700">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Projects</span>
            <span className="text-sm font-bold text-slate-900">{projects.length} Active</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Units</span>
            <span className="text-sm font-bold text-slate-900">{properties.length} Total</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Tasks</span>
            <span className="text-sm font-bold text-slate-900">{tasks.length} Tracked</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Site Photos</span>
            <span className="text-sm font-bold text-slate-900">{photos.length} Captured</span>
          </div>
        </div>
      </div>

      {/* Backup and Restore Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Backup & Restore Demo State</h2>
          <p className="text-xs text-slate-500 mt-0.5">Export full JSON snapshot or import existing data files</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Application State (JSON)</span>
          </button>

          <label className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import State from JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reset Demo Data Factory Defaults */}
      <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Reset Application to Seed State</span>
        </div>
        <p className="text-xs text-slate-600">
          Restore all projects, properties, sample customization requests, and delivery forecasts to the initial demo seeding (Emerald Heights, Green Valley Villas, Solitaire House). Any custom registered units will be cleared.
        </p>
        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset to Factory Demo Seeds</span>
        </button>
      </div>

      {/* Package Definitions Master Reference */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Construction Packages Master Reference</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(PACKAGE_DEFINITIONS).map(([key, pkg]) => (
            <div key={key} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-slate-900">{pkg.name}</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{pkg.description}</p>
              <div className="text-[11px] text-slate-500 font-mono pt-1">
                Typical Schedule: <strong>{pkg.targetTimelineWeeks} weeks</strong> · Scope: <strong>{pkg.activityIds.length} activities</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetDemoData}
        title="Reset All Application Data"
        message="Are you sure you want to restore factory demo data? All newly registered projects, units, and custom tasks will be replaced by the seeded demonstration dataset."
        confirmText="Confirm Reset"
        variant="danger"
      />
    </div>
  );
};
