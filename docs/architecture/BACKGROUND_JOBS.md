# SAAR Background Jobs Architecture & Runbook

## 1. Overview
SAAR background processing handles asynchronous tasks, periodic maintenance, daily growth computation, and event processing without blocking incoming HTTP requests. The system leverages BullMQ / Redis queues for worker scheduling and Postgres transactional outbox for reliable event propagation.

## 2. Queue Topology & Priorities
Background jobs are organized into discrete named queues:

| Queue Name | Priority | Concurrency | SLA / Max Latency | Description |
|------------|----------|-------------|-------------------|-------------|
| `critical-notifications` | 1 (Highest) | 10 | < 5 seconds | Urgent notifications (reminders, alarms, immediate push) |
| `event-outbox-worker` | 2 | 5 | < 15 seconds | Dequeues from Postgres `OutboxEvent` table and delivers to consumers |
| `daily-growth-processor` | 3 | 3 | < 60 seconds | Nightly/Morning aggregation of daily metrics, habit stats, and momentum |
| `session-cleanup` | 4 (Lowest) | 1 | < 1 hour | Periodic purge of expired tokens, rotated session tombstones, and dead locks |

## 3. Worker Lifecycle & Resiliency
- **Graceful Shutdown**: All workers listen to `SIGTERM` and `SIGINT`, finishing currently active in-flight jobs within a 20-second timeout window before terminating.
- **Exponential Backoff**: Transient failures (e.g. downstream network blips) retry up to 5 times using exponential backoff:
  ```typescript
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000,
  }
  ```
- **Dead Letter Queue (DLQ)**: Jobs failing after 5 attempts are automatically transitioned to `<queue-name>:failed` with complete stack traces, payload parameters, and error contexts for SRE investigation.

## 4. Idempotency Guarantees
Every background job includes an `idempotencyKey` formatted as `<aggregateType>:<aggregateId>:<operation>:<epochWindow>` to prevent duplicate execution across retries or distributed worker instances.
