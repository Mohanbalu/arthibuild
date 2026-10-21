import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { STANDARD_ACTIVITIES } from '../constants/constructionData';
import { calculatePropertyDeliveryForecast } from '../services/estimationEngine';
import { getScopedProperties } from '../services/permissions';
import { ProgressBar } from '../components/common/ProgressBar';
import { PropertyStatusBadge, PackageBadge, TaskStatusBadge } from '../components/common/Badge';
import { 
  ArrowLeft, 
  Home, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Camera, 
  Sliders, 
  ClipboardCheck, 
  Award,
  ChevronRight,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

interface PropertyDetailsProps {
  propertyId: string;
  onNavigate: (view: string, id?: string) => void;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({ propertyId, onNavigate }) => {
  const { properties, projects, tasks, customizations, photos, inspections, handovers, verifyTaskMilestone } = useData();
  const { canVerifyMilestones, canSignHandover, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'tasks' | 'scope' | 'customizations' | 'photos' | 'inspections'>('tasks');

  const scopedProperties = getScopedProperties(currentUser, properties, projects);
  const isAuthorized = scopedProperties.some(p => p.id === propertyId);
  const property = properties.find(p => p.id === propertyId);

  if (!property || !isAuthorized) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-rose-200 p-8 shadow-xs">
        <Home className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          You do not have administrative clearance or ownership access to inspect this property unit.
        </p>
        <button
          onClick={() => onNavigate(currentUser.role === 'customer' ? 'customer-portal' : 'properties')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
        >
          {currentUser.role === 'customer' ? 'Return to My Property Portal' : 'Return to Property Registry'}
        </button>
      </div>
    );
  }

  const propTasks = tasks.filter(t => t.propertyId === property.id);
  const propCustomizations = customizations.filter(c => c.propertyId === property.id);
  const propPhotos = photos.filter(ph => ph.propertyId === property.id);
  const propInspections = inspections.filter(i => i.propertyId === property.id);
  const propHandover = handovers.find(h => h.propertyId === property.id);

  // Delivery estimation engine calculations
  const forecast = calculatePropertyDeliveryForecast(property, propTasks, customizations);

  // Group tasks by stage
  const completedTasks = propTasks.filter(t => t.status === 'Completed').length;
  const verifiedTasks = propTasks.filter(t => t.approvalStatus === 'Verified by PM').length;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('properties')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">{property.id}</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-600 font-medium">{property.projectName}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">{property.unitNumber}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PropertyStatusBadge status={property.status} />
          {property.status === 'Ready for Handover' && canSignHandover && (
            <button
              onClick={() => onNavigate('handovers')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-xs"
            >
              <Award className="w-4 h-4" />
              <span>Issue Handover Certificate</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Info Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 & 2: Property Overview & Contract Scope */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="text-xs font-bold text-slate-900">Contract & Ownership Dossier</div>
              <p className="text-xs text-slate-500 mt-0.5">Assigned customer, package specifications and site engineer</p>
            </div>
            <PackageBadge packageType={property.packageType} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Customer Profile</span>
              </div>
              <div className="text-slate-900 font-bold text-sm">{property.customerName}</div>
              <div className="text-slate-600 flex items-center gap-1.5 font-mono">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{property.customerPhone}</span>
              </div>
              <div className="text-slate-600 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="truncate">{property.customerEmail}</span>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-amber-600" />
                  <span>Geographical & Structural Hierarchy</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                  {property.propertyType}
                </span>
              </div>
              <div className="text-[11px] text-slate-700 font-mono space-y-0.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">State:</span>
                  <strong className="text-slate-900">{property.state || 'Tamil Nadu'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">City:</span>
                  <strong className="text-slate-900">{property.city || 'Chennai'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Locality:</span>
                  <strong className="text-slate-900">{property.locality || 'General'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Site:</span>
                  <strong className="text-slate-900 truncate max-w-[150px]">{property.projectName}</strong>
                </div>
                {property.buildingName ? (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Building / Floor:</span>
                    <strong className="text-slate-900">{property.buildingName} (Fl {property.floorNumber})</strong>
                  </div>
                ) : (
                  <div className="flex justify-between text-slate-400">
                    <span>Building/Floor:</span>
                    <span>Direct Villa Ground Unit</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Built-up Area:</span>
                  <strong className="text-slate-900">{property.areaSqFt} sq.ft</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-700 mb-1">Contractual Progress:</div>
            <ProgressBar progress={property.overallProgress} verifiedProgress={property.verifiedProgress} size="md" />
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-1">
              <span>{completedTasks} of {propTasks.length} tasks completed</span>
              <span>{verifiedTasks} PM-verified</span>
            </div>
          </div>
        </div>

        {/* Col 3: Real-Time Delivery Forecast Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Delivery Forecast Engine</span>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${forecast.riskBadgeClass}`}>
                {forecast.riskLevel}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Original Committed Date:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {forecast.originalDeliveryDate}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Current Forecast Target:</span>
                <span className="font-mono font-bold text-slate-950 text-sm">
                  {forecast.currentEstimatedDate}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Schedule Variance:</span>
                <span className={`font-mono font-bold ${forecast.varianceFromCommittedDays > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {forecast.varianceFromCommittedDays > 0 ? `+${forecast.varianceFromCommittedDays} days delay` : 'On Schedule (0 days)'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 space-y-1">
                <div className="font-semibold">Calculation Breakdown:</div>
                <p className="leading-relaxed">
                  {forecast.calculationExplanation}
                </p>
              </div>

              {forecast.primaryDelayReason && (
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  <strong>Site Notes:</strong> {forecast.primaryDelayReason}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            *Transparent rule-based algorithm recalculated upon task & customization updates.
          </div>
        </div>
      </div>

      {/* Tabs for Tasks, Scope, Customizations, Photos, Inspections */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 flex items-center overflow-x-auto px-4 bg-slate-50/50">
          {[
            { id: 'tasks', label: `Contractual Tasks (${propTasks.length})` },
            { id: 'scope', label: `Contract Scope (${property.includedActivities.length} Included)` },
            { id: 'customizations', label: `Customizations (${propCustomizations.length})` },
            { id: 'photos', label: `Site Photos (${propPhotos.length})` },
            { id: 'inspections', label: `QA Inspections (${propInspections.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-600 text-slate-900 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TAB 1: Tasks */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Stage-Wise Tasks Generated for This Contract</h3>
                <span className="text-xs text-slate-500">Excluded activities do not appear or block this unit</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {propTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No tasks assigned to this unit yet.
                  </div>
                ) : (
                  propTasks.map(task => (
                    <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            Stage {task.stageId}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{task.title}</span>
                          {task.isCustomizationImpact && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                              Custom Scope
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span>Planned: {task.plannedStartDate} → {task.plannedFinishDate}</span>
                          <span>·</span>
                          <span>Assigned: {task.assignedTo}</span>
                          {task.approvalStatus === 'Verified by PM' && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Verified by {task.approvedBy}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <TaskStatusBadge status={task.status} />

                        {task.status === 'Completed' && task.approvalStatus !== 'Verified by PM' && canVerifyMilestones && (
                          <button
                            onClick={() => verifyTaskMilestone(task.id, currentUser.name)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded hover:bg-emerald-100 transition-colors"
                          >
                            Verify Milestone
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Scope Inclusions & Exclusions */}
          {activeTab === 'scope' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Contract Inclusions & Exclusions Audit</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified contract boundaries. Notice: Excluded activities are not required for completion of this property.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Included activities */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900 border-b border-emerald-200 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>Included Activities ({property.includedActivities.length})</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider">MANDATORY FOR HANDOVER</span>
                  </div>
                  <div className="space-y-2">
                    {STANDARD_ACTIVITIES.filter(a => property.includedActivities.includes(a.id)).map(act => (
                      <div key={act.id} className="text-xs text-slate-800 p-2 bg-white rounded border border-emerald-100">
                        <div className="font-semibold text-slate-900">{act.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Stage {act.stageId}: {act.stageName} · {act.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Excluded activities */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
                    <span className="flex items-center gap-1.5">
                      <X className="w-4 h-4 text-slate-400" />
                      <span>Excluded Activities ({property.excludedActivities.length})</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">NOT REQUIRED</span>
                  </div>
                  <div className="space-y-2">
                    {property.excludedActivities.length === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-4">
                        Zero excluded activities. Turnkey complete package contract.
                      </div>
                    ) : (
                      STANDARD_ACTIVITIES.filter(a => property.excludedActivities.includes(a.id)).map(act => (
                        <div key={act.id} className="text-xs text-slate-500 p-2 bg-white rounded border border-slate-200">
                          <div className="font-medium text-slate-700 line-through">{act.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Left to customer / outside scope of {property.packageType}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Customizations */}
          {activeTab === 'customizations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Customization Decisions & Impact</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Approved requests append directly to contractual schedule and cost</p>
                </div>
                <button
                  onClick={() => onNavigate('customizations')}
                  className="text-xs text-amber-700 hover:text-amber-900 font-semibold"
                >
                  Manage Requests →
                </button>
              </div>

              {propCustomizations.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 border border-slate-100 rounded-xl">
                  No customization requests logged for this unit.
                </div>
              ) : (
                <div className="space-y-3">
                  {propCustomizations.map(req => (
                    <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                              {req.category}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{req.title}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{req.description}</p>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono">
                          {req.status}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
                        <div>
                          Cost: <strong className="text-slate-900">₹{req.estimatedCost.toLocaleString()}</strong> · Schedule Impact: <strong className="text-rose-600">+{req.scheduleImpactDays} days</strong>
                        </div>
                        <div>
                          {req.appliedToSchedule ? '✓ Applied to delivery forecast' : 'Pending final approval'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Photos */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Site Photographs for {property.unitNumber}</h3>
                <button
                  onClick={() => onNavigate('site-update')}
                  className="text-xs text-amber-700 hover:text-amber-900 font-semibold"
                >
                  Upload New Photo →
                </button>
              </div>

              {propPhotos.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 border border-slate-100 rounded-xl">
                  No photographs uploaded for this property yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {propPhotos.map(ph => (
                    <div key={ph.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                      <div className="h-44 bg-slate-100 overflow-hidden relative">
                        <img 
                          src={ph.photoUrl} 
                          alt={ph.caption} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          Stage {ph.stageId}: {ph.stageName}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-bold text-slate-900">{ph.caption}</div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{ph.notes}</p>
                        <div className="text-[10px] text-slate-400 mt-2 font-mono">
                          {ph.uploadedBy} · {ph.uploadedAt.split('T')[0]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Inspections */}
          {activeTab === 'inspections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Quality Inspections & Snagging Audits</h3>
                <button
                  onClick={() => onNavigate('inspections')}
                  className="text-xs text-amber-700 hover:text-amber-900 font-semibold"
                >
                  Manage Audits →
                </button>
              </div>

              {propInspections.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 border border-slate-100 rounded-xl">
                  No inspection records created for this unit yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {propInspections.map(insp => (
                    <div key={insp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{insp.inspectionType}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          insp.status === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {insp.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{insp.overallRemarks}</p>
                      <div className="text-[11px] text-slate-400 mt-2 font-mono">
                        Auditor: {insp.inspectorName} · Scheduled: {insp.scheduledDate} {insp.completedDate ? `· Completed: ${insp.completedDate}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
