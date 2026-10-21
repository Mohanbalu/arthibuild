import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ConstructionTask, TaskStatus, Property } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { ProgressBar } from '../../components/common/ProgressBar';
import { PropertyStatusBadge } from '../../components/common/Badge';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Camera, 
  FileText, 
  KanbanSquare, 
  ClipboardCheck, 
  ArrowUpRight, 
  ChevronRight, 
  MapPin, 
  Play, 
  Check, 
  ShieldAlert, 
  HardHat, 
  Sparkles,
  CalendarDays,
  Plus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface CoordinatorDashboardProps {
  onNavigate: (view: string, id?: string) => void;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({ onNavigate }) => {
  const { projects, properties, tasks, inspections, updateTask } = useData();
  const { currentUser } = useAuth();

  // Scoped project IDs assigned to this Coordinator
  const assignedProjectIds = useMemo(() => {
    return new Set(currentUser.assignedProjectIds || []);
  }, [currentUser.assignedProjectIds]);

  // Coordinator's assigned projects
  const coordProjects = useMemo(() => {
    return projects.filter(p => assignedProjectIds.has(p.id) || p.assignedCoordinatorIds?.includes(currentUser.id));
  }, [projects, assignedProjectIds, currentUser.id]);

  const coordProjectIds = useMemo(() => new Set(coordProjects.map(p => p.id)), [coordProjects]);

  // Coordinator's assigned properties
  const coordProperties = useMemo(() => {
    return properties.filter(p => coordProjectIds.has(p.projectId) || p.assignedCoordinatorId === currentUser.id);
  }, [properties, coordProjectIds, currentUser.id]);

  const coordPropertyIds = useMemo(() => new Set(coordProperties.map(p => p.id)), [coordProperties]);

  // Coordinator's tasks
  const coordTasks = useMemo(() => {
    return tasks.filter(t => coordPropertyIds.has(t.propertyId) || coordProjectIds.has(t.projectId));
  }, [tasks, coordPropertyIds, coordProjectIds]);

  // Coordinator's inspections
  const coordInspections = useMemo(() => {
    return inspections.filter(i => coordPropertyIds.has(i.propertyId));
  }, [inspections, coordPropertyIds]);

  // Filter tasks by status for today's active work
  const inProgressTasks = useMemo(() => coordTasks.filter(t => t.status === 'In Progress'), [coordTasks]);
  const blockedTasks = useMemo(() => coordTasks.filter(t => t.status === 'Blocked'), [coordTasks]);
  const completedTasks = useMemo(() => coordTasks.filter(t => t.status === 'Completed'), [coordTasks]);
  const pendingInspections = useMemo(() => coordInspections.filter(i => i.status === 'Scheduled' || i.status === 'In Progress'), [coordInspections]);

  // Quick inline status change handler
  const handleQuickStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask(taskId, {
      status: newStatus,
      actualStartDate: newStatus === 'In Progress' ? new Date().toISOString().split('T')[0] : undefined,
      actualCompletionDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Coordinator Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-amber-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-mono font-medium border border-amber-400/30">
              <HardHat className="w-3.5 h-3.5" /> Site Civil Coordinator Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Coordinating on-site execution, daily field progress, and quality checks across <strong className="text-white">{coordProjects.length} assigned sites</strong> and <strong className="text-white">{coordProperties.length} properties</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('site-update')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Log Site Progress</span>
            </button>
            <button
              onClick={() => onNavigate('gallery')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Photos</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Assigned Construction Sites"
          value={coordProjects.length}
          subtext={`${coordProperties.length} active units under supervision`}
          icon={Building2}
          highlightColor="amber"
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          label="Active Field Tasks"
          value={inProgressTasks.length}
          subtext="Currently underway on site"
          icon={Play}
          highlightColor="sky"
          onClick={() => onNavigate('tasks')}
        />
        <StatCard
          label="Blocked Site Work"
          value={blockedTasks.length}
          subtext={blockedTasks.length > 0 ? "Requires subcontractor / permit fix" : "Zero field blockages reported"}
          icon={AlertTriangle}
          highlightColor={blockedTasks.length > 0 ? "rose" : "emerald"}
          onClick={() => onNavigate('tasks')}
        />
        <StatCard
          label="Upcoming Inspections"
          value={pendingInspections.length}
          subtext="Punch-list & milestone QA"
          icon={ClipboardCheck}
          highlightColor="emerald"
          onClick={() => onNavigate('inspections')}
        />
      </div>

      {/* Main Grid: Today's Tasks & Assigned Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Field Task Execution Board */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Today's Field Execution Checklist</h2>
                <p className="text-xs text-slate-500 mt-0.5">Quickly update status for tasks on your assigned sites</p>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Full Kanban</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {coordTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span>No tasks assigned for current site selection.</span>
                </div>
              ) : (
                coordTasks.slice(0, 7).map(task => {
                  const isBlocked = task.status === 'Blocked';
                  const isInProgress = task.status === 'In Progress';
                  const isCompleted = task.status === 'Completed';

                  return (
                    <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {task.unitNumber}
                          </span>
                          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                            isCompleted ? 'bg-emerald-100 text-emerald-800' :
                            isInProgress ? 'bg-sky-100 text-sky-800' :
                            isBlocked ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h4>
                        <p className="text-[11px] text-slate-500">
                          {task.stageName} · Subcontractor: <strong className="text-slate-700">{task.assignedTo}</strong>
                        </p>
                        {isBlocked && task.blockedReason && (
                          <p className="text-[11px] text-rose-600 font-medium">
                            Blockage: {task.blockedReason}
                          </p>
                        )}
                      </div>

                      {/* Quick Status Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isInProgress && !isCompleted && (
                          <button
                            onClick={() => handleQuickStatusChange(task.id, 'In Progress')}
                            className="px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors cursor-pointer"
                            title="Mark In Progress"
                          >
                            Start Work
                          </button>
                        )}
                        {!isCompleted && (
                          <button
                            onClick={() => handleQuickStatusChange(task.id, 'Completed')}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                            title="Mark Complete"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </button>
                        )}
                        {!isBlocked && !isCompleted && (
                          <button
                            onClick={() => handleQuickStatusChange(task.id, 'Blocked')}
                            className="px-2 py-1 text-xs font-medium text-rose-600 hover:text-rose-800 bg-rose-50/50 hover:bg-rose-100/70 border border-rose-200 rounded-md transition-colors cursor-pointer"
                            title="Report Blocked"
                          >
                            Block
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pending Field Inspections */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Quality Punch-Lists & Inspections</h2>
                <p className="text-xs text-slate-500 mt-0.5">Civil defect checklists and pre-handover walkthroughs</p>
              </div>
              <button
                onClick={() => onNavigate('inspections')}
                className="text-xs text-amber-700 font-semibold"
              >
                Inspect All
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {coordInspections.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <ClipboardCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-70" />
                  <span>No punch-lists scheduled for your sites.</span>
                </div>
              ) : (
                coordInspections.slice(0, 4).map(insp => (
                  <div key={insp.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {insp.unitNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{insp.inspectionType}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Scheduled: {insp.scheduledDate} · {insp.items.length} checklist items
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigate('inspections')}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Checklist</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Assigned Sites & Quick Tools */}
        <div className="space-y-6">
          {/* Assigned Sites Dossier */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">My Supervised Sites</h2>
                <p className="text-xs text-slate-500 mt-0.5">Permitted project boundaries</p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                {coordProjects.length} sites
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {coordProjects.map(proj => {
                const siteUnits = coordProperties.filter(p => p.projectId === proj.id);
                return (
                  <div key={proj.id} className="p-4 space-y-2 hover:bg-slate-50/60">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{proj.name}</h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{proj.locality}, {proj.city}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {proj.code}
                      </span>
                    </div>

                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Site Progress</span>
                        <span className="font-mono font-bold text-slate-700">{proj.progress}%</span>
                      </div>
                      <ProgressBar progress={proj.progress} size="sm" showLabel={false} />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span>{siteUnits.length} active units</span>
                      <button
                        onClick={() => onNavigate('project-detail', proj.id)}
                        className="text-amber-700 font-semibold flex items-center gap-0.5"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Photo Upload & Daily Log CTA */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <Camera className="w-4 h-4 text-amber-600" />
              <span>Field Photo Documentation</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Capture and tag real site photos directly to apartments or villa foundations for client milestone verification.
            </p>
            <button
              onClick={() => onNavigate('gallery')}
              className="w-full py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Site Photo Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
