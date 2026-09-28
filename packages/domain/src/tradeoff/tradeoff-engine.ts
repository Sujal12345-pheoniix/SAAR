import type {
  CandidateAction,
  ResourceBudget,
  TradeoffAnalysis,
  TradeoffBenefit,
  TradeoffCost,
  TradeoffConflict,
} from './tradeoff.types';
import type { LifeAreaFeatures } from '../features/feature.types';

/**
 * Pure deterministic Life Trade-off Engine:
 * Analyzes candidate action feasibility, finite capacity usage, cross-life-area costs,
 * recovery/sleep window impact, and explicit conflict detection.
 */
export function analyzeTradeoff(
  action: CandidateAction,
  budget: ResourceBudget,
  lifeAreaFeatures?: LifeAreaFeatures | undefined,
): TradeoffAnalysis {
  // 1. Calculate usable discretionary capacity
  const committedMinutes =
    budget.sleepMinutes +
    budget.fixedCommitmentMinutes +
    budget.scheduledRoutineMinutes +
    budget.plannedTaskMinutes +
    budget.bufferReserveMinutes;

  const availableCapacityMinutes = Math.max(0, budget.totalDailyMinutes - committedMinutes);
  const netCapacityAfterAction = availableCapacityMinutes - action.estimatedMinutes;

  const conflicts: TradeoffConflict[] = [];
  const potentialCosts: TradeoffCost[] = [];
  const expectedBenefits: TradeoffBenefit[] = [];

  // 2. Evaluate Capacity Overflow
  if (netCapacityAfterAction < 0) {
    conflicts.push({
      type: 'CAPACITY_OVERFLOW',
      severity: 'CRITICAL',
      description: `Action requires ${action.estimatedMinutes}m but only ${availableCapacityMinutes}m discretionary capacity remains. Deficit: ${Math.abs(netCapacityAfterAction)}m.`,
    });
  }

  // 3. Evaluate Recovery Window Incursion (e.g. scheduling late night 22:00-06:00)
  if (action.preferredTimeWindow) {
    const { startHour, endHour } = action.preferredTimeWindow;
    if (startHour >= 22 || startHour < 6 || endHour > 22) {
      conflicts.push({
        type: 'RECOVERY_INCURSION',
        severity: 'CRITICAL',
        description: `Action scheduled between ${startHour}:00 and ${endHour}:00 encroaches into standard biological sleep / recovery window.`,
        conflictingEntity: 'Sleep & Recovery',
      });
    }
  }

  // 4. Evaluate Life Area Asymmetric Skew
  if (lifeAreaFeatures && lifeAreaFeatures.topAreaType === action.lifeAreaType) {
    const topDist = lifeAreaFeatures.distributions.find((d) => d.areaType === action.lifeAreaType);
    if (topDist && topDist.allocationPercentage >= 70) {
      conflicts.push({
        type: 'ASYMMETRIC_SKEW',
        severity: 'WARNING',
        description: `Life area '${action.lifeAreaType}' already absorbs ${topDist.allocationPercentage}% of weekly execution capacity. Adding more intensifies lifestyle imbalance.`,
        conflictingEntity: action.lifeAreaType,
      });
    }
  }

  // 5. Determine Potential Costs
  if (action.estimatedMinutes > 45) {
    potentialCosts.push({
      areaType: 'health',
      description: `Consumes ${action.estimatedMinutes} minutes of discretionary recovery buffer.`,
      costMinutes: action.estimatedMinutes,
      severity: action.estimatedMinutes >= 90 ? 'HIGH' : 'MEDIUM',
    });
  }

  if (action.energyDemand === 'HIGH') {
    potentialCosts.push({
      areaType: 'mind',
      description: 'High cognitive demand session depletes focus reserves for subsequent tasks.',
      costMinutes: action.estimatedMinutes,
      severity: 'MEDIUM',
    });
  }

  // 6. Determine Expected Benefits
  expectedBenefits.push({
    areaType: action.lifeAreaType,
    description: `Direct progression in '${action.lifeAreaType}' (+${action.estimatedMinutes}m focused investment).`,
    impactScore: action.goalId ? 85 : 60,
    goalId: action.goalId,
  });

  // 7. Synthesize Recommendation
  const hasCriticalConflict = conflicts.some((c) => c.severity === 'CRITICAL');
  const hasWarningConflict = conflicts.some((c) => c.severity === 'WARNING');

  let recommendation: 'PROCEED' | 'WARN_TRADE_OFF' | 'REJECT_OVERLOAD' = 'PROCEED';
  if (hasCriticalConflict) {
    recommendation = 'REJECT_OVERLOAD';
  } else if (hasWarningConflict || netCapacityAfterAction < 30) {
    recommendation = 'WARN_TRADE_OFF';
  }

  // 8. Generate Explainable Summary
  let summary = '';
  if (recommendation === 'REJECT_OVERLOAD') {
    summary = `Cannot schedule '${action.title}' (${action.estimatedMinutes}m) without displacing existing commitments or violating recovery bounds.`;
  } else if (recommendation === 'WARN_TRADE_OFF') {
    summary = `Scheduling '${action.title}' is feasible but introduces trade-offs: ${conflicts.map((c) => c.description).join(' ')}`;
  } else {
    summary = `'${action.title}' fits within discretionary capacity (${netCapacityAfterAction}m remaining buffer) with balanced resource impact.`;
  }

  return {
    actionId: action.id,
    actionTitle: action.title,
    feasible: !hasCriticalConflict,
    availableCapacityMinutes,
    netCapacityAfterAction,
    expectedBenefits,
    potentialCosts,
    conflicts,
    recommendation,
    summary,
  };
}
