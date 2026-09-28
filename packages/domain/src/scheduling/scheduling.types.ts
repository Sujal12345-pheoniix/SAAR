import type { LifeAreaType } from '../index';

export type TimeWindowName = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export interface TimeWindowConfig {
  name: TimeWindowName;
  startHour: number;
  endHour: number;
}

export const CANONICAL_TIME_WINDOWS: readonly TimeWindowConfig[] = [
  { name: 'MORNING', startHour: 6, endHour: 12 },
  { name: 'AFTERNOON', startHour: 12, endHour: 17 },
  { name: 'EVENING', startHour: 17, endHour: 22 },
  { name: 'NIGHT', startHour: 22, endHour: 6 },
] as const;

export interface ScheduleCapacity {
  totalDayMinutes: number;
  sleepMinutes: number;
  fixedCommitmentMinutes: number;
  scheduledRoutineMinutes: number;
  plannedTaskMinutes: number;
  transitionBufferMinutes: number;
  usableDiscretionaryMinutes: number;
}

export interface ScheduleCandidate {
  id: string;
  title: string;
  goalId?: string | undefined;
  goalPriority?: number | undefined; // 1-5, 1=highest
  lifeAreaType: LifeAreaType;
  dueAt?: string | undefined;
  estimatedMinutes: number;
  preferredWindow?: TimeWindowName | undefined;
  rescheduleCount: number;
  historicalWindowCompletionRates?: Partial<Record<TimeWindowName, number>> | undefined; // 0-100
}

export interface CandidateScoreBreakdown {
  goalRelevance: number; // 0-1
  urgency: number; // 0-1
  timeCompatibility: number; // 0-1
  balanceBonus: number; // 0-1
  frictionPenalty: number; // 0-1
  finalScore: number; // 0-100
  explanation: string;
}

export interface RankedScheduleCandidate {
  candidate: ScheduleCandidate;
  score: CandidateScoreBreakdown;
}

export interface ScheduleDiff {
  tasksMoved: Array<{ taskId: string; fromTime: string; toTime: string; reason: string }>;
  tasksDelayed: Array<{ taskId: string; originalDate: string; newDate: string }>;
  tasksAdded: Array<{ taskId: string; title: string; scheduledAt?: string | undefined }>;
  tasksRemoved: Array<{ taskId: string; title: string; reason: string }>;
  conflictsCreated: string[];
  conflictsResolved: string[];
  netDurationMinutesDelta: number;
}

export interface ScheduleSimulationResult {
  currentPlanVersion: number;
  proposedPlanVersion: number;
  diff: ScheduleDiff;
  feasibilityScore: number; // 0-100
  summary: string;
}
