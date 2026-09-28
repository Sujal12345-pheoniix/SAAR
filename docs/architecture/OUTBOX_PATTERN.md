# SAAR Transactional Outbox Pattern Architecture & Implementation

## 1. Problem Statement & Rationale
In modern distributed systems, executing an application state change (e.g. updating a task in PostgreSQL) and emitting an event to an external consumer or queue cannot be performed atomically without distributed transactions (Two-Phase Commit / 2PC). 2PC introduces high latency, dependency coupling, and severe availability degradation.

A naive dual-write approach (writing to PostgreSQL, then calling Redis/Queue) suffers from two fundamental failure modes:
1. **Database writes succeed, broker write fails**: The event is permanently lost, leading to desynchronized downstream states (missing notifications, missing streaks, lost metrics).
2. **Broker write succeeds, database transaction rolls back**: Downstream consumers act on a phantom event that never truly existed in the source of truth.

To eliminate dual-write hazards and guarantee strict ACID consistency with at-least-once event delivery, SAAR implements the **Transactional Outbox Pattern**.

---

## 2. End-to-End Outbox Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NestJS API Tier (`apps/api`)                     │
│                                                                        │
│   Domain Mutation Service (TasksService, GoalsService, etc.)          │
│       │                                                                │
│       ▼                                                                │
│   Prisma Interactive Transaction:                                      │
│   await prisma.$transaction(async (tx) => {                           │
│     // 1. Update Domain Model                                          │
│     const task = await tx.task.update({ ... });                        │
│     // 2. Insert Behavioral Event Audit Row                            │
│     await tx.behaviorEvent.create({ ... });                            │
│     // 3. Insert Outbox Event Atomically                               │
│     await tx.outboxEvent.create({                                      │
│       data: {                                                          │
│         id: uuidv4(),                                                  │
│         userId: user.id,                                               │
│         eventType: 'task.completed',                                   │
│         schemaVersion: 1,                                              │
│         aggregateType: 'Task',                                         │
│         aggregateId: task.id,                                          │
│         payload: { taskId: task.id, completedAt: task.completedAt },    │
│         status: 'PENDING',                                             │
│         attempts: 0,                                                   │
│         availableAt: new Date(),                                       │
│       }                                                                │
│     });                                                                │
│   });                                                                  │
│       │                                                                │
│   Transaction commits. HTTP response returns to user.                  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Committed to outbox_events table
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Worker Tier (`apps/worker`)                       │
│                                                                        │
│   OutboxPublisherService (Long-Running Background Loop)                │
│       │                                                                │
│       ├── 1. Atomic Polling & Claiming:                                │
│       │   UPDATE "outbox_events"                                       │
│       │   SET "status" = 'PROCESSING',                                 │
│       │       "attempts" = "attempts" + 1                              │
│       │   WHERE "id" IN (                                              │
│       │     SELECT "id" FROM "outbox_events"                           │
│       │     WHERE "status" = 'PENDING'                                 │
│       │       AND "availableAt" <= NOW()                               │
│       │     ORDER BY "createdAt" ASC                                   │
│       │     LIMIT 50                                                   │
│       │     FOR UPDATE SKIP LOCKED                                     │
│       │   ) RETURNING *;                                               │
│       │                                                                │
│       ├── 2. Dispatch to Downstream Queue / Processor                  │
│       │                                                                │
│       ├── 3. On Dispatch Success:                                      │
│       │   UPDATE "outbox_events"                                       │
│       │   SET "status" = 'PROCESSED', "processedAt" = NOW()            │
│       │   WHERE "id" = event.id;                                       │
│       │                                                                │
│       └── 4. On Transient Failure:                                     │
│           backoffMs = min(2^attempts * 1000ms, 60000ms)                │
│           if attempts >= 5 -> status = 'DEAD_LETTER'                   │
│           else -> status = 'PENDING', availableAt = NOW() + backoffMs  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Specification

The `outbox_events` table in PostgreSQL is defined as follows:

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | No | `uuid_generate_v4()` | Globally unique event identifier |
| `userId` | `UUID` | No | - | Foreign key to `users(id)` (Multi-tenant boundary) |
| `eventType` | `VARCHAR(128)` | No | - | Standardized event name (e.g. `task.completed`, `goal.created`) |
| `schemaVersion` | `INTEGER` | No | `1` | Payload format version for backwards-compatible evolution |
| `aggregateType` | `VARCHAR(64)` | No | - | Domain entity type (e.g. `Task`, `Goal`, `Routine`) |
| `aggregateId` | `VARCHAR(64)` | No | - | ID of the target aggregate |
| `payload` | `JSONB` | No | - | Event payload snapshot conforming to `@saar/contracts` |
| `status` | `VARCHAR(32)` | No | `'PENDING'` | Lifecycle state: `PENDING`, `PROCESSING`, `PROCESSED`, `DEAD_LETTER` |
| `attempts` | `INTEGER` | No | `0` | Number of times this event has been claimed/dispatched |
| `availableAt` | `TIMESTAMPTZ` | No | `NOW()` | Next timestamp at which workers may claim this event (for backoff) |
| `processedAt` | `TIMESTAMPTZ` | Yes | `NULL` | Timestamp of successful publication/acknowledgment |
| `createdAt` | `TIMESTAMPTZ` | No | `NOW()` | Creation timestamp |

### Indexes & Performance Optimizations
```sql
-- Optimal composite index for polling & claiming:
CREATE INDEX "outbox_events_status_availableAt_createdAt_idx"
ON "outbox_events" ("status", "availableAt", "createdAt");

-- Tenant lookup index:
CREATE INDEX "outbox_events_userId_idx"
ON "outbox_events" ("userId");
```

---

## 4. Concurrency & Contention-Free Worker Scaling

Multiple worker instances can run in parallel without race conditions or table locking bottlenecks through PostgreSQL's row-level locking:
```sql
UPDATE "outbox_events"
SET "status" = 'PROCESSING',
    "attempts" = "attempts" + 1
WHERE "id" IN (
  SELECT "id"
  FROM "outbox_events"
  WHERE "status" = 'PENDING'
    AND "availableAt" <= NOW()
  ORDER BY "createdAt" ASC
  LIMIT 50
  FOR UPDATE SKIP LOCKED
)
RETURNING *;
```
### Why `FOR UPDATE SKIP LOCKED`?
- **Zero Lock Collisions**: When Worker Instance A reads and locks rows 1-50, Worker Instance B concurrently running the query skips those locked rows and immediately locks rows 51-100. Neither worker blocks the other.
- **Horizontal Scalability**: Worker instances can scale from 1 to 20+ replicas with linear throughput gains and zero deadlocks.
- **Crash Recovery**: If a worker process abruptly dies midway through execution, the transaction aborts and row locks release immediately, or a heartbeat timeout reclaims stale `PROCESSING` rows.

---

## 5. Failure State Machine & Poison Pill Protection

```
               ┌───────────────┐
               │    PENDING    │◄──────────────┐
               └───────┬───────┘               │
                       │                       │
           Claim batch (SKIP LOCKED)           │
                       │                       │
                       ▼                       │ Transient error
               ┌───────────────┐               │ (attempts < 5,
               │  PROCESSING   │───────────────┤  exponential backoff)
               └───────┬───────┘               │
                       │                       │
         ┌─────────────┴─────────────┐         │
         │                           │         │
      Success                   Failure (max)  │
         │                           │         │
         ▼                           ▼         │
  ┌──────────────┐            ┌─────────────┐  │
  │  PROCESSED   │            │ DEAD_LETTER │  │
  └──────────────┘            └─────────────┘  │
                                     │         │
                                     └─────────┘ (Manual / Operator Replay)
```

1. **Transient Network or Broker Failures**:
   - `attempts` is incremented.
   - Status returns to `PENDING`.
   - `availableAt` is set to `Date.now() + min(2^attempts * 1000ms, 60000ms)`.
2. **Permanent Failures / Poison Pills**:
   - When `attempts >= 5`, the status transitions to `DEAD_LETTER`.
   - The worker writes the error message and timestamp into `payload.lastError` and `payload.failedAt`.
   - Emits an alert log with `[OutboxPublisherService] ERROR Outbox event {id} permanently failed -> Moved to DEAD_LETTER`.
   - Normal poller skips dead-letter records, ensuring the processing pipeline is never halted by an invalid event.

---

## 6. Retention & Pruning Policy

To prevent the `outbox_events` table from growing unboundedly and impacting query performance:
1. **Processed Events Retention**: Outbox events marked `status = 'PROCESSED'` are retained for **7 days** to facilitate auditing, trace correlation, and incident investigation.
2. **Automated Pruning Job**: The `MaintenanceWorkerService` executes daily:
   ```sql
   DELETE FROM "outbox_events"
   WHERE "status" = 'PROCESSED'
     AND "processedAt" < NOW() - INTERVAL '7 days';
   ```
3. **Dead-Letter Retention**: Events in `DEAD_LETTER` status are **never deleted automatically**. They remain in the database until explicitly resolved, replayed, or acknowledged by an engineer.
