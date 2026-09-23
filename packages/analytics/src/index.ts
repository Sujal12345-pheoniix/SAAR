// SAAR Analytics — Event names and schemas
// NO PII in analytics payloads. Aggregate and product-level events only.

export const ANALYTICS_EVENTS = {
  APP_OPENED: 'app_opened',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FUTURE_SELF_CREATED: 'future_self_created',
  GOAL_CREATED: 'goal_created',
  TASK_COMPLETED: 'task_completed',
  TASK_SKIPPED: 'task_skipped',
  TASK_SNOOZED: 'task_snoozed',
  ALARM_DISMISSED: 'alarm_dismissed',
  DAILY_GROWTH_STARTED: 'daily_growth_started',
  DAILY_GROWTH_COMPLETED: 'daily_growth_completed',
  INSIGHT_VIEWED: 'insight_viewed',
  INSIGHT_ACCEPTED: 'insight_accepted',
  INSIGHT_DISMISSED: 'insight_dismissed',
  RECOMMENDATION_FOLLOWED: 'recommendation_followed',
  RECOMMENDATION_FAILED: 'recommendation_failed',
  COMPANION_MESSAGE_SENT: 'companion_message_sent',
  MEMORY_SAVED: 'memory_saved',
  NOTIFICATION_OPENED: 'notification_opened',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  schemaVersion: number;
  userId?: string; // hashed/pseudonymous only
  sessionId?: string;
  timestamp: string; // ISO-8601
  properties: Record<string, string | number | boolean>;
}

// Rule: analytics payloads MUST NOT contain raw conversation text,
// reflection content, or goal descriptions.
