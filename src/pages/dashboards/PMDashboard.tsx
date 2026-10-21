import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { LocationFilterState, ConstructionProject, Property } from '../../types';
import { LocationFilterBar } from '../../components/location/LocationFilterBar';
import { StatCard } from '../../components/common/StatCard';
import { ProgressBar } from '../../components/common/ProgressBar';
import { PropertyStatusBadge, PackageBadge } from '../../components/common/Badge';
import { 
  Building2, 
  Home, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  ArrowUpRight, 
  ChevronRight, 
  Layers, 
  ClipboardCheck, 
  Award, 
  Camera, 
  Calendar, 
  Sparkles,
  MapPin,
  KanbanSquare,
  ShieldCheck,
  Check,
  X,
  TrendingUp
} from 'lucide-react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

interface PMDashboardProps {
  onNavigate: (view: string, id?: string) => void;
}

export const PMDashboard: React.FC<PMDashboardProps> = ({ onNavigate }) => {
  const { projects, properties, tasks, customizations, handovers, reviewCustomization, verifyTaskMilestone } = useData();
  const { currentUser } = useAuth();

  // Scoped project IDs assigned to this Project Manager
  const assignedProjectIds = useMemo(() => {
    return new Set(currentUser.assignedProjectIds || []);
  }, [currentUser.assignedProjectIds]);

  // Location filter state
  const [locationFilters, setLocationFilters] = useState<LocationFilterState>({
    state: 'all',
    city: 'all',
    locality: 'all',
    projectId: 'all',
    propertyType: 'all'
  });

  // PM's assigned projects filtered by location
  const pmProjects = useMemo(() => {
    let list = projects.filter(p => assignedProjectIds.has(p.id) || p.projectManagerId === currentUser.id);
    if (locationFilters.state !== 'all') list = list.filter(p => p.state === locationFilters.state);
    if (locationFilters.city !== 'all') list = list.filter(p => p.city === locationFilters.city);
    if (locationFilters.locality !== 'all') list = list.filter(p => p.locality === locationFilters.locality);
    if (locationFilters.projectId !== 'all') list = list.filter(p => p.id === locationFilters.projectId);
    if (locationFilters.propertyType !== 'all') list = list.filter(p => p.type === locationFilters.propertyType);
    return list;
  }, [projects, assignedProjectIds, currentUser.id, locationFilters]);

  const pmProjectIds = useMemo(() => new Set(pmProjects.map(p => p.id)), [pmProjects]);

  // PM's managed properties
  const pmProperties = useMemo(() => {
    return properties.filter(p => pmProjectIds.has(p.projectId));
  }, [properties, pmProjectIds]);

  const pmPropertyIds = useMemo(() => new Set(pmProperties.map(p => p.id)), [pmProperties]);

  // PM's tasks
  const pmTasks = useMemo(() => {
    return tasks.filter(t => pmPropertyIds.has(t.propertyId) || pmProjectIds.has(t.projectId));
  }, [tasks, pmPropertyIds, pmProjectIds]);

  // PM's customization requests
  const pmCustomizations = useMemo(() => {
    return customizations.filter(c => pmPropertyIds.has(c.propertyId));
  }, [customizations, pmPropertyIds]);

  // Pending customizations requiring PM quotation / review
  const pendingReviewCustomizations = useMemo(() => {
    return pmCustomizations.filter(c => c.status === 'Submitted' || c.status === 'Under Review');
  }, [pmCustomizations]);

  // Tasks awaiting PM verification
  const pendingVerificationTasks = useMemo(() => {
    return pmTasks.filter(t => t.approvalStatus === 'Pending Verification' || (t.status === 'Completed' && t.approvalStatus !== 'Verified by PM'));
  }, [pmTasks]);

  // Blocked tasks
  const blockedTasks = useMemo(() => {
    return pmTasks.filter(t => t.status === 'Blocked');
  }, [pmTasks]);

  // Delayed properties
  const delayedProperties = useMemo(() => {
    return pmProperties.filter(p => p.delayDays > 0);
  }, [pmProperties]);

  // Average progress across PM's units
  const avgProgress = useMemo(() => {
    if (pmProperties.length === 0) return 0;
    const sum = pmProperties.reduce((acc, p) => acc + p.overallProgress, 0);
    return Math.round(sum / pmProperties.length);
  }, [pmProperties]);

  return (
    <div className="space-y-6">
      {/* PM Portal Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-blue-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-medium border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Project Manager Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Overseeing <strong className="text-white">{pmProjects.length} assigned construction projects</strong> and <strong className="text-white">{pmProperties.length} residential units</strong> with contractual schedule & scope governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('tasks')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>Task Board</span>
            </button>
            <button
              onClick={() => onNavigate('customizations')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer relative"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Review Proposals</span>
              {pendingReviewCustomizations.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-600 absolute -top-0.5 -right-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cascading Location Filter Bar (Scoped to PM's Projects) */}
      <LocationFilterBar
        projects={projects.filter(p => assignedProjectIds.has(p.id) || p.projectManagerId === currentUser.id)}
        filterState={locationFilters}
        onFilterChange={setLocationFilters}
      />

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Assigned Projects"
          value={pmProjects.length}
          subtext={`${pmProperties.length} active tracked units`}
          icon={Building2}
          highlightColor="sky"
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          label="Average Unit Progress"
          value={`${avgProgress}%`}
          subtext="Civil & interior milestones"
          icon={TrendingUp}
          highlightColor="emerald"
        />
        <StatCard
          label="Customizations in Queue"
          value={pendingReviewCustomizations.length}
          subtext={pendingReviewCustomizations.length > 0 ? "Awaiting your cost/time quotes" : "All customer requests reviewed"}
          icon={Sliders}
          highlightColor={pendingReviewCustomizations.length > 0 ? "amber" : "default"}
          onClick={() => onNavigate('customizations')}
        />
        <StatCard
          label="Blocked Site Tasks"
          value={blockedTasks.length}
          subtext={blockedTasks.length > 0 ? "Immediate resolution needed" : "Zero blockages across sites"}
          icon={AlertTriangle}
          highlightColor={blockedTasks.length > 0 ? "rose" : "emerald"}
          onClick={() => onNavigate('tasks')}
        />
      </div>

      {/* Main Grid: Customization Reviews & Assigned Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assigned Construction Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">My Assigned Construction Sites</h2>
                <p className="text-xs text-slate-500 mt-0.5">Projects under your active management</p>
              </div>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {pmProjects.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium">No assigned projects match the active location filter.</p>
                </div>
              ) : (
                pmProjects.map(project => {
                  const siteUnits = pmProperties.filter(p => p.projectId === project.id);
                  const siteProgress = siteUnits.length > 0
                    ? Math.round(siteUnits.reduce((acc, p) => acc + p.overallProgress, 0) / siteUnits.length)
                    : project.progress;

                  return (
                    <div key={project.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200/60">
                              {project.code}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">{project.name}</h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{project.locality}, {project.city}, {project.state}</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono text-slate-500">Target Delivery:</span>
                          <div className="text-xs font-semibold font-mono text-slate-800">
                            {project.plannedCompletionDate}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <ProgressBar progress={siteProgress} showLabel size="md" />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3 font-mono">
                          <span>{siteUnits.length} tracked units</span>
                          <span>·</span>
                          <span>{project.buildings?.length || 0} wings/blocks</span>
                        </div>

                        <button
                          onClick={() => onNavigate('project-detail', project.id)}
                          className="text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Explore Units</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pending Milestone Sign-Offs */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Milestone QA Verifications Awaiting PM Review</h2>
                <p className="text-xs text-slate-500 mt-0.5">Review completed contractor work before certifying stage</p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                {pendingVerificationTasks.length} pending
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingVerificationTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  <span>All completed task milestones have been PM-verified.</span>
                </div>
              ) : (
                pendingVerificationTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded">
                          {task.unitNumber}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {task.stageName} · Subcontractor: {task.assignedTo}
                      </p>
                    </div>

                    <button
                      onClick={() => verifyTaskMilestone(task.id, currentUser.name)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify Milestone</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Customization Review Queue & Quick Actions */}
        <div className="space-y-6">
          {/* Customization Approval Queue */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Customization Queue</h2>
                <p className="text-xs text-slate-500 mt-0.5">Provide quote & schedule impact</p>
              </div>
              <button
                onClick={() => onNavigate('customizations')}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingReviewCustomizations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-70" />
                  <span>No customer customization requests pending review.</span>
                </div>
              ) : (
                pendingReviewCustomizations.map(c => (
                  <div key={c.id} className="p-4 space-y-2 hover:bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                        {c.unitNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.requestDate}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{c.title}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{c.description}</p>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[11px] text-slate-500">Client: {c.customerName}</span>
                      <button
                        onClick={() => onNavigate('customizations')}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Delayed Properties Alert */}
          {delayedProperties.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Schedule Variance Alerts ({delayedProperties.length} units)</span>
              </div>
              <div className="space-y-2 text-xs">
                {delayedProperties.slice(0, 3).map(p => (
                  <div key={p.id} className="p-2.5 bg-white rounded-lg border border-amber-200 text-slate-800">
                    <div className="flex items-center justify-between font-semibold">
                      <span>{p.unitNumber}</span>
                      <span className="text-rose-600 font-mono font-bold">+{p.delayDays} days</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {p.delayReason || 'Customization schedule extension'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Handover Clearance Readiness */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Handover Clearance Readiness</span>
              </span>
              <button
                onClick={() => onNavigate('handovers')}
                className="text-[11px] text-blue-700 font-semibold"
              >
                Manage
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Track units in final quality clearance approaching possession certificate issuance.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600">Total Handovers:</span>
              <strong className="text-slate-900 font-bold">
                {handovers.filter(h => pmPropertyIds.has(h.propertyId)).length} completed
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

