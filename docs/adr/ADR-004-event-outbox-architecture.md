# ADR-004: Transactional Outbox Pattern for Events

| Field       | Value                                     |
|-------------|-------------------------------------------|
| **Status**  | Accepted                                  |
| **Date**    | 2026-09-23                                |
| **Authors** | SAAR Core Team                            |
| **Deciders**| Engineering Lead                          |

---

## Context

SAAR has several domain mutations that must trigger side effects in other modules:

| Domain Event                  | Side Effect                                           |
|-------------------------------|-------------------------------------------------------|
| `task.completed`              | Update goal progress, trigger insight generation      |
| `checkin.submitted`           | Analyze mood trend, maybe nudge notification          |
| `goal.created`                | Generate AI-suggested subtasks                        |
| `subscription.upgraded`       | Unlock premium features, send welcome email           |
| `routine.completed`           | Update streak counter, log behavior event             |
| `user.registered`             | Send verification email, create default life areas    |

The naive approach is to call secondary services **directly** after the primary DB
write:

```typescript
// ANTI-PATTERN — dual-write problem
await prisma.task.update({ where: { id }, data: { status: 'DONE' } });
await notificationsService.scheduleNudge(userId); // What if this crashes?
await insightsService.enqueueAnalysis(goalId);    // Half the side effects happened
```

If the process crashes after the DB write but before the queue write, **the event is
silently dropped**. This leads to inconsistent state that is hard to detect and
reproduce.

### Options Considered

| Approach                         | Pros                                   | Cons                                                    |
|----------------------------------|----------------------------------------|---------------------------------------------------------|
| **Direct service calls**         | Simple                                 | Dual-write risk, tight coupling, hard to retry           |
| **Change Data Capture (CDC)**    | Database-driven, no code changes       | Requires Debezium/Kafka, heavyweight for Phase 1         |
| **Transactional Outbox**         | Atomic with DB write, reliable         | Polling overhead, slight delay                           |
| **Saga pattern**                 | Fine-grained compensation              | Very complex, overkill for modular monolith              |

---

## Decision

**All domain mutations that require cross-module side effects write an `OutboxEvent`
record in the same Prisma transaction. A dedicated OutboxPublisher polls the table
and delivers events to the internal event bus (and optionally to Redis queues).**

### Outbox Table Schema

```sql
CREATE TABLE outbox_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type  TEXT NOT NULL,           -- e.g. 'Task', 'Goal', 'Subscription'
  aggregate_id    UUID NOT NULL,           -- the entity that changed
  event_type      TEXT NOT NULL,           -- e.g. 'task.completed'
  payload         JSONB NOT NULL,          -- event data (serializable)
  status          TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | PROCESSING | DELIVERED | FAILED
  attempts        INT NOT NULL DEFAULT 0,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at    TIMESTAMPTZ,
  trace_id        TEXT                     -- OpenTelemetry trace propagation
);

CREATE INDEX idx_outbox_status_scheduled ON outbox_events(status, scheduled_for)
  WHERE status IN ('PENDING', 'FAILED');
```

### Write Pattern (Service Layer)

```typescript
// CORRECT — atomic via Prisma transaction
async completeTask(taskId: string, userId: string): Promise<Task> {
  return this.prisma.$transaction(async (tx) => {
    const task = await tx.task.update({
      where: { id: taskId, userId },
      data: { status: 'DONE', completedAt: new Date() },
    });

    await tx.outboxEvent.create({
      data: {
        aggregateType: 'Task',
        aggregateId:   task.id,
        eventType:     'task.completed',
        payload: {
          taskId:    task.id,
          goalId:    task.goalId,
          userId:    task.userId,
          completedAt: task.completedAt,
        },
      },
    });

    return task;
  });
}
```

### Outbox Publisher

The `OutboxModule` contains an `OutboxPublisher` that:

1. Polls every **2 seconds** for `PENDING` events with `scheduled_for <= NOW()`.
2. Claims events with an atomic `UPDATE … SET status = 'PROCESSING' WHERE id = $1 AND status = 'PENDING'`
   (prevents double-processing in case of future horizontal scaling).
3. Publishes to NestJS `EventEmitter2` (same process) and/or BullMQ queue (Redis).
4. On success: marks `DELIVERED`, sets `delivered_at`.
5. On failure: increments `attempts`, sets `FAILED`, schedules retry with
   exponential backoff: `scheduled_for = NOW() + (2 ^ attempts) * INTERVAL '1 second'`.
6. Max attempts: 10. After that, event is marked `DEAD` and alert is raised.

```
Poll interval: 2 s (configurable via OUTBOX_POLL_INTERVAL_MS env var)
Max attempts:  10
Backoff:       2^n seconds (1s, 2s, 4s, 8s … 512s)
Dead queue:    outbox_events WHERE status = 'DEAD' (manual intervention required)
```

### Consumer Requirements

All event consumers **MUST** be idempotent. The outbox guarantees **at-least-once
delivery**, not exactly-once. Consumers must handle duplicate events gracefully:

```typescript
// Consumer must be idempotent — check before acting
@OnEvent('task.completed')
async handleTaskCompleted(payload: TaskCompletedPayload): Promise<void> {
  const alreadyProcessed = await this.prisma.goalProgress.findFirst({
    where: { taskId: payload.taskId, type: 'TASK_COMPLETION' },
  });
  if (alreadyProcessed) return; // idempotency guard

  // ... process event
}
```

---

## Consequences

### Positive
- **No lost events**: DB write and event publication are atomic.
- **Retry logic built in**: transient failures (AI service down) self-heal.
- **Audit trail**: `outbox_events` table is a complete history of domain changes.
- **Decoupled modules**: `TasksModule` doesn't import `InsightsModule`.

### Negative / Risks
- **Polling overhead**: 2-second poll adds minor DB load.
  **Mitigation**: index on `(status, scheduled_for)`, poll only on worker process.
- **At-least-once**: consumers must handle duplicates.
  **Mitigation**: idempotency guard pattern enforced in code review.
- **Delivery delay**: up to 2 seconds between event and consumer execution.
  **Mitigation**: acceptable for all current use cases; real-time push is handled
  separately via WebSocket subscriptions.

---

## References

- [Transactional Outbox Pattern — microservices.io](https://microservices.io/patterns/data/transactional-outbox.html)
- [Implementing the Outbox Pattern — Kamil Grzybek](https://www.kamilgrzybek.com/design/the-outbox-pattern/)
- [BullMQ Documentation](https://docs.bullmq.io/)
