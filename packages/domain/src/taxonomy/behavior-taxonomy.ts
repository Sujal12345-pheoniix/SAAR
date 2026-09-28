/**
 * Canonical SAAR Behavior Event Taxonomy
 * Controlled taxonomy for all behavioral telemetry in the system.
 */

export const BEHAVIOR_EVENT_TYPES = [
  // Task events
  'task.created',
  'task.started',
  'task.completed',
  'task.skipped',
  'task.cancelled',
  'task.rescheduled',

  // Routine events
  'routine.created',
  'routine.completed',
  'routine.skipped',
  'routine.archived',

  // Goal events
  'goal.created',
  'goal.updated',
  'goal.completed',
  'goal.paused',
  'goal.archived',

  // Metric events
  'metric.observed',

  // Check-in & Session events
  'checkin.completed',
  'daily_growth.started',
  'daily_growth.completed',

  // Planning events
  'plan.created',
  'plan.updated',

  // Alarm & System events
  'alarm.dismissed',
] as const;

export type BehaviorEventType = (typeof BEHAVIOR_EVENT_TYPES)[number];

export function isValidBehaviorEventType(t: string): t is BehaviorEventType {
  return (BEHAVIOR_EVENT_TYPES as readonly string[]).includes(t);
}

export interface ValidatedBehaviorEvent {
  id: string;
  userId: string;
  eventType: BehaviorEventType;
  occurredAt: Date;
  source: string;
  entityType?: string | undefined;
  entityId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  schemaVersion: number;
}
