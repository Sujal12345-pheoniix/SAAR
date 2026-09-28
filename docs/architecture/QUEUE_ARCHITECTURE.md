# SAAR Queue Architecture & Background Job Processing

## 1. Overview & Topology
SAAR uses a dedicated background worker system (`@saar/worker`) to process asynchronous jobs independently of the client-facing HTTP API (`apps/api`). The queue topology isolates distinct workload domains into separated logical channels, preventing noisy neighbor problems, bulk processing starvation, and uncontrolled concurrency.

### Queue Matrix & Concurrency Limits
| Queue Name | Purpose | Concurrency | Priority | Retry Strategy | Backpressure Strategy |
|---|---|---|---|---|---|
| `saar:outbox` | Polling and dispatching committed transactional outbox events | 5 | CRITICAL | 5 attempts, Exponential backoff | Polling batch size limit (50) |
| `saar:notifications` | Push notification delivery via APNS / FCM / In-App | 10 | HIGH | 3 attempts, Fixed 5s backoff | Rate-limiting per provider token |
| `saar:daily-growth` | Morning daily plan generation across active timezones | 3 | MEDIUM | 3 attempts, 10s backoff | User timezone staggering (cron per hour) |
| `saar:routines` | Daily routine occurrence record creation | 5 | MEDIUM | 3 attempts, 10s backoff | Idempotent upsert on `[routineId, localDate]` |
| `saar:maintenance` | Session expiry cleanup, processed outbox event pruning | 1 | LOW | 2 attempts, 60s backoff | Off-peak scheduled execution (02:00 UTC) |

---

## 2. Queue Infrastructure & Technology Stack

- **Broker**: Redis 7+ (Alpine / Managed Redis), utilizing BullMQ / Streams for reliable queue management with persistence enabled (`appendonly yes`).
- **Runtime**: NestJS worker service with pino structured JSON logging.
- **Worker Process**: Node.js process managed separately from the API, enabling independent scaling based on queue depth.
- **Connection Management**:
  - Connection pooling with health monitoring (`ioredis`).
  - Automatic reconnection with exponential backoff on broker connection drop.
  - Heartbeat monitoring to detect and recover stalled or dead worker instances.

---

## 3. Job Contracts & Runtime Validation

To prevent malformed data or schema drift between producers and consumers from contaminating queue processing, every job payload must pass strict runtime validation using **Zod schemas** defined in `apps/worker/src/queues/job-contracts.ts`.

### 3.1 Job Contract Schemas
1. **NotificationJobSchema**:
   ```typescript
   export const NotificationJobSchema = z.object({
     notificationId: z.string().uuid(),
     userId: z.string().uuid(),
     type: z.enum(['PUSH', 'IN_APP', 'EMAIL']),
     title: z.string().min(1),
     body: z.string().min(1),
     scheduledAt: z.string().datetime(),
     idempotencyKey: z.string().min(1),
     metadata: z.record(z.unknown()).optional(),
   });
   ```
2. **DailyGrowthJobSchema**:
   ```typescript
   export const DailyGrowthJobSchema = z.object({
     userId: z.string().uuid(),
     localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
     timezone: z.string().min(1),
     scheduledAt: z.string().datetime(),
   });
   ```
3. **RoutineOccurrenceJobSchema**:
   ```typescript
   export const RoutineOccurrenceJobSchema = z.object({
     routineId: z.string().uuid(),
     userId: z.string().uuid(),
     localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
     scheduledTime: z.string().optional(),
   });
   ```
4. **MaintenanceJobSchema**:
   ```typescript
   export const MaintenanceJobSchema = z.object({
     jobType: z.enum(['PURGE_EXPIRED_SESSIONS', 'PRUNE_OUTBOX_EVENTS', 'ROTATE_LOGS']),
     retentionDays: z.number().int().positive(),
     requestedAt: z.string().datetime(),
   });
   ```

### 3.2 Poison Pill Rejection
If a job is enqueued with an invalid payload failing Zod parsing:
- The worker immediately catches the `ZodError`.
- It logs a detailed validation error at `ERROR` level including all missing or invalid fields.
- The job is **not retried** (preventing infinite retry loops and worker CPU starvation).
- The job status is permanently failed or moved to Dead-Letter.

---

## 4. Backpressure & Concurrency Tuning

Queue saturation can degrade database connection pools and external provider rate limits. SAAR implements explicit backpressure controls:

1. **Fixed Worker Concurrency**:
   Workers instantiate fixed-size worker pools. For example, `saar:notifications` runs at concurrency 10, preventing sudden spikes (e.g. 50,000 push notifications at 08:00 AM) from overwhelming the Apple Push Notification service (APNS) or Firebase Cloud Messaging (FCM).
2. **Batch Window Limits**:
   The `OutboxPublisherService` claims at most 50 events per cycle. If queue lag increases, multiple worker replicas dynamically scale and process independent 50-item batches via `SKIP LOCKED` without increasing database lock contention.
3. **Timezone-Staggered Scheduling**:
   Daily growth plans and morning routine occurrences are generated on an hourly cron based on each user's local timezone (e.g., at 04:00 AM local time). Instead of generating all global users' plans at 00:00 UTC, the workload is distributed evenly across 24 distinct hourly execution windows.
