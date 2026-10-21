import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ConstructionTask, TaskStatus, TaskPriority } from '../types';
import { CONSTRUCTION_STAGES } from '../constants/constructionData';
import { Modal } from '../components/common/Modal';
import { TaskStatusBadge } from '../components/common/Badge';
import { getScopedProjects, getScopedProperties } from '../services/permissions';
import { 
  KanbanSquare, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  Calendar, 
  ShieldCheck, 
  ChevronRight,
  ArrowRight,
  Layers,
  Camera
} from 'lucide-react';

interface TaskBoardProps {
  onNavigate: (view: string, id?: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ onNavigate }) => {
  const { tasks, properties, projects, updateTask, addTask, verifyTaskMilestone } = useData();
  const { canManageTasks, canVerifyMilestones, currentUser } = useAuth();

  const scopedProjects = useMemo(() => getScopedProjects(currentUser, projects), [currentUser, projects]);
  const scopedProperties = useMemo(() => getScopedProperties(currentUser, properties, projects), [currentUser, properties, projects]);
  const scopedProjectIds = useMemo(() => new Set(scopedProjects.map(p => p.id)), [scopedProjects]);
  const scopedPropertyIds = useMemo(() => new Set(scopedProperties.map(p => p.id)), [scopedProperties]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [selectedStageId, setSelectedStageId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Popups
  const [selectedTask, setSelectedTask] = useState<ConstructionTask | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProgressNote, setNewProgressNote] = useState('');
  const [blockedReasonInput, setBlockedReasonInput] = useState('');

  // Add Task Form
  const [formTitle, setFormTitle] = useState('');
  const [formPropertyId, setFormPropertyId] = useState(scopedProperties[0]?.id || properties[0]?.id || '');
  const [formStageId, setFormStageId] = useState<number>(3);
  const [formAssignedTo, setFormAssignedTo] = useState('Shree Civil Works');
  const [formPlannedStart, setFormPlannedStart] = useState(new Date().toISOString().split('T')[0]);
  const [formPlannedFinish, setFormPlannedFinish] = useState('2026-03-31');
  const [formPriority, setFormPriority] = useState<TaskPriority>('High');
  const [formWeight, setFormWeight] = useState<number>(8);
  const [formDependencyTaskId, setFormDependencyTaskId] = useState<string>('');

  const columns: { status: TaskStatus; label: string; headerColor: string }[] = [
    { status: 'Not Started', label: 'Not Started', headerColor: 'border-slate-300 bg-slate-100 text-slate-800' },
    { status: 'In Progress', label: 'In Progress', headerColor: 'border-sky-300 bg-sky-100 text-sky-800' },
    { status: 'Blocked', label: 'Blocked / Delays', headerColor: 'border-rose-300 bg-rose-100 text-rose-800' },
    { status: 'Awaiting Approval', label: 'Awaiting Verification', headerColor: 'border-amber-300 bg-amber-100 text-amber-800' },
    { status: 'Completed', label: 'Completed Milestones', headerColor: 'border-emerald-300 bg-emerald-100 text-emerald-800' }
  ];

  // Filter tasks with role-based scoping
  const filteredTasks = tasks.filter(task => {
    if (currentUser.role !== 'admin' && !scopedPropertyIds.has(task.propertyId) && !scopedProjectIds.has(task.projectId)) {
      return false;
    }
    const matchesProject = selectedProjectId === 'all' || task.projectId === selectedProjectId;
    const matchesProperty = selectedPropertyId === 'all' || task.propertyId === selectedPropertyId;
    const matchesStage = selectedStageId === 'all' || String(task.stageId) === selectedStageId;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesProperty && matchesStage && matchesSearch;
  });

  const handleStatusChange = (task: ConstructionTask, newStatus: TaskStatus) => {
    setErrorMessage(null);
    const result = updateTask(task.id, { 
      status: newStatus,
      blockedReason: newStatus === 'Blocked' ? (task.blockedReason || 'Material arrival or contractor schedule issue') : undefined
    });

    if (!result.success && result.error) {
      setErrorMessage(result.error);
    }
  };

  const handleAddProgressNote = (taskId: string) => {
    if (!newProgressNote.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedNotes = [...task.progressNotes, `[${new Date().toISOString().split('T')[0]} - ${currentUser.name}] ${newProgressNote}`];
    updateTask(taskId, { progressNotes: updatedNotes });
    setNewProgressNote('');
  };

  const handleSaveNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const prop = properties.find(p => p.id === formPropertyId) || properties[0];
    const stage = CONSTRUCTION_STAGES.find(s => s.id === formStageId) || CONSTRUCTION_STAGES[2];

    addTask({
      title: formTitle,
      description: `Civil & installation task in ${stage.name}.`,
      stageId: formStageId,
      stageName: stage.name,
      activityId: 'ACT-CUSTOM-TASK',
      projectId: prop.projectId,
      propertyId: prop.id,
      unitNumber: prop.unitNumber,
      assignedTo: formAssignedTo,
      plannedStartDate: formPlannedStart,
      plannedFinishDate: formPlannedFinish,
      status: 'Not Started',
      priority: formPriority,
      dependencies: formDependencyTaskId ? [formDependencyTaskId] : [],
      weight: formWeight
    });

    setIsAddModalOpen(false);
    setFormTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Construction Task Board (Kanban)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage-wise activity execution, dependency validation, and manager milestone verification
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canManageTasks && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('timeline')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Timeline View</span>
          </button>
        </div>
      </div>

      {/* Error / Dependency Blocking Banner */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-xs text-rose-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong className="font-bold">Dependency Validation:</strong> {errorMessage}
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, units, contractors..."
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
            <option value="all">All 15 Stages</option>
            {CONSTRUCTION_STAGES.map(s => (
              <option key={s.id} value={String(s.id)}>Stage {s.id}: {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start min-h-[600px]">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.status);

          return (
            <div
              key={col.status}
              className="bg-slate-100/70 rounded-xl p-3 border border-slate-200 flex flex-col max-h-[85vh]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">{col.label}</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Column */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No tasks in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map(task => {
                    const hasDependencies = task.dependencies && task.dependencies.length > 0;
                    const prereqTasks = tasks.filter(t => task.dependencies.includes(t.id));
                    const prereqsCompleted = prereqTasks.every(t => t.status === 'Completed');

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                          task.status === 'Blocked' ? 'border-rose-300 bg-rose-50/20' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              Stage {task.stageId}
                            </span>
                            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                              task.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                              task.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug line-clamp-2">
                            {task.title}
                          </h4>

                          <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">
                            {task.unitNumber}
                          </div>
                        </div>

                        {/* Dependencies warning tag */}
                        {hasDependencies && (
                          <div className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                            prereqsCompleted ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold'
                          }`}>
                            <Layers className="w-3 h-3" />
                            <span>
                              {prereqTasks.length} Prerequisite{prereqTasks.length > 1 ? 's' : ''} ({prereqsCompleted ? '✓ Done' : 'Waiting'})
                            </span>
                          </div>
                        )}

                        {/* Blocked reason */}
                        {task.status === 'Blocked' && task.blockedReason && (
                          <div className="text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200 leading-tight">
                            <strong>Reason:</strong> {task.blockedReason}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span className="truncate max-w-[100px]">{task.assignedTo.split(' ')[0]}</span>
                          <span>{task.plannedFinishDate.split('-').slice(1).join('/')}</span>
                        </div>

                        {/* Fast Status Selector */}
                        <div className="pt-1 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                            className="text-[10px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 w-full focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="Not Started">Move: Not Started</option>
                            <option value="In Progress">Move: In Progress</option>
                            <option value="Blocked">Move: Blocked</option>
                            <option value="Awaiting Approval">Move: Awaiting Approval</option>
                            <option value="Completed">Move: Completed</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          subtitle={`${selectedTask.unitNumber} · Stage ${selectedTask.stageId}: ${selectedTask.stageName}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Priority</span>
                <span className="font-bold text-slate-800">{selectedTask.priority}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Contractor</span>
                <span className="font-bold text-slate-800 truncate block">{selectedTask.assignedTo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Planned Finish</span>
                <span className="font-bold text-slate-800">{selectedTask.plannedFinishDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Approval</span>
                <span className="font-bold text-slate-800">{selectedTask.approvalStatus}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-1">Task Description</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {selectedTask.description}
              </p>
            </div>

            {/* Dependencies Checklist */}
            {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-1">Mandatory Prerequisites</h4>
                <div className="space-y-1.5">
                  {tasks
                    .filter(t => selectedTask.dependencies.includes(t.id))
                    .map(dep => (
                      <div
                        key={dep.id}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                          dep.status === 'Completed'
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50/60 border-amber-200 text-amber-900'
                        }`}
                      >
                        <span>{dep.title}</span>
                        <TaskStatusBadge status={dep.status} />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Progress Notes Log */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-1">Site Progress Notes Log</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto mb-2">
                {selectedTask.progressNotes.map((note, idx) => (
                  <div key={idx} className="text-xs bg-slate-50 p-2 rounded border border-slate-100 text-slate-700">
                    {note}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProgressNote}
                  onChange={(e) => setNewProgressNote(e.target.value)}
                  placeholder="Enter daily progress remark, cement curing log, or delivery update..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddProgressNote(selectedTask.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Status Modification & PM Verification */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">Update Status:</label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => {
                    handleStatusChange(selectedTask, e.target.value as TaskStatus);
                    setSelectedTask(prev => prev ? { ...prev, status: e.target.value as TaskStatus } : null);
                  }}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Awaiting Approval">Awaiting Approval</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {selectedTask.status === 'Completed' && selectedTask.approvalStatus !== 'Verified by PM' && canVerifyMilestones && (
                  <button
                    type="button"
                    onClick={() => {
                      verifyTaskMilestone(selectedTask.id, currentUser.name);
                      setSelectedTask(prev => prev ? { ...prev, approvalStatus: 'Verified by PM', approvedBy: currentUser.name } : null);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100"
                  >
                    Verify Milestone
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Construction Task"
        subtitle="Schedule specific trade task for a property unit with dependencies"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveNewTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Italian marble polishing in living hall"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Unit *
              </label>
              <select
                value={formPropertyId}
                onChange={(e) => setFormPropertyId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                {scopedProperties.map(p => (
                  <option key={p.id} value={p.id}>{p.unitNumber} ({p.projectName})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Construction Stage (1-15) *
              </label>
              <select
                value={formStageId}
                onChange={(e) => setFormStageId(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                {CONSTRUCTION_STAGES.map(s => (
                  <option key={s.id} value={s.id}>Stage {s.id}: {s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Contractor / Trade Team
              </label>
              <input
                type="text"
                value={formAssignedTo}
                onChange={(e) => setFormAssignedTo(e.target.value)}
                placeholder="Contractor or supervisor name"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Start Date
              </label>
              <input
                type="date"
                value={formPlannedStart}
                onChange={(e) => setFormPlannedStart(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Finish Date
              </label>
              <input
                type="date"
                value={formPlannedFinish}
                onChange={(e) => setFormPlannedFinish(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prerequisite Dependency Task (Optional)
            </label>
            <select
              value={formDependencyTaskId}
              onChange={(e) => setFormDependencyTaskId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">None (Independent task)</option>
              {tasks
                .filter(t => t.propertyId === formPropertyId)
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.status})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs"
            >
              Save Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
