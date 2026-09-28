# SAAR Worker Operations & Lifecycle Management Runbook

## 1. Architecture Overview
The SAAR Worker service (`@saar/worker`) is a standalone Node.js background process responsible for:
- Polling the PostgreSQL `outbox_events` table and dispatching events.
- Consuming BullMQ / Redis queues for notifications, daily plan generation, routine occurrences, and data maintenance.
- Executing long-running tasks asynchronously away from the user-facing HTTP request path.

---

## 2. Process Bootstrap & Environment Variables

The worker process is bootstrapped via `apps/worker/src/main.ts` using the command:
```bash
pnpm --filter @saar/worker start
```

### Required Environment Configuration
| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/saar?schema=public` |
| `REDIS_URL` | Redis instance connection string | `redis://localhost:6379` |
| `NODE_ENV` | Environment stage | `production` / `staging` / `development` |
| `LOG_LEVEL` | Pino logging threshold | `info` / `debug` / `warn` / `error` |

---

## 3. Graceful Shutdown & Lifecycle Management

To prevent data corruption, in-flight job aborts, or orphaned database locks during deployments and auto-scaling events, `@saar/worker` implements deterministic signal handling:

### 3.1 Signal Handling Protocol
```typescript
const shutdown = async (signal: string) => {
  logger.log(`Received ${signal}. Initiating graceful shutdown...`);
  // 1. Stop polling loops from claiming new outbox rows
  // 2. Pause queue listeners
  // 3. Allow in-flight jobs up to 10 seconds to finish
  // 4. Close Prisma database connections
  // 5. Disconnect Redis clients
  // 6. Terminate process cleanly (exit code 0)
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
```

### 3.2 Kubernetes / Container Orchestrator Configuration
When deploying in containerized environments:
- Set `terminationGracePeriodSeconds: 30` to give workers sufficient time to flush in-flight jobs.
- The readiness probe should verify connectivity to PostgreSQL and Redis.

---

## 4. Scaling Guidelines & Sizing

Workers are horizontally scalable and stateless with respect to local memory:
1. **Outbox Poller Scaling**:
   Because `OutboxPublisherService` uses `SELECT FOR UPDATE SKIP LOCKED`, 2 to 10 worker pods can run simultaneously without query collisions or row contention.
2. **CPU & Memory Profiling**:
   - Baseline memory per worker container: ~150MB - 250MB.
   - CPU requirement: 0.25 - 0.5 vCPU under standard loads (< 500 events/sec).
3. **Queue Concurrency Tuning**:
   Queue concurrency settings are configured centrally in `apps/worker/src/queues/queue.constants.ts`. If backpressure builds up, scale horizontally (more worker replicas) rather than setting excessively high single-process concurrency, which risks exhausting the database connection pool.

---

## 5. Metrics & Health Telemetry

Key indicators to monitor in Datadog, Prometheus, or Grafana:
- **`outbox_pending_count`**: Number of rows in `outbox_events` with `status = 'PENDING'`. A sustained value > 500 indicates worker lag.
- **`outbox_dead_letter_count`**: Number of rows with `status = 'DEAD_LETTER'`. Any non-zero count requires SRE alert.
- **`queue_depth`**: Number of waiting jobs in BullMQ queues (`saar:notifications`, `saar:daily-growth`, etc.).
- **`worker_job_duration_ms`**: Latency distribution of job execution (p50, p95, p99). Target: p95 < 250ms for notifications, p95 < 500ms for daily plan generation.
