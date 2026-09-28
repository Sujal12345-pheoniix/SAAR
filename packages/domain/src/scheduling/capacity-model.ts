import type { ScheduleCapacity } from './scheduling.types';

export interface TaskCapacityItem {
  id: string;
  estimatedMinutes?: number | null | undefined;
  actualDurationMinutes?: number | null | undefined;
}

export interface RoutineCapacityItem {
  id: string;
  expectedDurationMinutes?: number | null | undefined;
}

/**
 * Pure function computing daily schedule capacity with realistic transition buffers.
 */
export function calculateScheduleCapacity(
  tasks: readonly TaskCapacityItem[],
  routines: readonly RoutineCapacityItem[] = [],
  sleepMinutes: number = 480, // 8 hours
  fixedCommitmentMinutes: number = 480, // e.g. standard work/study 8 hours
  bufferPerItemMinutes: number = 15, // 15 mins transition buffer between distinct activities
): ScheduleCapacity {
  const totalDayMinutes = 1440;

  const plannedTaskMinutes = tasks.reduce(
    (sum, t) => sum + (t.estimatedMinutes ?? t.actualDurationMinutes ?? 30),
    0,
  );

  const scheduledRoutineMinutes = routines.reduce(
    (sum, r) => sum + (r.expectedDurationMinutes ?? 30),
    0,
  );

  const totalItemCount = tasks.length + routines.length;
  const transitionBufferMinutes = totalItemCount > 0 ? totalItemCount * bufferPerItemMinutes : 60;

  const committedMinutes =
    sleepMinutes +
    fixedCommitmentMinutes +
    scheduledRoutineMinutes +
    plannedTaskMinutes +
    transitionBufferMinutes;

  const usableDiscretionaryMinutes = Math.max(0, totalDayMinutes - committedMinutes);

  return {
    totalDayMinutes,
    sleepMinutes,
    fixedCommitmentMinutes,
    scheduledRoutineMinutes,
    plannedTaskMinutes,
    transitionBufferMinutes,
    usableDiscretionaryMinutes,
  };
}
