import type { ConfidenceTier } from '../features/feature.types';

export type GapType =
  | 'QUANTITY_GAP'
  | 'CONSISTENCY_GAP'
  | 'EXECUTION_GAP'
  | 'TIMING_GAP'
  | 'PRIORITY_GAP'
  | 'BALANCE_GAP';

export type GapTrend = 'IMPROVING' | 'STABLE' | 'DECLINING';

export interface GapEvidence {
  metricName: string;
  expected: number | string;
  actual: number | string;
  windowDays: number;
  unit?: string | undefined;
}

export interface GrowthFinding {
  id: string;
  gapType: GapType;
  title: string;
  summary: string;
  areaType?: string | undefined;
  goalId?: string | undefined;
  magnitude: number;
  confidence: ConfidenceTier;
  trend: GapTrend;
  evidence: GapEvidence[];
  algorithmVersion: string;
  generatedAt: string;
}

export interface GoalComparisonTarget {
  id: string;
  title: string;
  priority: number;
  lifeAreaType?: string | undefined;
  targetMetricValue?: number | undefined;
  currentMetricValue?: number | undefined;
  targetFrequencyPerWeek?: number | undefined;
  unit?: string | undefined;
}

export interface FutureSelfTarget {
  futureIdentity?: string | undefined;
  horizonYears?: number | undefined;
  desiredStates?: Record<string, string> | undefined;
  priorities?: string[] | undefined;
  values?: string[] | undefined;
  lifeAreaTargets?: Record<string, string> | undefined;
}
