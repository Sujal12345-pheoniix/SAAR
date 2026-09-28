import type {
  InterventionCandidate,
} from './intervention.types';
import type { GapFinding } from '../gap/gap.types';
import type {
  ExecutionFeatures,
  RoutineFeatures,
  WellBeingFeatures,
  LifeAreaFeatures,
} from '../features/feature.types';

export interface InterventionSelectionContext {
  userId: string;
  gaps: readonly GapFinding[];
  execution7d: ExecutionFeatures;
  routine7d: RoutineFeatures;
  wellbeing7d?: WellBeingFeatures | undefined;
  lifeAreas?: LifeAreaFeatures | undefined;
  tasksWithFriction?: Array<{
    id: string;
    title: string;
    rescheduleCount: number;
    estimatedMinutes?: number | null | undefined;
  }> | undefined;
}

/**
 * Pure deterministic Intervention Selector:
 * Maps detected gaps and behavioral signals into evidence-backed, measurable interventions.
 */
export function selectInterventions(
  context: InterventionSelectionContext,
): InterventionCandidate[] {
  const candidates: InterventionCandidate[] = [];

  // Rule ADAPT-001: Monolithic Task Friction -> SPLIT_TASK
  if (context.tasksWithFriction) {
    for (const t of context.tasksWithFriction) {
      if (t.rescheduleCount >= 2 && (t.estimatedMinutes ?? 60) >= 60) {
        candidates.push({
          id: `int_split_${t.id}`,
          actionType: 'SPLIT_TASK',
          title: `Split Monolithic Task: '${t.title}'`,
          reason: `Task has been rescheduled ${t.rescheduleCount} times and is estimated at ${t.estimatedMinutes ?? 60}m. Breaking it down overcomes initiation friction.`,
          evidence: [
            { metric: 'reschedule_count', actual: t.rescheduleCount, expected: 0 },
            { metric: 'estimated_minutes', actual: t.estimatedMinutes ?? 60, expected: 30 },
          ],
          expectedOutcome: 'Increases completion likelihood by breaking monolithic demand into two 20-30m sub-tasks.',
          confidence: 'ESTABLISHED_SIGNAL',
          requiredUserAction: 'Approve splitting into 2 focused micro-tasks for tomorrow.',
          measurementWindowDays: 7,
          baselineMetric: {
            name: 'task_completion_rate',
            value: 0,
            unit: '%',
          },
          payload: { originalTaskId: t.id, splitCount: 2 },
        });
      }
    }
  }

  // Rule ADAPT-003: Chronic Over-Planning & Friction -> REDUCE_SCOPE
  const frictionRate = context.execution7d.skipRate + context.execution7d.rescheduleRate;
  if (
    context.execution7d.tasksPlanned >= 5 &&
    context.execution7d.completionRate < 50 &&
    frictionRate >= 40
  ) {
    candidates.push({
      id: `int_reduce_scope_${context.userId}`,
      actionType: 'REDUCE_SCOPE',
      title: 'Cap Daily Task Load at 3 Core Commitments',
      reason: `Planning ${context.execution7d.tasksPlanned} tasks with a ${context.execution7d.completionRate}% completion rate produces chronic friction.`,
      evidence: [
        { metric: 'completion_rate', actual: `${context.execution7d.completionRate}%`, expected: '>= 70%', windowDays: 7 },
        { metric: 'friction_rate', actual: `${frictionRate}%`, expected: '< 25%', windowDays: 7 },
      ],
      expectedOutcome: 'Lowers daily cognitive overload, restoring execution velocity and consistency above 70%.',
      confidence: 'ESTABLISHED_SIGNAL',
      requiredUserAction: 'Accept 3-task daily planning limit for the next 7 days.',
      measurementWindowDays: 7,
      baselineMetric: {
        name: 'completion_rate',
        value: context.execution7d.completionRate,
        unit: '%',
      },
      payload: { maxTasksPerDay: 3 },
    });
  }

  // Rule ADAPT-005: Habit Stagnation / Broken Streak -> RESTORE_ROUTINE
  if (
    context.routine7d.sampleSize >= 3 &&
    context.routine7d.adherenceRate < 40
  ) {
    candidates.push({
      id: `int_restore_routine_${context.userId}`,
      actionType: 'RESTORE_ROUTINE',
      title: 'Re-anchor Dormant Routine with Low Friction',
      reason: `Routine adherence has fallen to ${context.routine7d.adherenceRate}% across the last 7 days.`,
      evidence: [
        { metric: 'routine_adherence_rate', actual: `${context.routine7d.adherenceRate}%`, expected: '>= 75%', windowDays: 7 },
      ],
      expectedOutcome: 'Re-establishes habit baseline through a simplified 10-minute starter version.',
      confidence: 'ESTABLISHED_SIGNAL',
      requiredUserAction: 'Select a 10-minute anchor window for your routine tomorrow.',
      measurementWindowDays: 7,
      baselineMetric: {
        name: 'routine_adherence_rate',
        value: context.routine7d.adherenceRate,
        unit: '%',
      },
    });
  }

  // Rule ADAPT-006: High Priority Goal Neglect -> CREATE_SMALLER_STEP
  const priorityGap = context.gaps.find((g) => g.gapType === 'PRIORITY_GAP');
  if (priorityGap) {
    candidates.push({
      id: `int_starter_step_${priorityGap.goalId ?? 'p1'}`,
      actionType: 'CREATE_SMALLER_STEP',
      title: `Schedule 15m Starter Action for '${priorityGap.title}'`,
      reason: 'Top priority goal is experiencing stagnation without active execution.',
      evidence: priorityGap.evidence.map((e: { metricName: string; actual: unknown; expected: unknown }) => ({
        metric: e.metricName,
        actual: e.actual,
        expected: e.expected,
        windowDays: 7,
      })),
      expectedOutcome: 'Breaks execution inertia by locking a single 15-minute high-probability starter task.',
      confidence: priorityGap.confidence,
      requiredUserAction: 'Add a 15-minute task for this goal to tomorrow morning plan.',
      measurementWindowDays: 7,
      baselineMetric: {
        name: 'goal_completed_tasks_14d',
        value: 0,
      },
      payload: { goalId: priorityGap.goalId },
    });
  }

  // Rule ADAPT-008: Low Wellbeing & High Workload -> REFLECT
  if (
    context.wellbeing7d &&
    context.wellbeing7d.sampleSize >= 3 &&
    (context.wellbeing7d.avgMood ?? 5) <= 2.5 &&
    (context.wellbeing7d.avgEnergy ?? 5) <= 2.5
  ) {
    candidates.push({
      id: `int_recovery_reflection_${context.userId}`,
      actionType: 'REFLECT',
      title: 'Schedule Recovery Window & Energy Reflection',
      reason: `Average energy (${context.wellbeing7d.avgEnergy}/5) and mood (${context.wellbeing7d.avgMood}/5) indicate elevated burnout risk.`,
      evidence: [
        { metric: 'avg_energy', actual: context.wellbeing7d.avgEnergy, expected: '>= 3.5', windowDays: 7 },
        { metric: 'avg_mood', actual: context.wellbeing7d.avgMood, expected: '>= 3.5', windowDays: 7 },
      ],
      expectedOutcome: 'Prevents burnout cascade by protecting 60 minutes of evening rest.',
      confidence: 'EMERGING_SIGNAL',
      requiredUserAction: 'Commit to zero elective tasks after 20:00 tonight.',
      measurementWindowDays: 3,
      baselineMetric: {
        name: 'avg_energy',
        value: context.wellbeing7d.avgEnergy ?? 2,
      },
    });
  }

  return candidates;
}
