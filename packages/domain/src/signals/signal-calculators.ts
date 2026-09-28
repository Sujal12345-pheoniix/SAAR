import type { GrowthSignal, SignalDirection } from './signal.types';
import type { ExecutionFeatures, ConsistencyFeatures, RoutineFeatures, LifeAreaFeatures } from '../features/feature.types';

/**
 * Calculates the Consistency Signal:
 * Combines task completion stability, routine adherence, and active streaks.
 */
export function calculateConsistencySignal(
  execution7d: ExecutionFeatures,
  consistency7d: ConsistencyFeatures,
  routine7d: RoutineFeatures,
  calculatedAt: string = new Date().toISOString(),
): GrowthSignal {
  // Check minimum data
  if (execution7d.confidence === 'NO_DATA' && routine7d.confidence === 'NO_DATA') {
    return {
      type: 'CONSISTENCY',
      direction: 'INSUFFICIENT_DATA',
      score: 50,
      label: 'Insufficient Data',
      summary: 'Not enough activity recorded to evaluate behavioral consistency.',
      confidence: 'NO_DATA',
      evidence: [],
      version: '1.0.0',
      calculatedAt,
    };
  }

  // Blended consistency score: 50% task completion + 30% stability + 20% routine adherence
  const taskWeight = execution7d.sampleSize > 0 ? 0.5 : 0;
  const stabWeight = consistency7d.sampleSize > 0 ? 0.3 : 0;
  const routWeight = routine7d.sampleSize > 0 ? 0.2 : 0;
  const totalWeight = taskWeight + stabWeight + routWeight;

  const score = totalWeight > 0
    ? Math.round(
        (execution7d.completionRate * taskWeight +
          consistency7d.stabilityScore * stabWeight +
          routine7d.adherenceRate * routWeight) /
          totalWeight,
      )
    : 50;

  let direction: SignalDirection = 'STABLE';
  if (score >= 75) direction = 'ACCELERATING';
  else if (score < 45) direction = 'DECLINING';

  const confidence =
    execution7d.confidence === 'ESTABLISHED_SIGNAL' || routine7d.confidence === 'ESTABLISHED_SIGNAL'
      ? 'ESTABLISHED_SIGNAL'
      : execution7d.confidence === 'EMERGING_SIGNAL' || routine7d.confidence === 'EMERGING_SIGNAL'
        ? 'EMERGING_SIGNAL'
        : 'INSUFFICIENT_DATA';

  return {
    type: 'CONSISTENCY',
    direction,
    score,
    label: score >= 75 ? 'High Consistency' : score < 45 ? 'Declining Consistency' : 'Moderate Consistency',
    summary: `Execution completion rate is ${execution7d.completionRate}% across ${execution7d.tasksPlanned} planned tasks with a ${consistency7d.currentStreakDays}-day streak.`,
    confidence,
    evidence: [
      { metric: 'task_completion_rate', currentValue: `${execution7d.completionRate}%`, windowDays: 7 },
      { metric: 'current_streak_days', currentValue: consistency7d.currentStreakDays, windowDays: 7 },
      { metric: 'routine_adherence_rate', currentValue: `${routine7d.adherenceRate}%`, windowDays: 7 },
    ],
    version: '1.0.0',
    calculatedAt,
  };
}

/**
 * Calculates the Momentum Signal:
 * Evaluates behavioral velocity between current 14-day window and prior 14-day window.
 */
export function calculateMomentumSignal(
  current14d: ExecutionFeatures,
  previous14d: ExecutionFeatures,
  calculatedAt: string = new Date().toISOString(),
): GrowthSignal {
  if (current14d.sampleSize < 3 && previous14d.sampleSize < 3) {
    return {
      type: 'MOMENTUM',
      direction: 'INSUFFICIENT_DATA',
      score: 50,
      label: 'Insufficient Baseline',
      summary: 'Requires at least 14 days of behavioral telemetry to calculate velocity delta.',
      confidence: 'INSUFFICIENT_DATA',
      evidence: [],
      version: '1.0.0',
      calculatedAt,
    };
  }

  // Velocity delta in completed tasks
  const deltaCompleted = current14d.tasksCompleted - previous14d.tasksCompleted;
  const rateDelta = Math.round((current14d.completionRate - previous14d.completionRate) * 10) / 10;

  // Normalized score centered at 50, incorporating rate change and volume velocity
  const deltaFactor = (rateDelta * 0.5) + (deltaCompleted * 2);
  const score = Math.max(0, Math.min(100, Math.round(50 + deltaFactor)));

  let direction: SignalDirection = 'STABLE';
  if (rateDelta >= 10 || deltaCompleted >= 3) direction = 'ACCELERATING';
  else if (rateDelta <= -10 || deltaCompleted <= -3) direction = 'DECLINING';

  const confidence = current14d.confidence === 'ESTABLISHED_SIGNAL' && previous14d.confidence === 'ESTABLISHED_SIGNAL'
    ? 'ESTABLISHED_SIGNAL'
    : 'EMERGING_SIGNAL';

  return {
    type: 'MOMENTUM',
    direction,
    score,
    label: direction === 'ACCELERATING' ? 'Positive Velocity' : direction === 'DECLINING' ? 'Decelerating' : 'Steady Pace',
    summary: `Task completion rate shifted by ${rateDelta > 0 ? '+' : ''}${rateDelta}% compared to the prior 14-day cycle.`,
    confidence,
    evidence: [
      { metric: 'current_14d_completion_rate', currentValue: `${current14d.completionRate}%`, baselineValue: `${previous14d.completionRate}%`, windowDays: 14 },
      { metric: 'completed_tasks_delta', currentValue: current14d.tasksCompleted, baselineValue: previous14d.tasksCompleted, windowDays: 14 },
    ],
    version: '1.0.0',
    calculatedAt,
  };
}

/**
 * Calculates the Balance Signal:
 * Evaluates whether execution allocation is balanced across active life areas or overly concentrated.
 */
export function calculateBalanceSignal(
  lifeAreaFeatures: LifeAreaFeatures,
  calculatedAt: string = new Date().toISOString(),
): GrowthSignal {
  if (lifeAreaFeatures.sampleSize < 4) {
    return {
      type: 'BALANCE',
      direction: 'INSUFFICIENT_DATA',
      score: 50,
      label: 'Insufficient Activity',
      summary: 'Need more completed activities across life areas to evaluate behavioral distribution.',
      confidence: 'INSUFFICIENT_DATA',
      evidence: [],
      version: '1.0.0',
      calculatedAt,
    };
  }

  // Higher entropy (close to 1) means well-distributed across life areas
  const score = Math.round(lifeAreaFeatures.entropyScore * 100);
  const isSkewed = lifeAreaFeatures.distributions.some((d) => d.allocationPercentage >= 70);

  const direction: SignalDirection = isSkewed ? 'SKEWED' : score >= 60 ? 'BALANCED' : 'STABLE';

  return {
    type: 'BALANCE',
    direction,
    score,
    label: isSkewed ? 'Asymmetric Focus' : score >= 60 ? 'Harmonious Balance' : 'Moderate Allocation',
    summary: isSkewed
      ? `Primary area '${lifeAreaFeatures.topAreaType}' absorbed over 70% of tracked execution capacity.`
      : `Activities are distributed across ${lifeAreaFeatures.distributions.length} life areas with an entropy score of ${lifeAreaFeatures.entropyScore}.`,
    confidence: lifeAreaFeatures.confidence,
    evidence: lifeAreaFeatures.distributions.map((d) => ({
      metric: `allocation_${d.areaType}`,
      currentValue: `${d.allocationPercentage}%`,
      windowDays: lifeAreaFeatures.windowDays,
    })),
    version: '1.0.0',
    calculatedAt,
  };
}
