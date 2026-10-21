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
 * Calculates property weighted progress percentage
 * based strictly on its CONTRACTED required tasks.
 * Excluded activities are excluded from the denominator.
 */
export function calculatePropertyProgress(
  property: Property,
  propertyTasks: ConstructionTask[]
): { overallProgress: number; verifiedProgress: number } {
  const requiredTasks = propertyTasks.filter(task => {
    if (task.propertyId !== property.id) return false;
    return property.includedActivities.includes(task.activityId) || task.isCustomizationImpact;
  });

  if (requiredTasks.length === 0) return { overallProgress: 0, verifiedProgress: 0 };

  const totalWeight = requiredTasks.reduce((sum, t) => sum + (t.weight || 1), 0);
  
  let completedWeight = 0;
  let verifiedWeight = 0;

  requiredTasks.forEach(task => {
    const w = task.weight || 1;
    if (task.status === 'Completed') {
      completedWeight += w;
      if (task.approvalStatus === 'Verified by PM') {
        verifiedWeight += w;
      }
    } else if (task.status === 'Awaiting Approval') {
      // Coordinator submitted, pending manager sign-off
      completedWeight += w * 0.9;
    } else if (task.status === 'In Progress') {
      completedWeight += w * 0.4;
    }
  });

  const overallProgress = Math.min(100, Math.round((completedWeight / totalWeight) * 100));
  const verifiedProgress = Math.min(100, Math.round((verifiedWeight / totalWeight) * 100));

  return { overallProgress, verifiedProgress };
}
