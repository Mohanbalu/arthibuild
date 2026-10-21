import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { LocationFilterState } from '../types';
import { LocationFilterBar } from '../components/location/LocationFilterBar';
import { StatCard } from '../components/common/StatCard';
import { ProgressBar } from '../components/common/ProgressBar';
import { PropertyStatusBadge, PackageBadge } from '../components/common/Badge';
import { 
  Building2, 
  Home, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  ArrowUpRight, 
  Plus, 
  Layers,
  ChevronRight,
  TrendingUp,
  Hammer,
  MapPin,
  Compass
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DashboardProps {
  onNavigate: (view: string, id?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { projects, properties, tasks, customizations, handovers } = useData();
  const { canManageProjects, isAdmin, currentUser } = useAuth();

  // Cascading Location Filter State
  const [locationFilters, setLocationFilters] = useState<LocationFilterState>({
    state: 'all',
    city: 'all',
    locality: 'all',
    projectId: 'all',
    propertyType: 'all'
  });

  // Filter projects by location
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (!isAdmin && currentUser.assignedProjectIds && currentUser.assignedProjectIds.length > 0) {
      result = result.filter(p => currentUser.assignedProjectIds?.includes(p.id));
    }

    if (locationFilters.state !== 'all') {
      result = result.filter(p => p.state === locationFilters.state);
    }
    if (locationFilters.city !== 'all') {
      result = result.filter(p => p.city === locationFilters.city);
    }
    if (locationFilters.locality !== 'all') {
      result = result.filter(p => p.locality === locationFilters.locality);
    }
    if (locationFilters.projectId !== 'all') {
      result = result.filter(p => p.id === locationFilters.projectId);
    }
    if (locationFilters.propertyType !== 'all') {
      result = result.filter(p => p.type === locationFilters.propertyType);
    }

    return result;
  }, [projects, isAdmin, currentUser, locationFilters]);

  const filteredProjectIds = useMemo(() => {
    return new Set(filteredProjects.map(p => p.id));
  }, [filteredProjects]);

  // Filter properties by location-scoped projects and propertyType
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (!filteredProjectIds.has(p.projectId)) return false;
      if (locationFilters.propertyType !== 'all') {
        const proj = projects.find(prj => prj.id === p.projectId);
        if (proj && proj.type !== locationFilters.propertyType) return false;
      }
      return true;
    });
  }, [properties, filteredProjectIds, locationFilters.propertyType, projects]);

  const filteredPropertyIds = useMemo(() => {
    return new Set(filteredProperties.map(p => p.id));
  }, [filteredProperties]);

  // Location-scoped tasks, customizations, handovers
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => filteredPropertyIds.has(t.propertyId) || filteredProjectIds.has(t.projectId));
  }, [tasks, filteredPropertyIds, filteredProjectIds]);

  const filteredCustomizations = useMemo(() => {
    return customizations.filter(c => filteredPropertyIds.has(c.propertyId));
  }, [customizations, filteredPropertyIds]);

  const filteredHandovers = useMemo(() => {
    return handovers.filter(h => filteredPropertyIds.has(h.propertyId));
  }, [handovers, filteredPropertyIds]);

  // Metrics dynamically reflecting the active location filter
  const totalProjects = filteredProjects.length;
  const activeProjects = filteredProjects.filter(p => p.status === 'In Progress' || p.status === 'Finishing').length;
  const totalProperties = filteredProperties.length;
  const underConstructionUnits = filteredProperties.filter(p => p.status !== 'Handed Over' && p.status !== 'Ready for Handover').length;
  const readyForHandoverUnits = filteredProperties.filter(p => p.status === 'Ready for Handover').length;
  const handedOverUnits = filteredProperties.filter(p => p.status === 'Handed Over').length;
  
  const blockedTasks = filteredTasks.filter(t => t.status === 'Blocked');
  const delayedUnits = filteredProperties.filter(p => p.delayDays > 0);
  const pendingCustomizations = filteredCustomizations.filter(c => c.status === 'Submitted' || c.status === 'Under Review');
  const awaitingCustomerApprovals = filteredCustomizations.filter(c => c.status === 'Awaiting Customer Approval');

  // Next upcoming handovers for filtered location
  const upcomingHandovers = useMemo(() => {
    return [...filteredProperties]
      .filter(p => p.status !== 'Handed Over')
      .sort((a, b) => new Date(a.currentEstimatedDate).getTime() - new Date(b.currentEstimatedDate).getTime())
      .slice(0, 4);
  }, [filteredProperties]);

  return (
    <div className="space-y-6">
      {/* Admin Executive Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-purple-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-medium border border-purple-400/30">
              <Building2 className="w-3.5 h-3.5" /> Administrator Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Executive Overview — {currentUser.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Complete administrative authority across all <strong className="text-white">{projects.length} construction sites</strong>, <strong className="text-white">{properties.length} customer units</strong>, team assignments, and system settings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('map-view')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>GIS Map</span>
            </button>
            <button
              onClick={() => onNavigate('projects')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Manage Sites</span>
            </button>
            <button
              onClick={() => onNavigate('users')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Team & Roles</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cascading Location Hierarchy Filter Bar */}
      <LocationFilterBar
        projects={projects}
        filterState={locationFilters}
        onFilterChange={setLocationFilters}
        showPropertyType={true}
      />

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Projects"
          value={activeProjects}
          subtext={`${totalProjects} total development sites`}
          icon={Building2}
          highlightColor="default"
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          label="Units Under Construction"
          value={underConstructionUnits}
          subtext={`${totalProperties} total customer units`}
          icon={Home}
          highlightColor="sky"
          onClick={() => onNavigate('properties')}
        />
        <StatCard
          label="Ready / Handed Over"
          value={`${readyForHandoverUnits} / ${handedOverUnits}`}
          subtext={`${readyForHandoverUnits} awaiting clearance sign-off`}
          icon={CheckCircle2}
          highlightColor="emerald"
          onClick={() => onNavigate('handovers')}
        />
        <StatCard
          label="Blocked / Delayed Items"
          value={blockedTasks.length + delayedUnits.length}
          subtext={`${blockedTasks.length} blocked tasks · ${delayedUnits.length} delayed units`}
          icon={AlertTriangle}
          highlightColor={blockedTasks.length > 0 ? 'rose' : 'amber'}
          onClick={() => onNavigate('delivery')}
        />
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigate('customizations')}
          className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-purple-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-purple-800 uppercase tracking-wider">
                Pending Customizations
              </div>
              <div className="text-xl font-bold font-mono text-purple-950 mt-0.5">
                {pendingCustomizations.length + awaitingCustomerApprovals.length} Requests
              </div>
            </div>
          </div>
          <div className="text-xs text-purple-700 font-medium flex items-center gap-1">
            <span>{awaitingCustomerApprovals.length} awaiting buyer</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('delivery')}
          className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-amber-800 uppercase tracking-wider">
                Forecasted Deliveries
              </div>
              <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">
                {upcomingHandovers.length} Near Completion
              </div>
            </div>
          </div>
          <div className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <span>Dynamic Engine</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('inspections')}
          className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-800 uppercase tracking-wider">
                Quality Inspections
              </div>
              <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">
                100% Package-Specific
              </div>
            </div>
          </div>
          <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <span>Audits & Snags</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Split: Projects Portfolio Progress & Upcoming Delivery Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Projects Portfolio */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Construction Projects</h2>
              <p className="text-xs text-slate-500 mt-0.5">Weighted progress aggregated from contracted tasks</p>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium">No construction sites match the active location filter.</p>
                <button
                  onClick={() => setLocationFilters({ state: 'all', city: 'all', locality: 'all', projectId: 'all', propertyType: 'all' })}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                >
                  Reset to All Locations
                </button>
              </div>
            ) : (
              filteredProjects.map(project => {
                const projectUnits = filteredProperties.filter(p => p.projectId === project.id);
                const avgProgress = projectUnits.length > 0
                  ? Math.round(projectUnits.reduce((acc, p) => acc + p.overallProgress, 0) / projectUnits.length)
                  : project.progress;

              return (
                <div key={project.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {project.code}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{project.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {project.type} · {project.location} · PM: {project.projectManagerName}
                      </p>
                    </div>

                    <div className="text-right sm:text-right shrink-0">
                      <span className="text-xs font-mono text-slate-500">Target Completion:</span>
                      <div className="text-xs font-semibold font-mono text-slate-800">
                        {project.plannedCompletionDate}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <ProgressBar progress={avgProgress} showLabel size="md" />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3 font-mono">
                      <span>{projectUnits.length} tracked units</span>
                      <span>·</span>
                      <span>{project.buildings.length} wings/blocks</span>
                    </div>

                    <button
                      onClick={() => onNavigate('projects')}
                      className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                    >
                      <span>Explore Units</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Right 1 Col: Upcoming Handover Forecast */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Upcoming Handover Forecast</h2>
              <p className="text-xs text-slate-500 mt-0.5">Dynamic rule-based delivery dates</p>
            </div>
            <button
              onClick={() => onNavigate('delivery')}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Schedule</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {upcomingHandovers.map(unit => (
              <div
                key={unit.id}
                onClick={() => onNavigate('properties')}
                className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {unit.unitNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {unit.customerName}
                    </div>
                  </div>
                  <PropertyStatusBadge status={unit.status} />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Target Delivery:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {unit.currentEstimatedDate}
                  </span>
                </div>

                {unit.delayDays > 0 ? (
                  <div className="mt-1.5 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>+{unit.delayDays}d variance ({unit.delayReason || 'Customization / curing'})</span>
                  </div>
                ) : (
                  <div className="mt-1.5 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>On Schedule</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => onNavigate('delivery')}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs text-center"
            >
              Open Full Forecast & Risk Engine
            </button>
          </div>
        </div>
      </div>

      {/* Construction Package Distribution & Blocked Tasks Alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Construction Package Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Construction Packages In Execution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Units by contracted scope</p>
            </div>
            <button
              onClick={() => onNavigate('properties')}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Filter Units
            </button>
          </div>

          <div className="space-y-3">
            {[
              { type: 'Package A: Structure Only', count: filteredProperties.filter(p => p.packageType.includes('Package A')).length, color: 'bg-slate-500', desc: 'Civil structure, brickwork & plastering' },
              { type: 'Package B: Semi-Finished', count: filteredProperties.filter(p => p.packageType.includes('Package B')).length, color: 'bg-sky-500', desc: 'Structure + Electrical wiring + Plumbing' },
              { type: 'Package C: Fully Finished', count: filteredProperties.filter(p => p.packageType.includes('Package C')).length, color: 'bg-emerald-500', desc: 'Turnkey finish: tiles, paint, doors, fixtures' },
              { type: 'Package D: Custom Package', count: filteredProperties.filter(p => p.packageType.includes('Package D')).length, color: 'bg-purple-500', desc: 'Itemized inclusions & customer exclusions' }
            ].map(pkg => (
              <div key={pkg.type} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${pkg.color}`} />
                    <span className="font-semibold text-slate-800">{pkg.type}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {pkg.count} units
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-4.5">
                  {pkg.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Site Alerts & Blocked Tasks */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Site Impediments & Tasks</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tasks needing immediate coordinator attention</p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Task Board
            </button>
          </div>

          <div className="space-y-3">
            {blockedTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                Zero blocked tasks across all active job sites.
              </div>
            ) : (
              blockedTasks.map(task => (
                <div key={task.id} className="p-3 rounded-lg border border-rose-200 bg-rose-50/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-rose-900 truncate">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-rose-700 font-mono mt-0.5">
                        {task.unitNumber} · Stage: {task.stageName}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-200 text-rose-800 font-bold shrink-0">
                      BLOCKED
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-2 bg-white/70 p-2 rounded border border-rose-100">
                    <strong>Reason:</strong> {task.blockedReason || 'Material delivery delay / statutory inspection appointment pending.'}
                  </p>
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => onNavigate('tasks')}
                      className="text-xs text-rose-700 hover:text-rose-900 font-semibold"
                    >
                      Resolve in Task Board →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
