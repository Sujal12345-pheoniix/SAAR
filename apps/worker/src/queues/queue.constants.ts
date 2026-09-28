export const QUEUE_NAMES = {
  OUTBOX: 'saar:outbox',
  NOTIFICATIONS: 'saar:notifications',
  DAILY_GROWTH: 'saar:daily-growth',
  ROUTINES: 'saar:routines',
  MAINTENANCE: 'saar:maintenance',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

export const QUEUE_CONCURRENCY = {
  [QUEUE_NAMES.OUTBOX]: 5,
  [QUEUE_NAMES.NOTIFICATIONS]: 10,
  [QUEUE_NAMES.DAILY_GROWTH]: 3,
  [QUEUE_NAMES.ROUTINES]: 5,
  [QUEUE_NAMES.MAINTENANCE]: 1,
} as const;

export const OUTBOX_CONFIG = {
  BATCH_SIZE: 50,
  MAX_ATTEMPTS: 5,
  POLL_INTERVAL_MS: 3000,
  LOCK_TIMEOUT_MS: 30000,
} as const;

export const RETRY_STRATEGIES = {
  EXPONENTIAL: {
    type: 'exponential',
    delay: 2000,
  },
} as const;
