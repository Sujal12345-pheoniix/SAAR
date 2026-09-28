import type {
  InterventionCandidate,
  InterventionOutcome,
} from './intervention.types';

/**
 * Pure deterministic Intervention Outcome Evaluator:
 * Compares post-intervention telemetry against baseline metrics to establish
 * whether the behavioral intervention actually yielded measurable improvement.
 */
export function evaluateInterventionOutcome(
  intervention: Pick<InterventionCandidate, 'baselineMetric' | 'measurementWindowDays'>,
  postValue: number,
  evaluatedAt: string = new Date().toISOString(),
): InterventionOutcome {
  const baseline = intervention.baselineMetric.value;
  const delta = Math.round((postValue - baseline) * 10) / 10;
  const improved = delta > 0;

  const unitStr = intervention.baselineMetric.unit ? ` ${intervention.baselineMetric.unit}` : '';
  const notes = improved
    ? `Intervention achieved positive behavioral delta: ${intervention.baselineMetric.name} moved from ${baseline}${unitStr} to ${postValue}${unitStr} (+${delta}${unitStr}) over ${intervention.measurementWindowDays} days.`
    : `Intervention did not yield improvement: ${intervention.baselineMetric.name} moved from ${baseline}${unitStr} to ${postValue}${unitStr} (${delta}${unitStr}) over ${intervention.measurementWindowDays} days.`;

  return {
    metricName: intervention.baselineMetric.name,
    baselineValue: baseline,
    postValue,
    outcomeDelta: delta,
    improved,
    measurementWindowDays: intervention.measurementWindowDays,
    evaluatedAt,
    notes,
  };
}
