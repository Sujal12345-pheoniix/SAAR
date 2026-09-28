import type {
  DailyExecutionSummary,
  DailyTomorrowPlanPreview,
  TomorrowCandidateTask,
} from './daily-growth.types';
import type { RankedScheduleCandidate, ScheduleCapacity } from '../scheduling/scheduling.types';

export interface TaskRecordItem {
  id: string;
  status: string;
  actualDurationMinutes?: number | null | undefined;
  estimatedMinutes?: number | null | undefined;
  rescheduleCount?: number | undefined;
}

/**
 * Pure calculation of daily execution summary from a list of tasks for a given date.
 */
export function calculateDailyExecutionSummary(
  tasks: readonly TaskRecordItem[],
): DailyExecutionSummary {
  const plannedTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const skippedTasksCount = tasks.filter((t) => t.status === 'SKIPPED').length;
  const rescheduledTasksCount = tasks.filter(
    (t) => t.status === 'RESCHEDULED' || (t.rescheduleCount && t.rescheduleCount > 0),
  ).length;

  const completionRate =
    plannedTasksCount > 0 ? Math.round((completedTasksCount / plannedTasksCount) * 100) : 0;

  const frictionScore =
    plannedTasksCount > 0
      ? Math.round(((skippedTasksCount + rescheduledTasksCount) / plannedTasksCount) * 100)
      : 0;

  const totalMinutesInvested = tasks.reduce(
    (sum, t) => sum + (t.status === 'COMPLETED' ? (t.actualDurationMinutes ?? t.estimatedMinutes ?? 30) : 0),
    0,
  );

  return {
    plannedTasksCount,
    completedTasksCount,
    skippedTasksCount,
    rescheduledTasksCount,
    completionRate,
    frictionScore,
    totalMinutesInvested,
  };
}

/**
 * Pure compiler of tomorrow's plan preview based on ranked candidates and available capacity.
 */
export function compileTomorrowPlanPreview(
  rankedCandidates: readonly RankedScheduleCandidate[],
  capacity: ScheduleCapacity,
  targetDate: string,
  maxTasksLimit: number = 4,
): DailyTomorrowPlanPreview {
  const usableCapacity = capacity.usableDiscretionaryMinutes;
  let allocatedMinutes = 0;
  const candidateTasks: TomorrowCandidateTask[] = [];
  const conflicts: string[] = [];

  for (const item of rankedCandidates) {
    if (candidateTasks.length >= maxTasksLimit) {
      break;
    }

    const estMinutes = item.candidate.estimatedMinutes;
    if (allocatedMinutes + estMinutes <= usableCapacity) {
      allocatedMinutes += estMinutes;
      candidateTasks.push({
        taskId: item.candidate.id,
        title: item.candidate.title,
        goalTitle: item.candidate.goalId ? 'Active Goal' : undefined,
        priority: item.candidate.goalPriority ?? 3,
        estimatedMinutes: estMinutes,
        rankingScore: item.score.finalScore,
        selectionReason: item.score.explanation,
      });
    } else {
      conflicts.push(`Omitted '${item.candidate.title}' (${estMinutes}m) to preserve buffer.`);
    }
  }

  const feasibilityScore =
    usableCapacity > 0 ? Math.min(100, Math.round(((usableCapacity - allocatedMinutes) / usableCapacity) * 100)) : 50;

  return {
    targetDate,
    capacityMinutes: usableCapacity,
    allocatedMinutes,
    candidateTasks,
    conflicts,
    feasibilityScore,
  };
}
