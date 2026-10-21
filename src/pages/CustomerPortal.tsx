import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { STANDARD_ACTIVITIES, PACKAGE_DEFINITIONS } from '../constants/constructionData';
import { calculatePropertyDeliveryForecast } from '../services/estimationEngine';
import { ProgressBar } from '../components/common/ProgressBar';
import { PropertyStatusBadge, PackageBadge, TaskStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { 
  Home, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Camera, 
  Sliders, 
  Plus, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Award,
  ChevronRight,
  Sparkles,
  Check,
  X,
  Printer,
  LogOut,
  MapPin,
  Layers,
  Building
} from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

interface CustomerPortalProps {
  onNavigate: (view: string, id?: string) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onNavigate }) => {
  const { properties, projects, tasks, customizations, photos, handovers, submitCustomization, customerDecisionCustomization } = useData();
  const { currentUser, role, logout } = useAuth();

  // Find customer's assigned property (default to Flat A-301 if not customer role or test preview)
  const targetPropertyId = currentUser.assignedPropertyId || 'PROP-EH-A301';
  const property = properties.find(p => p.id === targetPropertyId) || properties[0];

  const propTasks = tasks.filter(t => t.propertyId === property?.id);
  const propCustomizations = customizations.filter(c => c.propertyId === property?.id);
  const propPhotos = photos.filter(ph => ph.propertyId === property?.id);
  const propHandover = handovers.find(h => h.propertyId === property?.id);

  const site = projects.find(pr => pr.id === property?.projectId);
  const stateName = property?.state || site?.state || 'Tamil Nadu';
  const cityName = property?.city || site?.city || 'Chennai';
  const localityName = property?.locality || site?.locality || 'OMR';
  const siteName = property?.siteName || site?.name || property?.projectName;

  const forecast = property ? calculatePropertyDeliveryForecast(property, propTasks, customizations) : null;

  // Customization Request Form State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqCategory, setReqCategory] = useState<any>('Kitchen');
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');

  if (!property || !forecast) {
    return (
      <div className="text-center py-16 text-slate-500">
        No assigned property found.
      </div>
    );
  }

  const daysToDelivery = Math.max(0, differenceInCalendarDays(parseISO(forecast.currentEstimatedDate), new Date()));
  const isHandedOver = property.status === 'Handed Over';

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;

    submitCustomization({
      propertyId: property.id,
      unitNumber: property.unitNumber,
      projectId: property.projectId,
      customerId: property.customerId,
      customerName: property.customerName,
      category: reqCategory,
      title: reqTitle,
      description: reqDesc,
      estimatedCost: 0,
      scheduleImpactDays: 0
    });

    setIsRequestModalOpen(false);
    setReqTitle('');
    setReqDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner for Customer */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Verified Customer Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {property.customerName}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Your home at <strong className="text-white">{property.projectName}</strong> ({property.unitNumber}) is being built with precision by Arthi Construction.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Request Customization</span>
            </button>

            <button
              onClick={logout}
              className="px-3.5 py-2.5 text-xs font-semibold text-rose-300 hover:text-white bg-slate-800/90 hover:bg-rose-600 border border-slate-700 hover:border-rose-600 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Log out of Customer Portal"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Geographical Location Hierarchy Dossier */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <MapPin className="w-4 h-4" />
            </div>
            <span>Property Location & Geographical Hierarchy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-100 text-slate-700 font-medium">
              <Layers className="w-3 h-3 text-slate-500" />
              <span>{property.propertyType}</span>
            </span>
            {site?.latitude && site?.longitude && (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 hidden sm:inline-flex items-center gap-1">
                <span>GPS:</span>
                <span className="text-slate-800">{site.latitude.toFixed(4)}° N, {site.longitude.toFixed(4)}° E</span>
              </span>
            )}
          </div>
        </div>

        {/* Hierarchy Breadcrumb Strip */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-medium flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase">State</span>
            <strong className="text-slate-800">{stateName}</strong>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <div className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-medium flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase">City</span>
            <strong className="text-slate-800">{cityName}</strong>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <div className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-medium flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase">Area</span>
            <strong className="text-slate-800">{localityName}</strong>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <div className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-medium flex items-center gap-1">
            <span className="text-[10px] text-amber-600 font-mono uppercase">Site</span>
            <strong className="text-amber-950">{siteName}</strong>
          </div>

          {(property.buildingName || property.floorNumber !== undefined) && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <div className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-medium flex items-center gap-1">
                {property.buildingName && <span>Wing <strong className="text-slate-800">{property.buildingName}</strong></span>}
                {property.floorNumber !== undefined && (
                  <span>· Floor <strong className="text-slate-800">{property.floorNumber === 0 ? 'Ground' : property.floorNumber}</strong></span>
                )}
              </div>
            </>
          )}

          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <div className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold flex items-center gap-1">
            <span className="text-[10px] text-emerald-600 font-mono uppercase">Unit</span>
            <span>{property.unitNumber}</span>
          </div>
        </div>

        {site?.address && (
          <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Site Address: {site.address}{site.pincode ? ` - ${site.pincode}` : ''}</span>
          </p>
        )}
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Progress</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{property.overallProgress}%</div>
          <div className="mt-2">
            <ProgressBar progress={property.overallProgress} verifiedProgress={property.verifiedProgress} showLabel={false} size="sm" />
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {property.verifiedProgress}% PM Verified
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Handover Date</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{forecast.currentEstimatedDate}</div>
          <div className="text-xs text-amber-700 font-mono mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{isHandedOver ? 'Possession Granted' : `~${daysToDelivery} calendar days remaining`}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contracted Package</div>
          <div className="mt-1">
            <PackageBadge packageType={property.packageType} />
          </div>
          <div className="text-xs text-slate-600 mt-2 line-clamp-1">
            {property.areaSqFt} sq.ft · Carpet area
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Site Civil Lead</div>
          <div className="text-sm font-bold text-slate-900 mt-1">{property.assignedCoordinatorName}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" />
            <span className="font-mono">+91 98403 45672</span>
          </div>
        </div>
      </div>

      {/* Handover Possession Certificate Alert if Handed Over */}
      {isHandedOver && propHandover && (
        <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-sm text-emerald-950 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 text-white rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-emerald-900">
                  Congratulations! Possession Granted & Handed Over
                </h3>
                <p className="text-xs text-emerald-800">
                  Official Possession Certificate #{propHandover.handoverCertificateId} issued on {propHandover.handoverDate}.
                </p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Certificate</span>
            </button>
          </div>
        </div>
      )}

      {/* Pending Proposals Needing Customer Action */}
      {propCustomizations.filter(c => c.status === 'Awaiting Customer Approval').map(req => (
        <div key={req.id} className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                ACTION REQUIRED: Customization Proposal Ready
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1.5">{req.title}</h3>
              <p className="text-xs text-slate-700 mt-0.5">{req.description}</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
              Awaiting Your Decision
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center gap-4 font-mono">
              <span>Quoted Cost: <strong className="text-slate-900 text-sm">₹{req.estimatedCost.toLocaleString()}</strong></span>
              <span>·</span>
              <span>Timeline Impact: <strong className="text-rose-600 font-bold">+{req.scheduleImpactDays} days</strong></span>
            </div>
            {req.managerRemarks && (
              <p className="text-slate-600 text-[11px] leading-relaxed">
                <strong>Project Manager Note:</strong> {req.managerRemarks}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={() => customerDecisionCustomization(req.id, 'Rejected', 'Customer declined quotation proposal.')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg"
            >
              Decline Proposal
            </button>
            <button
              onClick={() => customerDecisionCustomization(req.id, 'Approved', 'Quotation and schedule impact accepted.')}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Approve & Update Delivery Schedule</span>
            </button>
          </div>
        </div>
      ))}

      {/* Main Split: Milestones Tracker & Latest Site Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Milestone Tracker */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Construction Milestones Roadmap</h2>
              <p className="text-xs text-slate-500 mt-0.5">Stage-wise progress for your {property.packageType}</p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              {propTasks.filter(t => t.status === 'Completed').length} / {propTasks.length} Completed
            </span>
          </div>

          <div className="space-y-3">
            {propTasks.map(task => (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.status === 'Completed'
                    ? 'bg-emerald-50/30 border-emerald-200/80'
                    : task.status === 'In Progress'
                    ? 'bg-sky-50/40 border-sky-200'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Stage {task.stageId}
                    </span>
                    <span className="font-bold text-slate-900">{task.title}</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 text-[11px]">{task.description}</p>
                  {task.progressNotes.length > 0 && (
                    <div className="text-[11px] text-slate-600 mt-1 italic">
                      Latest Note: {task.progressNotes[task.progressNotes.length - 1]}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <TaskStatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Latest Site Photos */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-amber-600" />
              <span>Live Site Photos</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{propPhotos.length} photos</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {propPhotos.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                Site photos will be uploaded by your coordinator shortly.
              </div>
            ) : (
              propPhotos.map(photo => (
                <div key={photo.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={photo.photoUrl}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                      Stage {photo.stageId}: {photo.stageName}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-bold text-slate-900">{photo.caption}</div>
                    <p className="text-[11px] text-slate-600 mt-1">{photo.notes}</p>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {photo.uploadedAt.split('T')[0]} · Site Coordinator
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Contract Scope Inclusions & Exclusions */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Your Contracted Scope of Work</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of included activities under {property.packageType}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-2">
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Contract Inclusions (Included in Price)</span>
            </div>
            <div className="space-y-1.5">
              {STANDARD_ACTIVITIES.filter(a => property.includedActivities.includes(a.id)).map(act => (
                <div key={act.id} className="text-xs text-slate-800 bg-white p-2 rounded border border-emerald-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{act.name} (Stage {act.stageId})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <X className="w-4 h-4 text-slate-400" />
              <span>Exclusions (Customer Handled or Upgrade Required)</span>
            </div>
            <div className="space-y-1.5">
              {property.excludedActivities.length === 0 ? (
                <div className="text-xs text-slate-500 p-2">
                  All standard construction items included in turnkey agreement.
                </div>
              ) : (
                STANDARD_ACTIVITIES.filter(a => property.excludedActivities.includes(a.id)).map(act => (
                  <div key={act.id} className="text-xs text-slate-400 bg-white p-2 rounded border border-slate-200 line-through">
                    {act.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Customization Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Customization Request"
        subtitle="Request tile upgrades, lighting points, or interior carpentry modifications"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customization Category *
            </label>
            <select
              value={reqCategory}
              onChange={(e) => setReqCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="Flooring">Flooring (Tiles / Italian Marble)</option>
              <option value="Painting">Painting & Accent Walls</option>
              <option value="Lighting">Lighting & False Ceiling</option>
              <option value="Electrical Points">Electrical Points & Automation</option>
              <option value="Kitchen">Kitchen Counter & Chimney Duct</option>
              <option value="Bathroom Fixtures">Bathroom Fixtures & Diverters</option>
              <option value="Interior Design">Interior Woodwork & Wardrobes</option>
              <option value="Other">Other Custom Civil Request</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title / Summary *
            </label>
            <input
              type="text"
              required
              value={reqTitle}
              onChange={(e) => setReqTitle(e.target.value)}
              placeholder="e.g. Add 2 AC copper sleeves in kids bedroom"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={reqDesc}
              onChange={(e) => setReqDesc(e.target.value)}
              placeholder="Describe what you want to change..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs"
            >
              Submit to Project Manager
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
