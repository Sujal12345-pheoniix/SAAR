import type {
  GrowthFinding,
  GoalComparisonTarget,
  FutureSelfTarget,
} from './gap.types';
import type {
  ExecutionFeatures,
  ConsistencyFeatures,
  RoutineFeatures,
  LifeAreaFeatures,
} from '../features/feature.types';

export interface GapEngineInput {
  userId: string;
  goals: GoalComparisonTarget[];
  futureSelf?: FutureSelfTarget | null;
  execution7d: ExecutionFeatures;
  execution30d?: ExecutionFeatures;
  consistency7d: ConsistencyFeatures;
  routine7d: RoutineFeatures;
  lifeAreas: LifeAreaFeatures;
  taskCompletionsByGoal?: Record<string, number>;
  calculatedAt?: string;
}

/**
 * Pure Gap Engine for SAAR.
 * Evaluates behavioral features against goals and desired states.
 */
export function detectGaps(input: GapEngineInput): GrowthFinding[] {
  const findings: GrowthFinding[] = [];
  const now = input.calculatedAt ?? new Date().toISOString();

  // 1. QUANTITY GAPS (Goal Target vs Actual Current Value or Frequency)
  for (const goal of input.goals) {
    if (goal.targetMetricValue !== undefined && goal.currentMetricValue !== undefined) {
      const deficit = goal.targetMetricValue - goal.currentMetricValue;
      if (deficit > 0) {
        findings.push({
          id: `gap-quantity-${goal.id}`,
          gapType: 'QUANTITY_GAP',
          title: `Progress Deficit on "${goal.title}"`,
          summary: `Current metric value is ${goal.currentMetricValue} ${goal.unit ?? ''}, which is ${deficit} ${goal.unit ?? ''} behind the target of ${goal.targetMetricValue} ${goal.unit ?? ''}.`,
          goalId: goal.id,
          areaType: goal.lifeAreaType,
          magnitude: Math.round(deficit * 10) / 10,
          confidence: 'ESTABLISHED_SIGNAL',
          trend: 'STABLE',
          evidence: [
            {
              metricName: 'target_value',
              expected: goal.targetMetricValue,
              actual: goal.currentMetricValue,
              windowDays: 30,
              unit: goal.unit,
            },
          ],
          algorithmVersion: '1.1.0',
          generatedAt: now,
        });
      }
    }
  }

  // 2. EXECUTION GAPS (High planning optimism vs actual completion)
  if (input.execution7d.sampleSize >= 3) {
    if (input.execution7d.completionRate < 60 && (input.execution7d.skipRate + input.execution7d.rescheduleRate) >= 35) {
      const frictionRate = input.execution7d.skipRate + input.execution7d.rescheduleRate;

      // Dynamic trend and confidence calculation from 7d vs 30d evidence
      let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'DECLINING';
      let confidence = input.execution7d.confidence;

      if (input.execution30d && input.execution30d.sampleSize >= 3) {
        const delta = input.execution7d.completionRate - input.execution30d.completionRate;
        if (delta > 5) {
          trend = 'IMPROVING';
        } else if (delta < -5) {
          trend = 'DECLINING';
        } else {
          trend = 'STABLE';
        }

        if (input.execution30d.sampleSize >= 7 || input.execution7d.sampleSize >= 7) {
          confidence = 'ESTABLISHED_SIGNAL';
        }
      }

      const evidence = [
        {
          metricName: 'completion_rate',
          expected: '80%',
          actual: `${input.execution7d.completionRate}%`,
          windowDays: 7,
        },
        ...(input.execution30d && input.execution30d.sampleSize >= 3
          ? [
              {
                metricName: 'completion_rate_30d_baseline',
                expected: '80%',
                actual: `${input.execution30d.completionRate}%`,
                windowDays: 30,
              },
            ]
          : []),
        {
          metricName: 'reschedule_rate',
          expected: '< 15%',
          actual: `${input.execution7d.rescheduleRate}%`,
          windowDays: 7,
        },
        {
          metricName: 'skip_rate',
          expected: '< 10%',
          actual: `${input.execution7d.skipRate}%`,
          windowDays: 7,
        },
      ];

      findings.push({
        id: `gap-execution-7d`,
        gapType: 'EXECUTION_GAP',
        title: 'Planning-to-Execution Friction',
        summary: `Out of ${input.execution7d.tasksPlanned} planned tasks in the last 7 days, ${frictionRate}% were skipped or rescheduled, resulting in a ${input.execution7d.completionRate}% completion rate.`,
        magnitude: Math.round((100 - input.execution7d.completionRate) * 10) / 10,
        confidence,
        trend,
        evidence,
        algorithmVersion: '1.1.0',
        generatedAt: now,
      });
    }
  }

  // 3. CONSISTENCY GAPS (Routine Adherence Deficits)
  if (input.routine7d.sampleSize >= 3 && input.routine7d.adherenceRate < 60) {
    const deficit = Math.round((100 - input.routine7d.adherenceRate) * 10) / 10;
    findings.push({
      id: `gap-consistency-routine-7d`,
      gapType: 'CONSISTENCY_GAP',
      title: 'Routine Adherence Below Expectation',
      summary: `Routine adherence is at ${input.routine7d.adherenceRate}% (${input.routine7d.completedOccurrences}/${input.routine7d.expectedOccurrences} completed) across the past 7 days.`,
      magnitude: deficit,
      confidence: input.routine7d.confidence,
      trend: 'DECLINING',
      evidence: [
        {
          metricName: 'routine_adherence_rate',
          expected: '80%',
          actual: `${input.routine7d.adherenceRate}%`,
          windowDays: 7,
        },
        {
          metricName: 'missed_or_skipped_occurrences',
          expected: 0,
          actual: input.routine7d.missedOccurrences + input.routine7d.skippedOccurrences,
          windowDays: 7,
        },
      ],
      algorithmVersion: '1.1.0',
      generatedAt: now,
    });
  }

  // 4. PRIORITY GAPS (High priority goal receiving zero/low behavioral execution)
  if (input.taskCompletionsByGoal) {
    const highPriorityGoals = input.goals.filter((g) => g.priority === 1 || g.priority === 2);
    for (const goal of highPriorityGoals) {
      const completions = input.taskCompletionsByGoal[goal.id] ?? 0;
      if (completions === 0 && input.execution7d.tasksCompleted >= 3) {
        findings.push({
          id: `gap-priority-${goal.id}`,
          gapType: 'PRIORITY_GAP',
          title: `Zero Activity Allocated to Priority Goal: "${goal.title}"`,
          summary: `Goal is designated as Priority ${goal.priority}, yet 0 of ${input.execution7d.tasksCompleted} completed tasks supported it over the past 7 days.`,
          goalId: goal.id,
          areaType: goal.lifeAreaType,
          magnitude: 100, // Complete disconnect
          confidence: 'EMERGING_SIGNAL',
          trend: 'STABLE',
          evidence: [
            {
              metricName: 'completed_tasks_for_goal',
              expected: '>= 2',
              actual: 0,
              windowDays: 7,
            },
            {
              metricName: 'goal_priority',
              expected: 'High',
              actual: `Priority ${goal.priority}`,
              windowDays: 7,
            },
          ],
          algorithmVersion: '1.1.0',
          generatedAt: now,
        });
      }
    }
  }

  // 5. BALANCE GAPS (Over-concentration in one life area)
  if (input.lifeAreas.sampleSize >= 5) {
    const dominantArea = input.lifeAreas.distributions.find((d) => d.allocationPercentage >= 75);
    if (dominantArea) {
      findings.push({
        id: `gap-balance-skew`,
        gapType: 'BALANCE_GAP',
        title: `Disproportionate Capacity Devoted to "${dominantArea.title}"`,
        summary: `"${dominantArea.title}" absorbed ${dominantArea.allocationPercentage}% of all tracked activities over the last 7 days, leaving remaining life areas under-served.`,
        areaType: dominantArea.areaType,
        magnitude: Math.round(dominantArea.allocationPercentage - 50),
        confidence: input.lifeAreas.confidence,
        trend: 'STABLE',
        evidence: [
          {
            metricName: 'dominant_area_percentage',
            expected: '< 50%',
            actual: `${dominantArea.allocationPercentage}%`,
            windowDays: 7,
          },
        ],
        algorithmVersion: '1.1.0',
        generatedAt: now,
      });
    }
  }

  return findings;
}
