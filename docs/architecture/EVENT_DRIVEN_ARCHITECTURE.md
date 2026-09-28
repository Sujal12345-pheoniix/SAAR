# SAAR Event-Driven Architecture & Distributed Processing

## 1. Overview & Architectural Philosophy
The SAAR platform is built around personal growth intelligence, historical behavioral telemetry, and asynchronous background processing. The event architecture is designed with the following core principles:
1. **PostgreSQL as the Absolute System of Record**: All state changes occur transactionally in PostgreSQL. No event exists without a committed database row.
2. **Dual-Write Prevention via Transactional Outbox**: Rather than attempting distributed 2-phase commits across PostgreSQL and a message broker, all domain mutations write an `OutboxEvent` within the same database transaction.
3. **Decoupled Asynchronous Processing**: Domain APIs acknowledge HTTP mutations immediately after the local transaction commits. Heavy side-effects (push notifications, daily plan generation, routine occurrence generation, metrics aggregation, archival) run asynchronously in dedicated worker processes (`@saar/worker`).
4. **At-Least-Once Delivery with Mandatory Consumer Idempotency**: Distributed systems cannot guarantee exactly-once delivery across network boundaries. Therefore, the pipeline guarantees **at-least-once delivery**, and every consumer/worker is designed to be strictly **idempotent**.

---

## 2. End-to-End Event Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NestJS API Tier (`apps/api`)                     │
│                                                                        │
│   HTTP Request (e.g. POST /tasks/:id/complete)                         │
│       │                                                                │
│       ▼                                                                │
│   Prisma Interactive Transaction ($transaction):                       │
│     ├── 1. UPDATE "tasks" SET "status" = 'COMPLETED' ...               │
│     ├── 2. INSERT INTO "behavior_events" (...)                         │
│     └── 3. INSERT INTO "outbox_events" (eventType, payload, status)    │
│       │                                                                │
│   HTTP 200 Response to Client (latency < 50ms)                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Committed Transaction
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Worker Background Tier (`apps/worker`)                 │
│                                                                        │
│   OutboxPublisherService (Periodic Poller / Event Loop):               │
│     ├── SELECT FOR UPDATE SKIP LOCKED FROM "outbox_events"             │
│     │   WHERE "status" = 'PENDING' AND "availableAt" <= NOW()          │
│     │   LIMIT 50;                                                      │
│     ├── UPDATE "outbox_events" SET "status" = 'PROCESSING'             │
│     └── Dispatch Job to Dedicated Queues / Consumers:                  │
│           ├── saar:notifications (Push / In-App notifications)         │
│           ├── saar:daily-growth (Daily plan generation)                │
│           ├── saar:routines (Routine occurrence generation)            │
│           └── saar:maintenance (Pruning / Session cleanup)             │
│                                                                        │
│   Worker Execution & Acknowledgment:                                   │
│     ├── Validate Job Payload against Zod Contracts                     │
│     ├── Idempotency Check (status check, unique compound index)        │
│     ├── Execute Domain Action / Provider API Call                      │
│     └── UPDATE "outbox_events" SET "status" = 'PROCESSED'              │
│                                                                        │
│   Failure Handling:                                                    │
│     ├── On Transient Error: Backoff (2^attempts * 1000ms), status PENDING│
│     └── On Max Attempts (5): Transition status to 'DEAD_LETTER'        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Event Taxonomy & Runtime Contracts

All events emitted into `behavior_events` and `outbox_events` adhere to standardized event naming and Zod validation contracts defined in `@saar/contracts`:

### 3.1 Taxonomy Matrix
| Category | Event Type | Aggregate Type | Trigger Conditions | Downstream Handlers |
|---|---|---|---|---|
| **Task Lifecycle** | `task.created` | `Task` | User creates a new task | Audit, Outbox |
| | `task.completed` | `Task` | Task marked completed | Metric observation, Outbox, Plan update |
| | `task.skipped` | `Task` | Task marked skipped | Skip reason log, behavioral telemetry |
| | `task.snoozed` | `Task` | Task rescheduled to future date | Reschedule counter, reminder adjustment |
| | `task.cancelled`| `Task` | Task marked cancelled | Behavioral telemetry, plan update |
| **Routine Lifecycle** | `routine.created` | `Routine` | New recurring routine defined | Schedule planner |
| | `routine.completed` | `RoutineOccurrence` | Daily occurrence marked done | Streak calculation, habit telemetry |
| | `routine.skipped` | `RoutineOccurrence` | Daily occurrence marked skipped | Skip reason analysis |
| **Daily Growth** | `daily_growth.started` | `DailyGrowth` | User starts daily session | Session tracker |
| | `daily_growth.completed` | `DailyGrowth` | Daily review finished | Metric observation, streak update |
| **Check-in** | `checkin.completed` | `Checkin` | Mood/energy check-in completed | Metric observation, wellbeing telemetry |
| **Goal** | `goal.created` | `Goal` | New goal established | Target metric initialisation |
| | `goal.completed`| `Goal` | Goal marked completed | Milestone telemetry, achievement log |
| **System** | `notification.delivered`| `Notification` | Push notification dispatched | Notification status update |

### 3.2 Standard Event Envelope Schema
Every event conforms to the `EventEnvelopeSchema`:
```typescript
{
  id: string;             // UUIDv4 event ID
  type: EventType;        // e.g. "task.completed"
  schemaVersion: number;  // Integer versioning (e.g. 1)
  occurredAt: string;     // ISO-8601 UTC timestamp
  producer: string;       // Producing service (e.g. "api:tasks")
  actor: {
    type: "USER" | "SYSTEM" | "ADMIN";
    id: string;           // User UUID or system identifier
  };
  aggregate: {
    type: string;         // e.g. "Task", "Goal"
    id: string;           // Target entity UUID
  };
  payload: Record<string, unknown>; // Strongly typed payload conforming to Zod schema
  traceId?: string;       // Distributed tracing correlation ID (X-Request-Id)
}
```

---

## 4. Consumer Idempotency & Ordering Guarantees

In distributed asynchronous systems, network retries, timeout reconnections, and worker crashes can lead to duplicate message deliveries. SAAR guarantees idempotency across all consumers using a multi-layer strategy:

### 4.1 Database-Level Unique Constraints
- **Daily Plans**: Compound unique constraint `[userId, localDate]` on `Plan`. If two plan generation jobs execute concurrently for the same user date, PostgreSQL enforces that only one row is created; the secondary insert fails with unique key violation, which the worker catches and converts into an idempotent no-op.
- **Routine Occurrences**: Compound unique constraint `[routineId, localDate]` on `RoutineOccurrence`. Duplicate jobs for the same routine date safely skip re-generation.
- **Outbox Processing**: The atomic `SELECT FOR UPDATE SKIP LOCKED` ensures two worker instances never lock or process the same outbox row concurrently.

### 4.2 State Machine Check-Before-Execute
Consumers inspect the current entity state before performing state transitions:
```typescript
const notification = await this.prisma.notification.findUnique({ where: { id: payload.notificationId } });
if (notification.status === 'SENT') {
  this.logger.log(`Notification ${payload.notificationId} already delivered (idempotent skip).`);
  return;
}
```

### 4.3 Ordering Semantics
Outbox events are claimed in strict chronological order by creation timestamp:
```sql
SELECT "id" FROM "outbox_events"
WHERE "status" = 'PENDING' AND "availableAt" <= NOW()
ORDER BY "createdAt" ASC
LIMIT 50
FOR UPDATE SKIP LOCKED;
```
For operations on the same aggregate (e.g. multiple updates to Task X), ordering is preserved by aggregate ID sequential claiming or partition keys.

---

## 5. Dead-Letter Queue (DLQ) & Exponential Backoff

### 5.1 Retry Schedule
When a worker encounters a transient failure (e.g. network timeout to push provider, database deadlock):
1. The error message and failure timestamp are recorded in the event's `payload.lastError`.
2. The `attempts` counter is incremented.
3. The event remains in `PENDING` status, but `availableAt` is pushed into the future according to the exponential backoff formula:
   $$\text{backoffMs} = \min(2^{\text{attempts}} \times 1000\text{ ms}, 60000\text{ ms})$$
   - Attempt 1: +2s
   - Attempt 2: +4s
   - Attempt 3: +8s
   - Attempt 4: +16s
   - Attempt 5: +32s

### 5.2 Dead-Letter State Transition
If `attempts >= 5`, the event transitions to `status = 'DEAD_LETTER'`:
- It is no longer picked up by the normal polling loop (`WHERE status = 'PENDING'`).
- An error log is recorded at `ERROR` level with the complete stack trace and payload.
- SRE alerts trigger via monitoring systems.
- Operators can inspect and replay dead-letter events using administrative commands once downstream dependencies are restored.
