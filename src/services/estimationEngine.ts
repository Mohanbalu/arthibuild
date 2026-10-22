import { ConstructionTask, Property, CustomizationRequest } from '../types';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

export interface ForecastResult {
  propertyId: string;
  originalDeliveryDate: string;
  calculatedEstimatedDate: string;
  currentEstimatedDate: string;
  daysRemainingOrOverdue: number; // positive = days until delivery, negative = days overdue
  varianceFromCommittedDays: number; // difference between estimated and original
  riskLevel: 'On Track' | 'Low Risk' | 'Moderate Delay' | 'Critical Delay';
  riskBadgeClass: string;
  remainingRequiredTaskCount: number;
  totalRequiredTaskCount: number;
  remainingCriticalWorkDays: number;
  approvedCustomizationExtraDays: number;
  blockedTaskCount: number;
  primaryDelayReason: string;
  calculationExplanation: string;
}

/**
 * Calculates rule-based estimated delivery date for a specific property
 * based on its contractual required tasks, remaining dependencies,
 * approved customization schedule impacts, and recorded delays.
 */
export function calculatePropertyDeliveryForecast(
  property: Property,
  propertyTasks: ConstructionTask[],
  customizationRequests: CustomizationRequest[] = []
): ForecastResult {
  // 1. Filter tasks that belong to this property and are required by its contract scope
  const requiredTasks = propertyTasks.filter(task => {
    // Check if task activity is in includedActivities or is a custom scope impact
    if (task.propertyId !== property.id) return false;
    return property.includedActivities.includes(task.activityId) || task.isCustomizationImpact;
  });

  const totalRequiredTaskCount = requiredTasks.length;
  const remainingTasks = requiredTasks.filter(t => t.status !== 'Completed');
  const remainingRequiredTaskCount = remainingTasks.length;
  const blockedTasks = remainingTasks.filter(t => t.status === 'Blocked');

  // 2. Compute approved customization schedule impact days
  const approvedCustomizations = customizationRequests.filter(
    r => r.propertyId === property.id && (r.status === 'Approved' || r.status === 'Completed')
  );
  const approvedCustomizationExtraDays = approvedCustomizations.reduce(
    (sum, r) => sum + (r.scheduleImpactDays || 0), 0
  );

  // 3. Compute remaining work days via Critical Path estimation
  // Tasks in different stages follow sequential stage order (stages 1 to 15),
  // but tasks within the same stage can partially execute in parallel.
  // We group remaining tasks by stageId and take max duration in each stage, then sum across stages.
  const stageDurations: Record<number, number> = {};

  remainingTasks.forEach(task => {
    let taskDuration = 7; // default fallback days
    if (task.plannedStartDate && task.plannedFinishDate) {
      try {
        const diff = differenceInCalendarDays(parseISO(task.plannedFinishDate), parseISO(task.plannedStartDate));
        taskDuration = Math.max(diff, 3);
      } catch {
        taskDuration = 7;
      }
    }
    // For tasks currently In Progress or Awaiting Approval, reduce remaining duration by 50%
    if (task.status === 'In Progress') {
      taskDuration = Math.ceil(taskDuration * 0.5);
    } else if (task.status === 'Awaiting Approval') {
      taskDuration = Math.max(1, Math.ceil(taskDuration * 0.2));
    }

    // Parallel execution within same stage: we take the maximum critical task in that stage
    stageDurations[task.stageId] = Math.max(stageDurations[task.stageId] || 0, taskDuration);
  });

  // Sum critical stage durations
  const criticalPathRemainingDays = Object.values(stageDurations).reduce((acc, curr) => acc + curr, 0);

  // Add buffer for blocked tasks (each blocked task introduces at least 3-7 days idle delay)
  const blockedDaysBuffer = blockedTasks.length * 4;

  const totalRemainingWorkDays = criticalPathRemainingDays + approvedCustomizationExtraDays + blockedDaysBuffer;

  // 4. Calculate forecasted completion date from today's reference date
  // Fixed reference date or current real time
  const today = new Date();
  const calculatedTargetDate = remainingRequiredTaskCount === 0 
    ? (property.handoverDate ? parseISO(property.handoverDate) : today)
    : addDays(today, totalRemainingWorkDays);

  const calculatedEstimatedDate = format(calculatedTargetDate, 'yyyy-MM-dd');

  // Compare with committed date
  let committedDate: Date;
  try {
    committedDate = parseISO(property.originalCommittedDate);
  } catch {
    committedDate = today;
  }

  const daysRemainingOrOverdue = differenceInCalendarDays(committedDate, today);
  const varianceFromCommittedDays = differenceInCalendarDays(calculatedTargetDate, committedDate);

  // 5. Determine delivery risk level & explanation
  let riskLevel: ForecastResult['riskLevel'] = 'On Track';
  let riskBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let primaryDelayReason = 'Work is proceeding within planned schedule margins.';

  if (blockedTasks.length > 0) {
    riskLevel = 'Critical Delay';
    riskBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    primaryDelayReason = `Prerequisite work blocked: ${blockedTasks.map(b => b.title).join(', ')}`;
  } else if (varianceFromCommittedDays > 30) {
    riskLevel = 'Critical Delay';
    riskBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    primaryDelayReason = `Forecast exceeds committed date by ${varianceFromCommittedDays} days due to civil dependencies and approved customization requests.`;
  } else if (varianceFromCommittedDays > 10) {
    riskLevel = 'Moderate Delay';
    riskBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    primaryDelayReason = `Minor project variance of ${varianceFromCommittedDays} days due to site curing and vendor dispatch.`;
  } else if (varianceFromCommittedDays > 0) {
    riskLevel = 'Low Risk';
    riskBadgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    primaryDelayReason = 'Slight timeline buffer adjustment (+/- 5 days).';
  }

  const explanation = remainingRequiredTaskCount === 0
    ? 'All required contractual tasks and inspections completed. Unit cleared for handover.'
    : `Forecast based on ${remainingRequiredTaskCount} remaining contractual tasks across ${Object.keys(stageDurations).length} active stages (${criticalPathRemainingDays} critical path days) + ${approvedCustomizationExtraDays} approved customization days${blockedDaysBuffer > 0 ? ` + ${blockedDaysBuffer}d blocked task buffer` : ''}.`;

  return {
    propertyId: property.id,
    originalDeliveryDate: property.originalCommittedDate,
    calculatedEstimatedDate,
    currentEstimatedDate: property.currentEstimatedDate || calculatedEstimatedDate,
    daysRemainingOrOverdue,
    varianceFromCommittedDays,
    riskLevel,
    riskBadgeClass,
    remainingRequiredTaskCount,
    totalRequiredTaskCount,
    remainingCriticalWorkDays: totalRemainingWorkDays,
    approvedCustomizationExtraDays,
    blockedTaskCount: blockedTasks.length,
    primaryDelayReason,
    calculationExplanation: explanation
  };
}

/**
 * Resolves the effective completion percentage (0 - 100) for a task based on its status and recorded value:
 * - Completed: 100%
 * - In Progress: recorded completionPercentage (default 50% if not specified, clamped [0, 100])
 * - Awaiting Approval: recorded completionPercentage (default 90% if not specified, clamped [0, 100])
 * - Not Started: 0% unless explicit partial-completion value is recorded
 * - Blocked: 0% unless explicit partial-completion value is recorded
 */
export function getTaskEffectiveCompletion(task: ConstructionTask): number {
  const hasExplicit = typeof task.completionPercentage === 'number' && !isNaN(task.completionPercentage);
  const explicit = hasExplicit ? Math.max(0, Math.min(100, Math.round(task.completionPercentage!))) : null;

  switch (task.status) {
    case 'Completed':
      return 100;
    case 'In Progress':
      return explicit !== null ? explicit : 50;
    case 'Awaiting Approval':
      return explicit !== null ? explicit : 90;
    case 'Not Started':
    case 'Blocked':
      return explicit !== null ? explicit : 0;
    default:
      return 0;
  }
}

/**
 * Validates and returns a positive weight for a task (defaults to 1 if missing or invalid).
 */
export function getTaskWeight(task: ConstructionTask): number {
  const w = Number(task.weight);
  if (isNaN(w) || w <= 0) return 1;
  return Math.max(1, Math.round(w * 10) / 10);
}

export interface ProgressCalculationResult {
  progress: number; // 0 to 100
  remainingPercentage: number; // 100 - progress
  verifiedProgress: number; // 0 to 100 (only PM verified completed milestones)
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  notStartedTasks: number;
  awaitingTasks: number;
  totalWeight: number;
  completedWeightedSum: number;
  isAllEqualWeight: boolean;
  hasTasks: boolean;
  statusLabel: string; // e.g. "78% Complete" or "Tasks not configured"
  calculationExplanation: string;
  formula: string;
  stagesBreakdown: {
    stageId: number;
    stageName: string;
    totalTasks: number;
    completedTasks: number;
    stageWeight: number;
    stageProgress: number;
  }[];
}

/**
 * Calculates weighted project progress dynamically from its linked tasks:
 * Project Progress = Sum(Task Weight × Task Completion Percentage) / Sum(Task Weights)
 * If all tasks have equal weights, this computes the average completion percentage.
 */
export function calculateProjectProgress(
  projectTasks: ConstructionTask[]
): ProgressCalculationResult {
  if (!projectTasks || projectTasks.length === 0) {
    return {
      progress: 0,
      remainingPercentage: 100,
      verifiedProgress: 0,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      blockedTasks: 0,
      notStartedTasks: 0,
      awaitingTasks: 0,
      totalWeight: 0,
      completedWeightedSum: 0,
      isAllEqualWeight: true,
      hasTasks: false,
      statusLabel: 'Tasks not configured',
      calculationExplanation: 'No construction tasks have been linked to this project yet. Add tasks or apply a stage template to track dynamic progress.',
      formula: 'Sum(Weight × Completion) / Sum(Weight) = 0 / 0 = 0%',
      stagesBreakdown: []
    };
  }

  let totalWeight = 0;
  let completedWeightedSum = 0;
  let verifiedWeightedSum = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let blockedTasks = 0;
  let notStartedTasks = 0;
  let awaitingTasks = 0;

  const weights = projectTasks.map(getTaskWeight);
  const firstWeight = weights[0];
  const isAllEqualWeight = weights.every(w => Math.abs(w - firstWeight) < 0.001);

  // Group by stage for stage-wise breakdown
  const stageMap: Record<number, { stageName: string; tasks: ConstructionTask[] }> = {};

  projectTasks.forEach(task => {
    const weight = getTaskWeight(task);
    const completion = getTaskEffectiveCompletion(task);
    totalWeight += weight;
    completedWeightedSum += weight * completion;

    if (task.status === 'Completed' && task.approvalStatus === 'Verified by PM') {
      verifiedWeightedSum += weight * 100;
    }

    if (task.status === 'Completed') completedTasks++;
    else if (task.status === 'In Progress') inProgressTasks++;
    else if (task.status === 'Blocked') blockedTasks++;
    else if (task.status === 'Awaiting Approval') awaitingTasks++;
    else notStartedTasks++;

    if (!stageMap[task.stageId]) {
      stageMap[task.stageId] = { stageName: task.stageName || `Stage ${task.stageId}`, tasks: [] };
    }
    stageMap[task.stageId].tasks.push(task);
  });

  const rawProgress = totalWeight > 0 ? completedWeightedSum / totalWeight : 0;
  const progress = Math.min(100, Math.max(0, Math.round(rawProgress)));
  const remainingPercentage = 100 - progress;

  const rawVerified = totalWeight > 0 ? verifiedWeightedSum / totalWeight : 0;
  const verifiedProgress = Math.min(100, Math.max(0, Math.round(rawVerified)));

  const stagesBreakdown = Object.entries(stageMap).map(([sId, info]) => {
    const stageId = Number(sId);
    let sWeight = 0;
    let sWeightedSum = 0;
    let sCompleted = 0;
    info.tasks.forEach(t => {
      const w = getTaskWeight(t);
      const c = getTaskEffectiveCompletion(t);
      sWeight += w;
      sWeightedSum += w * c;
      if (t.status === 'Completed') sCompleted++;
    });
    const sProgress = sWeight > 0 ? Math.min(100, Math.max(0, Math.round(sWeightedSum / sWeight))) : 0;
    return {
      stageId,
      stageName: info.stageName,
      totalTasks: info.tasks.length,
      completedTasks: sCompleted,
      stageWeight: Math.round(sWeight * 10) / 10,
      stageProgress: sProgress
    };
  }).sort((a, b) => a.stageId - b.stageId);

  const formula = isAllEqualWeight
    ? `Average Completion = Sum(Task Completion %) / ${projectTasks.length} = ${Math.round(completedWeightedSum / firstWeight)} / ${projectTasks.length} = ${progress}%`
    : `Weighted Progress = Sum(Weight × Completion %) / Sum(Weights) = ${Math.round(completedWeightedSum)} / ${Math.round(totalWeight)} = ${progress}%`;

  const calculationExplanation = `Calculated across ${projectTasks.length} linked tasks (${completedTasks} completed, ${inProgressTasks} in progress, ${blockedTasks} blocked, ${awaitingTasks} awaiting verification, ${notStartedTasks} not started). Total task weight: ${Math.round(totalWeight)}.`;

  return {
    progress,
    remainingPercentage,
    verifiedProgress,
    totalTasks: projectTasks.length,
    completedTasks,
    inProgressTasks,
    blockedTasks,
    notStartedTasks,
    awaitingTasks,
    totalWeight: Math.round(totalWeight * 10) / 10,
    completedWeightedSum: Math.round(completedWeightedSum * 10) / 10,
    isAllEqualWeight,
    hasTasks: true,
    statusLabel: `${progress}% Complete`,
    calculationExplanation,
    formula,
    stagesBreakdown
  };
}

/**
 * Calculates property weighted progress percentage
 * based strictly on its CONTRACTED required tasks and validated weights/completion percentages.
 * Excluded activities are excluded from the denominator.
 */
export function calculatePropertyProgress(
  property: Property,
  propertyTasks: ConstructionTask[]
): { overallProgress: number; verifiedProgress: number; hasTasks: boolean; remainingPercentage: number; calculationResult: ProgressCalculationResult } {
  const requiredTasks = propertyTasks.filter(task => {
    if (task.propertyId !== property.id) return false;
    return property.includedActivities.includes(task.activityId) || task.isCustomizationImpact;
  });

  const calculationResult = calculateProjectProgress(requiredTasks);

  return {
    overallProgress: calculationResult.progress,
    verifiedProgress: calculationResult.verifiedProgress,
    remainingPercentage: calculationResult.remainingPercentage,
    hasTasks: calculationResult.hasTasks,
    calculationResult
  };
}

/**
 * Calculates building/wing progress for an apartment complex from its units and tasks.
 */
export function calculateBuildingProgress(
  buildingId: string,
  projectTasks: ConstructionTask[],
  buildingProperties: Property[]
): { progress: number; remainingPercentage: number; totalUnits: number; totalTasks: number } {
  const buildingTasks = projectTasks.filter(t => {
    if (t.buildingId === buildingId) return true;
    const prop = buildingProperties.find(p => p.id === t.propertyId);
    return prop && prop.buildingId === buildingId;
  });

  if (buildingTasks.length > 0) {
    const res = calculateProjectProgress(buildingTasks);
    return {
      progress: res.progress,
      remainingPercentage: res.remainingPercentage,
      totalUnits: buildingProperties.length,
      totalTasks: buildingTasks.length
    };
  }

  // Fallback to average of property units if tasks have not yet been assigned buildingId
  if (buildingProperties.length > 0) {
    const avg = Math.round(buildingProperties.reduce((sum, p) => sum + p.overallProgress, 0) / buildingProperties.length);
    return {
      progress: avg,
      remainingPercentage: 100 - avg,
      totalUnits: buildingProperties.length,
      totalTasks: 0
    };
  }

  return { progress: 0, remainingPercentage: 100, totalUnits: 0, totalTasks: 0 };
}

