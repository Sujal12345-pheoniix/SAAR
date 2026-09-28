import type {
  ScheduleCandidate,
  CandidateScoreBreakdown,
  RankedScheduleCandidate,
  TimeWindowName,
} from './scheduling.types';
import type { LifeAreaFeatures } from '../features/feature.types';

export interface ScoringContext {
  targetDate: string; // YYYY-MM-DD
  targetWindow?: TimeWindowName | undefined;
  lifeAreaFeatures?: LifeAreaFeatures | undefined;
}

/**
 * Pure deterministic multi-factor candidate scoring and ranking algorithm.
 * Evaluates goal relevance, urgency, empirical time-of-day compatibility,
 * life-area balance, and historical friction penalties.
 */
export function scoreCandidate(
  candidate: ScheduleCandidate,
  context: ScoringContext,
): CandidateScoreBreakdown {
  // 1. Goal Relevance (0.25)
  let goalRelevance = 0.2; // default if no goal linked
  if (candidate.goalPriority !== undefined) {
    switch (candidate.goalPriority) {
      case 1:
        goalRelevance = 1.0;
        break;
      case 2:
        goalRelevance = 0.8;
        break;
      case 3:
        goalRelevance = 0.6;
        break;
      case 4:
        goalRelevance = 0.4;
        break;
      case 5:
        goalRelevance = 0.2;
        break;
      default:
        goalRelevance = 0.5;
    }
  }

  // 2. Urgency / Deadline Proximity (0.25)
  let urgency = 0.3; // default for unscheduled tasks
  if (candidate.dueAt) {
    const targetMidnight = new Date(`${context.targetDate}T00:00:00.000Z`).getTime();
    const dueMidnight = new Date(candidate.dueAt.slice(0, 10) + 'T00:00:00.000Z').getTime();
    const diffDays = Math.round((dueMidnight - targetMidnight) / 86_400_000);

    if (diffDays <= 0) {
      urgency = 1.0; // Due today or overdue
    } else if (diffDays <= 2) {
      urgency = 0.8; // Due within 48h
    } else if (diffDays <= 7) {
      urgency = 0.5; // Due within 7 days
    } else {
      urgency = 0.2; // Long term
    }
  }

  // 3. Empirical Time-of-Day Compatibility (0.20)
  const windowToEvaluate = context.targetWindow ?? candidate.preferredWindow;
  let timeCompatibility = 0.5; // Neutral baseline if no history
  if (windowToEvaluate && candidate.historicalWindowCompletionRates) {
    const windowRate = candidate.historicalWindowCompletionRates[windowToEvaluate];
    if (windowRate !== undefined) {
      timeCompatibility = Math.min(1.0, Math.max(0, windowRate / 100));
    }
  }

  // 4. Life Area Balance Bonus (0.15)
  let balanceBonus = 0.5;
  if (context.lifeAreaFeatures) {
    const distributions = context.lifeAreaFeatures.distributions;
    const matchingDist = distributions.find((d) => d.areaType === candidate.lifeAreaType);

    if (matchingDist) {
      if (matchingDist.allocationPercentage >= 70) {
        balanceBonus = 0.1; // heavily concentrated area gets lowest priority bonus
      } else if (matchingDist.allocationPercentage <= 15) {
        balanceBonus = 1.0; // neglected area gets highest balance boost
      } else {
        balanceBonus = 0.6;
      }
    } else {
      balanceBonus = 0.9; // zero recorded allocation gets strong boost
    }
  }

  // 5. Friction / Reschedule History Penalty (0.15)
  // Each reschedule subtracts 0.2, floored at 0.1
  const frictionPenalty = Math.max(0.1, Math.min(1.0, 1.0 - candidate.rescheduleCount * 0.2));

  // Weighted composite score (0-100)
  const weightedComposite =
    0.25 * goalRelevance +
    0.25 * urgency +
    0.20 * timeCompatibility +
    0.15 * balanceBonus +
    0.15 * frictionPenalty;

  const finalScore = Math.round(weightedComposite * 100);

  // Explainable rationale
  const reasons: string[] = [];
  if (candidate.goalPriority === 1) reasons.push('Priority 1 goal alignment');
  if (urgency >= 0.8) reasons.push('Upcoming or past deadline');
  if (timeCompatibility >= 0.7) reasons.push(`High historical completion in ${windowToEvaluate}`);
  if (balanceBonus >= 0.8) reasons.push(`Balances neglected area '${candidate.lifeAreaType}'`);
  if (candidate.rescheduleCount >= 2) reasons.push(`Penalized for ${candidate.rescheduleCount} prior reschedules`);

  const explanation = reasons.length > 0 ? reasons.join('; ') : 'Standard baseline scheduling fit';

  return {
    goalRelevance,
    urgency,
    timeCompatibility,
    balanceBonus,
    frictionPenalty,
    finalScore,
    explanation,
  };
}

/**
 * Deterministically ranks candidates in descending order of calculated score.
 */
export function rankCandidates(
  candidates: readonly ScheduleCandidate[],
  context: ScoringContext,
): RankedScheduleCandidate[] {
  return candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, context),
    }))
    .sort((a, b) => b.score.finalScore - a.score.finalScore);
}
