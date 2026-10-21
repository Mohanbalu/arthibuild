import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getScopedProjects, getScopedProperties } from '../services/permissions';
import { CONSTRUCTION_STAGES } from '../constants/constructionData';
import { TaskStatusBadge } from '../components/common/Badge';
import { Calendar, Filter, ChevronRight, Layers, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';

interface TaskTimelineProps {
  onNavigate: (view: string, id?: string) => void;
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ onNavigate }) => {
  const { tasks, properties, projects } = useData();
  const { currentUser } = useAuth();

  const scopedProjects = useMemo(() => {
    return getScopedProjects(currentUser, projects);
  }, [currentUser, projects]);

  const scopedProperties = useMemo(() => {
    return getScopedProperties(currentUser, properties, projects);
  }, [currentUser, properties, projects]);

  const scopedPropertyIds = useMemo(() => new Set(scopedProperties.map(p => p.id)), [scopedProperties]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(scopedProperties[0]?.id || 'all');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!scopedPropertyIds.has(t.propertyId)) return false;
      const matchesProject = selectedProjectId === 'all' || t.projectId === selectedProjectId;
      const matchesProperty = selectedPropertyId === 'all' || t.propertyId === selectedPropertyId;
      return matchesProject && matchesProperty;
    }).sort((a, b) => a.stageId - b.stageId);
  }, [tasks, scopedPropertyIds, selectedProjectId, selectedPropertyId]);

  // Group by stage
  const stageGroups = CONSTRUCTION_STAGES.map(stage => {
    return {
      stage,
      tasks: filteredTasks.filter(t => t.stageId === stage.id)
    };
  }).filter(group => group.tasks.length > 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-600 text-white';
      case 'In Progress': return 'bg-sky-500 text-white';
      case 'Blocked': return 'bg-rose-500 text-white';
      case 'Awaiting Approval': return 'bg-amber-500 text-white';
      default: return 'bg-slate-300 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Construction Timeline & Critical Path
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sequential stages (1-15), inter-task dependencies, and execution progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('tasks')}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            Kanban Board
          </button>
        </div>
      </div>

      {/* Filter Selector */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Project:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedPropertyId('all');
              }}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-hidden"
            >
              <option value="all">All Assigned Projects</option>
              {scopedProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Property Unit:</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-hidden"
            >
              <option value="all">All Assigned Units</option>
              {scopedProperties
                .filter(p => selectedProjectId === 'all' || p.projectId === selectedProjectId)
                .map(p => (
                  <option key={p.id} value={p.id}>{p.unitNumber}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" /> Completed</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-sky-500 inline-block" /> In Progress</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Blocked</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-slate-300 inline-block" /> Scheduled</div>
        </div>
      </div>

      {/* Timeline Gantt Stage Rows */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <span className="text-xs font-bold text-slate-900">Construction Stage Workflow (Stages 1 → 15)</span>
          <span className="text-xs text-slate-500 font-mono">{filteredTasks.length} Tracked Tasks</span>
        </div>

        <div className="divide-y divide-slate-100">
          {stageGroups.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No tasks found for the selected project and unit.
            </div>
          ) : (
            stageGroups.map(({ stage, tasks: sTasks }) => {
              const allDone = sTasks.every(t => t.status === 'Completed');
              const hasBlocked = sTasks.some(t => t.status === 'Blocked');

              return (
                <div key={stage.id} className="p-4 sm:p-5 hover:bg-slate-50/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                        allDone ? 'bg-emerald-100 text-emerald-800' : hasBlocked ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {stage.id}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{stage.name}</h3>
                        <p className="text-[11px] text-slate-500">{stage.category} · {stage.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        {sTasks.filter(t => t.status === 'Completed').length}/{sTasks.length} Completed
                      </span>
                    </div>
                  </div>

                  {/* Tasks in this Stage */}
                  <div className="space-y-2 mt-2 pl-0 sm:pl-8">
                    {sTasks.map(task => {
                      const hasDeps = task.dependencies && task.dependencies.length > 0;
                      return (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg border border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {task.title}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({task.unitNumber})
                              </span>
                              {task.isCustomizationImpact && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold">
                                  Custom Scope
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono">
                              <span>Planned: {task.plannedStartDate} → {task.plannedFinishDate}</span>
                              {task.actualCompletionDate && (
                                <span className="text-emerald-700">✓ Finished: {task.actualCompletionDate}</span>
                              )}
                              <span>·</span>
                              <span>Contractor: {task.assignedTo}</span>
                              {hasDeps && (
                                <span className="text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                                  Prereqs: {task.dependencies.length}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <TaskStatusBadge status={task.status} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
