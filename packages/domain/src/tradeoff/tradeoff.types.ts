import type { LifeAreaType } from '../index';

export type ActionType =
  | 'ADD_TASK'
  | 'SCHEDULE_ROUTINE'
  | 'EXTEND_DURATION'
  | 'INCREASE_FREQUENCY';

export interface CandidateAction {
  id: string;
  title: string;
  actionType: ActionType;
  lifeAreaId?: string | undefined;
  lifeAreaType: LifeAreaType;
  goalId?: string | undefined;
  estimatedMinutes: number;
  energyDemand: 'LOW' | 'MEDIUM' | 'HIGH';
  preferredTimeWindow?: { startHour: number; endHour: number } | undefined;
}

export interface ResourceBudget {
  totalDailyMinutes: number; // typically 1440
  sleepMinutes: number; // default 480 (8 hours)
  fixedCommitmentMinutes: number; // obligations (work, class)
  scheduledRoutineMinutes: number; // existing routines
  plannedTaskMinutes: number; // tasks already scheduled today/tomorrow
  bufferReserveMinutes: number; // minimum transition/buffer (default 60)
}

export interface TradeoffBenefit {
  areaType: LifeAreaType;
  description: string;
  impactScore: number; // 1-100
  goalId?: string | undefined;
}

export interface TradeoffCost {
  areaType: LifeAreaType;
  description: string;
  costMinutes: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type ConflictType =
  | 'HARD_TIME_COLLISION'
  | 'BUFFER_VIOLATION'
  | 'RECOVERY_INCURSION'
  | 'CAPACITY_OVERFLOW'
  | 'ASYMMETRIC_SKEW';

export interface TradeoffConflict {
  type: ConflictType;
  severity: 'WARNING' | 'CRITICAL';
  description: string;
  conflictingEntity?: string | undefined;
}

export interface TradeoffAnalysis {
  actionId: string;
  actionTitle: string;
  feasible: boolean;
  availableCapacityMinutes: number;
  netCapacityAfterAction: number;
  expectedBenefits: TradeoffBenefit[];
  potentialCosts: TradeoffCost[];
  conflicts: TradeoffConflict[];
  recommendation: 'PROCEED' | 'WARN_TRADE_OFF' | 'REJECT_OVERLOAD';
  summary: string;
}
