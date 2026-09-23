/**
 * Core Life Model & Planning Contracts
 */

export type MetricType =
  | 'distance'
  | 'hours'
  | 'frequency'
  | 'count'
  | 'percentage'
  | 'money'
  | 'duration'
  | 'numeric';

// ─── Life Areas ───────────────────────────────────────────────────────────────

export interface LifeAreaDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  targetState: string | null;
  weight: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLifeAreaDto {
  type: string;
  title: string;
  targetState?: string;
  weight?: number;
}

export interface UpdateLifeAreaDto {
  type?: string;
  title?: string;
  targetState?: string;
  weight?: number;
}

// ─── Future Self ──────────────────────────────────────────────────────────────

export interface FutureSelfDto {
  id: string;
  userId: string;
  futureIdentity: string;
  horizonYears: number;
  desiredStates: Record<string, string> | null;
  priorities: string[] | null;
  values: string[] | null;
  lifeAreaTargets: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertFutureSelfDto {
  futureIdentity: string;
  horizonYears?: number;
  desiredStates?: Record<string, string>;
  priorities?: string[];
  values?: string[];
  lifeAreaTargets?: Record<string, string>;
}

// ─── Goals & Metrics ──────────────────────────────────────────────────────────

export interface GoalMetricDto {
  id: string;
  goalId: string;
  metricType: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalDto {
  id: string;
  userId: string;
  lifeAreaId: string | null;
  title: string;
  description: string | null;
  reason: string | null;
  status: string;
  priority: number;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  lifeArea?: LifeAreaDto | null;
  metrics?: GoalMetricDto[];
}

export interface CreateGoalMetricInput {
  metricType: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
}

export interface CreateGoalDto {
  lifeAreaId?: string;
  title: string;
  description?: string;
  reason?: string;
  priority?: number;
  targetDate?: string;
  metrics?: CreateGoalMetricInput[];
}

export interface UpdateGoalDto {
  lifeAreaId?: string | null;
  title?: string;
  description?: string;
  reason?: string;
  priority?: number;
  targetDate?: string | null;
  status?: string;
  metrics?: CreateGoalMetricInput[];
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export interface TaskDto {
  id: string;
  userId: string;
  planId: string | null;
  goalId: string | null;
  lifeAreaId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  dueAt: string | null;
  estimatedMinutes: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  goal?: { id: string; title: string } | null;
  lifeArea?: { id: string; title: string; type: string } | null;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  goalId?: string;
  lifeAreaId?: string;
  planId?: string;
  priority?: number;
  dueAt?: string;
  estimatedMinutes?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  goalId?: string | null;
  lifeAreaId?: string | null;
  planId?: string | null;
  priority?: number;
  dueAt?: string | null;
  estimatedMinutes?: number | null;
  status?: string;
}

export interface RescheduleTaskDto {
  dueAt: string;
}

// ─── Routines ─────────────────────────────────────────────────────────────────

export interface RoutineDto {
  id: string;
  userId: string;
  title: string;
  recurrenceRule: string;
  timezone: string;
  preferredTime: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutineDto {
  title: string;
  recurrenceRule: string;
  timezone?: string;
  preferredTime?: string;
  active?: boolean;
}

export interface UpdateRoutineDto {
  title?: string;
  recurrenceRule?: string;
  timezone?: string;
  preferredTime?: string;
  active?: boolean;
}

// ─── Check-in & Daily Planning ────────────────────────────────────────────────

export interface CheckinDto {
  id: string;
  userId: string;
  localDate: string;
  mood: number | null;
  energy: number | null;
  reflection: string | null;
  dayRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCheckinDto {
  localDate?: string;
  mood?: number;
  energy?: number;
  reflection?: string;
  dayRating?: number;
}

export interface DailyGrowthSessionDto {
  sessionId: string;
  userId: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
  summary?: {
    tasksCompleted: number;
    routinesCompleted: number;
    checkinDone: boolean;
    reflection?: string;
  };
}

export interface DailyPlanResponseDto {
  date: string;
  timezone: string;
  tasks: TaskDto[];
  routines: RoutineDto[];
  checkin: CheckinDto | null;
  futureSelfSummary: {
    futureIdentity: string;
    horizonYears: number;
  } | null;
  progress: {
    totalTasks: number;
    completedTasks: number;
    totalRoutines: number;
    completedRoutines: number;
    percentage: number;
  };
}
