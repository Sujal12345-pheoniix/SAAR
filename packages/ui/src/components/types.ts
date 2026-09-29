// SAAR Design System — Component Interfaces & Types

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'growth';
export type ComponentSize = 'sm' | 'md' | 'lg';

export interface BaseComponentProps {
  className?: string;
  id?: string;
  testId?: string;
  disabled?: boolean;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ComponentSize;
  isLoading?: boolean;
  leftIcon?: unknown;
  rightIcon?: unknown;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  children: unknown;
}

export interface TextFieldProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  error?: string;
  helperText?: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  onChange?: (val: string) => void;
  onBlur?: () => void;
}

export interface BadgeProps extends BaseComponentProps {
  variant?: 'growth' | 'energy' | 'reflection' | 'attention' | 'recovery' | 'neutral';
  size?: 'sm' | 'md';
  children: unknown;
}

export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: unknown;
}

export interface ErrorStateProps extends BaseComponentProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

// ─── SAAR Specific Component Props ──────────────────────────────────────────

export interface GrowthRingProps extends BaseComponentProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  accentColor?: string;
  label?: string;
  sublabel?: string;
}

export interface LifeAreaIndicatorProps extends BaseComponentProps {
  area: 'mind' | 'health' | 'career' | 'relationships' | 'personal' | 'finance' | 'purpose';
  label?: string;
  score?: number;
  showIcon?: boolean;
}

export interface GoalProgressProps extends BaseComponentProps {
  goalId: string;
  title: string;
  area: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend?: 'improving' | 'stable' | 'declining';
  whyStatement?: string;
}

export interface GapIndicatorProps extends BaseComponentProps {
  gapType: 'QUANTITY' | 'CONSISTENCY' | 'EXECUTION' | 'PRIORITY' | 'BALANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  observedMetric: string;
  targetMetric: string;
  description: string;
  onExploreExperiment?: () => void;
}

export interface SignalIndicatorProps extends BaseComponentProps {
  signalType: 'CONSISTENCY' | 'MOMENTUM' | 'BALANCE';
  score: number;
  direction: 'UP' | 'DOWN' | 'STABLE';
  summary: string;
}

export interface TaskRowProps extends BaseComponentProps {
  id: string;
  title: string;
  estimatedMinutes?: number;
  scheduledTime?: string;
  priority?: number;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  lifeArea?: string;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
  onReschedule?: (id: string) => void;
}

export interface RoutineRowProps extends BaseComponentProps {
  id: string;
  title: string;
  recurrence: string;
  completionRate?: number;
  streakDays?: number;
  onComplete?: (id: string) => void;
}

export interface DailyGrowthStepProps extends BaseComponentProps {
  step: 'what_happened' | 'evidence' | 'patterns' | 'gaps' | 'adjustments' | 'tomorrow';
  stepIndex: number;
  totalSteps: number;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
}

export interface TradeoffCardProps extends BaseComponentProps {
  currentLoadMinutes: number;
  capacityMinutes: number;
  overloadMinutes: number;
  candidatesCount: number;
  recommendedAdjustments: Array<{
    action: string;
    description: string;
    timeRecoveredMinutes: number;
  }>;
  onApplyAdjustment?: (index: number) => void;
}

export interface CompanionMessageProps extends BaseComponentProps {
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
  evidenceItems?: Array<{ type: string; summary: string }>;
  suggestedActions?: Array<{ label: string; actionType: string }>;
  onSelectAction?: (actionType: string) => void;
}

export interface CompanionPulseProps extends BaseComponentProps {
  state: 'idle' | 'listening' | 'reflecting' | 'speaking';
  size?: number;
}
