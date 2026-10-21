import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { CONSTRUCTION_STAGES } from '../constants/constructionData';
import { TaskStatus } from '../types';
import { getScopedProperties } from '../services/permissions';
import { 
  Hammer, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Sparkles,
  FileText
} from 'lucide-react';

interface SiteUpdateProps {
  onNavigate: (view: string, id?: string) => void;
}

export const SiteUpdate: React.FC<SiteUpdateProps> = ({ onNavigate }) => {
  const { properties, tasks, projects, updateTask, addPhoto } = useData();
  const { currentUser } = useAuth();

  const scopedProperties = useMemo(() => getScopedProperties(currentUser, properties, projects), [currentUser, properties, projects]);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(scopedProperties[0]?.id || properties[0]?.id || '');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('In Progress');
  const [blockedReason, setBlockedReason] = useState('');
  const [progressNote, setProgressNote] = useState('');

  // Photo Upload State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoNotes, setPhotoNotes] = useState('');
  const [photoStageId, setPhotoStageId] = useState<number>(8);

  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentProperty = properties.find(p => p.id === selectedPropertyId) || properties[0];
  const unitTasks = tasks.filter(t => t.propertyId === selectedPropertyId);

  // Handle local image file selection using browser FileReader API
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size is too large (max 5MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessNotice(null);
    setErrorMessage(null);

    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      const updatedNotes = progressNote.trim() 
        ? [...(task?.progressNotes || []), `[${new Date().toISOString().split('T')[0]} - ${currentUser.name}] ${progressNote.trim()}`]
        : task?.progressNotes;

      const result = updateTask(selectedTaskId, {
        status: taskStatus,
        blockedReason: taskStatus === 'Blocked' ? (blockedReason || 'Site dependency delay') : undefined,
        progressNotes: updatedNotes
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to update task.');
        return;
      }
    }

    // If photo uploaded, save photo
    if (photoPreview) {
      const stage = CONSTRUCTION_STAGES.find(s => s.id === photoStageId) || CONSTRUCTION_STAGES[7];
      addPhoto({
        projectId: currentProperty.projectId,
        projectName: currentProperty.projectName,
        propertyId: currentProperty.id,
        unitNumber: currentProperty.unitNumber,
        stageId: photoStageId,
        stageName: stage.name,
        taskId: selectedTaskId || undefined,
        caption: photoCaption || `Site progress inspection for ${currentProperty.unitNumber}`,
        notes: photoNotes || progressNote || 'Inspected on site by coordinator.',
        photoUrl: photoPreview,
        uploadedBy: currentUser.name
      });
    }

    setSuccessNotice(`Daily site log & photo successfully recorded for ${currentProperty.unitNumber}. Delivery forecast automatically recalculated.`);
    setProgressNote('');
    setBlockedReason('');
    setPhotoPreview(null);
    setPhotoCaption('');
    setPhotoNotes('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Hammer className="w-5 h-5 text-amber-600" />
          <span>Site Daily Log & Field Progress Update</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Fast site engineer tool: update active milestones, upload real site photos, and report material delays
        </p>
      </div>

      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-800 font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-xs text-rose-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-800 font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-6">
        {/* Step 1: Target Unit Selection */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-mono flex items-center justify-center">1</span>
            <span>Select Active Construction Unit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Unit *
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                  setSelectedTaskId('');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 bg-white"
              >
                {scopedProperties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.unitNumber} ({p.projectName}) — {p.packageType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Construction Task (Optional)
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  const tId = e.target.value;
                  setSelectedTaskId(tId);
                  const found = unitTasks.find(t => t.id === tId);
                  if (found) {
                    setTaskStatus(found.status);
                    setPhotoStageId(found.stageId);
                  }
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 bg-white"
              >
                <option value="">General Site Photo / Progress (No specific task)</option>
                {unitTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    Stage {t.stageId}: {t.title} [{t.status}]
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Status & Delay Updates (if task selected) */}
        {selectedTaskId && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-mono flex items-center justify-center">2</span>
              <span>Task Status & Field Remarks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Updated Task Status *
                </label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="In Progress">In Progress (Work active on site)</option>
                  <option value="Blocked">Blocked (Impediment / Material delay)</option>
                  <option value="Awaiting Approval">Awaiting Approval (Coordinator ready for PM audit)</option>
                  <option value="Completed">Completed (Satisfies dependency checks)</option>
                </select>
              </div>

              {taskStatus === 'Blocked' && (
                <div>
                  <label className="block text-xs font-semibold text-rose-700 mb-1">
                    Delay / Blocked Reason *
                  </label>
                  <input
                    type="text"
                    required
                    value={blockedReason}
                    onChange={(e) => setBlockedReason(e.target.value)}
                    placeholder="e.g. Awaiting marble batch delivery from quarry"
                    className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg bg-white text-rose-900"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Progress Note / Inspection Remarks
              </label>
              <textarea
                rows={2}
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder="e.g. Living room wall plaster completed with 1:4 cement mix. Curing schedule started."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Photo Upload Section */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-mono flex items-center justify-center">3</span>
            <span>Attach Construction Site Photograph</span>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-slate-400 transition-colors bg-slate-50/50">
            {photoPreview ? (
              <div className="space-y-3">
                <div className="max-w-md mx-auto h-52 rounded-lg overflow-hidden border border-slate-200 relative bg-black/5">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded hover:bg-slate-900"
                  >
                    Remove Photo
                  </button>
                </div>
                <div className="text-xs text-emerald-700 font-semibold">
                  Photo loaded from local device via Browser File API
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Select image from your device / camera
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  JPG, PNG, WebP up to 5MB. Stored locally in browser session storage.
                </p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {photoPreview && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Photo Caption
                </label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="e.g. Master bedroom flooring completed"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associated Construction Stage
                </label>
                <select
                  value={photoStageId}
                  onChange={(e) => setPhotoStageId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {CONSTRUCTION_STAGES.map(s => (
                    <option key={s.id} value={s.id}>
                      Stage {s.id}: {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            Logged by: {currentUser.name} ({currentUser.title})
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Commit Site Log & Recalculate Forecast</span>
          </button>
        </div>
      </form>
    </div>
  );
};
