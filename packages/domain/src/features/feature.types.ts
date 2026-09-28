/**
 * Types for behavioral feature extraction and aggregation.
 */

export type ConfidenceTier = 'NO_DATA' | 'INSUFFICIENT_DATA' | 'EMERGING_SIGNAL' | 'ESTABLISHED_SIGNAL';

export interface BaseFeature {
  name: string;
  version: string;
  windowDays: number;
  sampleSize: number;
  confidence: ConfidenceTier;
  calculatedAt: string;
}

export interface ExecutionFeatures extends BaseFeature {
  name: 'execution_features';
  tasksPlanned: number;
  tasksCompleted: number;
  tasksSkipped: number;
  tasksRescheduled: number;
  completionRate: number; // 0 to 100 percentage
  skipRate: number;       // 0 to 100 percentage
  rescheduleRate: number; // 0 to 100 percentage
  actualDurationTotalMinutes: number;
}

export interface ConsistencyFeatures extends BaseFeature {
  name: 'consistency_features';
  currentStreakDays: number;
  activeDaysCount: number;
  dailyCompletionVariance: number;
  stabilityScore: number; // 0 to 100
}

export interface RoutineFeatures extends BaseFeature {
  name: 'routine_features';
  expectedOccurrences: number;
  completedOccurrences: number;
  skippedOccurrences: number;
  missedOccurrences: number;
  adherenceRate: number; // 0 to 100 percentage
}

export interface WellBeingFeatures extends BaseFeature {
  name: 'wellbeing_features';
  checkinsCount: number;
  avgMood: number | null;     // 1.0 to 5.0
  avgEnergy: number | null;   // 1.0 to 5.0
  avgDayRating: number | null;// 1.0 to 5.0
  moodTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
}

export interface LifeAreaDistribution {
  areaId: string;
  areaType: string;
  title: string;
  completedTasksCount: number;
  completedRoutinesCount: number;
  totalActivitiesCount: number;
  allocationPercentage: number; // 0 to 100
}

export interface LifeAreaFeatures extends BaseFeature {
  name: 'life_area_features';
  distributions: LifeAreaDistribution[];
  topAreaType: string | null;
  entropyScore: number; // 0 to 1 (0 = highly concentrated, 1 = perfectly balanced)
}
