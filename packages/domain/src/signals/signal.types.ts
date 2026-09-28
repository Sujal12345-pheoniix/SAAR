import type { ConfidenceTier } from '../features/feature.types';

export type SignalType = 'CONSISTENCY' | 'MOMENTUM' | 'BALANCE';
export type SignalDirection = 'ACCELERATING' | 'STABLE' | 'DECLINING' | 'SKEWED' | 'BALANCED' | 'INSUFFICIENT_DATA';

export interface SignalEvidence {
  metric: string;
  currentValue: number | string;
  baselineValue?: number | string | undefined;
  windowDays: number;
}

export interface GrowthSignal {
  type: SignalType;
  direction: SignalDirection;
  score: number; // 0 to 100
  label: string;
  summary: string;
  confidence: ConfidenceTier;
  evidence: SignalEvidence[];
  version: string;
  calculatedAt: string;
}
