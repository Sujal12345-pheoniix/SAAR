# SAAR Incident Response Runbook

## 1. Severity Classifications

| Severity | Definition | Target Triage Time | Target Resolution | Example Scenarios |
|----------|------------|-------------------|-------------------|-------------------|
| **SEV-1 (Critical)** | Core service down, data corruption, active security breach | < 15 minutes | < 2 hours | Complete API outage, DB unreachable, auth bypass, refresh token leak |
| **SEV-2 (High)** | Degradation of critical feature, high error rates | < 30 minutes | < 4 hours | Rate limiter failing open, 5xx on auth refresh, background workers halted |
| **SEV-3 (Medium)** | Minor feature impaired, workarounds available | < 2 hours | < 24 hours | UI glitch on analytics cards, non-critical cron delayed |
| **SEV-4 (Low)** | Trivial issue, cosmetic bugs, documentation discrepancy | < 24 hours | Next sprint | Typo in error message, minor styling alignment |

## 2. Standard Incident Lifecycle

```
[Detection / Alert]
        │
        ▼
   [Triage & SEV Assignment]
        │
        ▼
   [Containment & Mitigation] (Rollback, failover, rate-limit clamping)
        │
        ▼
   [Root Cause Analysis (RCA)]
        │
        ▼
   [Resolution & Post-Mortem]
```

## 3. Incident Action Steps

### Step 1: Establish Incident Commander (IC)
- Assign single IC who coordinates communications.
- Open dedicated incident channel `#incidents-<YYYYMMDD>-<name>`.

### Step 2: Immediate Containment Options
1. **Database Degradation / Deadlocks**:
   - Check active queries: `SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state != 'idle';`
   - Terminate hanging queries: `SELECT pg_terminate_backend(<pid>);`
2. **Token Compromise / Revocation**:
   - Invalidate user session: `DELETE FROM "Session" WHERE "userId" = '<user_id>';`
   - Rotate JWT signing secret in environment variables and restart API pods.
3. **Application Regression**:
   - Execute instant rollback to previous container image tag (see `ROLLBACK.md`).

### Step 3: Post-Mortem & Blameless RCA
- Conducted within 48 hours for all SEV-1 and SEV-2 incidents.
- Template includes: Timeline, Root Cause, Contributing Factors, Action Items with Assignees.
