import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ConstructionPhoto } from '../types';
import { CONSTRUCTION_STAGES } from '../constants/constructionData';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { getScopedProjects, getScopedProperties } from '../services/permissions';
import { 
  Camera, 
  Upload, 
  Search, 
  Filter, 
  Trash2, 
  Maximize2, 
  X, 
  Calendar, 
  User, 
  Layers,
  Info
} from 'lucide-react';

interface PhotoGalleryProps {
  onNavigate: (view: string, id?: string) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ onNavigate }) => {
  const { photos, properties, projects, deletePhoto, addPhoto } = useData();
  const { canUploadSiteUpdates, currentUser } = useAuth();

  const scopedProjects = useMemo(() => getScopedProjects(currentUser, projects), [currentUser, projects]);
  const scopedProperties = useMemo(() => getScopedProperties(currentUser, properties, projects), [currentUser, properties, projects]);
  const scopedProjectIds = useMemo(() => new Set(scopedProjects.map(p => p.id)), [scopedProjects]);
  const scopedPropertyIds = useMemo(() => new Set(scopedProperties.map(p => p.id)), [scopedProperties]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [selectedStageId, setSelectedStageId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox Modal
  const [lightboxPhoto, setLightboxPhoto] = useState<ConstructionPhoto | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadPropertyId, setUploadPropertyId] = useState(scopedProperties[0]?.id || properties[0]?.id || '');
  const [uploadStageId, setUploadStageId] = useState(8);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadedImageData, setUploadedImageData] = useState<string | null>(null);

  const filteredPhotos = photos.filter(ph => {
    if (currentUser.role !== 'admin' && !scopedPropertyIds.has(ph.propertyId) && !scopedProjectIds.has(ph.projectId)) {
      return false;
    }
    const matchesProject = selectedProjectId === 'all' || ph.projectId === selectedProjectId;
    const matchesProperty = selectedPropertyId === 'all' || ph.propertyId === selectedPropertyId;
    const matchesStage = selectedStageId === 'all' || String(ph.stageId) === selectedStageId;
    const matchesSearch = ph.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ph.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ph.unitNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesProperty && matchesStage && matchesSearch;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedImageData) return;

    const prop = properties.find(p => p.id === uploadPropertyId) || properties[0];
    const stage = CONSTRUCTION_STAGES.find(s => s.id === uploadStageId) || CONSTRUCTION_STAGES[7];

    addPhoto({
      projectId: prop.projectId,
      projectName: prop.projectName,
      propertyId: prop.id,
      unitNumber: prop.unitNumber,
      stageId: uploadStageId,
      stageName: stage.name,
      caption: uploadCaption || `Site view for ${prop.unitNumber}`,
      notes: uploadNotes || 'Routine site photograph logged.',
      photoUrl: uploadedImageData,
      uploadedBy: currentUser.name
    });

    setIsUploadOpen(false);
    setUploadedImageData(null);
    setUploadCaption('');
    setUploadNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-600" />
            <span>Construction Site Photo Gallery</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage-wise photographic evidence, material verification, and customer progress documentation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role !== 'customer' && canUploadSiteUpdates && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photograph</span>
            </button>
          )}
        </div>
      </div>

      {/* Storage Advisory Note */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-center gap-2 text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>Local Device Storage:</strong> Uploaded site photographs are stored securely in your browser's local sandbox storage using the HTML5 File API and will remain accessible across refreshes on this device.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search caption, unit, or notes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedPropertyId('all');
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Projects</option>
            {scopedProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Units</option>
            {scopedProperties
              .filter(p => selectedProjectId === 'all' || p.projectId === selectedProjectId)
              .map(p => (
                <option key={p.id} value={p.id}>{p.unitNumber}</option>
              ))}
          </select>

          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Stages</option>
            {CONSTRUCTION_STAGES.map(s => (
              <option key={s.id} value={String(s.id)}>Stage {s.id}: {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredPhotos.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No photographs found for this filter combination.
          </div>
        ) : (
          filteredPhotos.map(photo => (
            <div
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col overflow-hidden group"
            >
              <div className="h-48 bg-slate-100 overflow-hidden relative">
                <img
                  src={photo.photoUrl}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 text-white">
                  <span className="text-[11px] font-mono flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5" /> Lightbox
                  </span>
                  {canUploadSiteUpdates && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(photo.id);
                      }}
                      className="p-1 rounded bg-black/60 hover:bg-rose-600 text-white transition-colors"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                  Stage {photo.stageId}
                </span>
              </div>

              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
                    {photo.caption}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                    {photo.unitNumber}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {photo.notes}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{photo.uploadedBy.split(' ')[0]}</span>
                  <span>{photo.uploadedAt.split('T')[0]}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 text-white">
              <div>
                <h3 className="text-sm font-bold">{lightboxPhoto.caption}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {lightboxPhoto.unitNumber} · Stage {lightboxPhoto.stageId}: {lightboxPhoto.stageName}
                </p>
              </div>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-hidden">
              <img
                src={lightboxPhoto.photoUrl}
                alt={lightboxPhoto.caption}
                className="max-h-[60vh] max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="max-w-xl leading-relaxed text-slate-300">
                <strong>Field Log:</strong> {lightboxPhoto.notes}
              </p>
              <div className="text-[11px] text-slate-400 font-mono shrink-0">
                Recorded by: {lightboxPhoto.uploadedBy} on {lightboxPhoto.uploadedAt.split('T')[0]}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Photo Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Construction Photograph"
        subtitle="Attach photographic evidence to a project unit and construction stage"
        maxWidth="lg"
      >
        <form onSubmit={handleSavePhoto} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Property Unit *
            </label>
            <select
              value={uploadPropertyId}
              onChange={(e) => setUploadPropertyId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {scopedProperties.map(p => (
                <option key={p.id} value={p.id}>{p.unitNumber} ({p.projectName})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Construction Stage *
            </label>
            <select
              value={uploadStageId}
              onChange={(e) => setUploadStageId(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {CONSTRUCTION_STAGES.map(s => (
                <option key={s.id} value={s.id}>Stage {s.id}: {s.name}</option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center">
            {uploadedImageData ? (
              <div className="space-y-2">
                <img
                  src={uploadedImageData}
                  alt="Preview"
                  className="h-44 mx-auto rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => setUploadedImageData(null)}
                  className="text-xs text-rose-600 font-semibold"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleFileSelect}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Caption *
            </label>
            <input
              type="text"
              required
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              placeholder="e.g. Master toilet concealed pipe pressure test"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inspection Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              placeholder="Observation details..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!uploadedImageData}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 shadow-xs"
            >
              Save to Gallery
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) deletePhoto(deleteConfirmId);
        }}
        title="Delete Site Photograph"
        message="Are you sure you want to delete this photograph from your local gallery?"
        confirmText="Delete Photo"
        variant="danger"
      />
    </div>
  );
};
