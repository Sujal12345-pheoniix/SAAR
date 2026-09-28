import type { GrowthSignal } from '../signals/signal.types';
import type { GapFinding } from '../gap/gap.types';
import type { TradeoffAnalysis } from '../tradeoff/tradeoff.types';
import type { InterventionCandidate } from '../interventions/intervention.types';

export interface DailyExecutionSummary {
  plannedTasksCount: number;
  completedTasksCount: number;
  skippedTasksCount: number;
  rescheduledTasksCount: number;
  completionRate: number; // 0-100
  frictionScore: number; // 0-100
  totalMinutesInvested: number;
}

export interface TomorrowCandidateTask {
  taskId: string;
  title: string;
  goalTitle?: string | undefined;
  priority: number;
  estimatedMinutes: number;
  rankingScore: number;
  selectionReason: string;
}

export interface DailyTomorrowPlanPreview {
  targetDate: string; // YYYY-MM-DD
  capacityMinutes: number;
  allocatedMinutes: number;
  candidateTasks: TomorrowCandidateTask[];
  conflicts: string[];
  feasibilityScore: number;
}

export interface DailyGrowthSessionState {
  date: string; // YYYY-MM-DD
  userId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string | null;
  completedAt: string | null;
  checkin: {
    completed: boolean;
    mood: number | null;
    energy: number | null;
    reflection: string | null;
    dayRating: number | null;
  };
  execution: DailyExecutionSummary;
  signals: GrowthSignal[];
  gaps: GapFinding[];
  tradeoffs: TradeoffAnalysis[];
  interventions: InterventionCandidate[];
  tomorrowPlanPreview: DailyTomorrowPlanPreview;
  engineVersion: string;
}
