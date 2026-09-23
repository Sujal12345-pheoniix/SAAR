/**
 * Domain event envelope and event-type catalogue.
 *
 * Every event published to the internal event bus (Redis Streams / BullMQ)
 * MUST conform to `EventEnvelope<T>`.  The `payload` shape is left generic so
 * individual event schemas can be defined alongside their producing service
 * while still being validated against this shared envelope.
 */

import type { ActorType } from '../enums/index.js';

// ─── Event type catalogue ─────────────────────────────────────────────────────

export enum EventType {
  // User lifecycle
  USER_REGISTERED = 'user.registered',

  // Goal lifecycle
  GOAL_CREATED = 'goal.created',
  GOAL_UPDATED = 'goal.updated',
  GOAL_COMPLETED = 'goal.completed',

  // Task lifecycle
  TASK_CREATED = 'task.created',
  TASK_COMPLETED = 'task.completed',
  TASK_SKIPPED = 'task.skipped',
  TASK_SNOOZED = 'task.snoozed',
  TASK_RESCHEDULED = 'task.rescheduled',

  // Routine & habit tracking
  ROUTINE_COMPLETED = 'routine.completed',
  ROUTINE_SKIPPED = 'routine.skipped',

  // Alarm / reminder
  ALARM_DISMISSED = 'alarm.dismissed',

  // Check-in
  CHECKIN_COMPLETED = 'checkin.completed',

  // Daily growth session
  DAILY_GROWTH_STARTED = 'daily_growth.started',
  DAILY_GROWTH_COMPLETED = 'daily_growth.completed',

  // Insights
  INSIGHT_VIEWED = 'insight.viewed',
  INSIGHT_ACCEPTED = 'insight.accepted',

  // Interventions
  INTERVENTION_COMPLETED = 'intervention.completed',

  // Companion / AI
  COMPANION_MESSAGE_SENT = 'companion.message.sent',

  // Memory
  MEMORY_CREATED = 'memory.created',

  // Notifications
  NOTIFICATION_DELIVERED = 'notification.delivered',

  // Subscription / billing
  SUBSCRIPTION_CHANGED = 'subscription.changed',
}

// ─── Envelope ─────────────────────────────────────────────────────────────────

/**
 * Universal event envelope.  All internal domain events are wrapped in this shape
 * before being published to the bus, persisted to the event store, or forwarded
 * to analytics pipelines.
 *
 * @template T  Type of the event-specific payload.
 */
export interface EventEnvelope<T = unknown> {
  /** UUID v4 — unique identifier for this event instance. */
  id: string;
  /** Discriminator used by consumers to route / deserialise the payload. */
  type: EventType;
  /** Monotonically increasing integer allowing backward-compatible schema evolution. */
  schemaVersion: number;
  /** ISO-8601 wall-clock time when the domain fact occurred. */
  occurredAt: string;
  /** Service / module that produced this event, e.g. `"api-gateway"`. */
  producer: string;
  /** Who triggered the action that caused this event. */
  actor: {
    type: ActorType;
    /** UUID of the actor (user ID, service account ID, etc.). */
    id: string;
  };
  /** The domain object this event pertains to. */
  aggregate: {
    /** Aggregate root type name, e.g. `"Goal"`, `"Task"`. */
    type: string;
    /** UUID of the aggregate root instance. */
    id: string;
  };
  /** Event-specific data. Should be a plain serialisable object. */
  payload: T;
  /** Optional W3C trace-context trace ID for cross-service correlation. */
  traceId?: string;
}
