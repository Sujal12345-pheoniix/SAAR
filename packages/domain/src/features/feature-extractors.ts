import type {
  ConfidenceTier,
  ExecutionFeatures,
  ConsistencyFeatures,
  RoutineFeatures,
  WellBeingFeatures,
  LifeAreaFeatures,
  LifeAreaDistribution,
} from './feature.types';
import { calculateStreak } from '../calendar/local-calendar';

export function getConfidenceTier(sampleSize: number, minEmerging: number, minEstablished: number): ConfidenceTier {
  if (sampleSize === 0) return 'NO_DATA';
  if (sampleSize < minEmerging) return 'INSUFFICIENT_DATA';
  if (sampleSize < minEstablished) return 'EMERGING_SIGNAL';
  return 'ESTABLISHED_SIGNAL';
}

/**
 * Pure calculation of Execution Features over a specified window.
 */
export function calculateExecutionFeatures(
  tasks: Array<{ status: string; actualDurationMinutes?: number | null }>,
  windowDays: number,
  calculatedAt: string = new Date().toISOString(),
): ExecutionFeatures {
  const total = tasks.length;
  let completed = 0;
  let skipped = 0;
  let rescheduled = 0;
  let totalDuration = 0;

  for (const t of tasks) {
    if (t.status === 'COMPLETED') {
      completed++;
      if (t.actualDurationMinutes) totalDuration += t.actualDurationMinutes;
    } else if (t.status === 'SKIPPED') {
      skipped++;
    } else if (t.status === 'RESCHEDULED') {
      rescheduled++;
    }
  }

  const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
  const skipRate = total > 0 ? Math.round((skipped / total) * 1000) / 10 : 0;
  const rescheduleRate = total > 0 ? Math.round((rescheduled / total) * 1000) / 10 : 0;

  return {
    name: 'execution_features',
    version: '1.0.0',
    windowDays,
    sampleSize: total,
    confidence: getConfidenceTier(total, 3, 7),
    calculatedAt,
    tasksPlanned: total,
    tasksCompleted: completed,
    tasksSkipped: skipped,
    tasksRescheduled: rescheduled,
    completionRate,
    skipRate,
    rescheduleRate,
    actualDurationTotalMinutes: totalDuration,
  };
}

/**
 * Pure calculation of Consistency Features based on daily completions.
 */
export function calculateConsistencyFeatures(
  completedDates: string[],
  referenceDateStr: string,
  windowDays: number,
  dailyCounts: number[],
  calculatedAt: string = new Date().toISOString(),
): ConsistencyFeatures {
  const streak = calculateStreak(completedDates, referenceDateStr);
  const activeDays = new Set(completedDates).size;

  // Completion variance calculation
  let variance = 0;
  if (dailyCounts.length > 1) {
    const mean = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
    const sqDiffs = dailyCounts.map((v) => Math.pow(v - mean, 2));
    variance = Math.round((sqDiffs.reduce((a, b) => a + b, 0) / dailyCounts.length) * 100) / 100;
  }

  // Stability score (higher active days ratio and lower variance = higher stability)
  const activeRatio = windowDays > 0 ? activeDays / windowDays : 0;
  const variancePenalty = Math.min(variance * 10, 50);
  const stabilityScore = Math.max(0, Math.min(100, Math.round(activeRatio * 100 - variancePenalty)));

  return {
    name: 'consistency_features',
    version: '1.0.0',
    windowDays,
    sampleSize: activeDays,
    confidence: getConfidenceTier(activeDays, 3, 7),
    calculatedAt,
    currentStreakDays: streak,
    activeDaysCount: activeDays,
    dailyCompletionVariance: variance,
    stabilityScore,
  };
}

/**
 * Pure calculation of Routine Adherence Features.
 */
export function calculateRoutineFeatures(
  occurrences: Array<{ status: string }>,
  windowDays: number,
  calculatedAt: string = new Date().toISOString(),
): RoutineFeatures {
  const total = occurrences.length;
  let completed = 0;
  let skipped = 0;
  let missed = 0;

  for (const o of occurrences) {
    if (o.status === 'COMPLETED') completed++;
    else if (o.status === 'SKIPPED') skipped++;
    else if (o.status === 'MISSED') missed++;
  }

  const adherenceRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

  return {
    name: 'routine_features',
    version: '1.0.0',
    windowDays,
    sampleSize: total,
    confidence: getConfidenceTier(total, 4, 10),
    calculatedAt,
    expectedOccurrences: total,
    completedOccurrences: completed,
    skippedOccurrences: skipped,
    missedOccurrences: missed,
    adherenceRate,
  };
}

/**
 * Pure calculation of Subjective Well-being Features.
 */
export function calculateWellBeingFeatures(
  checkins: Array<{ mood: number | null; energy: number | null; dayRating: number | null; localDate: string }>,
  windowDays: number,
  calculatedAt: string = new Date().toISOString(),
): WellBeingFeatures {
  const total = checkins.length;
  if (total === 0) {
    return {
      name: 'wellbeing_features',
      version: '1.0.0',
      windowDays,
      sampleSize: 0,
      confidence: 'NO_DATA',
      calculatedAt,
      checkinsCount: 0,
      avgMood: null,
      avgEnergy: null,
      avgDayRating: null,
      moodTrend: 'INSUFFICIENT_DATA',
    };
  }

  const validMoods = checkins.map((c) => c.mood).filter((m): m is number => m !== null && m > 0);
  const validEnergies = checkins.map((c) => c.energy).filter((e): e is number => e !== null && e > 0);
  const validRatings = checkins.map((c) => c.dayRating).filter((r): r is number => r !== null && r > 0);

  const avgMood = validMoods.length > 0 ? Math.round((validMoods.reduce((a, b) => a + b, 0) / validMoods.length) * 10) / 10 : null;
  const avgEnergy = validEnergies.length > 0 ? Math.round((validEnergies.reduce((a, b) => a + b, 0) / validEnergies.length) * 10) / 10 : null;
  const avgDayRating = validRatings.length > 0 ? Math.round((validRatings.reduce((a, b) => a + b, 0) / validRatings.length) * 10) / 10 : null;

  // Trend detection between first half and second half of window
  let moodTrend: WellBeingFeatures['moodTrend'] = 'INSUFFICIENT_DATA';
  if (validMoods.length >= 4) {
    const mid = Math.floor(validMoods.length / 2);
    const firstHalfAvg = validMoods.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalfAvg = validMoods.slice(mid).reduce((a, b) => a + b, 0) / (validMoods.length - mid);
    const diff = secondHalfAvg - firstHalfAvg;
    if (diff >= 0.5) moodTrend = 'IMPROVING';
    else if (diff <= -0.5) moodTrend = 'DECLINING';
    else moodTrend = 'STABLE';
  }

  return {
    name: 'wellbeing_features',
    version: '1.0.0',
    windowDays,
    sampleSize: total,
    confidence: getConfidenceTier(total, 3, 7),
    calculatedAt,
    checkinsCount: total,
    avgMood,
    avgEnergy,
    avgDayRating,
    moodTrend,
  };
}

/**
 * Pure calculation of Life Area Balance and Activity Distribution.
 */
export function calculateLifeAreaFeatures(
  activities: Array<{ areaId: string; areaType: string; title: string }>,
  windowDays: number,
  calculatedAt: string = new Date().toISOString(),
): LifeAreaFeatures {
  const total = activities.length;
  if (total === 0) {
    return {
      name: 'life_area_features',
      version: '1.0.0',
      windowDays,
      sampleSize: 0,
      confidence: 'NO_DATA',
      calculatedAt,
      distributions: [],
      topAreaType: null,
      entropyScore: 1.0,
    };
  }

  const map = new Map<string, { areaType: string; title: string; count: number }>();
  for (const act of activities) {
    const cur = map.get(act.areaId) || { areaType: act.areaType, title: act.title, count: 0 };
    cur.count++;
    map.set(act.areaId, cur);
  }

  const distributions: LifeAreaDistribution[] = [];
  let topCount = 0;
  let topType: string | null = null;

  for (const [areaId, val] of map.entries()) {
    const pct = Math.round((val.count / total) * 1000) / 10;
    if (val.count > topCount) {
      topCount = val.count;
      topType = val.areaType;
    }
    distributions.push({
      areaId,
      areaType: val.areaType,
      title: val.title,
      completedTasksCount: val.count,
      completedRoutinesCount: 0,
      totalActivitiesCount: val.count,
      allocationPercentage: pct,
    });
  }

  // Calculate Shannon entropy normalized by log(N) for balance measurement
  let entropy = 0;
  const k = distributions.length;
  if (k > 1) {
    for (const d of distributions) {
      const p = d.allocationPercentage / 100;
      if (p > 0) entropy -= p * Math.log2(p);
    }
    const maxEntropy = Math.log2(k);
    entropy = Math.round((entropy / maxEntropy) * 100) / 100;
  } else {
    entropy = k === 1 ? 0 : 1;
  }

  return {
    name: 'life_area_features',
    version: '1.0.0',
    windowDays,
    sampleSize: total,
    confidence: getConfidenceTier(total, 5, 12),
    calculatedAt,
    distributions,
    topAreaType: topType,
    entropyScore: entropy,
  };
}
