# SAAR Transactional Outbox Pattern Architecture

## 1. Problem Statement & Rationale
In distributed systems, updating a database and publishing an event to a message broker (e.g. Redis, Kafka) cannot be done atomically without two-phase commit (2PC), which introduces unacceptable latency and availability risks.
A failure between writing to PostgreSQL and publishing to Redis leads to "dual-write" inconsistencies (either phantom events or lost updates).

SAAR implements the **Transactional Outbox Pattern** to achieve guaranteed at-least-once event delivery while preserving strict ACID consistency.

## 2. Architecture & Data Flow

```
[HTTP Request / Controller]
             │
             ▼
  ┌─────────────────────────────────────────────────────────┐
  │ PostgreSQL Transaction ($transaction)                   │
  │   1. INSERT/UPDATE domain entity (e.g. Task, Goal)     │
  │   2. INSERT into OutboxEvent (topic, payload, status)   │
  └─────────────────────────────────────────────────────────┘
             │ (Committed atomically)
             ▼
┌─────────────────────────────────────────────────────────┐
│ Outbox Poller / Dequeue Worker                          │
│   - SELECT FOR UPDATE SKIP LOCKED (limit 50)            │
│   - Status = PENDING, scheduledFor <= NOW()             │
│   - Publish event payload to Redis Streams / BullMQ      │
│   - UPDATE OutboxEvent SET status = 'PUBLISHED'         │
└─────────────────────────────────────────────────────────┘
```

## 3. Database Schema

The `OutboxEvent` schema in PostgreSQL:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Globally unique event identifier |
| `aggregateType` | VARCHAR(64) | e.g. `Task`, `Goal`, `User` |
| `aggregateId` | UUID | Target entity ID |
| `eventType` | VARCHAR(128) | e.g. `task.completed`, `goal.created` |
| `payload` | JSONB | Complete event snapshot conforming to `@saar/contracts` |
| `status` | ENUM | `PENDING`, `PUBLISHED`, `FAILED` |
| `retryCount` | INT | Number of dispatch attempts (max 5) |
| `createdAt` | TIMESTAMPTZ | Creation timestamp |
| `publishedAt` | TIMESTAMPTZ | Completion timestamp |

## 4. Concurrency & Contention Prevention
The worker utilizes `SKIP LOCKED` to allow multiple concurrent publisher pods without locks colliding:
```sql
SELECT * FROM "OutboxEvent"
WHERE "status" = 'PENDING'
ORDER BY "createdAt" ASC
LIMIT 50
FOR UPDATE SKIP LOCKED;
```

## 5. Failure Handling & Poison Pill Protection
- If event dispatch throws an unrecoverable serialization or broker error, `retryCount` is incremented.
- After 5 failed attempts, status is marked `FAILED` and an alert is triggered to PagerDuty/SRE.
