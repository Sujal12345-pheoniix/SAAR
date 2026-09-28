import type {
  ScheduleDiff,
  ScheduleSimulationResult,
} from './scheduling.types';

export interface PlanSimulationTask {
  id: string;
  title: string;
  scheduledAt?: string | null | undefined;
  dueAt?: string | null | undefined;
  estimatedMinutes?: number | null | undefined;
}

export interface ProposedPlanTask {
  id: string;
  title: string;
  scheduledAt?: string | null | undefined;
  dueAt?: string | null | undefined;
  estimatedMinutes?: number | null | undefined;
  action?: 'KEEP' | 'MOVE' | 'ADD' | 'REMOVE' | 'DELAY' | undefined;
}

/**
 * Pure deterministic Schedule Simulator:
 * Compares Current Plan against Proposed Plan, computing concrete diffs,
 * net duration delta, conflict changes, and overall schedule feasibility.
 */
export function simulateSchedule(
  currentPlanVersion: number,
  currentTasks: readonly PlanSimulationTask[],
  proposedTasks: readonly ProposedPlanTask[],
  maxDailyCapacityMinutes: number = 360, // 6 hours elective task max
): ScheduleSimulationResult {
  const currentMap = new Map(currentTasks.map((t) => [t.id, t]));
  const proposedMap = new Map(proposedTasks.map((t) => [t.id, t]));

  const tasksMoved: ScheduleDiff['tasksMoved'] = [];
  const tasksDelayed: ScheduleDiff['tasksDelayed'] = [];
  const tasksAdded: ScheduleDiff['tasksAdded'] = [];
  const tasksRemoved: ScheduleDiff['tasksRemoved'] = [];
  const conflictsCreated: string[] = [];
  const conflictsResolved: string[] = [];

  let currentTotalMinutes = 0;
  let proposedTotalMinutes = 0;

  for (const t of currentTasks) {
    currentTotalMinutes += t.estimatedMinutes ?? 30;
  }

  for (const t of proposedTasks) {
    proposedTotalMinutes += t.estimatedMinutes ?? 30;
  }

  // Check for moved, delayed, or removed tasks
  for (const curr of currentTasks) {
    const proposed = proposedMap.get(curr.id);

    if (!proposed || proposed.action === 'REMOVE') {
      tasksRemoved.push({
        taskId: curr.id,
        title: curr.title,
        reason: 'Displaced to protect capacity or recovery buffer',
      });
    } else if (proposed.action === 'DELAY' || (proposed.dueAt && curr.dueAt && proposed.dueAt !== curr.dueAt)) {
      tasksDelayed.push({
        taskId: curr.id,
        originalDate: curr.dueAt ?? curr.scheduledAt ?? 'today',
        newDate: proposed.dueAt ?? proposed.scheduledAt ?? 'tomorrow',
      });
    } else if (proposed.scheduledAt && curr.scheduledAt && proposed.scheduledAt !== curr.scheduledAt) {
      tasksMoved.push({
        taskId: curr.id,
        fromTime: curr.scheduledAt,
        toTime: proposed.scheduledAt,
        reason: 'Shifted to higher-compatibility time window',
      });
    }
  }

  // Check for newly added tasks
  for (const prop of proposedTasks) {
    if (!currentMap.has(prop.id) || prop.action === 'ADD') {
      tasksAdded.push({
        taskId: prop.id,
        title: prop.title,
        scheduledAt: prop.scheduledAt ?? undefined,
      });
    }
  }

  // Evaluate capacity feasibility
  let feasibilityScore = 100;
  if (proposedTotalMinutes > maxDailyCapacityMinutes) {
    const overflow = proposedTotalMinutes - maxDailyCapacityMinutes;
    conflictsCreated.push(`Proposed workload (${proposedTotalMinutes}m) exceeds sustainable capacity (${maxDailyCapacityMinutes}m) by ${overflow}m.`);
    feasibilityScore = Math.max(20, 100 - Math.round((overflow / maxDailyCapacityMinutes) * 100));
  }

  if (tasksRemoved.length > 0) {
    conflictsResolved.push(`Relieved previous congestion by deferring ${tasksRemoved.length} task(s).`);
  }

  const netDurationMinutesDelta = proposedTotalMinutes - currentTotalMinutes;

  const diff: ScheduleDiff = {
    tasksMoved,
    tasksDelayed,
    tasksAdded,
    tasksRemoved,
    conflictsCreated,
    conflictsResolved,
    netDurationMinutesDelta,
  };

  const summary = `Proposed Plan V${currentPlanVersion + 1}: ${tasksAdded.length} added, ${tasksMoved.length} moved, ${tasksDelayed.length} delayed, ${tasksRemoved.length} deferred. Net duration change: ${netDurationMinutesDelta >= 0 ? '+' : ''}${netDurationMinutesDelta}m. Feasibility: ${feasibilityScore}%.`;

  return {
    currentPlanVersion,
    proposedPlanVersion: currentPlanVersion + 1,
    diff,
    feasibilityScore,
    summary,
  };
}
