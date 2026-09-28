# SAAR Queue & Worker Failure Modes & Recovery Runbook

## 1. Failure Taxonomy & Impact Matrix

| Failure Mode | Severity | Impact | Automatic Mitigation | Operator Action Required |
|---|---|---|---|---|
| **Redis Broker Unreachable** | CRITICAL | Asynchronous queues pause; new jobs cannot be pushed | Exponential retry backoff on reconnection | Verify Redis container/cluster status, network security groups |
| **PostgreSQL Outbox Spike** | HIGH | `PENDING` outbox count accumulates | Outbox publisher continues batching 50 rows/cycle | Scale up worker replica count horizontally |
| **Worker Process Crash (OOM / SIGKILL)** | MEDIUM | In-flight job abruptly aborted | Row lock automatically released by PostgreSQL; job reclaimed | Inspect container memory limits, analyze heap dump |
| **Poison Pill Job (Malformed Schema)** | LOW | Single job fails Zod validation | Rejection without retry, payload logged at `ERROR` level | Fix upstream producer bug; purge bad job |
| **Dead-Letter Accumulation** | HIGH | Failed outbox events reach max attempts (5) | Events moved to `DEAD_LETTER` to prevent pipeline blocking | Review error logs, fix root cause, trigger replay |

---

## 2. Failure Recovery Runbooks

### Runbook A: Redis Disconnection & Reconnection
**Symptoms**:
- Logs output: `[WorkerBootstrap] ERROR: Failed to connect to Redis broker at redis://...`
- HTTP API can still commit transactions (because Outbox is in PostgreSQL), but queue processing stops.

**Resolution Steps**:
1. Check Redis health:
   ```bash
   redis-cli -u $REDIS_URL ping
   # Expected output: PONG
   ```
2. Verify Redis memory usage:
   ```bash
   redis-cli -u $REDIS_URL info memory
   ```
   If `used_memory` approaches `maxmemory`, inspect Redis eviction policy (`maxmemory-policy noeviction` vs `volatile-lru`).
3. Once Redis is reachable, the worker connection pools automatically reconnect. Verify that `saar:outbox` starts draining pending rows.

---

### Runbook B: Handling Poison Pill Jobs
**Symptoms**:
- Worker logs repeatedly display:
  `[NotificationWorkerService] ERROR Rejecting invalid notification job payload: [...]`

**Diagnosis**:
1. Identify the offending job ID and originating event from the log metadata.
2. Verify which field failed Zod schema parsing (e.g. invalid UUID, missing `scheduledAt`).

**Resolution**:
- Because SAAR workers validate with Zod and **abort retrying on schema validation failure**, poison pills do not trigger infinite retry loops.
- File a bug against the API endpoint or producer service that wrote the invalid payload.

---

### Runbook C: Dead-Letter Queue (DLQ) Inspection & Replay
**Symptoms**:
- Querying `outbox_events` reveals rows with `status = 'DEAD_LETTER'`:
  ```sql
  SELECT count(*) FROM "outbox_events" WHERE "status" = 'DEAD_LETTER';
  ```

**Inspection**:
To examine the root cause of dead-lettered events:
```sql
SELECT "id", "eventType", "attempts", "payload"->>'lastError' AS last_error, "payload"->>'failedAt' AS failed_at
FROM "outbox_events"
WHERE "status" = 'DEAD_LETTER'
ORDER BY "createdAt" DESC
LIMIT 20;
```

**Replay Procedure**:
Once the underlying infrastructure issue (e.g. third-party API outage) is resolved, replay the events by resetting their status to `PENDING` and resetting `attempts`:
```sql
UPDATE "outbox_events"
SET "status" = 'PENDING',
    "attempts" = 0,
    "availableAt" = NOW()
WHERE "status" = 'DEAD_LETTER'
  AND "eventType" = 'task.completed'; -- Or specific event subset
```
The `OutboxPublisherService` will automatically pick up the replayed rows in its next polling cycle.
