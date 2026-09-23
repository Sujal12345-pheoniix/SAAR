# ADR-010: Production Deployment & Rollback

| Field       | Value                                     |
|-------------|-------------------------------------------|
| **Status**  | Accepted                                  |
| **Date**    | 2026-09-23                                |
| **Authors** | SAAR Core Team                            |
| **Deciders**| Engineering Lead                          |

---

## Context

SAAR's production database contains sensitive personal data — goal histories, mood
logs, AI memories. A failed deployment that corrupts data or applies an irreversible
migration is a high-severity incident.

The deployment and rollback strategy must satisfy:

1. **Safety first**: a bad deploy must not silently corrupt the database.
2. **Speed**: deploys should complete in under 10 minutes end-to-end.
3. **Reversibility**: any deploy should be rollback-able within 5 minutes.
4. **Auditability**: who deployed what, when, and what was the outcome.
5. **Appropriate for team size**: a solo/small team cannot operate complex
   infrastructure like blue-green Kubernetes clusters in Phase 1.

---

## Decision

**GitHub Actions with a manual approval gate for production. DB migrations run as
a controlled, isolated step before code deployment. Rollback plan: re-deploy the
previous Docker image tag + apply down migration (backward-compatible changes only).**

### Deployment Process

```
┌─────────────────────────────────────────────────────────────────┐
│  Production Deploy Flow                                           │
│                                                                   │
│  1. Engineer triggers workflow_dispatch on GitHub                 │
│     → Provides: git_ref, confirm="DEPLOY"                        │
│                                                                   │
│  2. Confirmation token validated ("DEPLOY" required)             │
│                                                                   │
│  3. GitHub Environment "production" approval gate                 │
│     → Required reviewer(s) approve in GitHub UI                  │
│     → Timeout: 1 hour (auto-cancel if no approval)               │
│                                                                   │
│  4. Build step                                                    │
│     → pnpm install --frozen-lockfile                              │
│     → pnpm build                                                  │
│     → Upload artefact (retained 14 days for rollback)            │
│                                                                   │
│  5. Migration dry-run                                             │
│     → prisma migrate status (shows pending migrations)           │
│     → Engineer reviews output in workflow log before proceeding  │
│                                                                   │
│  6. Apply migrations                                              │
│     → prisma migrate deploy (apply pending only, no reset)       │
│     → Idempotent: safe to re-run if step fails partway           │
│                                                                   │
│  7. Deploy application                                            │
│     → Deploy new Docker image / serverless function              │
│     → Health check: poll GET /ready until 200 (timeout 5 min)   │
│                                                                   │
│  8. Post-deploy verification                                      │
│     → Smoke test: GET /health, GET /api/v1/meta                  │
│     → Check Grafana dashboard: no 5xx spike                      │
│     → Monitor for 5 minutes before declaring success             │
└─────────────────────────────────────────────────────────────────┘
```

### Migration Rules

All migrations MUST follow these rules to ensure rollback is possible:

| Rule                                         | Rationale                                          |
|----------------------------------------------|----------------------------------------------------|
| **New columns are nullable or have defaults**| Old code running during migration won't break       |
| **No column renames** (add new, deprecate old)| Old code still reads old column name               |
| **No column type changes without a copy step**| Type change can lose data                          |
| **No NOT NULL added without backfill first** | Inserts from old code would fail                   |
| **Index creation is CONCURRENT**             | Avoids table lock in production                    |
| **No data migrations in schema migrations**  | Data migrations run as separate, versioned scripts |
| **Each migration is a single concern**       | Easier to identify failure point                   |

```sql
-- GOOD: adding a nullable column
ALTER TABLE tasks ADD COLUMN completed_note TEXT;

-- GOOD: index created concurrently (no lock)
CREATE INDEX CONCURRENTLY idx_tasks_user_status ON tasks(user_id, status);

-- BAD: NOT NULL without default on existing table
ALTER TABLE tasks ADD COLUMN priority INT NOT NULL; -- breaks old rows

-- GOOD: safe equivalent
ALTER TABLE tasks ADD COLUMN priority INT;
UPDATE tasks SET priority = 1 WHERE priority IS NULL;
ALTER TABLE tasks ALTER COLUMN priority SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 1;
```

### Rollback Plan

Rollback is a two-step process:

**Step 1: Revert application code**
```bash
# Re-trigger deploy-production.yml with the previous stable git tag
# OR: manually deploy previous Docker image tag
docker pull ghcr.io/org/saar-api:v1.2.3  # previous stable
docker tag ghcr.io/org/saar-api:v1.2.3 ghcr.io/org/saar-api:latest
# Deploy previous image
```

**Step 2: Revert migration (if schema change was the cause)**

Down migrations are written alongside every up migration:

```
prisma/migrations/
  20260923_001_add_tasks_completed_note/
    migration.sql           # up migration
    down.sql               # manual down migration
    README.md              # describes what changed and how to reverse
```

```sql
-- down.sql example
ALTER TABLE tasks DROP COLUMN IF EXISTS completed_note;
```

Down migrations are **not** run automatically — they require a deliberate engineer
decision and manual execution:

```bash
# Rollback specific migration (manual, not automated)
psql $PROD_DATABASE_URL -f prisma/migrations/20260923_001_add_tasks_completed_note/down.sql
```

### Environment & Secret Management

| Secret                   | Storage              | Rotation           |
|--------------------------|----------------------|--------------------|
| `DATABASE_URL`           | GitHub Environments  | On compromise       |
| `REDIS_URL`              | GitHub Environments  | On compromise       |
| `JWT_SECRET`             | GitHub Environments  | Quarterly           |
| `JWT_REFRESH_SECRET`     | GitHub Environments  | Quarterly           |
| `AI_API_KEY`             | GitHub Environments  | Quarterly           |
| `PROD_DEPLOY_API_KEY`    | GitHub Environments  | On rotate           |

Production secrets are **only** available in the `production` GitHub Environment —
not in PRs or non-main branches.

### Canary / Feature Flags (Phase 2)

Phase 1 does not implement canary deployments (too much operational overhead for a
solo team). Phase 2 will introduce:
- Feature flags (LaunchDarkly or in-house via Redis)
- Canary traffic splitting (10% → 50% → 100%)
- Automatic rollback on SLO breach

---

## Consequences

### Positive
- **Manual approval gate** prevents accidental or unauthorized production deploys.
- **Migration-before-code** order ensures the new schema is in place before new code runs.
- **Migration rules** make rollback mechanically possible.
- **Artefact retention** (14 days) means re-deploying a previous version is fast.

### Negative / Risks
- **Slower deploys**: manual approval adds human latency.
  **Mitigation**: acceptable trade-off for Phase 1 safety; Phase 2 automates more.
- **No true blue-green**: brief downtime possible during pod restart.
  **Mitigation**: rolling restart with health checks minimizes window.
- **Down migrations are manual**: requires disciplined engineering.
  **Mitigation**: PR template requires a `down.sql` for every migration PR.

---

## References

- [Prisma Migrate Deploy](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-deploy)
- [GitHub Environments — Required Reviewers](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments)
- [Evolutionary Database Design — Fowler & Sadalage](https://martinfowler.com/articles/evodb.html)
- [Parallel Change Pattern](https://martinfowler.com/bliki/ParallelChange.html)
