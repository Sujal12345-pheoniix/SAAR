import type { ConfidenceTier } from '../features/feature.types';

export type InterventionActionType =
  | 'RESCHEDULE'
  | 'REDUCE_SCOPE'
  | 'MOVE_TIME'
  | 'SPLIT_TASK'
  | 'ADD_BUFFER'
  | 'RESTORE_ROUTINE'
  | 'CREATE_SMALLER_STEP'
  | 'REFLECT';

export interface InterventionCandidate {
  id: string;
  insightId?: string | undefined;
  actionType: InterventionActionType;
  title: string;
  reason: string;
  evidence: Array<{
    metric: string;
    actual: unknown;
    expected: unknown;
    windowDays?: number | undefined;
  }>;
  expectedOutcome: string;
  confidence: ConfidenceTier;
  requiredUserAction: string;
  measurementWindowDays: number;
  baselineMetric: {
    name: string;
    value: number;
    unit?: string | undefined;
  };
  payload?: Record<string, unknown> | undefined;
}

export interface InterventionOutcome {
  metricName: string;
  baselineValue: number;
  postValue: number;
  outcomeDelta: number;
  improved: boolean;
  measurementWindowDays: number;
  evaluatedAt: string;
  notes: string;
}
